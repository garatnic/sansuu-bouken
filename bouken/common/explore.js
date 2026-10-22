// ToDo 27: 探索ルールを画面から分離。算数接続前の開拓のみテスト操作。
window.BoukenExplore=Object.freeze({
 adjacent(w,i){const x=i%w.width,y=Math.floor(i/w.width);return [[x-1,y],[x+1,y],[x,y-1],[x,y+1]].filter(([a,b])=>a>=0&&a<w.width&&b>=0&&b<w.height).map(([a,b])=>b*w.width+a);},
 canExplore(w,i){return Number.isInteger(i)&&i>=0&&i<w.terrain.length&&!w.explored[i]&&this.adjacent(w,i).some(j=>w.explored[j]);},
 explore(w,i){if(!this.canExplore(w,i))throw Error('ここはまだ開拓できません');w.explored[i]=true;w.exploredCount=w.explored.filter(Boolean).length-1;w.player={x:i%w.width,y:Math.floor(i/w.width)};},
 move(w,i){if(!w.explored[i])throw Error('未開拓のマスには移動できません');w.player={x:i%w.width,y:Math.floor(i/w.width)};},
 visible(w,i){return w.explored[i]?'explored':w.revealed[i]?'revealed':'hidden';},
 canVisit(w,i){return !!w.explored[i]&&!!w.facility[i];},
 visit(w,i){if(!this.canVisit(w,i))throw Error('未開拓の施設には訪問できません');return w.visitedFacilities[i]?'visited':'pending';}
});
