'use strict';
/* 캐릭터 이미지 · 배너 · 시작(boot) */
/* ───────── 캐릭터 이미지 설정 ───────── */
let crop=null;
function openCrop(){
  const me=S.me,pc=me.portraitCrop||{};
  crop={src:me.portraitSrc||me.portrait||null,zoom:pc.zoom||1,cx:pc.cx,cy:pc.cy,img:null};
  showCrop();if(crop.src)loadCropImg(crop.src,!!me.portraitSrc);
}
function cropHTML(){
  const z=crop.zoom;
  return `<div class="row" style="justify-content:space-between"><h3>캐릭터 이미지 설정</h3><button class="btn btn-sm btn-ghost" data-act="crop-cancel">닫기</button></div>
  <div class="crop-wrap">
    <div class="crop-frame" data-crop-frame tabindex="0" aria-label="이미지 위치 조정 영역 · 드래그하거나 방향키로 옮기세요">${crop.img?`<img id="crop-img" src="${crop.src}" alt="" draggable="false">`:`<div class="crop-empty">${crop.src?'불러오는 중…':'이미지를 선택하세요'}</div>`}</div>
    <div class="stack crop-ctl">
      <label class="btn">이미지 선택<input type="file" accept="image/*" class="sr" id="crop-file" data-act-change="cropfile"></label>
      <label class="stack" style="gap:4px"><span class="muted" style="font-size:12px">확대 <span class="num" id="crop-zv">${Math.round(z*100)}%</span></span><input type="range" id="crop-zoom" min="1" max="3" step="0.01" value="${z}" ${crop.img?'':'disabled'}></label>
      <button class="btn btn-sm btn-ghost" data-act="crop-center" ${crop.img?'':'disabled'}>가운데 맞춤</button>
      <div class="stack" style="gap:4px"><span class="muted" style="font-size:12px">미리보기</span><div class="crop-prev" aria-hidden="true">${crop.img?'<canvas id="crop-mini" width="192" height="256"></canvas>':''}</div></div>
    </div>
  </div>
  <p class="faint" style="font-size:12px">드래그하거나 방향키로 위치를 옮기고, 확대 막대나 마우스 휠로 크기를 조절하세요. 3:4 비율로 저장됩니다.</p>
  <div class="row"><button class="btn btn-primary" data-act="crop-apply">적용</button>${S.me.portrait?'<button class="btn btn-ghost btn-danger" data-act="crop-clear">기본 이미지로</button>':''}<button class="btn btn-ghost" data-act="crop-cancel">취소</button></div>`;
}
function showCrop(){modal(cropHTML());const m=$('.modal');if(m)m.classList.add('wide');paintCrop();}
function loadCropImg(src,keep){
  const img=new Image();
  img.onload=()=>{if(!crop)return;crop.img=img;crop.w=img.naturalWidth;crop.h=img.naturalHeight;if(!keep||crop.cx==null){crop.zoom=1;crop.cx=crop.w/2;crop.cy=crop.h/2;}showCrop();};
  img.onerror=()=>{toast('이미지를 읽지 못했습니다. 다른 파일을 선택하세요.','bad');};
  img.src=src;
}
function cropFile(file){
  if(!/^image\//.test(file.type)){toast('이미지 파일(JPG, PNG, WEBP 등)을 선택하세요.','warn');return;}
  if(file.size>20*1024*1024){toast('20MB 이하의 이미지를 선택하세요.','warn');return;}
  const r=new FileReader();
  r.onload=()=>{const img=new Image();img.onload=()=>{
    const k=Math.min(1,1000/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);
    c.getContext('2d').drawImage(img,0,0,c.width,c.height);crop.src=c.toDataURL('image/jpeg',0.86);crop.img=null;showCrop();loadCropImg(crop.src,false);};
    img.onerror=()=>toast('이미지를 읽지 못했습니다. 다른 파일을 선택하세요.','bad');img.src=r.result;};
  r.readAsDataURL(file);
}
const cropScale=(W,H)=>Math.max(W/crop.w,(H||W*4/3)/crop.h)*crop.zoom;
function clampCrop(W,H){H=H||W*4/3;const sc=cropScale(W,H),hw=W/(2*sc),hh=H/(2*sc);crop.cx=Math.min(Math.max(crop.cx,hw),crop.w-hw);crop.cy=Math.min(Math.max(crop.cy,hh),crop.h-hh);}
function drawCrop(ctx,W,H){H=H||W*4/3;clampCrop(W,H);const sc=cropScale(W,H);ctx.drawImage(crop.img,W/2-crop.cx*sc,H/2-crop.cy*sc,crop.w*sc,crop.h*sc);}
function paintCrop(){
  if(!crop||!crop.img)return;const fr=$('[data-crop-frame]'),im=$('#crop-img');if(!fr||!im)return;
  const W=fr.clientWidth||240,H=fr.clientHeight||W*4/3;clampCrop(W,H);const sc=cropScale(W,H);
  Object.assign(im.style,{width:crop.w*sc+'px',height:crop.h*sc+'px',left:(W/2-crop.cx*sc)+'px',top:(H/2-crop.cy*sc)+'px'});
  const zv=$('#crop-zv');if(zv)zv.textContent=Math.round(crop.zoom*100)+'%';
  const mini=$('#crop-mini');if(mini){const ctx=mini.getContext('2d');ctx.clearRect(0,0,mini.width,mini.height);drawCrop(ctx,mini.width,mini.height);}
}
function cropZoom(z){crop.zoom=Math.min(3,Math.max(1,z));const zr=$('#crop-zoom');if(zr)zr.value=crop.zoom;paintCrop();}
document.addEventListener('input',e=>{if(e.target.id==='crop-zoom'&&crop)cropZoom(+e.target.value);});
document.addEventListener('pointerdown',e=>{const fr=e.target.closest&&e.target.closest('[data-crop-frame]');if(!fr||!crop||!crop.img)return;e.preventDefault();crop.drag={x:e.clientX,y:e.clientY};try{fr.setPointerCapture(e.pointerId);}catch(_){} });
document.addEventListener('pointermove',e=>{if(!crop||!crop.drag)return;const fr=$('[data-crop-frame]');const sc=cropScale(fr.clientWidth||240,fr.clientHeight);crop.cx-=(e.clientX-crop.drag.x)/sc;crop.cy-=(e.clientY-crop.drag.y)/sc;crop.drag={x:e.clientX,y:e.clientY};paintCrop();});
const endDrag=()=>{if(crop&&crop.drag){crop.drag=null;crop.justDragged=now();}};
document.addEventListener('pointerup',endDrag);document.addEventListener('pointercancel',endDrag);
document.addEventListener('wheel',e=>{const fr=e.target.closest&&e.target.closest('[data-crop-frame]');if(!fr||!crop||!crop.img)return;e.preventDefault();cropZoom(crop.zoom-e.deltaY*0.0015);},{passive:false});
document.addEventListener('keydown',e=>{if(!crop||!crop.img||!e.target.matches('[data-crop-frame]'))return;const d={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(!d)return;e.preventDefault();const sc=cropScale(e.target.clientWidth||240,e.target.clientHeight);crop.cx+=d[0]*12/sc;crop.cy+=d[1]*12/sc;paintCrop();});
function applyCrop(){
  const me=S.me,prev={portrait:me.portrait,portraitSrc:me.portraitSrc,portraitCrop:me.portraitCrop};
  if(crop.img){const c=document.createElement('canvas');c.width=480;c.height=640;drawCrop(c.getContext('2d'),480,640);
    me.portrait=c.toDataURL('image/jpeg',0.88);bump('portraitSet');me.portraitSrc=crop.src;me.portraitCrop={zoom:crop.zoom,cx:crop.cx,cy:crop.cy};}
  try{localStorage.setItem(SAVE,JSON.stringify(S));}catch(e){Object.assign(me,prev);toast('저장 공간이 부족해 이미지를 저장하지 못했습니다. 더 작은 이미지를 써 보세요.','bad');return;}
  crop=null;modal('');render();toast('캐릭터 이미지 설정을 적용했습니다.','good');
}
let rdrag=null;
document.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse')return;const r=e.target.closest&&e.target.closest('[data-rslide]');if(!r)return;rdrag={el:r,x:e.clientX,sl:r.scrollLeft,moved:false};});
document.addEventListener('pointermove',e=>{if(!rdrag)return;const dx=e.clientX-rdrag.x;if(Math.abs(dx)>4){rdrag.moved=true;rdrag.el.classList.add('dragging');}if(rdrag.moved)rdrag.el.scrollLeft=rdrag.sl-dx;});
document.addEventListener('pointerup',()=>{if(!rdrag)return;const r=rdrag;rdrag=null;r.el.classList.remove('dragging');
  if(r.moved){const c=r.el.querySelector('.rcard');if(c){const w=c.getBoundingClientRect().width+12;const pos=r.el.scrollLeft/w;const dir=r.el.scrollLeft-r.sl;const idx=Math.abs(dir)>w*0.15?(dir>0?Math.ceil(pos):Math.floor(pos)):Math.round(r.sl/w);r.el.scrollTo({left:idx*w,behavior:'smooth'});}
    const stop=ev=>{ev.stopPropagation();ev.preventDefault();};document.addEventListener('click',stop,{capture:true,once:true});setTimeout(()=>document.removeEventListener('click',stop,{capture:true}),50);}});
/* ───────── 배너 안개 ───────── */
let fogRAF=null,fogCanvas=null;
function startFog(c){
  if(fogCanvas===c)return;stopFog();fogCanvas=c;
  const ctx=c.getContext('2d');const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W,H,parts;
  const size=()=>{const r=c.getBoundingClientRect();W=c.width=Math.max(1,r.width*devicePixelRatio);H=c.height=Math.max(1,r.height*devicePixelRatio);
    parts=Array.from({length:Math.round(r.width/9)},()=>({x:Math.random()*W,y:Math.random()*H,r:(Math.random()*1.4+.4)*devicePixelRatio,v:(Math.random()*.25+.05)*devicePixelRatio,a:Math.random()*.6+.15,p:Math.random()*6.28}));};
  size();
  const draw=t=>{
    if(!document.body.contains(c)){stopFog();return;}
    ctx.clearRect(0,0,W,H);
    for(let i=0;i<3;i++){const x=(W*(.2+i*.33)+Math.sin(t/9000+i)*W*.08),y=H*(.75+i*.06);const g=ctx.createRadialGradient(x,y,0,x,y,W*.35);g.addColorStop(0,'rgba(110,150,200,.07)');g.addColorStop(1,'rgba(110,150,200,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);}
    for(const p of parts){if(!reduce){p.y-=p.v;p.x+=Math.sin(t/2400+p.p)*.15;if(p.y<-5){p.y=H+5;p.x=Math.random()*W;}}
      ctx.globalAlpha=p.a*(.6+.4*Math.sin(t/1300+p.p));ctx.fillStyle=(p.r>1.4*devicePixelRatio)?'#d6cbb0':'#dde9f5';ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.283);ctx.fill();}
    ctx.globalAlpha=1;
    if(!reduce)fogRAF=requestAnimationFrame(draw);
  };
  fogRAF=requestAnimationFrame(draw);
  c._ro=new ResizeObserver(size);c._ro.observe(c);
}
function stopFog(){if(fogRAF)cancelAnimationFrame(fogRAF);fogRAF=null;if(fogCanvas&&fogCanvas._ro)fogCanvas._ro.disconnect();fogCanvas=null;}

/* ───────── 시작 ───────── */
function viewAsUserBar(){
  if(S.me&&S.me.admin&&S.me.viewAsUser){const v=$('#view');const bar=document.createElement('div');bar.className='wrap';bar.innerHTML=`<div class="row" style="justify-content:flex-end;padding-block:8px 0"><span class="faint" style="font-size:12px">일반 사용자 시점으로 보는 중</span><button class="btn btn-sm btn-ghost" data-act="backadmin">운영자 시점으로</button></div>`;v.prepend(bar);}
}
const _render=render;
render=function(){_render();viewAsUserBar();if(S&&S.me&&!S.loggedOut&&S.route==='main'){const rt=$('.main-grid .rtop');if(rt&&rt.insertAdjacentHTML)rt.insertAdjacentHTML('afterbegin',nextGoalHTML());}setTimeout(advNoticeCheck,700);};
function boot(data){
  S=(data&&data.state)||load();
  S.sel=S.sel||{};S.unread=S.unread||{lobby:0,party:0,whisper:{}};S.unread.world=S.unread.world||0;if(!S.mail)S.mail=freshState().mail;S.settings=S.settings||{...DEF_SND};S.inquiries=S.inquiries||[];S.sel.pop=null;S.sel.titleModal=false;if(S.data.config.levelCap===20&&S.data.config.expQuad==null){S.data.config.levelCap=99;S.data.config.expQuad=2;}S.data.config.expQuad=S.data.config.expQuad??2;loadItems();S.stats=S.stats||{};S.titles=S.titles||{owned:{},equip:null};S.bots.forEach(b=>{if(b.goldEarned==null)b.goldEarned=Math.round(b.level*b.level*32+seedRnd('g'+b.name)()*900);});{const dk=kstCycle();const ds=new Set(S.stats.days||[]);ds.add(dk);S.stats.days=[...ds];}setTimeout(checkTitles,1500);if(S.sel.chatTab==='whisper')S.sel.chatTab='lobby';dmState();if(S.route==='friends')S.route='main';S.chat.world=S.chat.world||freshState().chat.world;S.unread.whisper=S.unread.whisper||{};
  const h=(location.hash||'').slice(1);if(['main','quest','explore','battle','character','lore','market','admin','community'].includes(h))S.route=h;
  if(S.battle&&!S.battle.over){
    const b=S.battle;
    if(now()-b.deadline>5*60*1000){b.over='abandon';b.log.push({t:'lose',text:'모든 참가자의 연결이 5분 넘게 끊겨 전투가 종료되었습니다.'});S.claimedB[b.id]=true;b.result={eligible:false};}
    else{b.players.forEach(p=>{if(!p.isMe&&!p.confirmed)p.planAt=now()+rnd(1000,4000);});b.log.push({t:'sys',text:'재접속 · 같은 전투로 복귀했습니다.'});if(now()>b.deadline)b.deadline=now()+5000;}
  }
  EXTRA_MONSTERS.forEach(m=>{if(!S.data.monsters.some(x=>x.id===m.id))S.data.monsters.push(clone(m));});
  {const EM={ev_rift:{min:8,max:20,target:8,roles:{tank:2,dps:4,heal:2},hp:1800,hpScale:0,atk:200,dotDmg:24},ev_crown:{min:8,max:20,target:8,roles:{tank:2,dps:4,heal:2},hp:3200,hpScale:0,atk:300,dotDmg:36}};S.data.monsters.forEach(m=>{if(EM[m.id]&&m.max<8)Object.assign(m,EM[m.id]);});}
  massCfg();if(S.data.mass.minRoles&&S.data.mass.minRoles.dps===6&&S.data.mass.minPlayers===8)S.data.mass.minRoles.dps=4;if(S.data.market)['mk7','mk8'].forEach(id=>{if(!S.data.market.some(x=>x.id===id)){const d=DEFAULT_MARKET.find(x=>x.id===id);if(d)S.data.market.push(clone(d));}});
  if(S.mass&&S.mass.phase==='battle'&&!(S.battle&&S.battle.ctx&&S.battle.ctx.type==='mass'))S.mass=null;
  if(S.match){S.match=null;S.queue=null;}
  if(!S.recruits)S.recruits=[];
  if(S.migratedFrom){const map={knight:'성역 기사',hunter:'혼돈 추적자',priest:'축복 사제'};setTimeout(()=>toast(`스킬 문서 기준으로 클래스가 바뀌었습니다: ${map[S.migratedFrom]||S.migratedFrom} → ${CLASSES[S.me.job].name}. 몬스터 수치도 새 기준으로 맞췄습니다.`,'good'),600);delete S.migratedFrom;save();}
  S.recruits.forEach(r=>{if(!r.name)r.name=partyName();});
  if(S.me&&S.recruits.length<4)for(let k=0;k<2;k++)S.data.monsters.filter(isGroupMon).forEach(m=>{if(S.recruits.length<5){const r=genRecruit(m);if(r)S.recruits.push(r);}});
  if(S.me&&!S.testElixir){S.testElixir=true;S.me.inv.elixir=(S.me.inv.elixir||0)+2;S.me.itemBuffs=(S.me.itemBuffs||[]).filter(x=>x.until>now()&&x.src!=='elixir');const T0=now()+60*60000;S.me.itemBuffs.push({src:'elixir',stat:'atk',val:8,until:T0},{src:'elixir',stat:'luk',val:4,until:T0});save();setTimeout(()=>toast('테스트 아이템 「용기의 영약」을 적용했습니다 · 60분 동안 공격력 +8, 행운 +4 (인벤토리 소모품에 2개 추가)','good'),900);}
  render();
  setInterval(tick,250);
}
['snail-open','snail-start','lotto-open','lotto-buy','cshop-open','cshop-buy'].forEach(k=>{const f=ACTS[k];if(f)ACTS[k]=(...a)=>{if(S.me.level<CASINO_LV){toast(`카지노는 LV${CASINO_LV}부터 들어갈 수 있습니다.`,'warn');return;}return f(...a);};});
