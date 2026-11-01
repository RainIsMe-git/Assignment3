import test from 'node:test';
import assert from 'node:assert/strict';
import {gunPlacement,VIEW_FINGERTIP} from '../dist/hand-art.mjs';

test('both mirrored fingertips and bullet origins point at the aim across screen sizes',()=>{
  for(const [w,h] of [[1218,694],[364,758]])for(const side of ['left','right']){
    for(const aim of [{x:0,y:0},{x:1,y:0},{x:.5,y:.5},{x:0,y:1},{x:1,y:1}]){
      for(const recoil of [0,1]){
        const p=gunPlacement(side,aim,w,h,recoil);
        const sign=side==='left'?1:-1,c=Math.cos(p.angle),s=Math.sin(p.angle);
        const tip={x:p.x+(c*VIEW_FINGERTIP.x*sign-s*VIEW_FINGERTIP.y)*p.scale,y:p.y+(s*VIEW_FINGERTIP.x*sign+c*VIEW_FINGERTIP.y)*p.scale};
        const dx=Math.cos(p.bearing),dy=Math.sin(p.bearing);
        assert.ok(Math.abs(tip.x-p.muzzle.x*w)<1e-8);
        assert.ok(Math.abs(tip.y-p.muzzle.y*h)<1e-8);
        const tx=aim.x*w-tip.x,ty=aim.y*h-tip.y;
        if(recoil===0)assert.ok(Math.abs(tx*dy-ty*dx)<1e-8,'resting index axis must pass through aim');
        assert.ok(tx*dx+ty*dy>0,'fingertip must point towards, not away from, aim');
        assert.ok(dy<0,'hands point upward, including recoil');
      }
    }
  }
});


import {burstHandPlacement} from '../dist/burst-art.mjs';
import {BURST_CONTACT} from '../dist/burst.mjs';
test('burst gloves meet exactly at their index tips and the energy origin across screen sizes',()=>{
 for(const [w,h] of [[1218,694],[364,758]]){
  const left=burstHandPlacement('left',BURST_CONTACT,w,h),right=burstHandPlacement('right',BURST_CONTACT,w,h);
  assert.ok(Math.abs(left.tip.x-right.tip.x)<1e-8);assert.equal(left.tip.y,right.tip.y);
  assert.equal(left.tip.x,w*.5);assert.equal(left.tip.y,h*.76);
  assert.ok(burstHandPlacement('left',0,w,h).tip.x<left.tip.x);
  assert.ok(burstHandPlacement('right',0,w,h).tip.x>right.tip.x);
 }
});
