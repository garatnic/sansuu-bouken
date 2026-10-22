// セーブ形式は配布バージョンとは独立して管理する。
window.BoukenSchema=Object.freeze({version:1,key:'bouken.save.v1',makeInitialSave(){return {schemaVersion:1,createdAt:new Date().toISOString(),updatedAt:null,world:null,characters:{},items:{},party:[],records:{},completedWorlds:0,worldsStarted:0,claimedCollectionRewards:[]};}});
