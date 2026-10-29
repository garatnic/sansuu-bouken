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
 create({world,tap,busy,changed,discovered,arrived,blocked,schedule=fn=>setTimeout(fn,100),cancel=clearTimeout,maxSteps=()=>Infinity}){
  let route=[],requestedSteps=0,cursor=0,completed=0,active=false,previewing=false,origin=null,waiting=false,timer=null,before=null,generation=0;
  const exploredFacilities=w=>w.facility.map((f,i)=>!!f&&!!w.explored[i]);
  const remaining=()=>route.slice(completed).filter(i=>!world().explored[i]).length;
  function update(){changed({active,previewing,remaining:remaining(),steps:route.length,truncated:requestedSteps>route.length,route:route.slice(completed).map((index,k)=>({index,step:completed+k+1,destination:completed+k===route.length-1}))});}
  function stop(){generation++;if(timer!==null)cancel(timer);timer=null;active=false;previewing=false;origin=null;waiting=false;route=[];requestedSteps=0;cursor=0;completed=0;before=null;discoveries=[];update();}
  function queue(){if(active&&timer===null){const token=generation;timer=schedule(()=>{timer=null;if(token===generation)tick();});}}
  function complete(){if(!active||!waiting||before===null)return;waiting=false;completed=cursor;const w=world(),after=exploredFacilities(w),found=[];after.forEach((v,i)=>{if(v&&!before[i])found.push(i);});before=null;update();
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
   before=exploredFacilities(w);cursor++;waiting=true;update();
   try{const result=tap(i);if(!active)return;if(result==='moved')complete();else if(result!=='question'){stop();blocked();}}catch(e){stop();blocked(e);}
  }
  return Object.freeze({
   prepare(target){stop();const w=world();route=window.BoukenAutoDrive.route(w.player.x,w.player.y,target%w.width,Math.floor(target/w.width),w.width,w.height);requestedSteps=route.length;const limit=maxSteps();if(!(limit>0)){route=[];return false;}route=route.slice(0,limit);if(!route.length)return false;origin={x:w.player.x,y:w.player.y,width:w.width,height:w.height};previewing=true;update();return true;},
   depart(){if(!previewing)return false;const w=world();if(route.length>maxSteps()||w.player.x!==origin.x||w.player.y!==origin.y||w.width!==origin.width||w.height!==origin.height){stop();blocked();return false;}previewing=false;active=true;update();tick();return true;},
   stop,complete,get active(){return active;},get previewing(){return previewing;},get remaining(){return remaining();}
  });
 }
});
