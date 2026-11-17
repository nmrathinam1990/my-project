# Visual Summary — The Last Village

Scope: visuals, presentation and polish only. Based on `game.js` / `style.css` and a screenshot of the running game.

## 1. Overall impression
**Verdict: clean, readable prototype, but clearly placeholder.** It reads as "programmer art": flat colors, plain circles, system font, no lighting.

**What makes it feel low-end**
- Everything is a flat-filled primitive (circles/rects) with no shading or outline hierarchy.
- The ground is one solid green (`#3b6e2f` in `style.css`) with a pale circle on it. No texture, no variation.
- Text is `sans-serif` (system default) with a hard black stroke, so it looks different on every OS and a bit crude.
- Almost no feedback: no hit sparks, no death effect, no screen shake, no upgrade flourish.
- The HUD is a flat translucent black bar.

**What already works**
- Gameplay clarity is strong. Prices float over objects and turn green when affordable, so the core loop is readable immediately.
- Consistent shape language (round enemies, round core) and a restrained palette.
- Good first-run hint text that fades out.
- Clear win/lose overlays.
- Floating "+gold" / "Tower built!" texts are a good foundation for feedback.

**Fix first:** the ground/atmosphere and combat feedback (hit/death/muzzle effects). Together they change the feel more than anything else, for little code.

## 2. Art style
- No deliberate style yet; it is "default canvas shapes". Nothing is blurry or stretched (all vector), but everything is too simple.
- Assets are consistent only because they are all primitives. The roofed core and the brown forge box are the only items with real silhouette; enemies and player are indistinguishable blobs apart from color.
- **Recommended direction: stylized flat vector with soft shading** ("mobile tower-defense" look). Thick dark outlines, a top-left highlight and a bottom drop-shadow on every object, and a warm dusk palette. It stays 100% procedural (no asset files), fits the current canvas code, and looks cohesive.

## 3. Color and lighting
- Palette is acceptable but flat: saturated green background, tan, red-brown, yellow. Mid-value green background competes with the yellow runners and green price labels (the "affordable" green is hard to read on a green field).
- Contrast: enemies/coins are fine; green-on-green price text and the thin tower-range cues are weak.
- Needs: a ground gradient, a vignette, soft drop shadows under all units, glow on coins/bullets/forge, and a subtle dusk tint so the lit town stands out against a darker outskirt.
- Separation: the town's pale disc helps, but towers and spots have almost no separation from it.

## 4. UI quality
- Basic: a text bar across the top and a plain HP bar with 1px white border.
- Spacing is uneven (fixed x offsets 14/150/300), and the font is system default at several unrelated sizes.
- Floating price labels work but are plain text; they would read better as small pill badges with a coin icon.
- Redesign: HUD panels (rounded, with gold icon / heart / timer), price badges, and end-screen cards.

## 5. Animation and feedback
Mostly missing:
- No muzzle flash, hit flash on towers/core, damage numbers, death burst, coin pop/bounce, upgrade pulse, or core damage shake/flash.
- Player and enemies move rigidly (no bob, no facing).
- Only existing feedback: 0.08s white enemy flash and rising text. Both are good and worth keeping.

## 6. Background and environment
- Flat and empty. Nothing outside the town: no trees, rocks, paths, grass variation or fence. Enemies spawn from featureless edges, so there is no sense of "outside" or direction of threat.
- The biggest upgrade: a pre-rendered ground layer (grass noise, dirt paths from the four edges to the core, scattered rocks/bushes) drawn once into an offscreen canvas, plus soft shadows.

See `visual_problems.md`, `quick_wins.md`, `high_impact_upgrades.md` and `visual_priority_plan.md`.
