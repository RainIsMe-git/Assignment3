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

Use Chrome or Edge on a desktop. The interface follows the browser language (Chinese or English); the top language button overrides it. Click **Try with mouse** to inspect the complete interaction without granting any permission. Click **Play with hands** for the camera version. MediaPipe Tasks Vision 0.10.14 and the version-1 float16 Gesture Recognizer model are downloaded on first camera use. Frames stay on the device; they are not uploaded or recorded. There are no API keys, paid inference services, or Python runtime requirements.

## A two-minute walkthrough

1. Enter mouse practice. It has no time limit or health penalty. Wait about two seconds: both fingertips and charge meters reach full charge.
2. Press A or left-click for the left gun; D or right-click for the right. Space fires both. Any living target is hit automatically. Compare a quick follow-up shot with a fully charged one: damage increases from 1 to 2 to 3, with distinct projectile, impact and sound feedback.
3. Press Esc. The game and audio stop; Resume continues. The home button resets the session. The speaker button mutes music and effects together.
4. Try Defend: complete five waves with five hearts. Waves contain 5, 8, 11, 14 and 18 plants, arriving in groups with a 3.5-second intermission between waves. The HUD shows the wave and remaining enemies. Plants move closer, hits push them back, and the result screen offers another game.
5. For the camera, point an index finger naturally toward the lens, hold briefly, then lift it and lower it to re-arm. The other fingers do not need a precise pose. Move both hands away: after a short grace period play pauses, while the camera preview remains clear. Bring a steady hand back to continue. Denied permission or an unavailable model provides Retry and mouse fallback.

## One input-to-response code path

`readGunPose()` in `dist/core.mjs` measures the index finger using MediaPipe landmarks, preferably in three dimensions. `GunTrigger` stabilizes the pose, accumulates up to 2 seconds of charge and fires once on a relative upward movement. It must be lowered before firing again, so holding a pose cannot repeatedly shoot.

`dist/app.mjs` passes that event to `GardenGame.shoot()`. This selects a living target, computes `1 + floor(charge * 2)` damage, applies knockback and updates the score. `GardenRenderer` displays the projectile and impact; `GameAudio` plays the matching sample. Both use `dist/combat-feedback.mjs` for flight timing. A snapshot keeps the pre-hit plant visible until the projectile reaches it; rules are resolved immediately so two simultaneous guns cannot score the same defeated target twice.

## Evidence, process and limitations

- [README](../README.md): controls, setup, dependencies, limitations and current screenshots.
- [PROCESS](../PROCESS.md): starting idea, successive decisions, first-trial feedback and AI disclosure. The submitter reported insensitive gestures and insufficient sound/feedback; these drove the changes. Details not supplied about the participant's first unprompted actions remain unspecified. No second-trial success claim is made.
- [Player feedback](../PLAYER_FEEDBACK.md): ongoing player reports, resulting changes and verification status, starting with the hand-mapping / rapid-fire / wave update.
- [CREDITS](../CREDITS.md): MediaPipe, visual references and the four user-supplied audio recordings.
- `npm test`: deterministic rule, tracking, bilingual, geometry and audio lifecycle checks. These do not measure real webcam accuracy.
- [Public development history](https://github.com/RainIsMe-git/Assignment3/commits/main/): the project was revised through commits rather than supplied as an unchanged tutorial.

The game is a fixed-view prototype, with no exploration or save system. Extreme occlusion and poor lighting can still defeat the underlying hand model. Audio begins after a deliberate button click; the game's core remains usable if audio cannot load. There is no hosted live-game URL; the repository contains everything needed for local mouse play. Submit the repository URL on Canvas; publication of the repository is not itself a Canvas submission.
