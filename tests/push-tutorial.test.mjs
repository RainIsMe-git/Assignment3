import test from 'node:test';
import assert from 'node:assert/strict';
import {GardenGame} from '../dist/core.mjs';
import {Tutorial,LESSONS} from '../dist/tutorial.mjs';

test('ordinary plants start with continuous low health; the boss is easier but remains distinct',()=>{
  const g=new GardenGame();g.plants=[];for(let type=0;type<4;type++)g.spawn(0,.5,type);
  assert.deepEqual(g.plants.map(p=>p.hp),[1,1.3,1.6,20]);
});
test('one palm pushes gently while spawns and enemy animation keep advancing',()=>{
 const g=new GardenGame();g.reset('survival');g.plants=[];g.spawn(0,.6,0);g.toSpawn=4;g.spawnIn=0;
 g.palm.setHands({left:true});g.tick(.1);assert.ok(g.plants[0].depth<.6);assert.ok(g.enemyTime>0);assert.equal(g.toSpawn,0);
 const position=g.plants[0].depth;g.palm.energy=0;g.tick(.1);assert.ok(g.plants[0].depth>position);
});
test('two palms strongly push enemies and the boss back while sharing the initial five-second pool',()=>{
  const g=new GardenGame();g.plants=[];g.spawn(0,.8,0);g.spawn(.5,.8,3);g.palm.setHands({left:true,right:true});
  for(let i=0;i<10;i++)g.tick(.1);
  assert.ok(Math.abs(g.plants[0].depth-.32)<1e-8);assert.ok(Math.abs(g.plants[1].depth-.464)<1e-8);
  assert.ok(Math.abs(g.palm.energy-3.4)<1e-8);
});
test('tutorial requires every skill in order, uses six lessons without requiring a burst, and signals automatic level entry',()=>{
  const g=new GardenGame(),lesson=new Tutorial();
  const tick=(seconds)=>{for(let i=0;i<Math.ceil(seconds*10);i++){lesson.prepare(g);g.tick(.1);lesson.update(.1,g);}};
  const shot=(charge=0,hand='right')=>{if(g.plants.length<2){g.spawn(0,.5,0);g.spawn(.1,.5,0);}const event=g.shoot(hand,charge,[hand]);lesson.shot(event,g);return event;};
  tick(1);assert.equal(lesson.step,'fire');shot();shot();tick(1);assert.equal(lesson.step,'charge');
  shot(.5);assert.equal(lesson.success,0);shot(1);tick(1);assert.equal(lesson.step,'freeze');
  g.palm.setHands({left:true});tick(1.2);tick(1);assert.equal(lesson.step,'mixed');
  shot();tick(1);assert.equal(lesson.step,'push');
  g.palm.setHands({left:true,right:true});tick(1.2);tick(1);assert.equal(lesson.step,'recharge');
  g.palm.setHands({});tick(1.7);
  assert.equal(lesson.index,LESSONS.length);assert.equal(lesson.active,false);assert.equal(lesson.ready,true);
  g.reset('survival');assert.equal(g.wave,1);assert.equal(g.palm.energy,5);assert.equal(g.combo,0);
});
test('tutorial pause and no-input waiting cannot silently complete a lesson',()=>{
  const g=new GardenGame(),lesson=new Tutorial();lesson.index=2;g.palm.setHands({left:true});g.tick(.1);g.pause('lost-hand');
  for(let i=0;i<100;i++)lesson.update(.1,g);assert.equal(lesson.progress,0);assert.equal(lesson.step,'freeze');
  g.resume();g.palm.setHands({});for(let i=0;i<100;i++){lesson.prepare(g);g.tick(.1);lesson.update(.1,g);}assert.equal(lesson.step,'freeze');
  lesson.reset();assert.equal(lesson.step,'fire');assert.equal(lesson.ready,false);
});
