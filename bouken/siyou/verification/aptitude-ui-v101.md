# ver.101 適性UI検証

開始main 91d11629c7dbd64d9326d77f568d4bd747574a17、version.js=100。変更後101。

- characters.json全927体×5整数（0〜100）、欠損/不正0。5属性合計最大192、ID230/539/671/792/831/898。マスター変更なし。
- 固定192で全幅/96=50%/0=0%、全927体の一覧/詳細幅と色の一致、共通詳細の任意表示と省略時クリア/再利用をaptitude-ui.test.cjsで検査。
- party-restore、party-recommendation-game、forecast-runtime（実Worker bootstrap/30問）、world-portraits、encyclopedia、party-forecast、robot-accessの既存8試験合格。
- 一覧の20体遅延描画・選択/保存関数は維持。characters.json/計算/スキル/自動編成ロジック/セーブ形式差分なし。
- source-manifest再生成は版更新の必須手順。監査G-01の古い照合値も解消、照合の無効化なし。
- Git差分空白チェック・追加JS構文合格。

公開PCのブラウザ確認は反映後に追記。実スマホ速度/タッチ/ユーザー受入は未確認。
