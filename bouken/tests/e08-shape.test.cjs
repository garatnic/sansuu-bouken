const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{performance}=require('perf_hooks'),cp=require('child_process');
const root=path.resolve(__dirname,'..'),data=n=>JSON.parse(fs.readFileSync(path.join(root,'data',n+'.json')));
let seed=1;const math=Object.create(Math);math.random=()=>{seed=(seed+0x6D2B79F5)|0;let t=seed;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296};
const scope={};new Function('window','Math',fs.readFileSync(path.join(root,'common/worldgen.js'),'utf8'))(scope,math);const gen=scope.BoukenWorldGen;
const terrains=data('terrains'),facilities=data('facilities'),counts=data('world_facility_counts');
function metrics(w){const n=w.terrain.length,near=i=>{const a=[];if(i%w.width)a.push(i-1);if(i%w.width<w.width-1)a.push(i+1);if(i>=w.width)a.push(i-w.width);if(i+w.width<n)a.push(i+w.width);return a},seen=new Set,totals=Array(7).fill(0);let same=0,edges=0,components=0,isolated=0,under6=0,under12=0,max=0,thin=0,land=0,maxLand=0;
 for(let i=0;i<n;i++){const t=w.terrain[i];totals[Number(t.slice(1))-1]++;for(const j of near(i))if(j>i){edges++;same+=w.terrain[j]===t}if(!seen.has(i)){components++;const q=[i];seen.add(i);for(let k=0;k<q.length;k++)for(const j of near(q[k]))if(!seen.has(j)&&w.terrain[j]===t){seen.add(j);q.push(j)}isolated+=q.length<3;under6+=q.length<6;under12+=q.length<12;max=Math.max(max,q.length)}
  for(const axis of [1,w.width]){const cross=axis===1?w.width:1;const valid=j=>j>=0&&j<n&&(axis!==1||Math.floor(j/w.width)===Math.floor(i/w.width))&&w.terrain[j]===t&&!(axis===1?(j>=w.width&&w.terrain[j-cross]===t)||(j+w.width<n&&w.terrain[j+cross]===t):(j%w.width&&w.terrain[j-1]===t)||(j%w.width<w.width-1&&w.terrain[j+1]===t));if(!valid(i)||valid(i-axis))continue;let length=0;for(let j=i;valid(j);j+=axis)length++;if(length>=6)thin++;}
 }
 seen.clear();let landComponents=0;for(let i=0;i<n;i++)if(w.terrain[i]!=='T05'){land++;if(seen.has(i))continue;landComponents++;const q=[i];seen.add(i);for(let k=0;k<q.length;k++)for(const j of near(q[k]))if(!seen.has(j)&&w.terrain[j]!=='T05'){seen.add(j);q.push(j)}maxLand=Math.max(maxLand,q.length)}
 return {occupancy:totals.map(v=>v/n*100),adjacency:same/edges*100,components,isolated,under6,under12,max,thin,landComponents,landConnected:maxLand/land*100};}
const samples=Number(process.env.E08_SAMPLES||1000),results=[],pictures=[];
const scenarios=[['Lv0',[]],['Lv1',[{id:'E08',level:1}]],['Lv2',[{id:'E08',level:2}]],['Lv3',[{id:'E08',level:3}]],['E01 Lv3',[{id:'E01',level:3}]],['E01+E08 Lv3',[{id:'E01',level:3},{id:'E08',level:3}]],['E05 Lv3',[{id:'E05',level:3}]],['E05+E08 Lv3',[{id:'E05',level:3},{id:'E08',level:3}]]];
for(const [label,buffs] of scenarios){const sums={};let maxMs=0;
 for(let i=0;i<samples;i++){seed=Math.imul(i+1,0x9e3779b9);const t=performance.now(),w=gen.generate(30,30,terrains,facilities,counts,buffs),ms=performance.now()-t;const m=metrics(w);maxMs=Math.max(maxMs,ms);for(const [k,v] of Object.entries({...m,ms})){if(Array.isArray(v)){sums[k]??=Array(7).fill(0);v.forEach((x,k2)=>sums[k][k2]+=x)}else sums[k]=(sums[k]||0)+v}
  assert.equal(w.terrain[w.startIndex],'T01');assert.equal(w.facility.filter(Boolean).length,30);for(let j=0;j<900;j++)if(w.facility[j])assert(facilities.find(f=>f.id===w.facility[j]).allowedTerrainIds.includes(w.terrain[j]));
  if(i<3&&/^Lv/.test(label))pictures.push({label,seed:i+1,terrain:w.terrain});
 }
 const avg=Object.fromEntries(Object.entries(sums).map(([k,v])=>[k,Array.isArray(v)?v.map(x=>x/samples):v/samples]));results.push({label,...avg,maxMs});console.log(JSON.stringify(results.at(-1)));
}
// Exact area conservation, protected start and land connectivity at the shape phase.
for(let i=1;i<=Math.min(samples,100);i++)for(let lv=1;lv<=3;lv++){
 seed=Math.imul(i,0x9e3779b9);const w=gen.generate(30,30,terrains,facilities,[{width:30,height:30,facilityCount:0}],[{id:'E05',level:3}]),before=metrics(w),copy=w.terrain.slice();gen.shape(copy,30,30,w.startIndex,lv,true);const after=metrics({...w,terrain:copy});assert.deepEqual(before.occupancy,after.occupancy);assert(after.landComponents<=before.landComponents);assert.equal(copy[w.startIndex],'T01');
}
for(let lv=1;lv<=3;lv++){assert(results[lv].adjacency>results[lv-1].adjacency);assert(results[lv].components<results[lv-1].components);for(let t=0;t<7;t++)assert(Math.abs(results[lv].occupancy[t]-results[0].occupancy[t])<.1);}
assert(results[3].isolated<1.5);assert(results[3].under12<3);assert(results[3].thin<.5);assert(results[3].max>=results[0].max*.95);
assert(Math.abs(results[4].occupancy[0]-results[5].occupancy[0])<.1);
for(const vertical of [false,true])for(const length of [12,18,24]){
 const terrain=Array(900).fill('T01');for(let k=0;k<length;k++)terrain[vertical?(k+2)*30+8:8*30+k+2]='T02';seed=length;gen.shape(terrain,30,30,465,3);const pts=terrain.map((t,i)=>t==='T02'?i:-1).filter(i=>i>=0),xs=pts.map(i=>i%30),ys=pts.map(i=>Math.floor(i/30));assert.equal(pts.length,length);assert(Math.max(...xs)-Math.min(...xs)>=2&&Math.max(...ys)-Math.min(...ys)>=2,'straight region must expand in both axes');assert.equal(metrics({terrain,width:30}).thin,0,'long single-width strips must be repaired');
}
const output=process.env.E08_REPORT;if(output)fs.writeFileSync(output,JSON.stringify({samples,results,pictures},null,2));
console.log('PASS: generation/facility invariants; exact area conservation and no additional land components during shaping');
