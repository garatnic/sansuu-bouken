// じどううんてんロボ: route and sequencing only; game actions stay in world.html.
window.BoukenAutoDrive=Object.freeze({
 route(sx,sy,tx,ty,width,height){
  if(![sx,sy,tx,ty,width,height].every(Number.isInteger)||width<1||height<1||[sx,tx].some(x=>x<0||x>=width)||[sy,ty].some(y=>y<0||y>=height))throw Error('目的地がマップの外です');
  const dx=Math.abs(tx-sx),dy=Math.abs(ty-sy),xs=Math.sign(tx-sx),ys=Math.sign(ty-sy),out=[];let x=sx,y=sy;
  while(x!==tx||y!==ty){
   // Choose the next cardinal step nearest the ideal line. Horizontal wins ties.
   const horizontal=x!==tx&&(y===ty||Math.abs((Math.abs(x-sx)+1)*dy-Math.abs(y-sy)*dx)<=Math.abs(Math.abs(x-sx)*dy-(Math.abs(y-sy)+1)*dx));
   if(horizontal)x+=xs;else y+=ys;out.push(y*width+x);
  }return out;
 },
 create({world,tap,busy,changed,discovered,arrived,blocked,schedule=fn=>setTimeout(fn,100),cancel=clearTimeout}){
  let route=[],cursor=0,active=false,waiting=false,timer=null,before=null,generation=0;
  const visibleFacilities=w=>w.facility.map((f,i)=>!!f&&!!(w.explored[i]||w.revealed[i]));
  const remaining=()=>route.slice(cursor-(waiting?1:0)).filter(i=>!world().explored[i]).length;
  function update(){changed({active,remaining:remaining()});}
  function stop(){generation++;if(timer!==null)cancel(timer);timer=null;active=false;waiting=false;route=[];cursor=0;before=null;update();}
  function queue(){if(active&&timer===null){const token=generation;timer=schedule(()=>{timer=null;if(token===generation)tick();});}}
  function complete(){if(!active||!waiting)return;waiting=false;const w=world(),after=visibleFacilities(w),found=[];after.forEach((v,i)=>{if(v&&!before[i])found.push(i);});before=null;update();
   // Defer the prompt until existing reward/event/tutorial dialogs have closed.
   if(found.length)discoveries.push(...found);queue();
  }
  let discoveries=[];
  function tick(){if(!active||waiting)return;if(busy()){queue();return;}
   if(discoveries.length){const found=discoveries.splice(0),token=generation;waiting=true;
    Promise.resolve(discovered(found)).then(shouldStop=>{if(token!==generation||!active)return;waiting=false;if(shouldStop)stop();else queue();}).catch(e=>{if(token===generation){stop();blocked(e);}});return;}
   if(cursor===route.length){stop();arrived();return;}
   const w=world(),i=route[cursor],from=w.player.y*w.width+w.player.x;
   if(Math.abs(i%w.width-from%w.width)+Math.abs(Math.floor(i/w.width)-Math.floor(from/w.width))!==1){stop();blocked();return;}
   before=visibleFacilities(w);cursor++;waiting=true;update();
   try{const result=tap(i);if(!active)return;if(result==='moved')complete();else if(result!=='question'){stop();blocked();}}catch(e){stop();blocked(e);}
  }
  return Object.freeze({start(target){stop();discoveries=[];const w=world();route=window.BoukenAutoDrive.route(w.player.x,w.player.y,target%w.width,Math.floor(target/w.width),w.width,w.height);active=true;update();tick();},stop,complete,get active(){return active;},get remaining(){return remaining();}});
 }
});
