// Game Constants and Configuration
export const GAME_CONFIG = {
  // Display settings
  DISPLAY_SPACING: 1.1,
  MAIN_DISPLAY_WIDTH: Math.floor(window.innerWidth / 8),
  MAIN_DISPLAY_HEIGHT: Math.floor(window.innerHeight / 16),
  MESSAGE_DISPLAY_HEIGHT: 6,

  // Game settings
  DEFAULT_ACTION_DURATION: 1000,
  RANDOM_SEED_MIN: 5,
  RANDOM_SEED_MAX: 100000,

  // Entity settings
  DEFAULT_MONSTER_COUNT: 10,
  DEFAULT_MOSS_COUNT: 10,

  // Map settings
  DEFAULT_MAP_TYPE: "basic caves",

  // Storage keys
  SAVE_GAME_KEY: "roguelikegame",
};

export const ENTITY_TYPES = {
  AVATAR: "avatar",
  MONSTER: "monster",
  MOSS: "moss",
  BALANCED_MONSTER: "balanced_monster",
};

export const MIXIN_NAMES = {
  TIME_TRACKER: "TimeTracker",
  WALKER_CORPOREAL: "WalkerCorporeal",
  HIT_POINTS: "HitPoints",
  MELEE_ATTACKER: "MeleeAttacker",
  ACTOR_PLAYER: "ActorPlayer",
  ACTOR_WANDERER: "ActorWanderer",
  PLAYER_MESSAGES: "PlayerMessages",
  SMART_MONSTER_AI: "SmartMonsterAI",
  BALANCED_MONSTER_AI: "BalancedMonsterAI",
  SIMPLE_MONSTER_AI: "SimpleMonsterAI",
  STATIONARY_ENTITY: "StationaryEntity",
};

export const UI_MODES = {
  STARTUP: "startup",
  PLAY: "play",
  PAUSE: "pause",
  WIN: "win",
  LOSE: "lose",
  PERSISTENCE: "persistence",
};

export const EVENTS = {
  TURN_TAKEN: "turnTaken",
  WALK_ATTEMPT: "walkAttempt",
  WALK_BLOCKED: "walkBlocked",
  WALK_CLEAR: "walkClear",
  BUMP_ENTITY: "bumpEntity",
  ATTACKS: "attacks",
  DAMAGED: "damaged",
  ACTION_DONE: "actionDone",
  PLAYER_MOVED: "playerMoved",
  ACT: "act",
};
