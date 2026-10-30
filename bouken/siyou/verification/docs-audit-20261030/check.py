"""Read-only documentation consistency check; never rewrites game/data/history."""
from pathlib import Path
import csv, hashlib, json, re, subprocess, collections, urllib.parse, zipfile
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[3]
S=ROOT/'bouken/siyou'
load=lambda p:json.loads(p.read_text())
rows=lambda p:list(csv.DictReader(p.read_text(encoding='utf-8-sig').splitlines()))
blob=lambda b:hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()
base=load(HERE/'baseline-tree.json');inv=load(HERE/'inventory.json');results={};fail=[]
def check(name,ok,detail=None):
 results[name]={'passed':bool(ok),'detail':detail}
 if not ok:fail.append(name)
check('inputInventory166',len(inv)==166 and len({x['path'] for x in inv})==166)
missing=[x['path'] for x in inv if not (ROOT/x['path']).is_file()]
check('allOriginalFilesRetained',not missing,missing)
protected=[x for x in base if not x['path'].startswith('bouken/siyou/')]
bad=[x['path'] for x in protected if not (ROOT/x['path']).is_file() or blob((ROOT/x['path']).read_bytes())!=x['sha']]
check('all518NonDocumentBlobsUnchanged',len(protected)==518 and not bad,bad)
immutable=[x for x in inv if '/history/' in x['path'] and not x['path'].endswith('/history/README.md') or x['type'] in ('csv','json','binary') or x['path'].endswith(('.cjs','.py'))]
bad=[x['path'] for x in immutable if blob((ROOT/x['path']).read_bytes())!=x['sha']]
check('originalArchiveDataAndEvidenceUnchanged',not bad,{'checked':len(immutable),'mismatches':bad})
bybase={x['path']:x['sha'] for x in base}
backups=['README.md','todo.txt','ゲーム仕様書.txt','更新内容と未決定事項.txt','実装構成・運用方針.md']
check('fiveOriginalEntryDocumentsPreserved',all(blob((S/'history/20261030監査前'/n).read_bytes())==bybase['bouken/siyou/'+n] for n in backups))
chars=load(ROOT/'bouken/data/characters.json');by={x['id']:x for x in chars};scores=rows(ROOT/'bouken/tests/character-aptitude/v3/scores.csv');fields=['development','companions','treasure','exploration','special']
check('927UniqueCharacterIds',len(chars)==927 and set(by)==set(range(1,928)))
check('v3All4635StoredScoresMatch',len(scores)==927 and all(by[int(x['id'])]['aptitudeScores']=={k:int(x[k+'_score']) for k in fields} for x in scores))
check('fiveScoresAreIntegers0To100',all(set(x['aptitudeScores'])==set(fields) and all(type(v)==int and 0<=v<=100 for v in x['aptitudeScores'].values()) for x in chars))
csvdiff={}
for name in ['characters.csv','927キャラクター割当結果.csv']:
 rs=rows(S/'source_csv'/name);csvdiff[name]={'rows':len(rs),'nameDifferences':sum(x['キャラクタ']!=by[int(x['番号'])]['name'] for x in rs),'descriptionDifferences':sum(x['説明']!=by[int(x['番号'])]['description'] for x in rs)}
 check(name+'Ids',len(rs)==927 and {int(x['番号']) for x in rs}==set(by))
rs=rows(S/'source_csv/927キャラクター割当結果.csv')
expected=lambda r:[dict(id=r[f'スキル{i}ID'],level=int(r[f'スキル{i}Lv']),cost=int(r[f'スキル{i}コスト'])) for i in [1,2,3] if r[f'スキル{i}ID']]
check('927SkillIdsLevelsCostsMatch',all(expected(r)==by[int(r['番号'])]['skills'] and int(r['合計コスト'])==by[int(r['番号'])]['totalCost'] for r in rs))
items=load(ROOT/'bouken/data/collection_items.json');names=re.findall(r'^    [1-5]\. (.+)$',(S/'博物館収集品_24大グループ96小グループ完成版.txt').read_text(),re.M)
check('480CollectionNamesMatch',len(names)==480 and names==[x['name'] for x in items])
rs=rows(S/'source_csv/博物館96小グループ報酬割当.csv');data=load(ROOT/'bouken/data/collection_rewards.json')
check('96RewardAssignmentsMatch',len(rs)==len(data)==96 and all((r['小グループID'],int(r['報酬ID']),r['完成時増分'])==(x['subgroupId'],x['rewardId'],x['amountText']) for r,x in zip(rs,data)))
rs=rows(S/'source_csv/称号120件マスター.csv');data=load(ROOT/'bouken/data/achievements.json')
check('120AchievementRowsMatch',len(rs)==len(data)==120 and all((int(r['ID']),r['系統'],r['称号名'],r['獲得条件'])==(x['id'],x['category'],x['name'],x['conditionText']) for r,x in zip(rs,data)))
parsed=[]
for p in S.rglob('*.json'):
 try:load(p);parsed.append(str(p.relative_to(ROOT)))
 except Exception as e:fail.append('json:'+str(p))
check('allDocumentationJsonParse',not any(x.startswith('json:') for x in fail),len(parsed))
with zipfile.ZipFile(S/'verification/facility-performance-v89-20261029.zip') as z:
 for member in z.namelist():z.read(member)
 check('historicZip84MembersCRC',len(z.namelist())==84 and z.testzip() is None)
# The old four broken links remain intentionally unmodified. New snapshot links retain old location semantics.
legacy=[];active=[];linkcount=0
for p in S.rglob('*.md'):
 if '20261030監査前' in p.parts:continue
 text=re.sub(r'```.*?```','',p.read_text(),flags=re.S)
 for m in re.finditer(r'\]\(([^\s)]+)(?:\s+"[^"]*")?\)',text):
  u=urllib.parse.unquote(m[1].strip('<>'));target=u.split('#')[0].split('?')[0]
  if not target or re.match(r'\w+://',target) or target.startswith('mailto:'):continue
  linkcount+=1
  if not (p.parent/target).exists():
   entry={'source':str(p.relative_to(ROOT)),'target':u}
   (legacy if '20261025整理前' in p.parts else active).append(entry)
check('noMissingActiveRelativeLinks',not active,active)
check('only4PreservedHistoricBrokenLinks',len(legacy)==4,legacy)
# Reconcile claims that matter for the next development session.
text=(S/'todo.txt').read_text();game=(ROOT/'bouken/world.html').read_text()
check('5x5ConditionAndAcceptedTodo',"hidden=w.width===5&&w.height===5" in game and '[x] ver.100' in text and '検証OK' in text)
check('temporaryOpenAllRemovalTodoPreserved','TEMP verification shortcut' in game and '最終仕上げ時に必ず削除' in text)
check('withdrawnBypassNotPending',not any(line.startswith('[ ]') and '黒1マス' in line for line in text.splitlines()))
check('phase6CompletePhase7Pending','Phase6理論実測監査完了' in text and '[ ] 適性Phase7' in text)
check('difficultyAndD04StillUnimplemented','[ ] 算数難易度切り替え' in text and '[ ] 32-D04' in text)
manifest=load(ROOT/'bouken/tests/party-recommendation/source-manifest.json');mismatch=[p for p,h in manifest['gitBlobs'].items() if blob((ROOT/p).read_bytes())!=h]
diag=subprocess.run(['node','bouken/tests/forecast-runtime.test.cjs'],cwd=ROOT,capture_output=True,text=True,timeout=60)
check('knownWorkerFailureAccuratelyRecorded',manifest['version']==99 and set(mismatch)=={'bouken/world.html','bouken/worldcreate.html','bouken/common/version.js'} and diag.returncode!=0 and 'Source changed' in (diag.stderr+diag.stdout) and 'G-01' in text)
findings=load(HERE/'findings.json')['findings'];check('28UniqueFindingsWithEvidence',len(findings)==28 and len({x['id'] for x in findings})==28 and all(x['evidence'] for x in findings))
output={'baselineCommit':'023b9404a91bcfbcc7f94095109831a1cbac47f7','gameVersion':100,'scope':'documentation only; no new game browser run or historic experiment rerun','documentChecksPassed':not fail,'checks':results,'failures':fail,'csvDifferences':csvdiff,'linksChecked':linkcount,'findingCounts':dict(collections.Counter(x['category'] for x in findings)),'knownUnfixedWorker':{'manifestVersion':manifest['version'],'mismatches':mismatch,'exitCode':diag.returncode,'output':(diag.stdout+diag.stderr).strip()},'notVerified':['robot-state-v86.jpg visual content (cannot decode)','all external URLs/live deployment states','all historic experiment results rerun','new phone/browser acceptance','v3 generation source/approval scope']}
print(json.dumps(output,ensure_ascii=False,indent=2))
raise SystemExit(1 if fail else 0)
