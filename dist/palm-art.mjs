// Back of the player's left glove: four rounded fingers, thumb toward the centre.
// Mirror the complete drawing for the right hand; never swap its cuff identity.
export function stopHandPaths(cuff='#367f7d'){
  return [
    ['M-34 51 L-57 133 L48 137 L34 51Z','#343039',4],
    ['M-35 49 Q0 64 35 49 L39 76 Q0 92 -41 72Z',cuff,4],
    ['M-35 52 C-47 33 -49 10 -48 -14 L-50 -59 C-51 -76 -34 -80 -29 -65 L-26 -35 L-29 -87 C-30 -105 -10 -108 -6 -89 L-3 -43 L-4 -98 C-5 -117 16 -118 19 -99 L22 -44 L22 -85 C22 -103 42 -101 43 -84 L46 -17 C54 -30 68 -36 76 -25 C85 -12 68 -1 59 10 C49 21 48 43 34 54 Q2 73 -35 52Z','#fff1d9',4],
    ['M-34 48 Q-6 62 22 52 Q36 45 40 27 Q40 49 30 57 Q-3 72 -34 54Z','#d9cbb5',0],
    ['M-26 -35 L-25 -14 M-3 -43 L0 -19 M22 -44 L24 -19',null,2.2,'#998474'],
    ['M-18 13 Q-16 26 -12 35 M-3 10 Q0 23 2 33 M12 11 Q15 23 17 31',null,2.7,'#51483d'],
    ['M-36 51 Q0 68 35 51 L36 65 Q0 82 -39 65Z','#fff1d9',3.5],
  ];
}
