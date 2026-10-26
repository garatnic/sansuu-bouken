'use strict';
const fs=require('node:fs'),path=require('node:path'),L=require('../phase2/node.cjs'),A=require('../integration/api.js'),r=L.load();
function plan(){const tasks=[],sets=[];for(const count of [10,30,100,300,927]){const number=count===927?1:20;for(let set=0;set<number;set++){
 const root=628000000+count*10000+set*1000,spec={count,ownershipSeed:root+1,itemSeed:root+2,itemFraction:[.05,.5,.95,1][set%4],claims:0,config:{...A.defaults,size:[10,20,30][set%3],cumulativeExplored:1234}},f=L.makeFixture(r,spec),slots=f.slots,pattern=slots===1?[0,0,0,0,1]:slots===2?[0,0,1,1,2]:[0,1,Math.floor(slots/2),slots-1,slots];
 const owner={id:count+'-'+String(set+1).padStart(2,'0'),count,set,spec,owned:f.owned,slots,current:f.owned.slice(0,slots)};sets.push(owner);
 for(let repeat=0;repeat<(count===927?100:5);repeat++){
  const rotation=count===927?repeat:set,fixed=pattern[rotation%5],size=count===927?[10,20,30][Math.floor(repeat/5)%3]:spec.config.size,fraction=count===927?[.05,.5,.95,1][Math.floor(repeat/15)%4]:spec.itemFraction;
  tasks.push({id:owner.id+'-'+String(repeat+1).padStart(3,'0'),owner:owner.id,count,set,repeat,root:700000000+tasks.length*1000000,mode:['explore','treasure','companion','map'][(set+repeat)%4],fixed,size,itemFraction:fraction,positions:Array.from({length:slots},(_,i)=>(i+rotation)%slots).slice(0,fixed)});
 }
 }}return {version:1,baseCommit:'6a3da473418a7c2c166771a85a213d3fd2bc6eba',gameVersion:Number(fs.readFileSync(path.join(__dirname,'../../../common/version.js'),'utf8').match(/BoukenVersion\s*=\s*(\d+)/)[1]),auditTrials:64,methods:['current','anchored','random'],targetPerMethod:500,targetTotal:1500,counts:[10,30,100,300,927],sets,tasks};}
module.exports={plan};if(require.main===module){const file=process.argv[2];if(!file||fs.existsSync(file))throw Error('New output only');fs.writeFileSync(file,JSON.stringify(plan(),null,2)+'\n');}
