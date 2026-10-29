import test from 'node:test';
import assert from 'node:assert/strict';
import {gunPlacement,FINGERTIP} from '../dist/hand-art.mjs';

test('both mirrored fingertips and bullet origins point at the aim across screen sizes',()=>{
  for(const [w,h] of [[1218,694],[364,758]])for(const side of ['left','right']){
    for(const aim of [{x:0,y:0},{x:1,y:0},{x:.5,y:.5},{x:0,y:1},{x:1,y:1}]){
      for(const recoil of [0,1]){
        const p=gunPlacement(side,aim,w,h,recoil),sign=side==='left'?1:-1;
        const dx=Math.cos(p.angle)*sign,dy=Math.sin(p.angle)*sign;
        const tip={x:p.x+dx*FINGERTIP*p.scale,y:p.y+dy*FINGERTIP*p.scale};
        assert.ok(Math.abs(tip.x-p.muzzle.x*w)<1e-8);
        assert.ok(Math.abs(tip.y-p.muzzle.y*h)<1e-8);
        const tx=aim.x*w-tip.x,ty=aim.y*h-tip.y;
        assert.ok(Math.abs(tx*dy-ty*dx)<1e-8,'finger axis must pass through aim');
        assert.ok(tx*dx+ty*dy>0,'fingertip must point towards, not away from, aim');
        assert.ok(dy<0,'hands stay below the target, including bottom corners');
      }
    }
  }
});
