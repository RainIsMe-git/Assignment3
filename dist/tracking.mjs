import {GunTrigger,readGunPose,TRACKING_GRACE_MS} from './core.mjs';
import {physicalHand} from './hand-identity.mjs';
import {ClapDetector} from './clap.mjs';
import {readStopPose} from './palm-control.mjs';
export {physicalHand} from './hand-identity.mjs';
const sides=['left','right'];
export class HandTracking {
  constructor(){this.swapHands=false;this.clapDetector=new ClapDetector();this.slots=Object.fromEntries(sides.map(side=>[side,{trigger:new GunTrigger(),pose:null,anchor:null,lastValid:-Infinity,lastStrict:-Infinity,lastSeen:-Infinity,visible:false,stopSince:null,stopping:false}]));}
  sideFor(label){const side=physicalHand(label);return side&&this.swapHands?(side==='left'?'right':'left'):side;}
  reset(){this.clapDetector.reset();for(const slot of Object.values(this.slots)){slot.trigger.reset();slot.pose=null;slot.anchor=null;slot.lastSeen=slot.lastValid=slot.lastStrict=-Infinity;slot.visible=false;slot.stopSince=null;slot.stopping=false;}}
  expire(now){for(const slot of Object.values(this.slots)){slot.visible=now-slot.lastValid<=TRACKING_GRACE_MS;if(now-slot.lastSeen>150){slot.stopping=false;slot.stopSince=null;}if(!slot.visible)slot.trigger.miss(now);}}
  update(observations,now){
    const clap=this.clapDetector.update(observations,now);
    const candidates=(observations||[]).filter(o=>o.confidence>=.4).map(o=>({observation:o,pose:readGunPose(o.landmarks,o.worldLandmarks,o.aspectRatio),stop:readStopPose(o.landmarks,o.worldLandmarks,o.aspectRatio),anchor:o.landmarks?.[0],side:o.confidence>=.75?this.sideFor(o.handedness):null})).filter(o=>o.pose&&o.anchor).slice(0,2);
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
      if(o?.stop){
        slot.stopSince??=now;slot.stopping=now-slot.stopSince>=120;slot.trigger.reset();
        slot.pose={...o.pose,stop:true};slot.lastValid=now;valid++;continue;
      }
      if(slot.stopSince!==null){slot.trigger.reset();slot.stopSince=null;slot.stopping=false;}
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
    const preview=sides.filter(side=>assigned[side]).map(side=>({...assigned[side].observation,side}));
    this.expire(now);return {shots:clap?[]:shots,valid,preview,clap};
  }
}
