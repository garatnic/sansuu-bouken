# おまかせ編成・実データ独立検証（C/D/E）

入口はindex.html。正式なゲーム画面への導線は追加しない。Bのサンプルモックは../mock/index.htmlで維持する。ゲーム版69、開始main 26ea00fd61e1e8e34ba249b08a95567e745ba8d0。

## 読み取りと保存保護

「このブラウザのセーブを読む」で同一originのbouken.save.v1だけを読み取る。自動読込なし。PartyReadOnlyは元getterをこの操作まで呼ばず、直接のget/set/remove/clearとsessionStorage/indexedDBを拒否する。取得JSONはWorkerにコピーし、必要な所有/編成/累計/受取済みだけを投影。worldは持ち込まず、通常ワールドの新規出発を模擬する。BoukenSaveを読み込まず、決定はdialogだけ。サーバーへのセーブ送信・ログ永続化なし。診断欄の生データをGitHubへ保存しない。

現行のcapacity/normalize/buffsを使用。破損/不明ID/異常個数/未完成の受取済みはエラー。旧自動ボーナスの変換はコピー内だけ。0体/チュートリアル中は推薦しない。所有数による6モードの機能解放閾値は未確定のため適用しない。

## APIと探索

- api.jsはUMD、Node/Workerで共用。snapshot、validate、randomParty/randomOther、diagnose、evaluator、recommendMany。
- evaluator.evaluateParty(party,seeds)は任意編成評価。画面に依存しない。推薦もこれを呼ぶため同入力/設定/seedなら同じ生評価。キャッシュはスキルLv3ベクトルとD06の大分類集合、seedを含む。参照と訓練のseedは別。
- recommendManyは固定IDを必須制約とし、表示位置も維持。固定メンバーを含む編成全体を元phase2のadventureで評価。固定能力の単純な足引きはしない。
- 5目的×2初期貪欲、無作為20候補、1/2人交換、生の専門上位を保護。初期4→生存16試行。独立検証用の設定はvalidate.cjs参照。
- 目的別に訓練スコア最良の90%以上、専門生評価95%以上の候補群を保持する研究設定。これは真の性能90%以上を保証しない。品質ゲート未合格。
- ランダムは能力フィルタなし。Fisher–Yates抽選、固定・所有・重複禁止を厳守。直前・既出を再抽選。組合せ1万以下なら列挙で枯渇確認、大きい場合の再抽選上限は「候補切れ」と誤表示しない。
- 履歴はモード+マップ+固定ID/位置ごとに分離。固定はモード変更でも維持。これは独立試作の暫定動作で正式ルールは未決。

## 研究用評価・理由

phase2の生指標/参照分布range正規化/総合hybrid/専門70%を再利用。UIは4分野の研究用相対値、生平均、標準誤差、試行数、基準集団数・中心・幅を表示。任意評価だけ先に行った場合は参照未計算として生値だけ表示。総合探検力の正式表示は未決のため実装しない。

診断文は実在する合算スキルの構造的事実と根拠を返す。「相性抜群」「最強」等の因果効果断定をしない。C01/D01、複数収集家、D05/D06、D02/D07、E系、Lv3上限の条件付き説明を用意。全67スキル個別の精密な診断文を完了したとはしない。D04は効果ありとして説明しない。

## Workerと実測

runtime.jsはphase2の検証済みbootstrapを独立再利用。source-manifest.json内18ソースをGit blob SHA-1検査してロード。ゲームが変更されたら不一致で拒否し、manifestを黙って更新しない。初期化後はマスターをWorkerに保持。UI画像シートは1回だけ初期化、ID別Canvasキャッシュ。

進捗は冒険間で通知。キャンセルはWorker.terminateで即停止し、後続メッセージを無視してWorkerを再初期化。10秒はソフト上限であり参照校正/候補生成/1冒険の途中では切れない。Worker内でも候補生成には負荷があり、実機メモリ/電池は未測定。

## 再検証

リポジトリルートで：

```sh
node bouken/tests/party-recommendation/mock/test.cjs
node bouken/tests/party-recommendation/integration/test.cjs
node bouken/tests/party-recommendation/phase2/test.cjs
node bouken/tests/party-recommendation/integration/validate.cjs
```

testは12グループ。旧phase2の12グループも回帰。validateは31条件：30/100/140/279/500/927×固定0～全員、別所有分布/進行、20/30マップ。結果はケース単位でresults.jsonへチェックポイント保存。訓練seed26251001～、参照26252001～、監査30600001～32、完走30700001～4。監査は訓練後に固定した候補を評価し選び直さない。数値/残件はsiyou/おまかせ編成独立検証.md。

実機：同じVercel originのブラウザで開く→実セーブ読込→6モード/固定/再推薦/任意評価/キャンセルを試す。Safari/Chromeや別originのセーブは共有されない。所要秒・端末・OS・画面のスクリーンショットを報告。実機の速度/フリーズ/メモリをPC実測で代替しない。正式保存は行わないため確認後ゲームの編成が同じことを確認する。
