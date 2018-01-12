//Database for all objects in the game that are used

export let DATASTORE ={
  GAME: '',
  ID_SEQ: 1,
  MAPS: {},
  ENTITIES: {}
}

export function clearDataStore(){
    DATASTORE = {
    GAME: '',
    ID_SEQ: 1,
    MAPS: {},
    ENTITIES: {}
  }
}
