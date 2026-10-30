// Size/departure buttons and disposable terrain samples. Never receives or saves a game save.
window.BoukenWorldSizePicker=(()=>{
 const workerURL=new URL('world-preview-worker.js?v=96',document.currentScript.src);
 const colors={T01:'#a3d77d',T02:'#459763',T03:'#a7a9a4',T04:'#e6c979',T05:'#5da4db',T06:'#e8f5f9',T07:'#9a8bba'};
 const later=()=>new Promise(resolve=>{if(typeof requestIdleCallback==='function')requestIdleCallback(resolve,{timeout:500});else setTimeout(resolve,0);});
 const afterPaint=()=>new Promise(resolve=>{if(typeof requestAnimationFrame==='function')requestAnimationFrame(()=>setTimeout(resolve,0));else setTimeout(resolve,0);});
 function create(root,{onChoose=()=>{}}={}){
  const options=root.querySelector('.size-options');let entries=[],value='',disabled=true,worker=null,generation=0,ready=Promise.resolve(),complete=null;
  function cancel(){generation++;worker?.terminate();worker=null;complete?.();complete=null;}
  function choose(size){if(disabled)return;value=String(size);refresh();return onChoose(value);}
  function refresh(){root.disabled=disabled;for(const e of entries)if(e.button){e.button.disabled=disabled;e.button.setAttribute('aria-pressed',String(value===String(e.size)));}}
  function fail(e){if(!e.canvas)return;e.canvas.hidden=true;e.note.hidden=false;e.note.textContent='見本なし';}
  function draw(e,terrain){
   if(!Array.isArray(terrain)||terrain.length!==e.size*e.size)throw Error('プレビューのサイズが不正です');
   const ctx=e.canvas.getContext('2d');if(!ctx)throw Error('Canvasを使えません');
   e.canvas.width=e.canvas.height=e.size;ctx.imageSmoothingEnabled=false;
   terrain.forEach((id,i)=>{if(!colors[id])throw Error('地形が不正です');ctx.fillStyle=colors[id];ctx.fillRect(i%e.size,Math.floor(i/e.size),1,1);});
   e.canvas.hidden=false;e.note.hidden=true;
  }
  const api={
   configure(counts,{fixed=false,locked=false}={}){
    cancel();options.replaceChildren();entries=[];value=String(counts[0]?.width||'');
    for(const c of counts){
     if(fixed){const label=document.createElement(locked?'p':'button');label.className='fixed-world-size';label.textContent=c.width+'×'+c.height+(locked?'（ぼうけん中）':'（チュートリアル）');if(!locked){label.type='button';label.onclick=()=>choose(c.width);entries.push({size:c.width,button:label});}options.append(label);continue;}
     const button=document.createElement('button');button.type='button';button.className='world-size-choice';button.setAttribute('aria-label',c.width+'×'+c.height+'のワールドへ出発');
     const title=document.createElement('strong');title.textContent=c.width+'×'+c.height;
     const stage=document.createElement('span');stage.className='size-preview-stage';const canvas=document.createElement('canvas');canvas.className='size-preview';canvas.hidden=true;canvas.style.width=(c.width/30*100)+'%';canvas.setAttribute('aria-hidden','true');
     const note=document.createElement('span');note.className='size-preview-note';note.textContent='見本を準備中';note.setAttribute('aria-hidden','true');stage.append(canvas,note);
     button.append(title,stage);
     const e={size:c.width,button,canvas,note};entries.push(e);button.onclick=()=>choose(c.width);options.append(button);
    }refresh();
   },
   preview({terrains,facilities,counts,buffs}){
    cancel();const token=generation;
    // Masters and computed buffs only: never pass the save/world/inventories into a Worker.
    const input={terrains,facilities,counts,buffs:buffs.map(s=>({...s})),sizes:entries.map(e=>e.size)};
    ready=new Promise(resolve=>{complete=resolve;});
    function finish(){if(token!==generation)return;worker?.terminate();worker=null;complete?.();complete=null;}
    async function fallback(){
     for(const e of entries){await later();if(token!==generation)return;try{const w=BoukenWorldGen.generate(e.size,e.size,input.terrains,input.facilities,input.counts,input.buffs);draw(e,w.terrain);}catch{fail(e);}}
     finish();
    }
    (async()=>{await afterPaint();if(token!==generation)return;
     if(typeof Worker==='function'){
      try{worker=new Worker(workerURL);worker.onmessage=({data})=>{if(token!==generation)return;if(data.done){finish();return;}const e=entries.find(e=>e.size===data.size);if(e){try{if(data.error)throw Error(data.error);draw(e,data.terrain);}catch{fail(e);}}};worker.onerror=()=>{if(token!==generation)return;worker?.terminate();worker=null;void fallback();};worker.postMessage(input);return;}catch{worker?.terminate();worker=null;}
     }await fallback();
    })().catch(()=>{if(token===generation){for(const e of entries)fail(e);finish();}});
    return ready;
   },
   previewFailed(){cancel();for(const e of entries)fail(e);},
   destroy:cancel,
   get ready(){return ready;},get value(){return value;},get disabled(){return disabled;},set disabled(v){disabled=!!v;refresh();}
  };
  return api;
 }
 return Object.freeze({create});
})();
