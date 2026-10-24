const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert/strict'),cp=require('child_process');
const root=path.resolve(__dirname,'..');const data=n=>JSON.parse(fs.readFileSync(path.join(root,'data',n+'.json')));
const terrains=data('terrains'),facilities=data('facilities'),counts=data('world_facility_counts');
let seed=1;const math=Object.create(Math);math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
function load(source){const c={};new Function('window','Math',source)(c,math);return c.BoukenWorldGen}
const source=fs.readFileSync(path.join(root,'common/worldgen.js'),'utf8'),gen=load(source);
function world(n,buffs=[],s=1){seed=s;return gen.generate(n,n,terrains,facilities,counts,buffs)}
const buff=(id,level)=>({id,level});
function metrics(w){let same=0,edges=0,land=0,largest=0;const seen=new Set;for(let i=0;i<w.terrain.length;i++){
 const ns=[];if(i%w.width<w.width-1)ns.push(i+1);if(i+w.width<w.terrain.length)ns.push(i+w.width);for(const j of ns){edges++;if(w.terrain[i]===w.terrain[j])same++}
 if(w.terrain[i]==='T05')continue;land++;if(seen.has(i))continue;let component=0,stack=[i];seen.add(i);while(stack.length){const j=stack.pop();component++;const near=[];if(j%w.width)near.push(j-1);if(j%w.width<w.width-1)near.push(j+1);if(j>=w.width)near.push(j-w.width);if(j+w.width<w.terrain.length)near.push(j+w.width);for(const k of near)if(w.terrain[k]!=='T05'&&!seen.has(k)){seen.add(k);stack.push(k)}}largest=Math.max(largest,component);
 }return {same:same/edges,connected:largest/land,land:land/w.terrain.length};}
// Explicit zero levels and missing skills use the same new unbiased generator.
for(const n of [5,10,20,30])for(let s=1;s<=15;s++){
 const a=world(n,[],s),b=world(n,Array.from({length:8},(_,i)=>buff('E'+String(i+1).padStart(2,'0'),0)),s);
 for(const key of ['terrain','facility','events','eventPools','startIndex','explored'])assert.equal(JSON.stringify(a[key]),JSON.stringify(b[key]),key);
}
const samples=100,rows=[];
for(let k=1;k<=8;k++){
 const id='E'+String(k).padStart(2,'0'),values=[];
 for(let lv=0;lv<=3;lv++){let sum=0;for(let s=1;s<=samples;s++){const w=world(30,lv?[buff(id,lv)]:[],s),m=metrics(w);sum+=k<=7?w.terrain.filter(t=>t==='T'+String(k).padStart(2,'0')).length/w.terrain.length:k===8?m.same:m.connected}values.push(sum/samples)}
 for(let lv=1;lv<=3;lv++)assert(values[lv]>values[lv-1],`${id} must increase at level ${lv}: ${values}`);rows.push({id,values:values.map(v=>+(100*v).toFixed(2))});
}
console.log(JSON.stringify(rows));
// Each supported size, all levels and mixed effects preserve facility restrictions, snapshots and saveability.
for(const n of [5,10,20,30])for(let s=1;s<=25;s++)for(let lv=1;lv<=3;lv++){
 const buffs=Array.from({length:8},(_,i)=>buff('E'+String(i+1).padStart(2,'0'),lv)).concat([buff('D03',3),buff('D08',3),buff('D09',3),buff('C01',3),buff('D01',2)]),original=JSON.stringify(buffs),w=world(n,buffs,s);
 assert.equal(JSON.stringify(buffs),original);assert.equal(w.terrain.length,n*n);assert(w.terrain.every(t=>terrains.some(v=>v.id===t)));assert.equal(w.terrain[w.startIndex],'T01');assert.equal(w.facility[w.startIndex],null);assert.equal(w.explored.filter(Boolean).length,1);assert.equal(w.exploredCount,0);
 for(let i=0;i<w.facility.length;i++)if(w.facility[i]){const f=facilities.find(f=>f.id===w.facility[i]);assert(f.allowedTerrainIds.includes(w.terrain[i]));assert(['companion','collection'].includes(w.events[i]));if(w.events[i]==='companion')assert(['all','human','monster','danger'].includes(w.eventPools[i]))}
 assert.deepEqual(JSON.parse(JSON.stringify(w)).terrain,Array.from(w.terrain));
}
assert(!fs.readFileSync(path.join(root,'world.html'),'utf8').includes('id="selected"'));
console.log('PASS: zero-level equivalence, all E levels monotonic across 100 seeded worlds, all sizes mixed effects and facility constraints, save round-trip, no map-bottom message outlet');
