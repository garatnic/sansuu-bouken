'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
class El{constructor(tag){this.tagName=tag;this.events={};this.children=[];this.contentWindow={PartyRecommendationDispose:()=>{this.disposed=true;}};}setAttribute(){}addEventListener(n,f){this.events[n]=f;}append(n){this.children.push(n);}showModal(){this.open=true;}close(){this.open=false;this.events.close?.();}remove(){this.removed=true;}}
const memory={},ctx={console,document:{createElement:t=>new El(t),body:new El('body')},addEventListener(){},removeEventListener(){},localStorage:{getItem:k=>memory[k]??null,setItem(k,v){if(ctx.failSave)throw Error('full');memory[k]=v;}}};ctx.window=ctx;vm.createContext(ctx);for(const f of ['schema','save','party','party-recommendation'])vm.runInContext(read('common/'+f+'.js'),ctx);
const chars=JSON.parse(read('data/characters.json')),copy=x=>JSON.parse(JSON.stringify(x));
function initial(n){const s=ctx.BoukenSchema.makeInitialSave();s.worldsStarted=3;s.tutorialStory.complete=true;s.characters=Object.fromEntries(chars.slice(0,n).map(c=>[c.id,99]));s.robotGrowth.partyCapacity=ctx.BoukenParty.capacity(n);s.party=[1];s.world={partySnapshot:[1],partyBuffsSnapshot:[],explored:[true,false],marker:'untouched'};return s;}
let persisted=0,closed=0,viewParty=[1];
function open(){ctx.BoukenRecommendation.open({characters:chars,persist:(next,slot,latest)=>{try{const c=copy(latest);c.party=next;ctx.BoukenSave.save(c);}catch{return false;}persisted++;viewParty=next;return true;},onClose:()=>closed++});return ctx.BoukenRecommendationSession;}
for(const count of [1,29,30,46,47,99,100,139,140,169,170,199,200,229,230,259,260,278,279,463,464,927]){
 const s=initial(count),cap=ctx.BoukenParty.capacity(count),ids=chars.slice(0,cap).map(c=>c.id);assert.deepEqual(copy(ctx.BoukenRecommendation.validate(ids,s,chars)),ids);
 for(const bad of [[],Array(cap).fill(null),[...ids,1],ids.map((v,i)=>i===0?'1':v),ids.map((v,i)=>i===0?999:v)])assert.throws(()=>ctx.BoukenRecommendation.validate(bad,s,chars));
 if(cap>1)assert.throws(()=>ctx.BoukenRecommendation.validate(Array(cap).fill(1),s,chars));
}
ctx.BoukenSave.save(initial(500));let before=memory[ctx.BoukenSchema.key],session=open();assert.equal(memory[ctx.BoukenSchema.key],before);const detached=JSON.parse(session.read());detached.characters={};assert.notEqual(session.read(),JSON.stringify(detached));session.close();assert.equal(memory[ctx.BoukenSchema.key],before);assert.equal(persisted,0);
session=open();ctx.failSave=true;assert.throws(()=>session.apply([2,3,4,5,6]),/保存/);assert.equal(memory[ctx.BoukenSchema.key],before);assert.deepEqual(viewParty,[1]);assert.equal(closed,1);ctx.failSave=false;
assert.throws(()=>session.apply([2,2,3,4,5]));assert.equal(persisted,0);
// Re-read after opening: preserve a newer world/inventory; reject ownership/slot changes.
let changed=ctx.BoukenSave.load();changed.items={'1':2};changed.records.marker=123;ctx.BoukenSave.save(changed);session.apply([2,3,4,5,6]);let saved=ctx.BoukenSave.load();assert.deepEqual(copy(saved.party),[2,3,4,5,6]);assert.deepEqual(copy(saved.world),copy(initial(500).world));assert.equal(saved.items[1],2);assert.equal(saved.records.marker,123);assert.equal(persisted,1);assert.equal(closed,2);assert.throws(()=>session.apply([3,4,5,6,7]));
session=open();changed=ctx.BoukenSave.load();changed.characters={'1':1};ctx.BoukenSave.save(changed);assert.throws(()=>session.apply([2,3,4,5,6]));session.close();
// Escape uses the same no-write close path and terminates frame worker.
session=open();const dialog=ctx.document.body.children.at(-1);let prevented=false;dialog.events.cancel({preventDefault(){prevented=true;}});assert(prevented&&dialog.removed&&dialog.children[0].disposed);assert.equal(persisted,1);
// Actual page wiring uses the existing saver; next departure and current world snapshots remain separate.
assert.match(read('party.html'),/BoukenRecommendation.open\(\{characters,persist/);assert.match(read('party.html'),/save=BoukenSave.save\(copy\)/);assert.match(read('worldcreate.html'),/BoukenParty.normalize\(current.party/);assert.match(read('world.html'),/w.partySnapshot/);
const html=read('party-recommendation.html');assert.match(html,/<base href="tests\/party-recommendation\/integration\/">/);assert.match(html,/<button hidden inert id="openData"/);assert.match(html,/<details class="testing" hidden inert>/);assert(!html.includes('app.js?rev=balance2'));
console.log('PASS game host: 22 ownership boundaries/1–5 slots, invalid IDs/duplicates/count, copy isolation, back/Escape/dispose, save failure no close/no loss, latest-state ownership/capacity checks, successful existing-save update/reload, world unchanged, shared images and page wiring.');
