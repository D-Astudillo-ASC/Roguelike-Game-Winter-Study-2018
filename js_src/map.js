
import {TILES} from './tile.js';
import ROT from 'rot-js';
import {init2DArray,uniqueId} from './util.js';
import {DATASTORE} from './datastore.js';

class Map {
  constructor(xdim , ydim, mapType){
    // console.dir(TILES);
    this.state = {};
    this.state.xdim = xdim || 1;
    this.state.ydim = ydim || 1;
    this.state.mapType = mapType || 'basic caves';
    this.state.setupRngState = ROT.RNG.getState();
    this.state.id = uniqueId('map- '+this.state.mapType);
    this.state.entityIdToMapPos = {};
    this.state.mapPosToEntityId = {};
    // console.dir(this);
  }



  build(){
      //this.rng.setRngState(this.state.setupRngState);
      this.tileGrid = TILE_GRID_GENERATOR[this.state.mapType](this.state.xdim,this.state.ydim,this.state.setupRngState);

  }

  getId()
  {
    return this.state.id;
  }

  setId(newId){
    this.state.id = newId;
  }
  getEntityIdtoMapPos(){
    return this.state.entityIdToMapPos;
  }

  setEntityIdtoMapPos(newEntityIdToMapPos){
    this.state.entityIdToMapPos = newEntityIdToMapPos;
  }

  getMapPosToEntityId(){
    return this.state.entityIdToMapPos;
  }

  setMapPosToEntityId(newMapPosToEntityId){
    this.state.entityIdToMapPos = newMapPosToEntityId;
  }



  getXDim()
  {
    return this.state.xdim;
  }

  setXDim(newXdim){
    this.state.xdim = newXdim;
  }
  getYDim()
  {
    return this.state.ydim;
  }

  setYDim(newYdim){
    this.state.ydim = newYdim;
  }
  getMapType()
  {
    return this.state.mapType;
  }

  setMapType(newMapType){
    this.state.mapType = newMapType;
  }
  getRngState()
  {
    return this.state.setupRngState;
  }

  setRngState(newRngState){
    this.state.setupRngState = newRngState;
  }

  updateEntityPosition(ent,newMapX,newMapY){
    let oldPos = this.state.entityIdToMapPos[ent.getId()];
    // console.log(this.state.mapPosToEntityId);
    delete this.state.mapPosToEntityId[oldPos];

    this.state.mapPosToEntityId[`${newMapX},${newMapY}`] = ent.getId();

    this.state.entityIdToMapPos[ent.getId()] = `${newMapX},${newMapY}`;

  }

  extractEntity(ent){

    delete this.state.mapPosToEntityId[this.state.entityIdToMapPos[ent.getId()]];

    delete this.state.entityIdToMapPos[ent.getId()];

    return ent;

  }
  addEntityAt(ent,mapx,mapy){
    let pos = `${mapx},${mapy}`;
    this.state.entityIdToMapPos[ent.getId()] = pos;
    this.state.mapPosToEntityId[pos] = ent.getId();
    ent.setMapId(this.getId());
    ent.setX(mapx);
    ent.setY(mapy);
  }

  isPositionOpen(x,y){
    if (this.tileGrid[x][y].isA('floor')){
      return true;
    }

    return false;
  }

  getTargetPositionInfo(x,y){
    let info = {
      entity: '',
      tile: this.getTile(x,y)
    };
    let entId = this.state.mapPosToEntityId[`${x},${y}`];
    if(entId){
      info.entity = DATASTORE.ENTITIES[entId];
    }
    return info;
  }

  addEntityAtRandomPosition(ent){

    let openPos = this.getRandomOpenPosition();
    let p = openPos.split(',');
    this.addEntityAt(ent, p[0],p[1]);
    
  }

  getRandomOpenPosition(){

    let x = Math.trunc(ROT.RNG.getUniform()*this.state.xdim);
    let y = Math.trunc(ROT.RNG.getUniform()*this.state.ydim);
    // console.log(x);
    // console.log(y);
    if(this.isPositionOpen(x,y)){
      return `${x},${y}`;
    }

    return this.getRandomOpenPosition();
  }


  render(display,camera_map_x,camera_map_y){
    //
    console.log("Rendering map");
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
            let pos = `${x1},${y1}`;
            // console.log(pos);
            if(this.state.mapPosToEntityId[pos]){
              //console.log(pos);
              //console.log('found entity:');
              // console.dir(DATASTORE.ENTITIES[this.state.mapPosToEntityId[pos]]);
              // console.dir(display);
              // console.log(cx);
              // console.log(cy);
              DATASTORE.ENTITIES[this.state.mapPosToEntityId[pos]].render(display,cx,cy);
            }
            else {
               this.getTile(x1,y1).render(display,cx,cy);
            }

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
      console.log("tile generation rng state is: ")
      console.dir(ROT.RNG.getState());
      //ROT.RNG.setSeed(12);
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
  // console.log("Map is: ");
  // console.dir(m);
  if(mapData.mapPosToEntityId){
    m.setMapPosToEntityId(mapData.mapPosToEntityId);
  }

  if(mapData.entityIdToMapPos){
    m.setEntityIdtoMapPos(mapData.entityIdToMapPos);
  }

  if(mapData.id){
    m.setId(mapData.id);
  }

  if(mapData.setupRngState){
    m.setRngState(mapData.setupRngState);
  }


  DATASTORE.MAPS[m.getId()] = m;
  //m.build();
  return m;
}
