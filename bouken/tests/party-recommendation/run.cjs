'use strict';
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),E=require('./engine.cjs');
const config=require('./config.json'),quick=process.argv.includes('--quick'),counts=process.argv.find(x=>x.startsWith('--counts='))?.split('=')[1].split(',').map(Number)||[30,100,500,927];
const cfg=quick?{...config,candidateLimit:16,randomParties:4,trainSeeds:[11001],screenSeeds:[21001,21002],validationTrials:4,rounds:1,swapsPerType:1,finalistsPerType:1}:config;
const runtime=E.load(),results=[];for(const count of counts){const f=E.fixture(runtime,count,cfg),result=E.recommend(runtime,f,cfg);results.push(result);console.log(JSON.stringify({count,slots:f.slots,ms:result.elapsedMs,adventures:result.adventures,recommendations:result.recommendations.map(x=>({type:x.type,party:x.party,scores:x.scores}))}));}
const out={sourceCommit:'bf5a69255f627090c2e6fa2ce089209b88d72a4f',version:69,environment:{node:process.version,platform:process.platform,arch:process.arch,cpu:os.cpus()[0].model,logicalCpus:os.cpus().length,memoryBytes:os.totalmem()},config:cfg,mode:quick?'quick':'standard',results};
fs.writeFileSync(path.join(__dirname,quick?'results-quick.json':'results.json'),JSON.stringify(out,null,2)+'\n');
