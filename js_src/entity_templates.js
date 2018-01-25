
import {Factory} from './factory.js';
import {Entity} from './entity.js';

export let EntityFactory = new Factory(Entity,'ENTITIES');


  EntityFactory.learn({
    'name': 'avatar',
    'chr': '@',
    'fg': '#eb4',
    'maxHp': 20,
    'meleeDamage': 3,
    'meleeDefense': 5,
    'radResist': 1,
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
    'healingPower': 2,
    'meleeDamage': 7,
    'meleeDefense': 2,
    'radResist': 1,
    'mixInNames':['ActorWanderer','WalkerCorporeal','HitPoints','MeleeAttacker','PlayerMessages','EntityTracker']

  });

  EntityFactory.learn({
    'name': 'herb',
    'chr': '^',
    'fg': '#660',
    'maxHp': 10,
    'healingPower': 3,
    'meleeDamage': 0,
    'meleeDefense': 4.5,
    'radResist': 1,
    'mixInNames': ['HitPoints','PlayerMessages','EntityTracker','HealingMixin','MeleeAttacker']

  });

  EntityFactory.learn({
    'name': 'UV Radiation',
    'chr': 'U',
    'fg': '#5a0',
    'maxHp': 15,
    'meleeDamage': 8,
    'meleeDefense': 2,
    'mixInNames': ['HitPoints','PlayerMessages','EntityTracker','MeleeAttacker']

  });

  EntityFactory.learn({
    'name': 'X-Ray',
    'chr': 'X',
    'fg': '#ff0',
    'maxHp':20,
    'meleeDamage': 12,
    'meleeDefense': 4,
    'mixInNames': ['HitPoints','PlayerMessages','EntityTracker','MeleeAttacker','ActorWanderer','WalkerCorporeal']

  });

  EntityFactory.learn({
    'name': 'Gamma Radiation',
    'chr': 'G',
    'fg': '#f00',
    'maxHp': 25,
    'meleeDamage': 16,
    'meleeDefense': 8,
    'mixInNames': ['HitPoints','PlayerMessages','EntityTracker','HealingMixin','MeleeAttacker']

  });
  // EntityFactory.learn({
  //   'name': 'gate',
  //   'chr': '{}',
  //   'fg': '#000',
  //   'mixinNames'
  // });
