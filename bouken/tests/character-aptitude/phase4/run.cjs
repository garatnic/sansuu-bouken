'use strict';
const fs=require('node:fs'),path=require('node:path');
const E=require('./engine.cjs'),{sha,csv,BASE,json}=require('./plan.cjs');
const cfg=require('./config.json'),selection=require('./selection.json'),base=require('./initial-save.json');
function parseCSV(text){const rows=[];let row=[],value='',quoted=false;for(let i=0;i<text.length;i++){const ch=text[i];if(ch==='"'){if(quoted&&text[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}else if(ch===','&&!quoted){row.push(value);value='';}else if(ch==='\n'&&!quoted){row.push(value);rows.push(row);row=[];value='';}else value+=ch;}if(quoted||value||row.length)throw Error('Incomplete CSV');if(!rows.length)return [];const head=rows.shift();return rows.map(r=>{if(r.length!==head.length)throw Error('CSV column count');return Object.fromEntries(head.map((h,i)=>[h,r[i]]));});}
function read(file){return fs.existsSync(path.join(BASE,file))?parseCSV(fs.readFileSync(path.join(BASE,file),'utf8')):[];}
function write(file,rows){if(!rows.length)return;const headers=Object.keys(rows[0]);const text=csv([headers,...rows.map(r=>headers.map(h=>r[h]))]);fs.writeFileSync(path.join(BASE,file+'.tmp'),text);fs.renameSync(path.join(BASE,file+'.tmp'),path.join(BASE,file));}
function verifyGate(){E.checkSources(cfg);const gate=require('./pilot-results.json');if(!gate.passed||gate.configHash!==sha(fs.readFileSync(path.join(BASE,'config.json')))||gate.engineHash!==sha(fs.readFileSync(path.join(BASE,'engine.cjs'))))throw Error('Pilot gate missing/stale');}
function row(id,seed,m,extra={}){const s=selection.find(c=>c.id===id);return {id,name:s?.name||'',skills:s?.skills||[],...Object.fromEntries(Object.entries(s?.scores||{}).map(([k,v])=>['theory_'+k,v])),mapSize:cfg.size,budget:cfg.budget,accuracy:cfg.accuracy,initialCharacterCount:464,initialItemCount:240,seed,...extra,...m};}
function run(kind='main',limit=Infinity){verifyGate();const env=E.load(),file=kind==='main'?'adventures.csv':'support-adventures.csv',rows=read(file),prior=rows.length,started=performance.now();let groups=0;
 const manifestHash=sha(fs.readFileSync(path.join(BASE,'config.json')));
 for(const r of rows){if(r.inventoryHash!==cfg.inventoryHash||r.policyVersion!==cfg.policyVersion)throw Error('Stale checkpoint');}
 const specs=kind==='main'?selection:cfg.support;
 for(const spec of specs){
  const existing=rows.filter(r=>kind==='main'?Number(r.id)===spec.id:r.caseId===spec.caseId),expected=kind==='main'?100:300;
  if(existing.length===expected)continue;if(existing.length)throw Error('Incomplete checkpoint group; inspect manually');if(groups>=limit)break;
  const t=performance.now(),added=[];
  if(kind==='main')for(const seed of cfg.seeds)added.push(row(spec.id,seed,E.execute(env,base,[spec.id],cfg,seed)));
  else for(const seed of cfg.supportSeeds)for(const arm of spec.arms){const party=arm==='partner-only'?[spec.partnerId]:[spec.partnerId,spec.supportId],options=arm==='ablated-support'?{supportId:spec.supportId,removeSkill:spec.removedSkill}:{};added.push(row(spec.supportId,seed,E.execute(env,base,party,cfg,seed,options),{caseId:spec.caseId,arm,removedSkill:spec.removedSkill,partnerId:spec.partnerId,partnerName:spec.partnerName}));}
  rows.push(...added);write(file,rows);groups++;
  const log={kind,id:spec.id??spec.caseId,added:added.length,completed:rows.length,elapsedMs:performance.now()-t,manifestHash};fs.appendFileSync(path.join(BASE,'progress.jsonl'),JSON.stringify(log)+'\n');console.log(JSON.stringify(log));
 }
 const summary={kind,previous:prior,added:rows.length-prior,completed:rows.length,elapsedMs:performance.now()-started,configHash:manifestHash};fs.appendFileSync(path.join(BASE,'runs.jsonl'),JSON.stringify(summary)+'\n');return summary;
}
if(require.main===module){const kind=process.argv.find(x=>x.startsWith('--kind='))?.split('=')[1]||'main',limit=Number(process.argv.find(x=>x.startsWith('--limit='))?.split('=')[1]||Infinity);if(!['main','support'].includes(kind))throw Error('Invalid kind');console.log(JSON.stringify(run(kind,limit)));}
module.exports={run,parseCSV,read,write,row,verifyGate};
