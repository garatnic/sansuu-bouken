// Per-adventure measurements. Legacy worlds deliberately remain unmeasured.
window.BoukenResult=Object.freeze({
 start(w){w.adventureStats={version:1,elapsedActiveMs:0,solved:0,firstTryCorrect:0,streak:0,maxFirstTryStreak:0,manualOpened:0,automaticOpened:0,byOperation:Object.fromEntries(['add','sub','mul','div'].map(k=>[k,{solved:0,firstTryCorrect:0}])),encounters:[]};},
 solved(w,operation,wrong,opened){const s=w.adventureStats;if(!s||s.finished)return;const first=wrong===0;s.solved++;s.firstTryCorrect+=Number(first);s.streak=first?s.streak+1:0;s.maxFirstTryStreak=Math.max(s.maxFirstTryStreak,s.streak);const op=s.byOperation[operation];if(op){op.solved++;op.firstTryCorrect+=Number(first);}s.manualOpened++;s.automaticOpened+=Math.max(0,opened-1);},
 encounter(w,result,source){const s=w.adventureStats;if(!s||s.finished)return;const push=e=>s.encounters.push({sequence:s.encounters.length,type:e.type,id:e.id,name:e.name,success:e.success!==false,firstAcquired:!!e.first,source});push(result);if(result.extra)push({...result.extra,type:'collection',success:true});},
 snapshot(w,status='complete'){
  const available=!!w.adventureStats,s=w.adventureStats||{elapsedActiveMs:0,solved:0,firstTryCorrect:0,streak:0,maxFirstTryStreak:0,manualOpened:0,automaticOpened:0,byOperation:Object.fromEntries(['add','sub','mul','div'].map(k=>[k,{solved:0,firstTryCorrect:0}])),encounters:[]};
  return JSON.parse(JSON.stringify({...s,finished:true,status,measurementsAvailable:available,completedAt:new Date().toISOString(),departureNumber:w.departureNumber,width:w.width,height:w.height,terrain:w.terrain,facility:w.facility,explored:w.explored,revealedCells:w.revealed||[],exploredCount:w.explored.reduce((n,v,i)=>n+Number(!!v&&i!==w.startIndex),0),facilitiesVisited:w.visitedFacilities.reduce((n,v,i)=>n+Number(!!v&&!!w.facility[i]),0),revealed:available?(w.achievementVisionCount||0):null}));
 },
 finish(save,w){const s=w.adventureStats;if(!s||s.finished||!w.completionRecorded)return false;s.finished=true;save.lastClearResult=this.snapshot(w);w.resultPending=true;return true;},
 // Called on a save copy. No rewards, clear counters or live-world mutations.
 abandon(save,w){const result=this.snapshot(w,'abandoned');save.lastClearResult=result;save.world=null;return result;},

 rate(correct,total){return total?Math.round(correct/total*100)+'%':'—';},
 time(ms){const seconds=Math.floor(ms/1000),h=Math.floor(seconds/3600),m=Math.floor(seconds%3600/60),s=seconds%60;return (h?h+'時間':'')+m+'分'+s+'秒';},
 clock(getWorld,now=()=>performance.now()){let last=null;return {resume(){last=now();},pause(){this.flush();last=null;},flush(){const t=now(),s=getWorld()?.adventureStats;if(last!==null&&s&&!s.finished)s.elapsedActiveMs+=Math.max(0,t-last);last=last===null?null:t;}};}
});
