# Development process

## Starting idea

The student selected a game controlled by a real webcam, then chose a first-person gesture wizard. The intended feeling is that an action made with the player's own hand produces magic in front of them. The first scope is a fixed training courtyard: one spell, two gestures, one target type, and a short challenge.

## Design and implementation decisions

1. **Untimed practice before a timed challenge.** A hit demonstrates that the player understands the complete loop before they can begin the 60-second round. The instructions remain available and pause gameplay.
2. **Charge with an open palm; cast with a fist.** The minimum charge prevents a very brief open-hand detection from firing. An edge-triggered cast prevents repeated shots while a fist stays closed.
3. **Freeze the aim during the closing gesture.** The palm centre can shift when fingers curl. Aim is therefore sampled from the open palm and retained for the cast, instead of moving to the newly classified fist's position.
4. **Separate recognition and game rules.** The same spell rules work with the webcam or mouse/keyboard. This gives the marker a meaningful demonstration when permission, a webcam, or the model download is unavailable.
5. **Cancel stored charge on interruption.** Tracking loss and pauses clear the charge. To resume camera play, the player must show a stable open palm. This prevents a stale fist from casting immediately on recovery.
6. **Generate the environment in code.** Perspective projection, crystals, a stylised glove, particles, and the emblem avoid unnecessary downloaded artwork and keep the mouse demo independent of external graphics libraries.
7. **Repair the inference worker after a real compatibility failure.** A browser test using a fake camera exposed that MediaPipe's WebAssembly loader calls `importScripts`, which is unavailable in a module worker. The worker was changed to a classic worker with a dynamic library import. A second test successfully downloaded the actual model and processed simulated video frames on the CPU.
8. **Reduce startup steps after student feedback.** The student said that opening a terminal and entering commands was inconvenient, and asked for a shortcut. A Windows double-click launcher now starts the local server and opens the default browser. It reuses an existing instance from the same checkout, selects another port when a different app occupies the default, and explains missing Node.js. This is feedback about setup; it is not a substitute for the other-person gameplay trial.

These are design decisions and implementation checks, **not observations from a human trial**.

## Technical verification

Verification performed on 29 October 2026:

- All **6 automated rule tests** passed: charge/release, held-fist repetition, brief input, loss of tracking, pause/resume, round end, and gesture confidence/stability.
- Chrome browser checks passed for mouse aim/charge/hit, unlocking the challenge, pausing/resuming its timer, help pausing play, returning home, keyboard charging, a blocked-CDN mouse demo, permission-denied feedback and fallback, and a 390px-wide layout without horizontal overflow. No uncaught page errors were observed. Screenshots are in `docs/`.
- The environment initially blocked loopback access. For the UI checks, Playwright served the project's own assets to the browser using request fulfilment. This verifies browser behaviour and rendering, but does not itself verify an HTTP hosting provider.
- After the preview server was restarted with the required host permission, an HTTP request to `http://localhost:4173` returned **200**. The documented local server can serve the game.
- A **fake camera stream with the real MediaPipe library/model** successfully loaded the CPU model, processed frames, and reported no hand in the test pattern. The camera was stopped on exit. This confirms the model loading/inference chain, not accuracy on a physical hand.
- A **fake stream with deterministic synthetic worker results** completed the full hand-input path: a stable open palm resumed play, charging and a fist hit the crystal, no-hand frames paused play, returning as a fist did not resume, a stable open palm did resume, and returning home released the stream.

Automated and synthetic checks do **not** satisfy the assignment's trial with another person. Physical webcam aiming, gesture accuracy, comfort, and lighting tolerance still require real user testing.

## User trial — still to do

**No genuine other-person trial has been completed or claimed in this document.** Before submitting, ask at least one person to use the game before explaining its controls. Avoid recording or identifying them.

Replace the following prompts with what actually happened:

- Trial date and device/browser:
- What the person first tried without instruction:
- Where they hesitated:
- Whether they could tell that a hand was recognised:
- Whether charging, releasing, and hitting made sense:
- What happened when they moved the hand out of view:
- One observation in their words or a factual description:
- The change made because of that observation, or the reason for keeping the design:
- What happened when the person tried the revised interaction:

Useful tasks: cast once, hit a crystal, start the challenge, move the hand out of view, recover, and stop the camera. Describe observed behaviour instead of writing only “they liked it”.

## AI use

OpenAI Codex was used to discuss possible game directions, narrow the scope, research MediaPipe's official documentation, generate the initial game code and original procedural visuals, write interaction tests, investigate failures, and draft the documentation. The student still needs to review the code, test the physical gesture interaction, perform the human trial, and be able to explain the charge-to-cast connection.

- **Suggestion kept:** an untimed practice step and a mouse/keyboard demonstration using the same rules. These support learning and make the experience understandable when a camera dependency is unavailable.
- **Suggestion narrowed/changed:** the initial first-person wizard concept became a fixed courtyard with one spell, rather than adding locomotion, exploration, and several gesture spells. The reason was to finish and explain one complete interaction loop within the assignment's scope.

These are the decisions made in this collaboration. Update this account if later human decisions or other AI tools change the project. Do not present an unreviewed AI-generated implementation as entirely hand-written work.

## Development history

The initial local commit defines the interaction rules and interruption tests. Subsequent commits add the playable scene and camera integration, then record corrections and validation. This is an actual implementation history, not a reconstructed claim about earlier work.

## Hosting status

A private Sites project was registered. Source publication did not complete: the initial short-lived credential expired during development, and the credential-renewal connector then returned an HTTP transport failure. No live deployment or public GitHub repository is claimed. The working local source, screenshots, documentation, and commits are preserved.

## Before submission

- Complete and document the genuine user trial above.
- Test the physical webcam, sound toggle, practice, challenge, pause, recovery, and camera shutdown.
- Follow `README.md` from a fresh terminal.
- Review the AI disclosure and source credits.
- Push this project and its existing commits to a public repository on your own GitHub account.
- Verify the repository while signed out, then submit its URL to Canvas.
