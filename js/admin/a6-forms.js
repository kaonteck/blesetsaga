'use strict';
/* 운영 페이지 · 콘텐츠 양식 편집기
   칸을 채우면 아래 '코드(검사용)'가 자동으로 채워진다. 공개·초안·검사는 그 코드(#c-json)를 그대로 쓴다.
   - 퀘스트: 장면(대화·전투·완료) 단위 양식. 중간 경로(장소에서 아이템 받기)·조건·2차 선택지·보상은 켜고 끌 수 있다.
   - 그 밖의 종류: 값 모양을 보고 칸을 만든다(글·숫자·켜기/끄기, 묶음 값은 작은 코드 칸).
   고르는 목록은 4개 이하 = 버튼, 5~9개 = 드롭다운, 10개 이상 = 검색해서 고르기. */

let FM=null;            // {k,id,d} 지금 양식이 고치는 데이터(=코드와 같은 객체)
const CB={};            // 검색 목록: key → [[값, 이름, 설명]]
let cbN=0;

/* ── 게임 쪽 목록 ── */
const fw=()=>DEF_FRAME||{};
const fget=(n,dflt)=>{try{const v=fw().eval(n);return v==null?dflt:v;}catch(e){return dflt;}};
const LANDS_L=()=>Object.entries(fget('LANDS',{}));
const SPOTS_L=()=>fget('VIL_SPOTS',[['plaza','광장'],['grocer','식료품점'],['clinic','치료소'],['alley','뒷골목']]);
const GEARS_L=()=>fget('GEAR_TIER',[]).map((g,i)=>[String(i+1),`${g[0]} (LV${g[2]})`]);
const itemsL=()=>Object.entries(ctx().items).map(([id,it])=>[id,it.name||id,[{equip:'장비',use:'소모품',mat:'재료',deco:'장식품'}[it.type]||it.type,it.tag].filter(Boolean).join(' · ')]);
const monsL=()=>Object.entries(liveAll('monster')).map(([id,m])=>[id,m.name||id,[KIND_MON[m.kind]||m.kind,m.level!=null&&'LV'+m.level,m.region].filter(Boolean).join(' · ')]);
const questsL=()=>Object.entries(liveAll('quest')).map(([id,q])=>[id,q.title||id,[{epic:'메인',sub:'서브',repeat:'데일리'}[q.cat]||q.cat,q.level!=null&&'LV'+q.level].filter(Boolean).join(' · ')]);
const flagName=f=>(fget('FLAG_NAMES',{})||{})[f]||'';

/* ── 경로로 값 읽고 쓰기 ── */
function pget(o,p){return p.split('.').reduce((a,k)=>a==null?a:a[k],o);}
function pset(o,p,v){const ks=p.split('.');let a=o;for(let i=0;i<ks.length-1;i++){const k=ks[i];if(a[k]==null||typeof a[k]!=='object')a[k]=/^\d+$/.test(ks[i+1])?[]:{};a=a[k];}
  const last=ks[ks.length-1];if(v===undefined)delete a[last];else a[last]=v;}
const sync=()=>{const ta=$('#c-json');if(ta&&FM)ta.value=pretty(FM.d);};

/* ── 입력 칸 만들기 ── */
const fid=()=>'fm'+(++cbN);
const KSEP='\u241F';
const labH=l=>{l=String(l??'');const i=l.indexOf(KSEP);return i<0?esc(l):`${esc(l.slice(0,i))}<code class="key">${esc(l.slice(i+1))}</code>`;};
function fText(p,label,val,o={}){const id=fid();const v=val??pget(FM.d,p)??'';
  return `<label class="f ${o.wide?'wide':''}" for="${id}"><span class="fl">${labH(label)}</span>${o.hint?`<small class="faint">${esc(o.hint)}</small>`:''}${o.area?`<textarea id="${id}" data-p="${p}" data-t="${o.t||'str'}" rows="${o.rows||3}" placeholder="${esc(o.ph||'')}">${esc(v)}</textarea>`:`<input id="${id}" type="${o.num?'number':'text'}" data-p="${p}" data-t="${o.num?'num':(o.t||'str')}" value="${esc(v)}" placeholder="${esc(o.ph||'')}" ${o.min!=null?`min="${o.min}"`:''}>`}</label>`;}
function fNum(p,label,o={}){return fText(p,label,null,{...o,num:true});}
function fCheck(p,label,val){const v=val??!!pget(FM.d,p);return `<label class="chk"><input type="checkbox" data-p="${p}" data-t="bool" ${v?'checked':''}> <span class="fl">${labH(label)}</span></label>`;}
/* 고르기: 4개 이하 버튼 · 5~9 드롭다운 · 10개 이상 검색 */
function fPick(p,label,opts,o={}){const cur=o.val!==undefined?o.val:pget(FM.d,p);const curS=cur==null?'':String(cur);const t=o.t||'str';const act=o.act?`data-fa="${o.act}"`:'';
  const head=label?`<span class="fl">${labH(label)}${o.hint?` <small class="faint">${esc(o.hint)}</small>`:''}</span>`:'';
  if(opts.length<=4)return `<div class="f ${o.wide?'wide':''}">${head}<div class="seg" role="radiogroup">${opts.map(([v,l])=>`<button type="button" role="radio" class="sg" aria-checked="${String(v)===curS}" data-p="${p}" data-t="${t}" data-v="${esc(v)}" ${act}>${esc(l)}</button>`).join('')}</div></div>`;
  if(opts.length<10){const id=fid();return `<label class="f ${o.wide?'wide':''}" for="${id}">${head}<select id="${id}" data-p="${p}" data-t="${t}" ${act}>${opts.map(([v,l])=>`<option value="${esc(v)}" ${String(v)===curS?'selected':''}>${esc(l)}</option>`).join('')}</select></label>`;}
  const key='cb'+(++cbN);CB[key]=opts;const hit=opts.find(x=>String(x[0])===curS);
  return `<div class="f ${o.wide?'wide':''}">${head}<div class="cb" data-cb="${key}" data-p="${p}" data-t="${t}" ${act}><input type="search" class="cb-in" value="${esc(hit?hit[1]:curS)}" placeholder="${esc(o.ph||'이름으로 검색')}" autocomplete="off" aria-label="${esc(label||'검색')}"><span class="cb-id faint">${esc(hit&&hit[1]!==curS?curS:'')}</span><div class="cb-list" hidden></div></div></div>`;}
/* 켜고 끄는 묶음 */
function fToggle(key,label,on,body){on=on||!!(FM&&FM.tgOn&&FM.tgOn[key]);   // 켠 직후 값이 비어 있어도 켜진 채로
  return `<div class="tg ${on?'on':''}"><label class="chk tg-h"><input type="checkbox" data-fa="toggle" data-k="${key}" ${on?'checked':''}> ${esc(label)}</label>${on?`<div class="tg-b">${body}</div>`:''}</div>`;}

/* ───────── 퀘스트 양식 ───────── */
const ROUTE_RE=/\s*\((?:탐색 › [^)]+)\)\s*$/;
function hintOf(st){const g=st.give;if(!g||st._noRoute)return '';const L=Object.fromEntries(LANDS_L()),Sp=Object.fromEntries(SPOTS_L());
  const land=g.land==='@theft'?'오늘의 도둑 지역':(L[g.land]||g.land||'?');return ` (탐색 › ${land} › 마을 › ${Sp[g.spot]||g.spot||'?'})`;}
function fixHint(st){if(!st||st.end||st.battle)return;const body=String(st.text||'').replace(ROUTE_RE,'');st.text=body+hintOf(st);}
function stepOrder(q){const ks=Object.keys(q.steps||{});const st=q.steps||{};
  const non=ks.filter(k=>!st[k].end),ends=ks.filter(k=>st[k].end);
  if(q.start&&non.includes(q.start)){non.splice(non.indexOf(q.start),1);non.unshift(q.start);}
  return [...non,...ends];}
function newSid(q,pre){let i=1;while(q.steps[(pre||'s')+i])i++;return (pre||'s')+i;}
function sceneName(q,k){const ord=stepOrder(q);const st=q.steps[k];if(!st)return k;if(st.end)return `완료${ord.filter(x=>q.steps[x].end).length>1?' · '+k:''}`;return `장면 ${ord.filter(x=>!q.steps[x].end).indexOf(k)+1}`;}
function nextOpts(q,self){const ord=stepOrder(q);return [...ord.map(k=>[k,(k===self?'이 장면 다시':sceneName(q,k))+(q.steps[k].battle?' (전투)':'')])];}

function questForm(q){
  q.steps=q.steps||{};q.cond=q.cond||{};
  const cat=[['epic','메인'],['sub','서브'],['repeat','데일리']];
  const ord=stepOrder(q);const ends=ord.filter(k=>q.steps[k].end),scenes=ord.filter(k=>!q.steps[k].end);
  const c=q.cond;const condOn=!!(c.quests&&c.quests.length||c.level||c.adv||c.item||(c.flags&&c.flags.length));
  return `<div class="fm">
  <section class="fm-sec"><h4>퀘스트</h4><div class="fgrid">
    ${fText('title','퀘스트 이름',null,{wide:true})}
    ${fPick('cat','분류',cat,{act:'cat'})}
    ${fPick('land','시작 지역',[['','정하지 않음'],...LANDS_L()],{hint:'퀘스트 목록 안내용'})}
    ${fNum('level','받을 수 있는 레벨',{min:1})}
    ${fText('desc','퀘스트 소개',null,{wide:true,area:true,rows:2,hint:'퀘스트 목록에서 보이는 설명'})}
    ${fPick('prereq','먼저 끝내야 할 퀘스트',[['','없음'],...questsL().filter(x=>x[0]!==FM.id)],{wide:true,t:'strnull'})}
    <div class="wide">${fToggle('cond','열리는 조건 더하기',condOn,`<div class="fgrid">
      ${listPicker('cond.quests','완료해야 하는 퀘스트',questsL().filter(x=>x[0]!==FM.id))}
      ${fNum('cond.level','최소 레벨',{min:0})}
      ${fPick('cond.item','갖고 있어야 하는 아이템',[['','없음'],...itemsL()],{t:'strnull'})}
      ${fCheck('cond.adv','전직을 마쳐야 함')}</div>`)}</div>
    <div class="wide row">${fCheck('published','유저에게 보이기')}</div>
  </div></section>
  ${flowHTML(q,ord)}
  ${scenes.map((k,i)=>scnWrap(q,k,sceneForm(q,k,i))).join('')}
  <div class="row"><button type="button" class="btn btn-sm" data-fa="add-scene">+ 대화 장면</button><button type="button" class="btn btn-sm" data-fa="add-battle">+ 전투 장면</button>${ends.length?'':'<button type="button" class="btn btn-sm" data-fa="add-end">+ 완료</button>'}</div>
  ${ends.map(k=>scnWrap(q,k,endForm(q,k))).join('')}
  </div>`;
}
/* 장면 접기: 열린 장면은 퀘스트마다 기억(양식을 다시 그려도 유지) */
const SCN_OPEN={};
function scnSet(){const key=FM.k+':'+FM.id;if(!SCN_OPEN[key])SCN_OPEN[key]=new Set([FM.d.start||stepOrder(FM.d)[0]]);return SCN_OPEN[key];}
function flowHTML(q,ord){if(!ord.length)return '';
  return `<div class="flow"><span>흐름</span>${ord.map(k=>{const st=q.steps[k];return `<button type="button" class="n ${st.battle?'b':st.end?'e':''}" data-scn="${esc(k)}">${esc(sceneName(q,k))}${st.end&&!/·/.test(sceneName(q,k))?' · '+esc(k):''}</button>`;}).join('<span>→</span>')}</div>`;}
function scnWrap(q,k,html){const st=q.steps[k];const isB=!!st.battle,isE=!!st.end;
  const first=isB?((liveData('monster',st.battle)||{}).name||st.battle||'몬스터를 고르세요'):String(st.text||'').replace(ROUTE_RE,'').split('\n')[0];
  const to=isE?(st.reward?'보상':'보상 없음'):isB?'전투':`선택지 ${(st.choices||[]).length}개`;
  return `<details class="scn ${isB?'battle':isE?'end':''}" data-scn-k="${esc(k)}" ${scnSet().has(k)?'open':''}><summary><b>${esc(sceneName(q,k))}</b><span class="s">${esc(first.slice(0,80))}</span><span class="to">${to}</span></summary>${html}</details>`;}
function listPicker(p,label,opts){const cur=pget(FM.d,p)||[];const name=id=>(opts.find(x=>x[0]===id)||[id,id])[1];
  return `<div class="f wide"><span class="fl">${esc(label)}</span><div class="row">${cur.map((id,i)=>`<span class="chip info">${esc(name(id))} <button type="button" class="x" data-fa="list-del" data-lp="${p}" data-i="${i}" aria-label="빼기">×</button></span>`).join('')}</div>
    ${fPick('',null,opts.filter(x=>!cur.includes(x[0])),{val:'',act:'list-add',ph:'검색해서 더하기'}).replace(/data-p=""/g,`data-p="" data-lp="${p}"`)}</div>`;}
function sceneForm(q,k,i){const st=q.steps[k];const p='steps.'+k;const isB=!!st.battle;
  const head=`<div class="sc-h"><h4>${esc(sceneName(q,k))}${q.start===k?' <span class="chip ok">시작</span>':''}</h4><div class="row">
    ${fPick('',null,[['talk','대화'],['battle','전투']],{val:isB?'battle':'talk',act:'scene-type'}).replace(/data-p=""/g,`data-p="" data-k="${k}"`)}
    ${q.start!==k?`<button type="button" class="btn btn-g btn-sm" data-fa="make-start" data-k="${k}">시작으로</button>`:''}
    <button type="button" class="btn btn-g btn-sm" data-fa="del-scene" data-k="${k}">장면 삭제</button></div></div>`;
  if(isB){const m=liveData('monster',st.battle)||{};
    return `<section class="fm-sec scene battle">${head}<div class="fgrid">
      ${fText(p+'.text','전투 전 장면 글',null,{wide:true,area:true,rows:2})}
      ${sceneImg(q,k)}
      ${fPick(p+'.battle','등장 몬스터',monsL(),{wide:true})}
      ${st.battle?`<p class="wide faint small mon-info">${m.name?`${esc(m.name)} · ${esc(KIND_MON[m.kind]||m.kind||'')} · LV${m.level??'?'} · HP ${m.hp??'?'} · 공격 ${m.atk??'?'}${m.sphases?` · 페이즈 ${m.sphases.length}개`:''} — 퀘스트 전투는 혼자 싸우는 개인 레이드, 지면 이 장면부터 다시 도전`:'몬스터를 찾을 수 없습니다.'}</p>`:''}
      ${fText(p+'.winText','이기면 나오는 글',null,{wide:true,area:true,rows:2})}
      ${fPick(p+'.next','이긴 뒤 이어지는 곳',nextOpts(q,k).filter(x=>x[0]!==k),{wide:true})}
    </div></section>`;}
  const g=st.give;const body=String(st.text||'').replace(ROUTE_RE,'');
  return `<section class="fm-sec scene">${head}<div class="fgrid">
    ${sceneImg(q,k)}
    <label class="f wide">${i?'장면 글':'퀘스트 내용 (첫 장면 글)'}<textarea data-fa="scene-text" data-k="${k}" rows="3">${esc(body)}</textarea><small class="faint">기록 불러내기: <code>{{mem:기록|문장}}</code> → 그 기록이 있을 때만 문장이 보임 · <code>{{mem:!기록|문장}}</code> = 없을 때만</small>${g&&!st._noRoute?`<small class="faint">끝에 길 안내가 붙습니다:${esc(hintOf(st))}</small>`:''}</label>
    <div class="wide">${fToggle('give:'+k,'중간 경로 · 장소에서 퀘스트 아이템 받기',!!g,g?`<div class="fgrid">
      ${fPick(p+'.give.land','지역',[...LANDS_L(),['@theft','오늘의 도둑 지역']],{act:'hint',t:'str'})}
      ${fPick(p+'.give.spot','장소 (마을)',SPOTS_L(),{act:'hint'})}
      ${fPick(p+'.give.item','퀘스트 아이템',itemsL(),{wide:true})}
      ${fNum(p+'.give.n','개수',{min:1})}
      ${fText(p+'.give.npc','NPC')}
      ${fText(p+'.give.text','NPC 행동 · 대사',null,{wide:true,area:true,rows:2})}
      <div class="wide"><label class="chk"><input type="checkbox" data-fa="route" data-k="${k}" ${st._noRoute?'':'checked'}> 장면 글 끝에 길 안내 붙이기</label></div></div>`:'')}</div>
  </div>
  <div class="chs">${(st.choices||[]).map((c,j)=>choiceForm(q,k,c,j)).join('')}</div>
  <button type="button" class="btn btn-sm" data-fa="add-choice" data-k="${k}">+ 선택지</button></section>`;}
// 장면 그림: 켜면 이미지 칸(장면 글 위에 나옴)
function sceneImg(q,k){const st=q.steps[k];const on=st._img||!!st.img;
  return `<div class="wide">${fToggle('img:'+k,'장면 그림 넣기',on,on?imgRow('steps.'+k+'.img','장면 그림','퀘스트 화면에서 장면 글 위에 나옴','quest/'):'')}</div>`;}
function reqKind(r){if(!r)return '';for(const k of ['item','items','gold','level','flag'])if(r[k]!=null)return k;return '';}   // 값이 아직 비어 있어도(item:'') 그 종류
function choiceForm(q,k,c,j){const p=`steps.${k}.choices.${j}`;const rk=reqKind(c.req);
  const tgt=q.steps[c.next];const second=!!(tgt&&!tgt.end&&!tgt.battle&&tgt._second);
  if(c.glitch)return `<div class="ch"><div class="ch-h"><b>선택지 ${j+1}</b><span class="chip warn">일부러 넣은 오류 · 눌러도 1초 화면이 깨졌다 돌아옴</span><button type="button" class="btn btn-g btn-sm" data-fa="del-choice" data-k="${k}" data-i="${j}">삭제</button></div>${fText(p+'.label','선택지 문구')}</div>`;
  const reqBody=`${fPick('',null,[['item','받은 아이템 확인'],['items','아이템 내기'],['gold','골드 내기'],['level','레벨'],['flag','기록']],{val:rk,act:'req-kind'}).replace(/data-p=""/g,`data-p="" data-k="${k}" data-i="${j}"`)}
    ${rk==='item'?fPick(p+'.req.item','갖고 있어야 하는 아이템',itemsL()):''}
    ${rk==='items'?itemsRows(p+'.req.items','내야 하는 아이템 (선택하면 가져감)',true):''}
    ${rk==='gold'?fNum(p+'.req.gold','내야 하는 골드',{min:1}):''}
    ${rk==='level'?fNum(p+'.req.level','필요한 레벨',{min:1}):''}
    ${rk==='flag'?fText(p+'.req.flag','필요한 기록 이름',null,{hint:flagName(c.req.flag)}):''}`;
  return `<div class="ch"><div class="ch-h"><b>선택지 ${j+1}</b><button type="button" class="btn btn-g btn-sm" data-fa="del-choice" data-k="${k}" data-i="${j}">삭제</button></div><div class="fgrid">
    ${fText(p+'.label','선택지 문구',null,{wide:true})}
    ${fText(p+'.result','선택지 결과 (고른 뒤 나오는 글)',null,{wide:true,area:true,rows:2})}
    ${fPick(p+'.next','이어지는 곳',nextOpts(q,k),{wide:true,hint:c.next===k?'같은 장면 다시 = 준비가 안 됐을 때 되돌아오기':''})}
    <div class="wide">${fToggle(`second:${k}:${j}`,'2차 선택지 (이 선택 뒤에 한 번 더 고르기)',second,second?`<p class="faint small" style="margin:0">아래 「${esc(sceneName(q,c.next))}」에서 이어지는 선택지를 적으세요.</p>`:'')}</div>
    <div class="wide">${fToggle(`req:${k}:${j}`,'조건 (이 선택지를 고르려면)',!!rk,reqBody)}</div>
    <div class="wide">${fToggle(`flag:${k}:${j}`,'기록 남기기 (다른 퀘스트·조건에서 확인)',c.flag!=null,fText(p+'.flag','기록 이름 (영문)',null,{hint:flagName(c.flag)}))}</div>
  </div></div>`;}
function itemsRows(p,label,takeToo){const o=pget(FM.d,p)||{};
  return `<div class="f wide"><span class="fl">${esc(label)}</span>${Object.entries(o).map(([id,n])=>{const nm=(ctx().items[id]||{}).name||id;
    return `<div class="row ir"><span class="grow">${esc(nm)} <small class="faint">${esc(id)}</small></span><input type="number" min="1" class="nsm" data-fa="items-n" data-lp="${p}" data-id="${esc(id)}" data-take="${takeToo?1:''}" value="${n}" aria-label="${esc(nm)} 개수"><button type="button" class="btn btn-g btn-sm" data-fa="items-del" data-lp="${p}" data-id="${esc(id)}" data-take="${takeToo?1:''}">빼기</button></div>`;}).join('')}
    ${fPick('',null,itemsL().filter(x=>!(x[0] in o)),{val:'',act:'items-add',ph:'아이템 검색해서 더하기'}).replace(/data-p=""/g,`data-p="" data-lp="${p}" data-take="${takeToo?1:''}"`)}</div>`;}
function endForm(q,k){const st=q.steps[k];const p='steps.'+k;const r=st.reward;
  const rw=r?`<div class="fgrid">${fNum(p+'.reward.exp','경험치',{min:0})}${fNum(p+'.reward.gold','골드',{min:0})}
    ${itemsRows(p+'.reward.items','아이템 보상')}
    ${fPick(p+'.reward.gearTier','장비 보상 (내 클래스 무기 1개)',[['','없음'],...GEARS_L()],{t:'numnull'})}</div>`:'';
  return `<section class="fm-sec scene end"><div class="sc-h"><h4>결과 · ${esc(sceneName(q,k))}</h4><button type="button" class="btn btn-g btn-sm" data-fa="del-scene" data-k="${k}">삭제</button></div><div class="fgrid">
    ${fText(p+'.text','퀘스트 완료 이름',null,{wide:true,hint:'탐사 기록·보상 받기에 보이는 이름'})}
    <div class="wide">${fToggle('reward:'+k,'보상',!!r,rw)}</div></div></section>`;}

/* ───────── 그 밖의 종류: 값 모양대로 ───────── */
const FLABEL={name:'이름',title:'제목',kind:'종류',region:'지역',level:'레벨',hp:'체력',atk:'공격력',def:'방어력',exp:'경험치',gold:'골드',published:'유저에게 보이기',desc:'설명',
  type:'종류',price:'가격',sell:'판매가',stock:'재고 (비우면 무제한)',item:'아이템',text:'내용',date:'날짜',loc:'위치',reward:'보상',link:'바로가기',min:'최소 인원',max:'최대 인원',target:'목표 인원',
  singleName:'단일 공격 이름',singleMult:'단일 공격 배율',aoeName:'광역 공격 이름',aoeMult:'광역 배율',aoeEvery:'광역 주기(턴)',topEvery:'대미지 1위 공격 주기(턴)',topName:'대미지 1위 공격 이름',topMult:'대미지 1위 공격 배율',dotName:'지속 피해 이름',dotChance:'지속 피해 확률',dotDmg:'지속 피해량',
  hpScale:'인원당 체력 증가',art:'그림',img:'이미지',tag:'분류 표시',slot:'장착 칸',levelReq:'착용 레벨',maxOwn:'최대 보유',roles:'필요 역할',drops:'드롭',stats:'능력치',buff:'버프',maxLevel:'최대 레벨'};
const FPICK={
  monster:{kind:Object.entries({field:'필드',dungeon:'던전',party:'파티 레이드',weekly:'토벌전',event:'만신전',story:'퀘스트 전투'}),art:[['beast','짐승'],['golem','골렘'],['spirit','정령'],['dragon','용'],['human','인간']]},
  item:{type:[['use','소모품'],['equip','장비'],['mat','재료'],['deco','장식품']],slot:[['weapon','무기'],['armor','방어구'],['acc','장신구']]},
  event:{kind:[['event','이벤트'],['boss','보스 출현'],['maint','점검']]},
};
// 칸 묶음 [제목, 작은 설명, 칸들] — 묶음에 없는 칸은 '그 밖의 값'
const FGROUP={
  monster:[['기본 정보','이름·종류·그림',['id','kind','name','art','img','region','published','desc']],['레벨 · 인원','',['level','maxLevel','min','max','target','roles']],['능력치','',['hp','hpScale','atk','def']],['공격 패턴','기본 공격 · 패턴 더하기',['singleName','singleMult','aoeName','aoeMult','aoeEvery','topEvery','topName','topMult','dotName','dotChance','dotDmg','sphases','mass']],['보상','',['exp','gold','drops']]],
  item:[['기본 정보','',['id','type','name','tag','desc','art','img','published']],['능력치','버프',['stats','buff','heal','dura','enh']],['착용 조건','',['slot','levelReq','classReq','wtype','maxOwn']],['가격','',['price','sell']]],
};
function genericForm(k,d){
  const keys=Object.keys(d);const P=FPICK[k]||{};
  const isMass=k==='monster'&&d.kind==='event';
  if(k==='monster')(isMass?['drops','mass']:['drops','sphases']).forEach(x=>{if(!keys.includes(x))keys.push(x);});
  if((k==='monster'||k==='item')&&!keys.includes('img'))keys.splice(Math.max(0,keys.indexOf(k==='item'?'desc':'art')+1),0,'img');
  const row=key=>{const v=d[key];const lab=FLABEL[key]?FLABEL[key]+KSEP+key:key;
    if(k==='monster'){
      if(key==='kind')return isMass?'':fPick('kind',lab,MON_CAT);
      if(key==='drops')return dropsRows();
      if(key==='art')return '';   // 예전 글자 그림 고르기 — 이제 게임에서 안 씀(그림이 없으면 임시 이미지)
      if(key==='img')return monImgRow();
      if(key==='noImg')return '';   // '이미지 없이 보이기' — 이미지 칸 안의 체크로 다룸
      if(key==='sphases')return phasesForm();
      if(key==='mass')return massForm();}
    if(k==='item'&&key==='img')return imgRow('img','이미지','상점에서 같은 아이템에도 그대로 · 긴 변 512px로 줄여 저장','item/');
    if(k==='market'&&key==='item')return fPick(key,lab,itemsL(),{wide:true});
    if(P[key])return fPick(key,lab,P[key]);
    if(typeof v==='boolean')return `<div class="f">${fCheck(key,lab)}</div>`;
    if(typeof v==='number'||v===null&&['stock','maxLevel'].includes(key))return fText(key,lab,v??'',{num:true,t:'numnull'});
    if(typeof v==='string')return fText(key,lab,null,{wide:v.length>40||['desc','text','title','name'].includes(key),area:v.length>60||['desc','text'].includes(key)});
    const id=fid();return `<label class="f wide" for="${id}"><span class="fl">${labH(lab)}</span> <small class="faint">묶음 값 (코드)</small><textarea id="${id}" class="code sm" data-p="${key}" data-t="json" rows="${Math.min(8,pretty(v).split('\n').length)}">${esc(pretty(v))}</textarea></label>`;};
  const used=new Set();
  const secs=(FGROUP[k]||[]).map(([t,sub,ks])=>{const have=ks.filter(x=>keys.includes(x));have.forEach(x=>used.add(x));
    return have.length?{t,sub,body:have.map(row).join('')}:null;}).filter(Boolean);
  const rest=keys.filter(x=>!used.has(x));
  const delWrap=key=>{const h=row(key);if(!h||key==='id'||(!secs.length&&key in (BLANK[k]||{})))return h;const wide=/^<(?:label|div) class="f wide|^<div class="wide/.test(h);
    return `<div class="kd ${wide?'wide':''}">${h}<button type="button" class="kd-x" data-fa="del-key" data-key="${esc(key)}" title="${esc(key)} 칸 삭제" aria-label="${esc(key)} 칸 삭제">삭제</button></div>`;};
  if(rest.length||!secs.length)secs.push({t:secs.length?'그 밖의 값':KINDS[k].label,sub:secs.length?'기타':'',body:rest.map(delWrap).join('')});
  const addRow=`<div class="row" style="margin-top:8px"><input type="text" id="fm-newkey" placeholder="새 칸 이름 (영문)" style="max-width:200px"><button type="button" class="btn btn-sm" data-fa="add-key">+ 칸 더하기</button></div>`;
  return `<div class="fm">${secs.map((x,i)=>`<section class="fm-sec"><h4>${esc(x.t)}${x.sub?` <i>${esc(x.sub)}</i>`:''}</h4><div class="fgrid">${x.body}</div>${i===secs.length-1?addRow:''}</section>`).join('')}</div>`;}

/* ── 몬스터: 아이템 보상(드롭) — 검색해서 더하고 확률(%)만 적기 ── */
function dropsRows(){const arr=Array.isArray(FM.d.drops)?FM.d.drops:[];const nm=id=>(ctx().items[id]||{}).name||id;
  return `<div class="f wide"><span class="fl">${labH('아이템 보상'+KSEP+'drops')} <small class="faint">이기면 아이템마다 확률대로 1개씩</small></span>
    ${arr.map(([id,c],i)=>`<div class="row ir"><span class="grow">${esc(nm(id))} <small class="faint">${esc(id)}</small></span><input type="number" min="0" max="100" step="0.5" class="nsm" data-fa="drop-n" data-i="${i}" value="${Math.round((+c||0)*1000)/10}" aria-label="${esc(nm(id))} 확률(%)"><span class="faint small">%</span><button type="button" class="btn btn-g btn-sm" data-fa="drop-del" data-i="${i}">빼기</button></div>`).join('')||'<p class="faint small" style="margin:0 0 6px">아직 없습니다.</p>'}
    ${fPick('',null,itemsL().filter(x=>!arr.some(d=>d[0]===x[0])),{val:'',act:'drop-add',ph:'아이템 검색해서 더하기'})}</div>`;}
/* ── 몬스터(만신전 말고): 체력에 따라 바뀌는 공격 패턴(sphases) ── */
const SPH_F=[['at','체력 % 이하','num'],['name','패턴 이름'],['atkMul','공격력 배율','num'],['say','바뀔 때 대사'],['singleName','단일 공격 이름'],['singleMult','단일 배율','num'],['aoeName','광역 공격 이름'],['aoeMult','광역 배율','num'],['aoeEvery','광역 주기(턴)','num'],['topEvery','대미지 1위 공격 주기(턴)','num'],['topName','대미지 1위 공격 이름'],['topMult','대미지 1위 배율','num'],['dotName','지속 피해 이름'],['dotChance','지속 피해 확률','num']];
function phasesForm(){const P=Array.isArray(FM.d.sphases)?FM.d.sphases:[];
  return `<div class="f wide"><span class="fl">${labH('공격 패턴 더하기'+KSEP+'sphases')} <small class="faint">체력이 정한 % 아래로 내려가면 다음 턴부터 그 패턴으로 바뀜 · 비운 칸은 위 기본 공격 그대로</small></span>
    ${P.map((ph,i)=>{const extra=Object.keys(ph).filter(f=>!SPH_F.some(x=>x[0]===f));
      return `<div class="ch"><div class="ch-h"><b>패턴 ${i+1}${ph.name?' · '+esc(ph.name):''}</b><button type="button" class="btn btn-g btn-sm" data-fa="sph-del" data-i="${i}">삭제</button></div><div class="fgrid">${SPH_F.map(([f,l,t])=>fText(`sphases.${i}.${f}`,l+KSEP+f,null,{num:t==='num',t:t==='num'?'num':'stropt',wide:f==='say'})).join('')}</div>${extra.length?`<p class="faint small" style="margin:6px 0 0">그 밖의 값 (코드에서): ${esc(extra.join(', '))}</p>`:''}</div>`;}).join('')}
    <div class="row"><button type="button" class="btn btn-sm" data-fa="sph-add">+ 공격 패턴</button></div></div>`;}
/* ── 만신전: 이 보스만의 패턴·페이즈(mass) ── */
const MPATS=()=>fget('DEFAULT_PATS',{});const MPDESC=()=>fget('PAT_DESC',{});
function massForm(){const M=FM.d.mass;const D=MPATS();const on=!!(M&&(M.patterns||M.phases));
  const body=on?`<table class="pt"><thead><tr><th>패턴</th><th>이름</th><th>배율</th><th>보스 대사</th></tr></thead><tbody>${Object.keys(D).map(pk=>{const cur=(M.patterns||{})[pk]||{};
      return `<tr><td><b>${esc(D[pk].name)}</b><small class="faint">${esc(MPDESC()[pk]||pk)}</small></td><td><input type="text" data-p="mass.patterns.${pk}.name" data-t="stropt" value="${esc(cur.name??D[pk].name)}" aria-label="${esc(D[pk].name)} 이름"></td><td><input type="number" step="0.05" min="0" data-p="mass.patterns.${pk}.mult" data-t="num" value="${cur.mult??D[pk].mult}" aria-label="${esc(D[pk].name)} 배율"></td><td><input type="text" data-p="mass.lines.${pk}" data-t="stropt" value="${esc((M.lines||{})[pk]||'')}" placeholder="비우면 기본 대사" aria-label="${esc(D[pk].name)} 대사"></td></tr><tr class="pt-fx"><td colspan="4">${pfxRow(pk,cur)}</td></tr>`;}).join('')}</tbody></table>
    <div class="stack" style="gap:6px;margin-top:8px">${(M.phases||[]).map((ph,i)=>`<div class="ch"><div class="ch-h"><b>페이즈 ${i+1}</b><button type="button" class="btn btn-g btn-sm" data-fa="mph-del" data-i="${i}">삭제</button></div><div class="fgrid">
      ${fText(`mass.phases.${i}.at`,'체력 % 이하'+KSEP+'at',null,{num:true})}${fText(`mass.phases.${i}.name`,'페이즈 이름'+KSEP+'name')}${fText(`mass.phases.${i}.atkMul`,'공격력 배율'+KSEP+'atkMul',null,{num:true})}
      <div class="f wide"><span class="fl">이 페이즈에 쓰는 패턴</span>${mphPats(M,ph,i)}</div></div></div>`).join('')}
      <div class="row"><button type="button" class="btn btn-sm" data-fa="mph-add">+ 페이즈</button></div></div>${cpForm(M)}`:'';
  return `<div class="wide">${`<div class="tg ${on?'on':''}"><label class="chk tg-h"><input type="checkbox" data-fa="mass-own" ${on?'checked':''}> 이 보스만의 공격 패턴 쓰기 <small class="faint">끄면 만신전 공통 규칙(설정)의 패턴을 씀</small></label>${on?`<div class="tg-b">${body}</div>`:''}</div>`}</div>`;}

/* ───────── 그리기 · 연결 ───────── */
function formHTML(k,id,cur){FM={k,id,d:clone(cur)};Object.keys(CB).forEach(x=>delete CB[x]);
  if(k==='setting')return '';   // 설정은 값이 많아 코드로
  return `<div id="fm-box">${k==='quest'?questForm(FM.d):genericForm(k,FM.d)}</div>`;}
function redrawForm(){const box=$('#fm-box');if(!box||!FM)return;const y=window.scrollY;Object.keys(CB).forEach(x=>delete CB[x]);
  box.innerHTML=FM.k==='quest'?questForm(FM.d):genericForm(FM.k,FM.d);sync();bindForm();window.scrollTo(0,y);}
function readVal(el,raw){const t=el.dataset.t;let v=raw!==undefined?raw:el.type==='checkbox'?el.checked:el.value;
  if(t==='bool')return !!v;if(t==='num'){if(v===''||v==null)return undefined;const n=Number(v);return isNaN(n)?undefined:n;}
  if(t==='numnull'){if(v===''||v==null)return null;const n=Number(v);return isNaN(n)?null:n;}
  if(t==='strnull')return v===''?null:v;if(t==='stropt')return v===''?undefined:v;if(t==='json'){try{return JSON.parse(v);}catch(e){el.classList.add('bad');return Symbol.for('bad');}}
  return v;}
function setP(el,raw){const p=el.dataset.p;if(!p)return;const v=readVal(el,raw);if(v===Symbol.for('bad'))return;el.classList&&el.classList.remove('bad');
  pset(FM.d,p,v);if(p.startsWith('steps.')){const sk=p.split('.')[1];fixHint(FM.d.steps[sk]);}
  if(FM.k==='quest'&&p==='cat'){FM.d.repeat=v==='repeat'?'daily':null;}
  if(FM.k==='quest'&&/\.reward\.gearTier$/.test(p)&&v==null)pset(FM.d,p,undefined);
  if(FM.k==='quest'&&/\.req\.gold$/.test(p))pset(FM.d,p.replace(/\.req\.gold$/,'.takeGold'),v);
  sync();}
function bindForm(){const box=$('#fm-box');if(!box)return;
  $$('input[data-p]:not(.cb-in),textarea[data-p],select[data-p]',box).forEach(el=>{
    const ev=el.tagName==='SELECT'||el.type==='checkbox'?'change':'input';
    el.addEventListener(ev,()=>{if(el.dataset.fa)return fAct(el.dataset.fa,el,el.value);setP(el);if(el.tagName==='SELECT'&&/\.(next|battle)$/.test(el.dataset.p))redrawForm();});});
  $$('.sg',box).forEach(b=>b.onclick=()=>{if(b.dataset.fa)return fAct(b.dataset.fa,b,b.dataset.v);setP(b,b.dataset.v);redrawForm();});
  $$('[data-fa]:not(.sg):not(select):not(.cb)',box).forEach(el=>{
    if(el.type==='checkbox')el.onchange=()=>fAct(el.dataset.fa,el,el.checked);
    else if(el.tagName==='TEXTAREA'||el.type==='number')el.oninput=()=>fAct(el.dataset.fa,el,el.value);
    else el.onclick=()=>fAct(el.dataset.fa,el);});
  $$('.cb',box).forEach(bindCB);
  if(FM.k==='quest'){
    $$('details.scn',box).forEach(d=>d.addEventListener('toggle',()=>{const S=scnSet();if(d.open)S.add(d.dataset.scnK);else S.delete(d.dataset.scnK);}));
    $$('.flow [data-scn]',box).forEach(b=>b.onclick=()=>{const d=box.querySelector(`details.scn[data-scn-k="${CSS.escape(b.dataset.scn)}"]`);if(!d)return;d.open=true;scnSet().add(b.dataset.scn);d.scrollIntoView({behavior:'smooth',block:'start'});});}
}
function bindCB(cb){const inp=$('.cb-in',cb),list=$('.cb-list',cb);const opts=CB[cb.dataset.cb]||[];let shown=[];let hi=-1;
  const draw=()=>{const t=inp.value.trim().toLowerCase();shown=opts.filter(o=>!t||String(o[0]).toLowerCase().includes(t)||String(o[1]).toLowerCase().includes(t)||String(o[2]||'').toLowerCase().includes(t)).slice(0,60);hi=-1;
    list.innerHTML=shown.length?shown.map((o,i)=>`<button type="button" class="cb-o" data-i="${i}"><b>${esc(o[1])}</b><small class="faint">${esc(o[0])}${o[2]?' · '+esc(o[2]):''}</small></button>`).join(''):'<p class="faint small" style="margin:6px 8px">결과 없음</p>';list.hidden=false;
    $$('.cb-o',list).forEach(b=>b.onmousedown=e=>{e.preventDefault();choose(shown[+b.dataset.i]);});};
  const choose=o=>{list.hidden=true;inp.value=o[1];if(cb.dataset.fa)return fAct(cb.dataset.fa,cb,o[0]);setP(cb,o[0]);redrawForm();};
  inp.onfocus=()=>{inp.select();draw();};inp.oninput=draw;
  inp.onkeydown=e=>{const bs=$$('.cb-o',list);if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();hi=Math.max(0,Math.min(bs.length-1,hi+(e.key==='ArrowDown'?1:-1)));bs.forEach((b,i)=>b.classList.toggle('hi',i===hi));if(bs[hi])bs[hi].scrollIntoView({block:'nearest'});}
    else if(e.key==='Enter'){e.preventDefault();const o=shown[hi>=0?hi:0];if(o)choose(o);}else if(e.key==='Escape'){list.hidden=true;inp.blur();}};
  inp.onblur=()=>setTimeout(()=>{list.hidden=true;const cur=pget(FM.d,cb.dataset.p||'');const h=opts.find(x=>String(x[0])===String(cur));if(cb.dataset.p)inp.value=h?h[1]:(cur??'');else inp.value='';},120);}

/* 구조를 바꾸는 동작 */
function refsTo(q,k){return Object.entries(q.steps).filter(([sk,st])=>sk!==k&&(st.next===k||(st.choices||[]).some(c=>c.next===k))).length;}
function fAct(a,el,v){const q=FM.d,k=el.dataset.k,i=el.dataset.i!=null?+el.dataset.i:null;
  const firstEnd=()=>Object.keys(q.steps).find(x=>q.steps[x].end);
  const ensureEnd=()=>firstEnd()||(q.steps.end={end:true,text:'완료',reward:{exp:10,gold:10}},'end');
  switch(a){
    case 'cat':setP(el,v);break;
    case 'hint':setP(el,v);break;
    case 'scene-text':{const st=q.steps[k];st.text=String(v)+hintOf(st);sync();return;}
    case 'route':{const st=q.steps[k];if(v)delete st._noRoute;else st._noRoute=true;fixHint(st);break;}
    case 'toggle':{const key=el.dataset.k,[t,a1,a2]=key.split(':');FM.tgOn=FM.tgOn||{};if(v)FM.tgOn[key]=1;else delete FM.tgOn[key];
      if(t==='cond'){q.cond=v?(q.cond||{}):{};}
      else if(t==='give'){const st=q.steps[a1];if(v)st.give={land:FM.d.land||LANDS_L()[0][0],spot:'plaza',item:'',n:1,npc:'',text:''};else delete st.give;fixHint(st);}
      else if(t==='img'){const st=q.steps[a1];if(v)st._img=true;else{delete st._img;delete st.img;}}
      else if(t==='reward'){const st=q.steps[a1];if(v)st.reward={exp:10,gold:10};else delete st.reward;}
      else if(t==='req'){const c=q.steps[a1].choices[+a2];if(v)c.req={item:''};else{delete c.req;delete c.take;delete c.takeGold;}}
      else if(t==='flag'){const c=q.steps[a1].choices[+a2];if(v)c.flag='';else delete c.flag;}
      else if(t==='second'){const c=q.steps[a1].choices[+a2];
        if(v){const sid=newSid(q);scnSet().add(sid);q.steps[sid]={text:'',_second:true,choices:[{label:'',result:'',next:c.next||ensureEnd()}]};c.next=sid;}
        else{const s2=q.steps[c.next];const back=s2&&s2.choices&&s2.choices[0]?s2.choices[0].next:ensureEnd();const old=c.next;c.next=back;if(s2&&refsTo(q,old)===0)delete q.steps[old];}}
      break;}
    case 'add-scene':{const sid=newSid(q);scnSet().add(sid);q.steps[sid]={text:'',choices:[{label:'',result:'',next:ensureEnd()}]};if(!q.start||!q.steps[q.start])q.start=sid;break;}
    case 'add-battle':{const sid=newSid(q);scnSet().add(sid);q.steps[sid]={text:'',battle:'',winText:'',next:ensureEnd()};if(!q.start||!q.steps[q.start])q.start=sid;break;}
    case 'add-end':scnSet().add(ensureEnd());break;
    case 'make-start':q.start=k;break;
    case 'del-scene':{FM.tgOn={};if(!confirm(`「${sceneName(q,k)}」을(를) 지울까요? 이 장면으로 이어지던 선택지는 완료로 바뀝니다.`))return;delete q.steps[k];
      const e=firstEnd()||ensureEnd();Object.values(q.steps).forEach(st=>{if(st.next===k)st.next=e;(st.choices||[]).forEach(c=>{if(c.next===k)c.next=e;});});
      if(q.start===k)q.start=stepOrder(q).find(x=>!q.steps[x].end)||e;break;}
    case 'scene-type':{const st=q.steps[k];if(v==='battle'&&!st.battle){const nx=(st.choices&&st.choices[0]&&st.choices[0].next)||ensureEnd();delete st.choices;delete st.give;st.battle=st.battle||'';st.winText=st.winText||'';st.next=nx;st.text=String(st.text||'').replace(ROUTE_RE,'');}
      else if(v==='talk'&&st.battle){const nx=st.next||ensureEnd();delete st.battle;delete st.winText;delete st.next;st.choices=[{label:'',result:'',next:nx}];}break;}
    case 'add-choice':{const st=q.steps[k];st.choices=st.choices||[];st.choices.push({label:'',result:'',next:ensureEnd()});break;}
    case 'del-choice':{FM.tgOn={};const st=q.steps[k];st.choices.splice(i,1);break;}
    case 'req-kind':{const c=q.steps[k].choices[i];delete c.take;delete c.takeGold;
      c.req=v==='item'?{item:''}:v==='items'?{items:{}}:v==='gold'?{gold:100}:v==='level'?{level:q.level||1}:{flag:''};if(v==='items')c.take={};if(v==='gold')c.takeGold=100;break;}
    case 'list-add':{const p=el.dataset.lp;const arr=pget(q,p)||[];if(!arr.includes(v))arr.push(v);pset(q,p,arr);break;}
    case 'list-del':{const p=el.dataset.lp;const arr=pget(q,p)||[];arr.splice(i,1);pset(q,p,arr.length?arr:undefined);break;}
    case 'items-add':case 'items-n':case 'items-del':{const p=el.dataset.lp;const o=pget(q,p)||{};const id=a==='items-add'?v:el.dataset.id;
      if(a==='items-add')o[id]=1;else if(a==='items-n'){const n=Math.max(1,parseInt(v,10)||1);o[id]=n;}else delete o[id];pset(q,p,o);
      if(el.dataset.take){const tp=p.replace(/\.req\.items$/,'.take');pset(q,tp,{...o});}
      if(a==='items-n'){sync();return;}break;}
    case 'drop-add':{const arr=Array.isArray(q.drops)?q.drops:[];arr.push([v,0.1]);q.drops=arr;break;}
    case 'drop-n':{const n=Math.max(0,Math.min(100,parseFloat(v)||0));if(q.drops&&q.drops[i])q.drops[i][1]=Math.round(n*10)/1000;sync();return;}
    case 'drop-del':{q.drops.splice(i,1);break;}
    case 'sph-add':{const P=Array.isArray(q.sphases)?q.sphases:[];if(!P.length)P.push({at:100,name:'1페이즈'});const last=P[P.length-1];
      P.push({at:Math.max(5,(last.at||100)-(P.length===1?40:25)),name:`${P.length+1}페이즈`,atkMul:Math.round(((last.atkMul||1)+0.3)*10)/10});q.sphases=P;break;}
    case 'sph-del':{q.sphases.splice(i,1);if(!q.sphases.length)delete q.sphases;break;}
    case 'mass-own':{if(v){const C0=fget('massCfg()',{})||{};q.mass={...(q.mass||{}),patterns:clone(MPATS()),phases:clone(C0.phases||[{at:100,name:'1페이즈',atkMul:1,patterns:['single']}])};}
      else if(q.mass){delete q.mass.patterns;delete q.mass.phases;delete q.mass.lines;if(!Object.keys(q.mass).length)delete q.mass;}break;}
    case 'mph-add':{const P=q.mass.phases=q.mass.phases||[];const last=P[P.length-1]||{at:100,atkMul:1};P.push({at:P.length?Math.max(5,last.at-25):100,name:`${P.length+1}페이즈`,atkMul:P.length?Math.round(((last.atkMul||1)+0.1)*100)/100:1,patterns:['single']});break;}
    case 'mph-del':{q.mass.phases.splice(i,1);break;}
    case 'cp-add':{const P=q.mass.patterns=q.mass.patterns||{};let n=1;while(P['c'+n])n++;P['c'+n]={name:`광역 ${n}`,mult:0.9,custom:true,aim:false,cells:[],offs:[]};CP_OPEN.add('c'+n);break;}
    case 'cp-del':{const key=el.dataset.k;delete q.mass.patterns[key];if(q.mass.lines)delete q.mass.lines[key];(q.mass.phases||[]).forEach(ph=>{ph.patterns=(ph.patterns||[]).filter(x=>x!==key);});break;}
    case 'cp-mode':{const P=q.mass.patterns[el.dataset.k];P.aim=el.dataset.v==='aim';break;}
    case 'cp-cell':{const P=q.mass.patterns[el.dataset.k];const c=+el.dataset.c;if(P.aim){const o=[+el.dataset.r,+el.dataset.cc];const j=(P.offs=P.offs||[]).findIndex(x=>x[0]===o[0]&&x[1]===o[1]);if(j>=0)P.offs.splice(j,1);else P.offs.push(o);}
      else{const a=P.cells=P.cells||[];const j=a.indexOf(c);if(j>=0)a.splice(j,1);else a.push(c);a.sort((x,y)=>x-y);}break;}
    case 'cp-clear':{const P=q.mass.patterns[el.dataset.k];if(P.aim)P.offs=[];else P.cells=[];break;}
    case 'cp-fill':{const P=q.mass.patterns[el.dataset.k];const G=fget('GRID',10),B=fget('BOSS_CELLS',[44,45,54,55]);const sh=el.dataset.v;const out=[];
      for(let i=0;i<G*G;i++){const r=Math.floor(i/G),c=i%G;if(B.includes(i))continue;
        if(sh==='rows-even'&&r%2===0||sh==='cols-even'&&c%2===0||sh==='check'&&(r+c)%2===0||sh==='edge'&&(r===0||c===0||r===G-1||c===G-1)||sh==='left'&&c<G/2||sh==='right'&&c>=G/2||sh==='top'&&r<G/2||sh==='bottom'&&r>=G/2)out.push(i);}
      P.aim=false;P.cells=out;break;}
    case 'mph-pat':{const ph=q.mass.phases[i];const a=ph.patterns=ph.patterns||[];if(v){if(!a.includes(k))a.push(k);}else ph.patterns=a.filter(x=>x!==k);break;}
    case 'del-key':{const key=el.dataset.key;if(key&&key in q)delete q[key];break;}
    case 'add-key':{const nk=($('#fm-newkey').value||'').trim();if(!/^[A-Za-z_]\w*$/.test(nk))return toast('칸 이름은 영문·숫자·_로 적어 주세요.','bad');if(nk in q)return toast('이미 있는 칸입니다.','bad');q[nk]='';break;}
  }
  // 골드 내기는 낼 골드도 같이
  Object.values(q.steps||{}).forEach(st=>(st.choices||[]).forEach(c=>{if(c.req&&c.req.gold){c.takeGold=c.req.gold;}}));
  redrawForm();}
// 코드 → 양식
function codeToForm(){const d=parseEditor();if(!d)return;FM.d=d;redrawForm();showCheck(null,'코드 내용을 양식에 반영했습니다.');}

/* ── 몬스터 이미지(img): 올리면 monster-art 버킷에 저장하고 주소를 img 칸에 넣는다 · 메인 2026-11-05 ──
   PNG·JPG·WEBP·GIF, 긴 변 512px로 줄여 WEBP로 저장(GIF는 움직임 유지를 위해 그대로, 2MB 이하). 지우면 게임은 임시 이미지(img/mon-placeholder.png)로 돌아감 */
const MONART_BUCKET='monster-art';
function monImgRow(){return imgRow('img','이미지','비우면 게임에 임시 이미지 · 긴 변 512px로 줄여 저장','');}
/* 몬스터 '이미지 없이 보이기'(noImg): 켜면 게임에서 그림 칸 자체를 안 그림(올린 이미지·임시 이미지 모두) · 메인 2026-11-07 */
/* 이미지 칸(몬스터·아이템·퀘스트 장면 공통): p = 값 경로, pre = 버킷 안 폴더 */
function imgRow(p,label,hint,pre){const u=pget(FM.d,p)||'';const sid=('imgst-'+p).replace(/[^\w-]/g,'_');
  return `<div class="f wide monimg"><span class="fl">${labH(label+KSEP+p.split('.').pop())} <small class="faint">${esc(hint)}</small></span>
    <div class="row" style="gap:12px;align-items:flex-start">
      <div class="monimg-pv">${pre===''&&FM.d.noImg?'<span class="faint small">이미지 없이 보임</span>':u?`<img src="${esc(u)}" alt="미리보기">`:pre===''?'<img class="ph" src="img/mon-placeholder.png" alt="임시 이미지"><span class="ph-l">임시 이미지</span>':'<span class="faint small">이미지 없음</span>'}</div>
      <div class="stack" style="gap:6px"><label class="btn btn-sm">이미지 올리기<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" class="hide" data-fimg="${esc(p)}" data-fpre="${esc(pre)}" data-fst="${sid}"></label>
        ${u?`<button type="button" class="btn btn-g btn-sm" data-fa="img-clear" data-ip="${esc(p)}">이미지 빼기</button>`:''}<small class="faint" id="${sid}"></small>
        ${pre===''&&p==='img'?`<label class="row" style="gap:6px;align-items:center;font-size:13px"><input type="checkbox" data-fa="img-none" ${FM.d.noImg?'checked':''}> 이미지 없이 보이기 <small class="faint">(임시 이미지도 안 나옴)</small></label>`:''}</div></div></div>`;}
function monImgResize(file){return new Promise((res,rej)=>{if(file.type==='image/gif'){if(file.size>2097152)rej(new Error('GIF는 2MB 이하만 올릴 수 있습니다'));else res(file);return;}
  const url=URL.createObjectURL(file);const im=new Image();im.onload=()=>{const k=Math.min(1,512/Math.max(im.width,im.height));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*k));c.height=Math.max(1,Math.round(im.height*k));
    c.getContext('2d').drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(url);c.toBlob(b=>b?res(b):rej(new Error('이미지를 변환하지 못했습니다')),'image/webp',0.9);};
  im.onerror=()=>{URL.revokeObjectURL(url);rej(new Error('이미지를 읽지 못했습니다'));};im.src=url;});}
async function monImgUpload(file,p,pre,sid){p=p&&p!=='1'?p:'img';pre=pre||'';const st=$('#'+(sid||'imgst-img'));if(st)st.textContent='올리는 중…';
  try{if(!/^image\/(png|jpeg|webp|gif)$/.test(file.type))throw new Error('PNG·JPG·WEBP·GIF만 올릴 수 있습니다');
    const blob=await monImgResize(file);const ext=blob.type==='image/gif'?'gif':'webp';const id=String(FM.d.id||FM.id||'monster').replace(/[^a-zA-Z0-9_-]/g,'_');
    const path=`${pre}${id}/${Date.now().toString(36)}.${ext}`;
    const {error}=await A.sb.storage.from(MONART_BUCKET).upload(path,blob,{contentType:blob.type,upsert:false,cacheControl:'31536000'});if(error)throw error;
    const {data}=A.sb.storage.from(MONART_BUCKET).getPublicUrl(path);pset(FM.d,p,data.publicUrl);sync();redrawForm();toast('이미지를 올렸습니다. 저장(게시)하면 게임에 나타납니다.','good');}
  catch(e){if(st)st.textContent='';if(e&&e.message==='cancel')return;toast('이미지 올리기 실패 · '+((e&&e.message)||e),'bad');}}
(function(){const f=bindForm;bindForm=function(){f();const box=$('#fm-box');if(!box)return;
  $$('input[data-fimg]',box).forEach(el=>el.onchange=()=>{const fl=el.files&&el.files[0];if(fl)monImgUpload(fl,el.dataset.fimg,el.dataset.fpre,el.dataset.fst);el.value='';});};})();
(function(){const f=fAct;fAct=function(a,el,v){if(a==='img-none'){const on=el.checked;if(on)FM.d.noImg=true;else delete FM.d.noImg;sync();redrawForm();return;}if(a==='img-clear'){pset(FM.d,el.dataset.ip||'img',undefined);sync();redrawForm();return;}return f(a,el,v);};})();

/* ── 만신전: 칸을 찍어 만드는 광역 패턴(mass.patterns.cN = {name,mult,custom,aim,cells|offs}) · 메인 2026-11-05 ──
   고정 위치: 10×10 전장에서 맞을 칸을 찍는다(가운데 2×2는 보스). 대상 기준: 무작위 1명(★)을 가운데 둔 7×7에서 찍는다 → 그 사람이 선 자리 기준으로 떨어진다. */
const CP_OPEN=new Set();
const cpKeys=M=>Object.keys((M&&M.patterns)||{}).filter(k=>M.patterns[k]&&M.patterns[k].custom);
function cpBoard(key,P){const G=fget('GRID',10),B=fget('BOSS_CELLS',[44,45,54,55]);
  if(P.aim){const R=3,on=new Set((P.offs||[]).map(o=>o[0]+','+o[1]));let h='';for(let dr=-R;dr<=R;dr++)for(let dc=-R;dc<=R;dc++){const me=dr===0&&dc===0,k=dr+','+dc;
      h+=`<button type="button" class="cpc ${on.has(k)?'on':''} ${me?'tg':''}" data-fa="cp-cell" data-k="${key}" data-r="${dr}" data-cc="${dc}" aria-pressed="${on.has(k)}" aria-label="대상에서 ${dr}행 ${dc}열">${me?'★':''}</button>`;}
    return `<div class="cpg" style="--n:${2*R+1}">${h}</div>`;}
  const on=new Set(P.cells||[]);let h='';for(let i=0;i<G*G;i++){const boss=B.includes(i);const nm='ABCDEFGHIJ'[Math.floor(i/G)]+(i%G+1);
    h+=boss?`<span class="cpc boss" aria-hidden="true"></span>`:`<button type="button" class="cpc ${on.has(i)?'on':''}" data-fa="cp-cell" data-k="${key}" data-c="${i}" aria-pressed="${on.has(i)}" aria-label="${nm}" title="${nm}"></button>`;}
  return `<div class="cpg" style="--n:${G}">${h}</div>`;}
function cpForm(M){const ks=cpKeys(M);
  return `<div class="cp-wrap"><div class="ch-h" style="margin-top:12px"><b>직접 만든 광역 패턴</b><small class="faint">칸을 눌러 맞을 자리를 고른 뒤, 위 페이즈에서 체크하면 그 페이즈에 나옵니다</small></div>
    ${ks.map(key=>{const P=M.patterns[key];const n=P.aim?(P.offs||[]).length:(P.cells||[]).length;
      return `<details class="ch cp" ${CP_OPEN.has(key)?'open':''} data-cp="${key}"><summary class="ch-h"><b>${esc(P.name||key)}</b> <small class="faint">${key} · ${P.aim?'대상 기준':'고정 위치'} · ${n}칸 · 배율 ${P.mult??0.9}</small></summary>
        <div class="fgrid">${fText(`mass.patterns.${key}.name`,'이름'+KSEP+'name')}${fText(`mass.patterns.${key}.mult`,'배율'+KSEP+'mult',null,{num:true})}
        <label class="f wide"><span class="fl">보스 대사 <small class="faint">예고 때 뜨는 말 · 비우면 없음</small></span><input type="text" data-p="mass.lines.${key}" data-t="stropt" value="${esc((M.lines||{})[key]||'')}"></label></div>
        <div class="row" style="gap:6px;margin:8px 0"><span class="seg"><button type="button" class="${P.aim?'':'on'}" data-fa="cp-mode" data-k="${key}" data-v="fix" aria-pressed="${!P.aim}">고정 위치</button><button type="button" class="${P.aim?'on':''}" data-fa="cp-mode" data-k="${key}" data-v="aim" aria-pressed="${!!P.aim}">대상 기준</button></span>
          ${P.aim?'':`<select data-fa="cp-fill" data-k="${key}" aria-label="빠른 채우기"><option value="">빠른 채우기…</option>${[['rows-even','짝수 줄'],['cols-even','짝수 열'],['check','체크무늬'],['edge','가장자리'],['left','왼쪽 절반'],['right','오른쪽 절반'],['top','위쪽 절반'],['bottom','아래쪽 절반']].map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select>`}
          <button type="button" class="btn btn-g btn-sm" data-fa="cp-clear" data-k="${key}">칸 모두 지우기</button><button type="button" class="btn btn-g btn-sm" data-fa="cp-del" data-k="${key}" style="margin-left:auto">패턴 삭제</button></div>
        <div style="margin:6px 0">${pfxRow(key,P)}</div>${cpBoard(key,P)}<p class="faint small" style="margin-top:6px">${P.aim?'★ = 무작위로 고른 블레서 한 명이 선 칸. 전장 밖으로 나가는 칸·보스 칸은 빠집니다.':'가운데 2×2는 보스 칸이라 고를 수 없습니다. 고른 칸에 선 블레서가 맞습니다.'}</p></details>`;}).join('')}
    <div class="row"><button type="button" class="btn btn-sm" data-fa="cp-add">+ 광역 패턴 만들기</button></div></div>`;}
(function(){const f=bindForm;bindForm=function(){f();const box=$('#fm-box');if(!box)return;
  $$('details.cp',box).forEach(d=>d.addEventListener('toggle',()=>{if(d.open)CP_OPEN.add(d.dataset.cp);else CP_OPEN.delete(d.dataset.cp);}));
  $$('select[data-fa="cp-fill"]',box).forEach(el=>el.onchange=()=>{if(el.value){el.dataset.v=el.value;fAct('cp-fill',el,el.value);}});};})();

/* 프론트 2026-11-07(유저 요청): 페이즈마다 쓰는 패턴도 추가 효과와 같은 모양 — 고른 패턴 칩 + '패턴 더하기' 드롭다운 */
function mphPats(M,ph,i){const D=MPATS();const all=[...Object.keys(D),...cpKeys(M)];const cur=(ph.patterns||[]).filter(k=>all.includes(k));
  const nm=pk=>((M.patterns||{})[pk]||{}).name||(D[pk]||{}).name||pk;const off=all.filter(k=>!cur.includes(k));
  return `<div class="pfx">${cur.map(pk=>`<span class="pfx-c" title="${esc(MPDESC()[pk]||'')}"><b>${esc(nm(pk))}</b>${D[pk]?'':'<span class="pfx-u">직접</span>'}<button type="button" class="pfx-x" data-fa="mph-pat" data-i="${i}" data-k="${esc(pk)}" aria-label="${esc(nm(pk))} 빼기" title="빼기">×</button></span>`).join('')}${cur.length?'':'<span class="pfx-none">없음(기본 공격)</span>'}${off.length?`<select class="pfx-add" data-mph-add data-i="${i}" aria-label="페이즈 ${i+1} 패턴 더하기"><option value="">+ 패턴 더하기</option>${off.map(pk=>`<option value="${esc(pk)}">${esc(nm(pk))}${D[pk]?(MPDESC()[pk]?' · '+esc(MPDESC()[pk]):''):' · 직접 만든 패턴'}</option>`).join('')}</select>`:''}</div>`;}
(function(){const f=bindForm;bindForm=function(){f();const box=$('#fm-box');if(!box)return;
  $$('select[data-mph-add]',box).forEach(el=>el.onchange=()=>{if(!el.value)return;el.dataset.k=el.value;fAct('mph-pat',el,true);});};})();
/* ── 만신전 패턴 추가 효과(대미지와 함께, 여러 개 고를 수 있음) · 메인 2026-11-07 ──
   저장: mass.patterns.<패턴>.fx = {knock:{c},delay:{},bind:{t},frost:{},poison:{d,t},burn:{d,t},reflect:{r},confuse:{t}} — 게임 엔진 resolveTurn ⑥이 읽음 */
const PFX=[['knock','넉백','맞은 블레서를 보스 반대쪽으로 밀어냄',[['c','칸',2]]],['delay','시간차 공격','이번 턴엔 예고만, 다음 턴에 터짐',[]],['bind','속박','n턴 행동 불가(이동·스킬 모두)',[['t','턴',1]]],['frost','동상','다음 1턴 이동 불가',[]],
  ['poison','중독','턴마다 HP − n, n턴',[['d','대미지',20],['t','턴',3]]],['burn','화상','턴마다 HP − n, n턴',[['d','대미지',20],['t','턴',3]]],['reflect','반사','이번 턴 보스가 받은 대미지를 때린 블레서에게 되돌림',[['r','%',100]]],['confuse','혼란','n턴 동안 내 행동 대신 주변 블레서에게 기본 공격',[['t','턴',1]]]];
function pfxRow(pk,cur){const fx=(cur&&cur.fx)||{};const on=PFX.filter(x=>fx[x[0]]),off=PFX.filter(x=>!fx[x[0]]);
  /* 프론트 2026-11-07(유저 요청): 체크박스 8개 → 켠 효과만 칩 + '효과 더하기' 드롭다운 */
  return `<div class="pfx"><span class="pfx-l">추가 효과</span>${on.map(([k,l,d,ps])=>`<span class="pfx-c" title="${esc(d)}"><b>${esc(l)}</b>${ps.map(([pp,pl,dv])=>`<input type="number" min="1" step="1" class="nsm" data-p="mass.patterns.${pk}.fx.${k}.${pp}" data-t="num" value="${fx[k][pp]??dv}" aria-label="${esc(l)} ${pl}"><span class="pfx-u">${pl}</span>`).join('')}<button type="button" class="pfx-x" data-fa="pfx" data-k="${esc(pk)}" data-f="${k}" aria-label="${esc(l)} 빼기" title="빼기">×</button></span>`).join('')}${on.length?'':'<span class="pfx-none">없음</span>'}${off.length?`<select class="pfx-add" data-pfx-add data-k="${esc(pk)}" aria-label="추가 효과 더하기"><option value="">+ 효과 더하기</option>${off.map(([k,l,d])=>`<option value="${k}">${esc(l)} · ${esc(d)}</option>`).join('')}</select>`:''}</div>`;}
(function(){const f=bindForm;bindForm=function(){f();const box=$('#fm-box');if(!box)return;
  $$('select[data-pfx-add]',box).forEach(el=>el.onchange=()=>{if(!el.value)return;el.dataset.f=el.value;fAct('pfx',el,true);});};})();
(function(){const f=fAct;fAct=function(a,el,v){if(a==='pfx'){const k=el.dataset.k,ff=el.dataset.f;const M=FM.d.mass=FM.d.mass||{};const P=(M.patterns=M.patterns||{});const D=MPATS();P[k]=P[k]||{name:(D[k]||{}).name,mult:(D[k]||{}).mult};
    const fx=P[k].fx=P[k].fx||{};if(v){const def=(PFX.find(x=>x[0]===ff)||[])[3]||[];fx[ff]=Object.fromEntries(def.map(([pp,,dv])=>[pp,dv]));}else delete fx[ff];if(!Object.keys(fx).length)delete P[k].fx;sync();redrawForm();return;}return f(a,el,v);};})();

/* ── 이미지 올리기: 캐릭터 이미지처럼 위치·크기 맞추기(끌어서 이동 · 휠/막대로 확대) · 메인 2026-11-07 ──
   몬스터·아이템 1:1(512×512), 퀘스트 장면 16:9(960×540). GIF는 움직임 유지를 위해 그대로. '자르지 않고 올리기'는 예전처럼 긴 변 512px */
function imgCrop(file,pre){return new Promise((res,rej)=>{const url=URL.createObjectURL(file);const im=new Image();
  im.onerror=()=>{URL.revokeObjectURL(url);rej(new Error('이미지를 읽지 못했습니다'));};
  im.onload=()=>{const wide=pre==='quest/';const OW=wide?960:512,OH=wide?540:512;const FW=wide?480:320,FH=wide?270:320;
    const base=Math.max(FW/im.width,FH/im.height);const st={z:1,cx:im.width/2,cy:im.height/2};let done=false;
    modal(`<h3>이미지 위치 · 크기</h3><p class="faint small" style="margin:0 0 8px">끌어서 위치를 옮기고, 휠이나 막대로 크기를 조절하세요. 칸 밖은 잘립니다.</p>
      <div class="crop-f" style="width:${FW}px;height:${FH}px"><canvas width="${FW}" height="${FH}"></canvas></div>
      <div class="row" style="gap:8px;margin-top:10px;align-items:center"><span class="faint small">크기</span><input type="range" id="crop-z" min="30" max="400" value="100" style="flex:1"><span class="num small" id="crop-zv">100%</span></div>
      <div class="row" style="gap:6px;margin-top:12px;justify-content:flex-end"><button type="button" class="btn btn-g btn-sm" id="crop-full">자르지 않고 올리기</button><button type="button" class="btn btn-sm" data-close-btn>취소</button><button type="button" class="btn btn-p btn-sm" id="crop-ok">적용</button></div>`);
    const cv=$('.crop-f canvas'),ctx=cv.getContext('2d');
    const draw=(c,W,H,k)=>{c.clearRect(0,0,W,H);const sc=base*st.z*k;c.drawImage(im,W/2-st.cx*sc,H/2-st.cy*sc,im.width*sc,im.height*sc);};
    const redraw=()=>{draw(ctx,FW,FH,1);$('#crop-zv').textContent=Math.round(st.z*100)+'%';$('#crop-z').value=Math.round(st.z*100);};redraw();
    let drag=null;cv.onpointerdown=e=>{drag={x:e.clientX,y:e.clientY};cv.setPointerCapture(e.pointerId);};
    cv.onpointermove=e=>{if(!drag)return;const sc=base*st.z;st.cx-=(e.clientX-drag.x)/sc;st.cy-=(e.clientY-drag.y)/sc;drag={x:e.clientX,y:e.clientY};redraw();};
    cv.onpointerup=cv.onpointercancel=()=>{drag=null;};
    cv.onwheel=e=>{e.preventDefault();st.z=Math.max(0.3,Math.min(4,st.z*(e.deltaY<0?1.08:1/1.08)));redraw();};
    $('#crop-z').oninput=e=>{st.z=Math.max(0.3,Math.min(4,(+e.target.value||100)/100));redraw();};
    const fin=v=>{if(done)return;done=true;URL.revokeObjectURL(url);modal(null);res(v);};
    $('#crop-ok').onclick=()=>{const o=document.createElement('canvas');o.width=OW;o.height=OH;draw(o.getContext('2d'),OW,OH,OW/FW);o.toBlob(b=>b?fin(b):rej(new Error('이미지를 변환하지 못했습니다')),'image/webp',0.9);};
    $('#crop-full').onclick=()=>fin('full');
    const mo=$('#modal');const obs=new MutationObserver(()=>{if(!mo.innerHTML&&!done){done=true;URL.revokeObjectURL(url);obs.disconnect();rej(new Error('cancel'));}});obs.observe(mo,{childList:true});};
  im.src=url;});}
(function(){const f=monImgResize;monImgResize=async function(file){if(file.type==='image/gif')return f(file);const pre=monImgResize._pre||'';
  const r=await imgCrop(file,pre);return r==='full'?f(file):r;};})();
(function(){const f=monImgUpload;monImgUpload=function(file,p,pre,sid){monImgResize._pre=pre||'';return f(file,p,pre,sid);};})();
