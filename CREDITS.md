# Credits

- **方向与反馈：** 用户提出第一人称双指枪、抬指射击、自动锁定必中、蓄力伤害、中英文界面、变异植物敌人和复古漫画美术方向。
- **美术参考：** 用户提供的《茶杯头》（Cuphead，Studio MDHR）截图与 1930 年代美式橡皮管动画。本项目未复制其截图、角色、音乐或素材；所有花园、植物、手套、图标与粒子均由本项目 Canvas / SVG 代码绘制。
- **AI 协助：** OpenAI Codex 协助规则设计、编程、原创程序化图形、测试及文档。见 PROCESS.md。
- **识别库：** Google MediaPipe Tasks Vision 0.10.14，[官方仓库](https://github.com/google-ai-edge/mediapipe)，[Apache License 2.0](https://github.com/google-ai-edge/mediapipe/blob/master/LICENSE)。
- **预训练模型：** Google Gesture Recognizer，float16 / version 1；[模型说明](https://ai.google.dev/edge/mediapipe/solutions/vision/gesture_recognizer)。本项目没有训练模型。
- **实现参考：** [Google Web Gesture Recognizer 文档](https://ai.google.dev/edge/mediapipe/solutions/vision/gesture_recognizer/web_js) 用于双手配置、handedness、21 个关键点及 worker 推理。指枪抬指检测和游戏规则为项目代码。
- **模型分发：** jsDelivr 与 Google Cloud Storage。视频帧不发送给这些服务。
- **三维识别参考：** [MediaPipe 手部关键点说明](https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker/web_js)，用于区分图像归一化坐标和以米为单位的世界坐标、修正宽高比并处理指尖朝镜头的透视缩短。
- **左右手映射修订：** 上一轮参考了 [旧版 MediaPipe Hands 文档](https://github.com/google-ai-edge/mediapipe/blob/master/docs/solutions/hands.md) 的镜像标签说明并额外交换左右；玩家截图反馈表明该假设不适用于本项目当前 Tasks Vision 输入路径。本轮撤销额外交换，预览和开枪共用最终跟踪身份，并以连续位置匹配降低标签偶发翻转的影响。合成检查只验证程序对应关系，实际摄像头仍待玩家复测。
- **字体：** 本机系统字体，无远程字体。
- **张掌参考：** 用户本轮提供的简洁张手轮廓和卡通白手套图；按要求改为手背朝玩家、拇指向内的左右手。图形为共享 Canvas / SVG 路径，没有将参考截图打包为贴图。
- **背景音乐：** 用户提供的 `ES_Well I Just Don't Care - Stationary Sign.wav`（Stationary Sign / Epidemic Sound），转换为 `garden-jazz.mp3`，保留完整曲目并处理两端淡入淡出。
- **射击录音：** 用户提供的 Epidemic Sound 文件：`ES_Lasers, Gun, Fire, Shoot, Discharge, Singular`、`ES_Lasers, Gun, Plasma Blaster, Shoot, Fire, Single Rounds, Dull`、`ES_Lasers, Gun, Fire, Shoot, Powerful, Exhaust, Steam, Scifi, Variations`（原文件均为 `.wav`，后缀为 ` - Epidemic Sound`）。分别截取为轻、中、重枪声；蓄力循环从 Powerful 录音中截取、倒放并滤波，随蓄力改变音高与音量。来源署名不代表授予这些第三方录音新的许可。
- **音频加工：** FFmpeg / libmp3lame；加工脚本在 `scripts/prepare-audio.py`。浏览器使用 Web Audio 播放，并合成满蓄力双音提示和短促受击声。
- **测试：** Node.js 内置测试运行器；Codex 浏览器工具用于页面验证。无需作为游戏运行依赖安装。
- **课程样例：** 未提供或复制课程示例代码。
- **手势造型参考：** 用户提供的 PSYCHOFINGER 截图及 [B 站视频页面](https://www.bilibili.com/video/BV1vtpY6kETr/)。最终手部按截图下方双手的轮廓比例重绘：宽掌、厚拇指、斜向食指和连续卷指，改为奶油白手套与复古袖口。此造型基于该参考，不声称是完全独立设计；未将原截图或动画文件打包为贴图。视频页面在工具中加载超时，后坐与回落动画为项目实现。

- **本轮直接参考：** [Studio MDHR 官方媒体截图](https://studiomdhr.com/press-kits/)（Cagney Carnation）与 [Caitlin Russell：Cuphead Backgrounds](https://caitrussell.com/ch-bgs.html)。仅用于分析背景与角色层次，未作为游戏运行资源。被拒绝的 imagegen 草稿未用于最终背景。

- 拍手技能手套：参考用户提供的双手相对拍掌示意图确定视角，运行素材为 `dist/clap-art.mjs` 中重新绘制的白手套路径；合拢、接触与收回通过 Canvas 变换播放，未把参考截图作为贴图。
