window.addEventListener('error',e=>{(window.browserCheckErrors??=[]).push(e.message);});
window.addEventListener('unhandledrejection',e=>{(window.browserCheckErrors??=[]).push(String(e.reason));});
window.addEventListener('load',()=>{
  document.getElementById('player-name').value='Browser test';
  document.getElementById('start').click();
  const check=setInterval(()=>{
    if(document.getElementById('touch').classList.contains('hidden'))return;
    clearInterval(check);
    document.getElementById('right').click();
    document.getElementById('jump').click();
    const touch=document.getElementById('touch');
    const buttons=[...touch.querySelectorAll('button')];
    const mobile=innerWidth<=700;
    const visibleButtons=buttons.every(b=>{const r=b.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight&&r.width>=44;});
    const hintsHidden=['opening-cue','ride-hint','median-warning','encounter-warning','bus-warning','accelerate-sign'].every(id=>getComputedStyle(document.getElementById(id)).display==='none');
    const result={hintsHidden,viewport:[innerWidth,innerHeight],errors:window.browserCheckErrors||[],started:document.getElementById('intro').classList.contains('hidden'),canvas:[document.getElementById('game').width,document.getElementById('game').height],touchFits:!mobile||visibleButtons,publicDebugAbsent:!document.getElementById('debug-menu'),speed:document.getElementById('speed-reading').textContent};
    const pre=document.createElement('pre');pre.id='browser-check-result';pre.hidden=true;pre.textContent=JSON.stringify(result);document.body.append(pre);
  },250);
});
