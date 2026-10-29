window.BoukenHomeGrowthNotice=(()=>{
 function state(save){BoukenCollection.prepare(save);if(!save.homeGrowthNotices){save.homeGrowthNotices={partyCapacity:capacity(save),collections:BoukenCollection.completed(save)};}return save.homeGrowthNotices;}
 function capacity(save){return BoukenParty.capacity(Object.values(save.characters||{}).filter(n=>Number(n)>0).length);}
 function pending(save){const s=state(save),unlocked=BoukenSchema.growth(save).partyCapacity,next=Math.min(capacity(save),unlocked+1),seen=new Set(s.collections||[]);return {party:next>unlocked?{from:unlocked,to:next}:null,collections:BoukenCollection.completed(save).filter(id=>!seen.has(id))};}
 function acknowledge(save,p){const s=state(save);if(p.party){BoukenSchema.growth(save).partyCapacity=Math.max(BoukenSchema.growth(save).partyCapacity,p.party.to);s.partyCapacity=Math.max(Number(s.partyCapacity||1),p.party.to);}s.collections=[...new Set([...(s.collections||[]),...(p.collections||[])])];}
 async function show({goMuseum=()=>{location.href='collection.html';}}={}){
  let p=pending(BoukenSave.load());
  if(p.party){await BoukenNoticeDialog.show({title:'いっしょに ぼうけんしよう！',text:'いっしょに ぼうけんできる なかまが '+p.party.to+'にんに ふえたよ！',onAccept:()=>{const s=BoukenSave.load();acknowledge(s,{party:p.party});BoukenSave.save(s);}});return false;}
  if(BoukenSchema.growth(BoukenSave.load()).discovery===2){await BoukenNoticeDialog.show({title:'ぼうけんロボが めざめた！🤖',text:'ふしぎなものの しょうたいは ロボットだった！\nピピピッ！ ぼくは ぼうけんロボ。よろしくね！',onAccept:()=>{const s=BoukenSave.load();BoukenSchema.growth(s).discovery=3;BoukenSave.save(s);}});return false;}
  const current=BoukenSave.load(),g=BoukenSchema.growth(current),feature=BoukenSchema.robotNext(current),entry=feature&&g.features[feature.id];
  async function explain(){await BoukenNoticeDialog.show({title:feature.label+' 🤖',text:feature.help,fullScreen:true,onAccept:()=>{const s=BoukenSave.load();if(!BoukenSchema.readRobotHelp(s,feature.id))return false;BoukenSave.save(s);}});}
  if(entry?.stage===3){await explain();return false;}
  if(entry?.stage===2){await BoukenNoticeDialog.show({title:'ロボットが パワーアップ！🤖',text:'「'+feature.part+'」を とりつけたよ！\n'+feature.label+'が つかえるように なったよ！',onAccept:()=>{const s=BoukenSave.load();if(!BoukenSchema.installRobotPart(s,feature.id))return false;BoukenSave.save(s);}});await explain();return false;}
  if(feature&&!entry&&Object.values(current.characters||{}).filter(n=>Number(n)>0).length>=feature.count){await BoukenNoticeDialog.show({title:'ピピピッ！ はんのうを けんち！🤖',text:feature.size+'×'+feature.size+'の ワールドに なにかが ありそうです！\nあたらしい ワールドを つくって、すべてのマスを かいたくしてみよう！',onAccept:()=>{const s=BoukenSave.load();if(!BoukenSchema.announceRobotSearch(s))return false;BoukenSave.save(s);}});return false;}
  p=pending(BoukenSave.load());if(p.collections.length){const ids=[...p.collections];const action=await BoukenNoticeDialog.show({title:'コレクションをコンプ！',text:'さっきのお宝で何かのコレクション品をコンプしたみたいだ！\nはくぶつかんに見に行こう！'+(ids.length>1?'\n'+ids.length+'つの小分類がそろったよ！':''),secondaryText:'はくぶつかんに見に行く',onAccept:()=>{const s=BoukenSave.load();acknowledge(s,{collections:ids});BoukenSave.save(s);}});if(action==='secondary'){await goMuseum();return true;}}
  return false;
 }
 return Object.freeze({state,capacity,pending,acknowledge,show});
})();
