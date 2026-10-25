'use strict';
self.window=self;
importScripts('./core.js');
let running=false,cancelled=false,runtimePromise;
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
 postMessage({type:'ready',version:self.BoukenVersion,sourceCommit:'dd6d9206fd11f556ffe222a8c6c9ad39c0377269',runtimeManifestCommit:manifest.commit,checkedBlobs:Object.keys(manifest.gitBlobs).length,loadMs:performance.now()-started});return runtime;
}
self.onmessage=async event=>{
 const msg=event.data;if(msg.type==='cancel'){cancelled=true;return;}if(msg.type!=='start'||running)return;
 running=true;cancelled=false;
 try{
  const runtime=await(runtimePromise??=bootstrap()),Lab=BoukenPartyLab,cfg={...(await (await fetch('./config.json')).json()),...msg.config},spec={count:msg.count,itemFraction:msg.itemFraction,ownershipSeed:msg.ownershipSeed||902,itemSeed:1902,missingTarget:3,forceGroups:msg.claims?60:0,claims:msg.claims||0,config:cfg},input=Lab.makeFixture(runtime,spec);
  const started=performance.now(),result=await Lab.recommend(runtime,input,cfg,{incumbents:msg.incumbents,cancelled:()=>cancelled,yield:()=>new Promise(resolve=>setTimeout(resolve,0)),onProgress:snapshot=>postMessage({type:'progress',snapshot})});
  postMessage({type:'result',result,spec,workerMs:performance.now()-started});
 }catch(error){postMessage({type:cancelled?'cancelled':'error',message:error.message});}
 finally{running=false;}
};
