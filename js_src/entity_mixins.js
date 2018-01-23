//defines mixins that can be added to ENTITIES
import {Message} from './message.js';
import {SCHEDULER,TIME_ENGINE,initTiming} from'./timing.js';
import {DATASTORE} from './datastore.js';
import ROT from 'rot-js';
import {Map} from './map.js';
import {randomInt} from './util.js';
import {Entity} from './entity.js';
import {MixableSymbol} from './mixable_symbol.js';
//********************************************************//
export let TimeTracker = {
    META:{

      mixInName:'TimeTracker',
      mixInGroupName:'Tracker',
      stateNamespace: '_TimeTracker',
      stateModel: {

        timeTaken: 0

        }
      },
    METHODS:{

      getTime: function(){
        //can access/ manipulate this.state.exampleMix
        return this.state._TimeTracker.timeTaken;
      },

      setTime: function (t){

        this.state._TimeTracker.timeTaken = t;

      },

      addTime: function (t){

        this.state._TimeTracker.timeTaken += t;

      }



    },

    LISTENERS: {
      'turnTaken': function(evtData){
        this.addTime(evtData.timeUsed);
      }
    }
};
//********************************************************//

export let EntityTracker = {
  META: {
    mixInName: 'EntityTracker',
    mixInGroupName: 'EntityTracker',
    stateNamespace: '_EntityTracker',
    stateModel: {
    initEntityNum: -1
    }
  },

  METHODS: {
    getEntities(){
        console.log('starting entity num:')
        console.log(this.state._EntityTracker.initEntityNum);
        console.log('length of datastore.entities array:')
        let numEntities = Object.keys(DATASTORE.ENTITIES).length - 1;
        // console.log("Number of entities: ");
        // console.log(numEntities);
        // let totalEntities = this.state._EntityTracker.initEntityNum + numEntities;
        // console.log("total:");
        // console.log(totalEntities);
        return numEntities;
  },
   //
   //  setEntities(entityNum){
   //      this.state._EntityTracker.initEntityNum = entityNum;
   // }

  },

  LISTENERS: {
    'kills': function(evtData){
      //if(evtData.target){
          let kills = this.getKills();
          let totalEntities = this.getEntities();
          let entitiesRemaining = totalEntities - kills;
          if(entitiesRemaining == 0){
            this.raiseMixinEvent('cleared',{status:"clear"})
          }
          return entitiesRemaining;
    }
  }

}
//********************************************************//

export let WalkerCorporeal = {
  META: {
    mixInName: 'WalkerCorporeal',
    mixInGroupName: 'Walker'
    },

  METHODS: {
    tryWalk: function(dx,dy){
      let newX = this.state.x*1 + dx*1;
      let newY = this.state.y*1 + dy*1;
      let targetPositionInfo = this.getMap().getTargetPositionInfo(newX,newY);
      let target = this.getMap().getTargetPositionInfo(newX,newY).entity._chr;
      console.log("This is targetPositionInfo.entity:")
      console.log(targetPositionInfo.entity);
      console.log(target);
      if(targetPositionInfo.entity){
        // console.log(targetPositionInfo.entity);
        this.raiseMixinEvent('bumpEntity',{actor:this,target:targetPositionInfo.entity})

        // if(target == "^"){
        //      console.log("Hitting herb");
        //      console.log(this.getName());
        //      this.raiseMixinEvent('damaged',{:this,damageAmount:1});
        //      //this.raiseMixinEvent('heals',{target:targetPositionInfo.entity,healAmount:5});
        // }
        return false;
      }

      else if (targetPositionInfo.tile.isImpassable()){
          this.raiseMixinEvent('walkBlocked',{reason: "there's a wall in the way"});
        }

      else{
        this.state.x = newX;
        this.state.y = newY;
        this.getMap().updateEntityPosition(this, this.state.x,this.state.y);

        this.raiseMixinEvent('walkClear',{status:"clear"});
        this.raiseMixinEvent('turnTaken',{timeUsed: 1});
        this.raiseMixinEvent('actionDone');
        return true;

        }

        return false;

      }
    },

  LISTENERS: {
    'walkAttempt': function(evtData){
      this.tryWalk(evtData.dx,evtData.dy);
    }
  }
};

//********************************************************//


export let HitPoints = {
       META:{

        mixInName:'HitPoints',
        mixInGroupName:'HitPoints',
        stateNamespace: '_HitPoints',
        stateModel: {
          curHp: 0,
          maxHp: 0
        },
        initialize: function(template){
          this.state._HitPoints.maxHp = template.maxHp || 1;
          this.state._HitPoints.curHp = template.curHp || this.state._HitPoints.maxHp;
        }
      },

      METHODS:{
           loseHp: function(amt){
             this.state._HitPoints.curHp -= amt;
             this.state._HitPoints.curHp = Math.max(0,this.state._HitPoints.curHp);
           },

           gainHp: function(amt){
             this.state._HitPoints.curHp += amt;
             this.state._HitPoints.curHp = Math.min(this.state._HitPoints.maxHp,this.state._HitPoints.curHp);
           },

           getHp: function(){
             return this.state._HitPoints.curHp;
           },

           setHp: function(amt){
             this.state._HitPoints.curHp = amt;
             this.state._HitPoints.curHp = Math.min(this.state._HitPoints.maxHp, this.state._HitPoints.curHp);
           },

           getMaxHp: function(amt){
             return this.state._HitPoints.maxHp;
           },

           setMaxHp: function(amt){
             this.state._HitPoints.maxHp = amt;
             this.state._HitPoints.curHp = Math.min(this.state._HitPoints.maxHp, this.state._HitPoints.curHp);

           }
       },
       LISTENERS: {
         'damaged': function(evtData){
              this.loseHp(evtData.damageAmount);
              console.log(evtData.src);
              evtData.src.raiseMixinEvent('damages',{target:this,damageAmount: evtData.damageAmount});
              console.log(this);
              if(this.getHp() <= 0){
                this.raiseMixinEvent('killedBy',{src:evtData.src});
                evtData.src.raiseMixinEvent('kills',{target:this});
                console.log("destroying");
                console.log(this);
                this.destroy();
                //SCHEDULER.remove(this);
              }

          },
        'heals': function(evtData){
          let currentHp = this.getHp();
          console.log(currentHp);
          if(currentHp >= this.getMaxHp()){
            this.gainHp(0);
          }
           this.gainHp(evtData.healAmount);
        }
    }
};

//********************************************************//

export let PlayerMessages = {
    META:{

      mixInName:'PlayerMessages',
      mixInGroupName:'Messager'

      },

    LISTENERS: {
      'walkBlocked': function(evtData){
        Message.send("Can't walk there because " +evtData.reason+ ", path is obstructed.");
      },

      'bumpEntity': function(evtData){

        Message.send("Entity detected, Type: " + " " + evtData.target.getName().toUpperCase() + ", " + " " + "HP: " + evtData.target.getHp() + "/" + evtData.target.getMaxHp());


        //if(evtData.target.getMaxHp() <= 5){
        //  setTimeout(Message.send("Very Low Threat Level Detected, this shouldn't be challenging at all!"),100000);
        //}
      },
      'cleared': function(evtData){
        Message.send("What a beast! Your attack has definitely increased!");
      },
      'walkClear': function(evtData){
        Message.send("Keep walking, it's"+ " " + evtData.status + ". " + "Press p to pause your game.");
      },
      'attacks': function(evtData){
        console.log("attacking");
        //Message.send("You've attacked" +evtData.target.getName());
        Message.send("Entity detected, Type: " + " " + evtData.target.getName().toUpperCase() + ", " + " " + "HP: " + evtData.target.getHp() + "/" + evtData.target.getMaxHp());

      },

      'damages': function(evtData){
        Message.send(this.getName()+ " deals " + evtData.damageAmount + " damage to " + evtData.target.getName());
        Message.send("Entity detected, Type: " + " " + evtData.target.getName().toUpperCase() + ", " + " " + "HP: " + evtData.target.getHp() + "/" + evtData.target.getMaxHp());
      },

      'kills': function(evtData){
        Message.send(this.getName().toUpperCase() + " " + "kills the" + " " + evtData.target.getName().toUpperCase());
        Message.send("What a beast! Your attack has definitely increased!");
      },

      'killedBy':function(evtData){
        Message.send(this.getName().toUpperCase+ "killed by" + evtData.target.getName());
      }

    }
};

//********************************************************//


export let MeleeAttacker = {
  META: {
    mixInName: 'MeleeAttacker',
    mixInGroupName: 'MeleeAttacker',
    stateNamespace: '_MeleeAttacker',
    stateModel: {
      meleeDamage: 0,
      kills: 0
    },

    initialize: function (template){
      this.state._MeleeAttacker.meleeDamage = template.meleeDamage || 1;
    },
  },
  METHODS: {

    getMeleeDamage: function (){return this.state._MeleeAttacker.meleeDamage},
    setMeleeDamage: function (newVal){ this.state._MeleeAttacker.meleeDamage = newVal;},
    getKills: function(){return this.state._MeleeAttacker.kills}
  },
  LISTENERS:{
    'bumpEntity': function(evtData){
      console.log("bumping entity for attack");
      console.log(this.getHp());
      this.raiseMixinEvent('attacks', {src:this,target:evtData.target});
      evtData.target.raiseMixinEvent('damaged',{src:this,damageAmount:this.getMeleeDamage()});
      //this.raiseMixinEvent('attacks', {actor:this,target:evtData.target});
      //evtData.target.raiseMixinEvent('damaged',{src:this,damageAmount:this.getMeleeDamage()});
    },
    'kills': function(evtData){
      this.state._MeleeAttacker.kills++;

      let initKillDamageCounter = 5;
      if(this.state._MeleeAttacker.kills >= initKillDamageCounter){
        initKillDamageCounter *= 3;
        initKillDamageCounter -= 1;
        this.setMeleeDamage(this.state._MeleeAttacker.kills/2 + 1);
      }
      console.log("Entities: ")
      console.log(Object.keys(DATASTORE.ENTITIES));
      if(Object.keys(DATASTORE.ENTITIES).length == 1){
        console.log("you win!");//this.game.switchModes('win');
      }
    }
  }
};

//********************************************************//

export let ActorPlayer = {
  META: {
    mixInName:'ActorPlayer',
    mixInGroupName: 'ActorPlayer',
    stateNamespace: '_ActorPlayer',
    stateModel: {
      baseActionDuration: 1000,
      actingState: false,
      currentActionDuration: 1000
    },

    initialize: function(){
      SCHEDULER.add(this,true,1)
    }
  },

  METHODS: {
  getBaseActionDuration: function () {
    return this.state._ActorPlayer.baseActionDuration;
  },
  setBaseActionDuration: function (newValue) {
    this.state._ActorPlayer.baseActionDuration = newValue;
  },
  getCurrentActionDuration: function () {
    return this.state._ActorPlayer.currentActionDuration;
  },
  setCurrentActionDuration: function (newValue) {
    this.state._ActorPlayer.currentActionDuration = newValue;
  },
  isActing: function(state) {
    if (state !== undefined) {
      this.state._ActorPlayer.actingState = state;
    }
    return this.state._ActorPlayer.actingState;
  },


    act: function(){
      if (this.isActing()) {
        return;
      }
      this.isActing(true);
      TIME_ENGINE.lock();
      DATASTORE.GAME.render();
      this.isActing(false);
      // console.log("Player is Acting");
    }
  },

  LISTENERS: {
    'actionDone': function(evtData){
      SCHEDULER.setDuration(this.getCurrentActionDuration());
      this.setCurrentActionDuration(this.getBaseActionDuration()+randomInt(-5,5));
      setTimeout(function(){ TIME_ENGINE.unlock();},1);
      // console.log("Player still working");
    }
  }
}

//********************************************************//

export let ActorWanderer = {
  META: {
    mixInName:'ActorWanderer',
    mixInGroupName: 'ActorWanderer',
    stateNamespace: '_ActorWanderer',
    stateModel: {
      baseActionDuration: 1000,
      actingState: false,
      currentActionDuration: 1000
    },

    initialize: function(template){
      SCHEDULER.add(this,true,randomInt(2,this.getBaseActionDuration()));
      this.state._ActorWanderer.baseActionDuration = template.wanderActionDuration || 1000;
      this.state._ActorWanderer.currentActionDuration = this.state._ActorWanderer.baseActionDuration;
    }
  },

  METHODS: {
    getBaseActionDuration: function () {
      return this.state._ActorWanderer.baseActionDuration;
    },
    setBaseActionDuration: function (newValue) {
      this.state._ActorWanderer.baseActionDuration = newValue;
    },
    getCurrentActionDuration: function () {
      return this.state._ActorWanderer.currentActionDuration;
    },
    setCurrentActionDuration: function (newValue) {
      this.state._ActorWanderer.currentActionDuration = newValue;
    },
    act: function(){
      TIME_ENGINE.lock();
      let dx = randomInt(-1,1);
      let dy = randomInt(-1,1);
      this.raiseMixinEvent('walkAttempt',{'dx':dx, 'dy':dy});
      SCHEDULER.setDuration(1000);
      TIME_ENGINE.unlock();
    }
  },

  LISTENERS: {
    'actionDone': function(evtData){
      SCHEDULER.setDuration(this.getCurrentActionDuration());
      this.setCurrentActionDuration(this.getBaseActionDuration()+randomInt(-5,5));
      setTimeout(function(){ TIME_ENGINE.unlock();},1);
      // console.log("Player still working");
    }
  }
}
