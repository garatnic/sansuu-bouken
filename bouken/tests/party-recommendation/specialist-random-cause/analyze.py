import json,math,statistics,csv,sys
from pathlib import Path
R=Path(sys.argv[1]) if len(sys.argv)>1 else Path(__file__).parent/'results-20261026'
p=json.loads((R/'plan.json').read_text());d=json.loads((R/'results.json').read_text());previous=Path(__file__).parent/'../specialist-random/results-20261026';old=json.loads((previous/'main.json').read_text())
mean=statistics.mean
var=lambda x: statistics.variance(x) if len(x)>1 else 0

def corr(x,y):
 rank=lambda z:[1+sum(t<v for t in z)+(sum(t==v for t in z)-1)/2 for v in z]
 a,b=rank(x),rank(y);ma,mb=mean(a),mean(b);den=math.sqrt(sum((v-ma)**2 for v in a)*sum((v-mb)**2 for v in b))
 return sum((v-ma)*(w-mb) for v,w in zip(a,b))/den if den else None

def decompose(matrix):
 I,J=len(matrix),len(matrix[0]);grand=mean(v for row in matrix for v in row);rows=[mean(x) for x in matrix];cols=[mean(matrix[i][j] for i in range(I)) for j in range(J)]
 ssA=J*sum((v-grand)**2 for v in rows);ssB=I*sum((v-grand)**2 for v in cols);ssE=sum((matrix[i][j]-rows[i]-cols[j]+grand)**2 for i in range(I) for j in range(J));total=sum((v-grand)**2 for row in matrix for v in row)
 msA=ssA/(I-1);msB=ssB/(J-1);msE=ssE/((I-1)*(J-1));va=(msA-msE)/J;vb=(msB-msE)/I
 return {'grand':grand,'conditionalAnchorVariance':mean(var([matrix[i][j] for i in range(I)]) for j in range(J)),'conditionalBackgroundVariance':mean(var(row) for row in matrix),'rowMeanVariance':var(rows),'columnMeanVariance':var(cols),'SS':{'anchor':ssA,'background':ssB,'interactionAndFiniteMapNoise':ssE,'total':total},'df':{'anchor':I-1,'background':J-1,'residual':(I-1)*(J-1)},'MS':{'anchor':msA,'background':msB,'residual':msE},'componentUntruncated':{'anchor':va,'background':vb,'residual':msE},'componentNonnegative':{'anchor':max(0,va),'background':max(0,vb),'residual':msE},'rows':rows,'columns':cols}

out={'planHash':d['planHash'],'adventures':d['adventures'],'wallMs':d['wallMs'],'fields':{},'previousObservations':{}}
combined=[]
headers=['分野','チームID','起点ID','元の個人順位','残り4人セットID',*[f'残りID{i}' for i in range(1,5)],*[x['id']+'実成果' for x in p['maps']],'10マップ平均','完全ランダム基準','基準との差','基準超え']
for field,design in p['fields'].items():
 rows=d['results'][field]['rows'];anchors=design['anchors'];backs=design['backgrounds'];metric=design['metric'];matrix=[[next(t['mean'] for t in rows if t['anchor']==a['id'] and t['background']==b['id']) for b in backs] for a in anchors]
 stats=decompose(matrix);leaveB=[decompose([[v for j,v in enumerate(row) if j!=drop] for row in matrix]) for drop in range(5)];leaveA=[decompose([row for i,row in enumerate(matrix) if i!=drop]) for drop in range(10)]
 astats=[]
 for i,a in enumerate(anchors):
  vals=matrix[i];oldrows=[t for t in old['specialists'][field] if t['anchor']==a['id']];astats.append({**a,'mean':mean(vals),'min':min(vals),'max':max(vals),'variance':var(vals),'sd':math.sqrt(var(vals)),'above':sum(v>design['baseline'] for v in vals),'aboveRate':sum(v>design['baseline'] for v in vals)/5,'backgroundMeans':vals,'oldCount':len(oldrows),'oldAbove':sum(t['aboveBaseline'] for t in oldrows),'oldRange':[min(t['means'][metric] for t in oldrows),max(t['means'][metric] for t in oldrows)] if oldrows else None})
 bstats=[]
 for j,b in enumerate(backs):
  vals=[matrix[i][j] for i in range(10)];bstats.append({**b,'mean':mean(vals),'min':min(vals),'max':max(vals),'variance':var(vals),'sd':math.sqrt(var(vals)),'above':sum(v>design['baseline'] for v in vals),'anchorMeans':vals})
 pairCorrelations=[corr([matrix[i][j] for i in range(10)],[matrix[i][k] for i in range(10)]) for j in range(5) for k in range(j+1,5)]
 q={'baseline':design['baseline'],'matrix':matrix,'anchors':astats,'backgrounds':bstats,'decomposition':stats,'leaveOneBackground':leaveB,'leaveOneAnchor':leaveA,'originalScoreVsMeanSpearman':corr([a['score'] for a in anchors],[a['mean'] for a in astats]),'anchorRanksAcrossBackgroundCorrelations':pairCorrelations,'above':sum(t['above'] for t in rows),'teams':50,'minimum':min(t['mean'] for t in rows),'maximum':max(t['mean'] for t in rows),'previousAbove':design['previousAbove'],'pairedAnchorDifferences':[{'first':a['id'],'second':b['id'],'differences':[matrix[i][j]-matrix[k][j] for j in range(5)],'meanDifference':mean(matrix[i][j]-matrix[k][j] for j in range(5))} for i,a in enumerate(anchors) for k,b in enumerate(anchors) if i<k]}
 out['fields'][field]=q;out['previousObservations'][field]=[x for x in astats if x['id'] in ([91,67,434] if field=='treasure' else [202])]
 csvrows=[]
 for t in rows:
  row=[field,t['id'],t['anchor'],t['originalRank'],t['background'],*t['remaining'],*[x['metrics'][metric] for x in t['trials']],t['mean'],t['baseline'],t['difference'],t['above']];csvrows.append(row);combined.append(row)
 with (R/(field+'-teams.csv')).open('w',encoding='utf-8-sig',newline='') as f:writer=csv.writer(f,lineterminator='\n');writer.writerow(headers);writer.writerows(csvrows)
with (R/'all-teams.csv').open('w',encoding='utf-8-sig',newline='') as f:writer=csv.writer(f,lineterminator='\n');writer.writerow(headers);writer.writerows(combined)
(R/'analysis.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
for field,q in out['fields'].items():
 print(field,json.dumps({'above':q['above'],'scoreRho':q['originalScoreVsMeanSpearman'],'decomposition':q['decomposition'],'leaveBComponents':[x['componentNonnegative'] for x in q['leaveOneBackground']]},ensure_ascii=False))
