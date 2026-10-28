'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const L=require('../../party-recommendation/phase2/node.cjs');
const ROOT=path.resolve(__dirname,'../../..'),BASE=__dirname;
const sha=x=>crypto.createHash('sha256').update(typeof x==='string'||Buffer.isBuffer(x)?x:JSON.stringify(x)).digest('hex');
const json=(p,x)=>fs.writeFileSync(path.join(BASE,p),JSON.stringify(x,null,2)+'\n');
const csv=(rows)=>rows.map(r=>r.map(x=>'"'+String(typeof x==='object'?JSON.stringify(x):x??'').replaceAll('"','""')+'"').join(',')).join('\n')+'\n';
function build(){
 const r=L.load(),scores=require('../details.json');
 if(JSON.stringify(require('../scorer.cjs').inputManifest())!==JSON.stringify(require('../input-manifest.json')))throw Error('Phase3 input changed; do not reuse v1 results');
 const selectionSeed=2026102804,rand=L.rng(selectionSeed),tie=new Map(L.shuffle(r.data.characters.map(x=>x.id),rand).map((id,i)=>[id,i]));
 const chosen=[],used=new Set();
 function pick(category,reason,predicate,merit,n=1){const eligible=scores.filter(x=>!used.has(x.id)&&predicate(r.byId.get(x.id))).sort((a,b)=>merit(b)-merit(a)||tie.get(a.id)-tie.get(b.id));if(eligible.length<n)throw Error('Insufficient '+reason);for(const x of eligible.slice(0,n)){used.add(x.id);chosen.push({id:x.id,name:x.name,category,reason,skills:r.byId.get(x.id).skills.map(({id,level})=>({id,level})),scores:x.scores});}}
 const has=(c,id)=>c.skills.some(s=>s.id===id),skillLv=(c,id)=>c.skills.find(s=>s.id===id)?.level||0;
 for(const k of ['development','companions','treasure','exploration'])pick(k+'-high','分野別理論点の上位・同点は固定シード順位',()=>true,x=>x.scores[k],5);
 pick('balanced','4分野の最小点を優先した複数分野型',()=>true,x=>Math.min(...Object.values(x.scores))*1000+Object.values(x.scores).reduce((a,b)=>a+b),5);
 for(let i=1;i<=8;i++){const id='E0'+i;pick('support',id+'保有・Lv優先',c=>has(c,id),x=>skillLv(r.byId.get(x.id),id));}
 for(const lv of [1,3])pick('support','D06 Lv'+lv+'保有',c=>skillLv(c,'D06')===lv,()=>0);
 pick('low','D04保有かつ理論合計の低い型',c=>has(c,'D04'),x=>-Object.values(x.scores).reduce((a,b)=>a+b));
 pick('low','理論4分野合計の低い型',()=>true,x=>-Object.values(x.scores).reduce((a,b)=>a+b),4);
 // Ensure every B channel is represented without selecting on measured outcomes.
 for(const id of ['B01','B02','B03','B04','B05','B06','B07'])if(!chosen.some(c=>has(c,id)))pick('medium','探索公開情報 '+id+' の代表（中間枠のカバレッジ優先）',c=>has(c,id),x=>-Math.abs(Object.values(x.scores).reduce((a,b)=>a+b)-77));
 while(chosen.filter(c=>c.category==='medium').length<5)pick('medium','全体中央値ベクトル(24/0/25/16)への距離が小さい型',()=>true,x=>-['development','companions','treasure','exploration'].reduce((a,k,i)=>a+Math.abs(x.scores[k]-[24,0,25,16][i]),0));
 pick('random','未選定集合から固定シードの一様シャッフル順',()=>true,()=>0,5);
 if(chosen.length!==50)throw Error('Selection count '+chosen.length);
 const support=chosen.filter(c=>c.category==='support').map(c=>{
  const id=c.reason.match(/^(E0[1-8]|D06)/)[1];
  const target=id.startsWith('E')&&id!=='E08'?'A'+String(Number(id.slice(1))+3).padStart(2,'0'):id==='E08'?'A05':'D02';
  const partner=[...r.data.characters].filter(p=>p.id!==c.id&&has(p,target)&&!has(p,id)).sort((a,b)=>skillLv(b,target)-skillLv(a,target)||Number(used.has(b.id))-Number(used.has(a.id))||tie.get(a.id)-tie.get(b.id))[0];
  return {caseId:id+'-'+c.id,supportId:c.id,supportName:c.name,removedSkill:id,partnerId:partner.id,partnerName:partner.name,partnerSkills:partner.skills,arms:['partner-only','with-support','ablated-support'],trials:100};
 });
 const participantIds=[...new Set([...chosen.map(c=>c.id),...support.map(c=>c.partnerId)])].sort((a,b)=>a-b);
 const initialOwned=L.shuffle(r.data.characters.map(c=>c.id),L.rng(2026102805)).slice(0,464),owned=[...initialOwned],added=participantIds.filter(id=>!owned.includes(id)),removed=[];
 const removable=L.shuffle(owned.filter(id=>!participantIds.includes(id)),L.rng(2026102806));
 for(let i=0;i<added.length;i++){const id=removable[i];removed.push(id);owned[owned.indexOf(id)]=added[i];}owned.sort((a,b)=>a-b);
 const items=L.shuffle(r.data.collection_items.map(x=>x.id),L.rng(2026102807)).slice(0,240).sort();
 const save=r.c.BoukenSchema.makeInitialSave();save.characters=Object.fromEntries(owned.map(id=>[id,1]));save.characterJoinOrder=[...owned];save.items=Object.fromEntries(items.map(id=>[id,1]));save.collectionClaimsVersion=1;save.claimedCollectionRewards=[];delete save.collectionLegacyItems;save.worldsStarted=2;save.records.totalExplored=0;save.tutorialStory.complete=true;
 const hashFiles=['common/version.js',...['schema','party','explore','buffs','collection','events','progress','worldgen'].map(n=>'common/'+n+'.js'),...['characters','skills','terrains','facilities','collection_items','collection_rewards','world_facility_counts'].map(n=>'data/'+n+'.json'),'tests/party-recommendation/phase2/core.js','tests/party-recommendation/engine.cjs',...['scoring-v1.json','scores.csv','details.json','verification.json'].map(n=>'tests/character-aptitude/'+n)];
 const cfg={experimentVersion:'phase4-1.0.0',sourceCommit:'557a7b1a5a69bc6e2132e935794b6d47e544d989',gameVersion:74,aptitudeVersion:'1.0.0-draft',selectionSeed,ownershipSeed:2026102805,ownershipSwapSeed:2026102806,itemOwnershipSeed:2026102807,size:10,budget:30,accuracy:1,initialCharacterCount:464,initialItemCount:240,museumStages:[0,0,0,0,0,0],claims:[],cumulativeExplored:0,worldsStarted:2,policyVersion:'phase2-public-informed+phase4-isolated-v1',candidatePolicy:'公開候補から未所持優先、同点は提示順（目標分類優先なし）',seedStart:2026102900,seeds:Array.from({length:100},(_,i)=>2026102900+i),supportSeedStart:2026103900,supportSeeds:Array.from({length:100},(_,i)=>2026103900+i),pilotSeeds:[2026104900,2026104901,2026104902],support,participants:participantIds,holdoutIds:r.data.characters.filter(c=>!participantIds.includes(c.id)).map(c=>c.id),ownershipChanges:{before:initialOwned.sort((a,b)=>a-b),added:added.sort((a,b)=>a-b),removed:removed.sort((a,b)=>a-b)},inventoryHash:sha({characters:save.characters,items:save.items,claims:save.claimedCollectionRewards}),sourceHashes:Object.fromEntries(hashFiles.map(p=>[p,sha(fs.readFileSync(path.join(ROOT,p)))])),primaryMetrics:{development:'opened',companions:'newCharacters',treasure:'newItems',exploration:'explorationIndex'},explorationIndex:'(0.55*discoveryAuc+0.45*visited)/30; discoveryAuc=sum((31-firstPublicQuestion)/31)',notes:['30正答で打切り、全域開拓が先なら終了。拠点を開拓数に含めない。','1冒険ごとに同一初期所持へリセット、冒険内の新規取得のみ次の抽選に反映。','仲間イベント数と勧誘試行は再試行を除き同数、retryAttemptsを別記。','地図は共通シードで本体生成。E介入では地形と後続乱数消費による施設配置差があり、同じ実現地図を固定しない。','未使用群は単独50体と補助試験パートナーの全参加IDを除外。試験未使用であり過去研究全ての未使用を保証するものではない。']};
 json('config.json',cfg);json('selection.json',chosen);json('initial-save.json',L.clone(save));
 fs.writeFileSync(path.join(BASE,'selection.csv'),csv([['id','name','category','reason','skills','development','companions','treasure','exploration'],...chosen.map(c=>[c.id,c.name,c.category,c.reason,c.skills,...Object.values(c.scores)])]));
 fs.writeFileSync(path.join(BASE,'holdout.csv'),csv([['id','name','status'],...cfg.holdoutIds.map(id=>[id,r.byId.get(id).name,'Phase4未参加・Phase6候補'])]));
 console.log(JSON.stringify({selected:chosen.length,categories:Object.fromEntries([...new Set(chosen.map(c=>c.category))].map(k=>[k,chosen.filter(c=>c.category===k).length])),support:support.length,participants:participantIds.length,holdout:cfg.holdoutIds.length,swaps:added.length,stages:Array.from(r.c.BoukenCollection.stages(save)),ids:chosen.map(c=>c.id)}));
}
if(require.main===module)build();module.exports={build,sha,json,csv,ROOT,BASE};
