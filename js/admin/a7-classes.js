'use strict';
/* 운영 페이지 · 클래스 탭 (콘텐츠 › 클래스)
   클래스마다 최초 HP/MP · 레벨별 HP/MP 상승 % 를 정해 서버 content(kind 'cls', id = 클래스 id)에 공개한다.
   게임: 01-engine applyClassCfg(08-server ctApply 가 부름) → statsFor.
     최대 HP = 최초 HP × (1 + 상승% / 100 × 레벨 계수)   레벨 계수 = (LV−1) × (1 + (LV−1)/196)
   상위 클래스에 따로 값을 두지 않으면 기본 클래스 값 + 그 클래스의 HP 보너스를 따라간다.
   MP는 아직 게임에서 쓰는 곳이 없어 HUD 표시만. */
const CLS_KIND='cls';
const CLS_F=[['hp','최초 HP',1,1],['hpPct','HP 상승 %',0,0.01],['mp','최초 MP',0,1],['mpPct','MP 상승 %',0,0.01]];
const CLS_PV=[1,20,50,80,99];
const CLS={edit:{}};   // 아직 공개하지 않은 칸 값 {클래스:{hp,…}}
const clsLvK=lv=>(lv-1)*(1+(lv-1)/196);
const clsDef=()=>(DEF&&DEF.cls)||{};
const clsSrv=id=>{const r=(A.content[CLS_KIND]||{})[id];return r&&r.data||null;};
/* 지금 게임에 적용되는 값 · 어디서 온 값인지 */
function clsLive(id){const D=clsDef()[id]||{};const own=clsSrv(id);if(own)return {v:{...D,...own},src:'own'};
  const b=D.base&&clsSrv(D.base);if(b){const bd=clsDef()[D.base]||{};const bonus=(D.hp||0)-(bd.hp||0);
    return {v:{...D,hp:(b.hp??bd.hp)+bonus,hpPct:b.hpPct??D.hpPct,mp:b.mp??D.mp,mpPct:b.mpPct??D.mpPct},src:'base'};}
  return {v:D,src:'def'};}
function clsCur(id){return {...clsLive(id).v,...(CLS.edit[id]||{})};}
function clsDirty(id){const e=CLS.edit[id];if(!e)return false;const L=clsLive(id).v;return CLS_F.some(([k])=>e[k]!==undefined&&e[k]!==L[k]);}
function clsAt(v,lv){const k=clsLvK(lv);return [Math.round((v.hp||0)*(1+(v.hpPct||0)/100*k)),Math.round((v.mp||0)*(1+(v.mpPct||0)/100*k))];}
function clsRow(id){const D=clsDef()[id]||{};const {src}=clsLive(id);const v=clsCur(id);const dirty=clsDirty(id);
  const chip=dirty?'<span class="chip warn">고침 · 공개 전</span>':src==='own'?'<span class="chip ok">서버 값</span>':src==='base'?`<span class="chip">${esc((clsDef()[D.base]||{}).name||D.base)} 값 따라감</span>`:'<span class="chip">게임 기본값</span>';
  return `<tr data-cls="${esc(id)}" class="${D.base?'cl-adv':''}${dirty?' dirty':''}">
    <td class="cl-n"><b>${esc(D.name||id)}</b><small class="faint">${esc(id)}</small>${chip}</td>
    ${CLS_F.map(([k,l,min,step])=>`<td><input type="number" class="cl-in" data-k="${k}" min="${min}" step="${step}" value="${v[k]??''}" aria-label="${esc((D.name||id)+' '+l)}"></td>`).join('')}
    <td class="cl-pv num">${CLS_PV.map(lv=>{const [h,m]=clsAt(v,lv);return `<span><em>LV${lv}</em>${h.toLocaleString()}<i>/</i>${m.toLocaleString()}</span>`;}).join('')}</td>
    <td class="cl-act"><button class="btn btn-sm btn-primary" data-cl="pub" ${dirty?'':'disabled'}>공개</button>${src==='own'?'<button class="btn btn-sm btn-g" data-cl="reset">기본값으로</button>':''}<button class="btn btn-sm btn-g" data-cl="undo" ${dirty?'':'hidden'}>되돌리기</button></td></tr>`;}
function clsTable(){const ids=Object.keys(clsDef());if(!ids.length)return '<p class="msg bad">게임 기본값을 읽지 못했습니다. 새로고침해 주세요.</p>';
  const base=ids.filter(i=>!clsDef()[i].base);const order=base.flatMap(b=>[b,...ids.filter(i=>clsDef()[i].base===b)]);ids.forEach(i=>{if(!order.includes(i))order.push(i);});
  const nd=ids.filter(clsDirty).length;
  return `<div class="panel"><div class="row" style="justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:10px">
      <p class="small muted" style="margin:0">최대 HP = 최초 HP × (1 + 상승% ÷ 100 × 레벨 계수) · 레벨 계수 = (LV−1) × (1 + (LV−1) ÷ 196). 장비 HP는 이 위에 더해집니다.<br>상위 클래스에 값을 따로 두지 않으면 기본 클래스 값(+ 그 클래스 HP 보너스)을 따라갑니다. MP는 아직 전투에서 쓰지 않고 HUD에만 보입니다.</p>
      <button class="btn btn-primary" data-cl="puball" ${nd?'':'disabled'}>바뀐 것 모두 공개${nd?` (${nd})`:''}</button></div>
    <div class="cl-wrap"><table class="cl-t"><thead><tr><th>클래스</th>${CLS_F.map(([,l])=>`<th>${l}</th>`).join('')}<th>미리보기 HP / MP</th><th></th></tr></thead>
    <tbody>${order.map(clsRow).join('')}</tbody></table></div></div>`;}
async function clsPublish(ids){let ok=0;
  for(const id of ids){const data={};CLS_F.forEach(([k])=>{const n=Number(clsCur(id)[k]);if(isFinite(n))data[k]=n;});
    if(!(data.hp>=1))return toast(`${(clsDef()[id]||{}).name||id} · 최초 HP는 1 이상이어야 합니다.`,'bad');
    if([data.hpPct,data.mp,data.mpPct].some(x=>x<0))return toast('음수는 넣을 수 없습니다.','bad');
    if(!await q(A.sb.from('content_drafts').upsert({kind:CLS_KIND,id,data})))return;
    if(!await q(A.sb.rpc('admin_publish',{p_kind:CLS_KIND,p_id:id})))return;
    delete CLS.edit[id];ok++;}
  if(ok)toast(`클래스 ${ok}개를 공개했습니다. 접속 중인 블레서에게도 곧 적용됩니다.`,'good');
  await loadServerContent();clsDraw();}
function clsDraw(){const box=$('#cl-box');if(!box)return;const y=window.scrollY;box.innerHTML=clsTable();clsBind();window.scrollTo(0,y);}
function clsBind(){const box=$('#cl-box');if(!box)return;
  $$('.cl-in',box).forEach(el=>el.oninput=()=>{const tr=el.closest('tr');const id=tr.dataset.cls;const n=el.value===''?undefined:Number(el.value);
    (CLS.edit[id]=CLS.edit[id]||{})[el.dataset.k]=isFinite(n)?n:undefined;
    const pv=tr.querySelector('.cl-pv');const v=clsCur(id);pv.innerHTML=CLS_PV.map(lv=>{const [h,m]=clsAt(v,lv);return `<span><em>LV${lv}</em>${h.toLocaleString()}<i>/</i>${m.toLocaleString()}</span>`;}).join('');
    const d=clsDirty(id);tr.classList.toggle('dirty',d);tr.querySelector('[data-cl="pub"]').disabled=!d;tr.querySelector('[data-cl="undo"]').hidden=!d;
    const ch=tr.querySelector('.cl-n .chip');if(ch&&d){ch.className='chip warn';ch.textContent='고침 · 공개 전';}
    const all=$('[data-cl="puball"]',box);const nd=Object.keys(clsDef()).filter(clsDirty).length;all.disabled=!nd;all.textContent='바뀐 것 모두 공개'+(nd?` (${nd})`:'');});
  $$('[data-cl]',box).forEach(b=>b.onclick=async()=>{const tr=b.closest('tr');const id=tr&&tr.dataset.cls;const a=b.dataset.cl;
    if(a==='pub')return clsPublish([id]);
    if(a==='puball')return clsPublish(Object.keys(clsDef()).filter(clsDirty));
    if(a==='undo'){delete CLS.edit[id];return clsDraw();}
    if(a==='reset'){if(!await ask('기본값으로 되돌리기',`<b>${esc((clsDef()[id]||{}).name||id)}</b>의 서버 값을 지우고 게임 기본값(또는 기본 클래스 값)으로 돌립니다.`))return;
      if(await q(A.sb.from('content').delete().match({kind:CLS_KIND,id}),'되돌렸습니다.')){delete CLS.edit[id];await loadServerContent();clsDraw();}}});}
VIEWS.classes=async(el)=>{
  el.innerHTML='<p class="muted">불러오는 중…</p>';
  await Promise.all([loadDefaults(),loadServerContent()]);
  el.innerHTML=`<div id="cl-box"></div>`;clsDraw();};
