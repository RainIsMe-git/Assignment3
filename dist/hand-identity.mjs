// Inference x is unmirrored; both video and landmarks are mirrored in CSS.
// Assign controls from that visible position, never the model's anatomy label.
export const previewX=rawX=>1-rawX;
export const screenHand=rawX=>previewX(rawX)<.5?'left':'right';
export const HAND_COLORS=Object.freeze({left:'#367f7d',right:'#bd513c'});
