//defines mixins that can be added to ENTITIES
import { Message } from "./message.js";
import { SCHEDULER, TIME_ENGINE } from "./timing.js";
import { DATASTORE } from "./datastore.js";
import { getRandomOffset } from "./util.js";
import { Path } from "rot-js";

// Helper function to safely render the game
function safeGameRender() {
  if (typeof DATASTORE.GAME?.render === 'function' && 
      DATASTORE.GAME.curMode && 
      DATASTORE.GAME.display?.main?.o) {
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
        console.warn(`Entity ${this.name} cannot walk - no valid map reference`);
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
      const targetPositionInfo = map.getTargetPositionInfo(
        newX,
        newY,
      );
      // console.log(targetPositionInfo.entity);
      if (targetPositionInfo.entity) {
        // console.log(targetPositionInfo.entity);
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
        map.updateEntityPosition(this, this.state.x, this.state.y);

        this.raiseMixinEvent("walkClear", { status: "clear" });
        this.raiseMixinEvent("turnTaken", { timeUsed: 1 });
        this.raiseMixinEvent("actionDone");
        // If this is the player, notify monsters
        if (this.name === "avatar") {
          this.raiseMixinEvent("playerMoved");
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
        // console.log("destroying");
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
        // console.log("bumping entity");
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
      // console.log("ActorWanderer act called for:", this.name);
      TIME_ENGINE.lock();
      // Instead of moving directly, raise the act event for SmartMonsterAI to handle
      this.raiseMixinEvent("act");
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
      const player = entities.find(e => e.name === "avatar" && e.getMapId() === this.getMapId());
      if (!player) return Infinity;

      const dx = this.getX() - player.getX();
      const dy = this.getY() - player.getY();
      return Math.sqrt(dx * dx + dy * dy);
    },

    moveDirectlyToPlayer: function () {
      const map = this.getMap();
      if (!map) return;
      const entities = Object.values(DATASTORE.ENTITIES);
      const player = entities.find(e => e.name === "avatar" && e.getMapId() === this.getMapId());
      if (!player) return;

      const startX = parseInt(this.getX());
      const startY = parseInt(this.getY());
      const endX = parseInt(player.getX());
      const endY = parseInt(player.getY());

      // Calculate direction to player
      const dx = Math.sign(endX - startX);
      const dy = Math.sign(endY - startY);

      // Try different movement options in order of preference
      const moves = [
        [dx, dy],           // Direct diagonal movement
        [dx, 0],            // Horizontal movement only
        [0, dy],            // Vertical movement only
        [dx, -dy],          // Alternative diagonal
        [-dx, dy],          // Alternative diagonal
        [1, 0], [0, 1], [-1, 0], [0, -1]  // Any direction if all else fails
      ];

      for (const [moveX, moveY] of moves) {
        const newX = startX + moveX;
        const newY = startY + moveY;
        
        // Check if the new position is walkable
        const tile = map.getTile(newX, newY);
        const ent = map.getTargetPositionInfo(newX, newY).entity;
        if (tile.isA("floor") && !ent) {
          // console.log("Monster moving toward player from:", startX, startY, "to:", newX, newY);
          map.moveEntityTo(this, newX, newY);
          safeGameRender();
          return; // Successfully moved, exit
        }
      }
      
      // console.log("Monster cannot move toward player - all directions blocked");
    },

    moveTowardsPlayer: function () {
      // console.log("moveTowardsPlayer called for:", this.name);
      const map = this.getMap();
      if (!map) {
        // console.log("No map found for monster");
        return;
      }
      const entities = Object.values(DATASTORE.ENTITIES);
      const player = entities.find(e => e.name === "avatar" && e.getMapId() === this.getMapId());
      if (!player) {
        // console.log("No player found for monster");
        return;
      }

      const startX = parseInt(this.getX());
      const startY = parseInt(this.getY());
      const endX = parseInt(player.getX());
      const endY = parseInt(player.getY());
      
      // console.log("Monster at:", startX, startY, "Player at:", endX, endY);

      // Try pathfinding first
      const passableCallback = (x, y) => {
        if (x < 0 || y < 0 || x >= map.getXDim() || y >= map.getYDim()) {
          return false;
        }
        const tile = map.getTile(x, y);
        return tile.isA("floor");
      };

      const path = [];
      const astar = new Path.AStar(endX, endY, passableCallback, { topology: 4 });
      astar.compute(startX, startY, (x, y) => {
        path.push([x, y]);
      });
      
      // console.log("Path found:", path);

      if (path.length > 1) {
        const [nextX, nextY] = path[1];
        // console.log("Moving monster from:", startX, startY, "to:", nextX, nextY);
        map.moveEntityTo(this, nextX, nextY);
        // console.log("Monster moved, new position:", this.getX(), this.getY());
        safeGameRender();
        return; // Successfully moved
      } else {
        // console.log("No path found, trying to get closer to player");
        this.moveDirectlyToPlayer();
      }
      
      // If direct movement also failed, find the best opening toward the player
      if (this.getX() === startX && this.getY() === startY) {
        // console.log("Direct movement failed, finding best opening toward player");
        this.findPathToOpenSpace();
      }
    },

    moveRandomly: function () {
      const map = this.getMap();
      if (!map) return;
      
      const startX = parseInt(this.getX());
      const startY = parseInt(this.getY());
      
      // Find the player to prioritize movement toward them
      const entities = Object.values(DATASTORE.ENTITIES);
      const player = entities.find(e => e.name === "avatar" && e.getMapId() === this.getMapId());
      if (!player) return;
      
      const playerX = parseInt(player.getX());
      const playerY = parseInt(player.getY());
      
      // Calculate direction to player
      const dx = Math.sign(playerX - startX);
      const dy = Math.sign(playerY - startY);
      
      // Prioritize directions that get us closer to the player
      const directions = [
        [dx, dy],           // Direct toward player
        [dx, 0],            // Horizontal toward player
        [0, dy],            // Vertical toward player
        [dx, -dy],          // Alternative diagonal
        [-dx, dy],          // Alternative diagonal
        [1, 0], [0, 1], [-1, 0], [0, -1]  // Any direction as last resort
      ];
      
      // Try each direction until we find a valid move
      for (const [moveX, moveY] of directions) {
        const newX = startX + moveX;
        const newY = startY + moveY;
        
        // Check if the new position is walkable
        const tile = map.getTile(newX, newY);
        const ent = map.getTargetPositionInfo(newX, newY).entity;
        if (tile.isA("floor") && !ent) {
          // console.log("Monster moving toward player from:", startX, startY, "to:", newX, newY);
          map.moveEntityTo(this, newX, newY);
          safeGameRender();
          return; // Successfully moved
        }
      }
      
      // All directions are blocked, we're completely trapped
      // console.log("Monster completely trapped - no movement possible");
    },

    findPathToOpenSpace: function () {
      const map = this.getMap();
      if (!map) return;
      
      const startX = parseInt(this.getX());
      const startY = parseInt(this.getY());
      
      // Find the player to calculate distances
      const entities = Object.values(DATASTORE.ENTITIES);
      const player = entities.find(e => e.name === "avatar" && e.getMapId() === this.getMapId());
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
                const distanceToPlayer = Math.sqrt((checkX - playerX) ** 2 + (checkY - playerY) ** 2);
                // Calculate current distance to player
                const currentDistanceToPlayer = Math.sqrt((startX - playerX) ** 2 + (startY - playerY) ** 2);
                
                // Score: prefer openings that are close AND get us closer to the player
                const score = distanceToOpening + (distanceToPlayer - currentDistanceToPlayer) * 2;
                
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
          // console.log("Monster escaping toward player via opening at:", bestOpening.x, bestOpening.y, "moving to:", newX, newY);
          map.moveEntityTo(this, newX, newY);
          safeGameRender();
          return; // Successfully moved
        }
      }
      
      // console.log("Monster completely trapped - no strategic escape path found");
    }
  },
  LISTENERS: {
    act: function () {
      // console.log("SmartMonsterAI act called for:", this.name);
      const distance = this.getDistanceToPlayer();
      // console.log("Distance to player:", distance);

      // Always try to move toward the player, regardless of distance
      this.moveTowardsPlayer();
      
      // If we couldn't move toward the player at all, we're completely trapped
      const startX = parseInt(this.getX());
      const startY = parseInt(this.getY());
      if (this.getX() === startX && this.getY() === startY) {
        // console.log("Monster completely trapped - cannot move toward player");
      }
    },

    // Listen for player movement to trigger monster movement
    playerMoved: function () {
      // console.log("Monster responding to player movement:", this.name);
      // Monster gets a turn when player moves
      this.act();
      // Ensure monster's position is updated on the map and re-rendered
      if (this.getMap()) {
        this.getMap().updateEntityPosition(this, this.getX(), this.getY());
      }
      safeGameRender();
    }
  }
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
      const player = entities.find(e => e.name === "avatar" && e.getMapId() === this.getMapId());
      if (!player) return Infinity;

      const dx = parseInt(this.getX()) - parseInt(player.getX());
      const dy = parseInt(this.getY()) - parseInt(player.getY());
      return Math.sqrt(dx * dx + dy * dy);
    },

    hasLineOfSight: function () {
      const map = this.getMap();
      if (!map) return false;
      const entities = Object.values(DATASTORE.ENTITIES);
      const player = entities.find(e => e.name === "avatar" && e.getMapId() === this.getMapId());
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
      const player = entities.find(e => e.name === "avatar" && e.getMapId() === this.getMapId());
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
      
      // Check if the new position is walkable
      const tile = map.getTile(newX, newY);
      const ent = map.getTargetPositionInfo(newX, newY).entity;
      if (tile.isA("floor") && !ent) {
        // console.log("Balanced monster moving directly toward player from:", startX, startY, "to:", newX, newY);
        map.moveEntityTo(this, newX, newY);
        safeGameRender();
      } else {
        // Can't move directly toward player, fall back to random movement
        // console.log("Balanced monster: direct path blocked, moving randomly");
        this.moveRandomly();
      }
    },

    moveRandomly: function () {
      const map = this.getMap();
      if (!map) return;
      
      const startX = parseInt(this.getX());
      const startY = parseInt(this.getY());
      
      // Check all 8 possible directions in random order
      const directions = [
        [-1, -1], [-1, 0], [-1, 1],  // Top row
        [0, -1],           [0, 1],   // Middle row (skip [0,0] - current position)
        [1, -1],  [1, 0],  [1, 1]    // Bottom row
      ];
      
      // Shuffle the directions to make movement truly random
      for (let i = directions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [directions[i], directions[j]] = [directions[j], directions[i]];
      }
      
      // Try each direction until we find a valid move
      for (const [dx, dy] of directions) {
        const newX = startX + dx;
        const newY = startY + dy;
        
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
      const player = entities.find(e => e.name === "avatar" && e.getMapId() === this.getMapId());
      if (!player) return;

      const startX = parseInt(this.getX());
      const startY = parseInt(this.getY());
      const endX = parseInt(player.getX());
      const endY = parseInt(player.getY());

      // Pathfinding callback: returns true if the tile is walkable
      const passableCallback = (x, y) => {
        if (x < 0 || y < 0 || x >= map.getXDim() || y >= map.getYDim()) {
          return false;
        }
        const tile = map.getTile(x, y);
        return tile.isA("floor");
      };

      const path = [];
      const astar = new Path.AStar(endX, endY, passableCallback, { topology: 4 });
      astar.compute(startX, startY, (x, y) => {
        path.push([x, y]);
      });

      if (path.length > 1) {
        const [nextX, nextY] = path[1];
        // console.log("Balanced monster following path from:", startX, startY, "to:", nextX, nextY);
        map.moveEntityTo(this, nextX, nextY);
        safeGameRender();
      } else {
        // No path found, move randomly to avoid getting stuck
        // console.log("Balanced monster: no path found, moving randomly");
        this.moveRandomly();
      }
    }
  },
  LISTENERS: {
    act: function () {
      // console.log("BalancedMonsterAI act called for:", this.name);
      const distance = this.getDistanceToPlayer();
      // console.log("Distance to player:", distance);

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
        // Far from player, move randomly
        // console.log("Balanced monster far from player - moving randomly");
        this.moveRandomly();
      }
    },

    // Listen for player movement to trigger monster movement
    playerMoved: function () {
      // console.log("Balanced monster responding to player movement:", this.name);
      this.act();
      if (this.getMap()) {
        this.getMap().updateEntityPosition(this, this.getX(), this.getY());
      }
      safeGameRender();
    }
  }
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
      
      // Simple random direction selection
      const directions = [
        [-1, -1], [-1, 0], [-1, 1],  // Top row
        [0, -1],           [0, 1],   // Middle row (skip [0,0] - current position)
        [1, -1],  [1, 0],  [1, 1]    // Bottom row
      ];
      
      // Pick a random direction
      const randomIndex = Math.floor(Math.random() * directions.length);
      const [dx, dy] = directions[randomIndex];
      
      const newX = startX + dx;
      const newY = startY + dy;
      
      // Check if the new position is walkable
      const tile = map.getTile(newX, newY);
      const ent = map.getTargetPositionInfo(newX, newY).entity;
      if (tile.isA("floor") && !ent) {
        // console.log("Dumb monster moving from:", startX, startY, "to:", newX, newY);
        map.moveEntityTo(this, newX, newY);
        safeGameRender();
      } 
    }
  },
  LISTENERS: {
    act: function () {
      // console.log("DumbMonsterAI act called for:", this.name);
      this.moveRandomly();
    },

    // Listen for player movement to trigger monster movement
    playerMoved: function () {
      // console.log("Dumb monster responding to player movement:", this.name);
      this.act();
      if (this.getMap()) {
        this.getMap().updateEntityPosition(this, this.getX(), this.getY());
      }
      safeGameRender();
    }
  }
};