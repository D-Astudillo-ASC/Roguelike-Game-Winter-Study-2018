//defines mixins that can be added to ENTITIES
import { Message } from "./message.js";
import { SCHEDULER, TIME_ENGINE } from "./timing.js";
import { DATASTORE } from "./datastore.js";
import { getRandomOffset } from "./util.js";
import { Path } from "rot-js";

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

      // Check if entity has a valid map reference
      const map = this.getMap();
      if (!map) {
        console.warn(
          `Entity ${this.name} cannot walk - no valid map reference`,
        );
        return false;
      }

      // if(this.getMap().isPositionOpen(newX,newY)){

      //   this.state.x = newX;
      //   this.state.y = newY;
      //   this.getMap().updateEntityPosition(this, this.state.x,this.state.y);

      //   this.raiseMixinEvent('turnTaken',{timeUsed: 1});
      //   // return true;

      // }
      // this.raiseMixinEvent('walkBlocked',{reason: "there's something in the way"});
      const targetPositionInfo = map.getTargetPositionInfo(newX, newY);
      // console.log(targetPositionInfo.entity);
      if (targetPositionInfo.entity) {
        // console.log(
        //   "WalkerCorporeal: Entity detected at target position:",
        //   targetPositionInfo.entity.name,
        // );
        // console.log(
        //   "Raising bumpEntity event from:",
        //   this.name,
        //   "to:",
        //   targetPositionInfo.entity.name,
        // );
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
        // this.state.x = newX;
        // this.state.y = newY;
        // map.updateEntityPosition(this, this.state.x, this.state.y);
        map.moveEntityTo(this, newX, newY);

        this.raiseMixinEvent("walkClear", { status: "clear" });
        this.raiseMixinEvent("turnTaken", { timeUsed: 1 });
        this.raiseMixinEvent("actionDone");
        // If this is the player, notify monsters
        if (this.name === "avatar") {
          // console.log("Player moved, raising playerMoved event");
          this.raiseMixinEvent("playerMoved");

          // After player moves, trigger AI monsters to act (for loaded games)
          // for (const entId in DATASTORE.ENTITIES) {
          //   const ent = DATASTORE.ENTITIES[entId];
          //   if (
          //     ent.name === "monster" &&
          //     ent.mixins &&
          //     ent.mixins.some(mixin =>
          //       mixin.META &&
          //       (mixin.META.mixInName === "TestAI" || mixin.META.mixInName === "SmartMonsterAI")
          //     )
          //   ) {
          //     if (ent.raiseMixinEvent) {
          //       console.log(`Triggering ${ent.mixins.find(m => m.META && (m.META.mixInName === "TestAI" || m.META.mixInName === "SmartMonsterAI")).META.mixInName} for monster ${entId}`);
          //       ent.raiseMixinEvent("act");
          //     }
          //   }
          // }
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
      // console.log(
      //   "HitPoints initialized for:",
      //   this.name,
      //   "maxHp:",
      //   this.state._HitPoints.maxHp,
      //   "curHp:",
      //   this.state._HitPoints.curHp,
      // );
    },
  },

  METHODS: {
    loseHp: function (amt) {
      // console.log(
      //   "loseHp called for:",
      //   this.name,
      //   "amount:",
      //   amt,
      //   "current HP before:",
      //   this.state._HitPoints.curHp,
      // );
      this.state._HitPoints.curHp -= amt;
      this.state._HitPoints.curHp = Math.max(0, this.state._HitPoints.curHp);
      // console.log(
      //   "loseHp completed for:",
      //   this.name,
      //   "current HP after:",
      //   this.state._HitPoints.curHp,
      // );
    },

    gainHp: function (amt) {
      this.state._HitPoints.curHp += amt;
      this.state._HitPoints.curHp = Math.min(
        this.state._HitPoints.maxHp,
        this.state._HitPoints.curHp,
      );
    },

    getHp: function () {
      // console.log(
      //   "getHp called for:",
      //   this.name,
      //   "returning:",
      //   this.state._HitPoints.curHp,
      // );
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
      // console.log(
      //   "getMaxHp called for:",
      //   this.name,
      //   "returning:",
      //   this.state._HitPoints.maxHp,
      // );
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
      // console.log("HitPoints damaged event triggered for:", this.name);
      // console.log("Damage amount:", evtData.damageAmount);
      // console.log("Current HP before damage:", this.getHp());
      const amount = evtData.damageAmount;
      this.loseHp(amount);
      // console.log("Current HP after damage:", this.getHp());
      evtData.src.raiseMixinEvent("damages", {
        target: this,
        damageAmount: amount,
      });

      if (this.getHp() <= 0) {
        // console.log("Entity HP reached 0 or below, destroying:", this.name);
        // console.log("Current HP:", this.getHp(), "Max HP:", this.getMaxHp());
        this.raiseMixinEvent("killedBy", { src: evtData.src });
        if (this.name === "avatar") {
          // console.log("Avatar killed, raising playerKilled event");
          this.raiseMixinEvent("playerKilled");
          // Don't destroy the avatar immediately - let the game handle it
          return;
        }
        
        evtData.src.raiseMixinEvent("kills", { target: this });
        // console.log("destroying");
        
        // Only destroy non-avatar entities immediately
        setTimeout(() => {
          this.destroy();
        }, 0);
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
          evtData.target.getName().toUpperCase() +
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
      Message.send("Keep walking, it's " + evtData.status);
    },
    attacks: function (evtData) {
      Message.send("You've attacked " + evtData.target.getName());
    },

    damages: function (evtData) {
      Message.send(
        this.getName() +
          " deals " +
          evtData.damageAmount +
          " damage to " +
          evtData.target.getName(),
      );
    },

    kills: function (evtData) {
      Message.send(this.getName() + " kills the " + evtData.target.getName());
    },

    killedBy: function (evtData) {
      Message.send(this.getName() + " killed by " + evtData.src.getName());
    },

    playerKilled: function (evtData) {
      // console.log("PlayerMessages playerKilled event triggered");
      Message.send("GAME OVER - You have been killed!");
      
      // Call the PlayMode listener if it exists
      if (this.playerKilledListener) {
        // console.log("Calling playerKilledListener");
        this.playerKilledListener();
      } else {
        // console.log("No playerKilledListener found");
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
      // console.log("MeleeAttacker bumpEntity triggered for:", this.name);
      // console.log("Attacking target:", evtData.target.getName());
      // console.log("My melee damage:", this.getMeleeDamage());
      this.raiseMixinEvent("attacks", { src: this, target: evtData.target });
      evtData.target.raiseMixinEvent("damaged", {
        src: this,
        damageAmount: this.getMeleeDamage(),
      });
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
      // Only add to scheduler if we're not in the middle of loading a game
      if (!DATASTORE._isLoading) {
        // console.log(
        //   "ActorPlayer initializing for:",
        //   this.name,
        //   "adding to scheduler",
        // );
      SCHEDULER.add(this, true, 1);
      } else {
        // console.log(
        //   "ActorPlayer initializing for:",
        //   this.name,
        //   "skipping scheduler (loading)",
        // );
      }
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
      safeGameRender();
      this.isActing(false);
      // console.log("Player is Acting");
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
      // console.log("Player still working");
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
      // console.log(
      //   "ActorWanderer initialize called for:",
      //   this.name,
      //   "loading flag:",
      //   DATASTORE._isLoading,
      // );
      // Only add to scheduler if we're not in the middle of loading a game
      if (!DATASTORE._isLoading) {
        // console.log(
        //   "ActorWanderer initializing for:",
        //   this.name,
        //   "adding to scheduler",
        // );
      SCHEDULER.add(
        this,
        true,
        getRandomOffset(2, this.getBaseActionDuration()),
      );
      } else {
        // console.log(
        //   "ActorWanderer initializing for:",
        //   this.name,
        //   "skipping scheduler (loading)",
        // );
      }
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
      // console.log("ActorWanderer act called for:", this.name);
      TIME_ENGINE.lock();
      // Instead of moving directly, raise the act event for SmartMonsterAI to handle
      this.raiseMixinEvent("act");
      SCHEDULER.setDuration(1000);
      // Don't unlock here - let actionDone handle it
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
      // console.log("Player still working");
    },
  },
};

export const SmartMonsterAI = {
  META: {
    mixInName: "SmartMonsterAI",
    mixInGroupName: "AI",
    stateNamespace: "_SmartMonsterAI",
    stateModel: {
      chaseDistance: 8, // Distance at which monster starts chasing
    },
  },
  METHODS: {
    getDistanceToPlayer: function () {
      const map = this.getMap();
      if (!map) return Infinity;
      const entities = Object.values(DATASTORE.ENTITIES);
      const player = entities.find(
        (e) => e.name === "avatar" && e.getMapId() === this.getMapId(),
      );
      if (!player) return Infinity;

      const dx = this.getX() - player.getX();
      const dy = this.getY() - player.getY();
      return Math.sqrt(dx * dx + dy * dy);
    },

    moveDirectlyToPlayer: function () {
      const map = this.getMap();
      if (!map) return;
      const entities = Object.values(DATASTORE.ENTITIES);
      const player = entities.find(
        (e) => e.name === "avatar" && e.getMapId() === this.getMapId(),
      );
      if (!player) return;

      const startX = parseInt(this.getX());
      const startY = parseInt(this.getY());
      const endX = parseInt(player.getX());
      const endY = parseInt(player.getY());

      // console.log(
      //   "moveDirectlyToPlayer: Monster at",
      //   startX,
      //   startY,
      //   "Player at",
      //   endX,
      //   endY,
      // );

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
        [1, 0],
        [0, 1],
        [-1, 0],
        [0, -1], // Any direction if all else fails
      ];

      for (const [moveX, moveY] of moves) {
        const newX = startX + moveX;
        const newY = startY + moveY;

        // --- Prevent diagonal squeezing through walls ---
        if (Math.abs(moveX) === 1 && Math.abs(moveY) === 1) {
          const tile1 = map.getTile(newX, startY);
          const tile2 = map.getTile(startX, newY);
          const ent1 = map.getTargetPositionInfo(newX, startY).entity;
          const ent2 = map.getTargetPositionInfo(startX, newY).entity;
          if (!(tile1.isA("floor") && !ent1 && tile2.isA("floor") && !ent2)) {
            continue; // Block diagonal move if either orthogonal is blocked
          }
        }
        
        // Check if the new position is walkable
        const tile = map.getTile(newX, newY);
        const ent = map.getTargetPositionInfo(newX, newY).entity;
        if (tile.isA("floor") && !ent) {
          // console.log(
          //   "Monster moving toward player from:",
          //   startX,
          //   startY,
          //   "to:",
          //   newX,
          //   newY,
          // );
          map.moveEntityTo(this, newX, newY);
          // console.log(
          //   "Monster moved to new position:",
          //   this.getX(),
          //   this.getY(),
          // );
          // --- FIX 7: Add debugging after every monster move in moveDirectlyToPlayer ---
          const finalX = this.getX();
          const finalY = this.getY();
          const mapPos = map.state.entityIdToMapPos[this.getId()];
          const expectedPos = `${finalX},${finalY}`;
          // console.log(
          //   `Monster moveDirectlyToPlayer verification: entity pos (${finalX},${finalY}), map pos ${mapPos}, expected ${expectedPos}`,
          // );
          if (mapPos !== expectedPos) {
            console.warn(
              `MONSTER POSITION MISMATCH in moveDirectlyToPlayer: entity (${finalX},${finalY}) vs map ${mapPos}`,
            );
          }
          safeGameRender();
          return; // Successfully moved, exit
        }
      }
      
      // console.log("Monster cannot move toward player - all directions blocked");
    },

    moveTowardsPlayer: function () {
      const map = this.getMap();
      if (!map) return;

      const startX = parseInt(this.getX());
      const startY = parseInt(this.getY());

      // Find the player
      const entities = Object.values(DATASTORE.ENTITIES);
      const player = entities.find(
        (e) => e.name === "avatar" && e.getMapId() === this.getMapId(),
      );
      if (!player) return;

      const playerX = parseInt(player.getX());
      const playerY = parseInt(player.getY());

      // Calculate distance to player
      const distance = Math.sqrt(
        (startX - playerX) ** 2 + (startY - playerY) ** 2,
      );

      // If we're adjacent to the player, don't move
      if (distance <= 1) {
        // console.log("TestAI: Monster adjacent to player, dealing damage");
        this.raiseMixinEvent("attacks", { src: this, target: player });
        player.raiseMixinEvent("damaged", {
          src: this,
          damageAmount: this.getMeleeDamage(),
        });
        return;
      }

      // Use aggressive pathfinding to find the best path to the player
      const passableCallback = (x, y) => {
        const tile = map.getTile(x, y);
        const ent = map.getTargetPositionInfo(x, y).entity;
        
        // Allow the player's position as a valid destination
        if (x === playerX && y === playerY) {
          return tile.isA("floor");
        }
        
        // Allow the monster's position as a valid starting point
        if (x === startX && y === startY) {
          return tile.isA("floor");
        }
        
        // Only block if there's a wall or another entity (not the player)
        const isPassable = tile.isA("floor") && (!ent || ent === player);
        
        return isPassable;
      };

      const path = [];
      const astar = new Path.AStar(playerX, playerY, passableCallback, {
        topology: 8, // Allow diagonal movement for faster chasing
      });
      astar.compute(startX, startY, (x, y) => {
        path.push([x, y]);
      });
      
      // console.log("Path found:", path);

      if (path.length > 1) {
        const [nextX, nextY] = path[1];
        let canMove = true;
        
        // --- Prevent diagonal squeezing through walls for pathfinding step ---
        if (Math.abs(nextX - startX) === 1 && Math.abs(nextY - startY) === 1) {
          const tile1 = map.getTile(nextX, startY);
          const tile2 = map.getTile(startX, nextY);
          const ent1 = map.getTargetPositionInfo(nextX, startY).entity;
          const ent2 = map.getTargetPositionInfo(startX, nextY).entity;
          if (!(tile1.isA("floor") && !ent1 && tile2.isA("floor") && !ent2)) {
            // console.log(
            //   "SmartMonsterAI: Diagonal move blocked by squeezing prevention, trying fallbacks",
            // );
            canMove = false;
          }
        }
        
        if (canMove) {
          // console.log(
          //   "Moving monster from:",
          //   startX,
          //   startY,
          //   "to:",
          //   nextX,
          //   nextY,
          // );
          map.moveEntityTo(this, nextX, nextY);
          // console.log("Monster moved, new position:", this.getX(), this.getY());
          // --- FIX 4: Add debugging after every monster move to verify map/entity sync ---
          const newX = this.getX();
          const newY = this.getY();
          const mapPos = map.state.entityIdToMapPos[this.getId()];
          const expectedPos = `${newX},${newY}`;
          // console.log(
          //   `Monster move verification: entity pos (${newX},${newY}), map pos ${mapPos}, expected ${expectedPos}`,
          // );
          if (mapPos !== expectedPos) {
            console.warn(
              `MONSTER POSITION MISMATCH: entity (${newX},${newY}) vs map ${mapPos}`,
            );
          }
          safeGameRender();
          return; // Successfully moved
        }
      }
      
      // If we get here, either no path was found or diagonal move was blocked
      // console.log("No direct path found or diagonal blocked, trying alternative approaches");
      
      // Try direct movement first
      this.moveDirectlyToPlayer();
      
      // If still stuck, try to find any path toward the player
      if (this.getX() === startX && this.getY() === startY) {
        // console.log("Direct movement failed, trying to find any path toward player");
        this.findPathTowardPlayer();
      }
      
      // If still stuck, try to find any valid move that gets us closer
      if (this.getX() === startX && this.getY() === startY) {
        // console.log("All pathfinding failed, trying smart random movement");
        this.moveSmartRandomly();
      }
    },

    // Check if monster is adjacent to player and deal damage
    checkAdjacencyAndDamage: function () {
      const map = this.getMap();
      if (!map) return;
      
      const entities = Object.values(DATASTORE.ENTITIES);
      const player = entities.find(
        (e) => e.name === "avatar" && e.getMapId() === this.getMapId(),
      );
      if (!player) return;
      
      const monsterX = parseInt(this.getX());
      const monsterY = parseInt(this.getY());
      const playerX = parseInt(player.getX());
      const playerY = parseInt(player.getY());
      
      // Check if monster is adjacent to player (including diagonals)
      const dx = Math.abs(monsterX - playerX);
      const dy = Math.abs(monsterY - playerY);
      
      if (dx <= 1 && dy <= 1 && (dx > 0 || dy > 0)) {
        // Monster is adjacent to player, deal damage
        // console.log(
        //   "Monster adjacent to player, dealing damage:",
        //   this.name,
        //   "to player",
        // );
        this.raiseMixinEvent("attacks", { src: this, target: player });
        player.raiseMixinEvent("damaged", {
          src: this,
          damageAmount: this.getMeleeDamage(),
        });
      }
    },

    findPathTowardPlayer: function () {
      const map = this.getMap();
      if (!map) return;
      
      const startX = parseInt(this.getX());
      const startY = parseInt(this.getY());
      
      // Find the player
      const entities = Object.values(DATASTORE.ENTITIES);
      const player = entities.find(
        (e) => e.name === "avatar" && e.getMapId() === this.getMapId(),
      );
      if (!player) return;
      
      const playerX = parseInt(player.getX());
      const playerY = parseInt(player.getY());
      
      // Try to find any path that gets us closer to the player, even if not optimal
      const passableCallback = (x, y) => {
        const tile = map.getTile(x, y);
        const ent = map.getTargetPositionInfo(x, y).entity;
        return tile.isA("floor") && (!ent || ent === player);
      };
      
      // Try different target points around the player if direct path fails
      const targets = [
        [playerX, playerY], // Direct to player
        [playerX + 1, playerY], // Right of player
        [playerX - 1, playerY], // Left of player
        [playerX, playerY + 1], // Below player
        [playerX, playerY - 1], // Above player
        [playerX + 1, playerY + 1], // Diagonal
        [playerX - 1, playerY + 1], // Diagonal
        [playerX + 1, playerY - 1], // Diagonal
        [playerX - 1, playerY - 1], // Diagonal
      ];
      
      for (const [targetX, targetY] of targets) {
        // Skip invalid targets
        if (targetX < 0 || targetY < 0 || targetX >= map.getXDim() || targetY >= map.getYDim()) {
          continue;
        }
        
        const path = [];
        const astar = new Path.AStar(targetX, targetY, passableCallback, {
          topology: 8,
        });
        astar.compute(startX, startY, (x, y) => {
          path.push([x, y]);
        });
        
        if (path.length > 1) {
          const [nextX, nextY] = path[1];
          // console.log(`Found alternative path to (${targetX},${targetY}) via (${nextX},${nextY})`);
          map.moveEntityTo(this, nextX, nextY);
          safeGameRender();
          return; // Successfully moved
        }
      }
      
      // console.log("No alternative path found");
    },

    moveSmartRandomly: function () {
      const map = this.getMap();
      if (!map) return;
      
      const startX = parseInt(this.getX());
      const startY = parseInt(this.getY());
      
      // Find the player to prioritize movement toward them
      const entities = Object.values(DATASTORE.ENTITIES);
      const player = entities.find(
        (e) => e.name === "avatar" && e.getMapId() === this.getMapId(),
      );
      if (!player) return;
      
      const playerX = parseInt(player.getX());
      const playerY = parseInt(player.getY());
      
      // Calculate direction to player
      const dx = Math.sign(playerX - startX);
      const dy = Math.sign(playerY - startY);
      
      // Prioritize directions that get us closer to the player
      const directions = [
        [dx, dy], // Direct toward player
        [dx, 0], // Horizontal toward player
        [0, dy], // Vertical toward player
        [dx, -dy], // Alternative diagonal
        [-dx, dy], // Alternative diagonal
        [1, 0], [0, 1], [-1, 0], [0, -1], // Orthogonal
        [1, 1], [1, -1], [-1, 1], [-1, -1], // Diagonal
      ];
      
      // Try each direction until we find a valid move
      for (const [moveX, moveY] of directions) {
        const newX = startX + moveX;
        const newY = startY + moveY;
        
        // --- Prevent diagonal squeezing through walls ---
        if (Math.abs(moveX) === 1 && Math.abs(moveY) === 1) {
          const tile1 = map.getTile(newX, startY);
          const tile2 = map.getTile(startX, newY);
          const ent1 = map.getTargetPositionInfo(newX, startY).entity;
          const ent2 = map.getTargetPositionInfo(startX, newY).entity;
          if (!(tile1.isA("floor") && !ent1 && tile2.isA("floor") && !ent2)) {
            continue; // Block diagonal move if either orthogonal is blocked
          }
        }
        
        // Check if the new position is walkable
        const tile = map.getTile(newX, newY);
        const ent = map.getTargetPositionInfo(newX, newY).entity;
        
        if (tile.isA("floor") && !ent) {
          // console.log(`Smart random move from (${startX},${startY}) to (${newX},${newY})`);
          map.moveEntityTo(this, newX, newY);
          safeGameRender();
          return; // Successfully moved
        }
      }
      
      // console.log("Monster completely trapped - no valid moves available");
    },

    findPathToOpenSpace: function () {
      const map = this.getMap();
      if (!map) return;
      
      const startX = parseInt(this.getX());
      const startY = parseInt(this.getY());
      
      // Find the player to calculate distances
      const entities = Object.values(DATASTORE.ENTITIES);
      const player = entities.find(
        (e) => e.name === "avatar" && e.getMapId() === this.getMapId(),
      );
      if (!player) return;
      
      const playerX = parseInt(player.getX());
      const playerY = parseInt(player.getY());
      
      let bestOpening = null;
      let bestScore = Infinity;
      
      // Search in expanding circles for the best opening
      for (let radius = 2; radius <= 10; radius++) {
        for (let dx = -radius; dx <= radius; dx++) {
          for (let dy = -radius; dy <= radius; dy++) {
            // Only check points at the current radius
            if (Math.abs(dx) === radius || Math.abs(dy) === radius) {
              const checkX = startX + dx;
              const checkY = startY + dy;
              
              // Check if this position is open
              const tile = map.getTile(checkX, checkY);
              const ent = map.getTargetPositionInfo(checkX, checkY).entity;
              if (tile.isA("floor") && !ent) {
                // Calculate distance to this opening
                const distanceToOpening = Math.sqrt(dx * dx + dy * dy);
                // Calculate distance from opening to player
                const distanceToPlayer = Math.sqrt(
                  (checkX - playerX) ** 2 + (checkY - playerY) ** 2,
                );
                // Calculate current distance to player
                const currentDistanceToPlayer = Math.sqrt(
                  (startX - playerX) ** 2 + (startY - playerY) ** 2,
                );
                
                // Score: prefer openings that are close AND get us closer to the player
                const score =
                  distanceToOpening +
                  (distanceToPlayer - currentDistanceToPlayer) * 2;
                
                if (score < bestScore) {
                  bestScore = score;
                  bestOpening = { x: checkX, y: checkY, dx: dx, dy: dy };
                }
              }
            }
          }
        }
      }
      
      if (bestOpening) {
        // Try to move toward the best opening
        const moveX = Math.sign(bestOpening.dx);
        const moveY = Math.sign(bestOpening.dy);
        const newX = startX + moveX;
        const newY = startY + moveY;
        
        // Check if we can move in that direction
        const newTile = map.getTile(newX, newY);
        const newEnt = map.getTargetPositionInfo(newX, newY).entity;
        if (newTile.isA("floor") && !newEnt) {
          // console.log(
          //   "Monster escaping toward player via opening at:",
          //   bestOpening.x,
          //   bestOpening.y,
          //   "moving to:",
          //   newX,
          //   newY,
          // );
          map.moveEntityTo(this, newX, newY);

          // --- FIX 6: Add debugging after every monster move in findPathToOpenSpace ---
          const finalX = this.getX();
          const finalY = this.getY();
          const mapPos = map.state.entityIdToMapPos[this.getId()];
          const expectedPos = `${finalX},${finalY}`;
          // console.log(
          //   `Monster findPathToOpenSpace verification: entity pos (${finalX},${finalY}), map pos ${mapPos}, expected ${expectedPos}`,
          // );
          if (mapPos !== expectedPos) {
            console.warn(
              `MONSTER POSITION MISMATCH in findPathToOpenSpace: entity (${finalX},${finalY}) vs map ${mapPos}`,
            );
          }

          safeGameRender();
          return; // Successfully moved
        }
      }
      
      // console.log(
      //   "Monster completely trapped - no strategic escape path found",
      // );
    },
  },
  LISTENERS: {
    act: function () {
      // Prevent multiple acts in the same turn
      if (this._isActing) {
        // console.log("SmartMonsterAI act already in progress for:", this.name);
        return;
      }
      
      this._isActing = true;
      // console.log("SmartMonsterAI act called for:", this.name);
      const distance = this.getDistanceToPlayer();
      // console.log("Distance to player:", distance);

      // Check if monster is adjacent to player and deal damage
      this.checkAdjacencyAndDamage();

      // Always chase the player aggressively, regardless of distance
      this.moveTowardsPlayer();
      
      // If we couldn't move toward the player at all, we're completely trapped
      const startX = parseInt(this.getX());
      const startY = parseInt(this.getY());
      if (this.getX() === startX && this.getY() === startY) {
        // console.log("Monster completely trapped - cannot move toward player");
      }
      
      this._isActing = false;
    },

    // REMOVED: playerMoved listener - system is now purely scheduler-driven
    // Monsters move only when scheduled, not when player moves
  },
};

export const BalancedMonsterAI = {
  META: {
    mixInName: "BalancedMonsterAI",
    mixInGroupName: "AI",
    stateNamespace: "_BalancedMonsterAI",
    stateModel: {
      chaseDistance: 8, // Distance at which monster starts chasing
    },
  },
  METHODS: {
    getDistanceToPlayer: function () {
      const map = this.getMap();
      if (!map) return Infinity;
      const entities = Object.values(DATASTORE.ENTITIES);
      const player = entities.find(
        (e) => e.name === "avatar" && e.getMapId() === this.getMapId(),
      );
      if (!player) return Infinity;

      const dx = parseInt(this.getX()) - parseInt(player.getX());
      const dy = parseInt(this.getY()) - parseInt(player.getY());
      return Math.sqrt(dx * dx + dy * dy);
    },

    hasLineOfSight: function () {
      const map = this.getMap();
      if (!map) return false;
      const entities = Object.values(DATASTORE.ENTITIES);
      const player = entities.find(
        (e) => e.name === "avatar" && e.getMapId() === this.getMapId(),
      );
      if (!player) return false;

      const startX = parseInt(this.getX());
      const startY = parseInt(this.getY());
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
    },

    moveDirectlyToPlayer: function () {
      const map = this.getMap();
      if (!map) return;
      const entities = Object.values(DATASTORE.ENTITIES);
      const player = entities.find(
        (e) => e.name === "avatar" && e.getMapId() === this.getMapId(),
      );
      if (!player) return;

      const startX = parseInt(this.getX());
      const startY = parseInt(this.getY());
      const endX = parseInt(player.getX());
      const endY = parseInt(player.getY());

      // Calculate direction to player
      const dx = Math.sign(endX - startX);
      const dy = Math.sign(endY - startY);

      // Try to move one step toward player
      const newX = startX + dx;
      const newY = startY + dy;
      
      // --- Prevent diagonal squeezing through walls ---
      if (Math.abs(dx) === 1 && Math.abs(dy) === 1) {
        const tile1 = map.getTile(newX, startY);
        const tile2 = map.getTile(startX, newY);
        const ent1 = map.getTargetPositionInfo(newX, startY).entity;
        const ent2 = map.getTargetPositionInfo(startX, newY).entity;
        if (!(tile1.isA("floor") && !ent1 && tile2.isA("floor") && !ent2)) {
          // console.log("BalancedMonsterAI: Diagonal move blocked by squeezing prevention");
          // Try alternative approaches instead of giving up
          this.moveWithPathfinding();
          return;
        }
      }
      
      // Check if the new position is walkable
      const tile = map.getTile(newX, newY);
      const ent = map.getTargetPositionInfo(newX, newY).entity;
      if (tile.isA("floor") && !ent) {
        // console.log("Balanced monster moving directly toward player from:", startX, startY, "to:", newX, newY);
        map.moveEntityTo(this, newX, newY);
        safeGameRender();
        return; // Successfully moved
      } else {
        // Can't move directly toward player, try pathfinding
        // console.log("Balanced monster: direct path blocked, trying pathfinding");
        this.moveWithPathfinding();
      }
    },

    moveRandomly: function () {
      const map = this.getMap();
      if (!map) return;
      
      const startX = parseInt(this.getX());
      const startY = parseInt(this.getY());
      
      // Find the player to prioritize movement toward them even when "random"
      const entities = Object.values(DATASTORE.ENTITIES);
      const player = entities.find(
        (e) => e.name === "avatar" && e.getMapId() === this.getMapId(),
      );
      
      let directions;
      if (player) {
        const playerX = parseInt(player.getX());
        const playerY = parseInt(player.getY());
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
        // Fallback to truly random if no player found
        directions = [
          [-1, -1], [-1, 0], [-1, 1],
          [0, -1], [0, 1],
          [1, -1], [1, 0], [1, 1]
        ];
      }
      
      // Try each direction until we find a valid move
      for (const [dx, dy] of directions) {
        const newX = startX + dx;
        const newY = startY + dy;

        // --- Prevent diagonal squeezing through walls ---
        if (Math.abs(dx) === 1 && Math.abs(dy) === 1) {
          const tile1 = map.getTile(newX, startY);
          const tile2 = map.getTile(startX, newY);
          const ent1 = map.getTargetPositionInfo(newX, startY).entity;
          const ent2 = map.getTargetPositionInfo(startX, newY).entity;
          if (!(tile1.isA("floor") && !ent1 && tile2.isA("floor") && !ent2)) {
            continue; // Block diagonal move if either orthogonal is blocked
          }
        }
        
        // Check if the new position is walkable
        const tile = map.getTile(newX, newY);
        const ent = map.getTargetPositionInfo(newX, newY).entity;
        if (tile.isA("floor") && !ent) {
          // console.log("Balanced monster randomly moving from:", startX, startY, "to:", newX, newY);
          map.moveEntityTo(this, newX, newY);
          safeGameRender();
          return; // Successfully moved
        }
      }
      
      // console.log("Balanced monster cannot move - all directions blocked");
    },

    moveWithPathfinding: function () {
      const map = this.getMap();
      if (!map) return;
      const entities = Object.values(DATASTORE.ENTITIES);
      const player = entities.find(
        (e) => e.name === "avatar" && e.getMapId() === this.getMapId(),
      );
      if (!player) return;

      const startX = parseInt(this.getX());
      const startY = parseInt(this.getY());
      const endX = parseInt(player.getX());
      const endY = parseInt(player.getY());

      // Improved pathfinding callback: allows diagonal movement and considers entities
      const passableCallback = (x, y) => {
        if (x < 0 || y < 0 || x >= map.getXDim() || y >= map.getYDim()) {
          return false;
        }
        const tile = map.getTile(x, y);
        const ent = map.getTargetPositionInfo(x, y).entity;
        // Allow floor tiles with no entity (or the player itself)
        return tile.isA("floor") && (!ent || ent === player);
      };

      const path = [];
      const astar = new Path.AStar(endX, endY, passableCallback, {
        topology: 4, // Orthogonal only - keeps it "balanced" and not too aggressive
      });
      astar.compute(startX, startY, (x, y) => {
        path.push([x, y]);
      });

      if (path.length > 1) {
        const [nextX, nextY] = path[1];
        
        // --- Prevent diagonal squeezing through walls for pathfinding step ---
        if (Math.abs(nextX - startX) === 1 && Math.abs(nextY - startY) === 1) {
          const tile1 = map.getTile(nextX, startY);
          const tile2 = map.getTile(startX, nextY);
          const ent1 = map.getTargetPositionInfo(nextX, startY).entity;
          const ent2 = map.getTargetPositionInfo(startX, nextY).entity;
          if (!(tile1.isA("floor") && !ent1 && tile2.isA("floor") && !ent2)) {
            // console.log("BalancedMonsterAI: Pathfinding diagonal move blocked by squeezing prevention");
            // Try random movement as fallback
            this.moveRandomly();
            return;
          }
        }
        
        // console.log("Balanced monster following path from:", startX, startY, "to:", nextX, nextY);
        map.moveEntityTo(this, nextX, nextY);
        safeGameRender();
        return; // Successfully moved
      } else {
        // No path found, try random movement to avoid getting stuck
        // console.log("Balanced monster: no path found, trying random movement");
        this.moveRandomly();
      }
    },

    checkAdjacencyAndDamage: function () {
      const map = this.getMap();
      if (!map) return;
      
      const entities = Object.values(DATASTORE.ENTITIES);
      const player = entities.find(
        (e) => e.name === "avatar" && e.getMapId() === this.getMapId(),
      );
      if (!player) return;
      
      const monsterX = parseInt(this.getX());
      const monsterY = parseInt(this.getY());
      const playerX = parseInt(player.getX());
      const playerY = parseInt(player.getY());
      
      // Check if monster is adjacent to player (including diagonals)
      const dx = Math.abs(monsterX - playerX);
      const dy = Math.abs(monsterY - playerY);
      
      if (dx <= 1 && dy <= 1 && (dx > 0 || dy > 0)) {
        // Monster is adjacent to player, deal damage
        // console.log(
        //   "Balanced monster adjacent to player, dealing damage:",
        //   this.name,
        //   "to player",
        // );
        this.raiseMixinEvent("attacks", { src: this, target: player });
        player.raiseMixinEvent("damaged", {
          src: this,
          damageAmount: this.getMeleeDamage(),
        });
    }
    },
  },
  LISTENERS: {
    act: function () {
      // Prevent multiple acts in the same turn
      if (this._isActing) {
        // console.log("BalancedMonsterAI act already in progress for:", this.name);
        return;
      }
      
      this._isActing = true;
      // console.log("BalancedMonsterAI act called for:", this.name);
      const distance = this.getDistanceToPlayer();
      // console.log("Distance to player:", distance);

      // Check if monster is adjacent to player and deal damage
      this.checkAdjacencyAndDamage();

      const startX = parseInt(this.getX());
      const startY = parseInt(this.getY());

      // Use different strategies based on distance and line of sight
      if (distance <= this.state._BalancedMonsterAI.chaseDistance) {
        // Within chase distance - try to be smart but fall back to random
        if (this.hasLineOfSight()) {
          // console.log("Balanced monster has line of sight - pursuing directly");
          this.moveDirectlyToPlayer();
        } else {
          // console.log("Balanced monster: obstacles detected, using pathfinding");
          this.moveWithPathfinding();
        }
      } else {
        // Far from player, move randomly but still toward player
        // console.log("Balanced monster far from player - moving randomly");
        this.moveRandomly();
      }
      
      // If we couldn't move at all, we're completely trapped
      if (this.getX() === startX && this.getY() === startY) {
        // console.log("Balanced monster completely trapped - cannot move");
      }
      
      this._isActing = false;
    },

    // REMOVED: playerMoved listener - system is now purely scheduler-driven
    // Monsters move only when scheduled, not when player moves
  },
};

export const DumbMonsterAI = {
  META: {
    mixInName: "DumbMonsterAI",
    mixInGroupName: "AI",
    stateNamespace: "_DumbMonsterAI",
  },
  METHODS: {
    moveRandomly: function () {
      const map = this.getMap();
      if (!map) return;
      
      const startX = parseInt(this.getX());
      const startY = parseInt(this.getY());
      
      // Find the player to occasionally move toward them (even dumb monsters have instincts!)
      const entities = Object.values(DATASTORE.ENTITIES);
      const player = entities.find(
        (e) => e.name === "avatar" && e.getMapId() === this.getMapId(),
      );
      
      let directions;
      if (player && Math.random() < 0.3) { // 30% chance to move toward player
        const playerX = parseInt(player.getX());
        const playerY = parseInt(player.getY());
        const dx = Math.sign(playerX - startX);
        const dy = Math.sign(playerY - startY);
        
        // Sometimes move toward player, sometimes random
        directions = [
          [dx, dy], // Toward player
          [dx, 0], [0, dy], // Orthogonal toward player
          [1, 0], [0, 1], [-1, 0], [0, -1], // Orthogonal random
          [1, 1], [1, -1], [-1, 1], [-1, -1], // Diagonal random
        ];
      } else {
        // Mostly random movement
        directions = [
          [1, 0], [0, 1], [-1, 0], [0, -1], // Orthogonal
          [1, 1], [1, -1], [-1, 1], [-1, -1], // Diagonal
        ];
      }
      
      // Shuffle directions for randomness
      for (let i = directions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [directions[i], directions[j]] = [directions[j], directions[i]];
      }
      
      // Try each direction until we find a valid move
      for (const [dx, dy] of directions) {
        const newX = startX + dx;
        const newY = startY + dy;
        
        // --- Prevent diagonal squeezing through walls ---
        if (Math.abs(dx) === 1 && Math.abs(dy) === 1) {
          const tile1 = map.getTile(newX, startY);
          const tile2 = map.getTile(startX, newY);
          const ent1 = map.getTargetPositionInfo(newX, startY).entity;
          const ent2 = map.getTargetPositionInfo(startX, newY).entity;
          if (!(tile1.isA("floor") && !ent1 && tile2.isA("floor") && !ent2)) {
            continue; // Block diagonal move if either orthogonal is blocked
          }
        }
        
        // Check if the new position is walkable
        const tile = map.getTile(newX, newY);
        const ent = map.getTargetPositionInfo(newX, newY).entity;
        if (tile.isA("floor") && !ent) {
          // console.log("Dumb monster moving from:", startX, startY, "to:", newX, newY);
          map.moveEntityTo(this, newX, newY);
          safeGameRender();
          return; // Successfully moved
        }
      }
      
      // console.log("Dumb monster cannot move - all directions blocked");
    },

    // Check if monster is adjacent to player and deal damage
    checkAdjacencyAndDamage: function () {
      const map = this.getMap();
      if (!map) return;
      
      const entities = Object.values(DATASTORE.ENTITIES);
      const player = entities.find(
        (e) => e.name === "avatar" && e.getMapId() === this.getMapId(),
      );
      if (!player) return;
      
      const monsterX = parseInt(this.getX());
      const monsterY = parseInt(this.getY());
      const playerX = parseInt(player.getX());
      const playerY = parseInt(player.getY());
      
      // Check if monster is adjacent to player (including diagonals)
      const dx = Math.abs(monsterX - playerX);
      const dy = Math.abs(monsterY - playerY);
      
      if (dx <= 1 && dy <= 1 && (dx > 0 || dy > 0)) {
        // Monster is adjacent to player, deal damage
        // console.log(
        //   "Dumb monster adjacent to player, dealing damage:",
        //   this.name,
        //   "to player",
        // );
        this.raiseMixinEvent("attacks", { src: this, target: player });
        player.raiseMixinEvent("damaged", {
          src: this,
          damageAmount: this.getMeleeDamage(),
        });
      }
    },
  },
  LISTENERS: {
    act: function () {
      // Prevent multiple acts in the same turn
      if (this._isActing) {
        // console.log("DumbMonsterAI act already in progress for:", this.name);
        return;
      }
      
      this._isActing = true;
      // console.log("DumbMonsterAI act called for:", this.name);
      
      // Check if monster is adjacent to player and deal damage
      this.checkAdjacencyAndDamage();
      
      const startX = parseInt(this.getX());
      const startY = parseInt(this.getY());
      
      // Move randomly (with occasional player-seeking behavior)
      this.moveRandomly();
      
      // If we couldn't move at all, we're completely trapped
      if (this.getX() === startX && this.getY() === startY) {
        // console.log("Dumb monster completely trapped - cannot move");
      }
      
      this._isActing = false;
    },

    // REMOVED: playerMoved listener - system is now purely scheduler-driven
    // Monsters move only when scheduled, not when player moves
  },
};

// === TestAI: Simple, reliable, player-move-triggered monster movement ===
export const TestAI = {
  META: {
    mixInName: "TestAI",
    mixInGroupName: "AI",
    stateNamespace: "_TestAI",
    stateModel: {
      chaseDistance: 20,
    },
  },
  METHODS: {
    getDistanceToPlayer: function () {
      const map = this.getMap();
      if (!map) return Infinity;
      const entities = Object.values(DATASTORE.ENTITIES);
      const player = entities.find(
        (e) => e.name === "avatar" && e.getMapId() === this.getMapId(),
      );
      if (!player) return Infinity;

      const dx = this.getX() - player.getX();
      const dy = this.getY() - player.getY();
      return Math.sqrt(dx * dx + dy * dy);
    },

    moveDirectlyToPlayer: function () {
      const map = this.getMap();
      if (!map) return;
      const entities = Object.values(DATASTORE.ENTITIES);
      const player = entities.find(
        (e) => e.name === "avatar" && e.getMapId() === this.getMapId(),
      );
      if (!player) return;

      const startX = parseInt(this.getX());
      const startY = parseInt(this.getY());
      const endX = parseInt(player.getX());
      const endY = parseInt(player.getY());

      // console.log(
      //   `TestAI: Monster at (${startX},${startY}), Player at (${endX},${endY})`,
      // );

      // If adjacent, don't move (attack logic handled elsewhere)
      if (Math.abs(startX - endX) <= 1 && Math.abs(startY - endY) <= 1) {
        // console.log("TestAI: Monster adjacent to player, not moving");
        return;
      }

      // Use ROT.js A* pathfinding
      const passableCallback = (x, y) => {
        const tile = map.getTile(x, y);
        const ent = map.getTargetPositionInfo(x, y).entity;
        // Only allow floor tiles with no entity (or the player itself)
        return tile.isA("floor") && (!ent || ent === player);
      };

      const path = [];
      const astar = new Path.AStar(endX, endY, passableCallback, {
        topology: 8,
      });
      astar.compute(startX, startY, (x, y) => {
        path.push([x, y]);
      });

      // console.log(
      //   `TestAI: Pathfinding result - path length: ${path.length}, path:`,
      //   path,
      // );

      // The first element is the monster's current position, so move to the next step
      if (path.length > 1) {
        const [nextX, nextY] = path[1];
        // console.log(`TestAI: Attempting to move to (${nextX},${nextY})`);

        // Prevent diagonal squeezing
        if (Math.abs(nextX - startX) === 1 && Math.abs(nextY - startY) === 1) {
          const tile1 = map.getTile(nextX, startY);
          const tile2 = map.getTile(startX, nextY);
          const ent1 = map.getTargetPositionInfo(nextX, startY).entity;
          const ent2 = map.getTargetPositionInfo(startX, nextY).entity;
          if (!(tile1.isA("floor") && !ent1 && tile2.isA("floor") && !ent2)) {
            // console.log(
            //   "TestAI: Diagonal move blocked by squeezing prevention",
            // );
            return; // Block diagonal move if either orthogonal is blocked
          }
        }

        map.moveEntityTo(this, nextX, nextY);
        // console.log(
        //   `TestAI: Monster pathfinding move from (${startX},${startY}) to (${nextX},${nextY})`,
        // );
        return;
      }

      // If no path, try simple direct movement first
      // console.log("TestAI: No path found, trying simple direct movement");
      const dx = Math.sign(endX - startX);
      const dy = Math.sign(endY - startY);

      // Try direct movement toward player
      const directX = startX + dx;
      const directY = startY + dy;
      const directTile = map.getTile(directX, directY);
      const directEnt = map.getTargetPositionInfo(directX, directY).entity;

      if (directTile.isA("floor") && !directEnt) {
        // Check diagonal squeezing for direct move
        if (Math.abs(dx) === 1 && Math.abs(dy) === 1) {
          const tile1 = map.getTile(directX, startY);
          const tile2 = map.getTile(startX, directY);
          const ent1 = map.getTargetPositionInfo(directX, startY).entity;
          const ent2 = map.getTargetPositionInfo(startX, directY).entity;
          if (!(tile1.isA("floor") && !ent1 && tile2.isA("floor") && !ent2)) {
            // console.log(
            //   "TestAI: Direct diagonal move blocked by squeezing prevention",
            // );
          } else {
            map.moveEntityTo(this, directX, directY);
            // console.log(
            //   `TestAI: Monster direct move from (${startX},${startY}) to (${directX},${directY})`,
            // );
            return;
          }
        } else {
          map.moveEntityTo(this, directX, directY);
          // console.log(
          //   `TestAI: Monster direct move from (${startX},${startY}) to (${directX},${directY})`,
          // );
          return;
        }
      }

      // If direct movement fails, wander randomly
      // console.log("TestAI: Direct movement failed, wandering randomly");
      this.moveRandomly();
    },

    moveRandomly: function () {
      const map = this.getMap();
      if (!map) return;

      const startX = parseInt(this.getX());
      const startY = parseInt(this.getY());

      // Random direction selection
      const directions = [
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, -1],
        [0, 1],
        [1, -1],
        [1, 0],
        [1, 1],
      ];

      // Shuffle directions for randomness
      for (let i = directions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [directions[i], directions[j]] = [directions[j], directions[i]];
      }

      for (const [dx, dy] of directions) {
        const newX = startX + dx;
        const newY = startY + dy;
        const tile = map.getTile(newX, newY);
        const ent = map.getTargetPositionInfo(newX, newY).entity;
        // Prevent diagonal squeezing - for other types of monsters, diagonal squeezing might be their hidden ability, so for such monster type delete the following block.
        if (Math.abs(dx) === 1 && Math.abs(dy) === 1) {
          const tile1 = map.getTile(startX + dx, startY);
          const tile2 = map.getTile(startX, startY + dy);
          const ent1 = map.getTargetPositionInfo(startX + dx, startY).entity;
          const ent2 = map.getTargetPositionInfo(startX, startY + dy).entity;
          if (!(tile1.isA("floor") && !ent1 && tile2.isA("floor") && !ent2)) {
            continue;
          }
        }

        if (tile.isA("floor") && !ent) {
          map.moveEntityTo(this, newX, newY);
          // console.log(
          //   `TestAI: Monster random wander from (${startX},${startY}) to (${newX},${newY})`,
          // );
          return;
        }
      }

      // If no move possible, do nothing
      // console.log("TestAI: Monster cannot wander, all directions blocked.");
    },

    checkAdjacencyAndDamage: function () {
      const map = this.getMap();
      if (!map) return;
      const entities = Object.values(DATASTORE.ENTITIES);
      const player = entities.find(
        (e) => e.name === "avatar" && e.getMapId() === this.getMapId(),
      );
      if (!player) return;
      const monsterX = parseInt(this.getX());
      const monsterY = parseInt(this.getY());
      const playerX = parseInt(player.getX());
      const playerY = parseInt(player.getY());
      const dx = Math.abs(monsterX - playerX);
      const dy = Math.abs(monsterY - playerY);
      if (dx <= 1 && dy <= 1 && (dx > 0 || dy > 0)) {
        // console.log("TestAI: Monster adjacent to player, dealing damage");
        this.raiseMixinEvent("attacks", { src: this, target: player });
        player.raiseMixinEvent("damaged", {
          src: this,
          damageAmount: this.getMeleeDamage(),
        });
      }
    },
  },
  LISTENERS: {
    act: function () {
      // console.log("TestAI act called for:", this.name);
      const distance = this.getDistanceToPlayer();
      // console.log("TestAI: Distance to player:", distance);

      // Check if monster is adjacent to player and deal damage
      this.checkAdjacencyAndDamage();

      // Move toward player if within chase distance
      if (distance <= this.state._TestAI.chaseDistance) {
        // console.log("TestAI: Within chase distance, moving toward player");
        this.moveDirectlyToPlayer();
      } else {
        // console.log("TestAI: Too far from player, wandering randomly");
        this.moveRandomly();
      }

      // Signal that the action is done so the timing engine can continue
      this.raiseMixinEvent("actionDone");
    },
  },
};
