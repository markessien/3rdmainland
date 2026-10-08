export function createExtension({THREE,scene,cyclist,box,sphere,rod,mesh,obstacle,entities,getDistance,getLane,getSpeed,setSpeed,onFailure,chirp}) {
  const woman=(parent,color,seated=false)=>{
    const g=new THREE.Group();parent.add(g);
    box(.4,.65,.28,color,g,[0,seated?1.98:1.2,0]);
    const hips=new THREE.Group();hips.name='round-hips';g.add(hips);
    for(const side of [-1,1]){
      const curve=sphere(.38,color,hips,[side*.22,seated?1.56:.89,.17]);curve.scale.set(1.15,1.1,1.25);
    }
    sphere(.19,'#75472f',g,[0,seated?2.47:1.75,0]);
    const hair=sphere(.21,'#231c22',g,[0,seated?2.54:1.82,.04]);hair.scale.set(1,.8,1);
    for(const side of [-1,1]){
      if(seated){rod([side*.12,1.65,0],[side*.4,1.12,-.1],.07,color,g);rod([side*.4,1.12,-.1],[side*.43,.82,.12],.06,'#38304a',g);}
      else rod([side*.12,.9,0],[side*.2,.13,0],.07,'#38304a',g);
    }
    const arm=new THREE.Group();arm.position.set(.2,seated?2.15:1.4,0);g.add(arm);
    rod([0,0,0],[.25,.5,0],.05,'#75472f',arm);
    rod([-.2,seated?2.15:1.4,0],[-.35,seated?1.7:.98,0],.05,'#75472f',g);
    g.userData.arm=arm;return g;
  };
  const passenger=woman(cyclist,'#bd437b',true);passenger.name='second-passenger';passenger.position.set(-.16,0,1.35);passenger.visible=false;
  let stage=0,boarding=-1,pickedUp=false,declined=false,resumeSpeed=65,roadside=null,checkpointMade=false,chasing=false,vanMade=false;
  const cue=text=>{document.getElementById('opening-cue').textContent=text;};
  function entity(g,type,hitAt,properties={}) {
    scene.add(g);g.position.z=getDistance()-hitAt;
    const e={g,type,width:0,radius:1,height:0,collidable:false,passed:false,...properties};
    e.update=()=>{g.position.z=getDistance()-hitAt;};entities.push(e);return e;
  }
  function beginSlalom(){
    stage=1;cue('NET FENCES — LEFT, RIGHT, LEFT THROUGH THE CARS');
    const fence=new THREE.Group();fence.name='bridge-net-fences';
    const vertices=[];
    for(const x of [-4.9,4.9]) {
      for(let z=0;z>=-790;z-=10)rod([x,0,z],[x,3.2,z],.045,'#676f70',fence);
      for(let z=0;z>=-790;z-=2)for(let y=0;y<3;y+=.5){
        vertices.push(x,y,z,x,y+.5,z-2,x,y+.5,z,x,y,z-2);
      }
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
    fence.add(new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({color:'#768185',transparent:true,opacity:.7})));
    entity(fence,'net-fence',1250,{keepUntil:2050});
    for(let i=0;i<10;i++){
      const e=obstacle(1,-150,'car');e.type='slalom-car';e.noJump=true;
      e.g.name='slalom-car';
      // Each later car changes lanes faster, with a modest 1.53x maximum increase.
      // Finish every maneuver 20 m ahead and keep the same 65 m row spacing.
      const hit=1350+i*65,swerveDistance=65-i*2.5;
      e.hitAt=hit;
      const indicator=box(.14,.12,.05,'#ffc34a',e.g,[i%2?-.6:.6,.78,1.4]);
      e.update=()=>{
        const d=getDistance();
        e.g.position.z=d-hit;
        const p=THREE.MathUtils.clamp((d-(hit-20-swerveDistance))/swerveDistance,0,1),s=p*p*(3-2*p);
        e.g.position.x=THREE.MathUtils.lerp(i%2?3.2:-3.2,i%2?-3.2:3.2,s);
        e.g.rotation.y=(i%2?1:-1)*Math.sin(p*Math.PI)*.25;
        indicator.visible=p<1&&Math.floor(d/5)%2===0;
      };
      e.g.position.z=getDistance()-hit;
    }
  }
  function rescue(){
    stage=3;cue('BROKEN-DOWN CAR — TWO WOMEN WAVING RIGHT. GO RIGHT TO PICK UP');
    const car=obstacle(2,-150,'car');car.type='broken-down-car';car.collidable=false;car.g.position.x=4.3;
    car.update=()=>{car.g.position.z=getDistance()-2060;};
    const bonnet=box(1.3,.07,.8,'#a6a9a5',car.g,[0,1.35,-1]);bonnet.rotation.x=-.8;
    roadside=new THREE.Group();roadside.name='waving-women';
    for(let i=0;i<2;i++){const w=woman(roadside,i?'#dba335':'#bd437b');w.position.set(i*.65,0,i*.9);}
    entity(roadside,'pickup-women',2060,{keepUntil:2130});roadside.position.x=4.65;
  }
  function patrol(name) {
    const g=new THREE.Group();g.name=name;
    box(2,.65,4.7,'#234c70',g,[0,.8,0]);box(1.8,.8,1.7,'#e6e9e5',g,[0,1.47,-.7]);
    box(1.55,.5,.04,'#274b5c',g,[0,1.52,-1.57]);
    box(1.55,.45,.04,'#274b5c',g,[0,1.52,.17]);
    box(1.8,.15,1.7,'#e6e9e5',g,[0,1.9,-.7]);
    box(1.6,.2,1.7,'#172f45',g,[0,.99,1.15]);
    for(const x of [-1.05,1.05])for(const z of [-1.5,1.5]){const w=mesh(new THREE.CylinderGeometry(.42,.42,.2,12),'#18232b',g,[x,.42,z]);w.rotation.z=Math.PI/2;}
    for(const x of [-.75,.75])box(.3,.16,.07,'#f8e6b0',g,[x,.91,-2.37]);
    const red=box(.4,.18,.3,'#f74439',g,[-.3,2.1,-.7]),blue=box(.4,.18,.3,'#329aff',g,[.3,2.1,-.7]);
    red.material=new THREE.MeshBasicMaterial({color:'#ff453f'});blue.material=new THREE.MeshBasicMaterial({color:'#299dff'});
    g.userData.beacons=[red,blue];return g;
  }
  function checkpoint(){
    checkpointMade=true;stage=4;cue(pickedUp?'POLICE BLOCKADE! PASSENGER JUMPS — WHEELIE ONTO THE PICKUP':'POLICE BLOCK THE ROAD — YOU NEEDED THE PASSENGER');
    const police=patrol('police-checkpoint-pickup');police.position.x=3.2;
    // Low tailgate and open bed form the physical stepping stone for the bike.
    box(1.6,.15,.5,'#8fa8b7',police,[0,.78,2.25]);
    entity(police,'police-checkpoint',2150,{radius:3,width:1.3,height:.6,collidable:true});
    for(const x of [-3.2,0]){const bar=new THREE.Group();box(2.8,.2,.2,'#fff2da',bar,[0,1,0]);for(const xx of [-1.1,1.1])rod([xx,0,0],[xx,1,0],.06,'#b43c32',bar);bar.position.x=x;entity(bar,'checkpoint-barrier',2150,{radius:1,width:1.55,height:2,noJump:true,collidable:true});}
  }
  function policeVan(){
    vanMade=true;cue('POLICE VAN CUTTING IN — MOVE LEFT');
    const g=new THREE.Group();g.name='police-van';
    box(2.1,1.25,4.8,'#233b57',g,[0,1.15,0]);box(2,1.05,3.5,'#e3e8e6',g,[0,2.04,.45]);
    box(1.75,.6,.05,'#294654',g,[0,2.03,-1.3]);box(1.65,.48,.05,'#294654',g,[0,2.08,2.24]);
    for(const x of [-1.1,1.1])for(const z of [-1.55,1.6]){const w=mesh(new THREE.CylinderGeometry(.43,.43,.2,12),'#18232b',g,[x,.43,z]);w.rotation.z=Math.PI/2;}
    const red=box(.5,.16,.3,'#f04439',g,[-.3,2.68,0]),blue=box(.5,.16,.3,'#329aff',g,[.3,2.68,0]);
    const e=entity(g,'police-van',2380,{radius:3,width:1.4,height:3,noJump:true,collidable:true});
    e.update=()=>{const d=getDistance(),p=THREE.MathUtils.clamp((d-2290)/65,0,1);g.position.z=d-2380;g.position.x=THREE.MathUtils.lerp(5.5,0,p*p*(3-2*p));red.visible=Math.floor(d/4)%2===0;blue.visible=!red.visible;};
  }
  function chase(){
    chasing=true;
    for(let i=0;i<2;i++){
      const g=patrol('chasing-patrol-pickup');
      const e=entity(g,'police-chaser',2215,{radius:2.4,width:1.25,height:2.2,collidable:true,keepUntil:11000});
      g.position.x=i?-3.2:3.2;
      g.position.z=12+i*3;
      e.update=dt=>{
        const d=getDistance();
        // Once across the median, pursuit is visual: incoming traffic is the hazard.
        if(d>=2395&&getLane()<=-2)e.escapedToOncoming=true;
        if(e.escapedToOncoming)e.collidable=false;
        const gap=THREE.MathUtils.clamp(12-(d-2215)/35+(getSpeed()-65)*.09,e.escapedToOncoming?8:1.6,12);
        g.position.z=gap+i*3;
        g.position.x=THREE.MathUtils.lerp(g.position.x,i?-cyclist.position.x:cyclist.position.x,1-Math.exp(-dt*2));
        g.userData.beacons.forEach((b,j)=>b.visible=Math.floor(d/4)%2===j);
      };
    }
  }
  return {
    passenger,

    reset(){stage=0;boarding=-1;pickedUp=false;declined=false;roadside=null;checkpointMade=false;chasing=false;vanMade=false;passenger.visible=false;passenger.position.set(-.16,0,1.35);passenger.getObjectByName('round-hips').scale.set(1,1,1);},
    advance(d){if(stage===0&&d>=1260)beginSlalom();if(stage===1&&d>=1980)rescue();},
    update(dt,time){
      const d=getDistance();
      if(roadside)roadside.children.forEach((w,i)=>w.userData.arm.rotation.z=Math.sin(time*7+i)*.6);
      if(stage===3&&!pickedUp&&!declined&&boarding<0&&d>=2040&&d<=2075&&getLane()===2){resumeSpeed=Math.max(65,getSpeed());boarding=0;}
      if(boarding>=0&&!pickedUp){
        boarding+=dt;setSpeed(Math.max(0,resumeSpeed*(1-boarding/.3)));
        const p=THREE.MathUtils.clamp((boarding-.4)/.85,0,1);
        const w=roadside.children[0];
        w.position.x=(cyclist.position.x-roadside.position.x)*p;w.position.y=Math.sin(p*Math.PI)*1.6;w.position.z=(-roadside.position.z+1.35)*p;
        if(p>=1){w.visible=false;passenger.visible=true;pickedUp=true;setSpeed(resumeSpeed);cue('TWO PASSENGERS ON BOARD — LET’S GO');}
      }
      if(stage===3&&d>2080&&!pickedUp){declined=true;checkpoint();}
      if(pickedUp&&!checkpointMade)checkpoint();
      if(declined&&d>=2132){onFailure();return;}
      if(stage===4&&d>=2215){stage=5;cue('POLICE IN PURSUIT — KEEP MOVING');chase();}if(stage===5&&!vanMade&&d>=2290)policeVan();
      if(stage===5&&d>2390){stage=6;cue('');}
      if(passenger.visible)passenger.rotation.z=Math.sin(time*8)*.05;
      if(pickedUp){
        const p=THREE.MathUtils.clamp((d-2108)/35,0,1);passenger.position.y=Math.sin(p*Math.PI)*1.6;
      }
    },
    get height(){const d=getDistance();if(!pickedUp)return 0;if(d>=2108&&d<2142)return Math.sin((d-2108)/34*Math.PI)*.65;if(d>=2142&&d<2153)return .7+(d-2142)/11*1.6;if(d>=2153&&d<2213){const p=(d-2153)/60;return 2.3*(1-p)+36*p*(1-p);}return 0;},
    get pitch(){const d=getDistance();return pickedUp&&d>=2108&&d<2153?.65*Math.sin((d-2108)/45*Math.PI):0;},
    get forcedLane(){const d=getDistance();return pickedUp&&d>=2108&&d<2160?2:null;},
    get gapZ(){return null;},
    get fenced(){const d=getDistance();return d>=1260&&d<2030;},
    get active(){return stage>0&&stage<6;},
    get complete(){return stage===6;},
    get boarding(){return boarding>=0&&!pickedUp;},
    get pickedUp(){return pickedUp;},
    get chasing(){return chasing;},
    stopChase(){chasing=false;},
  };
}
