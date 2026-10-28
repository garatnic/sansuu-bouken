"""Read-only analysis of archived CSV and deterministic probability formulae; no adventures."""
from pathlib import Path
import csv,json,math,statistics,hashlib
P=Path(__file__).resolve().parent; ROOT=P.parents[4]; A=P.parents[1]; Q=A/'phase4'
F=['development','companions','treasure','exploration'];LABEL=['開拓','仲間','お宝','探索'];BASE=[.11,.20,.18,.14,.13,.13,.11]
def read(p):return json.loads(p.read_text())
def rows(p):
 with p.open(newline='') as f:return list(csv.DictReader(f))
def write(n,x):(P/n).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def csvout(n,data,keys=None):
 with (P/n).open('w',newline='') as f:
  w=csv.DictWriter(f,fieldnames=keys or list(data[0]));w.writeheader();w.writerows({k:json.dumps(v,ensure_ascii=False,separators=(',',':')) if isinstance(v,(dict,list)) else v for k,v in r.items()} for r in data)
def avg(rr,k):return statistics.mean(float(r[k]) for r in rr) if rr else None
def stats(v):return dict(n=len(v),mean=statistics.mean(v),median=statistics.median(v),sampleSD=statistics.stdev(v) if len(v)>1 else 0,min=min(v),max=max(v))
def paired(rr,k):
 a={int(r['seed']):r for r in rr if r['arm']=='with-support'}; b={int(r['seed']):r for r in rr if r['arm']=='ablated-support'};v=[float(a[s][k])-float(b[s][k]) for s in sorted(a)];d=stats(v);e=1.9842169515*d['sampleSD']/10;return {**d,'ci95Low':d['mean']-e,'ci95High':d['mean']+e}
def ranks(v):return [sum(y<x for y in v)+(sum(y==x for y in v)+1)/2 for x in v]
def corr(x,y):
 a=statistics.mean(x);b=statistics.mean(y);d=sum((v-a)**2 for v in x)*sum((v-b)**2 for v in y);return sum((v-a)*(w-b) for v,w in zip(x,y))/math.sqrt(d) if d else None
def targets(buffs):
 w=[p+(.1*buffs.get('E0'+str(i+1),0)/(1-p-.1*buffs.get('E0'+str(i+1),0)) if buffs.get('E0'+str(i+1),0) else 0) for i,p in enumerate(BASE)];return [x/sum(w) for x in w]
def allocate(q):
 raw=[100*x for x in q];out=[max(1,math.floor(x)) for x in raw]
 while sum(out)<100:
  i=max(range(7),key=lambda i:raw[i]-out[i]);out[i]+=1
 while sum(out)>100:
  i=max((i for i in range(7) if out[i]>1),key=lambda i:out[i]-raw[i]);out[i]-=1
 return out
def theory(id,lv):
 n=int(id[1:]);p=[.05,.10,.20][lv-1];r=[.3,.4,.5][lv-1]
 if id=='A01':return {'formula':'E追加=正解通常開拓回数×p×追加可能率。追加は再抽選しない','p':p,'idealPer30':30*p,'conditionalExtraShare':p/(1+p)}
 if id=='A02':return {'formula':'E追加=機会数×p×E[起点の隣接未開拓数|発動]。通常操作は最大3、関数の一般上限4','p':[.02,.035,.05][lv-1],'idealPer30Range':[0,30*[.02,.035,.05][lv-1]*3]}
 if id=='A03':return {'formula':'追加回数=floor(累計after/k)−floor(既判定/k)、追加可能数で制約。自己再帰なし','interval':[20,15,10][lv-1],'ideal30NormalOnly':30//[20,15,10][lv-1]}
 if id.startswith('A') and 4<=n<=10:return {'formula':'E追加=正解通常開拓回数×選択地形比率q×p×追加可能率','p':[.2,.3,.4][lv-1],'baseUniformPer30':30*BASE[n-4]*[.2,.3,.4][lv-1]}
 if id=='A11':return {'formula':'出発時の未開拓・範囲内の固定offsetの個数','center10x10':[4,8,12][lv-1]}
 if id=='A12':return {'formula':'条件成立後のみ、E通常=1、E追加=p（追加可能率1）。寄与割合=p/(1+p)。冒険全体はΣeligible(p*a_t)で地図残数が上限','p':r,'conditionalExtraShare':r/(1+r),'playableCells':99,'remainingThreshold':19,'triggerAfterNormalOpenedAtLeast':80,'idealTailRecurrence':'f(0)=f(1)=0; f(n)=(1−p)f(n−1)+p*(1+f(n−2)), n>=2。f(20)は通常80マス目から全域まで継続・追加成功可能を仮定'}
 if id=='B01':return {'formula':'透視集合=union(開拓セルのL1距離<=Lv)−開拓−既透視','interiorSingleCellDiamond':2*lv*(lv+1),'caveat':'端・重なりで減る。施設訪問増加数はAI依存'}
 if id in ['B02','B03']:return {'formula':'対象施設でmin開拓セル距離<=Rの未開拓セル集合','range':[3,6,10][lv-1],'caveat':'施設イベント種別に条件付け。訪問との因果差はログから未分離'}
 if id=='B04':return {'formula':'最寄り未開拓施設が範囲内なら8方向矢印1つ','range':[6,10,15][lv-1],'caveat':'正確な位置ではない。AI利用の成否は別'}
 if id=='B05':return {'formula':'新規開拓数×Lv回の未開拓未透視優先サンプル、透視可能残数で上限','perOpened':lv}
 if id=='B06':return {'formula':'初期連結透視目標ceil(mapCells×rate)、未開拓未透視残数制約','goalOn100':[10,20,30][lv-1]}
 if id=='B07':return {'formula':'未開拓施設の区画別件数を集計。位置は非公開','divisions':[2,3,5][lv-1],'gridCells':[4,9,25][lv-1]}
 if id in ['C01','D01']:return {'formula':'P対象=(対象基準重み+100b)/(全基準重み+100b_C+100b_D)','bonus':[.25,2/3,1.5][lv-1],'exampleBaseHalfSingle':(.5+[.25,2/3,1.5][lv-1])/(1+[.25,2/3,1.5][lv-1])}
 if id in ['C02','D02','F03']:
  b=([.15,.35,.60] if id=='F03' else [.35,1,3])[lv-1];return {'formula':'成功率=(.6+b+f)/(1+b+f)、博物館受取0。増分は基準から。両補正重みは合算','bonus':b,'singleSuccess':(.6+b)/(1+b),'singleSuccessDelta':(.6+b)/(1+b)-.6}
 if id=='C03':return {'formula':'E個数/訪問=s*(1+e)、追加は本品を除外し再成功判定なし','extraProbability':[.25,.5,.75][lv-1],'atBaseSuccessPerVisit':.6*(1+[.25,.5,.75][lv-1])}
 if id=='C04':return {'formula':'未所持率uの初回P未知=m*u/(1+(m−1)*u)。分類重みと乗算','multiplier':[5,15,25][lv-1],'exampleHalfUnknown':[5,15,25][lv-1]/(1+[5,15,25][lv-1])}
 if id.startswith('C') and n>=5:
  m=[6,11,31][lv-1];return {'formula':'P分類=m*Wg/(m*Wg+Wother)、WにC04未所持補正を含む','multiplier':m,'equal24NoUnknownBias':m/(m+23)}
 if id in ['D03','D08','D09']:return {'formula':'extra=max(minimum,ceil(baseGroupCount*b))。10四方minimum1、20/30四方Lv、5四方効果なし','b':[.2,.4,.6][lv-1],'baseCount0On10':1,'baseCount1On10':1,'baseCount2On10':math.ceil(2*[.2,.4,.6][lv-1])}
 if id in ['D04','E08']:return {'formula':'適性評価対象外・全4分野0。保有者とゲーム内スキルは保持','excluded':True,'runtimeEffect':'未実装' if id=='D04' else '面積維持の地形交換・形状整形（適性には算入しない）'}
 if id=='D05':return {'formula':'候補全数N、未知数U、t=(8,29,48)。P未知=(U*(1+t)+D06対象未知の加算)/(N+tU+bNm)。D06は同じ補正前N基準で加算','unknownBonus':[8,29,48][lv-1],'singleAtHalfUnknown':[9,30,49][lv-1]/(1+[9,30,49][lv-1])}
 if id=='D06':return {'formula':'w_i=1+t*I未知+b*N/n_g*I(g∈編成)。Z=N+tU+bNm、P対象=(N_S+tU_S+bNm)/Z。mは候補内に存在する編成分類数。各分類P=(n_g+tU_g+bN)/Z','b':[.10,.25,.50][lv-1],'caveat':'対象分類数だけでは確率決まらず候補構成・未知数が必要。欲しい分類の価値は確率から一意に点数化不能'}
 if id=='D07':
  rr=[.5,.77,1][lv-1];return {'formula':'最終成功率=s+(1−s)*retry*s、同一個体に一度だけ再試行','retryProbability':rr,'baseSuccessFinal':.6+.4*rr*.6}
 if id.startswith('E'):
  q=BASE[n-1];d=.1*lv;return {'formula':'x_i=d/(1−p_i−d)、q_i=(p_i+x_i)/(1+Σx)。単独はp_i+d。E自身は追加開拓しない。対応A確率hと選択地形変化に依存','baseTerrain':q,'deltaSolo':d,'soloTarget':q+d,'idealFocalExtra30_A_Lv3':30*.4*d,'caveat':'同時加護は一度正規化。30*.4*dは選択比率=地図比率の参考値、実冒険予測ではない'}
 if id in ['F01','F02']:
  N=480 if id=='F01' else 927;u=240 if id=='F01' else 463;k=lv+1;prob=1-math.prod((N-u-j)/(N-j) for j in range(k));return {'formula':'非復元重み付きk候補から未所持優先。正確なP未知=1−Σ既知のみ順列Π(w_i/(残重み))。同一既知重みなら1−Π((K−j)wK/(W−jwK))。選択後に成功判定','k':k,'uniformHalfExampleN':N,'uniformUnknownCount':u,'uniformUnknownSelectionProbability':prob,'caveat':'多分類補正・D06で既知重みが異なる場合は順列/集約DP。候補公開数≠獲得数'}
 raise ValueError(id)

def run():
 manifest=read(P/'input-manifest.json')
 for p,h in manifest['sha256'].items():assert hashlib.sha256((ROOT/p).read_bytes()).hexdigest()==h,p
 main=rows(Q/'adventures.csv');supp=rows(Q/'support-adventures.csv');config=read(Q/'config.json');save=read(Q/'initial-save.json');chars=read(ROOT/'bouken/data/characters.json');items=read(ROOT/'bouken/data/collection_items.json');skills=read(ROOT/'bouken/data/skills.json');v2=read(A/'v2/scoring-v2.json');notes=read(P/'effect-notes.json');byid={c['id']:c for c in chars};defs={s['id']:s for s in v2['skills']};v2rows=read(A/'v2/details.json');v2map={c['id']:c for c in v2rows}
 assert len(main)==5000 and len(supp)==3000
 # All 201 cells retain per-level observations; absent cells are explicit, not interpolated.
 metrics=['opened','generatedFacilities','additionalSkillOpened','newCharacters','newItems','totalItems','targetItems','targetNewItems','groupJoins','cumulativeReveal','detected','discovered','visited','discoveryAuc','explorationIndex','a12EligibleTurns','companionEvents','recruitSuccesses','itemEvents','itemSuccesses']
 audits=[]
 for s in sorted(skills,key=lambda s:s['id']):
  id=s['id'];n=int(id[1:]);category='A';judgment='妥当';reason='作用機序・分野配分・Lv増加の方向は整合。正確な基礎点係数を成果から同定したという意味ではない'
  if id.startswith('B') or id=='C03' or id in ['D07'] or id.startswith('E') and id!='E08':category='B'
  if id in ['A02','A03']:category='A';judgment='判断保留';reason='隣接可能数/累計閾値/他効果の条件で期待量が変わる。式は明確だが4/7/10・8/11/15の尺度の一意性は未確定'
  if id in ['D03','D08','D09']:category='A';judgment='再検討候補';reason='10四方は基本対象0〜1件で全Lv追加1件が同値なのに基礎点8/16/23。大地図でのLv差はある。標準条件と全サイズ汎用適性の解釈を再検討、低実測を根拠としない'
  if id=='A12':category='C';judgment='判断保留';reason='条件成立後の30/40/50%は理論計算可能だが既存8,000件の発動機会0。冒険全体での機会率と基礎3/5/7の対応は未確認'
  if id in ['C04','D05','D06','F01','F02'] or id.startswith('C') and n>=5:category='B' if any(any(t['id']==id for t in json.loads(r['buffs'])) for r in main+supp) else 'A';judgment='判断保留';reason='目的は未知/分類/選択の偏り。確率は計算できるがユーザーの分類価値と条件依存を単一raw点へ換算する尺度は未同定。総取得数では判定しない'
  if id in ['D04','E08']:category='A';judgment='妥当';reason='確定v2の評価対象外・別枠として全Lv0が整合。ゲーム効果の削除でも復活案でもない'
  for lv in range(1,4):
   ms=[r for r in main if any(t['id']==id and t['level']==lv for t in json.loads(r['buffs']))];ss=[r for r in supp if any(t['id']==id and t['level']==lv for t in json.loads(r['buffs']))];effect=notes[id]['effectLv'+str(lv)];th=theory(id,lv)
   audits.append({'id':id,'name':s['name'],'level':lv,'effect':effect,'activation':notes[id]['activationCondition'],'type':notes[id]['abilityType'],'theory':th,'v2Base':defs[id]['base'][lv-1],'v2Share':defs[id]['share'],'v2Contributions':[defs[id]['base'][lv-1]*x/100 for x in defs[id]['share']],'evaluationStatus':defs[id]['evaluationStatus'],'evidenceClass':category,'judgment':judgment,'reason':reason,'soloHolders':len(set(r['id'] for r in ms)),'soloAdventures':len(ms),'supplementPartyAdventures':len(ss),'observedMeans':{k:avg(ms,k) for k in metrics},'supplementMeans':{k:avg(ss,k) for k in metrics},'metricFit':'Bは取得能力と利用成果を分離、C分類/D06/F選択は総取得のみ不可。追加効果の因果値ではなく混合スキル保有者平均','interaction':notes[id]['unseenConditions']+'; 編成Lv合算上限3、指定個人内11シナジーは採点設計値でゲーム実効率への加点ではない','pointUncertainty':'理論の効果量/確率はゲーム単位、raw基礎点/scale35/シナジー2〜6は設計尺度。数式だけで唯一の配点を証明できない','source':notes[id]['runtimeSource']+'; common/party.js; siyou/buffs.txt'})
 csvout('SKILL-AUDIT.csv',audits)
 # Recompute every archived support contrast from seed-matched raw records.
 support=[];ecompare=[];dcompare=[]
 for case in config['support']:
  rr=[r for r in supp if r['caseId']==case['caseId']];withr=next(r for r in rr if r['arm']=='with-support');buffs={s['id']:s['level'] for s in json.loads(withr['buffs'])};id=case['removedSkill'];lv=buffs[id]
  for metric in metrics:support.append({'caseId':case['caseId'],'skill':id,'level':lv,'metric':metric,**paired(rr,metric)})
  if id.startswith('E') and id!='E08':
   i=int(id[1:])-1;off={k:v for k,v in buffs.items() if k!=id};onq=targets(buffs);offq=targets(off);onc=allocate(onq);offc=allocate(offq);attack='A'+str(i+4).zfill(2);alv=buffs.get(attack,0);ap=[0,.2,.3,.4][alv];p=paired(rr,'opened');real={arm:statistics.mean(json.loads(r['initialTerrainCounts'])['T0'+str(i+1)] for r in rr if r['arm']==arm) for arm in ['with-support','ablated-support']};focal=30*ap*(onq[i]-offq[i])*100/99;net=30*sum([0,.2,.3,.4][buffs.get('A'+str(j+4).zfill(2),0)]*(onq[j]-offq[j])*100/99 for j in range(7));ecompare.append({'caseId':case['caseId'],'skill':id,'supportId':case['supportId'],'partnerId':case['partnerId'],'level':lv,'attack':attack,'attackLevel':alv,'baseTerrainRate':BASE[i],'singleBlessingDelta':.1*lv,'allBuffs':buffs,'withTarget':onq[i],'ablatedTarget':offq[i],'deltaTarget':onq[i]-offq[i],'withQuota':onc[i],'ablatedQuota':offc[i],'realizedCounts':real,'focalUniformIdealExtra':focal,'allAttackNetUniformIdealExtra':net,'actualOpenedDifference':p['mean'],'actual95Low':p['ci95Low'],'actual95High':p['ci95High'],'actualMinusFocalBenchmark':p['mean']-focal,'interpretation':'参考期待値は30通常セルが均等抽出・追加成功率1を仮定。AIは公開地形を選ぶ。加護単独の直接追加0。対照は同人数の対象加護のみ除去。合成理論と実測差は検定誤差ではない'})
  if id=='D06':
   dcompare.append({'caseId':case['caseId'],'level':lv,'buffs':buffs,'party':json.loads(withr['party']),'groupJoins':paired(rr,'groupJoins'),'newCharacters':paired(rr,'newCharacters'),'recruitSuccesses':paired(rr,'recruitSuccesses'),'worldHashMatched':all(next(x for x in rr if x['seed']==r['seed'] and x['arm']=='ablated-support')['worldHash']==r['worldHash'] for r in rr if r['arm']=='with-support'),'targetDrawCount':'not recorded'})
 csvout('support-paired.csv',support);csvout('e-blessing-comparison.csv',ecompare);write('d06-observed.json',dcompare)
 # D06 exact initial pool probabilities for every archived D06 party, all Lv, with/without D05.
 dp=[]
 for case in dcompare:
  gs=set(str(byid[id]['groupId']) for id in case['party']);pools={'all':chars,**{k:[c for c in chars if c.get('areas',{}).get(k)==1] for k in ['human','monster']}}
  for pool,cc in pools.items():
   N=len(cc);U=sum(not save['characters'].get(str(c['id']),0) for c in cc);present=gs & set(str(c['groupId']) for c in cc);m=len(present);ns=sum(str(c['groupId']) in gs for c in cc);us=sum(str(c['groupId']) in gs and not save['characters'].get(str(c['id']),0) for c in cc)
   for lv in [1,2,3]:
    b=[.1,.25,.5][lv-1]
    for d5 in [0,1,2,3]:
     t=[0,8,29,48][d5];Z=N+t*U+b*N*m;prob=(ns+t*us+b*N*m)/Z;direct=sum(1+t*(not save['characters'].get(str(c['id']),0))+(b*N/sum(str(x['groupId'])==str(c['groupId']) for x in cc) if str(c['groupId']) in gs else 0) for c in cc if str(c['groupId']) in gs);assert math.isclose(prob,direct/Z)
     dp.append({'caseId':case['caseId'],'pool':pool,'D06Level':lv,'D05Level':d5,'candidateN':N,'unknownU':U,'partyGroups':sorted(gs),'presentGroupCount':m,'targetN':ns,'targetUnknown':us,'targetProbability':prob,'withoutD06TargetProbability':(ns+t*us)/(N+t*U),'increase':prob-(ns+t*us)/(N+t*U),'unknownProbability':(U*(1+t)+b*N*sum(sum(str(c['groupId'])==g and not save['characters'].get(str(c['id']),0) for c in cc)/sum(str(c['groupId'])==g for c in cc) for g in present))/Z,'condition':'初期所有・1候補時の分類確率。F02候補選択/施設プール混合後の総加入確率ではない'})
 csvout('d06-probabilities.csv',dp)
 # Retain pool restriction per facility rather than using all927 for every draw.
 facilities=read(ROOT/'bouken/data/facilities.json');facrows=[]
 for f in facilities:facrows.append({'id':f['id'],'name':f['name'],'poolMode':f.get('companionPoolMode','weighted'),'poolWeights':f.get('companionPoolWeightsPercent',{}),'candidateN':{k:sum(k=='all' or c.get('areas',{}).get(k)==1 for c in chars) for k in ['all','human','monster']}})
 csvout('facility-pools.csv',facrows)
 facilityTheory=[]
 for size in read(ROOT/'bouken/data/world_facility_counts.json'):
  for id,group in [('D03',['F01','F02']),('D08',['F03','F04']),('D09',['F05','F06','F07'])]:
   prob=sum(f['generationWeightPercent'] for f in facilities if f['id'] in group)/sum(f['generationWeightPercent'] for f in facilities);N=size['facilityCount']
   for lv in [1,2,3]:
    expected=0 if size['width']==5 else sum(math.comb(N,k)*prob**k*(1-prob)**(N-k)*max(1 if size['width']==10 else lv,math.ceil(k*[.2,.4,.6][lv-1])) for k in range(N+1))
    facilityTheory.append({'id':id,'level':lv,'size':size['width'],'baseFacilityN':N,'targetGroupProbability':prob,'expectedExtraFacilities':expected,'caveat':'基本施設抽選の二項分布を全列挙。各追加配置の有効空きが十分な条件、施設訪問/勧誘成果の期待値とは別'})
 csvout('facility-expectations.csv',facilityTheory)
 # Collector initial probability: exact item-level weights, ownership and all collector skills; observed share is dynamic and may use F01.
 collect=[]
 for id in sorted(set(int(r['id']) for r in main)):
  rr=[r for r in main if int(r['id'])==id];buffs={s['id']:s['level'] for s in json.loads(rr[0]['buffs'])};targetGroups=set(str(int(k[1:])-4).zfill(2) for k in buffs if k.startswith('C') and int(k[1:])>=5);weights=[]
  for item in items:
   cg='C'+str(int(item['groupId'])+4).zfill(2);w=(1+(0 if save['items'].get(str(item['id']),0) else [0,4,14,24][buffs.get('C04',0)]))*(1+[0,5,10,30][buffs.get(cg,0)]);weights.append((item,w))
  for g in sorted(targetGroups):
   skill='C'+str(int(g)+4).zfill(2);prob=sum(w for item,w in weights if item['groupId']==g)/sum(w for _,w in weights);total=sum(float(r['totalItems']) for r in rr);target=sum(float(r['targetItems']) for r in rr);collect.append({'id':id,'name':byid[id]['name'],'skill':skill,'level':buffs[skill],'group':g,'initialFirstCandidateTargetProbability':prob,'uniform24Reference':[6,11,31][buffs[skill]-1]/([6,11,31][buffs[skill]-1]+23),'totalItems':total,'targetItemsUnion':target,'observedTargetUnionShare':target/total if total else None,'newItemsMean':avg(rr,'newItems'),'targetNewItemsUnionMean':avg(rr,'targetNewItems'),'F01Level':buffs.get('F01',0),'collectorGroupCount':len(targetGroups),'caveat':'targetItemsは保有分類の和集合。多分類なら個別分類の観測へ分解不可。初回抽選と動的所有/F01/追加抽選の比較は因果検定ではない'})
 csvout('collector-reanalysis.csv',collect)
 # B acquisition and behavior/outcome summaries, per Lv in archived solo set.
 bmetrics=[]
 for n in range(1,8):
  id='B0'+str(n)
  for lv in range(1,4):
   rr=[r for r in main if any(s['id']==id and s['level']==lv for s in json.loads(r['buffs']))];signals={k:statistics.mean(json.loads(r['signalSteps'])[k] for r in rr) if rr else None for k in ['treasure','companion','guide','sense','visibleFacility']};bmetrics.append({'id':id,'level':lv,'holders':len(set(r['id'] for r in rr)),'adventures':len(rr),**{k:avg(rr,k) for k in ['cumulativeReveal','detected','discovered','visited','discoveryAuc','explorationIndex']},'signalSteps':signals,'firstDiscoveryQuestion':None,'meanDiscoveryQuestionAmongDiscovered':31*(1-sum(float(r['discoveryAuc']) for r in rr)/sum(float(r['discovered']) for r in rr)) if rr and sum(float(r['discovered']) for r in rr) else None,'timingProxy':'discoveryAuc=Σ(31−発見問)/31。個別発見時刻は生CSVにない。未発見を含む完全な時刻分布は復元不可','causality':'同時保有スキルあり、情報取得と訪問成果の因果分離不可'})
 csvout('b-information.csv',bmetrics)
 # Recalculate all50 x v2 theory and descriptive ranks; classify strongest discrepancies.
 primary={'development':'opened','companions':'newCharacters','treasure':'newItems','exploration':'explorationIndex'};measurement=[];correlations=[]
 ids=sorted(set(int(r['id']) for r in main));summary={i:{k:avg([r for r in main if int(r['id'])==i],k) for k in metrics} for i in ids}
 for field in F:
  metric=primary[field];x=[v2map[i]['scores'][field] for i in ids];y=[summary[i][metric] for i in ids];rx=[51-r for r in ranks(x)];ry=[51-r for r in ranks(y)];correlations.append({'field':field,'n':50,'metric':metric,'spearman':corr(ranks(x),ranks(y)),'pearson':corr(x,y)})
  for j,i in enumerate(ids):measurement.append({'id':i,'name':byid[i]['name'],'field':field,'v2Absolute':x[j],'v2Deviation':v2map[i]['metrics'][field]['deviation'],'metric':metric,'actualMean':y[j],'theoryRank':rx[j],'actualRank':ry[j],'rankGap':ry[j]-rx[j],'causes':[2,4,5,6] if field in ['companions','treasure','exploration'] else [2,3,4,6],'explanation':'記述的順位差。分類/情報/支援目的と総成果の不一致、固定施設・所有・AI・混合スキル。配点不一致仮説1は未排除だが相関だけでは立証しない'})
 csvout('character-v2-measurements.csv',measurement);csvout('correlations.csv',correlations)
 classes={k:sorted(set(r['id'] for r in audits if r['evidenceClass']==k)) for k in ['A','B','C']};judgments={k:sorted(set(r['id'] for r in audits if r['judgment']==k)) for k in ['妥当','再検討候補','判断保留']}
 result={'sourceCommit':manifest['sourceCommit'],'gameVersion':74,'aptitudeVersion':'2.0.0','skills':67,'levelRows':201,'mainAdventures':5000,'supportAdventures':3000,'additionalAdventures':0,'classes':classes,'judgments':judgments,'correlations':correlations,'E':ecompare,'D06':dcompare,'a12EligibleTurnsAll':sum(float(r['a12EligibleTurns']) for r in main+supp),'maxOpenedAll':max(float(r['opened']) for r in main+supp),'bObservedRows':sum(bool(r['adventures']) for r in bmetrics),'note':'A/B/Cは効果評価の根拠区分でありraw係数の実証精度ではない。妥当は分野/目的/単調方向の維持判断、係数の一意性証明ではない'}
 write('analysis.json',result)
 return result,audits,main,supp,config,save,measurement,collect
if __name__=='__main__':
 r,*_=run();print(json.dumps({k:r[k] for k in ['skills','levelRows','classes','judgments','correlations','a12EligibleTurnsAll','additionalAdventures']},ensure_ascii=False,indent=2))
