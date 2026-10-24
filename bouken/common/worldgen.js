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
  const level=id=>Math.max(0,Math.min(3,Number(partyBuffsSnapshot.find(s=>s.id===id)?.level||0)));
  const thresholds=[.11,.31,.49,.63,.76,.89,1]; // Existing baseline bands; actual shares also depend on spatial noise.
  const baseWeights=thresholds.map((t,i)=>t-(thresholds[i-1]||0));
  const terrain=Array(size).fill(null);
  const adjacent=i=>{const x=i%width,y=Math.floor(i/width),out=[];if(x)out.push(i-1);if(x<width-1)out.push(i+1);if(y)out.push(i-width);if(y<height-1)out.push(i+width);return out;};
  const concentration=[1,1.25,1.5,2][level('E08')],connection=[1,1.08,1.16,1.3][level('E09')];
  const terrainMultipliers=ids.map(id=>[1,4,7,11][level('E'+id.slice(1))]);
  // E09 grows outward from the starting land. No post-generation terrain rewrite.
  const order=Array.from({length:size},(_,i)=>i);
  if(connection>1){terrain[startIndex]='T01';order.sort((a,b)=>Math.abs(a%width-start.x)+Math.abs(Math.floor(a/width)-start.y)-Math.abs(b%width-start.x)-Math.abs(Math.floor(b/width)-start.y));}
  for(const i of order){
   const x=i%width,y=Math.floor(i/width),v=.85*sample(x,y)+.15*Math.random();
   if(i===startIndex&&connection>1)continue;
   const neighbors=adjacent(i).map(n=>terrain[n]).filter(Boolean),same=new Set(neighbors);
   const landNear=neighbors.some(id=>id!=='T05');
   const weights=ids.map((id,k)=>baseWeights[k]*terrainMultipliers[k]*(same.has(id)?concentration:1)*(connection>1?((id==='T05')===landNear?1/connection:connection):1));
   const total=weights.reduce((a,b)=>a+b,0);let r=v*total,index=weights.length-1;
   for(let k=0;k<weights.length;k++){r-=weights[k];if(r<0){index=k;break;}}
   terrain[i]=ids[index];
  }
  terrain[startIndex]='T01';
  const weighted=entries=>{const total=entries.reduce((s,e)=>s+e.weight,0);let r=Math.random()*total;for(const e of entries){r-=e.weight;if(r<0)return e.value;}return entries.at(-1).value;};
  const facility=Array(size).fill(null),events=Array(size).fill(null),eventPools=Array(size).fill(null);
  const bonus=[0,1/4,2/3,3/2],collectionBonus=bonus[level('C01')],companionBonus=bonus[level('D01')];
  const baseFacilityCount=Math.min(setting.facilityCount,size-1);
  const selectedFacilities=[];
  const placeFacility=f=>{
   let available=[];for(let i=0;i<size;i++)if(i!==startIndex&&!facility[i]&&f.allowedTerrainIds.includes(terrain[i]))available.push(i);
   if(!available.length){for(let i=0;i<size;i++)if(i!==startIndex&&!facility[i])available.push(i);if(!available.length)return false;const chosen=available[Math.floor(Math.random()*available.length)];terrain[chosen]=f.allowedTerrainIds[Math.floor(Math.random()*f.allowedTerrainIds.length)];available=[chosen];}
   const pos=available[Math.floor(Math.random()*available.length)];facility[pos]=f.id;
   events[pos]=weighted([{value:'companion',weight:f.eventWeightsPercent.companion+100*companionBonus},{value:'collection',weight:f.eventWeightsPercent.collection+100*collectionBonus}]);
   if(events[pos]==='companion')eventPools[pos]=f.companionPoolMode==='all_uniform'?'all':weighted(Object.entries(f.companionPoolWeightsPercent).map(([value,weight])=>({value,weight}))); 
   return true;
  };
  for(let k=0;k<baseFacilityCount;k++){
   const f=weighted(facilities.map(v=>({value:v,weight:v.generationWeightPercent})));
   if(placeFacility(f))selectedFacilities.push(f);
  }

  // D03/D08/D09: 基本抽選後に対象グループ別に追加。追加施設は再計算対象にしない。
  if(size!==25){
   const groups=[{id:'D03',ids:['F01','F02']},{id:'D08',ids:['F03','F04']},{id:'D09',ids:['F05','F06','F07']}];
   for(const group of groups){
    const lv=level(group.id);if(!lv)continue;
    const baseCount=selectedFacilities.filter(f=>group.ids.includes(f.id)).length;
    const minimum=width===10&&height===10?1:lv;
    const extra=Math.max(minimum,Math.ceil(baseCount*[0,.2,.4,.6][lv]));
    const candidates=facilities.filter(f=>group.ids.includes(f.id));
    for(let k=0;k<extra&&facility.some((v,i)=>i!==startIndex&&!v);k++){
     const f=weighted(candidates.map(v=>({value:v,weight:v.generationWeightPercent})));
     placeFacility(f);
    }
   }
  }
  const explored=Array(size).fill(false);explored[startIndex]=true;
  return {width,height,terrain,facility,events,eventPools,explored,revealed:Array(size).fill(false),visitedFacilities:Array(size).fill(false),player:start,startIndex,exploredCount:0,allExploredRewardClaimed:false,partySnapshot:[],createdAt:new Date().toISOString()};
 }
});
