# ver.97 ロボット画像接続

開始main: 4a52cf0 / ver.96。完了ver.97。

実画像寸法：本体256×256、部品1280×128、説明4532×618。旧予定5×2を実画像の横10列へ更新。説明先頭は本体、以後imageNo。画像対応10部品・11説明と縦横比をVMで検証。

合格：robot-access、robot-discovery-ui、robot-growth、robot-lifecycle（全15イベント、10部品、保存再読込）、robot-parts、robot-state、robot-worker、home-growth-notice、result、abandon-world（5件）、party-forecast。git diff --check。

研究用party-recommendation/test.cjsはrobotWorldIdの差で失敗。変更前main 4a52cf0でも同じ失敗を再現し、今回の表示変更から独立した既存問題として記録。本件では研究コードを変更しない。

ローカルPlaywrightのブラウザ実行ファイルは未配置。公開画面検証はコミット後に別記。スマホ実機・通常セーブのユーザー受入は未確認。

公開確認：実装コミット03322430baaf9d906ab2b5f24b94213d9e8bef99のVercel Production READYを確認。公開version.jsは97。Cloud Chromeの仮データプレビューで本体画像、全10部品のDOM、部品一覧の画像、レーダー説明（先頭本体を飛ばした2枚目）と戻る操作を確認。390px/320px幅で目視確認。通常セーブは操作せず。スマホ実機は未確認。


## 2026-10-30 ユーザー受入完了（このチャット）
ユーザー「このチャットで要検証のもの、全部Ok！」により、このチャットで提示した確認項目をすべて受入済みとする。対象：ver.96の表示/既存セーブ再開/既存ロボ機能、ver.97の本体・部品画像/説明の対応/スマホ表示・スクロール・閉じる/保存再開、ver.98の画像ボタン/状態画面開閉/保存再開、ver.99の白背景/共通角丸/スマホ表示・操作・保存再開。端末詳細は今回未申告。研究用テストの既存失敗や、このチャット外の保留事項の合格へは拡大しない。ver.98の黒背景と大きい角丸はver.99で変更済み。
