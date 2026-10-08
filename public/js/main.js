import * as THREE from '../vendor/three.module.js?v=1.0.2';
import { createEncounters } from './encounters.js?v=1.0.2';
import { createOpening } from './opening.js?v=1.0.2';
import { createPrologue } from './prologue.js?v=1.0.2';
import { createCrash } from './crash.js?v=1.0.2';
import { createExtension } from './extension.js?v=1.0.2';
import { createFinale } from './finale.js?v=1.0.2';

const $ = id => document.getElementById(id);
const scene = new THREE.Scene();
scene.background = new THREE.Color('#9cb7ce');
scene.fog = new THREE.Fog('#9cb7ce', 100, 390);
const renderer = new THREE.WebGLRenderer({ canvas: $('game'), antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor('#9cb7ce');
const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, .1, 650);
scene.add(new THREE.HemisphereLight('#e2efff', '#68727a', 2));
const sun = new THREE.DirectionalLight('#fff3dc', 2.5);
sun.position.set(-15, 30, 12); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -25, right: 25, top: 30, bottom: -45, near: 1, far: 90 });
sun.shadow.bias = -.0005; scene.add(sun);

const materials = new Map();
const bridgeCut={enabled:{value:0},z:{value:0},halfLength:{value:35}};
function mat(color, roughness = .85) {
  if (!materials.has(color)) {
    const material=new THREE.MeshStandardMaterial({color,roughness});
    if(['#969b9d','#454b50','#e4c361','#eeeeea'].includes(color)) {
      material.onBeforeCompile=shader=>{
        shader.uniforms.cutEnabled=bridgeCut.enabled;shader.uniforms.cutZ=bridgeCut.z;shader.uniforms.cutHalfLength=bridgeCut.halfLength;
        shader.vertexShader='varying vec3 cutWorld;\n'+shader.vertexShader;
        shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ncutWorld=(modelMatrix*vec4(position,1.0)).xyz;');
        shader.fragmentShader='varying vec3 cutWorld; uniform float cutEnabled; uniform float cutZ; uniform float cutHalfLength;\n'+shader.fragmentShader;
        shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(cutEnabled>0.5 && cutWorld.y<0.15 && cutWorld.x>-5.2 && cutWorld.x<5.2 && abs(cutWorld.z-cutZ)<cutHalfLength) discard;');
      };
    }
    materials.set(color,material);
  }
  return materials.get(color);
}
function mesh(geometry, color, parent = scene, position = [0, 0, 0]) {
  const m = new THREE.Mesh(geometry, mat(color));
  m.position.set(...position); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
const box = (w,h,d,color,parent=scene,p=[0,0,0]) => mesh(new THREE.BoxGeometry(w,h,d),color,parent,p);
const sphere = (r,color,parent,p) => mesh(new THREE.SphereGeometry(r,12,10),color,parent,p);
function rod(a, b, radius, color, parent) {
  const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
  const m = mesh(new THREE.CylinderGeometry(radius,radius,start.distanceTo(end),8),color,parent);
  m.position.copy(start).add(end).multiplyScalar(.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),end.sub(start).normalize()); return m;
}

// Third Mainland Bridge reference: lagoon, divided carriageways, painted
// concrete parapets, and the distinctive tall solar streetlights.
const WORLD_LENGTH=420, COURSE_LENGTH=11000, START_SPEED=65;
box(1200,.3,1000,'#547e8d',scene,[0,-6,-350]);
box(23,.8,480,'#969b9d',scene,[-5,-.5,-210]);
box(10.4,.12,480,'#454b50',scene,[0,0,-210]);
box(10,.12,480,'#454b50',scene,[-11.5,0,-210]);
for(const x of [-4.82,4.82,-6.65,-16.2]) box(.1,.02,480,'#e4c361',scene,[x,.075,-210]);
const markings=[];
for(let z=-400;z<20;z+=10) for(const x of [-1.6,1.6,-9.9,-13.1]) markings.push(box(.13,.02,4,'#eeeeea',scene,[x,.08,z]));
const scenery=[];
const medianSections=[];
const medianLamps=[];
for(let z=-396;z<24;z+=4) {
  const g=new THREE.Group();g.position.z=z;scene.add(g);
  for(const x of [5.35,-5.55,-16.75]) {
    // Each four-meter section alternates white and charcoal concrete.
    const white=box(x===-5.55?1.3:.55,.92,2,'#dfded7',g,[x,.48,0]);
    const black=box(x===-5.55?1.3:.55,.92,2,'#252d32',g,[x,.48,2]);
    if(x===-5.55)medianSections.push({g,white,black});
    if(x!==-5.55)box(.085,.09,4,'#b5bec1',g,[x,1.14,1]);
  }
  scenery.push(g);
}
for(let z=-390;z<24;z+=30) {
  const g=new THREE.Group();g.position.z=z;scene.add(g);
  g.userData.bridgePole=true;
  for(const x of [-5.55,5.65]) {
    if(x<0&&(z+90)%180!==0)continue;
    if(x<0)medianLamps.push({g});
    rod([x,0,0],[x,9.4,0],.055,'#a9b4b9',g);
    const arms=x<0?[-1,1]:[-1];
    for(const side of arms) {
      rod([x,8.7,0],[x+side*1.7,9.5,0],.05,'#a9b4b9',g);
      const panel=box(1.45,.055,.62,'#253b4c',g,[x+side*1.45,9.45,0]);panel.rotation.z=side*.32;
      box(.58,.08,.3,'#f1ead7',g,[x+side*1.1,8.8,0]);
    }
  }
  // Bridge pillars can be seen beyond the edges over the lagoon.
  for(const x of [-14,3])box(1.2,5,1.8,'#89979b',g,[x,-3,0]);
  scenery.push(g);
}
// Distant Lagos skyline across the lagoon, with haze instead of coastal hills.
for(let i=0;i<44;i++) {
  const height=3+(i*7%15), x=35+i*5.8;
  box(3+i%3,height,4,'#7e939f',scene,[x,-5+height/2,-260-(i%5)*12]);
}
for(let i=0;i<16;i++) {
  const cloud=new THREE.Group();cloud.position.set(-180+i*26,42+(i%4)*9,-220-(i%3)*60);scene.add(cloud);
  for(let j=0;j<4;j++) {
    const puff=sphere(5+j%2*2,'#d2dce3',cloud,[j*6,Math.sin(j)*2,0]);puff.scale.set(1.5,.48,1);puff.castShadow=false;
  }
}
const waterLines=[];
for(let i=0;i<70;i++) {
  const ripple=box(3+i%5,.018,.08,'#7099a6',scene,[(i%2===0?-1:1)*(22+i%11*8),-5.82,-i*6]);
  ripple.castShadow=false;waterLines.push(ripple);
}

// A chunky street motorbike inspired by the rear-view reference.
const cyclist = new THREE.Group(); scene.add(cyclist);
cyclist.name='motorbike';
const wheels=[];
for(const z of [-1.05,1.05]) {
  const w=new THREE.Group();w.position.set(0,.56,z);cyclist.add(w);
  const tire=mesh(new THREE.TorusGeometry(.4,.16,12,32),'#151a20',w);tire.rotation.y=Math.PI/2;
  for(const x of [-.13,.13]) {
    const rim=mesh(new THREE.TorusGeometry(.3,.035,6,24),'#a4adb1',w,[x,0,0]);rim.rotation.y=Math.PI/2;
    for(let i=0;i<6;i++){const a=i*Math.PI/3;rod([x,0,0],[x,Math.sin(a)*.29,Math.cos(a)*.29],.027,'#737e84',w);}
  }
  const hub=mesh(new THREE.CylinderGeometry(.14,.14,.3,12),'#5f6c74',w);hub.rotation.z=Math.PI/2;
  wheels.push(w);
}
for(const side of [-1,1]) {
  rod([side*.2,.58,1.05],[side*.24,1.12,.2],.065,'#46515a',cyclist);
  rod([side*.19,.58,-1.05],[side*.22,1.48,-.7],.06,'#a8b5bd',cyclist);
  rod([side*.26,.62,.94],[side*.28,1.25,.6],.055,'#e8c04d',cyclist);
}
box(.6,.48,.66,'#424c53',cyclist,[0,.83,0]);
for(let i=0;i<5;i++)box(.64,.035,.5,'#a3aeb5',cyclist,[0,.68+i*.08,-.04]);
const tank=sphere(.48,'#b92f2f',cyclist,[0,1.32,-.4]);tank.scale.set(.8,.65,1.2);
box(.62,.15,1.03,'#20252a',cyclist,[0,1.32,.39]);
// Short rear fender and exposed tail light; no rear storage box.
box(.28,.055,.42,'#ab282b',cyclist,[0,1.12,.96]);
box(.4,.12,.07,'#ff3c29',cyclist,[0,1.22,1.23]);
box(.3,.16,.025,'#e8e6d4',cyclist,[0,.99,1.25]);
for(const side of [-1,1]) {
  box(.13,.1,.1,'#efa734',cyclist,[side*.4,1.19,1.13]);
  rod([side*.34,.67,.1],[side*.34,.67,.85],.08,'#909ea7',cyclist);
  rod([side*.34,.67,.85],[side*.34,.67,1.1],.1,'#303940',cyclist);
  rod([side*.27,.74,.16],[side*.52,.74,.16],.035,'#b1bec4',cyclist);
}
box(.3,.15,.5,'#b92f2f',cyclist,[0,1.08,-1.04]);
rod([-.45,1.63,-.73],[.45,1.63,-.73],.04,'#293139',cyclist);
const headlight=sphere(.19,'#eee4c0',cyclist,[0,1.46,-.9]);headlight.scale.z=.3;
for(const side of [-1,1]) {
  rod([side*.4,1.6,-.72],[side*.56,1.98,-.77],.02,'#b0bdc2',cyclist);
  const mirror=sphere(.11,'#26333c',cyclist,[side*.56,2,-.77]);mirror.scale.set(1.2,.65,.35);
}
const rider=new THREE.Group();rider.name='rider';cyclist.add(rider);
const skin='#653b27',shirtColor='#eee2bd';
const torso=box(.43,.73,.25,shirtColor,rider,[0,1.96,.13]);torso.rotation.x=-.28;
box(.36,.19,.28,'#293d53',rider,[0,1.49,.3]);
rod([0,2.24,-.02],[0,2.36,-.09],.068,skin,rider);
const head=sphere(.205,skin,rider,[0,2.5,-.12]);head.scale.set(.8,1.13,.9);
for(const side of [-1,1])sphere(.044,skin,rider,[side*.17,2.5,-.1]);
const helmet=new THREE.Group();helmet.name='bouncing-helmet';helmet.position.set(0,2.64,-.12);rider.add(helmet);
const shell=mesh(new THREE.SphereGeometry(.235,16,10,0,Math.PI*2,0,Math.PI*.62),'#d9a538',helmet);shell.scale.y=.85;
box(.065,.022,.36,'#253640',helmet,[0,.18,0]);
rod([-.2,-.06,0],[-.14,-.29,.08],.012,'#292b2d',helmet);
rod([.2,-.06,0],[.14,-.29,.08],.012,'#292b2d',helmet);
const shirtTails=[];
for(const side of [-1,1]) {
  const tail=new THREE.Group();tail.position.set(side*.11,1.78,.28);rider.add(tail);
  const fabric=box(.23,.035,.57,shirtColor,tail,[0,0,.24]);fabric.rotation.x=-.13;shirtTails.push(tail);
}
for(const side of [-1,1]) {
  rod([side*.19,2.18,.08],[side*.34,1.96,-.2],.074,shirtColor,rider);
  rod([side*.34,1.96,-.2],[side*.45,1.64,-.71],.048,skin,rider);
  sphere(.06,skin,rider,[side*.45,1.64,-.71]);
  rod([side*.15,1.51,.33],[side*.33,1.1,-.22],.075,'#293d53',rider);
  rod([side*.33,1.1,-.22],[side*.43,.77,.17],.057,'#293d53',rider);
  box(.15,.11,.3,'#252424',rider,[side*.43,.76,.06]);
}
// The pillion passenger keeps hold of a swinging briefcase.
const suitPassenger=new THREE.Group();suitPassenger.name='suited-passenger';cyclist.add(suitPassenger);
box(.45,.7,.3,'#253349',suitPassenger,[0,1.93,.85]);
box(.14,.53,.025,'#e9ebdf',suitPassenger,[0,1.99,.681]);
box(.045,.32,.03,'#b34739',suitPassenger,[0,2.02,.656]);
sphere(.2,'#71432d',suitPassenger,[0,2.48,.82]);
const hair=sphere(.203,'#232323',suitPassenger,[0,2.55,.83]);hair.scale.y=.45;
for(const side of [-1,1]) {
  rod([side*.16,1.57,.83],[side*.38,1.11,.64],.08,'#253349',suitPassenger);
  rod([side*.38,1.11,.64],[side*.42,.78,.85],.066,'#253349',suitPassenger);
  box(.18,.12,.29,'#171c26',suitPassenger,[side*.42,.75,.77]);
}
rod([-.2,2.17,.8],[-.3,1.88,.28],.07,'#253349',suitPassenger);
rod([.2,2.17,.8],[.45,1.69,.91],.07,'#253349',suitPassenger);
sphere(.065,'#71432d',suitPassenger,[.45,1.67,.91]);
const briefcase=new THREE.Group();briefcase.name='briefcase';briefcase.position.set(.47,1.65,.94);suitPassenger.add(briefcase);
box(.42,.36,.15,'#6b432a',briefcase,[.08,-.29,0]);
rod([-.03,-.05,0],[-.03,-.13,0],.018,'#292824',briefcase);
rod([.16,-.05,0],[.16,-.13,0],.018,'#292824',briefcase);
rod([-.03,-.05,0],[.16,-.05,0],.018,'#292824',briefcase);
box(.08,.045,.017,'#d6b35d',briefcase,[.08,-.23,.085]);
let lane=1, distance=0, dodged=0, speed=START_SPEED, state='intro', spawnTimer=0, boost=false,potholeTimer=0,roadHazardNumber=0;
let accelerating=false,braking=false,playerName='',bestName='Rider';
let jumpTime=-1,bikeHeight=0,riderHeight=0;
const BIKE_FLIGHT=1.05,RIDER_FLIGHT=1.4;
function jump() {
  if(state==='running'&&finale.key('Space'))return;
  if(state==='running'&&jumpTime<0){jumpTime=0;chirp(420,.12);}
}
function updateJump(dt) {
  if(jumpTime<0){bikeHeight=0;riderHeight=0;return;}
  jumpTime+=dt;
  const arc=(duration,height)=>jumpTime>=duration?0:4*height*(jumpTime/duration)*(1-jumpTime/duration);
  bikeHeight=arc(BIKE_FLIGHT,3.25);riderHeight=arc(RIDER_FLIGHT,4.5);
  if(jumpTime>=RIDER_FLIGHT){jumpTime=-1;bikeHeight=0;riderHeight=0;chirp(180,.08);}
}
let best=0; try { best=Number(localStorage.getItem('bikeman-best'))||0; } catch {}
try{const record=JSON.parse(localStorage.getItem('bikeman-record')||'null');if(record){best=record.score;bestName=record.name;}playerName=localStorage.getItem('bikeman-player')||'';}catch{}
function refreshRecord(){$('high-score').textContent=`${Math.floor(best)} m`;$('high-score-name').textContent=bestName;}
refreshRecord();$('player-name').value=playerName;
function saveRecord(){if(distance>=best){best=Math.floor(distance);bestName=playerName;try{localStorage.setItem('bikeman-best',String(best));localStorage.setItem('bikeman-record',JSON.stringify({name:bestName,score:best}));}catch{}refreshRecord();}}
const entities=[];
const laneX = n => n===-1?-5.55:n<-1?-8.3+(n+2)*3.2:(n-1)*3.2;
const medianHeight=x=>.94*THREE.MathUtils.smoothstep(-x,4.7,5.2)*(1-THREE.MathUtils.smoothstep(-x,6,6.6));
let carNumber=0;

function obstacle(n,z,type) {
  const g=new THREE.Group(); g.position.set(laneX(n),0,z); scene.add(g);
  g.name=`obstacle-${type}`;
  let driver,passenger,mouth;
  if(type==='bus') {
    // Danfo-style minibus with genuinely deformed panels, rust, and an open door.
    const bodyGeometry=new THREE.BoxGeometry(2.15,1.25,4.7,5,3,8);
    const vertices=bodyGeometry.attributes.position;
    for(let i=0;i<vertices.count;i++){
      const x=vertices.getX(i),y=vertices.getY(i),zz=vertices.getZ(i);
      if(Math.abs(x)>1&&y<.4)vertices.setX(i,x-Math.sign(x)*.18*Math.max(0,1-Math.abs(zz-.7)/1.2));
      if(zz>2.3)vertices.setZ(i,zz-.13*Math.max(0,1-Math.abs(x+.5)/.8));
    }
    bodyGeometry.computeVertexNormals();mesh(bodyGeometry,'#dfad22',g,[0,1.12,0]);
    box(2.05,.12,4.5,'#e7be39',g,[0,2.57,0]);
    for(const side of [-1,1]) {
      box(.075,.95,4.4,'#dcab22',g,[side*1.02,2.04,0]);
      for(const zz of [-1.55,-.45,.65])box(.085,.63,.86,'#263d47',g,[side*1.065,2.05,zz]);
      box(.025,.1,4.56,'#252c2d',g,[side*1.085,1.38,0]);
      box(.03,.1,4.5,'#252c2d',g,[side*1.085,1.16,0]);
      for(let i=0;i<5;i++) {const rust=box(.035,.11,.25,'#8d6030',g,[side*1.082,.68+i%2*.2,-1.8+i*.8]);rust.rotation.x=.2+i*.4;}
      for(const zz of [-1.48,1.48]) {const w=mesh(new THREE.CylinderGeometry(.43,.43,.2,14),'#192028',g,[side*1.1,.47,zz]);w.rotation.z=Math.PI/2;w.name='bus-wheel';}
      rod([side*1.02,2.2,1.7],[side*1.35,2.2,2],.035,'#58646a',g);
      box(.18,.28,.12,'#353f45',g,[side*1.35,2.2,2]);
    }
    // Positive Z is the bus FRONT: it drives straight toward the player.
    box(2.06,.16,.08,'#d4a128',g,[0,1.53,2.28]);
    box(2.06,.1,.08,'#d4a128',g,[0,2.46,2.28]);
    for(const x of [-.99,.99])box(.08,.9,.08,'#d4a128',g,[x,1.99,2.28]);
    box(.88,.72,.025,'#263d47',g,[.52,2.03,2.3]);
    box(.07,.68,.12,'#242e33',g,[0,2.05,2.34]);
    box(1.25,.25,.06,'#31393c',g,[0,.91,2.37]);
    const bumper=box(2.23,.14,.17,'#818482',g,[0,.58,2.39]);bumper.rotation.z=.04;
    for(const x of [-.79,.79])sphere(.14,'#fff0b0',g,[x,1.24,2.36]);
    box(.4,.16,.05,'#e5e4cc',g,[0,.68,2.5]);
    // Open windshield lets the driver's expressive face remain visible.
    driver=new THREE.Group();driver.position.set(-.49,1.43,1.9);g.add(driver);
    box(.48,.45,.27,'#cfdfd7',driver,[0,.1,0]);
    sphere(.23,'#6f4029',driver,[0,.55,.06]);
    for(const x of [-.08,.08]) {
      sphere(.047,'#fff4e4',driver,[x,.6,.26]);sphere(.023,'#171a1b',driver,[x,.6,.301]);
      const brow=box(.115,.027,.035,'#231b19',driver,[x,.68,.26]);brow.rotation.z=x<0?-.25:.25;
    }
    mouth=sphere(.085,'#261512',driver,[0,.43,.267]);mouth.scale.set(.8,1.25,.35);
    box(.09,.025,.025,'#f7e8cc',driver,[0,.47,.294]);
    const wheel=mesh(new THREE.TorusGeometry(.2,.027,6,16),'#20292d',driver,[0,.04,.31]);wheel.rotation.x=.4;
    rod([-.23,.2,0],[-.16,.06,.3],.055,'#6f4029',driver);
    rod([.23,.2,0],[.16,.06,.3],.055,'#6f4029',driver);
    // Passenger hanging outside the right-side door, holding the top rail.
    box(.08,1.3,.82,'#263239',g,[1.11,1.72,1.08]);
    const door=box(.07,1.35,.8,'#d5a72d',g,[1.4,1.68,1.53]);door.rotation.y=-.95;
    rod([1.15,2.48,.72],[1.15,2.48,1.43],.045,'#747b76',g);
    passenger=new THREE.Group();passenger.name='conductor';passenger.position.set(1.35,1.9,.55);g.add(passenger);
    const passengerBody=box(.35,.56,.25,'#ba442e',passenger,[0,.24,0]);passengerBody.rotation.z=-.2;
    sphere(.17,'#70422e',passenger,[.06,.67,0]);
    rod([-.13,.45,0],[-.18,1.03,-.3],.048,'#70422e',passenger);
    rod([.15,.43,0],[.37,.2,.06],.048,'#70422e',passenger);
    for(const side of [-1,1]) {
      rod([side*.1,-.02,0],[side*.16,-.47,.09],.065,'#263a54',passenger);
      box(.14,.09,.24,'#292725',passenger,[side*.16,-.49,.12]);
    }
  } else if(type==='car') {
    const color=['#d5d8d4','#efbd34','#66899a'][carNumber++%3];
    box(1.6,.55,2.7,color,g,[0,.62,0]); box(1.3,.6,1.4,color,g,[0,1.1,-.12]);
    box(1.13,.38,.035,'#294d4d',g,[0,1.17,.6]); box(1.13,.36,.035,'#294d4d',g,[0,1.17,-.84]);
    for(const x of [-.81,.81]) for(const zz of [-.8,.8]) { const w=mesh(new THREE.CylinderGeometry(.32,.32,.16,12),'#263d38',g,[x,.35,zz]); w.rotation.z=Math.PI/2; }
    for(const x of [-.56,.56]) box(.22,.13,.05,'#f08263',g,[x,.68,1.38]);
    box(.5,.15,.05,'#fff1d0',g,[0,.58,1.38]);
  } else {
    box(.75,.1,.75,'#3b5147',g,[0,.1,0]);
    mesh(new THREE.ConeGeometry(.29,.85,12),'#ed743e',g,[0,.55,0]);
    mesh(new THREE.CylinderGeometry(.15,.2,.18,12),'#fff0cf',g,[0,.57,0]);
  }
  const entity={g,type,radius:type==='bus'?2.8:type==='car'?2:.8,
    width:type==='bus'?1.65:type==='car'?1.18:.65,height:type==='bus'?2.8:type==='car'?1.65:1,
    trafficSpeed:type==='bus'?-30:type==='car'?38:0,driver,passenger,mouth,screamed:false,passed:false};
  entities.push(entity);return entity;
}
let trafficNumber=0;
function spawnRow(z=-230) {
  const n=trafficNumber++%3;
  const e=obstacle(n,z,'car');
  e.trafficSpeed=24+trafficNumber%4*3;
  e.nextLane=n===1?(trafficNumber%2===0?0:2):1;
  e.targetLane=n;e.changeAt=-135-trafficNumber%3*12;e.changed=false;e.fromX=laneX(n);e.changeTime=0;
  // Signal before cutting into an adjacent lane.
  e.signal=box(.13,.12,.06,'#ffb22c',e.g,[(n===2?-1:1)*.61,.75,1.39]);
  e.signal.visible=false;
}
const encounters=createEncounters({THREE,scene,box,sphere,rod,mesh,obstacle,entities,laneX,medianSections,chirp,scream});
function pothole(n,z=-195) {
  const g=new THREE.Group();g.name='obstacle-pothole';g.position.set(laneX(n),0,z);scene.add(g);
  const outline=new THREE.Shape();
  for(let i=0;i<24;i++) {
    const a=i*Math.PI/12,r=i%2?1.03:1.42;
    const x=Math.sin(a)*r,z=Math.cos(a)*r*31.7;
    if(i===0)outline.moveTo(x,z);else outline.lineTo(x,z);
  }
  outline.closePath();
  const hole=mesh(new THREE.ShapeGeometry(outline),'#030405',g,[0,.095,0]);hole.rotation.x=-Math.PI/2;hole.name='black-jagged-hole';
  hole.material=new THREE.MeshBasicMaterial({color:'#030405',side:THREE.DoubleSide});
  const e={g,type:'pothole',radius:45,width:1.5,height:.55,noJump:true,trafficSpeed:0,passed:false};
  entities.push(e);return e;
}
const opening=createOpening({THREE,scene,box,sphere,rod,mesh,obstacle,pothole,entities,laneX,getDistance:()=>distance});
for(const g of scenery)g.userData.startZ=g.position.z;
for(const m of markings)m.userData.startZ=m.position.z;
const prologue=createPrologue({THREE,scene,box,sphere,rod,cyclist,rider,suitPassenger,scenery,wheels,markings});
const extension=createExtension({THREE,scene,cyclist,box,sphere,rod,mesh,obstacle,entities,getDistance:()=>distance,getLane:()=>lane,getSpeed:()=>speed,setSpeed:v=>{speed=v;},onFailure:()=>finish('swerve'),chirp});
const crash=createCrash({THREE,scene,cyclist,rider,suitPassenger,extraPassenger:extension.passenger,box,sphere,mesh});
const finale=createFinale({THREE,scene,cyclist,passenger:extension.passenger,box,sphere,rod,mesh,obstacle,entities,getDistance:()=>distance,getLane:()=>lane,getSpeed:()=>speed,setDistance:d=>{distance=d;},setLane:n=>{lane=n;},onFailure:mode=>finish(mode),stopPolice:()=>extension.stopChase(),chirp});
function clearEntities() {
  for(const {g} of entities) { scene.remove(g); g.traverse(m=>{if(m.geometry)m.geometry.dispose();}); }
  entities.length=0;
}
function visible(id, show) { $(id).classList.toggle('hidden',!show); }
function mobileChase(){return innerWidth/innerHeight<1.2||(typeof matchMedia==='function'&&matchMedia('(pointer:coarse)').matches);}
function start() {
  playerName=($('player-name').value||'').trim().slice(0,24);
  if(!playerName){$('player-name').focus();return;}
  try{localStorage.setItem('bikeman-player',playerName);}catch{}
  clearEntities();state='boarding';accelerating=false;braking=false;boost=false;
  prologue.pickup();for(const id of ['intro','end','won','paused','hud','speedometer','course-counter','record-panel','game-version'])visible(id,false);visible('touch',true);
}
function beginRide() {
  overheadBlend=0;
  crash.reset();
  extension.reset();
  finale.reset();
  bridgeCut.enabled.value=0;
  prologue.clear(state==='boarding');
  clearEntities(); lane=1; distance=0; dodged=0; speed=START_SPEED; boost=false;accelerating=false;braking=false; spawnTimer=.8;potholeTimer=.9;roadHazardNumber=0; state='running';
  jumpTime=-1;bikeHeight=0;riderHeight=0;rider.position.set(0,0,0);rider.rotation.set(0,0,0);suitPassenger.position.set(0,0,0);suitPassenger.rotation.set(0,0,0);trafficNumber=0;encounters.reset();
  // Reset lamp positions as well as entities so replay has identical choreography.
  for(const g of scenery) {if(g.userData.startZ===undefined)g.userData.startZ=g.position.z;g.position.z=g.userData.startZ;}
  for(const m of markings)m.position.z=m.userData.startZ;
  carNumber=0;opening.begin();
  cyclist.position.set(0,0,0); cyclist.rotation.set(0,0,0);
  camera.position.set(0,mobileChase()?3.8:3.3,mobileChase()?11:6.7);camera.lookAt(0,2.05,-24);camera.fov=72;camera.updateProjectionMatrix();
  for(const id of ['intro','end','paused','won','game-version']) visible(id,false);
  for(const id of ['hud','touch','ride-hint','speedometer','course-counter','record-panel']) visible(id,true);
  visible('bus-warning',false); chirp(360,.1);
  $('remaining').textContent='11';
  visible('encounter-warning',false);
}
function finish(mode='tumble') {
  if(state!=='running')return;
  state='crashing'; boost=false;accelerating=false;braking=false; saveRecord();crash.start(mode);
  visible('end',false); visible('touch',false); visible('ride-hint',false);visible('bus-warning',false); chirp(110,.3);
  visible('encounter-warning',false);
}
function restartRide(){beginRide();}
function win() {
  distance=COURSE_LENGTH;state='won';boost=false;
  saveRecord();
  $('remaining').textContent='0';
  for(const id of ['touch','ride-hint','bus-warning','encounter-warning'])visible(id,false);
  visible('won',true);chirp(880,.4);
}
function pause() {
  if(state==='running') {state='paused';boost=false;accelerating=false;braking=false;visible('paused',true);visible('touch',false);visible('encounter-warning',false);}
  else if(state==='paused') {state='running';visible('paused',false);visible('touch',true);}
  $('pause').setAttribute('aria-label',state==='paused'?'Resume game':'Pause game');
}
function move(dir) {
  if(state!=='running')return;
  if(finale.key(dir<0?'ArrowLeft':'ArrowRight'))return;
  const bounds=finale.stage==='waiting'?[extension.fenced?0:-1,2]:finale.laneBounds;
  lane=THREE.MathUtils.clamp(lane+dir,...bounds);
}
$('start').onclick=start; $('restart').onclick=restartRide; $('resume').onclick=pause; $('pause').onclick=pause;
$('play-again').onclick=beginRide;
$('left').onclick=()=>move(-1); $('right').onclick=()=>move(1);
$('jump').onclick=jump;
$('boost').addEventListener('pointerdown',e=>{if(state==='running'){if(finale.view==='top'){finale.key('ArrowUp');return;}boost=true;$('boost').setPointerCapture(e.pointerId);}});
for(const event of ['pointerup','pointercancel','lostpointercapture']) $('boost').addEventListener(event,()=>{boost=false;});
function brake(){
  if(state!=='running')return;
  if(finale.key('ArrowDown'))return;
  if(finale.takeCruiseReset()){speed=START_SPEED;accelerating=false;boost=false;braking=false;}
  else braking=true;
}
$('brake').addEventListener('pointerdown',e=>{brake();$('brake').setPointerCapture(e.pointerId);});
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('brake').addEventListener(event,()=>{braking=false;});
window.addEventListener('keydown', e=> {
  if(e.code==='Enter'&&state==='intro'){e.preventDefault();start();return;}
  if(document.activeElement===$('player-name'))return;
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(e.code)) e.preventDefault();
  if(e.repeat)return;
  if(state==='running'&&finale.key(e.code)){e.preventDefault();return;}
  if(e.code==='ArrowUp')accelerating=true;
  if(e.code==='ArrowDown')brake();
  if((e.code==='ShiftLeft'||e.code==='ShiftRight')&&state==='running')boost=true;
  if(e.code==='ArrowLeft'||e.code==='KeyA')move(-1);
  if(e.code==='ArrowRight'||e.code==='KeyD')move(1);
  if(e.code==='Space') { if(state==='intro')start();else if(state==='over'||state==='won')restartRide();else if(state==='running')jump(); }
  if(e.code==='Enter'&&(state==='over'||state==='won'))restartRide();
  if((e.code==='Escape'||e.code==='KeyP')&&(state==='running'||state==='paused'))pause();
});
window.addEventListener('keyup',e=>{if(e.code==='ShiftLeft'||e.code==='ShiftRight')boost=false;if(e.code==='ArrowUp')accelerating=false;if(e.code==='ArrowDown')braking=false;});
window.addEventListener('blur',()=>{boost=false;accelerating=false;braking=false;if(state==='running')pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='running')pause();});
let swipeX=null;
$('game').addEventListener('touchstart',e=>{swipeX=e.changedTouches[0].clientX;},{passive:true});
$('game').addEventListener('touchend',e=>{if(swipeX!==null){const dx=e.changedTouches[0].clientX-swipeX;if(Math.abs(dx)>25)move(Math.sign(dx));swipeX=null;}},{passive:true});
let sound=false,audio;
$('sound').onclick=()=> {sound=!sound; $('sound').innerHTML=`♪ <span>${sound?'ON':'OFF'}</span>`; $('sound').setAttribute('aria-label',sound?'Disable sound':'Enable sound'); if(sound)chirp(520,.12);};
function chirp(freq,duration) {
  if(!sound)return; audio??=new (window.AudioContext||window.webkitAudioContext)();
  if(audio.state==='suspended')audio.resume();
  const oscillator=audio.createOscillator(),gain=audio.createGain();
  oscillator.connect(gain);gain.connect(audio.destination);oscillator.type='sine';oscillator.frequency.setValueAtTime(freq,audio.currentTime);
  gain.gain.setValueAtTime(.06,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);
  oscillator.start();oscillator.stop(audio.currentTime+duration);
}
function scream() {
  if(!sound)return;
  audio??=new (window.AudioContext||window.webkitAudioContext)();
  if(audio.state==='suspended')audio.resume();
  // A short, stylized vocal yell: falling pitch through vowel formants.
  const voice=audio.createOscillator(),formant=audio.createBiquadFilter(),gain=audio.createGain();
  voice.type='sawtooth';voice.frequency.setValueAtTime(330,audio.currentTime);
  voice.frequency.exponentialRampToValueAtTime(150,audio.currentTime+.55);
  formant.type='bandpass';formant.frequency.value=950;formant.Q.value=1.5;
  voice.connect(formant);formant.connect(gain);gain.connect(audio.destination);
  gain.gain.setValueAtTime(.001,audio.currentTime);gain.gain.linearRampToValueAtTime(.14,audio.currentTime+.06);
  gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.6);voice.start();voice.stop(audio.currentTime+.6);
}
function resize() {camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);}
addEventListener('resize',resize);resize();
let last=performance.now(),elapsed=0,overheadBlend=0,matrixFrom=null;
// Sparse peripheral streaks reinforce speed without hiding the traffic.
const streaks=[];
const streakMaterial=new THREE.MeshBasicMaterial({color:'#dce9f2',transparent:true,opacity:.16,depthWrite:false});
for(let i=0;i<22;i++) {
  const s=new THREE.Mesh(new THREE.BoxGeometry(.025,.025,5+i%4),streakMaterial);
  s.position.set((i%2?1:-1)*(6+i%4),1+i%5*.6,-i*5);scene.add(s);streaks.push(s);
}
spawnRow(-120);spawnRow(-210);
function animate(now) {
  requestAnimationFrame(animate); const dt=Math.min((now-last)/1000,.05);last=now;
  const riding=state==='running', preview=state==='intro';
  if(riding||preview||state==='boarding')elapsed+=dt;
  if(preview||state==='boarding'){if(prologue.update(dt,elapsed))beginRide();}
  if(state==='crashing'&&crash.update(dt))restartRide();
  if(riding) {
    // Speed is controlled by the player, with no upper clamp.
    if(finale.movementSpeed===null&&!extension.boarding)speed=Math.max(START_SPEED,speed+((accelerating?55:0)+(boost?75:0)-(braking?95:0))*dt);
    distance=Math.min(COURSE_LENGTH,distance+(finale.movementSpeed??speed)*dt); spawnTimer-=dt;potholeTimer-=dt;
    opening.advance(distance);
    extension.advance(distance);extension.update(dt,elapsed);
    finale.update(dt,bikeHeight);
    if(extension.forcedLane!==null)lane=extension.forcedLane;
    if(extension.fenced&&lane<0)lane=0;
    if(finale.complete&&spawnTimer<=0){spawnRow(-150);spawnTimer=.8;}
    // Cycle through every lane so no lane stays permanently safe after cars merge.
    if(finale.complete)encounters.advance(distance-finale.finishedAt);
    $('remaining').textContent=(Math.ceil((COURSE_LENGTH-distance)/10)/100).toFixed(2);
    $('boost').classList.toggle('active',boost);
    visible('ride-hint',distance<350);
  }
  $('speed-reading').textContent=Math.round((state==='running'||state==='paused'?(finale.movementSpeed??speed):0)*3.6).toString();
  const scroll=(riding?(finale.movementSpeed??speed):0)*dt;
  if(riding)prologue.travel(scroll);
  for(const m of markings){m.position.z+=scroll;if(m.position.z>20)m.position.z-=WORLD_LENGTH;}
  for(const g of scenery){
    g.userData.previousZ=g.position.z;g.position.z+=scroll;if(g.position.z>24)g.position.z-=WORLD_LENGTH;
    if(g.userData.bridgePole){const clear=finale.clearRampRange;g.visible=!(clear&&g.position.z>=clear.far&&g.position.z<=clear.near);}
  }
  for(const m of waterLines){m.position.z+=scroll*.5;if(m.position.z>20)m.position.z-=WORLD_LENGTH;}
  for(const s of streaks){s.visible=riding;s.position.z+=scroll*1.6;if(s.position.z>10)s.position.z-=120;}
  if(riding&&finale.complete)encounters.update(dt,scroll,speed);
  const previousX=cyclist.position.x;
  const previousHeight=bikeHeight;
  if(riding) {
    if(finale.view==='chase')updateJump(dt);else{jumpTime=-1;bikeHeight=0;riderHeight=0;}
    bikeHeight=Math.max(bikeHeight,extension.height);riderHeight=Math.max(riderHeight,extension.height);
    if(finale.height!==null){bikeHeight=finale.height;riderHeight=finale.height;}
    wheels.forEach(w=>w.rotation.x-=scroll/.56);
    const target=laneX(lane), difference=target-cyclist.position.x;
    cyclist.position.x+=difference*(1-Math.exp(-dt*16));
    cyclist.rotation.z=THREE.MathUtils.lerp(cyclist.rotation.z,-difference*.13,1-Math.exp(-dt*8));
    cyclist.position.y=finale.elevation+medianHeight(cyclist.position.x)+bikeHeight+Math.sin(elapsed*50)*.012;
    cyclist.rotation.x=extension.pitch||(jumpTime>=0&&jumpTime<BIKE_FLIGHT?-.18*Math.sin(jumpTime/BIKE_FLIGHT*Math.PI*2):0);
    rider.position.y=riderHeight-bikeHeight;
    rider.position.z=jumpTime>=0?.22*Math.sin(Math.min(jumpTime/RIDER_FLIGHT,1)*Math.PI):0;
    rider.rotation.x=jumpTime>=0?-.12*Math.sin(jumpTime/RIDER_FLIGHT*Math.PI):0;
    suitPassenger.position.y=(riderHeight-bikeHeight)*.88;
    suitPassenger.rotation.z=Math.sin(elapsed*8)*.04;
    briefcase.rotation.z=Math.sin(elapsed*11)*.2;
    helmet.position.y=2.64+Math.abs(Math.sin(elapsed*10))*.13+(jumpTime>=0?.12:0);
    helmet.rotation.z=Math.sin(elapsed*9)*.055;
    shirtTails.forEach((tail,i)=>{
      tail.rotation.x=-.3+Math.sin(elapsed*19+i*2)*.3;
      tail.rotation.z=Math.sin(elapsed*23+i*3)*.15;
      tail.scale.z=1+Math.sin(elapsed*17+i)*.16;
    });
  }
  let oncoming=false;
  if(riding)finale.pose();
  const stormDark=finale.darkness;
  scene.background.set(stormDark>.5?'#080f19':'#9cb7ce');scene.fog.color.copy(scene.background);
  scene.fog.near=stormDark>.5?2:100;scene.fog.far=stormDark>.5?22:390;
  sun.intensity=stormDark>.5?.15:stormDark>0?5:2.5;
  for(let i=entities.length-1;i>=0;i--) {
    const e=entities[i],previousZ=e.g.position.z,previousEntityX=e.g.position.x+(e.collisionXOffset||0);
    if(e.retired){removeEntity(i);continue;}
    e.g.position.z+=Math.max(0,scroll-(riding?(e.trafficSpeed||0)*dt:0));
    if(riding&&e.type==='car'&&e.signal) {
      if(!e.changed&&e.g.position.z>e.changeAt) {e.changed=true;e.targetLane=e.nextLane;e.fromX=e.g.position.x;}
      if(e.changed) {
        e.changeTime+=dt;e.signal.visible=e.changeTime<1.4&&Math.sin(elapsed*20)>0;
        const t=THREE.MathUtils.clamp((e.changeTime-.45)/1.15,0,1);
        e.g.position.x=THREE.MathUtils.lerp(e.fromX,laneX(e.targetLane),t*t*(3-2*t));
        e.g.rotation.y=-Math.sin(t*Math.PI)*.22;
      }
    }
    if(riding&&e.update)e.update(dt,elapsed);
    if(e.type==='bus') {
      if(!e.special)e.g.rotation.z=Math.sin(elapsed*8+i)*.012;
      e.passenger.rotation.z=(e.special?-.45:0)+Math.sin(elapsed*10+i)*.15;
      e.driver.rotation.z=Math.sin(elapsed*13)*.08;
      e.mouth.scale.y=1.1+Math.abs(Math.sin(elapsed*16))*.8;
      if(riding&&e.trafficSpeed<0&&e.g.position.z>-85&&e.g.position.z<-4) {
        oncoming=true;
        if(!e.screamed){e.screamed=true;scream();}
      }
    }
    // Sweep movement and jump height together; jumping clears low obstacles.
    const dz=e.g.position.z-previousZ;
    const crossing=dz>0?THREE.MathUtils.clamp((cyclist.position.z-previousZ)/dz,0,1):0;
    const closestZ=THREE.MathUtils.lerp(previousZ,e.g.position.z,crossing)-cyclist.position.z;
    const crossingX=THREE.MathUtils.lerp(previousX,cyclist.position.x,crossing);
    const entityX=THREE.MathUtils.lerp(previousEntityX,e.g.position.x+(e.collisionXOffset||0),crossing);
    const crossingHeight=THREE.MathUtils.lerp(previousHeight,bikeHeight,crossing)+medianHeight(crossingX);
    if(riding&&e.collidable!==false&&Math.abs(closestZ)<e.radius&&Math.abs(entityX-crossingX)<e.width&&(e.noJump||e.type.includes('truck')||crossingHeight<e.height)) {
      finish();break;
    }
    if(riding&&!e.passed&&e.collidable!==false&&e.g.position.z>e.radius) {e.passed=true;dodged++;}
    if(e.keepUntil?distance>e.keepUntil:e.g.position.z>Math.max(16,(e.radius||0)+3))removeEntity(i);
  }
  let medianDanger=false;
  if(state==='running'&&finale.active&&((previousX>-5.55&&cyclist.position.x<=-5.55)||(previousX<-5.55&&cyclist.position.x>=-5.55))&&(finale.medianGapZ===null||Math.abs(finale.medianGapZ)>22))finish();
  bridgeCut.enabled.value=finale.roadCut?1:0;bridgeCut.z.value=finale.roadCut?.z??0;bridgeCut.halfLength.value=finale.roadCut?.length??35;
  if(!opening.complete)for(const s of medianSections){
    const gap=opening.medianGapZ,show=gap===null||Math.abs(s.g.position.z-gap)>9;
    s.white.visible=show;s.black.visible=show;
  }
  if(finale.active)for(const s of medianSections){const gap=finale.medianGapZ,show=gap===null||Math.abs(s.g.position.z-gap)>22;s.white.visible=show;s.black.visible=show;}
  if(state==='running')for(const {g} of medianLamps) {
    if(!g.visible)continue;
    const z=g.position.z,previousZ=g.userData.previousZ;
    if(z>-90&&z<-2&&lane===-1)medianDanger=true;
    if(finale.medianGapZ!==null&&Math.abs(z-finale.medianGapZ)<22)continue;
    if(Math.abs(cyclist.position.x+5.55)<.7&&((previousZ<0&&z>=0&&z-previousZ<20)||Math.abs(z)<.65)) {finish();break;}
  }
  visible('median-warning',state==='running'&&medianDanger);
  if(state==='running'&&distance>=COURSE_LENGTH)win();
  visible('bus-warning',state==='running'&&oncoming);
  visible('opening-cue',state==='running'&&(!opening.complete||extension.active||finale.active));
  const cinematic=preview||state==='boarding';
  const blend=state==='boarding'?prologue.cameraBlend:0;
  const introOffset=cinematic?3.8*(1-blend):0;
  const crashing=state==='crashing',focus=crashing?crash.focus:null;
  const view=crashing||cinematic?'chase':finale.view;
  const carriageway=lane<=-2?-11.5:0;
  const crossing=finale.stage==='escape'||finale.stage==='return';
  const narrowView=mobileChase();
  const chaseY=narrowView?3.8:3.3,chaseZ=narrowView?11:6.7;
  const followX=crossing||narrowView?cyclist.position.x:carriageway+(cyclist.position.x-carriageway)*.3;
  const lookX=crossing||narrowView?cyclist.position.x:carriageway+(cyclist.position.x-carriageway)*.18;
  if(state==='running')overheadBlend=THREE.MathUtils.clamp(overheadBlend+(view==='top'?dt:-dt)/1.6,0,1);
  const topBlend=crashing||cinematic||view==='side'?0:overheadBlend;
  const smoothTop=topBlend*topBlend*(3-2*topBlend);
  camera.up.set(0,1-smoothTop,-smoothTop).normalize();
  const desired=crashing?new THREE.Vector3(focus.x*.6,5.5,12):view==='top'?new THREE.Vector3(0,46,-27):view==='side'?new THREE.Vector3(18,7,-14):new THREE.Vector3(introOffset+(cinematic?cyclist.position.x*.3*blend:followX),chaseY+finale.elevation,cinematic?(narrowView?13-2*blend:9-2.3*blend):chaseZ);
  const orbit=crashing?null:finale.orbitProgress;
  if(orbit!==null){
    if(!matrixFrom)matrixFrom=camera.position.clone();
    const p=orbit*orbit*(3-2*orbit);
    desired.copy(matrixFrom).lerp(new THREE.Vector3(18,7,-14),p);
    desired.x+=Math.sin(orbit*Math.PI)*7;desired.y+=Math.sin(orbit*Math.PI)*3;desired.z+=Math.sin(orbit*Math.PI)*5;
  }else matrixFrom=null;
  if(topBlend>0){desired.set(followX,chaseY+finale.elevation,chaseZ).lerp(new THREE.Vector3(0,46,-27),smoothTop);}
  if(state==='boarding'||finale.stage==='freeze')camera.position.copy(desired);else camera.position.lerp(desired,1-Math.exp(-dt*(crossing||narrowView?15:3)));
  if(narrowView&&!cinematic&&!crashing&&view==='chase'&&topBlend===0)camera.position.x=cyclist.position.x;
  if(crashing)camera.lookAt(focus);else if(view==='side'){
    const p=orbit??1;
    camera.lookAt(new THREE.Vector3(lookX,2.05,-24).lerp(new THREE.Vector3(0,3,-14),p));
    if(orbit!==null)camera.rotateZ(Math.sin(orbit*Math.PI)*.15);
  }else {
    const target=new THREE.Vector3(introOffset+(cinematic?cyclist.position.x*.18*blend:lookX),cinematic?1.4+.65*blend:2.05+finale.elevation,-24);
    target.lerp(new THREE.Vector3(0,0,-27),smoothTop);camera.lookAt(target);
  }
  const targetFov=view==='top'?68:view==='side'?75:cinematic?68+4*blend:Math.min(98,72+Math.max(0,speed-START_SPEED)*.12);
  camera.fov=THREE.MathUtils.lerp(camera.fov,targetFov,1-Math.exp(-dt*3));camera.updateProjectionMatrix();
  renderer.render(scene,camera);
}
function removeEntity(i) {const e=entities[i];scene.remove(e.g);e.g.traverse(m=>{if(m.geometry)m.geometry.dispose();});entities.splice(i,1);}
camera.position.set(3.8,3.3,9);
requestAnimationFrame(animate);
