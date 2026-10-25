'use strict';
importScripts('../phase2/core.js','./unlocks.js','./outcomes.js','./api.js','./runtime.js');
let runtimePromise,running=false;
self.onmessage=async event=>{if(running)return;running=true;const m=event.data;try{
 const r=await(runtimePromise??=bootstrap());
 if(m.type==='init'){postMessage({type:'init',version:r.c.BoukenVersion,characters:r.data.characters,skills:r.data.skills});return;}
 let input;
 if(m.fixture){const spec={count:m.fixture.count,itemFraction:m.fixture.itemFraction,ownershipSeed:m.fixture.seed||305001,itemSeed:305101,missingTarget:m.fixture.itemFraction===1?0:3,claims:0,forceGroups:0,config:{...PartyExperiment.defaults,cumulativeExplored:0,...m.config}};input=BoukenPartyLab.makeFixture(r,spec);input.current=input.owned.slice(0,input.slots);input.save.party=[...input.current];input=PartyExperiment.snapshot(r,input.save);}
 else input=PartyExperiment.snapshot(r,m.raw);
 if(m.type==='input'){postMessage({type:'input',input});return;}
 if(!input.eligible)throw Error(input.reason);
 const options={config:m.config,locked:m.locked,current:m.current},hooks={yield:()=>new Promise(resolve=>setTimeout(resolve,0)),onProgress:snapshot=>postMessage({type:'progress',snapshot})};
 if(m.type==='evaluate'){const comparison=await PartyExperiment.compare(r,input,m.current,m.config,hooks);postMessage({type:'comparison',comparison});return;}

 if(!PartyUnlocks.allowed(input.owned.length,m.mode))throw Error('このモードはまだ使えません');
 const result=await PartyExperiment.recommendMany(r,input,options,hooks);postMessage({type:'result',result});
 }catch(error){postMessage({type:'error',message:error.message});}finally{running=false;}};
