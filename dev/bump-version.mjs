// Development-only release numbering; no build or runtime dependency.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const git=(...args)=>execFileSync('git',['-c',`safe.directory=${process.cwd().replaceAll('\\','/')}`,...args],{encoding:'utf8'}).trim();
const staged=process.argv.includes('--staged');
if(staged&&!git('diff','--cached','--name-only','--','public/'))process.exit(0);
if(staged&&git('diff','--name-only','--','package.json','public/'))throw Error('Stage package.json and public/ completely before versioning.');
const previous=JSON.parse(git('show','HEAD:package.json')).version;
if(!/^\d+\.\d+\.\d+$/.test(previous))throw Error('Expected a numeric major.minor.patch version.');
const [major,minor,patch]=previous.split('.').map(Number),version=`${major}.${minor}.${patch+1}`;
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));pkg.version=version;
const html=fs.readFileSync('public/index.html','utf8');
const updated=html.replace(/(<div id="game-version"[^>]*>)Version \d+\.\d+\.\d+(<\/div>)/,`$1Version ${version}$2`);
if(updated===html&&!html.includes(`Version ${version}</div>`))throw Error('Landing page version label missing.');
fs.writeFileSync('package.json',JSON.stringify(pkg,null,2)+'\n');fs.writeFileSync('public/index.html',updated.replace(/((?:href|src)="\.\/[^"?]+\.(?:css|js))(?:\?v=[\d.]+)?"/g,`$1?v=${version}"`));
const moduleFiles=['js','vendor'].flatMap(dir=>fs.readdirSync(`public/${dir}`).filter(name=>name.endsWith('.js')).map(name=>`public/${dir}/${name}`));
for(const file of moduleFiles){const source=fs.readFileSync(file,'utf8');const next=source.replace(/((?:from\s*|import\s*)['"])(\.[^'"?]+\.js)(?:\?v=[\d.]+)?(['"])/g,`$1$2?v=${version}$3`);if(next!==source)fs.writeFileSync(file,next);}

if(staged)git('add','--','package.json','public/index.html',...moduleFiles);
console.log(`Release version: ${version}`);
