const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),c={console,Math:Object.create(Math),localStorage:{getItem:()=>null,setItem(){}}};c.window=c;vm.createContext(c);
for(const name of ['schema','save','worldgen','explore','buffs','progress'])vm.runInContext(fs.readFileSync(path.join(root,'common',name+'.js'),'utf8'),c);
const read=n=>JSON.parse(fs.readFileSync(path.join(root,'data',n+'.json'))),G=c.BoukenWorldGen,B=c.BoukenBuffs,E=c.BoukenExplore;
function world(n,s,lv,extra=[]){return {width:n,height:n,startIndex:s,player:{x:s%n,y:Math.floor(s/n)},terrain:Array(n*n).fill('T01'),facility:Array(n*n).fill(null),events:Array(n*n).fill(null),visitedFacilities:Array(n*n).fill(false),explored:Array.from({length:n*n},(_,i)=>i===s),revealed:Array(n*n).fill(false),partyBuffsSnapshot:[{id:'A11',level:lv},...extra],exploredCount:0};}
test('every perimeter candidate has exactly one equal probability interval, including all corners; 5x5 stays central',()=>{
 for(const n of [10,20,30]){const counts=new Map(),m=4*n-4;for(let k=0;k<m*20;k++){const p=G.start(n,n,()=>(k+.5)/(m*20));assert(p.x===0||p.x===n-1||p.y===0||p.y===n-1);const i=p.y*n+p.x;counts.set(i,(counts.get(i)||0)+1);}assert.equal(counts.size,m);assert([...counts.values()].every(v=>v===20));for(const i of [0,n-1,n*(n-1),n*n-1])assert(counts.has(i));}
 assert.equal(JSON.stringify(G.start(5,5,()=>{throw Error('no draw');})),JSON.stringify({x:2,y:2}));
});
test('A11 all cells, sizes and levels: exact new counts, connected, nested, old pattern retained, idempotent',()=>{
 for(const n of [5,10,20,30])for(let s=0;s<n*n;s++){
  let previous=[];
  for(let lv=0;lv<=3;lv++){
   const w=world(n,s,lv);assert.equal(B.initial(w),lv*4);assert.equal(w.exploredCount,lv*4);const opened=w.explored.flatMap((v,i)=>v?[i]:[]);assert.equal(opened.length,lv*4+1);assert(previous.every(i=>w.explored[i]));previous=opened;
   const seen=new Set([s]),q=[s];for(let k=0;k<q.length;k++)for(const j of E.adjacent(w,q[k]))if(w.explored[j]&&!seen.has(j)){seen.add(j);q.push(j);}assert.equal(seen.size,opened.length);
   const x=s%n,y=Math.floor(s/n);for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1],...(lv>=2?[[-1,-1],[1,-1],[-1,1],[1,1]]:[]),...(lv>=3?[[-2,0],[2,0],[0,-2],[0,2]]:[])])if(lv&&x+dx>=0&&x+dx<n&&y+dy>=0&&y+dy<n)assert(w.explored[(y+dy)*n+x+dx]);
   const bytes=JSON.stringify(w);assert.equal(B.initial(w),0);assert.equal(JSON.stringify(w),bytes);
  }
 }
});
test('real generator protects start with E08 and facility additions at every corner/edge',()=>{
 const terrains=read('terrains'),facilities=read('facilities'),counts=read('world_facility_counts');
 for(const n of [5,10,20,30])for(const r of [0,.01,.25,.49,.5,.75,.99])for(const level of [0,1,2,3]){
  let calls=0,seed=7;c.Math.random=()=>{if(calls++===0&&n!==5)return r;seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const w=G.generate(n,n,terrains,facilities,counts,[{id:'E08',level},{id:'D03',level:3},{id:'D08',level:3},{id:'D09',level:3}]);const s=w.startIndex;
  assert.equal(w.terrain[s],'T01');assert.equal(w.facility[s],null);assert(w.explored[s]);assert.equal(w.player.y*n+w.player.x,s);assert.equal(c.BoukenProgress.status(w).opened,0);assert(w.facility.filter(Boolean).length>=counts.find(v=>v.width===n).facilityCount);for(let i=0;i<n*n;i++)if(w.facility[i])assert(facilities.find(f=>f.id===w.facility[i]).allowedTerrainIds.includes(w.terrain[i]));
 }
});
test('edge initial counters, A03, B01/B05/B06, event detection/guide, movement, completion and old save round trip',()=>{
 for(const s of [0,9,90,99,4,40,49,94]){
  const w=world(10,s,3,['A03','B01','B02','B03','B04','B05','B06'].map(id=>({id,level:3})));const base=B.initial(w);assert.equal(base,12);const a=B.threshold(w,w.lastInitialOpenedIndex,9,9+base,()=>0);assert.equal(a.opened,2);assert.equal(w.exploredCount,14);
  assert.equal(B.thresholdVision(w,0,14,()=>0),42);B.revealNear(w);B.initialVision(w,()=>0);assert(w.revealed.every((v,i)=>!v||!w.explored[i]));assert.equal(B.initialVision(w),0);
  const target=E.adjacent(w,s)[0];w.facility[target]='F01';w.events[target]='collection';assert(B.guide(w));E.move(w,target);assert.equal(w.player.y*10+w.player.x,target);
  const fresh=world(10,s,0,[{id:'B02',level:3},{id:'B03',level:3}]);fresh.facility[target]='F01';fresh.events[target]='collection';assert(B.detected(fresh,'collection').includes(target));fresh.events[target]='companion';assert(B.detected(fresh,'companion').includes(target));
  assert(E.canExplore(fresh,target));E.explore(fresh,target);assert.equal(fresh.exploredCount,1);fresh.explored.fill(true);assert(c.BoukenProgress.status(fresh).allExplored);assert.equal(c.BoukenProgress.status(fresh).percent,100);
 }
 const save=c.BoukenSchema.makeInitialSave();save.world=world(10,55,2);B.initial(save.world);save.world.player={x:3,y:4};const bytes=JSON.stringify(save.world);let raw=null;c.localStorage={getItem:()=>raw,setItem:(k,v)=>{raw=v;}};c.BoukenSave.save(save);assert.equal(JSON.stringify(c.BoukenSave.load().world),bytes);
});
