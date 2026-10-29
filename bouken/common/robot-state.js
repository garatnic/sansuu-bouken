// Read-only robot status. Only acquired parts and installed functions enter the model.
window.BoukenRobotState=(()=>{
 function model(save){const data=JSON.parse(JSON.stringify(save)),g=BoukenSchema.growth(data);if(g.discovery!==3)return null;
  const access=BoukenSchema.robotAccess(data),definition=id=>BoukenSchema.robotFeatures.find(f=>f.id===id),summary=f=>({id:f.id,label:f.label,help:f.help});
  const next=BoukenSchema.robotNext(data),entry=next&&g.features[next.id];
  return {partyCapacity:g.partyCapacity,analysis:access.analysis?summary(definition('analysis')):null,modes:access.modes.map(id=>summary(definition(id))),drive:access.driveLevel?{...summary(definition('drive'+access.driveLevel)),level:access.driveLevel,steps:access.driveSteps}:null,search:entry?.stage===1?{size:next.size}:null,parts:BoukenSchema.robotFeatures.filter(f=>(g.features[f.id]?.stage||0)>=2).map(f=>({id:f.id,name:f.part,installed:g.features[f.id].stage>=3}))};
 }
 const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
 function show(save,{partPicture}={}){const m=model(save);if(!m)return null;const prior=document.activeElement,d=el('dialog','robot-state');d.setAttribute('aria-labelledby','robotStateTitle');
  const header=el('header','robot-state-header'),title=el('h2','','ロボットのじょうたい');title.id='robotStateTitle';const close=el('button','robot-state-close','とじる');close.type='button';close.onclick=()=>d.close();header.append(title,close);d.append(header);
  const hero=el('div','robot-state-hero'),robot=el('div','robot-state-avatar','🤖');robot.setAttribute('aria-hidden','true');hero.append(robot,el('h3','','ぼうけんロボ'),el('p','','ピピピッ！ ぼうけんの あいぼうだよ。'));d.append(hero);
  const section=heading=>{const s=el('section','robot-state-section');s.append(el('h3','',heading));d.append(s);return s;};
  const help=feature=>{const b=el('button','robot-state-feature',feature.label);b.type='button';b.setAttribute('aria-label',feature.label+'のせつめい');b.onclick=()=>BoukenNoticeDialog.show({title:feature.label+' 🤖',text:feature.help,fullScreen:true});return b;};
  if(m.analysis||m.modes.length||m.drive){const features=section('できること');features.append(el('p','robot-state-caption','タップすると せつめいが よめるよ。'));if(m.analysis)features.append(help(m.analysis));for(const mode of m.modes)features.append(help(mode));if(m.drive){features.append(help(m.drive));features.append(el('p','robot-state-drive',m.drive.steps===Infinity?'もくてきちまで みちを あんないするよ。':'いちどに '+m.drive.steps+'マスまで あんないするよ。'));}}
  if(m.search){const search=section('たんさくちゅう');search.append(el('p','robot-state-world',m.search.size+' × '+m.search.size+' のワールド'),el('p','','あたらしい ワールドを つくって、すべてのマスを かいたくしよう！'));}
  if(m.parts.length){const parts=section('みつけた ぶひん'),list=el('ul','robot-state-parts');for(const part of m.parts){const item=el('li','robot-state-part');item.dataset.partId=part.id;const picture=partPicture?.(part.id)||el('span','robot-state-part-icon','🧩');picture.setAttribute('aria-hidden','true');item.append(picture,el('strong','',part.name),el('span','robot-state-part-status',part.installed?'とりつけずみ':'ホームで とりつけよう！'));list.append(item);}parts.append(list);}
  const player=section('あなたの せいちょう');player.append(el('p','','いっしょに ぼうけんできる なかま：'+m.partyCapacity+'にん'));
  d.addEventListener('close',()=>{d.remove();if(prior?.isConnected)prior.focus();},{once:true});document.body.append(d);d.showModal();close.focus();return d;
 }
 return Object.freeze({model,show});
})();
