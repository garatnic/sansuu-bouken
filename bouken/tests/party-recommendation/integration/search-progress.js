(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.PartySearchProgress=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const stages=['くらべる基準をしらべています','スキルなしの冒険をためしています','仲間の組み合わせをつくっています','候補の模擬冒険をしています','仲間を入れかえてためしています','有望な候補をくわしくためしています','目的ごとに候補をえらんでいます','候補をまとめています','いまの編成をしらべています','おすすめ編成をしらべています'];
const messages=['なかまを よびにいっています','ぼうけんの したくをしています','背のたかい順に ならんでいます','やる気のある なかまが前に出てきました','おやつを リュックにつめています','ゴブリンが はりきっています','だれが地図を持つか そうだんしています','わすれものを とりにいっています','ちょっと トイレきゅうけい','きゅうけいから 戻ってきました','強そうなポーズを れんしゅうしています','たからばこの においをかいでいます','ならぶ向きを まちがえました','もういちど ならびなおしています','くつひもを むすんでいます','だれかの おなかがなっています','こっそり おやつを食べています','みんなの とくいわざを聞いています','リュックが重くて ひっくりかえりました','なかまどうしで 作戦会議中です'];
function create(random=Math.random){let value=0,last=-1,paired=false;
 return {reset(){value=0;last=-1;paired=false;},nextMessage(){let next;if(paired){next=9;paired=false;}else{const choices=messages.map((_,i)=>i).filter(i=>i!==9&&i!==last);next=choices[Math.min(choices.length-1,Math.floor(random()*choices.length))];paired=next===8;}last=next;return messages[next];},update(s,search=true){if(!Number.isInteger(s.stage)||!stages[s.stage]||!Number.isFinite(s.total)||s.total<=0||!Number.isFinite(s.completed))return null;const fraction=Math.max(0,Math.min(1,s.completed/s.total));const next=search?(s.stage+fraction)*10:(s.stage-8+fraction)*50;value=Math.max(value,Math.min(99,next));return {value,label:stages[s.stage],stage:s.stage,completed:s.completed,total:s.total};},finish(){value=100;return value;}};
}
return {stages,messages,create};
});
