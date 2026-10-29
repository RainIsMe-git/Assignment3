// Layered, original painted scenery. Broad silhouettes and low-contrast washes
// leave the animated cels readable; fine detail is concentrated at the edges.
export function paintGarden(canvas){
  const c=canvas.getContext('2d');canvas.width=1600;canvas.height=900;
  let seed=742;const rand=()=>((seed=seed*16807%2147483647)-1)/2147483646;
  const ellipse=(x,y,rx,ry,color)=>{c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=color;c.fill();};
  function wash(path,base,colors,count=85){
    const p=new Path2D(path);c.save();c.fillStyle=base;c.fill(p);c.clip(p);
    for(let i=0;i<count;i++){
      const x=rand()*1600,y=rand()*900,r=24+rand()*170;
      const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,colors[i%colors.length]);g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);
    }c.restore();
  }
  wash('M0 0H1600V900H0Z','#b8dad8',['#fff9e74d','#6eada21a','#ffffff38'],140);
  // Cloud masses are soft, asymmetrical brush strokes, not outlined bubbles.
  c.save();c.filter='blur(9px)';
  for(let i=0;i<26;i++){const x=250+rand()*1100,y=110+rand()*230;c.globalAlpha=.11+rand()*.11;ellipse(x,y,45+rand()*90,12+rand()*28,'#fffce6');}c.restore();
  wash('M0 450 Q130 361 260 419 Q420 280 597 429 Q760 370 930 433 Q1100 302 1280 412 Q1432 334 1600 422V620H0Z','#9fbca1',['#d9d9a85c','#7da58b38'],110);
  wash('M0 492 Q170 370 361 462 Q504 419 661 474 Q827 411 1000 467 Q1250 380 1600 488V700H0Z','#b3be7b',['#dde1a878','#7b96502b'],130);
  wash('M0 592 Q250 543 480 530 Q720 510 845 495 Q1110 498 1600 575V900H0Z','#d6b993',['#e8d5aa66','#a4845733','#ddc79a55'],220);
  // Far shrub banks preserve an open central clearing.
  wash('M0 499 Q28 430 54 462 Q88 379 120 439 Q149 408 179 453 Q206 417 237 463 Q272 445 291 492 Q339 466 382 523 Q278 576 0 600Z','#90a076',['#d5cf8666','#607a4f55'],100);
  wash('M1030 515 Q1068 460 1112 475 Q1142 395 1172 446 Q1210 412 1247 463 Q1321 378 1387 440 Q1460 391 1600 438V668Q1300 561 1030 515Z','#8c9e70',['#d1cd7a66','#526d4755'],100);
  // Hand-painted trunks with uneven edges and a few broad bark strokes.
  wash('M-65 777 Q81 546 118 318 Q79 233 61 160 L128 130 Q151 255 162 274 Q224 181 289 109 L321 131 Q228 281 195 337 Q147 558 69 793Z','#827b58',['#bb956c88','#525b4266'],100);
  wash('M1460 853 Q1456 637 1486 397 Q1440 256 1384 179 L1440 144 Q1506 257 1525 312 Q1581 251 1625 188 L1650 244 Q1592 371 1553 425 Q1519 672 1583 847Z','#716f4e',['#a98a5e88','#475b4055'],100);
  c.save();c.strokeStyle='#c6aa7c66';c.lineWidth=11;c.lineCap='round';c.beginPath();c.moveTo(48,711);c.bezierCurveTo(119,502,115,422,149,334);c.moveTo(1505,725);c.bezierCurveTo(1489,621,1520,492,1516,422);c.stroke();c.restore();
  function canopy(x,y,rx,ry){
    const pts=[];for(let i=0;i<180;i++){const a=i/180*Math.PI*2,r=1+Math.sin(a*11)*.026+Math.sin(a*19)*.016;pts.push([x+Math.cos(a)*rx*r,y+Math.sin(a)*ry*r]);}
    const p=new Path2D();p.moveTo((pts[179][0]+pts[0][0])/2,(pts[53][1]+pts[0][1])/2);
    pts.forEach((v,i)=>{const n=pts[(i+1)%pts.length];p.quadraticCurveTo(v[0],v[1],(v[0]+n[0])/2,(v[1]+n[1])/2);});p.closePath();
    c.save();c.filter='blur(1.4px)';c.fillStyle='#7d8e51';c.fill(p);c.clip(p);
    const g=c.createLinearGradient(x,y-ry,x,y+ry);g.addColorStop(0,'#3e6248');g.addColorStop(.62,'#688247');g.addColorStop(1,'#aab969');c.fillStyle=g;c.fillRect(x-rx-10,y-ry-10,rx*2+20,ry*2+20);
    for(let i=0;i<600;i++){
      const px=x+(rand()*2-1)*rx,py=y+(rand()*2-1)*ry,r=4+rand()*17;
      c.globalAlpha=.035+rand()*.10;ellipse(px,py,r,r*.7,['#b9b866','#d1cb87','#243e36','#98a358'][i%4]);
    }c.restore();
  }
  canopy(70,60,330,180);canopy(317,6,259,139);canopy(603,-48,230,145);canopy(1100,-35,270,165);canopy(1450,66,290,202);canopy(1620,277,140,228);
  // Scattered colour in the banks: tiny blurred flower dabs, never a field of
  // individually described flowers across the playable clearing.
  c.save();c.filter='blur(1px)';
  for(let i=0;i<530;i++){
    const side=i%2, x=side?1100+rand()*500:rand()*365,y=492+rand()*115+(side?(x-1100)*.1:0);
    c.globalAlpha=.17+rand()*.25;ellipse(x,y,1+rand()*4,2+rand()*4,['#b5af65','#ac6c51','#4f7952','#d6be74'][i%4]);
  }c.restore();
  // Foreground silhouettes provide a soft frame, as in a painted animation set.
  c.save();c.filter='blur(2.3px)';
  for(let i=0;i<70;i++){
    const x=rand()*1600;if(x>330&&x<1270&&i%3)continue;
    const base=925+rand()*40,top=base-50-rand()*95,bend=(rand()-.5)*100;
    c.lineCap='round';c.lineWidth=4+rand()*9;c.strokeStyle=['#4b6342','#596741','#6f7346'][i%3];c.beginPath();c.moveTo(x,base);c.quadraticCurveTo(x+bend*.3,top+50,x+bend,top);c.stroke();
    if(i%4===0){ellipse(x+bend,top,12+rand()*10,10+rand()*9,['#75663d','#a8794b','#7c5048'][i%3]);}
  }c.restore();
  // Grain is painted into the cached backdrop, not regenerated every frame.
  const pixels=c.getImageData(0,0,1600,900);
  for(let i=0;i<pixels.data.length;i+=4){const n=(rand()-.5)*13;pixels.data[i]+=n;pixels.data[i+1]+=n;pixels.data[i+2]+=n;}
  c.putImageData(pixels,0,0);
}
