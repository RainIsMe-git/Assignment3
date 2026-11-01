import {FINGERTIP} from './hand-art.mjs';
import {BURST_CONTACT} from './burst.mjs';

// Place the same side-view index drawings tip-to-tip at the contact frame.
export function burstHandPlacement(side,time,w,h){
 const sign=side==='left'?1:-1,scale=Math.min(w/850,h/530)*1.05;
 const u=Math.max(0,Math.min(1,time/BURST_CONTACT)),after=Math.max(0,time-BURST_CONTACT);
 const gap=time<BURST_CONTACT?w*.23*(1-u)*(1-u):Math.max(0,after-.18)*w*.16;
 const x=w*.5-sign*(FINGERTIP*scale+gap),y=h*.76+Math.max(0,after-.18)*h*.16;
 return {x,y,sign,scale,tip:{x:x+sign*FINGERTIP*scale,y}};
}
