const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'common/worldgen.js'),'utf8');
let seed=1;const math=Object.create(Math);math.random=()=>{seed=(seed+0x6D2B79F5)|0;let t=seed;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296};
const scope={};new Function('window','Math',source)(scope,math);const gen=scope.BoukenWorldGen;
const terrains=JSON.parse(fs.readFileSync(path.join(root,'data/terrains.json'))),counts=[{width:30,height:30,facilityCount:0}],base=[.11,.20,.18,.14,.13,.13,.11];
const samples=1200,rows=[];
// Exclude the forced grass starting cell; isolate terrain generation from facility rescue.
function measure(buffs){const totals=Array(7).fill(0);for(let i=0;i<samples;i++){seed=Math.imul(i+1,0x9e3779b9);const w=gen.generate(30,30,terrains,[],counts,buffs);for(let j=0;j<w.terrain.length;j++)if(j!==w.startIndex)totals[Number(w.terrain[j].slice(1))-1]++}return totals.map(v=>v/(samples*899))}
let observed=measure([]);for(let k=0;k<7;k++)assert(Math.abs(observed[k]-base[k])<.006,`baseline T${k+1}: ${observed[k]} vs ${base[k]}`);rows.push({skill:'none',expected:base.map(v=>+(v*100).toFixed(2)),observed:observed.map(v=>+(v*100).toFixed(2))});
for(let k=0;k<7;k++)for(let lv=1;lv<=3;lv++){
 const multiplier=[1,4,7,11][lv],denominator=1+base[k]*(multiplier-1),expected=base.map((v,j)=>v*(j===k?multiplier:1)/denominator);observed=measure([{id:'E'+String(k+1).padStart(2,'0'),level:lv}]);
 for(let j=0;j<7;j++)assert(Math.abs(observed[j]-expected[j])<.006,`E${k+1} Lv${lv} T${j+1}: ${observed[j]} vs ${expected[j]}`);
 rows.push({skill:`E0${k+1} Lv${lv}`,expected:+(expected[k]*100).toFixed(2),observed:+(observed[k]*100).toFixed(2)});
}
// Multiple terrain buffs must normalize together, rather than overwrite one another.
const observedMixed=measure([{id:'E01',level:2},{id:'E05',level:3}]),mix=base.map((v,k)=>v*(k===0?7:k===4?11:1)),sum=mix.reduce((a,b)=>a+b,0);for(let k=0;k<7;k++)assert(Math.abs(observedMixed[k]-mix[k]/sum)<.006);
console.log(JSON.stringify(rows));console.log('PASS: 1200 worlds per condition; all 7 terrains, all 21 skill/level conditions and mixed buffs match normalized expected rates within 0.6 percentage points; starting-cell/facility overrides excluded');
