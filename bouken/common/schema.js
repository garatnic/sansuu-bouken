// セーブ形式は配布バージョンとは独立して管理する。
window.BoukenSchema=Object.freeze({
 normalizeBuffs(buffs){
  if(!Array.isArray(buffs)||!buffs.some(s=>s.id==='E09'))return buffs;
  const merged=Math.min(3,buffs.filter(s=>s.id==='E08'||s.id==='E09').reduce((n,s)=>n+Number(s.level||0),0)),out=[];let placed=false;
  for(const s of buffs){if(s.id==='E08'||s.id==='E09'){if(!placed){const entry={...s,id:'E08',level:merged};if('cost' in entry)entry.cost=merged*2;out.push(entry);placed=true;}}else out.push(s);}return out;
 },
 recordCharacterJoin(data,id){if(!Array.isArray(data.characterJoinOrder))data.characterJoinOrder=Object.keys(data.characters||{}).filter(k=>Number(data.characters[k])>0).map(Number).sort((a,b)=>a-b);if(!data.characterJoinOrder.some(x=>String(x)===String(id)))data.characterJoinOrder.push(Number(id));},
 // imageNo is a permanent image reference; never renumber or reuse it (independent of array order).
 // Ordered robot features. stage: 1=search announced, 2=part owned, 3=installed, 4=explanation read.
 robotFeatures:Object.freeze([
  {id:'analysis',imageNo:1,count:29,size:10,part:'ぶんせきレンズ',label:'レーダーチャート',help:'パーティーの ちからを グラフで みられるよ。'},
  {id:'random',imageNo:2,count:70,size:10,part:'くるくるルーレット',label:'ランダムへんせい',help:'ロボットが なかまを ランダムに えらんでくれるよ。'},
  {id:'drive1',imageNo:3,count:91,size:10,part:'ちいさな はぐるま',label:'じどううんてん Lv.1',help:'もくてきちを えらぶと、3マスまでの みちを あんないするよ。さんすうは じぶんで といてね。'},
  {id:'map',imageNo:4,count:111,size:10,part:'たんけんコンパス',label:'マップたんさくへんせい',help:'マップの たんさくが とくいな なかまを えらんでくれるよ。'},
  {id:'explore',imageNo:5,count:156,size:10,part:'パワードリル',label:'どんどんかいたくへんせい',help:'かいたくが とくいな なかまを えらんでくれるよ。'},
  {id:'drive2',imageNo:6,count:180,size:20,part:'ダブルエンジン',label:'じどううんてん Lv.2',help:'いちどに 6マスまでの みちを あんないするよ。さんすうは じぶんで といてね。'},
  {id:'companion',imageNo:7,count:204,size:10,part:'なかまアンテナ',label:'なかまあつめへんせい',help:'なかまを あつめるのが とくいな パーティーを えらんでくれるよ。'},
  {id:'treasure',imageNo:8,count:250,size:10,part:'おたからセンサー',label:'おたからあつめへんせい',help:'おたからを あつめるのが とくいな パーティーを えらんでくれるよ。'},
  {id:'drive3',imageNo:9,count:271,size:30,part:'ロケットエンジン',label:'じどううんてん Lv.3',help:'とおくの もくてきちまで みちを あんないできるよ。さんすうは じぶんで といてね。'},
  {id:'balanced',imageNo:10,count:316,size:10,part:'スーパーCPU',label:'おまかせへんせい',help:'いろいろな ぼうけんに むいた パーティーを えらんでくれるよ。'}
 ].map(Object.freeze)),
 growth(data){
  if(!data.robotGrowth)data.robotGrowth={discovery:0,partyCapacity:1};
  const g=data.robotGrowth;if(!g.features)g.features={};if(!Number.isInteger(g.worldSerial))g.worldSerial=0;
  if(g.discovery===0&&Object.values(data.characters||{}).filter(n=>Number(n)>0).length>=23)g.discovery=1;
  return g;
 },
 robotAvailable(data,id){const g=this.growth(data);return g.discovery===3&&(g.features[id]?.stage||0)>=3;},
 robotAccess(data){const available=id=>this.robotAvailable(data,id),modes=['random','map','explore','companion','treasure','balanced'].filter(available);const driveLevel=available('drive1')?(available('drive2')?(available('drive3')?3:2):1):0;return {analysis:available('analysis'),modes,driveLevel,driveSteps:[0,3,6,Infinity][driveLevel]};},
 robotNext(data){const g=this.growth(data);if(g.discovery!==3)return null;return this.robotFeatures.find(f=>(g.features[f.id]?.stage||0)<4)||null;},
 announceRobotSearch(data){const g=this.growth(data),f=this.robotNext(data);if(!f||g.features[f.id]?.stage||Object.values(data.characters||{}).filter(n=>Number(n)>0).length<f.count)return false;g.features[f.id]={stage:1,afterWorld:g.worldSerial};return true;},
 robotWorld(data,w){const g=this.growth(data);w.robotWorldId=++g.worldSerial;const f=this.robotNext(data);if(f&&g.features[f.id]?.stage===1&&w.width===f.size&&w.height===f.size)w.robotSearch=f.id;},
 claimRobotPart(data,w){const g=this.growth(data),f=this.robotNext(data),entry=f&&g.features[f.id];if(!f||entry?.stage!==1||w.robotSearch!==f.id||!(w.robotWorldId>entry.afterWorld)||w.width!==f.size||w.height!==f.size||w.robotPartReward||!w.explored.every(Boolean))return false;g.features[f.id]={...entry,stage:2,sourceWorld:w.robotWorldId};w.robotPartReward={id:f.id,name:f.part};w.robotRewardSeen=false;w.robotPartNoticeSeen=false;return true;},
 installRobotPart(data,id){const g=this.growth(data),f=this.robotNext(data);if(f?.id!==id||g.features[id]?.stage!==2)return false;g.features[id].stage=3;return true;},
 readRobotHelp(data,id){const g=this.growth(data);if(g.features[id]?.stage!==3)return false;g.features[id].stage=4;return true;},
 mergeRobotGrowth(data,prior){const a=this.growth(data),b=this.growth(prior);a.discovery=Math.max(a.discovery,b.discovery);a.partyCapacity=Math.max(a.partyCapacity,b.partyCapacity);a.worldSerial=Math.max(a.worldSerial,b.worldSerial);for(const [id,v]of Object.entries(b.features))if((a.features[id]?.stage||0)<v.stage)a.features[id]={...v};if(data.world?.robotWorldId&&data.world.robotWorldId===prior.world?.robotWorldId){for(const flag of ['robotRewardSeen','robotPartNoticeSeen','robotPartResultSeen'])if(prior.world[flag])data.world[flag]=true;if(prior.world.robotPartReward)data.world.robotPartReward={...prior.world.robotPartReward};}},
 discoverForResult(data,result){const g=this.growth(data);if(g.discovery!==1)return false;g.discovery=2;result.robotDiscovery=true;return true;},
 normalizeSave(data){
  this.growth(data);
  if(data.collectionClaimsVersion!==1){data.collectionClaimsVersion=1;data.collectionLegacyItems=Object.keys(data.items||{}).filter(id=>Number(data.items[id])>0);}
  if(!data.homeGrowthNotices){data.homeGrowthNotices={partyCapacity:1,collections:null};}
  if(data.world?.partyBuffsSnapshot)data.world.partyBuffsSnapshot=this.normalizeBuffs(data.world.partyBuffsSnapshot);return data;},
 version:1,key:'bouken.save.v1',makeInitialSave(){return {schemaVersion:1,robotGrowth:{discovery:0,partyCapacity:1,features:{},worldSerial:0},createdAt:new Date().toISOString(),updatedAt:null,world:null,characters:{},items:{},party:[],records:{},completedWorlds:0,worldsStarted:0,claimedCollectionRewards:[],collectionClaimsVersion:1,homeGrowthNotices:{partyCapacity:1,collections:[]},tutorialStory:{version:1,introDone:false,worldDone:false,firstExploreDone:false,firstRewardSeen:false,firstClearDone:false,secondRewardSeen:false,finalDone:false,complete:false}};}});
