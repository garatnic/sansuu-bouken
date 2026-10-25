'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),L=require('./node.cjs'),base=require('./config.json'),old=require('../config.json'),phase1=require('../results.json');
const scenarios=[...([30,100,500,927].map(count=>({id:'legacy-'+count,count,legacy:true,config:{...old,...base,targetGroup:'01'}}))),
 {id:'early-140',count:140,itemFraction:.05,ownershipSeed:902,itemSeed:1902,missingTarget:3,config:{...base}},
 {id:'late-279-unclaimed',count:279,itemFraction:.95,ownershipSeed:903,itemSeed:1903,missingTarget:3,claims:0,config:{...base}},
 ...[10,20,30].map(size=>({id:'alternate-500-'+size,count:500,itemFraction:.5,ownershipSeed:902,itemSeed:1902,forceGroups:12,missingTarget:3,claims:0,config:{...base,size,maxAdventures:size===10?700:350,references:size===10?24:12,referenceTrials:size===10?4:2,anchorTrials:size===10?64:32,maxTrials:size===10?32:16}})),
 {id:'late-900',count:900,itemFraction:.95,ownershipSeed:904,itemSeed:1904,missingTarget:3,claims:0,config:{...base}},
 {id:'ownership-only-500',count:500,legacy:true,ownershipOnly:902,config:{...old,...base,targetGroup:'01'}},
 {id:'rich-927-unclaimed',count:927,itemFraction:.95,ownershipSeed:904,itemSeed:1904,forceGroups:60,missingTarget:3,claims:0,config:{...base}},
 {id:'rich-927',count:927,itemFraction:.95,ownershipSeed:904,itemSeed:1904,forceGroups:60,missingTarget:3,claims:80,config:{...base}}];
const runtime=L.load(),filter=process.argv.find(x=>x.startsWith('--case='))?.slice(7),dir=path.join(__dirname,'results');fs.mkdirSync(dir,{recursive:true});
(async()=>{for(const spec of scenarios.filter(s=>!filter||s.id===filter)){
 const input=L.fixture(runtime,spec);if(spec.ownershipOnly){input.owned=L.shuffle(runtime.data.characters.map(x=>x.id),L.rng(spec.ownershipOnly)).slice(0,spec.count);input.save.characters=Object.fromEntries(input.owned.map(id=>[id,1]));input.save.characterJoinOrder=[...input.owned];}
 const previous=spec.legacy&&!spec.ownershipOnly?phase1.results.find(x=>x.ownedCount===spec.count):null,incumbents=previous?.recommendations.map(x=>x.party),startMemory=process.memoryUsage();
 const result=await L.recommend(runtime,input,spec.config,{incumbents,onProgress:x=>console.log(JSON.stringify({case:spec.id,stage:x.stage,ms:Math.round(x.elapsedMs),adventures:x.adventures}))});
 const file={sourceCommit:'dd6d9206fd11f556ffe222a8c6c9ad39c0377269',version:69,spec,input,environment:{node:process.version,platform:process.platform,arch:process.arch,cpu:os.cpus()[0].model,logicalCpus:os.cpus().length},memory:{before:startMemory,after:process.memoryUsage()},phase1Recommendations:previous?.recommendations||null,result};fs.writeFileSync(path.join(dir,spec.id+'.json'),JSON.stringify(file,null,2)+'\n');console.log('DONE',spec.id,result.elapsedMs,result.adventures,result.recommendations.map(x=>x.party));
}})().catch(e=>{console.error(e);process.exitCode=1;});
