// Mixin Registry - combines core and advanced mixins
// This provides a single import point for all mixins

import * as CoreMixins from "./CoreMixins.js";
import * as AdvancedMixins from "./AdvancedMixins.js";

// Combine all mixins into a single export
export const MixinRegistry = {
  ...CoreMixins,
  ...AdvancedMixins,
};

// Also export individual mixins for direct access
export const {
  TimeTracker,
  HitPoints,
  MeleeAttacker,
  PlayerMessages,
} = CoreMixins;

export const {
  WalkerCorporeal,
  ActorPlayer,
  ActorWanderer,
  SmartMonsterAI,
  BalancedMonsterAI,
  SimpleMonsterAI,
  StationaryEntity,
} = AdvancedMixins; 