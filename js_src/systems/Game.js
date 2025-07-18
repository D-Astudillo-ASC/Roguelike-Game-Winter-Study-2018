import { Display, RNG } from "rot-js";
import { ModeRegistry } from "../ui/modes/ModeRegistry.js";
import { Message } from "../ui/components/MessageSystem.js";
import { DATASTORE } from "../core/DataStore.js";
import { clearAllMovementKeys } from "./Commands.js";

// Centralized mode transition handler
const modeTransitions = {
  play: {
    enter: (mode) => mode.startMovementTimer && mode.startMovementTimer(),
    exit: (mode) => mode.stopMovementTimer && mode.stopMovementTimer(),
  },
  // Add more mode-specific transitions if needed
};

export const Game = {
  display: {
    SPACING: 1.1,
    main: {
      w: Math.floor(window.innerWidth / 8),
      h: Math.floor(window.innerHeight / 16),
      o: null,
    },

    avatar: {
      w: Math.floor(window.innerWidth / 8),
      h: Math.floor(window.innerHeight / 16),
      o: null,
    },

    message: {
      w: Math.floor(window.innerWidth / 8),
      h: 6,
      o: null,
    },
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

  //this. refers to game object
  init: function () {
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

    this.setupModes();
    DATASTORE.GAME = this;
    this.switchModes("startup");
    Message.send("Greetings!");
    // console.dir(this);
    // console.log("datastore");
    // console.dir(DATASTORE);
  },

  setupModes: function () {
    const modeRegistry = ModeRegistry.create(this);
    this.modes = modeRegistry.getAllModes();
  },

  // Centralized new game setup
  startNewGame: function () {
    // Clear DATASTORE and scheduler
    if (typeof DATASTORE.clearDataStore === 'function') {
      DATASTORE.clearDataStore();
    } else {
      // fallback: manual clear
      if (typeof SCHEDULER !== 'undefined' && SCHEDULER.clear) SCHEDULER.clear();
      DATASTORE.ID_SEQ = 1;
      DATASTORE.MAPS = {};
      DATASTORE.ENTITIES = {};
      DATASTORE.PLAYER = undefined;
      DATASTORE._isLoading = false;
    }
    
    // Clear all movement keys and continuous movement state
    if (typeof clearAllMovementKeys === 'function') {
      clearAllMovementKeys();
    }
    // Also clear the continuous movement flag
    if (typeof window !== 'undefined') {
      window.continuousMovementRequested = false;
    }
    
    // Re-link game object
    DATASTORE.GAME = this;
    // Setup new game state
    this.modes.play.setupNewGame();
    // Switch to play mode
    this.switchModes('play');
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

    // Call enter() method if it exists
    if (this.curMode && this.curMode.enter) {
      this.curMode.enter();
    }
    this.render();
    
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
      Message.render(d);
    }

    // console.log("renderMessage");
    // this.curMode.render(this.display.main.o);
    //if(this.curMode.hasOwnProperty('render')){
    //this.curMode.render(this.display.main.o);
    //}
  },
}; 