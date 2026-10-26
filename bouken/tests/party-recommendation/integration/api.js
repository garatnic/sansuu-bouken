(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('../phase2/core.js'),require('./outcomes.js'));else root.PartyExperiment=factory(root.BoukenPartyLab,root.PartyOutcomes);})(typeof globalThis!=='undefined'?globalThis:this,function(L,O){
'use strict';
const modes=['random','balanced','explore','treasure','companion','map'],labels=['ランダム','おまかせ','どんどん開拓','お宝集め','仲間集め','マップ探索'];
const key=p=>p.filter(x=>x!==null).slice().sort((a,b)=>a-b).join(',');
const defaults={size:10,budget:30,targetGroup:'04',searchSeed:262501,trainSeedStart:26251001,referenceSeedStart:26252001,referencePartySeed:26253001,references:12,referenceTrials:2,anchorTrials:8,initialTrials:4,finalTrials:32,candidateLimit:60,randomCandidates:20,timeLimitMs:10000,qualityRatio:.9,specialistRatio:.9,selectionSeedStart:40820001,bankLimit:8};
function snapshot(runtime,raw){
 const d=typeof raw==='string'?JSON.parse(raw):L.clone(raw),{c,data,byId}=runtime;
 if(!d||d.schemaVersion!==c.BoukenSchema.version)throw Error('セーブ形式が一致しません');
 function inventory(value,allowed,label){if(!value||typeof value!=='object'||Array.isArray(value))throw Error(label+'の形式が不正です');const out={};for(const [id,n]of Object.entries(value)){if(!Number.isSafeInteger(n)||n<0||!allowed.has(String(id)))throw Error(label+'に不明なIDや個数があります');if(n>0)out[id]=n;}return out;}
 const chars=inventory(d.characters,new Set([...byId.keys()].map(String)),'仲間'),items=inventory(d.items,new Set(data.collection_items.map(x=>String(x.id))),'コレクション');
 const save=c.BoukenSchema.makeInitialSave();save.characters=chars;save.items=items;
 for(const name of ['worldsStarted','completedWorlds']){const n=d[name]??0;if(!Number.isSafeInteger(n)||n<0)throw Error('進行記録が不正です');save[name]=n;}
 const total=d.records?.totalExplored??0;if(!Number.isSafeInteger(total)||total<0)throw Error('開拓記録が不正です');save.records.totalExplored=total;
 if(d.tutorialStory)save.tutorialStory=L.clone(d.tutorialStory);else delete save.tutorialStory;
 if(d.collectionClaimsVersion===1){save.collectionClaimsVersion=1;save.claimedCollectionRewards=L.clone(d.claimedCollectionRewards||[]);}else{delete save.collectionClaimsVersion;delete save.claimedCollectionRewards;}
 if(d.collectionLegacyItems)save.collectionLegacyItems=L.clone(d.collectionLegacyItems);
 if(!Array.isArray(save.claimedCollectionRewards||[])||!Array.isArray(save.collectionLegacyItems||[]))throw Error('ボーナス記録が不正です');
 c.BoukenSchema.normalizeSave(save);c.BoukenCollection.prepare(save);
 const complete=new Set(c.BoukenCollection.completed(save));if(save.claimedCollectionRewards.some(id=>!complete.has(id)))throw Error('未完成の受取済みボーナスがあります');
 const owned=Object.keys(chars).map(Number),slots=c.BoukenParty.capacity(owned.length),party=Array.from(c.BoukenParty.normalize(d.party||[],owned,slots));save.party=[...party];
 return {save:L.clone(save),owned,slots,current:party,eligible:owned.length>0&&save.worldsStarted>=2&&!c.BoukenProgress.tutorialLocked(d),reason:!owned.length?'仲間がいません。サンプル条件でためせます。':(save.worldsStarted<2||c.BoukenProgress.tutorialLocked(d))?'この検証はチュートリアル後の新しい通常ワールドが対象です。':null};
}
function validate(runtime,input,party,locked=[]){if(!input.eligible&&input.eligible!==undefined)throw Error(input.reason);if(!Number.isInteger(input.slots)||input.slots<1||input.slots>runtime.c.BoukenParty.capacity(input.owned.length))throw Error('編成枠が不正です');if(new Set(input.owned).size!==input.owned.length||input.owned.some(id=>!runtime.byId.has(id)||!(input.save.characters[id]>0)))throw Error('所有仲間が不正です');if(new Set(locked).size!==locked.length||locked.length>input.slots||locked.some(id=>!input.owned.includes(id)))throw Error('固定条件が不正です');if(party&&(party.length!==input.slots||new Set(party).size!==party.length||party.some(id=>!input.owned.includes(id))||locked.some(id=>!party.includes(id))))throw Error('候補が所有・枠・固定条件を満たしません');}
function arrange(input,ids,locked,current){const result=Array(input.slots).fill(null),fixed=new Set(locked);for(let i=0;i<input.slots;i++)if(fixed.has(current[i]))result[i]=current[i];if(result.filter(x=>x!==null).length!==locked.length)throw Error('固定仲間が表示中の編成にいません');const free=ids.filter(id=>!fixed.has(id));let j=0;for(let i=0;i<result.length;i++)if(result[i]===null)result[i]=free[j++];return result;}
function randomParty(runtime,input,locked,current,random){validate(runtime,input,null,locked);const free=L.shuffle(input.owned.filter(id=>!locked.includes(id)),random);const party=arrange(input,free,locked,current);validate(runtime,input,party,locked);return party;}
function randomOther(runtime,input,locked,current,seen,random){validate(runtime,input,null,locked);if(current.every(id=>id!==null))validate(runtime,input,current,locked);if(locked.length===input.slots)return {status:'locked',party:[...current]};const free=input.owned.filter(id=>!locked.includes(id)),need=input.slots-locked.length;if(free.length===need)return {status:'single',party:[...current]};let fallback;for(let n=0;n<256;n++){const party=randomParty(runtime,input,locked,current,random);if(key(party)===key(current))continue;fallback=party;if(!seen.has(key(party)))return {status:'new',party};}
 // For small candidate spaces exhaustively establish whether any unseen set remains.
 const combinations=(n,k)=>{let v=1;for(let i=1;i<=k;i++)v=v*(n-i+1)/i;return v;};
 if(combinations(free.length,need)<=10000){const fresh=[],alternatives=[];function visit(at,p){if(p.length===need){const party=arrange(input,p,locked,current);if(key(party)!==key(current)){alternatives.push(party);if(!seen.has(key(party)))fresh.push(party);}return;}for(let i=at;i<=free.length-(need-p.length);i++)visit(i+1,[...p,free[i]]);}visit(0,[]);if(fresh.length)return {status:'new',party:fresh[Math.floor(random()*fresh.length)]};return {status:'cycled',party:alternatives[Math.floor(random()*alternatives.length)]};}
 if(!fallback){fallback=[...current];const position=current.findIndex(id=>!locked.includes(id)),replacement=free.find(id=>!current.includes(id));fallback[position]=replacement;}return {status:'retry-limit',party:fallback};
}
function diagnose(runtime,party){const buffs=Array.from(runtime.c.BoukenParty.buffs(party,runtime.byId)),has=id=>buffs.some(x=>x.id===id),facts=[];const add=(text,ids,source)=>facts.push({text,skills:ids,source});
 if(has('A11'))add('出発したときに、土地をひらくスキルがあるよ。',['A11'],'common/buffs.js initial');
 if(buffs.some(x=>/^A0[1-9]$|^A10$|^A12$/.test(x.id)))add('問題に正解したあと、開拓を助けるスキルがあるよ。',buffs.filter(x=>x.id[0]==='A'&&x.id!=='A11').map(x=>x.id),'common/buffs.js correct/threshold');
 if(buffs.some(x=>x.id[0]==='B'))add('かくれた世界をしらべるスキルがあるよ。',buffs.filter(x=>x.id[0]==='B').map(x=>x.id),'common/buffs.js initialVision/revealNear/detected/guide/eventSense');
 if(has('C01')&&has('D01'))add('お宝と仲間の出やすさは、同じくじの中でわけ合うよ。',['C01','D01'],'common/worldgen.js eventWeights');
 const collectors=buffs.filter(x=>x.id[0]==='C'&&Number(x.id.slice(1))>=5);if(collectors.length)add(collectors.length>1?'いくつかの種類のお宝を出やすくするよ。どれも同じくじからえらぶよ。':'ある種類のお宝を出やすくするスキルがあるよ。',collectors.map(x=>x.id),'common/events.js itemWeights');
 if(has('C01'))add('お宝のイベントを出やすくするスキルがあるよ。',['C01'],'common/worldgen.js chooseEvent');
 if(has('C02'))add('お宝を手に入れるのを助けるスキルがあるよ。',['C02'],'common/events.js resolve');
 if(has('D01'))add('仲間のイベントを出やすくするスキルがあるよ。',['D01'],'common/worldgen.js chooseEvent');
 if(has('D05'))add('まだ仲間になっていない仲間を出やすくするスキルがあるよ。',['D05'],'common/events.js companionWeights');
 if(has('C04'))add('まだ持っていないお宝を出やすくするスキルがあるよ。',['C04'],'common/events.js itemWeights');
 if(has('D05')&&has('D06'))add('新しい仲間と、同じなかまの種類をよぶよ。出会いやすさは手持ちでかわるよ。',['D05','D06'],'common/events.js companionWeights');
 if(has('D02')&&has('D07'))add('勧誘を助けて、失敗したときはもう一度ためすスキルもあるよ。',['D02','D07'],'common/events.js resolve');
 const totals=new Map();for(const id of party)for(const s of runtime.byId.get(id)?.skills||[])totals.set(s.id,(totals.get(s.id)||0)+s.level);if([...totals.values()].some(x=>x>3))add('同じスキルは、あわせてレベル3までだよ。',[...totals].filter(x=>x[1]>3).map(x=>x[0]),'common/party.js buffs');
 if(buffs.some(x=>/^E0[1-7]$/.test(x.id)))add('土地のわりあいをかえるよ。数種類あると、わりあいをわけ合うよ。',buffs.filter(x=>/^E0[1-7]$/.test(x.id)).map(x=>x.id),'common/worldgen.js targets');
 if(has('E08'))add('同じ土地を、まとまりやすくするよ。',['E08'],'common/worldgen.js consolidate');
 for(const [id,text] of Object.entries({C03:'お宝を手に入れたあと、もうひとつ見つかることがあるよ。',D02:'仲間をさそうのを助けるよ。',D03:'町やお城がふえるよ。',D06:'パーティーと同じ大きな種類の仲間を出やすくするよ。',D07:'さそうのに失敗したら、もう一度ためせることがあるよ。',D08:'墓地やダンジョンがふえるよ。',D09:'洞窟や遺跡や塔がふえるよ。',F01:'いくつかのお宝から、ひとつをえらべるよ。',F02:'何人かの仲間から、ひとりをえらべるよ。',F03:'お宝も仲間も、手に入れるのを助けるよ。'}))if(has(id))add(text,[id],id==='D03'||id==='D08'||id==='D09'?'common/worldgen.js facilities':'common/events.js prepare/resolve');
 return facts.length?facts:[{text:'この仲間たちの組み合わせを、模擬冒険でためしてみよう。',skills:[],source:'no effectiveness claim'}];
}
function evaluator(runtime,input,config={},hooks={}){const cfg={...defaults,...config},cache=new Map();validate(runtime,input);let adventures=0;const before=JSON.stringify(input.save);
 async function evaluateParty(party,seeds,strict=true){if(strict)validate(runtime,input,party);else if(party.length)throw Error('Only empty reference bypass is allowed');const sig=L.signature(runtime,party),trials=[];for(const seed of seeds){if(hooks.cancelled?.())throw Error('中止しました');const k=sig+'|'+seed;if(!cache.has(k)){cache.set(k,O.adventure(runtime,input.save,party,cfg,seed));adventures++;}trials.push(cache.get(k));hooks.onTrial?.(trials.length,seeds.length);await hooks.yield?.();}if(JSON.stringify(input.save)!==before)throw Error('Input mutation');return L.aggregate(party,trials);}
 return {cfg,evaluateParty,get adventures(){return adventures;}};
}
async function recommendMany(runtime,input,options={},hooks={}){
 const cfg={...defaults,...options.config},locked=[...(options.locked||[])],current=options.current||input.current||input.owned.slice(0,input.slots);validate(runtime,input,null,locked);
 let stage=0,unit=0,total=1;
 const report=()=>hooks.onProgress?.({stage,completed:unit,total,adventures:ev.adventures,candidates:rows.size});
 const enter=(next,count)=>{stage=next;unit=0;total=Math.max(1,count);report();};
 const step=()=>{unit++;report();};
 const progressHooks={...hooks,onTrial:(done,n)=>{hooks.onTrial?.(done,n);hooks.onProgress?.({stage,completed:unit+done/n,total,adventures:ev.adventures,candidates:rows.size});}};
 const started=performance.now(),random=L.rng(cfg.searchSeed),ev=evaluator(runtime,input,cfg,progressHooks),estimate=O.estimator(runtime,input.save,cfg),base=estimate([]),rows=new Map(),candidates=new Map();let interrupted=false;
 const order=p=>arrange(input,p,locked,current),sig=p=>L.signature(runtime,p),add=p=>{p=order(p);validate(runtime,input,p,locked);candidates.set(key(p),p);};
 const fixed=[...locked],free=input.owned.filter(id=>!locked.includes(id)),need=input.slots-locked.length;
 const approx=(p,type)=>L.objective(estimate(p).map((x,k)=>100*x/(Math.max(1e-9,base[k])+x)),type);
 const refRandom=L.rng(cfg.referencePartySeed),references=[];for(let i=0;i<cfg.references;i++)references.push(randomParty(runtime,input,[],Array(input.slots).fill(null),refRandom));
 enter(0,references.length);
 const reference=[];for(const p of references){reference.push((await ev.evaluateParty(p,Array.from({length:cfg.referenceTrials},(_,i)=>cfg.referenceSeedStart+i))).raw);step();}
 enter(1,1);
 const anchor=await ev.evaluateParty([],Array.from({length:cfg.anchorTrials},(_,i)=>cfg.referenceSeedStart+i),false),cal=L.calibration(reference,anchor.raw);
 step();
 const calMs=performance.now()-started,candidateStart=performance.now();
 enter(2,need?10+cfg.randomCandidates+(input.slots===1?free.length:0)+(current.filter(x=>x!==null).length===input.slots?1:0):1);
 if(!need){add(fixed);step();}else{
  for(let type=0;type<5;type++)for(let restart=0;restart<2;restart++){const p=[...fixed];while(p.length<input.slots){const rank=free.filter(id=>!p.includes(id)).map(id=>({id,score:approx([...p,id],type)})).sort((a,b)=>b.score-a.score);p.push(rank[restart?Math.floor(random()*Math.min(4,rank.length)):0].id);}add(p);step();await hooks.yield?.();}
  if(current.filter(x=>x!==null).length===input.slots){add(current);step();}
  for(let i=0;i<cfg.randomCandidates;i++){add(randomParty(runtime,input,locked,current,random));step();await hooks.yield?.();}
  if(input.slots===1)for(const id of free){add([id]);step();await hooks.yield?.();}
 }
 const generationMs=performance.now()-candidateStart;
 async function evaluate(p,n,selection=false){const e=await ev.evaluateParty(p,Array.from({length:n},(_,i)=>(selection?cfg.selectionSeedStart:cfg.trainSeedStart)+i));e.phase=selection?'selection':'proposal';rows.set(key(p),e);if(performance.now()-started>cfg.timeLimitMs)interrupted=true;return e;}
 enter(3,Math.min(candidates.size,cfg.candidateLimit));
 for(const p of [...candidates.values()].slice(0,cfg.candidateLimit)){await evaluate(p,cfg.initialTrials);step();if(interrupted)break;}
 if(!rows.size)throw Error('候補の試行が完了しませんでした');
 const rank=(list,type)=>list.map(e=>({...e,scores:L.normalize(e.raw,cal,'range')})).map(e=>({...e,objective:L.objective(e.scores,type,.7,'hybrid')})).sort((a,b)=>b.objective-a.objective||key(a.party).localeCompare(key(b.party)));
 enter(4,1);
 // Preserve per-purpose beams, including real raw specialization, before one/two member exchanges.
 if(!interrupted&&need){const leaders=new Map();for(let type=0;type<5;type++){for(const e of rank([...rows.values()],type).slice(0,2))leaders.set(key(e.party),e);if(type){const e=[...rows.values()].sort((a,b)=>b.raw[type-1]-a.raw[type-1])[0];leaders.set(key(e.party),e);}}
  enter(4,leaders.size*[1,2].filter(n=>n<=need).length);
  for(const e of leaders.values()){for(const swaps of [1,2].filter(n=>n<=need)){const p=[...e.party],positions=L.shuffle(p.map((id,i)=>!locked.includes(id)?i:-1).filter(i=>i>=0),random).slice(0,swaps);for(const pos of positions){const pool=free.filter(id=>!p.includes(id));if(pool.length)p[pos]=pool[Math.floor(random()*pool.length)];}if(!rows.has(key(p)))await evaluate(p,cfg.initialTrials);step();if(interrupted)break;}if(interrupted)break;}}
 const survivors=new Map();for(let type=0;type<5;type++){for(const e of rank([...rows.values()],type).slice(0,6))survivors.set(key(e.party),e);if(type){for(const e of [...rows.values()].sort((a,b)=>b.raw[type-1]-a.raw[type-1]).slice(0,4))survivors.set(key(e.party),e);}}
 const required=new Map();required.set(key(rank([...rows.values()],0)[0].party),rank([...rows.values()],0)[0]);for(let k=0;k<4;k++){const leader=[...rows.values()].sort((a,b)=>b.raw[k]-a.raw[k])[0];required.set(key(leader.party),leader);}const ordered=new Map([...required,...survivors]);
 enter(5,ordered.size);
 for(const [id,e] of ordered){if(interrupted&&!required.has(id))break;await evaluate(e.party,cfg.finalTrials,true);step();}
 const eligible=[...rows.values()].filter(e=>e.phase==='selection'),pool=eligible.length?eligible:[...rows.values()],banks={};
 enter(6,5);
 for(let type=0;type<5;type++){
  let list=rank(pool,type);
  if(type){const best=Math.max(...list.map(e=>e.raw[type-1]));list=list.filter(e=>e.raw[type-1]>=cfg.specialistRatio*best).sort((a,b)=>b.raw[type-1]-a.raw[type-1]||b.objective-a.objective);}
  if(!type){const cutoff=list[0].objective*cfg.qualityRatio;list=list.filter(e=>e.objective>=cutoff);}
  // Keep the strongest first, then maximize effective-skill / group-set distance.
  // Exact ability-equivalent ID substitutions do not create additional recommendations.
  const distinct=[],signatures=new Set();for(const e of list){const sig=L.signature(runtime,e.party);if(!signatures.has(sig)){signatures.add(sig);distinct.push(e);}}
  const chosen=distinct.length?[distinct.shift()]:[];
  while(distinct.length&&chosen.length<cfg.bankLimit){distinct.sort((a,b)=>Math.min(...chosen.map(e=>abilityDistance(runtime,b.party,e.party)))-Math.min(...chosen.map(e=>abilityDistance(runtime,a.party,e.party)))||b.objective-a.objective);chosen.push(distinct.shift());}
  banks[modes[type+1]]=chosen.map(e=>({...e,diagnosis:diagnose(runtime,e.party)}));step();await hooks.yield?.();
 }

 enter(7,1);step();
 return {banks,calibration:cal,referenceParties:references,evaluations:[...rows.values()],context:L.context(runtime,input.save,cfg),config:cfg,elapsedMs:performance.now()-started,adventures:ev.adventures,profile:{calibrationMs:calMs,candidateGenerationMs:generationMs},interrupted,provisional:true,qualityRatioMeaning:'training score only; not a true performance guarantee',locked};
}


function abilityDistance(runtime,a,b){
 const vector=p=>new Map(Array.from(runtime.c.BoukenParty.buffs(p,runtime.byId)).filter(s=>s.id!=='D04').map(s=>[s.id,s.level]));const x=vector(a),y=vector(b),ids=new Set([...x.keys(),...y.keys()]);let distance=0,total=0;for(const id of ids){distance+=Math.abs((x.get(id)||0)-(y.get(id)||0));total+=Math.max(x.get(id)||0,y.get(id)||0);}
 const levelD06=x.has('D06')||y.has('D06');if(levelD06){const ga=new Set(a.map(id=>runtime.byId.get(id).groupId)),gb=new Set(b.map(id=>runtime.byId.get(id).groupId));for(const group of new Set([...ga,...gb])){distance+=Number(ga.has(group)!==gb.has(group));total++;}}
 return total?distance/total:0;
}

function validateAny(runtime,input,party){validate(runtime,input);const ids=party.filter(id=>id!==null);if(party.length>input.slots||new Set(ids).size!==ids.length||ids.some(id=>!input.owned.includes(id)))throw Error('評価する編成が不正です');return ids;}
const comparisonSeeds=Array.from({length:24},(_,i)=>40810001+i);
async function compare(runtime,input,party,config={},hooks={}){
 const cfg={...defaults,...config};if(![10,20,30].includes(cfg.size)||cfg.budget!==30)throw Error('比較は10/20/30四方・30問の試作条件です');
 const current=validateAny(runtime,input,input.current),candidate=validateAny(runtime,input,party),seeds=config.comparisonSeeds||comparisonSeeds;
 if(!seeds.length||new Set(seeds).size!==seeds.length)throw Error('比較seedが不正です');
 const before=JSON.stringify(input.save),cache=new Map();let comparisonDone=0;
 hooks.onProgress?.({stage:8,completed:0,total:seeds.length});
 async function evaluate(ids){const trials=[];for(const seed of seeds){if(hooks.cancelled?.())throw Error('中止しました');const k=L.signature(runtime,ids)+'|'+seed;if(!cache.has(k))cache.set(k,O.adventure(runtime,input.save,ids,cfg,seed));trials.push(cache.get(k));comparisonDone++;hooks.onProgress?.({stage:comparisonDone<=seeds.length?8:9,completed:(comparisonDone-1)%seeds.length+1,total:seeds.length});await hooks.yield?.();}const result=L.aggregate(ids,trials);const mean=k=>trials.reduce((s,t)=>s+t[k],0)/trials.length;return {...result,initialOpened:mean('initial'),power:Math.round(result.metrics.opened/cfg.budget*1000),openedPerAnswer:result.metrics.opened/cfg.budget,openedSamples:trials.map(t=>t.opened),initialSamples:trials.map(t=>t.initial)};}
 const baseline=await evaluate(current),recommended=await evaluate(candidate),differences=recommended.samples.map((row,i)=>row.map((x,k)=>x-baseline.samples[i][k])),delta=L.mean(differences),se=delta.map((m,k)=>Math.sqrt(differences.reduce((s,row)=>s+(row[k]-m)**2,0)/Math.max(1,seeds.length-1)/seeds.length));
 if(JSON.stringify(input.save)!==before)throw Error('Input mutation');
 return {baseline,candidate:recommended,delta,deltaSE:se,assumptions:O.assumptions(runtime,input.save),diagnosis:diagnose(runtime,candidate),seeds,condition:{size:cfg.size,budget:cfg.budget,slots:input.slots,cumulativeExplored:input.save.records.totalExplored||0,museumStages:Array.from(runtime.c.BoukenCollection.stages(input.save)),policy:'informed',initialIncluded:true,standard:'独立試作の比較条件。製品標準は未承認'},note:'開拓力＝この条件の期待総開拓マス/30×1000。初期開拓を含む。推定であり保証ではない。同seedでもスキルによって地形と乱数消費は異なる。SEは世界間変動のみ、モデルや参照集団の誤差を含まない。'};
}

return {abilityDistance,compare,validateAny,comparisonSeeds,modes,labels,key,defaults,snapshot,validate,randomParty,randomOther,arrange,diagnose,evaluator,recommendMany};
});
