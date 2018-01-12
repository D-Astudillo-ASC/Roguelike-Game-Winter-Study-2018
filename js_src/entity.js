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

    getName(){
      return this.state.name;
    }

    setName(newInfo){
      this.state.name = newInfo;
    }

    getX(){
      return this.state.x;
    }

    setX(newInfo){
      this.state.x = newInfo;
    }


    getY(newInfo){
      return this.state.y;
    }

    setY(newInfo){
      this.state.y = newInfo;
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

    getId()
    {
      return this.state.id;
    }

    setId(newInfo)
    {
      this.state.id = newInfo;
    }
    moveBy(dx,dy){
      let newX = this.state.x*1 + dx*1;
      let newY = this.state.y*1 + dy*1;

      if(this.getMap().isPositionOpen(newX,newY)){

        this.state.x = newX;
        this.state.y = newY;
        this.getMap().updateEntityPosition(this,this.state.x,this.state.y);
        return true;
      }
      return false;

    }


}
