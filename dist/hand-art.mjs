// Side-on cel drawing. The index's centre line is y=0 and its tip is x=112.
// Canvas hands and the instructional SVGs use this same drawing.
export const FINGERTIP = 112;
export function handPaths(variant='two',cuff='#4c8a87'){
  return [
    ['M-46 39 Q-69 69 -65 116 L-20 116 Q-32 74 -13 48Z','#343039',3.5],
    ['M-46 34 Q-34 46 -10 42 L-8 59 Q-34 67 -55 49Z',cuff,3.5],
    // Thumb, web, index, palm: one continuous, rounded silhouette.
    ['M-40 35 C-55 22 -53 3 -45 -13 C-42 -24 -43 -46 -39 -59 C-36 -72 -24 -76 -17 -66 C-10 -56 -14 -39 -15 -29 C-16 -20 -9 -16 0 -17 C24 -20 64 -21 88 -17 C102 -16 112 -9 112 -1 C112 8 103 13 89 14 L32 14 C37 28 27 47 9 51 C-9 58 -28 50 -40 35Z','#fff6e3',3.8],
    ['M-40 30 Q-18 48 4 44 Q23 42 29 30 Q26 49 7 52 Q-19 57 -40 36Z','#c8beb8',0],
    ['M-38 -53 Q-38 -64 -30 -66 M15 -11 Q62 -17 90 -11',null,2,'#ffffff'],
    ...(variant==='three' ? [
      ['M7 16 Q37 13 70 17 Q91 19 93 29 Q94 38 78 39 L25 38 Q9 39 7 16Z','#fff6e3',3.1],
      ['M33 31 Q62 29 79 32',null,1.6,'#c8beb8'],
    ] : [
      ['M10 15 C24 7 40 13 42 24 C44 33 37 39 29 40 C17 41 7 34 3 28','#fff6e3',3.1],
      ['M30 18 Q38 23 34 29',null,1.6,'#c8beb8'],
    ]),
    ['M2 29 C14 23 29 28 31 39 C32 48 25 53 17 52 C7 51 -2 43 -6 38','#fff6e3',3],
    ['M-10 40 C1 36 15 42 14 51 C12 62 -5 57 -17 45','#fff6e3',2.8],
    ['M-39 7 Q-33 15 -32 23 M-29 4 Q-23 12 -22 21 M-19 3 Q-13 10 -12 18',null,2.2],
    ['M-16 -26 Q-23 -20 -23 -11',null,1.9,'#9e918a'],
  ];
}

// Three-quarter finger-gun silhouette: upright thumb, rounded pointing index,
// and three overlapping curled fingers. Warm ivory gloves keep the cel style.
export const VIEW_FINGERTIP={x:92,y:-64};
export const VIEW_FINGER_BASE={x:17,y:-18};
export function perspectiveHandPaths(variant='two',cuff='#4c8a87'){
  return [
    ['M-42 64 L-78 139 L33 155 L36 69Z','#343039',4],
    ['M-44 54 Q-7 73 36 62 L40 85 Q-5 96 -54 75Z',cuff,4],
    // Continuous thumb/palm/index contour, with a generous negative-space web.
    ['M-43 57 C-46 37 -43 16 -39 -2 C-35 -20 -32 -37 -32 -57 C-33 -76 -28 -95 -18 -101 C-9 -108 2 -101 5 -91 C10 -73 3 -53 -2 -37 C-5 -27 -4 -21 4 -20 C24 -29 48 -43 68 -57 C78 -65 88 -69 92 -64 C100 -56 93 -44 82 -36 L39 -6 C48 9 50 30 43 45 C33 66 13 78 -8 74 C-23 70 -35 65 -43 57Z','#fff3dc',4.5],
    ['M-42 45 Q-15 66 5 65 Q28 62 39 45 L43 45 Q33 68 10 75 Q-12 81 -43 57Z','#d3bfa7',0],
    // The pointing finger has one rounded tip and one understated knuckle crease.
    ['M21 -15 Q32 -12 37 -5',null,2.6],
    ['M56 -39 Q69 -47 79 -54',null,2,'#fffdf0'],
    ['M-22 -88 Q-18 -96 -13 -92',null,2.5,'#fffdf0'],
    // Curled fingers overlap the palm from top to bottom, not extra knuckles
    // floating on the back of the index.
    ...(variant==='three'?[
      ['M17 6 Q39 -3 60 -14 C72 -21 81 -20 81 -11 C80 -3 62 7 46 14 L22 23Z','#fff3dc',3.5],
    ]:[
      ['M16 3 C33 -1 51 4 53 15 C54 27 42 32 27 28 L10 23 Q5 14 16 3Z','#fff3dc',3.5],
      ['M21 8 Q32 6 39 11',null,1.8,'#bc9e87'],
    ]),
    ['M10 26 Q30 32 44 29 C53 30 51 42 42 47 C28 52 14 44 6 40 Q2 32 10 26Z','#fff3dc',3.3],
    ['M7 43 Q24 52 38 47 C46 50 40 61 32 63 Q17 66 3 54Z','#fff3dc',3.1],
    ['M-20 -20 Q-8 -9 3 -9 M-25 38 Q-15 46 -6 46',null,2.3],
    ['M-30 28 l11 7 M-28 18 l13 7 M-25 9 l13 7',null,2.2],
  ];
}

export function gunPlacement(side,aim,w,h,recoil=0,idle=0){
  const sign=side==='left'?1:-1;
  const scale=Math.min(w/850,h/530);
  const x=w*(side==='left'?.24:.76)+(aim.x-.5)*w*.025;
  const y=h*Math.max(.86,aim.y+.18)+idle*scale;
  const dx=VIEW_FINGERTIP.x-VIEW_FINGER_BASE.x,dy=VIEW_FINGERTIP.y-VIEW_FINGER_BASE.y;
  const length=Math.hypot(dx,dy),ux=dx/length*sign,uy=dy/length;
  const targetDistance=Math.hypot(aim.x*w-x,aim.y*h-y);
  const actualScale=Math.min(scale,targetDistance/(length*2));
  const offset=(ux*VIEW_FINGERTIP.y-uy*VIEW_FINGERTIP.x*sign)*actualScale;
  const restingAngle=Math.atan2(aim.y*h-y,aim.x*w-x)-Math.atan2(uy,ux)-Math.asin(Math.max(-.9,Math.min(.9,offset/Math.max(1,targetDistance))));
  const kick=Math.max(0,Math.min(1.35,recoil));
  const angle=restingAngle-sign*kick*.22;
  const px=x-sign*kick*7*scale,py=y+kick*12*scale;
  const size=actualScale*(1+kick*.035),cos=Math.cos(angle),sin=Math.sin(angle);
  const tipX=VIEW_FINGERTIP.x*sign*size,tipY=VIEW_FINGERTIP.y*size;
  return {x:px,y:py,scale:size,angle,bearing:angle+Math.atan2(uy,ux),
    muzzle:{x:(px+cos*tipX-sin*tipY)/w,y:(py+sin*tipX+cos*tipY)/h}};
}
