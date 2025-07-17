//Database for all objects in the game that are used

export let DATASTORE = {
  GAME: {},
  ID_SEQ: 1,
  MAPS: {},
  ENTITIES: {},
};
clearDataStore();
export function clearDataStore() {
  console.log("Clearing datastore - removing all entities and maps");
  
  // Clean up any existing entities first
  if (DATASTORE.ENTITIES) {
    const entityIds = Object.keys(DATASTORE.ENTITIES);
    console.log("Destroying", entityIds.length, "entities");
    for (const entityId of entityIds) {
      const entity = DATASTORE.ENTITIES[entityId];
      if (entity) {
        try {
          // Check if entity has a valid map before trying to destroy it
          const map = entity.getMap();
          if (map && entity.destroy) {
            entity.destroy();
          } else {
            // If map is invalid, just remove the entity directly
            console.log("Removing entity with invalid map:", entityId);
          }
        } catch (e) {
          console.warn("Error destroying entity:", entityId, e);
        }
      }
    }
  }
  
  // Clear maps
  if (DATASTORE.MAPS) {
    const mapIds = Object.keys(DATASTORE.MAPS);
    console.log("Clearing", mapIds.length, "maps");
    for (const mapId of mapIds) {
      delete DATASTORE.MAPS[mapId];
    }
  }
  
  // Reset DATASTORE
  DATASTORE = {
    GAME: {},
    ID_SEQ: 0,
    MAPS: {},
    ENTITIES: {},
  };
  
  console.log("Datastore cleared successfully");
}
