import { StartupMode } from "./StartupMode.js";
import { PlayMode } from "./PlayMode.js";
import { PauseMode } from "./PauseMode.js";
import { PersistenceMode } from "./PersistenceMode.js";
import { WinMode } from "./WinMode.js";
import { LoseMode } from "./LoseMode.js";

export class ModeRegistry {
  constructor(game) {
    this.game = game;
    this.modes = {
      startup: new StartupMode(game),
      play: new PlayMode(game),
      pause: new PauseMode(game),
      persistence: new PersistenceMode(game),
      win: new WinMode(game),
      lose: new LoseMode(game),
    };
  }

  getMode(modeName) {
    return this.modes[modeName];
  }

  getAllModes() {
    return this.modes;
  }

  // Factory method to create mode registry
  static create(game) {
    return new ModeRegistry(game);
  }
} 