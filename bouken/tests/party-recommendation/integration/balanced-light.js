// Independent mock only. Legacy api.js / specialist light.js intentionally untouched.
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('../phase2/core.js'),require('./api.js'),require('./outcomes.js'));else root.PartyBalancedLight=factory(root.BoukenPartyLab,root.PartyExperiment,root.PartyOutcomes);})(globalThis,function(L,A,O){
'use strict';
const metrics=['opened','newItems','newCharacters','visited'];
const settings=Object.freeze({limit:50,trials:3,bank:10,referenceParties:12,referenceTrials:2,penalty:.2,weaknessOffset:.25,attempts:1000});
const referenceCache=new Map();
function score(values,reference,penalty=settings.penalty){const points=values.map((x,k)=>Math.max(0,x)/reference[k]*100),average=points.reduce((s,x)=>s+x,0)/4,minimum=Math.min(...points),weaknessPenalty=penalty*Math.max(0,100-minimum);return {points,average,minimum,weaknessPenalty,score:average-weaknessPenalty};}
function weaknessWeights(values,reference){const weights=values.map((v,k)=>1/(settings.weaknessOffset+Math.max(0,v)/Math.max(1e-6,reference[k]))),sum=weights.reduce((s,x)=>s+x,0);return weights.map(x=>x/sum);}
function draw(weights,random){let p=random();for(let k=0;k<weights.length;k++){p-=weights[k];if(p<=0)return k;}return weights.length-1;}
function combinations(n,k){let v=1;for(let i=1;i<=k;i++)v=v*(n-i+1)/i;return v;}
async function recommend(runtime,input,{config={},locked=[],seed=1,kind='weakness'}={},hooks={}){
 if(!['weakness','random-selection'].includes(kind))throw Error('Unknown candidate generator');
 A.validate(runtime,input,null,locked);const cfg={...A.defaults,...config},start=performance.now(),before=JSON.stringify(input.save),random=L.rng(seed),current=input.current,estimate=O.estimator(runtime,input.save,cfg),free=input.owned.filter(id=>!locked.includes(id)),need=input.slots-locked.length,space=combinations(free.length,need),seen=new Map(),reasons=[];
 let stage=0,done=0,total=1,candidateEvaluator;
 const emit=()=>hooks.onProgress?.({workflow:'light',stage,completed:done,total,candidates:seen.size,adventures:candidateEvaluator?.adventures||0});
 const enter=(s,n)=>{stage=s;done=0;total=Math.max(1,n);emit();};
 const pause=async()=>{if(hooks.cancelled?.())throw Error('中止しました');await hooks.yield?.();if(hooks.cancelled?.())throw Error('中止しました');};
 const tick=()=>{done++;emit();};
 // Same condition, ownership and fixed constraints. Separate from ranking seeds.
 const {createdAt,updatedAt,party:storedParty,...conditionSave}=input.save;
 const cacheKey=JSON.stringify([conditionSave,input.owned,input.slots,locked.slice().sort((a,b)=>a-b).map(id=>[id,current.indexOf(id)]),cfg.size,cfg.budget,cfg.targetGroup,cfg.policy,cfg.referencePartySeed,cfg.referenceSeedStart]);
 enter(0,settings.referenceParties*settings.referenceTrials+free.length);
 let reference=referenceCache.get(cacheKey),referenceCacheHit=!!reference,referenceAdventures=0;
 if(!reference){const refRandom=L.rng(cfg.referencePartySeed),ev=A.evaluator(runtime,input,cfg,{...hooks,onTrial:()=>tick()}),values=[],proxies=[],parties=[];
  for(let i=0;i<settings.referenceParties;i++){await pause();const p=A.randomParty(runtime,input,locked,current,refRandom),e=await ev.evaluateParty(p,Array.from({length:settings.referenceTrials},(_,j)=>cfg.referenceSeedStart+j));parties.push(p);values.push(metrics.map(k=>e.metrics[k]));proxies.push(estimate(p));}
  const mean=L.mean(values),floors=[1,1/(settings.referenceParties*settings.referenceTrials),1/(settings.referenceParties*settings.referenceTrials),1/(settings.referenceParties*settings.referenceTrials)];
  reference={mean,floors,denominators:mean.map((v,k)=>Math.max(floors[k],v)),proxy:L.mean(proxies).map(v=>Math.max(1e-6,v)),parties,logicalTrials:settings.referenceParties*settings.referenceTrials};referenceAdventures=ev.adventures;await pause();referenceCache.set(cacheKey,reference);if(referenceCache.size>8)referenceCache.delete(referenceCache.keys().next().value);
 }else{done=settings.referenceParties*settings.referenceTrials;emit();}
 const base=estimate(locked),ranked=[[],[],[],[]];for(const id of L.shuffle(free,random)){const v=estimate([...locked,id]);for(let k=0;k<4;k++)ranked[k].push({id,marginal:v[k]-base[k]});tick();if(done%32===0)await pause();}ranked.forEach(list=>list.sort((a,b)=>b.marginal-a.marginal));
 const calibrationMs=performance.now()-start;
 function add(ids){const party=A.arrange(input,ids,locked,current);A.validate(runtime,input,party,locked);const key=A.key(party);if(seen.has(key))return false;seen.set(key,party);return true;}
 enter(1,Math.min(settings.limit,space));
 for(let attempt=0;attempt<settings.attempts&&seen.size<Math.min(settings.limit,space);attempt++){
  await pause();let p=[...locked];
  if(kind==='random-selection')p=A.randomParty(runtime,input,locked,current,random);
  else while(p.length<input.slots){const axis=p.length?draw(weaknessWeights(estimate(p),reference.proxy),random):Math.floor(random()*4),available=ranked[axis].filter(x=>!p.includes(x.id)).slice(0,10);if(!available.length)throw Error('採用可能な仲間がいません');p.push(available[Math.floor(random()*available.length)].id);}
  if(add(p))tick();
 }
 // Small spaces: establish exact scarcity; no invented duplicate parties.
 if(seen.size<Math.min(settings.limit,space)&&space<=10000){function visit(at,ids){if(seen.size>=settings.limit)return;if(ids.length===need){if(add([...locked,...ids]))tick();return;}for(let i=at;i<=free.length-(need-ids.length);i++)visit(i+1,[...ids,free[i]]);}visit(0,[]);}
 if(seen.size<settings.limit)reasons.push(space<settings.limit?'available-combinations-below-50':'generation-retry-limit');
 const generationMs=performance.now()-start-calibrationMs,rows=[];
 enter(2,seen.size);candidateEvaluator=A.evaluator(runtime,input,cfg,{...hooks,onTrial:(n,count)=>hooks.onProgress?.({workflow:'light',stage:2,completed:done+n/count,total,candidates:seen.size,adventures:candidateEvaluator.adventures})});
 const seeds=Array.from({length:settings.trials},(_,i)=>cfg.trainSeedStart+i);
 for(const p of seen.values()){await pause();const e=await candidateEvaluator.evaluateParty(p,seeds);rows.push({...e,...score(metrics.map(k=>e.metrics[k]),reference.denominators),diagnosis:A.diagnose(runtime,p)});tick();}
 enter(3,1);rows.sort((a,b)=>b.score-a.score||A.key(a.party).localeCompare(A.key(b.party)));
 // Preserve numerical rank; among exact ties prefer existing ability distance.
 const bank=[];let pool=[...rows];while(pool.length&&bank.length<settings.bank){const best=pool[0].score,ties=pool.filter(e=>e.score===best);if(bank.length)ties.sort((a,b)=>Math.min(...bank.map(e=>A.abilityDistance(runtime,b.party,e.party)))-Math.min(...bank.map(e=>A.abilityDistance(runtime,a.party,e.party)))||A.key(a.party).localeCompare(A.key(b.party)));const chosen=ties[0];bank.push(chosen);pool=pool.filter(e=>e!==chosen);}tick();enter(4,1);tick();await pause();
 if(JSON.stringify(input.save)!==before)throw Error('Save mutated');
 return {mode:'balanced',kind,engine:'balanced-light-50x3x10',banks:{balanced:bank},bank,rows,evaluations:rows,generatedCandidates:rows.length,logicalTrials:rows.length*settings.trials,adventures:candidateEvaluator.adventures,referenceAdventures,referenceCacheHit,reference,locked:[...locked],reasons,space,config:cfg,elapsedMs:performance.now()-start,profile:{calibrationMs,generationMs,evaluationMs:performance.now()-start-calibrationMs-generationMs},provisional:true};
}
return {recommend,score,weaknessWeights,settings,metrics,clearReferenceCache:()=>referenceCache.clear()};
});
