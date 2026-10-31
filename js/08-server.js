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
