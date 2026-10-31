'use strict';
/* 기본 콘텐츠 데이터 (퀘스트 · 몬스터 · 설정) · 유틸 */
/* ───────── 콘텐츠 ───────── */
const FLAG_NAMES={e1_rescue:'탐사대 증언',e1_seal:'봉인 연구 기록',e1_path:'안전 경로 기록',e2_sealed:'검은 결정 봉인',e2_taken:'검은 결정 보관',e3_scout:'단독 정찰 기록',e3_nest:'추적자 둥지 위치',e3_resonance:'결정의 공명',s1_compass:'멈춘 나침반',s2_charm:'위조 부적',s3_map:'블라스페미아 지도'};
const FLAG_REC={
  e1_rescue:{q:'E1',t:'정찰병은 살았다. 그가 끝내 부르지 못한 동료들의 이름만 안개 속에 남았다.'},
  e1_seal:{q:'E1',t:'부적은 다시 맞춰졌다. 비어 있던 한 조각은 끝내 찾지 못했다.'},
  e1_path:{q:'E1',t:'안전한 길을 찾았다. 그 끝, 식은 모닥불 곁으로 돌아올 사람은 없었다.'},
  e2_sealed:{q:'E2',t:'결정은 잠들었다. 내 이름을 부르던 목소리가 다정했다는 건 아무에게도 말하지 않았다.'},
  e2_taken:{q:'E2',t:'결정은 신전으로 갔다. 밤마다 품속이 조금 따뜻했던 건 기분 탓이었을까.'},
  e3_scout:{q:'E3',t:'먼저 걸은 길엔 내 발자국만 남았다. 뒤따른 선발대는 그 자국을 밟고 무사히 건넜다.'},
  e3_nest:{q:'E3',t:'둥지는 비어 있었다. 새끼들의 울음이 그친 지 얼마 되지 않은 듯했다.'},
  e3_resonance:{q:'E3',t:'결정이 지름길을 열어 주었다. 그것이 나를 데려가려던 곳도 같은 방향이었다.'},
  s1_compass:{q:'S1',t:'나침반은 여전히 백야를 가리킨다. 정찰병은 그것을 아버지의 대답이라 믿기로 했다.'},
  s2_charm:{q:'S2',t:'가짜 부적 장수는 달아났다. 남겨진 꾸러미 속, 아이 이름이 적힌 부적 하나만은 진짜였다.'},
  s3_map:{q:'S3',t:'지도가 완성되었다. 옛길 끝에 그려진 작은 집은 이제 어디에도 없다.'}
};
function questDoneDate(qid){const r=S.rewardLog.find(x=>x.source==='quest'&&x.questId===qid);if(!r)return '';const p=kstParts(r.ts);return `${p.y+GAME_YEAR_OFFSET}.${pad2(p.mo)}.${pad2(p.d)}`;}
function recordsHTML(flags){
  const groups=[];flags.forEach(f=>{const r=FLAG_REC[f]||{};const key=r.q||'_';let g=groups.find(x=>x.key===key);if(!g){g={key,items:[]};groups.push(g);}g.items.push(r.t||FLAG_NAMES[f]||f);});
  return `<div class="recgroups">${groups.map(g=>{const q=g.key!=='_'&&quest(g.key);const dt=q?questDoneDate(q.id):'';return `<section class="recg"><div class="recg-h"><span class="rec-q">${esc(q?q.title:'기타 기록')}</span><span class="rec-d num">${dt?dt+' 완료':''}</span></div>${g.items.map(t=>`<p class="rec-t">${esc(t)}</p>`).join('')}</section>`;}).join('')}</div>`;
}
const DEFAULT_QUESTS=[
 {id:'E1',cat:'epic',title:'사라진 탐사대의 흔적',published:true,level:1,prereq:null,repeat:null,
  desc:'라니아케아의 신전에서 연락이 끊긴 탐사대를 조사해 달라는 의뢰를 받았다.',start:'s0',steps:{
  s0:{text:'북쪽 경계로 향하는 길. 짙은 안개 속에서 붉은 눈이 번뜩이더니, 들개 한 마리가 이빨을 드러내며 길을 막아선다.',battle:'st_hound',next:'s1',winText:'들개가 꼬리를 말고 안개 속으로 달아났다. 길이 열렸다.'},
  s1:{text:'신전의 사제 이레나가 낡은 지도를 펼친다. "북쪽 경계에서 탐사대의 신호가 끊겼습니다." 현장에 도착하니 바위 틈에 깨진 부적이 떨어져 있고, 부상당한 정찰병이 나무에 기대어 숨을 고르고 있다.',choices:[
    {label:'정찰병부터 구한다',result:'상처를 묶어 주자 정찰병이 정신을 차린다. "탐사대는… 안개 속으로 끌려갔어요."',next:'r2',flag:'e1_rescue'},
    {label:'부적의 흔적을 조사한다',result:'부적 조각에는 봉인 문양이 새겨져 있다. 누군가 일부러 부순 흔적이다.',next:'i2',flag:'e1_seal'},
    {label:'주변의 안전한 길을 찾는다',result:'지형을 살피다 덩굴에 가려진 우회로를 찾았다. 탐사대가 남긴 표식이 이어진다.',next:'p2',flag:'e1_path'}]},
  r2:{text:'정찰병을 부축해 신전으로 돌아가야 한다. 정찰병은 탐사대가 마지막으로 본 것을 증언하겠다고 한다.',choices:[
    {label:'신전으로 호송한다',result:'정찰병의 증언이 기록되었다. 탐사대는 백야 방향의 안개 속으로 사라졌다.',next:'end_r'}]},
  i2:{text:'부적 조각을 맞춰 보니 문양 일부가 비어 있다. 비어 있는 부분은 백야의 신전 봉인과 같은 모양이다.',choices:[
    {label:'연구 기록으로 정리한다',result:'봉인 연구 기록을 신전에 제출했다.',next:'end_i'}]},
  p2:{text:'우회로 끝에서 탐사대의 야영지를 찾았다. 모닥불은 꺼진 지 오래다.',choices:[
    {label:'경로를 지도에 기록한다',result:'안전 경로 기록을 완성했다.',next:'end_p'}]},
  end_r:{end:true,text:'구조 경로 완료 · 탐사대 증언 획득',reward:{exp:120,gold:50,items:{potion:1}}},
  end_i:{end:true,text:'조사 경로 완료 · 봉인 연구 기록 획득',reward:{exp:150,gold:50,items:{}}},
  end_p:{end:true,text:'탐색 경로 완료 · 안전 경로 기록 획득',reward:{exp:100,gold:80,items:{}}}}},
 {id:'E2',cat:'epic',title:'깨진 봉인의 속삭임',published:true,level:3,prereq:'E1',repeat:null,
  desc:'탐사대가 사라진 자리에서 밤마다 속삭임이 들린다는 보고가 올라왔다.',start:'s1',steps:{
  s1:{text:'이레나가 다시 당신을 부른다. "그 자리에서 밤마다 누군가 이름을 부른답니다." 지난 조사에서 남긴 기록이 실마리가 될지도 모른다.',choices:[
    {label:'정찰병의 증언대로 안개 쪽을 수색한다',req:{flag:'e1_rescue'},result:'증언 속 바위 표식을 따라가자 속삭임이 또렷해진다.',next:'g2'},
    {label:'연구 기록의 빈 문양을 대조한다',req:{flag:'e1_seal'},result:'빈 문양과 같은 모양의 홈이 땅에 패여 있다. 속삭임은 그 아래에서 들린다.',next:'g2'},
    {label:'기록해 둔 안전 경로로 접근한다',req:{flag:'e1_path'},result:'우회로 덕분에 들키지 않고 속삭임의 근원까지 다가갔다.',next:'g2'},
    {label:'처음부터 현장을 다시 조사한다',result:'한나절이 걸렸지만 속삭임의 근원을 찾아냈다.',next:'g2'}]},
  g2:{text:'속삭임이 뚝 끊긴다. 땅에서 검은 결정 조각들이 떠올라 엉겨 붙더니, 사람의 형상을 한 그림자가 일어선다.',battle:'st_shade',next:'s2',winText:'그림자가 흩어지며 결정 조각들이 바닥에 떨어졌다.'},
  s2:{text:'속삭임의 근원은 땅에 박힌 검은 결정이다. 손을 대자 차가운 목소리가 당신의 이름을 묻는다.',choices:[
    {label:'이름을 말하지 않고 결정을 봉인한다',result:'신전의 봉인 문구를 읊자 결정이 잠잠해진다.',next:'end_seal',flag:'e2_sealed'},
    {label:'결정을 천으로 감싸 신전으로 가져간다',result:'결정은 품 안에서 희미하게 맥동한다. 신전이 연구를 맡기로 했다.',next:'end_take',flag:'e2_taken'}]},
  end_seal:{end:true,text:'결정 봉인 완료',reward:{exp:250,gold:100,items:{holywater:1}}},
  end_take:{end:true,text:'결정 회수 완료',reward:{exp:250,gold:100,items:{leather:1}}}}},
 {id:'E3',cat:'epic',title:'백야로 가는 길',published:true,level:6,prereq:'E2',repeat:null,
  desc:'신전은 백야의 신전으로 향할 선발대를 꾸린다. 당신에게도 동행 요청이 왔다.',start:'s1',steps:{
  s1:{text:'신전 앞마당에 선발대가 모였다. 지휘관은 블라스페미아를 지나는 길이 위험하다고 경고한다.',choices:[
    {label:'선발대와 함께 출발한다',result:'선발대의 후미를 맡아 경계를 넘었다.',next:'s2'},
    {label:'먼저 혼자 길을 정찰한다',req:{level:7},result:'앞서 나가 안전한 야영지를 확보했다.',next:'s2',flag:'e3_scout'}]},
  s2:{text:'블라스페미아 경계에서 추적자의 발자국이 보인다. 발자국은 신전 쪽으로 이어진다.',choices:[
    {label:'발자국을 피해 우회한다',result:'시간은 걸렸지만 무사히 언덕에 올랐다.',next:'g3'},
    {label:'발자국을 따라 둥지를 확인한다',result:'추적자의 둥지를 지도에 표시했다. 공격대에게 쓸모 있는 정보다.',next:'g3',flag:'e3_nest'},
    {label:'검은 결정의 공명을 따라간다',req:{flag:'e2_taken'},result:'결정이 가리키는 방향으로 걷자 지름길이 열렸다.',next:'g3',flag:'e3_resonance'}]},
  g3:{text:'언덕 위, 둥지를 지키던 어린 추적자가 이빨을 드러내며 길을 막아선다. 선발대는 아직 뒤에 있다. 혼자 상대해야 한다.',battle:'st_pup',next:'s3',winText:'어린 추적자가 울음소리를 남기고 경계 너머로 물러났다.'},
  s3:{text:'마침내 지평선 끝에 해가 지지 않는 신전이 보인다. 문 앞에는 봉인 수호자가 미동도 없이 서 있다.',choices:[
    {label:'신전에 보고하고 공격대를 기다린다',result:'보고서가 신전에 전달되었다. 봉인 수호자 공략 준비가 시작된다.',next:'end'}]},
  end:{end:true,text:'백야의 신전 도달',reward:{exp:450,gold:150,items:{amulet:1}}}}},
 {id:'S1',cat:'sub',title:'정찰병의 부탁',published:true,level:2,prereq:null,repeat:null,cond:{quests:['E1']},
  desc:'회복 중인 정찰병이 잃어버린 나침반을 찾아 달라고 부탁한다.',start:'s1',steps:{
  s1:{text:'"아버지가 물려주신 나침반이에요. 숲 어딘가에 떨어뜨린 것 같아요."',choices:[
    {label:'숲 입구를 뒤진다',result:'덤불 속에서 반짝이는 것을 찾았다.',next:'s2'},
    {label:'야영지 근처를 뒤진다',result:'타다 남은 장작 옆에서 나침반을 찾았다.',next:'s2'}]},
  s2:{text:'나침반은 멀쩡하지만 바늘이 백야 쪽을 가리킨 채 움직이지 않는다.',choices:[
    {label:'그대로 돌려준다',result:'정찰병은 바늘을 보고 잠시 말을 잃었다가 고개를 숙였다.',next:'end'},
    {label:'신전에 감정을 맡긴 뒤 돌려준다',result:'신전은 나침반이 혼돈의 흐름에 반응한다고 기록했다.',next:'end',flag:'s1_compass'}]},
  end:{end:true,text:'나침반 반환',reward:{exp:150,gold:60,items:{}}}}},
 {id:'S2',cat:'sub',title:'잿빛 시장의 상인',published:true,level:4,prereq:null,repeat:null,cond:{quests:['E1'],level:4},
  desc:'신전 아래 잿빛 시장에서 가짜 부적을 판다는 소문이 돈다.',start:'s1',steps:{
  s1:{text:'후드를 깊게 눌러쓴 상인이 "축복받은 부적"을 싸게 판다. 부적의 문양이 어딘가 어긋나 있다.',choices:[
    {label:'정체를 캐묻는다',result:'상인은 당황해 부적 꾸러미를 떨어뜨리고 달아났다.',next:'s2',flag:'s2_charm'},
    {label:'조용히 신전에 알린다',result:'신전 경비가 시장으로 향했다.',next:'s2'}]},
  s2:{text:'남겨진 부적을 보니 블라스페미아 쪽 흙이 묻어 있다.',choices:[
    {label:'부적을 신전에 넘긴다',result:'사제들이 부적을 정화했다. 감사의 표시로 성수를 받았다.',next:'end'}]},
  end:{end:true,text:'잿빛 시장 정리',reward:{exp:220,gold:80,items:{holywater:1}}}}},
 {id:'S3',cat:'sub',title:'블라스페미아 지도 조각',published:true,level:7,prereq:null,repeat:null,cond:{quests:['E2']},
  desc:'블라스페미아의 옛 지도 조각이 흩어져 있다. 모으면 신전 공략에 도움이 된다.',start:'s1',steps:{
  s1:{text:'첫 번째 조각은 무너진 초소의 벽에 걸려 있다. 두 번째 조각은 늪 한가운데 떠 있다.',choices:[
    {label:'초소부터 살핀다',result:'초소에서 조각과 함께 낡은 일지를 찾았다.',next:'s2'},
    {label:'늪으로 들어간다',result:'발이 빠지는 늪을 건너 조각을 건져 냈다.',next:'s2'}]},
  s2:{text:'두 조각을 맞추자 백야의 신전으로 이어지는 옛길이 드러난다.',choices:[
    {label:'지도를 완성해 신전에 제출한다',result:'지도가 공격대 작전실에 걸렸다.',next:'end',flag:'s3_map'}]},
  end:{end:true,text:'지도 완성',reward:{exp:380,gold:120,items:{}}}}},
 {id:'R1',cat:'repeat',title:'신전 순찰',published:true,level:1,prereq:null,repeat:'daily',
  desc:'라니아케아 신전 외곽을 순찰한다. 매일 오전 5시에 다시 받을 수 있다.',start:'s1',steps:{
  s1:{text:'오늘은 어느 구역을 돌까?',choices:[
    {label:'동쪽 회랑',result:'회랑의 등불을 모두 확인했다. 이상 없음.',next:'end'},
    {label:'서쪽 정원',result:'정원 담장 밑에서 작은 균열을 찾아 보고했다.',next:'end'}]},
  end:{end:true,text:'순찰 완료',reward:{exp:80,gold:30,items:{}}}}},
 {id:'R2',cat:'repeat',title:'오염된 샘 정화',published:true,level:3,prereq:null,repeat:'daily',
  desc:'혼돈에 물든 샘을 정화한다.',start:'s1',steps:{
  s1:{text:'샘 표면에 검은 막이 떠 있다. 가까이 가자 매캐한 냄새가 난다.',choices:[
    {label:'성수를 붓는다',result:'검은 막이 연기처럼 흩어진다.',next:'s2'},
    {label:'막을 걷어 내 태운다',result:'불길 속에서 막이 비명을 지르듯 오그라든다.',next:'s2'}]},
  s2:{text:'물이 맑아졌다. 근처 주민이 감사의 뜻으로 약초를 건넨다.',choices:[
    {label:'약초를 받는다',result:'약초로 회복약을 만들었다.',next:'end'}]},
  end:{end:true,text:'정화 완료',reward:{exp:120,gold:40,items:{potion:1}}}}},
 {id:'R3',cat:'repeat',title:'추적자 흔적 수집',published:true,level:6,prereq:null,repeat:'daily',
  desc:'블라스페미아 경계에서 추적자의 흔적을 모은다.',start:'s1',steps:{
  s1:{text:'진흙에 찍힌 발자국과 나무에 남은 발톱 자국이 보인다.',choices:[
    {label:'발자국 깊이를 잰다',result:'무게로 보아 성체 두 마리가 지나갔다.',next:'end'},
    {label:'발톱 자국을 탁본한다',result:'탁본을 신전에 넘겼다.',next:'end'}]},
  end:{end:true,text:'흔적 수집 완료',reward:{exp:200,gold:60,items:{}}}}},
 {id:'R4',cat:'repeat',title:'초원 약초 채집',published:true,level:1,prereq:null,repeat:'daily',
  desc:'신전 의무실에 쓸 약초를 초원에서 모아 온다.',start:'s1',steps:{
  s1:{text:'황혼녘 강가 둑에 약초가 무성하다. 어디부터 캘까?',choices:[
    {label:'강가 쪽 그늘',result:'촉촉한 그늘에서 잎이 넓은 약초를 모았다.',next:'end'},
    {label:'볕이 드는 언덕',result:'햇볕을 머금은 약초를 한 바구니 채웠다.',next:'end'}]},
  end:{end:true,text:'약초 납품',reward:{exp:70,gold:30,items:{herb:2}}}}},
 {id:'R5',cat:'repeat',title:'순례자 호위',published:true,level:2,prereq:null,repeat:'daily',
  desc:'신전으로 향하는 순례자를 마을 어귀까지 호위한다.',start:'s1',steps:{
  s1:{text:'노부부 순례자가 지팡이를 짚고 걷는다. 길가 덤불이 수상하게 흔들린다.',choices:[
    {label:'앞장서서 덤불을 살핀다',result:'덤불 속에는 놀란 산토끼뿐이었다.',next:'s2'},
    {label:'순례자 곁을 지킨다',result:'덤불이 잠잠해질 때까지 곁을 지켰다.',next:'s2'}]},
  s2:{text:'마을 어귀에 닿자 노부부가 손을 꼭 잡아 준다.',choices:[{label:'인사하고 돌아선다',result:'"신들의 축복이 함께하길."',next:'end'}]},
  end:{end:true,text:'호위 완료',reward:{exp:90,gold:35,items:{}}}}},
 {id:'R6',cat:'repeat',title:'신전 서고 정리',published:true,level:1,prereq:null,repeat:'daily',
  desc:'흐트러진 신전 서고의 기록을 정리한다.',start:'s1',steps:{
  s1:{text:'바닥에 흩어진 두루마리 사이로 오래된 탐사 기록이 섞여 있다.',choices:[
    {label:'연대순으로 꽂는다',result:'서고가 말끔해졌다. 사서가 고개를 끄덕인다.',next:'end'},
    {label:'탐사 기록부터 따로 모은다',result:'다음 탐사대에 쓸모 있을 기록을 추려 냈다.',next:'end'}]},
  end:{end:true,text:'서고 정리 완료',reward:{exp:60,gold:40,items:{}}}}},
 {id:'R7',cat:'repeat',title:'늪 독샘 수거',published:true,level:5,prereq:null,repeat:'daily',
  desc:'해독제 연구에 쓸 늪 생물의 독샘을 수거한다.',start:'s1',steps:{
  s1:{text:'독안개 마을 주민이 장갑과 유리병을 건넨다. "맨손으로 만지면 큰일 나요."',choices:[
    {label:'안개가 옅은 가장자리부터',result:'시간은 걸렸지만 안전하게 병을 채웠다.',next:'end'},
    {label:'안개 깊숙이 들어간다',result:'눈이 따가웠지만 큼직한 독샘을 얻었다.',next:'end'}]},
  end:{end:true,text:'독샘 납품',reward:{exp:150,gold:50,items:{venom:1}}}}},
 {id:'R8',cat:'repeat',title:'경계 초소 보급',published:true,level:4,prereq:null,repeat:'daily',
  desc:'블라스페미아 경계 초소에 보급품을 전달한다.',start:'s1',steps:{
  s1:{text:'짐수레에 물과 회복약이 실려 있다. 초소까지는 반나절 거리다.',choices:[
    {label:'큰길로 간다',result:'무사히 초소에 도착했다. 경비병들이 반긴다.',next:'end'},
    {label:'지름길로 간다',result:'바퀴가 진흙에 빠졌지만 겨우 빼내 시간 안에 닿았다.',next:'end'}]},
  end:{end:true,text:'보급 완료',reward:{exp:130,gold:55,items:{potion:1}}}}}
];
const DEFAULT_NOTICES=[
  {id:'n1',date:'10.25',title:'블레셋 전기 시제품을 열었습니다',text:'기본 클래스 5종과 ★ 상위 클래스 8종, 퀘스트 9개, 몬스터 3종으로 시작합니다. 진행 기록은 이 브라우저에 저장됩니다.'},
  {id:'n2',date:'10.25',title:'일일 의뢰는 오전 5시에 초기화됩니다',text:'반복 퀘스트 보상은 같은 주기에 한 번만 받을 수 있습니다.'},
  {id:'n3',cat:'update',date:'10.24',title:'봉인 수호자 공략 안내',text:'LV15 이상, 6인 이상. 탱커 1 · 딜러 3 · 힐러 2가 필요합니다.'}
];
const DEFAULT_BANNER={eyebrow:'백야의 신전 소식',title:'잠든 혼돈이 봉인을 두드린다',text:'백야의 신전 봉인 수호자가 깨어났습니다. LV15 이상의 블레서 여섯 명이 모이면 공략에 나설 수 있습니다.',linkLabel:'봉인 수호자 보기',link:'monster:guardian'};
const DEFAULT_CONFIG={levelCap:99,turnSeconds:45,acceptSeconds:30,expBase:100,expStep:50,expQuad:2,jobAdvanceLevel:20};
const BOTS=[['아르덴','knight',16],['세린','demigod',15],['카이로','destroyer',17],['미라엘','priest',9],['하윤','shooter',4],['도겸','defender',9],['루시안','salamander',15],['엘라','priest',3],['테오','defender',4],['비안카','mage',8],['노아','warrior',18],['리엔','summoner',17],['소하','infighter',6],['이안','defender',7],['레아','priest',5],['진후','mystic',16],['다온','demigod',12],['유키','dualist',15],['벨라','warrior',13]];
const PARTY_NAMES=['새벽 토벌대','은빛 순례단','백야 원정대','라니아케아 수호대','안개 추적단','첫 별 탐사대','회색 늑대단','검은 결정 조사대','잿빛 등불단','북쪽 경계 정찰대','푸른 불꽃 결사','고목 벌채단'];
function partyName(){const used=new Set(S.recruits.map(r=>r.name));return pick(PARTY_NAMES.filter(n=>!used.has(n)))||'임시 탐사대';}
const LOBBY_LINES=['오늘 파수꾼 3인 가실 분 있나요?','백야의 신전 공지 보셨어요? 수호자는 6인부터래요','정화의 성수는 상점에서 40골드예요','탐사대 퀘스트는 정찰병 경로가 회복약을 줘요','광역 예고 뜨면 방어 꼭 누르세요','힐러 구해요! 추적자 4인','방금 장궁 나왔어요','블라스페미아 지도 조각은 LV7부터 받을 수 있어요','라니아케아의 축복이 함께하길','일일 의뢰 오전 5시에 초기화돼요','졸트 다음에 러시 쓰면 연계 대미지 붙어요','제압은 딜러 대미지가 두 배 넘으면 풀려요','LV20 되면 시작의 마을에서 전직 퀘스트 받을 수 있어요','랜덤 매칭 돌리는 중입니다','서머너 비호 두 번이면 광역 버틸 만해요'];
const PARTY_LINES=['준비 완료했습니다','제압 먼저 걸게요','광역 예고 보이면 성역 쓸게요','힐 필요하면 말해주세요','졸트 다음 연계 들어갑니다','좋아요 가시죠','잘 부탁드려요','체력 낮으면 방어 눌러주세요'];
const WHISPER_LINES=['안녕하세요!','지금 퀘스트 중이에요, 끝나고 같이 가요','좋아요, 파티 만들면 초대해 주세요','ㅎㅎ 고마워요','저는 지금 레벨 올리는 중이에요','수호자 갈 때 불러주세요','오늘 일일 의뢰 다 하셨어요?'];

/* ───────── 유틸 ───────── */
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=o=>JSON.parse(JSON.stringify(o));
const rnd=(a,b)=>a+Math.random()*(b-a);
const pick=a=>a[Math.floor(Math.random()*a.length)];
const now=()=>Date.now();
const uid=p=>p+Math.random().toString(36).slice(2,7)+(Date.now()%1e6).toString(36);
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const kstCycle=(t=now())=>new Date(t+4*3600e3).toISOString().slice(0,10);
const hhmm=t=>{const d=new Date(t+9*3600e3);return d.toISOString().slice(11,16);};
const pct=(a,b)=>b?Math.max(0,Math.min(100,a/b*100)):0;

