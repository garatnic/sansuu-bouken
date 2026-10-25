(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.BoukenPartyLab=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function rng(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
function shuffle(a,r){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const clone=x=>JSON.parse(JSON.stringify(x));
function depart(runtime,base,party,cfg,random){
 if(Number(base.worldsStarted||0)<2)throw Error('Prototype supports post-tutorial saves only');
 const {c,data,byId}=runtime,save=clone(base);c.Math.random=random;
 const owned=Object.keys(save.characters).filter(id=>save.characters[id]>0).map(Number);
 const normalized=Array.from(c.BoukenParty.normalize(party,owned,c.BoukenParty.capacity(owned.length)));
 if(normalized.filter(x=>x!==null).length!==party.filter(x=>x!==null).length)throw Error('Invalid party');
 const buffs=c.BoukenParty.buffs(normalized,byId),w=c.BoukenWorldGen.generate(cfg.size,cfg.size,data.terrains,data.facilities,data.world_facility_counts,buffs);
 w.departureNumber=save.worldsStarted+1;w.partySnapshot=[...normalized];w.partyBuffsSnapshot=buffs;
 const initialBase=c.BoukenBuffs.initial(w),before=save.records.totalExplored||0;
 const a=c.BoukenBuffs.threshold(w,w.lastInitialOpenedIndex??w.startIndex,before,before+initialBase,random);
 const after=before+initialBase+a.opened,m=c.BoukenCollection.initial(w,c.BoukenCollection.stages(save)[1],random);
 const ma=m?c.BoukenBuffs.threshold(w,w.lastInitialOpenedIndex??w.startIndex,after,after+m,random):{opened:0,indices:[]};
 const initial=initialBase+a.opened+m+ma.opened;
 c.BoukenBuffs.initialVision(w,random);c.BoukenBuffs.revealNear(w);c.BoukenBuffs.thresholdVision(w,0,initial,random);
 w.b01VisionInitialized=true;w.lastExploredIndex=ma.indices.at(-1)??(m?w.lastInitialOpenedIndex:a.indices.at(-1))??w.lastInitialOpenedIndex??w.startIndex;
 save.records.totalExplored=before+initial;save.world=w;save.worldsStarted=w.departureNumber;c.BoukenProgress.recordMilestones(save,w,undefined,data.characters);
 return {save,w,initial};
}
// Security boundary: policy gets this public observation, never the world or its hidden arrays.
function observe(runtime,w){
 const {c}=runtime;
 const cells=w.explored.map((opened,i)=>({index:i,opened:!!opened,revealed:!!w.revealed[i],terrain:opened||w.revealed[i]?w.terrain[i]:null,facility:opened||w.revealed[i]?w.facility[i]:null,visited:opened?!!w.visitedFacilities[i]:false,canExplore:c.BoukenExplore.canExplore(w,i)}));
 return {width:w.width,height:w.height,cells,treasure:Array.from(c.BoukenBuffs.detected(w,'collection')),companion:Array.from(c.BoukenBuffs.detected(w,'companion')),guide:clone(c.BoukenBuffs.guide(w)),sense:clone(c.BoukenBuffs.eventSense(w)),buffs:clone(w.partyBuffsSnapshot)};
}
function distance(o,a,b){return Math.abs(a%o.width-b%o.width)+Math.abs(Math.floor(a/o.width)-Math.floor(b/o.width));}
function legacyPolicy(o,random,mode='informed'){
 const frontier=o.cells.filter(x=>x.canExplore);if(!frontier.length)return null;
 if(mode==='random')return frontier[Math.floor(random()*frontier.length)].index;
 const targets=new Set([...o.treasure,...o.companion,...o.cells.filter(x=>!x.opened&&x.facility).map(x=>x.index)]);
 let region=null;
 if(o.sense){const s=o.sense;let y=0;region=[];for(let yy=0;yy<s.divisions;yy++){let x=0;for(let xx=0;xx<s.divisions;xx++){const k=yy*s.divisions+xx,inside=o.cells.filter(v=>v.index%o.width>=x&&v.index%o.width<x+s.widths[xx]&&Math.floor(v.index/o.width)>=y&&Math.floor(v.index/o.width)<y+s.heights[yy]);const known=inside.filter(v=>!v.opened&&targets.has(v.index)).length;region.push({x,y,w:s.widths[xx],h:s.heights[yy],density:Math.max(0,s.parts[k]-known)/Math.max(1,inside.filter(v=>!v.opened&&!v.revealed&&!targets.has(v.index)).length)});x+=s.widths[xx];}y+=s.heights[yy];}}
 const dirs={'↑':[0,-1],'↗':[1,-1],'→':[1,0],'↘':[1,1],'↓':[0,1],'↙':[-1,1],'←':[-1,0],'↖':[-1,-1]};
 let best=-Infinity,chosen=null;
 for(const cell of frontier){const i=cell.index,x=i%o.width,y=Math.floor(i/o.width);let score=0;
  if(targets.size)score+=8/(1+Math.min(...[...targets].map(j=>distance(o,i,j))));
  if(cell.facility)score+=20;
  if(region){for(const p of region){const d=Math.max(p.x-x,0,x-(p.x+p.w-1))+Math.max(p.y-y,0,y-(p.y+p.h-1));score+=3*p.density/(1+d);}}
  if(o.guide&&dirs[o.guide.arrow]){const [dx,dy]=dirs[o.guide.arrow],origin=o.guide.origin,ox=origin%o.width,oy=Math.floor(origin/o.width);const fits=(dx?Math.sign(x-ox)===dx:x===ox)&&(dy?Math.sign(y-oy)===dy:y===oy);if(fits)score+=1/(1+distance(o,origin,i));}
  if(cell.terrain){const id='A'+String(Number(cell.terrain.slice(1))+3).padStart(2,'0'),lv=o.buffs.find(b=>b.id===id)?.level||0;score+=[0,.2,.3,.4][lv];}
  // Prefer a frontier with room to grow; this uses only public topology.
  score+=.02*o.cells.filter(v=>!v.opened&&distance(o,i,v.index)===1).length+random()*.01;
  if(score>best){best=score;chosen=i;}
 }
 return chosen;
}
function turn(runtime,save,w,index,random){
 const {c,data}=runtime,before=w.exploredCount,result=c.BoukenBuffs.correct(w,index,save.records.totalExplored,random,.002*c.BoukenCollection.stages(save)[0]);
 c.BoukenBuffs.revealNear(w);c.BoukenBuffs.thresholdVision(w,before,w.exploredCount,random);w.lastExploredIndex=result.indices.at(-1)??index;
 const milestone=c.BoukenProgress.recordExplore(save,w,result.opened,data.characters);return {result,milestone};
}
// Same decisions as the phase-1 policy; removes its repeated whole-map adjacency scans.
function policy(o,random,mode='informed') {
 if(mode==='legacy')return legacyPolicy(o,random);
 const frontier=o.cells.filter(x=>x.canExplore);
 if(!frontier.length)return null;
 if(mode==='random')return frontier[Math.floor(random()*frontier.length)].index;
 const W=o.width,targets=new Set([...o.treasure,...o.companion,...o.cells.filter(x=>!x.opened&&x.facility).map(x=>x.index)]),targetArray=[...targets];
 let regions=null;
 if(o.sense){const s=o.sense;regions=[];let y=0;
  for(let yy=0;yy<s.divisions;yy++){let x=0;for(let xx=0;xx<s.divisions;xx++){
   let known=0,unknown=0;for(let cy=y;cy<y+s.heights[yy];cy++)for(let cx=x;cx<x+s.widths[xx];cx++){const cell=o.cells[cy*W+cx];if(!cell.opened&&targets.has(cell.index))known++;if(!cell.opened&&!cell.revealed&&!targets.has(cell.index))unknown++;}
   regions.push({x,y,w:s.widths[xx],h:s.heights[yy],density:Math.max(0,s.parts[yy*s.divisions+xx]-known)/Math.max(1,unknown)});x+=s.widths[xx];}y+=s.heights[yy];}
 }
 const dirs={'↑':[0,-1],'↗':[1,-1],'→':[1,0],'↘':[1,1],'↓':[0,1],'↙':[-1,1],'←':[-1,0],'↖':[-1,-1]};
 let best=-Infinity,chosen=null;
 for(const cell of frontier){const i=cell.index,x=i%W,y=Math.floor(i/W);let score=0;
  if(targetArray.length){let d=Infinity;for(const j of targetArray)d=Math.min(d,Math.abs(x-j%W)+Math.abs(y-Math.floor(j/W)));score+=8/(1+d);}
  if(cell.facility)score+=20;
  if(regions)for(const p of regions){const d=Math.max(p.x-x,0,x-(p.x+p.w-1))+Math.max(p.y-y,0,y-(p.y+p.h-1));score+=3*p.density/(1+d);}
  if(o.guide&&dirs[o.guide.arrow]){const [dx,dy]=dirs[o.guide.arrow],origin=o.guide.origin,ox=origin%W,oy=Math.floor(origin/W);if((dx?Math.sign(x-ox)===dx:x===ox)&&(dy?Math.sign(y-oy)===dy:y===oy))score+=1/(1+distance(o,origin,i));}
  if(cell.terrain){const id='A'+String(Number(cell.terrain.slice(1))+3).padStart(2,'0'),lv=o.buffs.find(b=>b.id===id)?.level||0;score+=[0,.2,.3,.4][lv];}
  let count=0;if(x&&!o.cells[i-1].opened)count++;if(x+1<W&&!o.cells[i+1].opened)count++;if(y&&!o.cells[i-W].opened)count++;if(y+1<o.height&&!o.cells[i+W].opened)count++;
  score+=.02*count+random()*.01;if(score>best){best=score;chosen=i;}
 }
 return chosen;
}
function clock(){return performance.now();}
function addTime(profile,key,start){if(profile)profile[key]=(profile[key]||0)+clock()-start;}
function context(runtime,base,cfg){const remainingItems=runtime.data.collection_items.filter(x=>!base.items[x.id]).length,remainingCharacters=runtime.data.characters.filter(x=>!base.characters[x.id]).length,remainingTarget=runtime.data.collection_items.filter(x=>x.groupId===cfg.targetGroup&&!base.items[x.id]).length;return {remainingItems,remainingCharacters,remainingTarget};}
function features(m,cfg,ctx){return [m.opened/cfg.budget,ctx.remainingItems ? .75*m.newItems+.20*m.newTarget+.05*m.items:.8*m.items+.2*m.target,ctx.remainingCharacters ? .9*m.newCharacters+.1*(m.joins+m.rewardJoins):m.joins+m.rewardJoins,(.55*m.discoveryAuc+.45*m.visited)/cfg.budget];}
function adventure(runtime,base,party,cfg,seed,options={}) {
 const started=clock(),profile=options.profile,random=rng(seed),actionRandom=rng(seed^0xa5a5a5a5),{c,data}=runtime;
 let t=clock();const {save,w,initial}=depart(runtime,base,party,cfg,random);addTime(profile,'generationAndDepartureMs',t);
 const ctx=context(runtime,base,cfg),seenItems=new Set(Object.keys(base.items).filter(id=>base.items[id]>0)),seenCharacters=new Set(Object.keys(base.characters).filter(id=>base.characters[id]>0)),firstDiscovery=new Map();
 let q=0,joins=0,items=0,target=0,newItems=0,newTarget=0,newCharacters=0,rewardJoins=0,budgetMetrics=null,blocked=0;
 // Claims cannot increase during an adventure. Reject invalid claims before caching the stage-1 bonus.
 const completed=new Set(c.BoukenCollection.completed(save));if(save.claimedCollectionRewards.some(id=>!completed.has(id)))throw Error('Claim without completed collection');
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
function signature(runtime,party){const buffs=Array.from(runtime.c.BoukenParty.buffs(party,runtime.byId)).filter(x=>x.id!=='D04');const groups=buffs.some(x=>x.id==='D06')?[...new Set(party.filter(x=>x!==null).map(id=>runtime.byId.get(id).groupId))].sort():[];return JSON.stringify([buffs,groups]);}
const types=['おまかせ','どんどん開拓','お宝あつめ','仲間あつめ','マップ探索'];
const mean=rows=>[0,1,2,3].map(k=>rows.reduce((s,x)=>s+x[k],0)/rows.length);
const quantile=(sorted,p)=>{const x=(sorted.length-1)*p,i=Math.floor(x);return sorted[i]+(sorted[Math.min(sorted.length-1,i+1)]-sorted[i])*(x-i);};
function calibration(reference,anchor){const columns=[0,1,2,3].map(k=>reference.map(x=>x[k]).sort((a,b)=>a-b));return {anchor,columns,center:columns.map(x=>quantile(x,.5)),spread:columns.map(x=>Math.max(quantile(x,.9)-quantile(x,.1),Math.abs(quantile(x,.5))*.1,1e-6))};}
function normalize(raw,cal,method='range'){
 return raw.map((x,k)=>{if(method==='current'){const a=cal.anchor[k];return a>0?100*x/(a+x):x>0?100:50;}
  if(method==='quantile'){const v=cal.columns[k];return 100*(v.filter(y=>y<x).length+.5*v.filter(y=>y===x).length)/v.length;}
  if(method==='range')return 100/(1+Math.exp(-2.197224577*(x-cal.center[k])/cal.spread[k]));
  throw Error('Unknown normalization');});
}
function general(scores,method='hybrid') {const min=Math.min(...scores),gm=Math.exp(scores.reduce((s,x)=>s+Math.log(Math.max(.01,x)),0)/4);if(method==='minimum')return min;if(method==='geometric')return gm;if(method==='mean')return scores.reduce((s,x)=>s+x,0)/4;return .5*min+.5*gm;}
function objective(scores,type,weight=.7,balance='hybrid'){const g=general(scores,balance);return type?weight*scores[type-1]+(1-weight)*g:g;}
function select(evaluations,cal,options={}){const method=options.method||'range',weight=options.weight??.7,balance=options.balance||'hybrid',floor=options.floor??.95;
 return types.map((type,k)=>{let eligible=evaluations;const max=k?Math.max(...evaluations.map(e=>e.raw[k-1])):0;if(k&&floor>0)eligible=evaluations.filter(e=>e.raw[k-1]>=max*floor);const ranked=eligible.map(e=>({...e,scores:normalize(e.raw,cal,method)})).sort((a,b)=>objective(b.scores,k,weight,balance)-objective(a.scores,k,weight,balance));const e=ranked[0];return {...e,type,objective:objective(e.scores,k,weight,balance),floor,fieldBest:max};});}
function aggregate(party,trials){const raw=mean(trials.map(x=>x.raw)),se=raw.map((m,k)=>Math.sqrt(trials.reduce((s,x)=>s+(x.raw[k]-m)**2,0)/Math.max(1,trials.length-1)/trials.length));return {party:[...party],n:trials.length,raw,se,metrics:Object.fromEntries(['opened','newItems','newTarget','items','target','newCharacters','joins','known','visited','discoveryAuc'].map(key=>[key,trials.reduce((s,x)=>s+x[key],0)/trials.length])),samples:trials.map(x=>x.raw)};}
function makeFixture(runtime,spec,legacyFactory){
 if(spec.legacy){if(!legacyFactory)throw Error('Legacy fixture requires Node adapter');return legacyFactory(runtime,spec.count,spec.config);}
 const {c,data}=runtime,cfg=spec.config,owned=shuffle(data.characters.map(x=>x.id),rng(spec.ownershipSeed??902)).slice(0,spec.count),save=c.BoukenSchema.makeInitialSave();
 save.characters=Object.fromEntries(owned.map(id=>[id,1]));save.characterJoinOrder=[...owned];
 save.items=Object.fromEntries(shuffle(data.collection_items,rng(spec.itemSeed??1902)).slice(0,Math.floor(data.collection_items.length*spec.itemFraction)).map(x=>[x.id,1]));
 const groups=data.collection_rewards.filter(r=>!r.subgroupId.startsWith(cfg.targetGroup+'-')).slice(0,spec.forceGroups||0).map(r=>r.subgroupId);
 for(const item of data.collection_items)if(groups.includes(item.subgroupId))save.items[item.id]=1;
 if(spec.missingTarget){for(const item of data.collection_items.filter(x=>x.groupId===cfg.targetGroup).slice(0,spec.missingTarget))delete save.items[item.id];}
 save.claimedCollectionRewards=Array.from(c.BoukenCollection.completed(save)).filter(id=>!id.startsWith(cfg.targetGroup+'-')).slice(0,spec.claims||0);
 save.worldsStarted=2;save.records.totalExplored=cfg.cumulativeExplored;save.tutorialStory.complete=true;
 return {save:clone(save),owned,slots:spec.slots||c.BoukenParty.capacity(owned.length)};
}
function estimator(runtime,base,cfg){
 const {c,data}=runtime,ctx=context(runtime,base,cfg),stages=Array.from(c.BoukenCollection.stages(clone(base))),cache=new Map(),compCache=new Map(),itemCache=new Map();
 const total=cfg.size**2-1,baseCount=data.world_facility_counts.find(x=>x.width===cfg.size).facilityCount;
 function estimate(party){const sig=signature(runtime,party);if(cache.has(sig))return cache.get(sig);const buffs=Array.from(c.BoukenParty.buffs(party,runtime.byId)),w={partyBuffsSnapshot:buffs,partySnapshot:party},L=id=>buffs.find(x=>x.id===id)?.level||0;
  const targets=Array.from(c.BoukenWorldGen.targets(buffs));let extra=[0,.05,.1,.2][L('A01')]+3*[0,.02,.035,.05][L('A02')]+.002*stages[0];
  for(let i=0;i<7;i++)extra+=targets[i]*[0,.2,.3,.4][L('A'+String(i+4).padStart(2,'0'))];
  // Proposal only: ignores path blocking and uses the normal world's terrain marginal.
  const interval=[Infinity,20,15,10][L('A03')],perCorrect=(1+extra)*(1+1/interval),initial=[0,4,8,12][L('A11')]+stages[1],opened=Math.min(total,initial+cfg.budget*perCorrect);
  const facilities=data.facilities.map(f=>({f,n:baseCount*f.generationWeightPercent/100}));
  for(const [id,ids]of [['D03',['F01','F02']],['D08',['F03','F04']],['D09',['F05','F06','F07']]]){
   const lv=L(id);if(!lv||cfg.size===5)continue;const group=facilities.filter(x=>ids.includes(x.f.id)),prob=group.reduce((s,x)=>s+x.f.generationWeightPercent/100,0),minimum=cfg.size===10?1:lv;let expected=0,binom=(1-prob)**baseCount;
   for(let k=0;k<=baseCount;k++){if(k>0)binom=binom*(baseCount-k+1)/k*prob/(1-prob);expected+=binom*Math.max(minimum,Math.ceil(k*[0,.2,.4,.6][lv]));}
   for(const x of group)x.n+=expected*x.f.generationWeightPercent/(100*prob);
  }
  const ikey=JSON.stringify(buffs.filter(x=>x.id[0]==='C'&&Number(x.id.slice(1))>=4));let novelty;
  if(itemCache.has(ikey))novelty=itemCache.get(ikey);else{let entries=data.collection_items.map(item=>({value:item,weight:(1+(!base.items[item.id]?[0,4,14,24][L('C04')]:0))*(1+[0,5,10,30][L('C'+String(Number(item.groupId)+4).padStart(2,'0'))])}));entries=c.BoukenCollection.unknownWeights(entries,base.items,.002*stages[5]);const sum=entries.reduce((s,x)=>s+x.weight,0);novelty={unknown:entries.filter(x=>!base.items[x.value.id]).reduce((s,x)=>s+x.weight,0)/sum,target:entries.filter(x=>x.value.groupId===cfg.targetGroup).reduce((s,x)=>s+x.weight,0)/sum,newTarget:entries.filter(x=>x.value.groupId===cfg.targetGroup&&!base.items[x.value.id]).reduce((s,x)=>s+x.weight,0)/sum};itemCache.set(ikey,novelty);}
  const compKey=JSON.stringify([L('D05'),L('D06'),L('D06')?[...new Set(party.map(id=>runtime.byId.get(id).groupId))].sort():[]]);let comp;
  if(!ctx.remainingCharacters)comp={all:0,human:0,monster:0,danger:0};else if(compCache.has(compKey))comp=compCache.get(compKey);else{comp={};for(const pool of ['all','human','monster','danger']){const candidates=pool==='all'?data.characters:data.characters.filter(x=>x.areas?.[pool]===1);if(!candidates.length){comp[pool]=0;continue;}const entries=c.BoukenCollection.unknownWeights(c.BoukenEvents.companionWeights(base,w,candidates,data.characters),base.characters,.002*stages[3]);comp[pool]=entries.filter(x=>!base.characters[x.value.id]).reduce((s,x)=>s+x.weight,0)/entries.reduce((s,x)=>s+x.weight,0);}compCache.set(compKey,comp);}
  const cb=[0,.25,2/3,1.5][L('C01')],db=[0,.25,2/3,1.5][L('D01')],success=(id,stage)=>{const b=[0,.35,1,3][L(id)]+[0,.15,.35,.6][L('F03')];return Math.min(1,(.6+b)/(1+b)+.002*stages[stage]);};
  const itemP=success('C02',4),joinP=success('D02',2),retry=[0,.5,.77,1][L('D07')],finalJoin=joinP+(1-joinP)*retry*joinP;let ie=0,ce=0,newComp=0,eventItem=0,eventComp=0;
  for(const {f,n}of facilities){const pc=(f.eventWeightsPercent.collection/100+cb)/(1+cb+db);eventItem+=n*pc;eventComp+=n*(1-pc);ie+=n*pc*itemP*(1+[0,.25,.5,.75][L('C03')]);const joins=n*(1-pc)*finalJoin;ce+=joins;const np=f.companionPoolMode==='all_uniform'?comp.all:Object.entries(f.companionPoolWeightsPercent).reduce((s,[pool,p])=>s+(comp[pool]||0)*p/100,0);newComp+=joins*(1-(1-np)**Math.max(1,L('F02')+1));}
  const reach=opened/total,unknown=1-(1-novelty.unknown)**Math.max(1,L('F01')+1),newItem=ie*unknown,vision=Math.min(total,opened*(1+[0,4,12,24][L('B01')])+opened*L('B05')+[0,.1,.2,.3][L('B06')]*total);
  const facilityCount=facilities.reduce((s,x)=>s+x.n,0),coverage=vision/total,rangeChance=id=>{const r=[0,3,6,10][L(id)];return r?1-(1-Math.min(1,2*r*(r+1)/total))**opened:0;},detected=eventItem*rangeChance('B02')+eventComp*rangeChance('B03'),guideRange=[0,6,10,15][L('B04')],guideGain=guideRange?(1-(1-Math.min(1,2*guideRange*(guideRange+1)/total))**facilityCount)/(1+guideRange):0,divisions=[1,2,3,5][L('B07')],regionGain=Math.log2(divisions**2)/Math.log2(total),known=Math.min(facilityCount,facilityCount*coverage+detected*(1-coverage)+facilityCount*(1-coverage)*(guideGain+regionGain));
  const m={opened,newItems:newItem*reach,newTarget:ie*novelty.newTarget*reach,items:ie*reach,target:ie*novelty.target*reach,newCharacters:newComp*reach,joins:ce*reach,rewardJoins:0,discoveryAuc:known*.6,visited:facilityCount*reach};const raw=features(m,cfg,ctx);cache.set(sig,raw);return raw;
 }
 return estimate;
}
async function recommend(runtime,input,cfg,options={}){
 const started=clock(),{save,owned,slots}=input,profile={},random=rng(cfg.searchSeed||172001),ctx=context(runtime,save,cfg);
 if(slots<1||slots>runtime.c.BoukenParty.capacity(owned.length)||slots>owned.length||new Set(owned).size!==owned.length||owned.some(id=>!runtime.byId.has(id)||!save.characters[id]))throw Error('Invalid party input');
 const all=new Map(),evals=new Map(),seedBase=cfg.trainSeedStart||111001,estimate=estimator(runtime,save,cfg),baseEstimate=estimate([]),proposalStart=clock();
 function approx(p,type){const scores=estimate(p).map((x,k)=>100*x/(Math.max(1e-9,baseEstimate[k])+x));return objective(scores,type,.7);}
 function add(p){p=[...p].sort((a,b)=>a-b);if(p.length!==slots||new Set(p).size!==slots||p.some(id=>!owned.includes(id)))return;const key=signature(runtime,p);if(!all.has(key))all.set(key,p);return key;}
 const singles=owned.map(id=>({id,raw:estimate([id])})),proxyPool=new Set();
 for(let k=0;k<4;k++)for(const x of [...singles].sort((a,b)=>b.raw[k]-a.raw[k]).slice(0,16))proxyPool.add(x.id);
 for(const skill of runtime.data.skills){const candidates=owned.filter(id=>runtime.byId.get(id).skills.some(s=>s.id===skill.id));if(candidates.length)proxyPool.add(candidates[Math.floor(random()*candidates.length)]);}
 for(const id of shuffle(owned,random).slice(0,32))proxyPool.add(id);const proposalOwned=owned.length<=140?owned:[...proxyPool];
 const heuristic=[];
 for(const restart of Array.from({length:cfg.restarts||2},(_,i)=>i))for(let type=0;type<5;type++){
  const rr=rng((cfg.searchSeed||172001)+restart*1009+type),p=[];
  while(p.length<slots){const ranked=proposalOwned.filter(id=>!p.includes(id)).map(id=>({id,score:approx([...p,id],type)})).sort((a,b)=>b.score-a.score);p.push(ranked[restart?Math.floor(rr()*Math.min(4,ranked.length)):0].id);}
  heuristic.push(p);add(p);
 }
 if(options.incumbents)for(const p of options.incumbents)add(p);
 if(slots===1)for(const id of owned)add([id]);
 const representative=[];for(const skill of runtime.data.skills.filter(x=>x.id!=='D04')){const possible=owned.filter(id=>runtime.byId.get(id).skills.some(s=>s.id===skill.id));if(possible.length)representative.push(possible[Math.floor(random()*possible.length)]);}
 for(let i=0;i<(cfg.initialRandom||12);i++){const id=representative[i%representative.length];add([id,...shuffle(owned.filter(x=>x!==id),random).slice(0,slots-1)]);}
 // Keep multiple independent restarts and random parties; no all-character Monte Carlo evaluation.
 for(let i=0;i<4;i++)add(shuffle(owned,random).slice(0,slots));
 addTime(profile,'candidateGenerationMs',proposalStart);
 const cache=new Map();let adventures=0,interrupted=false,finalizing=false;
 const reserve=cfg.maxAdventures?Math.min(5*(cfg.maxTrials||32),Math.floor(cfg.maxAdventures/3)):0;
 async function yieldCheck(){if(options.yield)await options.yield();if(options.cancelled?.())throw Error('Cancelled');if((cfg.timeLimitMs&&clock()-started>=cfg.timeLimitMs)||(cfg.maxAdventures&&adventures>=cfg.maxAdventures-(finalizing?0:reserve)))interrupted=true;}
 async function evaluate(p,n,kind='train'){
  const key=kind+signature(runtime,p);let entry=cache.get(key);if(!entry){entry={party:p,trials:[]};cache.set(key,entry);}
  while(entry.trials.length<n&&!interrupted){const seed=(kind==='reference'?(cfg.referenceSeedStart||121001):seedBase)+entry.trials.length;entry.trials.push(adventure(runtime,save,p,cfg,seed,{profile}));adventures++;await yieldCheck();}
  if(!entry.trials.length)return null;const a=aggregate(p,entry.trials);if(kind==='train')evals.set(signature(runtime,p),a);return a;
 }
 const refRandom=rng(cfg.referencePartySeed||192001),referenceParties=[];for(let i=0;i<(cfg.references||16);i++)referenceParties.push(shuffle(owned,refRandom).slice(0,slots));
 const ref=[];let start=clock();for(const p of referenceParties){const e=await evaluate(p,cfg.referenceTrials||2,'reference');if(e)ref.push(e.raw);}const empty=await evaluate([],cfg.anchorTrials||64,'reference');
 if(!ref.length||!empty)throw Error('Time budget expired before calibration');const cal=calibration(ref,empty.raw);addTime(profile,'calibrationMs',start);
 for(const p of all.values()){await evaluate(p,cfg.initialTrials||2);if(interrupted)break;}
 function leaders(){const list=[...evals.values()],keep=new Map();for(const e of select(list,cal,{floor:0}))keep.set(signature(runtime,e.party),e);for(let k=0;k<4;k++)for(const e of [...list].sort((a,b)=>b.raw[k]-a.raw[k]).slice(0,cfg.beamWidth||2))keep.set(signature(runtime,e.party),e);return [...keep.values()];}
 const snapshots=[];function publish(stage){if(!evals.size)return;const picks=select([...evals.values()],cal,cfg.selection),snap={stage,elapsedMs:clock()-started,adventures,recommendations:picks.map(e=>({type:e.type,party:e.party,raw:e.raw,scores:e.scores,n:e.n}))};snapshots.push(snap);options.onProgress?.(snap);}
 publish('provisional');
 const shortlists=[0,1,2,3].map(k=>owned.map(id=>({id,score:estimate([id])[k]})).sort((a,b)=>b.score-a.score).slice(0,12).map(x=>x.id));
 for(let round=0;round<(cfg.rounds??2)&&!interrupted;round++){
  start=clock();const proposals=new Map();
  for(const leader of leaders())for(const swapCount of (slots>1&&cfg.twoSwap!==false?[1,2]:[1]))for(let rep=0;rep<(cfg.proposalsPerLeader||4);rep++){
   const p=[...leader.party],positions=shuffle(Array.from({length:slots},(_,i)=>i),random).slice(0,swapCount),pool=rep%2?shuffle(owned,random).slice(0,24):shortlists[rep%4];
   for(const position of positions){const candidates=pool.filter(id=>!p.includes(id));if(candidates.length)p[position]=candidates[Math.floor(random()*candidates.length)];}
   const key=add(p);if(key&&!evals.has(key))proposals.set(key,p);
  }
  const chosen=new Map();for(let type=0;type<5;type++)for(const p of [...proposals.values()].sort((a,b)=>approx(b,type)-approx(a,type)).slice(0,cfg.promotionsPerType||3))chosen.set(signature(runtime,p),p);
  // Random proposals protect interactions that the expectation model cannot represent.
  for(const p of shuffle([...proposals.values()],random).slice(0,4))chosen.set(signature(runtime,p),p);
  addTime(profile,'candidateGenerationMs',start);
  for(const p of chosen.values()){await evaluate(p,cfg.initialTrials||2);if(interrupted)break;}
  publish('search-'+(round+1));
 }
 let survivors=leaders();for(const e of survivors){await evaluate(e.party,cfg.minTrials||8);if(interrupted)break;}
 publish('refined');
 // Empirical one-SE overlap: add trials to ambiguous contenders, retain per-field beams.
 if(!interrupted&&cfg.adaptive!==false){for(const n of [16,32].filter(n=>n<=(cfg.maxTrials||32))){
  survivors=leaders();const list=[...evals.values()],picks=select(list,cal,cfg.selection),uncertain=new Set();
  for(let k=0;k<5;k++){const best=picks[k];for(const e of survivors){const overlap=k?Math.abs(e.raw[k-1]-best.raw[k-1])<=1.96*(e.se[k-1]+best.se[k-1]):e.se.some((se,j)=>Math.abs(e.raw[j]-best.raw[j])<=1.96*(se+best.se[j]));if(overlap||signature(runtime,e.party)===signature(runtime,best.party))uncertain.add(signature(runtime,e.party));}}
  for(const e of survivors)if(uncertain.has(signature(runtime,e.party))){await evaluate(e.party,n);if(interrupted)break;}publish('verification-'+n);if(interrupted)break;
 }}
 // Reserve trials so the final displayed candidates do not win solely on a lucky two-trial sample.
 if(!cfg.timeLimitMs||clock()-started<cfg.timeLimitMs){finalizing=true;interrupted=false;const ready=[...evals.values()].filter(e=>e.n>=(cfg.minTrials||8)),chosen=select(ready.length?ready:[...evals.values()],cal,cfg.selection),unique=[...new Map(chosen.map(e=>[signature(runtime,e.party),e])).values()];for(const e of unique){await evaluate(e.party,cfg.minTrials||8);if(interrupted)break;}if(!interrupted){const minimum=Math.min(...unique.map(e=>evals.get(signature(runtime,e.party)).n)),affordable=cfg.maxAdventures?minimum+Math.floor((cfg.maxAdventures-adventures)/unique.length):(cfg.maxTrials||32),target=[8,16,32].filter(n=>n<=Math.min(cfg.maxTrials||32,affordable)).at(-1)||(cfg.minTrials||8);for(const e of unique){await evaluate(e.party,target);if(interrupted)break;}}publish('final-sampling');}
 const list=[...evals.values()],sampled=list.filter(e=>e.n>=(cfg.maxTrials||32)),eligible=sampled.length?sampled:list.filter(e=>e.n>=(cfg.minTrials||8)),recommendations=select(eligible.length?eligible:list,cal,cfg.selection).map(e=>({...e,members:e.party.map(id=>({id,name:runtime.byId.get(id).name})),buffs:clone(runtime.c.BoukenParty.buffs(e.party,runtime.byId)),status:e.n>=(cfg.maxTrials||32)?'sampled':'uncertain'}));
 const elapsedMs=clock()-started;return {elapsedMs,adventures,profile,context:ctx,calibration:cal,referenceParties,referenceSamples:ref,heuristic,recommendations,snapshots,evaluations:list,interrupted,config:cfg};
}
return {rng,shuffle,clone,depart,turn,observe,legacyPolicy,policy,adventure,context,features,signature,types,mean,quantile,calibration,normalize,general,objective,select,aggregate,makeFixture,estimator,recommend};
});
