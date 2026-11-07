'use strict';
/* ══ 메인 화면: 바로가기 패널 · 화면 높이 맞춤 (유저 요청 2026-11-07) ══════════════
   ① 바로가기(가운데 단락, 다음 목표와 모집 파티 사이): 8칸, [편집]을 누르면 칸마다 페이지를 고름(검색 + 묶음 목록).
      고를 수 있는 것 = 탭으로 나뉜 페이지(상단 메뉴 · 세계관/퀘스트/레이드/캐릭터/거래소 탭 · 공방 제작/요리/연금 · 탐색 지역 8곳).
      몬스터 상세·파티 만들기처럼 탭이 아닌 화면은 넣지 않음. 저장 S.me.scut=[8칸 id].
   ② 화면 높이 맞춤(데스크톱 >980px, 3단 화면 전부 — 아래 설명): 세 칸의 아래 끝을 화면 아래(또는 가장 긴 칸)에 맞춤.
      왼쪽 캐릭터 카드·가운데 마지막 패널(모집 파티)은 빈 공간으로 늘리고, 오른쪽은 채팅이 남은 높이를 채움 →
      주간 미션·기록을 펼치면 채팅이 줄어들고, 채팅이 최소(300px)보다 작아지면 세 칸이 함께 길어짐. */
const SC_N=8;
const SC_DEFAULT=['explore:map','battle:daily','battle:dungeon','character:equip','character:craft','market:buy','community','lore:world'];
const SC_REGION_IC='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="12" cy="10" r="2.3" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
/* 고를 수 있는 페이지 [id, 이름, 묶음, 아이콘 키] — 지금 열려 있는 것만 */
function scPages(){const L=[['main','메인','메인','main']];
  [['now','현재'],['world','세계관'],['class','클래스']].forEach(([k,l])=>L.push(['lore:'+k,l,'세계관','lore']));
  if(!(typeof questHidden==='function'&&questHidden()))[['epic','메인 스토리'],['sub','서브 스토리'],['repeat','데일리'],['archive','서고']].forEach(([k,l])=>L.push(['quest:'+k,l,'퀘스트','quest']));
  L.push(['explore:map','월드맵','탐색','explore']);Object.keys(LANDS).forEach(k=>L.push(['explore:'+k,LANDS[k],'탐색 · 지역','region']));
  RTABS.filter(([k])=>k!=='weekly'||!weeklyClosed()).forEach(([k,l])=>L.push(['battle:'+k,l,'레이드','battle']));
  [['info','정보'],['equip','장비'],['craft','공방'],['dex','도감'],['log','탐사 기록'],['chron','연대기']].forEach(([k,l])=>L.push(['character:'+k,l,'캐릭터',k==='craft'?'cf:craft':'character']));
  ['craft','cook','alch'].forEach(k=>L.push(['craft:'+k,(PROF[k]&&PROF[k].btn)||k,'공방','cf:'+k]));
  L.push(['market:buy','구매','거래소','market'],['market:sell','판매','거래소','market']);if(isAdmin())L.push(['market:admin','등록 관리','거래소','market']);
  L.push(['community','커뮤니티','커뮤니티','community']);return L;}
function scFind(id){return scPages().find(p=>p[0]===id);}
function scIcon(k){if(k==='region')return SC_REGION_IC;if(k.startsWith('cf:'))return (typeof CF_IC!=='undefined'&&CF_IC[k.slice(3)])||QB_ICON.character;return QB_ICON[k]||'';}
function scSlots(){const q=S.me.scut;const a=Array.isArray(q)&&q.length===SC_N?q.slice():SC_DEFAULT.slice();return a;}
function scOn(id){const[r,t]=String(id).split(':');
  if(r==='main')return S.route==='main';
  if(r==='explore')return S.route==='explore'&&(t==='map'?!S.sel.exLand:S.sel.exLand===t);
  if(r==='battle')return S.route==='battle'&&!S.sel.monster&&(S.sel.rtab||'dungeon')===t;
  if(r==='character')return S.route==='character'&&(S.sel.ctab||'info')===t;
  if(r==='lore')return S.route==='lore'&&(S.sel.ltab||'now')===t;
  if(r==='quest')return S.route==='quest'&&(S.sel.qtab||'epic')===t;
  if(r==='market')return S.route==='market'&&(S.sel.mkTab||'buy')===t;
  return S.route===r;}
function scGo(id){const p=scFind(id);if(!p){toast('지금은 열 수 없는 페이지입니다.','warn');return;}const[r,t]=id.split(':');
  if(r==='main'||r==='community'){go(r);return;}
  if(r==='lore'){go('lore',{ltab:t});return;}
  if(r==='quest'){go('quest',{qtab:t});return;}
  if(r==='explore'){S.sel.exFocus='';S.sel.exLand=t==='map'?null:t;go('explore');return;}
  if(r==='battle'){go('battle',{rtab:t,monster:null});return;}
  if(r==='character'){go('character',{ctab:t});return;}
  if(r==='craft'){go('character',{ctab:'craft'});ACTS['cf-open']({kind:t});return;}
  if(r==='market'){go('market',{mkTab:t});return;}}
function scutPanel(){const Q=scSlots(),ed=!!S.sel.scEdit;
  return `<div class="panel scut ${ed?'editing':''}"><h3>${hTitle('bolt','바로가기')}<button class="scut-ed" data-act="sc-edit" aria-pressed="${ed}">${ed?'완료':'편집'}</button></h3>
    <div class="scut-g">${Q.map((id,i)=>{const p=id&&scFind(id);
      if(!p)return `<button class="scut-s empty" data-act="sc-pick" data-i="${i}" aria-label="${i+1}번 칸에 바로가기 추가"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6v12M6 12h12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg><span class="scut-l"><b>${ed?'추가':'빈 칸'}</b></span></button>`;
      return `<button class="scut-s ${!ed&&scOn(id)?'on':''}" data-act="${ed?'sc-pick':'sc-go'}" data-i="${i}" data-id="${id}" title="${esc(p[2]+' › '+p[1])}" aria-label="${ed?`${i+1}번 칸 바꾸기 · 지금 ${p[1]}`:`${p[2]} ${p[1]} 바로가기`}">${scIcon(p[3])}<span class="scut-l"><b>${esc(p[1])}</b><small>${esc(p[2])}</small></span>${ed?'<i class="scut-x" aria-hidden="true">✎</i>':''}</button>`;}).join('')}</div></div>`;}
function scPickDlg(i){const Q=scSlots();const P=scPages();const groups=[];P.forEach(p=>{let g=groups.find(x=>x[0]===p[2]);if(!g)groups.push(g=[p[2],[]]);g[1].push(p);});
  return `<div class="ndlg sc-dlg"><div class="row" style="justify-content:space-between"><h3>${i+1}번 칸 바로가기</h3><button class="btn btn-sm btn-ghost" data-act="closemodal">닫기</button></div>
    <input id="sc-q" class="sc-q" type="search" placeholder="페이지 검색 (예: 공방, 초원, 던전)" autocomplete="off" aria-label="페이지 검색">
    <div class="sc-list">${groups.map(([g,ps])=>`<div class="sc-grp" data-g="${esc(g)}"><div class="sc-gh">${esc(g)}</div><div class="sc-opts">${ps.map(p=>`<button class="sc-opt ${Q[i]===p[0]?'on':''}" data-act="sc-set" data-i="${i}" data-id="${p[0]}" data-q="${esc((p[1]+' '+p[2]).toLowerCase())}">${scIcon(p[3])}<span>${esc(p[1])}</span></button>`).join('')}</div></div>`).join('')}
      <p class="faint sc-none" hidden>찾는 페이지가 없습니다.</p></div>
    ${Q[i]?`<div class="row" style="justify-content:flex-end"><button class="btn btn-sm btn-ghost" data-act="sc-set" data-i="${i}" data-id="">이 칸 비우기</button></div>`:''}</div>`;}
function scFilter(){const q=(($('#sc-q')||{}).value||'').trim().toLowerCase().replace(/\s+/g,' ');let any=false;
  $$('.sc-grp').forEach(g=>{let n=0;g.querySelectorAll('.sc-opt').forEach(b=>{const ok=!q||q.split(' ').every(w=>b.dataset.q.includes(w)||g.dataset.g.toLowerCase().includes(w));b.hidden=!ok;if(ok)n++;});g.hidden=!n;if(n)any=true;});
  const no=$('.sc-none');if(no)no.hidden=any;}
document.addEventListener('input',e=>{if(e.target&&e.target.id==='sc-q')scFilter();});
Object.assign(ACTS,{
  'sc-go':d=>scGo(d.id),
  'sc-edit':()=>{S.sel.scEdit=!S.sel.scEdit;render();},
  'sc-pick':d=>{modal(scPickDlg(+d.i));const mm=$('.modal');if(mm)mm.classList.add('sc-m');const q=$('#sc-q');if(q&&matchMedia('(pointer:fine)').matches)q.focus();},
  'sc-set':d=>{const Q=scSlots();Q[+d.i]=d.id||'';S.me.scut=Q;save();modal('');render();},
  'sky-land':d=>{if(!LANDS[d.land])return;S.sel.exLand=d.land;S.sel.exFocus='';go('explore');}
});
/* 메인 가운데: 다음 목표 아래 · 모집 파티 위 */
vMain=function(){return `<div class="main-c">${ticker()}${skyBar()}${nextGoalHTML()}${scutPanel()}${recruitPanel()}</div>`;};

/* ── 화면 높이 맞춤 (데스크톱 >980px, 3단 화면 전부) ──
   T = 화면 아래(첫 화면 기준). 왼쪽·오른쪽 칸은 높이 T(내용이 더 길면 그만큼) + sticky → 긴 페이지에서도 화면을 꽉 채운 채 따라옴.
   가운데는 '각 세로줄의 맨 아래 패널'을 아래 끝까지 늘림(빈 공간). 늘렸더니 패널이 아닌 내용이 밀려나면 되돌림.
   전투 화면(진행 중)은 건드리지 않음. */
const FIT_SEL='.panel,.page-head,.skybar,.ticker';
function fitClear(){$$('[data-fit]').forEach(e=>{e.style.minHeight='';e.style.height='';delete e.dataset.fit;});}
function fitMainCols(){if(typeof getComputedStyle!=='function')return;fitClear();
  const W=$('.wrap.tri'),L=$('.tri-l'),R=$('.tri-r'),C=$('.tri-c');const card=L&&L.firstElementChild;
  if(!W||!L||!R||!C||innerWidth<=980)return;
  if(S.route==='battle'&&(S.battle||S.drun))return;
  const y=window.scrollY,R0=el=>el.getBoundingClientRect(),top=el=>R0(el).top+y,bot=el=>R0(el).bottom+y;
  const pb=parseFloat(getComputedStyle(W).paddingBottom)||0;const T0=innerHeight-pb;
  /* 가운데가 화면보다 조금(화면 높이 절반 이내) 길면 양옆도 그 길이까지 → 세 칸 아래 끝이 같음. 훨씬 길면 양옆은 화면 높이로 따라옴(sticky) */
  const cb0=bot(C);const side=Math.round(Math.max(T0,bot(L),bot(R),cb0<=T0+innerHeight*.5?cb0:0));
  const set=(el,k,v)=>{el.style[k]=Math.max(0,Math.round(v))+'px';el.dataset.fit='1';};
  set(L,'height',side-top(L));if(card)set(card,'minHeight',side-top(card));set(R,'height',side-top(R));
  /* 가운데: 겹치지 않는 맨 아래 패널들 */
  const cb=cb0;const target=Math.max(side,cb);
  const all=[...C.querySelectorAll(FIT_SEL)].filter(e=>e.offsetParent&&!e.parentElement.closest(FIT_SEL)&&R0(e).height>0);
  /* 목록의 한 줄(접는 칸·같은 모양이 3개 이상 늘어선 것)은 늘리지 않음 — 마지막 줄만 커져 어색해짐 */
  const rowLike=e=>e.tagName==='DETAILS'||[...e.parentElement.children].filter(x=>x.tagName===e.tagName&&x.classList[0]===e.classList[0]).length>=3;
  const lows=all.filter(p=>{const a=R0(p);return !all.some(q=>{if(q===p)return false;const b=R0(q);return b.top>=a.bottom-2&&Math.min(a.right,b.right)-Math.max(a.left,b.left)>8;});});
  if(target<=cb+1||!lows.length||lows.some(rowLike))return;
  const gap=cb-Math.max(...lows.map(bot));/* 패널 아래 여백(페이지 안쪽 여백)은 그대로 */
  lows.forEach(p=>set(p,'minHeight',R0(p).height+(target-gap-bot(p))));
  if(bot(C)>target+2)lows.forEach(p=>{p.style.minHeight='';delete p.dataset.fit;});}
fitSideChat=fitMainCols;
/* 오른쪽 칸 접기·펼치기(주간 미션·기록 등)가 끝난 뒤 한 번 더 — 채팅이 최소보다 작아지면 세 칸을 함께 늘리고, 줄어들면 다시 화면에 맞춤 */
function fitLater(ms){clearTimeout(fitMainCols.t);fitMainCols.t=setTimeout(()=>{try{fitMainCols();}catch(_){}},ms);}
document.addEventListener('click',e=>{if(S&&e.target.closest&&e.target.closest('#view'))fitLater(380);});
/* 그림(월드맵·초상 등)이 늦게 뜨면 높이가 바뀌므로 다시 */
document.addEventListener('load',e=>{if(e.target&&e.target.tagName==='IMG'&&e.target.closest&&e.target.closest('#view'))fitLater(60);},true);
/* 팝업이 열리고 닫힐 때(스크롤바가 생기고 없어지며 폭·높이가 바뀜) 다시 맞춤 */
(function(){const m=document.getElementById&&document.getElementById('modal');if(m&&typeof MutationObserver==='function')new MutationObserver(()=>fitLater(80)).observe(m,{childList:true});})();
