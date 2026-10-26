import json,csv,math,sys
from pathlib import Path
r=Path(sys.argv[1]) if len(sys.argv)>1 else Path(__file__).parent/'results-20261026'
p=json.loads((r/'plan.json').read_text());d=json.loads((r/'results.json').read_text());a=json.loads((r/'analysis.json').read_text())
def pairvar(v):return sum((v[i]-v[j])**2 for i in range(len(v)) for j in range(i))/(len(v)*(len(v)-1))
for field,design in p['fields'].items():
 rows=d['results'][field]['rows'];q=a['fields'][field];m=q['matrix'];I,J=len(m),len(m[0]);va=sum(pairvar([m[i][j] for i in range(I)]) for j in range(J))/J;vb=sum(pairvar(row) for row in m)/I
 assert math.isclose(va,q['decomposition']['conditionalAnchorVariance'],rel_tol=1e-12);assert math.isclose(vb,q['decomposition']['conditionalBackgroundVariance'],rel_tol=1e-12)
 ss=q['decomposition']['SS'];assert math.isclose(ss['anchor']+ss['background']+ss['interactionAndFiniteMapNoise'],ss['total'],rel_tol=1e-12)
 with (r/(field+'-teams.csv')).open(encoding='utf-8-sig',newline='') as f: csvrows=list(csv.DictReader(f))
 assert len(csvrows)==50
 for row,t in zip(csvrows,rows):
  assert row['チームID']==t['id'] and int(row['起点ID'])==t['anchor']
  assert [int(row['残りID'+str(i)]) for i in range(1,5)]==t['remaining']
  assert all(float(row['M'+str(i+1).zfill(2)+'実成果'])==t['trials'][i]['metrics'][design['metric']] for i in range(10))
  assert float(row['10マップ平均'])==t['mean'];assert float(row['基準との差'])==t['difference'];assert (row['基準超え']=='True')==t['above']
with (r/'all-teams.csv').open(encoding='utf-8-sig',newline='') as f:assert len(list(csv.DictReader(f)))==100
print('PASS conditional sample variances recomputed via pairwise squared differences; SS decomposition identity; all CSV IDs/10-map values/means/differences/decisions match original 100 teams. No adventures.')
