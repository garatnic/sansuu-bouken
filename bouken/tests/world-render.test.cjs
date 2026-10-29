const {test}=require('node:test'),assert=require('node:assert/strict');
const {context,seedWorld,snapshot,tree,production}=require('./helpers/world-render.cjs');
const parity=(a,b)=>{assert.deepEqual(snapshot(a),snapshot(b));assert.equal(tree(a),tree(b));};
test('all sizes: real facility handlers preserve results, visited markers, B04/B07, saves and DOM; only dirty map tiles draw',async()=>{
 for(const n of [5,10,20,30]){
  const a=await context(true),b=await context();const indices=seedWorld(a,n,610+n);seedWorld(b,n,610+n);parity(a,b);
  for(const i of indices){
   for(const x of [a,b]){x.reset();x.c.tap(i);assert(x.c.visitModal.open);}
   assert.equal(a.dom.counts.mapTileDraws,n*n);assert.equal(b.dom.counts.mapTileDraws,2);parity(a,b);
   for(const x of [a,b]){x.reset();x.c.visitActions.children[0].onclick();assert(x.c.w.visitedFacilities[i]);}
   await Promise.resolve();assert.equal(a.dom.counts.mapTileDraws,n*n);assert.equal(b.dom.counts.mapTileDraws,1);parity(a,b);
   assert(!b.c.map.children[i].querySelector('.mark'));for(const x of [a,b])x.c.visitModal.close();
  }
  assert(b.c.w.completionRecorded);await b.c.maybeShowResult();assert.equal(b.c.shownResult.status,'complete');assert.equal(b.c.w.resultPending,false);
 }
});
test('unchanged cells keep DOM/canvas, copied save world stays cached, foreign/missing nodes repair, same-size new world fully resets',async()=>{
 const x=await context();seedWorld(x,30,46);const old=[...x.c.map.children];x.reset();x.c.render();assert.equal(x.dom.counts.mapTileDraws||0,0);assert.equal(x.c.map.children[0],old[0]);
 x.c.save=x.c.BoukenSave.save(x.c.save);x.c.w=x.c.save.world;x.reset();x.c.render();assert.equal(x.dom.counts.mapTileDraws||0,0);
 old[0].replaceWith(x.dom.document.createElement('button'));x.reset();x.c.render();assert.equal(x.dom.counts.mapTileDraws,1);
 x.c.map.children[2].remove();x.reset();x.c.render();assert.equal(x.c.map.children.length,900);assert.equal(x.dom.counts.mapTileDraws,900);
 const prior=x.c.map.children[0];x.c.w.createdAt='another-world';x.reset();x.c.render();assert.equal(x.dom.counts.mapTileDraws,900);assert.notEqual(x.c.map.children[0],prior);
 seedWorld(x,10,49);assert.equal(x.c.map.children.length,100);
});
test('partial exploration, revelation, frontier, detected signals, guide and changed terrain/party preserve v89 output',async()=>{
 for(const n of [5,10,20,30]){
  const a=await context(true),b=await context();for(const x of [a,b]){seedWorld(x,n,85);x.c.w.explored.fill(false);x.c.w.explored[x.c.w.startIndex]=true;x.c.w.visitedFacilities.fill(false);x.c.render();}parity(a,b);
  for(const x of [a,b]){const c=x.c,next=c.BoukenExplore.adjacent(c.w,c.w.startIndex)[0];assert(c.persist(()=>c.BoukenExplore.explore(c.w,next)));c.render();}parity(a,b);
  for(let i=0;i<Math.min(n*n,32);i++){
   for(const x of [a,b]){const c=x.c;if(c.BoukenExplore.canExplore(c.w,i))c.BoukenExplore.explore(c.w,i);c.w.revealed[(i+1)%(n*n)]=true;c.w.terrain[i]='T02';c.w.player={x:i%n,y:Math.floor(i/n)};c.w.partySnapshot=i%2?[1]:[];c.render();}parity(a,b);
  }
 }
});
test('real debug open-all, save reload, event choice/retry/extra item handlers and rollback retain state/DOM',async()=>{
 const a=await context(true),b=await context();
 for(const x of [a,b]){seedWorld(x,30,64);x.c.w.explored.fill(false);x.c.w.explored[x.c.w.startIndex]=true;x.c.w.allExploredRewardClaimed=false;delete x.c.w.explorationReward;x.c.render();x.c.verificationOpenAll();assert(x.c.w.explored.every(Boolean));x.c.visitModal.close();x.c.w.partyBuffsSnapshot=['F01','F02','D07','C03','B04','B07'].map(id=>({id,level:3}));x.c.render();}await Promise.resolve();parity(a,b);
 const indices=a.c.w.facility.flatMap((v,i)=>v?[i]:[]);
 for(const i of indices){for(const x of [a,b]){x.c.tap(i);x.c.visitActions.children[0].onclick();assert(x.c.w.eventChoices[i].requiresChoice);x.c.visitActions.children[0].onclick();x.c.visitModal.close();}await Promise.resolve();parity(a,b);}
 for(const x of [a,b]){const old=x.memory[x.c.BoukenSchema.key],prior=snapshot(x);x.c.failSave=true;assert(!x.c.persist(()=>{x.c.w.player.x=(x.c.w.player.x+1)%30;}));assert.equal(x.memory[x.c.BoukenSchema.key],old);assert.deepEqual(snapshot(x),prior);x.c.failSave=false;x.c.save=x.c.BoukenSave.load();x.c.w=x.c.save.world;x.c.render();}parity(a,b);
});
test('real robot controller + page route renderer: preview, movement, visited dialog wait, stop/arrival and replacement of route cells',async()=>{
 const a=await context(true),b=await context();
 for(const x of [a,b]){
  seedWorld(x,10,93);const c=x.c,tasks=[];c.w.player={x:0,y:0};c.render();
  c.robot=c.BoukenAutoDrive.create({world:()=>c.w,tap:i=>c.tap(i,true),busy:()=>!!c.domBusy||c.visitModal.open,changed:o=>{c.robotDriving=o.active;c.robotRoute=o.route;c.renderRobotRoute();const marker=c.map.children[c.playerIndex()].querySelector('.player-portrait');if(marker)marker.replaceWith(c.playerPortrait());},discovered:async()=>false,arrived:()=>c.arrived=true,blocked:()=>{throw Error('blocked');},schedule:fn=>{tasks.push(fn);return fn;},cancel:fn=>{const i=tasks.indexOf(fn);if(i>=0)tasks.splice(i,1);}});
  x.tasks=tasks;c.robot.prepare(3);assert(c.map.querySelectorAll('.robot-route-mark').length);c.robot.depart();
 }
 // A normal page render during robot state changes must not retain obsolete labels/overlays.
 for(let step=0;step<12;step++){
  for(const x of [a,b]){const c=x.c;if(c.visitModal.open)c.visitModal.close();const task=x.tasks.shift();task?.();c.render();}await Promise.resolve();assert.equal(tree(a),tree(b));
 }
 for(const x of [a,b]){x.c.robot.stop();x.c.render();assert.equal(x.c.map.querySelectorAll('.robot-route-mark').length,0);assert(!x.c.map.querySelectorAll('[data-robot-label]').length);assert(x.c.arrived);}
 assert.equal(tree(a),tree(b));
 // Cancel a fresh preview and interrupt an active run before completion.
 for(const x of [a,b]){x.c.robot.prepare(9);x.c.robot.stop();x.c.render();assert.equal(x.c.map.querySelectorAll('.robot-route-mark').length,0);x.c.robot.prepare(9);x.c.robot.depart();x.tasks.shift()?.();x.c.robot.stop();x.c.render();assert.equal(x.c.map.querySelectorAll('.robot-route-mark').length,0);x.c.robot.prepare(9);x.c.robot.depart();if(x===a)x.c.robot.stop();seedWorld(x,10,94);assert.equal(x.c.robot.active,false);assert.equal(x.c.map.querySelectorAll('.robot-route-mark').length,0);}
});
test('render exceptions do not mark old cell as successfully cached',async()=>{
 const x=await context();seedWorld(x,10,11);const c=x.c,original=c.BoukenTileImages.draw;c.w.terrain[0]=c.w.terrain[0]==='T01'?'T02':'T01';const old=c.map.children[0];c.BoukenTileImages.draw=()=>{throw Error('draw failed');};assert.throws(()=>c.render(),/draw failed/);assert.equal(c.map.children[0],old);c.BoukenTileImages.draw=original;x.reset();c.render();assert.equal(x.dom.counts.mapTileDraws,1);assert.notEqual(c.map.children[0],old);
});
test('map taps replace a preview without movement/save/quiz; old overlays vanish; limits, cancel and active lock remain',async()=>{
 for(const limit of [3,6,Infinity]){
  const x=await context();seedWorld(x,10,101);const c=x.c,tasks=[];c.w.player={x:0,y:0};c.w.facility.fill(null);c.render();
  c.robot=c.BoukenAutoDrive.create({world:()=>c.w,maxSteps:()=>limit,tap:i=>c.tap(i,true),busy:()=>c.visitModal.open,changed:o=>{c.robotDriving=o.active;c.robotRoute=o.route;c.renderRobotRoute();},discovered:async()=>false,arrived(){},blocked:()=>assert.fail('blocked'),schedule:fn=>{tasks.push(fn);return fn;},cancel:fn=>{const i=tasks.indexOf(fn);if(i>=0)tasks.splice(i,1);}});
  let questions=0;c.ask=()=>questions++;
  c.robot.prepare(99);const prior=snapshot(x),stored=JSON.stringify(x.memory),oldRoute=c.robotRoute.map(e=>e.index);
  c.tap(9);assert(c.robot.previewing);assert(!c.robot.active);assert.equal(c.robotRoute.at(-1).index,Math.min(9,limit));assert.equal(c.robotRoute.length,Math.min(9,limit));assert.deepEqual(snapshot(x),prior);assert.equal(JSON.stringify(x.memory),stored);assert.equal(tasks.length,0);assert.equal(questions,0);
  for(const i of oldRoute)if(!c.robotRoute.some(e=>e.index===i))assert(!c.map.children[i].querySelector('.robot-route-mark'));
  // Even adjacent unexplored destinations keep the confirmation until explicit departure.
  c.w.explored[1]=false;const before=snapshot(x);c.tap(1);assert(c.robot.previewing);assert.equal(c.robotRoute.length,1);assert.equal(c.robotRoute[0].index,1);assert.equal(questions,0);assert.deepEqual(snapshot(x),before);
  // Tapping the current location clears the zero-length preview without moving or saving.
  c.tap(0);assert(!c.robot.previewing);assert.equal(c.map.querySelectorAll('.robot-route-mark').length,0);assert.equal(JSON.stringify(x.memory),stored);
  c.w.explored[1]=true;c.robot.prepare(99);c.tap(9);assert(c.robot.depart());assert(c.robot.active);const route=JSON.stringify(c.robotRoute);c.tap(90);assert.equal(JSON.stringify(c.robotRoute),route);c.robot.stop();assert.equal(c.map.querySelectorAll('.robot-route-mark').length,0);
 }
});
