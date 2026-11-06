/* ── 지역 머리말 픽셀 효과 ──
   Sprite Fusion pixel-art VFX (MIT License, Copyright (c) 2026 Hugo Duprez) 를 이식.
   snow=혹한의 땅 · fireflies=초원의 땅 · embers=작열의 땅 · bubbles=바다의 땅 · fog=늪의 땅 · miasma(같은 fog, 녹물·독기 빛깔)=블라스파미아
   탐색 › 지역 화면의 .exr-head 뒤에 캔버스 하나(#exr-fx). render() 뒤 initRegionFx() 호출(04-ui).
   좌표: 월드 단위 2 = 아트 px 1 = CSS px 2. 동작 줄이기 설정이면 끔. */
const REGION_FX=(()=>{
const PX=2,TAU=Math.PI*2,BAYER=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
const rgb=(r,g,b,a=255)=>(((a&255)<<24)|((b&255)<<16)|((g&255)<<8)|(r&255))>>>0;
const hex=h=>{const v=parseInt(h.slice(1),16);return rgb(v>>16&255,v>>8&255,v&255);};
const mix=(c1,c2,t)=>{const u=1-t,ch=(c,s)=>(c>>>s)&255;return rgb(ch(c1,0)*u+ch(c2,0)*t,ch(c1,8)*u+ch(c2,8)*t,ch(c1,16)*u+ch(c2,16)*t,ch(c1,24)*u+ch(c2,24)*t);};
const hash=(n,k=0)=>((Math.imul(n+1+k*7919,2654435761)>>>0)%100000)/100000;
const noise=(x,sd=0)=>{const i=Math.floor(x),f=x-i,u=f*f*(3-2*f);return hash(i,sd)*2-1+(hash(i+1,sd)-hash(i,sd))*2*u;};
const bayer=(x,y)=>(BAYER[((y&3)<<2)|(x&3)]+.5)/16;
const clamp=(v,a=0,b=1)=>v<a?a:v>b?b:v;const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
function Rng(seed=1){let s=(seed>>>0)||1;const next=()=>{let t=(s=(s+0x6d2b79f5)>>>0);t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
  return {next,range:(a,b)=>a+(b-a)*next(),int:(a,b)=>Math.floor(a+(b+1-a)*next()),chance:p=>next()<p};}
/* 버퍼: ox=oy=0 고정 */
function Px(W,H,data){this.w=W;this.h=H;this.data=data;}
Px.prototype.at=function(x,y){x|=0;y|=0;return x<0||y<0||x>=this.w||y>=this.h?-1:y*this.w+x;};
Px.prototype.set=function(x,y,c){const i=this.at(x,y);if(i>=0)this.data[i]=c;};
Px.prototype.add=function(x,y,c,k){const i=this.at(x,y);if(i<0)return;const d=this.data[i];
  const r=Math.min(255,(d&255)+(c&255)*k),g=Math.min(255,((d>>>8)&255)+((c>>>8)&255)*k),b=Math.min(255,((d>>>16)&255)+((c>>>16)&255)*k);this.data[i]=rgb(r,g,b);};
Px.prototype.blend=function(x,y,c,a){const i=this.at(x,y);if(i<0)return;const d=this.data[i],oa=a+((d>>>24)/255)*(1-a);if(oa<=0)return;
  const k=a/oa,j=1-k;this.data[i]=rgb((c&255)*k+(d&255)*j,((c>>>8)&255)*k+((d>>>8)&255)*j,((c>>>16)&255)*k+((d>>>16)&255)*j,oa*255);};
Px.prototype.glow=function(cx,cy,r,c,k){if(r<1||k<=.01)return;const x0=Math.max(0,Math.floor(cx-r)),x1=Math.min(this.w-1,Math.ceil(cx+r)),y0=Math.max(0,Math.floor(cy-r)),y1=Math.min(this.h-1,Math.ceil(cy+r));
  for(let y=y0;y<=y1;y++){const dy=(y+.5-cy)/r;for(let x=x0;x<=x1;x++){const dx=(x+.5-cx)/r,d=dx*dx+dy*dy;if(d>=1)continue;const f=1-Math.sqrt(d);this.add(x,y,c,f*f*k);}}};
const dot=(buf,x,y,c,a=1)=>{const px=Math.floor(x),py=Math.floor(y);if(a>=1||a>bayer(px&3,py&3))buf.set(px,py,c);};

/* ── snow ── */
function snow(o){const A=o.area,X0=A.x,X1=A.x+A.w,TOP=A.y,G=o.ground,D=o.density,WIND=o.wind,R=Rng(o.seed||1);
  const F={W:hex('#ffffff'),w:hex('#e3edff'),b:hex('#9fb1e6'),d:hex('#6c7cb8')},FALL=[26,52,86],SWAY=[8,16,30];
  const spr=rows=>{const h=rows.length,w=rows[0].length,d=new Uint32Array(w*h);rows.forEach((r,y)=>[...r].forEach((c,x)=>{if(c!=='.')d[y*w+x]=F[c];}));return {w,h,d};};
  const CR=[spr(['...b...','.b.w.b.','..bwb..','bwwWwwb','..bwb..','.b.w.b.','...b...']),spr(['b..b..b','.b.w.b.','..wWw..','bwWWWwb','..wWw..','.b.w.b.','b..b..b']),spr(['..b..','.bwb.','bwWwb','.bwb.','..b..'])];
  const fl=[];const reset=(f,top)=>{f.x=R.range(X0-60,X1);f.y=top?TOP-R.range(0,40):R.range(TOP,G);f.vy=FALL[f.l]*R.range(.75,1.25);f.sw=SWAY[f.l]*R.range(.6,1.2);f.f=R.range(.8,1.8);f.ph=R.range(0,TAU);f.rest=-1;f.k=R.int(0,2);};
  [[0,260],[1,150],[2,30]].forEach(([l,n])=>{for(let i=0;i<Math.round(n*D);i++){const f={l};reset(f,false);fl.push(f);}});let t=0;
  return {update(dt){t+=dt;const wind=WIND+16*noise(t*.3,5);
      for(const f of fl){if(f.rest>=0){if((f.rest-=dt)<0)reset(f,true);continue;}
        f.y+=f.vy*dt;f.x+=(wind*(.5+f.l*.4)+Math.cos(t*f.f+f.ph)*f.sw)*dt;
        if(f.y>=G-1){if(f.l===0)reset(f,true);else{f.y=G-1;f.rest=R.range(1,2.6);}continue;}
        if(f.l===0&&f.y>G-30&&hash(Math.floor(f.ph*1000))<.4){reset(f,true);continue;}
        if(f.x>X1+40)f.x-=X1-X0+100;}},
    draw(buf){for(let l=0;l<3;l++)for(const f of fl){if(f.l!==l)continue;const x=f.x/PX,y=f.y/PX;
        if(f.rest>=0){const a=Math.min(1,f.rest/.8),fy=G/PX;dot(buf,x,fy-1,F.W,a);if(l===2){dot(buf,x-1,fy-1,F.w,a);dot(buf,x+1,fy-1,F.b,a);}continue;}
        if(l===0)dot(buf,x,y,hash(Math.floor(f.ph*100),1)<.5?F.d:F.b);
        else if(l===1){dot(buf,x,y,F.W);dot(buf,x+1,y,F.w);dot(buf,x,y+1,F.w);dot(buf,x+1,y+1,F.b);}
        else{const s=CR[f.k===2?2:Math.floor(t*3+f.ph)&1],x0=Math.round(x-s.w/2),y0=Math.round(y-s.h/2);for(let yy=0;yy<s.h;yy++)for(let xx=0;xx<s.w;xx++){const c=s.d[yy*s.w+xx];if(c>>>24)buf.set(x0+xx,y0+yy,c);}}}}};}

/* ── fireflies ── */
function fireflies(o){const A=o.area,X0=A.x,X1=A.x+A.w,G=A.y+A.h,R=Rng(o.seed||1),D=o.density??1,NC=o.close??6;
  const FLY={core:hex('#faffbe'),glow:hex('#c8ff5a'),dim:hex('#6f8f2a'),body:hex('#2a2418'),wing:hex('#8a96a8')},GRASS=['#0d1a12','#15281a','#1f3a22','#2e5230'].map(hex);
  const far=[];const close=Array.from({length:NC},(_,i)=>{const cx=X0+40+i*((A.w-80)/Math.max(1,NC-1))+R.range(-30,30);return {cx,cy:G-R.range(40,Math.min(180,A.h-16)),seed:i*17+3,per:R.range(1.6,2.6),ph:R.range(0,1)};});
  const blades=o.grass===false?[]:Array.from({length:Math.round((A.w/PX+76)/1.6)},(_,i)=>({x:X0/PX-30+i*1.6+hash(i,1)*1.5,h:2+Math.floor(hash(i,2)*6)+(hash(i,3)<.15?4:0),c:Math.floor(hash(i,4)*3),front:hash(i,5)<.25}));
  let t=0,acc=0;
  const grass=(buf,front)=>{for(const b of blades){if(b.front!==front)continue;const sway=noise(t*.7+b.x*.04,9)*1.6,fy=G/PX;for(let r=0;r<b.h;r++){const u=r/b.h;dot(buf,b.x+sway*u*u,fy-1-r,r===b.h-1?GRASS[Math.min(3,b.c+1)]:GRASS[b.c]);}}};
  const step=dt=>{if(R.chance(.12*D)){const x=R.range(X0,X1),y=G-R.range(12,Math.min(230,A.h-6)),life=R.range(4,8);far.push({x,y,vx:R.range(-20,20),vy:R.range(-15,15),life,max:life,seed:R.next()*100});}
    for(let i=far.length-1;i>=0;i--){const p=far[i];if((p.life-=dt)<=0){far.splice(i,1);continue;}const a=p.seed*.63+t*(.7+(p.seed%1)*.9),k=Math.min(1,dt*1.5);
      p.vx+=(Math.cos(a)*55-p.vx)*k;p.vy+=(Math.sin(a*1.3)*38-8-p.vy)*k;p.x+=p.vx*dt;p.y+=p.vy*dt;}};
  for(let i=0;i<300;i++){t+=1/60;step(1/60);} /* 6초 미리 돌려 시작부터 가득 */
  return {update(dt){acc+=dt;while(acc>=1/60){acc-=1/60;t+=1/60;step(1/60);}},
    draw(buf,light){grass(buf,false);
      for(const p of far){const k=p.life/p.max,blink=Math.max(0,Math.sin(t*(2.2+(p.seed%3)*.7)+p.seed)),a=Math.min(1,(1-k)*6)*Math.min(1,k*4)*blink;if(a<.08)continue;
        const ax=p.x/PX,ay=p.y/PX;buf.set(Math.floor(ax),Math.floor(ay),a>.5?FLY.core:FLY.glow);light.glow(ax,ay,7,FLY.glow,.55*a);}
      grass(buf,true);
      for(const fl of close){const x=(fl.cx+noise(t*.32,fl.seed)*140)/PX,y=(fl.cy+noise(t*.27,fl.seed+9)*Math.min(60,A.h*.25))/PX;
        const u=(t/fl.per+fl.ph)%1,pulse=u<.6?Math.pow(Math.sin((u/.6)*Math.PI),.7):0;
        const px=Math.round(x),py=Math.round(y),dir=noise(t*.32+.05,fl.seed)>noise(t*.32,fl.seed)?1:-1,wy=py-(Math.sin(t*50+fl.seed)>0?2:1);
        dot(buf,px-dir,wy,FLY.wing,.6);dot(buf,px,wy,FLY.wing,.6);dot(buf,px+dir,py,FLY.body);dot(buf,px+dir*2,py,FLY.body);
        dot(buf,px,py,pulse>.25?FLY.core:FLY.dim);dot(buf,px-dir,py,pulse>.5?FLY.core:pulse>.15?FLY.glow:FLY.dim);
        if(pulse>.6)buf.set(px-dir,py+1,FLY.glow);light.glow(x,y,26,FLY.glow,.5*pulse);light.glow(x,y,8,FLY.core,.6*pulse);
        if(pulse>.4){const a=(pulse-.4)*1.2;dot(buf,px-dir,py-2,FLY.glow,a);dot(buf,px-dir,py+2,FLY.glow,a);dot(buf,px-dir-2,py,FLY.glow,a);dot(buf,px-dir+2,py,FLY.glow,a);}}}};}

/* ── embers ── */
function embers(o){const A=o.area,X0=A.x,X1=A.x+A.w,BOTTOM=A.y+A.h,R=Rng(o.seed||1),D=o.density??1;
  const HOT=hex('#fff3a6'),YELLOW=hex('#ffe26b'),ORANGE=hex('#ff8a2a'),DEEP=hex('#f2561d'),RED=hex('#c9281f'),DARK=[RED,hex('#8a1f17'),hex('#4f1a13')],ASH=[hex('#5a5160'),hex('#3a3442')],HEAT=hex('#ff7832');
  const sparks=[],cinders=[];let t=0,acc=0;
  const step=dt=>{for(let i=0;i<2;i++)if(R.chance(.8*D)){const life=R.range(2.2,4.2);sparks.push({x:R.range(X0-40,X1+40),y:R.range(BOTTOM-10,BOTTOM+40),vx:R.range(-40,40),vy:-R.range(90,240),life,max:life,seed:R.next()*100});}
    const cin=(vy,life,s,ash)=>cinders.push({x:R.range(X0,X1),y:BOTTOM+10,vx:R.range(-20,20),vy,life,max:life,s,seed:R.next()*100,ash});
    if(R.chance(.22*D))cin(-R.range(50,110),R.range(3.5,6),R.chance(.3)?2:1,false);if(R.chance(.05*D))cin(-R.range(30,60),R.range(5,7),1,true);
    for(let i=cinders.length-1;i>=0;i--){const c=cinders[i];if((c.life-=dt)<=0){cinders.splice(i,1);continue;}c.vx+=noise(t*.9+c.seed,1)*60*dt;c.vx-=c.vx*.8*dt;c.x+=c.vx*dt+Math.sin(t*2+c.seed)*10*dt;c.y+=c.vy*dt;}
    for(let i=sparks.length-1;i>=0;i--){const p=sparks[i];if((p.life-=dt)<=0){sparks.splice(i,1);continue;}p.vy+=(-60+Math.sin(t*3+p.seed)*40)*dt;p.vx+=Math.cos(t*2.3+p.seed)*90*dt;p.vx-=p.vx*1.6*dt;p.vy-=p.vy*1.6*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;}};
  for(let i=0;i<210;i++){t+=1/60;step(1/60);} /* 3.5초 예열 */
  return {update(dt){acc+=dt;while(acc>=1/60){acc-=1/60;t+=1/60;step(1/60);}},
    draw(buf,light){const y1=BOTTOM/PX;
      for(let x=Math.floor(X0/PX)-30;x<Math.ceil(X1/PX)+30;x++){const h=.7+.3*noise(x*.02+t*.6,7);for(let r=0;r<22;r++)dot(buf,x,y1-1-r,DARK[r<4?0:r<10?1:2],.6*h*(1-r/22));if(x%24===0)light.glow(x,y1+6,80,HEAT,.26*h);}
      for(const c of cinders){const k=c.life/c.max,x=c.x/PX,y=c.y/PX,a=Math.min(1,k*3)*Math.min(1,(1-k)*8);
        if(c.ash){dot(buf,x,y,ASH[0],a);dot(buf,x+(Math.sin(t*3+c.seed)>0?1:0),y+1,ASH[1],a);continue;}
        const fl=.65+.35*noise(t*9+c.seed,2),hot=k*fl,core=hot>.55?HOT:hot>.35?YELLOW:ORANGE,rim=hot>.45?ORANGE:DEEP;
        if(c.s===2){dot(buf,x-1,y,rim,a);dot(buf,x+1,y,rim,a);dot(buf,x,y-1,rim,a);dot(buf,x,y+1,rim,a);dot(buf,x,y,core,a);light.glow(x,y,9,ORANGE,.45*a*fl);}
        else{dot(buf,x,y,core,a);dot(buf,x,y+1,rim,a*.6);light.glow(x,y,5,ORANGE,.35*a*fl);}}
      for(const p of sparks){const k=p.life/p.max,ax=p.x/PX,ay=p.y/PX,c=k>.5?(Math.sin(t*22+p.seed*3)>-.2?YELLOW:ORANGE):k>.2?ORANGE:RED;buf.set(Math.floor(ax),Math.floor(ay),c);light.glow(ax,ay,3,c,.3*k);}}};}

/* ── bubbles ── */
function bubbles(o){const A=o.area,X0=A.x,X1=A.x+A.w,TOP=A.y,G=A.y+A.h,R=Rng(o.seed||1),D=o.density??1,NS=Math.round(110*(o.specks??1));
  const [HI,LIT,RIM,SHADE]=['#ffffff','#c6f3ff','#68bfe6','#2f7fb6'].map(hex),FILL=mix(RIM,SHADE,.5),WATER=hex('#0b3550'),SPECKS=['#5f8a9a','#7fa3a8','#4c6f86'].map(hex);
  const VENT=[];['.OOO.OOO.','OLPPMPPLO','LPPMMMPPL'].forEach((r,y)=>[...r].forEach((c,x)=>{if(c!=='.')VENT.push([x-4,y-3,hex({O:'#1a1422',L:'#62788a',M:'#0a1018',P:'#3c4a5a'}[c])]);}));
  const NV=o.vents||3;const vents=Array.from({length:NV},(_,i)=>({x:X0+((i+.5+R.range(-.3,.3))/NV)*A.w,acc:R.next(),burst:R.range(.5,2.5),seed:R.range(0,100)}));
  const list=[],pops=[];let t=0;
  const spawn=(v,y,big)=>{const r=big?R.range(1.5,3.2)*big:R.chance(.7)?R.range(.5,1.4):R.range(1.4,2.6);list.push({x0:v.x+R.range(-4,4),x:v.x,y,r,vy:0,ph:R.range(0,TAU),wob:0,near:R.chance(.35)});};
  for(const v of vents)for(let y=G-4;y>TOP;y-=R.range(18,46)/D){spawn(v,y,0);const b=list[list.length-1];b.r*=1+(1-(y-TOP)/A.h)*.4;b.vy=-(40+26*b.r);}
  const specks=Array.from({length:NS},()=>({x:R.range(X0,X1),y:R.range(TOP,G),seed:R.range(0,100),c:R.int(0,2),near:R.chance(.3)}));
  function drawBubble(buf,light,b){const cx=b.x/PX,cy=b.y/PX,r=b.r;
    if(r<.9){buf.set(Math.floor(cx),Math.floor(cy),r<.7?RIM:LIT);return;}
    if(r<1.5){const px=Math.floor(cx),py=Math.floor(cy);buf.set(px,py,HI);buf.set(px+1,py,LIT);buf.set(px,py+1,RIM);buf.set(px+1,py+1,SHADE);light.glow(cx+.5,cy+.5,3,LIT,.12);return;}
    const sq=.1*Math.sin(b.ph*2)*Math.min(1,(r-1.5)/2)+b.wob*.25,rx=r*(1+sq),ry=r*(1-sq);
    for(let y=Math.floor(cy-ry-1);y<=Math.ceil(cy+ry+1);y++)for(let x=Math.floor(cx-rx-1);x<=Math.ceil(cx+rx+1);x++){const dx=(x+.5-cx)/rx,dy=(y+.5-cy)/ry,d=Math.sqrt(dx*dx+dy*dy)*r;if(d>r+.5)continue;
      const lit=(-dx-dy)/Math.SQRT2/Math.max(.01,d/r);if(d>r-.6)buf.set(x,y,lit>.45?LIT:lit<-.55?SHADE:RIM);else if(bayer(x&3,y&3)<.12)buf.set(x,y,FILL);}
    const hx=Math.round(cx-rx*.45),hy=Math.round(cy-ry*.45);buf.set(hx,hy,HI);if(r>=2.5){buf.set(hx+1,hy,LIT);buf.set(hx,hy+1,LIT);}
    if(r>=2)buf.set(Math.round(cx+rx*.5),Math.round(cy+ry*.5),LIT);light.glow(cx,cy,r*2.4+2,RIM,.14);}
  return {update(dt){t+=dt;
      for(const v of vents){v.acc+=dt*5*D*(.7+.3*noise(t*.8+v.seed,3));for(;v.acc>1;v.acc--)spawn(v,G-3,0);
        if((v.burst-=dt)<0){v.burst=R.range(1.4,3.2);const n=R.int(5,10);for(let i=0;i<n;i++)spawn(v,G-3-i*5,R.range(.6,1));for(let i=0;i<5;i++)specks.push({x:v.x+R.range(-8,8),y:G-R.range(2,10),seed:R.range(0,100),c:0,near:false});}}
      for(let i=list.length-1;i>=0;i--){const b=list[i];b.vy+=(-(40+26*b.r)-b.vy)*Math.min(1,dt*3);b.y+=b.vy*dt;b.ph+=dt*(4+2/b.r);b.x=b.x0+Math.sin(b.ph)*(1+b.r*1.6);b.x0+=noise(t*.4+i*.13,5)*6*dt;b.r=Math.min(5,b.r+dt*.12);b.wob*=1-Math.min(1,dt*4);
        if(b.y<TOP+2){pops.push({x:b.x,y:TOP,r:b.r,t:0});list.splice(i,1);}}
      for(let i=0;i<list.length;i++){const a=list[i];if(a.r<1)continue;for(let j=i+1;j<list.length;j++){const b=list[j];if(b.r<1||Math.hypot(a.x-b.x,a.y-b.y)/PX>(a.r+b.r)*.75)continue;a.r=Math.cbrt(a.r**3+b.r**3);a.x0=(a.x0+b.x0)/2;a.wob=1;list.splice(j--,1);}}
      for(let i=pops.length-1;i>=0;i--)if((pops[i].t+=dt)>.2)pops.splice(i,1);
      for(let i=0;i<specks.length;i++){const s=specks[i];s.y+=(5+3*Math.sin(s.seed))*dt;s.x+=noise(t*.3+s.seed,9)*8*dt;if(s.y>G-1){if(i>=NS)specks.splice(i--,1);else{s.y=TOP+2;s.x=R.range(X0,X1);}}}},
    draw(buf,light){const top=Math.floor(TOP/PX),gy=Math.ceil(G/PX)+1,x0=Math.max(0,Math.floor(X0/PX)),x1=Math.min(buf.w-1,Math.ceil(X1/PX));
      for(let y=Math.max(0,top);y<=Math.min(buf.h-1,gy);y++)for(let x=x0;x<=x1;x++)buf.blend(x,y,WATER,.2+.12*((y-top)/Math.max(1,gy-top)));
      const cgy=Math.round(G/PX);for(let y=Math.max(0,top);y<=Math.min(light.h-1,cgy+6);y++){const k=y>=cgy-1?1:.18+.32*(1-(y-top)/Math.max(1,cgy-top));
        for(let x=x0;x<=x1;x++){const u=x*.16+1.9*Math.sin(y*.12+t*.9),v=y*.19+1.9*Math.sin(x*.1-t*.7),n1=Math.sin(u)+Math.sin(v),
          n2=Math.sin(x*.09+y*.07+1.4*Math.sin(y*.15-t*.6))+Math.sin(y*.11-x*.05+1.4*Math.sin(x*.13+t*.8)),f=(Math.max(0,1-Math.abs(n1)*3)+.7*Math.max(0,1-Math.abs(n2)*3))*k,d=bayer(x&3,y&3);
          if(f>1.05||(f>.8&&d<(f-.8)/.25))light.add(x,y,LIT,.3);else if(f>.45||(f>.3&&d<(f-.3)/.15))light.add(x,y,RIM,.15);}}
      for(let x=x0;x<=x1;x++){const sy=Math.round(top+(Math.sin(x*.11+t*1.6)*1.2+Math.sin(x*.043-t*.9)*1.6))+2,glint=Math.sin(x*.37-t*2.3)*Math.sin(x*.13+t*1.1)>.55;
        buf.set(x,sy,glint?HI:LIT);buf.set(x,sy+1,RIM);for(let k=2;k<7;k++)if(bayer(x&3,(sy+k)&3)<.5-k*.07)buf.set(x,sy+k,SHADE);if((x&3)===0)light.glow(x,sy+2,7,LIT,glint?.2:.09);}
      for(const v of vents){const cx=Math.round(v.x/PX),g=Math.round(G/PX);for(const [dx,dy,c] of VENT)buf.set(cx+dx,g+dy,c);}
      const speck=s=>{const x=Math.floor(s.x/PX),y=Math.floor(s.y/PX),tw=Math.sin(t*1.3+s.seed);if(bayer(x&3,y&3)>.55+.3*tw)return;buf.set(x,y,tw>.85?LIT:SPECKS[s.c]);};
      for(const s of specks)if(!s.near)speck(s);for(const b of list)if(!b.near)drawBubble(buf,light,b);
      for(const p of pops){const k=p.t/.2,x=p.x/PX,y=p.y/PX+2,r=p.r+1+k*3;for(let a=0;a<TAU;a+=.5/r)if(Math.sin(a)<.2)dot(buf,x+Math.cos(a)*r,y+Math.sin(a)*r*.5,k<.5?HI:LIT,1-k);
        if(p.r>1.5){dot(buf,x-2,y-2-k*4,LIT,1-k);dot(buf,x+2,y-3-k*5,LIT,1-k);}}
      for(const b of list)if(b.near)drawBubble(buf,light,b);for(const s of specks)if(s.near)speck(s);}};}

/* ── fog ── */
function fog(o){const A=o.area,D=o.density??1,WIND=o.wind??22,N=Math.max(1,Math.min(4,o.layers??3)),TONES=(o.colors||['#3b3f63','#5a6185','#8389a8']).map(hex),WHITE=hex('#ffffff');
  const FW=256,FH=128,T0=.3,T1=.52,T2=.74,BW=.07;
  const field=(()=>{const out=new Float32Array(FW*FH);let amp=.5,total=0;const seed=o.seed||1;
    for(const cells of [4,8,16,32]){const cs=FW/cells,rows=FH/cs;const h=(a,b)=>hash((((a%cells)+cells)%cells)+(((b%rows)+rows)%rows)*1000,seed*31+cells);
      for(let y=0;y<FH;y++)for(let x=0;x<FW;x++){const gx=x/cs,gy=y/cs,ix=Math.floor(gx),iy=Math.floor(gy),u=gx-ix,v=gy-iy,su=u*u*(3-2*u),sv=v*v*(3-2*v);
        const tp=h(ix,iy)+(h(ix+1,iy)-h(ix,iy))*su,bt=h(ix,iy+1)+(h(ix+1,iy+1)-h(ix,iy+1))*su;out[y*FW+x]+=(tp+(bt-tp)*sv)*amp;}
      total+=amp;amp*=.5;}for(let i=0;i<out.length;i++)out[i]/=total;return out;})();
  const sample=(u,v)=>{const x=Math.floor(u),y=Math.floor(v),fx=u-x,fy=v-y,x0=x&(FW-1),x1=(x0+1)&(FW-1),y0=y&(FH-1),y1=(y0+1)&(FH-1);
    const a=field[y0*FW+x0],b=field[y0*FW+x1],c=field[y1*FW+x0],d=field[y1*FW+x1];return a+(b-a)*fx+(c-a+(a-b-c+d)*fx)*fy;};
  const X0=A.x/PX,X1=(A.x+A.w)/PX,BOT=(A.y+A.h)/PX,H=A.h/PX;let t=0,edges=new Float32Array(0),breaths=edges;
  function bank(buf,d,i){const top=BOT-H*(1-.62*d),base=top+(BOT-top)*.8,bottom=BOT+H*(.03+.16*d),sx=.3+.25*d,sy=1.5+.8*d;
    const drift=(t*WIND*(.4+.8*d))/PX,curl=t*(.6+.5*d),alpha=(.2+.16*d)*D,off=i*97.3;
    const y0=Math.max(0,Math.floor(top)),y1=Math.min(buf.h-1,Math.ceil(bottom)),x0=Math.max(0,Math.floor(X0)),x1=Math.min(buf.w-1,Math.ceil(X1));
    if(alpha<=.01||y0>y1||x0>x1)return;
    const crest=mix(TONES[2],WHITE,.14+.12*d),dense=.6+.5*D;const thick=(P,n)=>(P*.72+(clamp((n-.5)*2.6+.5)-.5)*.95)*dense;
    const prof=y=>smooth(top,base,y)*(1-smooth(bottom-3,bottom+1,y));
    if(edges.length<x1-x0+1){edges=new Float32Array(x1-x0+1);breaths=new Float32Array(x1-x0+1);}
    for(let x=x0;x<=x1;x++){edges[x-x0]=smooth(X0,X0+40,x)*(1-smooth(X1-40,X1,x));breaths[x-x0]=2.4*Math.sin(t*.35+x*.013+i*1.7);}
    for(let y=y0;y<=y1;y++){const p=prof(y),pUp=prof(y-2);if(p<=.02)continue;let wu=0;
      for(let x=x0;x<=x1;x++){const edge=edges[x-x0];if(edge<=.02)continue;if(((x-x0)&1)===0)wu=sample(x*.35+curl*9+off,y*.6-curl*3)-.5;
        const br=breaths[x-x0],u=x*sx-drift+wu*30+off,f=thick(p,sample(u,(y+br)*sy+wu*12))*edge,b=bayer(x&3,y&3);let c=-1;
        if(f>T2+BW||(f>T2&&(f-T2)/BW>b))c=2;else if(f>T1+BW||(f>T1&&(f-T1)/BW>b))c=1;else if(f>T0+BW||(f>T0&&(f-T0)/BW>b))c=0;if(c<0)continue;
        if(c>=1&&thick(pUp,sample(u,(y-2+br)*sy+wu*12))*edge<(c===2?T2:T1)-.03){buf.blend(x,y,crest,alpha*(.95+.15*c));continue;}
        buf.blend(x,y,TONES[c],alpha*(.6+.2*c));}}}
  return {update(dt){t+=dt;},draw(buf){for(let i=0;i<N;i++)bank(buf,N===1?.5:i/(N-1),i);}};}

const MAKE={snow,fireflies,embers,bubbles,fog,miasma:fog};
let cur=null;
function start(cv){if(cur&&cur.cv===cv)return;stop();
  try{if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;}catch(e){}
  const kind=cv.dataset.fx;if(!MAKE[kind])return;
  const host=cv.parentElement;const stopAt=host.querySelector('.wdb')||host.querySelector('.exr-now');
  const cw=host.clientWidth,ch=stopAt?Math.min(host.clientHeight,stopAt.offsetTop+stopAt.offsetHeight+12):host.clientHeight;
  const W=Math.max(1,Math.round(cw/PX)),H=Math.max(1,Math.round(ch/PX));if(W<8||H<8)return;
  cv.width=W;cv.height=H;cv.style.height=ch+'px';
  const ctx=cv.getContext('2d');const img=ctx.createImageData(W,H);const out=new Uint32Array(img.data.buffer);
  const col=new Uint32Array(W*H),lit=new Uint32Array(W*H),buf=new Px(W,H,col),light=new Px(W,H,lit);
  const WW=W*PX,HH=H*PX,wx=cv.dataset.w,areaK=(WW*HH)/(680*370);
  const fx=kind==='snow'?snow({area:{x:0,y:0,w:WW,h:HH},ground:HH+24,density:Math.max(.15,areaK*(wx==='blizzard'?1.25:wx==='snow'?.85:.4)),wind:wx==='blizzard'?46:14,seed:7})
    :kind==='fireflies'?fireflies({area:{x:0,y:0,w:WW,h:HH},density:Math.max(.4,WW/680*.8),close:Math.max(3,Math.round(WW/260)),seed:5})
    :kind==='embers'?embers({area:{x:0,y:0,w:WW,h:HH},density:Math.min(1.4,Math.max(.4,WW/680*.7)),seed:3})
    :kind==='bubbles'?bubbles({area:{x:0,y:0,w:WW,h:HH},vents:Math.max(2,Math.round(WW/360)),density:.8,specks:WW/680*.8,seed:4})
    :kind==='miasma'?fog({area:{x:-80,y:0,w:WW+160,h:HH},density:wx==='fog'?1.2:.9,wind:16,layers:3,colors:['#3a2c46','#5b4a5c','#8a8f62'],seed:9})
    :fog({area:{x:-80,y:0,w:WW+160,h:HH},density:wx==='fog'?1.25:.9,seed:2});
  const c={cv,raf:0,last:performance.now(),acc:0};cur=c;
  const frame=()=>{col.fill(0);lit.fill(0);fx.draw(buf,light);
    for(let i=0;i<out.length;i++){const L=lit[i],C=col[i];
      /* 빛 버퍼는 가산 → 알파로 바꿔 깔고, 그 위에 색 버퍼를 알파 합성 */
      let r=0,g=0,b=0,a=0;if(L>>>24){const lr=L&255,lg=(L>>>8)&255,lb=(L>>>16)&255,la=Math.max(lr,lg,lb);if(la>0){a=la/255;r=lr*255/la;g=lg*255/la;b=lb*255/la;}}
      const ca=(C>>>24)/255;if(ca>0){const oa=ca+a*(1-ca);r=((C&255)*ca+r*a*(1-ca))/oa;g=(((C>>>8)&255)*ca+g*a*(1-ca))/oa;b=(((C>>>16)&255)*ca+b*a*(1-ca))/oa;a=oa;}
      out[i]=a>0?rgb(r,g,b,a*255):0;}
    ctx.putImageData(img,0,0);};
  const loop=ts=>{if(!cv.isConnected){stop();return;}const dt=Math.min(.05,(ts-c.last)/1000);c.last=ts;c.acc+=dt;
    if(c.acc>=1/30){fx.update(c.acc);c.acc=0;frame();} /* 30fps로 그려 부담 줄임 */
    c.raf=requestAnimationFrame(loop);};
  frame();c.raf=requestAnimationFrame(loop);}
function stop(){if(cur){cancelAnimationFrame(cur.raf);cur=null;}}
return {start,stop};})();
function initRegionFx(){const cv=document.getElementById('exr-fx');if(cv)REGION_FX.start(cv);else REGION_FX.stop();}
