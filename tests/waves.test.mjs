import test from 'node:test';
import assert from 'node:assert/strict';
import {GardenGame,WAVE_COUNTS,GunTrigger} from '../dist/core.mjs';
const pose=lift=>({gun:true,lift});

test('rapid lift-return cycles fire without waiting to settle again',()=>{
 const t=new GunTrigger();for(const time of [0,60,120])t.sample(pose(0),time);
 for(let n=0;n<6;n++){
  const time=150+n*120;
  assert.ok(t.sample(pose(.14),time),'short one-frame flick must fire');
  assert.equal(t.sample(pose(.14),time+20),null,'holding must not repeat');
  assert.equal(t.sample(pose(0),time+50),null,'lowering must not fire');
 }
});
test('fast jitter, a held raised finger and cooldown do not become rapid fire',()=>{
 const t=new GunTrigger();for(const time of [0,60,120])t.sample(pose(0),time);
 for(let time=140;time<400;time+=16)assert.equal(t.sample(pose(time%32?.05:0),time),null);
 assert.ok(t.sample(pose(.3),420));t.sample(pose(0),440);
 assert.equal(t.sample(pose(.3),470),null,'independent of the input rate, cooldown applies');
 assert.ok(t.sample(pose(.3),540));
 for(let time=560;time<900;time+=16)assert.equal(t.sample(pose(.3),time),null);
});
test('waves contain exact growing groups, a frozen pause and a real intermission',()=>{
 const g=new GardenGame(()=>.5);g.reset('survival');
 assert.equal(g.plants.length,5);assert.equal(g.wave,1);
 const seen=[];
 for(let wave=1;wave<=5;wave++){
  let defeated=0;
  for(let frame=0;frame<1000&&!g.finished&&g.wave===wave&&g.waveState==='active';frame++){
   for(const side of ['left','right']){const shot=g.shoot(side,1);if(shot?.killed)defeated++;}
   g.tick(.1);
  }
  seen.push(defeated);
  if(wave<5){
   assert.equal(g.waveState,'break');assert.equal(g.plants.length,0);
   const remaining=g.breakRemaining;g.pause('manual');g.tick(.1);assert.equal(g.breakRemaining,remaining);g.resume();
   for(let n=0;n<20;n++)g.tick(.1);assert.equal(g.wave,wave,'no next wave before rest ends');
   let started=false;for(let n=0;n<16;n++)for(const event of g.tick(.1))if(event.type==='wave-start')started=true;
   assert.equal(started,true);assert.equal(g.wave,wave+1);assert.ok(g.plants.length>=7);
  }
 }
 assert.deepEqual(seen,[...WAVE_COUNTS]);assert.equal(g.finished,true);assert.equal(g.won,true);assert.equal(g.hp,5);
});
test('a wave cannot clear while another burst is pending',()=>{
 const g=new GardenGame(()=>.5);g.reset('survival');g.plants=[];g.wave=2;g.toSpawn=2;g.spawnIn=1;
 g.tick(.1);assert.equal(g.waveState,'active');assert.equal(g.finished,false);
 for(let i=0;i<11;i++)g.tick(.1);assert.equal(g.plants.length,2);assert.equal(g.toSpawn,0);
});
