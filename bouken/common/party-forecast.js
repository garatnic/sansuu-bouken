// Current-party forecast uses the existing isolated comparison Worker. No save API here.
window.BoukenPartyForecast=(()=>{
 const workerURL=new URL('../tests/party-recommendation/integration/worker.js?rev=robot85',document.currentScript.src).href;
 function create({graph,status,note,makeWorker=()=>new Worker(workerURL)}){
  let worker=null,ready=false,active=null,pending=null,sequence=0,disposed=false;
  const clear=message=>{graph.replaceChildren();graph.hidden=true;status.textContent=message;note.textContent='';};
  function dispatch(){if(!ready||active||!pending||disposed)return;active=pending;pending=null;worker.postMessage({type:'input',requestId:active.id,raw:active.raw});}
  function stop(){const old=worker;worker=null;ready=false;active=null;old?.terminate();}
  function start(){
   const instance=makeWorker();worker=instance;
   instance.onmessage=event=>{
    if(disposed||worker!==instance)return;
    const m=event.data;
    if(m.type==='init'){ready=true;dispatch();return;}
    if(m.type==='error'&&!ready){stop();pending=null;clear('予想を読み込めませんでした。'+m.message);return;}
    if(!active||m.requestId!==active.id)return;
    if(m.type==='input'){
     if(active.id!==sequence){active=null;dispatch();return;}
     if(!m.input.eligible){active=null;clear('冒険を進めると、予想が見られるよ。');dispatch();return;}
     worker.postMessage({type:'evaluate',requestId:active.id,raw:active.raw,current:active.party,config:{size:10}});return;
    }
    if(!['comparison','error'].includes(m.type))return;
    const job=active;active=null;
    if(job.id===sequence){
     if(m.type==='error')clear('予想を表示できませんでした。'+m.message);
     else if(JSON.stringify(m.comparison.candidate.party)===JSON.stringify(job.party.filter(id=>id!==null))){
      PartyRadar.renderSingle(graph,m.comparison.candidate.metrics);graph.hidden=false;status.textContent='';
      const a=m.comparison.assumptions;note.textContent=(a.emptyCharacters?'仲間コンプ済み：評価だけ未収集と仮定。 ':'')+(a.emptyItems?'お宝コンプ済み：評価だけ未収集と仮定。 ':'');
     }else clear('編成が変わりました。もう一度ためしてください。');
    }
    dispatch();
   };
   instance.onerror=()=>{if(disposed||worker!==instance)return;stop();pending=null;clear('予想を読み込めませんでした。');};
   instance.postMessage({type:'init'});
  }
  function update(save,party){
   if(disposed)return;sequence++;clear('予想を調べています…');
   const copy=JSON.parse(JSON.stringify(save));copy.party=[...party];
   pending={id:sequence,party:[...party],raw:JSON.stringify(copy)};
   try{if(!worker)start();else dispatch();}catch{stop();pending=null;clear('予想を読み込めませんでした。');}
  }
  function dispose(){if(disposed)return;disposed=true;sequence++;pending=null;stop();}
  window.addEventListener('pagehide',dispose,{once:true});
  return Object.freeze({update,dispose});
 }
 return Object.freeze({create});
})();
