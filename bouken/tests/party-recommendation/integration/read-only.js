'use strict';
// No backend getter is touched until the user presses the explicit read button.
(()=>{const reads=[],blocked=[];let native;
 try{native=Object.getOwnPropertyDescriptor(window,'localStorage');}catch(e){}
 const reject=name=>{blocked.push(name);throw Error('検証画面では保存できません');};
 Object.defineProperty(window,'localStorage',{configurable:false,get(){return Object.freeze({getItem:key=>reject('direct getItem'),setItem:()=>reject('setItem'),removeItem:()=>reject('removeItem'),clear:()=>reject('clear')});}});
 for(const name of ['sessionStorage','indexedDB'])Object.defineProperty(window,name,{configurable:false,get:()=>reject(name)});
 window.PartyReadOnly=Object.freeze({read(){const storage=native?.get?.call(window);if(!storage)throw Error('セーブ読込を利用できません');reads.push('bouken.save.v1');return storage.getItem('bouken.save.v1');},diagnostics:()=>({reads:[...reads],blocked:[...blocked]})});
})();
