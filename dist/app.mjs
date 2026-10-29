import { SpellGame, GestureFilter, clamp } from './core.mjs';
import { ArenaRenderer } from './renderer.mjs';
import { HandCamera } from './camera.mjs';

const $=id=>document.getElementById(id);
const game=new SpellGame();
const renderer=new ArenaRenderer($('scene'));
const camera=new HandCamera($('video'),$('landmarks'));
const filter=new GestureFilter();
const arena=document.querySelector('.arena');
const aim={x:.5,y:.46},desired={...aim},castAim={...aim};
let input='none',started=false,gesture='none',pressed=false,loading=false;
let lastHand=0,lastResult=0,resumeSince=0,feedbackUntil=0,manualPending=false;
let soundEnabled=false,audio=null;
const keys=new Set();

function feedback(text,seconds=2.3){$('feedback').textContent=text;feedbackUntil=performance.now()+seconds*1000;}
function playTone(freq,duration=.12,type='sine',gain=.045){
  if(!soundEnabled)return;
  try{
    audio ||= new (window.AudioContext||window.webkitAudioContext)();
    if(audio.state==='suspended')audio.resume().catch(()=>{});
    const o=audio.createOscillator(),v=audio.createGain();o.type=type;o.frequency.setValueAtTime(freq,audio.currentTime);o.frequency.exponentialRampToValueAtTime(freq*1.5,audio.currentTime+duration);v.gain.setValueAtTime(gain,audio.currentTime);v.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(v);v.connect(audio.destination);o.start();o.stop(audio.currentTime+duration);
  }catch{soundEnabled=false;$('sound').textContent='音效不可用';}
}
function showError(message){
  loading=false;$('loading').hidden=true;$('error-message').textContent=message;$('error-box').hidden=false;
  if(started)pause('camera-error','摄像头连接中断',message);
}
function begin(mode){
  input=mode;started=true;gesture='none';pressed=false;filter.reset();keys.clear();manualPending=false;
  game.reset('practice');renderer.reset(true);
  Object.assign(aim,{x:.5,y:.46});Object.assign(desired,aim);Object.assign(castAim,aim);
  $('intro').hidden=true;$('stats').hidden=false;$('bottom-hud').hidden=false;$('error-box').hidden=true;$('result-overlay').hidden=true;$('pause-overlay').hidden=true;
  $('camera-panel').hidden=mode!=='camera';arena.classList.add('playing');
  $('mode-label').textContent='FREE PRACTICE';$('mode-name').textContent='自由练习';$('challenge').hidden=false;$('challenge').disabled=true;
  $('input-hint').textContent=mode==='camera'?'张掌蓄力 → 握拳释放 · 手掌正对镜头':'按住左键或空格蓄力 → 松开发射';
  feedback(mode==='camera'?'先张开手掌，让准星跟随你\n瞄准水晶，蓄力后握拳发射':'先试着击破中央的水晶\n移动鼠标瞄准，按住左键蓄力，松开发射',5);
  if(mode==='camera'){lastHand=0;lastResult=performance.now();pause('lost-hand','请伸出一只手','手掌朝向镜头并张开五指，识别稳定后自动开始。');}
}
function home(){
  camera.stop();input='none';started=false;pressed=false;gesture='none';filter.reset();keys.clear();game.reset();renderer.active=false;
  loading=false;manualPending=false;
  for(const id of ['stats','bottom-hud','camera-panel','pause-overlay','result-overlay','error-box','loading'])$(id).hidden=true;
  $('intro').hidden=false;arena.classList.remove('playing','low-time');$('feedback').textContent='';$('camera-placeholder').hidden=false;$('camera-dot').classList.remove('ready');
}
function pause(reason,title='训练已暂停',text='放松一下手腕。准备好后继续。'){
  if(!started||game.finished)return;
  game.pause(reason);pressed=false;gesture='none';keys.clear();resumeSince=0;
  $('pause-title').textContent=title;$('pause-text').textContent=text;$('pause-overlay').hidden=false;
  $('resume').hidden=reason==='lost-hand'||reason==='camera-error';
}
function resume(){
  if(!started||game.finished)return;
  manualPending=false;
  if(input==='camera'){filter.reset();pause('lost-hand','准备继续','请重新张开手掌，识别稳定后自动继续。');lastResult=performance.now();return;}
  game.resume();gesture='none';pressed=false;$('pause-overlay').hidden=true;
}
function onHand(result){
  if(input!=='camera')return;
  const now=performance.now();lastResult=now;
  if(result.landmarks.length){
    lastHand=now;$('camera-placeholder').hidden=true;$('camera-dot').classList.add('ready');
    const mapped={Open_Palm:'open',Closed_Fist:'fist'}[result.gesture]||'none';
    gesture=filter.sample(mapped,result.confidence,now);
    // Use the palm, not the fingertips; closing a fist otherwise moves the aim.
    if(mapped==='open'&&result.confidence>=.65){
      const palm=[0,5,9,13,17].map(i=>result.landmarks[i]);
      const x=palm.reduce((s,p)=>s+p.x,0)/5,y=palm.reduce((s,p)=>s+p.y,0)/5;
      desired.x=clamp((1-x-.12)/.76,.07,.93);desired.y=clamp((y-.12)/.73,.18,.73);
    }
    $('camera-status').textContent=gesture==='open'?'张掌 · 正在蓄力':gesture==='fist'?'握拳 · 请再次张掌': '已检测到手 · 请张开五指';
    if(game.pauseReason==='lost-hand'){
      if(gesture==='open'){
        resumeSince ||= now;
        $('pause-text').textContent='已识别张掌，保持片刻…';
        if(now-resumeSince>=600){game.resume();$('pause-overlay').hidden=true;gesture='none';filter.reset();resumeSince=0;feedback('识别已恢复 · 张掌蓄力',1.5);}
      }else resumeSince=0;
    }
  }else{
    filter.reset();gesture='none';game.cancelCharge();resumeSince=0;
    $('camera-placeholder').hidden=false;$('camera-dot').classList.remove('ready');$('camera-status').textContent='未检测到手 · 请完整入镜';
    if(started&&!game.pauseReason&&!game.finished)pause('lost-hand','暂时看不到你的手','计时已暂停。把手放回画面并张开五指，即可继续。');
  }
}
async function startCamera(){
  if(loading)return;
  home();loading=true;input='camera';$('error-box').hidden=true;$('loading').hidden=false;
  try{
    const ready=await camera.start(onHand,text=>{$('loading-text').textContent=text;},message=>showError(message));
    if(!ready||input!=='camera')return;
    loading=false;$('loading').hidden=true;begin('camera');
  }catch(error){showError(error.message);}
}
function challenge(){
  if(!started||!game.practiceComplete||game.pauseReason)return;
  game.reset('challenge');renderer.reset(false);gesture='none';pressed=false;filter.reset();
  $('mode-label').textContent='TIMED CHALLENGE';$('mode-name').textContent='星辉试炼';$('challenge').hidden=true;
  feedback('试炼开始 · 60 秒\n连续命中可获得连击加分',3);playTone(390,.22);
}
function finish(){
  pressed=false;gesture='none';keys.clear();
  $('final-score').textContent=game.score;
  $('final-hits').textContent=game.hits;
  $('final-accuracy').textContent=(game.shots?Math.round(game.hits/game.shots*100):0)+'%';
  $('final-combo').textContent=game.bestCombo;
  $('result-overlay').hidden=false;$('pause-overlay').hidden=true;playTone(660,.4);
}
function replay(){
  if(!started)return;
  game.practiceComplete=true;game.pauseReason='';game.finished=false;challenge();$('result-overlay').hidden=true;
  if(input==='camera')pause('lost-hand','准备下一轮','重新张开手掌，识别稳定后开始计时。');
}
function cast(event){
  const hit=renderer.cast(input==='camera'?castAim:aim,event.power);
  if(hit){
    const points=game.hit(event.power);playTone(540+game.combo*28,.2);
    feedback(game.mode==='practice'?'命中了！你已掌握第一道魔法\n可以继续练习，或点击「开始 60 秒挑战」':`+${points}  ·  ${game.combo>1?game.combo+' 连击':'命中水晶'}`,game.mode==='practice'?5:1.4);
    if(game.mode==='practice')$('challenge').disabled=false;
  }else{game.miss();feedback('擦肩而过 · 将准星对准水晶再试一次',1.8);playTone(170,.1);}
}
function isControl(event){return !!event.target.closest('button, a, dialog');}
function pointerMove(event){
  if(input!=='mouse'||!started||game.pauseReason||game.finished||isControl(event))return;
  const r=$('scene').getBoundingClientRect();desired.x=clamp((event.clientX-r.left)/r.width);desired.y=clamp((event.clientY-r.top)/r.height);
}
arena.addEventListener('pointermove',pointerMove);
arena.addEventListener('pointerdown',event=>{
  if(input!=='mouse'||!started||game.pauseReason||game.finished||event.button!==0||isControl(event)||$('help-dialog').open)return;
  event.preventDefault();pointerMove(event);pressed=true;
});
window.addEventListener('pointerup',event=>{if(event.button===0)pressed=false;});
window.addEventListener('pointercancel',()=>{pressed=false;game.cancelCharge();});
arena.addEventListener('pointerleave',()=>{if(input==='mouse'&&pressed){pressed=false;game.cancelCharge();}});
window.addEventListener('keydown',event=>{
  if(event.code==='Escape'&&started&&!$('help-dialog').open){event.preventDefault();if(game.pauseReason)resume();else pause('manual');return;}
  if(input!=='mouse'||!started||game.pauseReason||game.finished||isControl(event)||$('help-dialog').open)return;
  if(['Space','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.code)){event.preventDefault();keys.add(event.code);if(event.code==='Space')pressed=true;}
});
window.addEventListener('keyup',event=>{keys.delete(event.code);if(event.code==='Space')pressed=false;});
window.addEventListener('blur',()=>{if(started&&!game.finished&&!game.pauseReason)pause('background','训练已暂停','你离开了游戏窗口。回来后可以继续。');});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&started&&!game.finished&&!game.pauseReason)pause('background','训练已暂停','切换页面时已暂停计时，蓄力也已取消。');});
window.addEventListener('pagehide',()=>camera.stop());

$('camera-start').onclick=startCamera;$('retry-camera').onclick=startCamera;
$('mouse-start').onclick=$('fallback').onclick=()=>{home();begin('mouse');};
for(const id of ['stop-camera','switch-input','pause-home','result-home','cancel-loading'])$(id).onclick=home;
$('pause').onclick=()=>pause('manual');$('resume').onclick=resume;
$('challenge').onclick=challenge;$('replay').onclick=replay;
$('sound').onclick=()=>{soundEnabled=!soundEnabled;$('sound').textContent=soundEnabled?'音效：开':'音效：关';$('sound').setAttribute('aria-pressed',String(soundEnabled));if(soundEnabled)playTone(440,.1);};
$('help').onclick=()=>{if(started&&!game.pauseReason&&!game.finished){pause('help');manualPending=true;}$('help-dialog').showModal();};
for(const id of ['close-help','help-done'])$(id).onclick=()=>$('help-dialog').close();
$('help-dialog').addEventListener('close',()=>{if(manualPending){manualPending=false;$('pause-title').textContent='准备继续训练';$('pause-text').textContent='阅读指南时已暂停。准备好后点击继续。';}});

let previous=performance.now();
function frame(now){
  const dt=Math.min((now-previous)/1000,.08);previous=now;
  if(started&&!game.finished){
    if(input==='camera'&&!game.pauseReason){
      if(now-lastResult>1200||now-lastHand>1200){gesture='none';filter.reset();pause('lost-hand','识别暂时中断','计时已暂停。请把手放回画面，并保持张掌。');}
    }
    if(input==='camera'&&now-lastResult>12000&&!loading&&game.pauseReason==='lost-hand'){
      camera.stop();showError('摄像头或识别模型长时间没有返回画面。请重新连接，或改用鼠标体验。');
    }
    if(input==='mouse'&&!game.pauseReason){
      const speed=.5*dt;
      if(keys.has('ArrowLeft'))desired.x-=speed;if(keys.has('ArrowRight'))desired.x+=speed;
      if(keys.has('ArrowUp'))desired.y-=speed;if(keys.has('ArrowDown'))desired.y+=speed;
      desired.x=clamp(desired.x,.03,.97);desired.y=clamp(desired.y,.1,.85);
      gesture=pressed?'open':game.gesture==='open'?'fist':'none';
    }
    const smoothing=1-Math.exp(-dt*(input==='camera'?12:25));
    aim.x+=(desired.x-aim.x)*smoothing;aim.y+=(desired.y-aim.y)*smoothing;
    if(gesture==='open'){castAim.x=aim.x;castAim.y=aim.y;}
    const event=game.tick(dt,gesture);
    if(event?.type==='cast')cast(event);
    if(event?.type==='weak')feedback('蓄力还不够 · 张掌或按住稍久一点',1.8);
    if(event?.type==='finish')finish();
    $('score').textContent=String(game.score).padStart(4,'0');
    $('time').textContent=game.mode==='practice'?'练习':String(Math.ceil(game.remaining)).padStart(2,'0');
    $('combo').textContent='×'+game.combo;
    $('charge-number').textContent=Math.round(game.charge*100)+'%';$('charge-bar').style.width=game.charge*100+'%';
    $('spell-state').textContent=game.charge>=.98?'能量已满 · 释放魔法':game.armed?'可以释放 · 继续蓄力更强':game.charge>0?'星光正在凝聚…':input==='camera'?'张开手掌，凝聚魔法':'按住左键或空格，凝聚魔法';
    $('aim').style.left=aim.x*100+'%';$('aim').style.top=aim.y*100+'%';
    $('aim').classList.toggle('locked',!!renderer.targetAt(aim));
    arena.classList.toggle('low-time',game.mode==='challenge'&&game.remaining<=10);
  }
  if(now>feedbackUntil)$('feedback').textContent='';
  renderer.update(dt,started&&!game.pauseReason&&!game.finished,game.mode==='practice');
  renderer.draw(game,aim,!started);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
