import { DATASTORE } from "../core/DataStore.js";

// Track pressed movement keys for diagonal movement
const pressedMovementKeys = new Set();
let continuousMovementTimer = null;
let lastMovementTime = 0;
const MOVEMENT_INTERVAL = 70; // Slightly faster movement

// Get current movement direction based on pressed keys
export function getCurrentMovementDirection() {
  const hasW = pressedMovementKeys.has("w");
  const hasA = pressedMovementKeys.has("a");
  const hasS = pressedMovementKeys.has("s");
  const hasD = pressedMovementKeys.has("d");

  // Diagonal movements (only when exactly 2 keys are pressed)
  if (pressedMovementKeys.size === 2) {
    if (hasW && hasA) return { dx: -1, dy: -1, command: COMMAND.MOVE_UL };
    if (hasW && hasD) return { dx: 1, dy: -1, command: COMMAND.MOVE_UR };
    if (hasS && hasA) return { dx: -1, dy: 1, command: COMMAND.MOVE_DL };
    if (hasS && hasD) return { dx: 1, dy: 1, command: COMMAND.MOVE_DR };
  }

  // Single movements (only when exactly one key is pressed)
  if (pressedMovementKeys.size === 1) {
    if (hasW) return { dx: 0, dy: -1, command: COMMAND.MOVE_U };
    if (hasA) return { dx: -1, dy: 0, command: COMMAND.MOVE_L };
    if (hasS) return { dx: 0, dy: 1, command: COMMAND.MOVE_D };
    if (hasD) return { dx: 1, dy: 0, command: COMMAND.MOVE_R };
  }

  // No movement
  return { dx: 0, dy: 0, command: COMMAND.MOVE_WAIT };
}

// Start continuous movement timer - efficient implementation
function startContinuousMovement() {
  if (continuousMovementTimer) return;

  continuousMovementTimer = setInterval(() => {
    const now = Date.now();
    if (
      now - lastMovementTime >= MOVEMENT_INTERVAL &&
      pressedMovementKeys.size > 0
    ) {
      const movement = getCurrentMovementDirection();
      if (movement.command !== COMMAND.MOVE_WAIT) {
        lastMovementTime = now;
        // Use a simple flag instead of custom events
        window.continuousMovementRequested = true;
      }
    }
  }, MOVEMENT_INTERVAL);
}

// Stop continuous movement timer
function stopContinuousMovement() {
  if (continuousMovementTimer) {
    clearInterval(continuousMovementTimer);
    continuousMovementTimer = null;
  }
}

// Clear all movement keys and stop continuous movement (for pausing)
export function clearAllMovementKeys() {
  pressedMovementKeys.clear();
  stopContinuousMovement();
}

export function getCommandFromInput(evtType, evtData) {
  if (evtType != "keyup" && evtType != "keydown") {
    return COMMAND.NULLCOMMAND;
  }

  const key = evtData.key.toLowerCase();

  // Only treat WASD as movement keys in play mode
  const isInPlayMode =
    typeof DATASTORE?.GAME?.curModeName === "string" &&
    DATASTORE.GAME.curModeName === "play";
  const isMovementKey = isInPlayMode && ["w", "a", "s", "d"].includes(key);

  // console.log("getCommandFromInput - key:", key, "isMovementKey:", isMovementKey, "isInPlayMode:", isInPlayMode);

  // Track key state changes (only in play mode)
  if (evtType === "keydown" && isMovementKey) {
    pressedMovementKeys.add(key);
    startContinuousMovement(); // Start continuous movement when key is pressed
  } else if (evtType === "keyup" && isMovementKey) {
    pressedMovementKeys.delete(key);
    if (pressedMovementKeys.size === 0) {
      stopContinuousMovement(); // Stop continuous movement when no keys are pressed
    }
  }

  // Process movement immediately (no cooldown) - only in play mode
  if (isMovementKey && evtType === "keydown") {
    const movement = getCurrentMovementDirection();

    // Return movement command if we have pressed keys
    if (pressedMovementKeys.size > 0) {
      lastMovementTime = Date.now();
      return movement.command;
    }
  }

  // For non-movement keys, use the original binding system
  const bindingSet = `key:${evtData.key},altKey:${evtData.altKey},ctrlKey:${evtData.ctrlKey},shiftKey:${evtData.shiftKey}`;
  if (!BINDING_LOOKUPS[bindingSet]) {
    return COMMAND.NULLCOMMAND;
  }
  return BINDING_LOOKUPS[bindingSet];
}

// This is the set of command constants. It's populated via the setKeyBinding method.
export let COMMAND = {
  NULLCOMMAND: 1,
};

// This is used by the getCommandFromInput function to the value associated with a given key binding set. It's dynamically populated by the setKeyBinding function below.
let BINDING_LOOKUPS = {};

// takes a list of key binding names and sets up the commands and binding lookups - later items in the list override earlier ones, which allows a kind of hierarchical binding system
export function setKeyBinding(bindingNameList) {
  // ensure that bindingNameList is an array which has a first element of 'universal'
  if (typeof bindingNameList === "string") {
    bindingNameList = [bindingNameList];
  }
  if (bindingNameList[0] != "universal") {
    bindingNameList.unshift("universal");
  }

  let commandNumber = 1;
  COMMAND = {
    NULLCOMMAND: commandNumber,
  };
  BINDING_LOOKUPS = {};

  for (let bni = 0; bni < bindingNameList.length; bni++) {
    const bindingName = bindingNameList[bni];
    if (!Object.prototype.hasOwnProperty.call(KEY_BINDINGS, bindingName)) {
      return;
    }
    for (const command in KEY_BINDINGS[bindingName]) {
      commandNumber++;
      COMMAND[command] = commandNumber;
      for (
        let bsi = 0;
        bsi < KEY_BINDINGS[bindingName][command].length;
        bsi++
      ) {
        BINDING_LOOKUPS[KEY_BINDINGS[bindingName][command][bsi]] =
          commandNumber;
      }
    }
  }
}

// these define the key bindings for the various game commands, though the actual lookup uses different object that's generated from this one.
// the keybindings are broken down by mode.
// within an mode the command is mapped to a list of key binding definitions, any of which will result in the given game command.
// the key binding definitions are a string, with the relevant key, altKey, ctrlKey, and shiftKey labels and values.
const KEY_BINDINGS = {
  universal: {
    CANCEL: ["key:Escape,altKey:false,ctrlKey:false,shiftKey:false"],
    HELP: ["key:?,altKey:false,ctrlKey:false,shiftKey:true"],
  },
  startup: {
    START_GAME: [
      "key:Enter,altKey:false,ctrlKey:false,shiftKey:false",
      "key: ,altKey:false,ctrlKey:false,shiftKey:false",
    ],
  },
  persistence: {
    NEW_GAME: [
      "key:n,altKey:false,ctrlKey:false,shiftKey:false",
      "key:N,altKey:false,ctrlKey:false,shiftKey:true",
    ],
    LOAD_GAME: [
      "key:l,altKey:false,ctrlKey:false,shiftKey:false",
      "key:L,altKey:false,ctrlKey:false,shiftKey:true",
    ],
  },
  play: {
    GAME_CONTROLS: ["key:=,altKey:false,ctrlKey:false,shiftKey:false"],
    MESSAGES: [
      "key:M,altKey:false,ctrlKey:false,shiftKey:true",
      "key:m,altKey:false,ctrlKey:false,shiftKey:false",
    ],
    PAUSE: ["key:p,altKey:false,ctrlKey:false,shiftKey:false"],
  },
  pause: {
    RESUME: [
      "key:p,altKey:false,ctrlKey:false,shiftKey:false",
      "key:Escape,altKey:false,ctrlKey:false,shiftKey:false",
    ],
    QUIT: ["key:q,altKey:false,ctrlKey:false,shiftKey:false"],
    SAVE_GAME: [
      "key:s,altKey:false,ctrlKey:false,shiftKey:false",
      "key:S,altKey:false,ctrlKey:false,shiftKey:true",
    ],
    LOAD_GAME: [
      "key:l,altKey:false,ctrlKey:false,shiftKey:false",
      "key:L,altKey:false,ctrlKey:false,shiftKey:true",
    ],
  },
  movement_numpad: {
    MOVE_UL: [
      "key:7,altKey:false,ctrlKey:false,shiftKey:false",
      "key:Q,altKey:false,ctrlKey:false,shiftKey:false",
    ],
    MOVE_U: [
      "key:8,altKey:false,ctrlKey:false,shiftKey:false",
      "key:W,altKey:false,ctrlKey:false,shiftKey:false",
    ],
    MOVE_UR: [
      "key:9,altKey:false,ctrlKey:false,shiftKey:false",
      "key:E,altKey:false,ctrlKey:false,shiftKey:false",
    ],
    MOVE_L: [
      "key:4,altKey:false,ctrlKey:false,shiftKey:false",
      "key:A,altKey:false,ctrlKey:false,shiftKey:false",
    ],
    MOVE_WAIT: [
      "key:5,altKey:false,ctrlKey:false,shiftKey:false",
      "key:S,altKey:false,ctrlKey:false,shiftKey:false",
    ],
    MOVE_R: [
      "key:6,altKey:false,ctrlKey:false,shiftKey:false",
      "key:D,altKey:false,ctrlKey:false,shiftKey:false",
    ],
    MOVE_DL: [
      "key:1,altKey:false,ctrlKey:false,shiftKey:false",
      "key:Z,altKey:false,ctrlKey:false,shiftKey:false",
    ],
    MOVE_D: [
      "key:2,altKey:false,ctrlKey:false,shiftKey:false",
      "key:X,altKey:false,ctrlKey:false,shiftKey:false",
    ],
    MOVE_DR: [
      "key:3,altKey:false,ctrlKey:false,shiftKey:false",
      "key:C,altKey:false,ctrlKey:false,shiftKey:false",
    ],
  },
};
