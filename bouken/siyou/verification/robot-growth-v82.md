# ver.82 ぼうけんロボ成長 Phase 1 検証

基準main：4b364dbfe0db0cbbb2f64ffc4d6b4f2daf574954 / version81。

- robot-growth.test.cjs：22/23境界、重複除外、飛び越し、中断・再生成・再読込で待機維持、通常リザルト直前／途中終了の発見確定、保存失敗で待機保持・再試行、古い保存からの巻き戻り防止、4枠境界、ホーム1件・枠優先・起動保留。
- result / abandon-world / tutorial / home-growth-notice / party-recommendation-game / party-restore / collection / achievements 回帰確認。
- 本体HTML inline構文、git diff --check。

テスト用の仮セーブを使用。実利用者の保存にはアクセス・削除していない。
ローカルPlaywrightはChromium実行ファイルがなく、Cloud Chromeで公開の仮セーブ確認ページを操作した。

## 公開確認
- 実装PR #5をmainへマージ：328f276a83d73b63b228183b69909d7969b6e751。
- 仮セーブ確認ページ追加：22b7d645737a38ffa98d5acb7d07e38e6dfc684f。
- Vercel production dpl_7dEo8LBUrwGTxLdHJC84S4nq28mw READY、対象コミット一致、sansuu-bouken.vercel.appへ割当済み。タイトル画面のバージョン82を実ブラウザで確認。mainのversion.jsも82。
- 実際のworld.html/home.htmlをsrcdocへ読み込み、保存だけをメモリ内アダプターに置換。通常セーブは読まず書かない。
- 23種類の完全クリア結果に「ふしぎなもの」とホーム案内を確認。ホームで起動通知→確認→discovery:3、状態ボタン出現を確認。
- 49種類で枠と起動が重なると2人枠通知が先。確認でdiscovery:2/partyCapacity:2を保存し、次回ホームで起動通知を表示。
- 「やめる」確認後は「おつかれさま」の途中終了リザルトにふしぎなものを追加し、discovery:2へ進む。
- 390pxの確認枠で起動通知を表示。スマホ実機の代替とはしない。

[仮セーブ確認ページ](../../tests/robot-growth-preview.html) / [起動画面](robot-growth-v82.jpg)

スマホ実機・ユーザー受入は待ち。GitHub Pagesの反映確認は今回未実施。
