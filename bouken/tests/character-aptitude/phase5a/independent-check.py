"""Independent O(N^2) oracle using Python stdlib; never writes input or simulates."""
import csv,json,math,statistics
from pathlib import Path
P=Path(__file__).resolve().parent
fields=['development','companions','treasure','exploration']
def read(p):
 with p.open(newline='') as f:return list(csv.DictReader(f))
scores=read(P/'../scores.csv');out={int(c['id']):c for c in read(P/'relative-scores.csv')};comparisons={int(c['id']):c for c in read(P/'specialty-comparison.csv')}
assert len(scores)==len(out)==927
checked=0
for c in scores:
 r=out[int(c['id'])];assert r['name']==c['name'];metrics={}
 for k in fields:
  values=[int(x[k]) for x in scores];v=int(c[k]);mu=statistics.mean(values);sigma=statistics.pstdev(values);lower=sum(x<v for x in values);equal=sum(x==v for x in values);higher=sum(x>v for x in values)
  start=higher+1;end=higher+equal;mid=(start+end)/2
  expected=dict(absolute=v,deviation=50+10*(v-mu)/sigma if sigma else 50,percentile=100*(lower+(equal+1)/2-1)/(len(values)-1),rank=start,rankStart=start,rankEnd=end,rankMid=mid,tieCount=equal,topPercent=100*mid/len(values),topPercentStart=100*start/len(values),topPercentEnd=100*end/len(values))
  for key,want in expected.items():
   actual=float(r[k+'_'+key]);assert math.isclose(actual,want,rel_tol=1e-12,abs_tol=1e-10),(c['id'],k,key,actual,want);checked+=1
  metrics[k]=expected
 for method,col in [('absolute','absoluteFields'),('deviation','deviationFields'),('percentile','percentileFields')]:
  maximum=max(metrics[k][method] for k in fields);wanted=[k for k in fields if abs(metrics[k][method]-maximum)<=(0 if method=='absolute' else 1e-12)];assert json.loads(comparisons[int(c['id'])][col])==wanted
print(json.dumps(dict(passed=True,characters=927,fields=4,metricComparisons=checked,specialtySetComparisons=927*3,method='Python statistics.pstdev and direct less/equal/greater counts (independent of JS sorting)')))
