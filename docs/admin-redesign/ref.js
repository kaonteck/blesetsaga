/* 운영 페이지 개편 참고 구현 — 지금 화면의 DOM을 docs/admin-redesign.md 마크업으로 바꿔 보는 시험용 스크립트(게임·운영 페이지에서 불러오지 않음). */
window.MK={
 IC:{home:'<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',content:'<path d="M4 4h16v4H4zM4 10h10v10H4zM16 10h4v10h-4z"/>',players:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18 14.6c2 .7 3.2 2.6 3.6 5.4"/>',mail:'<path d="M3 6h18v12H3z"/><path d="M3 7l9 6 9-6"/>',invites:'<path d="M4 7h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4z"/><path d="M12 7v12" stroke-dasharray="2 2"/>',inbox:'<path d="M4 4h16v12H8l-4 4z"/>',chat:'<path d="M4 5h16v10H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',feed:'<path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h8M8 17h5"/>',lotto:'<circle cx="12" cy="12" r="8"/><path d="M12 8v8M8 12h8"/>',fish:'<path d="M3 12c3-5 9-6 13-3l5-3v12l-5-3c-4 3-10 2-13-3z"/>',guard:'<path d="M12 3l8 3v6c0 5-3.4 8.2-8 9-4.6-.8-8-4-8-9V6z"/><path d="M12 8v5M12 16h.01"/>',log:'<path d="M6 3h9l4 4v14H6z"/><path d="M9 11h7M9 15h7"/>'},
 GROUPS:[['',[['home','홈']]],['콘텐츠',[['content','콘텐츠 편집']]],['유저',[['players','회원'],['mail','우편 보내기'],['invites','초대코드']]],['커뮤니티',[['inbox','문의 · 신고',2],['chat','채팅'],['feed','피드']]],['게임 운영',[['lotto','행운권'],['fish','낚시 랭킹']]],['보안',[['guard','부정 의심'],['log','운영 기록']]]],
 DESC:{content:'몬스터·퀘스트·아이템 등 게임 데이터를 고치고 공개합니다.',players:'가입한 블레서를 찾고 세이브·레벨·우편·정지를 관리합니다.',mail:'전체 또는 골라 둔 블레서에게 골드·아이템이 담긴 우편을 보냅니다.',invites:'새 블레서가 가입할 때 쓰는 코드를 만들고 관리합니다.',inbox:'1:1 문의에 답하고 신고된 글을 처리합니다.',chat:'전체·월드·1:1 채팅을 살피고 문제 메시지를 가립니다.',feed:'커뮤니티 글과 댓글을 살피고 가립니다.',lotto:'주간 행운권 회차·판매·당첨 현황입니다.',fish:'이번 주 지역별 낚시 순위와 지난 주 정산 기록입니다.',guard:'서버가 말이 안 되는 변화를 자르거나 기록한 계정입니다.',log:'운영자가 한 일이 모두 남습니다.'},
 side(on){const ic=k=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${this.IC[k]}</svg>`;
  let a=document.querySelector('.side');if(!a){const app=document.querySelector('#app');app.classList.add('shell');app.querySelector('.top').remove();a=document.createElement('aside');a.className='side';app.prepend(a);}
  a.innerHTML=`<div class="side-brand">블레셋 전기<small>운영 페이지</small></div><nav class="side-nav" role="tablist">`+this.GROUPS.map(([g,it])=>`<div class="nav-g">${g?`<span class="nav-gl">${g}</span>`:''}${it.map(([k,l,b])=>`<button class="tab" role="tab" data-tab="${k}" aria-selected="${k===on}">${ic(k)}${l}${b?`<span class="num">${b}</span>`:''}</button>`).join('')}</div>`).join('')+`</nav><div class="side-me"><span>운영자 (admin)</span><div class="row"><a class="btn btn-sm" href="./">게임 열기</a><button class="btn btn-g btn-sm">로그아웃</button></div></div>`;a.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{if(b.dataset.tab==='home')MK.home();else{go(b.dataset.tab);}});},
 head(t,k){const v=document.querySelector('#view');const h=document.createElement('div');h.className='ph';h.innerHTML=`<div><h1>${t}</h1><p>${this.DESC[k]||''}</p></div>`;v.prepend(h);},
 home(){this.side('home');const v=document.querySelector('#view');v.innerHTML=`<div class="ph"><div><h1>오늘의 운영</h1><p>11월 5일 (목) 17:24 · 처리할 일이 3건 있습니다.</p></div></div>
  <div class="dash-cards">
   <div class="dash-card ok"><small>지금 접속 중</small><b>1</b><em>최근 10분 · 전체 회원 3명</em></div>
   <div class="dash-card alert"><small>답하지 않은 문의</small><b>1</b><em>가장 오래된 것 11-05 17:24</em></div>
   <div class="dash-card alert"><small>처리 안 한 신고</small><b>1</b><em>채팅 1건</em></div>
   <div class="dash-card"><small>부정 의심</small><b>0</b><em>새 기록 없음</em></div></div>
  <div class="dash-two"><div class="panel"><h3>처리할 일</h3><div class="todo">
   <div class="todo-i"><span class="dot bad"></span><div class="t"><b>1:1 문의 · 아린</b><small>버그 신고 · "장비가 사라졌어요" · 11-05 17:24</small></div><button class="btn btn-sm btn-p">답하기</button></div>
   <div class="todo-i"><span class="dot bad"></span><div class="t"><b>채팅 신고 · 아린 → 벨라</b><small>도배 · "도배 메시지"</small></div><button class="btn btn-sm">보기</button></div>
   <div class="todo-i"><span class="dot warn"></span><div class="t"><b>행운권 2026-11-06 회차</b><small>내일 20:00 추첨 · 3장 판매</small></div><button class="btn btn-sm">보기</button></div>
  </div></div>
  <div class="panel"><h3>최근 운영 기록 <a class="small" href="#">모두 보기 ›</a></h3><div class="todo">
   <div class="todo-i"><div class="t"><b>몬스터 「변이된 숲의 파수꾼」 공개</b><small>운영자 · 11-05 17:20</small></div></div>
   <div class="todo-i"><div class="t"><b>우편 보내기 · 전체 회원 3명</b><small>운영자 · 11-05 16:58 · 500G</small></div></div>
   <div class="todo-i"><div class="t"><b>초대코드 BLESET01 만들기</b><small>운영자 · 11-05 16:40</small></div></div>
  </div></div></div>`;},
 KEYG:[['기본 정보','이름·종류·그림',['id','kind','name','art','region','published','desc']],['레벨 · 인원','',['level','maxLevel','min','max','target','roles']],['능력치','',['hp','hpScale','atk','def']],['공격 패턴','단일 · 광역 · 지속 피해',['singleName','singleMult','aoeName','aoeMult','aoeEvery','dotName','dotChance','dotDmg']],['보상','',['exp','gold','drops']]],
 labels(root){root.querySelectorAll('.f').forEach(f=>{const tgt=f.querySelector('.fl')||f;const tn=[...tgt.childNodes].find(n=>n.nodeType===3&&n.textContent.includes(' · '));if(!tn)return;const [ko,en]=tn.textContent.split(' · ');const r=document.createElement('span');r.className='fl';r.innerHTML=`${ko}<code class="key">${en}</code>`;tn.replaceWith(r);});},
 acts(){const h=document.querySelector('.ed-head');const pub=document.querySelector('#c-pub');if(!h||!pub)return;const box=document.createElement('div');box.className='ed-act';const ch=document.querySelector('#c-check'),dr=document.querySelector('#c-draft');[ch,dr,pub].forEach(b=>b&&box.append(b));const chip=h.querySelector('.chip');h.lastElementChild.replaceWith(box);h.classList.add('stick');if(chip)h.querySelector('h2').append(' ',chip);},
 monster(){this.side('content');const fm=document.querySelector('.fm');const sec=fm.querySelector('.fm-sec');const grid=sec.querySelector('.fgrid');const left=[...grid.children];
  this.KEYG.forEach(([t,sub,keys])=>{const s=document.createElement('section');s.className='fm-sec';s.innerHTML=`<h4>${t}${sub?`<i>${sub}</i>`:''}</h4><div class="fgrid"></div>`;const g=s.querySelector('.fgrid');
   keys.forEach(k=>{const el=grid.querySelector(`[data-p="${k}"]`);const f=el&&el.closest('.f');if(f){if(['desc','roles','drops'].includes(k))f.classList.add('wide');g.append(f);}});fm.insertBefore(s,sec);});
  if(!grid.children.length)sec.remove();else sec.querySelector('h4').textContent='기타';
  this.labels(fm);this.acts();},
 quest(){this.side('content');const fm=document.querySelector('.fm');this.labels(fm);this.acts();
  const scs=[...fm.querySelectorAll(':scope>.fm-sec.scene')];const flow=document.createElement('div');flow.className='flow';
  flow.innerHTML='<span>흐름</span>'+scs.map(s=>{const n=s.querySelector('h4').childNodes[0].textContent.trim();return `<button type="button" class="n ${s.classList.contains('battle')?'b':s.classList.contains('end')?'e':''}">${n}</button>`;}).join('<span>→</span>');
  scs[0].before(flow);
  scs.forEach((s,i)=>{const d=document.createElement('details');d.className='scn '+(s.classList.contains('battle')?'battle':s.classList.contains('end')?'end':'');if(i===0)d.open=true;
   const name=s.querySelector('h4').childNodes[0].textContent.trim();const ta=s.querySelector('textarea, input[type=text]');const ch=s.querySelectorAll('.ch').length;
   d.innerHTML=`<summary><b>${name}</b><span class="s">${ta?(ta.value||'').slice(0,80):''}</span><span class="to">${ch?'선택지 '+ch+'개':s.classList.contains('end')?'보상':''}</span></summary>`;s.before(d);d.append(s);});}
};
