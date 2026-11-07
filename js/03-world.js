'use strict';
/* 상태 · 저장 · 탐색 · 월드 맵 · 만신전 · 퀘스트 · 파티 */
/* ───────── 상태 ───────── */
/* ───────── 콘텐츠 구성: 탐색 · 필드 사냥 · 개인 던전 · 이벤트 ───────── */
const EXPLORE_MAX=10,RAID_MAX=3,DAILY_Q=3;
const SOLO_TIER={field:[240,27],story:[280,34],dungeon:[300,36]}; /* 체력은 기준 대미지 100% 개편으로 2배 */
function soloStats(tier,L){const [h,a]=SOLO_TIER[tier];return {hp:Math.round(h*(1+0.09*(L-1))),atk:Math.round(a*(1+0.07*(L-1)))};}
function soloMon(o){const L=o.statLevel||o.level;const s=soloStats(o.tier,L);const m={art:'beast',published:true,rev:1,maxLevel:null,min:1,max:1,target:1,roles:{tank:0,dps:0,heal:0},hpScale:0,def:0,
  singleName:'할퀴기',singleMult:1,aoeName:'몰아치기',aoeMult:0.6,aoeEvery:3,dotName:'상처',dotChance:0.3,dotDmg:Math.round(s.atk*0.15),exp:0,gold:0,drops:[],...s,...o};delete m.tier;delete m.statLevel;return m;}
/* 레벨 구간 (상한 99): 지역 8곳이 1–99를 나눠 맡는다 */
const LAND_BAND={meadow:[1,9],rock:[10,19],swamp:[20,29],salt:[30,39],sea:[40,49],ember:[50,64],frost:[65,79],chaos:[80,99]};
const needOf=L=>Math.round(100+50*(L-1)+2*(L-1)*(L-1));
/* LV60부터 필드 경험치를 조금씩 더(+10%/레벨, LV64 이상 ×1.5) — 후반 이야기 사이 사냥 판수 줄이기(2026-11-07) */
function hiExpMul(L){return 1;}  /* (11-07) LV60 필드 보너스 폐지 → 대신 05 끝 xpCut(LV60+ 사냥 경험치 배율) */
const fieldExp=L=>Math.round(needOf(L)/(4+L*0.12)*hiExpMul(L));
const fieldGold=L=>Math.round(10+L*4);
const fieldLv=(land,i)=>{const b=LAND_BAND[land];return b?(i===0?b[0]:Math.round((b[0]+b[1])/2)):1;};
const FIELD_DEF=[
 ['meadow','초원의 땅',1,'herb',[['f_meadow1','들개 무리','beast',{singleName:'물어뜯기',dotName:'출혈',dotChance:0.35}],['f_meadow2','성난 멧돼지','beast',{singleName:'돌진',singleMult:1.1,aoeName:'짓밟기',dotChance:0.15}]]],
 ['rock','바위의 땅',10,'ore',[['f_rock1','바위 도마뱀','beast',{singleName:'꼬리 후려치기',dotName:'석화 침',dotChance:0.3}],['f_rock2','동굴 박쥐 떼','spirit',{aoeName:'초음파',aoeEvery:2,aoeMult:0.5,dotName:'흡혈',dotChance:0.25}]]],
 ['swamp','늪의 땅',20,'venom',[['f_swamp1','독안개 두꺼비','beast',{singleName:'혀 채찍',dotName:'독안개',dotChance:0.5}],['f_swamp2','늪 거머리','beast',{singleName:'달라붙기',dotName:'흡혈',dotChance:0.4}]]],
 ['salt','소금의 땅',30,'salt',[['f_salt1','소금 전갈','beast',{singleName:'집게',dotName:'마비 독침',dotChance:0.45}],['f_salt2','모래 폭풍 정령','spirit',{singleName:'모래 칼날',aoeName:'모래 폭풍',aoeEvery:2,aoeMult:0.5,dotChance:0.2}]]],
 ['ember','작열의 땅',50,'ember',[['f_ember1','화염 도롱뇽','beast',{singleName:'불꽃 혀',dotName:'화상',dotChance:0.45}],['f_ember2','용암 골렘','golem',{singleName:'용암 주먹',singleMult:1.15,aoeName:'분화',dotName:'화상',dotChance:0.15}]]],
 ['frost','혹한의 땅',65,'frost',[['f_frost1','서리 늑대','beast',{singleName:'얼음 송곳니',dotName:'동상',dotChance:0.4}],['f_frost2','얼음 망령','spirit',{singleName:'냉기 손길',aoeName:'서리 폭풍',aoeEvery:2,aoeMult:0.5,dotName:'동상',dotChance:0.2}]]],
 ['sea','바다의 땅',40,'pearl',[['f_sea1','갯바위 집게','beast',{singleName:'집게 찍기',singleMult:1.1,dotName:'찢긴 상처',dotChance:0.25}],['f_sea2','바다 안개 정령','spirit',{singleName:'젖은 손길',aoeName:'해무',aoeEvery:2,aoeMult:0.5,dotName:'익사의 저주',dotChance:0.3}]]],
 ['chaos','블라스파미아',80,'chaos',[['f_chaos1','녹물 망령','spirit',{singleName:'녹물 손톱',dotName:'부식',dotChance:0.45}],['f_chaos2','혼돈 추적견','beast',{singleName:'그림자 송곳니',singleMult:1.1,dotName:'저주 출혈',dotChance:0.3}]]]
];
const DUNGEON_DEF=[
 ['d_pilgrim','순례자의 길','시련의 석상',12,'golem',gearOfTier(2)],
 ['d_cave','무너진 바위 동굴','동굴의 은둔 무승',18,'golem',gearOfTier(2)],
 ['d_grass','비명 지르는 풀숲','저주받은 풀숲의 마녀',8,'spirit',gearOfTier(1)],
 ['d_lake','갈증의 호수','염수의 군주',36,'spirit',gearOfTier(4)],
 ['d_altar','황금 뿌리 제단','황금 뿌리 수호자',60,'golem',gearOfTier(6)],
 ['d_serpent','바다뱀의 고리','고대 바다뱀',27,'beast',gearOfTier(3)],
 ['d_siren','인어의 속삭임','심해의 세이렌',46,'spirit',gearOfTier(5)],
 ['d_mirror','거울 감옥','거울 속 죄수',75,'spirit',gearOfTier(7)]
];
const EXTRA_MONSTERS=[
 ...FIELD_DEF.flatMap(([rid,region,lv0,mat,ms])=>ms.map(([id,name,art,o],fi)=>{const lv=fieldLv(rid,fi);return soloMon({id,name,art,kind:'field',region,level:lv,statLevel:lv+1,tier:'field',desc:`${region}에 나타나는 필드 몬스터.`,
   exp:fieldExp(lv),gold:fieldGold(lv),drops:[[mat,0.6],['potion',0.15]],...o});})),
 ...DUNGEON_DEF.map(([id,dn,name,lv,art,loot])=>soloMon({id,name,art,kind:'dungeon',region:dn,level:lv,tier:'dungeon',loot,desc:`${dn} 깊은 곳에서 도전자를 기다리는 보스.`,singleName:'시련의 일격',aoeName:'파멸의 파동',dotName:'저주',dotChance:0.3})),
 soloMon({id:'st_hound',name:'안개 들개',art:'beast',kind:'story',region:'북쪽 경계',level:1,tier:'story',desc:'탐사대가 사라진 안개 속에서 튀어나온 들개.',singleName:'물어뜯기',dotName:'출혈',dotChance:0.3}),
 soloMon({id:'st_shade',name:'결정의 그림자',art:'spirit',kind:'story',region:'속삭임의 자리',level:3,tier:'story',desc:'검은 결정 조각이 엉겨 붙어 사람의 형상을 한 그림자.',singleName:'검은 손길',aoeName:'속삭임',dotName:'혼돈 침식',dotChance:0.35}),
 soloMon({id:'st_pup',name:'어린 추적자',art:'beast',kind:'story',region:'블라스파미아 경계',level:6,tier:'story',desc:'둥지를 지키려 길을 막아선 어린 추적자.',singleName:'그림자 송곳니',aoeName:'추적의 포효',dotName:'저주 출혈',dotChance:0.3}),
 /* 밸런스 2차(2026-11-07): 만신전 = 가장 어렵게 — 봇 8인 정석 승률 약 45%(균열 체력 ×2·공격 ×2.55, 왕관 ×1.6·×4.0, 지속 피해 그대로) */
 {id:'ev_rift',kind:'event',name:'균열의 사도',art:'spirit',region:'갑자기 열린 균열',published:true,rev:1,
  desc:'하늘이 갈라진 자리에서 내려온 혼돈의 사도. 오래 머물지 않는다.',level:5,maxLevel:null,min:8,max:20,target:8,roles:{tank:2,dps:4,heal:2},
  hp:7200,hpScale:0,atk:510,def:0,singleName:'균열의 창',singleMult:1.0,aoeName:'차원 붕괴',aoeMult:0.6,aoeEvery:3,dotName:'혼돈 낙인',dotChance:0.3,dotDmg:24,
  exp:220,gold:110,drops:[['holywater',0.5],['staff',0.2],['cloak',0.1]]},
 {id:'ev_crown',kind:'event',name:'녹슨 왕관의 망령',art:'spirit',region:'녹투성이 호수',published:true,rev:1,
  desc:'호수 바닥에 가라앉은 옛 왕의 망령. 녹슨 왕관을 쓴 채 물 위로 떠오른다.',level:12,maxLevel:null,min:8,max:20,target:8,roles:{tank:2,dps:4,heal:2},
  hp:10240,hpScale:0,atk:1200,def:0,singleName:'녹슨 왕홀',singleMult:1.0,aoeName:'왕의 호령',aoeMult:0.6,aoeEvery:3,dotName:'녹물 저주',dotChance:0.35,dotDmg:36,
  exp:480,gold:240,drops:[['amulet',0.25],['crest',0.12],['cloak',0.2]]}
];
const ALL_MONSTERS=()=>[...clone(DEFAULT_MONSTERS),...clone(EXTRA_MONSTERS)];
const MAT_ITEMS={
  herb:{name:'초원 약초',type:'mat',desc:'초원의 땅에서 자라는 약초. 회복약의 재료가 된다.',price:10},
  ore:{name:'바위 원석',type:'mat',desc:'바위의 땅에서 캐낸 단단한 원석.',price:14},
  venom:{name:'늪 독샘',type:'mat',desc:'늪의 생물에게서 얻은 독샘. 다루기 조심스럽다.',price:20},
  salt:{name:'소금 결정',type:'mat',desc:'소금의 땅에서 얻은 투명한 결정.',price:26},
  ember:{name:'불씨 조각',type:'mat',desc:'식지 않는 작열의 땅의 불씨.',price:32},
  frost:{name:'서리 결정',type:'mat',desc:'녹지 않는 혹한의 땅의 서리.',price:40},
  pearl:{name:'바다 진주',type:'mat',desc:'바다의 땅 갯바위에서 건진 은빛 진주.',price:30},
  chaos:{name:'혼돈의 파편',type:'mat',desc:'블라스파미아에서 흘러나온 혼돈의 조각.',price:60}
};
Object.assign(ITEMS,MAT_ITEMS);
const EXPLORE=[
 {id:'meadow',region:'초원의 땅',lv:1,mat:'herb',gate:'황혼녘 강가',desc:'바람이 풀을 눕히는 너른 초원. 탐사를 시작하기 좋은 곳이다.',scenes:[
  ['강가 둑을 따라 걷다 떠내려온 탐사 일지를 주웠다. 몇 줄 읽는 것만으로도 배울 게 많다.','exp'],
  ['저녁노을 아래 양치기 노인이 옛 전쟁 이야기를 들려준다.','exp'],
  ['바람에 눕는 풀 사이로 반짝이는 것이 보인다. 이슬에 젖은 약초다.','item'],
  ['토끼굴 옆에 약초 군락이 있다. 조심스레 몇 포기를 캤다.','item'],
  ['풀숲에 떨어진 낡은 지갑. 주인은 이미 떠난 지 오래인 듯하다.','gold'],
  ['방랑 약사가 남는 회복약을 하나 건넨다. "초행길이죠? 가져가요."','potion'],
  ['강물 소리만 들린다. 오늘은 평화로운 하루다.','none']]},
 {id:'rock',region:'바위의 땅',lv:10,mat:'ore',gate:'바위 산맥',desc:'발레티의 신전이 있는 산맥 지대. 무너진 바위 사이로 길이 이어진다.',scenes:[
  ['바위에 새겨진 옛 무술 동작을 따라 해 본다. 몸이 조금 가벼워졌다.','exp'],
  ['산맥 수련자와 짧게 대련했다. 진 것 같지만 얻은 것이 있다.','exp'],
  ['무너진 바위 틈에서 빛나는 원석을 캐냈다.','item'],
  ['낙석 더미를 치우자 원석 조각이 굴러 나온다.','item'],
  ['광부들이 버리고 간 곡괭이 자루 속에 동전이 숨겨져 있었다.','gold'],
  ['신전 순례자가 축복받은 회복약을 나눠 준다.','potion'],
  ['메아리만 돌아온다. 오늘 산은 말이 없다.','none']]},
 {id:'swamp',region:'늪의 땅',lv:20,mat:'venom',gate:'독안개 마을',desc:'독안개가 걷히지 않는 늪. 바다뱀의 숨결이 닿는 곳이다.',scenes:[
  ['안개 속에서 길을 잃을 뻔했지만 독안개 마을 주민의 표식을 따라 빠져나왔다.','exp'],
  ['늪 바닥에 가라앉은 옛 비석의 글귀를 해독했다.','exp'],
  ['죽은 두꺼비의 독샘을 조심스럽게 떼어 냈다.','item'],
  ['갈대 사이에 독샘이 남은 허물이 걸려 있다.','item'],
  ['진흙 속에서 녹슨 상자를 건졌다. 안에 동전이 조금 남아 있다.','gold'],
  ['마을 아이가 해독 약초로 만든 회복약을 쥐여 준다.','potion'],
  ['독안개가 짙어 더 들어가지 못하고 돌아섰다.','none']]},
 {id:'salt',region:'소금의 땅',lv:30,mat:'salt',gate:'소금 사막',desc:'대륙 소금의 대부분이 나는 하얀 사막. 신기루가 자주 보인다.',scenes:[
  ['신기루를 쫓다 오래된 대상의 길을 발견했다.','exp'],
  ['소금 채굴꾼에게 사막에서 살아남는 법을 배웠다.','exp'],
  ['햇빛에 반짝이는 소금 결정을 모았다.','item'],
  ['갈라진 땅 틈에서 투명한 결정이 자라 있다.','item'],
  ['상단이 흘리고 간 은화 주머니를 주웠다.','gold'],
  ['오아시스 상인이 물과 회복약을 바꿔 준다.','potion'],
  ['끝없이 하얀 땅. 오늘은 바람만 지나간다.','none']]},
 {id:'ember',region:'작열의 땅',lv:50,mat:'ember',gate:'붉은 모래사막',desc:'아발라가의 불이 꺼지지 않는 붉은 사막.',scenes:[
  ['아발라가 신전의 불 앞에서 잠시 명상했다.','exp'],
  ['모래 언덕 아래 묻힌 옛 화염술사의 비문을 읽었다.','exp'],
  ['식지 않는 불씨 조각을 화로 상자에 담았다.','item'],
  ['용암이 식은 자리에서 불씨가 남은 돌을 찾았다.','item'],
  ['모래 속 보물상자. 대부분 녹았지만 금화는 멀쩡하다.','gold'],
  ['신전 시종이 화상 연고와 회복약을 건넨다.','potion'],
  ['열기에 지쳐 그늘에서 쉬다 돌아왔다.','none']]},
 {id:'frost',region:'혹한의 땅',lv:65,mat:'frost',gate:'얼음 협곡',desc:'얼음 협곡과 적막의 숲이 있는 북쪽 땅.',scenes:[
  ['적막의 숲 제단에서 신들의 속삭임을 들은 것 같다.','exp'],
  ['얼음 협곡 마을의 사냥꾼과 함께 눈길을 걸었다.','exp'],
  ['절벽에 맺힌 서리 결정을 떼어 냈다.','item'],
  ['얼어붙은 폭포 아래 녹지 않는 결정이 박혀 있다.','item'],
  ['눈 속에 파묻힌 썰매에서 금화를 찾았다.','gold'],
  ['협곡 마을 사람이 따뜻한 수프와 회복약을 내준다.','potion'],
  ['눈보라가 길을 지웠다. 오늘은 돌아갈 수밖에.','none']]},
 {id:'sea',region:'바다의 땅',lv:40,mat:'pearl',gate:'항구 도시',desc:'항구 도시와 비단길 선착장이 있는 동쪽 해안. 바다 안개 너머에서 기이한 노랫소리가 들린다.',scenes:[
  ['항구 장터에서 먼 나라 상인들의 이야기를 들었다. 지도에 없는 바닷길이 있다고 한다.','exp'],
  ['등대지기와 함께 밤새 안개 속 불빛을 지켰다.','exp'],
  ['썰물에 드러난 갯바위 틈에서 은빛 진주를 건졌다.','item'],
  ['그물에 걸린 조개 속에 작은 진주가 들어 있었다.','item'],
  ['선착장 짐꾼을 도와주고 품삯을 받았다.','gold'],
  ['어부의 아내가 말린 생선과 회복약을 싸 준다.','potion'],
  ['바다 안개가 짙어 배가 뜨지 않는다. 오늘은 부두에서 쉬었다.','none']]},
 {id:'chaos',region:'블라스파미아',lv:80,mat:'chaos',gate:'녹투성이 호수',desc:'신대륙 블라스파미아. 녹물 호수와 독기가 가득하다.',scenes:[
  ['녹투성이 호수의 워프게이트 잔해에서 옛 기록을 찾았다.','exp'],
  ['저주받은 땅의 기운을 버텨 내자 감각이 날카로워졌다.','exp'],
  ['허공에 떠 있는 혼돈의 파편을 붙잡았다.','item'],
  ['쓰러진 추적자의 몸에서 혼돈의 파편이 빠져나온다.','item'],
  ['녹슨 왕관 조각을 주웠다. 상인에게 팔면 값이 꽤 된다.','gold'],
  ['길 잃은 탐사대원이 감사의 표시로 회복약을 준다.','potion'],
  ['녹물 냄새가 너무 짙다. 오늘은 더 들어가지 않기로 했다.','none']]}
];
function exploreReward(r,type){const L=r.lv,j=0.8+Math.random()*0.4;
  if(type==='exp')return {exp:Math.round(fieldExp(L)*0.8*j*xpCut()),gold:0,items:{}};
  if(type==='item'){const it={[r.mat]:Math.random()<0.3?2:1};const f=FOOD_BY_LAND[r.id];if(f&&Math.random()<0.6)it[f]=(it[f]||0)+1;return {exp:0,gold:0,items:it};}
  if(type==='gold')return {exp:0,gold:Math.round(fieldGold(L)*0.8*j),items:{}};
  if(type==='potion')return {exp:0,gold:0,items:{potion:1}};
  return {exp:3,gold:0,items:{}};}
function daily(){const c=kstCycle();if(!S.daily||S.daily.cycle!==c)S.daily={cycle:c,explore:0,raid:0,dungeon:{}};return S.daily;}
function weekly(){const k=weekKey(now()-5*3600e3);if(!S.weekly||S.weekly.wk!==k)S.weekly={wk:k,done:{}};return S.weekly;}
function mkind(m){return (m&&m.kind)||'party';}
const MKIND={party:'데일리 파티 레이드',weekly:'토벌전',event:'만신전',field:'필드 몬스터',dungeon:'던전 보스',story:'퀘스트 전투'};
/* 토벌전(숨무스 폰티펙스): 8장 E31을 마친 블레서에게만 열림(유저 결정 2026-11-05). 운영자는 항상. WEEKLY_CLOSED=false면 모두에게 */
const WEEKLY_CLOSED=false;  /* 2026-11-07 유저 요청으로 모두에게 열림(레벨 조건은 그대로) */
function weeklyClosed(){if(!WEEKLY_CLOSED)return false;if(typeof isAdmin==='function'&&isAdmin())return false;return !(S&&S.qp&&S.qp.E31&&S.qp.E31.status==='done');}
function isGroupMon(m){return !!(m&&m.published&&(mkind(m)==='party'||(mkind(m)==='weekly'&&!weeklyClosed())));}
function raidBlock(m){const k=mkind(m);
  if(k==='weekly'&&weeklyClosed())return '백야의 신전 이야기를 끝까지 마치면 열립니다';
  if(['field','story'].includes(k))return '개인 전투 전용 몬스터입니다';
  if(k==='dungeon'&&daily().dungeon[m.id])return '오늘은 이미 클리어했습니다 (05:00 초기화)';
  if(k==='party'&&daily().raid>=RAID_MAX)return `오늘 파티 레이드 ${RAID_MAX}회를 모두 사용했습니다 (05:00 초기화)`;
  if(k==='event'){const ev=eventFor(m.id);if(!ev)return '지금은 출현하지 않은 보스입니다';if((S.eventDone||{})[ev.id])return '이번 출현의 보상을 이미 받았습니다';}
  return null;}
function dailyPicks(){const ids=dailyPicks0();return S.theft&&S.theft.cycle===kstCycle()&&!(S.me&&S.me.justice)&&S.data.quests.some(q=>q.id==='D_THEFT')?[...ids,'D_THEFT']:ids;}
function dailyPicks0(){const c=kstCycle();const pool=S.data.quests.filter(q=>q.published&&q.repeat&&!q.trigger);
  if(S.dailyQ&&S.dailyQ.cycle===c&&S.dailyQ.ids.every(id=>pool.some(q=>q.id===id)))return S.dailyQ.ids;
  const rng=seedRnd(c+'|'+(S.me?S.me.name:''));const sh=pool.map(q=>[rng(),q]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
  const lv=S.me?S.me.level:1;const ids=[...sh.filter(q=>q.level<=lv),...sh.filter(q=>q.level>lv)].slice(0,DAILY_Q).map(q=>q.id);
  S.dailyQ={cycle:c,ids};return ids;}
function condReason(q){const c=q.cond;if(!c)return '';const r=[];
  if(c.level&&S.me.level<c.level)r.push(`LV${c.level} 이상 필요`);
  if(c.adv&&S.me&&CLASSES[S.me.job]&&CLASSES[S.me.job].tier!==2)r.push('전직 완료 필요');
  (c.quests||[]).forEach(id=>{if(!(S.qp[id]&&S.qp[id].status==='done')){const p=quest(id);r.push(`완료 필요: ${p?p.title:id}`);}});
  (c.flags||[]).forEach(f=>{if(!S.flags[f])r.push(`필요한 기록: ${FLAG_NAMES[f]||f}`);});
  if(c.item&&!(S.me.inv[c.item]>0))r.push(`필요한 아이템: ${ITEMS[c.item]?ITEMS[c.item].name:c.item}`);
  return r.join(' · ');}
function hasBattle(q){return Object.values(q.steps||{}).some(s=>s.battle);}
function dtg(id){return (S.sel.dtargets||{})[id]||S.sel.dtarget||'exp';}
function dungeonReward(m,target){const L=m.level,exp=Math.round(fieldExp(L)*4),gold=Math.round(fieldGold(L)*4);
  return target==='item'?{exp:Math.round(exp*0.3),gold,drops:[[pickLoot(m),1]]}:{exp,gold,drops:(m.loot||[]).length?[[pickLoot(m),0.35]]:[]};}
function startSolo(m,ctx){
  const me={id:'me',name:S.me.name,job:S.me.job,level:S.me.level,equip:effEquip(),isMe:true,enh:S.me.enh};
  const b=createBattle(m,[me],Math.random,cfg());
  {const mf=b.players[0];['maxHp','atk','def','luk'].forEach(k=>{const v=itemBonus(k);if(v){mf[k]+=v;if(k==='maxHp')mf.hp+=v;}});}
  b.solo=true;b.ctx=ctx;
  if(ctx.hpPct!=null){const mf=b.players[0];mf.hp=Math.max(1,Math.round(mf.maxHp*ctx.hpPct));}
  if(ctx.type==='quest'){b.rules.exp=0;b.rules.gold=0;b.rules.drops=[];}
  if(ctx.type==='field')b.rules.drops=[];
  if(ctx.type==='dungeon'){const R=dungeonReward(m,ctx.target);b.rules.exp=R.exp;b.rules.gold=R.gold;b.rules.drops=R.drops;}
  b.log.push({t:'sys',text:`개인 레이드 · ${MKIND[mkind(m)]||''} · 혼자 싸우는 전투입니다.`});
  b.deadline=now()+b.rules.turnSeconds*1000;
  S.battle=b;resetAct();S.route='battle';save();render();toast(`${m.name} · 개인 전투 시작`,'good');
}
const RTABS=[['dungeon','던전'],['daily','파티 레이드'],['weekly','토벌전'],['event','만신전']];
function monCard(m,extra){const lr=levelReason(m,S.me.level)||raidBlock(m);
  return `<div class="panel mcard" data-act="link" data-link="monster:${m.id}" role="button" tabindex="0">
      ${monPic(m)}
      <div><div class="mname">${esc(m.name)}</div><p class="muted" style="font-size:12.5px">${esc(m.region||'')}</p></div>
      <div class="row" style="gap:6px"><span class="chip num">LV${m.level}+</span><span class="chip num">${m.min}~${m.max}명</span>${['tank','dps','heal'].map(r=>m.roles[r]?`<span class="chip ${r}">${ROLE[r]} ${m.roles[r]}</span>`:'').join('')}</div>
      ${extra?`<div class="row" style="gap:6px">${extra}</div>`:''}${lr?`<p class="reason">${esc(lr)}</p>`:'<p class="ok-t" style="font-size:12.5px">입장 가능</p>'}</div>`;}
/* 가로형 레이드 보스 카드: 그림 · 이름/지역/조건 · 입장 상태 */
function monCardH(m,extra,open){const lvLock=S.me.level<m.level;const lr=lvLock?'':(levelReason(m,S.me.level)||raidBlock(m));const nr=S.recruits.filter(r=>r.monsterId===m.id).length;
  return `<div class="panel mcard mcard-h ${lvLock?'locked':''}${open?' open':''}" data-act="raidopen" data-id="${m.id}" role="button" tabindex="0" aria-expanded="${!!open}" aria-controls="mexp-${m.id}">
    ${monImg(m)?monPic(m,'mh-pic','aria-hidden="true"'):''}<div class="mh-main"><div class="mname">${esc(m.name)}</div>
      <div class="row" style="gap:6px"><span class="muted" style="font-size:12.5px;margin-right:4px">${esc(m.region||'')}</span><span class="chip num">LV${m.level}+</span><span class="chip num">${m.min}~${m.max}명</span>${['tank','dps','heal'].map(r=>m.roles[r]?`<span class="chip ${r}">${ROLE[r]} ${m.roles[r]}</span>`:'').join('')}${extra||''}</div></div>
    <div class="mh-st"><span class="chip mh-n" data-mh-n="${m.id}" ${nr?'':'hidden'}>모집 ${nr}</span>${lvLock?`<span class="mh-lock" aria-label="LV ${m.level} 제한"><svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="7" width="10" height="7.2" rx="1.4" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M5.3 7V5.1a2.7 2.7 0 0 1 5.4 0V7" fill="none" stroke="currentColor" stroke-width="1.4"/></svg><small class="num">(LV ${m.level} 제한)</small></span>`:lr?`<p class="reason">${esc(lr)}</p>`:'<p class="ok-t">입장 가능</p>'}<span class="mh-go" aria-hidden="true">›</span></div></div>`;}
/* 레이드 목록 · 몬스터를 누르면 그 아래 모집 중인 파티 + [파티 생성] [랜덤 매칭] */
function raidExp(m){const lr=levelReason(m,S.me.level)||raidBlock(m);const busy=busyReason();const rs=S.recruits.filter(r=>r.monsterId===m.id);
  const mk=S.sel.mk||{};const tgt=Math.min(m.max,Math.max(m.min,mk.target||m.target||m.min));const qd=lr||busy||(m.questOnly?'퀘스트 전용 토벌은 랜덤 매칭이 없습니다':'');
  return `<div class="mexp" id="mexp-${m.id}" role="region" aria-label="${esc(m.name)} 모집 중인 파티">
    <div class="mexp-bar"><b>모집 중인 파티 <span class="num faint" data-mexp-n>${rs.length}</span></b>
      <div class="row" style="gap:6px"><button class="btn btn-sm btn-primary" data-act="link" data-link="monster:${m.id}">파티 생성</button><button class="btn btn-sm" data-act="queue" data-id="${m.id}" ${qd?`disabled title="${esc(qd)}"`:`title="목표 ${tgt}인으로 매칭"`}>랜덤 매칭</button></div></div>
    ${lr||busy?`<p class="reason mexp-why">${esc(lr||busy)}</p>`:''}
    <div class="list" data-recruits-mon="${m.id}">${recruitRows(rs,true)}</div></div>`;}
function raidList(list,extraFn,empty){
  if(!list.length)return `<p class="empty">${empty}</p>`;
  return `<div class="mlist">${list.map(m=>{const open=S.sel.raidOpen===m.id;return `<div class="mgrp${open?' open':''}">${monCardH(m,extraFn&&extraFn(m),open)}${open?raidExp(m):''}</div>`;}).join('')}</div>`;}
function cntRow(items){return `<div class="cntrow">${items.map(([l,v,n])=>`<span class="cnt"><small>${l}</small><b class="num">${v}</b>${n?`<em>${n}</em>`:''}</span>`).join('')}</div>`;}
function vBattle(){
  if(S.battle)return vFight();
  if(S.drun&&monster(S.drun.mid))return vDrun();
  if(S.match||S.queue)return vQueue();
  if(S.party)return vParty();
  if(S.sel.monster&&monster(S.sel.monster)&&mkind(monster(S.sel.monster))==='weekly'&&weeklyClosed(monster(S.sel.monster))){S.sel.monster=null;S.sel.rtab='dungeon';}
  if(S.sel.rtab==='weekly'&&weeklyClosed())S.sel.rtab='dungeon';
  if(S.sel.monster&&monster(S.sel.monster)){if(mkind(monster(S.sel.monster))==='event'){S.sel.monster=null;S.sel.rtab='event';}else return vMonster(monster(S.sel.monster));}
  const tab=S.sel.rtab||'dungeon';const d=daily(),w=weekly();
  const ms=S.data.monsters.filter(m=>m.published);
  let body='';
  if(tab==='daily'){
    const party=ms.filter(m=>mkind(m)==='party');const dun=ms.filter(m=>mkind(m)==='dungeon').sort((a,b)=>a.level-b.level);const tg=S.sel.dtarget||'exp';const busy=busyReason();
    body=`<div class="raid-bar"><span class="rb-r"><span class="rb-c">파티 레이드 <b class="num">${d.raid} / ${RAID_MAX}</b><em>하루 ${RAID_MAX}회</em></span><i aria-hidden="true">·</i><span class="rb-c">초기화 <b class="num">05:00</b><em>매일</em></span></span></div>
        ${raidList(party,null,'등록된 파티 레이드가 없습니다.')}`;
  }else if(tab==='dungeon'){
    body=dungeonTab();
  }else if(tab==='weekly'){
    const wm=ms.filter(m=>mkind(m)==='weekly'&&!weeklyClosed(m));
    body=`${cntRow([['이번 주 토벌',`${wm.filter(m=>w.done[m.id]).length} / ${wm.length}`,'보상 주 1회'],['초기화','월 05:00','매주']])}
      ${raidList(wm,m=>`<span class="chip ${w.done[m.id]?'dim':'ok'}">${w.done[m.id]?'이번 주 보상 수령 완료':'이번 주 보상 받을 수 있음'}</span>`,'등록된 토벌전이 없습니다.')}`;
  }else{
    body=massPanel();
  }
  return `<div class="wrap page"><div class="page-head"><div><h2>레이드<small class="en">Raid</small></h2></div></div>
    <div class="qtabs" role="tablist">${RTABS.filter(([k])=>k!=='weekly'||!weeklyClosed()).map(([k,l])=>`<button role="tab" data-act="rtab" data-tab="${k}" aria-selected="${tab===k}">${l}</button>`).join('')}</div>
    ${body}</div>`;
}
const LAND_STORY={rock:'E4',swamp:'E7',salt:'E11',sea:'E15',ember:'E19',frost:'E23',chaos:'E27'};
function storyLock(land){const q=LAND_STORY[land];if(!q||isAdmin())return '';if(typeof questHidden==='function'&&questHidden())return '';   /* 퀘스트 비공개 동안은 지역을 레벨로만 연다(체크 요청 2026-11-06) */const Q=quest(q);if(S.qp[q]&&S.qp[q].status==='done')return '';return `메인 스토리 「${Q?Q.title:q}」 완료 필요`;}
function landLock(r){return S.me.level<r.lv?`LV${r.lv} 이상 필요`:storyLock(r.id);}
function exCard(r,W){const lr=landLock(r);const d=daily();const busy=busyReason();
  const w=W.find(x=>x.name===r.region);const fm=S.data.monsters.filter(m=>m.published&&mkind(m)==='field'&&m.region===r.region);
  return `<div class="panel excard ${lr?'locked':''}">
    <div class="row" style="justify-content:space-between;align-items:flex-start"><div><div class="mname">${esc(r.region)}</div><small class="muted">${esc(r.gate)} · LV${r.lv}+</small></div>
      ${w?`<span class="exw" title="${WNAME[w.w]}"><svg viewBox="0 0 16 16" aria-hidden="true">${WICON[w.w]}</svg>${WNAME[w.w]} ${w.t}°</span>`:''}</div>
    <p class="muted" style="font-size:12.5px">${esc(r.desc)}</p>
    <div class="row" style="gap:6px">${fm.map(m=>`<span class="chip" title="${esc(m.dotName)} ${Math.round(m.dotChance*100)}%">${esc(m.name)}</span>`).join('')}<span class="chip warn">${esc(ITEMS[r.mat].name)}</span></div>
    ${lr?`<p class="reason">${lr}</p>`:''}
    <div class="row exbtns"><button class="btn btn-primary btn-sm" data-act="ex-go" data-id="${r.id}" ${lr||d.explore>=EXPLORE_MAX?'disabled':''}>탐색</button><button class="btn btn-sm" data-act="ex-hunt" data-id="${r.id}" ${lr||huntBusy()||!fm.length?'disabled':''}>필드 사냥</button></div></div>`;}
function gotText(r){const a=[];if(r.exp)a.push(`EXP +${r.exp}`);if(r.gold)a.push(`${r.gold}골드`);const it=itemsText(r.items);if(it)a.push(it);return a.join(' · ');}

const MAP_SPOTS=[["d_mirror", "dungeon", "거울 감옥", "frost", 41.82, 26.66], ["d_siren", "dungeon", "인어의 속삭임", "sea", 75.98, 29.09], ["temple", "dungeon", "백야의 신전", "chaos", 54.14, 37.78], ["d_cave", "dungeon", "무너진 바위 동굴", "rock", 24.64, 42.44], ["d_lake", "dungeon", "갈증의 호수", "salt", 39.44, 43.89], ["d_pilgrim", "dungeon", "순례자의 길", "rock", 31.06, 47.1], ["d_serpent", "dungeon", "바다뱀의 고리", "swamp", 72.77, 53.05], ["d_grass", "dungeon", "비명 지르는 풀숲", "meadow", 51.04, 60.97], ["d_altar", "dungeon", "황금 뿌리 제단", "ember", 38.51, 70.29], ["a_mine", "area", "폐광 비밀 통로", "frost", 28.16, 27.02], ["a_silk", "area", "비단길 선착장", "sea", 64.39, 38.82], ["a_desert", "area", "영원의 사막", "ember", 52.48, 71.84], ["a_alarosa", "area", "알라로사", "ember", 74.02, 73.4], ["g_ice", "gate", "얼음 협곡", "frost", 38.82, 23.71], ["g_silent", "gate", "적막의 숲", "frost", 32.09, 34.78], ["g_rust", "gate", "녹투성이 호수", "chaos", 56.31, 36.75], ["g_port", "gate", "항구 도시", "sea", 68.01, 36.23], ["g_rock", "gate", "바위 산맥", "rock", 22.88, 47.41], ["g_salt", "gate", "소금 사막", "salt", 40.68, 48.14], ["g_fog", "gate", "독안개 마을", "swamp", 77.12, 51.04], ["g_dusk", "gate", "황혼녘 강가", "meadow", 48.45, 57.87], ["g_oasis", "gate", "오아시스 마을", "ember", 36.44, 67.6], ["g_red", "gate", "붉은 모래사막", "ember", 52.9, 69.05], ["L_frost", "land", "혹한의 땅", "frost", 36.85, 22.26], ["L_rock", "land", "바위의 땅", "rock", 25.36, 54.35], ["L_salt", "land", "소금의 땅", "salt", 44.0, 43.06], ["L_meadow", "land", "초원의 땅", "meadow", 52.8, 55.8], ["L_ember", "land", "작열의 땅", "ember", 45.81, 73.76], ["L_swamp", "land", "늪의 땅", "swamp", 67.81, 50.98], ["L_sea", "land", "바다의 땅", "sea", 73.24, 41.82], ["L_chaos", "land", "블라스파미아", "chaos", 55.38, 35.2]];
/* ───────── 월드 맵 ───────── */
const LANDS={frost:'혹한의 땅',rock:'바위의 땅',salt:'소금의 땅',meadow:'초원의 땅',ember:'작열의 땅',swamp:'늪의 땅',sea:'바다의 땅',chaos:'블라스파미아'};
const MAP_INFO={
 d_mirror:{quote:'호수는 가장 두려운 것을 비추나니.',ppl:'1–12인',text:'혹한의 땅에 있는 얼어붙은 호수는 마치 거울처럼 모든 것을 비춘다. 아름다운 풍경과 달리 그 아래에는 끔찍한 죄수들이 갇혀있다고 하는데….'},
 d_siren:{quote:'현혹되지 않을 굳은 심지가 필요해요.',ppl:'1–12인',text:'항구로부터 다소 멀리 떨어진 곳. 최근 그곳에서 들리기 시작한 기이한 부름에 이끌려 실종되거나 시체로 돌아오는 사람들이 나오고 있다는데….'},
 temple:{quote:'그 신전의 문을 열면 다시 돌아오지 못하리라.',ppl:'12–22인',lv:90,label:'신규 인스턴스 던전',text:'고대 혼돈의 신이 잠든 관. 어둠의 땅, 블라스파미아에서 유일하게 백색의 빛을 유지하고 있는 지하 신전이다. 종말의 서곡을 멈추기 위해선 신전 안에 잠든 혼돈의 신을 소멸시켜야 한다는데….'},
 d_cave:{quote:'수련을 원하는 자, 동굴 속에서 쌓아라.',ppl:'1–4인',text:'예로부터 고수들은 바위 산맥에 터를 잡고 자신의 몸을 갈고 닦았다. 그 중 무너진 것처럼 보이는 바위 동굴엔 여러가지 비기가 숨겨져 있다는데….'},
 d_lake:{quote:'아무리 목을 축여도 나아지지 않는 갈증이 그대를 파멸로 이끌리라.',ppl:'1–4인',text:'소금 사막 근처, 호숫가에 이상한 구조물이 생긴 이후로 호수의 염분이 지나치게 높아지기 시작했다.'},
 d_pilgrim:{quote:'신에게 가까이 가기 위해선 최초의 시련을 극복하시오.',ppl:'1–4인',text:'바위의 땅과 소금의 땅 경계, 태초의 신이 걸었다는 길. 영웅이 되려는 블레서들이 반드시 거치는 첫 관문이다.'},
 d_serpent:{quote:'바다뱀은 오랜 세월을 살았던 만큼 굉장히 강하고 포악하다네.',ppl:'1–12인',text:'태초에 대륙이 생겨났을 때 고대 바다뱀이 건너와 똬리를 틀었다는 산에는 다들 다가가지 않으려고 한다. 그러나 최근, 늪의 땅에 몬스터들이 급증하는 이상현상이 발생하여 바다뱀이 곤혹을 겪고 있다고 한다.'},
 d_grass:{quote:'그 풀숲에선 아직도 비명 같은 소리가 들린다오.',ppl:'1–4인',text:'황혼녘 강가 마을에서는 주기적으로 실종되는 사람들이 발생한다. 그는 풀숲에 내린 저주 때문이라는데….'},
 d_altar:{quote:'바위와 자갈사막의 지하에는 보물이 묻힌 고대 문명 도시가 있다던데?',ppl:'1–4인',text:'오아시스 마을 근처엔 황금 도시가 있다는 소문이 돌고 있다. 하지만 그를 찾아 떠난 많은 모험가들이 다시 돌아오지 못하고 있다고 한다.'},
 a_mine:{lv:70,text:'북쪽에 혹한의 신이 내리면서 차갑게 방치된 폐쇄된 광산에는 비밀 통로가 있다고 한다.'},
 a_silk:{lv:43,text:'선착장엔 여러 곳에서 수입해온 진귀한 보물들을 만날 수 있다.'},
 a_desert:{lv:58,text:'영원의 사막에선 모래 속에 파묻힌 보물상자를 찾을 수 있다는데….'},
 a_alarosa:{lv:53,img:'alarosa',text:'작열의 땅에 속해있지만 수풀이 우거진 섬, 알라로사. 신비한 동물들과 고대 문물들이 숨겨져 있다고 한다.'},
 g_ice:{text:'혹한의 땅, 협곡에 위치한 마을. 인구가 적고 다소 폐쇄된 성향을 보인다.'},
 g_silent:{job:'priest',text:'혹한의 땅에 속해있지만 비교적 온난한 침엽수림 숲. 숲의 가운데엔 셀 수 없이 많은 고대 신들을 모시는 신들의 제단이 있으며, <b>프리스트는 이곳에서 신들의 부름을 받는다.</b>'},
 g_rust:{text:'갑자기 나타난 신 대륙 블라스파미아의 워프게이트. 게이트의 바로 앞엔 녹물로 이루어진 호수가 있다. 땅에서 올라온 독기가 공기에 가득하기 때문에 되도록 가지 않는 것이 좋다.'},
 g_port:{text:'무역의 온상지. 가장 많은 유동 인구가 있는 곳이며 온갖 진귀하고 새로운 문물과 물건들이 존재하는 도시이다. 이 도시의 장터에선 블레서들도 장사를 하곤 한다.'},
 g_rock:{job:'infighter',text:'바위로 이루어진 산맥 아래 위치한 마을. 지형적으로 약간의 폐쇄성이 있다. 고대 무술의 신 발레티의 신전이 있으며, <b>인파이터는 이곳에서 부름을 받는다.</b> 예로부터 마을 주민들 모두 어느 정도의 무술을 배우고 있다.'},
 g_salt:{text:'건강한 맛의 소금 원산지로, 대륙인들이 섭취하는 소금의 90%가 이곳에서 생산된다. 근처 마을들은 전체적으로 부유하고 여유로운 분위기를 풍긴다.'},
 g_fog:{text:'늪의 땅에 위치했지만 상대적으로 단단한 땅에 위치한 마을. 늘 고대 바다뱀이 내뿜는 독안개가 껴있기 때문에 독에 면역이 있는 종족들만 살고 있다.'},
 g_dusk:{job:'defender',text:'초원의 땅, 황혼이 아름다운 강가에 위치한 마을. 고대 장악의 신 아움타주의 신전이 있다. <b>디펜더는 이곳에서 부름을 받는다.</b>'},
 g_oasis:{job:'shooter',text:'오아시스 근처에 번성한 마을. 고대 공학 문명의 발상지라고 하는데…. 문명의 신 셀로나의 신전이 있으며, <b>슈터는 이곳에서 부름을 받는다.</b>'},
 g_red:{job:'mage',text:'작열의 땅에 위치하여 붉은색 모래로 이루어진 사막. 불의 신인 아발라가의 신전이 있으며, <b>메이지는 이곳에서 부름을 받는다.</b>'}
};
const SPOT_ICON={dungeon:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.2a5 5 0 0 0-5 5c0 3.6 5 8.6 5 8.6s5-5 5-8.6a5 5 0 0 0-5-5z" fill="#a8322a"/><path d="M5.3 7.6l1.4-2.4 1.3 1.6 1.2-1.6 1.5 2.4" fill="none" stroke="#f3d9d0" stroke-width=".9"/></svg>',
  area:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 5.5l3.6-1.4 4.8 1.6L14 4.3v8.2l-3.6 1.4-4.8-1.6L2 13.7z" fill="none" stroke="#e5cfa0" stroke-width="1.1"/><path d="M8 1.3a2.2 2.2 0 0 0-2.2 2.2C5.8 5.2 8 7.4 8 7.4s2.2-2.2 2.2-3.9A2.2 2.2 0 0 0 8 1.3z" fill="#e5cfa0"/></svg>',
  gate:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 8.2a.9.9 0 1 1 .9-.9M8 8.2c1.5 0 2.5-1 2.4-2.4S9 3.2 7.6 3.4 5 4.9 5.1 6.9 6.9 10.4 9 10.2s3.9-1.9 3.8-4.3S10.6 1.6 7.8 1.8 2.6 4.3 2.8 7.3 5.6 12.9 9.2 12.6" fill="none" stroke="#cfd3d8" stroke-width="1.1" stroke-linecap="round"/></svg>'};
const SPOT_KIND={dungeon:'던전',area:'탐험 지역',gate:'워프 게이트'};
function vExplore(){
  const d=daily();const log=(S.me.exLog||[]);
  const spots=spotsHTML();
  if(S.sel.exLand&&LANDS[S.sel.exLand])return vRegion(S.sel.exLand,d,spots);
  return vExploreHome(d,log,spots);
}
function spotsHTML(cur){
  const ord={land:0,gate:1,area:2,dungeon:3};return MAP_SPOTS.slice().sort((a,b)=>ord[a[1]]-ord[b[1]]).map(([id,t,n,l,x,y])=>t==='land'
    ?`<button class="mspot land" style="left:${x}%;top:${y}%" data-act="map-open" data-land="${l}" data-focus="" aria-label="${esc(n)} 정보 열기"><span class="sr">${esc(n)}</span></button>`
    :`<button class="mspot ${t}${cur&&l===cur?' cur':''}" style="left:${x}%;top:${y}%;--w:${t==='gate'?2.2+n.length*0.95:2.6+n.length*1.1}%" data-act="map-open" data-land="${l}" data-focus="${id}" aria-label="${SPOT_KIND[t]} · ${esc(n)} 열기"><span class="sr">${esc(n)}</span></button>`).join('');
}
function vExploreHome(d,log,spots){
  return `<div class="wrap page"><div class="page-head"><div><h2>탐색<small class="en">Explore</small></h2></div></div>
    <div class="stack" style="gap:12px">
      <div class="ex-cnt">${cntRow([['오늘 탐색',`${d.explore} / ${EXPLORE_MAX}`],['초기화','05:00']])}</div>
      <div class="wmap"><img src="${MAP_IMG}" alt="라니아케아 대륙 지도" draggable="false"><div class="wm-head"><b>WORLD MAP</b><small>지역 이름이나 핀을 눌러 보세요</small>
        <ul class="wm-legend"><li>${SPOT_ICON.area}탐험 지역</li><li>${SPOT_ICON.dungeon}던전</li><li>${SPOT_ICON.gate}워프 게이트</li></ul></div>${spots}${landDD()}</div>
</div></div>`;
}

function landDD(){const lvOf=k=>{const r=EXPLORE.find(x=>x.id===k);return r?r.lv:999;};return `<details class="wm-dd"><summary>지역 보기</summary><div class="wm-dd-menu">${Object.entries(LANDS).sort((a,b)=>lvOf(a[0])-lvOf(b[0])).map(([k,n])=>{const r=EXPLORE.find(x=>x.id===k);return `<button class="wm-dd-i" data-act="map-open" data-land="${k}" data-focus="">${esc(n)}${r?` <span class="faint">LV${r.lv}</span>`:''}</button>`;}).join('')}</div></details>`;}
function gatesHTML(land){
  const gs=MAP_SPOTS.filter(x=>x[3]===land&&x[1]==='gate');if(!gs.length)return '';
  return `<div class="exr-gates">${gs.map(([id,,n])=>{const I=MAP_INFO[id]||{};return `<div class="exr-gate ${S.sel.exFocus===id?'focus':''}" id="md-${id}"><div class="exr-gh"><span class="exr-gico" aria-hidden="true">${SPOT_ICON.gate}</span><span class="md-lbl">워프게이트</span><b>${esc(n)}</b>${I.job?`<span class="chip cls ${roleOf(I.job)}">${CLASSES[I.job].name}</span>`:''}</div>${I.text?`<p>${I.text}</p>`:''}</div>`;}).join('')}</div>`;
}
const LAND_DESC={frost:'만년설과 얼음 협곡으로 뒤덮인 북쪽 끝의 땅. 거울 감옥의 냉기가 바람을 타고 내려와 한낮에도 숨결이 얼어붙는다.',
  rock:'깎아지른 바위 산맥이 이어지는 서쪽의 땅. 무너진 동굴과 순례자의 길이 산허리를 따라 굽이친다.',
  salt:'하얀 소금 사막과 갈증의 호수가 펼쳐진 내륙. 반짝이는 지평선 너머로 신기루가 자주 떠오른다.',
  meadow:'대륙 한가운데를 가로지르는 너른 초원. 황혼녘 강가를 따라 마을이 모여 있어 첫 탐사에 알맞다.',
  ember:'붉은 모래와 뜨거운 바람의 남쪽 사막. 오아시스 마을과 영원의 사막이 불의 신전을 품고 있다.',
  swamp:'안개가 걷히지 않는 동쪽의 습지대. 바다뱀의 고리 근처에는 발이 빠지는 늪이 곳곳에 숨어 있다.',
  sea:'해안 절벽과 항구 도시가 이어진 바다의 땅. 인어의 속삭임이 들린다는 곶 끝에는 아무도 오래 머물지 않는다.',
  chaos:'저주가 처음 내려앉은 섬, 블라스파미아. 녹투성이 호수 위 백야의 신전만이 희미한 빛을 낸다.'};
const REGION_FX_OF={frost:'snow',meadow:'fireflies',ember:'embers',sea:'bubbles',swamp:'fog',chaos:'miasma',salt:'saltstorm'};
function vRegion(land,d,spots){
  const W=todayWeather();const w=W.find(x=>x.name===LANDS[land]);
  return `<div class="wrap page"><div class="page-head"><div><h2>탐색<small class="en">Explore</small></h2></div></div>
    <div class="exr-head">${REGION_FX_OF[land]?`<canvas class="exr-fx fx-${REGION_FX_OF[land]}" id="exr-fx" data-fx="${REGION_FX_OF[land]}" data-w="${w?w.w:''}" aria-hidden="true"></canvas>`:''}<div class="exr-bar"><button class="btn btn-sm btn-ghost" data-act="ex-back"><span aria-hidden="true">←</span> 돌아가기</button>
      <span class="exr-cnt">탐색 <b>${d.explore}/${EXPLORE_MAX}</b></span>${landDD()}</div>
      <h3>${esc(LANDS[land])}</h3><p class="exr-desc">${esc(LAND_DESC[land]||'')}</p>
      <div class="exr-now">${w?`<span class="exw"><svg viewBox="0 0 16 16" aria-hidden="true">${WICON[w.w]}</svg>${WNAME[w.w]} ${w.t}°</span><i aria-hidden="true">·</i>`:''}<span class="num" data-clock>${clockText()}</span></div>${wDebuffHTML(land)}${gatesHTML(land)}${dungeonsHTML(land)}</div>
    <div class="exr-body">${mapDlg(land,S.sel.exFocus||'',true)}</div></div>`;
}
function initMini(){
  const m=$('#mini');if(!m||!m.dataset.land)return;const inn=m.querySelector('.mini-in');const Z=2.6;
  const ls=MAP_SPOTS.filter(x=>x[3]===m.dataset.land);const pts=ls.length?ls:[[0,0,0,0,50,50]];
  const cx=pts.reduce((a,x)=>a+x[4],0)/pts.length,cy=pts.reduce((a,x)=>a+x[5],0)/pts.length;
  let tx=0,ty=0,W=0,H=0,SZ=0;
  const clamp=()=>{tx=Math.min(0,Math.max(W-SZ,tx));ty=Math.min(0,Math.max(H-SZ,ty));inn.style.transform=`translate(${tx}px,${ty}px)`;};
  const size=()=>{W=m.clientWidth;H=m.clientHeight;SZ=W*Z;inn.style.width=SZ+'px';inn.style.height=SZ+'px';};
  size();tx=W/2-cx/100*SZ;ty=H/2-cy/100*SZ;clamp();
  let drag=null,moved=false;
  m.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={x:e.clientX,y:e.clientY,tx,ty,id:e.pointerId};moved=false;});
  m.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!moved&&Math.hypot(dx,dy)>4){moved=true;m.classList.add('dragging');try{m.setPointerCapture(drag.id);}catch(_){}}
    if(moved){tx=drag.tx+dx;ty=drag.ty+dy;clamp();}});
  const end=()=>{drag=null;m.classList.remove('dragging');};
  m.addEventListener('pointerup',end);m.addEventListener('pointercancel',end);
  m.addEventListener('click',e=>{if(moved){e.stopPropagation();e.preventDefault();moved=false;}},true);
  m._resize=()=>{const fx=(W/2-tx)/SZ,fy=(H/2-ty)/SZ;size();tx=W/2-fx*SZ;ty=H/2-fy*SZ;clamp();};
}
if(typeof addEventListener==='function')addEventListener('resize',()=>{const m=$('#mini');if(m&&m._resize)m._resize();});
function mapDlg(land,focus,page){
  const r=EXPLORE.find(x=>x.id===land);const d=daily();const busy=busyReason();const W=todayWeather();
  const ins=MAP_SPOTS.filter(s=>s[3]===land&&s[1]!=='land');
  const sec=(id,html)=>`<section class="md-sec ${page?'panel':''} ${focus===id?'focus':''}" id="md-${id}">${html}</section>`;
  let h=page?'':`<button class="ibtn sm md-x" data-act="closemodal" aria-label="닫기">✕</button><div class="md-land">[ ${esc(LANDS[land])} ]</div>`;
  if(r){const lr=landLock(r);const w=W.find(x=>x.name===r.region);const fm=S.data.monsters.filter(m=>m.published&&mkind(m)==='field'&&m.region===r.region);const hw=lr||huntBusy()||(!fm.length?'이 지역에 공개된 필드 몬스터가 없습니다':'');
    h+=sec('land',`<div class="md-lbl"><i class="lbl-d" aria-hidden="true">◆</i>지역 탐색</div><div class="row" style="gap:8px;justify-content:space-between"><span class="md-meta">최소 레벨 <b>${r.lv}</b></span>${w&&!page?`<span class="exw"><svg viewBox="0 0 16 16" aria-hidden="true">${WICON[w.w]}</svg>${WNAME[w.w]} ${w.t}°</span>`:''}</div>
      <p class="md-text">${esc(r.desc)}</p>
      <div class="row" style="gap:6px">${fm.map(m=>`<span class="chip" title="${esc(m.dotName)} ${Math.round(m.dotChance*100)}%">${esc(m.name)}</span>`).join('')}<span class="chip warn">${esc(ITEMS[r.mat].name)}</span></div>
      ${lr?`<p class="reason">${lr}</p>`:''}${autoHere(land,'')?autoBar():''}
      <div class="row md-btns"><button class="btn btn-primary" data-act="ex-go" data-id="${r.id}" data-pop="1" ${lr||d.explore>=EXPLORE_MAX?'disabled':''}>탐색 <span class="num">${d.explore}/${EXPLORE_MAX}</span></button><button class="btn" data-act="ex-hunt" data-id="${r.id}" ${hw?'disabled':''}>필드 사냥</button></div>${hw&&!lr?`<p class="reason">필드 사냥 불가 · ${esc(hw)}</p>`:''}`);}
  const last=S.me.exLog&&S.me.exLog[0];
  if(last&&now()-last.ts<6000&&last.land===land)h=h.replace('<div class="md-lbl"><i class="lbl-d" aria-hidden="true">◆</i>지역 탐색</div>',`<div class="md-lbl"><i class="lbl-d" aria-hidden="true">◆</i>지역 탐색</div><div class="md-res"><p>${esc(last.text)}</p>${last.got?`<b>${esc(last.got)}</b>`:''}</div>`);
  let dg='';
  ins.filter(s=>s[1]==='dungeon').forEach(([id,,n])=>{const I=MAP_INFO[id]||{};const m=monster(id);const img=SPOT_IMG[id];const tg=dtg(m?m.id:id);
    let act='';
    if(id==='temple'){const g=S.data.monsters.find(x=>mkind(x)==='weekly');act=weeklyClosed()?'<p class="faint" style="font-size:12px">백야의 신전은 지금 닫혀 있습니다.</p>':g?`<div class="row md-btns"><button class="btn btn-primary" data-act="map-goto" data-link="monster:${g.id}">토벌전 · ${esc(g.name)}</button></div><p class="faint" style="font-size:12px">현재 시제품에서는 봉인 수호자 토벌전(LV${g.level}+ · ${g.min}~${g.max}인)으로 열려 있습니다.</p>`:'';}
    else if(m){const done=d.dungeon[m.id];const lr=levelReason(m,S.me.level);const R=dungeonReward(m,tg);
      act=`<p class="faint" style="font-size:12px">보스 · ${esc(m.name)} · ${tg==='exp'?`EXP ${R.exp} · ${R.gold}골드`:`아이템 1개 확정 (${lootText(m)})`}</p>
        <div class="row md-btns">${done?'<span class="chip dim">오늘 클리어 완료 · 05:00 초기화</span>':`<button class="btn btn-primary" data-act="dfight" data-id="${m.id}" ${lr||busy?'disabled':''}>${lr?esc(`LV${m.level} 이상 필요`):'개인 레이드 도전'}</button>`}</div>`;}
    dg+=sec(id,`<div class="md-lbl"><i class="lbl-d" aria-hidden="true">◆</i>${I.label||'인스턴스 던전'}</div><h3 class="md-title">${esc(n)}</h3>${img?`<img class="md-img" src="${img}" alt="">`:''}
      ${I.quote?`<p class="md-quote">“${esc(I.quote)}”</p>`:''}<div class="md-meta">최소 레벨 : <b>${I.lv||(m?m.level:'-')}</b></div><div class="md-meta">인원 제한 : <b>${I.ppl||'1–4인'}</b></div><p class="md-text">${esc(I.text||'')}</p>${act}`);});
  ins.filter(s=>s[1]==='area').forEach(([id,,n])=>{const I=MAP_INFO[id]||{};const lr=S.me.level<I.lv?`LV${I.lv} 이상 필요`:'';
    h+=sec(id,`<div class="md-lbl"><i class="lbl-d" aria-hidden="true">◆</i>탐험 지역</div><h3 class="md-title">${esc(n)}</h3>${I.img?`<img class="md-img" src="${SPOT_IMG[I.img]}" alt="">`:''}<div class="md-meta">최소 레벨 : <b>${I.lv}</b></div><p class="md-text">${esc(I.text)}</p>
      ${(()=>{const am=areaMons(id);return `<div class="row" style="gap:6px">${am.map(m=>`<span class="chip">${esc(m.name)}</span>`).join('')}</div>`;})()}${lr?`<p class="reason">${lr}</p>`:''}${autoHere(land,id)?autoBar():''}
      <div class="row md-btns"><button class="btn btn-primary" data-act="ex-go" data-id="${land}" data-area="${id}" data-pop="1" ${lr||d.explore>=EXPLORE_MAX?'disabled':''}>탐색 <span class="num">${d.explore}/${EXPLORE_MAX}</span></button><button class="btn" data-act="ex-hunt" data-id="${land}" data-area="${id}" ${lr||huntBusy()?'disabled':''}>필드 사냥</button></div>`);});
  if(!page)ins.filter(s=>s[1]==='gate').forEach(([id,,n])=>{const I=MAP_INFO[id]||{};
    h+=sec(id,`<div class="md-lbl"><i class="lbl-d" aria-hidden="true">◆</i>워프게이트</div><h3 class="md-title">${esc(n)}${I.job?` <span class="chip cls ${roleOf(I.job)}" style="vertical-align:middle">${CLASSES[I.job].name}</span>`:''}</h3><p class="md-text">${I.text||''}</p>`);});
  const cnt=x=>(x.match(/<section /g)||[]).length;
  return page?`${VIL_TOWN[land]?`<div class="exr-row" style="--n:1">${villageHTML(land)}</div>`:''}${land===CASINO_LAND?`<div class="exr-row" style="--n:1">${casinoHTML()}</div>`:''}${FISH_LANDS[land]?`<div class="exr-row" style="--n:1">${fishCard(land)}</div>`:''}${h.split(/(?=<section )/).filter(x=>x.trim()).map(x=>`<div class="exr-row" style="--n:1">${x}</div>`).join('')}`:h+dg;  /* 지역 탐색 · 탐험 지역은 각각 한 단락씩 */
}
function openMap(land,focus){S.sel.mapLand=land;S.sel.mapFocus=focus||'';modal(mapDlg(land,focus));const mm=$('.modal');if(mm){mm.classList.add('mapmodal');const el=focus&&$('#md-'+focus);if(el)mm.scrollTop=Math.max(0,el.offsetTop-12);}}
function refreshMap(){const mm=$('.modal.mapmodal');if(!mm)return;const st=mm.scrollTop;modal(mapDlg(S.sel.mapLand,S.sel.mapFocus));const m2=$('.modal');if(m2){m2.classList.add('mapmodal');m2.scrollTop=st;}}

Object.assign(ITEMS,{snowglobe:{name:'백야의 스노우볼',type:'deco',tag:'장식품',desc:'흔들면 작은 신전 위로 눈이 내리는 유리구슬. 블라스파미아의 하얀 밤을 담았다고 한다.',icon:'<svg viewBox="0 0 48 48" aria-hidden="true"><defs><radialGradient id="sg-g" cx="40%" cy="35%" r="65%"><stop offset="0" stop-color="#dfe9f6" stop-opacity=".55"/><stop offset=".7" stop-color="#6d8fb8" stop-opacity=".25"/><stop offset="1" stop-color="#2b3f5c" stop-opacity=".5"/></radialGradient></defs><path d="M12 38h24l-2.5 6h-19z" fill="#8a7650"/><path d="M10 37h28v2.5H10z" fill="#b3a27e"/><circle cx="24" cy="21" r="15" fill="url(#sg-g)" stroke="#cfdcec" stroke-opacity=".6"/><path d="M16 31l5-8 3 4 2-3 6 7z" fill="#e8eef6" opacity=".9"/><path d="M22.5 22h3v-4h-3z" fill="#f2e3b8"/><path d="M21.5 18l2.5-3 2.5 3z" fill="#f2e3b8"/><g fill="#fff"><circle cx="17" cy="14" r=".9"/><circle cx="29" cy="12" r=".8"/><circle cx="31" cy="20" r=".7"/><circle cx="15" cy="21" r=".7"/><circle cx="24" cy="10" r=".6"/></g><path d="M15 13a11 11 0 0 1 7-5" stroke="#fff" stroke-opacity=".5" fill="none" stroke-linecap="round"/></svg>'},
  swiftdraft:{name:'신속의 물약',type:'use',target:'self',desc:'만신전 중 사용 · 이번 턴 이동 범위 +1 · 평소에 사용하면 10분 동안 행운 +1',price:50,buff:{stat:'luk',val:1,min:10}},
  windanklet:{name:'질풍의 발찌',type:'equip',slot:'acc',stats:{mov:1,luk:2},desc:'바람을 두른 발찌 · 만신전 이동 범위 +1',price:280}});
/* ───────── 만신전 ───────── */
const DEFAULT_MASS={minPlayers:8,maxPlayers:20,minRoles:{tank:2,heal:2,dps:4},gatherMinutes:30,battleMinutes:15,turnSeconds:30,hpPerExtra:0.125,
  reward:{join:{exp:200,gold:100,items:{}},kill:{exp:600,gold:300,items:{potion:2},pick:['cloak','amulet','crest']}},
  phases:[{at:100,name:'1페이즈 · 각성',atkMul:1,patterns:['single','burst']},
    {at:75,name:'2페이즈 · 분노',atkMul:1.1,patterns:['single','burst','cross','quake']},
    {at:50,name:'3페이즈 · 붕괴',atkMul:1.2,patterns:['burst','cross','ring','quake']},
    {at:25,name:'4페이즈 · 광폭',atkMul:1.35,patterns:['burst2','cross','ring','all']}]};
const MASS_NAMES=['라엘','도윤','시아','하람','유진','태오','리아','건우','소미','이든','윤슬','루카','채이','마루','세아','지호','온유','한결','나래','서윤','가온','로운','아린','해솔'];
const ROLE_JOBS={tank:['defender','warrior','knight'],heal:['priest','demigod','summoner'],dps:['infighter','mage','shooter','mystic','destroyer','salamander','dualist']};
function massCfg(){if(!S.data.mass)S.data.mass=clone(DEFAULT_MASS);return S.data.mass;}
function massEv(){const M=S.mass;return M&&activeEvents().find(e=>e.id===M.evId);}
function massRoles(M){const c={tank:0,heal:0,dps:0};M.roster.forEach(x=>c[roleOf(x.job)]++);return c;}
function massReady(M){const C=massCfg(),c=massRoles(M);return M.roster.length>=C.minPlayers&&c.tank>=C.minRoles.tank&&c.heal>=C.minRoles.heal&&c.dps>=C.minRoles.dps;}
function massNeed(M){const C=massCfg(),c=massRoles(M);return {tank:Math.max(0,C.minRoles.tank-c.tank),heal:Math.max(0,C.minRoles.heal-c.heal),dps:Math.max(0,C.minRoles.dps-c.dps)};}
function spawnMass(m,by){
  if(S.mass){toast('이미 진행 중인 만신전이 있습니다.','warn');return;}
  const C=massCfg();const e=spawnBoss(m,C.gatherMinutes,by);const T=massDef(m).title;if(T)e.title=`${T} · ${m.name}`;e.reward='참여 · 처치 보상';e.loc=e.loc;e.mass=true;
  S.mass={evId:e.id,monsterId:m.id,roster:[],leader:null,nextJoin:now()+2500,phase:'gather',chat:[]};refreshTicker();save();
  evPopup(e,m);
}
function evPopOn(){return !(S.settings&&S.settings.evPopup===false);}
function evPopup(e,m){
  if(!evPopOn()||S.battle&&!S.battle.over)return;
  const C=massCfg();
  modal(`<div class="evp"><div class="evp-k">⚠ WARNING · PANTHEON ⚠</div><h3>만신전 출현</h3><div class="evp-name">${esc(e.title)}</div>
    <dl class="evp-dl"><dt>출현 위치</dt><dd>${esc(e.loc||'')}</dd><dt>집결 시간</dt><dd>${C.gatherMinutes}분 · <span class="num" data-evp-left>${fmtLong(e.until-now())}</span> 남음</dd><dt>정원</dt><dd>${C.minPlayers}~${C.maxPlayers}인 · 1회 도전</dd><dt>보상</dt><dd>참여 · 처치 보상</dd></dl>
    <div class="row evp-btns"><button class="btn btn-ghost btn-sm" data-act="closemodal">닫기</button><button class="btn btn-primary btn-sm" data-act="evp-go">참가하러 가기</button></div>
    <p class="faint evp-note">이 팝업은 환경설정에서 끌 수 있습니다.</p></div>`);
  const mm=$('.modal');if(mm)mm.classList.add('evpm');playAlarm&&playAlarm();
}
function massAddBot(M,m){
  const need=massNeed(M);const role=need.tank?'tank':need.heal?'heal':need.dps?'dps':pick(['dps','dps','dps','tank','heal']);
  const used=new Set(M.roster.map(x=>x.name));
  const real=S.bots.find(b=>b.online&&b.status==='lobby'&&!used.has(b.name)&&roleOf(b.job)===role&&levelOk(m,b.level));
  if(real){real.status='recruit';M.roster.push({name:real.name,job:real.job,level:real.level});return real.name;}
  const name=MASS_NAMES.find(n=>!used.has(n)&&!bot(n));if(!name)return null;
  const lv=m.level+Math.floor(Math.random()*7);let job=pick(ROLE_JOBS[role]);if(lv<cfg().jobAdvanceLevel&&CLASSES[job].tier===2)job=CLASSES[job].base;
  M.roster.push({name,job,level:lv,temp:true});return name;
}
function massEnd(text,kind){const M=S.mass;if(!M)return;S.events=(S.events||[]).filter(e=>e.id!==M.evId);
  M.roster.forEach(x=>{const b=bot(x.name);if(b&&b.status==='recruit')b.status='lobby';});S.mass=null;refreshTicker();if(text)notify(text,kind||'');save();}
/* 만신전 가호: 첫 페이즈 전 무작위 1명이 뒤집힌 카드 5장 중 1장을 고른다 */
const BLESS={gold:['황금의 가호','골드 획득량 +10%','✦','황금','골드 +10%'],exp:['지혜의 가호','경험치 획득량 +10%','✧','지혜','EXP +10%'],atk:['전쟁의 가호','공격력 +5%','⚔','전쟁','공격력 +5%'],heal:['생명의 가호','회복력 +5%','✚','생명','회복력 +5%'],guard:['수호의 가호','보스에게 받는 대미지 -5%','⛨','수호','받는 피해 -5%']};
function applyBless(b,k){if(!b.bless||b.bless.pick)return;b.bless.pick=k;
  if(k==='atk')b.players.forEach(p=>p.atk=Math.round(p.atk*1.05));if(k==='heal')b.healMult=1.05;if(k==='guard')b.dmgTakenMult=0.95;
  b.log.push({t:'sys',text:`✦ 가호 · ${b.bless.by}님이 「${BLESS[k][0]}」을(를) 골랐습니다 · ${BLESS[k][1]}`});}
function blessDlg(){const b=S.battle;if(!b||!b.bless)return '';const P=b.bless.pick;const open=S.sel.blessOpen;
  return `<div class="bl-wrap"><div class="md-lbl" style="justify-content:center"><i class="lbl-d" aria-hidden="true">◆</i>만신전 · 신들의 가호</div><h3 class="bl-t">${P?`「${esc(BLESS[P][0])}」`:b.bless.me?'카드 한 장을 고르세요':'신들의 가호를 고르는 중'}</h3>
    <p class="faint bl-s">${P?`${esc(b.bless.by)}님의 선택 · ${esc(BLESS[P][1])} · 이번 만신전 동안 원정대 전원에게 적용됩니다.`:b.bless.me?'원정대를 대표해 당신이 선택되었습니다. 뒤집힌 카드 중 하나를 고르면 원정대 전원이 그 가호를 받습니다.':`원정대를 대표해 <b>${esc(b.bless.by)}</b>님이 선택되었습니다. 카드를 고르는 중…`}</p>
    <div class="bl-cards">${b.bless.cards.map((k,i)=>{const shown=P!=null;const mine=open===i;return `<button class="bl-card ${shown?'flip':''} ${mine?'mine':''}" data-act="bless-pick" data-i="${i}" ${P||!b.bless.me?'disabled':''} aria-label="${shown?esc(BLESS[k][0]):`${i+1}번 카드`}"><span class="bl-in"><span class="bl-back">✦</span><span class="bl-front"><b>${BLESS[k][2]}</b><em>${esc(BLESS[k][3])}</em><small>${esc(BLESS[k][4])}</small></span></span></button>`;}).join('')}</div>
    ${P?'<div class="row" style="justify-content:center;margin-top:14px"><button class="btn btn-primary btn-sm" data-act="closemodal">전투 시작</button></div>':''}</div>`;}
function massStart(){
  const M=S.mass;if(!M||M.phase!=='gather')return;const m=monster(M.monsterId);if(!m){massEnd();return;}
  const meIn=M.roster.some(x=>x.isMe);
  if(!meIn){massEnd(`${m.name} 만신전 원정대가 출발했습니다. 이번 출현은 종료되었습니다.`);if(S.route==='battle')render();return;}
  const C=massCfg();const n=M.roster.length;
  const mm={...m,hp:Math.round(m.hp*(1+C.hpPerExtra*Math.max(0,n-C.minPlayers))),hpScale:0,min:n};
  const members=M.roster.map(x=>x.isMe?{id:'me',name:S.me.name,job:S.me.job,level:S.me.level,equip:effEquip(),isMe:true,enh:S.me.enh}:{id:x.name,name:x.name,job:x.job,level:x.level,equip:{}});
  const b=createBattle(mm,members,Math.random,{...cfg(),turnSeconds:C.turnSeconds});
  {const mf=b.players.find(x=>x.isMe);if(mf)['maxHp','atk','def','luk'].forEach(k=>{const v=itemBonus(k);if(v){mf[k]+=v;if(k==='maxHp')mf.hp+=v;}});hpStart(mf);}
  const MD=massDef(m);b.grid=true;b.pats=MD.patterns;b.massTitle=MD.title;b.reward=MD.reward;b.phases=clone(MD.phases).sort((a,c)=>c.at-a.at);b.phase=0;b.baseAtk=m.atk;b.mon.atk=m.atk;
  gridPlace(b,Math.random);b.turn=0;b.log=b.log.slice(0,1);b.log.push({t:'sys',text:`만신전 · ${n}인 · 10×10 전장 · 제한 ${C.battleMinutes}분 · 한 칸 최대 ${CELL_CAP}명`});
  {const ev=(S.events||[]).find(x=>x.id===M.evId);const land=ev&&ev.land;if(land&&isSnow(landW(land))){b.snow=true;b.log.push({t:'warn',text:`❄ 눈보라 · ${LANDS[land]} · 이동 범위 보너스 무효(3×3 고정), 이동 시 25% 확률로 발이 묶임`});}}
  startTurn(b,Math.random);
  placeBegin(b);
  b.ctx={type:'mass',ev:M.evId};b.endsAt=now()+C.battleMinutes*60000;b.rules.exp=0;b.rules.gold=0;b.rules.drops=[];
  {const by=pick(M.roster);const ks=Object.keys(BLESS);for(let i=ks.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[ks[i],ks[j]]=[ks[j],ks[i]];}b.bless={by:by.isMe?S.me.name:by.name,me:!!by.isMe,cards:ks,pick:null};S.sel.blessOpen=null;
    if(!by.isMe){const bid=b.id;later(rnd(2500,5000),()=>{const B=S.battle;if(B&&B.id===bid&&B.bless&&!B.bless.pick){const i=Math.floor(Math.random()*B.bless.cards.length);S.sel.blessOpen=i;applyBless(B,B.bless.cards[i]);save();if(S.route==='battle')render();if($('.modal.bless'))showBless(true);else toast(`${B.bless.by}님이 「${BLESS[B.bless.pick][0]}」을(를) 골랐습니다.`,'good');}});}}
  b.deadline=now()+PLACE_SEC*1000+120000;   /* 위치 선정이 끝나면 placeDone이 첫 턴 시간을 다시 잡음 */
  M.phase='battle';S.battle=b;resetAct();S.sel.gmode='fight';S.sel.gcell=null;S.sel.gitem=null;
  S.route='battle';save();render();notify(`${m.name} 만신전 시작 · ${n}인`,'good');
  showBless(false);
}
/* ── 만신전 시작 위치 선정 (유저 요청 2026-11-07) ──
   가호를 고른 뒤 60초 동안 지도 칸을 눌러 설 자리를 고름(보스 칸 빼고 아무 곳, 한 칸 최대 CELL_CAP명 · 먼저 고른 사람 우선).
   모두 고르면 바로, 60초가 지나면 안 고른 사람은 역할에 맞는 자리로 자동 배치하고 레이드 시작.
   b.place={t0,go,until,auto:{id:칸},botAt:{id:시각},done:{id:1}} · 서버 공유 전투에서는 공대장 화면이 진행(파티원은 party_act turn -3). */
const PLACE_SEC=60,PLACE_BLESS_WAIT=25000;
function placeBegin(b){const auto={};b.players.forEach(p=>{auto[p.id]=p.pos;p.pos=null;});b.place={t0:now(),go:null,until:null,auto,botAt:{},done:{}};}
function placeHost(b){return !b.shared||(typeof ptHost==='function'&&ptHost(b));}
function placeBotish(p){return !p.isMe&&!p.real;}
function placeOk(b,i){return i>=0&&i<GRID*GRID&&!BOSS_CELLS.includes(i)&&b.players.filter(p=>p.pos===i).length<CELL_CAP;}
function placeSet(b,p,i){if(!b.place||!placeOk(b,i)&&p.pos!==i)return false;p.pos=i;b.place.done[p.id]=1;return true;}
function placeAutoCell(b,p){const a=b.place&&b.place.auto[p.id];if(a!=null&&placeOk(b,a))return a;
  const want=p.role==='tank'?1:p.role==='heal'?3:rangeR(p)>=2?2:1;const all=[...Array(GRID*GRID).keys()].filter(i=>placeOk(b,i));
  const best=all.filter(i=>bossDist(i)===want);const pool=best.length?best:all;return pool[Math.floor(Math.random()*pool.length)];}
function placeStartClock(b){if(!b.place||b.place.go)return;b.place.go=now();b.place.until=b.place.go+PLACE_SEC*1000;
  b.players.forEach(p=>{if(placeBotish(p))b.place.botAt[p.id]=b.place.go+rnd(1500,9000);});
  b.log.push({t:'sys',text:`위치 선정 · ${PLACE_SEC}초 안에 지도에서 설 자리를 고르세요 (한 칸 최대 ${CELL_CAP}명 · 먼저 고른 사람 우선)`});}
function placeTick(b,t){if(b.prep){prepTick(b,t);return;}const P=b.place;if(!P)return;
  const el=document.querySelector('[data-place-left]');if(el)el.textContent=P.until?Math.max(0,Math.ceil((P.until-t)/1000))+'초':'가호 선택 중';
  if(P.until){const left=Math.max(0,Math.ceil((P.until-t)/1000));document.querySelectorAll('[data-timer]').forEach(x=>{x.textContent=left+'초';x.classList.toggle('low',left<=10);});}
  const pn=document.querySelector('[data-place-n]');if(pn)pn.textContent=`${b.players.filter(p=>p.pos!=null).length}/${b.players.length}`;
  if(!placeHost(b))return;
  const blessOpen=(b.bless&&!b.bless.pick)||b.blessR;
  if(blessOpen&&t-P.t0>=PLACE_BLESS_WAIT){if(b.blessR&&!b.bless){b.bless=b.blessR;delete b.blessR;}if(b.bless&&!b.bless.pick){applyBless(b,pick(b.bless.cards));if($('.modal.bless'))modal('');}}
  if(!P.go&&!((b.bless&&!b.bless.pick)||b.blessR))placeStartClock(b);
  if(!P.go)return;
  let dirty=false;
  b.players.forEach(p=>{if(placeBotish(p)&&p.pos==null&&t>=(P.botAt[p.id]||0)){placeSet(b,p,placeAutoCell(b,p));dirty=true;}});
  if(b.players.every(p=>p.pos!=null)||t>=P.until){placeDone(b);return;}
  if(dirty){save();if(S.route==='battle')renderFight();if(b.shared&&typeof ptPushSoon==='function')ptPushSoon();}}
function placeDone(b){const P=b.place;if(!P)return;const late=b.players.filter(p=>p.pos==null);
  late.forEach(p=>{p.pos=placeAutoCell(b,p);});
  b.place=null;b.prep={t0:P.t0,until:now()+PREP_SEC*1000};
  b.log.push({t:'sys',text:`전원 위치 선정 완료${late.length?` · 자동 배치 ${late.map(p=>p.name).join(', ')}`:''} · ${PREP_SEC}초 뒤 전투 시작`});
  save();if(S.route==='battle')render();prepOverlay(b);if(b.shared&&typeof ptPush==='function')ptPush();}
/* 가호·위치 선정이 끝나면 15초 세고 전투 시작 — 화면 가운데 큰 숫자(#gcount, body에 붙임) */
const PREP_SEC=15;
function prepOverlay(b){let el=document.getElementById('gcount');
  if(!b||!b.prep||b.over||S.route!=='battle'||S.battle!==b){if(el)el.remove();return;}
  const left=Math.max(0,Math.ceil((b.prep.until-now())/1000));
  if(!el){el=document.createElement('div');el.id='gcount';el.setAttribute('role','timer');el.setAttribute('aria-live','polite');el.innerHTML='<small>전투 시작까지</small><b></b><em>자리를 확인하세요</em>';document.body.appendChild(el);}
  const n=el.querySelector('b');if(n.textContent!==String(left)){n.textContent=left;n.classList.remove('gc-pop');void n.offsetWidth;n.classList.add('gc-pop');}
  el.classList.toggle('low',left<=5);}
function prepTick(b,t){prepOverlay(b);
  const left=Math.max(0,Math.ceil((b.prep.until-t)/1000));document.querySelectorAll('[data-timer]').forEach(x=>{x.textContent=left+'초';});
  if(!placeHost(b)||t<b.prep.until)return;prepDone(b);}
function prepDone(b){const P=b.prep;if(!P)return;b.prep=null;prepOverlay(null);
  if(b.endsAt)b.endsAt+=now()-P.t0;
  b.turn=0;startTurn(b,Math.random);b.deadline=now()+b.rules.turnSeconds*1000;planBots(b);
  b.log.push({t:'sys',text:'레이드 시작'});
  save();if(S.route==='battle')render();toast('전투 시작!','good');if(b.shared&&typeof ptPush==='function')ptPush();}
function placeBanner(b){if(b.prep)return `<div class="gplace" role="status"><b>위치 확정</b><span>잠시 뒤 전투가 시작됩니다 · 보스 공격 예고는 시작할 때 나옵니다</span></div>`;const P=b.place;if(!P)return '';const me=b.players.find(p=>p.isMe);
  return `<div class="gplace" role="status"><b>위치 선정</b><span>${me&&me.pos!=null?`내 자리 · ${cellName(me.pos)} (다른 칸을 눌러 바꿀 수 있음)`:'지도에서 설 자리를 누르세요'}</span><span class="num">선정 <em data-place-n>${b.players.filter(p=>p.pos!=null).length}/${b.players.length}</em> · 남은 시간 <em data-place-left>${P.until?Math.max(0,Math.ceil((P.until-now())/1000))+'초':'가호 선택 중'}</em></span></div>`;}
function showBless(anim){modal(blessDlg());const mm=$('.modal');if(mm)mm.classList.add('bless');const B0=S.battle;if(B0&&B0.bless&&B0.bless.pick){const bid=B0.id;clearTimeout(showBless._t);showBless._t=setTimeout(()=>{const B=S.battle;if(B&&B.id===bid&&$('.modal.bless'))modal('');},anim?3200:2200);}  /* 가호가 정해지면 잠시 보여 준 뒤 자동으로 닫음 */if(anim){const cs=$$('.modal .bl-card');cs.forEach(c=>c.classList.remove('flip'));setTimeout(()=>cs.forEach((c,i)=>setTimeout(()=>c.classList.add('flip'),c.classList.contains('mine')?0:650+i*90)),40);}}
function massTick(t){
  const M=S.mass;if(!M||M.phase!=='gather')return;
  const m=monster(M.monsterId);const C=massCfg();
  if(!massEv()){if(massReady(M))massStart();else{massEnd('집결 인원이 부족해 만신전이 종료되었습니다.','warn');if(S.route==='battle')render();}return;}
  if(t>=M.nextJoin&&M.roster.length<C.maxPlayers&&m){M.nextJoin=t+rnd(1500,3500);const n=massAddBot(M,m);if(n&&!M.leader)M.leader=n;
    if(M.roster.length>=C.maxPlayers){massStart();return;}
    save();if(S.route==='battle'&&(S.sel.rtab||'daily')==='event'&&!S.battle&&!document.activeElement.matches('input,textarea,select'))render();}
}
function massPanel(){
  const M=S.mass;const C=massCfg();
  const rules=`<div class="panel"><h3>만신전 규칙</h3><ul class="mass-rules">
    <li>정원 ${C.minPlayers}~${C.maxPlayers}인 · 최소 구성 탱커 ${C.minRoles.tank} · 힐러 ${C.minRoles.heal} · 딜러 ${C.minRoles.dps} · 인원이 많을수록 보스 HP 증가 (1인당 +${Math.round(C.hpPerExtra*100)}%)</li>
    <li>${GRID}×${GRID} 전장 · 한 칸에 최대 ${CELL_CAP}명 · 보스는 가운데 2×2 칸</li>
    <li>행동은 <b>이동</b>(기본 3×3) · <b>전투</b>(공격 · 스킬) · <b>대기</b> 중 하나. 이동과 전투는 함께 할 수 없고, 아이템은 다른 행동과 함께 쓸 수 있습니다.</li>
    <li>사거리 안(3×3 · 5×5 클래스별)에 보스가 있어야 공격할 수 있습니다. 회복은 시전자 기준 5×5 칸 안의 아군에게만 닿습니다. 붉은 칸 예고를 보고 이동해서 피하세요.</li>
    <li>모두 제출한 행동은 실시간으로 공개되고, 전원 제출 시 바로 판정합니다.</li>
    <li>출현 ${C.gatherMinutes}분 동안 집결 · 전투 제한 ${C.battleMinutes}분 · <b>1회 도전</b>(실패하면 이벤트 종료)</li>
    ${(()=>{const RW=massDef(S.mass?monster(S.mass.monsterId):null).reward;return `<li>보상 · 참여 EXP ${RW.join.exp} · ${RW.join.gold}골드 / 처치 시 추가 EXP ${RW.kill.exp} · ${RW.kill.gold}골드${itemsText(RW.kill.items)?' · '+itemsText(RW.kill.items):''}${(RW.kill.pick||[]).length?` · 장비 1개 (${RW.kill.pick.map(k=>ITEMS[k]?ITEMS[k].name:k).join(' / ')})`:''}</li>`;})()}</ul></div>`;
  const em=S.data.monsters.filter(m=>m.published&&mkind(m)==='event');
  const admin=isAdmin()?`<div class="panel"><h3>운영 · 만신전</h3><div class="list">${em.map(m=>`<div class="li"><div class="t"><b>${esc(m.name)}</b><small>LV${m.level}+ · 8인 기준 HP ${m.hp} · 공격력 ${m.atk}</small></div><button class="btn btn-sm" data-act="ev-spawn" data-id="${m.id}" ${S.mass?'disabled':''}>${S.mass&&S.mass.monsterId===m.id?'출현 중':`${C.gatherMinutes}분 출현`}</button></div>`).join('')||'<p class="empty">이벤트 몬스터가 없습니다. 운영 › 몬스터에서 분류를 event로 등록하세요.</p>'}</div>
    <p class="faint" style="font-size:12px;margin-top:8px">퀘스트 이름 · 몬스터 스탯 · AOE · 보상은 운영 › 만신전 탭에서 설정합니다.</p></div>`:'';
  if(!M)return `<div class="panel"><p class="empty">지금 출현한 만신전 보스가 없습니다. 보스가 나타나면 전광판과 알림으로 알려 드립니다.</p></div>${rules}${admin}`;
  const m=monster(M.monsterId);const ev=massEv();const c=massRoles(M);const need=massNeed(M);const meIn=M.roster.some(x=>x.isMe);const busy=busyReason();
  const lr=m?levelReason(m,S.me.level)||(m.id==='guardian'?summusLock():''):'';const leader=M.leader;const iLead=leader===S.me.name;
  const left=ev?Math.max(0,ev.until-now()):0;
  return `<div class="panel mass-card"><div class="boss">${monPic(m)}<div class="stack" style="gap:8px">
      <div class="row" style="gap:6px"><span class="chip warn">만신전</span><span class="chip">${esc(ev?ev.loc:'')}</span><span class="chip num">집결 마감 ${fmtDur(left)}</span></div>
      ${massDef(m).title?`<p class="md-lbl" style="margin:0">${esc(massDef(m).title)}</p>`:''}<h2 class="mname" style="font-size:24px">${esc(m.name)}</h2><p class="muted" style="font-size:13px">${esc(m.desc||'')}</p>
      <div class="row" style="gap:6px"><span class="chip num">LV${m.level}+</span><span class="chip num">${M.roster.length} / ${C.maxPlayers}명</span>
        ${['tank','heal','dps'].map(r=>`<span class="chip ${r} ${need[r]?'':'dim'}">${ROLE[r]} ${c[r]}/${C.minRoles[r]}</span>`).join('')}</div>
      <p class="${massReady(M)?'ok-t':'reason'}" style="font-size:12.5px">${massReady(M)?`출발 조건 충족 · ${C.maxPlayers}명이 모이면 자동 출발${iLead?' · 공대장은 지금 출발할 수 있습니다':''}`:`출발 조건 · 최소 ${C.minPlayers}명${need.tank||need.heal||need.dps?` · 부족: ${missText(need)}`:''}`}</p>
      <div class="row">${meIn?`<button class="btn" data-act="mass-leave">집결 취소</button>${iLead&&massReady(M)?'<button class="btn btn-primary" data-act="mass-go">지금 출발</button>':''}`
        :`<button class="btn btn-primary" data-act="mass-join" ${lr||(busy&&!meIn)||M.roster.length>=C.maxPlayers?'disabled':''}>원정대 참가</button>${lr?`<span class="reason">${esc(lr)}</span>`:busy?`<span class="reason">${esc(busy)}</span>`:''}`}</div>
    </div></div>
    ${meIn?`<div style="margin-top:14px">${chatPanel({lock:S.mass||!S.party?'raid':'party'})}</div>`:''}<div class="mass-roster">${M.roster.map(x=>`<span class="mr ${roleOf(x.job)} ${x.isMe?'me':''}">${x.name===leader?'<b title="공대장">★</b>':''}${esc(x.name)}<small>${CLASSES[x.job].name} · LV${x.level}</small></span>`).join('')||'<p class="empty">아직 참가자가 없습니다.</p>'}</div></div>${rules}${admin}`;
}
/* 그리드 전투 화면 */

function raidUnit(name){const b=S.battle;if(b&&b.grid){const p=b.players.find(x=>x.name===name);if(p)return {p,b};}
  const M=S.mass;const r=M&&M.roster.find(x=>x.name===name);if(!r)return null;const st=r.isMe?myStats():statsFor(r.job,r.level,{});return {p:{name:r.name,job:r.job,level:r.level,role:roleOf(r.job),isMe:!!r.isMe,hp:st.maxHp,maxHp:st.maxHp,atk:st.atk,def:st.def,luk:st.luk,buffs:[],dead:false},b:null};}
function unitCard(p,b,close){
  const face=p.isMe&&S.me.portrait?`<img src="${S.me.portrait}" alt="">`:`<span class="uc-sig ${p.role}">${clsIc(p.job)}</span>`;
  const st=[];if(b){const T=b.turn;if(p.dead)st.push('쓰러짐');if(p.poison)st.push(`${p.poison.name} ${p.poison.turns}턴`);if(p.hot)st.push(`블레스 ${p.hot.turns}턴`);if(p.protect)st.push('보호');if(supActive(b)&&b.sup.by===p.id)st.push('제압(도발) 중');p.buffs.filter(x=>x.from<=T&&x.to>=T).forEach(x=>st.push(BUFFN[x.k]||x.k));}
  return `<div class="ucard"><div class="uc-face">${face}</div><div class="uc-main"><div class="row" style="justify-content:space-between;gap:6px"><b>${esc(p.name)}</b>${close?`<button class="ibtn sm" data-act="${close}" data-id="" aria-label="닫기">✕</button>`:''}</div>
    <div class="row" style="gap:4px">${roleChip(p.job)}<span class="chip num dim">LV${p.level}</span>${b&&p.pos!=null?`<span class="chip num dim">${cellName(p.pos)}</span>`:''}</div></div></div>
    <div class="gt-row"><span>HP</span><div class="bar hp" title="${p.hp}/${p.maxHp}"><i style="width:${pct(p.hp,p.maxHp)}%"></i></div><b class="num">${p.hp}/${p.maxHp}</b></div>
    <div class="gt-row"><span>MP</span><div class="bar mp"><i style="width:${p.maxMp?Math.round((p.mp??p.maxMp)/p.maxMp*100):0}%"></i></div><b class="num ${p.maxMp?'':'faint'}">${p.maxMp?(p.mp??p.maxMp):'—'}</b></div>
    <ul class="statline num sm">${statIcon('atk',p.atk)}${statIcon('def',p.def)}${statIcon('luk',p.luk)}</ul>
    ${st.length?`<div class="gt-s">${st.map(esc).join(' · ')}</div>`:''}${b?`<div class="gt-s faint">행동 · ${esc(gActLabel(b,p))}</div>`:''}`;}
function openRaidWho(name,btn){const key='r:'+name;if(S.sel.rmem===key){closeRmem();return;}closeRmem();const u=raidUnit(name);if(!u){openUinfo(name,btn);return;}
  S.sel.rmem=key;$('#rmenu').innerHTML=`<div class="rmenu gtip-f">${unitCard(u.p,u.b)}</div>`;placeFloat(btn,240);}
function raidRole(name){const u=raidUnit(name);return u?u.p.role:'';}
function massTarget(b){
  const sup=supActive(b)?b.players.find(p=>p.id===b.sup.by):null;const tel=b.tel;const ord=threatOrder(b);
  const single=tel&&(tel.type==='single'||tel.type==='dot');const t1=single?(b.players.find(p=>p.id===tel.target)||ord[0]):ord[0];const t2=ord.find(p=>p!==t1);
  const why=p=>!p?'':p===sup?`제압 ×${b.sup.mult}`:b.attention===p.id?'시야 강탈':p.role==='tank'?'탱커 우선':'누적 위협';
  const nm=p=>p?`<button class="who w-${p.role}" data-act="g-tok" data-id="${esc(p.id)}">${esc(p.name)}</button><span class="faint">(${why(p)})</span>`:'<span class="faint">없음</span>';
  let h=`<div class="mtg"><span class="mtg-l">제 1 타겟</span>${nm(t1)}${single?'':'<span class="faint">· 이번 턴은 범위 공격, 다음 단일 공격 대상</span>'}</div><div class="mtg"><span class="mtg-l">제 2 타겟</span>${nm(t2)}</div>`;
  if(sup){const dps=b.players.filter(p=>p.role==='dps').reduce((a,p)=>a+p.dealt,0);const lim=Math.max(1,sup.dealt)*b.sup.mult;
    h+=`<div class="mtg"><span class="mtg-l">도발 수치</span><b class="w-tank">${esc(sup.name)}</b><span class="faint">제압 ${sup.supUses}회차 · ${b.sup.mult}배</span><div class="bar mtg-bar" title="딜러 총 대미지 ${dps} / 유지 한도 ${lim} (${esc(sup.name)} 대미지 ${sup.dealt} × ${b.sup.mult})"><i style="width:${pct(Math.min(dps,lim),lim)}%"></i></div><span class="num faint">${dps} / ${lim}</span></div>`;}
  else h+=`<div class="mtg"><span class="mtg-l">도발 수치</span><span class="faint">제압한 탱커 없음 · 탱커 → 누적 대미지·회복량 순으로 표적</span></div>`;
  return h;}
function gridBoard(b,me){
  const tel=b.place||b.prep?null:b.tel;   /* 위치 선정 중엔 예고 칸 안 보임(실제 자리로 다시 정함) */const area=new Set([...(tel&&tel.type==='area'?tel.cells:[]),...(b.pend&&b.pend.type==='area'?b.pend.cells:[])]);const mode=S.sel.gmode||'fight';
  const reach=new Set(me&&!me.dead&&!me.confirmed&&mode==='move'?reachable(b,me):[]);
  const rng=me&&!me.dead?rangeR(me):0;
  let h='';
  for(let i=0;i<GRID*GRID;i++){
    if(BOSS_CELLS.includes(i)){if(i===BOSS_CELLS[0])h+=`<div class="gboss" style="grid-row:5/7;grid-column:5/7"><b>${esc(b.mon.name)}</b><small class="num">${Math.round(b.mon.hp/b.mon.maxHp*100)}%</small></div>`;continue;}
    const ps=b.players.filter(p=>p.pos===i);const [r,c]=gxy(i);
    const cls=[area.has(i)?'danger':'',reach.has(i)?'reach':'',S.sel.gcell===i&&mode==='move'?'pick':'',me&&me.pos===i?'mine':'',tel&&tel.type==='aoe'||b.pend&&b.pend.type==='aoe'?'danger':'',me&&!me.dead&&bossDist(i)<=rng&&mode!=='move'&&me.pos===i?'':''].join(' ');
    h+=`<div class="gcell ${cls}" style="grid-row:${r+1};grid-column:${c+1}" data-act="g-cell" data-i="${i}" role="button" tabindex="-1" title="${cellName(i)}${ps.length?' · '+ps.map(p=>p.name).join(', '):''}"><span class="gc-lab" aria-hidden="true">${cellName(i)}</span>${ps.map(p=>`<button class="tok ${p.role} ${p.isMe?'me':''} ${p.dead?'dead':''} ${tel&&tel.target===p.id?'tgt':''} ${S.sel.gtok===p.id?'sel':''}" data-act="g-tok" data-id="${esc(p.id)}" aria-label="${esc(p.name)} 정보">${esc(p.name.slice(0,1))}</button>`).join('')}</div>`;
  }
  const tp=S.sel.gtok&&b.players.find(p=>p.id===S.sel.gtok);
  if(tp&&tp.pos!=null){const [r,c]=gxy(tp.pos);
    h+=`<div class="gtip" style="${c>5?`right:${(10-c)*10}%`:`left:${(c+1)*10}%`};${r>5?`bottom:${(10-r)*10}%`:`top:${r*10}%`}">${unitCard(tp,b,'g-tok')}</div>`;}
  return `${placeBanner(b)}<div class="gboard${b.place?' placing':''}">${h}</div>`;
}
function gActLabel(b,p){if(p.dead)return '쓰러짐';if(!p.confirmed)return '선택 중…';const a=p.action;if(!a)return '-';
  const it=p.itemAct?` + ${ITEMS[p.itemAct.item]?ITEMS[p.itemAct.item].name:''}`:'';
  if(a.kind==='move')return `이동 → ${cellName(a.to)}${it}`;if(a.kind==='wait')return `대기${it}`;return actLabel(b,a)+it;}
const GICON={
  move:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l3 3h-2v5h5V8l3 3-3 3v-2h-5v5h2l-3 3-3-3h2v-5H6v2l-3-3 3-3v2h5V5H9z" fill="currentColor"/></svg>',
  fight:'<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h2.5L17 13.5"/><path d="M5 4v2.5L14.5 16"/><path d="M19 4h-2.5L7 13.5"/><path d="M19 4v2.5L9.5 16"/><path d="M13 17l4-4M11 17l-4-4M16.5 16.5L20 20M7.5 16.5L4 20"/></g></svg>',
  item:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6v2l-1 1h-4L9 5zM8 7h8l2.5 4.5c.6 1.1.9 2.3.9 3.5A6 6 0 0 1 13.4 21h-2.8A6 6 0 0 1 4.6 15c0-1.2.3-2.4.9-3.5z" fill="currentColor"/></svg>',
  wait:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2h12v2h-1v3a5 5 0 0 1-2.6 4.4L13 12l1.4.6A5 5 0 0 1 17 17v3h1v2H6v-2h1v-3a5 5 0 0 1 2.6-4.4L11 12l-1.4-.6A5 5 0 0 1 7 7V4H6zm3 2v3c0 1.1.7 2.1 1.7 2.6L12 10l1.3-.4A3 3 0 0 0 15 7V4z" fill="currentColor"/></svg>'};
function gfTop(b){
  const m=b.mon,ph=b.phases[b.phase]||{},al=living(b);const left=Math.max(0,Math.ceil((b.deadline-now())/1000));const bleft=Math.max(0,(b.endsAt||0)-now());
  return `<div class="gf-topin"><div class="stack" style="gap:6px;min-width:0">
      <div class="row" style="gap:6px"><span class="chip warn">만신전</span>${b.massTitle?`<span class="chip">${esc(b.massTitle)}</span>`:''}<span class="chip dps">${esc(ph.name||'')}</span><span class="chip num">${b.turn}턴</span><span class="chip num">공격 ${m.atk}</span><span class="chip num" data-mass-left>제한 ${fmtDur(bleft)}</span>${(()=>{const tel=b.tel,ord=threatOrder(b);const single=tel&&(tel.type==='single'||tel.type==='dot');const t=single?(b.players.find(p=>p.id===tel.target)||ord[0]):ord[0];return t?`<span class="chip gtgt ${t.role}-t">타겟 · ${esc(t.name)}${t.isMe?' (나)':''}</span>`:'';})()}</div>
      <div class="row" style="justify-content:space-between"><span class="mname">${esc(m.name)}</span><span class="num muted">${m.hp} / ${m.maxHp}</span></div>
      <div class="bar hp big"><i style="width:${pct(m.hp,m.maxHp)}%"></i></div></div>
    <div class="stack" style="gap:4px;min-width:0">${massTarget(b)}</div>
    <div class="gf-clock"><small>제출 ${al.filter(p=>p.confirmed).length}/${al.length}</small><span class="timer ${left<=10?'low':''}" data-timer>${left}초</span><small class="faint">전원 제출 시 바로 판정</small></div></div>`;
}
function telLine(b){const tel=b.tel,m=b.mon;if(!tel)return '';const dmg=Math.round(m.atk*(tel.mult||1));
  if(tel.type==='single'||tel.type==='dot'){const fix=b.attention?b.players.find(p=>p.id===b.attention):supActive(b)?b.players.find(p=>p.id===b.sup.by):null;const t=(fix&&!fix.dead?fix:null)||b.players.find(p=>p.id===tel.target);return `${tel.name}｜대미지 ${dmg}｜(타겟:${t?t.name:'-'})`;}
  return `${tel.name}｜대미지 ${dmg}｜광역`;}
// 다음 공격 예고: PC 전체 화면(.gfx)에서는 턴마다 잠깐 떴다 사라짐(전투 로그에는 '예고 · …'로 남음). 다시 그려도 처음부터 다시 뜨지 않게 처음 보인 시각을 기억.
const TEL_SEEN={k:'',at:0};
// 만신전 보스 대사: 패턴마다 늘 같은 대사 → 대사만 듣고 다음 공격을 알아챌 수 있게. 몬스터에 mass.lines{패턴:대사}가 있으면 그걸 씀({t}=대상 이름).
const BOSS_SAY={top:'가장 아프게 찌른 놈 — 네 놈이로구나.',single:'가장 거슬리는 놈부터 꺾어 주마.',dot:'가장 거슬리는 놈에게 독을 먹여 주지.',burst:'하나만 골라, 그 곁까지 짓밟아 주지.',burst2:'둘이다. 둘을 골라 그 곁까지 짓밟는다.',cross:'가로로, 세로로 — 땅을 갈라 주마.',quake:'내 곁에 붙은 것들부터 무너뜨린다.',ring:'멀리 숨은 쥐들, 거기까지 닿는다.',all:'피할 곳은 없다. 모두 무릎 꿇어라.'};
function bossSay(b){const tel=b.tel;if(!tel)return '';const k=tel.type==='dot'?'dot':(tel.pat||'single');
  const mm=typeof monster==='function'&&b.monsterId?monster(b.monsterId):null;const own=mm&&mm.mass&&mm.mass.lines;let line=(own&&own[k])||BOSS_SAY[k]||'';
  if(line.includes('{t}')){const fix=b.attention?b.players.find(p=>p.id===b.attention):supActive(b)?b.players.find(p=>p.id===b.sup.by):null;const t=(fix&&!fix.dead?fix:null)||b.players.find(p=>p.id===tel.target);line=line.replace(/\{t\}/g,t?t.name:'');}
  return line;}
function gfTel(b){const tel=b.tel;const aoe=tel&&tel.type!=='single'&&tel.type!=='dot';const t=esc(telLine(b));
  const k=b.id+'|'+b.turn+'|'+(tel?tel.name:'');if(TEL_SEEN.k!==k){TEL_SEEN.k=k;TEL_SEEN.at=now();}const el=now()-TEL_SEEN.at;
  const say=tel?bossSay(b):'';
  return `${say?`<div class="gsay ${aoe?'aoe':''} ${el>5000?'tel-gone':''}" role="status" style="--tel-d:-${el}ms"><p>“${esc(say)}”</p></div>`:''}<div class="gtel ${aoe?'aoe':''} ${el>5000?'tel-gone':''}" role="status" style="--tel-d:-${el}ms"><span class="gtel-k"><span class="gtel-dot"></span>다음 공격</span><div class="tk-view"><div class="tk-run" style="animation-duration:14s">${t}</div></div></div>`;}
function gfMap(b,me){return `<div class="gmz-btns" role="group" aria-label="지도 확대·축소"><button type="button" data-gmz="in" aria-label="확대">+</button><span class="gmz-r num">${Math.round(GMZ.z*100)}%</span><button type="button" data-gmz="out" aria-label="축소">−</button><button type="button" data-gmz="fit" aria-label="맞춤">맞춤</button></div>${gridBoard(b,me)}<div class="glegend one"><span><i class="lg danger"></i>예고 범위</span><span><i class="lg reach"></i>이동 가능</span><span><i class="lg pick"></i>이동 선택</span><span><i class="lg tank"></i>탱커</span><span><i class="lg heal"></i>힐러</span><span><i class="lg dps"></i>딜러</span><span class="faint">한 칸 최대 ${CELL_CAP}명</span></div>`;}
// 전투원 상태(버프·디버프) 목록 [글자, 종류] — HUD·제출 현황 공통
function pFxList(b,p){const st=[];if(p.poison)st.push([`${p.poison.name} ${p.poison.turns}턴`,'debuff']);if(p.burnP)st.push([`화상 ${p.burnP.turns}턴`,'debuff']);if(p.held>0)st.push([`속박 ${p.held}`,'debuff']);if(p.frost>0)st.push(['동상 · 이동 불가','debuff']);if(p.conf>0)st.push([`혼란 ${p.conf}`,'debuff']);if(p.bound>0)st.push([`${p.boundBy==='root'?'뿌리 속박':'빛의 속박'} ${p.bound}`,'debuff']);if(p.charm>0)st.push(['매혹','debuff']);if(p.hot)st.push([`블레스 ${p.hot.turns}턴`,'heal']);if(p.protect)st.push(['보호','buff']);(p.buffs||[]).filter(x=>x.from<=b.turn&&x.to>=b.turn).forEach(x=>st.push([BUFFN[x.k]||x.k,'buff']));return st;}
function gfSub(b,me){const al=living(b);
  return `<h3>제출 현황 <span class="num faint" style="letter-spacing:0">${al.filter(p=>p.confirmed).length}/${al.length}</span><button type="button" class="gsub-fold" data-act="sub-fold" aria-expanded="${!S.sel.subFold}" aria-label="제출 현황 ${S.sel.subFold?'펼치기':'접기'}">${S.sel.subFold?'▾':'▴'}</button></h3>
    <div class="mtabs gsubtabs" role="tablist">${[['alive',`생존 ${al.length}`],['dead',`사망 ${b.players.length-al.length}`]].map(([k,l])=>`<button role="tab" data-act="g-subtab" data-tab="${k}" aria-selected="${(S.sel.gsub||'alive')===k}">${l}</button>`).join('')}</div>
    <div class="glist">${(S.sel.gsub||'alive')==='alive'?al.slice().sort((x,y)=>x.hp/x.maxHp-y.hp/y.maxHp||x.hp-y.hp).map(p=>`<div class="gl ${p.isMe?'me':''}"><span class="tok ${p.role}">${esc(p.name.slice(0,1))}</span><b>${esc(p.name)}</b><span class="num faint">${p.pos!=null?cellName(p.pos):''}</span><span class="gbar" title="${p.hp}/${p.maxHp}"><i style="width:${pct(p.hp,p.maxHp)}%" class="${p.hp/p.maxHp<0.3?'low':''}"></i></span><span class="ga ${p.confirmed?'ok':''}" title="${esc(gActLabel(b,p))}">${esc(gActLabel(b,p))}</span><span class="gl-dmg num" title="누적 대미지">${(p.dealt||0).toLocaleString('ko-KR')}</span>${(fx=>`<span class="gl-fx" title="${esc(fx.map(x=>x[0]).join(' · '))}">${fx.map(([x,t])=>`<span class="hud-fx st-${t}">${esc(x.replace(/ \d+(턴)?$/,''))}</span>`).join('')}</span>`)(pFxList(b,p))}</div>`).join('')
      :(()=>{const dead=b.players.filter(p=>p.dead);const canRev=!me.dead&&!me.confirmed&&CLASSES[me.job].skills.includes('sinsayer');
        return dead.length?dead.map(p=>{const far=me.pos!=null&&p.pos!=null&&cheb(me.pos,p.pos)>HEAL_R;return `<div class="gl dead-row"><span class="tok ${p.role} dead">${esc(p.name.slice(0,1))}</span><b>${esc(p.name)}</b><span class="num faint">${p.pos!=null?cellName(p.pos):''}</span><span class="faint" style="font-size:11px">${className(p.job)} · LV${p.level}</span>
          ${canRev?`<button class="btn btn-sm gl-rev" data-act="g-revive" data-id="${esc(p.id)}" ${far?'disabled':''} title="${far?'회복 사거리(5×5) 밖':'스킬 탭에서 신세이어 대상으로 지정'}">${far?'사거리 밖':'부활 지정'}</button>`:''}</div>`;}).join('')+`<p class="faint" style="font-size:11.5px;margin-top:6px">${canRev?'부활 지정을 누르면 전투 › 스킬에 신세이어가 선택됩니다. 자신의 차례에 행동 확정을 눌러야 사용됩니다.':'신세이어를 가진 힐러만 부활시킬 수 있습니다.'}</p>`:'<p class="empty" style="padding:8px 2px">쓰러진 참가자가 없습니다.</p>';})()}</div>`;}
// 커맨드 아이콘 열림/닫힘 모션: 바꾼 직후 한 번만(다시 그릴 때마다 되풀이되지 않게)
const GM_ANIM={to:null,from:null,t:0};
function gmAnimMark(from,to){GM_ANIM.from=from;GM_ANIM.to=to;clearTimeout(GM_ANIM.t);GM_ANIM.t=setTimeout(()=>{GM_ANIM.from=GM_ANIM.to=null;},400);}
function gfAct(b,me){
  let mode=S.sel.gmode||'fight';if(mode==='wait'){mode='fight';S.sel.gmode='fight';}const gi=S.sel.gitem;const al=living(b);
  const CMD_EN={fight:'ATTACK',move:'MOVE',defend:'STANDBY',item:'ITEM',wait:'STANDBY'};
  const pad=`<div class="hud-cmd" role="group" aria-label="커맨드">${[['fight','전투','c-main'],['move','이동',''],['defend','대기',''],['item','아이템','']].map(([k,l,c])=>`<button class="hcmd ${c} ${mode===k?'on':''} ${GM_ANIM.to===k&&mode===k?'grow':''} ${GM_ANIM.from===k&&mode!==k?'shrink':''}" data-act="g-mode" data-mode="${k}" aria-pressed="${mode===k}" ${me.confirmed||me.dead?'disabled':''}><span class="hcmd-in">${GICON[k]}<b>${l}</b></span>${k==='item'&&gi?'<i class="hcmd-badge"></i>':''}</button>`).join('')}</div>`;
  let body='';
  if(me.dead)body=`<div class="gact-done"><p class="reason">전투 불능 상태입니다.</p><p class="muted" style="font-size:12.5px">신세이어를 가진 힐러가 부활시킬 수 있습니다. 직접 행동한 기록이 있으면 보상은 그대로 받습니다.</p></div>`;
  else if(me.confirmed)body=`<div class="gact-done"><div class="ph" style="margin:0 0 4px">제출 완료</div><p class="gact-sum">${esc(gActLabel(b,me))}</p><div class="row"><button class="btn" data-act="editact">행동 수정</button></div><p class="faint" style="font-size:12px">다른 참가자가 모두 제출하면 바로 판정합니다.</p></div>`;
  else if(mode==='move'){const tgt=S.sel.gcell;const ok=tgt!=null&&canMoveTo(b,me,tgt);
    body=`<div class="gact-h"><span class="hud-tag">MOVE</span>이동 <small>이동 범위 ${moveR(b,me)*2+1}×${moveR(b,me)*2+1}${(MOVE_BONUS[me.job]||0)+(me.mov||0)?` · 클래스·장비 보정 +${(MOVE_BONUS[me.job]||0)+(me.mov||0)}`:''}</small></div>
      <div class="gpos"><div><small>현재 위치</small><b class="num">${cellName(me.pos)}</b></div><span class="gpos-ar">→</span><div class="${ok?'on':''}"><small>이동 위치</small><b class="num">${ok?cellName(tgt):'—'}</b></div></div>
      <p class="muted" style="font-size:12.5px">전장에서 파랗게 표시된 칸을 눌러 이동할 곳을 고르세요.${b.tel&&b.tel.type==='area'&&b.tel.cells.includes(me.pos)?' <span class="reason">지금 자리는 예고 범위 안입니다.</span>':''}${ok&&b.tel&&b.tel.type==='area'&&b.tel.cells.includes(tgt)?' <span class="reason">선택한 칸도 예고 범위 안입니다.</span>':''}</p>
`;}
  else if(mode==='defend')body=`<div class="gact-h"><span class="hud-tag">STANDBY</span>대기</div><div class="gwait"><p>이번 턴 <b>아무것도 하지 않습니다</b>.</p><small class="faint">이동하거나 공격하지 않습니다.${gi?` 선택한 아이템(${esc(ITEMS[gi.item].name)})은 함께 사용됩니다.`:''}</small></div>`;
  else if(mode==='wait')body=`<div class="gact-h"><span class="hud-tag">STANDBY</span>대기</div><div class="gwait"><p>이번 턴 <b>대기</b>하시겠습니까?</p><small class="faint">움직이지도 공격하지도 않습니다.${gi?` 선택한 아이템(${esc(ITEMS[gi.item].name)})은 함께 사용됩니다.`:''}</small>
      <div class="row"><button class="btn btn-primary" data-act="g-confirm" data-kind="wait">예, 대기합니다</button><button class="btn" data-act="g-mode" data-mode="fight">아니요</button></div></div>`;
  else if(mode==='item'){const items=['potion','holywater','swiftdraft'].filter(k=>ITEMS[k]);
    body=`<div class="gact-h"><span class="hud-tag">ITEM</span>아이템 <small>자신에게만 사용 · 다른 행동과 함께 · 한 턴에 하나</small></div>
      <div class="ginv">${items.map(k=>{const n=S.me.inv[k]||0;return `<button class="invcell use ${gi&&gi.item===k?'on':''}" data-act="g-item" data-item="${gi&&gi.item===k?'':k}" ${n?'':'disabled'} title="${esc(ITEMS[k].desc)}"><img src="${itemImgSrc(ITEMS[k])}" alt=""><span class="ic-n num">${n}</span><span class="ginv-l">${esc(ITEMS[k].name)}</span></button>`;}).join('')}${Array.from({length:Math.max(0,8-items.length)}).map(()=>'<span class="invcell empty"></span>').join('')}</div>
      ${gi?`<p class="gact-sum" style="font-size:13px">선택 · ${esc(ITEMS[gi.item].name)} → 나</p>`:'<p class="muted" style="font-size:12.5px">사용할 아이템을 누르세요. 다시 누르면 선택이 풀립니다. 아이템은 자신에게만 쓸 수 있습니다.</p>'}
      ${gi?`<p class="faint" style="font-size:12px">이제 이동 · 전투 · 대기 중 하나를 골라 확정하면 함께 사용됩니다.</p>`:''}`;}
  else body=`<div class="gact-h is-fight"><span class="hud-tag">ATTACK</span>전투${gi?` <small>+ ${esc(ITEMS[gi.item].name)} 함께 사용</small>`:''}</div>${inRange(b,me)?'':`<p class="reason" style="font-size:12.5px">보스가 사거리(${rangeR(me)*2+1}×${rangeR(me)*2+1}) 밖입니다. 공격하려면 먼저 이동하세요. 지원·회복 스킬은 쓸 수 있습니다.</p>`}${gridSkillPanel(b,me)}`;
  const face=S.me.portrait?`<img src="${S.me.portrait}" alt="">`:`<span class="uc-sig ${me.role}">${clsIc(me.job)}</span>`;
  const st=pFxList(b,me);
  const hpP=pct(me.hp,me.maxHp);
  return `<div class="hud ${me.dead?'is-dead':''}">
    <div class="hud-face"><div class="hud-portrait ${me.role}">${face}</div><div class="hud-nm"><b>${esc(me.name)}</b><span class="num">LV.${me.level}</span></div></div>
    <div class="hud-main">
      <div class="hud-top"><div class="hud-id"><b>${esc(me.name)}</b><span class="hud-lvl num">LV.${me.level}</span><span class="hud-cls ${me.role}">${esc(CLASSES[me.job].name)}</span>${me.pos!=null?`<span class="hud-pos num">위치 ${cellName(me.pos)}</span>`:''}${gfTgt(b,me,mode)}${st.map(([x,k])=>`<span class="hud-fx st-${k}">${esc(x)}</span>`).join('')}</div>
        <div class="hud-bars"><div class="hb hp ${hpP<30?'low':''}" title="${me.hp}/${me.maxHp}"><i style="width:${hpP}%"></i><span>HP</span><b class="num">${me.hp}<small>/${me.maxHp}</small></b></div>
          <div class="hb mp"><i style="width:${me.maxMp?Math.round((me.mp??me.maxMp)/me.maxMp*100):0}%"></i><span>MP</span><b class="num">${me.maxMp?`${me.mp??me.maxMp}<small>/${me.maxMp}</small>`:'—'}</b></div></div></div>
      <div class="hud-body gact-body">${body}</div></div>
    ${pad.replace(/<\/div>$/,gfGo(b,me,mode)+'</div>')}</div>`;
}
/* 행동 확정 버튼 — 커맨드(대기) 아래 */
function gfGoInfo(b,me,mode){if(me.dead||me.confirmed)return {on:false,attrs:''};
  if(mode==='move'){const t=S.sel.gcell,ok=t!=null&&canMoveTo(b,me,t);return {on:ok,attrs:'data-act="g-confirm" data-kind="move"'};}
  if(mode==='defend')return {on:true,attrs:`data-act="${me.bound>0?'confirmdefend':'confirmact'}"`};
  if(mode==='item')return {on:false,attrs:''};
  if(GS_GO.bound)return {on:true,attrs:'data-act="confirmdefend"'};
  return {on:!!GS_GO.valid,attrs:'data-act="confirmact"'};}
function gfGo(b,me,mode){if(me.dead)return '';
  /* 행동 확정: 글자는 항상 '행동 확정', 확정할 수 없으면 회색(비활성) */
  const g=gfGoInfo(b,me,mode);return `<button class="btn ${g.on?'btn-primary':''} hcmd-go" ${g.on?g.attrs:'disabled'}><span class="go-l">행동 확정</span></button>`;}
/* 전투 적용 대상 — 위치 옆 */
function gfTgt(b,me,mode){if(me.dead||me.confirmed)return '';if(mode==='defend')return '';if(mode!=='fight')return '';
  const a=S.sel.act||{kind:'skill',skill:basicSkill(me.job)};let n='';
  if(a.kind==='defend')n='나';
  else if(a.kind==='skill'&&SKILLS[a.skill]){const t=SKILLS[a.skill].target;
    if(t==='enemy')n=b.mon.name;else if(t==='ally'||t==='dead'){const p=b.players.find(x=>x.id===a.target);n=p?(p.isMe?'나':p.name):'선택 필요';}else n=t==='all'||t==='party'?'파티 전체':'나';}
  return n?`<span class="hud-pos hud-tgt">대상 ${esc(n)}</span>`:'';}
const SHIELD_SVG='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l8 3v6c0 5-3.4 9.2-8 11-4.6-1.8-8-6-8-11V5z" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 6v12" stroke="currentColor" stroke-width="1.2" opacity=".6"/></svg>';
GICON.defend=GICON.wait;  /* 방어 폐지 → 대기(모래시계) */
let GS_GO={};
/* 스킬 구분: 회복 · 공격 · 보조 (이 순서로 정렬) */
const SK_CAT={heal:'회복',atk:'공격',sup:'보조'},SK_CAT_ORD={heal:0,atk:1,sup:2};
function skCat(k){const s=SKILLS[k];if(!s)return 'sup';if(s.cat)return s.cat;if(s.type==='heal')return 'heal';if(s.target==='enemy'&&(s.type==='dice'||s.type==='nodice'))return 'atk';return 'sup';}
/* 스킬마다 구분 속성(SKILLS[k].cat = heal·atk·sup)을 붙여 둠 — 화면 표시는 없고 정렬·구분용 */
for(const k in SKILLS)if(!SKILLS[k].cat)SKILLS[k].cat=skCat(k);
function gridSkillPanel(b,me){
  if(me.bound>0){GS_GO={bound:true};return `<p class="reason">빛의 속박 · ${me.bound}턴 동안 어떤 스킬도 쓸 수 없습니다. 방어만 확정할 수 있습니다.</p>`;}
  addonSane(me);
  const sk=CLASSES[me.job].skills;const basic=basicSkill(me.job);const a=S.sel.act||{kind:'skill',skill:basic};
  const list=[basic,...sk.filter(k=>k!==basic&&!['addon','passive'].includes(SKILLS[k].type))].map((k,i)=>[k,i]).sort((x,y)=>SK_CAT_ORD[skCat(x[0])]-SK_CAT_ORD[skCat(y[0])]||x[1]-y[1]).map(x=>x[0]);
  const tip=(title,body,extra)=>`<span class="sk-tip" role="tooltip"><b>${title}</b>${extra||''}<span>${body}</span></span>`;
  const slot=k=>{const s=SKILLS[k];const err=checkAct(b,me,{kind:'skill',skill:k,target:s.target==='dead'?(b.players.find(x=>x.dead)||{}).id:me.id},hooks.hasItem);
    const soft=err&&((s.target==='ally'&&err==='대상이 유효하지 않음')||err.startsWith('대상이 회복 사거리'));const hard=err&&!soft;const on=a.kind==='skill'&&a.skill===k;const bd=skillBadges(k,me,b);
    return `<button class="sks ${on?'on':''} ${k===basic?'basic':''}" data-cat="${skCat(k)}" data-act="pickact" data-kind="skill" data-skill="${k}" ${hard?'disabled':''} aria-label="${esc(s.name)}"><img src="${skillImg(k)}" alt=""><span class="sks-n">${esc(s.name)}</span>${tip(`${esc(s.name)} <small>${s.en}</small>`,esc(s.desc),(bd?`<span class="row" style="gap:3px">${bd}</span>`:'')+(hard?`<em>${esc(err)}</em>`:''))}</button>`;};
  const addons=sk.filter(k=>SKILLS[k].type==='addon'&&!(SKILLS[k].lv&&me.level<SKILLS[k].lv));const isDice=a.kind==='skill'&&SKILLS[a.skill]&&SKILLS[a.skill].type==='dice';
  /* 이중 선택(함께 쓰는) 스킬: 앞쪽에 붉은 띠, 뒤에 + 표시 후 나머지 스킬 */
  const addonHTML=addons.map(k=>{const ad=SKILLS[k];const ok=usesLeft(me,k)>0&&(!isDice||!ad.with||ad.with.includes(a.skill));const armed=a.addon===k||S.sel.addonArm===k;
    return `<button class="sks addon ${armed?'on':''}" data-act="pickaddon" data-skill="${k}" ${ok?'':'disabled'} aria-pressed="${armed}" aria-label="${esc(ad.name)}"><img src="${skillImg(k)}" alt=""><span class="sks-n">${esc(ad.name)}</span>${tip(esc(ad.name),esc(ad.desc)+' · 켜 두고 공격 스킬을 고르면 함께 사용')}</button>`;}).join('')+(addons.length?'<span class="sks-plus" aria-hidden="true">+</span>':'');
  const passive=sk.filter(k=>SKILLS[k].type==='passive').map(k=>`<p class="faint" style="font-size:12px">패시브 · ${SKILLS[k].name}: ${esc(SKILLS[k].desc)}</p>`).join('');
  const needT=x=>x&&((x.kind==='skill'&&SKILLS[x.skill]&&['ally','dead'].includes(SKILLS[x.skill].target)));
  const aerr=a.kind==='skill'&&SKILLS[a.skill]?checkAct(b,me,a,hooks.hasItem):null;const valid=a.kind!=='none'&&!(needT(a)&&!a.target)&&!(aerr&&!(needT(a)&&!a.target));
  GS_GO={valid};const tp=a.kind==='skill'&&SKILLS[a.skill]&&SKILLS[a.skill].target==='enemy'?'':targetPick(b,a);  /* 적 대상은 HUD 위치 옆에 표시 */
  return `<div class="sks-grid">${addonHTML}${list.map(slot).join('')}</div>${tp}${passive}
    <div class="row"><span class="muted" style="font-size:12.5px">선택: ${esc(a.kind==='defend'?'대기':actLabel(b,a))}${aerr&&!(needT(a)&&!a.target)?` · <span class="reason">${esc(aerr)}</span>`:''}</span></div>`;
}
function gridParts(){const b=S.battle,me=b.players.find(p=>p.isMe);
  const set=(id,html)=>{const el=document.getElementById(id);if(el&&el._h!==html){el.innerHTML=html;el._h=html;}};
  set('gf-top',gfTop(b));set('gf-tel',gfTel(b));set('gf-map',gfMap(b,me));set('gf-sub',gfSub(b,me));set('gf-act',gfAct(b,me));set('gf-qs',gfQs(b,me));set('gf-rank2',gfRank(b));set('dmgrank',dmgRank(b));
  const lg=$('#blog');if(lg){lg.innerHTML=logHTML();lg.scrollTop=lg.scrollHeight;}}
/* 만신전 전체 화면(≥1101px): 지도 확대·축소·맞춤 — 휠(커서 기준)·끌어서 이동·더블클릭 맞춤. 값은 #gf-map 의 CSS 변수(다시 그려도 유지) */
const GMZ={z:1,x:0,y:0};
function gmzApply(){const m=document.getElementById('gf-map');if(!m)return;m.style.setProperty('--gz',GMZ.z);m.style.setProperty('--gx',GMZ.x+'px');m.style.setProperty('--gy',GMZ.y+'px');const r=m.querySelector('.gmz-r');if(r)r.textContent=Math.round(GMZ.z*100)+'%';}
function gmzZoom(f,cx,cy){const m=document.getElementById('gf-map');if(!m)return;const R=m.getBoundingClientRect();const z0=GMZ.z,z1=Math.max(0.6,Math.min(3,z0*f));if(z1===z0)return;
  const px=(cx==null?R.width/2:cx-R.left)-R.width/2,py=(cy==null?R.height/2:cy-R.top)-R.height/2;GMZ.x=px-(px-GMZ.x)*z1/z0;GMZ.y=py-(py-GMZ.y)*z1/z0;GMZ.z=z1;gmzApply();}
function gmzFit(){GMZ.z=1;GMZ.x=0;GMZ.y=0;gmzApply();}
function initGridZoom(){const m=document.getElementById('gf-map');if(!m||m._gmz)return;m._gmz=1;gmzApply();
  m.addEventListener('wheel',e=>{if(!matchMedia('(min-width:1101px)').matches)return;e.preventDefault();gmzZoom(e.deltaY<0?1.15:1/1.15,e.clientX,e.clientY);},{passive:false});
  let drag=null,moved=false;
  m.addEventListener('pointerdown',e=>{if(!matchMedia('(min-width:1101px)').matches||e.button!==0||e.target.closest('.gmz-btns'))return;drag={x:e.clientX,y:e.clientY,ox:GMZ.x,oy:GMZ.y};moved=false;});
  addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!moved&&Math.hypot(dx,dy)<5)return;moved=true;m.classList.add('dragging');GMZ.x=drag.ox+dx;GMZ.y=drag.oy+dy;gmzApply();});
  addEventListener('pointerup',()=>{drag=null;m.classList.remove('dragging');});
  m.addEventListener('click',e=>{if(moved){e.stopPropagation();e.preventDefault();moved=false;}},true);
  m.addEventListener('dblclick',e=>{if(e.target.closest('.gmz-btns'))return;gmzFit();});
  m.addEventListener('click',e=>{const b=e.target.closest('[data-gmz]');if(!b)return;const k=b.dataset.gmz;if(k==='in')gmzZoom(1.25);else if(k==='out')gmzZoom(0.8);else gmzFit();});}
// 만신전 채팅·로그 창 크기(PC): 오른쪽 위 모서리를 끌어 조절, 다시 그려도 유지
const GCL={w:0,h:0};
(function(){if(typeof document==='undefined')return;let st=null;
  document.addEventListener('pointerdown',e=>{const h=e.target.closest&&e.target.closest('.gcl-rz');if(!h)return;const box=h.parentElement.getBoundingClientRect();
    st={x:e.clientX,y:e.clientY,w:box.width,h:box.height};e.preventDefault();try{h.setPointerCapture(e.pointerId);}catch(_){}});
  document.addEventListener('pointermove',e=>{if(!st)return;const maxW=innerWidth-40,maxH=innerHeight-140;
    GCL.w=Math.round(Math.min(maxW,Math.max(260,st.w+e.clientX-st.x)));GCL.h=Math.round(Math.min(maxH,Math.max(140,st.h-(e.clientY-st.y))));
    const el=document.querySelector('.gfx .gf-cl');if(el){el.style.setProperty('--gcl-w',GCL.w+'px');el.style.setProperty('--gcl-h',GCL.h+'px');}});
  const end=()=>{if(st){st=null;const m=document.querySelector('.gfx .gf-cl .msgs');if(m)m.scrollTop=m.scrollHeight;}};
  document.addEventListener('pointerup',end);document.addEventListener('pointercancel',end);})();
/* 만신전 퀵슬롯(PC ≥1101px): 4칸, 가로/세로, 끌어서 자유 배치, 칸마다 스킬·파티원(대상, 'pt:이름')·아이템을 지정. 저장: S.me.qslot={s:[4],dir:'h'|'v',x,y} */
const QS_ITEMS=['potion','holywater','swiftdraft'];
function qsCfg(){const q=S.me.qslot||(S.me.qslot={s:[null,null,null,null],dir:'h',x:null,y:null});if(!Array.isArray(q.s)||q.s.length!==4)q.s=[0,1,2,3].map(i=>(q.s||[])[i]||null);return q;}
function qsPosStyle(){const q=qsCfg();return q.x!=null&&q.y!=null?`left:${q.x}px;top:${q.y}px;right:auto;bottom:auto`:'';}
function qsOptions(me){const sk=CLASSES[me.job].skills;const basic=basicSkill(me.job);
  const skills=[basic,...sk.filter(k=>k!==basic&&SKILLS[k]&&SKILLS[k].type!=='passive'&&!(SKILLS[k].lv&&me.level<SKILLS[k].lv))];
  return [...skills.map(k=>({v:'sk:'+k,name:SKILLS[k].name,img:skillImg(k)})),...QS_ITEMS.filter(k=>ITEMS[k]).map(k=>({v:'it:'+k,name:ITEMS[k].name,img:itemImgSrc(ITEMS[k])}))];}
function qsParty(b){return (b&&b.players||[]).slice().sort((x,y)=>(y.isMe?1:0)-(x.isMe?1:0));}
function gfQs(b,me){const q=qsCfg();const opts=qsOptions(me);const lock=me.confirmed||me.dead;const a=S.sel.act||{};const mode=S.sel.gmode||'fight';
  const cell=(v,i)=>{const [t,k]=v?v.split(':'):[];
    if(t==='pt'){const p=b.players.find(x=>x.name===k);const tid=S.sel.gitem?S.sel.gitem.target:a.target;const on=!!(p&&tid===p.id);
      return `<button class="gqs-s pt r-${p?p.role:'dps'} ${on?'on':''} ${p&&p.dead?'dead':''}" data-act="qs-use" data-i="${i}" ${lock||!p?'disabled':''} title="${esc(k)}${p?'':' · 이번 전투에 없음'} · 대상 지정" aria-label="대상 ${esc(k)}"><span class="gqs-pt">${esc(k.slice(0,1))}</span><small>${esc(p&&p.isMe?'나':k)}</small><b>${i+1}</b></button>`;}
    const o=v&&opts.find(x=>x.v===v);
    if(!o)return `<button class="gqs-s empty" data-act="qs-edit" data-i="${i}" title="눌러서 스킬·파티원·아이템 지정"><span>+</span></button>`;
    let on=false,dis=lock,cnt='';
    if(t==='sk'){const s=SKILLS[k];on=mode==='fight'&&a.kind==='skill'&&a.skill===k||(s.type==='addon'&&(a.addon===k||S.sel.addonArm===k));if(s.uses!=null){const u=usesLeft(me,k);cnt=`<i class="num">${u}</i>`;if(u<=0)dis=true;}}
    else{const n=S.me.inv[k]||0;on=!!(S.sel.gitem&&S.sel.gitem.item===k);cnt=`<i class="num">${n}</i>`;if(!n)dis=true;}
    return `<button class="gqs-s ${on?'on':''}" data-act="qs-use" data-i="${i}" ${dis?'disabled':''} title="${esc(o.name)}" aria-label="${esc(o.name)}"><img src="${o.img}" alt="">${cnt}<b>${i+1}</b></button>`;};
  return `<div class="gqs ${q.dir==='v'?'v':'h'}"><span class="gqs-grip" title="끌어서 옮기기" aria-hidden="true">⋮⋮</span>${q.s.map(cell).join('')}${me.dead?'':(g=>`<button class="gqs-go ${g.on?'on':''}" ${g.on?g.attrs:'disabled'} title="행동 확정">확정</button>`)(gfGoInfo(b,me,mode))}<span class="gqs-tools"><button type="button" data-act="qs-dir" title="${q.dir==='v'?'가로로':'세로로'} 바꾸기" aria-label="배열 바꾸기">${q.dir==='v'?'↔':'↕'}</button><button type="button" data-act="qs-edit" data-i="0" title="퀵슬롯 구성" aria-label="퀵슬롯 구성">⚙</button></span></div>`;}
/* 퀵슬롯 구성 창: 위에 칸 4개(고른 칸 표시) → 아래 [스킬][파티원][아이템] 구분 → 고른 구분의 목록(파티원은 검색 칸 + 목록) */
const QS_TAB_L={sk:'스킬',pt:'파티원',it:'아이템'};
function qsEditModal(focus){const b=S.battle;if(!b)return;const me=b.players.find(p=>p.isMe);const q=qsCfg();const opts=qsOptions(me);
  const i=Math.max(0,Math.min(3,+focus||0));const cur=q.s[i]||'';const ct=cur.split(':')[0];
  const tab=S.sel.qsTab&&QS_TAB_L[S.sel.qsTab]?S.sel.qsTab:(QS_TAB_L[ct]?ct:'sk');
  const label=v=>{if(!v)return '비어 있음';const [t,k]=v.split(':');if(t==='pt')return `파티원 · ${k}`;const o=opts.find(x=>x.v===v);return o?`${QS_TAB_L[t]} · ${o.name}`:'비어 있음';};
  const slotBtn=(v,j)=>`<button type="button" class="qs-slot ${j===i?'on':''}" data-act="qs-edit" data-i="${j}"><b class="num">${j+1}</b><small>${esc(label(v))}</small></button>`;
  const optBtn=o=>`<button type="button" class="qs-opt ${cur===o.v?'on':''}" data-act="qs-set" data-i="${i}" data-v="${esc(o.v)}" title="${esc(o.name)}">${o.img?`<img src="${o.img}" alt="">`:o.ic||'<span>✕</span>'}<small>${esc(o.name)}</small></button>`;
  let body='';
  if(tab==='sk')body=`<div class="qs-opts">${opts.filter(o=>o.v.startsWith('sk:')).map(optBtn).join('')}</div>`;
  else if(tab==='it')body=`<div class="qs-opts">${opts.filter(o=>o.v.startsWith('it:')).map(optBtn).join('')}</div>`;
  else{const ps=qsParty(b);body=`<p class="faint" style="font-size:12px;margin:0 0 6px">대상 지정 스킬(회복·부활·디스펠 등)이나 아이템을 먼저 누르고, 이 파티원 칸을 누르면 그 사람이 대상이 됩니다.</p>
    <input type="search" class="qs-q" data-qs-q placeholder="파티원 이름 검색" autocomplete="off" aria-label="파티원 검색">
    <div class="qs-plist" data-qs-plist>${ps.map(p=>`<button type="button" class="qs-p ${cur==='pt:'+p.name?'on':''}" data-act="qs-set" data-i="${i}" data-v="pt:${esc(p.name)}" data-n="${esc(p.name.toLowerCase())}"><span class="qs-pi r-${p.role}">${esc(p.name.slice(0,1))}</span><b>${esc(p.name)}${p.isMe?' <em>(나)</em>':''}</b><small>${esc(className(p.job))} · LV${p.level}</small></button>`).join('')}<p class="faint qs-none" hidden>찾는 파티원이 없습니다.</p></div>`;}
  modal(`<div class="row" style="justify-content:space-between"><h3>퀵슬롯 구성</h3><button class="btn btn-sm btn-ghost" data-act="closemodal">닫기</button></div>
    <p class="faint" style="font-size:12px;margin:0 0 10px">칸을 고르고, 스킬 · 파티원 · 아이템 중 넣을 것을 고르세요. 퀵슬롯은 손잡이(⋮⋮)를 끌어 옮길 수 있습니다.</p>
    <div class="qs-slots">${q.s.map(slotBtn).join('')}</div>
    <div class="row" style="justify-content:space-between;gap:8px;margin:12px 0 8px"><div class="seg qs-tabs">${Object.entries(QS_TAB_L).map(([k,l])=>`<button type="button" data-act="qs-tab" data-i="${i}" data-tab="${k}" aria-pressed="${tab===k}">${l}</button>`).join('')}</div>${cur?`<button type="button" class="btn btn-sm btn-ghost" data-act="qs-set" data-i="${i}" data-v="">이 칸 비우기</button>`:''}</div>
    ${body}`);
  const mm=$('.modal');if(mm)mm.classList.add('wide','qs-modal');const qi=$('[data-qs-q]');if(qi)setTimeout(()=>{try{qi.focus();}catch(e){}},0);}
if(typeof document!=='undefined')document.addEventListener('input',e=>{const t=e.target;if(!t||!t.matches||!t.matches('[data-qs-q]'))return;const v=t.value.trim().toLowerCase();let n=0;
  document.querySelectorAll('[data-qs-plist] .qs-p').forEach(x=>{const ok=!v||x.dataset.n.includes(v);x.hidden=!ok;if(ok)n++;});const none=document.querySelector('[data-qs-plist] .qs-none');if(none)none.hidden=n>0;});
(function(){if(typeof document==='undefined')return;let st=null;
  document.addEventListener('pointerdown',e=>{const g=e.target.closest&&e.target.closest('.gqs-grip');if(!g)return;const w=document.getElementById('gf-qs'),host=w&&w.offsetParent;if(!w||!host)return;
    const r=w.getBoundingClientRect(),h=host.getBoundingClientRect();st={dx:e.clientX-r.left,dy:e.clientY-r.top,h};e.preventDefault();try{g.setPointerCapture(e.pointerId);}catch(_){}});
  document.addEventListener('pointermove',e=>{if(!st)return;const w=document.getElementById('gf-qs');if(!w)return;const h=st.h;
    const x=Math.round(Math.max(0,Math.min(h.width-w.offsetWidth,e.clientX-h.left-st.dx))),y=Math.round(Math.max(0,Math.min(h.height-w.offsetHeight,e.clientY-h.top-st.dy)));
    w.style.left=x+'px';w.style.top=y+'px';w.style.right='auto';w.style.bottom='auto';const q=qsCfg();q.x=x;q.y=y;});
  const end=()=>{if(st){st=null;save();}};document.addEventListener('pointerup',end);document.addEventListener('pointercancel',end);})();
/* 만신전 PC: 대미지 순위(오른쪽 아래, 4위까지 + 내 순위, 접기) · 커맨드 창 투명도 */
function gfRank(b){const L=b.players.slice().sort((x,y)=>(y.dealt||0)-(x.dealt||0)||x.name.localeCompare(y.name,'ko'));const fold=!!S.sel.rankFold;const mi=L.findIndex(p=>p.isMe);
  const row=(p,i)=>`<li class="${p.isMe?'me':''} ${p.dead?'dead':''}"><span class="dr-n num">${i+1}</span><span class="dr-nm w-${p.role}">${esc(p.name)}</span><b class="num">${(p.dealt||0).toLocaleString('ko-KR')}</b></li>`;
  return `<button type="button" class="gr-h" data-act="rank-fold" aria-expanded="${!fold}"><b>대미지 순위</b>${fold&&mi>=0?`<span class="num faint">내 순위 ${mi+1}위</span>`:''}<span class="gr-ar" aria-hidden="true">${fold?'▴':'▾'}</span></button>
    ${fold?'':`<ol class="gr-list">${L.slice(0,4).map(row).join('')}${mi>=4?`<li class="gr-sep" aria-hidden="true"></li>${row(L[mi],mi)}`:''}</ol>`}`;}
function hudOp(){const v=S.me&&S.me.hudOp;return typeof v==='number'&&v>=0.15&&v<=1?v:1;}
(function(){if(typeof document==='undefined')return;
  document.addEventListener('input',e=>{const r=e.target.closest&&e.target.closest('.hud-op input');if(!r)return;const v=Math.max(15,Math.min(100,+r.value))/100;S.me.hudOp=v;const pn=r.closest('.gf-act');if(pn)pn.style.setProperty('--hud-a',v);});
  document.addEventListener('change',e=>{if(e.target.closest&&e.target.closest('.hud-op input'))save();});})();
/* 만신전 PC: 스킬 아이콘 설명은 화면 위에 떠 있는 상자로(커맨드 창 안 스크롤에 잘리지 않게) */
(function(){if(typeof document==='undefined')return;let tip=null;
  const hide=()=>{if(tip)tip.style.display='none';};
  document.addEventListener('mouseover',e=>{const el=e.target.closest&&e.target.closest('.gfx .hud .sks');
    if(!el||!matchMedia('(min-width:1101px)').matches){hide();return;}const src=el.querySelector('.sk-tip');if(!src){hide();return;}
    if(!tip){tip=document.createElement('div');tip.id='gtip';tip.className='sk-tip';tip.setAttribute('role','tooltip');document.body.appendChild(tip);}
    tip.innerHTML=src.innerHTML;tip.style.display='flex';const r=el.getBoundingClientRect(),w=tip.offsetWidth,h=tip.offsetHeight;
    tip.style.left=Math.round(Math.max(8,Math.min(innerWidth-w-8,r.left+r.width/2-w/2)))+'px';tip.style.top=Math.round(Math.max(8,r.top-h-10))+'px';});
  document.addEventListener('pointerdown',e=>{if(!(e.target.closest&&e.target.closest('.gfx .hud .sks')))hide();});
  window.addEventListener('scroll',hide,true);})();
function vGridFight(){const b=S.battle,me=b.players.find(p=>p.isMe);
  return `<div class="wrap page gfight gfx"><div class="panel gf-top" id="gf-top">${gfTop(b)}</div><div id="gf-tel">${gfTel(b)}</div>
    <div class="gf-grid"><div class="panel gf-map" id="gf-map">${gfMap(b,me)}</div><div class="panel gsub gf-sub" id="gf-sub">${gfSub(b,me)}</div><div class="panel gf-chat gf-cl" style="${GCL.w?`--gcl-w:${GCL.w}px;--gcl-h:${GCL.h}px`:''}"><span class="gcl-rz" aria-hidden="true" title="끌어서 크기 조절"></span><div class="mtabs gcl-tabs" role="tablist">${[['chat','채팅'],['log','전투 로그']].map(([k,l])=>`<button role="tab" data-act="g-cl" data-tab="${k}" aria-selected="${(S.sel.gcl||'chat')===k}">${l}</button>`).join('')}</div><div class="gcl-chat" ${(S.sel.gcl||'chat')==='chat'?'':'hidden'}>${chatPanel({lock:S.mass||!S.party?'raid':'party'})}</div><div class="log" id="blog" ${(S.sel.gcl||'chat')==='log'?'':'hidden'}>${logHTML()}</div></div>
      <div class="panel gf-act" style="--hud-a:${hudOp()}"><label class="hud-op" title="커맨드 창 투명도"><input type="range" min="15" max="100" step="5" value="${Math.round(hudOp()*100)}" aria-label="커맨드 창 투명도"></label><div id="gf-act">${gfAct(b,me)}</div></div><div class="panel gf-rank2" id="gf-rank2">${gfRank(b)}</div><div class="gqs-wrap" id="gf-qs" style="${qsPosStyle()}">${gfQs(b,me)}</div><div class="panel gf-rank" id="dmgrank">${dmgRank(b)}</div></div>
    </div>`;}

/* ───────── 운영 · 만신전 ───────── */
const DEFAULT_PATS={top:{name:'시선 집중',mult:1.2},single:{name:'단일 강타',mult:1.1},burst:{name:'파쇄 낙인',mult:0.9},burst2:{name:'이중 낙인',mult:0.9},cross:{name:'십자 균열',mult:0.8},quake:{name:'대지 진동',mult:1.0},ring:{name:'외곽 낙뢰',mult:0.7},all:{name:'전장 붕괴',mult:0.5}};
const PAT_DESC={top:'직전 턴까지 누적 대미지 1위 한 명 강타 · 제압 무시 · 예고에 대상 표시',single:'적개심 1위 한 명 강타 (지속 피해 확률 적용)',burst:'무작위 1명 주변 3×3',burst2:'무작위 2명 주변 3×3',cross:'무작위 1명이 선 가로·세로 줄 전체',quake:'보스 바로 옆 1칸 둘레 (근접 견제)',ring:'보스에서 3칸 이상 떨어진 외곽 (원거리 견제)',all:'전장 전체 · 피할 수 없음'};
const MASS_LINES=['붉은 칸 피해서 움직여요!','탱커분 보스 옆 붙어 주세요','힐 사거리 5×5예요, 가까이 와 주세요','다음 턴 십자 조심','페이즈 넘어갑니다','딜 넣을게요','한 칸에 둘까지만이에요'];
function massDef(m){const C=massCfg();const d=m&&m.mass||{};return {title:d.title||'',phases:clone(d.phases||C.phases),patterns:{...clone(DEFAULT_PATS),...clone(d.patterns||{})},reward:clone(d.reward||C.reward)};}
function adminMass(){
  const C=massCfg();const em=S.data.monsters.filter(m=>mkind(m)==='event');
  const id=S.sel.amass&&monster(S.sel.amass)?S.sel.amass:(em[0]||{}).id;S.sel.amass=id;const m=monster(id);
  const D=(S.sel.amDraft&&S.sel.amDraft.id===id)?S.sel.amDraft.d:{...massDef(m),stat:m?{name:m.name,region:m.region||'',desc:m.desc||'',level:m.level,hp:m.hp,atk:m.atk,def:m.def||0,singleName:m.singleName,dotName:m.dotName,dotChance:m.dotChance,dotDmg:m.dotDmg,art:m.art,published:m.published!==false}:null};
  const num=(id,v,step,min)=>`<input type="number" id="${id}" value="${v}" step="${step||1}" min="${min??0}">`;
  const rules=`<div class="panel"><h3>공통 규칙</h3><div class="am-grid">
    <label>최소 인원${num('mr-min',C.minPlayers)}</label><label>최대 인원${num('mr-max',C.maxPlayers)}</label>
    <label>최소 탱커${num('mr-tank',C.minRoles.tank)}</label><label>최소 힐러${num('mr-heal',C.minRoles.heal)}</label><label>최소 딜러${num('mr-dps',C.minRoles.dps)}</label>
    <label>집결 시간(분)${num('mr-gather',C.gatherMinutes)}</label><label>전투 제한(분)${num('mr-battle',C.battleMinutes)}</label><label>턴 제한(초)${num('mr-turn',C.turnSeconds)}</label>
    <label>추가 1인당 HP 증가(%)${num('mr-hp',Math.round(C.hpPerExtra*1000)/10,0.5)}</label></div>
    <p class="faint" style="font-size:12px;margin-top:8px">최소 인원 ≥ 탱커+힐러+딜러 최소 인원의 합이어야 합니다. 전장 ${GRID}×${GRID}, 한 칸 최대 ${CELL_CAP}명.</p>
    <div class="row" style="margin-top:10px"><button class="btn btn-primary btn-sm" data-act="mr-save">규칙 저장</button></div></div>`;
  if(!m)return `${rules}<div class="panel"><p class="empty">이벤트 보스가 없습니다.</p><button class="btn" data-act="am-new">새 보스 만들기</button></div>`;
  const st=D.stat;const arts=['spirit','beast','golem','forest','tracker','guardian','generic'];
  const equips=Object.entries(ITEMS).filter(([,it])=>it.type==='equip');
  const itemsTxt=Object.entries(D.reward.kill.items||{}).map(([k,n])=>`${k}:${n}`).join(', ');
  return `${rules}<div class="aiwrap"><nav class="aimenu panel"><h3>이벤트 보스</h3>${em.map(x=>`<button class="ai-link ${x.id===id?'on':''}" data-act="am-pick" data-id="${x.id}">${esc((x.mass&&x.mass.title)||x.name)}<small>${esc(x.name)} · LV${x.level}${x.published===false?' · 비공개':''}</small></button>`).join('')}<button class="btn btn-sm" style="margin-top:8px" data-act="am-new">＋ 새 보스</button></nav>
   <div class="stack" style="gap:16px">
    <div class="panel"><h3>퀘스트 이름</h3><input type="text" id="am-title" maxlength="30" value="${esc(D.title)}" placeholder="예) 하늘이 갈라진 밤" style="width:100%"><p class="faint" style="font-size:12px;margin-top:6px">전광판과 레이드 화면에 보스 이름 앞에 표시됩니다.</p></div>
    <div class="panel"><h3>몬스터 스탯</h3><div class="am-grid">
      <label class="wide">보스 이름<input type="text" id="am-name" value="${esc(st.name)}"></label><label>출현 지역<input type="text" id="am-region" value="${esc(st.region)}"></label>
      <label>그림<select id="am-art">${arts.map(a=>`<option ${st.art===a?'selected':''}>${a}</option>`).join('')}</select></label>
      <label class="wide">설명<input type="text" id="am-desc" value="${esc(st.desc)}"></label>
      <label>입장 레벨${num('am-level',st.level,1,1)}</label><label>HP (8인 기준)${num('am-hp',st.hp,10,1)}</label><label>공격력${num('am-atk',st.atk,1,1)}</label><label>방어력${num('am-def',st.def)}</label>
      <label>단일 공격 이름<input type="text" id="am-single" value="${esc(st.singleName)}"></label><label>지속 피해 이름<input type="text" id="am-dot" value="${esc(st.dotName)}"></label>
      <label>지속 피해 확률(0~1)${num('am-dotc',st.dotChance,0.05)}</label><label>지속 피해 (턴당)${num('am-dotd',st.dotDmg)}</label>
      <label class="chkl"><input type="checkbox" id="am-pub" ${st.published?'checked':''}> 공개 (출현 가능)</label></div></div>
    <div class="panel"><h3>AOE 설정</h3><div class="tbl-wrap"><table class="am-tbl"><thead><tr><th>패턴</th><th>표시 이름</th><th class="n">배율</th><th>범위</th></tr></thead><tbody>
      ${Object.keys(DEFAULT_PATS).map(k=>`<tr><td class="num">${k}</td><td><input type="text" id="ap-n-${k}" value="${esc(D.patterns[k].name)}"></td><td class="n"><input type="number" id="ap-m-${k}" value="${D.patterns[k].mult}" step="0.05" min="0" style="width:70px"></td><td class="faint" style="font-size:12px">${PAT_DESC[k]}</td></tr>`).join('')}</tbody></table></div>
      <div class="ph" style="margin-top:14px">페이즈 <span class="faint" style="font-weight:400;font-size:11.5px">보스 HP가 진입 % 이하가 되면 전환</span></div>
      <div class="tbl-wrap"><table class="am-tbl"><thead><tr><th class="n">진입 HP%</th><th>이름</th><th class="n">공격 배율</th><th>사용 패턴</th><th></th></tr></thead><tbody>
      ${D.phases.map((ph,i)=>`<tr><td class="n"><input type="number" id="ph-at-${i}" value="${ph.at}" min="1" max="100" style="width:64px"></td><td><input type="text" id="ph-n-${i}" value="${esc(ph.name)}"></td><td class="n"><input type="number" id="ph-m-${i}" value="${ph.atkMul||1}" step="0.05" min="0.1" style="width:70px"></td>
        <td><div class="row" style="gap:4px 10px">${Object.keys(DEFAULT_PATS).map(k=>`<label class="chkl sm"><input type="checkbox" id="ph-p-${i}-${k}" ${(ph.patterns||[]).includes(k)?'checked':''}>${esc(D.patterns[k].name)}</label>`).join('')}</div></td>
        <td><button class="ibtn sm danger" data-act="am-ph-del" data-i="${i}" aria-label="페이즈 삭제" ${D.phases.length<=1?'disabled':''}>✕</button></td></tr>`).join('')}</tbody></table></div>
      <div class="row" style="margin-top:8px"><button class="btn btn-sm" data-act="am-ph-add">＋ 페이즈 추가</button></div></div>
    <div class="panel"><h3>보상 설정 <span class="faint" style="font-weight:400;font-size:11.5px">즉시 지급</span></h3><div class="am-grid">
      <label>참여 EXP${num('rw-jexp',D.reward.join.exp)}</label><label>참여 골드${num('rw-jgold',D.reward.join.gold)}</label>
      <label>처치 추가 EXP${num('rw-kexp',D.reward.kill.exp)}</label><label>처치 추가 골드${num('rw-kgold',D.reward.kill.gold)}</label>
      <label class="wide">처치 아이템 (id:개수, 쉼표 구분)<input type="text" id="rw-kitems" value="${esc(itemsTxt)}" placeholder="potion:2, holywater:1"></label></div>
      <div class="ph" style="margin-top:12px">처치 시 장비 1개 무작위 (체크한 것 중)</div><div class="row" style="gap:4px 12px">${equips.map(([k,it])=>`<label class="chkl sm"><input type="checkbox" id="rw-pick-${k}" ${(D.reward.kill.pick||[]).includes(k)?'checked':''}>${esc(it.name)}</label>`).join('')}</div></div>
    <div class="row"><button class="btn btn-primary" data-act="am-save">저장</button><button class="btn" data-act="ev-spawn" data-id="${m.id}" ${S.mass||m.published===false?'disabled':''}>${S.mass&&S.mass.monsterId===m.id?'출현 중':`${C.gatherMinutes}분 출현시키기`}</button><button class="btn btn-ghost" data-act="am-revert">되돌리기</button></div>
   </div></div>`;
}
function readMassForm(){
  const v=id=>{const e=$('#'+id);return e?e.value:'';},n=id=>+v(id),ck=id=>{const e=$('#'+id);return !!(e&&e.checked);};
  const patterns={};Object.keys(DEFAULT_PATS).forEach(k=>patterns[k]={name:v('ap-n-'+k).trim()||DEFAULT_PATS[k].name,mult:Math.max(0,n('ap-m-'+k))});
  const phases=[];for(let i=0;$('#ph-at-'+i);i++)phases.push({at:Math.min(100,Math.max(1,n('ph-at-'+i))),name:v('ph-n-'+i).trim()||`${i+1}페이즈`,atkMul:Math.max(0.1,n('ph-m-'+i)||1),patterns:Object.keys(DEFAULT_PATS).filter(k=>ck(`ph-p-${i}-${k}`))});
  const items={};v('rw-kitems').split(',').map(x=>x.trim()).filter(Boolean).forEach(x=>{const [k,c]=x.split(':').map(y=>y.trim());if(k)items[k]=Math.max(1,parseInt(c)||1);});
  const pick=Object.keys(ITEMS).filter(k=>ck('rw-pick-'+k));
  return {title:v('am-title').trim(),patterns,phases,reward:{join:{exp:n('rw-jexp'),gold:n('rw-jgold'),items:{}},kill:{exp:n('rw-kexp'),gold:n('rw-kgold'),items,pick}},
    stat:{name:v('am-name').trim(),region:v('am-region').trim(),desc:v('am-desc').trim(),level:n('am-level'),hp:n('am-hp'),atk:n('am-atk'),def:n('am-def'),singleName:v('am-single').trim(),dotName:v('am-dot').trim(),dotChance:n('am-dotc'),dotDmg:n('am-dotd'),art:v('am-art'),published:ck('am-pub')}};
}
function validateMassForm(d){const e=[];const s=d.stat;
  if(!s.name)e.push('보스 이름을 입력하세요');if(!(s.level>=1))e.push('입장 레벨은 1 이상');if(!(s.hp>=1))e.push('HP는 1 이상');if(!(s.atk>=1))e.push('공격력은 1 이상');if(!(s.dotChance>=0&&s.dotChance<=1))e.push('지속 피해 확률은 0~1');
  if(!d.phases.length)e.push('페이즈가 최소 1개 필요합니다');d.phases.forEach((ph,i)=>{if(!ph.patterns.length)e.push(`${ph.name}: 패턴을 1개 이상 고르세요`);});
  if(!d.phases.some(ph=>ph.at>=100))e.push('진입 HP 100%인 첫 페이즈가 필요합니다');
  Object.keys(d.reward.kill.items).forEach(k=>{if(!ITEMS[k])e.push(`알 수 없는 아이템: ${k}`);});
  return e;}

const SAVE0='bleset-saga-v1';let SAVE=SAVE0;
const SAVE_V=3;
let S=null;
function freshState(){
  return {v:SAVE_V,me:null,qp:{},flags:{},claimedQ:{},claimedB:{},rewardLog:[],changeLog:[],reports:[],
    data:freshData(),
    bots:freshBots(),
    rel:{'세린':'friend','아르덴':'friend','하윤':'in'},
    chat:{world:[
      {id:uid('w'),cat:'notice',from:'운영자',text:'블레셋 전기 시제품이 열렸습니다. 기본 클래스 5종과 ★ 상위 클래스 8종을 만나 보세요.',ts:now()-3600000},
      {id:uid('w'),cat:'update',from:'운영자',text:'스킬 문서 기준 전투와 전직 시스템이 적용되었습니다.',ts:now()-1800000}],
      lobby:[
      {id:uid('m'),from:'카이로',text:'백야의 신전 공략 인원 모아 볼까요?',ts:now()-600000},
      {id:uid('m'),from:'엘라',text:'저는 아직 LV3이라 파수꾼부터 갈게요',ts:now()-420000},
      {id:uid('m'),from:'노아',text:'파수꾼 독 포자는 사제분 정화로 바로 지워 주세요',ts:now()-180000}],
      whisper:{'세린':[{id:uid('m'),from:'세린',text:'어서 와요! 모르는 거 있으면 물어보세요',ts:now()-300000}]}},
    mail:[{id:uid('ml'),from:'운영자',text:'블레셋 전기에 오신 것을 환영합니다. 첫 탐사에 쓸 보급품을 보내 드립니다.',items:{potion:3,holywater:1},ts:now()-900000,read:false,claimed:false,archived:false},{id:uid('ml'),from:'세린',text:'우편함으로 선물도 보낼 수 있대요. 필요한 거 있으면 말해 주세요!',items:{},ts:now()-400000,read:false,claimed:false,archived:false}],
    settings:{...DEF_SND},inquiries:[],
    unread:{world:0,lobby:0,party:0,whisper:{'세린':1}},
    party:null,queue:null,match:null,battle:null,recruits:[],route:'main',sel:{chatTab:'lobby',whisperTo:'세린',adminTab:'monster'}};
}
function freshData(){return {hpX2:1,monsters:ALL_MONSTERS(),quests:clone(DEFAULT_QUESTS),notices:clone(DEFAULT_NOTICES),banner:clone(DEFAULT_BANNER),config:clone(DEFAULT_CONFIG)};}
/* 저장 줄이기(메인 2026-11-06): 세이브에는 게임 데이터(S.data: 몬스터·퀘스트·공지·설정 등)를 넣지 않는다.
   불러올 때 새 블레서와 똑같이 기본값으로 다시 만들고(→ 1회 보정·스토리 퀘스트 추가·운영 콘텐츠 덮기가 그 위에 다시 적용), 블레서별 값(상점 재고)만 따로 남긴다.
   서버(cloud)에는 원본 사진(portraitSrc, 크기가 큼)도 빼고 올린다 — 이 기기 로컬에는 남김. */
function slimOut(s,cloud){if(!s)return s;const o={...s};const D=s.data||{};
  o.data={_slim:1,mk:Object.fromEntries((D.market||[]).filter(x=>x&&x.stock!=null).map(x=>[x.id,x.stock]))};
  if(cloud&&s.me&&s.me.portraitSrc){o.me={...s.me};delete o.me.portraitSrc;}return o;}
function slimIn(s){if(!s||(s.data&&!s.data._slim))return s;const mk=(s.data&&s.data.mk)||{};s.data=freshData();
  if(Object.keys(mk).length){s.data.market=clone(DEFAULT_MARKET);s.data.market.forEach(x=>{if(mk[x.id]!=null)x.stock=mk[x.id];});}return s;}
function freshBots(){return BOTS.map(([name,job,level],i)=>({name,job,level,online:![3,11,17].includes(i),status:'lobby',goldEarned:Math.round(level*level*32+(i*137%900))}));}
function migrate(s){
  const map={knight:'defender',hunter:'shooter',priest:'priest'};
  if(s.me){const old=s.me.job;s.me.job=map[old]||(CLASSES[old]?old:'defender');s.migratedFrom=old;}
  s.bots=freshBots();s.party=null;s.queue=null;s.match=null;s.battle=null;s.recruits=[];
  const custom=(s.data.monsters||[]).filter(m=>!DEFAULT_MONSTERS.some(d=>d.id===m.id)).map(m=>{const n={...clone(DEFAULT_MONSTERS[0]),...m};delete n.agi;delete n.dotPct;n.dotDmg=n.dotDmg||10;n.def=0;n.atk=60;n.hp=Math.round((m.hp||400)*0.6);return n;});
  s.data.monsters=[...clone(DEFAULT_MONSTERS),...custom];
  s.data.config={...DEFAULT_CONFIG,...s.data.config};
  (s.data.notices||[]).forEach(n=>{if(n.id==='n1')n.text=DEFAULT_NOTICES[0].text;});
  s.chat.world=s.chat.world||freshState().chat.world;
  s.v=2;return s;
}
function migrate3(s){
  const ex=new Set(s.data.monsters.map(m=>m.id));
  s.data.monsters.forEach(m=>{if(m.id==='forest'||m.id==='tracker'){m.kind='party';m.max=Math.min(m.max,4);m.target=Math.min(m.target,m.max);}if(m.id==='guardian')m.kind='weekly';if(!m.kind)m.kind='party';});
  EXTRA_MONSTERS.forEach(m=>{if(!ex.has(m.id))s.data.monsters.push(clone(m));});
  const dq=clone(DEFAULT_QUESTS);
  ['E1','E2','E3'].forEach(id=>{const i=s.data.quests.findIndex(q=>q.id===id);const n=dq.find(q=>q.id===id);if(i>=0)s.data.quests[i]=n;else s.data.quests.push(n);});
  ['S1','S2','S3'].forEach(id=>{const q=s.data.quests.find(x=>x.id===id),n=dq.find(x=>x.id===id);if(q&&!q.cond&&n)q.cond=n.cond;});
  dq.filter(q=>!s.data.quests.some(x=>x.id===q.id)).forEach(q=>s.data.quests.push(q));
  s.v=3;return s;
}
function load(){
  try{const raw=localStorage.getItem(SAVE);if(raw){let s=JSON.parse(raw);if(s&&s.v===1){s=migrate(s);s.v=2;}if(s&&s.v===2)s=migrate3(s);if(s&&s.v===SAVE_V)return slimIn(s);}}catch(e){}
  return freshState();
}
let saveT=null;
function save(){clearTimeout(saveT);saveT=setTimeout(()=>{if(!S)return;S.savedAt=Date.now();try{localStorage.setItem(SAVE,JSON.stringify(slimOut(S)));}catch(e){}if(SB_UID)cloudSave();},150);}
const cfg=()=>S.data.config;
const AREA_MON={};
function areaMons(aid){const I=MAP_INFO[aid];const spot=MAP_SPOTS.find(x=>x[0]===aid);if(!I||!spot)return [];const r=EXPLORE.find(x=>x.id===spot[3]);if(!r)return [];
  const base=FIELD_DEF.find(f=>f[0]===r.id);if(!base)return [];const lv=I.lv;
  return base[4].map(([id0,name,art,o],i)=>{const id=`fa_${aid}_${i}`;return AREA_MON[id]=AREA_MON[id]||soloMon({id,name:`${spot[2]}의 ${name}`,art,kind:'field',region:spot[2],level:lv,statLevel:lv+1,tier:'field',desc:`${spot[2]}에 나타나는 강한 필드 몬스터.`,exp:Math.round(fieldExp(lv)*1.3),gold:Math.round(fieldGold(lv)*1.2),drops:[],...o});});}
function monster(id){const m=S.data.monsters.find(x=>x.id===id);if(m)return m;if(AREA_MON[id])return AREA_MON[id];const mm=/^fa_(.+)_(\d+)$/.exec(id||'');if(mm){areaMons(mm[1]);return AREA_MON[id];}return undefined;}
const quest=id=>S.data.quests.find(q=>q.id===id);
const bot=name=>S.bots.find(b=>b.name===name);
const isFriend=n=>S.rel[n]==='friend';
function expNeed(L){const c=cfg();return Math.round(c.expBase+c.expStep*(L-1)+(c.expQuad||0)*(L-1)*(L-1));}
function myStats(){return statsFor(S.me.job,S.me.level,effEquip(),S.me.enh);}
function onlineCount(){return S.bots.filter(b=>b.online).length+1;}
function playerInfo(name){if(S.me&&name===S.me.name)return {name,job:S.me.job,level:S.me.level,online:true,status:S.battle?'battle':(S.party||S.queue)?'recruit':'lobby',isMe:true};return bot(name);}
function jobCls(job){return job?roleOf(job):'';}
const AUTO_DUR=[30,60,240,480],AUTO_EVERY=5,AUTO_EFF=0.5;
function durLabel(m){return m<60?`${m}분`:`${m/60}시간`;}
function autoOn(){return !!(S.auto&&now()<S.auto.end);}
function autoKills(a,t){return Math.floor((Math.min(t,a.end)-a.start)/(AUTO_EVERY*60000));}
function autoEst(mons,min){const ms=mons.map(id=>monster(id)).filter(Boolean);if(!ms.length)return {k:0,exp:0,gold:0};const k=Math.floor(min/AUTO_EVERY);
  const ex=ms.reduce((a,m)=>a+m.exp,0)/ms.length,gd=ms.reduce((a,m)=>a+m.gold,0)/ms.length;return {k,exp:Math.round(k*ex*AUTO_EFF*xpCut()),gold:Math.round(k*gd*AUTO_EFF)};}
function huntMons(r){return S.sel.huntArea?areaMons(S.sel.huntArea):S.data.monsters.filter(m=>m.published&&mkind(m)==='field'&&m.region===r.region);}
function huntDlg(id){
  const r=EXPLORE.find(x=>x.id===id);const fm=huntMons(r);const mode=S.sel.huntMode||'manual',dur=S.sel.huntDur||30;const d=daily();
  const e=autoEst(fm.map(m=>m.id),dur);
  return `<button class="ibtn sm md-x" data-act="closemodal" aria-label="닫기">✕</button><h3 class="sh-ttl">필드 사냥 · ${esc(fm[0]?fm[0].region:r.region)}</h3>
    <div class="hunt-modes">${[['manual','직접 사냥','몬스터 한 마리와 턴제로 직접 싸웁니다.'],['auto','자동 사냥','정한 시간 동안 자동으로 사냥하고 끝나면 보상을 한 번에 받습니다.']].map(([k,l,t])=>`<button class="hunt-mode" data-act="hunt-mode" data-id="${id}" data-v="${k}" aria-pressed="${mode===k}"><b>${l}</b><small>${t}</small></button>`).join('')}</div>
    ${mode==='auto'?`<div class="hunt-auto"><span class="md-meta">사냥 시간</span><div class="seg hunt-durs">${AUTO_DUR.map(m=>`<button data-act="hunt-dur" data-id="${id}" data-v="${m}" aria-pressed="${dur===m}">${durLabel(m)}</button>`).join('')}</div>
      <p class="hunt-est">예상 · 몬스터 약 <b>${e.k}</b>마리 · EXP 약 <b>${e.exp}</b> · 약 <b>${e.gold}</b>골드</p>
      <p class="faint" style="font-size:12px">${AUTO_EVERY}분마다 한 마리를 처치하며, 직접 사냥의 절반 효율로 계산합니다. 자동 사냥 중에도 레이드와 던전에는 참여할 수 있습니다(필드 사냥만 중복 불가). 중단하면 그때까지의 보상만 받습니다. 브라우저를 닫아도 시간은 흘러갑니다.</p></div>`:''}
    <p class="faint" style="font-size:12px;margin-top:10px">필드 사냥은 횟수 제한이 없고 경험치와 골드만 얻습니다.</p>
    <div class="row md-btns" style="margin-top:12px"><button class="btn btn-primary" data-act="hunt-go" data-id="${id}">${mode==='auto'?`자동 사냥 시작 · ${durLabel(dur)}`:'사냥 시작'}</button></div>`;
}
function autoClaim(stop){
  const a=S.auto;if(!a)return;const t=now();if(!stop&&t<a.end)return;
  const k=autoKills(a,t);const ms=a.mons.map(id=>monster(id)).filter(Boolean);const R={exp:0,gold:0,items:{}};
  {const KS=S.stats.kills=S.stats.kills||{};for(let i=0;i<k&&ms.length;i++){const m=ms[i%ms.length];R.exp+=m.exp*AUTO_EFF;R.gold+=m.gold*AUTO_EFF;KS[m.id]=(KS[m.id]||0)+1;}}
  R.exp=Math.round(R.exp*xpCut());R.gold=Math.round(R.gold);S.auto=null;
  const label=`${a.region} 자동 사냥`;const ups=grant(R,'field',{label,region:a.region});
  const got=gotText(R);S.me.exLog=[{ts:t,region:label,land:a.land,text:`${stop?'자동 사냥을 중단했다. ':''}${durLabel(a.min)} 동안 몬스터 ${k}마리를 처치했다.`,got},...(S.me.exLog||[])].slice(0,12);rec('explore',`${label} · 자동 사냥 ${durLabel(a.min)} · ${k}마리 처치`,got);
  save();render();toast(`${label} 보상 · ${k}마리${got?' · '+got:''}${ups?` · 레벨 업!`:''}`,'good');
}
function autoGain(a,t){const e=autoEst(a.mons,0);const ms=a.mons.map(id=>monster(id)).filter(Boolean);const k=autoKills(a,t);if(!ms.length)return {exp:0,gold:0};let ex=0,gd=0;for(let i=0;i<k;i++){const m=ms[i%ms.length];ex+=m.exp*AUTO_EFF;gd+=m.gold*AUTO_EFF;}return {exp:Math.round(ex*xpCut()),gold:Math.round(gd)};}
/* 자동 사냥 진행 막대는 그 사냥을 시작한 지역(또는 탐험 지역) 칸 안, 설명 아래·탐색 버튼 위에 표시 */
function autoHere(land,area){const a=S.auto;if(!a||a.land!==land)return false;if('area' in a)return (a.area||'')===(area||'');const r=EXPLORE.find(x=>x.id===land);return area?((areaMons(area)[0]||{}).region===a.region):(r&&r.region===a.region);}
function autoBar(){
  const a=S.auto;if(!a)return '';const t=now();const done=t>=a.end;const k=autoKills(a,t);const p=Math.min(100,(t-a.start)/(a.end-a.start)*100);
  return `<div class="auto-bar ${done?'done':''}"><div class="ab-t"><b>${done?'자동 사냥 완료':'자동 사냥 중'}</b><span>${esc(a.region)} · ${durLabel(a.min)}</span><span class="ab-k">처치 <b class="num" data-auto-k>${k}</b>마리</span>
    <span class="ab-left num" data-auto-left>${done?'보상 수령 대기':'남은 시간 '+fmtLong(a.end-t)}</span></div>
    <div class="bar"><i data-auto-p style="width:${p}%"></i></div>
    <div class="row ab-foot">${done?`<button class="btn btn-sm btn-primary" data-act="auto-claim">보상 받기</button>`:`<button class="btn btn-sm" data-act="auto-stop">중단하고 보상 받기</button>`}<span class="ab-gain" data-auto-gain>${gainText(autoGain(a,t))}</span></div></div>`;
}
function gainText(g){return `누적 보상 · EXP <b class="num">${g.exp}</b> · <b class="num">${g.gold}</b>골드`;
}
function fmtLong(ms){const s=Math.max(0,Math.floor(ms/1000));const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return h?`${h}:${String(m).padStart(2,'0')}:${String(x).padStart(2,'0')}`:`${m}:${String(x).padStart(2,'0')}`;}
function huntBusy(){if(autoOn())return '자동 사냥 중입니다';if(S.battle&&!S.battle.over)return '전투 중입니다';if(S.battle)return '전투 결과를 먼저 확인하세요';if(S.queue||S.match)return '랜덤 매칭 대기 중에는 필드 사냥을 할 수 없습니다';if(S.mass&&S.mass.phase==='gather'&&S.mass.roster.some(x=>x.isMe))return '만신전 원정대에 집결 중입니다';return null;}
function busyReason(){if(S.drun&&!S.drun.done)return '던전 탐사 중입니다';if(S.mass&&S.mass.phase==='gather'&&S.mass.roster.some(x=>x.isMe))return '만신전 원정대에 집결 중입니다';if(S.battle&&!S.battle.over)return '전투 중입니다';if(S.battle)return '전투 결과를 먼저 확인하세요';if(S.party)return '이미 파티에 속해 있습니다';if(S.queue||S.match)return '랜덤 매칭 대기 중입니다';return null;}

/* ───────── 성장과 보상 ───────── */
function grantExp(n){
  const me=S.me;let ups=0;me.exp+=n;
  while(me.level<cfg().levelCap&&me.exp>=expNeed(me.level)){me.exp-=expNeed(me.level);me.level++;ups++;}
  if(ups)hpFull();
  if(me.level>=cfg().levelCap)me.exp=Math.min(me.exp,expNeed(me.level));
  return ups;
}
function grant(reward,source,meta){
  const ups=grantExp(reward.exp||0);S.me.gold+=reward.gold||0;if(reward.gold>0)bump('goldEarned',reward.gold);noteItems(reward.items);
  for(const k in (reward.items||{}))if(ITEMS[k]&&ITEMS[k].type==='deco'&&reward.items[k]>0){const lb=(meta&&meta.label)||'';
    noteDeco(k,source==='mass'||source==='quest'?{t:'event',v:lb}:{t:'place',v:meta&&meta.region&&meta.region!==lb?`${meta.region} · ${lb}`:lb});}
  for(const k in (reward.items||{})){const got=addItem(k,reward.items[k]);reward.items[k]=got;}
  S.rewardLog.unshift({ts:now(),source,...meta,exp:reward.exp||0,gold:reward.gold||0,items:{...(reward.items||{})}});
  S.rewardLog=S.rewardLog.slice(0,200);
  if(ups)toast(`레벨 업! LV${S.me.level}`,'good');
  try{recFromGrant(reward,source,meta);}catch(e){}
  if(!(meta&&meta.battleId))wearNowToast(reward.items);
  return ups;
}
function itemsText(items){const e=Object.entries(items||{}).filter(([,n])=>n>0);return e.length?e.map(([k,n])=>k==='_gold'?`${n}골드`:`${ITEMS[k]?ITEMS[k].name:k}${n>1?' ×'+n:''}`).join(', '):'';}
function rewardHTML(r){return `<div class="reward"><span>EXP <b class="num">${r.exp||0}</b></span><span>골드 <b class="num">${r.gold||0}</b></span>${itemsText(r.items)?`<span>아이템 <b>${esc(itemsText(r.items))}</b></span>`:''}</div>`;}

/* ───────── 퀘스트 ───────── */
function claimKey(q,qp){return q.repeat?`${q.id}:${qp.cycle}`:q.id;}
function questStatus(q){
  let qp=S.qp[q.id];const me=S.me;
  if(q.job){const c=CLASSES[me.job];if((c.base||me.job)!==q.job)return 'hidden';if(c.tier===2&&!qp)return 'hidden';}
  if(qp&&qp.status==='active'&&!q.steps[qp.step]){delete S.qp[q.id];qp=null;}
  if(qp&&qp.status==='active'){const st=q.steps[qp.step];return st&&st.end?'claim':'active';}
  if(q.repeat&&!dailyPicks().includes(q.id))return 'hidden';
  if(q.repeat){if(S.claimedQ[`${q.id}:${kstCycle()}`])return 'doneToday';}
  else if(qp&&qp.status==='done')return 'done';
  if(typeof questCapped==='function'&&questCapped(q))return 'hidden';   // LV90 이상 퀘스트 아직 닫힘(04 QUEST_LV_CAP)
  if(me.level<q.level)return 'locked';
  if(q.prereq&&!(S.qp[q.prereq]&&S.qp[q.prereq].status==='done'))return 'locked';
  if(condReason(q))return 'locked';
  return 'available';
}
function lockReason(q){
  const r=[];if(S.me.level<q.level)r.push(`LV${q.level} 이상 필요`);
  if(q.prereq&&!(S.qp[q.prereq]&&S.qp[q.prereq].status==='done')){const p=quest(q.prereq);r.push(`선행 퀘스트: ${p?p.title:q.prereq}`);}
  const c=condReason(q);if(c)r.push(c);
  return r.join(' · ');
}
function eraseHTML(h){return h.replace(/\{\{erase:([^}]+)\}\}/g,(_,n)=>`<span class="qerase" aria-label="지워진 이름">${[...n].map((c,i)=>`<span style="--d:${i}">${c}</span>`).join('')}</span>`);}
/* 기록 불러내기(2026-11-07): 장면 글·선택 결과 속 {{mem:기록|문장}} → 그 기록(S.flags)이 있을 때만 문장이 나옴.
   {{mem:!기록|문장}} = 기록이 없을 때만, {{mem:a,b|문장}} = 모두 있을 때. 문장 안에서는 | 와 }} 를 쓰지 않음. */
function memText(t){return String(t==null?'':t).replace(/\{\{mem:([^|}]+)\|([^}]*)\}\}/g,(_,f,txt)=>f.split(',').map(x=>x.trim()).filter(Boolean).every(x=>x[0]==='!'?!S.flags[x.slice(1)]:!!S.flags[x])?txt:'').replace(/ {2,}/g,' ');}
function qTextHTML(t){t=memText(t);const m=/\s*\((탐색 › [^)]+)\)\s*$/.exec(t||'');const body=m?t.slice(0,m.index):t;
  return `<p class="qtext">${eraseHTML(esc(body))}</p>${m?`<p class="qroute"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1.5 3.5 5.5 2l5 1.5 4-1.5v10.5l-4 1.5-5-1.5-4 1.5z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M5.5 2v10.5M10.5 3.5V14" stroke="currentColor" stroke-width="1.3"/></svg><span>${esc(m[1])}</span></p>`:''}`;}
const QSTAT={hidden:['오늘 목록 아님','dim'],locked:['잠김','dim'],available:['수락 가능','ok'],active:['진행 중','warn'],claim:['보상 대기','warn'],done:['완료','dim'],doneToday:['오늘 완료','dim']};
function choiceReason(c){
  const r=c.req;if(!r)return null;
  if(r.flag&&!S.flags[r.flag])return `필요한 기록: ${FLAG_NAMES[r.flag]||r.flag}`;
  if(r.level&&S.me.level<r.level)return `LV${r.level} 이상 필요`;
  if(r.gold&&S.me.gold<r.gold)return `${r.gold.toLocaleString('ko-KR')}골드 필요 (보유 ${S.me.gold.toLocaleString('ko-KR')})`;
  if(r.item&&!(S.me.inv[r.item]>0))return `필요한 아이템: ${ITEMS[r.item]?ITEMS[r.item].name:r.item}`;
  if(r.items)for(const k in r.items){const have=S.me.inv[k]||0;if(have<r.items[k])return `필요한 아이템: ${ITEMS[k]?ITEMS[k].name:k} ${have}/${r.items[k]}`;}
  return null;
}
function validateQuest(q,all){
  const errs=[];
  if(!q||typeof q!=='object')return ['퀘스트 형식이 올바르지 않습니다'];
  if(!q.id)errs.push('id가 비어 있습니다');
  if(!q.title)errs.push('제목이 비어 있습니다');
  if(!['epic','sub','repeat'].includes(q.cat))errs.push('분류(cat)는 epic · sub · repeat 중 하나여야 합니다');
  if(!(q.level>=1))errs.push('수락 레벨은 1 이상이어야 합니다');
  if(q.repeat&&q.repeat!=='daily')errs.push('반복 주기(repeat)는 daily 또는 null이어야 합니다');
  if(q.prereq&&!all.some(x=>x.id===q.prereq))errs.push(`선행 퀘스트 ${q.prereq}가 없습니다`);
  if(q.prereq===q.id)errs.push('자기 자신을 선행 퀘스트로 둘 수 없습니다');
  if(q.cond){(q.cond.quests||[]).forEach(id=>{if(!all.some(x=>x.id===id))errs.push(`조건(cond)의 퀘스트 ${id}가 없습니다`);});if(q.cond.item&&!ITEMS[q.cond.item])errs.push('조건(cond)의 아이템이 없습니다');}
  const steps=q.steps||{};
  if(!steps[q.start])errs.push(`시작 단계 ${q.start}가 없습니다`);
  for(const [sid,st] of Object.entries(steps)){
    if(st.end){if(!st.reward)errs.push(`완료 단계 ${sid}에 보상이 없습니다`);else for(const k in (st.reward.items||{}))if(!ITEMS[k])errs.push(`${sid}: 알 수 없는 아이템 ${k}`);continue;}
    if(!st.text)errs.push(`${sid}: 상황문이 비어 있습니다`);
    if(st.battle){if(!monster(st.battle))errs.push(`${sid}: 전투 몬스터 ${st.battle}가 없습니다`);if(!steps[st.next])errs.push(`${sid}: 전투 승리 후 다음 단계 ${st.next}가 없습니다`);continue;}
    if(st.raid){if(!monster(st.raid))errs.push(`${sid}: 토벌 몬스터 ${st.raid}가 없습니다`);if(!steps[st.next])errs.push(`${sid}: 토벌 승리 후 다음 단계 ${st.next}가 없습니다`);continue;}
    if(!Array.isArray(st.choices)||!st.choices.length){errs.push(`${sid}: 선택지가 없어 진행이 끊깁니다`);continue;}
    st.choices.forEach((c,i)=>{if(!c.label)errs.push(`${sid} 선택지 ${i+1}: 문구가 비어 있습니다`);if(!steps[c.next])errs.push(`${sid} 선택지 ${i+1}: 다음 단계 ${c.next}가 없습니다`);
      if(c.req&&c.req.item&&!ITEMS[c.req.item])errs.push(`${sid} 선택지 ${i+1}: 알 수 없는 아이템 조건`);});
    if(st.choices.every(c=>c.req))errs.push(`${sid}: 모든 선택지에 조건이 있어 막힐 수 있습니다 (조건 없는 선택지 1개 권장)`);
  }
  if(steps[q.start]){
    const seen=new Set([q.start]),qu=[q.start];
    while(qu.length){const st=steps[qu.shift()];if(st&&!st.end)[...(st.choices||[]),...(st.battle||st.raid?[{next:st.next}]:[])].forEach(c=>{if(steps[c.next]&&!seen.has(c.next)){seen.add(c.next);qu.push(c.next);}});}
    Object.keys(steps).forEach(k=>{if(!seen.has(k))errs.push(`${k}: 시작 단계에서 도달할 수 없습니다`);});
    if(![...seen].some(k=>steps[k].end))errs.push('도달할 수 있는 완료 단계가 없습니다');
  }
  return errs;
}

/* ───────── 파티·매칭 ───────── */
function missingRoles(m,roles){
  const c={tank:0,dps:0,heal:0};roles.forEach(r=>c[r]++);
  return {tank:Math.max(0,m.roles.tank-c.tank),dps:Math.max(0,m.roles.dps-c.dps),heal:Math.max(0,m.roles.heal-c.heal)};
}
const sumR=o=>o.tank+o.dps+o.heal;
function missText(o){return Object.entries(o).filter(([,n])=>n>0).map(([r,n])=>`${ROLE[r]} ${n}`).join(' · ');}
function levelOk(m,lv){return lv>=m.level&&(!m.maxLevel||lv<=m.maxLevel);}
function levelReason(m,lv){if(lv<m.level)return `LV${m.level} 이상 필요 (현재 LV${lv})`;if(m.maxLevel&&lv>m.maxLevel)return `LV${m.maxLevel} 이하만 입장 (현재 LV${lv})`;return null;}
function slotReason(m,members,role,target){
  if(members.length>=target)return '파티 인원이 가득 찼습니다';
  const after=[...members.map(x=>roleOf(x.job)),role];
  const need=missingRoles(m,after);
  if(sumR(need)>target-after.length)return `남은 자리는 ${missText(need)} 몫입니다`;
  return null;
}
function partyCheck(p){
  const m=monster(p.monsterId);const mem=p.members;
  const need=missingRoles(m,mem.map(x=>roleOf(x.job)));
  const badLv=mem.filter(x=>!levelOk(m,x.level));
  return {m,count:mem.length,countOk:mem.length>=m.min&&mem.length<=m.max,need,rolesOk:sumR(need)===0,badLv,
    allReady:mem.every(x=>x.ready),get ok(){return this.countOk&&this.rolesOk&&!this.badLv.length&&this.allReady&&!p.changed;}};
}
function idleBots(){return S.bots.filter(b=>b.online&&b.status==='lobby');}
function botMember(b){return {name:b.name,job:b.job,level:b.level,isMe:false,ready:false,readyAt:now()+rnd(900,2600)};}
function meMember(){return {name:S.me.name,job:S.me.job,level:S.me.level,isMe:true,ready:false};}
/* 용병: 파티장이 부족한 역할을 봇으로 채운다. 레벨은 실제 유저 평균 */
const MERC_NAMES=['카스','브란','엘로','미르','하렌','토비','시아','루엔','다온','벨라크','이오','파렌','세드','노엘','라임','오르'];
function realMembers(p){return p.members.filter(x=>!x.merc);}
function mercLevel(p){const r=realMembers(p);return r.length?Math.round(r.reduce((a,x)=>a+(x.isMe?S.me.level:x.level),0)/r.length):S.me.level;}
function mercJobs(lv,role){return Object.keys(CLASSES).filter(k=>CLASSES[k].role===role&&CLASSES[k].tier===(lv>=cfg().jobAdvanceLevel?2:1));}
function syncMercs(p){if(!p)return;const L=mercLevel(p);p.members.forEach(x=>{if(x.merc){x.level=L;x.ready=true;}});}
function addMerc(p,job){const used=new Set([...p.members.map(x=>x.name),...S.bots.map(b=>b.name)]);const pool=MERC_NAMES.filter(n=>!used.has('용병 '+n));
  const name='용병 '+(pool.length?pick(pool):MERC_NAMES[0]+p.members.length);p.members.push({name,job,level:mercLevel(p),isMe:false,ready:true,merc:true});return name;}
function mercPanel(p,m,c){
  const L=mercLevel(p);const left=p.target-p.members.length;
  const row=r=>`<div class="mc-row"><span class="mc-r" style="color:var(--${r})">${ROLE[r]}</span><div class="mc-js">${mercJobs(L,r).map(k=>{const why=slotReason(m,p.members,r,p.target);return `<button class="btn btn-sm" data-act="merc-add" data-job="${k}" ${why?`disabled title="${esc(why)}"`:''}>${sigil(k,'xs')}${esc(CLASSES[k].name)}</button>`;}).join('')}</div></div>`;
  return `<div class="panel"><h3>용병 고용 <span class="faint" style="letter-spacing:0;text-transform:none;font-weight:400">부족한 자리를 봇으로 채웁니다 · LV${L}</span></h3>
    <p class="faint" style="font-size:12.5px;margin:0 0 10px">${c.rolesOk?`역할 조건은 충족했습니다. 남은 ${left}자리는 원하는 역할로 채울 수 있습니다.`:`필요한 역할 · <b>${esc(missText(c.need))}</b>`} 용병 레벨은 파티에 있는 유저의 평균 레벨을 따릅니다.</p>
    <div class="mc-list">${['tank','dps','heal'].map(row).join('')}</div>
    ${c.rolesOk&&c.countOk?'':`<div class="row" style="margin-top:10px"><button class="btn btn-sm btn-primary" data-act="merc-fill">부족한 역할 자동으로 채우기</button></div>`}</div>`;
}
function genRecruit(m){
  const pool=shuffle(idleBots().filter(b=>levelOk(m,b.level)));
  if(pool.length<2)return null;
  const target=Math.min(m.max,m.target||m.min);
  const size=1+Math.floor(Math.random()*Math.min(2,target-1));
  const mem=[];
  for(const b of pool){if(mem.length>=size)break;if(!slotReason(m,mem,b.job?roleOf(b.job):'dps',target))mem.push(b);}
  if(!mem.length)return null;
  mem.forEach(b=>b.status='recruit');
  return {id:uid('R'),name:partyName(),monsterId:m.id,leader:mem[0].name,members:mem.map(b=>b.name),target,createdAt:now()};
}
function joinReason(r){
  const m=monster(r.monsterId);if(!m)return '몬스터 정보가 없습니다';const lr=levelReason(m,S.me.level)||raidBlock(m);if(lr)return lr;
  const mem=r.members.map(n=>bot(n));return slotReason(m,mem,roleOf(S.me.job),r.target);
}

