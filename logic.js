'use strict';
// Game rules. Every function takes the state explicitly: no globals, no DOM, so it can be
// run headlessly (see test/regression.test.js). Input is passed in as { keys, mouse }.

function createState() {
  return {
    t: 0, gold: START_GOLD, coreHp: CORE_MAX_HP, coreMax: CORE_MAX_HP, weapon: 0, over: null,
    player: { x: PLAYER_START.x, y: PLAYER_START.y, r: PLAYER_RADIUS, cd: 0 },
    towers: SPOT_POS.map(p => ({ x: p[0], y: p[1], lvl: 0, cd: 0 })),
    enemies: [], bullets: [], coins: [], texts: [], spawnT: FIRST_SPAWN_DELAY,
  };
}

// ---- helpers ----
function say(state, x, y, txt, color) { state.texts.push({ x, y, txt, color: color || '#fff', life: 1 }); }

function spend(state, cost, x, y) {
  if (state.gold < cost) { say(state, x, y - 30, 'Need ' + cost + ' gold', '#ff8080'); return false; }
  state.gold -= cost;
  return true;
}

const within = (px, py, o, radius) => Math.hypot(px - o.x, py - o.y) <= radius;

// ---- clicking town objects ----
// Returns true when the click landed on a town object (so the caller should not shoot).
function clickAt(state, x, y) {
  for (const t of state.towers) {
    if (!within(x, y, t, CLICK_RADIUS_TOWER)) continue;
    const building = t.lvl === 0;
    if (t.lvl >= MAX_TOWER) say(state, t.x, t.y - 30, 'MAX', '#ff0');
    else if (spend(state, building ? TOWER_BUILD_COST : towerUpgradeCost(t.lvl), t.x, t.y)) {
      t.lvl++;
      say(state, t.x, t.y - 30, building ? 'Tower built!' : 'Tower Lv ' + t.lvl, '#9f9');
    }
    return true;
  }
  if (within(x, y, CORE, CORE.r + CLICK_RADIUS_PAD)) {
    if (state.coreHp >= state.coreMax) say(state, CORE.x, CORE.y - 55, 'Town is healthy', '#fff');
    else if (spend(state, REPAIR_COST, CORE.x, CORE.y)) {
      state.coreHp = Math.min(state.coreMax, state.coreHp + REPAIR_AMOUNT);
      say(state, CORE.x, CORE.y - 55, '+' + REPAIR_AMOUNT + ' HP', '#9f9');
    }
    return true;
  }
  if (within(x, y, FORGE, FORGE.r + CLICK_RADIUS_PAD)) {
    if (state.weapon >= MAX_WEAPON) say(state, FORGE.x, FORGE.y - 45, 'MAX', '#ff0');
    else if (spend(state, forgeUpgradeCost(state.weapon), FORGE.x, FORGE.y)) {
      state.weapon++;
      say(state, FORGE.x, FORGE.y - 45, 'Weapon Lv ' + state.weapon, '#9f9');
    }
    return true;
  }
  return false;
}

// ---- spawning & combat primitives ----
function spawnEnemy(state) {
  const type = Math.random() < bruteChance(progressAt(state.t)) ? 'brute' : 'runner';
  const side = Math.floor(Math.random() * 4), margin = 30;
  let x, y;
  if (side === 0) { x = Math.random() * W; y = -margin; }
  else if (side === 1) { x = W + margin; y = Math.random() * H; }
  else if (side === 2) { x = Math.random() * W; y = H + margin; }
  else { x = -margin; y = Math.random() * H; }
  const hp = ENEMY[type].hp * enemyHpScale(state.t);
  state.enemies.push({ type, x, y, hp, max: hp, flash: 0 });
}

function fireBullet(state, x, y, angle, dmg, from) {
  state.bullets.push({ x, y, vx: Math.cos(angle) * BULLET_SPEED, vy: Math.sin(angle) * BULLET_SPEED, dmg, life: BULLET_LIFETIME, from });
}

function nearestEnemy(state, x, y, range) {
  let best = null, bestDist = range;
  for (const e of state.enemies) {
    const d = Math.hypot(e.x - x, e.y - y);
    if (d < bestDist) { bestDist = d; best = e; }
  }
  return best;
}

// ---- per-frame systems ----
function updatePlayer(state, dt, input) {
  const { keys, mouse } = input, pl = state.player;
  const dx = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0);
  const dy = (keys.s || keys.arrowdown ? 1 : 0) - (keys.w || keys.arrowup ? 1 : 0);
  if (dx || dy) { const len = Math.hypot(dx, dy); pl.x += dx / len * PLAYER_SPEED * dt; pl.y += dy / len * PLAYER_SPEED * dt; }
  pl.x = Math.max(pl.r, Math.min(W - pl.r, pl.x));
  pl.y = Math.max(pl.r, Math.min(H - pl.r, pl.y));
  pl.cd -= dt;
  if (mouse.down && pl.cd <= 0) {
    pl.cd = weaponCooldown(state.weapon);
    fireBullet(state, pl.x, pl.y, Math.atan2(mouse.y - pl.y, mouse.x - pl.x), weaponDamage(state.weapon), 'p');
  }
}

function updateSpawning(state, dt, progress) {
  state.spawnT -= dt;
  if (state.spawnT > 0) return;
  state.spawnT = spawnInterval(progress);
  spawnEnemy(state);
  if (state.t > CLUSTER_START_TIME && Math.random() < clusterChance(progress))
    for (let i = 0; i < clusterSize(progress); i++) spawnEnemy(state);
}

function updateEnemies(state, dt, progress) {
  for (const e of state.enemies) {
    const def = ENEMY[e.type];
    const ex = CORE.x - e.x, ey = CORE.y - e.y, dist = Math.hypot(ex, ey);
    e.flash = Math.max(0, e.flash - dt);
    if (dist > CORE.r + def.r - 2) { e.x += ex / dist * def.speed * dt; e.y += ey / dist * def.speed * dt; }
    else state.coreHp -= def.dps * dt * enemyDamageScale(progress);
  }
  if (state.coreHp <= 0) { state.coreHp = 0; state.over = 'lose'; }
}

function updateTowers(state, dt) {
  for (const t of state.towers) {
    if (!t.lvl) continue;
    t.cd -= dt;
    if (t.cd > 0) continue;
    const target = nearestEnemy(state, t.x, t.y, towerRange(t.lvl));
    if (target) {
      t.cd = towerCooldown(t.lvl);
      fireBullet(state, t.x, t.y, Math.atan2(target.y - t.y, target.x - t.x), towerDamage(t.lvl), 't');
    }
  }
}

function updateBullets(state, dt) {
  for (const b of state.bullets) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    for (const e of state.enemies) {
      if (e.hp > 0 && Math.hypot(e.x - b.x, e.y - b.y) < ENEMY[e.type].r + 3) {
        e.hp -= b.dmg; e.flash = 0.08; b.life = 0; break;
      }
    }
  }
  state.bullets = state.bullets.filter(b => b.life > 0 && b.x > -20 && b.x < W + 20 && b.y > -20 && b.y < H + 20);
}

function removeDeadEnemies(state) {
  for (const e of state.enemies) {
    if (e.hp > 0) continue;
    const def = ENEMY[e.type];
    for (let i = 0; i < def.coins; i++)
      state.coins.push({ x: e.x + (Math.random() - .5) * 14, y: e.y + (Math.random() - .5) * 14, v: Math.ceil(def.gold / def.coins) });
  }
  state.enemies = state.enemies.filter(e => e.hp > 0);
}

function updateCoins(state, dt) {
  const pl = state.player;
  for (const c of state.coins) {
    const d = Math.hypot(pl.x - c.x, pl.y - c.y);
    if (d < COIN_MAGNET_RANGE) { c.x += (pl.x - c.x) / d * COIN_MAGNET_SPEED * dt; c.y += (pl.y - c.y) / d * COIN_MAGNET_SPEED * dt; }
    if (d < pl.r + 6) { c.taken = true; state.gold += c.v; say(state, pl.x, pl.y - 18, '+' + c.v, '#ffd84a'); }
  }
  state.coins = state.coins.filter(c => !c.taken);
}

function updateTexts(state, dt) {
  for (const t of state.texts) { t.life -= dt * 1.2; t.y -= 25 * dt; }
  state.texts = state.texts.filter(t => t.life > 0);
}

function update(state, dt, input) {
  if (state.over) return;
  state.t += dt;
  const progress = progressAt(state.t);
  updatePlayer(state, dt, input);
  updateSpawning(state, dt, progress);
  updateEnemies(state, dt, progress);
  updateTowers(state, dt);
  updateBullets(state, dt);
  removeDeadEnemies(state);
  updateCoins(state, dt);
  updateTexts(state, dt);
  if (state.t >= WIN_TIME) state.over = 'win';
}
