
import {TILES} from './tile.js';
import ROT from 'rot-js';
import {init2DArray,uniqueId} from './util.js';
import {DATASTORE} from './datastore.js';

class Map {
  constructor(xdim , ydim, mapType){
    console.dir(TILES);
    this.state = {};
    this.state.xdim = xdim || 1;
    this.state.ydim = ydim || 1;
    this.state.mapType = mapType || 'basic caves';
    this.state.setupRngState = ROT.RNG.getState();
    this.state.id = uniqueId('map- '+this.state.mapType);
    console.dir(this);
  }

  build(){
      this.tileGrid = TILE_GRID_GENERATOR[this.state.mapType](this.state.xdim,this.state.ydim,this.state.setupRngState);

  }

  getId()
  {
    return this.state.id;
  }

  setId(newId){
    this.state.id = newId;
  }

  getXDim()
  {
    return this.state.xdim;
  }

  setXDim(newId){
    this.state.xdim = newX;
  }
  getYDim()
  {
    return this.state.ydim;
  }

  setYDim(newId){
    this.state.ydim = newId;
  }
  getMapType()
  {
    return this.state.mapType;
  }

  setMapType(newId){
    this.state.mapType = newId;
  }
  getRngState()
  {
    return this.state.setupRngState;
  }

  setRngState(newId){
    this.state.setupRngState = newId;
  }
  render(display,camera_map_x,camera_map_y){
    let cx = 0;
    let cy = 0;
    let xstart = camera_map_x - Math.trunc(display.getOptions().width/2) ;
    let xend = xstart + display.getOptions().width;
    let ystart = camera_map_y - Math.trunc(display.getOptions().height/2);
    let yend = ystart + display.getOptions().height;
    for(let x1 = xstart; x1 < xend; x1++)
    {
       for( let y1 = ystart; y1 < yend; y1++)
       {
            this.getTile(x1,y1).render(display,cx,cy);
            cy++;
       }

       cx++;
       cy = 0;
    }

  }

  toJSON(){
    return JSON.stringify(this.state);
  }

  getTile(mapx,mapy){
    if(mapx < 0 || mapx > this.state.xdim-1 || mapy < 0 || mapy > this.state.ydim-1)
    {
      return TILES.NULLTILE;
    }
    return this.tileGrid[mapx][mapy];
  }
}

let TILE_GRID_GENERATOR = {
  'basic caves': function (xdim,ydim,rngState) {
      let tg = init2DArray(xdim, ydim, TILES.NULLTILE);
      let gen = new ROT.Map.Cellular(xdim, ydim, { connected: true });
      let origRngState = ROT.RNG.getState();
      ROT.RNG.setState(rngState);
      gen.randomize(.5);
      gen.create();
      gen.create();
      gen.create();
      gen.connect(function(x,y,isWall) {
        tg[x][y] = (isWall || x==0 || y==0 || x==xdim-1 || y==ydim-1) ? TILES.WALL : TILES.FLOOR;
      });

      ROT.RNG.setState(origRngState);
      return tg;
  }
}

export function MapMaker(mapData){
  let m = new Map(mapData.xdim,mapData.ydim,mapData.mapType);
  if(mapData.Id){
    m.setId(mapData.id);
  }

  if(mapData.setupRngState){
    m.setRngState(mapData.setupRngState);
  }

  DATASTORE.MAPS[m.getId()] = m;

  return m;
}
