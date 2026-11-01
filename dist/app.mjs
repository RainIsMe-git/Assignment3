import {GardenGame,automaticTargets,projectPlant,CHARGE_MS,SHOT_COOLDOWN_MS,WAVE_COUNTS,UPGRADE_EVERY,clamp} from './core.mjs';
import {HandTracking} from './tracking.mjs';
import {GardenRenderer} from './renderer.mjs';
import {HandCamera} from './camera.mjs';
import {GameAudio} from './audio.mjs';
import {cameraStatusKey} from './palm-control.mjs';
import {Tutorial,LESSONS} from './tutorial.mjs';
import {BURST_WINDOW} from './burst.mjs';
import {language,setLanguage,resolveLanguage,t,applyTranslations,messages} from './i18n.mjs';
const $=id=>document.getElementById(id),arena=document.querySelector('.arena'),sides=['left','right'];
let preferred=resolveLanguage(navigator.languages?.length?navigator.languages:[navigator.language]);
try{const saved=localStorage.getItem('garden-language');if(['zh','en'].includes(saved))preferred=saved;}catch{}
setLanguage(preferred);
const game=new GardenGame(),renderer=new GardenRenderer($('scene')),camera=new HandCamera($('video'),$('landmarks')),tracking=new HandTracking();
try{tracking.swapHands=localStorage.getItem('garden-screen-swap-v2')==='true';}catch{}
const hands=Object.fromEntries(sides.map((side,i)=>[side,{aim:{x:i?.63:.37,y:.55},desired:{x:i?.63:.37,y:.55},target:null,visible:true,charge:0,lastShot:-Infinity,pose:null}]));
let started=false,input='none',loading=false,lastResult=0,lastGun=0,resumeSince=null,feedbackUntil=0,feedbackKey='',feedbackValues={},sound=true,setupGeneration=0,loadingKey='cameraPermission',errorKey='cameraFailed';
const audio=new GameAudio();
const mousePalms={left:false,right:false};
const tutorial=new Tutorial();tutorial.active=false;
function feedback(key,seconds=2,values={}){feedbackKey=key;feedbackValues=values;$('feedback').textContent=t(key,values);feedbackUntil=performance.now()+seconds*1000;}
function resetInput(){audio.resetCharges();tracking.reset();resumeSince=null;mousePalms.left=mousePalms.right=false;game.palm.setHands({});for(const h of Object.values(hands)){h.charge=0;h.pose=null;h.stopping=false;h.lastShot=-Infinity;}}
function activeSides(){return sides.filter(side=>hands[side].visible&&!hands[side].stopping);}
function refreshTargets(){
  const targets=automaticTargets(game.plants,activeSides());
  for(const side of sides){const h=hands[side];h.target=targets[side];h.desired=h.target?projectPlant(h.target):{x:side==='left'?.4:.6,y:.51};}
}
function start(mode){
  input=mode;started=true;loading=false;game.reset();tutorial.reset();renderer.clear();resetInput();arena.classList.add('training');
  for(const [side,h] of Object.entries(hands)){h.visible=mode==='mouse';h.aim={x:side==='left'?.4:.6,y:.57};h.desired={...h.aim};}
  for(const id of ['intro','poster-stamp','loading','error-box','result-overlay','pause-overlay'])$(id).hidden=true;
  $('game-hud').hidden=false;$('bottom-hud').hidden=false;$('palm-hud').hidden=false;$('palm-buttons').hidden=mode!=='mouse';$('camera-panel').hidden=mode!=='camera';$('challenge').hidden=true;arena.classList.add('playing');
  $('input-hint').textContent=t(mode==='mouse'?'mouseHint':'cameraHint');feedback('warmup',1.8);
  if(mode==='camera'){lastResult=lastGun=performance.now();pause('lost-hand');}
  refreshTargets();updateHud(performance.now());
}
function home(){
  audio.setActive(false);
  setupGeneration++;camera.stop();input='none';started=false;loading=false;tutorial.active=false;resetInput();game.reset();renderer.clear();arena.classList.remove('training');
  for(const id of ['game-hud','bottom-hud','palm-hud','boss-hud','queen-alert','burst-hud','upgrade-hud','tutorial-hud','camera-panel','pause-overlay','result-overlay','error-box','loading'])$(id).hidden=true;
  $('intro').hidden=false;$('poster-stamp').hidden=false;$('feedback').textContent='';feedbackKey='';arena.classList.remove('playing','tracking-lost');
}
function pauseCopy(){
  const keys=game.pauseReason==='lost-hand'?['lostTitle','lostTextPause']:game.pauseReason==='help'?['helpPauseTitle','helpPauseText']:game.pauseReason==='background'?['backgroundTitle','backgroundText']:['pause','pauseText'];
  $('pause-title').textContent=t(keys[0]);$('pause-text').textContent=t(keys[1]);
}
function pause(reason){
  if(!started||game.finished)return;
  audio.setActive(false);game.pause(reason);resetInput();pauseCopy();arena.classList.toggle('tracking-lost',reason==='lost-hand');$('pause-overlay').hidden=false;$('resume').hidden=['lost-hand','camera-error'].includes(reason);$('pose-guide').hidden=true;
}
function resume(){
  if(!started||game.finished)return;resetInput();
  if(input==='camera'){lastResult=lastGun=performance.now();pause('lost-hand');}
  else{game.resume();arena.classList.remove('tracking-lost');$('pause-overlay').hidden=true;}
}
function showError(key){
  camera.stop();loading=false;setupGeneration++;$('loading').hidden=true;
  if(started)pause('camera-error');errorKey=messages.en[key]?key:'cameraFailed';$('error-message').textContent=t(errorKey);$('error-box').hidden=false;
}
async function startCamera(){
  if(sound)void audio.unlock();
  if(loading)return;home();loading=true;input='camera';const generation=++setupGeneration;$('loading').hidden=false;
  loadingKey='cameraPermission';$('loading-text').textContent=t(loadingKey);
  try{const ready=await camera.start(onHands,key=>{if(generation===setupGeneration){loadingKey=key;$('loading-text').textContent=t(key);}},showError);if(ready&&generation===setupGeneration)start('camera');}
  catch(error){if(generation===setupGeneration)showError(error.message);}
}
function shoot(side,charge=hands[side].charge){
  if(!started||game.pauseReason||game.finished||$('help-dialog').open)return;
  const h=hands[side],now=performance.now();if(h.stopping||mousePalms[side])return;if(input==='mouse'&&now-h.lastShot<SHOT_COOLDOWN_MS)return;
  if(input==='mouse')game.palm.setHands(mousePalms);
  const event=game.shoot(side,charge,activeSides());
  if(!event){if(input==='camera')tracking.slots[side].trigger.chargeMs=charge*CHARGE_MS;return;}
  h.lastShot=now;h.charge=0;h.aim={...event.aim};renderer.shot(event,h);audio.shoot(event);
  tutorial.shot(event,game);
  if(event.burstUnlocked){feedback('burstReady',3);audio.wave();}
  else if(game.combo>2&&!['waveIncoming','waveCleared','burstReady'].includes(feedbackKey))feedback('comboFeedback',.8,{count:game.combo});refreshTargets();
}
function burst(){if(!started||$('help-dialog').open||!game.burst())return;feedback('burstBang',1);resetInput();}
function onHands(result){
  if(input!=='camera'||!started)return;
  const now=performance.now();lastResult=now;const update=tracking.update(result.hands,now,{burstEnabled:game.burstReady&&!game.pauseReason&&game.burstTime===0});
  camera.draw(update.preview);
  if(update.valid)lastGun=now;
  for(const side of sides){const slot=tracking.slots[side],h=hands[side];h.visible=slot.visible;h.pose=slot.pose;h.charge=slot.trigger.charge;h.stopping=slot.stopping;}
  if(game.pauseReason==='lost-hand'){
    if(update.valid){resumeSince ??= now;if(now-resumeSince>=240){game.resume();resetInput();arena.classList.remove('tracking-lost');$('pause-overlay').hidden=true;if(game.mode==='survival'&&game.elapsed===0)feedback('waveIncoming',2.2,{wave:game.wave,count:WAVE_COUNTS[game.wave-1]});else feedback('go',1);}}
    else resumeSince=null;
  }else if(!game.pauseReason){if(update.burst)burst();else for(const shot of update.shots)shoot(shot.hand,shot.charge);}
}
function challenge(){
  if(!started||game.pauseReason)return;tutorial.active=false;tutorial.ready=false;arena.classList.remove('training');$('tutorial-hud').hidden=true;game.reset('survival');renderer.clear();resetInput();$('challenge').hidden=true;$('result-overlay').hidden=true;feedback('waveIncoming',2.2,{wave:game.wave,count:WAVE_COUNTS[game.wave-1]});
  if(input==='camera')pause('lost-hand');
}
function renderResult(){
  $('result-title').textContent=t(game.won?'won':'lost');$('result-text').textContent=t(game.won?'wonText':'lostText');
  $('final-score').textContent=game.score;$('final-kills').textContent=game.kills;$('final-accuracy').textContent=(game.shots?Math.round(game.hits/game.shots*100):0)+'%';$('final-combo').textContent=game.bestCombo;
}
function finish(){audio.setActive(false);resetInput();$('pause-overlay').hidden=true;$('result-overlay').hidden=false;renderResult();}
$('scene').addEventListener('contextmenu',e=>e.preventDefault());
$('scene').addEventListener('pointerdown',e=>{if(input!=='mouse'||![0,2].includes(e.button))return;e.preventDefault();shoot(e.button===0?'left':'right');});
window.addEventListener('keydown',e=>{
  if($('help-dialog').open)return;
  if(e.code==='Escape'&&started){e.preventDefault();if(game.pauseReason)resume();else pause('manual');return;}
  if(input!=='mouse'||!started||game.pauseReason||game.finished||e.target.closest('input,textarea,[contenteditable="true"]'))return;
  if(e.code==='KeyC'&&!e.repeat){e.preventDefault();burst();return;}
  if(['KeyQ','KeyE'].includes(e.code)){e.preventDefault();mousePalms[e.code==='KeyQ'?'left':'right']=true;return;}
  if(e.target.closest('button,a')&&e.code==='Space')return;
  if(!['KeyA','KeyD','Space'].includes(e.code))return;e.preventDefault();if(e.repeat)return;
  if(e.code==='KeyA'||e.code==='Space')shoot('left');if(e.code==='KeyD'||e.code==='Space')shoot('right');
});
window.addEventListener('keyup',e=>{if(e.code==='KeyQ')mousePalms.left=false;if(e.code==='KeyE')mousePalms.right=false;});
for(const side of sides){
  const button=$('stop-'+side);
  button.onpointerdown=e=>{if(input!=='mouse'||!started||game.pauseReason||game.finished)return;e.preventDefault();button.setPointerCapture(e.pointerId);mousePalms[side]=true;};
  button.onpointerup=button.onpointercancel=button.onlostpointercapture=()=>mousePalms[side]=false;
  button.onkeydown=e=>{if(['Space','Enter'].includes(e.code)&&input==='mouse'&&started&&!game.pauseReason&&!game.finished){e.preventDefault();mousePalms[side]=true;}};
  button.onkeyup=e=>{if(['Space','Enter'].includes(e.code)){e.preventDefault();mousePalms[side]=false;}};
}
window.addEventListener('blur',()=>{if(started&&!game.pauseReason)pause('background');});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&started&&!game.pauseReason)pause('background');});
window.addEventListener('pagehide',()=>{camera.stop();audio.setActive(false);});
$('camera-start').onclick=$('retry-camera').onclick=startCamera;
$('mouse-start').onclick=$('fallback').onclick=()=>{if(sound)void audio.unlock();home();start('mouse');};
for(const id of ['home','pause-home','result-home','error-home','stop-camera','cancel-loading'])$(id).onclick=home;
$('pause').onclick=()=>pause('manual');$('resume').onclick=()=>{if(sound)void audio.unlock();resume();};$('challenge').onclick=challenge;
$('swap-hands').onclick=()=>{tracking.swapHands=!tracking.swapHands;try{localStorage.setItem('garden-screen-swap-v2',String(tracking.swapHands));}catch{}resetInput();$('swap-hands').setAttribute('aria-pressed',String(tracking.swapHands));};
$('tutorial-skip').onclick=challenge;$('burst-hud').onclick=()=>{if(input==='mouse')burst();};
$('replay').onclick=()=>{game.finished=false;game.pauseReason='';challenge();};
$('sound').onclick=()=>{sound=!sound;audio.setEnabled(sound);if(sound)void audio.unlock();refreshLanguage();};
$('film').onclick=()=>{renderer.film=!renderer.film;arena.classList.toggle('film-off',!renderer.film);refreshLanguage();};
$('help').onclick=()=>{if(started&&!game.finished&&!game.pauseReason)pause('help');$('help-dialog').showModal();};
$('close-help').onclick=$('help-done').onclick=()=>$('help-dialog').close();
$('language').onclick=()=>{setLanguage(language==='zh'?'en':'zh');try{localStorage.setItem('garden-language',language);}catch{}refreshLanguage();};
function refreshLanguage(){
  applyTranslations();$('swap-hands').setAttribute('aria-pressed',String(tracking.swapHands));$('language').textContent=language==='zh'?'EN':'中文';
  $('sound').setAttribute('aria-label',t(sound?'soundOff':'soundOn'));$('sound').setAttribute('aria-pressed',String(sound));
  $('film').setAttribute('aria-label',t(renderer.film?'filmOff':'filmOn'));$('film').setAttribute('aria-pressed',String(renderer.film));
  $('loading-text').textContent=t(loadingKey);$('error-message').textContent=t(errorKey);
  $('input-hint').textContent=t(input==='mouse'?'mouseHint':'cameraHint');
  if(game.pauseReason)pauseCopy();if(game.finished)renderResult();if(feedbackKey)$('feedback').textContent=t(feedbackKey,feedbackValues);
  updateHud(performance.now());
}
function updateHud(now){
  const upgraded=started&&game.mode==='survival'&&game.waveState==='break'&&game.wave%UPGRADE_EVERY===0;
  $('upgrade-hud').hidden=!upgraded;
  $('tutorial-hud').hidden=!started||!tutorial.active;
  if(tutorial.active){
    const step=tutorial.step,shotStep=['fire','charge'].includes(step);
    $('tutorial-icon').src=shotStep?'./assets/gun-two.svg':'./assets/palm.svg';$('tutorial-hud').dataset.step=step;
    $('tutorial-title').textContent=t(tutorial.success?'lessonSuccess':'lesson_'+step);
    $('tutorial-instruction').textContent=t('teach_'+step+'_'+input);
    $('tutorial-progress').textContent=LESSONS.map((_,i)=>i<tutorial.index?'✓':i===tutorial.index?'●':'○').join('  ');
    $('tutorial-progress').setAttribute('aria-label',t('lessonProgress',{step:tutorial.index+1,total:LESSONS.length}));
    $('tutorial-counter').textContent=tutorial.success?'✓':step==='fire'?tutorial.progress+' / 2':step==='charge'?Math.round(Math.max(...Object.values(hands).map(h=>h.charge))*100)+'%':['freeze','push'].includes(step)?Math.min(100,Math.round(tutorial.progress/(step==='push'?1.2:1)*100))+'%':step==='recharge'?Math.min(100,Math.round(tutorial.progress/.6*100))+'%':'✷';
  }
  $('burst-hud').hidden=!started||!game.burstReady||game.burstTime>0;$('burst-hud').dataset.ready=String(game.burstReady);
  $('burst-hud').disabled=!game.burstReady||!!game.pauseReason||game.finished||input!=='mouse';
  $('burst-label').textContent=t(input==='mouse'?'burstReadyMouse':'burstReadyTimed',{seconds:Math.ceil(game.burstRemaining)});
  $('burst-fill').style.width=(game.burstRemaining/BURST_WINDOW*100)+'%';
  $('score').textContent=String(game.score).padStart(5,'0');$('time').textContent=game.mode==='practice'?'∞':game.waveState==='break'?String(Math.ceil(game.breakRemaining)):game.wave+' / '+WAVE_COUNTS.length;
  $('health').textContent=game.mode==='practice'?'♥ ∞':'♥ '.repeat(game.hp)+'♡ '.repeat(5-game.hp);
  $('mode-name').textContent=game.mode==='practice'?t('practice'):game.waveState==='break'?t('nextWave',{wave:game.wave+1}):t('waveEnemies',{count:game.plants.length+game.toSpawn});
  $('time').setAttribute('aria-label',game.mode==='practice'?t('practice'):t('waveLabel',{wave:game.wave,total:WAVE_COUNTS.length}));
  $('combo').textContent=game.combo>1?`×${game.combo}　✿ ${game.kills}`:`✿ ${game.kills}`;
  const energy=game.palm.energy/game.palm.maxEnergy;
  $('palm-energy').style.setProperty('--energy',energy*100+'%');$('palm-energy').setAttribute('aria-valuenow',String(Math.round(energy*100)));$('palm-energy').setAttribute('aria-label',t('energyLabel',{seconds:game.palm.energy.toFixed(1)}));
  $('palm-time').textContent=game.palm.energy.toFixed(1)+' / '+game.palm.maxEnergy+'s';$('palm-hud').dataset.state=game.palm.active===2?'push':game.palm.active===1?'push':energy===0?'empty':'ready';
  $('palm-state').textContent=t(game.palm.active===2?'pushing':game.palm.active===1?'slowing':energy===0?'energyEmpty':'palmReady');
  if(tutorial.unlimitedEnergy){$('palm-time').textContent='∞';$('palm-energy').setAttribute('aria-label',t('trainingEnergy'));if(!game.palm.active)$('palm-state').textContent=t('trainingEnergy');}
  for(const side of sides)$('stop-'+side).setAttribute('aria-pressed',String(!!hands[side].stopping));
  const boss=game.plants.find(p=>p.boss);$('boss-hud').hidden=!boss||!started;
  if(boss){$('boss-health').style.setProperty('--boss-hp',100*boss.hp/boss.maxHp+'%');$('boss-health').setAttribute('aria-valuenow',String(boss.hp));$('boss-health').setAttribute('aria-valuemax',String(boss.maxHp));$('boss-health').setAttribute('aria-label',t('bossHealth',{hp:boss.hp,max:boss.maxHp}));$('boss-name').textContent=t(boss.finalBoss?'queenName':boss.hp<=boss.maxHp/2?'bossRage':'bossName')+(boss.finalBoss?' · ⛨ '+Object.values(boss.duel.wards).filter(Boolean).length:'');}
  const queen=boss?.finalBoss?boss:null;$('queen-alert').hidden=!queen||!started;arena.classList.toggle('queen-battle',!!queen&&started);
  if(queen){const q=queen.duel,threat=['windup','attack'].includes(q.phase);$('queen-alert').dataset.kind=threat?q.kind:q.phase;$('queen-action').textContent=t(threat?(q.kind==='freeze'?'queenFreeze':'queenPush'):q.phase==='exposed'?'queenExposed':q.phase==='waiting'?'queenWaiting':q.phase==='reflect'?'queenReturning':'queenRest');$('queen-second-palm').hidden=!threat||q.kind!=='push';$('queen-counter').style.width=(threat?Math.min(1,q.counter/(q.kind==='freeze'?.35:.45)):q.phase==='exposed'?q.remaining/4.5:0)*100+'%';}
  let valid=0,visible=0;
  for(const side of sides){
    const h=hands[side],slot=tracking.slots[side];visible+=h.visible?1:0;valid+=now-slot.lastValid<200?1:0;
    const state=h.stopping?'stop':input==='mouse'?'ready':!h.visible?'lost':now-slot.lastValid>=200?'recover':slot.trigger.latched?'lower':'ready';
    $(side+'-status').dataset.state=state;$(side+'-status').textContent=(side==='left'?'L ':'R ')+({ready:'●',lost:'○',recover:'◌',lower:'↙',stop:'✋'}[state]);
    $(side+'-status').title=t({ready:'statusReady',lost:'statusLost',recover:'statusRecover',lower:'statusLower',stop:'statusStop'}[state]);
    const meter=$(side+'-charge'),amount=Math.round(h.charge*100),damage=Number(game.shotDamage(h.charge).toFixed(2));
    meter.style.setProperty('--charge',amount+'%');meter.setAttribute('aria-valuenow',String(amount));meter.setAttribute('aria-label',t('chargeLabel',{side:t(side==='left'?'leftGun':'rightGun'),damage}));meter.classList.toggle('full',h.charge>=1);$(side+'-power').textContent='×'+damage;
  }
  const palms=sides.filter(side=>hands[side].visible&&hands[side].stopping).length;
  $('camera-status').textContent=t(cameraStatusKey({valid,visible,palms,active:game.palm.active,energy:game.palm.energy}));
}
let previous=performance.now();
function frame(now){
  const dt=Math.min((now-previous)/1000,.08);previous=now;
  if(started&&!game.finished){
    if(input==='camera'){
      tracking.expire(now);for(const side of sides){hands[side].visible=tracking.slots[side].visible;hands[side].stopping=tracking.slots[side].stopping;hands[side].charge=game.pauseReason?0:tracking.slots[side].trigger.charge;}
      if(!game.pauseReason&&(now-lastResult>3000||now-lastGun>2200))pause('lost-hand');
      if(now-lastResult>12000&&game.pauseReason==='lost-hand')showError('trackingTimeout');
    }
    if(!game.pauseReason){
      if(input==='mouse')for(const side of sides)hands[side].stopping=mousePalms[side];
      game.palm.setHands(Object.fromEntries(sides.map(side=>[side,hands[side].visible&&hands[side].stopping])));
      tutorial.prepare(game);
      for(const event of game.tick(dt)){
        if(event.type==='damage'){renderer.hurt=1;feedback('ouch',.7);audio.hurt();}
        if(event.type==='wave-start'){feedback('waveIncoming',2.2,{wave:event.wave,count:event.count});audio.wave();}
        if(event.type==='wave-clear')feedback('waveCleared',2.4,{wave:event.wave});
        if(event.type==='upgrade'){resetInput();audio.wave();}
        if(event.type==='queen-warning'||event.type==='queen-awake')audio.wave();
        if(event.type==='burst-impact'){renderer.burstImpact(event.impacts);audio.hurt();audio.wave();}
        if(event.type==='queen-reflected'){const queen=game.plants.find(p=>p.finalBoss);if(queen)renderer.burstImpact([{aim:projectPlant(queen)}]);audio.hurt();}
        if(event.type==='queen-counter'){feedback(event.kind==='push'?'queenReflected':'queenStopped',1.5);audio.wave();}
        if(event.type==='finish')finish();
      }
      if(tutorial.active){
        tutorial.update(dt,game);
        // Safe close targets make every lesson possible without waiting for spawns.
        while(game.plants.length<3)game.spawn((game.nextId%3-1)*.25,.48);
        for(const p of game.plants)p.depth=Math.min(.65,p.depth);
      }
      if(tutorial.ready)challenge();
      refreshTargets();
      if(!game.finished)for(const h of Object.values(hands)){
        if(input==='mouse')h.charge=h.stopping?0:clamp(h.charge+dt*1000/CHARGE_MS);
        const smoothing=1-Math.exp(-dt*14);h.aim.x+=(h.desired.x-h.aim.x)*smoothing;h.aim.y+=(h.desired.y-h.aim.y)*smoothing;
      }
    }
    updateHud(now);
  }
  if(now>feedbackUntil){$('feedback').textContent='';feedbackKey='';}
  audio.setActive(started&&!game.pauseReason&&!game.finished);audio.updateCharges(hands);
  renderer.update(dt,started&&!game.pauseReason&&!game.finished);renderer.draw(game,hands,!started);requestAnimationFrame(frame);
}
refreshLanguage();requestAnimationFrame(frame);
