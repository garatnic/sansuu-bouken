const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const root=__dirname+'/..',html=fs.readFileSync(root+'/world.html','utf8');
const init=html.slice(html.indexOf(' let save=BoukenSave.load()'),html.indexOf(' const [terrains,facilities,characters,items,skills]='));
function open(saved){const button={hidden:true},info={};const c={info,window:{},localStorage:{getItem:k=>saved[k]??null,setItem:(k,v)=>saved[k]=v},document:{getElementById:id=>id==='endAdventure'?button:info}};vm.createContext(c);for(const f of ['schema','save']){vm.runInContext(fs.readFileSync(root+'/common/'+f+'.js','utf8'),c);Object.assign(c,c.window);}vm.runInContext('(function(){'+init+'})()',c);return {c,button,info};}
test('all supported sizes: real initialization selects only dimensions, including old and completed tutorial worlds',()=>{
 for(const n of [5,10,20,30])for(const departureNumber of [1,2,8])for(const complete of [false,true]){
  const storage={},x=open(storage),s=x.c.BoukenSchema.makeInitialSave();s.worldsStarted=departureNumber;s.tutorialStory.complete=complete;s.world={width:n,height:n,departureNumber,completionRecorded:complete};x.c.BoukenSave.save(s);
  assert.equal(open(storage).button.hidden,n===5,`${n}, departure ${departureNumber}, complete ${complete}`);
 }
});
test('5x5 home suspension retains world, player and progress through real save/load, then hides end button on reopen',()=>{
 const storage={},x=open(storage),s=x.c.BoukenSchema.makeInitialSave();s.world={width:5,height:5,player:{x:3,y:2},startIndex:12,explored:Array(25).fill(false),exploredCount:1};s.world.explored[12]=s.world.explored[13]=true;x.c.BoukenSave.save(s);
 const reopened=open(storage),w=reopened.c.BoukenSave.load().world;assert.equal(reopened.button.hidden,true);assert.equal(w.player.x,3);assert.equal(w.player.y,2);assert.equal(w.exploredCount,1);assert(w.explored[13]);
 assert.match(html,/<a class="home-link" href="home.html">ホームに戻る<\/a>/);
});
test('initial load and no-world state keep end button hidden; hidden element takes no flex width or gap',()=>{
 assert.equal(open({}).button.hidden,true);assert.match(open({}).info.textContent,/ワールドがありません/);
 assert.match(html,/<button id="endAdventure" type="button" hidden>/);
 assert.match(html,/#endAdventure\[hidden\]\{display:none\}/);
 assert.match(html,/\.world-header-actions\{display:flex;align-items:center;gap:6px;flex:none\}/);
});
