import {Message} from './message.js';
import {MapMaker} from './map.js';
import {init2DArray} from './util.js';
import {DisplaySymbol} from './display_symbol.js';
import {TILES} from './tile.js';
import {DATASTORE,initDataStore} from './datastore.js';
import {EntityFactory} from './entity_templates.js';
import {Entity} from './entity.js';
import {SCHEDULER,TIME_ENGINE,initTiming} from './timing.js';
import {COMMAND,getCommandFromInput,setKeyBinding} from './commands.js';

class UIMode {
  constructor(thegame){
    console.log("created" +this.constructor.name);
    this.game = thegame;
    this.display = this.game.getDisplay("main");
  }

  enter(){
    console.log("entering" +this.constructor.name);
  }
  exit(){
    console.log("exiting" +this.constructor.name);
  }
  handleInput(eventType, evt){
    console.log("handling input for" +this.constructor.name);
    UIMode.dumpInput(inputType,inputData);
    return false;
  }
  render(display) {
    console.log("rendering" + this.constructor.name);
    display.drawText(2,2,"rendering" + this.constructor.name);
  }

  renderAvatar(display){
    display.clear();
  }

  static dumpInput(inputType, inputData){
    console.log(`inputType: ${inputType}`);
    console.log('inputData: ');
    console.dir(inputData);
  }

  toJSON(){}
  fromJSON(){}
}

export class StartupMode extends UIMode {
  enter(){
    super.enter();
    Message.send("Welcome! Bienvenido! Bienvenue!");
  }

  render(){
  this.display.drawText(2,2, "Welcome!");
  this.display.drawText(2,4,"Press any key to continue");
  }

  handleInput(inputType, inputData){

    if(inputType == 'keypress' && inputData.charCode !== 0){
      this.keyPressGate = true;
    }

    if(inputType == 'keyup' && this.keyPressGate){
    this.game.switchModes('persistence');
    }
    return false;
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
    this.game.isPlaying = true;
  }
  enter(){
    if(!this.state.mapId)
    {
      let m = MapMaker({xdim:300, ydim:160, mapType:'basic caves'});
      this.state.mapId = m.getId();
      m.build();
      this.state.cameramapx = 0;
      this.state.cameramapy = 0;
    }
    TIME_ENGINE.unlock();
    setKeyBinding(['play','movement_wasd','universal']);
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
    let m = MapMaker({xdim:20, ydim:15});
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

    // for (let mossCount = 0; mossCount < 3; mossCount++){
    //   m.addEntityAtRandomPosition(EntityFactory.create('moss'));
    // }

    for(let monsterCount = 0; monsterCount < 1;monsterCount++){
      m.addEntityAtRandomPosition(EntityFactory.create('monster'));
    }

  }
  render(display){
    // console.dir(DATASTORE);
    // console.dir(this);
    display.clear();
    DATASTORE.MAPS[this.state.mapId].render(display, this.state.cameramapx,this.state.cameramapy);
    // DATASTORE.MAPS[this.state.mapId].render(display, 15, 10);
    // this.cameraSymbol.render(display,display.getOptions().width/2,display.getOptions().height/2);
  }

  renderAvatar(display){
    display.clear();
    let a = this.getAvatar();
    // console.log(a.getTime());
    // console.log(a.getHp());
    display.drawText(1,0,"AVATAR: "+ a._chr);
    display.drawText(1,2,"Time: "+ a.getTime());
    display.drawText(1,3,"Location: "+ a.getX() + "," + a.getY());
    display.drawText(1,4,"HP: "+ a.getHp() + "/" + a.getMaxHp());
    display.drawText(1,5,"Attack: "+ a.getMeleeDamage());
  }

  // WinOrLose(){
  //
  //
  // }
    handleInput(inputType, inputData){
      let gameComm = getCommandFromInput(inputType,inputData);

      if(gameComm == COMMAND.NULLCOMMAND){
        return false;
      }

      else if(gameComm == COMMAND.UP){
        this.moveAvatar(0,-1);
      }

      else if(gameComm == COMMAND.LEFT){
        this.moveAvatar(-1,0);
      }

      else if(gameComm == COMMAND.RIGHT){
        this.moveAvatar(1,0);
      }

      else if(gameComm == COMMAND.DOWN){
        this.moveAvatar(0,1);
      }

      else if (gameComm == COMMAND.PAUSE){
        this.game.switchModes('persistence');
      }

    // if(eventType == 'keyup'){
    //   console.dir(evt);
    //   if(evt.key == 'v')
    //   {
    //
    //     this.game.switchModes('win');
    //     return true;
    //   }
    //
    //   if (evt.key == 'l')
    //   {
    //     this.game.switchModes('lose');
    //     return true;
    //   }
    //
    //   if(evt.key == 'p')
    //   {
    //     this.game.switchModes('persistence');
    //     return true;
    //   }
    //
    //
    //   if(evt.key === 'a'){
    //     console.log('move left');
    //     this.moveAvatar(-1,0);
    //     return true;
    //   }
    //
    //   if(evt.key === 'd'){
    //     this.moveAvatar(1,0);
    //     return true;
    //   }
    //
    //   if(evt.key === 'w'){
    //     this.moveAvatar(0,-1);
    //     return true;
    //   }
    //
    //   if(evt.key === 's'){
    //     this.moveAvatar(0,1);
    //     return true;
    //   }
    }


  moveAvatar(dx,dy){
    // console.log(this.getAvatar());
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
    // console.dir(this);
    // console.log(DATASTORE.ENTITIES[this.state.avatarId]);
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
  enter(){
    super.enter();
    if(window.localStorage.getItem(this.game._PERSISTANCE_NAMESPACE)){
      this.game.hasSaved = true;
    }
    setKeyBinding('persistence');
  }
  render(){
    this.display.clear();
    this.display.drawText(2,3,"N for New Game");
    if(this.game.isPlaying){
      this.display.drawText(2,4,"S to Save Game");
      this.display.drawText(2,6,"Escape to return to game")
    }

    if(this.game.hasSaved){
      this.display.drawText(2,5,"L to Load Game");
    }
  }

  handleInput(inputType, inputData){

    let gameComm = getCommandFromInput(inputType,inputData);

    if(gameComm == COMMAND.NULLCOMMAND){
      return false;
    }

    if(gameComm == COMMAND.NEW_GAME){
      this.game.setupNewGame();
      Message.send("New Game Created");
      this.game.switchModes('play');
    }

    else if(gameComm == COMMAND.SAVE_GAME){
      if(this.game.isPlaying){
        this.handleSave();
      }
    }

    else if(gameComm == COMMAND.LOAD_GAME){
      if(this.game.hasSaved){
        this.handleRestore();
      }
    }

    else if(gameComm == COMMAND.CANCEL){
      if(this.game.isPlaying){
        this.game.switchModes('play');
      }
    }
    return false;
  }

 handleSave() {
  console.log("save game");
  if(!this.localStorageAvailable())
  {
    return;
  }
  window.localStorage.setItem(this.game._PERSISTANCE_NAMESPACE, JSON.stringify(DATASTORE));
  this.game.hasSaved = true;
  Message.send("Game saved");
  this.game.switchModes('play');
 }

 handleRestore() {
  console.log("load game");
  if (!this.localStorageAvailable())
  {
    return;
  }

  let restorationString = window.localStorage.getItem(this.game._PERSISTANCE_NAMESPACE);
  let state = JSON.parse(restorationString);

  initDataStore();
  DATASTORE.ID_SEQ = state.ID_SEQ;
  DATASTORE.GAME = this.game;
  this.game.fromJSON(state.GAME);
  for (let entId in state.ENTITIES){
      console.log("pre-restore entities");
      DATASTORE.ENTITIES[entId] = JSON.parse(state.ENTITIES[entId]);
      console.dir(DATASTORE.ENTITIES[entId]);
      let ent = EntityFactory.create(DATASTORE.ENTITIES[entId].name,DATASTORE.ENTITIES[entId]);
      //delete DATASTORE.ENTITIES[entId];
      console.log("post-restore entities");
  }

  for (let mapId in state.MAPS){
    console.log("pre-restore map");
    let mapData = JSON.parse(state.MAPS[mapId]);
    DATASTORE.MAPS[mapId]= MapMaker(mapData);
    DATASTORE.MAPS[mapId].build();
    console.log(JSON.stringify(DATASTORE.MAPS[mapId].tileGrid));
    console.log("post-restore map");
  }
  //this.game.fromJSON(state.GAME);
  // console.log('post-save data store: ');
  // console.dir(DATASTORE);
  this.game.switchModes('play');
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
