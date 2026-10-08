export function createPrologue({THREE,scene,box,sphere,rod,cyclist,rider,suitPassenger,scenery,wheels,markings}) {
  const land=new THREE.Group();land.name='roadside-land';scene.add(land);
  box(130,.2,160,'#b9a27d',land,[0,-.2,-46]);
  box(12,.22,160,'#454b50',land,[0,-.06,-46]);
  box(1.6,.13,160,'#b7a483',land,[6.2,.02,-46]);
  for(let i=0;i<9;i++){box(2.2,1,3,'#416b41',land,[10+i%3*2,.4,-i*14]);}
  box(1.5,17,1.5,'#d4b566',land,[13,8.3,-25]);
  box(2.4,2,.3,'#3e80a1',land,[13,2,-24.15]);
  const man=new THREE.Group();man.name='waving-suited-passenger';scene.add(man);
  box(.43,.75,.27,'#253349',man,[0,1.27,0]);sphere(.2,'#71432d',man,[0,1.95,0]);
  box(.13,.5,.025,'#ececdf',man,[0,1.32,-.15]);box(.04,.32,.03,'#b34739',man,[0,1.37,-.17]);
  for(const side of [-1,1]){rod([side*.11,.91,0],[side*.17,.18,0],.065,'#253349',man);box(.16,.11,.3,'#171c26',man,[side*.17,.1,-.05]);}
  box(.42,.36,.14,'#6b432a',man,[-.39,.69,0]);rod([-.49,.91,0],[-.29,.91,0],.02,'#292824',man);
  rod([-.2,1.56,0],[-.35,1.05,0],.052,'#653b27',man);
  const arm=new THREE.Group();arm.position.set(.2,1.56,0);man.add(arm);
  rod([0,0,0],[.22,.57,0],.052,'#653b27',arm);sphere(.075,'#653b27',arm,[.22,.61,0]);
  const passing=[];
  for(let i=0;i<3;i++) {
    const bike=cyclist.clone(true);bike.name='passing-bike';bike.position.set([-3.2,0,3.2][i],0,20-i*22);bike.scale.setScalar(.8);bike.getObjectByName('suited-passenger').visible=false;scene.add(bike);passing.push(bike);
  }
  let timer=0,mode='waiting',blend=0,lastTravel=0;
  function waiting(){timer=0;mode='waiting';land.visible=true;land.position.set(0,0,0);man.visible=true;man.position.set(6.1,0,1);cyclist.visible=false;for(const g of scenery){g.visible=true;g.position.z=g.userData.startZ-96;}}
  waiting();
  return{
    waiting,
    pickup(){timer=0;mode='pickup';blend=0;lastTravel=0;passing.forEach(b=>b.visible=false);cyclist.visible=true;rider.visible=true;suitPassenger.visible=false;},
    update(dt,time){
      timer+=dt;
      if(mode==='waiting') {
        arm.rotation.z=Math.sin(time*6)*.5;
        passing.forEach((b,i)=>{b.visible=true;b.position.z-=dt*(20+i*4);if(b.position.z<-90)b.position.z=20;});
      } else if(mode==='pickup') {
        const stop=THREE.MathUtils.clamp(timer/1.2,0,1);
        cyclist.position.set(4.5,0,THREE.MathUtils.lerp(35,0,stop*stop*(3-2*stop)));
        arm.rotation.z=0;
        if(timer>1.3){const p=THREE.MathUtils.clamp((timer-1.3)/.9,0,1);man.position.set(THREE.MathUtils.lerp(6.1,4.5,p),Math.sin(p*Math.PI)*1.5,p*.85);man.rotation.x=-p*.2;}
        if(timer>=2.3){man.visible=false;suitPassenger.visible=true;mode='approach';timer=0;}
      } else if(mode==='approach') {
        const p=THREE.MathUtils.clamp(timer/3,0,1);
        blend=p*p*(3-2*p);
        // Bridge furniture is already ahead; it approaches as the camera travels.
        cyclist.position.set(THREE.MathUtils.lerp(4.5,0,blend),Math.sin(p*Math.PI)*.45,0);cyclist.rotation.x=-Math.sin(p*Math.PI)*.12;
        const travel=p*p*96;
        wheels.forEach(w=>w.rotation.x-=(travel-lastTravel)/.56);lastTravel=travel;
        land.position.z=travel;
        for(const g of scenery)g.position.z=g.userData.startZ-96+travel;
        for(const m of markings)m.position.z=m.userData.startZ-96+travel;
        if(timer>=3){mode='done';cyclist.rotation.x=0;return true;}
      }
      return false;
    },
    travel(delta){if(land.visible){land.position.z+=delta;if(land.position.z-126>25)land.visible=false;}},
    get cameraBlend(){return blend;},
    clear(keepShore=false){mode='done';if(!keepShore)land.visible=false;man.visible=false;passing.forEach(b=>b.visible=false);rider.visible=true;suitPassenger.visible=true;cyclist.visible=true;for(const g of scenery)g.visible=true;},
  };
}
