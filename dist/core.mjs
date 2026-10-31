import {PalmEnergy} from './palm-control.mjs';
import {createQueen,updateQueen} from './queen.mjs';
import {CLAP_EVERY,CLAP_DAMAGE,CLAP_CONTACT,CLAP_DURATION} from './clap.mjs';
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
export const SHOT_COOLDOWN_MS=110;
export const WAVE_COUNTS=Object.freeze([6,10,16,22,30,34,38,42,46,50]);
export const regularHealth=(type,wave)=>Math.min(5,Math.round((1+type*.3+Math.max(0,wave-1)*.36)*100)/100);
export const chargeDamage=charge=>1+Math.floor(clamp(charge)*2+.000001);
export class GunTrigger {
  constructor(){this.reset();}
  reset(){this.base=null;this.since=0;this.last=null;this.lastLift=null;this.ready=false;this.latched=false;this.peak=0;this.cooldownUntil=0;this.source=null;this.chargeMs=0;this.interrupted=false;}
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
    const previousLift=this.lastLift;this.lastLift=pose.lift;
    this.interrupted=false;this.source=source;this.last=time;
    if(this.base===null){this.base=pose.lift;this.since=time;return null;}
    // Never infer a flick from motion that happened during an occlusion.
    if(reacquired){if(!this.latched)this.base=pose.lift;this.ready=false;this.since=time;return null;}
    if(this.latched){
      this.peak=Math.max(this.peak,pose.lift);
      if(pose.lift<this.peak-.12){this.latched=false;this.ready=true;this.since=time;this.base=pose.lift;}
      return null;
    }
    if(!this.ready){
      if(Math.abs(pose.lift-this.base)>.18){this.base=pose.lift;this.since=time;}
      this.ready=time-this.since>=120;return null;
    }
    this.chargeMs=Math.min(CHARGE_MS,this.chargeMs+Math.max(0,Math.min(gap,200)));
    const delta=pose.lift-this.base;
    const fastFlick=gap>0&&gap<=100&&previousLift!==null&&delta>.12&&(pose.lift-previousLift)/gap>.0012;
    if((delta>.16||fastFlick) && time>=this.cooldownUntil){
      const shot={charge:this.charge};this.chargeMs=0;this.latched=true;this.peak=pose.lift;this.cooldownUntil=time+SHOT_COOLDOWN_MS;return shot;
    }
    this.base=Math.min(this.base,pose.lift);return null;
  }
}

export function projectPlant(plant){
  const depth=clamp(plant.depth);
  return {x:.5+plant.lane*(.23+depth*.23),y:.45+depth*.24,size:(.055+depth*.16)*(plant.finalBoss?2.3:plant.boss?1.8:1)};
}
// Pick the most urgent enemies, then assign them in screen order. Physical hand
// position and handedness labels never control aiming, so crossing is unnecessary.
export function automaticTargets(plants,activeSides=['left','right']){
  const live=plants.filter(p=>p.hp>0&&(!p.finalBoss||p.duel.phase!=='waiting')).sort((a,b)=>b.depth-a.depth||a.id-b.id);
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
    this.mode=mode;this.plants=[];this.score=0;this.kills=0;this.shots=0;this.hits=0;this.combo=0;this.bestCombo=0;this.hp=5;this.elapsed=0;this.spawnIn=1;this.finished=false;this.won=false;this.pauseReason='';this.nextId=1;this.invulnerable=0;
    this.wave=0;this.waveState='active';this.toSpawn=0;this.breakRemaining=0;this.palm=new PalmEnergy();this.clapReady=false;this.clapTime=0;this.clapHit=false;this.enemyTime=0;
    if(mode==='survival')this.beginWave();else this.spawn(0,.48);
  }
  beginWave(){
    this.wave++;this.waveState='active';this.toSpawn=WAVE_COUNTS[this.wave-1];
    if(this.wave===5){this.spawn(0,.12,3);this.toSpawn--;}
    if(this.wave===WAVE_COUNTS.length){this.spawn(0,.015,4);this.toSpawn--;}
    this.spawnBurst();
  }
  spawnBurst(){
    const count=Math.min(this.toSpawn,4+this.wave*2,18-this.plants.length);
    for(let i=0;i<count;i++)this.spawn(-.9+1.8*(i+.5)/count+(this.random()-.5)*.06,.06+this.random()*.10);
    this.toSpawn-=count;this.spawnIn=2.2;
  }
  spawn(lane,depth=.03,typeOverride){
    const type=typeOverride??this.nextId%3;
    const hp=type===4?80:type===3?20:regularHealth(type,this.mode==='survival'?this.wave:0);
    this.plants.push({id:this.nextId++,lane:lane??(this.random()*1.76-.88),depth,type,boss:type>=3,finalBoss:type===4,duel:type===4?createQueen():null,hp,maxHp:hp,flash:0,seed:this.random()*6.28});
  }
  pause(reason){this.pauseReason=reason;}
  resume(){this.pauseReason='';}
  shoot(hand,charge=0,activeSides=['left','right']){
    if(this.finished||this.pauseReason||this.clapTime>0||this.palm.hands[hand])return null;
    const target=automaticTargets(this.plants,activeSides)[hand]||automaticTargets(this.plants,[hand])[hand];
    // No enemy means no spent shot/charge and no false miss in the statistics.
    if(!target)return null;
    const point=projectPlant(target),damage=chargeDamage(charge),shotPower=1+2*clamp(charge);
    this.shots++;this.hits++;this.combo++;this.bestCombo=Math.max(this.bestCombo,this.combo);
    const clapUnlocked=this.combo%CLAP_EVERY===0&&!this.clapReady;
    if(clapUnlocked)this.clapReady=true;
    const targets=[target];
    const impacts=targets.map(p=>{
      const plant={...p},aim=projectPlant(p),power=p.finalBoss&&p.duel.phase!=='exposed'?1:shotPower;
      const floor=p.finalBoss?(p.duel.wards.freeze?60:p.duel.wards.push?30:0):0;
      const dealt=Math.min(power,Math.max(0,p.hp-floor));p.hp-=dealt;p.flash=.22;p.depth=Math.max(p.finalBoss?.08:.02,p.depth-(p.boss?.015+dealt*.008:.10+dealt*.035));
      const killed=p.hp<=0,points=killed?(p.finalBoss?5000:p.boss?1500:100+Math.min(this.combo,10)*10):dealt?30:0;
      this.score+=points;if(killed)this.kills++;
      return {plant,aim:{x:aim.x,y:aim.y},targetId:p.id,killed,points,type:p.type,damage,appliedDamage:dealt,blocked:dealt===0};
    });
    this.plants=this.plants.filter(p=>p.hp>0);
    return {hand,...impacts[0],charge:clamp(charge),hit:true,clapUnlocked};
  }
  clap(){
    if(!this.clapReady||this.clapTime>0||this.pauseReason||this.finished)return false;
    this.clapReady=false;this.clapTime=CLAP_DURATION;this.clapHit=false;return true;
  }
  hurt(amount,events){if(this.invulnerable===0){this.hp=Math.max(0,this.hp-amount);this.combo=0;this.invulnerable=1;events.push({type:'damage'});}}
  tick(dt){
    if(this.finished||this.pauseReason)return [];
    dt=clamp(dt,0,.1);this.elapsed+=dt;this.invulnerable=Math.max(0,this.invulnerable-dt);this.palm.update(dt);
    const enemyDt=dt;this.enemyTime+=enemyDt;
    const events=[];
    if(this.clapTime>0){
      this.clapTime=Math.max(0,this.clapTime-dt);
      if(!this.clapHit&&this.clapTime<=CLAP_DURATION-CLAP_CONTACT){
        this.clapHit=true;const impacts=[];
        for(const p of this.plants){
          const floor=p.finalBoss?(p.duel.phase==='waiting'?p.hp:p.duel.wards.freeze?60:p.duel.wards.push?30:0):0;
          const damage=Math.min(CLAP_DAMAGE,Math.max(0,p.hp-floor));p.hp-=damage;p.flash=.3;
          if(damage)p.depth=Math.max(p.finalBoss?.08:.02,p.depth-.12);
          const killed=p.hp<=0;this.score+=killed?(p.finalBoss?5000:p.boss?1500:150):damage?30:0;if(killed)this.kills++;
          impacts.push({id:p.id,aim:projectPlant(p),damage,killed});
        }
        this.plants=this.plants.filter(p=>p.hp>0);events.push({type:'clap-impact',impacts});
      }
    }
    if(this.mode==='survival'&&this.waveState==='break'){
      this.breakRemaining=Math.max(0,this.breakRemaining-dt);
      if(this.breakRemaining<=0){this.beginWave();events.push({type:'wave-start',wave:this.wave,count:WAVE_COUNTS[this.wave-1]});}
      return events;
    }
    this.spawnIn-=enemyDt;
    if(this.spawnIn<=0&&enemyDt>0){
      if(this.mode==='practice'){if(this.plants.length<3)this.spawn();this.spawnIn=2.8;}
      else if(this.toSpawn>0)this.spawnBurst();
    }
    for(const plant of this.plants){
      plant.flash=Math.max(0,plant.flash-dt);
      if(plant.finalBoss){
        if(plant.duel.phase==='waiting'){
          if(this.toSpawn>0||this.plants.some(p=>!p.finalBoss&&p.hp>0))continue;
          plant.duel.phase='rest';plant.duel.remaining=5;events.push({type:'queen-awake'});
        }
        const event=updateQueen(plant.duel,dt,this.palm);
        if(event){
          events.push({type:'queen-'+event.type,kind:event.kind});
          if(event.type==='hit')this.hurt(2,events);
          if(event.type==='reflected'){
            plant.hp=Math.max(plant.duel.wards.freeze?60:0,plant.hp-8);plant.flash=.3;this.score+=200;
            if(plant.hp<=0){this.kills++;this.score+=5000;}
          }
        }
        plant.depth=Math.max(.08,Math.min(.28,plant.depth+enemyDt*.035-(this.palm.active?dt*(this.palm.active===2?.18:.06)*this.palm.strength:0)));continue;
      }
      const slow=1-(this.palm.active?this.palm.strength:0);
      const push=this.palm.active?(this.palm.active===2?.48:.14)*this.palm.strength*(plant.boss?.7:1):0;
      const speed=(this.mode==='practice'?.028:.045+this.wave*.007)*(plant.boss?(plant.hp<=plant.maxHp/2?1.25:.8):1);
      plant.depth=Math.max(.02,plant.depth+dt*(speed*slow-push));
      if(plant.depth>=1){
        if(plant.boss)plant.depth=.62;else plant.hp=0;
        if(this.mode==='survival')this.hurt(plant.boss?2:1,events);
      }
    }
    this.plants=this.plants.filter(p=>p.hp>0);
    if(!this.plants.length && this.mode==='practice')this.spawnIn=Math.min(this.spawnIn,.6);
    if(this.hp<=0){this.finished=true;events.push({type:'finish'});}
    else if(this.mode==='survival'&&!this.plants.length&&this.toSpawn===0){
      if(this.wave===WAVE_COUNTS.length){this.finished=true;this.won=true;events.push({type:'finish'});}
      else{this.waveState='break';this.breakRemaining=3.5;events.push({type:'wave-clear',wave:this.wave});}
    }
    return events;
  }
}
