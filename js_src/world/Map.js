import { TILES } from "./Tile.js";
import { RNG, Map as ROTMap } from "rot-js";
import { init2DArray, uniqueId } from "../utils/Helpers.js";
import { DATASTORE } from "../core/DataStore.js";

class Map {
  constructor(xdim, ydim, mapType) {
    // console.dir(TILES);
    this.state = {};
    this.state.xdim = xdim || 1;
    this.state.ydim = ydim || 1;
    this.state.mapType = mapType || "basic caves";
    this.state.setupRngState = RNG.getState();
    this.state.id = uniqueId("map-" + this.state.mapType.replace(/\s+/g, "-"));
    this.state.entityIdToMapPos = {};
    this.state.mapPosToEntityId = {};
          // console.dir(this);
  }

  build() {
    this.tileGrid = TILE_GRID_GENERATOR[this.state.mapType](
      this.state.xdim,
      this.state.ydim,
      this.state.setupRngState,
    );
  }

  getId() {
    return this.state.id;
  }

  setId(newId) {
    this.state.id = newId;
  }

  getXDim() {
    return this.state.xdim;
  }

  setXDim(newXdim) {
    this.state.xdim = newXdim;
  }
  getYDim() {
    return this.state.ydim;
  }

  setYDim(newYdim) {
    this.state.ydim = newYdim;
  }
  getMapType() {
    return this.state.mapType;
  }

  setMapType(newMapType) {
    this.state.mapType = newMapType;
  }
  getRngState() {
    return this.state.setupRngState;
  }

  setRngState(newRngState) {
    this.state.setupRngState = newRngState;
  }

  updateEntityPosition(ent, newMapX, newMapY) {
    const oldPos = this.state.entityIdToMapPos[ent.getId()];
    // console.log(this.state.mapPosToEntityId);
    delete this.state.mapPosToEntityId[oldPos];

    this.state.mapPosToEntityId[`${newMapX},${newMapY}`] = ent.getId();

    this.state.entityIdToMapPos[ent.getId()] = `${newMapX},${newMapY}`;
  }

  extractEntity(ent) {
    delete this.state.mapPosToEntityId[
      this.state.entityIdToMapPos[ent.getId()]
    ];

    delete this.state.entityIdToMapPos[ent.getId()];

    return ent;
  }

  removeEntity(ent) {
    // Remove entity from map tracking
    this.extractEntity(ent);
    
    // Clear entity's map reference
    ent.setMapId(null);
    
    return ent;
  }
  addEntityAt(ent, mapx, mapy) {
    // console.log(`addEntityAt called for ${ent.name} (${ent.getId()}) to (${mapx},${mapy})`);
    const pos = `${mapx},${mapy}`;
    this.state.entityIdToMapPos[ent.getId()] = pos;
    this.state.mapPosToEntityId[pos] = ent.getId();
    ent.setMapId(this.getId());
    ent.setX(mapx);
    ent.setY(mapy);
    // Debug: Log entity placement
    // console.warn(`Entity ${ent.name} (${ent.getId()}) placed at (${mapx}, ${mapy}) on map ${this.getId()}`);
  }

  moveEntityTo(ent, newX, newY) {
    // console.warn(`moveEntityTo called for ${ent.name} (${ent.getId()}) to (${newX},${newY})`);
    // Remove from old position
    const oldPos = this.state.entityIdToMapPos[ent.getId()];
    if (oldPos) {
      delete this.state.mapPosToEntityId[oldPos];
      delete this.state.entityIdToMapPos[ent.getId()];
    }
    // Add to new position (this already calls syncEntityPosition)
    this.addEntityAt(ent, newX, newY);
  }

  // --- FIX 11: Add comprehensive position synchronization function ---
  syncEntityPosition(ent) {
    const entId = ent.getId();
    const currentMapPos = this.state.entityIdToMapPos[entId];
    
    if (!currentMapPos) {
      console.warn(`No map position found for ${ent.name} (${entId})`);
      return;
    }
    
    const [mapX, mapY] = currentMapPos.split(",").map(Number);
    const entX = ent.getX();
    const entY = ent.getY();
    
    // If there's a mismatch, update the entity to match the map
    if (entX !== mapX || entY !== mapY) {
      console.warn(
        `Position sync fix: ${ent.name} (${entId}) entity (${entX},${entY}) vs map (${mapX},${mapY})`,
      );
      
      // Update entity position to match map position
      ent.setX(mapX);
      ent.setY(mapY);
      
      // console.log(
      //   `Position sync fixed: ${ent.name} (${entId}) entity now at (${mapX},${mapY})`,
      // );
    }
  }

  isPositionOpen(x, y) {
    if (this.tileGrid[x][y].isA("floor")) {
      return true;
    }

    return false;
  }

  getTargetPositionInfo(x, y) {
    const info = {
      entity: "",
      tile: this.getTile(x, y),
    };
    const entId = this.state.mapPosToEntityId[`${x},${y}`];
    if (entId) {
      info.entity = DATASTORE.ENTITIES[entId];
    }
    return info;
  }

  addEntityAtRandomPosition(ent) {
    const openPos = this.getRandomOpenPosition();
    const p = openPos.split(",");
    this.addEntityAt(ent, parseInt(p[0]), parseInt(p[1]));
  }

  getRandomOpenPosition() {
    const x = Math.trunc(RNG.getUniform() * this.state.xdim);
    const y = Math.trunc(RNG.getUniform() * this.state.ydim);
    // console.log(x);
    // console.log(y);
    if (this.isPositionOpen(x, y)) {
      return `${x},${y}`;
    }

    return this.getRandomOpenPosition();
  }

  render(display, camera_map_x, camera_map_y) {
    if (!display || !display.getOptions) {
      return;
    }
    
    const width = display.getOptions().width;
    const height = display.getOptions().height;
    const xstart = camera_map_x - Math.trunc(width / 2);
    const ystart = camera_map_y - Math.trunc(height / 2);
    
    // Pre-calculate bounds to avoid repeated calculations
    const xend = xstart + width;
    const yend = ystart + height;
    
    for (let cx = 0; cx < width; cx++) {
      const mapX = xstart + cx;
      
      // Skip if outside map bounds
      if (mapX < 0 || mapX >= this.state.xdim) {
        // Render NULLTILE for entire column
        for (let cy = 0; cy < height; cy++) {
          TILES.NULLTILE.render(display, cx, cy);
        }
        continue;
      }
      
      for (let cy = 0; cy < height; cy++) {
        const mapY = ystart + cy;
        
        // Skip if outside map bounds
        if (mapY < 0 || mapY >= this.state.ydim) {
          TILES.NULLTILE.render(display, cx, cy);
          continue;
        }
        
        const pos = `${mapX},${mapY}`;
        const entityId = this.state.mapPosToEntityId[pos];
        
        if (entityId && DATASTORE.ENTITIES[entityId]) {
          DATASTORE.ENTITIES[entityId].render(display, cx, cy);
        } else {
          // Clean up invalid entity references
          if (entityId && !DATASTORE.ENTITIES[entityId]) {
            delete this.state.mapPosToEntityId[pos];
          }
          
          // Render tile (guaranteed to exist since we're in bounds)
          this.tileGrid[mapX][mapY].render(display, cx, cy);
        }
      }
    }
  }

  toJSON() {
    return this.state;
  }

  getTile(mapx, mapy) {
    // Add debugging to catch coordinate issues
    if (typeof mapx !== 'number' || typeof mapy !== 'number') {
      // console.warn("getTile called with invalid coordinates:", mapx, mapy, typeof mapx, typeof mapy);
      return TILES.NULLTILE;
    }
    
    if (
      mapx < 0 ||
      mapx > this.state.xdim - 1 ||
      mapy < 0 ||
      mapy > this.state.ydim - 1
    ) {
      return TILES.NULLTILE;
    }
    
    // Check if tileGrid exists and has the required dimensions
    if (!this.tileGrid || !this.tileGrid[mapx] || !this.tileGrid[mapx][mapy]) {
      console.warn("tileGrid access failed for coordinates:", mapx, mapy, "tileGrid dimensions:", this.tileGrid?.length, this.tileGrid?.[mapx]?.length);
      return TILES.NULLTILE;
    }
    
    return this.tileGrid[mapx][mapy];
  }
}

const TILE_GRID_GENERATOR = {
  "basic caves": function (xdim, ydim, rngState) {
    const tg = init2DArray(xdim, ydim, TILES.NULLTILE);
    const gen = new ROTMap.Cellular(xdim, ydim, { connected: true });
    const origRngState = RNG.getState();
    RNG.setState(rngState);
    gen.randomize(0.5);
    gen.create();
    gen.create();
    gen.create();
    gen.connect(function (x, y, isWall) {
      tg[x][y] =
        isWall || x == 0 || y == 0 || x == xdim - 1 || y == ydim - 1
          ? TILES.WALL
          : TILES.FLOOR;
    });
    RNG.setState(origRngState);
    
    // Post-process to ensure no entities can get trapped
    postProcessCaves(tg, xdim, ydim);
    
    return tg;
  },
  
  "open connected": function (xdim, ydim, rngState) {
    const tg = init2DArray(xdim, ydim, TILES.FLOOR);
    const origRngState = RNG.getState();
    RNG.setState(rngState);
    
    // Create border walls
    for (let x = 0; x < xdim; x++) {
      tg[x][0] = TILES.WALL;
      tg[x][ydim - 1] = TILES.WALL;
    }
    for (let y = 0; y < ydim; y++) {
      tg[0][y] = TILES.WALL;
      tg[xdim - 1][y] = TILES.WALL;
    }
    
    // Add some random walls but ensure connectivity
    const numWalls = Math.floor((xdim * ydim) * 0.1); // 10% walls
    for (let i = 0; i < numWalls; i++) {
      const x = Math.floor(RNG.getUniform() * (xdim - 2)) + 1;
      const y = Math.floor(RNG.getUniform() * (ydim - 2)) + 1;
      
      // Only place walls if they don't create isolated areas
      if (canPlaceWall(tg, x, y, xdim, ydim)) {
        tg[x][y] = TILES.WALL;
      }
    }
    
    RNG.setState(origRngState);
    return tg;
  },
  
  "maze like": function (xdim, ydim, rngState) {
    const tg = init2DArray(xdim, ydim, TILES.WALL);
    const origRngState = RNG.getState();
    RNG.setState(rngState);
    
    // Use ROT.js maze generator for guaranteed connectivity
    const maze = new ROTMap.EllerMaze(xdim, ydim);
    maze.create(function(x, y, wall) {
      if (x >= 0 && x < xdim && y >= 0 && y < ydim) {
        tg[x][y] = wall ? TILES.WALL : TILES.FLOOR;
      }
    });
    
    RNG.setState(origRngState);
    return tg;
  }
};

// Helper function to check if placing a wall would create isolated areas
function canPlaceWall(tg, x, y, xdim, ydim) {
  // Don't place walls on edges
  if (x <= 0 || x >= xdim - 1 || y <= 0 || y >= ydim - 1) {
    return false;
  }
  
  // Check if this would create a 2x2 wall block (which could trap entities)
  let wallCount = 0;
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (tg[x + dx][y + dy] === TILES.WALL) {
        wallCount++;
      }
    }
  }
  
  // Don't place walls if they would create too many adjacent walls
  return wallCount < 6;
}

// Post-process caves to remove potential traps
function postProcessCaves(tg, xdim, ydim) {
  let changed = true;
  let iterations = 0;
  const maxIterations = 5;
  
  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;
    
    for (let x = 1; x < xdim - 1; x++) {
      for (let y = 1; y < ydim - 1; y++) {
        if (tg[x][y] === TILES.WALL) {
          // Check if this wall creates a potential trap
          if (isTrapWall(tg, x, y, xdim, ydim)) {
            tg[x][y] = TILES.FLOOR;
            changed = true;
          }
        }
      }
    }
  }
}

// Check if a wall creates a potential trap
function isTrapWall(tg, x, y, xdim, ydim) {
  // Count floor tiles in 3x3 area around this wall
  let floorCount = 0;
  let wallCount = 0;
  
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (x + dx >= 0 && x + dx < xdim && y + dy >= 0 && y + dy < ydim) {
        if (tg[x + dx][y + dy] === TILES.FLOOR) {
          floorCount++;
        } else if (tg[x + dx][y + dy] === TILES.WALL) {
          wallCount++;
        }
      }
    }
  }
  
  // If this wall is surrounded by mostly walls, it might create a trap
  if (wallCount >= 6) {
    return true;
  }
  
  // Check for 2x2 wall blocks that could trap entities
  const directions = [[0,0], [1,0], [0,1], [1,1]];
  for (let startX = x - 1; startX <= x; startX++) {
    for (let startY = y - 1; startY <= y; startY++) {
      if (startX >= 0 && startX + 1 < xdim && startY >= 0 && startY + 1 < ydim) {
        let wallBlock = 0;
        for (const [dx, dy] of directions) {
          if (tg[startX + dx][startY + dy] === TILES.WALL) {
            wallBlock++;
          }
        }
        if (wallBlock >= 3) {
          return true;
        }
      }
    }
  }
  
  return false;
}

// Check if a wall can be safely removed
function canRemoveWall(tg, x, y, xdim, ydim) {
  // Don't remove border walls
  if (x <= 0 || x >= xdim - 1 || y <= 0 || y >= ydim - 1) {
    return false;
  }
  
  // Count adjacent walls
  let adjacentWalls = 0;
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      if (x + dx >= 0 && x + dx < xdim && y + dy >= 0 && y + dy < ydim) {
        if (tg[x + dx][y + dy] === TILES.WALL) {
          adjacentWalls++;
        }
      }
    }
  }
  
  // Can remove if it doesn't have too many adjacent walls
  return adjacentWalls <= 4;
}

export function MapMaker(mapData) {
  const m = new Map(mapData.xdim, mapData.ydim, mapData.mapType);
  if (mapData.id) {
    m.setId(mapData.id);
  }

  if (mapData.setupRngState) {
    m.setRngState(mapData.setupRngState);
  }

  DATASTORE.MAPS[m.getId()] = m;

  return m;
}

export { Map }; 