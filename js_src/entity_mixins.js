//defines mixins that can be added to ENTITIES
import { Message } from "./message.js";
import { SCHEDULER, TIME_ENGINE } from "./timing.js";
import { DATASTORE } from "./datastore.js";
import { getRandomOffset } from "./util.js";

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
      //can access/ manipulate this.state.exampleMix
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

export const WalkerCorporeal = {
  META: {
    mixInName: "WalkerCorporeal",
    mixInGroupName: "Walker",
  },

  METHODS: {
    tryWalk: function (dx, dy) {
      const newX = this.state.x * 1 + dx * 1;
      const newY = this.state.y * 1 + dy * 1;

      // if(this.getMap().isPositionOpen(newX,newY)){

      //   this.state.x = newX;
      //   this.state.y = newY;
      //   this.getMap().updateEntityPosition(this, this.state.x,this.state.y);

      //   this.raiseMixinEvent('turnTaken',{timeUsed: 1});
      //   // return true;

      // }
      // this.raiseMixinEvent('walkBlocked',{reason: "there's something in the way"});
      const targetPositionInfo = this.getMap().getTargetPositionInfo(
        newX,
        newY,
      );
      console.log(targetPositionInfo.entity);
      if (targetPositionInfo.entity) {
        console.log(targetPositionInfo.entity);
        this.raiseMixinEvent("bumpEntity", {
          actor: this,
          target: targetPositionInfo.entity,
        });
        return false;
      } else if (targetPositionInfo.tile.isImpassable()) {
        this.raiseMixinEvent("walkBlocked", {
          reason: "there's a wall in the way",
        });
      } else {
        this.state.x = newX;
        this.state.y = newY;
        this.getMap().updateEntityPosition(this, this.state.x, this.state.y);

        this.raiseMixinEvent("walkClear", { status: "clear" });
        this.raiseMixinEvent("turnTaken", { timeUsed: 1 });
        this.raiseMixinEvent("actionDone");
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
      this.state._HitPoints.curHp =
        template.curHp || this.state._HitPoints.maxHp;
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
      this.state._HitPoints.curHp = Math.min(
        this.state._HitPoints.maxHp,
        this.state._HitPoints.curHp,
      );
    },
  },
  LISTENERS: {
    damaged: function (evtData) {
      const amount = evtData.damageAmount;
      this.loseHp(amount);
      evtData.src.raiseMixinEvent("damages", {
        target: this,
        damageAmount: amount,
      });

      if (this.getHp() == 0) {
        this.raiseMixinEvent("killedBy", { src: evtData.src });
        evtData.src.raiseMixinEvent("kills", { target: this });
        console.log("destroying");
        this.destroy();
      }
    },
  },
};

export const PlayerMessages = {
  META: {
    mixInName: "PlayerMessages",
    mixInGroupName: "Messager",
  },

  LISTENERS: {
    walkBlocked: function (evtData) {
      Message.send(
        "Can't walk there because " + evtData.reason + ", path is obstructed.",
      );
    },

    bumpEntity: function (evtData) {
      Message.send(
        "Entity detected, Type: " +
          " " +
          evtData.target.name.toUpperCase() +
          ", " +
          " " +
          "HP: " +
          evtData.target.getHp() +
          "/" +
          evtData.target.getMaxHp(),
      );

      //if(evtData.target.getMaxHp() <= 5){
      //  setTimeout(Message.send("Very Low Threat Level Detected, this shouldn't be challenging at all!"),100000);
      //}
    },

    walkClear: function (evtData) {
      Message.send("Keep walking, it's" + " " + evtData.status);
    },
    attacks: function (evtData) {
      Message.send("You've attacked" + evtData.target.getName());
    },

    damages: function (evtData) {
      Message.send(
        this.getName() +
          "deals" +
          evtData.damageAmount +
          "damage to" +
          evtData.target.getName(),
      );
    },

    kills: function (evtData) {
      Message.send(this.getName() + "kills the" + evtData.target.getName());
    },

    killedBy: function (evtData) {
      Message.send(this.getName() + "killed by" + evtData.target.getName());
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
        console.log("bumping entity");
        this.raiseMixinEvent("attacks", { src: this, target: evtData.target });
        evtData.target.raiseMixinEvent("damaged", {
          src: this,
          damageAmount: this.getMeleeDamage(),
        });
      },
    },
  },
};

export const ActorPlayer = {
  META: {
    mixInName: "ActorPlayer",
    mixInGroupName: "ActorPlayer",
    stateNamespace: "_ActorPlayer",
    stateModel: {
      baseActionDuration: 1000,
      actingState: false,
      currentActionDuration: 1000,
    },

    initialize: function () {
      SCHEDULER.add(this, true, 1);
    },
  },

  METHODS: {
    getBaseActionDuration: function () {
      return this.state._ActorPlayer.baseActionDuration;
    },
    setBaseActionDuration: function (newValue) {
      this.state._ActorPlayer.baseActionDuration = newValue;
    },
    getCurrentActionDuration: function () {
      return this.state._ActorPlayer.currentActionDuration;
    },
    setCurrentActionDuration: function (newValue) {
      this.state._ActorPlayer.currentActionDuration = newValue;
    },
    isActing: function (state) {
      if (state !== undefined) {
        this.state._ActorPlayer.actingState = state;
      }
      return this.state._ActorPlayer.actingState;
    },

    act: function () {
      if (this.isActing()) {
        return;
      }
      this.isActing(true);
      TIME_ENGINE.lock();
      DATASTORE.GAME.render();
      this.isActing(false);
      console.log("Player is Acting");
    },
  },

  LISTENERS: {
    actionDone: function () {
      SCHEDULER.setDuration(this.getCurrentActionDuration());
      this.setCurrentActionDuration(
        this.getBaseActionDuration() + getRandomOffset(-5, 5),
      );
      setTimeout(function () {
        TIME_ENGINE.unlock();
      }, 1);
      console.log("Player still working");
    },
  },
};

export const ActorWanderer = {
  META: {
    mixInName: "ActorWanderer",
    mixInGroupName: "ActorWanderer",
    stateNamespace: "_ActorWanderer",
    stateModel: {
      baseActionDuration: 1000,
      actingState: false,
      currentActionDuration: 1000,
    },

    initialize: function (template) {
      SCHEDULER.add(
        this,
        true,
        getRandomOffset(2, this.getBaseActionDuration()),
      );
      this.state._ActorWanderer.baseActionDuration =
        template.wanderActionDuration || 1000;
      this.state._ActorWanderer.currentActionDuration =
        this.state._ActorWanderer.baseActionDuration;
    },
  },

  METHODS: {
    getBaseActionDuration: function () {
      return this.state._ActorWanderer.baseActionDuration;
    },
    setBaseActionDuration: function (newValue) {
      this.state._ActorWanderer.baseActionDuration = newValue;
    },
    getCurrentActionDuration: function () {
      return this.state._ActorWanderer.currentActionDuration;
    },
    setCurrentActionDuration: function (newValue) {
      this.state._ActorWanderer.currentActionDuration = newValue;
    },
    act: function () {
      TIME_ENGINE.lock();
      const dx = getRandomOffset(-1, 1);
      const dy = getRandomOffset(-1, 1);
      this.raiseMixinEvent("walkAttempt", { dx: dx, dy: dy });
      SCHEDULER.setDuration(1000);
      TIME_ENGINE.unlock();
    },
  },

  LISTENERS: {
    actionDone: function () {
      SCHEDULER.setDuration(this.getCurrentActionDuration());
      this.setCurrentActionDuration(
        this.getBaseActionDuration() + getRandomOffset(-5, 5),
      );
      setTimeout(function () {
        TIME_ENGINE.unlock();
      }, 1);
      console.log("Player still working");
    },
  },
};
