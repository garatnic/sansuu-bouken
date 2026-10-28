// Presentation only. Call after the event transaction has been saved.
window.BoukenFacilityEventUI=(()=>{
 const node=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 function frame(modal,kind,title,description){
  modal.className='quiz-modal facility-event '+kind;
  modal.querySelector('#visitTitle').textContent=title;
  modal.querySelector('#visitDescription').textContent=description;
  modal.querySelector('#visitArtwork').replaceChildren();
  modal.scrollTop=0;
 }
 function zone(picture,kind){const z=node('div','fe-zone'),medal=node('div','fe-medallion');medal.append(picture);z.append(medal);if(kind==='new')for(let i=0;i<3;i++){const s=node('span','fe-spark s'+i,'✦');s.setAttribute('aria-hidden','true');z.append(s);}return z;}
 function facilityPicture(facility){const p=node('span','fe-facility');p.setAttribute('aria-hidden','true');BoukenTileImages.draw(p,null,facility.id,'⌂');return p;}
 function visit({modal,facility,choosing=false}){
  frame(modal,'visit',facility.name,modal.querySelector('#visitDescription').textContent);
  const art=modal.querySelector('#visitArtwork');art.append(zone(facilityPicture(facility),'visit'));
  art.append(node('p','fe-visit-heading',facility.name+'を見つけた！'));
  if(!choosing)modal.querySelector('#visitDescription').textContent='まだ知らない出会いが、ここに。\nなにが見つかるかな？';
 }
 function result({modal,result,save,characters,skills,picture,message}){
  const entries=[result,...(result.extra?[{...result.extra,type:'collection',success:true}]:[])];
  const kind=result.success===false?'fail':result.first?'new':'duplicate';
  frame(modal,kind,'発見のけっか','');
  const actions=modal.querySelector('#visitActions');actions.replaceChildren();
  for(const [index,e] of entries.entries()){
   const companion=e.type==='companion',failed=e.success===false,k=failed?'fail':e.first?'new':'duplicate';
   const card=node('section','fe-result '+k);const label=failed?'今回は、ざんねん…':e.first?(companion?'はじめての仲間！':'はじめてのお宝！'):(companion?'また会えたね！':'また見つけた！');
   card.append(node('p','fe-ribbon',index?'さらに、お宝を発見！':label));
   const title=failed?(companion?'ざんねん！\nなかまにならなかった...':'ざんねん！\nお宝を手に入れられなかった...'):e.first?(companion?'やったね！\nはじめての仲間を見つけた！':'やったね！\nはじめてのお宝を見つけた！'):(companion?'また仲間になったよ！':'お宝を見つけた！');
   const artwork=zone(picture(e.type,e.id,failed),k);if(failed){const cross=node('span','fe-failure-cross','×');cross.setAttribute('aria-hidden','true');artwork.append(cross);}card.append(node('h3','fe-heading',title),artwork,node('strong','fe-name',e.name));
   if(!failed&&!e.first){const total=Number((companion?save.characters:save.items)?.[e.id]||0);if(total>0)card.append(node('p','fe-owned','持っている数　'+(total-1)+' → '+total));}
   if(companion&&!failed&&e.first){const c=characters.find(c=>String(c.id)===String(e.id));if(c?.skills?.length){const list=node('div','fe-skills');for(const s of c.skills){const name=skills.find(v=>v.id===s.id)?.name||s.id;list.append(node('div','fe-skill',name+' Lv'+s.level));}card.append(list);}}
   let text=failed?(companion?'声をかけたけど、\nいっしょには 来てくれなかった。':'今回は 手に入らなかった。'):companion?'次の冒険が 楽しみだね！':'コレクションが ふえたよ！';
   if(e.retried)text='勧誘の達人でもう一度さそったよ。\n'+text;
   card.append(node('p','fe-message',text));actions.append(card);
  }
  // Preserve clear/skill details from the saved outcome without repeating the old result prose.
  if(message.includes('全マス開拓！'))actions.append(node('p','fe-milestone','全マス開拓！ おめでとう！'));
  if(message.includes('完全クリア達成！'))actions.append(node('p','fe-milestone','完全クリア達成！'));
  const b=node('button','fe-continue','ぼうけんをつづける');b.type='button';b.onclick=()=>modal.close();actions.append(b);
 }
 return Object.freeze({visit,result});
})();
