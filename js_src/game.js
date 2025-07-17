import { Display, RNG } from "rot-js";
import {
  StartupMode,
  PlayMode,
  WinMode,
  LoseMode,
  PersistenceMode,
  PauseMode,
} from "./ui_mode.js";
import { Message } from "./message.js";
import { DATASTORE } from "./datastore.js";

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
    this.modes.startup = new StartupMode(this);
    this.modes.play = new PlayMode(this);
    this.modes.win = new WinMode(this);
    this.modes.lose = new LoseMode(this);
    this.modes.persistence = new PersistenceMode(this);
    this.modes.pause = new PauseMode(this);
  },

  setupNewGame: function () {
    // console.log("Game.setupNewGame() called");
    this._randomSeed = 5 + Math.floor(Math.random() * 100000);
    //this._randomSeed = 76250;
    // console.log("Using random seed " + this._randomSeed);
    RNG.setSeed(this._randomSeed);
    // console.log("About to call PlayMode.setupNewGame()");
    this.modes.play.setupNewGame();
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
      if (this.curMode.handleInput(eventType, evt)) {
        this.render();
        //Message.ageMessages();
      }
    }
  },

  switchModes: function (newModeName) {
    // console.log(
    //   "Game.switchModes() called: switching from",
    //   this.curModeName,
    //   "to",
    //   newModeName,
    // );
    // Stop movement timer if leaving play mode
    if (
      this.curModeName === "play" &&
      this.curMode &&
      this.curMode.stopMovementTimer
    ) {
      this.curMode.stopMovementTimer();
    }
    this.curMode = this.modes[newModeName];
    this.curModeName = newModeName;

    // Call enter() method if it exists
    if (this.curMode && this.curMode.enter) {
      // console.log("Calling enter() method for", newModeName, "mode");
      this.curMode.enter();
    }
    this.render();
  },

  toJSON: function () {
    let json = "";
    json = JSON.stringify({
      rseed: this.randomSeed,
      playModeState: this.modes.play,
    });
    return json;
  },

  restoreFromState(stateData) {
    // console.log(stateData);
    this.state = stateData;
  },

  fromJSON: function (json) {
    // console.log(json);
    try {
      // json is already an object, not a JSON string
      const state = json;
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
    this.renderAvatar();
    this.renderMain();
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
      this.curMode.render(this.display.main.o);
    }
    //if(this.curMode.hasOwnProperty('render')){
    //this.curMode.render(this.display.main.o);
    //}
  },

  renderAvatar: function () {
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
    //a.drawText(0,2,"Avatar Space");
    if (this.curMode && a) {
      this.curMode.renderAvatar(a);
    }

    //this.curMode.render(a);
    //a.drawText(0,2,"Avatar Space");

    //  this.curMode.render(this.display.main.o);
    //if(this.curMode.hasOwnProperty('render')){
    //this.curMode.render(this.display.main.o);
    //}
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
