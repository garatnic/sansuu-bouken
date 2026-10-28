'use strict';
const fs=require('node:fs'),path=require('node:path');
const {FIELDS,VERSION,definition,scoreCharacter,scoreAll,loadInputs}=require('./scorer.cjs');
const labels={development:'開拓',companions:'仲間',treasure:'お宝',exploration:'探索'};
const {characters,skills}=loadInputs(),rows=scoreAll(characters,skills);
const mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
const fmt=x=>Number.isInteger(x)?String(x):x.toFixed(3);
const show=c=>`#${c.id} ${c.name}`;
function summary(a){const v=[...a].sort((a,b)=>a-b),avg=mean(v);return {count:v.length,mean:avg,median:v.length%2?v[(v.length-1)/2]:(v[v.length/2-1]+v[v.length/2])/2,populationStdDev:Math.sqrt(mean(v.map(x=>(x-avg)**2))),min:v[0],max:v.at(-1)};}
function rank(k,descending){return [...rows].sort((a,b)=>(descending?b.scores[k]-a.scores[k]:a.scores[k]-b.scores[k])||a.id-b.id);}
const stats={};
for(const k of FIELDS){
 const values=rows.map(c=>c.scores[k]),freq=Array.from({length:101},(_,score)=>({score,count:values.filter(x=>x===score).length}));
 stats[k]={...summary(values),zeroCount:freq[0].count,hundredCount:freq[100].count,uniqueScores:freq.filter(x=>x.count).length,frequency:freq,distribution:Array.from({length:10},(_,i)=>({range:i===9?'90–100':`${i*10}–${i*10+9}`,count:values.filter(x=>x>=i*10&&x<=(i===9?100:i*10+9)).length})),top20:rank(k,true).slice(0,20).map(c=>({id:c.id,name:c.name,score:c.scores[k],raw:c.raw[k]})),bottom20:rank(k,false).slice(0,20).map(c=>({id:c.id,name:c.name,score:c.scores[k],raw:c.raw[k]})),maxTieCount:values.filter(x=>x===Math.max(...values)).length,minTieCount:values.filter(x=>x===Math.min(...values)).length};
}
const synergies=definition.synergies.map(s=>({id:s.id,count:rows.filter(c=>c.synergies.pairs.some(p=>p.id===s.id)).length}));
const support=definition.skills.filter(s=>s.id.startsWith('E')||s.id==='D06'||s.id==='D04').map(s=>({id:s.id,name:s.name,levels:[1,2,3].map(level=>{
 const actual=rows.filter(c=>c.contributions.some(x=>x.id===s.id&&x.level===level));
 const solo=scoreCharacter({id:1,name:'単一スキル比較',skills:[{id:s.id,level}]});
 return {level,count:actual.length,base:s.base[level-1],soloRaw:solo.raw,soloScores:solo.scores,holderMeans:Object.fromEntries(FIELDS.map(k=>[k,actual.length?mean(actual.map(c=>c.scores[k])):null]))};
})}));
// Hold all other skills fixed, replacing only this skill's Lv. This is theoretical sensitivity, not simulation.
const sensitivity=definition.skills.map(s=>{
 const holders=characters.filter(c=>c.skills.some(x=>x.id===s.id));
 const results=holders.map(c=>{const levels=[1,2,3].map(level=>scoreCharacter({...c,skills:c.skills.map(x=>x.id===s.id?{...x,level}:x)}));return {id:c.id,scores:levels.map(x=>x.scores)};});
 return {id:s.id,name:s.name,holderCount:holders.length,fields:Object.fromEntries(FIELDS.map(k=>[k,{soloScores:[1,2,3].map(level=>scoreCharacter({id:1,name:'fixture',skills:[{id:s.id,level}]}).scores[k]),delta12:summary(results.map(r=>r.scores[1][k]-r.scores[0][k])),delta23:summary(results.map(r=>r.scores[2][k]-r.scores[1][k]))}]))};
});
const allZero=rows.filter(c=>FIELDS.every(k=>c.scores[k]===0));
const allPositive=rows.filter(c=>FIELDS.every(k=>c.scores[k]>0));
const balanced=[...rows].sort((a,b)=>Math.min(...Object.values(b.scores))-Math.min(...Object.values(a.scores))||a.id-b.id).slice(0,20);
const allBelow20=rows.filter(c=>FIELDS.every(k=>c.scores[k]<20));
const allAbove50=rows.filter(c=>FIELDS.every(k=>c.scores[k]>=50));
const totalRank=[...rows].sort((a,b)=>Object.values(b.scores).reduce((x,y)=>x+y)-Object.values(a.scores).reduce((x,y)=>x+y)||a.id-b.id);
const analysis={aptitudeVersion:VERSION,statistics:stats,synergyOccurrences:synergies,support,levelSensitivity:sensitivity,joint:{allZero:allZero.map(c=>c.id),allPositive:allPositive.map(c=>c.id),allBelow20:allBelow20.map(c=>c.id),allAbove50:allAbove50.map(c=>c.id),bestMinimumScore:Math.max(...rows.map(c=>Math.min(...Object.values(c.scores)))),balancedTop20:balanced.map(c=>({id:c.id,name:c.name,scores:c.scores})),sumTop20:totalRank.slice(0,20).map(c=>({id:c.id,name:c.name,scores:c.scores})),sumBottom20:totalRank.slice(-20).reverse().map(c=>({id:c.id,name:c.name,scores:c.scores}))}};
fs.writeFileSync(path.join(__dirname,'analysis.json'),JSON.stringify(analysis,null,2)+'\n');
const out=[`# Phase 3：927キャラクター理論適性スコア分析\n`,
`対象：main ver.74、採点仕様 ${VERSION}。入力SHA-256は input-manifest.json、調査元コミットは review-manifest.json。理論点であり成功率・実測性能ではない。模擬冒険は未実施。本体統合・マスター変更・公開操作は行わない。`,
`\n## 分布\n`,`標準偏差は927体全体を母集団として算出（分母927）。整数化後のスコアを集計。分布は0–9…80–89、90–100。順位は点数優先・同点はID昇順。下位20は同点集合全体の代表ではなく、決定的に抽出した20体。全同点人数と0〜100の度数は analysis.json に保持。`,
`\n| 分野 | 平均 | 中央値 | 母標準偏差 | 最小 | 最大 | 0点人数 | 100点人数 | 異なる点数数 |\n|---|---:|---:|---:|---:|---:|---:|---:|---:|`,
...FIELDS.map(k=>`| ${labels[k]} | ${fmt(stats[k].mean)} | ${fmt(stats[k].median)} | ${fmt(stats[k].populationStdDev)} | ${stats[k].min} | ${stats[k].max} | ${stats[k].zeroCount} | ${stats[k].hundredCount} | ${stats[k].uniqueScores} |`),
`\n| 点数帯 | 開拓 | 仲間 | お宝 | 探索 |\n|---|---:|---:|---:|---:|`,
...stats.development.distribution.map((b,i)=>`| ${b.range} | ${FIELDS.map(k=>stats[k].distribution[i].count).join(' | ')} |`),
`\n## 上位・下位20体\n`];
for(const k of FIELDS){out.push(`\n### ${labels[k]}\n`,`最高点同点 ${stats[k].maxTieCount}体、最低点同点 ${stats[k].minTieCount}体。`,`\n| 順 | 上位 ID・登録名 | 点 | raw | 下位 ID・登録名 | 点 | raw |\n|---:|---|---:|---:|---|---:|---:|`);for(let i=0;i<20;i++){const a=stats[k].top20[i],b=stats[k].bottom20[i];out.push(`| ${i+1} | ${show(a)} | ${a.score} | ${fmt(a.raw)} | ${show(b)} | ${b.score} | ${fmt(b.raw)} |`);}}
out.push(`\n## 極端値・全分野の傾向\n`,
`「全分野で高い」は便宜上各50点以上、「全分野で低い」は各20点未満と定義する（v1の合格基準ではない）。全分野50点以上は${allAbove50.length}体、全分野20点未満は${allBelow20.length}体、全分野0点は${allZero.length}体（${allZero.map(show).join('、')||'該当なし'}）。全分野に正の寄与を持つのは${allPositive.length}体。4分野の最小点の最大値は${analysis.joint.bestMinimumScore}点。`,
`4分野をカバーするには、最大3スキルという構成上、D03/D08/D09・E系・F03等の複数配分が必要になる。専門型の他分野0点を不具合と扱わない。合計点は正式な総合適性ではない。以下は分野最小点順の参考値。`,
`\n| ID・登録名 | 開拓 | 仲間 | お宝 | 探索 |\n|---|---:|---:|---:|---:|`,...balanced.slice(0,10).map(c=>`| ${show(c)} | ${Object.values(c.scores).join(' | ')} |`),
`\n全分野20点未満：${allBelow20.map(show).join('、')||'該当なし'}。全体の合計点上位・下位20は analysis.json の参考診断として保存し、正式順位には使用しない。`,
`\n## 支援系スキル\n`,
`E01〜E07は同一配点：Lv1/2/3のrawは開拓3.85/7.70/11.55、探索3.15/6.30/9.45。E08は開拓1.75/3.50/5.25、探索3.25/6.50/9.75。D06は仲間raw 7/14/21。単独性能の実測に置き換えず、v1の支援価値を保持した。`,
`\n| スキル | Lv | 保有数 | 単独点 開拓/仲間/お宝/探索 |\n|---|---:|---:|---|`);
for(const s of support)for(const lv of s.levels)out.push(`| ${s.id} ${s.name} | ${lv.level} | ${lv.count} | ${Object.values(lv.soloScores).join('/')} |`);
out.push(`\n保有者の平均点は他の保有スキルも含むため因果効果と解釈しない（analysis.jsonに分離）。D04保有者も他スキルで得点できるが、D04自身の基礎寄与は全Lvで0。D06の所属グループ依存・E系の地形競合や他キャラ支援の実効はPhase 4固定パートナー比較へ引き継ぐ。`,
`\n## シナジー\n`,`| 組合せ | 該当人数 |\n|---|---:|`,...synergies.map(s=>`| ${s.id} | ${s.count} |`),
`\nシナジーは各ペア一度、分野別に最大8raw。details.jsonに各ペアの上限前値、分野合計、上限適用後値を分離。現データで上限を超える人数は${rows.filter(c=>FIELDS.some(k=>c.synergies.uncapped[k]>8)).length}体。存在しない個人内の組合せに推測加点しない。`,
`\n## 同一スキルのLv差\n`,
`他スキルを固定し、同一保有者の対象Lvだけを1→2→3へ差し替える理論感度分析を実施。これはマスター書換えでも模擬冒険でもなく採点式の検算。架空Lvでコスト上限を超え得るため実在構成ランキングには混ぜない。67種全てについて単独点・保有者内の分野別増分（平均/中央値/標準偏差/最小/最大）を analysis.json に記録。`,
`\n| ID | 単独点の主な分野 | Lv1→2→3 |\n|---|---|---|`);
for(const s of sensitivity){const k=FIELDS.reduce((a,b)=>s.fields[a].soloScores[2]>=s.fields[b].soloScores[2]?a:b);out.push(`| ${s.id} | ${labels[k]} | ${s.fields[k].soloScores.join(' → ')} |`);}
out.push(`\nD04以外は基礎点が単調増加し、スコアの逆転はない。正規化は逓減し、整数化もあるため同じraw差が常に同じ点差にはならない。異なるキャラのLv別平均だけでは他スキルの交絡があるため、Lv効果と断定しない。`,
`\n## 不自然な順位・飽和・モデル上の限界\n`,
`最高点は${FIELDS.map(k=>labels[k]+stats[k].max+'点').join('、')}で、100点への飽和は全分野0体。0点の同点集中は配分先がない構成による。整数化と24種の収集家の同一配点は正点での同点も生む。各分野の多い正点同点は${FIELDS.map(k=>{const f=stats[k].frequency.filter(x=>x.score>0).sort((a,b)=>b.count-a.count||a.score-b.score)[0];return `${labels[k]}${f.score}点${f.count}体`;}).join('、')}。同点内のID順に優劣の意味はない。`,
`基礎点の単純加算と分野の独立正規化は仕様どおりであり、収集家複数構成など現行では禁止の構成を実在として補完しない。B02+B系等の探索情報と獲得の相乗は指定されたペアだけ+2。上位・下位の数値異常、欠損、範囲外、D04誤加点は検出なし。順位のゲーム性能上の妥当性は未検証。`,
`C05〜C28が同じ点数になること、D03/D08/D09が同じ配点になることは、収集進行・地図サイズ・施設最低保証を区別しないv1の仮定による。D04のみ0点キャラがあれば「役立たないキャラ」とは解釈しない。B系の情報価値も行動方針に依存する。実測での順位逆転の可能性を報告対象とし、配点を独断修正しない。`,
`\n## Phase 4への引き継ぎ\n`,
`- 採点仕様 ${VERSION}、927体の入力ハッシュ、各スコアとrawを固定する。\n- 50体の抽出は専門型・分野最小点の高い型・E系/D06支援型・D04/低得点型・同点群を含め、選定規則とIDを次フェーズで記録する（今回は未抽出・未実測）。\n- 10×10、30問、所有/博物館受取、公開観測に基づく探索方針、乱数を固定・記録する。\n- E系とD06は固定パートナーで比較し、個人理論点と編成効果を分ける。C/D/Fの競合・所持進行依存・情報重複も補助試験へ。\n- D04は実装されるまで0。v1の正規化係数35・暫定支援価値・同点集中をPhase 5で検証し、変更は別仕様版で行う。\n- Phase 4以降および正式統合は未実施。`,
`\n## 調査範囲と既知の残件\n`,
`ロードマップにはPhase 1中の「継続中／保留」という履歴が残るが、末尾の最終判定とPhase 2完了を優先。READMEの過去の推薦未統合記述もver.71の追記で更新済み。D04未実装・E09対象外は現コードと整合。採点を妨げる重大な不一致は確認していない。全履歴サブフォルダ・画像・ゲーム実機の再監査は行っていない。既存の推薦品質課題・旧テスト入力依存等の修正は今回の対象外。`);
fs.writeFileSync(path.join(__dirname,'REPORT.md'),out.join('\n')+'\n');
console.log(JSON.stringify(Object.fromEntries(FIELDS.map(k=>[k,{...stats[k],frequency:undefined,distribution:undefined,top20:stats[k].top20.slice(0,1),bottom20:stats[k].bottom20.slice(0,1)}])),null,2));
