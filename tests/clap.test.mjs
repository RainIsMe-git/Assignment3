import test from 'node:test';
import assert from 'node:assert/strict';
import {GardenGame} from '../dist/core.mjs';
import {ClapDetector,CLAP_DAMAGE,CLAP_WINDOW} from '../dist/clap.mjs';
import {HandTracking} from '../dist/tracking.mjs';
const advance=(g,t)=>{const events=[];for(let i=0;i<Math.ceil(t*10);i++)events.push(...g.tick(.1));return events;};
function hand(x){const p=Array.from({length:21},()=>({x,y:.55,z:0}));p[0].y=.65;for(const [j,i] of [5,9,13,17].entries())for(let k=0;k<4;k++)p[i+k]={x:x+(j-1.5)*.025,y:.55-k*.04,z:0};return {landmarks:p,confidence:.95,handedness:x<.5?'Right':'Left'};}
const pair=gap=>[hand(.5-gap/2),hand(.5+gap/2)];
test('20 hits stores one clap instead of explosive bullets; contact damages the full screen once',()=>{
 const g=new GardenGame();for(let i=0;i<19;i++){g.plants=[];g.spawn(0,.5,0);g.shoot('left');}assert.equal(g.clapReady,false);
 g.plants=[];for(const lane of [-.9,0,.9])g.spawn(lane,.6,2);const last=g.plants[2];const event=g.shoot('left',0,['left']);assert.equal(event.clapUnlocked,true);assert.equal(last.hp,last.maxHp);assert.equal(g.clapReady,true);
 const combo=g.combo,hits=g.hits;assert.equal(g.clap(),true);assert.equal(g.clap(),false);g.tick(.1);assert.equal(last.hp,last.maxHp);
 g.pause('test');advance(g,2);assert.equal(last.hp,last.maxHp);g.resume();const events=advance(g,.9);assert.equal(events.filter(e=>e.type==='clap-impact').length,1);assert.equal(g.kills,22);assert.equal(g.combo,combo);assert.equal(g.hits,hits);assert.equal(g.clapReady,false);
});
test('clap is one stored charge, survives damage, never bypasses queen seals, and resets',()=>{
 const g=new GardenGame();g.clapReady=true;g.combo=39;g.plants=[];g.spawn(0,.5,3);assert.equal(g.shoot('right').clapUnlocked,true);
 g.hurt(1,[]);assert.equal(g.clapReady,true);g.plants=[];g.spawn(0,.1,4);const q=g.plants[0];q.duel.phase='rest';q.hp=60;
 g.clap();advance(g,.4);assert.equal(q.hp,60);g.reset();assert.equal(g.clapReady,false);assert.equal(g.clapTime,0);
});
test('continuous charge damage and health allow fractional bar changes',()=>{
 const g=new GardenGame();g.plants=[];g.spawn(0,.5,3);const p=g.plants[0];g.shoot('right',.37);assert.ok(Math.abs(p.hp-18.26)<1e-8);assert.equal(CLAP_DAMAGE,2.5);
});
test('open hands moving together trigger once; holding, starting overlapped, and long occlusion do not',()=>{
 const c=new ClapDetector();assert.equal(c.update(pair(.4),0),false);assert.equal(c.update(pair(.3),40),false);assert.equal(c.update(pair(.12),80),true);
 for(let t=100;t<500;t+=40)assert.equal(c.update(pair(.1),t),false);
 c.reset();assert.equal(c.update(pair(.1),0),false);assert.equal(c.update(pair(.1),40),false);
 c.reset();c.update(pair(.4),0);assert.equal(c.update(pair(.1),500),false);
});
test('near-contact merging tolerates one missing hand, but unrelated disappearance and guns do not clap',()=>{
 const c=new ClapDetector();c.update(pair(.4),0);c.update(pair(.20),50);assert.equal(c.update([hand(.5)],90),true);
 c.reset();c.update(pair(.4),0);assert.equal(c.update([hand(.5)],50),false);
 const guns=gap=>pair(gap).map(o=>{for(const i of [9,13,17]){o.landmarks[i+2].y=.60;o.landmarks[i+3].y=.57;}return o;});
 c.reset();c.update(guns(.4),0);assert.equal(c.update(guns(.1),50),false);
 c.reset();c.update(pair(.4),0);c.update(guns(.3),40);assert.equal(c.update(guns(.1),80),false);
});
test('tracking reports a clap without also firing index shots',()=>{
 const t=new HandTracking();t.update(pair(.4),0);t.update(pair(.3),40);const result=t.update(pair(.12),80);assert.equal(result.clap,true);assert.deepEqual(result.shots,[]);t.reset();assert.equal(t.update(pair(.1),120).clap,false);
});

test('clap window expires after eight active seconds, pauses, and refreshes on the next milestone',()=>{
 const g=new GardenGame();g.clapReady=true;g.pause('manual');advance(g,10);assert.equal(g.clapRemaining,CLAP_WINDOW);g.resume();advance(g,8.1);assert.equal(g.clapReady,false);assert.equal(g.clap(),false);
 g.combo=39;g.spawn(0,.8,3);assert.equal(g.shoot('left').clapUnlocked,true);assert.equal(g.clapRemaining,8);advance(g,2);g.combo=59;g.spawn(0,.8,3);g.shoot('right');assert.equal(g.clapRemaining,8);
});
test('clap tolerates slow inference and brief missing frames during a confirmed approach',()=>{
 const c=new ClapDetector();c.update(pair(.4),0);c.update(pair(.28),220);assert.equal(c.update([],270),false);assert.equal(c.update(pair(.14),430),true);
 c.reset();c.update(pair(.4),0);c.update(pair(.24),100);assert.equal(c.update([hand(.5)],250),true);
});
test('changing hand distance from the lens without bringing palms together does not clap',()=>{
 const c=new ClapDetector();c.update(pair(.4),0);
 const bigger=pair(.4).map(o=>({...o,landmarks:o.landmarks.map(p=>({...p,y:.6+(p.y-.6)*3}))}));assert.equal(c.update(bigger,80),false);
});
