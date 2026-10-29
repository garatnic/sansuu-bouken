// 編成画面の共通ルール。スキル効果の実適用は後続工程。
window.BoukenParty=Object.freeze({
 capacity(count,save){return save?.robotGrowth?save.robotGrowth.partyCapacity:(count>=293?5:count>=228?4:count>=131?3:count>=49?2:1)},
 normalize(ids,owned,max){const allowed=new Set(owned),seen=new Set();const result=Array(max).fill(null);if(!Array.isArray(ids))return result;ids.slice(0,max).forEach((id,i)=>{const n=Number(id);if(allowed.has(n)&&!seen.has(n)){result[i]=n;seen.add(n)}});return result},
 buffs(ids,byId){const totals=new Map();for(const id of ids){const c=byId.get(id);if(!c)continue;for(const s of c.skills||[])totals.set(s.id,(totals.get(s.id)||0)+Number(s.level||0))}return [...totals].filter(([,v])=>v>0).map(([id,v])=>({id,level:Math.min(3,v)})).sort((a,b)=>a.id.localeCompare(b.id))}
});
