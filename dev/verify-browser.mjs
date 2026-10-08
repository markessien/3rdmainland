// Optional browser smoke test. Start an isolated Chromium/Edge profile with
// --remote-debugging-port=9223, then run node --experimental-websocket dev/verify-browser.mjs.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const pages=await (await fetch('http://127.0.0.1:9223/json/list')).json();
const page=pages.find(p=>p.type==='page'&&(p.url==='about:blank'||p.url==='http://127.0.0.1:5173/'||p.url==='http://127.0.0.1:5175/verify/'));
assert.ok(page,'Use an isolated blank test tab');
const ws=new WebSocket(page.webSocketDebuggerUrl),pending=new Map();let id=0;
ws.addEventListener('message',event=>{const message=JSON.parse(event.data);if(message.id){const p=pending.get(message.id);pending.delete(message.id);message.error?p.reject(Error(message.error.message)):p.resolve(message.result);}});
await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve);ws.addEventListener('error',reject);});
function call(method,params={}){return new Promise((resolve,reject)=>{const request=++id;pending.set(request,{resolve,reject});ws.send(JSON.stringify({id:request,method,params}));});}
try{
  await call('Page.enable');await call('Runtime.enable');
  for(const [name,width,height,mobile] of [['desktop',1365,900,false],['mobile',390,844,true],['landscape',844,390,true]]){
    await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile});
    await call('Emulation.setTouchEmulationEnabled',{enabled:mobile});
    await call('Page.navigate',{url:'http://127.0.0.1:5173/'});
    await new Promise(resolve=>setTimeout(resolve,800));
    const intro=await call('Runtime.evaluate',{expression:"JSON.stringify({panelsHidden:['speedometer','course-counter','record-panel'].every(id=>getComputedStyle(document.getElementById(id)).display==='none'),title:document.querySelector('#intro h1').textContent,footerAbsent:!document.querySelector('footer'),version:document.getElementById('game-version').textContent,versionVisible:getComputedStyle(document.getElementById('game-version')).display!=='none'})",returnByValue:true});
    const opening=JSON.parse(intro.result.value);assert.ok(opening.panelsHidden&&opening.footerAbsent&&opening.versionVisible);assert.equal(opening.version,`Version ${JSON.parse(await fs.readFile(new URL('../package.json',import.meta.url),'utf8')).version}`);assert.equal(opening.title,'Can you do Okada on 3rd mainland bridge?');
    const introShot=await call('Page.captureScreenshot',{format:'png'});await fs.writeFile(new URL(`../.browser-test/intro-${name}.png`,import.meta.url),Buffer.from(introShot.data,'base64'));
    await call('Page.navigate',{url:'http://127.0.0.1:5175/verify/'});
    let result;const deadline=Date.now()+30000;
    while(Date.now()<deadline){const reply=await call('Runtime.evaluate',{expression:"document.getElementById('browser-check-result')?.textContent",returnByValue:true});if(reply.result.value){result=JSON.parse(reply.result.value);break;}await new Promise(resolve=>setTimeout(resolve,250));}
    assert.ok(result,`${name} browser completed`);assert.deepEqual(result.errors,[],`${name} no runtime errors`);console.log(JSON.stringify(result));assert.ok(result.started&&result.touchFits&&result.publicDebugAbsent&&result.hintsHidden&&result.controlsAtStart,`${name} starts and controls fit`);assert.ok(result.canvas[0]>0&&result.canvas[1]>0);
    const shot=await call('Page.captureScreenshot',{format:'png'});await fs.writeFile(new URL(`../.browser-test/${name}.png`,import.meta.url),Buffer.from(shot.data,'base64'));
    console.log(`PASS: ${name} ${result.viewport.join('×')} renders, starts, and fits controls without JavaScript errors.`);
  }
}finally{ws.close();}
