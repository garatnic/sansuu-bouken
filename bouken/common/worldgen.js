// Quota-controlled multi-field noise with area-preserving E08 shaping.
window.BoukenWorldGen=Object.freeze({
 // E08: area-preserving component consolidation before facility placement.
 shape(terrain,width,height,startIndex,level,protectLand=false){
  if(!level)return;
  const size=terrain.length,minArea=[0,3,6,12][level];
  const near=Array.from({length:size},(_,i)=>{const x=i%width,y=Math.floor(i/width),a=[];if(x)a.push(i-1);if(x+1<width)a.push(i+1);if(y)a.push(i-width);if(y+1<height)a.push(i+width);return a;});
  const degree=(i,t)=>near[i].reduce((n,j)=>n+(terrain[j]===t),0);
  // Conservatively preserve local connections when moving a boundary cell.
  const removable=(i,t,land=false)=>{
   const matches=j=>land?terrain[j]!=='T05':terrain[j]===t;
   const targets=near[i].filter(matches);if(targets.length<2)return true;
   const x=i%width,y=Math.floor(i/width),seen=new Set([targets[0]]),queue=[targets[0]];
   for(let k=0;k<queue.length;k++)for(const j of near[queue[k]])if(j!==i&&Math.abs(j%width-x)<=1&&Math.abs(Math.floor(j/width)-y)<=1&&matches(j)&&!seen.has(j)){seen.add(j);queue.push(j);}
   return targets.every(j=>seen.has(j));
  };
  const blocks=i=>{let n=0;const x=i%width,y=Math.floor(i/width);for(let yy=Math.max(0,y-1);yy<=Math.min(height-2,y);yy++)for(let xx=Math.max(0,x-1);xx<=Math.min(width-2,x);xx++){const a=yy*width+xx,t=terrain[a];if(terrain[a+1]===t&&terrain[a+width]===t&&terrain[a+width+1]===t)n++;}return n;};
  const score=(i,j)=>{
   if(i===startIndex||j===startIndex||i===j)return -Infinity;
   const a=terrain[i],b=terrain[j];if(a===b||!removable(i,a)||!removable(j,b))return -Infinity;
   if(protectLand&&((a==='T05')!==(b==='T05'))&&!removable(a==='T05'?j:i,null,true))return -Infinity;
   const delta=degree(i,b)-degree(i,a)+degree(j,a)-degree(j,b)-(near[i].includes(j)?2:0);
   const before=blocks(i)+blocks(j);terrain[i]=b;terrain[j]=a;const after=blocks(i)+blocks(j);terrain[i]=a;terrain[j]=b;
   return delta+.35*(after-before);
  };
  const swap=(i,j)=>{const a=terrain[i];terrain[i]=terrain[j];terrain[j]=a;};
  const cycle=(positions,colors)=>{
   for(let k=0;k<3;k++){const i=positions[k],old=terrain[i];if(i===startIndex||!removable(i,old))return false;if(protectLand&&old!=='T05'&&colors[k]==='T05'&&!removable(i,null,true))return false;}
   for(let a=0;a<3;a++)for(let b=a+1;b<3;b++)if(Math.abs(positions[a]%width-positions[b]%width)+Math.abs(Math.floor(positions[a]/width)-Math.floor(positions[b]/width))<=2)return false;
   const old=positions.map(i=>terrain[i]);let delta=0;for(let k=0;k<3;k++)delta+=degree(positions[k],colors[k])-degree(positions[k],old[k]);
   if(delta< -2)return false;positions.forEach((i,k)=>terrain[i]=colors[k]);return true;
  };
  const analyse=()=>{
   const owner=new Int32Array(size).fill(-1),components=[],largest=new Map;
   for(let i=0;i<size;i++)if(owner[i]<0){const c={id:components.length,type:terrain[i],cells:[i],minX:width,maxX:0,minY:height,maxY:0,blocks:0};owner[i]=c.id;
    for(let k=0;k<c.cells.length;k++){const j=c.cells[k],x=j%width,y=Math.floor(j/width);c.minX=Math.min(c.minX,x);c.maxX=Math.max(c.maxX,x);c.minY=Math.min(c.minY,y);c.maxY=Math.max(c.maxY,y);c.blocks+=blocks(j);for(const n of near[j])if(owner[n]<0&&terrain[n]===c.type){owner[n]=c.id;c.cells.push(n);}}
    components.push(c);if(!largest.has(c.type)||largest.get(c.type).cells.length<c.cells.length)largest.set(c.type,c);
   }return {owner,components,largest};
  };
  const consolidate=()=>{
   for(let pass=0;pass<[0,3,7,14][level];pass++){
    const {owner,components,largest}=analyse();let changes=0;
    const fronts=new Map;
    for(const [type,c] of largest){const f=[];for(let i=0;i<size;i++)if(terrain[i]!==type&&near[i].some(j=>owner[j]===c.id))f.push(i);fronts.set(type,f);}
    // The protected starting grass tile must belong to a usable grass patch too.
    const startComponent=components[owner[startIndex]];
    if(startComponent.cells.length<minArea){
     const boundary=[];for(let i=0;i<size;i++)if(terrain[i]!=='T01'&&near[i].some(j=>owner[j]===startComponent.id))boundary.push(i);
     let bestI=-1,bestJ=-1,bestValue=-3;
     for(const i of boundary)for(let k=0;k<80;k++){const j=Math.floor(Math.random()*size);if(terrain[j]!=='T01'||owner[j]===startComponent.id||degree(j,terrain[i])<1)continue;const v=score(i,j);if(v>bestValue){bestValue=v;bestI=i;bestJ=j;}}
     if(bestI>=0){swap(bestI,bestJ);changes++;}
    }
    const small=components.filter(c=>c.cells.length<minArea||(level===3&&c.cells.length>=6&&(c.blocks===0||Math.min(c.maxX-c.minX+1,c.maxY-c.minY+1)<3))).sort((a,b)=>a.cells.length-b.cells.length);
    for(const c of small){if(largest.get(c.type)===c)continue;const frontier=fronts.get(c.type);if(!frontier.length)continue;
     const cells=c.cells.slice().sort((a,b)=>degree(a,c.type)-degree(b,c.type));
     for(const i of cells){if(terrain[i]!==c.type)continue;let best=-1,bestScore=-1.01;
      // Move the fragment into the main same-type region, replacing an adjacent type.
      for(let k=0;k<Math.min(64,frontier.length*2);k++){const j=frontier[Math.floor(Math.random()*frontier.length)];if(terrain[j]===c.type||!near[i].some(n=>terrain[n]===terrain[j])||!near[j].some(n=>terrain[n]===c.type&&owner[n]!==c.id))continue;const v=score(i,j);if(v>bestScore){bestScore=v;best=j;}}
      if(best>=0){swap(i,best);changes++;}
      else if(level===3){
       // Three-way exchanges handle fragments whose surrounding type is absent
       // at the main region's boundary, still preserving every terrain's area.
       let moved=false;
       for(let k=0;k<64&&!moved;k++){
        const j=frontier[Math.floor(Math.random()*frontier.length)],b=terrain[j],c2=terrain[near[i][Math.floor(Math.random()*near[i].length)]];
        if(b===c.type||c2===c.type||c2===b||!fronts.has(b))continue;
        const others=fronts.get(b);if(!others.length)continue;
        for(let t=0;t<16;t++){const h=others[Math.floor(Math.random()*others.length)];if(terrain[h]!==c2||!near[j].some(n=>terrain[n]===c.type)||!near[h].some(n=>terrain[n]===b))continue;if(cycle([i,j,h],[c2,c.type,b])){moved=true;changes++;break;}}
       }
      }
     }
    }if(!changes)break;
   }
  };
  consolidate();
  // Short-range irregularity is retained; improving swaps thicken strips without templates.
  for(let k=0;k<size*[0,3,8,18][level];k++){
   const i=Math.floor(Math.random()*size),a=terrain[i];if(i===startIndex||degree(i,a)===near[i].length)continue;
   const b=terrain[near[i][Math.floor(Math.random()*near[i].length)]];if(a===b)continue;let best=-1,bestScore=.01;
   for(let n=0;n<18;n++){const j=Math.floor(Math.random()*size);if(terrain[j]!==b||degree(j,a)<1)continue;const v=score(i,j);if(v>bestScore){bestScore=v;best=j;}}
   if(best>=0)swap(i,best);
  }
  consolidate();
  if(level===3)for(let pass=0;pass<24;pass++){
   const {components}=analyse();let changed=false;
   for(const c of components){
    const oldSpan=Math.min(c.maxX-c.minX+1,c.maxY-c.minY+1);
    const thin=new Set;
    for(const i of c.cells)for(const axis of [1,width]){
     const valid=j=>j>=0&&j<size&&(axis!==1||Math.floor(j/width)===Math.floor(i/width))&&terrain[j]===c.type&&!(axis===1?(j>=width&&terrain[j-width]===c.type)||(j+width<size&&terrain[j+width]===c.type):(j%width&&terrain[j-1]===c.type)||(j%width<width-1&&terrain[j+1]===c.type));
     if(!valid(i)||valid(i-axis))continue;const run=[];for(let j=i;valid(j);j+=axis)run.push(j);if(run.length>=6)run.forEach(j=>thin.add(j));
    }
    if(c.cells.length<6||(c.blocks>0&&oldSpan>=3&&!thin.size))continue;
    const targets=new Set;for(const i of c.cells)for(const j of near[i])if(terrain[j]!==c.type)targets.add(j);
    const sources=(thin.size?[...thin]:c.cells.slice()).sort((a,b)=>degree(a,c.type)-degree(b,c.type)).slice(0,16);
    let bestI=-1,bestJ=-1,best=-3.11;
    for(const i of sources)for(const j of targets){
     if(degree(i,terrain[j])<1)continue;
     const value=score(i,j);if(value< -3.1)continue;
     const before=blocks(i)+blocks(j),a=terrain[i],b=terrain[j];terrain[i]=b;terrain[j]=a;
     const after=blocks(i)+blocks(j);let minX=width,maxX=0,minY=height,maxY=0;
     for(const k of [...c.cells.filter(k=>k!==i),j]){minX=Math.min(minX,k%width);maxX=Math.max(maxX,k%width);minY=Math.min(minY,Math.floor(k/width));maxY=Math.max(maxY,Math.floor(k/width));}
     terrain[i]=a;terrain[j]=b;const span=Math.min(maxX-minX+1,maxY-minY+1);
     if(span<=oldSpan&&after<=before&&!(thin.has(i)&&degree(j,c.type)>degree(i,c.type)))continue;const merit=value+2*(span-oldSpan);
     if(merit>best){best=merit;bestI=i;bestJ=j;}
    }if(bestI>=0){swap(bestI,bestJ);changed=true;}
   }if(!changed)break;
  }
 },

 // Additive weights are solved so a single blessing adds 10/20/30 percentage points.
 targets(buffs=[]){
  const base=[.11,.20,.18,.14,.13,.13,.11];
  const weights=base.map((p,i)=>{const lv=Math.max(0,Math.min(3,Number(buffs.find(b=>b.id==='E'+String(i+1).padStart(2,'0'))?.level||0))),d=.1*lv;return p+(d?d/(1-p-d):0);});
  const sum=weights.reduce((a,b)=>a+b,0);return weights.map(w=>w/sum);
 },
 allocate(size,probabilities){
  const raw=probabilities.map(p=>p*size),quota=raw.map(x=>Math.max(1,Math.floor(x)));let remaining=size-quota.reduce((a,b)=>a+b,0);
  while(remaining>0){let best=0;for(let k=1;k<7;k++)if(raw[k]-quota[k]>raw[best]-quota[best])best=k;quota[best]++;remaining--;}
  while(remaining<0){let best=-1;for(let k=0;k<7;k++)if(quota[k]>1&&(best<0||quota[k]-raw[k]>quota[best]-raw[best]))best=k;quota[best]--;remaining++;}return quota;
 },
 // Multi-octave value fields are suitability scores, never roulette random values.
 field(width,height,scale){
  const values=new Float64Array(width*height),smooth=t=>t*t*(3-2*t);
  for(const [factor,amplitude] of [[1,.65],[.45,.25],[.20,.10]]){
   const spacing=Math.max(2,scale*factor),gw=Math.ceil(width/spacing)+2,gh=Math.ceil(height/spacing)+2,grid=Array.from({length:gw*gh},()=>Math.random());
   const offsetX=Math.random(),offsetY=Math.random();
   for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const u=x/spacing+offsetX,v=y/spacing+offsetY,i=Math.floor(u),j=Math.floor(v),a=smooth(u-i),b=smooth(v-j);
    const value=(grid[j*gw+i]*(1-a)+grid[j*gw+i+1]*a)*(1-b)+(grid[(j+1)*gw+i]*(1-a)+grid[(j+1)*gw+i+1]*a)*b;
    values[y*width+x]+=value*amplitude;
   }
  }
  let min=Infinity,max=-Infinity;for(const v of values){min=Math.min(min,v);max=Math.max(max,v);}const range=max-min||1;
  return Array.from(values,v=>(v-min)/range);
 },
 // Enumerate each perimeter cell exactly once, including corners.
 start(width,height,rng=Math.random){
  if(width===5&&height===5)return {x:2,y:2};
  const candidates=[];
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(x===0||x===width-1||y===0||y===height-1)candidates.push({x,y});
  return candidates[Math.floor(rng()*candidates.length)];
 },
 generate(width,height,terrains,facilities,counts,partyBuffsSnapshot=[]){
  const setting=counts.find(v=>v.width===width&&v.height===height);if(!setting)throw Error('未対応のワールドサイズ');
  const size=width*height,start=this.start(width,height),startIndex=start.y*width+start.x;
  const level=id=>Math.max(0,Math.min(3,Number(partyBuffsSnapshot.find(s=>s.id===id)?.level||0)));
  const ids=terrains.map(t=>t.id),quota=this.allocate(size,this.targets(partyBuffsSnapshot));
  const span=Math.max(width,height),continental=this.field(width,height,span*.75),elevation=this.field(width,height,span*.45),temperature=this.field(width,height,span*.8),moisture=this.field(width,height,span*.5);
  const terrain=Array(size).fill(null);terrain[startIndex]='T01';quota[0]--;
  const cells=Array.from({length:size},(_,i)=>i).filter(i=>i!==startIndex);
  const sea=cells.slice().sort((a,b)=>continental[a]-continental[b]);
  for(let k=0;k<quota[4];k++)terrain[sea[k]]='T05';
  const scores=Array.from({length:7},()=>Array(size).fill(0));
  for(let i=0;i<size;i++){
   const h=elevation[i],t=temperature[i],m=moisture[i],moderate=x=>1-Math.abs(x-.5)*2;
   scores[0][i]=.45*moderate(t)+.35*moderate(m)+.20*(1-h);
   scores[1][i]=.60*m+.25*moderate(t)+.15*(1-h);
   scores[2][i]=h;
   scores[3][i]=.55*t+.45*(1-m);
   scores[5][i]=.80*(1-t)+.20*h;
   scores[6][i]=.65*m+.35*(1-h);
  }
  // Rotate the suitability competition each world so no terrain is always last.
  const order=[0,1,2,3,5,6];for(let k=order.length-1;k>0;k--){const j=Math.floor(Math.random()*(k+1));[order[k],order[j]]=[order[j],order[k]];}
  for(const type of order){const candidates=cells.filter(i=>terrain[i]===null).sort((a,b)=>scores[type][b]-scores[type][a]);for(let k=0;k<quota[type];k++)terrain[candidates[k]]=ids[type];}
  // E08 keeps exact quotas and incorporates land connectivity protection.
  this.shape(terrain,width,height,startIndex,level('E08'),true);
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
