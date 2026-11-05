'use strict';
/* 운영 페이지 · 공통 (백엔드 담당)
   게임과 같은 Supabase 프로젝트·같은 로그인(같은 주소라 게임에서 로그인했으면 그대로 이어짐).
   운영자(app_metadata.role = 'admin')만 들어올 수 있고, 실제 권한 검사는 DB(RLS·운영 함수)가 한다. */
const ADM_URL='https://ktuhkiihrnawcpwpqwdl.supabase.co',ADM_KEY='sb_publishable_ITKnRBBzkYweQl1htyVoWQ_0w-P4H7o';
const ADM_DOMAIN='blesetsaga.vercel.app';
const A={sb:null,user:null,tab:'home',names:{},badge:{}};   // 페이지 상태

/* ── 작은 도구 ── */
const $=(s,r)=>(r||document).querySelector(s);
const $$=(s,r)=>[...(r||document).querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=o=>o==null?o:JSON.parse(JSON.stringify(o));
const pretty=o=>JSON.stringify(o,null,2);
function fmtTime(t,withYear){if(!t)return '—';const d=new Date(t);if(isNaN(d))return '—';
  const p=n=>String(n).padStart(2,'0');const k=new Date(d.getTime()+9*3600e3);   // 한국 시간
  return `${withYear?k.getUTCFullYear()+'-':''}${p(k.getUTCMonth()+1)}-${p(k.getUTCDate())} ${p(k.getUTCHours())}:${p(k.getUTCMinutes())}`;}
function ago(t){if(!t)return '—';const s=(Date.now()-new Date(t))/1000;if(s<60)return '방금';if(s<3600)return Math.floor(s/60)+'분 전';if(s<86400)return Math.floor(s/3600)+'시간 전';if(s<86400*30)return Math.floor(s/86400)+'일 전';return fmtTime(t,true);}
// <input type=datetime-local> ↔ ISO (한국 시간 기준으로 입력)
function toLocalInput(t){if(!t)return '';const k=new Date(new Date(t).getTime()+9*3600e3);return k.toISOString().slice(0,16);}
function fromLocalInput(v){if(!v)return null;const d=new Date(v+':00+09:00');return isNaN(d)?null:d.toISOString();}

function toast(text,kind){const el=document.createElement('div');el.className='toast '+(kind||'');el.textContent=text;$('#toasts').appendChild(el);setTimeout(()=>el.remove(),kind==='bad'?6000:3200);}
function modal(html){const m=$('#modal');if(!html){m.innerHTML='';return;}
  m.innerHTML=`<div class="modal-bg" data-close><div class="modal" role="dialog" aria-modal="true">${html}</div></div>`;
  $('.modal-bg',m).addEventListener('click',e=>{if(e.target.hasAttribute('data-close')||e.target.closest('[data-close-btn]'))modal(null);});
  const f=$('input,textarea,select,button.btn-p',m);if(f)f.focus();}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('#modal').innerHTML)modal(null);});
// 확인 창: 돌려주는 값 true/false
function ask(title,body,okLabel,danger){return new Promise(res=>{
  modal(`<h3>${esc(title)}</h3><div class="muted" style="font-size:13px;margin-bottom:16px">${body||''}</div>
    <div class="row" style="justify-content:flex-end"><button class="btn btn-g" data-ans="0">취소</button><button class="btn ${danger?'btn-d':'btn-p'}" data-ans="1">${esc(okLabel||'확인')}</button></div>`);
  $$('#modal [data-ans]').forEach(b=>b.onclick=()=>{modal(null);res(b.dataset.ans==='1');});
  $('#modal .modal-bg').addEventListener('click',e=>{if(e.target.hasAttribute('data-close'))res(false);});});}

// DB 오류를 사람 말로
function dbErr(e){const m=(e&&(e.message||e.error_description||e.details))||String(e||'');
  if(/NOT_ADMIN/.test(m))return '운영자 권한이 없습니다. 권한을 받은 뒤에는 다시 로그인해야 합니다.';
  if(/JWT expired|invalid JWT/i.test(m))return '로그인이 만료되었습니다. 새로고침 후 다시 로그인해 주세요.';
  if(/row-level security|permission denied/i.test(m))return '권한이 없어 저장하지 못했습니다.';
  if(/ALREADY_CLAIMED/.test(m))return '이미 받은 우편입니다.';
  if(/NO_DRAFT/.test(m))return '공개할 초안이 없습니다.';
  if(/duplicate key/.test(m))return '이미 있는 id입니다.';
  if(/BAD_CODE/.test(m))return '초대코드는 영문 대문자·숫자·_- 4–32자여야 합니다.';
  if(/NO_SAVE/.test(m))return '이 유저는 서버에 저장된 진행 기록이 없습니다(한 번도 접속해 저장하지 않음).';
  if(/BAD_LEVEL/.test(m))return '레벨은 1~99 사이여야 합니다.';
  if(/Failed to fetch|NetworkError/i.test(m))return '서버에 연결하지 못했습니다. 인터넷 연결을 확인해 주세요.';
  return '문제가 생겼습니다: '+m;}
// supabase 호출 → 오류면 알림 후 null
async function q(p,okMsg){try{const {data,error}=await p;if(error)throw error;if(okMsg)toast(okMsg,'good');return data??true;}catch(e){toast(dbErr(e),'bad');console.warn(e);return null;}}

/* ── 유저 이름표 (id → 아이디/캐릭터 이름) ── */
async function loadNames(){const d=await q(A.sb.from('profiles').select('user_id,username,name'));
  if(d)d.forEach(p=>A.names[p.user_id]=p.name?`${p.name} (${p.username})`:p.username);}
const who=id=>id?esc(A.names[id]||String(id).slice(0,8)):'<span class="faint">시스템</span>';

/* ── 탭 ── */
const IC={home:'<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',content:'<path d="M4 4h16v4H4zM4 10h10v10H4zM16 10h4v10h-4z"/>',players:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18 14.6c2 .7 3.2 2.6 3.6 5.4"/>',mail:'<path d="M3 6h18v12H3z"/><path d="M3 7l9 6 9-6"/>',invites:'<path d="M4 7h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4z"/><path d="M12 7v12" stroke-dasharray="2 2"/>',inbox:'<path d="M4 4h16v12H8l-4 4z"/>',chat:'<path d="M4 5h16v10H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',feed:'<path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h8M8 17h5"/>',lotto:'<circle cx="12" cy="12" r="8"/><path d="M12 8v8M8 12h8"/>',fish:'<path d="M3 12c3-5 9-6 13-3l5-3v12l-5-3c-4 3-10 2-13-3z"/>',guard:'<path d="M12 3l8 3v6c0 5-3.4 8.2-8 9-4.6-.8-8-4-8-9V6z"/><path d="M12 8v5M12 16h.01"/>',log:'<path d="M6 3h9l4 4v14H6z"/><path d="M9 11h7M9 15h7"/>'};
const icon=k=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[k]||''}</svg>`;
// 왼쪽 메뉴 묶음 [묶음 이름, [[탭 id, 이름], …]]
const GROUPS=[['',[['home','홈']]],['콘텐츠',[['content','콘텐츠 편집']]],['유저',[['players','회원'],['mail','우편 보내기'],['invites','초대코드']]],['커뮤니티',[['inbox','문의 · 신고'],['chat','채팅'],['feed','피드']]],['게임 운영',[['lotto','행운권'],['fish','낚시 랭킹']]],['보안',[['guard','부정 의심'],['log','운영 기록']]]];
const TABS=GROUPS.flatMap(g=>g[1]);
const TAB_DESC={content:'몬스터·퀘스트·아이템 등 게임 데이터를 고치고 공개합니다.',players:'가입한 블레서를 찾고 세이브·레벨·정지를 관리합니다.',mail:'전체 또는 골라 둔 블레서에게 골드·아이템이 담긴 우편을 보냅니다.',invites:'새 블레서가 가입할 때 쓰는 코드를 만들고 관리합니다.',inbox:'1:1 문의에 답하고 신고된 글을 처리합니다.',chat:'전체·월드·1:1 채팅을 살피고 문제 메시지를 가립니다.',feed:'커뮤니티 글과 댓글을 살피고 가립니다.',lotto:'주간 행운권 회차·판매·당첨 현황입니다.',fish:'이번 주 지역별 낚시 순위와 지난 주 정산 기록입니다.',guard:'서버가 말이 안 되는 변화를 자르거나 기록한 계정입니다.',log:'운영자가 한 일이 모두 남습니다.'};
const tabLabel=k=>(TABS.find(t=>t[0]===k)||[k,k])[1];
const VIEWS={};   // 탭 id → async render(el)
function tabHTML(k,l){return `${icon(k)}<span class="tl">${l}</span>${A.badge[k]?`<span class="num">${A.badge[k]}</span>`:''}`;}
function shell(){
  const nick=A.names[A.user.id]||A.user.email.split('@')[0];
  const app=$('#app');app.classList.add('shell');app.style.alignContent='start';
  app.innerHTML=`<aside class="side" style="min-width:0">
      <div class="side-brand">블레셋 전기<small>운영 페이지</small></div>
      <nav class="side-nav" role="tablist">${GROUPS.map(([g,it])=>`<div class="nav-g">${g?`<span class="nav-gl">${g}</span>`:''}${it.map(([k,l])=>`<button class="tab" role="tab" data-tab="${k}" aria-selected="${A.tab===k}">${tabHTML(k,l)}</button>`).join('')}</div>`).join('')}</nav>
      <div class="side-me"><span>${esc(nick)}</span><div class="row" style="flex-wrap:nowrap"><a class="btn btn-sm" href="./" target="_blank" rel="noopener">게임 열기</a><button class="btn btn-g btn-sm" id="logout">로그아웃</button></div></div>
    </aside><main class="wrap" id="view" style="min-width:0"></main>`;
  $$('.tab').forEach(b=>b.onclick=()=>go(b.dataset.tab));
  $('#logout').onclick=async()=>{if(!await ask('로그아웃','이 브라우저의 게임에서도 함께 로그아웃됩니다.','로그아웃'))return;await A.sb.auth.signOut();location.reload();};
}
// 화면 제목 (홈은 자기 제목을 그림)
const phHTML=(k,act)=>`<div class="ph"><div><h1>${esc(tabLabel(k))}</h1><p>${esc(TAB_DESC[k]||'')}</p></div>${act?`<div class="ph-act">${act}</div>`:''}</div>`;
async function go(tab,opts){if(!VIEWS[tab])tab='home';A.tab=tab;A.opts=opts||{};history.replaceState(null,'','#'+tab);
  $$('.tab').forEach(b=>b.setAttribute('aria-selected',b.dataset.tab===tab));
  const v=$('#view');let el=v;
  if(tab==='home')v.innerHTML='<p class="loading">불러오는 중…</p>';
  else{v.innerHTML=phHTML(tab)+'<div id="vb"><p class="loading">불러오는 중…</p></div>';el=$('#vb');}
  try{await VIEWS[tab](el,A.opts);}catch(e){console.error(e);el.innerHTML=`<div class="msg bad">화면을 그리지 못했습니다: ${esc(e.message)}</div>`;}}
async function refreshBadges(){
  const [i,r]=await Promise.all([
    A.sb.from('inquiries').select('id',{count:'exact',head:true}).is('answer',null),
    A.sb.from('reports').select('id',{count:'exact',head:true}).eq('done',false)]);
  A.badge.inbox=(i.count||0)+(r.count||0);
  const t=$('.tab[data-tab=inbox]');if(t)t.innerHTML=tabHTML('inbox',tabLabel('inbox'));}

/* ── 로그인 ── */
const idMail=id=>id.includes('@')?id:`${id.toLowerCase()}@${ADM_DOMAIN}`;
function loginView(msg){
  $('#app').innerHTML=`<div class="login"><h1>블레셋 전기</h1><p class="sub">운영 페이지</p>
    <form class="panel stack" id="lf" novalidate>
      <label class="f">아이디<input type="text" id="lid" autocomplete="username" autocapitalize="none" spellcheck="false"></label>
      <label class="f">비밀번호<input type="password" id="lpw" autocomplete="current-password"></label>
      ${msg?`<div class="msg ${msg.bad?'bad':'info'}">${esc(msg.t)}</div>`:''}
      <button class="btn btn-p" type="submit" id="lgo" style="justify-content:center">접속하기</button>
    </form><p class="faint small" style="text-align:center">게임 계정 중 운영자 권한이 있는 계정만 들어올 수 있습니다.</p></div>`;
  $('#lid').focus();
  $('#lf').onsubmit=async e=>{e.preventDefault();const id=$('#lid').value.trim(),pw=$('#lpw').value;
    if(!id||!pw)return loginView({t:'아이디와 비밀번호를 적어 주세요.',bad:true});
    $('#lgo').disabled=true;$('#lgo').textContent='잠시만요…';
    const {data,error}=await A.sb.auth.signInWithPassword({email:idMail(id),password:pw});
    if(error)return loginView({t:/Invalid login/i.test(error.message)?'아이디 또는 비밀번호가 맞지 않습니다.':dbErr(error),bad:true});
    enter(data.user);};
}
function notAdminView(user){
  $('#app').innerHTML=`<div class="login"><h1>블레셋 전기</h1><p class="sub">운영 페이지</p>
    <div class="panel stack"><div class="msg warn"><b>${esc(user.email.split('@')[0])}</b> 계정에는 운영자 권한이 없습니다.<br>권한을 방금 받았다면 로그아웃 후 다시 로그인해 주세요.</div>
    <div class="row"><a class="btn" href="./">게임으로</a><button class="btn btn-g" id="lo">다른 계정으로 로그인</button></div></div></div>`;
  $('#lo').onclick=async()=>{await A.sb.auth.signOut();loginView();};
}
async function enter(user){
  // 서버에서 최신 정보를 다시 받아 권한 확인 (토큰 안의 app_metadata 기준)
  try{const r=await A.sb.auth.getUser();if(r.data&&r.data.user)user=r.data.user;}catch(e){}
  if(!(user.app_metadata&&user.app_metadata.role==='admin'))return notAdminView(user);
  A.user=user;await loadNames();shell();
  const h=(location.hash||'').slice(1);go(TABS.some(t=>t[0]===h)?h:'home');
  refreshBadges().catch(()=>{});
}
async function admStart(){
  if(!window.supabase){$('#app').innerHTML='<div class="login"><div class="msg bad">서버 연결 도구를 불러오지 못했습니다. 인터넷 연결을 확인하고 새로고침해 주세요.</div></div>';return;}
  A.sb=window.supabase.createClient(ADM_URL,ADM_KEY);
  const {data:{session}}=await A.sb.auth.getSession();
  if(session)enter(session.user);else loginView();
}
