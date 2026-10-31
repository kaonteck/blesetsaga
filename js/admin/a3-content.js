'use strict';
/* 운영 페이지 · 콘텐츠 탭
   목록 = 게임 코드 기본값 ∪ 서버(content) ∪ 초안(content_drafts).
   서버에 있는 값이 코드 기본값을 덮는다. 서버에서 지우면 코드 기본값으로 돌아간다. */
// 게임이 서버 콘텐츠를 읽는지 (08-server.js 연결 완료 → false). true면 "연결 준비 중" 안내를 띄운다
const GAME_NOT_CONNECTED=false;

A.content={};A.drafts={};
const C={kind:'monster',id:null,search:'',filter:'all',pane:'kind'};   // 화면 선택 상태

async function loadServerContent(){
  const [c,d]=await Promise.all([q(A.sb.from('content').select('*').order('sort').order('id')),q(A.sb.from('content_drafts').select('*'))]);
  if(!c||!d)return false;
  A.content={};A.drafts={};Object.keys(KINDS).forEach(k=>{A.content[k]={};A.drafts[k]={};});
  c.forEach(r=>{(A.content[r.kind]=A.content[r.kind]||{})[r.id]=r;});
  d.forEach(r=>{(A.drafts[r.kind]=A.drafts[r.kind]||{})[r.id]=r;});
  return true;
}
// 지금 게임에서 쓰이는 값 (서버 > 기본값)
const liveData=(k,id)=>{const r=(A.content[k]||{})[id];return r?r.data:(DEF[k]||{})[id];};
const ctx=()=>({items:{...DEF.item,...Object.fromEntries(Object.entries(A.content.item||{}).map(([i,r])=>[i,r.data]))}});

function rowState(k,id){
  const def=(DEF[k]||{})[id],srv=(A.content[k]||{})[id],dr=(A.drafts[k]||{})[id];const now=Date.now();
  const s={def:!!def,srv:!!srv,draft:!!dr,chips:[]};
  if(srv){
    if(!srv.published)s.chips.push(['비공개','dim']);
    else if(srv.starts_at&&new Date(srv.starts_at)>now)s.chips.push(['예약 '+fmtTime(srv.starts_at),'info']);
    else if(srv.ends_at&&new Date(srv.ends_at)<=now)s.chips.push(['기간 끝남','dim']);
    else s.chips.push(['서버 공개','ok']);
    if(def&&JSON.stringify(def)!==JSON.stringify(srv.data))s.chips.push(['기본값과 다름','info']);
    if(!def)s.chips.push(['새로 만듦','info']);
  }else if(def)s.chips.push(['코드 기본값','dim']);
  if(dr)s.chips.push(['초안','warn']);
  return s;
}
function idsOf(k){const ids=new Set([...Object.keys(DEF[k]||{}),...Object.keys(A.content[k]||{}),...Object.keys(A.drafts[k]||{})]);
  const sortOf=id=>((A.content[k]||{})[id]||{}).sort||0;
  return [...ids].sort((a,b)=>sortOf(a)-sortOf(b)||a.localeCompare(b,'ko',{numeric:true}));}
function titleOf(k,id){const d=((A.drafts[k]||{})[id]||{}).data||liveData(k,id)||{};try{return KINDS[k].title(d,ctx(),id)||id;}catch(e){return id;}}
function subOf(k,id){const d=liveData(k,id)||((A.drafts[k]||{})[id]||{}).data||{};try{return KINDS[k].sub(d,ctx(),id)||'';}catch(e){return '';}}

VIEWS.content=async(el)=>{
  el.innerHTML='<p class="loading">게임 기본값과 서버 콘텐츠를 불러오는 중…</p>';
  const [ok]=await Promise.all([loadServerContent(),loadDefaults()]);
  if(!ok){el.innerHTML='<div class="msg bad">서버 콘텐츠를 불러오지 못했습니다. 새로고침해 주세요.</div>';return;}
  if(A.opts&&A.opts.kind){C.kind=A.opts.kind;C.id=A.opts.id||null;C.pane=C.id?'ed':'list';}
  drawContent();
};

function drawContent(){
  const el=$('#view');if(A.tab!=='content')return;
  const k=C.kind;const ids=idsOf(k);
  const term=C.search.trim().toLowerCase();
  const shown=ids.filter(id=>{
    if(term&&!(id.toLowerCase().includes(term)||String(titleOf(k,id)).toLowerCase().includes(term)||subOf(k,id).toLowerCase().includes(term)))return false;
    const s=rowState(k,id);
    return C.filter==='all'||(C.filter==='server'&&s.srv)||(C.filter==='changed'&&s.srv&&s.def&&JSON.stringify(DEF[k][id])!==JSON.stringify(A.content[k][id].data))||(C.filter==='draft'&&s.draft)||(C.filter==='code'&&!s.srv);
  });
  const gone=C.id&&!ids.includes(C.id);   // 지워진 항목(기록에서 열었을 때)
  const counts=Object.fromEntries(Object.keys(KINDS).map(kk=>[kk,idsOf(kk).length]));
  const draftN=kk=>Object.keys(A.drafts[kk]||{}).length;
  el.innerHTML=`
    ${GAME_NOT_CONNECTED?`<div class="msg info" style="margin-bottom:12px"><b>연결 준비 중</b> · 여기서 공개한 내용은 서버에 저장되지만, 게임이 서버 콘텐츠를 읽도록 연결하는 작업(다음 단계)이 끝나야 실제 게임에 반영됩니다.</div>`:''}
    ${DEF._error?`<div class="msg warn" style="margin-bottom:12px">게임 기본값을 읽지 못했습니다(${esc(DEF._error)}). 서버에 저장된 항목만 보입니다.</div>`:''}
    <div class="cgrid pick-${C.pane}">
      <div class="panel kinds-p"><h3>종류</h3><div class="kinds">
        ${Object.entries(KINDS).map(([kk,v])=>`<button class="kind" data-kind="${kk}" aria-current="${kk===k}"><span>${v.label}</span><span class="n">${draftN(kk)?`<span class="chip warn" style="margin-right:4px">초안 ${draftN(kk)}</span>`:''}${counts[kk]}</span></button>`).join('')}
      </div>
      <div class="stack" style="margin-top:14px;border-top:1px solid var(--rule);padding-top:12px">
        <button class="btn btn-sm" id="c-seed">기본값을 서버에 올리기</button>
        <button class="btn btn-sm" id="c-export">전체 내보내기 (JSON)</button>
        <button class="btn btn-sm" id="c-import">JSON 가져오기</button>
        <input type="file" id="c-file" accept=".json,application/json" class="hide">
      </div></div>
      <div class="panel list-p">
        <h3><span class="row" style="gap:6px"><button class="btn btn-g btn-sm back" data-pane="kind">‹ 종류</button>${KINDS[k].label} <span class="faint" style="font-weight:400">${shown.length}</span></span><button class="btn btn-sm" id="c-new">+ 새로 만들기</button></h3>
        <div class="stack" style="gap:6px;margin-bottom:10px">
          <input type="search" id="c-search" placeholder="이름·id 검색" value="${esc(C.search)}">
          <select id="c-filter">${[['all','전체'],['server','서버에 있는 것'],['changed','기본값과 다른 것'],['draft','초안 있는 것'],['code','코드 기본값만']].map(([v,l])=>`<option value="${v}" ${C.filter===v?'selected':''}>${l}</option>`).join('')}</select>
        </div>
        <div class="list">${shown.map(id=>{const s=rowState(k,id);return `<div class="li" data-id="${esc(id)}" aria-current="${id===C.id}" tabindex="0"><div class="t"><b>${esc(titleOf(k,id))}</b><small>${esc(id)}${subOf(k,id)?' · '+esc(subOf(k,id)):''}</small></div><div class="chips">${s.chips.map(([t,c])=>`<span class="chip ${c}">${esc(t)}</span>`).join('')}</div></div>`;}).join('')||'<p class="empty">항목이 없습니다.</p>'}</div>
      </div>
      <div class="ed">${gone?goneHTML(k,C.id):C.id?editorHTML(k,C.id):`<div class="panel"><p class="empty">왼쪽 목록에서 고칠 항목을 고르세요.<br>서버에 올린 값이 게임 코드의 기본값을 덮어씁니다.</p></div>`}</div>
    </div>`;
  bindContent();
}

function goneHTML(k,id){
  return `<div class="panel"><div class="ed-head"><div><button class="btn btn-g btn-sm back" data-pane="list" style="margin-bottom:6px">‹ 목록</button>
    <h2>${esc(id)}</h2><div class="id">${KINDS[k].label} · 지금은 서버에도 게임 코드에도 없는 항목입니다(삭제됨).</div></div></div>
    <div class="panel" style="background:var(--slab-2)"><h3>변경 기록</h3><div class="hist" id="c-hist"></div></div></div>`;}
function editorHTML(k,id){
  const def=(DEF[k]||{})[id],srv=(A.content[k]||{})[id],dr=(A.drafts[k]||{})[id];
  const cur=dr?dr.data:srv?srv.data:def||BLANK[k];
  const s=rowState(k,id);
  const diff=def&&srv?topDiff(def,srv.data):[];
  return `<div class="panel">
    <div class="ed-head"><div><button class="btn btn-g btn-sm back" data-pane="list" style="margin-bottom:6px">‹ 목록</button>
      <h2>${esc(titleOf(k,id))}</h2><div class="id">${KINDS[k].label} · id <b>${esc(id)}</b>${srv?` · ${srv.rev}번째 버전 · ${ago(srv.updated_at)} ${who(srv.updated_by)}`:''}</div></div>
      <div class="row">${s.chips.map(([t,c])=>`<span class="chip ${c}">${esc(t)}</span>`).join('')}</div></div>
    <div class="ed-grid">
      <div class="stack">
        ${dr?`<div class="msg warn">공개하지 않은 초안이 있습니다 (${ago(dr.updated_at)} ${who(dr.updated_by)}). 아래 편집기에는 초안이 열려 있습니다.</div>`:''}
        <textarea class="code" id="c-json" spellcheck="false" aria-label="내용 (JSON)">${esc(pretty(cur))}</textarea>
        <div id="c-msg"></div>
        <div class="row">
          <button class="btn btn-p" id="c-pub">공개하기</button>
          <button class="btn" id="c-draft">초안 저장</button>
          <button class="btn" id="c-check">검사</button>
          <button class="btn btn-g" id="c-fmt">정리</button>
          <span class="grow"></span>
          ${dr?'<button class="btn btn-g" id="c-dropdraft">초안 버리기</button>':''}
          ${def&&(srv||dr)?'<button class="btn btn-g" id="c-todef">기본값 불러오기</button>':''}
        </div>
        <p class="faint small" style="margin:0">공개하기 = 검사 → 서버에 저장 → 모든 유저에게 적용. 초안은 운영자에게만 보입니다. 이미 시작한 전투는 시작할 때의 값을 유지합니다.</p>
      </div>
      <div class="stack">
        <div class="panel" style="background:var(--slab-2)"><h3>공개 설정</h3>${srv?`
          <div class="sets">
            <label class="chk wide"><input type="checkbox" id="s-pub" ${srv.published?'checked':''}> 유저에게 보이기</label>
            <label class="f">보이기 시작<input type="datetime-local" id="s-start" value="${toLocalInput(srv.starts_at)}"></label>
            <label class="f">보이기 끝<input type="datetime-local" id="s-end" value="${toLocalInput(srv.ends_at)}"></label>
            <label class="f">순서<input type="number" id="s-sort" value="${srv.sort}"></label>
            <label class="f wide">운영 메모 (유저에게 안 보임)<input type="text" id="s-note" maxlength="200" value="${esc(srv.note||'')}"></label>
            <div class="wide row"><button class="btn btn-sm btn-p" id="s-save">설정 저장</button><span class="faint small">시각은 한국 시간</span></div>
          </div>`:'<p class="faint small" style="margin:0">아직 서버에 없습니다. 공개하면 서버에 생기고, 여기서 예약 공개·기간·비공개를 정할 수 있습니다.</p>'}</div>
        ${def&&srv?`<div class="panel" style="background:var(--slab-2)"><h3>기본값과 다른 점 <span class="faint" style="font-weight:400">${diff.length}</span></h3>${diff.length?`<div class="diff">${diff.slice(0,12).map(d=>`<div><b>${esc(d.k)}</b> <span class="r">${esc(shortVal(d.before))}</span> → <span class="a">${esc(shortVal(d.after))}</span></div>`).join('')}${diff.length>12?`<div class="faint">외 ${diff.length-12}개</div>`:''}</div>`:'<p class="faint small" style="margin:0">코드 기본값과 같습니다.</p>'}</div>`:''}
        <div class="panel" style="background:var(--slab-2)"><h3>변경 기록</h3><div class="hist" id="c-hist"><p class="faint small" style="padding:0 14px">불러오는 중…</p></div></div>
        ${srv?`<button class="btn btn-d btn-sm" id="c-del">${def?'서버 값 지우기 (코드 기본값으로 돌아감)':'서버에서 삭제'}</button>`:''}
      </div>
    </div></div>`;
}

function bindContent(){
  $$('.kind').forEach(b=>b.onclick=()=>{C.kind=b.dataset.kind;C.id=null;C.search='';C.pane='list';drawContent();});
  $$('[data-pane]').forEach(b=>b.onclick=()=>{C.pane=b.dataset.pane;if(C.pane!=='ed')C.id=C.pane==='kind'?null:C.id;drawContent();});
  $$('.li[data-id]').forEach(r=>{const open=()=>{C.id=r.dataset.id;C.pane='ed';drawContent();window.scrollTo({top:0});};r.onclick=open;r.onkeydown=e=>{if(e.key==='Enter')open();};});
  const s=$('#c-search');if(s)s.oninput=()=>{C.search=s.value;const pos=s.selectionStart;drawContent();const n=$('#c-search');n.focus();n.setSelectionRange(pos,pos);};
  const f=$('#c-filter');if(f)f.onchange=()=>{C.filter=f.value;drawContent();};
  $('#c-new').onclick=newItem;
  $('#c-seed').onclick=seedDefaults;
  $('#c-export').onclick=exportAll;
  $('#c-import').onclick=()=>$('#c-file').click();
  $('#c-file').onchange=e=>importFile(e.target.files[0]);
  if(!C.id)return;
  if(!$('#c-json')){loadHistory(C.kind,C.id);return;}
  const k=C.kind,id=C.id,ta=$('#c-json');
  // 탭 키로 들여쓰기
  ta.onkeydown=e=>{if(e.key==='Tab'&&!e.shiftKey){e.preventDefault();const p=ta.selectionStart;ta.setRangeText('  ',p,ta.selectionEnd,'end');}};
  $('#c-fmt').onclick=()=>{const d=parseEditor();if(d)ta.value=pretty(d);};
  $('#c-check').onclick=()=>{const d=parseEditor();if(d)showCheck(checkData(k,id,d,liveAll(k)));};
  $('#c-draft').onclick=async()=>{const d=parseEditor();if(!d)return;
    if(await q(A.sb.from('content_drafts').upsert({kind:k,id,data:d}),'초안을 저장했습니다.')){await loadServerContent();drawContent();}};
  $('#c-pub').onclick=()=>publish(k,id);
  const dd=$('#c-dropdraft');if(dd)dd.onclick=async()=>{if(!await ask('초안 버리기','공개하지 않은 초안을 지웁니다. 서버에 공개된 값은 그대로입니다.','버리기',true))return;
    if(await q(A.sb.from('content_drafts').delete().match({kind:k,id}),'초안을 버렸습니다.')){await loadServerContent();drawContent();}};
  const td=$('#c-todef');if(td)td.onclick=()=>{ta.value=pretty(DEF[k][id]);showCheck(null,'편집기에 코드 기본값을 불러왔습니다. 공개해야 적용됩니다.');};
  const ss=$('#s-save');if(ss)ss.onclick=()=>saveSettings(k,id);
  const del=$('#c-del');if(del)del.onclick=()=>deleteItem(k,id);
  loadHistory(k,id);
}
const liveAll=k=>Object.fromEntries(idsOf(k).map(i=>[i,liveData(k,i)]).filter(([,d])=>d));

function parseEditor(){const ta=$('#c-json');try{const d=JSON.parse(ta.value);if(d===null||typeof d!=='object'||Array.isArray(d))throw new Error('{ } 로 감싼 객체여야 합니다.');return d;}
  catch(e){const m=/position (\d+)/.exec(e.message);let where='';if(m){const pos=+m[1];const line=ta.value.slice(0,pos).split('\n').length;where=` (${line}번째 줄 근처)`;ta.focus();ta.setSelectionRange(pos,pos+1);}
    showCheck(['JSON 형식이 맞지 않습니다'+where+': '+e.message.replace(/^JSON\.parse: /,'')]);return null;}}
function showCheck(errs,okText){const m=$('#c-msg');if(!m)return;
  m.innerHTML=errs&&errs.length?`<div class="msg bad">검사에서 ${errs.length}개 문제를 찾았습니다.<ul>${errs.slice(0,15).map(e=>`<li>${esc(e)}</li>`).join('')}</ul></div>`:`<div class="msg ok">${esc(okText||'검사 통과 · 문제가 없습니다.')}</div>`;}

async function publish(k,id){
  const d=parseEditor();if(!d)return;
  const errs=checkData(k,id,d,liveAll(k));showCheck(errs);
  if(errs.length&&!await ask('문제가 있는 채로 공개할까요?',`검사에서 ${errs.length}개 문제가 나왔습니다. 공개하면 유저 게임에서 오류가 날 수 있습니다.`,'그래도 공개',true))return;
  const srv=(A.content[k]||{})[id];const before=srv?srv.data:(DEF[k]||{})[id];
  const ch=topDiff(before,d);
  if(!errs.length&&!await ask(`${titleOf(k,id)} 공개`,`${srv?'서버 값':'코드 기본값'}에서 ${ch.length}곳이 바뀝니다.${ch.length?`<div class="diff" style="margin-top:8px">${ch.slice(0,8).map(x=>`<div><b>${esc(x.k)}</b> <span class="r">${esc(shortVal(x.before))}</span> → <span class="a">${esc(shortVal(x.after))}</span></div>`).join('')}</div>`:''}`,'공개하기'))return;
  if(!await q(A.sb.from('content_drafts').upsert({kind:k,id,data:d})))return;
  if(await q(A.sb.rpc('admin_publish',{p_kind:k,p_id:id}),'공개했습니다. 모든 유저에게 적용됩니다.')){await loadServerContent();drawContent();}
}
async function saveSettings(k,id){
  const start=fromLocalInput($('#s-start').value),end=fromLocalInput($('#s-end').value);
  if(start&&end&&new Date(end)<=new Date(start))return toast('끝 시각이 시작 시각보다 뒤여야 합니다.','bad');
  const row={published:$('#s-pub').checked,starts_at:start,ends_at:end,sort:parseInt($('#s-sort').value,10)||0,note:$('#s-note').value.trim()||null};
  if(await q(A.sb.from('content').update(row).match({kind:k,id}),'공개 설정을 저장했습니다.')){await loadServerContent();drawContent();}
}
async function deleteItem(k,id){
  const def=(DEF[k]||{})[id];
  if(!await ask(def?'서버 값 지우기':'서버에서 삭제',def?'서버 값을 지우면 게임은 코드 기본값을 씁니다. 지운 기록은 변경 기록에 남아 되돌릴 수 있습니다.':'코드 기본값이 없는 항목이라 게임에서 사라집니다. 변경 기록에서 되돌릴 수 있습니다.','지우기',true))return;
  if(await q(A.sb.from('content').delete().match({kind:k,id}),'지웠습니다.')){await loadServerContent();drawContent();}
}
async function loadHistory(k,id){
  const box=$('#c-hist');if(!box)return;
  const rows=await q(A.sb.from('content_history').select('hid,op,before,after,rev,changed_by,changed_at').match({kind:k,id}).order('hid',{ascending:false}).limit(30));
  if(!rows||!$('#c-hist'))return;
  if(!rows.length){box.innerHTML='<p class="faint small" style="padding:0 14px;margin:0">아직 기록이 없습니다.</p>';return;}
  const OP={insert:'처음 올림',update:'수정',delete:'삭제',restore:'되돌림'};
  box.innerHTML=rows.map((h,i)=>{const b=h.before||{},a=h.after||{};
    const parts=topDiff(b.data,a.data).map(x=>x.k);
    ['published','starts_at','ends_at','sort','note'].forEach(f=>{if(h.op==='update'&&JSON.stringify(b[f])!==JSON.stringify(a[f]))parts.push({published:'공개 여부',starts_at:'시작',ends_at:'끝',sort:'순서',note:'메모'}[f]);});
    return `<div class="hi"><div class="row"><span><b>${OP[h.op]||h.op}</b>${h.rev?` <span class="faint">v${h.rev}</span>`:''} · ${who(h.changed_by)}</span><span class="faint">${fmtTime(h.changed_at)}</span></div>
      ${parts.length&&h.op!=='insert'?`<div class="diff">${esc(parts.slice(0,8).join(', '))}${parts.length>8?' …':''}</div>`:''}
      ${i>0||h.op==='delete'?`<div style="margin-top:4px"><button class="btn btn-g btn-sm" data-restore="${h.hid}">${h.op==='delete'?'지우기 전으로 살리기':'이 버전으로 되돌리기'}</button></div>`:''}</div>`;}).join('');
  $$('[data-restore]',box).forEach(b=>b.onclick=async()=>{
    if(!await ask('되돌리기','이 시점의 내용과 공개 설정으로 되돌립니다. 되돌린 것도 기록에 남습니다.','되돌리기'))return;
    if(await q(A.sb.rpc('admin_restore',{p_hid:+b.dataset.restore}),'되돌렸습니다.')){await loadServerContent();drawContent();}});
}

async function newItem(){
  const k=C.kind;
  modal(`<h3>새 ${KINDS[k].label}</h3><form class="stack" id="nf">
    <label class="f">id (영문·숫자·_ — 게임 안에서 이 이름으로 찾습니다)<input type="text" id="n-id" maxlength="64" autocapitalize="none" spellcheck="false" value="${k==='event'?'ev_'+Date.now().toString(36):''}"></label>
    ${idsOf(k).length?`<label class="f">복사해서 시작 (선택)<select id="n-from"><option value="">빈 양식</option>${idsOf(k).map(i=>`<option value="${esc(i)}">${esc(titleOf(k,i))} (${esc(i)})</option>`).join('')}</select></label>`:''}
    <div id="n-err"></div>
    <div class="row" style="justify-content:flex-end"><button type="button" class="btn btn-g" data-close-btn>취소</button><button class="btn btn-p">만들기</button></div></form>`);
  $('#nf').onsubmit=async e=>{e.preventDefault();const id=$('#n-id').value.trim();
    const bad=t=>{$('#n-err').innerHTML=`<div class="msg bad">${esc(t)}</div>`;};
    if(!/^[A-Za-z0-9_\-]{1,64}$/.test(id))return bad('id는 영문·숫자·_- 1–64자로 정해 주세요.');
    if(idsOf(k).includes(id))return bad('이미 있는 id입니다.');
    const from=$('#n-from')&&$('#n-from').value;const data=from?clone(liveData(k,from)||A.drafts[k][from].data):clone(BLANK[k]);
    if(from&&data.name)data.name+=' (복사)';if(from&&data.title)data.title+=' (복사)';
    if(await q(A.sb.from('content_drafts').insert({kind:k,id,data}))){modal(null);await loadServerContent();C.id=id;C.pane='ed';drawContent();toast('초안을 만들었습니다. 고친 뒤 공개하세요.','good');}};
}

async function seedDefaults(){
  const rows=[];Object.keys(KINDS).forEach(k=>Object.entries(DEF[k]||{}).forEach(([id,data])=>{if(!(A.content[k]||{})[id])rows.push({kind:k,id,data});}));
  if(!rows.length)return toast('모든 기본값이 이미 서버에 있습니다.');
  const by={};rows.forEach(r=>by[r.kind]=(by[r.kind]||0)+1);
  if(!await ask('기본값을 서버에 올리기',`서버에 아직 없는 코드 기본값 <b>${rows.length}개</b>를 올립니다 (${Object.entries(by).map(([k,n])=>`${KINDS[k].label} ${n}`).join(' · ')}).<br>이미 서버에 있는 항목은 건드리지 않습니다. 값이 같으므로 게임 동작은 바뀌지 않고, 이후 변경 기록이 남기 시작합니다.`,'올리기'))return;
  let n=0;for(let i=0;i<rows.length;i+=100){const r=await q(A.sb.rpc('admin_import',{p_rows:rows.slice(i,i+100),p_overwrite:false}));if(r==null)break;n+=r;}
  toast(`${n}개를 서버에 올렸습니다.`,'good');await loadServerContent();drawContent();
}
function exportAll(){
  const rows=[];Object.entries(A.content).forEach(([k,o])=>Object.values(o).forEach(r=>rows.push({kind:r.kind,id:r.id,data:r.data,published:r.published,sort:r.sort})));
  const blob=new Blob([JSON.stringify({exported_at:new Date().toISOString(),rows},null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`bleset-content-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);
  toast(`서버 콘텐츠 ${rows.length}개를 내보냈습니다.`);
}
async function importFile(file){
  if(!file)return;$('#c-file').value='';
  let rows;try{const j=JSON.parse(await file.text());rows=Array.isArray(j)?j:j.rows;if(!Array.isArray(rows))throw new Error('rows 목록이 없습니다');
    rows=rows.filter(r=>r&&KINDS[r.kind]&&r.id&&r.data&&typeof r.data==='object');}catch(e){return toast('파일을 읽지 못했습니다: '+e.message,'bad');}
  if(!rows.length)return toast('가져올 항목이 없습니다.','bad');
  const exist=rows.filter(r=>(A.content[r.kind]||{})[r.id]).length;
  modal(`<h3>JSON 가져오기</h3><p class="muted" style="font-size:13px">${rows.length}개 항목 · 이미 서버에 있는 것 ${exist}개</p>
    <label class="chk" style="margin:8px 0 16px"><input type="checkbox" id="imp-over"> 이미 있는 항목도 파일 내용으로 덮어쓰기</label>
    <div class="row" style="justify-content:flex-end"><button class="btn btn-g" data-close-btn>취소</button><button class="btn btn-p" id="imp-go">가져오기</button></div>`);
  $('#imp-go').onclick=async()=>{const over=$('#imp-over').checked;modal(null);let n=0;
    for(let i=0;i<rows.length;i+=100){const r=await q(A.sb.rpc('admin_import',{p_rows:rows.slice(i,i+100),p_overwrite:over}));if(r==null)break;n+=r;}
    toast(`${n}개를 반영했습니다.`,'good');await loadServerContent();drawContent();};
}
