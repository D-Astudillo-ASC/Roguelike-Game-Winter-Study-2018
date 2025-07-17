import { TILES } from "./tile.js";
import { RNG, Map as ROTMap } from "rot-js";
import { init2DArray, uniqueId } from "./util.js";
import { DATASTORE } from "./datastore.js";

class Map {
  constructor(xdim, ydim, mapType) {
    console.dir(TILES);
    this.state = {};
    this.state.xdim = xdim || 1;
    this.state.ydim = ydim || 1;
    this.state.mapType = mapType || "basic caves";
    this.state.setupRngState = RNG.getState();
    this.state.id = uniqueId("map- " + this.state.mapType);
    this.state.entityIdToMapPos = {};
    this.state.mapPosToEntityId = {};
    console.dir(this);
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
    console.log(this.state.mapPosToEntityId);
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
  addEntityAt(ent, mapx, mapy) {
    const pos = `${mapx},${mapy}`;
    this.state.entityIdToMapPos[ent.getId()] = pos;
    this.state.mapPosToEntityId[pos] = ent.getId();
    ent.setMapId(this.getId());
    ent.setX(mapx);
    ent.setY(mapy);
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
    this.addEntityAt(ent, p[0], p[1]);
  }

  getRandomOpenPosition() {
    const x = Math.trunc(RNG.getUniform() * this.state.xdim);
    const y = Math.trunc(RNG.getUniform() * this.state.ydim);
    console.log(x);
    console.log(y);
    if (this.isPositionOpen(x, y)) {
      return `${x},${y}`;
    }

    return this.getRandomOpenPosition();
  }

  render(display, camera_map_x, camera_map_y) {
    let cx = 0;
    let cy = 0;
    const xstart = camera_map_x - Math.trunc(display.getOptions().width / 2);
    const xend = xstart + display.getOptions().width;
    const ystart = camera_map_y - Math.trunc(display.getOptions().height / 2);
    const yend = ystart + display.getOptions().height;
    for (let x1 = xstart; x1 < xend; x1++) {
      for (let y1 = ystart; y1 < yend; y1++) {
        const pos = `${x1},${y1}`;
        // console.log(pos);
        if (this.state.mapPosToEntityId[pos]) {
          console.log("found entity:");
          console.dir(DATASTORE.ENTITIES[this.state.mapPosToEntityId[pos]]);
          console.dir(display);
          console.log(cx);
          console.log(cy);
          DATASTORE.ENTITIES[this.state.mapPosToEntityId[pos]].render(
            display,
            cx,
            cy,
          );
        } else {
          this.getTile(x1, y1).render(display, cx, cy);
        }

        cy++;
      }

      cx++;
      cy = 0;
    }
  }

  toJSON() {
    return JSON.stringify(this.state);
  }

  getTile(mapx, mapy) {
    if (
      mapx < 0 ||
      mapx > this.state.xdim - 1 ||
      mapy < 0 ||
      mapy > this.state.ydim - 1
    ) {
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
    return tg;
  },
};

export function MapMaker(mapData) {
  const m = new Map(mapData.xdim, mapData.ydim, mapData.mapType);
  if (mapData.id) {
    m.setId(mapData.id);
  }

  if (mapData.setupRngState) {
    m.setId(mapData.setupRngState);
  }

  DATASTORE.MAPS[m.getId()] = m;

  return m;
}

export { Map };
