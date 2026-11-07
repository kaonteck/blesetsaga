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
  try{const {data:back,error}=await SB.from('saves').upsert({user_id:SB_UID,data:slimOut(S,true),updated_at:new Date().toISOString()}).select('rev:data->adminRev,lv:data->me->level,ex:data->me->exp,gr:guard->rev,gd:data->me->gold');
    if(error)throw error;if(cloudFailN>=3)toast('서버 저장이 다시 연결되었습니다.','good');cloudFailN=0;admApply(back);grdApply(back);pfSync();return true;}
  catch(e){cloudFailN++;if(cloudFailN===3)toast('서버에 저장하지 못하고 있습니다. 이 기기에는 저장되어 있으며 계속 다시 시도합니다.','bad');clearTimeout(cloudT);cloudT=setTimeout(()=>{cloudT=null;cloudPush();},Math.min(60000,4000*cloudFailN));return false;}
  finally{cloudBusy=false;if(cloudAgain){cloudAgain=false;cloudSave();}}
}
/* 운영자 레벨 조정 받기 (supabase/010_admin_level.sql)
   운영 페이지에서 레벨을 바꾸면 서버 세이브의 adminRev가 오른다. 저장 응답의 adminRev가 내 것보다 크면
   서버가 지켜 둔 레벨·경험치를 받아 반영한다(서버 트리거가 그 전까지 레벨·경험치를 덮어쓰지 못하게 막아 둠). */
function admApply(back){const r=Array.isArray(back)?back[0]:back;if(!r||r.rev==null||!S||!S.me)return;
  const rev=+r.rev||0;if(rev<=(S.adminRev||0))return;S.adminRev=rev;
  const lv=Math.round(+r.lv);if(!(lv>=1))return;const before=S.me.level;
  S.me.level=lv;S.me.exp=Math.max(0,+r.ex||0);hpFull();if(S.party){const m=S.party.members.find(x=>x.isMe);if(m)m.level=lv;}
  save();const ae=document.activeElement;if(!(ae&&/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)))render();else renderTop();
  notify(lv===before?`운영자가 레벨을 LV${lv}로 확인했습니다.`:`운영자가 레벨을 LV${before} → LV${lv}로 조정했습니다.`,'good');}
/* 부정 방지(016): 서버가 세이브를 검사해서 말이 안 되는 레벨·골드 변화를 허용치까지만 남기면 guard.rev가 오른다.
   저장 응답의 guard.rev가 내 것보다 크면 서버의 레벨·경험치·골드로 맞춘다(그래야 다음 저장에서 또 깎이지 않음).
   아이템 개수는 서버가 99개까지만 남기므로 보정 번호가 오르면 이 기기도 99개로 자른다.
   다른 기기에서 생긴 보정 번호만 따라잡는 경우(값이 같음)는 조용히 번호만 맞춘다. */
const INV_CAP=9999;   // 020 saves_guard와 같아야 함(99개 넘으면 화면에서 칸을 나눠 쌓음)
function grdApply(back){const r=Array.isArray(back)?back[0]:back;if(!r||r.gr==null||!S||!S.me)return;
  const rev=+r.gr||0;if(rev<=(S.guardRev||0))return;S.guardRev=rev;
  const lv=Math.round(+r.lv),ex=Math.max(0,+r.ex||0),gd=Math.max(0,Math.round(+r.gd||0));if(!(lv>=1)){save();return;}
  let invCut=false;const inv=S.me.inv||{};for(const k in inv)if(inv[k]>INV_CAP){inv[k]=INV_CAP;invCut=true;}   // 서버는 아이템마다 9,999개까지(020)
  const other=lv!==S.me.level||Math.round(S.me.gold||0)!==gd||(S.me.exp||0)!==ex;const diff=invCut||other;
  if(other){const up=lv!==S.me.level;S.me.level=lv;S.me.exp=ex;S.me.gold=gd;if(up){hpFull();if(S.party){const m=S.party.members.find(x=>x.isMe);if(m)m.level=lv;}}}
  save();if(!diff)return;
  const ae=document.activeElement;if(!(ae&&/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)))render();else renderTop();
  notify(!other?`아이템은 종류마다 ${INV_CAP.toLocaleString()}개까지 가질 수 있어 넘친 개수를 정리했습니다.`:'서버 기록과 맞지 않는 변화가 있어 레벨·골드·아이템 개수를 서버 기준으로 맞췄습니다. 잘못된 것 같으면 1:1 문의로 알려 주세요.','warn');}
// 지금 상태를 서버에 확실히 올린다 (다른 업로드가 진행 중이면 끝날 때까지 기다림). 성공하면 true
async function cloudFlush(){
  clearTimeout(cloudT);cloudT=null;clearTimeout(saveT);
  for(let i=0;i<60&&cloudBusy;i++)await new Promise(r=>setTimeout(r,100));
  S.savedAt=Date.now();try{localStorage.setItem(SAVE,JSON.stringify(slimOut(S)));}catch(e){}
  return cloudPush();
}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&SB_UID&&S){clearTimeout(saveT);S.savedAt=Date.now();try{localStorage.setItem(SAVE,JSON.stringify(slimOut(S)));}catch(e){}cloudSave(true);}});
async function sbLogout(){S.sel.pop=null;clearTimeout(saveT);try{localStorage.setItem(SAVE,JSON.stringify(slimOut(S)));}catch(e){}await cloudPush();await SB.auth.signOut();location.replace(location.pathname);}
function loadLib(src){return new Promise((ok,no)=>{const t=document.createElement('script');t.src=src;t.onload=ok;t.onerror=no;document.head.appendChild(t);});}
function migrateRaw(raw){try{let s=typeof raw==='string'?JSON.parse(raw):raw;if(s&&s.v===1){s=migrate(s);s.v=2;}if(s&&s.v===2)s=migrate3(s);if(s&&s.v===SAVE_V)return slimIn(s);}catch(e){}return null;}
const ID_DOMAIN='blesetsaga.vercel.app';
const idMail=id=>id.includes('@')?id:`${id.toLowerCase()}@${ID_DOMAIN}`;
function authView(msg,mode,keep){
  mode=mode||'login';keep=keep||{};$('#top').innerHTML='';const su=mode==='signup';
  $('#view').innerHTML=`<div class="wrap"><div class="create auth" style="align-items:center;text-align:center;max-width:400px">
    <img class="biglogo" src="${LOGO}" alt="BLESET SAGA" style="margin:0 auto"><div class="sub">블레셋 전기</div>
    <form class="panel stack" id="auth-form" style="text-align:left;gap:10px;width:100%" novalidate>
      <div class="seg" style="align-self:flex-start"><button type="button" data-m="login" aria-pressed="${!su}">로그인</button><button type="button" data-m="signup" aria-pressed="${su}">회원가입</button></div>
      ${su?'<p class="pw-warn" role="note">⚠ 개인 정보와 관련된 숫자(생일·전화번호 등), 자주 사용하는 비밀번호 등은 사용하지 마세요. (보안 문제)</p>':''}
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
function newPwView(){$('#top').innerHTML='';$('#view').innerHTML=`<div class="wrap"><div class="create" style="align-items:center;max-width:400px"><form class="panel stack" id="np-form" style="gap:10px;width:100%"><b>새 비밀번호</b><p class="pw-warn" role="note">⚠ 개인 정보와 관련된 숫자(생일·전화번호 등), 자주 사용하는 비밀번호 등은 사용하지 마세요. (보안 문제)</p><input type="password" id="np-pw" minlength="6" autocomplete="new-password" required><button class="btn btn-primary" type="submit">저장</button></form></div></div>`;
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
  if(st&&st===cloud&&local&&local.me&&st.me&&!st.me.portraitSrc&&local.me.portraitSrc&&local.me.portrait===st.me.portrait)st.me.portraitSrc=local.me.portraitSrc;
  // 운영자가 레벨을 조정했는데 이 기기의 로컬 세이브가 더 최근이면, 레벨·경험치만 서버 값으로
  if(st&&cloud&&st!==cloud&&st.me&&cloud.me&&(cloud.adminRev||0)>(st.adminRev||0)){st.me.level=cloud.me.level;st.me.exp=cloud.me.exp||0;st.adminRev=cloud.adminRev;delete st.me.hpPct;delete st.me.hpAt;}
  if(!st){let legacy=null;try{if(localStorage.getItem(SAVE0+':claimed')==null)legacy=migrateRaw(localStorage.getItem(SAVE0));}catch(e){}
    if(legacy&&legacy.me){st=legacy;imported=true;try{localStorage.setItem(SAVE0+':claimed',user.id);}catch(e){}}}
  if(st){st.loggedOut=false;if(st.me){st.me.admin=SB_ADMIN;if(!SB_ADMIN)st.me.viewAsUser=false;}if(!SB_ADMIN&&st.route==='admin')st.route='main';}
  boot(st?{state:st}:{});
  if(!st||imported||st!==cloud){save();}
  if(imported)setTimeout(()=>toast('이 브라우저에 있던 기존 진행 기록을 계정으로 옮겼습니다.','good'),1200);
  ctStart(ctP);rnGate();
  pfSync();mlStart();ltStart();chStart();fdStart();iqStart();fbStart();ptStart();gzStart();
}

/* ───────── 실제 이름 (028 real_names · 메인 2026-11-06) ─────────
   처음 접속할 때 반드시 입력(건너뛰기 없음). 서버에만 저장, 본인만 읽음. 게임에서는 6장 '반쯤 지워진 종잇조각'에만 쓰고 메모리(RN)에만 둔다.
   표를 못 읽으면(오류) 막지 않는다 — 입력 창 때문에 게임에 못 들어가는 일이 없게. */
async function rnGate(){if(!SB||!SB_UID)return;let row=null;
  try{const {data,error}=await SB.from('real_names').select('real_name,region').eq('user_id',SB_UID).maybeSingle();if(error)throw error;row=data;}catch(e){console.warn('실제 이름을 읽지 못했습니다',e);RN_OFF=true;return;}
  if(row&&row.real_name){RN=row.real_name;RN_LOC=row.region||null;return;}
  if(S&&S.me)rnForm();   // 캐릭터가 아직 없으면 캐릭터 생성(직업·닉네임 확정) 뒤에 05 ccCreate가 띄운다
}
async function rnSaveSrv(rec){const {error}=await SB.from('real_names').upsert({user_id:SB_UID,real_name:rec.real_name,region:rec.region,updated_at:new Date().toISOString()});if(error)console.warn(error);return error;}
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
  try{if(typeof applyClassCfg==='function'&&applyClassCfg(rows))changed=true;}catch(e){console.warn(e);}
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
    // 서버 목록(013)에 아직 없는 새 클래스면 직업만 비우고 나머지는 올린다
    if(error&&/profiles_job_check/.test(error.message||''))({error}=await SB.from('profiles').update({...row,job:null}).eq('user_id',SB_UID));
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
// 게임 클래스 id인지 (CLASSES 객체의 기본 속성 이름 'constructor' 등은 제외)
const isClass=j=>typeof j==='string'&&Object.prototype.hasOwnProperty.call(CLASSES,j);
const ML_TTL=7*24*3600e3;
let mlIncAt=0,mlPlayers=[],mlNames={},mlT=null,mlPoll=null,mlSending=false;
const mlSrvId=id=>String(id).startsWith('srv:')?String(id).slice(4):null;
let mlFullAt=0;
async function mlLoadPlayers(){
  if(!SB||!SB_UID)return;
  /* 전송량 줄이기(메인 2026-11-06): 전체 목록은 10분마다, 그 사이에는 최근 활동(last_seen)한 블레서만 받아 합친다 */
  const cols='user_id,name,username,job,level,title,memo,status,last_seen';const full=Date.now()-mlFullAt>600000||!mlPlayers.length;
  if(!full){const since=new Date(mlIncAt-30000).toISOString();mlIncAt=Date.now();
    const {data:inc}=await SB.from('profiles').select(cols).neq('user_id',SB_UID).not('name','is',null).gte('last_seen',since).limit(500);
    if(inc){inc.forEach(p=>{if(p.job&&!isClass(p.job))p.job=null;const i=mlPlayers.findIndex(x=>x.user_id===p.user_id);if(i>=0)mlPlayers[i]=p;else mlPlayers.push(p);mlNames[p.user_id]=p.name;CH.uid[p.name]=p.user_id;});mlPlayers.sort((a,b)=>String(a.name).localeCompare(String(b.name)));}
    return;}
  mlFullAt=Date.now();mlIncAt=Date.now();
  const {data}=await SB.from('profiles').select(cols).neq('user_id',SB_UID).not('name','is',null).order('name').limit(500);
  // 모르는 직업 값은 비워 둔다(이상한 값 하나로 채팅·목록 그리기가 멈추지 않게 — 서버도 013에서 막음)
  if(data){data.forEach(p=>{if(p.job&&!isClass(p.job))p.job=null;});mlPlayers=data;data.forEach(p=>{mlNames[p.user_id]=p.name;CH.uid[p.name]=p.user_id;});}
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
  clearInterval(mlPoll);mlPoll=setInterval(mlFetch,300000);   // 실시간(mail-live)이 주, 이건 놓친 것 대비
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')mlFetch();});
}
// 선물을 받거나 보낸 뒤 골드·인벤토리가 보이는 화면(캐릭터 카드·장비·상점 등)도 바로 다시 그린다. 우편 팝업은 그대로 열려 있음.
// 전투 중이거나 글을 쓰는 중이면 상단만.
function mlRedraw(){const a=document.activeElement;const typing=a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)&&!a.closest('#pop');
  if(S.route==='battle'||typing){try{renderTop();}catch(e){}return;}try{render();}catch(e){console.warn(e);}}
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
    const opt=`<option value="">선택하세요</option>${ppl.length?`<optgroup label="블레서">${ppl.map(p=>`<option value="@${p.user_id}" ${c.to==='@'+p.user_id?'selected':''}>${esc(p.name)}${isClass(p.job)?' · '+CLASSES[p.job].name:''}${p.level?' · LV'+p.level:''}</option>`).join('')}</optgroup>`:''}
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
      S.sel.mc=null;S.sel.mailView=null;save();cloudSave(true);renderPop();renderTop();mlRedraw();
      toast(`${toName}님에게 ${gave?'선물을':'편지를'} 보냈습니다.`,'good');
    }catch(err){console.warn(err);toast(mlErr(err),'bad');const b=$('[data-act="mc-send"]');if(b){b.disabled=false;b.textContent='보내기';}}
    finally{mlSending=false;}
  };
  ACTS['mail-claim']=async(d,el,e)=>{
    const m=(S.mail||[]).find(x=>x.id===d.id);const sid=m&&mlSrvId(m.id);
    if(!sid||!SB_UID)return A0.claim(d,el,e);
    if(m.claimed||m._claiming)return;{const w=typeof mailOver==='function'&&mailOver(m);if(w){toast(w,'warn');return;}}m._claiming=true;   // 99개 넘침은 서버에서 받기 전에 막음(메인)
    const {error}=await SB.rpc('claim_mail',{p_id:sid});delete m._claiming;
    if(error){if(/ALREADY_CLAIMED/.test(error.message||'')){m.claimed=true;save();renderPop();}toast(mlErr(error),'bad');return;}
    // 기다리는 동안 우편 목록이 새로 받아져 객체가 바뀌었을 수 있으니 지금 목록의 것으로 넣는다(빠뜨림 방지)
    const cur=(S.mail||[]).find(x=>x.id===d.id)||m;if(!S.mail.includes(cur))S.mail.push(cur);
    cur.claimed=false;A0.claim(d,el,e);cur.read=true;cloudSave(true);mlRedraw();
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
  if(/LOW_LEVEL/.test(m))return `행운권은 LV${CASINO_LV} 이상부터 살 수 있습니다.`;if(/NOT_ENOUGH_GOLD/.test(m))return '골드가 부족합니다.';if(/BAD_NUMS/.test(m))return '0~9 중 서로 다른 숫자 4개를 고르세요.';
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
      S.me.gold-=price;bump('goldSpent',price);bump('casinoSpent',price);bump('lottoBuy');   // 4장 E13 카지노 한 판(메인)
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
  CH.n=0;clearInterval(CH.poll);CH.poll=setInterval(()=>{if(++CH.n%5===0)chFetch();mlLoadPlayers().then(()=>{try{renderTopBadges();if(S.sel&&S.sel.pop==='online')renderPop();}catch(e){}});},60000);
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
    return p?{name,job:isClass(p.job)?p.job:'defender',level:p.level||1,online:chOnline(p),status:'lobby',real:true,uid:p.user_id}:r;};
  const _uinfo=uinfoHTML;
  uinfoHTML=function(name){
    if((S.me&&name===S.me.name)||bot(name))return _uinfo(name);
    const p=chPlayer(name);if(!p)return _uinfo(name);
    const job=isClass(p.job)?p.job:'defender',st=chOnline(p)?(STATUS[p.status]?p.status:'online'):'offline';const tt=p.title&&typeof titleById==='function'?titleById(p.title):null;
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
      `${open}${first}${ppl.length?`<optgroup label="블레서">${ppl.map(p=>`<option value="${esc(p.name)}">${esc(p.name)}${isClass(p.job)?' · '+CLASSES[p.job].name:''}${chOnline(p)?'':' · 오프라인'}</option>`).join('')}</optgroup>`:''}${bots?`<optgroup label="테스트 봇">${bots}</optgroup>`:''}${close}`);
  };
  // 접속 인원·접속자 목록: 테스트 봇은 빼고 나 + 실제 블레서만
  const _onlineCount=onlineCount;
  onlineCount=function(){return SB_UID?1+mlPlayers.filter(chOnline).length:_onlineCount();};
  // 실제 블레서의 상태('raid' = 파티모집 중 등)·한줄메모는 접속자 팝업의 ustat·memo로(봇 활동 표시는 '로비')
  const realAsBot=p=>({name:p.name,job:isClass(p.job)?p.job:'defender',level:p.level||1,online:chOnline(p),status:'lobby',ustat:p.status||null,memo:p.memo||'',real:true,uid:p.user_id});
  const _showOnline=showOnline;let olAt=0;
  showOnline=function(){
    if(!SB_UID)return _showOnline();
    const real=mlPlayers.filter(p=>p.name&&!bot(p.name)).map(realAsBot).sort((a,b)=>(b.online-a.online)||a.name.localeCompare(b.name,'ko'));
    const keep=S.bots;S.bots=real;
    try{_showOnline();}finally{S.bots=keep;}
    // 팝업을 열 때 목록을 새로 받아 다시 그림(팝업은 자주 다시 그려지므로 10초에 한 번만)
    if(Date.now()-olAt>10000){olAt=Date.now();mlLoadPlayers().then(()=>{try{renderTopBadges();if(S.sel.pop==='online')renderPop();}catch(e){}});}
  };
  // 접속자 목록·정보 카드의 편지 보내기: 실제 블레서는 서버 우편으로
  // 계정 삭제(017): 서버 세이브·우편·행운권·낚시 기록을 서버 함수로 먼저 지운 뒤 게임의 원래 삭제(새 상태 저장)를 한다.
  // 서버 검사(016)는 캐릭터 없는 저장으로 예전 캐릭터를 지우지 못하게 막으므로, 삭제는 반드시 이 길로.
  const _accDel=ACTS['acc-del-yes'];
  ACTS['acc-del-yes']=async(d,el,e)=>{
    if(!SB_UID)return _accDel(d,el,e);
    if(el)el.disabled=true;
    clearTimeout(cloudT);cloudT=null;
    for(let i=0;i<60&&cloudBusy;i++)await new Promise(r=>setTimeout(r,100));
    cloudBusy=true;   // 지우는 동안 예전 상태가 올라가지 않게
    try{const {error}=await SB.rpc('reset_my_save');if(error)throw error;}
    catch(err){console.warn(err);cloudBusy=false;cloudAgain=false;if(el)el.disabled=false;toast('계정을 삭제하지 못했습니다. 인터넷 연결을 확인해 주세요.','bad');return;}
    cloudBusy=false;cloudAgain=false;
    _accDel(d,el,e);
    try{FB.rows={};}catch(x){}
    cloudFlush();
  };
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

/* ───────── 커뮤니티 피드 (feed_posts · feed_comments · 좋아요) ─────────
   - 서버 모드에서는 피드 = 서버 글(실제 블레서)만. 이 기기의 예전 봇 글(S.feed)·봇 반응은 쓰지 않는다(세이브에는 그대로 남음).
   - 글·댓글·답글·좋아요·삭제는 서버로. 실시간(글·댓글 바뀜) + 1분마다 + 탭으로 돌아올 때 다시 받는다.
   - 게임 화면 함수(feed·pInfo·postHTML 등)는 그대로 쓰고, feed()가 서버 글을 같은 모양으로 돌려준다.
     id는 화면 요소 id에 쓰이므로 콜론 없이 'sp'+글 id, 'sc'+댓글 id.
   - 다시 그릴 때 쓰던 글·댓글 입력칸 내용과 커서는 지킨다. */
const FD={posts:[],sig:'',t:null,poll:null,busy:false,again:false,seenC:null,sending:false};
const fdSid=id=>/^s[pc]/.test(String(id||''))?String(id).slice(2):null;
function fdName(uid,fallback){if(uid===SB_UID)return (S&&S.me&&S.me.name)||fallback||'나';return mlNames[uid]||fallback||'블레서';}
async function fdFetch(){
  if(!SB||!SB_UID||!S||!S.me)return;
  if(FD.busy){FD.again=true;return;}FD.busy=true;
  try{
    const {data:ps,error}=await SB.from('feed_posts').select('id,author,author_name,text,hidden,created_at').eq('hidden',false).order('created_at',{ascending:false}).limit(60);
    if(error||!ps)return;
    const ids=ps.map(p=>p.id);let cs=[],pl=[],cl=[];
    if(ids.length){
      const [a,b]=await Promise.all([
        SB.from('feed_comments').select('id,post_id,parent_id,author,author_name,text,hidden,created_at').in('post_id',ids).eq('hidden',false).order('created_at',{ascending:true}).limit(2000),
        SB.from('feed_likes').select('post_id,user_id').in('post_id',ids).limit(5000)]);
      cs=(a&&a.data)||[];pl=(b&&b.data)||[];
      const cids=cs.map(c=>c.id);
      if(cids.length){const r=await SB.from('feed_comment_likes').select('comment_id,user_id').in('comment_id',cids).limit(5000);cl=(r&&r.data)||[];}
    }
    ps.forEach(p=>{if(p.author&&p.author_name&&!mlNames[p.author])mlNames[p.author]=p.author_name;});
    cs.forEach(c=>{if(c.author&&c.author_name&&!mlNames[c.author])mlNames[c.author]=c.author_name;});
    const likesOf=(rows,key,id)=>rows.filter(r=>r[key]===id).map(r=>fdName(r.user_id));
    const cmap={};
    cs.filter(c=>!c.parent_id).forEach(c=>{cmap[c.id]={id:'sc'+c.id,author:fdName(c.author,c.author_name),uid:c.author,text:c.text,ts:Date.parse(c.created_at),likes:likesOf(cl,'comment_id',c.id),replies:[],_post:c.post_id};});
    cs.filter(c=>c.parent_id&&cmap[c.parent_id]).forEach(c=>cmap[c.parent_id].replies.push({id:'sc'+c.id,author:fdName(c.author,c.author_name),uid:c.author,text:c.text,ts:Date.parse(c.created_at),likes:likesOf(cl,'comment_id',c.id)}));
    const posts=ps.map(p=>({id:'sp'+p.id,author:fdName(p.author,p.author_name),uid:p.author,text:p.text,img:null,ts:Date.parse(p.created_at),likes:likesOf(pl,'post_id',p.id),
      comments:Object.values(cmap).filter(c=>c._post===p.id).map(c=>{const o={...c};delete o._post;return o;})}));
    // 내 글에 다른 사람이 단 새 댓글·답글 알림 (첫 불러오기는 알림 없이 기억만)
    const mine=new Set(ps.filter(p=>p.author===SB_UID).map(p=>p.id));
    const others=cs.filter(c=>mine.has(c.post_id)&&c.author!==SB_UID);
    if(FD.seenC){const fresh=others.filter(c=>!FD.seenC.has(c.id));
      if(fresh.length)notify(fresh.length===1?`${fdName(fresh[0].author,fresh[0].author_name)}님이 내 글에 댓글을 남겼습니다.`:`내 글에 새 댓글 ${fresh.length}개가 달렸습니다.`);}
    FD.seenC=new Set(others.map(c=>c.id));
    const sig=JSON.stringify(posts);if(sig===FD.sig)return;
    FD.sig=sig;FD.posts=posts;fdRedraw();
  }catch(e){console.warn(e);}
  finally{FD.busy=false;if(FD.again){FD.again=false;fdFetch();}}
}
// 커뮤니티 화면만 다시 그린다. 쓰던 입력칸 내용·커서는 그대로.
function fdRedraw(){
  if(!S||S.route!=='community')return;
  const keep={};$$('#view input[id],#view textarea[id]').forEach(x=>{keep[x.id]=x.value;});
  const a=document.activeElement;const fid=a&&a.id&&Object.prototype.hasOwnProperty.call(keep,a.id)?a.id:null;const sel=fid?[a.selectionStart,a.selectionEnd]:null;
  if(keep['fd-text']!=null)S.sel.fdDraft=keep['fd-text'];
  try{render();}catch(e){console.warn(e);return;}
  for(const id in keep){const x=document.getElementById(id);if(x&&x.value!==keep[id])x.value=keep[id];}
  const c=$('#fd-count');if(c&&keep['fd-text']!=null)c.textContent=keep['fd-text'].length+'/300';
  if(fid){const x=document.getElementById(fid);if(x){x.focus();try{x.setSelectionRange(sel[0],sel[1]);}catch(e){}}}
}
function fdStart(){
  fdFetch();
  try{SB.channel('feed-live')
    .on('postgres_changes',{event:'*',schema:'public',table:'feed_posts'},()=>{clearTimeout(FD.t);FD.t=setTimeout(fdFetch,600);})
    .on('postgres_changes',{event:'*',schema:'public',table:'feed_comments'},()=>{clearTimeout(FD.t);FD.t=setTimeout(fdFetch,600);}).subscribe();}catch(e){}
  clearInterval(FD.poll);FD.poll=setInterval(fdFetch,300000);   // 실시간(feed-live)이 주
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')fdFetch();});
}
const fdErr=e=>{const m=(e&&e.message)||'';
  if(/TOO_FAST/.test(m))return '너무 빠르게 올리고 있어요. 잠시 뒤 다시 시도해 주세요.';
  if(/row-level security|permission denied/i.test(m))return '이용이 제한된 계정이라 올릴 수 없습니다.';
  if(/BAD_PARENT/.test(m))return '답글을 달 댓글을 찾을 수 없습니다.';
  if(/check constraint|violates/i.test(m))return '내용을 확인해 주세요(글 300자 · 댓글 150자까지).';
  return '서버에 올리지 못했습니다. 인터넷 연결을 확인해 주세요.';};

if(ONLINE){
  const _feed=feed;
  feed=function(){return SB_UID?FD.posts:_feed();};
  const _vCommunity=vCommunity;
  vCommunity=function(){const h=_vCommunity();if(!SB_UID||FD.posts.length)return h;
    return h.replace('<div class="fd-list"></div>','<div class="fd-list"><p class="empty">아직 올라온 글이 없습니다. 블레서들에게 첫 이야기를 남겨 보세요.</p></div>');};
  // 실제 블레서의 클래스 문양
  const _pInfo=pInfo;
  pInfo=function(n){if(!SB_UID||(S.me&&n===S.me.name))return _pInfo(n);const p=chPlayer(n);return p?{job:isClass(p.job)?p.job:'defender',img:null}:_pInfo(n);};
  // 글·댓글·답글 쓰기: 게임의 submit 처리(document)보다 먼저(window, 잡기 단계) 받아 서버로
  window.addEventListener('submit',async e=>{
    if(!SB_UID||!S||!S.me)return;const f=e.target&&e.target.closest&&e.target.closest('[data-form]');if(!f)return;
    const k=f.dataset.form;if(k!=='fd-post'&&k!=='fd-comment'&&k!=='fd-reply')return;
    e.preventDefault();e.stopPropagation();if(FD.sending)return;
    let row,inp,max=150;
    if(k==='fd-post'){inp=$('#fd-text');max=300;row={};}
    else if(k==='fd-comment'){inp=document.getElementById('fdc-'+f.dataset.post);row={post_id:fdSid(f.dataset.post)};}
    else{inp=document.getElementById('fdi-'+f.dataset.cid);row={post_id:fdSid(f.dataset.post),parent_id:fdSid(f.dataset.cid)};}
    const text=((inp&&inp.value)||'').trim();
    if(!text){if(k==='fd-post')toast('내용을 적어 주세요.','warn');return;}
    if(k!=='fd-post'&&!row.post_id)return;
    row.text=text.slice(0,max);
    FD.sending=true;const btn=f.querySelector('[type=submit]');if(btn)btn.disabled=true;
    try{
      const {error}=await SB.from(k==='fd-post'?'feed_posts':'feed_comments').insert(row);
      if(error)throw error;
      if(inp)inp.value='';S.sel.emoFor=null;
      if(k==='fd-post'){S.sel.fdDraft='';bump('posts');toast('글을 게시했습니다.','good');}
      else if(k==='fd-comment'){S.sel.fdOpen=S.sel.fdOpen||{};S.sel.fdOpen[f.dataset.post]=true;}
      else S.sel.fdReply=null;
      save();FD.sig='';await fdFetch();
    }catch(err){console.warn(err);toast(fdErr(err),'bad');if(btn)btn.disabled=false;}
    finally{FD.sending=false;}
  },true);
  // 좋아요: 화면에서 먼저 바꾸고 서버에 반영, 다시 받아 맞춘다
  const _like=ACTS['fd-like'];
  ACTS['fd-like']=async(d,el,e)=>{
    const sid=fdSid(d.id);if(!SB_UID||!sid)return _like(d,el,e);
    const o=fdFind(d.k,d.id);if(!o||o._busy)return;o._busy=true;
    const on=o.likes.includes(S.me.name);
    if(on)o.likes=o.likes.filter(n=>n!==S.me.name);else o.likes.push(S.me.name);fdRedraw();
    const T=d.k==='p'?'feed_likes':'feed_comment_likes',K=d.k==='p'?'post_id':'comment_id';
    const {error}=on?await SB.from(T).delete().eq(K,sid).eq('user_id',SB_UID):await SB.from(T).insert({[K]:sid});
    if(error&&!/duplicate key/.test(error.message||''))toast(fdErr(error),'bad');
    FD.sig='';fdFetch();
  };
  // 내 글 지우기
  const _del=ACTS['fd-del'];
  ACTS['fd-del']=async(d,el,e)=>{
    const sid=fdSid(d.id);if(!SB_UID||!sid)return _del(d,el,e);
    const {error}=await SB.from('feed_posts').delete().eq('id',sid);
    if(error){toast('글을 지우지 못했습니다. 잠시 후 다시 시도해 주세요.','bad');return;}
    FD.posts=FD.posts.filter(p=>p.id!==d.id);FD.sig='';fdRedraw();toast('글을 삭제했습니다.');fdFetch();
  };
}

/* ───────── 1:1 문의 (inquiries) ─────────
   서버 모드: 환경설정 › 1:1 문의에서 보내면 서버로, 내 문의 목록·답변 상태도 서버에서 받는다(실시간).
   운영자가 운영 페이지에서 답하면 서버가 답변 우편을 보낸다(014). 이 기기의 예전 문의(S.inquiries)는 세이브에 그대로. */
const IQ={list:[],t:null,sending:false};
async function iqFetch(){
  if(!SB||!SB_UID||!S||!S.me)return;
  const {data,error}=await SB.from('inquiries').select('id,cat,text,answer,answered_at,created_at').eq('author',SB_UID).order('created_at',{ascending:false}).limit(30);
  if(error||!data)return;
  const list=data.map(r=>({id:'srv:'+r.id,by:S.me.name,cat:r.cat,text:r.text,ts:Date.parse(r.created_at),answer:r.answer||null,answeredAt:r.answered_at?Date.parse(r.answered_at):null}));
  if(JSON.stringify(list)===JSON.stringify(IQ.list))return;
  IQ.list=list;try{if(S.sel&&S.sel.pop)renderPop();}catch(e){}
}
function iqStart(){
  iqFetch();
  try{SB.channel('inq-live').on('postgres_changes',{event:'*',schema:'public',table:'inquiries',filter:`author=eq.${SB_UID}`},()=>{clearTimeout(IQ.t);IQ.t=setTimeout(iqFetch,500);}).subscribe();}catch(e){}
}
if(ONLINE){
  const _askBody=askBody;
  askBody=function(){if(!SB_UID)return _askBody();const keep=S.inquiries;S.inquiries=IQ.list;try{return _askBody();}finally{S.inquiries=keep;}};
  window.addEventListener('submit',async e=>{
    if(!SB_UID||!S||!S.me)return;const f=e.target&&e.target.closest&&e.target.closest('[data-form="ask"]');if(!f)return;
    e.preventDefault();e.stopPropagation();if(IQ.sending)return;
    const inp=$('#ask-text');const t=((inp&&inp.value)||'').trim();
    if(t.length<5){toast('문의 내용을 5자 이상 적어 주세요.','warn');return;}
    IQ.sending=true;const btn=f.querySelector('[type=submit]');if(btn)btn.disabled=true;
    try{const {error}=await SB.from('inquiries').insert({cat:($('#ask-cat')||{}).value||'기타',text:t.slice(0,500)});if(error)throw error;
      if(inp)inp.value='';await iqFetch();renderPop();toast('1:1 문의를 보냈습니다. 답변은 우편함으로도 전달됩니다.','good');}
    catch(err){console.warn(err);toast(/row-level security|permission denied/i.test((err&&err.message)||'')?'이용이 제한된 계정이라 문의를 보낼 수 없습니다.':'문의를 보내지 못했습니다. 인터넷 연결을 확인해 주세요.','bad');if(btn)btn.disabled=false;}
    finally{IQ.sending=false;}
  },true);
}

/* ───────── 주간 낚시 랭킹 (fish_catches · fish_weekly · fish_awards) ─────────
   서버 모드: 이번 주 지역별 최고 기록을 서버에 남기고, 순위는 실제 블레서 기록으로(봇 없음).
   지난 주 1위 정산(500골드 우편)은 서버 fish_settle()이 한 번만 한다 → 게임은 수상 기록을 보고 낚시왕 칭호를 붙인다.
   이 기기의 정산(settleFish)은 서버 모드에서 쓰지 않는다. */
const FB={rows:{},wk:'',busy:false};
async function fbFetch(){
  if(!SB||!SB_UID||!S||!S.me||FB.busy)return;FB.busy=true;
  try{const wk=weekKey();const {data,error}=await SB.from('fish_weekly').select('land,user_id,name,species,size_cm,created_at').eq('week',wk).limit(1000);
    if(error||!data)return;const rows={};data.forEach(r=>{(rows[r.land]=rows[r.land]||[]).push(r);});FB.rows=rows;FB.wk=wk;}
  catch(e){}finally{FB.busy=false;}
}
// 이번 주 내 기록 중 서버에 아직 없는(또는 더 작은) 것을 올린다 — 서버 연결 전에 낚은 것 포함
async function fbPushMine(){
  if(!SB_UID||!S.me||S.me.fishBestWk!==weekKey())return;
  const mine=S.me.fishBest||{};let sent=false;
  for(const land in mine){if(!FISH_LANDS[land])continue;const b=mine[land];const srv=(FB.rows[land]||[]).find(r=>r.user_id===SB_UID);
    if(srv&&+srv.size_cm>=b.size)continue;
    const {error}=await SB.from('fish_catches').insert({land,species:(FISH_BY_ID[b.sp]||{}).name||String(b.sp),size_cm:b.size});if(!error)sent=true;}
  if(sent)await fbFetch();
}
async function fbAwards(){
  if(!SB||!SB_UID||!S||!S.me)return;
  try{await SB.rpc('fish_settle');}catch(e){}
  const {data}=await SB.from('fish_awards').select('week,land').eq('user_id',SB_UID);if(!data)return;
  const me=S.me;me.fishAwSeen=me.fishAwSeen||[];let won=0;
  data.forEach(a=>{const k=a.week+':'+a.land;if(me.fishAwSeen.includes(k))return;me.fishAwSeen.push(k);
    me.fishKingLand=me.fishKingLand||{};me.fishKingLand[a.land]=(me.fishKingLand[a.land]||0)+1;won++;});
  if(won){me.fishKing=(me.fishKing||0)+won;save();setTimeout(checkTitles,0);}
}
async function fbStart(){await fbFetch();await fbPushMine();fbAwards();setInterval(()=>{fbAwards();},30*60*1000);}
if(ONLINE){
  const _fishBoard=fishBoard;
  fishBoard=function(land,wkArg){
    if(!SB_UID)return _fishBoard(land,wkArg);
    const wk=wkArg||weekKey();if(wk!==FB.wk)return [];
    const rows=(FB.rows[land]||[]).map(r=>({name:r.user_id===SB_UID?S.me.name:(r.name||'블레서'),sp:r.species,size:+r.size_cm,me:r.user_id===SB_UID,at:Date.parse(r.created_at)}));
    const mine=S.me.fishBestWk===wk&&(S.me.fishBest||{})[land];const my=rows.find(x=>x.me);
    if(mine&&(!my||mine.size>my.size)){const x={name:S.me.name,sp:FISH_BY_ID[mine.sp]?FISH_BY_ID[mine.sp].name:mine.sp,size:mine.size,me:true,at:Date.now()};if(my)Object.assign(my,x);else rows.push(x);}
    return rows.sort((a,b)=>(b.size-a.size)||(a.at-b.at));
  };
  settleFish=function(){if(!SB_UID)return;};   // 서버가 정산
  const _note=noteFishBest;
  noteFishBest=function(c){
    if(!SB_UID)return _note(c);
    const wk=weekKey();const prev=S.me.fishBestWk===wk&&(S.me.fishBest||{})[c.land];
    _note(c);
    if(FISH_LANDS[c.land]&&(!prev||c.size>prev.size))SB.from('fish_catches').insert({land:c.land,species:(FISH_BY_ID[c.sp]||{}).name||String(c.sp),size_cm:c.size}).then(()=>fbFetch(),()=>{});
  };
  const _rank=ACTS['fish-rank'];
  ACTS['fish-rank']=async(d,el,e)=>{if(!SB_UID)return _rank(d,el,e);await fbFetch();_rank(d,el,e);};
}

/* ───────── 파티 레이드 공유 (019) ─────────
   서버 모드에서 파티 레이드·토벌전 파티를 실제 블레서끼리 함께한다.
   · 모집: 파티를 만들면 서버 방(party_rooms)이 생기고, 다른 블레서의 모집 목록에 '실제 블레서 파티'로 보인다(봇 파티와 함께).
   · 참가·준비·내보내기·나가기·용병 목록은 서버 함수로. 공유 파티에는 봇이 저절로 들어오지 않는다(빈자리는 용병으로).
   · 전투: 파티장 화면이 전투를 돌린다. 파티장은 상태를 party_state에 올리고(턴마다 + 누가 행동을 정할 때),
     파티원은 자기 행동만 party_acts에 올린다. 파티원 화면은 받은 상태를 그대로 그린다. 시간 안에 안 정하면 자동 방어(원래 규칙).
   · 보상: 전투가 끝나면 각자 자기 화면에서 받는다(원래 '보상은 각자 지급').
   · 파티 채팅: 서버(party_msgs)로. 공유 파티에서는 봇이 실제 블레서 이름으로 말하지 않는다.
   · 던전 파티(5페이즈): 파티장 화면이 탐사를 진행하고(페이즈·체력·결과), 페이즈 전투는 위와 같은 공유 전투(페이즈마다 전투 id 따로).
     파티원은 보상을 자기 게임 규칙으로(보스 = 내 dungeonReward, 몬스터 = 던전 몬스터 규칙, 보물상자는 내 화면에서 따로 열림).
   · 랜덤 매칭: 먼저 같은 레이드·같은 목표 인원의 열린 실제 블레서 방에 들어가고, 없으면 '랜덤 매칭' 방을 열어 기다림.
     PT.matchWait(15초) 동안 아무도 안 오면 예전처럼 연습용 동료(봇)와 매칭, 몇 명 왔으면 빈자리는 용병으로 채워 출발.
   · 만신전(026): 운영자가 띄우면 kind='mass' 방이 생기고 모든 블레서에게 출현(전광판·팝업). 원정대 참가·취소는 서버 함수,
     공대장(먼저 들어온 블레서) 화면이 출발하며 빈자리를 연습용 동료(봇)로 채워 10×10 전투를 돌린다(위와 같은 공유 전투, 이동·아이템 포함).
     보상은 각자 내 게임의 만신전 보상 규칙으로. 레이드 채팅은 서버(party_msgs). */
const PT={matchWait:15000,rooms:[],room:null,ch:null,chRoom:null,listCh:null,rev:0,lastState:0,pushT:null,pushing:false,again:false,sent:null,setSig:'',setAt:0,msgIds:new Set(),loop:null};
const ptKindOk=m=>!!m&&['party','weekly','dungeon','event'].includes(mkind(m));
function ptCard(){const bo={};['maxHp','atk','def','luk'].forEach(k=>{const v=itemBonus(k);if(v)bo[k]=v;});return {equip:effEquip(),enh:S.me.enh||{},bonus:bo,hp:Math.round(hpNow()*1000)/1000};}
async function ptRpc(fn,args){const {data,error}=await SB.rpc(fn,args);if(error)throw error;return data;}
// card를 보내는 호출: 서버 세이브가 늦어 장비 확인(022)에 걸리면 저장을 마친 뒤 한 번 더, 그래도 안 되면 장비 없이
async function ptRpcCard(fn,args){
  try{return await ptRpc(fn,args);}
  catch(e){if(!/BAD_CARD/.test((e&&e.message)||''))throw e;}
  try{await cloudFlush();}catch(e){}
  try{return await ptRpc(fn,{...args,p_card:ptCard()});}
  catch(e){if(!/BAD_CARD/.test((e&&e.message)||''))throw e;}
  toast('장비 정보를 서버에서 확인하지 못해 이번 파티에는 장비 없이 참가합니다.','warn');
  return await ptRpc(fn,{...args,p_card:{hp:ptCard().hp}});
}
function ptErr(e){const m=(e&&e.message)||'';return /FULL/.test(m)?'자리가 꽉 찼습니다.':/NOT_INVITED/.test(m)?'초대 전용 파티입니다. 파티장의 초대를 받아야 들어갈 수 있습니다.':/BAD_CARD/.test(m)?'장비 정보가 서버 기록과 맞지 않습니다. 잠시 후 다시 해 주세요.':/NO_ROOM/.test(m)?'이미 사라진 파티입니다.':/NOT_GATHER/.test(m)?'이미 출발한 파티입니다.':/NOT_ACTIVE/.test(m)?'이용이 제한된 계정입니다.':/NOT_LEADER/.test(m)?'파티장만 할 수 있습니다.':'파티 서버에 연결하지 못했습니다. 잠시 후 다시 해 주세요.';}
const ptShared=()=>!!(S&&S.party&&S.party.shared&&S.party.roomId);
const ptBattle=()=>{const b=S&&S.battle;return b&&b.shared&&b.shared.room?b:null;};
const ptHost=b=>!!(b&&b.shared&&b.shared.host===SB_UID);

// 서버 방 → 게임 파티(S.party). 파티장은 자기 용병을 그대로 두고, 파티원은 방의 용병 목록을 받는다
function ptPartyFrom(r,prev){
  const iLead=r.leader===SB_UID;const lead=(r.members||[]).find(x=>x.uid===r.leader)||{};
  const real=(r.members||[]).map(x=>({name:x.name,job:isClass(x.job)?x.job:'defender',level:x.level||1,isMe:x.uid===SB_UID,ready:!!x.ready,uid:x.uid,real:true}));
  const mercs=iLead?((prev&&prev.members)||[]).filter(x=>x.merc):(r.extra||[]).map(x=>({name:x.name,job:isClass(x.job)?x.job:'defender',level:x.level||1,isMe:false,ready:true,merc:true}));
  const p=prev&&prev.roomId===r.id?prev:{id:'room:'+r.id,chat:[],invites:[]};
  const m=monster(r.monster_id);
  return Object.assign(p,{shared:true,roomId:r.id,name:r.name,monsterId:r.monster_id,leader:lead.name||'파티장',leaderUid:r.leader,visibility:r.visibility,target:r.target,
    members:[...real,...mercs],rev:m?m.rev:p.rev,changed:false,nextJoin:Infinity,invites:[],chat:p.chat||[]});
}
function ptRedraw(){if(S.route!=='battle')return renderTop();const ae=document.activeElement;if(ae&&/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)&&!$('#pop')?.contains(ae)){renderTop();return;}if(S.battle)renderFight();else render();}

// 모집 목록: 실제 블레서 방을 S.recruits 맨 앞에(봇 시뮬레이션이 고쳐도 1초마다 다시 맞춤)
async function ptFetchRooms(){
  if(!SB||!SB_UID)return;
  try{const since=new Date(Date.now()-15*60000).toISOString();
    const {data,error}=await SB.from('party_rooms').select('id,leader,monster_id,name,target,visibility,status,members,extra,invited,updated_at')
      .eq('status','gather').eq('kind','party').or(`visibility.eq.public,invited.cs.{${SB_UID}}`).gt('updated_at',since).order('updated_at',{ascending:false}).limit(20);
    if(error||!data)return;PT.rooms=data;ptMerge();}
  catch(e){console.warn(e);}
}
function ptEntries(){
  return PT.rooms.filter(r=>r.leader!==SB_UID&&(r.visibility!=='invite'||(r.invited||[]).includes(SB_UID))&&!(r.members||[]).some(x=>x.uid===SB_UID)&&monster(r.monster_id)).map(r=>{
    const lead=(r.members||[]).find(x=>x.uid===r.leader)||{};
    const people=[...(r.members||[]).map(x=>({name:x.name,job:isClass(x.job)?x.job:'defender',level:x.level||1,real:true,leader:x.uid===r.leader})),...(r.extra||[]).map(x=>({name:x.name,job:isClass(x.job)?x.job:'defender',level:x.level||1,merc:true}))];
    return {id:'room:'+r.id,real:true,roomId:r.id,name:r.name,monsterId:r.monster_id,leader:lead.name||'파티장',members:people.map(x=>x.name),people,target:r.target,createdAt:Date.parse(r.updated_at)};});
}
function ptMerge(){if(!S||!Array.isArray(S.recruits))return;S.recruits=[...ptEntries(),...S.recruits.filter(r=>!r.real)];}

// 방 하나 실시간(방 정보·전투 상태·행동·채팅)
function ptSubscribe(roomId){
  if(PT.chRoom===roomId)return;ptUnsub();PT.chRoom=roomId;PT.rev=0;PT.lastState=now();
  const f=`room_id=eq.${roomId}`;
  try{PT.ch=SB.channel('party-'+roomId)
    .on('postgres_changes',{event:'*',schema:'public',table:'party_rooms',filter:`id=eq.${roomId}`},pl=>{if(pl.new&&pl.new.id)ptRoomEvent(pl.new);})
    .on('postgres_changes',{event:'*',schema:'public',table:'party_state',filter:f},pl=>{if(pl.new&&pl.new.state)ptApplyState(pl.new.state,pl.new.rev);})
    .on('postgres_changes',{event:'*',schema:'public',table:'party_acts',filter:f},pl=>{if(pl.new&&pl.new.uid)ptApplyAct(pl.new);})
    .on('postgres_changes',{event:'INSERT',schema:'public',table:'party_msgs',filter:f},pl=>{if(pl.new)ptMsg(pl.new);})
    .subscribe();}catch(e){console.warn(e);}
  ptRefresh();
}
function ptUnsub(){if(PT.ch){try{SB.removeChannel(PT.ch);}catch(e){}}PT.ch=null;PT.chRoom=null;PT.room=null;}
async function ptRefresh(){try{await ptRefresh0();}catch(e){console.warn(e);}}
async function ptRefresh0(){
  const id=PT.chRoom;if(!id)return;
  const {data:r}=await SB.from('party_rooms').select('*').eq('id',id).maybeSingle();
  if(PT.chRoom!==id)return;
  if(!r){ptRoomGone('파티가 사라졌습니다.');return;}
  ptRoomEvent(r);
  if(r.status!=='gather'){const {data:st}=await SB.from('party_state').select('rev,state').eq('room_id',id).maybeSingle();if(st)ptApplyState(st.state,st.rev);}
  const {data:ms}=await SB.from('party_msgs').select('id,uid,name,text,created_at').eq('room_id',id).order('id',{ascending:false}).limit(40);
  (ms||[]).reverse().forEach(ptMsg);
}
function ptRoomGone(text){
  {const M=mtShared();if(M&&M.shared.room===PT.chRoom&&!(ptBattle()&&!ptBattle().over)){mtEnd(M.shared.room,'');ptUnsub();return;}}
  {const R=ptDrunMem();if(R&&!R.done){ptDrunAbort(text);return;}}
  const b=ptBattle();
  if(b&&!b.over&&!ptHost(b)){ptAbort('파티장이 전투를 끝냈습니다.');return;}
  if(S.party&&S.party.shared&&!S.battle){S.party=null;toast(text,'warn');if(S.route==='battle')render();else renderTop();save();}
  ptUnsub();
}
function ptRoomEvent(r){
  PT.room=r;
  if(r.kind==='mass'){mtApply(r);const inR=(r.members||[]).some(x=>x.uid===SB_UID);const b=ptBattle();
    if(r.status==='battle'&&inR&&r.leader!==SB_UID&&!b)ptRefreshStateOnce();
    if(r.status==='closed'&&b&&!b.over&&!ptHost(b))ptRefreshStateOnce();return;}
  {const q=S.queue;if(q&&q.roomId===r.id&&!S.battle){
    const inRoom=r.leader===SB_UID||(r.members||[]).some(x=>x.uid===SB_UID);
    if(r.status==='closed'||!inRoom){q.roomId=null;q.host=false;ptUnsub();}
    else if(r.status==='battle'&&r.leader!==SB_UID){S.queue=null;S.party=ptPartyFrom(r,null);S.sel.chatTab='party';ptRefreshStateOnce();}
    else if(q.host)ptQueueRoom(q);
    save();if(S.route==='battle')render();else renderTop();return;}}
  const inRoom=r.leader===SB_UID||(r.members||[]).some(x=>x.uid===SB_UID);
  if(!inRoom){ptRoomGone(r.status==='closed'?'파티가 해산되었습니다.':'파티에서 나가게 되었습니다.');return;}
  if(r.status==='closed'){const b=ptBattle();if(b&&!b.over&&!ptHost(b)){ptRefreshStateOnce();return;}
    const R=ptDrunMem();if(R&&R.shared.room===r.id&&!R.done){ptRefreshStateOnce().then(()=>{const R2=ptDrunMem();if(R2&&R2.shared.room===r.id&&!R2.done)ptDrunAbort('파티장이 던전 탐사를 끝냈습니다.');});return;}
    if(!S.battle)ptRoomGone('파티가 해산되었습니다.');return;}
  if(S.party&&S.party.roomId===r.id&&!S.battle){S.party=ptPartyFrom(r,S.party);save();ptRedraw();}
  if(r.status==='battle'&&r.leader!==SB_UID&&!ptBattle())ptRefreshStateOnce();
}
async function ptRefreshStateOnce(){const id=PT.chRoom;if(!id)return;const {data:st}=await SB.from('party_state').select('rev,state').eq('room_id',id).maybeSingle();if(st)ptApplyState(st.state,st.rev);}

// ── 전투: 파티장 ──
function ptSnapshot(b){
  const s=JSON.parse(JSON.stringify(b,(k,v)=>k==='result'?undefined:v));
  s.log=(s.log||[]).slice(-80);s.deadlineIn=Math.max(0,b.deadline-now());s.hostName=S.me.name;if(b.endsAt)s.endsIn=Math.max(0,b.endsAt-now());delete s.endsAt;if(s.blessR&&!s.bless)s.bless=s.blessR;delete s.blessR;if(b.place)s.place={go:b.place.go?1:0,untilIn:b.place.until?Math.max(0,b.place.until-now()):null};if(b.prep)s.prep={untilIn:Math.max(0,b.prep.until-now())};
  return s;
}
function ptPushSoon(){const b=ptBattle();if(!ptHost(b))return;clearTimeout(PT.pushT);PT.pushT=setTimeout(()=>ptPush(),500);}
async function ptPush(){
  const R=ptDrunHost(),b=ptBattle();if(!R&&!ptHost(b))return;if(R&&R.closed)return;clearTimeout(PT.pushT);PT.pushT=null;
  if(PT.pushing){PT.again=true;return;}PT.pushing=true;
  try{
    if(R){const withB=ptHost(b)&&b.shared.room===R.shared.room;
      const st=withB?ptSnapshot(b):{shared:{room:R.shared.room,host:SB_UID},nob:true,hostName:S.me.name};
      st.drun=ptDrunPayload(R);R.srev=(R.srev||0)+1;const over=!!R.done;
      await ptRpc('party_push',{p_room:R.shared.room,p_state:st,p_rev:R.srev,p_over:over});if(over){R.closed=true;save();}}
    else{b.srev=(b.srev||0)+1;await ptRpc('party_push',{p_room:b.shared.room,p_state:ptSnapshot(b),p_rev:b.srev,p_over:!!b.over});}}
  catch(e){console.warn(e);}
  finally{PT.pushing=false;if(PT.again){PT.again=false;ptPush();}}
}
function ptApplyAct(row){
  if(row.turn===-1){ptDrunHpAct(row);return;}
  if(row.turn===-2){if(row.action)mtBlessPick(row);return;}
  if(row.turn===-3){if(row.action)mtPlacePick(row);return;}
  const b=ptBattle();if(!ptHost(b)||b.over||row.turn!==b.turn)return;
  const f=b.players.find(p=>p.uid===row.uid&&!p.isMe);if(!f||f.dead)return;
  if(!row.action){f.action=null;f.action2=null;f.confirmed=false;b.allAt=null;}
  else{const a=row.action.action||{kind:'defend'};const a2=row.action.action2||null;
    if(b.grid&&a&&(a.kind==='move'||a.kind==='wait')){const to=Math.floor(+a.to);f.action=a.kind==='move'&&to>=0&&to<GRID*GRID?{kind:'move',to}:{kind:'wait'};f.action2=null;}
    else{const err=checkAct(b,f,a,hooks.hasItem);if(err){b.log.push({t:'sys',text:`${f.name} · 행동을 쓸 수 없어 방어 (${err})`});f.action={kind:'defend'};f.action2=null;}
      else{f.action=a;f.action2=a2&&!checkAct(b,f,a2,hooks.hasItem,a)?a2:null;}}
    if(b.grid){const it=row.action.itemAct;f.itemAct=it&&['potion','holywater','swiftdraft'].includes(it.item)?{item:it.item,target:f.id}:null;}
    f.confirmed=true;}
  save();if(S.route==='battle')renderFight();ptPushSoon();
}

// ── 전투: 파티원 ──
function ptApplyState(state,rev){
  if(!state||!S.me)return;
  if(rev!=null&&rev<=PT.rev)return;if(rev!=null)PT.rev=rev;PT.lastState=now();
  if(state.shared&&state.shared.host===SB_UID)return;   // 내가 파티장이면 내 화면이 원본
  if(state.drun){if((state.shared||{}).room===PT.chRoom)ptApplyDrunState(state);return;}
  const prev=S.battle&&S.battle.shared&&S.battle.shared.room===(state.shared||{}).room?S.battle:null;
  if(S.battle&&!prev&&!S.battle.over)return;            // 다른 전투 중
  const rid=(state.shared||{}).room;if(!rid||rid!==PT.chRoom)return;
  // 보상·진행에 쓰이는 값은 파티장이 보낸 것을 믿지 않고 내 게임 기준으로 다시 정한다(몬스터는 내가 참가한 방의 몬스터)
  const mid=(PT.room&&PT.room.id===rid&&PT.room.monster_id)||(S.party&&S.party.roomId===rid&&S.party.monsterId)||(prev&&prev.monsterId);
  const m=monster(mid);if(!ptKindOk(m))return;
  const b=JSON.parse(JSON.stringify(state));
  if(!Array.isArray(b.players)||!b.mon)return;
  ptTrust(b,m,rid);
  b.players.forEach(p=>{p.isMe=p.uid===SB_UID;if(!p.isMe)p.planAt=Infinity;});
  const me=b.players.find(p=>p.isMe);if(!me)return;
  // 보낸 행동이 아직 파티장 화면에 안 닿았으면 내 화면에서는 정한 그대로
  if(PT.sent&&PT.sent.turn===b.turn&&PT.sent.room===b.shared.room&&!me.confirmed&&PT.sent.action){me.action=PT.sent.action.action;me.action2=PT.sent.action.action2||null;if(b.grid)me.itemAct=PT.sent.action.itemAct||null;me.confirmed=true;}
  b.deadline=now()+(+state.deadlineIn||0);b.allAt=null;delete b.deadlineIn;
  if(b.place&&typeof b.place==='object'){const u=b.place.untilIn;b.place={t0:now(),go:b.place.go?now():null,until:u!=null?now()+Math.max(0,Math.min(120000,+u||0)):null,auto:{},botAt:{},done:{}};}else delete b.place;
  if(b.prep&&typeof b.prep==='object'){b.prep={t0:now(),until:now()+Math.max(0,Math.min(30000,+b.prep.untilIn||0))};}else delete b.prep;
  const first=!prev,newTurn=!prev||prev.turn!==b.turn;
  if(prev&&prev.result)b.result=prev.result;
  S.battle=b;
  if(first){if(mkind(monster(b.monsterId))==='party')daily().raid++;S.route='battle';S.sel.monster=null;toast(`${b.mon.name} 전투 시작 · ${b.grid?'공대장':'파티장'} ${state.hostName||''} 화면에서 진행됩니다`,'good');
    if(b.grid){const M=mtShared();if(M)M.phase='battle';S.sel.gmode='fight';S.sel.gcell=null;S.sel.gitem=null;}}
  if(newTurn)resetAct();
  if(b.grid&&b.bless&&(first?!b.bless.pick:(prev&&prev.bless&&!prev.bless.pick&&b.bless.pick))){if(b.bless.pick)S.sel.blessOpen=b.bless.cards.indexOf(b.bless.pick);setTimeout(()=>{if(S.battle===b||S.battle&&S.battle.id===b.id)showBless(!first||!!b.bless.pick);},0);}
  if(b.over&&!S.claimedB[b.id]){finishBattle(b);ptUnsub();}
  save();if(S.route==='battle'){if(first)render();else renderFight();}
}
// 파티원: 받은 전투 상태 중 보상·진행 값(rules·ctx·reward·이벤트·전투 id)을 내 게임의 몬스터 규칙으로 덮어씀
function ptTrust(b,m,rid){
  const ts=Math.min(120,Math.max(5,+((b.rules||{}).turnSeconds)||cfg().turnSeconds));
  if(mkind(m)==='event'){
    b.id='PT'+rid;b.monsterId=m.id;b.rules={exp:0,gold:0,drops:[],turnSeconds:ts};
    const M=mtShared();b.ctx={type:'mass',ev:M&&M.shared.room===rid?M.evId:'srvmass:'+rid};b.reward=massDef(m).reward;b.grid=true;delete b.eventBonus;
    const ks=Object.keys(BLESS);if(b.bless&&typeof b.bless==='object'){const B=b.bless;b.bless={by:String(B.by||'').slice(0,16),cards:Array.isArray(B.cards)&&B.cards.every(k=>ks.includes(k))?B.cards.slice(0,5):ks,pick:ks.includes(B.pick)?B.pick:null};b.bless.me=!b.bless.pick&&B.uid===SB_UID;}else delete b.bless;
    b.endsAt=now()+Math.max(0,Math.min(3600000,+b.endsIn||0))+60000;delete b.endsIn;
    b.mon.name=m.name;b.mon.art=m.art;b.mon.region=m.region;
    b.over=b.over==='win'||b.over==='lose'?b.over:null;
    b.players.forEach(p=>{p.direct=Math.max(0,Math.min(999,+p.direct||0));});return;}
  b.id='PT'+rid;b.monsterId=m.id;
  b.rules={exp:m.exp,gold:m.gold,drops:(m.drops||[]).map(d=>d.slice()),turnSeconds:ts};
  b.ctx={type:mkind(m)};delete b.eventBonus;delete b.reward;delete b.bless;
  if(m.gridRaid){b.grid=true;b.endsAt=now()+Math.max(0,Math.min(3600000,+b.endsIn||0))+60000;delete b.endsIn;}else delete b.grid;   // 8장 보스 토벌(그리드)
  const ev=eventFor(m.id);if(ev){b.ctx.ev=ev.id;b.rules.exp=Math.round(b.rules.exp*1.5);b.rules.gold=Math.round(b.rules.gold*1.5);b.eventBonus=ev.title;}
  b.mon.name=m.name;b.mon.art=m.art;b.mon.region=m.region;
  b.over=b.over==='win'||b.over==='lose'?b.over:null;
  b.players.forEach(p=>{p.direct=Math.max(0,Math.min(999,+p.direct||0));});
}
// 파티장: 파티원이 보낸 장비·강화·보너스(card)를 그 사람의 레벨·직업으로 가질 수 있는 범위로 거름
const PT_BONUS_CAP=(()=>{const c={maxHp:0,atk:0,def:0,luk:0};try{for(const id in ITEMS){const it=ITEMS[id];[it.buff,it.buff2].forEach(x=>{if(x&&c[x.stat]!=null)c[x.stat]+=Math.max(0,+x.val||0);});}}catch(e){}return c;})();
function ptSanCard(c,job,level){
  c=c&&typeof c==='object'?c:{};const eq={},enh={},bo={};
  const ce=c.equip&&typeof c.equip==='object'?c.equip:{};
  for(const sl in SLOT){const id=ce[sl];const it=typeof id==='string'&&ITEMS.hasOwnProperty(id)?ITEMS[id]:null;
    if(it&&it.type==='equip'&&it.slot===sl&&(it.levelReq||0)<=level&&classAllowed(it,job))eq[sl]=id;}
  const ch=c.enh&&typeof c.enh==='object'?c.enh:{};
  Object.values(eq).forEach(id=>{const v=Math.floor(+ch[id]||0);if(v>0)enh[id]=Math.min(ENH_MAX,v);});
  const cb=c.bonus&&typeof c.bonus==='object'?c.bonus:{};
  for(const k in PT_BONUS_CAP){const v=+cb[k]||0;if(v>0)bo[k]=Math.min(PT_BONUS_CAP[k],v);}
  const hp=Math.min(1,Math.max(0.05,+c.hp||1));
  return {equip:eq,enh,bonus:bo,hp};
}
function ptAbort(text){
  const b=ptBattle();if(!b||b.over)return;
  b.over='lose';b.log.push({t:'lose',text});finishBattle(b);ptUnsub();save();if(S.route==='battle')render();notify(text,'warn');
}
async function ptSendAct(){
  const b=ptBattle();if(!b||ptHost(b)||b.over)return;
  const me=b.players.find(p=>p.isMe);if(!me)return;
  const act=me.confirmed?{action:me.action,action2:me.action2||null,itemAct:b.grid&&me.itemAct?{item:me.itemAct.item}:null}:null;
  PT.sent={room:b.shared.room,turn:b.turn,action:act};
  // 아이템은 내 인벤토리에서 정할 때 빼고, 행동을 바꾸면 돌려준다(파티장 화면은 내 인벤토리를 모름)
  const it=act&&([act.action,act.action2].find(a=>a&&a.kind==='item')||act.itemAct);const hold=PT.itemHold;
  if(hold&&(hold.turn!==b.turn||hold.room!==b.shared.room)){PT.itemHold=null;}
  else if(hold&&(!it||it.item!==hold.item)){S.me.inv[hold.item]=(S.me.inv[hold.item]||0)+1;PT.itemHold=null;}
  if(it&&!PT.itemHold&&(S.me.inv[it.item]||0)>0){S.me.inv[it.item]--;if(!S.me.inv[it.item])delete S.me.inv[it.item];PT.itemHold={room:b.shared.room,turn:b.turn,item:it.item};}
  try{await ptRpc('party_act',{p_room:b.shared.room,p_turn:b.turn,p_action:act});}
  catch(e){console.warn(e);toast('행동을 파티장에게 보내지 못했습니다. 다시 정해 주세요.','bad');me.confirmed=false;PT.sent=null;renderFight();}
}

// 파티 채팅
function ptMsg(row){
  {const M=mtShared();if(M&&row.room_id===M.shared.room){const id='srv:'+row.id;if(PT.msgIds.has(id))return;PT.msgIds.add(id);
    const ch=M.chat=M.chat||[];if(ch.some(m=>m.id===id))return;ch.push({id,from:row.uid===SB_UID?S.me.name:row.name,text:row.text,ts:Date.parse(row.created_at)||now()});M.chat=ch.slice(-150);
    if(row.uid!==SB_UID&&typeof visibleTab==='function'&&!visibleTab('raid'))S.unread.raid=(S.unread.raid||0)+1;
    try{updateChats();renderTop();}catch(e){}return;}}
  if(!S.party||S.party.roomId!==row.room_id&&row.room_id)return;
  const id='srv:'+row.id;if(PT.msgIds.has(id))return;PT.msgIds.add(id);
  const ch=S.party.chat=S.party.chat||[];if(ch.some(m=>m.id===id))return;
  ch.push({id,from:row.uid===SB_UID?S.me.name:row.name,text:row.text,ts:Date.parse(row.created_at)||now()});S.party.chat=ch.slice(-150);
  if(row.uid!==SB_UID&&typeof visibleTab==='function'&&!visibleTab('party'))S.unread.party=(S.unread.party||0)+1;
  try{updateChats();renderTop();}catch(e){}
}

// 1초마다: 모집 목록 맞추기 · 파티장 살아 있음/용병 목록 · 끊긴 파티장 감지
function ptLoop(){
  if(!SB_UID||!S||!S.me)return;
  ptMerge();
  const p=S.party;
  if(p&&p.shared){p.nextJoin=Infinity;if(PT.chRoom!==p.roomId)ptSubscribe(p.roomId);
    if(p.leaderUid===SB_UID&&!S.battle){const mercs=p.members.filter(x=>x.merc).map(x=>({name:x.name,job:x.job,level:x.level}));
      const sig=JSON.stringify([mercs,p.visibility,p.target]);
      if(sig!==PT.setSig||now()-PT.setAt>120000){PT.setSig=sig;PT.setAt=now();ptRpc('party_set',{p_room:p.roomId,p_extra:mercs,p_vis:p.visibility,p_target:p.target}).catch(e=>console.warn(e));}}}
  const b=ptBattle();
  if(b&&!b.over){
    if(PT.chRoom!==b.shared.room)ptSubscribe(b.shared.room);
    if(ptHost(b)){b.players.forEach(f=>{if(f.real&&!f.isMe&&!f.confirmed)f.planAt=Infinity;});}
    else{b.players.forEach(f=>{if(!f.isMe)f.planAt=Infinity;});
      const limit=(b.rules.turnSeconds||30)*1000+45000;if(now()-PT.lastState>limit)ptAbort('파티장과 연결이 끊겨 전투가 끝났습니다.');}
  }
  const R=ptDrun();if(R&&!R.done&&PT.chRoom!==R.shared.room&&!(b&&!b.over))ptSubscribe(R.shared.room);
  const q=S.queue&&S.queue.roomId?S.queue:null;if(q&&PT.chRoom!==q.roomId)ptSubscribe(q.roomId);
  const MM=mtShared(),mIn=MM&&MM.phase==='gather'&&MM.roster.some(x=>x.isMe);if(mIn&&PT.chRoom!==MM.shared.room&&!(b&&!b.over))ptSubscribe(MM.shared.room);
  if(q&&q.host&&!q.busy)ptQueueRoom(q);
  if(PT.chRoom&&!(mIn&&MM.shared.room===PT.chRoom)&&!(q&&q.roomId===PT.chRoom)&&!(S.party&&S.party.roomId===PT.chRoom)&&!(b&&b.shared.room===PT.chRoom&&!b.over)&&!(R&&!R.done&&R.shared.room===PT.chRoom))ptUnsub();
}
async function ptStart(){
  ptFetchRooms();
  try{PT.listCh=SB.channel('party-list').on('postgres_changes',{event:'*',schema:'public',table:'party_rooms'},pl=>{clearTimeout(PT.listT);PT.listT=setTimeout(()=>{ptFetchRooms();mtFetch();},700);}).subscribe();}catch(e){}
  setInterval(ptFetchRooms,120000);setInterval(mtFetch,60000);   /* 실시간(party-list)이 주 */
  mtFetch();
  clearInterval(PT.loop);PT.loop=setInterval(ptLoop,1000);
  const b=ptBattle();
  if(S.party&&S.party.shared)ptSubscribe(S.party.roomId);
  else if(b&&!b.over)ptSubscribe(b.shared.room);
  else if(ptDrun()&&!ptDrun().done){ptSubscribe(ptDrun().shared.room);if(ptDrunHost())ptPush();}
  else if(S.queue&&S.queue.roomId){S.queue.busy=false;ptSubscribe(S.queue.roomId);}
  if(b&&!b.over&&ptHost(b)){b.players.forEach(f=>{if(f.real&&!f.isMe&&!f.confirmed)f.planAt=Infinity;});ptPush();}
}

// 실제 블레서 전투원: 방 사람의 card(장비·강화·보너스·체력)를 거른 뒤 그 사람 전투원으로 바꿔 끼움
function ptRealFighters(b,list,hpOf){
  b.players.forEach((f,i)=>{
    if(f.isMe){f.uid=SB_UID;return;}
    const rm=(list||[]).find(x=>x.name===f.name&&x.uid&&x.uid!==SB_UID);if(!rm)return;
    const job=isClass(rm.job)?rm.job:f.job,lv=Math.max(1,Math.min(99,Math.round(+rm.level||f.level||1)));
    const c=ptSanCard(rm.card,job,lv);const nf=makeFighter({id:f.id,name:f.name,job,level:lv,equip:c.equip,enh:c.enh});
    for(const k in f)if(!(k in nf))nf[k]=f[k];   // 그리드 위치(pos) 등
    const bo=c.bonus||{};['maxHp','atk','def','luk'].forEach(k=>{const v=+bo[k]||0;if(v)nf[k]+=v;});
    const h=hpOf?hpOf(rm.uid,c.hp):c.hp;
    nf.hp=Math.max(1,Math.round(nf.maxHp*Math.min(1,Math.max(0.05,+h||0.05))));nf.uid=rm.uid;nf.real=true;nf.planAt=Infinity;b.players[i]=nf;});
}

// ── 던전 파티(5페이즈) ──
// S.drun.shared={room,host}. 파티장: R.hps(블레서별 남은 체력)·R.cards를 들고 진행. 파티원: 받은 진행을 따라가고 보상은 자기 게임 규칙으로.
const ptDrun=()=>{const R=S&&S.drun;return R&&R.shared&&R.shared.room?R:null;};
const ptDrunHost=()=>{const R=ptDrun();return R&&R.shared.host===SB_UID?R:null;};
const ptDrunMem=()=>{const R=ptDrun();return R&&R.shared.host!==SB_UID?R:null;};
const PT_DR_MOB_ART=['beast','spirit','golem'];
function ptPhasesOk(a){return Array.isArray(a)&&a.length===5&&a[4]==='boss'&&a.slice(0,4).every(x=>['monster','chest','trap','empty'].includes(x))&&a.slice(0,4).filter(x=>x==='monster').length===2;}
function ptDrunPayload(R){const hp={...(R.hps||{})};hp[SB_UID]=R.hp;
  return {mid:R.mid,phases:R.phases,idx:R.idx,done:R.done||null,last:String(R.last||'').slice(0,160),hp,
    party:(R.party||[]).map(x=>({name:x.name,job:x.job,level:x.level,uid:x.uid||null}))};}
function ptStartDrun(p){
  const room=PT.room&&PT.room.id===p.roomId?PT.room:null;
  _ptStartBattle();const R=S.drun;if(!R||R.mid!==p.monsterId)return;
  R.party.forEach(x=>{if(x.isMe){x.uid=SB_UID;return;}const rm=room&&(room.members||[]).find(y=>y.name===x.name&&y.uid!==SB_UID);if(rm)x.uid=rm.uid;});
  R.cards={};R.hps={};
  ((room&&room.members)||[]).forEach(rm=>{if(rm.uid===SB_UID)return;const job=isClass(rm.job)?rm.job:'defender',lv=Math.max(1,Math.min(99,Math.round(+rm.level||1)));
    const c=ptSanCard(rm.card,job,lv);R.cards[rm.uid]={name:rm.name,job,level:lv,card:c};R.hps[rm.uid]=c.hp;});
  R.shared={room:p.roomId,host:SB_UID};R.srev=0;
  ptRpc('party_start',{p_room:p.roomId}).then(()=>ptPush()).catch(err=>{console.warn(err);toast('파티원에게 던전 입장을 알리지 못했습니다.','warn');});
  save();if(S.route==='battle')render();
}
// 파티장: 파티원이 던전 사이에 회복약을 마심 → 그 사람 체력(한 번에 최대 +60%까지만 인정)
function ptDrunHpAct(row){
  const R=ptDrunHost();if(!R||R.done||row.room_id!==R.shared.room||!row.action||!R.hps||R.hps[row.uid]==null)return;
  if(S.battle&&!S.battle.over&&S.battle.shared&&S.battle.shared.room===R.shared.room)return;
  const v=+row.action.hp,o=R.hps[row.uid];if(!(v>o))return;
  R.hps[row.uid]=Math.min(1,o+0.6,v);save();ptPush();
}
// 파티원: 보물상자는 내 화면에서 따로 연다(05-features drunEvent와 같은 규칙)
function ptDrunChest(R,boss){
  const L=boss.level;const g=Math.round(20+L*3+Math.random()*L*2);const it={};let line=`${g}골드`;
  if(Math.random()<0.4&&(boss.loot||[]).length){const x=pickLoot(boss);it[x]=1;line+=` · ${ITEMS[x]?ITEMS[x].name:x}`;}else if(Math.random()<0.5){it.potion=1;line+=' · 회복약';}
  grant({exp:0,gold:g,items:it},'dungeon',{label:boss.region+' 보물상자',region:boss.region,noRec:1});
  const text=`낡은 보물상자를 열었다 · ${line}`;R.log.push(`${R.idx+1}페이즈 · 보물상자 · ${text}`);rec('dungeon',`${boss.region} ${R.idx+1}페이즈 · ${text}`);R.last=text;
}
// 파티원: 받은 페이즈 전투의 보상·진행 값을 내 게임 기준으로
function ptTrustDrun(b,boss,rid,R,ph){
  const ts=Math.min(120,Math.max(5,+((b.rules||{}).turnSeconds)||cfg().turnSeconds));
  const k=R.phases[ph];const ok=ph===R.idx&&!R.done&&(k==='monster'||k==='boss');
  b.id='PT'+rid+':'+ph;b.mon=b.mon&&typeof b.mon==='object'?b.mon:{};
  if(k==='boss'){const tg=dtg(boss.id),RW=dungeonReward(boss,tg);b.monsterId=boss.id;b.rules={exp:RW.exp,gold:RW.gold,drops:RW.drops,turnSeconds:ts};
    b.ctx={type:'dungeon',target:tg,drun:true,hpPct:R.hp};b.mon.name=boss.name;b.mon.art=boss.art;}
  else{const L=boss.level;b.monsterId='drun_'+boss.id+'_'+ph;b.rules={exp:Math.round(10+L*3),gold:Math.round(5+L),drops:[],turnSeconds:ts};
    b.ctx={type:'drun',drun:true,hpPct:R.hp};b.mon.name=DRUN_MOBS.includes(b.mon.name)?b.mon.name:'던전 몬스터';b.mon.art=PT_DR_MOB_ART.includes(b.mon.art)?b.mon.art:'beast';}
  b.mon.region=boss.region;
  if(!ok){b.rules.exp=0;b.rules.gold=0;b.rules.drops=[];b.ctx={type:'drun'};}
  delete b.eventBonus;delete b.reward;delete b.bless;delete b.grid;
  b.over=b.over==='win'||b.over==='lose'?b.over:null;
  b.players.forEach(p=>{p.direct=Math.max(0,Math.min(999,+p.direct||0));});
}
function ptApplyDrunState(state){
  const D=state.drun,rid=state.shared.room;
  const mid=(PT.room&&PT.room.id===rid&&PT.room.monster_id)||(S.party&&S.party.roomId===rid&&S.party.monsterId)||(ptDrun()&&ptDrun().shared.room===rid&&ptDrun().mid);
  const boss=monster(mid);if(!boss||mkind(boss)!=='dungeon'||!D||typeof D!=='object')return;
  let R=ptDrun(),fresh=false;
  if(R&&R.shared.room!==rid)return;
  if(!R){
    if(S.drun||(S.battle&&!S.battle.over)||D.done||!ptPhasesOk(D.phases))return;
    R=S.drun={mid:boss.id,phases:D.phases.slice(),idx:0,hp:Math.max(0.05,hpNow()),mobs:{},log:[],start:now(),party:[],shared:{room:rid,host:state.shared.host}};
    S.party=null;S.sel.monster=null;S.route='battle';fresh=true;
    toast(`${boss.region} 입장 · 파티장 ${String(state.hostName||'').slice(0,16)}의 화면에서 진행됩니다`,'good');
  }
  if(Array.isArray(D.party))R.party=D.party.slice(0,8).map(x=>({name:String((x&&x.name)||'').slice(0,16),job:isClass(x&&x.job)?x.job:'defender',level:Math.max(1,Math.min(99,Math.round(+(x&&x.level)||1))),uid:(x&&x.uid)||null,isMe:!!x&&x.uid===SB_UID}));
  // 1) 페이즈 전투
  let first=false;
  if(!state.nob&&Array.isArray(state.players)&&state.mon){
    const ph=Math.floor(+state.shared.ph);
    const prev=S.battle&&S.battle.shared&&S.battle.shared.room===rid&&S.battle.shared.ph===ph?S.battle:null;
    const id='PT'+rid+':'+ph;
    if(Number.isInteger(ph)&&(prev||!(S.battle&&!S.battle.over))&&!(!prev&&(ph<R.idx||S.claimedB[id]))){
      const b=JSON.parse(JSON.stringify(state));delete b.drun;delete b.nob;
      ptTrustDrun(b,boss,rid,R,ph);
      b.players.forEach(p=>{p.isMe=p.uid===SB_UID;if(!p.isMe)p.planAt=Infinity;});
      const me=b.players.find(p=>p.isMe);
      if(me){
        if(PT.sent&&PT.sent.turn===b.turn&&PT.sent.room===rid&&!me.confirmed&&PT.sent.action){me.action=PT.sent.action.action;me.action2=PT.sent.action.action2||null;me.confirmed=true;}
        b.deadline=now()+(+state.deadlineIn||0);b.allAt=null;delete b.deadlineIn;
  if(b.place&&typeof b.place==='object'){const u=b.place.untilIn;b.place={t0:now(),go:b.place.go?now():null,until:u!=null?now()+Math.max(0,Math.min(120000,+u||0)):null,auto:{},botAt:{},done:{}};}else delete b.place;
  if(b.prep&&typeof b.prep==='object'){b.prep={t0:now(),until:now()+Math.max(0,Math.min(30000,+b.prep.untilIn||0))};}else delete b.prep;
        first=!prev;const newTurn=!prev||prev.turn!==b.turn;
        if(prev&&prev.result)b.result=prev.result;
        S.battle=b;if(first){S.route='battle';toast(`${R.idx+1}페이즈 · ${b.mon.name} · 파티 전투`,'good');}
        if(newTurn)resetAct();
        if(b.over&&!S.claimedB[b.id])finishBattle(b);
      }
    }
  }
  // 2) 진행(전투 결과를 받은 뒤): 지나간 페이즈 따라가기 · 체력 · 끝
  const busy=S.battle&&!S.battle.over&&S.battle.shared&&S.battle.shared.room===rid;
  const to=Math.max(R.idx,Math.min(R.phases.length,Math.floor(+D.idx||0)));
  while(!R.done&&R.idx<to){const k=R.phases[R.idx];
    if(k==='chest')ptDrunChest(R,boss);
    else if(k==='trap'||k==='empty'){R.last=String(D.last||'').slice(0,160);R.log.push(`${R.idx+1}페이즈 · ${DRUN_KIND[k][0]} · ${R.last}`);}
    else R.log.push(`${R.idx+1}페이즈 · ${DRUN_KIND[k][0]} · 파티가 지나감`);
    R.idx++;}
  if(!busy){const h=+((D.hp||{})[SB_UID]);if(h>0)R.hp=Math.max(0.05,Math.min(1,h));}
  if(D.done&&!R.done&&!busy){R.done=D.done==='win'&&R.idx>=R.phases.length?'win':'lose';if(D.done==='quit')R.quitBy='파티장이 던전 탐사를 포기했습니다.';}
  if(R.done)ptUnsub();
  save();
  if(S.route==='battle'){if(fresh||first||!S.battle)render();else renderFight();}else renderTop();
}
function ptDrunAbort(text){
  const R=ptDrunMem();if(!R)return;
  const b=ptBattle();if(b&&!b.over)ptAbort(text);
  if(!R.done){R.done='lose';}R.quitBy=text;save();ptUnsub();
  if(S.route==='battle'&&!S.battle)render();notify(text,'warn');
}
let _ptStartBattle=null;

// ── 만신전(026) ──
const MT={starting:false};
const mtShared=()=>{const M=S&&S.mass;return M&&M.shared&&M.shared.room?M:null;};
async function mtFetch(){
  if(!SB||!SB_UID||!S||!S.me)return;
  try{const since=new Date(Date.now()-90*60000).toISOString();
    const {data,error}=await SB.from('party_rooms').select('id,kind,leader,spawner,monster_id,target,status,members,until,meta,updated_at')
      .eq('kind','mass').neq('status','closed').gt('until',since).order('until',{ascending:false}).limit(6);
    if(error||!data)return;
    const M=mtShared();const inB=S.battle&&S.battle.ctx&&S.battle.ctx.type==='mass'&&!S.battle.over;
    if(M&&!data.some(r=>r.id===M.shared.room)&&!inB){mtEnd(M.shared.room,'');if(S.route==='battle')render();}
    /* 030 두 방(메인 2026-11-07): 내가 들어간 방 > 보고 있던 방(모집 중) > 모집 중인 다른 방. 보고만 있던 방이 출발하면 남은 방으로 옮겨 보여 줌 */
    const gOK=x=>x.status==='gather'&&Date.parse(x.until)>now();
    const mineR=data.find(x=>(x.members||[]).some(m=>m.uid===SB_UID));
    const M1=mtShared();const cur=M1&&data.find(x=>x.id===M1.shared.room);
    const open=x=>gOK(x)&&(x.members||[]).length<x.target;const pickO=data.find(open);
    let r=mineR||(cur&&gOK(cur)&&(open(cur)||!pickO)?cur:null)||pickO||data.find(gOK)||cur;
    if(M1&&r&&r.id!==M1.shared.room&&!inB&&M1.phase==='gather'&&!M1.roster.some(x=>x.isMe))mtEnd(M1.shared.room,'');
    if(r){mtApply(r);const M2=mtShared();if(M2&&M2.shared.room===r.id){const g=r.meta&&r.meta.grp;
      M2.sibs=g?data.filter(x=>x.meta&&x.meta.grp===g).map(x=>({id:x.id,slot:+(x.meta.slot)||1,n:(x.members||[]).length,target:x.target,status:x.status,me:(x.members||[]).some(m=>m.uid===SB_UID)})).sort((a,b)=>a.slot-b.slot):null;
      if(S.route==='battle'&&!S.battle){const ae=document.activeElement;if(!(ae&&/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)))render();}}}}
  catch(e){console.warn(e);}
}
function mtEnd(rid,text){
  const evId='srvmass:'+rid;S.events=(S.events||[]).filter(e=>e.id!==evId);
  const M=S.mass;if(M&&M.shared&&M.shared.room===rid)massEnd(text);else{refreshTicker();save();}
}
function mtApply(r){
  if(!S||!S.me)return;const m=monster(r.monster_id);if(!m||mkind(m)!=='event')return;
  const evId='srvmass:'+r.id,until=Date.parse(r.until)||now();const me=(r.members||[]).some(x=>x.uid===SB_UID);
  const M0=S.mass,mine=M0&&M0.shared&&M0.shared.room===r.id;
  const inMassBattle=S.battle&&S.battle.ctx&&S.battle.ctx.type==='mass'&&!S.battle.over;
  if(r.status==='closed'){if(mine&&!inMassBattle)mtEnd(r.id,'');return;}
  if(r.status==='battle'&&!me){if(mine&&M0.phase==='gather'){mtEnd(r.id,`${m.name} 만신전 원정대가 출발했습니다. 이번 출현은 종료되었습니다.`);if(S.route==='battle')render();}return;}
  if(r.status==='gather'&&until<now()-20000&&!me){if(mine){mtEnd(r.id,'');if(S.route==='battle')render();}return;}
  if(!mine&&(inMassBattle||(M0&&M0.phase==='battle')))return;          // 다른 만신전 전투 중
  const meta=r.meta&&typeof r.meta==='object'?r.meta:{};
  let e=(S.events||[]).find(x=>x.id===evId);
  if(!e){e={id:evId,kind:'boss',title:String(meta.title||m.name).slice(0,60),loc:String(meta.loc||'').slice(0,40),land:LANDS[meta.land]?meta.land:undefined,reward:'참여 · 처치 보상',link:'monster:'+m.id,until,mass:true,by:'운영자'};
    (S.events=S.events||[]).push(e);refreshTicker();}
  else e.until=until;
  if(M0&&!M0.shared&&M0.phase==='gather')massEnd('');   // 이 기기의 예전 만신전 → 서버 것으로
  let M=S.mass;const fresh=!(M&&M.shared&&M.shared.room===r.id);
  if(fresh)M=S.mass={evId,monsterId:m.id,roster:[],leader:null,nextJoin:Infinity,phase:'gather',chat:[],shared:{room:r.id}};
  M.roster=(r.members||[]).map(x=>({name:String(x.name||'').slice(0,16),job:isClass(x.job)?x.job:'defender',level:Math.max(1,Math.min(99,Math.round(+x.level||1))),isMe:x.uid===SB_UID,uid:x.uid,real:true}));
  const lead=(r.members||[]).find(x=>x.uid===r.leader);M.leader=lead?lead.name:null;M.leaderUid=lead?lead.uid:null;M.target=Math.min(20,r.target||20);M.until=until;
  const seen=S.massSeen=Array.isArray(S.massSeen)?S.massSeen:[];
  if(fresh&&r.status==='gather'&&!seen.includes(r.id)&&!(meta.grp&&seen.includes('g:'+meta.grp))){seen.push(r.id);if(meta.grp)seen.push('g:'+meta.grp);S.massSeen=seen.slice(-20);if(!me){notify(`[만신전 출현] ${m.name}${e.loc?' · '+e.loc:''}`,'warn');evPopup(e,m);}}
  save();
  if(S.route==='battle'&&!S.battle){const ae=document.activeElement;if(!(ae&&/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)))render();}else renderTop();
}
// 공대장: 출발 → 빈자리 봇 → 원래 massStart → 실제 블레서 전투원으로 바꿔 끼우고 공유
async function mtStart(){
  const M=mtShared();if(!M||M.phase!=='gather'||MT.starting)return;MT.starting=true;
  try{
    try{await ptRpc('mass_start',{p_room:M.shared.room});}catch(e){console.warn(e);return;}
    const {data:r}=await SB.from('party_rooms').select('*').eq('id',M.shared.room).maybeSingle();
    if(!r||S.mass!==M)return;PT.room=r;mtApply(r);
    const m=monster(M.monsterId),C=massCfg();
    for(let g=0;g<40&&!massReady(M)&&M.roster.length<Math.min(C.maxPlayers,20);g++){if(!massAddBot(M,m))break;}
    if(!massReady(M))for(let g=0;g<40&&M.roster.length<C.minPlayers;g++){if(!massAddBot(M,m))break;}
    _ptMassStart();const b=S.battle;if(!b||!b.grid||!b.ctx||b.ctx.type!=='mass')return;
    ptRealFighters(b,r.members||[],null);
    b.shared={room:r.id,host:SB_UID};b.srev=0;ptSubscribe(r.id);
    mtBlessHold(b);
    save();ptPush();
  }finally{MT.starting=false;}
}
let _ptMassStart=null;
// 가호 카드: 뽑힌 사람이 공대장이 아닌 실제 블레서면, 공대장 화면(봇 자동 선택 타이머)이 대신 고르지 않게
// b.bless를 b.blessR로 잠시 옮겨 둔다 → 그 사람이 고르면(party_act turn -2) 적용, 첫 턴 처리 때까지 안 고르면 무작위(원래 규칙)
function mtBlessHold(b){
  const B=b&&b.bless;if(!B||B.pick)return false;
  const f=b.players.find(p=>p.name===B.by&&p.real&&!p.isMe);if(!f)return false;
  B.me=false;B.uid=f.uid;b.blessR=B;delete b.bless;b.deadline+=20000;
  if($('.modal.bless'))modal('');save();ptPush();return true;
}
// 만신전 위치 선정: 원정대원이 고른 칸(party_act turn -3) → 공대장 화면이 먼저 온 순서대로 받음
function mtPlacePick(row){const b=ptBattle();if(!ptHost(b)||b.over||!b.place||!b.place.go)return;
  const f=b.players.find(p=>p.uid===row.uid&&!p.isMe);if(!f)return;const i=Math.floor(+row.action.place);
  if(!(i>=0&&i<GRID*GRID))return;if(!placeSet(b,f,i))return;save();
  if(b.players.every(p=>p.pos!=null)){placeDone(b);return;}if(S.route==='battle')renderFight();ptPushSoon();}
function mtBlessPick(row){
  const b=ptBattle();if(!ptHost(b)||b.over||!b.blessR)return;const B=b.blessR;
  if(B.pick||row.uid!==B.uid)return;const i=Math.floor(+row.action.bless);if(!(i>=0&&i<B.cards.length))return;
  b.bless=B;delete b.blessR;S.sel.blessOpen=i;applyBless(b,B.cards[i]);save();
  if(S.route==='battle')render();if($('.modal.bless'))showBless(true);else toast(`${B.by}님이 「${BLESS[B.pick][0]}」을(를) 골랐습니다.`,'good');
  ptPush();
}

const ptQ=()=>{const q=S&&S.queue;return q&&SB_UID&&ptKindOk(monster(q.monsterId))?q:null;};
function ptQueueFind(q){return ptEntries().filter(r=>r.monsterId===q.monsterId&&r.target===q.target&&r.roomId!==q.roomId&&!joinReason(r)).sort((a,b)=>a.roomId<b.roomId?-1:1)[0]||null;}
async function ptQueueJoin(q,rid){
  q.busy=true;
  try{const room=await ptRpcCard('party_join',{p_room:rid,p_card:ptCard()});
    if(S.queue!==q){ptRpc('party_leave',{p_room:room.id}).catch(()=>{});return;}
    q.roomId=room.id;q.host=false;PT.room=room;ptSubscribe(room.id);save();if(S.route==='battle')render();}
  catch(e){console.warn(e);ptFetchRooms();}
  finally{q.busy=false;}
}
async function ptQueueOpen(q){
  q.busy=true;
  try{const id=await ptRpcCard('party_create',{p_monster:q.monsterId,p_name:'랜덤 매칭',p_target:q.target,p_vis:'public',p_card:ptCard()});
    if(S.queue!==q){ptRpc('party_leave',{p_room:id}).catch(()=>{});return;}
    q.roomId=id;q.host=true;q.openAt=now();ptSubscribe(id);save();if(S.route==='battle')render();}
  catch(e){console.warn(e);q.botOnly=true;}
  finally{q.busy=false;}
}
// 방장(먼저 연 사람): 다 모이면 출발, 기다림이 끝나면 용병으로 채워 출발 · 혼자면 봇 매칭으로
function ptQueueRoom(q){
  const room=PT.room;if(!room||room.id!==q.roomId||!q.host||q.busy||room.status!=='gather')return false;
  const real=(room.members||[]).length;
  if(real<=1){const other=ptQueueFind(q);if(other&&other.roomId<room.id){ptQueueJoin(q,other.roomId);return false;}}
  const waited=now()-q.since>=PT.matchWait;
  if(real>=q.target||(waited&&real>=2)){ptQueueGo(q,room,real<q.target);return true;}
  if(waited){ptRpc('party_leave',{p_room:room.id}).catch(()=>{});q.roomId=null;q.host=false;q.botOnly=true;ptUnsub();save();if(S.route==='battle')render();}
  return false;
}
function ptQueueGo(q,room,fill){
  S.queue=null;S.party=ptPartyFrom(room,null);S.party.members.forEach(x=>{x.ready=true;});S.sel.chatTab='party';
  if(fill&&ACTS['merc-fill'])ACTS['merc-fill']();
  sysParty('랜덤 매칭으로 실제 블레서 파티가 구성되었습니다.');
  startBattle();
}


if(ONLINE){
  // 아이템 사용: 공유 전투에서 '나'의 전투원 id는 'me'가 아닐 수 있음. 파티장 화면은 파티원 아이템을 믿고(각자 차감) 처리
  const _has=hooks.hasItem,_use=hooks.useItem;
  const myFid=()=>{const b=S.battle;const me=b&&b.players.find(p=>p.isMe);return me?me.id:'me';};
  hooks.hasItem=(pid,k)=>{const b=ptBattle();if(!b)return _has(pid,k);if(pid===myFid())return _has('me',k);if(ptHost(b)){const f=b.players.find(p=>p.id===pid);return !!(f&&f.real);}return false;};
  hooks.useItem=(pid,k)=>{const b=ptBattle();if(!b)return _use(pid,k);if(pid===myFid())return _use('me',k);};

  // 모집 목록에 실제 블레서 방 그리기(봇 파티는 원래 함수)
  const _roleCounts=roleCounts;
  roleCounts=function(r){if(!r.real)return _roleCounts(r);const c={tank:0,dps:0,heal:0};r.people.forEach(x=>c[roleOf(x.job)]++);return c;};
  const _joinReason=joinReason;
  joinReason=function(r){if(!r.real)return _joinReason(r);const m=monster(r.monsterId);if(!m)return '몬스터 정보가 없습니다';const lr=levelReason(m,S.me.level)||raidBlock(m);if(lr)return lr;if(mkind(m)==='dungeon'&&daily().dungeon[m.id])return '오늘은 이미 클리어했습니다';return slotReason(m,r.people,roleOf(S.me.job),r.target);};
  const _rmemHTML=rmemHTML;
  rmemHTML=function(r){if(!r.real)return _rmemHTML(r);const m=monster(r.monsterId);
    return `<div class="rmenu" role="menu" aria-label="${esc(r.name)} 참가 인원"><div class="rm-head"><b>${esc(r.name)}</b><span class="num faint">${r.people.length}/${r.target}</span></div>
      ${r.people.map(x=>`<div class="rm-row">${sigil(x.job,'sm')}<div class="rm-t"><div class="row" style="gap:6px"><b>${esc(x.name)}</b>${x.leader?'<span class="chip dim">파티장</span>':''}${x.merc?'<span class="chip merc">용병</span>':''}</div><small>${className(x.job)} · <span class="num">LV${x.level}</span></small></div></div>`).join('')}
      <div class="rm-foot faint">${m?esc(m.name):''} · 실제 블레서 파티 · 남은 자리 ${Math.max(0,r.target-r.people.length)}</div></div>`;};
  const _recruitRows=recruitRows;
  recruitRows=function(rs,withJoin){
    const real=(rs||[]).filter(r=>r.real),rest=(rs||[]).filter(r=>!r.real);
    if(!real.length)return _recruitRows(rest,withJoin);
    const rows=real.map(r=>{const m=monster(r.monsterId);if(!m)return '';const need=missingRoles(m,r.people.map(x=>roleOf(x.job)));const reason=joinReason(r);
      return `<div class="li pt-real"><div class="t"><b>${esc(r.name||m.name)}</b> <span class="chip ok" style="font-size:10.5px">블레서</span> <span class="faint" style="font-size:12px">${esc(m.name)}</span><small>파티장 ${esc(r.leader)} · <span class="num">${r.people.length}/${r.target}</span>${sumR(need)?' · 필요 '+missText(need):''}</small>${withJoin&&reason?`<small class="reason">${esc(reason)}</small>`:''}</div>
        ${withJoin?`<button class="btn btn-sm" data-act="joinrecruit" data-id="${r.id}" ${reason||busyReason()?'disabled':''}>참가</button>`:`<button class="btn btn-sm btn-ghost" data-act="link" data-link="monster:${m.id}">보기</button>`}</div>`;}).join('');
    return rows+(rest.length?_recruitRows(rest,withJoin):'');
  };

  // 파티 만들기·참가·준비·내보내기·나가기·봇 초대
  const _create=ACTS.createparty;
  ACTS.createparty=async(d,el,e)=>{
    const before=S.party;_create(d,el,e);const p=S.party;
    if(!SB_UID||!p||p===before||!ptKindOk(monster(p.monsterId)))return;
    p.nextJoin=Infinity;
    try{const id=await ptRpcCard('party_create',{p_monster:p.monsterId,p_name:p.name||'파티',p_target:p.target,p_vis:p.visibility,p_card:ptCard()});
      if(S.party!==p)return;Object.assign(p,{shared:true,roomId:id,id:'room:'+id,leaderUid:SB_UID});PT.setSig='';ptSubscribe(id);save();
      sysParty('실제 블레서 모집 목록에 올렸습니다. 다른 블레서가 들어오면 바로 보입니다.');if(S.route==='battle')render();}
    catch(err){console.warn(err);toast('서버에 파티를 올리지 못했습니다. 이 기기 안에서만 모집합니다.','warn');}
  };
  const _join=ACTS.joinrecruit;
  ACTS.joinrecruit=async(d,el,e)=>{
    if(!SB_UID||!String(d.id||'').startsWith('room:'))return _join(d,el,e);
    const r=S.recruits.find(x=>x.id===d.id);const why=busyReason()||(r?joinReason(r):'');if(why){toast(why,'warn');return;}
    if(el)el.disabled=true;
    try{const room=await ptRpcCard('party_join',{p_room:d.id.slice(5),p_card:ptCard()});
      S.party=ptPartyFrom(room,null);PT.room=room;sysParty(`${S.me.name}님이 파티에 참가했습니다.`);S.sel.chatTab='party';ptSubscribe(room.id);save();go('battle');}
    catch(err){toast(ptErr(err),'warn');ptFetchRooms();if(el)el.disabled=false;}
  };
  const _ready=ACTS.ready;
  ACTS.ready=(d,el,e)=>{_ready(d,el,e);if(!ptShared()||!SB_UID)return;const me=S.party.members.find(x=>x.isMe);
    ptRpcCard('party_ready',{p_room:S.party.roomId,p_ready:!!(me&&me.ready),p_card:ptCard()}).catch(err=>{toast(ptErr(err),'warn');ptRefresh();});};
  const _kick=ACTS.kick;
  ACTS.kick=(d,el,e)=>{const p=S.party;const x=p&&p.shared&&p.members.find(m=>m.name===d.name&&m.real);_kick(d,el,e);
    if(x)ptRpc('party_kick',{p_room:p.roomId,p_uid:x.uid}).catch(err=>{toast(ptErr(err),'warn');ptRefresh();});};
  const _invite=ACTS.invite;
  ACTS.invite=(d,el,e)=>{if(ptShared()){
      const pl=chPlayer(d.name);
      if(pl&&!bot(d.name)&&pl.user_id){ptRpc('party_invite',{p_room:S.party.roomId,p_uid:pl.user_id}).then(()=>{sysParty(`${d.name}님을 초대했습니다. 초대 전용이어도 들어올 수 있습니다.`);save();render();}).catch(err=>toast(ptErr(err),'warn'));return;}
      toast('실제 블레서 파티에는 봇을 초대할 수 없습니다. 빈자리는 용병으로 채워 주세요.','warn');return;}
    return _invite(d,el,e);};
  const _leave=ACTS.leaveparty;
  ACTS.leaveparty=(d,el,e)=>{const p=S.party;if(p&&p.shared&&SB_UID){ptRpc('party_leave',{p_room:p.roomId}).catch(err=>console.warn(err));ptUnsub();}return _leave(d,el,e);};
  const _setvis=ACTS.setvis;
  ACTS.setvis=(d,el,e)=>{_setvis(d,el,e);PT.setSig='';};

  // 출발: 파티장만. 파티원 화면은 파티장의 전투 상태를 기다린다
  const _startBattle=startBattle;_ptStartBattle=_startBattle;
  startBattle=function(){
    const p=S.party;
    if(!SB_UID||!p||!p.shared)return _startBattle();
    if(p.leaderUid!==SB_UID)return;
    if(mkind(monster(p.monsterId))==='dungeon')return ptStartDrun(p);
    _startBattle();const b=S.battle;if(!b)return;
    ptRealFighters(b,(PT.room&&PT.room.members)||[],null);
    b.shared={room:p.roomId,host:SB_UID};b.srev=0;
    ptRpc('party_start',{p_room:p.roomId}).then(()=>ptPush()).catch(err=>{console.warn(err);toast('파티원에게 전투 시작을 알리지 못했습니다.','warn');});
    save();if(S.route==='battle')render();
  };
  const _planBots=planBots;
  planBots=function(b){_planBots(b);if(ptHost(b))b.players.forEach(f=>{if(f.real&&!f.isMe)f.planAt=Infinity;});};
  const _doResolve=doResolve;
  doResolve=function(){const b=ptBattle();if(b&&!ptHost(b))return;if(b&&b.blessR&&!b.bless){b.bless=b.blessR;delete b.blessR;}_doResolve();if(b)ptPush();};
  const _renderFight=renderFight;
  renderFight=function(){_renderFight();if(ptHost(ptBattle()))ptPushSoon();};
  ['confirmact','confirmdefend','editact','g-confirm'].forEach(k=>{const _f=ACTS[k];ACTS[k]=(d,el,e)=>{const r=_f(d,el,e);const b=ptBattle();if(b&&!ptHost(b))ptSendAct();return r;};});

  // 파티 채팅: 서버로. 공유 파티에서는 봇이 실제 블레서 이름으로 말하지 않음
  const _sendChat2=sendChat;
  sendChat=function(tab,text){
    {const M=mtShared();if(SB_UID&&tab==='raid'&&M&&(M.phase==='battle'||M.roster.some(x=>x.isMe))){
      const msg=String(text||'').replace(/\s+/g,' ').trim().slice(0,200);if(!msg)return;
      ptRpc('party_say',{p_room:M.shared.room,p_text:msg}).catch(err=>toast(ptErr(err),'warn'));
      const inp=$$('[data-chatpanel] input').find(i=>document.activeElement===i)||$('#chat-in-all');if(inp)inp.value='';return true;}}
    const isParty=(tab==='lobby'&&S.sel.lobbyCh==='party')||(tab==='party'&&S.sel.partyCh!=='lobby');
    if(!SB_UID||!isParty||!ptShared())return _sendChat2(tab,text);
    const msg=String(text||'').replace(/\s+/g,' ').trim().slice(0,200);if(!msg)return;
    ptRpc('party_say',{p_room:S.party.roomId,p_text:msg}).catch(err=>toast(ptErr(err),'warn'));
    const inp=$$('[data-chatpanel] input').find(i=>document.activeElement===i)||$('#chat-in-all');if(inp)inp.value='';
    return true;
  };
  const _botSay=botSay;
  botSay=function(ch,name,text){if(ch==='raid'&&mtShared()){const M=S.mass;if(M.roster.some(x=>x.name===name&&x.real))return;const b=S.battle;if(b&&b.shared&&!ptHost(b))return;}
    if(ch==='party'&&S.party&&S.party.shared){const x=S.party.members.find(m=>m.name===name);if(!x||x.real)return;}return _botSay(ch,name,text);};

  // 만신전: 운영자가 띄우면 서버 방 · 원정대 참가/취소/출발은 서버 함수 · 공대장 화면이 전투
  _ptMassStart=massStart;
  const _evSpawn=ACTS['ev-spawn'];
  ACTS['ev-spawn']=(d,el,e)=>{
    if(!SB_UID)return _evSpawn(d,el,e);if(!isAdmin())return;const m=monster(d.id);if(!m)return;
    const C=massCfg();const loc=pick(WORLD.gates.filter(g=>g[1]!=='항구'))[0];const land=(MAP_SPOTS.find(x=>x[1]==='gate'&&x[2]===loc)||[])[3];const T=massDef(m).title;
    ptRpc('mass_spawn',{p_monster:m.id,p_minutes:Math.max(1,Math.min(180,Math.round(C.gatherMinutes))),p_target:Math.max(1,Math.min(20,C.maxPlayers)),p_meta:{title:T?`${T} · ${m.name}`:m.name,loc:`${loc} 인근`,land:land||null}})
      .then(()=>{logChange('만신전',[{field:'출현',before:undefined,after:m.name}]);toast('만신전을 띄웠습니다. 모든 블레서에게 출현합니다.','good');mtFetch();})
      .catch(err=>toast(/NOT_ADMIN/.test(err&&err.message||'')?'운영자 계정만 만신전을 띄울 수 있습니다.':'만신전을 띄우지 못했습니다.','warn'));
  };
  const _massJoin=ACTS['mass-join'];
  ACTS['mass-join']=(d,el,e)=>{
    const M=mtShared();if(!M)return _massJoin(d,el,e);
    const sib=(M.sibs||[]).filter(x=>x.status==='gather');let room=d&&d.room||M.shared.room;
    if(!(d&&d.room)){const cu=sib.find(x=>x.id===room);if(cu&&cu.n>=cu.target){const o=sib.find(x=>x.n<x.target);if(o)room=o.id;}}
    const sr=sib.find(x=>x.id===room);
    const m=monster(M.monsterId);const why=(M.roster.some(x=>x.isMe)&&room!==M.shared.room?'':busyReason())||levelReason(m,S.me.level)||(m&&m.id==='guardian'&&typeof summusLock==='function'?summusLock():'')||((sr?sr.n>=sr.target:M.roster.length>=M.target)?'정원이 찼습니다':'');   // 숨무스 만신전: 8장 완료자만(메인 2026-11-05)
    if(why){toast(why,'warn');return;}
    if(typeof entryGate==='function'&&entryGate('mass-join',d,true))return;
    ptRpcCard('mass_join',{p_room:room,p_card:ptCard()}).then(r=>{if(r.id!==M.shared.room){ptUnsub();mtEnd(M.shared.room,'');}PT.room=r;mtApply(r);ptSubscribe(r.id);const sl=r.meta&&r.meta.slot;toast(`만신전 원정대${sl?` ${sl}방`:''}에 참가했습니다.`,'good');mtFetch();})
      .catch(err=>{toast(/FULL/.test(err&&err.message||'')?'정원이 찼습니다.':/NOT_GATHER/.test(err&&err.message||'')?'집결이 끝났습니다.':ptErr(err),'warn');mtFetch();});
  };
  const _massLeave=ACTS['mass-leave'];
  ACTS['mass-leave']=(d,el,e)=>{const M=mtShared();if(!M)return _massLeave(d,el,e);
    M.roster=M.roster.filter(x=>!x.isMe);ptRpc('mass_leave',{p_room:M.shared.room}).catch(err=>console.warn(err)).finally(()=>mtFetch());ptUnsub();save();render();};
  const _massGo=ACTS['mass-go'];
  ACTS['mass-go']=(d,el,e)=>{const M=mtShared();if(!M)return _massGo(d,el,e);if(M.leaderUid!==SB_UID)return;mtStart();};
  const _blessDlg=blessDlg;
  blessDlg=function(){const b=S.battle;if(b&&b.blessR&&!b.bless){b.bless=b.blessR;try{return _blessDlg();}finally{delete b.bless;}}return _blessDlg();};
  const _blessPick=ACTS['bless-pick'];
  ACTS['bless-pick']=(d,el,e)=>{const b=ptBattle();
    if(b&&!ptHost(b)&&b.bless&&b.bless.me&&!b.bless.pick){const i=+d.i;ptRpc('party_act',{p_room:b.shared.room,p_turn:-2,p_action:{bless:i}}).catch(err=>{console.warn(err);toast('가호 선택을 공대장에게 보내지 못했습니다. 다시 골라 주세요.','bad');});}
    return _blessPick(d,el,e);};
  const _massTick=massTick;
  massTick=function(t){
    const M=mtShared();if(!M)return _massTick(t);if(M.phase!=='gather'||MT.starting)return;
    const meIn=M.roster.some(x=>x.isMe);
    if(!meIn){if(t>M.until+20000){mtEnd(M.shared.room,'');if(S.route==='battle')render();}return;}
    const iLead=M.leaderUid===SB_UID;
    if((iLead&&(M.roster.length>=M.target||t>=M.until))||(!iLead&&t>=M.until+12000))mtStart();
  };
  const _massPanel=massPanel;
  massPanel=function(){
    let h=_massPanel();const M=mtShared();if(!M||M.phase!=='gather')return h;
    const meIn=M.roster.some(x=>x.isMe),iLead=M.leaderUid===SB_UID;
    if(meIn&&iLead&&!h.includes('data-act="mass-go"'))h=h.replace('<button class="btn" data-act="mass-leave">집결 취소</button>','<button class="btn" data-act="mass-leave">집결 취소</button><button class="btn btn-primary" data-act="mass-go">지금 출발</button>');
    const note=`<p class="faint pt-mline" style="font-size:12.5px;margin:6px 0 0">실제 블레서 ${M.roster.length}명 · 출발하면 빈자리는 연습용 동료가 채웁니다${M.leader?` · 공대장 ${esc(M.leader)}`:' · 먼저 참가한 블레서가 공대장'}</p>`;
    const sib=(M.sibs||[]).length>1?`<div class="mass-rooms" role="group" aria-label="원정대 방">${M.sibs.map(x=>{const on=x.id===M.shared.room,full=x.n>=x.target,closed=x.status!=='gather';
        return `<button class="btn btn-sm ${on?'btn-primary':''}" data-act="${on?'mass-view':'mass-join'}" data-room="${x.id}" ${closed||(!on&&full)?'disabled':''} aria-pressed="${on}">${x.slot}방 <span class="num">${x.n}/${x.target}</span>${x.me?' · 참가 중':closed?' · 출발함':full?' · 가득':''}</button>`;}).join('')}</div>`:'';
    h=h.replace(/(<p class="(?:ok-t|reason)" style="font-size:12.5px">)[^<]*(<\/p>)/,note);
    return sib?h.replace('<div class="mass-roster">',sib+'<div class="mass-roster">'):h;
  };
  ACTS['mass-view']=()=>{};

  // 랜덤 매칭: 실제 블레서 먼저, 없으면 예전처럼 봇
  const _tryMatch=tryMatch;
  tryMatch=function(){
    const q=ptQ();if(!q||q.botOnly)return _tryMatch();
    if(q.busy)return false;
    if(q.roomId)return ptQueueRoom(q);
    const r=ptQueueFind(q);if(r){ptQueueJoin(q,r.roomId);return false;}
    ptQueueOpen(q);return false;
  };
  const _queue=ACTS.queue;
  ACTS.queue=(d,el,e)=>{const r=_queue(d,el,e);const q=ptQ();if(q&&!q.roomId&&!q.busy){ptFetchRooms().then(()=>{if(S.queue===q&&!q.roomId&&!q.busy)tryMatch();});}return r;};
  const _cancelq=ACTS.cancelqueue;
  ACTS.cancelqueue=(d,el,e)=>{const q=S.queue;if(q&&q.roomId&&SB_UID){ptRpc('party_leave',{p_room:q.roomId}).catch(()=>{});ptUnsub();}return _cancelq(d,el,e);};
  const _vQueue=vQueue;
  vQueue=function(){
    let h=_vQueue();const q=ptQ();if(!q)return h;const room=PT.room&&PT.room.id===q.roomId?PT.room:null;
    const left=Math.max(0,Math.ceil((q.since+PT.matchWait-now())/1000));
    const n=room?(room.members||[]).length:0;const lead=room&&((room.members||[]).find(x=>x.uid===room.leader)||{}).name;
    const line=q.botOnly?'함께할 실제 블레서가 없어 연습용 동료 블레서와 매칭합니다.'
      :!room?'같은 레이드를 기다리는 실제 블레서를 찾는 중입니다…'
      :q.host?`실제 블레서 ${n}명 모임 · 목표 ${q.target}명${left?` · ${left}초 뒤 ${n>=2?'빈자리는 용병으로 채워 출발':'연습용 동료 블레서와 매칭'}`:''}`
      :`실제 블레서 파티(파티장 ${esc(lead||'')})에 들어왔습니다 · ${n}/${q.target}명 · 출발을 기다리는 중…`;
    return h.replace('<div class="panel"><h3>대기 상태</h3>',`<div class="panel"><h3>대기 상태</h3><p class="pt-qline${room?' ok':''} muted" style="font-size:13px;margin:0 0 10px">${line}</p>`);
  };

  // 던전 파티: 파티장이 진행(전투·이벤트), 파티원은 따라감
  const _drunStartBattle=drunStartBattle;
  drunStartBattle=function(){
    const R=ptDrunHost();if(!R)return _drunStartBattle();
    if(PT.room&&PT.room.id===R.shared.room){const inRoom=new Set((PT.room.members||[]).map(x=>x.uid));R.party=R.party.filter(x=>x.isMe||!x.uid||inRoom.has(x.uid));}
    _drunStartBattle();const b=S.battle;if(!b||b.solo||!b.ctx||!b.ctx.drun){ptPush();return;}
    ptRealFighters(b,Object.entries(R.cards||{}).map(([uid,c])=>({uid,name:c.name,job:c.job,level:c.level,card:c.card})),uid=>R.hps[uid]);
    b.shared={room:R.shared.room,host:SB_UID,ph:R.idx};b.srev=0;
    save();ptPush();if(S.route==='battle')render();
  };
  const _drunAfter=drunAfter;
  drunAfter=function(b,me){
    const R=ptDrun();
    if(R&&b.shared&&b.shared.room===R.shared.room){
      if(R.shared.host!==SB_UID){if(b.shared.ph!==R.idx)return;return _drunAfter(b,me);}
      _drunAfter(b,me);
      b.players.forEach(f=>{if(f.uid&&f.uid!==SB_UID&&R.hps&&R.hps[f.uid]!=null)R.hps[f.uid]=Math.max(0.05,(f.dead?0:f.hp)/f.maxHp);});
      save();ptPush();return;
    }
    return _drunAfter(b,me);
  };
  const _drunEvent=drunEvent;
  drunEvent=function(){
    const R=ptDrunHost();if(!R)return _drunEvent();
    const k=R.phases[R.idx],before=R.hp;_drunEvent();
    const d=R.hp-before;if(d&&(k==='trap'||k==='empty'))for(const u in R.hps)R.hps[u]=Math.min(1,Math.max(k==='trap'?0.1:0.05,R.hps[u]+d));
    save();ptPush();
  };
  const _drNext=ACTS['drun-next'];
  ACTS['drun-next']=(d,el,e)=>{if(ptDrunMem()){toast('던전 진행은 파티장이 합니다.');return;}return _drNext(d,el,e);};
  const ptDrunLeave=(host)=>{const R=ptDrun();if(!R)return;const rid=R.shared.room;
    if(host&&!R.done&&!R.closed){R.done='quit';R.srev=(R.srev||0)+1;R.closed=true;
      ptRpc('party_push',{p_room:rid,p_state:{shared:{room:rid,host:SB_UID},nob:true,hostName:S.me.name,drun:ptDrunPayload(R)},p_rev:R.srev,p_over:true}).catch(err=>console.warn(err));}
    else ptRpc('party_leave',{p_room:rid}).catch(()=>{});
    ptUnsub();};
  ['drun-quit','drun-exit'].forEach(k=>{const _f=ACTS[k];ACTS[k]=(d,el,e)=>{const R=ptDrun();if(R)ptDrunLeave(R.shared.host===SB_UID);return _f(d,el,e);};});
  const _drPot=ACTS['dr-potion'];
  ACTS['dr-potion']=(d,el,e)=>{const R=ptDrunMem(),h0=R&&R.hp;const r=_drPot(d,el,e);
    if(R&&S.drun===R&&R.hp>h0&&!R.done)ptRpc('party_act',{p_room:R.shared.room,p_turn:-1,p_action:{hp:Math.round(R.hp*1000)/1000}}).catch(err=>console.warn(err));return r;};
  const _vDrun=vDrun;
  vDrun=function(){
    let h=_vDrun();const R=ptDrun();if(!R)return h;
    if(R.shared.host!==SB_UID&&!R.done)h=h.replace(/<button class="btn btn-sm btn-primary" data-act="drun-next">[^<]*<\/button>/,'<span class="faint dr-wait">파티장이 진행합니다</span>');
    if(R.done==='lose'&&R.quitBy)h=h.replace(/(<div class="dr-card lose"><h3>)[^<]*(<\/h3><p>)[^<]*/,`$1탐사 종료$2${esc(R.quitBy)} 오늘 클리어 기록은 남지 않았으니 다시 도전할 수 있습니다.`);
    return h;
  };
}

/* ── 서버 공동 목표(031, 메인 요청 5-3) ──
   게임 쪽 쓰는 법(메인):
     goalAdd('kill:'+몬스터id, 마릿수)  · goalAdd('explore',1) · goalAdd('fish',1) · goalAdd('dungeon',1) · goalAdd('raid',1)
       → 이번 주 목표와 종류가 다르면 서버에 안 보냄. 같은 종류는 3초 모아서 한 번에 보냄. 로컬(파일) 모드에서는 아무 일도 안 함.
     GOAL  → 이번 주 상태 {week, ends, kind, name, descr, target, total, mine, pending, done, gold, items, prev:{name,target,total,done,mine}|null} 또는 null
             pending = 한도를 넘어 아직 합계에 안 들어간 내 기여(032, 예산이 차면 1분마다 조금씩 들어감)
     onGoal(GOAL)  → 메인이 이 이름으로 함수를 두면 상태가 바뀔 때마다 불림(화면 갱신용)
     goalMatch(kind) → 지금 목표에 셀 행동인지(true/false)
   서버: 1분마다 다시 읽음. 한 블레서가 올릴 수 있는 양은 서버가 1분 단위로 제한(처치 1분 6마리·최대 300 쌓임 등),
   넘친 양은 버리지 않고 대기분으로 미뤄 두었다가 나중에 넣음(032, 대기분 상한 처치 2,000·탐색·낚시 50·던전·레이드 30). */
let GOAL=null;
const GZ={q:{},t:null,poll:null,busy:false};
function goalMatch(kind){const g=GOAL;if(!g||g.done||!kind)return false;return kind===g.kind||(g.kind==='kill'&&/^kill:/.test(kind));}
function gzNotify(){try{if(typeof onGoal==='function')onGoal(GOAL);}catch(e){console.warn(e);}}
async function gzFetch(){if(!SB||!SB_UID||typeof SB.rpc!=='function')return;try{const {data,error}=await SB.rpc('goal_status');if(error)throw error;GOAL=data||null;gzNotify();}catch(e){}}
function goalAdd(kind,n=1){
  if(!SB||!SB_UID||!goalMatch(kind))return;n=Math.max(0,Math.floor(+n||0));if(!n)return;
  GZ.q[kind]=(GZ.q[kind]||0)+n;clearTimeout(GZ.t);GZ.t=setTimeout(gzFlush,3000);
}
async function gzFlush(){
  if(GZ.busy){clearTimeout(GZ.t);GZ.t=setTimeout(gzFlush,1000);return;}
  const q=GZ.q;GZ.q={};const ks=Object.keys(q);if(!ks.length)return;GZ.busy=true;
  try{for(const k of ks){const {data,error}=await SB.rpc('goal_add',{p_kind:k,p_n:Math.min(1000,q[k])});if(error)throw error;
      if(data&&GOAL&&data.total!=null){const was=GOAL.done;GOAL.total=data.total;if(data.mine!=null)GOAL.mine=data.mine;if(data.pending!=null)GOAL.pending=data.pending;GOAL.done=!!data.done;
        if(!was&&GOAL.done){try{toast(`공동 목표 「${GOAL.name}」 달성! 기여한 블레서에게 우편이 갑니다.`,'good');}catch(e){}if(typeof mlFetch==='function')setTimeout(mlFetch,1500);}}
      if(data&&data.reason==='OTHER_KIND')gzFetch();}   // 주가 바뀌었을 수 있음
    gzNotify();
  }catch(e){console.warn('goal_add',e);}finally{GZ.busy=false;}
}
function gzStart(){if(!SB||typeof SB.rpc!=='function')return;gzFetch();SB.rpc('goal_settle').then(()=>{},()=>{});clearInterval(GZ.poll);GZ.poll=setInterval(gzFetch,60000);
  addEventListener('pagehide',()=>{if(Object.keys(GZ.q).length)gzFlush();});}

