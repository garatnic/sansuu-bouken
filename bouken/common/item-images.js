// One sheet and one initialization promise per document; drawing never requests images.
window.BoukenItemImages=(()=>{
 const url=new URL('../assets/sheets/museum.png',document.currentScript.src).href;
 let pending,image,ready=false;
 function init(){return pending||(pending=new Promise(resolve=>{
  image=new Image();image.onload=()=>{ready=image.naturalWidth===2600&&image.naturalHeight===3120;resolve(ready);};image.onerror=()=>resolve(false);image.src=url;
 }));}
 function picture(id){
  const fallback=()=>{const span=document.createElement('span');span.textContent='🎁';span.setAttribute('aria-hidden','true');return span;};
  const n=Number(id);if(!ready||!Number.isInteger(n)||n<1||n>480)return fallback();
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;canvas.className='item-image';canvas.setAttribute('aria-hidden','true');
  const ctx=canvas.getContext('2d');if(!ctx)return fallback();
  ctx.imageSmoothingEnabled=false;const index=n-1;ctx.drawImage(image,(index%20)*130+1,Math.floor(index/20)*130+1,128,128,0,0,128,128);return canvas;
 }
 return Object.freeze({init,picture});
})();
