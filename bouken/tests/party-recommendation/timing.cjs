'use strict';
// Run after other compute jobs have finished. Timings are Node/cloud-host observations only.
const E=require('./engine.cjs'),fs=require('node:fs'),path=require('node:path'),cfg=require('./config.json'),r=E.load(),old=require('./results.json');
const start=performance.now(),repeat=E.recommend(r,E.fixture(r,30,cfg),cfg),expected=old.results.find(x=>x.ownedCount===30);
if(JSON.stringify(repeat.recommendations)!==JSON.stringify(expected.recommendations))throw Error('Recommendation replay mismatch');
const result={standard30RepeatMs:performance.now()-start,originalStandard30Ms:expected.elapsedMs,reason:'Original first case overlapped the initial quick run; repeat is an isolated-process timing. No dedicated host isolation is claimed.',quick:[]};
const q={...cfg,candidateLimit:16,randomParties:4,trainSeeds:[11001],screenSeeds:[21001,21002],validationTrials:4,rounds:1,swapsPerType:1,finalistsPerType:1};
for(const n of [30,100,500,927]){const a=E.recommend(r,E.fixture(r,n,q),q);result.quick.push({count:n,elapsedMs:a.elapsedMs,adventures:a.adventures,recommendations:a.recommendations});}
fs.writeFileSync(path.join(__dirname,'timing-results.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({standard30RepeatMs:result.standard30RepeatMs,quick:result.quick.map(x=>({count:x.count,ms:x.elapsedMs}))}));
