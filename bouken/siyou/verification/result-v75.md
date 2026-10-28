# ver.75 リザルト検証記録

- 基準：main d749a19910d0d2c5ee9322455a08c15f89dc3e29 / version74。上流の最新characters.jsonを維持した。
- ユーザー事前承認：閉じるとマップ、既存演出完了後表示、旧セーブ保持・次の新規冒険から。
- tests/result.test.cjs：初回誤答/演算/連続、自力と追加、時計flush/pause/reload、実イベント失敗/成功/C03/重複/報酬順、完全クリア限定、コピー独立/二重確定防止/旧データ非推測、実persist保存失敗の巻戻し、HTML内JS構文に合格。
- 既存回帰：exploration-reward/tutorial/records-screen/f-buffs/achievements、party-forecast/party-recommendation-game、party-recommendation/test.cjs（17件）に合格。推薦シミュレーションは冒険計測に依存しない。新規出発ブロックの任意計測フックで互換性維持。
- Playwrightはランタイムにあるがブラウザ実行ファイル未導入。再インストールせず公開Cloud Chromeで表示確認を行う。
- コミット・デプロイ・公開PC：実施後に追記。スマホ実機/実セーブ/OS強制終了は未確認。
- タイマーの強制終了限界：最後の保存から最大約5秒が未保存となり得る。通常のホーム遷移/再読込/visibilitychange/pagehideは保存する。
