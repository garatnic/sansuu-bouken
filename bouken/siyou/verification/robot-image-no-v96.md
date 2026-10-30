# ver.96 ロボットパーツ画像管理用連番

2026-10-30。作業開始 main: 888df76cadc50b8aa459e75653d26c8eee4c9b26 / window.BoukenVersion=95。完了版96。

- schema.jsのrobotFeatures 10定義にimageNo整数1〜10を明示。指定IDとの対応、重複・欠番なしを検証。
- 変更前HEADの定義と、imageNoだけ除いた変更後定義を全文比較して一致。既存ID・part・label・help・count・sizeは不変。
- 保存キーbouken.save.v1・schemaVersion=1不変。変更前定義で作成したstage 0〜4の既存データを新旧normalizeSave/robotAccessへ通し、保存内容と利用可否が同一。
- node --check common/schema.js、git diff --check合格。
- node --test bouken/tests/robot-*.test.cjs bouken/tests/auto-drive.test.cjs bouken/tests/home-growth-notice.test.cjs bouken/tests/forecast-runtime.test.cjs bouken/tests/party-forecast.test.cjs bouken/tests/party-recommendation-game.test.cjs：22/22合格。
- 全15成長イベント・10部品の順序/取得/装着/説明、旧世界/別サイズ除外、二重報酬防止、保存失敗/再試行、既存セーブ互換、機能制限、読み取り専用状態画面、自動運転、Worker実ハッシュbootstrapと30問予想を含む。
- 初回のforecast-runtimeはschema.js更新に伴うソースハッシュ不一致を検出。既存再生成スクリプトでsource-manifest.jsonを更新し、再実行合格。推薦アルゴリズム・評価式は変更しない。
- 本体HTML/プレビューWorkerの?v=96、予想用manifest.version=96・対象ソースハッシュを更新。
- 画像・描画・取得演出・画面デザインは未変更。robot_parts.png追加と番号による描画接続はToDo。
- スマホ実機・ユーザー通常セーブでの再開は未実施。公開反映はコミット後に確認する。

## GitHub・公開反映確認

- 実装コミット: 5bed9534e8451cef550b3d97c0af8295dd6a1e0d。mainへexpected_sha指定で反映し、GitHubのschema.js全文・version.js=96とコミットtreeを確認。
- Vercel Production: dpl_FnPEwY8zjGE2Kouyp7scMyFH4zLN / READY / GitHub SHA一致。
- 公開先: https://sansuu-bouken.vercel.app/bouken/ 。common/version.js、common/schema.js、tests/party-recommendation/source-manifest.json、home.htmlをHTTP 200で取得し、更新後ファイルとバイト単位で一致。
- ブラウザ操作・スマホ実機・ユーザー通常セーブでの確認は未実施。今回は画像管理メタデータ追加のみ。
