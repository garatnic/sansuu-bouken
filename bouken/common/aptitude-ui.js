// Display-only absolute scale. Revalidated against all 927 characters for ver.101.
window.BoukenAptitudeUI=(()=>{
 const APTITUDE_TOTAL_MAX = 192;
 const fields=[['development','開拓','#23834b'],['companions','仲間','#d44e79'],['treasure','宝探し','#ae7900'],['exploration','探索','#287bc1'],['special','スペシャル','#8654bc']];
 function element(tag,className){const el=document.createElement(tag);el.className=className;return el;}
 function bar(score,color){const fill=element('span','aptitude-fill');fill.style.width=(score/APTITUDE_TOTAL_MAX*100)+'%';fill.style.backgroundColor=color;return fill;}
 function stacked(character){const track=element('span','aptitude-track aptitude-stacked');track.setAttribute('aria-hidden','true');for(const [key,,color] of fields)track.append(bar(character.aptitudeScores[key],color));return track;}
 function detail(character){const section=element('section','aptitude-detail');const heading=element('h3','');heading.textContent='得意なこと';section.append(heading);for(const [key,label,color] of fields){const score=character.aptitudeScores[key];const row=element('div','aptitude-row');const name=element('span','aptitude-label');name.textContent=label;const track=element('span','aptitude-track');track.setAttribute('aria-hidden','true');track.append(bar(score,color));const value=element('span','aptitude-value');value.textContent=score;row.append(name,track,value);section.append(row);}return section;}
 return Object.freeze({stacked,detail});
})();
