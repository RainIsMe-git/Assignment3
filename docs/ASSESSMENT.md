# Garden Gunners — assessment guide

## Idea and intended user

A short first-person finger-gun game for casual desktop players who want a playful camera interaction without precise aiming. Mutant plants approach the player. Either hand can charge independently; lifting the index finger fires at an automatically selected living plant. Waiting longer increases damage. A complete mouse/keyboard alternative works without camera access or a model download.

## Run from a fresh terminal

Install Node.js 20 or later, clone this public repository, then:

```sh
git clone https://github.com/RainIsMe-git/Assignment3.git
cd Assignment3
npm run play
```

No package installation or build step is needed. The launcher opens the browser and prints the actual local URL. On Windows, double-click `Play Garden Gunners.cmd` instead. Keep the terminal open; Ctrl+C stops the server. `npm start` is also supported, but requires manually opening the printed address. If its default port is occupied, use `npm run play` to select a free port.

Use Chrome or Edge on a desktop. The interface follows the browser language (Chinese or English); the top language button overrides it. Click **Train with mouse** to inspect the complete interaction without granting any permission. Click **Train with hands** for the camera version. MediaPipe Tasks Vision 0.10.14 and the version-1 float16 Gesture Recognizer model are downloaded on first camera use. Frames stay on the device; they are not uploaded or recorded. There are no API keys, paid inference services, or Python runtime requirements.

## A two-minute walkthrough

1. Enter mouse training. Complete six lessons: fire, charge, gentle push, push while firing, strong push, and recharge. Palm lessons have unlimited energy; normal recharging is taught separately. The double-palm lesson takes about two seconds including its success cue and tolerates brief tracking gaps. Completion starts wave one automatically; skipping is available.
2. A / left click fires the left gun; D / right click fires the right; Space fires both. Damage grows continuously from 1 to 3 over two seconds. Regular health starts at 1 / 1.3 / 1.6 and grows by 0.36 per wave, capped at 5. Continuous health bars have a delayed damage trail.
3. Hold Q or E for a gentle backward push; hold both for a stronger push. Both use purple effects. Share 10 seconds of energy, drained 1.6 times faster by two palms; release to recharge. The other hand can keep firing. Enemy animation and spawning no longer freeze.
4. Explosive shooting has been removed. Each 20 consecutive hits earns one stored clap (no stacking). Spread both hands, then clap once to deal 2.5 damage to all current enemies at the animation contact frame. The bottom icon lights up when ready. Mouse alternative: C or the bottom button. Holding hands together cannot repeat it. No extra combo is earned; this is optional, outside mandatory training.
5. Clear ten waves of 6, 10, 16, 22, 30, 34, 38, 42, 46 and 50 enemies, with 3.5-second breaks. Wave 5 retains the 20-HP flower boss. The 80-HP Thorn Queen waits behind wave 10 minions and engages only after all minions and pending spawns are cleared. After five seconds of preparation, attacks have 4.5 seconds of warning and 3 seconds of flight. A single palm disperses spores; both palms reflect the orb. The return flight takes 0.85 seconds and deals damage on arrival. Each counter opens a 4.5-second damage window. Counter both attack types to remove the seals at 60 / 30 HP. Uncountered attacks cost two hearts; clapping cannot bypass seals.
6. Camera play uses an index lift to shoot, an open palm to push, and separated open hands moving together to clap. Short overlap-related tracking loss is tolerated only at the end of a confirmed approach. Move both hands away and play pauses after a grace period with a clear preview. Camera status distinguishes palms, guns and energy depletion.
7. Esc pauses gameplay and audio; Home resets and closes the camera. Speaker toggles music and effects.

## One input-to-response code path

`readGunPose()` in `dist/core.mjs` measures the index finger using MediaPipe landmarks, preferably in three dimensions. `GunTrigger` stabilizes the pose, accumulates up to 2 seconds of charge and fires once on a relative upward movement. It must be lowered before firing again, so holding a pose cannot repeatedly shoot.

`dist/app.mjs` passes that event to `GardenGame.shoot()`. This selects a living target, computes `1 + charge * 2` damage, applies knockback and updates the score. `GardenRenderer` displays the projectile and impact; `GameAudio` plays the matching sample. Both use `dist/combat-feedback.mjs` for flight timing. A snapshot keeps the pre-hit plant visible until the projectile reaches it; rules are resolved immediately so two simultaneous guns cannot score the same defeated target twice.

## Evidence, process and limitations

- [README](../README.md): controls, setup, dependencies, limitations and current screenshots.
- [PROCESS](../PROCESS.md): starting idea, successive decisions, first-trial feedback and AI disclosure. The submitter reported insensitive gestures and insufficient sound/feedback; these drove the changes. Details not supplied about the participant's first unprompted actions remain unspecified. No second-trial success claim is made.
- [Player feedback](../PLAYER_FEEDBACK.md): ongoing player reports, resulting changes and verification status, starting with the hand-mapping / rapid-fire / wave update.
- [CREDITS](../CREDITS.md): MediaPipe, visual references and the four user-supplied audio recordings.
- `npm test`: deterministic rule, tracking, bilingual, geometry and audio lifecycle checks. These do not measure real webcam accuracy.
- [Public development history](https://github.com/RainIsMe-git/Assignment3/commits/main/): the project was revised through commits rather than supplied as an unchanged tutorial.

The game is a fixed-view prototype, with no exploration or save system. Extreme occlusion and poor lighting can still defeat the underlying hand model. Audio begins after a deliberate button click; the game's core remains usable if audio cannot load. There is no hosted live-game URL; the repository contains everything needed for local mouse play. Submit the repository URL on Canvas; publication of the repository is not itself a Canvas submission.
