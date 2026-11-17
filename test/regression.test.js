'use strict';
// Deterministic regression test. Loads the real game scripts (in the order listed in
// index.html) into a headless vm with stubbed DOM/canvas, drives them only through the
// real input handlers + animation frame, and hashes game state at checkpoints.
//
//   node test/regression.test.js            compare against test/golden.json
//   node test/regression.test.js --record   (re)write test/golden.json
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const root = path.join(__dirname, '..');
const GOLDEN = path.join(__dirname, 'golden.json');

function loadGame(seed) {
  const handlers = { window: {}, canvas: {} };
  const drawLog = crypto.createHash('sha1'); // running hash of every canvas call/property set
  const logOp = (k, v) => drawLog.update(k + ':' + JSON.stringify(v, (kk, x) => (typeof x === 'number' ? Math.round(x * 1e6) / 1e6 : x)) + ';');
  const ctxStub = new Proxy({}, {
    get: (t, k) => (k in t ? t[k] : (...a) => { logOp(String(k), a); return { addColorStop() {} }; }),
    set: (t, k, v) => { logOp('=' + String(k), v); t[k] = v; return true; },
  });
  const canvas = {
    width: 960, height: 640,
    getContext: () => ctxStub,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 960, height: 640 }),
    addEventListener: (n, f) => { (handlers.canvas[n] ||= []).push(f); },
  };
  let rafCb = null;
  const sandbox = {
    document: { getElementById: () => canvas },
    addEventListener: (n, f) => { (handlers.window[n] ||= []).push(f); },
    requestAnimationFrame: f => { rafCb = f; },
    performance: { now: () => 0 },
    location: { search: '' },
    URLSearchParams,
  };
  sandbox.window = sandbox;
  const ctx = vm.createContext(sandbox);
  let a = seed >>> 0; // mulberry32
  ctx.__rand = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  vm.runInContext('Math.random = __rand;', ctx);

  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const srcs = [...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map(m => m[1]);
  for (const f of srcs) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });

  const fire = (where, name, ev) => (handlers[where][name] || []).forEach(h => h(ev));
  return {
    ctx, drawDigest: () => drawLog.copy().digest('hex').slice(0, 12), get s() { return ctx.__g.s; },
    key: (down, k) => fire('window', down ? 'keydown' : 'keyup', { key: k, preventDefault() {} }),
    move: (x, y) => fire('canvas', 'mousemove', { clientX: x, clientY: y }),
    down: (x, y) => fire('canvas', 'mousedown', { button: 0, clientX: x, clientY: y }),
    up: () => fire('window', 'mouseup', {}),
    frame: (now) => rafCb(now),
  };
}

const r6 = v => (typeof v === 'number' ? Math.round(v * 1e6) / 1e6 : v);
const hash = s => crypto.createHash('sha1').update(JSON.stringify(s, (k, v) => r6(v))).digest('hex').slice(0, 12);

const SPOTS = [[370, 225], [590, 225], [370, 415], [590, 415]];
const WASD = ['w', 'a', 's', 'd'];

// scenario: 'bot' = shoots nearest enemy, wanders, spends gold on a fixed cycle
//           'idle' = does nothing (loses)  |  'god' = huge core HP so the full 10 minutes plays out
function run(name, seed, maxFrames) {
  const g = loadGame(seed);
  g.frame(0); // first frame (dt = 0)
  if (name === 'god') { g.s.coreHp = g.s.coreMax = 1e9; g.s.gold = 1e6; }
  const out = [];
  let now = 0, held = null, n = 0;
  for (; n < maxFrames; n++) {
    const s = g.s;
    if (name !== 'idle' && !s.over) {
      if (n % 90 === 0) { if (held) g.key(false, held); held = WASD[(n / 90 + seed) % 4 | 0]; g.key(true, held); }
      if (n % 3 === 0) {
        const e = [...s.enemies].sort((p, q) => Math.hypot(p.x - 480, p.y - 320) - Math.hypot(q.x - 480, q.y - 320))[0];
        if (e) { g.move(e.x, e.y); g.down(e.x, e.y); } else g.up();
      }
      if (n % 120 === 60) { // click a town object (cycles through all targets)
        const k = (n / 120) | 0;
        const t = k % 7 < 4 ? SPOTS[k % 7] : [[480, 320], [480, 470], [480, 320]][k % 7 - 4];
        g.move(t[0], t[1]); g.down(t[0], t[1]); g.up();
      }
    }
    now += 1000 / 60; g.frame(now);
    if (n % 600 === 0) out.push(hash(g.s) + "/" + g.drawDigest());
    if (g.s.over) { out.push('over:' + g.s.over + '@' + n + ':' + hash(g.s) + '/' + g.drawDigest()); break; }
  }
  if (name === 'god' || name === 'idle') { // restart paths: click-to-restart and R key
    g.down(10, 10); out.push('restart:' + hash(g.s));
    g.frame(now += 16.7); g.key(true, 'r'); out.push('r:' + hash(g.s));
  }
  return out;
}

const scenarios = {
  bot: () => run('bot', 1, 40000),
  bot2: () => run('bot', 7, 40000),
  idle: () => run('idle', 3, 40000),
  god: () => run('god', 5, 40000),
};
const only = process.env.ONLY ? process.env.ONLY.split(',') : Object.keys(scenarios); // e.g. ONLY=idle for a quick check
const result = Object.fromEntries(only.map(k => [k, scenarios[k]()]));

if (process.argv.includes('--record')) {
  fs.writeFileSync(GOLDEN, JSON.stringify(result, null, 1)); // (record always with all scenarios)
  console.log('recorded', Object.fromEntries(Object.entries(result).map(([k, v]) => [k, v.length + ' checkpoints, last=' + v[v.length - 1]])));
} else {
  const golden = JSON.parse(fs.readFileSync(GOLDEN, 'utf8'));
  let ok = true;
  for (const k of Object.keys(result)) {
    const same = JSON.stringify(golden[k]) === JSON.stringify(result[k]);
    if (!same) { ok = false; const i = golden[k].findIndex((v, j) => v !== result[k][j]); console.log('MISMATCH', k, 'at checkpoint', i, golden[k][i], '!=', result[k][i]); }
    else console.log('ok', k, '(' + golden[k].length + ' checkpoints)');
  }
  console.log(ok ? 'PASS' : 'FAIL');
  process.exit(ok ? 0 : 1);
}
