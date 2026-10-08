export function createAftermath({THREE,scene,cyclist,box,sphere,rod,mesh,obstacle,entities,getDistance,getLane,onFailure,chirp}){
  let stage='idle',base=0,y=0,velocity=0,time=0,latched=false,flight=null,chain=null,weather=null;
  const cue=t=>document.getElementById('opening-cue').textContent=t;
  function add(g,type,hit,props={}){scene.add(g);const e={g,type,collidable:false,width:1,radius:1,height:1,...props};e.update=()=>g.position.z=getDistance()-hit;e.update();entities.push(e);return e;}
  function plane(){
    stage='plane';base=getDistance();y=0;velocity=0;latched=false;cue('TAXIING PLANE — SPACE TO JUMP AND GRAB IT');
    const g=new THREE.Group();g.name='taxiing-highway-plane';
    const body=sphere(1,'#dedfd6',g,[0,4,0]);body.scale.set(1,1,10);
    box(19,.18,2.6,'#c5d0d7',g,[0,4,0]);box(7,.15,1.8,'#c5d0d7',g,[0,4,7]);box(.16,3,2,'#28799c',g,[0,5.4,7]);
    box(1.2,.5,2,'#2b5267',g,[0,4.5,-6]);
    for(const x of [-3,3]){const engine=mesh(new THREE.CylinderGeometry(.7,.7,2.6,12),'#406072',g,[x,3.5,-1]);engine.rotation.x=Math.PI/2;}
    for(const x of [-1,1]){rod([x,3,1],[x,1,1],.1,'#616b71',g);sphere(.45,'#1f2a32',g,[x,.7,1]);}
    flight=add(g,'taxiing-plane',base+70,{keepUntil:base+450});flight.update=()=>{g.position.z=latched?0:(getDistance()-base-70)*.7;g.position.y=latched?4:0;};
    const fire=new THREE.Group();fire.name='massive-burning-highway-truck';box(9,5,24,'#412a26',fire,[0,2.6,0]);
    for(let i=0;i<16;i++){const flame=mesh(new THREE.ConeGeometry(.7,3+i%4,7),'#fa6d22',fire,[(i%4-1.5)*2.2,5,-8+Math.floor(i/4)*5]);flame.name='truck-flame';}
    const e=add(fire,'burning-highway-truck',base+205,{width:5,radius:16,height:7,noJump:true,collidable:true,keepUntil:base+400});e.update=()=>{e.collidable=!latched;fire.position.z=getDistance()-base-205;fire.children.forEach((m,i)=>{if(m.name==='truck-flame')m.scale.y=1+Math.sin(time*12+i)*.22;});};
    chain=new THREE.Group();chain.name='plane-hanging-chain';cyclist.add(chain);chain.visible=false;
    rod([0,3.6,-.2],[0,5.8,-.5],.07,'#74462f',chain);rod([0,3.6,-.2],[.3,2.1,.8],.07,'#754a32',chain);
    rod([.45,1,-.4],[.7,1.8,.4],.1,'#6f8790',chain);rod([.7,1.8,.4],[.3,2.1,.8],.08,'#6f8790',chain);
    sphere(.15,'#9fb5bf',chain,[.3,2.1,.8]);
  }
  function quiet(){
    stage='quiet';base=getDistance();y=0;latched=false;if(chain)chain.visible=false;const suited=cyclist.getObjectByName('suited-passenger');if(suited)suited.position.z=0;cue('OPEN HIGHWAY — WATCH THE TURTLE');
    for(const e of entities)if(['taxiing-plane','burning-highway-truck'].includes(e.type))e.retired=true;
    const turtle=new THREE.Group();turtle.name='quiet-road-giant-turtle';const shell=sphere(1.4,'#647347',turtle,[0,.7,0]);shell.scale.set(1,.6,1.2);sphere(.4,'#a1ad66',turtle,[0,.45,-1.8]);
    for(const x of [-1,1])for(const z of [-.9,.9])sphere(.3,'#869754',turtle,[x,.22,z]);
    const e=add(turtle,'quiet-turtle',base+80,{collidable:true,width:1.5,radius:1.8,height:1.2});e.update=()=>{turtle.position.set(4.8-Math.min(10,Math.max(0,(getDistance()-base-35)*.08)),0,getDistance()-base-80);};
    const mermaid=new THREE.Group();mermaid.name='lagoon-mermaid';sphere(.25,'#84543b',mermaid,[0,1.8,0]);box(.4,.65,.25,'#b77a50',mermaid,[0,1.25,0]);const hair=sphere(.28,'#252632',mermaid,[0,1.93,.08]);hair.scale.y=1.5;for(const x of [-.2,.2])rod([x,1.5,0],[x*2,1.05,-.15],.07,'#84543b',mermaid);const tail=mesh(new THREE.ConeGeometry(.5,1.5,10),'#48b9a9',mermaid,[0,.35,0]);tail.rotation.z=.4;
    for(const x of [-.3,.3]){const fin=sphere(.3,'#62d4bd',mermaid,[x,-.4,0]);fin.scale.set(1,.25,1.5);}
    const m=add(mermaid,'mermaid',base+175,{width:.9,radius:1,height:2,collidable:true});m.update=()=>{mermaid.position.set(Math.sin((getDistance()-base)/30)*3.2,.25+Math.sin(time*4)*.2,getDistance()-base-175);};
  }
  function storm(){
    stage='storm';base=getDistance();time=0;cue('STORM! LIGHTNING REVEALS CARS AND FLOODED HOLES — REMEMBER THE GAPS');
    weather=new THREE.Group();weather.name='storm-rain';scene.add(weather);
    for(let i=0;i<100;i++)rod([0,0,0],[.15,-1.5,.2],.012,'#adc8d1',weather).position.set((i*7%23)-11,(i*3%13)+1,-(i*11%65));
    for(let i=0;i<3;i++){
      const safe=[1,0,2][i],hit=base+80+i*55;
      for(const n of [0,1,2])if(n!==safe){const g=new THREE.Group();g.name='storm-flooded-hole';g.position.x=(n-1)*3.2;const puddle=mesh(new THREE.CircleGeometry(1.4,14),'#183e50',g,[0,.035,0]);puddle.rotation.x=-Math.PI/2;puddle.scale.y=3;const e=add(g,'storm-puddle',hit,{safeLane:safe,width:1.35,radius:4,height:20,noJump:true,collidable:true});}
    }
    const car=obstacle(2,-90,'car');car.type='storm-car';const hit=base+35;car.update=()=>{car.g.position.z=getDistance()-hit;};
  }
  return{
    start(name='plane'){if(name==='quiet')quiet();else if(name==='storm')storm();else plane();},
    reset(){if(chain){cyclist.remove(chain);chain=null;}if(weather){scene.remove(weather);weather=null;}stage='idle';latched=false;time=0;},
    update(dt){
      time+=dt;const d=getDistance();
      if(stage==='plane'){
        velocity-=20*dt;y=Math.max(0,y+velocity*dt);
        if(!latched&&y>2&&d>=base+40&&d<=base+100){latched=true;y=6;velocity=0;chain.visible=true;cue('HANG ON! SPACE TO DROP AFTER THE BURNING TRUCK');chirp(700,.2);}
        if(latched)y=6;
        if(!latched&&d>base+110){onFailure('swerve');return;}
        if(latched&&d>base+245)cue('TRUCK CLEARED — SPACE TO DROP BACK TO THE HIGHWAY');
      }
      if(stage==='drop'){velocity-=20*dt;y+=velocity*dt;if(y<=0)quiet();}
      if(stage==='quiet'&&d>=base+250)storm();
      if(stage==='storm'){
        if(weather)weather.children.forEach((m,i)=>m.position.y=((i*3-time*22)%13+13)%13);
        if(d>=base+230){stage='done';if(weather)weather.visible=false;cue('STORM CLEARED — BACK ON THE HIGHWAY');}
      }
    },
    key(code){if(!['plane','drop'].includes(stage))return false;if(code==='Space'&&stage==='plane'){if(latched){if(getDistance()<base+245){onFailure('swerve');return true;}stage='drop';latched=false;chain.visible=false;velocity=0;}else if(y===0)velocity=12;}return true;},
    pose(){if(latched){cyclist.getObjectByName('rider').position.y=1.1;const p=cyclist.getObjectByName('suited-passenger');p.position.y=-.7;p.position.z=.7;}},
    get active(){return stage!=='idle';},get complete(){return stage==='done';},get stage(){return stage;},get height(){return ['plane','drop'].includes(stage)?y:null;},get view(){return ['plane','drop'].includes(stage)?'side':'chase';},get speed(){return ['plane','drop'].includes(stage)?32:55;},get hanging(){return latched;},
    get darkness(){return stage==='storm'?(time%1.9<.14?.08:.96):0;},
  };
}
