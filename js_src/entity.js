import {uniqueId} from './util.js';
import {DisplaySymbol} from './display_symbol.js';
import {DATASTORE} from './datastore.js';


export class Entity extends DisplaySymbol{
    constructor(template){
      super(template);
      this.name = template.name;
      this.state = {};
      this.state.x = 0;
      this.state.y= 0;
      this.state.mapId = 0;
      this.state.id = uniqueId();
    }

    getId()
    {
      return this.state.id;
    }

    setId(newId)
    {
      this.state.id = newId;
    }

    getName()
    {
      return this.state.name;
    }

    setName(newName)
    {
      this.state.name = newName;
    }

    getX(){
      return this.state.x;
    }

    setX(newX){
      this.state.x = newX;
    }


    getY(){
      return this.state.y;
    }

    setY(newY){
      this.state.y = newY;
    }

    getPos()
    {
        return `${this.state.x},${this.state.y}`;
    }

    getMapId(){
      return this.state.mapId;
    }

    setMapId(newInfo){
      this.state.mapId = newInfo;
    }
    getMap(){
      return DATASTORE.MAPS[this.state.mapId];
    }

    moveBy(dx,dy){
      let newX = this.state.x*1 + dx*1;
      let newY = this.state.y*1 + dy*1;

      if(this.getMap().isPositionOpen(newX,newY)){

        this.state.x = newX;
        this.state.y = newY;
        this.getMap().updateEntityPosition(this, this.state.x,this.state.y);
        return true;
      }
      return false;

    }

    toJSON(){
      return JSON.stringify(this.state);
    }

    fromJSON(s){
      this.state = JSON.parse(s);
    }
}
