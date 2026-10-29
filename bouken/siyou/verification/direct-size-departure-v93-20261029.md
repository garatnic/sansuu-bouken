# サイズボタンからの直接出発 ver.93

2026-10-29。開始main: `3c502c9c4106d0a87e7ca2bd07b5248422e9f36b` / ver.92。ver.92の提示確認票はユーザー「全部Ok！」で受入済み。

## 変更

- 見出しを「新しいワールドへ出発！」に変更。
- ボタン内の施設数（読み上げラベルも含む）、見本の説明、独立した出発ボタン、長い既存ワールド置換案内を削除。
- 10/20/30のサイズボタンを押すと、そのサイズで従来の新規生成・保存・world.htmlへの遷移を行う。
- 既存ワールドが未完了（全マス＋全施設の完了判定がfalse）ならモーダルで置換確認。「はい」で出発、「いいえ」/Escapeで生成・保存せず戻る。既存なし・完全クリア済みなら置換確認なし。
- 確認中/生成中はサイズと再開の操作を無効化し、二重生成を防止。キャンセル/保存失敗後は再操作可能。
- 最初の2回は5×5の出発ボタンを表示。途中のチュートリアルは5×5の固定ラベルだけで新規出発不可。第2出発の既存編成確認と再開処理を維持する。
- プレビュー・施設抽選/報酬・生成規則・中央開始・保存形式は維持。確認のはいまで生成・保存を開始しない。

## テスト

関連20テストファイルすべて成功。[実行ログ](direct-size-departure-v93-tests.json)。サイズUIの実関数テストは8ケース。各サイズからの直接出発、最初の2回の5×5、途中の新規出発禁止、再開、見本の非保存/Worker/fallback、未完了世界のはい/いいえ/Escape、確認中の別サイズ連打による二重処理防止、完了済み世界で確認なし、保存失敗後の再操作を確認。予想Workerのsource-manifestも再生成し実bootstrap/30問予想が成功。

ブラウザはChromium実行ファイルなしのため、実関数とDOMアダプター/VMによる代替検証。モーダルの実画面・タッチ・実LocalStorage・スマホの表示はユーザー確認待ち。全スキル/長時間を網羅したものではない。

## 変更ファイル

worldcreate.html、common/world-size-picker.js、common/world-select.css、common/world-preview-worker.js（キャッシュ参照のみ）、common/version.js、各画面の?v参照、tests/world-size-picker.test.cjs、tests/departure-navigation.test.cjs、予想Worker source-manifest、関連仕様/todo/変更履歴、ver.92受入記録、本報告書とログ。

## コミット・公開

更新後ver.93。実装コミット：`b9087350aa1a26917e122ea23fb9a2c40bb88120`、main反映成功。

Vercel production `dpl_H4CU9xqp5oMmcpJdRyoK7uQhhq22` はREADY、Gitコミットが実装コミットに一致。通常ドメインのversion.js/worldcreate.html/world-select.css/world-size-picker.js/world-preview-worker.js/予想Worker source-manifest.jsonをHTTP 200で取得し、6ファイルともコミット内容と全文一致を確認（?v=93）。公開URL：https://sansuu-bouken.vercel.app/bouken/worldcreate.html 。公開ファイルの確認であり、実ブラウザ操作/実機表示は未確認。この公開結果は後続の文書コミットで保存する。

## 確認票

- [ ] 施設数・説明文・独立した出発ボタンが消え、見出しが新しくなった。
- [ ] サイズボタンを押すと、そのサイズで出発できる。
- [ ] 中断中ワールドは確認が出て、いいえ/閉じる操作で元の状態を保てる。
- [ ] はいで出発でき、前のワールドの再開と通常探索も正常。

**コメント欄（不具合・気づいたこと）**

## 2026-10-29 ユーザー受入

ユーザー「全部Ok！」によりver.93の提示確認票を受入済み。
