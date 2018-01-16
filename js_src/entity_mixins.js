//defines mixins that can be added to ENTITIES

export let TimeTracker = {
    META:{

      mixInName:'TimeTracker',
      mixInGroupName:'Tracker',
      stateNamespace: '_TimeTracker',
      stateModel: {

        timeTaken: 0

      },

      initialize: function(){


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

export let WalkerCorporeal = {
  META: {
    mixInName: 'WalkerCorporeal',
    mixInGroupName: 'Walker'
    },

  METHODS: {
    tryWalk: function(dx,dy){
      let newX = this.state.x*1 + dx*1;
      let newY = this.state.y*1 + dy*1;

      if(this.getMap().isPositionOpen(newX,newY)){

        this.state.x = newX;
        this.state.y = newY;
        this.getMap().updateEntityPosition(this, this.state.x,this.state.y);

        this.raiseMixinEvent('turnTaken',{timeUsed: 1});
        return true;

      }
      this.raiseMixinEvent('walkBlocked',{reason: "there's something in the way"});
      return false;

    }
  }

}

export let PlayerMessages = {
    META:{

      mixInName:'PlayerMessage',
      mixInGroupName:'Messager'

      },

    LISTENERS: {
      'walkBlocked': function(evtData){
        Message.send("can't walk there because " +evtData.reason);
      }
    }
}
// //export let HitPoints = {
//       META:{
//
//         mixInName:'HitPoints',
//         mixInGroupName:'HitPoints',
//         stateNamespace: '_HitPoints',
//         stateModel: {
//
//         curHp: 1,
//         maxHp: 1
//
//
//       },
//        initialize: function(template){
//          this.state.HitPoints.maxHp = template.maxHp;
//          this.state.HitPoints.curHp = template.curHp || template.maxHp;
//        }
//      },
//
//
//         METHODS:{
//
//           loseHp: function(amt){
//             this.state.HitPoints.curHp -= amt;
//             this.state.HitPoints.curHp = Math.max(0,this.state.HitPoints.curHp);
//           },
//
//           gainHp: function(amt){
//             this.state.HitPoints.curHp += amt;
//             this.state.HitPoints.curHp = Math.min(this.state.HitPoints.maxHp,this.state.HitPoints.curHp);
//           },
//
//           getHp: function(){
//             return this.state.HitPoints.curHp;
//           },
//
//           setHp: function(amt){
//             this.state.HitPoints.curHp = amt;
//             this.state.HitPoints.curHp = Math.min(this.state.HitPoints.maxHp, this.state.HitPoints.curHp);
//           },
//
//           getMaxHp: function(amt){
//             return this.state.HitPoints.maxHp;
//           },
//
//           setMaxHp: function(amt){
//             this.state.HitPoints.maxHp = amt;
//             this.state.HitPoints.curHp = Math.min(this.state.HitPoints.maxHp, this.state.HitPoints.curHp);
//
//           }
//       }
//
//
//     }
