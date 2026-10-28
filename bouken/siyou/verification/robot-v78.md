# ver.78 じどううんてんロボ検証

2026-10-28。基準main 024d1d6/ver.77から実装。

## 自動検証
- auto-drive.test.cjs: 6件合格。625組の経路の隣接/最短/直線追従/決定性、進行待ち、中断、スキルで開いた後続セルの移動、同時発見/透視/既知施設、続行、古い応答拒否、到着、異常停止。
- A03閾値、world-portraits、result、achievements、collection、tutorial回帰合格。
- auto-drive.jsとworld.htmlのinline script構文合格。差分空白エラーなし。

## プレビュー実画面
Vercel deployment dpl_HJYxgrV5Lck86fZNALqPtdyYqypH、実装コミットe57aa9724bc8c7e65014bc354f6b3961541663a5、READY（Preview）。公開の本番環境とは別。通常localStorageを読み書きしないtests/auto-drive-preview.htmlと既存仮セーブアダプターを使用。

Cloud Chromeで次を確認した。
- 目的地(2,2)へ(0,0)→(1,0)→(1,1)→(2,1)→(2,2)。4→3→2→1問、到着で表示解除と「目的地に着いたよ」。
- 不正解で選択肢無効化/同じ問題・残数維持、正解で次問。
- 町発見で確認、いいえで次マス、墓地発見ではいを押すと終了。再読み込み後も開拓2/現在地(2,0)を維持し、自動再開しない。
- 保存失敗を有効にして正解しても同じ問題/あと4問を維持。失敗解除後に同じ正答を押すと開拓1/あと3問へ。ロールバック後も進行可能。
- 「やめる（開拓しない）」とEscapeでロボ/問題を解除。
- 開拓済み1～7を順番に通常移動し、現在地(7,0)まで出題なし。8の出題時はあと2問。
- 黄色枠8の手動単発開拓では問題を表示しロボラベルは非表示。
- 390pxで操作、320/412pxで問題の横はみ出しなし（320設定: client/scroll=267、412設定:359）。CSS幅確認であってスマホ実機タッチの代替ではない。
- アプリ由来console error/warnは観測なし。拡張機能/Vercelログインのログは区別した。

画像：[実画面](robot-v78.jpg)。確認用：../../tests/auto-drive-preview.html。

## 公開・残件
GitHub PR #1、codex/jidou-unten-robot-v78へ保存。main直接pushは自動承認レビューで拒否（実装指示のみでは直接main反映の承認が不明確、PRを推奨）。代替としてPRを作成。本番main/Vercel production/GitHub Pagesへの反映は未実施。

スマホ実機・ユーザー実セーブ・長時間、全スキル/施設/全域報酬/チュートリアルの横断結合は未確認。既存の未検証事項を合格へ変更しない。
