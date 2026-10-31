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

1. Enter mouse training. Follow seven short lessons: fire twice, charge a full shot, freeze time, fire with the other hand while freezing, push with both palms, recharge, then trigger explosive shots. Lessons check the actual action; finishing automatically enters wave one with fresh health, energy and combo. Skip training is also available.
2. Press A or left-click for the left gun; D or right-click for the right. Space fires both. Targets are automatic. A full two-second charge deals 3 damage; regular plants have only 1–2 health.
3. Hold Q or E to freeze enemies while the other hand shoots. Hold both to push strongly. Both hands share 10 seconds of energy; two palms drain it 1.6 times faster. Release to recharge, and reuse partial energy at any time.
4. Every 20 consecutive hits activates 6 seconds of explosive area shots, including the triggering shot. Nearby enemies take splash damage; splash does not add extra combo. The orange fingertip flame, impact radius and countdown show the active effect.
5. Complete five waves of 6, 10, 16, 22 and 30 enemies, with 3.5-second intermissions and at most 18 on screen. The final wave includes a 20-HP flower boss. It costs two hearts on contact and returns to attack; defeating it is required to win.
6. For the camera, point an index toward the lens, lift and lower it to shoot. Open a palm toward the camera to freeze; open both to push. Move both hands away: play pauses after a grace period while the preview remains clear. Resume a steady pose to continue. Denied permissions offer retry and mouse fallback.
7. Esc pauses game and audio. The home button resets the session; the speaker mutes music and effects together.

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
