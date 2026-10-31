'use strict';
/* 서버(Supabase) · 로그인 · 저장 · 시작 진입점 */
/* ───────── 서버(Supabase) · 로그인과 캐릭터 저장 ───────── */
const SB_URL='https://ktuhkiihrnawcpwpqwdl.supabase.co',SB_KEY='sb_publishable_ITKnRBBzkYweQl1htyVoWQ_0w-P4H7o';
const SB_LIB='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';
const ONLINE=/(^|\.)vercel\.app$|^localhost$|^127\.0\.0\.1$/.test(location.hostname)||/[?&]server\b/.test(location.search);
let SB=null,SB_UID=null,SB_ADMIN=false,cloudT=null,cloudBusy=false,cloudAgain=false,cloudFailN=0;
function cloudSave(now){if(now){clearTimeout(cloudT);cloudT=null;return cloudPush();}if(cloudT)return;cloudT=setTimeout(()=>{cloudT=null;cloudPush();},4000);}
async function cloudPush(){
  if(!SB||!SB_UID||!S)return false;if(cloudBusy){cloudAgain=true;return false;}cloudBusy=true;
  try{const {error}=await SB.from('saves').upsert({user_id:SB_UID,data:S,updated_at:new Date().toISOString()});
    if(error)throw error;if(cloudFailN>=3)toast('서버 저장이 다시 연결되었습니다.','good');cloudFailN=0;pfSync();return true;}
  catch(e){cloudFailN++;if(cloudFailN===3)toast('서버에 저장하지 못하고 있습니다. 이 기기에는 저장되어 있으며 계속 다시 시도합니다.','bad');clearTimeout(cloudT);cloudT=setTimeout(()=>{cloudT=null;cloudPush();},Math.min(60000,4000*cloudFailN));return false;}
  finally{cloudBusy=false;if(cloudAgain){cloudAgain=false;cloudSave();}}
}
// 지금 상태를 서버에 확실히 올린다 (다른 업로드가 진행 중이면 끝날 때까지 기다림). 성공하면 true
async function cloudFlush(){
  clearTimeout(cloudT);cloudT=null;clearTimeout(saveT);
  for(let i=0;i<60&&cloudBusy;i++)await new Promise(r=>setTimeout(r,100));
  S.savedAt=Date.now();try{localStorage.setItem(SAVE,JSON.stringify(S));}catch(e){}
  return cloudPush();
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
  pfSync();mlStart();
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

/* ───────── 공개 프로필 (profiles) ─────────
   다른 유저가 나를 찾을 수 있도록 캐릭터 이름·클래스·레벨·칭호·상태를 올린다(바뀌었을 때 + 2분마다 접속 표시).
   이름이 다른 유저와 겹치면 이름 없이 올리고 한 번 알린다. */
let pfLast='',pfAt=0,pfNameWarned=false,pfBusy=false;
async function pfSync(status){
  if(!SB||!SB_UID||!S||!S.me||pfBusy)return;
  const row={name:S.me.name||null,job:S.me.job||null,level:S.me.level||1,title:(S.titles&&S.titles.equip)||null,status:status||'online',last_seen:new Date().toISOString()};
  const key=JSON.stringify({...row,last_seen:0});if(!status&&key===pfLast&&Date.now()-pfAt<120000)return;
  pfBusy=true;
  try{let {error}=await SB.from('profiles').update(row).eq('user_id',SB_UID);
    if(error&&/profiles_name_unique|duplicate key/.test(error.message||'')){
      if(!pfNameWarned){pfNameWarned=true;toast(`다른 블레서가 이미 '${S.me.name}' 이름을 쓰고 있어, 다른 유저에게는 아이디로 보입니다. 이름을 바꾸면 해결됩니다.`,'warn');}
      ({error}=await SB.from('profiles').update({...row,name:null}).eq('user_id',SB_UID));}
    if(!error){pfLast=key;pfAt=Date.now();}}
  catch(e){}finally{pfBusy=false;}
}
document.addEventListener('visibilitychange',()=>{if(SB_UID)pfSync(document.visibilityState==='hidden'?'offline':'online');});

/* ───────── 우편 (mail) · 유저끼리 주고받기 ─────────
   - 받은 우편: 서버 우편을 S.mail 에 'srv:<id>' 로 합친다(게임 안 시스템 우편은 그대로). 실시간 + 1분마다.
   - 보내기: 받는 사람이 실제 유저(값 '@<user_id>')면 → 세이브를 서버에 확실히 올리고 → send_mail(서버가 확인·차감·우편 생성) → 성공하면 화면에서도 같은 만큼 뺀다.
     봇에게 보내기는 예전 그대로(로컬).
   - 선물 받기: claim_mail(서버가 한 번만 표시) 성공 후 게임의 원래 받기 처리로 아이템·골드를 넣는다.
   - 읽음·보관·삭제는 서버에도 반영.
   화면 함수(composeHTML·mailDetail)와 동작(ACTS)은 메인·프론트 파일에 있어서, 서버 모드에서만 여기서 감싸 덧붙인다. */
const ML_TTL=7*24*3600e3;
let mlPlayers=[],mlNames={},mlT=null,mlPoll=null,mlSending=false;
const mlSrvId=id=>String(id).startsWith('srv:')?String(id).slice(4):null;
async function mlLoadPlayers(){
  if(!SB||!SB_UID)return;
  const {data}=await SB.from('profiles').select('user_id,name,username,job,level').neq('user_id',SB_UID).not('name','is',null).order('name').limit(500);
  if(data){mlPlayers=data;data.forEach(p=>mlNames[p.user_id]=p.name);}
}
async function mlFetch(){
  if(!SB||!SB_UID||!S||!S.me)return;
  const since=new Date(Date.now()-ML_TTL).toISOString();
  const {data,error}=await SB.from('mail').select('id,sender,sender_name,text,items,gold,read_at,claimed_at,archived,created_at')
    .eq('recipient',SB_UID).or(`archived.eq.true,created_at.gte."${since}"`).order('created_at',{ascending:false}).limit(150);
  if(error||!data)return;
  const before=new Map((S.mail||[]).filter(m=>mlSrvId(m.id)).map(m=>[m.id,m]));
  const srv=data.map(r=>{const items={...(r.items||{})};if(r.gold>0)items._gold=r.gold;
    if(r.sender)mlNames[r.sender]=r.sender_name;
    return {id:'srv:'+r.id,from:r.sender_name||'운영자',fromUid:r.sender||null,text:r.text,items,ts:Date.parse(r.created_at),
      read:!!r.read_at,claimed:!!r.claimed_at,archived:!!r.archived,archivedAt:r.archived?(before.get('srv:'+r.id)||{}).archivedAt||Date.now():null};});
  const seen=S.me.mlSeen||0;let fresh=srv.filter(m=>!before.has(m.id)&&m.ts>seen);
  const next=[...(S.mail||[]).filter(m=>!mlSrvId(m.id)),...srv];
  if(JSON.stringify(next)===JSON.stringify(S.mail))return;
  S.mail=next;
  if(fresh.length){S.me.mlSeen=Math.max(seen,...fresh.map(m=>m.ts));
    fresh.forEach(m=>{bump('lettersRecv');if(hasItems(m))bump('giftsRecv');});
    const g=fresh.filter(hasItems).length;
    notify(fresh.length===1?`${fresh[0].from}님에게서 ${g?'선물이':'메시지가'} 도착했습니다.`:`새 우편 ${fresh.length}통이 도착했습니다${g?` (선물 ${g})`:''}.`);}
  save();try{renderTop();renderPop();}catch(e){}
}
function mlStart(){
  mlLoadPlayers();mlFetch();
  try{SB.channel('mail-live').on('postgres_changes',{event:'*',schema:'public',table:'mail',filter:`recipient=eq.${SB_UID}`},()=>{clearTimeout(mlT);mlT=setTimeout(mlFetch,500);}).subscribe();}catch(e){}
  clearInterval(mlPoll);mlPoll=setInterval(mlFetch,60000);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')mlFetch();});
}
const mlErr=e=>{const m=(e&&e.message)||'';const k=/NOT_ENOUGH:(\S+)/.exec(m);
  if(k)return `${(ITEMS[k[1]]||{}).name||k[1]} 수량이 서버 기록보다 많습니다. 잠시 뒤 다시 시도해 주세요.`;
  if(/NOT_ENOUGH_GOLD/.test(m))return '골드가 부족합니다.';if(/NOT_ACTIVE/.test(m))return '이용이 제한된 계정이라 우편을 보낼 수 없습니다.';
  if(/NO_RECIPIENT/.test(m))return '받는 사람을 찾을 수 없습니다.';if(/SELF/.test(m))return '나에게는 보낼 수 없습니다.';
  if(/BAD_ITEMS/.test(m))return '첨부한 선물을 확인해 주세요(최대 3종류).';if(/BAD_TEXT/.test(m))return '내용을 쓰거나 선물을 첨부하세요(200자까지).';
  if(/NO_SAVE/.test(m))return '진행 기록이 아직 서버에 없습니다. 잠시 뒤 다시 시도해 주세요.';
  if(/ALREADY_CLAIMED/.test(m))return '이미 받은 선물입니다.';
  return '우편을 처리하지 못했습니다. 인터넷 연결을 확인해 주세요.';};

if(ONLINE){
  // 편지 쓰기 화면: 받는 사람에 실제 유저를 넣고, 선물에 골드 칸을 더한다
  const _compose=composeHTML;
  composeHTML=function(){
    let h=_compose();const c=S.sel.mc||{};
    const blocked=n=>S.rel&&S.rel[n]==='blocked';
    const ppl=mlPlayers.filter(p=>!blocked(p.name));
    if(String(c.to).startsWith('@')&&!ppl.some(p=>'@'+p.user_id===c.to)){const u=c.to.slice(1);ppl.unshift({user_id:u,name:mlNames[u]||'블레서',job:null,level:null});}
    const bots=(S.bots||[]).filter(b=>!blocked(b.name)).sort((a,b)=>a.name.localeCompare(b.name,'ko'));
    const opt=`<option value="">선택하세요</option>${ppl.length?`<optgroup label="블레서">${ppl.map(p=>`<option value="@${p.user_id}" ${c.to==='@'+p.user_id?'selected':''}>${esc(p.name)}${p.job&&CLASSES[p.job]?' · '+CLASSES[p.job].name:''}${p.level?' · LV'+p.level:''}</option>`).join('')}</optgroup>`:''}
      ${bots.length?`<optgroup label="테스트 봇">${bots.map(b=>`<option value="${esc(b.name)}" ${c.to===b.name?'selected':''}>${esc(b.name)} · ${CLASSES[b.job].name}</option>`).join('')}</optgroup>`:''}`;
    h=h.replace(/<select id="mc-to">[\s\S]*?<\/select>/,`<select id="mc-to">${opt}</select>`);
    if(c.gift){const gold=`<label class="row" style="gap:8px;justify-content:space-between"><span style="font-size:12.5px">골드</span><span class="row" style="gap:6px"><input type="number" id="mc-gold" min="0" max="${S.me.gold}" step="1" value="${c.gold||0}" style="width:110px"><span class="faint num" style="font-size:12px">보유 ${(S.me.gold||0).toLocaleString('ko-KR')}</span></span></label>`;
      const at='<span class="faint" style="font-size:12px">최대 3종류';
      h=h.includes(at)?h.replace(at,gold+at):h.replace('<div class="row"><button class="btn btn-primary" data-act="mc-send">',gold+'<div class="row"><button class="btn btn-primary" data-act="mc-send">');}
    return h;};
  const _readCompose=readCompose;
  readCompose=function(){const c=_readCompose();const g=$('#mc-gold');if(g)c.gold=Math.max(0,Math.floor(+g.value||0));return c;};
  // 받은 편지: 실제 유저에게서 온 우편에도 답장 버튼
  const _detail=mailDetail;
  mailDetail=function(m){let h=_detail(m);
    if(m.fromUid&&!h.includes('data-act="mail-reply"'))h=h.replace('<button class="btn btn-sm" data-act="mail-archive"',`<button class="btn btn-sm" data-act="mail-reply" data-to="@${esc(m.fromUid)}">답장</button><button class="btn btn-sm" data-act="mail-archive"`);
    return h;};

  const A0={send:ACTS['mc-send'],claim:ACTS['mail-claim'],open:ACTS['mail-open'],readall:ACTS['m-readall'],archive:ACTS['mail-archive'],del:ACTS['m-del'],compose:ACTS['mail-compose'],gift:ACTS['mc-gift']};
  ACTS['mail-compose']=(d,el,e)=>{A0.compose(d,el,e);mlLoadPlayers().then(()=>{if(S.sel.mailView==='compose')renderPop();});};
  ACTS['mc-gift']=(d,el,e)=>{const c=readCompose();A0.gift(d,el,e);if(!c.gift)c.gold=0;};
  ACTS['mc-send']=async(d,el,e)=>{
    const c=readCompose();
    if(!SB_UID||!String(c.to).startsWith('@'))return A0.send(d,el,e);
    if(mlSending)return;
    if(!c.gift){c.items={};c.gold=0;}
    const to=c.to.slice(1),toName=mlNames[to]||'블레서';const text=(c.text||'').replace(/\s+/g,' ').trim();const gold=c.gold||0;
    if(S.rel&&S.rel[toName]==='blocked'){toast('차단한 사람에게는 보낼 수 없습니다.','warn');return;}
    if(!text&&!Object.keys(c.items).length&&!gold){toast('내용을 쓰거나 선물을 첨부하세요.','warn');return;}
    if(text.length>200){toast('메시지는 200자까지 쓸 수 있습니다.','warn');return;}
    for(const [k,n] of Object.entries(c.items)){if(!ITEMS[k]||ITEMS[k].type==='equip'){toast('장비는 우편으로 보낼 수 없습니다.','warn');return;}
      if(availItem(k)<n){toast(`${ITEMS[k].name} 수량이 부족합니다.`,'warn');return;}}
    if(gold>(S.me.gold||0)){toast('골드가 부족합니다.','warn');return;}
    mlSending=true;const btn=$('[data-act="mc-send"]');if(btn){btn.disabled=true;btn.textContent='보내는 중…';}
    try{
      if(!await cloudFlush())throw new Error('세이브를 서버에 올리지 못했습니다');
      const {error}=await SB.rpc('send_mail',{p_to:to,p_text:text,p_items:c.items,p_gold:gold});
      if(error)throw error;
      // 서버가 뺀 만큼 화면(로컬 세이브)에서도 뺀다
      for(const [k,n] of Object.entries(c.items))S.me.inv[k]=(S.me.inv[k]||0)-n;
      if(gold){S.me.gold-=gold;bump('goldSpent',gold);}
      (S.sentMail=S.sentMail||[]).push({to:toName,toUid:to,text,items:{...c.items,...(gold?{_gold:gold}:{})},ts:now()});
      const gave=Object.keys(c.items).length>0||gold>0;bump('lettersSent');if(gave)bump('giftsSent');
      S.sel.mc=null;S.sel.mailView=null;save();cloudSave(true);renderPop();renderTop();
      toast(`${toName}님에게 ${gave?'선물을':'편지를'} 보냈습니다.`,'good');
    }catch(err){console.warn(err);toast(mlErr(err),'bad');const b=$('[data-act="mc-send"]');if(b){b.disabled=false;b.textContent='보내기';}}
    finally{mlSending=false;}
  };
  ACTS['mail-claim']=async(d,el,e)=>{
    const m=(S.mail||[]).find(x=>x.id===d.id);const sid=m&&mlSrvId(m.id);
    if(!sid||!SB_UID)return A0.claim(d,el,e);
    if(m.claimed||m._claiming)return;m._claiming=true;
    const {error}=await SB.rpc('claim_mail',{p_id:sid});delete m._claiming;
    if(error){if(/ALREADY_CLAIMED/.test(error.message||'')){m.claimed=true;save();renderPop();}toast(mlErr(error),'bad');return;}
    m.claimed=false;A0.claim(d,el,e);m.read=true;cloudSave(true);
  };
  const upd=(ids,row)=>{ids=ids.map(mlSrvId).filter(Boolean);if(ids.length&&SB_UID)SB.from('mail').update(row).in('id',ids).then(()=>{},()=>{});};
  ACTS['mail-open']=(d,el,e)=>{const m=(S.mail||[]).find(x=>x.id===d.id);const was=m&&m.read;A0.open(d,el,e);if(m&&!was)upd([m.id],{read_at:new Date().toISOString()});};
  ACTS['m-readall']=(d,el,e)=>{const ids=(S.mail||[]).filter(m=>!m.read).map(m=>m.id);A0.readall(d,el,e);upd(ids,{read_at:new Date().toISOString()});};
  ACTS['mail-archive']=(d,el,e)=>{const m=(S.mail||[]).find(x=>x.id===d.id);A0.archive(d,el,e);if(m)upd([m.id],{archived:!!m.archived});};
  ACTS['m-del']=(d,el,e)=>{const ids=(d.ids||'').split(',').map(mlSrvId).filter(Boolean);A0.del(d,el,e);if(ids.length&&SB_UID)SB.from('mail').delete().in('id',ids).then(()=>{},()=>{});};
}
