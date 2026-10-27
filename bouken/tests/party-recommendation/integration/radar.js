(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.PartyRadar=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const RADAR_MAX=Object.freeze({opened:55,newItems:1.5,newCharacters:1.5,visited:5});
const fields=[['opened','開拓','マス','top-left'],['newItems','お宝','種類','top-right'],['newCharacters','仲間','種類','bottom-right'],['visited','探索','施設','bottom-left']];
const corners=[[-1,-1],[1,-1],[1,1],[-1,1]],NS='http://www.w3.org/2000/svg';
function ratio(value,key){return Math.min(1,Math.max(0,value/RADAR_MAX[key]));}
function points(metrics){return fields.map(([key],i)=>{const v=ratio(metrics[key],key);return [120+corners[i][0]*104*v,120+corners[i][1]*104*v];});}
function format(value){return value.toFixed(1);}
function renderSeries(host,series,showLegend){const doc=host.ownerDocument,el=(tag,cls,text)=>{const e=doc.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;},svgEl=(tag,attrs)=>{const e=doc.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);return e;};
 const legend=el('div','radar-legend');for(const {cls,label}of series){const item=el('span',cls);const swatch=el('i','radar-swatch');swatch.setAttribute('aria-hidden','true');item.append(swatch,doc.createTextNode(label));legend.append(item);}
 const layout=el('div','radar-layout');
 for(const [key,name,unit,position]of fields){const label=el('div','radar-corner '+position);label.append(el('strong','',name));const values=el('div','radar-values');for(const {cls,metrics,label:party}of series){const badge=el('span','radar-value '+cls,format(metrics[key])+unit);badge.setAttribute('aria-label',party+'の'+name+' '+format(metrics[key])+unit);values.append(badge);}label.append(values);layout.append(label);}
 const svg=svgEl('svg',{viewBox:'0 0 240 240',class:'radar-svg',role:'img','aria-label':(showLegend?'4分野の比較。':'現在のパーティーの予想。')+'左上は開拓、右上はお宝、右下は仲間、左下は探索。中心0%、外周100%。'});
 for(const q of [.25,.5,.75,1]){svg.append(svgEl('rect',{x:120-104*q,y:120-104*q,width:208*q,height:208*q,fill:'none',stroke:q===1?'#819287':'#cfd9cf','stroke-width':q===1?1.5:1}));}
 for(const [x,y]of corners)svg.append(svgEl('line',{x1:120,y1:120,x2:120+x*104,y2:120+y*104,stroke:'#d6ded5'}));
 for(const {cls,metrics}of series){const ps=points(metrics);svg.append(svgEl('polygon',{points:ps.map(p=>p.join(',')).join(' '),class:'radar-shape '+cls}));for(const [cx,cy]of ps)svg.append(svgEl('circle',{cx,cy,r:3.5,class:'radar-dot '+cls}));}
 for(const q of [.25,.5,.75,1]){const text=svgEl('text',{x:124,y:120-104*q-3,class:'radar-percent'});text.textContent=q*100+'%';svg.append(text);}
 layout.append(svg);host.replaceChildren(...(showLegend?[legend,layout]:[layout]));
}
function render(host,baseline,candidate){renderSeries(host,[{cls:'current',label:'今のパーティー',metrics:baseline},{cls:'candidate',label:'新しいパーティー',metrics:candidate}],true);}
function renderSingle(host,metrics){renderSeries(host,[{cls:'current',label:'今のパーティー',metrics}],false);}
return {RADAR_MAX,fields,ratio,points,format,render,renderSingle};
});
