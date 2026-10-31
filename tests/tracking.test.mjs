import test from 'node:test';
import assert from 'node:assert/strict';
import {HandTracking} from '../dist/tracking.mjs';
import {readGunPose} from '../dist/core.mjs';
function observation(offset=0,lift=0,handedness='Left'){
  const p=Array.from({length:21},()=>({x:.5,y:.6,z:0}));p[0]={x:.5,y:.7};
  for(const [i,x] of [[5,.44],[9,.50],[13,.55],[17,.59]]){p[i]={x,y:.54};p[i+1]={x,y:.48};p[i+2]={x,y:.56};p[i+3]={x,y:.61};}
  p[1]={x:.45,y:.66};p[2]={x:.41,y:.62};p[3]={x:.36,y:.60};p[4]={x:.31,y:.58};p[6]={x:.42,y:.49};p[7]={x:.41,y:.46};p[8]={x:.40,y:.43-lift};
  return {landmarks:p.map(v=>({...v,x:v.x+offset})),confidence:.55,handedness};
}
test('label flips and detection order changes do not swap the charged hands',()=>{
  const tracking=new HandTracking();
  for(let now=0;now<=800;now+=80){const a=observation(.2,0,now%160?'Left':'Right'),b=observation(-.2,0,now%160?'Right':'Left');tracking.update(now%160?[a,b]:[b,a],now);}
  const result=tracking.update([observation(-.2),observation(.2,.07,'Right')],880);
  assert.equal(result.shots.length,1);assert.equal(result.shots[0].hand,'left');assert.ok(result.shots[0].charge>.3);
  assert.ok(tracking.slots.right.trigger.charge>.3);
});
test('one missing hand keeps the other gun active and only expires after grace',()=>{
  const tracking=new HandTracking();for(let now=0;now<=800;now+=80)tracking.update([observation(.2),observation(-.2)],now);
  tracking.update([observation(-.2)],880);assert.equal(tracking.slots.left.visible,true);
  const retained=tracking.slots.left.trigger.charge;tracking.update([observation(-.2)],1040);assert.equal(tracking.slots.left.trigger.charge,retained);
  const result=tracking.update([observation(-.2,.07)],1120);assert.equal(result.shots[0].hand,'right');
  tracking.expire(1600);assert.equal(tracking.slots.left.visible,false);assert.equal(tracking.slots.left.trigger.charge,0);
});
test('a reappearing raised hand does not fire, and low confidence does not erase charge immediately',()=>{
  const tracking=new HandTracking();for(let now=0;now<=800;now+=80)tracking.update([observation(.2)],now);
  const charge=tracking.slots.left.trigger.charge;
  tracking.update([{...observation(.2),confidence:.1}],880);assert.equal(tracking.slots.left.visible,true);assert.equal(tracking.slots.left.trigger.charge,charge);
  assert.deepEqual(tracking.update([observation(.2,.07)],960).shots,[]);
  assert.equal(tracking.slots.left.trigger.charge,charge);
});
test('a relaxed thumb arms immediately and stays active without a strict pose',()=>{
  const weak=observation(.2);weak.landmarks[4]={x:.57,y:.59};
  assert.equal(readGunPose(weak.landmarks).gun,true);
  const tracking=new HandTracking();assert.equal(tracking.update([weak],0).valid,1);
  for(let now=80;now<=800;now+=80)assert.equal(tracking.update([weak],now).valid,1);
  const lifted=structuredClone(weak);lifted.landmarks[8].y-=.04;
  assert.equal(tracking.update([lifted],880).shots.length,1);
});
