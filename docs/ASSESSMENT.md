# Assignment guide — Garden Gunners

**Repository to submit:** [RainIsMe-git/Assignment3](https://github.com/RainIsMe-git/Assignment3)

This is a browser project. It does not need Python, a paid account, a microphone or a GPU. The brief asks for a clear input–response–feedback loop; the main example here is lifting a finger to shoot a plant, then seeing and hearing the hit.

## Try it

From a fresh terminal, with Node.js 20 or later installed:

```sh
git clone https://github.com/RainIsMe-git/Assignment3.git
cd Assignment3
npm run play
```

The browser opens automatically. No install or build step is needed. Windows users can also double-click `Play Garden Gunners.cmd`.

Choose **Train with mouse** to try the complete game without the camera dependency. Press A or D to fire, wait for a stronger charge, hold Q or E to push, and hold both for a stronger push. After 20 consecutive hits, a flashing eight-second fingertip-burst opportunity appears; C activates it. The six lessons lead into wave one, or you can skip them.

For camera play, choose **Train with hands** and allow access. Lift the index to fire, show a palm to push, and point the two index fingers toward each other, touching their tips when prompted. A brief steady near-touch also works; keep both hands visible. The first run downloads MediaPipe and its model. The preview's ↔ button swaps hand controls if the mapping feels reversed.

Try an interruption as well: pause with Esc, or move both hands out of view in camera mode. The game pauses and keeps the preview clear. Home closes the camera. If camera permission is denied or the model is unavailable, retry and mouse play remain available.

## Where the brief is covered

| Assignment requirement | In this project |
| --- | --- |
| A clear idea and intended user | README introduces a casual desktop finger-gun game with automatic targeting. |
| Deliberate input and meaningful response | Finger lift or A/D fires; charging changes damage; palms move enemies; touching index tips during the reward window damages the crowd. |
| Feedback and understandable next action | Fingertip charge, shot audio, bullets, health bars, push effects, a burst countdown and contact animation, tutorial steps and reset/exit controls. |
| An ordinary mistake or interruption | Tracking loss pauses play; denied permission or failed loading offers mouse play. |
| Trial with another person before explanation | Confirmed by the author. PROCESS describes the trial and resulting changes; PLAYER_FEEDBACK collects the test feedback from development. |
| Working source, assets and setup | `dist/`, `scripts/`, `package.json` and the run instructions in README. The optional Python script only prepares audio and is not needed to run the submission. |
| README with an image and limitations | English-first README with a gameplay image, setup, controls and current camera limitations. |
| Process, AI use and a kept/rejected suggestion | PROCESS covers the initial idea, revisions, retained mouse alternative and rejected imagegen background. |
| Credits and development history | CREDITS lists model, software, visual and audio sources; [commits](https://github.com/RainIsMe-git/Assignment3/commits/main/) show successive revisions. |

## A code path to discuss

`HandTracking.update()` feeds an index pose to `GunTrigger`. A lift creates a shot event; `GardenGame.shoot()` chooses a target and calculates continuous charge damage. `app.mjs` forwards the result to the renderer and audio. Lowering the finger re-arms the trigger, so a held pose cannot fire repeatedly.

## Submission notes

The local game and source are in the repository; there is no separate hosted live version. Images marked **SIMULATED INPUT** show development checks, not recordings of a tester. The new fingertip gesture and revised hand mapping still need a real-camera retest, as the latest feedback explains.

The author has confirmed permission to include the supplied audio files in the public repository. No participant recordings or camera images are included. The repository URL must still be submitted through Canvas; a Git push is not a Canvas submission.

## 中文简要对照

核对原聊天中的作业要求后，材料按“想法与用户—输入回应反馈—运行方法—中断处理—测试与改进—AI 使用—来源与历史”组织。第一次让他人在未讲解前试玩已确认，所有后续体验问题记录为测试反馈。运行用 `npm run play`，无摄像头可选鼠标模式。最后提交的是上方公开 GitHub 仓库链接，仍需在 Canvas 完成提交。
