# ランダム案「お宝・仲間」原因切り分け

基点main `e854d6a5eba71a50f67616b2f35c1e34d3c3115f` / common/version.js=70。
既存specialist-random/を読み取り専用で再利用。ゲーム・UI・推薦エンジン・個人スコアを変更しない。旧1,500回試験や改善方式の実装・再評価は行わない。

- [日本語レポート](../../../siyou/おまかせ編成ランダム案原因調査_20261026.md)
- [全100チームCSV](results-20261026/all-teams.csv)
- [お宝50チーム](results-20261026/treasure-teams.csv) / [仲間50チーム](results-20261026/companion-teams.csv)

## 事前固定の設計

各分野、前回上位10起点×共通背景5セット×同じ10マップ＝500冒険、2分野で追加1,000冒険。
A：各背景で起点だけ交換。B：各起点で背景だけ交換。**同じ交差セルを使うため、A/Bを二重実行しない。**
背景の4人は所有500人からその分野の上位10人を除いた490人から非復元抽出。背景間は独立抽選で同人物が再登場してもよい。全5人の重複は禁止。
前回の所有/所持品/進行/受取/スコア/マップ/方策と完全ランダム基準を流用。
背景seedはお宝92610101、仲間92610201。マップseedは前回plan.jsonの10条件をそのまま使い、こちらのplan.jsonへコピー。
個人スコアは前回の保存済み値を使い再定義しない。新しい冒険結果からチームを選抜しない。

起点10対背景5という数の違いを考慮し、各条件内の標本分散（n−1）を平均して比較。二元交差表SS/MS、残差、1要素除外の感度分析を併記。
事前分析方針はplan.json.design.analysis。明確な優位方向が条件付き分散/分解/感度分析で一致するならA/B寄り、両方の差があって大小が不明ならC、判別困難ならD。これは新しい品質合格基準ではない。

## 再実行（リポジトリのルートから）

元の原本を上書きせず、新しい出力先を指定する。Node/Python標準ライブラリのみ。

```sh
node bouken/tests/party-recommendation/specialist-random-cause/plan.cjs /tmp/random-cause-repro
```

これだけでは模擬冒険を実行しない。既存基準のcontext/source/ファイルSHAを確認し、全チームと分析方法を先に保存。
今回の平均見積約26秒、保守約69秒。保守見積が10分を超えるなら以下を実行せず縮小案を報告。

```sh
node bouken/tests/party-recommendation/specialist-random-cause/run.cjs /tmp/random-cause-repro
```

1,000冒険だけ。約590秒で停止ガード、stopped.jsonへ済み件数を保存。結果/途中原本が既にある出力先では上書き拒否。
正常完了はresults.json。progress.jsonは一時的な途中保存（全結果保存後に削除）。

```sh
python bouken/tests/party-recommendation/specialist-random-cause/analyze.py /tmp/random-cause-repro
node bouken/tests/party-recommendation/specialist-random-cause/describe.cjs /tmp/random-cause-repro
node bouken/tests/party-recommendation/specialist-random-cause/test.cjs /tmp/random-cause-repro
python bouken/tests/party-recommendation/specialist-random-cause/verify.py /tmp/random-cause-repro
python bouken/tests/party-recommendation/specialist-random-cause/report.py /tmp/random-cause-repro /tmp/random-cause-report.md
```

分析/テストは追加冒険0。analyze.pyは新出力の派生成果物（CSV/analysis.json）を原本から再生成できる。
CSV各50行/統合100行に起点ID、残り4人ID、10マップ実成果、平均、基準との差、厳密超過判定を保存。

## 分散の解釈

応答は10マップ平均。起点数I=10、背景数J=5。
A平均条件付き分散＝各背景での起点間標本分散を5背景で平均。
B平均条件付き分散＝各起点での背景間標本分散を10起点で平均。
分散の平方根はRMS SD。最大最小だけで原因を決めない。
二元分解のdfは起点9/背景4/残差36。成分(負値含む)と非負表現を両方保存。
残差は交互作用＋有限10マップの変動で、独立世界反復がないので分離不能。感度分析は信頼区間ではない。
同じseed条件でもスキルが地形生成/乱数消費を変える既存効果は維持する。

## 限界・終了点

同じ所有1集合・背景5組だけ。背景から上位10人全員を除いている点、起点が均等な点が前回30独立チームと異なる。
前回の60%の失敗をA/Bへ正確に何件ずつ配分した実験ではない。今回の76%/80%は改善実績ではない。
結論は本条件で両分野B寄り。Aがゼロとは言わず、起点順位を直すだけで安定性が得られるとはしない。
原因調査は一区切り。次はユーザーとの採用相談であり、新たな実験や正式統合Gを自動的に開始しない。
