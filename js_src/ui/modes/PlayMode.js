import { BaseUIMode } from "./BaseUIMode.js";
import { getCommandFromInput, getCurrentMovementDirection, COMMAND, setKeyBinding, clearAllMovementKeys } from "../../systems/Commands.js";
import { DATASTORE } from "../../core/DataStore.js";
import { EntityFactory } from "../../entities/templates/EntityTemplates.js";
import { MapMaker } from "../../world/Map.js";
import { SCHEDULER, TIME_ENGINE } from "../../systems/Timing.js";
import { GAME_CONFIG } from "../../utils/Constants.js";
import { Message } from "../components/MessageSystem.js";

export class PlayMode extends BaseUIMode {
  constructor(thegame) {
    super(thegame);
    this.state = {
      mapId: "",
      avatarId: "",
      cameraX: 0,
      cameraY: 0,
    };
    this.movementTimer = null;
    this.continuousMovement = null;
    this.pressedKeys = new Set();
    this.lastKeyPressTime = 0;
    this.lastPauseTime = 0;
    this.lastTurnTime = 0;
    this.turnCooldown = 50; // Reduced for smoother movement
  }

  enter() {
    setKeyBinding(["universal", "play", "movement_numpad"]);
    
    // Clear any leftover movement state
    clearAllMovementKeys();
    this.stopContinuousMovement();
    this.stopContinuousMovementCheck();
    
    // Ensure camera is positioned on avatar when entering play mode
    this.moveCameraToAvatar();
    // Do not call setupNewGame here
    
    // Start the custom game engine
    TIME_ENGINE.start();
    
    // Start efficient continuous movement check
    this.startContinuousMovementCheck();
  }

  exit() {
    this.stopMovementTimer();
    // Stop the game engine when leaving play mode
    TIME_ENGINE.stop();
    
    // Stop continuous movement when pausing
    this.stopContinuousMovement();
    this.stopContinuousMovementCheck();
  }

  // Efficient continuous movement system
  startContinuousMovementCheck() {
    if (this.continuousMovementCheckTimer) return;
    
    this.continuousMovementCheckTimer = setInterval(() => {
      if (window.continuousMovementRequested) {
        window.continuousMovementRequested = false;
        this.processContinuousMovement();
      }
    }, 25); // Faster check for smoother direction changes
  }

  stopContinuousMovementCheck() {
    if (this.continuousMovementCheckTimer) {
      clearInterval(this.continuousMovementCheckTimer);
      this.continuousMovementCheckTimer = null;
    }
  }

  // Movement timers disabled for performance
  startMovementTimer() {
    // Disabled
  }

  stopMovementTimer() {
    // Disabled
  }

  // Efficient continuous movement processing
  processContinuousMovement() {
    const avatar = this.getAvatar();
    if (!avatar) return;

    const map = avatar.getMap();
    if (!map) return;

    // Check turn cooldown
    const now = Date.now();
    if (now - this.lastTurnTime < this.turnCooldown) {
      return;
    }

    // Get current movement direction from pressed keys
    const movement = getCurrentMovementDirection();
    if (movement.command === COMMAND.MOVE_WAIT) return;

    // Process movement - if blocked, stop continuous movement
    if (avatar.tryWalk && avatar.tryWalk(movement.dx, movement.dy)) {
      this.moveCameraToAvatar();
      
      // Signal that player has taken their turn
      TIME_ENGINE.playerTookTurn();
      this.lastTurnTime = now;
      
      // Render once after complete turn
      this.game.render();
    } else {
      // Movement was blocked - stop continuous movement to prevent dragging
      this.stopContinuousMovement();
    }
  }

  startContinuousMovement(dx, dy) {
    // Not needed with new system
  }

  stopContinuousMovement() {
    // Clear the flag
    window.continuousMovementRequested = false;
  }

  toJSON() {
    return this.state;
  }

  restoreFromState(stateData) {
    this.state = { ...this.state, ...stateData };
  }

  setupNewGame() {
    // Clear existing data
    DATASTORE._isLoading = true;
    
    // Create map
    const map = MapMaker({
      xdim: GAME_CONFIG.MAIN_DISPLAY_WIDTH,  // Reduced from *2 to make map smaller
      ydim: GAME_CONFIG.MAIN_DISPLAY_HEIGHT, // Reduced from *2 to make map smaller
      mapType: GAME_CONFIG.DEFAULT_MAP_TYPE,
    });
    map.build();
    this.state.mapId = map.getId();

    // Create player
    const avatar = EntityFactory.create("avatar");
    map.addEntityAtRandomPosition(avatar);
    this.state.avatarId = avatar.getId();
    DATASTORE.PLAYER = avatar;

    // Add player to scheduler
    SCHEDULER.add(avatar, true, 1);

    // Create monsters with different AI types for variety
    for (let i = 0; i < GAME_CONFIG.DEFAULT_MONSTER_COUNT; i++) {
      let monsterType;
      const aiRoll = Math.random();
      
      if (aiRoll < 0.3) {
        // 30% chance for smart, aggressive monsters
        monsterType = "monster"; // Uses SmartAI
      } else if (aiRoll < 0.7) {
        // 40% chance for balanced monsters
        monsterType = "balanced_monster"; // Uses BalancedAI
      } else {
        // 30% chance for simple, less aggressive monsters
        monsterType = "simple_monster"; // Uses SimpleAI
      }
      
      const monster = EntityFactory.create(monsterType);
      map.addEntityAtRandomPosition(monster);
      SCHEDULER.add(monster, true, 1); // Back to same speed as player
    }
    
    // Update monster count for turn system
    TIME_ENGINE.updateMonsterCount();

    // Create moss
    for (let i = 0; i < GAME_CONFIG.DEFAULT_MOSS_COUNT; i++) {
      const moss = EntityFactory.create("moss");
      map.addEntityAtRandomPosition(moss);
    }

    // Position camera
    this.moveCameraToAvatar();

    // Clear loading flag
    DATASTORE._isLoading = false;

    this.showMessage("Welcome to the dungeon!");
  }

  render(display) {
    display.clear();
    const map = DATASTORE.MAPS[this.state.mapId];
    if (map) {
      map.render(display, this.state.cameraX, this.state.cameraY);
    }
  }

  renderAvatar(display) {
    display.clear();
    const avatar = this.getAvatar();
    if (avatar) {
      const currentHp = avatar.getHp();
      const maxHp = avatar.getMaxHp();
      display.drawText(0, 0, `HP: ${currentHp}/${maxHp}`);
      display.drawText(0, 1, `Position: (${avatar.getX()}, ${avatar.getY()})`);
      display.drawText(0, 2, `Time: ${avatar.getTime()}`);
    }
  }

  handleInput(eventType, evt) {
    const command = getCommandFromInput(eventType, evt);
    const prefix = eventType === "keyup" ? "Keyup: " : "";
    
    // Handle pause with repeat prevention
    if (command === COMMAND.PAUSE) {
      // Block all repeat events and rapid attempts
      if (eventType === "keydown" && evt.repeat) {
        return true;
      }
      
      // Prevent rapid pause attempts
      const now = Date.now();
      if (now - this.lastPauseTime < 500) { // Increased to 500ms
        return true;
      }
      this.lastPauseTime = now;
      
      // Clear all movement keys to stop continuous movement
      clearAllMovementKeys();
      this.game.switchModes("pause");
      return true;
    }
    
    // Handle non-movement commands
    if (command === COMMAND.MESSAGES || command === COMMAND.GAME_CONTROLS) {
      return true;
    }
    
    // Handle movement commands
    return this.handleMovementCommand(command, prefix);
  }

  handleMovementCommand(command, prefix = "") {
    const movementMap = {
      [COMMAND.MOVE_UL]: { dx: -1, dy: -1, name: "UL" },
      [COMMAND.MOVE_U]: { dx: 0, dy: -1, name: "U" },
      [COMMAND.MOVE_UR]: { dx: 1, dy: -1, name: "UR" },
      [COMMAND.MOVE_L]: { dx: -1, dy: 0, name: "L" },
      [COMMAND.MOVE_WAIT]: { dx: 0, dy: 0, name: "WAIT" },
      [COMMAND.MOVE_R]: { dx: 1, dy: 0, name: "R" },
      [COMMAND.MOVE_DL]: { dx: -1, dy: 1, name: "DL" },
      [COMMAND.MOVE_D]: { dx: 0, dy: 1, name: "D" },
      [COMMAND.MOVE_DR]: { dx: 1, dy: 1, name: "DR" }
    };

    const movement = movementMap[command];
    if (movement) {
      this.moveAvatar(movement.dx, movement.dy);
      return true;
    }

    return false;
  }

  moveAvatar(dx, dy) {
    const avatar = this.getAvatar();
    if (!avatar) {
      return;
    }
    
    // Check turn cooldown
    const now = Date.now();
    if (now - this.lastTurnTime < this.turnCooldown) {
      return;
    }
    
    if (avatar.tryWalk && avatar.tryWalk(dx, dy)) {
      this.moveCameraToAvatar();
      
      // Signal that player has taken their turn
      TIME_ENGINE.playerTookTurn();
      this.lastTurnTime = now;
      
      // Render once after complete turn
      this.game.render();
    } else {
      // Movement was blocked - stop continuous movement to prevent dragging
      this.stopContinuousMovement();
    }
  }

  moveCameraToAvatar() {
    const avatar = this.getAvatar();
    if (avatar) {
      this.state.cameraX = avatar.getX();
      this.state.cameraY = avatar.getY();
    }
  }

  getAvatar() {
    if (!this.state.avatarId) {
      return null;
    }
    const avatar = DATASTORE.ENTITIES[this.state.avatarId];
    if (!avatar) {
      return null;
    }
    return avatar;
  }

  handlePlayerKilled() {
    // Clear all movement keys and continuous movement state
    clearAllMovementKeys();
    this.stopContinuousMovement();
    this.stopContinuousMovementCheck();
    
    // Clear messages and render
    Message.clear();
    this.game.render();
    this.showMessage("You have been killed!");
    this.game.switchModes("lose");
  }
} 