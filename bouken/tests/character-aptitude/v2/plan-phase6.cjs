'use strict';
// Selection only. This file cannot execute adventures.
const fs=require('node:fs'),path=require('node:path'),U=require('../phase5a/analyze.cjs');
const P=__dirname,F=['development','companions','treasure','exploration'];
const load=p=>JSON.parse(fs.readFileSync(path.join(P,p),'utf8'));
const chars=load('../../../data/characters.json'),scored=load('details.json'),hold=new Set(U.parseCsv(fs.readFileSync(path.join(P,'../phase4/holdout.csv'),'utf8')).map(c=>Number(c.id))),map=new Map(chars.map(c=>[c.id,c]));
let state=2026102815;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
const pool=scored.filter(c=>hold.has(c.id)).map(c=>({...c,tie:random()})),chosen=[];
function take(reason,n,pred,sort){const available=pool.filter(c=>!chosen.some(s=>s.id===c.id)&&pred(c)).sort(sort||((a,b)=>a.tie-b.tie));if(available.length<n)throw Error('Insufficient '+reason);for(const c of available.slice(0,n))chosen.push({id:c.id,name:c.name,reason,skills:map.get(c.id).skills.map(({id,level})=>({id,level})),absolute:c.scores,specialty:c.specialty});}
// Reserve conditional and support coverage before stratified specialties.
for(let i=1;i<=7;i++)take('E0'+i+' 地形支援',1,c=>map.get(c.id).skills.some(s=>s.id==='E0'+i));
take('D06 編成依存',3,c=>map.get(c.id).skills.some(s=>s.id==='D06'));
take('A12 終盤未観測',2,c=>map.get(c.id).skills.some(s=>s.id==='A12'));
for(const k of F)take(U.LABELS[k]+'専門上位',5,c=>c.specialty.includes(k),(a,b)=>b.metrics[k].deviation-a.metrics[k].deviation||a.tie-b.tie);
take('低得点分布',5,()=>true,(a,b)=>Math.max(...F.map(k=>a.scores[k]))-Math.max(...F.map(k=>b.scores[k]))||a.tie-b.tie);
take('中央値付近',5,()=>true,(a,b)=>Math.abs(Math.max(...F.map(k=>a.metrics[k].deviation))-50)-Math.abs(Math.max(...F.map(k=>b.metrics[k].deviation))-50)||a.tie-b.tie);
take('固定seed無作為',8,()=>true);
const config={status:'実行前計画案・今回実行禁止',selectionSeed:2026102815,selectionAlgorithm:'LCG32 1664525*x+1013904223; master ID昇順でtieを付与。条件スキルを先に確保、専門4×5/低5/中5/無作為8。重複除外',sourceHoldout:'Phase4 holdout873（同研究54参加者を除外。他研究全体の未使用保証ではない）',aptitudeVersion:'2.0.0',size:10,questions:30,accuracy:1,ownership:{characters:464,items:240,seedCharacters:2026102816,seedItems:2026102817,method:'ID昇順からFisher–Yates無作為抽出。全条件の参加実体IDを固定枠として先に確保し、残枠を抽出。同じ集合を全試行へ使用。最終参加編成固定後にJSONとSHA256保存'},museum:{claimed:0,stages:[0,0,0,0,0,0]},seeds:{main:{start:2026110100,count:100},supplement:{start:2026111100,count:100},pilot:{start:2026112100,count:5}},main:{characters:50,trialsEach:100,adventures:5000},supplement:{E:{cases:21,conditions:3,trials:100,adventures:6300,design:'E01〜07×Lv1〜3、固定パートナーは対応A04〜A10 Lv3。partner-only/partner+support/partner+supportから当該Eのみ除去。同人数差を主要効果とする'},D06:{cases:6,conditions:3,trials:100,adventures:1800,design:'Lv1〜3×同分類/異分類固定パートナー。partner-only/with/同人数D06除去。分類別未加入母数と対象加入を記録'},A12:{cases:9,conditions:2,trials:100,adventures:1800,design:'Lv1〜3×10四方問題30/60/100。A12有/無を同人数で比較。終盤到達/未到達、通常/追加/枯渇を分離。後半予算も全100マス開拓時で停止'}},plannedMainAndSupplement:14900,pilot:{cases:12,seedsEach:5,adventures:60,gate:'完走・再現・公開情報AI全B証拠・固定所有/博物館・同人数対照・隠し情報非利用・本体差分監査。重大不整合なら本試験禁止'},executedAdventures:0,selection:chosen,remainingHoldout:pool.filter(c=>!chosen.some(s=>s.id===c.id)).map(c=>c.id),approvalBeforeExecution:['合成Lv介入と固定実体パートナーID/対照編成の確定','所有集合とエンジン/AI/入力hash事前固定','予備60件ゲート合格'],protocol:'結果を見て配点を調整しない。各キャラ100共通seed、進捗JSONL/単位CSV原子的保存、ID+条件+seed一意、同seed対応差/95%区間。追加キャラ・条件は別版。E08/D04は配点検証対象外で大規模性能試験を行わない'};
fs.writeFileSync(path.join(P,'phase6-plan.json'),JSON.stringify(config,null,2)+'\n');fs.writeFileSync(path.join(P,'phase6-selection.csv'),U.csv([['id','name','reason','skills','absolute','specialty'],...chosen.map(c=>[c.id,c.name,c.reason,c.skills,c.absolute,c.specialty])]));console.log('Planned 50 characters; executed 0 adventures');
