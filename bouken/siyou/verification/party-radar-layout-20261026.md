# レーダー配置調整 検証

2026-10-26。実装0647757afceffec368dced103cc7d6c71972fe11、最小幅の上下間隔調整5d1132e9510400d9df25071efc89ec709a7099a6。後者Vercel deployment dpl_ButKzHHxhSkPHe1tUB2Mf4DKRpgH、production READYとSHA一致確認。

変更：integration/style.css、radar.js（formatのみtoFixed(1)）、index.html（キャッシュ識別子のみ）、radar-test.cjs、siyou/おまかせ編成レーダーUI仕様.md、todo.txt、変更履歴.md、本記録。

radar-test.cjsとdiff --check合格。app.js/api.js/worker.js/outcomes.js/search-progress.jsは基点e5f5793とバイト一致。描画座標/上限/内部計算/ボタン処理は不変。小数1桁表示だけであり、内部値は丸めない。

公開responsive.htmlの同一iframeで320/390/412/800pxを確認。全幅でdocument.scrollWidth=clientWidth、SVGは正方形、4指標はSVGと非交差・画面外なし、実数値8個はすべて小数1桁。上下ラベルの間隔は最小幅でも6px。凡例は中央横一列、指標の青→ピンクは縦配置・左右揃えを保持。
チャートレイアウト高は320幅で172.375px、390幅203.969px、412幅225.969px、800幅373.969px。従来320幅は約417pxであり大幅短縮。グラフ幅は150/204/226/374px、左右数値の残幅を全使用。最小幅では左右の文字の可読性を維持するため中央グラフは小さくなる。
公開サンプル100種類の初回比較→再推薦→候補更新→選択ダイアログ→閉じるを実操作。30.0→32.8マス等のラベルと図形更新を確認。旧比較計算の精度は保持。実セーブは未操作。

公開URL：https://sansuu-bouken.vercel.app/bouken/tests/party-recommendation/integration/index.html

変更後のスマホ実機の見た目・タッチはユーザー確認待ち。ゲーム本体未統合、version.js=70維持。E品質未合格・G未承認は継続。
