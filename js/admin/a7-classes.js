'use strict';
/* 운영 페이지 · 콘텐츠 › 클래스 (메인 2026-11-07 개편)
   목록에서 클래스를 누르면 클래스 개별 페이지: ① 레벨별 성장(HP·MP·공격력·마력·방어력·민첩·행운) ② 스킬 설정.
   ① 서버 content kind 'cls'(id = 클래스) — 게임 01-engine applyClassCfg → statsFor.
      값 = 최초 값 × (1 + 상승% ÷ 100 × 레벨 계수), 레벨 계수 = (LV−1) × (1 + (LV−1) ÷ 196).
      상위 클래스에 값을 따로 두지 않으면 기본 클래스 값(+ 그 클래스 보너스)을 따라감.
   ② 서버 content kind 'skill'(id = 스킬, 여러 클래스가 함께 씀) — 게임 01-engine applySkillCfg. 기본값과 다른 칸만 저장.
      이름·영문·설명·아이콘·필요 레벨·MP·배율·추가 대미지·연계·크리티컬·흡수·감소·중독·효과 계수(SKILL_V)·조건 문구·화면 효과 칩. 종류·대상은 규칙이라 고정. */
const CLS_KIND='cls',SK_KIND='skill';
const CLS_G=[['hp','HP','최대 체력',1],['mp','MP','스킬에 쓰는 마나',0],['atk','공격력','물리 공격 · 마법 계열은 무기 공격(물리)용',0],['mag','마력','마법 계열의 주 공격 · 회복량',0],
  ['def','방어력','받는 대미지 감소',0],['agi','민첩','회피(최대 20%)',0],['luk','행운','크리티컬 · 행동 순서',0]];
const CLS_KEYS=CLS_G.flatMap(([k])=>[k,k+'Pct']);
const CLS_PV=[1,20,30,50,80,99];
const CLS={sel:null,edit:{},sk:{},open:new Set()};
const ROLE_KO={tank:'탱커',dps:'딜러',heal:'힐러'};
const clsLvK=lv=>(lv-1)*(1+(lv-1)/196);
const clsDef=()=>(DEF&&DEF.cls)||{};
const skDef=()=>(DEF&&DEF.skill)||{};
const clsSrv=id=>{const r=(A.content[CLS_KIND]||{})[id];return r&&r.data||null;};
const skSrv=k=>{const r=(A.content[SK_KIND]||{})[k];return r&&r.data||null;};
const nfmt=v=>Math.round(v).toLocaleString('ko-KR');

/* ── 성장 ── 지금 게임에 적용되는 값 · 어디서 온 값인지 */
function clsLive(id){const D=clsDef()[id]||{};const own=clsSrv(id);if(own)return {v:{...D,...own},src:'own'};
  const b=D.base&&clsSrv(D.base);if(b){const bd=clsDef()[D.base]||{};const v={...D};
    CLS_G.forEach(([k])=>{if(typeof b[k]==='number')v[k]=b[k]+((D[k]||0)-(bd[k]||0));if(typeof b[k+'Pct']==='number')v[k+'Pct']=b[k+'Pct'];});return {v,src:'base'};}
  return {v:D,src:'def'};}
function clsCur(id){return {...clsLive(id).v,...(CLS.edit[id]||{})};}
function clsDirty(id){const e=CLS.edit[id];if(!e)return false;const L=clsLive(id).v;return CLS_KEYS.some(k=>e[k]!==undefined&&e[k]!==L[k]);}
const clsAt=(v,k,lv)=>Math.round((v[k]||0)*(1+(v[k+'Pct']||0)/100*clsLvK(lv)));
function srcChip(id){const D=clsDef()[id]||{};const {src}=clsLive(id);
  return clsDirty(id)?'<span class="chip warn">고침 · 공개 전</span>':src==='own'?'<span class="chip ok">서버 값</span>':src==='base'?`<span class="chip">${esc((clsDef()[D.base]||{}).name||D.base)} 값 따라감</span>`:'<span class="chip">게임 기본값</span>';}

/* ── 스킬 ── */
const SK_V_LABEL={link:{hp:'자신이 받는 대미지 · 최대 HP %'},cinder:{pct:'몬스터 공격 감소 %',turns:'지속 턴'},vindicate:{pct:'아군 받는 대미지 감소 %'},blind:{pct:'아군 추가 대미지 · 시전자 힘 %'},
  downworld:{pct:'몬스터 대미지 감소 %'},veil:{pct:'받는 대미지 감소 %',turns:'지속 턴'},backslider:{mul:'대상 대미지 배율 ×'},roar:{pct:'추가 대미지 · 힘 %',hp:'HP 소모 · 최대 HP %'},
  berserker:{mul:'대미지 배율 ×',hp:'최대 HP 감소 %'},dystopia:{mul:'대미지 배율 ×',hp:'아군 HP 소모 · 최대 HP %'},execution:{pct:'추가 대미지 최대 · 힘 %'},smoke:{pct:'다음 턴 파티원 추가 대미지 · 힘 %'},
  takedown:{pct:'추가 대미지 · 힘 %'},hellfire:{pct:'턴당 고정 대미지 · 마력 %',turns:'지속 턴'},cure:{pct:'추가 회복 · 마력 %'},sinsayer:{pct:'부활 HP %'},bless:{pct:'턴당 회복 · 대상 최대 HP %',turns:'지속 턴'},
  fasciation:{pct:'추가 회복 · 마력 %'},utopia:{pct:'추가 회복 · 마력 %'},pray:{hp:'자신 HP 소모 · 최대 HP %'}};
const SK_TYPE={dice:'공격',nodice:'효과',heal:'회복',support:'보조',addon:'함께 사용',passive:'패시브'};
const SK_FXK=[['dmg','대미지'],['buff','버프'],['debuff','디버프'],['heal','회복'],['dn','감소']];
const SK_S=['name','en','desc','img'],SK_N=['lv','mp','mpPct','mult','bonus','reduce','drain'],SK_B=['crit','special'];
/* 지금 적용 값 = 기본값 + 서버 값 + 편집 중인 값 */
function skFlat(k){const D=skDef()[k]||{};const o={};SK_S.forEach(f=>o[f]=D[f]??'');SK_N.forEach(f=>o[f]=D[f]);SK_B.forEach(f=>o[f]=!!D[f]);
  o.mpPct=D.mpPct?Math.round(D.mpPct*1000)/10:0;   /* 화면은 % */
  o.combo=D.combo?D.combo.bonus:undefined;o.poisonPct=D.poison?D.poison.pct:undefined;o.poisonTurns=D.poison?D.poison.turns:undefined;
  o.v={...(D.v||{})};o.cond=(D.cond||[]).join('\n');o.fx=JSON.parse(JSON.stringify(D.fx||[]));return o;}
function skFromSrv(k,base){const s=skSrv(k);if(!s)return base;const o={...base,v:{...base.v},fx:base.fx};
  SK_S.forEach(f=>{if(typeof s[f]==='string')o[f]=s[f];});SK_N.forEach(f=>{if(typeof s[f]==='number')o[f]=s[f];});SK_B.forEach(f=>{if(typeof s[f]==='boolean')o[f]=s[f];});
  if(typeof s.mpPct==='number')o.mpPct=Math.round(s.mpPct*1000)/10;
  if(s.combo&&typeof s.combo.bonus==='number')o.combo=s.combo.bonus;if(s.poison){if(typeof s.poison.pct==='number')o.poisonPct=s.poison.pct;if(typeof s.poison.turns==='number')o.poisonTurns=s.poison.turns;}
  if(s.v)Object.assign(o.v,s.v);if(Array.isArray(s.cond))o.cond=s.cond.join('\n');if(Array.isArray(s.fx))o.fx=JSON.parse(JSON.stringify(s.fx));return o;}
const skLive=k=>skFromSrv(k,skFlat(k));
function skCur(k){const L=skLive(k),e=CLS.sk[k];if(!e)return L;return {...L,...e,v:{...L.v,...(e.v||{})},fx:e.fx||L.fx};}
const skSame=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function skDirty(k){return !!CLS.sk[k]&&!skSame(skCur(k),skLive(k));}
/* 기본값과 다른 칸만 서버에 */
function skPayload(k){const c=skCur(k),D=skFlat(k),o={};
  SK_S.forEach(f=>{if((c[f]||'')!==(D[f]||''))o[f]=String(c[f]||'');});
  SK_N.forEach(f=>{if(f==='mpPct')return;if(c[f]!==D[f]&&c[f]!==undefined&&c[f]!==''&&isFinite(c[f]))o[f]=Number(c[f]);});
  if(c.mpPct!==D.mpPct)o.mpPct=Math.max(0,Number(c.mpPct)||0)/100;
  SK_B.forEach(f=>{if(!!c[f]!==!!D[f])o[f]=!!c[f];});
  if(c.combo!==undefined&&c.combo!==D.combo)o.combo={bonus:Number(c.combo)||0};
  if((c.poisonPct!==D.poisonPct||c.poisonTurns!==D.poisonTurns)&&D.poisonPct!==undefined)o.poison={pct:Number(c.poisonPct)||0,turns:Math.max(1,Number(c.poisonTurns)||1)};
  const vv={};Object.keys(c.v||{}).forEach(x=>{if(c.v[x]!==D.v[x]&&isFinite(c.v[x]))vv[x]=Number(c.v[x]);});if(Object.keys(vv).length)o.v=vv;
  if(c.cond!==D.cond)o.cond=String(c.cond||'').split('\n').map(x=>x.trim()).filter(Boolean);
  if(!skSame(c.fx,D.fx))o.fx=(c.fx||[]).filter(x=>x[1]&&x[1].trim()).map(x=>[x[0],x[1].trim()]);
  return o;}

/* ── 목록 ── */
function clsList(){const ids=Object.keys(clsDef());if(!ids.length)return '<p class="msg bad">게임 기본값을 읽지 못했습니다. 새로고침해 주세요.</p>';
  const base=ids.filter(i=>!clsDef()[i].base);
  const card=id=>{const D=clsDef()[id],v=clsCur(id);const nOv=(D.skills||[]).filter(k=>skSrv(k)).length;
    return `<button type="button" class="cl-card ${D.base?'adv':''}" data-clopen="${esc(id)}"><span class="cl-cn"><b>${esc(D.name)}</b><small class="faint">${esc(D.en||id)} · ${ROLE_KO[D.role]||''}${D.base?'':' · 1차'}</small></span>
      <span class="cl-cs num"><span>LV99 HP ${nfmt(clsAt(v,'hp',99))}</span><span>MP ${nfmt(clsAt(v,'mp',99))}</span><span>${D.magic?'마력 '+nfmt(clsAt(v,'mag',99)):'공격력 '+nfmt(clsAt(v,'atk',99))}</span></span>
      <span class="cl-cc">${srcChip(id)}<span class="chip dim">스킬 ${(D.skills||[]).length}${nOv?` · 서버 값 ${nOv}`:''}</span></span><span class="cl-go" aria-hidden="true">›</span></button>`;};
  return `<div class="panel"><p class="small muted" style="margin:0 0 10px">클래스를 누르면 레벨별 성장과 스킬을 따로 고칠 수 있습니다. 상위 클래스는 값을 따로 두지 않으면 기본 클래스 값을 따라갑니다.</p>
    ${base.map(b=>`<div class="cl-grp">${[b,...ids.filter(i=>clsDef()[i].base===b)].map(card).join('')}</div>`).join('')}</div>`;}

/* ── 클래스 페이지 ── */
function growthHTML(id){const D=clsDef()[id]||{},v=clsCur(id),dirty=clsDirty(id),{src}=clsLive(id);
  return `<div class="panel"><div class="ph-row"><h3>레벨별 성장</h3><span class="cl-hact">${srcChip(id)}
      <button class="btn btn-sm btn-g" data-cg="undo" ${dirty?'':'hidden'}>되돌리기</button>${src==='own'?'<button class="btn btn-sm btn-g" data-cg="reset">기본값으로</button>':''}<button class="btn btn-sm btn-primary" data-cg="pub" ${dirty?'':'disabled'}>성장 공개</button></span></div>
    <p class="small muted" style="margin:0 0 10px">값 = 최초 값 × (1 + 상승% ÷ 100 × 레벨 계수) · 레벨 계수 = (LV−1) × (1 + (LV−1) ÷ 196). 장비·아이템 능력치는 이 위에 더해집니다.${D.magic?' 이 클래스는 마법 계열이라 <b>마력</b>이 주 공격·회복 계수이고, 공격력은 무기 공격(물리)에만 씁니다.':' 이 클래스는 물리 계열이라 <b>공격력</b>이 주 공격 계수입니다(마력은 보통 0).'}</p>
    <div class="cl-wrap"><table class="cl-t"><thead><tr><th>능력치</th><th>최초 값(LV1)</th><th>레벨당 상승 %</th>${CLS_PV.map(l=>`<th class="num">LV${l}</th>`).join('')}</tr></thead><tbody>
    ${CLS_G.map(([k,l,h,min])=>`<tr data-gk="${k}"><td><b>${l}</b><small class="faint" style="display:block">${esc(h)}</small></td>
      <td><input type="number" class="cl-in" data-k="${k}" min="${min}" step="0.01" value="${v[k]??''}" aria-label="${l} 최초 값"></td>
      <td><input type="number" class="cl-in" data-k="${k}Pct" min="0" step="0.01" value="${v[k+'Pct']??''}" aria-label="${l} 상승 %"></td>
      ${CLS_PV.map(lv=>`<td class="num cl-pvc" data-lv="${lv}">${nfmt(clsAt(v,k,lv))}</td>`).join('')}</tr>`).join('')}
    </tbody></table></div></div>`;}
function skCard(k,cid){const D=skDef()[k];if(!D)return '';const c=skCur(k),dirty=skDirty(k),srv=!!skSrv(k),open=CLS.open.has(k);
  const shared=(D.classes||[]).filter(x=>x!==cid).map(x=>(clsDef()[x]||{}).name||x);
  const num=(f,l,v,step,hint)=>`<label class="f"><span class="fl">${l}${hint?` <small class="faint">${esc(hint)}</small>`:''}</span><input type="number" min="0" step="${step||1}" data-sf="${f}" value="${v??''}"></label>`;
  const vk=D.vKeys||[];
  return `<details class="sk-card ${dirty?'dirty':''}" data-sk="${esc(k)}" ${open?'open':''}><summary>
      <span class="sk-ic">${c.img?`<img src="${esc(c.img)}" alt="">`:`<span class="sk-ic0">${esc((c.name||k).slice(0,1))}</span>`}</span>
      <span class="sk-h"><b>${esc(c.name||k)}</b> <small class="faint">${esc(c.en||'')} · ${esc(k)}</small><span class="sk-chips"><span class="chip dim">${SK_TYPE[D.type]||D.type}</span>${D.mpPct||c.mpPct?`<span class="chip dim">MP 최대의 ${c.mpPct}%</span>`:c.mp?`<span class="chip dim">MP ${c.mp}</span>`:'<span class="chip dim">MP 0</span>'}${shared.length?`<span class="chip warn" title="${esc(shared.join(', '))}">${shared.length}개 클래스와 공용</span>`:''}${dirty?'<span class="chip warn">고침 · 공개 전</span>':srv?'<span class="chip ok">서버 값</span>':''}</span></span></summary>
    <div class="sk-body">
      ${shared.length?`<p class="small muted" style="margin:0 0 8px">이 스킬은 <b>${esc(shared.join(', '))}</b>도 함께 씁니다. 여기서 고치면 모두에게 적용됩니다.</p>`:''}
      <div class="sk-grid">
        <div class="f sk-icf"><span class="fl">아이콘 <small class="faint">정사각 · 비우면 기본 아이콘</small></span>
          <div class="row" style="gap:10px;align-items:center"><span class="sk-ic big">${c.img?`<img src="${esc(c.img)}" alt="">`:`<span class="sk-ic0">${esc((c.name||k).slice(0,1))}</span>`}</span>
          <label class="btn btn-sm">이미지 올리기<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" class="hide" data-skimg></label>${c.img?'<button type="button" class="btn btn-sm btn-g" data-sa="img-clear">빼기</button>':''}<small class="faint" data-skst></small></div></div>
        <label class="f"><span class="fl">이름</span><input type="text" maxlength="40" data-sf="name" value="${esc(c.name||'')}"></label>
        <label class="f"><span class="fl">영문 이름</span><input type="text" maxlength="40" data-sf="en" value="${esc(c.en||'')}"></label>
        ${num('lv','필요 레벨',c.lv,1,'비우면 제한 없음')}
        <label class="f wide"><span class="fl">설명</span><textarea rows="2" maxlength="600" data-sf="desc">${esc(c.desc||'')}</textarea></label>
        ${D.type==='passive'?'':`<div class="f wide"><span class="fl">MP 소모 <small class="faint">고정 = LV1 기준 값(레벨에 따라 최대 MP와 같은 비율로 커짐) · 비율 = 그때 최대 MP의 %. 비율이 0보다 크면 비율을 씀</small></span>
          <div class="row" style="gap:10px"><label class="f"><span class="fl small">고정</span><input type="number" min="0" step="1" data-sf="mp" value="${c.mp??0}"></label><label class="f"><span class="fl small">최대 MP 비율 %</span><input type="number" min="0" max="100" step="0.5" data-sf="mpPct" value="${c.mpPct||0}"></label></div></div>`}
        ${D.mult!==undefined||D.type==='dice'?num('mult','대미지 배율 ×',c.mult??'',0.05,'비우면 ×1'):''}
        ${D.bonus!==undefined||D.type==='dice'?num('bonus','추가 대미지 · 힘 %',c.bonus??'',1):''}
        ${D.combo?num('combo',`연계 보너스 % · ${esc((skDef()[D.combo.from]||{}).name||D.combo.from)} 다음`,c.combo,1):''}
        ${D.drain!==undefined?num('drain','흡수 · 준 대미지 %',c.drain,1):''}
        ${D.reduce!==undefined?num('reduce','받는 대미지 감소 %',c.reduce,1):''}
        ${D.poison?num('poisonPct','중독 · 턴당 힘 %',c.poisonPct,1)+num('poisonTurns','중독 턴',c.poisonTurns,1):''}
        ${vk.map(x=>`<label class="f"><span class="fl">${esc((SK_V_LABEL[k]||{})[x]||x)}</span><input type="number" min="0" step="${x==='mul'?0.1:1}" data-sv="${x}" value="${c.v[x]??''}"></label>`).join('')}
        ${D.type==='dice'?`<label class="f cb"><input type="checkbox" data-sb="crit" ${c.crit?'checked':''}> 크리티컬 확률 2배</label>`:''}
        <label class="f cb"><input type="checkbox" data-sb="special" ${c.special?'checked':''}> '특수' 표시</label>
        <label class="f wide"><span class="fl">조건 문구 <small class="faint">한 줄에 하나 · 스킬 설명 아래 '조건'으로 나옴</small></span><textarea rows="2" data-sf="cond">${esc(c.cond||'')}</textarea></label>
        <div class="f wide"><span class="fl">화면 효과 칩 <small class="faint">스킬 목록·전투 화면의 작은 칩 · 숫자를 바꾸면 여기 글자도 맞춰 주세요</small></span>
          <div class="sk-fx">${(c.fx||[]).map((x,i)=>`<span class="sk-fxr"><select data-fxk="${i}">${SK_FXK.map(([v,l])=>`<option value="${v}" ${x[0]===v?'selected':''}>${l}</option>`).join('')}</select><input type="text" maxlength="40" data-fxt="${i}" value="${esc(x[1])}"><button type="button" class="pfx-x" data-sa="fx-del" data-i="${i}" aria-label="칩 빼기">×</button></span>`).join('')}
            <button type="button" class="btn btn-sm btn-g" data-sa="fx-add">+ 칩 더하기</button></div></div>
      </div>
      <div class="row sk-act"><button class="btn btn-sm btn-g" data-sa="undo" ${dirty?'':'hidden'}>되돌리기</button>${srv?'<button class="btn btn-sm btn-g" data-sa="reset">기본값으로</button>':''}<button class="btn btn-sm btn-primary" data-sa="pub" ${dirty?'':'disabled'}>스킬 공개</button></div>
    </div></details>`;}
function clsPage(id){const D=clsDef()[id];if(!D)return clsList();
  const nd=(D.skills||[]).filter(skDirty).length;
  return `<div class="cl-top"><button class="btn btn-sm btn-g" data-clback>‹ 클래스 목록</button>
      <h2>${esc(D.name)} <small class="faint">${esc(D.en||'')} · ${esc(id)}</small></h2>
      <span class="chip">${ROLE_KO[D.role]||''}</span><span class="chip dim">${D.base?`${esc((clsDef()[D.base]||{}).name)} 상위 클래스`:'1차 클래스'}</span><span class="chip dim">${D.magic?'마법 계열':'물리 계열'}</span></div>
    ${growthHTML(id)}
    <div class="panel"><div class="ph-row"><h3>스킬 <small class="faint">${(D.skills||[]).length}개</small></h3><span class="cl-hact"><button class="btn btn-sm btn-primary" data-skall ${nd?'':'disabled'}>바뀐 스킬 모두 공개${nd?` (${nd})`:''}</button></span></div>
      <p class="small muted" style="margin:0 0 10px">스킬 종류·대상(공격·회복·보조 등)은 전투 규칙이라 고정입니다. 숫자와 글자·아이콘을 바꿀 수 있고, 저장되는 건 게임 기본값과 다른 칸뿐입니다.</p>
      <div class="sk-list">${(D.skills||[]).map(k=>skCard(k,id)).join('')}</div></div>`;}

/* ── 공개 ── */
async function clsPublish(id){const data={};CLS_KEYS.forEach(k=>{const n=Number(clsCur(id)[k]);if(isFinite(n))data[k]=n;});
  if(!(data.hp>=1))return toast('최초 HP는 1 이상이어야 합니다.','bad');if(CLS_KEYS.some(k=>data[k]<0))return toast('음수는 넣을 수 없습니다.','bad');
  if(!await q(A.sb.from('content_drafts').upsert({kind:CLS_KIND,id,data})))return;
  if(!await q(A.sb.rpc('admin_publish',{p_kind:CLS_KIND,p_id:id})))return;
  delete CLS.edit[id];toast(`${(clsDef()[id]||{}).name||id} 성장을 공개했습니다. 접속 중인 블레서에게도 곧 적용됩니다.`,'good');await loadServerContent();clsDraw();}
async function skPublish(ks){let ok=0;
  for(const k of ks){const data=skPayload(k);
    if(data.name!==undefined&&!data.name.trim())return toast('스킬 이름은 비울 수 없습니다.','bad');
    if(!Object.keys(data).length){if(skSrv(k)&&!await q(A.sb.from('content').delete().match({kind:SK_KIND,id:k})))return;delete CLS.sk[k];ok++;continue;}
    if(!await q(A.sb.from('content_drafts').upsert({kind:SK_KIND,id:k,data})))return;
    if(!await q(A.sb.rpc('admin_publish',{p_kind:SK_KIND,p_id:k})))return;delete CLS.sk[k];ok++;}
  if(ok)toast(`스킬 ${ok}개를 공개했습니다. 접속 중인 블레서에게도 곧 적용됩니다.`,'good');await loadServerContent();clsDraw();}
async function skUpload(k,file,st){if(st)st.textContent='올리는 중…';
  try{if(!/^image\/(png|jpeg|webp|gif)$/.test(file.type))throw new Error('PNG·JPG·WEBP·GIF만 올릴 수 있습니다');
    monImgResize._pre='skill/';const blob=await monImgResize(file);const ext=blob.type==='image/gif'?'gif':'webp';
    const path=`skill/${k.replace(/[^a-zA-Z0-9_-]/g,'_')}/${Date.now().toString(36)}.${ext}`;
    const {error}=await A.sb.storage.from(MONART_BUCKET).upload(path,blob,{contentType:blob.type,upsert:false,cacheControl:'31536000'});if(error)throw error;
    const {data}=A.sb.storage.from(MONART_BUCKET).getPublicUrl(path);(CLS.sk[k]=CLS.sk[k]||{}).img=data.publicUrl;CLS.open.add(k);clsDraw();toast('아이콘을 올렸습니다. 스킬 공개를 누르면 게임에 나타납니다.','good');}
  catch(e){if(st)st.textContent='';if(e&&e.message==='cancel')return;toast('아이콘 올리기 실패 · '+((e&&e.message)||e),'bad');}}

/* ── 그리기 · 연결 ── */
function clsDraw(){const box=$('#cl-box');if(!box)return;const y=window.scrollY;
  box.querySelectorAll('details.sk-card').forEach(d=>{if(d.open)CLS.open.add(d.dataset.sk);else CLS.open.delete(d.dataset.sk);});
  box.innerHTML=CLS.sel&&clsDef()[CLS.sel]?clsPage(CLS.sel):clsList();clsBind();window.scrollTo(0,y);}
function growthRefresh(id){const box=$('#cl-box');const v=clsCur(id);
  $$('tr[data-gk]',box).forEach(tr=>{const k=tr.dataset.gk;$$('.cl-pvc',tr).forEach(td=>td.textContent=nfmt(clsAt(v,k,+td.dataset.lv)));});
  const d=clsDirty(id);const pub=$('[data-cg="pub"]',box),und=$('[data-cg="undo"]',box);if(pub)pub.disabled=!d;if(und)und.hidden=!d;}
function skRefresh(card,k){const d=skDirty(k);card.classList.toggle('dirty',d);const pub=card.querySelector('[data-sa="pub"]'),und=card.querySelector('[data-sa="undo"]');if(pub)pub.disabled=!d;if(und)und.hidden=!d;
  const id=CLS.sel;const all=$('[data-skall]');if(all&&id){const nd=((clsDef()[id]||{}).skills||[]).filter(skDirty).length;all.disabled=!nd;all.textContent='바뀐 스킬 모두 공개'+(nd?` (${nd})`:'');}}
function clsBind(){const box=$('#cl-box');if(!box)return;
  $$('[data-clopen]',box).forEach(b=>b.onclick=()=>{CLS.sel=b.dataset.clopen;CLS.open.clear();clsDraw();window.scrollTo(0,0);});
  const back=$('[data-clback]',box);if(back)back.onclick=()=>{CLS.sel=null;clsDraw();window.scrollTo(0,0);};
  const id=CLS.sel;if(!id)return;
  $$('.cl-in',box).forEach(el=>el.oninput=()=>{const n=el.value===''?undefined:Number(el.value);(CLS.edit[id]=CLS.edit[id]||{})[el.dataset.k]=isFinite(n)?n:undefined;growthRefresh(id);});
  $$('[data-cg]',box).forEach(b=>b.onclick=async()=>{const a=b.dataset.cg;
    if(a==='pub')return clsPublish(id);if(a==='undo'){delete CLS.edit[id];return clsDraw();}
    if(a==='reset'){if(!await ask('성장 기본값으로',`<b>${esc((clsDef()[id]||{}).name||id)}</b>의 서버 성장 값을 지우고 게임 기본값(또는 기본 클래스 값)으로 돌립니다.`))return;
      if(await q(A.sb.from('content').delete().match({kind:CLS_KIND,id}),'되돌렸습니다.')){delete CLS.edit[id];await loadServerContent();clsDraw();}}});
  const all=$('[data-skall]',box);if(all)all.onclick=()=>skPublish(((clsDef()[id]||{}).skills||[]).filter(skDirty));
  $$('details.sk-card',box).forEach(card=>{const k=card.dataset.sk;const E=()=>(CLS.sk[k]=CLS.sk[k]||{});
    card.addEventListener('toggle',()=>{if(card.open)CLS.open.add(k);else CLS.open.delete(k);});
    $$('[data-sf]',card).forEach(el=>el.oninput=()=>{const f=el.dataset.sf;E()[f]=el.type==='number'?(el.value===''?undefined:Number(el.value)):el.value;skRefresh(card,k);});
    $$('[data-sv]',card).forEach(el=>el.oninput=()=>{const e=E();e.v={...(skCur(k).v||{}),...(e.v||{}),[el.dataset.sv]:el.value===''?undefined:Number(el.value)};skRefresh(card,k);});
    $$('[data-sb]',card).forEach(el=>el.onchange=()=>{E()[el.dataset.sb]=el.checked;skRefresh(card,k);});
    const fxNow=()=>JSON.parse(JSON.stringify(skCur(k).fx||[]));
    $$('[data-fxk]',card).forEach(el=>el.onchange=()=>{const fx=fxNow();fx[+el.dataset.fxk][0]=el.value;E().fx=fx;skRefresh(card,k);});
    $$('[data-fxt]',card).forEach(el=>el.oninput=()=>{const fx=fxNow();fx[+el.dataset.fxt][1]=el.value;E().fx=fx;skRefresh(card,k);});
    const fi=card.querySelector('[data-skimg]');if(fi)fi.onchange=()=>{const f=fi.files&&fi.files[0];if(f)skUpload(k,f,card.querySelector('[data-skst]'));fi.value='';};
    $$('[data-sa]',card).forEach(b=>b.onclick=async e=>{e.preventDefault();const a=b.dataset.sa;CLS.open.add(k);
      if(a==='pub')return skPublish([k]);
      if(a==='undo'){delete CLS.sk[k];return clsDraw();}
      if(a==='img-clear'){E().img='';return clsDraw();}
      if(a==='fx-add'){const fx=fxNow();fx.push(['buff','']);E().fx=fx;return clsDraw();}
      if(a==='fx-del'){const fx=fxNow();fx.splice(+b.dataset.i,1);E().fx=fx;return clsDraw();}
      if(a==='reset'){if(!await ask('스킬 기본값으로',`<b>${esc(skCur(k).name||k)}</b>의 서버 값을 지우고 게임 기본값으로 돌립니다. 이 스킬을 쓰는 모든 클래스에 적용됩니다.`))return;
        if(await q(A.sb.from('content').delete().match({kind:SK_KIND,id:k}),'되돌렸습니다.')){delete CLS.sk[k];await loadServerContent();clsDraw();}}});});}
VIEWS.classes=async(el,opts)=>{
  el.innerHTML='<p class="muted">불러오는 중…</p>';
  await Promise.all([loadDefaults(),loadServerContent()]);
  if(opts&&opts.cls)CLS.sel=opts.cls;else if(opts&&opts.skill){const c=Object.keys(clsDef()).find(i=>(clsDef()[i].skills||[]).includes(opts.skill));if(c){CLS.sel=c;CLS.open.add(opts.skill);}}
  el.innerHTML=`<div id="cl-box"></div>`;clsDraw();};
