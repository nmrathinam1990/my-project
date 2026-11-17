# Quick Wins (each roughly 10–45 minutes, all in `game.js` / `style.css`)

## Top 5
1. **Ground gradient + vignette.** Fill the canvas with a radial gradient (lighter around the town, darker at edges) and overlay a soft dark vignette. Instant depth, ~15 lines.
2. **Drop shadows under everything.** Draw a dark ellipse (alpha ~0.3) beneath the player, enemies, towers, forge, and core before drawing them. Grounds all objects.
3. **Hit and death feedback.** On bullet hit: 3–5 tiny sparks. On enemy death: a short expanding ring plus a small particle burst in the enemy color. Add a tiny knockback nudge on hit.
4. **Core damage feedback.** When core HP drops: flash a red tint on the core, a brief screen shake (2–4px decaying), and a red vignette pulse when HP is under 30%.
5. **Better font and HUD polish.** Load one web font (e.g. Google Fonts "Baloo 2" or "Rubik") via `<link>` in `index.html`, use it everywhere, and give the HUD rounded panels with a coin icon, heart icon, and clock icon drawn in canvas.

## More quick wins
- **Hover highlight:** when the mouse is over a clickable object, draw a glow ring and show the price badge brighter. Fixes "what's clickable".
- **Price badges:** draw labels as rounded pills (dark fill, gold border) instead of stroked text; avoid green-on-green.
- **Muzzle flash:** 1–2 frame bright circle at the gun tip and at tower barrels.
- **Coin polish:** add a bright highlight and a small spawn pop (scale 0→1 with bounce); pickup gives a tiny sparkle.
- **Upgrade pulse:** on build/upgrade, expand a ring from the object and briefly scale it 1.15→1.
- **Outlines:** use a consistent dark outline width (2–3px) on all entities.
- **HiDPI canvas:** scale the canvas backing store by `devicePixelRatio` so lines stay crisp.
- **Enemy HP bars:** always show for brutes; make them 4px with a dark border.
- **Hint text:** put it on a soft rounded panel instead of a hard stroke.
