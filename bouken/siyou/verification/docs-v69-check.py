# 資料/CSV/JSONの全件照合。ゲームのセーブを操作しない。
from pathlib import Path
import csv,json,re,collections,hashlib
B=Path(__file__).resolve().parents[2];R=B.parent;load=lambda name:json.loads((B/'data'/name).read_text());rows=lambda name:list(csv.DictReader((B/'siyou/source_csv'/name).open(encoding='utf-8-sig')))
c=load('characters.json');by={x['id']:x for x in c};skills={x['id']:x['name'] for x in load('skills.json')};assert len(c)==927 and set(by)==set(range(1,928));assert len(skills)==67 and 'E09' not in skills
base=rows('characters.csv');assign=rows('927キャラクター割当結果.csv')
for r in base+assign:
 x=by[int(r['番号'])]
 for field,key in [('キャラクタ','name'),('JOB','job'),('所在地','location'),('説明','description'),('族','race')]:assert r[field]==x[key],(r['番号'],field)
 for field,key in [('大グループ番号','groupId'),('小グループ番号','subgroupId')]:assert int(r[field])==x[key]
 for field,key in [('人エリア','human'),('魔エリア','monster'),('危険エリア','danger')]:assert int(r[field])==x['areas'][key]
for r in assign:
 x=by[int(r['番号'])];s=[]
 for n in range(1,4):
  id=r['スキル'+str(n)+'ID']
  if not id:continue
  assert r['スキル'+str(n)+'名称']==skills[id]
  s.append(dict(id=id,level=int(r['スキル'+str(n)+'Lv']),cost=int(r['スキル'+str(n)+'コスト'])))
 assert s==x['skills'];assert sum(y['cost'] for y in s)==x['totalCost']==int(r['合計コスト'])
g=load('character_groups.json');assert len(g['groups'])==24 and len(g['subgroups'])==103
for r in base:
 assert g['groups'][str(int(r['大グループ番号']))]==r['大グループ名']
 assert g['subgroups'][str(int(r['小グループ番号']))]==r['小グループ名']
a=load('achievements.json');ac=rows('称号120件マスター.csv');assert len(a)==len(ac)==120
for r,x in zip(ac,a):assert (int(r['ID']),r['系統'],r['称号名'],r['獲得条件'])==(x['id'],x['category'],x['name'],x['conditionText'])
items=load('collection_items.json');assert len(items)==480
names=re.findall(r'^    [1-5]\. (.+)$',(B/'siyou/博物館収集品_24大グループ96小グループ完成版.txt').read_text(),re.M);assert names==[x['name'] for x in items]
reward=load('collection_rewards.json');rc=rows('博物館96小グループ報酬割当.csv');assert len(reward)==len(rc)==96
for r,x in zip(rc,reward):assert (r['小グループID'],int(r['報酬ID']),r['完成時増分'])==(x['subgroupId'],x['rewardId'],x['amountText'])
assert collections.Counter(x['rewardId'] for x in reward)==dict.fromkeys(range(1,7),16)
for name,count in load('manifest.json')['counts'].items(): assert len(load(name+'.json'))==count,(name,count)
assert len(load('skill_messages.json'))==67;assert set(load('skill_messages.json'))==set(skills);assert set(load('skill_descriptions.json'))<=set(skills)
# Read every machine-readable report fully, preserving original measurements.
reports={}
for p in (B/'siyou/verification').glob('*.json'):
 if p.name.startswith('docs-v69-'):continue
 d=json.loads(p.read_text());reports[p.name]={'kind':type(d).__name__,'entries':len(d),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
result={'characters':927,'characterGroups':24,'characterSubgroups':103,'skills':67,'implementedSkills':66,'collectionItems':480,'collectionGroups':24,'collectionSubgroups':96,'rewardTypes':6,'rewardGroupsPerType':16,'achievements':120,'characterCosts':dict(collections.Counter(x['totalCost'] for x in c)),'characterSkillSlots':dict(collections.Counter(len(x['skills']) for x in c)),'sourceCsvRows':{n:len(rows(n)) for n in ['characters.csv','927キャラクター割当結果.csv','博物館96小グループ報酬割当.csv','称号120件マスター.csv']},'reports':reports}
print(json.dumps(result,ensure_ascii=False,indent=2))
