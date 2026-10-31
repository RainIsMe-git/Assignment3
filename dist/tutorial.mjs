// Each lesson advances only after its action, followed by a short success beat.
export const LESSONS=['fire','charge','freeze','mixed','push','recharge','burst'];
export class Tutorial {
  constructor(){this.reset();}
  reset(){this.index=0;this.active=true;this.progress=0;this.success=0;this.ready=false;this.previousEnergy=null;}
  get step(){return LESSONS[this.index]||'done';}
  complete(){if(!this.success)this.success=.85;}
  shot(event,game){
    if(!this.active||this.success||!event)return;
    if(this.step==='fire'){this.progress++;if(this.progress>=2)this.complete();}
    if(this.step==='charge'&&event.charge>=.95)this.complete();
    if(this.step==='mixed'&&game.palm.energy>0&&Number(game.palm.hands.left)+Number(game.palm.hands.right)===1&&!game.palm.hands[event.hand])this.complete();
    if(this.step==='burst'&&event.explosive&&event.splash.length)this.complete();
  }
  update(dt,game){
    if(!this.active||game.pauseReason||game.finished)return;
    if(this.success){
      this.success=Math.max(0,this.success-dt);
      if(!this.success){this.index++;this.progress=0;this.previousEnergy=game.palm.energy;if(this.step==='done'){this.active=false;this.ready=true;}}
      return;
    }
    const held=this.step==='freeze'?game.palm.active===1:this.step==='push'?game.palm.active===2:false;
    if(['freeze','push'].includes(this.step)){this.progress=held?this.progress+dt:0;if(this.progress>=1)this.complete();}
    if(this.step==='recharge'){
      if(!game.palm.hands.left&&!game.palm.hands.right&&this.previousEnergy!==null)this.progress+=Math.max(0,game.palm.energy-this.previousEnergy);
      if(this.progress>=.6)this.complete();
    }
    this.previousEnergy=game.palm.energy;
  }
}
