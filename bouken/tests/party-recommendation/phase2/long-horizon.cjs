'use strict';
const fs=require('node:fs'),path=require('node:path'),L=require('./node.cjs'),r=L.load(),rows=[];
for(const id of ['legacy-500','legacy-927','early-140','late-279-unclaimed','late-900','rich-927','rich-927-unclaimed']){
 const input=require('./results/'+id+'.json'),parties=new Map();for(const e of [...input.result.recommendations,...(input.phase1Recommendations||[])])parties.set(L.signature(r,e.party),e.party);
 const evaluated=[];for(const party of parties.values()){const trials=Array.from({length:16},(_,i)=>L.adventure(r,input.input.save,party,input.spec.config,181001+i,{full:true})),keys=['newItems','items','newTarget','newCharacters','joins','rewardJoins'],means=Object.fromEntries(keys.map(k=>[k,trials.reduce((s,x)=>s+x.final[k],0)/16]));means.qClear=trials.reduce((s,x)=>s+x.qClear,0)/16;means.newItemsPerCorrect=trials.reduce((s,x)=>s+x.final.newItems/x.qClear,0)/16;means.newCharactersPerCorrect=trials.reduce((s,x)=>s+x.final.newCharacters/x.qClear,0)/16;evaluated.push({party,...means});}
 rows.push({case:id,remaining:L.context(r,input.input.save,input.spec.config),recommendations:input.result.recommendations.map((e,k)=>({type:e.type,...evaluated.find(x=>L.signature(r,x.party)===L.signature(r,e.party)),phase1:input.phase1Recommendations?evaluated.find(x=>L.signature(r,x.party)===L.signature(r,input.phase1Recommendations[k].party)):null})),evaluated});console.log('HORIZON',id);
}
fs.writeFileSync(path.join(__dirname,'horizon-results.json'),JSON.stringify({seedStart:181001,n:16,rows},null,2)+'\n');
