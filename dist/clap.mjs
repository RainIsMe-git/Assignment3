// Track the approach across imperfect frames; contact need not show ten fingers.
export const CLAP_EVERY=20,CLAP_DAMAGE=2.5,CLAP_CONTACT=.28,CLAP_DURATION=.95,CLAP_WINDOW=8;
function measure(o){
 const p=o.landmarks,a=Math.max(.5,Math.min(2,o.aspectRatio||1)),world=o.worldLandmarks;
 const w=world?.length===21?world:p;
 const d=(i,j)=>Math.hypot(w[i].x-w[j].x,w[i].y-w[j].y,(w[i].z||0)-(w[j].z||0));
 const open=[5,9,13,17].filter(i=>d(i,i+3)/(d(i,i+1)+d(i+1,i+2)+d(i+2,i+3)+1e-6)>.6).length>=2;
 const center={x:(p[0].x+p[5].x+p[9].x+p[17].x)/4,y:(p[0].y+p[5].y+p[9].y+p[17].y)/4/a};
 const size=Math.max(.025,Math.hypot(p[0].x-p[9].x,(p[0].y-p[9].y)/a),Math.hypot(p[5].x-p[17].x,(p[5].y-p[17].y)/a));
 return {center,size,open};
}
export class ClapDetector {
 constructor(){this.reset();}
 reset(){this.armed=false;this.last=null;this.wide=0;this.cooldown=0;this.approachedAt=-Infinity;}
 fire(now){this.armed=false;this.cooldown=now+700;this.last=null;this.wide=0;return true;}
 update(observations,now){
  const info=(observations||[]).filter(o=>o.confidence>=.35&&o.landmarks?.length===21&&o.landmarks.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y))).slice(0,2).map(measure),p=this.last;
  if(info.length!==2){
   if(!p||now-p.time>350){this.armed=false;this.last=null;return false;}
   const merged=info.length===1&&this.armed&&p.ratio<2.5&&this.wide-p.distance>p.size*.65&&now-this.approachedAt<350&&p.aligned&&Math.hypot(info[0].center.x-p.mid.x,info[0].center.y-p.mid.y)<p.size*1.2;
   if(merged&&now>=this.cooldown)return this.fire(now);
   // Keep the approach briefly: the next usable frame can establish contact.
   return false;
  }
  const size=(info[0].size+info[1].size)/2,dx=info[0].center.x-info[1].center.x,dy=info[0].center.y-info[1].center.y;
  const distance=Math.hypot(dx,dy),ratio=distance/size,aligned=Math.abs(dy)<size*1.8;
  const continuous=p&&now>p.time&&now-p.time<=450;
  if(!continuous){this.armed=false;this.wide=distance;this.approachedAt=-Infinity;}
  if(continuous&&distance<p.distance-size*.08)this.approachedAt=now;
  if(info.every(h=>h.open)&&ratio>2.2&&aligned&&now>=this.cooldown){this.armed=true;this.wide=Math.max(this.wide,distance);}
  if(!info.every(h=>h.open)&&ratio>2.5)this.armed=false;
  const contact=this.armed&&aligned&&ratio<1.85&&this.wide-distance>size*.75&&now-this.approachedAt<350&&now>=this.cooldown;
  this.last={time:now,ratio,distance,size,aligned,mid:{x:(info[0].center.x+info[1].center.x)/2,y:(info[0].center.y+info[1].center.y)/2}};
  return contact?this.fire(now):false;
 }
}
