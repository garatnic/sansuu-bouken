// One sheet and one initialization promise per document. Drawing never requests images.
window.BoukenCharacterImages=(()=>{
 const url=new URL('../assets/sheets/character_sheet.png',document.currentScript.src).href;
 let pending,image,ready=false;
 function init(){return pending||(pending=new Promise(resolve=>{
  image=new Image();image.onload=()=>{ready=image.naturalWidth===3840&&image.naturalHeight===3968;resolve(ready);};image.onerror=()=>resolve(false);image.src=url;
 }));}
 function picture(id){
  const n=Number(id);if(!ready||!Number.isInteger(n)||n<1||n>927){const span=document.createElement('span');span.textContent='👤';span.setAttribute('aria-hidden','true');return span;}
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;canvas.className='character-image';canvas.setAttribute('aria-hidden','true');
  const ctx=canvas.getContext('2d');if(!ctx){const span=document.createElement('span');span.textContent='👤';span.setAttribute('aria-hidden','true');return span;}
  ctx.imageSmoothingEnabled=false;const index=n-1;ctx.drawImage(image,(index%30)*128,Math.floor(index/30)*128,128,128,0,0,128,128);return canvas;
 }
 return Object.freeze({init,picture});
})();
