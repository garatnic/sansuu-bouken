(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.PartyUnlocks=factory();})(globalThis,function(){
'use strict';
const thresholds=Object.freeze({random:30,balanced:100,explore:170,treasure:200,companion:230,map:260});
function states(count){if(!Number.isSafeInteger(count)||count<0)throw Error('所有種類数が不正です');return Object.entries(thresholds).map(([mode,required])=>({mode,required,remaining:Math.max(0,required-count),unlocked:count>=required}));}
function allowed(count,mode){return states(count).some(x=>x.mode===mode&&x.unlocked);}
function newlyAvailable(previous,count){const now=states(count);if(previous===null||previous===undefined)return [];states(previous);return now.filter(x=>x.unlocked&&previous<x.required).map(x=>x.mode);}
return {thresholds,states,allowed,newlyAvailable};
});
