import {Message} from './message.js';
import {MapMaker} from './map.js';
import {init2DArray} from './util.js';
import {DisplaySymbol} from './display_symbol.js';
import {TILES} from './tile.js';
import {DATASTORE,clearDataStore} from './datastore.js';
import {EntityFactory} from './entity_templates.js';
import {Entity} from './entity.js';
import {SCHEDULER,TIME_ENGINE,initTiming} from './timing.js';

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

  renderAvatar(display){
    display.clear();
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
    this.game.switchModes('persistence');
    return true;
    }
  }
}


export class PlayMode extends UIMode {
  constructor(thegame){
    super(thegame);
    this.state = {
      mapId : '',
      cameramapx : '',
      cameramapy : '',
    };
  }



  enter(){
    if(!this.state.mapId)
    {
      let m = MapMaker({xdim:300, ydim:160, mapType:'basic caves'});
      this.state.mapId = m.getId();
      m.build();
      this.state.cameramapx = 5;
      this.state.cameramapy = 8;
    }
    TIME_ENGINE.unlock();
    this.cameraSymbol = new DisplaySymbol('@','#eb4');
  }

  toJSON(){
    return JSON.stringify(this.state);
  }

  restoreFromState(stateData){
    this.state = JSON.parse(stateData);
  }

  setupNewGame(){
    initTiming();
    let m = MapMaker({xdim:30, ydim:20});
    this.state.mapId = m.getId();
    Message.send("Building map....");
    this.game.renderMessage();
    m.build();
    this.state.cameramapx = 0;
    this.state.cameramapy = 0;
    let a = EntityFactory.create('avatar');
    this.state.avatarId = a.getId();
    console.log('about to call add entity');
    m.addEntityAtRandomPosition(a);
    this.moveCameraToAvatar();

    for (let mossCount = 0; mossCount < 10; mossCount++){
      m.addEntityAtRandomPosition(EntityFactory.create('moss'));
    }

    for(let monsterCount = 0; monsterCount < 1;monsterCount++){
      m.addEntityAtRandomPosition(EntityFactory.create('monster'));
    }

  }
  render(display){
    console.dir(DATASTORE);
    console.dir(this);
    display.clear();
    DATASTORE.MAPS[this.state.mapId].render(display, this.state.cameramapx,this.state.cameramapy);
    // DATASTORE.MAPS[this.state.mapId].render(display, 15, 10);
    // this.cameraSymbol.render(display,display.getOptions().width/2,display.getOptions().height/2);
  }

  renderAvatar(display){
    display.clear();
    let a = this.getAvatar();
    console.log(a.getTime());
    console.log(a.getHp());
    display.drawText(1,0,"AVATAR: "+ a.chr);
    display.drawText(1,2,"Time: "+ a.getTime());
    display.drawText(1,3,"Location: "+ a.getX() + "," + a.getY());
    display.drawText(1,4,"HP: "+ a.getHp() + "/" + a.getMaxHp());
  }
    handleInput(eventType, evt){
    if(eventType == 'keyup'){
      console.dir(evt);
      if(evt.key == 'v')
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


      if(evt.key === 'a'){
        console.log('move left');
        this.moveAvatar(-1,0);
        return true;
      }

      if(evt.key === 'd'){
        this.moveAvatar(1,0);
        return true;
      }

      if(evt.key === 'w'){
        this.moveAvatar(0,-1);
        return true;
      }

      if(evt.key === 's'){
        this.moveAvatar(0,1);
        return true;
      }
    }
  }
  moveAvatar(dx,dy){
    console.log(this.getAvatar());
    if(this.getAvatar().tryWalk(dx,dy))
    {
      this.moveCameraToAvatar();
      //this.getAvatar().addTime(1);
      return true;
    }

    return false;
    //this.state.cameramapx += dx;
    //this.state.cameramapy += dy;
    // DATASTORE.CAMERA_X = this.state.cameramapx;
    // DATASTORE.CAMERA_Y = this.state.cameramapy;
  }

  moveCameraToAvatar(){
    this.state.cameramapx = this.getAvatar().getX();
    this.state.cameramapy = this.getAvatar().getY();

  }

  getAvatar(){
    //console.log('avatar created');
    console.dir(this);
    console.log(DATASTORE.ENTITIES[this.state.avatarId]);
    return DATASTORE.ENTITIES[this.state.avatarId];

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
      this.game.switchModes('play');
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
  window.localStorage.setItem('roguelikegame', JSON.stringify(DATASTORE));

 }

 handleRestore() {
  console.log("load game");
  if (! this.localStorageAvailable())
  {
    return false;
  }

  let restorationString = window.localStorage.getItem('roguelikegame');
  let state = JSON.parse(restorationString);

  clearDataStore();
  DATASTORE.ID_SEQ = state.ID_SEQ;
  DATASTORE.GAME = this.game;

  this.game.fromJSON(state.GAME);

  for (let mapId in state.MAPS){
    let mapData = JSON.parse(state.MAPS[mapId]);
    DATASTORE.MAPS[mapId]= MapMaker(mapData);
    DATASTORE.MAPS[mapId].build();
  }

  for (let entId in state.ENTITIES){
      DATASTORE.ENTITIES[entId] = JSON.parse(state.ENTITIES[entId]);
      let ent = EntityFactory.create(DATASTORE.ENTITIES[entId].name);
      if (DATASTORE.ENTITIES[entId].name == 'avatar') {
        this.game.modes.play.state.avatarId = ent.getId();
      }
      DATASTORE.MAPS[Object.keys(DATASTORE.MAPS)[0]].addEntityAt(ent, DATASTORE.ENTITIES[entId].x, DATASTORE.ENTITIES[entId].y)
      delete DATASTORE.ENTITIES[entId];
  }

  console.log('post-save data store: ');
  console.dir(DATASTORE);
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
