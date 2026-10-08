// One instance of each set piece per ride. Regular traffic remains endless.
export function createEncounters(api) {
  const {THREE,scene,box,sphere,rod,mesh,obstacle,entities,laneX,medianSections,chirp,scream}=api;
  const schedule=[['turtle',300],['trash',600],['lamp',900],['truck',1250],['ambush',1600]];
  let next=0,gap=null,message='',messageTime=0;
  const lerp=THREE.MathUtils.lerp,clamp=THREE.MathUtils.clamp;
  function announce(text) {message=text;messageTime=4;}
  function group(type,x,z,options={}) {
    const g=new THREE.Group();g.name=`obstacle-${type}`;g.position.set(x,0,z);scene.add(g);
    const e={g,type,radius:1,width:1,height:1,trafficSpeed:0,passed:false,...options};
    entities.push(e);return e;
  }
  function person(parent,color,pose='standing') {
    const g=new THREE.Group();parent.add(g);
    box(.34,.57,.22,color,g,[0,.8,0]);sphere(.17,'#70432c',g,[0,1.27,0]);
    for(const side of [-1,1]) {
      rod([side*.1,.53,0],[side*.18,.1,pose==='swing'?.22:0],.064,'#26374c',g);
      box(.14,.1,.24,'#26282d',g,[side*.18,.07,.06]);
    }
    return g;
  }
  function bus() {
    announce('MEDIAN GAP! DANFO ON TWO SIDE WHEELS — MOVE MIDDLE');
    const e=obstacle(0,-210,'bus');e.special=true;e.width=1.95;e.age=0;
    e.g.position.x=-9.9;e.g.position.y=.5;
    gap={z:-175};
    // Conductor leans far out of the window like the supplied drawing.
    e.passenger.position.set(1.27,2.01,.65);e.passenger.rotation.z=-.45;
    e.update=(dt,t)=>{
      e.age+=dt;const p=clamp(e.age/1.8,0,1);
      e.g.position.x=lerp(-9.9,-3.2,p*p*(3-2*p));
      e.g.rotation.y=(1-p)*-.36;
      e.g.rotation.z=.5+Math.sin(t*7)*.025;
      e.g.position.y=.54+Math.sin(t*11)*.025;
      e.passenger.rotation.z=-.45+Math.sin(t*10)*.12;
    };
  }
  function turtle() {
    announce('GIANT TURTLE CROSSING — JUMP OR STEER');
    const e=group('turtle',5.8,-160,{width:1.12,radius:1.05,height:1.05});e.age=0;
    const shell=sphere(1,'#65733c',e.g,[0,.57,0]);shell.scale.set(1,.58,1.18);
    for(let i=0;i<7;i++) {
      const plate=sphere(.26,'#87914b',e.g,[Math.sin(i*2.4)*.6,.89-Math.abs(Math.sin(i*2.4))*.12,Math.cos(i*2.4)*.65]);
      plate.scale.set(1,.2,1);
    }
    const head=sphere(.29,'#91a36b',e.g,[-1,.45,0]);head.scale.x=1.4;
    for(const z of [-.16,.16])sphere(.035,'#17291f',e.g,[-1.15,.61,z]);
    const feet=[];
    for(const x of [-.58,.58])for(const z of [-.77,.77]) {
      const foot=sphere(.22,'#84935b',e.g,[x,.22,z]);foot.scale.set(1.2,.7,1);feet.push(foot);
    }
    rod([.9,.35,0],[1.3,.22,0],.07,'#84935b',e.g);
    e.update=(dt,t)=>{e.age+=dt;e.g.position.x=5.8-e.age*3;feet.forEach((foot,i)=>foot.position.y=.22+Math.sin(t*8+i*Math.PI)*.06);};
  }
  function trash() {
    announce('WATCH THE CAR WINDOW — TRASH INCOMING');
    const source=obstacle(1,-140,'car');source.trafficSpeed=27;source.age=0;source.thrown=false;
    const arm=rod([.7,1.2,.1],[1.2,1.3,.1],.07,'#6c402b',source.g);arm.visible=false;
    source.update=dt=>{
      source.age+=dt;
      if(source.thrown||source.g.position.z<-92)return;
      source.thrown=true;arm.visible=true;announce('TRASH BAG! RIGHT LANE — JUMP OR MOVE LEFT');chirp(220,.18);
      const e=group('trash',source.g.position.x+1,source.g.position.z+1.5,{width:.95,radius:1,height:1.15});
      e.age=0;e.originX=e.g.position.x;e.g.position.y=1.45;
      const bag=sphere(.72,'#262e29',e.g,[0,.65,0]);bag.scale.set(1.15,1.08,.85);
      for(let i=0;i<5;i++)sphere(.22,'#354139',e.g,[Math.sin(i*2)*.53,.56+i%2*.35,Math.cos(i*2)*.4]);
      const tie=mesh(new THREE.ConeGeometry(.18,.3,6),'#62694c',e.g,[0,1.46,0]);tie.rotation.z=.3;
      rod([-.25,.9,.58],[.3,.45,.61],.017,'#78866e',e.g);
      e.update=delta=>{
        e.age+=delta;const p=clamp(e.age/.9,0,1);
        e.g.position.x=lerp(e.originX,3.2,p);e.g.position.y=(1-p)*1.45+Math.sin(p*Math.PI)*2;
        e.g.rotation.z=Math.sin(p*Math.PI)*2;e.collidable=e.g.position.y<1.2;
      };
    };
  }
  function lamp() {
    announce('STREETLAMP COMING DOWN — LEFT LANE OR JUMP');
    const e=group('lamp',2,-170,{width:3.15,radius:.9,height:.8,collidable:false});
    const pivot=new THREE.Group();pivot.position.x=3.1;e.g.add(pivot);
    rod([0,0,0],[0,6.3,0],.11,'#a6b1b7',pivot);
    rod([0,6.1,0],[-1.4,6.6,0],.085,'#a6b1b7',pivot);
    const panel=box(1.5,.08,.7,'#243e51',pivot,[-1,6.6,0]);panel.rotation.z=-.23;
    box(.7,.14,.38,'#fff1b2',pivot,[-.8,6.1,0]);
    e.age=0;
    e.update=dt=>{
      if(e.g.position.z<-125)return;
      e.age+=dt;const p=clamp(e.age/1.2,0,1);
      pivot.rotation.z=p*p*Math.PI/2;e.collidable=p>.7;
      if(p===1&&!e.landed){e.landed=true;chirp(85,.3);}
    };
  }
  function truck() {
    announce('TRUCK LOSING CONTROL — KEEP RIGHT');
    const e=group('truck',-3.2,-175,{width:1.3,radius:3.8,height:7.1,trafficSpeed:30,noJump:true});
    box(2.2,6.6,5.3,'#936f52',e.g,[0,3.75,.5]);
    for(let z=-1.8;z<3;z+=.5)box(2.26,.06,.06,'#b9936c',e.g,[0,6.8,z]);
    box(2.25,1.85,1.6,'#4c8793',e.g,[0,1.3,-3]);
    box(1.95,.72,.035,'#263f4c',e.g,[0,1.79,-3.83]);
    box(1.95,.65,.03,'#263f4c',e.g,[0,1.73,-2.18]);
    for(const x of [-1.15,1.15])for(const z of [-3.05,1.75,2.65]) {
      const w=mesh(new THREE.CylinderGeometry(.5,.5,.23,14),'#1e252e',e.g,[x,.52,z]);w.rotation.z=Math.PI/2;
    }
    e.age=0;const smoke=[];
    for(let i=0;i<6;i++){const puff=sphere(.4,'#59616a',e.g,[-.8,2,-3]);puff.visible=false;smoke.push(puff);}
    e.update=(dt,t)=>{
      if(e.g.position.z<-115)return;
      e.age+=dt;const p=clamp(e.age/1.1,0,1);
      e.trafficSpeed=30*(1-p);e.g.position.x=lerp(-3.2,-1.5,p);
      e.g.rotation.y=-p*Math.PI/2;e.g.rotation.z=.12*Math.sin(p*Math.PI);
      // The jackknifed truck spans left + middle, leaving right lane open.
      e.width=lerp(1.3,3.05,p);e.radius=lerp(3.8,1.5,p);
      if(p===1&&!e.crashed){e.crashed=true;announce('TRUCK CRASH! LEFT + MIDDLE BLOCKED — RIGHT LANE');chirp(75,.4);}
      smoke.forEach((s,i)=>{s.visible=p>.65;s.position.y=2+(t*.8+i*.4)%2;s.scale.setScalar(.8+(t+i)%1);});
    };
  }
  function ambush() {
    announce('BRIDGE AMBUSH — DODGE THE TRACERS');
    for(const side of [-1,1]) {
      const e=group('swinging-shooter',side*5.1,-290,{collidable:false,width:0,radius:1,trafficSpeed:0});
      e.age=0;e.shots=0;
      const swing=new THREE.Group();swing.position.y=5;e.g.add(swing);
      rod([0,0,0],[0,-9,0],.025,'#cbb58a',swing);
      const boy=person(swing,side===1?'#3a739c':'#b8563e','swing');boy.position.set(0,-9,0);
      rod([-.15,-8,0],[-.08,-7.7,0],.05,'#70432c',swing);
      rod([.15,-8.2,0],[.35,-8.1,.37],.05,'#70432c',swing);
      box(.12,.12,.42,'#30363d',swing,[.36,-8.08,.53]);
      const flash=sphere(.15,'#ffe57a',swing,[.36,-8.08,.83]);flash.visible=false;
      e.update=(dt,t)=>{
        e.age+=dt;
        // Start below deck, then arc outward and up on a visible rope.
        const p=clamp(e.age/1.7,0,1);swing.rotation.x=-p*1.37;
        swing.rotation.z=side*Math.sin(p*Math.PI)*.11;
        flash.visible=false;
        if(p===1&&e.shots<3&&e.age>1.85+e.shots*.36) {
          const shot=e.shots++;flash.visible=true;chirp(120,.06);
          const targetLane=(shot+(side===1?1:0))%3;
          const b=group('tracer',laneX(targetLane),e.g.position.z+8,{width:.42,radius:1.1,height:1.35,trafficSpeed:-55});
          b.g.position.y=.9;box(.08,.08,1.6,'#ffe265',b.g);sphere(.13,'#ffab42',b.g);
        }
      };
    }
  }
  const spawn={bus,turtle,trash,lamp,truck,ambush};
  return {
    get count(){return next;},
    reset(){next=0;gap=null;message='';messageTime=0;for(const s of medianSections){s.white.visible=true;s.black.visible=true;}},
    advance(distance){while(next<schedule.length&&distance>=schedule[next][1]){spawn[schedule[next][0]]();next++;}},
    update(dt,scroll){
      if(gap){gap.z+=scroll;if(gap.z>25)gap=null;}
      for(const s of medianSections){const show=!gap||Math.abs(s.g.position.z-gap.z)>10;s.white.visible=show;s.black.visible=show;}
      messageTime=Math.max(0,messageTime-dt);
      const warning=document.getElementById('encounter-warning');warning.textContent=message;warning.classList.toggle('hidden',messageTime===0);
    },
  };
}
