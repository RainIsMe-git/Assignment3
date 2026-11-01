import test from 'node:test';
import assert from 'node:assert/strict';
import {GardenGame} from '../dist/core.mjs';
import {BurstDetector,BURST_WINDOW} from '../dist/burst.mjs';
import {HandTracking} from '../dist/tracking.mjs';
const advance=(g,t)=>{const events=[];for(let i=0;i<Math.ceil(t*10);i++)events.push(...g.tick(.1));return events;};
import {fingertipPair as pair} from './fixtures/fingertips.mjs';

test('20 hits stores one burst instead of explosive bullets; contact damages the full screen once',()=>{
 const g=new GardenGame();for(let i=0;i<19;i++){g.plants=[];g.spawn(0,.5,0);g.shoot('left',1);}assert.equal(g.burstReady,false);
 g.plants=[];for(const lane of [-.9,0,.9])g.spawn(lane,.6,2);const last=g.plants[2];const event=g.shoot('left',0,['left']);assert.equal(event.burstUnlocked,true);assert.equal(last.hp,last.maxHp);assert.equal(g.burstReady,true);
 const combo=g.combo,hits=g.hits;assert.equal(g.burst(),true);assert.equal(g.burst(),false);g.tick(.1);assert.equal(last.hp,last.maxHp);
 g.pause('test');advance(g,2);assert.equal(last.hp,last.maxHp);g.resume();const events=advance(g,.9);assert.equal(events.filter(e=>e.type==='burst-impact').length,1);assert.equal(g.kills,20);assert.ok(Math.abs(last.hp-.1)<1e-8);assert.equal(g.combo,combo);assert.equal(g.hits,hits);assert.equal(g.burstReady,false);
});
test('burst is one stored charge, survives damage, never bypasses queen seals, and resets',()=>{
 const g=new GardenGame();g.burstReady=true;g.combo=39;g.plants=[];g.spawn(0,.5,3);assert.equal(g.shoot('right').burstUnlocked,true);
 g.hurt(1,[]);assert.equal(g.burstReady,true);g.plants=[];g.spawn(0,.1,4);const q=g.plants[0];q.duel.phase='rest';q.hp=60;
 g.burst();advance(g,.4);assert.equal(q.hp,60);g.reset();assert.equal(g.burstReady,false);assert.equal(g.burstTime,0);
});
test('continuous charge damage and health allow fractional bar changes',()=>{
 const g=new GardenGame();g.plants=[];g.spawn(0,.5,3);const p=g.plants[0];g.shoot('right',.37);assert.ok(Math.abs(p.hp-18.695)<1e-8);
});
test('burst window expires after eight active seconds, pauses, and refreshes on the next milestone',()=>{
 const g=new GardenGame();g.burstReady=true;g.pause('manual');advance(g,10);assert.equal(g.burstRemaining,BURST_WINDOW);g.resume();advance(g,8.1);assert.equal(g.burstReady,false);assert.equal(g.burst(),false);
 g.combo=39;g.spawn(0,.8,3);assert.equal(g.shoot('left').burstUnlocked,true);assert.equal(g.burstRemaining,8);advance(g,2);g.combo=59;g.spawn(0,.8,3);g.shoot('right');assert.equal(g.burstRemaining,8);
});

test('opposing index tips trigger on approach; holding contact cannot repeat',()=>{
 const d=new BurstDetector();assert.equal(d.update(pair(.22),0),false);
 assert.equal(d.update(pair(.13),60),false);assert.equal(d.update(pair(.025),120),true);
 for(let t=180;t<1200;t+=60)assert.equal(d.update(pair(.025),t),false);
 d.update(pair(.2),1200);d.update(pair(.2),1340);assert.equal(d.update(pair(.025),1400),true);
});
test('already touching tips work after a short steady hold, without a fast collision',()=>{
 const d=new BurstDetector();assert.equal(d.update(pair(.035),0),false);
 assert.equal(d.update(pair(.035),60),false);assert.equal(d.update(pair(.035),140),true);
});
test('detection order, slant, scale and aspect ratio do not change fingertip contact',()=>{
 for(const aspect of [1,4/3,16/9])for(const scale of [.6,1,1.5])for(const angle of [-.55,0,.55]){
  const transform=gap=>pair(gap).reverse().map(o=>({...o,aspectRatio:aspect,landmarks:o.landmarks.map(p=>{
   const x=(p.x-.5)*scale,y=(p.y-.5)*scale;
   return {x:.5+x*Math.cos(angle)-y*Math.sin(angle),y:(.4+x*Math.sin(angle)+y*Math.cos(angle))*aspect,z:0};
  })}));
  const d=new BurstDetector();assert.equal(d.update(transform(.22),0),false);assert.equal(d.update(transform(.02),140),true);
 }
});
test('ordinary palm claps and parallel fingers no longer activate the reward',()=>{
 const palms=gap=>pair(gap).map(o=>({...o,landmarks:o.landmarks.map((p,i)=>i>=5&&i<=8?{...p,x:o.landmarks[5].x,y:.5-(i-5)*.04}:p)}));
 const d=new BurstDetector();d.update(palms(.2),0);
 for(let t=60;t<600;t+=60)assert.equal(d.update(palms(.02),t),false);
});
test('near palms with distant index tips, folded indexes and vertical misses do not trigger',()=>{
 for(const change of [
  o=>{o.landmarks[8].x+=o.landmarks[8].x<.5?-.2:.2;},
  o=>{o.landmarks[8]={...o.landmarks[5]};},
  (o,i)=>{o.landmarks.forEach(p=>p.y+=i*.2);}
 ]){
  const d=new BurstDetector(),hands=pair(.02);hands.forEach(change);
  for(let t=0;t<500;t+=60)assert.equal(d.update(hands,t),false);
 }
});
test('brief occlusion tolerates return, but one hand, missing data and long gaps never infer contact',()=>{
 const d=new BurstDetector();d.update(pair(.22),0);assert.equal(d.update([],80),false);
 assert.equal(d.update(pair(.02),220),true);
 d.reset();d.update(pair(.22),0);assert.equal(d.update([pair(.02)[0]],100),false);
 assert.equal(d.update(pair(.02),800),false);assert.equal(d.update(pair(.02),940),true);
 d.reset();d.update(pair(.02),0);assert.equal(d.update([],40),false);assert.equal(d.update(pair(.02),400),false);
 assert.equal(d.update([{confidence:.95,landmarks:[{}]}],450),false);
});
test('tracking emits the fingertip burst without also firing a gun, only during an available window',()=>{
 const t=new HandTracking();t.update(pair(.22),0,{burstEnabled:false});
 assert.equal(t.update(pair(.02),60,{burstEnabled:false}).burst,false);
 assert.equal(t.update(pair(.02),120,{burstEnabled:true}).burst,false);
 const result=t.update(pair(.02),260,{burstEnabled:true});assert.equal(result.burst,true);assert.deepEqual(result.shots,[]);
 t.reset();assert.equal(t.update(pair(.02),300,{burstEnabled:false}).burst,false);
});
