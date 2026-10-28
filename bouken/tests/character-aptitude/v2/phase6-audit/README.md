# Phase6：既存理論・実測の整合性監査

配点2.0.0・ゲームver.74。追加冒険0。旧Phase6の50体追加/専用大量実測計画は未実施の履歴としてそのまま保持し、この監査方針へ置き換える。計画ファイルの削除や既存成果物の上書きをしない。Phase7は別途判断。

## 再分析・検証

Python3標準ライブラリ、Node.js18以上、git（過去入力との読み取り照合）。リポジトリルートから：

```sh
PYTHONDONTWRITEBYTECODE=1 python bouken/tests/character-aptitude/v2/phase6-audit/reports.py
PYTHONDONTWRITEBYTECODE=1 python bouken/tests/character-aptitude/v2/phase6-audit/verify.py
```

reportsは監査フォルダ内のCSV/analysis.json/3報告を決定的再生成。verifyは同じ再計算と式/実装の純関数照合・原本保護を行いverification.json/validation.logを保存する。失敗時は非0終了し、古いverification成功を今回の成功とみなさない。実測engine/run/pilot/validateや既存のgenerate/verifyは呼ばない。v2のindependent-check.pyだけを読み取り検算に使う。

入力はinput-manifest.jsonに開始main SHAとSHA256を固定。effect-notes.jsonは旧Phase5の実装調査記述を現mainソースと照合してスナップショット化し、E08/D04の採点属性は現v2から採用。provenance.jsonはPhase4時点と現在の927体の効果関連フィールドを比較した記録。実装に意味差があれば分析を停止して新基準を検討し、ハッシュだけ無条件更新しない。

## 成果物と単位

- SKILL-AUDIT.csv：201行。各Lvの効果/条件/理論式と数値、v2基礎/配分/raw寄与、根拠A/B/C・妥当/再検討/保留、単独と補助合算Lvの観測件数・平均、交絡/不確実性。基礎点は確率やマス数ではない。
- FOCUSED-ANALYSIS.md：E/D06/A12/B/CDFの式と既存結果の照合。未観測Lvを明示。
- PHASE4-REANALYSIS.md：8,000件の条件/制約/乖離7分類/相関と代表例。
- REPORT.md：全67判定・Chatへの5回答・最小追加検証の提案（未承認・未実施）。
- e-blessing-comparison.csv：7対応ケース、Lv/特攻/競合加護/目標・quota・実現面積、均等選択参考期待と実測対応差。
- d06-probabilities.csv：2編成×3候補プール×3Lv×D05の4Lv（なし含む）=72条件の初回理論抽選。d06-observed.json：専用Lv1/Lv3の対象分類加入/総新規/成功対応差。
- support-paired.csv：10ケース×20指標、100共通seedの同人数・当該技能だけ除去との対応差。95%区間はdf99のt近似、複数比較調整なし。
- facility-expectations.csv：4サイズ×D03/08/09×3Lv。基本施設抽選の二項分布を全列挙、追加数の厳密期待（空き十分）。
- b-information.csv：B7×3Lv、情報取得と利用成果を分離。未観測は0件/null。集約平均発見問は発見済施設に限る条件付き統計。
- collector-reanalysis.csv：収集家の分類重み/固定初期所有の初回理論確率と、動的な保存済み対象取得。初回と実測比率は同一の推定対象ではない。
- character-v2-measurements.csv / correlations.csv：v2と旧実測50体×4の記述的照合。配点の回帰/学習なし。
- audit.py / reports.py：計算/報告生成、runtime-oracle.cjs：本体targets/companionWeights/rollの純関数だけを固定入力で照合（world生成や冒険なし）。
- verification.json / validation.log：検証結果・未検証・全成果物SHA256。

根拠A/B/Cは効果を評価できるかの区分、配点係数の精度保証ではない。Bでも全Lvの実測済みを意味しない。各行のsoloAdventures/supplementPartyAdventuresが当該Lvの実観測数。保有者平均は他スキル/施設/AI/所持に交絡し、因果効果としない。妥当32に含むD04/E08の2種は対象外0の維持判断で、配点対象へ復帰しない。
