# Making Garden Gunners

## Starting point

The first version was a gesture-magic game. I wanted something more immediate: point a finger, lift it, and see a shot hit an approaching plant. That became Garden Gunners, a first-person game with two finger guns and a retro cartoon garden.

The intended player is someone trying a camera game at their desk, not someone willing to practise precise hand tracking. This shaped the main decision: the game chooses the target. The player's job is to decide when to fire, whether to wait for a stronger shot, and when to use a palm to make space.

## The interaction I worked on most

The original finger-gun pose was too strict. It checked several fingers even though the action I cared about was the index finger lifting. Pointing toward the camera also hides the finger's length, so a pose that looked right to the player could fail the screen-space checks.

I changed the input to use three-dimensional hand landmarks where available and relaxed the unused fingers. Each hand has its own charge and trigger. A lift fires once; lowering the finger makes the next shot possible. Holding a raised finger does not keep shooting. Later changes added a faster trigger path and stopped smoothing away short flicks.

Aiming needed a bigger change. Trying to move a camera-tracked cursor onto a plant made the hands leave the frame and sometimes encouraged crossing the arms. Automatic targeting removed that task. The two foreground gloves and target reticles still show where shots will go.

For feedback, I added charge light at the fingertip, different shot sounds, a visible projectile, a damage bar and knockback. The shot starts at the drawn fingertip. Its impact animation and sound arrive together, rather than making the enemy react before the bullet gets there.

## Testing and what changed

I asked another person to try the experience before explaining the controls. I also played successive versions myself and used those sessions to identify problems. The feedback recorded during development is collected in [PLAYER_FEEDBACK.md](PLAYER_FEEDBACK.md).

The first test feedback was that gesture recognition felt unresponsive and that the game lacked sound and enough feedback. I relaxed the gesture rules, added music and shot audio, and made charging and hits easier to see. This gave the action more visible stages, but it did not solve every tracking problem.

The hand graphics took several attempts. Early versions looked awkward and did not clearly point into the scene. I used the supplied PSYCHOFINGER reference for the pose and proportions, then redrew the hands as cream-coloured gloves. A generated garden background was rejected for looking too much like an AI image. I replaced it with a quieter background drawn in layers with Canvas.

Testing also changed the combat. The early game felt too difficult, so I lowered plant health. Later, the last waves became too easy, so I added five waves and a final boss. That made the final encounter too abrupt: the queen attacked while the player was still surrounded by ordinary enemies. She now waits behind them until they are cleared, then gives a longer warning before each attack.

The first reflected thorn orb disappeared when the counter succeeded. Although damage was applied, the response did not look like a reflection. It now travels back to the queen and damages her on arrival. This makes the connection between the two-palm action and the result visible.

Single-palm time stop also felt unhelpful. It now pushes slowly, while two palms push faster. Both use purple effects so they look like different strengths of the same action. The tutorial's two-palm step now takes roughly two seconds and keeps progress through short tracking gaps.

The combo reward needed another change. Six seconds of explosive bullets was too strong, so I replaced it with one full-screen clap attack. The first clap version passed controlled-input checks but failed in actual play: bringing the hands together could hide the landmarks needed to recognise it. I relaxed the finger-shape check and let the detector keep an approach through a brief missing frame. The latest UI also shows a flashing eight-second opportunity only after a 20-hit milestone, rather than leaving a permanent button on screen.

The latest test screenshot showed the physical right hand marked teal/left, even though the controls felt usable. I corrected the camera-label conversion before both drawing and firing, and added a preview-level swap button. This still needs another camera test; changing a label alone is not enough evidence that it feels right.

## One piece of code I can explain

The firing loop runs through four files:

1. `tracking.mjs` matches observations to the two hands and sends the index pose to `GunTrigger` in `core.mjs`.
2. `GunTrigger` compares the lift with the hand's recent resting pose. A deliberate rise produces one shot event and starts a latch until the finger lowers.
3. `GardenGame.shoot()` chooses an attackable plant, calculates `1 + charge * 2` damage and updates health, score and combo.
4. `app.mjs` sends the result to `renderer.mjs` and `audio.mjs`. The player sees the shot, hears the hit and can decide whether to fire again or charge longer.

The clap follows the same idea, but watches the distance between two hands over time. It requires an approach from a separated position, not just a still image of overlapping hands. The skill has to be available, and its damage is applied once at the animation's contact frame.

## Handling an interruption

Camera permission is an ordinary point of failure. The game offers retry and mouse play when permission is denied or the model cannot load. If both hands leave view during play, the game pauses. I removed the full-screen blur from that pause because it hid the very preview needed to recover. Home stops the camera, and resetting a game clears stored input so an old gesture cannot fire on return.

## Where AI helped, and where I changed it

I used **OpenAI Codex** to help write the JavaScript, gesture rules, Canvas drawings, tests and documentation, and to inspect problems in the browser. I supplied the gameplay direction, visual references and repeated test feedback.

I kept the mouse/keyboard alternative proposed during development. It makes the same interaction available when the camera or model is unavailable, which also makes the project easier to try for marking.

I rejected an **imagegen** garden draft because it was too detailed and did not fit the cartoon characters. I also changed several AI-assisted design and code choices after testing: strict finger checks became more forgiving, explosive shots became a clap, and the queen's simultaneous attack with the crowd became a separate encounter. The first attempt at a hand-label fix was not reliable in real use, despite passing synthetic tests.

## Checks and remaining work

The current automated suite has 84 checks for rules, gesture sequences, pauses, audio and both interface languages. Browser checks use mouse input or clearly labelled synthetic landmarks. They help catch errors such as double-triggering a clap or dealing reflected damage too soon, but do not measure camera comfort or recognition accuracy.

Recent development images show the [clap impact](docs/clap-impact.png) and [returning thorn orb](docs/orb-return.png). They are labelled as simulated input. Player camera images are not included in the repository.

For the latest revision, I checked that the clap prompt stays hidden before the reward, appears with an [eight-second countdown](docs/clap-window.png), and disappears when time runs out. A simulated camera clap triggered the area hit and consumed the reward. The hand-swap button also changed state correctly, with no browser errors in this check.

The main work left is to try the revised clap and hand mapping again with a real camera. The latest feedback is useful precisely because it showed that the previous checks were not enough. Balance may also need another pass now that the continuous area-shot reward is gone.

An unauthenticated GitHub API request returned HTTP 200 and confirmed that the repository is public on 1 November 2026. The public repository has the source, assets and successive commits. The assignment asks for its URL to be submitted on Canvas; pushing to GitHub does not submit it there. Media sources and the audio-distribution permission confirmed by the project author are recorded in [CREDITS.md](CREDITS.md).

## 中文简要对照

项目从手势魔法改为第一人称双指枪，核心是“抬指输入—命中植物—声音、血条与击退反馈”。我让另一位人在未听讲解前试玩，也持续自己试玩并记录问题。反馈推动了宽松识别、自动瞄准、音效、白手套、波次、女王以及拍手技能的调整。

过程并非每次修改都成功：左右手仍出现过混淆，爆燃过强，女王与小怪同时进攻太难，拍掌在真实使用中也曾无效。最新改动放宽拍手遮挡容错，并把提示改为 20 连击后出现的 8 秒限时机会。新版本仍需实际复测。

Codex 协助代码、美术路径、测试和材料；保留了鼠标替代输入，拒绝了不合适的 AI 花园图，并根据测试不断改动早期方案。自动测试和模拟输入记录放在此处，不混入玩家反馈表的效果栏。
