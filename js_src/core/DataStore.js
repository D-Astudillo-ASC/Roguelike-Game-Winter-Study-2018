// Central data store for all game objects
import { SCHEDULER } from "../systems/Timing.js";

// Simple data store that maintains the current API
export const DATASTORE = {
  GAME: {},
  ID_SEQ: 1,
  MAPS: {},
  ENTITIES: {},
  _isLoading: false,
};

// Enhanced methods for the data store
export function clearDataStore() {
  // Clear scheduler to remove old entities
  SCHEDULER.clear();

  // Reset DATASTORE
  DATASTORE.GAME = {};
  DATASTORE.ID_SEQ = 1;
  DATASTORE.MAPS = {};
  DATASTORE.ENTITIES = {};
  DATASTORE.PLAYER = undefined;
  DATASTORE._isLoading = false;
}

DATASTORE.clearDataStore = clearDataStore;

// Helper functions for entity management
export function addEntity(entity) {
  if (entity && entity.getId()) {
    DATASTORE.ENTITIES[entity.getId()] = entity;
  }
}

export function removeEntity(entityId) {
  if (DATASTORE.ENTITIES[entityId]) {
    delete DATASTORE.ENTITIES[entityId];
  }
}

export function getEntity(entityId) {
  return DATASTORE.ENTITIES[entityId] || null;
}

export function getAllEntities() {
  return Object.values(DATASTORE.ENTITIES);
}

export function getEntitiesByType(type) {
  return getAllEntities().filter((entity) => entity.name === type);
}

// Helper functions for map management
export function addMap(map) {
  if (map && map.getId()) {
    DATASTORE.MAPS[map.getId()] = map;
  }
}

export function removeMap(mapId) {
  if (DATASTORE.MAPS[mapId]) {
    delete DATASTORE.MAPS[mapId];
  }
}

export function getMap(mapId) {
  return DATASTORE.MAPS[mapId] || null;
}

export function getAllMaps() {
  return Object.values(DATASTORE.MAPS);
}
