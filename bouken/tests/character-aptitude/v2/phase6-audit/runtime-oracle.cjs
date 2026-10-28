'use strict';
// Pure function checks against current runtime. No world generation, turns, RNG adventures or replays.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const P=__dirname,ROOT=path.resolve(P,'../../../..'),context=vm.createContext({window:{}});
for(const n of ['worldgen','events','buffs'])vm.runInContext(fs.readFileSync(path.join(ROOT,'common',n+'.js'),'utf8'),context);
const w=context.window,load=p=>JSON.parse(fs.readFileSync(path.join(P,p),'utf8')),characters=load('../../../../data/characters.json'),save=load('../../phase4/initial-save.json'),observed=load('d06-observed.json');
const targets=[];for(let n=1;n<=7;n++)for(let level=1;level<=3;level++)targets.push({id:'E0'+n,level,probabilities:Array.from(w.BoukenWorldGen.targets([{id:'E0'+n,level}]))});
const combined=[];const supp=fs.readFileSync(path.join(P,'../../phase4/support-adventures.csv'),'utf8');const U=require('../../phase5a/analyze.cjs');for(const r of U.parseCsv(supp))if(r.arm==='with-support'&&/^E0[1-7]-/.test(r.caseId)){if(combined.some(x=>x.caseId===r.caseId))continue;const buffs=JSON.parse(r.buffs),id=r.removedSkill;combined.push({caseId:r.caseId,on:Array.from(w.BoukenWorldGen.targets(buffs)),off:Array.from(w.BoukenWorldGen.targets(buffs.filter(s=>s.id!==id)))});}
const d06=[];for(const c of observed)for(const pool of ['all','human','monster'])for(let level=1;level<=3;level++)for(let d5=0;d5<=3;d5++){
 const candidates=pool==='all'?characters:characters.filter(c=>c.areas?.[pool]===1),partyGroups=new Set(c.party.map(id=>String(characters.find(c=>c.id===id).groupId))),weights=w.BoukenEvents.companionWeights(save,{partySnapshot:c.party,partyBuffsSnapshot:[{id:'D06',level},{id:'D05',level:d5}]},candidates,characters),total=weights.reduce((n,x)=>n+x.weight,0),target=weights.filter(x=>partyGroups.has(String(x.value.groupId))).reduce((n,x)=>n+x.weight,0);d06.push({caseId:c.caseId,pool,D06Level:level,D05Level:d5,targetProbability:target/total});
}
const a12=[];for(let level=1;level<=3;level++)for(const opened of [79,80,98,99])a12.push({level,opened,eligible:w.BoukenBuffs.roll({width:10,height:10,exploredCount:opened,terrain:['T01'],partyBuffsSnapshot:[{id:'A12',level}]},0,()=>0).some(s=>s.id==='A12')});
process.stdout.write(JSON.stringify({targets,combined,d06,a12,additionalAdventures:0}));
