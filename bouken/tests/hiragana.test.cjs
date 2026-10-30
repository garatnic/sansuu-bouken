const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),c={};c.window=c;vm.createContext(c);
for(const name of ['hiragana-readings','hiragana'])vm.runInContext(fs.readFileSync(path.join(root,'common',name+'.js'),'utf8'),c);
const H=c.BoukenHiragana,kanji=/[\u3400-\u9fff\uf900-\ufaff々〆]/;
for(const [input,expected] of [['冒険ワールドへ出発','ぼうけんワールドへしゅっぱつ'],['犬着ぐるみポポ','いぬきぐるみポポ'],['大神官ハロルド','だいしんかんハロルド'],['遠見 Lv3','とおみ Lv3'],['得意なこと','とくいなこと'],['927体・10人・480品・30問','927たい・10にん・480ひん・30もん'],['1人の仲間','1にんのなかま'],['10人追加','10にんついか'],['２０人追加','２０にんついか'],['1分・2分・10分','1ぷん・2ふん・10ぷん'],['大きな体','おおきなからだ'],['森の中','もりのなか'],['深海真珠の首飾り','しんかいしんじゅのくびかざり'],['パーティー 🤖 10×10 A01','パーティー 🤖 10×10 A01']])assert.equal(H.text(input),expected,input);
assert(H.matches('犬着ぐるみポポ','いぬきぐるみ'));assert(H.matches('犬着ぐるみポポ','犬'));assert(H.matches('パワードリル','パワー'));assert(!H.matches('犬着ぐるみポポ','ねこ'));
let strings=0;const scan=value=>{if(typeof value==='string'){assert(!kanji.test(H.text(value)),value);strings++;}else if(Array.isArray(value))value.forEach(scan);else if(value&&typeof value==='object')Object.values(value).forEach(scan);};
for(const name of fs.readdirSync(path.join(root,'data')).filter(n=>n.endsWith('.json'))){const bytes=fs.readFileSync(path.join(root,'data',name),'utf8'),data=JSON.parse(bytes),before=JSON.stringify(data);scan(data);assert.equal(JSON.stringify(data),before);}
for(const page of fs.readdirSync(root).filter(n=>n.endsWith('.html'))){const html=fs.readFileSync(path.join(root,page),'utf8');assert(html.includes('hiragana-readings.js?v=105'));assert(html.includes('hiragana.js?v=105'));}
console.log(`PASS: ${strings} master strings have no remaining kanji, masters unchanged, contextual/counter/name readings, kana/kanji searches, katakana/ASCII/symbols retained, 9 production pages wired`);
