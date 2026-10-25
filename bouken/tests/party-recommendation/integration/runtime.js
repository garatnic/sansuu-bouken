'use strict';
self.window=self;
async function bootstrap(){
 const started=performance.now(),manifest=await (await fetch('../source-manifest.json')).json(),root=new URL('../../../',self.location.href),texts={};
 await Promise.all(Object.entries(manifest.gitBlobs).map(async([p,sha])=>{
  const response=await fetch(new URL(p.replace(/^bouken\//,''),root));if(!response.ok)throw Error('Source load failed: '+p);const bytes=new Uint8Array(await response.arrayBuffer()),header=new TextEncoder().encode('blob '+bytes.length+'\0'),all=new Uint8Array(header.length+bytes.length);all.set(header);all.set(bytes,header.length);
  const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-1',all))].map(x=>x.toString(16).padStart(2,'0')).join('');if(hash!==sha)throw Error('Source changed: '+p);texts[p]=new TextDecoder().decode(bytes);
 }));
 for(const name of ['schema','party','explore','buffs','collection','events','progress','worldgen','version']){const url=URL.createObjectURL(new Blob([texts['bouken/common/'+name+'.js']],{type:'text/javascript'}));try{importScripts(url);}finally{URL.revokeObjectURL(url);}}
 if(self.BoukenVersion!==manifest.version)throw Error('Game version mismatch');
 const data=Object.fromEntries(['terrains','facilities','characters','collection_items','collection_rewards','world_facility_counts','skills'].map(n=>[n,JSON.parse(texts['bouken/data/'+n+'.json'])]));
 BoukenCollection.configure(data.collection_items,data.collection_rewards);const runtime={c:self,data,byId:new Map(data.characters.map(x=>[x.id,x]))};
 return runtime;
}
