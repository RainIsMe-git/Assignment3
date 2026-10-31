import test from 'node:test';
import assert from 'node:assert/strict';
import {readGunPose,GunTrigger} from '../dist/core.mjs';
import {HandTracking} from '../dist/tracking.mjs';

// Synthetic anatomical fixture in metres, pointing into the webcam (-z).
// Its index MCP/PIP/DIP/tip overlap in the image, unlike the old flat fixture.
function forward({three=false,pitch=0,yaw=0,mirror=1,offset=0,aspect=4/3}={}){
  const w=Array.from({length:21},()=>({x:0,y:0,z:0}));
  w[0]={x:0,y:.065,z:.012};
  for(const [i,x,y] of [[5,-.025,0],[9,0,-.005],[13,.022,0],[17,.038,.01]]){
    w[i]={x,y,z:0};w[i+1]={x,y:y-.004,z:-.029};w[i+2]={x,y:y+.019,z:-.031};w[i+3]={x,y:y+.030,z:-.008};
  }
  w[1]={x:-.027,y:.045,z:.010};w[2]={x:-.048,y:.023,z:.002};w[3]={x:-.052,y:-.004,z:-.004};w[4]={x:-.053,y:-.030,z:-.008};
  for(const i of three?[5,9]:[5])for(let j=1;j<=3;j++)w[i+j]={x:w[i].x,y:w[i].y,z:-[0,.03,.052,.070][j]};
  const world=w.map(p=>{
    const y=p.y*Math.cos(pitch)+p.z*Math.sin(pitch),z=-p.y*Math.sin(pitch)+p.z*Math.cos(pitch);
    return {x:(p.x*Math.cos(yaw)-z*Math.sin(yaw))*mirror,y,z:p.x*Math.sin(yaw)+z*Math.cos(yaw)};
  });
  const image=world.map(p=>({x:.5+offset+p.x*2,y:.5+p.y*2*aspect,z:p.z*2}));
  return {worldLandmarks:world,landmarks:image,aspectRatio:aspect,confidence:.8};
}

test('foreshortened forward guns recognize in both hands, shapes and camera aspect ratios',()=>{
  for(const three of [false,true])for(const mirror of [-1,1])for(const aspect of [4/3,16/9,9/16])for(const yaw of [-.7,0,.7]){
    const o=forward({three,mirror,aspect,yaw});
    const p=readGunPose(o.landmarks,o.worldLandmarks,aspect);
    assert.equal(p.gun,true,JSON.stringify({three,mirror,aspect,yaw}));
    assert.equal(p.variant,three?'three':'two');
  }
});

test('camera-facing fingers with zero projected index length use world or depth data',()=>{
  const o=forward();assert.equal(o.landmarks[8].y,o.landmarks[5].y);
  for(const world of [o.worldLandmarks,undefined]){
    const p=readGunPose(o.landmarks,world,o.aspectRatio);assert.equal(p.gun,true);assert.equal(p.lift,0);
  }
});

test('front-facing input ignores other fingers but a closed index still cannot arm',()=>{
  for(const shape of ['palm','fist','thumb','horns']){
    const o=forward(),p=o.worldLandmarks;
    if(shape==='palm'||shape==='horns')for(const i of shape==='palm'?[9,13,17]:[17])for(let j=1;j<=3;j++)p[i+j]={x:p[i].x,y:p[i].y,z:-j*.025};
    if(shape==='fist')for(let j=1;j<=3;j++)p[5+j]={...p[13+j],x:p[5].x};
    if(shape==='thumb'){p[3]={x:-.02,y:.02,z:-.01};p[4]={x:.004,y:.025,z:-.014};}
    assert.equal(readGunPose(o.landmarks,p,o.aspectRatio).gun,shape!=='fist',shape);
  }
});

test('forward wrist recoil fires once, lowering rearms, and distance/translation do not fire',()=>{
  const trigger=new GunTrigger();
  const sample=(pitch,time,scale=1)=>{const o=forward({pitch});return trigger.sample(readGunPose(o.landmarks,o.worldLandmarks.map(p=>({x:p.x*scale+.1,y:p.y*scale-.2,z:p.z*scale+.3})),o.aspectRatio),time);};
  for(let time=0;time<=2240;time+=80)assert.equal(sample(0,time,time%160?1.4:.8),null);
  const shot=sample(.32,2320);assert.equal(shot.charge,1);
  for(let time=2400;time<=2720;time+=80)assert.equal(sample(.32,time),null);
  for(let time=2800;time<=3040;time+=80)assert.equal(sample(0,time),null);
  assert.ok(sample(.32,3120));
});

test('world data travels through dual-hand tracking and simultaneous forward recoil',()=>{
  const tracking=new HandTracking();
  for(let time=0;time<=2240;time+=80)tracking.update([forward({offset:.2}),forward({offset:-.2,mirror:-1,three:true})],time);
  const result=tracking.update([forward({offset:-.2,mirror:-1,three:true,pitch:.32}),forward({offset:.2,pitch:.32})],2320);
  assert.equal(result.valid,2);assert.equal(result.shots.length,2);assert.ok(result.shots.every(s=>s.charge===1));
});

test('a change between world and image coordinates recalibrates without a false shot',()=>{
  const trigger=new GunTrigger();for(let time=0;time<=240;time+=80)trigger.sample({gun:true,lift:0,source:'world'},time);
  assert.equal(trigger.sample({gun:true,lift:.8,source:'depth'},320),null);
});
