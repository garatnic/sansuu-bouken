// Home-only announcement. Acknowledgement is saved separately from earning the title.
window.BoukenAchievementNotice=Object.freeze({
 show(save){
  BoukenAchievements.evaluate(save);
  const pending=BoukenAchievements.pendingNotices(save);if(!pending.length)return;
  // Persist earned titles first. Never announce a title that failed to save.
  BoukenSave.save(save);
  const dialog=document.createElement('dialog');dialog.className='achievement-notice';dialog.setAttribute('aria-labelledby','achievementNoticeTitle');
  const style=document.createElement('style');style.textContent='.achievement-notice{border:0;border-radius:18px;padding:0;width:min(94vw,520px);max-height:86dvh;overflow:auto;color:#233e30;box-shadow:0 16px 60px #122e3340}.achievement-notice::backdrop{background:#10251f88}.achievement-notice header{position:sticky;top:0;z-index:1;background:#fff7dc;padding:16px;display:flex;justify-content:space-between;align-items:center;gap:12px;border-bottom:1px solid #e7d8a4}.achievement-notice h2{font-size:20px;margin:0}.achievement-notice header button{width:auto;margin:0;padding:10px 14px;flex:none}.achievement-notice .notice-body{padding:16px}.achievement-notice article{background:#f2f7ec;border:1px solid #d3dfc5;border-radius:12px;padding:14px;margin:12px 0}.achievement-notice article strong{display:block;font-size:18px}.achievement-notice article p{font-size:13px;line-height:1.7;margin-bottom:0}.achievement-notice .notice-error{color:#a11;font-size:13px;line-height:1.7}';document.head.append(style);
  const header=document.createElement('header'),title=document.createElement('h2'),close=document.createElement('button');title.id='achievementNoticeTitle';title.textContent='🎉 称号をゲット！';close.type='button';close.textContent='閉じる';header.append(title,close);
  const body=document.createElement('div');body.className='notice-body';const message=document.createElement('p');message.textContent=pending.length+'個の称号を獲得したよ！';body.append(message);
  for(const x of pending){const card=document.createElement('article'),name=document.createElement('strong'),condition=document.createElement('p');name.textContent='🏅 '+x.name;condition.textContent=x.conditionText;card.append(name,condition);body.append(card);}
  const error=document.createElement('p');error.className='notice-error';error.setAttribute('role','status');body.append(error);dialog.append(header,body);document.body.append(dialog);
  let busy=false;function acknowledge(){if(busy)return;busy=true;close.disabled=true;try{const current=BoukenSave.load();BoukenAchievements.markNoticesShown(current,pending.map(x=>x.id));BoukenSave.save(current);dialog.close();dialog.remove();style.remove();}catch(e){error.textContent='表示の記録を保存できませんでした。もう一度「閉じる」を押してください。';}finally{busy=false;close.disabled=false;}}
  close.onclick=acknowledge;dialog.addEventListener('cancel',e=>{e.preventDefault();acknowledge();});
  dialog.showModal();
 }
});
