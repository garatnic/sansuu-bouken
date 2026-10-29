const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),storage={};const c={console,localStorage:{getItem:k=>storage[k]??null,setItem:(k,v)=>{if(c.fail)throw Error('quota');storage[k]=v;}}};c.window=c;vm.createContext(c);for(const name of ['schema','save','party','result','collection','home-growth-notice'])vm.runInContext(fs.readFileSync(path.join(root,'common',name+'.js'),'utf8'),c);
const S=c.BoukenSchema,P=c.BoukenParty,R=c.BoukenResult;const inventory=n=>Object.fromEntries(Array.from({length:n},(_,i)=>[i+1,1]));const world=()=>({width:2,height:2,startIndex:0,terrain:['T01','T01','T01','T01'],explored:[true,false,false,false],facility:[null,null,null,null],visitedFacilities:[false,false,false,false]});
(async()=>{
let s=S.makeInitialSave();s.characters=inventory(22);s.characters[1]=99;s=c.BoukenSave.save(s);assert.equal(s.robotGrowth.discovery,0);s.characters[24]=1;s=c.BoukenSave.save(s);assert.equal(s.robotGrowth.discovery,1);
// Save/reload, home return and regeneration retain pending without discovering.
for(let i=0;i<3;i++){s=c.BoukenSave.load();s.world=world();s=c.BoukenSave.save(s);assert.equal(s.robotGrowth.discovery,1);assert.equal(c.BoukenHomeGrowthNotice.pending(s).party,null);}
s.world.completionRecorded=true;R.start(s.world);R.finish(s,s.world);assert.equal(s.robotGrowth.discovery,1);S.discoverForResult(s,s.lastClearResult);s=c.BoukenSave.save(s);assert(s.lastClearResult.robotDiscovery);assert.equal(s.robotGrowth.discovery,2);assert.equal(S.discoverForResult(s,{}),false);
// Stale save cannot rewind lifecycle or unlocked slots.
const stale=S.makeInitialSave();stale.characters=inventory(23);assert.equal(c.BoukenSave.save(stale).robotGrowth.discovery,2);
c.BoukenCollection.configure([],[]);let calls=[];c.BoukenNoticeDialog={show:async o=>{calls.push(o);await o.onAccept();return 'ok';}};
await c.BoukenHomeGrowthNotice.show();assert.equal(c.BoukenSave.load().robotGrowth.discovery,3);assert.equal(calls.length,1);await c.BoukenHomeGrowthNotice.show();assert.equal(calls.length,1);
// Fresh run abandons; discovery failure cannot change stored pending state.
delete storage[S.key];s=S.makeInitialSave();s.characters=inventory(30);s.world=world();s=c.BoukenSave.save(s);const next=JSON.parse(JSON.stringify(s));R.abandon(next,next.world);c.fail=true;assert.throws(()=>c.BoukenSave.save(next));c.fail=false;assert.equal(c.BoukenSave.load().robotGrowth.discovery,1);s=c.BoukenSave.save(next);assert.equal(s.world,null);assert(s.lastClearResult.robotDiscovery);assert.equal(s.robotGrowth.discovery,2);
// Each threshold needs home acknowledgement, including when robot is pending.
for(const [n,cap] of [[48,1],[49,2],[130,2],[131,3],[227,3],[228,4],[292,4],[293,5]]){
 s=c.BoukenSave.load();s.characters=inventory(n);s=c.BoukenSave.save(s);const before=P.capacity(n,s);assert.equal(before,cap-(n===49||n===131||n===228||n===293?1:0));const start=calls.length;await c.BoukenHomeGrowthNotice.show();s=c.BoukenSave.load();assert.equal(P.capacity(n,s),cap);if(n===49||n===131||n===228||n===293){assert.equal(calls.length,start+1);assert(calls.at(-1).title.includes('いっしょ'));}}
// Jumping thresholds queues one party event per visit; activation waits.
delete storage[S.key];s=S.makeInitialSave();s.characters=inventory(500);s.robotGrowth.discovery=2;c.BoukenSave.save(s);for(let cap=2;cap<=5;cap++){const start=calls.length;await c.BoukenHomeGrowthNotice.show();s=c.BoukenSave.load();assert.equal(s.robotGrowth.partyCapacity,cap);assert.equal(s.robotGrowth.discovery,2);assert.equal(calls.length,start+1);}await c.BoukenHomeGrowthNotice.show();assert.equal(c.BoukenSave.load().robotGrowth.discovery,3);
const html=fs.readFileSync(path.join(root,'world.html'),'utf8');assert(html.includes('BoukenSchema.discoverForResult(save,save.lastClearResult);w.resultPending=false;'));const home=html.slice(html.indexOf("document.querySelector('.home-link')"),html.indexOf('const endDialog='));assert(!home.includes('discoverForResult'));
console.log('PASS: 22/23 threshold, duplicates, regeneration/reload/home retention, result-only discovery, abandon/failure retry, monotonic save, all slot boundaries, one event per home and party priority');
})().catch(e=>{console.error(e);process.exitCode=1;});
