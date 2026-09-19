const $ = id => document.getElementById(id);
const canvas = $('face'), ctx = canvas.getContext('2d');
const modes = {standby:{name:'BEREIT',color:'#45e2d0',rgb:'69,226,208'},focus:{name:'FOKUS',color:'#aa8cff',rgb:'170,140,255'},energy:{name:'ENERGIE',color:'#ffb85e',rgb:'255,184,94'}};
let mode='standby',paused=matchMedia('(prefers-reduced-motion: reduce)').matches,speaking=false,yaw=0,pitch=0,targetYaw=0,targetPitch=0,w=0,h=0,frames=0,lastFps=0,animTime=0,lastTime=0;
function log(message){const li=document.createElement('li');li.textContent=message;const small=document.createElement('small');small.textContent=new Date().toLocaleTimeString('de-CH');li.append(small);$('log').prepend(li);while($('log').children.length>5)$('log').lastChild.remove();}
function updateTime(){$('clock').textContent=new Date().toLocaleTimeString('de-CH');$('date').textContent=new Date().toLocaleDateString('de-CH',{weekday:'long',day:'numeric',month:'long'});$('day').textContent=new Date().toLocaleDateString('de-CH',{day:'2-digit',month:'2-digit'});}updateTime();setInterval(updateTime,1000);
document.querySelectorAll('[data-mode]').forEach(button=>button.onclick=()=>{mode=button.dataset.mode;const m=modes[mode];document.documentElement.style.setProperty('--accent',m.color);document.documentElement.style.setProperty('--rgb',m.rgb);document.querySelectorAll('[data-mode]').forEach(b=>{b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',String(b===button));});$('mode-label').textContent='/ '+m.name;log('Modus '+m.name.toLowerCase()+' aktiviert');});
function expand(){document.body.classList.toggle('expanded');$('expand').textContent=document.body.classList.contains('expanded')?'↙':'⛶';$('expand').setAttribute('aria-label',document.body.classList.contains('expanded')?'Gesichtsansicht verkleinern':'Gesicht vergrößern');resize();}
$('expand').onclick=expand;$('face-open').onclick=expand;document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('expanded'))expand();});
function motionLabel(){$('motion').textContent=paused?'▶ Bewegung fortsetzen':'Ⅱ Bewegung pausieren';}motionLabel();$('motion').onclick=()=>{paused=!paused;motionLabel();};
$('reset').onclick=()=>{targetYaw=targetPitch=yaw=pitch=0;};
$('speak').onclick=()=>{speaking=!speaking;$('speak').classList.toggle('active',speaking);$('speak').setAttribute('aria-pressed',String(speaking));$('state').textContent=speaking?'Sprechanimation läuft.':'Ich bin bereit.';log(speaking?'Sprechanimation gestartet · ohne Audio':'Sprechanimation beendet');};
let noteSaved='';try{noteSaved=localStorage.getItem('nexo-note')||'';}catch{}
$('note').value=noteSaved;$('note-open').onclick=()=>{$('note-dialog').showModal();$('note').focus();};$('note-close').onclick=()=>$('note-dialog').close();$('note-form').onsubmit=e=>{e.preventDefault();try{localStorage.setItem('nexo-note',$('note').value);$('note-dialog').close();log('Notiz lokal gespeichert');}catch{$('save-status').textContent='Speichern blockiert. Bitte kopiere deine Notiz vor dem Schließen.';}};
let timerEnd=0; $('timer').onclick=()=>{if(timerEnd){timerEnd=0;$('timer-label').textContent='25 Minuten für dich';log('Fokus-Timer beendet');}else{timerEnd=Date.now()+25*60000;log('Fokus-Timer gestartet');tickTimer();}};function tickTimer(){if(!timerEnd)return;const seconds=Math.max(0,Math.ceil((timerEnd-Date.now())/1000));$('timer-label').textContent=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0')+' · Klick zum Beenden';if(!seconds){timerEnd=0;$('timer-label').textContent='Fokus abgeschlossen';log('25 Minuten Fokus abgeschlossen');}}setInterval(tickTimer,1000);
// A deterministic point cloud: ellipsoid plus sculpted anatomical relief.
let seed=21;function rand(){seed=(seed*16807)%2147483647;return(seed-1)/2147483646;}const points=[];
function gaussian(x,y,cx,cy,sx,sy){return Math.exp(-(((x-cx)/sx)**2+((y-cy)/sy)**2));}
for(let i=0;i<24000;i++){
 const y=rand()*2.8-1.4,angle=rand()*Math.PI*2,ring=Math.sqrt(Math.max(0,1-(y/1.48)**2));
 const jaw=y>.45?1-.23*(y-.45):1;
 const x=Math.sin(angle)*.91*ring*jaw;let z=Math.cos(angle)*.77*ring;
 const front=Math.cos(angle);let bright=.42+rand()*.48;
 if(front>0){
  z+=.18*gaussian(x,y,0,-.24,.18,.5)+.37*gaussian(x,y,0,.13,.16,.19);
  z+=.12*gaussian(x,y,-.4,.18,.26,.29)+.12*gaussian(x,y,.4,.18,.26,.29);
  const eyes=gaussian(x,y,-.34,-.31,.23,.14)+gaussian(x,y,.34,-.31,.23,.14);z-=.18*eyes;bright*=1-.78*Math.min(1,eyes);
  z+=.08*gaussian(x,y,-.32,-.49,.27,.08)+.08*gaussian(x,y,.32,-.49,.27,.08);
  z+=.08*gaussian(x,y,0,.57,.3,.07)+.10*gaussian(x,y,0,.7,.27,.07);
  z-=.05*gaussian(x,y,0,.63,.31,.03);z+=.1*gaussian(x,y,0,1,.3,.2);
  bright*=.4+.6*Math.max(0,front);bright+=.35*gaussian(x,y,-.065,.02,.12,.35);bright*=1-.65*gaussian(x,y,0,.64,.31,.045);
 }
 points.push({x,y,z,a:bright,front,lip:front>.4&&Math.abs(x)<.31&&y>.5&&y<.79,eye:false});
}
// Luminous iris rings and eyelid contours make the gaze readable at HUD scale.
for(const side of [-1,1]){for(let i=0;i<540;i++){const a=rand()*Math.PI*2,r=.055+rand()*.027;points.push({x:side*.34+Math.cos(a)*r,y:-.31+Math.sin(a)*r,z:.70,a:.65+rand()*.35,eye:true,front:1});}for(let i=0;i<280;i++){const a=rand()*Math.PI*2;points.push({x:side*.34+Math.cos(a)*.195,y:-.31+Math.sin(a)*.087,z:.68,a:.5,eye:true,front:1});}}
// Highlight nose bridge, nostrils and lips as sparse surface contours.
for(let i=0;i<1400;i++){const u=rand()*2-1;let x,y,z;if(i<500){y=-.24+rand()*.53;x=(i%2?1:-1)*(.055+.075*(y+.24)/.53)+(rand()-.5)*.024;z=.84+.33*Math.exp(-(((y-.12)/.2)**2));}else if(i<800){x=u*.14;y=.245+.03*Math.cos(u*Math.PI);z=1.03;}else{x=u*.30;y=.635+(i%2?1:-1)*.045*Math.sin((u+1)*Math.PI/2)+(rand()-.5)*.016;z=.77;}points.push({x,y,z,a:.56+rand()*.25,front:1,eye:false,lip:i>=800});}
$('point-count').textContent=points.length.toLocaleString('de-CH')+' POINTS';
function resize(){const rect=canvas.getBoundingClientRect();w=rect.width;h=rect.height;const dpr=Math.min(devicePixelRatio||1,1.6);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);}new ResizeObserver(resize).observe($('stage'));resize();
$('stage').addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect();targetYaw=((e.clientX-r.left)/w-.5)*.8;targetPitch=((e.clientY-r.top)/h-.5)*-.28;});$('stage').addEventListener('pointerleave',()=>{targetYaw=targetPitch=0;});
function draw(now){requestAnimationFrame(draw);const dt=Math.min(40,now-lastTime||16);lastTime=now;if(!paused){animTime+=dt;yaw+=(targetYaw-yaw)*.045;pitch+=(targetPitch-pitch)*.04;}frames++;if(now-lastFps>1000){$('fps').textContent=Math.round(frames*1000/(now-lastFps));frames=0;lastFps=now;}
 ctx.clearRect(0,0,w,h);const t=animTime/1000,scale=Math.min(w*.32,h*.235),cx=w/2,cy=h*.425;const rgb=modes[mode].rgb;
 ctx.strokeStyle=`rgba(${rgb},.11)`;ctx.lineWidth=1;
 for(let j=0;j<3;j++){ctx.beginPath();ctx.ellipse(cx,cy+scale*1.57,scale*(.77+j*.13),scale*(.105+j*.025),0,0,Math.PI*2);ctx.stroke();}
 ctx.setLineDash([2,9]);ctx.beginPath();ctx.ellipse(cx,cy,scale*1.22,scale*1.64,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
 const ry=yaw+Math.sin(t*.43)*.045,rx=pitch,sy=Math.sin(ry),co=Math.cos(ry),sx=Math.sin(rx),cr=Math.cos(rx),blink=Math.pow(Math.max(0,Math.cos(t*1.12+2)),100);const mouth=speaking?Math.abs(Math.sin(t*9)*Math.sin(t*3))*.095:0;
 const batches=Array.from({length:8},()=>[]);
 for(const p of points){let py=p.y;if(p.eye)py=-.31+(py+.31)*(1-blink*.88);if(p.lip)py+=(p.y>.63?1:-1)*mouth;const px=p.x*co+p.z*sy,pz=-p.x*sy+p.z*co,yy=py*cr-pz*sx,zz=py*sx+pz*cr;
  const perspective=3.8/(3.8-zz),xx=cx+px*scale*perspective,y=cy+yy*scale*perspective;let alpha=p.a*(zz<0?.16:.8);if(p.eye)alpha=.98;const bucket=Math.min(7,Math.floor(alpha*8));batches[bucket].push([xx,y,p.eye?1.05:(zz>.5?.85:.6)]);
 }
 for(let b=0;b<8;b++){ctx.fillStyle=`rgba(${rgb},${(b+1)/8})`;ctx.beginPath();for(const [x,y,r]of batches[b]){ctx.rect(x,y,r*1.3,r*1.3);}ctx.fill();}
 const g=ctx.createRadialGradient(cx,cy,0,cx,cy,scale*1.5);g.addColorStop(0,`rgba(${rgb},.015)`);g.addColorStop(1,`rgba(${rgb},0)`);ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
}requestAnimationFrame(draw);log('Interface bereit');log('Partikelkern initialisiert');
