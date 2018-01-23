
import {Factory} from './factory.js';
import {Entity} from './entity.js';

export let EntityFactory = new Factory(Entity,'ENTITIES');


  EntityFactory.learn({
    'name': 'avatar',
    'chr': '@',
    'fg': '#eb4',
    'maxHp': 20,
    'curHp': 10,
    'mixInNames':['ActorPlayer','PlayerMessages','TimeTracker','EntityTracker','WalkerCorporeal','HitPoints','MeleeAttacker']
  });

  EntityFactory.learn({
    'name': 'moss',
    'chr': '*',
    'fg': '#3d5',
    'maxHp': 5,
    'mixInNames':['MeleeAttacker','HitPoints']

  });

  EntityFactory.learn({
    'name': 'monster',
    'chr': '&',
    'fg': '#d63',
    'maxHp': 5,
    'mixInNames':['ActorWanderer','WalkerCorporeal','HitPoints','MeleeAttacker','PlayerMessages','EntityTracker']

  });

  EntityFactory.learn({
    'name': 'herb',
    'chr': '^',
    'fg': '#f00',
    'maxHp': 3,
    'mixInNames': ['HitPoints','PlayerMessages','EntityTracker','HealingMixin']

  });
