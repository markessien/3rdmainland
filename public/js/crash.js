export function createCrash({THREE,scene,cyclist,rider,suitPassenger,extraPassenger,box,sphere,mesh}) {
  const debris=new THREE.Group();debris.name='crash-animation';debris.visible=false;scene.add(debris);
  function body(source,name,centerZ){
    const pivot=new THREE.Group();pivot.name=name;
    const model=source.clone(true);model.position.set(0,-1.8,-centerZ);model.rotation.set(0,0,0);model.visible=true;
    pivot.add(model);debris.add(pivot);return pivot;
  }
  const flyingRider=body(rider,'tumbling-rider',.13),flyingPassenger=body(suitPassenger,'tumbling-passenger',.85);
  const flyingExtra=body(extraPassenger,'tumbling-second-passenger',0);
  const bodies=[flyingRider,flyingPassenger,flyingExtra];
  const splash=new THREE.Group();splash.name='lagoon-splash';debris.add(splash);
  for(let i=0;i<18;i++)sphere(.14,'#c5ebed',splash,[0,0,0]);
  const skid=box(.16,.01,1,'#171c21',debris);skid.name='bike-skid-mark';
  let timer=0,origin=0,originY=0,side=1,mode='tumble';
  const spins=[];
  return {
    start(crashMode='tumble'){
      mode=crashMode;
      timer=0;origin=cyclist.position.x;originY=cyclist.position.y;side=1;
      debris.visible=true;splash.visible=false;
      for(const [i,f] of bodies.entries()){
        f.visible=mode==='tumble'&&(i<2||extraPassenger.visible);f.userData.launched=f.visible;f.position.set(origin,cyclist.position.y+i*.2,0);f.rotation.set(0,0,0);
        spins[i]=[0,1,2].map(axis=> (axis%2?-1:1)*(4+((i*7+axis*3+Math.floor(origin*10))%6+6)%6));
      }
      if(mode==='tumble'){rider.visible=false;suitPassenger.visible=false;extraPassenger.visible=false;}
    },
    update(dt){
      timer+=dt;
      // Independent ballistic paths: both people clear the parapet into the lagoon.
      bodies.forEach((f,i)=>{
        if(!f.userData.launched)return;
        const t=Math.max(0,timer-i*.12);
        f.position.set(origin+(12-origin+i*.7)*t/2,originY+1.8+16*t-10*t*t-i*.25,[.13,.85,1.35][i]-t*(2+i));
        f.rotation.set(...spins[i].map(s=>s*t));
        if(f.position.y<-7)f.visible=false;
      });
      // The motorcycle stays on the deck, slides sideways, and sheds a short skid.
      cyclist.position.set(origin+side*Math.min(timer,1.5)*.9,.18,-timer*5);
      cyclist.rotation.set(.1,side*timer*1.7,side*Math.min(1.5,timer*8));
      if(mode==='swerve'){
        const p=THREE.MathUtils.clamp(timer/1.25,0,1),s=p*p*(3-2*p);
        cyclist.position.set(THREE.MathUtils.lerp(origin,12,s),timer<.55?0:-8*Math.pow((timer-.55)/1.1,2),-timer*4);
        cyclist.rotation.set(timer*.3,-s*.7,-Math.sin(p*Math.PI)*.7);
        if(cyclist.position.y<-8)cyclist.visible=false;
      }
      skid.position.set(origin+side*Math.min(timer,1.5)*.45,.09,-timer*2.5);skid.scale.z=Math.max(.01,timer*5);skid.rotation.y=-side*.16;
      skid.visible=mode==='tumble'||timer<.55;
      const impact=1.95;
      splash.visible=timer>impact;
      splash.position.set(12,-5.7,-4);
      splash.children.forEach((p,i)=>{
        const t=Math.max(0,timer-impact),a=i*Math.PI*2/18;
        p.position.set(Math.cos(a)*t*5,Math.sin(t*Math.PI)*2+i%3*.1,Math.sin(a)*t*5);
        p.scale.setScalar(Math.max(.01,1-t));
      });
      return timer>=2.65;
    },
    reset(){debris.visible=false;cyclist.visible=true;rider.visible=true;suitPassenger.visible=true;},
    get focus(){return new THREE.Vector3(origin+side*5,2,-3);},
  };
}
