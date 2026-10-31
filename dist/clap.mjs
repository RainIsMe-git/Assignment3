// A clap is an open-hand approach, never a static overlap or detector re-entry.
export const CLAP_EVERY=20,CLAP_DAMAGE=2.5,CLAP_CONTACT=.28,CLAP_DURATION=.95;
export class ClapDetector {
 constructor(){this.reset();}
 reset(){this.armed=false;this.last=null;this.peak=0;this.cooldown=0;}
 update(observations,now){
  const hands=(observations||[]).filter(o=>o.confidence>=.4&&o.landmarks?.length===21).slice(0,2);
  if(hands.length!==2){
   const p=this.last;
   // Hands often merge in the final few centimetres; tolerate only a recent,
   // already fast and near-contact approach. No event after a long dropout.
   const merged=hands.length===1&&this.armed&&p&&now-p.time<120&&p.ratio<1.65&&p.velocity< -3&&p.aligned;
   this.armed=false;this.last=null;if(merged&&now>=this.cooldown){this.cooldown=now+700;return true;}return false;
  }
  const info=hands.map(o=>{
   const p=o.landmarks,w=o.worldLandmarks?.length===21?o.worldLandmarks:p;
   const d=(a,b)=>Math.hypot(w[a].x-w[b].x,w[a].y-w[b].y,(w[a].z||0)-(w[b].z||0));
   const open=[5,9,13,17].filter(i=>d(i,i+3)/(d(i,i+1)+d(i+1,i+2)+d(i+2,i+3)+1e-6)>.7).length>=3;
   const center={x:(p[0].x+p[5].x+p[9].x+p[17].x)/4,y:(p[0].y+p[5].y+p[9].y+p[17].y)/4};
   return {open,center,size:Math.max(.025,Math.hypot(p[0].x-p[9].x,p[0].y-p[9].y),Math.hypot(p[5].x-p[17].x,p[5].y-p[17].y))};
  });
  const size=(info[0].size+info[1].size)/2,dx=info[0].center.x-info[1].center.x,dy=info[0].center.y-info[1].center.y;
  const ratio=Math.hypot(dx,dy)/size,aligned=Math.abs(dy)<size*1.1,p=this.last,dt=p?(now-p.time)/1000:0;
  if(!p||dt>.2||dt<=0){this.armed=false;this.peak=ratio;}
  const velocity=p&&dt>0&&dt<=.2?(ratio-p.ratio)/dt:0;
  if(info.every(h=>h.open)&&ratio>2.1&&aligned&&now>=this.cooldown){this.armed=true;this.peak=Math.max(this.peak,ratio);}
  if(!info.every(h=>h.open)&&ratio>1.65)this.armed=false;
  const fired=this.armed&&aligned&&ratio<1.3&&this.peak-ratio>.9&&velocity<-.5&&now>=this.cooldown;
  this.last={time:now,ratio,velocity,aligned};
  if(fired){this.armed=false;this.cooldown=now+700;this.peak=0;}return fired;
 }
}
