'use strict';
/* ── 탐색 중 짧은 선택 이벤트 (2026-11-07 유저 요청 4단계) ──
   지역 탐색 1회마다 EXEV_P(20%) 확률로, 결과 한 줄 대신 2~3줄 작은 사건 + 선택지 2개.
   땅마다 4개 + 어디서나 5개 = 37개. 이상한 사건(odd)은 약 15%. 보상은 탐색 보상 수준(exploreReward 종류), 손해는 작게(체력 −10%).
   고른 선택은 기록 S.flags['ev_<id>_<a|b>'](탐사 기록에 '탐색 · 제목 — 선택'으로 보임, {{mem:…}}·연대기에서 다시 쓸 수 있음).
   EXEV_LIVE=false 동안은 운영자(로컬 파일 모드 포함)에게만 나옴 — 유저 확인 뒤 true로. 원고: docs/drafts/explore-events-draft.md */
const EXEV_P=0.2,EXEV_LIVE=false;
/* 탐색 이벤트에서만 나오는 아이템 */
Object.assign(ITEMS,{snowgem:{name:'눈 결정',type:'mat',desc:'칼리로에 여관 일꾼 캐서린이 아끼던 눈 결정. 손바닥 위에서도 녹지 않는다.',price:60}});
/* 보상 종류: exp · gold · item(그 땅 재료) · potion · none · hurt(체력 −10%) · 'gold+hurt'처럼 둘 */
const EXEV=[
 // ── 초원의 땅
 {id:'m_pilgrim',land:'meadow',t:'쓰러진 순례자',x:'길가 풀숲에 순례자 한 명이 쓰러져 있다. 물통이 비어 있다.',
  c:[{l:'물을 나눠 준다',r:'순례자가 고개를 숙인다. "이 길 끝에서 다시 만나요." 보답으로 약초 한 줌을 쥐여 준다.',rw:'item'},{l:'지나친다',r:'몇 걸음 뒤 돌아보니 순례자가 일어나 반대쪽으로 걸어가고 있다. 아무 일 없었다는 듯.',rw:'none'}]},
 {id:'m_lamb',land:'meadow',t:'길 잃은 어린 양',x:'어린 양 한 마리가 무리에서 떨어져 울고 있다. 멀리 양치기의 피리 소리가 들린다.',
  c:[{l:'양을 안고 피리 소리를 따라간다',r:'양치기 노인이 고맙다며 동전 몇 닢을 건넨다.',rw:'gold'},{l:'피리 소리 쪽으로 양을 몰아 준다',r:'양이 무리로 달려간다. 노을 진 언덕이 한동안 기억에 남는다.',rw:'exp'}]},
 {id:'m_hive',land:'meadow',t:'벌집이 달린 고목',x:'고목 구멍에서 꿀 냄새가 난다. 벌들이 낮게 윙윙거린다.',
  c:[{l:'손을 넣어 꿀을 꺼낸다',r:'몇 방 쏘였지만 꿀과 밀랍 사이에서 약초가 섞인 덩어리를 건졌다.',rw:'item+hurt3'},{l:'그대로 둔다',r:'벌 한 마리가 어깨에 앉았다가 날아간다.',rw:'none'}]},
 {id:'m_song',land:'meadow',odd:1,t:'같은 소절',x:'바람에 노랫소리가 실려 온다. 같은 소절이 조금도 틀리지 않고 되풀이된다. 근처에 아무도 없다.',
  c:[{l:'소리 나는 쪽으로 간다',r:'노래는 언제나 한 걸음 앞에서 들린다. 해가 기울어서야 돌아선다. 손에 언제 쥐었는지 모를 약초가 들려 있다.',rw:'item'},{l:'귀를 막고 돌아선다',r:'귀를 막아도 노래가 들린다. 마을 어귀에 닿자 뚝 멈춘다.',rw:'none'}]},
 // ── 바위의 땅
 {id:'r_rockfall',land:'rock',t:'낙석',x:'머리 위에서 돌가루가 떨어진다. 비탈이 곧 무너질 것 같다.',
  c:[{l:'뛰어서 지나간다',r:'등 뒤로 바위가 쏟아진다. 어깨를 긁혔지만, 무너진 자리에서 광석이 드러났다.',rw:'item+hurt5'},{l:'돌아간다',r:'멀리 돌아가는 길에서 산양 떼를 만났다. 길은 길었지만 배운 게 있다.',rw:'exp'}]},
 {id:'r_monk',land:'rock',t:'수련하는 아이',x:'바위 위에서 아이가 혼자 무술 동작을 반복하고 있다. 한 동작이 계속 틀린다.',
  c:[{l:'틀린 동작을 고쳐 준다',r:'아이가 고개를 꾸벅 숙인다. "사범님이 늘 이렇게 하라고 했는데." 같은 동작을 다시, 다시 반복한다.',rw:'exp'},{l:'지켜만 본다',r:'아이가 계속해서 수련을 하다 포기한 건지 집으로 돌아간다.',rw:'none'}]},
 {id:'r_cairn',land:'rock',t:'돌탑',x:'산길에 돌탑이 서 있다. 순례자들이 하나씩 올린 것이라고 한다.',
  c:[{l:'돌 하나를 올린다',r:'탑이 아주 살짝 흔들리다 멈춘다. 마음이 가벼워진다.',rw:'potion'},{l:'탑 아래를 살핀다',r:'탑 밑돌 사이에 누군가 숨겨둔 골드가 있다. 야호.',rw:'g10'}]},
 {id:'r_names',land:'rock',odd:1,t:'바위의 빈자리',x:'이름이 빼곡한 바위. 손바닥만 한 빈자리 하나가, 어제보다 조금 더 커져 있는 것 같다.',
  c:[{l:'빈자리를 손으로 쓸어 본다',r:'바위가 미지근하다. 손을 떼자 빈자리 가장자리에 글자 하나가 새로 새겨져 있다. 읽을 수 없다.',rw:'exp'},{l:'못 본 척한다',r:'산을 내려오는 내내 누가 당신의 이름을 새기는 것 같은 불안감이 든다. 망치 소리가 일정하다.',rw:'none'}]},
 // ── 늪의 땅
 {id:'s_boat',land:'swamp',t:'떠내려온 쪽배',x:'갈대 사이에 빈 쪽배가 걸려 있다. 바닥에 젖은 꾸러미 하나.',
  c:[{l:'꾸러미를 연다',r:'독샘 가루와 동전 몇 닢이 들어 있다.',rw:'gold'},{l:'쪽배를 마을로 끌고 간다',r:'나루터의 토르가 쪽배를 알아본다. "또 떠내려왔네." 고맙다며 독샘을 하나 준다.',rw:'item'}]},
 {id:'s_leech',land:'swamp',t:'거머리 늪',x:'지름길은 거머리가 들끓는 얕은 늪이다. 마스크 끈이 느슨하다.',
  c:[{l:'지름길로 건넌다',r:'다리에 거머리가 몇 마리 붙었다. 대신 늪 한가운데서 독샘 덩어리를 건졌다.',rw:'item+hurt'},{l:'둘러 간다',r:'말뚝 집들 사이를 돌아가다 장로 하윈에게서 늪 이야기를 들었다.',rw:'exp'}]},
 {id:'s_mask',land:'swamp',t:'떨어진 마스크',x:'진흙 속에 가죽 마스크 하나가 떨어져 있다. 주인 이름을 새긴 자리가 긁혀 있다.',
  c:[{l:'치료소에 맡긴다',r:'이브가 마스크를 받아 든다. "주인이 찾으러 오겠죠." 보답으로 회복약을 건넨다.',rw:'potion'},{l:'마스크 안쪽을 본다',r:'안쪽에 누군가 작게 새긴 날짜가 있다. 날짜 칸은 번져 있다. 마스크 끈 사이에 동전이 끼어 있다.',rw:'gold'}]},
 {id:'s_eye',land:'swamp',odd:1,t:'물 위의 눈',x:'안개 낀 수면에 보랏빛 무언가가 떠 있다. 깜빡인다.',
  c:[{l:'마주 본다',r:'눈이 천천히 깜빡이고 사라진다. 시야 한쪽에 아주 잠깐 누군가의 웃는 잔상이 스친 것도 같다. 착각일까? 착각이겠지.',rw:'none'},{l:'눈을 감고 지나간다',r:'눈을 감고 걷는 동안 발밑이 한 번도 젖지 않았다.',rw:'none'}]},
 // ── 소금의 땅
 {id:'a_caravan',land:'salt',t:'멈춘 대상',x:'소금 사막 한가운데 낙타 대상이 멈춰 있다. 바퀴 하나가 모래에 빠졌다.',
  c:[{l:'바퀴를 함께 민다',r:'대상 우두머리가 소금 결정 한 자루를 내준다.',rw:'item'},{l:'물만 건네고 간다',r:'"히페리온에서 보면 한 잔 사지." 동전 몇 닢이 손에 쥐어진다.',rw:'gold'}]},
 {id:'a_dice',land:'salt',t:'모래 위 주사위판',x:'그늘막 아래 노인이 주사위를 굴리며 손짓한다. "한 판? 금방 끝나."',
  c:[{l:'한 판 한다',r:'지고, 이기고, 다시 진다. 마지막 판에 노인이 웃으며 판돈을 전부 밀어 준다. "오늘은 네 날이네."',rw:'gold'},{l:'사양한다',r:'"현명하군. 이 사막에선 다들 한 판만 하다가 남거든."',rw:'none'}]},
 {id:'a_mirage',land:'salt',t:'신기루 우물',x:'지평선에 우물이 보인다. 가까워지는 만큼 멀어진다.',
  c:[{l:'끝까지 따라간다',r:'해 질 녘에야 진짜 우물에 닿는다. 목이 탔지만 우물 바닥에 소금 결정이 반짝인다.',rw:'item+hurt'},{l:'지도만 표시한다',r:'신기루가 뜨는 자리를 지도에 적어 둔다. 상인들이 비싸게 사 간다.',rw:'gold'}]},
 {id:'a_ledger',land:'salt',odd:1,t:'모래에 묻힌 명부',x:'모래 속에서 금박 명부 한 장이 삐져나와 있다. 이름 칸 하나만 손톱으로 긁혀 있다.',
  c:[{l:'긁힌 칸을 읽어 본다',r:'획을 이으려는데 바람이 모래를 덮는다. 털어 내자 긁힌 칸 옆에 새 칸이 하나 생겨 있다. 비어 있다.',rw:'exp'},{l:'다시 묻는다',r:'모래를 덮는 손이 생각보다 익숙하다. 일어서자 발밑에 소금 결정 하나.',rw:'item'}]},
 // ── 바다의 땅
 {id:'e_net',land:'sea',t:'엉킨 그물',x:'부두에 어부가 엉킨 그물을 풀다 한숨을 쉰다.',
  c:[{l:'같이 푼다',r:'해가 질 때쯤 그물이 다 풀린다. 어부가 오늘 잡은 것 중 가장 좋은 걸 내준다.',rw:'item'},{l:'칼로 끊어 준다',r:'어부가 잠깐 굳었다가 웃는다. "그것도 방법이네."',rw:'none'}]},
 {id:'e_gull',land:'sea',t:'반짝이를 문 갈매기',x:'갈매기가 반짝이는 것을 물고 등대 꼭대기로 날아간다.',
  c:[{l:'등대를 오른다',r:'계단이 끝도 없다. 꼭대기 둥지에 동전과 단추가 잔뜩 모여 있다.',rw:'gold+hurt'},{l:'모이를 던져 꾄다',r:'갈매기가 물고 있던 것을 떨어뜨린다. 녹슨 회복약 병이다. 아직 쓸 만하다.',rw:'potion'}]},
 {id:'e_sailor',land:'sea',t:'귀를 막은 선원',x:'선원 하나가 귀에서 솜을 빼려다 멈칫한다. "지금은 안 들리죠? 노래."',
  c:[{l:'"안 들려요."',r:'선원이 솜을 뺀다. 한참 바다를 보다가 다시 틀어막는다. "…그래도 무서워서."',rw:'exp'},{l:'"잠깐 기다려 봐요."',r:'함께 파도 소리를 듣는다. 노래는 없다. 선원이 웃으며 생선 한 마리를 준다.',rw:'item'}]},
 {id:'e_bottle',land:'sea',odd:1,t:'답장',x:'파도에 병 하나가 밀려온다. 안에 든 편지는 당신 필체다. 쓴 기억이 없다.',
  c:[{l:'편지를 읽는다',r:'본문은 번져 있다. 끝줄만 읽힌다. 「거기 아직 있어?」',rw:'exp'},{l:'바다로 돌려보낸다',r:'병이 먼바다로 떠난다. 다음 파도에 같은 자리로 돌아온다. 이번엔 동전이 함께 들어 있다.',rw:'gold'}]},
 // ── 작열의 땅
 {id:'f_lizard',land:'ember',t:'모래 속 도롱뇽',x:'뜨거운 모래 속에서 불도롱뇽 새끼가 머리만 내밀고 헐떡인다.',
  c:[{l:'그늘로 옮겨 준다',r:'손이 조금 데었다. 새끼가 꼬리로 모래를 털자 불씨 돌이 드러난다.',rw:'item+hurt5'},{l:'물을 뿌려 준다',r:'도롱뇽이 눈을 끔뻑이고 모래 속으로 사라진다. 길잡이 나디아가 웃는다. "그거 길한 거예요."',rw:'exp'}]},
 {id:'f_trader',land:'ember',t:'신기루 상인',x:'쉼터 밖 모래언덕에 천막 하나. 상인이 반쯤 녹은 물건들을 늘어놓고 있다.',
  c:[{l:'물건을 구경한다',r:'녹은 물건들 사이에 멀쩡한 회복약이 하나 있다. 상인이 그냥 가져가란다.',rw:'potion'},{l:'길을 묻는다',r:'상인이 엉뚱한 방향을 가리킨다. 그쪽에서 옛 상단의 동전 주머니를 주웠다.',rw:'gold'}]},
 {id:'f_sundial',land:'ember',t:'부서진 해시계',x:'모래에 반쯤 묻힌 셀로나식 해시계. 그림자가 하나 더 있다.',
  c:[{l:'모래를 털어 낸다',r:'바늘 밑에서 고대 문자가 새겨진 조각이 나온다. 미라가 좋아하겠다.',rw:'item'},{l:'두 그림자를 비교한다',r:'하나는 지금, 하나는 조금 뒤를 가리킨다. 한참 들여다보다 무언가 깨닫는다.',rw:'exp'}]},
 {id:'f_steps',land:'ember',odd:1,t:'앞서간 발자국',x:'바람이 지운 모래 위에 발자국 한 줄이 새로 찍혀 있다. 당신 신발과 같은 무늬다.',
  c:[{l:'따라간다',r:'발자국은 언덕 너머에서 끊긴다. 끊긴 자리에서 돌아보니, 당신이 온 길에는 발자국이 없다.',rw:'exp'},{l:'반대쪽으로 간다',r:'한참 걷다 돌아보면 발자국은 늘 당신 바로 뒤에서 끊겨 있다. 쉼터 앞에 동전이 떨어져 있다.',rw:'gold'}]},
 // ── 혹한의 땅
 {id:'i_wood',land:'frost',t:'눈 속의 장작',x:'눈보라 속에 장작 더미가 쓰러져 있다. 로빈의 표식이 새겨져 있다.',
  c:[{l:'여관까지 날라 준다',r:'손이 얼었지만 그레고르가 따뜻한 수프와 함께 결정 하나를 내준다.',rw:'item+hurt5'},{l:'표식만 세워 둔다',r:'다음 날 로빈이 고개를 끄덕인다. 말은 없다. 대신 지름길을 알려 준다.',rw:'exp'}]},
 {id:'i_cat',land:'frost',t:'고양이 발자국',x:'여관 고양이의 발자국이 마을 밖 얼음 호수 쪽으로 이어진다.',
  c:[{l:'따라가 데려온다',r:'호숫가에서 고양이를 안고 돌아온다. 오는 길에 고양이가 팔을 할퀴었다. 틸이 기뻐하며 아껴 둔 동전을 준다.',rw:'gold+hurt3'},{l:'불러 본다',r:'고양이에게 무시당했다. 도도하게 걸어가는 뒷모습만 허망하게 쳐다봤다.',rw:'none'}]},
 {id:'i_soup',land:'frost',t:'남은 수프',x:'여관 일꾼 캐서린이 식은 수프 냄비를 들고 망설인다. "버리기 아까운데."',
  c:[{l:'다 먹는다',r:'식은 수프가 이상하게 따뜻하다. 몸이 풀린다.',rw:'exp'},{l:'로빈에게 가져다준다',r:'장작을 패던 로빈이 처음으로 웃는다. 여관으로 돌아오자 캐서린이 작은 상자를 내민다. "아끼는 건데 블레서님한테 특별히 드릴게요!" 안에 눈 결정 하나가 들어 있다.',rw:'it:snowgem'}]},
 {id:'i_mirror',land:'frost',odd:1,t:'덮이지 않은 거울',x:'빈집 창문 너머로 덮개가 벗겨진 거울이 보인다. 거울 속 방에는 불이 켜져 있다.',
  c:[{l:'창문을 두드린다',r:'거울 속 누군가 고개를 든다. 당신과 같은 옷이다. 손을 흔든다. 당신은 손을 흔든 적이 없다. 눈을 깜빡이니 다시 당신의 모습만 보인다.',rw:'exp'},{l:'덮개를 덮어 주러 들어간다',r:'방은 춥고 어둡다. 거울을 덮자 덮개 아래에서 무언가 떨어진다. 바닥에 서리 결정 하나.',rw:'mat1'}]},
 // ── 블라스파미아
 {id:'c_rust',land:'chaos',t:'녹물 웅덩이',x:'녹물 웅덩이 바닥에 무언가 반짝인다. 물에서 쇠 냄새가 난다.',
  c:[{l:'손을 넣는다',r:'손끝이 따끔하다. 건져 낸 것은 혼돈의 파편이다.',rw:'item+hurt'},{l:'막대로 건진다',r:'녹슨 블레서 장비 조각이 걸려 나온다. 착용자 칸이 비어 있다. 고철값은 받을 수 있겠다.',rw:'gold'}]},
 {id:'c_trumpet',land:'chaos',t:'멀리서 나팔',x:'신전 쪽에서 나팔 소리가 아주 멀리 한 번 울린다. 백야의 하늘은 그대로다.',
  c:[{l:'소리 쪽으로 몸을 숙인다',r:'아무 일도 일어나지 않는다. 다만 심장이 한동안 빨리 뛴다.',rw:'none'},{l:'바위 뒤에 숨는다',r:'바위 뒤에 먼저 숨어 있던 누군가의 짐이 있다. 주인은 없다. 회복약 하나를 챙긴다.',rw:'potion'}]},
 {id:'c_wish',land:'chaos',t:'소원 쪽지',x:'바위 틈에 접힌 쪽지가 수백 장 끼워져 있다. 소원을 적는 곳인 듯하다.',
  c:[{l:'하나를 펴 본다',r:'「집에 가고 싶어요」. 그 밑에 다른 필체로 「여기가 집이야」.',rw:'exp'},{l:'내 쪽지를 끼운다',r:'소원을 적어 본다. 쪽지를 끼우자 틈 안쪽에서 혼돈의 파편이 굴러 나온다. 기분이 이상하다.',rw:'mat1'}]},
 {id:'c_clock',land:'chaos',odd:1,t:'멈춘 시계',x:'길가에 시계 하나가 떨어져 있다. 바늘이 당신이 접속한 시각에 멈춰 있다.',
  c:[{l:'시계를 감는다',r:'째깍, 한 번. 바늘은 다시 같은 자리로 돌아간다. 해는 지지 않는다.',rw:'exp'},{l:'그대로 둔다',r:'돌아서는데 등 뒤에서 째깍 소리가 한 번 난다. 그 자리에 동전이 놓여 있다.',rw:'gold'}]},
 // ── 어디서나
 {id:'x_merchant',land:'any',t:'떠돌이 상인',x:'짐을 한가득 진 떠돌이 상인이 길을 막는다. "싸게 줄게, 싸게."',
  c:[{l:'하나 산다',r:'값을 치르고 받은 꾸러미를 열자 생각보다 좋은 물건이 들어 있다.',rw:'potion'},{l:'길을 비켜 달라고 한다',r:'상인이 투덜대며 비켜선다.',rw:'none'}]},
 {id:'x_rain',land:'any',t:'소나기',x:'갑자기 소나기가 쏟아진다. 가까운 동굴과 큰 나무가 보인다.',
  c:[{l:'동굴로 뛴다',r:'동굴 안쪽에 누가 두고 간 짐이 있다. 비가 그칠 때까지 정리해 둔다.',rw:'gold'},{l:'나무 아래 선다',r:'빗소리를 듣다 보니 생각이 정리된다.',rw:'exp'}]},
 {id:'x_chest',land:'any',t:'녹슨 상자',x:'길가 덤불 속에 녹슨 상자 하나. 자물쇠는 이미 부서져 있다.',
  c:[{l:'연다',r:'안에서 무언가 튀어나와 손을 문다. 쥐다. 상자 바닥에는 동전 몇 닢.',rw:'gold+hurt'},{l:'발로 밀어 본다',r:'상자가 넘어지며 안에 든 재료가 쏟아진다.',rw:'item'}]},
 {id:'x_dog',land:'any',t:'따라오는 개',x:'떠돌이 개 한 마리가 일정한 거리를 두고 따라온다.',
  c:[{l:'먹을 걸 나눠 준다',r:'개가 꼬리를 흔들며 앞장선다. 개가 멈춘 곳 땅을 파니 재료가 나온다.',rw:'item'},{l:'쫓아 보낸다',r:'개가 물러선다. 조금 미안한 마음으로 걷다 보니 생각보다 멀리 와 있다.',rw:'exp'}]},
 {id:'x_window',land:'any',odd:1,t:'시스템 창',x:'눈앞에 반투명한 창이 하나 떠 있다. 「접속을 유지하시겠습니까?」 버튼이 하나뿐이다.',
  c:[{l:'「예」를 누른다',r:'창이 사라진다. 바람이 다시 분다. 아무 일도 없었다. 아무 일도.',rw:'exp'},{l:'창을 손으로 밀어낸다',r:'손이 창을 통과한다. 창은 그대로 떠 있다가, 당신이 눈을 깜빡인 사이 사라진다.',rw:'none'}]},
];
function exevPool(land){const done=(S.me.exevToday&&S.me.exevToday.day===kstCycle())?S.me.exevToday.ids:[];return EXEV.filter(e=>(e.land===land||e.land==='any')&&!done.includes(e.id));}
function exevOn(){return EXEV_LIVE||(typeof isAdmin==='function'&&isAdmin());}
function exevFlag(e,k){return `ev_${e.id}_${k}`;}
/* 보상 표기: exp·gold·item(그 땅 재료, 가끔 음식)·potion·none · hurt=체력 −10%, hurt3·hurt5 = −3%·−5% · g10 = 골드 10 · mat1 = 그 땅 재료 1개만 · it:<아이템> = 그 아이템 1개 */
function exevRw(r,spec){const out={exp:0,gold:0,items:{}};let hurt=0;
  String(spec||'none').split('+').forEach(t=>{const h=/^hurt(\d*)$/.exec(t);if(h){hurt=(+h[1]||10)/100;return;}if(t==='none')return;
    let x;const g=/^g(\d+)$/.exec(t);if(g)x={gold:+g[1]};else if(t==='mat1')x={items:{[r.mat]:1}};else if(t.startsWith('it:'))x={items:{[t.slice(3)]:1}};else x=exploreReward(r,t);out.exp+=x.exp||0;out.gold+=x.gold||0;for(const k in x.items||{})out.items[k]=(out.items[k]||0)+x.items[k];});
  return {rw:out,hurt};}
function exevModal(){const P=S.sel.exev;if(!P)return;const e=EXEV.find(x=>x.id===P.id);if(!e){S.sel.exev=null;return;}
  modal(`<div class="exev ${e.odd?'odd':''}"><div class="md-lbl"><i class="lbl-d" aria-hidden="true">◆</i>${esc(P.label)} · 탐색 중</div><h3>${esc(e.t)}</h3><p class="exev-x">${esc(e.x)}</p>
    ${P.pick!=null?`<div class="exev-r"><b>▸ ${esc(e.c[P.pick].l)}</b><p>${esc(e.c[P.pick].r)}</p>${P.got?`<p class="exev-got">${esc(P.got)}</p>`:''}</div><div class="row" style="justify-content:flex-end"><button class="btn btn-primary" data-act="exev-close">닫기</button></div>`
      :`<div class="exev-c">${e.c.map((c,i)=>`<button class="btn" data-act="exev-pick" data-i="${i}">${esc(c.l)}</button>`).join('')}</div>`}</div>`);
  const mm=$('.modal');if(mm)mm.classList.add('exev-m');}
(function(){const f=ACTS['ex-go'];ACTS['ex-go']=function(d,...a){
  const r=EXPLORE.find(x=>x.id===d.id);if(!r||!exevOn()||Math.random()>=EXEV_P)return f(d,...a);
  const dd=daily();const A=d.area?MAP_INFO[d.area]:null;const an=d.area?(MAP_SPOTS.find(x=>x[0]===d.area)||[])[2]:null;const need=A?A.lv:r.lv;
  if(S.me.level<need||storyLock(r.id)||dd.explore>=EXPLORE_MAX)return f(d,...a);
  const pool=exevPool(r.id);if(!pool.length)return f(d,...a);
  const e=pick(pool);dd.explore++;bump('explores');
  const T=S.me.exevToday&&S.me.exevToday.day===kstCycle()?S.me.exevToday:(S.me.exevToday={day:kstCycle(),ids:[]});T.ids.push(e.id);
  S.sel.exev={id:e.id,land:r.id,lv:need,label:an||r.region,pop:!!d.pop,pick:null};save();render();if(d.pop)refreshMap();exevModal();};})();
Object.assign(ACTS,{
  'exev-pick':d=>{const P=S.sel.exev;if(!P||P.pick!=null)return;const e=EXEV.find(x=>x.id===P.id);if(!e)return;const i=+d.i;const c=e.c[i];if(!c)return;
    const r=EXPLORE.find(x=>x.id===P.land)||EXPLORE[0];const {rw,hurt}=exevRw({...r,lv:P.lv},c.rw);
    if(rw.exp||rw.gold||Object.keys(rw.items).length)grant(rw,'explore',{label:P.label});
    if(hurt&&typeof hpSet==='function')hpSet(Math.max(0.05,hpNow()-hurt));
    const k=i?'b':'a';const fl=exevFlag(e,k);S.flags[fl]=true;FLAG_NAMES[fl]=`탐색 · ${e.t} — ${c.l}`;
    const got=[gotText(rw),hurt?`체력 −${Math.round(hurt*100)}%`:''].filter(Boolean).join(' · ');
    S.me.exLog=[{ts:now(),region:P.label,land:P.land,text:`${e.t} · ${c.l}`,got},...(S.me.exLog||[])].slice(0,12);rec('explore',`${P.label} · ${e.t} — ${c.l}`,got);
    P.pick=i;P.got=got;save();exevModal();},
  'exev-close':()=>{const P=S.sel.exev;S.sel.exev=null;modal('');render();if(P&&P.pop&&typeof refreshMap==='function')refreshMap();}
});
/* 탐사 기록에서 이벤트 기록 이름 보이게(새로고침 뒤에도) */
EXEV.forEach(e=>e.c.forEach((c,i)=>{FLAG_NAMES[exevFlag(e,i?'b':'a')]=`탐색 · ${e.t} — ${c.l}`;}));
