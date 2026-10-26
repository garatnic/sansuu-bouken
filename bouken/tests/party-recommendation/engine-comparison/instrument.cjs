'use strict';
// Build a measurement-only copy. Exact replacements fail if the source changes.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const source=fs.readFileSync(path.join(__dirname,'../integration/api.js'),'utf8');
function build(){let s=source;function replace(a,b){if(s.split(a).length!==2)throw Error('Instrumentation source mismatch: '+a);s=s.replace(a,b);}
replace("require('./outcomes.js')","require('../integration/outcomes.js')");
replace("const cfg={...defaults,...options.config},locked=", "const audit=(kind,data)=>hooks.audit?.({kind,...data});\n const cfg={...defaults,...options.config},locked=");
replace("e.phase=selection?'selection':'proposal';rows.set(key(p),e);", "e.phase=selection?'selection':'proposal';audit('evaluation',{stage,party:[...p],n,phase:e.phase,raw:[...e.raw],metrics:{...e.metrics}});rows.set(key(p),e);");
replace("if(!rows.has(key(p)))await evaluate(p,cfg.initialTrials);step();", "audit('exchange',{parent:[...e.party],child:[...p],swaps,duplicate:rows.has(key(p))});if(!rows.has(key(p)))await evaluate(p,cfg.initialTrials);step();");
return s;}
function load(){const Module=require('node:module'),m=new Module(path.join(__dirname,'profile-api.cjs'),module);m.filename=path.join(__dirname,'profile-api.cjs');m.paths=module.paths;m._compile(build(),m.filename);return m.exports;}
module.exports={load,build,sourceHash:crypto.createHash('sha256').update(source).digest('hex')};
