'use strict';
const L=require('../phase2/core.js'),A=require('../integration/api.js'),O=require('../integration/outcomes.js');
const modes=['explore','treasure','companion','map'],metrics=['opened','newItems','newCharacters','visited'];
function combinations(n,k){let v=1;for(let i=1;i<=k;i++)v=v*(n-i+1)/i;return v;}
async function recommend(runtime,input,{mode,kind='anchored',config={},locked=[],seed=1,trials=3,limit=50,perAnchor=5,anchorLimit=10,bankLimit=10}={}){
 const index=modes.indexOf(mode);if(index<0||!['anchored','random'].includes(kind))throw Error('Unknown experimental mode');
 const cfg={...A.defaults,...config},start=performance.now(),before=JSON.stringify(input.save),random=L.rng(seed),current=input.current;
 A.validate(runtime,input,null,locked);const need=input.slots-locked.length,free=input.owned.filter(id=>!locked.includes(id)),space=combinations(free.length,need),seen=new Map(),anchors=[],reasons=[];
 function add(ids,anchor){const p=A.arrange(input,ids,locked,current),key=A.key(p);A.validate(runtime,input,p,locked);if(seen.has(key))return false;seen.set(key,{party:p,anchor});return true;}
 let rankingMs=0;
 if(!need){add(locked,null);reasons.push('all-slots-user-fixed');}
 else if(kind==='anchored'){
  const t=performance.now(),estimate=O.estimator(runtime,input.save,cfg),base=estimate(locked)[index];
  const ranked=L.shuffle(free,random).map(id=>({id,marginal:estimate([...locked,id])[index]-base})).sort((a,b)=>b.marginal-a.marginal);anchors.push(...ranked.slice(0,anchorLimit));rankingMs=performance.now()-t;
  if(anchors.length<anchorLimit)reasons.push('fewer-than-10-unfixed-owned');
  for(const anchor of anchors){let made=0;for(let attempt=0;attempt<1000&&made<perAnchor;attempt++){const rest=L.shuffle(free.filter(id=>id!==anchor.id),random).slice(0,need-1);if(add([...locked,anchor.id,...rest],anchor.id))made++;}
   // Establish scarcity exactly in small anchor spaces; avoid false retry-limit claims.
   if(made<perAnchor&&combinations(free.length-1,need-1)<=10000){const pool=free.filter(id=>id!==anchor.id);function visit(at,ids){if(made>=perAnchor)return;if(ids.length===need-1){if(add([...locked,anchor.id,...ids],anchor.id))made++;return;}for(let j=at;j<=pool.length-(need-1-ids.length);j++)visit(j+1,[...ids,pool[j]]);}visit(0,[]);}
   anchor.generated=made;if(made<perAnchor)reasons.push('anchor-'+anchor.id+':'+(combinations(free.length-1,need-1)<=10000?'available-unique-combinations-exhausted':'retry-limit'));
  }
 }else{
  for(let attempt=0;attempt<10000&&seen.size<Math.min(limit,space);attempt++)add(A.randomParty(runtime,input,locked,current,random),null);
  if(seen.size<Math.min(limit,space)&&space<=10000){function visit(at,ids){if(seen.size>=Math.min(limit,space))return;if(ids.length===need){add([...locked,...ids],null);return;}for(let j=at;j<=free.length-(need-ids.length);j++)visit(j+1,[...ids,free[j]]);}visit(0,[]);}
 }
 if(seen.size<limit)reasons.push(space<limit?'total-combination-space-below-50':'generated-below-50');
 const generationMs=performance.now()-start,ev=A.evaluator(runtime,input,cfg),seeds=Array.from({length:trials},(_,i)=>cfg.trainSeedStart+i),rows=[];
 for(const e of seen.values()){const evaluated=await ev.evaluateParty(e.party,seeds);rows.push({...e,...evaluated,score:evaluated.metrics[metrics[index]]});}
 rows.sort((a,b)=>b.score-a.score||A.key(a.party).localeCompare(A.key(b.party)));const bank=rows.slice(0,bankLimit);
 if(JSON.stringify(input.save)!==before)throw Error('Save mutated');
 return {kind,mode,metric:metrics[index],rows,bank,anchors,reasons,space,logicalTrials:rows.length*trials,adventures:ev.adventures,rankingMs,generationMs,evaluationMs:performance.now()-start-generationMs,elapsedMs:performance.now()-start,locked:[...locked],config:cfg};
}
// Only cursor state changes. No random generator, simulation or search is called.
function cursor(bank){if(!bank.length)throw Error('Empty bank');let index=0;return {get current(){return bank[index];},next(){index=(index+1)%bank.length;return bank[index];}};}
module.exports={recommend,cursor,modes,metrics,combinations};
