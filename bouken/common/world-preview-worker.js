// Only the real pure generator and disposable terrain arrays run here. No save/records APIs.
self.window=self;
importScripts('worldgen.js?v=92');
self.onmessage=({data})=>{
 for(const size of data.sizes){
  try{const world=BoukenWorldGen.generate(size,size,data.terrains,data.facilities,data.counts,data.buffs);self.postMessage({size,terrain:world.terrain});}
  catch{self.postMessage({size,error:'地形の見本を生成できませんでした'});}
 }
 self.postMessage({done:true});
};
