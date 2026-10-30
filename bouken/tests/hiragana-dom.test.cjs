const {parseHTML}=require(process.env.HIRAGANA_DOM_MODULE||'linkedom'),vm=require('vm'),fs=require('fs'),assert=require('assert/strict');
const root=require('path').resolve(__dirname,'..');
const {window}=parseHTML('<html><head><title>算数ぼうけん</title></head><body><p>冒険ワールドへ出発</p><select><option>森林</option></select><input placeholder="仲間を検索" value="犬"><script>const x="漢字";</script><textarea>入力した漢字</textarea></body></html>');
const ctx=vm.createContext({window,document:window.document,MutationObserver:window.MutationObserver});
for(const f of ['hiragana-readings','hiragana'])vm.runInContext(fs.readFileSync(root+'/common/'+f+'.js','utf8'),ctx);
(async()=>{const d=window.document,H=window.BoukenHiragana;
assert.equal(d.title,'さんすうぼうけん');assert.equal(d.querySelector('p').textContent,'ぼうけんワールドへしゅっぱつ');assert.equal(d.querySelector('option').textContent,'しんりん');assert.equal(d.querySelector('option').value,'森林');assert.equal(d.querySelector('input').value,'犬');assert.equal(d.querySelector('input').placeholder,'なかまをけんさく');assert(d.querySelector('script').textContent.includes('漢字'));assert.equal(d.querySelector('textarea').textContent,'入力した漢字');
const block=d.createElement('section');block.innerHTML='<button aria-label="仲間を編成" data-id="犬">犬着ぐるみポポ</button>';d.body.append(block);await new Promise(setImmediate);
assert.equal(block.textContent,'いぬきぐるみポポ');assert.equal(block.firstChild.getAttribute('aria-label'),'なかまをへんせい');assert.equal(block.firstChild.dataset.id,'犬');
block.firstChild.textContent='得意なこと';await new Promise(setImmediate);assert.equal(block.textContent,'とくいなこと');block.firstChild.setAttribute('title','遠見');await new Promise(setImmediate);assert.equal(block.firstChild.title,'とおみ');
const counters=d.createTextNode('927体・10人・480品・30問');d.body.append(counters);await new Promise(setImmediate);assert.equal(counters.textContent,'927たい・10にん・480ひん・30もん');
const svg=d.createElementNS('http://www.w3.org/2000/svg','svg');svg.innerHTML='<text>開拓</text>';d.body.append(svg);await new Promise(setImmediate);assert.equal(svg.textContent,'かいたく');
for(const p of fs.readdirSync(root).filter(x=>x.endsWith('.html'))){const html=fs.readFileSync(root+'/'+p,'utf8');assert(html.includes('hiragana-readings.js?v=106'));assert(html.includes('hiragana.js?v=106'));}
const started=performance.now();for(let i=0;i<900;i++){const el=d.createElement('button');el.setAttribute('aria-label',`${i}列・未発見のマス`);el.textContent='未開拓';block.append(el);}await new Promise(setImmediate);assert(!/[一-龯]/.test(block.textContent));console.log('PASS DOM initial/dynamic text, attributes, SVG, implicit option values, IDs/user input/script/textarea unchanged, 9 pages wired; 900-cell batch '+Math.round(performance.now()-started)+'ms');
})();
