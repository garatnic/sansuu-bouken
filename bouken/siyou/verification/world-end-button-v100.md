# ver.100 5×5途中終了ボタン

基準：main 3f71353aa72fd30458b36c32d27afd16eb500672 / ver.99。作業中の受入記録を保持。

- world.html：初期hidden、保存済み寸法でhidden判定、hidden時display:none。ホームリンクと既存イベントハンドラは不変。
- 通常3サイズ、5×5、出発回数1/2/8、チュートリアル完了有無24条件を検証。
- 実schema/saveで5×5の位置・進捗を保存/再読込し、再開後も非表示を検証。
- node --test bouken/tests/world-end-button.test.cjs bouken/tests/abandon-world.test.cjs bouken/tests/result.test.cjs：9件合格。
- inline JS構文、表示変更と版クエリ以外のworld.html一致確認合格。
- display:noneとflexの構造確認は自動実施。ブラウザ実行ファイル未配置のためPC目視/スマホ実機/実ブラウザでのホーム移動再開は未確認。
- ユーザー受入待ち。公開確認結果は最終報告に記載。
