# おすすめパーティー評価エンジン（独立試作）

ゲーム画面から読み込まれないNode.js用の検証コード。正式機能・正式バランスではない。実セーブ・localStorageへアクセスしない。

## 実行

リポジトリ全体を取得した状態で、Node.js 24を使用する。追加npm依存なし。

```sh
node bouken/tests/party-recommendation/test.cjs
node bouken/tests/party-recommendation/run.cjs
node bouken/tests/party-recommendation/audit.cjs
node bouken/tests/party-recommendation/extra-checks.cjs
node bouken/tests/party-recommendation/timing.cjs
node bouken/tests/party-recommendation/run.cjs --quick
```

`run.cjs --counts=30,100`で対象を限定できる（結果JSONは指定ケースだけで上書きされる）。通常実行は30/100/500/927体、結果は同ディレクトリのresults.json。quickはresults-quick.json。auditは通常結果を前提に、未使用シードで推薦を固定評価する。

`source-manifest.json`は対象ゲームのGit blob SHA。まずtest.cjsで照合し、mainが変わった場合は対象を再調査する。エンジンはリポジトリのcommonとdataを直接読むため、別版のresultsと混在させない。

## 入力・調整

`config.json`：サイズ、正解数予算、累計開拓数、目標大分類、仮の70/30重み、探索数、全シードを設定。`policy:"random"`へ変更すると情報を使わない対照操作になる。試作の合成インベントリはinventorySeedで927体の順列を作り先頭N体を所有とする。枠は現行capacityから取得する。

対応範囲はチュートリアル完了後・1人以上の編成。0体/0枠・チュートリアル中は対象外として拒否する。

実ユーザー状態を使う場合は、外部から安全に受け取った保存内容の複製を`recommend(runtime,{save,owned,slots},config)`へ渡す。`owned`は所有ID、`slots`は解放済み人数以下とし、partyは所有・重複・人数を検査される。セーブを読む/書く機能はこの試作にない。

```js
const E = require('./engine.cjs');
const config = require('./config.json');
const runtime = E.load();
const input = E.fixture(runtime, 100, config);
const result = E.recommend(runtime, input, config);
console.log(result.recommendations);
```

探索方針と候補選択方針はengine.cjsのpolicy、adventure内のvisitへ分離。行動方針へ渡すのはobserveの公開情報のみ。隠れた地形・施設・イベントを渡さない。D04は概算/同値キーでは除外し、実処理では現行ゲームに任せる。

## ファイル

- engine.cjs：隔離VM、出発/正解/施設/全域報酬ドライバ、公開観測と操作、実績評価、候補生成・局所探索。
- config.json：標準条件とシード。
- run.cjs：4所有条件と短時間設定の測定。
- audit.cjs：独立128試行、概算編成との比較、対応付きブートストラップ、行動方針/重み感度。
- test.cjs：実ソースとの一致、再現性、相互作用、67種の完走、保存非変更等。
- extra-checks.cjs / timing.cjs：別サイズ、再現確認、重複超過、時間の再測定。
- extra-results.json / timing-results.json / initial-findings.json：追加結果と改善前の記録。
- source-manifest.json：読み込むゲームコード/マスターの固定版。
- results.json / results-quick.json / audit-results.json：実測値と再検証用サンプル。

数式、条件、測定結果、限界は[検証報告書](../../siyou/おすすめパーティー評価エンジン検証.md)を参照。UIへの組込みや最適性の保証は含まない。
