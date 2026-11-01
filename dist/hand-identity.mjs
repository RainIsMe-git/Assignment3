// Inference receives the unmirrored camera frame; the preview is mirrored only
// in CSS. Convert the model label once, before preview and gun assignment.
export const physicalHand=label=>label==='Left'?'right':label==='Right'?'left':null;
export const HAND_COLORS=Object.freeze({left:'#367f7d',right:'#bd513c'});
