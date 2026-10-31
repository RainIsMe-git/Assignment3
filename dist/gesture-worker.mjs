// Classic worker: MediaPipe 0.10.14's WASM loader uses importScripts.
// The library itself is imported dynamically, so no global bundle is needed.
// Inference runs off the rendering thread. Frames are not uploaded.
(async () => {
let recognizer;
try {
  const { FilesetResolver, GestureRecognizer } = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs');
  const files = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm');
  recognizer = await GestureRecognizer.createFromOptions(files, {
    baseOptions: {
      modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
      delegate: 'CPU'
    },
    runningMode: 'VIDEO',
    numHands: 2,
    minHandDetectionConfidence: 0.45,
    minHandPresenceConfidence: 0.45,
    minTrackingConfidence: 0.45
  });
  self.postMessage({ type: 'ready' });
} catch (error) {
  console.error('Gesture model initialization failed:', error?.message || error);
  self.postMessage({ type: 'error', message: 'modelLoadFailed' });
}

self.onmessage = event => {
  const { frame, timestamp } = event.data;
  if (!frame) return;
  try {
    if (!recognizer) throw new Error('Model unavailable');
    const result = recognizer.recognizeForVideo(frame, timestamp);
    self.postMessage({ type: 'result', hands: result.landmarks.map((landmarks, i) => ({
      landmarks,
      worldLandmarks: result.worldLandmarks?.[i],
      aspectRatio: frame.width / frame.height,
      handedness: result.handedness[i]?.[0]?.categoryName || '',
      confidence: result.handedness[i]?.[0]?.score || 0
    })) });
  } catch (error) {
    self.postMessage({ type: 'error', message: 'trackingStopped' });
  } finally { frame.close(); }
};
})();
