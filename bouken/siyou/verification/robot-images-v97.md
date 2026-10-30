# ver.97 ロボット画像接続

開始main: 4a52cf0 / ver.96。完了ver.97。

実画像寸法：本体256×256、部品1280×128、説明4532×618。旧予定5×2を実画像の横10列へ更新。説明先頭は本体、以後imageNo。画像対応10部品・11説明と縦横比をVMで検証。

合格：robot-access、robot-discovery-ui、robot-growth、robot-lifecycle（全15イベント、10部品、保存再読込）、robot-parts、robot-state、robot-worker、home-growth-notice、result、abandon-world（5件）、party-forecast。git diff --check。

研究用party-recommendation/test.cjsはrobotWorldIdの差で失敗。変更前main 4a52cf0でも同じ失敗を再現し、今回の表示変更から独立した既存問題として記録。本件では研究コードを変更しない。

ローカルPlaywrightのブラウザ実行ファイルは未配置。公開画面検証はコミット後に別記。スマホ実機・通常セーブのユーザー受入は未確認。
