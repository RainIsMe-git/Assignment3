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

An earlier test screenshot showed the physical right hand marked teal/left. The label-conversion fix and swap button did not settle the problem: the next feedback confirmed that firing timing felt accurate but the guns were reversed. I now assign new hands by position in the mirrored preview and keep that identity while the wrist remains tracked. The model label no longer decides which gun fires. The trigger thresholds remain unchanged.

## One piece of code I can explain

The firing loop runs through four files:

1. `tracking.mjs` matches observations to the two hands and sends the index pose to `GunTrigger` in `core.mjs`.
2. `GunTrigger` compares the lift with the hand's recent resting pose. A deliberate rise produces one shot event and starts a latch until the finger lowers.
3. `GardenGame.shoot()` chooses an attackable plant, calculates `(1 + charge * 2) * damageMultiplier` damage and updates health, score and combo.
4. `app.mjs` sends the result to `renderer.mjs` and `audio.mjs`. The player sees the shot, hears the hit and can decide whether to fire again or charge longer.

The fingertip burst follows the same idea. It checks that the index fingers point toward each other and that their tips are close in the camera image. An approach into contact or a short steady near-touch can trigger it. Both hands must be visible; holding contact latches the detector until the tips separate. The skill has to be available, and its damage is applied once at the animation's contact frame.

## Handling an interruption

Camera permission is an ordinary point of failure. The game offers retry and mouse play when permission is denied or the model cannot load. If both hands leave view during play, the game pauses. I removed the full-screen blur from that pause because it hid the very preview needed to recover. Home stops the camera, and resetting a game clears stored input so an old gesture cannot fire on return.

## Where AI helped, and where I changed it

I used **OpenAI Codex** to help write the JavaScript, gesture rules, Canvas drawings, tests and documentation, and to inspect problems in the browser. I supplied the gameplay direction, visual references and repeated test feedback.

I kept the mouse/keyboard alternative proposed during development. It makes the same interaction available when the camera or model is unavailable, which also makes the project easier to try for marking.

I rejected an **imagegen** garden draft because it was too detailed and did not fit the cartoon characters. I also changed several AI-assisted design and code choices after testing: strict finger checks became more forgiving, explosive shots became a clap, and the queen's simultaneous attack with the crowd became a separate encounter. The first attempt at a hand-label fix was not reliable in real use, despite passing synthetic tests.

## Checks and remaining work

The current automated suite has 95 checks for rules, gesture sequences, pauses, audio and both interface languages. Browser checks use mouse input or clearly labelled synthetic landmarks. They help catch errors such as double-triggering a burst or dealing reflected damage too soon, but do not measure camera comfort or recognition accuracy.

Development images show the [current fingertip burst](docs/fingertip-burst.png), [former clap impact](docs/clap-impact.png) and [returning thorn orb](docs/orb-return.png). They are labelled as simulated input. Player camera images are not included in the repository.

Before the fingertip replacement, I checked that the clap prompt stayed hidden before the reward, appeared with an [eight-second countdown](docs/clap-window.png), and disappeared when time ran out. A simulated camera clap triggered the area hit and consumed the reward. The hand-swap button also changed state correctly, with no browser errors in this check.

The main work left is to try the new fingertip gesture and hand mapping again with a real camera. Previous feedback showed that controlled checks were not enough to establish camera comfort. Balance may also need another pass now that the continuous area-shot reward is gone.

An unauthenticated GitHub API request returned HTTP 200 and confirmed that the repository is public on 1 November 2026. The public repository has the source, assets and successive commits. The assignment asks for its URL to be submitted on Canvas; pushing to GitHub does not submit it there. Media sources and the audio-distribution permission confirmed by the project author are recorded in [CREDITS.md](CREDITS.md).

## 1 November revision: mirrored input and wave rewards

The changes follow [round 11 of the feedback record](PLAYER_FEEDBACK.md#round-11--1-november-mirrored-controls-missed-claps-and-progression). [Hand tracking](dist/tracking.mjs) uses mirrored wrist position for initial assignment and continuity for subsequent frames. The old saved swap setting is retired so it cannot reverse the revised default. The preview and firing events use the same side.

That revision's clap detector accepted convergence without a finger-shape gate and ran only during an available reward. It accepted near contact and brief one-hand overlap after a visible approach. Still hands, starting overlapped, complete tracking loss and a change in apparent hand size alone did not trigger it. Round 14 subsequently replaced that detector with the [fingertip detector](dist/burst.mjs); closing the palms is no longer the skill gesture.

[Game rules](dist/core.mjs) grant both upgrades after waves 2, 4, 6 and 8. After the user rejected the first balance proposal, starting full-charge damage was reduced to 2.25 and [palm capacity](dist/palm-control.mjs) to five seconds. Four upgrades raise full-charge damage to 3, 3.6, 4.2 and the requested final value of 5; capacity now follows the later requested sequence of 5, 6, 8, 10 and 12 seconds. Each grant refills the pool and shows a five-second intermission card. The energy bar uses the upgraded capacity, and both gun meters show upgraded damage. Queen seals retain their existing protection. Restarting clears all upgrades.

Automated checks cover mirrored assignment with either model label, uncertain labels, detection-order changes, the swap button, and wrist movement across the centre. Clap sequences cover near contact, slower inference, overlap, unavailable rewards and false-trigger cases. Upgrade checks exercise all four rewards, both guns at partial/full charge, actual energy drain and recovery, pause, replay and the full ten-wave campaign. These are controlled inputs, not recognition-rate measurements. The final suite passes all 94 checks, including the revised starting energy and damage; module syntax and whitespace checks also pass.

Browser checks used a clearly labelled local fixture with simulated landmarks. The clap produced one area impact (90 points across three surviving targets), consumed the reward and left no console errors. The previous numeric upgrade card showed the earlier 1.67–5 damage range and 13-second capacity in both languages, before round 13 replaced that presentation and energy curve. A wave-two check returned automatically to wave three after the break, with the larger capacity retained. The [upgrade screenshot](docs/wave-upgrade.png) is synthetic input, not a player recording. The initial UI wait expired before the transition; the following visible state confirmed wave three. Real-camera mapping, clap comfort and the revised balance remain unverified by a new player session.

## Round 13 checks: visual upgrades and ordinary bullets

The [upgrade card](dist/index.html) now reuses the existing glove drawings and short bilingual labels. Numeric rank, damage and duration text are removed from the card. [Palm capacities](dist/palm-control.mjs) are explicit at each rank: 5, 6, 8, 10 and 12 seconds. README and in-game help match that sequence.

The [upgrade tests](tests/upgrades.test.mjs) check actual enemy health changes from both guns at zero, partial and full charge at all five ranks. Zero-charge damage increases through 0.75, 1, 1.2, 1.4 and 5/3; full charge ends at 5. The existing queen shield rule remains in force. Energy drain, refill, pause and restart checks pass with the revised capacities. All 94 automated tests, the app syntax check and whitespace check passed.

The initial browser connection timed out; restarting the temporary local preview outside the restricted sandbox and opening a fresh tab restored access. The browser then showed the gun and palm graphics with concise Chinese and English labels, with no numbers inside the upgrade card and no console errors. The [updated screenshot](docs/wave-upgrade.png) uses simulated input. This is a UI check, not a new real-camera playtest.

## Round 14 checks: fingertip contact and energy burst

Following [round 14 feedback](PLAYER_FEEDBACK.md#round-14--1-november-replace-clapping-with-fingertip-contact), the [detector](dist/burst.mjs) measures opposing index directions and tip proximity relative to palm size, corrected for camera aspect ratio. A visible approach into near contact or 120 milliseconds of steady near contact triggers once. The remaining fingers are not gated. Missing hands cannot trigger the effect, and separation releases the latch. This is an image-space approximation of contact, not a depth or physical-contact measurement.

The [hand placement](dist/burst-art.mjs) reuses the side-view glove paths and puts both index tips at the same point at the damage frame. The [renderer](dist/renderer.mjs) anchors the bright core, rays and expanding rings there. The [SVG generator](scripts/sync-burst-icon.mjs) reuses those gloves for the lower prompt. English and Chinese instructions now describe fingertip contact. The previous clap modules and icon were removed.

All 94 automated tests passed. The [gesture tests](tests/burst.test.mjs) cover contact, steady near-touch, separation/rearming, detection order, tilt, scale, aspect ratio, folded fingers, parallel fingers, palm contact and missing hands. They also preserve reward expiry, pause and one-hit damage checks. [Art checks](tests/hand-art.test.mjs) verify exact tip alignment at desktop and narrow viewport sizes. App and renderer syntax checks passed.

In the browser, a labelled synthetic camera sequence produced one area impact worth 90 points across three surviving targets and consumed the reward, with no console errors. The [captured contact frame](docs/fingertip-burst.png) shows both tips meeting at the energy core. The prompt uses the new glove icon. These checks establish controlled behavior and rendering, not successful real-camera recognition; no new player retest has been reported.

## Round 15 checks: fingertip burst progression

The [burst damage curve](dist/burst.mjs) now starts at 1.5 and rises by 0.25 at each existing wave upgrade, ending at the former 2.5 damage. [Game rules](dist/core.mjs) use this rank-specific value at the contact frame. The reward window, gesture, knockback and animation retain their previous behavior. README and bilingual help describe the growing damage.

All 95 automated checks passed. The [upgrade test](tests/upgrades.test.mjs) advances through all four wave rewards and checks actual health loss across three targets at every rank, one impact per use, maximum-level queen protection and reset to the initial strength. The earlier burst test now verifies that a full-health 1.6-health enemy survives the initial 1.5-damage burst. This balance-only revision did not require a new browser visual check; its play balance awaits further user feedback.

## 中文简要对照

项目从手势魔法改为第一人称双指枪，核心是“抬指输入—命中植物—声音、血条与击退反馈”。我让另一位人在未听讲解前试玩，也持续自己试玩并记录问题。反馈推动了宽松识别、自动瞄准、音效、白手套、波次、女王以及拍手技能的调整。

过程并非每次修改都成功：左右手仍出现过混淆，爆燃过强，女王与小怪同时进攻太难，拍掌在真实使用中也曾无效。最新改动按作者要求将拍掌替换为两手食指相对碰触，下方手套在指尖相碰时释放能量波，保留 20 连击后的 8 秒限时机会。自动检查通过，真实摄像头体验仍待复测。

Codex 协助代码、美术路径、测试和材料；保留了鼠标替代输入，拒绝了不合适的 AI 花园图，并根据测试不断改动早期方案。自动测试和模拟输入记录放在此处，不混入玩家反馈表的效果栏。
