# ver.82 ぼうけんロボ成長 Phase 1 検証

基準main：4b364dbfe0db0cbbb2f64ffc4d6b4f2daf574954 / version81。

- robot-growth.test.cjs：22/23境界、重複除外、飛び越し、中断・再生成・再読込で待機維持、通常リザルト直前／途中終了の発見確定、保存失敗で待機保持・再試行、古い保存からの巻き戻り防止、4枠境界、ホーム1件・枠優先・起動保留。
- result / abandon-world / tutorial / home-growth-notice / party-recommendation-game / party-restore / collection / achievements 回帰確認。
- 本体HTML inline構文、git diff --check。

テスト用の仮セーブを使用。実利用者の保存にはアクセス・削除していない。
ローカルPlaywrightはChromium実行ファイルがなく、ブラウザ実画面は未確認。公開確認結果は後追い記録する。スマホ実機・ユーザー受入は待ち。
