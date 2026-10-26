# おまかせサーチ工程進捗 検証記録

2026-10-26。実装コミット ed09d05ef4df6488402094b25629775ff9eb0e74。ゲーム版70維持。

## 自動検証
- integration/test.cjs 12件、def-test.cjs、unlocks-test.cjs（Worker検証含む）合格。
- search-progress-test.cjs：5,000メッセージ遷移で直前重複なし、9→10必須、10単独抽選なし。通常・時間上限打切り両経路で10工程を通知、実試行内の小数進捗、後退なし、完了前100%なし、比較完了後100%、元セーブ不変を確認。
- app.js/api.js構文、git diff --check合格。変更範囲は独立integrationと仕様書のみ。本体・マスター・保存形式・version.jsは不変。

## Vercel公開PC
対象デプロイ dpl_5HCBHA1YLC4SBRHzcbhCTc6HG9C2、Git SHA一致・production READY・sansuu-bouken.vercel.appへのaliasを確認。
https://sansuu-bouken.vercel.app/bouken/tests/party-recommendation/integration/index.html

サンプル100種類で読込→初期比較→ほかのおすすめ→有望候補の工程6/10・54.57%→推薦と24試行比較結果まで実操作。サーチ中の面白文更新も確認。画像固定→サーチ→中止でバー消去→Worker再初期化→再サーチ工程1/10・7.5%を確認。実セーブは読んでいない。9→10の組合せは自動検証による確認で、公開画面のランダム抽選では未遭遇。

## 残課題
変更後スマホの表示・操作はユーザー確認待ち。1模擬冒険・1候補生成の内部は同期処理で、その間進捗が止まる場合あり。各工程10%の重みで、経過/残り時間や全組合せ探索率ではない。時間上限・不要工程では次へ進む。推薦品質Eの未合格・正式統合G未承認は継続。ゲーム版70、算数難易度切り替え未着手を維持。
