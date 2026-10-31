import {GunTrigger,readGunPose,TRACKING_GRACE_MS} from './core.mjs';
const sides=['left','right'];
// Video pixels are unmirrored; the selfie-trained model's label is reversed.
export const physicalHand=label=>label==='Right'?'left':label==='Left'?'right':null;
export class HandTracking {
  constructor(){this.slots=Object.fromEntries(sides.map(side=>[side,{trigger:new GunTrigger(),pose:null,anchor:null,lastValid:-Infinity,lastStrict:-Infinity,lastSeen:-Infinity,visible:false}]));}
  reset(){for(const slot of Object.values(this.slots)){slot.trigger.reset();slot.pose=null;slot.anchor=null;slot.lastSeen=slot.lastValid=slot.lastStrict=-Infinity;slot.visible=false;}}
  expire(now){for(const slot of Object.values(this.slots)){slot.visible=now-slot.lastValid<=TRACKING_GRACE_MS;if(!slot.visible)slot.trigger.miss(now);}}
  update(observations,now){
    const candidates=(observations||[]).filter(o=>o.confidence>=.4).map(o=>({pose:readGunPose(o.landmarks,o.worldLandmarks,o.aspectRatio),anchor:o.landmarks?.[0],side:o.confidence>=.75?physicalHand(o.handedness):null})).filter(o=>o.pose&&o.anchor).slice(0,2);
    // Preserve a nearby established identity even if a single label flickers.
    // For a new hand, anatomy wins over which half of the preview it occupies.
    const cost=(o,side)=>{const s=this.slots[side];return s.anchor&&now-s.lastSeen<600?Math.hypot(s.anchor.x-o.anchor.x,s.anchor.y-o.anchor.y):o.side?(o.side===side?.4:1.4):Math.abs((1-o.anchor.x)-(side==='left'?.25:.75));};
    const assigned={};
    if(candidates.length===2){const [a,b]=candidates,swap=cost(a,'right')+cost(b,'left')<cost(a,'left')+cost(b,'right');assigned.left=swap?b:a;assigned.right=swap?a:b;}
    else if(candidates.length){const a=candidates[0];assigned[cost(a,'left')<=cost(a,'right')?'left':'right']=a;}
    const shots=[];let valid=0;
    for(const side of sides){
      const slot=this.slots[side],o=assigned[side];
      if(o){slot.anchor=o.anchor;slot.lastSeen=now;}
      if(o?.pose.gun)slot.lastStrict=now;
      // Briefly tolerate an obscured/bent index. Other fingers never gate fire.
      if(o && (o.pose.gun || (o.pose.relaxedGun && now-slot.lastStrict<=TRACKING_GRACE_MS))){
        const previous=slot.pose;
        const lift=previous&&previous.source===o.pose.source&&now-slot.lastValid<220?previous.lift*.2+o.pose.lift*.8:o.pose.lift;
        slot.pose={...o.pose,lift,gun:true};slot.lastValid=now;valid++;
        // Do not smooth away a one-frame flick; smoothing is presentation only.
        const shot=slot.trigger.sample({...slot.pose,lift:o.pose.lift},now);if(shot)shots.push({hand:side,...shot});
      }else slot.trigger.miss(now);
    }
    this.expire(now);return {shots,valid};
  }
}
