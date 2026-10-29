// Structural DOM adapter. No layout/paint/raster/disk I/O: never treat timings as browser timings.
module.exports=function DOM(){
 const counts={};const inc=k=>counts[k]=(counts[k]||0)+1;
 class Element{
  constructor(tag){this.tagName=tag;this.children=[];this.attributes={};this.style={};this.dataset={};this.listeners={};this.hidden=false;this.className='';this._text='';this.classList={toggle:(n,force)=>{const s=new Set(this.className.split(' ').filter(Boolean));const v=force??!s.has(n);v?s.add(n):s.delete(n);this.className=[...s].join(' ');return v;},add:(n)=>this.classList.toggle(n,true),remove:(n)=>this.classList.toggle(n,false)};}
  append(...nodes){for(const n of nodes){if(n.parentNode)n.remove();n.parentNode=this;this.children.push(n);inc('append');}}
  replaceChildren(...nodes){for(const n of this.children)n.parentNode=null;this.children=[];this._text='';this.append(...nodes);inc('replaceChildren');}
  replaceWith(n){const p=this.parentNode;if(!p)return;const i=p.children.indexOf(this);p.children[i]=n;n.parentNode=p;this.parentNode=null;inc('replaceWith');}
  remove(){const p=this.parentNode;if(p){p.children.splice(p.children.indexOf(this),1);this.parentNode=null;}}
  set textContent(v){this._text=String(v);for(const n of this.children)n.parentNode=null;this.children=[];}
  get textContent(){return this._text+this.children.map(n=>n.textContent).join('');}
  setAttribute(k,v){this.attributes[k]=String(v);}getAttribute(k){return this.attributes[k]??null;}
  addEventListener(k,v){this.listeners[k]=v;}
  getContext(){return {drawImage(){inc('drawImage');},beginPath(){},arc(){},clip(){}};}
  querySelector(s){return this.querySelectorAll(s)[0]||null;}
  querySelectorAll(s){const out=[];for(const c of this.children){if(s.startsWith('#')?c.id===s.slice(1):s.startsWith('.')?c.className.split(' ').includes(s.slice(1)):s==='[data-robot-label]'?c.dataset.robotLabel!==undefined:c.tagName===s)out.push(c);out.push(...c.querySelectorAll(s));}return out;}
  showModal(){this.open=true;}close(){this.open=false;}getBoundingClientRect(){return {left:0,right:44,top:0,bottom:44,width:44,height:44};}
 }
 const ids={};const make=tag=>{inc('create:'+tag);return new Element(tag);};
 const document={createElement:make,getElementById:id=>ids[id]||(ids[id]=make('div')),querySelector:s=>s==='.progress'?document.getElementById('progress'):s==='dialog[open]'?Object.values(ids).find(n=>n.open)||null:null,currentScript:{src:'http://independent.test/bouken/common/tile-images.js'},hidden:false};
 const modal=document.getElementById('visitModal');for(const id of ['visitTitle','visitDescription','visitArtwork','visitActions']){const n=document.getElementById(id);n.id=id;modal.append(n);}
 return {document,counts,reset(){for(const k of Object.keys(counts))delete counts[k];},tree(n){return {tag:n.tagName,cls:n.className,text:n._text,attributes:n.attributes,style:n.style,children:n.children.map(x=>this.tree(x))};}};
};
