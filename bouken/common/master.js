// 共通マスターローダー。ページ階層の違いはbaseで吸収する。
window.BoukenMaster=Object.freeze({
 async load(name){const allowed=['characters','character_groups','skills','collection_groups','collection_subgroups','collection_items','collection_reward_types','collection_rewards','achievements','terrains','facilities','world_facility_counts'];if(!allowed.includes(name))throw Error('Unknown master: '+name);const response=await fetch(new URL('data/'+name+'.json',document.baseURI));if(!response.ok)throw Error('マスターを読み込めません: '+name);return response.json();}
});
