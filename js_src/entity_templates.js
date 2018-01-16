
import {Factory} from './factory.js';
import {Entity} from './entity.js';

export let EntityFactory = new Factory(Entity,'ENTITIES');


  EntityFactory.learn({
    'name': 'avatar',
    'chr': '@',
    'fg': '#eb4',
    'maxHp': 10,
    'mixInNames':['PlayerMessages','TimeTracker','WalkerCorporeal']//,'HitPoints']

  });
