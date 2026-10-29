# 当前改版：Garden Gunners · 指尖双枪（2026-10-30）

用户反馈原来的手势魔法体验不佳，明确要求改成指枪、抬指射击、双手双枪、轻松瞄准、第一人称小手方向反馈，以及参考《茶杯头》的美式复古漫画风。

本次设计改变：

1. 去掉张掌蓄力和握拳释放，改成基于手部关键点的相对抬指动作。左右手各有独立触发状态，放回原位才能再次发射。
2. 用宽范围辅助瞄准和抬指前的位置锁定降低精确瞄准负担；每只手用不同颜色的小手图标和连线说明目标。
3. 浮动水晶改成持续迎面逼近的三种植物：花朵、蘑菇和较耐打的仙人掌。加入击退、生命、5 波 / 75 秒保卫战、胜负与再来一局。
4. 重绘全部界面与场景：旧纸色、粗墨线、原创植物怪、橡皮管四肢、白手套和漫画爆字。参考图仅用作美术方向，没有拷贝素材。
5. 保留不扣血练习、无需摄像头的鼠标 / 键盘试玩、加载取消、超时错误、失去识别暂停和退出释放摄像头。

新版技术验证：16 项 Node 自动测试通过，覆盖相对位移、双手独立开火、持续抬起不连发、回落重装定、基线清除、宽容命中、击退、伤害、暂停和结算。浏览器确认左右键、空格双枪、命中得分、保卫战入口、暂停冻结及指南暂停。真实双手摄像头还未进行人体实测；不要把自动或合成测试写成用户试玩。

AI 使用：Codex 完成代码重构、Canvas 美术和测试。保留了原提案中的自由练习与鼠标替代输入；按用户反馈否定了“张掌蓄力 / 握拳施法”的原交互，转为无需蓄力的双指枪。

以下保留原版开发记录，描述的是历史版本；原版测试结果不代表新版摄像头已获验证。

---
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

The project was subsequently merged into the student's newly created `Assignment3` repository on `main`. Both its initial commit and the original game development commits were retained. The source and documentation are at the repository root. A portable double-click `.cmd` entry point is tracked; computer-specific `.lnk` shortcuts are ignored. Launcher checks confirmed that the migrated files serve successfully, launching twice reuses the existing game, and a port occupied by another application is skipped. The original six game-rule tests also pass in the destination repository.

## Hosting status

A private Sites project was registered. Its publication did not complete: the initial short-lived credential expired during development, and the credential-renewal connector then returned an HTTP transport failure. No hosted game is claimed.

After the student selected their `RainIsMe-git` account, a public [Assignment3 repository](https://github.com/RainIsMe-git/Assignment3) was created for the source and its retained history on `main`. This provides the source repository required by the brief; the remaining real user trial and Canvas submission are separate steps.

## Before submission

- Complete and document the genuine user trial above.
- Test the physical webcam, sound toggle, practice, challenge, pause, recovery, and camera shutdown.
- Follow `README.md` from a fresh terminal.
- Review the AI disclosure and source credits.
- Keep the source and development commits updated on the public GitHub repository's `main` branch.
- Verify the repository while signed out, then submit its URL to Canvas.


新版补充检查（2026-10-30）：内嵌浏览器等待摄像头授权超时后，正确显示错误并可切换鼠标模式继续命中目标；390px 布局无水平溢出，修正了窄屏宣传标语与标题重叠。未开启真实摄像头，也未验证真人双手识别成功率。
浏览器补充验证：不射击的保卫战中植物持续逼近并扣除五点生命，正确进入失败结算；结算按钮可重新开始并重置生命和计时。

## 第二轮反馈：手势、图示与美术参考

用户纠正：指枪必须伸出拇指和食指，也允许中指一起伸出；其余指头收起。识别器现明确检查拇指伸展与分离、无名指/小指弯曲，并区分 two/three 两种姿势。姿势切换会重新建立触发基线，不会因此误射。新增测试覆盖两种形状、折拇指拒绝、错误伸指、镜像/旋转/缩放、形状切换；共 20 项测试通过。

用户认为第一张生成的水彩花园“AI 味太重”。该尝试使用内置 imagegen，采用 1930s watercolor garden clearing 的宽画幅提示；结果过于写实、密集且含不合适的风景细节，被明确拒绝。该图已移出 dist，仅留在忽略的本地草稿目录，游戏不引用它。随后检索并查看 Studio MDHR 官方 Cagney Carnation 截图，并阅读背景画师 Caitlin Russell 的多层背景说明。修订方向为低对比柔和背景、鲜明动画角色、墨线轮廓、轻度色彩/纸纹/胶片处理，避免把增加细节当成提升风格。最终新增 backdrop.mjs 程序化分层绘画，不把游戏截图作为素材。

UI 移除段落式首页介绍、底部三栏说明和常驻提示，改为两种指枪 SVG、抬指动态图示、图标按钮、简洁生命/分数 HUD；解释与键盘说明置于问号弹窗。两个姿势的 SVG 和实时手套采用同样的“拇指分离，食指前伸”轮廓。滤镜有独立按钮，可关闭。

验证：鼠标命中计分、空格双枪、帮助暂停/继续、滤镜按钮与状态通过浏览器检查；未发现页面错误。宽屏及窄屏布局已查看。真实双手摄像头的姿势舒适度和准确率尚未实测；这些不算真人用户试验。

## 第三轮反馈：手套姿势与方向可读性

用户指出手指姿势别扭且无法判断朝向。重画侧面指枪：前伸的圆头食指、竖起的拇指、逐层握回的指节、白色手套与短袖口。新增 hand-art.mjs 作为实时 Canvas 手套及说明 SVG 的共同图形来源，保留两种允许的手势。

大手随瞄准位置轻移，小手沿同一朝向放在落点标记后方；青色/珊瑚色区分双枪，细引导线连接指尖与落点。弹道从实际指尖出发，沿食指方向飞出后柔和转向辅助命中的植物；指尖增加短促枪焰。边缘瞄准时移动手腕位置，减少翻转和裁切。

验证：21 项自动测试通过，新增几何检查覆盖左右镜像、宽窄屏幕、四角瞄准及后坐位移下的指尖/发射起点一致性。浏览器检查两种手势说明、左/右射击、计分、桌面与 390px 布局；无横向溢出。未进行真人摄像头测试。用户随后明确要求将完成版本推送至 main，使用既有 RainIsMe-git 账号和仓库。
