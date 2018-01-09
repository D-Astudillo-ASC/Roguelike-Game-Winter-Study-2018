
import * as U from './util.js';
import ROT from 'rot-js';
import {StartupMode} from './ui_mode.js';
import {WinMode} from './ui_mode.js';
import {PlayMode} from './ui_mode.js';
import {LoseMode} from'./ui_mode.js';
import {Message} from './message.js';
import {PersistenceMode} from './ui_mode.js';
export let Game = {
  display: {
      SPACING: 1.1,
      main: {
        w: 80,
        h: 24,
        o: null
      },

      avatar: {
      w: 20,
      h: 24,
      o: null
      },

      message: {
      w: 100,
      h: 6,
      o: null
      }

},

   modes: {
    startup: '',
    persistence: '',
    play: '',
    win: '',
    lose: '',
  },

   curMode:'',


   //this. refers to game object
   init: function() {

     this.display.main.o = new ROT.Display({
       width: this.display.main.w,
       height: this.display.main.h,
       spacing: this.display.SPACING});

     this.display.avatar.o = new ROT.Display({
         width: this.display.avatar.w,
         height: this.display.avatar.h,
         spacing: this.display.SPACING});

     this.display.message.o = new ROT.Display({
        width: this.display.message.w,
        height: this.display.message.h,
        spacing: this.display.SPACING});


     this.setupModes();
     this.switchModes('startup');
     Message.send("Greetings!");
     console.dir(this);
   },

   bindEvent: function(eventType) {
    window.addEventListener(eventType, (evt) => {
      this.eventHandler(eventType, evt);
    });
   },


   setupModes: function() {
     this.modes.startup = new StartupMode(this);
     this.modes.play = new PlayMode(this);
     this.modes.win = new WinMode(this);
     this.modes.lose = new LoseMode(this);
     this.modes.persistence = new PersistenceMode(this);
  },

  setupNewGame: function(){
    this._randomSeed = 5 + Math.floor(Math.random()*100000);
    //this._randomSeed = 76250;
    console.log("using random seed "+this._randomSeed);
    ROT.RNG.setSeed(this._randomSeed);
  },

   bindEvent: function(eventType) {
    window.addEventListener(eventType, (evt) => {
      this.eventHandler(eventType, evt);
    });
   },

   eventHandler: function (eventType, evt) {
    // When an event is received have the current ui handle it
    if (this.curMode !== null && this.curMode != '') {
      if (this.curMode.handleInput(eventType, evt)) {
        this.render();
        //Message.ageMessages();

      }
    }
  },

  switchModes: function(newNodeName){
    if(this.curMode){
      this.curMode.exit();
     }
     Message.send("Switching modes....");
     this.curMode = this.modes[newNodeName];

     if(this.curMode){
       this.curMode.enter();
     }
   },

   toJSON: function (){
    let json = '';
    json = JSON.stringify({rseed: this._randomSeed});
    return json;
   },

   fromJSON: function (json){
      console.log(json);
      let state = JSON.parse(json);
      this._randomSeed = state.rseed;
      ROT.RNG.setSeed(this._randomSeed);
   },

   getDisplay: function (displayId) {
     if (this.display.hasOwnProperty(displayId)) {
       return this.display[displayId].o;
     }
     return null;
   },

   render: function() {
     this.renderAvatar();
     this.renderMain();
     this.renderMessage();
   },

   renderMain: function() {
    console.log("renderMain");
    this.curMode.render(this.display.main.o);
    //if(this.curMode.hasOwnProperty('render')){
        //this.curMode.render(this.display.main.o);
      //}


    },

    renderAvatar: function() {
      let d = this.display.avatar.o;
      d.drawText(5,5,"avatar");

     console.log("renderAvatar");
     //  this.curMode.render(this.display.main.o);
     //if(this.curMode.hasOwnProperty('render')){
         //this.curMode.render(this.display.main.o);
       //}


     },
     renderMessage: function() {
       let d = this.display.message.o;
       Message.render(d);

      console.log("renderMessage");
      // this.curMode.render(this.display.main.o);
      //if(this.curMode.hasOwnProperty('render')){
          //this.curMode.render(this.display.main.o);
        //}


      }

};
