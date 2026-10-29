// Game host: recommendation works on copies; only the existing persist callback writes.
window.BoukenRecommendation=Object.freeze({
 validate(ids,save,characters){
  const known=new Set(characters.map(c=>c.id)),owned=characters.filter(c=>Number(save.characters?.[c.id])>0).map(c=>c.id),max=BoukenParty.capacity(owned.length,save);
  if(!Array.isArray(ids)||ids.length!==max||new Set(ids).size!==ids.length||ids.some(id=>!Number.isSafeInteger(id)||!known.has(id)||!owned.includes(id)))throw Error('仲間や人数枠が変わりました。画面を開き直してください');
  return [...ids];
 },
 open({characters,persist,onClose}){
  const snapshot=JSON.stringify(BoukenSave.load()),dialog=document.createElement('dialog'),frame=document.createElement('iframe');
  dialog.className='recommendation-dialog';dialog.setAttribute('aria-label','じどうへんせいロボ🤖');frame.title='じどうへんせいロボ🤖';
  let closed=false;
  const close=()=>{if(closed)return;closed=true;frame.contentWindow?.PartyRecommendationDispose?.();window.removeEventListener('pagehide',close);dialog.close();dialog.remove();delete window.BoukenRecommendationSession;onClose?.();};
  window.BoukenRecommendationSession=Object.freeze({
   read:()=>snapshot,
   apply(ids){if(closed)throw Error('画面を開き直してください');const latest=BoukenSave.load(),next=BoukenRecommendation.validate(ids,latest,characters);if(!persist(next,-1,latest))throw Error('保存に失敗しました。もう一度ためしてください');close();},
   close
  });
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  dialog.addEventListener('close',close);window.addEventListener('pagehide',close,{once:true});
  dialog.append(frame);document.body.append(dialog);dialog.showModal();frame.src='party-recommendation.html?v=82';
 }
});
