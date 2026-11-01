'use strict';
/* 화면 공통 · 메인 · 채팅 · 퀘스트/전투/캐릭터/운영 화면 · 모달 · 우편 · 거래소 · 강화 */
/* ───────── 화면 공통 ───────── */
function notify(text,kind){if(S&&S.settings&&S.settings.notify===false)return;toast(text,kind);playAlarm();}
function toast(text,kind=''){
  const el=document.createElement('div');el.className='toast '+kind;el.textContent=text;$('#toasts').appendChild(el);
  setTimeout(()=>el.remove(),3000);
}
let NAV_OPEN=false;
function go(route,sel){S.route=route;NAV_OPEN=false;if(sel)Object.assign(S.sel,sel);try{history.replaceState(null,'','#'+route);}catch(e){}render();window.scrollTo(0,0);save();}
function openLink(l){
  if(!l)return;const [k,v]=l.split(':');
  if(k==='monster')go('battle',{monster:v});else if(k==='quest')go('quest',{quest:v});else go(k);
}
const NAV=[['lore','세계관'],['quest','퀘스트'],['explore','탐색'],['battle','레이드'],['market','거래소'],['community','커뮤니티']];
const NAV_EN={lore:'World',character:'Character',quest:'Chronicle',explore:'Explore',battle:'Raid',market:'Market',admin:'Admin'};
function isAdmin(){return S.me&&S.me.admin&&!S.me.viewAsUser;}
function renderTop(){
  const top=$('#top');
  if(!S.me||S.loggedOut){top.innerHTML=`<div class="wrap"><span class="logo"><svg class="lg-orn" viewBox="0 0 64 40" aria-hidden="true"><circle cx="32" cy="20" r="13" fill="none" stroke="currentColor" stroke-width=".8" opacity=".7"/><circle cx="32" cy="20" r="8.5" fill="none" stroke="currentColor" stroke-width=".6" stroke-dasharray="1 2" opacity=".6"/><path d="M32 3l2.2 14.8L49 20l-14.8 2.2L32 37l-2.2-14.8L15 20l14.8-2.2z" fill="currentColor" opacity=".9"/><path d="M2 20h11M51 20h11" stroke="currentColor" stroke-width=".8"/><path d="M60 20l-4-2.4v4.8z" fill="currentColor"/></svg><span class="lg-tx"><span class="lg-en">BLESET SAGA</span><span class="lg-ko">블레셋 전기</span></span></span></div>`;return;}
  let state='';
  if(S.battle)state=`<button class="pill state" data-act="nav" data-route="battle" aria-label="${S.battle.over?'전투 종료':'전투 중 · '+S.battle.turn+'턴'}">${S.battle.over?'<span class="st-l">전투 </span>종료':'<span class="st-l">전투 중 · </span>'+S.battle.turn+'턴'}</button>`;
  else if(S.match)state=`<button class="pill state" data-act="nav" data-route="battle" aria-label="매칭 성사 · 수락 대기"><span class="st-l">매칭 성사 · </span>수락 대기</button>`;
  else if(S.queue)state=`<button class="pill state" data-act="nav" data-route="battle" aria-label="매칭 대기"><span class="st-l">매칭 </span>대기 <span class="num" data-qtime>${fmtDur(now()-S.queue.since)}</span></button>`;
  else if(S.party)state=`<button class="pill state" data-act="nav" data-route="battle">파티 ${S.party.members.length}/${S.party.target}</button>`;
  const nav=[...NAV];if(isAdmin())nav.push(['admin','운영']);
  top.innerHTML=`<div class="wrap">
    <button class="logo" data-act="nav" data-route="main" aria-label="BLESET SAGA 블레셋 전기 · 메인으로"><svg class="lg-orn" viewBox="0 0 64 40" aria-hidden="true"><circle cx="32" cy="20" r="13" fill="none" stroke="currentColor" stroke-width=".8" opacity=".7"/><circle cx="32" cy="20" r="8.5" fill="none" stroke="currentColor" stroke-width=".6" stroke-dasharray="1 2" opacity=".6"/><path d="M32 3l2.2 14.8L49 20l-14.8 2.2L32 37l-2.2-14.8L15 20l14.8-2.2z" fill="currentColor" opacity=".9"/><path d="M2 20h11M51 20h11" stroke="currentColor" stroke-width=".8"/><path d="M60 20l-4-2.4v4.8z" fill="currentColor"/></svg><span class="lg-tx"><span class="lg-en">BLESET SAGA</span><span class="lg-ko">블레셋 전기</span></span></button>
    <button class="navtog" data-act="navtog" aria-label="메뉴 ${NAV_OPEN?'닫기':'열기'}" aria-expanded="${NAV_OPEN}" aria-controls="mainnav">${NAV_OPEN?'<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>':'<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3.5 5.5h13M3.5 10h13M3.5 14.5h13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>'}</button>
    <nav class="nav ${NAV_OPEN?'open':''}" id="mainnav" aria-label="주 메뉴">${nav.map(([r,l])=>`<button data-act="nav" data-route="${r}" ${S.route===r?'aria-current="page"':''}><span class="nv-ko">${l}</span></button>`).join('')}</nav>
    <div class="topright">${state}<button class="ibtn me-btn ${S.route==='character'?'on':''}" data-act="nav" data-route="character" data-tip="캐릭터" aria-label="캐릭터" ${S.route==='character'?'aria-current="page"':''}><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="5.2" r="2.8" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M2.8 14.2c.5-3 2.6-4.6 5.2-4.6s4.7 1.6 5.2 4.6" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg></button><button class="pill" data-act="online" aria-label="접속자 목록"><span class="dot"></span><span class="pl-t">접속 </span><span class="num" data-online>${onlineCount()}</span><span class="pl-t">명</span></button>
      <button class="ibtn" data-act="pop" data-pop="mail" data-tip="메시지" aria-label="메시지${mailUnread()?' · 읽지 않은 메시지 있음':''}" aria-expanded="${S.sel.pop==='mail'}">${TICON.mail}${mailUnread()?'<span class="ndot" aria-hidden="true"></span>':''}</button>
      <button class="ibtn" data-act="pop" data-pop="notice" data-tip="공지사항" aria-label="공지사항${noticeUnread()?' · 읽지 않은 공지 있음':''}" aria-expanded="${S.sel.pop==='notice'}">${HICON.notice}${noticeUnread()?'<span class="ndot" aria-hidden="true"></span>':''}</button>
      <button class="ibtn" data-act="pop" data-pop="settings" data-tip="환경설정" aria-label="환경설정" aria-expanded="${S.sel.pop==='settings'}">${TICON.gear}</button></div>
  </div>`;
}
function fmtDur(ms){const s=Math.max(0,Math.floor(ms/1000));return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;}
function sigil(job,cls=''){return `<div class="sigil ${cls} ${jobCls(job)}" aria-hidden="true">${JOBS[job].sigil}</div>`;}
function className(job){const c=CLASSES[job];return c.tier===2?`★ ${c.name}`:c.name;}
const COIN=`<svg class="coin" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7.2" fill="var(--xp)"/><circle cx="8" cy="8" r="5.2" fill="none" stroke="var(--coin-dk)" stroke-width="1.1"/><path d="M8 5.1v5.8M6.3 6.4c0-.8.8-1.2 1.7-1.2s1.7.4 1.7 1.1-.7 1-1.7 1.2-1.8.5-1.8 1.3.8 1.2 1.8 1.2 1.8-.4 1.8-1.2" fill="none" stroke="var(--coin-dk)" stroke-width="1.1" stroke-linecap="round"/></svg>`;
function goldHTML(n){return `<span class="gold" title="골드"><span class="sr">골드</span>${COIN}<b class="num">${Number(n).toLocaleString('ko-KR')}</b></span>`;}
function portraitHTML(big){
  const me=S.me;
  const inner=me.portrait?`<img src="${me.portrait}" alt="${esc(me.name)}의 캐릭터 이미지">`:`<div class="ph-empty ${jobCls(me.job)}"><span class="ph-glyph">${CLASSES[me.job].sigil}</span><span class="ph-cls">${CLASSES[me.job].en}</span></div>`;
  return `<div class="portrait ${big?'big':''}">${inner}<button class="ph-edit" data-act="portrait-open" type="button">이미지 설정</button></div>`;
}
const ICON={
  mag:`<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M7.4 1.3 10.9 5.2 7.4 14.7 3.9 5.2z" fill="currentColor"/><path d="M3.9 5.2h7M5.9 5.2 7.4 14.7 8.9 5.2M5.9 5.2 7.4 1.3 8.9 5.2" fill="none" stroke="#000" stroke-opacity=".35" stroke-width=".75" stroke-linejoin="round"/><path d="M13.2 8.6v3.2M11.6 10.2h3.2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><circle cx="12.6" cy="3.4" r=".9" fill="currentColor"/></svg>`,
  maxHp:`<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 14.2S1.8 10.4 1.8 6.1A3.3 3.3 0 0 1 8 4.4a3.3 3.3 0 0 1 6.2 1.7c0 4.3-6.2 8.1-6.2 8.1z" fill="currentColor"/></svg>`,
  atk:`<svg viewBox="0 0 16 16" aria-hidden="true"><polygon points="14,2 13.4,5.3 7,11.7 4.3,9 10.7,2.6" fill="currentColor"/><path d="M3.1 8.4l4.5 4.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M5.2 10.8l-3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  def:`<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5l5.6 2v4.2c0 3.4-2.4 5.8-5.6 7-3.2-1.2-5.6-3.6-5.6-7V3.5z" fill="currentColor"/><path d="M8 3.6v9.2" stroke="var(--slab)" stroke-width="1.1" opacity=".55"/></svg>`,
  luk:`<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="1.8" y="1.8" width="12.4" height="12.4" rx="2.8" fill="currentColor"/><circle cx="5.2" cy="5.2" r="1.25" fill="var(--slab)"/><circle cx="8" cy="8" r="1.25" fill="var(--slab)"/><circle cx="10.8" cy="10.8" r="1.25" fill="var(--slab)"/><circle cx="10.8" cy="5.2" r="1.25" fill="var(--slab)"/><circle cx="5.2" cy="10.8" r="1.25" fill="var(--slab)"/></svg>`
};
const STAT_TIP={maxHp:'HP',atk:'공격력',mag:'마력',def:'방어력',luk:'행운'};
function statIcon(k,v,sm){return `<li class="si si-${k}" data-tip="${STAT_TIP[k]}" tabindex="0" aria-label="${STAT_TIP[k]} ${v}">${ICON[k]}<b>${v}</b></li>`;}
function statLine(st,sm){return `<ul class="statline num ${sm?'sm':''}">${['maxHp',st.pk||'atk','def','luk'].map(k=>statIcon(k,st[k])).join('')}</ul>`;}
const SKILL_FX={
  save:[['dn','받는 대미지 −10%']],save2:[['dn','받는 대미지 −30%']],
  crimehazard:[['dmg','대미지 +25%']],forestaller:[['buff','도발']],
  execution:[['dmg','추가 대미지 0~22% · 3턴']],
  roar:[['dmg','대미지 +60% · 2턴'],['dn','시전자 HP −10%']],
  berserker:[['dmg','대미지 ×2 · 2턴'],['dn','최대 HP −10%']],
  attention:[['buff','표적 고정 1턴']],
  link:[['buff','아군 보호 1턴'],['dn','자신 HP −10%']],
  link2:[['buff','자신·아군 보호 1턴']],sanctuary:[['buff','아군 전체 보호 1턴']],
  takedown:[['dmg','대미지 +25% · 2턴']],battlefield:[['dmg','3×3 범위 대미지']],
  subterfuge:[['dmg','대미지 +25%'],['debuff','중독 12% · 2턴']],
  carnage:[['dmg','공격력 2배 이상 시 ×2 · 3턴']],
  cinder:[['debuff','몬스터 공격 −12% · 2턴']],
  hellfire:[['dmg','마력 18% 고정 대미지 · 3턴']],
  eternalflame:[['dmg','판정 90%↑ ×2 · 110%↑ ×3 · 3턴']],
  poisonshot:[['debuff','중독 12% · 3턴']],
  smoke:[['dmg','대미지 +25%'],['buff','파티원 대미지 +15%']],
  legendary:[['buff','판정 110%↑ 시 오버 버닝']],overburning:[['dmg','대미지 ×2']],
  fusillade:[['buff','크리티컬 시 2회 행동']],
  shining:[['dmg','대미지 ×1.3'],['dmg','영혼형 ×1.5']],
  smite:[['dmg','공격'],['heal','준 대미지 30% 흡수 회복']],
  judgment:[['dmg','대미지 ×1.6']],
  cure:[['heal','마력 40%×판정 +10%']],sinsayer:[['heal','부활 HP 30%'],['debuff','시전자 2턴 행동 불가']],
  bless:[['heal','최대 HP 5% · 3턴']],fasciation:[['heal','전체 · 마력 40%×판정 +12%']],
  pray:[['heal','대상 HP 전부 회복'],['dn','자신 HP −15%']],
  utopia:[['heal','전체 · 마력 40%×판정 +40%']],
  vindicate:[['dn','아군 받는 대미지 −20%']],
  blind:[['buff','아군 전체 대미지 +25%']],
  downworld:[['debuff','몬스터 대미지 −30%']],
  dystopia:[['dmg','대미지 ×3'],['dn','아군 전체 HP −3%']],
  backslider:[['buff','대상 대미지 ×2']]
};
function skillBadges(k,p,b){
  const s=SKILLS[k];const out=[];
  if(s.special)out.push('<span class="chip warn">특수</span>');
  if(s.type==='addon')out.push('<span class="chip dim">함께 사용</span>');
  if(s.type==='passive')out.push('<span class="chip dim">패시브</span>');
  if(s.lv)out.push(`<span class="chip dim">LV${s.lv}</span>`);
  if(s.crit)out.push('<span class="chip dps">크리티컬 확률 2배</span>');
  if(s.combo)out.push(`<span class="chip ${p&&b&&comboReady(p,k,b.turn)?'ok':'fx-dmg'}">${SKILLS[s.combo.from].name} 연계 +${s.combo.bonus}%</span>`);
  (SKILL_FX[k]||[]).forEach(([c,t])=>out.push(`<span class="chip fx-${c}">${t}</span>`));
  return out.join('');
}
function roleChip(job){const r=roleOf(job);return `<span class="chip cls ${r}" title="${ROLE[r]}">${className(job)}</span>`;}
function statusChip(st){return st==='battle'?'<span class="chip bad">전투</span>':st==='recruit'?'<span class="chip warn">모집</span>':'<span class="chip dim">로비</span>';}

function render(){
  closeRmem();
  renderTop();
  const v=$('#view');
  if(S.loggedOut){v.innerHTML=vLogin();renderPop();return;}
  if(!S.me){v.innerHTML=vCreate();renderPop();return;}
  ensureDeco();ensureCraft();ensureRelevel();ensureVilQuest();ensureFish();ensureDunParty();settleFish();
  const r=S.route;
  if(r==='admin'&&!isAdmin()){v.innerHTML=`<div class="wrap page"><div class="panel"><h3>운영</h3><p>운영자 권한이 있는 계정만 열 수 있습니다.</p></div></div>`;return;}
  const fn={community:vCommunity,profile:vProfile,main:vMain,quest:vQuest,explore:vExplore,battle:vBattle,character:vChar,lore:vLore,market:vMarket,admin:vAdmin}[r]||vMain;
  const dock=['quest','explore','character','lore','market','profile','community'].includes(r);
  v.innerHTML=dock?`<div class="wrap dock-grid" data-route="${r}"><aside class="dock-side">${charCard(true)}${chatPanel()}</aside><div class="dock-main">${fn()}</div></div>`:fn();
  afterRender();
  renderPop();
}
function fitExlog(){
  const p=$('.exlog-p'),line=$('.dock-side .me-quests');if(!p)return;
  if(!line||innerWidth<=980){p.style.height='';return;}
  const h=line.getBoundingClientRect().top-p.getBoundingClientRect().top;p.style.height=Math.max(96,Math.round(h))+'px';
}
addEventListener('resize',()=>fitExlog());
/* 모바일 채팅: 일반 채팅 패널(.chat-main)을 하단 시트로 띄우고, 하단 버튼으로 연다 (≤760px, CSS가 담당) */
function syncChatFab(){
  const b=document.body;
  if(!$('#chatfab')){
    b.insertAdjacentHTML('beforeend','<div id="chatbk" data-chatclose></div><button type="button" id="chatfab" aria-label="채팅 열기"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.4 3.2h11.2v7.4H7.2L4 13.2v-2.6H2.4z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg><span>채팅</span></button>');
  }
  const has=!!$('#view .chat-main');b.classList.toggle('has-chat',has);if(!has)b.classList.remove('chat-open');
  syncFabBadge();
  b.dataset.route=S.route||'';
  const top=$('#top');if(top)b.style.setProperty('--top-h',Math.round(Math.max(top.offsetHeight||0,top.getBoundingClientRect().bottom))+'px');
}
function setChatOpen(on){
  document.body.classList.toggle('chat-open',on);
  if(on){updateChats();renderTop();const m=$('#view .chat-main [data-msgs]');if(m)m.scrollTop=m.scrollHeight;}
  else{const a=document.activeElement;if(a&&a.closest&&a.closest('.chat-main'))a.blur();}
}
document.addEventListener('click',e=>{
  if(e.target.closest('#chatfab')){setChatOpen(true);return;}
  if(e.target.closest('[data-chatclose]'))setChatOpen(false);
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('chat-open'))setChatOpen(false);});
/* ── 탐색 지도 확대·이동 (.wmap) ──
   데스크톱: 휠로 확대(커서 기준) · 끌어서 이동 · 더블클릭 확대/원래대로
   모바일: 두 번 탭 확대/원래대로 · 두 손가락 확대 · 확대 상태에서 밀어서 이동
   지도 그림과 핀(.mspot)을 .wm-stage 하나로 감싸 함께 움직이고, 제목·지역 보기·확대 버튼은 제자리.
   상태(MAPZ)는 다시 그려져도 유지. x·y는 지도 폭 대비 비율(0 ~ 1-s). */
const MAPZ={s:1,x:0,y:0},MAPZ_MAX=3,MAPZ_STEP=1.5;
function initMapZoom(){
  $$('.wmap').forEach(m=>{
    if(m.dataset.zoom)return;const img=m.querySelector(':scope > img');if(!img)return;m.dataset.zoom='1';
    const st=document.createElement('div');st.className='wm-stage';m.insertBefore(st,img);st.appendChild(img);
    m.querySelectorAll(':scope > .mspot').forEach(b=>st.appendChild(b));
    m.insertAdjacentHTML('beforeend','<div class="wm-zoom" role="group" aria-label="지도 확대·축소"><button type="button" data-z="in" aria-label="확대" data-tip="확대">+</button><button type="button" data-z="out" aria-label="축소" data-tip="축소">−</button><button type="button" data-z="reset" aria-label="원래 크기로" data-tip="원래 크기"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 6V3h3M13 6V3h-3M3 10v3h3M13 10v3h-3" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>');
    const clampZ=()=>{MAPZ.s=Math.min(MAPZ_MAX,Math.max(1,MAPZ.s));MAPZ.x=Math.min(0,Math.max(1-MAPZ.s,MAPZ.x));MAPZ.y=Math.min(0,Math.max(1-MAPZ.s,MAPZ.y));};
    const apply=anim=>{clampZ();st.classList.toggle('wm-anim',!!anim);st.style.transform=`translate(${MAPZ.x*100}%,${MAPZ.y*100}%) scale(${MAPZ.s})`;
      const z=MAPZ.s>1.01;m.classList.toggle('zoomed',z);const q=k=>m.querySelector(`.wm-zoom [data-z="${k}"]`);q('in').disabled=MAPZ.s>=MAPZ_MAX-.01;q('out').disabled=!z;q('reset').disabled=!z;};
    const rel=(cx,cy)=>{const r=m.getBoundingClientRect();return [(cx-r.left)/r.width,(cy-r.top)/r.height];};
    const zoomAt=(fx,fy,ns,anim)=>{ns=Math.min(MAPZ_MAX,Math.max(1,ns));const k=ns/MAPZ.s;MAPZ.x=fx-(fx-MAPZ.x)*k;MAPZ.y=fy-(fy-MAPZ.y)*k;MAPZ.s=ns;apply(anim);};
    const toggleAt=(cx,cy)=>{const [fx,fy]=rel(cx,cy);if(MAPZ.s>1.01){MAPZ.s=1;MAPZ.x=0;MAPZ.y=0;apply(true);}else zoomAt(fx,fy,2.2,true);};
    apply(false);
    m.querySelector('.wm-zoom').addEventListener('click',e=>{const b=e.target.closest('[data-z]');if(!b)return;e.stopPropagation();
      if(b.dataset.z==='reset'){MAPZ.s=1;MAPZ.x=0;MAPZ.y=0;apply(true);}else zoomAt(.5,.5,MAPZ.s*(b.dataset.z==='in'?MAPZ_STEP:1/MAPZ_STEP),true);});
    /* 휠: 축소 끝에서 더 내리면 페이지 스크롤로 넘김 */
    m.addEventListener('wheel',e=>{if(e.target.closest('.wm-zoom,.wm-dd'))return;if(e.deltaY>0&&MAPZ.s<=1.001)return;e.preventDefault();
      const [fx,fy]=rel(e.clientX,e.clientY);const d=e.deltaMode===1?e.deltaY*16:e.deltaY;zoomAt(fx,fy,MAPZ.s*Math.exp(-d*.0018),false);},{passive:false});
    m.addEventListener('dblclick',e=>{if(e.target.closest('.wm-zoom,.wm-dd')||Date.now()-(m._tapZoom||0)<700)return;e.preventDefault();toggleAt(e.clientX,e.clientY);});
    /* 포인터: 한 개 = 이동, 두 개 = 확대. 움직였으면 뒤따르는 클릭(핀 열기)은 막음 */
    const P=new Map();let pan=null,pinch=null,moved=false,lastTap=null;
    m.addEventListener('pointerdown',e=>{if(e.button>0||e.target.closest('.wm-zoom,.wm-dd'))return;P.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(P.size===1){moved=false;pan={x:e.clientX,y:e.clientY,ox:MAPZ.x,oy:MAPZ.y,id:e.pointerId};pinch=null;}
      else if(P.size===2){const [a,b]=[...P.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y)||1,mx:(a.x+b.x)/2,my:(a.y+b.y)/2};pan=null;moved=true;}});
    m.addEventListener('pointermove',e=>{if(!P.has(e.pointerId))return;P.set(e.pointerId,{x:e.clientX,y:e.clientY});const r=m.getBoundingClientRect();
      if(pinch&&P.size>=2){const [a,b]=[...P.values()];const d=Math.hypot(a.x-b.x,a.y-b.y)||1,mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
        MAPZ.x+=(mx-pinch.mx)/r.width;MAPZ.y+=(my-pinch.my)/r.height;const [fx,fy]=rel(mx,my);zoomAt(fx,fy,MAPZ.s*d/pinch.d,false);pinch={d,mx,my};return;}
      if(!pan||pan.id!==e.pointerId)return;const dx=e.clientX-pan.x,dy=e.clientY-pan.y;
      if(!moved&&Math.hypot(dx,dy)>5&&MAPZ.s>1.01){moved=true;m.classList.add('dragging');try{m.setPointerCapture(e.pointerId);}catch(_){}}
      if(moved){MAPZ.x=pan.ox+dx/r.width;MAPZ.y=pan.oy+dy/r.height;apply(false);}});
    const up=e=>{if(!P.has(e.pointerId))return;P.delete(e.pointerId);m.classList.remove('dragging');
      if(e.type==='pointerup'&&e.pointerType==='touch'&&!moved&&P.size===0){const t=Date.now();
        if(lastTap&&t-lastTap.t<320&&Math.hypot(e.clientX-lastTap.x,e.clientY-lastTap.y)<30){lastTap=null;m._skipClick=true;m._tapZoom=Date.now();toggleAt(e.clientX,e.clientY);}
        else lastTap={t,x:e.clientX,y:e.clientY};}
      if(moved&&P.size===0)m._skipClick=true;
      if(P.size===1){const [id,p]=[...P.entries()][0];pan={x:p.x,y:p.y,ox:MAPZ.x,oy:MAPZ.y,id};}else if(!P.size){pan=null;pinch=null;}
      if(m._skipClick)setTimeout(()=>{m._skipClick=false;},60);};
    m.addEventListener('pointerup',up);m.addEventListener('pointercancel',up);
    m.addEventListener('click',e=>{if(m._skipClick){e.stopPropagation();e.preventDefault();m._skipClick=false;}},true);
  });
}
document.addEventListener('click',e=>{document.querySelectorAll('.wv-dd[open]').forEach(d=>{if(!d.contains(e.target))d.open=false;});document.querySelectorAll('.st-dd[open]').forEach(d=>{if(!d.contains(e.target))d.open=false;});document.querySelectorAll('.wm-dd[open]').forEach(d=>{if(!d.contains(e.target)||e.target.closest('.wm-dd-i'))d.open=false;});});
function afterRender(){
  syncChatFab();initMapZoom();updateChats();
  const c=$('#fog');if(c)startFog(c);else stopFog();
  fitExlog();initMini();dmgFx();$$('.aq').forEach(el=>el.style.setProperty('--aqw',el.clientWidth+'px'));
  $$('.log').forEach(l=>l.scrollTop=l.scrollHeight);
}

/* ───────── 캐릭터 생성 ───────── */
function vCreate(){
  const sel=CLASSES[S.sel.newJob]&&CLASSES[S.sel.newJob].tier===1?S.sel.newJob:'defender';
  const base=Object.entries(CLASSES).filter(([,c])=>c.tier===1);
  return `<div class="wrap"><div class="create">
    <div><img class="biglogo" src="${LOGO}" alt="BLESET SAGA"><div class="sub">블레셋 전기</div></div>
    <p class="qtext" style="font-size:15px">라니아케아의 신들에게 축복받은 이방인, 블레서. 저주받은 땅 블라스파미아로 떠날 당신의 이름과 클래스를 정하세요.</p>
    <form class="stack" data-form="create">
      <label class="stack" style="gap:6px;max-width:360px"><span class="ph" style="margin:0">블레서 이름</span>
        <input type="text" id="new-name" maxlength="10" placeholder="2~10자" required autocomplete="off"></label>
      <div class="ph" style="margin:8px 0 0">클래스 · LV${cfg().jobAdvanceLevel}에 ★ 상위 클래스로 전직</div>
      <div class="jobs">${base.map(([k,c])=>{const st=statsFor(k,1,{});return `<button type="button" class="job" data-act="pickjob" data-job="${k}" aria-pressed="${sel===k}">
        <div class="row" style="gap:12px">${sigil(k)}<div class="stack" style="gap:4px">${roleChip(k)}<span class="faint" style="font-size:11.5px;letter-spacing:.08em">${c.en}</span></div></div>
        <p class="muted">${c.desc}</p>
        <dl class="kv num"><dt>HP</dt><dd>${st.maxHp}</dd><dt>${STATK[st.pk||'atk']}</dt><dd>${st[st.pk||'atk']}</dd><dt>방어력</dt><dd>${st.def}</dd><dt>행운</dt><dd>${st.luk}</dd><dt>사거리</dt><dd>${c.range}</dd></dl>
        <p style="font-size:12.5px">${c.skills.map(x=>SKILLS[x].name).join(' · ')}</p>
        <p class="faint" style="font-size:12px">부름을 받는 곳 · ${ORIGIN[k]}<br>전직 → ${c.adv.map(a=>'★ '+CLASSES[a].name).join(' / ')}</p></button>`;}).join('')}</div>
      <div class="row"><button class="btn btn-primary" type="submit">탐사 시작</button><span class="notice-local">시제품 · 진행 기록은 이 브라우저에만 저장됩니다</span></div>
    </form></div></div>`;
}
/* ───────── 메인 ───────── */
function vMain(){
  return `<div class="wrap tkwrap">${ticker()}</div>
    <div class="wrap grid2 main-grid">
      ${charCard(true)}<div class="rtop">${skyBar()}${nextGoalHTML()}${recruitPanel()}</div>
      ${chatPanel()}
    </div>`;
}
const SPIN_IC='<svg class="spin" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5a9.5 9.5 0 0 1 0 19" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="2.6 1.6" stroke-dashoffset="-29.8" pathLength="59.7" style="clip-path:inset(0 50% 0 0)"/></svg>';
function progItems(){
  const t=now(),L=[];const b=S.battle;
  if(b&&!b.over){const ty=(b.ctx&&b.ctx.type)||'';const nm={mass:'만신전',field:'필드 사냥',dungeon:'개인 던전',quest:'퀘스트 전투',weekly:'토벌전',event:'이벤트'}[ty]||'파티 레이드';
    L.push({go:'battle',t:`${nm} · ${b.mon.name}`,r:b.endsAt?`남은 시간 ${fmtLong(b.endsAt-t)}`:`${b.turn||1}턴 진행 중`});}
  if(S.mass&&S.mass.phase==='gather'&&S.mass.roster.some(x=>x.isMe)){const e=(S.events||[]).find(x=>x.id===S.mass.evId);const m=monster(S.mass.monsterId);L.push({go:'battle',t:`만신전 집결 · ${m?m.name:''}`,r:e?`남은 시간 ${fmtLong(e.until-t)}`:'집결 중'});}
  if(S.queue||S.match)L.push({go:'battle',t:'파티 레이드 매칭 대기',r:S.queue?`대기 ${fmtDur(t-S.queue.since)}`:'매칭 중'});
  {const J=S.me&&S.me.cjobs||{};for(const k in J){const j=J[k];if(!j)continue;L.push({go:'craft:'+(k==='repair'?'craft':k),t:`${k==='repair'?'수리':PROF[k].n} · ${j.label}`,r:t>=j.end?'완료 · 받기 대기':`남은 시간 ${fmtLong(j.end-t)}`,done:t>=j.end});}}
  if(S.drun&&!b){const R=S.drun;const bm=monster(R.mid);L.push({go:'battle',t:`던전 탐사 · ${bm?bm.region:''}`,r:R.done?(R.done==='win'?'공략 완료':'탐사 실패'):`${R.idx+1}/5 페이즈`,done:!!R.done});}
  if(S.fishCast){const F=S.fishCast;L.push({go:'fish',t:`낚시 · ${LANDS[F.land]}`,r:t>=F.end?'찌 확인 가능':`남은 시간 ${fmtLong(F.end-t)}`,done:t>=F.end});}
  if(S.autoFish){const a=S.autoFish;L.push({go:'fish',t:`자동 낚시 · ${LANDS[a.land]}`,r:t>=a.end?'완료 · 결과 받기 대기':`남은 시간 ${fmtLong(a.end-t)}`,done:t>=a.end});}
  if(S.auto){const a=S.auto;L.push({go:'auto',t:`자동 사냥 · ${a.region}`,r:t>=a.end?'완료 · 보상 수령 대기':`남은 시간 ${fmtLong(a.end-t)}`,done:t>=a.end});}
  return L;
}
function progInner(){const L=progItems();if(!L.length)return '';
  return `<div class="me-prog">${L.map(x=>`<button class="mp-row ${x.done?'done':''}" data-act="prog-go" data-go="${x.go}"><span class="mp-ic">${x.done?'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="3"/><path d="M7.5 12.5l3 3 6-6.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>':SPIN_IC}</span><span class="mp-t">${esc(x.t)}</span><span class="mp-r num">${x.r}</span></button>`).join('')}</div>`;}
function charCard(withQuests){
  const me=S.me,st=myStats(),need=expNeed(me.level),cap=me.level>=cfg().levelCap;
  const p=cap?100:pct(me.exp,need);const left=Math.max(0,need-me.exp);
  const canAdv=CLASSES[me.job].tier===1&&me.level>=cfg().jobAdvanceLevel;
  const q=withQuests?`<div class="panel me-qp">${weeklyPanel()}</div>`:'';
  return `<div class="me-stack"><div class="panel me-card">${portraitHTML(false)}
    <div class="me-info">
      ${titleChip()}
      <div class="me-name"><h2><button class="me-link" data-act="nav" data-route="character" title="캐릭터 페이지로">${esc(me.name)}</button></h2><span class="lv num">LV ${me.level}</span></div>
      <div class="row" style="gap:4px">${roleChip(me.job)}${profChips()}${canAdv?'<button class="chip warn" data-act="nav" data-route="character" style="cursor:pointer;background:none">전직 가능</button>':''}</div>
    </div><div class="me-bot"><div class="xpwrap" tabindex="0" aria-label="경험치 ${cap?'최대':`현재 ${me.exp}, 남은 ${left}`}">
        <div class="row" style="justify-content:space-between"><span class="faint" style="font-size:11px;letter-spacing:.1em">EXP</span><span class="num" style="font-size:12px;color:var(--xp)">${cap?'MAX':p.toFixed(1)+'%'}</span></div>
        <div class="bar xp"><i style="width:${p}%"></i></div>
        <div class="tip num" role="tooltip">${cap?'최대 레벨':`${me.exp.toLocaleString('ko-KR')} / 남은 ${left.toLocaleString('ko-KR')}`}</div>
      </div>
      <div class="me-stats">${statLine(st)}${goldHTML(me.gold)}</div></div>${withQuests?`<div class="me-prog-wrap">${progInner()}</div>`+memoHTML():''}</div>${q}</div>`;
}
const HICON={
  quest:`<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M10.6 5.4 9 9 5.4 10.6 7 7z" fill="currentColor"/><circle cx="8" cy="8" r=".8" fill="var(--slab)"/></svg>`,
  party:`<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 14.5V1.8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M4 2.4h8.6l-2 2.9 2 2.9H4z" fill="currentColor"/></svg>`,
  scroll:`<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.2 2.2h7.6c.9 0 1.6.7 1.6 1.6v.6H5.8" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M4.2 2.2c-.9 0-1.6.7-1.6 1.6v.6h3.2M5.8 3.8v8.6c0 .8.6 1.4 1.4 1.4h5.2c.8 0 1.4-.6 1.4-1.4V4.4" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M8 7h3.6M8 9.4h3.6M8 11.8h2.2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>`,
  notice:`<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.2 6.3v3.4h2.3l5.6 3.3V3L4.5 6.3z" fill="currentColor"/><path d="M12.2 5.6c.8.6 1.3 1.4 1.3 2.4s-.5 1.8-1.3 2.4" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M5.2 9.9l.9 3.6h1.8l-.8-3" fill="currentColor"/></svg>`,
  box:`<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.6 14 4.4v7.2L8 14.4 2 11.6V4.4z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M2 4.4 8 7.2l6-2.8M8 7.2v7.2M5 3l6 2.8" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>`,
  bolt:`<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M9.4 1.4 3.4 9h4.2l-1 5.6L12.6 7H8.4z" fill="currentColor" stroke="currentColor" stroke-width=".6" stroke-linejoin="round"/></svg>`,
  swords:`<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 2l7.4 7.4M14 2 6.6 9.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M2 2h2.6M2 2v2.6M14 2h-2.6M14 2v2.6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M8 10.6l3.2-3.2M4.8 7.4 8 10.6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M11.6 11.6l2.2 2.2M4.4 11.6l-2.2 2.2M10.4 9.6l2.4 2.4M5.6 9.6 3.2 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  quill:`<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M14.2 1.8C8.4 2.6 5 6.4 3.6 11.2l1.2.4c.6-1.6 1.4-2.8 2.4-3.8h3.2l-1.6-.8 2.6-1.4-1.4-.4C12 4.2 13.4 3.2 14.2 1.8z" fill="currentColor"/><path d="M4.2 11.4 2.2 14.2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`,
  star:`<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.4l1.9 4.1 4.5.5-3.4 3 1 4.4L8 11.2l-4 2.2 1-4.4-3.4-3 4.5-.5z" fill="currentColor"/></svg>`,
  bag:`<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 5.4h10l-.8 8.2H3.8z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M5.6 5.4V4a2.4 2.4 0 0 1 4.8 0v1.4" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M6.2 8.4h3.6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`,
  armor:`<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 1.8 8 3.2l3-1.4 3 2-1.4 3.2v6.8H3.4V6.8L2 3.8z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M8 3.2v10.4" stroke="currentColor" stroke-width="1.1"/></svg>`,
  spark:`<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.2l1.6 4.2 4.4 1.6-4.4 1.6L8 12.8 6.4 8.6 2 7l4.4-1.6z" fill="currentColor"/><path d="M12.6 11.2l.5 1.4 1.4.5-1.4.5-.5 1.4-.5-1.4-1.4-.5 1.4-.5z" fill="currentColor"/></svg>`,
  link:`<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 13.6S2.4 10.2 2.4 6.3A2.9 2.9 0 0 1 8 5a2.9 2.9 0 0 1 5.6 1.3c0 3.9-5.6 7.3-5.6 7.3z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M5.6 8.2h4.8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`,
  map:`<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1.8 3.6 5.6 2.2l4.8 1.6 3.8-1.4v10.2l-3.8 1.4-4.8-1.6-3.8 1.4z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M5.6 2.2v10.2M10.4 3.8V14" stroke="currentColor" stroke-width="1.2"/></svg>`,
  chat:`<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.2 3.6c0-.8.6-1.4 1.4-1.4h8.8c.8 0 1.4.6 1.4 1.4v6c0 .8-.6 1.4-1.4 1.4H7l-3.2 2.6V11h-.2c-.8 0-1.4-.6-1.4-1.4z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M5.2 6.6h5.6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`
};
function hTitle(icon,text){return `<span class="htitle"><span class="hico">${HICON[icon]}</span>${text}</span>`;}
function cardQuests(){
  const act=S.data.quests.filter(q=>q.published&&['active','claim'].includes(questStatus(q)));
  const n=act.length;if(S.sel.cqN!==n){if(n>=2&&!(S.sel.cqN>=2))S.sel.cqOpen=false;else if(n<2&&S.sel.cqN>=2)S.sel.cqOpen=true;S.sel.cqN=n;}
  const open=S.sel.cqOpen===undefined?n<2:!!S.sel.cqOpen;
  return `<div class="me-quests ${open?'':'folded'}"><div class="ph"><button class="cq-tog" data-act="cq-toggle" aria-expanded="${open}">${hTitle('quest','진행 중인 퀘스트')}<span class="cq-n num">${n}</span><svg class="cq-ar" viewBox="0 0 10 10" aria-hidden="true"><path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>
    <div class="list">${act.length?act.map(q=>{const st=questStatus(q);return `<div class="li clickable" data-act="openquest" data-id="${q.id}"><div class="t"><b>${esc(q.title)}</b><small>${st==='claim'?'보상 수령 대기':'단계 '+((S.qp[q.id].history||[]).length+1)}</small></div><span class="chip ${QSTAT[st][1]}">${QSTAT[st][0]}</span></div>`;}).join(''):'<p class="empty">진행 중인 퀘스트가 없습니다.</p>'}</div></div>`;
}
const STATUS={online:{n:'온라인',ic:'<span class="st-dot on"></span>'},away:{n:'자리비움',ic:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 1.8h9M3.5 14.2h9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M4.6 1.8c0 3.3 3.4 4.4 3.4 6.2s-3.4 2.9-3.4 6.2M11.4 1.8c0 3.3-3.4 4.4-3.4 6.2s3.4 2.9 3.4 6.2" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M6 13.4c.4-1.4 1.3-2 2-2.3.7.3 1.6.9 2 2.3z" fill="currentColor"/><path d="M6.2 4.6h3.6c-.5.9-1.2 1.4-1.8 1.8-.6-.4-1.3-.9-1.8-1.8z" fill="currentColor" opacity=".7"/></svg>'},raid:{n:'레이드 중',ic:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M14 15.2 3.6 2.2M2 15.2 12.4 2.2" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"/><path d="M3.8 2.4 8.3 8.1 .6 8.9z" fill="currentColor"/><path d="M12.2 2.4 7.7 8.1l7.7.8z" fill="currentColor"/><circle cx="3.4" cy="1.9" r="1" fill="currentColor"/><circle cx="12.6" cy="1.9" r="1" fill="currentColor"/></svg>'},meal:{n:'식사 중',ic:'<svg viewBox="0 0 16 16" aria-hidden="true" style="color:#e6dcc4"><ellipse cx="5" cy="4.3" rx="2.2" ry="3" fill="currentColor"/><path d="M4.3 6.9h1.4v7.3a.7.7 0 0 1-1.4 0z" fill="currentColor"/><path d="M10.1 1.4l.7 13.2M13 1.4l-.7 13.2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>'},offline:{n:'오프라인',ic:'<span class="st-dot off"></span>'}};
function myStatus(){return STATUS[S.me.status]?S.me.status:'online';}
function statusDD(){const k=myStatus();return `<details class="st-dd"><summary aria-label="상태 · ${STATUS[k].n}" title="상태 · ${STATUS[k].n}"><span class="st-ic st-${k}">${STATUS[k].ic}</span></summary><div class="st-menu">${Object.entries(STATUS).filter(([x])=>x!=='offline').map(([x,v])=>`<button data-act="set-status" data-v="${x}" aria-pressed="${k===x}"><span class="st-ic st-${x}">${v.ic}</span>${v.n}</button>`).join('')}</div></details>`;}
function statusChip(k){const v=STATUS[k]||STATUS.online;return `<span class="st-chip"><span class="st-ic st-${k}">${v.ic}</span>${v.n}</span>`;}
function hashN(str){let h=0;for(const c of str)h=(h*31+c.charCodeAt(0))|0;return Math.abs(h);}
const BOT_MEMOS=['오늘도 블레서 출근 완료','파티 구해요 · 힐러 환영','초원 들개 잡는 중','레이드 같이 가실 분 귓말 주세요','장식장 채우는 중 ✦','느긋하게 탐색하는 중','백야의 신전 언젠가 꼭',''];
function botMemo(name){return BOT_MEMOS[hashN(name)%BOT_MEMOS.length];}
function botStatus(p){if(!p.online)return 'offline';if(p.status==='battle')return 'raid';return hashN(p.name+'s')%5===0?'away':'online';}
function memoHTML(){
  const m=S.me.memo||'';
  if(!S.sel.memoEdit)return `<div class="me-memo">${statusDD()}<button type="button" class="memo-view ${m?'':'empty'}" data-act="memo-edit" title="눌러서 수정">${m?esc(m):'한줄메모를 남겨 보세요 (40자)'}</button></div>`;
  return `<div class="me-memo editing">${statusDD()}<label class="sr" for="me-memo">한줄메모</label><input type="text" id="me-memo" maxlength="40" value="${esc(m)}" placeholder="한줄메모를 남겨 보세요 (40자)" autocomplete="off"><span class="memo-ic" aria-hidden="true">${TICON.pen}</span></div>`;
}
function activeQuestPanel(){
  const act=S.data.quests.filter(q=>q.published&&['active','claim'].includes(questStatus(q)));
  return `<div class="panel"><h3>진행 중인 퀘스트 <button class="link" data-act="nav" data-route="quest">전체</button></h3>
    <div class="list">${act.length?act.map(q=>`<div class="li clickable" data-act="openquest" data-id="${q.id}"><div class="t"><b>${esc(q.title)}</b><small>${questStatus(q)==='claim'?'보상 수령 대기':'단계 '+((S.qp[q.id].history||[]).length+1)}</small></div><span class="chip ${QSTAT[questStatus(q)][1]}">${QSTAT[questStatus(q)][0]}</span></div>`).join(''):'<p class="empty">진행 중인 퀘스트가 없습니다.</p>'}</div></div>`;
}
function todayPanel(){
  const av=S.data.quests.filter(q=>q.published&&questStatus(q)==='available').sort((a,b)=>(a.repeat?0:1)-(b.repeat?0:1));
  const open=S.sel.todayOpen===true;
  return `<div class="panel fold"><button class="fold-head" data-act="toggletoday" aria-expanded="${open}" aria-controls="today-body">
      <span class="ph" style="margin:0">${hTitle('scroll','오늘의 의뢰')} <span class="chip num" style="letter-spacing:0">${av.length}</span></span><span class="row" style="gap:8px"><span class="faint num" style="font-size:12px">초기화 05:00</span><span class="fold-ic" aria-hidden="true"></span></span></button>
    <div class="list" id="today-body" ${open?'':'hidden'}>${av.length?av.slice(0,6).map(q=>`<div class="li clickable" data-act="openquest" data-id="${q.id}"><div class="t"><b>${esc(q.title)}</b><small>${q.repeat?'데일리':q.cat==='epic'?'메인 스토리':'서브 스토리'} · LV${q.level}</small></div><span class="chip ok">수락 가능</span></div>`).join(''):'<p class="empty">지금 받을 수 있는 의뢰가 없습니다. 레벨을 올리거나 내일 다시 확인하세요.</p>'}</div></div>`;
}
const ROLE_ICON={
  tank:`<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.6l5.4 1.9v4.1c0 3.3-2.3 5.6-5.4 6.8-3.1-1.2-5.4-3.5-5.4-6.8V3.5z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M5.6 7.6h4.8M8 5.2v5.6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`,
  dps:`<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 2.5l8 8M13.5 2.5l-8 8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M9.4 12.6l3.2-3.2M3.4 9.4l3.2 3.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M12.1 12.1l1.6 1.6M3.9 12.1l-1.6 1.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  heal:`<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.4" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M8 4.6v6.8M4.6 8h6.8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`
};
function roleCounts(r){const c={tank:0,dps:0,heal:0};r.members.forEach(n=>{const b=bot(n);if(b)c[roleOf(b.job)]++;});return c;}
function recruitCard(r){
  const m=monster(r.monsterId);if(!m)return '';
  const c=roleCounts(r);const reason=joinReason(r);const busy=busyReason();
  return `<article class="rcard">
    <button class="rc-art" data-act="link" data-link="monster:${m.id}" aria-label="${esc(m.name)} 상세 보기"><pre aria-hidden="true">${esc(ART[m.art]||ART.generic)}</pre><span class="rc-mon">${esc(m.name)} · LV${m.level}+</span></button>
    <div class="rc-body">
      <div class="rc-top"><b class="rc-name">${esc(r.name||m.name)}</b><span class="num rc-count" aria-label="현재 ${r.members.length}명, 마감 ${r.target}명">${r.members.length}/${r.target}</span></div>
      <small class="muted">파티장 ${esc(r.leader)}</small>
      <ul class="rc-roles">${['tank','dps','heal'].map(k=>`<li class="si r-${k}" data-tip="${ROLE[k]}" tabindex="0" aria-label="${ROLE[k]} ${c[k]}명">${ROLE_ICON[k]}<b class="num">${c[k]}</b></li>`).join('')}</ul>
      <div class="rc-foot"><button class="ibtn sm rc-mem" data-act="rmem" data-id="${r.id}" data-tip="참가 인원" aria-label="참가 인원 ${r.members.length}명 보기" aria-expanded="${S.sel.rmem===r.id}" aria-haspopup="true">${TICON.people}</button>
      <button class="btn btn-sm" data-act="joinrecruit" data-id="${r.id}" ${reason||busy?'disabled':''} title="${esc(reason||busy||'이 파티에 참가')}">${reason?esc(reason.length>14?'참가 불가':reason):'참가'}</button></div>
    </div></article>`;
}
function rmemHTML(r){
  const m=monster(r.monsterId);
  return `<div class="rmenu" role="menu" aria-label="${esc(r.name)} 참가 인원"><div class="rm-head"><b>${esc(r.name)}</b><span class="num faint">${r.members.length}/${r.target}</span></div>
    ${r.members.map(n=>{const b=bot(n);if(!b)return '';const st=statsFor(b.job,b.level,{});return `<div class="rm-row">${sigil(b.job,'sm')}<div class="rm-t"><div class="row" style="gap:6px"><b>${esc(b.name)}</b>${n===r.leader?'<span class="chip dim">파티장</span>':''}</div>
      <small>${className(b.job)} · <span class="num">LV${b.level}</span></small>${statLine(st,true)}</div></div>`;}).join('')}
    <div class="rm-foot faint">${m?esc(m.name):''} · 남은 자리 ${Math.max(0,r.target-r.members.length)}</div></div>`;
}
function placeFloat(btn,w){
  const box=$('#rmenu'),el=box.firstElementChild;if(!el)return;const rc=btn.getBoundingClientRect();w=Math.min(w||260,window.innerWidth-24);
  el.style.width=w+'px';el.style.left=Math.max(12,Math.min(rc.left,window.innerWidth-w-12))+'px';
  const h=el.offsetHeight;el.style.top=(rc.bottom+6+h>window.innerHeight-8?Math.max(8,rc.top-6-h):rc.bottom+6)+'px';
}
function openRmem(id,btn){
  const box=$('#rmenu');const r=S.recruits.find(x=>x.id===id);
  if(!r||S.sel.rmem===id){closeRmem();return;}
  closeRmem();S.sel.rmem=id;box.innerHTML=rmemHTML(r);$$('.rc-mem').forEach(b=>b.setAttribute('aria-expanded',String(b.dataset.id===id)));
  placeFloat(btn,260);
}
function uinfoHTML(name){
  const isMe=S.me&&name===S.me.name;const p=isMe?playerInfo(name):bot(name);
  if(!p)return `<div class="rmenu uinfo"><p class="empty" style="padding:10px 12px">${esc(name)}님의 정보를 찾을 수 없습니다.</p></div>`;
  const st=isMe?myStats():statsFor(p.job,p.level,{});
  const face=isMe&&S.me.portrait?`<img class="u-face" src="${S.me.portrait}" alt="">`:sigil(p.job);
  return `<div class="rmenu uinfo" role="dialog" aria-label="${esc(name)} 정보"><div class="u-top">${face}<div class="rm-t">${(()=>{const tt=isMe?(S.titles&&S.titles.equip&&titleById(S.titles.equip)):botTitle(name);return tt?`<span class="tn-s tc-${tt.cat}">${esc(tt.name)}</span>`:'';})()}<div class="row" style="gap:6px"><b>${esc(name)}</b>${isMe?'<span class="chip dim">나</span>':''}</div>
      <small><span class="num">LV${p.level}</span></small><div class="row" style="gap:4px">${roleChip(p.job)}${statusChip(isMe?myStatus():botStatus(p))}</div></div></div>
    ${(isMe?S.me.memo:botMemo(name))?`<div class="u-sec u-memo">${esc(isMe?S.me.memo:botMemo(name))}</div>`:''}${!isMe&&noteOf(name)?`<div class="u-sec u-memo"><span class="faint" style="font-style:normal">내 메모 · </span>${esc(noteOf(name))}</div>`:''}<div class="u-sec">${statLine(st,true)}</div>
    ${!isMe&&bondOf(name)?`<div class="u-sec u-act"><span class="faint" style="font-size:11.5px">관계</span>${bondChip(name)}</div>`:''}<div class="u-sec u-act"><span class="faint" style="font-size:11.5px">현재</span>${p.online?activityHTML(p):'<span class="chip dim">오프라인</span>'}</div>
    ${isMe?'':`<div class="u-sec row" style="gap:6px"><button class="btn btn-sm btn-primary" data-act="u-view" data-name="${esc(name)}">상세보기</button><button class="btn btn-sm" data-act="u-dm" data-name="${esc(name)}">1:1 대화</button><button class="btn btn-sm" data-act="bond-open" data-name="${esc(name)}">관계</button><button class="btn btn-sm" data-act="u-mail" data-name="${esc(name)}">${TICON.mail} 편지 보내기</button></div>`}</div>`;
}
function openUinfo(name,btn){
  const key='u:'+name;if(S.sel.rmem===key){closeRmem();return;}
  closeRmem();S.sel.rmem=key;$('#rmenu').innerHTML=uinfoHTML(name);placeFloat(btn,250);
}
function closeRmem(){if(S&&S.sel.rmem){S.sel.rmem=null;const b=$('#rmenu');if(b)b.innerHTML='';$$('.rc-mem').forEach(x=>x.setAttribute('aria-expanded','false'));}}
window.addEventListener('scroll',closeRmem,{passive:true});window.addEventListener('resize',()=>{if(S)closeRmem();});
document.addEventListener('scroll',e=>{if(e.target&&e.target.matches&&e.target.matches('[data-msgs],.pop-body,[data-rslide]'))closeRmem();},{capture:true,passive:true});
function recruitPanel(){
  const rs=S.recruits.slice(0,6);
  return `<div class="panel rpanel"><h3>${hTitle('party','모집 중인 파티')} <span class="row" style="gap:8px;letter-spacing:0;text-transform:none"><span class="faint num" style="font-weight:400">${rs.length}/6</span><button class="link" data-act="nav" data-route="battle">전체 보기</button></span></h3>
    <div class="rslide-wrap">
    <div class="rslide" data-rslide tabindex="0" aria-label="모집 중인 파티 목록 · 마우스로 끌어 좌우로 넘기기">${rs.length?rs.map(recruitCard).join(''):'<p class="empty">모집 중인 파티가 없습니다. 직접 파티를 만들어 보세요.</p>'}</div></div></div>`;
}
function recruitRows(rs,withJoin){
  if(!rs.length)return '<p class="empty">모집 중인 파티가 없습니다. 직접 파티를 만들어 보세요.</p>';
  return rs.map(r=>{const m=monster(r.monsterId);if(!m)return '';const mem=r.members.map(n=>bot(n)).filter(Boolean);const need=missingRoles(m,mem.map(b=>roleOf(b.job)));
    const reason=joinReason(r);
    return `<div class="li"><div class="t"><b>${esc(r.name||m.name)}</b> <span class="faint" style="font-size:12px">${esc(m.name)}</span><small>파티장 ${esc(r.leader)} · <span class="num">${mem.length}/${r.target}</span>${sumR(need)?' · 필요 '+missText(need):''}</small>${withJoin&&reason?`<small class="reason">${esc(reason)}</small>`:''}</div>
      ${withJoin?`<button class="btn btn-sm" data-act="joinrecruit" data-id="${r.id}" ${reason||busyReason()?'disabled':''}>참가</button>`:`<button class="btn btn-sm btn-ghost" data-act="link" data-link="monster:${m.id}">보기</button>`}</div>`;}).join('');
}
const NPAGE=5;
const NCAT={notice:'공지',maint:'점검',update:'업데이트',event:'이벤트'};
const ncatTag=n=>{const c=NCAT[n.cat]?n.cat:'notice';return `<span class="ntag nt-${c}">${NCAT[c]}</span>`;};
function noticeSeenSet(){return new Set((S.me&&S.me.noticeSeen)||[]);}
function noticeUnread(){if(!S||!S.me||!S.data||!S.data.notices)return false;const seen=noticeSeenSet();return S.data.notices.some(n=>!seen.has(n.id));}
function noticeMarkSeen(){if(!S.me)return;const ids=S.data.notices.map(n=>n.id);const seen=noticeSeenSet();if(ids.every(i=>seen.has(i)))return;S.me.noticeSeen=ids;save();}
function noticePop(){
  const all=S.data.notices,adm=isAdmin();const pages=Math.max(1,Math.ceil(all.length/NPAGE));const pg=Math.min(S.sel.npage||0,pages-1);
  const rows=all.slice(pg*NPAGE,pg*NPAGE+NPAGE);const fresh=new Set(S.sel.noticeNew||[]);
  return `<div class="pop-head"><b>공지사항</b>${adm?'<button class="btn btn-sm" data-act="n-new">글쓰기</button>':''}</div>
    <div class="pop-body" data-notices><div class="board" role="table" aria-label="공지사항 목록">
    ${rows.length?rows.map(n=>`<div class="brow ${adm?'adm':''} ${fresh.has(n.id)?'new':''}" role="row"><span role="cell">${ncatTag(n)}</span><button class="btitle" role="cell" data-act="n-open" data-id="${n.id}">${fresh.has(n.id)?'<span class="nnew" aria-label="새 공지"></span>':''}${esc(n.title)}</button><span class="num faint" role="cell">${esc(n.date)}</span>
      ${adm?`<span class="bact" role="cell"><button class="ibtn sm" data-act="n-edit" data-id="${n.id}" data-tip="수정" aria-label="${esc(n.title)} 수정">${TICON.pen}</button><button class="ibtn sm danger" data-act="n-delask" data-id="${n.id}" data-tip="삭제" aria-label="${esc(n.title)} 삭제">${TICON.trash}</button></span>`:''}</div>`).join(''):'<p class="empty" style="padding:10px 0">등록된 공지가 없습니다.</p>'}</div>
    ${pages>1?`<div class="bpager">${Array.from({length:pages},(_,k)=>`<button class="${k===pg?'on':''}" data-act="n-page" data-p="${k}" aria-label="${k+1}페이지" ${k===pg?'aria-current="page"':''}>${k+1}</button>`).join('')}</div>`:''}</div>`;
}
function noticeView(n){
  const adm=isAdmin();
  modal(`<div class="ndlg"><div class="row" style="justify-content:space-between;align-items:flex-start;gap:10px"><div>${ncatTag(n)}<h3 style="margin-top:8px">${esc(n.title)}</h3><p class="faint num" style="font-size:12px;margin-top:4px">운영자 · ${esc(n.date)}</p></div><button class="btn btn-sm btn-ghost" data-act="closemodal">닫기</button></div>
    <div class="nbody">${esc(n.text||'내용이 없습니다.')}</div>
    ${adm?`<div class="row" style="justify-content:flex-end"><button class="btn btn-sm" data-act="n-edit" data-id="${n.id}">수정</button><button class="btn btn-sm btn-danger" data-act="n-delask" data-id="${n.id}">삭제</button></div>`:''}</div>`);
}
function noticeEdit(n){
  modal(`<form class="ndlg" data-form="notice-edit" data-id="${n?n.id:''}"><div class="row" style="justify-content:space-between"><h3>${n?'공지 수정':'새 공지'}</h3><button type="button" class="btn btn-sm btn-ghost" data-act="closemodal">닫기</button></div>
    <label class="stack" style="gap:4px"><span class="faint" style="font-size:12px">분류</span><select id="ne-cat">${Object.entries(NCAT).map(([k,v])=>`<option value="${k}" ${(n&&n.cat||'notice')===k?'selected':''}>${v}</option>`).join('')}</select></label>
    <label class="stack" style="gap:4px"><span class="faint" style="font-size:12px">제목</span><input type="text" id="ne-title" maxlength="60" required value="${esc(n?n.title:'')}"></label>
    <label class="stack" style="gap:4px"><span class="row" style="justify-content:space-between"><span class="faint" style="font-size:12px">내용</span><span class="faint num" style="font-size:12px" id="ne-count">${n?(n.text||'').length:0}/1000</span></span><textarea id="ne-text" rows="8" maxlength="1000" style="font-family:var(--f-body);font-size:13px">${esc(n?n.text:'')}</textarea></label>
    <div class="row" style="justify-content:flex-end"><button type="button" class="btn btn-ghost" data-act="closemodal">취소</button><button class="btn btn-primary" type="submit">${n?'저장':'게시'}</button></div></form>`);
  const mm=$('.modal');if(mm)mm.classList.add('wide');const t=$('#ne-title');if(t)t.focus();
}
function refreshNotices(){if(S.sel.pop==='notice'){noticeMarkSeen();renderPop();}renderTop();}
/* ───────── 채팅 ───────── */
function chatPanel(opt={}){
  return `<div class="panel chat${opt.lock?'':' chat-main'}" data-chatpanel data-lock="${opt.lock||''}">${opt.lock?'':'<div class="chat-sheethead"><span>채팅</span><button type="button" class="chat-x" data-chatclose aria-label="채팅 닫기">×</button></div>'}<div data-chathead></div><div class="msgs ${opt.tall?'tall':''}" data-msgs aria-live="polite"></div>
    <form data-form="chat"><select class="csel" id="chat-ch-${opt.lock||'all'}" aria-label="보낼 채널" hidden><option value="lobby">전체</option><option value="party">파티</option></select><select class="wsel" id="chat-cat-${opt.lock||'all'}" aria-label="월드 메시지 분류" hidden>${Object.entries(WCAT).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select><input type="text" id="chat-in-${opt.lock||'all'}" maxlength="200" placeholder="메시지 입력" autocomplete="off" aria-label="채팅 입력"><button class="chat-send" type="submit">전송</button></form></div>`;
}
function whisperables(){return Object.entries(S.rel).filter(([,v])=>v==='friend').map(([k])=>k);}
function weekKey(t=now()){const d=new Date(t+9*3600e3);const back=(d.getUTCDay()+6)%7;return new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()-back)).toISOString().slice(0,10);}
function dmState(){
  const wk=weekKey();
  if(!S.dm||S.dm.week!==wk){const had=S.dm&&Object.keys(S.dm.threads||{}).length;S.dm={week:wk,threads:{}};S.sel.dmWith=null;if(had)setTimeout(()=>toast('1:1 대화가 주간 초기화되었습니다. (매주 월요일 00:00)'),0);}
  return S.dm;
}
function dmUnread(){return Object.values(dmState().threads).reduce((a,t)=>a+(t.unread||0),0);}
function dmPush(name,msg,incoming){
  const d=dmState();const first=!d.threads[name]||!d.threads[name].msgs.length;
  const t=d.threads[name]=d.threads[name]||{msgs:[],unread:0};t.msgs.push(msg);t.msgs=t.msgs.slice(-100);
  if(incoming&&!(visibleTab('dm')&&S.sel.dmWith===name))t.unread++;
  if(first){if(incoming)notify(`${name}님이 1:1 대화를 시작했습니다: ${msg.text}`);else toast(`${name}님과 1:1 대화를 시작했습니다. 1:1 대화는 매주 월요일 00:00에 초기화됩니다.`);}
  else if(incoming&&!(visibleTab('dm')&&S.sel.dmWith===name))notify(`${name}님의 1:1 메시지: ${msg.text}`);
}
function chatHead(lock){
  const tab=lock||S.sel.chatTab;
  let h='';
  if(!lock)h+=`<div class="tabs" role="tablist">${[['world','월드',S.unread.world],['lobby','전체',S.unread.lobby],['party','파티',S.unread.party],['dm','1:1',dmUnread()]].map(([k,l,u])=>`<button role="tab" data-act="chattab" data-tab="${k}" aria-selected="${tab===k}">${l}${u&&tab!==k?` <span class="badge">${u}</span>`:''}</button>`).join('')}</div>`;
  else h+=`<div class="tabs"><button aria-selected="true" tabindex="-1">${{party:'파티 채팅',raid:'레이드 채팅'}[lock]||lock}</button></div>`;
  if(tab==='dm'){
    if(S.sel.dmWith){const b=playerInfo(S.sel.dmWith);h+=`<div class="wpick"><button class="btn btn-sm btn-ghost" data-act="dm-back">← 목록</button><b style="color:var(--silver);font-size:13px">${esc(S.sel.dmWith)}</b>${b?`<span class="faint" style="font-size:12px">${className(b.job)}${b.online?'':' · 오프라인'}</span>`:''}${bot(S.sel.dmWith)?`<button class="ibtn sm dm-gift" data-act="u-gift" data-name="${esc(S.sel.dmWith)}" data-tip="선물 보내기" aria-label="${esc(S.sel.dmWith)}에게 선물 보내기">${TICON.gift}</button>`:''}</div>`;}
    else{const ppl=S.bots.filter(b=>b.online&&S.rel[b.name]!=='blocked'&&!(dmState().threads[b.name]||{msgs:[]}).msgs.length);
      h+=`<div class="wpick"><select id="dm-new" aria-label="대화 상대 선택"><option value="">새 대화 상대 선택</option>${ppl.map(b=>`<option value="${esc(b.name)}">${esc(b.name)} · ${CLASSES[b.job].name}</option>`).join('')}</select><button class="btn btn-sm" data-act="dm-start">시작</button></div>`;}
  }
  return h;
}
const WCAT={notice:'공지',update:'업데이트',maint:'점검'};
function curMsgs(tab){
  if(tab==='world')return S.chat.world||[];
  if(tab==='lobby'){const L=S.chat.lobby.filter(m=>S.rel[m.from]!=='blocked');if(!S.party)return L;return [...L,...S.party.chat.filter(m=>!m.sys).map(m=>({...m,ch:'party'}))].sort((a,b)=>a.ts-b.ts);}
  if(tab==='party')return S.party?S.party.chat:[];
  if(tab==='raid')return S.mass?(S.mass.chat=S.mass.chat||[]).map(m=>({...m,ch:'raid'})):[];
  if(tab==='dm')return S.sel.dmWith?((dmState().threads[S.sel.dmWith]||{}).msgs||[]):[];
  return [];
}
function dmListHTML(){
  const th=Object.entries(dmState().threads).filter(([,t])=>t.msgs.length).sort((a,b)=>b[1].msgs.at(-1).ts-a[1].msgs.at(-1).ts);
  const note='<p class="dm-note">매주 월요일 00:00 초기화</p>';
  if(!th.length)return note+`<p class="empty">아직 1:1 대화가 없습니다. 위에서 상대를 고르거나, 채팅에서 이름을 눌러 대화를 시작하세요.</p>`;
  return note+th.map(([n,t])=>{const p=playerInfo(n);const last=t.msgs.at(-1);return `<button class="dmrow ${t.unread?'unread':''}" data-act="dm-open" data-name="${esc(n)}">${p?sigil(p.job,'sm'):''}<span class="dm-t"><span class="row" style="gap:6px;justify-content:space-between"><b>${esc(n)}</b><span class="mwhen">${fmtWhen(last.ts)}</span></span><span class="dm-last">${last.from===S.me.name?'나: ':''}${esc(last.text)}</span></span>${t.unread?`<span class="badge">${t.unread}</span>`:''}</button>`;}).join('');
}
function msgHTML(m){
  if(m.sys)return `<div class="msg sys">${esc(m.text)}</div>`;
  if(m.ch==='party')return `<div class="msg"><span class="chtag">파티</span><button class="who ${m.from===S.me.name?'w-me':'w-'+jobCls((playerInfo(m.from)||{}).job||'')}" data-act="uinfo" data-name="${esc(m.from)}">${esc(m.from)}</button>${esc(m.text)}<span class="when num">${hhmm(m.ts)}</span></div>`;
  if(m.ch==='raid'){const r=raidRole(m.from);return `<div class="msg"><button class="who w-${r} ${m.from===S.me.name?'w-mine':''}" data-act="r-who" data-name="${esc(m.from)}" title="${esc(m.from)} 정보 보기">${esc(m.from)}</button>${esc(m.text)}<span class="when num">${hhmm(m.ts)}</span></div>`;}
  if(m.cat)return `<div class="msg world w-${m.cat}"><span class="wtag">${WCAT[m.cat]||'공지'}</span>${esc(m.text)}<span class="when num">${hhmm(m.ts)}</span></div>`;
  const pi=playerInfo(m.from);const cls=m.from===S.me.name?'w-me':pi?'w-'+jobCls(pi.job):'';
  return `<div class="msg"><button class="who ${cls}" data-act="uinfo" data-name="${esc(m.from)}" title="${esc(m.from)} 정보 보기">${esc(m.from)}</button>${esc(m.text)}<span class="when num">${hhmm(m.ts)}</span>${m.from!==S.me.name?`<button class="rep" data-act="report" data-id="${m.id}" data-from="${esc(m.from)}" title="메시지 신고">신고</button>`:''}</div>`;
}
function updateChats(){
  $$('[data-chatpanel]').forEach(p=>{
    const lock=p.dataset.lock;const tab=lock||S.sel.chatTab;const shown=chatShown(p);
    if(shown){if(tab==='world')S.unread.world=0;if(tab==='lobby')S.unread.lobby=0;if(tab==='party')S.unread.party=0;
    if(tab==='dm'&&S.sel.dmWith){const t=dmState().threads[S.sel.dmWith];if(t)t.unread=0;}}
    p.querySelector('[data-chathead]').innerHTML=chatHead(lock);
    const box=p.querySelector('[data-msgs]');const atBottom=box.scrollHeight-box.scrollTop-box.clientHeight<40;
    if(box.dataset.view!==tab+(S.sel.dmWith||'')){box.dataset.view=tab+(S.sel.dmWith||'');box.dataset.init='';}
    if(tab==='dm'&&!S.sel.dmWith){box.innerHTML=dmListHTML();box.scrollTop=0;}
    else{
      const list=curMsgs(tab);let empty='';
      if(tab==='party'&&!S.party)empty='<p class="empty">파티에 참가하면 파티원과 대화할 수 있습니다.</p>';
      else if(tab==='raid'&&!S.mass)empty='<p class="empty">레이드가 끝나 채팅이 닫혔습니다.</p>';
      else if(tab==='raid'&&!list.length)empty='<p class="empty">원정대와 대화해 보세요. 전투 로그와는 따로 표시됩니다.</p>';
      else if(!list.length)empty=tab==='dm'?`<p class="empty">${esc(S.sel.dmWith)}님에게 첫 메시지를 보내 보세요.</p>`:'<p class="empty">아직 메시지가 없습니다.</p>';
      box.innerHTML=empty||list.slice(-80).map(msgHTML).join('');
      if(atBottom||!box.dataset.init){box.scrollTop=box.scrollHeight;box.dataset.init=1;}
    }
    const ws=p.querySelector('.wsel');if(ws){ws.hidden=!(tab==='world'&&isAdmin());ws.value=S.sel.wcat||'notice';}
    const cs=p.querySelector('.csel');if(cs){cs.hidden=!(tab==='lobby'||(tab==='party'&&S.party));cs.value=tab==='party'?(S.sel.partyCh||'party'):(S.sel.lobbyCh||'lobby');}
    const inp=p.querySelector('input');const dis=(tab==='raid'&&!S.mass)||(tab==='party'&&!S.party)||(tab==='dm'&&!S.sel.dmWith)||(tab==='world'&&!isAdmin());inp.disabled=dis;p.querySelector('button[type=submit]').disabled=dis;
    inp.placeholder=tab==='raid'?'원정대에게 메시지 입력':tab==='world'?(isAdmin()?'메시지 입력':'월드는 운영자만 작성할 수 있습니다'):tab==='lobby'?((S.sel.lobbyCh==='party')?'파티원에게 메시지 입력':'전체 채팅에 메시지 입력'):tab==='party'?((S.sel.partyCh||'party')==='lobby'?'전체 채팅에 메시지 입력':'파티원에게 메시지 입력'):S.sel.dmWith?`${S.sel.dmWith}에게 1:1 메시지`:'대화할 상대를 먼저 고르세요';
  });
  renderTopBadges();
  syncFabBadge();
}
function renderTopBadges(){const el=$('[data-online]');if(el)el.textContent=onlineCount();}
let lastSend=0;
function sendChat(tab,text){
  text=text.replace(/\s+/g,' ').trim().slice(0,200);if(!text)return;
  if(now()-lastSend<1200){toast('메시지를 너무 빠르게 보내고 있습니다. 잠시 후 다시 보내세요.','warn');return false;}
  lastSend=now();
  const msg={id:uid('m'),from:S.me.name,text,ts:now()};
  if(tab==='world'){if(!isAdmin()){toast('월드 채팅은 운영자만 작성할 수 있습니다.','warn');return false;}
    const cat=S.sel.wcat||'notice';S.chat.world.push({id:uid('w'),cat,from:S.me.name,text,ts:now()});S.chat.world=S.chat.world.slice(-100);
    logChange('월드 채팅',[{field:WCAT[cat],before:undefined,after:text}]);save();updateChats();toast(`월드에 ${WCAT[cat]}을(를) 올렸습니다.`,'good');return true;}
  if(tab==='lobby'&&S.sel.lobbyCh==='party'){if(!S.party){toast('파티에 참가하지 않아 파티 채팅을 보낼 수 없습니다.','warn');return false;}tab='party';}
  else if(tab==='party'&&S.sel.partyCh==='lobby')tab='lobby';
  if(tab==='raid'){if(!S.mass){toast('진행 중인 레이드가 없습니다.','warn');return false;}(S.mass.chat=S.mass.chat||[]).push(msg);S.mass.chat=S.mass.chat.slice(-150);bump('chats');
    if(Math.random()<0.4){const ps=S.battle&&S.battle.grid?S.battle.players.filter(p=>!p.isMe&&!p.dead).map(p=>p.name):S.mass.roster.filter(x=>!x.isMe).map(x=>x.name);if(ps.length)later(rnd(1500,3500),()=>botSay('raid',pick(ps),pick(MASS_LINES)));}
    save();updateChats();return true;}
  if(tab==='dm'){const to=S.sel.dmWith;if(!to)return false;if(S.rel[to]==='blocked'){toast('차단한 사람에게는 보낼 수 없습니다.','warn');return false;}
    dmPush(to,msg,false);bump('chats');const b=bot(to);if(b){const reply=()=>{if(S.rel[to]==='blocked')return;botDm(to,pick(WHISPER_LINES));};if(b.online)later(rnd(2000,4500),reply);else (S.pendingDm=S.pendingDm||[]).push(to);}
    save();updateChats();return true;}
  if(tab==='lobby'){S.chat.lobby.push(msg);S.chat.lobby=S.chat.lobby.slice(-150);
    bump('chats');
    if(/파티|구해|가실|같이/.test(text)&&Math.random()<0.7)later(rnd(2500,5000),()=>{const b=pick(idleBots());if(b)botSay('lobby',b.name,pick(['저 갈래요!','어디 가세요?','레벨 몇이세요?','좋아요 초대해 주세요']));});}
  else if(tab==='party'){if(!S.party)return;S.party.chat.push(msg);bump('chats');
    if(Math.random()<0.5)later(rnd(1500,3500),()=>{if(!S.party)return;const bm=S.party.members.filter(x=>!x.isMe);if(bm.length)botSay('party',pick(bm).name,pick(PARTY_LINES));});}
  else if(tab==='whisper'){const to=S.sel.whisperTo;if(!isFriend(to)){toast('친구에게만 귓속말을 보낼 수 있습니다.','warn');return false;}
    (S.chat.whisper[to]=S.chat.whisper[to]||[]).push(msg);
    const b=bot(to);if(b){const reply=()=>{if(!isFriend(to))return;botSay('whisper',to,pick(WHISPER_LINES));};
      if(b.online)later(rnd(2000,4500),reply);else (S.pendingReplies=S.pendingReplies||[]).push(to);}}
  save();updateChats();return true;
}
function botDm(name,text){dmPush(name,{id:uid('m'),from:name,text,ts:now()},true);updateChats();renderTop();save();}
function botSay(ch,name,text){
  const msg={id:uid('m'),from:name,text,ts:now()};
  if(ch==='lobby'){S.chat.lobby.push(msg);S.chat.lobby=S.chat.lobby.slice(-150);if(!visibleTab('lobby'))S.unread.lobby++;}
  else if(ch==='party'){if(!S.party)return;S.party.chat.push(msg);if(!visibleTab('party'))S.unread.party++;}
  else if(ch==='raid'){if(!S.mass)return;(S.mass.chat=S.mass.chat||[]).push(msg);}
  else if(ch==='whisper'){(S.chat.whisper[name]=S.chat.whisper[name]||[]).push(msg);if(!(visibleTab('whisper')&&S.sel.whisperTo===name)){S.unread.whisper[name]=(S.unread.whisper[name]||0)+1;toast(`${name}의 귓속말: ${text}`);playAlarm();}}
  updateChats();renderTop();save();
}
function chatShown(p){return !(innerWidth<=760&&p.classList&&p.classList.contains('chat-main')&&!document.body.classList.contains('chat-open'));}
function visibleTab(t){return $$('[data-chatpanel]').some(p=>chatShown(p)&&(p.dataset.lock||S.sel.chatTab)===t);}
function syncFabBadge(){const f=$('#chatfab');if(!f||!f.querySelector)return;let bd=f.querySelector('.fab-badge');const n=dmUnread();
  if(!bd){f.insertAdjacentHTML('beforeend','<span class="fab-badge" hidden></span>');bd=f.querySelector('.fab-badge');}
  if(!bd)return;bd.hidden=!n;if(f.setAttribute)f.setAttribute('aria-label',n?'채팅 열기 · 읽지 않은 1:1 대화 있음':'채팅 열기');}
function sysParty(text){if(S.party){S.party.chat.push({id:uid('m'),sys:true,text,ts:now()});}}
const timers=new Set();
function later(ms,fn){const t=setTimeout(()=>{timers.delete(t);fn();},ms);timers.add(t);}

/* ───────── 퀘스트 화면 ───────── */
function vQuest(){
  const QT=[['epic','메인 스토리'],['sub','서브 스토리'],['repeat','데일리']];
  const all=S.data.quests.filter(q=>q.published);
  let tab=S.sel.qtab||'epic';
  const qs=all.filter(q=>q.cat===tab&&questStatus(q)!=='hidden');
  let sel=S.sel.quest;const sq=quest(sel);
  if(!sq||!sq.published||sq.cat!==tab||questStatus(sq)==='hidden')sel=(qs.find(q=>['active','claim','available'].includes(questStatus(q)))||qs[0]||{}).id;
  S.sel.quest=sel;
  const cnt=c=>all.filter(q=>q.cat===c&&questStatus(q)!=='hidden').length;
  const note={epic:'이야기 중간의 전투는 혼자 치르는 개인 레이드입니다. 지면 같은 단계에서 다시 도전합니다.',sub:'세계관에서 파생된 이야기입니다. 조건을 채우면 열립니다.',repeat:`오늘의 데일리 ${DAILY_Q}개 · 매일 05:00에 목록에서 무작위로 바뀝니다.`}[tab];
  return `<div class="wrap page">
    <div class="page-head"><div><h2>퀘스트<small class="en">Quest</small></h2><p>수락 → 상황 읽기 → 선택 → 결과 확인 → 다음 단계 → 보상 수령. 선택은 캐릭터별로 저장됩니다.</p></div></div>
    <div class="qtabs" role="tablist">${QT.map(([k,l])=>`<button role="tab" data-act="qtab" data-tab="${k}" aria-selected="${tab===k}">${l}<span class="num">${cnt(k)}</span></button>`).join('')}</div>
    <div class="split">
      <div class="panel qcats"><p class="qtab-note">${note}</p><div class="qgroups" data-cat="${tab}">${questGroupsHTML(tab,qs,sel)}</div></div>
      <div class="panel" id="qdetail">${sel?questDetail(quest(sel)):'<p class="empty">퀘스트가 없습니다.</p>'}</div>
    </div></div>`;
}
/* 퀘스트 목록 묶음: 메인=챕터별(QCHAPTERS, 접기), 서브·데일리=레벨순 + 완료 목록(기본 접힘) */
const QDONE=['done','doneToday'];
function qLi(q,sel){const st=questStatus(q);return `<div class="li clickable" data-act="openquest" data-id="${q.id}" ${q.id===sel?'aria-current="true"':''}><div class="t"><b>${esc(q.title)}</b><small>LV${q.level}${q.prereq?' · 선행 '+esc((quest(q.prereq)||{}).title||q.prereq):''}${hasBattle(q)?' · 개인 레이드':''}</small></div><span class="chip ${QSTAT[st][1]}">${QSTAT[st][0]}</span></div>`;}
function qGroup(key,title,list,sel,defOpen,meta){const O=S.sel.qgrp||{};const open=key in O?O[key]:defOpen;
  return `<div class="qgrp ${open?'open':''}"><button class="qgrp-h" data-act="qgrp" data-k="${key}" data-def="${defOpen?1:0}" aria-expanded="${open}"><span class="qgrp-t">${esc(title)}</span><span class="qgrp-m num">${meta}</span><svg class="qgrp-c" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>${open?`<div class="list">${list.map(q=>qLi(q,sel)).join('')}</div>`:''}</div>`;}
function questGroupsHTML(tab,qs,sel){if(!qs.length)return '<p class="empty">없음</p>';
  if(tab==='epic'){const used=new Set();const groups=QCHAPTERS.map(([key,title,ids])=>{const L=ids.map(id=>qs.find(q=>q.id===id)).filter(Boolean);L.forEach(q=>used.add(q.id));return [key,title,L];});
    const rest=qs.filter(q=>!used.has(q.id));if(rest.length)groups.push(['ch_etc','그 밖의 이야기',rest]);
    return groups.filter(g=>g[2].length).map(([key,title,L])=>{const done=L.filter(q=>QDONE.includes(questStatus(q))).length;const cur=L.some(q=>q.id===sel)||done<L.length&&L.some(q=>questStatus(q)!=='locked');
      return qGroup(key,title,L,sel,cur,done===L.length?'완료':`${done}/${L.length}`);}).join('');}
  const byLv=(a,b)=>(a.level-b.level)||a.title.localeCompare(b.title,'ko');
  const live=qs.filter(q=>!QDONE.includes(questStatus(q))).sort(byLv),done=qs.filter(q=>QDONE.includes(questStatus(q))).sort(byLv);
  return `${done.length?qGroup('done_'+tab,'완료 목록',done,sel,false,`${done.length}`):''}<div class="list">${live.map(q=>qLi(q,sel)).join('')||'<p class="empty" style="padding:6px 0">진행할 퀘스트가 없습니다.</p>'}</div>`;}  /* 완료 목록(접힘)을 진행할 퀘스트 위에 */
function questDetail(q){
  const st=questStatus(q);const qp=S.qp[q.id];
  let h=`<div class="stack" style="gap:16px"><div><div class="row" style="justify-content:space-between"><span class="ph" style="margin:0">${{epic:'메인 스토리',sub:'서브 스토리',repeat:'데일리'}[q.cat]} · LV${q.level}</span><span class="chip ${QSTAT[st][1]}">${QSTAT[st][0]}</span></div>
    <h2 style="font-family:var(--f-display);font-size:24px;color:var(--silver);margin-top:6px">${esc(q.title)}</h2><p class="muted" style="margin-top:6px">${esc(q.desc)}</p></div>`;
  const ends=Object.values(q.steps).filter(s=>s.end);
  if(st==='locked')h+=`<p class="reason">${esc(lockReason(q))}</p>`;
  if(q.cat!=='epic'&&(st==='available'||st==='locked'||st==='done'||st==='doneToday')){
    h+=`<div><div class="ph">완료 보상${ends.length>1?' · 경로별':''}</div><div class="stack">${ends.map(e=>`<div class="row" style="justify-content:space-between;gap:12px"><span class="muted" style="font-size:13px">${esc(e.text)}</span>${rewardHTML(qReward(q,e.reward))}</div>`).join('')}</div></div>`;
  }
  if(st==='available')h+=`<div class="act-br"><button class="btn btn-primary btn-sm" data-act="acceptq" data-id="${q.id}">수락</button></div>`;
  if(st==='done'||st==='doneToday'){
    const log=S.rewardLog.find(r=>r.source==='quest'&&r.questId===q.id);
    h+=`<p class="ok-t">${st==='doneToday'?'오늘 주기의 보상을 받았습니다. 오전 5시 이후 다시 수락할 수 있습니다.':'완료한 퀘스트입니다.'}${log?` 선택한 경로: ${esc(log.path||'')}`:''}</p>`;
  }
  if(qp&&(st==='active'||st==='claim')){
    if(qp.history.length)h+=`<div class="qhist">${qp.history.map(x=>`<div><p>${esc(x.text)}</p><p style="margin-top:4px"><b>▸ ${esc(x.label)}</b> — ${esc(x.result)}</p></div>`).join('')}</div>`;
    const step=q.steps[qp.step];
    if(step.end){
      h+=`<div class="result"><div class="ph" style="margin-bottom:6px">완료 · ${esc(step.text)}</div>${rewardHTML(qReward(q,step.reward))}</div>
        <div class="act-br"><button class="btn btn-primary btn-sm" data-act="claimq" data-id="${q.id}">보상 수령</button></div>`;
    }else if(qp.pending!=null){
      const c=step.choices[qp.pending];
      h+=`${qTextHTML(step.text)}<div class="result"><div class="ph" style="margin-bottom:6px">선택 · ${esc(c.label)}</div>${esc(c.result||'')}</div>
        <div class="act-br"><button class="btn btn-primary btn-sm" data-act="nextq" data-id="${q.id}">다음 단계</button></div>`;
    }else if(step.battle){
      const m=monster(step.battle);const busy=busyReason();
      h+=`${qTextHTML(step.text)}<div class="qfight">${m?`<pre class="ascii">${esc(ART[m.art]||ART.generic)}</pre><div class="stack" style="gap:4px"><span class="ph" style="margin:0">개인 레이드</span><b class="mname">${esc(m.name)}</b><span class="muted" style="font-size:12.5px">${esc(m.region||'')}</span></div>`:'<p class="reason">몬스터 정보가 없습니다</p>'}</div>
        ${qp.lost?'<p class="reason">지난 전투에서 쓰러졌습니다. 같은 단계에서 다시 도전할 수 있습니다.</p>':''}
        <div class="row"><button class="btn btn-primary" data-act="qfight" data-id="${q.id}" ${busy||!m?'disabled':''}>${qp.lost?'다시 도전':'전투 시작'}</button>${busy?`<span class="reason">${esc(busy)}</span>`:''}</div>`;
    }else{
      h+=`${qTextHTML(step.text)}<div class="stack" style="gap:8px">${step.choices.map((c,i)=>{const r=choiceReason(c);return `<button class="choice" data-act="chooseq" data-id="${q.id}" data-i="${i}" ${r?'disabled':''}><span>${esc(c.label)}</span>${r?`<small>${esc(r)}</small>`:''}</button>`;}).join('')}</div>`;
    }
    if(st==='active')h+=`<div><button class="btn btn-sm btn-ghost" data-act="abandonq" data-id="${q.id}">퀘스트 포기</button></div>`;
  }
  return h+'</div>';
}

/* ───────── 전투 메뉴 ───────── */
function patternLines(m){
  return [`평소 · ${m.singleName}: 대상 1명에게 공격력${m.singleMult!==1?'×'+m.singleMult:''} 대미지`,`${m.aoeEvery}턴마다 · ${m.aoeName}: 파티 전체에 공격력×${m.aoeMult} (전 턴에 예고)`,
    `확률 ${Math.round(m.dotChance*100)}% · ${m.dotName}: 단일 공격 + 3턴 동안 매 턴 ${m.dotDmg} 고정 대미지`];
}
function vMonster(m){
  const lr=levelReason(m,S.me.level)||raidBlock(m);const busy=busyReason();
  const rs=S.recruits.filter(r=>r.monsterId===m.id);
  const myRole=roleOf(S.me.job);
  const mk=S.sel.mk||{};
  const tgt=Math.min(m.max,Math.max(m.min,mk.target||m.target||m.min));
  const vis=mk.vis||'public';
  return `<div class="wrap page">
    <div><button class="link" data-act="backmon">← ${MKIND[mkind(m)]||'레이드'} 목록</button></div>
    <div class="split-r">
      <div class="stack" style="gap:16px">
        <div class="panel"><div class="boss"><pre class="ascii big">${esc(ART[m.art]||ART.generic)}</pre>
          <div class="stack"><div class="ph" style="margin:0">${esc(m.region||'')}</div><h2 class="mname" style="font-size:26px">${esc(m.name)}</h2><p class="muted">${esc(m.desc||'')}</p></div></div>
          <div class="facts" style="margin-top:16px"><div><small>입장 레벨</small><b class="num">LV${m.level}${m.maxLevel?'~'+m.maxLevel:'+'}</b></div><div><small>참가 인원</small><b class="num">${m.min}~${m.max}명</b></div><div><small>필요 역할</small><b>${['tank','dps','heal'].filter(r=>m.roles[r]).map(r=>ROLE[r].slice(0,1)+m.roles[r]).join(' · ')}</b></div></div>
          ${m.hpScale?`<p class="faint" style="font-size:12px;margin-top:8px">* ${m.min}명을 넘는 1명마다 보스 체력이 +${Math.round(m.hpScale*100)}% 늘어납니다 · 전투 시작 시 확정</p>`:''}
</div>
        <div class="panel"><h3>보상 · 참가자별 개별 지급</h3>${mkind(m)==='dungeon'?(()=>{const R=dungeonReward(m,dtg(m.id));return rewardHTML({exp:R.exp,gold:R.gold});})():rewardHTML({exp:m.exp,gold:m.gold})}${(()=>{const parts=[m.drops.length?rewardItemsHTML(m.drops.map(d=>d[0]),Object.fromEntries(m.drops)):'',mkind(m)==='dungeon'&&(m.loot||[]).length?`보물상자 ${lootText(m)}`:''].filter(Boolean);return parts.length?`<p class="muted" style="margin-top:8px;font-size:13px">획득할 수 있는 아이템: ${parts.join(' · ')}</p>`:'';})()}
          <p class="faint" style="font-size:12px;margin-top:6px">직접 행동을 1회 이상 확정한 참가자만 보상 대상입니다. 패배해도 경험치와 아이템을 잃지 않습니다.${{party:` 데일리 파티 레이드는 출발할 때 하루 ${RAID_MAX}회 중 1회를 씁니다.`,weekly:' 주간 토벌 보상은 매주 월요일 05:00 초기화 · 주 1회입니다.',event:' 이벤트 보스는 출현 중에만 입장할 수 있고, 보상은 출현마다 1회 · 1.5배입니다.'}[mkind(m)]||''}</p></div>
      </div>
      <div class="stack" style="gap:16px">
        <div class="panel"><h3>참가 조건</h3>
          <div class="checks">
            <div><span class="mk ${lr?'reason':'ok-t'}">${lr?'✕':'✓'}</span><span>${lr?esc(lr):`레벨 · LV${S.me.level} 충족`}</span></div>
            <div><span class="mk ok-t">✓</span><span>내 역할 · ${ROLE[myRole]} (${JOBS[S.me.job].name})</span></div>
            ${busy?`<div><span class="mk reason">!</span><span class="reason">${esc(busy)}</span></div>`:''}
          </div></div>
        <div class="panel"><h3>파티 만들기</h3>
          <div class="stack">
            <label class="row"><span class="muted" style="font-size:12.5px;width:64px">파티명</span><input type="text" id="mk-name" maxlength="16" placeholder="${esc(S.me.name)}의 파티" value="${esc(mk.name||'')}" style="flex:1"></label>
            <div class="row"><span class="muted" style="font-size:12.5px;width:64px">공개 범위</span><div class="seg">${[['public','공개 모집'],['invite','초대 전용']].map(([k,l])=>`<button data-act="mkset" data-k="vis" data-v="${k}" aria-pressed="${vis===k}">${l}</button>`).join('')}</div></div>
            <div class="row"><span class="muted" style="font-size:12.5px;width:64px">목표 인원</span><div class="seg">${range(m.min,m.max).map(n=>`<button data-act="mkset" data-k="target" data-v="${n}" aria-pressed="${tgt===n}">${n}</button>`).join('')}</div></div>
            <button class="btn btn-primary" data-act="createparty" data-id="${m.id}" ${lr||busy?'disabled':''}>파티 만들기</button>
          </div></div>
        <div class="panel"><h3>모집 파티 참가</h3><div class="list" data-recruits-mon="${m.id}">${recruitRows(rs,true)}</div></div>
        <div class="panel"><h3>랜덤 매칭</h3><p class="muted" style="font-size:13px">같은 몬스터 · 같은 목표 인원을 고른 대기자 중 탱커 · 딜러 · 힐러 조건을 만족하는 조합을 찾습니다. 기다리는 동안 퀘스트를 진행할 수 있습니다.</p>
          <div class="row" style="margin-top:10px"><button class="btn" data-act="queue" data-id="${m.id}" ${lr||busy?'disabled':''}>목표 ${tgt}인으로 매칭 시작</button></div></div>
      </div></div></div>`;
}
function range(a,b){const r=[];for(let i=a;i<=b;i++)r.push(i);return r;}

function vParty(){
  syncMercs(S.party);const p=S.party,c=partyCheck(p),m=c.m;const meLeader=p.leader===S.me.name;const me=p.members.find(x=>x.isMe);
  const slots=[...p.members.map(x=>`<div class="slot">${sigil(x.job,'sm')}<div class="t"><b>${esc(x.name)}</b>${x.name===p.leader?' <span class="chip dim">파티장</span>':''}${x.merc?' <span class="chip merc">용병</span>':''}<div class="row" style="gap:4px;margin-top:3px">${roleChip(x.job)}<span class="chip num ${levelOk(m,x.level)?'dim':'bad'}">LV${x.level}</span>${x.ready?'<span class="chip ok">준비</span>':'<span class="chip dim">대기</span>'}</div></div>${meLeader&&!x.isMe?`<button class="btn btn-sm btn-ghost" data-act="kick" data-name="${esc(x.name)}" aria-label="${esc(x.name)} 내보내기">내보내기</button>`:''}</div>`)];
  const left=p.target-p.members.length;
  for(let i=0;i<left;i++)slots.push(`<div class="slot empty-slot"><div class="t">빈 자리${i<sumR(c.need)?` · ${missText(c.need)} 필요`:' · 자유'}</div></div>`);
  const inviteList=meLeader&&left>0?idleBots().filter(b=>!(p.invites||[]).some(x=>x.name===b.name)).sort((a,b)=>(isFriend(b.name)-isFriend(a.name))||b.level-a.level):[];
  return `<div class="wrap page">
    <div class="page-head"><div><h2>${esc(p.name||m.name+' 파티')}<small class="en">Party</small></h2><p>${esc(m.name)} · ${p.visibility==='public'?'공개 모집':'초대 전용'} · 목표 ${p.target}명 · 파티장 ${esc(p.leader)}</p></div>
      <div class="row"><button class="btn btn-ghost" data-act="leaveparty">파티 나가기</button></div></div>
    ${p.changed?`<div class="errs">운영자가 이 몬스터의 참가 조건을 변경했습니다. 바뀐 조건: LV${m.level}+, ${m.min}~${m.max}명, ${missText(m.roles)}. ${meLeader?'확인 후 다시 준비해 주세요.':'파티장이 확인하는 중입니다.'} ${meLeader?'<button class="btn btn-sm" data-act="ackchange">조건 확인</button>':''}</div>`:''}
    <div class="split-r">
      <div class="stack" style="gap:16px">
        <div class="panel"><h3>파티원 <span class="num" style="letter-spacing:0">${p.members.length}/${p.target}</span></h3><div class="slots">${slots.join('')}</div></div>
        <div class="panel"><h3>출발 조건</h3><div class="checks">
          ${chk(c.countOk,`인원 ${c.count}명 (${m.min}~${m.max}명)`)}
          ${chk(c.rolesOk,c.rolesOk?'역할 조건 충족':`역할 부족 · ${missText(c.need)}`)}
          ${chk(!c.badLv.length,c.badLv.length?`레벨 미달 · ${c.badLv.map(x=>x.name).join(', ')}`:`전원 LV${m.level} 이상`)}
          ${chk(c.allReady,c.allReady?'전원 준비 완료':`준비 대기 · ${p.members.filter(x=>!x.ready).map(x=>x.name).join(', ')}`)}
        </div>
        <div class="row" style="margin-top:14px"><button class="btn ${me.ready?'btn-ghost':'btn-primary'}" data-act="ready">${me.ready?'준비 취소':'준비 완료'}</button>
          ${meLeader?`<button class="btn btn-primary" data-act="depart" ${c.ok?'':'disabled'}>출발</button>`:`<span class="muted" style="font-size:13px">${c.ok?'곧 파티장이 출발합니다…':'조건이 갖춰지면 파티장이 출발합니다.'}</span>`}
          ${meLeader?`<div class="seg" style="margin-left:auto">${[['public','공개'],['invite','초대 전용']].map(([k,l])=>`<button data-act="setvis" data-v="${k}" aria-pressed="${p.visibility===k}">${l}</button>`).join('')}</div>`:''}</div></div>
        ${meLeader&&left>0?mercPanel(p,m,c):''}
        ${meLeader&&left>0?`<div class="panel"><h3>직접 초대 <span class="faint" style="letter-spacing:0;text-transform:none;font-weight:400">로비에 있는 접속자</span></h3>
          ${(p.invites||[]).length?`<p class="muted" style="font-size:13px;margin-bottom:8px">응답 대기: ${p.invites.map(x=>esc(x.name)).join(', ')}</p>`:''}
          <div class="list">${inviteList.slice(0,10).map(b=>{const r=levelReason(m,b.level)||slotReason(m,p.members,roleOf(b.job),p.target);return `<div class="li"><div class="t"><b>${esc(b.name)}</b><small>${JOBS[b.job].name} · LV${b.level}${r?' · '+esc(r):''}</small></div><button class="btn btn-sm" data-act="invite" data-name="${esc(b.name)}" ${r?'disabled':''}>초대</button></div>`;}).join('')||'<p class="empty">초대할 수 있는 접속자가 없습니다.</p>'}</div></div>`:''}
      </div>
      <div>${chatPanel({lock:'party'})}</div>
    </div></div>`;
}
function chk(ok,t){return `<div><span class="mk ${ok?'ok-t':'reason'}">${ok?'✓':'✕'}</span><span>${esc(t)}</span></div>`;}

function vQueue(){
  const q=S.queue||{};const m=monster((S.match||q).monsterId);
  const pool=idleBots().filter(b=>levelOk(m,b.level));
  const cnt={tank:0,dps:0,heal:0};pool.forEach(b=>cnt[roleOf(b.job)]++);
  const need=missingRoles(m,[roleOf(S.me.job)]);
  const short=Object.keys(need).filter(r=>need[r]>cnt[r]);
  return `<div class="wrap page"><div class="page-head"><div><h2>랜덤 매칭<small class="en">Matching</small></h2><p>${esc(m.name)} · 목표 ${(S.match||q).target}명 · 내 역할 ${ROLE[roleOf(S.me.job)]}</p></div>
    ${S.queue?`<button class="btn btn-ghost" data-act="cancelqueue">매칭 취소</button>`:''}</div>
    <div class="split-r"><div class="stack" style="gap:16px">
      <div class="panel"><h3>대기 상태</h3>
        <div class="row" style="gap:28px;align-items:flex-end"><div><div class="muted" style="font-size:12px">대기 시간</div><div class="timer" data-qtime>${S.queue?fmtDur(now()-q.since):'—'}</div></div>
        ${['tank','dps','heal'].map(r=>`<div><div class="muted" style="font-size:12px">${ROLE[r]} 대기</div><div class="num" style="font-size:20px;color:var(--${r})">${cnt[r]}명</div></div>`).join('')}</div>
        ${short.length?`<p class="reason" style="margin-top:12px">${short.map(r=>`${ROLE[r]}(${r==='tank'?'디펜더 계열':r==='dps'?'인파이터·메이지·슈터 계열':'프리스트 계열'})가 부족합니다 · 필요 ${need[r]}명, 대기 ${cnt[r]}명`).join(' / ')}. 필수 역할은 생략하지 않으며, 대기자가 생기면 자동으로 매칭됩니다.</p>`:`<p class="muted" style="margin-top:12px;font-size:13px">조건을 만족하는 조합을 찾는 중입니다. 기다리는 동안 다른 메뉴로 이동해도 대기열이 유지됩니다.</p>`}
      </div>
      <div class="panel"><h3>매칭 규칙</h3><ul style="margin:0;padding-left:18px;font-size:13px;color:var(--muted);display:flex;flex-direction:column;gap:4px">
        <li>오래 기다린 사람을 먼저 묶고, 같은 순서끼리는 무작위로 고릅니다.</li>
        <li>매칭이 성사되면 ${cfg().acceptSeconds}초 안에 참가를 수락해야 합니다.</li>
        <li>거절하거나 시간이 지나면 대기열에서 빠집니다. 수락한 사람은 대기 순서를 유지합니다.</li></ul></div>
    </div><div>${chatPanel()}</div></div></div>`;
}

/* ───────── 전투 화면 ───────── */
function vFight(){
  if(S.battle&&S.battle.grid&&!S.battle.over)return vGridFight();
  return `<div class="wrap page"><div class="arena ${S.battle&&S.battle.grid?'grid-arena':''}"><div id="fightmain" class="stack" style="gap:16px">${fightMain()}</div>
    <div class="stack" style="gap:16px"><div class="panel"><h3>전투 로그 <span class="faint" style="letter-spacing:0;text-transform:none;font-weight:400">읽기 전용</span></h3><div class="log" id="blog">${logHTML()}</div></div>
    ${S.battle&&S.battle.solo?'':S.battle&&S.battle.grid?chatPanel({lock:'raid'})+`<div class="panel" id="dmgrank">${dmgRank(S.battle)}</div>`:chatPanel({lock:'party'})}</div></div></div>`;
}
function logHTML(){return S.battle.log.slice(-160).map(l=>`<div class="${l.t}">${esc(l.text)}</div>`).join('');}
/* 몬스터 그림 / 대사(옛 영웅 보스 HERO_LINES): 전투 중엔 이번 턴 대사(첫 턴은 첫 대사), 승리 후엔 마지막 말.
   대사는 '다음 행동' 칸 위에 같은 모양의 붉은 칸(.tele.say)으로 */
function monSayText(b){const H=HERO_LINES[b.monsterId||b.mon.id];if(!H)return '';
  if(b.over)return b.over==='win'?H.last:'';if(b.heroSay&&b.heroSay.turn===b.turn)return b.heroSay.text;return b.turn===1?H.say[0]:'';}
function monSayHTML(b){const t=(monSayText(b)||'').trim();if(!t)return '';const paren=/^\(.*\)$/s.test(t);  /* (지문)은 따옴표 없이 */
  return `<div class="tele say" role="status">${esc(paren?t:`“${t}”`)}</div>`;}
function monArtHTML(b,win){return `<div class="mon-art"><pre class="ascii" ${b.over?`style="opacity:${win?.35:1}"`:''}>${esc(ART[b.mon.art]||ART.generic)}</pre></div>`;}
function fightMain(){
  const b=S.battle,m=b.mon,me=b.players.find(p=>p.isMe);
  if(b.over)return outcomeHTML(b);
  if(b.grid)return '';
  const tel=b.tel;
  const left=Math.max(0,Math.ceil((b.deadline-now())/1000));
  const sup=supActive(b)?b.players.find(p=>p.id===b.sup.by):null;
  const dps=b.players.filter(p=>p.role==='dps').reduce((a,p)=>a+p.dealt,0);
  return `<div class="panel"><div class="boss">${monArtHTML(b)}<div class="stack" style="gap:8px">
      <div class="row" style="justify-content:space-between"><span class="mname">${esc(m.name)}</span><span class="num muted">${m.hp} / ${m.maxHp}</span></div>
      <div class="bar hp big"><i style="width:${pct(m.hp,m.maxHp)}%"></i></div>
      <div class="row" style="gap:6px"><span class="chip num">${b.turn}턴</span><span class="chip num">공격 ${m.atk}</span>${m.poison?`<span class="chip heal">중독 ${m.poison.dmg}·${m.poison.turns}턴</span>`:''}${m.burn?`<span class="chip dps">화상 ${m.burn.dmg}·${m.burn.turns}턴</span>`:''}${m.weaken?`<span class="chip tank">의욕감소 ${m.weaken}턴</span>`:''}</div>
      ${monSayHTML(b)}
      <div class="tele ${tel.type==='aoe'?'aoe':''}"><b>다음 행동</b> · ${esc(telText(b))}</div>
      ${sup?`<p class="muted" style="font-size:12.5px">제압 중 · ${esc(sup.name)} (딜러 총 ${dps} / 유지 한도 ${Math.max(1,sup.dealt)*b.sup.mult} · ${b.sup.mult}배)</p>`:''}
    </div></div></div>
    <div class="panel"><h3>파티 <span class="faint" style="letter-spacing:0;text-transform:none;font-weight:400">방어·보호·지원 스킬 먼저, 이후 행운 순</span></h3><div class="fighters">${b.order.map(id=>fighterCard(b,b.players.find(p=>p.id===id))).join('')}</div></div>
    <div class="panel cmdbar">${me.dead?`<p class="muted">전투 불능 상태입니다. 프리스트 계열의 신세이어로 부활할 수 있습니다. 이번 전투에서 직접 행동한 기록이 있으면 승리 보상을 받습니다.</p>`:actionPanel(b,me)}
    <div class="row" style="justify-content:space-between;margin-top:14px;border-top:1px solid var(--rule);padding-top:12px">
      <span class="muted" style="font-size:12.5px">확정 ${living(b).filter(p=>p.confirmed).length}/${living(b).length} · 전원 확정 또는 시간 종료 시 처리</span>
      <span class="timer ${left<=10?'low':''}" data-timer>${left}초</span></div></div>`;
}
const BUFFN={roar:'포효',berserk:'광전사',takedown:'테이크다운',smoke:'연막',blind:'블라인드',carnage:'대학살',backslider:'타락자',eternal:'이터널',execution:'처형',null:'대미지 무효',ember:'화염 공명'};
function fighterCard(b,p){
  const T=b.turn,st=[];
  if(p.dead)st.push('<span class="chip bad">쓰러짐</span>');
  if(supActive(b)&&b.sup.by===p.id)st.push('<span class="chip tank">제압</span>');
  if(p.protect||(b.sanct&&!p.dead))st.push('<span class="chip ok">보호</span>');
  if(p.poison)st.push(`<span class="chip bad">${esc(p.poison.name)} ${p.poison.turns}</span>`);
  if(p.hot)st.push(`<span class="chip heal">블레스 ${p.hot.turns}</span>`);
  if(p.bound>0)st.push(`<span class="chip warn">빛의 속박 ${p.bound}</span>`);
  if(canDouble(p,b))st.push('<span class="chip dps">연사</span>');
  if(p.obTurn===T)st.push('<span class="chip dps">오버 버닝 가능</span>');
  p.buffs.filter(x=>x.from<=T&&x.to>=T).forEach(x=>st.push(`<span class="chip dps">${BUFFN[x.k]||x.k}</span>`));
  const conf=p.dead?'':p.confirmed?'<span class="chip ok">확정</span>':'<span class="chip dim">선택 중</span>';
  const targeted=b.tel&&b.tel.type!=='aoe'&&b.tel.target===p.id;
  return `<div class="fighter ${p.isMe?'me':''} ${p.dead?'dead':''} ${targeted?'targeted':''}">
    <div class="nm"><b>${esc(p.name)}</b>${conf}</div>
    <div class="row" style="gap:4px">${roleChip(p.job)}<span class="chip num dim">LV${p.level}</span></div>
    <div class="bar hp"><i style="width:${pct(p.hp,p.maxHp)}%"></i></div>
    <div class="vals num"><span>HP ${p.hp}/${p.maxHp}</span></div><ul class="statline num sm">${statIcon('atk',p.atk)}${statIcon('def',p.def)}${statIcon('luk',p.luk)}</ul>
    <div class="st">${targeted?'<span class="chip warn">예고 대상</span>':''}${st.join('')}</div></div>`;
}
function actOpt(b,me,k,a,primary){
  const s=SKILLS[k];const err=checkAct(b,me,{kind:'skill',skill:k,target:s.target==='dead'?(b.players.find(x=>x.dead)||{}).id:me.id},hooks.hasItem,primary);
  const sel=a&&a.kind==='skill'&&a.skill===k;
  return `<button class="opt" data-act="pickact" data-kind="skill" data-skill="${k}" ${primary?'data-second="1"':''} aria-pressed="${!!sel}" ${err&&!(s.target==='ally'&&err==='대상이 유효하지 않음')?'disabled':''}>
    <span>${s.name} <span class="faint" style="font-size:11px">${s.en}</span></span><span class="row" style="gap:3px">${skillBadges(k,me,b)}</span><small>${esc(s.desc)}</small>${err&&err!=='대상이 유효하지 않음'?`<small class="reason">${esc(err)}</small>`:''}</button>`;
}
function targetPick(b,a,second){
  const s=a&&a.kind==='skill'?SKILLS[a.skill]:null;
  const needAlly=(s&&s.target==='ally');
  const needDead=s&&s.target==='dead';
  if(!needAlly&&!needDead)return s&&(s.target==='enemy')?`<p class="muted" style="font-size:13px">대상 · ${esc(b.mon.name)}</p>`:'';
  const me=b.players.find(p=>p.isMe);const far=p=>b.grid&&s&&s.type==='heal'&&me&&p.pos!=null&&cheb(me.pos,p.pos)>HEAL_R;
  return `<div><div class="ph">대상 선택${b.grid&&s&&s.type==='heal'?' <span class="faint" style="font-weight:400;font-size:11.5px">회복 사거리 5×5</span>':''}</div><div class="row">${b.players.filter(p=>needDead?p.dead:!p.dead).map(p=>`<button class="btn btn-sm ${a.target===p.id?'btn-primary':''}" data-act="picktarget" data-id="${esc(p.id)}" ${second?'data-second="1"':''} ${far(p)?'disabled title="회복 사거리 밖"':''}>${esc(p.name)} <span class="num" style="opacity:.75">${p.hp}/${p.maxHp}</span></button>`).join('')||'<span class="muted">대상이 없습니다</span>'}</div></div>`;
}
function actionPanel(b,me){
  const sk=CLASSES[me.job].skills.filter(k=>!(SKILLS[k].lv&&me.level<SKILLS[k].lv));
  if(me.confirmed){
    return `<div class="row" style="justify-content:space-between"><div><div class="ph" style="margin:0 0 4px">행동 확정</div><p style="color:var(--silver)">${esc(actLabel(b,me.action))}${me.action2?' · 연사 '+esc(actLabel(b,me.action2)):''}</p></div><button class="btn" data-act="editact">행동 수정</button></div>`;
  }
  if(me.bound>0)return `<div class="acts"><p class="reason">빛의 속박 · ${me.bound}턴 동안 어떤 스킬도 쓸 수 없습니다.</p><div class="row"><button class="btn btn-primary" data-act="confirmdefend">방어 확정</button></div></div>`;
  const a=S.sel.act||{kind:'skill',skill:basicSkill(me.job)};
  const tab=S.sel.actTab||'attack';
  let opts='';
  if(b.grid&&tab==='defend')tab='skill';
  if(b.grid&&tab==='attack')opts=actOpt(b,me,basicSkill(me.job),a);
  else if(b.grid&&tab==='skill'){opts=sk.filter(k=>k!==basicSkill(me.job)&&!['addon','passive'].includes(SKILLS[k].type)).map(k=>actOpt(b,me,k,a)).join('')+`<button class="opt" data-act="pickact" data-kind="defend" aria-pressed="${a.kind==='defend'}"><span>방어</span><small>이번 턴 받는 대미지 50% 감소 · 가장 먼저 처리</small></button>`;}
  else if(tab==='attack')opts=sk.filter(k=>SKILLS[k].type==='dice'||(SKILLS[k].type==='nodice'&&SKILLS[k].target==='enemy')).map(k=>actOpt(b,me,k,a)).join('');
  else if(tab==='skill'){
    opts=sk.filter(k=>['support','heal'].includes(SKILLS[k].type)||(SKILLS[k].type==='nodice'&&SKILLS[k].target!=='enemy')).map(k=>actOpt(b,me,k,a)).join('');
    if(!b.grid)opts+=['potion','holywater'].map(k=>{const n=S.me.inv[k]||0;return `<button class="opt" data-act="pickact" data-kind="item" data-item="${k}" aria-pressed="${a.kind==='item'&&a.item===k}" ${n?'':'disabled'}><span>${ITEMS[k].name} <span class="num faint">×${n}</span></span><small>${ITEMS[k].desc}</small></button>`;}).join('');
  }else opts=`<button class="opt" data-act="pickact" data-kind="defend" aria-pressed="${a.kind==='defend'}"><span>방어</span><small>이번 턴 받는 대미지 50% 감소 · 가장 먼저 처리</small></button>`;
  const addons=sk.filter(k=>SKILLS[k].type==='addon');
  const isDice=a.kind==='skill'&&SKILLS[a.skill]&&SKILLS[a.skill].type==='dice';
  const addonHTML=tab==='attack'&&addons.length?`<div><div class="ph">함께 사용 · 특수</div><div class="row">${addons.map(k=>{const ad=SKILLS[k];const left=usesLeft(me,k);const ok=isDice&&left>0&&(!ad.with||ad.with.includes(a.skill));
    const armed=a.addon===k||S.sel.addonArm===k;const ok2=left>0&&(!isDice||!ad.with||ad.with.includes(a.skill));return `<button class="btn btn-sm ${armed?'btn-primary':''}" data-act="pickaddon" data-skill="${k}" ${ok2?'':'disabled'} title="${esc(ad.desc)}">${ad.name}${armed?' ✓':''}</button>`;}).join('')}<span class="faint" style="font-size:12px;align-self:center">먼저 켜 두고 공격 스킬을 누르세요</span></div><p class="faint" style="font-size:12px;margin-top:6px">${addons.map(k=>`${SKILLS[k].name}: ${esc(SKILLS[k].desc)}`).join('<br>')}</p></div>`:'';
  const passive=sk.filter(k=>SKILLS[k].type==='passive').map(k=>`<p class="faint" style="font-size:12px">패시브 · ${SKILLS[k].name}: ${esc(SKILLS[k].desc)}</p>`).join('');
  let second='';
  if(canDouble(me,b)){
    const a2=S.sel.act2;
    second=`<div class="result"><div class="ph">연사 · 추가 행동</div><div class="opts">${sk.filter(k=>['dice','support','heal','nodice'].includes(SKILLS[k].type)).map(k=>actOpt(b,me,k,a2,a)).join('')}</div>${a2?targetPick(b,a2,true):''}</div>`;
  }
  const needT=(x)=>x&&((x.kind==='skill'&&SKILLS[x.skill]&&['ally','dead'].includes(SKILLS[x.skill].target)));
  const valid=!(needT(a)&&!a.target)&&!(S.sel.act2&&needT(S.sel.act2)&&!S.sel.act2.target);
  const aerr=b.grid&&a.kind==='skill'&&SKILLS[a.skill]&&SKILLS[a.skill].target==='enemy'?checkAct(b,me,a,hooks.hasItem):null;
  /* 일반 전투의 두 번째 탭은 보조 스킬 + 아이템: 보조 스킬이 없는 클래스는 '아이템', 있으면 '보조·아이템' */
  const supN=b.grid?0:sk.filter(k=>['support','heal'].includes(SKILLS[k].type)||(SKILLS[k].type==='nodice'&&SKILLS[k].target!=='enemy')).length;
  return `<div class="acts"><div class="acttabs">${(b.grid?[['attack','기본 공격'],['skill','스킬']]:[['attack','공격'],['skill',supN?'보조·아이템':'아이템'],['defend','방어']]).map(([k,l])=>`<button class="btn" data-act="acttab" data-tab="${k}" aria-pressed="${tab===k}">${l}</button>`).join('')}</div>
    <div class="opts">${opts}</div>${addonHTML}${targetPick(b,a)}${passive}${second}
    <div class="row">${(()=>{const me2=b.players.find(p=>p.isMe);return me2&&me2.confirmed?'<span class="chip ok">행동 반영됨</span>':'<span class="chip dim">스킬이나 행동을 누르면 바로 반영됩니다</span>';})()}<span class="muted" style="font-size:12.5px">선택: ${esc(actLabel(b,a))}${S.sel.act2?' · 연사 '+esc(actLabel(b,S.sel.act2)):''}</span></div></div>`;
}
function actLabel(b,a){
  if(!a)return '-';
  if(a.kind==='defend')return '방어';
  const t=a.target?b.players.find(p=>p.id===a.target):null;
  if(a.kind==='item')return `${ITEMS[a.item].name}${t?' → '+t.name:''}`;
  const s=SKILLS[a.skill];if(!s)return '-';
  const ad=a.addon?` + ${SKILLS[a.addon].name}`:'';
  return s.target==='enemy'?`${s.name}${ad} → ${b.mon.name}`:['ally','dead'].includes(s.target)?`${s.name} → ${t?t.name:'대상 미선택'}`:s.name;
}
function outcomeHTML(b){
  const r=b.result||{};const win=b.over==='win';const ctx=b.ctx||{};
  const back={quest:'퀘스트로 돌아가기',field:'탐색으로 돌아가기'}[ctx.type]||'레이드로 돌아가기';
  if(ctx.type==='mass')return `<div class="panel outcome">${monArtHTML(b,win)}<h2>${win?'만신전 성공':'만신전 실패'}</h2>
    <p class="muted">${win?`${b.players.length}인 원정대가 ${esc(b.mon.name)}을(를) ${b.turn}턴 만에 쓰러뜨렸습니다.`:`${esc(b.mon.name)}을(를) 쓰러뜨리지 못했습니다. 이번 이벤트는 종료되었습니다.`}</p>${monSayHTML(b)}
    ${r.eligible?`<div class="result" style="min-width:min(380px,100%)"><div class="ph" style="justify-content:center;margin-bottom:8px">${win?'참여 + 처치 보상':'참여 보상'}</div>${rewardHTML({exp:r.exp,gold:r.gold,items:r.items})}${r.ups?`<p class="ok-t" style="margin-top:6px">레벨 업 · LV${S.me.level}</p>`:''}${wearNowHTML(r.items)}</div>`:'<p class="reason">직접 행동을 제출하지 않아 보상 대상에서 제외되었습니다.</p>'}
    <button class="btn btn-primary" data-act="leavebattle">${back}</button></div>`;
  if(ctx.type==='quest')return `<div class="panel outcome">${monArtHTML(b,win)}<h2>${win?'승리':'패배'}</h2>
    <p class="muted">${win?`${esc(b.mon.name)}을(를) 쓰러뜨렸습니다. 퀘스트로 돌아가 이야기를 이어 가세요.`:'쓰러졌습니다. 같은 단계에서 다시 도전할 수 있습니다.'}</p>${monSayHTML(b)}<button class="btn btn-primary" data-act="leavebattle">${back}</button></div>`;
  return `<div class="panel outcome">${monArtHTML(b,win)}
    <h2>${win?'승리':b.over==='abandon'?'전투 종료':'패배'}</h2>
    <p class="muted">${win?`${esc(b.mon.name)}을(를) ${b.turn}턴 만에 쓰러뜨렸습니다.`:b.over==='abandon'?'모든 참가자의 연결이 5분 넘게 끊겨 전투가 종료되었습니다. 보상은 지급되지 않습니다.':(b.solo?'쓰러졌습니다.':'파티가 전멸했습니다.')+' 경험치와 아이템은 잃지 않습니다.'}</p>${monSayHTML(b)}${r.blocked?`<p class="reason">${esc(r.blocked)}</p>`:''}
    ${win?(r.eligible?`<div class="result" style="min-width:min(380px,100%)"><div class="ph" style="justify-content:center;margin-bottom:8px">내 보상</div>${rewardHTML({exp:r.exp,gold:r.gold,items:r.items})}${r.ups?`<p class="ok-t" style="margin-top:6px">레벨 업 · LV${S.me.level}</p>`:''}${wearNowHTML(r.items)}</div>`:(r.blocked?'':`<p class="reason">이번 전투에서 직접 행동을 확정하지 않아 보상 대상에서 제외되었습니다.</p>`)):''}
    <button class="btn btn-primary" data-act="leavebattle">${back}</button></div>`;
}
function dmgRank(b){const L=b.players.slice().sort((x,y)=>y.dealt-x.dealt||x.name.localeCompare(y.name,'ko'));const top=Math.max(1,L[0]?L[0].dealt:1);const tot=L.reduce((a,p)=>a+p.dealt,0);
  return `<h3>대미지 순위 <span class="num faint" style="letter-spacing:0;font-weight:400">총 ${tot.toLocaleString('ko-KR')}</span></h3><ol class="drank">${L.map((p,i)=>`<li class="${p.isMe?'me':''} ${p.dead?'dead':''}"><span class="dr-n num">${i+1}</span><button class="who w-${p.role}" data-act="g-tok" data-id="${esc(p.id)}">${esc(p.name)}</button><span class="dr-bar"><i class="${p.role}" style="width:${pct(p.dealt,top)}%"></i></span><b class="num">${p.dealt.toLocaleString('ko-KR')}</b></li>`).join('')}</ol>`;}
function autoConfirm(){
  const b=S.battle;if(!b||b.over||b.grid)return false;const me=b.players.find(p=>p.isMe);if(!me||me.dead)return false;const a=S.sel.act;if(!a||a.kind==='none')return false;
  const needT=x=>x&&x.kind==='skill'&&SKILLS[x.skill]&&['ally','dead'].includes(SKILLS[x.skill].target);
  if(needT(a)&&!a.target)return false;
  if(canDouble(me,b)){const a2=S.sel.act2;if(!a2||(needT(a2)&&!a2.target))return false;}
  me.confirmed=false;ACTS.confirmact();if(me.confirmed){S.sel.addonArm=null;}return true;
}
let DMG_SNAP=null;
function dmgFx(){
  const b=S&&S.battle;if(!b||!b.grid){DMG_SNAP=null;return;}const me=b.players.find(p=>p.isMe);if(!me)return;
  const cur={id:b.id,turn:b.turn,dealt:me.dealt||0,hp:me.hp};
  if(DMG_SNAP&&DMG_SNAP.id===b.id&&cur.turn!==DMG_SNAP.turn){
    const out=cur.dealt-DMG_SNAP.dealt,inn=DMG_SNAP.hp-cur.hp;const L=[];
    if(out>0)L.push(['out',`${out.toLocaleString('ko-KR')}`,'보스에게 입힌 피해']);
    if(inn>0)L.push(['in',`-${inn.toLocaleString('ko-KR')}`,'받은 피해']);
    if(L.length)showDmg(L);
  }
  DMG_SNAP=cur;
}
function showDmg(L){
  let box=document.getElementById('dmgfx');if(!box){box=document.createElement('div');box.id='dmgfx';box.setAttribute('aria-live','polite');document.body.appendChild(box);}
  L.forEach(([k,v,l],i)=>{const el=document.createElement('div');el.className='dfx '+k;el.style.animationDelay=(i*0.22)+'s';el.innerHTML=`<b>${v}</b><small>${l}</small>`;box.appendChild(el);setTimeout(()=>el.remove(),1900+i*220);});
}
function renderFight(){
  dmgFx();
  if(S.battle&&S.battle.grid&&$('#gf-top')){if(!S.battle.over){gridParts();renderTop();return;}render();return;}
  const fm=$('#fightmain');if(!fm||!S.battle)return;
  fm.innerHTML=fightMain();{const dr=$('#dmgrank');if(dr&&S.battle.grid)dr.innerHTML=dmgRank(S.battle);}
  const lg=$('#blog');if(lg){lg.innerHTML=logHTML();lg.scrollTop=lg.scrollHeight;}
  renderTop();
}

/* ───────── 캐릭터 ───────── */
function vChar(){
  const me=S.me,c=CLASSES[me.job];
  const flags=Object.keys(S.flags).filter(k=>S.flags[k]);
  const invAll=Object.entries(me.inv).filter(([k,n])=>n>0&&ITEMS[k]);const icat=S.sel.invCat||'equip';const catOf=k=>ITEMS[k].type==='equip'?'equip':ITEMS[k].rod?'use':ITEMS[k].type==='mat'?'mat':ITEMS[k].type==='deco'?'deco':'use';const inv=invAll.filter(([k])=>catOf(k)===icat);
  const eqIds=Object.values(me.equip||{});
  const ctab=['equip','craft'].includes(S.sel.ctab)?S.sel.ctab:'info';
  return `<div class="wrap page"><div class="page-head"><div><h2>캐릭터<small class="en">Character</small></h2></div></div>
    <div class="qtabs ctabs" role="tablist">${[['info','정보'],['equip','장비'],['craft','공방']].map(([k,l])=>`<button role="tab" data-act="ctab" data-tab="${k}" aria-selected="${ctab===k}">${l}</button>`).join('')}</div>
    ${ctab==='craft'?`<div class="stack" style="gap:16px">${craftPanel()}${commPanel()}</div>`:ctab==='info'?`<div class="char-top"><div class="panel ctop-img">${portraitHTML(true)}</div>${userInfo()}</div>
    <div class="stack" style="gap:16px"><div class="bond-row">${bondsPanel()}<div class="stack" style="gap:16px">${shelfPanel()}${aquaPanel()}</div></div><div class="panel fold"><button class="fold-head" data-act="togglerec" aria-expanded="${!!S.sel.recOpen}"><span class="ph" style="margin:0">${hTitle('quill','탐사 기록')} <span class="chip num" style="letter-spacing:0">${flags.length}</span></span><span class="fold-ic" aria-hidden="true"></span></button><div class="fold-body" ${S.sel.recOpen?'':'hidden'}>${flags.length?recordsHTML(flags):'<p class="empty" style="padding:0">아직 남긴 기록이 없습니다.</p>'}</div></div></div>`:`<div class="stack" style="gap:16px"><div class="panel"><h3>${hTitle('swords','장착 중인 장비')}</h3><div class="eqlist">${Object.keys(SLOT).map(sl=>{const id=me.equip[sl];const it=ITEMS[id];
        if(!it)return `<div class="eqrow empty"><span class="eq-sl">${SLOT[sl]}</span><span class="eq-n faint">비어 있음</span></div>`;
        const open=S.sel.eqOpen===sl;
        return `<div class="eqitem ${open?'open':''}"><button class="eqrow" data-act="eq-toggle" data-slot="${sl}" aria-expanded="${open}"><span class="eq-sl">${SLOT[sl]}</span><span class="eq-n">${itemNameH(id)}<span class="eq-dura ${dura(id)===0?'broken':dura(id)<=Math.ceil(DURA_MAX*0.2)?'low':''}" title="내구도">${dura(id)===0?'파손':'내구도 '+dura(id)+'/'+DURA_MAX}</span></span><span class="fold-ic" aria-hidden="true"></span></button>
          ${open?`<div class="eqdet"><img src="${ITEM_IMG}" alt=""><div class="invd-t"><span class="bpill eqb sm" style="align-self:flex-start">${statText(itemStats(id,enhOf(id)))}</span><p>${esc(it.desc)}</p><small class="faint">강화 +${enhOf(id)} / ${ENH_MAX}</small>
            <div class="row"><button class="btn btn-sm btn-primary" data-act="enh-open" data-id="${id}">강화</button><button class="btn btn-sm" data-act="unequip" data-slot="${sl}">해제</button></div></div></div>`:''}</div>`;}).join('')}</div></div>
      
      <div class="panel"><h3>${hTitle('box','인벤토리')} <span class="faint num" style="letter-spacing:0;font-weight:400">${Math.min(inv.length,30)}/30</span></h3>
        <div class="mtabs invtabs" role="tablist">${[['equip','장비'],['use','소모품'],['mat','재료'],['deco','장식품']].map(([k,l])=>`<button role="tab" data-act="inv-cat" data-cat="${k}" aria-selected="${icat===k}">${l} <span class="num faint">${invAll.filter(([x])=>catOf(x)===k).length}</span></button>`).join('')}</div>
        <div class="invgrid" role="list">${Array.from({length:30},(_,x)=>{const e=inv[x];if(!e)return '<div class="invcell empty" role="listitem"></div>';const [k,n]=e;const it=ITEMS[k];const eq=it.type==='equip';const on=eqIds.includes(k);
          return `<button class="invcell ${on?'on':''} ${eq?'eqp':'use'}" role="listitem" data-act="inv-sel" data-id="${k}" aria-pressed="${S.sel.invSel===k}" title="${esc(it.name)} ×${n} · ${eq?SLOT[it.slot]+' · '+statText(it.stats)+' · ':typeLabel(it)+' · '}${esc(it.desc)}${eq?(on?' · 눌러서 해제':' · 눌러서 착용'):''}" aria-label="${esc(it.name)} ${n}개${on?' 착용 중':''}${shelfCount(k)?' 장식 중':''}">${it.icon?`<span class="ic-svg">${it.icon}</span>`:`<img src="${ITEM_IMG}" alt="">`}${n>1?`<span class="ic-n num">${n}</span>`:''}${on?'<span class="ic-on">E</span>':''}${shelfCount(k)?'<span class="ic-deco">장식 중</span>':''}${enhOf(k)?`<span class="ic-enh num">+${enhOf(k)}</span>`:''}</button>`;}).join('')}</div>
      ${invDetail(inv,eqIds)}</div>
      <div class="panel"><h3>${hTitle('bolt','스킬')} <span class="faint num" style="letter-spacing:0;font-weight:400">${c.skills.length}</span></h3>${skillTabs()}</div></div>`}</div>`;
}
const SPARK=`<svg class="spark" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 .8c.5 3.6 1.6 5.6 6.4 7.2-4.8 1.6-5.9 3.6-6.4 7.2-.5-3.6-1.6-5.6-6.4-7.2C6.4 6.4 7.5 4.4 8 .8z" fill="currentColor"/><circle cx="13.4" cy="2.8" r="1" fill="currentColor"/></svg>`;
function skillTabs(){
  const me=S.me,cur=me.job,c=CLASSES[cur];const base=c.tier===1?cur:c.base;
  const advs=c.tier===1?CLASSES[base].adv:[cur];const keys=[base,...advs];
  const sel=keys.includes(S.sel.skTab)?S.sel.skTab:cur;
  const B=CLASSES[base].skills;
  const list=sel===base?B:CLASSES[sel].skills.filter(k=>!B.includes(k));
  const note=sel===base?(c.tier===1?'현재 클래스의 스킬입니다.':'전직 전 클래스의 스킬입니다. 전직 후에도 대부분 그대로 이어집니다.')
    :(c.tier===1?`LV${cfg().jobAdvanceLevel}에 ${CLASSES[sel].name}(으)로 전직하면 새로 얻는 스킬입니다.`:'전직하면서 새로 얻은 스킬입니다.');
  return `<div class="mtabs sktabs" role="tablist">${keys.map(k=>`<button role="tab" data-act="sk-tab" data-tab="${k}" aria-selected="${sel===k}">${CLASSES[k].name}</button>`).join('')}</div>
    <p class="sk-note faint">${note}</p><div class="sklist ${sel!==cur&&c.tier===1&&sel!==base?'locked':''}" role="list">${list.map(k=>skillRow(k)).join('')}</div>`;
}
function skillRow(k){const sk=SKILLS[k];
  return `<div class="invd skd ${sk.special?'sp':''}" role="listitem"><img src="${skillImg(k)}" alt=""><div class="invd-t"><div class="row" style="gap:6px"><b>${esc(sk.name)}</b><span class="faint" style="font-size:12px">(${esc(sk.en)})</span></div>
    <div class="row" style="gap:4px">${skillBadges(k)}</div>
    <p>${esc(sk.desc)}</p>
    ${sk.cond?`<div class="skcond"><span class="skcond-l">조건</span><ol>${sk.cond.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></div>`:''}</div></div>`;}
function skillDetail(c){
  const k=c.skills.includes(S.sel.skSel)?S.sel.skSel:null;
  if(!k)return `<p class="inv-hint faint">스킬을 누르면 설명이 여기에 나옵니다.</p>`;
  const sk=SKILLS[k];
  return `<div class="invd skd"><img src="${skillImg(k)}" alt=""><div class="invd-t"><div class="row" style="gap:6px"><b>${esc(sk.name)}</b><span class="faint" style="font-size:12px">(${esc(sk.en)})</span></div>
    <div class="row" style="gap:4px">${skillBadges(k)}</div>
    <p>${esc(sk.desc)}</p>
    ${sk.cond?`<div class="skcond"><span class="skcond-l">조건</span><ol>${sk.cond.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></div>`:''}</div></div>`;
}
function invDetail(inv,eqIds){
  const k=S.sel.invSel;const e=inv.find(([x])=>x===k);
  if(!e)return `<p class="inv-hint faint">아이템을 누르면 상세 설명이 여기에 나옵니다.</p>`;
  const [,n]=e,it=ITEMS[k],eq=it.type==='equip',on=eqIds.includes(k);
  return `<div class="invd">${it.icon?`<span class="deco-ic">${it.icon}</span>`:`<img src="${ITEM_IMG}" alt="">`}<div class="invd-t"><div class="row" style="gap:6px"><b>${itemNameH(k)}</b>${it.tag?`<span class="chip deco-tag">${it.tag}</span>`:''}${shelfCount(k)?'<span class="chip deco-on">장식 중</span>':''}<span class="faint num" style="font-size:12px">×${n}</span>${on?'<span class="chip warn">착용 중</span>':''}</div>
    <small class="faint">${eq?SLOT[it.slot]+(enhOf(k)?` · 강화 +${enhOf(k)}`:''):typeLabel(it)}</small>
    ${eq?`<span class="bpill eqb sm" style="align-self:flex-start">${statText(itemStats(k,enhOf(k)))}</span>`:''}
    <p>${esc(it.desc)}</p>${it.type==='deco'&&decoSrcText(k)?`<small class="sh-src">${esc(decoSrcText(k))}</small>`:''}${reqText(it)?`<small class="${itemBlock(k)?'reason':'faint'}">${esc(reqText(it))}</small>`:''}
    <div class="row">${eq?`<button class="btn btn-sm ${on?'':'btn-primary'}" data-act="${on?'unequip':'equip'}" data-id="${k}" data-slot="${it.slot}">${on?'해제':'착용'}</button><button class="btn btn-sm" data-act="enh-open" data-id="${k}">강화</button>`:((it.buff||it.letter||it.readText||it.jobChange)?`<button class="btn btn-sm btn-primary" data-act="inv-use" data-id="${k}">${it.letter||it.readText?'읽기':'사용'}</button>`:it.type==='deco'?(n-shelfCount(k)>0?`<button class="btn btn-sm btn-primary" data-act="shelf-put" data-id="${k}">장식장에 올리기</button>`:'')+(shelfCount(k)?`<button class="btn btn-sm" data-act="shelf-off" data-id="${k}">장식장에서 내리기</button>`:''):'')}<button class="btn btn-sm btn-ghost" data-act="inv-sel" data-id="">닫기</button></div></div></div>`;
}
function eqBreak(k){const L=Object.entries(S.me.equip||{}).map(([sl,id])=>{const v=itemStats(id,enhOf(id))[k];return v?`${itemName(id)} (${SLOT[sl]}) ${v>0?'+':''}${v}`:null;}).filter(Boolean);return L.length?L.join('\n'):'이 능력치를 올려 주는 장비가 없습니다';}
function ibBreak(k){const t=now();return ((S.me.itemBuffs)||[]).filter(b=>b.until>t&&b.stat===k).map(b=>`${ITEMS[b.src]?ITEMS[b.src].name:'아이템'} +${b.val} · ${Math.ceil((b.until-t)/60000)}분 남음`).join('\n');}
function enhOf(id){return (S.me.enh||{})[id]||0;}
function itemName(id){const l=enhOf(id);return ITEMS[id]?ITEMS[id].name+(l?` +${l}`:''):id;}
const SKILL_ICON_MAP={attack:'attack',save:'save',save2:'save',crimehazard:'crime',forestaller:'fore'};
function skillImg(k){return SKILL_IMG[SKILL_ICON_MAP[k]]||SKILL_IMG.attack;}
function itemNameH(id){const l=enhOf(id);return ITEMS[id]?esc(ITEMS[id].name)+(l?` <span class="enhp">+${l}</span>`:''):esc(id);}
function itemBonus(k){const t=now();return ((S.me&&S.me.itemBuffs)||[]).filter(b=>b.until>t&&b.stat===k).reduce((a,b)=>a+b.val,0);}
function botBonds(name){
  const r=seedRnd('bonds'+name);const types=Object.keys(BOND);const others=S.bots.filter(x=>x.name!==name);const n=Math.floor(r()*4);const out=[];const used=new Set();
  const mine=bondOf(name);if(mine)out.push([S.me.name,mine.type,mine.since||now()]);
  for(let i=0;i<n&&others.length;i++){const o=others[Math.floor(r()*others.length)];if(used.has(o.name))continue;used.add(o.name);let t=types[Math.floor(r()*types.length)];if(t==='lover'&&out.some(x=>x[1]==='lover'))t='friend';out.push([o.name,t,now()-Math.floor(r()*120+3)*86400000]);}
  return out;}
function vProfile(){
  const name=S.sel.viewUser;const p=bot(name);
  if(!p)return `<div class="wrap page"><div class="panel"><p class="empty">${esc(name||'')}님의 정보를 찾을 수 없습니다.</p><button class="btn btn-sm" data-act="nav" data-route="main">돌아가기</button></div></div>`;
  const st=statsFor(p.job,p.level,{});const tt=botTitle(name);const k=botStatus(p);const memo=botMemo(name);const b=bondOf(name);
  const row=(a,v)=>`<div class="ui-row"><dt>${a}</dt><dd>${v}</dd></div>`;
  const statRow=x=>`<div class="ui-row"><dt><span class="si si-${x} inl">${ICON[x]}</span> ${STATK[x]}</dt><dd><div class="ui-stat num"><b>${st[x]}</b></div>${x==='maxHp'?`<div class="bar hp" style="margin-top:6px"><i style="width:100%"></i></div>`:''}</dd></div>`;
  const decoN=hashN(name)%3;const sh=Array.from({length:SHELF_N},(_,i)=>i<decoN?'snowglobe':null);
  return `<div class="wrap page ro-page"><div class="page-head"><div><h2>캐릭터<small class="en">Character</small></h2></div></div>
    <div class="ro-bar"><button class="btn btn-sm btn-ghost" data-act="nav" data-route="${S.sel.viewBack||'main'}"><span aria-hidden="true">←</span> 돌아가기</button><span class="ro-tag">🔒 ${esc(name)}님의 캐릭터 · 읽기 전용</span></div>
    <div class="qtabs ctabs" role="tablist">${[['info','정보'],['equip','장비'],['craft','공방']].map(([x,l])=>`<button role="tab" aria-selected="${x==='info'}" ${x==='info'?'':'disabled title="다른 유저의 정보 탭만 볼 수 있습니다"'}>${l}${x==='info'?'':' 🔒'}</button>`).join('')}</div>
    <div class="char-top"><div class="panel ctop-img"><div class="portrait big">${p.portrait?`<img src="${p.portrait}" alt="">`:`<div class="ph-empty ${jobCls(p.job)}"><span class="ph-glyph">${CLASSES[p.job].sigil}</span><span class="ph-cls">${CLASSES[p.job].en}</span></div>`}</div></div>
      <div class="panel ctop-info"><dl class="uinfo-list">
        ${row('이름',`<b style="color:var(--silver)">${esc(name)}</b>`)}${row('클래스',roleChip(p.job))}${row('칭호',tt?`<span class="tn-s tc-${tt.cat}">${esc(tt.name)}</span>`:'<span class="faint">없음</span>')}
        ${row('레벨',`<span class="lv num">LV ${p.level}</span>`)}${row('상태',statusChip(k))}${row('한줄메모',memo?esc(memo):'<span class="faint">없음</span>')}
        ${['maxHp',st.pk||'atk','def','luk'].map(statRow).join('')}${b?row('나와의 관계',bondChip(name)):''}</dl></div></div>
    <div class="bond-row"><div class="panel"><h3>${hTitle('star','관계')} <span class="faint num" style="letter-spacing:0;font-weight:400">${botBonds(name).length}</span></h3><div class="list">${botBonds(name).map(([n,t,since])=>{const q=n===S.me.name?null:bot(n);return `<div class="brow2 ro">${q?sigil(q.job,'sm'):n===S.me.name?sigil(S.me.job,'sm'):''}<span class="bt"><span class="bchip" style="--bc:${BOND[t].c}">${BOND[t].n}</span><b>${esc(n)}</b>${n===S.me.name?' <span class="chip dim">나</span>':''}</span><span class="faint num" style="margin-left:auto;font-size:11.5px">${bondDate(since)}부터</span></div>`;}).join('')||'<p class="empty">맺은 관계가 없습니다.</p>'}</div></div>
      <div class="panel"><h3>${hTitle('spark','장식장')} <span class="faint num" style="letter-spacing:0;font-weight:400">${decoN}/${SHELF_N}</span></h3><div class="shelf">${sh.map(x=>x?`<div class="sh-slot on" data-tip="${esc(ITEMS[x].name)}" tabindex="0">${ITEMS[x].icon}</div>`:'<div class="sh-slot ro"></div>').join('')}</div></div></div></div>`;
}
function userInfo(){
  const me=S.me,st=myStats(),base=statsFor(me.job,me.level,{});
  const need=expNeed(me.level),cap=me.level>=cfg().levelCap,p=cap?100:pct(me.exp,need),left=Math.max(0,need-me.exp);
  const row=(k,v)=>`<div class="ui-row"><dt>${k}</dt><dd>${v}</dd></div>`;
  const statRow=k=>{const eq=st[k]-base[k];const ib=itemBonus(k);return `<div class="ui-row"><dt><span class="si si-${k} inl">${ICON[k]}</span> ${STATK[k]}</dt><dd><div class="ui-stat num"><b>${st[k]+ib}</b><span class="ui-base" tabindex="0" data-tip="기본 ${STATK[k]}" aria-label="기본 ${STATK[k]} ${base[k]}">${base[k]}</span>${eq?`<span class="bpill eqb" tabindex="0" data-tip="${esc(eqBreak(k))}" aria-label="장비 보너스 ${eq}">${eq>0?'+':''}${eq}</span>`:''}${ib?`<span class="bpill itb" tabindex="0" data-tip="${esc(ibBreak(k))}" aria-label="아이템 보너스 ${ib}">${ib>0?'+':''}${ib}</span>`:''}</div>${k==='maxHp'?(()=>{const mx=st.maxHp+ib,p=hpNow(),cur=Math.round(mx*p);return `<div class="hpgauge ${p<HP_WARN?'low':''}" role="img" aria-label="HP ${cur} / ${mx}"><i style="width:${Math.round(p*100)}%"></i><span class="num">${cur} / ${mx}</span></div>`;})():''}</dd></div>`;};
  return `<div class="panel ctop-info"><dl class="uinfo-list">
    ${row('이름',S.sel.nameEdit?`<form class="ui-nameedit" data-form="rename"><input type="text" id="rn-name" maxlength="10" value="${esc(me.name)}" aria-label="새 이름 (2~10자)"><button class="btn btn-sm btn-primary" type="submit">저장</button><button class="btn btn-sm btn-ghost" type="button" data-act="rn-cancel">취소</button></form>`:`<span class="row" style="gap:6px"><b class="ui-name">${esc(me.name)}</b><button class="ibtn sm" data-act="rn-start" data-tip="이름 수정" aria-label="이름 수정">${TICON.pen}</button></span>`)}
    ${row('클래스',`<span class="row" style="gap:8px">${roleChip(me.job)}${CLASSES[me.job].tier===1&&me.level>=cfg().jobAdvanceLevel?'<button class="btn btn-sm" data-act="adv-open">전직</button>':''}</span>`)}
    ${row('칭호',titleChip())}
    ${row('레벨',`<div class="ui-lv"><span class="lv num">LV ${me.level}</span><div class="xpwrap" tabindex="0" aria-label="경험치 ${cap?'최대':`현재 ${me.exp}, 남은 ${left}`}"><div class="bar xp"><i style="width:${p}%"></i></div><div class="tip num" role="tooltip">${cap?'최대 레벨':`${me.exp.toLocaleString('ko-KR')} / 남은 ${left.toLocaleString('ko-KR')}`}</div></div><span class="num" style="font-size:12px;color:var(--xp)">${cap?'MAX':p.toFixed(1)+'%'}</span></div>`)}
    ${['maxHp',st.pk||'atk','def','luk'].map(statRow).join('')}
    ${row('보유 골드',goldHTML(me.gold))}
  </dl></div>`;
}
function advPanel(){
  const me=S.me,c=CLASSES[me.job],lv=cfg().jobAdvanceLevel;
  if(c.tier===2)return `<div class="panel"><h3>전직</h3><p><b style="color:var(--silver)">${className(me.job)}</b> <span class="muted">· ${CLASSES[c.base].name}에서 전직 완료</span></p><p class="muted" style="font-size:13px;margin-top:4px">${c.desc}</p></div>`;
  const ok=me.level>=lv;const busy=busyReason();const pickd=S.sel.advPick;
  return `<div class="panel"><h3>전직 ${ok?'<span class="chip warn">가능</span>':`<span class="chip dim">LV${lv}부터</span>`}</h3>
    <p class="muted" style="font-size:13px;margin-bottom:12px">${c.name}은(는) LV${lv}에 아래 ★ 상위 클래스 중 하나로 전직할 수 있습니다. 기존 스킬은 유지되고(세이브는 세이브 Ⅱ로 강화) 새 스킬과 능력치 보너스를 얻습니다. 전직은 되돌릴 수 없습니다.</p>
    <div class="advs">${c.adv.map(k=>{const a=CLASSES[k];const news=a.skills.filter(x=>!c.skills.includes(x));return `<div class="adv ${pickd===k?'on':''}">
      <div class="row" style="gap:10px">${sigil(k,'sm')}<div><b style="color:var(--silver);font-family:var(--f-display);font-size:16px">★ ${a.name}</b> <span class="faint" style="font-size:12px">${a.en}</span></div></div>
      <p class="muted" style="font-size:12.5px">${a.desc}</p>
      <p style="font-size:12.5px">새 스킬 · ${news.map(x=>SKILLS[x].name+(SKILLS[x].special?'(특수)':'')).join(', ')}</p>
      <p class="num faint" style="font-size:12px">능력치 · ${statText(Object.fromEntries(Object.entries(a.bonus).map(([k2,v])=>[k2==='hp'?'maxHp':k2,v])))}</p>
      ${pickd===k?`<div class="row"><span class="reason" style="font-size:12.5px">${a.name}(으)로 전직합니다. 되돌릴 수 없습니다.</span><button class="btn btn-sm btn-primary" data-act="advconfirm" data-job="${k}">전직 확정</button><button class="btn btn-sm btn-ghost" data-act="advcancel">취소</button></div>`
      :`<button class="btn btn-sm" data-act="advpick" data-job="${k}" ${ok&&!busy?'':'disabled'}>${a.name}(으)로 전직</button>`}</div>`;}).join('')}</div>
    ${busy&&ok?`<p class="reason" style="margin-top:8px">${esc(busy)} · 파티와 전투가 끝난 뒤 전직할 수 있습니다.</p>`:''}</div>`;
}
function statText(s){return Object.entries(s||{}).map(([k,v])=>`${STATK[k]||k} ${v>0?'+':''}${v}`).join(' · ');}

/* ───────── 친구 ───────── */
function vFriends(){
  const fr=Object.entries(S.rel);
  const friends=fr.filter(([,v])=>v==='friend').map(([k])=>bot(k)).filter(Boolean).sort((a,b)=>b.online-a.online);
  const inc=fr.filter(([,v])=>v==='in').map(([k])=>k),out=fr.filter(([,v])=>v==='out').map(([k])=>k),blk=fr.filter(([,v])=>v==='blocked').map(([k])=>k);
  const others=S.bots.filter(b=>!S.rel[b.name]);
  return `<div class="wrap page"><div class="page-head"><div><h2>친구<small class="en">Friends</small></h2><p>서로 친구 요청을 수락한 사람끼리만 귓속말을 주고받을 수 있습니다. 오프라인 친구에게 보낸 귓속말은 다음 접속 때 전달됩니다.</p></div></div>
    <div class="split-r"><div class="stack" style="gap:16px">
      ${inc.length?`<div class="panel"><h3>받은 친구 요청</h3><div class="list">${inc.map(n=>{const b=bot(n);return `<div class="li"><div class="t"><b>${esc(n)}</b><small>${JOBS[b.job].name} · LV${b.level}</small></div><div class="row"><button class="btn btn-sm btn-primary" data-act="fr-accept" data-name="${esc(n)}">수락</button><button class="btn btn-sm btn-ghost" data-act="fr-decline" data-name="${esc(n)}">거절</button></div></div>`;}).join('')}</div></div>`:''}
      <div class="panel"><h3>친구 <span class="num" style="letter-spacing:0">${friends.length}</span></h3><div class="list">${friends.length?friends.map(b=>`<div class="li"><div class="row" style="gap:10px;flex:1;min-width:0">${sigil(b.job,'sm')}<div class="t"><b>${esc(b.name)}</b> <span class="dot ${b.online?'':'off'}"></span><small>${JOBS[b.job].name} · LV${b.level} · ${b.online?{lobby:'로비',recruit:'모집 중',battle:'전투 중'}[b.status]:'오프라인'}${S.unread.whisper[b.name]?` · 새 귓속말 ${S.unread.whisper[b.name]}`:''}</small></div></div>
        <div class="row"><button class="btn btn-sm" data-act="whisper" data-name="${esc(b.name)}">귓속말</button><button class="btn btn-sm btn-ghost" data-act="fr-remove" data-name="${esc(b.name)}">해제</button><button class="btn btn-sm btn-ghost btn-danger" data-act="fr-block" data-name="${esc(b.name)}">차단</button></div></div>`).join(''):'<p class="empty">아직 친구가 없습니다.</p>'}</div></div>
      ${out.length?`<div class="panel"><h3>보낸 요청</h3><div class="list">${out.map(n=>`<div class="li"><div class="t"><b>${esc(n)}</b><small>${bot(n)&&bot(n).online?'응답 대기':'상대가 오프라인 · 접속하면 응답'}</small></div><button class="btn btn-sm btn-ghost" data-act="fr-remove" data-name="${esc(n)}">취소</button></div>`).join('')}</div></div>`:''}
      <div class="panel"><h3>블레서 찾기</h3><div class="list">${others.map(b=>`<div class="li"><div class="t"><b>${esc(b.name)}</b> <span class="dot ${b.online?'':'off'}"></span><small>${JOBS[b.job].name} · LV${b.level}</small></div><div class="row"><button class="btn btn-sm" data-act="fr-request" data-name="${esc(b.name)}">친구 요청</button><button class="btn btn-sm btn-ghost btn-danger" data-act="fr-block" data-name="${esc(b.name)}">차단</button></div></div>`).join('')||'<p class="empty">모든 블레서와 관계를 맺었습니다.</p>'}</div></div>
      ${blk.length?`<div class="panel"><h3>차단 목록</h3><div class="list">${blk.map(n=>`<div class="li"><div class="t"><b>${esc(n)}</b><small>귓속말과 전체 채팅 메시지가 보이지 않습니다</small></div><button class="btn btn-sm btn-ghost" data-act="fr-remove" data-name="${esc(n)}">차단 해제</button></div>`).join('')}</div></div>`:''}
    </div><div>${chatPanel({lock:'whisper',tall:true})}</div></div></div>`;
}

/* ───────── 세계관 ───────── */
function vLore(){
  const tab=['now','world','class'].includes(S.sel.ltab)?S.sel.ltab:'now';
  return `<div class="wrap page"><div class="page-head"><div><h2>세계관<small class="en">World</small></h2><p>현실의 미래 사회와 가상현실 게임 속 판타지가 겹치는 이야기. 플레이 화면은 게임 속 세계를 중심으로 펼쳐집니다.</p></div></div>
  <div class="qtabs ltabs" role="tablist">${[['now','현재'],['world','세계관'],['class','클래스']].map(([k,l])=>`<button role="tab" data-act="ltab" data-tab="${k}" aria-selected="${tab===k}">${l}</button>`).join('')}</div>
  <div class="panel lore-panel">${tab==='now'?`<div class="lore lore-now"><p class="">때는 2051년 여름, 세계적인 게임 제작 기업 AK Adventures에서 언어의 장벽을 허물고 세계 최초로 전 세계 동시 서비스가 되는 신작 가상 현실 게임 &lt;Bleset Saga&gt;를 공개한다.</p><p class="">이제까지 없었던 유형의 가상 현실 MMORPG 블레셋 전기는 51년 9월 오픈 직후 가파른 상승세를 보이며 단숨에 차트 1위를 차지하고 단 한 번도 1위에서 내려오지 않았다.</p><p class="">많은 유저들의 환호와 기대 속에 블레셋 전기는 2052년 8월, 1년만에 대규모 업데이트를 발표했고 신 대륙과 신규던전 등을 오픈했다.</p><p class="">또한 업데이트와 동시에 총 상금 2억 달러 상당의 '신규 던전 타임어택 토너먼트'를 개최할 예정이라고 하여, 많은 유저들이 눈에 불을 켜고 함께 할 팀원을 찾아나섰다.</p><p class="">이때 당시 블레셋 전기의 길드 1위, 2위를 앞다투던 '컨빨(컨트롤빨)' 길드와 '템빨(아이템빨)'길드가 협력하여 신규 던전 타임어택에 나섰고 많은 랭커들이 신규 던전, '백야의 신전' 클리어에 나섰다.</p><p class="">그러나 무슨 일인지, 대규모 오류가 발생하여 해당 공대는 타임어택에 참여하지 못하고, 백야의 신전 이벤트 역시 알 수 없는 이유로 종료. 유저 보상과 함께 블레셋 전기는 기약없는 운영 보수에 들어간다.</p><p class="now-mark">그리고 2년 뒤, 2054년 현재.</p><p class="">블레셋 전기가 운영 보수를 마치고 다시 신규 유저를 모집을 시작했다.</p></div>`:tab==='world'?`<div class="wq-wrap"><section class="wq" id="wv-laniakea"><div class="wq-l"><blockquote class="wq-q">“태초의 혼돈이<br>일곱 번째 나팔을 불어<br>세계의 종말을<br>예고하였다.”</blockquote></div><div class="wq-r"><p class="wq-g">수많은 신들의 축복을 받은 땅, 라니아케아</p><p>라니아케아는 수많은 고대 신들과 그들의 사자들이 축복을 내린 풍요와 평화의 상징이었다.</p><p>그러나 태초의 혼돈이 일곱 번째 나팔을 불어 세계의 종말을 예고하였고, 각 도시에 세워진 신전들에선 고대 신의 약속에 의거하여 그들의 평화를 지켜줄 이방인을 부르기 시작했다.</p></div></section><section class="wq" id="wv-blesser"><div class="wq-l"><blockquote class="wq-q">“이방인들의 사명은<br>혼돈 속에서<br>이 세계를 지키는 것.”</blockquote></div><div class="wq-r"><p class="wq-g">축복받은 자, 블레서</p><p>이방인들은 용사, 혹은 블레서라고 불리우며 라니아케아의 생명체들의 비호를 받게된다.</p><p>대륙의 부름에 답한 이방인들은 그들의 선택에 따라 각기 다른 신들의 축복의 힘을 부여하여 혼돈과 맞설 수 있게 도와주었다.</p></div></section><section class="wq" id="wv-blasphemia"><div class="wq-l"><blockquote class="wq-q">“혼돈의 계시를 따라<br>불현듯 나타난<br>저주받은 땅.”</blockquote></div><div class="wq-r"><p class="wq-g">신들에게 버림받은 땅, 블라스파미아</p><p>종말이 다가옴에 따라 대륙 근처에서는 새로운 땅이 나타났다.</p><p>라니아케아와는 정반대로 척박한 이 땅에선 생명체라고는 기이하게 변이된 몬스터만이 발견되었다. 그 몬스터들은 대륙의 몬스터보다 강했고, 거대했으며, 사악한 힘을 사용하였다.</p></div></section><section class="wq" id="wv-temple"><div class="wq-l"><blockquote class="wq-q">“그 지하 신전에<br>발을 들인 자들은<br>다시 돌아오지<br>못 하였으니”</blockquote></div><div class="wq-r"><p class="wq-g">고대 혼돈의 신이 잠든 관, 백야의 신전</p><p>블라스파미아로 떠난 대륙의 탐사대는 부서진 수많은 신전들 사이에서 고대의 혼돈이 잠들어있을 것으로 추정되는 지하 신전을 발견하였다.</p><p>라니아케아의 신들은 그들의 축복받은 이방인들에게 그 신전을 봉인하여 태초의 혼돈이 부르는 종말의 서곡을 멈추어주길 부탁하였다.</p></div></section><section class="wq" id="wv-region"><div class="wq-l"><blockquote class="wq-q">“블레서는<br>워프게이트를 따라<br>마을과 마을 사이를<br>오간다.”</blockquote></div><div class="wq-r"><p class="wq-g">대륙의 지역</p><p>대륙은 혹한의 땅, 바위의 땅, 소금의 땅, 초원의 땅, 작열의 땅, 늪의 땅으로 나뉘고, 어느 날 갑자기 나타난 신대륙 블라스파미아가 그 너머에 있다. 블레서는 워프게이트로 마을 사이를 오가며 던전과 탐험 지역에 도전한다.</p>
      <details class="skilllist"><summary>워프게이트 <span class="faint">${WORLD.gates.length}곳</span></summary><div class="list">${WORLD.gates.map(([n,r,d])=>`<div class="li" style="align-items:flex-start"><div class="t"><b>${n}</b> <span class="faint" style="font-size:11.5px">${r}</span><small>${d}</small></div></div>`).join('')}</div></details>
      <details class="skilllist"><summary>던전 <span class="faint">${WORLD.dungeons.length}곳</span></summary><div class="list">${WORLD.dungeons.map(([n,lv,ppl,q,d])=>`<div class="li" style="align-items:flex-start"><div class="t"><b>${n}</b> <span class="chip num dim">LV${lv}+</span> <span class="chip num dim">${ppl}인</span><small style="color:var(--steel-hi);font-family:var(--f-display);margin-top:4px">“${q}”</small><small>${d}</small></div></div>`).join('')}</div></details>
      <details class="skilllist"><summary>탐험 지역 <span class="faint">${WORLD.fields.length}곳</span></summary><div class="list">${WORLD.fields.map(([n,lv,d])=>`<div class="li" style="align-items:flex-start"><div class="t"><b>${n}</b> <span class="chip num dim">LV${lv}+</span><small>${d}</small></div></div>`).join('')}</div></details></div></section></div>`:`<div class="lore">
    <section><h3>클래스와 전직</h3><p>블레서는 다섯 기본 클래스 가운데 하나로 여정을 시작하고, LV${cfg().jobAdvanceLevel}에 ★ 상위 클래스로 전직한다. 전직하면 기존 스킬을 이어받고 새 스킬을 얻는다. [특수] 스킬은 레이드마다 사용 횟수가 정해져 있다.</p>
      <div class="tree">${Object.entries(CLASSES).filter(([,c])=>c.tier===1).map(([k,c])=>`<div class="tree-row"><div class="tree-base">${sigil(k,'sm')}<div><b>${c.name}</b><small>${c.en} · ${ROLE[c.role]} · ${c.range}</small></div></div><div class="tree-arrow" aria-hidden="true">→</div><div class="tree-adv">${c.adv.map(a=>`<span class="chip ${c.role}">★ ${CLASSES[a].name} <span class="faint">${CLASSES[a].en}</span></span>`).join('')}</div></div>`).join('')}</div></section>
    <section><h3>전투 규칙</h3><p>공격 대미지는 공격력(디펜더·인파이터 계열) 또는 마력(메이지·슈터·프리스트 계열)에 판정(80~120% 무작위)을 곱한 값이 기본이 된다. 스킬의 추가 대미지와 연계 대미지는 공격력·마력에 대한 비율로 더해지며, 연계 대미지는 직전 턴에 연계 대상 스킬을 썼을 때만 붙는다. 모든 공격 스킬은 크리티컬이 터질 수 있고(확률 5% + 행운×0.5%, 크리티컬 표시 스킬은 2배), 크리티컬이면 대미지 ×1.5. 받는 대미지는 방어력에 따라 줄어든다(방어 ÷ (방어 + 60)). 회복량은 마력 × 판정 × 40%에 스킬별 보너스가 더해진다.</p>
      <p style="margin-top:10px">디펜더 계열의 제압은 몬스터가 자신을 먼저 노리게 만든다. 딜러가 입힌 총 대미지가 제압한 탱커의 총 대미지의 두 배(두 번째 사용은 네 배, 세 번째는 여섯 배)를 넘거나, 오버 힐이 세 번 이상 일어나면 풀린다. 나이트의 시야 강탈은 제압이 유효할 때만 쓸 수 있다.</p></section>
    <section><h3>스킬 목록</h3>${Object.entries(CLASSES).map(([k,c])=>`<details class="skilllist"><summary>${className(k)} <span class="faint">${c.en}</span></summary><div class="list">${c.skills.filter(x=>c.tier===1||!CLASSES[c.base].skills.includes(x)).map(x=>`<div class="li" style="align-items:flex-start"><div class="t"><b>${SKILLS[x].name}</b> <span class="faint" style="font-size:11.5px">${SKILLS[x].en}</span><small>${esc(SKILLS[x].desc)}</small><div class="row" style="gap:4px;margin-top:4px">${skillBadges(x)}</div></div></div>`).join('')}</div></details>`).join('')}</section>
  </div>`}</div></div>`;
}

/* ───────── 운영자 ───────── */
function vAdmin(){
  const tab=S.sel.adminTab||'monster';
  const tabs=[['monster','몬스터'],['quest','퀘스트'],['mass','만신전'],['items','아이템'],['notice','공지 · 배너'],['config','성장 · 전투 규칙'],['ops','회원 · 운영']];
  const body={monster:adminMonster,quest:adminQuest,mass:adminMass,items:adminItems,notice:adminNotice,config:adminConfig,ops:adminOps}[tab]();
  return `<div class="wrap page"><div class="page-head"><div><h2>운영<small class="en">Admin</small></h2><p>작성 → 검사(미리보기) → 공개 순서로 반영합니다. 수정한 내용은 새 전투부터 적용되고, 이미 시작한 전투는 시작 시 규칙을 유지합니다.</p></div>
    <button class="btn btn-ghost btn-sm" data-act="viewasuser">일반 사용자 시점으로 보기</button></div>
    <div class="adm-move" role="note"><div class="adm-move-t"><b>콘텐츠 편집은 운영 페이지에서</b><p>여기서 바꾼 몬스터 · 퀘스트 · 아이템 · 공지 · 설정은 이 브라우저에만 적용되고, 운영 페이지에 같은 항목이 있으면 그쪽 값이 우선합니다. 모든 플레이어에게 반영하려면 운영 페이지에서 공개하세요.</p></div><a class="btn btn-primary btn-sm" href="/admin.html" target="_blank" rel="noopener">운영 페이지 열기 <span aria-hidden="true">↗</span></a></div>
    <div class="seg">${tabs.map(([k,l])=>`<button data-act="admintab" data-tab="${k}" aria-pressed="${tab===k}">${l}</button>`).join('')}</div>
    ${body}
    <p class="notice-local">시제품은 이 브라우저 안에서만 동작합니다. 실제 배포 시 운영자 권한 확인과 데이터 저장은 서버에서 처리해야 합니다.</p></div>`;
}
const AM_FIELDS=[['kind','분류 (party · weekly · event · field · dungeon · story)','text'],['name','이름','text'],['region','지역','text'],['level','입장 레벨','number'],['maxLevel','최대 레벨 (빈칸=제한 없음)','number'],['min','최소 인원','number'],['max','최대 인원','number'],['target','기본 목표 인원','number'],
  ['roles.tank','탱커 최소','number'],['roles.dps','딜러 최소','number'],['roles.heal','힐러 최소','number'],['hp','HP (최소 인원 기준)','number'],['hpScale','추가 1인당 HP 증가율','number'],['atk','공격력','number'],['def','방어력 (받는 대미지 감소)','number'],
  ['singleName','단일 공격 이름','text'],['singleMult','단일 공격 배율','number'],['aoeName','광역 공격 이름','text'],['aoeMult','광역 배율','number'],['aoeEvery','광역 주기(턴)','number'],['dotName','지속 피해 이름','text'],['dotChance','지속 피해 확률(0~1)','number'],['dotDmg','지속 피해 (턴당 고정)','number'],
  ['exp','보상 EXP','number'],['gold','보상 골드','number']];
const getP=(o,p)=>p.split('.').reduce((a,k)=>a==null?a:a[k],o);
const setP=(o,p,v)=>{const ks=p.split('.');let t=o;ks.slice(0,-1).forEach(k=>t=t[k]);t[ks[ks.length-1]]=v;};
function adminMonster(){
  const ms=S.data.monsters;const id=S.sel.am&&monster(S.sel.am)?S.sel.am:ms[0].id;S.sel.am=id;const m=monster(id);
  const draft=S.sel.amDraft&&S.sel.amDraft.id===id?S.sel.amDraft:clone(m);
  const errs=S.sel.amErrs;
  return `<div class="split"><div class="panel"><h3>몬스터 <button class="link" data-act="am-new">새 몬스터</button></h3><div class="list">${ms.map(x=>`<div class="li clickable" data-act="am-pick" data-id="${x.id}" ${x.id===id?'style="background:var(--slab-2);margin:0 -16px;padding-left:16px;padding-right:16px"':''}><div class="t"><b>${esc(x.name)}</b><small>LV${x.level} · ${x.min}~${x.max}명 · 변경 ${x.rev}회</small></div><span class="chip ${x.published?'ok':'dim'}">${x.published?'공개':'비공개'}</span></div>`).join('')}</div></div>
    <div class="panel"><h3>${esc(m.name)} 설정</h3>
      <form class="form" data-form="am" id="am-form">${AM_FIELDS.map(([k,l,t])=>{const v=getP(draft,k);return `<label>${l}<input type="${t==='number'?'number':'text'}" ${t==='number'?'step="any"':''} id="am-${k.replace('.','-')}" name="${k}" value="${v==null?'':esc(v)}"></label>`;}).join('')}
        <label class="wide">설명<textarea id="am-desc" name="desc" rows="2" style="font-family:var(--f-body);font-size:13px">${esc(draft.desc||'')}</textarea></label>
        <label class="wide">아이템 확률 (아이템ID:확률, 쉼표 구분 · 예: potion:0.5, sword:0.2)<input type="text" id="am-drops" name="drops" value="${esc(draft.drops.map(d=>d.join(':')).join(', '))}"></label>
        <label class="wide" style="flex-direction:row;align-items:center;gap:8px;color:var(--text)"><input type="checkbox" id="am-published" name="published" ${draft.published?'checked':''}> 공개 (전투 메뉴에 표시)</label>
      </form>
      ${errs?(errs.length?`<div class="errs" style="margin-top:12px">${errs.map(e=>`<div>· ${esc(e)}</div>`).join('')}</div>`:`<div class="oks" style="margin-top:12px">검사 통과 · 공개하면 새 전투부터 적용됩니다.</div>`):''}
      ${S.sel.amPreview&&errs&&!errs.length?`<div style="margin-top:12px"><div class="ph">미리보기</div><div class="facts"><div><small>입장</small><b class="num">LV${S.sel.amPreview.level}+</b></div><div><small>인원</small><b class="num">${S.sel.amPreview.min}~${S.sel.amPreview.max}</b></div><div><small>필요 역할</small><b>${missText(S.sel.amPreview.roles)||'없음'}</b></div><div><small>HP(최대 인원)</small><b class="num">${Math.round(S.sel.amPreview.hp*(1+S.sel.amPreview.hpScale*(S.sel.amPreview.max-S.sel.amPreview.min)))}</b></div></div><ul style="margin:10px 0 0;padding-left:18px;font-size:13px;color:var(--muted)">${patternLines(S.sel.amPreview).map(l=>`<li>${esc(l)}</li>`).join('')}</ul></div>`:''}
      <div class="row" style="margin-top:14px"><button class="btn" data-act="am-check">검사 · 미리보기</button><button class="btn btn-primary" data-act="am-publish">저장하고 공개</button><button class="btn btn-ghost" data-act="am-reset">되돌리기</button></div>
      <p class="faint" style="font-size:12px;margin-top:8px">검사 항목: 최소 인원 3명 이상 · 최소 ≤ 최대 · 역할별 최소 인원 합 ≤ 최소 인원 · 목표 인원은 범위 안 · 확률은 0~1</p></div></div>`;
}
function readAmForm(){
  const f=$('#am-form');const d=clone(monster(S.sel.am));
  AM_FIELDS.forEach(([k,,t])=>{const v=f.elements[k].value.trim();setP(d,k,t==='number'?(v===''?null:Number(v)):v);});
  d.desc=f.elements.desc.value.trim();d.published=f.elements.published.checked;
  d.drops=f.elements.drops.value.split(',').map(s=>s.trim()).filter(Boolean).map(s=>{const [k,c]=s.split(':').map(x=>x.trim());return [k,Number(c)];});
  return d;
}
function validateMonster(d){
  const e=[];const n=k=>getP(d,k);
  if(!d.name)e.push('이름을 입력하세요');
  ['level','min','max','target','hp','atk','def','exp','gold','singleMult','aoeMult','aoeEvery','hpScale','dotChance','dotDmg','roles.tank','roles.dps','roles.heal'].forEach(k=>{if(n(k)==null||!isFinite(n(k)))e.push(`${(AM_FIELDS.find(f=>f[0]===k)||[k,k])[1]}: 숫자를 입력하세요`);});
  if(e.length)return e;
  if(!MKIND[d.kind||'party'])e.push('분류는 party · weekly · event · field · dungeon · story 중 하나여야 합니다');
  if(['field','dungeon','story'].includes(d.kind)){if(d.min!==1||d.max!==1)e.push('개인 전투 몬스터는 최소·최대 인원이 1명이어야 합니다');}else if(d.min<3)e.push('최소 인원은 3명 이상이어야 합니다');
  if(d.min>d.max)e.push('최소 인원이 최대 인원보다 클 수 없습니다');
  const rs=d.roles.tank+d.roles.dps+d.roles.heal;
  if(rs>d.min)e.push(`역할별 최소 인원의 합(${rs})이 최소 인원(${d.min})보다 큽니다`);
  if([d.roles.tank,d.roles.dps,d.roles.heal].some(x=>x<0||!Number.isInteger(x)))e.push('역할 인원은 0 이상의 정수여야 합니다');
  if(d.target<d.min||d.target>d.max)e.push('기본 목표 인원은 최소~최대 범위 안이어야 합니다');
  if(d.level<1)e.push('입장 레벨은 1 이상이어야 합니다');
  if(d.maxLevel!=null&&d.maxLevel<d.level)e.push('최대 레벨이 입장 레벨보다 낮습니다');
  if(d.hp<1||d.def<0)e.push('HP는 1 이상, 방어력은 0 이상이어야 합니다');
  if(d.aoeEvery<2)e.push('광역 주기는 2턴 이상이어야 합니다');
  if(d.dotChance<0||d.dotChance>1)e.push('지속 피해 확률은 0~1 사이여야 합니다');if(d.dotDmg<0)e.push('지속 피해는 0 이상이어야 합니다');if(d.atk<1)e.push('공격력은 1 이상이어야 합니다');
  if(d.hpScale<0)e.push('체력 증가율은 0 이상이어야 합니다');
  d.drops.forEach(([k,c])=>{if(!ITEMS[k])e.push(`알 수 없는 아이템: ${k} (사용 가능: ${Object.keys(ITEMS).join(', ')})`);else if(!(c>=0&&c<=1))e.push(`${k}의 확률은 0~1이어야 합니다`);});
  return e;
}
function diff(a,b,prefix=''){
  const out=[];const keys=new Set([...Object.keys(a||{}),...Object.keys(b||{})]);
  keys.forEach(k=>{if(k==='rev')return;const va=a?a[k]:undefined,vb=b?b[k]:undefined;
    if(va&&vb&&typeof va==='object'&&!Array.isArray(va)&&typeof vb==='object'&&!Array.isArray(vb))out.push(...diff(va,vb,prefix+k+'.'));
    else if(JSON.stringify(va)!==JSON.stringify(vb))out.push({field:prefix+k,before:va,after:vb});});
  return out;
}
function logChange(target,changes){if(!changes.length)return;S.changeLog.unshift({ts:now(),who:S.me.name,target,changes});S.changeLog=S.changeLog.slice(0,200);}
function adminQuest(){
  const qs=S.data.quests;const id=S.sel.aq&&quest(S.sel.aq)?S.sel.aq:qs[0].id;S.sel.aq=id;
  const txt=S.sel.aqText!=null&&S.sel.aqFor===id?S.sel.aqText:JSON.stringify(quest(id),null,2);
  const res=S.sel.aqRes;
  return `<div class="split"><div class="panel"><h3>퀘스트 <button class="link" data-act="aq-new">새 퀘스트</button></h3><div class="list">${qs.map(q=>{const e=validateQuest(q,qs);return `<div class="li clickable" data-act="aq-pick" data-id="${q.id}" ${q.id===id?'style="background:var(--slab-2);margin:0 -16px;padding-left:16px;padding-right:16px"':''}><div class="t"><b>${esc(q.title)}</b><small>${q.id} · ${{epic:'에픽',sub:'서브',repeat:'반복'}[q.cat]||q.cat} · LV${q.level}${q.repeat?' · 일일':''}</small></div><span class="chip ${e.length?'bad':q.published?'ok':'dim'}">${e.length?'경로 문제 '+e.length:q.published?'공개':'비공개'}</span></div>`;}).join('')}</div></div>
    <div class="panel"><h3>퀘스트 편집 · JSON</h3>
      <p class="muted" style="font-size:12.5px;margin-bottom:8px">제목(title) · 분류(cat: epic 메인 · sub 서브 · repeat 데일리) · 설명(desc) · 수락 레벨(level) · 선행 퀘스트(prereq) · 열림 조건(cond: {quests:[퀘스트 id], flags:[기록], level, item}) · 반복 주기(repeat) · 시작 단계(start) · 단계(steps: 상황문 text, 선택지 choices[label · result · next · flag · req]) · 전투 단계(battle: 몬스터 id · next · winText) · 완료 단계(end · reward)를 등록합니다. 데일리는 repeat 목록 중 하루 3개가 무작위로 열립니다.</p>
      <textarea id="aq-json" rows="22" spellcheck="false">${esc(txt)}</textarea>
      ${res?(res.errs.length?`<div class="errs" style="margin-top:12px">${res.errs.map(e=>`<div>· ${esc(e)}</div>`).join('')}</div>`:`<div class="oks" style="margin-top:12px">검사 통과 · 모든 단계에 도달할 수 있고 완료 단계가 연결되어 있습니다.${res.preview?`<div style="margin-top:8px;color:var(--text)"><b>${esc(res.preview.title)}</b> · 첫 장면: ${esc((res.preview.steps[res.preview.start]||{}).text||'')}</div>`:''}</div>`):''}
      <div class="row" style="margin-top:12px"><button class="btn" data-act="aq-check">검사 · 미리보기</button><button class="btn btn-primary" data-act="aq-publish">저장하고 공개</button><button class="btn btn-ghost" data-act="aq-reset">되돌리기</button></div></div></div>`;
}
function adminNotice(){
  const evs=activeEvents();
  const evPanel=`<div class="panel"><h3>전광판 이벤트</h3><form class="form" data-form="tk-ev">
      <label>종류<select id="tk-kind">${Object.entries(EVKIND).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label>
      <label>지속 시간(분)<input type="number" id="tk-min" min="1" max="1440" value="30"></label>
      <label class="wide">이름<input type="text" id="tk-title" maxlength="40" placeholder="예) 백야의 신전 봉인 수호자" required></label>
      <label>현재 위치<input type="text" id="tk-loc" maxlength="30" placeholder="예) 녹투성이 호수"></label>
      <label>보상<input type="text" id="tk-reward" maxlength="40" placeholder="예) 경험치·골드 1.5배"></label>
      <label class="wide">바로가기<select id="tk-link"><option value="">없음</option>${S.data.monsters.map(m=>`<option value="monster:${m.id}">몬스터 · ${esc(m.name)}</option>`).join('')}<option value="quest">퀘스트</option><option value="battle">레이드</option></select></label>
      <div class="wide row"><button class="btn btn-primary" type="submit">전광판에 띄우기</button><span class="faint" style="font-size:12px">보스 출현을 몬스터와 연결하면 그 몬스터 레이드의 경험치·골드가 1.5배가 됩니다.</span></div></form>
    <div class="list" style="margin-top:12px">${evs.map(e=>`<div class="li"><div class="t"><b>[${EVKIND[e.kind]}] ${esc(e.title)}</b><small>${esc(e.loc||'')} · ${esc(e.reward||'')} · 남은 ${Math.ceil((e.until-now())/60000)}분</small></div><button class="btn btn-sm btn-ghost btn-danger" data-act="tk-end" data-id="${e.id}">내리기</button></div>`).join('')||'<p class="empty">진행 중인 이벤트가 없습니다. 평소에는 "평화롭습니다."가 표시됩니다.</p>'}</div></div>`;
  return `${evPanel}<div class="split-r"><div class="panel"><h3>공지</h3><form class="stack" data-form="notice"><input type="text" id="nt-title" placeholder="공지 제목" maxlength="60" required><textarea id="nt-text" rows="3" placeholder="공지 내용" style="font-family:var(--f-body);font-size:13px" maxlength="300"></textarea><div><button class="btn btn-primary" type="submit">공지 게시</button></div></form>
      <div class="list" style="margin-top:14px">${S.data.notices.map(n=>`<div class="li"><div class="t"><b>${esc(n.title)}</b><small>${esc(n.date)} · ${esc(n.text)}</small></div><button class="btn btn-sm btn-ghost btn-danger" data-act="nt-del" data-id="${n.id}">내리기</button></div>`).join('')}</div></div></div>`;
}
function adminConfig(){
  const c=cfg();
  return `<div class="panel" style="max-width:720px"><h3>성장 · 전투 규칙</h3><form class="form" id="cf-form" data-form="config">
    <label>레벨 상한<input type="number" id="cf-levelCap" name="levelCap" value="${c.levelCap}"></label>
    <label>경험치 기본값<input type="number" id="cf-expBase" name="expBase" value="${c.expBase}"></label>
    <label>레벨당 증가량<input type="number" id="cf-expStep" name="expStep" value="${c.expStep}"></label>
    <label>가속 계수<input type="number" id="cf-expQuad" name="expQuad" step="0.1" value="${c.expQuad||0}"></label>
    <label>턴 제한 시간(초)<input type="number" id="cf-turnSeconds" name="turnSeconds" value="${c.turnSeconds}"></label>
    <label>매칭 수락 시간(초)<input type="number" id="cf-acceptSeconds" name="acceptSeconds" value="${c.acceptSeconds}"></label>
    <label>전직 가능 레벨<input type="number" id="cf-jobAdvanceLevel" name="jobAdvanceLevel" value="${c.jobAdvanceLevel}"></label>
    <div class="wide"><p class="faint" style="font-size:12px;margin-bottom:10px">현재 공식: 필요 경험치 = ${c.expBase} + ${c.expStep}×(L−1) + ${c.expQuad||0}×(L−1)². LV1→2 ${expNeed(1)}, LV10→11 ${expNeed(10).toLocaleString('ko-KR')}, LV50→51 ${expNeed(50).toLocaleString('ko-KR')}, LV98→99 ${expNeed(98).toLocaleString('ko-KR')}.</p><button class="btn btn-primary" type="submit">저장</button></div></form></div>`;
}
function adminOps(){
  const fmt=t=>new Date(t+9*3600e3).toISOString().slice(5,16).replace('T',' ');
  return `<div class="stack" style="gap:16px">
    <div class="panel"><h3>테스트 도구 · 내 캐릭터</h3><div class="row">
      <label class="row" style="gap:6px"><span class="muted" style="font-size:12.5px">레벨</span><input type="number" id="op-level" min="1" max="${cfg().levelCap}" value="${S.me.level}" style="width:80px"></label><button class="btn btn-sm" data-act="op-level">레벨 설정</button>
      <button class="btn btn-sm" data-act="op-gold">골드 +500</button><button class="btn btn-sm" data-act="op-lv">레벨 +5</button><button class="btn btn-sm" data-act="op-daily">일일 퀘스트 주기 초기화</button><button class="btn btn-sm" data-act="op-items">회복약 · 성수 +3</button></div>
      <div class="row" style="margin-top:12px">${S.sel.confirmReset?`<span class="reason">모든 진행 기록과 운영 설정이 지워집니다.</span><button class="btn btn-sm btn-danger" data-act="op-reset-yes">초기화 확정</button><button class="btn btn-sm btn-ghost" data-act="op-reset-no">취소</button>`:`<button class="btn btn-sm btn-ghost btn-danger" data-act="op-reset">전체 데이터 초기화</button>`}</div></div>
    <div class="panel"><h3>1:1 문의 <span class="num" style="letter-spacing:0">${(S.inquiries||[]).filter(q=>!q.answer).length}</span></h3><div class="list">${(S.inquiries||[]).slice().reverse().map(q=>`<div class="li" style="align-items:flex-start;flex-wrap:wrap"><div class="t"><b>${esc(q.by)}</b> <span class="chip dim">${esc(q.cat)}</span><small style="color:var(--text)">${esc(q.text)}</small>${q.answer?`<small class="ok-t">답변: ${esc(q.answer)}</small>`:''}</div>${q.answer?'<span class="chip ok">답변 완료</span>':`<div class="row" style="width:100%"><input type="text" id="ans-${q.id}" maxlength="300" placeholder="답변 입력" style="flex:1"><button class="btn btn-sm btn-primary" data-act="inq-answer" data-id="${q.id}">답변</button></div>`}</div>`).join('')||'<p class="empty">받은 문의가 없습니다.</p>'}</div></div>
    <div class="panel"><h3>신고 처리 <span class="num" style="letter-spacing:0">${S.reports.filter(r=>!r.done).length}</span></h3><div class="tbl-wrap"><table><thead><tr><th>시각</th><th>대상</th><th>메시지</th><th>상태</th><th></th></tr></thead><tbody>${S.reports.map(r=>`<tr><td class="num">${fmt(r.ts)}</td><td>${esc(r.from)}</td><td>${esc(r.text)}</td><td>${r.done?'<span class="chip dim">처리됨</span>':'<span class="chip warn">대기</span>'}</td><td>${r.done?'':`<button class="btn btn-sm" data-act="rep-done" data-id="${r.id}">처리 완료</button>`}</td></tr>`).join('')||'<tr><td colspan="5" class="muted">신고가 없습니다.</td></tr>'}</tbody></table></div></div>
    <div class="panel"><h3>보상 지급 이력</h3><div class="tbl-wrap"><table><thead><tr><th>시각</th><th>출처</th><th>내용</th><th class="n">EXP</th><th class="n">골드</th><th>아이템</th></tr></thead><tbody>${S.rewardLog.slice(0,40).map(r=>`<tr><td class="num">${fmt(r.ts)}</td><td>${r.source==='battle'?'전투':'퀘스트'}</td><td>${esc(r.label||'')}${r.battleId?` <span class="faint num">${esc(r.battleId)}</span>`:''}</td><td class="n">${r.exp}</td><td class="n">${r.gold}</td><td>${esc(itemsText(r.items))||'—'}</td></tr>`).join('')||'<tr><td colspan="6" class="muted">지급 이력이 없습니다.</td></tr>'}</tbody></table></div></div>
    <div class="panel"><h3>운영 변경 기록</h3><div class="tbl-wrap"><table><thead><tr><th>시각</th><th>변경자</th><th>대상</th><th>변경 전 → 후</th></tr></thead><tbody>${S.changeLog.slice(0,40).map(c=>`<tr><td class="num">${fmt(c.ts)}</td><td>${esc(c.who)}</td><td>${esc(c.target)}</td><td style="font-size:12px">${c.changes.slice(0,8).map(x=>`<div><span class="muted">${esc(x.field)}</span> ${esc(short(x.before))} → <span style="color:var(--silver)">${esc(short(x.after))}</span></div>`).join('')}${c.changes.length>8?`<div class="faint">외 ${c.changes.length-8}건</div>`:''}</td></tr>`).join('')||'<tr><td colspan="4" class="muted">변경 기록이 없습니다.</td></tr>'}</tbody></table></div></div>
  </div>`;
}
function short(v){const s=v===undefined?'(없음)':typeof v==='string'?v:JSON.stringify(v);return s.length>60?s.slice(0,57)+'…':s;}

/* ───────── 모달 ───────── */
function modal(html){$('#modal').innerHTML=html?`<div class="scrim" data-act="closemodal-bg"><div class="modal" role="dialog" aria-modal="true">${html}</div></div>`:'';}
function activity(p){
  if(p.isMe){const m=S.battle?monster(S.battle.monsterId):(S.party||S.queue)?monster((S.party||S.queue).monsterId):null;return {st:p.status,m};}
  if(inMyGroup(p.name)){const g=S.battle||S.party||S.match;return {st:S.battle?'battle':'recruit',m:monster(g.monsterId)};}
  if(p.status==='recruit'){const r=S.recruits.find(x=>x.members.includes(p.name));return {st:'recruit',m:r&&monster(r.monsterId)};}
  if(p.status==='battle'){let m=monster(p.raid);if(!m||!levelOk(m,p.level)){m=pick(S.data.monsters.filter(x=>isGroupMon(x)&&levelOk(x,p.level)))||null;p.raid=m&&m.id;}return {st:'battle',m};}
  return {st:'lobby',m:null};
}
function activityHTML(p){const a=activity(p);
  if(a.st==='battle')return `<span class="act-b"><span class="chip bad">레이드 중</span>${a.m?`<small>${esc(a.m.name)}</small>`:''}</span>`;
  if(a.st==='recruit')return `<span class="act-b"><span class="chip warn">모집 중</span>${a.m?`<small>${esc(a.m.name)}</small>`:''}</span>`;
  return '<span class="chip dim">로비</span>';}
function noteOf(n){return (S.notes&&S.notes[n])||'';}
function noteHTML(n){
  if(S.sel.noteEdit===n)return ` · <span class="note-edit"><input type="text" class="note-in" data-name="${esc(n)}" maxlength="10" value="${esc(noteOf(n))}" placeholder="나만 보는 메모" aria-label="${esc(n)}에 대한 나만 보는 메모, 10자 이내" autocomplete="off"><span class="note-n">${noteOf(n).length}/10</span></span>`;
  const v=noteOf(n);
  return v?` · <button class="note-btn" data-act="note-edit" data-name="${esc(n)}" title="나만 보는 메모 · 눌러서 수정">${esc(v)}</button>`:` <button class="note-btn empty" data-act="note-edit" data-name="${esc(n)}" title="나만 보는 메모 작성" aria-label="${esc(n)} 메모 작성">${TICON.pen}</button>`;
}
document.addEventListener('focusout',e=>{const el=e.target;if(el.classList&&el.classList.contains('note-in')&&S.sel.noteEdit===el.dataset.name)setTimeout(()=>saveNote(el),0);});
function saveNote(el){const n=el.dataset.name;if(S.sel.noteEdit!==n)return;const v=el.value.replace(/\s+/g,' ').trim().slice(0,10);S.notes=S.notes||{};if(v)S.notes[n]=v;else delete S.notes[n];S.sel.noteEdit=null;save();if(document.querySelector('.modal'))showOnline();}
const RBADGE={tank:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.3 13.6 3.3v4.2c0 3.5-2.4 5.9-5.6 7.2-3.2-1.3-5.6-3.7-5.6-7.2V3.3z" fill="currentColor"/><path d="M8 3.2v9.6" stroke="rgba(0,0,0,.28)" stroke-width="1"/></svg>',
  dps:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13.8 2.2 13.4 5 7 11.4 4.6 9 11 2.6z" fill="currentColor"/><path d="M3.3 9.6l3.1 3.1M2 14l2.4-2.4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  heal:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6.2 2h3.6v4.2H14v3.6H9.8V14H6.2V9.8H2V6.2h4.2z" fill="currentColor"/></svg>'};
function faceSm(p){const img=p.isMe?S.me.portrait:p.portrait;return img?`<img class="ol-face" src="${img}" alt="">`:sigil(p.job,'sm');}
function roleBadge(job){const r=roleOf(job);return `<span class="rbadge rb-${r}" title="${{tank:'탱커',dps:'딜러',heal:'힐러'}[r]}">${RBADGE[r]}</span>`;}
function showOnline(){
  const meI=playerInfo(S.me.name);const meOff=myStatus()==='offline';
  const on=[...(meOff?[]:[meI]),...S.bots.filter(b=>b.online)],off=[...(meOff?[meI]:[]),...S.bots.filter(b=>!b.online)];const all=[...on,...off];
  modal(`<div class="row" style="justify-content:space-between"><h3 class="ol-h">접속 중 <span class="num">${on.length}</span>명 <small class="faint" style="font-size:12px;font-weight:400">· 오프라인 ${off.length}명</small></h3><button class="btn btn-sm btn-ghost" data-act="closemodal">닫기</button></div>
    <div class="list">${all.map(p=>{const isOff=off.includes(p);return `<div class="li ${isOff?'ol-off':''}"><div class="row" style="gap:10px;flex:1;min-width:0">${faceSm(p)}<div class="t"><div class="row" style="gap:2px">${roleBadge(p.job)}<button class="who-btn" data-act="uinfo" data-name="${esc(p.name)}" title="${esc(p.name)} 정보 보기">${esc(p.name)}</button>${p.isMe?'':bondChip(p.name,true)}${p.isMe?' <span class="chip dim">나</span>':`<button class="ibtn sm" data-act="u-mail" data-name="${esc(p.name)}" data-tip="메시지" aria-label="${esc(p.name)}에게 메시지 보내기">${TICON.mail}</button><button class="ibtn sm" data-act="u-dm" data-name="${esc(p.name)}" data-tip="1:1 대화" aria-label="${esc(p.name)}와 1:1 대화">${HICON.chat}</button>`}</div><small>${JOBS[p.job].name} · LV${p.level}${p.isMe?'':noteHTML(p.name)}</small></div></div>${isOff?'<span class="ol-badge"><span class="st-dot off"></span>오프라인</span>':activityHTML(p)}</div>`;}).join('')}</div>
    <p class="faint" style="font-size:12px">게임 전체의 접속 계정 수입니다. 시제품에서는 연습용 동료 블레서가 함께 접속해 있습니다.</p>`);
}
function showMatch(){
  const mt=S.match;if(!mt){modal('');return;}
  const left=Math.max(0,Math.ceil((mt.deadline-now())/1000));const m=monster(mt.monsterId);
  const meAcc=mt.accepted[S.me.name];
  modal(`<h3>매칭 성사</h3><p class="muted">${esc(m.name)} · ${mt.members.length}명 · <span class="num" data-mleft>${left}</span>초 안에 수락하세요</p>
    <div class="list">${mt.members.map(x=>`<div class="li"><div class="t"><b>${esc(x.name)}</b><small>${JOBS[x.job].name} · LV${x.level}</small></div>${mt.accepted[x.name]?'<span class="chip ok">수락</span>':'<span class="chip dim">대기</span>'}</div>`).join('')}</div>
    <div class="row">${meAcc?'<span class="ok-t">수락했습니다. 다른 참가자를 기다리는 중…</span>':`<button class="btn btn-primary" data-act="m-accept">수락</button><button class="btn btn-ghost" data-act="m-decline">거절</button>`}</div>`);
}

/* ───────── 동작 ───────── */
function startBattle(){
  const p=S.party,m=monster(p.monsterId);
  if(mkind(m)==='dungeon'){S.drun={mid:m.id,phases:drunPhases(),idx:0,hp:Math.max(0.05,hpNow()),mobs:{},log:[],start:now(),party:p.members.map(x=>({name:x.name,job:x.job,level:x.level,isMe:!!x.isMe}))};
    p.members.forEach(x=>{const bb=bot(x.name);if(bb)bb.status='battle';});S.party=null;S.sel.monster=null;S.route='battle';save();render();toast(`${m.region} 입장 · 파티 ${S.drun.party.length}인 · 5페이즈 탐사`,'good');return;}
  const members=p.members.map(x=>x.isMe?{id:'me',name:S.me.name,job:S.me.job,level:S.me.level,equip:effEquip(),isMe:true,enh:S.me.enh}:{id:x.name,name:x.name,job:x.job,level:x.level,equip:{}});
  const b=createBattle(m,members,Math.random,cfg());
  {const mf=b.players.find(x=>x.isMe);if(mf)['maxHp','atk','def','luk'].forEach(k=>{const v=itemBonus(k);if(v){mf[k]+=v;if(k==='maxHp')mf.hp+=v;}});hpStart(mf);}
  b.ctx={type:mkind(m)};if(mkind(m)==='party')daily().raid++;
  const ev=eventFor(m.id);if(ev){b.ctx.ev=ev.id;b.rules.exp=Math.round(b.rules.exp*1.5);b.rules.gold=Math.round(b.rules.gold*1.5);b.eventBonus=ev.title;b.log.push({t:'warn',text:'보스 출현 이벤트 · 경험치와 골드 1.5배'});}
  b.deadline=now()+b.rules.turnSeconds*1000;planBots(b);
  S.battle=b;resetAct();
  p.members.forEach(x=>{const bb=bot(x.name);if(bb)bb.status='battle';});
  sysParty('전투가 시작되었습니다.');
  S.route='battle';save();render();toast(`${m.name} 전투 시작`,'good');
}
function resetAct(){const me=S.battle&&S.battle.players.find(p=>p.isMe);S.sel.act=me?{kind:'skill',skill:basicSkill(me.job)}:null;S.sel.act2=null;S.sel.actTab='attack';S.sel.gitem=null;S.sel.gcell=null;}
function gItemAct(b,me){const g=S.sel.gitem;if(!g||!g.item||!(S.me.inv[g.item]>0))return null;return {item:g.item,target:me.id};}
function planBots(b){b.players.forEach(p=>{if(!p.isMe&&!p.dead)p.planAt=now()+rnd(1500,7000);});b.allAt=null;}
const hooks={hasItem:(pid,k)=>pid==='me'?(S.me.inv[k]||0)>0&&!itemBlock(k):false,useItem:(pid,k)=>{if(pid==='me'&&S.me.inv[k]>0)S.me.inv[k]--;}};
function doResolve(){
  const b=S.battle;if(b.bless&&!b.bless.pick)applyBless(b,pick(b.bless.cards));if(b.grid)gridPre(b,Math.random,hooks);resolveTurn(b,Math.random,hooks);
  {const H=HERO_LINES[b.monsterId||b.mon.id];if(H&&!b.over&&Math.random()<0.4){const pool=H.say.filter(x=>x!==b.heroLast);const l=pick(pool.length?pool:H.say);b.heroLast=l;b.heroSay={text:l,turn:b.turn};b.log.push({t:'warn',text:`${b.mon.name} · “${l}”`});}}
  if(b.over)finishBattle(b);
  else{b.deadline=now()+b.rules.turnSeconds*1000;planBots(b);resetAct();
    if(Math.random()<(b.grid?0.3:0.25)){const bm=b.players.filter(p=>!p.isMe&&!p.dead);if(bm.length)later(rnd(800,2500),()=>botSay(b.grid?'raid':'party',pick(bm).name,pick(b.grid?MASS_LINES:PARTY_LINES)));}}
  save();renderFight();
}
function finishBattle(b){
  if(S.claimedB[b.id]){return;}
  S.claimedB[b.id]=true;
  const me=b.players.find(p=>p.isMe);if(me){if(HP_KEEP.includes((b.ctx||{}).type))wearDown();hpAfter(b,me);}const ctx=b.ctx||{};let blocked='';
  if(b.over==='win'&&ctx.type==='weekly'&&weekly().done[b.monsterId])blocked='이번 주 토벌 보상은 이미 받았습니다. 매주 월요일 05:00에 초기화됩니다.';
  if(b.over==='win'&&ctx.type==='event'&&ctx.ev&&(S.eventDone||{})[ctx.ev])blocked='이번 출현의 보상은 이미 받았습니다.';
  const r={eligible:b.over==='win'&&me.direct>=1&&!blocked&&ctx.type!=='quest',exp:0,gold:0,items:{},blocked};
  if(b.over==='win'){
    if(ctx.type==='weekly'&&!blocked)weekly().done[b.monsterId]=true;
    if(ctx.type==='event'&&ctx.ev&&!blocked){S.eventDone=S.eventDone||{};S.eventDone[ctx.ev]=true;}
    if(ctx.type==='dungeon'){daily().dungeon[b.monsterId]=true;bump('dunClear');}
    if(ctx.type==='quest'){const q=quest(ctx.qid),qp=S.qp[ctx.qid];const st=q&&q.steps[ctx.step];if(qp&&st&&qp.step===ctx.step){qp.history.push({step:ctx.step,text:st.text,label:`개인 레이드 · ${b.mon.name} 처치`,result:st.winText||'적을 쓰러뜨렸다.'});qp.step=st.next;qp.lost=false;}}
  }else if(ctx.type==='quest'){const qp=S.qp[ctx.qid];if(qp)qp.lost=true;}
  if(ctx.type==='mass'){const C={reward:b.reward||massCfg().reward},w=b.over==='win';r.eligible=me.direct>=1;r.mass=true;
    if(r.eligible){r.exp=C.reward.join.exp+(w?C.reward.kill.exp:0);r.gold=C.reward.join.gold+(w?C.reward.kill.gold:0);const it={...(C.reward.join.items||{})};
      if(w){for(const k in (C.reward.kill.items||{}))it[k]=(it[k]||0)+C.reward.kill.items[k];const pk=(C.reward.kill.pick||[]).filter(k=>ITEMS[k]);if(pk.length){const k=pick(pk);it[k]=(it[k]||0)+1;}}
      r.items=it;if(b.bless&&b.bless.pick==='exp')r.exp=Math.round(r.exp*1.1);if(b.bless&&b.bless.pick==='gold')r.gold=Math.round(r.gold*1.1);r.ups=grant({exp:r.exp,gold:r.gold,items:r.items},'mass',{battleId:b.id,label:b.mon.name+' 만신전'});}
    massEnd(w?`${b.mon.name} 만신전 성공!`:`${b.mon.name} 만신전 실패 · 이벤트가 종료되었습니다.`,w?'good':'warn');
  }else if(r.eligible){
    r.exp=b.rules.exp;r.gold=b.rules.gold;b.rules.drops.forEach(([k,c])=>{if(Math.random()<c)r.items[k]=(r.items[k]||0)+1;});
    r.ups=grant({exp:r.exp,gold:r.gold,items:r.items},ctx.type==='field'?'field':ctx.type==='dungeon'?'dungeon':'battle',{battleId:b.id,label:b.mon.name,region:b.mon.region});
  }
  if(me.direct>=1){bump('damage',me.dealt||0);bump('crits',me.crits||0);bump('healing',me.healed||0);bump('revives',me.revives||0);
    if(b.over==='win'){bump('raidsWon');const k=S.stats.kills=S.stats.kills||{};k[b.monsterId]=(k[b.monsterId]||0)+1;if(b.eventBonus)bump('bossWins');if(me.dead)bump('fallenWins');}else bump('raidsLost');}
  {const H=HERO_LINES[b.monsterId||b.mon.id];if(H&&b.over==='win'){b.log.push({t:'warn',text:`${b.mon.name}의 마지막 말 · “${H.last}”`});S.me.exLog=[{ts:now(),region:b.mon.region||'개인 레이드',land:'',text:`${b.mon.name}이(가) 쓰러지며 남긴 말 · “${H.last}”`,got:''},...(S.me.exLog||[])].slice(0,12);}}
  b.result=r;
  if(ctx.drun)drunAfter(b,me);
  sysParty(b.over==='win'?'승리! 보상은 각자 지급됩니다.':'전투가 끝났습니다.');
  if(S.route!=='battle')notify(b.over==='win'?`${b.mon.name} 처치 · 전투 화면에서 결과를 확인하세요`:'전투에서 패배했습니다',b.over==='win'?'good':'bad');
}
function leaveBattle(){
  const b=S.battle;if(b&&!b.over)return;
  if(S.party)S.party.members.forEach(x=>{const bb=bot(x.name);if(bb)bb.status='lobby';});
  if(b)b.players.forEach(p=>{const bb=bot(p.name);if(bb)bb.status='lobby';});
  const ctx=b&&b.ctx;S.battle=null;S.party=null;S.sel.monster=null;
  if(ctx&&ctx.type==='quest')go('quest',{quest:ctx.qid,qtab:(quest(ctx.qid)||{}).cat||'epic'});else if(ctx&&ctx.type==='field')go('explore');else go('battle',{rtab:ctx&&ctx.type==='weekly'?'weekly':ctx&&(ctx.type==='event'||ctx.type==='mass')?'event':ctx&&(ctx.type==='dungeon'||ctx.type==='drun')?'dungeon':'daily'});
}
function leaveParty(){
  if(!S.party)return;S.party.members.forEach(x=>{const bb=bot(x.name);if(bb)bb.status='lobby';});
  (S.party.invites||[]).forEach(()=>{});
  const mid=S.party.monsterId;S.party=null;toast('파티에서 나왔습니다.');go('battle',{monster:mid});
}
function acceptMatch(){
  const mt=S.match;if(!mt)return;mt.accepted[S.me.name]=true;showMatch();save();
}
function matchFail(byMe,botDeclined){
  const mt=S.match;S.match=null;
  if(byMe){S.queue=null;toast('매칭을 거절해 대기열에서 제외되었습니다.','warn');}
  else if(mt.accepted[S.me.name]||botDeclined){S.queue={monsterId:mt.monsterId,target:mt.target,since:mt.since,nextTry:now()+rnd(3000,6000)};toast('수락하지 않은 참가자가 있어 다시 매칭합니다. 대기 순서는 유지됩니다.','warn');}
  else{S.queue=null;toast('수락 시간이 지나 대기열에서 제외되었습니다.','warn');}
  mt.members.forEach(x=>{const bb=bot(x.name);if(bb&&bb.status==='recruit')bb.status='lobby';});
  modal('');save();render();
}
function tryMatch(){
  const q=S.queue,m=monster(q.monsterId);
  const pool=shuffle(idleBots().filter(b=>levelOk(m,b.level)));
  const mem=[meMember()];
  const need=missingRoles(m,[roleOf(S.me.job)]);
  for(const r of ['tank','dps','heal'])for(let i=0;i<need[r];i++){const b=pool.find(x=>roleOf(x.job)===r&&!mem.some(y=>y.name===x.name));if(!b)return false;mem.push(botMember(b));}
  for(const b of pool){if(mem.length>=q.target)break;if(!mem.some(y=>y.name===b.name))mem.push(botMember(b));}
  if(mem.length<q.target)return false;
  mem.forEach(x=>{const bb=bot(x.name);if(bb)bb.status='recruit';});
  S.match={monsterId:m.id,target:q.target,since:q.since,members:mem.map(x=>({name:x.name,job:x.job,level:x.level,isMe:x.isMe,accAt:x.isMe?0:now()+rnd(1500,8000),decline:!x.isMe&&Math.random()<0.08})),accepted:{},deadline:now()+cfg().acceptSeconds*1000};
  S.queue=null;showMatch();notify('매칭이 성사되었습니다! 참가를 수락하세요.','good');save();renderTop();
  if(S.route==='battle')render();
  return true;
}

/* ───────── 주기 처리 ───────── */
let slowT=0;
function tick(){
  if(!S||!S.me||S.loggedOut)return;
  const t=now();
  // 전투
  const b=S.battle;
  if(b&&!b.over&&b.grid&&b.endsAt&&t>=b.endsAt){b.over='lose';b.log.push({t:'lose',text:'제한 시간 종료 · 보스를 쓰러뜨리지 못했다'});finishBattle(b);save();if(S.route==='battle')render();return;}
  if(b&&!b.over){
    let dirty=false;
    b.players.forEach(p=>{if(!p.isMe&&!p.dead&&!p.confirmed&&t>=p.planAt){p.action=b.grid?decideGridBot(b,p,Math.random):decideBot(b,p,Math.random);if(canDouble(p,b))p.action2=decideBot2(b,p);p.confirmed=true;dirty=true;}});
    const al=living(b);
    if(al.every(p=>p.confirmed)){if(!b.allAt)b.allAt=t;}else b.allAt=null;
    if((b.allAt&&t-b.allAt>=1500)||t>=b.deadline){doResolve();return;}
    if(dirty&&S.route==='battle'){renderFight();save();}
    const el=$('[data-timer]');if(el){const left=Math.max(0,Math.ceil((b.deadline-t)/1000));el.textContent=left+'초';el.classList.toggle('low',left<=10);}
  }
  // 매칭 수락
  if(S.match){
    const mt=S.match;let ch=false;
    for(const x of mt.members){if(!x.isMe&&!mt.accepted[x.name]&&t>=x.accAt){if(x.decline){matchFail(false,true);return;}mt.accepted[x.name]=true;ch=true;}}
    if(mt.members.every(x=>mt.accepted[x.name])){
      modal('');S.party={id:uid('P'),monsterId:mt.monsterId,leader:mt.members[0].name,visibility:'invite',target:mt.target,members:mt.members.map(x=>({name:x.name,job:x.job,level:x.level,isMe:x.isMe,ready:true})),chat:[],invites:[],rev:monster(mt.monsterId).rev};
      sysParty('랜덤 매칭으로 파티가 구성되었습니다.');S.match=null;startBattle();return;
    }
    if(t>=mt.deadline){matchFail(false);return;}
    if(ch)showMatch();else{const ml=$('[data-mleft]');if(ml)ml.textContent=Math.max(0,Math.ceil((mt.deadline-t)/1000));}
    if(!$('#modal').innerHTML)showMatch();
  }
  {const L=progItems();const key=L.map(x=>x.t+(x.done?1:0)).join('|');$$('.me-prog-wrap').forEach(el=>{if(el.dataset.k!==key){el.dataset.k=key;el.innerHTML=progInner();}else{const rs=el.querySelectorAll('.mp-r');L.forEach((x,i)=>{if(rs[i]&&rs[i].textContent!==x.r)rs[i].textContent=x.r;});}});}
  {const el=$('[data-evp-left]');if(el&&S.mass){const ev=(S.events||[]).find(x=>x.id===S.mass.evId);if(ev)el.textContent=fmtLong(ev.until-t);}}
  if(S&&S.fishCast){const F=S.fishCast;if(t>=F.end&&!F.noted){F.noted=1;save();notify('찌가 움직입니다! 탐색에서 낚싯대를 걷어 올리세요.');}const lf=$('[data-fc-left]');if(lf){if(t>=F.end){if(!lf.dataset.done){lf.dataset.done=1;render();}}else{lf.textContent='남은 시간 '+fmtLong(F.end-t);const pp=$('[data-fc-p]');if(pp)pp.style.width=Math.min(100,(t-F.start)/(F.end-F.start)*100)+'%';}}}
  if(S&&S.autoFish){const a=S.autoFish;if(t>=a.end&&!a.noted){a.noted=1;save();notify(`${LANDS[a.land]} 자동 낚시가 끝났습니다. 탐색에서 결과를 받으세요.`);}const lf=$('[data-af-left]');if(lf){if(t>=a.end){if(!lf.dataset.done){lf.dataset.done=1;render();}}else{lf.textContent='남은 시간 '+fmtLong(a.end-t);const pp=$('[data-af-p]');if(pp)pp.style.width=Math.min(100,(t-a.start)/(a.end-a.start)*100)+'%';}}}
  {const el=$('[data-lt-left]');if(el){el.textContent=fmtLong(nextDraw(t).at-t);}}
  if(S&&S.me&&S.me.lotto&&!S.me.lottoNoted){const u=S.me.lotto.find(x=>t>=x.at&&!x.claimed&&!x.noted);if(u){S.me.lotto.forEach(x=>{if(t>=x.at)x.noted=1;});save();notify('주간 행운권 당첨 번호가 공개되었습니다! 소금의 땅 · 골든 오아시스에서 확인하세요.');}}
  if(S&&S.me&&S.me.cjobs){const J=S.me.cjobs;for(const k in J){const j=J[k];if(!j)continue;if(t>=j.end&&!j.noted){j.noted=1;save();notify(`${j.label} ${k==='repair'?'':'제작이 '}완료되었습니다. 캐릭터 › 제작에서 받으세요.`);}
    const lf=$(`[data-cj-left="${k}"]`);if(lf){if(t>=j.end){if(!lf.dataset.done){lf.dataset.done=1;openCraft(S.sel.cfKind,S.sel.cfTab);}}else{lf.textContent='남은 시간 '+fmtLong(j.end-t);const pp=$(`[data-cj-p="${k}"]`);if(pp)pp.style.width=Math.min(100,(t-j.start)/Math.max(1,j.end-j.start)*100)+'%';}}}}
  if(S&&S.auto&&t>=S.auto.end&&!S.auto.noted){S.auto.noted=1;save();notify(`${S.auto.region} 자동 사냥이 끝났습니다. 탐색에서 보상을 받으세요.`);}
  if(S&&S.auto){const a=S.auto;const lf=$('[data-auto-left]');if(lf){if(t>=a.end&&!$('.auto-bar.done'))render();else if(t<a.end){lf.textContent='남은 시간 '+fmtLong(a.end-t);const kk=$('[data-auto-k]');if(kk)kk.textContent=autoKills(a,t);const gg=$('[data-auto-gain]');if(gg)gg.innerHTML=gainText(autoGain(a,t));const pp=$('[data-auto-p]');if(pp)pp.style.width=Math.min(100,(t-a.start)/(a.end-a.start)*100)+'%';}}}
  const ck=$('[data-clock]');if(ck){ck.textContent=clockText();const sb=$('[data-sky]');if(sb&&sb.dataset.sky!==kstParts().key)sb.outerHTML=skyBar();}
  $$('[data-qtime]').forEach(el=>{if(S.queue)el.textContent=fmtDur(t-S.queue.since);});
  if(t-slowT<1000)return;slowT=t;
  massTick(t);{const ml=$('[data-mass-left]');if(ml&&S.battle&&S.battle.endsAt)ml.textContent='제한 '+fmtDur(Math.max(0,S.battle.endsAt-t));}
  if(t-(S._mp||0)>60000){S._mp=t;if(pruneMail()){renderTop();if(S.sel.pop==='mail')renderPop();}}
  // 대기열
  if(S.queue&&t>=S.queue.nextTry){S.queue.nextTry=t+rnd(4000,8000);tryMatch();}
  // 파티
  const p=S.party;
  if(p&&!S.battle){
    let ch=false;const m=monster(p.monsterId);
    if(!m){S.party=null;render();return;}
    if(p.rev!==m.rev&&!p.changed){p.changed=true;p.members.forEach(x=>x.ready=x.isMe?false:x.ready);if(p.leader!==S.me.name)later(3000,()=>{if(S.party===p){p.changed=false;p.rev=m.rev;sysParty('파티장이 바뀐 조건을 확인했습니다.');save();if(S.route==='battle')render();}});sysParty('운영자가 몬스터 참가 조건을 변경했습니다.');ch=true;}
    p.members.forEach(x=>{if(!x.isMe&&!x.ready&&x.readyAt&&t>=x.readyAt){x.ready=true;ch=true;}});
    if(p.visibility==='public'&&p.members.length<p.target&&t>=(p.nextJoin||0)){
      p.nextJoin=t+rnd(2500,5500);
      const need=missingRoles(m,p.members.map(x=>roleOf(x.job)));
      const cand=shuffle(idleBots().filter(b=>levelOk(m,b.level)&&!slotReason(m,p.members,roleOf(b.job),p.target))).sort((a,b)=>need[roleOf(b.job)]-need[roleOf(a.job)]);
      if(cand.length&&Math.random()<0.75){const b=cand[0];b.status='recruit';p.members.push(botMember(b));sysParty(`${b.name}님이 파티에 참가했습니다.`);if(Math.random()<0.4)later(1200,()=>botSay('party',b.name,pick(PARTY_LINES)));ch=true;}
    }
    (p.invites||[]).slice().forEach(iv=>{if(t>=iv.at){p.invites=p.invites.filter(x=>x!==iv);const b=bot(iv.name);const r=b&&(levelReason(m,b.level)||slotReason(m,p.members,roleOf(b.job),p.target));
      if(b&&b.online&&b.status==='lobby'&&!r&&Math.random()<0.88){b.status='recruit';p.members.push(botMember(b));sysParty(`${b.name}님이 초대를 수락했습니다.`);}
      else{notify(`${iv.name}님이 초대를 거절했습니다.`,'warn');sysParty(`${iv.name}님이 초대를 거절했습니다.`);}ch=true;}});
    const c=partyCheck(p);
    if(p.leader!==S.me.name){if(c.ok){if(!p.departAt)p.departAt=t+2500;else if(t>=p.departAt){p.departAt=null;startBattle();return;}}else p.departAt=null;}
    if(ch){save();updateChats();if(S.route==='battle'&&!document.activeElement.matches('input,textarea,select'))render();else renderTop();}
  }
  // 5초마다: 모집, 접속, 대화
  if(t-(S._mid||0)>5000){S._mid=t;ambient();}
}
function ambient(){
  if(Math.random()<0.008){S.bondReq=S.bondReq||{in:{},out:{}};S.bondReq.in=S.bondReq.in||{};const c=S.bots.filter(b=>b.online&&!bondOf(b.name)&&!S.bondReq.in[b.name]&&!(S.bondReq.out||{})[b.name]&&S.rel[b.name]!=='blocked');const b=pick(c);if(b){const t=pick(['friend','friend','comrade','comrade','roommate','family']);S.bondReq.in[b.name]={type:t,at:now()};notify(`${b.name}님이 ${BOND[t].n} 관계를 신청했습니다. 캐릭터 페이지에서 확인하세요.`);if(S.route==='character')render();}}
  if(S.bondReq&&S.bondReq.out)Object.keys(S.bondReq.out).forEach(n=>{const b=bot(n);if(b&&b.online&&now()-S.bondReq.out[n].at>15000&&Math.random()<0.5)bondResolve(n,Math.random()<0.75);});
  S.bots.forEach(b=>{if(b.online)b.goldEarned=(b.goldEarned||0)+Math.floor(Math.random()*7);});if(Math.random()<0.2)checkTitles();
  const before=(S.events||[]).length;activeEvents();
  if(S.events.length!==before)refreshTicker();
  // 접속 상태 변화
  if(Math.random()<0.25){const idle=S.bots.filter(b=>b.status==='lobby');const b=pick(idle);if(b){const online=S.bots.filter(x=>x.online).length;if(b.online&&online>13)b.online=false;else if(!b.online){b.online=true;
    if(S.rel[b.name]==='out'){S.rel[b.name]='friend';toast(`${b.name}님이 친구 요청을 수락했습니다.`,'good');}
    if(S.pendingDm&&S.pendingDm.includes(b.name)){S.pendingDm=S.pendingDm.filter(n=>n!==b.name);later(2500,()=>botDm(b.name,pick(WHISPER_LINES)));}
    if(S.pendingReplies&&S.pendingReplies.includes(b.name)){S.pendingReplies=S.pendingReplies.filter(n=>n!==b.name);later(2500,()=>botSay('whisper',b.name,pick(WHISPER_LINES)));}}}}
  // 보낸 친구 요청 응답
  Object.entries(S.rel).forEach(([n,v])=>{if(v==='out'){const b=bot(n);if(b&&b.online&&Math.random()<0.5){S.rel[n]='friend';toast(`${n}님이 친구 요청을 수락했습니다.`,'good');if(S.route==='friends')render();}}});
  // 모집 파티
  S.recruits=S.recruits.filter(r=>{if(Math.random()<0.04||!monster(r.monsterId)){r.members.forEach(n=>{const b=bot(n);if(b)b.status='lobby';});return false;}return true;});
  S.recruits.forEach(r=>{const m=monster(r.monsterId);if(r.members.length<r.target-1&&Math.random()<0.2){const b=shuffle(idleBots().filter(x=>levelOk(m,x.level))).find(x=>!slotReason(m,r.members.map(bot),roleOf(x.job),r.target));if(b&&r.members.length+1<r.target){b.status='recruit';r.members.push(b.name);}}});
  for(let k=0;k<2&&S.recruits.length<6;k++){if(Math.random()<0.5)continue;const ms=S.data.monsters.filter(m=>isGroupMon(m)&&S.recruits.filter(r=>r.monsterId===m.id).length<3);const m=pick(ms);if(m){const r=genRecruit(m);if(r)S.recruits.push(r);}}
  // 상태 랜덤 (전투 중 표시)
  S.bots.forEach(b=>{if(b.online&&b.status==='lobby'&&Math.random()<0.04){const m=pick(S.data.monsters.filter(x=>isGroupMon(x)&&levelOk(x,b.level)));if(m){b.status='battle';b.raid=m.id;}}else if(b.status==='battle'&&!inMyGroup(b.name)&&Math.random()<0.12)b.status='lobby';});
  if(Math.random()<0.35){const b=pick(S.bots.filter(x=>x.online&&S.rel[x.name]!=='blocked'));if(b)botSay('lobby',b.name,pick(LOBBY_LINES));}
  if(Math.random()<0.02){const c=S.bots.filter(b=>b.online&&S.rel[b.name]!=='blocked'&&!(dmState().threads[b.name]||{msgs:[]}).msgs.length);const b=pick(c);if(b)botDm(b.name,pick(['안녕하세요! 혹시 파티 구하세요?','같이 일일 의뢰 하실래요?','레이드 몇 레벨부터 가세요?']));}
  if(Math.random()<0.025){const fr=S.bots.filter(b=>b.online&&S.rel[b.name]!=='blocked');const b=pick(fr);if(b){const gift=Math.random()<0.35;deliverMail(b.name,gift?pick(['남는 회복약 나눠요!','전투 전에 챙기세요.','작은 선물이에요.']):pick(['오늘 같이 파티 가실래요?','봉인 수호자 공략 모집 중이에요.','어제 전투 고생 많으셨어요!']),gift?{potion:1+Math.floor(Math.random()*2)}:null);}}
  if(S.party&&!S.battle&&Math.random()<0.12){const bm=S.party.members.filter(x=>!x.isMe);if(bm.length)botSay('party',pick(bm).name,pick(PARTY_LINES));}
  renderTopBadges();
  const rj=$('[data-recruits-join]');if(rj)rj.innerHTML=recruitRows(S.recruits,true);
  const rm=$('[data-recruits-mon]');if(rm)rm.innerHTML=recruitRows(S.recruits.filter(r=>r.monsterId===rm.dataset.recruitsMon),true);
  if(S.sel.rmem&&!String(S.sel.rmem).startsWith('u:')){const r=S.recruits.find(x=>x.id===S.sel.rmem);const box=$('#rmenu');if(!r||!$('[data-rslide]'))closeRmem();else if(box.firstElementChild){const st=box.firstElementChild.style.cssText;box.innerHTML=rmemHTML(r);box.firstElementChild.style.cssText=st;}}
  const rp=$('[data-rslide]');if(rp&&!rdrag){const sl=rp.scrollLeft;rp.innerHTML=S.recruits.slice(0,6).map(recruitCard).join('')||'<p class="empty">모집 중인 파티가 없습니다. 직접 파티를 만들어 보세요.</p>';rp.scrollLeft=sl;}
  save();
}
function inMyGroup(n){return (S.party&&S.party.members.some(x=>x.name===n))||(S.battle&&S.battle.players.some(p=>p.id===n))||(S.match&&S.match.members.some(x=>x.name===n));}

/* ───────── 아이콘 · 사운드 ───────── */
const TICON={
  mail:`<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="1.8" y="3.4" width="12.4" height="9.2" rx="1.4" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M2.4 4.2 8 8.6l5.6-4.4" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>`,
  gear:`<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6.9 1.6h2.2l.4 1.8 1.2.5 1.6-1 1.5 1.5-1 1.6.5 1.2 1.8.4v2.2l-1.8.4-.5 1.2 1 1.6-1.5 1.5-1.6-1-1.2.5-.4 1.8H6.9l-.4-1.8-1.2-.5-1.6 1-1.5-1.5 1-1.6-.5-1.2-1.8-.4V6.9l1.8-.4.5-1.2-1-1.6 1.5-1.5 1.6 1 1.2-.5z" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><circle cx="8" cy="8" r="2.2" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>`,
  logout:`<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M9.5 2.5H4a1.5 1.5 0 0 0-1.5 1.5v8A1.5 1.5 0 0 0 4 13.5h5.5" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M7 8h7M11.5 5.2 14.2 8l-2.7 2.8" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  trash:`<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.6 4.2h10.8M6.2 4.2V2.6h3.6v1.6M4 4.2l.7 9.2h6.6l.7-9.2M6.6 6.6v4.6M9.4 6.6v4.6" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  people:`<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="6" cy="5.2" r="2.4" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M1.8 13.4c.3-2.4 2-3.8 4.2-3.8s3.9 1.4 4.2 3.8" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><circle cx="11.2" cy="5.8" r="1.9" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M11.6 9.7c1.5.2 2.5 1.4 2.7 3.2" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>`,
  read:`<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 6.6 8 2.6l6 4v6.2c0 .7-.5 1.2-1.2 1.2H3.2c-.7 0-1.2-.5-1.2-1.2z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M2.4 7 8 10.6 13.6 7" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M6 6.2l1.4 1.4L10.2 5" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  pen:`<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10.8 2.6l2.6 2.6-7.6 7.6-3.2.6.6-3.2z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M9.4 4l2.6 2.6" stroke="currentColor" stroke-width="1.3"/></svg>`,
  gift:`<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="5.6" width="12" height="3" rx=".6" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M3 8.6v5h10v-5M8 5.6v8M8 5.6C6.6 3 4.4 3 4.6 4.4 4.8 5.6 8 5.6 8 5.6zm0 0c1.4-2.6 3.6-2.6 3.4-1.2C11.2 5.6 8 5.6 8 5.6z" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>`,
  vol:`<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.4 6.2v3.6h2.4L8.6 13V3L4.8 6.2z" fill="currentColor"/><path d="M10.8 5.4a3.6 3.6 0 0 1 0 5.2" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`,
  mute:`<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.4 6.2v3.6h2.4L8.6 13V3L4.8 6.2z" fill="currentColor"/><path d="M10.6 6.2l3.4 3.6M14 6.2l-3.4 3.6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`
};
const DEF_SND={bgm:30,click:50,alarm:70};
const SND={ctx:null,bgm:null};
function sndVol(k){const st=S&&S.settings;return ((st&&st[k]!=null)?st[k]:DEF_SND[k])/100;}
function audio(){if(!SND.ctx){const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;try{SND.ctx=new A();}catch(e){return null;}}if(SND.ctx.state==='suspended')SND.ctx.resume().catch(()=>{});return SND.ctx;}
function blip(freq,dur,v,type,when){const c=SND.ctx;if(!c||v<=0)return;try{const o=c.createOscillator(),g=c.createGain();o.type=type||'sine';o.frequency.value=freq;const t=c.currentTime+(when||0);g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(v,t+0.006);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);o.connect(g).connect(c.destination);o.start(t);o.stop(t+dur+0.03);}catch(e){}}
function playClick(){blip(1500,0.05,0.10*sndVol('click'),'triangle');}
function playAlarm(){const v=0.16*sndVol('alarm');blip(880,0.28,v);blip(1318.5,0.42,v,'sine',0.13);}
function updateBgm(){
  const c=SND.ctx;if(!c)return;const target=S&&S.me&&!S.loggedOut?sndVol('bgm')*0.07:0;
  if(!SND.bgm){if(target<=0)return;try{const out=c.createGain();out.gain.value=0;const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=520;lp.connect(out);out.connect(c.destination);
    [[110,0],[164.81,3],[220.6,-4],[329.6,2]].forEach(([f,d],i)=>{const o=c.createOscillator();o.type=i%2?'triangle':'sine';o.frequency.value=f;o.detune.value=d;const g=c.createGain();g.gain.value=i===3?0.18:0.45;
      const l=c.createOscillator(),lg=c.createGain();l.frequency.value=0.05+i*0.03;lg.gain.value=0.22;l.connect(lg).connect(g.gain);l.start();o.connect(g).connect(lp);o.start();});
    SND.bgm=out;}catch(e){return;}}
  SND.bgm.gain.setTargetAtTime(target,c.currentTime,0.4);
}
document.addEventListener('pointerdown',()=>{if(audio())updateBgm();},{capture:true});

/* ───────── 팝업 공통 ───────── */
function renderPop(){
  const el=$('#pop');if(!el)return;
  const k=S&&S.me&&!S.loggedOut?S.sel.pop:null;
  if(!k){el.innerHTML='';return;}
  const keepScroll=el.querySelector('.pop-body');const sc=keepScroll?keepScroll.scrollTop:0;
  el.innerHTML=`<div class="pop pop-${k}" role="dialog" aria-label="${k==='mail'?'메시지':k==='notice'?'공지사항':'환경설정'}">${k==='mail'?mailPop():k==='notice'?noticePop():settingsPop()}</div>`;
  const b=el.querySelector('.pop-body');if(b)b.scrollTop=sc;
}

/* ───────── 우편함 ───────── */
const MAIL_TABS=[['all','전체'],['unread','읽지 않음'],['gift','선물'],['archive','보관']];
function hasItems(m){return Object.values(m.items||{}).some(n=>n>0);}
function mailUnread(){return (S.mail||[]).some(m=>!m.read);}
function mailList(tab,sort){
  const L=(S.mail||[]).slice();
  const by=sort||S.sel.mailSort||'none';
  const t=(a,b)=>b.ts-a.ts;
  L.sort(by==='unread'?(a,b)=>(a.read-b.read)||t(a,b):by==='archive'?(a,b)=>(b.archived-a.archived)||((b.archivedAt||0)-(a.archivedAt||0))||t(a,b):t);
  if(tab==='archive')return L.filter(m=>m.archived);
  if(tab==='all')return L;
  const live=L.filter(m=>!m.archived);
  if(tab==='unread')return live.filter(m=>!m.read);
  if(tab==='gift')return live.filter(hasItems);
  if(tab==='letter')return live.filter(m=>!hasItems(m));
  return live;
}
function fmtWhen(t){const d=now()-t;if(d<60000)return '방금';if(d<3600000)return Math.floor(d/60000)+'분 전';if(d<86400000)return Math.floor(d/3600000)+'시간 전';return new Date(t+9*3600e3).toISOString().slice(5,10).replace('-','.');}
function availItem(k){if(isQuestItem(k))return 0;const n=S.me.inv[k]||0;return n-(Object.values(S.me.equip||{}).includes(k)?1:0);}
function deliverMail(from,text,items,extra){
  S.mail=S.mail||[];S.mail.push({id:uid('ml'),from,text,items:items||{},ts:now(),read:false,claimed:false,archived:false,...(extra||{})});bump('lettersRecv');if(items&&Object.keys(items).length)bump('giftsRecv');
  if(S.mail.length>120){const drop=S.mail.filter(m=>!m.archived).sort((a,b)=>a.ts-b.ts)[0];S.mail=S.mail.filter(m=>m!==drop);}
  notify(`${from}님에게서 ${items&&Object.keys(items).length?'선물이':'메시지가'} 도착했습니다.`);renderTop();renderPop();save();
}
const MAIL_TTL=7*24*3600e3;
function pruneMail(){const t=now();const n=(S.mail||[]).length;S.mail=(S.mail||[]).filter(m=>m.archived||t-m.ts<MAIL_TTL);if(S.mail.length!==n){if(S.sel.mailView&&S.sel.mailView!=='compose'&&!S.mail.some(m=>m.id===S.sel.mailView))S.sel.mailView=null;save();return true;}return false;}
function mailPop(){
  pruneMail();const view=S.sel.mailView;
  if(view==='compose')return composeHTML();
  const m=view&&(S.mail||[]).find(x=>x.id===view);
  if(m)return mailDetail(m);
  if(S.sel.mailTab==='letter')S.sel.mailTab='all';
  const tab=S.sel.mailTab||'all';const list=mailList(tab);const ids=new Set((S.mail||[]).map(x=>x.id));const sel=S.sel.msel=(S.sel.msel||[]).filter(id=>ids.has(id));
  const arch=(S.mail||[]).filter(x=>x.archived).length;const pick=!!S.sel.mpick;const srt=S.sel.mailSort||'none';
  return `<div class="pop-head"><b>우편함</b><button class="btn btn-sm btn-primary" data-act="mail-compose">편지 쓰기</button></div>
    <div class="mtabs" role="tablist">${MAIL_TABS.map(([k,l])=>{const n=k==='unread'?mailList('unread').length:0;return `<button role="tab" data-act="mail-tab" data-tab="${k}" aria-selected="${tab===k}">${l}${k==='unread'&&n?` <span class="num">${n}</span>`:''}</button>`;}).join('')}</div>
    <div class="mtool">${pick?`<label class="mchk" title="전체 선택"><input type="checkbox" id="m-all" data-act="m-selall" ${list.length&&list.every(x=>sel.includes(x.id))?'checked':''} aria-label="이 탭의 메시지 전체 선택"></label><span class="faint" style="font-size:12px">${sel.length}개 선택</span>`:`<span class="faint" style="font-size:12px">${list.length}개</span>`}${tab==='archive'?`<span class="chip num dim" title="보관함 사용량">보관 ${arch}/10</span>`:''}
      <span class="row" style="gap:4px;margin-left:auto">
        <select id="m-sort" class="msort" aria-label="정렬">${[['none','정렬'],['unread','안읽은 순'],['archive','보관순'],['latest','최신순']].map(([k,l])=>`<option value="${k}" ${srt===k?'selected':''}>${l}</option>`).join('')}</select>
        ${pick?`<button class="btn btn-sm btn-danger" data-act="m-delask" ${sel.length?'':'disabled'}>삭제</button><button class="btn btn-sm btn-ghost" data-act="m-pickoff">취소</button>`
        :`<button class="ibtn sm" data-act="m-readall" data-tip="모두 읽기" aria-label="모두 읽기">${TICON.read}</button><button class="ibtn sm danger" data-act="m-pickon" data-tip="삭제" aria-label="삭제할 메시지 선택">${TICON.trash}</button>`}</span></div>
    <div class="pop-body"><div class="mlist ${pick?'picking':''}">${list.length?list.map(x=>`<div class="mrow ${x.read?'':'unread'} ${pick&&sel.includes(x.id)?'picked':''}">${pick?`<label class="mchk"><input type="checkbox" data-act="m-sel" data-id="${x.id}" ${sel.includes(x.id)?'checked':''} aria-label="${esc(x.from)} 메시지 선택"></label>`:''}<button class="mopen" data-act="${pick?'m-toggle':'mail-open'}" data-id="${x.id}">
      <span class="mdot" aria-hidden="true"></span><span class="mfrom">${esc(x.from)}</span><span class="mtext">${x.archived&&tab!=='archive'?'<span class="march">보관</span>':''}${esc(x.text||'(내용 없음)')}</span>
      ${hasItems(x)?`<span class="mgift ${x.claimed?'done':''}" title="${x.claimed?'받은 선물':'선물 있음'}">${TICON.gift}</span>`:''}<span class="mwhen">${fmtWhen(x.ts)}</span></button></div>`).join(''):`<p class="empty" style="padding:18px 4px">${{all:'받은 메시지가 없습니다.',unread:'읽지 않은 메시지가 없습니다.',gift:'선물이 첨부된 메시지가 없습니다.',letter:'편지가 없습니다.',archive:'보관한 메시지가 없습니다. 메시지를 열고 보관을 누르면 이곳으로 옮겨집니다.'}[tab]}</p>`}</div></div>
    <p class="mfoot">받은 지 7일이 지난 메시지는 자동으로 삭제됩니다. 보관한 메시지는 삭제되지 않습니다.</p>`;
}
function mailDetail(m){
  const gift=hasItems(m);
  return `<div class="pop-head"><button class="btn btn-sm btn-ghost" data-act="mail-back">← 목록</button><span class="faint" style="font-size:12px">${fmtWhen(m.ts)}</span></div>
    <div class="pop-body stack" style="gap:12px">
      <div><span class="faint" style="font-size:12px">보낸 사람</span><div style="color:var(--silver);font-weight:500">${esc(m.from)}</div></div>
      <p class="mbody">${esc(m.text||'(내용 없음)')}</p>
      ${gift?`<div class="mitems"><div class="ph" style="margin-bottom:6px">${TICON.gift.replace('<svg','<svg class="gi"')} 첨부 선물</div>${Object.entries(m.items).map(([k,n])=>`<div class="row" style="justify-content:space-between"><span>${k==='_gold'?'골드':ITEMS[k]?ITEMS[k].name:k}</span><span class="num">×${n}</span></div>`).join('')}
        <button class="btn btn-sm ${m.claimed?'':'btn-primary'}" data-act="mail-claim" data-id="${m.id}" ${m.claimed?'disabled':''} style="margin-top:8px">${m.claimed?'받기 완료':'선물 받기'}</button></div>`:''}
      <div class="row">${m.from!=='운영자'&&bot(m.from)?`<button class="btn btn-sm" data-act="mail-reply" data-to="${esc(m.from)}">답장</button>`:''}
        <button class="btn btn-sm" data-act="mail-archive" data-id="${m.id}">${m.archived?'보관 해제':'보관'}</button>
        <button class="btn btn-sm btn-ghost btn-danger" data-act="m-delask" data-id="${m.id}">삭제</button></div>
    </div>`;
}
function composeHTML(){
  const c=S.sel.mc||(S.sel.mc={to:'',text:'',items:{}});
  const ppl=S.bots.filter(b=>S.rel[b.name]!=='blocked').sort((a,b)=>a.name.localeCompare(b.name,'ko'));
  const att=Object.entries(c.items);
  const inv=Object.keys(S.me.inv).filter(k=>availItem(k)>0&&ITEMS[k]&&ITEMS[k].type!=='equip');
  return `<div class="pop-head"><button class="btn btn-sm btn-ghost" data-act="mail-back">← 목록</button><b>편지 쓰기</b></div>
    <div class="pop-body stack" style="gap:10px">
      <label class="stack" style="gap:4px"><span class="faint" style="font-size:12px">받는 사람</span><select id="mc-to"><option value="">선택하세요</option>${ppl.map(b=>`<option value="${esc(b.name)}" ${c.to===b.name?'selected':''}>${esc(b.name)} · ${CLASSES[b.job].name}</option>`).join('')}</select></label>
      <label class="stack" style="gap:4px"><span class="row" style="justify-content:space-between"><span class="faint" style="font-size:12px">내용</span><span class="faint num" style="font-size:12px" id="mc-count">${c.text.length}/200</span></span><textarea id="mc-text" rows="4" maxlength="200" style="font-family:var(--f-body);font-size:13px">${esc(c.text)}</textarea></label>
      <div class="row" style="justify-content:space-between"><span style="font-size:12.5px">선물 첨부</span><button class="switch" role="switch" aria-checked="${!!c.gift}" data-act="mc-gift" aria-label="선물 첨부 ${c.gift?'켜짐':'꺼짐'}"><span class="knob"></span><span class="sw-t">${c.gift?'ON':'OFF'}</span></button></div>
      ${c.gift?`<div class="stack" style="gap:6px"><span class="faint" style="font-size:12px">최대 3종류 (${att.length}/3)</span>
        ${att.map(([k,n])=>`<div class="row" style="justify-content:space-between"><span>${ITEMS[k].name} <span class="num faint">×${n}</span></span><button class="btn btn-sm btn-ghost" data-act="mc-rm" data-k="${k}">빼기</button></div>`).join('')}
        ${att.length<3?`<div class="row"><select id="mc-item" style="flex:1">${inv.filter(k=>!c.items[k]).map(k=>`<option value="${k}">${ITEMS[k].name} (보유 ${availItem(k)})</option>`).join('')||'<option value="">보낼 수 있는 소모품이 없습니다</option>'}</select><input type="number" id="mc-qty" min="1" value="1" style="width:64px"><button class="btn btn-sm" data-act="mc-add">첨부</button></div>`:''}
        <span class="faint" style="font-size:11.5px">회복약 같은 소모품만 첨부할 수 있습니다. 장비는 보낼 수 없습니다.</span></div>`:''}
      <div class="row"><button class="btn btn-primary" data-act="mc-send">보내기</button></div>
    </div>`;
}
function readCompose(){const c=S.sel.mc||(S.sel.mc={to:'',text:'',items:{}});const to=$('#mc-to'),tx=$('#mc-text');if(to)c.to=to.value;if(tx)c.text=tx.value.slice(0,200);return c;}
document.addEventListener('input',e=>{if(e.target.classList&&e.target.classList.contains('note-in')){const n=e.target.parentNode.querySelector('.note-n');if(n)n.textContent=e.target.value.length+'/10';}if(e.target.id==='ne-text'){const n=$('#ne-count');if(n)n.textContent=e.target.value.length+'/1000';}if(e.target.id==='mc-text'){const n=$('#mc-count');if(n)n.textContent=e.target.value.length+'/200';}});

/* ───────── 환경설정 ───────── */
const SND_LABEL={bgm:'배경음',click:'클릭음',alarm:'알람음'};
function settingsPop(){
  const tab=S.sel.setTab||'set';
  return `<div class="pop-head"><b>환경설정</b><div class="seg">${[['set','설정'],['ask','1:1 문의']].map(([k,l])=>`<button data-act="set-tab" data-tab="${k}" aria-pressed="${tab===k}">${l}</button>`).join('')}</div></div>
    <div class="pop-body">${tab==='set'?setBody():askBody()}</div>`;
}
function setBody(){
  const on=!(S.settings&&S.settings.notify===false);
  return `<div class="stack" style="gap:10px"><div class="row" style="justify-content:space-between"><span style="font-size:12.5px">알림</span><button class="switch" role="switch" aria-checked="${on}" data-act="notify-toggle" aria-label="알림 ${on?'켜짐':'꺼짐'}"><span class="knob"></span><span class="sw-t">${on?'ON':'OFF'}</span></button></div>
    <p class="faint" style="font-size:11.5px;margin-top:-6px">${on?'우편 도착, 매칭 성사, 레이드 결과를 알려 줍니다.':'알림 창과 알람음이 뜨지 않습니다.'}</p>
    <div class="row" style="justify-content:space-between;border-top:1px solid var(--rule);padding-top:10px"><span style="font-size:12.5px">만신전 팝업</span><button class="switch" role="switch" aria-checked="${evPopOn()}" data-act="evpop-toggle" aria-label="만신전 팝업 ${evPopOn()?'켜짐':'꺼짐'}"><span class="knob"></span></button></div>
    <p class="faint" style="font-size:11.5px;margin-top:-6px">${evPopOn()?'만신전이 열리면 화면 가운데에 안내 창을 띄웁니다.':'만신전 안내 창을 띄우지 않습니다(전광판에는 표시).'}</p>
    <div class="stack" style="gap:6px;border-top:1px solid var(--rule);padding-top:10px"><span class="faint" style="font-size:12px">사운드</span>
    ${Object.keys(SND_LABEL).map(k=>{const v=Math.round(sndVol(k)*100);return `<div class="sndrow"><button class="ibtn sm" data-act="snd-mute" data-k="${k}" data-tip="${v?'음소거':'소리 켜기'}" aria-label="${SND_LABEL[k]} ${v?'음소거':'소리 켜기'}">${v?TICON.vol:TICON.mute}</button><label for="snd-${k}">${SND_LABEL[k]}</label><input type="range" id="snd-${k}" data-snd="${k}" min="0" max="100" step="1" value="${v}"><span class="num" id="snd-${k}-v">${v}</span></div>`;}).join('')}</div>
    <div class="row" style="justify-content:space-between;border-top:1px solid var(--rule);padding-top:10px"><span class="faint" style="font-size:12px">계정 · ${esc(S.me.name)}</span>
      ${S.sel.confirmDel?`<div class="errs" style="font-size:12.5px">캐릭터와 진행 기록, 우편함이 모두 삭제되고 되돌릴 수 없습니다.<div class="row" style="margin-top:8px"><button class="btn btn-sm btn-danger" data-act="acc-del-yes">계정 삭제</button><button class="btn btn-sm btn-ghost" data-act="acc-del-no">취소</button></div></div>`
      :`<div class="row" style="gap:6px"><button class="ibtn" data-act="acc-logout" data-tip="로그아웃" aria-label="로그아웃">${TICON.logout}</button><button class="ibtn danger" data-act="acc-del" data-tip="계정 삭제" aria-label="계정 삭제">${TICON.trash}</button></div>`}</div></div>`;
}
const ASK_CAT=['계정','전투','퀘스트','버그 신고','기타'];
function askBody(){
  const mine=(S.inquiries||[]).filter(q=>q.by===S.me.name).sort((a,b)=>b.ts-a.ts);
  return `<form class="stack" style="gap:6px" data-form="ask"><div class="row"><select id="ask-cat" aria-label="문의 분류">${ASK_CAT.map(c=>`<option>${c}</option>`).join('')}</select><span class="faint num" style="font-size:12px;margin-left:auto" id="ask-count">0/500</span></div>
      <textarea id="ask-text" rows="3" maxlength="500" placeholder="문의 내용을 적어 주세요" style="font-family:var(--f-body);font-size:13px"></textarea>
      <div><button class="btn btn-sm btn-primary" type="submit">문의 보내기</button></div></form>
    <div class="stack" style="gap:6px;margin-top:10px;border-top:1px solid var(--rule);padding-top:10px"><span class="faint" style="font-size:12px">내 문의 ${mine.length}건${mine.length>2?' · 최근 2건':''}</span>
    ${mine.slice(0,2).map(q=>`<div class="askitem"><div class="row" style="justify-content:space-between"><span class="chip dim">${esc(q.cat)}</span><span class="chip ${q.answer?'ok':'warn'}">${q.answer?'답변 완료':'답변 대기'}</span></div><p style="font-size:13px;margin-top:6px">${esc(q.text)}</p>${q.answer?`<p class="askans">운영자 · ${esc(q.answer)}</p>`:''}<span class="faint" style="font-size:11.5px">${fmtWhen(q.ts)}</span></div>`).join('')||'<p class="empty">보낸 문의가 없습니다.</p>'}</div>`;
}
document.addEventListener('input',e=>{if(!S)return;
  const k=e.target.dataset&&e.target.dataset.snd;
  if(k){S.settings=S.settings||{};S.settings[k]=+e.target.value;const o=$('#snd-'+k+'-v');if(o)o.textContent=e.target.value;if(k==='bgm'){audio();updateBgm();}save();}
  if(e.target.id==='ask-text'){const n=$('#ask-count');if(n)n.textContent=e.target.value.length+'/500';}
});
document.addEventListener('change',e=>{const k=e.target.dataset&&e.target.dataset.snd;if(k==='click')playClick();if(k==='alarm')playAlarm();if(k){const row=e.target.closest('.sndrow');if(row)renderPop();}});
function vLogin(){
  return `<div class="wrap"><div class="create" style="align-items:center;text-align:center;max-width:420px">
    <img class="biglogo" src="${LOGO}" alt="BLESET SAGA" style="margin:0 auto"><div class="sub">블레셋 전기</div>
    <p class="muted">로그아웃했습니다. 진행 기록은 이 브라우저에 그대로 남아 있습니다.</p>
    <div class="panel stack" style="text-align:left"><span class="faint" style="font-size:12px">저장된 블레서</span><div class="row" style="gap:10px">${sigil(S.me.job,'sm')}<div><b style="color:var(--silver)">${esc(S.me.name)}</b><div class="muted" style="font-size:12.5px">${className(S.me.job)} · LV${S.me.level}</div></div></div>
    <button class="btn btn-primary" data-act="acc-login">접속하기</button></div></div></div>`;
}

/* ───────── 거래소 ───────── */
const DEFAULT_MARKET=[{id:'mk1',item:'potion',price:30,sell:12,stock:null},{id:'mk2',item:'holywater',price:40,sell:16,stock:null},{id:'mk3',item:'sword',price:90,sell:35,stock:null},{id:'mk4',item:'leather',price:120,sell:45,stock:null},{id:'mk5',item:'bow',price:480,sell:150,stock:3},{id:'mk6',item:'staff',price:420,sell:130,stock:3},{id:'mk7',item:'swiftdraft',price:50,sell:20,stock:null},{id:'mk8',item:'windanklet',price:280,sell:100,stock:5}];
function market(){if(!S.data.market)S.data.market=clone(DEFAULT_MARKET);return S.data.market;}
const SELL_RATE=0.8;
function buyPrice(k){const l=market().find(x=>x.item===k);return l?l.price:((ITEMS[k]&&ITEMS[k].price)||60);}
function sellPrice(k){return Math.round(buyPrice(k)*SELL_RATE*(1+enhOf(k)*0.15));}
function vMarket(){
  const tab=S.sel.mkTab||'buy';const adm=isAdmin();const L=market();
  const sellable=Object.entries(S.me.inv).filter(([k,n])=>n>0&&ITEMS[k]&&availItem(k)>0);
  return `<div class="wrap page"><div class="page-head"><div><h2>거래소<small class="en">Market</small></h2><p>운영진이 올린 아이템을 사고, 가진 아이템을 거래소에 팔 수 있습니다. 유저끼리는 거래할 수 없습니다.</p></div><div class="row">${goldHTML(S.me.gold)}</div></div>
    <div class="seg">${[['buy','구매'],['sell','판매'],...(adm?[['admin','등록 관리']]:[])].map(([k,l])=>`<button data-act="mk-tab" data-tab="${k}" aria-pressed="${tab===k}">${l}</button>`).join('')}</div>
    ${tab==='buy'?`<div class="mkgrid">${L.filter(x=>ITEMS[x.item]&&!ITEMS[x.item].off).length?L.map(x=>{const it=ITEMS[x.item];if(!it||it.off)return '';const out=x.stock===0;return `<div class="panel mkcard"><div class="row" style="gap:10px"><img class="mkimg" src="${ITEM_IMG}" alt=""><div class="t" style="min-width:0"><b>${esc(it.name)}</b><small class="faint">${typeLabel(it)}${x.stock!=null?` · 재고 ${x.stock}`:''}</small></div></div>
        ${it.stats?`<span class="bpill eqb sm" style="align-self:flex-start">${statText(it.stats)}</span>`:''}<p class="muted" style="font-size:12.5px">${esc(it.desc)}</p>${reqText(it)?`<small class="faint">${esc(reqText(it))}</small>`:''}
        <div class="row" style="justify-content:space-between;margin-top:auto">${goldHTML(x.price)}<button class="btn btn-sm btn-primary" data-act="mk-buy" data-id="${x.id}" ${out||S.me.gold<x.price?'disabled':''}>${out?'품절':S.me.gold<x.price?'골드 부족':'구매'}</button></div></div>`;}).join(''):'<p class="empty">판매 중인 아이템이 없습니다.</p>'}</div>`:''}
    ${tab==='sell'?`<div class="panel"><div class="list">${sellable.length?sellable.map(([k,n])=>`<div class="li"><div class="row" style="gap:10px;flex:1;min-width:0"><img class="mkimg sm" src="${ITEM_IMG}" alt=""><div class="t"><b>${itemNameH(k)}</b> <span class="faint num">×${availItem(k)}</span><small>${typeLabel(ITEMS[k])}${enhOf(k)?' · 강화 단계만큼 매입가가 오릅니다':''}</small></div></div><span class="row" style="gap:8px">${goldHTML(sellPrice(k))}<button class="btn btn-sm" data-act="mk-sell" data-id="${k}">판매</button></span></div>`).join(''):'<p class="empty">팔 수 있는 아이템이 없습니다. 착용 중인 장비는 팔 수 없습니다.</p>'}</div></div>`:''}
    ${tab==='admin'&&adm?mkAdmin():''}</div>`;
}
function mkAdmin(){
  const L=market();
  return `<div class="panel"><h3>거래소 등록</h3><form class="form" data-form="mk-add">
      <label>아이템<select id="mk-item">${Object.entries(ITEMS).map(([k,i])=>`<option value="${k}">${i.name}</option>`).join('')}</select></label>
      <label>판매가 (구매 가격)<input type="number" id="mk-price" min="1" value="100"></label>
      <label>재고 (빈칸 = 무제한)<input type="number" id="mk-stock" min="0" placeholder="무제한"></label>
      <div class="wide"><button class="btn btn-primary" type="submit">등록</button></div></form>
    <div class="tbl-wrap" style="margin-top:14px"><table><thead><tr><th>아이템</th><th class="n">판매가</th><th class="n">판매 시 (80%)</th><th class="n">재고</th><th></th></tr></thead><tbody>
    ${L.map(x=>`<tr><td>${ITEMS[x.item]?esc(ITEMS[x.item].name):x.item}${ITEMS[x.item]&&ITEMS[x.item].off?' <span class="aim-off">OFF</span>':''}</td><td class="n"><input type="number" class="mk-ed" data-id="${x.id}" data-f="price" value="${x.price}" min="1" style="width:84px"></td><td class="n">${Math.round(x.price*SELL_RATE)}</td><td class="n"><input type="number" class="mk-ed" data-id="${x.id}" data-f="stock" value="${x.stock==null?'':x.stock}" min="0" placeholder="∞" style="width:70px"></td><td><button class="btn btn-sm btn-ghost btn-danger" data-act="mk-del" data-id="${x.id}">내리기</button></td></tr>`).join('')||'<tr><td colspan="5" class="muted">등록된 아이템이 없습니다.</td></tr>'}</tbody></table></div>
    <p class="faint" style="font-size:12px;margin-top:8px">값을 고치면 바로 저장됩니다.</p></div>`;
}
/* ───────── 아이템 관리 ───────── */
const ITEM_DEFAULTS=JSON.parse(JSON.stringify(ITEMS));
function loadItems(){S.data.items=S.data.items||{};for(const id in S.data.items)ITEMS[id]=S.data.items[id];(S.data.itemsDeleted||[]).forEach(id=>{if(!S.data.items[id])delete ITEMS[id];});}
function classAllowed(it,job){if(it.wtype)return (CLASS_WEAPON[job]||[]).includes(it.wtype);if(!it.classReq||!it.classReq.length)return true;const c=CLASSES[job];return it.classReq.includes(job)||(c.base&&it.classReq.includes(c.base));}
function itemBlock(k){const it=ITEMS[k];if(!it)return '알 수 없는 아이템';if(it.levelReq&&S.me.level<it.levelReq)return `LV${it.levelReq} 이상 사용 가능`;if(!classAllowed(it,S.me.job))return it.wtype?`${CLASSES[S.me.job].name}의 무기가 아닙니다 · ${WTYPE[it.wtype]}`:`${it.classReq.map(c=>CLASSES[c].name).join('·')} 전용`;return null;}
function typeLabel(it){return it.type==='equip'?SLOT[it.slot]:it.rod?'소모품':it.type==='mat'?'재료':it.type==='deco'?'장식품':'소모품';}
function reqText(it){const r=[];if(it.levelReq)r.push(`LV${it.levelReq}+`);if(it.wtype)r.push(`${WTYPE[it.wtype]} · ${Object.keys(CLASS_WEAPON).filter(c=>CLASS_WEAPON[c].includes(it.wtype)).map(c=>CLASSES[c].name).join('·')}`);if(it.classReq&&it.classReq.length)r.push(it.classReq.map(c=>CLASSES[c].name).join('·')+' 전용');if(it.maxOwn)r.push(`1인 최대 ${it.maxOwn}개`);return r.join(' · ');}
function addItem(k,n){const it=ITEMS[k];if(!it)return 0;const have=S.me.inv[k]||0;const room=it.maxOwn?Math.max(0,it.maxOwn-have):n;const add=Math.min(n,room);if(add>0)S.me.inv[k]=have+add;if(add<n)toast(`${it.name}은(는) 1인 최대 ${it.maxOwn}개까지 가질 수 있어 ${n-add}개는 받지 못했습니다.`,'warn');return add;}
function adminItems(){
  const ids=Object.keys(ITEMS);const id=S.sel.ai&&ITEMS[S.sel.ai]?S.sel.ai:ids[0];S.sel.ai=id;const it=ITEMS[id];const st=it.stats||{};const bf=it.buff||{};
  const grp=[['weapon','무기'],['armor','방어구'],['acc','장신구'],['use','소모품'],['mat','재료']];
  return `<div class="aiwrap"><nav class="panel aimenu" aria-label="아이템 목록"><div class="row" style="justify-content:space-between;margin-bottom:6px"><span class="ph" style="margin:0">아이템</span><button class="link" data-act="ai-new">+ 새 아이템</button></div>
    ${grp.map(([g,gl])=>{const L=ids.filter(k=>(ITEMS[k].type==='use'?'use':ITEMS[k].type==='mat'?'mat':ITEMS[k].slot)===g);return L.length?`<div class="aim-g">${gl}</div>${L.map(k=>`<button class="aim ${k===id?'on':''} ${ITEMS[k].off?'off':''}" data-act="ai-pick" data-id="${k}" ${k===id?'aria-current="true"':''}>${esc(ITEMS[k].name)}${ITEMS[k].off?'<span class="aim-off">OFF</span>':''}</button>`).join('')}`:'';}).join('')}</nav>
    <div class="aimain">    <form class="aiform" data-form="ai-save" data-id="${id}">
      <div class="panel"><h3><span>${esc(it.name)} · 기본 정보 <span class="faint" style="letter-spacing:0;text-transform:none;font-weight:400">id: ${id}</span></span><span class="row" style="gap:8px;letter-spacing:0;text-transform:none"><span style="font-size:12px;color:var(--muted);font-weight:400">상점 노출</span><button type="button" class="switch" role="switch" aria-checked="${!it.off}" data-act="ai-off" data-id="${id}" aria-label="거래소 노출 ${it.off?'꺼짐':'켜짐'}"><span class="knob"></span><span class="sw-t">${it.off?'OFF':'ON'}</span></button><button type="button" class="btn btn-sm btn-danger" data-act="ai-delask" data-id="${id}">삭제</button></span></h3><div class="form">
      <label>이름<input type="text" id="ai-name" maxlength="20" value="${esc(it.name)}" required></label>
      <label>종류<select id="ai-type"><option value="equip" ${it.type==='equip'?'selected':''}>장비</option><option value="use" ${it.type==='use'?'selected':''}>소모품</option><option value="mat" ${it.type==='mat'?'selected':''}>재료</option></select></label>
      <label>장비 부위<select id="ai-slot">${Object.entries(SLOT).map(([k,v])=>`<option value="${k}" ${it.slot===k?'selected':''}>${v}</option>`).join('')}</select></label>
      <label>레벨 제한 (이상)<input type="number" id="ai-lv" min="1" max="99" value="${it.levelReq||''}" placeholder="제한 없음"></label>
      <label>1인 수량 제한<input type="number" id="ai-max" min="1" value="${it.maxOwn||''}" placeholder="제한 없음"></label>
      <label>기준 가격<input type="number" id="ai-price" min="0" value="${it.price||''}" placeholder="없음"></label>
      </div></div>
      <div class="ai-two"><div class="panel"><h3>장비 능력치</h3><div class="form">
      ${['maxHp','atk','mag','def','luk'].map(k=>`<label>장비 ${STATK[k]}<input type="number" id="ai-st-${k}" value="${st[k]||''}" placeholder="0"></label>`).join('')}
      </div></div><div class="panel"><h3>사용 효과 · 소모품</h3><div class="form">
      <label>사용 효과 능력치<select id="ai-bstat"><option value="">없음</option>${['maxHp','atk','def','luk'].map(k=>`<option value="${k}" ${bf.stat===k?'selected':''}>${STATK[k]}</option>`).join('')}</select></label>
      <label>사용 효과 수치<input type="number" id="ai-bval" value="${bf.val||''}" placeholder="0"></label>
      <label>사용 효과 시간(분)<input type="number" id="ai-bmin" min="1" value="${bf.min||''}" placeholder="10"></label>
      </div></div></div>
      <div class="panel"><div class="wide clsbox"><div class="clsbox-h">클래스 제한 <span class="faint">선택하지 않으면 모든 클래스 · 기본 클래스를 고르면 전직 클래스도 포함</span></div>
        <div class="tbl-wrap"><table class="clstbl"><thead><tr><th></th>${Object.entries(CLASSES).filter(([,c])=>c.tier===1).map(([,bc])=>`<th style="color:var(--${bc.role})">${bc.name} 계열</th>`).join('')}</tr></thead><tbody>
        ${['기본','전직 1','전직 2'].map((lab,r)=>`<tr><th>${lab}</th>${Object.entries(CLASSES).filter(([,c])=>c.tier===1).map(([b,bc])=>{const k=r===0?b:bc.adv[r-1];return `<td>${k?`<label class="ckline"><input type="checkbox" class="ai-cls" value="${k}" ${(it.classReq||[]).includes(k)?'checked':''}>${CLASSES[k].tier===2?'★ ':''}${CLASSES[k].name}</label>`:'<span class="faint">—</span>'}</td>`;}).join('')}</tr>`).join('')}
        </tbody></table></div></div></div>
      <div class="panel"><div class="form">
      <label class="wide">설명<textarea id="ai-desc" rows="2" style="font-family:var(--f-body);font-size:13px">${esc(it.desc||'')}</textarea></label>
      <div class="wide row"><button class="btn btn-primary" type="submit">저장하고 공개</button>${ITEM_DEFAULTS[id]?`<button class="btn btn-ghost" type="button" data-act="ai-reset" data-id="${id}">기본값으로</button>`:''}<span class="faint" style="font-size:12px">레이드 중 회복약·정화의 성수 효과는 고정이며, 여기서는 평소 사용 효과를 설정합니다.</span></div>
      </div></div>
    </form></div></div>`;
}
/* ───────── 강화 ───────── */
const ENH_FAIL={7:0.2,8:0.3,9:0.4,10:0.5};
const enhCost=lv=>40*lv+(lv>=7?60*(lv-6):0);
function enhHTML(id,res){
  const it=ITEMS[id];const lv=enhOf(id);const nx=lv+1;const max=lv>=ENH_MAX;
  const cur=itemStats(id,lv),nxt=itemStats(id,Math.min(nx,ENH_MAX));const fail=Math.min(1,(ENH_FAIL[nx]||0)+(guildRain('craft')?RAIN_FAIL:0));const cost=enhCost(nx);
  return `<div class="enh"><div class="row" style="justify-content:space-between"><h3>장비 강화</h3><button class="btn btn-sm btn-ghost" data-act="enh-close">닫기</button></div>
    <div class="enh-item ${res?'r-'+res:''}"><img src="${ITEM_IMG}" alt=""><div><b>${esc(it.name)}</b> <span class="enh-lv num">+${lv}</span><small class="faint">${SLOT[it.slot]} · 최대 +${ENH_MAX}</small></div></div>
    <div class="enh-pips" aria-label="강화 단계 ${lv}/${ENH_MAX}">${Array.from({length:ENH_MAX},(_,i)=>`<span class="${i<lv?'on':''} ${i>=6?'risk':''}"></span>`).join('')}</div>
    ${res?`<p class="enh-res ${res}">${res==='ok'?`강화 성공 · +${lv}`:`강화 실패 · +${lv} 유지`}</p>`:''}
    ${max?'<p class="ok-t">최대 강화 단계에 도달했습니다.</p>':`<div class="enh-cmp">${Object.keys(cur).map(k=>`<div><span class="faint">${STATK[k]}</span><span class="num">${cur[k]}</span><span class="faint">→</span><b class="num">${nxt[k]}</b></div>`).join('')}</div>
      <dl class="kv num"><dt>다음 단계</dt><dd>+${nx}</dd><dt>성공 확률</dt><dd style="color:${fail?'var(--warn)':'var(--ok)'}">${Math.round((1-fail)*100)}%</dd><dt>비용</dt><dd>${goldHTML(cost)}</dd><dt>보유 골드</dt><dd>${goldHTML(S.me.gold)}</dd></dl>
      ${fail?`<p class="reason" style="font-size:12.5px">+7 이후 단계는 실패할 수 있습니다. 실패하면 골드만 사라지고 단계는 유지됩니다.</p>`:''}
      <div class="row" style="justify-content:flex-end"><button class="btn btn-primary" data-act="enh-do" data-id="${id}" ${S.me.gold<cost?'disabled':''}>${S.me.gold<cost?'골드 부족':`+${nx} 강화`}</button></div>`}</div>`;
}
function openEnh(id,res){modal(enhHTML(id,res));const mm=$('.modal');if(mm)mm.classList.add('narrow2');}
