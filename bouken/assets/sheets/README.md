# 共通画像素材と保管原本

2026-10-25整理。現在は通常PNGを実行時に使用し、分割復元をゲームで行わない。取り込み当時の説明は[整理前原文](../../siyou/history/20261025整理前/assets/sheets/README.md)。

| 画像 | 寸法 | 内容/共通処理 |
|---|---|---|
| field_tiles.png | 448×64 | 地形7枚・64pxセル、tile-images.js |
| event_tiles.png | 512×64 | 施設8枚・64pxセル、tile-images.js |
| character_sheet.png | 3840×3968 | 128px・30×31、ID1～927、character-images.js |
| museum.png | 2600×3120 | 130px・20×24、四辺1pxを除く128px、ID1～480、item-images.js |

既存の.part01等/manifest.json/restore.pyはDrive原本の分割保管とSHA-256照合用に残す。通常PNGとHTTPキャッシュを使用するためプレイヤーの操作に復元工程は不要。

home.jpg/worldselect.jpgとbutton_*.png/jpgはホーム/出発の画像。tutorial01/02.pngはsheetsと../tutorial/に重複があるが、実際のチュートリアルは../tutorial/tutorial01～07.pngを参照する。過去のmanifestは4原本の記録であり、このフォルダの全UI画像一覧ではない。

画像は同一サイト内の相対URLで読み、個別キャラ取得・時刻乱数によるキャッシュ破棄を行わない。ローダーの共有は1ドキュメント内。別ページのメモリを自動共有する保証はなく、HTTPキャッシュと区別する。表示仕様は../../siyou/README.mdから参照。
