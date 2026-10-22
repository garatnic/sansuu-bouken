// ToDo 26: 7地形・8施設の独立レイヤー。地形生成の分布は暫定実装。
window.BoukenWorldGen=Object.freeze({
 generate(width,height,terrains,facilities,counts,partyBuffsSnapshot=[]){
  const setting=counts.find(v=>v.width===width&&v.height===height);if(!setting)throw Error('未対応のワールドサイズ');
  const size=width*height, start={x:Math.floor(width/2),y:Math.floor(height/2)};
  const startIndex=start.y*width+start.x;
  // 低解像度のランダム値を滑らかに補間して地形のまとまりを作る。正式な確率は未確定。
  const coarseW=Math.ceil(width/4)+2,coarseH=Math.ceil(height/4)+2;
  const noise=Array.from({length:coarseW*coarseH},()=>Math.random());
  const sample=(x,y)=>{let u=x/4,v=y/4,i=Math.floor(u),j=Math.floor(v),a=u-i,b=v-j;
   const at=(xx,yy)=>noise[Math.min(coarseH-1,yy)*coarseW+Math.min(coarseW-1,xx)];
   const smooth=t=>t*t*(3-2*t);a=smooth(a);b=smooth(b);
   return (at(i,j)*(1-a)+at(i+1,j)*a)*(1-b)+(at(i,j+1)*(1-a)+at(i+1,j+1)*a)*b;
  };
  const ids=terrains.map(t=>t.id);
  const thresholds=[.11,.31,.49,.63,.76,.89,1]; // 暫定・調整可能
  const terrain=Array.from({length:size},(_,i)=>{const x=i%width,y=Math.floor(i/width);const v=.85*sample(x,y)+.15*Math.random();return ids[thresholds.findIndex(t=>v<t)]||ids[0];});
  terrain[startIndex]='T01';
  const weighted=entries=>{const total=entries.reduce((s,e)=>s+e.weight,0);let r=Math.random()*total;for(const e of entries){r-=e.weight;if(r<0)return e.value;}return entries.at(-1).value;};
  const facility=Array(size).fill(null),events=Array(size).fill(null),eventPools=Array(size).fill(null);
  const level=id=>Math.max(0,Math.min(3,Number(partyBuffsSnapshot.find(s=>s.id===id)?.level||0)));
  const bonus=[0,1/4,2/3,3/2],collectionBonus=bonus[level('C01')],companionBonus=bonus[level('D01')];
  for(let k=0;k<Math.min(setting.facilityCount,size-1);k++){
   const f=weighted(facilities.map(v=>({value:v,weight:v.generationWeightPercent})));
   let available=[];for(let i=0;i<size;i++)if(i!==startIndex&&!facility[i]&&f.allowedTerrainIds.includes(terrain[i]))available.push(i);
   if(!available.length){for(let i=0;i<size;i++)if(i!==startIndex&&!facility[i])available.push(i);if(!available.length)break;const chosen=available[Math.floor(Math.random()*available.length)];terrain[chosen]=f.allowedTerrainIds[Math.floor(Math.random()*f.allowedTerrainIds.length)];available=[chosen];}
   const pos=available[Math.floor(Math.random()*available.length)];facility[pos]=f.id;
   events[pos]=weighted([{value:'companion',weight:f.eventWeightsPercent.companion+100*companionBonus},{value:'collection',weight:f.eventWeightsPercent.collection+100*collectionBonus}]);
   if(events[pos]==='companion')eventPools[pos]=f.companionPoolMode==='all_uniform'?'all':weighted(Object.entries(f.companionPoolWeightsPercent).map(([value,weight])=>({value,weight}))); 
  }
  const explored=Array(size).fill(false);explored[startIndex]=true;
  return {width,height,terrain,facility,events,eventPools,explored,revealed:Array(size).fill(false),visitedFacilities:Array(size).fill(false),player:start,startIndex,exploredCount:0,allExploredRewardClaimed:false,partySnapshot:[],createdAt:new Date().toISOString()};
 }
});
