// セーブ形式は配布バージョンとは独立して管理する。
window.BoukenSchema=Object.freeze({
 normalizeBuffs(buffs){
  if(!Array.isArray(buffs)||!buffs.some(s=>s.id==='E09'))return buffs;
  const merged=Math.min(3,buffs.filter(s=>s.id==='E08'||s.id==='E09').reduce((n,s)=>n+Number(s.level||0),0)),out=[];let placed=false;
  for(const s of buffs){if(s.id==='E08'||s.id==='E09'){if(!placed){const entry={...s,id:'E08',level:merged};if('cost' in entry)entry.cost=merged*2;out.push(entry);placed=true;}}else out.push(s);}return out;
 },
 recordCharacterJoin(data,id){if(!Array.isArray(data.characterJoinOrder))data.characterJoinOrder=Object.keys(data.characters||{}).filter(k=>Number(data.characters[k])>0).map(Number).sort((a,b)=>a-b);if(!data.characterJoinOrder.some(x=>String(x)===String(id)))data.characterJoinOrder.push(Number(id));},
 growth(data){
  if(!data.robotGrowth)data.robotGrowth={discovery:0,partyCapacity:1};
  const g=data.robotGrowth;
  if(g.discovery===0&&Object.values(data.characters||{}).filter(n=>Number(n)>0).length>=23)g.discovery=1;
  return g;
 },
 discoverForResult(data,result){const g=this.growth(data);if(g.discovery!==1)return false;g.discovery=2;result.robotDiscovery=true;return true;},
 normalizeSave(data){
  this.growth(data);
  if(data.collectionClaimsVersion!==1){data.collectionClaimsVersion=1;data.collectionLegacyItems=Object.keys(data.items||{}).filter(id=>Number(data.items[id])>0);}
  if(!data.homeGrowthNotices){data.homeGrowthNotices={partyCapacity:1,collections:null};}
  if(data.world?.partyBuffsSnapshot)data.world.partyBuffsSnapshot=this.normalizeBuffs(data.world.partyBuffsSnapshot);return data;},
 version:1,key:'bouken.save.v1',makeInitialSave(){return {schemaVersion:1,robotGrowth:{discovery:0,partyCapacity:1},createdAt:new Date().toISOString(),updatedAt:null,world:null,characters:{},items:{},party:[],records:{},completedWorlds:0,worldsStarted:0,claimedCollectionRewards:[],collectionClaimsVersion:1,homeGrowthNotices:{partyCapacity:1,collections:[]},tutorialStory:{version:1,introDone:false,worldDone:false,firstExploreDone:false,firstRewardSeen:false,firstClearDone:false,secondRewardSeen:false,finalDone:false,complete:false}};}});
