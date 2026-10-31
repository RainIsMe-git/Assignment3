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

// Original cel drawing based on the user's PSYCHOFINGER silhouette reference.
// One stable glove pose: the middle finger never changes the artwork.
export const VIEW_FINGERTIP={x:106,y:-79};
export const VIEW_FINGER_BASE={x:46,y:-27};
export function perspectiveHandPaths(cuff='#4c8a87'){
  return [
    // Match the lower left hand in the supplied reference: broad wrist,
    // thumb sweeping into the palm, and an index projecting above the fist.
    ['M-107 39 L-168 125 L-30 185 L43 104Z','#343039',4.6],
    ['M-103 37 L-119 57 L26 131 L42 107Z',cuff,4.2],
    ['M-91 21 C-79 -5 -62 -30 -50 -46 C-37 -67 -27 -82 -26 -105 C-27 -120 -18 -130 -6 -128 C12 -127 22 -108 21 -87 C21 -67 11 -49 8 -40 C32 -49 59 -65 82 -81 C95 -92 106 -93 111 -82 C117 -69 102 -53 88 -43 C73 -32 59 -25 48 -20 L47 -1 C67 -7 87 -7 91 7 C98 21 91 36 87 43 C89 59 80 75 65 77 C50 93 38 98 27 99 C-3 82 -46 49 -91 21Z','#fff1d9',4.8],
    // Warm cloth shadow only along the underside; keep the palm one shape.
    ['M-87 20 Q-23 64 30 85 Q58 85 73 70 Q61 91 27 99 Q-13 73 -91 21Z','#d8c8b1',0],
    ['M9 -110 Q23 -88 10 -57 L2 -41 Q0 -35 8 -31 L16 -38 Q8 -23 -1 -30 Q-9 -37 1 -61 Q11 -87 9 -110Z','#dfd0b8',0],
    ['M48 -24 Q77 -40 94 -56 Q110 -69 111 -78 Q117 -64 88 -43 L48 -20Z','#dbc8ac',0],
    // Thumb and index glove highlights, without painted fingernails.
    ['M-18 -104 Q-20 -120 -7 -121 M87 -77 Q99 -86 104 -79',null,3,'#fffdf0'],
    ['M8 -40 Q14 -18 17 7 Q20 28 15 48 M47 -29 L46 -2',null,3.6],
    // Three folded fingers are connected hooked bands, not separate ovals.
    ['M21 8 C39 2 58 7 77 -3 C87 -8 94 -1 94 11 C95 25 86 31 71 34 C50 39 28 33 21 26Z','#fff1d9',4],
    ['M22 30 Q49 42 76 32 Q89 26 86 43 C84 57 70 62 54 61 Q32 59 20 49Z','#fff1d9',3.9],
    ['M20 51 Q43 64 69 59 Q81 56 75 70 C68 84 46 88 30 77 Q17 69 20 51Z','#fff1d9',3.7],
    ['M28 27 Q49 34 70 28 M27 50 Q49 58 67 51 M29 71 Q47 80 62 72',null,2,'#cbbb9f'],
    // Back-of-glove seams follow the diagonal wrist instead of a flat icon.
    ['M-47 9 l17 12 M-53 19 l16 12 M-58 29 l15 11',null,2.6],
    ['M-94 20 Q-31 67 31 99 L39 111 Q-27 84 -105 38Z','#fff1d9',4.2],
    ['M-93 35 Q-26 80 25 103',null,1.8,'#bdab92'],
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
