'use strict';
/* 서버(Supabase) · 로그인 · 저장 · 시작 진입점 */
/* ───────── 서버(Supabase) · 로그인과 캐릭터 저장 ───────── */
const SB_URL='https://ktuhkiihrnawcpwpqwdl.supabase.co',SB_KEY='sb_publishable_ITKnRBBzkYweQl1htyVoWQ_0w-P4H7o';
const SB_LIB='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';
const ONLINE=/(^|\.)vercel\.app$|^localhost$|^127\.0\.0\.1$/.test(location.hostname)||/[?&]server\b/.test(location.search);
let SB=null,SB_UID=null,SB_ADMIN=false,cloudT=null,cloudBusy=false,cloudAgain=false,cloudFailN=0;
function cloudSave(now){if(now){clearTimeout(cloudT);cloudT=null;return cloudPush();}if(cloudT)return;cloudT=setTimeout(()=>{cloudT=null;cloudPush();},4000);}
async function cloudPush(){
  if(!SB||!SB_UID||!S)return;if(cloudBusy){cloudAgain=true;return;}cloudBusy=true;
  try{const {error}=await SB.from('saves').upsert({user_id:SB_UID,data:S,updated_at:new Date().toISOString()});
    if(error)throw error;if(cloudFailN>=3)toast('서버 저장이 다시 연결되었습니다.','good');cloudFailN=0;}
  catch(e){cloudFailN++;if(cloudFailN===3)toast('서버에 저장하지 못하고 있습니다. 이 기기에는 저장되어 있으며 계속 다시 시도합니다.','bad');clearTimeout(cloudT);cloudT=setTimeout(()=>{cloudT=null;cloudPush();},Math.min(60000,4000*cloudFailN));}
  finally{cloudBusy=false;if(cloudAgain){cloudAgain=false;cloudSave();}}
}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&SB_UID&&S){clearTimeout(saveT);S.savedAt=Date.now();try{localStorage.setItem(SAVE,JSON.stringify(S));}catch(e){}cloudSave(true);}});
async function sbLogout(){S.sel.pop=null;clearTimeout(saveT);try{localStorage.setItem(SAVE,JSON.stringify(S));}catch(e){}await cloudPush();await SB.auth.signOut();location.replace(location.pathname);}
function loadLib(src){return new Promise((ok,no)=>{const t=document.createElement('script');t.src=src;t.onload=ok;t.onerror=no;document.head.appendChild(t);});}
function migrateRaw(raw){try{let s=typeof raw==='string'?JSON.parse(raw):raw;if(s&&s.v===1){s=migrate(s);s.v=2;}if(s&&s.v===2)s=migrate3(s);if(s&&s.v===SAVE_V)return s;}catch(e){}return null;}
const ID_DOMAIN='blesetsaga.vercel.app';
const idMail=id=>id.includes('@')?id:`${id.toLowerCase()}@${ID_DOMAIN}`;
function authView(msg,mode,keep){
  mode=mode||'login';keep=keep||{};$('#top').innerHTML='';const su=mode==='signup';
  $('#view').innerHTML=`<div class="wrap"><div class="create auth" style="align-items:center;text-align:center;max-width:400px">
    <img class="biglogo" src="${LOGO}" alt="BLESET SAGA" style="margin:0 auto"><div class="sub">블레셋 전기</div>
    <form class="panel stack" id="auth-form" style="text-align:left;gap:10px;width:100%" novalidate>
      <div class="seg" style="align-self:flex-start"><button type="button" data-m="login" aria-pressed="${!su}">로그인</button><button type="button" data-m="signup" aria-pressed="${su}">회원가입</button></div>
      ${su?`<label class="stack" style="gap:4px"><span class="faint" style="font-size:12px">초대코드</span><input type="text" id="au-inv" autocomplete="off" autocapitalize="characters" spellcheck="false" value="${esc(keep.inv||'')}"></label>`:''}
      <label class="stack" style="gap:4px"><span class="faint" style="font-size:12px">아이디${su?' (영문 소문자·숫자·_ 4–16자)':''}</span><input type="text" id="au-id" autocomplete="username" autocapitalize="none" spellcheck="false" value="${esc(keep.id||'')}"></label>
      <label class="stack" style="gap:4px"><span class="faint" style="font-size:12px">비밀번호${su?' (6자 이상)':''}</span><input type="password" id="au-pw" autocomplete="${su?'new-password':'current-password'}"></label>
      ${su?'<label class="stack" style="gap:4px"><span class="faint" style="font-size:12px">비밀번호 확인</span><input type="password" id="au-pw2" autocomplete="new-password"></label>':''}
      ${msg?`<p class="${msg.bad?'errs':'faint'}" style="font-size:12.5px;margin:0">${esc(msg.t)}</p>`:''}
      <button class="btn btn-primary" type="submit" id="au-go">${su?'가입하기':'접속하기'}</button>
    </form><p class="faint" style="font-size:11.5px">${su?'초대코드는 운영자에게 받을 수 있습니다. 비밀번호를 잊으면 운영자에게 문의해 주세요.':'진행 기록은 계정에 저장되어 어느 기기에서든 이어서 할 수 있습니다.'}</p></div></div>`;
  const f=$('#auth-form');
  f.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>authView(null,b.dataset.m,{id:$('#au-id').value}));
  f.onsubmit=async e=>{e.preventDefault();const id=$('#au-id').value.trim(),pw=$('#au-pw').value;const inv=su?$('#au-inv').value.trim().toUpperCase():'';const k={id,inv};
    const bad=t=>authView({t,bad:true},mode,k);
    if(su){if(!inv)return bad('초대코드를 적어 주세요.');if(!/^[a-z0-9_]{4,16}$/.test(id))return bad('아이디는 영문 소문자·숫자·_ 4–16자로 정해 주세요.');
      if(pw.length<6)return bad('비밀번호는 6자 이상이어야 합니다.');if(pw!==$('#au-pw2').value)return bad('비밀번호 확인이 일치하지 않습니다.');}
    else if(!id||!pw)return bad('아이디와 비밀번호를 적어 주세요.');
    const go=$('#au-go');go.disabled=true;go.textContent='잠시만요…';
    if(su){const {data,error}=await SB.auth.signUp({email:idMail(id),password:pw,options:{data:{username:id,invite:inv}}});
      if(error)return bad(authErr(error));if(data.session)return sbEnter(data.session.user);
      return bad('가입은 됐지만 바로 접속하지 못했습니다. 운영자에게 문의해 주세요(이메일 인증 설정).');}
    const {data,error}=await SB.auth.signInWithPassword({email:idMail(id),password:pw});if(error)return bad(authErr(error));sbEnter(data.user);};
}
function authErr(e){const m=(e&&e.message)||'';
  if(/Invalid login/i.test(m))return '아이디 또는 비밀번호가 맞지 않습니다.';if(/not confirmed/i.test(m))return '아직 인증되지 않은 계정입니다. 운영자에게 문의해 주세요.';
  if(/already registered|already exists/i.test(m))return '이미 사용 중인 아이디입니다.';if(/Database error/i.test(m))return '초대코드가 맞지 않거나 이미 다 사용된 코드입니다.';
  if(/at least 6/i.test(m))return '비밀번호는 6자 이상이어야 합니다.';if(/rate limit/i.test(m))return '요청이 너무 많습니다. 잠시 뒤 다시 시도해 주세요.';
  if(/signups not allowed/i.test(m))return '지금은 가입을 받지 않습니다.';return '문제가 생겼습니다: '+m;}
function newPwView(){$('#top').innerHTML='';$('#view').innerHTML=`<div class="wrap"><div class="create" style="align-items:center;max-width:400px"><form class="panel stack" id="np-form" style="gap:10px;width:100%"><b>새 비밀번호</b><input type="password" id="np-pw" minlength="6" autocomplete="new-password" required><button class="btn btn-primary" type="submit">저장</button></form></div></div>`;
  $('#np-form').onsubmit=async e=>{e.preventDefault();const {data,error}=await SB.auth.updateUser({password:$('#np-pw').value});if(error){toast(authErr(error),'bad');return;}sbEnter(data.user);};}
let sbEntered=false;
async function sbEnter(user){
  if(sbEntered)return;sbEntered=true;
  try{const r=await SB.auth.getUser();if(r.data&&r.data.user)user=r.data.user;}catch(e){}
  SB_UID=user.id;SAVE=SAVE0+':'+user.id;SB_ADMIN=!!(user.app_metadata&&user.app_metadata.role==='admin');
  $('#view').innerHTML='<div class="wrap"><p class="faint" style="text-align:center;padding:60px 0">진행 기록을 불러오는 중…</p></div>';
  if(/access_token|type=/.test(location.hash))history.replaceState(null,'',location.pathname);
  const ctP=ctFetch().catch(e=>{console.warn('운영 콘텐츠를 불러오지 못했습니다',e);return null;});   // 세이브와 동시에 받기
  const {data,error}=await SB.from('saves').select('data').eq('user_id',user.id).maybeSingle();
  if(error){sbEntered=false;SB_UID=null;$('#view').innerHTML=`<div class="wrap"><div class="create" style="align-items:center;text-align:center;max-width:420px"><p class="errs">서버에서 진행 기록을 불러오지 못했습니다.<br><small>${esc(error.message||'')}</small></p><button class="btn btn-primary" onclick="location.reload()">다시 시도</button></div></div>`;return;}
  const cloud=data&&migrateRaw(data.data);const local=migrateRaw(localStorage.getItem(SAVE));let st=null,imported=false;
  if(cloud&&local)st=(local.savedAt||0)>(cloud.savedAt||0)?local:cloud;else st=cloud||local;
  if(!st){let legacy=null;try{if(localStorage.getItem(SAVE0+':claimed')==null)legacy=migrateRaw(localStorage.getItem(SAVE0));}catch(e){}
    if(legacy&&legacy.me){st=legacy;imported=true;try{localStorage.setItem(SAVE0+':claimed',user.id);}catch(e){}}}
  if(st){st.loggedOut=false;if(st.me){st.me.admin=SB_ADMIN;if(!SB_ADMIN)st.me.viewAsUser=false;}if(!SB_ADMIN&&st.route==='admin')st.route='main';}
  boot(st?{state:st}:{});
  if(!st||imported||st!==cloud){save();}
  if(imported)setTimeout(()=>toast('이 브라우저에 있던 기존 진행 기록을 계정으로 옮겼습니다.','good'),1200);
  ctStart(ctP);
}

/* ───────── 운영 콘텐츠 (서버 content 표 → 게임) ─────────
   운영 페이지(admin.html)에서 공개한 값이 게임 코드 기본값을 덮는다.
   - 처음 덮을 때 원래 값을 S.data._srv[kind][id].base 에 남겨 두고,
     서버에서 지우거나 비공개·기간 종료되면 그 값으로 되돌린다(세이브에 저장되므로 다시 접속해도 유지).
   - 접속 중 운영자가 바꾸면 실시간으로 다시 받아 적용. 예약 공개·종료는 5분마다·탭을 다시 볼 때 확인.
   - 이미 시작한 전투는 시작할 때의 값을 그대로 쓴다(전투가 몬스터 정보를 복사해 두므로). */
const CT_LIST={monster:'monsters',quest:'quests',market:'market',notice:'notices'};
const CT_SETTINGS=['config','mass','banner'];
let ctT=null,ctPoll=null;
async function ctFetch(){
  const {data,error}=await SB.from('content').select('kind,id,data,published,starts_at,ends_at,rev,sort').order('sort').order('id');
  if(error)throw error;
  // 운영자는 비공개·예약 항목도 읽을 수 있으므로, 게임에는 유저와 같은 기준으로 지금 보이는 것만 쓴다
  const t=Date.now();
  return (data||[]).filter(r=>r.published&&(!r.starts_at||Date.parse(r.starts_at)<=t)&&(!r.ends_at||Date.parse(r.ends_at)>t));
}
function ctApply(rows){
  if(!S||!S.data||!rows)return false;
  // 게임이 처음 화면을 그릴 때 하는 1회 보정(레벨 재배치·던전 인원·스토리 퀘스트 추가)을 먼저 끝낸다.
  // 그래야 서버 값이 그 보정에 다시 바뀌지 않고, '원래 값'도 실제 유저가 갖는 값이 된다.
  [ensureRelevel,ensureVilQuest,ensureDunParty].forEach(f=>{try{f();}catch(e){}});
  const D=S.data,M=D._srv=D._srv||{};let changed=false;
  const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  const list=k=>{if(k==='market')market();return D[CT_LIST[k]]=D[CT_LIST[k]]||[];};
  const get=(k,id)=>CT_LIST[k]?list(k).find(x=>x.id===id):k==='item'?ITEMS[id]:k==='setting'?D[id]:undefined;
  const put=(k,id,v)=>{
    if(CT_LIST[k]){const L=list(k),i=L.findIndex(x=>x.id===id);if(v==null){if(i>=0)L.splice(i,1);}else if(i>=0)L[i]=v;else L.push(v);}
    else if(k==='item'){D.items=D.items||{};if(v==null){delete D.items[id];delete ITEMS[id];}else{D.items[id]=v;ITEMS[id]=v;}}
    else if(k==='setting'&&v!=null)D[id]=v;};
  const live={};
  rows.forEach(r=>{if(r.kind==='event')return;if(!CT_LIST[r.kind]&&r.kind!=='item'&&!(r.kind==='setting'&&CT_SETTINGS.includes(r.id)))return;
    (live[r.kind]=live[r.kind]||{})[r.id]=r;});
  // 1) 서버 값 적용
  for(const k in live)for(const id in live[k]){const r=live[k][id];const m=(M[k]=M[k]||{});
    const cur=get(k,id);if(!m[id])m[id]={base:cur==null?null:clone(cur)};
    let v=clone(r.data);
    if(k==='setting')v={...(m[id].base||{}),...v};          // 설정은 기본값 위에 덮기(새로 생긴 칸 유지)
    else if(CT_LIST[k])v.id=id;
    if(k==='monster')v.rev=r.rev;
    if(!same(cur,v)){put(k,id,v);changed=true;}}
  // 2) 서버에서 사라진 것(삭제·비공개·기간 종료)은 원래 값으로
  for(const k in M)for(const id of Object.keys(M[k])){if(live[k]&&live[k][id])continue;
    const base=M[k][id].base;if(!same(get(k,id),base)){put(k,id,base==null?null:clone(base));changed=true;}delete M[k][id];}
  // 3) 전광판: 서버 이벤트는 id 앞에 'srv:'를 붙여 따로 관리(게임 안에서 띄운 것은 그대로)
  const before=JSON.stringify((S.events||[]).filter(e=>String(e.id).startsWith('srv:')));
  const evs=rows.filter(r=>r.kind==='event').map(r=>({kind:'event',title:'',...clone(r.data),id:'srv:'+r.id,until:r.ends_at?Date.parse(r.ends_at):Date.now()+365*864e5}));
  if(before!==JSON.stringify(evs)){S.events=[...(S.events||[]).filter(e=>!String(e.id).startsWith('srv:')),...evs];changed=true;}
  return changed;
}
async function ctRefresh(){
  if(!SB||!SB_UID||!S)return;
  let rows;try{rows=await ctFetch();}catch(e){console.warn('운영 콘텐츠 갱신 실패',e);return;}
  if(ctApply(rows)){save();ctRedraw();}
}
// 다시 그려도 되는 때만 다시 그린다 (전투 중·글 쓰는 중에는 다음 화면 전환 때 반영)
function ctRedraw(){const a=document.activeElement;const typing=a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName);
  if(S.route==='battle'||typing||(S.sel&&S.sel.pop))return;try{render();}catch(e){console.warn(e);}}
async function ctStart(p){
  const rows=await p;
  if(rows&&ctApply(rows)){save();ctRedraw();}
  try{SB.channel('content-live').on('postgres_changes',{event:'*',schema:'public',table:'content'},()=>{clearTimeout(ctT);ctT=setTimeout(ctRefresh,800);}).subscribe();}
  catch(e){console.warn('실시간 연결 실패',e);}
  clearInterval(ctPoll);ctPoll=setInterval(ctRefresh,5*60*1000);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')ctRefresh();});
}
async function sbStart(){
  $('#view').innerHTML='<div class="wrap"><p class="faint" style="text-align:center;padding:60px 0">접속 중…</p></div>';
  try{await loadLib(SB_LIB);}catch(e){return authFail();}
  SB=window.supabase.createClient(SB_URL,SB_KEY);
  let recovery=/type=recovery/.test(location.hash);
  SB.auth.onAuthStateChange((ev,ses)=>{if(ev==='PASSWORD_RECOVERY'){recovery=true;newPwView();}});
  const {data:{session}}=await SB.auth.getSession();
  if(recovery)return newPwView();
  if(session)return sbEnter(session.user);
  authView();
}
function authFail(){$('#view').innerHTML='<div class="wrap"><div class="create" style="align-items:center;text-align:center;max-width:420px"><p class="errs">서버에 연결하지 못했습니다. 인터넷 연결을 확인해 주세요.</p><button class="btn btn-primary" onclick="location.reload()">다시 시도</button></div></div>';}
if(ONLINE)sbStart();else{
window.claude?.hot?.snapshot?.(()=>({state:S}));
window.claude?.hot?.ready?window.claude.hot.ready(boot):boot(window.claude?.hot?.data??{});}
