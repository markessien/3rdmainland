import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createFinale} from './src/finale.js';
globalThis.document={getElementById:()=>({textContent:''})};
function fixture(){
  const scene=new THREE.Scene(),cyclist=new THREE.Group(),passenger=new THREE.Group(),entities=[],failures=[];
  scene.add(cyclist);passenger.name='second-passenger';cyclist.add(passenger);
  const suited=new THREE.Group();suited.name='suited-passenger';cyclist.add(suited);
  let d=2395,lane=0,speed=65,stopped=false;
  const mesh=(geometry,color,parent=scene,p=[0,0,0])=>{const m=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color}));m.position.set(...p);parent.add(m);return m;};
  const box=(w,h,l,c,parent,p)=>mesh(new THREE.BoxGeometry(w,h,l),c,parent,p);
  const sphere=(r,c,parent,p)=>mesh(new THREE.SphereGeometry(r,6,6),c,parent,p);
  const rod=(a,b,r,c,parent)=>mesh(new THREE.CylinderGeometry(r,r,1,5),c,parent,a);
  const obstacle=(n,z)=>{const g=new THREE.Group();g.position.set(n>=0?(n-1)*3.2:-8.3+(n+2)*3.2,0,z);scene.add(g);const e={g,type:'car',width:1.18,radius:2,height:1.65,collidable:true};entities.push(e);return e;};
  const f=createFinale({THREE,scene,cyclist,passenger,box,sphere,rod,mesh,obstacle,entities,getDistance:()=>d,getLane:()=>lane,getSpeed:()=>speed,setDistance:x=>d=x,setLane:x=>lane=x,onFailure:m=>failures.push(m||'tumble'),stopPolice:()=>stopped=true,chirp(){}});
  const step=(dt=1/60,h=0)=>{f.update(dt,h);for(const e of entities)if(e.update)e.update(dt);};
  return{f,scene,entities,failures,step,set d(x){d=x},get d(){return d},set lane(x){lane=x},set speed(x){speed=x},get stopped(){return stopped}};
}
function reachRace(x){
  x.step();x.d=2485;x.lane=-3;x.step();assert.equal(x.f.stage,'oncoming');
  x.d=2900;x.step();x.d=2940;x.lane=1;x.step();assert.ok(x.stopped,'Returning stops police');
  x.step(1.2);x.d+=71;x.step();assert.equal(x.f.stage,'race');
}
const blocked=fixture();blocked.step();blocked.d=2485;blocked.step();assert.deepEqual(blocked.failures,['swerve'],'Missing escape gap fails');
const slow=fixture();reachRace(slow);slow.step(6);assert.deepEqual(slow.failures,['tumble'],'Losing race makes rivals crash into bike');
const traffic=fixture();traffic.d=2505;traffic.lane=-3;traffic.f.debugStart('oncoming');traffic.step();
assert.equal(traffic.scene.getObjectByName('oncoming-bus').children.filter(m=>m.name==='bus-passenger').length,14,'Bus has fourteen visible passengers');
assert.equal(traffic.scene.getObjectByName('oncoming-bales').children.filter(m=>m.name==='tied-bale').length,12,'Truck has twelve stacked bales');
assert.ok(traffic.scene.getObjectByName('oncoming-gwagon'),'G-Wagon in oncoming route');
assert.equal(traffic.entities.filter(e=>e.g.name==='oncoming-convoy').length,4,'Four flashing convoy vehicles');
assert.equal(traffic.entities.filter(e=>e.type==='return-roadblock').length,9,'Exit queue blocks all three incoming lanes');
const again=fixture();again.d=2505;again.lane=-3;again.f.debugStart('oncoming');again.step();
assert.deepEqual(traffic.entities.map(e=>[e.g.name,e.hitAt,e.g.position.x]),again.entities.map(e=>[e.g.name,e.hitAt,e.g.position.x]),'Heavy traffic repeats on retry');
const racers=fixture();reachRace(racers);
const rivals=racers.entities.filter(e=>e.type==='race-rival');
assert.deepEqual(rivals.map(e=>e.g.position.x),[-3.2,3.2],'Racers flank the bike');
assert.ok(rivals.every(e=>e.g.getObjectByName('racer-finger-gesture')),'Both racers gesture');
const initial=rivals.map(e=>e.g.position.z);racers.speed=110;racers.step(.5);
assert.ok(rivals[0].g.position.z>initial[0]&&rivals[1].g.position.z<initial[1],'Racers surge forward and back');
function reachFork(x){reachRace(x);x.speed=160;x.step(1);assert.equal(x.f.stage,'empty');x.d+=301;x.step();assert.equal(x.f.stage,'dispatch');x.d+=501;x.step();assert.equal(x.f.stage,'fork');return x.d;}
const wrong=fixture(),fork=reachFork(wrong);wrong.lane=0;wrong.d=fork+121;wrong.step();assert.deepEqual(wrong.failures,['swerve'],'Left fork is a dead end');
const mini=fixture(),start=reachFork(mini);mini.lane=2;mini.d=start+215;assert.ok(mini.f.elevation<-4.9,'Right ramp descends');mini.d=start+520;mini.step();assert.equal(mini.f.view,'top');
const topStart=mini.d;mini.f.key('ArrowUp');mini.f.key('ArrowDown');assert.equal(mini.d,topStart,'Keys do not step world distance');
assert.equal(mini.f.movementSpeed,48,'Overhead section advances automatically at a faster speed');
const topCars=mini.entities.filter(e=>e.type==='frogger-car');assert.equal(topCars.length,10,'Five groups of two cars leave a lane open');
const xs=topCars.map(e=>e.g.position.x);mini.d+=32;mini.step(1);
assert.deepEqual(topCars.map(e=>e.g.position.x),xs,'Cars drive forward without crossing sideways');
mini.d=topStart+560;mini.step();assert.equal(mini.f.stage,'vendors');
mini.d+=280;mini.step(1/60,2.5);assert.equal(mini.f.stage,'freeze');assert.equal(mini.f.movementSpeed,0);
mini.step(1.5);assert.equal(mini.f.stage,'side');mini.d=mini.f.sideBase+29;
for(let i=0;i<15&&mini.failures.length===0;i++)mini.step(.1);
assert.ok(mini.failures.length,'Missing truck-roof jump fails');
console.log('PASS: escape failure, race loss, right detour/dead end, automatic forward traffic, freeze, and truck-gap failure.');
