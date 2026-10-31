import {clamp,projectPlant,chargeDamage} from './core.mjs';
import {paintGarden} from './backdrop.mjs';
import {perspectiveHandPaths,gunPlacement} from './hand-art.mjs';
import {shotStyle} from './combat-feedback.mjs';
import {HAND_COLORS} from './hand-identity.mjs';
import {CLAP_CONTACT,CLAP_DURATION} from './clap.mjs';
import {clapHandPaths} from './clap-art.mjs';
import {stopHandPaths} from './palm-art.mjs';
const INK='#29242b', CREAM='#fff2d9', GREEN='#4f8a3c';
export class GardenRenderer {
  constructor(canvas){
    this.canvas=canvas;this.c=canvas.getContext('2d');this.t=0;this.effects=[];this.recoil={left:0,right:0};this.hurt=0;this.healthTrails=new Map();
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
    if(type===4){this.path('M-28 14 Q-88 44 -75 87 Q-30 65 0 99 Q30 64 77 87 Q87 38 27 12Z','#354f4d',INK,4);this.path('M-24 28 Q-45 58 -61 74 M24 28 Q48 60 64 74',null,'#a3a967',3);}
    for(const sign of [-1,1]){c.save();c.translate(sign*68,35+sign*sway*4);this.ellipse(0,0,13,15,CREAM,INK,3);this.path('M-5 -6 v9 M1 -8 v9 M7 -5 v7',null,INK,1.5);c.restore();}
    c.save();c.translate(sway*2,-18+Math.sin(time*5+seed)*2);
    const color=flash>0?'#fff6d3':type===4?'#e4c3b4':type===3?'#c8aa74':type===0?'#efc541':type===1?'#c64f3a':'#679c59';
    if(type===4){
      for(let i=0;i<7;i++){c.save();c.rotate(i*Math.PI*2/7);this.path('M-22 -26 Q-52 -53 -24 -102 Q-8 -89 0 -114 Q10 -87 27 -99 Q46 -54 22 -25Z',i%2?'#8e3655':'#c15c72',INK,3);this.path('M0 -48 Q-15 -72 0 -96',null,'#e99b9a',2);c.restore();}
      this.ellipse(0,0,45,47,color,INK,4);this.path('M-36 -45 L-48 -82 L-20 -65 L-13 -107 L3 -77 L25 -108 L27 -63 L50 -83 L37 -43Z','#b1c7ba',INK,3);this.ellipse(4,-61,9,12,'#a93861',INK,2);
    }else if(type===0||type===3){
      for(let i=0;i<9;i++){c.save();c.rotate(i*Math.PI*2/9+Math.sin(time)*.025);c.scale(1,1+Math.sin(i*4)*.1);this.path('M-14 -30 Q-39 -60 -18 -93 Q-3 -105 10 -83 Q33 -64 18 -35Z',type===3?(i%2?'#784b85':'#b36b97'):(i%2?'#e77b27':'#f79c35'),INK,3);if(type===3)this.path('M-19 -66 L-32 -84 L-13 -77 M13 -62 L29 -77 L12 -73',null,'#f0c99b',2);c.restore();}
      this.ellipse(0,0,45,47,color,INK,4);
      this.path('M-34 -19 Q-44 3 -27 25',null,'#f6d785',4);
      if(type===3){this.path('M-30 -45 L-41 -80 L-13 -66 L0 -95 L16 -65 L41 -82 L30 -44Z','#e3b553',INK,3);this.ellipse(0,-65,6,8,'#b94750',INK,2);}
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
    if(type===4)this.path('M-26 -32 l-12 -10 M-21 -36 l-5 -12 M24 -33 l12 -10 M18 -37 l4 -12',null,INK,3);
    this.path('M-34 10 Q-1 30 35 7 Q26 50 -4 43 Q-28 41 -34 10Z',CREAM,INK,3);
    this.path('M-17 20 l3 16 M-2 24 l2 16 M13 21 l2 14 M26 15 l-2 12',null,INK,2);
    this.path('M-29 14 Q0 39 30 9',null,INK,1.6);
    c.restore();c.restore();this.celPaint=false;
  }
  glove(x,y,scale,angle,side,color,alpha=1){
    const c=this.c;c.save();c.globalAlpha=alpha;c.translate(x,y);c.rotate(angle);c.scale(scale*(side==='left'?1:-1),scale);
    for(const [path,fill,width,stroke] of perspectiveHandPaths(color))this.path(path,fill,width?stroke||INK:null,width);
    c.restore();
  }
  stopGlove(side,color,powered){
    const c=this.c,scale=Math.min(this.w/850,this.h/530),x=this.w*(side==='left'?.24:.76),y=this.h*.83;
    c.save();c.translate(x,y);c.rotate(side==='left'?-.10:.10);c.scale(scale*(side==='left'?1:-1),scale);
    for(const [path,fill,width,stroke] of stopHandPaths(color))this.path(path,fill,width?stroke||INK:null,width);
    if(powered){c.strokeStyle='#b38aca';c.lineWidth=3;for(let i=0;i<2;i++){c.beginPath();c.ellipse(0,-8,69+i*13,53+i*12,0,0,Math.PI*2);c.stroke();}}
    c.restore();
  }
  shot(event,hand){
    const idle=this.reducedMotion?0:Math.sin(this.t*2.2+(event.hand==='left'?0:1.6))*2;
    const gun=gunPlacement(event.hand,hand.aim,this.w,this.h,0,idle);
    const style=shotStyle(event.damage);this.recoil[event.hand]=.65+event.damage*.23;this.effects.push({...event,aim:{...event.aim},origin:gun.muzzle,bearing:gun.bearing,life:0,duration:style.duration});
    if(event.hit){for(let i=0;i<style.particles;i++)this.effects.push({particle:true,x:event.aim.x,y:event.aim.y,vx:(Math.random()-.5)*(.14+event.damage*.07),vy:(Math.random()-.7)*(.18+event.damage*.06),life:-style.flight,duration:.35+event.damage*.12,size:2+event.damage,leaf:event.killed&&i%3===0,color:[style.color,style.light,'#6d934c'][i%3]});}
  }
  clear(){this.effects=[];this.healthTrails.clear();this.hurt=0;this.recoil={left:0,right:0};}
  queenAttack(plant,enemyTime){
    const q=plant.duel,c=this.c,w=this.w,h=this.h,p=projectPlant(plant),x=p.x*w,y=p.y*h;
    if(q.phase==='waiting')return;
    if(q.phase==='rest'){this.ellipse(x,y,p.size*h*.63,p.size*h*.84,null,'#a6c9c680',3);return;}
    if(q.phase==='exposed'){this.ellipse(x,y,p.size*h*.7,p.size*h*.9,null,'#f6d471',4);return;}
    const incoming=['attack','reflect'].includes(q.phase),f=incoming?q.flight:.22,colour='#bf779d';
    c.save();c.globalAlpha=.8;c.strokeStyle=colour;c.lineWidth=3;
    for(const sign of [-1,1]){c.beginPath();c.moveTo(x+sign*w*.1,y);c.quadraticCurveTo(x+sign*w*.26,h*.65,x+sign*w*.3,h*.93);c.stroke();}
    c.restore();
    if(q.kind==='push'){
      const r=(25+f*95)*Math.min(w/1000,1.3),oy=y+(h*.85-y)*f;
      c.save();c.translate(x,oy);c.rotate(this.reducedMotion?0:enemyTime*.35);this.ellipse(0,0,r,r,q.phase==='reflect'?'#9b67ac':'#5d485f',INK,3);
      if(q.phase==='reflect'){this.path(`M0 ${r*1.9} L0 ${r*.6} M-10 ${r} L0 ${r*.6} L10 ${r}`,null,'#fff0b5',5);}
      for(let i=0;i<10;i++){c.rotate(Math.PI/5);this.path(`M${r*.8} -5 L${r*1.35} 0 L${r*.8} 8Z`,'#cf9fa1',INK,2);}
      this.ellipse(0,0,r*.65,r*.65,null,'#e1bf91',3);c.restore();
    }else{
      for(let i=0;i<7;i++){const spread=(i-3)*(.025+f*.065)*w,oy=y+f*h*.35+Math.sin(i*2)*12;this.ellipse(x+spread,oy,9+f*12,13+f*14,'#87bab0',INK,2);this.ellipse(x+spread-2,oy-3,3,4,'#fff3d4',null);}
    }
  }
  update(dt,running){this.dt=running?dt:0;this.t+=dt;for(const k of ['left','right'])this.recoil[k]=Math.max(0,this.recoil[k]-dt*5);this.hurt=Math.max(0,this.hurt-dt*2);if(running)for(const fx of this.effects)fx.life+=dt;this.effects=this.effects.filter(e=>e.life<e.duration);}
  drawShot(fx,hands){
    const c=this.c,w=this.w,h=this.h,style=shotStyle(fx.damage),origin={x:fx.origin.x*w,y:fx.origin.y*h},end={x:fx.aim.x*w,y:fx.aim.y*h};
    c.save();
    if(fx.life<.11){
      const idle=this.reducedMotion?0:Math.sin(this.t*2.2+(fx.hand==='left'?0:1.6))*2;
      const gun=gunPlacement(fx.hand,hands[fx.hand].aim,w,h,this.reducedMotion?0:this.recoil[fx.hand],idle);
      c.save();c.translate(gun.muzzle.x*w,gun.muzzle.y*h);c.rotate(gun.bearing);c.scale(.7+fx.damage*.35,.7+fx.damage*.35);
      this.path('M0 0 L9 -8 L5 -16 L20 -9 L30 -17 L29 -5 L45 0 L29 6 L32 16 L19 10 L7 17 L10 7Z',style.color,INK,2);
      this.path('M2 0 L16 -5 L14 -9 L30 0 L15 8 L17 3Z',style.light,null,0);c.restore();
    }
    if(fx.life<style.flight){
      const u=clamp(fx.life/style.flight),reach=Math.hypot(end.x-origin.x,end.y-origin.y)*.52;
      const control={x:origin.x+Math.cos(fx.bearing)*reach,y:origin.y+Math.sin(fx.bearing)*reach};
      const point=t=>({x:(1-t)**2*origin.x+2*(1-t)*t*control.x+t*t*end.x,y:(1-t)**2*origin.y+2*(1-t)*t*control.y+t*t*end.y});
      const tail=Math.max(0,u-(.19+fx.damage*.04)),head=point(u),back=point(tail);
      c.lineCap='round';c.strokeStyle=style.color;c.lineWidth=style.trail+3;c.beginPath();c.moveTo(back.x,back.y);
      for(let i=1;i<=8;i++){const p=point(tail+(u-tail)*i/8);c.lineTo(p.x,p.y);}c.stroke();
      c.strokeStyle=style.light;c.lineWidth=style.trail*.45;c.stroke();
      const angle=Math.atan2(head.y-back.y,head.x-back.x);c.translate(head.x,head.y);c.rotate(angle);
      if(fx.damage===1)this.ellipse(0,0,12,6,style.light,style.color,2.5);
      else if(fx.damage===2){this.path('M-25 0 Q-7 -13 5 -9 Q21 0 5 9 Q-7 13 -25 0Z',style.color,INK,2);this.ellipse(4,0,8,5,style.light,null,0);}
      else{this.ellipse(0,0,18,15,style.color,INK,2.5);this.ellipse(3,-2,10,9,style.light,null,0);c.strokeStyle=style.light;c.lineWidth=2;for(const x of [-23,-34]){c.beginPath();c.ellipse(x,0,4,19,0,0,Math.PI*2);c.stroke();}this.path('M-10 -17 L-3 -23 L3 -16 M-8 18 L0 24 L5 16',null,style.color,2);}
      c.restore();return;
    }
    const impactTime=fx.life-style.flight,t=clamp(impactTime/(style.duration-style.flight));
    if(fx.killed&&fx.plant&&impactTime<.2){
      const p=projectPlant(fx.plant),fade=1-impactTime/.2;c.save();c.globalAlpha=fade;c.translate(end.x,end.y);c.rotate((fx.hand==='left'?-1:1)*impactTime*2);this.plant(0,-impactTime*80,p.size*h*.65*(.8+fade*.2),fx.type,this.t,.12,fx.plant.seed);c.restore();
    }
    c.translate(end.x,end.y);c.globalAlpha=1-t;
    for(let i=0;i<style.rings;i++){
      const phase=clamp((impactTime-i*.055)/.35);if(impactTime<i*.055)continue;
      c.globalAlpha=(1-phase)*.8;c.strokeStyle=i%2?style.light:style.color;c.lineWidth=(1-phase)*(fx.damage===3?4:2)+1;
      c.beginPath();c.ellipse(0,0,style.impact*(.65+phase*1.25),style.impact*(.40+phase*.7),-.15,0,Math.PI*2);c.stroke();
    }
    c.globalAlpha=1-t;const r=style.impact*(.75+t*.45);c.rotate(-.12);
    c.beginPath();for(let i=0;i<16;i++){const a=i*Math.PI/8,rr=i%2?r*.45:r;c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}c.closePath();c.fillStyle=style.color;c.fill();c.strokeStyle=INK;c.lineWidth=2.2;c.stroke();
    c.fillStyle=style.light;c.beginPath();for(let i=0;i<12;i++){const a=i*Math.PI/6,rr=(i%2?.3:.57)*r;c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}c.closePath();c.fill();
    c.fillStyle=INK;c.textAlign='center';c.font='italic 900 '+(12+fx.damage*3)+'px Georgia';c.fillText(fx.blocked?'GUARD!':['PIP!','POW!','KABOOM!'][fx.damage-1],0,6);
    const damageLabel=fx.blocked?'⛨':'−'+Number((fx.appliedDamage??fx.damage).toFixed(1));
    c.font='bold '+(14+fx.damage*3)+'px Georgia';c.fillStyle=style.light;c.strokeStyle=INK;c.lineWidth=3;c.strokeText(damageLabel,0,-r-10-t*25);c.fillText(damageLabel,0,-r-10-t*25);
    if(fx.killed){c.font='bold 12px Georgia';c.fillStyle=INK;c.fillText('+'+fx.points,0,r+20);}
    c.restore();
  }
  clapImpact(impacts){for(const impact of impacts)this.effects.push({pulse:true,aim:impact.aim,life:0,duration:.55});}
  drawClap(time){
    const c=this.c,w=this.w,h=this.h,u=clamp(time/CLAP_CONTACT),after=Math.max(0,time-CLAP_CONTACT);
    const separation=time<CLAP_CONTACT?.22*(1-u*u)+.018:.018+Math.min(.12,after*.22),scale=Math.min(w/850,h/530)*.93;
    for(const side of ['left','right']){
      const sign=side==='left'?1:-1;c.save();c.translate(w*(.5-sign*separation),h*(.78+after*.10));c.rotate(sign*(.2+(time<CLAP_CONTACT?.16*(1-u):-.12*after)));c.scale(sign*scale*.64,scale);
      for(const [path,fill,width,stroke] of clapHandPaths(HAND_COLORS[side]))this.path(path,fill,width?stroke||INK:null,width);c.restore();
    }
    if(time>=CLAP_CONTACT){
      const progress=clamp(after/.6);c.save();c.globalAlpha=(1-progress)*.8;
      this.ellipse(w*.5,h*.65,w*(.03+progress*.8),h*(.03+progress*.6),null,'#e9baff',6*(1-progress)+1);
      if(after<.18){c.translate(w*.5,h*.65);for(let i=0;i<8;i++){c.rotate(Math.PI/4);this.path('M22 0 L48 0 M30 -6 L43 -8',null,'#fff0b2',4);}}
      c.restore();
    }
  }
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
      if(game.palm?.active){
        const power=game.palm.active,c0='#ae88c4';c.save();c.strokeStyle=c0;c.lineWidth=power===2?5:3;
        for(let i=0;i<4;i++){const phase=((this.reducedMotion?0:this.t*.65)+i/4)%1;c.globalAlpha=(1-phase)*.30;c.beginPath();c.ellipse(w*.5,h*(.85-phase*.43),w*(.14+phase*.43),h*(.04+phase*.03),0,0,Math.PI*2);c.stroke();}c.restore();
      }
      // Keep the pre-hit cel visible until the bullet arrives. Game rules stay
      // immediate and deterministic; only the presentation is delayed.
      const pending=new Map();
      for(const fx of this.effects)if(fx.plant&&fx.life<shotStyle(fx.damage).flight&&!pending.has(fx.targetId))pending.set(fx.targetId,fx.plant);
      const plants=[...game.plants.filter(p=>!pending.has(p.id)),...pending.values()];
      for(const plant of plants.sort((a,b)=>a.depth-b.depth)){
        const p=projectPlant(plant),impact=this.effects.some(f=>f.targetId===plant.id&&f.life>=shotStyle(f.damage).flight&&f.life<shotStyle(f.damage).flight+.13);this.plant(p.x*w,p.y*h,p.size*h*.65,plant.type,game.enemyTime,impact?.15:pending.has(plant.id)?0:plant.flash,plant.seed);
        if(!plant.boss){
          const bw=Math.max(28,p.size*h*.7),bx=p.x*w-bw/2,by=p.y*h-p.size*h*.85,ratio=clamp(plant.hp/plant.maxHp);
          const previous=this.healthTrails.get(plant.id)??1,trail=Math.max(ratio,previous-(this.dt||0)*1.3);this.healthTrails.set(plant.id,trail);
          c.fillStyle='#3d3335';c.fillRect(bx-1,by-1,bw+2,7);c.fillStyle='#dfaa63';c.fillRect(bx,by,bw*trail,5);c.fillStyle='#a4bb77';c.fillRect(bx,by,bw*ratio,5);
        }
        if(game.palm?.active)this.ellipse(p.x*w,p.y*h+p.size*h*.65,p.size*h*.5,8,null,'#ae88c4',2.5);
      }
      for(const id of this.healthTrails.keys())if(!plants.some(p=>p.id===id))this.healthTrails.delete(id);
      const queen=game.plants.find(p=>p.finalBoss);if(queen)this.queenAttack(queen,game.enemyTime);
      for(const side of ['left','right']){
        if(game.clapTime>0)continue;
        const hand=hands[side],color=HAND_COLORS[side];
        if(hand.stopping){this.stopGlove(side,color,game.palm?.active||0);continue;}
        const idle=this.reducedMotion?0:Math.sin(this.t*2.2+(side==='left'?0:1.6))*2;
        const gun=gunPlacement(side,hand.aim,w,h,this.reducedMotion?0:this.recoil[side],idle);
        const ax=hand.aim.x*w,ay=hand.aim.y*h;
        if(hand.visible && hand.target){
          const p=projectPlant(hand.target),ax=p.x*w,ay=p.y*h;
          // Only a reticle over the enemy. Concentric arcs distinguish shared targets.
          const radius=side==='left'?18:25;
          c.save();c.translate(ax,ay);c.strokeStyle=color;c.lineWidth=2.5;
          for(let i=0;i<4;i++){c.rotate(Math.PI/2);c.beginPath();c.arc(0,0,radius,-.3,.3);c.stroke();c.beginPath();c.moveTo(radius-3,0);c.lineTo(radius+5,0);c.stroke();}
          this.ellipse(0,0,2,2,CREAM,color,1);c.restore();
        }
        this.glove(gun.x,gun.y,gun.scale,gun.angle,side,color,hand.visible?1:.24);
        if(hand.visible && hand.charge>.025){
          const q=hand.charge,full=q>=.999,mx=gun.muzzle.x*w,my=gun.muzzle.y*h;
          const pulse=this.reducedMotion?0:Math.sin(this.t*5)*1.5;
          const r=(7+q*13+(full?pulse:0))*Math.min(1,gun.scale),style=shotStyle(chargeDamage(q)),glow=style.color;
          c.save();c.translate(mx,my);
          const halo=c.createRadialGradient(0,0,2,0,0,r*2.8);halo.addColorStop(0,style.light+'dd');halo.addColorStop(.32,glow+'88');halo.addColorStop(1,glow+'00');c.fillStyle=halo;c.beginPath();c.arc(0,0,r*2.8,0,Math.PI*2);c.fill();
          // Inked energy flecks spiral inward instead of a barely visible halo.
          const count=6+Math.floor(q*10),clock=this.reducedMotion?0:this.t;
          for(let i=0;i<count;i++){
            const phase=(clock*(.8+q*.6)+i/count)%1,angle=i*2.399+clock*(full?2.4:1.3);
            const distance=r+8+(1-phase)*(16+q*25),x=Math.cos(angle)*distance,y=Math.sin(angle)*distance*.75;
            c.save();c.translate(x,y);c.rotate(angle);c.globalAlpha=.3+phase*.7;
            this.path('M-5 0 L0 -2 L5 0 L0 2Z',style.light,glow,1.4);c.restore();
          }
          for(let orbit=0;orbit<2;orbit++){
            c.save();c.rotate(clock*(orbit?-.9:1.2)+orbit*1.3);c.strokeStyle=glow;c.lineWidth=2+q;c.beginPath();c.ellipse(0,0,r+12+orbit*7,(r+12)*.5,0,.25,Math.PI*1.85);c.stroke();c.restore();
          }
          if(q>.5){
            const rays=full?6:3;c.strokeStyle=style.light;c.lineWidth=2.2;
            for(let i=0;i<rays;i++){const a=i*Math.PI*2/rays+clock*.7,reach=r+15+(full?8:0);c.save();c.rotate(a);this.path(`M${r+2} 0 l6 -4 l-2 7 L${reach} 0`,null,glow,3);c.restore();}
          }
          c.strokeStyle=glow;c.lineWidth=3;c.beginPath();c.arc(0,0,r+7,-Math.PI/2,-Math.PI/2+q*Math.PI*2);c.stroke();
          this.ellipse(0,0,3+q*5,3+q*5,style.light,glow,2);
          for(let i=0;i<3;i++){const angle=i*Math.PI*2/3+(this.reducedMotion?0:this.t*1.8);this.ellipse(Math.cos(angle)*(r+7),Math.sin(angle)*(r+7),2+q*2,2+q*2,CREAM,glow,1);}
          if(full){c.rotate(this.reducedMotion?0:this.t*.4);this.path('M-4 -32 L0 -39 L4 -32 M29 3 L36 0 L29 -3',null,'#fff1b0',2.5);}
          c.restore();
        }
      }
      if(game.clapTime>0)this.drawClap(CLAP_DURATION-game.clapTime);
      for(const fx of this.effects){
        if(fx.life<0)continue;
        if(fx.pulse){const u=fx.life/fx.duration;c.save();c.globalAlpha=1-u;this.ellipse(fx.aim.x*w,fx.aim.y*h,20+u*55,12+u*35,null,'#eed29c',4);c.restore();continue;}
        if(!fx.particle){this.drawShot(fx,hands);continue;}
        const t=fx.life/fx.duration;c.save();c.globalAlpha=1-t;
        const x=(fx.x+fx.vx*t)*w,y=(fx.y+fx.vy*t+.1*t*t)*h;c.translate(x,y);c.rotate(t*7);
        if(fx.leaf)this.path('M-8 0 Q-2 -12 8 0 Q1 10 -8 0Z',fx.color,INK,1.3);
        else this.ellipse(0,0,fx.size,fx.size*1.5,fx.color,INK,1);
        c.restore();
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
