import { Message } from "../components/MessageSystem.js";
import { MapMaker } from "../../world/Map.js";
import { DATASTORE, clearDataStore } from "../../core/DataStore.js";
import { EntityFactory } from "../../entities/templates/EntityTemplates.js";
import { SCHEDULER } from "../../systems/Timing.js";

export class BaseUIMode {
  constructor(thegame) {
    this.game = thegame;
  }

  showMessage(msg) {
    Message.send(msg);
    this.game.render();
  }

  localStorageAvailable() {
    try {
      const test = "test";
      window.localStorage.setItem(test, test);
      window.localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  clearLocalStorage() {
    try {
      window.localStorage.removeItem("roguelikegame");
      return true;
    } catch (error) {
      console.error("Failed to clear localStorage:", error);
      return false;
    }
  }

  safeLoadGame() {
    console.log("safeLoadGame() called");
    if (!this.localStorageAvailable()) {
      console.log("localStorage not available");
      return false;
    }
    console.log("localStorage is available, checking for saved game...");

    try {
      // Set loading flag to prevent mixins from adding entities to scheduler during loading
      DATASTORE._isLoading = true;

      const restorationString = window.localStorage.getItem("roguelikegame");
      console.log("Found in localStorage:", restorationString ? "yes" : "no");

      if (!restorationString) {
        this.showMessage("No saved game found. Start a new game!");
        console.log("No saved game found in localStorage");
        return false;
      }

      // Parse the main save data
      const state = JSON.parse(restorationString);
      if (!state.GAME_STATE || !state.MAPS || !state.ENTITIES) {
        this.showMessage("Invalid save data found. Starting new game.");
        window.localStorage.removeItem("roguelikegame");
        return false;
      }

      // Clear existing data
      DATASTORE.clearDataStore();
      DATASTORE.ID_SEQ = state.ID_SEQ;
      DATASTORE.GAME = this.game;

      // Restore game state
      this.game.fromJSON(state);
      const playState = this.game.modes.play.state;
      if (!playState.mapId || !playState.avatarId) {
        this.showMessage(
          "Invalid save data - missing game state. Please start a new game.",
        );
        window.localStorage.removeItem("roguelikegame");
        return false;
      }

      // Restore maps
      for (const mapId in state.MAPS) {
        try {
          const mapData = JSON.parse(state.MAPS[mapId]);
          DATASTORE.MAPS[mapId] = MapMaker(mapData);
          DATASTORE.MAPS[mapId].build();
        } catch (error) {
          console.error(`Failed to parse map data for ${mapId}:`, error);
          continue;
        }
      }

      // Restore entities
      for (const entId in state.ENTITIES) {
        try {
          const entityData = JSON.parse(state.ENTITIES[entId]);
          if (!entityData.name) {
            console.warn("Entity missing name property:", entityData);
            continue;
          }

          // Create entity with the saved name
          const ent = EntityFactory.create(entityData.name);

          // Get the generated ID and remove the entity from the datastore
          const generatedId = ent.getId();
          delete DATASTORE.ENTITIES[generatedId];

          // Restore the saved ID
          ent.setId(entId);
          DATASTORE.ENTITIES[entId] = ent;

          // Set avatar ID for the player
          if (entityData.name === "avatar") {
            this.game.modes.play.state.avatarId = entId;
          }

          // Add entity to its map (this sets mapId, x, y and updates map tables)
          const map = DATASTORE.MAPS[entityData.mapId];
          if (map) {
            map.addEntityAt(ent, entityData.x, entityData.y);
          } else {
            console.error(`Map ${entityData.mapId} not found for entity ${entityData.name} (${entId})`);
          }

          // Restore mixin data AFTER entity is positioned on map
          for (const mixinName in entityData) {
            if (
              mixinName.startsWith("_") &&
              mixinName !== "_id" &&
              mixinName !== "_name"
            ) {
              const mixinData = entityData[mixinName];
              if (ent.state[mixinName]) {
                // Filter out position data from mixin state to prevent overwriting correct position
                const filteredMixinData = { ...mixinData };
                delete filteredMixinData.x;
                delete filteredMixinData.y;
                delete filteredMixinData.mapId;
                
                Object.assign(ent.state[mixinName], filteredMixinData);
              }
            }
          }

          // Also restore any non-mixin state fields, but exclude position data
          for (const fieldName in entityData) {
            if (
              !fieldName.startsWith("_") &&
              fieldName !== "x" &&
              fieldName !== "y" &&
              fieldName !== "mapId" &&
              fieldName !== "id" &&
              fieldName !== "name"
            ) {
              ent.state[fieldName] = entityData[fieldName];
            }
          }
        } catch (error) {
          console.error(`Failed to parse entity data for ${entId}:`, error);
          continue;
        }
      }

      // Clear loading flag so mixin initializers don't skip scheduler
      DATASTORE._isLoading = false;

      // Add only scheduled actors to the scheduler (player, monsters with ActorWanderer)
      for (const entId in DATASTORE.ENTITIES) {
        const ent = DATASTORE.ENTITIES[entId];
        if (!ent.mixins) continue;
        
        // Add player (ActorPlayer)
        if (
          ent.mixins.some((m) => m.META && m.META.mixInName === "ActorPlayer")
        ) {
          SCHEDULER.add(ent, true, 1);
        }
        
        // Add monsters with ActorWanderer
        if (
          ent.mixins.some((m) => m.META && m.META.mixInName === "ActorWanderer")
        ) {
          SCHEDULER.add(ent, true, 1);
        }
      }

      this.showMessage("Game loaded successfully!");
      console.log("Game loaded successfully. Entities:", Object.keys(DATASTORE.ENTITIES).length, "Maps:", Object.keys(DATASTORE.MAPS).length);
      return true;
    } catch (error) {
      console.error("Error loading game:", error);
      this.showMessage("Error loading game. Starting new game.");
      window.localStorage.removeItem("roguelikegame");
      return false;
    }
  }

  saveGame() {
    if (!this.localStorageAvailable()) {
      this.showMessage("Local storage not available. Cannot save game.");
      return false;
    }

    try {
      const saveData = {
        GAME_STATE: this.game.toJSON(),
        MAPS: {},
        ENTITIES: {},
        ID_SEQ: DATASTORE.ID_SEQ,
      };

      // Save maps
      for (const mapId in DATASTORE.MAPS) {
        saveData.MAPS[mapId] = JSON.stringify(DATASTORE.MAPS[mapId].toJSON());
      }

      // Save entities
      for (const entId in DATASTORE.ENTITIES) {
        const ent = DATASTORE.ENTITIES[entId];
        const entityData = {
          name: ent.name,
          id: ent.getId(),
          mapId: ent.getMapId(),
          x: ent.getX(),
          y: ent.getY(),
        };

        // Save mixin state
        for (const mixinName in ent.state) {
          if (mixinName.startsWith("_")) {
            entityData[mixinName] = ent.state[mixinName];
          }
        }

        // Save other entity state
        for (const fieldName in ent.state) {
          if (!fieldName.startsWith("_")) {
            entityData[fieldName] = ent.state[fieldName];
          }
        }

        saveData.ENTITIES[entId] = JSON.stringify(entityData);
      }

      window.localStorage.setItem("roguelikegame", JSON.stringify(saveData));
      this.showMessage("Game saved successfully!");
      console.log("Game saved successfully. Entities:", Object.keys(DATASTORE.ENTITIES).length, "Maps:", Object.keys(DATASTORE.MAPS).length);
      return true;
    } catch (error) {
      console.error("Error saving game:", error);
      this.showMessage("Error saving game.");
      console.log("Save failed. Current state - Entities:", Object.keys(DATASTORE.ENTITIES).length, "Maps:", Object.keys(DATASTORE.MAPS).length);
      return false;
    }
  }

  renderAvatar(display) {
    // Default avatar rendering - can be overridden by subclasses
    display.drawText(0, 0, "Avatar");
  }
} 