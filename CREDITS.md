# Credits

## Direction and visual references

The project author supplied the finger-gun concept, gameplay changes, visual references and test feedback.

**Cuphead — Studio MDHR.** The supplied screenshots and the [official press kit](https://studiomdhr.com/press-kits/) informed the ink outlines, muted garden background and rubber-hose character style. [Caitlin Russell's background work](https://caitrussell.com/ch-bgs.html) was a reference for separating background layers. Cuphead screenshots, characters, music and animation files are not bundled as game assets.

**PSYCHOFINGER.** The supplied screenshot and [video page](https://www.bilibili.com/video/BV1vtpY6kETr/) were references for the foreground hand silhouette and proportions. The hands were redrawn as white gloves with coloured cuffs. The pose is based on that reference, rather than presented as a wholly independent design. The screenshot and original animation are not used as textures; recoil and return movement are implemented in this project.

The open-palm and fingertip-touch illustrations also follow reference images supplied by the author. The runtime drawings reuse Canvas/SVG paths in `hand-art.mjs`, `palm-art.mjs` and `burst-art.mjs`. The garden, plants, particles and interface icons are drawn in code. Fonts come from the operating system.

## Software and model

- **Google MediaPipe Tasks Vision 0.10.14:** [repository](https://github.com/google-ai-edge/mediapipe), [Apache 2.0 licence](https://github.com/google-ai-edge/mediapipe/blob/master/LICENSE).
- **Google Gesture Recognizer, float16/version 1:** [model documentation](https://ai.google.dev/edge/mediapipe/solutions/vision/gesture_recognizer). No model was trained for this project.
- **Implementation references:** Google's [web Gesture Recognizer guide](https://ai.google.dev/edge/mediapipe/solutions/vision/gesture_recognizer/web_js) and [Hand Landmarker guide](https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker/web_js), used for landmarks, world coordinates and the worker setup.
- **Distribution:** jsDelivr serves the library/WASM; Google Cloud Storage serves the model. Camera frames are not sent to either service.
- **Audio preparation:** FFmpeg with libmp3lame; the optional script is `scripts/prepare-audio.py`.
- **Tests:** Node.js's built-in test runner. Browser inspection tools were used during development, not as a game dependency.

No course-example code was copied. The game rules and the finger-lift, palm and fingertip-touch handling were developed for this project with AI assistance.

## Audio

The project author provided the following recordings and confirmed on 1 November 2026 that the files may be distributed with this public source repository:

| Recording | Use |
| --- | --- |
| *Well I Just Don't Care* — Stationary Sign / Epidemic Sound | Background music, converted to MP3 with fades |
| *Lasers, Gun, Fire, Shoot, Discharge, Singular* — Epidemic Sound | Light shot |
| *Lasers, Gun, Plasma Blaster, Shoot, Fire, Single Rounds, Dull* — Epidemic Sound | Medium shot |
| *Lasers, Gun, Fire, Shoot, Powerful, Exhaust, Steam, Scifi, Variations* — Epidemic Sound | Heavy shot and the edited charge loop |

The original inputs were WAV files. The charge loop was cut from the Powerful recording, reversed and filtered; its pitch and volume change while charging. Web Audio generates the full-charge cue and short impact tones. This credit does not grant a separate licence for reuse outside the project.

## AI assistance

**OpenAI Codex** helped with implementation, Canvas graphics, tests, debugging and documentation. **Imagegen** was tried for a garden background; that draft was rejected and is not included. [PROCESS.md](PROCESS.md) describes a suggestion that was kept and choices that were changed or rejected.
