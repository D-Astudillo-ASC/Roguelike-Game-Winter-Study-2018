import { Message } from "./message.js";
import { MapMaker } from "./map.js";
import { DisplaySymbol } from "./display_symbol.js";
import { DATASTORE, clearDataStore } from "./datastore.js";
import { EntityFactory } from "./entity_templates.js";
import { TIME_ENGINE, SCHEDULER } from "./timing.js";

class BaseUIMode {
  constructor(thegame) {
    this.game = thegame;
  }

  showMessage(msg) {
    Message.send(msg);
    this.game.render();
  }

  localStorageAvailable() {
    try {
      const test = "test";
      window.localStorage.setItem(test, test);
      window.localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  clearLocalStorage() {
    try {
      window.localStorage.removeItem("roguelikegame");
      // console.log("LocalStorage cleared successfully");
      return true;
    } catch (error) {
      console.error("Failed to clear localStorage:", error);
      return false;
    }
  }

  safeLoadGame() {
    if (!this.localStorageAvailable()) return false;

    try {
      // console.log("safeLoadGame() called");

      // Set loading flag to prevent mixins from adding entities to scheduler during loading
      DATASTORE._isLoading = true;

      const restorationString = window.localStorage.getItem("roguelikegame");
      // console.log("restorationString:", restorationString);

      if (!restorationString) {
        // console.log("No saved game found. Start a new game!");
        this.showMessage("No saved game found. Start a new game!");
        return false;
      }

      // Parse the main save data
      const state = JSON.parse(restorationString);
      if (!state.GAME_STATE || !state.MAPS || !state.ENTITIES) {
        this.showMessage("Invalid save data found. Starting new game.");
        window.localStorage.removeItem("roguelikegame");
        return false;
      }

      // Clear existing data
      clearDataStore();
      DATASTORE.ID_SEQ = state.ID_SEQ;
      DATASTORE.GAME = this.game;

      // Restore game state
      this.game.fromJSON(state);
      const playState = this.game.modes.play.state;
      if (!playState.mapId || !playState.avatarId) {
        this.showMessage(
          "Invalid save data - missing game state. Starting new game.",
        );
        window.localStorage.removeItem("roguelikegame");
        return false;
      }

      // Restore maps
      for (const mapId in state.MAPS) {
        try {
          const mapData = JSON.parse(state.MAPS[mapId]);
          DATASTORE.MAPS[mapId] = MapMaker(mapData);
          DATASTORE.MAPS[mapId].build();
        } catch (error) {
          console.error(`Failed to parse map data for ${mapId}:`, error);
          continue;
        }
      }

      // Restore entities
      for (const entId in state.ENTITIES) {
        try {
          const entityData = JSON.parse(state.ENTITIES[entId]);
          if (!entityData.name) {
            console.warn("Entity missing name property:", entityData);
            continue;
          }

          // Log the saved position from the save file
          // console.log(`(LOAD) [${entId}] ${entityData.name} - Saved position: (${entityData.x},${entityData.y})`);

          // Create entity with the saved name
          const ent = EntityFactory.create(entityData.name);

          // Get the generated ID and remove the entity from the datastore
          const generatedId = ent.getId();
          delete DATASTORE.ENTITIES[generatedId];

          // Restore the saved ID
          ent.setId(entId);
          // DO NOT set mapId, x, y directly! Use addEntityAt only.
          DATASTORE.ENTITIES[entId] = ent;

          // Set avatar ID for the player
          if (entityData.name === "avatar") {
            this.game.modes.play.state.avatarId = entId;
          }

          // Add entity to its map (this sets mapId, x, y and updates map tables)
          const map = DATASTORE.MAPS[entityData.mapId];
          if (map) {
            // console.log(`(LOAD) [${entId}] ${entityData.name} - Before addEntityAt: entity pos: (${ent.getX()},${ent.getY()})`);
            map.addEntityAt(ent, entityData.x, entityData.y);
            // console.log(`(LOAD) [${entId}] ${entityData.name} - After addEntityAt: entity pos: (${ent.getX()},${ent.getY()}), map pos: ${map.state.entityIdToMapPos[entId]}`);
          } else {
            console.error(`Map ${entityData.mapId} not found for entity ${entityData.name} (${entId})`);
          }

          // Restore mixin data AFTER entity is positioned on map
          // Position data is now managed by the map, not stored in entity state
          for (const mixinName in entityData) {
            if (
              mixinName.startsWith("_") &&
              mixinName !== "_id" &&
              mixinName !== "_name"
            ) {
              const mixinData = entityData[mixinName];
              // Directly restore the mixin state, but exclude position data
              if (ent.state[mixinName]) {
                // Filter out position data from mixin state to prevent overwriting correct position
                const filteredMixinData = { ...mixinData };
                delete filteredMixinData.x;
                delete filteredMixinData.y;
                delete filteredMixinData.mapId;
                
                Object.assign(ent.state[mixinName], filteredMixinData);
                // console.log(`(LOAD) [${entId}] ${entityData.name} - After mixin restore (${mixinName}): entity pos: (${ent.getX()},${ent.getY()})`);
              }
            }
          }

          // Also restore any non-mixin state fields, but exclude position data
          for (const fieldName in entityData) {
            if (
              !fieldName.startsWith("_") &&
              fieldName !== "x" &&
              fieldName !== "y" &&
              fieldName !== "mapId" &&
              fieldName !== "id" &&
              fieldName !== "name"
            ) {
              ent.state[fieldName] = entityData[fieldName];
              // console.log(`(LOAD) [${entId}] ${entityData.name} - Restored entity state field ${fieldName}:`, entityData[fieldName]);
            }
          }

          // console.log(`(LOAD) [${entId}] ${entityData.name} - After all restoration: entity pos: (${ent.getX()},${ent.getY()})`);
        } catch (error) {
          console.error(`Failed to parse entity data for ${entId}:`, error);
          continue;
        }
      }

      // --- POSITION SYNCHRONIZATION REMOVED ---
      // The map.addEntityAt() calls above already handle position synchronization correctly
      // No need for additional syncEntityPosition calls that can cause position corruption

      // --- MODERN SCHEDULER RESTORE (2025 style) ---
      // Clear loading flag so mixin initializers don't skip scheduler
      DATASTORE._isLoading = false;

      // Add only scheduled actors to the scheduler (player, monsters with ActorWanderer)
      for (const entId in DATASTORE.ENTITIES) {
        const ent = DATASTORE.ENTITIES[entId];
        if (!ent.mixins) continue;
        // Add player (ActorPlayer)
        if (
          ent.mixins.some((m) => m.META && m.META.mixInName === "ActorPlayer")
        ) {
          SCHEDULER.add(ent, true, 1);
          // console.log(`Added player ${entId} to scheduler`);
        }
        // Add monsters with ActorWanderer
        if (
          ent.mixins.some((m) => m.META && m.META.mixInName === "ActorWanderer")
        ) {
          SCHEDULER.add(ent, true, 1000);
          // console.log(`Added monster ${entId} to scheduler`);
        }
      }

      // Unlock the engine so the game loop resumes
      if (typeof TIME_ENGINE.unlock === "function") {
        TIME_ENGINE.unlock();
      }

      // Position camera on avatar
      if (this.game.modes.play && this.game.modes.play.moveCameraToAvatar) {
        this.game.modes.play.moveCameraToAvatar();
      }

      this.showMessage("Game loaded successfully!");
      return true;
    } catch (error) {
      console.error("Error in safeLoadGame:", error);
      this.showMessage("Failed to load game. Starting fresh.");
      window.localStorage.removeItem("roguelikegame");
      return false;
    }
  }

  saveGame() {
    if (!this.localStorageAvailable()) return false;
    if (!DATASTORE.MAPS || Object.keys(DATASTORE.MAPS).length === 0) {
      this.showMessage("No game to save. Start a new game first!");
      return false;
    }
    if (!DATASTORE.ENTITIES || Object.keys(DATASTORE.ENTITIES).length === 0) {
      this.showMessage("No game to save. Start a new game first!");
      return false;
    }

    // Save only the essential game state, not the entire game object
    const saveData = {
      ID_SEQ: DATASTORE.ID_SEQ,
      MAPS: DATASTORE.MAPS,
      ENTITIES: DATASTORE.ENTITIES,
      GAME_STATE: {
        randomSeed: this.game._randomSeed,
        playModeState: this.game.modes.play.state,
      },
    };

    window.localStorage.setItem("roguelikegame", JSON.stringify(saveData));
    this.showMessage("Game saved successfully!");
    return true;
  }

  renderAvatar(display) {
    display.clear();
  }
}

export class StartupMode extends BaseUIMode {
  enter() {
    this.readyForInput = false;
    setTimeout(() => {
      this.readyForInput = true;
    }, 100);
  }
  render(display) {
    display.drawText(2, 2, "Welcome");
    display.drawText(2, 3, "Press any key to continue");
  }
  handleInput(eventType, evt) {
    if (eventType == "keyup" && this.readyForInput) {
      this.game.switchModes("persistence");
      return true;
    }
  }
}

export class PlayMode extends BaseUIMode {
  constructor(thegame) {
    super(thegame);
    this.state = { mapId: "", cameramapx: 0, cameramapy: 0 };
    this.pressedKeys = new Set();
    this.movementTimer = null;
    this.movementDelay = 100;
    this.lastKeyPressTime = 0;
  }
  enter() {
    // console.log("PlayMode.enter() called");
    // Clear any pressed keys when entering play mode
    this.pressedKeys.clear();

    if (!this.state.avatarId || !DATASTORE.ENTITIES[this.state.avatarId]) {
      // console.log("No avatar found in enter(), switching to persistence");
      this.showMessage("No game in progress. Please start a new game.");
      this.game.switchModes("persistence");
      return;
    }
    if (!this.state.mapId || !DATASTORE.MAPS[this.state.mapId]) {
      // console.log("No map found in enter(), switching to persistence");
      this.showMessage(
        "Invalid save data - missing map. Please start a new game.",
      );
      this.game.switchModes("persistence");
      return;
    }
    if (!this.state.mapId) {
      const m = MapMaker({ xdim: 300, ydim: 160, mapType: "basic caves" });
      this.state.mapId = m.getId();
      m.build();
      // Don't set hardcoded camera coordinates - let moveCameraToAvatar handle it
    }

    // Ensure camera is centered on the player when entering play mode
    this.moveCameraToAvatar();

    // TIME_ENGINE.unlock();
    // if (typeof TIME_ENGINE.start === "function") {
    //   TIME_ENGINE.start();
    // }
    this.cameraSymbol = new DisplaySymbol("@", "#eb4");
    this.startMovementTimer();

    // Set up player death listener
    // console.log("About to call setupPlayerDeathListener in enter()");
    this.setupPlayerDeathListener();
  }
  exit() {
    this.stopMovementTimer();
    this.pressedKeys.clear();
  }
  startMovementTimer() {
    // Don't start multiple timers
    if (this.movementTimer) {
      // console.log("Movement timer already running, not starting another");
      return;
    }
    // console.log("Starting movement timer with delay:", this.movementDelay);
    this.movementTimer = setInterval(() => {
      this.processContinuousMovement();
    }, this.movementDelay);
  }
  stopMovementTimer() {
    if (this.movementTimer) {
      clearInterval(this.movementTimer);
      this.movementTimer = null;
    }
  }
  processContinuousMovement() {
    if (this.pressedKeys.size > 0) {
      // Only process continuous movement if enough time has passed since the last key press
      const timeSinceLastPress = Date.now() - this.lastKeyPressTime;
      if (timeSinceLastPress > 200) {
        // 200ms delay before continuous movement starts
        // console.log(
        //   "Processing continuous movement for keys:",
        //   Array.from(this.pressedKeys),
        // );
        for (const key of this.pressedKeys) {
          switch (key) {
            case "a":
              this.moveAvatar(-1, 0);
              break;
            case "d":
              this.moveAvatar(1, 0);
              break;
            case "w":
              this.moveAvatar(0, -1);
              break;
            case "s":
              this.moveAvatar(0, 1);
              break;
          }
        }
        this.game.render();
      }
    }
  }
  toJSON() {
    return JSON.stringify(this.state);
  }
  restoreFromState(stateData) {
    // stateData is already an object, not a JSON string
    if (typeof stateData === "string") {
      this.state = JSON.parse(stateData);
    } else {
      this.state = stateData;
    }
  }
  setupNewGame() {
    // console.log("setupNewGame() called");

    // Only reset in-memory state, do not clear persistent storage
    // console.log("Clearing existing game data before starting new game");
    // clearDataStore();

    // Reset the game state
    this.state = { mapId: "", cameramapx: 0, cameramapy: 0 };
    this.state.avatarId = null;

    // Use the same dimensions as the main display to fill the whole screen
    const mapWidth = Math.floor(window.innerWidth / 8);
    const mapHeight = Math.floor(window.innerHeight / 16);
    const m = MapMaker({
      xdim: mapWidth,
      ydim: mapHeight,
      mapType: "basic caves",
    });
    this.state.mapId = m.getId();
    // console.log("Map created with ID:", m.getId());
    // console.log(
    //   "Available maps in DATASTORE.MAPS after MapMaker:",
    //   Object.keys(DATASTORE.MAPS),
    // );
    Message.send("Building map....");
    this.game.renderMessage();
    m.build();

    // Create and place the avatar first
    const a = EntityFactory.create("avatar");
    this.state.avatarId = a.getId();
    // console.log("Avatar created with ID:", this.state.avatarId);
    m.addEntityAtRandomPosition(a);

    // Position camera on the avatar immediately
    this.moveCameraToAvatar();

    // Add other entities
    for (let mossCount = 0; mossCount < 10; mossCount++) {
      m.addEntityAtRandomPosition(EntityFactory.create("moss"));
    }
    for (let monsterCount = 0; monsterCount < 1; monsterCount++) {
      const monster = EntityFactory.create("monster");
      // console.log("Created monster with ID:", monster.getId());
      m.addEntityAtRandomPosition(monster);
      // --- SAFETY: Ensure monster's mapId is valid ---
      if (!DATASTORE.MAPS[monster.getMapId()]) {
        console.warn(
          "Monster mapId invalid after placement! Forcibly setting to current map.",
        );
        monster.setMapId(m.getId());
      }
      // console.log("Monster assigned to map:", monster.getMapId());
      // console.log("Available maps:", Object.keys(DATASTORE.MAPS));
      if (!DATASTORE.MAPS[monster.getMapId()]) {
        console.error(
          "Monster's mapId STILL invalid! Monster will not act correctly.",
        );
      }
    }

    setTimeout(() => {
      // console.log("setupNewGame timeout - switching to play mode");
      Message.clear();
      this.game.renderMessage();
      this.game.switchModes("play");
    }, 2000);
  }
  render(display) {
    if (!display) {
      // console.warn("PlayMode.render called with invalid display");
      return;
    }

    display.clear();
    if (!this.state.mapId || !DATASTORE.MAPS[this.state.mapId]) {
      display.drawText(2, 2, "No map available");
      return;
    }

    // Ensure camera coordinates are valid numbers
    const cameraX =
      typeof this.state.cameramapx === "number" ? this.state.cameramapx : 0;
    const cameraY =
      typeof this.state.cameramapy === "number" ? this.state.cameramapy : 0;

    DATASTORE.MAPS[this.state.mapId].render(display, cameraX, cameraY);
  }
  renderAvatar(display) {
    if (!display) {
      console.warn("PlayMode.renderAvatar called with invalid display");
      return;
    }

    display.clear();
    const a = this.getAvatar();
    if (!a) return;
    display.drawText(1, 0, "AVATAR: " + a.chr);
    display.drawText(1, 2, "Time: " + a.getTime());
    display.drawText(1, 3, "Location: " + a.getX() + "," + a.getY());
    display.drawText(1, 4, "HP: " + a.getHp() + "/" + a.getMaxHp());
  }
  handleInput(eventType, evt) {
    if (eventType == "keydown") {
      const key = evt.key.toLowerCase();
      if (["a", "w", "s", "d"].includes(key)) {
        const wasAlreadyHeld = this.pressedKeys.has(key);
        this.pressedKeys.add(key);

        // Move immediately if this is a new direction (not already held) and not a repeat
        if (!evt.repeat && !wasAlreadyHeld) {
          this.lastKeyPressTime = Date.now();
          switch (key) {
            case "a":
              this.moveAvatar(-1, 0);
              break;
            case "d":
              this.moveAvatar(1, 0);
              break;
            case "w":
              this.moveAvatar(0, -1);
              break;
            case "s":
              this.moveAvatar(0, 1);
              break;
          }
          this.game.render();
        }
        return true;
      }
      if (evt.key == "p") {
        // Prevent key repeat events from causing flickering
        if (evt.repeat) return true;
        this.game.switchModes("pause");
        Message.send("Paused");
        return true;
      }
    }
    if (eventType == "keyup") {
      const key = evt.key.toLowerCase();
      if (["a", "w", "s", "d"].includes(key)) {
        this.pressedKeys.delete(key);

        // If other keys are still held, move immediately in the next held direction
        if (this.pressedKeys.size > 0) {
          // Move in the direction of the most recently pressed key
          const nextKey = Array.from(this.pressedKeys).pop();
          this.lastKeyPressTime = Date.now();
          switch (nextKey) {
            case "a":
              this.moveAvatar(-1, 0);
              break;
            case "d":
              this.moveAvatar(1, 0);
              break;
            case "w":
              this.moveAvatar(0, -1);
              break;
            case "s":
              this.moveAvatar(0, 1);
              break;
          }
          this.game.render();
        }
        return true;
      }
    }
    return false;
  }
  moveAvatar(dx, dy) {
    const avatar = this.getAvatar();
    if (!avatar) return false;

    // console.log(
    //   "Player attempting to move:",
    //   dx,
    //   dy,
    //   "from position:",
    //   avatar.getX(),
    //   avatar.getY(),
    // );

    if (avatar.tryWalk(dx, dy)) {
      // console.log(
      //   "Player moved to new position:",
      //   avatar.getX(),
      //   avatar.getY(),
      // );
      this.moveCameraToAvatar();
      this.game.render(); // --- FIX 8: Ensure camera is updated after every player move ---

      // --- FIX 9: Add debugging after player move to verify entity positions ---
      setTimeout(() => {
        for (const entId in DATASTORE.ENTITIES) {
          const ent = DATASTORE.ENTITIES[entId];
          if (ent.name === "monster") {
            const map = ent.getMap();
            if (map) {
              const mapPos = map.state.entityIdToMapPos[ent.getId()];
              const entPos = `${ent.getX()},${ent.getY()}`;
              // console.log(
              //   `After player move: monster (${ent.getId()}) entity pos ${entPos}, map pos ${mapPos}`,
              // );
              if (mapPos !== entPos) {
                console.warn(
                  `POSITION MISMATCH after player move: monster entity ${entPos} vs map ${mapPos}`,
                );
                // REMOVED: Incorrect position "fix" that was corrupting monster positions
                // The map's movement system already handles position synchronization correctly
              }
              // Debug: Compare entity object references
              if (mapPos) {
                const [mx, my] = mapPos.split(",").map(Number);
                const mapEnt = map.getTargetPositionInfo(mx, my).entity;
                // if (mapEnt !== ent) {
                //   console.error(
                //     `ENTITY REFERENCE MISMATCH: DATASTORE.ENTITIES[${entId}] !== map entity at (${mx},${my})`,
                //     mapEnt,
                //     ent
                //   );
                // } else {
                //   console.log(
                //     `ENTITY REFERENCE MATCH: DATASTORE.ENTITIES[${entId}] === map entity at (${mx},${my})`
                //   );
                // }
              }
            }
          }
        }
      }, 10);

      return true;
    } else {
      // console.log("Player movement blocked");
    }
    return false;
  }
  moveCameraToAvatar() {
    const avatar = this.getAvatar();
    if (avatar) {
      this.state.cameramapx = avatar.getX();
      this.state.cameramapy = avatar.getY();
    } else {
      // Fallback to safe coordinates if avatar is not available
      this.state.cameramapx = 0;
      this.state.cameramapy = 0;
    }
  }
  getAvatar() {
    if (!this.state.avatarId || !DATASTORE.ENTITIES[this.state.avatarId]) {
      // console.log(
      //   "getAvatar() called but no valid avatar found. avatarId:",
      //   this.state.avatarId,
      //   "entities:",
      //   Object.keys(DATASTORE.ENTITIES),
      // );
      return null;
    }
    return DATASTORE.ENTITIES[this.state.avatarId];
  }

  setupPlayerDeathListener() {
    const avatar = this.getAvatar();
    // console.log(
    //   "setupPlayerDeathListener called, avatar:",
    //   avatar ? avatar.name : "null",
    // );
    if (avatar) {
      // Add a listener for the playerKilled event
      avatar.playerKilledListener = this.handlePlayerKilled.bind(this);
      // console.log("Player death listener set up for avatar:", avatar.name);
    } else {
      // console.log(
      //   "No avatar found for death listener setup - this is normal when starting fresh",
      // );
    }
  }

  handlePlayerKilled() {
    // console.log("handlePlayerKilled called - switching to lose mode");

    // Stop movement timer to prevent further input
    this.stopMovementTimer();

    // Small delay to ensure all current operations complete
    setTimeout(() => {
      // Clear all game data
      // console.log("Clearing all game data after player death");
      clearDataStore();

      // Reset the game state
      this.state = { mapId: "", cameramapx: 0, cameramapy: 0 };
      this.state.avatarId = null;

      // Switch to lose mode
      this.game.switchModes("lose");
    }, 10);
  }
}

export class PauseMode extends BaseUIMode {
  render(display) {
    display.clear();
    display.drawText(2, 2, "== PAUSED ==");
    display.drawText(2, 4, "Press 'P' or 'Escape' to resume");
    display.drawText(2, 5, "Press 'S' to save game");
    display.drawText(2, 6, "Press 'L' to load game");
  }
  handleInput(eventType, evt) {
    // Handle both keydown and keyup to prevent flickering
    if (eventType === "keydown") {
      // Prevent key repeat events from causing flickering
      if (evt.repeat) {
        return true;
      }

      if (evt.key === "p" || evt.key === "Escape") {
        this.game.switchModes("play");
        return true;
      }
      if (evt.key === "s" || evt.key === "S") {
        this.saveGame();
        return true;
      }
      if (evt.key === "l" || evt.key === "L") {
        if (this.safeLoadGame()) {
          this.game.switchModes("play");
        }
        return true;
      }
    }

    // Handle keyup events to prevent key repeat issues
    if (eventType === "keyup") {
      if (evt.key === "p" || evt.key === "Escape") {
        // Don't switch modes on keyup, only on keydown
        return true;
      }
      if (evt.key === "s" || evt.key === "S") {
        return true;
      }
      if (evt.key === "l" || evt.key === "L") {
        return true;
      }
    }

    // Return true for any key event to prevent them from bubbling up
    return true;
  }
}

export class PersistenceMode extends BaseUIMode {
  render(display) {
    display.clear();
    display.drawText(2, 3, "N for New Game");
    display.drawText(2, 4, "S to Save Game");
    display.drawText(2, 5, "L to Load Game");
  }
  handleInput(eventType, evt) {
    if (eventType == "keyup") {
      if (evt.key == "N" || evt.key == "n") {
        this.game.setupNewGame();
        this.game.switchModes("play");
        return true;
      }
      if (evt.key == "S" || evt.key == "s") {
        if (this.saveGame()) {
          this.game.switchModes("play");
        }
        return true;
      }
      if (evt.key == "L" || evt.key == "l") {
        if (this.safeLoadGame()) {
          this.game.switchModes("play");
          return true;
        }
      }
    }
    return false;
  }
}

export class WinMode extends BaseUIMode {
  render(display) {
    display.clear();
    display.drawText(2, 2, "Victory!!!");
  }
  handleInput(eventType, evt) {
    if (evt.key == "Escape") {
      this.game.switchModes("play");
      return true;
    }
  }
}

export class LoseMode extends BaseUIMode {
  render(display) {
    display.clear();
    display.drawText(2, 2, "Game Over");
    display.drawText(2, 4, "Press Escape to return to start screen");
  }
  handleInput(eventType, evt) {
    if (evt.key == "Escape") {
      const mainDisplay = this.game.getDisplay("main");
      if (mainDisplay && mainDisplay.clear) mainDisplay.clear();

      Message.clear();
      this.game.renderMessage();
      this.game.switchModes("startup");
      return true;
    }
  }
}
