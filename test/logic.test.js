'use strict';
// Unit tests for the pure rules in config.js + logic.js (no DOM, no canvas). Run: node test/logic.test.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const ctx = vm.createContext({});
for (const f of ['config.js', 'logic.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'), ctx, { filename: f });
const get = expr => vm.runInContext(expr, ctx);
const { createState, clickAt, update, spawnEnemy } = Object.fromEntries(['createState', 'clickAt', 'update', 'spawnEnemy'].map(n => [n, get(n)]));
const SPOT = get('SPOT_POS')[0], CORE = get('CORE'), FORGE = get('FORGE');
const noInput = { keys: {}, mouse: { x: 0, y: 0, down: false } };
const tests = [];
const test = (name, fn) => tests.push([name, fn]);

test('click empty spot builds a tower and spends gold', () => {
  const s = createState(); s.gold = 60;
  assert.strictEqual(clickAt(s, ...SPOT), true);
  assert.strictEqual(s.towers[0].lvl, 1);
  assert.strictEqual(s.gold, 10);
});
test('not enough gold: nothing built, hint shown, click still consumed', () => {
  const s = createState(); s.gold = 49;
  assert.strictEqual(clickAt(s, ...SPOT), true);
  assert.strictEqual(s.towers[0].lvl, 0);
  assert.strictEqual(s.gold, 49);
  assert.match(s.texts[0].txt, /Need 50/);
});
test('tower upgrades up to max level then refuses', () => {
  const s = createState(); s.gold = 1e6;
  for (let i = 0; i < 10; i++) clickAt(s, ...SPOT);
  assert.strictEqual(s.towers[0].lvl, get('MAX_TOWER'));
});
test('repair only when damaged, capped at max', () => {
  const s = createState(); s.gold = 100;
  clickAt(s, CORE.x, CORE.y);
  assert.strictEqual(s.gold, 100); // healthy: free no-op
  s.coreHp = s.coreMax - 10;
  clickAt(s, CORE.x, CORE.y);
  assert.strictEqual(s.coreHp, s.coreMax);
  assert.strictEqual(s.gold, 100 - get('REPAIR_COST'));
});
test('forge upgrades weapon and raises damage', () => {
  const s = createState(); s.gold = 1000;
  const before = get('weaponDamage')(s.weapon);
  clickAt(s, FORGE.x, FORGE.y);
  assert.strictEqual(s.weapon, 1);
  assert.ok(get('weaponDamage')(s.weapon) > before);
});
test('click on empty ground is not consumed (caller shoots instead)', () => {
  assert.strictEqual(clickAt(createState(), 5, 5), false);
});
test('spawned enemies start outside the canvas', () => {
  const s = createState();
  for (let i = 0; i < 50; i++) spawnEnemy(s);
  assert.ok(s.enemies.every(e => e.x < 0 || e.x > 960 || e.y < 0 || e.y > 640));
});
test('core at 0 HP loses; surviving WIN_TIME wins', () => {
  let s = createState(); s.coreHp = 0.001;
  s.enemies.push({ type: 'brute', x: CORE.x, y: CORE.y, hp: 1e9, max: 1e9, flash: 0 });
  update(s, 0.1, noInput);
  assert.strictEqual(s.over, 'lose');
  s = createState(); s.t = get('WIN_TIME') - 0.01;
  update(s, 0.1, noInput);
  assert.strictEqual(s.over, 'win');
});
test('difficulty ramps: faster spawns, more brutes, tougher enemies', () => {
  assert.ok(get('spawnInterval')(1) < get('spawnInterval')(0));
  assert.ok(get('bruteChance')(1) > get('bruteChance')(0));
  assert.ok(get('enemyHpScale')(600) > get('enemyHpScale')(0));
});
test('killing a brute drops 3 coins worth its gold', () => {
  const s = createState();
  s.enemies.push({ type: 'brute', x: 100, y: 100, hp: 0, max: 1, flash: 0 });
  update(s, 0.016, noInput);
  assert.strictEqual(s.coins.length, 3);
  assert.ok(s.coins.reduce((a, c) => a + c.v, 0) >= get('ENEMY').brute.gold);
});

let failed = 0;
for (const [name, fn] of tests) {
  try { fn(); console.log('ok  ', name); } catch (e) { failed++; console.log('FAIL', name, '\n    ', e.message); }
}
console.log(failed ? failed + ' FAILED' : 'ALL PASS');
process.exit(failed ? 1 : 0);
