import { Path } from "rot-js";
import { DATASTORE } from "../../core/DataStore.js";

// Helper function to safely render the game
function safeGameRender() {
  if (
    typeof DATASTORE.GAME?.render === "function" &&
    DATASTORE.GAME.curMode && 
    DATASTORE.GAME.display?.main?.o
  ) {
    DATASTORE.GAME.render();
  }
}

export class BaseAI {
  constructor(entity, config = {}) {
    this.entity = entity;
    this.config = {
      detectionRange: 10,
      chaseDistance: 8,
      wanderDirections: [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
      ],
      ...config
    };
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
    
    if (distance <= this.config.detectionRange) {
      this.chasePlayer();
    } else {
      this.wander();
    }
  }

  getDistanceToPlayer() {
    const player = this.getPlayer();
    if (!player) return Infinity;

    const dx = player.getX() - this.entity.getX();
    const dy = player.getY() - this.entity.getY();
    return Math.sqrt(dx * dx + dy * dy);
  }

  getPlayer() {
    const map = this.entity.getMap();
    if (!map) return null;
    
    const entities = Object.values(DATASTORE.ENTITIES);
    return entities.find(
      (e) => e.name === "avatar" && e.getMapId() === this.entity.getMapId()
    );
  }

  hasLineOfSight() {
    const map = this.entity.getMap();
    if (!map) return false;
    
    const player = this.getPlayer();
    if (!player) return false;

    const startX = parseInt(this.entity.getX());
    const startY = parseInt(this.entity.getY());
    const endX = parseInt(player.getX());
    const endY = parseInt(player.getY());

    // Simple line of sight check - if there are no walls between monster and player
    const dx = Math.abs(endX - startX);
    const dy = Math.abs(endY - startY);
    const sx = startX < endX ? 1 : -1;
    const sy = startY < endY ? 1 : -1;
    let err = dx - dy;

    let x = startX;
    let y = startY;

    while (x !== endX || y !== endY) {
      // Check if current tile blocks line of sight
      const tile = map.getTile(x, y);
      if (!tile.isA("floor")) {
        return false;
      }

      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }
    return true;
  }

  isAdjacentToPlayer() {
    const player = this.getPlayer();
    if (!player) return false;
    
    const monsterX = parseInt(this.entity.getX());
    const monsterY = parseInt(this.entity.getY());
    const playerX = parseInt(player.getX());
    const playerY = parseInt(player.getY());
    
    // Check if monster is adjacent to player (including diagonals)
    const dx = Math.abs(monsterX - playerX);
    const dy = Math.abs(monsterY - playerY);
    
    return dx <= 1 && dy <= 1 && (dx > 0 || dy > 0);
  }

  checkAdjacencyAndDamage() {
    if (this.isAdjacentToPlayer()) {
      const player = this.getPlayer();
      this.entity.raiseMixinEvent("attacks", { src: this.entity, target: player });
      player.raiseMixinEvent("damaged", {
        src: this.entity,
        damageAmount: this.entity.getMeleeDamage(),
      });
    }
  }

  canMoveDiagonally(fromX, fromY, toX, toY) {
    const map = this.entity.getMap();
    if (!map) return false;
    
    // Check if diagonal move is allowed (prevent squeezing through walls)
    if (Math.abs(toX - fromX) === 1 && Math.abs(toY - fromY) === 1) {
      const tile1 = map.getTile(toX, fromY);
      const tile2 = map.getTile(fromX, toY);
      const ent1 = map.getTargetPositionInfo(toX, fromY).entity;
      const ent2 = map.getTargetPositionInfo(fromX, toY).entity;
      return tile1.isA("floor") && !ent1 && tile2.isA("floor") && !ent2;
    }
    return true;
  }

  isPositionWalkable(x, y) {
    const map = this.entity.getMap();
    if (!map) return false;
    
    const tile = map.getTile(x, y);
    const ent = map.getTargetPositionInfo(x, y).entity;
    const player = this.getPlayer();
    
    // Allow floor tiles with no entity (or the player itself)
    return tile.isA("floor") && (!ent || ent === player);
  }

  moveToPosition(x, y) {
    const map = this.entity.getMap();
    if (!map) {
      return false;
    }
    
    const startX = parseInt(this.entity.getX());
    const startY = parseInt(this.entity.getY());
    
    if (!this.canMoveDiagonally(startX, startY, x, y)) {
      return false;
    }
    
    if (this.isPositionWalkable(x, y)) {
      // Use the same movement system as the player for consistency
      const dx = x - startX;
      const dy = y - startY;
      
      if (this.entity.tryWalk && this.entity.tryWalk(dx, dy)) {
        return true;
      }
    }
    
    return false;
  }

  moveDirectlyToPlayer() {
    const player = this.getPlayer();
    if (!player) return false;
    
    const startX = parseInt(this.entity.getX());
    const startY = parseInt(this.entity.getY());
    const endX = parseInt(player.getX());
    const endY = parseInt(player.getY());

    // Calculate direction to player
    const dx = Math.sign(endX - startX);
    const dy = Math.sign(endY - startY);

    // Try different movement options in order of preference
    const moves = [
      [dx, dy], // Direct diagonal movement
      [dx, 0], // Horizontal movement only
      [0, dy], // Vertical movement only
      [dx, -dy], // Alternative diagonal
      [-dx, dy], // Alternative diagonal
      [1, 0], [0, 1], [-1, 0], [0, -1], // Any direction if all else fails
    ];

    for (const [moveX, moveY] of moves) {
      const newX = startX + moveX;
      const newY = startY + moveY;
      
      if (this.moveToPosition(newX, newY)) {
        return true;
      }
    }
    
    return false;
  }

  moveWithPathfinding() {
    const map = this.entity.getMap();
    if (!map) return false;
    
    const player = this.getPlayer();
    if (!player) return false;
    
    // const startX = parseInt(this.entity.getX());
    // const startY = parseInt(this.entity.getY());
    // const endX = parseInt(player.getX());
    // const endY = parseInt(player.getY());

    // // Use ROT.js A* pathfinding
    // const passableCallback = (x, y) => {
    //   return this.isPositionWalkable(x, y);
    // };

    // const path = [];
    // const astar = new Path.AStar(endX, endY, passableCallback, {
    //   topology: 8, // Allow diagonal movement
    // });
    // astar.compute(startX, startY, (x, y) => {
    //   path.push([x, y]);
    // });
    // DISABLED: A* pathfinding is too expensive
    // Use simple movement instead
    return this.moveDirectlyToPlayer();
  }

  findPathTowardPlayer() {
    // DISABLED: A* pathfinding is too expensive
    // Use simple movement instead
    return this.moveDirectlyToPlayer();
  }

  moveSmartRandomly() {
    const startX = parseInt(this.entity.getX());
    const startY = parseInt(this.entity.getY());
    
    const player = this.getPlayer();
    let directions;
    
    if (player) {
      const playerX = parseInt(player.getX());
      const playerY = parseInt(player.getY());
      
      // Calculate direction to player
      const dx = Math.sign(playerX - startX);
      const dy = Math.sign(playerY - startY);
      
      // Prioritize directions that get us closer to the player
      directions = [
        [dx, dy], // Direct toward player
        [dx, 0], // Horizontal toward player
        [0, dy], // Vertical toward player
        [dx, -dy], // Alternative diagonal
        [-dx, dy], // Alternative diagonal
        [1, 0], [0, 1], [-1, 0], [0, -1], // Orthogonal
        [1, 1], [1, -1], [-1, 1], [-1, -1], // Diagonal
      ];
    } else {
      directions = this.config.wanderDirections;
    }
    
    // Try each direction until we find a valid move
    for (const [moveX, moveY] of directions) {
      const newX = startX + moveX;
      const newY = startY + moveY;
      
      if (this.moveToPosition(newX, newY)) {
        return true;
      }
    }
    
    return false;
  }

  moveRandomly() {
    const player = this.getPlayer();
    if (player && Math.random() < 0.3) { // 30% chance to move toward player
      const playerX = parseInt(player.getX());
      const playerY = parseInt(player.getY());
      const startX = parseInt(this.entity.getX());
      const startY = parseInt(this.entity.getY());
      
      const dx = Math.sign(playerX - startX);
      const dy = Math.sign(playerY - startY);
      
      // Sometimes move toward player, sometimes random
      const directions = [
        [dx, dy], // Toward player
        [dx, 0], [0, dy], // Orthogonal toward player
        [1, 0], [0, 1], [-1, 0], [0, -1], // Orthogonal random
        [1, 1], [1, -1], [-1, 1], [-1, -1], // Diagonal random
      ];
      
      // Shuffle directions for randomness
      for (let i = directions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [directions[i], directions[j]] = [directions[j], directions[i]];
      }
      
      for (const [moveX, moveY] of directions) {
        const newX = startX + moveX;
        const newY = startY + moveY;
        
        if (this.moveToPosition(newX, newY)) {
          return true;
        }
      }
    } else {
      // Mostly random movement
      const directions = [
        [1, 0], [0, 1], [-1, 0], [0, -1], // Orthogonal
        [1, 1], [1, -1], [-1, 1], [-1, -1], // Diagonal
      ];
      
      // Shuffle directions for randomness
      for (let i = directions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [directions[i], directions[j]] = [directions[j], directions[i]];
      }
      
      const startX = parseInt(this.entity.getX());
      const startY = parseInt(this.entity.getY());
      
      for (const [moveX, moveY] of directions) {
        const newX = startX + moveX;
        const newY = startY + moveY;
        
        if (this.moveToPosition(newX, newY)) {
          return true;
        }
      }
    }
    
    return false;
  }

  chasePlayer() {
    // Check if monster is adjacent to player and deal damage
    this.checkAdjacencyAndDamage();

    // Use simple, efficient movement only
    this.moveDirectlyToPlayer();
  }

  // Common obstacle avoidance method for all AI types
  moveAroundObstacles(strategy = "smart") {
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
    
    switch (strategy) {
      case "smart":
        // SmartAI strategy: try perpendicular directions for better pathfinding
        moves = [
          [dx, dy], // Direct toward player
          [dx, 0], [0, dy], // Orthogonal toward player
          [dy, dx], [-dy, -dx], // Perpendicular directions (around obstacles)
          [1, 0], [0, 1], [-1, 0], [0, -1], // Any direction
          [1, 1], [1, -1], [-1, 1], [-1, -1], // Diagonal
        ];
        break;
        
      case "balanced":
        // BalancedAI strategy: simpler but effective
        moves = [
          [dx, dy], // Direct toward player
          [dx, 0], [0, dy], // Orthogonal toward player
          [1, 0], [0, 1], [-1, 0], [0, -1], // Any direction
        ];
        break;
        
      case "simple":
        // SimpleAI strategy: basic obstacle avoidance
        moves = [
          [dx, 0], [0, dy], // Orthogonal toward player
          [dx, dy], // Direct toward player
          [1, 0], [0, 1], [-1, 0], [0, -1], // Any direction
        ];
        break;
        
      default:
        moves = [[dx, dy], [dx, 0], [0, dy]];
    }
    
    for (const [moveX, moveY] of moves) {
      const newX = startX + moveX;
      const newY = startY + moveY;
      
      if (this.moveToPosition(newX, newY)) {
        return true;
      }
    }
    
    // If all else fails, move randomly
    return this.moveRandomly();
  }

  wander() {
    const player = this.getPlayer();
    if (player) {
      // 30% chance to move towards player even when wandering
      if (Math.random() < 0.3) {
        const dx = Math.sign(player.state.x - this.entity.state.x);
        const dy = Math.sign(player.state.y - this.entity.state.y);
        this.moveToPosition(this.entity.getX() + dx, this.entity.getY() + dy);
        return;
      }
    }
    
    const randomDir = this.config.wanderDirections[
      Math.floor(Math.random() * this.config.wanderDirections.length)
    ];
    this.moveToPosition(
      this.entity.getX() + randomDir[0], 
      this.entity.getY() + randomDir[1]
    );
  }


} 