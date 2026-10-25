# 算数ぼうけん

小学2年生向けのHTML/CSS/JavaScript製、算数4択で世界を開拓するゲーム。

## 起動・公開先

- Vercel：https://sansuu-bouken.vercel.app/bouken/index.html
- GitHub Pages：https://garatnic.github.io/sansuu-bouken/bouken/
- ローカル：リポジトリのbouken/で`python -m http.server 8000`、またはstart_server.bat。http://localhost:8000/index.htmlを開く。

Vercel/Pagesは別の公開環境で、localStorageもオリジンごとに別。セーブをGitHubへ同期する機能はない。

## 開発の入口

1. [common/version.js](common/version.js)を最新mainから取得する。
2. [仕様と資料一覧](siyou/README.md)、[現在のToDo](siyou/todo.txt)、関連専門仕様を読む。
3. [GitHub運用方針](siyou/GitHub運用方針.md)に従いコード/資料を同時更新し、確認結果を分けて記録する。

ファイル一覧が取得できないときも、上記の既知パスは個別取得できる。過去ZIPやチャット内の固定版番号を最新として使わない。

## 2026-10-25整理時の状態（監査対象ver.69）

探索/算数/施設、0～5人固定編成、図鑑927体、博物館480品と手動ボーナス、120称号、画像チュートリアル、施設イベントカードを実装。67スキルのうちD04は準備中で、66種を実装済み。主要機能は版ごとのユーザー確認済み。全組合せ/全障害/長時間/長期バランスの一括合格を意味しない。

主要な残件は結合・例外検証/実効評価、D04候補、低優先画像名称監査、未収録旧原本/公開整理。[todo.txt](siyou/todo.txt)を参照する。

## テストと確認用画面

Nodeテストはtests/*.test.cjs。対象機能のテストを選んで実行し、実行不能/未実行を区別する。E09過去比較は過去コミット入力の取得依存があるため注意。統計テストの成果物はsiyou/verification/に版固定で保管する。

- [施設演出の実画面・仮セーブ確認](tests/facility-event-preview.html)
- [成長通知・博物館受取の仮セーブ確認](tests/progression-preview.html)
- [固定デザインモック](mocks/facility-events.html)

仮セーブ確認は通常のlocalStorageを読み書きしない。フレーム幅320/390px等の確認を実機タッチの代替としない。

既存クラウドChromeで公開PCを操作可能。Playwright用Chromiumは配布先制限のため再インストール不要。スマホ実機はユーザーが確認し、通常Markdownチェック欄＋コメントで結果を受ける。

## 変更・受入履歴

[変更履歴.md](siyou/変更履歴.md)に導入当時の記録と後続ユーザー回答を保存。2026-10-25にver.69確認票5/5合格を記録済み。旧READMEの各版記述は[整理前原文](siyou/history/20261025整理前/README.md)に保持する。

今回の整理は文書のみ。ゲーム版/処理/マスター/画像/セーブ形式は変更しない。現在版は必ずversion.jsで再確認する。
