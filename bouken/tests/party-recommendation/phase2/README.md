# おすすめパーティー評価エンジン・第2段階

独立した研究用コード。ゲーム本体から読み込まれない。第1段階のengine.cjs・設定・実測JSON・報告書を上書きしない。

## Node.jsで再実行

リポジトリ全体、Node.js 24、追加npm依存なし。

```sh
node bouken/tests/party-recommendation/test.cjs
node bouken/tests/party-recommendation/phase2/test.cjs
node bouken/tests/party-recommendation/phase2/run.cjs
node bouken/tests/party-recommendation/phase2/validate.cjs
node bouken/tests/party-recommendation/phase2/ablate.cjs
node bouken/tests/party-recommendation/phase2/speed.cjs
node bouken/tests/party-recommendation/phase2/policy-check.cjs
node bouken/tests/party-recommendation/phase2/long-horizon.cjs
```

runは13条件を逐次実行し、results/へケースごとに保存する。`--case=legacy-927`等で限定可能。validateは標準結果を読み、選抜に使わない141001以降のシードで候補を比較する。ablateは500体の同一入力で予算上限500冒険の方法比較と、完走経路の速度比較を行う。測定時は他の重い処理を同時実行しない。

## 構成

- core.js：Node/Worker共通のUMDモジュール。ゲームの共通処理を呼ぶドライバ、公開観測、自動操作、正規化、概算、候補探索。
- node.cjs：第1段階のソースハッシュ検査と隔離VMを再利用するNodeアダプター。
- config.json：探索設定、シード、評価式、予算。
- run.cjs：合成手持ち・進行・サイズの条件行列。
- validate.cjs：第1段階/概算との比較、正規化・重み・弱点評価・順位安定性、独立試行。
- ablate.cjs：2人交換・再初期化・ビーム・不確実性配分の比較。
- test.cjs：第1段階との経路一致、67種、保存非変更、観測境界、専門下限、キャンセル等。
- browser.html / browser.js / worker.js：独立ブラウザ測定ページ。
- responsive.html：320/390/800pxのCSS表示点検用。実機性能の再現ではない。
- speed.cjs / policy-check.cjs / long-horizon.cjs：交互順序の完走速度、公開情報を使う操作、全域報酬を含む長期指標。
- results/：各条件の入力・設定・段階結果・生指標・独立比較・サンプル。

## ブラウザ試作

HTTPSまたはlocalhostでbrowser.htmlを開く（file:直開きは不可）。ゲームのlocalStorageや実セーブは読み書きしない。手持ち・所持品・受取済み状態は合成データだけ。

Workerは既存のゲームソースとマスターを取得し、../source-manifest.jsonのGit blob SHAに一致することを検査する。検証したコードのBlobをimportScriptsで読み込む。主スレッドでは候補生成・模擬冒険を行わず、進捗表示と操作だけを行う。

- 探索開始：短時間の暫定結果→探索→追加試行の進捗を表示。
- 現在の候補から追加探索：同じ入力なら候補IDを引き継いで再探索。試行キャッシュの持越しは未実装なので過去試行を再計算する。
- 計算を中止：Worker.terminate()で停止。直前の表示結果を残す。
- 結果JSONを保存：設定、経過時間、試行数、内訳、ブラウザ情報、画面のheartbeat回数を出力。

上限時間は各冒険の終了時などの区切りで判定するソフト上限。初期概算や単発の重い地形生成中は超過する場合がある。Worker終了による強制中止は主スレッドから行える。端末の温度・省電力・バックグラウンド化・ブラウザによって速度が変わる。

## スマートフォン実測手順

1. 実際の端末でbrowser.htmlを開き、端末名・OS・ブラウザ版、充電/省電力状態を記録。
2. 100体/10×10/中盤/未受取で初回実行し、読込時間・最初の進捗・完了時間・画面応答を記録。
3. 同条件を3回繰返し、初回とウォーム時を分ける。
4. 500/927体、20/30サイズを必要に応じて追加。熱くなる・重い場合は中止。
5. 計算途中でスクロール・入力・中止が反応することを確認。
6. 設定を変えて再実行・追加探索し、別入力の候補が誤って引き継がれないことを確認。
7. JSONと気づいた点を保存。比較時は入力・乱数・完了試行数を一致させる。秒数制限で打ち切った実行は同じ結果を保証しない。

ブラウザ実行の成功をスマホ性能の検証と扱わない。メモリは対応する開発者ツールでWorkerのヒープ等を測る。navigator.deviceMemoryは端末の概算情報であり、このエンジンの使用量ではない。

評価式・検証結果・採用保留項目は[第2段階報告書](../../../siyou/おすすめパーティー評価エンジン第2段階検証.md)を参照。
