'use strict';
const assert=require('node:assert/strict'),A=require('./api.js'),O=require('./outcomes.js'),L=require('../phase2/node.cjs'),r=L.load();
const fixture=(n=100,fraction=.5)=>{const f=L.makeFixture(r,{count:n,itemFraction:fraction,claims:0,config:{...A.defaults,cumulativeExplored:1234}});f.current=f.owned.slice(0,f.slots);f.save.party=[...f.current];f.eligible=true;return f;};
(async()=>{
const f=fixture(),before=JSON.stringify(f),seeds=[40900001,40900002,40900003,40900004];
const same=await A.compare(r,f,f.current,{comparisonSeeds:seeds});assert.deepEqual(same.delta,[0,0,0,0]);assert.deepEqual(same.deltaSE,[0,0,0,0]);assert.equal(same.candidate.power,Math.round(same.candidate.metrics.opened/30*1000));
f.current=[null,null];const empty=await A.compare(r,f,[f.owned[0],null],{comparisonSeeds:seeds});assert.equal(empty.baseline.party.length,0);assert.ok(empty.baseline.metrics.opened>=30);assert.ok(empty.candidate.power>0);assert.throws(()=>A.validateAny(r,f,[99999]));assert.throws(()=>A.validateAny(r,f,[f.owned[0],f.owned[0]]));
f.current=JSON.parse(before).current;assert.equal(JSON.stringify(f),before);
// Every active skill has a fact, but the unimplemented skill is never presented as active.
for(const skill of r.data.skills){const id=skill.id;if(id==='D04')continue;const c=r.data.characters.find(c=>c.skills.some(s=>s.id===id));assert.ok(c,id);assert.ok(A.diagnose(r,[c.id]).some(x=>x.skills.includes(id)),id);}
const e08=r.data.characters.find(c=>c.skills.some(s=>s.id==='E08'));assert.ok(!A.diagnose(r,[e08.id]).some(x=>x.skills.includes('E08')&&x.text.includes('わりあい')));
const full=fixture(927,1);full.save.claimedCollectionRewards=Array.from(r.c.BoukenCollection.completed(full.save));const bytes=JSON.stringify(full),original=r.c.BoukenCollection,stages=Array.from(original.stages(full.save));
assert.deepEqual(O.assumptions(r,full.save),{emptyItems:true,emptyCharacters:true});
const trial=O.adventure(r,full.save,full.current,A.defaults,seeds[0]);assert.ok(trial.raw.every(Number.isFinite));assert.equal(r.c.BoukenCollection,original);assert.deepEqual(Array.from(original.stages(full.save)),stages);assert.equal(JSON.stringify(full),bytes);
const hypothetical=await A.compare(r,full,full.current,{comparisonSeeds:seeds});assert.equal(hypothetical.assumptions.emptyCharacters,true);assert.deepEqual(hypothetical.delta,[0,0,0,0]);assert.equal(JSON.stringify(full),bytes);
const pre=fixture(926,479/480);assert.deepEqual(O.assumptions(r,pre.save),{emptyItems:false,emptyCharacters:false});
// Noncomplete simulations must be bit-for-bit identical to the original phase2 driver.
assert.deepEqual(O.adventure(r,f.save,f.current,A.defaults,seeds[0]),L.adventure(r,f.save,f.current,A.defaults,seeds[0]));
console.log('PASS D: shared outcomes, sparse/manual party, matched seeds, power units, 66 active skills, E08 wording, complete-category shadow, claim protection, original driver equality');
})().catch(e=>{console.error(e);process.exitCode=1;});
