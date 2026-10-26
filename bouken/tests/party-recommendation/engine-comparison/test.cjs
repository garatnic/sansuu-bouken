'use strict';
const assert=require('node:assert/strict'),L=require('../phase2/node.cjs'),A=require('../integration/api.js'),I=require('./instrument.cjs'),B=require('./light.cjs'),O=require('../integration/outcomes.js'),r=L.load();
(async()=>{
 for(const spec of [{count:8,fixed:0},{count:100,fixed:1},{count:500,fixed:2},{count:500,fixed:5}]){
  const f=L.makeFixture(r,{count:spec.count,itemFraction:.5,ownershipSeed:7051,itemSeed:7052,claims:0,config:{...A.defaults,size:10}});f.current=f.owned.slice(0,f.slots);f.save.party=[...f.current];f.eligible=true;
  const positions=Array.from({length:f.slots},(_,i)=>f.slots-1-i).slice(0,spec.fixed),locked=positions.map(i=>f.current[i]),before=JSON.stringify(f.save);
  for(const kind of ['anchored','random']){const x=await B.recommend(r,f,{mode:'companion',kind,locked,seed:7001}),seen=new Set();
   for(const e of x.rows){assert.equal(e.party.length,f.slots);assert.equal(new Set(e.party).size,f.slots);assert.ok(e.party.every(id=>f.owned.includes(id)));positions.forEach(i=>assert.equal(e.party[i],f.current[i]));assert.ok(!seen.has(A.key(e.party)));seen.add(A.key(e.party));assert.equal(e.n,3);
    // Verify average directly from real simulations, independently of the evaluator's aggregate.
    const actual=[0,1,2].map(i=>O.adventure(r,f.save,e.party,x.config,x.config.trainSeedStart+i).newCharacters);assert.equal(e.score,actual.reduce((a,b)=>a+b,0)/3);
   }
   const c=B.cursor(x.bank),first=c.current,oldTrials=x.adventures;for(let i=0;i<x.bank.length;i++)c.next();assert.equal(c.current,first);assert.equal(x.adventures,oldTrials);assert.equal(JSON.stringify(f.save),before);
   if(spec.fixed===5)assert.equal(x.rows.length,1);if(spec.count===8)assert.ok(x.rows.length<=8);if(kind==='anchored')assert.ok(x.anchors.every(a=>!locked.includes(a.id)&&a.generated<=5));
  }
 }
 const f=L.makeFixture(r,{count:100,itemFraction:.5,ownershipSeed:8123,itemSeed:8124,claims:0,config:{...A.defaults,size:10}});f.current=f.owned.slice(0,f.slots);f.eligible=true;
 const config={...A.defaults,references:1,referenceTrials:1,anchorTrials:1,randomCandidates:2,candidateLimit:6,initialTrials:1,finalTrials:2,timeLimitMs:1e9};
 const x=await A.recommendMany(r,f,{config}),events=[],y=await I.load().recommendMany(r,f,{config},{audit:e=>events.push(e)});
 assert.equal(JSON.stringify(x.banks),JSON.stringify(y.banks));assert.equal(JSON.stringify(x.evaluations),JSON.stringify(y.evaluations));assert.equal(x.adventures,y.adventures);assert.ok(events.some(e=>e.kind==='exchange'));
 console.log('PASS real 3-trial averages; owned/unique/slots; middle locks; all-fixed/scarce spaces; temporary anchors; cursor cycle without search; save byte equality; instrumented engine equals original with uncapped deterministic work');
})().catch(e=>{console.error(e);process.exitCode=1;});
