import test from 'node:test';
import assert from 'node:assert/strict';
import {GardenGame,WAVE_COUNTS,regularHealth} from '../dist/core.mjs';
import {Tutorial} from '../dist/tutorial.mjs';
import {cameraStatusKey} from '../dist/palm-control.mjs';
const advance=(game,seconds)=>{const events=[];for(let i=0;i<Math.ceil(seconds*10);i++)events.push(...game.tick(.1));return events;};
function finalBattle(){const g=new GardenGame(()=>.5);g.reset('survival');g.plants=[];g.wave=10;g.toSpawn=0;g.spawn(0,.42,4);return g;}

test('ten waves retain the wave-five boss and cap increasing regular health at five',()=>{
  assert.equal(WAVE_COUNTS.length,10);assert.ok(WAVE_COUNTS.every((n,i)=>!i||n>WAVE_COUNTS[i-1]));
  assert.deepEqual([5,6,7,8,9,10].map(w=>[0,1,2].map(t=>regularHealth(t,w))),[[1,1,2],[2,2,3],[2,2,3],[3,3,4],[3,3,4],[4,4,5]]);
  for(let w=1;w<50;w++)for(let t=0;t<3;t++)assert.ok(regularHealth(t,w)<=5);
  const g=new GardenGame();g.reset('survival');g.plants=[];g.wave=4;g.beginWave();assert.equal(g.plants.find(p=>p.boss).type,3);
  g.plants=[];g.wave=9;g.beginWave();assert.equal(g.plants.find(p=>p.boss).type,4);assert.equal(g.plants.length+g.toSpawn,WAVE_COUNTS[9]);
});
test('queen wards require freeze and push counters; armor cannot be bypassed by rapid shots',()=>{
  const g=finalBattle(),queen=g.plants[0],q=queen.duel;
  for(let i=0;i<100;i++)g.shoot('right',1);assert.equal(queen.hp,60);assert.equal(g.shoot('right',1).blocked,true);assert.equal(g.finished,false);
  q.phase='windup';q.kind='freeze';q.remaining=2.8;g.palm.setHands({left:true});
  assert.ok(advance(g,.7).some(e=>e.type==='queen-counter'));assert.equal(q.wards.freeze,false);assert.equal(q.phase,'exposed');
  g.palm.setHands({});assert.equal(g.shoot('right',1).appliedDamage,3);
  for(let i=0;i<30;i++)g.shoot('right',1);assert.equal(queen.hp,30);
  q.phase='windup';q.kind='push';q.remaining=2.8;g.palm.setHands({left:true});advance(g,1);
  assert.equal(q.counter,0);assert.equal(q.phase,'windup');assert.equal(q.remaining,2.8);
  g.palm.setHands({left:true,right:true});assert.ok(advance(g,.8).some(e=>e.type==='queen-counter'&&e.kind==='push'));
  assert.equal(q.wards.push,false);assert.equal(queen.hp,22);g.palm.setHands({});
  for(let i=0;i<30;i++)g.shoot('right',1);g.tick(.1);assert.equal(g.won,true);assert.equal(g.kills,1);
});
test('queen telegraphs, launches and damages; pause and depleted palms cannot counterfeit a counter',()=>{
  const g=finalBattle(),q=g.plants[0].duel;const warning=advance(g,3.6);assert.ok(warning.some(e=>e.type==='queen-warning'));
  const before=JSON.stringify(q);g.pause('manual');advance(g,5);assert.equal(JSON.stringify(q),before);g.resume();
  g.palm.energy=0;g.palm.setHands({left:true,right:true});const events=advance(g,4.8);
  assert.ok(events.some(e=>e.type==='queen-launch'));assert.ok(events.some(e=>e.type==='queen-hit'));assert.equal(g.hp,3);assert.equal(q.wards.freeze,true);
});
test('countering an incoming orb reflects it and prevents the pending hit',()=>{
  const g=finalBattle(),queen=g.plants[0],q=queen.duel;q.phase='attack';q.kind='push';q.remaining=1.1;q.wards.freeze=false;queen.hp=30;
  g.palm.setHands({left:true,right:true});advance(g,1);assert.equal(q.phase,'exposed');assert.equal(queen.hp,22);assert.equal(g.hp,5);
  g.palm.setHands({});advance(g,2);assert.equal(g.hp,5);assert.equal(q.flight,0);
});
test('empty energy in palm lessons is refilled; recharge lesson still teaches real recovery',()=>{
  const g=new GardenGame(),lesson=new Tutorial();lesson.index=4;g.palm.energy=0;g.palm.setHands({left:true,right:true});
  for(let i=0;i<12;i++){lesson.prepare(g);g.tick(.1);lesson.update(.1,g);}
  assert.ok(lesson.success>0);assert.ok(g.palm.energy>9);assert.equal(lesson.unlimitedEnergy,true);
  for(let i=0;i<10;i++){lesson.prepare(g);g.tick(.1);lesson.update(.1,g);}assert.equal(lesson.step,'recharge');assert.equal(lesson.unlimitedEnergy,false);assert.ok(g.palm.energy<=7);
  g.palm.setHands({});for(let i=0;i<18;i++){lesson.prepare(g);g.tick(.1);lesson.update(.1,g);}assert.equal(lesson.step,'burst');
});
test('short palm dropouts do not erase a nearly completed training gesture',()=>{
  const g=new GardenGame(),lesson=new Tutorial();lesson.index=4;
  for(let i=0;i<14;i++){g.palm.setHands(i>=4&&i<6?{}:{left:true,right:true});lesson.prepare(g);g.tick(.1);lesson.update(.1,g);}
  assert.ok(lesson.success>0);
});
test('camera status distinguishes palms, mixed play and no energy from two finger guns',()=>{
  const base={valid:2,visible:2,palms:2,active:0,energy:0};
  assert.equal(cameraStatusKey(base),'cameraPalmsEmpty');
  assert.equal(cameraStatusKey({...base,energy:10,active:2}),'cameraPush');
  assert.equal(cameraStatusKey({...base,energy:10,active:1,palms:1}),'cameraMixed');
  assert.equal(cameraStatusKey({...base,energy:10,palms:0}),'cameraDual');
  assert.equal(cameraStatusKey({...base,palms:1}),'cameraPalmEmpty');
});

test('reflecting orbs alone cannot bypass the spore seal',()=>{
 const g=finalBattle(),queen=g.plants[0];queen.hp=60;
 for(let i=0;i<4;i++){Object.assign(queen.duel,{phase:'attack',kind:'push',remaining:1.1,counter:0});g.palm.energy=10;g.palm.setHands({left:true,right:true});advance(g,.8);}
 assert.equal(queen.hp,60);assert.equal(queen.duel.wards.freeze,true);
});
