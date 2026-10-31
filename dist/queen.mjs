// More reaction time, short forgiving counters, and a real return-flight phase.
export const QUEEN_WINDUP=4.5,QUEEN_FLIGHT=3,QUEEN_RETURN=.85;
export function createQueen(){return {phase:'waiting',kind:'freeze',remaining:5,counter:0,flight:0,cycle:0,wards:{freeze:true,push:true}};}
export function updateQueen(q,dt,palm){
 if(q.phase==='waiting')return null;
 const strength=palm.active?palm.strength:0;
 if(q.phase==='reflect'){
  q.remaining-=dt;q.flight=q.returnFrom*Math.max(0,q.remaining/QUEEN_RETURN);
  if(q.remaining<=0){q.phase='exposed';q.remaining=4.5;q.flight=0;return {type:'reflected',kind:'push'};}return null;
 }
 if(q.phase==='windup'||q.phase==='attack'){
  const correct=q.kind==='freeze'?palm.active>=1:palm.active===2;
  q.counter=correct?q.counter+dt*strength:Math.max(0,q.counter-dt*.35);
  if(q.counter>=(q.kind==='freeze'?.35:.45)){
   const kind=q.kind;q.wards[kind]=false;q.counter=0;
   if(kind==='push'){q.phase='reflect';q.returnFrom=Math.max(.22,q.flight);q.flight=q.returnFrom;q.remaining=QUEEN_RETURN;}
   else{q.phase='exposed';q.remaining=4.5;q.flight=0;}
   return {type:'counter',kind};
  }
  q.remaining-=dt*(1-strength*.55);
  if(q.phase==='attack')q.flight=Math.min(1,.22+.78*(1-Math.max(0,q.remaining)/QUEEN_FLIGHT));
  if(q.remaining<=0){
   if(q.phase==='windup'){q.phase='attack';q.remaining=QUEEN_FLIGHT;q.flight=.22;return {type:'launch',kind:q.kind};}
   const kind=q.kind;q.phase='rest';q.remaining=5;q.flight=0;return {type:'hit',kind};
  }return null;
 }
 q.remaining-=dt;if(q.remaining>0)return null;
 if(q.phase==='exposed'){q.phase='rest';q.remaining=5;return null;}
 q.kind=q.cycle++%2===0?'freeze':'push';q.phase='windup';q.remaining=QUEEN_WINDUP;q.counter=0;q.flight=.22;return {type:'warning',kind:q.kind};
}
