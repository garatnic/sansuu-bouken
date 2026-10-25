(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.PartyMock=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const types=[['random','ランダム'],['balanced','おまかせ'],['explore','どんどん開拓'],['treasure','お宝集め'],['companion','仲間集め'],['map','マップ探索']];
const initial=[298,199,13,27,300];
const priorities={balanced:[298,199,13,27,160,300,748,901,33,418,373,97],explore:[13,418,373,388,840,176,901,199,298,27,300,748],treasure:[27,840,176,454,97,901,33,199,13,298,373,300],companion:[160,199,373,548,748,900,33,388,298,13,27,901],map:[298,300,748,548,97,33,275,498,199,13,27,160]};
const key=party=>[...party].sort((a,b)=>a-b).join(',');
class Model {
 constructor(ids,size=3,mode='many',random=Math.random){this.random=random;this.ids=[...new Set(ids)];this.type='balanced';this.reset(size,mode);}
 reset(size=this.size,mode=this.mode){if(![1,2,3,4,5].includes(size)||!['many','few','single'].includes(mode))throw Error('Invalid test setting');this.size=size;this.mode=mode;this.current=initial.filter(id=>this.ids.includes(id)).slice(0,size);if(this.current.length!==size)throw Error('Missing sample character');this.party=[...this.current];this.locked=new Set();this.seen=new Set([key(this.party)]);this.cycles=0;}
 toggle(id){if(!this.party.includes(id))throw Error('Not a party member');if(this.locked.has(id))this.locked.delete(id);else this.locked.add(id);return this.locked.has(id);}
 unlock(){this.locked.clear();}
 pool(){return this.mode==='many'?this.ids:initial.concat([160]).filter(id=>this.ids.includes(id)).slice(0,this.size+(this.mode==='few'?1:0));}
 candidates(){const pool=this.pool(),order=[...new Set([...(priorities[this.type]||[]),...pool])].filter(id=>pool.includes(id)),out=new Map();
  for(let offset=0;offset<order.length;offset++){const rotated=order.slice(offset).concat(order.slice(0,offset)).filter(id=>!this.locked.has(id)),party=this.party.map(id=>this.locked.has(id)?id:null);let n=0;for(let i=0;i<party.length;i++)if(party[i]===null)party[i]=rotated[n++];if(party.some(id=>id===undefined)||new Set(party).size!==this.size)continue;out.set(key(party),party);}
  return [...out.values()];
 }
 next(type=this.type){if(!types.some(x=>x[0]===type))throw Error('Invalid type');this.type=type;if(this.locked.size===this.size)return {status:'locked',party:[...this.party]};
  if(type==='random')return this.randomNext();
  const available=this.candidates().filter(p=>key(p)!==key(this.party));if(!available.length)return {status:'single',party:[...this.party]};
  let chosen=available.find(p=>!this.seen.has(key(p))),status='new';if(!chosen){this.seen=new Set([key(this.party)]);this.cycles++;chosen=available[0];status='cycled';}
  this.party=[...chosen];this.seen.add(key(chosen));return {status,party:[...chosen]};
 }
 randomNext(){
  const free=this.pool().filter(id=>!this.locked.has(id)),need=this.size-this.locked.size,merge=ids=>{let n=0;return this.party.map(id=>this.locked.has(id)?id:ids[n++]);};
  let chosen=null;
  for(let attempt=0;attempt<128;attempt++){const a=[...free];for(let i=a.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}const p=merge(a.slice(0,need));if(key(p)!==key(this.party)&&!this.seen.has(key(p))){chosen=p;break;}}
  let status='new';
  if(!chosen){const fresh=[],other=[];function visit(start,ids){if(ids.length===need){const p=merge(ids);if(key(p)!==key(this.party)){other.push(p);if(!this.seen.has(key(p)))fresh.push(p);}return;}for(let i=start;i<=free.length-(need-ids.length);i++)visit.call(this,i+1,[...ids,free[i]]);}visit.call(this,0,[]);
   const pool=fresh.length?fresh:other;if(!pool.length)return {status:'single',party:[...this.party]};chosen=pool[Math.floor(this.random()*pool.length)];if(!fresh.length){status='cycled';this.cycles++;this.seen=new Set([key(this.party)]);}}
  this.party=[...chosen];this.seen.add(key(chosen));return {status,party:[...chosen]};
 }
 changed(){return this.party.filter(id=>!this.current.includes(id)).length;}
}
return {Model,types,key,initial};
});
