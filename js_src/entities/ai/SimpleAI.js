import { BaseAI } from "./BaseAI.js";

export class SimpleAI extends BaseAI {
  constructor(entity, config = {}) {
    super(entity, {
      detectionRange: 4, // Increased from 2 to make them more aware
      chaseDistance: 4, // Increased from 2
      wanderDirections: [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
      ], // Allow diagonal movement for more interesting patterns
      ...config
    });
  }

  act() {
    // Check if monster is adjacent to player and deal damage
    this.checkAdjacencyAndDamage();
    
    const player = this.getPlayer();
    const distance = this.getDistanceToPlayer();
    
    // Simple AI with improved behavior and obstacle handling
    if (player && distance <= this.config.detectionRange) {
      // Within detection range - 60% chance to move toward player, 40% random
      if (Math.random() < 0.6) {
        if (this.hasLineOfSight()) {
          // Can see player - move directly
          this.moveDirectlyToPlayer();
        } else {
          // Can't see player - try simple obstacle avoidance
          this.moveAroundObstacles("simple");
        }
      } else {
        this.moveRandomly();
      }
    } else {
      // Outside detection range - use smart random movement
      this.moveSmartRandomly();
    }
  }
} 