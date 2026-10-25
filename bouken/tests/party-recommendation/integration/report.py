import json,math,statistics,pathlib
root=pathlib.Path(__file__).parent
r=json.loads((root/'results.json').read_text());cases=r['cases'];chars={c['id']:c['name'] for c in json.loads((root/'../../../data/characters.json').read_text())}
labels={'balanced':'おまかせ','explore':'どんどん開拓','treasure':'お宝集め','companion':'仲間集め','map':'マップ探索'}
def fmt(xs):return ' / '.join(f'{x:.3f}' for x in xs)
def paired(a,b,k):
 ds=[x[k]-y[k] for x,y in zip(a['samples'],b['samples'])];m=statistics.mean(ds);se=statistics.stdev(ds)/math.sqrt(len(ds));return [m,m-1.96*se,m+1.96*se]
auditcases=[c for c in cases if 'audit'in c]
summary={'sourceCommit':r['sourceCommit'],'version':r['version'],'cases':len(cases),'auditCases':len(auditcases),'environment':r['environment'],'qualityGate':'failed / do not integrate','specialistComparisons':[]}
for c in auditcases:
 for mode,k in [('explore',0),('treasure',1),('companion',2),('map',3)]:
  t=c['types'][mode];delta=paired(t['audit'],c['audit']['random'],k)
  other=max(v['audit']['raw'][k] for v in c['types'].values());summary['specialistComparisons'].append({'spec':c['spec'],'mode':mode,'vsOneRandomPaired95':delta,'belowBestOtherMode':t['audit']['raw'][k]<other-1e-9,'heldoutVsTrainRawRatio':t['audit']['raw'][k]/t['training']['raw'][k] if t['training']['raw'][k] else None})
(root/'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
p=root/'../../../siyou/おまかせ編成独立検証.md';s=p.read_text();s+='''
## E：31条件の品質監査（本体統合を止める）

**品質ゲートは未合格。** 固定制約の正しさと、推薦品質・多様性の合格は別。候補は研究用暫定表示のまま。ユーザー実機・仕様判断を飛ばしてGへ進まない。

再現コード/入力/全候補/seed/監査原本は[validate.cjs](../tests/party-recommendation/integration/validate.cjs)、[results.json](../tests/party-recommendation/integration/results.json)、[比較要約](../tests/party-recommendation/integration/summary.json)。数値を見て候補を選び直さず、訓練で決めた各モードの先頭を32未使用seedで評価。別所有分布の5ケースも事前列挙。比較対象のランダムは固定seedの1編成だけで、ランダム集団全体への優越を保証しない。

'''
s+=f"実測環境：{r['environment']}。PC Node実測でありスマホ速度ではない。10×10/30正解、初期2→生存8試行、参照8編成×2と空4、候補上限40、無作為12。UI既定は参照12編成・初期4→16試行であり、下記秒数と同じ設定ではない。測定時エンジン実装はコミットaa9d815b35fde5479f3e36837f1d521131773ffa。後続は診断文・極端な乱数でのランダム再抽選回復だけで、数値式/推薦探索は変更していない。\n\n"
s+='### 全条件・固定時の時間と多様性\n\n候補数は、おまかせ/開拓/お宝/仲間/探索。訓練スコア90%・専門成果95%の研究フィルタ後。\n\n|所有|固定/枠|品所有率|サイズ|秒|模擬冒険|候補数|\n|---:|---|---:|---|---:|---:|---|\n'
for c in cases:
 sp=c['spec'];s+=f"|{sp['count']}|{sp['fixed']}/{c['slots']}|{sp['fraction']:.0%}|{sp['size']}×{sp['size']}|{c['elapsedMs']/1000:.2f}|{c['adventures']}|{' / '.join(str(v['bankCount']) for v in c['types'].values())}|\n"
counts=[v['bankCount'] for c in cases if c['spec']['fixed']<c['slots'] for v in c['types'].values()];ones=sum(n==1 for n in counts)
s+=f'\n変更できる枠があるケースでも、{len(counts)}モード条件中{ones}条件が候補1組。多様性が十分とはいえない。候補90%は訓練上の目安であり、独立試行でも90%の性能を保証する基準ではない。さらに同じ能力ベクトルの別キャラを多様性として数える限界がある。メンバー重複率・能力距離の正式な下限は未決。\n'
s+='''
### 推薦と4分野の成果（固定なし11条件）

生評価の順序は開拓/お宝/仲間/探索。開拓=開拓数/30、お宝=.75新規種類+.20新規目標+.05総数、仲間=.9新規+.1加入（全927所持時は新規0のため出会い数という研究用代替）、探索=(.55発見AUC+.45施設訪問)/30。計算は旧phase2/core.jsを変更せず再利用。

相対点は、同じ所有/枠/進行で固定seedにより生成した無作為参照集団の中央値mと幅wに対し100/(1+exp(-ln9*(x-m)/w))。w=max(P90-P10,.1abs(m),1e-6)。おまかせ=.5最低+.5幾何平均、専門=.7当該分野+.3おまかせ。絶対的な強さや別人数との直接比較には使わない。校正値・試行数は原本に保存。

'''
for c in auditcases:
 sp=c['spec'];s+=f"#### 所有{sp['count']} / {c['slots']}人 / {sp['fraction']:.0%}所有 / {sp['size']}×{sp['size']} / 所有seed{sp['ownershipSeed']}\n\n"
 s+='|モード|推薦ID・名前|訓練相対点|独立32試行の生評価|独立SE|完走4試行の必要正解平均|\n|---|---|---|---|---|---:|\n'
 for mode,t in c['types'].items():
  names='、'.join(f"#{id} {chars[id]}" for id in t['chosen']);s+=f"|{labels[mode]}|{names}|{fmt(t['training']['scores'])}|{fmt(t['audit']['raw'])}|{fmt(t['audit']['se'])}|{t.get('full',{}).get('meanQClear','未測定')}|\n"
 s+='\n'
s+='''### 不安定・悪化を隠さない

|条件|専門モード|無作為1編成との生差|対応32seedの参考95%区間|同条件の別モードより低いか|
|---|---|---:|---|---|
'''
for x in summary['specialistComparisons']:
 sp=x['spec'];d,lo,hi=x['vsOneRandomPaired95'];s+=f"|{sp['count']}体/{sp['fraction']:.0%}/{sp['size']}×{sp['size']}|{labels[x['mode']]}|{d:.4f}|[{lo:.4f}, {hi:.4f}]|{'低い' if x['belowBestOtherMode'] else '同等以上'}|\n"
s+='''
この区間は固定した校正/候補に対する正規近似で、希少イベントの厳密区間でも多重比較補正済みでもない。勝ち候補の選択誤差、参照分布の誤差、別所有分布への一般化を保証しない。32試行でも施設イベントのばらつきは残る。独立成果が別モードより低い専門型があり、学習上の専門下限だけでは安定しない。候補数を増やすだけでなく、未知所有分布での候補集合品質・同一予算での比較が必要。

固定を増やすほど選択自由度は落ち、全員固定は同じ編成1組を正常に評価する。品質低下は元の固定仲間の能力に依存する。今回の固定は表示先頭からの1分布だけであり、あらゆるお気に入り固定への性能保証ではない。固定時も独立32試行を全件実施してはいない。

長期は10×10の推薦について別4seedで完走。短期と完走の成果は分け、4試行で長期の統計的確証が得られたとはしない。20/30サイズは初動30正解の32試行監査で、完走監査は未実施。受取済み博物館ボーナスは元APIと旧phase2テストで維持を確認するが、今回31探索条件は未受取中心で、多数受取済みの全固定条件グリッドは未実施。

## F：解放案の調査と保留

現在の通常ゲームはcharacters[id]の正の個数で所有種類を数え、減少/売却/消費する通常操作はない。characterJoinOrderは加入順であり、古い保存には所有から補完するため、失われた過去の独立した累計獲得種類数とみなせない。現状では所有種類を推奨するが、正式判定はユーザー決定待ち。

|暫定閾値|その時点の実編成枠|判断材料|
|---:|---:|---|
|30 ランダム|1|お気に入り固定で全部固定になる。初期には単体仲間の発見体験になる|
|100 おまかせ|2|組合せ支援が始まる|
|150 開拓/探索|3|3人目は140で解放済み|
|200 お宝/仲間|3|4人目279より早い|

加入ペースは施設遭遇・成功・未加入優先・全域報酬・算数回答時間に依存。今回の完走試行は模擬の新規加入数を原本に保存しているが、実際の子どもの継続プレイ時間/何日目に到達するかを測っていない。30/100/150/200を最適と確定しない。未解放ボタンの本適用・達成案内は閾値承認後。Gの正式導線/保存/版更新も未着手。

## 再開地点

1. Bの6ボタン/5枠とCの独立ページを実機確認。本人の実セーブ読込・保存不変を確認する。
2. Dの総合探検力/正式診断の範囲、履歴、コンプ後目標、Fの解放閾値/種類判定をChatで判断。
3. Eの候補1組と専門不安定を、未使用の所有分布・独立seedで改善検証。仮90%を真の性能保証として使わない。
4. 実機性能/メモリ、短期・長期の監査、博物館多数受取の固定条件を拡充する。
5. 品質ゲート合格とユーザー明示承認の両方がそろうまでGは開始しない。
'''
p.write_text(s)
print({'cases':len(cases),'oneCandidate':ones,'nonFullyLockedModeConditions':len(counts),'specialistLowerThanAnotherMode':sum(x['belowBestOtherMode'] for x in summary['specialistComparisons'])})
