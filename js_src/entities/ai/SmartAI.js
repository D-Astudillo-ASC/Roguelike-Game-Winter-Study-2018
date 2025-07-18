import { BaseAI } from "./BaseAI.js";

export class SmartAI extends BaseAI {
  constructor(entity, config = {}) {
    super(entity, {
      detectionRange: 19, // Reduced from 20 to be less aggressive
      chaseDistance: 17, // Reduced from 30 to be less aggressive
      wanderDirections: [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
      ],
      ...config
    });
    
    // Add memory to prevent getting stuck
    this.lastPositions = [];
    this.stuckCounter = 0;
    this.lastMoveDirection = null;
  }

  act() {
    const player = this.getPlayer();
    if (!player) {
      this.wander();
      return;
    }

    const map = this.entity.getMap();
    if (!map) {
      return;
    }

    const distance = this.getDistanceToPlayer();
    const currentPos = [this.entity.getX(), this.entity.getY()];
    
    // Check if we're stuck (repeating positions)
    this.updateStuckDetection(currentPos);
    
    // SmartAI behavior with improved obstacle handling
    if (distance > 1) { // If not adjacent, try to chase
      if (this.hasLineOfSight()) {
        // Can see player directly - chase normally
        this.chasePlayer();
      } else {
        // Can't see player - use smart obstacle avoidance with stuck prevention
        this.moveAroundObstaclesSmart();
      }
    } else {
      // If adjacent, attack
      this.checkAdjacencyAndDamage();
    }
  }

  updateStuckDetection(currentPos) {
    // Keep track of last 5 positions
    this.lastPositions.push(currentPos);
    if (this.lastPositions.length > 5) {
      this.lastPositions.shift();
    }
    
    // Check if we're stuck (same position repeated)
    const uniquePositions = new Set(this.lastPositions.map(p => `${p[0]},${p[1]}`));
    if (uniquePositions.size <= 2 && this.lastPositions.length >= 3) {
      this.stuckCounter++;
    } else {
      this.stuckCounter = 0;
    }
  }

  moveAroundObstaclesSmart() {
    const player = this.getPlayer();
    if (!player) return false;
    
    const startX = parseInt(this.entity.getX());
    const startY = parseInt(this.entity.getY());
    const playerX = parseInt(player.getX());
    const playerY = parseInt(player.getY());
    
    // Calculate direction to player
    const dx = Math.sign(playerX - startX);
    const dy = Math.sign(playerY - startY);
    
    let moves;
    
    // If we're stuck, try different strategies
    if (this.stuckCounter > 2) {
      // We're stuck - try random movement to break out
      moves = [
        [1, 0], [0, 1], [-1, 0], [0, -1], // Orthogonal
        [1, 1], [1, -1], [-1, 1], [-1, -1], // Diagonal
        [dx, dy], [dx, 0], [0, dy], // Still try toward player
      ];
      this.stuckCounter = 0; // Reset stuck counter
    } else {
      // Normal smart movement
      moves = [
        [dx, dy], // Direct toward player
        [dx, 0], [0, dy], // Orthogonal toward player
        [dy, dx], [-dy, -dx], // Perpendicular directions (around obstacles)
        [1, 0], [0, 1], [-1, 0], [0, -1], // Any direction
        [1, 1], [1, -1], [-1, 1], [-1, -1], // Diagonal
      ];
    }
    
    // Shuffle moves to add randomness and prevent predictable patterns
    for (let i = moves.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [moves[i], moves[j]] = [moves[j], moves[i]];
    }
    
    for (const [moveX, moveY] of moves) {
      const newX = startX + moveX;
      const newY = startY + moveY;
      
      if (this.moveToPosition(newX, newY)) {
        this.lastMoveDirection = [moveX, moveY];
        return true;
      }
    }
    
    // If all else fails, move randomly
    return this.moveRandomly();
  }
} 