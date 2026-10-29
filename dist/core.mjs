// Pure rules shared by the camera, mouse demo and automated tests.
export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y,(a.z||0)-(b.z||0));

export function readGunPose(points) {
  if (!points || points.length !== 21 || points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y))) return null;
  const scale = distance(points[0],points[9]);
  if (scale < .025) return null;
  const straight = (a,b,c,d) => distance(points[a],points[d]) / (distance(points[a],points[b])+distance(points[b],points[c])+distance(points[c],points[d])+.00001);
  const extended = (a,b,c,d) => straight(a,b,c,d)>.82 && distance(points[d],points[a])>scale*.48;
  const curled = (a,b,c,d) => straight(a,b,c,d)<.79 || distance(points[d],points[0])<distance(points[b],points[0])*1.06;
  // Thumb must be extended AND separated from the index knuckle; simply
  // pointing with a folded thumb is not a gun. All distances are palm-relative.
  const thumb = straight(1,2,3,4)>.80 && distance(points[4],points[2])>scale*.36 && distance(points[4],points[5])>scale*.38;
  const index = extended(5,6,7,8), middle = extended(9,10,11,12);
  const gun = thumb && index && (middle || curled(9,10,11,12)) && curled(13,14,15,16) && curled(17,18,19,20);
  const palm=[0,5,9,13,17].map(i=>points[i]);
  return {gun, variant:middle?'three':'two', lift:(points[5].y-points[8].y)/scale,
    aim:{x:clamp((1-palm.reduce((s,p)=>s+p.x,0)/5-.14)/.72,.06,.94),y:clamp((palm.reduce((s,p)=>s+p.y,0)/5-.18)/.67,.22,.78)}};
}

// Relative upward flick, not an absolute pose. Translating the entire hand
// leaves lift unchanged. Holding the raised finger never creates extra shots.
export class GunTrigger {
  constructor(){this.reset();}
  reset(){this.base=null;this.since=0;this.last=0;this.ready=false;this.latched=false;this.cooldownUntil=0;this.aim=null;this.variant=null;}
  sample(pose,time){
    if(!pose?.gun){this.reset();return null;}
    if(this.last && time-this.last>350)this.reset();
    const variant=pose.variant||'two';
    if(this.variant && this.variant!==variant)this.reset();
    this.variant=variant;
    this.last=time;
    if(this.base===null){this.base=pose.lift;this.since=time;this.aim={...pose.aim};return null;}
    if(this.latched){
      if(pose.lift<this.base+.12 && time>=this.cooldownUntil){this.latched=false;this.ready=false;this.since=time;this.base=pose.lift;}
      return null;
    }
    if(!this.ready){
      if(Math.abs(pose.lift-this.base)>.18){this.base=pose.lift;this.since=time;}
      this.ready=time-this.since>=120;
      this.aim={...pose.aim};return null;
    }
    if(pose.lift-this.base>.24 && time>=this.cooldownUntil){
      const shot={...this.aim};this.latched=true;this.cooldownUntil=time+230;return shot;
    }
    this.base=Math.min(this.base,pose.lift);this.aim={...pose.aim};return null;
  }
}

export function projectPlant(plant){
  const depth=clamp(plant.depth);
  return {x:.5+plant.lane*(.23+depth*.23),y:.45+depth*.24,size:.055+depth*.16};
}
export function assistedTarget(plants,aim){
  let chosen=null,best=Infinity;
  for(const plant of plants){
    if(plant.hp<=0)continue;
    const p=projectPlant(plant);
    const d=Math.hypot((p.x-aim.x)/(.24+p.size*.35),(p.y-aim.y)/(.27+p.size*.3));
    const rank=d-plant.depth*.12;
    if(d<=1 && rank<best){best=rank;chosen=plant;}
  }
  return chosen;
}
export class GardenGame {
  constructor(random=Math.random){this.random=random;this.reset();}
  reset(mode='practice'){
    this.mode=mode;this.plants=[];this.score=0;this.kills=0;this.shots=0;this.hits=0;this.combo=0;this.bestCombo=0;this.hp=5;this.elapsed=0;this.remaining=75;this.spawnIn=1;this.finished=false;this.won=false;this.pauseReason='';this.nextId=1;this.invulnerable=0;this.spawn(0,.48);
  }
  get wave(){return Math.min(5,1+Math.floor(this.elapsed/15));}
  spawn(lane,depth=.03){
    const type=this.nextId%3;
    this.plants.push({id:this.nextId++,lane:lane??(this.random()*1.76-.88),depth,type,hp:type===2?2:1,flash:0,seed:this.random()*6.28});
  }
  pause(reason){this.pauseReason=reason;}
  resume(){this.pauseReason='';}
  shoot(aim,hand){
    if(this.finished||this.pauseReason)return null;
    this.shots++;
    const target=assistedTarget(this.plants,aim);
    if(!target){this.combo=0;return {hand,aim,hit:false};}
    const point=projectPlant(target);
    target.hp--;target.flash=.22;target.depth=Math.max(.02,target.depth-.12);
    this.hits++;this.combo++;this.bestCombo=Math.max(this.bestCombo,this.combo);
    const killed=target.hp<=0,points=killed?100+Math.min(this.combo,10)*10:30;
    this.score+=points;if(killed)this.kills++;
    this.plants=this.plants.filter(p=>p.hp>0);
    return {hand,aim:{x:point.x,y:point.y},hit:true,killed,points,type:target.type};
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
