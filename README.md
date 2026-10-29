# Palm Arcana · 掌心奥术

A small first-person gesture-controlled spellcasting game. Open your palm to charge an arcane bolt, aim with your hand, then close your fist to release it and break a floating crystal.

![Palm Arcana title screen](docs/screenshot.png)

## Idea and intended player

For a casual player curious about casting magic with their own hand. A fixed first-person courtyard keeps the experience focused on one learnable interaction: **aim → charge → release → see a hit or miss → try again**. It is a short training experience, rather than a walking or exploration game.

Start with untimed practice. Breaking your first crystal unlocks a 60-second challenge. Charge for about a second for full power. A hit gives 50–100 base points, with up to 50 extra points for consecutive hits. A miss resets the combo. At the end, see your score, accuracy, and best combo, then replay or return home.

## Run locally

Run this prototype locally using the steps below. A Sites project was registered, but online publication could not complete because the connector became unavailable while renewing its source credential. No live link is claimed. This does not replace your eventual public GitHub submission.

Requires **Node.js 20 or newer** and a modern desktop browser. No Python, npm installation, account, API key, or paid service is needed.

From a fresh terminal inside this project folder:

```sh
node --version
npm start
```

Open **http://localhost:4173** in a normal browser tab. Keep the terminal open. Stop the server with **Ctrl+C**. If port 4173 is already in use, stop the other process or change the port in `scripts/serve.mjs`.

Camera access requires **localhost or HTTPS**. Opening `index.html` directly with `file://` is not supported because the game uses JavaScript modules and a worker. Embedded previews may block camera permissions; use a standalone browser tab.

## Controls

| Action | Camera mode | Mouse / keyboard demo |
| --- | --- | --- |
| Aim | Move one open palm, facing the camera | Move the mouse over the scene, or use arrow keys |
| Charge | Keep all five fingers open | Hold the left mouse button or Space |
| Release | Close the hand into a fist | Release the button or Space |
| Pause | Pause button or Esc | Pause button or Esc |
| Stop | Return home / Close camera | Return home |

Use one hand in good lighting with the wrist and fingers fully visible. The mirrored preview includes the detected hand landmarks and the current recognition state. Aim turns gold over a target. The energy bar shows charge; its small marker is the minimum charge needed to fire. Keep opening the hand between casts: a held fist never repeatedly fires.

Mouse mode implements the same charge, cast, target, scoring, practice, challenge, and reset loop. It is also the demonstration when no webcam or recognition service is available.

## Dependencies and privacy

The game and original perspective renderer are plain HTML, CSS, and JavaScript. The local server and logic tests use only Node built-ins. There is no build step.

Camera mode downloads the following public assets on demand:

- `@mediapipe/tasks-vision` **0.10.14**, including its matching WebAssembly runtime, from jsDelivr.
- Google's pretrained `gesture_recognizer` model, **float16, version 1**, from Google Cloud Storage.

An internet connection to those providers is required for camera mode. The game does **not** train a model. MediaPipe provides `Open_Palm`, `Closed_Fist`, and hand landmarks; our code maps these to game actions. Recognition runs on the device. Camera frames are not recorded, uploaded, or saved by this application. Audio is off by default and generated locally when enabled.

There are no analytics, accounts, local-storage records, or backend game services. Returning home, cancelling setup, or closing the page stops the camera tracks. A new connection asks the browser for access again according to its permission settings.

## Error and interruption handling

- Permission denied, missing/busy camera, unsupported context, model/network failure, and loading timeout: explain the problem and provide retry and mouse-demo controls.
- Hand leaves the image: cancel charge and pause the timer; a stable open palm is required to resume, so returning as a fist cannot accidentally fire.
- Unrecognised or low-confidence gesture: cancel charge after a short stability window, rather than guessing a cast.
- Switching tabs/windows, opening help, or pausing: stop the timer and discard held input. Resume explicitly; camera mode additionally requires a new open palm.
- Repeated clicks and held fists: input setup is guarded, and a cast requires a charged open-to-fist transition.

## Project structure and the code to explain

```text
dist/                Browser source and generated SVG emblem
  core.mjs           Spell rules, timer, score, and gesture stability filter
  app.mjs            Connects player input to game state and feedback
  renderer.mjs       Original perspective courtyard, crystals, hand, and effects
  camera.mjs         Camera lifecycle and hand preview
  gesture-worker.mjs MediaPipe recognition
scripts/serve.mjs     Local static server
tests/core.test.mjs   Interaction and interruption tests
docs/                Screenshots of the running experience
PROCESS.md           Design decisions, AI use, and genuine user-trial record
CREDITS.md           Sources and attribution
```

To explain one action-to-response connection, follow `SpellGame.tick()` in `dist/core.mjs`: while `open`, charge increases; only an `open → fist` transition with enough charge emits `cast`. `app.mjs` then checks the target, updates the score, and triggers the visual/audio response. The hand position is saved while open to reduce aim movement when the fingers close.

Run the dependency-free rule tests:

```sh
npm test
```

## Known limitations and submission status

- This prototype has fixed-camera perspective graphics, one spell, and one target type. There is no walking, multiplayer, or progress saving.
- Hand tracking depends on lighting, camera angle, model support, and device performance. Left/right-handed users use the same controls. The game has not yet been validated by a real human using the physical webcam.
- Models are not bundled for offline camera use. Mouse mode works without their download.
- The intended hardware is a desktop/laptop; the page adapts to narrow screens, but mobile gesture performance needs separate testing.
- **A real user trial is still required.** Record it honestly in `PROCESS.md` and make or justify a design change.
- **The public GitHub repository submission is still required.** A Sites preview is not a substitute for the assignment's public repository on your own GitHub account. Check the final repository while signed out.

See [PROCESS.md](PROCESS.md) and [CREDITS.md](CREDITS.md).
