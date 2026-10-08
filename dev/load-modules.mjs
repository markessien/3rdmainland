import fs from 'node:fs/promises';
const hooks=JSON.parse(await fs.readFile(new URL('./module-hooks.json',import.meta.url),'utf8'));
export function withSceneHooks(name,source){return source.replace('    reset(){',hooks[name]+'\n    reset(){');}
export async function debugMain(source){
  source=source.replace(/(\.js)\?v=\d+\.\d+\.\d+/g,'$1');
  const checkpoints=await fs.readFile(new URL('./checkpoints.js',import.meta.url),'utf8');
  return source.replace('function restartRide(){beginRide();}','')
    .replace('function saveRecord(){','function saveRecord(){if(debugCheckpoint)return;')
    .replace('function start() {',"function start() {debugCheckpoint=null;$('debug-current').textContent='Normal run';")+ '\n'+checkpoints;
}
export async function loadSceneModule(name){
  let source=withSceneHooks(name,await fs.readFile(new URL(`../public/js/${name}.js`,import.meta.url),'utf8'));
  source=source.replace(/(\.js)\?v=\d+\.\d+\.\d+/g,'$1');
  source=source.replace("from './aftermath.js'",`from '${new URL('../public/js/aftermath.js',import.meta.url).href}'`);
  const url=`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
  return {url,module:await import(url)};
}
