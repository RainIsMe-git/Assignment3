// Each lesson advances only after its action, followed by a short success beat.
import {MAX_ENERGY} from './palm-control.mjs';
export const LESSONS=['fire','charge','freeze','mixed','push','recharge'];
export class Tutorial {
  constructor(){this.reset();}
  reset(){this.index=0;this.active=true;this.progress=0;this.success=0;this.ready=false;this.previousEnergy=null;this.missing=0;}
  get step(){return LESSONS[this.index]||'done';}
  get unlimitedEnergy(){return this.active&&['freeze','mixed','push'].includes(this.step);}
  prepare(game){if(this.unlimitedEnergy&&!game.pauseReason)game.palm.energy=MAX_ENERGY;}
  complete(){if(!this.success)this.success=.5;}
  shot(event,game){
    if(!this.active||this.success||!event)return;
    if(this.step==='fire'){this.progress++;if(this.progress>=2)this.complete();}
    if(this.step==='charge'&&event.charge>=.95)this.complete();
    if(this.step==='mixed'&&game.palm.energy>0&&Number(game.palm.hands.left)+Number(game.palm.hands.right)===1&&!game.palm.hands[event.hand])this.complete();
  }
  update(dt,game){
    if(!this.active||game.pauseReason||game.finished)return;
    if(this.success){
      this.success=Math.max(0,this.success-dt);
      if(!this.success){this.index++;this.progress=0;this.missing=0;if(this.step==='recharge')game.palm.energy=Math.min(game.palm.energy,MAX_ENERGY-3);this.previousEnergy=game.palm.energy;if(this.step==='done'){this.active=false;this.ready=true;}}
      return;
    }
    const held=this.step==='freeze'?game.palm.active===1:this.step==='push'?game.palm.active===2:false;
    if(['freeze','push'].includes(this.step)){
      this.missing=held?0:this.missing+dt;
      if(held)this.progress+=dt*game.palm.strength;else if(this.missing>.6)this.progress=Math.max(0,this.progress-dt*.25);
      if(this.progress>=(this.step==='push'?1.2:1))this.complete();
    }
    if(this.step==='recharge'){
      if(!game.palm.hands.left&&!game.palm.hands.right&&this.previousEnergy!==null)this.progress+=Math.max(0,game.palm.energy-this.previousEnergy);
      if(this.progress>=.6)this.complete();
    }
    this.previousEnergy=game.palm.energy;
  }
}
