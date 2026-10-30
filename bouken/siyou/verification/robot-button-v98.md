# ver.98 ロボット状態の画像ボタン

開始ver.97 / main 1174aab。完了ver.98。

robot2.pngの顔を中央38%の位置で拡大表示し、黒背景、丸枠、白太字と黒光彩へ変更。ホームメニュー末尾に配置し、未起動時の非表示・保存・状態画面の開閉は維持する。

検証：robot-state、robot-access、home-growth-notice、git diff --check 合格。実装コミット29c49908d57d25c528c97536c0030d13e0b687ddのVercel Production READY、GitHub/public version.js=98を確認。Cloud Chromeの通常セーブに触れない既存プレビューで390pxの画像ボタンを目視確認。320pxでボタンから状態画面を開く操作も確認。スマホ実機・通常セーブの受入は未確認。
