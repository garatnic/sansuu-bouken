"""Phase 4 descriptive analysis only; no fitting or changes to theoretical v1."""
import csv,json,math,sys,hashlib
from pathlib import Path
import numpy as np
from scipy.stats import rankdata,spearmanr,pearsonr,t
P=Path(__file__).resolve().parent
config=json.loads((P/'config.json').read_text());selection=json.loads((P/'selection.json').read_text());by={x['id']:x for x in selection}
def read(name):
 with (P/name).open(newline='') as f:return list(csv.DictReader(f))
def write(name,rows):
 with (P/name).open('w',newline='') as f:
  w=csv.DictWriter(f,fieldnames=list(rows[0]),lineterminator="\n");w.writeheader();w.writerows(rows)
def dump(name,obj):(P/name).write_text(json.dumps(obj,ensure_ascii=False,indent=2,allow_nan=False)+'\n')
def stats(a):
 a=np.asarray(a,dtype=float)
 return dict(n=len(a),mean=float(a.mean()),median=float(np.median(a)),stdDev=float(a.std(ddof=1)),min=float(a.min()),max=float(a.max()))
def fmt(n):return f'{n:.3f}'
main=read('adventures.csv');support=read('support-adventures.csv')
assert len(main)==5000 and len(support)==3000
metric_keys=['opened','normalOpened','initialSkillOpened','additionalSkillOpened','totalSkillOpened','efficiency','companionEvents','recruitAttempts','retryAttempts','recruitRolls','recruitSuccesses','newCharacters','itemEvents','itemAttempts','itemSuccesses','totalItems','newItems','discovered','visited','detected','cumulativeReveal','remainingReveal','discoveryAuc','explorationIndex','discoveryEfficiency','visitEfficiency','generatedFacilities','rewardJoins','blocked','a12EligibleTurns','targetItems','targetNewItems','groupJoins']
groups={id:sorted([r for r in main if int(r['id'])==id],key=lambda r:int(r['seed'])) for id in by}
summary=[];primary=[]
for id,rows in groups.items():
 assert len(rows)==100
 out=dict(id=id,name=by[id]['name'],category=by[id]['category'],skills=json.dumps(by[id]['skills'],ensure_ascii=False),**{f'theory_{k}':v for k,v in by[id]['scores'].items()})
 for key in metric_keys:
  values=[float(r[key]) for r in rows];st=stats(values);summary.append(dict(id=id,name=by[id]['name'],metric=key,**st))
  out[key+'_mean']=st['mean'];out[key+'_stdDev']=st['stdDev']
 primary.append(out)
write('character-statistics.csv',summary);write('character-summary.csv',primary)
fields=config['primaryMetrics'];labels={'development':'開拓','companions':'仲間','treasure':'お宝','exploration':'探索'}
correlations={};ranking=[];rng=np.random.default_rng(2026102808)
boot_indices=rng.integers(0,100,(1000,100))
for field,metric in fields.items():
 ids=list(by);theory=np.array([by[id]['scores'][field] for id in ids],float);matrix=np.array([[float(r[metric]) for r in groups[id]] for id in ids]);means=matrix.mean(axis=1)
 rho=float(spearmanr(theory,means).statistic);pearson=float(pearsonr(theory,means).statistic)
 boot=[]
 for idx in boot_indices:boot.append(float(spearmanr(theory,matrix[:,idx].mean(axis=1)).statistic))
 ci=np.quantile(boot,[.025,.975]);theory_rank=rankdata(-theory,method='average');actual_rank=rankdata(-means,method='average')
 correlations[field]=dict(metric=metric,spearman=rho,pearson=pearson,pairedSeedBootstrap95=[float(x) for x in ci],bootstrapTrials=1000,bootstrapSeed=2026102808,nCharacters=50,meanOfMeans=float(means.mean()),minMean=float(means.min()),maxMean=float(means.max()))
 for i,id in enumerate(ids):ranking.append(dict(field=field,id=id,name=by[id]['name'],theory=float(theory[i]),mean=float(means[i]),theoryRank=float(theory_rank[i]),actualRank=float(actual_rank[i]),rankGap=float(actual_rank[i]-theory_rank[i])))
write('rankings.csv',ranking)
support_summary=[]
for case in config['support']:
 rows=[r for r in support if r['caseId']==case['caseId']]
 arms={arm:sorted([r for r in rows if r['arm']==arm],key=lambda x:int(x['seed'])) for arm in case['arms']}
 for metric in ['opened','newCharacters','newItems','explorationIndex','visited','groupJoins','generatedFacilities']:
  vals={k:np.array([float(r[metric]) for r in v]) for k,v in arms.items()}
  for comparison,a,b in [('total-addition','with-support','partner-only'),('isolated-skill','with-support','ablated-support'),('other-skills-and-membership','ablated-support','partner-only')]:
   delta=vals[a]-vals[b];st=stats(delta);se=st['stdDev']/10;ci=[st['mean']-t.ppf(.975,99)*se,st['mean']+t.ppf(.975,99)*se]
   support_summary.append(dict(caseId=case['caseId'],skill=case['removedSkill'],supportId=case['supportId'],supportName=case['supportName'],partnerId=case['partnerId'],comparison=comparison,metric=metric,withSupportMean=float(vals['with-support'].mean()),partnerOnlyMean=float(vals['partner-only'].mean()),ablatedMean=float(vals['ablated-support'].mean()),**st,ci95Low=float(ci[0]),ci95High=float(ci[1])))
write('support-summary.csv',support_summary)
# B observations are distinct from skill effects; holder comparison is descriptive and confounded by other skills.
b_summary=[]
for n in range(1,8):
 skill='B0'+str(n);holders=[id for id in by if any(s['id']==skill for s in by[id]['skills'])];obs=[r for r in main if int(r['id']) in holders]
 b_summary.append(dict(skill=skill,holders=holders,adventures=len(obs),meanDiscovered=float(np.mean([float(r['discovered']) for r in obs])),meanVisited=float(np.mean([float(r['visited']) for r in obs])),meanExplorationIndex=float(np.mean([float(r['explorationIndex']) for r in obs])),meanCumulativeReveal=float(np.mean([float(r['cumulativeReveal']) for r in obs])),meanDetected=float(np.mean([float(r['detected']) for r in obs])),meanGuideSignalTurns=float(np.mean([json.loads(r['signalSteps'])['guide'] for r in obs])),meanSenseSignalTurns=float(np.mean([json.loads(r['signalSteps'])['sense'] for r in obs]))))
collector=[]
for id,rows in groups.items():
 skill=next((s for s in by[id]['skills'] if s['id'].startswith('C') and 5<=int(s['id'][1:])<=28),None)
 if skill:
  total=sum(float(r['totalItems']) for r in rows);target=sum(float(r['targetItems']) for r in rows)
  collector.append(dict(id=id,name=by[id]['name'],skill=skill['id'],level=skill['level'],totalItems=total,targetItems=target,targetShare=target/total if total else None,newItemsMean=float(np.mean([float(r['newItems']) for r in rows])),targetNewItemsMean=float(np.mean([float(r['targetNewItems']) for r in rows]))))
write('collector-effects.csv',collector)
zero=[r for r in main if by[int(r['id'])]['scores']['companions']==0];high=[r for r in main if by[int(r['id'])]['scores']['companions']>=40]
zero_comp={name:dict(characters=len(set(r['id'] for r in rows)),adventures=len(rows),meanNewCharacters=float(np.mean([float(r['newCharacters']) for r in rows])),meanRecruitSuccesses=float(np.mean([float(r['recruitSuccesses']) for r in rows])),meanCompanionEvents=float(np.mean([float(r['companionEvents']) for r in rows]))) for name,rows in [('theoryZero',zero),('theory40Plus',high)]}
saturation=dict(maxOpened=max(float(r['opened']) for r in main),allOpened=sum(int(r['opened'])==99 for r in main),lateEligibleAdventures=sum(float(r['a12EligibleTurns'])>0 for r in main),lateEligibleTurns=sum(float(r['a12EligibleTurns']) for r in main),blockedEffects=sum(float(r['blocked']) for r in main),blockedAdventures=sum(float(r['blocked'])>0 for r in main),a12Holders=[id for id in by if any(s['id']=='A12' for s in by[id]['skills'])])
timing=[json.loads(l) for l in (P/'progress.jsonl').read_text().splitlines()];runs=[json.loads(l) for l in (P/'runs.jsonl').read_text().splitlines()]
covered=sorted({s['id'] for c in selection for s in c['skills']});missing=[s['id'] for s in json.loads((P/'../../../data/skills.json').resolve().read_text()) if s['id'] not in covered]
result=dict(skillCoverage=dict(covered=covered,missing=missing),correlations=correlations,bSkills=b_summary,companionComparison=zero_comp,saturation=saturation,completed=dict(main=5000,support=3000),timing=dict(mainComputeMs=sum(x['elapsedMs'] for x in timing if x['kind']=='main'),supportComputeMs=sum(x['elapsedMs'] for x in timing if x['kind']=='support'),mainGroups=sum(x['kind']=='main' for x in timing),supportGroups=sum(x['kind']=='support' for x in timing),runs=runs))
dump('analysis.json',result)
report=['# Phase 4：50キャラクター×100冒険の第1回実測','',
'対象：main ver.74 / `557a7b1a5a69bc6e2132e935794b6d47e544d989`、理論仕様 `1.0.0-draft`。基本5,000冒険、支援補助3,000冒険を完了。採点仕様・本体・マスター・セーブ形式・版番号は変更していない。実測記録と記述分析のみであり、Phase 5の配点調整は未実施。','',
'## 固定条件と50体の選定','',
'10×10、30問、正解率100%、通常出発3回目、累計開拓0。仲間464/927体（50.054%）、お宝240/480種類（50%）を固定シードのFisher–Yatesで抽出。全参加54体を所有させるため28体を入替え、全条件共通の464体を維持した。変更前集合・追加28体・除外28体・最終集合はconfig.json/initial-save.jsonに保存。各冒険で同じ状態へリセットする。','',
'博物館は受取済み0件、6効果とも0段階。所持品の偶然の小分類完成は受取済みと扱わず、自動受取もしない。開始後の加入・品物はその冒険内のみ所持補正へ反映。基本シードは2026102900〜2026102999、支援は2026103900〜2026103999。','',
'選定は理論点だけで実行前に固定した。各専門5体×4、分野最小点優先の複数分野型5、E01〜E08とD06 Lv1/Lv3の支援10、低得点5、中程度5、無作為5。中程度枠では未カバーのB系代表を優先する。選定50体と補助パートナー4体を除く873体をPhase 6候補として分離（過去研究全体の未使用を保証する集合ではない）。','',
'| ID・登録名 | 枠 | スキル | 理論 開拓/仲間/お宝/探索 |','|---|---|---|---|']
for c in selection:report.append(f"| #{c['id']} {c['name']} | {c['category']} | "+' / '.join(s['id']+' Lv'+str(s['level']) for s in c['skills'])+' | '+'/'.join(str(v) for v in c['scores'].values())+' |')
report+=['','## 成果の定義と集計','',
'開拓の主指標は開拓セル数（拠点除外）。仲間は新規加入種類数、お宝は新規獲得種類数。探索は既存phase2の公開情報に基づく `(0.55×施設発見AUC＋0.45×訪問数)/30`。AUCは各施設の初めて位置が公開された問題数tに対し `(31−t)/31` を加算する。B04の矢印・B07の区画数だけで正確な施設位置が判明したとは数えず、行動への有用性を訪問等に反映する。','',
'character-statistics.csvに50体×33指標の平均・中央値・標本標準偏差（分母99）・最小・最大を保存。character-summary.csvは平均・標準偏差の横持ち版。累計透視数はachievementVisionCount、終了時未開拓透視数はremainingRevealとして区別する。探知数はB02/B03が位置を公開した未開拓施設の一意数。勧誘の初回試行とD07再試行を分け、C03追加品と成功イベント数も別に記録。','',
'| 分野 | 50体平均の平均 | キャラ平均の最小〜最大 | Spearman順位相関 | 共通seedブートストラップ95%区間 | Pearson |','|---|---:|---:|---:|---|---:|']
for field,s in correlations.items():report.append(f"| {labels[field]} | {fmt(s['meanOfMeans'])} | {fmt(s['minMean'])}〜{fmt(s['maxMean'])} | {fmt(s['spearman'])} | {fmt(s['pairedSeedBootstrap95'][0])}〜{fmt(s['pairedSeedBootstrap95'][1])} | {fmt(s['pearson'])} |")
report+=['','順位は同点平均順位。区間は100個の共通seed列を再標本化する1,000反復（seed 2026102808）。50体は意図的な層別標本であり、区間はこの50体でのseedばらつきを示し、927体全体の標本抽出誤差・将来条件の不確かさを含まない。相関だけで採点モデルの合否を決めない。','', '## 各分野の上位・下位と乖離','']
for field,metric in fields.items():
 rs=[r for r in ranking if r['field']==field];top=sorted(rs,key=lambda r:(-r['mean'],r['id']))[:5];bottom=sorted(rs,key=lambda r:(r['mean'],r['id']))[:5]
 report+=[f"### {labels[field]}",'','| 順 | 実測上位（理論点） | 平均 | 実測下位（理論点） | 平均 |','|---:|---|---:|---|---:|']
 for i,(a,b) in enumerate(zip(top,bottom)):report.append(f"| {i+1} | #{a['id']} {a['name']}（{a['theory']:g}） | {fmt(a['mean'])} | #{b['id']} {b['name']}（{b['theory']:g}） | {fmt(b['mean'])} |")
 low_actual=sorted(rs,key=lambda r:(-r['rankGap'],r['id']))[:3];high_actual=sorted(rs,key=lambda r:(r['rankGap'],r['id']))[:3]
 report+=['','理論順位より実測順位が低い例：'+'、'.join(f"#{r['id']} {r['name']}（理論{r['theory']:g}点、平均{r['mean']:.3f}、順位差+{r['rankGap']:g}）" for r in low_actual)+'。', '理論順位より実測順位が高い例：'+'、'.join(f"#{r['id']} {r['name']}（理論{r['theory']:g}点、平均{r['mean']:.3f}、順位差{r['rankGap']:g}）" for r in high_actual)+'。','']
report+=['## 仲間0点と高得点の比較','', '| 群 | 人数 | 冒険数 | 新規加入平均 | 勧誘成功平均 | 仲間イベント平均 |','|---|---:|---:|---:|---:|---:|']
for name,s in zero_comp.items():report.append(f"| {name} | {s['characters']} | {s['adventures']} | {fmt(s['meanNewCharacters'])} | {fmt(s['meanRecruitSuccesses'])} | {fmt(s['meanCompanionEvents'])} |")
report+=['','0点は仲間イベントが起きない意味ではない。基本施設イベントと60%の成功率がある。B系・開拓系が施設到達を増やせば、仲間の理論点0でも新規加入が増える。両群の比較は保有スキルも異なる記述比較。','', '## お宝分類特化とB系情報','',
'分類特化は総獲得数の増加と同義ではない。対象分類取得比率・新規取得をcollector-effects.csvへ保存。分類の初期所持偏りと他スキルが交絡するので、個別スキルの因果効果と断定しない。F01の選択は未所持優先のみで、目標分類を恣意的に優遇しない。','',
'| キャラ | 分類スキル | 対象分類/総獲得 | 比率 | 新規種類平均 |','|---|---|---:|---:|---:|']
for r in collector:report.append(f"| #{r['id']} {r['name']} | {r['skill']} Lv{r['level']} | {int(r['targetItems'])}/{int(r['totalItems'])} | {100*r['targetShare']:.1f}% | {r['newItemsMean']:.3f} |")
report+=['','| B系 | 保有人数 | 発見平均 | 訪問平均 | 累計透視平均 | 位置探知平均 |','|---|---:|---:|---:|---:|---:|']
for r in b_summary:report.append(f"| {r['skill']} | {len(r['holders'])} | {r['meanDiscovered']:.3f} | {r['meanVisited']:.3f} | {r['meanCumulativeReveal']:.3f} | {r['meanDetected']:.3f} |")
report+=['','全B系で公開信号の除去によりAIの選択が変わる予備検証を実施済み。B01/B05/B06の透視、B02/B03の探知位置、B04の矢印、B07の区画密度を利用する。表の保有者平均は他スキルも含むため、B系単独の因果効果にはしない。','',
'## 支援補助：固定10ケース×3条件×100seed＝3,000冒険','',
'各ケースでpartner-only、with-support、ablated-supportを比較。ablatedは支援者のID・groupId・他スキル・人数を保ち、対象EまたはD06だけをメモリ内で除外した反実仮想。JSONマスター自体は変更していない。with−ablatedが対象スキルの効果、ablated−partner-onlyが残りスキルと所属グループ追加、with−partner-onlyが追加全体であり、混同しない。D06は同seedで実現地図も一致。E系は地形を変える介入であり、同一実現地図への固定はしていない。','',
'差の区間は共通seedの対応差100本に基づくt区間。多数比較の補正なし。E08では整形が乱数を消費し、後続の施設位置・種類もずれるため、地形だけの機序へ差を全て帰属できない。E系各1体とD06各Lv1/3各1体という限定されたパートナー条件である。','',
'| 支援キャラ | 対象 | 固定パートナー | 対象スキルの開拓差 | 新規仲間差 | 新規お宝差 | 探索指数差 |','|---|---|---|---:|---:|---:|---:|']
for case in config['support']:
 vals={r['metric']:r for r in support_summary if r['caseId']==case['caseId'] and r['comparison']=='isolated-skill'}
 report.append(f"| #{case['supportId']} {case['supportName']} | {case['removedSkill']} | #{case['partnerId']} {case['partnerName']} | "+' | '.join(f"{vals[m]['mean']:+.3f}" for m in ['opened','newCharacters','newItems','explorationIndex'])+' |')
report+=['','E系は地形特攻パートナーを優先し、E08はA05、D06はD02パートナーを選定。全構成とスキルはconfig.jsonに実行前保存。D06の価値は総加入数だけでなく対象大分類への偏りにもあるので、groupJoinsも併記する。','',
'| D06支援 | 対象分類加入差 | 対応差95%区間 |','|---|---:|---|']
for r in support_summary:
 if r['skill']=='D06' and r['comparison']=='isolated-skill' and r['metric']=='groupJoins':report.append(f"| #{r['supportId']} {r['supportName']} | {r['mean']:+.3f} | {r['ci95Low']:+.3f}〜{r['ci95High']:+.3f} |")
report+=['','E/D06の支援点を一人旅の成果だけで減点しない。正負の差・区間の広さ・他の支援者や進行条件への一般化をPhase 5で検討する。','',
'## 終盤・飽和・条件依存','',
f"5,000冒険の最大開拓は{saturation['maxOpened']:g}マス、全域99マス到達は{saturation['allOpened']}件。A12の残り20%以下に入った冒険は{saturation['lateEligibleAdventures']}件、対象ターンは{saturation['lateEligibleTurns']:g}回。追加開拓の開けなかった効果は{saturation['blockedEffects']:g}件、該当冒険は{saturation['blockedAdventures']}件。",
f"選定50体でカバーしたスキルは{len(covered)}/67種。未保有スキルは{'、'.join(missing)}。A12保有者は0体で、終盤条件に達した冒険も0件のため、A12の実測評価は今回成立していない。",
'30問では終盤到達を十分観測できない場合、A12や終盤の残りマス飽和の妥当性を確認済みとしない。終盤前でも隣接枯渇で追加処理が止まる例は別に検出する。長期冒険の追加実験・採点改訂は今回開始しない。','',
'## 実装との差異と解釈','',
'ゲームの生成・開拓・抽選・Lv合算・施設制約・所持補正・博物館処理は実コードをVMで読み込み、再実装しない。差異の全一覧はENGINE-DIFFERENCES.md。人間の操作を代表しない公開情報AI、施設の即時訪問、未所持優先選択、誤答なし、固定所有・受取0段階、UI/保存/称号演出省略という条件が結果へ影響する。E介入時の乱数消費ずれと、分類の初期所持偏りも残る。','',
'## 検証・時間・Phase 5への引継ぎ','',
f"予備検証17項目に合格してから実行。基本計算のグループ実行時間合計は{result['timing']['mainComputeMs']/1000:.3f}秒、支援は{result['timing']['supportComputeMs']/1000:.3f}秒。CPU共有で一部並行実行しており合計は壁時計時間ではない。CSV保存時間を含み、分析・検証・転送時間を含まない。停止再開の履歴と各100/300件の進捗はprogress.jsonl/runs.jsonl。最終検証はverification.json/validation.log。",
'',
'- 理論上の専門性と、施設到達を介した他分野成果の関係を確認する。特に仲間0点でも基礎加入や探索由来の加入がある。',
'- 分類収集家の点を総新規種類数だけで検証せず、対象分類の価値を別軸で扱う。',
'- B系は公開情報を利用するAIで測定できたが、方針選択に依存する。別の人間方針や移動コストへ一般化しない。',
'- E01〜E07の特攻支援、E08の配置と施設乱数消費、D06の分類偏りを分けて解釈する。支援値の改訂は未承認。',
'- 30問で未到達の終盤・A12、博物館ボーナスの非0条件、異なる初期所持集合、未使用873体の検証は未実施。',
'- 今回の乖離はPhase 5の検討資料であり、v1を変更していない。Phase 6候補へ実測を広げていない。']
(P/'REPORT.md').write_text('\n'.join(report)+'\n')
print(json.dumps(dict(correlations=correlations,companionComparison=zero_comp,saturation=saturation,timing=result['timing']),ensure_ascii=False,indent=2))
# Deterministic, exact scatter visualization (not generated imagery).
import matplotlib
matplotlib.use('Agg');matplotlib.rcParams['svg.hashsalt']='sansuu-phase4-v1'
import matplotlib.pyplot as plt
fig,axes=plt.subplots(2,2,figsize=(10,7),layout='constrained')
for ax,(field,metric) in zip(axes.flat,fields.items()):
 rs=[r for r in ranking if r['field']==field]
 for category,color in [('specialist','#3574af'),('support','#d58a25'),('other','#52866a')]:
  subset=[r for r in rs if ('specialist' if by[r['id']]['category'].endswith('-high') else 'support' if by[r['id']]['category']=='support' else 'other')==category]
  ax.scatter([r['theory'] for r in subset],[r['mean'] for r in subset],s=26,alpha=.8,label=category,color=color)
 for i,r in enumerate(sorted(rs,key=lambda r:-abs(r['rankGap']))[:3]):ax.annotate('#'+str(r['id']),(r['theory'],r['mean']),xytext=(3,4+10*i),textcoords='offset points',fontsize=7)
 ax.set_title(field+f" (Spearman {correlations[field]['spearman']:.3f})");ax.set_xlabel('Theory score (v1)');ax.set_ylabel(metric+' (mean per adventure)');ax.grid(alpha=.2)
axes[0,0].legend(fontsize=7)
fig.savefig(P/'comparison.svg',metadata={'Date':None});(P/'comparison.svg').write_text('\n'.join(line.rstrip() for line in (P/'comparison.svg').read_text().splitlines())+'\n');fig.savefig('/tmp/phase4-comparison.png',dpi=140);plt.close(fig)
with (P/'REPORT.md').open('a') as f:f.write('\n## 理論点と実測の散布図\n\n![4分野の比較](comparison.svg)\n')
