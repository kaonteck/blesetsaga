'use strict';
/* 운영 페이지 · 회원 · 우편 · 문의/신고 · 초대코드 · 운영 기록 */
const STATUS={online:['접속 중','ok'],away:['자리 비움','warn'],raid:['레이드 중','info'],offline:['오프라인','dim']};
const banned=p=>p.banned_until&&new Date(p.banned_until)>Date.now();

/* ── 회원 ── */
let PL={rows:[],search:''};
VIEWS.players=async(el)=>{
  const rows=await q(A.sb.rpc('admin_players',{p_search:PL.search||null,p_limit:500}));
  if(!rows){el.innerHTML='<div class="msg bad">회원 목록을 불러오지 못했습니다.</div>';return;}
  PL.rows=rows;rows.forEach(p=>A.names[p.user_id]=p.name?`${p.name} (${p.username})`:p.username);
  const on=rows.filter(p=>p.status!=='offline'&&Date.now()-new Date(p.last_seen)<10*60e3).length;
  el.innerHTML=`<div class="panel"><h3><span>회원 <span class="faint" style="font-weight:400">${rows.length}명 · 최근 10분 접속 ${on}명 · 정지 ${rows.filter(banned).length}명</span></span>
      <form id="pl-f" class="row" style="flex-wrap:nowrap"><input type="search" id="pl-s" placeholder="아이디·캐릭터 이름" value="${esc(PL.search)}" style="width:200px"><button class="btn btn-sm">찾기</button></form></h3>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>캐릭터</th><th>아이디</th><th class="n">레벨</th><th>상태</th><th>마지막 저장</th><th>가입</th><th>초대코드</th><th></th></tr></thead><tbody>
    ${rows.map(p=>{const st=STATUS[p.status]||STATUS.offline;return `<tr>
      <td><b>${esc(p.name||'—')}</b>${p.is_admin?' <span class="chip info">운영자</span>':''}${banned(p)?` <span class="chip bad" title="${esc(p.ban_reason||'')}">정지 ~${fmtTime(p.banned_until)}</span>`:''}<div class="faint small">${esc(p.job||'')}</div></td>
      <td>${esc(p.username)}</td><td class="n">${p.level}</td>
      <td><span class="chip ${st[1]}">${st[0]}</span><div class="faint small">${ago(p.last_seen)}</div></td>
      <td class="small">${ago(p.saved_at)}</td><td class="small">${fmtTime(p.joined_at,true)}</td><td class="small faint">${esc(p.invite||'')}</td>
      <td><div class="row" style="flex-wrap:nowrap">
        <button class="btn btn-sm" data-save="${p.user_id}">세이브</button>
        <button class="btn btn-sm" data-mail="${p.user_id}">우편</button>
        ${banned(p)?`<button class="btn btn-sm" data-unban="${p.user_id}">정지 해제</button>`:p.is_admin?'':`<button class="btn btn-sm btn-d" data-ban="${p.user_id}">정지</button>`}
      </div></td></tr>`;}).join('')||'<tr><td colspan="8" class="empty">회원이 없습니다.</td></tr>'}
    </tbody></table></div></div>`;
  $('#pl-f').onsubmit=e=>{e.preventDefault();PL.search=$('#pl-s').value.trim();go('players');};
  $$('[data-save]').forEach(b=>b.onclick=()=>showSave(b.dataset.save));
  $$('[data-mail]').forEach(b=>b.onclick=()=>go('mail',{to:[b.dataset.mail]}));
  $$('[data-ban]').forEach(b=>b.onclick=()=>banDlg(b.dataset.ban));
  $$('[data-unban]').forEach(b=>b.onclick=async()=>{if(!await ask('정지 해제',`${who(b.dataset.unban)} 님의 정지를 풉니다.`,'해제'))return;
    if(await q(A.sb.rpc('admin_ban',{p_user:b.dataset.unban,p_until:null,p_reason:null}),'정지를 풀었습니다.'))go('players');});
};
async function showSave(uid){
  const d=await q(A.sb.rpc('admin_player_save',{p_user:uid}));if(d===null)return;
  if(d===true||!d){modal(`<h3>${who(uid)}</h3><p class="muted">서버에 저장된 진행 기록이 없습니다.</p><div class="row" style="justify-content:flex-end"><button class="btn" data-close-btn>닫기</button></div>`);return;}
  const me=d.me||{};const inv=Object.entries(me.inv||{}).filter(([,n])=>n>0);
  modal(`<h3>${who(uid)} · 진행 기록 <span class="faint small">(읽기 전용)</span></h3>
    <div class="row small" style="gap:14px;margin-bottom:10px"><span>LV <b>${me.level??'—'}</b></span><span>골드 <b>${(me.gold??0).toLocaleString('ko-KR')}</b></span><span>클래스 <b>${esc(me.job||'—')}</b></span><span>저장 ${fmtTime(d.savedAt,true)}</span></div>
    ${inv.length?`<p class="small muted" style="margin:0 0 6px">인벤토리 ${inv.length}종</p><div class="row small" style="gap:4px;margin-bottom:10px">${inv.slice(0,40).map(([k,n])=>`<span class="chip">${esc(((DEF&&DEF.item[k])||{}).name||k)} ×${n}</span>`).join('')}</div>`:''}
    <details><summary class="small muted" style="cursor:pointer">전체 JSON 보기</summary><pre class="json" style="margin-top:8px">${esc(pretty(d))}</pre></details>
    <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn" id="sv-copy">JSON 복사</button><button class="btn" data-close-btn>닫기</button></div>`);
  $('#sv-copy').onclick=()=>navigator.clipboard.writeText(pretty(d)).then(()=>toast('복사했습니다.'),()=>toast('복사하지 못했습니다.','bad'));
  if(!DEF)loadDefaults();
}
function banDlg(uid){
  modal(`<h3>${who(uid)} 정지</h3><form class="stack" id="bf">
    <label class="f">기간<select id="b-len"><option value="1">1일</option><option value="3">3일</option><option value="7" selected>7일</option><option value="30">30일</option><option value="36500">영구</option></select></label>
    <label class="f">사유 (기록용)<input type="text" id="b-why" maxlength="200" placeholder="예) 채팅 도배"></label>
    <p class="faint small" style="margin:0">정지 중에는 채팅·피드·귓속말·우편 보내기가 막힙니다. 게임 접속과 플레이는 됩니다.</p>
    <div class="row" style="justify-content:flex-end"><button type="button" class="btn btn-g" data-close-btn>취소</button><button class="btn btn-d">정지</button></div></form>`);
  $('#bf').onsubmit=async e=>{e.preventDefault();const until=new Date(Date.now()+(+$('#b-len').value)*86400e3).toISOString();
    if(await q(A.sb.rpc('admin_ban',{p_user:uid,p_until:until,p_reason:$('#b-why').value.trim()||null}),'정지했습니다.')){modal(null);go('players');}};
}

/* ── 우편 보내기 ── */
VIEWS.mail=async(el,opts)=>{
  if(!DEF)await loadDefaults();
  if(!PL.rows.length){const r=await q(A.sb.rpc('admin_players',{p_search:null,p_limit:1000}));if(r)PL.rows=r;}
  const sel=new Set((opts&&opts.to)||[]);
  const items={...DEF.item,...Object.fromEntries(Object.entries(A.content.item||{}).map(([i,r])=>[i,r.data]))};
  const itemOpts=Object.entries(items).sort((a,b)=>String(a[1].name).localeCompare(String(b[1].name),'ko')).map(([id,it])=>`<option value="${esc(id)}">${esc(it.name||id)} (${esc(id)})</option>`).join('');
  const recent=await q(A.sb.from('admin_log').select('*').eq('action','send_mail').order('id',{ascending:false}).limit(10));
  el.innerHTML=`<div class="two">
    <form class="panel stack" id="mf"><h3>우편 보내기</h3>
      <div class="row"><label class="chk"><input type="radio" name="to" value="all" ${sel.size?'':'checked'}> 전체 회원 (${PL.rows.length}명)</label><label class="chk"><input type="radio" name="to" value="pick" ${sel.size?'checked':''}> 고른 회원만</label></div>
      <div id="m-pick" class="${sel.size?'':'hide'}"><input type="search" id="m-ps" placeholder="아이디·이름으로 찾기">
        <div class="list" id="m-plist" style="max-height:220px;margin:6px 0 0;border:1px solid var(--rule);border-radius:var(--r)"></div>
        <div class="faint small" id="m-pn" style="margin-top:4px"></div></div>
      <label class="f">보내는 이름<input type="text" id="m-from" maxlength="20" value="운영자"></label>
      <label class="f">내용 (500자)<textarea id="m-text" rows="4" maxlength="500" placeholder="예) 점검 보상입니다. 불편을 드려 죄송합니다." required></textarea></label>
      <label class="f">골드<input type="number" id="m-gold" min="0" value="0"></label>
      <div class="f"><span>첨부 아이템</span><div id="m-items" class="stack" style="gap:6px"></div>
        <button type="button" class="btn btn-sm" id="m-add" style="align-self:flex-start">+ 아이템 추가</button></div>
      <button class="btn btn-p" style="align-self:flex-start">보내기</button>
    </form>
    <div class="panel"><h3>최근 보낸 운영 우편</h3>${(recent||[]).map(r=>`<div class="hi" style="padding:8px 0"><div class="row" style="justify-content:space-between"><b>${r.detail.count??'?'}명</b><span class="faint small">${fmtTime(r.created_at)} · ${who(r.admin)}</span></div>
      <div class="small">${esc(r.detail.text||'')}</div><div class="faint small">${r.detail.gold?r.detail.gold+'G ':''}${esc(Object.entries(r.detail.items||{}).map(([k,n])=>((items[k]||{}).name||k)+'×'+n).join(', '))}</div></div>`).join('')||'<p class="empty">아직 없습니다.</p>'}</div></div>`;
  const drawPick=()=>{const t=$('#m-ps').value.trim().toLowerCase();
    $('#m-plist').innerHTML=PL.rows.filter(p=>!t||(p.username+' '+(p.name||'')).toLowerCase().includes(t)).slice(0,200).map(p=>`<label class="li" style="cursor:pointer"><input type="checkbox" data-uid="${p.user_id}" ${sel.has(p.user_id)?'checked':''}><div class="t"><b>${esc(p.name||'—')}</b><small>${esc(p.username)} · LV${p.level}</small></div></label>`).join('')||'<p class="empty">없음</p>';
    $$('#m-plist [data-uid]').forEach(c=>c.onchange=()=>{c.checked?sel.add(c.dataset.uid):sel.delete(c.dataset.uid);$('#m-pn').textContent=`${sel.size}명 고름`;});
    $('#m-pn').textContent=`${sel.size}명 고름`;};
  drawPick();$('#m-ps').oninput=drawPick;
  $$('input[name=to]').forEach(r=>r.onchange=()=>$('#m-pick').classList.toggle('hide',r.value!=='pick'||!r.checked));
  const addRow=()=>{const d=document.createElement('div');d.className='row';d.style.flexWrap='nowrap';
    d.innerHTML=`<select class="grow" data-it>${itemOpts}</select><input type="number" data-n min="1" value="1" style="width:80px"><button type="button" class="btn btn-g btn-sm" aria-label="빼기">✕</button>`;
    $('button',d).onclick=()=>d.remove();$('#m-items').appendChild(d);};
  $('#m-add').onclick=addRow;
  $('#mf').onsubmit=async e=>{e.preventDefault();
    const all=$('input[name=to]:checked').value==='all';const text=$('#m-text').value.trim();
    if(!text)return toast('내용을 적어 주세요.','bad');if(!all&&!sel.size)return toast('받을 회원을 골라 주세요.','bad');
    const its={};$$('#m-items .row').forEach(r=>{const id=$('[data-it]',r).value,n=parseInt($('[data-n]',r).value,10)||0;if(n>0)its[id]=(its[id]||0)+n;});
    const gold=Math.max(0,parseInt($('#m-gold').value,10)||0);const n=all?PL.rows.length:sel.size;
    if(!await ask('우편 보내기',`<b>${n}명</b>에게 보냅니다.<br>${gold?gold+'골드 · ':''}${esc(Object.entries(its).map(([k,c])=>((items[k]||{}).name||k)+' ×'+c).join(', ')||'첨부 없음')}<br><span class="faint">보낸 우편은 되돌릴 수 없습니다.</span>`,'보내기'))return;
    const r=await q(A.sb.rpc('admin_send_mail',{p_users:all?null:[...sel],p_text:text,p_items:its,p_gold:gold,p_from:$('#m-from').value.trim()||'운영자'}));
    if(r!=null){toast(`${r}명에게 보냈습니다.`,'good');go('mail');}};
};

/* ── 문의 · 신고 ── */
VIEWS.inbox=async(el)=>{
  const [iq,rp]=await Promise.all([
    q(A.sb.from('inquiries').select('*').order('created_at',{ascending:false}).limit(100)),
    q(A.sb.from('reports').select('*').order('created_at',{ascending:false}).limit(100))]);
  if(!iq||!rp){el.innerHTML='<div class="msg bad">불러오지 못했습니다.</div>';return;}
  const iqs=[...iq.filter(x=>!x.answer),...iq.filter(x=>x.answer)],rps=[...rp.filter(x=>!x.done),...rp.filter(x=>x.done)];
  el.innerHTML=`<div class="two">
    <div class="panel"><h3>1:1 문의 <span class="faint" style="font-weight:400">답변 대기 ${iq.filter(x=>!x.answer).length}</span></h3>
      ${iqs.map(x=>`<div class="hi" style="padding:10px 0"><div class="row" style="justify-content:space-between"><span><b>${who(x.author)}</b> <span class="chip">${esc(x.cat)}</span></span><span class="faint small">${fmtTime(x.created_at)}</span></div>
        <div style="margin:4px 0;white-space:pre-wrap">${esc(x.text)}</div>
        ${x.answer?`<div class="msg ok small" style="margin-top:6px">답변 · ${who(x.answered_by)} · ${fmtTime(x.answered_at)}<br>${esc(x.answer)}</div>`:
        `<div class="row" style="flex-wrap:nowrap;margin-top:6px"><input type="text" maxlength="300" placeholder="답변 (300자)" data-ans-in="${x.id}"><button class="btn btn-sm btn-p" data-ans="${x.id}">답변</button></div>`}</div>`).join('')||'<p class="empty">문의가 없습니다.</p>'}</div>
    <div class="panel"><h3>신고 <span class="faint" style="font-weight:400">대기 ${rp.filter(x=>!x.done).length}</span></h3>
      ${rps.map(x=>`<div class="hi" style="padding:10px 0"><div class="row" style="justify-content:space-between"><span>${who(x.reporter)} → <b>${x.target?who(x.target):esc(x.target_name||'?')}</b> <span class="chip">${esc({chat:'채팅',dm:'귓속말',feed:'피드',comment:'댓글',profile:'프로필',etc:'기타'}[x.kind]||x.kind)}</span></span><span class="faint small">${fmtTime(x.created_at)}</span></div>
        ${x.snapshot?`<div class="msg info small" style="margin:6px 0">${esc(x.snapshot)}</div>`:''}${x.reason?`<div class="small muted">사유: ${esc(x.reason)}</div>`:''}
        ${x.done?`<div class="faint small">처리됨 · ${who(x.handled_by)} · ${fmtTime(x.handled_at)}</div>`:`<div class="row" style="margin-top:6px">
          <button class="btn btn-sm btn-p" data-done="${x.id}">처리 완료</button>
          ${x.ref_id&&['chat','feed','comment'].includes(x.kind)?`<button class="btn btn-sm" data-hide="${x.kind}:${esc(x.ref_id)}">${x.kind==='chat'?'메시지':'글'} 가리기</button>`:''}
          ${x.target?`<button class="btn btn-sm btn-d" data-ban="${x.target}">정지</button>`:''}</div>`}</div>`).join('')||'<p class="empty">신고가 없습니다.</p>'}</div></div>`;
  $$('[data-ans]').forEach(b=>b.onclick=async()=>{const v=$(`[data-ans-in="${b.dataset.ans}"]`).value.trim();if(!v)return toast('답변을 적어 주세요.','bad');
    if(await q(A.sb.from('inquiries').update({answer:v}).eq('id',b.dataset.ans),'답변했습니다.')){refreshBadges();go('inbox');}});
  $$('[data-done]').forEach(b=>b.onclick=async()=>{if(await q(A.sb.from('reports').update({done:true}).eq('id',b.dataset.done),'처리했습니다.')){refreshBadges();go('inbox');}});
  $$('[data-hide]').forEach(b=>b.onclick=async()=>{const [kind,ref]=b.dataset.hide.split(/:(.*)/);
    const tbl={chat:'chat_messages',feed:'feed_posts',comment:'feed_comments'}[kind];
    if(await q(A.sb.from(tbl).update({hidden:true}).eq('id',ref),'가렸습니다. 다른 유저에게 보이지 않습니다.'))b.disabled=true;});
  $$('[data-ban]').forEach(b=>b.onclick=()=>banDlg(b.dataset.ban));
};

/* ── 초대코드 ── */
VIEWS.invites=async(el)=>{
  const rows=await q(A.sb.rpc('admin_invites'));
  if(!rows){el.innerHTML='<div class="msg bad">초대코드를 불러오지 못했습니다.</div>';return;}
  el.innerHTML=`<div class="two">
    <form class="panel stack" id="if"><h3>새 초대코드</h3>
      <label class="f">코드 (비우면 8자리 자동)<input type="text" id="i-code" maxlength="32" autocapitalize="characters" spellcheck="false" placeholder="예) BLESET2026"></label>
      <label class="f">쓸 수 있는 횟수<select id="i-max"><option value="1">1명</option><option value="5">5명</option><option value="10">10명</option><option value="30">30명</option><option value="">무제한</option></select></label>
      <label class="f">메모 (누구에게 줬는지 등)<input type="text" id="i-note" maxlength="100"></label>
      <button class="btn btn-p" style="align-self:flex-start">만들기</button>
      <div id="i-new"></div></form>
    <div class="panel"><h3>초대코드 <span class="faint" style="font-weight:400">${rows.length}</span></h3>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>코드</th><th class="n">사용</th><th>메모</th><th>만든 날</th><th></th></tr></thead><tbody>
      ${rows.map(r=>{const full=r.max_uses!=null&&r.uses>=r.max_uses;return `<tr><td><b style="font-family:var(--f-code)">${esc(r.code)}</b>${full?' <span class="chip dim">다 씀</span>':''}</td>
        <td class="n">${r.uses} / ${r.max_uses??'∞'}</td><td class="small">${esc(r.note||'')}</td><td class="small faint">${fmtTime(r.created_at,true)}</td>
        <td><div class="row" style="flex-wrap:nowrap"><button class="btn btn-sm" data-copy="${esc(r.code)}">복사</button><button class="btn btn-sm btn-d" data-del="${esc(r.code)}">삭제</button></div></td></tr>`;}).join('')||'<tr><td colspan="5" class="empty">초대코드가 없습니다.</td></tr>'}
      </tbody></table></div></div></div>`;
  $('#if').onsubmit=async e=>{e.preventDefault();const max=$('#i-max').value;
    const c=await q(A.sb.rpc('admin_invite_create',{p_code:$('#i-code').value.trim()||null,p_max_uses:max===''?null:+max,p_note:$('#i-note').value.trim()||null}));
    if(c){await go('invites');$('#i-new').innerHTML=`<div class="msg ok">만들었습니다: <b style="font-family:var(--f-code);font-size:15px">${esc(c)}</b> <button type="button" class="btn btn-sm" data-copy="${esc(c)}">복사</button></div>`;bindCopy();}};
  bindCopy();
  $$('[data-del]').forEach(b=>b.onclick=async()=>{if(!await ask('초대코드 삭제',`<b>${esc(b.dataset.del)}</b> 코드로는 더 이상 가입할 수 없습니다. 이미 가입한 계정은 그대로입니다.`,'삭제',true))return;
    if(await q(A.sb.rpc('admin_invite_delete',{p_code:b.dataset.del}),'삭제했습니다.'))go('invites');});
};
function bindCopy(){$$('[data-copy]').forEach(b=>b.onclick=()=>navigator.clipboard.writeText(b.dataset.copy).then(()=>toast('복사했습니다: '+b.dataset.copy),()=>toast('복사하지 못했습니다.','bad')));}

/* ── 운영 기록 ── */
VIEWS.log=async(el)=>{
  const [ops,ch]=await Promise.all([
    q(A.sb.from('admin_log').select('*').order('id',{ascending:false}).limit(100)),
    q(A.sb.from('content_history').select('hid,kind,id,op,rev,changed_by,changed_at').order('hid',{ascending:false}).limit(100))]);
  if(!ops||!ch){el.innerHTML='<div class="msg bad">기록을 불러오지 못했습니다.</div>';return;}
  const ACT={send_mail:'우편 발송',ban:'정지',unban:'정지 해제',invite_create:'초대코드 생성',invite_delete:'초대코드 삭제'};
  const OP={insert:'올림',update:'수정',delete:'삭제',restore:'되돌림'};
  const items=[...ops.map(r=>({t:r.created_at,who:r.admin,what:ACT[r.action]||r.action,detail:r.action==='send_mail'?`${r.detail.count??'?'}명 · ${r.detail.text||''}`:r.action==='ban'?`${who(r.target)} ~${fmtTime(r.detail.until)} ${esc(r.detail.reason||'')}`:r.action==='unban'?who(r.target):esc(r.target||''),raw:r.action!=='ban'&&r.action!=='unban'})),
    ...ch.map(r=>({t:r.changed_at,who:r.changed_by,what:`콘텐츠 ${OP[r.op]||r.op}`,detail:`${(KINDS[r.kind]||{}).label||r.kind} · ${r.id}${r.rev?' v'+r.rev:''}`,link:{kind:r.kind,id:r.id}}))]
    .sort((a,b)=>new Date(b.t)-new Date(a.t)).slice(0,150);
  el.innerHTML=`<div class="panel"><h3>운영 기록 <span class="faint" style="font-weight:400">최근 ${items.length}건</span></h3>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>시각</th><th>운영자</th><th>한 일</th><th>내용</th></tr></thead><tbody>
    ${items.map((x,i)=>`<tr><td class="small faint" style="white-space:nowrap">${fmtTime(x.t)}</td><td class="small">${who(x.who)}</td><td style="white-space:nowrap">${esc(x.what)}</td>
      <td class="small">${x.link?`<a href="#content" data-go="${i}">${esc(x.detail)}</a>`:x.raw?esc(x.detail):x.detail}</td></tr>`).join('')||'<tr><td colspan="4" class="empty">기록이 없습니다.</td></tr>'}
    </tbody></table></div></div>`;
  $$('[data-go]').forEach(a=>a.onclick=e=>{e.preventDefault();const x=items[+a.dataset.go];go('content',{kind:x.link.kind,id:x.link.id});});
};

/* ── 행운권 (회차별 판매·당첨·지급) ── */
VIEWS.lotto=async(el)=>{
  const rows=await q(A.sb.rpc('admin_lotto',{p_weeks:12}));
  if(!rows){el.innerHTML='<div class="msg bad">행운권 현황을 불러오지 못했습니다.</div>';return;}
  const won=r=>Number(r.r1)+Number(r.r2)+Number(r.r3);
  const sold=rows.reduce((s,r)=>s+Number(r.tickets),0),paid=rows.reduce((s,r)=>s+Number(r.paid),0);
  el.innerHTML=`<div class="panel"><h3><span>주간 행운권 <span class="faint" style="font-weight:400">최근 ${rows.length}회 · 판매 ${sold}장(${(sold*200).toLocaleString('ko-KR')}G) · 지급 ${paid.toLocaleString('ko-KR')}G</span></span></h3>
    <p class="faint small" style="margin:0 0 10px">매주 금 19:00 판매 마감, 20:00 이후 첫 조회 때 서버가 무작위로 번호를 뽑습니다. 1장 200G · 한 주 2장 · 1등 10,000 / 2등 3,000 / 3등 100G.</p>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>회차</th><th>당첨 번호</th><th class="n">판매</th><th class="n">참여</th><th class="n">1등</th><th class="n">2등</th><th class="n">3등</th><th class="n">확인</th><th class="n">지급</th></tr></thead><tbody>
    ${rows.map(r=>`<tr><td><b>${esc(r.draw_key)}</b><div class="faint small">${fmtTime(r.draw_at)}</div></td>
      <td>${r.nums?`<span style="font-family:var(--f-code);letter-spacing:.15em">${r.nums.map(n=>esc(n)).join(' ')}</span>`:new Date(r.draw_at)>Date.now()?'<span class="chip warn">판매 중</span>':'<span class="chip dim">추첨 대기</span>'}</td>
      <td class="n">${r.tickets}</td><td class="n">${r.players}</td><td class="n">${r.r1||''}</td><td class="n">${r.r2||''}</td><td class="n">${r.r3||''}</td>
      <td class="n">${r.nums?`${r.claimed}/${r.tickets}`:''}</td><td class="n">${Number(r.paid)?Number(r.paid).toLocaleString('ko-KR')+'G':''}</td></tr>`).join('')||'<tr><td colspan="9" class="empty">아직 판매된 행운권이 없습니다.</td></tr>'}
    </tbody></table></div></div>`;
};

/* ── 채팅 (전체·월드 최근 메시지: 가리기·지우기·정지, 운영 공지 올리기) ── */
let CHT={ch:'lobby',hidden:false};
VIEWS.chat=async(el)=>{
  let qy=A.sb.from('chat_messages').select('id,channel,author,name,cat,text,hidden,created_at').eq('channel',CHT.ch).order('id',{ascending:false}).limit(200);
  if(CHT.hidden)qy=qy.eq('hidden',true);
  const rows=await q(qy);
  if(!rows){el.innerHTML='<div class="msg bad">채팅을 불러오지 못했습니다.</div>';return;}
  const WC={notice:'공지',update:'업데이트',maint:'점검'};
  el.innerHTML=`<div class="two">
    <div class="panel" style="grid-column:1/-1"><h3><span class="row" style="gap:8px">
        <select id="ct-ch" style="width:auto">${[['lobby','전체 채팅'],['world','월드(공지)']].map(([v,l])=>`<option value="${v}" ${CHT.ch===v?'selected':''}>${l}</option>`).join('')}</select>
        <label class="chk"><input type="checkbox" id="ct-hid" ${CHT.hidden?'checked':''}> 가린 것만</label>
        <span class="faint" style="font-weight:400">최근 ${rows.length}개</span></span>
        <button class="btn btn-sm" id="ct-reload">새로고침</button></h3>
      ${CHT.ch==='world'?`<form class="row" id="ct-post" style="flex-wrap:nowrap;margin-bottom:12px"><select id="ct-cat" style="width:auto">${Object.entries(WC).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select><input type="text" id="ct-text" maxlength="200" placeholder="월드 채널에 올릴 공지 (게임 채팅 '월드' 탭에 바로 뜹니다)"><button class="btn btn-p">올리기</button></form>`:''}
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>시각</th><th>보낸 사람</th><th>내용</th><th></th></tr></thead><tbody>
      ${rows.map(r=>`<tr${r.hidden?' style="opacity:.55"':''}><td class="small faint" style="white-space:nowrap">${fmtTime(r.created_at)}</td>
        <td class="small" style="white-space:nowrap">${r.author?who(r.author):esc(r.name)}${r.cat?` <span class="chip info">${esc(WC[r.cat]||r.cat)}</span>`:''}</td>
        <td>${esc(r.text)}${r.hidden?' <span class="chip dim">가림</span>':''}</td>
        <td><div class="row" style="flex-wrap:nowrap">
          <button class="btn btn-sm" data-hide="${r.id}" data-v="${r.hidden?0:1}">${r.hidden?'다시 보이기':'가리기'}</button>
          <button class="btn btn-sm btn-g" data-del="${r.id}">삭제</button>
          ${r.author&&r.author!==A.user.id?`<button class="btn btn-sm btn-d" data-ban="${r.author}">정지</button>`:''}</div></td></tr>`).join('')||'<tr><td colspan="4" class="empty">메시지가 없습니다.</td></tr>'}
      </tbody></table></div>
      <p class="faint small" style="margin:10px 0 0">가리면 유저 화면에서 바로 사라집니다(1분 안). 1:1 대화는 당사자만 볼 수 있어 여기 나오지 않습니다 — 신고된 1:1은 '문의 · 신고'에서 내용을 확인하세요.</p></div></div>`;
  $('#ct-ch').onchange=e=>{CHT.ch=e.target.value;go('chat');};
  $('#ct-hid').onchange=e=>{CHT.hidden=e.target.checked;go('chat');};
  $('#ct-reload').onclick=()=>go('chat');
  const pf=$('#ct-post');if(pf)pf.onsubmit=async e=>{e.preventDefault();const text=$('#ct-text').value.trim();if(!text)return;
    if(await q(A.sb.from('chat_messages').insert({channel:'world',name:'운영자',cat:$('#ct-cat').value,text}),'월드 채널에 올렸습니다.'))go('chat');};
  $$('[data-hide]').forEach(b=>b.onclick=async()=>{if(await q(A.sb.from('chat_messages').update({hidden:b.dataset.v==='1'}).eq('id',b.dataset.hide),b.dataset.v==='1'?'가렸습니다.':'다시 보이게 했습니다.'))go('chat');});
  $$('[data-del]').forEach(b=>b.onclick=async()=>{if(!await ask('메시지 삭제','삭제한 메시지는 되돌릴 수 없습니다. 기록으로 남기려면 가리기를 쓰세요.','삭제',true))return;
    if(await q(A.sb.from('chat_messages').delete().eq('id',b.dataset.del),'삭제했습니다.'))go('chat');});
  $$('[data-ban]').forEach(b=>b.onclick=()=>banDlg(b.dataset.ban));
};
