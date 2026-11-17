'use strict';
// Constants, tuning numbers and pure stat/cost formulas. No state, no DOM.
const W = 960, H = 640;
const WIN_TIME = 600; // seconds to survive

// ---- town layout ----
const CORE = { x: W / 2, y: H / 2, r: 40 };
const FORGE = { x: W / 2, y: H / 2 + 150, r: 30 };
const SPOT_POS = [[370, 225], [590, 225], [370, 415], [590, 415]];

// ---- start values ----
const START_GOLD = 60;
const CORE_MAX_HP = 400;
const PLAYER_START = { x: W / 2 - 90, y: H / 2 + 60 };
const FIRST_SPAWN_DELAY = 4;

// ---- player / bullets ----
const PLAYER_SPEED = 200;
const PLAYER_RADIUS = 11;
const BULLET_SPEED = 600;
const BULLET_LIFETIME = 1.2;
const COIN_MAGNET_RANGE = 80;
const COIN_MAGNET_SPEED = 320;

// ---- upgrades ----
const MAX_TOWER = 5, MAX_WEAPON = 6;
const TOWER_BUILD_COST = 50;
const REPAIR_COST = 25, REPAIR_AMOUNT = 40;
const CLICK_RADIUS_TOWER = 30;
const CLICK_RADIUS_PAD = 8; // added to the core/forge radius

const towerUpgradeCost = level => Math.round(45 * Math.pow(1.7, level - 1)); // cost to go level -> level+1
const forgeUpgradeCost = weaponLevel => Math.round(60 * Math.pow(1.7, weaponLevel));
const weaponDamage = weaponLevel => 10 + 5 * weaponLevel;
const weaponCooldown = weaponLevel => 0.34 * Math.pow(0.88, weaponLevel);
const towerRange = level => 165 + 18 * level;
const towerCooldown = level => 0.85 - 0.1 * (level - 1);
const towerDamage = level => 9 + 5 * (level - 1);

// ---- enemies ----
const ENEMY = {
  runner: { hp: 20, speed: 100, dps: 2, r: 9, gold: 3, coins: 1, color: '#e8c33a' },
  brute: { hp: 110, speed: 42, dps: 10, r: 17, gold: 10, coins: 3, color: '#a33b3b' },
};

// ---- difficulty (progress = 0..1 over the whole run) ----
const progressAt = t => Math.min(1, t / WIN_TIME);
const spawnInterval = progress => 2.4 - 2.0 * progress;
const bruteChance = progress => 0.1 + 0.35 * progress;
const enemyHpScale = t => 1 + t / 400;
const enemyDamageScale = progress => 1 + progress * 0.5;
const CLUSTER_START_TIME = 120;
const clusterChance = progress => 0.08 + 0.12 * progress;
const clusterSize = progress => 2 + Math.floor(progress * 3);
