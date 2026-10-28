'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const L=require('../../party-recommendation/phase2/node.cjs');
const {sha,ROOT}=require('./plan.cjs');
const clone=x=>JSON.parse(JSON.stringify(x));
function freeze(x){if(x&&typeof x==='object'){Object.freeze(x);for(const v of Object.values(x))freeze(v);}return x;}
function load(){
 const runtime=L.load();
 // Separate VM: decision code cannot close over runtime, save, world or engine RNG.
 const policyContext=vm.createContext({performance:{now:()=>0}});
 vm.runInContext(fs.readFileSync(path.join(ROOT,'tests/party-recommendation/phase2/core.js'),'utf8'),policyContext);
 const decide=vm.runInContext('(observation,seed)=>BoukenPartyLab.policy(observation,BoukenPartyLab.rng(seed))',policyContext);
 return {runtime,decide};
}
function checkSources(cfg){for(const [p,h]of Object.entries(cfg.sourceHashes))if(sha(fs.readFileSync(path.join(ROOT,p)))!==h)throw Error('Source changed '+p);}
function assertPublic(o,w){
 for(const cell of o.cells)if(!w.explored[cell.index]&&!w.revealed[cell.index]&&(cell.terrain!==null||cell.facility!==null||cell.visited!==false))throw Error('Hidden information leak');
 for(const key of ['events','eventPools','eventChoices','eventResults','random','seed'])if(Object.hasOwn(o,key))throw Error('Forbidden observation field '+key);
 if(o.guide&&Object.keys(o.guide).sort().join(',')!=='arrow,origin')throw Error('Guide target leak');
}
function execute(env,base,party,cfg,seed,options={}){
 const {runtime:r,decide}=env,{c,data}=r,random=L.rng(seed),actionRandom=L.rng(seed^0xa5a5a5a5);
 const originalById=r.byId;
 if(options.removeSkill){const map=new Map(originalById),id=options.supportId,ch=map.get(id);map.set(id,{...ch,skills:ch.skills.filter(s=>s.id!==options.removeSkill)});r.byId=map;}
 let departed;
 try{departed=L.depart(r,base,party,cfg,random);}finally{r.byId=originalById;}
 const {save,w,initial}=departed,claimsBefore=JSON.stringify(save.claimedCollectionRewards),stagesBefore=Array.from(c.BoukenCollection.stages(save));
 const initialInventory=sha({characters:save.characters,items:save.items,claims:save.claimedCollectionRewards});
 if(initialInventory!==cfg.inventoryHash)throw Error('Initial inventory changed');
 if(JSON.stringify(stagesBefore)!==JSON.stringify(cfg.museumStages))throw Error('Initial museum changed');
 const startChars=new Set(Object.keys(base.characters).filter(id=>base.characters[id]>0)),startItems=new Set(Object.keys(base.items).filter(id=>base.items[id]>0));
 const seenChars=new Set(startChars),seenItems=new Set(startItems),discovered=new Map(),detected=new Set(),trace=[],outcomes=[];
 let q=0,extra=0,skillInitial=initial,compEvents=0,itemEvents=0,joinSuccess=0,itemSuccess=0,newCharacters=0,newItems=0,totalItems=0,retryAttempts=0,rewardJoins=0,blocked=0,a12EligibleTurns=0,emptyFrontierTurns=0,signalSteps={treasure:0,companion:0,guide:0,sense:0,visibleFacility:0},targetItems=0,targetNewItems=0,groupJoins=0;
 const collectorIds=w.partyBuffsSnapshot.filter(s=>s.id[0]==='C'&&Number(s.id.slice(1))>=5&&Number(s.id.slice(1))<=28).map(s=>String(Number(s.id.slice(1))-4).padStart(2,'0'));
 const partyGroups=new Set(party.map(id=>String(originalById.get(id).groupId)));
 const initialTerrainCounts=Object.fromEntries(data.terrains.map(t=>[t.id,w.terrain.filter(v=>v===t.id).length]));
 const worldHash=sha({terrain:w.terrain,facility:w.facility,events:w.events,eventPools:w.eventPools});
 function addItem(id){const key=String(id),isTarget=collectorIds.includes(data.collection_items.find(x=>x.id===id).groupId);totalItems++;if(isTarget)targetItems++;if(!seenItems.has(key)){seenItems.add(key);newItems++;if(isTarget)targetNewItems++;}}
 function addChar(id){const key=String(id);if(!seenChars.has(key)){seenChars.add(key);newCharacters++;}if(partyGroups.has(String(originalById.get(id).groupId)))groupJoins++;}
 function observation(){const o=clone(L.observe(r,w));assertPublic(o,w);return o;}
 function record(o){for(const cell of o.cells)if(cell.facility&&!discovered.has(cell.index))discovered.set(cell.index,q);for(const i of [...o.treasure,...o.companion]){if(!discovered.has(i))discovered.set(i,q);if(!w.explored[i])detected.add(i);}}
 function visit(){for(let i=0;i<w.facility.length;i++)if(w.explored[i]&&w.facility[i]&&!w.visitedFacilities[i]){
  const pending=c.BoukenEvents.prepare(save,w,i,data.facilities,data.characters,data.collection_items,random),inv=pending.type==='collection'?save.items:save.characters;
  // Candidate IDs and current ownership are public. Stable presented-order tie break.
  const choice=pending.ids.map((id,j)=>({id,j,novel:Number(!inv[id])})).sort((a,b)=>b.novel-a.novel||a.j-b.j)[0].id;
  const result=c.BoukenEvents.resolve(save,w,i,data.facilities,data.characters,data.collection_items,random,choice);
  outcomes.push({question:q,index:i,...clone(result)});
  if(result.type==='companion'){compEvents++;retryAttempts+=Number(result.retried);if(result.success){joinSuccess++;addChar(result.id);}}else{itemEvents++;if(result.success){itemSuccess++;addItem(result.id);if(result.extra)addItem(result.extra.id);}}
  c.BoukenProgress.recordMilestones(save,w,undefined,data.characters);
 }}
 let o=observation();record(o);visit();
 while(q<(options.budget??cfg.budget)&&w.exploredCount<99){
  o=observation();record(o);
  for(const k of ['treasure','companion'])signalSteps[k]+=Number(o[k].length>0);
  signalSteps.guide+=Number(!!o.guide);signalSteps.sense+=Number(!!o.sense);signalSteps.visibleFacility+=Number(o.cells.some(x=>!x.opened&&!!x.facility));
  // Policy sees only a detached, immutable public observation and independent action seed.
  const actionSeed=Math.floor(actionRandom()*4294967296)>>>0,index=decide(freeze(clone(o)),actionSeed);
  if(index===null){emptyFrontierTurns++;throw Error('Stuck frontier');}
  if(!o.cells[index]?.canExplore)throw Error('Illegal policy action');
  if(options.trace)trace.push({q,observation:o,index,actionSeed});
  const before=w.exploredCount;if((99-(before+1))/99<=.2)a12EligibleTurns++;
  const {result,milestone}=L.turn(r,save,w,index,random);
  q++;extra+=result.extra;blocked+=result.effects.filter(x=>x.opened===0).length;
  if(milestone.newlyAllExplored&&w.explorationReward){rewardJoins++;addChar(w.explorationReward.id);}
  o=observation();record(o);visit();
 }
 o=observation();record(o);
 if(JSON.stringify(save.claimedCollectionRewards)!==claimsBefore||JSON.stringify(Array.from(c.BoukenCollection.stages(save)))!==JSON.stringify(stagesBefore))throw Error('Museum state changed');
 const cumulativeReveal=w.achievementVisionCount||0,remainingReveal=w.revealed.filter((v,i)=>v&&!w.explored[i]).length,visited=w.visitedFacilities.filter(Boolean).length,discoveryAuc=[...discovered.values()].reduce((s,t)=>s+Math.max(0,cfg.budget+1-t)/(cfg.budget+1),0);
 const result={seed,party:[...party],buffs:clone(w.partyBuffsSnapshot),questions:q,opened:w.exploredCount,normalOpened:q,initialSkillOpened:skillInitial,additionalSkillOpened:extra,totalSkillOpened:skillInitial+extra,efficiency:w.exploredCount/cfg.budget,companionEvents:compEvents,recruitAttempts:compEvents,retryAttempts,recruitRolls:compEvents+retryAttempts,recruitSuccesses:joinSuccess,newCharacters,itemEvents,itemAttempts:itemEvents,itemSuccesses:itemSuccess,totalItems,newItems,discovered:discovered.size,visited,detected:detected.size,cumulativeReveal,remainingReveal,discoveryAuc,explorationIndex:(.55*discoveryAuc+.45*visited)/cfg.budget,discoveryEfficiency:discovered.size/cfg.budget,visitEfficiency:visited/cfg.budget,generatedFacilities:w.facility.filter(Boolean).length,rewardJoins,blocked,a12EligibleTurns,emptyFrontierTurns,targetItems,targetNewItems,groupJoins,collectorGroups:collectorIds,signalSteps,inventoryHash:cfg.inventoryHash,museumStages:stagesBefore,policyVersion:cfg.policyVersion,worldHash,initialTerrainCounts};
 if(w.exploredCount!==q+skillInitial+extra)throw Error('Opening decomposition mismatch');
 if(options.details)return {metrics:result,trace,outcomes,world:clone(w),save:clone(save)};
 return result;
}
module.exports={load,execute,checkSources,assertPublic,freeze,clone,L};
