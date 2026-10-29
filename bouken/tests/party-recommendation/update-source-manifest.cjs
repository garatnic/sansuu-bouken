// Run after updating runtime sources/version, before tests and commit.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../../..'),file=path.join(__dirname,'source-manifest.json'),manifest=JSON.parse(fs.readFileSync(file));
manifest.version=Number(fs.readFileSync(path.join(root,'bouken/common/version.js'),'utf8').match(/BoukenVersion\s*=\s*(\d+)/)[1]);
manifest.commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
manifest.note='ver.'+manifest.version+': runtime sources regenerated. commit is the implementation base; gitBlobs identifies exact file contents.';
for(const name of Object.keys(manifest.gitBlobs)){const bytes=fs.readFileSync(path.join(root,name));manifest.gitBlobs[name]=crypto.createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');}
fs.writeFileSync(file,JSON.stringify(manifest,null,2)+'\n');console.log('Updated source manifest: version '+manifest.version+', '+Object.keys(manifest.gitBlobs).length+' sources');
