import test from 'node:test';
import assert from 'node:assert/strict';
import {GardenGame,GunTrigger,readGunPose,automaticTargets,projectPlant,chargeDamage} from '../dist/core.mjs';
const pose=(lift=0)=>({gun:true,lift,aim:{x:.4,y:.55}});
const arm=(trigger,start=0)=>{trigger.sample(pose(),start);trigger.sample(pose(),start+80);trigger.sample(pose(),start+160);};
function landmarks(){
  const p=Array.from({length:21},()=>({x:.5,y:.6,z:0}));
  p[0]={x:.5,y:.7};
  for(const [i,x] of [[5,.44],[9,.50],[13,.55],[17,.59]]){
    p[i]={x,y:.54};p[i+1]={x,y:.48};p[i+2]={x,y:.56};p[i+3]={x,y:.61};
  }
  p[1]={x:.45,y:.66};p[2]={x:.41,y:.62};p[3]={x:.36,y:.60};p[4]={x:.31,y:.58};
  p[6]={x:.42,y:.49};p[7]={x:.41,y:.46};p[8]={x:.40,y:.43};return p;
}
test('one upward flick shoots once; holding raised does not repeat',()=>{
  const t=new GunTrigger();arm(t);assert.equal(t.sample(pose(.35),240).charge,.04);
  for(let n=320;n<2000;n+=80)assert.equal(t.sample(pose(.4),n),null);
});
test('lower, settle and lift again re-arms the same hand',()=>{
  const t=new GunTrigger();arm(t);t.sample(pose(.35),240);t.sample(pose(.35),400);t.sample(pose(),500);t.sample(pose(),580);t.sample(pose(),660);assert.ok(t.sample(pose(.3),740));
});
test('left and right triggers can fire simultaneously and independently',()=>{
  const l=new GunTrigger(),r=new GunTrigger();arm(l);arm(r);assert.ok(l.sample(pose(.35),240));assert.ok(r.sample(pose(.4),240));l.sample(null,320);assert.equal(r.latched,true);assert.equal(l.latched,true);l.sample(null,1200);assert.equal(l.latched,false);
});
test('tracking loss, invalid pose and stale frames cannot produce a stored shot',()=>{
  for(const loss of ['none','invalid','gap']){
    const t=new GunTrigger();arm(t);if(loss==='none')t.sample(null,200);if(loss==='invalid')t.sample({...pose(),gun:false},200);
    assert.equal(t.sample(pose(.5),loss==='gap'?1000:240),null);
  }
});
test('small landmark jitter does not shoot and a newly raised pose is not a shot',()=>{
  const t=new GunTrigger();assert.equal(t.sample(pose(.9),0),null);t.reset();arm(t);
  for(let n=240;n<1000;n+=80)assert.equal(t.sample(pose(.06*Math.sin(n)),n),null);
});
test('a flick returns charge independently of hand aim',()=>{
  const t=new GunTrigger();arm(t);assert.equal(t.sample({...pose(.4),aim:{x:.9,y:.1}},240).charge,.04);
});
test('landmark classifier accepts a finger gun but rejects an open palm',()=>{
  const p=landmarks();assert.equal(readGunPose(p).gun,true);
  for(const i of [9,13,17]){p[i+1].y=.48;p[i+2].y=.44;p[i+3].y=.4;}
  assert.equal(readGunPose(p).gun,false);assert.equal(readGunPose([]),null);
});
test('translating the whole hand changes aim but not trigger lift',()=>{
  const p=landmarks(),a=readGunPose(p),b=readGunPose(p.map(v=>({...v,x:v.x+.1,y:v.y-.1})));
  assert.ok(Math.abs(a.lift-b.lift)<1e-9);assert.notEqual(a.aim.x,b.aim.x);assert.notEqual(a.aim.y,b.aim.y);
});
test('both requested gun shapes are accepted: thumb/index and thumb/index/middle',()=>{
  const p=landmarks();assert.equal(readGunPose(p).variant,'two');assert.equal(readGunPose(p).gun,true);
  p[10]={x:.49,y:.48};p[11]={x:.48,y:.44};p[12]={x:.47,y:.40};
  assert.equal(readGunPose(p).gun,true);assert.equal(readGunPose(p).variant,'three');
});
test('folded thumb, horns, and an open ring or pinky finger are rejected',()=>{
  const folded=landmarks();folded[3]={x:.44,y:.60};folded[4]={x:.48,y:.62};assert.equal(readGunPose(folded).gun,false);
  for(const finger of [13,17]){const p=landmarks();p[finger+1].y=.48;p[finger+2].y=.44;p[finger+3].y=.40;assert.equal(readGunPose(p).gun,false);}
});
test('changing between two- and three-finger guns recalibrates without firing',()=>{
  const t=new GunTrigger();arm(t);
  assert.equal(t.sample({...pose(.4),variant:'three'},240),null);
  assert.equal(t.ready,false);assert.equal(t.variant,'three');
});
test('gun shape classification is stable under mirror, rotation and distance scaling',()=>{
  const p=landmarks();
  for(const angle of [-1,0,1])for(const mirror of [-1,1])for(const factor of [.65,1.3]){
    const q=p.map(v=>{const x=(v.x-.5)*factor*mirror,y=(v.y-.5)*factor;return {x:.5+x*Math.cos(angle)-y*Math.sin(angle),y:.5+x*Math.sin(angle)+y*Math.cos(angle),z:0};});
    assert.equal(readGunPose(q).gun,true);
  }
});
test('raising the index relative to its knuckle increases trigger lift',()=>{
  const p=landmarks(),before=readGunPose(p);p[8].y-=.07;const after=readGunPose(p);
  assert.equal(after.gun,true);assert.ok(after.lift-before.lift>.24);
});
test('automatic targets always exist with living plants, regardless of their lane',()=>{
  const g=new GardenGame(()=>.5);
  for(const lane of [-1,0,1])for(const side of ['left','right']){
    g.reset();g.plants[0].lane=lane;
    assert.equal(automaticTargets(g.plants,[side])[side],g.plants[0]);
    assert.equal(g.shoot(side).hit,true);
  }
});
test('dual guns select separate targets in left-to-right order, not by physical hand',()=>{
  const g=new GardenGame();g.plants=[];g.spawn(.8,.8);g.spawn(-.8,.7);g.spawn(0,.1);
  const targets=automaticTargets(g.plants);assert.ok(targets.left.lane<targets.right.lane);assert.notEqual(targets.left.id,targets.right.id);
  assert.equal(g.shoot('left').targetId,targets.left.id);
});
test('charged damage has three levels and defeats a cactus faster',()=>{
  assert.deepEqual([0,.499,.5,.999,1,5].map(chargeDamage),[1,1,2,2,3,3]);
  const g=new GardenGame();g.plants=[];g.nextId=2;g.spawn(0,.6);const plant=g.plants[0];
  assert.equal(g.shoot('left',1).damage,3);assert.equal(plant.hp,1);assert.ok(plant.depth<.6);
  assert.equal(g.shoot('right',0).killed,true);assert.equal(g.kills,1);
});
test('simultaneous shots reselect living targets without counting an empty shot',()=>{
  const g=new GardenGame();g.plants[0].hp=1;g.spawn(.6,.1);g.plants[1].hp=3;
  const first=g.shoot('left',1),second=g.shoot('right',1);assert.notEqual(first.targetId,second.targetId);assert.equal(g.hits,2);assert.equal(g.kills,2);
  assert.equal(g.shoot('right',1),null);assert.equal(g.shots,2);assert.equal(g.hits,2);
});
test('pause freezes plants and clock and blocks firing',()=>{
  const g=new GardenGame();g.reset('survival');g.pause('manual');const before=JSON.stringify(g);assert.equal(g.shoot('left'),null);g.tick(.1);assert.equal(JSON.stringify(g),before);g.resume();g.tick(.1);assert.ok(g.elapsed>0);
});
test('approaching plants cost health in survival but not in practice',()=>{
  for(const mode of ['survival','practice']){const g=new GardenGame();g.reset(mode);g.plants[0].depth=.9999;g.tick(.1);assert.equal(g.hp,mode==='survival'?4:5);}
});
test('five hits end a round; post-game shots cannot change score',()=>{
  const g=new GardenGame();g.reset('survival');
  for(let i=0;i<5;i++){g.invulnerable=0;g.spawn(0,.9999);g.tick(.1);}
  assert.equal(g.hp,0);assert.equal(g.finished,true);assert.equal(g.won,false);assert.equal(g.shoot('left'),null);
});
test('surviving 75 seconds wins; replay resets all round state',()=>{
  const g=new GardenGame();g.reset('survival');g.elapsed=74.99;assert.equal(g.tick(.02)[0].type,'finish');assert.equal(g.won,true);g.reset();assert.equal(g.score,0);assert.equal(g.hp,5);assert.equal(g.finished,false);assert.equal(g.mode,'practice');
});

test('charge increases only on valid observations and caps at two seconds',()=>{
  const t=new GunTrigger();arm(t);for(let time=240;time<=2560;time+=80)t.sample(pose(),time);
  assert.equal(t.charge,1);assert.equal(t.sample(pose(.4),2640).charge,1);assert.equal(t.charge,0);
  for(let time=2720;time<4000;time+=80)t.sample(pose(.4),time);assert.equal(t.charge,0);
});
test('brief occlusion freezes charge and recalibrates without firing',()=>{
  const t=new GunTrigger();arm(t);for(let time=240;time<=800;time+=80)t.sample(pose(),time);const charge=t.charge;
  t.sample(null,880);t.sample(null,960);assert.equal(t.charge,charge);
  assert.equal(t.sample(pose(.5),1040),null);assert.equal(t.charge,charge);
  t.sample(pose(.5),1120);t.sample(pose(.5),1200);assert.ok(t.sample(pose(.85),1280));
});
test('long tracking loss and explicit pause reset stored charge',()=>{
  const t=new GunTrigger();arm(t);for(let time=240;time<=800;time+=80)t.sample(pose(),time);assert.ok(t.charge>0);
  t.miss(1600);assert.equal(t.charge,0);assert.equal(t.sample(pose(.6),1700),null);
  arm(t,1800);t.sample(pose(),2040);t.reset();assert.equal(t.charge,0);assert.equal(t.ready,false);
});
