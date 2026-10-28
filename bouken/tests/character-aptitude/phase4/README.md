# Phase 4：第1回実測（50体×100冒険）

main ver.74、入力基準 `557a7b1a5a69bc6e2132e935794b6d47e544d989`。採点仕様 `1.0.0-draft` を固定。ゲーム本体から読み込まれない独立CLIで、模擬セーブだけを使用する。実セーブ・localStorageへ接続しない。

## 結果を見る

- [日本語分析](REPORT.md)：選定50体一覧、実測上位下位、相関、支援、限界、Phase 5引継ぎ。
- [実験条件](config.json)：固定seed、所有集合の入替、全参加54体、未使用873体、支援10ケースの事前定義、ソースSHA-256。
- [実装との差異](ENGINE-DIFFERENCES.md)：本体処理の再利用箇所、AI/訪問/候補選択/打切り/E介入の地図差。
- [検証結果](verification.json) / [最終ログ](validation.log) / [予備ゲート](pilot-results.json)。

## 実行環境・再実行

Node.js v24.22.1、Python 3系＋NumPy/SciPy/Matplotlibで実行。Pythonの依存版はrequirements.txt。Nodeの外部パッケージは不要。

リポジトリルートから、同じ基準ソース・同じconfig/initial-saveで実行する。

```sh
node bouken/tests/character-aptitude/phase4/pilot.cjs
node bouken/tests/character-aptitude/phase4/run.cjs --kind=main
node bouken/tests/character-aptitude/phase4/run.cjs --kind=support
python bouken/tests/character-aptitude/phase4/analyze.py
node bouken/tests/character-aptitude/phase4/validate.cjs
```

`pilot`が不合格、またはconfig/engine/入力ソースが予備合格後に変わった場合、runnerは停止する。新しい入力に旧理論点を流用しない。Phase 3の再検証は `node --test bouken/tests/character-aptitude/scorer.test.cjs`（生成物を上書きしない）。

## 途中停止・再開

基本はキャラごと100件、支援はケースごと300件を1単位として、CSV一時ファイル→renameで保存する。例えば最初の1体だけ実行するには `--kind=main --limit=1`。同じコマンドを再実行すると完了単位を読んで次から進む。`--limit=0`は既存件数確認と無変更の監査記録だけを行う。

正常な既存結果があれば5,000/3,000件を再実行しない。単位内で停止した場合は、その単位だけ再計算する。中途半端な件数や入力不一致はエラーとなる。全件再計算する場合は、このフォルダを外部作業コピーへ複製し、作業コピーのadventures.csv、support-adventures.csv、progress.jsonl、runs.jsonlだけを退避したうえで、同じconfig/initial-save/pilotゲートから再開する。既存の正本結果を黙って混ぜたり消したりしない。

選定や初期所持を再構築する `plan.cjs` は実行前設定用。旧Phase 3入力と一致する場合のみ構築し、同じソース・seedなら同じ設定になる。既存結果のある場所で別条件の設定を上書きしない。採点・選定・支援条件を測定結果に合わせて変更しない。

## 成果物

| ファイル | 内容 |
|---|---|
| plan.cjs / config.json | 固定条件の構築・所有集合入替・seed・支援編成・入力ハッシュ |
| selection.json / selection.csv | 重複なし50体、理由・枠・スキル・4理論点 |
| initial-save.json | 全条件共通の模擬セーブ。464体・240種類・受取0段階 |
| holdout.csv | 全実験参加54体を除外した873体。Phase 6候補 |
| engine.cjs | 本体ロジックVM、独立した公開情報AI、イベント・成果の計測 |
| run.cjs | 予備ゲート、分割・途中再開、CSV保存 |
| pilot.cjs / pilot-results.json | 少数冒険、再現性・B01〜B07の利用・隠し情報非利用等の17検証 |
| adventures.csv | 基本5,000冒険の記録 |
| support-adventures.csv | 支援10ケース×3条件×100seed＝3,000冒険 |
| progress.jsonl / runs.jsonl | 保存単位ごとの完了件数・時間、再開・無変更実行の履歴 |
| analyze.py / requirements.txt | 記述統計、順位相関、対応差、散布図。配点を学習・修正しない |
| character-statistics.csv | 50体×33指標、平均/中央値/標本標準偏差/最小/最大（n=100） |
| character-summary.csv | キャラ別平均・標準偏差と理論点の横持ち表 |
| rankings.csv | 4分野の実測値・理論点・平均同点順位・順位差 |
| collector-effects.csv | 分類収集家の対象分類比率・新規取得 |
| support-summary.csv | 全体追加差・対象スキル差・他スキル等の差、対応差95%区間 |
| analysis.json / comparison.svg / REPORT.md | 機械可読分析、4散布図、日本語報告 |
| ENGINE-DIFFERENCES.md | 本体と実験の差異・制限 |
| validate.cjs / verification.json / validation.log | 8,000件の整合検査、80冒険リプレイ、再生成の一致等17検証 |

CSVはUTF-8・ヘッダー付き・ダブルクオート。skills/buffs/party/museumStages/signalSteps/initialTerrainCounts/collectorGroupsはJSON文字列。記録のid/name/skills/theoryは検証対象の支援者または単独キャラで、補助編成の実際の参加者と合算Lvはparty/buffsを参照する。支援除去対照でもtheory列は元の実在キャラの点であり、対照を再採点した値ではない。

## 主な測定項目

- `opened = normalOpened + initialSkillOpened + additionalSkillOpened`。拠点を含めない。受取0段階なのでmuseum由来追加は0。初期A11と付随A03をinitialSkillOpenedに含む。
- `companionEvents = recruitAttempts` は初回勧誘の機会。D07再試行はretryAttempts、全判定回数はrecruitRolls。最終成功はrecruitSuccesses、新規種類はnewCharacters。全域報酬はrewardJoinsに分離。
- `itemEvents = itemAttempts` は獲得判定機会、itemSuccessesは成功イベント数、totalItemsはC03追加も含む個数、newItemsは冒険開始時の未所持から得た一意種類数。
- discoveredは公開された施設位置の一意数。B04矢印/B07件数だけでは施設位置発見に含めない。visitedは処理済み数、detectedはB02/B03による未開拓施設位置の探知数。cumulativeRevealは累計透視、remainingRevealは終了時に透視済みかつ未開拓のセル数。
- primaryMetricsは実行前configに固定。探索指数は既存phase2と同じ重みで、発見時期と訪問を組み合わせる。4分野を合計100にしない。
- 支援のwith-support−ablated-supportが対象スキルの効果。D06は所属グループを保つ。E系は地形への介入なので同一seedでも実現地図は変わる。差の区間は同seedの対応差100本による標本標準偏差を使用する。

予備・最終検証はそれぞれ複数のアサーションを含む17グループ。Phase 3は239テスト。これらをゲーム全体の実機合格や67スキル全Lvの実測合格と読み替えない。測定CSV・集計・プロットは同条件で再現するが、実行時間・環境ログは変動する。Phase 5で採点を改訂する承認は含まれない。
