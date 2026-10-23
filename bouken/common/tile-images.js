// Shared sheet objects and a single cached initialization promise per document.
window.BoukenTileImages=(()=>{
 const base=new URL('../assets/sheets/',document.currentScript.src);
 const sheets={terrain:{file:'field_tiles.png',prefix:'T',count:7},facility:{file:'event_tiles.png',prefix:'F',count:8}};
 let pending;
 function load(sheet){return new Promise(resolve=>{
  const image=new Image();sheet.image=image;
  image.onload=()=>{sheet.ready=image.naturalWidth===sheet.count*64&&image.naturalHeight===64;resolve();};
  image.onerror=()=>{sheet.ready=false;resolve();};
  image.src=new URL(sheet.file,base).href;
 });}
 function index(sheet,id){if(typeof id!=='string'||!new RegExp('^'+sheet.prefix+'0[1-9]$').test(id))return -1;const n=Number(id.slice(1))-1;return n<sheet.count?n:-1;}
 return Object.freeze({
  // Cache failures too: redraws must never create retries or network requests.
  init(){return pending||(pending=Promise.all(Object.values(sheets).map(load)));},
  draw(cell,terrainId,facilityId,fallback){
   const terrain=sheets.terrain,facility=sheets.facility,ti=index(terrain,terrainId),fi=index(facility,facilityId);
   const hasTerrain=terrain.ready&&ti>=0,hasFacility=facility.ready&&fi>=0;
   if(!hasTerrain&&!hasFacility){cell.textContent=fallback;return;}
   const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;canvas.className='tile-image';canvas.setAttribute('aria-hidden','true');
   const ctx=canvas.getContext('2d');if(!ctx){cell.textContent=fallback;return;}
   ctx.imageSmoothingEnabled=false;
   if(hasTerrain)ctx.drawImage(terrain.image,ti*64,0,64,64,0,0,64,64);
   if(hasFacility)ctx.drawImage(facility.image,fi*64,0,64,64,0,0,64,64);
   cell.append(canvas);
   if(facilityId&&!hasFacility){const label=document.createElement('span');label.className='tile-fallback';label.textContent=fallback;cell.append(label);}
  }
 });
})();
