# おまかせ編成エンジン比較（予備・本試験未開始）

開始main `6a3da473418a7c2c166771a85a213d3fd2bc6eba` / version.js=70。
ユーザーが2026-10-26に本試験を開始しないよう指定。**下記の全数コマンドは再開時の手順であり、今回実行していない。承認された規模/外部回数を確認してから使う。** 公開API/UIとゲーム本体は変更しない。

結果：[予備測定報告](../../../siyou/おまかせ編成エンジン比較予備測定_20261026.md)。E未合格/G禁止は継続。

## ファイル

- `light.cjs`：固定込みの限界推定貢献を用いた10起点×5組、3試行、上位10組。完全ランダム50組の対照。カーソルは再探索なし。
- `instrument.cjs`：現行APIを文字列の完全一致を確認して動的計測。公開api.jsへ変更なし。
- `analysis.cjs`：工程計時、同じ銀行選抜、順位相関、能力/メンバー多様性。
- `plan.cjs` / `plan-1500.json`：実データから抽選した81所有セット、500対応条件（3方式で1,500推薦）の凍結計画。推薦の乱数は対応条件ごと、監査用とは別。
- `pilot-plan-1500.json`：予備時点の計画原本。後から計画へversion70メタデータを補ったが、所有ID/seed/tasksは同一でテストする。
- `batch.cjs`：計画から逐次実行、条件ごとにJSON保存、manifestとハッシュで再開。全候補/交換親子/4対32の反実仮想を独立評価。
- `pilot-1500-20261026/`：補足後の5条件×3方式、外部16回の原本。**本試験結果ではない。**
- `run.cjs` / `results-20261026/`：補足前の12条件計画と完了2条件の原本。残10条件を中止して新しい指定へ切替。候補全体の64回外部評価済みだが本試験には含めない。
- `switch-pilot.cjs` / `switch-pilot-20261026.json`：カーソルだけと既存24回比較APIを分けた追加計測。新しい推薦を行わない。
- `report.py`：保存済み原本から仕様書の表/時間外挿/pilot-summary.jsonを生成。

## 実行済みチェック

```sh
node bouken/tests/party-recommendation/engine-comparison/test.cjs
node bouken/tests/party-recommendation/engine-comparison/plan-test.cjs
python bouken/tests/party-recommendation/engine-comparison/report.py
```

実シミュレーション平均、固定位置、候補重複、保存非変更、計測版と現行の一致、81セット/500対応条件/目的別125回を検査。

予備の再現は**新しい出力先**で、同じpilot-planを使用する。計時・10秒制限で候補数や結果が変わる場合がある。元の出力は上書きしない。

```sh
node bouken/tests/party-recommendation/engine-comparison/batch.cjs \
  bouken/tests/party-recommendation/engine-comparison/pilot-plan-1500.json \
  /tmp/new-comparison-pilot pilot
```

## 本試験を再開する場合（今回は未実行）

1. ユーザーが決めた推薦回数/外部監査回数/マップ/固定の方針を確認する。
2. 回数や条件を変える場合は新しい計画JSONとして保存し、既存計画・結果を改変しない。
3. 逐次実行。公平な時間制限/CPU負荷比較のため同じマシンで他の長時間テストを同時に走らせない。
4. 条件ごとに推薦（3方式）・外部監査を完了して保存。再実行時は完了条件のSHAを照合しスキップする。
5. 以下は10対応条件＝30推薦で止まる例。同じコマンドを再実行すると次の10条件へ進む。`all`の後の数は模擬冒険数/評価回数でなく、今回新しく完了させる対応条件数。

```sh
node bouken/tests/party-recommendation/engine-comparison/batch.cjs \
  bouken/tests/party-recommendation/engine-comparison/plan-1500.json \
  bouken/tests/party-recommendation/engine-comparison/full-results all 10
```

全500対応条件を一度に実行する場合は最後の`10`を省略。現行は毎回5目的探索、新方式/無作為はその条件で指定された1目的への推薦を1回ずつ行う。4専門目的を各125対応条件に分配。総合モードは新たに定義しない。

外部回数は`plan.auditTrials`を新計画で16/32/64に設定。推薦用3回・現行4/32回はそのまま。計画/エンジン/実験コードのハッシュが違う出力は再開を拒否。未登録JSONが残った場合も上書き拒否。孤立したJSONを別名退避し、完成度・入力・SHAを調べてからmanifestを復旧する。失敗の前後を混ぜて成功扱いしない。

## 未検証・判断保留

- 1,500回本試験、全体の方式差・ばらつき・反復の顔ぶれ。
- 64回が必須という仕様はない。精度/負荷をユーザー判断。合格基準は今回設定しない。
- 新方式のUI/Worker/スマホ/描画。Nodeカーソル時間を画面完了時間としない。
- 現行の銀行は上限8なので10候補達成率は構造的に0。新方式の10候補と比べる際に候補数設定の差を説明する。
- 完全所持の新規仲間は既存O.assumptionsによる未収集の仮定。同じ仮定を3方式へ適用し、実ゲームで未加入が増える意味にはしない。
- 固定のない1枠と複数枠、全員固定、未解放モードを分離し、独立所有セットと同セット反復を別レベルで集計する。
