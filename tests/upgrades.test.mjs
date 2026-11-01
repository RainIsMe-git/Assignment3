import test from 'node:test';
import assert from 'node:assert/strict';
import {GardenGame} from '../dist/core.mjs';
import {DOUBLE_DRAIN} from '../dist/palm-control.mjs';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
function clear(g,wave){g.wave=wave;g.waveState='active';g.toSpawn=0;g.plants=[];return g.tick(.01);}

test('only waves 2, 4, 6 and 8 award both upgrades, once per intermission',()=>{
 const g=new GardenGame();g.reset('survival');
 for(let wave=1;wave<=10;wave++){
  const events=clear(g,wave),reward=wave%2===0&&wave<10;
  assert.equal(events.filter(e=>e.type==='upgrade').length,Number(reward));
  assert.equal(g.upgradeLevel,Math.min(4,Math.floor(wave/2)));
  close(g.damageMultiplier,[.75,1,1.2,1.4,5/3][g.upgradeLevel]);
  assert.equal(g.palm.maxEnergy,[5,6,8,10,12][g.upgradeLevel]);
  if(reward){assert.equal(g.palm.energy,g.palm.maxEnergy);assert.equal(g.breakRemaining,5);}
  const level=g.upgradeLevel;
  for(let n=0;n<10;n++)assert.equal(g.tick(.1).some(e=>e.type==='upgrade'),false);
  assert.equal(g.upgradeLevel,level);
 }
 assert.equal(g.won,true);close(g.shotDamage(1),5);assert.equal(g.palm.maxEnergy,12);
});
test('every upgrade increases real uncharged, partial and full-charge damage for both guns; queen wards stay intact',()=>{
 const g=new GardenGame();g.reset('survival');
 const expected=[.75,1,1.2,1.4,5/3];
 for(let rank=0;rank<5;rank++){
  if(rank)clear(g,rank*2);
  for(const side of ['left','right'])for(const charge of [0,.37,1]){
   g.plants=[];g.spawn(0,.6,3);const p=g.plants[0],before=p.hp,event=g.shoot(side,charge);
   close(before-p.hp,(1+2*charge)*expected[rank]);close(event.appliedDamage,g.shotDamage(charge));
   if(rank)assert.ok(event.appliedDamage>(1+2*charge)*expected[rank-1]);
  }
 }
 g.plants=[];g.spawn(0,.1,4);const queen=g.plants[0];queen.duel.phase='rest';queen.hp=60;
 assert.equal(g.shoot('left',1).appliedDamage,0);assert.equal(queen.hp,60);
});
test('burst damage grows with wave upgrades, caps at the former strength and respects queen wards',()=>{
 const g=new GardenGame();g.reset('survival');
 for(const [rank,expected] of [1.5,1.75,2,2.25,2.5].entries()){
  if(rank)clear(g,rank*2);
  g.plants=[];for(const lane of [-.8,0,.8])g.spawn(lane,.3,3);
  const targets=g.plants.map(p=>({p,hp:p.hp}));
  g.burstReady=true;assert.equal(g.burst(),true);
  const impacts=[];for(let n=0;n<10;n++)impacts.push(...g.tick(.1).filter(e=>e.type==='burst-impact'));
  assert.equal(impacts.length,1);assert.equal(impacts[0].impacts.length,3);
  for(const {p,hp} of targets)close(hp-p.hp,expected);
  for(const impact of impacts[0].impacts)close(impact.damage,expected);
 }
 g.plants=[];g.spawn(0,.1,4);const queen=g.plants[0];queen.duel.phase='rest';queen.hp=60;
 g.burstReady=true;g.burst();for(let n=0;n<10;n++)g.tick(.1);assert.equal(queen.hp,60);
 for(const mode of ['practice','survival']){g.reset(mode);assert.equal(g.burstDamage,1.5);}
});
test('larger palm pool supplies actual extra push time, recharges to its new cap and freezes on pause',()=>{
 const g=new GardenGame();g.reset('survival');clear(g,2);const p=g.palm;
 p.setHands({left:true});for(let i=0;i<50;i++)p.update(.1);close(p.energy,1);
 p.setHands({left:true,right:true});p.update(.5);close(p.energy,1-.5*DOUBLE_DRAIN);
 g.pause('manual');const energy=p.energy,remaining=g.breakRemaining;g.tick(.1);
 close(p.energy,energy);assert.equal(g.breakRemaining,remaining);
 p.setHands({});for(let i=0;i<200;i++)p.update(.1);assert.equal(p.energy,6);
 g.resume();g.tick(.1);assert.ok(g.breakRemaining<remaining);
});
test('practice and replay reset every upgrade and capacity',()=>{
 const g=new GardenGame();g.reset('survival');clear(g,2);clear(g,4);
 for(const mode of ['practice','survival']){
  g.reset(mode);assert.equal(g.upgradeLevel,0);assert.equal(g.damageMultiplier,.75);
  assert.equal(g.palm.energy,5);assert.equal(g.palm.maxEnergy,5);
 }
 g.reset();g.plants=[];g.tick(.1);assert.equal(g.upgradeLevel,0);
});
