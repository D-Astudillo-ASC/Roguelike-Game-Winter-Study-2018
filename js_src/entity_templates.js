import { Factory } from "./factory.js";
import { Entity } from "./entity.js";

export const EntityFactory = new Factory(Entity, "ENTITIES");

EntityFactory.learn({
  name: "avatar",
  chr: "@",
  fg: "#eb4",
  maxHp: 10,
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
  mixInNames: ["MeleeAttacker", "HitPoints"],
});

EntityFactory.learn({
  name: "monster",
  chr: "&",
  fg: "#d63",
  maxHp: 50,
  mixInNames: ["ActorWanderer", "WalkerCorporeal", "HitPoints"],
});
