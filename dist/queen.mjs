// Telegraph -> incoming attack -> recovery. Counters continue while time is frozen.
export function createQueen(){return {phase:'rest',kind:'freeze',remaining:3.5,counter:0,flight:0,cycle:0,wards:{freeze:true,push:true}};}
export function updateQueen(q,dt,palm){
  const strength=palm.active?palm.strength:0;
  if(q.phase==='windup'||q.phase==='attack'){
    const correct=q.kind==='freeze'?palm.active>=1:palm.active===2;
    q.counter=correct?q.counter+dt*strength:Math.max(0,q.counter-dt*.7);
    if(q.counter>=(q.kind==='freeze'?.6:.75)){
      const kind=q.kind;q.wards[kind]=false;q.phase='exposed';q.remaining=3.5;q.counter=0;q.flight=0;return {type:'counter',kind};
    }
    // A single palm also buys time against the heavy projectile, but only two
    // palms can reflect it. Energy still drains in both cases.
    q.remaining-=dt*(1-strength);
    if(q.phase==='attack')q.flight=Math.min(1,1-Math.max(0,q.remaining)/1.8);
    if(q.remaining<=0){
      if(q.phase==='windup'){q.phase='attack';q.remaining=1.8;q.flight=0;return {type:'launch',kind:q.kind};}
      const kind=q.kind;q.phase='rest';q.remaining=4;q.flight=0;return {type:'hit',kind};
    }
    return null;
  }
  q.remaining-=dt*(q.phase==='rest'?1-strength:1);
  if(q.remaining>0)return null;
  if(q.phase==='exposed'){q.phase='rest';q.remaining=4;return null;}
  q.kind=q.cycle++%2===0?'freeze':'push';q.phase='windup';q.remaining=2.8;q.counter=0;return {type:'warning',kind:q.kind};
}
