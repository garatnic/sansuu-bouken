// ToDo 30: 施設イベント抽選・成功判定・累計所持数の単一責務。
window.BoukenEvents=Object.freeze({
 weighted(entries,random=Math.random){const total=entries.reduce((n,e)=>n+e.weight,0);if(total<=0)throw Error('抽選重みが不正です');let r=random()*total;for(const e of entries){r-=e.weight;if(r<0)return e.value;}return entries[entries.length-1].value;},
 level(w,id){return Math.max(0,Math.min(3,Number((w.partyBuffsSnapshot||[]).find(s=>s.id===id)?.level||0)));},
 companionWeights(save,w,candidates,characters){
  const unknownBonus=[0,8,29,48][this.level(w,'D05')];
  const groupBonus=[0,.10,.25,.50][this.level(w,'D06')];
  const byId=new Map(characters.map(c=>[String(c.id),c]));
  const groups=new Set((w.partySnapshot||[]).map(id=>byId.get(String(id))?.groupId).filter(id=>id!==undefined&&id!==null).map(String));
  const groupCounts=new Map();
  for(const c of candidates){const id=String(c.groupId);groupCounts.set(id,(groupCounts.get(id)||0)+1);}
  // W is the uniform candidate pool BEFORE either skill. Each matching group gets W*bonus.
  const baseTotal=candidates.length;
  return candidates.map(c=>({value:c,weight:(Number(save.characters?.[c.id]||0)>0?1:1+unknownBonus)+(groups.has(String(c.groupId))?baseTotal*groupBonus/groupCounts.get(String(c.groupId)):0)}));
 },
 poolFor(f,random=Math.random){return f.companionPoolMode==='all_uniform'?'all':this.weighted(Object.entries(f.companionPoolWeightsPercent).map(([value,weight])=>({value,weight})),random);},
 prepare(save,w,i,facilities,characters,items,random=Math.random){
  if(!w.explored[i]||!w.facility[i])throw Error('訪問できない施設です');
  if(w.visitedFacilities[i])return null;
  if(w.eventChoices?.[i])return w.eventChoices[i];
  const f=facilities.find(v=>v.id===w.facility[i]);if(!f)throw Error('施設データがありません');
  const type=w.events[i];if(type!=='companion'&&type!=='collection')throw Error('イベント種別が不正です');
  let pool=null,candidates;
  if(type==='companion'){
   // 旧ワールドはプール未保存のため、初回訪問時に確定して同時保存する。
   w.eventPools=w.eventPools||Array(w.facility.length).fill(null);
   pool=w.eventPools[i]||this.poolFor(f,random);w.eventPools[i]=pool;
   candidates=pool==='all'?characters:characters.filter(c=>c.areas&&c.areas[pool]===1);
  }else candidates=items;
  if(!candidates.length)throw Error('抽選候補がありません');
  const level=id=>this.level(w,id);
  let entries;
  if(type==='collection'){
   const c04=[0,4,14,24][level('C04')];
   const groupBonuses=new Map();for(let n=5;n<=28;n++){const lv=level('C'+String(n).padStart(2,'0'));if(lv)groupBonuses.set(String(n-4).padStart(2,'0'),[0,5,10,30][lv]);}
   entries=candidates.map(item=>({value:item,weight:(1+(!save.items?.[item.id]?c04:0))*(1+(groupBonuses.get(item.groupId)||0))}));
  }else entries=this.companionWeights(save,w,candidates,characters);
  // Keep the original corrected weights while removing selected IDs (sampling without replacement).
  const choiceLevel=level(type==='collection'?'F01':'F02');
  const count=Math.min(candidates.length,choiceLevel?choiceLevel+1:1),ids=[];
  while(ids.length<count){const chosen=this.weighted(entries,random);ids.push(chosen.id);entries=entries.filter(e=>String(e.value.id)!==String(chosen.id));}
  const pending={type,pool,ids,requiresChoice:choiceLevel>0};
  w.eventChoices=w.eventChoices||{};w.eventChoices[i]=pending;
  return pending;
 },
 resolve(save,w,i,facilities,characters,items,random=Math.random,choiceId){
  if(!w.explored[i]||!w.facility[i])throw Error('訪問できない施設です');
  if(w.visitedFacilities[i])return {already:true,type:w.events[i]};
  const pending=this.prepare(save,w,i,facilities,characters,items,random);
  const {type,pool}=pending;
  if(pending.requiresChoice&&choiceId===undefined)throw Error('候補を1つ選んでください');
  const id=choiceId===undefined?pending.ids[0]:choiceId;
  if(!pending.ids.some(value=>String(value)===String(id)))throw Error('表示された候補から選んでください');
  const candidates=type==='collection'?items:(pool==='all'?characters:characters.filter(c=>c.areas&&c.areas[pool]===1));
  const chosen=candidates.find(c=>String(c.id)===String(id));if(!chosen)throw Error('候補データがありません');
  const level=id=>this.level(w,id);
  const successBonus=[0,.35,1,3][level(type==='collection'?'C02':'D02')]+[0,.15,.35,.60][level('F03')];
  const successRate=(0.6+successBonus)/(1+successBonus);
  let success=random()<successRate,retried=false;
  const retryLevel=type==='companion'?level('D07'):0;
  if(!success&&retryLevel&&random()<[0,.50,.77,1][retryLevel]){
   retried=true;success=random()<successRate;
  }
  const inventory=type==='companion'?(save.characters=save.characters||{}):(save.items=save.items||{});
  const key=String(chosen.id),previous=Number(inventory[key]||0);
  if(success)inventory[key]=previous+1;
  let extra=null;
  if(success&&type==='collection'&&random()<[0,.25,.50,.75][level('C03')]){
   const others=candidates.filter(item=>item.id!==chosen.id);
   if(others.length){const item=this.weighted(others.map(item=>({value:item,weight:(1+(!save.items?.[item.id]?[0,4,14,24][level('C04')]:0))*(1+([0,5,10,30][level('C'+String(Number(item.groupId)+4).padStart(2,'0'))]||0))})),random);const extraKey=String(item.id),was=Number(inventory[extraKey]||0);inventory[extraKey]=was+1;extra={id:item.id,name:item.name,first:was===0};}
  }
  w.visitedFacilities[i]=true;
  w.eventResults=w.eventResults||{};
  const result={type,pool,id:chosen.id,name:chosen.name,success,retried,first:success&&previous===0,extra};
  w.eventResults[i]=result;
  delete w.eventChoices[i];
  return result;
 }
});

