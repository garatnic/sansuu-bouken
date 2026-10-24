const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..');
(async()=>{
 for(const [file,api,count,columns,cell,inset,width,height] of [
  ['item-images.js','BoukenItemImages',480,20,130,1,2600,3120],
  ['character-images.js','BoukenCharacterImages',927,30,128,0,3840,3968]
 ])for(const success of [true,false]){
  let requests=0,draws=[],images=[];
  class Image{constructor(){images.push(this)}set src(v){requests++;this.naturalWidth=width;this.naturalHeight=height;queueMicrotask(()=>success?this.onload():this.onerror())}}
  const ctx={window:{},URL,Image,document:{currentScript:{src:'https://example.com/common/'+file},createElement:tag=>({tag,setAttribute(){},getContext:()=>({drawImage:(...args)=>draws.push(args)})})}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'common',file),'utf8'),ctx);const source=ctx.window[api];const pending=source.init();assert.equal(source.init(),pending);assert.equal(await pending,success);
  for(let id=1;id<=count;id++){
   const node=source.picture(id);assert.equal(node.tag,success?'canvas':'span');
   if(success){const a=draws.at(-1),i=id-1;assert.deepEqual(a.slice(1),[(i%columns)*cell+inset,Math.floor(i/columns)*cell+inset,128,128,0,0,128,128]);}
  }
  for(let i=0;i<1000;i++){source.init();source.picture(i%count+1)}assert.equal(requests,1);assert.equal(images.length,1);
  for(const id of [0,count+1,NaN,1.5])assert.equal(source.picture(id).tag,'span');
 }
 const html=fs.readFileSync(path.join(root,'world.html'),'utf8');
 const notify=html.match(/function notify\(message\)\{[^\n]+/)[0];let delay;
 const classes={remove(){},add(){}};
 vm.runInNewContext(notify+";notify('テスト');",{toast:{classList:classes},toastTimer:undefined,clearTimeout(){},setTimeout(fn,ms){delay=ms}});assert.equal(delay,4000);
 const sense=html.slice(html.indexOf(' function positionSense()'),html.indexOf('\n mapScroll.addEventListener'));
 let onLeft=false,p={left:140,right:190,top:50,bottom:100,width:50,height:50};
 const panel={hidden:false,classList:{remove(){},toggle(n,v){onLeft=v}},getBoundingClientRect:()=>({left:240,right:340,top:0,bottom:100})};
 const context={document:{getElementById:()=>panel},map:{children:[{getBoundingClientRect:()=>p}]},mapScroll:{getBoundingClientRect:()=>({left:0,right:400,top:0,bottom:400})},playerIndex:()=>0};vm.createContext(context);vm.runInContext(sense,context);context.positionSense();assert(onLeft,'retreats one tile before overlapping');p={...p,left:50,right:100};context.positionSense();assert(!onLeft,'returns when clear');p={...p,left:450,right:500};context.positionSense();assert(!onLeft,'offscreen player does not trigger retreat');
 // Run the actual startup path: first render and layout must precede background loads.
 const frames=[],sequence=[];
 const preload=html.slice(html.indexOf(' function preloadEventImages()'),html.indexOf(' function eventPicture(type,id)'));
 const boot=html.slice(html.indexOf(' if(!Number.isInteger(w.lastExploredIndex))'),html.indexOf(' }catch(e){info.textContent='));
 const startup={w:{lastExploredIndex:0},BoukenBuffs:{level:()=>0},render:()=>sequence.push('render'),adjustMapHeight:()=>sequence.push('layout'),centerMapOnPlayer:()=>sequence.push('center'),requestAnimationFrame:fn=>frames.push(fn),BoukenCharacterImages:{init:()=>{sequence.push('characters');return new Promise(()=>{})}},BoukenItemImages:{init:()=>{sequence.push('items');return new Promise(()=>{})}}};
 vm.createContext(startup);vm.runInContext(preload+boot,startup);assert.deepEqual(sequence,['render']);assert.equal(frames.length,1);frames.shift()();assert.deepEqual(sequence,['render','layout','center']);assert.equal(frames.length,1);frames.shift()();assert.deepEqual(sequence,['render','layout','center','characters','items']);assert.equal(frames.length,0);
 console.log('PASS: all 1407 image coordinates, success/failure and 1000 redraws each with one request, invalid IDs, 4-second timer, early retreat boundaries');
})().catch(e=>{console.error(e);process.exitCode=1});
