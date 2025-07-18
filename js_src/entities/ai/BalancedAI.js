import { BaseAI } from "./BaseAI.js";

export class BalancedAI extends BaseAI {
  constructor(entity, config = {}) {
    super(entity, {
      detectionRange: 8,
      chaseDistance: 8,
      wanderDirections: [
        [-1, 0], [0, -1], [0, 1], [1, 0]
      ],
      ...config
    });
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

    // Check if monster is adjacent to player and deal damage
    this.checkAdjacencyAndDamage();

    const startX = parseInt(this.entity.getX());
    const startY = parseInt(this.entity.getY());

    // Use different strategies based on distance and line of sight
    if (distance <= this.config.chaseDistance) {
      // Within chase distance - try to be smart but fall back to random
      if (this.hasLineOfSight()) {
        // Can see player - try direct movement
        if (!this.moveDirectlyToPlayer()) {
          this.moveRandomly();
        }
      } else {
        // Can't see player - try to move toward player with obstacle avoidance
        if (!this.moveAroundObstacles("balanced")) {
          this.moveRandomly();
        }
      }
    } else {
      // Far from player, move randomly but still toward player
      this.moveRandomly();
    }
    
    // If we couldn't move at all, we're completely trapped
    if (this.entity.getX() === startX && this.entity.getY() === startY) {
      // Monster is trapped
    }
  }
} 