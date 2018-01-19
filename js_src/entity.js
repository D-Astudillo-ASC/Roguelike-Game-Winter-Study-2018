import {uniqueId} from './util.js';
import {MixableSymbol} from './mixable_symbol.js';
import {DATASTORE} from './datastore.js';
import {SCHEDULER} from './timing.js';

export class Entity extends MixableSymbol{
    constructor(template){
      super(template);
      if(!this.state){
        this.state = {};
      }
      this.state.name = template.name;
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

    destroy()
    {
      this.getMap().extractEntity(this);

      delete DATASTORE[this.getId()];
      SCHEDULER.remove(this);
    }

    toJSON(){
      return JSON.stringify(this.state);
    }

    fromJSON(s){
      this.state = JSON.parse(s);
    }
}
