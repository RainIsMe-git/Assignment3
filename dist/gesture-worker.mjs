// Inference runs off the rendering thread. Frames are not uploaded.
import { FilesetResolver, GestureRecognizer } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs';

let recognizer;
try {
  const files = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm');
  recognizer = await GestureRecognizer.createFromOptions(files, {
    baseOptions: {
      modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
      delegate: 'CPU'
    },
    runningMode: 'VIDEO',
    numHands: 1,
    minHandDetectionConfidence: 0.6,
    minHandPresenceConfidence: 0.6,
    minTrackingConfidence: 0.6
  });
  self.postMessage({ type: 'ready' });
} catch (error) {
  console.error('Gesture model initialization failed:', error?.message || error);
  self.postMessage({ type: 'error', message: '无法加载手势识别模型，请检查网络后重试。' });
}

self.onmessage = event => {
  const { frame, timestamp } = event.data;
  if (!frame) return;
  try {
    if (!recognizer) throw new Error('Model unavailable');
    const result = recognizer.recognizeForVideo(frame, timestamp);
    self.postMessage({ type: 'result', landmarks: result.landmarks[0] || [], gesture: result.gestures[0]?.[0]?.categoryName || 'None', confidence: result.gestures[0]?.[0]?.score || 0 });
  } catch (error) {
    self.postMessage({ type: 'error', message: '手势识别已中断。请重新连接摄像头，或使用鼠标模式。' });
  } finally { frame.close(); }
};
