const $ = id => document.getElementById(id);
const canvas = $('face'), ctx = canvas.getContext('2d');
const modes = {standby:{name:'BEREIT',color:'#45e2d0',rgb:'69,226,208'},focus:{name:'FOKUS',color:'#aa8cff',rgb:'170,140,255'},energy:{name:'ENERGIE',color:'#ffb85e',rgb:'255,184,94'}};
let mode='standby',paused=matchMedia('(prefers-reduced-motion: reduce)').matches,speaking=false,yaw=0,pitch=0,targetYaw=0,targetPitch=0,w=0,h=0,frames=0,lastFps=0,animTime=0,lastTime=0,transition=null;
const EXPLODE_SCALE=.85;
function log(message){}
function updateTime(){$('clock').textContent=new Date().toLocaleTimeString('de-CH');$('date').textContent=new Date().toLocaleDateString('de-CH',{weekday:'long',day:'numeric',month:'long'});$('day').textContent=new Date().toLocaleDateString('de-CH',{day:'2-digit',month:'2-digit'});}updateTime();setInterval(updateTime,1000);
window.nexoSetMode = value => { const button = document.querySelector('[data-mode="' + value + '"]'); if (!button || (mode === value && !transition)) return; transition = { to:value, button, start:performance.now(), duration:900, switched:false }; };
document.querySelectorAll('[data-mode]').forEach(button=>button.onclick=()=>window.nexoSetMode(button.dataset.mode));
function expand(){document.body.classList.toggle('expanded');$('expand').textContent=document.body.classList.contains('expanded')?'↙':'⛶';$('expand').setAttribute('aria-label',document.body.classList.contains('expanded')?'Gesichtsansicht verkleinern':'Gesicht vergrößern');resize();}
$('expand').onclick=expand;document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('expanded'))expand();});
let noteSaved='';try{noteSaved=localStorage.getItem('nexo-note')||'';}catch{}
$('note').value=noteSaved;$('note-open').onclick=()=>{$('note-dialog').showModal();$('note').focus();};$('note-close').onclick=()=>$('note-dialog').close();$('note-form').onsubmit=e=>{e.preventDefault();try{localStorage.setItem('nexo-note',$('note').value);$('note-dialog').close();log('Notiz lokal gespeichert');}catch{$('save-status').textContent='Speichern blockiert. Bitte kopiere deine Notiz vor dem Schließen.';}};
let timerEnd=0; $('timer').onclick=()=>{if(timerEnd){timerEnd=0;$('timer-label').textContent='25 Minuten für dich';log('Fokus-Timer beendet');}else{timerEnd=Date.now()+25*60000;log('Fokus-Timer gestartet');tickTimer();}};function tickTimer(){if(!timerEnd)return;const seconds=Math.max(0,Math.ceil((timerEnd-Date.now())/1000));$('timer-label').textContent=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0')+' · Klick zum Beenden';if(!seconds){timerEnd=0;$('timer-label').textContent='Fokus abgeschlossen';log('25 Minuten Fokus abgeschlossen');}}setInterval(tickTimer,1000);
const points = createHeadPoints();
function resize(){const rect=canvas.getBoundingClientRect();w=rect.width;h=rect.height;const dpr=Math.min(devicePixelRatio||1,1.3);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);}new ResizeObserver(resize).observe($('stage'));resize();
$('stage').addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect();targetYaw=((e.clientX-r.left)/w-.5)*.8;targetPitch=((e.clientY-r.top)/h-.5)*-.28;});$('stage').addEventListener('pointerleave',()=>{targetYaw=targetPitch=0;});
function draw(now){requestAnimationFrame(draw);const dt=Math.min(40,now-lastTime||16);lastTime=now;if(!paused){animTime+=dt;yaw+=(targetYaw-yaw)*.045;pitch+=(targetPitch-pitch)*.04;}frames++;if(now-lastFps>1000){$('fps').textContent=Math.round(frames*1000/(now-lastFps));frames=0;lastFps=now;}
 let explode=0;
 if(transition){
  const tt=Math.min(1,(now-transition.start)/transition.duration);explode=Math.sin(Math.PI*tt);
  if(!transition.switched&&tt>=.5){mode=transition.to;const m=modes[mode];document.documentElement.style.setProperty('--accent',m.color);document.documentElement.style.setProperty('--rgb',m.rgb);document.querySelectorAll('[data-mode]').forEach(b=>{b.classList.toggle('selected',b===transition.button);b.setAttribute('aria-pressed',String(b===transition.button));});$('mode-label').textContent='/ '+m.name;log('Modus '+m.name.toLowerCase()+' aktiviert');transition.switched=true;}
  if(tt>=1)transition=null;
 }
 ctx.clearRect(0,0,w,h);const t=animTime/1000,scale=Math.min(w*.32,h*.235),cx=w/2,cy=h*.425;const rgb=modes[mode].rgb;
 ctx.strokeStyle=`rgba(${rgb},.11)`;ctx.lineWidth=1;
 for(let j=0;j<3;j++){ctx.beginPath();ctx.ellipse(cx,cy+scale*1.57,scale*(.77+j*.13),scale*(.105+j*.025),0,0,Math.PI*2);ctx.stroke();}
 ctx.setLineDash([2,9]);ctx.beginPath();ctx.ellipse(cx,cy,scale*1.22,scale*1.64,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
 const ry=yaw+Math.sin(t*.43)*.045,rx=pitch,sy=Math.sin(ry),co=Math.cos(ry),sx=Math.sin(rx),cr=Math.cos(rx),blink=Math.pow(Math.max(0,Math.cos(t*1.12+2)),100);const mouth=speaking?Math.abs(Math.sin(t*9)*Math.sin(t*3))*.095:0;
 const batches=Array.from({length:8},()=>[]);
 for(const p of points){let bx=p.x,by=p.y,bz=p.z;if(explode){bx+=p.ex*explode*EXPLODE_SCALE;by+=p.ey*explode*EXPLODE_SCALE;bz+=p.ez*explode*EXPLODE_SCALE;}
  let py=by;if(p.eye)py=-.024+(py+.024)*(1-blink*.88);if(p.lip)py+=(p.y>.75?1:-1)*mouth*p.lip;const px=bx*co+bz*sy,pz=-bx*sy+bz*co,yy=py*cr-pz*sx,zz=Math.min(3.2,py*sx+pz*cr);
  const perspective=3.8/(3.8-zz),xx=cx+px*scale*perspective,y=cy+yy*scale*perspective;const nz=(-p.nx*sy+p.nz*co)*cr+p.ny*sx; if(nz<.025)continue; const nx=p.nx*co+p.nz*sy,ny=p.ny*cr-(-p.nx*sy+p.nz*co)*sx; const light=Math.max(0,-nx*.48-ny*.55+nz*.68); const depthBoost=Math.max(0,zz-.75)*3.2; const rim=1-nz; let alpha=p.a*(.12+.74*light)+rim*rim*rim*.14+depthBoost; if(p.eye)alpha=.4+depthBoost;else if(p.teeth){if(mouth<.012)continue;alpha=Math.min(.92,mouth*9);}const bucket=Math.min(7,Math.floor(alpha*8));const rBase=p.eye?1.05:(p.teeth?.9:(zz>.5?.85:.6));batches[bucket].push([xx,y,rBase+depthBoost*.35]);
 }
 for(let b=0;b<8;b++){ctx.fillStyle=`rgba(${rgb},${(b+1)/8})`;ctx.beginPath();for(const [x,y,r]of batches[b]){const d=r*1.44;ctx.rect(x-r*.72,y-r*.72,d,d);}ctx.fill();}
 const g=ctx.createRadialGradient(cx,cy,0,cx,cy,scale*1.5);g.addColorStop(0,`rgba(${rgb},.015)`);g.addColorStop(1,`rgba(${rgb},0)`);ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
}requestAnimationFrame(draw);
