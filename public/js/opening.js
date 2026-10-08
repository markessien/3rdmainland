// Distance-based choreography stays in order even while boosting.
export function createOpening({THREE,scene,box,sphere,rod,mesh,obstacle,pothole,entities,laneX,getDistance:getCourseDistance}) {
  const SCALE=.45;
  const getDistance=()=>getCourseDistance()/SCALE;
  let stage=0,complete=false,bridgeGap=null,crossingBus=null;
  const clamp=THREE.MathUtils.clamp,lerp=THREE.MathUtils.lerp;
  function cue(text){document.getElementById('opening-cue').textContent=text;}
  function scripted(e,hitAt,animate=()=>{}) {
    e.opening=true;e.hitAt=hitAt;
    const existingUpdate=e.update;
    e.update=(dt,t)=>{e.g.position.z=(getDistance()-hitAt)*SCALE;if(existingUpdate)existingUpdate(dt,t);animate(e,getDistance(),t);};
    e.g.position.z=(getDistance()-hitAt)*SCALE;return e;
  }
  function car(n,hitAt){return scripted(obstacle(n,getDistance()-hitAt,'car'),hitAt);}
  function begin(){
    stage=0;complete=false;bridgeGap=null;crossingBus=null;
    car(0,160);car(1,160);
    cue('01 / TWO CARS AHEAD — SWITCH RIGHT');
  }
  function advance(d) {
    d/=SCALE;
    if(stage===0&&d>=175){
      stage=1;cue('02 / CAR SPEEDING UP — YELLOW BUS AHEAD');
      const speeding=car(1,430);
      speeding.paceCar=true;
      speeding.update=(dt,t)=>{
        const p=clamp((getDistance()-175)/90,0,1);
        speeding.g.position.z=lerp(7,-24,p);
        const merge=clamp((getDistance()-245)/120,0,1);
        speeding.g.position.x=lerp(0,-3.2,merge*merge*(3-2*merge));
        if(getDistance()>550)speeding.g.position.z=(getDistance()-550)*SCALE-24;
      };
      const bus=scripted(obstacle(2,-255,'bus'),430);bus.special=true;bus.trafficSpeed=35;bus.g.rotation.y=Math.PI;
    }
    if(stage===1&&d>=300){stage=2;cue('03 / GAP TO YOUR LEFT — RETURN TO MIDDLE');}
    if(stage===2&&d>=445){
      stage=3;cue('04 / LONG POTHOLE LEFT, TRUCK AHEAD — WATCH THE TRUCK');
      scripted(pothole(0,-275),900);
      const g=new THREE.Group();g.name='opening-truck';scene.add(g);
      box(2.1,6.6,5,'#957253',g,[0,3.75,0]);box(2.15,2.4,1.5,'#4d8c9b',g,[0,1.65,-3]);
      for(let level=0;level<5;level++)box(2.18,.08,5.06,'#c9a774',g,[0,1.3+level*1.2,0]);
      box(1.8,.6,.035,'#273e4a',g,[0,1.8,-2.23]);
      for(const x of [-1.12,1.12])for(const z of [-3,1.5]){const w=mesh(new THREE.CylinderGeometry(.48,.48,.2,12),'#20262d',g,[x,.48,z]);w.rotation.z=Math.PI/2;}
      const e={g,type:'opening-truck',radius:3.7,width:1.3,height:7.1,noJump:true,passed:false};entities.push(e);
      const bottles=[];
      for(let i=0;i<9;i++){
        const b=new THREE.Group();b.name='rolling-beer-bottle';scene.add(b);b.visible=false;
        entities.push({g:b,type:'bottle',radius:1,width:.1,height:.2,collidable:false,passed:false});
        mesh(new THREE.CylinderGeometry(.08,.08,.34,8),'#366d35',b,[0,0,0]);
        mesh(new THREE.CylinderGeometry(.035,.04,.15,8),'#386d35',b,[0,.24,0]);
        box(.12,.1,.16,'#d7c576',b,[0,0,0]);bottles.push(b);
      }
      scripted(e,720,(e,d)=>{
        const p=clamp((d-555)/90,0,1);e.g.position.x=-3.2;
        // Roll right and lift the pivot so the entire load rests above the asphalt.
        e.g.rotation.z=-p*Math.PI/2;e.g.rotation.y=0;e.g.position.y=p*1.3;
        e.collisionXOffset=p*3.75;e.width=lerp(1.3,3.35,p);e.radius=3.8;
        bottles.forEach((b,i)=>{b.visible=p>.25;b.position.set(e.g.position.x-1-i*.2+p*2,.3+Math.abs(Math.sin(p*10+i))*.3,e.g.position.z+1+i*.5);b.rotation.z=p*18+i;});
      });
    }
    if(stage===3&&d>=570){stage=4;cue('05 / TRUCK FALLING RIGHT! KEEP LEFT, THEN DODGE THE LONG HOLE');}
    if(stage===4&&d>=740){
      stage=5;cue('06 / THREE PEOPLE LEAPING IN FROM RIGHT — CAR LEFT');car(0,985);
      for(let i=0;i<3;i++) {
        const g=new THREE.Group();g.name='opening-jumper';scene.add(g);
        box(.4,.65,.27,['#b55338','#477ba5','#d5bc58'][i],g,[0,1.03,0]);sphere(.19,'#75482e',g,[0,1.57,0]);
        for(const side of [-1,1]){rod([side*.12,.72,0],[side*.23,.17,.05],.075,'#2b3a50',g);rod([side*.2,1.29,0],[side*.43,1.5,0],.05,'#75482e',g);}
        const e={g,type:'opening-jumper',width:.6,radius:.9,height:1.8,passed:false};entities.push(e);
        scripted(e,985+i*8,(e,d)=>{
          const p=clamp((d-775-i*12)/100,0,1);e.g.position.x=lerp(6.1,[0,1.4,3.2][i],p);
          e.g.position.y=Math.sin(p*Math.PI)*2.6;e.g.rotation.z=Math.sin(p*Math.PI)*-.25;
        });
      }
    }
    if(stage===5&&d>=1005){
      stage=6;cue('07 / WRONG-WAY CAR! LEFT, LEFT — ESCAPE ON THE MEDIAN');
      const e=scripted(obstacle(0,-205,'car'),1210,(e,d)=>{e.g.position.x=lerp(-8.3,-2.35,clamp((d-1005)/55,0,1));e.g.rotation.y=Math.PI;});
      e.width=2.25;e.height=2.1;
      e.noJump=true;
      // A dense pack spanning every road lane, with only the median open.
      for(let row=0;row<12;row++)for(let n=0;n<3;n++) {
        const block=car(n,1210+row*16);block.noJump=true;block.blockade=true;
      }
    }
    if(stage===6&&d>=1430){stage=7;cue('BLOCKADE CLEARED — RETURN TO THE ROAD BEFORE THE NEXT LAMP');}
    if(stage===7&&d>=1450){
      stage=8;cue('LAMP FALLING! ELECTRICAL SPARKS — MOVE RIGHT');
      const g=new THREE.Group();g.name='opening-falling-lamp';scene.add(g);
      const pivot=new THREE.Group();pivot.position.x=-3.2;g.add(pivot);
      rod([0,0,0],[0,7.5,0],.12,'#a6b8c1',pivot);
      box(1.6,.12,.8,'#284258',pivot,[.7,7.3,0]);
      const flash=sphere(.8,'#c0f5ff',g,[-2.3,.6,0]);flash.name='electrical-flash';flash.material=new THREE.MeshBasicMaterial({color:'#d7fcff'});flash.visible=false;
      const sparks=[];
      for(let i=0;i<20;i++){const s=rod([0,0,0],[.15,0,.1],.025,'#7ddfff',g);s.material=new THREE.MeshBasicMaterial({color:i%2?'#91e7ff':'#fffed0'});s.visible=false;sparks.push(s);}
      const e={g,type:'opening-lamp',width:1.85,radius:1.5,height:1.2,passed:false};entities.push(e);
      scripted(e,1630,(e,d,t)=>{
        e.g.position.x=-2;
        const p=clamp((d-1450)/80,0,1);pivot.rotation.z=-p*p*Math.PI/2;
        e.width=lerp(.4,2,p);
        flash.visible=p===1&&d<1638;flash.scale.setScalar(.9+Math.sin(t*43)*.4);
        sparks.forEach((s,i)=>{s.visible=p===1&&d<1650;const a=i*Math.PI*2/20,r=((t*4+i*.13)%1)*2.8;s.position.set(Math.cos(a)*r,Math.abs(Math.sin(a))*r+.3,Math.sin(a)*r*.5);s.rotation.z=a+t*8;});
      });
    }
    if(stage===8&&d>=1660){
      stage=9;cue('WATER PUDDLE IN THE MIDDLE');
      const g=new THREE.Group();g.name='middle-water-puddle';scene.add(g);
      const water=mesh(new THREE.CircleGeometry(1.15,28),'#748b95',g,[0,.1,0]);water.rotation.x=-Math.PI/2;water.scale.y=3;
      water.material=new THREE.MeshPhysicalMaterial({color:'#748b95',roughness:.08,metalness:.35,transparent:true,opacity:.75});
      const e={g,type:'puddle',collidable:false,radius:3,width:1.2,height:0,passed:false};entities.push(e);scripted(e,1830);
    }
    if(stage===9&&d>=1855){
      stage=10;cue('TWO POTHOLES LEFT — KEEP RIGHT');
      scripted(pothole(0,-90),2050);scripted(pothole(1,-90),2050);
    }
    if(stage===10&&d>=2170){
      stage=11;cue('TWO POTHOLES RIGHT — MOVE LEFT');
      scripted(pothole(1,-90),2370);scripted(pothole(2,-90),2370);
    }
    if(stage===11&&d>=2440){
      stage=12;cue('BONFIRE FAR RIGHT — GO FAR LEFT');
      const g=new THREE.Group();g.name='roadside-bonfire';scene.add(g);
      for(let i=0;i<6;i++){const log=box(.23,.22,1.9,'#593a29',g,[0,.16,0]);log.rotation.y=i*Math.PI/3;}
      const flames=[];
      for(let i=0;i<9;i++){
        const f=mesh(new THREE.ConeGeometry(.3,1.8,5),i%2?'#ffb12e':'#ef5321',g,[Math.sin(i*2)*.5,1,Math.cos(i*2)*.5]);
        f.material=new THREE.MeshBasicMaterial({color:i%2?'#ffb12e':'#ef5321'});flames.push(f);
      }
      const fire={g,type:'bonfire',radius:1.6,width:1.3,height:2.6,passed:false};entities.push(fire);
      scripted(fire,2680,(e,d,t)=>{e.g.position.x=4.2;flames.forEach((f,i)=>{f.scale.y=.8+Math.sin(t*14+i)*.3;});});
    }
    if(stage===12&&d>=2550){
      stage=13;cue('DANFO CROSSING FROM OPPOSITE SIDE! MOVE MIDDLE NOW');
      crossingBus=scripted(obstacle(0,-90,'bus'),2740,(e,d,t)=>{
        const p=clamp((d-2550)/95,0,1);
        e.g.position.x=lerp(-9.9,-3.2,p*p*(3-2*p));
        e.g.rotation.y=-(1-p)*.45;e.g.rotation.z=.5+Math.sin(t*7)*.025;e.g.position.y=.55;
      });
      crossingBus.special=true;crossingBus.width=1.85;
      crossingBus.passenger.position.set(1.27,2.01,.65);crossingBus.passenger.rotation.z=-.45;
    }
    if(stage===13&&d>=2800){complete=true;cue('');}
  }
  return{begin,advance,get stage(){return stage;},get complete(){return complete;},
    skip(){stage=13;complete=true;bridgeGap=null;crossingBus=null;cue('');},
    get gapZ(){return bridgeGap&&bridgeGap.g.position.z<20?bridgeGap.g.position.z:null;},
    get medianGapZ(){return crossingBus&&crossingBus.g.position.z<20?crossingBus.g.position.z:null;}};
}
