import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {withSceneHooks,debugMain} from './load-modules.mjs';

const root=fileURLToPath(new URL('../public/',import.meta.url));
const debug=process.argv.includes('--debug');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.txt':'text/plain; charset=utf-8'};
export function createServer(){return http.createServer(async(req,res)=>{
  try{
    let url=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(process.argv.includes('--verify')&&url==='/verify/'){
      let html=await fs.readFile(path.join(root,'index.html'),'utf8');
      html=html.replace('./css/style.css','/css/style.css').replace('./js/main.js','/js/main.js');
      html=html.replace('</head>','<script>'+await fs.readFile(new URL('./browser-check.js',import.meta.url),'utf8')+'</script></head>');
      res.setHeader('Content-Type',types['.html']);res.end(html);return;
    }
    const isDebug=debug&&url.startsWith('/debug/');
    if(isDebug)url=url.slice(6);
    if(url==='/'||url==='')url='/index.html';
    if(url.split('/').some(segment=>segment.startsWith('.')||segment==='..')||url.includes('\\'))throw Error('Not public');
    if(isDebug&&url==='/menu.css'){
      res.setHeader('Content-Type',types['.css']);res.end(await fs.readFile(new URL('./checkpoint-menu.css',import.meta.url)));return;
    }
    const target=path.resolve(root,'.'+url),real=await fs.realpath(target);
    if(!real.startsWith(root)||!(await fs.stat(real)).isFile())throw Error('Not public');
    let data=await fs.readFile(real);
    if(isDebug&&url==='/index.html')data=Buffer.from(data.toString().replace('</main>',(await fs.readFile(new URL('./checkpoint-menu.html',import.meta.url),'utf8'))+'</main>').replace('</head>','<link rel="stylesheet" href="./menu.css"></head>'));
    if(isDebug&&url==='/js/main.js')data=Buffer.from(await debugMain(data.toString()));
    if(isDebug&&['/js/extension.js','/js/finale.js'].includes(url))data=Buffer.from(withSceneHooks(path.basename(url,'.js'),data.toString()));
    res.setHeader('Content-Type',types[path.extname(real)]||'application/octet-stream');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','no-store');res.end(data);
  }catch{res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');}
});}
if(process.argv[1]===fileURLToPath(import.meta.url)){
  const port=Number(process.argv.find(a=>a.startsWith('--port='))?.slice(7)||process.env.PORT||5173);
  createServer().listen(port,'127.0.0.1',()=>console.log(`Game: http://127.0.0.1:${port}/${debug?' (debug: /debug/)':''}`));
}
