# Visual Problems

## Top 5
1. **Flat, empty ground.** Single solid green + one pale disc (`style.css`, `draw()` in `game.js`). No depth, no sense of place or direction of attack.
2. **Almost no combat feedback.** No muzzle flash, impact sparks, death burst, core-damage flash/shake, or coin pop. Fighting feels weightless.
3. **No lighting or shadows.** Every object is a flat fill; nothing is grounded. Units look like stickers on the grass.
4. **Basic HUD and typography.** System `sans-serif`, flat black bar, thin HP bar, uneven spacing, no icons.
5. **Weak readability of interactive objects.** Green "affordable" labels sit on a green field; tower spots, towers, and the town disc blend together; nothing signals "clickable" (no hover state).

## Further issues
- Player, runners, brutes are plain circles; distinguishing them depends on color alone. Player facing is only a short line.
- Towers have no turret rotation or recoil; they just change circle size by level.
- Bullets are identical dots (player vs tower differ only by tint).
- Coins are flat yellow dots with no shine/bounce, so they can get lost on the green background.
- Enemy HP bars appear only after damage and are tiny (3px).
- The end-screen overlay is only a dark wash with text; no card, no stats panel.
- Hint text at the bottom uses a heavy outline and competes with the world.
- Canvas is stretched with CSS to fit the window (960×640 logical), which can look soft on high-DPI displays (no devicePixelRatio handling).
- Cursor is the default crosshair with no custom reticle at the player's aim point.

## What is NOT a problem
No blurry or stretched art (it is all vector), and shape language is consistent.
