# ver.77 詳細画像の縦横比修正

基準main f0648a97e517c6f4184245917ac213c26b6987c6 / version76。
原因：world.htmlではscreen-ui.css→character-detail.cssの順なので、前者max-height120pxと後者width160px/heightautoが合成され160×120になる。party.htmlは逆順なので従来120×120だった。
対応：character-detail.cssに幅min(120px,100%)/heightauto/max-heightnone/aspect-ratio1を集約。screen-ui.cssから画像サイズの重複規則を削除。ゲーム処理と保存は不変。
自動回帰/公開PC/デプロイは実施後記録。スマホ実機はユーザー待ち。

## 確認結果
world-portraits/result/party-restore/おすすめ評価17件の自動回帰に合格。
最終ゲームコミットb0efa66aa7e3833bfe2b3295657e496c646fe716。Vercel本番dpl_5KDCi8jaqRZaASP9kGcnzYWgSLfF READY。
公開の隔離仮セーブでワールド仲間詳細を開き、390px/320px幅とも画像の描画領域120×120pxを実測。編成画面の仲間詳細でも120×120pxを実測。画像・説明・閉じるを確認。スマホ実機そのものは未確認。
確認画像：detail-v77-1793189387372.jpg（仮セーブ）。

## 2026-10-28 ver.77 ユーザー受入
ユーザー「全部OK!」。前回提示の確認票2項目（スマホで詳細画像が横に伸びない／詳細の開閉に問題がない）を確認OKとして記録。コード・保存形式・バージョンは変更しない。
