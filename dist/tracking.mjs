import {GunTrigger,readGunPose,TRACKING_GRACE_MS} from './core.mjs';
const sides=['left','right'];
export class HandTracking {
  constructor(){this.slots=Object.fromEntries(sides.map(side=>[side,{trigger:new GunTrigger(),pose:null,anchor:null,lastValid:-Infinity,lastStrict:-Infinity,lastSeen:-Infinity,visible:false}]));}
  reset(){for(const slot of Object.values(this.slots)){slot.trigger.reset();slot.pose=null;slot.anchor=null;slot.lastSeen=slot.lastValid=slot.lastStrict=-Infinity;slot.visible=false;}}
  expire(now){for(const slot of Object.values(this.slots)){slot.visible=now-slot.lastValid<=TRACKING_GRACE_MS;if(!slot.visible)slot.trigger.miss(now);}}
  update(observations,now){
    const candidates=(observations||[]).filter(o=>o.confidence>=.4).map(o=>({pose:readGunPose(o.landmarks,o.worldLandmarks,o.aspectRatio),anchor:o.landmarks?.[0]})).filter(o=>o.pose&&o.anchor).slice(0,2);
    const cost=(o,side)=>{const s=this.slots[side];return s.anchor&&now-s.lastSeen<1200?Math.hypot(s.anchor.x-o.anchor.x,s.anchor.y-o.anchor.y):Math.abs((1-o.anchor.x)-(side==='left'?.25:.75));};
    const assigned={};
    if(candidates.length===2){const [a,b]=candidates,swap=cost(a,'right')+cost(b,'left')<cost(a,'left')+cost(b,'right');assigned.left=swap?b:a;assigned.right=swap?a:b;}
    else if(candidates.length){const a=candidates[0];assigned[cost(a,'left')<=cost(a,'right')?'left':'right']=a;}
    const shots=[];let valid=0;
    for(const side of sides){
      const slot=this.slots[side],o=assigned[side];
      if(o){slot.anchor=o.anchor;slot.lastSeen=now;}
      if(o?.pose.gun)slot.lastStrict=now;
      // Hysteresis keeps slightly bent fingers valid briefly after a clear gun.
      // A new hand still requires the strict pose, and an open palm is rejected.
      if(o && (o.pose.gun || (o.pose.relaxedGun && now-slot.lastStrict<=TRACKING_GRACE_MS))){
        slot.pose={...o.pose,gun:true};slot.lastValid=now;valid++;
        const shot=slot.trigger.sample(slot.pose,now);if(shot)shots.push({hand:side,...shot});
      }else slot.trigger.miss(now);
    }
    this.expire(now);return {shots,valid};
  }
}
