// One awaited modal at a time; callers persist acknowledgement before it closes.
window.BoukenNoticeDialog=Object.freeze({
 show({title,text,buttonText='わかった！',secondaryText='',fullScreen=false,onAccept=()=>true}){
  return new Promise(resolve=>{
   const prior=document.activeElement,d=document.createElement('dialog');d.className='growth-notice'+(fullScreen?' robot-help':'');d.setAttribute('aria-labelledby','growthNoticeTitle');
   const emblem=document.createElement('div');emblem.className='growth-emblem';emblem.textContent='🎉';emblem.setAttribute('aria-hidden','true');
   const heading=document.createElement('h2');heading.id='growthNoticeTitle';heading.textContent=title;const copy=document.createElement('p');copy.className='growth-copy';copy.textContent=text;
   const error=document.createElement('p');error.className='growth-error';error.setAttribute('role','status');const actions=document.createElement('div');actions.className='growth-actions';
   const ok=document.createElement('button');ok.type='button';ok.textContent=buttonText;const secondary=document.createElement('button');secondary.type='button';secondary.className='growth-secondary';secondary.textContent=secondaryText;
   let busy=false;async function accept(action){if(busy)return;busy=true;ok.disabled=secondary.disabled=true;try{if(await onAccept(action)===false)throw Error('保存失敗');d.close();d.remove();if(prior?.isConnected)prior.focus();resolve(action);}catch(e){error.textContent='記録を保存できませんでした。もう一度ボタンを押してください。';}finally{busy=false;ok.disabled=secondary.disabled=false;}}
   ok.onclick=()=>accept('ok');secondary.onclick=()=>accept('secondary');if(secondaryText)actions.append(secondary);actions.append(ok);d.append(emblem,heading,copy,error,actions);d.addEventListener('cancel',e=>{e.preventDefault();accept('ok');});document.body.append(d);d.showModal();ok.focus();
  });
 }
});
