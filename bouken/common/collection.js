// Completed collections unlock a claim; only claimed bonuses affect adventures.
window.BoukenCollection=(()=>{
 let items=[],rewards=[],byGroup=new Map();
 function configure(itemMaster,rewardMaster){items=itemMaster;rewards=rewardMaster;byGroup=new Map();for(const i of items){if(!byGroup.has(i.subgroupId))byGroup.set(i.subgroupId,[]);byGroup.get(i.subgroupId).push(i);}}
 function completed(save,inventory=save.items){return rewards.filter(r=>{const group=byGroup.get(r.subgroupId)||[];return group.length===5&&group.every(i=>Number(inventory?.[i.id]||0)>0);}).map(r=>r.subgroupId);}
 function prepare(save){
  // Legacy automatic bonuses are already earned. Freeze their old inventory before new finds.
  if(save.collectionClaimsVersion!==1){save.collectionLegacyItems=Object.keys(save.items||{}).filter(id=>Number(save.items[id])>0);save.collectionClaimsVersion=1;}
  if(!Array.isArray(save.claimedCollectionRewards))save.claimedCollectionRewards=[];
  if(Array.isArray(save.collectionLegacyItems)){
   const inventory=Object.fromEntries(save.collectionLegacyItems.map(id=>[String(id),1])),old=completed(save,inventory);
   save.claimedCollectionRewards=[...new Set([...save.claimedCollectionRewards,...old])];
   if(save.homeGrowthNotices?.collections===null)save.homeGrowthNotices.collections=[...old];
   delete save.collectionLegacyItems;
  }
  if(save.homeGrowthNotices?.collections===null)save.homeGrowthNotices.collections=completed(save);
  return save;
 }
 function isClaimed(save,id){prepare(save);return save.claimedCollectionRewards.includes(id);}
 function claim(save,id){prepare(save);if(!rewards.some(r=>r.subgroupId===id)||!completed(save).includes(id))throw Error('まだコンプリートしていません');if(save.claimedCollectionRewards.includes(id))return false;save.claimedCollectionRewards.push(id);return true;}
 function stages(save){prepare(save);const out=Array(6).fill(0),owned=new Set(completed(save)),claimed=new Set(save.claimedCollectionRewards);for(const r of rewards)if(owned.has(r.subgroupId)&&claimed.has(r.subgroupId)&&r.rewardId>=1&&r.rewardId<=6)out[r.rewardId-1]++;return out.map(n=>Math.min(16,n));}
 // Move probability mass to the unknown set, preserving ratios within both sets.
 function unknownWeights(entries,inventory,bonus){
  const unknown=e=>!(Number(inventory?.[e.value.id]||0)>0);
  const u=entries.filter(unknown).reduce((s,e)=>s+Math.max(0,e.weight),0),k=entries.filter(e=>!unknown(e)).reduce((s,e)=>s+Math.max(0,e.weight),0);
  if(!bonus||!u||!k)return entries;
  const total=u+k,p=Math.min(1,u/total+bonus);
  return entries.map(e=>({...e,weight:e.weight*(unknown(e)?p*total/u:(1-p)*total/k)}));
 }
 function initial(w,tiles,rng=Math.random){if(w.collectionInitialApplied)return 0;w.collectionInitialApplied=true;let opened=0;for(let n=0;n<tiles;n++){const frontier=[];for(let i=0;i<w.explored.length;i++)if(!w.explored[i]&&BoukenExplore.adjacent(w,i).some(j=>w.explored[j]))frontier.push(i);if(!frontier.length)break;const i=frontier[Math.floor(rng()*frontier.length)];w.explored[i]=true;w.exploredCount++;w.lastInitialOpenedIndex=i;opened++;}return opened;}
 return Object.freeze({configure,completed,prepare,isClaimed,claim,stages,unknownWeights,initial});
})();
