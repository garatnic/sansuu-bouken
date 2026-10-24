// Completed groups are derived from owned kinds: duplicates never increase stages.
window.BoukenCollection=(()=>{
 let items=[],rewards=[];
 function configure(itemMaster,rewardMaster){items=itemMaster;rewards=rewardMaster;}
 function stages(save){const out=Array(6).fill(0);for(const r of rewards){const group=items.filter(i=>i.subgroupId===r.subgroupId);if(group.length===5&&group.every(i=>Number(save.items?.[i.id]||0)>0)&&r.rewardId>=1&&r.rewardId<=6)out[r.rewardId-1]++;}return out.map(n=>Math.min(16,n));}
 // Move probability mass to the unknown set, preserving ratios within both sets.
 function unknownWeights(entries,inventory,bonus){
  const unknown=e=>!(Number(inventory?.[e.value.id]||0)>0);
  const u=entries.filter(unknown).reduce((s,e)=>s+Math.max(0,e.weight),0),k=entries.filter(e=>!unknown(e)).reduce((s,e)=>s+Math.max(0,e.weight),0);
  if(!bonus||!u||!k)return entries;
  const total=u+k,p=Math.min(1,u/total+bonus);
  return entries.map(e=>({...e,weight:e.weight*(unknown(e)?p*total/u:(1-p)*total/k)}));
 }
 function initial(w,tiles,rng=Math.random){if(w.collectionInitialApplied)return 0;w.collectionInitialApplied=true;let opened=0;for(let n=0;n<tiles;n++){const frontier=[];for(let i=0;i<w.explored.length;i++)if(!w.explored[i]&&BoukenExplore.adjacent(w,i).some(j=>w.explored[j]))frontier.push(i);if(!frontier.length)break;const i=frontier[Math.floor(rng()*frontier.length)];w.explored[i]=true;w.exploredCount++;w.lastInitialOpenedIndex=i;opened++;}return opened;}
 return Object.freeze({configure,stages,unknownWeights,initial});
})();
