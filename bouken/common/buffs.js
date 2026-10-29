// ver.20: 独立抽選→スタック確定→実行。A02を先頭処理、A03は開拓数閾値で発動。
window.BoukenBuffs=Object.freeze({
 level(w,id){return Math.max(0,Math.min(3,Number((w.partyBuffsSnapshot||[]).find(s=>s.id===id)?.level||0)));},
 // Stage-by-stage construction preserves lower-level regions at every boundary.
 initial(w){
  if(w.initialSupportApplied)return 0;
  const lv=this.level(w,'A11'),s=w.startIndex,x=s%w.width,y=Math.floor(s/w.width);
  const stages=[ [[-1,0],[1,0],[0,-1],[0,1]], [[-1,-1],[1,-1],[-1,1],[1,1]], [[-2,0],[2,0],[0,-2],[0,2]] ];
  const region=new Set([s]);let count=0;
  const add=i=>{region.add(i);if(!w.explored[i]){w.explored[i]=true;w.lastInitialOpenedIndex=i;count++;}};
  for(let stage=0;stage<lv;stage++){
   for(const [dx,dy] of stages[stage]){const nx=x+dx,ny=y+dy;if(nx>=0&&ny>=0&&nx<w.width&&ny<w.height)add(ny*w.width+nx);}
   while(region.size-1<(stage+1)*4){
    // Only the connected frontier is eligible. Manhattan distance, then index,
    // gives reproducible ties without additional random state in the save.
    const candidates=new Set;
    for(const i of region)for(const j of BoukenExplore.adjacent(w,i))if(!region.has(j))candidates.add(j);
    const next=[...candidates].sort((a,b)=>this.distance(w,s,a)-this.distance(w,s,b)||a-b)[0];
    if(next===undefined)break;
    add(next);
   }
  }
  w.initialSupportApplied=true;w.exploredCount=w.explored.reduce((n,v,i)=>n+(i!==s&&!!v),0);return count;
 },
 roll(w,index,rng=Math.random){const stack=[],add=(id,chance)=>{if(rng()<chance)stack.push({id,tiles:1});};let lv=this.level(w,'A02');if(lv)add('A02',[0,.02,.035,.05][lv]);lv=this.level(w,'A01');if(lv)add('A01',[0,.05,.10,.20][lv]);const terrain=Number(String(w.terrain[index]).slice(1));if(terrain>=1&&terrain<=7){const id='A'+String(terrain+3).padStart(2,'0');lv=this.level(w,id);if(lv)add(id,[0,.20,.30,.40][lv]);}lv=this.level(w,'A12');const total=w.width*w.height-1,remaining=total-w.exploredCount;if(lv&&remaining/total<=.20)add('A12',[0,.30,.40,.50][lv]);return stack;},
 execute(w,start,stack,rng=Math.random){let cursor=start,opened=0;const indices=[],effects=[];for(const entry of stack){let entryOpened=0;if(entry.id==='A02'){// 発動時の起点に隣接する未開拓マスを全て開く。順序はランダム。
 const candidates=BoukenExplore.adjacent(w,cursor).filter(i=>!w.explored[i]);while(candidates.length){const k=Math.floor(rng()*candidates.length),next=candidates.splice(k,1)[0];w.explored[next]=true;w.exploredCount++;cursor=next;indices.push(next);opened++;entryOpened++;}effects.push({id:entry.id,opened:entryOpened});continue;}
 for(let n=0;n<entry.tiles;n++){const candidates=BoukenExplore.adjacent(w,cursor).filter(i=>!w.explored[i]);if(!candidates.length){effects.push({id:entry.id,opened:entryOpened});return {opened,indices,effects,blocked:true};}const next=candidates[Math.floor(rng()*candidates.length)];w.explored[next]=true;w.exploredCount++;cursor=next;indices.push(next);opened++;entryOpened++;}effects.push({id:entry.id,opened:entryOpened});}return {opened,indices,effects,blocked:false};},
 // B01: 各開拓済みマスからマンハッタン距離内を透視。既存の透視状態は保持する。
 revealNear(w){const lv=this.level(w,'B01');if(!lv)return 0;let count=0;for(let i=0;i<w.explored.length;i++){if(!w.explored[i])continue;const x=i%w.width,y=Math.floor(i/w.width);for(let dy=-lv;dy<=lv;dy++)for(let dx=-lv;dx<=lv;dx++){if(Math.abs(dx)+Math.abs(dy)>lv)continue;const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=w.width||yy>=w.height)continue;const k=yy*w.width+xx;if(!w.explored[k]&&!w.revealed[k]){w.revealed[k]=true;w.achievementVisionCount=(w.achievementVisionCount||0)+1;count++;}}}return count;},
 // B06: 開始時にランダム起点から連結領域を広げて透視。既開拓セルを除外する。
 initialVision(w,rng=Math.random){if(w.initialVisionApplied)return 0;const lv=this.level(w,'B06');w.initialVisionApplied=true;if(!lv)return 0;const total=w.width*w.height,goal=Math.ceil(total*[0,.10,.20,.30][lv]);let pool=Array.from({length:total},(_,i)=>i).filter(i=>!w.explored[i]);if(!pool.length)return 0;let frontier=[pool[Math.floor(rng()*pool.length)]],seen=new Set(frontier),opened=0;while(frontier.length&&opened<goal){const k=Math.floor(rng()*frontier.length),i=frontier.splice(k,1)[0];if(!w.explored[i]&&!w.revealed[i]){w.revealed[i]=true;w.achievementVisionCount=(w.achievementVisionCount||0)+1;opened++;}const neighbors=BoukenExplore.adjacent(w,i).filter(j=>!seen.has(j));for(const j of neighbors){seen.add(j);frontier.push(j);}}return opened;},
 // B05: 1マス開拓するごとにLv個の未開拓セルを透視する。
 thresholdVision(w,before,after,rng=Math.random){const lv=this.level(w,'B05');if(!lv)return 0;const triggers=Math.max(0,after-before);let count=0;for(let n=0;n<triggers*lv;n++){let candidates=[];for(let i=0;i<w.explored.length;i++)if(!w.explored[i]&&!w.revealed[i])candidates.push(i);if(!candidates.length)for(let i=0;i<w.explored.length;i++)if(!w.explored[i])candidates.push(i);if(!candidates.length)break;const index=candidates[Math.floor(rng()*candidates.length)];if(!w.revealed[index]){w.revealed[index]=true;w.achievementVisionCount=(w.achievementVisionCount||0)+1;count++;}}return count;},
 // B02/B03/B04: 距離は上下左右のマンハッタン距離で統一。
 distance(w,a,b){return Math.abs(a%w.width-b%w.width)+Math.abs(Math.floor(a/w.width)-Math.floor(b/w.width));},
 detected(w,type){const id=type==='collection'?'B02':'B03',lv=this.level(w,id),range=[0,3,6,10][lv];if(!range)return [];const found=[];for(let i=0;i<w.facility.length;i++){if(!w.facility[i]||w.explored[i]||w.events[i]!==type)continue;for(let j=0;j<w.explored.length;j++){if(w.explored[j]&&this.distance(w,i,j)<=range){found.push(i);break;}}}return found;},
 guide(w){const lv=this.level(w,'B04'),range=[0,6,10,15][lv];if(!range)return null;const origin=w.player?w.player.y*w.width+w.player.x:w.startIndex;let target=-1,best=Infinity;for(let i=0;i<w.facility.length;i++){if(!w.facility[i]||w.visitedFacilities?.[i])continue;const d=this.distance(w,origin,i);if(d<=range&&d<best){best=d;target=i;}}if(target<0)return null;const dx=Math.sign(target%w.width-origin%w.width),dy=Math.sign(Math.floor(target/w.width)-Math.floor(origin/w.width));const arrows={'0,-1':'↑','1,-1':'↗','1,0':'→','1,1':'↘','0,1':'↓','-1,1':'↙','-1,0':'←','-1,-1':'↖'};return {origin,arrow:arrows[dx+','+dy]||'●'};},
 // B07: 世界全体をLv1=2、Lv2=3、Lv3=5区画ずつに分割。各区画の大きさの差は最大1マス。
 // 端数は中央に近い区画を優先し、左右対称に近づける（例: 22→4,5,4,5,4）。
 partition(length,divisions){const base=Math.floor(length/divisions),sizes=Array(divisions).fill(base);let remainder=length%divisions;const order=Array.from({length:divisions},(_,i)=>i).sort((a,b)=>Math.abs(a-(divisions-1)/2)-Math.abs(b-(divisions-1)/2)||a-b);for(let i=0;i<remainder;i++)sizes[order[i]]++;return sizes;},
 eventSense(w){const lv=this.level(w,'B07');if(!lv)return null;const divisions=[0,2,3,5][lv],widths=this.partition(w.width,divisions),heights=this.partition(w.height,divisions);const xToPart=Array(w.width),yToPart=Array(w.height);let x=0,y=0;for(let k=0;k<divisions;k++){for(let n=0;n<widths[k];n++)xToPart[x++]=k;for(let n=0;n<heights[k];n++)yToPart[y++]=k;}const parts=Array(divisions*divisions).fill(0);let count=0;for(let i=0;i<w.facility.length;i++){if(!w.facility[i]||!w.events[i]||w.visitedFacilities?.[i])continue;parts[yToPart[Math.floor(i/w.width)]*divisions+xToPart[i%w.width]]++;count++;}return {level:lv,count,divisions,widths,heights,parts};},
 // Lifetime exploration count and the last evaluated position are separate. Old worlds start at their current count without retroactive rewards.
 threshold(w,start,before,after,rng=Math.random){
  const lv=this.level(w,'A03'),interval=[0,20,15,10][lv];
  const evaluated=Number.isFinite(w.a03EvaluatedThrough)?w.a03EvaluatedThrough:Math.max(0,Number(before)||0);
  const snapshot=Math.max(evaluated,Number(after)||0);
  w.a03EvaluatedThrough=snapshot;
  const count=interval?Math.max(0,Math.floor(snapshot/interval)-Math.floor(evaluated/interval)):0;
  const stack=Array.from({length:count},()=>({id:'A03',tiles:1}));
  return {...this.execute(w,start,stack,rng),stack};
 },
 correct(w,index,cumulativeBefore=0,rng=Math.random,collectionChance=0){BoukenExplore.explore(w,index);const stack=this.roll(w,index,rng);if(collectionChance>0&&rng()<collectionChance)stack.push({id:'museum',tiles:1});const extra=this.execute(w,index,stack,rng);
 const last=extra.indices.length?extra.indices[extra.indices.length-1]:index;
 const a03=this.threshold(w,last,cumulativeBefore,cumulativeBefore+1+extra.opened,rng);
 return {stack:[...stack,...a03.stack],opened:1+extra.opened+a03.opened,extra:extra.opened+a03.opened,indices:[index,...extra.indices,...a03.indices],effects:[...extra.effects,...a03.effects]};}
});
