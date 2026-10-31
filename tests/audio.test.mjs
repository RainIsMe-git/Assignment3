import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {GameAudio} from '../dist/audio.mjs';
import {shotStyle} from '../dist/combat-feedback.mjs';
function fakeContext(){
 const param=()=>({value:0,setValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(){}});
 const nodes=[];const node=()=>{const n={gain:param(),pan:param(),frequency:param(),playbackRate:param(),threshold:param(),knee:param(),ratio:param(),connect(){},disconnect(){},start(...args){this.started=args;},stop(){this.stopped=true;}};nodes.push(n);return n;};
 return {nodes,state:'running',currentTime:0,destination:{},resume:async()=>{},decodeAudioData:async()=>({duration:20}),createGain:node,createStereoPanner:node,createBufferSource:node,createOscillator:node,createDynamicsCompressor:node};
}
const setup=()=>{const ctx=fakeContext();return {ctx,audio:new GameAudio({contextFactory:()=>ctx,fetchFile:async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)})})};};
test('music has one loop, pauses at its position, and mute cancels all voices',async()=>{
 const {ctx,audio}=setup();audio.setActive(true);await audio.unlock();const first=audio.music;
 audio.setActive(true);await audio.unlock();assert.equal(audio.music,first);
 ctx.currentTime=7;audio.setActive(false);assert.equal(audio.music,null);assert.equal(first.source.stopped,true);assert.equal(audio.musicOffset,7);
 audio.setActive(true);assert.equal(audio.music.source.started[1],7);
 audio.updateCharges({left:{visible:true,charge:.5},right:{visible:true,charge:.7}});assert.equal(Object.keys(audio.charges).length,2);
 audio.setEnabled(false);assert.equal(audio.voices.size,0);assert.equal(audio.music,null);assert.equal(Object.keys(audio.charges).length,0);
});
test('muting during decode never starts music after loading completes',async()=>{
 const {audio}=setup();audio.setActive(true);const pending=audio.unlock();audio.setEnabled(false);await pending;assert.equal(audio.music,null);assert.equal(audio.voices.size,0);
});
test('each hand charges independently and pausing cancels scheduled impacts',async()=>{
 const {audio}=setup();await audio.unlock();audio.setActive(true);
 audio.updateCharges({left:{visible:true,charge:.8},right:{visible:true,charge:.9}});const right=audio.charges.right;
 audio.shoot({hand:'left',damage:2,killed:false});assert.equal(audio.charges.left,undefined);assert.equal(audio.charges.right,right);
 audio.setActive(false);assert.equal(audio.voices.size,0);assert.equal(Object.keys(audio.charges).length,0);
});
test('full charge cues once and all three shots use their supplied sample',async()=>{
 const {audio}=setup();await audio.unlock();audio.setActive(true);
 const hands={left:{visible:true,charge:1},right:{visible:false,charge:0}};
 audio.updateCharges(hands);const count=audio.voices.size;audio.updateCharges(hands);assert.equal(audio.voices.size,count);
 for(const damage of [1,2,3]){audio.shoot({hand:'left',damage,killed:true});assert.ok([...audio.voices].some(v=>v.source?.buffer===audio.buffers[shotStyle(damage).sample]));}
});
test('all five audio assets are real packaged MP3s and damage tiers have distinct timings',async()=>{
 for(const name of ['garden-jazz','shot-light','shot-medium','shot-heavy','charge-loop']){const data=await readFile(new URL('../dist/assets/audio/'+name+'.mp3',import.meta.url));assert.ok(data.length>4000);assert.equal(data.subarray(0,3).toString(),'ID3');}
 const styles=[1,2,3].map(shotStyle);assert.equal(new Set(styles.map(s=>s.sample)).size,3);assert.ok(styles.every(s=>s.duration>s.flight));assert.ok(styles[2].impact>styles[1].impact&&styles[1].impact>styles[0].impact);
});
