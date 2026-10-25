'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),E=require('./engine.cjs'),cfg=require('./config.json');
const r=E.load(),{c,data}=r;let passed=0;function test(name,fn){fn();passed++;console.log('PASS',name);}
const clean=x=>{x=JSON.parse(JSON.stringify(x));delete x.createdAt;return x;};
test('67 master skills and no browser storage',()=>{assert.equal(data.skills.length,67);assert.equal(c.localStorage,undefined);assert.equal(c.document,undefined);});
test('same-ID level sum caps at 3',()=>assert.equal(c.BoukenParty.buffs([1,2],new Map([[1,{skills:[{id:'A01',level:2}]}],[2,{skills:[{id:'A01',level:2}]}]]))[0].level,3));
test('departure equals current worldcreate.html execution block',()=>{
 const f=E.fixture(r,500,cfg),party=f.owned.slice(0,f.slots),seed=1234,actual=E.depart(r,f.save,party,cfg,E.rng(seed));
 const html=fs.readFileSync(path.resolve(__dirname,'../../worldcreate.html'),'utf8');
 const block=html.slice(html.indexOf('const world=BoukenWorldGen.generate'),html.indexOf("location.href='world.html';}catch",html.indexOf('const world=BoukenWorldGen.generate')));
 assert.ok(block.endsWith('BoukenSave.save(current);'));
 c.current=JSON.parse(JSON.stringify(f.save));c.n=cfg.size;c.terrains=data.terrains;c.facilities=data.facilities;c.counts=data.world_facility_counts;c.characters=data.characters;c.party=party;c.partyBuffs=c.BoukenParty.buffs(party,r.byId);c.departureNumber=3;c.Math.random=E.rng(seed);c.BoukenSave={save:()=>{}};c.BoukenAchievements={departure:()=>{},state:s=>(s.achievements??={})};
 vm.runInContext('{'+block+'}',c);assert.deepEqual(clean(actual.w),clean(c.current.world));assert.equal(actual.save.records.totalExplored,c.current.records.totalExplored);delete c.BoukenAchievements;
});
test('seed repeat, input immutability, full clear + reward, claims frozen',()=>{
 const f=E.fixture(r,100,cfg),before=JSON.stringify(f.save),p=f.owned.slice(0,f.slots),a=E.adventure(r,f.save,p,cfg,11),b=E.adventure(r,f.save,p,cfg,11);assert.deepEqual(a,b);assert.equal(JSON.stringify(f.save),before);assert.equal(a.final.opened,99);assert.equal(a.final.rewardJoins,1);assert.ok(a.claimsUnchanged);assert.ok(a.qClear<=99);
});
test('correct turn equals current world.html transaction core',()=>{
 const f=E.fixture(r,500,cfg),party=f.owned.slice(0,5),state=E.depart(r,f.save,party,cfg,E.rng(14)),w=state.w,save=state.save;
 const actualSave=JSON.parse(JSON.stringify(save)),actualW=actualSave.world,index=E.observe(r,w).cells.find(x=>x.canExplore).index;
 const html=fs.readFileSync(path.resolve(__dirname,'../../world.html'),'utf8'),start=html.indexOf('const visionBefore=w.exploredCount;'),end=html.indexOf('const result=BoukenProgress.recordExplore(save,w,buffResult.opened,characters);',start)+'const result=BoukenProgress.recordExplore(save,w,buffResult.opened,characters);'.length;
 const code=html.slice(start,end);assert.ok(code.includes('BoukenBuffs.correct'));
 Object.assign(c,{save:actualSave,w:actualW,index,pending:{wrong:0},characters:data.characters,BoukenAchievements:{action:()=>{},event:()=>{}}});c.Math.random=E.rng(555);
 vm.runInContext('{'+code+'}',c);E.turn(r,save,w,index,E.rng(555));delete c.BoukenAchievements;
 delete actualW.lastBuffOpened;assert.deepEqual(clean(w),clean(actualW));assert.deepEqual(save.records,actualSave.records);
});
test('all 67 isolated skills can run, including D04 no effect',()=>{
 const f=E.fixture(r,927,cfg),fakeId=f.owned[0],old=r.byId.get(fakeId);let baseline;
 r.byId.set(fakeId,{...old,skills:[]});baseline=E.adventure(r,f.save,[fakeId],cfg,99);
 for(const skill of data.skills){r.byId.set(fakeId,{...old,skills:[{id:skill.id,level:3}]});const a=E.adventure(r,f.save,[fakeId],cfg,99);assert.equal(a.final.opened,99);assert.ok(a.claimsUnchanged);if(skill.id==='D04')assert.deepEqual(a,baseline);}
 r.byId.set(fakeId,old);
});
test('observation cannot expose unknown terrain/facility/event',()=>{
 const f=E.fixture(r,30,cfg),{w}=E.depart(r,f.save,[],cfg,E.rng(15)),a=E.observe(r,w),i=w.explored.findIndex(v=>!v);w.terrain[i]='FAKE';w.facility[i]='F99';w.events[i]='companion';const b=E.observe(r,w);assert.deepEqual(a,b);assert.equal(E.policy(a,E.rng(42)),E.policy(b,E.rng(42)));assert.ok(!('events' in b));
});
test('B04 passes arrow only and B07 counts only, not hidden targets',()=>{const f=E.fixture(r,30,cfg),{w}=E.depart(r,f.save,[],cfg,E.rng(13));w.partyBuffsSnapshot=[{id:'B04',level:3},{id:'B07',level:3}];const o=E.observe(r,w);if(o.guide)assert.deepEqual(Object.keys(o.guide).sort(),['arrow','origin']);assert.ok(!('targets' in o.sense));});
test('terrain blessings compete through actual generator normalization',()=>{const a=c.BoukenWorldGen.targets([{id:'E01',level:3}]),b=c.BoukenWorldGen.targets([{id:'E01',level:3},{id:'E02',level:3}]);assert.ok(a[0]>b[0]);assert.ok(b[1]>a[1]);});
function entries(buffs,save){const w={explored:[true],facility:['F01'],visitedFacilities:[false],events:['collection'],partyBuffsSnapshot:buffs};let weights;c.BoukenEvents.prepare.call({...c.BoukenEvents,weighted:e=>{weights=e;return e[0].value;}},save,w,0,data.facilities,data.characters,data.collection_items,()=>0);return weights;}
test('C04 and collectors multiply; different collectors compete',()=>{const s=c.BoukenSchema.makeInitialSave(),a=entries([{id:'C05',level:3}],s),b=entries([{id:'C05',level:3},{id:'C06',level:3}],s),x=entries([{id:'C04',level:3},{id:'C05',level:3}],s);const p=e=>e.filter(x=>x.value.groupId==='01').reduce((s,x)=>s+x.weight,0)/e.reduce((s,x)=>s+x.weight,0);assert.ok(p(a)>p(b));assert.equal(x[0].weight,775);});
test('D05 + D06 use additive original-pool group correction',()=>{const s=c.BoukenSchema.makeInitialSave(),pool=data.characters.slice(0,40),party=[pool[0].id],w={partySnapshot:party,partyBuffsSnapshot:[{id:'D05',level:3},{id:'D06',level:3}]};s.characters[pool[0].id]=1;const entries=c.BoukenEvents.companionWeights(s,w,pool,data.characters),group=pool[0].groupId,n=pool.filter(x=>x.groupId===group).length;assert.equal(entries[0].weight,1+pool.length*.5/n);});
test('facility group boosts add facilities',()=>{const g=b=>{c.Math.random=E.rng(66);return c.BoukenWorldGen.generate(10,10,data.terrains,data.facilities,data.world_facility_counts,b);};const base=g([]),boost=g(['D03','D08','D09'].map(id=>({id,level:3})));assert.equal(boost.facility.filter(Boolean).length,base.facility.filter(Boolean).length+3);});
test('C01/D01 compete and cancel at a 50:50 facility',()=>{const f={...data.facilities[0],eventWeightsPercent:{companion:50,collection:50},companionPoolMode:'all_uniform',allowedTerrainIds:data.terrains.map(t=>t.id),generationWeightPercent:100};const g=b=>{c.Math.random=()=>.3;const w=c.BoukenWorldGen.generate(10,10,data.terrains,[f],data.world_facility_counts,b);return w.events.filter(Boolean);};assert.deepEqual(Array.from(g([])),['companion','companion','companion']);assert.deepEqual(Array.from(g([{id:'C01',level:3}])),['collection','collection','collection']);assert.deepEqual(Array.from(g([{id:'D01',level:3}])),Array.from(g([])));assert.deepEqual(Array.from(g([{id:'C01',level:3},{id:'D01',level:3}])),Array.from(g([])));});
test('pinned runtime/master blob hashes unchanged',()=>{const crypto=require('node:crypto'),m=require('./source-manifest.json');for(const [p,sha]of Object.entries(m.gitBlobs)){const b=fs.readFileSync(path.resolve(__dirname,'../..',p.replace(/^bouken\//,'')));const hash=crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');assert.equal(hash,sha,p);}});
test('reward idempotence and unclaimed completion gives no stage',()=>{const f=E.fixture(r,100,cfg),{save,w}=E.depart(r,f.save,[],cfg,E.rng(2));w.explored.fill(true);const before=Object.values(save.characters).reduce((s,x)=>s+x,0);c.BoukenProgress.recordMilestones(save,w,undefined,data.characters);c.BoukenProgress.recordMilestones(save,w,undefined,data.characters);assert.equal(Object.values(save.characters).reduce((s,x)=>s+x,0),before+1);save.claimedCollectionRewards=[];assert.deepEqual(Array.from(c.BoukenCollection.stages(save)),[0,0,0,0,0,0]);});
test('A02 first can block downstream path instead of fixed bonus',()=>{const state=()=>{const w={width:5,height:5,terrain:Array(25).fill('T01'),startIndex:0,explored:Array(25).fill(true)};for(const i of [16,18,11,6,1])w.explored[i]=false;w.exploredCount=19;return w;};const tail=['A01','A04','A12','museum'].map(id=>({id,tiles:1}));assert.equal(c.BoukenBuffs.execute(state(),17,tail,()=>0).opened,4);assert.equal(c.BoukenBuffs.execute(state(),17,[{id:'A02',tiles:1},...tail],()=>0).opened,2);});
test('balanced penalizes weak field; 70/30 formula',()=>{assert.ok(E.objective([50,50,50,50],0)>E.objective([90,90,90,5],0));assert.equal(E.objective([50,50,50,50],1),50);});
console.log(JSON.stringify({passed}));
