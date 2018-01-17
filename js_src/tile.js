
import {DisplaySymbol} from './display_symbol.js';

export class Tile extends DisplaySymbol {
  constructor(template){
    super(template)
    this.name = template.name;
    this.transparent = template.transparent || false;
    this.passable = template.passable || false;
  }

  isImpassable(){
    return !this.passable;
  }

  isPassable(){
    return this.passable;
  }

  setPassable(newVal){
    this.passable = newVal;
  }
  isTransparent(){
    return this.transparent;
  }

  setTransparent(newVal){
    this.transparent = newVal;
  }

  isOpaque(){
    return !this.transparent;
  }

  isA(name){
    return this.name == name;
  }
}

export let TILES = {
  NULLTILE: new Tile({name:'nulltile',chr: '!',transparent:false,passable:false}),
  WALL: new Tile({name:'wall',chr:'|',transparent:false,passable:false}),
  FLOOR: new Tile({name:'floor',chr:' ',transparent:true,passable:true})
}
