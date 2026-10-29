const edges = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[0,17],[17,18],[18,19],[19,20]];
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
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) throw new Error('摄像头需要 HTTPS 或 localhost。请在普通浏览器标签页打开游戏；也可以先用鼠标模式体验。');
      onStatus('请在浏览器提示中允许摄像头…');
      const pending = navigator.mediaDevices.getUserMedia({ audio: false, video: { width: {ideal:640}, height: {ideal:480}, facingMode:'user', frameRate:{ideal:24,max:30} } });
      pending.then(stream => { if (!current()) stream.getTracks().forEach(t=>t.stop()); }, () => {});
      const stream = await timeout(pending, 30000, '等待摄像头授权超时。请确认浏览器权限后重试。');
      if (!current()) { stream.getTracks().forEach(t=>t.stop()); return false; }
      this.stream = stream; this.video.srcObject = stream;
      stream.getVideoTracks()[0].addEventListener('ended', () => { if(current()) { this.stop(); onFault('摄像头连接已断开，请重新连接。'); } }, {once:true});
      await timeout(this.video.play(), 10000, '摄像头画面无法播放，请重新连接。');
      if (!current()) return false;
      onStatus('正在加载手势模型，首次可能需要约半分钟…');
      this.worker = new Worker(new URL('./gesture-worker.mjs', import.meta.url), {type:'module'});
      let busy = false, lastTime = -1, capturing = false;
      await timeout(new Promise((resolve,reject) => {
        this.worker.onerror = () => reject(new Error('识别库加载失败，请检查网络后重试。'));
        this.worker.onmessage = e => {
          if (e.data.type === 'ready') resolve();
          if (e.data.type === 'error') reject(new Error(e.data.message));
        };
      }), 45000, '手势模型加载超时。请检查网络后重试，或用鼠标模式体验。');
      if (!current()) return false;
      const fail = message => { if(current()) { this.stop(); onFault(message); } };
      this.worker.onerror = () => fail('手势识别进程已停止，请重新连接。');
      this.worker.onmessage = event => {
        if(!current())return;
        busy=false;
        if(event.data.type==='error'){fail(event.data.message);return;}
        if(event.data.type==='result'){this.draw(event.data.landmarks);onResult(event.data);}
      };
      this.timer=setInterval(async()=>{
        if(!current()||busy||capturing||this.video.readyState<2||lastTime===this.video.currentTime||document.hidden)return;
        capturing=true; const videoTime=this.video.currentTime;
        try {
          const frame=await createImageBitmap(this.video);
          if(!current()){frame.close();return;}
          busy=true;lastTime=videoTime;
          this.worker.postMessage({frame,timestamp:performance.now()},[frame]);
        } catch { fail('无法读取摄像头画面，请重试或换用鼠标模式。'); }
        finally {capturing=false;}
      },80);
      return true;
    } catch(error) {
      if (!current()) return false;
      this.stop();
      const messages = {
        NotAllowedError:'摄像头权限被拒绝。请在浏览器地址栏的权限设置中允许摄像头，再点击重新连接。',
        NotFoundError:'没有找到摄像头。请连接摄像头，或使用鼠标模式体验。',
        NotReadableError:'摄像头无法读取，可能正被其他应用占用。关闭占用它的应用后重试。',
        SecurityError:'浏览器阻止了摄像头。请在独立的 HTTPS 或 localhost 标签页打开。'
      };
      throw new Error(messages[error.name] || error.message || '摄像头连接失败，请重试。');
    }
  }
  draw(points) {
    const c=this.canvas.getContext('2d'),w=this.canvas.width,h=this.canvas.height;
    c.clearRect(0,0,w,h);if(!points.length)return;
    c.strokeStyle='#d4a6ff';c.lineWidth=1.5;
    for(const [a,b] of edges){c.beginPath();c.moveTo(points[a].x*w,points[a].y*h);c.lineTo(points[b].x*w,points[b].y*h);c.stroke();}
    c.fillStyle='#f2ddff';for(const p of points){c.beginPath();c.arc(p.x*w,p.y*h,2,0,Math.PI*2);c.fill();}
  }
}
