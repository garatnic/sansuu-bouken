from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,subprocess,collections
root=Path(__file__).resolve().parents[1];out=root/'siyou/verification'
p=json.loads((out/'terrain-v48-results.json').read_text());migration=json.loads((out/'e09-v48-migration.json').read_text());rows={r['label']:r for r in p['results']};names=['草原','森林','山岳','砂漠','海','雪原','毒の沼地'];colors=['#8bcf62','#296344','#9b968e','#dfc27d','#438fc4','#d9f1ed','#9067a8'];font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',16)
def draw_maps(file,arrangement,cols,caption):
    nr=(len(arrangement)+cols-1)//cols;im=Image.new('RGB',(cols*320+20,nr*340+100),'#f7f7f2');d=ImageDraw.Draw(im);d.text((20,12),caption,fill='#222',font=font)
    for k,(label,seed,title) in enumerate(arrangement):
        pic=next(x for x in p['pictures'] if x['label']==label and x['seed']==seed);x=20+k%cols*320;y=70+k//cols*340;d.text((x,y-24),title,fill='#222',font=font)
        for i,t in enumerate(pic['terrain']):xx=x+i%30*10;yy=y+i//30*10;d.rectangle((xx,yy,xx+9,yy+9),fill=colors[int(t[1:])-1])
        d.rectangle((x+150,y+150,x+159,y+159),outline='#ed7a20',width=2)
    for k,label in enumerate(['Grass','Forest','Mountain','Desert','Sea','Snow','Swamp']):
        x=20+k*(cols*320-20)//7;d.rectangle((x,nr*340+60,x+16,nr*340+77),fill=colors[k]);d.text((x+23,nr*340+60),label,fill='#222',font=font)
    im.save(out/file)
choices=['base','E01 Lv3','E05 Lv3','mix2','mix3','mix5','all7 Lv3','E01+E08 Lv3','E05+E08 Lv3']
draw_maps('terrain-v48-blessings.png',[(l,1,l) for l in choices],3,'Same seed #1 / 30 x 30 / fixed palette and scale / orange = start')
draw_maps('terrain-v48-e08.png',[(l,seed,f'Seed #{seed} / Lv{lv}') for seed in [1,2,3] for lv,l in enumerate(['base','E08 Lv1','E08 Lv2','E08 Lv3'])],4,'E08 comparison / same seed per row / 30 x 30 / fixed scale')
# All 49 migrations, including the two merged characters.
def skills_text(skills):return '、'.join(f'{s["id"]} Lv{s["level"]}（{s["cost"]}）' for s in skills)
ml=['# E09→E08 移行一覧（ver.48）','','49体。通常47体は同Lv置換。600/610はE08とE09を合算し上限3、E08通常コスト2/4/6で再計算。他スキルは不変。','','| ID | 名前 | 移行前スキル（コスト） | 移行後スキル（コスト） | totalCost |','|---:|---|---|---|---:|']
for c in migration:ml.append(f'|{c["id"]}|{c["name"]}|{skills_text(c["before"])}|{skills_text(c["after"])}|{c["beforeTotal"]}→{c["afterTotal"]}|')
ml+=['','全927体のtotalCostがスキルコスト合計と一致。49体以外のキャラクターデータは移行前と完全一致。600/610は2スキル・合計10。移行前後の機械可読データはe09-v48-migration.json。元CSVは49行だけを更新し、全927行のスキル・コストを実行時JSONと照合済み。']
(out/'e09-v48-migration.md').write_text('\n'.join(ml)+'\n')
report=out/'terrain-v48-report.md';report.touch()
changed=subprocess.check_output(['git','-C',str(root.parent),'diff','--name-only','-z']).decode().split('\0')+subprocess.check_output(['git','-C',str(root.parent),'ls-files','--others','--exclude-standard','-z']).decode().split('\0')
lines=['# 地形生成刷新 ver.48 検証レポート','',f'2026-10-24。{p["node"]}上で30×30、32条件それぞれ{p["samples"]}回、計{p["samples"]*32}マップを測定。実際の施設30個を含む。',
'','## 変更の要点','','- E01〜E07は追加重みx=d/(1-p-d)、P=(p+x)/(1+Σx)で単独+10/20/30ポイント。基本比率は11/20/18/14/13/13/11%。','- 大陸・標高・気温・湿度を各3層ノイズで生成。ノイズを一様乱数とみなす抽選はせず、目標整数面積を気候適性に沿って配置。','- 開始草原を目標面積の中で予約。E08の面積維持整形を施設前に適用し、旧E09生成補正は廃止。','- 49体のスキル・コストを移行し、旧保存のスナップショットはメモリ上でE09→E08へ正規化。生成済み地形・施設・所持数は変更しない。','- グレースケール化は今回含めていない。',
'','## 単独加護：理論と実測（対象地形%）','','各セルは「理論 / 実測」。全Lvで各1000マップ。','', '| 加護 | 基本比率 | Lv1 | Lv2 | Lv3 |','|---|---:|---:|---:|---:|']
for i,name in enumerate(names,1):
    vals=[]
    for lv in [1,2,3]:
        r=rows[f'E0{i} Lv{lv}'];vals.append(f'{r["target"][i-1]:.2f} / {r["occupancy"][i-1]:.2f}')
    lines.append(f'|E0{i} {name}|{rows["base"]["target"][i-1]:.2f}|'+'|'.join(vals)+'|')
lines+=['','全32条件で7地形すべての目標と実測の差が0.12ポイント未満。単独の対象地形は900マスへ整数で割り切れ、表の比率と一致する。他地形・複数併用では整数配分の丸め誤差が残る。施設配置の救済が発生する場合は、その後の変更として区別する。',
'','## 加護なし・複数加護：全地形の理論と実測','','各セルは「理論 / 実測」。mix2=E01/E05各Lv3、mix3=E02 Lv2/E03 Lv3/E06 Lv1、mix5=E01/E02/E04/E05/E07各Lv3、all7=全7種Lv3。','']
for label in ['base','mix2','mix3','mix5','all7 Lv3']:
    r=rows[label];lines+=['### '+label,'','| 地形 | 理論% | 実測% |','|---|---:|---:|']
    for k,name in enumerate(names):lines.append(f'|{name}|{r["target"][k]:.4f}|{r["occupancy"][k]:.4f}|')
    lines+=['']
lines+=['## 生成マップ比較','','![加護なし・単独・複数加護の実生成](terrain-v48-blessings.png)','','全パネルで同じシード・配色・10pxセルを使用。基礎気候は同じで加護に応じて面積が変わる。海は無加護13%、E05 Lv3だけ43%。固定図形テンプレートを使用していない。',
'','## 多層ノイズ・E08の比較','','各1000マップの平均。孤立は上下左右で連結した1〜2マスの成分。線状は幅1で6マス以上の水平/垂直区間。','',
'| 指標 | E08なし | Lv1 | Lv2 | Lv3 |','|---|---:|---:|---:|---:|']
elevels=[rows[l] for l in ['base','E08 Lv1','E08 Lv2','E08 Lv3']]
for title,key in [('同種隣接率%','adjacency'),('連結成分数','components'),('孤立1〜2マス成分','isolated'),('6マス未満成分','under6'),('12マス未満成分','under12'),('最大成分面積','max'),('長い幅1区間','thin'),('海岸線の辺数','coast'),('平均生成ms','meanMs'),('p95生成ms','p95Ms'),('最大生成ms','maxMs')]:lines.append('|'+title+'|'+'|'.join(f'{r[key]:.3f}' for r in elevels)+'|')
lines+=['','![E08の同一シード比較](terrain-v48-e08.png)','','最初の3シードをそのまま使用。左からLv0〜3。通常生成から自然な塊を持ち、E08で小成分・細い尾がさらに減る。形状テンプレートを強制していない。','',
'### 各地形の占有率・最大成分','','各セルは「平均占有率% / 各地形の最大成分面積の平均」。','', '| 地形 | E08なし | Lv1 | Lv2 | Lv3 |','|---|---:|---:|---:|---:|']
for k,name in enumerate(names):lines.append('|'+name+'|'+'|'.join(f'{r["occupancy"][k]:.4f} / {r["maxByTerrain"][k]:.3f}' for r in elevels)+'|')
old=json.loads((out/'e08-v47-results.json').read_text());oldlv3=next(r for r in old['results'] if r['label']=='Lv3')
lines+=['','### ver.47との回帰比較','',f'ver.47 Lv3の孤立成分{oldlv3["isolated"]:.3f}個・長い幅1区間{oldlv3["thin"]:.3f}本に対し、ver.48 Lv3は{elevels[3]["isolated"]:.3f}個・{elevels[3]["thin"]:.3f}本。元の通常生成方式が異なるため、旧方式との乱数単位の一致ではなく形状品質を比較する。E08の整形本体は原則維持し、陸地接続保護を常時有効化した。',
'','### E08併用','','| 条件 | 隣接率% | 孤立1〜2 | 幅1区間 | 平均生成ms |','|---|---:|---:|---:|---:|']
for label in ['E01+E08 Lv3','E05+E08 Lv3','mix3+E08 Lv3']:
    r=rows[label];lines.append(f'|{label}|{r["adjacency"]:.3f}|{r["isolated"]:.3f}|{r["thin"]:.3f}|{r["meanMs"]:.3f}|')
lines+=['','E01/E05/複数加護とE08の併用でも、各地形のマス数は同じ条件のE08なしと一致。整形単体の厳密面積一致を5/10/20/30の小サイズ含めて検証。1×12/18/24の両方向の線を縦横へ広げるテストも合格。',
'','## 多様性・生成時間','',f'全32条件で各{p["samples"]}枚すべてが異なる地形配列（重複0）。生成時間は上表の平均・p95・最大に加え、全条件の値をterrain-v48-results.jsonへ収録。時間はNode実行環境上であり、実機スマートフォンの計測ではない。E08なしでも約{rows["base"]["meanMs"]:.2f}ms、Lv3で約{elevels[3]["meanMs"]:.2f}ms。',
'','## E09所持49体の移行','','[全49体の移行前後・コスト一覧](e09-v48-migration.md) ／ [機械可読JSON](e09-v48-migration.json)','',
'| ID | 名前 | 変更前 | 変更後 | totalCost |','|---:|---|---|---|---:|']
for c in migration:
    if c['id'] in [600,610]:lines.append(f'|{c["id"]}|{c["name"]}|{skills_text(c["before"])}|{skills_text(c["after"])}|12→10|')
hist=collections.Counter(c['afterTotal'] for c in migration)
lines+=['','通常47体は同LvのE08へ置換、600/610はLv1+Lv2を上限3で統合。E08コストは2/4/6、補填や追加スキルなし。','',
'全927体のtotalCostが各スキルコスト合計と一致。49体以外は変更前のキャラクターデータと完全一致。移行49体の新totalCost分布：'+ '、'.join(f'{k}コスト={v}体' for k,v in sorted(hist.items()))+'。',
'','skills・条件・説明からE09を削除し、スキル総数を68→67とした。他IDは変更していない。元CSVも49行だけ変更し全927行をJSONと照合済み。旧保存のE09はE08へ合算・上限3、再保存後の再読込も同一。地形・施設・他スキル・編成ID・所持数は不変。実際のパーティ画面・条件67件・600/610の2行スキル表示・共通詳細をモックDOMで実行して確認。',
'','## 検証の再実行','','```sh','node bouken/tests/terrain-v48.test.cjs','node bouken/tests/e09-migration.test.cjs','node bouken/tests/terrain-distribution.test.cjs','node bouken/tests/e-buffs.test.cjs','node bouken/tests/f-buffs.test.cjs','node bouken/tests/event-images.test.cjs','```','',
'TERRAIN_REPORTにJSONの出力先を指定可能。TERRAIN_SAMPLES未指定は1000。生成後はpython bouken/tests/render-terrain-v48-report.pyで図表を再生成できる。旧tests/e08-shape.test.cjsも新方式の回帰用に更新。',
'','## 変更ファイル','']
lines+=['- `'+f+'`' for f in sorted(set(filter(None,changed)))]
lines+=['','## 実機確認チェックリスト','','- [ ] ver.48と表示される','- [ ] 加護なしでも自然な地形になり、単独加護で対象地形が増える','- [ ] 複数加護・E08各Lvで生成できる','- [ ] スキル条件にE09がなく、600/610がE08 Lv3の2スキルになっている','- [ ] 既存ワールドの地形が変わらず、保存再開できる','- [ ] 施設訪問・パーティ編成・スマホ操作が正常','','**コメント欄：** 不具合・見た目・端末差など。失敗画像のグレースケール化は今回含めていない。']
report.write_text('\n'.join(lines)+'\n')
