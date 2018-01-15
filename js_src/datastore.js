//Database for all objects in the game that are used

export let DATASTORE ={
  GAME: {},
  ID_SEQ: 1,
  MAPS: {},
  ENTITIES: {}
}
clearDataStore();
export function clearDataStore(){
    DATASTORE = {
    GAME: {},
    ID_SEQ: 0,
    MAPS: {},
    ENTITIES: {}
  }
}
