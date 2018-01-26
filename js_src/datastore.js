//Database for all objects in the game that are used

export let DATASTORE ={};
//clearDataStore();
export function initDataStore(){
    DATASTORE = {
    GAME: {},
    ID_SEQ: 0,
    MAPS: {},
    ENTITIES: {},
    //LEVEL: {}
  }
}
