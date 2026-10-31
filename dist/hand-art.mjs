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

// First-person back-of-hand view. The broad wrist is nearest the viewer;
// the tapered index recedes into the garden. These are deliberately separate
// from the side-on instructional icons above.
export const VIEW_FINGERTIP={x:0,y:-76};
export function perspectiveHandPaths(variant='two',cuff='#4c8a87'){
  return [
    ['M-37 57 Q-47 99 -63 145 L48 145 Q31 103 31 56Z','#343039',3.5],
    ['M-37 57 Q-3 69 31 56 L34 79 Q-4 91 -43 78Z',cuff,3.5],
    ['M-38 57 Q-47 29 -40 8 Q-34 -10 -20 -12 Q-3 -14 13 -6 C27 -8 38 5 38 20 Q42 41 27 62 Q-4 76 -38 57Z','#fff6e3',3.5],
    ['M-38 28 Q-30 54 -5 58 Q15 62 31 46 L27 62 Q-4 76 -38 57 Q-43 42 -38 28Z','#c8beb8',0],
    // Receding index: wider at the near knuckle, narrower at its distant tip.
    ['M-24 12 C-25 -5 -19 -22 -13 -39 L-9 -66 Q-8 -76 0 -76 Q9 -76 10 -66 L12 -41 C19 -23 22 -7 15 9 Q-4 20 -24 12Z','#fff6e3',3.3],
    ['M7 -64 L9 -40 Q19 -15 14 7 L7 11 Q10 -14 3 -38Z','#d4cac1',0],
    ['M-9 -37 Q0 -42 10 -37 M-13 -19 Q0 -24 14 -18',null,1.7,'#9e918a'],
    ['M-5 -66 Q-3 -71 1 -71',null,2,'#ffffff'],
    ...(variant==='three'?[
      ['M-39 16 Q-40 -3 -34 -20 L-26 -51 Q-23 -60 -16 -58 Q-9 -57 -10 -48 L-15 -17 Q-10 -3 -14 13Z','#fff6e3',3],
      ['M-31 -14 Q-24 -18 -16 -14',null,1.7,'#9e918a'],
    ]:[
      ['M-37 8 Q-33 -3 -23 1 Q-14 5 -16 18 L-20 29 Q-31 36 -39 25Z','#fff6e3',3],
      ['M-34 9 Q-27 6 -23 11',null,1.7,'#9e918a'],
    ]),
    ['M-39 28 Q-35 16 -24 21 Q-16 25 -20 37 Q-27 45 -37 40Z','#fff6e3',2.8],
    ['M-35 43 Q-28 32 -19 39 Q-14 45 -21 53 Q-29 57 -35 51Z','#fff6e3',2.7],
    // Raised thumb on the inside of each hand, seen over the dorsal web.
    ['M15 28 Q17 10 27 -3 L32 -22 C34 -33 44 -34 48 -25 Q51 -17 46 -7 L40 13 Q41 27 31 38 Q21 45 10 40','#fff6e3',3.2],
    ['M33 0 Q39 -1 44 3 M18 24 Q24 19 31 21',null,1.8,'#9e918a'],
    // Three glove seams converge toward the distant knuckles.
    ['M-12 49 L-10 32 M-2 51 L0 30 M8 49 L10 33',null,2.3],
    ['M-30 62 Q-3 72 22 62',null,1.6,'#9e918a'],
  ];
}

export function gunPlacement(side,aim,w,h,recoil=0){
  const scale=Math.min(w/850,h/500);
  // Wrists enter from the bottom, with only a small lateral follow. The
  // pointing axis converges on the enemy instead of sliding side-on across it.
  const x=w*((side==='left'?.30:.70)+(aim.x-.5)*.08);
  const y=h*Math.max(.89,aim.y+.18);
  const bearing=Math.atan2(aim.y*h-y,aim.x*w-x);
  const reach=Math.min(-VIEW_FINGERTIP.y*scale,Math.hypot(aim.x*w-x,aim.y*h-y)*.5);
  const actualScale=reach/-VIEW_FINGERTIP.y;
  const kick=recoil*12*scale;
  return {x:x-Math.cos(bearing)*kick,y:y-Math.sin(bearing)*kick,scale:actualScale,
    angle:bearing+Math.PI/2,bearing,
    muzzle:{x:(x+Math.cos(bearing)*(reach-kick))/w,y:(y+Math.sin(bearing)*(reach-kick))/h}};
}
