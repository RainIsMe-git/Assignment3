import test from 'node:test';
import assert from 'node:assert/strict';
import {GardenGame,BURST_EVERY,BURST_SECONDS} from '../dist/core.mjs';
import {Tutorial,LESSONS} from '../dist/tutorial.mjs';

test('ordinary plants have one or two health; the boss is easier but remains distinct',()=>{
  const g=new GardenGame();g.plants=[];for(let type=0;type<4;type++)g.spawn(0,.5,type);
  assert.deepEqual(g.plants.map(p=>p.hp),[1,1,2,20]);
});
test('one palm stops movement, animation clock and incoming spawns exactly; empty energy releases time',()=>{
  const g=new GardenGame();g.reset('survival');g.toSpawn=4;g.spawnIn=0;
  const positions=g.plants.map(p=>p.depth);g.palm.setHands({left:true});
  for(let i=0;i<100;i++)g.tick(.1);
  assert.deepEqual(g.plants.map(p=>p.depth),positions);assert.equal(g.enemyTime,0);assert.equal(g.toSpawn,4);assert.equal(g.palm.energy,0);
  g.tick(.1);assert.ok(g.enemyTime>0);assert.equal(g.toSpawn,0);
});
test('two palms strongly push enemies and the boss back while sharing the ten-second pool',()=>{
  const g=new GardenGame();g.plants=[];g.spawn(0,.8,0);g.spawn(.5,.8,3);g.palm.setHands({left:true,right:true});
  for(let i=0;i<10;i++)g.tick(.1);
  assert.ok(Math.abs(g.plants[0].depth-.32)<1e-8);assert.ok(Math.abs(g.plants[1].depth-.464)<1e-8);
  assert.ok(Math.abs(g.palm.energy-8.4)<1e-8);
});
test('20th hit triggers bounded area damage without counting splash as extra shots or combo',()=>{
  const g=new GardenGame();
  for(let i=0;i<BURST_EVERY-1;i++){g.plants=[];g.spawn(0,.6,0);assert.equal(g.shoot('left').explosive,false);}
  g.plants=[];g.spawn(0,.7,0);g.spawn(.2,.7,0);g.spawn(.95,.7,0);
  const far=g.plants[2],event=g.shoot('left',0,['left']);
  assert.equal(event.burstStarted,true);assert.equal(event.splash.length,1);assert.equal(g.combo,20);assert.equal(g.shots,20);assert.equal(g.hits,20);
  assert.equal(g.kills,21);assert.equal(g.plants.length,1);assert.equal(g.plants[0],far);assert.equal(far.hp,1);assert.equal(event.splash[0].plant.hp,1);
  assert.equal(g.burstRemaining,BURST_SECONDS);
});
test('explosive window expires, pauses, refreshes at the next milestone and resets on restart',()=>{
  const g=new GardenGame();g.combo=19;g.shoot('left');g.pause('manual');g.tick(.1);assert.equal(g.burstRemaining,6);g.resume();
  for(let i=0;i<61;i++)g.tick(.1);assert.equal(g.burstRemaining,0);
  g.plants=[];g.spawn(0,.5);assert.equal(g.shoot('left').explosive,false);
  g.combo=39;g.spawn(0,.6);assert.equal(g.shoot('right').burstStarted,true);assert.equal(g.burstRemaining,6);
  g.reset();assert.equal(g.combo,0);assert.equal(g.burstRemaining,0);
});
test('tutorial requires every skill in order, counts real area hits, and signals automatic level entry',()=>{
  const g=new GardenGame(),lesson=new Tutorial();
  const tick=(seconds)=>{for(let i=0;i<Math.ceil(seconds*10);i++){g.tick(.1);lesson.update(.1,g);}};
  const shot=(charge=0,hand='right')=>{if(g.plants.length<2){g.spawn(0,.5,0);g.spawn(.1,.5,0);}const event=g.shoot(hand,charge,[hand]);lesson.shot(event,g);return event;};
  tick(1);assert.equal(lesson.step,'fire');shot();shot();tick(1);assert.equal(lesson.step,'charge');
  shot(.5);assert.equal(lesson.success,0);shot(1);tick(1);assert.equal(lesson.step,'freeze');
  g.palm.setHands({left:true});tick(1.2);tick(1);assert.equal(lesson.step,'mixed');
  shot();tick(1);assert.equal(lesson.step,'push');
  g.palm.setHands({left:true,right:true});tick(1.2);tick(1);assert.equal(lesson.step,'recharge');
  g.palm.setHands({});tick(1.7);assert.equal(lesson.step,'burst');
  for(let i=0;i<30&&!lesson.success;i++)shot();assert.ok(lesson.success);tick(1);
  assert.equal(lesson.index,LESSONS.length);assert.equal(lesson.active,false);assert.equal(lesson.ready,true);
  g.reset('survival');assert.equal(g.wave,1);assert.equal(g.palm.energy,10);assert.equal(g.combo,0);
});
test('tutorial pause and no-input waiting cannot silently complete a lesson',()=>{
  const g=new GardenGame(),lesson=new Tutorial();lesson.index=2;g.palm.setHands({left:true});g.tick(.1);g.pause('lost-hand');
  for(let i=0;i<100;i++)lesson.update(.1,g);assert.equal(lesson.progress,0);assert.equal(lesson.step,'freeze');
  g.resume();g.palm.setHands({});for(let i=0;i<100;i++){g.tick(.1);lesson.update(.1,g);}assert.equal(lesson.step,'freeze');
  lesson.reset();assert.equal(lesson.step,'fire');assert.equal(lesson.ready,false);
});
