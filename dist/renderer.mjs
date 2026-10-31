import {clamp,projectPlant} from './core.mjs';
import {paintGarden} from './backdrop.mjs';
import {perspectiveHandPaths,gunPlacement} from './hand-art.mjs';
const INK='#29242b', CREAM='#fff2d9', GREEN='#4f8a3c';
export class GardenRenderer {
  constructor(canvas){
    this.canvas=canvas;this.c=canvas.getContext('2d');this.t=0;this.effects=[];this.recoil={left:0,right:0};this.hurt=0;
    this.background=document.createElement('canvas');this.grain=document.createElement('canvas');
    this.film=true;this.reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.resize();this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas);
  }
  resize(){
    const r=this.canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);
    this.w=Math.max(1,r.width);this.h=Math.max(1,r.height);this.canvas.width=this.w*dpr;this.canvas.height=this.h*dpr;
    this.c.setTransform(dpr,0,0,dpr,0,0);this.makeBackground();
  }
  pigment(color){
    if(!this.celPaint || !/^#[a-f0-9]{6}$/i.test(color))return color;
    const g=this.c.createLinearGradient(-45,-80,45,70);g.addColorStop(0,color);g.addColorStop(.5,color);g.addColorStop(1,this.shade(color,.76));return g;
  }
  shade(color,factor){return '#'+color.slice(1).match(/../g).map(v=>Math.round(parseInt(v,16)*factor).toString(16).padStart(2,'0')).join('');}
  path(d,fill,stroke=INK,width=3){const c=this.c;c.beginPath();const p=new Path2D(d);if(fill){c.fillStyle=this.pigment(fill);c.fill(p);}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.lineJoin='round';c.lineCap='round';c.stroke(p);}}
  ellipse(x,y,rx,ry,fill,stroke=INK,lw=3){const c=this.c;c.beginPath();c.ellipse(x,y,Math.abs(rx),Math.abs(ry),0,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke();}}
  makeBackground(){
    paintGarden(this.background);
    this.grain.width=800;this.grain.height=450;
    const gc=this.grain.getContext('2d'),pixels=gc.createImageData(800,450);
    let seed=83;for(let i=0;i<pixels.data.length;i+=4){seed=seed*16807%2147483647;pixels.data[i]=71;pixels.data[i+1]=55;pixels.data[i+2]=47;pixels.data[i+3]=(seed%29);}
    gc.putImageData(pixels,0,0);
  }
  leaf(x,y,angle,scale=1){const c=this.c;c.save();c.translate(x,y);c.rotate(angle);c.scale(scale,scale);this.path('M0 0 Q-43 -55 -83 -31 Q-69 18 0 0Z','#648449',INK,3);this.path('M-5 -3 L-67 -25',null,'#35482d',2);c.restore();}
  plant(x,y,size,type,time,flash=0,seed=0){
    time=this.reducedMotion?0:Math.floor(time*18)/18;
    const c=this.c;c.save();c.translate(x,y);c.scale(size/100,size/100);const sway=Math.sin(time*3+seed);
    c.scale(1+sway*.026,1-sway*.025);this.celPaint=true;
    c.shadowColor='#4a343e40';c.shadowBlur=1.1;c.shadowOffsetX=.6;
    this.ellipse(0,101,64,12,'#4b482d33',null);c.rotate(sway*.035);
    // Rubber-hose stem, arms and oversized shoes.
    this.path(`M-8 51 Q${-28+sway*8} 70 -23 91 M10 51 Q${35+sway*8} 71 28 94`,null,INK,12);
    this.ellipse(-31,94+sway*3,26,12,'#423e32',INK,3);this.ellipse(35,96-sway*3,26,12,'#423e32',INK,3);
    this.path('M-3 54 Q-22 20 0 -2',null,INK,19);this.path('M-3 54 Q-22 20 0 -2',null,'#688b4d',12);
    this.path('M-5 48 Q-21 24 -8 4',null,'#a3b96f',3);
    this.path(`M-8 35 Q-57 ${-4+sway*5} -71 35 M5 31 Q61 ${-7-sway*5} 68 31`,null,INK,8);
    this.leaf(-10,44,-.45,.8);this.leaf(8,42,2.8,.8);
    for(const sign of [-1,1]){c.save();c.translate(sign*68,35+sign*sway*4);this.ellipse(0,0,13,15,CREAM,INK,3);this.path('M-5 -6 v9 M1 -8 v9 M7 -5 v7',null,INK,1.5);c.restore();}
    c.save();c.translate(sway*2,-18+Math.sin(time*5+seed)*2);
    const color=flash>0?'#fff6d3':type===0?'#efc541':type===1?'#c64f3a':'#679c59';
    if(type===0){
      for(let i=0;i<9;i++){c.save();c.rotate(i*Math.PI*2/9+Math.sin(time)*.025);c.scale(1,1+Math.sin(i*4)*.1);this.path('M-14 -30 Q-39 -60 -18 -93 Q-3 -105 10 -83 Q33 -64 18 -35Z',i%2?'#e77b27':'#f79c35',INK,3);c.restore();}
      this.ellipse(0,0,45,47,color,INK,4);
      this.path('M-34 -19 Q-44 3 -27 25',null,'#f6d785',4);
    }else if(type===1){
      this.path('M-36 10 Q-44 -34 -28 -50 Q0 -70 28 -50 Q44 -34 36 10 Q41 52 0 57 Q-39 52 -36 10Z','#e1cf96',INK,4);
      this.path('M-65 -13 Q-60 -80 -10 -83 Q51 -95 67 -14 Q26 3 -65 -13Z',color,INK,4);
      for(const [a,b,r] of [[-32,-39,12],[8,-65,11],[40,-34,10]])this.ellipse(a,b,r,r*.65,CREAM,INK,2);
    }else{
      this.path('M-43 27 V-35 Q-44 -74 0 -75 Q44 -75 44 -35 V26 Q29 60 0 56 Q-31 57 -43 27Z',color,INK,4);
      this.path('M-23 -59 Q-34 -5 -21 34 M23 -60 Q35 -5 22 34',null,'#4a703e',2);
      for(const [a,b] of [[-42,-35],[-44,0],[43,-27],[44,10],[-12,-70],[15,-72]])this.path(`M${a} ${b} l${a<0?-12:12} -10`,null,INK,2);
      this.ellipse(2,-78,13,6,'#ce7152',INK,2);
    }
    // Original pie-cut eyes and a cartoon toothy grin.
    const blink=(time+seed)%4.8>4.62;
    c.save();if(blink){c.translate(0,-15);c.scale(1,.12);c.translate(0,15);}
    this.ellipse(-16,-15,13,22,CREAM,INK,2.8);this.ellipse(15,-15,13,22,CREAM,INK,2.8);
    for(const ex of [-13,12]){this.ellipse(ex,-12,7,13,INK,null);this.path(`M${ex-6} -20 l7 5 -7 2Z`,CREAM,null);}
    c.restore();
    this.path('M-32 -38 Q-14 -43 -3 -28 M3 -28 Q20 -46 32 -37',null,INK,5);
    this.path('M-34 10 Q-1 30 35 7 Q26 50 -4 43 Q-28 41 -34 10Z',CREAM,INK,3);
    this.path('M-17 20 l3 16 M-2 24 l2 16 M13 21 l2 14 M26 15 l-2 12',null,INK,2);
    this.path('M-29 14 Q0 39 30 9',null,INK,1.6);
    c.restore();c.restore();this.celPaint=false;
  }
  glove(x,y,scale,angle,side,color,alpha=1,variant='two'){
    const c=this.c;c.save();c.globalAlpha=alpha;c.translate(x,y);c.rotate(angle);c.scale(scale*(side==='left'?1:-1),scale);
    for(const [path,fill,width,stroke] of perspectiveHandPaths(variant,color))this.path(path,fill,width?stroke||INK:null,width);
    c.restore();
  }
  shot(event,hand){
    const gun=gunPlacement(event.hand,hand.aim,this.w,this.h);
    this.recoil[event.hand]=1+event.charge*.35;this.effects.push({...event,aim:{...event.aim},origin:gun.muzzle,bearing:gun.bearing,life:0,duration:.48});
    if(event.hit){for(let i=0;i<10+event.damage*4;i++)this.effects.push({particle:true,x:event.aim.x,y:event.aim.y,vx:(Math.random()-.5)*.35,vy:(Math.random()-.65)*.4,life:0,duration:.65,color:['#e6b64a','#ebdda9','#6d934c'][i%3]});}
  }
  clear(){this.effects=[];this.hurt=0;this.recoil={left:0,right:0};}
  update(dt,running){this.t+=dt;for(const k of ['left','right'])this.recoil[k]=Math.max(0,this.recoil[k]-dt*5);this.hurt=Math.max(0,this.hurt-dt*2);if(running)for(const fx of this.effects)fx.life+=dt;this.effects=this.effects.filter(e=>e.life<e.duration);}
  draw(game,hands,home){
    const c=this.c,w=this.w,h=this.h;c.clearRect(0,0,w,h);
    c.drawImage(this.background,0,0,w,h);
    if(home){
      const wash=c.createLinearGradient(0,0,w*.62,0);wash.addColorStop(0,'#f1e4c5cc');wash.addColorStop(.6,'#f1e4c599');wash.addColorStop(1,'#f1e4c500');c.fillStyle=wash;c.fillRect(0,0,w*.62,h);
      const narrow=w<650;
      c.save();c.translate(w*.77,h*(narrow?.79:.57));c.rotate(-.07);this.plant(0,0,Math.min(h*.25,w*.15),0,this.t,0,1);c.restore();
      this.plant(w*(narrow?.36:.57),h*(narrow?.88:.72),Math.min(h*.12,w*.075),1,this.t,0,3);
      this.plant(w*.91,h*(narrow?.91:.77),Math.min(h*.135,w*.08),2,this.t,0,5);
    }else{
      for(const plant of [...game.plants].sort((a,b)=>a.depth-b.depth)){
        const p=projectPlant(plant);this.plant(p.x*w,p.y*h,p.size*h*.65,plant.type,this.t,plant.flash,plant.seed);
        for(let i=0;i<plant.maxHp;i++)this.ellipse(p.x*w+(i-(plant.maxHp-1)/2)*9,p.y*h-p.size*h*.79,2.7,2.7,i<plant.hp?CREAM:'#54482c55',INK,1);
      }
      for(const side of ['left','right']){
        const hand=hands[side],color=side==='left'?'#367f7d':'#bd513c';
        const gun=gunPlacement(side,hand.aim,w,h,this.recoil[side]);
        const ax=hand.aim.x*w,ay=hand.aim.y*h;
        if(hand.visible && hand.target){
          const p=projectPlant(hand.target),ax=p.x*w,ay=p.y*h;
          // Only a reticle over the enemy. Concentric arcs distinguish shared targets.
          const radius=side==='left'?18:25;
          c.save();c.translate(ax,ay);c.strokeStyle=color;c.lineWidth=2.5;
          for(let i=0;i<4;i++){c.rotate(Math.PI/2);c.beginPath();c.arc(0,0,radius,-.3,.3);c.stroke();c.beginPath();c.moveTo(radius-3,0);c.lineTo(radius+5,0);c.stroke();}
          this.ellipse(0,0,2,2,CREAM,color,1);c.restore();
        }
        this.glove(gun.x,gun.y,gun.scale,gun.angle,side,color,hand.visible?1:.24,hand.pose?.variant);
        if(hand.visible && hand.charge>.025){
          const q=hand.charge,full=q>=.999,mx=gun.muzzle.x*w,my=gun.muzzle.y*h;
          const pulse=this.reducedMotion?0:Math.sin(this.t*5)*1.5;
          const r=7+q*18+ (full?pulse:0),glow=full?'#efc34d':color;
          c.save();c.translate(mx,my);
          const halo=c.createRadialGradient(0,0,2,0,0,r*2.4);halo.addColorStop(0,full?'#fff2aa9a':color+'88');halo.addColorStop(1,glow+'00');c.fillStyle=halo;c.beginPath();c.arc(0,0,r*2.4,0,Math.PI*2);c.fill();
          c.strokeStyle=glow;c.lineWidth=3;c.beginPath();c.arc(0,0,r+7,-Math.PI/2,-Math.PI/2+q*Math.PI*2);c.stroke();
          this.ellipse(0,0,3+q*8,3+q*8,full?'#fff1b0':'#fff4db',glow,2);
          for(let i=0;i<3;i++){const angle=i*Math.PI*2/3+(this.reducedMotion?0:this.t*1.8);this.ellipse(Math.cos(angle)*(r+7),Math.sin(angle)*(r+7),2+q*2,2+q*2,CREAM,glow,1);}
          if(full){c.rotate(this.reducedMotion?0:this.t*.4);this.path('M-4 -32 L0 -39 L4 -32 M29 3 L36 0 L29 -3',null,'#fff1b0',2.5);}
          c.restore();
        }
      }
      for(const fx of this.effects){
        const t=fx.life/fx.duration;c.save();c.globalAlpha=1-t;
        if(fx.particle){const x=(fx.x+fx.vx*t)*w,y=(fx.y+fx.vy*t+.13*t*t)*h;c.translate(x,y);c.rotate(t*8);this.ellipse(0,0,5,9,fx.color,INK,1.5);}
        else{
          const origin={x:fx.origin.x*w,y:fx.origin.y*h};
          if(fx.life<.09){
            c.save();c.translate(origin.x,origin.y);c.rotate(fx.bearing);c.scale(1+fx.charge,1+fx.charge);
            this.path('M-5 0 L7 -8 L12 -3 L27 0 L12 4 L7 10Z','#fff2ac',INK,1.5);
            c.restore();
          }
          if(t<.35){
            const progress=clamp(t/.35),tail=Math.max(0,progress-.16),end={x:fx.aim.x*w,y:fx.aim.y*h};
            const reach=Math.hypot(end.x-origin.x,end.y-origin.y)*.55;
            const control={x:origin.x+Math.cos(fx.bearing)*reach,y:origin.y+Math.sin(fx.bearing)*reach};
            // Assisted shots leave along the index, then curve gently to the plant.
            const point=u=>({x:(1-u)**2*origin.x+2*(1-u)*u*control.x+u*u*end.x,y:(1-u)**2*origin.y+2*(1-u)*u*control.y+u*u*end.y});
            const head=point(progress),back=point(tail);
            c.lineWidth=4+fx.charge*7;c.strokeStyle=fx.hand==='left'?'#b7e5cc':'#fff0a6';c.beginPath();c.moveTo(back.x,back.y);
            for(let i=1;i<=5;i++){const p=point(tail+(progress-tail)*i/5);c.lineTo(p.x,p.y);}c.stroke();
            const tangent={x:(1-progress)*(control.x-origin.x)+progress*(end.x-control.x),y:(1-progress)*(control.y-origin.y)+progress*(end.y-control.y)};
            c.save();c.translate(head.x,head.y);c.rotate(Math.atan2(tangent.y,tangent.x));this.ellipse(0,0,13+fx.charge*13,6+fx.charge*7,fx.hand==='left'?'#b7e5cc':'#fff0a6',INK,2);c.restore();
            c.restore();continue;
          }
          const x=fx.aim.x*w,y=fx.aim.y*h,r=25+t*35+fx.charge*22;
          c.translate(x,y);c.rotate(-.1);c.beginPath();for(let i=0;i<16;i++){const a=i*Math.PI/8,rr=i%2?r*.47:r;c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}c.closePath();c.fillStyle=fx.hit?'#edc662':'#e1d8b4';c.fill();c.strokeStyle=INK;c.lineWidth=2;c.stroke();
          c.font='italic 900 20px Georgia';c.textAlign='center';c.fillStyle=INK;c.fillText(fx.charge>=.99?'BAM!':fx.hit?(fx.killed?'POP!':'POW!'):'PEW!',0,6);
          if(fx.hit){c.font='bold 15px monospace';c.fillText('−'+fx.damage,0,-r-8);c.font='bold 12px monospace';c.fillText('+'+fx.points,0,r+16);}
        }c.restore();
      }
    }
    if(this.film){
      // Fine print grain and occasional hairline scratches; no flashing frames.
      const step=this.reducedMotion?0:Math.floor(this.t*12),offset=step%4;
      c.save();c.globalAlpha=.72;c.drawImage(this.grain,-offset,-offset,w+4,h+4);c.restore();
      c.fillStyle='#f8d68b0a';c.fillRect(0,0,w,h);
      if(!this.reducedMotion && step%79<3){c.strokeStyle='#fff8dc19';c.lineWidth=.7;c.beginPath();const sx=(step*47%997)/997*w;c.moveTo(sx,h*.1);c.bezierCurveTo(sx-1,h*.4,sx+1,h*.6,sx,h*.9);c.stroke();}
      const v=c.createRadialGradient(w*.5,h*.46,h*.2,w*.5,h*.46,Math.max(w,h)*.67);v.addColorStop(0,'#342b2200');v.addColorStop(1,'#342b2266');c.fillStyle=v;c.fillRect(0,0,w,h);
    }
    if(this.hurt>0){c.fillStyle=`rgba(177,48,30,${this.hurt*.22})`;c.fillRect(0,0,w,h);}
  }
}
