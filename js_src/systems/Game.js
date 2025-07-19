import { Display, RNG } from "rot-js";
import { ModeRegistry } from "../ui/modes/ModeRegistry.js";
import { Message } from "../ui/components/MessageSystem.js";
import { DATASTORE } from "../core/DataStore.js";
import { clearAllMovementKeys } from "./Commands.js";
import { isMobileUI } from "../utils/isMobileUI.js";

// TODO: Organize this into a class... This is needed to responsively display the ROT.js displays.
// Responsive display dimension calculator
function calculateDisplayDimensions() {
  const isMobile = window.innerWidth <= 768;
  const isLandscape = window.innerWidth > window.innerHeight;

  if (isMobile) {
    if (isLandscape) {
      // Mobile landscape: wider displays, less height
      return {
        main: { w: 80, h: 20 },
        avatar: { w: 80, h: 4 },
        message: { w: 80, h: 5 },
      };
    } else {
      // Mobile portrait: calculate based on actual screen dimensions
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const avatarHeight = 120; // Approximate avatar display height in pixels
      const messageHeight = 120; // Approximate message display height in pixels
      const availableHeight = screenHeight - avatarHeight - messageHeight;

      // Calculate character grid dimensions based on screen size
      // Assuming roughly 8px per character width and 16px per character height
      const charWidth = 8;
      const charHeight = 16;
      const mainWidth = Math.floor(screenWidth / charWidth);
      const mainHeight = Math.floor(availableHeight / charHeight);

      return {
        main: { w: mainWidth, h: mainHeight },
        avatar: { w: mainWidth, h: 8 },
        message: { w: mainWidth, h: 8 },
      };
    }
  } else {
    // Desktop: wider displays to use full width
    return {
      main: { w: 120, h: 40 },
      avatar: { w: 120, h: 4 },
      message: { w: 120, h: 5 },
    };
  }
}

export const Game = {
  display: {
    SPACING: 1.1,
    main: { w: 80, h: 20, o: null },
    avatar: { w: 80, h: 12, o: null },
    message: { w: 80, h: 12, o: null },
  },

  modes: {
    startup: "",
    persistence: "",
    play: "",
    win: "",
    lose: "",
    pause: "",
  },

  curMode: "",
  curModeName: "",

  // Initialize displays with responsive dimensions
  init: function () {
    this.updateDisplayDimensions();
    this.createDisplays();
    this.setupModes();
    DATASTORE.GAME = this;
    this.switchModes("startup");
    Message.send("Greetings!");
  },

  // Update display dimensions based on current screen size
  updateDisplayDimensions: function () {
    const dimensions = calculateDisplayDimensions();
    this.display.main.w = dimensions.main.w;
    this.display.main.h = dimensions.main.h;
    this.display.avatar.w = dimensions.avatar.w;
    this.display.avatar.h = dimensions.avatar.h;
    this.display.message.w = dimensions.message.w;
    this.display.message.h = dimensions.message.h;
  },

  // Create or recreate displays
  createDisplays: function () {
    // Clear existing displays if they exist
    if (this.display.main.o) {
      this.display.main.o.getContainer().remove();
    }
    if (this.display.avatar.o) {
      this.display.avatar.o.getContainer().remove();
    }
    if (this.display.message.o) {
      this.display.message.o.getContainer().remove();
    }

    // Create new displays with current dimensions
    this.display.main.o = new Display({
      width: this.display.main.w,
      height: this.display.main.h,
      spacing: this.display.SPACING,
    });

    this.display.avatar.o = new Display({
      width: this.display.avatar.w,
      height: this.display.avatar.h,
      spacing: this.display.SPACING,
    });

    this.display.message.o = new Display({
      width: this.display.message.w,
      height: this.display.message.h,
      spacing: this.display.SPACING,
    });
  },

  // Handle window resize and orientation changes
  handleResize: function () {
    this.updateDisplayDimensions();
    this.createDisplays();

    // Re-append displays to containers
    const mainContainer = document.getElementById("ws-main-display");
    const avatarContainer = document.getElementById("ws-avatar-display");
    const messageContainer = document.getElementById("ws-message-display");

    if (mainContainer && this.display.main.o) {
      mainContainer.appendChild(this.display.main.o.getContainer());
    }
    if (avatarContainer && this.display.avatar.o) {
      avatarContainer.appendChild(this.display.avatar.o.getContainer());
    }
    if (messageContainer && this.display.message.o) {
      messageContainer.appendChild(this.display.message.o.getContainer());
    }

    // Re-render if in a mode
    if (this.curMode) {
      this.render();
    }
  },

  setupModes: function () {
    const modeRegistry = ModeRegistry.create(this);
    this.modes = modeRegistry.getAllModes();
  },

  // Centralized new game setup
  startNewGame: function () {
    // Clear DATASTORE and scheduler
    if (typeof DATASTORE.clearDataStore === "function") {
      DATASTORE.clearDataStore();
    } else {
      // fallback: manual clear
      if (typeof SCHEDULER !== "undefined" && SCHEDULER.clear)
        SCHEDULER.clear();
      DATASTORE.ID_SEQ = 1;
      DATASTORE.MAPS = {};
      DATASTORE.ENTITIES = {};
      DATASTORE.PLAYER = undefined;
      DATASTORE._isLoading = false;
    }

    // Clear all movement keys and continuous movement state
    if (typeof clearAllMovementKeys === "function") {
      clearAllMovementKeys();
    }
    // Also clear the continuous movement flag
    if (typeof window !== "undefined") {
      window.continuousMovementRequested = false;
    }

    // Re-link game object
    DATASTORE.GAME = this;
    // Setup new game state
    this.modes.play.setupNewGame();
    // Switch to play mode
    this.switchModes("play");
  },

  bindEvent: function (eventType) {
    window.addEventListener(eventType, (evt) => {
      this.eventHandler(eventType, evt);
    });
  },

  eventHandler: function (eventType, evt) {
    // Only allow pause key in PlayMode
    // When an event is received have the current ui handle it
    if (this.curMode !== null && this.curMode != "") {
      // Use a more robust approach - prevent processing during mode transitions
      if (this._modeTransitioning) {
        return;
      }

      this.curMode.handleInput(eventType, evt);
      // Don't render here - let the mode handle its own rendering
    }
  },

  switchModes: function (newModeName) {
    // Set transition flag to prevent event processing during mode switch
    this._modeTransitioning = true;

    // Call exit() method of current mode if it exists
    if (this.curMode && this.curMode.exit) {
      this.curMode.exit();
    }

    // Stop movement timer if leaving play mode
    if (
      this.curModeName === "play" &&
      this.curMode &&
      this.curMode.stopMovementTimer
    ) {
      this.curMode.stopMovementTimer();
    }

    // Clear avatar display when leaving play mode
    if (this.curModeName === "play" && newModeName !== "play") {
      if (this.display.avatar.o) {
        this.display.avatar.o.clear();
      }
    }

    this.curMode = this.modes[newModeName];
    this.curModeName = newModeName;

    // Set message system mode
    Message.setMode(this.curModeName === "play" ? "play" : "single");
    if (newModeName === "pause") {
      Message.pause();
    } else if (newModeName === "play") {
      Message.resume();
    }

    // Call enter() method if it exists
    if (this.curMode && this.curMode.enter) {
      this.curMode.enter();
    }
    this.render();
    if (typeof this.updateJoystickVisibility === "function") {
      this.updateJoystickVisibility();
    }
    // Clear transition flag after a short delay
    setTimeout(() => {
      this._modeTransitioning = false;
    }, 100);
  },

  toJSON: function () {
    return {
      randomSeed: this._randomSeed,
      playModeState: this.modes.play.toJSON(),
    };
  },

  restoreFromState(stateData) {
    // console.log(stateData);
    this.state = stateData;
  },

  fromJSON: function (state) {
    try {
      this._randomSeed = state.GAME_STATE.randomSeed;
      RNG.setSeed(this._randomSeed);

      this.modes.play.restoreFromState(state.GAME_STATE.playModeState);
    } catch (error) {
      console.error("Failed to parse game state JSON:", error);
      throw new Error("Invalid game state data");
    }
  },

  getDisplay: function (displayId) {
    if (Object.prototype.hasOwnProperty.call(this.display, displayId)) {
      return this.display[displayId].o;
    }
    return null;
  },

  render: function () {
    // Render main display and avatar display
    this.renderMain();
    this.renderAvatar();
    this.renderMessage();
  },

  renderMain: function () {
    // console.log("renderMain");
    // Ensure display is initialized
    if (!this.display.main.o) {
      // console.warn("Main display is null, reinitializing...");
      this.display.main.o = new Display({
        width: this.display.main.w,
        height: this.display.main.h,
        spacing: this.display.SPACING,
      });
    }

    if (this.curMode && this.display.main.o) {
      this.display.main.o.clear();
      this.curMode.render(this.display.main.o);
    }
    //if(this.curMode.hasOwnProperty('render')){
    //this.curMode.render(this.display.main.o);
    //}
  },

  renderAvatar: function () {
    // Only render avatar display in play mode when we have an avatar
    if (this.curModeName !== "play") {
      return;
    }

    // Ensure display is initialized
    if (!this.display.avatar.o) {
      // console.warn("Avatar display is null, reinitializing...");
      this.display.avatar.o = new Display({
        width: this.display.avatar.w,
        height: this.display.avatar.h,
        spacing: this.display.SPACING,
      });
    }

    const a = this.display.avatar.o;
    if (this.curMode && a) {
      a.clear();
      this.curMode.renderAvatar(a);
    }
  },
  renderMessage: function () {
    // Ensure display is initialized
    if (!this.display.message.o) {
      console.warn("Message display is null, reinitializing...");
      this.display.message.o = new Display({
        width: this.display.message.w,
        height: this.display.message.h,
        spacing: this.display.SPACING,
      });
    }

    const d = this.display.message.o;
    if (d) {
      Message.tick();
      Message.render(d);
    }
  },
};

// Joystick logic for mobile and testing
Game.joystick = {
  active: false,
  center: { x: 0, y: 0 },
  radius: 0,
  stick: null,
  touchId: null,
  lastDir: null,
  lastMoveTime: 0,
  moveCooldown: 50,
  dirToKey: {
    up: "w",
    down: "s",
    left: "a",
    right: "d",
    "up-left": ["w", "a"],
    "up-right": ["w", "d"],
    "down-left": ["s", "a"],
    "down-right": ["s", "d"],
  },
  angleToDir(angle) {
    const deg = (angle * 180) / Math.PI;
    if (deg >= -22.5 && deg < 22.5) return "right"; // 0°
    if (deg >= 22.5 && deg < 67.5) return "down-right"; // 45°
    if (deg >= 67.5 && deg < 112.5) return "down"; // 90°
    if (deg >= 112.5 && deg < 157.5) return "down-left"; // 135°
    if (deg >= 157.5 || deg < -157.5) return "left"; // 180°
    if (deg >= -157.5 && deg < -112.5) return "up-left"; // -135°
    if (deg >= -112.5 && deg < -67.5) return "up"; // -90°
    if (deg >= -67.5 && deg < -22.5) return "up-right"; // -45°
    return null;
  },
  start(x, y) {
    const pad = document.querySelector(".circular-joystick");
    if (!pad) return;
    const rect = pad.getBoundingClientRect();
    this.center = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    this.radius = rect.width / 2;
    this.stick = document.getElementById("joystick-stick");
    this.active = true;
    this.lastDir = null;
    this.move(x, y);
  },
  move(x, y) {
    const dx = x - this.center.x;
    const dy = y - this.center.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    let stickX = dx,
      stickY = dy;
    if (dist > this.radius * 0.7) {
      stickX = dx * ((this.radius * 0.7) / dist);
      stickY = dy * ((this.radius * 0.7) / dist);
    }
    if (this.stick) {
      this.stick.style.transform = `translate(-50%, -50%) translate(${stickX}px, ${stickY}px)`;
    }
    if (dist > this.radius * 0.05) {
      // Ultra responsive dead zone
      const angle = Math.atan2(stickY, stickX);
      const dir = this.angleToDir(angle);
      if (dir && dir !== this.lastDir) {
        // Check cooldown before sending movement
        const now = Date.now();
        if (now - this.lastMoveTime >= this.moveCooldown) {
          this.sendDirection(dir);
          this.lastDir = dir;
          this.lastMoveTime = now;
        }
      }
    } else {
      this.sendDirection(null);
      this.lastDir = null;
    }
  },
  end() {
    this.active = false;
    this.touchId = null;
    this.sendDirection(null);
    if (this.stick) {
      this.stick.style.transform = "translate(-50%, -50%)";
    }
  },
  sendDirection(dir) {
    if (!dir) {
      ["w", "a", "s", "d"].forEach((k) => {
        window.dispatchEvent(new KeyboardEvent("keyup", { key: k }));
      });
      return;
    }
    const keys = this.dirToKey[dir];
    const allKeys = ["w", "a", "s", "d"];
    if (Array.isArray(keys)) {
      allKeys.forEach((k) => {
        if (keys.includes(k)) {
          window.dispatchEvent(new KeyboardEvent("keydown", { key: k }));
        } else {
          window.dispatchEvent(new KeyboardEvent("keyup", { key: k }));
        }
      });
    } else {
      allKeys.forEach((k) => {
        if (k === keys) {
          window.dispatchEvent(new KeyboardEvent("keydown", { key: k }));
        } else {
          window.dispatchEvent(new KeyboardEvent("keyup", { key: k }));
        }
      });
    }
  },
  touchStart(e) {
    if (this.active) return;
    const touch = e.touches[0];
    this.touchId = touch.identifier;
    this.start(touch.clientX, touch.clientY);
  },
  touchMove(e) {
    if (!this.active) return;
    let touch = null;
    for (let i = 0; i < e.touches.length; i++) {
      if (e.touches[i].identifier === this.touchId) {
        touch = e.touches[i];
        break;
      }
    }
    if (!touch) return;
    this.move(touch.clientX, touch.clientY);
  },
  touchEnd(e) {
    let stillActive = false;
    for (let i = 0; i < e.touches.length; i++) {
      if (e.touches[i].identifier === this.touchId) {
        stillActive = true;
        break;
      }
    }
    if (!stillActive) {
      this.end();
    }
  },
  mouseDown(e) {
    if (this.active) return;
    e.preventDefault();
    this.start(e.clientX, e.clientY);
    window.addEventListener(
      "mousemove",
      (this.mouseMoveBound = this.mouseMove.bind(this)),
    );
    window.addEventListener(
      "mouseup",
      (this.mouseUpBound = this.mouseUp.bind(this)),
    );
  },
  mouseMove(e) {
    if (!this.active) return;
    this.move(e.clientX, e.clientY);
  },
  mouseUp(e) {
    this.end();
    window.removeEventListener("mousemove", this.mouseMoveBound);
    window.removeEventListener("mouseup", this.mouseUpBound);
  },
  setup() {
    const pad = document.querySelector(".circular-joystick");
    if (!pad) return;
    const shouldShow = isMobileUI();
    pad.style.display =
      shouldShow && Game.curModeName === "play" ? "flex" : "none";
    if (!(shouldShow && Game.curModeName === "play")) return;
    pad.addEventListener("touchstart", this.touchStart.bind(this), {
      passive: false,
    });
    pad.addEventListener("touchmove", this.touchMove.bind(this), {
      passive: false,
    });
    pad.addEventListener("touchend", this.touchEnd.bind(this), {
      passive: false,
    });
    pad.addEventListener("touchcancel", this.touchEnd.bind(this), {
      passive: false,
    });
    pad.addEventListener("mousedown", this.mouseDown.bind(this));
  },
  teardown() {
    const pad = document.querySelector(".circular-joystick");
    if (!pad) return;
    pad.style.display = "none";
    pad.removeEventListener("touchstart", this.touchStart.bind(this));
    pad.removeEventListener("touchmove", this.touchMove.bind(this));
    pad.removeEventListener("touchend", this.touchEnd.bind(this));
    pad.removeEventListener("touchcancel", this.touchEnd.bind(this));
    pad.removeEventListener("mousedown", this.mouseDown.bind(this));
    this.end();
  },
  updateVisibility() {
    if (isMobileUI() && Game.curModeName === "play") {
      this.setup();
    } else {
      this.teardown();
    }
  },
};

Game.setupJoystick = function () {
  Game.joystick.setup();
};
Game.teardownJoystick = function () {
  Game.joystick.teardown();
};
Game.updateJoystickVisibility = function () {
  Game.joystick.updateVisibility();
};
