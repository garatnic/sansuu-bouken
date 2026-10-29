const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),{performance}=require('perf_hooks'),os=require('os');
const DOM=require('./render-dom.cjs'),root=path.resolve(__dirname,'../..'),read=n=>JSON.parse(fs.readFileSync(path.join(root,'data',n+'.json'))),master=Object.fromEntries(['terrains','facilities','characters','collection_items','collection_rewards','achievements','skills','world_facility_counts'].map(n=>[n,read(n)]));
const production=fs.readFileSync(path.join(root,'world.html'),'utf8');
const slice=(s,a,b)=>{assert(s.includes(a)&&s.includes(b));return s.slice(s.indexOf(a),s.indexOf(b,s.indexOf(a)));};
function rng(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
async function context(legacy=false){const html=production;
 const dom=DOM(),memory={},samples={},c={console,URL,performance,Math:Object.create(Math),document:dom.document,localStorage:{getItem:k=>memory[k]??null,setItem(k,v){if(c.failSave)throw Error('simulated quota');memory[k]=v;}},setTimeout(){},maybeShowResult(){},requestAnimationFrame(){},notify(message){this.lastNotify=message;},clock:{flush(){}},worldEnded:false,pending:null,robotRoute:[],robotDriving:false,robot:{active:false,previewing:false},adjustMapHeight(){},positionSense(){},queueTutorialReward(){},ask(){return 'question';}};c.window=c;c.notify=m=>{c.lastNotify=m;};
 c.Image=class{set src(url){if(url.includes('character_sheet')){this.naturalWidth=3840;this.naturalHeight=3968;}else if(url.includes('field_tiles')){this.naturalWidth=448;this.naturalHeight=64;}else{this.naturalWidth=512;this.naturalHeight=64;}this.onload();}};
 vm.createContext(c);
 for(const f of ['schema','party','achievements','save','collection','result','progress','explore','buffs','events','worldgen','auto-drive','tile-images','character-images','item-images','facility-event-ui'])vm.runInContext(fs.readFileSync(path.join(root,'common',f+'.js'),'utf8'),c);
 c.BoukenMaster={load:async n=>master[n]};await c.BoukenAchievements.init();c.BoukenCollection.configure(master.collection_items,master.collection_rewards);await c.BoukenTileImages.init();await c.BoukenCharacterImages.init();await c.BoukenItemImages.init();
 c.BoukenTutorial={highlightWorld:()=>false};Object.assign(c,{characters:master.characters,items:master.collection_items,facilities:master.facilities,skills:master.skills,skillNames:Object.fromEntries(master.skills.map(s=>[s.id,s.name])),tmap:Object.fromEntries(master.terrains.map(x=>[x.id,x])),fmap:Object.fromEntries(master.facilities.map(x=>[x.id,x])),colors:{},icons:{},ficons:{},map:dom.document.getElementById('map'),actions:dom.document.getElementById('actions'),info:dom.document.getElementById('info')});
 for(const id of ['visitModal','visitActions','visitTitle','visitDescription'])c[id]=dom.document.getElementById(id);
 const code=slice(html,' function persist(mutator)','\n function positionSense')+slice(html,' let renderKeys=[],','\n function preloadEventImages')+slice(html,' function renderRobotRoute(){','\n function dismissRobotPlan')+slice(html,' function eventPicture(','\n async function maybeShowResult')+slice(html,' function showVisit(i)','\n document.addEventListener(\'close\'');
 c.playerIndex=()=>c.w.player.y*c.w.width+c.w.player.x;
 vm.runInContext(code,c);if(legacy)vm.runInContext(fs.readFileSync(path.join(root,'tests/fixtures/world-render-v89.js'),'utf8'),c);
 function record(k,time){(samples[k]??=[]).push(time);}
 function wrap(obj,name,label){const original=obj[name];obj[name]=function(...args){const t=performance.now();try{return original.apply(this,args);}finally{record(label,performance.now()-t);}};}
 for(const [global,names] of Object.entries({BoukenBuffs:['detected','guide','eventSense'],BoukenSave:['save'],BoukenEvents:['prepare','resolve'],BoukenProgress:['status'],BoukenAchievements:['evaluate'],BoukenCollection:['stages']})){c[global]={...c[global]};for(const n of names)wrap(c[global],n,global+'.'+n);}
 for(const n of ['render','persist','showVisit','tap','renderRobotRoute'])wrap(c,n,n);
 vm.runInContext(slice(html,' function verificationOpenAll(){','\n verificationTitle.onclick')+slice(html,' async function maybeShowResult(){','\n async function runTutorial'),c);
 c.BoukenResultUI={show:r=>c.shownResult=r};c.robot.stop=()=>{};
 const oldDraw=c.BoukenTileImages.draw;c.BoukenTileImages={...c.BoukenTileImages,draw(...args){if(args[1])dom.counts.mapTileDraws=(dom.counts.mapTileDraws||0)+1;return oldDraw.apply(this,args);}};
 function reset(){for(const k of Object.keys(samples))delete samples[k];dom.reset();}
 return {c,dom,memory,samples,reset,record};
}
function seedWorld(x,n,seed,buffs=true){const c=x.c;c.Math.random=rng(seed);let save=c.BoukenSchema.makeInitialSave();save.tutorialStory.complete=true;save.worldsStarted=3;save.robotGrowth.discovery=3;save.robotGrowth.partyCapacity=5;for(const f of c.BoukenSchema.robotFeatures)save.robotGrowth.features[f.id]={stage:4};for(const ch of master.characters)save.characters[ch.id]=1;save.characterJoinOrder=master.characters.map(c=>c.id);save.party=[53,11,42,5,1];
 const w=c.BoukenWorldGen.generate(n,n,master.terrains,master.facilities,master.world_facility_counts,[]);w.departureNumber=3;w.partySnapshot=save.party;w.partyBuffsSnapshot=buffs?c.BoukenParty.buffs(save.party,new Map(master.characters.map(ch=>[ch.id,ch]))):[];c.BoukenResult.start(w);save.world=w;w.explored.fill(true);w.exploredCount=n*n-1;c.BoukenProgress.recordMilestones(save,w,undefined,master.characters);c.save=c.BoukenSave.save(save);c.w=c.save.world;c.render();c.visitModal.close();x.reset();return w.facility.map((v,i)=>v?i:-1).filter(i=>i>=0);}

function snapshot(x){const s=JSON.parse(JSON.stringify(x.c.save));delete s.updatedAt;delete s.createdAt;if(s.world)delete s.world.createdAt;if(s.lastClearResult)delete s.lastClearResult.completedAt;return s;}
function tree(x){return JSON.stringify([x.dom.tree(x.c.map),x.dom.tree(x.dom.document.getElementById('senseGrid')),x.c.info.textContent,x.c.visitActions.textContent]);}

module.exports={context,seedWorld,master,snapshot,tree,production};
