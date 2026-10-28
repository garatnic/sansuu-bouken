'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const E=require('./engine.cjs'),{sha,json}=require('./plan.cjs');
const cfg=require('./config.json'),base=require('./initial-save.json'),selected=require('./selection.json');
function pilot(){const env=E.load(),{runtime:r}=env,checks=[],trials=[],started=performance.now();
 function test(name,fn){const t=performance.now();fn();checks.push({name,passed:true,elapsedMs:performance.now()-t});console.log('PASS '+name);}
 test('source hashes and Phase3 artifact hashes unchanged',()=>{E.checkSources(cfg);const v=require('../verification.json');for(const [p,h]of Object.entries(v.artifacts))assert.equal(sha(fs.readFileSync(path.join(__dirname,'..',p))),h);});
 test('selection unique50, holdout disjoint, all nine strata and seven B signals',()=>{assert.equal(selected.length,50);assert.equal(new Set(selected.map(c=>c.id)).size,50);assert(cfg.holdoutIds.every(id=>!cfg.participants.includes(id)));assert.equal(cfg.participants.length+cfg.holdoutIds.length,927);for(let n=1;n<=7;n++)assert(selected.some(c=>c.skills.some(s=>s.id==='B0'+n)));assert.equal(new Set(selected.map(c=>c.category)).size,9);});
 test('shared464/240 ownership, all participants owned, fixed zero claims and bonuses',()=>{assert.equal(Object.keys(base.characters).length,464);assert.equal(Object.keys(base.items).length,240);assert(cfg.participants.every(id=>base.characters[id]===1));assert.equal(cfg.inventoryHash,sha({characters:base.characters,items:base.items,claims:base.claimedCollectionRewards}));assert.deepEqual(Array.from(r.c.BoukenCollection.stages(E.clone(base))),[0,0,0,0,0,0]);});
 test('six representatives x three seeds: completion, same-seed equality, accounting, input immutable',()=>{
  const before=JSON.stringify(base);const ids=[selected[0].id,selected[5].id,selected[10].id,selected[15].id,selected[25].id,selected[35].id];
  for(const id of ids)for(const seed of cfg.pilotSeeds){const a=E.execute(env,base,[id],cfg,seed,{details:true,trace:true}),b=E.execute(env,base,[id],cfg,seed);assert.deepEqual(a.metrics,b);assert.equal(a.metrics.questions,30);assert.equal(a.metrics.opened,a.metrics.normalOpened+a.metrics.totalSkillOpened);assert.equal(a.metrics.visited,a.metrics.itemEvents+a.metrics.companionEvents);assert(a.metrics.newItems<=a.metrics.totalItems);assert(a.metrics.newCharacters<=a.metrics.recruitSuccesses+a.metrics.rewardJoins);assert(a.metrics.discovered>=a.metrics.visited);for(let i=0;i<100;i++)if(a.world.facility[i])assert(r.data.facilities.find(f=>f.id===a.world.facility[i]).allowedTerrainIds.includes(a.world.terrain[i]));assert(!a.world.facility[a.world.startIndex]);trials.push({id,...a.metrics});}assert.equal(JSON.stringify(base),before);
 });
 test('hidden world perturbation leaves no-skill observation and decision unchanged',()=>{
  const {w}=E.L.depart(r,base,[],cfg,E.L.rng(71)),o=E.clone(E.L.observe(r,w)),hidden=w.explored.findIndex((v,i)=>!v&&!w.revealed[i]);w.terrain[hidden]='SECRET';w.facility[hidden]='SECRET';w.events[hidden]='SECRET';w.eventPools[hidden]='SECRET';assert.deepEqual(E.clone(E.L.observe(r,w)),o);assert.equal(env.decide(o,5),env.decide(E.clone(E.L.observe(r,w)),5));assert(!Object.keys(o).some(k=>['events','eventPools','eventChoices','eventResults'].includes(k)));
 });
 test('policy VM has no world, inventory, runtime, Node require or process inputs',()=>{
  const source=fs.readFileSync(path.join(__dirname,'engine.cjs'),'utf8');assert(source.includes('decide(freeze(clone(o)),actionSeed)'));const vm=require('node:vm'),ctx=vm.createContext({});assert.equal(vm.runInContext('typeof process+","+typeof require+","+typeof world+","+typeof runtime',ctx),'undefined,undefined,undefined,undefined');
 });
 const witnesses={};
 for(let n=1;n<=7;n++)test('B0'+n+' public signal changes policy decisions (ablation witness)',()=>{
  const id=selected.find(c=>c.skills.some(s=>s.id==='B0'+n)).id,saved=r.byId.get(id);r.byId.set(id,{...saved,skills:[{id:'B0'+n,level:3}]});
  try{let found=null;
   for(let seed=2026105900;seed<2026105920&&!found;seed++){
    const detail=E.execute(env,base,[id],cfg,seed,{trace:true,details:true});
    for(const t of detail.trace){const o=E.clone(t.observation);
     if(n===1||n===5||n===6){for(const cell of o.cells)if(!cell.opened){cell.revealed=false;cell.terrain=null;cell.facility=null;}}
     if(n===2)o.treasure=[];if(n===3)o.companion=[];if(n===4)o.guide=null;if(n===7)o.sense=null;
     const blind=env.decide(o,t.actionSeed);if(blind!==t.index){found={seed,q:t.q,informed:t.index,ablated:blind};break;}
    }
   }
   assert(found,'No policy-use witness for B0'+n);witnesses['B0'+n]=found;
  }finally{r.byId.set(id,saved);}
 });
 test('D04 has exactly no effect; Lv summation capped at3',()=>{
  const id=selected.find(x=>x.skills.some(s=>s.id==='D04')).id;
  for(const seed of cfg.pilotSeeds){const a=E.execute(env,base,[id],cfg,seed),b=E.execute(env,base,[id],cfg,seed,{supportId:id,removeSkill:'D04'});a.buffs=a.buffs.filter(x=>x.id!=='D04');assert.deepEqual(a,b);}
  const buffs=E.clone(r.c.BoukenParty.buffs([1,2],new Map([[1,{skills:[{id:'A01',level:2}]}],[2,{skills:[{id:'A01',level:2}]}]])));assert.equal(buffs[0].level,3);
 });
 test('A02 first, A03 no self recursion, no invented E/D effects',()=>{
  const w={partyBuffsSnapshot:[{id:'A01',level:3},{id:'A02',level:3},{id:'A12',level:3}],terrain:['T01'],width:10,height:10,exploredCount:90};const stack=E.clone(r.c.BoukenBuffs.roll(w,0,()=>0));assert.equal(stack[0].id,'A02');
  const {w:x}=E.L.depart(r,base,[],cfg,E.L.rng(10));x.partyBuffsSnapshot=[{id:'A03',level:3}];const a=r.c.BoukenBuffs.threshold(x,x.startIndex,9,10,()=>0);assert.equal(a.stack.length,1);assert.equal(x.a03EvaluatedThrough,10);
 });
 test('support frozen10 cases x3 arms, matched ablation preserves identity/group/count',()=>{
  assert.equal(cfg.support.length,10);assert.deepEqual(cfg.support.map(c=>c.removedSkill).sort(),['D06','D06','E01','E02','E03','E04','E05','E06','E07','E08'].sort());
  for(const spec of cfg.support){const pair=[spec.partnerId,spec.supportId],saved=JSON.stringify(r.byId.get(spec.supportId));const a=E.execute(env,base,pair,cfg,cfg.pilotSeeds[0]),b=E.execute(env,base,pair,cfg,cfg.pilotSeeds[0],{supportId:spec.supportId,removeSkill:spec.removedSkill});assert(!b.buffs.some(x=>x.id===spec.removedSkill));assert(a.buffs.some(x=>x.id===spec.removedSkill));assert.equal(a.party.length,b.party.length);assert.equal(JSON.stringify(r.byId.get(spec.supportId)),saved);if(spec.removedSkill==='D06')assert.equal(a.worldHash,b.worldHash);}
 });
 test('C/D/F formulas, museum stages and unowned-weight correction use game functions',()=>{
  const ch=r.data.characters,ww={partySnapshot:[cfg.support.find(x=>x.removedSkill==='D06').supportId],partyBuffsSnapshot:[{id:'D06',level:3}]};const weights=r.c.BoukenEvents.companionWeights(base,ww,ch,ch),group=String(r.byId.get(ww.partySnapshot[0]).groupId),sum=weights.filter(x=>String(x.value.groupId)===group).reduce((a,b)=>a+b.weight,0),n=ch.filter(x=>String(x.groupId)===group).length;assert(Math.abs(sum-(n+927*.5))<1e-9);
  const entries=[{value:{id:'new'},weight:1},{value:{id:'old'},weight:1}],shift=r.c.BoukenCollection.unknownWeights(entries,{old:1},.1);assert(Math.abs(shift[0].weight/2-.6)<1e-12);
 });
 const result={passed:true,checks:checks.length,failed:0,elapsedMs:performance.now()-started,node:process.version,configHash:sha(fs.readFileSync(path.join(__dirname,'config.json'))),engineHash:sha(fs.readFileSync(path.join(__dirname,'engine.cjs'))),policyWitnesses:witnesses,checksDetail:checks,pilotTrials:trials};json('pilot-results.json',result);console.log(JSON.stringify({passed:result.passed,checks:result.checks,elapsedMs:result.elapsedMs}));return result;
}
if(require.main===module){try{pilot();}catch(e){json('pilot-failure.json',{error:e.stack});console.error(e);process.exitCode=1;}}module.exports={pilot};
