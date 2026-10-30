# ver.101 適性UI検証

開始main 91d11629c7dbd64d9326d77f568d4bd747574a17、version.js=100。変更後101。

- characters.json全927体×5整数（0〜100）、欠損/不正0。5属性合計最大192、ID230/539/671/792/831/898。マスター変更なし。
- 固定192で全幅/96=50%/0=0%、全927体の一覧/詳細幅と色の一致、共通詳細の任意表示と省略時クリア/再利用をaptitude-ui.test.cjsで検査。
- party-restore、party-recommendation-game、forecast-runtime（実Worker bootstrap/30問）、world-portraits、encyclopedia、party-forecast、robot-accessの既存8試験合格。
- 一覧の20体遅延描画・選択/保存関数は維持。characters.json/計算/スキル/自動編成ロジック/セーブ形式差分なし。
- source-manifest再生成は版更新の必須手順。監査G-01の古い照合値も解消、照合の無効化なし。
- Git差分空白チェック・追加JS構文合格。

## GitHub・Vercel・公開ブラウザ

実装コミット5fb93e6d8232f7cd0af5b9375c9b2b5251bd7942をmainへ反映。Vercel dpl_WtYjmeu7B71ahbg7BEZYhbjyxC5Jはproduction READY、同一SHA、alias sansuu-bouken.vercel.appへの割当を確認。

既存tests/party-recommendation-preview.htmlの隔離QA保存領域で927体を所持し、実party.htmlを確認。通常セーブは使用しない。

- 一覧20本、各8px、5色。名前検索/条件全解除/詳細開閉、編成＋/枠選択/解除/復元/再読込後の編成保持を確認。
- 最大例No.230ドラゴルド：135pxのトラックに45+0+40.78125+49.21875+0=135px。詳細は64/0/58/70/0、色順一致。
- 320/390/412pxのiframeでdocument clientWidth/scrollWidthは305/305、375/375、397/397。詳細clientWidth/scrollWidthは252/252、322/322、344/344。横はみ出しなし。実スマホのviewport/タッチ/速度とは区別する。
- 詳細の画像は120×120px、名前/説明/スキルを保持。表示だけではQA writes=0。編成保存後、旧QA仮セーブのunchangedExceptPartyはfalseとなるため、この旧fixture指標をセーブ全項目不変の証明には使用しない（既存保存正規化・実績等を含む）。セーブ/選択処理はコード差分なし、コピー分離・ワールド維持は既存Node試験で確認。
- ブラウザ操作ツールの一時タイムアウト1回後、状態を読み直し再操作して正常。観測ログ末尾10件はChrome拡張のmetadata送信エラーで、アプリ由来エラーとは区別。

実スマホ速度/タッチ/ユーザー受入は未確認。

## 変更ファイル

- `bouken/characters.html`
- `bouken/collection.html`
- `bouken/common/character-detail.js`
- `bouken/common/version.js`
- `bouken/home.html`
- `bouken/index.html`
- `bouken/party-recommendation.html`
- `bouken/party.html`
- `bouken/records.html`
- `bouken/siyou/README.md`
- `bouken/siyou/todo.txt`
- `bouken/siyou/キャラクター詳細・スキル強調仕様.md`
- `bouken/siyou/キャラクター適性スコア理論採点仕様_v2.md`
- `bouken/siyou/キャラクター適性スコア開発ロードマップ.md`
- `bouken/siyou/ゲーム仕様書.txt`
- `bouken/siyou/変更履歴.md`
- `bouken/siyou/実装構成・運用方針.md`
- `bouken/siyou/更新内容と未決定事項.txt`
- `bouken/tests/party-recommendation/source-manifest.json`
- `bouken/world.html`
- `bouken/worldcreate.html`
- `bouken/common/aptitude-ui.css`
- `bouken/common/aptitude-ui.js`
- `bouken/siyou/verification/aptitude-ui-v101.md`
- `bouken/tests/aptitude-ui.test.cjs`
