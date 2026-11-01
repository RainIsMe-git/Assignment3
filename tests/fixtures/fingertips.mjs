// Synthetic inward-pointing index fingers. Never a real camera recording.
export function fingertipPair(gap=.2){
 return [1,-1].map(sign=>{
  const tip=.5-sign*gap/2,base=tip-sign*.14;
  const p=Array.from({length:21},()=>({x:base,y:.55,z:0}));
  p[0]={x:base-sign*.07,y:.63,z:0};
  for(const [j,i] of [5,9,13,17].entries()){
   p[i]={x:base-sign*j*.012,y:.5+j*.035,z:0};
   p[i+1]={x:base+sign*.025,y:.52+j*.035,z:0};
   p[i+2]={x:base-sign*.01,y:.54+j*.035,z:0};
   p[i+3]={x:base-sign*.03,y:.51+j*.035,z:0};
  }
  for(let j=0;j<4;j++)p[5+j]={x:base+sign*.14*j/3,y:.5,z:0};
  return {landmarks:p,confidence:.95,handedness:sign===1?'Right':'Left'};
 });
}
