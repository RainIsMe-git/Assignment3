// Keep the current Tasks Vision camera path's identity. Mirroring the preview
// in CSS changes screen coordinates, not ownership of a gun.
export const physicalHand=label=>label==='Left'?'left':label==='Right'?'right':null;
export const HAND_COLORS=Object.freeze({left:'#367f7d',right:'#bd513c'});
