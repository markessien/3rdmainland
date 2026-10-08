import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createServer} from './server.mjs';
const root=fileURLToPath(new URL('../public/',import.meta.url));
const files=[];
async function walk(dir){for(const entry of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,entry.name);assert.ok(!entry.isSymbolicLink(),'No links to private files');if(entry.isDirectory())await walk(p);else files.push(p);}}
await walk(root);
const release=JSON.parse(await fs.readFile(new URL('../package.json',import.meta.url),'utf8')).version;
const html=await fs.readFile(path.join(root,'index.html'),'utf8');
assert.ok(html.includes('https://3rdmainland.start.ng/'));
assert.ok(!html.includes('debug-menu'));
assert.ok(html.includes('id="brake"')&&html.includes('name="viewport"'));
const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`;
try{
  for(const file of files){
    assert.ok(/\.(html|css|js|txt)$/.test(file),'Public contains only game assets');
    const relative=path.relative(root,file).replaceAll('\\','/'),response=await fetch(`${origin}/${relative}`);
    assert.equal(response.status,200,relative);
    const text=await response.text();
    assert.ok(!/gh[pousr]_[A-Za-z0-9]{30,}|AKIA[A-Z0-9]{16}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text),'No recognizable credentials');
    if(file.endsWith('.js')){
      assert.match(response.headers.get('content-type'),/javascript/);
      for(const match of text.matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g)){
        assert.equal(new URL(match[1],origin).searchParams.get('v'),release,'Every module uses the release version');
        assert.ok(match[1].startsWith('.'),`Native local module path: ${match[1]}`);
        assert.equal((await fetch(new URL(match[1],`${origin}/${relative}`))).status,200);
      }
    }
  }
  for(const match of html.matchAll(/(?:src|href)="(\.\/[^\"]+)"/g))assert.equal((await fetch(new URL(match[1],origin+'/'))).status,200);
  for(const match of html.matchAll(/(?:src|href)="(\.\/[^\"]+\.(?:js|css)\?[^\"]+)"/g))assert.equal(new URL(match[1],origin).searchParams.get('v'),release);
  for(const blocked of ['/.git/config','/.env','/dev/server.mjs','/agents.md','/README.md','/debug/','/%2e%2e%5cpackage.json'])assert.equal((await fetch(origin+blocked)).status,404,blocked);
  console.log(`PASS: ${files.length} public assets, native module paths, production entry point, touch controls, secret signatures, and private-route isolation.`);
}finally{server.close();}
