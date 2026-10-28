'use strict';
// Independent v2 scorer (derived from preserved Phase 3 formulas). No game runtime, save state, job or legacy ratings.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const definition = require('./scoring-v2.json');
const FIELDS = ['development', 'companions', 'treasure', 'exploration'];
const VERSION = '2.0.0';
function fail(message) { throw new Error(message); }
function validateDefinition(d, master) {
  if (d.aptitudeVersion !== VERSION || JSON.stringify(d.fields) !== JSON.stringify(FIELDS)) fail('Invalid scoring version/fields');
  if (JSON.stringify(d.normalization) !== JSON.stringify({scale:35,rounding:'Math.round',min:0,max:100}) || d.synergyCapPerField !== 8) fail('Invalid normalization/cap');
  for (const [label, rows] of [['master', master], ['definition', d.skills]]) {
    if (!Array.isArray(rows) || rows.length !== 67) fail(`${label}: expected 67 skills`);
    if (new Set(rows.map(x=>x.id)).size !== rows.length) fail(`${label}: duplicate skill ID`);
  }
  const ids = new Set(master.map(s=>s.id));
  for (const s of d.skills) {
    if (!ids.has(s.id)) fail(`Unknown definition ID ${s.id}`);
    if (!Array.isArray(s.base) || s.base.length!==3 || !s.base.every(x=>Number.isFinite(x)&&x>=0)) fail(`Invalid Lv definitions ${s.id}`);
    if (!Array.isArray(s.share) || s.share.length!==4 || !s.share.every(x=>Number.isFinite(x)&&x>=0) || s.share.reduce((a,b)=>a+b,0)!==(s.evaluationStatus==='対象外・別枠'?0:100)) fail(`Invalid shares ${s.id}`);
    if (s.name!==master.find(x=>x.id===s.id).name || typeof s.condition!=='string') fail(`Invalid name/condition ${s.id}`);
  }
  if (!Array.isArray(d.synergies) || new Set(d.synergies.map(x=>x.id)).size!==d.synergies.length) fail('Invalid/duplicate synergy');
  for (const s of d.synergies) {
    if (!Array.isArray(s.skills) || s.skills.length!==2 || new Set(s.skills).size!==2 || !s.skills.every(id=>ids.has(id)) || !FIELDS.includes(s.field)) fail('Invalid synergy members/field');
    if (!(s.rule==='fixed'&&s.raw===2) && !(s.rule==='terrain-min-level'&&s.cap===6)) fail('Invalid synergy rule');
  }
}
function normalize(raw) { return Math.min(100, Math.max(0, Math.round(100*(1-Math.exp(-Math.max(0,raw)/35))))); }
function zeros() { return Object.fromEntries(FIELDS.map(k=>[k,0])); }
function scoreCharacter(c, d=definition) {
  if (!c || !Number.isInteger(c.id) || c.id<=0 || typeof c.name!=='string' || !c.name.trim()) fail('Invalid character ID/name');
  if (!Array.isArray(c.skills) || !c.skills.length) fail(`Missing skills: ${c.id}`);
  const defs = new Map(d.skills.map(x=>[x.id,x])), levels = new Map();
  const contributions = [...c.skills].sort((a,b)=>String(a.id).localeCompare(String(b.id),'en')).map(s=>{
    if (!s || !defs.has(s.id)) fail(`Unknown skill ID: ${s?.id} character ${c.id}`);
    if (!Number.isInteger(s.level) || s.level<1 || s.level>3) fail(`Invalid Lv: ${s.id} character ${c.id}`);
    if (levels.has(s.id)) fail(`Duplicate skill: ${s.id} character ${c.id}`);
    levels.set(s.id,s.level);
    const def=defs.get(s.id), base=def.base[s.level-1];
    return {id:s.id,level:s.level,base,contribution:Object.fromEntries(FIELDS.map((k,i)=>[k,base*def.share[i]/100])),condition:def.condition};
  });
  const baseRaw=zeros();
  for(const s of contributions) for(const k of FIELDS) baseRaw[k]+=s.contribution[k];
  const candidates=[];
  for(const s of [...d.synergies].sort((a,b)=>a.id.localeCompare(b.id,'en'))) {
    if (!s.skills.every(id=>levels.has(id))) continue;
    candidates.push({id:s.id,skills:s.skills,field:s.field,raw:s.rule==='fixed'?s.raw:Math.min(s.cap,2*Math.min(...s.skills.map(id=>levels.get(id))))});
  }
  const synergyUncapped=zeros(),synergyRaw=zeros();
  for(const s of candidates) synergyUncapped[s.field]+=s.raw;
  for(const k of FIELDS) synergyRaw[k]=Math.min(d.synergyCapPerField,synergyUncapped[k]);
  const raw=Object.fromEntries(FIELDS.map(k=>[k,baseRaw[k]+synergyRaw[k]]));
  return {id:c.id,name:c.name,aptitudeVersion:VERSION,scores:Object.fromEntries(FIELDS.map(k=>[k,normalize(raw[k])])),raw,baseRaw,contributions,synergies:{pairs:candidates,uncapped:synergyUncapped,applied:synergyRaw,capPerField:d.synergyCapPerField},conditions:[...new Set(contributions.map(s=>s.condition))].sort()};
}
function scoreAll(characters, master, d=definition, expectedCount=927) {
  validateDefinition(d,master);
  if (!Array.isArray(characters) || characters.length!==expectedCount) fail(`Expected ${expectedCount} characters`);
  if(new Set(characters.map(c=>c.id)).size!==characters.length) fail('Duplicate character ID');
  return [...characters].sort((a,b)=>a.id-b.id).map(c=>scoreCharacter(c,d));
}
module.exports={FIELDS,VERSION,definition,normalize,validateDefinition,scoreCharacter,scoreAll};
