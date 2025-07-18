import { uniqueId } from "../utils/Helpers.js";
import { MixableSymbol } from "./MixableSymbol.js";
import { DATASTORE } from "../core/DataStore.js";

// Import mixins
import { TimeTracker, HitPoints, MeleeAttacker, PlayerMessages } from "./mixins/CoreMixins.js";
import { WalkerCorporeal, ActorPlayer, ActorWanderer, SmartMonsterAI, BalancedMonsterAI } from "./mixins/AdvancedMixins.js";

// Create mixin map
const MIXIN_MAP = {
  TimeTracker,
  HitPoints,
  MeleeAttacker,
  PlayerMessages,
  WalkerCorporeal,
  ActorPlayer,
  ActorWanderer,
  SmartMonsterAI,
  BalancedMonsterAI,
};

export class Entity extends MixableSymbol {
  constructor(template) {
    // Use all mixins
    super(template, MIXIN_MAP);
    
    if (!this.state) {
      this.state = {};
    }
    this.state.x = 0;
    this.state.y = 0;
    this.state.mapId = 0;
    this.state.id = uniqueId();
    
    // Copy template properties to the entity instance
    if (template.role) {
      this.role = template.role;
    }
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
    this._allowPositionSet = true;
    this.state.x = newX;
    this._allowPositionSet = false;
  }

  getY() {
    return this.state.y;
  }

  setY(newY) {
    this._allowPositionSet = true;
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
    const saveState = { ...this.state };
    saveState.name = this.name;
    return JSON.stringify(saveState);
  }

  fromJSON(s) {
    const parsedState = JSON.parse(s);

    // Restore the entity name if it was saved
    if (parsedState.name) {
      this.name = parsedState.name;
    }

    // Restore state including position data
    this.state = { ...parsedState };
  }
} 