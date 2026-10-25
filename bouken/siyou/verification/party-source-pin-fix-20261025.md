# おまかせ起動停止の修正・公開確認

2026-10-25、修正コミット d58b453fded5567e37e59e64d31a8e9325dabc05。

原因はキャラクター名称・説明更新後のsource-manifest照合ハッシュ更新漏れ。承認済み本文のハッシュへ更新し、旧研究用manifestを別名保存。全ゲームロジックのハッシュは不変。照合を無効化せず、テキスト取得のno-storeと独立JS読込識別子を更新した。

GitHub Pages公開PCで、準備完了/実セーブ読込ボタン有効、サンプル100種類の読込、初期24試行の評価、ほかのおすすめ、サーチ進捗バー、推薦後の比較完了を確認。開拓30.00→32.79、開拓力1000→1093。実セーブは読まず、サンプルのみ使用。スマホ再確認は未実施。

Node：integration/test.cjs 12件、def-test.cjs、unlocks-test.cjs（Worker含む）、第1段階test.cjs 17件に合格。version.js=69維持、ゲーム本体/画像/セーブ無変更、Vercel操作なし。todo.txt/変更履歴の公開後確認待ちは本記録の範囲で解消。E品質未合格とG正式統合禁止は継続。

公開先：https://garatnic.github.io/sansuu-bouken/bouken/tests/party-recommendation/integration/index.html
