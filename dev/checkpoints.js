let debugCheckpoint=null;
const CHECKPOINTS={
  opening:{distance:0,lane:1},truck:{distance:200,lane:1},median:{distance:470,lane:1},lamp:{distance:645,lane:-1},holes:{distance:800,lane:2},bus:{distance:1130,lane:0},
  slalom:{distance:1260,lane:0,extension:'slalom'},women:{distance:1980,lane:2,extension:'women'},police:{distance:2100,lane:2,extension:'police'},pursuit:{distance:2220,lane:2,extension:'pursuit'},
  escape:{distance:2395,lane:0,finale:'escape'},oncoming:{distance:2505,lane:-3,finale:'oncoming'},return:{distance:2900,lane:-3,finale:'return'},pole:{distance:2940,lane:1,finale:'pole'},race:{distance:3100,lane:1,finale:'race'},empty:{distance:3400,lane:1,finale:'empty'},dispatch:{distance:3700,lane:1,finale:'dispatch'},detour:{distance:4250,lane:1,finale:'detour'},merge:{distance:4560,lane:1,finale:'merge'},top:{distance:4800,lane:1,finale:'top'},vendors:{distance:4920,lane:1,finale:'vendors'},trucks:{distance:5010,lane:1,finale:'trucks'},plane:{distance:5300,lane:1,finale:'plane'},quiet:{distance:5700,lane:1,finale:'quiet'},storm:{distance:6000,lane:1,finale:'storm'},normal:{distance:6400,lane:1,finale:'normal'},
};
function startCheckpoint(id){
  const config=CHECKPOINTS[id];if(!config)return;
  debugCheckpoint=id;
  playerName=($('player-name').value||playerName||'Debug Rider').trim().slice(0,24)||'Debug Rider';
  beginRide();distance=config.distance;lane=config.lane;
  if(config.extension||config.finale){
    clearEntities();opening.skip();extension.debugStart(config.extension||config.finale);
    if(config.finale)finale.debugStart(config.finale);
  }else opening.advance(distance);
  cyclist.position.set(laneX(lane),medianHeight(laneX(lane))+extension.height+(finale.height??0)+finale.elevation,0);
  for(let i=entities.length-1;i>=0;i--){const e=entities[i];if(e.update)e.update(0,elapsed);if(e.retired||(!e.keepUntil&&e.g.position.z>Math.max(16,e.radius+3)))removeEntity(i);}
  const offset=((distance%WORLD_LENGTH)+WORLD_LENGTH)%WORLD_LENGTH;
  for(const g of scenery){g.position.z=g.userData.startZ+offset;while(g.position.z>24)g.position.z-=WORLD_LENGTH;}
  for(const m of markings){m.position.z=m.userData.startZ+offset;while(m.position.z>20)m.position.z-=WORLD_LENGTH;}
  if(finale.view==='top'){overheadBlend=1;camera.position.set(0,46,-27);camera.up.set(0,0,-1);camera.lookAt(0,0,-27);}
  else if(finale.view==='side'){camera.position.set(18,7,-14);camera.up.set(0,1,0);camera.lookAt(0,3,-14);}
  else{camera.position.set(cyclist.position.x,3.3+finale.elevation,6.7);camera.up.set(0,1,0);camera.lookAt(cyclist.position.x,2.05+finale.elevation,-24);}
  $('remaining').textContent=((COURSE_LENGTH-distance)/1000).toFixed(2);
  $('debug-checkpoint').value=id;$('debug-current').textContent=`Testing: ${id}`;
  $('debug-menu').open=false;$('player-name').blur?.();$('debug-go').blur?.();$('debug-checkpoint').blur?.();
}
function restartRide(){if(debugCheckpoint)startCheckpoint(debugCheckpoint);else beginRide();}
$('debug-go').onclick=()=>startCheckpoint($('debug-checkpoint').value);
$('debug-retry').onclick=restartRide;
