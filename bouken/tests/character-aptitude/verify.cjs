'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const run=spawnSync(process.execPath,['--test','--test-reporter=tap',path.join(__dirname,'scorer.test.cjs')],{encoding:'utf8'});
const output=run.stdout+run.stderr;
fs.writeFileSync(path.join(__dirname,'test-results.tap'),output);
const count=label=>Number(output.match(new RegExp('^# '+label+' (\\d+)','m'))?.[1]||0);
const result={command:'node verify.cjs',node:process.version,tests:count('tests'),pass:count('pass'),fail:count('fail'),skipped:count('skipped'),exitCode:run.status,artifacts:Object.fromEntries(['scoring-v1.json','scores.csv','details.json','analysis.json','REPORT.md','input-manifest.json'].map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,f))).digest('hex')]))};
fs.writeFileSync(path.join(__dirname,'verification.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
if(run.status!==0||!result.tests){console.error(output);process.exit(1);}
