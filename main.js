'use strict';
// Input wiring + main loop.
const SPEED = Math.max(1, Math.min(60, +(new URLSearchParams(location.search).get('speed')) || 1)); // debug fast-forward
let s = createState(); // the one live game state
function reset() { s = createState(); }
const keys = {};
const mouse = { x: W / 2, y: H / 2, down: false };

// ---- input ----
addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if (e.key.toLowerCase() === 'r' && s.over) reset();
  if (['w', 'a', 's', 'd', ' '].includes(e.key.toLowerCase())) e.preventDefault();
});
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
function setMouse(e) {
  const r = cv.getBoundingClientRect();
  mouse.x = (e.clientX - r.left) * W / r.width;
  mouse.y = (e.clientY - r.top) * H / r.height;
}
cv.addEventListener('mousemove', setMouse);
cv.addEventListener('contextmenu', e => e.preventDefault());
cv.addEventListener('mousedown', e => {
  if (e.button !== 0) return;
  setMouse(e);
  if (s.over) { reset(); return; }
  if (!clickAt(s, mouse.x, mouse.y)) mouse.down = true;
});
addEventListener('mouseup', () => { mouse.down = false; });

// ---- main loop ----
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  for (let i = 0; i < SPEED; i++) update(s, dt, { keys, mouse });
  draw(s, mouse);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__g = { get s() { return s; }, mouse, reset };
