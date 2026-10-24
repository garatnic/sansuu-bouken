"""Render the measured terrain maps; no illustrative or generated map imagery."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json, subprocess
root=Path(__file__).resolve().parents[1]
out=root/'siyou/verification'
data=json.loads((out/'e08-v47-results.json').read_text())
rows=data['results']; font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',16)
cell=10; colors=['#8bcf62','#296344','#9b968e','#dfc27d','#438fc4','#d9f1ed','#9067a8']
im=Image.new('RGB',(1300,1120),'#f7f7f2');draw=ImageDraw.Draw(im)
draw.text((20,12),'30 x 30 / same seed per row / fixed palette and scale / orange = start',fill='#202020',font=font)
for pic in data['pictures']:
    lv=int(pic['label'][-1]); seed=pic['seed']; x=20+lv*320; y=80+(seed-1)*335
    draw.text((x,y-24),f'Seed #{seed} / {pic["label"]}',fill='#202020',font=font)
    for i,t in enumerate(pic['terrain']):
        xx=x+i%30*cell; yy=y+i//30*cell
        draw.rectangle((xx,yy,xx+cell-1,yy+cell-1),fill=colors[int(t[1:])-1])
    draw.rectangle((x+150,y+150,x+159,y+159),outline='#ed7a20',width=2)
for k,label in enumerate(['Grass','Forest','Mountain','Desert','Sea','Snow','Swamp']):
    x=20+k*180;draw.rectangle((x,1080,x+18,1098),fill=colors[k]);draw.text((x+26,1080),label,fill='#202020',font=font)
im.save(out/'e08-v47-comparison.png')
report=out/'e08-v47-report.md';report.touch()
changed=subprocess.check_output(['git','-C',str(root.parent),'diff','--name-only','-z']).decode().split('\0')+subprocess.check_output(['git','-C',str(root.parent),'ls-files','--others','--exclude-standard','-z']).decode().split('\0')
# The Git command emits repository-root paths even when cwd is bouken/.
names=['草原','森林','山岳','砂漠','海','雪原','毒の沼地']
lines=['# E08 地形集中 ver.47 検証レポート','',f'2026-10-24。30×30、各条件{data["samples"]}マップ、8条件で合計{data["samples"]*8}マップ。実際の施設30個を含む生成結果を計測。','',
'乱数均一化処理はver.46から変更なし。旧E08の隣接倍率だけを廃止し、地形抽選・開始草原確定の後、施設配置前にマス交換で整形する。整形では7地形それぞれの面積を完全に維持する。',
'','## Lv0〜Lv3の数値比較','','数値は1マップあたりの平均。上下左右の隣接率は同種の辺数÷全ての辺数。最大成分面積は同一地形の最大連結成分。小成分の各項目は包含関係にある。','',
'| 指標 | Lv0 | Lv1 | Lv2 | Lv3 |','|---|---:|---:|---:|---:|']
for title,key in [('同種隣接率（%）','adjacency'),('連結成分数','components'),('孤立1〜2マス成分数','isolated'),('6マス未満の成分数','under6'),('12マス未満の成分数','under12'),('最大連結成分面積（マス）','max'),('1マス幅・6マス以上の直線区間数','thin'),('生成時間平均（ms）','ms'),('生成時間最大（ms）','maxMs')]:
    lines.append('|'+title+'|'+'|'.join(f'{r[key]:.3f}' for r in rows[:4])+'|')
lines+=['','1マス幅の指標は、横方向なら上下、縦方向なら左右に同種セルがない連続6マス以上の区間を数える。巨大な塊の端に細い尾が残る場合も含む。通常地図では長い線より短い破片が多いため、この指標単独では良し悪しを判定しない。Lv3では1×12/18/24の水平・垂直の専用入力も修正できることを確認した。',
'',f'Lv3の孤立1〜2マスはLv0比{(1-rows[3]["isolated"]/rows[0]["isolated"])*100:.2f}%減少。ただし完全に0ではなく、面積・保護地点・接続・地形配置の制約で少数残る。12マスという面積は厳密保証ではない。',
'','時間はNode.jsの実行環境上の計測。実機スマートフォンの時間ではなく、GC・JIT・同時負荷の影響も受ける。単一マップの生成には固定の反復上限を設けている。',
'','## 各地形の平均占有率（%）','','| 地形 | Lv0 | Lv1 | Lv2 | Lv3 |','|---|---:|---:|---:|---:|']
for k,name in enumerate(names):lines.append('|'+name+'|'+'|'.join(f'{r["occupancy"][k]:.4f}' for r in rows[:4])+'|')
lines+=['','全Lvで同一。施設配置前の面積厳密一致は別途300ケースで確認した。施設配置の既存救済が発生すれば、最終地形に少数の変更が加わる場合はある。','',
'## 併用検証','','各条件1000マップ。E09の接続率は全陸地に占める最大陸地連結成分の割合。','',
'| 条件 | 草原占有率% | 陸地接続率% | 同種隣接率% | 孤立1〜2マス | 最大成分面積 | 平均生成ms |','|---|---:|---:|---:|---:|---:|---:|']
for r in rows[4:]:lines.append('|'+r['label']+'|'+'|'.join(f'{v:.4f}' for v in [r['occupancy'][0],r['landConnected'],r['adjacency'],r['isolated'],r['max'],r['ms']])+'|')
lines+=['','E01 Lv3の草原面積はE08併用前後で一致。E09併用では整形段階で陸地連結成分数を増やさない局所接続判定も検証した。',
'','## 実際の生成マップ比較','','![同じシード・配色・倍率によるLv比較](e08-v47-comparison.png)','',
'最初の3シードをそのまま掲載し、良い結果だけを選んでいない。1行が同一シード、左からLv0/1/2/3。地形だけを同じ10pxセルで描画し、開始地点を橙枠で示す。正方形等の形状テンプレートは使用していない。',
'','## 再実行・回帰確認','','```sh','node bouken/tests/e08-shape.test.cjs','node bouken/tests/e-buffs.test.cjs','node bouken/tests/terrain-distribution.test.cjs','node bouken/tests/f-buffs.test.cjs','node bouken/tests/event-images.test.cjs','```','',
'測定データ保存：環境変数E08_REPORTへJSON保存先を指定。E08_SAMPLESを省略すると1000。図表生成はpython bouken/tests/render-e08-report.py。','',
'Lv0はver.46と同じ乱数で地形・施設・イベントが一致することを全サイズ・E01/E09等を含む120ケースで確認。既存セーブへの再生成は行わない。地形抽選の期待値検証、E09/D系/施設制約、F系候補、画像取得・タイマー・保存失敗も回帰確認済み。',
'','## 変更ファイル','']
lines += ['- `'+p+'`' for p in sorted(set(filter(None,changed)))]
lines+=['','## ユーザー確認チェックリスト','','- [ ] ver.47と表示される','- [ ] E08 Lv1でも地形がまとまり、Lv2・Lv3ほど大きな塊になる','- [ ] Lv3の地形が縦横へ広がり、人工的な形や細い尾が目立たない','- [ ] E01〜E07で増やした地形がE08併用でも十分に残る','- [ ] E09併用、新規生成、施設訪問、保存再開、スマホ操作が正常','','**コメント欄：** 不具合・見た目・端末差など。']
report.write_text('\n'.join(lines)+'\n')
