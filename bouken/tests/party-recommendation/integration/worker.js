'use strict';
importScripts('../phase2/core.js','./unlocks.js','./outcomes.js','./api.js?rev=steps1','./light.js?rev=light1','./balanced-light.js?rev=balance1','./runtime.js?rev=manifest2');
let runtimePromise,running=false;
self.onmessage=async event=>{if(running)return;running=true;const m=event.data,reply=value=>postMessage({...value,requestId:m.requestId,mode:m.mode});try{
 const r=await(runtimePromise??=bootstrap());
 if(m.type==='init'){reply({type:'init',version:r.c.BoukenVersion,characters:r.data.characters,skills:r.data.skills});return;}
 let input;
 if(m.fixture){const spec={count:m.fixture.count,itemFraction:m.fixture.itemFraction,ownershipSeed:m.fixture.seed||305001,itemSeed:305101,missingTarget:m.fixture.itemFraction===1?0:3,claims:0,forceGroups:0,config:{...PartyExperiment.defaults,cumulativeExplored:0,...m.config}};input=BoukenPartyLab.makeFixture(r,spec);input.current=input.owned.slice(0,input.slots);input.save.party=[...input.current];input=PartyExperiment.snapshot(r,input.save);}
 else input=PartyExperiment.snapshot(r,m.raw);
 if(m.type==='input'){reply({type:'input',input});return;}
 if(!input.eligible)throw Error(input.reason);
 const options={config:m.config,locked:m.locked,current:m.current},hooks={yield:()=>new Promise(resolve=>setTimeout(resolve,0)),onProgress:snapshot=>reply({type:'progress',snapshot})};
 if(m.type==='evaluate'){const comparison=await PartyExperiment.compare(r,input,m.current,m.config,hooks);reply({type:'comparison',comparison});return;}

 if(!PartyUnlocks.allowed(input.owned.length,m.mode))throw Error('このモードはまだ使えません');
 let result;if(m.mode==='balanced'&&!m.config?.legacyBalanced){input.current=[...(m.current||input.current)];const seed=m.config?.searchSeed??self.crypto.getRandomValues(new Uint32Array(1))[0];result=await PartyBalancedLight.recommend(r,input,{config:{...m.config,searchSeed:seed},locked:m.locked||[],seed},hooks);}else if(PartyLight.modes.includes(m.mode)){input.current=[...(m.current||input.current)];const seed=m.config?.searchSeed??self.crypto.getRandomValues(new Uint32Array(1))[0],light=await PartyLight.recommend(r,input,{mode:m.mode,config:{...m.config,searchSeed:seed},locked:m.locked||[],current:m.current,seed},hooks);result={...light,banks:{[m.mode]:light.bank},evaluations:light.rows,engine:'light-50x3x10',generatedCandidates:light.rows.length,profile:{rankingMs:light.rankingMs,generationMs:light.generationMs,evaluationMs:light.evaluationMs}};}else result=await PartyExperiment.recommendMany(r,input,options,hooks);reply({type:'result',result});
 }catch(error){reply({type:'error',message:error.message});}finally{running=false;}};
