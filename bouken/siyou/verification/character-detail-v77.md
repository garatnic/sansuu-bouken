# ver.77 詳細画像の縦横比修正

基準main f0648a97e517c6f4184245917ac213c26b6987c6 / version76。
原因：world.htmlではscreen-ui.css→character-detail.cssの順なので、前者max-height120pxと後者width160px/heightautoが合成され160×120になる。party.htmlは逆順なので従来120×120だった。
対応：character-detail.cssに幅min(120px,100%)/heightauto/max-heightnone/aspect-ratio1を集約。screen-ui.cssから画像サイズの重複規則を削除。ゲーム処理と保存は不変。
自動回帰/公開PC/デプロイは実施後記録。スマホ実機はユーザー待ち。
