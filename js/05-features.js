'use strict';
/* 공방 · 마을 · 스토리 · 전직 · 던전 · 낚시 · 카지노 · 미션 · 커뮤니티 · 관계 · 칭호 · 날씨 */
/* ───────── 제작 · 요리 · 연금 · 장인 ───────── */
Object.assign(ITEMS,{
  grain:{name:'초원 밀',type:'mat',tag:'요리 재료',desc:'초원의 땅에서 자란 밀. 빵과 반죽의 기본 재료.',price:8},
  meat:{name:'산짐승 고기',type:'mat',tag:'요리 재료',desc:'바위의 땅 산짐승에게서 얻은 고기.',price:12},
  fish:{name:'바다 생선',type:'mat',tag:'요리 재료',desc:'바다의 땅 갯바위 근처에서 잡은 생선.',price:12},
  mushroom:{name:'늪 버섯',type:'mat',tag:'요리 재료',desc:'늪의 땅 안개 속에서 자라는 버섯. 익히면 독이 사라진다.',price:14},
  pepper:{name:'화염 고추',type:'mat',tag:'요리 재료',desc:'작열의 땅에서 자란 매운 고추.',price:16},
  berry:{name:'서리 열매',type:'mat',tag:'요리 재료',desc:'혹한의 땅 눈 속에서 익는 푸른 열매.',price:18},
  k_bread:{name:'초원 밀빵',type:'use',tag:'요리',desc:'갓 구운 밀빵 · 먹으면 30분 동안 HP +15',buff:{stat:'maxHp',val:15,min:30}},
  k_skewer:{name:'산짐승 꼬치',type:'use',tag:'요리',desc:'소금을 뿌려 구운 꼬치 · 먹으면 30분 동안 공격력 +3',buff:{stat:'atk',val:3,min:30}},
  k_soup:{name:'바다 해물탕',type:'use',tag:'요리',desc:'뜨끈한 해물탕 · 먹으면 30분 동안 방어력 +3',buff:{stat:'def',val:3,min:30}},
  k_pie:{name:'늪 버섯 파이',type:'use',tag:'요리',desc:'고소한 버섯 파이 · 먹으면 30분 동안 행운 +4',buff:{stat:'luk',val:4,min:30}},
  k_spicy:{name:'화염 고추 볶음',type:'use',tag:'요리',desc:'혀가 얼얼한 볶음 요리 · 먹으면 45분 동안 공격력 +6',buff:{stat:'atk',val:6,min:45}},
  k_jam:{name:'서리 열매 잼 빵',type:'use',tag:'요리',desc:'푸른 잼을 듬뿍 바른 빵 · 먹으면 45분 동안 HP +40',buff:{stat:'maxHp',val:40,min:45}},
  k_feast:{name:'라니아케아 연회 요리',type:'use',tag:'요리',desc:'신전 축제의 상차림 · 먹으면 60분 동안 공격력 +8, HP +40',buff:{stat:'atk',val:8,min:60},buff2:{stat:'maxHp',val:40,min:60}},
  k_royal:{name:'백야의 만찬',type:'use',tag:'요리',desc:'혼돈의 향신료를 더한 전설의 만찬 · 먹으면 60분 동안 공격력 +12, 방어력 +6',buff:{stat:'atk',val:12,min:60},buff2:{stat:'def',val:6,min:60}},
  a_tonic:{name:'독샘 강장제',type:'use',tag:'연금',desc:'독을 걸러 낸 강장제 · 마시면 30분 동안 공격력 +4',buff:{stat:'atk',val:4,min:30}},
  a_frost:{name:'서리 방벽 물약',type:'use',tag:'연금',desc:'피부를 서리처럼 단단하게 · 마시면 45분 동안 방어력 +6',buff:{stat:'def',val:6,min:45}},
  a_pearl:{name:'진주빛 행운약',type:'use',tag:'연금',desc:'진주 가루를 녹인 물약 · 마시면 60분 동안 행운 +8',buff:{stat:'luk',val:8,min:60}},
  a_chaos:{name:'혼돈 정제액',type:'use',tag:'연금',desc:'혼돈의 파편을 정제한 위험한 물약 · 마시면 60분 동안 공격력 +12',buff:{stat:'atk',val:12,min:60}},
  haste5:{name:'시간 단축 주문서 (5분)',type:'use',tag:'시간 단축',haste:5,desc:'제작 · 요리 · 연금 · 수리 창에서 사용하면 남은 시간이 5분 줄어든다.'},
  haste10:{name:'시간 단축 주문서 (10분)',type:'use',tag:'시간 단축',haste:10,desc:'제작 · 요리 · 연금 · 수리 창에서 사용하면 남은 시간이 10분 줄어든다.'},
  haste30:{name:'시간 단축 주문서 (30분)',type:'use',tag:'시간 단축',haste:30,desc:'제작 · 요리 · 연금 · 수리 창에서 사용하면 남은 시간이 30분 줄어든다.'},
  haste60:{name:'시간 단축 주문서 (1시간)',type:'use',tag:'시간 단축',haste:60,desc:'제작 · 요리 · 연금 · 수리 창에서 사용하면 남은 시간이 1시간 줄어든다.'},
  haste360:{name:'시간 단축 주문서 (6시간)',type:'use',tag:'시간 단축',haste:360,desc:'제작 · 요리 · 연금 · 수리 창에서 사용하면 남은 시간이 6시간 줄어든다.'}
});
const HASTE_IDS=['haste5','haste10','haste30','haste60','haste360'];
const FOOD_BY_LAND={meadow:'grain',rock:'meat',sea:'fish',swamp:'mushroom',ember:'pepper',frost:'berry',salt:'grain'};
const PROF={
  craft:{n:'제작',job:'제작 장인',road:'제작 장인의 길',btn:'제작/수리하기',ranks:['도제(徒弟)','직인(職人)','장인(匠人)','대장인(大匠人)','총장인(總匠人)'],short:['도제','직인','장인','대장인','총장인']},
  cook:{n:'요리',job:'요리 장인',road:'요리 장인의 길',btn:'요리하기',ranks:['코미(Commis)','데미셰프(Demi-chef)','셰프 드 파르티(Chef de partie)','수셰프(Sous-chef)','셰프 드 퀴진(Chef de cuisine)'],short:['코미','데미셰프','셰프 드 파르티','수셰프','셰프 드 퀴진']},
  alch:{n:'연금',job:'연금 장인',road:'연금 장인의 길',btn:'연금하기',ranks:['수련생(Initiate)','조제사(Compounder)','연성술사(Transmuter)','마기스터(Magister)','연금술사(Archsage)'],short:['수련생','조제사','연성술사','마기스터','연금술사']}
};
const RECIPES={
  craft:[['c_sword','sword',1,{ore:3},5,10],['c_leather','leather',1,{ore:2,herb:2},5,15],['c_staff','staff',1,{ore:2,ember:2},4,30],['c_shield','shield',1,{ore:4,salt:2},4,45],
    ['c_bow','bow',1,{venom:2,ore:3},3,60],['c_cloak','cloak',1,{frost:3,pearl:2},3,90],['c_amulet','amulet',1,{pearl:3,herb:3},2,180],['c_crest','crest',1,{chaos:3,frost:2,ember:2},1,360]],
  cook:[['k_bread','k_bread',1,{grain:2},5,10],['k_skewer','k_skewer',1,{meat:2,salt:1},5,15],['k_soup','k_soup',1,{fish:2,salt:1,herb:1},4,30],['k_pie','k_pie',1,{mushroom:2,grain:2},4,30],
    ['k_spicy','k_spicy',1,{meat:2,pepper:2},3,60],['k_jam','k_jam',1,{berry:2,grain:2},3,60],['k_feast','k_feast',1,{meat:2,fish:2,berry:1,pepper:1},2,180],['k_royal','k_royal',1,{chaos:1,meat:2,berry:2,pepper:2},1,360]],
  alch:[['a_potion','potion',2,{herb:2},5,5],['a_holy','holywater',1,{herb:1,salt:2},5,10],['a_swift','swiftdraft',1,{frost:1,herb:2},4,30],['a_tonic','a_tonic',1,{venom:2,herb:1},4,30],
    ['a_elixir','elixir',1,{ember:2,pearl:1,herb:2},3,60],['a_frost','a_frost',1,{frost:2,salt:2},3,60],['a_pearl','a_pearl',1,{pearl:3,frost:1},2,180],['a_chaos','a_chaos',1,{chaos:2,venom:2,ember:1},1,360]]
};
function recipe(kind,id){const r=RECIPES[kind].find(x=>x[0]===id);return r&&{id:r[0],out:r[1],n:r[2],mats:r[3],grade:r[4],min:r[5]};}
/* 장인의 길 · 장마다 단계: text / gather / craft */
const PROF_Q={
  craft:[
    {t:'대장간의 문을 두드리다',steps:[['text','황혼녘 강가의 대장장이 브란이 일손을 구한다는 소문을 들었다. 강가의 대장간을 찾아가 보자.'],['gather',{ore:3},'브란: "쇠를 다루려면 먼저 돌을 알아야지. 바위 원석 3개를 가져와 보게."'],['text','브란이 원석을 망치로 두드려 보더니 고개를 끄덕인다. "좋아, 오늘부터 자네는 내 도제일세."']]},
    {t:'첫 번째 칼날',steps:[['text','브란: "도제라면 칼 한 자루쯤은 혼자 벼려 봐야지. 화로는 내가 데워 두겠네."'],['craft','c_sword','낡은 순례자 검을 직접 제작해 브란에게 보여 주자.'],['text','브란이 칼날에 엄지를 대 보고는 웃는다. "제법이군. 이제 자네를 직인이라 불러도 되겠어."']]},
    {t:'성역의 방패',steps:[['gather',{salt:3},'브란: "방패를 담금질하려면 소금물이 필요하네. 소금 결정 3개를 구해 오게."'],['craft','c_shield','성역의 대방패를 제작하자.'],['text','성역 기사단의 사자가 방패를 받아 들고 감탄한다. 대장간 문 위에 "장인"의 패가 걸렸다.']]},
    {t:'하얀 밤의 실',steps:[['text','브란: "백야의 망토는 쇠가 아니라 빛을 다루는 일이지. 대장인이라면 그걸 해내야 해."'],['gather',{frost:2,pearl:2},'서리 결정 2개와 바다 진주 2개를 모아 오자.'],['craft','c_cloak','백야의 망토를 제작하자.']]},
    {t:'모든 망치의 주인',steps:[['text','라니아케아 곳곳의 대장장이들이 강가로 모여들었다. 그들은 새로운 총장인을 시험하려 한다.'],['gather',{chaos:2},'시험의 재료로 혼돈의 파편 2개를 바쳐야 한다.'],['craft','c_amulet','라니아케아의 부적을 제작해 신들의 축복을 쇠에 새기자.'],['text','망치 소리가 그치자 모두가 고개를 숙인다. 이제 당신은 총장인이다.']]}
  ],
  cook:[
    {t:'항구의 부엌',steps:[['text','항구 도시의 식당 주인 마르타가 손이 모자라 쩔쩔맨다고 한다. 부엌을 찾아가 보자.'],['gather',{grain:2},'마르타: "일단 재료부터! 초원 밀 2개만 가져다줄래요?"'],['text','마르타가 앞치마를 던져 준다. "오늘부터 코미예요. 칼질부터 배워요."']]},
    {t:'첫 번째 빵',steps:[['craft','k_bread','초원 밀빵을 직접 구워 보자.'],['text','마르타가 빵을 반으로 갈라 김을 맡는다. "합격! 데미셰프로 올려 줄게요."']]},
    {t:'바다의 국물',steps:[['gather',{fish:2},'바다 생선 2마리를 손질해 두자.'],['craft','k_soup','바다 해물탕을 끓이자.'],['text','손님들이 국물을 한 숟갈 뜨고는 말이 없다. 마르타가 당신에게 한 파트를 맡겼다.']]},
    {t:'서리의 단맛',steps:[['text','마르타: "디저트를 아는 사람이 수셰프가 될 수 있죠."'],['gather',{berry:2},'서리 열매 2개를 구해 오자.'],['craft','k_jam','서리 열매 잼 빵을 만들자.']]},
    {t:'연회의 주방장',steps:[['text','신전 축제의 연회를 책임질 주방장을 뽑는다는 공고가 붙었다.'],['craft','k_feast','라니아케아 연회 요리를 차려 내자.'],['text','축제가 끝나고 신관이 당신에게 은빛 국자를 건넨다. 셰프 드 퀴진의 증표다.']]}
  ],
  alch:[
    {t:'모래 위의 실험실',steps:[['text','오아시스 마을의 연금술사 이벨이 제자를 찾는다고 한다. 실험실을 찾아가 보자.'],['gather',{herb:3},'이벨: "약초 냄새부터 구분할 줄 알아야 해요. 초원 약초 3개를 가져와요."'],['text','이벨이 유리병 하나를 건넨다. "수련생, 오늘부터 이건 당신 거예요."']]},
    {t:'첫 번째 조제',steps:[['craft','a_potion','회복약을 조제해 보자.'],['text','이벨: "색이 맑네요. 조제사라고 불러도 되겠어요."']]},
    {t:'성질 바꾸기',steps:[['gather',{frost:1},'서리 결정 1개를 구해 오자.'],['craft','a_swift','신속의 물약을 연성하자.'],['text','물약이 바람처럼 가벼워졌다. 이벨이 당신을 연성술사라 부른다.']]},
    {t:'용기의 불꽃',steps:[['text','이벨: "마기스터는 마음까지 다루는 사람이에요."'],['gather',{ember:2},'불씨 조각 2개를 모아 오자.'],['craft','a_elixir','용기의 영약을 만들자.']]},
    {t:'진리를 정제하는 자',steps:[['text','고대 연금술 협회가 당신의 이름을 불렀다. 마지막 시험이다.'],['craft','a_pearl','진주빛 행운약을 완성하자.'],['text','협회의 문장이 새겨진 반지가 손가락에 끼워진다. 당신은 이제 연금술사다.']]}
  ]
};
function profStarted(k){const p=(S.me.prof||{})[k];return !!(p&&(p.rank||p.ch||p.step));}
function profCount(){return ['craft','cook','alch'].filter(k=>(S.me.prof||{})[k]&&S.me.prof[k].rank).length;}
function prof(kind){const me=S.me;me.prof=me.prof||{};return me.prof[kind]=me.prof[kind]||{rank:null,ch:0,step:0,done:false};}
function rankName(kind){const p=prof(kind);return p.rank?PROF[kind].ranks[5-p.rank]:'';}
function rankShort(kind){const p=prof(kind);return p.rank?PROF[kind].short[5-p.rank]:'';}
function cjobs(){return S.me.cjobs=S.me.cjobs||{};}
const DURA_MAX=35;
function isQuestItem(k){const it=ITEMS[k];return !!it&&(/^q_/.test(k)||it.tag==='퀘스트 아이템'||it.tag==='이스터에그');}
function dura(id){const d=(S.me.dura||{})[id];return d==null?DURA_MAX:d;}
function effEquip(){const e={};for(const sl in (S.me.equip||{})){const id=S.me.equip[sl];const it=ITEMS[id];if(id&&dura(id)>0&&!(it&&it.wtype&&!classAllowed(it,S.me.job)))e[sl]=id;}return e;}
function itemLv(id){const it=ITEMS[id];return it.levelReq||Math.max(1,Math.round((it.price||150)/30));}
function repairRate(id){return 5+itemLv(id)*3;}
function repairCost(id,miss){return Math.ceil(miss*repairRate(id)*10/DURA_MAX);}
function ensureCraft(){const me=S.me;if(!me||me.craftSeed)return;me.craftSeed=1;
  const g={haste5:3,haste10:2,haste30:1,haste60:1,haste360:1,ore:6,herb:6,grain:5,meat:2,fish:2,salt:1};for(const k in g)me.inv[k]=(me.inv[k]||0)+g[k];save();}
/* ── 체력 유지 ──
   던전·파티 레이드·토벌전·만신전이 끝나면 그때 남은 체력을 그대로 들고 나온다(S.me.hpPct, 0~1).
   다음 레이드는 그 체력으로 시작. 레벨 업하면 100%, 평소에는 HP_REGEN_MS 동안 0→100% 천천히 회복.
   필드 사냥·퀘스트 전투는 예전처럼 가득 찬 체력으로 싸우고 이 값에 영향을 주지 않는다. */
const HP_KEEP=['dungeon','drun','party','daily','weekly','event','mass'];
const HP_REGEN_MS=30*60e3;
const HP_WARN=0.3;
function hpNow(){const m=S&&S.me;if(!m||m.hpPct==null)return 1;return Math.min(1,m.hpPct+Math.max(0,now()-(m.hpAt||now()))/HP_REGEN_MS);}
function hpSet(p){const m=S.me;if(!m)return;p=Math.max(0,Math.min(1,p));if(p>=1){delete m.hpPct;delete m.hpAt;}else{m.hpPct=p;m.hpAt=now();}}
function hpFull(){hpSet(1);}
function hpStart(mf){if(mf)mf.hp=Math.max(1,Math.round(mf.maxHp*hpNow()));}
function hpAfter(b,me){if(!me||!HP_KEEP.includes((b.ctx||{}).type))return;hpSet(me.dead?0:me.hp/me.maxHp);}
/* 입장 전 경고(레이드류만): 체력 30% 미만 · 장착 장비 내구도 0 */
function brokenGear(){return [...new Set(Object.values(S.me.equip||{}))].filter(id=>id&&ITEMS[id]&&dura(id)<=0).map(id=>ITEMS[id].name);}
let GATE=null;
function entryGate(k,d,raid){
  if(d&&d._gate)return false;if(!raid)return false;
  const warn=[];const hp=hpNow();
  if(raid&&hp<HP_WARN)warn.push(`체력이 30% 미만입니다. <span class="faint num">(현재 ${Math.floor(hp*100)}%)</span>`);
  brokenGear().forEach(n=>warn.push(`${esc(n)}의 내구도가 0입니다.`));
  if(!warn.length)return false;
  GATE={k,d:{...d}};
  modal(`<div class="ndlg gate-dlg"><h3>입장 전 확인</h3><ul class="gate-l">${warn.map(w=>`<li>${w}</li>`).join('')}</ul>
    <p class="faint" style="font-size:12.5px">${hp<HP_WARN&&raid?'체력은 시간이 지나면 천천히 차오르고, 레벨 업하면 가득 찹니다. ':''}${brokenGear().length?'내구도가 0인 장비는 장착돼 있어도 능력치가 적용되지 않습니다. 수리는 골드만 내면 바로 끝납니다.':''}</p>
    <div class="row" style="justify-content:flex-end">${brokenGear().length?'<button class="btn" data-act="repair-open">수리하기</button>':''}<button class="btn btn-ghost" data-act="closemodal">취소</button><button class="btn btn-primary" data-act="gate-go">그래도 입장</button></div></div>`);
  return true;
}
function wearDown(){const me=S.me;me.dura=me.dura||{};const broke=[];for(const sl in (me.equip||{})){const id=me.equip[sl];if(!id||!ITEMS[id])continue;const d=dura(id);if(d>0){me.dura[id]=d-1;if(d-1===0)broke.push(ITEMS[id].name);}}
  if(broke.length)setTimeout(()=>{toastAct(`${broke.join(', ')}의 내구도가 0이 되어 능력치가 적용되지 않습니다.`,[['수리하기','repair-open']],'bad',9000);playAlarm();},0);}
/* 버튼이 달린 알림(누르면 해당 동작 후 알림 닫힘). btns: [[라벨, data-act, {data-*}]] */
function toastAct(text,btns,kind,ms){if(S&&S.settings&&S.settings.notify===false&&kind!=='bad')return;const box=$('#toasts');if(!box||!document.createElement)return;
  const el=document.createElement('div');el.className='toast tact '+(kind||'');const sp=document.createElement('span');sp.textContent=text;el.appendChild(sp);
  const x=document.createElement('button');x.className='tact-x';x.dataset.act='toast-x';x.setAttribute('aria-label','알림 닫기');x.innerHTML='<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 3l6 6M9 3L3 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';el.appendChild(x);
  const row=document.createElement('div');row.className='tact-b';(btns||[]).forEach(([l,act,data])=>{const b=document.createElement('button');b.className='btn btn-sm';b.textContent=l;b.dataset.act=act;b.dataset.toast='1';for(const k in (data||{}))b.dataset[k]=data[k];row.appendChild(b);});
  el.appendChild(row);box.appendChild(el);setTimeout(()=>el.remove(),ms||8000);}
/* 보상으로 받은 장비 · [지금 착용] */
function wearable(items){return Object.keys(items||{}).filter(k=>{const it=ITEMS[k];return it&&it.type==='equip'&&items[k]>0&&S.me.inv[k]>0&&S.me.equip[it.slot]!==k&&!itemBlock(k);});}
function wearNowHTML(items){const L=wearable(items);return L.length?`<div class="wear-now">${L.map(k=>`<button class="btn btn-sm btn-primary" data-act="eq-now" data-id="${k}">${esc(ITEMS[k].name)} 지금 착용</button>`).join('')}</div>`:'';}
function wearNowToast(items){const L=wearable(items).slice(0,2);if(!L.length)return;toastAct(`새 장비 획득 · ${L.map(k=>ITEMS[k].name).join(', ')}`,L.map(k=>[`${ITEMS[k].name} 지금 착용`,'eq-now',{id:k}]),'good',9000);}
function matLine(mats,mult){return Object.entries(mats).map(([k,n])=>{const have=matCount(k);const need=n*(mult||1);return `<span class="cm ${have>=need?'ok':'no'}">${esc(k==='fish'?'손질한 생선(종류 무관)':ITEMS[k]?ITEMS[k].name:k)} <b class="num">${have}/${need}</b></span>`;}).join('');}
function filletIds(){return Object.keys(S.me.inv).filter(k=>k.startsWith('fl_')&&S.me.inv[k]>0);}
function matCount(k){if(k!=='fish')return S.me.inv[k]||0;return (S.me.inv.fish||0)+filletIds().reduce((a,x)=>a+S.me.inv[x],0);}
function takeMat(k,n){if(k!=='fish'){S.me.inv[k]=(S.me.inv[k]||0)-n;return;}let left=n;const a=Math.min(left,S.me.inv.fish||0);S.me.inv.fish=(S.me.inv.fish||0)-a;left-=a;for(const x of filletIds()){if(!left)break;const t=Math.min(left,S.me.inv[x]);S.me.inv[x]-=t;left-=t;}}
function hasMats(mats){return Object.entries(mats).every(([k,n])=>matCount(k)>=n);}
function durLabel2(m){return m<60?`${m}분`:m%60?`${Math.floor(m/60)}시간 ${m%60}분`:`${m/60}시간`;}
function jobBox(slot){
  const j=cjobs()[slot];if(!j)return '';const t=now();const done=t>=j.end;const p=Math.min(100,(t-j.start)/Math.max(1,j.end-j.start)*100);
  const hs=HASTE_IDS.filter(k=>(S.me.inv[k]||0)>0);
  return `<div class="cj ${done?'done':''}"><div class="cj-t"><span class="mp-ic">${done?'':SPIN_IC}</span><b>${esc(j.label)}</b><span class="cj-left num" data-cj-left="${slot}">${done?'완료':'남은 시간 '+fmtLong(j.end-t)}</span></div>
    <div class="bar"><i data-cj-p="${slot}" style="width:${p}%"></i></div>
    ${done?`<div class="row cj-act"><button class="btn btn-sm btn-primary" data-act="cj-claim" data-slot="${slot}">받기</button></div>`
      :`<div class="cj-haste"><span class="faint">시간 단축</span>${hs.length?hs.map(k=>`<button class="hb" data-act="cj-haste" data-slot="${slot}" data-id="${k}" title="${esc(ITEMS[k].name)}">-${durLabel2(ITEMS[k].haste)} <span class="num faint">×${S.me.inv[k]}</span></button>`).join(''):'<span class="faint">보유한 시간 단축 주문서가 없습니다</span>'}</div>`}</div>`;
}
function profQuestBox(kind){
  const p=prof(kind);const Q=PROF_Q[kind];if(p.done)return `<div class="pq done"><span class="pq-h">&lt;${PROF[kind].road}&gt;</span><p class="faint">모든 장을 마쳤습니다 · ${PROF[kind].job} 1급 ${rankName(kind)}</p></div>`;
  const ch=Q[p.ch];const st=ch.steps[p.step];const nextRank=PROF[kind].ranks[p.ch];
  const fresh=!profStarted(kind);if(!p.rank&&profCount()>=2)return `<div class="pq lock"><div class="pq-h">&lt;${PROF[kind].road}&gt;</div><p class="pq-warn">⚠ 이미 장인 직업 2개를 가지고 있어 ${PROF[kind].job}의 길을 시작할 수 없습니다.</p></div>`;
  const warn=!p.rank?`<p class="pq-warn">⚠ 장인 직업은 최대 2개까지만 가질 수 있습니다. 1장을 마쳐 5급이 되는 순간 ${PROF[kind].job}이(가) 장인 슬롯 1개를 차지하며 되돌릴 수 없습니다. (현재 ${profCount()}/2)</p>`:'';
  let body='',btn='';
  if(st[0]==='text'){body=`<p>${esc(st[1])}</p>`;btn=`<button class="btn btn-sm btn-primary" data-act="pq-next" data-kind="${kind}">${fresh?'장인의 길 시작하기':'다음'}</button>`;}
  else if(st[0]==='gather'){body=`<p>${esc(st[2])}</p><div class="cmats">${matLine(st[1])}</div>`;btn=`<button class="btn btn-sm btn-primary" data-act="pq-next" data-kind="${kind}" ${hasMats(st[1])?'':'disabled'}>${hasMats(st[1])?'건네주기':'재료 부족'}</button>`;}
  else {const r=recipe(kind,st[1]);body=`<p>${esc(st[2])}</p><p class="faint" style="font-size:12px">아래 목록에서 「${esc(ITEMS[r.out].name)}」을(를) 만들어 받으면 완료됩니다.</p>`;}
  return `<div class="pq"><div class="pq-h">&lt;${PROF[kind].road}&gt; ${p.ch+1}장 · ${esc(ch.t)}<span class="faint">완료 시 ${PROF[kind].job} ${5-p.ch}급 ${nextRank}</span></div>
    <div class="pq-steps">${ch.steps.map((_,i)=>`<i class="${i<p.step?'on':i===p.step?'cur':''}"></i>`).join('')}</div>${warn}${body}${btn?`<div class="row cj-act">${btn}</div>`:''}</div>`;
}
function pqAdvance(kind){
  const p=prof(kind);const Q=PROF_Q[kind];const ch=Q[p.ch];
  if(!p.rank&&p.step+1>=ch.steps.length&&profCount()>=2){toast('이미 장인 직업 2개를 가지고 있어 5급이 될 수 없습니다.','warn');return;}
  p.step++;
  if(p.step>=ch.steps.length){p.rank=5-p.ch;p.ch++;p.step=0;if(p.ch>=Q.length)p.done=true;
    toast(`${PROF[kind].job} ${p.rank}급 · ${rankName(kind)}이(가) 되었습니다!`,'good');notify(`<${PROF[kind].road}> ${p.ch}장을 마쳤습니다 · ${PROF[kind].job} ${p.rank}급 ${rankName(kind)}`);}
  save();
}
function recipeRow(kind,r){
  const p=prof(kind);const it=ITEMS[r.out];const lock=!p.rank||p.rank>r.grade;const busy=!!cjobs()[kind];const ok=hasMats(r.mats);
  return `<div class="cr ${lock?'locked':''}"><div class="cr-t"><b>${esc(it.name)}${r.n>1?` ×${r.n}`:''}</b><span class="cr-g g${r.grade}">${r.grade}급</span><span class="faint num">${durLabel2(r.min)}</span></div>
    <div class="cmats">${matLine(r.mats)}</div><small class="faint">${esc(it.desc||'')}</small>
    <div class="row cj-act"><button class="btn btn-sm ${!lock&&!busy&&ok?'btn-primary':''}" data-act="cj-start" data-kind="${kind}" data-id="${r.id}" ${lock||busy||!ok?'disabled':''}>${lock?(p.rank?`${PROF[kind].job} ${r.grade}급 이상`:'장인의 길을 먼저 시작하세요'):busy?'진행 중인 작업이 있습니다':ok?`${PROF[kind].n} 시작`:'재료 부족'}</button></div></div>`;
}
function repairList(){
  const ids=[...new Set([...Object.values(S.me.equip||{}).filter(Boolean),...Object.keys(S.me.inv).filter(k=>ITEMS[k]&&ITEMS[k].type==='equip'&&S.me.inv[k]>0)])].filter(k=>ITEMS[k]);
  const busy=false;
  if(!ids.length)return '<p class="empty">수리할 장비가 없습니다.</p>';
  return ids.map(id=>{const d=dura(id),miss=DURA_MAX-d,cost=repairCost(id,miss),on=Object.values(S.me.equip||{}).includes(id);
    return `<div class="cr"><div class="cr-t"><b>${esc(ITEMS[id].name)}</b>${on?'<span class="chip warn">착용 중</span>':''}<span class="faint">장비 레벨 ${itemLv(id)}</span></div>
      <div class="dura"><div class="dura-bar ${d===0?'broken':d<=Math.ceil(DURA_MAX*0.2)?'low':''}">${Array.from({length:10},(_,i)=>`<i class="${i<Math.ceil(d/DURA_MAX*10)?'on':''}"></i>`).join('')}</div><span class="num">${d}/${DURA_MAX}${d===0?' · 파손 (장착은 되지만 능력치 미적용)':''}</span></div>
      ${miss?`<small class="faint">수리 비용 ${goldHTML(cost)} · 즉시 완료</small>`:'<small class="faint">내구도가 가득 차 있습니다</small>'}
      <div class="row cj-act"><button class="btn btn-sm ${miss&&!busy&&S.me.gold>=cost?'btn-primary':''}" data-act="cj-repair" data-id="${id}" ${!miss||busy||S.me.gold<cost?'disabled':''}>${!miss?'수리 불필요':busy?'수리 중인 장비가 있습니다':S.me.gold<cost?'골드 부족':'수리하기'}</button></div></div>`;}).join('');
}
function craftHTML(kind,tab){
  const P=PROF[kind];const p=prof(kind);tab=kind==='craft'&&tab==='repair'?'repair':'make';
  const head=`<div class="row" style="justify-content:space-between;align-items:center"><h3 class="cf-h">${P.btn}${p.rank?`<span class="rank-chip">${P.job} ${p.rank}급 · ${P.short[5-p.rank]}</span>`:''}</h3><button class="btn btn-sm btn-ghost" data-act="closemodal">닫기</button></div>`;
  const tabs=kind==='craft'?`<div class="mtabs cf-tabs" role="tablist">${[['make','제작'],['repair','수리']].map(([k,l])=>`<button role="tab" data-act="cf-tab" data-kind="craft" data-tab="${k}" aria-selected="${tab===k}">${l}</button>`).join('')}</div>`:'';
  if(tab==='repair')return `${head}${tabs}<p class="faint cf-note">레이드(던전 · 파티 레이드 · 토벌전 · 만신전) 전투를 한 번 치를 때마다 착용 중인 장비의 내구도가 1씩 줄어듭니다(최대 ${DURA_MAX}). 필드 사냥과 퀘스트 전투에서는 줄지 않습니다. 0이 되면 장비 능력치가 적용되지 않습니다. 수리는 골드만 내면 바로 끝나고, 장비 레벨이 높을수록 비쌉니다.</p>${jobBox('repair')}<div class="cr-list">${repairList()}</div>`;
  const rn=guildRain(kind)?`<p class="wdb-note">☔ ${PROF[kind].job} 길드 본진(${LANDS[GUILD_HQ[kind]]})에 비가 내립니다 · 오늘 ${PROF[kind].n} 실패 확률 +5%</p>`:'';
  return `${head}${tabs}${rn}${profQuestBox(kind)}${jobBox(kind)}<div class="cr-list">${RECIPES[kind].map(r=>recipeRow(kind,recipe(kind,r[0]))).join('')}</div>`;
}
function openCraft(kind,tab){S.sel.cfKind=kind;S.sel.cfTab=tab||S.sel.cfTab||'make';const st=$('.modal')&&$('.modal').scrollTop;modal(craftHTML(kind,S.sel.cfTab));const mm=$('.modal');if(mm){mm.classList.add('craftm');if(st)mm.scrollTop=st;}}
function craftPanel(){
  const items=['craft','cook','alch'].map(k=>{const p=prof(k);const j=cjobs()[k]||(k==='craft'&&cjobs().repair);const t=now();
    return `<button class="cf-btn" data-act="cf-open" data-kind="${k}"><span class="cf-ic">${CF_IC[k]}</span><span class="cf-tx"><b>${PROF[k].btn}</b><small>${p.rank?`${PROF[k].job} ${p.rank}급 · ${PROF[k].short[5-p.rank]}`:(profCount()>=2?'습득 불가 · 장인 2개 보유':profStarted(k)?`수행 중 · &lt;${PROF[k].road}&gt;`:`미습득 · &lt;${PROF[k].road}&gt;`)}</small>${j?`<small class="cf-run">${t>=j.end?'완료 · 받기 대기':esc(j.label)+' 진행 중'}</small>`:''}</span></button>`;}).join('');
  return `<div class="panel"><h3>${hTitle('spark','공방')} <span class="faint num" style="letter-spacing:0;font-weight:400">장인 ${profCount()}/2</span></h3><div class="cf-grid">${items}</div><p class="faint cf-warn">장인 직업은 최대 2개까지만 가질 수 있습니다. 장인의 길 1장을 마쳐 5급이 되면 슬롯을 차지하며, 되돌릴 수 없으니 신중히 고르세요.</p></div>`;
}
const CF_IC={craft:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 3.5l6 6-2.5 2.5-6-6z" fill="currentColor"/><path d="M13 8 4 17l3 3 9-9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  cook:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16a8 8 0 0 1-16 0z" fill="currentColor"/><path d="M8 8c0-2 2-2 2-4M12 8c0-2 2-2 2-4M16 8c0-2 2-2 2-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  alch:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6M10 3v6L5 18.5A1.8 1.8 0 0 0 6.6 21h10.8a1.8 1.8 0 0 0 1.6-2.5L14 9V3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M7.4 15h9.2l2 4H5.4z" fill="currentColor"/></svg>'};
function profChips(){return ['craft','cook','alch'].filter(k=>prof(k).rank).map(k=>`<span class="chip prof-chip" title="${PROF[k].job} ${prof(k).rank}급 · ${rankName(k)}">${rankShort(k)}</span>`).join('');}

/* ───────── 마을 (지역별 NPC) ───────── */
const VIL_SPOTS=[['plaza','광장'],['grocer','식료품점'],['clinic','치료소'],['alley','뒷골목']];
const VIL_NPC={
  plaza:[['광장의 음유시인 로웬',['{L}의 노래를 들어 보겠소? 신들이 처음 축복을 내린 날의 이야기라오.','요즘 블레서들이 부쩍 늘었어. 다들 백야의 신전 이야기만 하더군.','분수대에 동전을 던지면 신이 소원을 들어준다는데, 나는 아직 한 번도 못 봤지.']],
    ['광장의 게시판지기 하나',['게시판에 새 의뢰가 붙으면 제일 먼저 알려 줄게요!','{L} 경계 쪽에 변이된 짐승이 나타났대요. 조심하세요.','오늘은 조용하네요. 이런 날이 오래가면 좋겠어요.']],
    ['떠돌이 상인 카브',['물건은 안 사도 되니 이야기나 듣고 가게. 블라스파미아의 안개는 사람을 홀린다네.','길에서 주운 건데, 자네가 쓰는 게 낫겠어.','신대륙에서 돌아온 탐사대가 있다던데… 아무 말도 안 한다더군.']]],
  grocer:[['식료품점 주인 미라',['오늘 들어온 {L} 특산물이에요. 신선하죠?','블레서님들은 잘 먹어야 해요. 배고프면 칼도 무거워진다니까요.','요리 장인 마르타 씨가 우리 가게 단골이에요. 아시죠?']],
    ['짐꾼 소년 테오',['무거운 건 제가 날라 드릴게요! …아, 이건 덤이에요.','사장님이 오늘은 장사가 안 된다고 한숨만 쉬세요.','{L}에서 제일 맛있는 건 갓 구운 빵이에요. 진짜예요.']]],
  clinic:[['치료사 엘린',['다친 곳은 없나요? 블레서도 결국 사람이에요.','회복약은 쓴맛이 날수록 잘 듣는대요. 근거는 없지만요.','요즘 독에 당해 오는 분이 많아요. 늪 근처는 조심하세요.']],
    ['견습 치료사 루카',['붕대 감는 법을 배우는 중이에요. 팔 한 번만 빌려주실래요?','선생님이 이건 여분이니 블레서님께 드리래요.','신전에서 축복받은 물로 상처를 씻으면 빨리 낫는대요.']]],
  alley:[['뒷골목의 정보상 녹스',['정보는 공짜가 아니야. …뭐, 이번 한 번은 봐주지.','백야의 신전 아래엔 아직 사람이 있다는 소문이 있어. 믿든 말든.','{L}의 경비대장이 요즘 밤마다 어딜 가는지 아나? 나도 모르지.']],
    ['수상한 망토의 사내',['…날 본 적 없는 걸로 하게.','이걸 맡아 줄 사람이 필요했네. 묻지는 말고.','혼돈의 파편을 사겠다는 자가 있어. 관심 있으면 다음에 오게.']],
    ['골목 고양이',['야옹. (무언가를 물고 와 발치에 내려놓는다)','고양이가 당신을 빤히 쳐다보다 사라졌다.','골목 끝에서 고양이 울음소리만 들려온다.']]]
};
const VIL_TOWN={meadow:['시작의 마을','에우도라'],rock:['바위 협곡','에트나'],swamp:['숨겨진 마을','로타스'],salt:['부유의 땅','히페리온'],ember:['','사막 쉼터'],frost:['빙하 연구소','칼리로에'],sea:['항구도시','벤테'],chaos:['암시장','데이모스']};
const VIL_LINES={
 meadow:{
  plaza:[['광장지기 루미',['어서 와요! 에우도라에 온 걸 환영해요! 처음이죠? 다 티 나요, 헤헤.','오늘 날씨 최고죠? 이런 날은 무조건 산책이에요!','길 잃으면 언제든 저한테 물어봐요. 에우도라 골목은 제가 다 알아요!']],['꽃집 소녀 포피',['이 꽃 한 송이 가져가요! 블레서님 얼굴이 환해 보이네요.','초원 바람 냄새 맡아 봤어요? 기분 좋아지죠!']]],
  grocer:[['빵집 주인 마고',['갓 구운 빵이에요! 하나 맛보고 가요, 돈은 됐어요!','배고프면 언제든 들러요. 블레서는 잘 먹어야 힘이 나죠!','우리 집 밀은 에우도라 들판에서 직접 키운 거예요. 자랑이죠!']],['짐꾼 소년 테오',['짐 들어 드릴까요? 저 힘 세요! 진짜예요!','오늘 처음 온 블레서님 맞죠? 반가워요!']]],
  clinic:[['치료사 엘린',['어머, 무릎 까졌네요! 이리 와요, 금방 낫게 해 줄게요.','다치면 참지 말고 바로 와요. 에우도라 사람들은 서로 챙겨요.','회복약 챙기셨어요? 없으면 하나 드릴게요!']],['견습 치료사 루카',['붕대 감는 연습 중인데 팔 좀 빌려주실래요? 헤헤.','선생님이 블레서님은 꼭 잘 대해 드리래요!']]],
  alley:[['골목 아이들',['블레서다! 블레서님, 같이 술래잡기해요!','우리 비밀 기지 보여 줄까요? 아무한테도 말하면 안 돼요!']],['골목 고양이',['야옹~ (당신 다리에 몸을 비빈다)','고양이가 배를 보이며 뒹군다. 완전히 경계를 푼 것 같다.']]]},
 rock:{
  plaza:[['투사 브론',['하! 팔뚝이 그게 뭐야? 에트나에 왔으면 바위 하나쯤은 맨손으로 깨야지!','한판 붙자고? 좋아, 언제든 환영이다! 하하하!','협곡 바람에 겁먹었냐? 여기선 소리 크게 지르는 놈이 이긴다!']],['광장 경비대장 고르',['어이 블레서! 칼은 뽑으라고 있는 거다. 망설이면 진다!','싸움 구경은 공짜지만, 끼어들면 책임은 네가 지는 거다!']]],
  grocer:[['고기 장수 무쇠손',['고기다! 뼈째 씹어 먹어라! 이가 약하면 에트나에서 못 산다!','깎아 달라고? 하하, 팔씨름으로 이기면 생각해 보지!','오늘 잡은 놈이다. 들소 세 마리를 맨주먹으로 쓰러뜨렸지!']]],
  clinic:[['돌팔이 의원 하켄',['뼈 부러졌냐? 그 정도면 그냥 붙는다! 다음 손님!','아프다고 울면 약값 두 배다. 이를 악물어!','에트나 놈들은 상처를 훈장으로 여기지. 너도 하나 달고 가라!']]],
  alley:[['협곡 깡패 둘',['어이, 이 골목 지나가려면 통행세 내야지! …농담이다, 하하! 근데 어깨는 왜 그리 좁냐?','덤빌 거면 지금 덤벼! 뒤에서 치는 건 에트나 방식이 아니거든!']],['골목 고양이',['하악! 고양이가 털을 곤두세우고 당신을 노려본다.','고양이가 돌멩이를 앞발로 툭 차더니 당당하게 지나간다.']]]},
 swamp:{
  plaza:[['장로 하윈',['안개가 마을까지 올라온 건 처음이에요. …처음이었던가요?','균열이 열린 뒤로 밤마다 늪이 숨을 쉬어요. 크게, 천천히.','마스크는 꼭 쓰고 다니세요. 숨은 한 번에 하나씩만 쉴 수 있으니까요.']],['안개 속의 노인',['…….','…왔구나.','…안개가 짙다. …조심하거라.']],['말없는 소녀',['……(고개를 살짝 끄덕인다)','…로타스는… 찾기 어려운 곳인데….']]],
  grocer:[['버섯 상인',['…버섯… 독은 빼 두었다…. …아마도.','…값은… 알아서….','……이건… 팔지 않는다.']]],
  clinic:[['약초꾼 이브',['독으로 독을 막아요. 이상하게 들리죠? 여기선 다 그래요.','마스크 끈이 풀리면 바로 말씀하세요. …그분도 자주 풀렸거든요.','안개 속에선 얼굴이 다 비슷해 보여요. 그래서 가끔 헷갈려요.']],['늪의 약사',['…해독제다. …서두르지 마라….','…늪의 독은… 조용히 퍼진다….','…아프면… 말해라. …작게.']]],
  alley:[['그림자 속의 누군가',['……(시선만 느껴진다)','…여기 온 걸… 아무도 모르게 해라….']],['골목 고양이',['……(고양이가 소리 없이 당신을 지켜본다)','고양이가 안개 속으로 스르륵 사라진다.']],['나룻배 사공 토르',['(노를 젓는 시늉을 하며 같은 노래를 흥얼거린다.)','균열까지 가는 손님은 오랜만이야. 아니, 지난번에도 그렇게 말했나.','배는 늘 같은 데로만 가. 그래도 손님들은 다른 데로 간다고 생각하더라.']]]},
 salt:{
  plaza:[['귀족 영애 셀레스트',['어머, 그 옷차림으로 히페리온 광장에 나오셨어요? 용기가 대단하시네요, 호호.','소금이 금값이라는 말 들어 봤죠? 여기선 반대예요. 금이 소금값이거든요.','시간 아깝게 왜 말을 거세요? 제 시간은 비싸요.']],['금박 장식의 신사',['자네, 지갑 사정은 괜찮나? 표정을 보니 아닌 것 같군. 흐흐.','히페리온에선 걷는 것도 돈이야. 농담 같지? 농담 아니라네.']]],
  grocer:[['향신료 상인 마르셀',['이 소금 한 꼬집이 당신 하루 일당이에요. 그래도 사실래요? 흐흐.','손님 같은 분은 구경만 하셔도 돼요. 아, 구경도 유료였나?','에누리요? 그런 단어는 히페리온 사전에 없어요.']]],
  clinic:[['개인 전담 의사',['진료는 예약제입니다. 아, 예약도 유료예요.','이 정도 상처면… 그냥 침 바르세요. 무료 처방입니다.','부자들은 아프지 않아요. 아프면 돈으로 해결하니까요.']]],
  alley:[['카지노 호객꾼',['형님, 골든 오아시스 가 보셨어요? 거기서 인생 바뀐 사람 많아요. …어느 쪽으로든.','돈 잃은 얼굴이네? 걱정 마, 다들 처음엔 그래. 흐흐흐.']],['살찐 고양이',['금목걸이를 한 고양이가 당신을 한심하다는 듯 쳐다본다.','고양이가 비단 방석 위에서 하품을 한다. 당신보다 잘 산다.']]]},
 ember:{
  plaza:[['쉼터지기 카심',['해가 정수리에 있을 때는 움직이지 마세요. 사막은 서두르는 자부터 삼킵니다.','물은 아껴 드세요. 다음 오아시스까지 얼마나 걸릴지 아무도 모릅니다.','…오늘은 유난히 덥군요. 그늘로 오세요.']],['길잡이 나디아',['모래 언덕 너머는 함부로 넘지 마세요. 신기루를 쫓다 돌아오지 못한 사람이 많아요.','발자국은 바람이 금방 지워요. 돌아올 길을 꼭 기억해 두세요.']]],
  grocer:[['대추야자 상인',['덥죠? 이 대추야자 하나 드세요. 땀으로 잃은 걸 채워 줍니다.','물 한 통은 금보다 귀합니다. 신중하게 고르세요.','햇볕에 말린 고기예요. 사막에선 이게 제일 오래 갑니다.']]],
  clinic:[['사막 치료사 자라',['얼굴이 벌겋네요. 더위 먹은 거예요. 일단 그늘에 앉으세요.','화상은 가볍게 보면 안 됩니다. 연고를 바르고 천천히 움직이세요.','사막에서 쓰러지는 건 순식간이에요. 무리하지 마세요.']]],
  alley:[['천막 아래 노인',['…이 더위에 골목까지 오다니. 급한 일이 아니면 해가 지고 다니게.','모래폭풍이 오기 전엔 바람 냄새가 바뀐다네. 잘 맡아 두게.']],['골목 고양이',['고양이가 그늘에 납작 엎드려 꼼짝도 하지 않는다.','고양이가 뜨거운 모래를 피해 한 발씩 조심스럽게 걷는다.']]]},
 frost:{
  plaza:[['연구원 이브',['어서 오세요. 칼리로에는 춥지만… 마음까지 얼진 않았으면 좋겠어요.','얼음 속에 무언가가 잠들어 있다는 기록이 있어요. 무엇인지는… 아직 몰라요.','눈이 그치면 별이 아주 잘 보여요. 그때 다시 이야기해요.']],['늙은 관측자',['눈은 조용히 모든 걸 덮지. 좋은 것도, 나쁜 것도.','자네가 찾는 답은 얼음 아래에 있을 수도 있고… 없을 수도 있네.']]],
  grocer:[['보급관 라일라',['따뜻한 수프 한 그릇 드릴까요? 손이 너무 차가워 보여요.','서리 열매는 겨울에만 달아요. 이상하죠? 이유는 아무도 몰라요.','필요한 게 있으면 말해요. 없으면… 그냥 쉬다 가요.']]],
  clinic:[['의무관 세린',['동상은 늦게 알아차릴수록 위험해요. 손가락 좀 볼게요.','천천히 숨 쉬세요. 찬 공기도 익숙해지면 괜찮아져요.','몸이 기억하는 추위는… 오래 남아요. 조심하세요.']]],
  alley:[['얼음 조각가',['이 조각은 내일이면 녹아요. 그래도 만들어요. 왜냐고요? …글쎄요.','길 끝에 연구소에서 금지한 구역이 있어요. 거긴… 가지 않는 게 좋아요.']],['골목 고양이',['털이 두툼한 고양이가 당신 발치에 조용히 앉아 온기를 나눈다.','고양이가 눈송이를 앞발로 톡톡 건드린다.']]]},
 sea:{
  plaza:[['선장 바르보사',['하하하! 벤테에 온 걸 환영하네! 바다 냄새 좀 맡아 봐, 이게 사는 맛이지!','오늘 그물에 대어가 걸렸다네! 저녁은 내가 쏘지!','파도가 높을수록 심장이 뛰지 않나? 하하!']],['어부 토마스',['어이, 블레서! 낚싯대 좀 다룰 줄 아나? 모르면 내가 가르쳐 주지!','바다는 거짓말을 안 해. 성실하게 던지면 언젠간 물어!']]],
  grocer:[['어시장 아줌마 벨라',['싱싱한 고등어 있어요~! 오늘 아침에 들어온 거예요!','블레서 양반, 회 한 접시 먹고 가! 기운이 펄펄 날 거야!','꽃게가 살이 꽉 찼어! 안 사면 후회한다니까!']]],
  clinic:[['항구 치료사 마린',['낚싯바늘에 찔렸어요? 어부들은 하루에 열 번은 와요, 하하!','멀미약 필요해요? 배 타기 전에 미리 먹어 둬요!','바닷바람 맞으면 상처가 금방 아물어요. 진짜예요!']]],
  alley:[['술 취한 선원',['내가 말이야~ 리바이어던을 봤다니까! 이~만했어! 히끅!','바다 노래 하나 불러 줄까? 요호호~!']],['항구 고양이',['고양이가 생선 대가리를 물고 의기양양하게 지나간다.','고양이가 어부의 바구니를 노리며 꼬리를 흔든다.']]]},
 chaos:{
  plaza:[['얼굴 없는 상인',['살 것도 없고, 팔 것도 없다. 너도 결국 여기 남게 될 거야.','데이모스에 온 걸 축하해. 축하할 일은 아니지만.','희망? 그건 지난주에 다 팔렸어.']],['쉰 목소리의 사내',['신들은 이 땅을 버렸어. 그러니 우리가 신 대신 너를 버려 주지.','하늘을 보지 마. 하늘도 너를 보고 있으니까.']]],
  grocer:[['녹슨 저울의 상인',['이건 고기야. 무슨 고기냐고? …묻지 않는 게 좋아.','값은 네 기억 하나면 돼. 어떤 기억이냐고? 아무거나. 넌 모를 테니까.','오늘 들어온 물건은 어제 죽은 놈 거야. 상태는 좋아.']]],
  clinic:[['검은 붕대의 의사',['상처는 낫지 않아. 그냥 다른 곳으로 옮겨 갈 뿐이지.','치료해 줄게. 대신 네 그림자를 조금 떼어 갈 거야.','아프지? 다행이네. 아직 살아 있다는 뜻이니까.']]],
  alley:[['벽에 기댄 무언가',['…너, 백야의 신전 냄새가 나.','흐흐흐… 일곱 번째 나팔은 이미 불렸어. 아무도 못 들었을 뿐.','뒤돌아보지 마. 지금 네 뒤에 있는 건 네가 아니니까.']],['눈이 셋인 고양이',['세 개의 눈이 동시에 당신을 바라본다. 하나는 웃고 있다.','고양이가 사람 목소리로 "늦었어" 하고 말하고는 사라진다.']]]}
};
const VIL_DAILY_REWARD=10;
const VIL_AVOID={plaza:['광장 사람들이 당신을 보자 슬금슬금 자리를 피한다.','음유시인이 갑자기 류트 줄을 고치는 척한다.','게시판지기가 "아, 바쁘다 바빠" 하며 서류 더미 뒤로 숨는다.','당신이 다가가자 광장의 대화 소리가 뚝 끊긴다.'],
  grocer:['노점 주인이 바쁜 척 같은 사과를 세 번째 닦고 있다.','식료품점 주인이 "오늘은 영업 끝났어요!" 하고 문패를 뒤집는다.','짐꾼 소년이 상자를 들고 도망치듯 뛰어간다.','가게 안에서 누군가 "또 그 블레서야…" 하고 속삭인다.'],
  clinic:['치료사가 환자를 보는 척하며 커튼을 친다.','견습 치료사가 붕대를 감다 말고 뒷문으로 사라진다.','"진료 시간이 끝났습니다"라는 팻말이 걸려 있다.','치료소 안이 갑자기 아주 조용해진다.'],
  alley:['골목 사람들이 당신의 발소리를 듣고 그림자 속으로 흩어진다.','정보상이 모자를 푹 눌러쓰고 못 본 척 지나간다.','골목 고양이마저 하품을 하고 돌아눕는다.','"…또 왔어?" 누군가 혀를 차는 소리만 들린다.']};
function villageName(land){const t=VIL_TOWN[land];return t?t[1]:LANDS[land];}
function villageFull(land){const t=VIL_TOWN[land];return t?(t[0]?`${t[0]}, ${t[1]}`:t[1]):LANDS[land];}
Object.assign(ITEMS,{q_letter:{name:'봉인된 편지',type:'mat',tag:'퀘스트 아이템',desc:'치료사 엘린이 맡아 둔 편지. 밀랍 위에 신전 문장이 찍혀 있다.'}});
const VIL_QUEST={id:'V1',cat:'sub',title:'치료소에 맡긴 편지',published:true,level:1,prereq:null,repeat:null,cond:{},
  desc:'광장 게시판지기 하나가 초원의 땅 치료소에 맡겨 둔 편지를 찾아와 달라고 부탁한다.',start:'s1',steps:{
  s1:{text:'하나: "초원의 땅 치료소에 엘린 선생님이 편지 하나를 맡아 두셨대요. 제가 자리를 비울 수가 없어서… 대신 받아 와 주실래요?" (탐색 › 초원의 땅 › 마을 › 치료소)',
    give:{land:'meadow',spot:'clinic',item:'q_letter',n:1,npc:'치료사 엘린',text:'아, 하나가 보냈군요. 이 편지예요. 밀랍은 절대 뜯지 말라고 전해 주세요.'},
    choices:[{label:'받아 온 편지를 건넨다',req:{item:'q_letter'},result:'하나는 편지의 문장을 보고 얼굴이 굳었다가, 곧 웃으며 고맙다고 했다.',next:'s2'},{label:'아직 받지 못했다고 말한다',result:'하나: "치료소는 광장 옆 골목에 있어요. 천천히 다녀오세요."',next:'s1'}]},
  s2:{text:'하나가 편지를 품에 넣으며 속삭인다. "이건 백야의 신전에서 온 거예요. 아무한테도 말하지 마세요."',choices:[{label:'비밀을 지키겠다고 약속한다',result:'하나가 작은 주머니를 건넨다.',next:'end',flag:'v1_letter'}]},
  end:{end:true,text:'편지 전달',reward:{exp:80,gold:40,items:{potion:1}}}}};
Object.assign(ITEMS,{q_wallet:{name:'텅 빈 가죽 지갑',type:'mat',tag:'퀘스트 아이템',desc:'뒷골목에서 털린 내 지갑. 동전 한 닢 남김없이 비어 있다.'}});
const THEFT_GOLD=5,THEFT_RATE=0.03;
const THEFT_QUEST={id:'D_THEFT',cat:'repeat',title:'잃어버린 골드를 찾아서',published:true,level:1,prereq:null,repeat:'daily',trigger:'theft',cond:{},
  desc:'뒷골목에서 눈 깜짝할 사이에 지갑을 털렸다. 소매치기의 흔적을 쫓아 도난당한 골드를 되찾자.',start:'s1',steps:{
  s1:{text:'주머니가 가볍다. 골목 어귀에서 부딪혔던 망토 쓴 꼬마가 떠오른다. 지갑을 털린 마을의 뒷골목으로 돌아가 단서를 찾아보자. (탐색 › 지역 › 마을 › 뒷골목)',
    give:{land:'@theft',spot:'alley',item:'q_wallet',n:1,npc:'뒷골목의 정보상 녹스',text:'꼬마 소매치기 말이지? 빈 지갑은 저 쓰레기통에 던져 놓고 갔어. 녀석은 지금쯤 광장 분수대 뒤에서 동전을 세고 있을걸.'},
    choices:[{label:'빈 지갑을 들고 광장 분수대로 간다',req:{item:'q_wallet'},result:'분수대 뒤에서 망토를 쓴 꼬마가 동전을 세다가 당신과 눈이 마주쳤다.',next:'s2'},
      {label:'아직 단서를 찾지 못했다',result:'뒷골목 사람들이라면 무언가 알고 있을지도 모른다.',next:'s1'}]},
  s2:{text:'꼬마가 동전을 움켜쥔 채 얼어붙는다. "도, 동생 약값이 필요했어요… 진짜예요."',choices:[
    {label:'골드를 돌려받고 용서해 준다',result:'꼬마가 고개를 푹 숙이고 골드를 돌려준다. "다시는 안 그럴게요." 골목 끝에서 누군가 박수를 친다.',next:'end',flag:'theft_back'},
    {label:'경비대에 넘긴다',result:'경비대가 꼬마를 데려가며 되찾은 골드를 건넨다. "협조에 감사드립니다, 블레서님."',next:'end',flag:'theft_back'}]},
  end:{end:true,text:'잃어버린 골드를 되찾음',reward:{exp:0,gold:10,items:{}}}}};
function doAdvance(job){const me=S.me;const from=me.job;if(CLASSES[from].tier!==1||!CLASSES[from].adv.includes(job))return;me.job=job;setTimeout(checkTitles,0);me.advancedAt=now();S.sel.advPick=null;logChange('전직',[{field:me.name,before:CLASSES[from].name,after:CLASSES[job].name}]);
    S.chat.lobby.push({id:uid('m'),sys:true,text:`${me.name}님이 ★ ${CLASSES[job].name}(으)로 전직했습니다.`,ts:now()});save();render();toast(`★ ${CLASSES[job].name}(으)로 전직했습니다. 새 스킬을 확인하세요.`,'good');}

/* ───────── 파티 레이드 보스 (지역별 · 용병으로 솔로 가능) ───────── */
function partyBoss(o){const L=o.level,big=!!o.big,g=1+(L-1)/196,hp=Math.round(760*(1+0.09*(L-1))/1.18*(big?1.8:1)*g),atk=Math.round(60*(1+0.07*(L-1))/1.14*(big?1.15:1)*g);
  return {kind:'party',published:true,rev:1,maxLevel:null,min:big?4:3,max:big?5:4,target:big?4:3,roles:big?{tank:1,dps:2,heal:1}:{tank:1,dps:1,heal:1},
    hp,hpScale:0.3,atk,def:0,singleMult:1.0,aoeMult:0.6,aoeEvery:3,dotChance:0.3,dotDmg:Math.round(atk*0.13),
    exp:Math.round(fieldExp(L)*5),gold:Math.round(fieldGold(L)*5),drops:[['potion',0.5]],...o,big:undefined};}
const PARTY_BOSSES=[
  partyBoss({id:'pb_hydra',name:'독안개 히드라',art:'beast',region:'독안개 늪',level:25,desc:'늪 바닥에서 깨어난 머리 셋 달린 뱀. 머리 하나를 베면 독안개가 더 짙어진다.',singleName:'세 갈래 물기',aoeName:'독안개 분출',dotName:'맹독',dotChance:0.4}),
  partyBoss({id:'pb_merchant',name:'백염의 상인왕',art:'golem',region:'백염 대상로',level:35,big:true,desc:'소금 사막의 대상로를 쥐고 흔드는 상인. 금화로 만든 갑옷을 입고 있다. 사람들은 그가 언제부터 그 자리에 있었는지 기억하지 못한다.',singleName:'금화 세례',aoeName:'계약 집행',dotName:'빚',dotChance:0.3}),
  partyBoss({id:'pb_captain',name:'유령선의 선장 그레이',art:'spirit',region:'난파선 묘지',level:45,big:true,desc:'출항하지 않는 배의 선장. 밤마다 항구의 등대를 향해 키를 돌린다.',singleName:'녹슨 커틀러스',aoeName:'파도 일제 사격',dotName:'짠물',dotChance:0.3}),
  partyBoss({id:'pb_ignis',name:'용암 거인 이그니스',art:'golem',region:'분화구 심부',level:57,big:true,desc:'작열의 땅 분화구에서 걸어 나온 거인. 발자국마다 땅이 녹아내린다.',singleName:'용암 주먹',aoeName:'분화',dotName:'화상',dotChance:0.4}),
  partyBoss({id:'pb_paladin',name:'얼어붙은 성기사',art:'golem',region:'빙결 성채',level:72,big:true,desc:'성채 문 앞에서 얼음에 갇힌 채 서 있는 기사. 누구에게 한 맹세인지 기억하지 못한 채 문을 지킨다.',singleName:'서리 대검',aoeName:'빙결의 맹세',dotName:'동상',dotChance:0.35}),
  partyBoss({id:'pb_herald',name:'녹슨 나팔의 전령',art:'spirit',region:'녹투성이 호수',level:85,big:true,desc:'블라스파미아 호숫가에서 녹슨 나팔을 든 채 서 있는 전령. 나팔을 불 때마다 하늘이 한 칸씩 어두워진다.',singleName:'녹슨 창',aoeName:'종말의 나팔',dotName:'부식',dotChance:0.4})];
const PB_GEAR={pb_hydra:3,pb_merchant:4,pb_captain:5,pb_ignis:6,pb_paladin:7,pb_herald:8};
const RELEVEL={forest:[5,5],tracker:[15,5],ev_rift:[20,6],ev_crown:[40,6],guardian:[90,10]};
const LVMAP_V=2,GROUP_GEAR={forest:1,tracker:2,ev_rift:3,ev_crown:5,guardian:8};
PARTY_BOSSES.forEach(m=>{const T=PB_GEAR[m.id];m.drops=[...m.drops,...gearOfTier(T).filter(k=>!ITEMS[k].wtype).map(k=>[k,0.15]),...gearOfTier(T).filter(k=>ITEMS[k].wtype).map(k=>[k,0.03])];});
function ensureRelevel(){
  if(S.data&&S.data.monsters&&!S.data.hpX2){S.data.monsters.forEach(m=>{if(m.hp)m.hp*=2;});S.data.hpX2=1;Object.keys(AREA_MON).forEach(k=>delete AREA_MON[k]);save();}
  if(S.data&&S.data.config&&!S.data.advLv20){if([10,30].includes(S.data.config.jobAdvanceLevel))S.data.config.jobAdvanceLevel=20;S.data.advLv20=1;save();}
  if(!S.data||!S.data.monsters||(S.data.lvMap||0)>=LVMAP_V)return;
  const fresh=Object.fromEntries(EXTRA_MONSTERS.filter(m=>m.kind==='field'||m.kind==='dungeon').map(m=>[m.id,m]));
  S.data.monsters=S.data.monsters.map(m=>{
    if(fresh[m.id])return {...clone(fresh[m.id]),published:m.published!==false};
    const G=GROUP_GEAR[m.id];if(G){const have=new Set((m.drops||[]).map(d=>d[0]));m={...m,drops:[...(m.drops||[]),...gearOfTier(G).filter(k=>!have.has(k)&&!ITEMS[k].wtype).map(k=>[k,0.15]),...gearOfTier(G).filter(k=>!have.has(k)&&ITEMS[k].wtype).map(k=>[k,0.03])]};}
    const R=RELEVEL[m.id];if(!R||m.level===R[0])return m;
    const o=m.level||1,L=R[0],hr=(1+0.09*(L-1))/(1+0.09*(o-1)),ar=(1+0.07*(L-1))/(1+0.07*(o-1));
    return {...m,level:L,hp:Math.round(m.hp*hr),atk:Math.round(m.atk*ar),dotDmg:Math.round((m.dotDmg||0)*ar),exp:Math.round(fieldExp(L)*R[1]),gold:Math.round(fieldGold(L)*R[1])};});
  Object.keys(AREA_MON).forEach(k=>delete AREA_MON[k]);S.data.lvMap=LVMAP_V;save();
}
function qReward(q,r){if(r&&r.gearTier&&S.me){const T=r.gearTier;const w=gearOfTier(T).find(k=>ITEMS[k].wtype&&classAllowed(ITEMS[k],S.me.job));const k=w||`g${T}_armor`;r={...r,items:{...(r.items||{}),[k]:1}};delete r.gearTier;}
  if(!r||!q||!q.repeat||!S.me)return r;const L=S.me.level;if(L<=q.level+2)return r;
  return {...r,exp:Math.max(r.exp||0,Math.round(needOf(L)*0.1)),gold:Math.max(r.gold||0,Math.round((r.gold||0)*(1+(L-q.level)/10)))};}

/* ───────── 메인 스토리 · 서장과 1장 (2054 재오픈) ───────── */
Object.assign(ITEMS,{
  q_return:{name:'라니아케아로의 귀환',type:'mat',tag:'???',desc:'이 세계에 머무르시겠습니까? ▒▒▒ 귀환 대상: [데이터 없음] · 사용 기한: 영원 · 이 아이템은 버릴 수 없습▒',price:0},
  j2052:{name:'낡은 탐사 일지',type:'mat',tag:'이스터에그',desc:'늪 한가운데, 균열 가장자리에서 주운 가죽 표지의 일지. 방패 두 개가 겹친 길드 문장이 찍혀 있다. 대부분의 쪽이 물에 젖어 서로 붙어 있다. 사용하면 읽는다.',price:0}});
/* 2052년 탐사 일지: 챕터가 진행될수록 읽을 수 있는 쪽이 늘어난다(S.me.jPages, 3장에서 1쪽). 4장 이후 J2052_LATER를 한 쪽씩 연다. */
const J2052_P1='2052.10.19\n오늘도 나갈 방법은 없다.\n그래도 하늘이 우리를 보고 있는 것 같다.\n\n— 아우로라';
const J2052_LATER=['2052.09.14 — 타임어택 접수 완료. 컨빨이랑 템빨이 한 공대라니 웃기다.\n2052.09.14 — 로그아웃 버튼이 회색이다. 운영진 공지 기다리는 중.','2052.09.21 — 일주일째. 여기 사람들은 우리가 나갈 수 없다는 걸 아는 것 같다.','2052.10.03 — 지역마다 이변이 있다. 다 해결하면 나갈 수 있대. 진짜일까.'];
function j2052Text(){const me=S&&S.me;const n=Math.max(1,(me&&me.jPages)||1);const pages=[J2052_P1+(S&&S.flags&&S.flags.ch3_clear?'\n\n(1쪽 맨 아래, 아까는 없던 단어 하나가 번져 있다. 「히페리온」)':''),...J2052_LATER.slice(0,n-1)];
  return pages.join('\n\n― ― ―\n\n')+(n-1<J2052_LATER.length?'\n\n(나머지 쪽은 물에 젖어 붙어 있다. 억지로 떼면 찢어질 것 같다.)':'\n\n(마지막 장은 찢겨 있다.)');}
Object.defineProperty(ITEMS.j2052,'readText',{get:j2052Text,enumerable:true,configurable:true});

Object.assign(ITEMS,{q_mask:{name:'빈 안개 마스크',type:'mat',tag:'퀘스트 아이템',desc:'약초꾼 이브가 건넨 가죽 마스크. 늪 독샘을 먹여야 숨을 쉴 수 있다.'},q_ferry:{name:'토르의 나룻배 표',type:'mat',tag:'퀘스트 아이템',desc:'나무 조각에 배 그림이 새겨져 있다. 뒷면에는 오늘 날짜가 이미 적혀 있다.'},q_lamp:{name:'꺼진 등불',type:'mat',tag:'퀘스트 아이템',desc:'장로 하윈이 맡긴 낡은 등불. 정화의 성수를 부으면 다시 켜진다고 한다.'},q_pilgrim:{name:'순례자의 표식',type:'mat',tag:'퀘스트 아이템',desc:'에트나 안내인이 건넨 돌 표식. 손때가 묻어 반들반들하다.'},q_cavemap:{name:'동굴 지도',type:'mat',tag:'퀘스트 아이템',desc:'무너진 바위 동굴로 가는 길이 그려진 낡은 지도. 종이만 새것이다.'}});
const STORY_MONS=[soloMon({id:'st_statue',name:'시련의 석상',art:'golem',kind:'story',region:'순례자의 길',level:11,statLevel:12,tier:'story',desc:'순례자의 길 끝에서 블레서를 시험하는 거대한 석상.',singleName:'바위 주먹',aoeName:'지진',dotName:'균열',dotChance:0.2}),soloMon({id:'st_monk',name:'동굴의 은둔 무승',art:'golem',kind:'story',region:'무너진 바위 동굴',level:17,statLevel:18,tier:'story',desc:'언제부터 동굴에 있었는지 아무도 모르는 무승.',singleName:'발레티 정권',aoeName:'산을 울리는 발경',dotName:'내상',dotChance:0.3}),soloMon({id:'st_leech',name:'늪가의 독거머리 떼',art:'beast',kind:'story',region:'로타스 늪가',level:20,statLevel:21,tier:'story',desc:'마스크 없이 늪가에 나온 사람에게 한꺼번에 달라붙는 거머리 떼.',singleName:'달라붙기',aoeName:'떼로 덮치기',dotName:'흡혈',dotChance:0.35}),
  soloMon({id:'st_rift',name:'균열에서 기어 나온 것',art:'spirit',kind:'story',region:'늪 한가운데의 균열',level:22,statLevel:23,tier:'story',desc:'보랏빛 균열에서 기어 나온 무언가. 형체가 한 박자씩 늦게 따라온다.',singleName:'끌어당기기',aoeName:'균열의 파동',dotName:'잠식',dotChance:0.3}),
  soloMon({id:'st_warden',name:'수문 파수꾼',art:'golem',kind:'story',region:'물에 잠긴 등대 신전',level:25,statLevel:26,tier:'story',desc:'등대 신전의 수문을 지키는 돌 파수꾼. 이끼가 눈을 덮어도 정확히 침입자 쪽을 본다.',singleName:'수문 망치',aoeName:'역류',dotName:'이끼 독',dotChance:0.3}),
  soloMon({id:'st_serpent',name:'고대 바다뱀',art:'beast',kind:'story',region:'물에 잠긴 등대 신전 깊은 곳',level:28,statLevel:29,tier:'story',desc:'균열의 기운에 깨어나 등대 신전에 똬리를 튼 늪의 주인. 비늘 사이로 독안개가 새어 나온다. [3장 보스]',singleName:'꼬리 후려치기',aoeName:'몸통 휘감기',dotName:'독니',dotChance:0.2,
    sphases:[{at:100,name:'1페이즈'},{at:60,name:'2페이즈 · 독안개',say:'바다뱀이 독안개를 내뿜는다. 중독되면 정화의 성수로 풀 수 있다',atkMul:1.3,dotName:'독안개 중독',dotChance:0.55,dotMul:1.5,aoeName:'독안개 내뿜기'},{at:25,name:'3페이즈 · 붕괴',say:'신전 바닥이 무너진다',atkMul:1.6,aoeName:'바닥 붕괴',aoeMult:0.75,aoeEvery:2,dotChance:0.25}]}),
  soloMon({id:'st_witch',name:'풀숲의 마녀',art:'spirit',kind:'story',region:'비명 지르는 풀숲',level:8,statLevel:9,tier:'story',desc:'머리카락이 덩굴처럼 자란 여자. 노래를 부르며 사람을 풀숲으로 끌어들인다.',singleName:'덩굴 채찍',aoeName:'비명의 노래',dotName:'가시 독',dotChance:0.35})];
const STORY_QUESTS=[
 {id:'E0',cat:'epic',title:'블레스 링크',published:true,level:1,prereq:null,repeat:null,cond:{},
  desc:'2054년, <Bleset Saga>가 다시 문을 열었다. 블레스 링크를 쓰고 처음으로 접속한다.',start:'s1',steps:{
  s1:{text:'블레스 링크가 정맥과 홍채를 읽어 들인다. "생체 정보 동기화 100%." 눈을 뜨자 풀 냄새가 지나치게 진하다. 바람이 뺨을 스치는 감각까지 그대로다.',choices:[
    {label:'손등을 꼬집어 본다',result:'아프다. 분명히 게임인데.',next:'s2'},
    {label:'주변을 둘러본다',result:'황혼녘 강가, 아움타주 신전 앞. 강가의 사람들이 일제히 고개를 돌려 당신을 본다.',next:'s2'}]},
  s2:{text:'흰 옷을 입은 사제가 다가와 고개를 숙인다. "어서 오세요, 이방인. 저는 이레나예요. 기다리고 있었어요. …아주 오래."',choices:[
    {label:'인사를 건넨다',result:'이레나가 웃는다. 웃음이 1초쯤 너무 길다. "라니아케아에 오신 걸 환영해요."',next:'end',flag:'e0_link'},
    {label:'메뉴 화면을 열어 본다',result:'익숙한 게임 메뉴가 떠오른다. 아무것도 이상하지 않다. 이상하지 않은데, 괜히 한 번 더 확인하게 된다.',next:'end',flag:'e0_link'}]},
  end:{end:true,text:'첫 접속',reward:{exp:60,gold:30,items:{potion:1}}}}},
 {id:'E4',cat:'epic',title:'비명 지르는 풀숲',published:true,level:7,prereq:'E3',repeat:null,cond:{},
  desc:'황혼녘 강가 마을에서 또 사람이 사라졌다. 밤마다 풀숲에서 비명 같은 노래가 들린다고 한다. [1장 마지막 이야기]',start:'s1',steps:{
  s1:{text:'이레나가 다급하게 당신을 붙잡는다. "강가 마을에서 또 사라졌어요. 이번엔 아이예요. 풀숲에서 노래가 들렸대요." 사라진 탐사대의 흔적도 그 풀숲으로 이어진다.',choices:[
    {label:'곧장 풀숲으로 향한다',result:'풀숲 입구, 풀잎들이 바람도 없이 한쪽으로 눕는다.',next:'s2'}]},
  s2:{text:'덤불 아래에 아이의 헝겊 인형이 떨어져 있다. 주워 들자 인형의 웃는 입 모양이 방금 전보다 조금 더 벌어진 것 같다.',choices:[
    {label:'인형을 챙기고 노래를 따라간다',result:'노래가 가까워진다. 같은 소절이 조금도 틀리지 않고 계속 반복된다.',next:'s3',flag:'e4_doll'}]},
  s3:{text:'풀숲 한가운데, 머리카락이 덩굴처럼 자란 여자가 노래를 멈추고 고개를 든다. 당신을 한참 바라보더니, 처음 보는 사람이 아닌 것처럼 웃는다.',battle:'st_witch',next:'s4',winText:'마녀가 무너지며 노래가 끊긴다. 덩굴이 시들고, 잠들어 있던 아이가 깨어난다. 아이는 울지 않는다.'},
  s4:{text:'마을로 돌아오자 사람들이 일제히 박수를 친다. 박수 소리가 똑같은 박자로, 조금 너무 오래 이어진다. 이레나가 보상 꾸러미를 건넨다. "정말 잘하셨어요. 모두 당신을 좋아하게 될 거예요."',choices:[
    {label:'꾸러미를 받는다',result:'고개를 들자 박수가 뚝 멈춘다. 사람들은 아무 일 없다는 듯 하던 일로 돌아간다.',next:'end',flag:'ch1_clear'}]},
  end:{end:true,text:'1장 「사라진 탐사대」 완료',reward:{exp:900,gold:250,items:{potion:2},gearTier:1}}}},
 {id:'E5',cat:'epic',title:'순례자의 길',published:true,level:10,prereq:'E4',repeat:null,cond:{},
  desc:'이레나가 바위의 땅으로 가 보라고 권한다. 영웅이 되려는 블레서는 모두 순례자의 길을 지난다고 한다. [2장 「시련의 길」]',start:'s1',steps:{
  s1:{text:'"바위의 땅 에트나에 가 보세요. 순례자의 길을 걷는 블레서들을 안내하는 분이 계세요." 이레나가 손을 흔든다. 당신이 모퉁이를 돌 때까지, 같은 속도로. (탐색 › 바위의 땅 › 마을 › 광장)',
    give:{land:'rock',spot:'plaza',item:'q_pilgrim',n:1,npc:'순례자 안내인 테온',text:'순례자의 길은 마을 뒤 산허리부터 시작해요. 이 표식을 들고 가세요. …아, 그리고 길 끝의 석상이 말을 걸어도 대답하지 마세요. 다들 그러라고 하더라고요.'},
    choices:[{label:'표식을 들고 순례자의 길로 오른다',req:{item:'q_pilgrim'},result:'산허리를 따라 돌계단이 이어진다. 계단마다 누군가의 발자국이 깊게 패어 있다.',next:'s2'},
      {label:'아직 에트나에 가지 못했다',result:'에트나 광장의 안내인을 찾아야 한다.',next:'s1'}]},
  s2:{text:'길 중간, 바위에 이름들이 빼곡하게 새겨져 있다. 길을 지난 순례자들이 남긴 것이라고 한다. 이름들 사이로 손바닥만 한 빈자리가 남아 있다.',choices:[
    {label:'내 이름을 새긴다',result:'돌이 생각보다 쉽게 파인다. 마치 원래 그 자리에 있었던 것처럼.',next:'s3',flag:'e5_name'},
    {label:'그냥 지나간다',result:'지나치고 한참 뒤에 돌아보니, 빈자리가 조금 더 커져 있는 것 같다.',next:'s3',flag:'e5_pass'}]},
  s3:{text:'길 끝, 거대한 석상이 고개를 숙인 채 서 있다. 가까이 가자 석상의 목이 천천히, 아주 천천히 당신 쪽으로 돌아간다.',battle:'st_statue',next:'s4',winText:'석상이 무릎을 꿇는다. 갈라진 틈 사이로 따뜻한 바람이 새어 나온다. 석상은 마지막까지 당신 얼굴을 보고 있었다.'},
  s4:{text:'산을 내려오자 테온이 박수를 친다. "처음 오신 분이 한 번에 넘으신 건 정말 오랜만이에요. 그럼 이제…" 그는 말을 멈추고 잠시 허공을 본다. "…다음 분이 오시겠네요."',choices:[
    {label:'에트나로 돌아간다',result:'테온은 다음 순례자를 기다리며 같은 자리에 선다.',next:'end',flag:'e5_trial'}]},
  end:{end:true,text:'순례자의 길 완주',reward:{exp:1400,gold:300,items:{potion:2}}}}},
 {id:'E6',cat:'epic',title:'발레티의 문하생',published:true,level:13,prereq:'E5',repeat:null,cond:{},
  desc:'에트나 사람들은 모두 어느 정도 무술을 배운다. 수련장에서 동굴의 은둔 무승 이야기를 듣는다. [2장 「시련의 길」]',start:'s1',steps:{
  s1:{text:'새벽의 에트나. 광장에 마을 사람들이 줄지어 서서 같은 동작으로 수련하고 있다. 아이도, 노인도, 빵집 주인도. 한 박자도 어긋나지 않는다.',choices:[
    {label:'수련에 끼어 본다',result:'동작을 따라 하다 한 박자 늦었다. 모두가 동시에 멈추고, 동시에 당신을 본다. 그리고 동시에 다시 움직인다.',next:'s2',flag:'e6_join'},
    {label:'수련이 끝날 때까지 지켜본다',result:'해가 다 뜨자 사람들이 일제히 흩어진다. 아무도 서로 인사하지 않는다.',next:'s2',flag:'e6_watch'}]},
  s2:{text:'사범 카이가 다가온다. "무너진 바위 동굴에 은둔하신 스승님이 계세요. 아무도 그분이 언제부터 거기 계셨는지 몰라요. 동굴 가는 길은 뒷골목 정보상이 안다던데요." (탐색 › 바위의 땅 › 마을 › 뒷골목)',
    give:{land:'rock',spot:'alley',item:'q_cavemap',n:1,npc:'뒷골목의 정보상 녹스',text:'동굴? 지도는 여기 있어. …근데 이상하지 않아? 그 무승, 내가 어릴 때도 똑같은 얼굴이었거든.'},
    choices:[{label:'지도를 들고 사범에게 돌아간다',req:{item:'q_cavemap'},result:'카이가 지도를 보고 고개를 끄덕인다. "스승님께 안부 전해 주세요. 늘 같은 말만 하시겠지만요."',next:'end',flag:'e6_map'},
      {label:'아직 정보상을 찾지 못했다',result:'에트나 뒷골목에 정보상이 있다고 했다.',next:'s2'}]},
  end:{end:true,text:'동굴로 가는 길',reward:{exp:1900,gold:380,items:{}}}}},
 {id:'E7',cat:'epic',title:'무너진 바위 동굴',published:true,level:16,prereq:'E6',repeat:null,cond:{},
  desc:'은둔 무승을 찾아 무너진 바위 동굴로 들어간다. [2장 「시련의 길」 마지막 이야기]',start:'s1',steps:{
  s1:{text:'동굴 안은 생각보다 넓다. 벽에는 같은 무술 동작이 수백 번, 수천 번 새겨져 있다. 맨 안쪽, 가부좌를 튼 무승이 눈을 감은 채 말한다. "…늦었구나."',choices:[
    {label:'"저를 기다리셨어요?"',result:'"아니. 늘 누군가를 기다릴 뿐이다." 무승이 눈을 뜬다. 눈동자가 당신이 아니라 당신 뒤의 허공을 본다.',next:'s2'},
    {label:'말없이 자세를 잡는다',result:'무승이 처음으로 웃는다. "그래. 말은 필요 없지."',next:'s2'}]},
  s2:{text:'"수련이 끝나지 않았다. 몇 번째 해가 뜨는지도 잊었다. 네가 나를 넘으면… 그래, 나도 조금은 쉴 수 있겠지."',battle:'st_monk',next:'s3',winText:'무승이 천천히 주저앉는다. "…드디어, 쉴 수 있겠군." 그는 그대로 눈을 감는다. 숨소리가 들리지 않는다.'},
  s3:{text:'동굴을 나서자 해가 지고 있다. 에트나 쪽에서 수련하는 소리가 들린다. 오늘따라 그 박자가 한 번, 아주 살짝 어긋난다. 그날 밤 꿈속에서 누군가 당신의 클래스 이름을 부른다.',choices:[
    {label:'꿈에서 깬다',result:'이불이 땀에 젖어 있다. 게임 속인데도.',next:'end',flag:'ch2_clear'}]},
  end:{end:true,text:'2장 「시련의 길」 완료',reward:{exp:2600,gold:500,items:{potion:2},gearTier:2}}}},
 {id:'E8',cat:'epic',title:'안개 마스크',published:true,level:20,prereq:'E7',repeat:null,cond:{adv:true},
  desc:'늪 한가운데 보랏빛 균열이 열린 뒤로, 독안개가 마을까지 차오른다. 늪의 마을 로타스로 향한다. [3장 「독안개 아래」]',start:'s1',steps:{
  s1:{text:'늪의 땅으로 들어서자 숨이 턱 막힌다. 말뚝 위에 선 집들 사이로 보랏빛 안개가 낮게 깔려 있다. 마을 사람들은 모두 가죽 마스크를 쓰고 있다. 치료소의 약초꾼이 마스크를 만들어 준다고 한다. (탐색 › 늪의 땅 › 마을 › 치료소)',
    give:{land:'swamp',spot:'clinic',item:'q_mask',n:1,npc:'약초꾼 이브',text:'"돌아오셨네요, 아우로라 님." 이브가 반갑게 웃다가, 당신 얼굴을 다시 보고 멈칫한다. "…아, 죄송해요. 닮은 분이 계셨어요. 마스크가 없으시군요. 이 마스크에 늪 독샘을 먹이면 안개를 걸러 줘요."'},
    choices:[{label:'마스크를 받아 든다',req:{item:'q_mask'},result:'이브가 늪 독샘 세 개가 필요하다고 한다. 늪의 생물에게서 얻을 수 있다.',next:'s2'},
      {label:'아직 치료소에 가지 못했다',result:'로타스 치료소의 약초꾼을 찾아야 한다.',next:'s1'}]},
  s2:{text:'이브: "독샘 세 개면 충분해요. 독으로 독을 막는 거예요. 이상하게 들리죠?" (늪 독샘 3개 · 늪의 땅 필드 사냥)',choices:[
    {label:'늪 독샘 3개를 건넨다',req:{items:{venom:3}},take:{venom:3},result:'이브가 독샘을 짜 마스크 안쪽에 바른다. 쓴 냄새가 나더니, 이내 숨이 편해진다.',next:'s3'},
    {label:'아직 모으지 못했다',result:'늪의 생물을 사냥해 독샘을 모아야 한다.',next:'s2'}]},
  s3:{text:'마스크를 쓰고 늪가로 나서자 물속에서 무언가 꿈틀거린다. 마스크 없이 나온 사람을 노리던 거머리 떼가 한꺼번에 몰려온다.',battle:'st_leech',next:'s4',winText:'거머리 떼가 물속으로 흩어진다. 마스크 덕에 독안개 속에서도 숨이 차지 않는다.'},
  s4:{text:'치료소로 돌아오자 이브가 마스크 끈을 다시 매 준다. "잘 맞네요. 원래 당신 것이었던 것처럼." 그녀는 잠깐 당신 뒤쪽 하늘을 올려다본다.',choices:[
    {label:'고맙다고 인사한다',result:'"안개가 걷히면 다시 들러 주세요. 그분도… 늘 그렇게 말했거든요."',next:'end',flag:'e8_mask'}]},
  end:{end:true,text:'안개 마스크 완성',reward:{exp:3000,gold:550,items:{potion:2}}}}},
 {id:'E9',cat:'epic',title:'첫 균열',published:true,level:22,prereq:'E8',repeat:null,cond:{},
  desc:'늪 한가운데의 균열을 직접 보러 간다. 균열까지는 배로만 갈 수 있다. [3장 「독안개 아래」]',start:'s1',steps:{
  s1:{text:'장로 하윈이 말한다. "균열은 늪 한가운데 있어요. 걸어서는 못 가요. 뒷골목 끝 나루터의 토르에게 가 보세요." (탐색 › 늪의 땅 › 마을 › 뒷골목)',
    give:{land:'swamp',spot:'alley',item:'q_ferry',n:1,npc:'나룻배 사공 토르',text:'토르가 노를 내려놓지도 않고 나무 표를 내민다. "균열까지? 태워 주지. 표는 미리 써 뒀어. 올 줄 알았거든."'},
    choices:[{label:'나룻배에 오른다',req:{item:'q_ferry'},result:'배가 소리 없이 미끄러진다. 토르는 내내 같은 노래를 흥얼거린다.',next:'s2'},
      {label:'아직 나루터에 가지 못했다',result:'로타스 뒷골목 끝 나루터에서 토르를 찾아야 한다.',next:'s1'}]},
  s2:{text:'안개가 가장 짙은 곳, 물 위에 보랏빛 균열이 떠 있다. 균열은 천천히 열렸다가 닫힌다. 깜빡이는 눈처럼. 열릴 때마다 블라스파미아의 냄새가 난다.',choices:[
    {label:'균열 가장자리를 살핀다',result:'갈대 사이에 가죽 표지의 무언가가 걸려 있다. 손을 뻗는 순간 균열이 활짝 열린다.',next:'s3'},
    {label:'균열이 닫힐 때까지 기다린다',result:'균열은 닫히지 않는다. 당신이 볼 때까지 기다리는 것처럼.',next:'s3'}]},
  s3:{text:'균열 속에서 무언가 기어 나온다. 움직임이 한 박자씩 늦게 따라온다.',battle:'st_rift',next:'s4',winText:'형체가 균열 속으로 끌려 들어간다. 균열이 한 번, 아주 천천히 깜빡인다.'},
  s4:{text:'갈대 사이에서 건진 것은 낡은 탐사 일지다. 대부분의 쪽이 물에 젖어 붙어 있고, 첫 장만 겨우 읽힌다. 날짜는 2052년. 맨 아래 서명은 「아우로라」. 이브가 당신을 부른 그 이름이다.',choices:[
    {label:'일지를 품에 넣는다',result:'돌아오는 배 위에서 토르의 노래가 처음으로 멈춘다. "그 일지, 버리지 마. 주인이 찾으러 올지도 모르니까."',next:'end',flag:'e9_journal'}]},
  end:{end:true,text:'균열에서 2052년 일지 발견',reward:{exp:3600,gold:600,items:{j2052:1}}}}},
 {id:'E10',cat:'epic',title:'가라앉은 등불',published:true,level:24,prereq:'E9',repeat:null,cond:{},
  desc:'일지 첫 장 뒷면에 물에 잠긴 등대 신전이 그려져 있다. 장로 하윈은 그곳의 등불이 안개를 걷어 낸다고 한다. [3장 「독안개 아래」]',start:'s1',steps:{
  s1:{text:'일지 뒷면에 그려진 건물을 보여 주자 장로 하윈이 오래 말이 없다. "물에 잠긴 등대 신전이에요. 등불이 꺼진 뒤로 안개가 짙어졌죠." (탐색 › 늪의 땅 › 마을 › 광장)',
    give:{land:'swamp',spot:'plaza',item:'q_lamp',n:1,npc:'장로 하윈',text:'하윈이 낡은 등불을 건넨다. "정화의 성수를 부으면 다시 켜질 거예요. 성수가 없으면 늪 독샘을 달여서라도 불을 붙여 볼 수 있어요. 냄새는 지독하겠지만."'},
    choices:[{label:'등불을 받는다',req:{item:'q_lamp'},result:'등불은 차갑고, 안쪽에 오래된 그을음이 남아 있다.',next:'s2'},
      {label:'아직 하윈을 만나지 못했다',result:'로타스 광장의 장로 하윈을 찾아야 한다.',next:'s1'}]},
  s2:{text:'등불을 다시 밝혀야 한다. 정화의 성수는 거래소나 연금 공방에서 구할 수 있다.',choices:[
    {label:'정화의 성수를 붓는다',req:{items:{holywater:1}},take:{holywater:1},result:'성수가 닿자 등불 안에서 푸른 불꽃이 피어오른다. 주변 안개가 한 뼘 물러선다.',next:'s3'},
    {label:'늪 독샘 5개를 달여 불을 붙인다',req:{items:{venom:5}},take:{venom:5},result:'지독한 냄새와 함께 초록빛 불꽃이 붙는다. 안개가 마지못해 한 뼘 물러선다.',next:'s3'},
    {label:'아직 준비하지 못했다',result:'정화의 성수 1개, 또는 늪 독샘 5개가 필요하다.',next:'s2'}]},
  s3:{text:'토르의 배로 등대 신전에 닿는다. 물에 잠긴 수문 앞에 이끼 덮인 돌 파수꾼이 서 있다. 눈이 이끼에 덮여 있는데도 정확히 당신 쪽을 본다.',battle:'st_warden',next:'s4',winText:'파수꾼이 무너지며 수문이 열린다. 신전 깊은 곳에서 무언가 거대한 것이 몸을 뒤척인다.'},
  s4:{text:'마을로 돌아와 하윈에게 수문이 열렸다고 전한다. 이야기 끝에 당신이 무심코 말한다. "일을 마치면 돌아가야 해서요."',choices:[
    {label:'하윈의 대답을 기다린다',result:'하윈이 고개를 갸웃한다. "돌아가요? 어디로요?" 정말 모르겠다는 얼굴이다. 잠시 뒤 그는 아무 일 없었다는 듯 다음 이야기를 꺼낸다.',next:'end',flag:'e10_lamp'}]},
  end:{end:true,text:'등대 신전의 수문을 열다',reward:{exp:4200,gold:650,items:{potion:2,holywater:1}}}}},
 {id:'E11',cat:'epic',title:'독안개 아래',published:true,level:27,prereq:'E10',repeat:null,cond:{},
  desc:'등불로 안개를 걷어 내고 등대 신전 깊은 곳의 늪의 주인과 마주한다. 권장 LV28 · 회복약 2개, 정화의 성수 1개 이상 준비. [3장 「독안개 아래」 마지막 이야기]',start:'s1',steps:{
  s1:{text:'등불을 들고 신전 깊은 곳으로 내려간다. 푸른 불빛이 닿는 곳마다 독안개가 갈라진다. 물에 잠긴 회랑 끝, 거대한 비늘이 등불 빛을 받아 번들거린다. (권장 LV28 · 회복약 2개, 정화의 성수 1개 이상)',choices:[
    {label:'준비를 마치고 나아간다',result:'비늘이 움직인다. 회랑 전체가 한 마리의 몸이었다.',next:'s2'},
    {label:'회복약과 성수를 더 챙겨 온다',result:'등불은 꺼지지 않고 기다려 준다.',next:'s1'}]},
  s2:{text:'고대 바다뱀이 똬리를 풀고 머리를 든다. 균열과 같은 보랏빛 눈이 천천히 깜빡인다. 체력이 줄면 독안개를 뿜고(60%), 끝에는 신전 바닥을 무너뜨린다(25%).',battle:'st_serpent',next:'s3',winText:'바다뱀이 물속으로 무너진다. 독안개가 한순간에 걷히고, 신전 천장 틈으로 하늘이 보인다.'},
  s3:{text:'하늘에 균열과 같은 모양의 커다란 눈이 떠 있다. 눈은 한 번 깜빡이고 사라진다. 그리고 시야 한쪽에 시스템 메시지가 떠오른다.\n\n「관람석이 소란스럽습니다.」\n「늪의 독안개가 걷혔습니다.」',choices:[
    {label:'메시지를 다시 확인한다',result:'메시지 창에는 「늪의 독안개가 걷혔습니다.」 한 줄만 남아 있다.',next:'s4'},
    {label:'못 본 척한다',result:'아무도 하늘 이야기를 하지 않는다. 당신도 하지 않기로 한다.',next:'s4'}]},
  s4:{text:'로타스로 돌아오자 마을 사람들이 일제히 박수를 친다. 이브도, 하윈도, 노를 내려놓은 토르도. 강가 마을에서 들었던 것과 똑같은 박자로.',choices:[
    {label:'박수를 받는다',result:'박수가 뚝 멈춘다. 그날 밤 일지를 펼치자 첫 장 맨 아래에 아까는 없던 단어 하나가 번져 있다. 「히페리온」.',next:'end',flag:'ch3_clear'}]},
  end:{end:true,text:'3장 「독안개 아래」 완료',reward:{exp:6000,gold:900,items:{potion:3},gearTier:3}}}},
 {id:'S3a',cat:'sub',title:'이름 없는 말뚝',published:true,level:22,prereq:null,repeat:null,cond:{quests:['E9']},
  desc:'로타스의 말뚝 집마다 문패가 걸려 있다. 몇 개는 비어 있다.',start:'s1',steps:{
  s1:{text:'로타스의 말뚝 집들을 따라 걷는다. 문패마다 이름이 새겨져 있는데, 몇 개는 텅 비어 있다. 에트나 순례자의 길, 이름이 새겨진 바위의 빈자리가 떠오른다.',choices:[
    {label:'빈 문패를 하나씩 살펴본다',result:'맨 끝 집 빈 문패에 손톱으로 긁은 자국이 있다. 「아우…」까지만 남아 있다.',next:'s2'}]},
  s2:{text:'긁힌 자국은 오래되었는데, 나무는 새것이다. 누군가 이름을 새기다 멈춘 것 같다.',choices:[
    {label:'자국을 손으로 문질러 본다',result:'나무 가루가 떨어지고 자국이 조금 더 선명해진다. 「아우…」 다음 글자는 끝내 보이지 않는다.',next:'end',flag:'s3a_post'},
    {label:'그대로 둔다',result:'돌아서는데 등 뒤에서 나무 긁는 소리가 한 번 난다. 돌아보면 아무도 없다.',next:'end',flag:'s3a_post'}]},
  end:{end:true,text:'빈 문패를 확인함',reward:{exp:900,gold:150,items:{}}}}},
 {id:'S3b',cat:'sub',title:'토르의 노래',published:true,level:25,prereq:null,repeat:null,cond:{quests:['E10']},
  desc:'나룻배 사공 토르는 매일 같은 노래를 부른다. 끝까지 들은 사람은 없다고 한다.',start:'s1',steps:{
  s1:{text:'나루터에서 토르가 노래를 흥얼거린다. 오늘은 배에 손님이 없다. "끝까지 들어 볼 테야? 다들 중간에 가 버리던데."',choices:[
    {label:'배에 앉아 끝까지 듣는다',result:'노래는 길고, 가사는 늪 사투리라 잘 들리지 않는다.',next:'s2'},
    {label:'다음에 듣겠다고 한다',result:'"그래. 나는 여기 계속 있으니까."',next:'s1'}]},
  s2:{text:'후렴이 몇 번이고 반복된다. 듣다 보니 가사 한 줄이 이상하게 귀에 박힌다. "컨빨이 노를 젓고, 템빨이 등불 들고…" 어디서 들어 본 이름 같다.',choices:[
    {label:'"그 이름들, 누구예요?"',result:'토르가 노를 멈춘다. "이름? 그냥 노래야. 아주 오래전부터 다들 이렇게 불렀어." 그리고 처음부터 다시 부르기 시작한다.',next:'end',flag:'s3b_song'},
    {label:'조용히 끝까지 듣는다',result:'노래가 끝나자 토르가 박수를 기다리듯 당신을 본다. 당신이 손뼉을 치자, 그는 만족스럽게 처음부터 다시 부른다.',next:'end',flag:'s3b_song'}]},
  end:{end:true,text:'토르의 노래를 끝까지 들음',reward:{exp:1200,gold:200,items:{}}}}}];
/* 메인 스토리 챕터 묶음(퀘스트 목록 접기용) */
const QCHAPTERS=[['ch0','서장 「블레스 링크」',['E0']],['ch1','1장 「사라진 탐사대」',['E1','E2','E3','E4']],['ch2','2장 「시련의 길」',['E5','E6','E7']],['ch3','3장 「독안개 아래」',['E8','E9','E10','E11']]];
/* 옛 영웅 보스: 전투 중 대사 · 처치 후 유언 */
const HERO_LINES={
  st_witch:{say:['(노래가 끊기지 않는다. 숨도 쉬지 않고.)','쉿… 노래가 끝나면 안 돼.','왜 다들 웃고 있는 거지?'],last:'…이제 좀, 조용하네.'},
  d_grass:{say:['(노래가 끊기지 않는다. 숨도 쉬지 않고.)','쉿… 노래가 끝나면 안 돼.','너, 어디서 본 것 같은데.'],last:'…이제 좀, 조용하네.'},
  pb_merchant:{say:['얼마면 돼? 얼마면 나를 여기서…','계약서에 서명했지. 너도 곧 하게 될 거야.','금화는 쌓이는데, 돌아갈 수가 없어.'],last:'…영수증은, 챙겨 둬.'},
  pb_captain:{say:['이 배는 출항하지 않아. 한 번도.','항구 너머 등대가 보이나? 우리 집 쪽이었는데.','선원들은 모두 남겠다고 했지.'],last:'…닻을, 올려.'},
  pb_paladin:{say:['맹세했다. 이곳을 지키겠다고. 누구에게였더라.','얼음 속에 내 이름이 있어. 읽어 줄래?','추운 게 아니야. 아무것도 느껴지지 않는 거지.'],last:'…따뜻하군.'},
  pb_herald:{say:['나팔 소리가 들리나? 우리가 불었어.','신전 문은 안에서만 열려.','너도 소원을 빌겠지. 다들 그랬어.'],last:'…일곱 번째… 나팔…'},
  st_monk:{say:['…아직 수련이 끝나지 않았다.','몇 번째 해가 뜨는지 잊었다.','(무승의 눈이 잠시 당신 뒤의 허공을 본다.)'],last:'…드디어, 쉴 수 있겠군.'},
  d_cave:{say:['…아직 수련이 끝나지 않았다.','몇 번째 해가 뜨는지 잊었다.','(무승의 눈이 잠시 당신 뒤의 허공을 본다.)'],last:'…드디어, 쉴 수 있겠군.'},
  d_lake:{say:['돈이면 다 된다고 했잖아.','갈증이 멈추지 않아. 남은 대가야.','네 지갑도 곧 비게 될 거다.'],last:'돌아가는 쪽을… 골랐어야 했어.'},
  d_siren:{say:['돌아오지 마, 돌아오지 마.','이 노래는 경고야. 아무도 듣질 않지.','바다 밑에 우리 이름이 잠겨 있어.'],last:'노래를… 들어 줘서 고마워.'},
  d_mirror:{say:['거울을 봐. 그게 진짜 너야.','NPC들 얼굴, 자세히 본 적 있어?','나는 가장 오래 남은 사람이야.'],last:'다음은… 너야.'},
  guardian:{say:['신전 문을 열지 마.','우리는 이겼어. 그리고 졌지.','소원은 하나뿐이야. 잘 골라.'],last:'2052… 9월… 14일…'}};
/* 마을 글리치 대사 */
const VIL_GLITCH_SOFT=['어서 오세요, 이방인. 어서 오세요, 이방인. 어서 오','(대답 대신 한참 동안 웃기만 한다.)','오늘도 날씨가 좋네요. 어제도. 내일도.','…방금 저랑 얘기하셨던가요?','(고개를 돌렸다가 다시 보니, 같은 자세로 같은 곳을 보고 있다.)'];
const VIL_GLITCH=['(메뉴를 여는 당신의 손끝을 보다가, 로그아웃 버튼 쪽을 힐끗 본다.)','여기 계속 계셔도 돼요.','돌아갈 데가 있긴 하세요?','{N}님, 오늘도 오셨네요. …아, 아니, 이름을 잘못 불렀네요.','여기 계속 계셔도 돼요. 여기 계속 계셔도 돼요.','어서 오세요, 이방인. 어서 오세요, 이방인. 어서 오','당신도 곧 익숙해질 거예요. 다들 그랬거든요.','…로그아웃? 그게 뭐죠?'];
const GLITCH_NAMES=['진','하루','템빨대장','컨트롤장인','유니','크로노'];

/* ───────── 전직 퀘스트 (LV20 · 각 클래스의 시작의 마을) ───────── */
const ADV_ORIGIN={
  defender:{land:'meadow',god:'아움타주',godDesc:'장악의 신',place:'황혼녘 강가의 아움타주 신전',npc:'신전 기사 단장 오렌',mon:['st_tr_def','아움타주의 그림자 기사','golem']},
  infighter:{land:'rock',god:'발레티',godDesc:'무술의 신',place:'바위 산맥의 발레티 신전',npc:'수련장 사범 카이',mon:['st_tr_inf','발레티의 석상 무인','golem']},
  shooter:{land:'ember',god:'셀로나',godDesc:'문명의 신',place:'오아시스 마을의 셀로나 신전',npc:'신전 기술사 미라',mon:['st_tr_sho','셀로나의 태엽 사수','golem']},
  mage:{land:'ember',god:'아발라가',godDesc:'불의 신',place:'붉은 모래사막의 아발라가 신전',npc:'불의 무녀 세라',mon:['st_tr_mag','아발라가의 불꽃 환영','spirit']},
  priest:{land:'frost',god:'고대 신들',godDesc:'적막의 숲 제단',place:'적막의 숲, 신들의 제단',npc:'제단지기 노파 오웬',mon:['st_tr_pri','침묵하는 제단의 수호령','spirit']}};
Object.assign(ITEMS,{q_trial:{name:'시련의 증표',type:'mat',tag:'퀘스트 아이템',desc:'신전에서 받은 은빛 증표. 쥐고 있으면 손바닥이 따뜻해진다.'}});
const ADV_MONS=Object.entries(ADV_ORIGIN).map(([job,o])=>soloMon({id:o.mon[0],name:o.mon[1],art:o.mon[2],kind:'story',region:o.place,level:20,statLevel:20,tier:'story',desc:`${o.god}이(가) 블레서를 시험하기 위해 내려보낸 환영.`,singleName:'시련의 일격',aoeName:'신의 압박',dotName:'시련의 낙인',dotChance:0.25}));
function advQuest(job){const o=ADV_ORIGIN[job];const advs=CLASSES[job].adv;
  return {id:'J_'+job,cat:'sub',title:`[전직] ${o.god}의 시련`,published:true,level:20,prereq:null,repeat:null,job,cond:{},
    desc:`${o.godDesc} ${o.god}이(가) 당신을 부른다. ${villageName(o.land)}로 가서 상위 클래스로 나아갈 시련을 받자.`,start:'s1',steps:{
    s1:{text:`꿈에서 낯선 목소리를 들었다. "${CLASSES[job].name}의 아이야, 이제 때가 되었다." ${o.place}으로 가서 시련의 증표를 받아야 한다. (탐색 › ${LANDS[o.land]} › 마을 › 광장)`,
      give:{land:o.land,spot:'plaza',item:'q_trial',n:1,npc:o.npc,text:`기다리고 있었습니다. ${o.god}께서 당신을 지켜보고 계셨어요. 이 증표를 쥐고 신전 깊은 곳으로 들어가세요.`},
      choices:[{label:'증표를 쥐고 신전 깊은 곳으로 들어간다',req:{item:'q_trial'},result:'증표가 빛나며 신전 바닥의 문양이 열린다.',next:'s2'},{label:'아직 신전에 가지 못했다',result:`${villageName(o.land)}의 광장에서 ${o.npc}을(를) 찾아야 한다.`,next:'s1'}]},
    s2:{text:`문양 너머, ${o.mon[1]}이(가) 무기를 든다. "증명하라. 네가 나아갈 자격이 있는지."`,battle:o.mon[0],next:'s3',winText:'환영이 무릎을 꿇고 빛으로 흩어진다.'},
    s3:{text:`빛 속에서 ${o.god}의 목소리가 들린다. "…마음에 드는구나. 아주, 마음에 들어." 웃음소리가 조금 길다. 두 갈래의 길이 눈앞에 펼쳐진다.`,
      choices:advs.map(a=>({label:`★ ${CLASSES[a].name}의 길을 택한다`,result:`${CLASSES[a].name}(으)로서의 힘이 몸에 스며든다. 신전을 나서며 무심코 메뉴를 열자, ${o.npc}의 시선이 로그아웃 버튼 쪽을 힐끗 스친다.`,next:'end',advTo:a}))},
    end:{end:true,text:'전직 완료',reward:{exp:500,gold:300,items:{}}}}};}
const ADV_QUESTS=Object.keys(ADV_ORIGIN).map(advQuest);
function advNoticeHTML(){const me=S.me,c=CLASSES[me.job],o=ADV_ORIGIN[me.job];
  return `<div class="adv-note"><div class="md-lbl"><i class="lbl-d" aria-hidden="true">◆</i>시스템</div><h3 class="sh-ttl">전직할 수 있습니다</h3>
    <p class="faint" style="font-size:13px;margin:0 0 12px">LV${cfg().jobAdvanceLevel}에 도달했습니다. ${esc(c.name)}의 시작의 마을에서 신의 시련을 통과하면 상위 클래스로 전직할 수 있습니다.</p>
    <div class="adv-cls">${c.adv.map(a=>{const A=CLASSES[a];return `<div class="adv-c">${sigil(a,'sm')}<div><b>★ ${esc(A.name)}</b> <small class="faint">${esc(A.en)}</small><div class="row" style="gap:4px;margin:3px 0"><span class="chip cls ${A.role}">${ROLE[A.role]}</span><span class="chip dim">무기 · ${(CLASS_WEAPON[a]||[]).map(w=>WTYPE[w]).join('/')}</span></div><p>${esc(A.desc||'')}</p></div></div>`;}).join('')}</div>
    ${o?`<div class="adv-loc"><span class="faint">퀘스트 위치</span><b>${esc(LANDS[o.land])} · ${esc(villageName(o.land))} › 광장</b><small>${esc(o.place)} · ${esc(o.npc)}</small></div>`:''}
    <div class="row" style="justify-content:flex-end;gap:8px;margin-top:14px"><button class="btn btn-sm btn-ghost" data-act="closemodal">나중에</button><button class="btn btn-sm btn-primary" data-act="adv-go">전직 퀘스트 받기</button></div></div>`;}
function advNoticeCheck(){const me=S&&S.me;if(!me||me.loggedOut||me.advNotice||S.route==='battle')return;const c=CLASSES[me.job];if(c.tier!==1||me.level<cfg().jobAdvanceLevel)return;
  const md=$('#modal');if(md&&md.innerHTML.trim())return;me.advNotice=true;save();modal(advNoticeHTML());}
function ensureVilQuest(){if(!S.data||!S.data.quests)return;let ch=false;
  if(S.feed&&!S.feedNoImg){S.feed.forEach(p=>{delete p.img;});if(S.sel)delete S.sel.fdImg;S.feedNoImg=1;ch=true;}
  if(S.data&&S.data.monsters&&!S.data.orb2){S.data.monsters.forEach(m=>{if((m.loot||[]).includes('g2_staff')&&!m.loot.includes('g2_orb'))m.loot.push('g2_orb');if((m.drops||[]).some(d=>d[0]==='g2_staff')&&!m.drops.some(d=>d[0]==='g2_orb')){const r=m.drops.find(d=>d[0]==='g2_staff')[1];m.drops.push(['g2_orb',r]);}});S.data.orb2=1;ch=true;}
  if(S.me&&S.me.status==='offline'){S.me.status='meal';ch=true;}
  if(S.me&&S.me.cjobs&&S.me.cjobs.repair&&S.me.cjobs.repair.end>now())S.me.cjobs.repair.end=now();
  if(S.me&&!S.me.jtGift){S.me.inv.jobticket=(S.me.inv.jobticket||0)+JOBTICKET_GIFT;S.me.jtGift=1;ch=true;}
  if(S.me&&!S.me.duraV35){const D=S.me.dura||{};for(const k in D)D[k]=Math.min(DURA_MAX,Math.round(D[k]*3.5));S.me.duraV35=1;ch=true;}
  if(!S.spellFix1){const fixed=JSON.parse(JSON.stringify(S).split('블라스'+'페미아').join('블라스파미아'));Object.keys(S).forEach(k=>{if(k!=='sel')S[k]=fixed[k];});S.spellFix1=1;ch=true;}for(const Q of [VIL_QUEST,THEFT_QUEST,...ADV_QUESTS,...STORY_QUESTS])if(!S.data.quests.some(q=>q.id===Q.id)){const QS=S.data.quests;const prev={E4:'E3',E5:'E4',E6:'E5',E7:'E6',E8:'E7',E9:'E8',E10:'E9',E11:'E10'}[Q.id];const at=Q.id==='E0'?QS.findIndex(q=>q.id==='E1'):prev?QS.findIndex(q=>q.id===prev)+1:-1;if(at>=0)QS.splice(at,0,clone(Q));else QS.push(clone(Q));ch=true;}
  for(const M of [...STORY_MONS,...ADV_MONS,...PARTY_BOSSES])if(!S.data.monsters.some(m=>m.id===M.id)){S.data.monsters.push(clone(M));ch=true;}
  for(const Q of [...ADV_QUESTS,...STORY_QUESTS]){const i=S.data.quests.findIndex(q=>q.id===Q.id);if(i>=0&&JSON.stringify(S.data.quests[i].steps)!==JSON.stringify(Q.steps)){S.data.quests[i]=clone(Q);ch=true;}}
  const e1=quest('E1');if(e1&&!e1.prereq&&!S.qp.E1){e1.prereq='E0';ch=true;}
  if(ch)save();}
function theftActive(){return !!(S.theft&&S.theft.cycle===kstCycle());}
function vilGive(land,spot){/* 퀘스트 단계의 give:{land,spot,item,n,text} 훅 */
  for(const q of (S.data.quests||[])){const qp=S.qp&&S.qp[q.id];if(!qp||questStatus(q)!=='active')continue;const st=q.steps&&q.steps[qp.step];const g=st&&st.give;
    if(g&&(!g.land||(g.land==='@theft'?(S.theft&&S.theft.land):g.land)===land)&&g.spot===spot){qp.given=qp.given||{};const key=qp.step+':'+g.item;if(qp.given[key])continue;qp.given[key]=1;const n=g.n||1;addItem(g.item,n);return {item:g.item,n,text:g.text,npc:g.npc};}}
  return null;
}
function vilVisit(land,spot){
  const d=daily();d.vil=d.vil||0;const L=LANDS[land]||'이 땅';const pool=(VIL_LINES[land]&&VIL_LINES[land][spot])||VIL_NPC[spot];let [npc,lines]=pick(pool);let text=pick(lines).replace(/\{L\}/g,L);
  let got='',lost=0;const qg=vilGive(land,spot);
  d.vilTalk=d.vilTalk||{};const n=d.vilTalk[land]=(d.vilTalk[land]||0)+1;bump('vilTalk');const T=S.me.vilTotal=S.me.vilTotal||{};T[land]=(T[land]||0)+1;if(T[land]>=300)setTimeout(checkTitles,0);
  if(qg){if(qg.npc)npc=qg.npc;text=qg.text||`${npc.split(' ').pop()}이(가) 무언가를 건넨다. "이걸 찾고 있었죠?"`;got=`퀘스트 아이템 · ${ITEMS[qg.item]?ITEMS[qg.item].name:qg.item} ×${qg.n}`;}
  else if(spot==='alley'&&S.me.gold>=THEFT_GOLD&&Math.random()<THEFT_RATE){
    S.me.gold-=THEFT_GOLD;npc='';text='눈 깜짝할 사이에 지갑을 털렸다!';lost=THEFT_GOLD;
    const done=(S.me.justice>0)||S.claimedQ[`D_THEFT:${kstCycle()}`]||(S.qp.D_THEFT&&S.qp.D_THEFT.status==='active');
    if(!done){S.theft={cycle:kstCycle(),land};if(S.qp.D_THEFT)delete S.qp.D_THEFT;setTimeout(()=>notify('데일리 퀘스트 「잃어버린 골드를 찾아서」가 생겼습니다.'),600);}}
  else if(n>10){npc='';text=pick(VIL_AVOID[spot]);}
  else {const r=Math.random();const ex=EXPLORE.find(x=>x.id===land);
    if(Math.random()<(CLASSES[S.me.job].tier===2?0.02:0.015)){text=pick(CLASSES[S.me.job].tier===2?VIL_GLITCH:VIL_GLITCH_SOFT).replace('{N}',pick(GLITCH_NAMES));}
    else if(r<0.015){const g=3+Math.floor(Math.random()*10);S.me.gold+=g;got=`${g}골드`;d.vil++;}
    else if(r<0.028&&ex){const k=(FOOD_BY_LAND[land]&&Math.random()<0.5)?FOOD_BY_LAND[land]:ex.mat;addItem(k,1);got=`${ITEMS[k].name} ×1`;d.vil++;}}
  S.sel.vil={land,spot,npc,text,got,lost,ts:now()};save();
}
function villageHTML(land){
  const v=S.sel.vil&&S.sel.vil.land===land?S.sel.vil:null;
  return `<section class="md-sec panel vil" id="md-village"><div class="md-lbl"><i class="lbl-d" aria-hidden="true">◆</i>마을 · <b class="vil-town">${esc(villageFull(land))}</b></div>
    <div class="vil-btns">${VIL_SPOTS.map(([k,l])=>`<button class="vil-b ${v&&v.spot===k?'on':''}" data-act="vil-go" data-land="${land}" data-spot="${k}">${VIL_IC[k]}<span>${l}</span></button>`).join('')}</div>
    ${v?`<div class="vil-say ${v.got?'got':''} ${v.npc?'':'avoid'} ${v.lost?'theft':''}">${v.npc?`<b>${esc(v.npc)}</b><p>“${esc(v.text)}”</p>`:`<p class="${v.lost?'':'faint'}">${esc(v.text)}</p>`}${v.got?`<span class="vil-got">+ ${esc(v.got)}</span>`:''}${v.lost?`<span class="vil-lost">− ${v.lost}골드</span>`:''}</div>`:'<p class="faint vil-hint">장소를 고르면 마을 사람들과 이야기할 수 있습니다. 가끔 작은 선물을 받기도 합니다. 다만 하루에 너무 자주 말을 걸면 주민들이 슬슬 자리를 피할지도 모릅니다.</p>'}</section>`;
}
const VIL_IC={plaza:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 14h12M3.5 14V8M12.5 14V8M8 14V9M2.5 8h11L8 3z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>',
  grocer:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 5h11l-1 8.5h-9z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M5.5 5a2.5 2.5 0 0 1 5 0" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>',
  clinic:'<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="2" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M8 5v6M5 8h6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  alley:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 14V3h4v11M9 14V6h4v8" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M5 6h0M11 9h0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M1.5 14h13" stroke="currentColor" stroke-width="1.3"/></svg>'};

/* ───────── 던전 (레이드 › 던전 탭) ───────── */
function landOfSpot(id){const s=MAP_SPOTS.find(x=>x[0]===id);return s&&s[3];}
function landOrder(){const lv=k=>{const r=EXPLORE.find(x=>x.id===k);return r?r.lv:999;};return Object.keys(LANDS).sort((a,b)=>lv(a)-lv(b));}
function dungeonsHTML(land){
  const lvOf=id=>{const I=MAP_INFO[id]||{};const m=monster(id);return I.lv||(m?m.level:999);};
  const ds=MAP_SPOTS.filter(x=>x[3]===land&&x[1]==='dungeon').sort((a,b)=>lvOf(a[0])-lvOf(b[0]));if(!ds.length)return '';
  return `<div class="exr-gates exr-duns">${ds.map(([id,,n])=>{const I=MAP_INFO[id]||{};const m=monster(id);const wk=id==='temple';
    return `<div class="exr-gate exr-dun ${S.sel.exFocus===id?'focus':''}" id="md-${id}"><div class="exr-gh"><span class="exr-gico" aria-hidden="true">${SPOT_ICON.dungeon}</span><span class="md-lbl">${esc(I.label||'인스턴스 던전')}</span><b>${esc(n)}</b><span class="faint num" style="font-size:11.5px">LV${I.lv||(m?m.level:'-')}+ · ${esc(I.ppl||'1–4인')}</span><button class="dun-go" data-act="dun-go" data-id="${id}">[바로가기]</button></div>${I.text?`<p>${esc(I.text)}</p>`:''}</div>`;}).join('')}</div>`;
}
function ensureDunParty(){(S.data.monsters||[]).forEach(m=>{if(mkind(m)==='dungeon'&&m.max!==4){m.min=1;m.max=4;m.target=2;m.roles={tank:0,dps:0,heal:0};m.hpScale=0.45;}});}
function dungeonTab(){
  const d=daily();const busy=busyReason();const lvOf=id=>{const I=MAP_INFO[id]||{};const m=monster(id);return I.lv||(m?m.level:999);};
  const focusLand=S.sel.dfocus&&landOfSpot(S.sel.dfocus);
  const secs=landOrder().map(land=>{const ds=MAP_SPOTS.filter(x=>x[3]===land&&x[1]==='dungeon').sort((a,b)=>lvOf(a[0])-lvOf(b[0]));if(!ds.length)return '';
    return `<details class="dun-dd panel" ${focusLand===land?'open':''}><summary><b>${esc(LANDS[land])}</b><span class="faint">${ds.length}곳 · LV${ds.map(x=>lvOf(x[0])).join(' / ')}</span></summary><div class="dun-list">${ds.map(([id,,n])=>{
      const I=MAP_INFO[id]||{};const m=monster(id);
      let act='';
      if(id==='temple'){act=`<div class="row cj-act"><button class="btn btn-sm btn-primary" data-act="rtab" data-tab="weekly">토벌전으로</button></div>`;}
      else if(m){const done=d.dungeon[m.id];const lr=levelReason(m,S.me.level);const R=dungeonReward(m,dtg(m.id));
        act=`<div class="dun-rw">보상 · <b>EXP ${R.exp}</b> · <b>${R.gold}골드</b>${(m.loot||[]).length?` · 보물상자에서 ${lootText(m)}`:''}</div><div class="row cj-act">${done?'<span class="chip dim">오늘 클리어 완료 · 05:00 초기화</span>':lr?`<button class="btn btn-sm" disabled>${esc(`LV${m.level} 이상 필요`)}</button>`:`<button class="btn btn-sm btn-primary" data-act="dfight" data-id="${m.id}" ${busy?'disabled':''}>개인 입장</button><button class="btn btn-sm" data-act="dparty" data-id="${m.id}" ${busy?'disabled':''}>파티 입장 (최대 4인)</button>${busy?`<span class="faint" style="font-size:12px;align-self:center">${esc(busy)}</span>`:''}`}</div>`;}
      return `<article class="dun-card ${S.sel.dfocus===id?'focus':''}" id="dun-${id}"><div class="dun-t"><div class="md-lbl"><i class="lbl-d" aria-hidden="true">◆</i>${esc(I.label||'인스턴스 던전')}</div><h3>${esc(n)}</h3>
        ${I.quote?`<p class="dun-q">“${esc(I.quote)}”</p>`:''}<div class="dun-meta">최소 레벨 <b>${I.lv||(m?m.level:'-')}</b> · 인원 <b>${esc(I.ppl||'1–4인')}</b></div><p class="dun-x">${esc(I.text||'')}</p>${act}</div></article>`;}).join('')}</div></details>`;}).join('');
  return `${cntRow([['던전 클리어',`${Object.keys(d.dungeon).length}`,'던전별 하루 1회 보상'],['초기화','05:00','매일']])}<div class="dun-wrap">${secs}</div>`;
}
/* ── 던전 탐사(5페이즈) ── */
const DRUN_KIND={monster:['몬스터','⚔'],chest:['보물상자','◈'],trap:['함정','⚠'],empty:['빈 방','·'],boss:['보스','♛']};
const DRUN_MOBS=['던전 파수병','그림자 박쥐 떼','저주받은 해골병','부패한 골렘','광기의 신도','동굴 거미 여왕의 새끼','떠도는 원혼'];
function drunPhases(){const o=['monster','monster',pick(['chest','trap','empty']),pick(['chest','trap','empty'])];for(let i=o.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[o[i],o[j]]=[o[j],o[i]];}return [...o,'boss'];}
function drunMob(boss,i){const L=boss.level;const name=pick(DRUN_MOBS);
  return soloMon({hpScale:0.5,id:'drun_'+boss.id+'_'+i,name,art:pick(['beast','spirit','golem']),kind:'field',region:boss.region,level:L,statLevel:Math.max(1,L-2),tier:'field',desc:`${boss.region}에 도사린 몬스터.`,exp:Math.round(10+L*3),gold:Math.round(5+L),drops:[]});}
function drunStartBattle(){
  const R=S.drun;const boss=monster(R.mid);const k=R.phases[R.idx];
  const m=k==='boss'?boss:(R.mobs[R.idx]=R.mobs[R.idx]||drunMob(boss,R.idx));
  const ctx=k==='boss'?{type:'dungeon',target:dtg(boss.id),drun:true,hpPct:R.hp}:{type:'drun',drun:true,hpPct:R.hp};
  if(!R.party||R.party.length<2){startSolo(m,ctx);return;}
  const members=R.party.map(x=>x.isMe?{id:'me',name:S.me.name,job:S.me.job,level:S.me.level,equip:effEquip(),isMe:true,enh:S.me.enh}:{id:x.name,name:x.name,job:x.job,level:x.level,equip:{}});
  const b=createBattle(m,members,Math.random,cfg());
  {const mf=b.players.find(x=>x.isMe);if(mf){['maxHp','atk','def','luk'].forEach(q=>{const v=itemBonus(q);if(v){mf[q]+=v;if(q==='maxHp')mf.hp+=v;}});mf.hp=Math.max(1,Math.round(mf.maxHp*R.hp));}}
  b.ctx=ctx;if(k==='boss'){const RW=dungeonReward(boss,ctx.target);b.rules.exp=RW.exp;b.rules.gold=RW.gold;b.rules.drops=RW.drops;}else{b.rules.exp=m.exp;b.rules.gold=m.gold;b.rules.drops=[];}
  b.log.push({t:'sys',text:`던전 ${R.idx+1}페이즈 · 파티 ${members.length}인 전투`});
  b.deadline=now()+b.rules.turnSeconds*1000;planBots(b);S.battle=b;resetAct();S.route='battle';save();render();toast(`${m.name} · 파티 전투 시작`,'good');
}
function drunAfter(b,me){const R=S.drun;if(!R)return;
  if(b.over==='win'){R.hp=Math.max(0.05,me.hp/me.maxHp);hpSet(R.hp);R.log.push(`${R.idx+1}페이즈 · ${b.mon.name} 처치`);R.idx++;if(R.idx>=R.phases.length){R.done='win';}}
  else{R.done='lose';R.hp=0;R.log.push(`${R.idx+1}페이즈 · ${b.mon.name}에게 패배`);}
  save();
}
function drunEvent(){
  const R=S.drun;const boss=monster(R.mid);const L=boss.level;const k=R.phases[R.idx];let text='';
  if(k==='chest'){const g=Math.round(20+L*3+Math.random()*L*2);const it={};let line=`${g}골드`;
    if(Math.random()<0.4&&(boss.loot||[]).length){const x=pickLoot(boss);it[x]=1;line+=` · ${ITEMS[x]?ITEMS[x].name:x}`;}else if(Math.random()<0.5){it.potion=1;line+=' · 회복약';}
    grant({exp:0,gold:g,items:it},'dungeon',{label:boss.region+' 보물상자',region:boss.region});text=`낡은 보물상자를 열었다 · ${line}`;}
  else if(k==='trap'){const dmg=0.15+Math.random()*0.15;const before=R.hp;R.hp=Math.max(0.1,R.hp-dmg);hpSet(R.hp);text=`함정이 발동했다! HP ${Math.round((before-R.hp)*100)}% 감소`;}
  else {const heal=Math.random()<0.5;if(heal){R.hp=Math.min(1,R.hp+0.1);text='고요한 방이다. 잠시 숨을 고르며 HP 10%를 회복했다.';}else text='아무 일도 일어나지 않았다.';}
  R.log.push(`${R.idx+1}페이즈 · ${DRUN_KIND[k][0]} · ${text}`);R.last=text;R.idx++;save();render();
}
function vDrun(){
  const R=S.drun;const boss=monster(R.mid);const k=R.phases[R.idx];const I=MAP_INFO[R.mid]||{};
  const track=R.phases.map((p,i)=>{const st=i<R.idx?'done':i===R.idx&&!R.done?'cur':'';const show=i<=R.idx||p==='boss';
    return `<div class="dr-ph ${st} k-${show?p:'unk'}"><span class="dr-ic">${show?DRUN_KIND[p][1]:'?'}</span><small>${i+1}페이즈</small><b>${show?DRUN_KIND[p][0]:'???'}</b></div>`;}).join('<i class="dr-ln"></i>');
  let body='';
  if(R.done==='win')body=`<div class="dr-card win"><h3>던전 공략 완료!</h3><p>${esc(boss.name)}을(를) 쓰러뜨리고 ${esc(boss.region)}을(를) 공략했습니다. 보스 보상은 이미 지급되었습니다.</p><div class="row cj-act"><button class="btn btn-sm btn-primary" data-act="drun-exit">던전 나가기</button></div></div>`;
  else if(R.done==='lose')body=`<div class="dr-card lose"><h3>탐사 실패</h3><p>${R.idx+1}페이즈에서 쓰러졌습니다. 오늘 클리어 기록은 남지 않았으니 다시 도전할 수 있습니다.</p><div class="row cj-act"><button class="btn btn-sm btn-primary" data-act="drun-exit">던전 나가기</button></div></div>`;
  else{const desc={monster:'어둠 속에서 무언가가 다가온다. 몬스터와 싸워야 앞으로 나아갈 수 있다.',chest:'방 한가운데 먼지 쌓인 보물상자가 놓여 있다.',trap:'바닥의 돌판 하나가 미세하게 꺼져 있다. 피할 수 없을 것 같다.',empty:'텅 빈 방이다. 바람 소리만 들린다.',boss:`가장 깊은 곳, ${boss.name}이(가) 기다리고 있다.`}[k];
    const btn={monster:'전투 시작',chest:'상자 열기',trap:'함정을 지나간다',empty:'계속 나아간다',boss:'보스 전투 시작'}[k];
    body=`${R.last?`<p class="dr-last">${esc(R.last)}</p>`:''}<div class="dr-card k-${k}"><div class="md-lbl"><i class="lbl-d" aria-hidden="true">◆</i>${R.idx+1}페이즈 · ${DRUN_KIND[k][0]}</div><p>${esc(desc)}</p><div class="row cj-act"><button class="btn btn-sm btn-primary" data-act="drun-next">${btn}</button><button class="btn btn-sm btn-ghost" data-act="drun-quit">포기하고 나가기</button></div></div>`;}
  return `<div class="wrap page"><div class="page-head"><div><h2>레이드<small class="en">Raid</small></h2></div></div>
    <div class="panel dr"><div class="dr-head"><div><div class="md-lbl"><i class="lbl-d" aria-hidden="true">◆</i>${esc(I.label||'인스턴스 던전')}</div><h3>${esc(boss.region)}</h3></div>${R.party&&R.party.length>1?`<div class="dr-party">${R.party.map(x=>`<span class="chip">${esc(x.name)}${x.isMe?' (나)':''}</span>`).join('')}</div>`:''}<div class="dr-hp"><span class="faint">HP</span><div class="bar"><i style="width:${Math.round(R.hp*100)}%"></i></div><span class="num">${Math.round(R.hp*100)}%</span></div></div>
      <div class="dr-track">${track}</div>${body}
      ${R.log.length?`<details class="dr-log"><summary>탐사 기록 ${R.log.length}</summary>${R.log.map(x=>`<p>${esc(x)}</p>`).join('')}</details>`:''}</div></div>`;
}

/* ───────── 낚시 · 어망 · 수족관 ───────── */
const FISH_IMG='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAC4jAAAuIwF4pT92AAAEKUlEQVRYhe2VX0hbVxzHP0mVxKjVaE1VVDSGRMJ6+yBbhwNnN9xDBYvDUjpwD5tse/DBPsjcXraHPQSEPrmHscoGg6JMzDpocZSNEdhlbgjd3QgassRF0aiL/5Z/osvdw/XeJJpoRh/b30vIOb9zPt/f93fOufAsnsXTHrpCkrpbG2SAR3+unJmv5haary9kwy5dmC5dOGvzHCF3tzbI1ypXGe0o4u7N82q+nDl/fNGpCrtbG+T+qpj2f3xJ5vfNnRNrVLDgbMLWaMK/HAegunafcqGc9z6Oc61yFYDb86ksbl4B3a0N8mhHkQKe1+Pf3NLmbDVVOdd81JOgXCjHarcT8Pmw2u289sZjDQ7wcKc+qzU5Bajw8XmlQzfqY1ysK1HgRxXaGk1YWqJsBMvwL8dZX0vw9WqpJmRk5hwAox1FSN4QAJ5EM0PtKVzioSYip4BLNZUywAeXDSfAaqyvJQC4WFeiza2vJfgiWKyBOzpTAIgePePzeobaU0jeUJYLRTm9zIDbGk389EtEE2FpiQJgfPs7+MNFaFLKgqfBKRZ9B0TCBiRvCLc3hdsL3a0Np7egz2mVh9pTWpUvvVCdAf1WgzZdt5KUJAA2gmUMTu1pcOOVDpJzIqJHaeGrXy3ldTunAyr4lZEXtbHQpIRlopeNYBmWlihJSWIjWEbTdSuDrscn4Iu+A8CQz2Atjr8D8o36GLfuXFUgc6I2obpgaYliFAQNHrofAMiCA0TCCry6dp8+p7UwAX1OK7fuXCU0mbaW50ZJzokYBUEbS0qS5kLmwVRDqV6BO+zFdJYs0ee05nzETrTgh7GftdPb9Mk9khO9AITuB/Av63GJewDcvXke/3KcmYdLhPWVLPpKcJCuXoWfFScE2BpNQFSxc6IX0aPHv7AL/MP0Viljr//LA/cmg1Ng31lBsJrxLMlEwgYWSUMd9mKMgsBv0/MAuL2BnAKyWuD2BpQeH/VyI1h2BE/HA/cmAOG9KILVjK2tgqFmHS7xkEjYgOjRU127j1EQSEoSkbABk74irwOnfowy+6tWf8FczgVzueJWW0XWL6T7npQk7SzMxsxQ6DXcCJZhOeqlWr2trQLEQ+KLcS7Vgclh4m/3JsOzMNSsQwpsM/ZWHQ67HijWHiAw4F/Yxe3dzlvkcQG64W+S8r3b6QFbWwUu8ZAuXRiTo4bLAy+TnBNxvF9Pj++AkZlzhPUywo9J7eqp99+/sMu7v27nrT7fhPzXh04sLVFEjx5bo4nBqT36q2K8+Y5ifeZ9B+XaDXyZYKg5e7uz4KdNyonPm5R3AOUsuMRD+qtiXOkyKic848VTKx+e3aEztcOnkTP3LyhBBvh+oBlbo4nZR2tMb5Vi31kBoN5cRE9fjQbPsLsg8P9JPPGCffa8OevkF9LrJxFQkKgn2OtZPOXxH7Y+6HiF6a2+AAAAAElFTkSuQmCC';
const FISH_LANDS={meadow:'민물 낚시',sea:'바다 낚시',frost:'얼음 낚시'};
/* [id, 이름, 최소cm, 최대cm, 출현 가중치, 필요한 낚싯대 등급] */
const FISH={
  meadow:[['f_pira','피라미',5,12,40,1],['f_crucian','붕어',10,30,30,1],['f_shrimp','민물새우',3,8,30,1],['f_crawfish','가재',8,15,20,1],['f_catfish','메기',30,90,10,2],['f_mandarin','쏘가리',25,60,8,2],['f_goldcarp','황금 잉어',40,100,2,3],['f_sturgeon','강의 주인 철갑상어',100,250,0.5,4]],
  sea:[['f_jack','전갱이',15,35,40,1],['f_mackerel','고등어',25,45,30,1],['f_crab','꽃게',10,25,25,1],['f_octopus','문어',30,90,12,2],['f_seabream','참돔',30,80,10,2],['f_marlin','청새치',150,300,3,3],['f_turtle','바다거북',60,120,2,3],['f_levi','새끼 리바이어던',200,500,0.4,4]],
  frost:[['f_smelt','빙어',5,15,45,1],['f_capelin','열빙어',10,20,30,1],['f_char','북극곤들매기',30,70,15,2],['f_kingcrab','대게',15,30,15,2],['f_icetrout','얼음 송어',40,90,8,2],['f_silvercod','은빛 대구',50,120,5,3],['f_jelly','서리 해파리',20,60,3,3],['f_icelord','얼음 군주 넙치',100,200,0.5,4]]
};
const FISH_BY_ID={};for(const l in FISH)FISH[l].forEach(f=>{FISH_BY_ID[f[0]]={id:f[0],name:f[1],min:f[2],max:f[3],w:f[4],tier:f[5],land:l};ITEMS['fl_'+f[0]]={name:'손질한 '+f[1],type:'mat',tag:'요리 재료',desc:`손질을 마친 ${f[1]}. 생선이 들어가는 요리에 쓸 수 있다.`,price:6+f[5]*6};});
Object.assign(ITEMS,{
  rod1:{name:'낡은 대나무 낚싯대',type:'mat',tag:'낚싯대',rod:1,desc:'가볍지만 큰 물고기는 버티지 못한다 · 낚싯대 1등급 · 내구도 10',price:50},
  rod2:{name:'참나무 낚싯대',type:'mat',tag:'낚싯대',rod:2,desc:'단단한 참나무로 깎은 낚싯대 · 낚싯대 2등급 · 내구도 30 (장인 제작 +5)',price:220},
  rod3:{name:'은빛 릴 낚싯대',type:'mat',tag:'낚싯대',rod:3,desc:'은실을 감은 릴이 달린 낚싯대 · 낚싯대 3등급 · 내구도 50 (장인 제작 +5)',price:650},
  rod4:{name:'심연의 낚싯대',type:'mat',tag:'낚싯대',rod:4,desc:'혼돈의 파편을 박아 넣은 전설의 낚싯대 · 낚싯대 4등급 · 내구도 100 (장인 제작 +5) · 제작 전용'}
});
ITEMS.fish&&(ITEMS.fish.name='손질한 생선',ITEMS.fish.desc='손질을 마친 생선살. 생선이 들어가는 요리에 쓸 수 있다.');
RECIPES.craft.push(['c_rod2','rod2',1,{ore:2,herb:2},5,10],['c_rod3','rod3',1,{ore:3,pearl:2},3,60],['c_rod4','rod4',1,{chaos:1,frost:2,pearl:3},1,360]);
const NET_MAX=10,AF_DUR=[30,60,240,360],CAST_MIN=5,AQUA_MAX=20,FISH_MAX=10;
const ROD_IDS=['rod1','rod2','rod3','rod4'],ROD_D={rod1:10,rod2:30,rod3:50,rod4:100},ROD_CRAFT_BONUS=5;
function rods(){const me=S.me;me.rods=me.rods||[];for(const k of ROD_IDS){const have=me.inv[k]||0;let L=me.rods.filter(r=>r.item===k);
  while(L.length<have){const r={uid:uid('rod'),item:k,dura:ROD_D[k],max:ROD_D[k],crafted:false};me.rods.push(r);L.push(r);}
  if(L.length>have){L.sort((a,b)=>a.dura-b.dura);const drop=L.slice(0,L.length-have);me.rods=me.rods.filter(r=>!drop.includes(r));}}
  return me.rods.slice().sort((a,b)=>ITEMS[b.item].rod-ITEMS[a.item].rod||b.dura-a.dura);}
function selRod(){const R=rods();return R.find(r=>r.uid===S.me.rodSel)||R[0]||null;}
function rodTier(){const r=selRod();return r?ITEMS[r.item].rod:0;}
function rodName(){const r=selRod();return r?ITEMS[r.item].name:'';}
function rodLabel(r){return `${ITEMS[r.item].name} · ${ITEMS[r.item].rod}등급 · 내구도 ${r.dura}/${r.max}${r.crafted?' · ★장인 제작':''}`;}
function useRod(r,n){r.dura-=n;if(r.dura<=0){S.me.rods=S.me.rods.filter(x=>x!==r);S.me.inv[r.item]=Math.max(0,(S.me.inv[r.item]||0)-1);if(S.me.rodSel===r.uid)S.me.rodSel=null;toast(`${ITEMS[r.item].name}이(가) 부러졌습니다.`,'warn');return true;}return false;}
function net(){return S.me.net=S.me.net||[];}
function aqua(){return S.me.aqua=S.me.aqua||[];}
function dex(){return S.me.dex=S.me.dex||{};}
const JUNK=[['j_can','녹슨 통조림',30],['j_weed','해초줄기',35],['j_net','찢어진 그물',25],['j_bottle','편지가 담긴 병',10]];
const WATER={meadow:'강',sea:'바다',frost:'얼음 호수'};
const BOTTLE_LINES=['"이 편지를 주운 사람은 오늘 하루 운이 좋을 거예요. …아마도."','"엄마, 저 블레서 됐어요. 밥은 잘 챙겨 먹고 있어요."','"백야의 신전 아래에서 노랫소리가 들린다. 누구도 믿어 주지 않았다."','"내 낚싯대를 훔쳐 간 고양이를 찾습니다. 줄무늬, 뚱뚱함."','"2052년 8월, 타임어택 당일. 서버가 멈추기 직전, 하늘이 하얗게 갈라지는 걸 봤다."','"신들은 이방인을 불렀다. 그런데 이방인은 누가 불렀을까?"','"컨빨 길드원 모집합니다. 자격: 손이 빠를 것. 연락은… 바다에 물어보세요."','"이건 그냥 낙서입니다. 진짜로요. 더 읽지 마세요."','"블라스파미아의 안개 속에서 나를 부르는 목소리가 있었다. 내 이름을 알고 있었다."','"오늘의 저녁 메뉴: 생선. 내일도 생선. 모레도 아마 생선."','"라니아케아의 일곱 번째 나팔이 울리기 전에, 누군가는 이 편지를 읽어야 한다."','"사랑하는 R에게. 강가의 약속을 기억해? 나는 아직 거기 있어."'];
Object.assign(ITEMS,{bottle:{name:'편지가 담긴 병',type:'use',tag:'잡동사니',letter:true,desc:'낚시로 건져 올린 유리병. 안에 둘둘 말린 편지가 들어 있다. 사용하면 편지를 읽는다.',price:5}});
function castRoll(land,tier){
  const r=Math.random();bump('fishMin',CAST_MIN);bump('casts');const W=WATER[land]||'물';
  if(r<0.30){const c=castOnce(land,tier);noteFishBest(c);const e=dex()[c.sp];return {kind:'fish',c,rec:e.n>1&&e.max===c.size,text:`${fishName(c)}을(를) 낚았다! ${c.size}cm`};}
  if(r<0.42){const tot=JUNK.reduce((a,j)=>a+j[2],0);let x=Math.random()*tot,j=JUNK[0];for(const y of JUNK){x-=y[2];if(x<=0){j=y;break;}}
    const D=S.me.dexJunk=S.me.dexJunk||{};D[j[0]]=(D[j[0]]||0)+1;
    const text={j_can:`녹슨 통조림을 낚았다. ${W}에 쓰레기를 버리지 말자.`,j_weed:pick(['해초줄기를 낚았다. 생일도 아닌데.','미역줄기를 낚았다. 생일도 아닌데 미역국이라도 끓여야 하나.']),j_net:pick(['찢어진 그물을 낚았다. 누군가의 고기잡이는 실패한 모양이다.',`찢어진 그물이 걸려 올라왔다. ${W}에 쓰레기를 버리지 말자.`]),j_bottle:'편지가 담긴 병을 낚았다! 가방에 넣어 두었다.'}[j[0]];
    if(j[0]==='j_bottle')addItem('bottle',1);return {kind:'junk',j:j[0],text};}
  const miss=['물고기에게 농락당했다.','미끼만 물고 사라졌다.','찌가 잠잠하다… 아무것도 낚이지 않았다.','묵직한 손맛! …바닥에 걸린 돌이었다.','줄이 엉켜서 푸는 데만 한참 걸렸다.','무언가 걸렸지만 줄을 끊고 달아났다!'];
  if(land==='frost')miss.push('얼음 구멍이 다시 얼어붙어 버렸다.','손이 곱아서 줄을 놓쳤다.');if(land==='sea')miss.push('갈매기가 미끼를 채 갔다.');
  return {kind:'miss',text:pick(miss)};
}
function fishLog(land,text,kind){const me=S.me;me.fishLog=[{ts:now(),land,text,kind},...(me.fishLog||[])].slice(0,20);}
function castOnce(land,tier){
  const t=tier||rodTier();
  const pool=FISH[land].filter(f=>f[5]<=t);const tot=pool.reduce((a,f)=>a+f[4],0);let r=Math.random()*tot,f=pool[0];for(const x of pool){r-=x[4];if(r<=0){f=x;break;}}
  const k=Math.max(.5,2.4-.35*t);const size=Math.round((f[2]+(f[3]-f[2])*Math.pow(Math.random(),k))*10)/10;
  const D=dex();const e=D[f[0]]=D[f[0]]||{n:0,max:0};e.n++;if(size>e.max)e.max=size;
  return {sp:f[0],size,land,ts:now()};
}
function fishName(c){return FISH_BY_ID[c.sp]?FISH_BY_ID[c.sp].name:c.sp;}
function autoFishOn(){return !!(S.autoFish&&now()<S.autoFish.end);}
function fishCard(land){
  if(!FISH_LANDS[land])return '';
  const t=rodTier();const N=net();const af=S.autoFish;const tt=now();const R=rods();const sr=selRod();
  const sp=FISH[land];
  const autoBox=af?`<div class="cj ${tt>=af.end?'done':''}"><div class="cj-t"><span class="mp-ic">${tt>=af.end?'':SPIN_IC}</span><b>자동 낚시 · ${esc(LANDS[af.land])}</b><span class="cj-left num" data-af-left>${tt>=af.end?'완료':'남은 시간 '+fmtLong(af.end-tt)}</span></div><div class="bar"><i data-af-p style="width:${Math.min(100,(tt-af.start)/(af.end-af.start)*100)}%"></i></div>
    <div class="row cj-act">${tt>=af.end?`<button class="btn btn-sm btn-primary" data-act="af-claim">결과 받기</button>`:`<button class="btn btn-sm" data-act="af-stop">중단하고 결과 받기</button>`}</div></div>`:'';
  return `<section class="md-sec panel fishc" id="md-fishing"><div class="md-lbl fish-lbl"><span><i class="lbl-d" aria-hidden="true">◆</i>낚시 · ${FISH_LANDS[land]}</span><button class="fr-btn" data-act="fish-rank" data-land="${land}"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 2h7v3.8a3.5 3.5 0 0 1-7 0z" fill="currentColor"/><path d="M4.5 3.4H2.4v1.2a2.4 2.4 0 0 0 2.4 2.4M11.5 3.4h2.1v1.2a2.4 2.4 0 0 1-2.4 2.4" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M7.2 9.2h1.6v2.3H7.2z" fill="currentColor"/><path d="M5 13.8h6v-1.1a1.2 1.2 0 0 0-1.2-1.2H6.2A1.2 1.2 0 0 0 5 12.7z" fill="currentColor"/></svg>랭킹</button></div>
    <div class="fish-top">${R.length?`<label class="fish-rod"><span class="faint">낚싯대</span><select data-act-change="rodsel" ${af?'disabled':''}>${R.map(r=>`<option value="${r.uid}" ${sr&&sr.uid===r.uid?'selected':''}>${esc(rodLabel(r))}</option>`).join('')}</select></label>${sr?`<span class="rod-dura"><span class="dura-bar ${sr.dura<=sr.max*0.2?'low':''}">${Array.from({length:10},(_,i)=>`<i class="${i<Math.ceil(sr.dura/sr.max*10)?'on':''}"></i>`).join('')}</span><span class="num">${sr.dura}/${sr.max}</span></span>`:''}`:'<span class="reason">낚싯대가 없습니다 · 거래소에서 사거나 공방에서 제작하세요</span>'}</div>
    <p class="faint fish-sp">이곳의 물고기 · ${sp.map(f=>`<span class="${f[5]>t?'fsp-lock':''}" title="${f[5]}등급 낚싯대 이상">${f[1]}</span>`).join(' · ')}</p>
    ${(()=>{const Lg=(S.me.fishLog||[]).filter(x=>x.land===land).slice(0,5);return `<div class="flog">${Lg.length?Lg.map((x,i)=>`<p class="fl-${x.kind} ${i===0&&now()-x.ts<8000?'fresh':''}"><span>${esc(x.text)}</span><small class="faint">${fmtWhen(x.ts)}</small></p>`).join(''):'<p class="faint">아직 낚시 기록이 없습니다. 낚싯대를 던져 보세요.</p>'}</div>`;})()}
    <button class="netbtn" data-act="net-list"><span class="net-l">어망 <b class="num">${N.length}/${NET_MAX}</b></span><span class="net-mini">${Array.from({length:NET_MAX},(_,i)=>N[i]?`<img class="px" src="${FISH_IMG}" alt="">`:'<i></i>').join('')}</span><span class="net-open">열기 ›</span></button>
    ${autoBox}${S.fishCast?(()=>{const F=S.fishCast;const dn=tt>=F.end;return `<div class="cj ${dn?'done':''}"><div class="cj-t"><span class="mp-ic">${dn?'':SPIN_IC}</span><b>${dn?'찌가 움직인다!':'찌를 지켜보는 중'} · ${esc(LANDS[F.land])}</b><span class="cj-left num" data-fc-left>${dn?'확인 가능':'남은 시간 '+fmtLong(F.end-tt)}</span></div><div class="bar"><i data-fc-p style="width:${Math.min(100,(tt-F.start)/(F.end-F.start)*100)}%"></i></div>${dn?`<div class="row cj-act"><button class="btn btn-sm btn-primary" data-act="fish-reel">낚싯대 걷어 올리기</button></div>`:''}</div>`;})():''}
    <div class="row cj-act"><button class="btn btn-sm btn-primary" data-act="fish-cast" data-land="${land}" ${!t||af||S.fishCast||N.length>=NET_MAX?'disabled':''}>${N.length>=NET_MAX?'어망이 가득 찼습니다':`낚싯대 던지기 · ${CAST_MIN}분`}</button><button class="btn btn-sm" data-act="af-open" data-land="${land}" ${!t||af||S.fishCast?'disabled':''}>자동 낚시</button></div></section>`;
}
function afDlg(land){const dur=AF_DUR.includes(S.sel.afDur)?S.sel.afDur:AF_DUR[0];
  return `<button class="ibtn sm md-x" data-act="closemodal" aria-label="닫기">✕</button><h3 class="sh-ttl">자동 낚시 · ${esc(LANDS[land])}</h3>
    <div class="hunt-auto"><span class="md-meta">낚시 시간</span><div class="seg hunt-durs">${AF_DUR.map(m=>`<button data-act="af-dur" data-land="${land}" data-v="${m}" aria-pressed="${dur===m}">${durLabel(m)}</button>`).join('')}</div>
    ${(()=>{const r=selRod();const can=r?r.dura*AUTO_EVERY:0;const real=Math.min(dur,can);return `<p class="hunt-est">사용할 낚싯대 · <b>${r?esc(rodLabel(r)):'없음'}</b></p><p class="hunt-est">예상 · <b>${Math.floor(real/AUTO_EVERY)}</b>번 던지기${real<dur?` · <span class="reason" style="display:inline">내구도가 부족해 ${durLabel2(real)} 뒤 자동 종료</span>`:''}</p>`;})()}
    <p class="faint" style="font-size:12px">${AUTO_EVERY}분마다 한 번 낚싯대를 던지고, 던질 때마다 내구도가 1 줄어듭니다. 내구도가 다 닳으면 낚싯대가 부러지고 자동 낚시가 끝납니다. 낚은 물고기는 어망(${NET_MAX}칸)에 큰 순서대로 담기고, 어망에 들어가지 못한 물고기는 도감에 기록만 남기고 놓아줍니다.</p></div>
    <div class="row md-btns" style="margin-top:12px"><button class="btn btn-primary" data-act="af-go" data-land="${land}">자동 낚시 시작 · ${durLabel(dur)}</button></div>`;}
function afClaim(stop){
  const a=S.autoFish;if(!a)return;const t=now();if(!stop&&t<a.end)return;
  const k=autoKills(a,t);const got=[];let junk=0;for(let i=0;i<k;i++){const R=castRoll(a.land,a.tier);if(R.kind==='fish')got.push(R.c);else if(R.kind==='junk')junk++;}
  S.autoFish=null;{const r=rods().find(x=>x.uid===a.rod);if(r&&k)useRod(r,k);}const N=net();const all=[...N,...got].sort((x,y)=>y.size-x.size);const keep=all.slice(0,NET_MAX);const kept=got.filter(c=>keep.includes(c)).length;
  S.me.net=keep.sort((x,y)=>x.ts-y.ts);save();render();
  const sum=`자동 낚시 · ${k}번 던져 물고기 ${got.length}마리${junk?` · 잡동사니 ${junk}개`:''} · 어망에 ${kept}마리 담음${got.length-kept?` · ${got.length-kept}마리 놓아줌`:''}`;fishLog(a.land,sum,'auto');save();render();
  toast(sum,'good');
}
function netListDlg(){const N=net();
  return `<button class="ibtn sm md-x" data-act="closemodal" aria-label="닫기">✕</button><h3 class="sh-ttl">어망 <span class="faint num" style="font-size:13px">${N.length}/${NET_MAX}</span></h3>
    <div class="netgrid">${Array.from({length:NET_MAX},(_,i)=>{const c=N[i];return c?`<button class="net-s on" data-act="net-open" data-i="${i}" title="${esc(fishName(c))} ${c.size}cm"><img class="px" src="${FISH_IMG}" alt=""><span>${esc(fishName(c))}</span><small class="num">${c.size}cm</small></button>`:'<span class="net-s"></span>';}).join('')}</div>
    <p class="faint" style="font-size:12px;margin-top:10px">물고기를 누르면 방생 · 보관(수족관) · 재료 손질을 고를 수 있습니다. 잡동사니는 어망에 담기지 않고 낚시 기록과 도감에만 남습니다.</p>`;}
function netDlg(i){const c=net()[i];if(!c)return '';const f=FISH_BY_ID[c.sp];
  return `<button class="ibtn sm md-x" data-act="closemodal" aria-label="닫기">✕</button><div class="sh-dlg"><div class="sh-big"><img class="px" src="${FISH_IMG}" alt="" style="width:${Math.round(64+Math.min(1,(c.size-f.min)/Math.max(1,f.max-f.min))*56)}px"></div><h3>${esc(f.name)}</h3><p class="num">${c.size}cm · ${esc(LANDS[f.land])} · ${f.tier}등급</p>
    <div class="row" style="justify-content:center;gap:6px;margin-top:6px"><button class="btn btn-sm" data-act="net-do" data-i="${i}" data-v="release">방생</button><button class="btn btn-sm btn-primary" data-act="net-do" data-i="${i}" data-v="keep" ${aqua().length>=AQUA_MAX?'disabled':''}>보관 (수족관 ${aqua().length}/${AQUA_MAX})</button><button class="btn btn-sm" data-act="net-do" data-i="${i}" data-v="cut">재료 손질</button></div>
    <p class="faint" style="font-size:12px;margin-top:8px">재료 손질 시 「손질한 ${esc(f.name)}」 ${fillets(c)}개</p></div>`;}
function fillets(c){const f=FISH_BY_ID[c.sp];return 1+Math.floor(((c.size-f.min)/Math.max(1,f.max-f.min))*2)+(f.tier>=3?1:0);}
function aquaPanel(){
  const A=aqua();const D=dex();const caught=Object.keys(D).length;const total=Object.keys(FISH_BY_ID).length;
  const fishes=A.map((c,i)=>{const f=FISH_BY_ID[c.sp];const sc=Math.min(1,(c.size-f.min)/Math.max(1,f.max-f.min));const w=Math.round(20+sc*20+(f.tier-1)*4);
    const top=8+((i*37)%74),dur=14+((i*7)%11),dl=-((i*3.7)%dur);
    return `<div class="aq-f" style="top:${top}%;width:${w}px;animation-duration:${dur}s;animation-delay:${dl}s" title="${esc(f.name)} ${c.size}cm"><img class="px" src="${FISH_IMG}" alt="" style="animation-delay:${dl}s;animation-duration:${dur}s"></div>`;}).join('');
  const bubbles=Array.from({length:10},(_,i)=>`<i class="aq-b" style="left:${6+i*9.3}%;animation-delay:${-(i*1.3)}s;animation-duration:${5+i%4}s"></i>`).join('');
  const dexHTML=Object.entries(FISH).map(([land,list])=>`<div class="dex-g"><div class="dex-h">${esc(LANDS[land])} · ${FISH_LANDS[land]} <span class="faint num">${list.filter(f=>D[f[0]]).length}/${list.length}</span></div><div class="dex-list">${list.map(f=>{const e=D[f[0]];return `<div class="dex ${e?'':'unk'}"><img class="px" src="${FISH_IMG}" alt=""><b>${e?esc(f[1]):'???'}</b><small class="num">${e?`최대 ${e.max}cm · ${e.n}마리`:`${f[5]}등급 낚싯대 · ${f[2]}~${f[3]}cm`}</small></div>`;}).join('')}</div></div>`).join('');
  return `<div class="panel aq-p"><h3>${hTitle('spark','수족관')} <span class="aq-hr"><span class="faint num" style="letter-spacing:0;font-weight:400">${A.length}/${AQUA_MAX}</span><button class="btn btn-sm" data-act="dex-open">도감 보기 <span class="num">${caught}/${total}</span></button></span></h3>
    <div class="aq">${bubbles}${fishes||'<p class="aq-empty">아직 수족관이 비어 있습니다. 낚은 물고기를 어망에서 「보관」하면 이곳에서 헤엄칩니다.</p>'}<div class="aq-sand"></div></div>
    ${A.length?`<div class="aq-list">${A.map((c,i)=>`<span class="aq-chip">${esc(fishName(c))} <span class="num faint">${c.size}cm</span><button data-act="aq-release" data-i="${i}" aria-label="방생" title="방생">✕</button></span>`).join('')}</div>`:''}</div>
`;
}
function dexDlg(){const D=dex();const caught=Object.keys(D).length;const total=Object.keys(FISH_BY_ID).length;
  return `<button class="ibtn sm md-x" data-act="closemodal" aria-label="닫기">✕</button><h3 class="sh-ttl">물고기 도감 <span class="faint num" style="font-size:13px">${caught}/${total}</span></h3>`+Object.entries(FISH).map(([land,list])=>`<div class="dex-g"><div class="dex-h">${esc(LANDS[land])} · ${FISH_LANDS[land]} <span class="faint num">${list.filter(f=>D[f[0]]).length}/${list.length}</span></div><div class="dex-list">${list.map(f=>{const e=D[f[0]];return `<div class="dex ${e?'':'unk'}"><img class="px" src="${FISH_IMG}" alt=""><b>${e?esc(f[1]):'???'}</b><small class="num">${e?`최대 ${e.max}cm · ${e.n}마리`:`${f[5]}등급 낚싯대 · ${f[2]}~${f[3]}cm`}</small></div>`;}).join('')}</div></div>`).join('')+(()=>{const J=S.me.dexJunk||{};return `<div class="dex-g"><div class="dex-h">기타 · 잡동사니 <span class="faint num">${JUNK.filter(j=>J[j[0]]).length}/${JUNK.length}</span></div><div class="dex-list">${JUNK.map(j=>`<div class="dex ${J[j[0]]?'':'unk'}"><span class="dex-j">${{j_can:'🥫',j_weed:'🌿',j_net:'🕸',j_bottle:'🍾'}[j[0]]}</span><b>${J[j[0]]?esc(j[1]):'???'}</b><small class="num">${J[j[0]]?`${J[j[0]]}개 건짐`:'어딘가에 가라앉아 있다'}</small></div>`).join('')}</div></div>`;})();}
function ensureFish(){const me=S.me;if(!me||me.fishSeed)return;me.fishSeed=1;me.inv.rod1=(me.inv.rod1||0)+1;
  const mk=market();[['mkr1','rod1',60,20],['mkr2','rod2',240,80],['mkr3','rod3',700,240]].forEach(([id,item,price,sell])=>{if(!mk.some(x=>x.item===item))mk.push({id,item,price,sell,stock:null});});save();}

/* ───────── 카지노 · 골든 오아시스 (소금의 땅) ───────── */
const CASINO_LAND='salt';
Object.assign(ITEMS,{goldbar:{name:'골든 오아시스 골드바',type:'deco',tag:'장식품',desc:'골든 오아시스 VIP 금고에서 나온 순금 골드바. 반짝임만으로 방이 환해진다. 실제 화폐로는 쓸 수 없다.',icon:'<svg viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="gb-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1b8"/><stop offset=".45" stop-color="#e9c46a"/><stop offset="1" stop-color="#a87a22"/></linearGradient></defs><path d="M8 34 14 20h20l6 14z" fill="url(#gb-g)" stroke="#7a5512" stroke-width="1"/><path d="M14 20h20l-3 4H17z" fill="#fff6cf" opacity=".7"/><path d="M8 34h32v3H8z" fill="#8a611a"/><text x="24" y="31" text-anchor="middle" font-size="5.5" font-weight="700" fill="#7a5512" font-family="sans-serif">GOLDEN</text><path d="M36 14l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1z" fill="#fff"/></svg>'}});
const CASINO_SHOP=[{id:'cs_goldbar',item:'goldbar',price:1000,once:true}];
function casinoShopDlg(){const B=S.me.casinoBuy=S.me.casinoBuy||{};
  return `<button class="ibtn sm md-x" data-act="closemodal" aria-label="닫기">✕</button><h3 class="sh-ttl">골든 오아시스 상점</h3><p class="faint cas-note">골든 오아시스에서만 파는 물건입니다. 보유 ${S.me.gold.toLocaleString('ko-KR')}골드</p>
    <div class="cshop">${CASINO_SHOP.map(x=>{const it=ITEMS[x.item];const sold=x.once&&B[x.id];return `<div class="cshop-i ${sold?'sold':''}"><span class="cshop-ic">${it.icon||''}</span><div class="cshop-t"><b>${esc(it.name)}</b>${it.tag?`<span class="chip deco-tag">${it.tag}</span>`:''}<small>${esc(it.desc)}</small>${x.once?'<small class="faint">계정당 1회 구매</small>':''}</div>
      <div class="cshop-b">${goldHTML(x.price)}${sold?'<span class="chip dim">구매 완료</span>':`<button class="btn btn-sm btn-primary" data-act="cshop-buy" data-id="${x.id}" ${S.me.gold<x.price?'disabled':''}>${S.me.gold<x.price?'골드 부족':'구매'}</button>`}</div></div>`;}).join('')}</div>`;}
const SNAILS=[['번개','#e9c46a'],['느림보','#7fb38a'],['소금이','#cfd3d8'],['신기루','#b39ddb'],['모래폭풍','#e07a5f']];
const SNAIL_FEE=100,SNAIL_MAX=3,SNAIL_MULT=[2,4,6];
const LOTTO_PRICE=200,LOTTO_MAX=2,LOTTO_PRIZE={1:10000,2:3000,3:100};
function snailState(){return S.me.snail||null;}
const CASINO_LV=10;
function casinoHTML(){
  if(S.me.level<CASINO_LV)return `<section class="md-sec panel casino" id="md-casino"><div class="md-lbl"><i class="lbl-d" aria-hidden="true">◆</i>카지노</div><h3 class="cas-title">골든 오아시스</h3><p class="cas-desc">사막 위에 신기루처럼 서 있는, 금빛으로 장식된 거대한 카지노.</p><p class="reason" style="font-size:12.5px;margin-top:8px">입구의 경비원이 길을 막는다. "애송이는 출입 금지야. LV${CASINO_LV}부터 오라고."</p></section>`;
  const d=daily();const left=SNAIL_MAX-(d.snail||0);const L=lottoInfo();
  return `<section class="md-sec panel casino" id="md-casino"><div class="md-lbl"><i class="lbl-d" aria-hidden="true">◆</i>카지노</div>
    <h3 class="cas-title">골든 오아시스</h3>
    <p class="cas-desc">사막 위에 신기루처럼 서 있는, 금빛으로 장식된 거대한 카지노. 잠시 쉬어 가려던 여행자들이 도통 나오지 않는 일이 종종 있다.</p>
    <div class="cas-games">
      <button class="cas-g" data-act="snail-open"><b>🐌 달팽이 레이스</b><small>다섯 마리 중 1등을 맞히면 2배 → 4배 → 6배 · 1경기 ${SNAIL_FEE}골드</small><span class="cas-c">오늘 ${Math.max(0,left)}/${SNAIL_MAX}회 남음${snailState()?' · 진행 중':''}</span></button>
      <button class="cas-g" data-act="cshop-open"><b>💰 카지노 상점</b><small>골든 오아시스에서만 파는 특별한 물건</small><span class="cas-c">${CASINO_SHOP.filter(x=>!(x.once&&(S.me.casinoBuy||{})[x.id])).length}개 판매 중</span></button>
      <button class="cas-g" data-act="lotto-open"><b>🎟 주간 행운권</b><small>숫자 4개 · 매주 금요일 20:00 추첨 · 1장 ${LOTTO_PRICE}골드</small><span class="cas-c">이번 주 ${L.mine.length}/${LOTTO_MAX}장${L.unclaimed?` · <em>결과 확인 ${L.unclaimed}장</em>`:''}</span></button>
    </div></section>`;
}
/* 달팽이 레이스 */
function snailDlg(){
  const st=snailState();const d=daily();const left=SNAIL_MAX-(d.snail||0);
  const head=`<button class="ibtn sm md-x" data-act="closemodal" aria-label="닫기">✕</button><h3 class="sh-ttl">🐌 달팽이 레이스</h3>`;
  const track=(pos,win,anim)=>`<div class="sn-track">${SNAILS.map(([n,c],i)=>`<div class="sn-lane ${st&&st.pick===i?'mine':''}"><span class="sn-no">${i+1}</span><span class="sn-name">${n}</span><div class="sn-road"><span class="sn-flag"></span><span class="sn ${anim?'run':''}" style="--c:${c};--to:${pos[i]};--dur:${anim?anim[i]:0}s">🐌</span></div>${win===i?'<span class="sn-win">1등</span>':''}</div>`).join('')}</div>`;
  if(!st){
    const sel=S.sel.snailPick;
    return `${head}<p class="faint cas-note">한 경기는 최대 3페이즈입니다. 고른 달팽이가 1등이면 그 자리에서 보상을 받거나, 다음 레이스에 걸 수 있습니다. 지면 그 경기의 보상은 모두 사라집니다. 참가비 ${SNAIL_FEE}골드는 시작할 때 한 번만 냅니다.</p>
      <div class="sn-mult">${SNAIL_MULT.map((m,i)=>`<span>${i+1}페이즈 <b>${m}배</b> · ${SNAIL_FEE*m}골드</span>`).join('')}</div>
      ${track([0,0,0,0,0],-1)}
      <div class="sn-pick">${SNAILS.map(([n,c],i)=>`<button data-act="snail-pick" data-i="${i}" aria-pressed="${sel===i}" style="--c:${c}">${i+1}. ${n}</button>`).join('')}</div>
      <div class="row md-btns"><button class="btn btn-primary btn-sm" data-act="snail-start" ${sel==null||left<=0||S.me.gold<SNAIL_FEE?'disabled':''}>${left<=0?'오늘 3회를 모두 사용했습니다':S.me.gold<SNAIL_FEE?'골드가 부족합니다':`${SNAIL_FEE}골드 내고 출발`}</button><span class="faint" style="font-size:12px;align-self:center">오늘 남은 경기 ${Math.max(0,left)}/${SNAIL_MAX} · 보유 ${S.me.gold.toLocaleString('ko-KR')}골드</span></div>`;
  }
  const ph=st.phase;const last=st.last;
  if(st.running){return `${head}<div class="sn-ph">${ph+1}페이즈 · ${SNAIL_MULT[ph]}배 레이스 · 내 달팽이 <b>${SNAILS[st.pick][0]}</b></div>${track(last.pos,-1,last.dur)}<p class="faint cas-note" style="text-align:center">달팽이들이 열심히 기어가는 중…</p>`;}
  const won=last&&last.win===st.pick;const prize=SNAIL_FEE*SNAIL_MULT[ph];
  return `${head}<div class="sn-ph">${ph+1}페이즈 결과 · 내 달팽이 <b>${SNAILS[st.pick][0]}</b></div>${track(last.pos,last.win)}
    ${won?`<div class="cas-res win"><b>${SNAILS[last.win][0]} 1등!</b> 지금 받으면 <b>${prize.toLocaleString('ko-KR')}골드</b>${ph<2?` · 다음 레이스에 걸면 <b>${(SNAIL_FEE*SNAIL_MULT[ph+1]).toLocaleString('ko-KR')}골드</b> 도전`:''}</div>
      <div class="sn-pick">${ph<2?SNAILS.map(([n,c],i)=>`<button data-act="snail-pick2" data-i="${i}" aria-pressed="${st.pick===i}" style="--c:${c}">${i+1}. ${n}</button>`).join(''):''}</div>
      <div class="row md-btns"><button class="btn btn-primary btn-sm" data-act="snail-cash">${prize.toLocaleString('ko-KR')}골드 받기</button>${ph<2?`<button class="btn btn-sm" data-act="snail-next">${ph+2}페이즈 도전 (${SNAIL_MULT[ph+1]}배)</button>`:''}</div>`
    :`<div class="cas-res lose"><b>${SNAILS[last.win][0]}</b>이(가) 1등으로 들어왔다. ${SNAILS[st.pick][0]}은(는) ${last.rank}등… 이번 경기의 보상은 사라졌습니다.</div><div class="row md-btns"><button class="btn btn-sm" data-act="snail-end">확인</button></div>`}`;
}
function snailRun(){
  const st=snailState();const win=Math.floor(Math.random()*5);
  const dur=SNAILS.map((_,i)=>i===win?3.2:3.4+Math.random()*1.6);const order=dur.map((d,i)=>[d,i]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
  const pos=SNAILS.map((_,i)=>i===win?100:Math.round(70+Math.random()*25));
  st.last={win,pos,dur,rank:order.indexOf(st.pick)+1};st.running=true;save();openSnail();
  setTimeout(()=>{const s2=snailState();if(!s2)return;s2.running=false;save();if($('.sn-track'))openSnail();if(s2.last.win===s2.pick)toast(`${SNAILS[s2.pick][0]} 1등!`,'good');},Math.max(...dur)*1000+300);
}
function openSnail(){modal(snailDlg());const mm=$('.modal');if(mm)mm.classList.add('craftm');}
/* 주간 행운권 */
function nextDraw(t=now()){
  const k=new Date(t+9*3600e3);const dow=k.getUTCDay();let add=(5-dow+7)%7;
  let fri=Date.UTC(k.getUTCFullYear(),k.getUTCMonth(),k.getUTCDate()+add,20,0,0)-9*3600e3;
  if(t>=fri)fri+=7*86400e3;
  return {at:fri,close:fri-3600e3,key:new Date(fri+9*3600e3).toISOString().slice(0,10)};
}
function drawNums(key){const r=seedRnd('lotto'+key);const a=[0,1,2,3,4,5,6,7,8,9];for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a.slice(0,4).sort((x,y)=>x-y);}
function lottoRank(nums,win){const h=nums.filter(n=>win.includes(n)).length;return h===4?1:h===3?2:h===2?3:0;}
function lottoInfo(){const L=S.me.lotto=S.me.lotto||[];const nd=nextDraw();const t=now();
  return {nd,mine:L.filter(x=>x.draw===nd.key),done:L.filter(x=>t>=x.at),unclaimed:L.filter(x=>t>=x.at&&!x.claimed).length,open:t<nd.close};}
function lottoDlg(){
  const I=lottoInfo();const sel=S.sel.lotPick||[];const t=now();const p=kstParts(I.nd.at);
  const head=`<button class="ibtn sm md-x" data-act="closemodal" aria-label="닫기">✕</button><h3 class="sh-ttl">🎟 주간 행운권</h3>`;
  const ball=(n,on)=>`<span class="lt-ball ${on?'hit':''}">${n}</span>`;
  const past=I.done.slice().sort((a,b)=>b.at-a.at).slice(0,6).map(x=>{const w=drawNums(x.draw);const rk=lottoRank(x.nums,w);
    return `<div class="lt-row ${x.claimed?'done':''}"><div><small class="faint">${x.draw} 추첨</small><div class="lt-balls">${x.nums.map(n=>ball(n,w.includes(n))).join('')}<span class="faint" style="margin:0 6px">당첨 번호</span>${w.map(n=>`<span class="lt-ball win">${n}</span>`).join('')}</div></div>${x.claimed?`<span class="chip dim">${rk?`${rk}등 · 수령 완료`:'낙첨'}</span>`:`<button class="btn btn-sm ${rk?'btn-primary':''}" data-act="lotto-claim" data-id="${x.id}">${rk?`${rk}등 · ${LOTTO_PRIZE[rk].toLocaleString('ko-KR')}골드 받기`:'낙첨 확인'}</button>`}</div>`;}).join('');
  return `${head}<p class="faint cas-note">0~9 중 서로 다른 숫자 4개를 고르세요. 매주 금요일 20:00에 당첨 번호 4개가 공개됩니다. 4개 일치 1등 ${LOTTO_PRIZE[1].toLocaleString('ko-KR')}골드 · 3개 2등 ${LOTTO_PRIZE[2].toLocaleString('ko-KR')}골드 · 2개 3등 ${LOTTO_PRIZE[3]}골드. 1장 ${LOTTO_PRICE}골드, 한 주에 ${LOTTO_MAX}장까지 금요일 19:00 전에 살 수 있습니다.</p>
    <div class="lt-next">다음 추첨 <b>${p.mo}월 ${p.d}일(${p.wd}) 20:00</b> · 판매 마감 19:00 · <span class="num" data-lt-left>${fmtLong(I.nd.at-t)}</span> 남음</div>
    <div class="lt-pad">${Array.from({length:10},(_,n)=>`<button data-act="lotto-pick" data-n="${n}" aria-pressed="${sel.includes(n)}">${n}</button>`).join('')}</div>
    <div class="row md-btns"><button class="btn btn-primary btn-sm" data-act="lotto-buy" ${sel.length!==4||!I.open||I.mine.length>=LOTTO_MAX||S.me.gold<LOTTO_PRICE?'disabled':''}>${!I.open?'판매 마감 (금 19:00~20:00)':I.mine.length>=LOTTO_MAX?'이번 주 2장을 모두 샀습니다':sel.length!==4?`숫자 ${4-sel.length}개 더 고르기`:S.me.gold<LOTTO_PRICE?'골드가 부족합니다':`${LOTTO_PRICE}골드로 구매`}</button><button class="btn btn-sm btn-ghost" data-act="lotto-auto">자동 선택</button></div>
    <div class="lt-sec"><div class="ph">이번 주 내 행운권 ${I.mine.length}/${LOTTO_MAX}</div>${I.mine.length?I.mine.map(x=>`<div class="lt-row"><div class="lt-balls">${x.nums.map(n=>ball(n)).join('')}</div><span class="chip warn">추첨 대기</span></div>`).join(''):'<p class="faint" style="font-size:12.5px">아직 산 행운권이 없습니다.</p>'}</div>
    ${past?`<div class="lt-sec"><div class="ph">지난 추첨 결과</div>${past}</div>`:''}`;
}
function openLotto(){modal(lottoDlg());const mm=$('.modal');if(mm)mm.classList.add('craftm');}

/* ───────── 낚시 랭킹 ───────── */
function fishBoard(land,wkArg){
  const wk=wkArg||weekKey();const list=FISH[land];
  const rows=S.bots.map(b=>{const r=seedRnd('fr'+wk+land+b.name);if(r()<0.35)return null;const tier=Math.min(4,1+Math.floor(r()*r()*4));const pool=list.filter(f=>f[5]<=tier);const f=pool[Math.floor(r()*pool.length)];
    const size=Math.round((f[2]+(f[3]-f[2])*Math.pow(r(),1.6))*10)/10;return {name:b.name,sp:f[1],size};}).filter(Boolean);
  const mine=S.me.fishBestWk===wk&&(S.me.fishBest||{})[land];if(mine)rows.push({name:S.me.name,sp:FISH_BY_ID[mine.sp]?FISH_BY_ID[mine.sp].name:mine.sp,size:mine.size,me:true});
  return rows.sort((a,b)=>b.size-a.size);
}
function fishRankDlg(land){
  const B=fishBoard(land);const my=B.findIndex(x=>x.me);const row=(x,i)=>`<div class="fr-row ${x.me?'me':''}"><span class="fr-no n${i+1}">${i+1}</span><b>${esc(x.name)}</b><span class="faint">${esc(x.sp)}</span><span class="num fr-sz">${x.size}cm</span></div>`;
  return `<button class="ibtn sm md-x" data-act="closemodal" aria-label="닫기">✕</button><h3 class="sh-ttl fr-h"><span class="fr-ic"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 2h7v3.8a3.5 3.5 0 0 1-7 0z" fill="currentColor"/><path d="M4.5 3.4H2.4v1.2a2.4 2.4 0 0 0 2.4 2.4M11.5 3.4h2.1v1.2a2.4 2.4 0 0 1-2.4 2.4" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M7.2 9.2h1.6v2.3H7.2z" fill="currentColor"/><path d="M5 13.8h6v-1.1a1.2 1.2 0 0 0-1.2-1.2H6.2A1.2 1.2 0 0 0 5 12.7z" fill="currentColor"/></svg></span>${esc(LANDS[land])} 낚시 랭킹</h3>
    <p class="faint" style="font-size:12px;margin:0 0 10px">이번 주(월요일 초기화) 이 지역에서 낚은 가장 큰 물고기 기준 · 참가 ${B.length}명</p>
    <div class="fr-list">${B.slice(0,3).map(row).join('')||'<p class="empty">아직 기록이 없습니다.</p>'}</div>
    <div class="fr-mine"><div class="ph" style="margin-bottom:6px">내 순위</div>${my>=0?row(B[my],my):'<p class="faint" style="font-size:12.5px">이번 주 이 지역에서 낚은 물고기가 없습니다.</p>'}</div>`;
}
function settleFish(){const me=S.me;if(!me||!me.fishBestWk||me.fishBestWk===weekKey()||me.fishSettled===me.fishBestWk)return;
  const wk=me.fishBestWk;me.fishSettled=wk;let won=0;
  for(const land in (me.fishBest||{})){const B=fishBoard(land,wk);if(B[0]&&B[0].me){won++;const x=B[0];
    me.fishKingLand=me.fishKingLand||{};me.fishKingLand[land]=(me.fishKingLand[land]||0)+1;
    deliverMail('운영자',`[주간 낚시 랭킹] ${wk} 주간 ${LANDS[land]} 1위를 축하합니다! 기록 · ${x.sp} ${x.size}cm. 보상으로 500골드와 칭호 〈${villageName(land)}의 낚시왕〉을 드립니다.`,{_gold:500});}}
  if(won){me.fishKing=(me.fishKing||0)+won;setTimeout(checkTitles,0);}save();}
function noteFishBest(c){settleFish();const me=S.me;const wk=weekKey();if(me.fishBestWk!==wk){me.fishBestWk=wk;me.fishBest={};}me.fishBest=me.fishBest||{};const b=me.fishBest[c.land];if(!b||c.size>b.size)me.fishBest[c.land]={sp:c.sp,size:c.size};}

/* ───────── 장인 의뢰 게시판 ───────── */
const COMM_N=4;
const COMM_FROM={craft:['에트나 경비대','사막 쉼터 상단','순례자 길드','벤테 항만 관리소'],cook:['에우도라 여관','벤테 선원 식당','칼리로에 연구소 식당','히페리온 연회장'],alch:['에우도라 치료소','로타스 약방','칼리로에 의무실','데이모스의 누군가']};
function commBoard(){
  const c=kstCycle();const B=S.me.comm;if(B&&B.cycle===c)return B;
  const r=seedRnd('comm'+c+S.me.name);const out=[];
  for(let i=0;i<COMM_N;i++){const kind=['craft','cook','alch'][Math.floor(r()*3)];const rs=RECIPES[kind].filter(x=>x[4]>=3);const rc=rs[Math.floor(r()*rs.length)];const n=1+Math.floor(r()*(rc[4]>=5?3:2));
    const gold=Math.round((40+(6-rc[4])*60)*n*(0.9+r()*0.3));out.push({id:'cm'+i,kind,item:rc[1],n,gold,from:COMM_FROM[kind][Math.floor(r()*4)],done:false});}
  return S.me.comm={cycle:c,list:out};
}
function commPanel(){
  const B=commBoard();
  return `<div class="panel"><h3>${hTitle('scroll','장인 의뢰 게시판')} <span class="faint num" style="letter-spacing:0;font-weight:400">${B.list.filter(x=>x.done).length}/${B.list.length} · 05:00 갱신</span></h3>
    <div class="cm-list">${B.list.map(x=>{const it=ITEMS[x.item];const have=S.me.inv[x.item]||0;const ok=have>=x.n;
      return `<div class="cm ${x.done?'done':''}"><div class="cm-t"><span class="cm-k k-${x.kind}">${PROF[x.kind].n}</span><b>${esc(it?it.name:x.item)} ×${x.n}</b><small class="faint">${esc(x.from)}</small></div>
        <div class="cm-r"><span class="faint">보유 <b class="num ${ok?'ok-t':''}">${have}/${x.n}</b></span><span>보상 ${goldHTML(x.gold)}${prof(x.kind).rank?' · 장인 보너스 +20%':''}</span>
        ${x.done?'<span class="chip dim">납품 완료</span>':`<button class="btn btn-sm ${ok?'btn-primary':''}" data-act="comm-do" data-id="${x.id}" ${ok?'':'disabled'}>${ok?'납품하기':'물건 부족'}</button>`}</div></div>`;}).join('')}</div>
    <p class="faint" style="font-size:12px;margin-top:8px">공방에서 만든 물건을 납품하면 골드를 받습니다. 해당 장인 직업을 가지고 있으면 보상이 20% 늘어납니다.</p></div>`;
}

/* ───────── 주간 미션 ───────── */
const WM_POOL=[
  ['explores','탐색 15회 하기',15,{gold:300,exp:200}],['casts','낚싯대 20번 던지기',20,{gold:300,exp:150}],['raidsWon','전투 10회 승리',10,{gold:400,exp:300}],
  ['dunClear','던전 3회 클리어',3,{gold:500,exp:400}],['quests','퀘스트 5개 완료',5,{gold:300,exp:300}],['crafts','공방 작업 5회 완료',5,{gold:350,exp:200}],
  ['commissions','장인 의뢰 3건 납품',3,{gold:400,exp:200}],['vilTalk','마을 사람들과 30번 대화',30,{gold:150,exp:100}],['snail','달팽이 레이스 3회 참가',3,{gold:200,exp:50}],
  ['enhTries','장비 강화 5회 시도',5,{gold:250,exp:100}]];
const WM_N=5,WM_BONUS={gold:1500,exp:1000};
function weeklyM(){
  const wk=weekKey();let W=S.me.wm;S.stats=S.stats||{};
  if(!W||W.week!==wk){const r=seedRnd('wm'+wk+S.me.name);const pool=WM_POOL.slice();const pick=[];while(pick.length<WM_N&&pool.length){pick.push(pool.splice(Math.floor(r()*pool.length),1)[0][0]);}
    W=S.me.wm={week:wk,keys:pick,base:Object.fromEntries(pick.map(k=>[k,S.stats[k]||0])),claimed:{},bonus:false};save();}
  return W;
}
function wmProg(W,k){const d=WM_POOL.find(x=>x[0]===k);return {def:d,cur:Math.min(d[2],(S.stats[k]||0)-(W.base[k]||0))};}
function weeklyPanel(){
  const W=weeklyM();const ok=k=>wmProg(W,k).cur>=wmProg(W,k).def[2];const done=W.keys.filter(ok).length;const all=done===W.keys.length;
  const open=S.sel.wmOpen!==false;
  return `<div class="me-quests ${open?'':'folded'}"><div class="ph"><button class="cq-tog" data-act="wm-toggle" aria-expanded="${open}">${hTitle('star','주간 미션')}<span class="cq-n num">${done}/${W.keys.length}</span><svg class="cq-ar" viewBox="0 0 10 10" aria-hidden="true"><path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button><span class="faint" style="font-size:11px">월 00:00 초기화</span></div>
    <div class="list wm-list">${W.keys.map(k=>{const {def,cur}=wmProg(W,k);const d=cur>=def[2];
      return `<div class="wm ${d?'ok':''}"><span class="wm-ck" aria-hidden="true">${d?'✓':''}</span><span class="wm-n">${esc(def[1])}</span><span class="num faint">${cur}/${def[2]}</span></div>`;}).join('')}
      <div class="wm-fin"><small class="faint">모두 완료 보상 · ${WM_BONUS.gold.toLocaleString('ko-KR')}골드 · EXP ${WM_BONUS.exp.toLocaleString('ko-KR')}</small>${W.bonus?'<span class="chip dim">수령 완료</span>':`<button class="btn btn-sm ${all?'btn-primary':''}" data-act="wm-bonus" ${all?'':'disabled'}>보상 받기</button>`}</div></div></div>`;
}

/* ───────── 커뮤니티 피드 ───────── */
const EMOJIS=['😀','😂','🥹','😍','😎','🤔','😭','😡','👍','👏','🙏','💪','🔥','✨','🎉','💯','❤️','💔','⭐','🌙','☀️','🌧','❄️','🌊','🐟','🎣','🐌','🍞','🍲','⚔️','🛡','🏹','🔮','💰','🎲','🏆','👑','💀','👻','🐉'];
const FEED_SEED=[
  ['카이로','오늘 백야의 신전 근처까지 갔다가 봉인 수호자 그림자만 보고 도망쳤다… 다음 주에 토벌대 모집합니다 ⚔️',5,['세린','아르덴'],[['아르덴','저 껴 주세요! 탱 가능합니다 🛡',[['카이로','오 환영합니다 👍']]],['노아','그림자만 봐도 무섭죠 ㅋㅋ',[]]]],
  ['벨라','벤테 어시장 아줌마가 꽃게 덤으로 줬어요 🦀 바다의 땅 최고!',9,['이안','엘라','노아'],[['이안','벨라 님 낚시 랭킹 1위 노리시는 거죠? 🎣',[['벨라','들켰다 😎']]]]],
  ['소하','달팽이 레이스 3연속 우승 실화냐… 모래폭풍 사랑해 🐌🐌🐌',14,['카이로','하윤','도겸','레아'],[['도겸','저는 번개한테 전 재산 날렸습니다 😭',[]],['하윤','도박꾼 칭호 부럽다…',[]]]],
  ['엘라','에우도라 빵집 밀빵 진짜 맛있어요. 초보 블레서분들 꼭 들러 보세요 🍞',22,['세린','소하'],[]],
  ['아르덴','로타스 마을 사람들 말 걸면 "……"만 해요. 무서워요 👻',30,['벨라','카이로','엘라','노아','이안'],[['레아','…그게… 로타스의 매력…',[['아르덴','ㅋㅋㅋㅋㅋ 레아님 혹시 로타스 출신?']]]]]
];
function feed(){if(!S.feed){const t=now();S.feed=FEED_SEED.map(([a,txt,h,likes,cm],i)=>({id:'fd'+i,author:a,text:txt,img:null,ts:t-h*3600e3,likes:likes.slice(),comments:cm.map(([ca,ct,rp],j)=>({id:`fc${i}_${j}`,author:ca,text:ct,ts:t-(h-1)*3600e3+j*600e3,likes:[],replies:(rp||[]).map(([ra,rt],r)=>({id:`fr${i}_${j}_${r}`,author:ra,text:rt,ts:t-(h-2)*3600e3+r*300e3,likes:[]}))}))}));}return S.feed;}
function pInfo(n){if(S.me&&n===S.me.name)return {job:S.me.job,img:S.me.portrait};const b=bot(n);return {job:b?b.job:'defender',img:b&&b.portrait};}
function avatar(n,cls){const p=pInfo(n);return p.img?`<img class="fd-av ${cls||''}" src="${p.img}" alt="">`:`<span class="fd-av ${cls||''} ${jobCls(p.job)}">${CLASSES[p.job]?CLASSES[p.job].sigil:'?'}</span>`;}
function richText(t){return esc(t).replace(/\n/g,'<br>');}
function likeBtn(kind,id,likes){const on=likes.includes(S.me.name);return `<button class="fd-like ${on?'on':''}" data-act="fd-like" data-k="${kind}" data-id="${id}" aria-pressed="${on}"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 14s-5.6-3.4-5.6-7.3A2.9 2.9 0 0 1 8 5a2.9 2.9 0 0 1 5.6 1.7C13.6 10.6 8 14 8 14z" fill="${on?'currentColor':'none'}" stroke="currentColor" stroke-width="1.3"/></svg>${likes.length||''}</button>`;}
function emojiBtn(target){return `<span class="emo-w"><button type="button" class="emo-btn" data-act="emo-open" data-t="${target}" aria-label="이모티콘">☺</button>${S.sel.emoFor===target?`<span class="emo-pop">${EMOJIS.map(e=>`<button type="button" data-act="emo-put" data-t="${target}" data-e="${e}">${e}</button>`).join('')}</span>`:''}</span>`;}
function nameBtn(n){return `<button class="who-btn fd-name" data-act="uinfo" data-name="${esc(n)}">${esc(n)}</button>`;}
function commentHTML(p,c){
  const rp=S.sel.fdReply===c.id;
  return `<div class="fd-c"><div class="fd-c-main">${avatar(c.author,'sm')}<div class="fd-c-b"><div>${nameBtn(c.author)} <span class="fd-ct">${richText(c.text)}</span></div>
    <div class="fd-meta"><span>${fmtWhen(c.ts)}</span>${likeBtn('c',c.id,c.likes)}<button class="fd-lnk" data-act="fd-reply" data-id="${c.id}">답글</button></div></div></div>
    ${(c.replies||[]).length?`<div class="fd-replies">${c.replies.map(r=>`<div class="fd-c-main">${avatar(r.author,'xs')}<div class="fd-c-b"><div>${nameBtn(r.author)} <span class="fd-ct">${richText(r.text)}</span></div><div class="fd-meta"><span>${fmtWhen(r.ts)}</span>${likeBtn('r',r.id,r.likes)}</div></div></div>`).join('')}</div>`:''}
    ${rp?`<form class="fd-cform reply" data-form="fd-reply" data-post="${p.id}" data-cid="${c.id}"><input type="text" id="fdi-${c.id}" maxlength="150" placeholder="${esc(c.author)}님에게 답글" autocomplete="off">${emojiBtn('fdi-'+c.id)}<button class="chat-send" type="submit">등록</button></form>`:''}</div>`;
}
function postHTML(p){
  const open=S.sel.fdOpen&&S.sel.fdOpen[p.id];const cm=p.comments||[];const shown=open?cm:cm.slice(-2);
  const cnt=cm.reduce((a,c)=>a+1+(c.replies||[]).length,0);
  return `<article class="panel fd-post"><header class="fd-h">${avatar(p.author)}<div class="fd-hb">${nameBtn(p.author)}<small class="faint">${CLASSES[pInfo(p.author).job]?CLASSES[pInfo(p.author).job].name:''} · ${fmtWhen(p.ts)}</small></div>${p.author===S.me.name?`<button class="fd-lnk fd-del" data-act="fd-del" data-id="${p.id}">삭제</button>`:''}</header>
    ${p.text?`<p class="fd-text">${richText(p.text)}</p>`:''}
    <div class="fd-bar">${likeBtn('p',p.id,p.likes)}<span class="fd-cc"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.4 3.6c0-.8.6-1.4 1.4-1.4h8.4c.8 0 1.4.6 1.4 1.4v6c0 .8-.6 1.4-1.4 1.4H7l-3.2 2.6V11h-.2c-.8 0-1.4-.6-1.4-1.4z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>${cnt||''}</span>${p.likes.length?`<small class="faint fd-lk">${esc(p.likes.slice(-2).join(', '))}${p.likes.length>2?` 외 ${p.likes.length-2}명`:''}님이 좋아합니다</small>`:''}</div>
    ${cm.length>2&&!open?`<button class="fd-lnk fd-more" data-act="fd-more" data-id="${p.id}">댓글 ${cm.length}개 모두 보기</button>`:''}
    <div class="fd-cs">${shown.map(c=>commentHTML(p,c)).join('')}</div>
    <form class="fd-cform" data-form="fd-comment" data-post="${p.id}">${avatar(S.me.name,'xs')}<input type="text" id="fdc-${p.id}" maxlength="150" placeholder="댓글 달기…" autocomplete="off">${emojiBtn('fdc-'+p.id)}<button class="chat-send" type="submit">등록</button></form></article>`;
}
function vCommunity(){
  const F=feed().slice().sort((a,b)=>b.ts-a.ts);
  return `<div class="wrap page"><div class="page-head"><div><h2>커뮤니티<small class="en">Community</small></h2></div></div>
    <form class="panel fd-compose" data-form="fd-post"><div class="fd-cp">${avatar(S.me.name)}<textarea id="fd-text" maxlength="300" rows="3" placeholder="무슨 일이 있었나요? 블레서들과 이야기를 나눠 보세요.">${esc(S.sel.fdDraft||'')}</textarea></div>
      <div class="fd-tools">${emojiBtn('fd-text')}<span class="faint num fd-count" id="fd-count">${(S.sel.fdDraft||'').length}/300</span><button class="btn btn-sm btn-primary" type="submit">게시</button></div></form>
    <div class="fd-list">${F.map(postHTML).join('')}</div></div>`;
}
function fdFind(kind,id){for(const p of feed()){if(kind==='p'&&p.id===id)return p;for(const c of p.comments||[]){if(kind==='c'&&c.id===id)return c;for(const r of c.replies||[])if(kind==='r'&&r.id===id)return r;}}return null;}
function fdBotReact(p){const pool=S.bots.filter(b=>b.online&&b.name!==p.author);
  for(let i=0;i<Math.floor(Math.random()*4)+1;i++)later(rnd(2000,9000),()=>{const b=pick(pool);if(b&&!p.likes.includes(b.name)){p.likes.push(b.name);save();if(S.route==='community')render();}});
  if(Math.random()<0.75)later(rnd(5000,14000),()=>{const b=pick(pool);if(!b)return;p.comments.push({id:uid('fc'),author:b.name,text:pick(['오 멋져요! 👍','ㅋㅋㅋㅋ 공감합니다','저도 어제 그랬어요 😂','부럽다… ✨','다음에 같이 가요!','이거 진짜예요?? 🤔','사진 미쳤다 🔥','블레서님 최고 💯']),ts:now(),likes:[],replies:[]});save();if(S.route==='community')render();notify(`${b.name}님이 내 글에 댓글을 남겼습니다.`);});}

/* ───────── 관계 ───────── */
const BOND={friend:{n:'친한 친구',c:'#7fb2f0'},comrade:{n:'전우',c:'#ec7f6f'},lover:{n:'연인',c:'#f08fc0'},roommate:{n:'동거인',c:'#62c7c0'},family:{n:'가족',c:'#e9c46a'}};
function ddayOf(b){return b.dday||kstParts(b.since||now()).key;}
function ddayText(d){const today=new Date(kstParts().key+'T00:00:00Z'),t=new Date(d+'T00:00:00Z');const diff=Math.round((t-today)/86400000);return diff>0?`${diff}일 후 시작`:`D - ${1-diff}`;}
function bondOf(n){return (S.bonds||{})[n];}
function bondChip(n,sm){const b=bondOf(n);if(!b)return '';const t=BOND[b.type];return `<span class="bchip ${sm?'sm':''}" style="--bc:${t.c}" title="관계 · ${t.n}${b.memo?' · '+esc(b.memo):''}">${t.n}${b.memo&&!sm?` · ${esc(b.memo)}`:''}</span>`;}
const BTABS=['all','family','roommate','comrade','friend'];const BPER=5;
function bondDate(t){const p=kstParts(t);return `${p.y+GAME_YEAR_OFFSET}.${pad2(p.mo)}.${pad2(p.d)}`;}
function bondRow([n,b]){const p=bot(n);return `<div class="brow2">${p?sigil(p.job,'sm'):''}<span class="bt"><span class="bchip has-tip" tabindex="0" style="--bc:${BOND[b.type].c}" data-tip="${bondDate(b.since)}부터">${BOND[b.type].n}</span><button class="who-btn" data-act="uinfo" data-name="${esc(n)}" title="${esc(n)} 정보 보기">${esc(n)}</button>${p?roleChip(p.job):''}${b.type==='lover'?(S.sel.ddEdit===n?`<form class="bmemo-ed dd-ed" data-form="bond-dday" data-name="${esc(n)}"><input type="date" id="dd-in" value="${ddayOf(b)}" aria-label="D-day 날짜"><button class="btn btn-sm btn-primary" type="submit">저장</button>${b.dday?`<button class="btn btn-sm btn-ghost" type="button" data-act="dd-clear" data-name="${esc(n)}">처음 날로</button>`:''}</form>`:`<button class="dday" data-act="dd-edit" data-name="${esc(n)}" title="D-day 기준일 ${esc(ddayOf(b))}${b.dday?'':' (연인이 된 날)'} · 눌러서 수정">${ddayText(ddayOf(b))}</button>`):''}${S.sel.bondMemo===n?`<form class="bmemo-ed" data-form="bond-memo" data-name="${esc(n)}"><input type="text" id="bm-in" maxlength="20" value="${esc(b.memo||'')}" placeholder="모두에게 보이는 메모 (20자)"><button class="btn btn-sm btn-primary" type="submit">저장</button></form>`:`<button class="bmemo" data-act="bond-memo" data-name="${esc(n)}" title="모두에게 보이는 관계 메모 · 눌러서 ${b.memo?'수정':'작성'}">${b.memo?esc(b.memo):TICON.pen+' 메모'}</button>`}</span><button class="ibtn sm danger" data-act="bond-endask" data-name="${esc(n)}" data-tip="관계 해제" aria-label="${esc(n)}와의 관계 해제">✕</button></div>`;}
const SHELF_N=8;
function shelf(){const me=S.me;if(!Array.isArray(me.shelf))me.shelf=Array(SHELF_N).fill(null);while(me.shelf.length<SHELF_N)me.shelf.push(null);return me.shelf;}
function noteDeco(k,src){const me=S.me;me.decoSrc=me.decoSrc||{};if(!me.decoSrc[k]&&src&&src.v)me.decoSrc[k]=src;}
function decoSrcText(k){const x=(S.me.decoSrc||{})[k];if(!x)return '';return x.t==='gift'?`[${x.v}에게 받음]`:x.t==='event'?`[${x.v}에서 받음]`:`획득 장소 · ${x.v}`;}
function shelfCount(k){return shelf().filter(x=>x===k).length;}
function ensureDeco(){const me=S.me;if(!me)return;const sh=shelf();let ch=false;
  if(!me.decoSeed){me.decoSeed=1;if(!sh.includes('snowglobe'))sh[0]=sh[0]||'snowglobe';ch=true;}
  if(me.decoV!==2){me.decoV=2;const c={};sh.forEach(k=>{if(k)c[k]=(c[k]||0)+1;});for(const k in c)me.inv[k]=(me.inv[k]||0)+c[k];noteDeco('snowglobe',{t:'event',v:'오픈 기념 이벤트'});ch=true;}
  const seen={};sh.forEach((k,i)=>{if(!k)return;seen[k]=(seen[k]||0)+1;if(!ITEMS[k]||seen[k]>(me.inv[k]||0)){sh[i]=null;ch=true;}});
  if(ch)save();}
function shelfPanel(){
  const sh=shelf();const cnt=sh.filter(Boolean).length;
  return `<div class="panel shelf-p"><h3>${hTitle('spark','장식장')} <span class="faint num" style="letter-spacing:0;font-weight:400">${cnt}/${SHELF_N}</span></h3>
    <div class="shelf">${sh.map((k,i)=>{const it=k&&ITEMS[k];return it?`<button class="sh-slot on" data-act="shelf-slot" data-i="${i}" data-tip="${esc(it.name)}" aria-label="${esc(it.name)}">${it.icon||`<img src="${ITEM_IMG}" alt="">`}</button>`:`<button class="sh-slot" data-act="shelf-slot" data-i="${i}" aria-label="빈 칸 · 장식품 올리기"><span class="sh-plus" aria-hidden="true">+</span></button>`;}).join('')}</div>
    <p class="faint sh-hint">선물로 받거나 획득한 '장식품' 아이템을 올려 둘 수 있습니다.</p></div>`;
}
function shelfDlg(i){
  const sh=shelf();const k=sh[i];const x=`<button class="ibtn sm md-x" data-act="closemodal" aria-label="닫기">✕</button>`;
  if(k&&ITEMS[k]){const it=ITEMS[k];return `${x}<div class="sh-dlg"><div class="sh-big">${it.icon||''}</div><span class="chip deco-tag">${it.tag||'장식품'}</span><h3>${esc(it.name)}</h3><p>${esc(it.desc)}</p>${decoSrcText(k)?`<p class="sh-src">${esc(decoSrcText(k))}</p>`:''}
    <div class="row" style="justify-content:center"><button class="btn btn-sm" data-act="shelf-take" data-i="${i}">장식장에서 내리기</button></div></div>`;}
  const own=Object.entries(S.me.inv).filter(([id,n])=>ITEMS[id]&&ITEMS[id].type==='deco'&&n-shelfCount(id)>0).map(([id,n])=>[id,n-shelfCount(id)]);
  return `${x}<h3 class="sh-ttl">장식품 올리기</h3>${own.length?`<div class="list">${own.map(([id,n])=>`<button class="li clickable sh-pick" data-act="shelf-place" data-i="${i}" data-id="${id}"><span class="sh-pi">${ITEMS[id].icon||''}</span><div class="t"><b>${esc(ITEMS[id].name)}</b><small>×${n}</small></div></button>`).join('')}</div>`:'<p class="empty">올릴 수 있는 장식품이 없습니다. 선물이나 보상으로 받은 장식품이 여기에 나옵니다.</p>'}`;
}
function bondsPanel(){
  const bonds=Object.entries(S.bonds||{}),rq=S.bondReq||{in:{},out:{}};const lover=bonds.find(([,b])=>b.type==='lover');const others=bonds.filter(([,b])=>b.type!=='lover');const btab=BTABS.includes(S.sel.btab)?S.sel.btab:'all';const list=others.filter(([,b])=>btab==='all'||b.type===btab).sort((a,b)=>BTABS.indexOf(a[1].type)-BTABS.indexOf(b[1].type)||a[1].since-b[1].since);const pages=Math.max(1,Math.ceil(list.length/BPER));const bpg=Math.min(S.sel.bpage||0,pages-1);const shown=list.slice(bpg*BPER,bpg*BPER+BPER);const inn=Object.entries(rq.in||{}),out=Object.entries(rq.out||{});
  return `<div class="panel"><h3>${hTitle('star','관계')} <span class="faint num" style="letter-spacing:0;font-weight:400">${bonds.length}</span></h3>
    ${inn.length?`<div class="bsec"><span class="faint" style="font-size:12px">받은 신청</span>${inn.map(([n,r])=>`<div class="brow2">${bot(n)?sigil(bot(n).job,'sm'):''}<span class="bt"><b>${esc(n)}</b><span class="bchip" style="--bc:${BOND[r.type].c}">${BOND[r.type].n}</span></span><span class="row" style="gap:4px"><button class="btn btn-sm btn-primary" data-act="bond-accept" data-name="${esc(n)}">수락</button><button class="btn btn-sm btn-ghost" data-act="bond-decline" data-name="${esc(n)}">거절</button></span></div>`).join('')}</div>`:''}
    ${lover?`<div class="blover">${bondRow(lover)}</div>`:''}
    <div class="mtabs btabs" role="tablist">${BTABS.map(k=>`<button role="tab" data-act="bond-tab" data-tab="${k}" aria-selected="${btab===k}" style="--bc:${k==='all'?'var(--steel-hi)':BOND[k].c}">${k==='all'?'전체':BOND[k].n} <span class="num faint">${k==='all'?others.length:others.filter(([,b])=>b.type===k).length}</span></button>`).join('')}</div>
    ${list.length?shown.map(bondRow).join('')+(pages>1?`<div class="bpager">${Array.from({length:pages},(_,k)=>`<button class="${k===bpg?'on':''}" data-act="bond-page" data-p="${k}" aria-label="${k+1}페이지" ${k===bpg?'aria-current="page"':''}>${k+1}</button>`).join('')}</div>`:''):`<p class="empty">${btab==='all'?'맺은':BOND[btab].n} 관계가 없습니다. 채팅이나 접속자 목록에서 이름을 눌러 관계를 신청해 보세요.</p>`}
    ${out.length?`<div class="bsec"><span class="faint" style="font-size:12px">보낸 신청 · 응답 대기</span>${out.map(([n,r])=>`<div class="brow2"><span class="bt"><b>${esc(n)}</b><span class="bchip" style="--bc:${BOND[r.type].c}">${BOND[r.type].n}</span></span><button class="btn btn-sm btn-ghost" data-act="bond-cancel" data-name="${esc(n)}">취소</button></div>`).join('')}</div>`:''}</div>`;
}
function bondAsk(name){
  const cur=bondOf(name),pend=(S.bondReq&&S.bondReq.out&&S.bondReq.out[name]);
  const hasLover=Object.values(S.bonds||{}).some(b=>b.type==='lover')||Object.entries((S.bondReq&&S.bondReq.out)||{}).some(([n,r])=>r.type==='lover'&&n!==name);
  modal(`<div class="row" style="justify-content:space-between"><h3>관계 신청 · ${esc(name)}</h3><button class="btn btn-sm btn-ghost" data-act="closemodal">닫기</button></div>
    <p class="muted" style="font-size:13px">상대가 수락해야 관계가 맺어집니다. 맺은 관계는 서로의 접속자 목록과 캐릭터 페이지에 표시됩니다.</p>
    ${cur?`<p>지금 관계 · ${bondChip(name)}</p><p class="faint" style="font-size:12px">다른 관계로 바꾸려면 새로 신청하세요. 상대가 수락하면 바뀝니다.</p>`:''}
    ${pend?`<p class="reason" style="font-size:13px">이미 ${BOND[pend.type].n} 신청을 보내 응답을 기다리는 중입니다.</p>`:''}
    <div class="bpick">${Object.entries(BOND).map(([k,t])=>{const dis=(k==='lover'&&hasLover&&!(cur&&cur.type==='lover'))||(cur&&cur.type===k);return `<button class="bopt" style="--bc:${t.c}" data-act="bond-send" data-name="${esc(name)}" data-type="${k}" ${dis||pend?'disabled':''}>${t.n}${k==='lover'&&hasLover&&!(cur&&cur.type==='lover')?'<small>연인은 한 명만</small>':''}</button>`;}).join('')}</div>`);
}
function bondResolve(name,ok){
  const rq=S.bondReq.out[name];if(!rq)return;delete S.bondReq.out[name];
  if(ok&&rq.type==='lover'&&Object.entries(S.bonds||{}).some(([n,b])=>b.type==='lover'&&n!==name)){notify(`이미 연인이 있어 ${name}님과의 연인 신청은 취소되었습니다.`,'warn');save();if(S.route==='character')render();return;}
  if(ok){S.bonds=S.bonds||{};S.bonds[name]={type:rq.type,since:now()};notify(`${name}님이 ${BOND[rq.type].n} 관계를 수락했습니다.`,'good');}
  else notify(`${name}님이 관계 신청을 정중히 거절했습니다.`,'warn');
  save();if(S.route==='character')render();
}
/* ───────── 칭호 ───────── */
const TCAT={normal:'일반',combat:'전투',life:'생활',legend:'전설'};
const st=k=>(S.stats&&S.stats[k])||0;
const kills=id=>((S.stats&&S.stats.kills)||{})[id]||0;
const T=(id,cat,name,desc,key,goal,opt)=>({id,cat,name,desc,key,goal,...(opt||{})});
const TITLES=[
  T('t_q1','normal','첫 발걸음','퀘스트를 처음으로 완료','quests',1),
  T('t_q10','normal','의뢰 해결사','퀘스트 10회 완료','quests',10),
  T('t_q30','normal','신전의 단골','퀘스트 30회 완료','quests',30),
  T('t_ge1','normal','주머니가 두둑','골드 누적 획득 1,000','goldEarned',1000),
  T('t_ge10','normal','황금 손','골드 누적 획득 10,000','goldEarned',10000),
  T('t_gs1','normal','큰손','골드 누적 사용 1,000','goldSpent',1000),
  T('t_gs5','normal','탕진의 미학','골드 누적 사용 5,000','goldSpent',5000),
  T('t_c50','normal','수다쟁이','채팅 50회','chats',50),
  T('t_c300','normal','라니아케아 확성기','채팅 300회','chats',300),
  T('t_gf5','normal','다정한 이웃','선물 보내기 5회','giftsSent',5),
  T('t_gf30','normal','라니아케아 산타','선물 보내기 30회','giftsSent',30),
  T('t_gr10','normal','받는 기쁨','선물 받기 10회','giftsRecv',10),
  T('t_ls10','normal','편지 쓰는 블레서','편지 보내기 10회','lettersSent',10),
  T('t_ls50','normal','우체국장','편지 보내기 50회','lettersSent',50),
  T('t_lr20','normal','인기쟁이','편지 받기 20회','lettersRecv',20),
  T('t_lr100','normal','팬레터 수집가','편지 받기 100회','lettersRecv',100),
  T('t_w1','combat','첫 승리','레이드 첫 승리','raidsWon',1),
  T('t_w20','combat','노련한 탐사대원','레이드 승리 20회','raidsWon',20),
  T('t_kf','combat','고목 벌채꾼','변이된 숲의 파수꾼 처치 10회',null,10,{get:()=>kills('forest')}),
  T('t_kt','combat','추적자의 추적자','블라스파미아 추적자 처치 10회',null,10,{get:()=>kills('tracker')}),
  T('t_kg','combat','봉인의 파수꾼','백야의 신전 봉인 수호자 처치',null,1,{get:()=>kills('guardian')}),
  T('t_cr','combat','치명적인','크리티컬 30회','crits',30),
  T('t_dm','combat','파괴의 화신','누적 대미지 10,000','damage',10000),
  T('t_hl','combat','생명의 손길','누적 회복 3,000','healing',3000),
  T('t_rv','combat','되살리는 자','부활 10회','revives',10),
  T('t_fw','combat','불굴','쓰러진 채로 레이드 승리 5회','fallenWins',5),
  T('t_bw','combat','보스 헌터','보스 출현 중 레이드 승리 3회','bossWins',3),
  T('t_d7','life','개근 블레서','접속일 7일',null,7,{get:()=>((S.stats&&S.stats.days)||[]).length}),
  T('t_d30','life','터줏대감','접속일 30일',null,30,{get:()=>((S.stats&&S.stats.days)||[]).length}),
  T('t_buy','life','보급소 단골','신전 보급소 구매 10회','purchases',10),
  T('t_dq','life','일일 의뢰 장인','일일 의뢰 30회 완료','dailies',30),
  T('t_col','life','수집가','서로 다른 아이템 8종 획득',null,8,{get:()=>((S.stats&&S.stats.itemKinds)||[]).length}),
  T('t_adv','life','새로운 부름','★ 상위 클래스로 전직',null,1,{get:()=>CLASSES[S.me.job].tier===2?1:0}),
  T('t_pt','life','거울 앞의 블레서','캐릭터 이미지 설정','portraitSet',1),
  T('t_just','life','정의로운','숨겨진 칭호 · 뒷골목에서 도난당한 골드 되찾기',null,1,{hidden:true,get:()=>(S.me&&S.me.justice)||0}),
  T('t_angler','life','강태공','숨겨진 칭호 · 낚시 누적 100시간','fishMin',6000,{hidden:true}),
  ...Object.keys(LANDS).map(l=>T('t_chat_'+l,'life',`${villageName(l)}의 수다쟁이`,`숨겨진 칭호 · ${villageName(l)} 마을 사람들에게 300번 말 걸기`,null,300,{hidden:true,get:()=>((S.me&&S.me.vilTotal||{})[l]||0)})),
  ...['meadow','sea','frost'].map(l=>T('t_fk_'+l,'life',`${villageName(l)}의 낚시왕`,`${LANDS[l]}(${villageName(l)}) 주간 낚시 랭킹 1위`,null,1,{get:()=>S.me&&(S.me.fishKingLand||{})[l]?1:0})),
  T('t_fishking','life','대륙을 낚은','숨겨진 칭호 · 에우도라·벤테·칼리로에의 낚시왕 칭호를 모두 모으기',null,3,{hidden:true,get:()=>['meadow','sea','frost'].filter(l=>S.me&&(S.me.fishKingLand||{})[l]).length}),
  T('t_gambler','life','도박꾼','달팽이 레이스 3페이즈 연속 우승','snailTriple',1),
  T('t_snailking','life','달팽이의 왕','달팽이 레이스 3페이즈 연속 우승 5회','snailTriple',5),
  T('t_house','life','내 집 마련의 꿈','주간 행운권 1등 당첨','lotto1',1),
  T('t_vip','life','골든 오아시스 VIP','카지노에서 누적 1,000,000골드 사용','casinoSpent',1000000),
  T('t_kkm','legend','까맥귀','모든 블레서 중 골드 획득량 1위인 사람에게 주어지는 칭호. 과거 마지막 레이드 버프로 골드 획득 버프를 뽑은 유저를 기념한다. 1위를 내주면 칭호도 넘어간다.',null,1,{rank:true}),
  T('t_wn','legend','백야의 정복자','봉인 수호자 10회 처치',null,10,{get:()=>kills('guardian')}),
  T('t_max','legend','블레셋의 전설','최대 레벨 달성',null,1,{get:()=>S.me.level>=cfg().levelCap?1:0}),
  T('t_all','legend','신들의 총애','일반·전투·생활 칭호를 각각 5개 이상 획득',null,3,{get:()=>['normal','combat','life'].filter(c=>TITLES.filter(t=>t.cat===c&&hasTitle(t.id)).length>=5).length})
];
function goldBoard(){const all=[...S.bots.map(b=>({name:b.name,v:b.goldEarned||0})),{name:S.me.name,v:st('goldEarned')}];return all.sort((a,b)=>b.v-a.v);}
function titleProgress(t){
  if(t.rank){const bd=goldBoard();const top=bd.find(x=>x.name!==S.me.name);return {cur:st('goldEarned'),goal:(top?top.v:0)+1,met:bd[0].name===S.me.name&&st('goldEarned')>0,text:`내 획득량 ${st('goldEarned').toLocaleString('ko-KR')} · 현재 1위 ${esc(bd[0].name)} ${bd[0].v.toLocaleString('ko-KR')}`};}
  const cur=t.get?t.get():st(t.key);return {cur,goal:t.goal,met:cur>=t.goal};
}
function ownTitle(id){return !!(S.titles&&S.titles.owned&&S.titles.owned[id]);}
function hasTitle(id){return isAdmin()||ownTitle(id);}
function checkTitles(){
  if(!S.me)return;S.titles=S.titles||{owned:{},equip:null};let changed=false;
  for(const t of TITLES){const pr=titleProgress(t);
    if(pr.met&&!ownTitle(t.id)){S.titles.owned[t.id]=now();changed=true;notify(`새 칭호 획득 · ${t.name}`,'good');}
    else if(t.rank&&!pr.met&&ownTitle(t.id)){delete S.titles.owned[t.id];if(S.titles.equip===t.id&&!isAdmin())S.titles.equip=null;changed=true;notify(`${t.name} 칭호가 다른 블레서에게 넘어갔습니다.`,'warn');}}
  if(changed){save();const card=$('.me-card');if(card&&S.route==='main'){const c=card.querySelector('[data-title-chip]');if(c)c.outerHTML=titleChip();}if(S.sel.titleModal)showTitles();}
}
let titleT=null;
function bump(k,n){if(!S.stats)S.stats={};S.stats[k]=(S.stats[k]||0)+(n==null?1:n);clearTimeout(titleT);titleT=setTimeout(checkTitles,300);}
function noteItems(items){if(!items)return;S.stats=S.stats||{};const set=new Set(S.stats.itemKinds||[]);Object.keys(items).forEach(k=>{if(items[k]>0)set.add(k);});S.stats.itemKinds=[...set];}
function titleById(id){return TITLES.find(t=>t.id===id);}
function titleChip(){
  const t=S.titles&&S.titles.equip&&titleById(S.titles.equip)&&hasTitle(S.titles.equip)?titleById(S.titles.equip):null;const n=isAdmin()?TITLES.length:Object.keys((S.titles||{}).owned||{}).length;
  return `<button class="title-chip ${t?'tc-'+t.cat:'tc-none'}" data-act="titles" data-title-chip aria-label="칭호 관리 · 보유 ${n}개">${t?esc(t.name):'칭호 선택'}</button>`;
}
function botTitle(name){const r=seedRnd('title'+name)();const pool=TITLES.filter(t=>t.cat!=='legend');return r<0.25?null:pool[Math.floor(r*pool.length)%pool.length];}
function showTitles(){
  S.sel.titleModal=true;checkTitlesQuiet();
  const tab=S.sel.titleTab||'normal';const eq=S.titles.equip;
  const only=!!S.sel.titleOwnedOnly;
  const list=TITLES.filter(t=>t.cat===tab&&(!only||hasTitle(t.id)));
  const cnt=c=>TITLES.filter(t=>t.cat===c&&hasTitle(t.id)).length+'/'+TITLES.filter(t=>t.cat===c).length;
  modal(`<div class="row" style="justify-content:space-between"><h3 class="t-h">칭호${isAdmin()?' <span class="chip warn" style="font-size:11px;vertical-align:2px">운영자 · 전체 사용 가능</span>':''}</h3><div class="row" style="gap:10px"><span class="t-own"><span>보유한 칭호만</span><button class="switch" role="switch" aria-checked="${only}" data-act="title-own" aria-label="보유한 칭호만 보기"><span class="knob"></span><span class="sw-t">${only?'ON':'OFF'}</span></button></span><button class="btn btn-sm btn-ghost" data-act="titles-close">닫기</button></div></div>
    <div class="mtabs" role="tablist">${Object.entries(TCAT).map(([k,l])=>`<button role="tab" data-act="title-tab" data-tab="${k}" aria-selected="${tab===k}" class="${k==='legend'?'tt-legend':''}">${l} <span class="num faint">${cnt(k)}</span></button>`).join('')}</div>
    <div class="tlist">${list.length?'':`<p class="empty" style="padding:18px 2px">${only?'이 분류에서 보유한 칭호가 없습니다.':'칭호가 없습니다.'}</p>`}${list.map(t=>{const own=hasTitle(t.id);const pr=titleProgress(t);const pc=Math.min(100,pr.goal?pr.cur/pr.goal*100:0);
      if(t.hidden&&!own)return `<div class="trow"><div class="t"><b class="tn">???</b> <span class="chip dim">히든</span><small>숨겨진 칭호입니다. 조건을 달성하면 공개됩니다.</small></div><span class="chip dim">미획득</span></div>`;
      return `<div class="trow ${own?'own':''} ${eq===t.id?'eq':''}"><div class="t"><b class="tn tc-${t.cat}">${esc(t.name)}</b>${t.hidden?' <span class="chip warn">히든</span>':''}${t.rank?' <span class="chip warn">순위 칭호</span>':''}<small>${esc(t.desc)}</small>
        ${own?'':(t.rank?`<small class="num">${pr.text}</small>`:`<div class="tprog"><div class="bar"><i style="width:${pc}%"></i></div><span class="num">${Math.min(pr.cur,pr.goal).toLocaleString('ko-KR')}/${pr.goal.toLocaleString('ko-KR')}</span></div>`)}</div>
        ${own?(eq===t.id?`<button class="btn btn-sm" data-act="title-equip" data-id="">해제</button>`:`<button class="btn btn-sm btn-primary" data-act="title-equip" data-id="${t.id}">장착</button>`):'<span class="chip dim">미획득</span>'}</div>`;}).join('')}</div>`);
  const mm=$('.modal');if(mm)mm.classList.add('wide');
}
function checkTitlesQuiet(){S.titles=S.titles||{owned:{},equip:null};}
/* ───────── 대륙 · 날씨 · 전광판 ───────── */
const WORLD={
  gates:[['얼음 협곡','혹한의 땅','협곡에 자리한 마을. 인구가 적고 다소 폐쇄적이다.'],['적막의 숲','혹한의 땅','비교적 온난한 침엽수림. 숲 한가운데 고대 신들의 제단이 있으며, 프리스트는 이곳에서 신들의 부름을 받는다.'],
    ['바위 산맥','바위의 땅','산맥 아래 마을. 고대 무술의 신 발레티의 신전이 있으며, 인파이터는 이곳에서 부름을 받는다.'],['소금 사막','소금의 땅','대륙 소금의 90%를 생산하는 원산지. 근처 마을들은 부유하고 여유롭다.'],
    ['황혼녘 강가','초원의 땅','황혼이 아름다운 강가 마을. 고대 장악의 신 아움타주의 신전이 있으며, 디펜더는 이곳에서 부름을 받는다.'],['오아시스 마을','소금의 땅','고대 공학 문명의 발상지. 문명의 신 셀로나의 신전이 있으며, 슈터는 이곳에서 부름을 받는다.'],
    ['붉은 모래사막','작열의 땅','붉은 모래로 이루어진 사막. 불의 신 아발라가의 신전이 있으며, 메이지는 이곳에서 부름을 받는다.'],['독안개 마을','늪의 땅','고대 바다뱀이 내뿜는 독안개가 늘 끼어 있어 독에 면역이 있는 종족만 산다.'],
    ['항구 도시','항구','무역의 중심지. 블레서들도 장터에서 장사를 한다.'],['녹투성이 호수','블라스파미아','신대륙 블라스파미아의 워프게이트. 녹물 호수와 독기 때문에 되도록 가지 않는 것이 좋다.']],
  dungeons:[['순례자의 길',10,'1-4','신에게 가까이 가기 위해선 최초의 시련을 극복하시오.','바위의 땅과 소금의 땅 경계, 태초의 신이 걸었다는 길. 영웅들이 거치는 필수 관문이다.'],
    ['무너진 바위 동굴',20,'1-4','수련을 원하는 자, 동굴 속에서 쌓아라.','바위 산맥의 무너진 동굴. 여러 비기가 숨겨져 있다고 한다.'],
    ['비명 지르는 풀숲',40,'1-4','그 풀숲에선 아직도 비명 같은 소리가 들린다오.','황혼녘 강가 마을의 실종 사건. 풀숲에 내린 저주 때문이라는 소문이 있다.'],
    ['갈증의 호수',50,'1-4','아무리 목을 축여도 나아지지 않는 갈증이 그대를 파멸로 이끌리라.','소금 사막 근처 호숫가의 이상한 구조물 이후 호수의 염분이 높아지기 시작했다.'],
    ['황금 뿌리 제단',60,'1-4','바위와 자갈사막의 지하에는 보물이 묻힌 고대 문명 도시가 있다던데?','오아시스 마을 근처 황금 도시의 소문. 찾아 떠난 모험가 대부분이 돌아오지 못했다.'],
    ['바다뱀의 고리',70,'1-12','바다뱀은 오랜 세월을 살았던 만큼 굉장히 강하고 포악하다네.','고대 바다뱀이 똬리를 튼 산. 늪의 땅에 몬스터가 급증하는 이상현상이 일어나고 있다.'],
    ['인어의 속삭임',80,'1-12','현혹되지 않을 굳은 심지가 필요해요.','항구에서 떨어진 바다. 기이한 부름에 이끌려 사람들이 사라지고 있다.'],
    ['거울 감옥',90,'1-12','호수는 가장 두려운 것을 비추나니.','혹한의 땅의 얼어붙은 호수. 그 아래에 끔찍한 죄수들이 갇혀 있다고 한다.'],
    ['백야의 신전',100,'12-22','그 신전의 문을 열면 다시 돌아오지 못하리라.','고대 혼돈의 신이 잠든 관. 어둠의 땅 블라스파미아에서 유일하게 백색의 빛을 유지하는 지하 신전.']],
  fields:[['알라로사',70,'작열의 땅의 수풀 우거진 섬. 신비한 동물과 고대 문물이 숨겨져 있다.'],['영원의 사막',80,'모래 속에 파묻힌 보물상자를 찾을 수 있다는 사막.'],['비단길 선착장',90,'여러 곳에서 들여온 진귀한 보물을 만날 수 있는 선착장.'],['폐광 비밀 통로',100,'혹한의 신이 내린 뒤 방치된 북쪽 폐광의 비밀 통로.']]
};
const REGIONS=[
  {name:'혹한의 땅',w:[['snow',-18,-6],['blizzard',-26,-12],['clear',-12,-2],['fog',-10,-3]]},
  {name:'바위의 땅',w:[['clear',8,18],['cloud',5,14],['wind',3,12]]},
  {name:'소금의 땅',w:[['clear',24,35],['heat',32,41],['wind',20,30],['rain',18,26]]},
  {name:'초원의 땅',w:[['clear',14,24],['cloud',12,20],['rain',10,17]]},
  {name:'작열의 땅',w:[['heat',36,48],['clear',30,40],['storm',28,36]]},
  {name:'늪의 땅',w:[['fog',16,24],['rain',15,22],['storm',14,20]]},
  {name:'블라스파미아',w:[['dark',-2,8],['storm',0,10],['fog',2,9]]},
  {name:'바다의 땅',w:[['clear',16,24],['rain',13,19],['wind',14,22],['fog',12,18]]}
];
const WNAME={clear:'맑음',cloud:'흐림',rain:'비',snow:'눈',blizzard:'눈보라',fog:'안개',wind:'강풍',heat:'폭염',storm:'뇌우',dark:'암운'};
const WICON={
  clear:'<circle cx="8" cy="8" r="3.2" fill="currentColor"/><path d="M8 1.6v1.6M8 12.8v1.6M1.6 8h1.6M12.8 8h1.6M3.5 3.5l1.1 1.1M11.4 11.4l1.1 1.1M3.5 12.5l1.1-1.1M11.4 4.6l1.1-1.1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>',
  cloud:'<path d="M4.6 12.4h7a2.8 2.8 0 0 0 .2-5.6A3.6 3.6 0 0 0 4.9 7.6a2.4 2.4 0 0 0-.3 4.8z" fill="currentColor"/>',
  rain:'<path d="M4.6 9.4h7a2.6 2.6 0 0 0 .2-5.2A3.4 3.4 0 0 0 5 5a2.2 2.2 0 0 0-.4 4.4z" fill="currentColor"/><path d="M5.4 11.2l-.8 2.2M8.2 11.2l-.8 2.2M11 11.2l-.8 2.2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>',
  snow:'<path d="M4.6 9.4h7a2.6 2.6 0 0 0 .2-5.2A3.4 3.4 0 0 0 5 5a2.2 2.2 0 0 0-.4 4.4z" fill="currentColor"/><circle cx="5.2" cy="12" r=".9" fill="currentColor"/><circle cx="8" cy="13.4" r=".9" fill="currentColor"/><circle cx="10.8" cy="12" r=".9" fill="currentColor"/>',
  blizzard:'<path d="M2 5h8.5a1.8 1.8 0 1 0-1.8-1.8M2 8.2h11a1.8 1.8 0 1 1-1.8 1.8M2 11.4h6" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><circle cx="12" cy="13.4" r=".9" fill="currentColor"/>',
  fog:'<path d="M2.4 5.2h11.2M1.6 8h12.8M2.8 10.8h10.4M4.4 13.4h7.2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>',
  wind:'<path d="M1.8 6h9a2 2 0 1 0-2-2M1.8 9.4h11.4a1.9 1.9 0 1 1-1.9 1.9M1.8 12.4h5" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>',
  heat:'<circle cx="8" cy="7" r="3.4" fill="currentColor"/><path d="M3.4 13.2c1-.8 2-.8 3 0s2 .8 3 0 2-.8 3 0" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>',
  storm:'<path d="M4.6 8.6h7a2.6 2.6 0 0 0 .2-5.2A3.4 3.4 0 0 0 5 4.2a2.2 2.2 0 0 0-.4 4.4z" fill="currentColor"/><path d="M8.6 9.2 6.8 12h2.2l-1.4 2.6" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"/>',
  dark:'<path d="M10.8 2.6a5.4 5.4 0 1 0 2.6 9.2 4.4 4.4 0 0 1-2.6-9.2z" fill="currentColor"/><circle cx="12.2" cy="4.2" r=".7" fill="currentColor"/>'
};
function seedRnd(str){let h=2166136261;for(const c of str){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return ()=>{h=Math.imul(h^(h>>>15),2246822507);h=Math.imul(h^(h>>>13),3266489909);return ((h^=h>>>16)>>>0)/4294967296;};}
function kstParts(t=now()){const d=new Date(t+9*3600e3);return {y:d.getUTCFullYear(),mo:d.getUTCMonth()+1,d:d.getUTCDate(),wd:'일월화수목금토'[d.getUTCDay()],h:d.getUTCHours(),mi:d.getUTCMinutes(),s:d.getUTCSeconds(),key:d.toISOString().slice(0,10)};}
function landW(land){const w=todayWeather().find(x=>x.name===LANDS[land]);return w?w.w:'clear';}
const GUILD_HQ={craft:'ember',cook:'sea',alch:'salt'};
function isRain(w){return w==='rain'||w==='storm';}function isSnow(w){return w==='snow'||w==='blizzard';}
function guildRain(k){return isRain(landW(GUILD_HQ[k]));}
const FOG_LOST=0.35,RAIN_FAIL=0.05,SNOW_STUCK=0.25;
function wDebuffs(land){const w=landW(land);const L=[];
  if(w==='fog')L.push(['fog','안개',`탐색 실패 확률 +${Math.round(FOG_LOST*100)}%`]);
  if(isSnow(w))L.push(['snow','눈보라 경보','이 지역에 만신전이 열리면 이동 제한']);
  if(isRain(w)){const g=Object.keys(GUILD_HQ).find(k=>GUILD_HQ[k]===land);L.push(['rain','미끄러짐',g?`${PROF[g].job} 길드 본진 · ${g==='craft'?'제작·강화':PROF[g].n} 실패 확률 +5%`:'길 바닥이 미끄럽다']);}
  return L;}
function wDebuffHTML(land){const L=wDebuffs(land);return L.length?`<div class="wdb">${L.map(([k,n,t])=>`<span class="wdb-c wdb-${k}"><b>${n}</b> ${t}</span>`).join('')}</div>`:'';}
function todayWeather(){const k=kstParts().key;return REGIONS.map(r=>{const rn=seedRnd(k+r.name);const [w,lo,hi]=r.w[Math.floor(rn()*r.w.length)];return {name:r.name,w,t:Math.round(lo+rn()*(hi-lo))};});}
const pad2=n=>String(n).padStart(2,'0');
const GAME_YEAR_OFFSET=28;
function gameDate(p){const y=p.y+GAME_YEAR_OFFSET;const wd='일월화수목금토'[new Date(Date.UTC(y,p.mo-1,p.d)).getUTCDay()];return `${y}.${pad2(p.mo)}.${pad2(p.d)} (${wd})`;}
function clockText(){const p=kstParts();return `${pad2(p.h)}:${pad2(p.mi)}:${pad2(p.s)}`;}
function skyBar(){
  const p=kstParts();const ws=todayWeather();
  return `<div class="skybar" data-sky="${p.key}"><div class="sky-l"><span class="sky-lbl">오늘의 대륙 날씨<span class="sky-help" tabindex="0" aria-label="날씨 디버프 도움말"><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.6" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M6.2 6.2a1.9 1.9 0 1 1 2.6 1.7c-.5.2-.8.6-.8 1.1v.4" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><circle cx="8" cy="11.4" r=".8" fill="currentColor"/></svg><span class="sky-tip" role="tooltip"><b>날씨 디버프</b>
<span><i class="t-fog">안개</i> 그 지역 탐색 시 35% 확률로 길을 잃어 보상 없이 횟수만 줄어듭니다.</span>
<span><i class="t-snow">눈 · 눈보라</i> 그 지역에 만신전이 열리면 이동 범위가 3×3으로 고정되고, 이동할 때 25% 확률로 발이 묶입니다.</span>
<span><i class="t-rain">비 · 뇌우</i> 길드 본진에 비가 오면 그 길드의 작업 실패 확률이 5% 오릅니다. 대장장이(작열의 땅) 제작·강화 · 요리(바다의 땅) · 연금술(소금의 땅)</span></span></span></span>
    <ul class="sky-list">${ws.map(x=>`<li class="w-${x.w}" title="${x.name} · ${WNAME[x.w]} ${x.t}°C"><svg viewBox="0 0 16 16" aria-hidden="true">${WICON[x.w]}</svg><span class="sky-n">${x.name}</span><span class="sky-t num">${WNAME[x.w]} ${x.t}°</span></li>`).join('')}</ul></div>
    <div class="sky-r"><span class="sky-date">${gameDate(p)}</span><span class="sky-clock num" data-clock>${clockText()}</span></div></div>`;
}
function activeEvents(){const t=now();S.events=(S.events||[]).filter(e=>e.until>t);return S.events;}
function eventFor(mid){return activeEvents().find(e=>e.kind==='boss'&&e.link==='monster:'+mid);}
const EVKIND={boss:'보스 출현',event:'이벤트',maint:'점검'};
function ticker(){
  const ev=activeEvents().slice().sort((a,b)=>a.until-b.until);
  if(!ev.length)return `<div class="ticker calm" data-ticker role="status"><span class="tk-dot" aria-hidden="true"></span><span class="tk-calm">평화롭습니다.</span></div>`;
  const f=v=>v&&String(v).trim()?esc(v):'-';
  const end=t=>{const p=kstParts(t);return `${pad2(p.h)}:${pad2(p.mi)}까지`;};
  const one=e=>`<b class="tk-kind k-${e.kind}">[${EVKIND[e.kind]||'알림'}]</b> ${f(e.title)}<span class="tk-sep">｜</span>${f(e.loc)}<span class="tk-sep">｜</span>${f(e.reward)}<span class="tk-sep">｜</span>${end(e.until)}`;
  const line=ev.map(one).join('<span class="tk-gap"></span>');
  const len=ev.reduce((a,e)=>a+(e.title||'').length+(e.loc||'').length+(e.reward||'').length+24,0);
  const link=ev.find(e=>e.link);
  return `<div class="ticker on k-${ev[0].kind}" data-ticker role="status"><div class="tk-view"><div class="tk-run" style="animation-duration:${Math.max(14,Math.round(len*0.32+10))}s">${line}</div></div>${link?`<button class="btn btn-sm tk-go" data-act="link" data-link="${esc(link.link)}">바로가기</button>`:'<span class="tk-nolink" aria-label="바로가기 없음">-</span>'}</div>`;
}
function refreshTicker(){const el=$('[data-ticker]');if(el)el.outerHTML=ticker();}
function spawnBoss(m,mins,by){
  const loc=pick(WORLD.gates.filter(g=>g[1]!=='항구'))[0];
  const e={id:uid('ev'),kind:'boss',title:m.name,loc:`${loc} 인근`,land:(MAP_SPOTS.find(x=>x[1]==='gate'&&x[2]===loc)||[])[3],reward:'경험치·골드 1.5배',link:'monster:'+m.id,until:now()+mins*60000,by};
  (S.events=S.events||[]).push(e);notify(`[보스 출현] ${m.name} · ${e.loc}`,'warn');refreshTicker();save();return e;
}

/* ───────── 직업 변경권 (임시 · 테스트용) ───────── */
Object.assign(ITEMS,{jobticket:{name:'직업 변경권',type:'use',tag:'테스트용',jobChange:true,price:0,desc:'[임시 테스트 아이템] 사용하면 원하는 클래스로 바로 바꾼다. 상위 클래스는 전직 레벨 이상일 때만 고를 수 있다. 레벨·장비·인벤토리는 그대로.'}});
const JOBTICKET_GIFT=3;
function jobTicketDlg(){const me=S.me,adv=cfg().jobAdvanceLevel;
  const btn=k=>{const c=CLASSES[k];const lock=c.tier===2&&me.level<adv;const cur=k===me.job;
    return `<button class="jc-b ${cur?'cur':''}" data-act="jc-pick" data-job="${k}" ${lock||cur?'disabled':''}>${sigil(k,'sm')}<span><b>${c.tier===2?'★ ':''}${esc(c.name)}</b><small>${ROLE[c.role]} · ${isMagic(k)?'마력':'공격력'}${cur?' · 현재':lock?` · LV${adv}부터`:''}</small></span></button>`;};
  const T1=Object.keys(CLASSES).filter(k=>CLASSES[k].tier===1);
  return `<button class="ibtn sm md-x" data-act="closemodal" aria-label="닫기">✕</button><h3 class="sh-ttl">직업 변경권</h3>
    <p class="faint" style="font-size:12.5px;margin:0 0 12px">바꿀 클래스를 고르세요. 변경권 1장이 사용됩니다. (보유 ${me.inv.jobticket||0}장)</p>
    <div class="jc-list">${T1.map(k=>`<div class="jc-g">${btn(k)}${CLASSES[k].adv.map(btn).join('')}</div>`).join('')}</div>`;}
function jobTicketUse(job){const me=S.me;const c=CLASSES[job];if(!c||!(me.inv.jobticket>0)||job===me.job)return;
  if(c.tier===2&&me.level<cfg().jobAdvanceLevel){toast(`상위 클래스는 LV${cfg().jobAdvanceLevel}부터 고를 수 있습니다.`,'warn');return;}
  if(S.battle&&!S.battle.over){toast('전투 중에는 바꿀 수 없습니다.','warn');return;}
  const from=me.job;me.job=job;me.inv.jobticket--;if(!(me.inv.jobticket>0))S.sel.invSel=null;if(c.tier===2)me.advNotice=true;
  logChange('직업 변경권',[{field:me.name,before:CLASSES[from].name,after:c.name}]);setTimeout(checkTitles,0);
  modal('');save();render();toast(`${CLASSES[from].name} → ${c.name}(으)로 바꿨습니다. 맞지 않는 무기는 능력치가 적용되지 않습니다.`,'good');}
if(document.head)document.head.insertAdjacentHTML('beforeend',`<style id="jc-style">.jc-list{display:flex;flex-direction:column;gap:8px}.jc-g{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.jc-b{display:flex;align-items:center;gap:8px;padding:8px;border:1px solid var(--rule-2);border-radius:4px;background:rgba(255,255,255,.02);color:inherit;font:inherit;text-align:left;cursor:pointer}.jc-b small{display:block;font-size:11px;color:var(--muted)}.jc-b:disabled{opacity:.45;cursor:default}.jc-b.cur{opacity:1;border-color:var(--warn)}@media(max-width:520px){.jc-g{grid-template-columns:1fr}}</style>`);

/* ───────── 다음 목표 안내 (메인 화면) ───────── */
function ngStory(){const me=S.me,c=CLASSES[me.job];
  if(c.tier===1&&me.level>=cfg().jobAdvanceLevel){const q=quest('J_'+me.job);if(q&&questStatus(q)!=='done')return {t:'전직',v:q.title,s:questStatus(q)==='active'||questStatus(q)==='claim'?'진행 중':'받을 수 있음',act:`data-act="openquest" data-id="${q.id}"`};}
  const ep=(S.data.quests||[]).filter(q=>q.cat==='epic'&&q.published);
  for(const q of ep){const st=questStatus(q);if(st==='done'||st==='hidden')continue;
    if(st==='locked'&&q.cond&&q.cond.adv&&c.tier===1)break;
    if(st==='locked'){const r=lockReason(q);return {t:'메인 스토리',v:q.title,s:r||'잠김',lock:true,act:`data-act="openquest" data-id="${q.id}"`};}
    return {t:'메인 스토리',v:q.title,s:st==='available'?'수락할 수 있음':st==='claim'?'보상 받기':'진행 중',act:`data-act="openquest" data-id="${q.id}"`};}
  if(c.tier===1&&me.level<cfg().jobAdvanceLevel){const AL=cfg().jobAdvanceLevel,O=ADV_ORIGIN[me.job];
    const top=k=>S.data.monsters.filter(m=>m.published&&mkind(m)===k&&!levelReason(m,me.level)).sort((a,b)=>b.level-a.level)[0];
    const pr=top('party'),dg=top('dungeon');const rec=[pr&&`파티 레이드 ${pr.name}`,dg&&`던전 ${dg.region}`].filter(Boolean).join(' · ');
    return {t:'전직 준비',v:`LV${AL} 전직 시련${O?` · ${O.place}`:''}`,s:`${LV_LEFT(AL)}${rec?` · 추천 ${rec}`:''}`,act:`data-act="ng-raid" data-tab="${pr?'daily':'dungeon'}"`};}
  return {t:'메인 스토리',v:'다음 이야기를 준비 중입니다',s:'곧 업데이트',lock:true};}
function ngHunt(){const L=S.me.level;let land=null;
  for(const k of landOrder()){const b=LAND_BAND[k];const r=EXPLORE.find(x=>x.id===k);if(!b||!r)continue;if(L>=b[0]&&!landLock(r))land=k;}
  if(!land)return null;const ms=S.data.monsters.filter(m=>m.published&&mkind(m)==='field'&&m.region===LANDS[land]&&m.level<=L).map(m=>m.name);
  const nx=landOrder().find(k=>LAND_BAND[k]&&LAND_BAND[k][0]>L);const nr=nx&&EXPLORE.find(x=>x.id===nx);const lock=nr?landLock({...nr,lv:0}):'';
  return {t:'추천 사냥터',v:`${LANDS[land]} · ${villageName(land)}`,s:`${ms.length?ms.join(' · ')+' · ':''}${nx?`다음 지역 ${LANDS[nx]} LV${LAND_BAND[nx][0]}${lock?` (${lock})`:''}`:'최종 지역'}`,act:`data-act="ng-land" data-land="${land}"`};}
function ngGear(){const L=S.me.level;const cur=GEAR_TIER.map((g,i)=>({g,T:i+1})).filter(x=>x.g[2]<=L).pop();const nxt=GEAR_TIER.map((g,i)=>({g,T:i+1})).find(x=>x.g[2]>L);
  const eqT=Math.min(...['weapon','armor','acc'].map(sl=>{const id=(S.me.equip||{})[sl];const it=id&&ITEMS[id];return it&&it.tier||0;}));
  if(cur&&eqT<cur.T){const T=cur.T;const dun=MAP_SPOTS.filter(x=>x[1]==='dungeon').map(x=>monster(x[0])).filter(m=>m&&(m.loot||[]).some(k=>ITEMS[k]&&ITEMS[k].tier===T)).sort((a,b)=>a.level-b.level).map(m=>m.region);
    const pb=Object.entries(PB_GEAR).filter(([,t])=>t===T).map(([id])=>monster(id)).filter(Boolean).map(m=>m.name);const gp=Object.entries(GROUP_GEAR).filter(([,t])=>t===T).map(([id])=>monster(id)).filter(Boolean).map(m=>m.name);
    const from=[...dun.map(n=>`던전 ${n}`),...pb,...gp].slice(0,3).join(' · ');
    return {t:'장비 업그레이드',v:`${cur.g[0]} 장비 (LV${cur.g[2]}+)`,s:from?`얻는 곳 · ${from}`:'지역 던전과 파티 레이드에서 얻을 수 있음',act:`data-act="nav" data-route="battle"`};}
  if(nxt)return {t:'다음 장비',v:`${nxt.g[0]} 장비`,s:`LV${nxt.g[2]}부터 착용 · ${LV_LEFT(nxt.g[2])}`,lock:true};return null;}
const LV_LEFT=n=>`${Math.max(0,n-S.me.level)}레벨 남음`;
function nextGoalHTML(){if(!S||!S.me)return '';const rows=[ngStory(),ngHunt(),ngGear()].filter(Boolean);
  return `<div class="panel ng"><div class="md-lbl"><i class="lbl-d" aria-hidden="true">◆</i>다음 목표</div><div class="ng-list">${rows.map(r=>`<${r.act?'button':'div'} class="ng-row ${r.lock?'lock':''}" ${r.act||''}><span class="ng-t">${esc(r.t)}</span><b class="ng-v">${esc(r.v)}</b><small class="ng-s">${esc(r.s)}</small></${r.act?'button':'div'}>`).join('')}</div></div>`;}
