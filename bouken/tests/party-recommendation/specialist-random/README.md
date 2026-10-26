# 「ランダム案」専門性検証（独立Node実験）

開始main `7e73c9a9b85d1f72d88b7fb0210aba6639b1e27d` / common/version.js=70。
既存エンジン・UI・本体は変更しない。旧1,500回試験は実行しない。

- [日本語の結果レポート](../../../siyou/おまかせ編成ランダム案専門性検証_20261026.md)
- [詳細CSV：各分野30チーム、合計120行](results-20261026/specialists-30teams-per-field.csv)
- 個別：[開拓30](results-20261026/explore-30teams.csv) / [お宝30](results-20261026/treasure-30teams.csv) / [仲間30](results-20261026/companion-30teams.csv) / [探索30](results-20261026/map-30teams.csv)

## 今回の条件

実在する仲間マスターから固定seedで500人を抽出した試験用所有1条件。私有実セーブは未提供。
完全ランダム100チーム、専門上位10人のうち1人＋無作為4人を各分野30チーム。全員5人・同一ID重複なし。
個人順位は前回と同じO.estimatorを既定10四方・30問条件で使用し、score([id])−score([])の各専門軸で算出。
今回の冒険成果での選抜/チーム修正/新規評価式はない。
サイズ10四方4件・20四方3件・30四方3件の事前固定10seed。スキルが生成へ影響するため、同じ生成条件であっても異なる編成の地形配列まで同一ではない。

## 再実行（リポジトリのルートから）

Node標準ライブラリと既存コードのみ。追加パッケージ/API/ブラウザ不要。
**元のresults-20261026は上書きせず、新しい出力先を使う。**

```sh
node bouken/tests/party-recommendation/specialist-random/measure.cjs /tmp/specialist-random-repro
```

このコマンドは**完全ランダム1チーム×10回だけ**模擬冒険を実行し、速度計測後に全チーム計画を作る。
speed.jsonのsingleFieldは1,300試行、allFourSharedは同一基準共用の4分野（延べ5,200／実実行2,200）の見積もり。
保守見積もりが10分を超えたら本検証を開始せず、速度報告と規模縮小案を出す。
今回は事前に4分野/所有1条件/実2,200回/保守約145秒を報告してから実施した。

```sh
node bouken/tests/party-recommendation/specialist-random/run.cjs /tmp/specialist-random-repro
```

保守見積もり10分以内でのみ起動。30問までの既存シミュレーションを完全ランダム100×10＋専門30×10×4=2,200回。
途中で約590秒に達したら追加試行をやめ、stopped.jsonへ件数/理由/原本を保存。既存結果へ上書きする再実行は禁止。
正常時はbaseline.json、main.json、各分野CSV/統合CSVを保存し、途中progress.jsonを削除する。
speed.jsonのmainStarted=falseは開始前の記録として維持し、完了状態はmain.jsonで確認する。

```sh
node bouken/tests/party-recommendation/specialist-random/profile-overhead.cjs /tmp/specialist-random-repro
node bouken/tests/party-recommendation/specialist-random/diagnose.cjs /tmp/specialist-random-repro
node bouken/tests/party-recommendation/specialist-random/test.cjs /tmp/specialist-random-repro
python bouken/tests/party-recommendation/specialist-random/verify_csv.py /tmp/specialist-random-repro
python bouken/tests/party-recommendation/specialist-random/report.py /tmp/specialist-random-repro /tmp/specialist-random-report.md
```

上の追加診断・テストは模擬冒険を実行しない。profile-overheadはスコア計算と生成の別途再測定で、元時計の分割ではない。
診断用の既存推定スコアと実成果の相関は評価式/選抜へ使わない。
main.jsonがない状態でもreport.pyは速度と未実施をMarkdownに記録する。

## 再現性・基準再利用

plan.jsonに所有ID/保存コピー/10マップ条件/全500人スコア/起点/全220チームを保存。
乱数は生成と冒険を別seedに固定。CPU速度で候補数を変える探索はないので、同じ実装なら成果が再現する（時間は変動）。
lib.cjsと実データ/共通JS/既存シミュレーターのハッシュを確認してから実行する。
完全ランダム基準のcontextHash（所有/所持品/進行/受取/ソース/マップ/予算/方策/5人）が同じ場合だけ再利用。
基準100チームの冒険から4指標を同時に得るので、4分野で同じ基準チーム結果を共用。異なる分野の成果を単一平均へまとめない。

CSVの「基準超え判定」はチーム平均>基準という厳密比較で、等値は基準以下。
ユーザーの24/30目安との比較は記録するが、正式合格を宣言しない。
1所有集合・10マップなので別所有/別seed/実機の安定性を保証しない。Gは明示承認待ち。
