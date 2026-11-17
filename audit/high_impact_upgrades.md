# High-Impact Upgrades

All can stay procedural (no external art) and fit the current single-file structure.

## Top 5
1. **Pre-rendered environment layer.** Draw once into an offscreen canvas: grass with noise/two-tone patches, dirt paths from the map edges to the core, scattered rocks, bushes and tree clusters outside the town, a low stone wall or fence ring around the town, and soft ground shadows. Blit each frame. Biggest single visual jump with almost no runtime cost.
2. **Shaded, stylized entity sprites (procedural).** Replace plain circles with small drawn characters, cached to offscreen canvases per size/level:
   - Player: body, helmet, visible gun that rotates with aim, subtle walk bob.
   - Runner: spiky/pointy silhouette, brute: bulky horned shape, each with a highlight and outline, and slight squash-and-stretch while moving.
   - Towers: base, a rotating turret with recoil, visibly different tiers (color/trim/banner).
   - Core: a proper keep/town hall with windows, a flag that waves, and visible damage states (cracks, smoke, fire) as HP drops.
   - Forge: glowing furnace with animated sparks and chimney smoke.
3. **Lighting and atmosphere pass.** Dusk color grade, a light pool around the town (torches/glow at tower spots and forge), additive glow on bullets/coins/muzzle flashes, and a vignette. Night/dusk lighting lets lit objects "pop" and makes the town feel like the safe place.
4. **Particle and juice system.** A small shared particle pool for sparks, smoke, dust from running enemies, coin bursts, upgrade bursts, damage numbers, and confetti on win/ember fall on loss. Add hit-stop (30–50ms) on brute kills and camera shake scaled to the event.
5. **Redesigned UI layer.** A cohesive HUD kit: rounded panels with subtle gradient and inner highlight, icon set (coin, heart, clock, hammer), animated gold counter (count-up and bump on gain), a segmented core health bar with a damage-trail (white lag bar), pill price badges that react to affordability, and polished end-screen cards with stats (time, gold earned, kills) and animated entrance.

## Nice later
- Phase-of-day progression: the sky tint shifts from dusk to night over the 10 minutes, matching rising difficulty.
- Enemy spawn telegraphs (a pulse at the edge where a brute will appear).
- Animated title screen / start card.
- Optional post-effects via canvas filters (bloom approximation) if performance allows.
- Sound is out of scope for this visual audit, but pairs strongly with the effects above.
