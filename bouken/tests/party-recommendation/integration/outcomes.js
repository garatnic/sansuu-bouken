// Independent phase-2 adventure extension. Original core and game modules remain unchanged.
// Only completed-category simulations start with an empty shadow inventory; owned-party
// validation/departure and already-claimed museum stages retain the real snapshot.
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('../phase2/core.js'));else root.PartyOutcomes=factory(root.BoukenPartyLab);})(globalThis,function(L){
'use strict';
const {rng,depart,context,observe,policy,features}=L;
const clock=()=>performance.now();
const addTime=(profile,key,start)=>{if(profile)profile[key]=(profile[key]||0)+clock()-start;};
function run(runtime,base,party,cfg,seed,options={}) {
 const started=clock(),profile=options.profile,random=rng(seed),actionRandom=rng(seed^0xa5a5a5a5),{c,data}=runtime;
 let t=clock();const {save,w,initial}=depart(runtime,base,party,cfg,random);addTime(profile,'generationAndDepartureMs',t);
 const virtual={...base,items:options.emptyItems?{}:base.items,characters:options.emptyCharacters?{}:base.characters};if(options.emptyItems)save.items={};if(options.emptyCharacters)save.characters={};
 const ctx=context(runtime,virtual,cfg),seenItems=new Set(Object.keys(virtual.items).filter(id=>virtual.items[id]>0)),seenCharacters=new Set(Object.keys(virtual.characters).filter(id=>virtual.characters[id]>0)),firstDiscovery=new Map();
 let q=0,joins=0,items=0,target=0,newItems=0,newTarget=0,newCharacters=0,rewardJoins=0,budgetMetrics=null,blocked=0;
 // Claims cannot increase during an adventure. Reject invalid claims before caching the stage-1 bonus.
 const completed=new Set(c.BoukenCollection.completed(base));if(save.claimedCollectionRewards.some(id=>!completed.has(id)))throw Error('Claim without completed collection');
 const stages=c.BoukenCollection.stages(save),collectionChance=.002*stages[0];
 function itemGet(id){const key=String(id),isTarget=data.collection_items.find(x=>String(x.id)===key).groupId===cfg.targetGroup;items++;if(isTarget)target++;if(!seenItems.has(key)){seenItems.add(key);newItems++;if(isTarget)newTarget++;}}
 function charGet(id){const key=String(id);if(!seenCharacters.has(key)){seenCharacters.add(key);newCharacters++;}}
 function visit(){const start=clock();for(let i=0;i<w.facility.length;i++)if(w.explored[i]&&w.facility[i]&&!w.visitedFacilities[i]){
   const p=c.BoukenEvents.prepare(save,w,i,data.facilities,data.characters,data.collection_items,random),inv=p.type==='collection'?save.items:save.characters,master=p.type==='collection'?data.collection_items:data.characters;
   const order=p.ids.map(id=>({id,value:(!inv[id]?10:0)+(p.type==='collection'&&master.find(x=>x.id===id)?.groupId===cfg.targetGroup?1:0)})).sort((a,b)=>b.value-a.value);
   const r=c.BoukenEvents.resolve(save,w,i,data.facilities,data.characters,data.collection_items,random,order[0].id);
   if(r.success){if(r.type==='companion'){joins++;charGet(r.id);}else{itemGet(r.id);if(r.extra)itemGet(r.extra.id);}}
   c.BoukenProgress.recordMilestones(save,w);
  }addTime(profile,'eventsMs',start);}
 function metrics(o){const start=clock();for(const cell of o.cells)if(cell.facility&&!firstDiscovery.has(cell.index))firstDiscovery.set(cell.index,q);for(const i of [...o.treasure,...o.companion])if(!firstDiscovery.has(i))firstDiscovery.set(i,q);
   const result={opened:w.exploredCount,newItems,newTarget,items,target,newCharacters,joins,rewardJoins,known:firstDiscovery.size,discoveryAuc:[...firstDiscovery.values()].reduce((s,d)=>s+Math.max(0,cfg.budget+1-d)/(cfg.budget+1),0),visited:w.visitedFacilities.filter(Boolean).length,revealed:w.revealed.filter((v,i)=>v&&!w.explored[i]).length,firstFacility:firstDiscovery.size?Math.min(...firstDiscovery.values()):null};addTime(profile,'metricsMs',start);return result;}
 visit();t=clock();let o=observe(runtime,w);addTime(profile,'observationMs',t);metrics(o);
 while(w.exploredCount<w.width*w.height-1){
  if(!options.full&&q>=cfg.budget)break;
  t=clock();const index=policy(o,actionRandom,options.policy||cfg.policy||'informed');addTime(profile,'policyMs',t);if(index===null)throw Error('stuck');
  t=clock();const before=w.exploredCount,result=c.BoukenBuffs.correct(w,index,save.records.totalExplored,random,collectionChance);addTime(profile,'openingMs',t);
  t=clock();c.BoukenBuffs.revealNear(w);c.BoukenBuffs.thresholdVision(w,before,w.exploredCount,random);w.lastExploredIndex=result.indices.at(-1)??index;addTime(profile,'visionMs',t);
  t=clock();const milestone=c.BoukenProgress.recordExplore(save,w,result.opened,data.characters);if(milestone.newlyAllExplored){rewardJoins++;charGet(w.explorationReward.id);}addTime(profile,'progressMs',t);
  blocked+=result.effects.filter(x=>x.opened===0).length;q++;visit();t=clock();o=observe(runtime,w);addTime(profile,'observationMs',t);const m=metrics(o);if(q===cfg.budget)budgetMetrics=m;
  if(q>w.width*w.height)throw Error('bad clear bound');
 }
 const final=metrics(o);if(!budgetMetrics)budgetMetrics=final;const qClear=w.exploredCount===w.width*w.height-1?q:null;
 const legacyRaw=qClear===null?null:[.7*budgetMetrics.opened/(cfg.size**2-1)+.3*(cfg.size**2-1)/Math.max(1,qClear)/3,.8*budgetMetrics.newItems+.2*budgetMetrics.target,.8*budgetMetrics.newCharacters+.2*(budgetMetrics.joins+budgetMetrics.rewardJoins),.55*budgetMetrics.discoveryAuc+.45*budgetMetrics.visited];
 addTime(profile,'rolloutsMs',started);
 return {seed,...budgetMetrics,qClear,initial,blocked,final,raw:features(budgetMetrics,cfg,ctx),legacyRaw,claimsUnchanged:JSON.stringify(save.claimedCollectionRewards)===JSON.stringify(base.claimedCollectionRewards)};
}
function assumptions(runtime,save){return {emptyItems:runtime.data.collection_items.every(x=>save.items[x.id]>0),emptyCharacters:runtime.data.characters.every(x=>save.characters[x.id]>0)};}
function adventure(runtime,base,party,cfg,seed,options={}){
 const a={...assumptions(runtime,base),...options};
 if(!a.emptyItems&&!a.emptyCharacters)return L.adventure(runtime,base,party,cfg,seed,options);
 const original=runtime.c.BoukenCollection,stages=Array.from(original.stages(base));
 runtime.c.BoukenCollection={...original,stages:()=>[...stages]};
 try{return run(runtime,base,party,cfg,seed,a);}finally{runtime.c.BoukenCollection=original;}
}
return {adventure,assumptions};
});
