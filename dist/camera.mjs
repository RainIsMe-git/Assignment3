const edges = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[0,17],[17,18],[18,19],[19,20]];
import {HAND_COLORS} from './hand-identity.mjs';
const timeout = (promise, ms, message) => {
  let timer;
  return Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(message)), ms); })]).finally(() => clearTimeout(timer));
};

export class HandCamera {
  constructor(video, canvas) { this.video = video; this.canvas = canvas; this.session = 0; this.worker = null; this.stream = null; this.timer = null; }
  stop() {
    this.session++;
    clearInterval(this.timer); this.timer = null;
    this.worker?.terminate(); this.worker = null;
    this.stream?.getTracks().forEach(track => track.stop()); this.stream = null;
    this.video.srcObject = null;
    this.canvas.getContext('2d').clearRect(0,0,this.canvas.width,this.canvas.height);
  }
  async start(onResult, onStatus, onFault) {
    this.stop();
    const session = this.session;
    const current = () => session === this.session;
    try {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) throw new Error('cameraSecure');
      onStatus('cameraPermission');
      const pending = navigator.mediaDevices.getUserMedia({ audio: false, video: { width: {ideal:640}, height: {ideal:480}, facingMode:'user', frameRate:{ideal:60,max:60} } });
      pending.then(stream => { if (!current()) stream.getTracks().forEach(t=>t.stop()); }, () => {});
      const stream = await timeout(pending, 30000, 'cameraTimeout');
      if (!current()) { stream.getTracks().forEach(t=>t.stop()); return false; }
      this.stream = stream; this.video.srcObject = stream;
      stream.getVideoTracks()[0].addEventListener('ended', () => { if(current()) { this.stop(); onFault('cameraDisconnected'); } }, {once:true});
      await timeout(this.video.play(), 10000, 'cameraPlayback');
      if (!current()) return false;
      onStatus('modelLoading');
      this.worker = new Worker(new URL('./gesture-worker.mjs', import.meta.url));
      let busy = false, lastTime = -1, capturing = false;
      await timeout(new Promise((resolve,reject) => {
        this.worker.onerror = () => reject(new Error('modelLoadFailed'));
        this.worker.onmessage = e => {
          if (e.data.type === 'ready') resolve();
          if (e.data.type === 'error') reject(new Error(e.data.message));
        };
      }), 45000, 'modelTimeout');
      if (!current()) return false;
      const fail = message => { if(current()) { this.stop(); onFault(message); } };
      this.worker.onerror = () => fail('trackingStopped');
      this.worker.onmessage = event => {
        if(!current())return;
        busy=false;
        if(event.data.type==='error'){fail(event.data.message);return;}
        if(event.data.type==='result')onResult(event.data);
      };
      this.timer=setInterval(async()=>{
        if(!current()||busy||capturing||this.video.readyState<2||lastTime===this.video.currentTime||document.hidden)return;
        capturing=true; const videoTime=this.video.currentTime;
        try {
          const frame=await createImageBitmap(this.video);
          if(!current()){frame.close();return;}
          busy=true;lastTime=videoTime;
          this.worker.postMessage({frame,timestamp:performance.now()},[frame]);
        } catch { fail('frameFailed'); }
        finally {capturing=false;}
      },16);
      return true;
    } catch(error) {
      if (!current()) return false;
      this.stop();
      const messages = {
        NotAllowedError:'cameraDenied',
        NotFoundError:'cameraNotFound',
        NotReadableError:'cameraBusy',
        SecurityError:'cameraBlocked'
      };
      throw new Error(messages[error.name] || error.message || 'cameraFailed');
    }
  }
  draw(hands) {
    const c=this.canvas.getContext('2d'),w=this.canvas.width,h=this.canvas.height;
    c.clearRect(0,0,w,h);
    for(const hand of hands){
    const points=hand.landmarks;if(points.length!==21||!HAND_COLORS[hand.side])continue;
    c.strokeStyle=HAND_COLORS[hand.side];c.lineWidth=2.5;
    for(const [a,b] of edges){c.beginPath();c.moveTo(points[a].x*w,points[a].y*h);c.lineTo(points[b].x*w,points[b].y*h);c.stroke();}
    c.fillStyle='#fff1cb';for(const p of points){c.beginPath();c.arc(p.x*w,p.y*h,2,0,Math.PI*2);c.fill();}
    c.save();c.translate(Math.max(13,Math.min(w-13,points[0].x*w)),Math.max(15,Math.min(h-9,points[0].y*h+14)));c.scale(-1,1);
    c.fillStyle=HAND_COLORS[hand.side];c.fillRect(-11,-12,22,20);c.fillStyle='#fff1cb';c.font='bold 16px sans-serif';c.textAlign='center';c.fillText(hand.side==='left'?'L':'R',0,4);c.restore();
    }
  }
}
