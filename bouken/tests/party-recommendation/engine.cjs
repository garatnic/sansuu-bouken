'use strict';
// Node-only experiment. The game never imports this module. No storage API exists here.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function rng(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
function shuffle(a,r){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const clone=x=>JSON.parse(JSON.stringify(x));
function load(root=path.resolve(__dirname,'../..')){
 const crypto=require('node:crypto'),manifest=require('./source-manifest.json');
 for(const [p,sha]of Object.entries(manifest.gitBlobs)){const b=fs.readFileSync(path.join(root,p.replace(/^bouken\//,''))),actual=crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');if(actual!==sha)throw Error('Source version mismatch: '+p);}
 const c={Math:Object.create(Math)};c.window=c;vm.createContext(c);
 for(const n of ['schema','party','explore','buffs','collection','events','progress','worldgen'])vm.runInContext(fs.readFileSync(path.join(root,'common',n+'.js'),'utf8'),c,{filename:n+'.js'});
 const data=Object.fromEntries(['terrains','facilities','characters','collection_items','collection_rewards','world_facility_counts','skills'].map(n=>[n,JSON.parse(fs.readFileSync(path.join(root,'data',n+'.json'),'utf8'))]));
 c.BoukenCollection.configure(data.collection_items,data.collection_rewards);
 return {c,data,byId:new Map(data.characters.map(v=>[v.id,v]))};
}
function fixture(runtime,count,cfg){
 const {c,data}=runtime,r=rng(cfg.inventorySeed),save=c.BoukenSchema.makeInitialSave();
 const owned=shuffle(data.characters.map(x=>x.id),r).slice(0,count);save.characters=Object.fromEntries(owned.map(id=>[id,1]));save.characterJoinOrder=[...owned];
 save.items=Object.fromEntries(shuffle(data.collection_items,r).slice(0,Math.floor(data.collection_items.length*cfg.itemOwnershipFraction)).map(x=>[x.id,1]));
 // Force a few legitimately complete groups and claim only the configured subset.
 const completeGroups=data.collection_rewards.slice(0,12).map(x=>x.subgroupId);
 for(const item of data.collection_items)if(completeGroups.includes(item.subgroupId))save.items[item.id]=1;
 save.claimedCollectionRewards=completeGroups.slice(0,cfg.claimedRewardLimit);save.worldsStarted=2;save.records.totalExplored=cfg.cumulativeExplored;
 save.tutorialStory.complete=true;return {save:clone(save),owned,slots:c.BoukenParty.capacity(count)};
}
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
function policy(o,random,mode='informed'){
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
function adventure(runtime,base,party,cfg,seed,options={}){
 const random=rng(seed),actionRandom=rng(seed^0xa5a5a5a5),{c,data}=runtime;
 const {save,w,initial}=depart(runtime,base,party,cfg,random),initialChars=new Set(Object.keys(base.characters).filter(id=>base.characters[id]>0)),initialItems=new Set(Object.keys(base.items).filter(id=>base.items[id]>0));
 const firstDiscovery=new Map();let q=0,join=0,items=0,target=0,rewards=0,blocked=0,budgetMetrics=null;
 function visit(){for(let i=0;i<w.facility.length;i++)if(w.explored[i]&&w.facility[i]&&!w.visitedFacilities[i]){
  const p=c.BoukenEvents.prepare(save,w,i,data.facilities,data.characters,data.collection_items,random);
  const inv=p.type==='collection'?save.items:save.characters,master=p.type==='collection'?data.collection_items:data.characters;
  const order=p.ids.map(id=>({id,value:(!inv[id]?10:0)+(p.type==='collection'&&master.find(x=>x.id===id)?.groupId===cfg.targetGroup?1:0)})).sort((a,b)=>b.value-a.value);
  const r=c.BoukenEvents.resolve(save,w,i,data.facilities,data.characters,data.collection_items,random,order[0].id);
  if(r.success){if(r.type==='companion')join++;else{items++;target+=Number(data.collection_items.find(x=>x.id===r.id).groupId===cfg.targetGroup);if(r.extra){items++;target+=Number(data.collection_items.find(x=>x.id===r.extra.id).groupId===cfg.targetGroup);}}}
  c.BoukenProgress.recordMilestones(save,w);
 }}
 function metrics(o){for(const cell of o.cells)if(cell.facility&&!firstDiscovery.has(cell.index))firstDiscovery.set(cell.index,q);for(const i of [...o.treasure,...o.companion])if(!firstDiscovery.has(i))firstDiscovery.set(i,q);
  const novelItems=Object.keys(save.items).filter(id=>save.items[id]>0&&!initialItems.has(id)).length,novelChars=Object.keys(save.characters).filter(id=>save.characters[id]>0&&!initialChars.has(id)).length;
  return {opened:w.exploredCount,newItems:novelItems,items,target,newCharacters:novelChars,joins:join,rewardJoins:rewards,known:firstDiscovery.size,discoveryAuc:[...firstDiscovery.values()].reduce((s,t)=>s+Math.max(0,cfg.budget+1-t)/(cfg.budget+1),0),visited:w.visitedFacilities.filter(Boolean).length,revealed:w.revealed.filter((v,i)=>v&&!w.explored[i]).length,firstFacility:firstDiscovery.size?Math.min(...firstDiscovery.values()):null};
 }
 visit();let o=observe(runtime,w);metrics(o);
 while(!c.BoukenProgress.status(w).allExplored){
  const index=policy(o,actionRandom,options.policy||cfg.policy||'informed');if(index===null)throw Error('stuck');
  const {result,milestone}=turn(runtime,save,w,index,random);
  blocked+=result.effects.filter(x=>x.opened===0).length;
  if(milestone.newlyAllExplored)rewards++;
  q++;visit();o=observe(runtime,w);const m=metrics(o);if(q===cfg.budget)budgetMetrics=m;
  if(q>w.width*w.height)throw Error('bad clear bound');
 }
 const final=metrics(o);if(!budgetMetrics)budgetMetrics=final;
 return {seed,...budgetMetrics,qClear:q,initial,blocked,final,raw:[.7*budgetMetrics.opened/(cfg.size**2-1)+.3*(cfg.size**2-1)/Math.max(1,q)/3,.8*budgetMetrics.newItems+.2*budgetMetrics.target,.8*budgetMetrics.newCharacters+.2*(budgetMetrics.joins+budgetMetrics.rewardJoins),.55*budgetMetrics.discoveryAuc+.45*budgetMetrics.visited],claimsUnchanged:JSON.stringify(save.claimedCollectionRewards)===JSON.stringify(base.claimedCollectionRewards)};
}
function evaluate(runtime,base,party,cfg,seeds){const trials=seeds.map(s=>adventure(runtime,base,party,cfg,s));const mean=key=>trials.reduce((s,x)=>s+x[key],0)/trials.length;
 const raw=Array.from({length:4},(_,k)=>trials.reduce((s,x)=>s+x.raw[k],0)/trials.length),se=raw.map((v,k)=>Math.sqrt(trials.reduce((s,x)=>s+(x.raw[k]-v)**2,0)/Math.max(1,trials.length-1)/trials.length));
 return {party:[...party],n:trials.length,raw,se,opened:mean('opened'),qClear:mean('qClear'),newItems:mean('newItems'),target:mean('target'),newCharacters:mean('newCharacters'),joins:mean('joins'),known:mean('known'),visited:mean('visited'),discoveryAuc:mean('discoveryAuc'),rewards:mean('rewardJoins')};}
const types=['おまかせ','どんどん開拓','お宝あつめ','仲間あつめ','マップ探索'];
function normalized(raw,anchor){return raw.map((x,i)=>anchor[i]>0?100*x/(anchor[i]+x):x>0?100:50);}
function objective(scores,type,weight=.7){const geometric=Math.exp(scores.reduce((s,x)=>s+Math.log(Math.max(.01,x)),0)/4),general=.5*Math.min(...scores)+.5*geometric;
 return type===0?general:weight*scores[type-1]+(1-weight)*general;}
function signature(runtime,party){const buffs=Array.from(runtime.c.BoukenParty.buffs(party,runtime.byId)).filter(x=>x.id!=='D04');const groups=buffs.some(x=>x.id==='D06')?[...new Set(party.map(id=>runtime.byId.get(id).groupId))].sort():[];return JSON.stringify([buffs,groups]);}
function approximate(runtime,party){const v=[0,0,0,0];for(const b of runtime.c.BoukenParty.buffs(party,runtime.byId)){if(b.id==='D04')continue;const k=b.id[0]==='A'?0:b.id[0]==='B'?3:b.id[0]==='C'?1:b.id[0]==='D'?2:0;if(b.id[0]!=='F')v[k]+=b.level;if(b.id==='F01')v[1]+=b.level;if(b.id==='F02')v[2]+=b.level;if(b.id==='F03'){v[1]+=b.level;v[2]+=b.level;}}return v;}
function recommend(runtime,fixture,cfg){
 const start=performance.now(),random=rng(cfg.searchSeed),{save,owned,slots}=fixture;
 if(!Number.isInteger(slots)||slots<1||slots>runtime.c.BoukenParty.capacity(owned.length)||slots>owned.length||new Set(owned).size!==owned.length||owned.some(id=>!runtime.byId.has(id)||!save.characters[id]))throw Error('Invalid owned IDs / unlocked slot count');
 const anchorEval=evaluate(runtime,save,[],cfg,Array.from({length:64},(_,i)=>41001+i)),anchor=anchorEval.raw;
 const cache=new Map(),seen=new Set(),candidates=[];
 function add(p){p=[...p].sort((a,b)=>a-b);if(p.length!==slots||new Set(p).size!==slots||p.some(x=>!owned.includes(x)))return;const key=signature(runtime,p);if(seen.has(key))return;seen.add(key);candidates.push(p);}
 const heuristic=[];
 for(let type=0;type<5;type++){let p=[];while(p.length<slots){let best=null,score=-Infinity;for(const id of owned){if(p.includes(id))continue;const a=approximate(runtime,[...p,id]);const merit=type===0?a.reduce((s,x)=>s+Math.sqrt(x),0):.7*a[type-1]+.3*a.reduce((s,x)=>s+x,0)/4;if(merit>score){best=id;score=merit;}}p.push(best);}heuristic.push(p);add(p);}
 if(slots===1)for(const id of owned)add([id]);
 // Stratified individual skill representatives + random parties keep low approximate-score interactions alive.
 for(const skill of runtime.data.skills){const eligible=owned.filter(id=>runtime.byId.get(id).skills.some(x=>x.id===skill.id));if(eligible.length){const id=eligible[Math.floor(random()*eligible.length)];add([id,...shuffle(owned.filter(x=>x!==id),random).slice(0,slots-1)]);}}
 // Reserve random exploration instead of letting 67 skill representatives consume the entire cap.
 const sampled=shuffle(candidates.slice(heuristic.length),random).slice(0,Math.max(0,cfg.candidateLimit-cfg.randomParties-heuristic.length));candidates.splice(heuristic.length);candidates.push(...sampled);
 for(let i=0;i<cfg.randomParties;i++)add(shuffle(owned,random).slice(0,slots));
 function get(p,seeds,phase){const key=phase+signature(runtime,p);if(!cache.has(key))cache.set(key,evaluate(runtime,save,p,cfg,seeds));return cache.get(key);}
 const scored=(p,seeds,phase)=>{const e=get(p,seeds,phase);e.scores=normalized(e.raw,anchor);return e;};
 let pool=candidates.slice(0,cfg.candidateLimit).map(p=>scored(p,cfg.trainSeeds,'train'));const poolKeys=new Set(pool.map(e=>signature(runtime,e.party)));
 for(let round=0;round<cfg.rounds;round++)for(let type=0;type<5;type++){
  const leaders=[...pool].sort((a,b)=>objective(b.scores,type,cfg.specialistWeight)-objective(a.scores,type,cfg.specialistWeight)).slice(0,2);
  for(let i=0;i<cfg.swapsPerType;i++){const leader=leaders[i%leaders.length],p=[...leader.party],slot=Math.floor(random()*slots),eligible=owned.filter(id=>!p.includes(id));if(!eligible.length)continue;p[slot]=eligible[Math.floor(random()*eligible.length)];const key=signature(runtime,p);if(!poolKeys.has(key)){poolKeys.add(key);pool.push(scored(p,cfg.trainSeeds,'train'));}}
 }
 const screenSet=new Map();for(const p of heuristic)screenSet.set(signature(runtime,p),p);
 for(let type=0;type<5;type++)for(const e of [...pool].sort((a,b)=>objective(b.scores,type,cfg.specialistWeight)-objective(a.scores,type,cfg.specialistWeight)).slice(0,4))screenSet.set(signature(runtime,e.party),e.party);
 // Preserve actual per-field leaders even when 70/30 or a zero event sample depresses their general score.
 for(let k=0;k<4;k++)for(const e of [...pool].sort((a,b)=>b.raw[k]-a.raw[k]).slice(0,3))screenSet.set(signature(runtime,e.party),e.party);
 const screen=[...screenSet.values()].map(p=>scored(p,cfg.screenSeeds,'screen'));
 const seeds=Array.from({length:cfg.validationTrials},(_,i)=>cfg.validationSeedStart+i),finalSet=new Map();for(const p of heuristic)finalSet.set(signature(runtime,p),p);
 for(let type=0;type<5;type++)for(const e of [...screen].sort((a,b)=>objective(b.scores,type,cfg.specialistWeight)-objective(a.scores,type,cfg.specialistWeight)).slice(0,cfg.finalistsPerType))finalSet.set(signature(runtime,e.party),e.party);
 for(let k=0;k<4;k++){const e=[...screen].sort((a,b)=>b.raw[k]-a.raw[k])[0];finalSet.set(signature(runtime,e.party),e.party);}
 const validation=[...finalSet.values()].map(p=>scored(p,seeds,'validation'));
 const recommendations=types.map((type,k)=>{const e=[...validation].sort((a,b)=>objective(b.scores,k,cfg.specialistWeight)-objective(a.scores,k,cfg.specialistWeight))[0];return {type,...e,objective:objective(e.scores,k,cfg.specialistWeight),members:e.party.map(id=>({id,name:runtime.byId.get(id).name})),buffs:clone(runtime.c.BoukenParty.buffs(e.party,runtime.byId))};});
 const baselines=heuristic.map((p,k)=>{const e=scored(p,seeds,'validation');return {type:types[k],...e,objective:objective(e.scores,k,cfg.specialistWeight)};});
 return {ownedCount:owned.length,slots,elapsedMs:performance.now()-start,anchor,anchorEval,recommendations,baselines,validation,screen,train:pool,adventures:[...cache.values()].reduce((s,e)=>s+e.n,0)+anchorEval.n,candidateEvaluations:cache.size,heuristic,owned};
}
module.exports={load,rng,shuffle,fixture,depart,turn,observe,policy,adventure,evaluate,normalized,objective,signature,approximate,recommend,types};
