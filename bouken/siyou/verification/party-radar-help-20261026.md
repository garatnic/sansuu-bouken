# レーダーカード短縮・ヘルプ移動の検証

2026-10-26。実装 d36e9d447953fb5e59b186283c6c1e56bcabea84。対象Vercel dpl_CWJV6SVjrgcqPQGD3Sc6v5LotSdy、production READY・SHA一致。

変更ファイル：integration/index.html、style.css、siyou/おまかせ編成レーダーUI仕様.md、todo.txt、変更履歴.md、本記録。HTML/CSSのみの表示改修で、app.js/評価/探索/進捗/描画計算/ボタン処理/ゲーム本体/版番号に変更なし。version.js=70。

radar-test.cjs、diff --check合格。公開responsive.htmlのサンプル100種類で初期評価、message-circle-question型SVGヘルプ押下→既存の詳細試算dialogが開くことを実操作。44×44pxの操作領域とaria-labelを確認。詳細行を見出し横へ移動し、凡例下からチャートまでの間隔を2pxへ短縮。

320/390/412pxでdocument.clientWidth=scrollWidth。両ボタンともclientWidth=scrollWidth、clientHeight=scrollHeight=48pxで文字切れなし。必要時は折返し。評価カード高は順に262.56/299.77/321.77px。412pxのスクリーンショットで凡例/ヘルプ/数値/チャート/ボタンを点検、カード下の詳細リンク行なし。

公開先：https://sansuu-bouken.vercel.app/bouken/tests/party-recommendation/integration/index.html

変更後スマホ実機の画面内への収まり方・タッチはユーザー確認待ち。端末の表示領域や診断文の長さによる縦スクロールはあり得る。独立画面のみ、本体統合G未承認を維持。
