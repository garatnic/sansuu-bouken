# 出発見出しの強調 ver.94

2026-10-29。開始main 8ab9eb14eeffa19c3f58e5b55af7c030e87fa4d3 / ver.93。

world-select.cssの.world-size-picker legendを、ホームのhome-menu.css/.image-buttonと同じfont-size:clamp(22px,5.8vw,38px)、font-weight:800、line-height:1.2に変更。文字色#3f584cを維持しtext-shadow:none。操作処理は変更なし。versionとHTMLキャッシュ参照を94へ更新し、予想Workerのsource-manifestを再生成。

world-size-picker/departure-navigation/forecast-runtimeの既存回帰テストが成功。CSSの対象値を両画面の実ソースで照合。ブラウザ実行環境にChromiumがないため、見た目・スマホ実機はユーザー確認待ち。

更新後ver.94。実装コミット：`1be4222c43baabf18e959e31ca0ec25de9b401ff`。main反映成功。

Vercel production `dpl_H9wS74ZdBPwita4J634umffoAhvf` はREADYで実装コミットと一致。通常ドメインでworldcreate.html/world-select.css/common/version.jsのHTTP 200・登録内容との一致を確認。version.jsは切替直後の古い取得結果を区別するため確認用クエリを付けて再取得し、94を確認した。公開画面の見た目は未確認。この公開記録は後続文書コミットで保存。

- [ ] 見出しがホームの出発ボタンと同じ文字サイズで太字になった。
- [ ] 濃色・影なしで、スマホ幅でも収まる。

**コメント欄（不具合・気づいたこと）**
