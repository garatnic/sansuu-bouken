'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const s=require('./scorer.cjs');
const {characters,skills}=s.loadInputs(),rows=s.scoreAll(characters,skills);
const clone=x=>JSON.parse(JSON.stringify(x));
const c=(pairs)=>({id:1,name:'fixture',skills:pairs.map(([id,level])=>({id,level}))});
// Independent source-table oracle: all 67 IDs, 201 Lv entries and 268 shares.
const spec=fs.readFileSync(path.resolve(__dirname,'../../siyou/キャラクター適性スコア理論採点仕様_v1.md'),'utf8');
const oracle=spec.split('\n').filter(l=>/^\| [A-F]\d\d \|/.test(l)).map(l=>l.split('|').slice(1,-1).map(v=>v.trim()));
test('definition equals normative table, complete and unique',()=>{
 assert.equal(oracle.length,67);assert.equal(new Set(oracle.map(r=>r[0])).size,67);
 assert.deepEqual(s.definition.skills.map(r=>[r.id,r.name,r.base.join('/'),r.share.join('/'),r.condition]),oracle);
 s.validateDefinition(s.definition,skills);
});
for(const [id,,base,share] of oracle) for(let lv=1;lv<=3;lv++) test(`${id} Lv${lv}: independent expected contribution/normalization`,()=>{
 const r=s.scoreCharacter(c([[id,lv]]));
 const expected=share.split('/').map(p=>Number(base.split('/')[lv-1])*Number(p)/100);
 assert.deepEqual(Object.values(r.raw),expected);
 assert.deepEqual(Object.values(r.scores),expected.map(v=>Math.round(100*(1-Math.exp(-v/35)))));
 assert.equal(r.synergies.pairs.length,0);
});
test('927 records, unique IDs/names mapped, integer scores 0..100, finite raw and version',()=>{
 assert.equal(rows.length,927);assert.equal(new Set(rows.map(c=>c.id)).size,927);
 for(const r of rows){assert.equal(r.name,characters.find(c=>c.id===r.id).name);assert.equal(r.aptitudeVersion,'1.0.0-draft');for(const k of s.FIELDS){assert(Number.isInteger(r.scores[k])&&r.scores[k]>=0&&r.scores[k]<=100);assert(Number.isFinite(r.raw[k]));assert.equal(r.raw[k],r.baseRaw[k]+r.synergies.applied[k]);}}
});
test('same input byte-equivalent, no mutation',()=>{const before=JSON.stringify({characters,skills});assert.deepEqual(s.scoreAll(characters,skills),rows);assert.equal(JSON.stringify({characters,skills}),before);});
test('character/master/skill/definition/synergy input order independent',()=>{
 const d=clone(s.definition);d.skills.reverse();d.synergies.reverse();
 assert.deepEqual(s.scoreAll([...characters].reverse().map(x=>({...x,skills:[...x.skills].reverse()})),[...skills].reverse(),d),rows);
});
test('job, race, cost, legacy scores do not affect results',()=>{
 assert.deepEqual(s.scoreAll(characters.map(x=>({...x,job:'arbitrary',race:'x',aptitude:999,totalCost:-1,skills:x.skills.map(y=>({...y,cost:-999}))})),skills),rows);
});
test('D04 only: all levels zero',()=>{for(let lv=1;lv<=3;lv++)assert.deepEqual(Object.values(s.scoreCharacter(c([['D04',lv]])).scores),[0,0,0,0]);});
for(let n=1;n<=7;n++) test(`terrain synergy ${n}: all 9 level pairs + absent pair`,()=>{
 const a='A'+String(n+3).padStart(2,'0'),e='E'+String(n).padStart(2,'0');
 for(let i=1;i<=3;i++)for(let j=1;j<=3;j++)assert.equal(s.scoreCharacter(c([[a,i],[e,j]])).synergies.applied.development,2*Math.min(i,j));
 const other='E'+String(n===7?1:n+1).padStart(2,'0');assert.equal(s.scoreCharacter(c([[a,3],[other,3]])).synergies.pairs.length,0);
});
for(const [a,b,k] of [['B02','C01','treasure'],['B03','D01','companions'],['F01','C04','treasure'],['F02','D05','companions']])test(`fixed synergy ${a}+${b}`,()=>{
 for(let i=1;i<=3;i++)for(let j=1;j<=3;j++)assert.equal(s.scoreCharacter(c([[a,i],[b,j]])).synergies.applied[k],2);
});
test('per-field cap 8; each pair once (synthetic >3-skill boundary fixture)',()=>{
 const r=s.scoreCharacter(c([['A04',3],['E01',3],['A05',3],['E02',3],['B02',1],['C01',1]]));
 assert.equal(r.synergies.uncapped.development,12);assert.equal(r.synergies.applied.development,8);assert.equal(r.synergies.applied.treasure,2);assert.equal(r.synergies.pairs.length,3);
});
test('no inferred synergy or cross-field penalties; independent totals',()=>{
 const r=s.scoreCharacter(c([['C01',3],['D01',3],['B01',3]]));assert.equal(r.synergies.pairs.length,0);assert.deepEqual(Object.values(r.scores),[0,48,48,51]);assert.notEqual(Object.values(r.scores).reduce((a,b)=>a+b),100);
});
for(const bad of [0,4,-1,1.5,'2',null,undefined,NaN])test(`reject invalid level ${String(bad)}`,()=>assert.throws(()=>s.scoreCharacter(c([['A01',bad]])),/Invalid Lv/));
test('reject unknown/retired/duplicate/missing skills',()=>{
 for(const id of ['X99','E09',undefined])assert.throws(()=>s.scoreCharacter(c([[id,1]])),/Unknown skill/);
 assert.throws(()=>s.scoreCharacter(c([['A01',1],['A01',2]])),/Duplicate skill/);
 for(const value of [undefined,[],null])assert.throws(()=>s.scoreCharacter({...c([]),skills:value}),/Missing skills/);
});
test('reject wrong count, duplicate IDs, invalid ID/name',()=>{
 assert.throws(()=>s.scoreAll(characters.slice(1),skills),/Expected/);
 const x=clone(characters);x[1].id=x[0].id;assert.throws(()=>s.scoreAll(x,skills),/Duplicate character/);
 for(const id of [null,'1',0,1.5])assert.throws(()=>s.scoreCharacter({...characters[0],id}),/Invalid character/);
 assert.throws(()=>s.scoreCharacter({...characters[0],name:''}),/Invalid character/);
});
test('reject missing/duplicate definitions and masters',()=>{
 for(const source of ['skills','master'])for(const mode of ['missing','duplicate']){
  const d=clone(s.definition),m=clone(skills),a=source==='skills'?d.skills:m;
  if(mode==='missing')a.pop();else a[1]=a[0];
  assert.throws(()=>s.validateDefinition(d,m));
 }
});
test('reject invalid base/share/version/normalization/synergy',()=>{
 for(const mutate of [d=>d.skills[0].base.pop(),d=>d.skills[0].share[0]=99,d=>d.aptitudeVersion='x',d=>d.normalization.scale=36,d=>d.synergies[0].skills[0]='X99',d=>d.synergies.push(d.synergies[0])]){const d=clone(s.definition);mutate(d);assert.throws(()=>s.validateDefinition(d,skills));}
});
test('normalization negative, zero, monotonic, bounded saturation',()=>{
 assert.equal(s.normalize(-10),0);assert.equal(s.normalize(0),0);assert.equal(s.normalize(35),63);assert.equal(s.normalize(1e6),100);
 for(let x=0;x<1000;x++)assert(s.normalize(x+.1)>=s.normalize(x));
});
test('persisted output/manifest match fresh calculation',()=>{
 assert.deepEqual(JSON.parse(fs.readFileSync(path.join(__dirname,'details.json'))),rows);
 assert.deepEqual(JSON.parse(fs.readFileSync(path.join(__dirname,'input-manifest.json'))),s.inputManifest());
 const expected=s.csv([['id','name','aptitudeVersion',...s.FIELDS,...s.FIELDS.map(k=>'raw_'+k)],...rows.map(c=>[c.id,c.name,s.VERSION,...s.FIELDS.map(k=>c.scores[k]),...s.FIELDS.map(k=>c.raw[k])])]);
 assert.equal(fs.readFileSync(path.join(__dirname,'scores.csv'),'utf8'),expected);
});
test('game/master files unchanged relative to audited source commit',()=>{
 const manifest=require('./review-manifest.json');
 const changed=execFileSync('git',['diff','--name-only','-z',manifest.sourceCommit,'--','bouken'],{cwd:path.resolve(__dirname,'../../..'),encoding:'utf8'}).split('\0').filter(Boolean);
 assert(changed.every(p=>p.startsWith('bouken/tests/character-aptitude/')||p==='bouken/siyou/キャラクター適性スコア開発ロードマップ.md'),changed.join('\n'));
});
test('complete exact normative synergy rules, no added or omitted pair',()=>{
 const expected=Array.from({length:7},(_,i)=>({id:`terrain-${i+1}`,skills:[`A${String(i+4).padStart(2,'0')}`,`E0${i+1}`],field:'development',rule:'terrain-min-level',cap:6}));
 for(const [a,b,field] of [['B02','C01','treasure'],['B03','D01','companions'],['F01','C04','treasure'],['F02','D05','companions']])expected.push({id:a+'+'+b,skills:[a,b],field,rule:'fixed',raw:2});
 assert.deepEqual(s.definition.synergies,expected);
});
test('all 927 scores independently reconstructed from normative table and hardcoded synergy',()=>{
 const table=new Map(oracle.map(([id,,base,share])=>[id,{base:base.split('/').map(Number),share:share.split('/').map(Number)}]));
 for(const ch of characters){
  const base=[0,0,0,0],bonus=[0,0,0,0],lv=Object.fromEntries(ch.skills.map(x=>[x.id,x.level]));
  for(const skill of [...ch.skills].sort((a,b)=>a.id<b.id?-1:1)){const d=table.get(skill.id);for(let i=0;i<4;i++)base[i]+=d.base[skill.level-1]*d.share[i]/100;}
  for(let n=1;n<=7;n++){const a=lv['A'+String(n+3).padStart(2,'0')],e=lv['E0'+n];if(a&&e)bonus[0]+=Math.min(6,2*Math.min(a,e));}
  for(const [a,b,i] of [['B02','C01',2],['B03','D01',1],['F01','C04',2],['F02','D05',1]])if(lv[a]&&lv[b])bonus[i]+=2;
  const expected=base.map((v,i)=>v+Math.min(8,bonus[i])),actual=rows.find(r=>r.id===ch.id);
  assert.deepEqual(Object.values(actual.raw),expected);
  assert.deepEqual(Object.values(actual.scores),expected.map(v=>Math.round(100*(1-Math.exp(-Math.max(0,v)/35)))));
 }
});
test('analysis frequency, mean, ranks and support are consistent with complete rows',()=>{
 const a=require('./analysis.json');
 for(const k of s.FIELDS){const stat=a.statistics[k],values=rows.map(r=>r.scores[k]);
  assert.equal(stat.frequency.reduce((n,x)=>n+x.count,0),927);
  assert.equal(stat.distribution.reduce((n,x)=>n+x.count,0),927);
  assert.equal(stat.mean,values.reduce((x,y)=>x+y,0)/927);
  assert.equal(stat.zeroCount,values.filter(v=>v===0).length);
  for(const descending of [true,false]){
   const ranked=[...rows].sort((a,b)=>(descending?b.scores[k]-a.scores[k]:a.scores[k]-b.scores[k])||a.id-b.id).slice(0,20);
   assert.deepEqual(stat[descending?'top20':'bottom20'].map(r=>r.id),ranked.map(r=>r.id));
  }
 }
 assert.equal(a.levelSensitivity.length,67);
 for(const entry of a.levelSensitivity)for(const k of s.FIELDS){assert(entry.fields[k].delta12.min>=0);assert(entry.fields[k].delta23.min>=0);}
 for(const support of a.support)for(const lv of support.levels)assert.equal(lv.count,characters.filter(c=>c.skills.some(x=>x.id===support.id&&x.level===lv.level)).length);
});
test('report and analysis regenerate byte-for-byte deterministically',()=>{
 const files=['analysis.json','REPORT.md'];const before=files.map(f=>fs.readFileSync(path.join(__dirname,f),'utf8'));
 execFileSync(process.execPath,[path.join(__dirname,'analyze.cjs')],{stdio:'pipe'});
 assert.deepEqual(files.map(f=>fs.readFileSync(path.join(__dirname,f),'utf8')),before);
});
