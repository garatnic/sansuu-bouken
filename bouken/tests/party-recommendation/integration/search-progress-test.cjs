'use strict';
const assert=require('node:assert/strict'),P=require('./search-progress.js'),A=require('./api.js'),L=require('../phase2/node.cjs'),r=L.load();
(async()=>{
 const p=P.create(()=>8/19);assert.equal(p.nextMessage(),P.messages[8]);assert.equal(p.nextMessage(),P.messages[9]);
 const q=P.create();let last='';for(let i=0;i<5000;i++){const m=q.nextMessage();assert.notEqual(m,last);if(last===P.messages[8])assert.equal(m,P.messages[9]);if(m===P.messages[9])assert.equal(last,P.messages[8]);last=m;}
 assert.equal(p.update({stage:5,completed:1,total:2}).value,55);assert.equal(p.update({stage:2,completed:0,total:1}).value,55);assert.equal(p.update({stage:9,completed:1,total:1}).value,99);assert.equal(p.finish(),100);p.reset();assert.equal(p.update({stage:8,completed:1,total:2},false).value,25);assert.equal(p.update({stage:9,completed:2,total:0}),null);
 const cfg={...A.defaults,timeLimitMs:60000,references:2,referenceTrials:2,anchorTrials:2,candidateLimit:4,randomCandidates:2,initialTrials:2,finalTrials:3};
 const f=L.makeFixture(r,{count:100,itemFraction:.5,config:cfg});f.current=f.owned.slice(0,f.slots);f.save.party=[...f.current];f.eligible=true;const before=JSON.stringify(f.save);
 for(const timeLimitMs of [60000,0]){
  const events=[];const result=await A.recommendMany(r,f,{current:f.current,config:{...cfg,timeLimitMs}},{onProgress:s=>events.push(s)});
  assert.deepEqual([...new Set(events.map(s=>s.stage))],[0,1,2,3,4,5,6,7]);assert.ok(events.some(s=>s.stage===0&&s.completed%1!==0));assert.ok(events.every(s=>s.completed>=0&&s.completed<=s.total));
  const display=P.create();let previous=0;for(const s of events){const t=display.update(s);assert.ok(t.value>=previous&&t.value<100);previous=t.value;}
  const party=result.banks.balanced[0].party;await A.compare(r,f,party,cfg,{onProgress:s=>{events.push(s);const t=display.update(s);assert.ok(t.value>=previous&&t.value<100);previous=t.value;}});
  assert.deepEqual([...new Set(events.map(s=>s.stage))],[0,1,2,3,4,5,6,7,8,9]);assert.equal(display.finish(),100);
 }
 assert.equal(JSON.stringify(f.save),before);console.log('PASS messages 5000 transitions, 9→10 pairing, monotonic work progress, normal/early-stop search+comparison, unchanged save');
})().catch(e=>{console.error(e);process.exitCode=1;});
