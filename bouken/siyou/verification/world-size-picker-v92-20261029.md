# サイズ3ボタンと地形プレビュー ver.92

2026-10-29。開始main: `1ecda42ebafc83f04cdaeb81d3f4e1cdb086f9d1` / ver.91。最新version.js、worldcreate/world/worldgen/world-select.css/party/施設数/チュートリアル/保存と既存仕様を確認して実装した。

## UI

通常のサイズ選択selectを廃止し、10×10・20×20・30×30の排他的な3ボタンに変更。fieldset/legendとbuttonのaria-pressedで選択状態を示す。デフォルトは従来同様10×10。3つは同じ外形で横1列、最小高さ140px、画面幅に合わせて均等縮小する。選択中は緑枠と淡緑背景、非選択も見本を表示。

各ボタン内の正方形表示領域に、10/20/30の辺長を1/3・2/3・全幅で配置する。同じ表示倍率のため、マス数の大きさを面積の違いとして伝える。30×30も枠内に収まる。サイズ名と従来の施設数3/13/30を表示。「マップの見本だよ。出発すると新しい地形になるよ。」を添える。

最初の2回は5×5の固定ラベルだけを表示。途中チュートリアルは新規出発禁止と再開導線を維持し、通常用3ボタンもプレビューも作らない。

## プレビューの生成

- 実際のBoukenWorldGen.generateをそのまま利用する。地形生成・施設配置の救済等を含む同じ規則で一時ワールドを生成し、地形配列だけを取り出す。独自の地形生成アルゴリズムは追加しない。
- パーティーは出発処理と同じowned抽出→BoukenParty.normalize→capacity→buffsで算出する。マスター/スキルは読み取り、セーブ・編成・スキルスナップショットを書き換えない。E08を含む実在キャラの地形スキル合算をテストした。
- Workerには地形/施設/サイズのマスター・計算済みbuffs・対象サイズだけを渡す。セーブ・実績・所持品は渡さず、Workerはworldgen.jsだけを読み込む。戻り値はサイズ/terrainまたは失敗通知。保存/実績/冒険開始APIは実行しない。
- 地形7色の単色Canvas。内部解像度はそれぞれ10×10/20×20/30×30で、1マス1ピクセルをpixelatedで表示。地形・施設・フィールド画像、霧、開始地点、イベント、プレイヤーは描かない。
- 初期操作を有効にしてから初回描画の機会を挟み、Workerで3サイズを生成する。Worker未対応/起動失敗時はidleまたはsetTimeoutで1サイズずつ生成し、処理の間で操作を返す。Workerを使う通常経路では生成計算をUIスレッドに置かない。
- Canvasやマスター取得、生成等の失敗は「見本なし」に置き換えるだけ。選択/出発を無効にしない。プレビュー生成を待ってから出発する制約を作らない。
- ページを開くたびに再生成し、BFCacheからの復帰時もreloadで最新のチュートリアル状態・編成を読み直して再生成する。pagehideではWorkerを終了し、遅い応答を世代番号で破棄する。

プレビューは実際の冒険に採用しない。出発ボタンの既存ハンドラー本体は開始mainと文字列一致であることを確認した（select.valueの読み取り元だけ新UIのコントローラーになった）。再開は既存処理。worldgen.js/party.js/save.js/schema.js/progress.js/events.jsは変更なし、中央開始を維持する。

## 変更ファイル

- worldcreate.html：3ボタン用fieldset、コントローラー接続、読み取り専用プレビュー準備、ページ復帰処理。
- common/world-size-picker.js：選択状態・Canvas・Worker/遅延fallback・失敗時の表示。
- common/world-preview-worker.js：既存生成器による一時地形の生成。
- common/world-select.css：横3列、サイズ別プレビュー、選択強調、固定5×5。
- common/version.jsと各画面のキャッシュ用?v参照（91→92）。world.htmlは参照クエリだけ変更し描画/探索/ロボ処理は変更しない。
- tests/world-size-picker.test.cjs、tests/departure-navigation.test.cjs、tests/achievements.test.cjs、tests/party-recommendation/source-manifest.json。
- README.md、siyou/ホーム画像ボタン・出発導線仕様.md、todo.txt、変更履歴、本報告書、検証ログ。

## テスト

20テストファイルがすべて成功。[実行ログ](world-size-picker-v92-tests.json)。新規UIテストは7ケース。

| 項目 | 結果 |
|---|---|
| 3ボタンの作成、3サイズ選択、aria-pressed、初期値 | 自動テスト成功 |
| 100/400/900マス生成と描画、7地形色、1/3・2/3・全幅の設定 | 実生成器＋DOM/Canvas構造テスト成功 |
| 現在パーティーの正規化/枠制限/重複除外、E08反映 | 自動テスト成功 |
| プレビュー生成だけで保存・記録が変わらない | 実save API＋メモリー保存の書込0件・保存JSON一致 |
| Worker入出力、地形だけの返却、Worker失敗時fallback | 実WorkerエントリーをVMで動かし成功。ブラウザのWorkerスレッド実行は未確認 |
| 再表示時の再生成、BFCache復帰、最新編成の再読込 | ハンドラーと再初期化テスト成功 |
| 各サイズで出発時に新規生成、冒険回数1加算、中央開始 | 実ハンドラー/実マスター/実生成器/実保存処理で成功 |
| 最初の2回の5×5、途中の新規出発禁止、既存ワールド再開 | 自動テスト成功 |
| 確認キャンセルで保存しない | 自動テスト成功。確認UIの描画自体は今回未確認 |
| 生成失敗/Canvas不可/マスター取得失敗で選択維持 | 自動テスト成功。Canvas不可でも通常出発の成功を確認 |
| スマートフォン幅での収まり | CSSの3列/最小幅0/max-width制約を確認。実ブラウザの視覚確認は未実施 |
| 著しい操作遅延がない | 初期操作を待たせない構造・Worker分離・fallbackのタスク分割を確認。スマホの操作感・実時間は未実測 |

既存回帰：departure-navigation/tutorial/exploration-reward/achievements/robot-parts/robot-lifecycle/robot-access/robot-growth/world-render/auto-drive/navigation-sense/abandon-world/result/f-buffs/event-images/forecast-runtime/party-forecast/home-growth-notice/party-recommendation-game。予想Workerのsource-manifestも再生成し、実bootstrap/30問予想が成功。

departure-navigation/achievementsの仮画面に新コントローラーのfixtureを追加。departure-navigationのhome側は元のver.91でもBoukenSchema.growthのfixture不足で失敗したため、その仮APIも補った。ゲームのホーム/称号規則を変更したものではない。

## 制限・未検証

Chromium実行ファイルがないためPlaywrightによるブラウザ画面操作は実行できない。DOMアダプターとVMで代替した。実ピクセルの見え方、320/360/412px等のレイアウト、タッチ、実LocalStorage/ブラウザBFCache・Workerの実動作、Pixel 8aでの操作感はユーザー確認待ち。大規模シミュレーションや速度ベンチマークは行っていない。

現時点で自動テスト範囲の未解決不具合なし。実機未確認を解消済みとは扱わない。

## コミット・公開

更新後ver.92。実装コミット：`027e15750c6f61b4a0050fa590a0b72d7759045d`、main反映成功。

Vercel production `dpl_FFJhA54vVU4qParfRTXACKCLSDFt` はREADYで、Gitコミットが実装コミットに一致し、通常ドメインへのaliasも確認。公開URL：https://sansuu-bouken.vercel.app/bouken/index.html 。

通常ドメインからversion.js / worldcreate.html / world-select.css / world-size-picker.js / world-preview-worker.js / 予想Workerのsource-manifest.jsonをHTTP 200で取得し、6ファイルすべてコミット内容と全文一致を確認（?v=92）。公開HTML・JS・CSSの反映確認であり、公開ブラウザ画面の操作・実機表示は未確認。本公開結果は後続の文書コミットで記録する。

## ユーザー確認票

- [ ] 通常の出発画面に3つのボタンが横並びで表示され、選択中が分かる。
- [ ] 見本が小・中・大に表示され、30×30も枠内に収まる。
- [ ] 画面を開き直すと見本が新しくなり、文字・ボタンがスマホ幅で見切れない。
- [ ] 10×10・20×20・30×30を選んで出発でき、見本とは別のワールドになる。
- [ ] 前のワールドを再開でき、通常探索・自動運転に問題がない。
- [ ] 対象のセーブでは最初の2回が5×5固定で、チュートリアル途中の新規出発禁止が保たれる。

**コメント欄（不具合・見た目・操作感）**

## 今回の正確な変更パス

- `bouken/README.md`
- `bouken/characters.html`
- `bouken/collection.html`
- `bouken/common/version.js`
- `bouken/common/world-select.css`
- `bouken/home.html`
- `bouken/index.html`
- `bouken/party-recommendation.html`
- `bouken/party.html`
- `bouken/records.html`
- `bouken/siyou/todo.txt`
- `bouken/siyou/ホーム画像ボタン・出発導線仕様.md`
- `bouken/siyou/変更履歴.md`
- `bouken/tests/achievements.test.cjs`
- `bouken/tests/departure-navigation.test.cjs`
- `bouken/tests/party-recommendation/source-manifest.json`
- `bouken/world.html`
- `bouken/worldcreate.html`
- `bouken/common/world-preview-worker.js`
- `bouken/common/world-size-picker.js`
- `bouken/siyou/verification/world-size-picker-v92-20261029.md`
- `bouken/siyou/verification/world-size-picker-v92-tests.json`
- `bouken/tests/world-size-picker.test.cjs`

## 2026-10-29 ユーザー受入

ユーザー「全部Ok！」によりver.92の提示確認票を受入。以降のサイズボタン即出発等の変更はver.93の別検証とする。
