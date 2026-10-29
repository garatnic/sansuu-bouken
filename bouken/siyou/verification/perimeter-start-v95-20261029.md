# ver.95 外周開始・A11補完

基準main: 8faa3ceef90a75b67902959200cfb0f890b93943 / ver.94（3ボタン・見本・直接出発・強調見出し反映済み）。2026-10-29。

## 実装

- worldgen.startは5×5だけ(2,2)、通常サイズは外周の全座標を重複なく列挙し一様抽選。生成時だけ呼ぶ。草原予約・E08保護・施設除外は既存startIndex処理を使用。
- A11はLv1→2→3の順に有効な従来パターンを追加し、それぞれ4/8/12まで連結領域の境界を補完する。開始地点からのマンハッタン距離、次にセル番号で昇順。乱数に依存しないため低レベルの領域が高レベルに必ず含まれる。既開拓セルの重複加算なし、初期処理済みは再適用なし。
- A03/B05/累計・実績は既存の出発処理で実数を集計。B01は補完セルからも透視、B06は既存抽選。B02/03は開拓済みセル基準、B04は現在地基準のまま。
- 既存ワールドのstartIndex/player/exploredの移行・再計算なし。保存形式変更なし。world.htmlは初回requestAnimationFrameで現在地へスクロールする既存処理を使用。
- ver.94の画面仕様は維持。各HTML・見本Workerのキャッシュ番号更新。予想Workerのソース照合情報は今回の変更内容と照合して更新（base commitとblob識別）。推薦ロジックの変更なし。

## 自動検証

- perimeter-start.test.cjs: 4テスト合格。5/10/20/30の全1,425座標×4レベルで開拓数・連結・包含・既存パターン・再適用なし。外周全候補の等長抽選区間を各20分割して全候補同数（統計的推測ではなく抽選写像の検査）。四隅を含む。
- 実生成器: 4サイズ×7抽選値×E08 Lv0〜3、草原保護・施設除外・施設配置可能地形を確認。
- A03/B01/B05/B06、B02/B03/B04、開拓/移動、開拓率、中央開始の旧ワールドの実save/load往復を境界で確認。
- a03-threshold/navigation-sense/world-size-picker/world-render/auto-drive/exploration-reward/tutorial/collection/achievements/robot-lifecycle/party-forecast/terrain-distribution/e08-shape 合格。
- forecast-runtimeは最初に未更新のハッシュで失敗。manifestを更新し、実Worker bootstrap・現行版・2/49所持での30問予想を再実行して合格。
- 更新後のforecast-runtime/party-forecast/world-size-picker/perimeter-start: 14テスト合格。
- E08面積保存・施設配置、地形比率の既存試験も合格。過去の測定ファイルの上書きなし。

公開PC画面・対象コミットのProduction反映はコミット後に追記する。スマホ実機、実際のタッチ操作、長時間通常プレイは未実施。ユーザー受入待ち。

## 隔離確認画面

`bouken/tests/perimeter-start-preview.html`。通常localStorageを使わず、実生成器・A11・実world.htmlを使う。30×30右下A11 Lv3を初期値とし、各サイズ・Lv・開始候補を選べる。再読み込みで仮セーブを保持する。
