// 四則演算エンジン: 仕様書「四則演算問題生成エンジン.md」準拠。ゲーム状態に依存しない。
(function(){'use strict';
 const ADD=['ADD_1_1_NO_CARRY','ADD_1_1_CARRY','ADD_1_2_NO_CARRY','ADD_1_2_CARRY','ADD_2_2_NO_CARRY','ADD_2_2_CARRY'];
 const SUB=['SUB_1_1_NO_BORROW','SUB_2_1_NO_BORROW','SUB_2_1_BORROW','SUB_2_2_NO_BORROW','SUB_2_2_BORROW','SUB_3_1_NO_BORROW','SUB_3_1_BORROW','SUB_3_2_NO_BORROW','SUB_3_2_BORROW'];
 const shuffle=a=>{for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
 const digits=n=>n<10?1:n<100?2:3;
 function borrowInfo(a,b){let count=0,ones=false,tens=false,loan=0;for(let p=0;p<3;p++){let d=Math.floor(a/10**p)%10-loan,sub=Math.floor(b/10**p)%10;loan=d<sub?1:0;if(loan){count++;if(p===0)ones=true;if(p===1)tens=true;}}return {hasBorrow:count>0,borrowCount:count,borrowOnes:ones,borrowTens:tens};}
 function enumerate(allowZero){const pools={};for(const c of [...ADD,...SUB,'MUL_ALL','DIV_EXACT','DIV_REMAINDER'])pools[c]=[];
  const put=(cat,op,a,b,value,rem=0,meta={})=>pools[cat].push({id:`${op}:${a}:${b}`,operation:op,category:cat,operand1:a,operand2:b,answer:{quotientOrValue:value,...(op==='div'?{remainder:rem}:{})},metadata:{hasCarry:false,hasBorrow:false,hasRemainder:rem>0,...meta}});
  for(let a=1;a<=99;a++)for(let b=1;b<=99;b++){let da=digits(a),db=digits(b);if(da>db)continue;let carry=a%10+b%10>=10;let cat=`ADD_${da}_${db}_${carry?'CARRY':'NO_CARRY'}`;if(pools[cat]){put(cat,'add',a,b,a+b,0,{hasCarry:carry,carryTensToHundreds:Math.floor(a/10)+Math.floor(b/10)+(carry?1:0)>=10});if(da!==db)put(cat,'add',b,a,a+b,0,{hasCarry:carry,carryTensToHundreds:Math.floor(a/10)+Math.floor(b/10)+(carry?1:0)>=10});}}
  for(let a=1;a<=999;a++)for(let b=1;b<=Math.min(99,a);b++){if(!allowZero&&a===b)continue;const info=borrowInfo(a,b),cat=`SUB_${digits(a)}_${digits(b)}_${info.hasBorrow?'BORROW':'NO_BORROW'}`;if(pools[cat])put(cat,'sub',a,b,a-b,0,info);}
  for(let a=0;a<=10;a++)for(let b=0;b<=10;b++)put('MUL_ALL','mul',a,b,a*b);
  for(let b=2;b<=9;b++)for(let q=1;q<=9;q++)for(let r=0;r<b;r++)put(r?'DIV_REMAINDER':'DIV_EXACT','div',b*q+r,b,q,r);
  return pools;
 }
 function choicesFor(q){const isDiv=q.operation==='div',v=q.answer.quotientOrValue,r=q.answer.remainder||0,opts=[q.answer],seen=new Set();const key=x=>`${x.quotientOrValue}:${x.remainder??''}`;seen.add(key(q.answer));function add(n,rem=0){if(opts.length>=4)return;if(n<0||!Number.isInteger(n)||isDiv&&(rem<0||rem>=q.operand2))return;const x={quotientOrValue:n,...(isDiv?{remainder:rem}:{})};if(!seen.has(key(x))){seen.add(key(x));opts.push(x);}}
  if(!isDiv){for(const d of shuffle([-10,-2,-1,1,2,10]))add(v+d);for(let d=3;opts.length<4;d++){add(v-d);add(v+d);}}
  else if(!r){for(const d of shuffle([-2,-1,1,2,3,-3]))add(v+d,0);for(let d=4;opts.length<4;d++)add(v+d,0);}
  else{for(const [dv,dr] of shuffle([[0,-1],[0,1],[-1,0],[1,0],[-1,-1],[1,1],[-2,0],[2,0]]))add(v+dv,r+dr);for(let d=1;opts.length<4;d++){add(v+d,r);add(Math.max(0,v-d),r);}}
  shuffle(opts);return {choices:opts,correctChoiceIndex:opts.findIndex(x=>key(x)===key(q.answer))};
 }
 class Engine{
  constructor(config={}){this.config={selectionMode:'bag',allowZeroSubtractionResult:true,avoidImmediateRepeat:true,...config};this.pools=enumerate(this.config.allowZeroSubtractionResult);this.reset();}
  reset(){this.bags={};this.last=null;}
  draw(key,values){if(this.config.selectionMode==='random')return values[Math.floor(Math.random()*values.length)];let bag=this.bags[key];if(!bag||!bag.length)this.bags[key]=bag=shuffle(values.slice());return bag.pop();}
  nextQuestion(){let op=this.draw('ops',['add','sub','mul','div']),cat=op==='add'?this.draw('adds',ADD):op==='sub'?this.draw('subs',SUB):op==='mul'?'MUL_ALL':this.draw('divs',['DIV_EXACT','DIV_EXACT','DIV_EXACT','DIV_REMAINDER']);let pool=this.pools[cat];if(!pool.length)throw Error('問題候補がありません: '+cat);let q=this.draw('pool:'+cat,pool);if(this.config.avoidImmediateRepeat&&q.id===this.last&&pool.length>1){let alt=this.draw('pool:'+cat,pool);if(alt.id!==q.id){if(this.config.selectionMode==='bag')this.bags['pool:'+cat].push(q);q=alt;}}this.last=q.id;const sign={add:'＋',sub:'－',mul:'×',div:'÷'}[op];return {...q,prompt:`${q.operand1} ${sign} ${q.operand2} ＝`,...choicesFor(q)};}
  getConfig(){return {...this.config};}
  getPoolStats(){return Object.fromEntries(Object.entries(this.pools).map(([k,v])=>[k,v.length]));}
 }
 window.BoukenMath=Object.freeze({create:config=>new Engine(config),formatAnswer:a=>a.remainder?`${a.quotientOrValue} あまり ${a.remainder}`:String(a.quotientOrValue)});
})();
