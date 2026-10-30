# 検証記録の読み方（2026-10-30）

各ファイルは対象版/SHA時点の記録。旧成功JSONを現在のテスト成功として再利用しない。ユーザー承認は提示確認票だけに限定し、PCのCSS幅確認をスマホ実機へ広げない。現在の残件は[ToDo](../todo.txt)。

## 後続の承認・状態の参照

|対象|確認できた状態|根拠|
|---|---|---|
|ver.71|当該UI確認票は受入済み|[正式統合](../おすすめパーティー正式統合_20261027.md)|
|ver.75/76/77|提示確認票受入、詳細画像修正後も受入|[ToDo](../todo.txt)、[変更履歴](../変更履歴.md)|
|ver.79/80|ルート/施設判定の提示確認票受入、長時間は別|[ToDo](../todo.txt)、[v81記録](robot-abandon-v81.md)|
|ver.83/84/85|各修正/部品/制限の当該確認票受入|[ToDo](../todo.txt)|
|ver.90/91/92/93/95|各提示確認票受入。v94個別の見た目を含めない|[ToDo](../todo.txt)|
|ver.96〜99|2026-10-30の画像/状態ボタン等の当該確認票受入|[v97](robot-images-v97.md)、[v99](robot-button-v99.md)|
|ver.100|確認票4項目受入|[v100](world-end-button-v100.md)|
|Phase1/4・v81/87/88/89/94等|個別受入範囲の根拠が不足。後続の限定承認で埋めない|[現在の残件](../todo.txt)|

## 原本の保全と読込み状態

- robot-state-v86.jpgは現存blobがPillowでデコード不能。書き換え・削除せず、元画像の確認事項として記録。v86の文章検証記録やテスト成果を否定するものではない。
- facility-performance-v89-20261029.zipは84メンバーのCRC検査合格、全メンバーを読込み。ver.89の独立調査の証拠で、差分描画は後続ver.90で本体実装済み。
- docs-v69-check.py等は当時の入力前提を持つ履歴コード。現行での名前/説明不一致を無断修正で隠さない。
- JSONの実測数値/版/SHA、画像、ZIP、CSVを変更しない。

## 元のverification全66ファイル

|ファイル|種別・参照時の注意|
|---|---|
|[character-descriptions-v74.json](character-descriptions-v74.json)|当時の構造化検証/測定記録。全件JSON読込み済み|
|[character-detail-v77.md](character-detail-v77.md)|当時の報告・手順/検証コード。対象版を確認|
|[characters-audit-20261025.json](characters-audit-20261025.json)|当時の構造化検証/測定記録。全件JSON読込み済み|
|[characters-party-audit.cjs](characters-party-audit.cjs)|当時の報告・手順/検証コード。対象版を確認|
|[departure-heading-v94-20261029.md](departure-heading-v94-20261029.md)|当時の報告・手順/検証コード。対象版を確認|
|[detail-v77-1793189387372.jpg](detail-v77-1793189387372.jpg)|当時の証拠画像/ZIP|
|[direct-size-departure-v93-20261029.md](direct-size-departure-v93-20261029.md)|当時の報告・手順/検証コード。対象版を確認|
|[direct-size-departure-v93-tests.json](direct-size-departure-v93-tests.json)|当時の構造化検証/測定記録。全件JSON読込み済み|
|[docs-v69-audit.json](docs-v69-audit.json)|当時の構造化検証/測定記録。全件JSON読込み済み|
|[docs-v69-check.py](docs-v69-check.py)|当時の報告・手順/検証コード。対象版を確認|
|[e08-v47-comparison.png](e08-v47-comparison.png)|当時の証拠画像/ZIP|
|[e08-v47-report.md](e08-v47-report.md)|当時の報告・手順/検証コード。対象版を確認|
|[e08-v47-results.json](e08-v47-results.json)|当時の構造化検証/測定記録。全件JSON読込み済み|
|[e09-v48-migration.json](e09-v48-migration.json)|当時の構造化検証/測定記録。全件JSON読込み済み|
|[e09-v48-migration.md](e09-v48-migration.md)|当時の報告・手順/検証コード。対象版を確認|
|[facility-performance-v89-20261029.md](facility-performance-v89-20261029.md)|当時の報告・手順/検証コード。対象版を確認|
|[facility-performance-v89-20261029.zip](facility-performance-v89-20261029.zip)|当時の証拠画像/ZIP|
|[facility-render-optimization-20261029.md](facility-render-optimization-20261029.md)|当時の報告・手順/検証コード。対象版を確認|
|[facility-render-release-20261029.json](facility-render-release-20261029.json)|当時の構造化検証/測定記録。全件JSON読込み済み|
|[facility-render-tests-20261029.json](facility-render-tests-20261029.json)|当時の構造化検証/測定記録。全件JSON読込み済み|
|[forecast-v83.jpg](forecast-v83.jpg)|当時の証拠画像/ZIP|
|[forecast-v83.md](forecast-v83.md)|当時の報告・手順/検証コード。対象版を確認|
|[party-current-forecast-v72.md](party-current-forecast-v72.md)|当時の報告・手順/検証コード。対象版を確認|
|[party-forecast-v72.jpg](party-forecast-v72.jpg)|当時の証拠画像/ZIP|
|[party-forecast-v72.json](party-forecast-v72.json)|当時の構造化検証/測定記録。全件JSON読込み済み|
|[party-green-buttons-20261026.md](party-green-buttons-20261026.md)|当時の報告・手順/検証コード。対象版を確認|
|[party-radar-help-20261026.md](party-radar-help-20261026.md)|当時の報告・手順/検証コード。対象版を確認|
|[party-radar-layout-20261026.md](party-radar-layout-20261026.md)|当時の報告・手順/検証コード。対象版を確認|
|[party-radar-ui-20261026.md](party-radar-ui-20261026.md)|当時の報告・手順/検証コード。対象版を確認|
|[party-search-progress-20261026.md](party-search-progress-20261026.md)|当時の報告・手順/検証コード。対象版を確認|
|[party-source-pin-fix-20261025.md](party-source-pin-fix-20261025.md)|当時の報告・手順/検証コード。対象版を確認|
|[perimeter-start-v95-20261029.md](perimeter-start-v95-20261029.md)|当時の報告・手順/検証コード。対象版を確認|
|[result-v75-1793187857495.jpg](result-v75-1793187857495.jpg)|当時の証拠画像/ZIP|
|[result-v75.md](result-v75.md)|当時の報告・手順/検証コード。対象版を確認|
|[robot-abandon-v81.jpg](robot-abandon-v81.jpg)|当時の証拠画像/ZIP|
|[robot-abandon-v81.md](robot-abandon-v81.md)|当時の報告・手順/検証コード。対象版を確認|
|[robot-access-v85.jpg](robot-access-v85.jpg)|当時の証拠画像/ZIP|
|[robot-access-v85.md](robot-access-v85.md)|当時の報告・手順/検証コード。対象版を確認|
|[robot-button-v98.md](robot-button-v98.md)|当時の報告・手順/検証コード。対象版を確認|
|[robot-button-v99.md](robot-button-v99.md)|当時の報告・手順/検証コード。対象版を確認|
|[robot-facility-v80.jpg](robot-facility-v80.jpg)|当時の証拠画像/ZIP|
|[robot-facility-v80.md](robot-facility-v80.md)|当時の報告・手順/検証コード。対象版を確認|
|[robot-growth-v82.jpg](robot-growth-v82.jpg)|当時の証拠画像/ZIP|
|[robot-growth-v82.md](robot-growth-v82.md)|当時の報告・手順/検証コード。対象版を確認|
|[robot-image-no-v96.md](robot-image-no-v96.md)|当時の報告・手順/検証コード。対象版を確認|
|[robot-images-v97.md](robot-images-v97.md)|当時の報告・手順/検証コード。対象版を確認|
|[robot-parts-v84.jpg](robot-parts-v84.jpg)|当時の証拠画像/ZIP|
|[robot-parts-v84.md](robot-parts-v84.md)|当時の報告・手順/検証コード。対象版を確認|
|[robot-route-retarget-v91-20261029.md](robot-route-retarget-v91-20261029.md)|当時の報告・手順/検証コード。対象版を確認|
|[robot-route-retarget-v91-tests.json](robot-route-retarget-v91-tests.json)|当時の構造化検証/測定記録。全件JSON読込み済み|
|[robot-route-v79.jpg](robot-route-v79.jpg)|当時の証拠画像/ZIP|
|[robot-route-v79.md](robot-route-v79.md)|当時の報告・手順/検証コード。対象版を確認|
|[robot-state-v86.jpg](robot-state-v86.jpg)|画像デコード不能・原本維持・復旧判断待ち|
|[robot-state-v86.md](robot-state-v86.md)|当時の報告・手順/検証コード。対象版を確認|
|[robot-v78.jpg](robot-v78.jpg)|当時の証拠画像/ZIP|
|[robot-v78.md](robot-v78.md)|当時の報告・手順/検証コード。対象版を確認|
|[terrain-v48-blessings.png](terrain-v48-blessings.png)|当時の証拠画像/ZIP|
|[terrain-v48-e08.png](terrain-v48-e08.png)|当時の証拠画像/ZIP|
|[terrain-v48-report.md](terrain-v48-report.md)|当時の報告・手順/検証コード。対象版を確認|
|[terrain-v48-results.json](terrain-v48-results.json)|当時の構造化検証/測定記録。全件JSON読込み済み|
|[title-debug-ten-v70.md](title-debug-ten-v70.md)|当時の報告・手順/検証コード。対象版を確認|
|[world-end-button-v100.md](world-end-button-v100.md)|当時の報告・手順/検証コード。対象版を確認|
|[world-party-v76.md](world-party-v76.md)|当時の報告・手順/検証コード。対象版を確認|
|[world-size-picker-v92-20261029.md](world-size-picker-v92-20261029.md)|当時の報告・手順/検証コード。対象版を確認|
|[world-size-picker-v92-tests.json](world-size-picker-v92-tests.json)|当時の構造化検証/測定記録。全件JSON読込み済み|
|[world-v76-1793189028615.jpg](world-v76-1793189028615.jpg)|当時の証拠画像/ZIP|
