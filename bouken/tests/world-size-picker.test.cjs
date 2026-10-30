const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const DOM=require('./helpers/render-dom.cjs'),root=path.resolve(__dirname,'..'),read=n=>JSON.parse(fs.readFileSync(path.join(root,'data',n+'.json'))),masters=Object.fromEntries(['terrains','facilities','characters','world_facility_counts','collection_items','collection_rewards','achievements'].map(n=>[n,read(n)]));
const html=fs.readFileSync(path.join(root,'worldcreate.html'),'utf8'),source=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)[1],pickerSource=fs.readFileSync(path.join(root,'common/world-size-picker.js'),'utf8'),workerSource=fs.readFileSync(path.join(root,'common/world-preview-worker.js'),'utf8');
async function page({started=3,world=null,worker=false,workerFails=false,failPreview=false,missingMasters=false,confirm=true,canvasFails=false,partyIds=null,ownedIds=null,capacity=5,randomSeed=63,savedInput=null,chooseOnly=false}={}){
 const dom=DOM(),nodes=dom.document,pixels=[],messages=[],jobs=[],events={},memory={},calls=[];let writes=0,seed=randomSeed;
 const create=nodes.createElement;nodes.createElement=tag=>{const e=create(tag);if(tag==='canvas'){const ctx={fillStyle:'',fillRect(...p){pixels.push({canvas:e,color:this.fillStyle,p});}};e.getContext=()=>canvasFails?null:ctx;}return e;};
 const field=nodes.getElementById('size'),options=create('div'),help=create('p');options.className='size-options';help.className='size-help';field.append(options,help);
 const c={console,URL,document:nodes,Math:Object.create(Math),setTimeout,clearTimeout,requestAnimationFrame:fn=>setTimeout(fn,0),location:{href:'',reload:()=>{c.reloads=(c.reloads||0)+1;}},addEventListener:(n,fn)=>(events[n]??=[]).push(fn),localStorage:{getItem:k=>memory[k]??null,setItem(k,v){memory[k]=v;writes++;}}};c.window=c;c.Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};vm.createContext(c);
 for(const file of ['schema','achievements','save','result','progress','worldgen','party','explore','collection','buffs'])vm.runInContext(fs.readFileSync(path.join(root,'common',file+'.js'),'utf8'),c);
 c.BoukenMaster={load:async n=>{if(missingMasters&&n==='terrains')throw Error('preview master failed');return masters[n];}};c.BoukenTutorial={confirmDeparture:async()=>confirm};
 const s=c.BoukenSchema.makeInitialSave();s.worldsStarted=started;s.tutorialStory.complete=true;s.robotGrowth.partyCapacity=capacity;s.party=partyIds||[53,11,42,5,1];s.characters=Object.fromEntries(masters.characters.filter(ch=>!ownedIds||ownedIds.includes(ch.id)).map(ch=>[ch.id,1]));
 if(world){s.world=c.BoukenWorldGen.generate(world,world,masters.terrains,masters.facilities,masters.world_facility_counts,[]);s.world.departureNumber=started;if(started>=2)s.world.explored.fill(true);}
 memory[c.BoukenSchema.key]=JSON.stringify(savedInput||s);const initial=memory[c.BoukenSchema.key];
 const original=c.BoukenWorldGen;c.BoukenWorldGen={...original,generate(...args){calls.push(args);if(failPreview&&c.location.href==='')throw Error('preview failed');return original.generate(...args);}};
 nodes.currentScript={src:'http://independent.test/bouken/common/world-size-picker.js?v=95'};
 if(worker)c.Worker=class{
  constructor(url){assert(/world-preview-worker\.js\?v=\d+/.test(String(url)));this.terminated=false;this.c={Math:c.Math,postMessage:data=>queueMicrotask(()=>{if(!this.terminated)this.onmessage?.({data});}),importScripts:file=>{assert.match(file,/^worldgen\.js\?v=\d+$/);vm.runInContext(fs.readFileSync(path.join(root,'common/worldgen.js'),'utf8'),this.c);}};this.c.self=this.c;vm.createContext(this.c);vm.runInContext(workerSource,this.c);}
  postMessage(data){messages.push(data);if(workerFails){queueMicrotask(()=>this.onerror?.(Error('worker blocked')));return;}queueMicrotask(()=>{if(!this.terminated)this.c.onmessage({data});});}terminate(){this.terminated=true;}
 };
 vm.runInContext(pickerSource,c);const real=c.BoukenWorldSizePicker;let picker;
 c.BoukenWorldSizePicker={create(root,config){picker=real.create(root,chooseOnly?{}:config);const preview=picker.preview;picker.preview=input=>{const p=preview(input);jobs.push(p);return p;};return picker;}};
 await vm.runInContext(source,c);async function settle(){for(let i=0;i<12;i++)await Promise.resolve();await Promise.all(jobs);}
 return {c,dom,field,options,help,pixels,messages,jobs,calls,events,initial,memory,picker,get writes(){return writes;},settle,button:n=>options.children.find(e=>e.getAttribute('aria-label')?.startsWith(n+'×'))};
}
test('normal three equal buttons select independently of samples, actual generator uses normalized party buffs, no save changes',async()=>{
 const p=await page({chooseOnly:true});assert(!p.picker.disabled);assert.equal(p.options.children.length,3);assert.equal(p.picker.value,'10');
 p.button(20).onclick();assert.equal(p.picker.value,'20');assert.equal(p.button(20).getAttribute('aria-pressed'),'true');assert.equal(p.button(10).getAttribute('aria-pressed'),'false');p.button(30).onclick();assert.equal(p.picker.value,'30');
 await p.settle();assert.deepEqual(p.calls.map(a=>a[0]),[10,20,30]);assert.equal(p.pixels.length,100+400+900);assert.equal(p.writes,0);assert.equal(p.memory[p.c.BoukenSchema.key],p.initial);
 const s=p.c.BoukenSave.load(),chars=masters.characters,owned=chars.filter(ch=>s.characters[ch.id]>0).map(ch=>ch.id),party=p.c.BoukenParty.normalize(s.party,owned,p.c.BoukenParty.capacity(owned.length,s)),buffs=p.c.BoukenParty.buffs(party,new Map(chars.map(ch=>[ch.id,ch])));
 assert.equal(JSON.stringify(p.calls[0][5]),JSON.stringify(buffs));
 for(const n of [10,20,30]){const canvas=p.button(n).querySelector('canvas');assert.equal(canvas.width,n);assert.equal(canvas.height,n);assert.equal(canvas.style.width,n/30*100+'%');assert(!canvas.hidden);assert.equal(p.pixels.filter(d=>d.canvas===canvas).length,n*n);}
});
test('real worker protocol reuses generator, transfers terrain only, and BFCache reopening generates fresh samples',async()=>{
 const p=await page({worker:true});await p.settle();assert.equal(p.calls.length,0);assert.equal(p.messages.length,1);assert.equal(p.pixels.length,1400);assert.deepEqual(Object.keys(p.messages[0]).sort(),['buffs','counts','facilities','sizes','terrains']);
 assert.equal(p.writes,0);const before=p.pixels.map(x=>x.color).join();p.events.pagehide[0]();p.events.pageshow[0]({persisted:true});assert.equal(p.c.reloads,1);const fresh=await page({worker:true,randomSeed:64,savedInput:p.c.BoukenSave.load()});await fresh.settle();assert.equal(fresh.messages.length,1);assert.notEqual(fresh.pixels.map(x=>x.color).join(),before);assert.equal(p.memory[p.c.BoukenSchema.key],p.initial);
});
test('real departure generates a separate world at each selected size, increments once, uses perimeter start',async()=>{
 for(const n of [10,20,30]){const p=await page();await p.settle();const previous=p.calls.length;await p.button(n).onclick();const save=p.c.BoukenSave.load();assert.equal(p.calls.length,previous+1);assert.equal(p.c.location.href,'world.html');assert.equal(save.world.width,n);assert.equal(save.world.height,n);assert.equal(save.worldsStarted,4);assert(save.world.player.x===0||save.world.player.x===n-1||save.world.player.y===0||save.world.player.y===n-1);assert.equal(save.world.startIndex,save.world.player.y*n+save.world.player.x);assert.equal(p.writes,1);}
});
test('first two adventures stay fixed 5x5; locked tutorial creates no buttons/previews/departure handler; resume preserves world',async()=>{
 for(const started of [0,1]){const p=await page({started});await p.settle();assert.equal(p.picker.value,'5');assert.equal(p.options.children.length,1);assert.equal(p.options.children[0].tagName,'button');assert.equal(p.calls.length,0);await p.options.children[0].onclick();assert.equal(p.c.BoukenSave.load().world.width,5);assert.equal(p.c.BoukenSave.load().worldsStarted,started+1);}
 const p=await page({started:1,world:5});assert(p.picker.disabled);assert.equal(p.dom.document.getElementById('create').listeners.click,undefined);assert.equal(p.options.children[0].tagName,'p');assert.equal(p.jobs.length,0);p.events.pageshow[0]({persisted:true});assert.equal(p.c.reloads,1);const prior=p.c.BoukenSave.load().world;p.dom.document.getElementById('resumeWorld').onclick();assert.equal(JSON.stringify(p.c.BoukenSave.load().world),JSON.stringify(prior));assert.equal(p.c.location.href,'world.html');
});
test('preview and master failure leave choices/departure usable; worker errors fall back; cancel confirmation leaves save unchanged',async()=>{
 const failure=await page({failPreview:true,chooseOnly:true});await failure.settle();assert(!failure.picker.disabled);failure.button(30).onclick();assert.equal(failure.picker.value,'30');assert(failure.button(30).textContent.includes('見本なし'));assert.equal(failure.writes,0);
 const missing=await page({missingMasters:true});await missing.settle();assert(!missing.picker.disabled);assert(missing.button(10).textContent.includes('見本なし'));
 const canvas=await page({canvasFails:true});await canvas.settle();assert(!canvas.picker.disabled);await canvas.button(10).onclick();assert.equal(canvas.c.location.href,'world.html');assert.equal(canvas.writes,1);
 const fallback=await page({worker:true,workerFails:true});await fallback.settle();assert.equal(fallback.calls.length,3);assert.equal(fallback.pixels.length,1400);assert.equal(fallback.writes,0);
 const cancel=await page({confirm:false});await cancel.settle();await cancel.button(10).onclick();assert.equal(cancel.writes,0);assert.equal(cancel.c.location.href,'');assert(!cancel.picker.disabled);
});
test('native select removed; responsive three-column grid, constant tap target, no terrain/facility image renderer',()=>{
 assert(!html.includes('<select'));assert(html.includes('<fieldset id="size"'));assert(!html.includes('マップの見本'));assert(!html.includes('id="create"'));assert(html.includes('<legend>新しいワールドへ出発！</legend>'));assert(!pickerSource.includes('BoukenSave'));assert(!workerSource.includes('BoukenSave'));assert(!pickerSource.includes('BoukenTileImages'));
 const css=fs.readFileSync(path.join(root,'common/world-select.css'),'utf8');assert(css.includes('repeat(3,minmax(0,1fr))'));assert(css.includes('min-height:140px'));assert(css.includes('max-width:100%'));assert(css.includes('[aria-pressed="true"]'));
});

test('real E08 party buffs are capped/normalized and refreshed from the current save on restored pages',async()=>{
 const p=await page({partyIds:[600,600,9999],ownedIds:[600],capacity:1});await p.settle();const expected=masters.characters.find(c=>c.id===600).skills.map(s=>({id:s.id,level:s.level})).sort((a,b)=>a.id.localeCompare(b.id));assert.equal(JSON.stringify(p.calls[0][5]),JSON.stringify(expected));assert(p.calls[0][5].some(s=>s.id==='E08'));
 const s=p.c.BoukenSave.load();s.party=[];p.memory[p.c.BoukenSchema.key]=JSON.stringify(s);p.events.pagehide[0]();p.events.pageshow[0]({persisted:true});assert.equal(p.c.reloads,1);const fresh=await page({savedInput:s});await fresh.settle();assert.equal(fresh.calls[0][5].length,0);assert.equal(p.writes,0);assert.equal(fresh.writes,0);
});

test('direct size departure: unfinished world requires Yes; No/Escape preserve bytes; repeated taps do not generate twice',async()=>{
 for(const answer of ['no','escape','yes']){
  const p=await page({world:10});await p.settle();const prior=p.memory[p.c.BoukenSchema.key],before=p.calls.length;
  const task=p.button(20).onclick();const dialog=p.dom.document.getElementById('replaceWorldDialog');assert(dialog.open);assert(p.picker.disabled);assert.equal(p.calls.length,before);assert.equal(p.writes,0);
  p.button(30).onclick();assert.equal(p.picker.value,'20');
  if(answer==='escape')dialog.oncancel({preventDefault(){}});else p.dom.document.getElementById(answer==='yes'?'replaceWorldYes':'replaceWorldNo').onclick();
  await task;assert(!dialog.open);
  if(answer==='yes'){assert.equal(p.writes,1);assert.equal(p.calls.length,before+1);assert.equal(p.c.BoukenSave.load().world.width,20);assert.equal(p.c.location.href,'world.html');}
  else{assert.equal(p.memory[p.c.BoukenSchema.key],prior);assert.equal(p.calls.length,before);assert.equal(p.c.location.href,'');assert(!p.picker.disabled);}
 }
 const failed=await page();await failed.settle();const prior=failed.memory[failed.c.BoukenSchema.key],setItem=failed.c.localStorage.setItem;failed.c.localStorage.setItem=()=>{throw Error('quota');};await failed.button(10).onclick();assert.equal(failed.memory[failed.c.BoukenSchema.key],prior);assert.equal(failed.c.location.href,'');assert(!failed.picker.disabled);failed.c.localStorage.setItem=setItem;await failed.button(10).onclick();assert.equal(failed.writes,1);
 const done=await page({world:10});await done.settle();const s=done.c.BoukenSave.load();s.world.visitedFacilities=s.world.facility.map(Boolean);done.memory[done.c.BoukenSchema.key]=JSON.stringify(s);await done.button(30).onclick();assert(!done.dom.document.getElementById('replaceWorldDialog').open);assert.equal(done.c.BoukenSave.load().world.width,30);
});
