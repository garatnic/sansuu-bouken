'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),R=require('./radar.js');
const metrics={opened:32.125,newItems:.8,newCharacters:.6,visited:2.8},over={opened:80,newItems:4,newCharacters:5,visited:9};
assert.deepEqual(R.RADAR_MAX,{opened:55,newItems:1.5,newCharacters:1.5,visited:5});
assert.deepEqual(R.points({opened:0,newItems:0,newCharacters:0,visited:0}),[[120,120],[120,120],[120,120],[120,120]]);
assert.deepEqual(R.points(over),[[16,16],[224,16],[224,224],[16,224]]);assert.equal(R.ratio(-1,'opened'),0);assert.equal(R.format(32.125),'32.13');
class E{constructor(tag,doc){this.tag=tag;this.ownerDocument=doc;this.children=[];this.attrs={};}setAttribute(k,v){this.attrs[k]=v;}append(...children){this.children.push(...children);}replaceChildren(...children){this.children=children;}}
const doc={createElement:tag=>new E(tag,doc),createElementNS:(_,tag)=>new E(tag,doc),createTextNode:text=>({textContent:text})},host=new E('div',doc),before=JSON.stringify([metrics,over]);
R.render(host,metrics,over);const all=e=>[e,...(e.children||[]).flatMap(all)],nodes=all(host);assert.equal(nodes.filter(x=>x.tag==='rect').length,4);assert.equal(nodes.filter(x=>x.tag==='polygon').length,2);assert.equal(nodes.filter(x=>x.tag==='circle').length,8);assert.equal(nodes.filter(x=>x.className?.startsWith('radar-value ')).length,8);assert.ok(nodes.some(x=>x.textContent==='80.00マス'));assert.ok(nodes.some(x=>x.textContent==='4.00種類'));assert.equal(JSON.stringify([metrics,over]),before);
R.render(host,over,metrics);assert.equal(host.children.length,2);assert.equal(all(host).filter(x=>x.tag==='polygon').length,2);
const app=fs.readFileSync(__dirname+'/app.js','utf8'),html=fs.readFileSync(__dirname+'/index.html','utf8');assert.ok(!html.includes('id="evaluate"'));assert.ok(!app.includes("$('evaluate')"));assert.ok(!html.includes('heartbeat'));assert.ok(!app.includes('比較完了 '));assert.ok(html.indexOf('id="back"')<html.indexOf('</header>'));assert.match(app,/if\(r.party\)send\(\{type:'evaluate'/);assert.match(app,/if\(input\?\.eligible\)send\(\{type:'evaluate'/);
console.log('PASS radar axes, fixed maxima, clamping/raw labels, 4 grids/2 polygons/8 points/8 badges, replace/update, immutable input, removed UI, automatic evaluation flows');
