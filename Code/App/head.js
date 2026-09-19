// Sculpted head surface. Coordinates: x right, y down, z toward viewer.
// No image texture: silhouette and anatomy are generated as real 3D points.
function createHeadPoints() {
  let seed = 712;
  const random = () => ((seed = seed * 16807 % 2147483647) - 1) / 2147483646;
  const g = (x,y,cx,cy,sx,sy) => Math.exp(-(((x-cx)/sx)**2 + ((y-cy)/sy)**2));
  const profile = [[-1.4,.02],[-1.32,.35],[-1.15,.62],[-.9,.76],[-.6,.79],[-.3,.77],[0,.78],[.25,.75],[.5,.69],[.78,.61],[1,.48],[1.16,.3],[1.23,.08]];
  function width(y) {
    for(let i=1;i<profile.length;i++) if(y<=profile[i][0]) {
      const [a,b]=profile[i-1], [c,d]=profile[i]; const t=Math.max(0,(y-a)/(c-a));
      return b+(d-b)*t;
    }
    return .08;
  }
  function depth(x,y) {
    const r=x/width(y);
    let z=.53*Math.sqrt(Math.max(0,1-r*r));
    z+=.15*g(x,y,0,-.83,.65,.5); // domed forehead
    for(const side of [-1,1]) {
      z-=.23*g(x,y,side*.32,-.23,.22,.14); // recessed sockets
      z+=.15*g(x,y,side*.33,-.43,.28,.075); // straight brow ridge
      z+=.19*g(x,y,side*.49,.08,.23,.17); // high cheekbones
      z-=.12*g(x,y,side*.5,.4,.21,.25); // hollow beneath cheek
      z+=.07*g(x,y,side*.5,.73,.18,.2); // jaw corner
      z+=.115*g(x,y,side*.135,.22,.075,.065); // nasal wings
      z-=.08*g(x,y,side*.10,.265,.043,.026); // nostrils
    }
    z+=.24*g(x,y,0,-.12,.095,.36); // narrow nose bridge
    z+=.36*g(x,y,0,.17,.105,.115); // projecting nose tip
    z+=.09*g(x,y,0,.43,.32,.22); // muzzle
    const mouthY=.55+.045*(x/.3)**2;
    z+=.075*g(x,y,0,mouthY-.035,.285,.035);
    z+=.09*g(x,y,0,mouthY+.047,.265,.04);
    z-=.09*g(x,y,0,mouthY,.3,.019);
    z-=.035*g(x,y,0,.76,.28,.045);
    z+=.17*g(x,y,0,.96,.33,.18); // broad chin plane
    return z;
  }
  const points=[];
  // Uniform front sampling avoids the old bright egg-shaped outline.
  for(let i=0;i<37000;i++) {
    const y=-1.39+random()*2.61, x=(random()*2-1)*width(y);
    const z=depth(x,y), e=.003;
    let nx=-(depth(x+e,y)-depth(x-e,y))/(2*e), ny=-(depth(x,y+e)-depth(x,y-e))/(2*e), nz=1;
    const length=Math.hypot(nx,ny,nz);nx/=length;ny/=length;nz/=length;
    const eye=Math.abs(Math.abs(x)-.32)<.18 && Math.abs(y+.23)<.045*(1-((Math.abs(x)-.32)/.18)**2);
    if(eye) continue;
    points.push({x,y,z,nx,ny,nz,a:.55+random()*.45,lip:y>.47&&y<.67&&Math.abs(x)<.3,eye:false});
  }
  // Back of skull adds volume during a turn, culled by its surface normal.
  for(let i=0;i<10000;i++) {
    const y=-1.38+random()*2.58, a=Math.PI/2+random()*Math.PI;
    const x=Math.sin(a)*width(y),z=Math.cos(a)*.62;
    points.push({x,y,z,nx:Math.sin(a),ny:0,nz:Math.cos(a),a:.45+random()*.3,eye:false});
  }
  // Small almond eyes: no floating luminous circles.
  for(const side of [-1,1]) {
    for(let i=0;i<850;i++) {
      const u=random()*2-1,v=random()*2-1;
      const x=side*.32+u*.174,y=-.23+v*.043*Math.sqrt(1-u*u),z=depth(x,-.23)+.035;
      points.push({x,y,z,nx:0,ny:0,nz:1,a:.7+random()*.3,eye:true});
    }
    // Ear rims, head only, no neck or torso.
    for(let i=0;i<950;i++) {
      const a=random()*Math.PI*2,r=.8+random()*.2;
      const x=side*(.765+Math.cos(a)*.072*r),y=-.03+Math.sin(a)*.22*r,z=.01+random()*.08;
      points.push({x,y,z,nx:side*.5,ny:0,nz:.86,a:.35+random()*.45,eye:false});
    }
  }
  return points;
}
