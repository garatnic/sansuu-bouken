(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('../phase2/core.js'),require('./api.js'),require('./outcomes.js'));else root.PartyLight=factory(root.BoukenPartyLab,root.PartyExperiment,root.PartyOutcomes);})(typeof globalThis!=='undefined'?globalThis:this,function(L,A,O){
'use strict';
const modes=['explore','treasure','companion','map'],metrics=['opened','newItems','newCharacters','visited'];
function combinations(n,k){let v=1;for(let i=1;i<=k;i++)v=v*(n-i+1)/i;return v;}
async function recommend(runtime,input,{mode,config={},locked=[],seed=1}={},hooks={}){
 const kind='anchored',trials=3,limit=50,perAnchor=5,anchorLimit=10,bankLimit=10;
 const index=modes.indexOf(mode);if(index<0||!['anchored','random'].includes(kind))throw Error('Unknown experimental mode');
 const cfg={...A.defaults,...config},start=performance.now(),before=JSON.stringify(input.save),random=L.rng(seed),current=input.current;
 let stage=0,completed=0,total=1,ev;const emit=()=>hooks.onProgress?.({workflow:'light',stage,completed,total,adventures:ev?.adventures||0,candidates:seen?.size||0});const enter=(s,n)=>{stage=s;completed=0;total=Math.max(1,n);emit();};const step=()=>{completed++;emit();};const pause=async()=>{if(hooks.cancelled?.())throw Error('中止しました');await hooks.yield?.();};
 A.validate(runtime,input,null,locked);const need=input.slots-locked.length,free=input.owned.filter(id=>!locked.includes(id)),space=combinations(free.length,need),seen=new Map(),anchors=[],reasons=[];
 function add(ids,anchor){const p=A.arrange(input,ids,locked,current),key=A.key(p);A.validate(runtime,input,p,locked);if(seen.has(key))return false;seen.set(key,{party:p,anchor});return true;}
 let rankingMs=0;
 enter(0,need?free.length:1);
 if(!need){step();enter(1,1);add(locked,null);step();reasons.push('all-slots-user-fixed');}
 else if(kind==='anchored'){
  const t=performance.now(),estimate=O.estimator(runtime,input.save,cfg),base=estimate(locked)[index];
  const ranked=[];for(const id of L.shuffle(free,random)){ranked.push({id,marginal:estimate([...locked,id])[index]-base});step();if(completed%32===0)await pause();}ranked.sort((a,b)=>b.marginal-a.marginal);anchors.push(...ranked.slice(0,anchorLimit));rankingMs=performance.now()-t;
  if(anchors.length<anchorLimit)reasons.push('fewer-than-10-unfixed-owned');
  enter(1,anchors.length);
  for(const anchor of anchors){let made=0;for(let attempt=0;attempt<1000&&made<perAnchor;attempt++){if(attempt%128===0)await pause();const rest=L.shuffle(free.filter(id=>id!==anchor.id),random).slice(0,need-1);if(add([...locked,anchor.id,...rest],anchor.id))made++;}
   // Establish scarcity exactly in small anchor spaces; avoid false retry-limit claims.
   if(made<perAnchor&&combinations(free.length-1,need-1)<=10000){const pool=free.filter(id=>id!==anchor.id);function visit(at,ids){if(made>=perAnchor)return;if(ids.length===need-1){if(add([...locked,anchor.id,...ids],anchor.id))made++;return;}for(let j=at;j<=pool.length-(need-1-ids.length);j++)visit(j+1,[...ids,pool[j]]);}visit(0,[]);}
   step();await pause();anchor.generated=made;if(made<perAnchor)reasons.push('anchor-'+anchor.id+':'+(combinations(free.length-1,need-1)<=10000?'available-unique-combinations-exhausted':'retry-limit'));
  }
 }
 if(seen.size<limit)reasons.push(space<limit?'total-combination-space-below-50':'generated-below-50');
 const generationMs=performance.now()-start;ev=A.evaluator(runtime,input,cfg,{...hooks,onTrial:(done,n)=>{hooks.onTrial?.(done,n);hooks.onProgress?.({workflow:'light',stage:2,completed:completed+done/n,total,adventures:ev.adventures,candidates:seen.size});}});const seeds=Array.from({length:trials},(_,i)=>cfg.trainSeedStart+i),rows=[];
 enter(2,seen.size);
 for(const e of seen.values()){const evaluated=await ev.evaluateParty(e.party,seeds);rows.push({...e,...evaluated,score:evaluated.metrics[metrics[index]]});step();}
 enter(3,1);
 rows.sort((a,b)=>b.score-a.score||A.key(a.party).localeCompare(A.key(b.party)));const bank=rows.slice(0,bankLimit);step();enter(4,1);step();
 if(JSON.stringify(input.save)!==before)throw Error('Save mutated');
 return {kind,mode,metric:metrics[index],rows,bank,anchors,reasons,space,logicalTrials:rows.length*trials,adventures:ev.adventures,rankingMs,generationMs,evaluationMs:performance.now()-start-generationMs,elapsedMs:performance.now()-start,locked:[...locked],config:cfg};
}

return {recommend,modes,metrics};
});
