
import {Factory} from './factory.js';
import {Entity} from './entity.js';
export let EntityFactory = new Factory(Entity,'ENTITIES');
export let ENTITY_TEMPLATES = {};

  EntityFactory.learn({
    'name': 'avatar',
    'chr': '@',
    'fg': '#eb4'
  });