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
  this.display.drawText(30,4,"The");
  this.display.drawText(30,5,"Last");
  this.display.drawText(30,6,"Stand!!");
  this.display.drawText(24,13,"Press any key to continue");
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
      this.game.setupNewGame();
    }
    TIME_ENGINE.unlock();
    setKeyBinding(['play','movement_wasd','universal']);
    // this.cameraSymbol = new DisplaySymbol('@','#eb4');
  }

  toJSON(){
    return JSON.stringify(this.state);
  }

  restoreFromState(stateData){
    this.state = JSON.parse(stateData);
  }

  setupNewGame(){
    //SCHEDULER.clear();
    console.log("play mode set up new game");
    initTiming();
    initDataStore();
    DATASTORE.GAME = this.game;
    //DATASTORE.LEVEL = this.state.level;
    let m = MapMaker({xdim:70, ydim:70});
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
    console.log("datastore post game setup");
    console.dir(DATASTORE);

    // for (let mossCount = 0; mossCount < 3; mossCount++){
    //   m.addEntityAtRandomPosition(EntityFactory.create('moss'));
    // }
    for(let monsterCount = 0; monsterCount < 5;monsterCount++){
      m.addEntityAtRandomPosition(EntityFactory.create('monster'));
    }

    for(let herbCount = 0; herbCount < 5;herbCount++){
      m.addEntityAtRandomPosition(EntityFactory.create('herb'));
    }

    for(let xCount = 0; xCount < 2; xCount++){
      m.addEntityAtRandomPosition(EntityFactory.create('X-Ray'));
    }

    for(let uvCount = 0; uvCount < 2; uvCount++){
      m.addEntityAtRandomPosition(EntityFactory.create('UV Radiation'));
    }
    for(let gammaCount = 0; gammaCount < 2; gammaCount++){
      m.addEntityAtRandomPosition(EntityFactory.create('Gamma Radiation'));
    }

  }

  // startNewLevel(avatar, x, y, level) {
  //   //initTiming();
  //   //this._STATE = {};0
  //   // x = 20 + x;
  //   // y = 20 + y;
  //   let m = MapMaker({xdim: x,ydim: y});
  //   //m.build();
  //   this._STATE.curMapId = m.getId();
  //   this._STATE.cameraMapLoc = {
  //     x: Math.round(m.getXDim()/2),
  //     y: Math.round(m.getYDim()/2)
  //   };
  //   this._STATE.cameraDisplayLoc = {
  //     x: Math.round(this.display.getOptions().width/2),
  //     y: Math.round(this.display.getOptions().height/2)
  //   };
  //
  //   //DisplaySymbol({'name': 'avatar', 'chr':'@', 'fg' '#eb4'});
  //   //let a = EntityFactory.create('avatar');
  //   this._STATE.avatarId = avatar.getId();
  //   m.addEntityAtRandomPosition(avatar);
  //   this.moveCameraToAvatar();
  //
  //   for(let mossCount = 0; mossCount< (5*level) ; mossCount++){
  //     m.addEntityAtRandomPosition(EntityFactory.create('moss'));
  //   }
  //   for(let monsterCount = 0; monsterCount < (5*level);monsterCount++){
  //     m.addEntityAtRandomPosition(EntityFactory.create('monster'));
  //   }
  //   if (level < 20){
  //     m.addEntityAtRandomPosition(EntityFactory.create('portal'));
  //   } else {
  //     m.addEntityAtRandomPosition(EntityFactory.create('finish'));
  //   }
  // }

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
    display.drawText(1,2,"Steps: "+ a.getTime());
    display.drawText(1,3,"Location: "+ a.getX() + "," + a.getY());
    display.drawText(1,4,"Kills: "+ a.getKills());
    display.drawText(1,6,"HP: "+ a.getHp() + "/" + a.getMaxHp());
    display.drawText(1,7,"Attack: "+ a.getMeleeDamage());
    display.drawText(1,8,"Defense: "+ a.getMeleeDefense());
    display.drawText(1,9,"Rad. Resist : "+ a.getRadResist());
    display.drawText(1,11,"Enemies Left: " +a.getEntities());

    if(a.getEntities() == 0){
      this.game.switchModes('win');
    }
  }
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

      else if(gameComm == COMMAND.PAUSE){
        this.game.switchModes('persistence');
      }
    }


  moveAvatar(dx,dy){
    // console.log(this.getAvatar());
    if(this.getAvatar().tryWalk(dx,dy))
    {
      this.moveCameraToAvatar();
    }

    else if(!this.getAvatar()){
      this.game.switchModes('lose');
    }

    this.game.render();
    return true;
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
    display.drawText(4,4,"Well done, you've managed to survive....");
    display.drawText(4,7,"For now at least........");

    display.drawText(4,9,"Additional levels and other features will be added in the future");
    display.drawText(4,10,"Thanks for playing! Refresh to play again!");

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
    display.drawText(4,4,"You have died....");
    display.drawText(4,7,"The Human Race is in peril........");

    display.drawText(4,10,"Additional levels and other features will be added in the near future.");
    display.drawText(4,11,"Thanks for playing! Refresh to play again!");
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
    this.display.drawText(4,2,"It's the year 2050. Nuclear annihilation has claimed most of the");
    this.display.drawText(4,3,"human population on Earth. 97% of the surface has been irradiated");
    this.display.drawText(4,4,"and rendered uninhabitable. Remnants of civilization barely persist.");
    this.display.drawText(4,5,"A new world has emerged in the Underground, known as the Bunker.");
    this.display.drawText(4,6,"The remaining members of the human race are contained within.");
    this.display.drawText(4,7,"However, radiation from the surface has started to seep through.");
    this.display.drawText(4,8,"Mutants have infiltrated the Bunker, but you must survive!");

    this.display.drawText(8,13,"N for New Game");
    if(this.game.isPlaying){
      this.display.drawText(8,14,"S to Save Game");
      this.display.drawText(8,16,"Escape to return to game")
    }

    if(this.game.hasSaved){
      this.display.drawText(8,15,"L to Load Game");
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

  initTiming();
  initDataStore();
  DATASTORE.ID_SEQ = state.ID_SEQ;
  DATASTORE.GAME = this.game;
  console.log("Datastore near start of handleRestore");
  console.dir(DATASTORE);
  this.game.fromJSON(state.GAME);
  for (let entId in state.ENTITIES){
      console.log("pre-restore entities");
      let entityRestorationData = JSON.parse(state.ENTITIES[entId]);
      EntityFactory.create(entityRestorationData.name,entityRestorationData);
      // DATASTORE.ENTITIES[entId] = ent;
      console.dir(DATASTORE.ENTITIES[entId]);
      //delete DATASTORE.ENTITIES[entId];
      console.log("post-restore entities");
  }

  for (let mapId in state.MAPS){
    console.log("pre-restore map");
    let mapData = JSON.parse(state.MAPS[mapId]);
    DATASTORE.MAPS[mapId]= MapMaker(mapData);
    DATASTORE.MAPS[mapId].build();
    // console.log(JSON.stringify(DATASTORE.MAPS[mapId].tileGrid));
    console.log("post-restore map");
  }
  //this.game.fromJSON(state.GAME);
  console.log('post-save data store: ');
  console.dir(DATASTORE);
  this.game.switchModes('play');
  // this.game.renderAvatar();
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
