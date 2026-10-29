# 出発確認中の経路再指定 ver.91

2026-10-29。開始main: ecf8396e5752adf58167eb8b0798fde1a944ef4e / ver.90。ver.90の提示確認票はユーザー「全部Ok！」により受入済み。

## 変更

world.htmlのtapで、previewing中の手動タップを案内だけで拒否する処理から、既存robot.prepare(i)で予定経路を置き換える処理へ変更。prepareは旧予定をstopで消してから現在地を起点に計算し、同じ既存changedコールバックで旗/順番/距離を更新する。運転開始は従来どおり「しゅっぱつ！」だけ。

開拓済み・未開拓・隣接マスを再指定可能。現在地をタップした場合は長さ0となるため確認解除。出発前は移動/算数/保存/抽選なし。Lv別3/6/無制限の上限と運転開始後のマップ操作ロックは維持。既存auto-drive.js、保存処理、報酬、スキルは変更しない。

変更ファイル：world.html、common/version.js、各画面の?v参照（90→91）、tests/world-render.test.cjs、予想Workerのsource-manifest.json、じどううんてんロボ仕様/todo/変更履歴、ver.90受入記録、本報告書とテストログ。

## 検証

world-renderの7ケース（新規1ケース）とauto-drive/robot-access/navigation-sense/abandon-world/result/f-buffs/event-images/forecast-runtime/party-forecast、計10テストファイルが成功。詳細は[テストログ](robot-route-retarget-v91-tests.json)。新規ケースは実際のtapとrobot制御/経路描画を用い、3/6/無制限の再指定、旧経路消去、隣接未開拓でも出題しない、移動/保存なし、現在地で確認解除、出発後ロック、キャンセルを確認した。予想Workerの実ハッシュbootstrap/30問予想も成功。

実ブラウザはChromium実行ファイルがないため利用不可。DOMアダプターによる実関数回帰を実施し、実機タッチ/表示/操作感はユーザー確認待ち。自動テスト合格を実ブラウザ合格と読み替えない。

## 公開

更新後ver.91。実装コミット：`faa8fe4cc3d17fa6c0f1d4f72c5bc66c9e6f55c1`、main反映成功。

Vercel production `dpl_DHi6qz8z6YVL2AXAifHGH1xQxvkX` はREADYで、Gitコミットが実装コミットに一致。通常ドメインのversion.js / world.html / 予想Workerのsource-manifest.jsonはHTTP 200で、コミットした内容と全文一致を確認（?v=91）。公開URL：https://sansuu-bouken.vercel.app/bouken/index.html 。これは公開ファイル反映の確認で、ブラウザ実操作/実機検証は未実施。本公開記録は後続文書コミットで保存。

## 実機確認票

- [ ] ver.91になっている。
- [ ] 出発確認中に別のマスをタップすると経路・旗・距離が更新され、旧経路が消える。
- [ ] 経路変更だけでは移動/出題せず、「しゅっぱつ！」で新しい経路を進む。
- [ ] 「やめる」で消え、運転中のタップでは経路が変わらない。

**コメント欄（不具合・操作感）**
