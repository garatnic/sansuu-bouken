// Display only. Never rewrite masters, save values, IDs, URLs, or user input.
window.BoukenHiragana=(()=>{
 'use strict';
 const kanji=/[\u3400-\u9fff\uf900-\ufaff々〆]/;
 const trie=new Map(),cache=new Map();
 for(const [word,reading] of Object.entries(window.BoukenHiraganaReadings)){
  let node=trie;for(const c of word){if(!node.has(c))node.set(c,new Map());node=node.get(c);}node.reading=reading;
 }
 function text(value){
  const source=String(value??'');if(!kanji.test(source))return source;
  if(cache.has(source))return cache.get(source);
  let output='';
  for(let i=0;i<source.length;){let node=trie,last=null,end=i;
   for(let j=i;j<source.length&&node.has(source[j]);j++){node=node.get(source[j]);if(node.reading!==undefined){last=node.reading;end=j+1;}}
   if(last!==null){output+=last;i=end;}else{output+=source[i++];}
  }
  if(cache.size>=4000)cache.clear();cache.set(source,output);return output;
 }
 function matches(value,query){const q=String(query).toLowerCase();return String(value).toLowerCase().includes(q)||text(value).toLowerCase().includes(text(q).toLowerCase());}
 const attributes=['title','alt','placeholder','aria-label','aria-valuetext'];
 function ignored(el){return !el||!!el.closest('script,style,textarea,[contenteditable]:not([contenteditable="false"])');}
 function convertNode(node){
  if(node.nodeType===3){if(ignored(node.parentElement))return;const before=node.nodeValue,after=text(before);if(after!==before){
   // An option's implicit value is its text; freeze it before changing the label.
   const option=node.parentElement.closest('option');if(option&&!option.hasAttribute('value'))option.setAttribute('value',option.textContent);
   node.nodeValue=after;
  }return;}
  if(node.nodeType!==1||ignored(node))return;
  for(const name of attributes){if(node.hasAttribute(name)){const before=node.getAttribute(name),after=text(before);if(before!==after)node.setAttribute(name,after);}}
  if(node.tagName==='INPUT'&&['button','submit','reset'].includes(node.type)){const after=text(node.value);if(after!==node.value)node.value=after;}
  for(const child of node.childNodes)convertNode(child);
 }
 if(typeof document!=='undefined'&&typeof MutationObserver!=='undefined'){
  const observer=new MutationObserver(records=>{
   const roots=new Set();for(const r of records){if(r.type==='childList'){for(const n of r.addedNodes)roots.add(n);}else roots.add(r.target);}
   for(const n of roots){if(!n.isConnected)continue;let p=n.parentNode,covered=false;while(p){if(roots.has(p)){covered=true;break;}p=p.parentNode;}if(!covered)convertNode(n);}
  });
  observer.observe(document,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:[...attributes,'value']});
  if(document.documentElement)convertNode(document.documentElement);
 }
 return Object.freeze({text,matches,refresh:convertNode});
})();
