# 施設訪問の差分描画：本番統合 ver.90

2026-10-29。作業開始main: `1c64e0b8f50a7819e7a8bf046d23d6b6c5d376ba` / ver.89。
前回調査対象 `4b392f8e746b4129d7b7acaa3b18032e3015b0a8` との差分は調査報告書とZIPの2成果物追加だけ。報告書/ZIPを最新mainから取得し、world-experiment.diff/html・測定結果・検証スクリプトを確認した。

## 実装

- world.htmlのrenderで毎回map.replaceChildrenするのを廃止。各セルの表示キーとDOM参照をページ内だけに保持する。
- 表示キーは地形、開拓/透視状態、開拓可能枠、施設、訪問済み、気配2種、B04矢印、現在地、ロボ運転、出発編成、仲間画像準備の世代を含む。変わらないセルはDOMとCanvasを再利用する。
- createdAt/departureNumber/robotWorldId/サイズ/開始地点をワールド識別に使う。saveでwがコピーされても無効化しない。新ワールド/サイズ変更/子要素数の不整合では全再構築。別DOMへの置換や並べ替えはセルごとのDOM参照不一致で修復する。
- 描画・挿入が成功してからキャッシュを更新する。描画例外後の再試行で古いセルを正しいものと誤認しない。
- 初回は全構築。画像のPromise/既存PNG共有・フォールバック・光彩の描画方法は従来どおり。仲間画像準備完了で世代を更新し、既存の現在地画像更新も維持。
- セーブ形式、保存時点、トランザクション、施設抽選/報酬を変更していない。persist/showVisit/tapは開始mainと同一文字列であることも検査した。

## ロボ経路

既存renderRobotRouteを維持した。毎回、現在のmap内の古い経路マークを除去し、data-robot-labelの元aria-labelを復元してから、現在の未通過robotRouteだけを重ねる。renderのセルが再利用された場合も、置換された場合も必ず最後に実行する。経路の全マップ検索は残すが、地形Canvasは作り直さない。

開始/移動/中断/到着のchangedコールバックは従来どおり実行し、🤖の切り替えも維持。新ワールド識別が変わった場合はロボ制御をstopし、経路/運転状態を消して旧ワールドの経路を残さない。通常の新規出発は従来どおりページ移動でページ内キャッシュも破棄される。

## 回帰テスト

20テストファイルを実行し最終結果すべて成功。詳細ログは[facility-render-tests-20261029.json](facility-render-tests-20261029.json)。大規模な速度再計測は実施していない。

追加world-render.test.cjsの6ケース：

1. 5/10/20/30四方の実施設ハンドラー、結果/保存/訪問済み/B04/B07の旧描画との比較、変更マスだけのCanvas生成。
2. 変更なし・save後コピーで再利用、異物DOM/削除で修復、同サイズの新ワールド全再構築、サイズ変更。
3. 通常開拓の実処理と保存、透視/黄色枠/気配/地形/現在地/編成変更の描画比較。
4. 実デバッグ一括開拓、候補選択/再挑戦/追加品処理、保存失敗の復元、保存/再読込。
5. 実ロボ制御＋実経路描画：開始/移動/ダイアログ待機/中断/到着、経路セル置換、旧ラベル/経路の消去、新ワールド時の運転停止。
6. 描画例外の後でセルの再描画を省略しない。

前回と同様、30×30全開拓でマップ用Canvas生成が施設移動時2枚・確定時1枚であることを生成回数として確認。時間短縮率の新たな主張はしない。

既存実行：f-buffs / auto-drive / navigation-sense / world-portraits / event-images / facility-event-ui / exploration-reward / result / abandon-world / robot-lifecycle / robot-access / robot-parts / robot-growth / robot-state / robot-discovery-ui / forecast-runtime / party-forecast / tutorial / achievements。

旧テストの不整合を2件修正：f-buffsのtap関数切り出し条件が旧シグネチャで、非asyncコードにawaitを取り込んでいた。event-imagesの起動/保存fixtureはmaybeShowResult、clock等が不足。両方とも未変更のver.89で再現し、テストfixtureだけを現在の契約に修正した。ゲームのイベント/保存ロジックは変更していない。

予想Workerのsource-manifestをver.90の実ファイルから再生成し、実bootstrapと30問予想を含むforecast-runtime/party-forecastも成功。

## 未検証と制限

PlaywrightはChromium実行ファイルなしで起動不能。ブラウザのレイアウト/実ピクセル/画像読込遅延/タッチ/フォーカス/スクロール、実LocalStorage、Pixel 8aの操作感は未検証。DOMアダプター・メモリー保存を使った実関数と構造比較で代替した。実ブラウザ合格や速度改善幅の確定とは扱わない。最後の施設後のmaybeShowResultは実関数で呼び、結果スナップショット表示を確認したが、実ブラウザのタイマー/UI合成は未確認。

新規の既知のゲーム不具合は今回の自動テスト範囲では検出していない。全スキル/全編成/全障害/長時間を網羅したという意味ではない。

## 変更ファイル

- 本体：bouken/world.html。
- バージョン/参照クエリ：common/version.js、index/home/worldcreate/party/party-recommendation/characters/collection/records/world.html（89→90、バージョン整合のみ）。
- 予想Worker照合：tests/party-recommendation/source-manifest.json。
- 追加回帰：tests/world-render.test.cjs、tests/helpers/world-render.cjs、tests/helpers/render-dom.cjs、tests/fixtures/world-render-v89.js。
- 既存テストfixture修復：tests/f-buffs.test.cjs、tests/event-images.test.cjs。
- 文書：README.md、siyou/地形・施設画像表示仕様.md、siyou/todo.txt、siyou/変更履歴.md、本報告書、検証JSON、公開結果JSON。

## コミットと公開

更新後バージョン：90。

- 実装コミット：`9b79dc3f69e6c85ac732c42bbe99567f4bb31c5d`（main反映成功）。
- Vercel project：sansuu-bouken / `prj_KMJIjQKn3FxrSxfa9Xt7lTiwzgQh`、target=production。
- deployment：`dpl_9kiPKgHfW7DapKp3YBGPaMXGKq8s`、READY。GitコミットSHAが上記実装コミットに一致し、通常ドメインへのalias割当も確認。
- 公開URL：https://sansuu-bouken.vercel.app/bouken/index.html
- 通常ドメインのcommon/version.jsをHTTP 200で取得し `window.BoukenVersion = 90` を確認。
- 同じ通常ドメインのworld.htmlとtests/party-recommendation/source-manifest.jsonもHTTP 200。3ファイルとも実装コミットに登録した内容と全文一致を確認（?v=90）。
- 公開結果ログ：[facility-render-release-20261029.json](facility-render-release-20261029.json)。
- 公開ファイル反映の確認であり、公開ブラウザ操作・実機速度確認の成功を意味しない。ランタイムエラーログ監視は今回未実施。
- 本節と公開結果ログの保存は後続の文書コミットで行い、実装コミットを改変しない。

## Pixel 8aのユーザー確認票

- [ ] ver.90が表示される。
- [ ] 30×30で見出しをタップして全開拓し、施設を開く/確定する操作の待ち時間が改善した。
- [ ] 施設訪問後に！とB07の該当表示が消え、最後の施設まで見つけられる。
- [ ] B04の矢印が現在地からの方向に変わる。
- [ ] ロボ開始/移動/中止/到着で経路や🤖が正しく切り替わり、残像がない。
- [ ] 5×5〜30×30の通常探索、保存/再読込、新ワールドで表示に問題がない。
- [ ] 仲間加入/失敗と最後の施設後のリザルトが正常。

**コメント欄（不具合・操作感・気づいたこと）**

ユーザー受入待ち。未回答の項目を検証済みにしない。
