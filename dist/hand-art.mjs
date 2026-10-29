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

export function gunPlacement(side,aim,w,h,recoil=0){
  const scale=Math.min(w/1150,h/630);
  // Follow the aim gently so a hand never has to turn upside down at an edge.
  const x=w*(side==='left'?Math.max(.13,Math.min(.44,aim.x-.27)):Math.max(.56,Math.min(.87,aim.x+.27)));
  const y=h*Math.max(.85,aim.y+.15);
  const bearing=Math.atan2(aim.y*h-y,aim.x*w-x);
  const reach=Math.min(FINGERTIP*scale,Math.hypot(aim.x*w-x,aim.y*h-y)*.65);
  const actualScale=reach/FINGERTIP;
  const kick=recoil*8;
  return {x:x-Math.cos(bearing)*kick,y:y-Math.sin(bearing)*kick,scale:actualScale,
    angle:bearing-(side==='right'?Math.PI:0),bearing,
    muzzle:{x:(x+Math.cos(bearing)*(reach-kick))/w,y:(y+Math.sin(bearing)*(reach-kick))/h}};
}
