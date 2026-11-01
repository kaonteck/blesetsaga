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
  pfSync();mlStart();ltStart();chStart();
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
    if(CT_LIST[k]){const L=list(k),i=L.findIndex(x=>x.id===id);if(v==null){if(i>=0)L.splice(i,1);}else if(i>=0)L[i]=v;else if(k==='notice')L.unshift(v);else L.push(v);}   // 새 공지는 맨 앞(게임 공지 목록은 최신순)
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
  if(S.route==='battle'||typing||(S.sel&&S.sel.pop)){try{renderTop();}catch(e){}return;}try{render();}catch(e){console.warn(e);}}   // 상단(공지 배지 등)은 항상 갱신
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
  const st=status||(['online','away','raid','meal','offline'].includes(S.me.status)?S.me.status:'online');
  const row={name:S.me.name||null,job:S.me.job||null,level:S.me.level||1,title:(S.titles&&S.titles.equip)||null,memo:(S.me.memo||'').slice(0,40)||null,status:st,last_seen:new Date().toISOString()};
  const key=JSON.stringify({...row,last_seen:0});if(!status&&key===pfLast&&Date.now()-pfAt<120000)return;
  pfBusy=true;
  try{let {error}=await SB.from('profiles').update(row).eq('user_id',SB_UID);
    if(error&&/profiles_name_unique|duplicate key/.test(error.message||'')){
      if(!pfNameWarned){pfNameWarned=true;toast(`다른 블레서가 이미 '${S.me.name}' 이름을 쓰고 있어, 다른 유저에게는 아이디로 보입니다. 이름을 바꾸면 해결됩니다.`,'warn');}
      ({error}=await SB.from('profiles').update({...row,name:null}).eq('user_id',SB_UID));}
    if(!error){pfLast=key;pfAt=Date.now();}}
  catch(e){}finally{pfBusy=false;}
}
document.addEventListener('visibilitychange',()=>{if(SB_UID)pfSync(document.visibilityState==='hidden'?'offline':undefined);});

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
  const {data}=await SB.from('profiles').select('user_id,name,username,job,level,title,memo,status,last_seen').neq('user_id',SB_UID).not('name','is',null).order('name').limit(500);
  if(data){mlPlayers=data;data.forEach(p=>{mlNames[p.user_id]=p.name;CH.uid[p.name]=p.user_id;});}
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

/* ───────── 주간 행운권 (lotto) ─────────
   서버 모드에서는 구매·추첨·수령을 서버가 한다(supabase/008_lotto.sql).
   - 당첨 번호: 추첨 시각(금 20:00) 이후 서버가 무작위로 한 번 뽑는다. 게임의 drawNums()는 서버 번호가 있으면 그것을 돌려준다.
   - 구매: 세이브를 확실히 올림 → buy_lotto (서버가 판매 시간·주 2장·골드 확인 후 200G 차감) → 성공하면 화면에서도 차감.
   - 수령: claim_lotto (서버가 등수 확인·한 번만·상금을 세이브에 더함) → 화면에서도 더함.
   - 서버 행운권은 S.me.lotto 에 'srv:<id>'로 합친다. 서버 이전에 이 기기에서 산 행운권은 예전 방식 그대로.
   - 카지노 입장 레벨 확인(07-boot의 감싸기)은 그대로 거친다. */
let LT={draws:{},next:null,busy:false,timer:null};
const ltSrv=id=>String(id).startsWith('srv:')?String(id).slice(4):null;
async function ltSync(){
  if(!SB||!SB_UID||!S||!S.me)return false;
  const {data,error}=await SB.rpc('lotto_sync');if(error||!data)return false;
  LT.draws=data.draws||{};LT.next=data.next||null;
  const t=now(),old=new Map((S.me.lotto||[]).map(x=>[x.id,x]));
  const srv=(data.tickets||[]).map(r=>{const id='srv:'+r.id,prev=old.get(id)||{};const at=Date.parse(r.at);
    const drawn=r.rank!=null&&LT.draws[r.draw];
    // 시각이 지났는데 아직 안 뽑힌 회차는 결과가 나올 때까지 '대기'로 둔다(지난 결과 목록에 빈 번호로 뜨지 않게)
    return {id,nums:r.nums,draw:r.draw,at:drawn?at:Math.max(at,t+60000),claimed:!!r.claimed,rank:r.rank,ts:Date.parse(r.ts),...(prev.noted?{noted:prev.noted}:{})};});
  const next=[...(S.me.lotto||[]).filter(x=>!ltSrv(x.id)),...srv];
  if(JSON.stringify(next)!==JSON.stringify(S.me.lotto)){S.me.lotto=next;save();}
  // 다음 추첨 직후에 한 번 더 확인
  clearTimeout(LT.timer);if(LT.next){const ms=Date.parse(LT.next.at)-Date.now()+5000;if(ms>0&&ms<7*864e5)LT.timer=setTimeout(()=>ltSync().then(ltRedraw),ms);}
  return true;
}
const ltOpen=()=>!!$('[data-lt-left]');
function ltRedraw(){if(ltOpen())openLotto();try{renderTop();}catch(e){}}
function ltStart(){
  ltSync();
  setInterval(()=>ltSync().then(ch=>{if(ch&&ltOpen())openLotto();}),10*60*1000);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')ltSync();});
}
const ltErr=e=>{const m=(e&&e.message)||'';
  if(/SALE_CLOSED/.test(m))return '판매가 마감되었습니다 (금 19:00~20:00).';if(/MAX_TICKETS/.test(m))return `이번 주 ${LOTTO_MAX}장을 모두 샀습니다.`;
  if(/NOT_ENOUGH_GOLD/.test(m))return '골드가 부족합니다.';if(/BAD_NUMS/.test(m))return '0~9 중 서로 다른 숫자 4개를 고르세요.';
  if(/NOT_DRAWN/.test(m))return '아직 추첨 전입니다.';if(/NOT_FOUND/.test(m))return '행운권을 찾을 수 없습니다.';if(/ALREADY_CLAIMED/.test(m))return '이미 확인한 행운권입니다.';
  if(/NO_SAVE/.test(m))return '진행 기록이 아직 서버에 없습니다. 잠시 뒤 다시 시도해 주세요.';if(/NOT_ACTIVE/.test(m))return '이용이 제한된 계정입니다.';
  return '행운권을 처리하지 못했습니다. 인터넷 연결을 확인해 주세요.';};

if(ONLINE){
  const _drawNums=drawNums;
  drawNums=function(key){const w=LT.draws[key];return w?w.slice().sort((a,b)=>a-b):_drawNums(key);};
  const L0={open:ACTS['lotto-open'],buy:ACTS['lotto-buy'],claim:ACTS['lotto-claim']};
  ACTS['lotto-open']=(...a)=>{L0.open(...a);if(SB_UID&&ltOpen())ltSync().then(()=>{if(ltOpen())openLotto();});};
  ACTS['lotto-buy']=async(d,el,e)=>{
    if(!SB_UID)return L0.buy(d,el,e);
    if(S.me.level<CASINO_LV)return L0.buy(d,el,e);          // 레벨 안내는 원래 감싸기가 한다
    const I=lottoInfo();const a=(S.sel.lotPick||[]).slice().sort((x,y)=>x-y);
    if(LT.busy||a.length!==4||!I.open||I.mine.length>=LOTTO_MAX||S.me.gold<LOTTO_PRICE)return;
    LT.busy=true;const b=$('[data-act="lotto-buy"]');if(b){b.disabled=true;b.textContent='구매 중…';}
    try{
      if(!await cloudFlush())throw new Error('세이브를 서버에 올리지 못했습니다');
      const {data,error}=await SB.rpc('buy_lotto',{p_nums:a});if(error)throw error;
      const price=data.price||LOTTO_PRICE;
      S.me.gold-=price;bump('goldSpent',price);bump('casinoSpent',price);
      S.me.lotto.push({id:'srv:'+data.id,nums:data.nums,draw:data.draw,at:Date.parse(data.at),claimed:false,rank:null,ts:now()});
      S.sel.lotPick=[];save();cloudSave(true);render();openLotto();toast(`행운권 구매 · ${a.join(' ')}`,'good');
    }catch(err){console.warn(err);toast(ltErr(err),'bad');ltSync().then(()=>{if(ltOpen())openLotto();});}
    finally{LT.busy=false;}
  };
  ACTS['lotto-claim']=async(d,el,e)=>{
    const x=(S.me.lotto||[]).find(y=>y.id===d.id);const sid=x&&ltSrv(x.id);
    if(!sid||!SB_UID)return L0.claim(d,el,e);
    if(x.claimed||LT.busy)return;LT.busy=true;
    try{
      const {data,error}=await SB.rpc('claim_lotto',{p_id:sid});
      if(error){if(/ALREADY_CLAIMED/.test(error.message||'')){x.claimed=true;save();}throw error;}
      x.claimed=true;x.rank=data.rank;const g=data.prize||0;
      if(g){S.me.gold+=g;bump('goldEarned',g);if(data.rank===1)bump('lotto1');toast(`주간 행운권 ${data.rank}등 당첨! ${g.toLocaleString('ko-KR')}골드`,'good');}
      else toast('아쉽게도 낙첨입니다.');
      save();cloudSave(true);render();openLotto();
    }catch(err){console.warn(err);toast(ltErr(err),'bad');if(ltOpen())openLotto();}
    finally{LT.busy=false;}
  };
}

/* ───────── 채팅 (chat_messages · direct_messages) ─────────
   서버로 주고받는 탭: 월드(운영자 공지) · 전체 · 1:1(실제 블레서와).
   그대로 이 기기에서만: 파티·레이드 채팅(파티가 아직 각자 브라우저 안의 시뮬레이션이라 — 4단계), 테스트 봇과의 1:1·봇의 말.
   - 서버 메시지는 S.chat.lobby / S.chat.world / 1:1 스레드에 'srv:<id>'로 합친다(실시간 + 1분마다 다시 맞춤 → 운영자가 가린 글은 사라짐).
   - 1:1은 게임 규칙대로 이번 주(월 00:00 KST부터) 것만.
   - 실제 블레서도 이름 색·정보 카드·1:1 상대 목록·접속 인원에 보인다(playerInfo·uinfoHTML·chatHead·onlineCount 감싸기).
   - 신고는 서버 reports 표로(운영 페이지 '문의 · 신고'에 뜸). */
const CH={uid:{},t:null,dmT:null,poll:null,loaded:false};
const chIsSrv=id=>String(id).startsWith('srv:');
const chPlayer=name=>mlPlayers.find(p=>p.name===name)||null;
const chOnline=p=>p&&p.status!=='offline'&&Date.now()-Date.parse(p.last_seen||0)<6*60*1000;
const chWeekStart=()=>new Date(weekKey()+'T00:00:00+09:00').toISOString();
function chName(uid){return uid===SB_UID?(S.me&&S.me.name):(mlNames[uid]||null);}
async function chNames(uids){const miss=[...new Set(uids)].filter(u=>u&&u!==SB_UID&&!mlNames[u]);if(!miss.length)return;
  const {data}=await SB.from('profiles').select('user_id,name,username,job,level,title,memo,status,last_seen').in('user_id',miss);
  (data||[]).forEach(p=>{const n=p.name||p.username;mlNames[p.user_id]=n;CH.uid[n]=p.user_id;if(p.name&&!mlPlayers.some(x=>x.user_id===p.user_id))mlPlayers.push(p);});}
const chRow=r=>({id:'srv:'+r.id,from:r.author===SB_UID?S.me.name:(r.name||'알 수 없음'),uid:r.author||null,text:r.text,ts:Date.parse(r.created_at),...(r.cat?{cat:r.cat}:{})});
function chMerge(key,rows,cap){const L=(S.chat[key]||[]).filter(m=>!chIsSrv(m.id));const next=[...L,...rows].sort((a,b)=>a.ts-b.ts).slice(-cap);
  if(JSON.stringify(next)===JSON.stringify(S.chat[key]))return false;S.chat[key]=next;return true;}
function chDmMsg(r){const other=r.sender===SB_UID?r.recipient:r.sender;const name=chName(other)||'블레서';CH.uid[name]=other;
  return {name,incoming:r.recipient===SB_UID,msg:{id:'srv:'+r.id,from:r.sender===SB_UID?S.me.name:name,uid:r.sender,text:r.text,ts:Date.parse(r.created_at)}};}
async function chFetch(){
  if(!SB||!SB_UID||!S||!S.me)return;
  const cols='id,channel,author,name,cat,text,created_at';
  const [lob,wor,dm]=await Promise.all([
    SB.from('chat_messages').select(cols).eq('channel','lobby').order('id',{ascending:false}).limit(100),
    SB.from('chat_messages').select(cols).eq('channel','world').order('id',{ascending:false}).limit(50),
    SB.from('direct_messages').select('id,sender,recipient,text,created_at').or(`sender.eq.${SB_UID},recipient.eq.${SB_UID}`).gte('created_at',chWeekStart()).order('id',{ascending:true}).limit(500)]);
  let ch=false;
  if(lob.data){await chNames(lob.data.map(r=>r.author));ch=chMerge('lobby',lob.data.map(chRow),150)||ch;}
  if(wor.data)ch=chMerge('world',wor.data.map(chRow),100)||ch;
  if(dm.data){await chNames(dm.data.flatMap(r=>[r.sender,r.recipient]));
    const d=dmState();const keep={};
    for(const n in d.threads){const L=d.threads[n].msgs.filter(m=>!chIsSrv(m.id));keep[n]={...d.threads[n],msgs:L};}
    dm.data.forEach(r=>{const x=chDmMsg(r);const th=keep[x.name]=keep[x.name]||{msgs:[],unread:0};th.msgs.push(x.msg);});
    for(const n in keep){keep[n].msgs.sort((a,b)=>a.ts-b.ts);keep[n].msgs=keep[n].msgs.slice(-100);}
    if(JSON.stringify(keep)!==JSON.stringify(d.threads)){d.threads=keep;ch=true;}}
  CH.loaded=true;
  if(ch){save();try{updateChats();renderTop();}catch(e){}}
}
// 실시간으로 한 줄 들어왔을 때 (이미 있으면 무시)
async function chOnInsert(r){
  if(!S||!S.me||!r||!r.id)return;
  if(r.channel){
    if(r.hidden)return;const key=r.channel==='world'?'world':r.channel==='lobby'?'lobby':null;if(!key)return;
    const id='srv:'+r.id;if((S.chat[key]||[]).some(m=>m.id===id))return;
    if(r.author&&r.author!==SB_UID&&!mlNames[r.author])await chNames([r.author]);
    const m=chRow(r);if(key==='lobby'&&S.rel[m.from]==='blocked')return;
    S.chat[key]=[...(S.chat[key]||[]),m].slice(-(key==='lobby'?150:100));
    if(r.author!==SB_UID&&!visibleTab(key)){S.unread[key]=(S.unread[key]||0)+1;}
    save();updateChats();renderTop();return;
  }
  if(r.sender){
    await chNames([r.sender,r.recipient]);const x=chDmMsg(r);const t=dmState().threads[x.name];
    if(t&&t.msgs.some(m=>m.id===x.msg.id))return;
    if(x.incoming&&S.rel[x.name]==='blocked')return;
    dmPush(x.name,x.msg,x.incoming);if(x.incoming)bump('chats');save();updateChats();renderTop();
  }
}
function chStart(){
  chFetch();
  const later_=()=>{clearTimeout(CH.t);CH.t=setTimeout(chFetch,700);};
  try{SB.channel('chat-live')
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'chat_messages'},p=>chOnInsert(p.new))
      .on('postgres_changes',{event:'UPDATE',schema:'public',table:'chat_messages'},later_)
      .on('postgres_changes',{event:'DELETE',schema:'public',table:'chat_messages'},later_)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'direct_messages',filter:`recipient=eq.${SB_UID}`},p=>chOnInsert(p.new))
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'direct_messages',filter:`sender=eq.${SB_UID}`},p=>chOnInsert(p.new))
      .subscribe();}catch(e){console.warn('채팅 실시간 연결 실패',e);}
  clearInterval(CH.poll);CH.poll=setInterval(()=>{chFetch();mlLoadPlayers().then(()=>{try{renderTopBadges();}catch(e){}});},60000);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')chFetch();});
}
const chErr=e=>{const m=(e&&e.message)||'';
  if(/TOO_FAST/.test(m))return '메시지를 너무 빠르게 보내고 있습니다. 잠시 후 다시 보내세요.';
  if(/row-level security|NOT_ACTIVE/.test(m))return '이용이 제한된 계정이라 메시지를 보낼 수 없습니다.';
  if(/check constraint/.test(m))return '메시지는 200자까지 보낼 수 있습니다.';
  return '메시지를 보내지 못했습니다. 인터넷 연결을 확인해 주세요.';};
async function chSend(kind,text,input){
  try{
    if(kind==='dm'){
      const to=S.sel.dmWith,uid=CH.uid[to];
      const {data,error}=await SB.from('direct_messages').insert({recipient:uid,text}).select('id,sender,recipient,text,created_at').single();
      if(error)throw error;await chOnInsert(data);bump('chats');return;
    }
    const row={channel:kind,text};if(kind==='world'){row.cat=S.sel.wcat||'notice';row.name=S.me.name;}
    const {data,error}=await SB.from('chat_messages').insert(row).select('id,channel,author,name,cat,text,created_at,hidden').single();
    if(error)throw error;await chOnInsert(data);
    if(kind==='world'){logChange('월드 채팅',[{field:WCAT[row.cat]||row.cat,before:undefined,after:text}]);toast(`월드에 ${WCAT[row.cat]||'공지'}을(를) 올렸습니다.`,'good');}
    else bump('chats');
  }catch(err){console.warn(err);toast(chErr(err),'bad');if(input&&!input.value)input.value=text;}
}

if(ONLINE){
  // 보내기: 전체·월드·실제 블레서와의 1:1만 서버로. 나머지(파티·레이드·봇)는 원래대로.
  const _sendChat=sendChat;
  sendChat=function(tab,text){
    if(!SB_UID)return _sendChat(tab,text);
    let t=tab;
    if(t==='lobby'&&S.sel.lobbyCh==='party')return _sendChat(tab,text);
    if(t==='party'&&S.sel.partyCh==='lobby')t='lobby';
    const realDm=t==='dm'&&S.sel.dmWith&&!bot(S.sel.dmWith)&&CH.uid[S.sel.dmWith];
    if(!(t==='lobby'||t==='world'||realDm))return _sendChat(tab,text);
    const msg=String(text||'').replace(/\s+/g,' ').trim().slice(0,200);if(!msg)return;
    if(now()-lastSend<1200){toast('메시지를 너무 빠르게 보내고 있습니다. 잠시 후 다시 보내세요.','warn');return false;}
    if(t==='world'&&!isAdmin()){toast('월드 채팅은 운영자만 작성할 수 있습니다.','warn');return false;}
    if(realDm&&S.rel[S.sel.dmWith]==='blocked'){toast('차단한 사람에게는 보낼 수 없습니다.','warn');return false;}
    lastSend=now();
    const inp=$$('[data-chatpanel] input').find(i=>document.activeElement===i)||$('#chat-in-all');
    chSend(realDm?'dm':t,msg,inp);
    return true;
  };
  // 실제 블레서도 이름 색·정보·1:1 머리줄에 보이게
  const _playerInfo=playerInfo;
  playerInfo=function(name){const r=_playerInfo(name);if(r)return r;const p=chPlayer(name);
    return p?{name,job:p.job||'defender',level:p.level||1,online:chOnline(p),status:'lobby',real:true,uid:p.user_id}:r;};
  const _uinfo=uinfoHTML;
  uinfoHTML=function(name){
    if((S.me&&name===S.me.name)||bot(name))return _uinfo(name);
    const p=chPlayer(name);if(!p)return _uinfo(name);
    const job=p.job||'defender',st=chOnline(p)?(STATUS[p.status]?p.status:'online'):'offline';const tt=p.title&&typeof titleById==='function'?titleById(p.title):null;
    return `<div class="rmenu uinfo" role="dialog" aria-label="${esc(name)} 정보"><div class="u-top">${sigil(job)}<div class="rm-t">${tt?`<span class="tn-s tc-${tt.cat}">${esc(tt.name)}</span>`:''}<div class="row" style="gap:6px"><b>${esc(name)}</b><span class="chip dim">블레서</span></div>
      <small><span class="num">LV${p.level||1}</span></small><div class="row" style="gap:4px">${roleChip(job)}${statusChip(st)}</div></div></div>
      ${p.memo?`<div class="u-sec u-memo">${esc(p.memo)}</div>`:''}${noteOf(name)?`<div class="u-sec u-memo"><span class="faint" style="font-style:normal">내 메모 · </span>${esc(noteOf(name))}</div>`:''}
      <div class="u-sec">${statLine(statsFor(job,p.level||1,{}),true)}</div>
      <div class="u-sec row" style="gap:6px"><button class="btn btn-sm" data-act="u-dm" data-name="${esc(name)}">1:1 대화</button><button class="btn btn-sm" data-act="u-gift-srv" data-uid="${esc(p.user_id)}">선물 보내기</button></div></div>`;
  };
  ACTS['u-gift-srv']=d=>{closeRmem();modal('');S.sel.pop='mail';S.sel.mc={to:'@'+d.uid,text:'',items:{},gift:true};S.sel.mailView='compose';renderPop();renderTop();mlLoadPlayers().then(()=>{if(S.sel.mailView==='compose')renderPop();});};
  // 1:1: 새 대화 상대에 실제 블레서, 대화 중 머리줄에 선물 버튼
  const _chatHead=chatHead;
  chatHead=function(lock){
    let h=_chatHead(lock);const tab=lock||S.sel.chatTab;if(tab!=='dm'||!SB_UID)return h;
    if(S.sel.dmWith){const p=chPlayer(S.sel.dmWith);
      if(p&&!bot(S.sel.dmWith)){const i=h.lastIndexOf('</div>');h=h.slice(0,i)+`<button class="ibtn sm dm-gift" data-act="u-gift-srv" data-uid="${esc(p.user_id)}" data-tip="선물 보내기" aria-label="${esc(S.sel.dmWith)}에게 선물 보내기">${TICON.gift}</button>`+h.slice(i);}
      return h;}
    const has=n=>((dmState().threads[n]||{msgs:[]}).msgs.length>0);
    const ppl=mlPlayers.filter(p=>!has(p.name)&&S.rel[p.name]!=='blocked'&&!bot(p.name)).sort((a,b)=>(chOnline(b)-chOnline(a))||a.name.localeCompare(b.name,'ko'));
    return h.replace(/(<select id="dm-new"[^>]*>)(<option value="">[^<]*<\/option>)([\s\S]*?)(<\/select>)/,(m,open,first,bots,close)=>
      `${open}${first}${ppl.length?`<optgroup label="블레서">${ppl.map(p=>`<option value="${esc(p.name)}">${esc(p.name)}${p.job&&CLASSES[p.job]?' · '+CLASSES[p.job].name:''}${chOnline(p)?'':' · 오프라인'}</option>`).join('')}</optgroup>`:''}${bots?`<optgroup label="테스트 봇">${bots}</optgroup>`:''}${close}`);
  };
  // 접속 인원·접속자 목록: 테스트 봇은 빼고 나 + 실제 블레서만
  const _onlineCount=onlineCount;
  onlineCount=function(){return SB_UID?1+mlPlayers.filter(chOnline).length:_onlineCount();};
  const realAsBot=p=>({name:p.name,job:CLASSES[p.job]?p.job:'defender',level:p.level||1,online:chOnline(p),status:p.status==='raid'&&chOnline(p)?'battle':'lobby',real:true,uid:p.user_id});
  const _showOnline=showOnline;
  showOnline=function(){
    if(!SB_UID)return _showOnline();
    const real=mlPlayers.filter(p=>p.name&&!bot(p.name)).map(realAsBot).sort((a,b)=>(b.online-a.online)||a.name.localeCompare(b.name,'ko'));
    const keep=S.bots;S.bots=real;
    try{_showOnline();}finally{S.bots=keep;}
    const f=$$('#modal p.faint').pop();if(f)f.textContent='지금 게임에 접속한 블레서입니다. 최근 6분 안에 활동한 계정을 접속 중으로 셉니다.';
    mlLoadPlayers().then(()=>{try{renderTopBadges();}catch(e){}});
  };
  // 접속자 목록·정보 카드의 편지 보내기: 실제 블레서는 서버 우편으로
  const _uMail=ACTS['u-mail'];
  ACTS['u-mail']=(d,el,e)=>{_uMail(d,el,e);const p=chPlayer(d.name);if(p&&!bot(d.name)&&S.sel.mc){S.sel.mc.to='@'+p.user_id;renderPop();mlLoadPlayers().then(()=>{if(S.sel.mailView==='compose')renderPop();});}};
  // 신고: 서버 메시지는 서버 reports 표로
  const _report=ACTS.report;
  ACTS.report=async(d,el,e)=>{
    if(!chIsSrv(d.id)||!SB_UID)return _report(d,el,e);
    const all=[...(S.chat.lobby||[]),...Object.values(dmState().threads).flatMap(t=>t.msgs)];const m=all.find(x=>x.id===d.id);if(!m)return;
    if((S.reports||[]).some(r=>r.msgId===m.id)){toast('이미 신고한 메시지입니다.');return;}
    const dm=!(S.chat.lobby||[]).some(x=>x.id===m.id);
    const {error}=await SB.from('reports').insert({target:m.uid||CH.uid[m.from]||null,target_name:m.from,kind:dm?'dm':'chat',ref_id:String(m.id).slice(4),snapshot:String(m.text).slice(0,500)});
    if(error){toast('신고를 보내지 못했습니다. 잠시 후 다시 시도해 주세요.','bad');return;}
    S.reports.unshift({id:uid('r'),msgId:m.id,from:m.from,text:m.text,ts:now(),done:false});save();toast('신고를 접수했습니다. 운영자가 확인합니다.');
  };
}
