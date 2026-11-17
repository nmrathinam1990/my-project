# Visual Priority Plan

Order is by visual payoff per hour of work. No redesign needed; everything builds on the existing `draw()` pipeline.

## Phase 1 — Do first (about half a day): "stop looking like a prototype"
1. Offscreen environment layer: gradient grass, dirt paths, rocks/bushes, town wall ring.
2. Drop shadows under all entities.
3. Vignette + warm dusk tint.
4. One web font + restyled HUD panels with icons.
5. Hover highlight + pill price badges (fixes readability of the core mechanic).

## Phase 2 — Feel (about half a day): "make actions satisfying"
1. Particle pool: hit sparks, death burst, coin pop/sparkle, muzzle flash.
2. Core damage flash + screen shake + low-HP red pulse.
3. Upgrade/build ring pulse and scale bounce; animated gold counter.
4. HiDPI canvas scaling.

## Phase 3 — Identity (1–2 days): "give it a signature look"
1. Shaded procedural sprites for player, both enemies, towers (rotating turret), forge (animated glow), core (flag and damage states).
2. Light pools and additive glow on bullets, coins, forge, tower spots.
3. Redesigned win/lose cards with stats.

## Can wait
- Day-to-night progression over 10 minutes.
- Spawn telegraphs, start/title screen, camera zoom effects.
- Bloom-style post-processing, extra environment animation (wind, grass sway).
- Audio (separate pass).

## Change first, in one line
The ground and shadows (Phase 1, items 1–3): they transform the first screenshot at almost no risk, and every later effect looks better on top of them.

## Guardrails
- Keep readability: no effect should hide enemies, coins or price labels.
- Cache heavy drawing (environment, sprites) in offscreen canvases to protect framerate.
- Cap particle counts (for example 300) so late-game swarms stay smooth.
- Re-test the click-to-upgrade hit areas after any layout change.
