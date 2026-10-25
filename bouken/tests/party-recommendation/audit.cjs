'use strict';
// Independent seeds: frozen recommendations are assessed, never reranked on this set.
const fs=require('node:fs'),path=require('node:path'),E=require('./engine.cjs');
const input=require('./results.json'),r=E.load(),cfg=input.config,seeds=Array.from({length:128},(_,i)=>61001+i),out=[];
function mean(rows){return [0,1,2,3].map(k=>rows.reduce((s,x)=>s+x[k],0)/rows.length);}
function delta(a,b,type,anchor){return E.objective(E.normalized(mean(a),anchor),type,cfg.specialistWeight)-E.objective(E.normalized(mean(b),anchor),type,cfg.specialistWeight);}
for(const result of input.results){
 const f=E.fixture(r,result.ownedCount,cfg),cache=new Map(),started=performance.now();
 function assess(p){const key=E.signature(r,p);if(!cache.has(key)){const trials=seeds.map(seed=>E.adventure(r,f.save,p,cfg,seed));cache.set(key,{party:p,samples:trials.map(x=>x.raw),mean:mean(trials.map(x=>x.raw)),metrics:Object.fromEntries(['opened','qClear','newItems','items','target','newCharacters','joins','known','visited','discoveryAuc'].map(k=>[k,trials.reduce((s,x)=>s+x[k],0)/trials.length])),ciRaw:[0,1,2,3].map(k=>{const m=trials.reduce((s,x)=>s+x.raw[k],0)/trials.length,se=Math.sqrt(trials.reduce((s,x)=>s+(x.raw[k]-m)**2,0)/(trials.length-1)/trials.length);return [Math.max(0,m-1.96*se),m+1.96*se];})});}return cache.get(key);}
 const comparisons=result.recommendations.map((rec,type)=>{
  const a=assess(rec.party),b=assess(result.baselines[type].party),random=E.rng(60001+type),boot=[];
  for(let n=0;n<500;n++){const aa=[],bb=[];for(let j=0;j<seeds.length;j++){const k=Math.floor(random()*seeds.length);aa.push(a.samples[k]);bb.push(b.samples[k]);}boot.push(delta(aa,bb,type,result.anchor));}boot.sort((a,b)=>a-b);
  const score=E.normalized(a.mean,result.anchor),before=E.normalized(b.mean,result.anchor);
  return {type:E.types[type],party:rec.party,baseline:result.baselines[type].party,scores:score,baselineScores:before,objective:E.objective(score,type,cfg.specialistWeight),baselineObjective:E.objective(before,type,cfg.specialistWeight),delta:delta(a.samples,b.samples,type,result.anchor),deltaBootstrap95:[boot[12],boot[487]],metrics:a.metrics,ciRaw:a.ciRaw};
 });
 const sensitivity=[.5,.7,.9].map(weight=>({weight,winners:E.types.map((type,k)=>{const best=[...result.validation].sort((a,b)=>E.objective(b.scores,k,weight)-E.objective(a.scores,k,weight))[0];return {type,party:best.party};})}));
 const ablationParty=result.recommendations[4].party,ablations=['informed','random'].map(policy=>{const trials=seeds.slice(0,32).map(seed=>E.adventure(r,f.save,ablationParty,cfg,seed,{policy}));return {policy,raw:mean(trials.map(x=>x.raw)),discoveryAuc:trials.reduce((s,x)=>s+x.discoveryAuc,0)/trials.length,visited:trials.reduce((s,x)=>s+x.visited,0)/trials.length};});
 out.push({ownedCount:result.ownedCount,trials:seeds.length,elapsedMs:performance.now()-started,comparisons,sensitivity,ablations,evaluations:[...cache.values()]});console.log('audit',result.ownedCount,out.at(-1).elapsedMs);
}
fs.writeFileSync(path.join(__dirname,'audit-results.json'),JSON.stringify({sourceCommit:input.sourceCommit,seeds,bootstrapReplicates:500,results:out},null,2)+'\n');
