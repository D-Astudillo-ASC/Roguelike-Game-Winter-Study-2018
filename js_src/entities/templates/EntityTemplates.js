// Entity templates for the game
import { Factory } from "../EntityFactory.js";
import { Entity } from "../Entity.js";
import { Colors } from "../../utils/Colors.js";
import { MIXIN_NAMES } from "../../utils/Constants.js";

// Create the entity factory
export const EntityFactory = new Factory(Entity, "ENTITIES");

// Avatar template (player character)
EntityFactory.learn({
  name: "avatar",
  chr: "@",
  fg: Colors.PLAYER,
  maxHp: 10,
  meleeDamage: 3,
  mixInNames: [
    MIXIN_NAMES.ACTOR_PLAYER,
    MIXIN_NAMES.PLAYER_MESSAGES,
    MIXIN_NAMES.TIME_TRACKER,
    MIXIN_NAMES.WALKER_CORPOREAL,
    MIXIN_NAMES.HIT_POINTS,
    MIXIN_NAMES.MELEE_ATTACKER,
  ],
});

// Moss template (simple enemy)
EntityFactory.learn({
  name: "moss",
  chr: "*",
  fg: Colors.MOSS,
  maxHp: 5,
  meleeDamage: 1,
  mixInNames: [
    MIXIN_NAMES.STATIONARY_ENTITY,
    MIXIN_NAMES.MELEE_ATTACKER, 
    MIXIN_NAMES.HIT_POINTS
  ],
});

// Monster template (strong enemy)
EntityFactory.learn({
  name: "monster",
  role: "monster",
  chr: "&",
  fg: Colors.MONSTER,
  maxHp: 50,
  meleeDamage: 5,
  mixInNames: [
    MIXIN_NAMES.ACTOR_WANDERER,
    MIXIN_NAMES.WALKER_CORPOREAL,
    MIXIN_NAMES.HIT_POINTS,
    MIXIN_NAMES.SMART_MONSTER_AI,
    MIXIN_NAMES.MELEE_ATTACKER,
    MIXIN_NAMES.PLAYER_MESSAGES,
  ],
});

// Balanced monster template (medium enemy)
EntityFactory.learn({
  name: "balanced_monster",
  role: "monster",
  chr: "M",
  fg: Colors.BALANCED_MONSTER,
  maxHp: 30,
  meleeDamage: 3,
  mixInNames: [
    MIXIN_NAMES.ACTOR_WANDERER,
    MIXIN_NAMES.WALKER_CORPOREAL,
    MIXIN_NAMES.HIT_POINTS,
    MIXIN_NAMES.BALANCED_MONSTER_AI,
    MIXIN_NAMES.MELEE_ATTACKER,
    MIXIN_NAMES.PLAYER_MESSAGES,
  ],
});

// Simple monster template (weak enemy)
EntityFactory.learn({
  name: "simple_monster",
  role: "monster",
  chr: "m",
  fg: Colors.SIMPLE_MONSTER,
  maxHp: 15,
  meleeDamage: 2,
  mixInNames: [
    MIXIN_NAMES.ACTOR_WANDERER,
    MIXIN_NAMES.WALKER_CORPOREAL,
    MIXIN_NAMES.HIT_POINTS,
    MIXIN_NAMES.SIMPLE_MONSTER_AI,
    MIXIN_NAMES.MELEE_ATTACKER,
    MIXIN_NAMES.PLAYER_MESSAGES,
  ],
}); 