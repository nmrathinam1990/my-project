'use strict';
// Canvas rendering. Reads state, never mutates it. Draw order below = z-order.
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');

// ---- primitives ----
function label(txt, x, y, color, size) {
  ctx.font = 'bold ' + (size || 13) + 'px sans-serif';
  ctx.textAlign = 'center';
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.7)';
  ctx.strokeText(txt, x, y);
  ctx.fillStyle = color || '#fff'; ctx.fillText(txt, x, y);
}
function circle(x, y, r, fill, stroke) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
}
// Price tag above/below an object; green when the player can afford it.
function priceLabel(state, obj, cost, dy, text) {
  label(text, obj.x, obj.y + dy, state.gold >= cost ? '#7dff7d' : '#aaa');
}
const clock = seconds => Math.floor(seconds / 60) + ':' + String(Math.floor(seconds % 60)).padStart(2, '0');

// ---- world ----
function drawTowers(state) {
  for (const t of state.towers) {
    if (!t.lvl) {
      ctx.setLineDash([5, 4]); circle(t.x, t.y, 24, 'rgba(0,0,0,.2)', '#e8e8e8'); ctx.setLineDash([]);
      label('+', t.x, t.y + 6, '#fff', 20);
      priceLabel(state, t, TOWER_BUILD_COST, -32, 'Build $' + TOWER_BUILD_COST);
    } else {
      circle(t.x, t.y, 20, '#6b6b7a', '#222');
      circle(t.x, t.y, 11 + t.lvl, '#4aa3df', '#123');
      label('Lv' + t.lvl, t.x, t.y + 4, '#fff', 11);
      if (t.lvl < MAX_TOWER) {
        const cost = towerUpgradeCost(t.lvl);
        priceLabel(state, t, cost, -30, 'Upgrade $' + cost);
      } else label('MAX', t.x, t.y - 30, '#ff0');
    }
  }
}

function drawForge(state) {
  ctx.fillStyle = '#5a3d2b'; ctx.fillRect(FORGE.x - 30, FORGE.y - 24, 60, 48);
  ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.strokeRect(FORGE.x - 30, FORGE.y - 24, 60, 48);
  circle(FORGE.x, FORGE.y, 9, '#ff7a1a');
  label('FORGE', FORGE.x, FORGE.y - 32, '#fff', 12);
  if (state.weapon < MAX_WEAPON) {
    const cost = forgeUpgradeCost(state.weapon);
    priceLabel(state, FORGE, cost, 44, 'Weapon Lv' + state.weapon + ' → ' + (state.weapon + 1) + '  $' + cost);
  } else label('Weapon MAX', FORGE.x, FORGE.y + 44, '#ff0');
}

function drawCore(state) {
  circle(CORE.x, CORE.y, CORE.r, '#c9b27a', '#3a2c12');
  ctx.fillStyle = '#8a3b2a'; ctx.beginPath();
  ctx.moveTo(CORE.x - 26, CORE.y - 6); ctx.lineTo(CORE.x, CORE.y - 32); ctx.lineTo(CORE.x + 26, CORE.y - 6); ctx.fill();
  ctx.fillStyle = '#e8d9a8'; ctx.fillRect(CORE.x - 20, CORE.y - 6, 40, 24);
  label('TOWN CORE', CORE.x, CORE.y + CORE.r + 15, '#fff', 12);
  if (state.coreHp < state.coreMax) priceLabel(state, CORE, REPAIR_COST, -CORE.r - 14, 'Repair $' + REPAIR_COST);
}

function drawCoins(state) {
  for (const c of state.coins) circle(c.x, c.y, 5, '#ffd028', '#a07800');
}

function drawEnemies(state) {
  for (const e of state.enemies) {
    const def = ENEMY[e.type];
    circle(e.x, e.y, def.r, e.flash > 0 ? '#fff' : def.color, '#200');
    if (e.hp < e.max) {
      ctx.fillStyle = '#300'; ctx.fillRect(e.x - def.r, e.y - def.r - 7, def.r * 2, 3);
      ctx.fillStyle = '#4f4'; ctx.fillRect(e.x - def.r, e.y - def.r - 7, def.r * 2 * e.hp / e.max, 3);
    }
  }
}

function drawBullets(state) {
  for (const b of state.bullets) circle(b.x, b.y, b.from === 'p' ? 3.5 : 3, b.from === 'p' ? '#fff' : '#9df');
}

function drawPlayer(state, mouse) {
  const pl = state.player, ang = Math.atan2(mouse.y - pl.y, mouse.x - pl.x);
  ctx.strokeStyle = '#222'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(pl.x, pl.y); ctx.lineTo(pl.x + Math.cos(ang) * 20, pl.y + Math.sin(ang) * 20); ctx.stroke();
  circle(pl.x, pl.y, pl.r, '#3b7de0', '#fff');
}

function drawFloatingTexts(state) {
  for (const t of state.texts) {
    ctx.globalAlpha = Math.min(1, t.life * 1.5);
    label(t.txt, t.x, t.y, t.color, 14);
    ctx.globalAlpha = 1;
  }
}

// ---- overlay UI ----
function drawHud(state) {
  ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(0, 0, W, 38);
  ctx.textAlign = 'left'; ctx.font = 'bold 18px sans-serif';
  ctx.fillStyle = '#ffd84a'; ctx.fillText('Gold: ' + state.gold, 14, 25);
  ctx.fillStyle = '#ddd'; ctx.fillText('Weapon Lv ' + state.weapon, 150, 25);
  const barX = 300, barW = 280, hpFrac = state.coreHp / state.coreMax;
  ctx.fillStyle = '#400'; ctx.fillRect(barX, 10, barW, 18);
  ctx.fillStyle = hpFrac > .3 ? '#3c3' : '#e33'; ctx.fillRect(barX, 10, barW * state.coreHp / state.coreMax, 18);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(barX, 10, barW, 18);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('Town ' + Math.ceil(state.coreHp) + ' / ' + state.coreMax, barX + barW / 2, 24);
  ctx.textAlign = 'right'; ctx.font = 'bold 18px sans-serif'; ctx.fillStyle = '#fff';
  ctx.fillText('Survive: ' + clock(Math.max(0, WIN_TIME - state.t)), W - 14, 25);
}

const HINT_SECONDS = 14;
function drawHint(state) {
  if (state.t >= HINT_SECONDS || state.over) return;
  ctx.globalAlpha = Math.min(1, (HINT_SECONDS - state.t) / 3);
  label('WASD move · Aim with mouse · Hold left click to shoot', W / 2, H - 52, '#fff', 16);
  label('Click tower spots to build · towers to upgrade · town to repair · forge for a better weapon', W / 2, H - 28, '#fff', 14);
  ctx.globalAlpha = 1;
}

function drawEndScreen(state) {
  if (!state.over) return;
  const win = state.over === 'win';
  ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(0, 0, W, H);
  label(win ? 'YOU SURVIVED!' : 'THE VILLAGE HAS FALLEN', W / 2, H / 2 - 20, win ? '#7dff7d' : '#ff6a6a', 44);
  label('Time survived: ' + clock(Math.floor(state.t)), W / 2, H / 2 + 20, '#fff', 20);
  label('Click or press R to play again', W / 2, H / 2 + 56, '#ddd', 18);
}

function draw(state, mouse) {
  ctx.clearRect(0, 0, W, H);
  circle(CORE.x, CORE.y + 40, 250, 'rgba(160,140,100,.35)'); // town ground
  drawTowers(state);
  drawForge(state);
  drawCore(state);
  drawCoins(state);
  drawEnemies(state);
  drawBullets(state);
  drawPlayer(state, mouse);
  drawFloatingTexts(state);
  drawHud(state);
  drawHint(state);
  drawEndScreen(state);
}
