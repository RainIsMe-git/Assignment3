import {GardenGame,GunTrigger,readGunPose,clamp} from './core.mjs';
import {GardenRenderer} from './renderer.mjs';
import {HandCamera} from './camera.mjs';
const $=id=>document.getElementById(id),arena=document.querySelector('.arena');
const game=new GardenGame(),renderer=new GardenRenderer($('scene')),camera=new HandCamera($('video'),$('landmarks'));
const hands=Object.fromEntries(['left','right'].map((side,i)=>[side,{aim:{x:i?.63:.37,y:.55},desired:{x:i?.63:.37,y:.55},visible:true,trigger:new GunTrigger(),lastShot:-Infinity,pose:null}]));
let started=false,input='none',loading=false,lastResult=0,lastGun=0,resumeSince=0,feedbackUntil=0,sound=false,audio=null,setupGeneration=0;
const keys=new Set();
function feedback(text,seconds=2){$('feedback').textContent=text;feedbackUntil=performance.now()+seconds*1000;}
function tone(hit=false){
  if(!sound)return;
  try{audio ||= new (window.AudioContext||window.webkitAudioContext)();audio.resume().catch(()=>{});const o=audio.createOscillator(),v=audio.createGain();o.type=hit?'triangle':'square';o.frequency.setValueAtTime(hit?630:260,audio.currentTime);o.frequency.exponentialRampToValueAtTime(hit?160:80,audio.currentTime+.13);v.gain.setValueAtTime(.055,audio.currentTime);v.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.17);o.connect(v);v.connect(audio.destination);o.start();o.stop(audio.currentTime+.18);}catch{sound=false;$('sound').textContent='音效不可用';}
}
function resetInput(){keys.clear();resumeSince=0;for(const h of Object.values(hands)){h.trigger.reset();h.pose=null;h.lastShot=-Infinity;}}
function start(mode){
  input=mode;started=true;loading=false;game.reset();renderer.clear();resetInput();
  for(const [side,h] of Object.entries(hands)){h.visible=mode==='mouse';h.aim={x:side==='left'?.45:.55,y:.57};h.desired={...h.aim};}
  for(const id of ['intro','poster-stamp','loading','error-box','result-overlay','pause-overlay'])$(id).hidden=true;
  $('game-hud').hidden=false;$('bottom-hud').hidden=false;$('camera-panel').hidden=mode!=='camera';$('challenge').hidden=false;arena.classList.add('playing');
  $('input-hint').textContent=mode==='mouse'?'A / 左键　✷　D / 右键':'↗　✷';
  feedback('热身！',1.8);
  if(mode==='camera'){lastResult=performance.now();lastGun=0;pause('lost-hand','摆好指枪','拇指伸出 · 两种手势都可以');}
}
function home(){
  setupGeneration++;camera.stop();input='none';started=false;loading=false;resetInput();game.reset();renderer.clear();
  for(const id of ['game-hud','bottom-hud','camera-panel','pause-overlay','result-overlay','error-box','loading'])$(id).hidden=true;
  $('intro').hidden=false;$('poster-stamp').hidden=false;$('feedback').textContent='';arena.classList.remove('playing');
}
function pause(reason,title='暂停',message='准备好再继续。'){
  if(!started||game.finished)return;
  game.pause(reason);resetInput();$('pause-title').textContent=title;$('pause-text').textContent=message;$('pause-overlay').hidden=false;$('resume').hidden=reason==='lost-hand'||reason==='camera-error';
  $('pose-guide').hidden=reason!=='lost-hand';
}
function resume(){
  if(!started||game.finished)return;
  resetInput();
  if(input==='camera'){lastResult=performance.now();pause('lost-hand','演员重新就位','摆好指枪并保持片刻，即可继续。');}
  else{game.resume();$('pause-overlay').hidden=true;}
}
function showError(message){
  camera.stop();loading=false;setupGeneration++;$('loading').hidden=true;
  if(started)pause('camera-error');
  $('error-message').textContent=message;$('error-box').hidden=false;
}
async function startCamera(){
  if(loading)return;
  home();loading=true;input='camera';const generation=++setupGeneration;$('loading').hidden=false;
  try{const ready=await camera.start(onHands,text=>{if(generation===setupGeneration)$('loading-text').textContent=text;},showError);if(ready&&generation===setupGeneration)start('camera');}
  catch(error){if(generation===setupGeneration)showError(error.message);}
}
function shoot(side,aim){
  if(!started||game.pauseReason||game.finished||$('help-dialog').open)return;
  const h=hands[side],now=performance.now();if(now-h.lastShot<180)return;
  const event=game.shoot(aim||h.aim,side);if(!event)return;h.lastShot=now;
  renderer.shot(event,h);tone(event.hit);
  if(event.hit && game.combo>2)feedback(`${game.combo} COMBO!`,.8);
}
function onHands(result){
  if(input!=='camera'||!started)return;
  const now=performance.now();lastResult=now;
  // MediaPipe handedness identifies each physical hand independently of array order.
  const seen=new Set();let gunCount=0;
  for(const observation of result.hands||[]){
    if(observation.confidence<.6)continue;
    const side=observation.handedness==='Left'?'left':observation.handedness==='Right'?'right':null;
    if(!side||seen.has(side))continue;seen.add(side);
    const h=hands[side],pose=readGunPose(observation.landmarks);h.pose=pose;h.visible=!!pose;
    if(pose?.gun){gunCount++;lastGun=now;
      // Aim remains at the pre-flick position while the shot gesture is raised.
      if(!h.trigger.latched)h.desired={...pose.aim};
      if(!game.pauseReason){const shot=h.trigger.sample(pose,now);if(shot)shoot(side,shot);}
      else h.trigger.reset();
    }else h.trigger.reset();
  }
  for(const side of ['left','right'])if(!seen.has(side)){hands[side].visible=false;hands[side].pose=null;hands[side].trigger.reset();}
  $('camera-status').textContent=gunCount===2?'● 双枪':gunCount===1?'● 单枪':seen.size?'拇指＋食指 ↑':'○ 未入镜';
  if(game.pauseReason==='lost-hand'){
    if(gunCount){resumeSince ||= now;if(now-resumeSince>=400){game.resume();resetInput();$('pause-overlay').hidden=true;feedback('开火！',1);}}
    else resumeSince=0;
  }
}
function challenge(){
  if(!started||game.pauseReason)return;
  game.reset('survival');renderer.clear();resetInput();$('challenge').hidden=true;$('result-overlay').hidden=true;
  feedback('READY?　GO!',2);
  if(input==='camera')pause('lost-hand','准备，开火！','重新摆好指枪，识别稳定后开始保卫战。');
}
function finish(){
  resetInput();$('pause-overlay').hidden=true;$('result-overlay').hidden=false;
  $('result-title').textContent=game.won?'花园保住了！':'哎呀，花园沦陷！';$('result-text').textContent=game.won?'干得漂亮，指枪神射手。':'放松手腕，下一局再把它们打回去。';
  $('final-score').textContent=game.score;$('final-kills').textContent=game.kills;$('final-accuracy').textContent=(game.shots?Math.round(game.hits/game.shots*100):0)+'%';$('final-combo').textContent=game.bestCombo;
}
function pointer(event){
  if(input!=='mouse'||!started||game.pauseReason||game.finished||event.target!==$('scene'))return;
  const r=$('scene').getBoundingClientRect(),x=clamp((event.clientX-r.left)/r.width),y=clamp((event.clientY-r.top)/r.height);
  for(const [side,h] of Object.entries(hands)){h.desired={x:clamp(x+(side==='left'?-.015:.015)),y};h.aim={...h.desired};}
}
$('scene').addEventListener('pointermove',pointer);
$('scene').addEventListener('contextmenu',e=>e.preventDefault());
$('scene').addEventListener('pointerdown',e=>{if(input!=='mouse'||![0,2].includes(e.button))return;e.preventDefault();pointer(e);shoot(e.button===0?'left':'right');});
window.addEventListener('keydown',e=>{
  if($('help-dialog').open)return;
  if(e.code==='Escape'&&started){e.preventDefault();if(game.pauseReason)resume();else pause('manual');return;}
  if(input!=='mouse'||!started||game.pauseReason||game.finished||e.target.closest('button,a,input'))return;
  if(['KeyA','KeyD','Space','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.code))e.preventDefault();
  if(e.repeat)return;
  keys.add(e.code);
  if(e.code==='KeyA'||e.code==='Space')shoot('left');if(e.code==='KeyD'||e.code==='Space')shoot('right');
});
window.addEventListener('keyup',e=>keys.delete(e.code));
window.addEventListener('blur',()=>{if(started&&!game.pauseReason)pause('background','演出暂停','你离开了窗口。回来后点击继续。');});
// Also discard physical trigger baselines while setup is pending in the background.
document.addEventListener('visibilitychange',()=>{if(document.hidden&&started&&!game.pauseReason)pause('background','演出暂停','切换页面时，植物和计时都已暂停。');});
window.addEventListener('pagehide',()=>camera.stop());
$('camera-start').onclick=$('retry-camera').onclick=startCamera;
$('mouse-start').onclick=$('fallback').onclick=()=>{home();start('mouse');};
for(const id of ['home','pause-home','result-home','error-home','stop-camera','cancel-loading'])$(id).onclick=home;
$('pause').onclick=()=>pause('manual');$('resume').onclick=resume;$('challenge').onclick=challenge;
$('replay').onclick=()=>{game.finished=false;game.pauseReason='';challenge();};
$('sound').onclick=()=>{sound=!sound;$('sound').setAttribute('aria-label',sound?'关闭音效':'开启音效');$('sound').setAttribute('aria-pressed',String(sound));if(sound)tone(true);};
$('film').onclick=()=>{renderer.film=!renderer.film;arena.classList.toggle('film-off',!renderer.film);$('film').setAttribute('aria-pressed',String(renderer.film));$('film').setAttribute('aria-label',renderer.film?'关闭旧胶片效果':'开启旧胶片效果');};
$('help').onclick=()=>{if(started&&!game.finished&&!game.pauseReason)pause('help','指南阅读中','关掉指南后，点击继续。');$('help-dialog').showModal();};
$('close-help').onclick=$('help-done').onclick=()=>$('help-dialog').close();
function updateHud(){
  $('score').textContent=String(game.score).padStart(5,'0');$('time').textContent=game.mode==='practice'?'∞':String(Math.ceil(game.remaining)).padStart(2,'0');
  $('health').textContent=game.mode==='practice'?'♥ ∞':'♥ '.repeat(game.hp)+'♡ '.repeat(5-game.hp);
  $('mode-name').textContent=game.mode==='practice'?'练习':'●'.repeat(game.wave)+'○'.repeat(5-game.wave);
  $('combo').textContent=game.combo>1?`×${game.combo}　✿ ${game.kills}`:`✿ ${game.kills}`;
  for(const [side,h] of Object.entries(hands)){
    const state=input==='mouse'?'ready':!h.visible?'lost':!h.pose?.gun?'pose':h.trigger.latched?'lower':'ready';
    $(side+'-status').dataset.state=state;
    $(side+'-status').textContent=(side==='left'?'L ':'R ')+({ready:'●',lost:'○',pose:'?',lower:'↙'}[state]);
    $(side+'-status').title={ready:'就绪，抬指开火',lost:'未入镜',pose:'请伸出拇指与食指，中指也可以伸出',lower:'放回原位再抬'}[state];
  }
}
let previous=performance.now();
function frame(now){
  const dt=Math.min((now-previous)/1000,.08);previous=now;
  if(started&&!game.finished){
    if(input==='camera'&&!game.pauseReason&&(now-lastResult>1100||now-lastGun>950))pause('lost-hand','指枪暂时离场','计时已暂停。把手放回画面，摆好指枪即可继续。');
    if(input==='camera'&&now-lastResult>12000&&game.pauseReason==='lost-hand')showError('识别长时间没有返回结果，请重新连接或使用鼠标。');
    if(!game.pauseReason){
      for(const h of Object.values(hands)){
        if(input==='mouse'){
          h.desired.x=clamp(h.desired.x+(Number(keys.has('ArrowRight'))-Number(keys.has('ArrowLeft')))*dt*.5);
          h.desired.y=clamp(h.desired.y+(Number(keys.has('ArrowDown'))-Number(keys.has('ArrowUp')))*dt*.5);
        }
        const smoothing=1-Math.exp(-dt*16);h.aim.x+=(h.desired.x-h.aim.x)*smoothing;h.aim.y+=(h.desired.y-h.aim.y)*smoothing;
      }
      for(const event of game.tick(dt)){if(event.type==='damage'){renderer.hurt=1;feedback('OUCH!',.7);tone(false);}if(event.type==='finish')finish();}
    }
    updateHud();
  }
  if(now>feedbackUntil)$('feedback').textContent='';
  renderer.update(dt,started&&!game.pauseReason&&!game.finished);renderer.draw(game,hands,!started);requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
