// The reward is a fingertip touch, not a palm clap. Distances use image-width
// units; independent world-landmark origins cannot measure two-hand contact.
export const BURST_EVERY=20,BURST_CONTACT=.28,BURST_DURATION=.95,BURST_WINDOW=8;
export const BURST_DAMAGE_BY_LEVEL=Object.freeze([1.5,1.75,2,2.25,2.5]);
function measure(o){
 const aspect=Math.max(.5,Math.min(2,o.aspectRatio||1));
 const p=o.landmarks.map(p=>({x:p.x,y:p.y/aspect}));
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 const size=Math.max(.025,distance(p[0],p[9]),distance(p[5],p[17]));
 const length=distance(p[5],p[8]),chain=distance(p[5],p[6])+distance(p[6],p[7])+distance(p[7],p[8]);
 return {tip:p[8],base:p[5],size,extended:length>size*.35&&length/Math.max(.00001,chain)>.55,
   direction:{x:(p[8].x-p[5].x)/Math.max(.00001,length),y:(p[8].y-p[5].y)/Math.max(.00001,length)}};
}
export class BurstDetector {
 constructor(){this.reset();}
 reset(){this.last=null;this.contactSince=null;this.releaseSince=null;this.latched=false;}
 update(observations,now){
  const hands=(observations||[]).filter(o=>o.confidence>=.35&&o.landmarks?.length===21&&o.landmarks.every(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y))).slice(0,2).map(measure);
  if(hands.length!==2){
   // A brief dropout can preserve history, but a missing hand cannot trigger.
   if(!this.last||now-this.last.time>180)this.contactSince=null;
   this.releaseSince=null;return false;
  }
  const [a,b]=hands,size=(a.size+b.size)/2,distance=Math.hypot(a.tip.x-b.tip.x,a.tip.y-b.tip.y);
  const dx=b.base.x-a.base.x,dy=b.base.y-a.base.y,span=Math.hypot(dx,dy);
  const towardA=(a.direction.x*dx+a.direction.y*dy)/Math.max(.00001,span);
  const towardB=-(b.direction.x*dx+b.direction.y*dy)/Math.max(.00001,span);
  const opposed=a.direction.x*b.direction.x+a.direction.y*b.direction.y<-.15;
  const facing=a.extended&&b.extended&&towardA>.35&&towardB>.35&&opposed&&span>size*.7;
  const threshold=Math.max(.025,Math.min(.07,size*.65)),close=facing&&distance<=threshold;
  const previous=this.last,continuous=previous&&now>previous.time&&now-previous.time<=650;
  if(!continuous||now-previous.time>180)this.contactSince=null;
  this.last={time:now,distance,size,facing};
  if(this.latched){
   if(distance>threshold*1.7){this.releaseSince??=now;if(now-this.releaseSince>=120){this.latched=false;this.releaseSince=null;}}
   else this.releaseSince=null;
   return false;
  }
  if(!close){this.contactSince=null;return false;}
  this.contactSince??=now;
  const approached=continuous&&previous.facing&&previous.distance>threshold*1.25&&previous.distance-distance>size*.15;
  if(approached||now-this.contactSince>=120){this.latched=true;this.contactSince=null;return true;}
  return false;
 }
}
