# 確定済み方針による得意分野の再判定（作業A）

基準main：75116dd64cb4d8b3ee065ef03a4f9f2f5ec4a2f2 / ver.74。採点v1 1.0.0-draftは変更せず、既存Phase 3のrawとPhase 5Aの未丸め偏差値で判定する。

```sh
node bouken/tests/character-aptitude/phase5a/revised-specialty/calculate.cjs
node bouken/tests/character-aptitude/phase5a/revised-specialty/verify.cjs
```

Node.js標準ライブラリのみ。calculateは同フォルダの4CSV、analysis.json、REPORT.mdを生成する。verifyは9検証を実施しverification.jsonを保存する。入力ハッシュ不一致で停止する。既存入力・成果物には書き込まない。

rules.cjs：rawが厳密に0の分野だけ除外。正のrawに最低点なし。未丸め偏差値最大を採り、差1e−12以内の数値同点は全保持。全raw=0なら空集合。丸め後の整数0点だけでは除外しない。

D04はスキル配列に残しevaluationStatusを「対象外・別枠」、excludedFromAptitudeをtrueとする。保有キャラは除外せず他スキルを通常評価。D04の置換・点数振替は行わない。

| 成果物 | 内容 |
|---|---|
| specialties.csv | 927体、新得意・候補・D04属性・raw・既存絶対/偏差/percentile/順位 |
| comparison.csv | 旧偏差値・旧percentileとの比較を別列で保存 |
| d04-audit.csv | D04所持48体全員の検査 |
| focus-seven.csv | 重点7体の全指標と理由 |
| rules.cjs / calculate.cjs | 判定の純関数と結果生成 |
| verify.cjs / verification.json | 927体独立照合を含む9テスト、成果物ハッシュ |
| input-manifest.json | 既存Phase 3/4/5A・本体/マスター等の保護ハッシュ |
| analysis.json / REPORT.md | 件数と日本語報告 |

旧偏差値との変更は1体、旧percentileとの変更は35体。重点7体は旧「偏差値またはpercentile」で実効0最大だった集合であり、7体全員の旧偏差値判定が変わるわけではない。新判定は全7体とも開拓。追加実測・配点変更・本体統合なし。
