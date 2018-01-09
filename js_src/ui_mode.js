import {Message} from './message.js'
import {Map} from './map.js'
import {init2DArray} from './util.js'
import {DisplaySymbol} from './display_symbol.js'
import {TILES} from './tile.js'
class UIMode {
  constructor(thegame){
    console.log("created" +this.constructor.name);
    this.game = thegame;
  }

  enter(){
    console.log("entering" +this.constructor.name);
  }
  exit(){
    console.log("exiting" +this.constructor.name);
  }
  handleInput(eventType, evt){
    console.log("handling input for" +this.constructor.name);
  }
  render(display) {
    console.log("rendering" + this.constructor.name);
    display.drawText(2,2,"rendering" + this.constructor.name);
  }

}

export class StartupMode extends UIMode {
  render(display){
  display.drawText(2,2, "Welcome");
  display.drawText(2,3,"Press any key to continue");
  }

  handleInput(eventType, evt){
    if(eventType == 'keyup'){
    console.dir(evt);
    this.game.switchModes('play');
    return true;
    }
  }
}


export class PlayMode extends UIMode {
  enter(){
    if(! this.map)
    {
      this.map = new Map(300,160);
    }
    this.camerax = 5;
    this.cameray = 8;
    this.cameraSymbol = new DisplaySymbol('@','#eb4');
  }
  render(display){
    display.clear();
    this.map.render(display, this.camerax,this.cameray);
    this.cameraSymbol.render(display,display.getOptions().width/2,display.getOptions().height/2);
  }

    handleInput(eventType, evt){
    if(eventType == 'keyup'){
      console.dir(evt);
      if(evt.key == 'w')
      {

        this.game.switchModes('win');
        return true;
      }

      if (evt.key == 'l')
      {
        this.game.switchModes('lose');
        return true;
      }

      if(evt.key == 'p')
      {
        this.game.switchModes('persistence');
        return true;
      }

      if(evt.key === '1'){
        console.log('move left');
        this.moveCamera(-1,0);
        return true;
      }

      if(evt.key === '3'){
        this.moveCamera(1,0);
        return true;
      }

      if(evt.key === '5'){
        this.moveCamera(0,-1);
        return true;
      }

      if(evt.key === '2'){
        this.moveCamera(0,1);
        return true;
      }
    }

  }

  moveCamera(dx,dy){
    this.camerax += dx;
    this.cameray += dy;
  }

}


export class WinMode extends UIMode {

  render(display){
    display.clear();
    display.drawText(2,2,"Victory!!!");
  }

  handleInput(eventType,evt)
  {
    if(evt.key == 'Escape')
    {
      this.game.switchModes('play');
      return true;
    }
  }

}
export class LoseMode extends UIMode {
  render(display){
    display.clear();
    display.drawText(2,2,"You lose!");
  }
  handleInput(eventType,evt)
  {
    if(evt.key == 'Escape')
    {
      this.game.switchModes('play');
      return true;
    }
  }
}

export class PersistenceMode extends UIMode {
  render(display){
    display.clear();
    display.drawText(2,3,"N for New Game");
    display.drawText(2,4,"S to Save Game");
    display.drawText(2,5,"L to Load Game");
  }

  handleInput(eventType, evt){
  if(eventType == 'keyup'){
    if(evt.key == 'N'||evt.key == 'n')
    {
      console.log("new game");
      this.game.setupNewGame();
      return true;
    }

    if (evt.key == 'S'||evt.key == 's')
    {
      this.handleSave();
      this.game.switchModes('play');
      console.log("save game");
      return true;
    }

    if(evt.key == 'L'||evt.key == 'l')
    {
      this.handleRestore();
      this.game.switchModes('play');
      console.log("load game");
      return true;
    }

    if(evt.key == 'Escape')
    {
      this.game.switchModes('play');
      return true;
    }
  }
  return false;
 }

 handleSave() {
  console.log("save game");
  if(!this.localStorageAvailable())
  {
    return false;
  }
  window.localStorage.setItem('roguelikegame', this.game.toJSON());
 }

 handleRestore() {
  console.log("load game");
  if (! this.localStorageAvailable())
  {
    return false;
  }

  let restorationString = window.localStorage.getItem('roguelikegame');
  this.game.fromJSON(restorationString);
 }

 localStorageAvailable(){
    // see https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
    try{
      var x = '__storage_test__';
      window.localStorage.setItem( x, x);
      window.localStorage.removeItem(x);
      return true;
    }
    catch(e){
      Message.send('Sorry, no local data storage is available for this browser so game save/load is not possible');
      return false;
    }
  }

}
