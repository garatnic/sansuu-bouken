# 承認済み配点v2・独立再計算

採点仕様2.0.0、ゲームver.74（据置）。本体統合・マスター更新・公開操作の承認ではない。入力基準はinput-manifest.jsonのmainコミット。現在mainの登録名を出力し、旧成果物とIDで照合する。77体の名称変更、スキルID/Lv差0件を確認した。旧ハッシュを更新して過去の結果を現在の入力と偽装しない。

## 再計算・検証

リポジトリルート、Node.js18以上・Python3標準ライブラリ。外部依存なし。

```sh
node bouken/tests/character-aptitude/v2/calculate.cjs
node bouken/tests/character-aptitude/v2/plan-phase6.cjs
node bouken/tests/character-aptitude/v2/verify.cjs
```

これらはv2フォルダにだけ出力する。Phase3〜5の旧generate/verify/実測runは実行しない。入力ハッシュ不一致時は停止する。新しいmainへ追従する場合は変更を監査し、別の入力基準を明示する。既存manifestを無条件に更新しない。verify失敗時は非0終了、verification.jsonの古い成功記録だけを見て合格と判断しない。独立検算だけならpython independent-check.py（同フォルダ）を実行する。

## 定義・計算

E01〜07基礎7/14/21・配分100/0/0/0、E08とD04基礎0/0/0・配分0/0/0/0で対象外別枠（ゼロ配分の例外を明示）。他58種と全11シナジー/分野上限8/scale35/Math.roundはv1のまま。E08は実装上の形状変更効果を削除せず、適性点に算入しないという設計判断。

raw=Σ(base×share/100)+min(8,分野シナジー合計)。絶対点=Math.round(100×(1−exp(−max(0,raw)/35)))、0〜100。途中丸めなし。偏差値は927体の各分野母平均・母標準偏差から50+10×(score−mean)/sigma、sigma0は50。percentileは100×(昇順同点平均順位−1)/926。順位は降順competition、同点開始/終了順位を併記。偏差値とpercentileに0〜100クリップを共通適用しない（percentileのみ定義上0〜100）。

得意はraw>0の分野のみで未丸め偏差値最大。同点1e−12以内を全保持（以前に採用した数値同点規約を継承）、正寄与の最低点なし、全raw0は[]。ID順は保存順だけ。同点内に順位差を作らない。

## ファイル

- scoring-v2.json / scorer.cjs：完全67定義・独立採点器。v1ファイルを変更しない。
- scores.csv / details.json：927体の現行登録名・ID・スキル/除外属性・raw・絶対点・偏差値・percentile・順位/同点・得意、詳細は寄与/シナジーも含む。
- comparison.csv：927体全差分、旧名称、v1/v2 raw・絶対点・偏差値・percentile・順位・得意。v1の得意は共通の再判定ルールを適用した値。
- specialty-changes.csv / e08-impact.csv / excluded-skill-audit.csv：変更者全件、E08全98体、D04/E08保有者（重複は1行）。
- distribution.csv / analysis.json / REPORT.md：全0〜100度数・人数/ID/名称・相対値と統計、変更人数、日本語報告。
- input-manifest.json：原本ハッシュ（common/data、既存適性成果物全体、v1/旧v2提案）。
- independent-check.py：旧v1表から承認差分を独自適用、シナジー独立列挙、Python直接数え上げで22,248指標・927得意集合を検算。v2採点器を呼ばない。
- verify.cjs / verification.json / validation.log：42検証、成果物SHA256。所要時間は性能評価目的でないためログに変動時間を埋め込まない。
- plan-phase6.cjs / phase6-plan.json / phase6-selection.csv / PHASE6-PLAN.md：実測を実行しない事前計画案。計画CSVは選定候補であり実測結果ではない。

生成CSV/JSON/報告は同じ入力でバイト再現する。Phase6 planも固定seed・固定ID順で再現する。今回の追加冒険は0件。本体UI・セーブ・version.js・Vercelは変更しない。
