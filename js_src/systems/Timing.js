import { Scheduler } from "rot-js";
import { DATASTORE } from "../core/DataStore.js";

const SCHEDULER = new Scheduler.Action();

// Unified turn-based game engine
class GameEngine {
  constructor(scheduler) {
    this.scheduler = scheduler;
    this.isRunning = false;
    this.processInterval = null;
    this.turnDuration = 70; // Slightly faster movement
    this.playerTurnTaken = false;
    this.monsterTurnsProcessed = 0;
    this.totalMonsters = 0;
    this.turnCooldown = 0; // Prevent rapid turns
    this.monsterTurnDelay = 150; // Slightly faster monsters
    this.lastMonsterTurnTime = 0; // Track when monsters last moved
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    
    // Count total monsters for turn management
    this.countMonsters();
    
    // Start unified turn system
    this.processInterval = setInterval(() => {
      this.processUnifiedTurn();
    }, this.turnDuration);
  }

  stop() {
    this.isRunning = false;
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
    }
  }

  countMonsters() {
    this.totalMonsters = 0;
    const entities = Object.values(DATASTORE.ENTITIES);
    for (const entity of entities) {
      if (entity.role === "monster") {
        this.totalMonsters++;
      }
    }
  }

  // Call this when monsters are added/removed
  updateMonsterCount() {
    this.countMonsters();
  }

  // Unified turn system: Player turn → All monsters turn → Repeat
  processUnifiedTurn() {
    if (!this.isRunning) return;

    try {
      // Check turn cooldown
      const now = Date.now();
      if (now - this.turnCooldown < this.turnDuration) {
        return;
      }

      // If player hasn't taken their turn yet, give them priority
      if (!this.playerTurnTaken) {
        return;
      }

      // Add extra delay for monster turns to make them slower
      if (now - this.lastMonsterTurnTime < this.monsterTurnDelay) {
        return;
      }

      // Player has taken their turn, now process ALL monster turns
      let monstersProcessed = 0;
      while (monstersProcessed < this.totalMonsters) {
        const entity = this.scheduler.next();
        if (entity && entity.act && entity.role === "monster") {
          entity.act();
          monstersProcessed++;
        }
      }
      
      // Reset for next turn
      this.resetTurn();
      this.turnCooldown = now;
      this.lastMonsterTurnTime = now;
      
    } catch (error) {
      console.error("Error processing turn:", error);
    }
  }

  // Called when player takes a turn
  playerTookTurn() {
    this.playerTurnTaken = true;
  }

  // Reset turn state for next cycle
  resetTurn() {
    this.playerTurnTaken = false;
    this.monsterTurnsProcessed = 0;
    this.monsterTurnIndex = 0; // Reset monster turn index
  }

  // Legacy method for compatibility
  processPlayerTurn() {
    this.playerTookTurn();
  }
}

const TIME_ENGINE = new GameEngine(SCHEDULER);

export { SCHEDULER, TIME_ENGINE }; 