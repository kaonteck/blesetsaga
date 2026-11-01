'use strict';
/* 이벤트 처리 (ACTS · 클릭/폼) */
/* ───────── 이벤트 ───────── */
document.addEventListener('click',e=>{if(!S)return;
  if(S.sel.rmem&&!e.target.closest('#rmenu')&&!e.target.closest('[data-act="rmem"]')&&!e.target.closest('[data-act="uinfo"]')&&!e.target.closest('[data-act="r-who"]'))closeRmem();
  if(S.sel.pop&&!e.target.closest('#pop')&&!e.target.closest('[data-act="pop"]')&&!e.target.closest('#modal')){S.sel.pop=null;renderPop();renderTop();}
  if(e.target.closest('button,[role="button"],.opt,.choice'))playClick();
  const el=e.target.closest('[data-act]');if(!el)return;
  const a=el.dataset.act,d=el.dataset;
  if(a==='closemodal-bg'){if(e.target===el&&!S.match&&!(crop&&crop.justDragged&&now()-crop.justDragged<400)){crop=null;S.sel.titleModal=false;modal('');}return;}
  if(el.tagName==='SELECT')return;
  const act=ACTS[a];if(act){act(d,el,e);}
});
document.addEventListener('keydown',e=>{if(!S)return;if(e.key==='Enter'&&e.target.classList.contains('note-in')){e.preventDefault();e.target.blur();}if(e.key==='Escape'&&e.target.classList.contains('note-in')){e.stopPropagation();S.sel.noteEdit=null;showOnline();return;}if(e.key==='Enter'&&e.target.id==='me-memo'){e.preventDefault();e.target.blur();}if(e.key==='Enter'&&e.target.matches('.mcard')){e.target.click();}if(e.key==='Escape'&&S.sel.pop){S.sel.pop=null;renderPop();renderTop();return;}if(e.key==='Escape'&&!S.match){crop=null;S.sel.titleModal=false;modal('');}});
document.addEventListener('focusout',e=>{if(e.target&&e.target.id==='me-memo'){const el=e.target;const v=el.value.replace(/\s+/g,' ').trim().slice(0,40);if(v!==(S.me.memo||'')){S.me.memo=v;save();toast(v?'한줄메모를 저장했습니다.':'한줄메모를 지웠습니다.');}S.sel.memoEdit=false;setTimeout(()=>$$('.me-memo').forEach(x=>x.outerHTML=memoHTML()),0);}});
document.addEventListener('change',e=>{if(!S)return;
  const el=e.target;if(el.classList&&el.classList.contains('wsel')){S.sel.wcat=el.value;}
  if(el.classList&&el.classList.contains('csel')){const pn=el.closest('[data-chatpanel]');const t=(pn&&pn.dataset.lock)||S.sel.chatTab;if(t==='party')S.sel.partyCh=el.value;else S.sel.lobbyCh=el.value;updateChats();}
  if(el.classList&&el.classList.contains('mk-ed')&&isAdmin()){const x=market().find(y=>y.id===el.dataset.id);if(x){const f=el.dataset.f;const v=el.value.trim();x[f]=f==='stock'?(v===''?null:Math.max(0,Math.round(+v))):Math.max(f==='price'?1:0,Math.round(+v||0));save();toast('저장했습니다.');}}
  if(el.id==='m-sort'){S.sel.mailSort=el.value;renderPop();}
  if(el.dataset.actChange==='rodsel'){S.me.rodSel=el.value;save();render();}
  if(el.dataset.actChange==='whisperto'){S.sel.whisperTo=el.value;updateChats();save();}
  if(el.dataset.actChange==='cropfile'&&el.files&&el.files[0])cropFile(el.files[0]);
});
document.addEventListener('submit',e=>{if(!S)return;
  const f=e.target.closest('[data-form]');if(!f)return;e.preventDefault();
  const k=f.dataset.form;
  if(k==='create'){const name=$('#new-name').value.trim();
    if(name.length<2){toast('이름은 2자 이상이어야 합니다.','warn');return;}
    if(S.bots.some(b=>b.name===name)){toast('이미 쓰이는 이름입니다. 다른 이름을 입력하세요.','warn');return;}
    S.me={name,job:CLASSES[S.sel.newJob]&&CLASSES[S.sel.newJob].tier===1?S.sel.newJob:'defender',level:1,exp:0,gold:100,inv:{potion:2},equip:{},admin:SB_UID?SB_ADMIN:true,viewAsUser:false,createdAt:now()};
    S.chat.lobby.push({id:uid('m'),sys:true,text:`${name}님이 라니아케아에 도착했습니다.`,ts:now()});
    save();go('main');toast('탐사를 시작합니다. 퀘스트에서 첫 의뢰를 받아 보세요.','good');later(4000,()=>botSay('lobby','노아',`${name}님 환영해요!`));return;}
  if(k==='notice-edit'){if(!isAdmin())return;const t=$('#ne-title').value.trim(),x=$('#ne-text').value.trim(),cat=$('#ne-cat').value;if(!t){toast('제목을 입력하세요.','warn');return;}
    const id=f.dataset.id;const d=new Date(now()+9*3600e3).toISOString();
    if(id){const n=S.data.notices.find(z=>z.id===id);if(!n)return;const ch=diff({cat:n.cat,title:n.title,text:n.text},{cat,title:t,text:x});n.cat=cat;n.title=t;n.text=x;if(ch.length){n.updatedAt=now();logChange('공지 · '+t,ch);}modal('');save();refreshNotices();noticeView(n);toast('공지를 수정했습니다.','good');}
    else{const n={id:uid('n'),cat,date:d.slice(5,7)+'.'+d.slice(8,10),title:t,text:x};S.data.notices.unshift(n);S.sel.npage=0;S.me.noticeSeen=[...(S.me.noticeSeen||[]),n.id];logChange('공지',[{field:'추가',before:undefined,after:t}]);modal('');save();refreshNotices();toast('공지를 게시했습니다.','good');}
    return;}
  if(k==='tk-ev'){if(!isAdmin())return;const title=$('#tk-title').value.trim();if(!title){toast('이름을 입력하세요.','warn');return;}const mins=Math.min(1440,Math.max(1,Math.round(+$('#tk-min').value||30)));
    const e={id:uid('ev'),kind:$('#tk-kind').value,title,loc:$('#tk-loc').value.trim(),reward:$('#tk-reward').value.trim(),link:$('#tk-link').value,until:now()+mins*60000,by:S.me.name};
    (S.events=S.events||[]).push(e);logChange('전광판',[{field:EVKIND[e.kind],before:undefined,after:title}]);save();render();toast('전광판에 이벤트를 띄웠습니다.','good');return;}
  if(k==='rename'){const v=$('#rn-name').value.replace(/\s+/g,'').trim();const old=S.me.name;
    if(v.length<2||v.length>10){toast('이름은 2~10자로 입력하세요.','warn');return;}
    if(v!==old&&S.bots.some(b=>b.name===v)){toast('이미 쓰이는 이름입니다. 다른 이름을 입력하세요.','warn');return;}
    if(v!==old){S.me.name=v;[S.chat.lobby,...Object.values((S.dm&&S.dm.threads)||{}).map(t=>t.msgs)].forEach(L=>(L||[]).forEach(m=>{if(m.from===old)m.from=v;}));(S.inquiries||[]).forEach(q=>{if(q.by===old)q.by=v;});logChange('이름 변경',[{field:'캐릭터',before:old,after:v}]);toast(`이름을 ${v}(으)로 바꿨습니다.`,'good');}
    S.sel.nameEdit=false;save();render();return;}
  if(k==='mk-add'){if(!isAdmin())return;const item=$('#mk-item').value,price=Math.round(+$('#mk-price').value),st=$('#mk-stock').value.trim();
    if(!(price>=1)){toast('가격을 확인하세요.','warn');return;}const ex=market().find(x=>x.item===item);
    if(ex){Object.assign(ex,{price,stock:st===''?null:Math.max(0,Math.round(+st))});}else market().push({id:uid('mk'),item,price,stock:st===''?null:Math.max(0,Math.round(+st))});
    logChange('거래소',[{field:ITEMS[item].name,before:ex?'수정':undefined,after:`${price}`}]);save();render();toast('거래소에 등록했습니다.','good');return;}
  if(k==='bond-dday'){const b=bondOf(f.dataset.name);const v=$('#dd-in').value;if(b){if(v)b.dday=v;else delete b.dday;}S.sel.ddEdit=null;save();render();return;}
  if(k==='fd-post'){const t=($('#fd-text').value||'').trim();if(!t){toast('내용을 적어 주세요.','warn');return;}const p={id:uid('fd'),author:S.me.name,text:t.slice(0,300),ts:now(),likes:[],comments:[]};feed().unshift(p);S.feed=S.feed.slice(0,60);S.sel.fdDraft='';S.sel.emoFor=null;bump('posts');save();render();toast('글을 게시했습니다.','good');fdBotReact(p);return;}
  if(k==='fd-comment'){const p=fdFind('p',f.dataset.post);const i=$('#fdc-'+f.dataset.post);const t=(i&&i.value||'').trim();if(!p||!t)return;p.comments.push({id:uid('fc'),author:S.me.name,text:t.slice(0,150),ts:now(),likes:[],replies:[]});S.sel.fdOpen=S.sel.fdOpen||{};S.sel.fdOpen[p.id]=true;S.sel.emoFor=null;save();render();return;}
  if(k==='fd-reply'){const c=fdFind('c',f.dataset.cid);const i=$('#fdi-'+f.dataset.cid);const t=(i&&i.value||'').trim();if(!c||!t)return;c.replies=c.replies||[];c.replies.push({id:uid('fr'),author:S.me.name,text:t.slice(0,150),ts:now(),likes:[]});S.sel.fdReply=null;S.sel.emoFor=null;save();render();
    if(c.author!==S.me.name&&bot(c.author))later(rnd(4000,10000),()=>{c.replies.push({id:uid('fr'),author:c.author,text:pick(['ㅋㅋㅋ 그러게요','감사합니다 😊','맞아요 맞아요!','오 그건 몰랐네요 🤔','다음에 같이 해요 👍']),ts:now(),likes:[]});save();if(S.route==='community')render();notify(`${c.author}님이 답글을 남겼습니다.`);});return;}
  if(k==='bond-memo'){const n=f.dataset.name;const b=bondOf(n);if(b){b.memo=$('#bm-in').value.replace(/\s+/g,' ').trim().slice(0,20);}S.sel.bondMemo=null;save();render();return;}
  if(k==='ai-save'){if(!isAdmin())return;const id=f.dataset.id;const before=clone(ITEMS[id]);const name=$('#ai-name').value.trim();if(!name){toast('이름을 입력하세요.','warn');return;}
    const type=$('#ai-type').value;const it={...ITEMS[id],name,type,desc:$('#ai-desc').value.trim()};const num=x=>{const v=$(x).value.trim();return v===''?null:Number(v);};
    it.price=num('#ai-price')||undefined;if(type==='equip'){it.slot=$('#ai-slot').value;const st={};['maxHp','atk','def','luk'].forEach(k=>{const v=num('#ai-st-'+k);if(v)st[k]=v;});it.stats=st;delete it.buff;delete it.target;}
    else if(type==='mat'){delete it.slot;delete it.stats;delete it.buff;delete it.target;}
    else{delete it.slot;delete it.stats;const bs=$('#ai-bstat').value,bv=num('#ai-bval'),bm=num('#ai-bmin');it.buff=bs&&bv?{stat:bs,val:bv,min:bm||10}:undefined;if(!it.buff)delete it.buff;}
    const lv=num('#ai-lv'),mx=num('#ai-max');if(lv&&(lv<1||lv>99)){toast('레벨 제한은 1~99입니다.','warn');return;}if(mx!=null&&mx<1){toast('수량 제한은 1 이상입니다.','warn');return;}
    if(lv)it.levelReq=lv;else delete it.levelReq;if(mx)it.maxOwn=mx;else delete it.maxOwn;const cls=$$('.ai-cls').filter(x=>x.checked).map(x=>x.value);if(cls.length)it.classReq=cls;else delete it.classReq;
    if(type==='equip'){Object.entries(S.me.equip).forEach(([sl,e])=>{if(e===id&&sl!==it.slot)delete S.me.equip[sl];});}
    ITEMS[id]=it;S.data.items=S.data.items||{};S.data.items[id]=it;logChange('아이템 · '+name,diff(before,it).map(c=>({...c,before:short(c.before),after:short(c.after)})));save();render();toast('아이템 설정을 저장했습니다.','good');return;}
  if(k==='ask'){const t=$('#ask-text').value.trim();if(t.length<5){toast('문의 내용을 5자 이상 적어 주세요.','warn');return;}
    (S.inquiries=S.inquiries||[]).push({id:uid('q'),by:S.me.name,cat:$('#ask-cat').value,text:t.slice(0,500),ts:now(),answer:null});save();renderPop();toast('1:1 문의를 보냈습니다. 답변은 우편함으로도 전달됩니다.','good');return;}
  if(k==='chat'){const p=f.closest('[data-chatpanel]');const tab=p.dataset.lock||S.sel.chatTab;const inp=f.querySelector('input');if(sendChat(tab,inp.value)!==false)inp.value='';return;}
  if(k==='banner'){const before=clone(S.data.banner);const fd=new FormData(f);const nb={};for(const [kk,v] of fd)nb[kk]=String(v).trim();
    if(!nb.title){toast('배너 제목을 입력하세요.','warn');return;}S.data.banner=nb;logChange('배너',diff(before,nb));save();toast('배너를 공개했습니다.','good');render();return;}
  if(k==='notice'){const t=$('#nt-title').value.trim(),x=$('#nt-text').value.trim();if(!t)return;const d=new Date(now()+9*3600e3).toISOString();
    S.data.notices.unshift({id:uid('n'),cat:'notice',date:d.slice(5,7)+'.'+d.slice(8,10),title:t,text:x});logChange('공지',[{field:'추가',before:undefined,after:t}]);save();toast('공지를 게시했습니다.','good');render();return;}
  if(k==='config'){const fd=new FormData(f);const c={};for(const [kk,v] of fd)c[kk]=Number(v);
    const errs=[];if(!(c.levelCap>=2&&c.levelCap<=99))errs.push('레벨 상한은 2~99');if(!(c.expQuad>=0))errs.push('가속 계수는 0 이상');if(!(c.expBase>=1))errs.push('경험치 기본값은 1 이상');if(!(c.expStep>=0))errs.push('증가량은 0 이상');if(!(c.turnSeconds>=10&&c.turnSeconds<=180))errs.push('턴 제한은 10~180초');if(!(c.acceptSeconds>=10&&c.acceptSeconds<=120))errs.push('수락 시간은 10~120초');if(!(c.jobAdvanceLevel>=2&&c.jobAdvanceLevel<=c.levelCap))errs.push('전직 레벨은 2~레벨 상한');
    if(errs.length){toast('저장하지 못했습니다: '+errs.join(', '),'bad');return;}
    logChange('성장 · 전투 규칙',diff(cfg(),c));S.data.config=c;if(S.me.level>c.levelCap)S.me.level=c.levelCap;save();toast('규칙을 저장했습니다. 새 전투부터 적용됩니다.','good');render();return;}
});
const ACTS={
  rmem:(d,el)=>openRmem(d.id,el),
  uinfo:(d,el)=>openUinfo(d.name,el),
  'u-view':d=>{closeRmem();modal('');if(S.me&&d.name===S.me.name){go('character',{ctab:'info'});return;}S.sel.viewBack=S.route==='profile'?(S.sel.viewBack||'main'):S.route;S.sel.viewUser=d.name;go('profile');scrollTo({top:0});},
  'r-who':(d,el)=>openRaidWho(d.name,el),
  'g-subtab':d=>{S.sel.gsub=d.tab;renderFight();},
  'g-revive':d=>{const b=S.battle;if(!b||!b.grid)return;const me=b.players.find(p=>p.isMe);if(me.dead||me.confirmed||!CLASSES[me.job].skills.includes('sinsayer'))return;S.sel.gmode='fight';S.sel.actTab='skill';S.sel.act={kind:'skill',skill:'sinsayer',target:d.id};renderFight();toast('스킬 탭에 신세이어를 골라 두었습니다. 행동 확정을 눌러야 사용됩니다.');},
  'tk-end':d=>{S.events=(S.events||[]).filter(e=>e.id!==d.id);save();render();toast('이벤트를 내렸습니다.');},
  titles:()=>{S.sel.titleTab=S.sel.titleTab||'normal';showTitles();},
  'titles-close':()=>{S.sel.titleModal=false;modal('');},
  'title-own':()=>{S.sel.titleOwnedOnly=!S.sel.titleOwnedOnly;save();showTitles();},
  'title-tab':d=>{S.sel.titleTab=d.tab;showTitles();},
  'title-equip':d=>{S.titles.equip=d.id||null;save();showTitles();const c=$('[data-title-chip]');if(c)c.outerHTML=titleChip();toast(d.id?`${titleById(d.id).name} 칭호를 장착했습니다.`:'칭호를 해제했습니다.');},
  'note-edit':d=>{S.sel.noteEdit=d.name;showOnline();const i=document.querySelector('.note-in');if(i){i.focus();i.select();}},
  'rn-start':()=>{if(busyReason()){toast(busyReason()+' · 끝난 뒤 이름을 바꿀 수 있습니다.','warn');return;}S.sel.nameEdit=true;render();const i=$('#rn-name');if(i){i.focus();i.select();}},
  'rn-cancel':()=>{S.sel.nameEdit=false;render();},
  'adv-open':()=>{const c=CLASSES[S.me.job];if(c.tier===1){const id='J_'+S.me.job;const q=quest(id);if(q){if(questStatus(q)==='available'){S.qp[id]={status:'active',step:q.start,history:[],pending:null,cycle:kstCycle(),flagsSet:[]};save();toast(`퀘스트 수락 · ${q.title}`);}go('quest',{quest:id,qtab:q.cat});return;}}S.sel.advPick=null;modal(`<div class="row" style="justify-content:space-between"><h3>전직</h3><button class="btn btn-sm btn-ghost" data-act="closemodal">닫기</button></div>${advPanel()}`);const mm=$('.modal');if(mm)mm.classList.add('wide');},
  'jc-pick':d=>jobTicketUse(d.job),
  'adv-go':()=>{modal('');ACTS['adv-open']();},
  'bless-pick':d=>{const b=S.battle;if(!b||!b.bless||b.bless.pick||!b.bless.me)return;S.sel.blessOpen=+d.i;applyBless(b,b.bless.cards[+d.i]);save();render();showBless(true);},
  'inv-use':d=>{const it=ITEMS[d.id];if(it&&it.jobChange){if(!(S.me.inv[d.id]>0))return;modal(jobTicketDlg());const mm=$('.modal');if(mm)mm.classList.add('wide');return;}if(it&&it.readText){modal(`<div class="letter"><div class="lt-paper"><small>${esc(it.name)}</small><p style="white-space:pre-line">${esc(it.readText)}</p></div><div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn btn-sm" data-act="closemodal">닫기</button></div></div>`);return;}if(it&&it.letter){if(!(S.me.inv[d.id]>0))return;S.me.inv[d.id]--;if(!(S.me.inv[d.id]>0))S.sel.invSel=null;save();render();modal(`<div class="letter"><div class="lt-paper"><small>병 속의 편지</small><p>${esc(pick(BOTTLE_LINES))}</p></div><p class="faint" style="font-size:12px;text-align:center">편지를 읽자 종이가 바스러져 바람에 흩어졌다.</p><div class="row" style="justify-content:center"><button class="btn btn-sm" data-act="closemodal">닫기</button></div></div>`);const mm=$('.modal');if(mm)mm.classList.add('narrow2');setTimeout(()=>{const p=$('.lt-paper');if(p)p.classList.add('fade');},4500);setTimeout(()=>{if($('.lt-paper'))modal('');},6000);return;}if(!it||!it.buff||!(S.me.inv[d.id]>0))return;{const bl=itemBlock(d.id);if(bl){toast(bl,'warn');return;}}S.me.inv[d.id]--;const b=it.buff;S.me.itemBuffs=(S.me.itemBuffs||[]).filter(x=>x.until>now()&&x.src!==d.id);
    S.me.itemBuffs.push({src:d.id,stat:b.stat,val:b.val,until:now()+b.min*60000});if(it.buff2)S.me.itemBuffs.push({src:d.id,stat:it.buff2.stat,val:it.buff2.val,until:now()+it.buff2.min*60000});if(!(S.me.inv[d.id]>0))S.sel.invSel=null;save();render();toast(`${it.name} 사용 · ${b.min}분 동안 ${STATK[b.stat]} +${b.val}${it.buff2?` · ${STATK[it.buff2.stat]} +${it.buff2.val}`:''}`,'good');},
  'sk-sel':d=>{S.sel.skSel=S.sel.skSel===d.id?null:d.id;render();},
  'inv-cat':d=>{S.sel.invCat=d.cat;S.sel.invSel=null;render();},
  'inv-sel':d=>{S.sel.invSel=S.sel.invSel===d.id?null:(d.id||null);render();},
  togglerec:()=>{S.sel.recOpen=!S.sel.recOpen;save();render();},
  'bond-open':d=>{closeRmem();bondAsk(d.name);},
  'bond-send':d=>{S.bondReq=S.bondReq||{in:{},out:{}};S.bondReq.out=S.bondReq.out||{};if(d.type==='lover'&&(Object.entries(S.bonds||{}).some(([n,b])=>b.type==='lover'&&n!==d.name)||Object.entries(S.bondReq.out).some(([n,r])=>r.type==='lover'&&n!==d.name))){toast('연인은 한 사람과만 맺을 수 있습니다. 이미 연인이 있거나 다른 사람에게 연인 신청을 보낸 상태입니다.','warn');return;}
    S.bondReq.out[d.name]={type:d.type,at:now()};save();modal('');toast(`${d.name}님에게 ${BOND[d.type].n} 관계를 신청했습니다.`);const b=bot(d.name);const go=()=>bondResolve(d.name,Math.random()<0.75);if(b&&b.online)later(rnd(3000,8000),go);if(S.route==='character')render();},
  'bond-cancel':d=>{if(S.bondReq&&S.bondReq.out)delete S.bondReq.out[d.name];save();render();},
  'bond-accept':d=>{const r=S.bondReq.in[d.name];if(!r)return;if(r.type==='lover'&&Object.entries(S.bonds||{}).some(([n,b])=>b.type==='lover'&&n!==d.name)){toast('이미 연인이 있어 연인 관계를 수락할 수 없습니다.','warn');return;}S.bonds=S.bonds||{};S.bonds[d.name]={type:r.type,since:now()};delete S.bondReq.in[d.name];save();render();toast(`${d.name}님과 ${BOND[r.type].n} 관계를 맺었습니다.`,'good');},
  'bond-decline':d=>{delete S.bondReq.in[d.name];save();render();},
  'bond-endask':d=>{const b=bondOf(d.name);if(!b)return;modal(`<div class="sysdlg" role="alertdialog"><div class="row" style="gap:8px"><span class="sys-ic" aria-hidden="true">!</span><h3>시스템 안내</h3></div><p>${esc(d.name)}님과의 ${BOND[b.type].n} 관계를 해제합니다. 상대에게도 함께 해제됩니다.</p><div class="row" style="justify-content:flex-end"><button class="btn btn-ghost" data-act="closemodal">취소</button><button class="btn btn-danger" data-act="bond-end" data-name="${esc(d.name)}">해제</button></div></div>`);const mm=$('.modal');if(mm)mm.classList.add('narrow');},
  'bond-memo':d=>{S.sel.bondMemo=d.name;render();const i=$('#bm-in');if(i){i.focus();i.select();}},
  'dd-edit':d=>{S.sel.ddEdit=d.name;render();const i=$('#dd-in');if(i)i.focus();},
  'dd-clear':d=>{const b=bondOf(d.name);if(b)delete b.dday;S.sel.ddEdit=null;save();render();},
  'bond-tab':d=>{S.sel.btab=d.tab;S.sel.bpage=0;save();render();},
  'bond-page':d=>{S.sel.bpage=+d.p;render();},
  'bond-end':d=>{delete (S.bonds||{})[d.name];modal('');save();render();toast('관계를 해제했습니다.');},
  'eq-toggle':d=>{S.sel.eqOpen=S.sel.eqOpen===d.slot?null:d.slot;render();},
  'ai-pick':d=>{S.sel.ai=d.id;render();},
  'ai-off':d=>{const it=ITEMS[d.id];if(!it)return;it.off=!it.off;S.data.items=S.data.items||{};S.data.items[d.id]=it;logChange('아이템 · '+it.name,[{field:'상점 노출',before:it.off?'ON':'OFF',after:it.off?'OFF':'ON'}]);save();render();toast(it.off?'거래소에서 숨겼습니다. 아이템 데이터는 그대로입니다.':'거래소에 다시 보이게 했습니다.');},
  'ai-delask':d=>{const it=ITEMS[d.id];if(!it)return;modal(`<div class="sysdlg" role="alertdialog"><div class="row" style="gap:8px"><span class="sys-ic" aria-hidden="true">!</span><h3>시스템 안내</h3></div><p>「${esc(it.name)}」 아이템을 삭제합니다. 삭제한 아이템은 되돌릴 수 없습니다.</p><p class="faint" style="font-size:12.5px">유저 인벤토리·장착, 거래소 등록, 몬스터 보상 목록에서도 함께 사라집니다. 데이터를 남기고 상점에서만 숨기려면 '상점 노출'을 OFF로 바꾸세요.</p><div class="row" style="justify-content:flex-end"><button class="btn btn-ghost" data-act="closemodal">취소</button><button class="btn btn-danger" data-act="ai-del" data-id="${d.id}">삭제</button></div></div>`);const mm=$('.modal');if(mm)mm.classList.add('narrow');},
  'ai-del':d=>{const id=d.id,it=ITEMS[id];if(!it)return;delete ITEMS[id];S.data.items=S.data.items||{};delete S.data.items[id];S.data.itemsDeleted=[...new Set([...(S.data.itemsDeleted||[]),id])];
    delete S.me.inv[id];Object.keys(S.me.equip||{}).forEach(sl=>{if(S.me.equip[sl]===id)delete S.me.equip[sl];});if(S.me.enh)delete S.me.enh[id];
    S.data.market=market().filter(x=>x.item!==id);S.data.monsters.forEach(m=>{m.drops=m.drops.filter(([k])=>k!==id);});
    logChange('아이템',[{field:'삭제',before:it.name,after:undefined}]);S.sel.ai=null;modal('');save();render();toast('아이템을 삭제했습니다.');},
  'ai-new':()=>{const id='it'+Date.now().toString(36);const it={name:'새 아이템',type:'equip',slot:'weapon',stats:{atk:1},desc:'설명을 입력하세요.'};ITEMS[id]=it;S.data.items=S.data.items||{};S.data.items[id]=it;S.sel.ai=id;logChange('아이템',[{field:'추가',before:undefined,after:id}]);save();render();},
  'ai-reset':d=>{if(!ITEM_DEFAULTS[d.id])return;ITEMS[d.id]=clone(ITEM_DEFAULTS[d.id]);delete S.data.items[d.id];save();render();toast('기본값으로 되돌렸습니다.');},
  'enh-open':d=>{if(!ITEMS[d.id]||ITEMS[d.id].type!=='equip')return;openEnh(d.id);},
  'enh-close':()=>{modal('');render();},
  'enh-do':d=>{const id=d.id;const lv=enhOf(id);if(lv>=ENH_MAX)return;const nx=lv+1,cost=enhCost(nx);if(S.me.gold<cost){toast('골드가 부족합니다.','warn');return;}
    S.me.gold-=cost;bump('goldSpent',cost);bump('enhTries');S.me.enh=S.me.enh||{};const ok=Math.random()>=Math.min(1,(ENH_FAIL[nx]||0)+(guildRain('craft')?RAIN_FAIL:0));
    if(ok){S.me.enh[id]=nx;bump('enhOk');if(nx===ENH_MAX)notify(`${ITEMS[id].name} +${ENH_MAX} 강화 달성!`,'good');}
    save();openEnh(id,ok?'ok':'fail');},
  'mk-tab':d=>{S.sel.mkTab=d.tab;render();},
  'mk-buy':d=>{const x=market().find(y=>y.id===d.id);if(!x||!ITEMS[x.item]||ITEMS[x.item].off)return;if(x.stock===0){toast('품절되었습니다.','warn');return;}if(S.me.gold<x.price){toast('골드가 부족합니다.','warn');return;}
    if(ITEMS[x.item].maxOwn&&(S.me.inv[x.item]||0)>=ITEMS[x.item].maxOwn){toast(`${ITEMS[x.item].name}은(는) 1인 최대 ${ITEMS[x.item].maxOwn}개까지 가질 수 있습니다.`,'warn');return;}S.me.gold-=x.price;if(x.stock!=null)x.stock--;addItem(x.item,1);bump('goldSpent',x.price);bump('purchases');noteItems({[x.item]:1});
    (S.trades=S.trades||[]).unshift({ts:now(),kind:'buy',item:x.item,gold:-x.price});save();render();toast(`${ITEMS[x.item].name} 구매 · ${x.price}골드`,'good');},
  'mk-sell':d=>{const k=d.id;if(isQuestItem(k)){toast('퀘스트 아이템은 팔 수 없습니다.','warn');return;}if(availItem(k)<1){toast('팔 수 있는 수량이 없습니다.','warn');return;}const g=sellPrice(k);S.me.inv[k]--;if(!(S.me.inv[k]>0)&&S.me.enh)delete S.me.enh[k];
    S.me.gold+=g;bump('goldEarned',g);(S.trades=S.trades||[]).unshift({ts:now(),kind:'sell',item:k,gold:g});save();render();toast(`${ITEMS[k].name} 판매 · +${g}골드`,'good');},
  'mk-del':d=>{S.data.market=market().filter(x=>x.id!==d.id);logChange('거래소',[{field:'내림',before:d.id,after:undefined}]);save();render();},
  'n-open':d=>{const n=S.data.notices.find(x=>x.id===d.id);if(n)noticeView(n);},
  'n-page':d=>{S.sel.npage=+d.p;refreshNotices();},
  'n-new':()=>{if(isAdmin())noticeEdit(null);},
  'n-edit':d=>{if(!isAdmin())return;const n=S.data.notices.find(x=>x.id===d.id);if(n)noticeEdit(n);},
  'n-delask':d=>{if(!isAdmin())return;const n=S.data.notices.find(x=>x.id===d.id);if(!n)return;
    modal(`<div class="sysdlg" role="alertdialog"><div class="row" style="gap:8px"><span class="sys-ic" aria-hidden="true">!</span><h3>시스템 안내</h3></div><p>삭제한 공지는 되돌릴 수 없습니다.</p><p class="faint" style="font-size:12.5px">「${esc(n.title)}」 공지를 삭제할까요?</p><div class="row" style="justify-content:flex-end"><button class="btn btn-ghost" data-act="closemodal">취소</button><button class="btn btn-danger" data-act="n-del" data-id="${n.id}">삭제</button></div></div>`);const mm=$('.modal');if(mm)mm.classList.add('narrow');},
  'n-del':d=>{const n=S.data.notices.find(x=>x.id===d.id);S.data.notices=S.data.notices.filter(x=>x.id!==d.id);if(n)logChange('공지',[{field:'삭제',before:n.title,after:undefined}]);modal('');save();refreshNotices();toast('공지를 삭제했습니다.');},
  'u-gift':d=>{closeRmem();modal('');S.sel.pop='mail';S.sel.mc={to:d.name,text:'',items:{},gift:true};S.sel.mailView='compose';renderPop();renderTop();},
  'u-mail':d=>{closeRmem();modal('');S.sel.pop='mail';S.sel.mc={to:d.name,text:'',items:{},gift:false};S.sel.mailView='compose';renderPop();renderTop();const t=$('#mc-text');if(t)t.focus();},
  pop:d=>{S.sel.pop=S.sel.pop===d.pop?null:d.pop;if(d.pop==='mail'&&S.sel.pop){S.sel.mailView=null;S.sel.mpick=false;S.sel.msel=[];}if(d.pop==='settings')S.sel.confirmDel=false;if(d.pop==='notice'&&S.sel.pop){const seen=noticeSeenSet();S.sel.noticeNew=S.data.notices.filter(n=>!seen.has(n.id)).map(n=>n.id);S.sel.npage=0;noticeMarkSeen();}renderPop();renderTop();},
  'mail-tab':d=>{S.sel.mailTab=d.tab;S.sel.msel=[];renderPop();},
  'mail-open':d=>{const m=S.mail.find(x=>x.id===d.id);if(!m)return;m.read=true;S.sel.mailView=m.id;save();renderPop();renderTop();},
  'mail-back':()=>{S.sel.mailView=null;renderPop();},
  'mail-compose':()=>{S.sel.mc={to:'',text:'',items:{},gift:false};S.sel.mailView='compose';renderPop();},
  'mail-reply':d=>{S.sel.mc={to:d.to,text:'',items:{},gift:false};S.sel.mailView='compose';renderPop();const t=$('#mc-text');if(t)t.focus();},
  'mail-claim':d=>{const m=S.mail.find(x=>x.id===d.id);if(!m||m.claimed||!hasItems(m))return;m.claimed=true;for(const k in m.items)if(ITEMS[k]&&ITEMS[k].type==='deco')noteDeco(k,{t:'gift',v:m.from});for(const k in m.items){if(k==='_gold'){S.me.gold+=m.items[k];bump('goldEarned',m.items[k]);continue;}addItem(k,m.items[k]);}{const it={...m.items};delete it._gold;noteItems(it);}
    S.rewardLog.unshift({ts:now(),source:'mail',label:`${m.from}의 선물`,exp:0,gold:0,items:{...m.items}});save();renderPop();toast(`선물을 받았습니다 · ${itemsText(m.items)}`,'good');},
  'mail-archive':d=>{const m=S.mail.find(x=>x.id===d.id);if(!m)return;if(!m.archived&&S.mail.filter(x=>x.archived).length>=10){toast('보관함은 최대 10개까지입니다. 보관한 메시지를 먼저 정리하세요.','warn');return;}
    m.archived=!m.archived;m.archivedAt=m.archived?now():null;S.sel.mailView=null;S.sel.mailTab=m.archived?'archive':'all';save();renderPop();toast(m.archived?'보관함으로 옮겼습니다.':'보관을 해제했습니다.');},
  'm-pickon':()=>{S.sel.mpick=true;S.sel.msel=[];renderPop();},
  'm-pickoff':()=>{S.sel.mpick=false;S.sel.msel=[];renderPop();},
  'm-toggle':d=>{const a=new Set(S.sel.msel||[]);a.has(d.id)?a.delete(d.id):a.add(d.id);S.sel.msel=[...a];renderPop();},
  'm-sel':(d,el)=>{const a=new Set(S.sel.msel||[]);el.checked?a.add(d.id):a.delete(d.id);S.sel.msel=[...a];renderPop();},
  'm-selall':(d,el)=>{const ids=mailList(S.sel.mailTab||'all').map(x=>x.id);const a=new Set(S.sel.msel||[]);ids.forEach(id=>el.checked?a.add(id):a.delete(id));S.sel.msel=[...a];renderPop();},
  'm-readall':()=>{const n=(S.mail||[]).filter(m=>!m.read).length;if(!n){toast('읽지 않은 메시지가 없습니다.');return;}S.mail.forEach(m=>m.read=true);save();renderPop();renderTop();toast(`메시지 ${n}개를 모두 읽음으로 표시했습니다.`);},
  'm-delask':d=>{const ids=d.id?[d.id]:(S.sel.msel||[]);if(!ids.length){toast('삭제할 메시지를 먼저 선택하세요.','warn');return;}
    const gifts=S.mail.filter(m=>ids.includes(m.id)&&hasItems(m)&&!m.claimed).length;
    modal(`<div class="sysdlg" role="alertdialog" aria-labelledby="sys-t"><div class="row" style="gap:8px"><span class="sys-ic" aria-hidden="true">!</span><h3 id="sys-t">시스템 안내</h3></div>
      <p>삭제한 메시지는 되돌릴 수 없습니다.</p>${gifts?`<p class="reason" style="font-size:13px">받지 않은 선물이 있는 메시지 ${gifts}개가 포함되어 있습니다. 선물도 함께 사라집니다.</p>`:''}
      <p class="faint" style="font-size:12.5px">선택한 메시지 ${ids.length}개를 삭제할까요?</p>
      <div class="row" style="justify-content:flex-end"><button class="btn btn-ghost" data-act="closemodal">취소</button><button class="btn btn-danger" data-act="m-del" data-ids="${ids.join(',')}">삭제</button></div></div>`);
    const mm=$('.modal');if(mm)mm.classList.add('narrow');},
  'm-del':d=>{const ids=d.ids.split(',');S.mail=S.mail.filter(m=>!ids.includes(m.id));S.sel.msel=[];S.sel.mpick=false;if(ids.includes(S.sel.mailView))S.sel.mailView=null;modal('');save();renderPop();renderTop();toast(`메시지 ${ids.length}개를 삭제했습니다.`);},
  'mc-gift':()=>{const c=readCompose();c.gift=!c.gift;if(!c.gift)c.items={};renderPop();},
  'mc-add':()=>{const c=readCompose();const k=($('#mc-item')||{}).value;const q=Math.floor(+(($('#mc-qty')||{}).value||1));if(!k||!ITEMS[k])return;if(ITEMS[k].type==='equip'){toast('장비는 우편으로 보낼 수 없습니다.','warn');return;}if(ITEMS[k].type==='equip'){toast('장비는 우편으로 보낼 수 없습니다.','warn');return;}
    if(Object.keys(c.items).length>=3){toast('선물은 3종류까지 첨부할 수 있습니다.','warn');return;}
    if(!(q>=1)||q>availItem(k)){toast(`보낼 수 있는 수량은 ${availItem(k)}개입니다.`,'warn');return;}c.items[k]=q;renderPop();},
  'mc-rm':d=>{const c=readCompose();delete c.items[d.k];renderPop();},
  'mc-send':()=>{const c=readCompose();if(!c.gift)c.items={};const text=c.text.replace(/\s+/g,' ').trim();
    if(!c.to||!bot(c.to)){toast('받는 사람을 선택하세요.','warn');return;}
    if(S.rel[c.to]==='blocked'){toast('차단한 사람에게는 보낼 수 없습니다.','warn');return;}
    if(!text&&!Object.keys(c.items).length){toast('내용을 쓰거나 선물을 첨부하세요.','warn');return;}
    if(text.length>200){toast('메시지는 200자까지 쓸 수 있습니다.','warn');return;}
    for(const [k,n] of Object.entries(c.items))if(ITEMS[k].type==='equip'){toast('장비는 우편으로 보낼 수 없습니다.','warn');return;}
    for(const [k,n] of Object.entries(c.items))if(availItem(k)<n){toast(`${ITEMS[k].name} 수량이 부족합니다.`,'warn');return;}
    for(const [k,n] of Object.entries(c.items))S.me.inv[k]-=n;
    (S.sentMail=S.sentMail||[]).push({to:c.to,text,items:{...c.items},ts:now()});
    const to=c.to,gave=Object.keys(c.items).length>0;bump('lettersSent');if(gave)bump('giftsSent');S.sel.mc=null;S.sel.mailView=null;save();renderPop();toast(`${to}님에게 ${gave?'선물을':'편지를'} 보냈습니다.`,'good');
    if(gave||Math.random()<0.6)later(rnd(5000,11000),()=>{if(!S.me||S.rel[to]==='blocked')return;deliverMail(to,gave?pick(['선물 고마워요! 잘 쓸게요.','와, 이거 필요했는데 고마워요!','덕분에 수호자 공략 준비가 끝났어요.']):pick(['편지 잘 받았어요. 다음에 같이 파티 가요!','안부 고마워요 :)','오늘 일일 의뢰 같이 하실래요?']),null);});},
  'evpop-toggle':()=>{S.settings=S.settings||{};S.settings.evPopup=S.settings.evPopup===false;save();renderPop();},
  'evp-go':()=>{modal('');go('battle',{rtab:'event'});},
  'notify-toggle':()=>{S.settings=S.settings||{};S.settings.notify=S.settings.notify===false;save();renderPop();},
  'set-tab':d=>{S.sel.setTab=d.tab;renderPop();},
  'snd-mute':d=>{S.settings=S.settings||{};const cur=Math.round(sndVol(d.k)*100);if(cur){S.settings['_'+d.k]=cur;S.settings[d.k]=0;}else S.settings[d.k]=S.settings['_'+d.k]||DEF_SND[d.k];audio();updateBgm();save();renderPop();},
  'acc-logout':()=>{if(SB_UID){sbLogout();return;}S.loggedOut=true;S.sel.pop=null;updateBgm();save();render();},
  'acc-login':()=>{S.loggedOut=false;save();go('main');audio();updateBgm();toast(`${S.me.name}님, 다시 오신 것을 환영합니다.`,'good');},
  'acc-del':()=>{S.sel.confirmDel=true;renderPop();},
  'acc-del-no':()=>{S.sel.confirmDel=false;renderPop();},
  'acc-del-yes':()=>{timers.forEach(clearTimeout);timers.clear();const data=S.data,inq=S.inquiries,settings=S.settings;S=freshState();S.data=data;S.inquiries=inq;S.settings=settings;S.mail=[];save();updateBgm();render();toast('계정을 삭제했습니다. 새 블레서를 만들 수 있습니다.');},
  'inq-answer':d=>{const q=(S.inquiries||[]).find(x=>x.id===d.id);const inp=$('#ans-'+d.id);if(!q||!inp)return;const a=inp.value.trim();if(!a){toast('답변 내용을 입력하세요.','warn');return;}
    q.answer=a.slice(0,300);q.answeredAt=now();logChange('1:1 문의 답변',[{field:q.by,before:'답변 대기',after:'답변 완료'}]);
    if(S.me&&q.by===S.me.name)deliverMail('운영자',`[1:1 문의 답변 · ${q.cat}] ${q.answer}`.slice(0,200),null);save();render();},
  navtog:()=>{NAV_OPEN=!NAV_OPEN;renderTop();},
  nav:d=>{if(d.route==='battle'&&!S.party&&!S.battle&&!S.queue&&!S.match&&S.route==='battle')S.sel.monster=null;go(d.route);},
  link:d=>openLink(d.link),
  online:()=>{S.sel.noteEdit=null;showOnline();},
  closemodal:()=>modal(''),
  pickjob:d=>{S.sel.newJob=d.job;const nm=$('#new-name')?$('#new-name').value:'';render();if($('#new-name'))$('#new-name').value=nm;},
  chattab:d=>{S.sel.chatTab=d.tab;if(d.tab!=='dm')S.sel.dmWith=null;updateChats();save();},
  'dm-open':d=>{S.sel.dmWith=d.name;updateChats();save();const i=$('#chat-in-all');if(i)i.focus();},
  'dm-back':()=>{S.sel.dmWith=null;updateChats();},
  'dm-start':()=>{const v=($('#dm-new')||{}).value;if(!v){toast('대화할 상대를 고르세요.','warn');return;}S.sel.dmWith=v;updateChats();const i=$('#chat-in-all');if(i)i.focus();},
  'u-dm':d=>{closeRmem();modal('');S.sel.chatTab='dm';S.sel.dmWith=d.name;if(!$('[data-chatpanel]:not([data-lock="party"])')||S.route!=='main'){go('main');}else updateChats();const i=$('#chat-in-all');if(i)i.focus();},
  toggletoday:()=>{S.sel.todayOpen=S.sel.todayOpen!==true;const b=$('#today-body');if(b)b.hidden=!S.sel.todayOpen;const h=$('[data-act="toggletoday"]');if(h)h.setAttribute('aria-expanded',S.sel.todayOpen);save();},
  rslide:d=>{const r=$('[data-rslide]');if(!r)return;const c=r.querySelector('.rcard');const w=c?c.getBoundingClientRect().width+12:200;r.scrollBy({left:+d.dir*w,behavior:'smooth'});},
  report:d=>{const all=[...S.chat.lobby,...(S.party?S.party.chat:[]),...Object.values(S.chat.whisper).flat()];const m=all.find(x=>x.id===d.id);if(!m)return;
    if(S.reports.some(r=>r.msgId===m.id)){toast('이미 신고한 메시지입니다.');return;}S.reports.unshift({id:uid('r'),msgId:m.id,from:m.from,text:m.text,ts:now(),done:false});save();toast('신고를 접수했습니다. 운영자가 확인합니다.');},
  openquest:d=>{const q=quest(d.id);go('quest',{quest:d.id,qtab:q?q.cat:(S.sel.qtab||'epic')});},
  qtab:d=>{S.sel.qtab=d.tab;S.sel.quest=null;save();render();},
  qfight:d=>{const q=quest(d.id),qp=S.qp[d.id];if(!q||!qp)return;const st=q.steps[qp.step];if(!st||!st.battle)return;const m=monster(st.battle);if(!m)return;const why=busyReason();if(why){toast(why,'warn');return;}startSolo(m,{type:'quest',qid:q.id,step:qp.step});},
  rtab:d=>{S.sel.rtab=d.tab;S.sel.monster=null;save();render();},
  dtarget:d=>{S.sel.dtarget=d.v;S.sel.dtargets={};render();},
  dfight:d=>{const m=monster(d.id);if(!m||mkind(m)!=='dungeon')return;const why=busyReason()||levelReason(m,S.me.level)||(daily().dungeon[m.id]?'오늘은 이미 클리어했습니다':'');if(why){toast(why,'warn');return;}modal('');S.drun={mid:m.id,phases:drunPhases(),idx:0,hp:Math.max(0.05,hpNow()),mobs:{},log:[],start:now()};S.route='battle';save();render();toast(`${m.region} 입장 · 5페이즈 탐사를 시작합니다`,'good');},
  'ev-spawn':d=>{if(!isAdmin())return;const m=monster(d.id);if(!m||S.mass)return;spawnMass(m,S.me.name);logChange('만신전',[{field:'출현',before:undefined,after:m.name}]);render();},
  'ex-go':d=>{const r=EXPLORE.find(x=>x.id===d.id);if(!r)return;const dd=daily();const A=d.area?MAP_INFO[d.area]:null;const an=d.area?(MAP_SPOTS.find(x=>x[0]===d.area)||[])[2]:null;const need=A?A.lv:r.lv;
    if(S.me.level<need){toast(`LV${need} 이상 필요합니다.`,'warn');return;}{const sl=storyLock(r.id);if(sl){toast(sl,'warn');return;}}if(dd.explore>=EXPLORE_MAX){toast(`오늘 탐색 ${EXPLORE_MAX}회를 모두 사용했습니다.`,'warn');return;}
    dd.explore++;let [text,type]=pick(r.scenes);if(landW(r.id)==='fog'&&Math.random()<FOG_LOST){text=pick(['짙은 안개 속에서 길을 잃고 한참을 헤맸다. 아무것도 찾지 못했다.','안개 때문에 한 치 앞도 보이지 않아 탐색을 포기했다.','안개 너머로 무언가 보였지만, 다가가자 사라졌다.']);type='none';}const rw=exploreReward(A?{...r,lv:A.lv}:r,type);const label=an||r.region;grant(rw,'explore',{label});bump('explores');
    S.me.exLog=[{ts:now(),region:label,land:r.id,text,got:gotText(rw)},...(S.me.exLog||[])].slice(0,12);save();render();if(d.pop)refreshMap();toast(`${label} 탐색${gotText(rw)?' · '+gotText(rw):''}`,'good');},
  'ex-hunt':d=>{const r=EXPLORE.find(x=>x.id===d.id);if(!r)return;S.sel.huntArea=d.area||'';const A=d.area?MAP_INFO[d.area]:null;const need=A?A.lv:r.lv;const why=huntBusy()||(S.me.level<need?`LV${need} 이상 필요합니다`:storyLock(r.id));if(why){toast(why,'warn');return;}
    const fm=huntMons(r);if(!fm.length)return;S.sel.huntMode=S.sel.huntMode||'manual';S.sel.huntDur=S.sel.huntDur||30;modal(huntDlg(r.id));},
  'hunt-mode':d=>{S.sel.huntMode=d.v;modal(huntDlg(d.id));},
  'hunt-dur':d=>{S.sel.huntDur=+d.v;S.sel.huntMode='auto';modal(huntDlg(d.id));},
  'hunt-go':d=>{const r=EXPLORE.find(x=>x.id===d.id);if(!r)return;const A=S.sel.huntArea?MAP_INFO[S.sel.huntArea]:null;const need=A?A.lv:r.lv;const why=huntBusy()||(S.me.level<need?`LV${need} 이상 필요합니다`:storyLock(r.id));if(why){toast(why,'warn');return;}
    const fm=huntMons(r);if(!fm.length)return;modal('');const rg=A?fm[0].region:r.region;
    if(S.sel.huntMode!=='auto'){startSolo(pick(fm),{type:'field',region:rg});return;}
    const min=AUTO_DUR.includes(S.sel.huntDur)?S.sel.huntDur:30;S.auto={land:r.id,region:rg,mons:fm.map(m=>m.id),start:now(),end:now()+min*60000,min};save();render();toast(`${r.region} 자동 사냥을 시작했습니다 · ${durLabel(min)}`,'good');},
  'auto-claim':()=>{autoClaim(false);},
  'auto-stop':()=>{autoClaim(true);},
  'ng-land':d=>{S.sel.exLand=d.land;S.sel.exFocus='';go('explore');},
  'map-open':d=>{if(S.route!=='explore'){openMap(d.land,d.focus);return;}
    const same=S.sel.exLand===d.land;S.sel.exLand=d.land;S.sel.exFocus=d.focus||'';
    if(!same){render();scrollTo({top:0});}else $$('.md-sec.focus').forEach(x=>x.classList.remove('focus'));
    const el=d.focus&&$('#md-'+d.focus);if(el){el.classList.add('focus');el.scrollIntoView({behavior:same?'smooth':'auto',block:'nearest'});}},
  'memo-edit':()=>{S.sel.memoEdit=true;$$('.me-memo').forEach(x=>x.outerHTML=memoHTML());const i=$('#me-memo');if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length);}},
  'sk-tab':d=>{S.sel.skTab=d.tab;render();},
  'shelf-off':d=>{const sh=shelf();const i=sh.lastIndexOf(d.id);if(i<0)return;sh[i]=null;save();render();toast(`${ITEMS[d.id].name}을(를) 장식장에서 내렸습니다.`);},
  'shelf-slot':d=>{modal(shelfDlg(+d.i));},
  'shelf-place':d=>{const sh=shelf();const i=+d.i;if(sh[i]||!((S.me.inv[d.id]||0)-shelfCount(d.id)>0))return;sh[i]=d.id;save();modal('');render();toast(`${ITEMS[d.id].name}을(를) 장식장에 올렸습니다.`,'good');},
  'shelf-take':d=>{const sh=shelf();const k=sh[+d.i];if(!k)return;sh[+d.i]=null;save();modal('');render();toast(`${ITEMS[k].name}을(를) 장식장에서 내렸습니다.`);},
  'shelf-put':d=>{const sh=shelf();const i=sh.indexOf(null);if(i<0){toast('장식장이 가득 찼습니다.','warn');return;}if(!((S.me.inv[d.id]||0)-shelfCount(d.id)>0)){toast('이미 모두 장식 중입니다.','warn');return;}sh[i]=d.id;save();render();toast(`${ITEMS[d.id].name}을(를) 장식장에 올렸습니다.`,'good');},
  'prog-go':d=>{if(d.go==='fish'&&(S.autoFish||S.fishCast)){S.sel.exLand=(S.autoFish||S.fishCast).land;S.sel.exFocus='fishing';go('explore');return;}if(d.go.startsWith('craft:')){const k=d.go.slice(6);openCraft(k,S.me.cjobs&&S.me.cjobs.repair&&k==='craft'&&!S.me.cjobs.craft?'repair':'make');return;}if(d.go==='auto'&&S.auto){S.sel.exLand=S.auto.land;S.sel.exFocus='';go('explore');return;}go(d.go);},
  'set-status':d=>{if(!STATUS[d.v])return;S.me.status=d.v;save();$$('.st-dd[open]').forEach(x=>x.open=false);$$('.me-memo').forEach(x=>{if(!x.classList.contains('editing'))x.outerHTML=memoHTML();});toast(`상태를 「${STATUS[d.v].n}」(으)로 바꿨습니다.`);},
  'cq-toggle':(d,el)=>{const box=el.closest('.me-quests');const open=box.classList.contains('folded');S.sel.cqOpen=open;$$('.me-quests').forEach(b=>{b.classList.toggle('folded',!open);const t=b.querySelector('.cq-tog');if(t)t.setAttribute('aria-expanded',String(open));});},
  ltab:d=>{S.sel.ltab=d.tab;render();},
  'wv-go':d=>{$$('.wv-dd[open]').forEach(x=>x.open=false);const el=$('#wv-'+d.id);if(el)el.scrollIntoView({behavior:'smooth',block:'start'});},
  'cf-open':d=>{S.sel.cfTab='make';openCraft(d.kind,'make');},
  'cf-tab':d=>{openCraft(d.kind,d.tab);},
  'pq-next':d=>{const k=d.kind;const p=prof(k);if(p.done)return;if(!prof(k).rank&&profCount()>=2){toast('장인 직업은 최대 2개까지만 가질 수 있습니다.','warn');return;}const st=PROF_Q[k][p.ch].steps[p.step];
    if(st[0]==='gather'){if(!hasMats(st[1]))return;for(const m in st[1])takeMat(m,st[1][m]);}else if(st[0]!=='text')return;pqAdvance(k);openCraft(k,'make');render();openCraft(k,'make');},
  'cj-start':d=>{const k=d.kind;const r=recipe(k,d.id);const p=prof(k);if(!r||!p.rank||p.rank>r.grade||cjobs()[k]||!hasMats(r.mats))return;
    for(const m in r.mats)takeMat(m,r.mats[m]);cjobs()[k]={fail:guildRain(k)&&Math.random()<RAIN_FAIL,rid:r.id,out:r.out,n:r.n,label:ITEMS[r.out].name+(r.n>1?' ×'+r.n:''),start:now(),end:now()+r.min*60000};save();render();openCraft(k,'make');toast(`${ITEMS[r.out].name} ${PROF[k].n}을(를) 시작했습니다 · ${durLabel2(r.min)}`);},
  'cj-repair':d=>{const id=d.id;const miss=DURA_MAX-dura(id);const cost=repairCost(id,miss);if(!miss||S.me.gold<cost)return;S.me.gold-=cost;S.me.dura=S.me.dura||{};S.me.dura[id]=DURA_MAX;save();render();openCraft('craft','repair');toast(`${ITEMS[id].name} 수리 완료 · 내구도 ${DURA_MAX}/${DURA_MAX}`,'good');},
  'toast-x':(d,el)=>{const t=el&&el.closest&&el.closest('.toast');if(t)t.remove();},
  'repair-open':(d,el)=>{if(el&&el.closest){const t=el.closest('.toast');if(t)t.remove();}openCraft('craft','repair');},
  'eq-now':(d,el)=>{if(el&&el.closest){const t=el.closest('.toast');if(t)t.remove();}ACTS.equip({id:d.id});},
  'ng-raid':d=>go('battle',{rtab:d.tab||'daily',monster:null}),
  'cj-haste':d=>{const j=cjobs()[d.slot];const it=ITEMS[d.id];if(!j||!it||!it.haste||!(S.me.inv[d.id]>0)||now()>=j.end)return;S.me.inv[d.id]--;j.end=Math.max(now(),j.end-it.haste*60000);save();render();openCraft(d.slot==='repair'?'craft':d.slot,d.slot==='repair'?'repair':'make');toast(`${it.name} 사용 · 남은 시간 -${durLabel2(it.haste)}`);},
  'cj-claim':d=>{const J=cjobs();const j=J[d.slot];if(!j||now()<j.end)return;J[d.slot]=null;
    if(j.repair){S.me.dura=S.me.dura||{};S.me.dura[j.repair]=DURA_MAX;toast(`${ITEMS[j.repair].name} 수리 완료 · 내구도 ${DURA_MAX}/${DURA_MAX}`,'good');save();render();openCraft('craft','repair');return;}
    if(j.fail){save();render();openCraft(d.slot,'make');toast(`손이 미끄러져 ${ITEMS[j.out].name} ${PROF[d.slot].n}에 실패했습니다… (비 · 길드 본진 미끄러짐)`,'warn');return;}
    bump('crafts');
    const before=ITEMS[j.out].rod?rods().map(x=>x.uid):null;const got=addItem(j.out,j.n);noteItems({[j.out]:got});if(before){rods().filter(x=>!before.includes(x.uid)).forEach(x=>{x.crafted=true;x.max+=ROD_CRAFT_BONUS;x.dura+=ROD_CRAFT_BONUS;});}const k=d.slot;const p=prof(k);
    if(!p.done){const st=PROF_Q[k][p.ch].steps[p.step];if(st&&st[0]==='craft'&&st[1]===j.rid)pqAdvance(k);}
    save();render();openCraft(k,'make');toast(`${ITEMS[j.out].name} ×${got} 획득`,'good');},
  'vil-go':d=>{vilVisit(d.land,d.spot);render();},
  'dun-go':d=>{const id=d.id;if(id==='temple'){go('battle',{rtab:'weekly',monster:null});return;}S.sel.dfocus=id;go('battle',{rtab:'dungeon',monster:null});setTimeout(()=>{const el=$('#dun-'+id);if(el)el.scrollIntoView({behavior:'smooth',block:'center'});},30);},
  'fish-cast':d=>{const land=d.land;const r=selRod();if(!r){toast('낚싯대가 필요합니다.','warn');return;}if(S.autoFish||S.fishCast){toast('이미 낚시 중입니다.','warn');return;}if(net().length>=NET_MAX){toast('어망이 가득 찼습니다. 물고기를 정리하세요.','warn');return;}
    S.fishCast={land,rod:r.uid,tier:ITEMS[r.item].rod,start:now(),end:now()+CAST_MIN*60000};S.sel.fishRes=null;save();render();toast(`낚싯대를 던졌습니다 · ${CAST_MIN}분 뒤 찌를 확인하세요`);},
  'fish-reel':()=>{const F=S.fishCast;if(!F||now()<F.end)return;S.fishCast=null;const land=F.land;if(net().length>=NET_MAX){toast('어망이 가득 찼습니다.','warn');S.fishCast=F;return;}
    const R=castRoll(land,F.tier);{const r=rods().find(x=>x.uid===F.rod);if(r)useRod(r,1);}if(R.kind==='fish')net().push(R.c);fishLog(land,R.text+(R.rec?' (최대 기록!)':''),R.kind);save();render();toast(R.text,R.kind==='fish'?'good':undefined);},
  'net-list':()=>{modal(netListDlg());const mm=$('.modal');if(mm)mm.classList.add('craftm');},
  'af-open':d=>{if(!AF_DUR.includes(S.sel.afDur))S.sel.afDur=AF_DUR[0];modal(afDlg(d.land));},
  'af-dur':d=>{S.sel.afDur=+d.v;modal(afDlg(d.land));},
  'af-go':d=>{const r=selRod();if(S.autoFish||S.fishCast||!r)return;const want=AF_DUR.includes(S.sel.afDur)?S.sel.afDur:AF_DUR[0];const min=Math.min(want,r.dura*AUTO_EVERY);S.autoFish={land:d.land,start:now(),end:now()+min*60000,min,rod:r.uid,tier:ITEMS[r.item].rod,cut:min<want};modal('');save();render();toast(`${LANDS[d.land]} 자동 낚시를 시작했습니다 · ${durLabel(min)}`,'good');},
  'af-claim':()=>afClaim(false),'af-stop':()=>afClaim(true),
  'net-open':d=>{modal(netDlg(+d.i));const mm=$('.modal');if(mm)mm.classList.add('narrow2');},
  'net-do':d=>{const N=net();const i=+d.i;const c=N[i];if(!c)return;const nm=fishName(c);
    if(d.v==='keep'){if(aqua().length>=AQUA_MAX){toast('수족관이 가득 찼습니다.','warn');return;}aqua().push(c);toast(`${nm}을(를) 수족관에 보관했습니다.`,'good');}
    else if(d.v==='cut'){const n=fillets(c);addItem('fl_'+c.sp,n);toast(`${nm}을(를) 손질했습니다 · 손질한 ${nm} ×${n}`,'good');}
    else toast(`${nm}을(를) 물로 돌려보냈습니다.`);
    N.splice(i,1);save();render();if(N.length){modal(netListDlg());const mm=$('.modal');if(mm)mm.classList.add('craftm');}else modal('');},
  'aq-release':d=>{const A=aqua();const c=A[+d.i];if(!c)return;A.splice(+d.i,1);save();render();toast(`${fishName(c)}을(를) 방생했습니다.`);},
  'drun-next':()=>{const R=S.drun;if(!R||R.done)return;const k=R.phases[R.idx];if(k==='monster'||k==='boss')drunStartBattle();else drunEvent();},
  'drun-exit':()=>{if(S.drun&&S.drun.done!=='win')hpSet(S.drun.hp);(S.drun&&S.drun.party||[]).forEach(x=>{const bb=bot(x.name);if(bb)bb.status='lobby';});S.drun=null;save();go('battle',{rtab:'dungeon'});},
  'drun-quit':()=>{if(!S.drun)return;hpSet(S.drun.hp);(S.drun.party||[]).forEach(x=>{const bb=bot(x.name);if(bb)bb.status='lobby';});S.drun=null;save();toast('던전 탐사를 포기했습니다.');go('battle',{rtab:'dungeon'});},
  'dex-open':()=>{modal(dexDlg());const mm=$('.modal');if(mm)mm.classList.add('craftm');},
  dparty:d=>{const m=monster(d.id);if(!m)return;const why=busyReason()||levelReason(m,S.me.level)||raidBlock(m);if(why){toast(why,'warn');return;}S.sel.mk={target:2};S.sel.monster=m.id;save();render();scrollTo({top:0});},
  'snail-open':()=>openSnail(),
  'snail-pick':d=>{S.sel.snailPick=+d.i;openSnail();},
  'snail-pick2':d=>{const st=snailState();if(st&&!st.running){st.pick=+d.i;save();openSnail();}},
  'snail-start':()=>{if(snailState())return;const d=daily();d.snail=d.snail||0;const i=S.sel.snailPick;if(i==null)return;if(d.snail>=SNAIL_MAX){toast('오늘 달팽이 레이스 3회를 모두 사용했습니다.','warn');return;}if(S.me.gold<SNAIL_FEE){toast('골드가 부족합니다.','warn');return;}
    S.me.gold-=SNAIL_FEE;bump('goldSpent',SNAIL_FEE);bump('snail');bump('casinoSpent',SNAIL_FEE);d.snail++;S.me.snail={pick:i,phase:0};snailRun();render();openSnail();},
  'snail-next':()=>{const st=snailState();if(!st||st.running||!st.last||st.last.win!==st.pick||st.phase>=2)return;st.phase++;snailRun();},
  'snail-cash':()=>{const st=snailState();if(!st||st.running||!st.last||st.last.win!==st.pick)return;const g=SNAIL_FEE*SNAIL_MULT[st.phase];S.me.gold+=g;bump('goldEarned',g);if(st.phase===2)bump('snailTriple');S.me.snail=null;S.sel.snailPick=null;save();render();openSnail();toast(`달팽이 레이스 · ${g.toLocaleString('ko-KR')}골드 획득!`,'good');},
  'snail-end':()=>{S.me.snail=null;S.sel.snailPick=null;save();render();openSnail();},
  'lotto-open':()=>{S.sel.lotPick=S.sel.lotPick||[];openLotto();},
  'lotto-pick':d=>{const n=+d.n;let a=S.sel.lotPick||[];a=a.includes(n)?a.filter(x=>x!==n):a.length>=4?a:[...a,n];S.sel.lotPick=a;openLotto();},
  'lotto-auto':()=>{const a=[0,1,2,3,4,5,6,7,8,9].sort(()=>Math.random()-.5).slice(0,4);S.sel.lotPick=a;openLotto();},
  'lotto-buy':()=>{const I=lottoInfo();const a=(S.sel.lotPick||[]).slice().sort((x,y)=>x-y);if(a.length!==4||!I.open||I.mine.length>=LOTTO_MAX||S.me.gold<LOTTO_PRICE)return;
    S.me.gold-=LOTTO_PRICE;bump('goldSpent',LOTTO_PRICE);bump('casinoSpent',LOTTO_PRICE);S.me.lotto.push({id:uid('lt'),nums:a,draw:I.nd.key,at:I.nd.at,claimed:false,ts:now()});S.sel.lotPick=[];save();render();openLotto();toast(`행운권 구매 · ${a.join(' ')}`,'good');},
  'lotto-claim':d=>{const x=(S.me.lotto||[]).find(y=>y.id===d.id);if(!x||x.claimed||now()<x.at)return;const rk=lottoRank(x.nums,drawNums(x.draw));x.claimed=true;if(rk){const g=LOTTO_PRIZE[rk];S.me.gold+=g;bump('goldEarned',g);if(rk===1)bump('lotto1');toast(`주간 행운권 ${rk}등 당첨! ${g.toLocaleString('ko-KR')}골드`,'good');}else toast('아쉽게도 낙첨입니다.');save();render();openLotto();},
  'fish-rank':d=>{modal(fishRankDlg(d.land));const mm=$('.modal');if(mm)mm.classList.add('narrow2');},
  'comm-do':d=>{const B=commBoard();const x=B.list.find(y=>y.id===d.id);if(!x||x.done||(S.me.inv[x.item]||0)<x.n)return;S.me.inv[x.item]-=x.n;x.done=true;const g=Math.round(x.gold*(prof(x.kind).rank?1.2:1));S.me.gold+=g;bump('goldEarned',g);bump('commissions');save();render();toast(`${x.from} 의뢰 납품 · ${g.toLocaleString('ko-KR')}골드`,'good');},
  'wm-toggle':()=>{S.sel.wmOpen=S.sel.wmOpen===false;render();},
  'wm-claim':d=>{const W=weeklyM();const {def,cur}=wmProg(W,d.k);if(W.claimed[d.k]||cur<def[2])return;W.claimed[d.k]=true;grant({exp:def[3].exp,gold:def[3].gold,items:{}},'quest',{label:'주간 미션'});save();render();toast(`주간 미션 완료 · ${def[3].gold}골드 · EXP ${def[3].exp}`,'good');},
  'wm-bonus':()=>{const W=weeklyM();if(W.bonus||!W.keys.every(k=>wmProg(W,k).cur>=wmProg(W,k).def[2]))return;W.bonus=true;grant({exp:WM_BONUS.exp,gold:WM_BONUS.gold,items:{}},'quest',{label:'주간 미션 보너스'});save();render();toast('주간 미션을 모두 완료했습니다!','good');},
  'cshop-open':()=>{modal(casinoShopDlg());const mm=$('.modal');if(mm)mm.classList.add('craftm');},
  'cshop-buy':d=>{const x=CASINO_SHOP.find(y=>y.id===d.id);const B=S.me.casinoBuy=S.me.casinoBuy||{};if(!x||(x.once&&B[x.id])||S.me.gold<x.price)return;S.me.gold-=x.price;bump('goldSpent',x.price);bump('casinoSpent',x.price);B[x.id]=(B[x.id]||0)+1;addItem(x.item,1);noteDeco(x.item,{t:'place',v:'골든 오아시스 상점'});save();render();modal(casinoShopDlg());const mm=$('.modal');if(mm)mm.classList.add('craftm');toast(`${ITEMS[x.item].name} 구매 완료`,'good');},
  'fd-like':d=>{const o=fdFind(d.k,d.id);if(!o)return;const i=o.likes.indexOf(S.me.name);if(i>=0)o.likes.splice(i,1);else o.likes.push(S.me.name);save();render();},
  'fd-reply':d=>{S.sel.fdReply=S.sel.fdReply===d.id?null:d.id;S.sel.emoFor=null;render();const i=$('#fdi-'+d.id);if(i)i.focus();},
  'fd-more':d=>{S.sel.fdOpen=S.sel.fdOpen||{};S.sel.fdOpen[d.id]=true;render();},
  'fd-del':d=>{S.feed=feed().filter(p=>p.id!==d.id);save();render();toast('글을 삭제했습니다.');},
  'emo-open':d=>{const ta=$('#'+d.t);if(d.t==='fd-text'&&ta)S.sel.fdDraft=ta.value;const keep={};$$('.fd-cform input').forEach(x=>keep[x.id]=x.value);S.sel.emoFor=S.sel.emoFor===d.t?null:d.t;render();for(const id in keep){const x=$('#'+id);if(x)x.value=keep[id];}},
  'emo-put':d=>{const el=$('#'+d.t);if(!el)return;const foc=document.activeElement===el;const st=foc?el.selectionStart:el.value.length,en=foc?el.selectionEnd:el.value.length;el.value=el.value.slice(0,st)+d.e+el.value.slice(en);el.focus();el.selectionStart=el.selectionEnd=st+d.e.length;if(d.t==='fd-text'){S.sel.fdDraft=el.value;const c=$('#fd-count');if(c)c.textContent=el.value.length+'/300';}},
  ctab:d=>{S.sel.ctab=d.tab;render();},
  'ex-back':()=>{S.sel.exLand=null;S.sel.exFocus='';render();scrollTo({top:0});},
  'map-goto':d=>{modal('');openLink(d.link);},
  'md-target':d=>{const m=monster(d.focus);S.sel.dtargets=S.sel.dtargets||{};S.sel.dtargets[m?m.id:d.focus]=d.v;if($('.modal.mapmodal'))refreshMap();else render();},
  qfold:d=>{S.sel.qfold=S.sel.qfold||{};S.sel.qfold[d.cat]=!S.sel.qfold[d.cat];render();},
  acceptq:d=>{const q=quest(d.id);if(questStatus(q)!=='available')return;S.qp[q.id]={status:'active',step:q.start,history:[],pending:null,cycle:kstCycle(),flagsSet:[]};save();render();toast(`퀘스트 수락 · ${q.title}`);},
  chooseq:d=>{const q=quest(d.id),qp=S.qp[q.id];const c=q.steps[qp.step].choices[+d.i];if(!c||choiceReason(c))return;qp.pending=+d.i;save();render();},
  nextq:d=>{const q=quest(d.id),qp=S.qp[q.id];const step=q.steps[qp.step];const c=step.choices[qp.pending];
    qp.history.push({step:qp.step,text:step.text,label:c.label,result:c.result||''});if(c.flag){S.flags[c.flag]=true;qp.flagsSet.push(c.flag);}if(c.advTo)doAdvance(c.advTo);
    qp.step=c.next;qp.pending=null;save();render();},
  claimq:d=>{const q=quest(d.id),qp=S.qp[q.id];const step=q.steps[qp.step];if(!step||!step.end)return;const key=claimKey(q,qp);
    if(S.claimedQ[key]){qp.status='done';save();render();toast('이미 받은 보상입니다.','warn');return;}
    S.claimedQ[key]=true;qp.status='done';bump('quests');if(q.id==='D_THEFT'){S.me.justice=(S.me.justice||0)+1;if(S.me.inv.q_wallet)delete S.me.inv.q_wallet;setTimeout(checkTitles,0);}if(q.repeat)bump('dailies');const RW=clone(qReward(q,step.reward));grant(RW,'quest',{questId:q.id,label:q.title,path:step.text});
    save();render();toast(`보상 수령 · EXP ${RW.exp||0} · ${RW.gold||0}골드${itemsText(RW.items)?' · '+itemsText(RW.items):''}`,'good');},
  abandonq:d=>{const qp=S.qp[d.id];if(!qp)return;(qp.flagsSet||[]).forEach(f=>{const still=Object.entries(S.qp).some(([id,x])=>id!==d.id&&x.status==='done'&&(x.flagsSet||[]).includes(f));if(!still)delete S.flags[f];});delete S.qp[d.id];save();render();toast('퀘스트를 포기했습니다. 다시 수락할 수 있습니다.');},
  backmon:()=>{const m=monster(S.sel.monster);S.sel.monster=null;go('battle',{rtab:m&&mkind(m)==='weekly'?'weekly':m&&mkind(m)==='event'?'event':m&&mkind(m)==='dungeon'?'dungeon':'daily'});},
  mkset:d=>{S.sel.mk=S.sel.mk||{};const ni=$('#mk-name');if(ni)S.sel.mk.name=ni.value;S.sel.mk[d.k]=d.k==='target'?+d.v:d.v;render();},
  createparty:d=>{const m=monster(d.id);if(busyReason()||levelReason(m,S.me.level))return;{const rb=raidBlock(m);if(rb){toast(rb,'warn');return;}}const mk=S.sel.mk||{};
    const target=Math.min(m.max,Math.max(m.min,mk.target||m.target||m.min));
    const nm=(($('#mk-name')||{}).value||'').trim().slice(0,16)||`${S.me.name}의 파티`;
    S.party={id:uid('P'),name:nm,monsterId:m.id,leader:S.me.name,visibility:mk.vis||'public',target,members:[meMember()],chat:[],invites:[],rev:m.rev,nextJoin:now()+2000};
    sysParty(`${S.me.name}님이 파티를 만들었습니다 (${S.party.visibility==='public'?'공개 모집':'초대 전용'}).`);S.sel.chatTab='party';save();render();toast('파티를 만들었습니다.','good');},
  joinrecruit:d=>{const r=S.recruits.find(x=>x.id===d.id);if(!r)return;const why=busyReason()||joinReason(r);if(why){toast(why,'warn');return;}
    const m=monster(r.monsterId);S.recruits=S.recruits.filter(x=>x!==r);
    S.party={id:r.id,name:r.name,monsterId:m.id,leader:r.leader,visibility:'public',target:r.target,members:[...r.members.map(n=>{const b=bot(n);return {name:n,job:b.job,level:b.level,isMe:false,ready:true};}),meMember()],chat:[],invites:[],rev:m.rev,nextJoin:now()+2500};
    sysParty(`${S.me.name}님이 파티에 참가했습니다.`);S.sel.chatTab='party';later(1500,()=>botSay('party',r.leader,'어서 오세요! 준비 눌러 주세요'));go('battle');},
  queue:d=>{const m=monster(d.id);if(busyReason()||levelReason(m,S.me.level))return;{const rb=raidBlock(m);if(rb){toast(rb,'warn');return;}}const mk=S.sel.mk||{};
    S.queue={monsterId:m.id,target:Math.min(m.max,Math.max(m.min,mk.target||m.target||m.min)),since:now(),nextTry:now()+rnd(3000,6000)};save();render();toast('랜덤 매칭을 시작했습니다. 기다리는 동안 퀘스트를 진행해도 됩니다.');},
  cancelqueue:()=>{S.queue=null;save();render();toast('매칭을 취소했습니다.');},
  'm-accept':()=>acceptMatch(),
  'm-decline':()=>matchFail(true),
  ready:()=>{const me=S.party.members.find(x=>x.isMe);me.ready=!me.ready;sysParty(`${S.me.name}님이 ${me.ready?'준비를 마쳤습니다':'준비를 취소했습니다'}.`);save();render();},
  depart:()=>{syncMercs(S.party);const c=partyCheck(S.party);if(!c.ok||S.party.leader!==S.me.name)return;startBattle();},
  leaveparty:()=>leaveParty(),
  'merc-add':d=>{const p=S.party;if(!p||p.leader!==S.me.name)return;const m=monster(p.monsterId);const why=slotReason(m,p.members,roleOf(d.job),p.target);if(why){toast(why,'warn');return;}
    const n=addMerc(p,d.job);sysParty(`${n}(${CLASSES[d.job].name})이(가) 용병으로 합류했습니다.`);save();render();},
  'merc-fill':()=>{const p=S.party;if(!p||p.leader!==S.me.name)return;const m=monster(p.monsterId);const L=mercLevel(p);let added=0;
    for(let g=0;g<20&&p.members.length<p.target;g++){const c=partyCheck(p);let r=['tank','heal','dps'].find(k=>c.need[k]>0);if(!r){if(p.members.length>=m.min)break;r='dps';}
      if(slotReason(m,p.members,r,p.target))break;addMerc(p,pick(mercJobs(L,r)));added++;}
    if(added){sysParty(`용병 ${added}명이 합류했습니다.`);save();render();}else toast('더 채울 자리가 없습니다.','warn');},
  kick:d=>{const p=S.party;p.members=p.members.filter(x=>x.name!==d.name);const b=bot(d.name);if(b)b.status='lobby';sysParty(`${d.name}님을 파티에서 내보냈습니다.`);save();render();},
  setvis:d=>{S.party.visibility=d.v;sysParty(`파티 공개 범위를 ${d.v==='public'?'공개 모집':'초대 전용'}으로 바꿨습니다.`);save();render();},
  invite:d=>{const p=S.party;p.invites=p.invites||[];if(p.invites.some(x=>x.name===d.name))return;p.invites.push({name:d.name,at:now()+rnd(1800,4000)});sysParty(`${d.name}님을 초대했습니다.`);save();render();},
  ackchange:()=>{const p=S.party;p.changed=false;p.rev=monster(p.monsterId).rev;sysParty('바뀐 조건을 확인했습니다. 다시 준비해 주세요.');save();render();},
  acttab:d=>{S.sel.actTab=d.tab;const me=S.battle.players.find(p=>p.isMe);if(d.tab==='attack')S.sel.act={kind:'skill',skill:basicSkill(me.job)};else if(d.tab==='skill'&&S.battle.grid&&S.sel.act&&S.sel.act.kind==='skill'&&S.sel.act.skill===basicSkill(me.job))S.sel.act={kind:'none'};else if(d.tab==='defend')S.sel.act={kind:'defend'};renderFight();},
  pickact:d=>{const b=S.battle;const key=d.second?'act2':'act';const prev=S.sel[key]||{};const a={kind:d.kind};if(d.skill)a.skill=d.skill;if(d.item)a.item=d.item;
    const s=a.skill&&SKILLS[a.skill];
    if(a.item==='potion')a.target=(b.players.find(p=>p.isMe)||{}).id;
    if(s&&['ally','dead'].includes(s.target)){const ok=prev.target&&b.players.find(p=>p.id===prev.target&&(s&&s.target==='dead'?p.dead:!p.dead));a.target=ok?prev.target:null;if(s&&s.target==='dead'&&!a.target){const dd=b.players.find(p=>p.dead);if(dd)a.target=dd.id;}}
    if(!d.second&&prev.addon&&s&&s.type==='dice'){const ad=SKILLS[prev.addon];if(!ad.with||ad.with.includes(a.skill))a.addon=prev.addon;}
    if(!d.second&&!b.grid&&S.sel.addonArm&&s&&s.type==='dice'){const ad=SKILLS[S.sel.addonArm];if(ad&&(!ad.with||ad.with.includes(a.skill)))a.addon=S.sel.addonArm;}
    S.sel[key]=a;if(!b.grid&&autoConfirm())return;renderFight();},
  pickaddon:d=>{const b=S.battle;const a=S.sel.act;if(b&&!b.grid){S.sel.addonArm=S.sel.addonArm===d.skill?null:d.skill;if(a&&a.kind==='skill')a.addon=null;renderFight();return;}if(!a||a.kind!=='skill')return;a.addon=a.addon===d.skill?null:d.skill;renderFight();},
  picktarget:d=>{const key=d.second?'act2':'act';if(S.sel[key])S.sel[key].target=d.id;const b=S.battle;if(b&&!b.grid&&autoConfirm())return;renderFight();},
  confirmact:()=>{const b=S.battle;if(!b||b.over)return;const me=b.players.find(p=>p.isMe);const a={...S.sel.act};if(!a.addon)delete a.addon;
    const err=checkAct(b,me,a,hooks.hasItem);if(err){toast(err,'warn');return;}
    let a2=null;if(canDouble(me,b)&&S.sel.act2){a2={...S.sel.act2};const e2=checkAct(b,me,a2,hooks.hasItem,a);if(e2){toast('연사 추가 행동: '+e2,'warn');return;}}
    me.action=a;me.action2=a2;if(b.grid)me.itemAct=gItemAct(b,me);me.confirmed=true;save();renderFight();},
  confirmdefend:()=>{const me=S.battle.players.find(p=>p.isMe);me.action={kind:'defend'};me.confirmed=true;save();renderFight();},
  editact:()=>{const b=S.battle;const me=b.players.find(p=>p.isMe);if(b.over)return;me.confirmed=false;b.allAt=null;const a=me.action;
    if(b.grid){S.sel.gmode=a&&a.kind==='move'?'move':a&&a.kind==='wait'?'wait':'fight';S.sel.gcell=a&&a.kind==='move'?a.to:null;S.sel.gitem=me.itemAct||null;me.itemAct=null;S.sel.act=a&&['skill','defend'].includes(a.kind)?a:{kind:'skill',skill:basicSkill(me.job)};}
    else S.sel.act=a||{kind:'skill',skill:basicSkill(me.job)};S.sel.act2=me.action2;me.action2=null;renderFight();},
  'g-mode':d=>{S.sel.gmode=d.mode;renderFight();},
  'g-cl':d=>{S.sel.gcl=d.tab;$$('.gcl-tabs [data-act="g-cl"]').forEach(x=>x.setAttribute('aria-selected',String(x.dataset.tab===d.tab)));const c=$('.gcl-chat'),l=$('#blog');if(c)c.hidden=d.tab!=='chat';if(l){l.hidden=d.tab!=='log';l.scrollTop=l.scrollHeight;}},
  'g-log':(d,el)=>{S.sel.glog=!S.sel.glog;const lg=$('#blog');if(lg){lg.hidden=!S.sel.glog;lg.scrollTop=lg.scrollHeight;}if(el)el.setAttribute('aria-expanded',String(!!S.sel.glog));},
  'g-tok':d=>{S.sel.gtok=S.sel.gtok===d.id||!d.id?null:d.id;renderFight();},
  'am-pick':d=>{S.sel.amass=d.id;S.sel.amDraft=null;render();},
  'am-revert':()=>{S.sel.amDraft=null;render();},
  'am-ph-add':()=>{const d=readMassForm();const last=d.phases[d.phases.length-1];d.phases.push({at:Math.max(1,Math.round((last?last.at:100)/2)),name:`${d.phases.length+1}페이즈`,atkMul:1.4,patterns:['burst2','all']});S.sel.amDraft={id:S.sel.amass,d};render();},
  'am-ph-del':d=>{const f=readMassForm();if(f.phases.length<=1)return;f.phases.splice(+d.i,1);S.sel.amDraft={id:S.sel.amass,d:f};render();},
  'am-new':()=>{if(!isAdmin())return;let n=1;while(monster('ev_new'+n))n++;const id='ev_new'+n;const base=clone(EXTRA_MONSTERS.find(x=>x.id==='ev_rift'));Object.assign(base,{id,name:'새 이벤트 보스',published:false,mass:{title:'',phases:clone(massCfg().phases),patterns:clone(DEFAULT_PATS),reward:clone(massCfg().reward)}});
    S.data.monsters.push(base);logChange(`만신전 · ${id}`,[{field:'추가',before:undefined,after:base.name}]);S.sel.amass=id;S.sel.amDraft=null;save();render();},
  'am-save':()=>{if(!isAdmin())return;const m=monster(S.sel.amass);if(!m)return;const d=readMassForm();const e=validateMassForm(d);if(e.length){toast(e.join(' · '),'bad');S.sel.amDraft={id:m.id,d};render();return;}
    const before=clone(m);Object.assign(m,d.stat);m.rev=(m.rev||1)+1;d.phases.sort((a,c)=>c.at-a.at);m.mass={title:d.title,phases:d.phases,patterns:d.patterns,reward:d.reward};
    logChange(`만신전 · ${m.name}`,diff(before,m).map(x=>({...x,before:short(x.before),after:short(x.after)})));S.sel.amDraft=null;save();render();toast('만신전 설정을 저장했습니다. 다음 출현부터 적용됩니다.','good');},
  'mr-save':()=>{if(!isAdmin())return;const n=id=>+($('#'+id)||{}).value;const C=clone(massCfg());
    Object.assign(C,{minPlayers:n('mr-min'),maxPlayers:n('mr-max'),minRoles:{tank:n('mr-tank'),heal:n('mr-heal'),dps:n('mr-dps')},gatherMinutes:n('mr-gather'),battleMinutes:n('mr-battle'),turnSeconds:n('mr-turn'),hpPerExtra:n('mr-hp')/100});
    const e=[];if(!(C.minPlayers>=1))e.push('최소 인원');if(C.maxPlayers<C.minPlayers)e.push('최대 인원이 최소 인원보다 작음');if(C.maxPlayers>GRID*GRID/CELL_CAP-2)e.push('최대 인원이 너무 많음');
    if(C.minRoles.tank+C.minRoles.heal+C.minRoles.dps>C.minPlayers)e.push(`역할 최소 합(${C.minRoles.tank+C.minRoles.heal+C.minRoles.dps})이 최소 인원(${C.minPlayers})보다 큼`);
    if(!(C.gatherMinutes>=1&&C.battleMinutes>=1&&C.turnSeconds>=10))e.push('시간 값');if(e.length){toast('규칙 오류: '+e.join(' · '),'bad');return;}
    logChange('만신전 규칙',diff(massCfg(),C).map(x=>({...x,before:short(x.before),after:short(x.after)})));S.data.mass=C;save();render();toast('공통 규칙을 저장했습니다.','good');},
  'g-cell':d=>{const b=S.battle;if(!b||!b.grid||b.over)return;S.sel.gtok=null;const me=b.players.find(p=>p.isMe);if(me.confirmed||me.dead)return;const i=+d.i;if((S.sel.gmode||'fight')!=='move'){S.sel.gmode='move';}if(canMoveTo(b,me,i))S.sel.gcell=i;else toast(cellCount(b,i,me)>=CELL_CAP?'이 칸은 정원(2명)이 찼습니다.':'이동 범위 밖입니다.','warn');renderFight();},
  'g-item':d=>{S.sel.gitem=d.item?{item:d.item,target:null}:null;renderFight();},
  'g-itemt':d=>{if(S.sel.gitem)S.sel.gitem.target=d.id;renderFight();},
  'g-confirm':d=>{const b=S.battle;if(!b||!b.grid||b.over)return;const me=b.players.find(p=>p.isMe);if(me.dead)return;
    if(d.kind==='move'){if(S.sel.gcell==null||!canMoveTo(b,me,S.sel.gcell)){toast('이동할 칸을 다시 선택하세요.','warn');return;}me.action={kind:'move',to:S.sel.gcell};}else me.action={kind:'wait'};
    me.action2=null;me.itemAct=gItemAct(b,me);me.confirmed=true;save();renderFight();},
  'mass-join':()=>{const M=S.mass;if(!M)return;const m=monster(M.monsterId);const C=massCfg();const why=busyReason()||levelReason(m,S.me.level)||(M.roster.length>=C.maxPlayers?'정원이 찼습니다':'');if(why){toast(why,'warn');return;}
    M.roster.push({name:S.me.name,job:S.me.job,level:S.me.level,isMe:true});if(!M.leader)M.leader=S.me.name;save();render();toast('만신전 원정대에 참가했습니다.','good');if(M.roster.length>=C.maxPlayers)massStart();},
  'mass-leave':()=>{const M=S.mass;if(!M)return;M.roster=M.roster.filter(x=>!x.isMe);if(M.leader===S.me.name)M.leader=M.roster[0]?M.roster[0].name:null;save();render();},
  'mass-go':()=>{const M=S.mass;if(!M||M.leader!==S.me.name||!massReady(M))return;massStart();},
  'mass-save':()=>{if(!isAdmin())return;let c;try{c=JSON.parse($('#mass-json').value);}catch(e){toast('JSON 형식이 올바르지 않습니다.','bad');return;}
    const bad=[];['minPlayers','maxPlayers','gatherMinutes','battleMinutes','turnSeconds','hpPerExtra'].forEach(k=>{if(!(typeof c[k]==='number'&&c[k]>=0))bad.push(k);});if(c.minPlayers>c.maxPlayers)bad.push('minPlayers>maxPlayers');if(c.maxPlayers>GRID*GRID/CELL_CAP-2)bad.push('maxPlayers');if(!Array.isArray(c.phases)||!c.phases.length)bad.push('phases');
    (c.phases||[]).forEach((ph,i)=>{(ph.patterns||[]).forEach(x=>{if(!GRID_PAT[x])bad.push(`phases[${i}] 알 수 없는 패턴 ${x}`);});});if(!c.reward||!c.reward.join||!c.reward.kill)bad.push('reward');
    if(bad.length){toast('설정 오류: '+bad.join(', '),'bad');return;}logChange('만신전 설정',diff(massCfg(),c).map(x=>({...x,before:short(x.before),after:short(x.after)})));S.data.mass=c;save();render();toast('만신전 설정을 저장했습니다.','good');},
  'mass-reset':()=>{if(!isAdmin())return;S.data.mass=clone(DEFAULT_MASS);save();render();toast('기본값으로 되돌렸습니다.');},
  advpick:d=>{S.sel.advPick=d.job;if($('.modal'))ACTS['adv-open2']();else render();},
  'adv-open2':()=>{const pk=S.sel.advPick;modal(`<div class="row" style="justify-content:space-between"><h3>전직</h3><button class="btn btn-sm btn-ghost" data-act="closemodal">닫기</button></div>${advPanel()}`);S.sel.advPick=pk;const mm=$('.modal');if(mm)mm.classList.add('wide');},
  advcancel:()=>{S.sel.advPick=null;if($('.modal'))ACTS['adv-open2']();else render();},
  advconfirm:d=>{const me=S.me,c=CLASSES[me.job];if(c.tier!==1||!c.adv.includes(d.job)||me.level<cfg().jobAdvanceLevel||busyReason())return;
    modal('');doAdvance(d.job);},
  'portrait-open':()=>openCrop(),
  'crop-cancel':()=>{crop=null;modal('');},
  'crop-apply':()=>applyCrop(),
  'crop-center':()=>{if(!crop||!crop.img)return;crop.cx=crop.w/2;crop.cy=crop.h/2;crop.zoom=1;cropZoom(1);},
  'crop-clear':()=>{['portrait','portraitSrc','portraitCrop'].forEach(k=>delete S.me[k]);crop=null;modal('');save();render();toast('기본 이미지로 바꿨습니다.');},
  leavebattle:()=>leaveBattle(),
  equip:d=>{const it=ITEMS[d.id];if(!it||it.type!=='equip'||!(S.me.inv[d.id]>0))return;{const bl=itemBlock(d.id);if(bl){toast(bl,'warn');return;}}S.me.equip[it.slot]=d.id;save();render();toast(`${it.name} 착용`);},
  unequip:d=>{delete S.me.equip[d.slot];save();render();},
  buy:d=>{const it=ITEMS[d.id];if(!it.price||S.me.gold<it.price)return;S.me.gold-=it.price;S.me.inv[d.id]=(S.me.inv[d.id]||0)+1;bump('goldSpent',it.price);bump('purchases');noteItems({[d.id]:1});save();render();toast(`${it.name} 구매 · ${it.price}골드`);},
  whisper:d=>{S.sel.whisperTo=d.name;updateChats();const inp=$('#chat-in-whisper');if(inp)inp.focus();},
  'fr-accept':d=>{S.rel[d.name]='friend';save();render();toast(`${d.name}님과 친구가 되었습니다.`,'good');},
  'fr-decline':d=>{delete S.rel[d.name];save();render();},
  'fr-remove':d=>{delete S.rel[d.name];delete S.unread.whisper[d.name];save();render();},
  'fr-block':d=>{S.rel[d.name]='blocked';delete S.unread.whisper[d.name];save();render();toast(`${d.name}님을 차단했습니다.`);},
  'fr-request':d=>{S.rel[d.name]='out';save();render();toast(`${d.name}님에게 친구 요청을 보냈습니다.`);const b=bot(d.name);if(b&&b.online)later(rnd(2500,5000),()=>{if(S.rel[d.name]==='out'){S.rel[d.name]='friend';toast(`${d.name}님이 친구 요청을 수락했습니다.`,'good');save();if(S.route==='friends')render();else renderTop();}});},
  viewasuser:()=>{S.me.viewAsUser=true;save();go('main');toast('일반 사용자 시점입니다. 화면 위의 버튼으로 운영자 시점에 돌아갈 수 있습니다.');},
  backadmin:()=>{S.me.viewAsUser=false;go('admin');},
  admintab:d=>{S.sel.adminTab=d.tab;S.sel.amErrs=null;S.sel.aqRes=null;render();},
  'am-pick':d=>{S.sel.am=d.id;S.sel.amDraft=null;S.sel.amErrs=null;S.sel.amPreview=null;render();},
  'am-new':()=>{const id='m'+Date.now().toString(36);const base=clone(DEFAULT_MONSTERS[0]);Object.assign(base,{id,name:'새 몬스터',art:'generic',published:false,rev:1,region:'미정',desc:''});
    S.data.monsters.push(base);logChange('몬스터 · 새 몬스터',[{field:'추가',before:undefined,after:id}]);S.sel.am=id;S.sel.amDraft=null;S.sel.amErrs=null;save();render();},
  'am-check':()=>{const d=readAmForm();S.sel.amDraft=d;S.sel.amErrs=validateMonster(d);S.sel.amPreview=d;render();},
  'am-publish':()=>{const d=readAmForm();const errs=validateMonster(d);S.sel.amDraft=d;S.sel.amErrs=errs;S.sel.amPreview=d;if(errs.length){render();toast('검사를 통과하지 못해 저장하지 않았습니다.','bad');return;}
    const i=S.data.monsters.findIndex(m=>m.id===d.id);const before=S.data.monsters[i];const ch=diff(before,d);if(!ch.length){toast('바뀐 내용이 없습니다.');return;}
    d.rev=(before.rev||1)+1;S.data.monsters[i]=d;logChange(`몬스터 · ${d.name}`,ch);S.sel.amDraft=null;save();render();toast('공개했습니다. 새 전투부터 적용됩니다.','good');},
  'am-reset':()=>{S.sel.amDraft=null;S.sel.amErrs=null;S.sel.amPreview=null;render();},
  'aq-pick':d=>{S.sel.aq=d.id;S.sel.aqText=null;S.sel.aqRes=null;render();},
  'aq-new':()=>{let n=1;while(quest('Q'+n))n++;const id='Q'+n;
    const q={id,cat:'sub',title:'새 퀘스트',published:false,level:1,prereq:null,repeat:null,desc:'퀘스트 설명',start:'s1',steps:{s1:{text:'상황문을 입력하세요.',choices:[{label:'선택지 1',result:'결과 문구',next:'end'}]},end:{end:true,text:'완료',reward:{exp:100,gold:30,items:{}}}}};
    S.data.quests.push(q);logChange(`퀘스트 · ${id}`,[{field:'추가',before:undefined,after:id}]);S.sel.aq=id;S.sel.aqText=null;S.sel.aqRes=null;save();render();},
  'aq-check':()=>{const txt=$('#aq-json').value;S.sel.aqText=txt;S.sel.aqFor=S.sel.aq;let q;try{q=JSON.parse(txt);}catch(e){S.sel.aqRes={errs:['JSON 형식 오류: '+e.message]};render();return;}
    const others=S.data.quests.filter(x=>x.id!==S.sel.aq);const errs=validateQuest(q,[...others,q]);if(q.id!==S.sel.aq&&quest(q.id))errs.push(`id ${q.id}는 이미 사용 중입니다`);S.sel.aqRes={errs,preview:q};render();},
  'aq-publish':()=>{ACTS['aq-check']();const r=S.sel.aqRes;if(r.errs.length){toast('검사를 통과하지 못해 저장하지 않았습니다.','bad');return;}
    const q=r.preview;const i=S.data.quests.findIndex(x=>x.id===S.sel.aq);const ch=diff(S.data.quests[i],q);if(!ch.length){toast('바뀐 내용이 없습니다.');return;}
    S.data.quests[i]=q;logChange(`퀘스트 · ${q.title}`,ch.map(c=>({...c,before:short(c.before),after:short(c.after)})));
    if(q.id!==S.sel.aq){S.sel.aq=q.id;}S.sel.aqText=null;S.sel.aqRes=null;save();render();toast('퀘스트를 공개했습니다.','good');},
  'aq-reset':()=>{S.sel.aqText=null;S.sel.aqRes=null;render();},
  'nt-del':d=>{const n=S.data.notices.find(x=>x.id===d.id);S.data.notices=S.data.notices.filter(x=>x.id!==d.id);logChange('공지',[{field:'내림',before:n&&n.title,after:undefined}]);save();render();},
  'rep-done':d=>{const r=S.reports.find(x=>x.id===d.id);if(r){r.done=true;logChange('신고 처리',[{field:r.from,before:'대기',after:'처리됨'}]);}save();render();},
  'op-level':()=>{const v=Math.round(+$('#op-level').value);if(!(v>=1&&v<=cfg().levelCap)){toast(`1~${cfg().levelCap} 사이로 입력하세요.`,'warn');return;}logChange('테스트 · 레벨',[{field:S.me.name,before:S.me.level,after:v}]);S.me.level=v;hpFull();S.me.exp=0;if(S.party){const me=S.party.members.find(x=>x.isMe);if(me)me.level=v;}save();render();toast(`LV${v}로 설정했습니다.`,'good');},
  'op-lv':()=>{const before=S.me.level;S.me.level=Math.min(cfg().levelCap,S.me.level+5);S.me.exp=0;logChange('테스트 · 레벨',[{field:S.me.name,before,after:S.me.level}]);save();render();toast(`LV${S.me.level}`);},
  'op-gold':()=>{S.me.gold+=500;logChange('테스트 · 골드',[{field:S.me.name,before:S.me.gold-500,after:S.me.gold}]);save();render();},
  'op-items':()=>{S.me.inv.potion=(S.me.inv.potion||0)+3;S.me.inv.holywater=(S.me.inv.holywater||0)+3;save();render();toast('회복약과 정화의 성수를 3개씩 추가했습니다.');},
  'op-daily':()=>{S.daily=null;S.dailyQ=null;const c=kstCycle();Object.keys(S.claimedQ).forEach(k=>{if(k.endsWith(':'+c))delete S.claimedQ[k];});S.data.quests.filter(q=>q.repeat).forEach(q=>{if(S.qp[q.id]&&S.qp[q.id].status==='done')delete S.qp[q.id];});logChange('테스트 · 일일 주기',[{field:'반복 퀘스트',before:'완료',after:'초기화'}]);save();render();toast('오늘 주기의 반복 퀘스트를 다시 받을 수 있습니다.');},
  'op-reset':()=>{S.sel.confirmReset=true;render();},
  'op-reset-no':()=>{S.sel.confirmReset=false;render();},
  'op-reset-yes':()=>{timers.forEach(clearTimeout);timers.clear();try{localStorage.removeItem(SAVE);}catch(e){}S=freshState();modal('');save();render();toast('모든 데이터를 초기화했습니다.');}
};

