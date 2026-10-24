// Presentation only: rewards, map generation and party snapshots remain with their owners.
window.BoukenTutorial=(()=>{
 const pages={
 intro:[['あなたは冒険家です！','いろいろな世界を旅して、世界中の仲間と、世界中のお宝を集めましょう！'],['まずは「冒険ワールドへ出発」を押してください！']],
 world:[['これが冒険の世界です！','練習として、とても小さな世界を用意しました。'],['黄色の枠のマスをタップして、算数の問題を解いてください。','正解すれば霧（きり）が晴れて、マップが見えるようになります。'],['もしそこに建物があれば……なにか良いことがあるかもしれません！','さあ、すべてのマスをひらいて、地図を完成させてください！']],
 firstClear:[['新しい仲間が増えましたね！','グリーンゴブは、隠れた土地をのぞき見ることができます。','彼をパーティーに入れて、次の冒険に出発してみてください！']],
 final:[['おめでとうございます！','2つの世界をクリアしました！','ここからは自由に冒険してください。','旅立つあなたに、ヒントをあげましょう！'],['冒険は途中でやめて、新しい世界からやり直すこともできます。','でも、最後まで地図を完成させると、必ず新しい仲間が見つかるはずです！','なるべくがんばって、すべての問題を解いてくださいね！'],['そして、もうひとつ！','見つけた仲間が47種類になると、冒険につれていける人数が2人になります！','その次は140種類で3人、279種類で4人、464種類で5人！','たくさんの仲間を見つけて、にぎやかなパーティーを作りましょう！'],['さあ、ここからが本当の冒険です！','まだ見ぬ世界、まだ見ぬ仲間、まだ見ぬお宝が、あなたを待っています。','それでは、あなただけの冒険へ……','いってらっしゃい！']]
 };
 function isActive(s){return s.tutorialStory?.version===1&&!s.tutorialStory.complete;}
 function needsConfirmation(s){return Number(s.worldsStarted)===1&&!!s.world?.allExploredRewardClaimed&&Number(s.party?.[0])!==298;}
 function highlightWorld(s){const t=s.tutorialStory;return isActive(s)&&BoukenProgress.ordinal(s)===1&&t.worldDone&&!t.firstExploreDone&&!s.world?.allExploredRewardClaimed;}
 function modal(content,{finish=()=>true,confirm=false,celebrate=false}={}){
  return new Promise(resolve=>{
   const prior=document.activeElement,d=document.createElement('dialog');d.className='tutorial-dialog';d.setAttribute('aria-labelledby','tutorialHeading');
   const heading=document.createElement('h2');heading.id='tutorialHeading';heading.textContent=confirm?'出発のかくにん':'冒険のものがたり';
   const body=document.createElement('div');body.className='tutorial-copy';const progress=document.createElement('p');progress.className='tutorial-pages';
   const actions=document.createElement('div');actions.className='tutorial-actions';const next=document.createElement('button');next.type='button';
   const error=document.createElement('p');error.className='tutorial-error';error.setAttribute('role','status');
   let page=0,busy=false;
   function paint(){body.replaceChildren();for(const line of content[page]){const p=document.createElement('p');p.textContent=line;body.append(p);}progress.textContent=(page+1)+' / '+content.length;next.textContent=confirm?'はい':page<content.length-1?'つぎへ':'わかった！';d.classList.toggle('tutorial-celebrate',celebrate&&page===content.length-1);body.scrollTop=0;}
   function close(value){d.close();d.remove();if(prior?.isConnected)prior.focus();resolve(value);}
   next.onclick=async()=>{if(busy)return;if(page<content.length-1){page++;paint();next.focus();return;}busy=true;next.disabled=true;try{if(await finish()===false)throw Error('保存できませんでした');close(true);}catch(e){error.textContent='説明の記録を保存できませんでした。もう一度押してください。';}finally{busy=false;next.disabled=false;}};
   if(confirm){const no=document.createElement('button');no.type='button';no.className='tutorial-no';no.textContent='いいえ';no.onclick=()=>close(false);actions.append(no);}
   d.addEventListener('cancel',e=>{e.preventDefault();if(confirm)close(false);});actions.append(next);d.append(heading,progress,body,error,actions);document.body.append(d);paint();d.showModal();next.focus();
  });
 }
 function story(name,finish,allOwned=false){const content=pages[name].map(p=>[...p]);if(name==='final'&&allOwned)content[1][1]='でも、最後まで地図を完成させると、必ず仲間が見つかります！ みんな見つけたあとは、同じ仲間がもう一度来てくれます。';return modal(content,{finish,celebrate:name==='final'});}
 async function home(s){
  if(!isActive(s))return;
  const saveFlag=key=>{const current=BoukenSave.load();current.tutorialStory[key]=true;BoukenSave.save(current);return true;};
  if(!s.tutorialStory.introDone){await story('intro',()=>saveFlag('introDone'));s=BoukenSave.load();}
  // A reload after the reward was closed must still deliver its unfinished story.
  if(s.tutorialStory.firstRewardSeen&&!s.tutorialStory.firstClearDone){await story('firstClear',()=>saveFlag('firstClearDone'));s=BoukenSave.load();}
  if(s.tutorialStory.secondRewardSeen&&!s.tutorialStory.finalDone){const chars=await BoukenMaster.load('characters');await story('final',()=>{const current=BoukenSave.load();current.tutorialStory.finalDone=true;current.tutorialStory.complete=true;BoukenSave.save(current);return true;},chars.every(c=>Number(s.characters[c.id]||0)>0));return;}
  if(!s.world&&!s.worldsStarted){const b=document.getElementById('depart');b.classList.add('tutorial-depart');b.addEventListener('click',()=>b.classList.remove('tutorial-depart'),{once:true});}
 }
 function confirmDeparture(s){return needsConfirmation(s)?modal([['おや？ グリーンゴブを連れていませんね。','グリーンゴブは、かくれた土地をのぞき見ることができます。','このまま出発しますか？']],{confirm:true}):Promise.resolve(true);}
 return Object.freeze({story,home,needsConfirmation,highlightWorld,confirmDeparture,isActive});
})();
