// Reusable character dialog. Data is supplied by the caller; never fetch here.
window.BoukenCharacterDetail=(()=>{
 let dialog,title,portrait,location,description,skillList;
 const text=(tag,className,value)=>{const el=document.createElement(tag);el.className=className;el.textContent=value;return el;};
 function create(){
  dialog=document.createElement('dialog');dialog.className='character-detail-dialog';dialog.setAttribute('aria-labelledby','character-detail-title');
  const header=document.createElement('div');header.className='character-detail-header';
  portrait=document.createElement('div');portrait.className='character-detail-portrait';
  const close=text('button','character-detail-close','閉じる');close.type='button';close.onclick=()=>dialog.close();header.append(portrait,close);
  title=text('h2','character-detail-title','');title.id='character-detail-title';location=text('p','character-detail-location','');description=text('p','character-detail-description','');
  skillList=document.createElement('div');skillList.className='character-detail-skills';
  dialog.append(header,title,location,description,skillList);dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});document.body.append(dialog);
 }
 function show(character,{skills=[],descriptions={}}={}){
  if(!character)return;if(!dialog)create();
  portrait.replaceChildren();const picture=window.BoukenCharacterImages?.picture(character.id);if(picture)portrait.append(picture);else portrait.textContent='👤';
  title.textContent='No.'+character.id+' '+character.name;
  location.textContent='いばしょ：'+(character.location||'まだわからない');description.textContent=character.description||'説明は準備中です。';
  const names=new Map(skills.map(s=>[s.id,s.name]));skillList.replaceChildren();
  for(const sk of character.skills||[]){const section=document.createElement('section');section.className='character-detail-skill';section.append(text('h3','',sk.id+' '+(names.get(sk.id)||sk.id)+' Lv'+sk.level),text('p','',descriptions[sk.id]||'説明は準備中です。'));skillList.append(section);}
  if(!dialog.open)dialog.showModal();dialog.scrollTop=0;
 }
 return Object.freeze({show});
})();
