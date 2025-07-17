import { uniqueId } from "./util.js";
import { MixableSymbol } from "./mixable_symbol.js";
import { DATASTORE } from "./datastore.js";

export class Entity extends MixableSymbol {
  constructor(template) {
    super(template);
    if (!this.state) {
      this.state = {};
    }
    this.state.x = 0;
    this.state.y = 0;
    this.state.mapId = 0;
    this.state.id = uniqueId();
    // Proxy for monster position mutation detection
    // if (template && (template.name === "monster" || template._name === "monster")) {
    //   const origState = this.state;
    //   const self = this;
    //   this.state = new Proxy(origState, {
    //     set(target, prop, value, receiver) {
    //       if ((prop === "x" || prop === "y") && !self._allowPositionSet) {
    //         console.error(
    //           `MONSTER STATE MUTATION: state.${String(prop)} set to ${value} (old value: ${target[prop]})`,
    //           new Error().stack
    //         );
    //       }
    //       target[prop] = value;
    //       return true;
    //     }
    //   });
    // }
  }

  getId() {
    return this.state.id;
  }

  setId(newId) {
    this.state.id = newId;
  }

  getName() {
    return this.name;
  }

  setName(newName) {
    this.state.name = newName;
  }

  getX() {
    // Additional debugging for monsters
    if (this.name === "monster") {
      // console.log(`MONSTER getX: ${this.name} (${this.getId()}) returning: ${this.state.x}`);
    }
    return this.state.x;
  }

  setX(newX) {
    this._allowPositionSet = true;
    // Only log for monsters to reduce noise
    // if (this.name === "monster") {
    //   console.log(`MONSTER setX: ${this.name} (${this.getId()}) ${this.state.x} -> ${newX}`);
    // }
    this.state.x = newX;
    this._allowPositionSet = false;
  }

  getY() {
    // Additional debugging for monsters
    // if (this.name === "monster") {
      // console.log(`MONSTER getY: ${this.name} (${this.getId()}) returning: ${this.state.y}`);
    // }
    return this.state.y;
  }

  setY(newY) {
    this._allowPositionSet = true;
    // Only log for monsters to reduce noise
    // if (this.name === "monster") {
      // console.log(`MONSTER setY: ${this.name} (${this.getId()}) ${this.state.y} -> ${newY}`);
    // }
    this.state.y = newY;
    this._allowPositionSet = false;
  }

  getPos() {
    return `${this.state.x},${this.state.y}`;
  }

  getMapId() {
    return this.state.mapId;
  }

  setMapId(newInfo) {
    this.state.mapId = newInfo;
  }
  getMap() {
    if (!this.state.mapId || !DATASTORE.MAPS[this.state.mapId]) {
      // console.warn(
      //   `Entity ${this.name} (${this.getId()}) has invalid mapId: ${this.state.mapId}`,
      // );
      return null;
    }
    return DATASTORE.MAPS[this.state.mapId];
  }

  destroy() {
    const map = this.getMap();
    if (map) {
      map.extractEntity(this);
    }

    // Remove from DATASTORE.ENTITIES
    if (DATASTORE.ENTITIES && DATASTORE.ENTITIES[this.getId()]) {
      delete DATASTORE.ENTITIES[this.getId()];
    }
  }

  toJSON() {
    // Include the entity name and position data in the saved state
    // Position data is needed for loading
    const saveState = { ...this.state };
    saveState.name = this.name;

    // Keep position data for loading - it will be used to place entities on maps
    // The map will manage position tracking after placement

    // Debug: Log what's being saved
    // if (this.name === "monster") {
      // console.log(`MONSTER toJSON: ${this.name} (${this.getId()}) - Original state:`, this.state);
      // console.log(`MONSTER toJSON: ${this.name} (${this.getId()}) - Saved state:`, saveState);
    // }

    return JSON.stringify(saveState);
  }

  fromJSON(s) {
    const parsedState = JSON.parse(s);

    // Debug: Log what's being loaded
    // if (parsedState.name === "monster") {
      // console.log(`MONSTER fromJSON: ${parsedState.name} - Parsed state:`, parsedState);
    // }

    // Restore the entity name if it was saved
    if (parsedState.name) {
      this.name = parsedState.name;
    }

    // Restore state including position data - it will be used by the loading logic
    this.state = { ...parsedState };

    // Debug: Log final state after fromJSON
    // if (this.name === "monster") {
      // console.log(`MONSTER fromJSON: ${this.name} - Final state after fromJSON:`, this.state);
    // }
  }
}
