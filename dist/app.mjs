import {GardenGame,automaticTargets,projectPlant,chargeDamage,CHARGE_MS,clamp} from './core.mjs';
import {HandTracking} from './tracking.mjs';
import {GardenRenderer} from './renderer.mjs';
import {HandCamera} from './camera.mjs';
import {language,setLanguage,resolveLanguage,t,applyTranslations,messages} from './i18n.mjs';
const $=id=>document.getElementById(id),arena=document.querySelector('.arena'),sides=['left','right'];
let preferred=resolveLanguage(navigator.languages?.length?navigator.languages:[navigator.language]);
try{const saved=localStorage.getItem('garden-language');if(['zh','en'].includes(saved))preferred=saved;}catch{}
setLanguage(preferred);
const game=new GardenGame(),renderer=new GardenRenderer($('scene')),camera=new HandCamera($('video'),$('landmarks')),tracking=new HandTracking();
const hands=Object.fromEntries(sides.map((side,i)=>[side,{aim:{x:i?.63:.37,y:.55},desired:{x:i?.63:.37,y:.55},target:null,visible:true,charge:0,lastShot:-Infinity,pose:null}]));
let started=false,input='none',loading=false,lastResult=0,lastGun=0,resumeSince=null,feedbackUntil=0,feedbackKey='',feedbackValues={},sound=false,audio=null,setupGeneration=0,loadingKey='cameraPermission',errorKey='cameraFailed';
function feedback(key,seconds=2,values={}){feedbackKey=key;feedbackValues=values;$('feedback').textContent=t(key,values);feedbackUntil=performance.now()+seconds*1000;}
function tone(hit=false,charge=0){
  if(!sound)return;
  try{audio ||= new (window.AudioContext||window.webkitAudioContext)();audio.resume().catch(()=>{});const o=audio.createOscillator(),v=audio.createGain();o.type=charge>.9?'sawtooth':hit?'triangle':'square';o.frequency.setValueAtTime((hit?630:260)*(1-charge*.3),audio.currentTime);o.frequency.exponentialRampToValueAtTime(70,audio.currentTime+.13);v.gain.setValueAtTime(.045,audio.currentTime);v.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.17+charge*.08);o.connect(v);v.connect(audio.destination);o.start();o.stop(audio.currentTime+.28);}catch{sound=false;refreshLanguage();}
}
function resetInput(){tracking.reset();resumeSince=null;for(const h of Object.values(hands)){h.charge=0;h.pose=null;h.lastShot=-Infinity;}}
function activeSides(){return sides.filter(side=>hands[side].visible);}
function refreshTargets(){
  const targets=automaticTargets(game.plants,activeSides());
  for(const side of sides){const h=hands[side];h.target=targets[side];h.desired=h.target?projectPlant(h.target):{x:side==='left'?.4:.6,y:.51};}
}
function start(mode){
  input=mode;started=true;loading=false;game.reset();renderer.clear();resetInput();
  for(const [side,h] of Object.entries(hands)){h.visible=mode==='mouse';h.aim={x:side==='left'?.4:.6,y:.57};h.desired={...h.aim};}
  for(const id of ['intro','poster-stamp','loading','error-box','result-overlay','pause-overlay'])$(id).hidden=true;
  $('game-hud').hidden=false;$('bottom-hud').hidden=false;$('camera-panel').hidden=mode!=='camera';$('challenge').hidden=false;arena.classList.add('playing');
  $('input-hint').textContent=t(mode==='mouse'?'mouseHint':'cameraHint');feedback('warmup',1.8);
  if(mode==='camera'){lastResult=lastGun=performance.now();pause('lost-hand');}
  refreshTargets();updateHud(performance.now());
}
function home(){
  setupGeneration++;camera.stop();input='none';started=false;loading=false;resetInput();game.reset();renderer.clear();
  for(const id of ['game-hud','bottom-hud','camera-panel','pause-overlay','result-overlay','error-box','loading'])$(id).hidden=true;
  $('intro').hidden=false;$('poster-stamp').hidden=false;$('feedback').textContent='';feedbackKey='';arena.classList.remove('playing');
}
function pauseCopy(){
  const keys=game.pauseReason==='lost-hand'?['lostTitle','lostTextPause']:game.pauseReason==='help'?['helpPauseTitle','helpPauseText']:game.pauseReason==='background'?['backgroundTitle','backgroundText']:['pause','pauseText'];
  $('pause-title').textContent=t(keys[0]);$('pause-text').textContent=t(keys[1]);
}
function pause(reason){
  if(!started||game.finished)return;
  game.pause(reason);resetInput();pauseCopy();$('pause-overlay').hidden=false;$('resume').hidden=['lost-hand','camera-error'].includes(reason);$('pose-guide').hidden=reason!=='lost-hand';
}
function resume(){
  if(!started||game.finished)return;resetInput();
  if(input==='camera'){lastResult=lastGun=performance.now();pause('lost-hand');}
  else{game.resume();$('pause-overlay').hidden=true;}
}
function showError(key){
  camera.stop();loading=false;setupGeneration++;$('loading').hidden=true;
  if(started)pause('camera-error');errorKey=messages.en[key]?key:'cameraFailed';$('error-message').textContent=t(errorKey);$('error-box').hidden=false;
}
async function startCamera(){
  if(loading)return;home();loading=true;input='camera';const generation=++setupGeneration;$('loading').hidden=false;
  loadingKey='cameraPermission';$('loading-text').textContent=t(loadingKey);
  try{const ready=await camera.start(onHands,key=>{if(generation===setupGeneration){loadingKey=key;$('loading-text').textContent=t(key);}},showError);if(ready&&generation===setupGeneration)start('camera');}
  catch(error){if(generation===setupGeneration)showError(error.message);}
}
function shoot(side,charge=hands[side].charge){
  if(!started||game.pauseReason||game.finished||$('help-dialog').open)return;
  const h=hands[side],now=performance.now();if(now-h.lastShot<180)return;
  const event=game.shoot(side,charge,activeSides());
  if(!event){if(input==='camera')tracking.slots[side].trigger.chargeMs=charge*CHARGE_MS;return;}
  h.lastShot=now;h.charge=0;h.aim={...event.aim};renderer.shot(event,h);tone(event.hit,event.charge);
  if(game.combo>2)feedback('comboFeedback',.8,{count:game.combo});refreshTargets();
}
function onHands(result){
  if(input!=='camera'||!started)return;
  const now=performance.now();lastResult=now;const update=tracking.update(result.hands,now);
  if(update.valid)lastGun=now;
  for(const side of sides){const slot=tracking.slots[side],h=hands[side];h.visible=slot.visible;h.pose=slot.pose;h.charge=slot.trigger.charge;}
  if(game.pauseReason==='lost-hand'){
    if(update.valid){resumeSince ??= now;if(now-resumeSince>=240){game.resume();resetInput();$('pause-overlay').hidden=true;feedback('go',1);}}
    else resumeSince=null;
  }else if(!game.pauseReason)for(const shot of update.shots)shoot(shot.hand,shot.charge);
}
function challenge(){
  if(!started||game.pauseReason)return;game.reset('survival');renderer.clear();resetInput();$('challenge').hidden=true;$('result-overlay').hidden=true;feedback('readyGo',2);
  if(input==='camera')pause('lost-hand');
}
function renderResult(){
  $('result-title').textContent=t(game.won?'won':'lost');$('result-text').textContent=t(game.won?'wonText':'lostText');
  $('final-score').textContent=game.score;$('final-kills').textContent=game.kills;$('final-accuracy').textContent=(game.shots?Math.round(game.hits/game.shots*100):0)+'%';$('final-combo').textContent=game.bestCombo;
}
function finish(){resetInput();$('pause-overlay').hidden=true;$('result-overlay').hidden=false;renderResult();}
$('scene').addEventListener('contextmenu',e=>e.preventDefault());
$('scene').addEventListener('pointerdown',e=>{if(input!=='mouse'||![0,2].includes(e.button))return;e.preventDefault();shoot(e.button===0?'left':'right');});
window.addEventListener('keydown',e=>{
  if($('help-dialog').open)return;
  if(e.code==='Escape'&&started){e.preventDefault();if(game.pauseReason)resume();else pause('manual');return;}
  if(input!=='mouse'||!started||game.pauseReason||game.finished||e.target.closest('button,a,input'))return;
  if(!['KeyA','KeyD','Space'].includes(e.code))return;e.preventDefault();if(e.repeat)return;
  if(e.code==='KeyA'||e.code==='Space')shoot('left');if(e.code==='KeyD'||e.code==='Space')shoot('right');
});
window.addEventListener('blur',()=>{if(started&&!game.pauseReason)pause('background');});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&started&&!game.pauseReason)pause('background');});
window.addEventListener('pagehide',()=>camera.stop());
$('camera-start').onclick=$('retry-camera').onclick=startCamera;
$('mouse-start').onclick=$('fallback').onclick=()=>{home();start('mouse');};
for(const id of ['home','pause-home','result-home','error-home','stop-camera','cancel-loading'])$(id).onclick=home;
$('pause').onclick=()=>pause('manual');$('resume').onclick=resume;$('challenge').onclick=challenge;
$('replay').onclick=()=>{game.finished=false;game.pauseReason='';challenge();};
$('sound').onclick=()=>{sound=!sound;refreshLanguage();if(sound)tone(true);};
$('film').onclick=()=>{renderer.film=!renderer.film;arena.classList.toggle('film-off',!renderer.film);refreshLanguage();};
$('help').onclick=()=>{if(started&&!game.finished&&!game.pauseReason)pause('help');$('help-dialog').showModal();};
$('close-help').onclick=$('help-done').onclick=()=>$('help-dialog').close();
$('language').onclick=()=>{setLanguage(language==='zh'?'en':'zh');try{localStorage.setItem('garden-language',language);}catch{}refreshLanguage();};
function refreshLanguage(){
  applyTranslations();$('language').textContent=language==='zh'?'EN':'中文';
  $('sound').setAttribute('aria-label',t(sound?'soundOff':'soundOn'));$('sound').setAttribute('aria-pressed',String(sound));
  $('film').setAttribute('aria-label',t(renderer.film?'filmOff':'filmOn'));$('film').setAttribute('aria-pressed',String(renderer.film));
  $('loading-text').textContent=t(loadingKey);$('error-message').textContent=t(errorKey);
  $('input-hint').textContent=t(input==='mouse'?'mouseHint':'cameraHint');
  if(game.pauseReason)pauseCopy();if(game.finished)renderResult();if(feedbackKey)$('feedback').textContent=t(feedbackKey,feedbackValues);
  updateHud(performance.now());
}
function updateHud(now){
  $('score').textContent=String(game.score).padStart(5,'0');$('time').textContent=game.mode==='practice'?'∞':String(Math.ceil(game.remaining)).padStart(2,'0');
  $('health').textContent=game.mode==='practice'?'♥ ∞':'♥ '.repeat(game.hp)+'♡ '.repeat(5-game.hp);
  $('mode-name').textContent=game.mode==='practice'?t('practice'):'●'.repeat(game.wave)+'○'.repeat(5-game.wave);
  $('combo').textContent=game.combo>1?`×${game.combo}　✿ ${game.kills}`:`✿ ${game.kills}`;
  let valid=0,visible=0;
  for(const side of sides){
    const h=hands[side],slot=tracking.slots[side];visible+=h.visible?1:0;valid+=now-slot.lastValid<200?1:0;
    const state=input==='mouse'?'ready':!h.visible?'lost':now-slot.lastValid>=200?'recover':slot.trigger.latched?'lower':'ready';
    $(side+'-status').dataset.state=state;$(side+'-status').textContent=(side==='left'?'L ':'R ')+({ready:'●',lost:'○',recover:'◌',lower:'↙'}[state]);
    $(side+'-status').title=t({ready:'statusReady',lost:'statusLost',recover:'statusRecover',lower:'statusLower'}[state]);
    const meter=$(side+'-charge'),amount=Math.round(h.charge*100),damage=chargeDamage(h.charge);
    meter.style.setProperty('--charge',amount+'%');meter.setAttribute('aria-valuenow',String(amount));meter.setAttribute('aria-label',t('chargeLabel',{side:t(side==='left'?'leftGun':'rightGun'),damage}));meter.classList.toggle('full',h.charge>=1);$(side+'-power').textContent='×'+damage;
  }
  $('camera-status').textContent=t(valid===2?'cameraDual':valid===1?'cameraSingle':visible?'cameraRecover':'cameraMissing');
}
let previous=performance.now();
function frame(now){
  const dt=Math.min((now-previous)/1000,.08);previous=now;
  if(started&&!game.finished){
    if(input==='camera'){
      tracking.expire(now);for(const side of sides){hands[side].visible=tracking.slots[side].visible;hands[side].charge=game.pauseReason?0:tracking.slots[side].trigger.charge;}
      if(!game.pauseReason&&(now-lastResult>3000||now-lastGun>2200))pause('lost-hand');
      if(now-lastResult>12000&&game.pauseReason==='lost-hand')showError('trackingTimeout');
    }
    if(!game.pauseReason){
      for(const event of game.tick(dt)){if(event.type==='damage'){renderer.hurt=1;feedback('ouch',.7);tone(false);}if(event.type==='finish')finish();}
      refreshTargets();
      if(!game.finished)for(const h of Object.values(hands)){
        if(input==='mouse')h.charge=clamp(h.charge+dt*1000/CHARGE_MS);
        const smoothing=1-Math.exp(-dt*14);h.aim.x+=(h.desired.x-h.aim.x)*smoothing;h.aim.y+=(h.desired.y-h.aim.y)*smoothing;
      }
    }
    updateHud(now);
  }
  if(now>feedbackUntil){$('feedback').textContent='';feedbackKey='';}
  renderer.update(dt,started&&!game.pauseReason&&!game.finished);renderer.draw(game,hands,!started);requestAnimationFrame(frame);
}
refreshLanguage();requestAnimationFrame(frame);
