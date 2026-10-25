'use strict';
(async()=>{
 const $=id=>document.getElementById(id),imageMode=new URLSearchParams(location.search).get('images'),imageState={calls:0,ready:false,settled:false},pictures=new Map();let data,model,byId,hideImages=false;
 const fallback=()=>{const el=document.createElement('span');el.className='fallback-picture';el.textContent='👤';el.setAttribute('aria-hidden','true');return el;};
 function picture(id,size=64){if(hideImages||!imageState.ready)return fallback();if(!pictures.has(id))pictures.set(id,BoukenCharacterImages.picture(id,64));const source=pictures.get(id);if(source.tagName!=='CANVAS')return fallback();const el=document.createElement('canvas');el.width=size;el.height=size;el.className='character-image';el.setAttribute('aria-hidden','true');const ctx=el.getContext('2d');if(!ctx)return fallback();ctx.imageSmoothingEnabled=false;ctx.drawImage(source,0,0,size,size);return el;}
 function say(message){$('feedback').textContent=message;}
 function mini(container,party){container.replaceChildren();for(const id of party){const member=document.createElement('div');member.className='mini-member';member.append(picture(id,32));const name=document.createElement('span');name.className='mini-name';name.textContent=byId.get(id).name;member.append(name);container.append(member);}}
 function diagnostics(){const sheetRequests=performance.getEntriesByType('resource').filter(r=>r.name.includes('/character_sheet.png')).length;$('imageStatus').textContent=hideImages?'画像なしの表示を確認中':imageState.ready?'画像：読込済み（同じシートを使いまわしています）':imageState.settled?'画像を読み込めませんでした。名前とマークで操作できます。':'画像は読込中です。先に操作できます。';$('diagnostics').textContent=JSON.stringify({mock:true,engineConnected:false,saveAccess:false,blockedStorageAttempts:PartyMockGuard.attempts(),sourceCommit:data.sourceCommit,sourceVersion:data.version,size:model.size,mode:model.mode,type:model.type,party:model.party,locked:[...model.locked],seen:model.seen.size,cycles:model.cycles,imageInitCalls:imageState.calls,imageReady:imageState.ready,sheetResourceEntries:sheetRequests,portraitCache:pictures.size},null,2);}
 function reason(){const skills=model.party.flatMap(id=>byId.get(id).skills||[]),has=prefix=>skills.some(s=>s.id.startsWith(prefix));let text;
  if(model.type==='random')text='つよさで えらばず、くじびきした仲間たちだよ！';
  else if(model.type==='explore'&&has('A'))text='開拓をてつだうスキルを もつ仲間がいるよ！';
  else if(model.type==='treasure'&&has('C'))text='お宝あつめを てつだうスキルの仲間がいるよ！';
  else if(model.type==='companion'&&skills.some(s=>['D01','D02','D03','D05','D06','D07','D08','D09','F02'].includes(s.id)))text='仲間や施設にかかわる スキルの仲間がいるよ！';
  else if(model.type==='map'&&has('B'))text='かくれた世界をしらべる スキルの仲間がいるよ！';
  else text=model.locked.size?'お気に入りの仲間を のこした組み合わせだよ！':'いろいろな仲間を いっしょにつれていこう！';
  $('reason').textContent=text;
 }
 function render(){const focused=document.activeElement?.dataset.lockId;$('party').replaceChildren();$('party').style.setProperty('--slots',5);$('candidateTitle').textContent=PartyMock.types.find(x=>x[0]===model.type)[1];for(const b of $('types').children)b.setAttribute('aria-pressed',String(b.dataset.type===model.type));const changed=model.changed();$('changeCount').textContent=changed?changed+'人 いれかわるよ':'いまの編成と同じ';
  for(const id of model.party){const c=byId.get(id),fixed=model.locked.has(id),card=document.createElement('article');card.className='member'+(fixed?' fixed':'');card.dataset.characterId=String(id);const toggle=document.createElement('button');toggle.type='button';toggle.className='member-toggle';toggle.dataset.lockId=String(id);toggle.setAttribute('aria-pressed',String(fixed));toggle.setAttribute('aria-label',c.name+(fixed?'の固定を解除':'を固定'));const badge=document.createElement('span');badge.className='lock-badge';badge.textContent=fixed?'🔒 固定中':'固定する';const image=document.createElement('span');image.className='member-image';image.append(picture(id));const name=document.createElement('span');name.className='member-name';name.textContent=c.name;const tag=document.createElement('span');tag.className='member-tag';tag.textContent=model.current.includes(id)?'いまの仲間':'いれかえ';toggle.append(badge,image,name,tag);toggle.onclick=()=>{const on=model.toggle(id);say(c.name+(on?'を固定したよ。もう一度タップで解除できるよ。':'の固定をはずしたよ。'));render();};
   const details=document.createElement('button');details.type='button';details.className='details-button';details.textContent='スキル';details.setAttribute('aria-label',c.name+'のスキルと詳細');details.onclick=()=>BoukenCharacterDetail.show(c,{skills:data.skills,descriptions:data.descriptions});card.append(toggle,details);$('party').append(card);
  }
  for(let i=model.size;i<5;i++){const card=document.createElement('article');card.className='member unavailable';card.setAttribute('aria-label','まだ使えない枠');const lock=document.createElement('span');lock.textContent='🔒';const text=document.createElement('small');text.textContent='まだつかえない';card.append(lock,text);$('party').append(card);}
  $('lockCount').textContent='🔒 固定 '+model.locked.size+'人 / '+model.size+'人';$('unlock').disabled=model.locked.size===0;$('other').disabled=model.locked.size===model.size;if(model.locked.size===model.size)say('みんな固定中だよ。ほかの仲間を見るときは、固定をはずしてね。');mini($('current'),model.current);reason();diagnostics();if(focused)$('party').querySelector('[data-lock-id="'+focused+'"]')?.focus({preventScroll:true});
 }
 function next(){const result=model.next();say(result.status==='locked'?'みんな固定中だよ。ちがう仲間を見るときは、固定をはずしてね。':result.status==='single'?'この条件では、ほかの組み合わせがないよ。固定をはずすか、条件をかえてみよう。':result.status==='cycled'?'この条件のサンプルは、ぜんぶ見たよ。もう一周するね！':model.locked.size?'固定した仲間は そのまま！ ほかの仲間をかえたよ。':'べつの組み合わせだよ！ 好きな仲間を固定してね。');render();}
 try{
  const response=await fetch('samples.json');if(!response.ok)throw Error('サンプルを読み込めませんでした');data=await response.json();byId=new Map(data.characters.map(c=>[c.id,c]));model=new PartyMock.Model(data.characters.map(c=>c.id));$('loading').hidden=true;$('recommendView').hidden=false;
  for(const [id,name] of PartyMock.types){const b=document.createElement('button');b.type='button';b.dataset.type=id;b.textContent=name;b.onclick=()=>{model.type=id;next();};$('types').append(b);}
  $('other').onclick=next;$('unlock').onclick=()=>{model.unlock();say('みんなの固定を はずしたよ。');render();};
  for(const id of ['size','pool'])$(id).onchange=()=>{model.reset(Number($('size').value),$('pool').value);say('おためし条件をかえたよ。固定も はじめからだよ。');render();};
  $('hideImages').onchange=()=>{hideImages=$('hideImages').checked;render();};
  $('choose').onclick=()=>{mini($('chosenParty'),model.party);$('chosen').showModal();};$('closeChosen').onclick=()=>$('chosen').close();
  $('back').onclick=()=>{model.reset();$('recommendView').hidden=true;$('returnView').hidden=false;mini($('returnParty'),model.current);$('again').focus();};$('again').onclick=()=>{$('returnView').hidden=true;$('recommendView').hidden=false;say('好きな仲間を 固定してみよう！');render();$('types').querySelector('[aria-pressed="true"]').focus();};
  render();
  // One initialization only. Controls never wait for the sheet or retry its URL.
  imageState.calls++;
  let loaded;
  if(imageMode==='fail'){loaded=new Promise(resolve=>{const image=new Image();image.onload=()=>resolve(false);image.onerror=()=>resolve(false);image.src='unavailable-image.txt';});}
  else if(imageMode==='off')loaded=Promise.resolve(false);
  else loaded=BoukenCharacterImages.init();
  Promise.resolve(loaded).then(ready=>{imageState.ready=!!ready;imageState.settled=true;render();if(!$('returnView').hidden)mini($('returnParty'),model.current);}).catch(()=>{imageState.settled=true;render();});
 }catch(error){$('loading').textContent='読み込めませんでした。ページを読みなおしてね。';console.error(error);}
})();
