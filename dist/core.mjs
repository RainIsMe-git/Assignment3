// Pure rules shared by the camera, mouse demo and automated tests.
export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y,(a.z||0)-(b.z||0));

export function readGunPose(points, worldPoints, aspectRatio=1) {
  if (!points || points.length !== 21 || points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y))) return null;
  const valid3D=worldPoints?.length===21 && worldPoints.every(p=>[p.x,p.y,p.z].every(Number.isFinite));
  // World coordinates share one metric scale. Image x/z use image width,
  // whereas image y uses height: correct that mismatch in the fallback.
  const metric=valid3D?worldPoints:points.map(p=>({x:p.x,y:p.y/Math.max(.5,Math.min(2,aspectRatio)),z:p.z||0}));
  const palmSize=Math.max(distance(metric[0],metric[9]),distance(metric[5],metric[17])*1.05);
  if(palmSize<.0001)return null;
  const chain=(a,b,c,d)=>distance(metric[a],metric[d])/(distance(metric[a],metric[b])+distance(metric[b],metric[c])+distance(metric[c],metric[d])+palmSize*.0001);
  const reach=(a,d)=>distance(metric[a],metric[d])/palmSize;
  // Only the index gates input. Thumb/ring/pinky placement no longer rejects
  // a tracked hand: the deliberate upward motion is the firing gesture.
  const indexReach=reach(5,8), indexStraight=chain(5,6,7,8);
  const gun=indexReach>.28 && indexStraight>.50;
  const relaxedGun=indexReach>.23 && indexStraight>.40;
  const towardCamera=(metric[5].z-metric[8].z)/palmSize;
  const spatial=valid3D||towardCamera>.35;
  const imageScale=Math.max(distance(points[0],points[9]),.025);
  return {gun,relaxedGun,source:valid3D?'world':spatial?'depth':'image',
    lift:spatial?(metric[5].y-metric[8].y)/Math.max(distance(metric[5],metric[8]),palmSize*.3)*1.25:(points[5].y-points[8].y)/imageScale,
    aim:{x:clamp(1-points[0].x,.06,.94),y:clamp(points[0].y,.22,.78)}};
}

// Relative upward flick, not an absolute pose. Translating the entire hand
// leaves lift unchanged. Holding the raised finger never creates extra shots.
export const CHARGE_MS=2000, TRACKING_GRACE_MS=750;
export const chargeDamage=charge=>1+Math.floor(clamp(charge)*2+.000001);
export class GunTrigger {
  constructor(){this.reset();}
  reset(){this.base=null;this.since=0;this.last=null;this.ready=false;this.latched=false;this.peak=0;this.cooldownUntil=0;this.source=null;this.chargeMs=0;this.interrupted=false;}
  get charge(){return clamp(this.chargeMs/CHARGE_MS);}
  miss(time){
    this.interrupted=true;
    if(this.last!==null && time-this.last>TRACKING_GRACE_MS)this.reset();
  }
  sample(pose,time){
    if(!pose?.gun){this.miss(time);return null;}
    const gap=this.last===null?0:time-this.last;
    if(gap>TRACKING_GRACE_MS)this.reset();
    const source=pose.source||'image';
    const reacquired=this.interrupted||gap>220||(this.source&&this.source!==source);
    this.interrupted=false;this.source=source;this.last=time;
    if(this.base===null){this.base=pose.lift;this.since=time;return null;}
    // Never infer a flick from motion that happened during an occlusion.
    if(reacquired){if(!this.latched)this.base=pose.lift;this.ready=false;this.since=time;return null;}
    if(this.latched){
      this.peak=Math.max(this.peak,pose.lift);
      if(pose.lift<this.peak-.14 && time>=this.cooldownUntil){this.latched=false;this.ready=false;this.since=time;this.base=pose.lift;}
      return null;
    }
    if(!this.ready){
      if(Math.abs(pose.lift-this.base)>.18){this.base=pose.lift;this.since=time;}
      this.ready=time-this.since>=120;return null;
    }
    this.chargeMs=Math.min(CHARGE_MS,this.chargeMs+Math.max(0,Math.min(gap,200)));
    if(pose.lift-this.base>.16 && time>=this.cooldownUntil){
      const shot={charge:this.charge};this.chargeMs=0;this.latched=true;this.peak=pose.lift;this.cooldownUntil=time+230;return shot;
    }
    this.base=Math.min(this.base,pose.lift);return null;
  }
}

export function projectPlant(plant){
  const depth=clamp(plant.depth);
  return {x:.5+plant.lane*(.23+depth*.23),y:.45+depth*.24,size:.055+depth*.16};
}
// Pick the most urgent enemies, then assign them in screen order. Physical hand
// position and handedness labels never control aiming, so crossing is unnecessary.
export function automaticTargets(plants,activeSides=['left','right']){
  const live=plants.filter(p=>p.hp>0).sort((a,b)=>b.depth-a.depth||a.id-b.id);
  const targets={left:null,right:null};
  if(!live.length)return targets;
  if(activeSides.length===1){targets[activeSides[0]]=live[0];return targets;}
  if(activeSides.length===0)return targets;
  const pair=live.slice(0,2).sort((a,b)=>projectPlant(a).x-projectPlant(b).x||a.id-b.id);
  targets.left=pair[0];targets.right=pair[1]||pair[0];return targets;
}
export class GardenGame {
  constructor(random=Math.random){this.random=random;this.reset();}
  reset(mode='practice'){
    this.mode=mode;this.plants=[];this.score=0;this.kills=0;this.shots=0;this.hits=0;this.combo=0;this.bestCombo=0;this.hp=5;this.elapsed=0;this.remaining=75;this.spawnIn=1;this.finished=false;this.won=false;this.pauseReason='';this.nextId=1;this.invulnerable=0;this.spawn(0,.48);
  }
  get wave(){return Math.min(5,1+Math.floor(this.elapsed/15));}
  spawn(lane,depth=.03){
    const type=this.nextId%3;
    this.plants.push({id:this.nextId++,lane:lane??(this.random()*1.76-.88),depth,type,hp:[3,2,4][type],maxHp:[3,2,4][type],flash:0,seed:this.random()*6.28});
  }
  pause(reason){this.pauseReason=reason;}
  resume(){this.pauseReason='';}
  shoot(hand,charge=0,activeSides=['left','right']){
    if(this.finished||this.pauseReason)return null;
    const target=automaticTargets(this.plants,activeSides)[hand]||automaticTargets(this.plants,[hand])[hand];
    // No enemy means no spent shot/charge and no false miss in the statistics.
    if(!target)return null;
    const point=projectPlant(target),damage=chargeDamage(charge),plant={...target};
    this.shots++;
    target.hp-=damage;target.flash=.22;target.depth=Math.max(.02,target.depth-.10-damage*.035);
    this.hits++;this.combo++;this.bestCombo=Math.max(this.bestCombo,this.combo);
    const killed=target.hp<=0,points=killed?100+Math.min(this.combo,10)*10:30;
    this.score+=points;if(killed)this.kills++;
    this.plants=this.plants.filter(p=>p.hp>0);
    return {hand,plant,aim:{x:point.x,y:point.y},targetId:target.id,charge:clamp(charge),damage,hit:true,killed,points,type:target.type};
  }
  tick(dt){
    if(this.finished||this.pauseReason)return [];
    dt=clamp(dt,0,.1);this.elapsed+=dt;this.invulnerable=Math.max(0,this.invulnerable-dt);
    const events=[];
    if(this.mode==='survival'){
      this.remaining=Math.max(0,75-this.elapsed);
      if(this.remaining===0){this.finished=true;this.won=true;return [{type:'finish'}];}
    }
    this.spawnIn-=dt;
    if(this.spawnIn<=0){
      if(this.plants.length<(this.mode==='practice'?3:7))this.spawn();
      this.spawnIn=this.mode==='practice'?2.8:Math.max(.65,2-this.wave*.23);
    }
    for(const plant of this.plants){
      plant.flash=Math.max(0,plant.flash-dt);
      plant.depth+=dt*(this.mode==='practice'?.028:.045+this.wave*.007);
      if(plant.depth>=1){
        plant.hp=0;
        if(this.mode==='survival'&&this.invulnerable===0){this.hp--;this.combo=0;this.invulnerable=1;events.push({type:'damage'});}
      }
    }
    this.plants=this.plants.filter(p=>p.hp>0);
    if(!this.plants.length && this.mode==='practice')this.spawnIn=Math.min(this.spawnIn,.6);
    if(this.hp<=0){this.finished=true;events.push({type:'finish'});}
    return events;
  }
}
