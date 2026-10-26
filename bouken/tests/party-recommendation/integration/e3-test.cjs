'use strict';
const assert=require('node:assert/strict'),A=require('./api-e3-candidate.cjs'),L=require('../phase2/node.cjs'),r=L.load();
(async()=>{
 const cfg={...A.defaults,references:2,referenceTrials:2,anchorTrials:2,initialTrials:2,finalTrials:4,confirmationTrials:5,candidateLimit:8,randomCandidates:2,timeLimitMs:60000};
 const f=L.makeFixture(r,{count:140,itemFraction:.5,ownershipSeed:42700101,config:cfg});f.current=f.owned.slice(0,f.slots);f.eligible=true;const before=JSON.stringify(f.save),locked=[f.current[1]];
 const result=await A.recommendMany(r,f,{current:f.current,locked,config:cfg});
 const seeds=[...Array.from({length:4},(_,i)=>cfg.selectionSeedStart+i),...Array.from({length:5},(_,i)=>cfg.selectionSeedStart+1000000+i)];assert.equal(new Set(seeds).size,9);
 const ev=A.evaluator(r,f,cfg);for(const bank of Object.values(result.banks)){assert.ok(bank.length);for(const e of bank){assert.equal(e.phase,'confirmation');assert.equal(e.n,9);assert.equal(e.party[1],f.current[1]);assert.deepEqual(e.raw,(await ev.evaluateParty(e.party,seeds)).raw);}}
 assert.equal(JSON.stringify(f.save),before);console.log('PASS every published candidate measured on both independent search streams, non-leading fixed position preserved, no save writes');
})().catch(e=>{console.error(e);process.exitCode=1;});
