import test from 'node:test';
import assert from 'node:assert/strict';
import {PalmEnergy,readStopPose,MAX_ENERGY} from '../dist/palm-control.mjs';
import {GardenGame,WAVE_COUNTS} from '../dist/core.mjs';
import {HandTracking} from '../dist/tracking.mjs';
import {HandCamera} from '../dist/camera.mjs';
import {HAND_COLORS} from '../dist/hand-identity.mjs';
function palm(offset=0){
 const p=Array.from({length:21},()=>({x:.5+offset,y:.5,z:0}));p[0]={x:.5+offset,y:.75,z:0};
 for(const [i,x] of [[5,.40],[9,.47],[13,.54],[17,.61]])for(let j=0;j<4;j++)p[i+j]={x:x+offset,y:.5-j*.09,z:0};
 return {landmarks:p,handedness:offset>0?'Left':'Right',confidence:.98};
}
test('stop needs four extended fingers and a broad palm; a side-on palm and gun do not qualify',()=>{
 const hand=palm();assert.equal(readStopPose(hand.landmarks),true);
 const edge=hand.landmarks.map(p=>({x:0,y:p.y,z:p.x}));assert.equal(readStopPose(hand.landmarks,edge),false);
 for(const i of [13,17]){hand.landmarks[i+2].y=.55;hand.landmarks[i+3].y=.58;}
 assert.equal(readStopPose(hand.landmarks),false);assert.equal(readStopPose([]),false);
});
test('stop pose has priority over gun, settles briefly, and expires without a ghost hold',()=>{
 const t=new HandTracking();t.update([palm(.2)],0);const result=t.update([palm(.2)],160);
 assert.equal(t.slots.left.stopping,true);assert.equal(t.slots.left.trigger.charge,0);assert.deepEqual(result.shots,[]);
 const gun=palm(.2);for(const i of [9,13,17]){gun.landmarks[i+2].y=.55;gun.landmarks[i+3].y=.58;}
 assert.deepEqual(t.update([gun],200).shots,[]);assert.equal(t.slots.left.stopping,false);
 t.update([palm(.2)],240);t.update([palm(.2)],400);t.expire(560);assert.equal(t.slots.left.stopping,false);
});
test('shared energy lasts five seconds, cannot recharge while held, and partial energy works',()=>{
 const p=new PalmEnergy();p.setHands({left:true});for(let i=0;i<50;i++)p.update(.1);
 assert.equal(p.energy,0);p.update(.1);assert.equal(p.active,0);
 for(let i=0;i<10;i++)p.update(.1);assert.equal(p.energy,0);
 p.setHands({});for(let i=0;i<10;i++)p.update(.1);assert.ok(Math.abs(p.energy-.65)<1e-8);
 p.setHands({right:true});p.update(.1);assert.equal(p.active,1);assert.ok(Math.abs(p.energy-.55)<1e-8);
 p.setHands({});for(let i=0;i<100;i++)p.update(.1);assert.equal(p.energy,MAX_ENERGY);
});
test('two palms share one pool and drain faster, without restoring energy by switching hands',()=>{
 const p=new PalmEnergy();p.setHands({left:true});p.update(.1);p.setHands({right:true});p.update(.1);assert.ok(Math.abs(p.energy-4.8)<1e-8);
 p.setHands({left:true,right:true});p.update(.1);assert.ok(Math.abs(p.energy-4.64)<1e-8);assert.equal(p.active,2);
 p.energy=.04;p.update(.1);assert.equal(p.energy,0);assert.ok(Math.abs(p.strength-.25)<1e-8);
});
test('one palm slows plants while the other fires; two push back and pause freezes energy',()=>{
 const g=new GardenGame(()=>.5),normal=new GardenGame(()=>.5);const start=g.plants[0].depth;
 g.palm.setHands({left:true});g.tick(.1);normal.tick(.1);assert.ok(g.plants[0].depth-start<(normal.plants[0].depth-start)*.4);
 assert.equal(g.shoot('left'),null);assert.ok(g.shoot('right'));
 const before=g.plants[0].depth;g.palm.setHands({left:true,right:true});g.tick(.1);assert.ok(g.plants[0].depth<before);
 const energy=g.palm.energy;g.pause('manual');g.tick(.1);assert.equal(g.palm.energy,energy);
 g.reset();assert.equal(g.palm.energy,5);assert.equal(g.palm.active,0);
});
test('final wave includes one large boss; it survives reaching the player and must be defeated',()=>{
 const g=new GardenGame(()=>.5);g.reset('survival');g.plants=[];g.wave=4;g.beginWave();
 const boss=g.plants.find(p=>p.boss);assert.ok(boss);assert.equal(boss.maxHp,48);assert.equal(g.plants.length+g.toSpawn,WAVE_COUNTS[4]);
 g.plants=[boss];g.toSpawn=0;boss.depth=.9999;g.tick(.1);assert.equal(g.hp,3);assert.equal(boss.hp,48);assert.equal(boss.depth,.62);assert.equal(g.finished,false);
 const hp=boss.hp;g.shoot('right',1);assert.equal(boss.hp,hp-3);
 boss.hp=1;g.shoot('left');g.tick(.1);assert.equal(g.won,true);assert.ok(g.score>=1500);
});
test('preview colors and readable letters use the same assigned identity even if raw labels flip',()=>{
 const t=new HandTracking();const a=palm(.2),b=palm(-.2);t.update([a,b],0);
 const result=t.update([{...a,handedness:'Right'},{...b,handedness:'Left'}],40);
 assert.equal(result.preview.find(p=>p.landmarks===a.landmarks).side,'left');
 const strokes=[],labels=[],scales=[];const c={clearRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){strokes.push(this.strokeStyle);},arc(){},fill(){},save(){},translate(){},scale(...v){scales.push(v);},fillRect(){},fillText(v){labels.push(v);},restore(){}};
 new HandCamera({}, {width:240,height:180,getContext:()=>c}).draw(result.preview);
 assert.ok(strokes.includes(HAND_COLORS.left));assert.ok(strokes.includes(HAND_COLORS.right));assert.deepEqual(labels,['L','R']);assert.ok(scales.every(v=>v[0]===-1&&v[1]===1));
});
