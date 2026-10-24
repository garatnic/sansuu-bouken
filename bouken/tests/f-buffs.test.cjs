const path=require('path'),root=path.resolve(__dirname,'..');
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');global.window={};vm.runInThisContext(fs.readFileSync(path.join(root,'common/events.js'),'utf8'));const E=window.BoukenEvents;
const chars=Array.from({length:6},(_,i)=>({id:i+1,name:'仲間'+i,groupId:i%2,areas:{human:i<4?1:0,monster:i<4?0:1}}));const items=Array.from({length:6},(_,i)=>({id:i+1,name:'お宝'+i,groupId:'01'}));const facilities=[{id:'F01',name:'町',companionPoolMode:'all_uniform'}];
function setup(type='companion',buffs=[]){return {characters:{},items:{},world:{explored:[true],facility:['F01'],visitedFacilities:[false],events:[type],eventPools:['human'],partySnapshot:[1],partyBuffsSnapshot:buffs.map(([id,level])=>({id,level}))}};}
const prepare=(s,r=()=>0)=>E.prepare(s,s.world,0,facilities,chars,items,r);
const resolve=(s,r=()=>0,id)=>E.resolve(s,s.world,0,facilities,chars,items,r,id);
for(const [type,skill] of [['companion','F02'],['collection','F01']])for(let lv=1;lv<=3;lv++){
 let s=setup(type,[[skill,lv]]),p=prepare(s);assert.equal(p.ids.length,lv+1);assert.equal(new Set(p.ids).size,lv+1);assert.equal(s.world.visitedFacilities[0],false);assert.deepEqual(s.characters,{});assert.deepEqual(s.items,{});
 s=JSON.parse(JSON.stringify(s));assert.deepEqual(prepare(s,()=>{throw Error('redraw rerolled')}),p);
 assert.throws(()=>resolve(s,()=>{throw Error('rolled before selection')}),/選んで/);assert.throws(()=>resolve(s,()=>{throw Error('invalid selection rolled')},99),/表示された/);
 const id=p.ids.at(-1),r=resolve(s,()=>0,id);assert.equal(r.id,id);assert.equal(r.success,true);assert.equal((type==='companion'?s.characters:s.items)[id],1);assert.equal(s.world.eventChoices[0],undefined);
 assert.equal(resolve(s,()=>{throw Error('revisited roll')},id).already,true);assert.equal((type==='companion'?s.characters:s.items)[id],1);
}
let s=setup('companion',[['F02',3]]);s.world.eventPools[0]='monster';assert.deepEqual(prepare(s).ids,[5,6]);
// Weight corrections are retained before removing each sampled ID.
s=setup('companion',[['F02',1],['D05',1],['D06',1]]);s.characters={1:1,2:1,3:1};let seq=[.4,0];let p=prepare(s,()=>seq.shift());assert.equal(p.ids[0],4);assert(p.ids.every(id=>id<=4));
s=setup('collection',[['F01',1],['C04',3],['C05',1]]);s.items={1:1,2:1,3:1,4:1,5:1};assert.equal(prepare(s,()=>.5).ids[0],6);
// F03 boundaries, with both C02/D02, all levels; no F01/F02 path still resolves automatically.
for(const type of ['companion','collection'])for(let f=0;f<=3;f++)for(let c=0;c<=3;c++){
 const bonus=[0,.15,.35,.6][f]+[0,.35,1,3][c],rate=(.6+bonus)/(1+bonus);
 for(const [roll,expected] of [[rate-1e-9,true],[rate+1e-9,false]]){s=setup(type,[['F03',f],[type==='collection'?'C02':'D02',c]]);let rolls=[0,roll,.99];assert.equal(resolve(s,()=>rolls.shift()).success,expected);}
}
s=setup('companion',[['F02',1],['F03',3],['D02',3],['D07',3]]);p=prepare(s);let rolls=[.99,0,.91];let r=resolve(s,()=>rolls.shift(),p.ids[1]);assert(r.success&&r.retried);assert.equal(r.id,p.ids[1]);assert.equal(s.characters[r.id],1);assert.equal(rolls.length,0);
s=setup('collection',[['F01',2],['C03',3]]);p=prepare(s);r=resolve(s,()=>0,p.ids[1]);assert(r.extra);assert.notEqual(r.id,r.extra.id);assert.equal(Object.values(s.items).reduce((a,b)=>a+b),2);
s=setup();delete s.world.partyBuffsSnapshot;delete s.world.eventPools;assert(resolve(s).success);
// Exercise the actual page visit handlers: saved choices, close/reopen, failed save, finish and repeat.
class Element{constructor(){this.children=[];this.disabled=false;this.style={};}replaceChildren(){this.children=[];}append(...x){this.children.push(...x);}setAttribute(){}showModal(){this.open=true;}close(){this.open=false;}}
const html=fs.readFileSync(path.join(root,'world.html'),'utf8');let a=html.indexOf(' function eventPicture(type,id,failed=false)'),b=html.indexOf('\n function tap(i)',a);const context={BoukenCharacterImages:{init:()=>Promise.resolve(true),picture:()=>new Element},BoukenItemImages:{init:()=>Promise.resolve(true),picture:()=>new Element},skillNames:{F01:"商人の知恵",F02:"人を見る目"},BoukenEvents:E,BoukenExplore:{visit:w=>w.visitedFacilities[0]?'visited':'available'},BoukenProgress:{recordMilestones:()=>({newlyComplete:false})},characters:chars,items,facilities,fmap:{F01:facilities[0]},visitActions:new Element,visitTitle:new Element,visitDescription:new Element,visitModal:new Element,selected:new Element,document:{createElement:()=>new Element},render(){},notify(){},Math};
context.save=setup('companion',[['F02',3]]);context.w=context.save.world;let fail=false;context.persist=fn=>{if(fail)return false;fn();context.save=JSON.parse(JSON.stringify(context.save));context.w=context.save.world;return true;};vm.createContext(context);vm.runInContext(html.slice(a,b),context);
context.showVisit(0);fail=true;context.visitActions.children[0].onclick();assert.equal(context.w.eventChoices,undefined);assert.equal(context.visitActions.children[0].disabled,false);fail=false;context.visitActions.children[0].onclick();assert.equal(context.visitActions.children.length,4);const ids=JSON.stringify(context.w.eventChoices[0].ids);context.visitModal.close();context.showVisit(0);assert.equal(JSON.stringify(context.w.eventChoices[0].ids),ids);assert.equal(context.visitActions.children.length,4);fail=true;context.visitActions.children[0].onclick();assert(!context.w.visitedFacilities[0]);assert(!context.visitActions.children[0].disabled);fail=false;context.visitActions.children[0].onclick();assert(context.w.visitedFacilities[0]);assert(context.visitModal.open);context.visitModal.close();context.showVisit(0);assert.equal(context.visitActions.children.length,0);
// Verify displayed prompts and all recruitment outcomes through the real visit handler.
for(const [type,skill,name,unit] of [['companion','F02','人を見る目','人'],['collection','F01','商人の知恵','つ']])for(let lv=1;lv<=3;lv++){
 context.save=setup(type,[[skill,lv]]);context.w=context.save.world;context.showVisit(0);context.visitActions.children[0].onclick();
 assert.equal(context.visitDescription.textContent,`${name}の効果でなんと${lv+1}${unit}も見つけたよ。${type==='companion'?'仲間にできるかな？だれかひとり':'ゲットできるかな？どれかひとつ'}を選んでね。`);
}
for(const success of [false,true])for(const retried of [false,true])for(const first of [false,true]){
 const result={type:'companion',name:'テスト',success,retried,first:success&&first};
 context.BoukenEvents={...E,resolve:()=>result};context.save=setup();context.w=context.save.world;context.showVisit(0);context.visitActions.children[0].onclick();
 const failed='町で「テスト」を発見！ でも仲間にできなかった。';
 const joined='「テスト」が仲間になったよ！'+(first?'（初めての獲得）':'（2回目以降）');
 assert.equal(context.visitDescription.textContent,retried?failed+'\nでも勧誘の達人でもう一度さそったよ。\n'+(success?'せいこう！'+joined:'ざんねん！仲間にできなかった。'):success?'町で'+joined:failed);
}
context.BoukenEvents=E;
// Result portraits are shown for both outcomes and C03's additional item; rendering does not save.
const actualPicture=context.eventPicture;const pictures=[];context.eventPicture=(type,id)=>{pictures.push({type,id});return new Element};
for(const type of ['companion','collection'])for(const success of [false,true]){
 const result={type,id:2,name:'対象',success,first:success,extra:type==='collection'&&success?{id:3,name:'追加品',first:true}:null};
 context.BoukenEvents={...E,resolve:()=>result};context.save=setup(type);context.w=context.save.world;pictures.length=0;
 context.showVisit(0);context.visitActions.children[0].onclick();assert(context.visitModal.open);assert.equal(context.visitTitle.textContent,'発見のけっか');assert.equal(context.visitActions.children.length,result.extra?2:1);assert.equal(context.visitActions.children[0].children[1].textContent,'対象');assert.deepEqual(pictures,[{type,id:2},...(result.extra?[{type:'collection',id:3}]:[])]);
}
context.BoukenEvents=E;
for(const [type,skill] of [['companion','F02'],['collection','F01']]){
 context.save=setup(type,[[skill,3]]);context.w=context.save.world;pictures.length=0;context.showVisit(0);context.visitActions.children[0].onclick();assert.equal(pictures.length,4);assert(pictures.every(p=>p.type===type));assert(context.visitActions.children.every(b=>b.children.length===2&&b.children[1].textContent));
}
// Parse every inline script; cache references are all v40.
for(const file of fs.readdirSync(root).filter(n=>n.endsWith('.html'))){const h=fs.readFileSync(root+'/'+file,'utf8');for(const match of h.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);const version=Number(fs.readFileSync(path.join(root,'common/version.js'),'utf8').match(/=\s*(\d+)/)[1]);for(const m of h.matchAll(/\?v=(\d+)/g))assert.equal(Number(m[1]),version);}
console.log('PASS: F01/F02 all levels, shortage, weighted draws, persistence, invalid selections, single award, F03 64 boundaries, D07/C03, old save, actual visit UI handlers, inline syntax/cache');
context.eventPicture=actualPicture;
// Result-only grayscale follows final success; candidate and extra rewards remain in color.
for(const type of ['companion','collection'])for(const success of [true,false]){context.showEventResult({type,id:1,name:'test',success,retried:true},'test');assert.equal(context.visitActions.children[0].children[0].style.filter,success?undefined:'grayscale(1)');assert.equal(context.visitActions.children[0].children[0].style.opacity,success?undefined:'.5');}
context.showEventResult({type:'collection',id:1,name:'test',success:true,extra:{id:2,name:'extra'}},'test');assert.equal(context.visitActions.children[1].children[0].style.filter,undefined);assert.equal(context.eventPicture('companion',1).style.filter,undefined);
console.log('PASS: failure-only grayscale, final retry outcome, color candidates/extra items');

// Acquisition history records only first successful companion joins, not retries or duplicates.
s=setup('companion');r=resolve(s,()=>0);assert.equal(s.characterJoinOrder.at(-1),r.id);const order=JSON.stringify(s.characterJoinOrder);s.world.visitedFacilities[0]=false;r=resolve(s,()=>0);assert.equal(JSON.stringify(s.characterJoinOrder),order);
s=setup('companion');r=resolve(s,()=>.99);assert(!r.success);assert.equal(s.characterJoinOrder,undefined);
console.log('PASS: first-join order and duplicate/failure preservation');
