// Advanced mixins with dependencies
// These mixins import DATASTORE, Message, SCHEDULER, etc.

import { DATASTORE } from "../../core/DataStore.js";
import { SmartAI, BalancedAI, SimpleAI } from "../ai/index.js";

// Helper function to safely render the game
// function safeGameRender() {
//   if (
//     typeof DATASTORE.GAME?.render === "function" &&
//     DATASTORE.GAME.curMode && 
//     DATASTORE.GAME.display?.main?.o
//   ) {
//     DATASTORE.GAME.render();
//   }
// }

export const WalkerCorporeal = {
  META: {
    mixInName: "WalkerCorporeal",
    mixInGroupName: "Walker",
  },
  METHODS: {
    tryWalk: function (dx, dy) {
      const newX = this.state.x * 1 + dx * 1;
      const newY = this.state.y * 1 + dy * 1;

      // Check if entity has a valid map reference
      const map = this.getMap();
      if (!map) {
        console.warn(
          `Entity ${this.name} cannot walk - no valid map reference`,
        );
        return false;
      }

      // Check for diagonal wall squeezing
      if (Math.abs(dx) === 1 && Math.abs(dy) === 1) {
        const tile1 = map.getTile(newX, this.state.y);
        const tile2 = map.getTile(this.state.x, newY);
        const ent1 = map.getTargetPositionInfo(newX, this.state.y).entity;
        const ent2 = map.getTargetPositionInfo(this.state.x, newY).entity;
        
        // If either adjacent tile is a wall or has an entity, prevent diagonal movement
        if (tile1.isImpassable() || ent1 || tile2.isImpassable() || ent2) {
          this.raiseMixinEvent("walkBlocked", {
            reason: "cannot squeeze through diagonal gap",
          });
          // Show wall bump message for player
          if (this.name === "avatar" && typeof DATASTORE?.GAME?.curMode?.showMessage === "function") {
            DATASTORE.GAME.curMode.showMessage("You cannot squeeze through the gap.");
          }
          return false;
        }
      }

      const targetPositionInfo = map.getTargetPositionInfo(newX, newY);
      if (targetPositionInfo.entity) {
        this.raiseMixinEvent("bumpEntity", {
          actor: this,
          target: targetPositionInfo.entity,
        });
        return false;
      } else if (targetPositionInfo.tile.isImpassable()) {
        this.raiseMixinEvent("walkBlocked", {
          reason: "there's a wall in the way",
        });
        // Show wall bump message for player
        if (this.name === "avatar" && typeof DATASTORE?.GAME?.curMode?.showMessage === "function") {
          DATASTORE.GAME.curMode.showMessage("You bump into a wall.");
        }
      } else {
        map.moveEntityTo(this, newX, newY);

        this.raiseMixinEvent("walkClear", { status: "clear" });
        this.raiseMixinEvent("turnTaken", { timeUsed: 1 });
        this.raiseMixinEvent("actionDone");
        
        // If this is the player, notify monsters and show success message
        if (this.name === "avatar") {
          this.raiseMixinEvent("playerMoved");
          // Show success message for player
          if (typeof DATASTORE?.GAME?.curMode?.showMessage === "function") {
            DATASTORE.GAME.curMode.showMessage("Keep walking, it's all clear.");
          }
        }
        return true;
      }

      return false;
    },
  },
  LISTENERS: {
    walkAttempt: function (evtData) {
      this.tryWalk(evtData.dx, evtData.dy);
    },
  },
};

export const ActorPlayer = {
  META: {
    mixInName: "ActorPlayer",
    mixInGroupName: "Actor",
  },
  METHODS: {
    act: function () {
      // Player acts based on input, not AI
      return;
    },
  },
};

export const ActorWanderer = {
  META: {
    mixInName: "ActorWanderer",
    mixInGroupName: "Actor",
  },
  METHODS: {
    act: function () {
      // Wanderer AI will be implemented in specific AI mixins
      return;
    },
  },
};

export const SmartMonsterAI = {
  META: {
    mixInName: "SmartMonsterAI",
    mixInGroupName: "AI",
  },
  METHODS: {
    act: function () {
      if (!this._ai) {
        this._ai = new SmartAI(this);
      }
      this._ai.act();
    },
  },
  LISTENERS: {
    act: function () {
      this.act();
    },
  },
};

export const BalancedMonsterAI = {
  META: {
    mixInName: "BalancedMonsterAI",
    mixInGroupName: "AI",
  },
  METHODS: {
    act: function () {
      if (!this._ai) {
        this._ai = new BalancedAI(this);
      }
      this._ai.act();
    },
  },
  LISTENERS: {
    act: function () {
      this.act();
    },
  },
};

export const SimpleMonsterAI = {
  META: {
    mixInName: "SimpleMonsterAI",
    mixInGroupName: "AI",
  },
  METHODS: {
    act: function () {
      if (!this._ai) {
        this._ai = new SimpleAI(this);
      }
      this._ai.act();
    },
  },
  LISTENERS: {
    act: function () {
      this.act();
    },
  },
};

export const StationaryEntity = {
  META: {
    mixInName: "StationaryEntity",
    mixInGroupName: "Stationary",
  },
  LISTENERS: {
    bumpEntity: function (evtData) {
      // When someone bumps into this stationary entity, attack them
      this.raiseMixinEvent("attacks", { src: this, target: evtData.actor });
      evtData.actor.raiseMixinEvent("damaged", {
        src: this,
        damageAmount: this.getMeleeDamage(),
      });
    },
  },
}; 