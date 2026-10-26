# おまかせ編成レーダーUI 検証記録

2026-10-26。実装SHA ed06e546e55f1aebea420e72811f54fbb9134451。ゲーム版70維持。

## 変更ファイル
integration/：app.js、index.html、style.css、radar.js（新規描画モジュール）、radar-test.cjs（新規）、responsive.html。
siyou/：おまかせ編成レーダーUI仕様.md（新規）、おまかせ編成独立検証.md、todo.txt、変更履歴.md、および本検証記録。

## 自動検証
radar-test.cjs：55/1.5/1.5/5、0/負数/上限超過、4軸座標、4補助線、2多角形、8丸点、8実数値枠、再描画の置換、入力非変更、評価ボタン/時間UI撤去、自動評価の導線を確認。
integration/test.cjs 12件、def-test.cjs、search-progress-test.cjs合格。後者は5000遷移/9→10連続/通常・打切り工程/セーブ非変更を含む。構文・diff --check合格。
api.js、worker.js、outcomes.js、phase2/core.js、search-progress.jsは基点cdcd3fcとバイト一致。探索・比較・スコア/試行条件/進捗ロジックは不変。app側の評価呼出しだけ、評価ボタン撤去に合わせランダム/サイズ/全固定モード切替後へ接続。

## Vercel公開PC
デプロイ dpl_EdedypiGoLrx1r4zKKuBKQsHNxwc：production READY、Git SHA一致を確認。
公開画面：https://sansuu-bouken.vercel.app/bouken/tests/party-recommendation/integration/index.html
幅検証：https://sansuu-bouken.vercel.app/bouken/tests/party-recommendation/integration/responsive.html

- サンプル500種類→初期比較→再推薦→比較→確定ダイアログ→閉じるを実操作。
- 青/ピンク重畳、四隅項目と実数値8枠、凡例、4補助線を確認。DOM上の詳細JSONのmetricsとラベル一致（小数2桁表示）。例：今の編成31.58/1.46/0.63/3.96、新編成43.54/1.96/1.46/5.96。お宝1.96と探索5.96は外周座標224/16等で停止し、実数値ラベルは上限で切らない。
- おまかせ→どんどん開拓で更新、開拓61.83マスの外周停止と数値保持を確認。ランダム後にも自動比較が走り、20×20への変更で同一比較APIによる表示更新を確認。詳細表示に開拓力・条件・実スキルを保持。右上戻るでwork非表示と元編成への復帰を確認。
- 320/390/412/800pxのdocument.clientWidthとscrollWidthが一致。SVG寸法は235.19/280.55/299.03/360pxで各正方形。四隅ラベル/凡例/戻る/歯車/下2ボタンに横はみ出しなし。320pxスクリーンショットで重なりや見切れがないことを点検。
- サーチの工程名・面白文・実工程バーを確認。評価ボタン・開拓力の通常表示・比較完了時間表示なし。保存領域の読み書き試行0、仲間シート取得1回（サンプル操作）。実セーブ未操作。

## ユーザー確認と残課題
前回の工程バー・メッセージ・中止再試行は今回ユーザー指示末尾で全項目OKと受入済み。今回レーダー変更後のスマホ実機の見やすさ・タッチはユーザー確認待ち。PCの幅点検を実機合格とはしない。推薦品質Eは未合格、G正式統合は未承認のまま。ゲーム本体・マスター・画像・セーブ形式・版70は変更なし。算数難易度切り替えも未着手。
