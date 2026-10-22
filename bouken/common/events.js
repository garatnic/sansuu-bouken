// ToDo 30: 施設イベント抽選・成功判定・累計所持数の単一責務。
window.BoukenEvents=Object.freeze({
 weighted(entries,random=Math.random){const total=entries.reduce((n,e)=>n+e.weight,0);if(total<=0)throw Error('抽選重みが不正です');let r=random()*total;for(const e of entries){r-=e.weight;if(r<0)return e.value;}return entries[entries.length-1].value;},
 poolFor(f,random=Math.random){return f.companionPoolMode==='all_uniform'?'all':this.weighted(Object.entries(f.companionPoolWeightsPercent).map(([value,weight])=>({value,weight})),random);},
 resolve(save,w,i,facilities,characters,items,random=Math.random){
  if(!w.explored[i]||!w.facility[i])throw Error('訪問できない施設です');
  if(w.visitedFacilities[i])return {already:true,type:w.events[i]};
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
  const level=id=>Math.max(0,Math.min(3,Number((w.partyBuffsSnapshot||[]).find(s=>s.id===id)?.level||0)));
  let chosen;
  if(type==='collection'){
   const c04=[0,4,14,24][level('C04')];
   const groupBonuses=new Map();for(let n=5;n<=28;n++){const lv=level('C'+String(n).padStart(2,'0'));if(lv)groupBonuses.set(String(n-4).padStart(2,'0'),[0,5,10,30][lv]);}
   chosen=this.weighted(candidates.map(item=>({value:item,weight:(1+(!save.items?.[item.id]?c04:0))*(1+(groupBonuses.get(item.groupId)||0))})),random);
  }else chosen=candidates[Math.min(candidates.length-1,Math.floor(random()*candidates.length))];
  const c02=type==='collection'?[0,.35,1,3][level('C02')]:0;
  const success=random()<(0.6+c02)/(1+c02);
  const inventory=type==='companion'?(save.characters=save.characters||{}):(save.items=save.items||{});
  const key=String(chosen.id),previous=Number(inventory[key]||0);
  if(success)inventory[key]=previous+1;
  let extra=null;
  if(success&&type==='collection'&&random()<[0,.05,.10,.15][level('C03')]){
   const others=candidates.filter(item=>item.id!==chosen.id);
   if(others.length){const item=this.weighted(others.map(item=>({value:item,weight:(1+(!save.items?.[item.id]?[0,4,14,24][level('C04')]:0))*(1+([0,5,10,30][level('C'+String(Number(item.groupId)+4).padStart(2,'0'))]||0))})),random);const extraKey=String(item.id),was=Number(inventory[extraKey]||0);inventory[extraKey]=was+1;extra={id:item.id,name:item.name,first:was===0};}
  }
  w.visitedFacilities[i]=true;
  w.eventResults=w.eventResults||{};
  const result={type,pool,id:chosen.id,name:chosen.name,success,first:success&&previous===0,extra};
  w.eventResults[i]=result;
  return result;
 }
});
