import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {debugMain,loadSceneModule} from './dev/load-modules.mjs';
const extensionTest=await loadSceneModule('extension');
const finaleTest=await loadSceneModule('finale');
import * as THREE from './public/vendor/three.module.js';
const elements=new Map(),listeners=new Map();
const element=id=>{if(!elements.has(id))elements.set(id,{textContent:'',innerHTML:'',classList:{toggle(){}},setAttribute(){},addEventListener(){}});return elements.get(id);};
globalThis.document={getElementById:element,addEventListener(){},hidden:false};
globalThis.window=globalThis;globalThis.innerWidth=1280;globalThis.innerHeight=800;globalThis.devicePixelRatio=1;
globalThis.addEventListener=(name,callback)=>listeners.set(name,callback);
const storage=new Map();globalThis.localStorage={getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)};
let frame,now=performance.now();globalThis.requestAnimationFrame=callback=>{frame=callback;};
globalThis.FakeRenderer=class{shadowMap={};setPixelRatio(){}setClearColor(){}setSize(){}render(scene){globalThis.renderedScene=scene;}};
function tick(n=1,ms=16.667){for(let i=0;i<n;i++)frame(now+=ms);}
function key(code){listeners.get('keydown')({code,repeat:false,preventDefault(){}});}
const source=(await debugMain(await fs.readFile(new URL('./public/js/main.js',import.meta.url),'utf8')))
  .replace("from '../vendor/three.module.js'",`from '${new URL('./public/vendor/three.module.js',import.meta.url).href}'`)
  .replace("from './encounters.js'",`from '${new URL('./public/js/encounters.js',import.meta.url).href}'`)
  .replace("from './opening.js'",`from '${new URL('./public/js/opening.js',import.meta.url).href}'`)
  .replace("from './prologue.js'",`from '${new URL('./public/js/prologue.js',import.meta.url).href}'`)
  .replace("from './crash.js'",`from '${new URL('./public/js/crash.js',import.meta.url).href}'`)
  .replace("from './extension.js'",`from '${extensionTest.url}'`)
  .replace("from './finale.js'",`from '${finaleTest.url}'`)
  .replace('new THREE.WebGLRenderer(','new FakeRenderer(')
  +'\nglobalThis.gameTest={entities,encounters,medianLamps,opening,extension,finale,camera,finish,CHECKPOINTS,startCheckpoint,holdAt(d){distance=d;},get lane(){return lane},get speed(){return speed},get state(){return state},get distance(){return distance},pattern(d){const old=distance;distance=d;const cars=entities.filter(e=>e.type===\'slalom-car\');cars.forEach(e=>e.update(0,elapsed));const result=cars.map(e=>e.g.position.x);distance=old;return result;},safe(){for(const e of entities)e.collidable=false;}};';
Math.random=()=>.5;
await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
tick();
const passingBike=renderedScene.getObjectByName('passing-bike'),initialBikeZ=passingBike.position.z;
tick(20);assert.ok(passingBike.position.z<initialBikeZ,'Intro bikes move forward');
assert.ok(renderedScene.getObjectByName('waving-suited-passenger').visible,'Suited man waits at roadside');
element('player-name').value='Test Rider';key('Enter');assert.equal(gameTest.state,'boarding');
assert.ok(renderedScene.getObjectByName('rider').visible,'Rider stays on arriving bike');
assert.equal(renderedScene.getObjectByName('suited-passenger').visible,false,'Passenger has not boarded yet');
let beforeRideCamera;
for(let i=0;i<380&&gameTest.state==='boarding';i++){beforeRideCamera=gameTest.camera.position.clone();tick();assert.equal(renderedScene.getObjectByName('motorbike').position.y,0,'Pickup and merge tires remain on asphalt');}assert.equal(gameTest.state,'running');
assert.ok(beforeRideCamera.distanceTo(gameTest.camera.position)<.02,'Centered intro and first moving frame agree');
assert.ok(renderedScene.getObjectByName('roadside-land').visible,'Sand remains at bridge entrance');
assert.equal(element('remaining').textContent,'11');
const bike=renderedScene.getObjectByName('motorbike');
assert.equal(bike.position.x,0,'Starts in middle lane');
assert.equal(gameTest.entities.length,2,'Opening has exactly two blocking cars');
const moves=[[40,2],[132,1],[280,0],[348,2],[420,1],[513,-1],[647,0],[666,2],[980,0],[1190,1]];
function moveTo(n){while(gameTest.lane!==n)key(gameTest.lane<n?'ArrowRight':'ArrowLeft');}
let action=0,jumpedPeople=false;
const stages=new Set();let sawLamp=false,sawSparks=false,sawBottles=false;
while(gameTest.distance<1263){
  const d=gameTest.distance;
  if(action<moves.length&&d>=moves[action][0]){moveTo(moves[action][1]);action++;}
  if(d>=425&&!jumpedPeople){key('Space');jumpedPeople=true;}
  tick();stages.add(gameTest.opening.stage);
  if(gameTest.opening.stage===13&&d>1200&&d<1220){
    const bus=gameTest.entities.find(e=>e.type==='bus');
    const tires=[];bus.g.traverse(m=>{if(m.name==='bus-wheel')tires.push(m);});
    assert.equal(tires.length,4,'Bus retains four wheels');
    assert.ok(tires.every(t=>t.visible),'No bus wheels hidden');
    bus.g.updateMatrixWorld(true);
    assert.equal(tires.filter(t=>t.getWorldPosition(bike.position.clone()).y<.65).length,2,'Bus balances on two side wheels');
  }
  sawLamp ||=!!renderedScene.getObjectByName('opening-falling-lamp');
  sawSparks ||=renderedScene.getObjectByName('electrical-flash')?.visible===true;
  sawBottles ||=renderedScene.getObjectByName('rolling-beer-bottle')?.visible===true;
  if(d>145&&d<240)assert.equal(gameTest.entities.find(e=>e.paceCar)?.g.position.z,-24,'Passing car holds pace farther ahead');
  if(d>455&&d<460)assert.equal(gameTest.entities.filter(e=>e.blockade).length,36,'Dense blockade covers all road lanes');
  if(d>300&&d<310){const truck=gameTest.entities.find(e=>e.type==='opening-truck');assert.ok(new THREE.Box3().setFromObject(truck.g).min.y>=.07,'Fallen truck rests fully above road');assert.ok(truck.g.rotation.z<0,'Truck falls right');}
  assert.equal(gameTest.state,'running',`Opening route survives at ${Math.floor(d)} m, stage ${gameTest.opening.stage}`);
}
assert.ok(gameTest.opening.complete,'Scripted opening completes');
for(let i=0;i<=13;i++)assert.ok(stages.has(i),`Opening stage ${i} appears in order`);
assert.ok(renderedScene.getObjectByName('suited-passenger'),'Passenger retained');
assert.ok(sawLamp&&sawSparks&&sawBottles,'Lamp sparks and rolling bottles animate during opening');
assert.equal(renderedScene.getObjectByName('flying-fish'),undefined,'Potholes have no fish');
assert.equal(gameTest.entities.filter(e=>e.type==='slalom-car').length,10);
let slalomSnapshot;
assert.ok(gameTest.entities.filter(e=>e.type==='slalom-car').every(e=>e.g.scale.x===1&&e.width===1.18),'Slalom cars occupy one lane');
moveTo(0);key('ArrowLeft');assert.equal(gameTest.lane,0,'Net fences prevent median escape');
// Sample actual motion at the center of each maneuver, then restore the course.
const slalomCars=gameTest.entities.filter(e=>e.type==='slalom-car'),savedDistance=gameTest.distance;
const lateralRates=slalomCars.map(e=>{
  let low=e.hitAt-90,high=e.hitAt-20;
  for(let i=0;i<24;i++){const mid=(low+high)/2;gameTest.holdAt(mid);e.update();if((e.g.position.x>0)===(slalomCars.indexOf(e)%2===0))high=mid;else low=mid;}
  const center=(low+high)/2;
  gameTest.holdAt(center-.5);e.update();const before=e.g.position.x;
  gameTest.holdAt(center+.5);e.update();return Math.abs(e.g.position.x-before);
});
gameTest.holdAt(savedDistance);slalomCars.forEach(e=>e.update());
for(let i=1;i<lateralRates.length;i++)assert.ok(lateralRates[i]>lateralRates[i-1],'Later cars swerve progressively faster');
assert.ok(lateralRates[9]/lateralRates[0]<1.6,'Swerve acceleration stays moderate');
let slalomIndex=0,sawFlight=false,sawStop=false,sawWheelie=false,sawMount=false,sawCheckpoint=false;
const policeMoves=[[2340,0]];let policeMove=0;
while(gameTest.distance<2393){
  const d=gameTest.distance;
  if(slalomIndex<10&&d>=1315+slalomIndex*65){moveTo(slalomIndex%2?2:0);slalomIndex++;}
  if(d>=1985&&d<2040)moveTo(2);
  if(policeMove<policeMoves.length&&d>=policeMoves[policeMove][0]){moveTo(policeMoves[policeMove][1]);policeMove++;}
  tick();
  if(!slalomSnapshot&&gameTest.distance>=1320)slalomSnapshot={distance:1320,cars:gameTest.pattern(1320)};
  if(d>2160&&d<2200)sawFlight ||= bike.position.y>8;
  if(d>2040&&d<2080)sawStop ||=gameTest.speed<1;
  if(d>2108&&d<2140)sawWheelie ||=bike.rotation.x>.4&&gameTest.extension.passenger.position.y>.5;
  if(d>2147&&d<2153)sawMount ||=bike.position.y>1.5;
  sawCheckpoint ||=gameTest.entities.some(e=>['sandbags','checkpoint-guard','checkpoint-tracer'].includes(e.type));
  assert.equal(gameTest.state,'running',`Extended sequence survives at ${Math.floor(d)} m`);
}
assert.equal(renderedScene.getObjectByName('bridge-launch-ramp'),undefined,'First ramp removed');
assert.equal(renderedScene.getObjectByName('passenger-bounce-ramp'),undefined,'Pickup maneuver uses patrol bed rather than a ramp');
assert.ok(sawStop&&gameTest.extension.pickedUp,'Bike slows for boarding');
assert.ok(renderedScene.getObjectByName('second-passenger').visible,'Two passengers remain on bike');
assert.ok(sawWheelie&&sawMount&&sawFlight,'Passenger lifts front wheel, bike mounts pickup bed, then jumps clear');
assert.equal(sawCheckpoint,false,'No checkpoint or gunfire after police jump');
assert.ok(renderedScene.getObjectByName('police-van'),'Police van still follows the jump');
assert.ok(gameTest.extension.chasing&&renderedScene.getObjectByName('chasing-patrol-pickup'),'Police pursue after checkpoint');
assert.ok(slalomSnapshot.cars[0]>-3&&slalomSnapshot.cars[0]<3,'Single-lane car visibly changes lanes ahead');
// Verify later mode transitions and truck platform physics; isolate route hazards here.
const finaleStages=new Set();let raceAccelerating=false,sideJumps=0,freezeDistance;
while(gameTest.distance<11000){
  const f=gameTest.finale,d=gameTest.distance,s=f.stage;finaleStages.add(s);gameTest.safe();
  if(s==='escape'&&d>=2440)moveTo(-3);
  if(s==='return'&&d>=2940)moveTo(1);
  if(s==='race'&&!raceAccelerating){key('ArrowUp');raceAccelerating=true;}
  if(s==='empty'&&raceAccelerating){listeners.get('keyup')({code:'ArrowUp'});raceAccelerating=false;}
  if(s==='fork'){
    const ramp=gameTest.entities.find(e=>e.type==='detour-road');
    const p=ramp?.g.position.z??0;
    if(p<190)moveTo(2);
    if(p>=195&&p<198)key('Space');
    if(p>=205&&p<330)moveTo(1);
  }
  if(s==='top'){key('ArrowUp');}
  if(s==='vendors'&&d>=gameTest.finale.finishedAt){
    const vendor=gameTest.entities.find(e=>e.type==='vendor');
    if(vendor&&vendor.g.position.z>-38&&vendor.g.position.z<-26)key('Space');
  }
  if(s==='freeze'){if(freezeDistance===undefined)freezeDistance=d;assert.equal(d,freezeDistance,'Freeze holds world travel');}
  if(s==='side'&&f.sideGrounded){
    const platform=f.platforms.find(e=>Math.abs(e.g.position.z)<11);
    if(platform&&platform.kind!=='sand-tipper'&&platform.g.position.z>=4){key('Space');sideJumps++;}
  }
  if(s==='plane'){
    const plane=gameTest.entities.find(e=>e.type==='taxiing-plane'),fire=gameTest.entities.find(e=>e.type==='burning-highway-truck');
    if(!f.hanging&&plane?.g.position.z>-18&&plane?.g.position.z< -12)key('Space');
    if(f.hanging&&fire?.g.position.z>45)key('Space');
  }
  tick(1,16.667);
  assert.equal(gameTest.state,gameTest.distance===11000?'won':'running',`Finale state ${s} at ${d.toFixed(1)}, offset ${d-f.sideBase}, height ${f.height}, jumps ${sideJumps}`);
}
for(const s of ['escape','oncoming','return','dropoff','race','empty','dispatch','fork','top','vendors','freeze','side','done'])assert.ok(finaleStages.has(s),`${s} stage runs: ${[...finaleStages].join(", ")}`);
assert.ok(sideJumps>=4,'Manual jumps traverse varied truck heights plus sand launch');
assert.equal(gameTest.extension.chasing,false,'Police stop after crossing back');
assert.equal(gameTest.extension.passenger.visible,false,'Woman leaves bike for pole');
assert.equal(gameTest.entities.filter(e=>e.type==='pothole').length,0,'No potholes after police scene');
assert.equal(element('remaining').textContent,'0');
tick(30);assert.equal(gameTest.distance,11000,'Stops at 11 km');
element('restart').onclick();assert.equal(element('remaining').textContent,'11');assert.equal(gameTest.opening.stage,0);
while(gameTest.distance<205){gameTest.safe();bike.position.x=30;tick();}
key('Space');for(let i=0;i<30;i++){gameTest.safe();bike.position.x=30;tick();}
assert.ok(bike.position.y>2,'Bike is airborne for truck collision check');
const truck=gameTest.entities.find(e=>e.type==='opening-truck');truck.update=undefined;truck.collidable=true;bike.position.x=0;truck.g.position.set(0,0,-1);
tick();assert.equal(gameTest.state,'crashing','Jumping cannot clear a truck');
assert.equal(renderedScene.getObjectByName('rider').visible,false,'Rider separates from skidding bike');
tick(40);
const fallingRider=renderedScene.getObjectByName('tumbling-rider'),fallingPassenger=renderedScene.getObjectByName('tumbling-passenger');
assert.ok(fallingRider.position.y>3&&fallingPassenger.position.y>3,'Both men fly high');
assert.ok(fallingRider.position.distanceTo(fallingPassenger.position)>.5,'Independent trajectories');
assert.ok(Math.abs(bike.rotation.z)>1,'Bike skids on its side');
tick(90);assert.ok(Math.abs(fallingRider.position.x)>5.8&&fallingRider.position.y<-5,'Rider falls off bridge into lagoon');
while(gameTest.state==='crashing')tick();
assert.equal(gameTest.state,'running');assert.equal(gameTest.speed,65,'Automatic retry starts at speed');
assert.ok(gameTest.distance<5,'Retry starts at first movement');
assert.ok(Math.abs(gameTest.camera.position.x)<.01,'Retry camera snaps to chase view');
assert.equal(renderedScene.getObjectByName('leaping-shark'),undefined,'Shark removed');
element('restart').onclick();
while(gameTest.distance<slalomSnapshot.distance){gameTest.safe();bike.position.x=30;tick();}
assert.deepEqual(gameTest.pattern(1320),slalomSnapshot.cars,'Slalom choreography repeats exactly on retry');
moveTo(0);bike.position.x=-3.2;gameTest.finish();tick(100);
assert.ok(fallingRider.position.x>5.8,'Crashes from left lane also fly to the right lagoon');

element('restart').onclick();moveTo(1);
while(gameTest.distance<2132){gameTest.safe();bike.position.x=30;tick();}
assert.equal(gameTest.extension.pickedUp,false,'Skipped passenger');
assert.equal(gameTest.state,'crashing','Police blockade forces crash when pickup is skipped');
assert.ok(renderedScene.getObjectByName('police-checkpoint-pickup'),'Blockade appears on skipped route');
tick(90);assert.ok(bike.position.x>5.8&&bike.position.y<-5,'Whole bike swerves into lagoon');
while(gameTest.state==='crashing')tick();assert.equal(gameTest.speed,65,'Skipped-pickup crash retries instantly');
element('restart').onclick();
while(gameTest.distance<880){gameTest.safe();bike.position.x=3.2;tick();}
key('Space');tick(20);
const cut=gameTest.entities.find(e=>e.type==='pothole');cut.collidable=true;
bike.position.x=cut.g.position.x;tick();assert.equal(gameTest.state,'crashing','Long potholes cannot be jumped');
const html=await fs.readFile(new URL('./public/index.html',import.meta.url),'utf8');
assert.ok(!html.includes('id="speed"')&&!html.includes('id="dodged"')&&!html.includes('id="encounter-progress"'),'Extra statistics removed');
assert.ok(html.includes('id="player-name"')&&html.includes('id="record-panel"'),'Name prompt and high score exist');
element('restart').onclick();
key('ArrowUp');for(let i=0;i<220;i++){gameTest.holdAt(0);gameTest.safe();bike.position.x=30;tick(1,50);}
const fastSpeed=gameTest.speed;assert.ok(fastSpeed>600,'Acceleration has no former top speed');
listeners.get('keyup')({code:'ArrowUp'});key('ArrowDown');
for(let i=0;i<20;i++){gameTest.holdAt(0);gameTest.safe();bike.position.x=30;tick(1,50);}
assert.ok(gameTest.speed<fastSpeed-90,'Down arrow brakes');
for(let i=0;i<160;i++){gameTest.holdAt(0);gameTest.safe();bike.position.x=30;tick(1,50);}
assert.equal(gameTest.speed,65,'Prolonged braking stops at the starting speed');
listeners.get('keyup')({code:'ArrowDown'});
assert.ok(storage.get('bikeman-record')?.includes('Test Rider'),'Named high score persists');
const recordBeforeDebug=storage.get('bikeman-record');
for(const [id,config] of Object.entries(gameTest.CHECKPOINTS)){
  element('debug-checkpoint').value=id;element('debug-go').onclick();
  assert.equal(gameTest.distance,config.distance,`${id} starts at correct course position`);
  assert.equal(gameTest.state,'running',`${id} starts playing immediately`);
  if(id==='top')assert.equal(gameTest.finale.view,'top');
  if(id==='trucks')assert.equal(gameTest.finale.view,'side');
  if(id==='police')assert.ok(gameTest.extension.passenger.visible,'Police jump has woman aboard');
  if(id==='race')assert.equal(gameTest.extension.passenger.visible,false,'Woman has departed before race');
  tick(20);assert.equal(gameTest.state,'running',`${id} has no immediate spawn collision`);
}
gameTest.startCheckpoint('merge');gameTest.safe();gameTest.holdAt(4768);
const beforeTopCamera=gameTest.camera.position.clone();tick(5);
assert.equal(gameTest.finale.stage,'top','Road transitions to overhead traffic');
assert.ok(gameTest.camera.position.y<10&&gameTest.camera.position.distanceTo(beforeTopCamera)<10,'Camera transition does not snap overhead');
gameTest.startCheckpoint('top');
const topStartDistance=gameTest.distance;
while(gameTest.finale.stage==='top'){
  const ahead=gameTest.entities.filter(e=>e.type==='frogger-car'&&e.g.position.z<4).sort((a,b)=>b.g.position.z-a.g.position.z)[0];
  if(ahead)moveTo(ahead.openLane);
  tick();assert.equal(gameTest.state,'running','Every forward traffic group can be passed with real collisions');
}
assert.ok(gameTest.distance>=topStartDistance+560,'Bike advances overhead section without forward key presses');
assert.equal(gameTest.finale.stage,'vendors','Continuous overhead route leads to vendors');
gameTest.startCheckpoint('vendors');
const sellersStart=gameTest.distance;
assert.equal(gameTest.entities.filter(e=>e.type==='vendor'&&!e.runner).length,5,'Stalls are staggered and leave gaps');
assert.equal(gameTest.entities.filter(e=>e.type==='vendor'&&e.runner).length,4,'Runners cross from both sides');
while(gameTest.finale.stage==='vendors'){
  const ahead=gameTest.entities.filter(e=>e.type==='vendor'&&e.g.position.z<4&&e.g.position.z>-45).sort((a,b)=>b.g.position.z-a.g.position.z)[0];
  if(ahead){const blocked=gameTest.entities.filter(e=>e.type==='vendor'&&Math.abs(e.hitAt-ahead.hitAt)<1).map(e=>e.runner?(e.g.name==='right-running-vendor'?0:2):Math.round(e.g.position.x/3.2+1));moveTo([1,0,2].find(n=>!blocked.includes(n)));}
  tick();assert.equal(gameTest.state,'running','Seller stretch can be navigated without jumping');
}
assert.equal(gameTest.finale.stage,'freeze','Dodging sellers progresses to the truck sequence');
const orbitStart=gameTest.camera.position.clone();tick(20);
assert.equal(gameTest.finale.stage,'freeze','Bullet time holds while camera sweeps');
assert.ok(gameTest.camera.position.x>orbitStart.x+2,'Camera swings around toward side view');
for(const n of [0,1,2]){
  gameTest.startCheckpoint('vendors');moveTo(n);
  while(gameTest.state==='running'&&gameTest.finale.stage==='vendors')tick();
  assert.equal(gameTest.state,'crashing',`Staying in lane ${n} cannot bypass every seller`);
}
gameTest.startCheckpoint('detour');moveTo(2);
while(gameTest.distance<4468&&gameTest.state==='running')tick();
assert.equal(gameTest.state,'crashing','Right ramp ends: not jumping falls into lagoon');
gameTest.startCheckpoint('detour');moveTo(2);let rampJumped=false;
while(gameTest.distance<4585&&gameTest.state==='running'){
  const p=gameTest.distance-4250;
  if(p>=195&&!rampJumped){key('Space');rampJumped=true;}
  if(p>=205)moveTo(1);
  tick();
}
assert.equal(gameTest.state,'running','Space and left reaches middle ramp with real collision checks');
gameTest.startCheckpoint('plane');let grabbedPlane=false;
while(gameTest.finale.stage==='plane'||gameTest.finale.stage==='drop'){
  const plane=gameTest.entities.find(e=>e.type==='taxiing-plane'),fire=gameTest.entities.find(e=>e.type==='burning-highway-truck');
  if(!grabbedPlane&&!gameTest.finale.hanging&&plane?.g.position.z>-18){key('Space');}
  if(gameTest.finale.hanging){grabbedPlane=true;assert.ok(renderedScene.getObjectByName('plane-hanging-chain').visible,'Rider, passenger and bike arm hang in a chain');if(fire?.g.position.z>45)key('Space');}
  tick();assert.equal(gameTest.state,'running',`Plane clears burning truck at ${gameTest.distance} stage ${gameTest.finale.stage}`);
}
assert.ok(grabbedPlane,'Jump attaches to plane');assert.equal(gameTest.finale.stage,'quiet','Plane drop restores highway');
assert.equal(gameTest.finale.view,'chase','Standard camera after plane drop');
assert.equal(gameTest.entities.filter(e=>e.type==='car').length,0,'Quiet stretch has no regular cars');
gameTest.startCheckpoint('storm');let darkSeen=false,flashSeen=false;
while(gameTest.finale.stage==='storm'){
  darkSeen ||=gameTest.finale.darkness>.9;flashSeen ||=gameTest.finale.darkness<.1;
  const next=gameTest.entities.filter(e=>e.type==='storm-puddle'&&e.g.position.z<7).sort((a,b)=>b.g.position.z-a.g.position.z)[0];if(next)moveTo(next.safeLane);
  tick();assert.equal(gameTest.state,'running','Remembered puddle gaps remain navigable in rain');
}
assert.ok(darkSeen&&flashSeen,'Storm alternates darkness and lightning reveals');
gameTest.startCheckpoint('storm');moveTo(0);
while(gameTest.state==='running'&&gameTest.finale.stage==='storm')tick();
assert.equal(gameTest.state,'crashing','Guessing a flooded lane causes a fall');
gameTest.startCheckpoint('empty');
key('ArrowUp');tick(90);listeners.get('keyup')({code:'ArrowUp'});
assert.ok(gameTest.speed>100,'Post-race ride can be above cruising speed');
key('ArrowDown');assert.equal(gameTest.speed,65,'First post-race Down press immediately restores normal speed');
tick(5);assert.equal(gameTest.speed,65,'Holding first Down press maintains cruising speed');
listeners.get('keyup')({code:'ArrowDown'});key('ArrowDown');tick();
assert.equal(gameTest.speed,65,'Subsequent Down press cannot brake below starting speed');
listeners.get('keyup')({code:'ArrowDown'});
gameTest.startCheckpoint('oncoming');
while(gameTest.distance<2900){
  const incoming=gameTest.entities.filter(e=>e.type==='oncoming-car'&&e.g.position.z>-100&&e.g.position.z<12);
  const clearance=n=>Math.min(150,...incoming.filter(e=>Math.abs(e.g.position.x-(-8.3+(n+2)*3.2))<1).map(e=>-e.g.position.z-e.radius));
  if(clearance(gameTest.lane)<65){
    const best=[-2,-3,-4].sort((a,b)=>clearance(b)-clearance(a))[0];
    if(clearance(best)>clearance(gameTest.lane)+15)moveTo(best);
  }
  tick();assert.equal(gameTest.state,'running',`Heavy oncoming traffic has a navigable route at ${gameTest.distance.toFixed(1)}`);
}
moveTo(-2);
while(gameTest.distance<2945){tick();assert.equal(gameTest.state,'running','Can approach return gap');}
moveTo(1);tick(30);
assert.equal(gameTest.state,'running','Can leave blocked carriageway through return gap');
assert.equal(gameTest.extension.chasing,false,'Police leave after exit');
gameTest.startCheckpoint('oncoming');
tick();
const pursuers=gameTest.entities.filter(e=>e.type==='police-chaser');
assert.equal(pursuers.length,2,'Both police vehicles follow into opposite lanes');
assert.ok(pursuers.every(e=>e.collidable===false&&e.g.position.z>=8),'Police remain behind and cannot hit after crossing');
assert.ok(gameTest.entities.some(e=>e.type==='oncoming-car'&&e.collidable!==false),'Incoming cars remain collision hazards');
for(const e of gameTest.entities)if(e.type!=='police-chaser')e.collidable=false;
key('ArrowDown');for(let i=0;i<300;i++){gameTest.holdAt(2400);gameTest.safe();tick();}listeners.get('keyup')({code:'ArrowDown'});
assert.equal(gameTest.speed,65,'Holding brake in opposite lanes maintains starting speed');
assert.equal(gameTest.state,'running','Police cannot cause a crash at minimum speed');
assert.ok(gameTest.extension.chasing&&pursuers.every(e=>e.g.position.z>=8),'Police continue visual pursuit');
const incoming=gameTest.entities.find(e=>e.type==='oncoming-car');
incoming.update=undefined;incoming.collidable=true;incoming.g.position.set(bike.position.x,0,0);
tick();assert.equal(gameTest.state,'crashing','Oncoming car still causes crash');
gameTest.startCheckpoint('trucks');gameTest.finish();
while(gameTest.state==='crashing')tick();
assert.equal(gameTest.distance,5010,'Crash retries selected checkpoint');
assert.equal(gameTest.finale.view,'side','Retry restores selected camera and platform state');
assert.equal(storage.get('bikeman-record'),recordBeforeDebug,'Debug starts never inflate high score');
console.log('PASS: opening route, deterministic slalom, pickup and skip branches, passenger wheelie, pickup-bed jump, progressively faster slalom, checkpoint removal, police van and pursuit, no later potholes, lagoon crashes, controls, 11 km win, and instant retry.');
console.log('PASS: all 23 debug checkpoints, state and camera restoration, safe starts, selected-scene retry, and high-score isolation.');

// Keep the whole bike visible while steering onto either edge in portrait view.
globalThis.innerWidth=390;globalThis.innerHeight=844;
gameTest.startCheckpoint('opening');gameTest.camera.aspect=390/844;gameTest.camera.updateProjectionMatrix();
for(const lane of [2,-1,2]){moveTo(lane);key('Space');for(let i=0;i<90;i++){gameTest.holdAt(0);gameTest.safe();tick();gameTest.camera.updateMatrixWorld();renderedScene.updateMatrixWorld();const bounds=new THREE.Box3().setFromObject(bike);for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){const point=new THREE.Vector3(x,y,z).project(gameTest.camera);assert.ok(Math.abs(point.x)<.95&&Math.abs(point.y)<.95,`Mobile shoulder bike stays within the frame: ${lane} ${i} ${point.x} ${point.y}`);}}}
console.log('PASS: portrait bike framing through right lane and left median steering.');

gameTest.startCheckpoint('vendors');gameTest.holdAt(5100);gameTest.safe();tick();
const entryArrow=renderedScene.getObjectByName('middle-lane-truck-arrow');assert.ok(entryArrow?.visible,'Middle-lane truck arrow appears before entry');assert.equal(entryArrow.parent.position.x,0,'Arrow points at the center truck');
const arrowOpacity=entryArrow.children[1].material.opacity;gameTest.holdAt(5100);gameTest.safe();tick();assert.notEqual(entryArrow.children[1].material.opacity,arrowOpacity,'Truck arrow flashes');
gameTest.startCheckpoint('trucks');for(let i=0;i<100;i++){gameTest.safe();tick();}assert.equal(renderedScene.getObjectByName('middle-lane-truck-arrow').visible,false,'Arrow disappears after truck entry');
console.log('PASS: middle-lane truck-entry arrow appears, flashes, and clears after entry.');
