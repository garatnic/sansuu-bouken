// セーブ形式は配布バージョンとは独立して管理する。
window.BoukenSchema=Object.freeze({
 normalizeBuffs(buffs){
  if(!Array.isArray(buffs)||!buffs.some(s=>s.id==='E09'))return buffs;
  const merged=Math.min(3,buffs.filter(s=>s.id==='E08'||s.id==='E09').reduce((n,s)=>n+Number(s.level||0),0)),out=[];let placed=false;
  for(const s of buffs){if(s.id==='E08'||s.id==='E09'){if(!placed){const entry={...s,id:'E08',level:merged};if('cost' in entry)entry.cost=merged*2;out.push(entry);placed=true;}}else out.push(s);}return out;
 },
 normalizeSave(data){if(data.world?.partyBuffsSnapshot)data.world.partyBuffsSnapshot=this.normalizeBuffs(data.world.partyBuffsSnapshot);return data;},
 version:1,key:'bouken.save.v1',makeInitialSave(){return {schemaVersion:1,createdAt:new Date().toISOString(),updatedAt:null,world:null,characters:{},items:{},party:[],records:{},completedWorlds:0,worldsStarted:0,claimedCollectionRewards:[]};}});
