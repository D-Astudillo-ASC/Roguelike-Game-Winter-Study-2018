import { uniqueId } from "./util.js";
import { MixableSymbol } from "./mixable_symbol.js";
import { DATASTORE } from "./datastore.js";

export class Entity extends MixableSymbol {
  constructor(template) {
    super(template);
    this.name = template.name;
    if (!this.state) {
      this.state = {};
    }
    this.state.x = 0;
    this.state.y = 0;
    this.state.mapId = 0;
    this.state.id = uniqueId();
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
    return this.state.x;
  }

  setX(newX) {
    this.state.x = newX;
  }

  getY() {
    return this.state.y;
  }

  setY(newY) {
    this.state.y = newY;
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
      console.warn(`Entity ${this.name} (${this.getId()}) has invalid mapId: ${this.state.mapId}`);
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
    // Include the entity name in the saved state
    const saveState = { ...this.state };
    saveState.name = this.name;
    return JSON.stringify(saveState);
  }

  fromJSON(s) {
    this.state = JSON.parse(s);
    // Restore the entity name if it was saved
    if (this.state.name) {
      this.name = this.state.name;
    }
  }
}
