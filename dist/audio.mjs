import {shotStyle} from './combat-feedback.mjs';
const files={music:'garden-jazz.mp3',light:'shot-light.mp3',medium:'shot-medium.mp3',heavy:'shot-heavy.mp3',charge:'charge-loop.mp3'};
export class GameAudio {
  constructor({contextFactory=()=>new (window.AudioContext||window.webkitAudioContext)(),fetchFile=url=>fetch(url)}={}){
    this.contextFactory=contextFactory;this.fetchFile=fetchFile;this.ctx=null;this.enabled=true;this.active=false;this.buffers={};this.voices=new Set();this.charges={};this.full={};this.music=null;this.musicOffset=0;this.loading=null;
  }
  async unlock(){
    try{
      if(!this.ctx){
        this.ctx=this.contextFactory();this.master=this.ctx.createGain();this.master.gain.value=.8;
        const limiter=this.ctx.createDynamicsCompressor();limiter.threshold.value=-10;limiter.knee.value=12;limiter.ratio.value=8;this.master.connect(limiter);limiter.connect(this.ctx.destination);
      }
      await this.ctx.resume();
      if(!this.loading)this.loading=Promise.all(Object.entries(files).map(async([key,file])=>{
        const response=await this.fetchFile(new URL('./assets/audio/'+file,import.meta.url));
        if(!response.ok)throw new Error(file);
        this.buffers[key]=await this.ctx.decodeAudioData(await response.arrayBuffer());
      })).catch(error=>{this.loading=null;console.warn('Audio unavailable:',error.message);});
      await this.loading;this.syncMusic();
    }catch(error){console.warn('Audio unavailable:',error.message);}
  }
  get audible(){return !!(this.ctx&&this.ctx.state==='running'&&this.enabled&&this.active);}
  setEnabled(enabled){this.enabled=enabled;if(!enabled)this.silence();else this.syncMusic();}
  setActive(active){if(this.active===active)return;this.active=active;if(!active)this.silence();else this.syncMusic();}
  source(buffer,volume,pan=0){
    const source=this.ctx.createBufferSource(),gain=this.ctx.createGain(),stereo=this.ctx.createStereoPanner();
    source.buffer=buffer;gain.gain.value=volume;stereo.pan.value=pan;source.connect(gain);gain.connect(stereo);stereo.connect(this.master);
    const voice={source,gain,stop:()=>{try{source.stop();}catch{}this.voices.delete(voice);}};
    source.onended=()=>{source.disconnect();gain.disconnect();stereo.disconnect();this.voices.delete(voice);};this.voices.add(voice);return voice;
  }
  syncMusic(){
    if(!this.audible||!this.buffers.music||this.music)return;
    this.music=this.source(this.buffers.music,.19);this.music.source.loop=true;this.musicStart=this.ctx.currentTime;
    this.music.source.start(0,this.musicOffset%this.buffers.music.duration);
  }
  stopCharge(side){this.charges[side]?.stop();delete this.charges[side];this.full[side]=false;}
  resetCharges(){for(const side of ['left','right'])this.stopCharge(side);}
  silence(){
    if(this.music){this.musicOffset=(this.musicOffset+this.ctx.currentTime-this.musicStart)%this.buffers.music.duration;this.music=null;}
    for(const voice of [...this.voices])voice.stop();this.charges={};this.full={};
  }
  updateCharges(hands){
    if(!this.audible)return;
    for(const side of ['left','right']){
      const hand=hands[side],q=hand?.visible?hand.charge:0;
      if(q<.035){this.stopCharge(side);continue;}
      if(!this.charges[side]&&this.buffers.charge){
        const voice=this.source(this.buffers.charge,.015,side==='left'?-.45:.45);voice.source.loop=true;voice.source.start();this.charges[side]=voice;
      }
      const voice=this.charges[side],now=this.ctx.currentTime;
      if(voice){voice.source.playbackRate.setTargetAtTime(.65+q*.85,now,.07);voice.gain.gain.setTargetAtTime(q>=.999?.025:.025+q*.09,now,.07);}
      if(q>=.999&&!this.full[side]){this.full[side]=true;this.chime(side);}
    }
  }
  chime(side){
    // Quiet two-note cue, once per charge, rather than a continuous full-charge alarm.
    for(const [index,hz] of [784,1175].entries())this.note(hz,.045,.13,this.ctx.currentTime+index*.065,side==='left'?-.35:.35);
  }
  note(hz,volume,duration,when,pan=0){
    const osc=this.ctx.createOscillator(),gain=this.ctx.createGain(),stereo=this.ctx.createStereoPanner();osc.type='sine';osc.frequency.value=hz;gain.gain.setValueAtTime(volume,when);gain.gain.exponentialRampToValueAtTime(.0001,when+duration);stereo.pan.value=pan;osc.connect(gain);gain.connect(stereo);stereo.connect(this.master);
    const voice={stop:()=>{try{osc.stop();}catch{}this.voices.delete(voice);}};this.voices.add(voice);osc.onended=()=>{osc.disconnect();gain.disconnect();stereo.disconnect();this.voices.delete(voice);};osc.start(when);osc.stop(when+duration);
  }
  shoot(event){
    this.stopCharge(event.hand);if(!this.audible)return;
    const style=shotStyle(event.damage),buffer=this.buffers[style.sample],pan=event.hand==='left'?-.32:.32;
    if(buffer){const voice=this.source(buffer,[.72,.64,.6][event.damage-1],pan);voice.source.start();}
    // Impact is scheduled on the audio clock at the same flight time as the cel.
    this.note(event.killed?180:280-event.damage*35,.055+event.damage*.018,.08+event.damage*.025,this.ctx.currentTime+style.flight,pan*.4);
  }
  hurt(){if(this.audible)this.note(90,.07,.2,this.ctx.currentTime);}
}
