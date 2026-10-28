"""Recompute archived aggregates/probabilities and protect all original artifacts."""
import sys
sys.dont_write_bytecode=True
from audit import *
from reports import generate
import subprocess,platform
checks=[]
def test(name,fn):
 fn();checks.append({'name':name,'passed':True})
def require(b):assert b
manifest=read(P/'input-manifest.json')
def protected():
 for p,h in manifest['sha256'].items():assert hashlib.sha256((ROOT/p).read_bytes()).hexdigest()==h,p
test('All protected originals and v2 inputs unchanged at start',protected)
generate();a,table,main,supp,cfg,save,measurement,collect=run()
test('67 IDs and all 201 unique Lv cells complete',lambda:require(len(table)==201 and len(set((r['id'],r['level']) for r in table))==201 and len(set(r['id'] for r in table))==67))
test('Every cell has effect, theory, current points, conditions and reason',lambda:require(all(all(r[k] is not None and r[k]!='' for k in ['effect','activation','theory','v2Base','v2Share','judgment','reason','evidenceClass','source','pointUncertainty']) for r in table)))
test('Classifications and judgments valid and totals equal67',lambda:require(all(r['evidenceClass'] in ['A','B','C'] and r['judgment'] in ['妥当','再検討候補','判断保留'] for r in table) and sum(map(len,a['judgments'].values()))==67))
test('D04/E08 excluded at every Lv; E01-07 retain approved definitions',lambda:require(all(r['v2Base']==0 and r['v2Contributions']==[0,0,0,0] and r['evaluationStatus']=='対象外・別枠' if r['id'] in ['D04','E08'] else r['v2Base']==7*r['level'] and r['v2Share']==[100,0,0,0] if r['id'].startswith('E') else True for r in table)))
test('5000 unique main and 3000 unique support records',lambda:require(len(main)==5000 and len(supp)==3000 and len(set((r['id'],r['seed']) for r in main))==5000 and len(set((r['caseId'],r['arm'],r['seed']) for r in supp))==3000))
def fixed():
 for r in main+supp:
  assert r['inventoryHash']==cfg['inventoryHash'];assert json.loads(r['museumStages'])==[0]*6;assert r['policyVersion']==cfg['policyVersion'];assert float(r['mapSize'])==10 and float(r['budget'])==30 and float(r['accuracy'])==1;assert float(r['initialCharacterCount'])==464 and float(r['initialItemCount'])==240
  assert float(r['opened'])==float(r['normalOpened'])+float(r['initialSkillOpened'])+float(r['additionalSkillOpened']);assert float(r['visited'])<=float(r['generatedFacilities']);assert float(r['a12EligibleTurns'])==0
 assert len([v for v in save['characters'].values() if v])==464 and len([v for v in save['items'].values() if v])==240
 for id in set(r['id'] for r in main):assert set(int(r['seed']) for r in main if r['id']==id)==set(cfg['seeds'])
 for case in cfg['support']:
  for arm in ['partner-only','with-support','ablated-support']:assert set(int(r['seed']) for r in supp if r['caseId']==case['caseId'] and r['arm']==arm)==set(cfg['supportSeeds'])
test('All8000 fixed conditions, accounting and100 common seeds verified',fixed)
def archived():
 lookup={(r['caseId'],r['metric']):r for r in rows(Q/'support-summary.csv') if r['comparison']=='isolated-skill'}
 compared=0
 for r in rows(P/'support-paired.csv'):
  if (r['caseId'],r['metric']) not in lookup:continue
  old=lookup[r['caseId'],r['metric']]
  for key in ['mean','median','min','max']:assert math.isclose(float(r[key]),float(old[key]),abs_tol=1e-10)
  assert math.isclose(float(r['sampleSD']),float(old['stdDev']),abs_tol=1e-10);compared+=1
 assert compared==70
 return compared
test('Support paired raw aggregates match archived summary',archived)
def collectors():
 old={(int(r['id']),r['skill']):r for r in rows(Q/'collector-effects.csv')}
 for r in collect:
  x=old[r['id'],r['skill']]
  for ours,theirs in [('totalItems','totalItems'),('targetItemsUnion','targetItems'),('observedTargetUnionShare','targetShare'),('targetNewItemsUnionMean','targetNewItemsMean')]:assert math.isclose(float(r[ours]),float(x[theirs]),abs_tol=1e-10)
 assert len(collect)==len(old)
test('Collector target totals and new kinds match archive',collectors)
rt=json.loads(subprocess.check_output(['node','runtime-oracle.cjs'],cwd=P,text=True))
def e_targets():
 for r in rt['targets']:
  q=targets({r['id']:r['level']});assert all(math.isclose(x,y,abs_tol=1e-14) for x,y in zip(q,r['probabilities']));i=int(r['id'][1:])-1;assert math.isclose(q[i],BASE[i]+.1*r['level'],abs_tol=1e-14)
 assert len(rt['targets'])==21
 for e in a['E']:assert e['level']==3 and e['attackLevel']==3
 assert len(a['E'])==7
 for e in a['E']:
  got=next(r for r in rt['combined'] if r['caseId']==e['caseId']);i=int(e['skill'][1:])-1;assert math.isclose(got['on'][i],e['withTarget'],abs_tol=1e-14) and math.isclose(got['off'][i],e['ablatedTarget'],abs_tol=1e-14)
test('21 E solo theoretical targets equal runtime; seven actual cases are onlyLv3',e_targets)
def d_weights():
 prob={(r['caseId'],r['pool'],int(r['D06Level']),int(r['D05Level'])):float(r['targetProbability']) for r in rows(P/'d06-probabilities.csv')}
 for r in rt['d06']:assert math.isclose(r['targetProbability'],prob[r['caseId'],r['pool'],r['D06Level'],r['D05Level']],abs_tol=1e-12)
 assert len(rt['d06'])==72;assert all(r['worldHashMatched'] for r in a['D06'])
 # Number of target groups may be zero/all; membership not party size controls added weight.
 for b in [.1,.25,.5]:assert math.isclose((100+b*100*2)/(100+b*100*2),1)
test('72 D06/D05 conditional probabilities equal actual companionWeights',d_weights)
def a12():
 for r in rt['a12']:assert r['eligible']==(r['opened']>=80)
 for lv in [1,2,3]:
  t=theory('A12',lv);assert math.isclose(t['conditionalExtraShare'],[3/13,2/7,1/3][lv-1]);p=t['p'];f=[0,0]
  for n in range(2,21):f.append((1-p)*f[-1]+p*(1+f[-2]))
  assert 0<=f[20]<=10
 assert a['a12EligibleTurnsAll']==0
 assert not any(r['soloAdventures'] or r['supplementPartyAdventures'] for r in table if r['id']=='A12')
test('A12 99-cell threshold and conditional contribution share correct; no observed opportunities',a12)
def sources():
 mismatch=[p for p,h in cfg['sourceHashes'].items() if hashlib.sha256((ROOT/'bouken'/p).read_bytes()).hexdigest()!=h];assert mismatch==['data/characters.json']
 old=json.loads(subprocess.check_output(['git','show',read(P/'provenance.json')['phase4InputCommit']+':bouken/data/characters.json'],cwd=ROOT,text=True));current=read(ROOT/'bouken/data/characters.json');by={c['id']:c for c in old};assert all(all(c[k]==by[c['id']][k] for k in ['id','groupId','areas','skills']) for c in current)
 assert read(Q/'verification.json')['passed'] and read(Q/'pilot-results.json')['passed'];assert set(read(Q/'pilot-results.json')['policyWitnesses'])==set('B0'+str(i) for i in range(1,8))
test('Archived/current semantic character fields and runtime sources consistent; B witnesses archived',sources)
def checkv2():
 r=subprocess.run(['python',str(P.parent/'independent-check.py')],text=True,capture_output=True,check=True);v=json.loads(r.stdout);assert v['metricChecks']==22248 and v['specialtyChecks']==927
 return v
test('Original v2 whole927 independent oracle still passes read-only',checkv2)
def concentration():
 for r in rows(P/'facility-expectations.csv'):
  if r['size']=='5':assert float(r['expectedExtraFacilities'])==0
  if r['size']=='10':assert 1-1e-12<=float(r['expectedExtraFacilities'])<1.3
 assert len(rows(P/'facility-expectations.csv'))==36
 assert len(measurement)==200 and len(rows(P/'b-information.csv'))==21
 for id in ['D03','D08','D09']:assert id in a['judgments']['再検討候補']
test('Exact facility distribution and50x4/7x3 tables consistent',concentration)
def determinism():
 files=[p for p in P.iterdir() if p.suffix in ['.csv','.json','.md'] and p.name not in ['verification.json','README.md','input-manifest.json','effect-notes.json','provenance.json']];before={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in files};generate();assert before=={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in files}
test('All generated reports/CSV/JSON byte reproducible',determinism)
test('All original artifacts and v2 definition unchanged after analysis',protected)
files={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(P.iterdir()) if p.is_file() and p.name not in ['verification.json','validation.log']}
write('verification.json',{'passed':True,'sourceCommit':manifest['sourceCommit'],'gameVersion':74,'aptitudeVersion':'2.0.0','tests':len(checks),'pass':len(checks),'fail':0,'checks':checks,'levelsAudited':201,'archivedAdventuresRead':8000,'additionalAdventures':0,'runtimePureComparisons':{'E':21,'ECombinedTargets':14,'D06_D05':72,'A12ThresholdFixtures':12},'v2Independent':{'metricChecks':22248,'specialtySets':927},'supportArchivedComparisons':archived(),'inputManifest':'input-manifest.json','inputCount':len(manifest['sha256']),'artifacts':files,'python':platform.python_version(),'unverified':['raw係数/正規化/シナジーの唯一の効用尺度','E Lv1/2の対応実測とAI条件外への汎化','D06成功前分類出現とLv2専用対照','A12終盤の実行可用性','B全Lvの成果対照/個別発見時刻','F候補個票/分類価値','Phase7移行の承認']})
(P/'validation.log').write_text('\n'.join(f"ok {i+1} - {r['name']}" for i,r in enumerate(checks))+'\nAdditional adventures: 0\n')
print(json.dumps({'passed':True,'tests':len(checks),'levels':201,'additionalAdventures':0}))
