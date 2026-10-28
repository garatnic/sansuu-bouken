# ver.80 施設確認の実開拓判定

2026-10-29。main a89be77/ver.79を基準に確認。

ユーザーはver.79確認票の全項目OK、その後「塔が次の未開拓マスなのにロボの中断確認が出る」と報告。全項目OKは既存のルート表示/出発/中断等の受入として記録し、今回の施設判定の不具合は別件として修正。

原因：auto-drive.jsが施設の可視状態をexplored || revealedで比較していた。B01等で施設が透視されるだけでも新規発見として確認していた。
修正：施設マスのexploredだけを比較し、未開拓→開拓済みとなったときに確認。既に透視されていた施設も初回開拓時に確認。既に開拓済みの通過では確認しない。大開拓等による追加開拓の施設も対象。

テスト：透視だけで見えた次マスの塔では止まらず、その後の実開拓で初めて確認。既透視施設/既開拓通過/複数同時追加開拓施設を検証。実画面と公開結果は後続追記。修正後のユーザー実機は未確認。

## PC実画面確認
実装1eea4d9、Vercel Preview dpl_99LUwvpLVqzswvitD9MCBABvvc7Lで隔離仮セーブを使用。B01 Lv1/塔index2/目的地index4。最初の正解後は開拓1、塔のclass=cell revealed frontier、施設確認false、塔の次問へ進行。次の正解後は開拓2、塔のclass=cell explored playerとなり初めて「塔を発見したよ！」を表示。はいでロボ終了を確認。画像：[実開拓後の確認](robot-facility-v80.jpg)。通常localStorageには触れない。

## 本番公開（2026-10-29）
PR #3をmainへマージ（1e30aa8e0270fc6c3b8978b325bd01c216a638ab）。Vercel production dpl_8JfeF9SBnF1uGgi5LmsMah1VFgzV READY、コミット一致、sansuu-bouken.vercel.app割当を確認。通常URLのタイトルでバージョン80を実ブラウザ確認。本番auto-drive.jsをHTTP 200で取得し、exploredのみの判定が存在し旧explored||revealed判定がないことを確認。
GitHub Pagesの初回確認は79で伝播待ち。修正後のユーザー実機・実セーブ・長時間は未確認。
