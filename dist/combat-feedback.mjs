// Shared timing keeps the visible impact and its sound together.
export const SHOT_STYLES=Object.freeze([
  Object.freeze({damage:1,flight:.14,duration:.48,color:'#76c9b4',light:'#e0fff0',radius:7,trail:3,impact:22,rings:0,particles:7,sample:'light'}),
  Object.freeze({damage:2,flight:.18,duration:.62,color:'#e9b64b',light:'#fff1b0',radius:11,trail:6,impact:35,rings:1,particles:13,sample:'medium'}),
  Object.freeze({damage:3,flight:.22,duration:.82,color:'#e57a42',light:'#fff1c3',radius:17,trail:10,impact:52,rings:3,particles:22,sample:'heavy'}),
]);
export const shotStyle=damage=>SHOT_STYLES[Math.max(0,Math.min(2,Math.round(damage)-1))];
