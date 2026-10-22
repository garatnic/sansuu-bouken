// ToDo 29: 達成判定を一元化。拠点は開拓数に含めない。
window.BoukenProgress=Object.freeze({
 status(w){const total=w.width*w.height-1;const opened=w.explored.reduce((n,v,i)=>n+(i!==w.startIndex&&!!v),0);const facilities=w.facility.reduce((n,v)=>n+(v?1:0),0);const completedFacilities=w.visitedFacilities.reduce((n,v,i)=>n+(v&&w.facility[i]?1:0),0);const allExplored=opened===total;const allFacilities=completedFacilities===facilities;return {opened,total,percent:total?Math.floor(opened/total*100):100,facilities,completedFacilities,allExplored,allFacilities,complete:allExplored&&allFacilities};},
 // ワールド内の一度限りの記録を更新。セーブと同じトランザクションで呼ぶ。
 recordExplore(save,w,opened=1){const s=this.status(w);w.exploredCount=s.opened;save.records=save.records||{};save.records.totalExplored=(save.records.totalExplored||0)+opened;save.records.correctAnswers=(save.records.correctAnswers||0)+1;return this.recordMilestones(save,w,s);},
 recordMilestones(save,w,s=this.status(w)){let newlyAllExplored=false,newlyComplete=false;
  if(s.allExplored&&!w.allExploredRewardClaimed){w.allExploredRewardClaimed=true;save.records=save.records||{};save.records.worldsAllExplored=(save.records.worldsAllExplored||0)+1;newlyAllExplored=true;}
  if(s.complete&&!w.completionRecorded){w.completionRecorded=true;save.completedWorlds=(save.completedWorlds||0)+1;newlyComplete=true;}
  return {newlyAllExplored,newlyComplete};}
});
