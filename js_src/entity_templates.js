import { Factory } from "./factory.js";
import { Entity } from "./entity.js";

export const EntityFactory = new Factory(Entity, "ENTITIES");

EntityFactory.learn({
  name: "avatar",
  chr: "@",
  fg: "#eb4",
  maxHp: 10,
  meleeDamage: 3,
  mixInNames: [
    "ActorPlayer",
    "PlayerMessages",
    "TimeTracker",
    "WalkerCorporeal",
    "HitPoints",
    "MeleeAttacker",
  ],
});

EntityFactory.learn({
  name: "moss",
  chr: "*",
  fg: "#3d5",
  maxHp: 5,
  meleeDamage: 1,
  mixInNames: ["MeleeAttacker", "HitPoints"],
});

EntityFactory.learn({
  name: "monster",
  chr: "&",
  fg: "#d63",
  maxHp: 50,
  meleeDamage: 5,
  mixInNames: ["ActorWanderer", "WalkerCorporeal", "HitPoints", "SmartMonsterAI", "MeleeAttacker", "PlayerMessages"],
});

EntityFactory.learn({
  name: "balanced_monster",
  chr: "M",
  fg: "#d63",
  maxHp: 30,
  meleeDamage: 3,
  mixInNames: ["ActorWanderer", "WalkerCorporeal", "HitPoints", "BalancedMonsterAI", "MeleeAttacker", "PlayerMessages"],
});
