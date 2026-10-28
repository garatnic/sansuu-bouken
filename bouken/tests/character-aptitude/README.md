# キャラクター適性スコア：Phase 3 独立採点器

採点仕様 `1.0.0-draft`、調査対象 main ver.74。ゲーム本体から読み込まれないNode.js CLI。外部依存なし。Node.js 18以上を想定（実行検証版は verification.json）。job・旧評価点・種族・コストは採点に使用しない。

## 再計算と検証

リポジトリルートから実行する。

```sh
node bouken/tests/character-aptitude/scorer.cjs
node bouken/tests/character-aptitude/analyze.cjs
node bouken/tests/character-aptitude/verify.cjs
```

最初の2コマンドは同フォルダの生成物を上書きする。入力マスターは読み取り専用。3番目はテストを実行して `test-results.tap` と `verification.json` を更新し、失敗時は非0終了する。採点・分析本体のCSV/JSON/レポートは同じ入力でバイト単位に再現する。テストログの実行時間と実行環境のNode版は変動する。

## 入出力と成果物

| ファイル | 内容 |
|---|---|
| scorer.cjs | 入力検証・独立採点・CSV/JSON生成 |
| scoring-v1.json | 正本v1から転記した67スキル×3Lv、配分・条件・11シナジー・上限・正規化 |
| scores.csv | ID・登録名・仕様版・4分野整数点・4分野raw、ID昇順927行 |
| details.json | 927体のスキル別基礎点・寄与、シナジー内訳、上限前/後、raw・条件タグ |
| analyze.cjs | 分布・順位・支援・Lv差の決定的分析 |
| analysis.json | 度数0〜100、10点帯、統計、各分野上下20、全分野傾向、支援系、67種Lv感度 |
| REPORT.md | 日本語の分布・ランキング・極端値・支援・限界・引継ぎ |
| scorer.test.cjs | 配点表独立照合、201Lv試験、927体独立再計算、境界・異常入力・順序不変等 |
| verify.cjs / verification.json / test-results.tap | 検証実行器・結果集計・全テストログ |
| input-manifest.json | 入力・正本仕様・配点定義のSHA-256、ゲーム版 |
| review-manifest.json | 調査元mainコミット・調査範囲 |

入力は `../../data/characters.json` と `../../data/skills.json`。キャラクターの `id` / `name` / `skills[].id` / `skills[].level` を使用する。全927体・ID一意、全67スキル定義とマスターの一致を必須とする。不明ID、Lv1〜3以外、スキル欠損、同一個人内のID重複はエラーで停止する。出力はID、寄与はスキルID、シナジーは規則IDで整列し、入力順の違いを除去する。

スキルの個人成長や編成合算は行わない。スキル別寄与は `base × share / 100`、未正規化点はその合計＋指定シナジー（分野別上限8raw）、整数点は JavaScript の `Math.round(100 × (1 - exp(-max(0, raw)/35)))`。途中は丸めない。4分野合計100の制約なし。D04全Lvは0、E09はエラー。

シナジー候補各ペアの `raw` は上限前の値であり、`synergies.applied` が分野ごとの上限適用後。上限後の値を各ペアへ恣意的に割り振らない。通常の浮動小数点演算を使用する。

`scoreCharacter` は数式境界テスト用に3スキル超の合成入力も受け付ける。現行927体の構成を変更・新規生成する機能ではない。個人内NGの組合せを実在データへ補完しない。Lv感度分析の仮想差替えも実在ランキングと分離する。

## 保存結果の確認

`verification.json` の tests/pass/fail と生成物ハッシュを確認する。`input-manifest.json` が現行入力と不一致なら、以前の成果物をそのまま最新と扱わない。`review-manifest.json` の基準コミットから対象外に差分がないこともテストする。後日mainで本体の変更が進んだ場合、この保護テストは意図的に失敗するので、差分を確認して新たな基準を明示し、入力・仕様変更なら再採点する。

Phase 3完了は理論計算の完了であり、性能実測の合格ではない。Phase 4〜6の模擬冒険、本体統合、正式マスター更新、バージョン更新、公開操作は行わない。正式統合はユーザーの別途明示承認が必要。
