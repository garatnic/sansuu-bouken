import json,statistics
from pathlib import Path
root=Path(__file__).parent
summary={}
for split in ['development','holdout']:
 for engine in ['baseline','improved']:
  p=root/f'e3-{engine}-{split}.json'
  if not p.exists():continue
  d=json.loads(p.read_text());cases=d['cases'];flex=[c for c in cases if c['spec']['fixed']<len(next(iter(c['banks'].values()))['parties'][0])]
  weak=[{'spec':c['spec'],'mode':v['mode'],'other':v['other'],'ratio':v['rawRatio'],'ci':v['pairedRaw']['interval95']} for c in cases for v in c['specialist'] if v['rawRatio']<.9]
  retry=[]
  for c in flex:
   for i,mode in enumerate(['balanced','explore','treasure','companion','map']):
    b=c['banks'][mode]
    if i:
     best=max(v['raw'][i-1] for v in b['audit'])
     ratios=[v['raw'][i-1]/best if best else 1 for v in b['audit']]
     retry.append({'spec':c['spec'],'mode':mode,'minRatio':min(ratios),'count':len(ratios)})
  summary[engine+'-'+split]={'cases':len(cases),'flexibleModes':len(flex)*5,'singleBanks':sum(b['count']==1 for c in flex for b in c['banks'].values()),'weakRaw':weak,'significantWeak':sum(w['ci'][1]<0 for w in weak),'milliseconds':{'min':min(c['ms'] for c in cases),'median':statistics.median(c['ms'] for c in cases),'max':max(c['ms'] for c in cases)},'retryBelow90':sum(x['minRatio']<.9 for x in retry),'retryChecks':len(retry),'minAbilityDistance':min((b['minDistance'] for c in flex for b in c['banks'].values() if b['minDistance'] is not None),default=None)}
print(json.dumps(summary,ensure_ascii=False,indent=2))
