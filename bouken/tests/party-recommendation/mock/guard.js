// Deny persistence in this document only. Never read or mutate the origin's actual data.
window.PartyMockGuard=(()=>{const attempts=[];for(const name of ['localStorage','sessionStorage','indexedDB']){Object.defineProperty(window,name,{configurable:false,get(){attempts.push(name);throw Error('操作モックでは保存領域を使えません：'+name);}});}return Object.freeze({attempts:()=>[...attempts]});})();
