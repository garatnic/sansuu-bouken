import csv,json,sys
from pathlib import Path
r=Path(sys.argv[1]) if len(sys.argv)>1 else Path(__file__).parent/'results-20261026'
d=json.loads((r/'main.json').read_text())
for field,teams in d['specialists'].items():
 with (r/(field+'-30teams.csv')).open(encoding='utf-8-sig',newline='') as f: rows=list(csv.DictReader(f))
 assert len(rows)==30
 for row,t in zip(rows,teams):
  assert [int(row['仲間ID'+str(i)]) for i in range(1,6)]==t['party']
  metric=d['summary'][field]['metric']
  assert all(float(row['M'+str(i+1).zfill(2)+'実成果'])==t['trials'][i]['metrics'][metric] for i in range(10))
  assert float(row['10マップ平均'])==t['means'][metric]
  assert float(row['基準との差'])==t['difference']
  assert (row['基準超え判定']=='基準超え')==t['aboveBaseline']
with (r/'specialists-30teams-per-field.csv').open(encoding='utf-8-sig',newline='') as f: assert len(list(csv.DictReader(f)))==120
print('PASS 4 x 30-team CSVs and combined 120 rows match original member IDs, 10 outcomes, averages, differences and decisions')
