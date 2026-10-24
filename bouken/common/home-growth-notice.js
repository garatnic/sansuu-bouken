window.BoukenHomeGrowthNotice=(()=>{
 function state(save){BoukenCollection.prepare(save);if(!save.homeGrowthNotices){save.homeGrowthNotices={partyCapacity:capacity(save),collections:BoukenCollection.completed(save)};}return save.homeGrowthNotices;}
 function capacity(save){return BoukenParty.capacity(Object.values(save.characters||{}).filter(n=>Number(n)>0).length);}
 function pending(save){const s=state(save),next=capacity(save),seen=new Set(s.collections||[]);return {party:next>Number(s.partyCapacity||1)?{from:Number(s.partyCapacity||1),to:next}:null,collections:BoukenCollection.completed(save).filter(id=>!seen.has(id))};}
 function acknowledge(save,p){const s=state(save);if(p.party)s.partyCapacity=Math.max(Number(s.partyCapacity||1),p.party.to);s.collections=[...new Set([...(s.collections||[]),...(p.collections||[])])];}
 async function show({goMuseum=()=>{location.href='collection.html';}}={}){
  let p=pending(BoukenSave.load());
  if(p.party){const growth=p.party.to-p.party.from;await BoukenNoticeDialog.show({title:'パーティーが成長したよ！',text:'さっきの冒険で成長したみたいだ！\n'+(growth===1?'もうひとり':growth+'人')+'多く仲間をつれていけるようになったよ！\n'+p.party.to+'人までパーティーを組めるよ！',onAccept:()=>{const s=BoukenSave.load();acknowledge(s,{party:p.party});BoukenSave.save(s);}});}
  p=pending(BoukenSave.load());if(p.collections.length){const ids=[...p.collections];const action=await BoukenNoticeDialog.show({title:'コレクションをコンプ！',text:'さっきのお宝で何かのコレクション品をコンプしたみたいだ！\nはくぶつかんに見に行こう！'+(ids.length>1?'\n'+ids.length+'つの小分類がそろったよ！':''),secondaryText:'はくぶつかんに見に行く',onAccept:()=>{const s=BoukenSave.load();acknowledge(s,{collections:ids});BoukenSave.save(s);}});if(action==='secondary'){await goMuseum();return true;}}
  return false;
 }
 return Object.freeze({state,capacity,pending,acknowledge,show});
})();
