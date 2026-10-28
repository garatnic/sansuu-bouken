"""Read-only independent theory oracle; no game VM/adventure execution."""
from pathlib import Path
import csv,json,math,statistics
P=Path(__file__).resolve().parent
F=['development','companions','treasure','exploration']
def read(p):
 with p.open(newline='') as f:return list(csv.DictReader(f))
chars=json.loads((P/'../../../data/characters.json').resolve().read_text());base=json.loads((P/'../scoring-v1.json').read_text());scenarios=json.loads((P/'scenarios.json').read_text())['scenarios'];stored=read(P/'scenario-scores.csv');checks=0
for scenario in scenarios:
 definition={s['id']:s for s in base['skills']};output={}
 for c in chars:
  raw=[0.,0.,0.,0.];levels={s['id']:s['level'] for s in c['skills']}
  for skill in sorted(c['skills'],key=lambda s:s['id']):
   d=definition[skill['id']];shares=d['share']
   if skill['id'] in [f'E0{i}' for i in range(1,8)]:shares=[scenario['developmentShare'],0,0,scenario['explorationShare']]
   for i in range(4):raw[i]+=d['base'][skill['level']-1]*shares[i]/100
  bonus=[0.,0.,0.,0.]
  for i in range(1,8):
   a=levels.get(f'A{i+3:02}',0);e=levels.get(f'E0{i}',0)
   if a and e:bonus[0]+=min(6,2*min(a,e))
  for a,b,k in [('B02','C01',2),('B03','D01',1),('F01','C04',2),('F02','D05',1)]:
   if a in levels and b in levels:bonus[k]+=2
  raw=[x+min(8,bonus[i]) for i,x in enumerate(raw)]
  absolute=[math.floor(100*(1-math.exp(-max(0,x)/35))+.5) for x in raw]
  output[c['id']]=dict(raw=raw,absolute=absolute)
 means=[statistics.mean(v['absolute'][i] for v in output.values()) for i in range(4)];sigmas=[statistics.pstdev(v['absolute'][i] for v in output.values()) for i in range(4)]
 record={int(r['id']):r for r in stored if r['scenario']==scenario['id']};assert len(record)==927
 for id,c in output.items():
  z=[]
  for i,k in enumerate(F):
   score=c['absolute'][i];values=[v['absolute'][i] for v in output.values()];lower=sum(x<score for x in values);equal=sum(x==score for x in values);higher=sum(x>score for x in values)
   dev=50+10*(score-means[i])/sigmas[i] if sigmas[i] else 50;z.append(dev)
   expected=dict(absolute=score,raw=c['raw'][i],deviation=dev,percentile=100*(lower+(equal+1)/2-1)/926,rank=higher+1,tieCount=equal)
   for metric,value in expected.items():assert math.isclose(float(record[id][k+'_'+metric]),value,rel_tol=1e-11,abs_tol=1e-9),(scenario['id'],id,k,metric);checks+=1
  eligible=[i for i in range(4) if c['raw'][i]>0];maximum=max((z[i] for i in eligible),default=None);wanted=[F[i] for i in eligible if abs(z[i]-maximum)<=1e-12];assert json.loads(record[id]['specialty'])==wanted
print(json.dumps(dict(passed=True,scenarios=3,charactersPerScenario=927,metricChecks=checks,specialtyChecks=3*927,additionalSimulations=0)))
