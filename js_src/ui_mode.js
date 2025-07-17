import { Message } from "./message.js";
import { MapMaker } from "./map.js";
import { DisplaySymbol } from "./display_symbol.js";
import { DATASTORE, clearDataStore } from "./datastore.js";
import { EntityFactory } from "./entity_templates.js";
import { TIME_ENGINE } from "./timing.js";

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
      const x = "__storage_test__";
      window.localStorage.setItem(x, x);
      window.localStorage.removeItem(x);
      return true;
    } catch (e) {
      Message.send(
        "Sorry, no local data storage is available for this browser so game save/load is not possible",
      );
      console.error(e);
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
    window.localStorage.setItem("roguelikegame", JSON.stringify(DATASTORE));
    this.showMessage("Game saved successfully!");
    return true;
  }

  loadGame() {
    if (!this.localStorageAvailable()) return false;
    const restorationString = window.localStorage.getItem("roguelikegame");
    if (!restorationString) {
      this.showMessage("No saved game found. Start a new game!");
      return false;
    }
    const state = JSON.parse(restorationString);
    if (!state.GAME || !state.MAPS || !state.ENTITIES) {
      this.showMessage("Invalid save data found. Starting new game.");
      window.localStorage.removeItem("roguelikegame");
      return false;
    }
    clearDataStore();
    DATASTORE.ID_SEQ = state.ID_SEQ;
    DATASTORE.GAME = this.game;
    this.game.fromJSON(state.GAME);
    const playState = this.game.modes.play.state;
    if (!playState.mapId || !playState.avatarId) {
      this.showMessage("Invalid save data - missing game state. Starting new game.");
      window.localStorage.removeItem("roguelikegame");
      return false;
    }
    for (const mapId in state.MAPS) {
      const mapData = JSON.parse(state.MAPS[mapId]);
      DATASTORE.MAPS[mapId] = MapMaker(mapData);
      DATASTORE.MAPS[mapId].build();
    }
    for (const entId in state.ENTITIES) {
      const entityData = JSON.parse(state.ENTITIES[entId]);
      if (!entityData.name) {
        console.warn("Entity missing name property:", entityData);
        continue;
      }
      try {
        const ent = EntityFactory.create(entityData.name);
        if (entityData.name == "avatar") {
          this.game.modes.play.state.avatarId = ent.getId();
        }
        DATASTORE.MAPS[Object.keys(DATASTORE.MAPS)[0]].addEntityAt(
          ent,
          entityData.x,
          entityData.y,
        );
      } catch (error) {
        console.error("Failed to create entity:", entityData.name, error);
        Message.send(`Failed to restore entity: ${entityData.name}`);
        continue;
      }
    }
    
    // Ensure camera is positioned correctly after loading
    if (this.game.modes.play && this.game.modes.play.moveCameraToAvatar) {
      this.game.modes.play.moveCameraToAvatar();
    }
    
    return true;
  }

  renderAvatar(display) {
    display.clear();
  }
}

export class StartupMode extends BaseUIMode {
  render(display) {
    display.drawText(2, 2, "Welcome");
    display.drawText(2, 3, "Press any key to continue");
  }
  handleInput(eventType, evt) {
    if (eventType == "keyup") {
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
  }
  enter() {
    console.log("PlayMode.enter() called");
    // Clear any pressed keys when entering play mode
    this.pressedKeys.clear();
    
    if (!this.state.avatarId || !DATASTORE.ENTITIES[this.state.avatarId]) {
      console.log("No avatar found in enter(), switching to persistence");
      this.showMessage("No game in progress. Please start a new game.");
      this.game.switchModes("persistence");
      return;
    }
    if (!this.state.mapId || !DATASTORE.MAPS[this.state.mapId]) {
      console.log("No map found in enter(), switching to persistence");
      this.showMessage("Invalid save data - missing map. Please start a new game.");
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
    
    TIME_ENGINE.unlock();
    this.cameraSymbol = new DisplaySymbol("@", "#eb4");
    this.startMovementTimer();
    
    // Set up player death listener
    console.log("About to call setupPlayerDeathListener in enter()");
    this.setupPlayerDeathListener();
  }
  exit() {
    this.stopMovementTimer();
    this.pressedKeys.clear();
  }
  startMovementTimer() {
    // Don't start multiple timers
    if (this.movementTimer) {
      console.log("Movement timer already running, not starting another");
      return;
    }
    console.log("Starting movement timer with delay:", this.movementDelay);
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
    for (const key of this.pressedKeys) {
      switch (key) {
        case "a": this.moveAvatar(-1, 0); break;
        case "d": this.moveAvatar(1, 0); break;
        case "w": this.moveAvatar(0, -1); break;
        case "s": this.moveAvatar(0, 1); break;
      }
    }
    if (this.pressedKeys.size > 0) this.game.render();
  }
  toJSON() { return JSON.stringify(this.state); }
  restoreFromState(stateData) { this.state = JSON.parse(stateData); }
  setupNewGame() {
    console.log("setupNewGame() called");
    
    // Clear any existing game data first
    console.log("Clearing existing game data before starting new game");
    clearDataStore();
    
    // Reset the game state
    this.state = { mapId: "", cameramapx: 0, cameramapy: 0 };
    this.state.avatarId = null;
    
    // Use the same dimensions as the main display to fill the whole screen
    const mapWidth = Math.floor(window.innerWidth / 8);
    const mapHeight = Math.floor(window.innerHeight / 16);
    const m = MapMaker({ xdim: mapWidth, ydim: mapHeight, mapType: "basic caves" });
    this.state.mapId = m.getId();
    Message.send("Building map....");
    this.game.renderMessage();
    m.build();
    
    // Create and place the avatar first
    const a = EntityFactory.create("avatar");
    this.state.avatarId = a.getId();
    console.log("Avatar created with ID:", this.state.avatarId);
    m.addEntityAtRandomPosition(a);
    
    // Position camera on the avatar immediately
    this.moveCameraToAvatar();
    
    // Add other entities
    for (let mossCount = 0; mossCount < 10; mossCount++) {
      m.addEntityAtRandomPosition(EntityFactory.create("moss"));
    }
    for (let monsterCount = 0; monsterCount < 1; monsterCount++) {
      const monster = EntityFactory.create("monster");
      console.log("Created monster with ID:", monster.getId());
      m.addEntityAtRandomPosition(monster);
      console.log("Monster assigned to map:", monster.getMapId());
      console.log("Available maps:", Object.keys(DATASTORE.MAPS));
    }
    
    setTimeout(() => {
      console.log("setupNewGame timeout - switching to play mode");
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
    const cameraX = typeof this.state.cameramapx === 'number' ? this.state.cameramapx : 0;
    const cameraY = typeof this.state.cameramapy === 'number' ? this.state.cameramapy : 0;
    
    DATASTORE.MAPS[this.state.mapId].render(
      display,
      cameraX,
      cameraY,
    );
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
      if (["a", "w", "s", "d"].includes(evt.key.toLowerCase())) {
        this.pressedKeys.add(evt.key.toLowerCase());
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
      if (["a", "w", "s", "d"].includes(evt.key.toLowerCase())) {
        this.pressedKeys.delete(evt.key.toLowerCase());
        return true;
      }
    }
    return false;
  }
  moveAvatar(dx, dy) {
    const avatar = this.getAvatar();
    if (!avatar) return false;
    
    if (avatar.tryWalk(dx, dy)) {
      this.moveCameraToAvatar();
      return true;
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
      console.log("getAvatar() called but no valid avatar found. avatarId:", this.state.avatarId, "entities:", Object.keys(DATASTORE.ENTITIES));
      return null;
    }
    return DATASTORE.ENTITIES[this.state.avatarId];
  }
  
  setupPlayerDeathListener() {
    const avatar = this.getAvatar();
    console.log("setupPlayerDeathListener called, avatar:", avatar ? avatar.name : "null");
    if (avatar) {
      // Add a listener for the playerKilled event
      avatar.playerKilledListener = this.handlePlayerKilled.bind(this);
      console.log("Player death listener set up for avatar:", avatar.name);
    } else {
      console.log("No avatar found for death listener setup - this is normal when starting fresh");
    }
  }
  
  handlePlayerKilled() {
    console.log("handlePlayerKilled called - switching to lose mode");
    
    // Stop movement timer to prevent further input
    this.stopMovementTimer();
    
    // Small delay to ensure all current operations complete
    setTimeout(() => {
      // Clear all game data
      console.log("Clearing all game data after player death");
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
        if (this.loadGame()) {
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
        if (this.loadGame()) {
          this.game.switchModes("play");
        }
        return true;
      }
      if (evt.key == "Escape") {
        this.game.switchModes("play");
        return true;
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
      this.game.switchModes("startup");
      return true;
    }
  }
}
