export const MAX_ENERGY=10, ENERGY_REGEN=1, DOUBLE_DRAIN=1.6;
export function cameraStatusKey({valid,visible,palms,active,energy}){
  if(palms){
    if(energy<=0)return palms===2?'cameraPalmsEmpty':'cameraPalmEmpty';
    if(active===2)return 'cameraPush';
    if(active===1)return valid===2?'cameraMixed':'cameraFreeze';
    return 'cameraPalmReady';
  }
  return valid===2?'cameraDual':valid===1?'cameraSingle':visible?'cameraRecover':'cameraMissing';
}
export function readStopPose(points,world,aspect=1){
  if(!points||points.length!==21)return false;
  const valid=p=>p?.length===21&&p.every(v=>Number.isFinite(v.x)&&Number.isFinite(v.y)&&Number.isFinite(v.z??0));
  const p=valid(world)?world:valid(points)?points.map(v=>({x:v.x,y:v.y/Math.max(.5,Math.min(2,aspect)),z:v.z||0})):null;
  if(!p)return false;
  const d=(a,b)=>Math.hypot(p[a].x-p[b].x,p[a].y-p[b].y,(p[a].z||0)-(p[b].z||0));
  const size=Math.max(d(0,9),d(5,17));if(size<.0001)return false;
  // Four long, open fingers and a broad, front-facing palm. Thumb is relaxed.
  if(![5,9,13,17].every(i=>d(i,i+3)/size>.65&&d(i,i+3)/(d(i,i+1)+d(i+1,i+2)+d(i+2,i+3)+.00001)>.75))return false;
  const a={x:p[5].x-p[0].x,y:p[5].y-p[0].y,z:(p[5].z||0)-(p[0].z||0)},b={x:p[17].x-p[0].x,y:p[17].y-p[0].y,z:(p[17].z||0)-(p[0].z||0)};
  const n={x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x};
  return Math.abs(n.z)/Math.max(.00001,Math.hypot(n.x,n.y,n.z))>.55;
}
export class PalmEnergy {
  constructor(){this.reset();}
  reset(){this.energy=MAX_ENERGY;this.hands={left:false,right:false};this.active=0;this.strength=0;}
  setHands(hands={}){this.hands={left:!!hands.left,right:!!hands.right};if(!this.hands.left&&!this.hands.right){this.active=0;this.strength=0;}}
  update(dt){
    const count=Number(this.hands.left)+Number(this.hands.right);this.active=0;this.strength=0;
    if(!count){this.energy=Math.min(MAX_ENERGY,this.energy+dt*ENERGY_REGEN);return;}
    if(dt<=0||this.energy<=.000001)return;
    const needed=dt*(count===2?DOUBLE_DRAIN:1),spent=Math.min(needed,this.energy);
    this.energy=Math.max(0,this.energy-spent);if(this.energy<.000001)this.energy=0;
    this.active=count;this.strength=spent/needed;
  }
}
