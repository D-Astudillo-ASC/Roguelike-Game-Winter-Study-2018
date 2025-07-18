// Core mixins without circular dependencies
// These mixins don't import DATASTORE or other problematic modules
import { DATASTORE } from "../../core/DataStore.js";

export const TimeTracker = {
  META: {
    mixInName: "TimeTracker",
    mixInGroupName: "Tracker",
    stateNamespace: "_TimeTracker",
    stateModel: {
      timeTaken: 0,
    },
  },
  METHODS: {
    getTime: function () {
      return this.state._TimeTracker.timeTaken;
    },
    setTime: function (t) {
      this.state._TimeTracker.timeTaken = t;
    },
    addTime: function (t) {
      this.state._TimeTracker.timeTaken += t;
    },
  },
  LISTENERS: {
    turnTaken: function (evtData) {
      this.addTime(evtData.timeUsed);
    },
  },
};

export const HitPoints = {
  META: {
    mixInName: "HitPoints",
    mixInGroupName: "HitPoints",
    stateNamespace: "_HitPoints",
    stateModel: {
      curHp: 0,
      maxHp: 0,
    },
    initialize: function (template) {
      this.state._HitPoints.maxHp = template.maxHp || 1;
      this.state._HitPoints.curHp = template.curHp || this.state._HitPoints.maxHp;
    },
  },
  METHODS: {
    loseHp: function (amt) {
      this.state._HitPoints.curHp -= amt;
      this.state._HitPoints.curHp = Math.max(0, this.state._HitPoints.curHp);
    },
    gainHp: function (amt) {
      this.state._HitPoints.curHp += amt;
      this.state._HitPoints.curHp = Math.min(
        this.state._HitPoints.maxHp,
        this.state._HitPoints.curHp,
      );
    },
    getHp: function () {
      return this.state._HitPoints.curHp;
    },
    setHp: function (amt) {
      this.state._HitPoints.curHp = amt;
      this.state._HitPoints.curHp = Math.min(
        this.state._HitPoints.maxHp,
        this.state._HitPoints.curHp,
      );
    },
    getMaxHp: function () {
      return this.state._HitPoints.maxHp;
    },
    setMaxHp: function (amt) {
      this.state._HitPoints.maxHp = amt;
    },
  },
  LISTENERS: {
    damaged: function (evtData) {
      this.loseHp(evtData.damageAmount);
      
      // Force a fresh render to update HP display (after HP is reduced)
      if (this.name === "avatar" && typeof DATASTORE?.GAME?.render === "function") {
        DATASTORE.GAME.render();
      }
      
      // Check for death after HP is reduced
      if (this.getHp() <= 0) {
        if (this.name === "avatar") {
          // Player has died - trigger lose mode
          if (typeof DATASTORE?.GAME?.curMode?.handlePlayerKilled === "function") {
            DATASTORE.GAME.curMode.handlePlayerKilled();
          }
        } else {
          // Entity has died - show message and remove from map
          if (typeof DATASTORE?.GAME?.curMode?.showMessage === "function") {
            DATASTORE.GAME.curMode.showMessage(`You kill the ${this.name}!`);
          }
          
          // Remove entity from map
          const map = this.getMap();
          if (map) {
            map.removeEntity(this);
          }
          
          // Remove from DATASTORE
          if (this.getId()) {
            delete DATASTORE.ENTITIES[this.getId()];
          }
        }
      }
    },
  },
};

export const MeleeAttacker = {
  META: {
    mixInName: "MeleeAttacker",
    mixInGroupName: "MeleeAttacker",
    stateNamespace: "_MeleeAttacker",
    stateModel: {
      meleeDamage: 5,
    },
    initialize: function (template) {
      this.state._MeleeAttacker.meleeDamage = template.meleeDamage || 1;
    },
  },
  METHODS: {
    getMeleeDamage: function () {
      return this.state._MeleeAttacker.meleeDamage;
    },
    setMeleeDamage: function (newVal) {
      this.state._MeleeAttacker.meleeDamage = newVal;
    },
  },
  LISTENERS: {
    bumpEntity: function (evtData) {
      this.raiseMixinEvent("attacks", { src: this, target: evtData.target });
      evtData.target.raiseMixinEvent("damaged", {
        src: this,
        damageAmount: this.getMeleeDamage(),
      });
      
      // If the target can attack back, let it do so
      if (evtData.target.getMeleeDamage) {
        evtData.target.raiseMixinEvent("attacks", { src: evtData.target, target: this });
        this.raiseMixinEvent("damaged", {
          src: evtData.target,
          damageAmount: evtData.target.getMeleeDamage(),
        });
      }
    },
  },
};

export const PlayerMessages = {
  META: {
    mixInName: "PlayerMessages",
    mixInGroupName: "PlayerMessages",
  },
  LISTENERS: {
    damaged: function (evtData) {
      // Show damage message
      if (typeof DATASTORE?.GAME?.curMode?.showMessage === "function") {
        DATASTORE.GAME.curMode.showMessage(`You take ${evtData.damageAmount} damage!`);
      }
    },
    attacks: function (evtData) {
      // Show attack message
      if (typeof DATASTORE?.GAME?.curMode?.showMessage === "function") {
        DATASTORE.GAME.curMode.showMessage(`You attack the ${evtData.target.name}!`);
      }
    },
  },
}; 