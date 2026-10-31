# Credits

- **方向与反馈：** 用户提出第一人称双指枪、抬指射击、自动锁定必中、蓄力伤害、中英文界面、变异植物敌人和复古漫画美术方向。
- **美术参考：** 用户提供的《茶杯头》（Cuphead，Studio MDHR）截图与 1930 年代美式橡皮管动画。本项目未复制其截图、角色、音乐或素材；所有花园、植物、手套、图标与粒子均由本项目 Canvas / SVG 代码绘制。
- **AI 协助：** OpenAI Codex 协助规则设计、编程、原创程序化图形、测试及文档。见 PROCESS.md。
- **识别库：** Google MediaPipe Tasks Vision 0.10.14，[官方仓库](https://github.com/google-ai-edge/mediapipe)，[Apache License 2.0](https://github.com/google-ai-edge/mediapipe/blob/master/LICENSE)。
- **预训练模型：** Google Gesture Recognizer，float16 / version 1；[模型说明](https://ai.google.dev/edge/mediapipe/solutions/vision/gesture_recognizer)。本项目没有训练模型。
- **实现参考：** [Google Web Gesture Recognizer 文档](https://ai.google.dev/edge/mediapipe/solutions/vision/gesture_recognizer/web_js) 用于双手配置、handedness、21 个关键点及 worker 推理。指枪抬指检测和游戏规则为项目代码。
- **模型分发：** jsDelivr 与 Google Cloud Storage。视频帧不发送给这些服务。
- **三维识别参考：** [MediaPipe 手部关键点说明](https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker/web_js)，用于区分图像归一化坐标和以米为单位的世界坐标、修正宽高比并处理指尖朝镜头的透视缩短。
- **字体与声音：** 本机系统字体，无远程字体。音效由 Web Audio 合成，无外部录音。
- **测试：** Node.js 内置测试运行器；Codex 浏览器工具用于页面验证。无需作为游戏运行依赖安装。
- **课程样例：** 未提供或复制课程示例代码。
- **手势造型参考：** 用户提供的 PSYCHOFINGER 截图及 [B 站视频页面](https://www.bilibili.com/video/BV1vtpY6kETr/)。参考竖拇指、前伸食指及卷曲手指的轮廓关系，重新绘制复古白手套；未使用原作图片或动画资源。视频页面在工具中加载超时，动画为自行实现。

- **本轮直接参考：** [Studio MDHR 官方媒体截图](https://studiomdhr.com/press-kits/)（Cagney Carnation）与 [Caitlin Russell：Cuphead Backgrounds](https://caitrussell.com/ch-bgs.html)。仅用于分析背景与角色层次，未作为游戏运行资源。被拒绝的 imagegen 草稿未用于最终背景。
