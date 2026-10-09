import {createAftermath} from './aftermath.js?v=1.0.5';
export function createFinale({THREE,scene,cyclist,passenger,box,sphere,rod,mesh,obstacle,entities,getDistance,getLane,getSpeed,setDistance,setLane,onFailure,stopPolice,chirp}) {
  const aftermath=createAftermath({THREE,scene,cyclist,box,sphere,rod,mesh,obstacle,entities,getDistance,getLane,onFailure,chirp});
  const clamp=THREE.MathUtils.clamp,lerp=THREE.MathUtils.lerp;
  let stage='waiting',nextIncoming=-110,incomingNumber=0,timer=0,raceLead=0,raceFailed=false;
  let emptyEnd=0,dispatchStart=0,forkStart=0,topBase=0,topTime=0;
  let freeze=0,freezeStartY=5,sideBase=0,sideY=5,sideVelocity=0,grounded=false,platforms=[],landings=new Set();
  let gap=null,drop=null,rivals=[],miniCars=[],finishedAt=0,heavyTrafficMade=false,cruiseResetPending=false,jumpedRamp=false,sandLaunched=false;
  const cue=text=>{document.getElementById('opening-cue').textContent=text;};
  function add(g,type,hit,properties={}) {
    scene.add(g);g.position.z=getDistance()-hit;
    const e={g,type,width:1,radius:1,height:1,collidable:false,passed:false,...properties};
    e.update=()=>{g.position.z=getDistance()-hit;};entities.push(e);return e;
  }
  function removePolice(){stopPolice();for(const e of entities)if(e.type==='police-chaser'){e.retired=true;e.collidable=false;}}
  function incoming(){
    const n=-2-incomingNumber++%3,hit=nextIncoming+160;
    const e=obstacle(n,-220,'car');e.type='oncoming-car';e.noJump=true;e.hitAt=hit;e.g.name='opposite-carriageway-traffic';e.g.rotation.y=Math.PI;
    e.update=()=>{e.g.position.z=(getDistance()-hit)*1.6;};e.g.position.z=(getDistance()-hit)*1.6;
    nextIncoming+=70;
  }
  function heavyTraffic(){
    heavyTrafficMade=true;
    const schedule=[['bus',-2,2555],['bales',-4,2620],['gwagon',-3,2675],['convoy',-2,2730],['convoy',-3,2755],['convoy',-4,2780],['convoy',-2,2805]];
    for(const [kind,n,hit] of schedule){
      if(hit<getDistance()-15)continue;
      const g=new THREE.Group();g.name=`oncoming-${kind}`;g.position.x=-8.3+(n+2)*3.2;
      const length=kind==='bus'?9:kind==='bales'?10:4.8;
      const color=kind==='bus'?'#e5b632':kind==='bales'?'#b84932':'#202d39';
      box(2.35,1.15,length,color,g,[0,1.15,0]);
      if(kind==='bus'){
        box(2.3,.18,9,'#e9d4a3',g,[0,3.25,0]);
        for(const side of [-1,1])for(let i=0;i<7;i++){
          box(.08,1.25,1,'#263e4c',g,[side*1.16,2.5,-3.6+i*1.15]);
          const head=sphere(.19,['#74452f','#422f25','#9a6546'][i%3],g,[side*1.21,2.58,-3.6+i*1.15]);head.name='bus-passenger';
          box(.08,.35,.34,['#ed7545','#629bc5','#78a24b'][i%3],g,[side*1.22,2.25,-3.6+i*1.15]);
        }
        box(2.1,1.2,.08,'#264350',g,[0,2.5,4.51]);
      }else if(kind==='bales'){
        box(2.25,1.7,2,'#a83d29',g,[0,2.05,4]);
        box(1.95,.7,.05,'#29424c',g,[0,2.35,5.02]);
        for(let layer=0;layer<3;layer++)for(let i=0;i<4;i++){
          const bale=box(2.5,.95,1.8,layer%2?'#bca56e':'#d1bc87',g,[0,2.05+layer*.95,-3.3+i*1.85]);bale.name='tied-bale';
          for(const x of [-.85,.85])box(.05,1,.07,'#574a35',g,[x,2.05+layer*.95,-2.37+i*1.85]);
        }
        for(const z of [-3.5,0,2.5]){rod([-1.3,1.7,z],[-1.3,4.55,z],.04,'#423827',g);rod([-1.3,4.55,z],[1.3,4.55,z],.04,'#423827',g);rod([1.3,4.55,z],[1.3,1.7,z],.04,'#423827',g);}
      }else{
        box(2.2,1.15,kind==='gwagon'?3.6:2.8,color,g,[0,2.1,-.4]);
        box(1.95,.8,.06,'#78949f',g,[0,2.2,kind==='gwagon'?1.42:1.02]);
        for(const side of [-1,1])box(.06,.75,2.6,'#55717e',g,[side*1.12,2.2,-.5]);
        if(kind==='gwagon'){sphere(.5,'#1b232a',g,[0,1.6,-2.55]);box(2,.3,.12,'#89999d',g,[0,.95,2.46]);}
      }
      for(const side of [-1,1])for(const z of [-length*.32,length*.32]){const w=mesh(new THREE.CylinderGeometry(.48,.48,.25,12),'#192128',g,[side*1.2,.48,z]);w.rotation.z=Math.PI/2;}
      for(const x of [-.8,.8])box(.4,.25,.08,'#fff0bf',g,[x,1.2,length/2+.05]);
      const beacons=kind==='convoy'?[-.45,.45].map((x,i)=>box(.5,.2,.35,i?'#258dff':'#ff3535',g,[x,2.82,0])):[];
      const e=add(g,'oncoming-car',hit,{hitAt:hit,width:1.45,radius:length/2,height:5,noJump:true,collidable:true});
      e.update=()=>{g.position.z=(getDistance()-hit)*1.6;beacons.forEach((b,i)=>b.visible=Math.floor(getDistance()/5)%2===i);};e.update();
    }
    // This queue closes every incoming lane beyond the exit: take the median gap.
    for(const n of [-2,-3,-4])for(let i=0;i<3;i++){
      const e=obstacle(n,-220,'car');const hit=3010+i*9;e.type='return-roadblock';e.noJump=true;e.g.name='blocked-opposite-exit';e.hitAt=hit;
      e.update=()=>{e.g.position.z=getDistance()-hit;};e.update();
    }
  }
  function release(){
    removePolice();stage='dropoff';timer=0;cue('BACK ON THE RIGHT — SHE’S GRABBING THE LAMP POLE');
    const pole=new THREE.Group();pole.name='passenger-dropoff-pole';pole.position.x=5.8;
    rod([0,0,0],[0,9,0],.09,'#a4b3b9',pole);box(1.4,.08,.6,'#35485b',pole,[0,9,0]);
    add(pole,'dropoff-pole',getDistance()+10,{keepUntil:getDistance()+160});
    const woman=passenger.clone(true);woman.name='woman-hanging-on-pole';woman.visible=true;woman.rotation.set(0,0,0);scene.add(woman);
    const start=cyclist.position.clone();start.z+=1.35;
    add(woman,'hanging-passenger',getDistance()+10,{keepUntil:getDistance()+160});
    drop={woman,pole,start};passenger.visible=false;
  }
  function race(){
    stage='race';timer=0;raceLead=0;raceFailed=false;cue('“RACE!” — HOLD ↑. GET AHEAD OR THEY TAKE YOU DOWN');
    setLane(1);rivals=[];
    for(const n of [0,2]){
      const e=obstacle(n,-2,'car');e.type='race-rival';e.collidable=false;e.g.name='waving-race-rival';e.keepUntil=11000;
      const arm=new THREE.Group();arm.position.set(n===0?.85:-.85,1.1,0);e.g.add(arm);
      sphere(.15,'#76462f',arm,[0,.38,0]);rod([0,.18,0],[n===0?.25:-.25,.75,0],.05,'#76462f',arm);
      const hand=new THREE.Group();hand.name='racer-finger-gesture';hand.position.set(n===0?.25:-.25,.75,0);arm.add(hand);
      sphere(.09,'#76462f',hand,[0,0,0]);rod([0,0,0],[0,.3,0],.025,'#76462f',hand);
      for(const x of [-.07,.07])box(.065,.09,.08,'#76462f',hand,[x,.03,.02]);
      e.update=()=>{
        arm.rotation.z=Math.sin(timer*9)*(n===0?1:-1)*.3;
        e.g.position.z=raceLead+Math.sin(timer*3+(n===0?0:Math.PI))*5;
        if(raceFailed){e.g.position.x=lerp(n===0?-3.2:3.2,cyclist.position.x,clamp((timer-5)/.7,0,1));e.g.position.z=lerp(-2+raceLead,0,clamp((timer-5)/.7,0,1));}
      };rivals.push(e);
    }
  }
  function dispatch(){
    stage='dispatch';dispatchStart=getDistance();cue('DISPATCH RIDERS! WATCH THEIR WEAVING — FIND A GAP');
    for(let i=0;i<18;i++){
      const g=cyclist.clone(true);g.name='weaving-dispatch-rider';
      g.getObjectByName('suited-passenger').visible=false;g.getObjectByName('second-passenger').visible=false;
      g.scale.setScalar(.85);box(.7,.6,.65,['#c55031','#38a56c','#4e76b5'][i%3],g,[0,1.6,1.12]);
      const hit=dispatchStart+110+i*18;
      const e=add(g,'dispatch-rider',hit,{width:.75,radius:1.3,height:2.6,noJump:true,collidable:true});
      e.hitAt=hit;
      e.update=()=>{
        const d=getDistance(),phase=(d-dispatchStart)/45+i*2.1;
        g.position.z=(d-hit)*.8;g.position.x=Math.sin(phase)*3.35;g.rotation.z=-Math.cos(phase)*.24;
      };
    }
  }
  function fork(){
    stage='fork';forkStart=getDistance();jumpedRamp=false;cue('RIGHT RAMP DOWN — THEN SPACE + LEFT TO THE MIDDLE RAMP');
    const g=new THREE.Group();g.name='right-down-and-up-detour';
    for(const [start,end,x,name] of [[100,215,3.2,'ending-right-ramp'],[239,330,0,'middle-landing-ramp']]){
      const points=[],indices=[];
      for(let i=0;i<=24;i++){
        const offset=lerp(start,end,i/24),y=-5*Math.sin((offset-100)/230*Math.PI);
        points.push(x-1.6,y,-offset,x+1.6,y,-offset);
        if(i<24){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
      }
      const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));geometry.setIndex(indices);geometry.computeVertexNormals();
      const road=mesh(geometry,'#474c50',g);road.name=name;road.material=new THREE.MeshStandardMaterial({color:'#474c50',side:THREE.DoubleSide});
      box(3.15,.08,.6,'#e7bd4c',g,[x,-5*Math.sin(((name==='ending-right-ramp'?end:start)-100)/230*Math.PI)+.06,-(name==='ending-right-ramp'?end:start)]);
    }
    add(g,'detour-road',forkStart,{keepUntil:forkStart+400});
    const life=new THREE.Group();life.name='ramp-bubbles-and-fish';
    const bubbles=[];
    for(let i=0;i<42;i++){
      const b=sphere(.06+(i%4)*.025,'#bceaf5',life);
      b.material=b.material.clone();b.material.transparent=true;b.material.opacity=.5;b.castShadow=false;
      b.name='streaming-bubble';bubbles.push(b);
    }
    const fish=[];
    for(let i=0;i<8;i++){
      const f=new THREE.Group();f.name='lagoon-fish';life.add(f);
      const body=sphere(.22,['#e7ac53','#68c2ce','#a9c5de'][i%3],f,[0,0,0]);body.scale.set(2,.75,.7);
      const tail=mesh(new THREE.ConeGeometry(.22,.35,3),'#4b92a7',f,[-.5,0,0]);tail.rotation.z=Math.PI/2;
      sphere(.035,'#182838',f,[.3,.06,.13]);fish.push(f);
    }
    let waterTime=0;
    const water=add(life,'ramp-aquatic-life',forkStart,{keepUntil:forkStart+400});
    water.update=dt=>{
      waterTime+=dt||0;const p=(getDistance()-forkStart-100)/230;
      life.visible=p>=0&&p<=1;
      life.position.set(lerp(3.2,0,clamp((getDistance()-forkStart-200)/49,0,1)),-5*Math.sin(clamp(p,0,1)*Math.PI),0);
      bubbles.forEach((b,i)=>b.position.set(Math.sin(i*2.4)*1.05,.2+((waterTime*2+i*.19)%3),1+((i*.83+waterTime*12)%18)));
      fish.forEach((f,i)=>{f.position.set((i%2?1:-1)*(2.4+Math.sin(waterTime*1.4+i)*.7),.4+Math.sin(waterTime*2+i)*.5,-7-i*3+Math.sin(waterTime+i)*2);f.rotation.y=(i%2?0:Math.PI)+Math.sin(waterTime*3+i)*.12;});
    };water.update(0);
    for(let i=0;i<5;i++){
      const n=[1,2,1,0,1][i],hit=forkStart+345+i*27,e=obstacle(n,-150,'car');
      e.type='merge-traffic';e.noJump=true;e.update=()=>{e.g.position.z=getDistance()-hit;};e.g.position.z=getDistance()-hit;
    }
  }
  function overhead(){
    stage='top';topBase=getDistance();topTime=0;miniCars=[];
    cue('TRAFFIC AHEAD — KEEP RIDING. ← → CHOOSE THE OPEN LANE');
    for(const e of entities)if(['oncoming-car','merge-traffic','dispatch-rider'].includes(e.type))e.retired=true;
    for(let r=0;r<5;r++)for(const n of [0,1,2]){
      if(n===[1,2,0,1,2][r])continue;
      const z=-70-r*30,e=obstacle(n,z,'car');e.g.name='overhead-forward-traffic';e.type='frogger-car';e.noJump=true;
      e.keepUntil=topBase+560;e.wave=r;e.openLane=[1,2,0,1,2][r];
      // Cars travel forward at 20 m/s; the bike passes them at 40 m/s.
      e.update=()=>{e.g.position.z=z+(getDistance()-topBase)-topTime*20;};
      miniCars.push(e);
    }
  }
  function vendors(){
    stage='vendors';setDistance(topBase+120);cyclist.position.z=0;setLane(1);cue('SELLERS ON BOTH SIDES — DODGE THE RUNNERS AND STALLS');
    for(const e of miniCars)e.retired=true;
    const sellers=[{hit:175,from:-5.55,to:6.1},{hit:211,lane:0},{hit:235,from:6.1,to:-5.55},{hit:269,lane:2},{hit:292,from:-5.55,to:6.1},{hit:329,from:6.1,to:-5.55},{hit:357,lane:1},{hit:390,lane:0},{hit:390,lane:1}];
    for(let i=0;i<sellers.length;i++){
      const spec=sellers[i],runner=spec.from!==undefined;
      const g=new THREE.Group();g.name=runner?(spec.from<0?'median-running-vendor':'right-running-vendor'):'roadside-vendor';g.position.x=runner?spec.from:(spec.lane-1)*3.2;
      box(.36,.65,.25,['#e6b84e','#b44938','#50968a'][i%3],g,[0,1.05,0]);sphere(.18,'#75482e',g,[0,1.62,0]);
      const legs=[];for(const x of [-.1,.1])legs.push(rod([x,.75,0],[x,.12,0],.06,'#34435a',g));
      box(.8,.13,.55,'#b28e56',g,[0,1.05,.45]);for(let i=0;i<5;i++)sphere(.1,'#edb134',g,[(i-2)*.14,1.22,.43]);
      const hit=topBase+spec.hit;
      const e=add(g,'vendor',hit,{width:runner?.7:1.1,radius:1.4,height:1.8,collidable:true,hitAt:hit,runner});
      if(runner)e.update=()=>{
        const d=getDistance(),p=clamp((d-hit+45)/65,0,1);
        g.position.set(lerp(spec.from,spec.to,p),p<.22?Math.sin(p/.22*Math.PI)*1.3:0,d-hit);
        g.rotation.y=spec.from<0?Math.PI/2:-Math.PI/2;
        legs.forEach((leg,j)=>leg.rotation.x=Math.sin((d-hit)*.55+j*Math.PI)*.65);
        if(p===1)e.collidable=false;
      };
    }
    sideBase=topBase+400;platforms=[];createSideTrucks();
  }
  function sideStart(height=5){
    stage='freeze';freeze=1.4;freezeStartY=height;sideBase=topBase+400;sideY=height;sideVelocity=0;grounded=false;landings=new Set();sandLaunched=false;
    setLane(1);
    cue('BULLET TIME! SPACE TO JUMP BETWEEN MOVING TRUCK ROOFS');
    for(const e of entities)if(['vendor','oncoming-car'].includes(e.type))e.retired=true;
    if(!platforms.length)createSideTrucks();
  }
  function createSideTrucks(){
    const kinds=['fuel-tanker','sand-tipper','normal-truck','flatbed','timber-truck','benz-911'];
    for(let i=0;i<kinds.length;i++){
      const kind=kinds[i],g=new THREE.Group();g.name=kind;
      box(3,.5,22,'#424f55',g,[0,.9,0]);box(2.6,1.8,2.8,['#477c99','#d69f36','#a54b3d'][i%3],g,[0,1.35,-12]);
      box(2.2,.7,.06,'#2a4f62',g,[0,1.8,-13.43]);
      let roof=[3.35,2.2,3.6,1.2,4,2.8][i];
      if(kind==='fuel-tanker'){const tank=mesh(new THREE.CylinderGeometry(1.4,1.4,20,18),'#bac6c9',g,[0,1.95,0]);tank.rotation.x=Math.PI/2;for(const z of [-7,0,7])box(3,.12,.18,'#da6a28',g,[0,2,z]);}
      if(kind==='sand-tipper'){box(3,.8,17,'#b28b3b',g,[0,1.4,0]);const sand=mesh(new THREE.ConeGeometry(2.1,2.8,4),'#d4b67d',g,[0,2.1,-1]);sand.scale.z=3.8;}
      if(kind==='normal-truck')box(3,2.4,22,'#aa7950',g,[0,2.4,0]);
      if(kind==='timber-truck'){
        for(let layer=0;layer<3;layer++)for(let j=0;j<4-layer;j++){
          const log=mesh(new THREE.CylinderGeometry(.38,.42,21,9),'#765333',g,[(j-(3-layer)/2)*.78,1.6+layer*.78,0]);log.rotation.x=Math.PI/2;
          const end=mesh(new THREE.CircleGeometry(.36,9),'#c49c65',g,[log.position.x,log.position.y,10.51]);
        }
        for(const z of [-7,0,7]){rod([-1.55,1.1,z],[-1.55,4,z],.06,'#594838',g);rod([-1.55,4,z],[1.55,4,z],.05,'#383d38',g);rod([1.55,4,z],[1.55,1.1,z],.06,'#594838',g);}
      }
      if(kind==='benz-911'){box(3,1.5,20,'#56806e',g,[0,2.05,0]);box(2,1,2,'#467568',g,[0,1.15,-14]);const badge=mesh(new THREE.TorusGeometry(.2,.035,6,12),'#ccd1c4',g,[0,1.6,-15.03]);for(let j=0;j<3;j++)rod([0,1.6,-15.04],[Math.sin(j*2.094)*.18,1.6+Math.cos(j*2.094)*.18,-15.04],.02,'#ccd1c4',g);}
      for(const x of [-1.6,1.6])for(const z of [-11,7]){const w=mesh(new THREE.CylinderGeometry(.5,.5,.2,12),'#19252d',g,[x,.5,z]);w.rotation.z=Math.PI/2;}
      let entryArrow;
      if(i===0){
        entryArrow=new THREE.Group();entryArrow.name='middle-lane-truck-arrow';g.add(entryArrow);entryArrow.visible=false;
        const shape=new THREE.Shape();shape.moveTo(-.28,2.5);shape.lineTo(.28,2.5);shape.lineTo(.28,1);shape.lineTo(.9,1);shape.lineTo(0,0);shape.lineTo(-.9,1);shape.lineTo(-.28,1);shape.closePath();
        const geometry=new THREE.ShapeGeometry(shape);
        for(const [color,scale,z] of [['#172733',1.15,0],['#ffe43b',1,.04]]){const arrow=new THREE.Mesh(geometry.clone(),new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide,depthTest:false,transparent:true}));arrow.scale.set(scale,scale,1);arrow.position.z=z;arrow.renderOrder=20;entryArrow.add(arrow);}
        geometry.dispose();
      }
      const hit=sideBase+12+i*34;
      const e=add(g,'platform-truck',hit,{platform:true,kind,roof,width:1.8,radius:11,height:roof,collidable:false,keepUntil:sideBase+250});
      e.update=(dt=0)=>{g.position.z=getDistance()-hit+Math.sin((getDistance()-sideBase)/20+i)*1.8;if(entryArrow){entryArrow.userData.time=(entryArrow.userData.time||0)+dt;entryArrow.visible=stage==='vendors'&&getDistance()>=topBase+290||stage==='freeze';entryArrow.position.set(0,roof+.5+Math.sin(entryArrow.userData.time*5)*.15,11.2);entryArrow.children[1].material.opacity=.4+.6*(.5+.5*Math.sin(entryArrow.userData.time*8));}};platforms.push(e);
    }
  }
  return {

    reset(){aftermath.reset();stage='waiting';nextIncoming=-110;incomingNumber=0;timer=0;raceLead=0;raceFailed=false;gap=null;drop=null;rivals=[];miniCars=[];platforms=[];landings=new Set();finishedAt=0;heavyTrafficMade=false;cruiseResetPending=false;cyclist.position.z=0;document.getElementById('accelerate-sign').hidden=true;},
    update(dt,bikeHeight){
      const d=getDistance();
      if(stage==='aftermath'){aftermath.update(dt);if(aftermath.complete){stage='done';finishedAt=d;}return;}
      if(!heavyTrafficMade&&d>=2395&&d<=3040)heavyTraffic();
      if(!['top','freeze','side'].includes(stage))while(d>=nextIncoming)incoming();
      if(stage==='waiting'&&d>=2395){stage='escape';gap={hit:2460};cue('POLICE BEHIND! LEFT THROUGH THE MEDIAN GAP — ONCOMING TRAFFIC');}
      if(stage==='escape'&&d>=2485){if(getLane()>-2){onFailure('swerve');return;}stage='oncoming';gap=null;cue('WRONG CARRIAGEWAY — DODGE THE INCOMING CARS');}
      if(stage==='oncoming'&&d>=2900){stage='return';gap={hit:2960};cue('ROAD BLOCKED AHEAD! TAKE THE GAP BACK TO THE RIGHT');}
      if(stage==='return'&&d>=2940&&getLane()>=0)release();
      if(stage==='return'&&d>3040){onFailure('swerve');return;}
      if(stage==='dropoff'){
        timer+=dt;const p=clamp(timer/1.1,0,1);
        drop.woman.position.set(lerp(drop.start.x,5.55,p),Math.sin(p*Math.PI)*3+3*p,drop.pole.position.z+.2);
        drop.woman.rotation.z=-p*.35;
        if(p===1){stage='before-race';emptyEnd=d+70;}
      }
      if(stage==='before-race'&&d>=emptyEnd)race();
      if(stage==='race'){
        timer+=dt;raceLead+=(getSpeed()-110)*dt;
        if(raceLead>20&&getSpeed()>110){rivals.forEach(e=>{e.retired=true;});stage='empty';emptyEnd=d+300;cruiseResetPending=true;cue('RACE WON — PRESS ↓ FOR NORMAL CRUISING SPEED');}
        else if(timer>=5){raceFailed=true;cue('THE RACERS ARE CUTTING YOU OFF!');if(timer>=5.7){onFailure();return;}}
      }
      document.getElementById('accelerate-sign').hidden=stage!=='race';
      if(stage==='empty'&&d>=emptyEnd)dispatch();
      if(stage==='dispatch'&&d>=dispatchStart+500)fork();
      if(stage==='fork'){
        const p=d-forkStart;
        if(p>=195&&p<=249&&bikeHeight>1)jumpedRamp=true;
        if((p>=120&&p<195&&getLane()!==2)||(p>=215&&p<239&&bikeHeight<.8)||(p>=249&&p<330&&(getLane()!==1||!jumpedRamp))){onFailure('swerve');return;}
        if(p>=170&&p<215)cue('RIGHT RAMP ENDS! SPACE + LEFT — LAND ON THE MIDDLE');
        if(d>=forkStart+330)cue('BACK UP! MERGE THROUGH TRAFFIC — WATCH THE GAPS');
        if(d>=forkStart+520)overhead();
      }
      if(stage==='top'){topTime+=dt;cyclist.position.z=0;if(d>=topBase+560){topBase=d-120;vendors();}}
      if(stage==='vendors'&&((d>=topBase+389&&d<=topBase+398&&bikeHeight>1.5)||d>=topBase+400))sideStart(bikeHeight);
      if(stage==='freeze'){freeze-=dt;const p=clamp(1-freeze/1.4,0,1);sideY=lerp(freezeStartY,5,p*p*(3-2*p));if(freeze<=0){stage='side';setDistance(sideBase);setLane(1);cyclist.position.z=0;}}
      if(stage==='side'){
        const oldY=sideY;sideVelocity-=18*dt;sideY+=sideVelocity*dt;grounded=false;
        for(let i=0;i<platforms.length;i++){
          const e=platforms[i],z=d-(sideBase+12+i*34)+Math.sin((d-sideBase)/20+i)*1.8;
          const roof=e.kind==='sand-tipper'?2.2+clamp((z+11)/22,0,1)*1.6:e.roof;
          if(Math.abs(z)<11&&sideVelocity<=0&&oldY>=roof-.15&&sideY<=roof){sideY=roof;sideVelocity=0;grounded=true;landings.add(i);}
          if(i===1&&grounded&&z>=6&&!sandLaunched){sandLaunched=true;sideVelocity=10;grounded=false;}
        }
        if(d>sideBase+205&&sideY<=0){
          if(landings.size<6){onFailure();return;}
          stage='aftermath';platforms.forEach(e=>e.retired=true);aftermath.start();
        }else if(sideY<-2){onFailure('swerve');return;}
      }
    },
    key(code){
      if(stage==='aftermath')return aftermath.key(code);
      if(stage==='top'){
        return ['ArrowUp','ArrowDown','Space'].includes(code);
      }
      if(stage==='freeze')return true;
      if(stage==='side'){
        if(code==='Space'&&grounded){
          const platform=platforms.find(e=>Math.abs(e.g.position.z)<11);
          sideVelocity=platform?.kind==='normal-truck'||platform?.kind==='benz-911'?8:platform?.kind==='timber-truck'?9:11;
          grounded=false;chirp(450,.1);
        }
        if(code==='ArrowDown'&&!grounded)sideVelocity=Math.min(sideVelocity,-8);
        return true;
      }
      return false;
    },
    takeCruiseReset(){if(!cruiseResetPending||!['empty','dispatch','fork'].includes(stage))return false;cruiseResetPending=false;return true;},
    get clearRampRange(){return stage==='fork'?{near:getDistance()-forkStart-80,far:getDistance()-forkStart-350}:null;},
    get movementSpeed(){return stage==='aftermath'?aftermath.speed:stage==='freeze'?0:stage==='top'?48:stage==='vendors'?55:stage==='side'?32:stage==='fork'&&getDistance()<forkStart+330?65:null;},
    get orbitProgress(){return stage==='freeze'?clamp(1-freeze/1.4,0,1):null;},
    get laneBounds(){return stage==='oncoming'?[-4,-2]:['escape','return'].includes(stage)?[-4,2]:[0,2];},
    get crossingAllowed(){return stage==='escape'||stage==='return';},
    get medianGapZ(){return gap?getDistance()-gap.hit:null;},
    get elevation(){const d=getDistance();return stage==='fork'&&d>=forkStart+100&&d<=forkStart+330?-5*Math.sin((d-forkStart-100)/230*Math.PI):0;},
    get roadCut(){return stage==='fork'?{z:getDistance()-(forkStart+215),length:115}:null;},
    get height(){return stage==='aftermath'?aftermath.height:stage==='side'||stage==='freeze'?sideY:null;},
    get view(){return stage==='aftermath'?aftermath.view:stage==='top'?'top':stage==='freeze'||stage==='side'?'side':'chase';},
    pose(){if(stage==='aftermath')aftermath.pose();},get darkness(){return stage==='aftermath'?aftermath.darkness:0;},
    get hanging(){return stage==='aftermath'&&aftermath.hanging;},
    get active(){return stage!=='waiting'&&stage!=='done';},
    get complete(){return stage==='done';},
    get stage(){return stage==='aftermath'?aftermath.stage:stage;},
    get sideGrounded(){return grounded;},
    get platforms(){return platforms;},
    get sideBase(){return sideBase;},
    get finishedAt(){return finishedAt;},
  };
}
