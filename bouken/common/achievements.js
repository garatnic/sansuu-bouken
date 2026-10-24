// Persistent achievements; all mutations are committed together with the gameplay save.
window.BoukenAchievements=(()=>{
 let master=[],items=[];
 async function init(){[master,items]=await Promise.all(['achievements','collection_items'].map(n=>BoukenMaster.load(n)));}
 function state(s){s.achievementStats=s.achievementStats||{};return s.achievementStats;}
 function event(s,key,value=1){const a=state(s);a[key]=Math.max(a[key]||0,value);}
 function action(s,opened,automatic){event(s,'maxAction',opened);if(automatic>0)event(s,'auto');}
 function departure(s,w,opened){event(s,'party.'+(w.partySnapshot||[]).length);if((w.partySnapshot||[]).length)event(s,'party.1');action(s,opened,opened);}
 function facility(s,w,index,result,wasAll){if(result.already)return;const a=state(s);a.facility=a.facility||{};const f=w.facility[index];a.facility[f]=(a.facility[f]||0)+1;
 if(wasAll)event(s,'postExploreVisit');if(result.type==='companion'){const key=result.success?'recruitSuccesses':'recruitFailures';a[key]=(a[key]||0)+1;if(result.success){a.recruits=a.recruits||{};a.recruits[result.id]=(a.recruits[result.id]||0)+1;if(!result.first)a.duplicateRecruits=(a.duplicateRecruits||0)+1;if(f==='F08')event(s,'hutRecruit');}}
 }
 function metrics(s){const a=s.achievementStats||{},r=s.records||{},m={...a,...r,perfect:s.completedWorlds||0,departures:s.worldsStarted||0};const count=inv=>Object.values(inv||{}).filter(n=>Number(n)>0).length;m.characters=count(s.characters);m.items=count(s.items);m.itemTotal=Object.values(s.items||{}).reduce((n,v)=>n+Math.max(0,Number(v)||0),0);m.facilityTotal=Object.values(a.facility||{}).reduce((n,v)=>n+v,0);m.minFacility=Math.min(...Array.from({length:8},(_,i)=>a.facility?.['F'+String(i+1).padStart(2,'0')]||0));m.sameRecruit=Math.max(0,...Object.values(a.recruits||{}));for(const [k,v]of Object.entries(a.facility||{}))m['facility.'+k]=v;for(const key of ['allSize','perfectSize'])for(const [k,v]of Object.entries(a[key]||{}))m[key+'.'+k]=v;m.allNormalPerfect=[10,20,30].filter(n=>a.perfectSize?.[n]>0).length;
 const groups=new Map();for(const i of items){if(!groups.has(i.subgroupId))groups.set(i.subgroupId,[]);groups.get(i.subgroupId).push(i);}m.smallComplete=0;const large=new Map();for(const [id,list]of groups){const n=list.filter(i=>Number(s.items?.[i.id]||0)>0).length;if(n>=4)m.nearCollection=1;const done=n===list.length;if(done)m.smallComplete++;const g=list[0].groupId;large.set(g,(large.has(g)?large.get(g):true)&&done);}m.largeComplete=[...large.values()].filter(Boolean).length;
 if(s.world){const n=s.world.achievementVisionCount||0;m.maxVision=Math.max(m.maxVision||0,n);if(n>0)m.vision=1;}return m;
 }
 function evaluate(s){if(!master.length)return [];const a=state(s),m=metrics(s);a.maxVision=Math.max(a.maxVision||0,m.maxVision||0);if(m.vision)a.vision=1;const unlocked=new Set(s.achievementsUnlocked||[]),added=[];for(const x of master)if(!unlocked.has(x.id)&&(m[x.metric]||0)>=x.target){unlocked.add(x.id);added.push(x.id);}s.achievementsUnlocked=[...unlocked].sort((a,b)=>a-b);return added;}
 return Object.freeze({init,state,event,action,departure,facility,metrics,evaluate});
})();
