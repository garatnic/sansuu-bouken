const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const ctx={window:{}};vm.createContext(ctx);for(const f of ['explore','buffs']){vm.runInContext(fs.readFileSync(path.join(__dirname,'../common/'+f+'.js'),'utf8'),ctx);ctx['Bouken'+(f==='buffs'?'Buffs':'Explore')]=ctx.window['Bouken'+(f==='buffs'?'Buffs':'Explore')];}
const B=ctx.BoukenBuffs,rng=()=>.99;
function world(skills=[{id:'A03',level:3}]){return {width:30,height:30,startIndex:465,terrain:Array(900).fill('T01'),explored:Array.from({length:900},(_,i)=>i===465),revealed:Array(900).fill(false),exploredCount:0,partyBuffsSnapshot:skills};}
// Multiple crossings -> A03 itself crosses another threshold, carried into the next batch.
let w=world();let a=B.threshold(w,465,9,29,rng);assert.equal(a.opened,2);assert.equal(w.a03EvaluatedThrough,29);
w=JSON.parse(JSON.stringify(w));a=B.threshold(w,a.indices.at(-1),31,32,rng);assert.equal(a.opened,1);assert.equal(w.a03EvaluatedThrough,32);
a=B.threshold(w,a.indices.at(-1),33,34,rng);assert.equal(a.opened,0);
// A11 initial support is eligible; starting square excluded; cumulative total spans worlds.
w=world([{id:'A03',level:3},{id:'A11',level:3}]);const n=B.initial(w);assert.equal(n,12);a=B.threshold(w,w.lastInitialOpenedIndex,9,9+n,rng);assert.equal(a.opened,2);assert.equal(w.exploredCount,14);assert.equal(B.initial(w),0);
// Old saves do not replay all historical thresholds.
w=world();assert.equal(B.threshold(w,465,105,106,rng).opened,0);
// Normal correct() evaluates once; returned count includes all opened cells.
w=world();a=B.correct(w,466,9,rng);assert.equal(a.opened,2);assert.equal(w.exploredCount,2);assert.equal(w.a03EvaluatedThrough,10);
// Every level's interval; no A03; fully explored map.
for(const [level,interval] of [[1,20],[2,15],[3,10]]){w=world([{id:'A03',level}]);assert.equal(B.threshold(w,465,interval-1,interval,rng).opened,1);}
w=world([]);assert.equal(B.threshold(w,465,0,100,rng).opened,0);
w=world();w.explored.fill(true);assert.equal(B.threshold(w,465,9,10,rng).opened,0);
console.log('A03 threshold carryover, initial support, persistence, legacy and boundary tests passed');
