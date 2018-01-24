//defines mixins that can be added to ENTITIES
import {Message} from './message.js';
import {SCHEDULER,TIME_ENGINE,initTiming} from'./timing.js';
import {DATASTORE} from './datastore.js';
import ROT from 'rot-js';
import {Map} from './map.js';
import {randomInt} from './util.js';
import {Entity} from './entity.js';
import {MixableSymbol} from './mixable_symbol.js';
import {PlayMode} from './ui_mode.js';
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
    initEntityNum: 0
    }
  },

  METHODS: {
    getEntities(){
        let numEntities = Object.keys(DATASTORE.ENTITIES).length - 1;
        return numEntities;
      }

  },

  LISTENERS: {
    'kills': function(evtData){
      //if(evtData.target){
          let kills = this.getKills();
          let totalEntities = this.getEntities();
          let entitiesRemaining = totalEntities - kills;
          if(entitiesRemaining == 0){
            this.raiseMixinEvent('cleared',{status:"clear"});
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
      if(targetPositionInfo.entity){
        // console.log(targetPositionInfo.entity);
        this.raiseMixinEvent('bumpEntity',{target:targetPositionInfo.entity});
        targetPositionInfo.entity.raiseMixinEvent('bumpedBy',{bumper:this});
      //   if(target == "^"){
      //   //      console.log("Hitting herb");
      //   //      console.log(this.getName());
      //   this.raiseMixinEvent('heals',{target:this,healAmount:5});
      //   this.raiseMixinEvent('damaged',{src:targetPositionInfo.entity,damageAmount:9});
      //
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

export let HealingMixin = {
  META: {
    mixInName: 'HealingMixin',
    mixInGroupName:'HealingMixin',
    stateNamespace:'_Healing',
    stateModel: {
      healingPower: 0
    },
    initialize: function(template){
      this.state._Healing.healingPower = template.healingPower || 1;
    }
  },

  METHODS: {
    getHealingPower: function(){
      return this.state._Healing.healingPower;
    },
    setHealingPower: function(newValue){
      this.state._Healing.healingPower = newValue;
    },
    loseHealingPower: function(amount){
      this.state._Healing.healingPower -= amount;
    },

    gainHealingPower: function(amount){
      this.state._Healing.healingPower += amount;
    }
  },

  LISTENERS: {
    'bumpedBy': function(evtData){
         evtData.bumper.raiseMixinEvent('heals',{healAmount:this.getHealingPower()});
    //       //if(evtData.actor == "")
    // }
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
             console.log(this.getName() + " gaining " + amt + "HP");
             this.state._HitPoints.curHp += amt;
             this.state._HitPoints.curHp = Math.min(this.state._HitPoints.maxHp,this.state._HitPoints.curHp);
             console.dir(this);
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
              if (evtData.damageAmount < 0){
                this.loseHp(0);
              }
              if (evtData.damageAmount >= 0){
                this.loseHp(evtData.damageAmount);
              }

              console.log(evtData.src);
              evtData.src.raiseMixinEvent('damages',{target:this,damageAmount: evtData.damageAmount});
              //console.log(this);
              if(this.getHp() <= 0){
                evtData.src.raiseMixinEvent('kills',{target:this});
                console.log("destroying");
                console.log(this);
                this.raiseMixinEvent('killedBy',{src:evtData.src});
                this.destroy();
                //SCHEDULER.remove(this);
              }
            },
            //{src:entity,damageAmount:entity.getMeleeDamage()}
          'damages':function(evtData){
            console.log("damages event: ");
            console.log(this);
            if(this.name == evtData.target.name){
              evtData.damageAmount == 0;
            }
          },
        'heals': function(evtData){
          // console.log(this.getName() + "being healed");
          // console.dir(evtData);
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
        Message.send("Keep walking, it's " + evtData.status + ". Press p to pause your game.");
      },
      'attacks': function(evtData){
        console.log("attacking");
        Message.send("You've attacked" +evtData.target.getName());
        //Message.send("Entity detected, Type: " + " " + evtData.target.getName().toUpperCase() + ", " + " " + "HP: " + evtData.target.getHp() + "/" + evtData.target.getMaxHp());

      },

      'heals': function(evtData){
        Message.send("You've healed "+ evtData.healAmount + "HP");
      },

      'damages': function(evtData){
        console.log("evtData:");
        console.dir(evtData);
        Message.send(this.getName()+ " deals " + evtData.damageAmount + " damage to " + evtData.target.getName());
        //Message.send("Entity detected, Type: " + " " + evtData.target.getName().toUpperCase() + ", " + " " + "HP: " + evtData.target.getHp() + "/" + evtData.target.getMaxHp());
      },

      'damaged':function(evtData){
        Message.send(evtData.src.getName()+ " deals " + evtData.damageAmount + " damage to " + this.getName());
        //Message.send("Entity detected, Type: " + " " + evtData.src.getName().toUpperCase() + ", " + " " + "HP: " + evtData.src.getHp() + "/" + evtData.src.getMaxHp());
      },

      'kills': function(evtData){
        Message.send(this.getName().toUpperCase() + " kills the " + evtData.target.getName().toUpperCase());
        Message.send("What a beast! Your attack has definitely increased!");
      },

      'killedBy':function(evtData){
        Message.send(this.getName().toUpperCase()+ " killed by " + evtData.src.getName().toUpperCase());
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
      meleeDefense: 0,
      kills: 0
    },

    initialize: function (template){
      this.state._MeleeAttacker.meleeDamage = template.meleeDamage || this.state._MeleeAttacker.meleeDamage;
      this.state._MeleeAttacker.meleeDefense = template.meleeDefense || this.state._MeleeAttacker.meleeDefense;
    },
  },
  METHODS: {

    getMeleeDamage: function (){return this.state._MeleeAttacker.meleeDamage},
    setMeleeDamage: function (newVal){ this.state._MeleeAttacker.meleeDamage = newVal;},
    getMeleeDefense: function (){return this.state._MeleeAttacker.meleeDefense},
    setMeleeDefense: function (newVal){ this.state._MeleeAttacker.meleeDefense = newVal;},
    getKills: function(){return this.state._MeleeAttacker.kills}
  },
  LISTENERS:{
    'bumpEntity': function(evtData){
      console.log("bumping entity for attack");
      console.log(this.getHp());
      this.raiseMixinEvent('attacks', {src:this,target:evtData.target});
      let totalDamage = this.getMeleeDamage() - (evtData.target.getMeleeDefense() * 0.5);
      evtData.target.raiseMixinEvent('damaged',{src:this,damageAmount:totalDamage});
      if (totalDamage < 0){
        evtData.target.raiseMixinEvent('damaged',{src:this,damageAmount:0});
      }
      //this.raiseMixinEvent('attacks', {actor:this,target:evtData.target});
      //evtData.target.raiseMixinEvent('damaged',{src:this,damageAmount:this.getMeleeDamage()});
    },

    'bumpedBy': function(evtData){

          this.raiseMixinEvent('attacks', {target:evtData.bumper});
          let totalDamage = this.getMeleeDamage() - (evtData.bumper.getMeleeDefense() * 0.75);
          evtData.bumper.raiseMixinEvent('damaged',{src:this,damageAmount:totalDamage});
          if (totalDamage < 0){
            evtData.bumper.raiseMixinEvent('damaged',{src:this,damageAmount:0});
          }
    },
    'kills': function(evtData){
      this.state._MeleeAttacker.kills++;

      let initKillDamageCounter = 5;
      if(this.state._MeleeAttacker.kills >= initKillDamageCounter){
        initKillDamageCounter *= 3;
        initKillDamageCounter -= 1;
        this.setMeleeDamage(this.state._MeleeAttacker.kills/2 + 1);
        this.setMeleeDefense(this.state._MeleeAttacker.kills/3.5 + 1);
      }
      console.log("Entities: ")
      console.log(Object.keys(DATASTORE.ENTITIES));
      // if(Object.keys(DATASTORE.ENTITIES).length == 1){
      //   this.game.switchModes('win');
      // }
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
      if(!(dx == 0 && dy == 0)){
        this.raiseMixinEvent('walkAttempt',{'dx':dx, 'dy':dy});
      }
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
