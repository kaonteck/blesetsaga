'use strict';
/* 엔진 · 클래스 · 스킬 · 아이템 · 장비 단계 */
/*ENGINE-START*/
const ROLE={tank:'탱커',dps:'딜러',heal:'힐러'};
const CLASSES={
  defender:{name:'디펜더',en:'Defender',tier:1,role:'tank',range:'3×3',sigil:'盾',adv:['warrior','knight'],
    desc:'몬스터를 제압해 자신을 표적으로 삼게 만들고 파티를 지킨다.',
    stat:{hp:190,atk:30,def:8,luk:5},grow:{hp:12,atk:2,def:1,luk:0.15},skills:['attack','save','crimehazard','forestaller']},
  warrior:{name:'워리어',en:'Warrior',tier:2,base:'defender',role:'tank',range:'3×3',sigil:'戰',bonus:{hp:20,atk:8},
    desc:'공격형 플레이 위주로 몬스터의 시야를 장악하는 클래스.',skills:['attack','save2','crimehazard','forestaller','execution','roar','berserker']},
  knight:{name:'나이트',en:'Knight',tier:2,base:'defender',role:'tank',range:'3×3',sigil:'騎',bonus:{hp:40,def:3},
    desc:'방어형 플레이 위주로 아군을 보호하고 탱킹을 보조하는 클래스.',skills:['attack','save2','crimehazard','forestaller','attention','link','link2','sanctuary']},
  infighter:{name:'인파이터',en:'Infighter',tier:1,role:'dps',range:'3×3',sigil:'拳',adv:['mystic','destroyer'],
    desc:'무기와 신체에 마력을 실어 근접에서 몰아친다.',
    stat:{hp:140,atk:46,def:4,luk:10},grow:{hp:8,atk:3,def:0.5,luk:0.2},skills:['jolt','takedown','battlefield']},
  mystic:{name:'미스틱',en:'Mystic',tier:2,base:'infighter',role:'dps',range:'3×3',sigil:'影',bonus:{atk:6,luk:5},
    desc:'빈틈을 노려 연계와 독으로 끝을 낸다.',skills:['jolt','takedown','battlefield','rush','hitend','subterfuge']},
  destroyer:{name:'디스트로이어',en:'Destroyer',tier:2,base:'infighter',role:'dps',range:'3×3',sigil:'破',bonus:{atk:10},
    desc:'약점을 파고들어 한 번에 무너뜨린다.',skills:['jolt','takedown','battlefield','overkill','might','carnage']},
  mage:{name:'메이지',en:'Mage',tier:1,role:'dps',range:'5×5',sigil:'炎',adv:['salamander'],
    desc:'마력의 불꽃으로 멀리서 공격한다.',
    stat:{hp:115,atk:50,def:2,luk:8},grow:{hp:7,atk:3.2,def:0.4,luk:0.15},skills:['flame','cinder','blaze']},
  salamander:{name:'샐래맨더',en:'Salamander',tier:2,base:'mage',role:'dps',range:'5×5',sigil:'焰',bonus:{atk:10},
    desc:'지옥의 푸른 불까지 다루는 화염술사.',skills:['flame','cinder','blaze','meteor','hellfire','eternalflame']},
  shooter:{name:'슈터',en:'Shooter',tier:1,role:'dps',range:'5×5',sigil:'矢',adv:['dualist'],
    desc:'독과 연막으로 전장을 다루는 사격수.',
    stat:{hp:120,atk:44,def:3,luk:12},grow:{hp:7,atk:3,def:0.4,luk:0.25},skills:['shooting','poisonshot','smoke']},
  dualist:{name:'듀얼리스트',en:'Dualist',tier:2,base:'shooter',role:'dps',range:'5×5',sigil:'雙',bonus:{atk:6,luk:6},
    desc:'특수 탄환과 연사로 크리티컬을 노린다.',skills:['shooting','poisonshot','smoke','legendary','overburning','fusillade']},
  priest:{name:'프리스트',en:'Priest',tier:1,role:'heal',range:'5×5',sigil:'聖',adv:['demigod','summoner'],
    desc:'신의 축복으로 동료를 치유하고 되살린다.',
    stat:{hp:130,atk:34,def:4,luk:6},grow:{hp:8,atk:2.1,def:0.5,luk:0.15},skills:['shining','cure','sinsayer','smite']},
  demigod:{name:'데미갓',en:'Demigod',tier:2,base:'priest',role:'heal',range:'5×5',sigil:'神',bonus:{hp:20,atk:4},
    desc:'신을 강림시켜 파티 전체를 회복한다.',skills:['shining','cure','sinsayer','smite','judgment','bless','fasciation','pray','utopia']},
  summoner:{name:'서머너',en:'Summoner',tier:2,base:'priest',role:'heal',range:'5×5',sigil:'召',bonus:{hp:20,luk:4},
    desc:'소환수로 보호막과 약화를 거는 지원형 힐러.',skills:['shining','cure','sinsayer','smite','vindicate','blind','downworld','dystopia','backslider']}
};
const JOBS=CLASSES;
const ORIGIN={defender:'황혼녘 강가',infighter:'바위 산맥',mage:'붉은 모래사막',shooter:'오아시스 마을',priest:'적막의 숲'};
const ITEMS={
  potion:{name:'회복약',type:'use',target:'self',desc:'레이드 중 사용 · 자신의 HP 50 회복 · 평소에 사용하면 10분 동안 HP +20',price:30,buff:{stat:'maxHp',val:20,min:10}},
  holywater:{name:'정화의 성수',type:'use',target:'self',desc:'레이드 중 사용 · 자신의 상태 이상 제거 · 평소에 사용하면 10분 동안 행운 +3',price:40,buff:{stat:'luk',val:3,min:10}},
  elixir:{name:'용기의 영약',type:'use',target:'self',desc:'[테스트용] 마시면 60분 동안 공격력 +8, 행운 +4. 아이템 보너스 표시를 확인하기 위한 가상의 아이템.',price:150,buff:{stat:'atk',val:8,min:60},buff2:{stat:'luk',val:4,min:60}},
  sword:{name:'낡은 순례자 검',type:'equip',slot:'weapon',stats:{atk:3},desc:'순례자들이 호신용으로 지니던 검',price:90},
  shield:{name:'성역의 대방패',type:'equip',slot:'weapon',stats:{def:3,maxHp:25},desc:'성역 기사단의 문장이 새겨진 방패'},
  bow:{name:'추적자의 장궁',type:'equip',slot:'weapon',stats:{mag:6,luk:2},desc:'블라스파미아의 나무로 깎은 활'},
  staff:{name:'축복의 지팡이',type:'equip',slot:'weapon',stats:{mag:3,luk:3},desc:'끝에 맑은 수정이 박힌 지팡이'},
  leather:{name:'탐사대 가죽갑옷',type:'equip',slot:'armor',stats:{def:2,maxHp:15},desc:'탐사대 보급품',price:120},
  cloak:{name:'백야의 망토',type:'equip',slot:'armor',stats:{def:4,luk:1,maxHp:30},desc:'해가 지지 않는 땅의 빛을 머금은 망토'},
  amulet:{name:'라니아케아의 부적',type:'equip',slot:'acc',stats:{luk:5,maxHp:20},desc:'신들의 축복이 깃든 부적'},
  crest:{name:'봉인 수호자의 문장',type:'equip',slot:'acc',stats:{atk:6,def:3,maxHp:40,luk:2},desc:'봉인 수호자를 쓰러뜨린 증표'}
};
const SLOT={weapon:'무기',armor:'방어구',acc:'장신구'};
/* ───────── 장비 단계 (지역 8단계 · 역할별 무기) ───────── */
const WTYPE={gsword:'대검',axe:'도끼',sws:'장검·방패',knuckle:'너클',dagger:'단도',staff:'지팡이',gun:'건',dgun:'듀얼건',scepter:'홀',orb:'오브'};
const CLASS_WEAPON={defender:['gsword'],warrior:['axe','gsword'],knight:['sws'],infighter:['knuckle','dagger'],mystic:['dagger'],destroyer:['knuckle'],
  mage:['staff'],salamander:['staff'],shooter:['gun'],dualist:['dgun'],priest:['scepter'],demigod:['scepter'],summoner:['orb']};
const BASE_WT=['gsword','knuckle','dagger','staff','gun','scepter'];
const GEAR_TIER=[ // [단계 이름, 지역, 착용 레벨, 방어구 이름, 장신구 이름, 설명]
 ['들바람','meadow',5,'가죽 조끼','방울 팔찌','초원의 바람을 머금은 견습 블레서의 장비.'],
 ['청석','rock',10,'경갑','수련자의 염주','바위 산맥 수련자들이 푸른 돌을 벼려 만든 장비.'],
 ['독안개','swamp',20,'로브','해독 부적','늪의 독안개를 견디도록 약초 기름을 먹인 장비.'],
 ['백염','salt',30,'흉갑','소금 결정 귀걸이','소금 사막의 흰 결정으로 단단하게 다진 장비.'],
 ['심해','sea',40,'비늘 갑옷','진주 목걸이','깊은 바다의 비늘과 진주로 장식한 장비.'],
 ['열사','ember',50,'화염 갑주','불씨 반지','작열의 땅 용암에 담금질한 장비.'],
 ['빙결','frost',65,'서리 판금','빙정 브로치','녹지 않는 얼음으로 감싼 혹한의 장비.'],
 ['백야','chaos',80,'성휘 갑주','백야의 성표','블라스파미아의 어둠 속에서도 빛을 잃지 않는 최후의 장비.']];
const GEAR_IDS=[];
GEAR_TIER.forEach(([pre,land,L,arm,acc,desc],t)=>{const T=t+1;const ids={w:{},armor:'g'+T+'_armor',acc:'g'+T+'_acc'};
  const A=Math.round(4+L*1.0),price=Math.round(40+L*14);
  const W={gsword:{atk:A,maxHp:Math.round(L*1.2)},axe:{atk:Math.round(A*1.15)},sws:{atk:Math.round(A*0.6),def:Math.round(2+L*0.3),maxHp:Math.round(15+L*3)},
    knuckle:{atk:Math.round(A*0.95),luk:Math.round(1+L*0.08)},dagger:{atk:Math.round(A*0.9),luk:Math.round(2+L*0.15)},staff:{mag:Math.round(A*1.05),luk:Math.round(1+L*0.08)},
    gun:{mag:A,luk:Math.round(1+L*0.1)},dgun:{mag:Math.round(A*1.1),luk:Math.round(1+L*0.05)},scepter:{mag:Math.round(A*0.9),luk:Math.round(2+L*0.2),maxHp:Math.round(10+L*2)},orb:{mag:A,luk:Math.round(3+L*0.25)}};
  (L<20?BASE_WT:Object.keys(WTYPE)).forEach(w=>{const id=`g${T}_${w}`;ids.w[w]=id;GEAR_IDS.push(id);
    ITEMS[id]={name:`${pre} ${WTYPE[w]}`,type:'equip',slot:'weapon',wtype:w,tier:T,levelReq:L,stats:W[w],desc:desc,price};});
  ITEMS[ids.armor]={name:`${pre} ${arm}`,type:'equip',slot:'armor',tier:T,levelReq:L,stats:{def:Math.round(2+L*0.35),maxHp:Math.round(15+L*4)},desc,price};
  ITEMS[ids.acc]={name:`${pre} ${acc}`,type:'equip',slot:'acc',tier:T,levelReq:L,stats:{luk:Math.round(2+L*0.15),maxHp:Math.round(10+L*2),atk:Math.round(L*0.25),mag:Math.round(L*0.25)},desc,price};
  GEAR_IDS.push(ids.armor,ids.acc);});
function lootText(m){const L=m.loot||[];const t=ITEMS[L[0]];if(t&&t.tier)return `${GEAR_TIER[t.tier-1][0]} 장비(LV${GEAR_TIER[t.tier-1][2]}+ 무기·방어구·장신구)`;return L.map(k=>ITEMS[k]?ITEMS[k].name:k).join(' / ');}
const gearOfTier=T=>GEAR_IDS.filter(id=>ITEMS[id].tier===T);
function pickLoot(m){const L=m.loot||[];if(!L.length)return 'potion';const me=S&&S.me;
  if(me&&Math.random()<0.7){const mine=L.filter(k=>{const it=ITEMS[k];return it&&(!it.wtype||(CLASS_WEAPON[me.job]||[]).includes(it.wtype));});if(mine.length)return pick(mine);}return pick(L);}
const STATK={maxHp:'HP',atk:'공격력',mag:'마력',def:'방어력',luk:'행운',mov:'이동 범위'};
const ART={
forest:String.raw`    \ | /   \ | /
   --(  o    o  )--
      \  ~~~~  /
    /| |  ||  | |\
   / |_|__||__|_| \
       //    \\`,
tracker:String.raw`    /\_______/\
   /  >     <  \
  (    ==V==    )~~~
   \   _____   /
    |_|     |_|`,
guardian:String.raw`         _/|\_
       /   |   \
      |  ( O )  |
      |   \_/   |
     /|=========|\
    / |  |   |  | \
   /__|__|___|__|__\
         |   |`,
beast:String.raw`    /\_/\  ___
   ( o.o )/   \~
    > ^ <|     |
   /|   |\_____/
  (_|   |_)`,
spirit:String.raw`      .-~~~-.
    .'  o o  '.
   (    ___    )
    '.  \_/  .'
      )~~~~~(
     (  ~ ~  )`,
golem:String.raw`     [=====]
    _|[o o]|_
   |  \___/  |
   |_|=====|_|
     ||   ||
    [__] [__]`,
generic:String.raw`     .-""""-.
    /  x  x  \
   |   ----   |
    \  ____  /
     '-....-'`
};
const DEFAULT_MONSTERS=[
  {id:'forest',kind:'party',name:'변이된 숲의 파수꾼',art:'forest',region:'변이된 숲',published:true,rev:1,
   desc:'혼돈에 물든 숲을 지키던 고목이 일어섰다. 가지 끝마다 독 포자가 맺혀 있다.',
   level:3,maxLevel:null,min:3,max:4,target:3,roles:{tank:1,dps:1,heal:1},
   hp:760,hpScale:0.3,atk:60,def:0,
   singleName:'가시 덩굴 휘두르기',singleMult:1.0,aoeName:'뿌리 폭풍',aoeMult:0.6,aoeEvery:3,
   dotName:'독 포자',dotChance:0.3,dotDmg:8,
   exp:140,gold:70,drops:[['potion',0.5],['sword',0.2],['leather',0.15]]},
  {id:'tracker',kind:'party',name:'블라스파미아 추적자',art:'tracker',region:'블라스파미아 경계',published:true,rev:1,
   desc:'저주받은 땅의 냄새를 따라 탐사대를 쫓는 짐승. 무리를 지어 다닌다는 소문이 있다.',
   level:8,maxLevel:null,min:3,max:4,target:3,roles:{tank:1,dps:1,heal:1},
   hp:1280,hpScale:0.3,atk:104,def:0,
   singleName:'그림자 송곳니',singleMult:1.0,aoeName:'추적의 포효',aoeMult:0.6,aoeEvery:3,
   dotName:'저주 출혈',dotChance:0.35,dotDmg:12,
   exp:320,gold:150,drops:[['holywater',0.4],['bow',0.15],['shield',0.15],['staff',0.15]]},
  {id:'guardian',kind:'weekly',name:'백야의 신전 봉인 수호자',art:'guardian',region:'백야의 신전',published:true,rev:1,
   desc:'잠든 혼돈을 가두는 봉인을 지켜 온 거인. 봉인이 흔들리며 다가오는 모든 것을 적으로 여긴다.',
   level:15,maxLevel:null,min:6,max:12,target:6,roles:{tank:1,dps:3,heal:2},
   hp:5000,hpScale:0.18,atk:170,def:0,
   singleName:'봉인의 사슬',singleMult:1.0,aoeName:'백야의 섬광',aoeMult:0.6,aoeEvery:3,
   dotName:'혼돈 침식',dotChance:0.3,dotDmg:18,
   exp:750,gold:400,drops:[['cloak',0.25],['amulet',0.2],['crest',0.1]]}
];
/* type: dice(결과값 공격) · nodice(결과값 미사용) · heal · support · addon(다른 공격과 함께) · passive
   phase: pre(④ 방어·보호 단계) · main(⑤ 행동 단계) */
const SKILLS={
  attack:{name:'공격',en:'Attack',type:'dice',target:'enemy',desc:'대상을 무기로 공격한다.'},
  save:{name:'세이브',en:'Save',type:'support',phase:'pre',target:'self',uses:2,reduce:10,desc:'자신의 방어력을 일시적으로 강화한다. 한 턴 동안 받는 대미지 10% 감소.'},
  save2:{name:'세이브 Ⅱ',en:'Save Ⅱ',type:'support',phase:'pre',target:'self',uses:2,reduce:30,desc:'자신의 방어력을 일시적으로 강화한다. 한 턴 동안 받는 대미지 30% 감소.'},
  crimehazard:{name:'크라임 해저드',en:'Crime Hazard',type:'dice',target:'enemy',uses:2,bonus:25,desc:'무기를 강하게 내리찍는다. 추가 대미지 +25%.'},
  forestaller:{name:'제압',en:'Forestaller',type:'support',phase:'pre',target:'self',desc:'몬스터를 도발하여 자신을 우선 표적으로 삼게 만든다. 일정 이상의 대미지를 요하며, 특정 조건이 충족되면 스킬의 효력이 없어진다.',cond:['딜러가 입힌 총 대미지가 디펜더가 입힌 총 대미지의 네 배 이상 (다시 쓸 때마다 여덟 배, 열여섯 배로 늘어난다)','제압한 탱커가 쓰러짐']},
  execution:{name:'처형',en:'Execution',type:'dice',target:'enemy',desc:'공격하며 이번 턴 포함 3턴 동안 공격할 때마다 추가 대미지 0~22%를 준다.'},
  roar:{name:'전장의 포효',en:'Roar of a battle',type:'addon',special:true,uses:1,desc:'두 턴 동안 대미지 +60%. 시전자 HP가 최대 HP의 10%만큼 줄어든다. 공격 스킬과 함께 사용.'},
  berserker:{name:'광전사',en:'Berserker',type:'addon',special:true,uses:1,desc:'두 턴 동안 대미지 ×2. 유지되는 동안 시전자 최대 HP 10% 감소. 공격 스킬과 함께 사용.'},
  attention:{name:'시야 강탈',en:'Attention',type:'support',phase:'pre',target:'self',desc:'제압이 걸린 몬스터의 표적을 1턴 동안 자신에게 고정한다. 제압이 유효할 때만 사용 가능.'},
  link:{name:'결속',en:'Link',type:'support',phase:'pre',target:'ally',uses:2,desc:'지정한 아군과 결속. 자신은 최대 HP의 10%만큼 대미지를 받고, 아군을 1턴 동안 모든 상태이상과 대미지로부터 보호한다.'},
  link2:{name:'결속강화',en:'Link Ⅱ',type:'support',phase:'pre',target:'ally',uses:2,special:true,desc:'대미지 없이 결속한 아군과 자신을 1턴 동안 모든 상태이상과 대미지로부터 보호한다.'},
  sanctuary:{name:'성역',en:'Sacred place',type:'support',phase:'pre',target:'party',uses:1,special:true,desc:'아군 전체를 1턴 동안 모든 상태이상과 대미지로부터 보호한다.'},
  jolt:{name:'졸트',en:'Jolt',type:'dice',target:'enemy',desc:'대상을 무기로 공격한다.'},
  takedown:{name:'테이크다운',en:'Takedown',type:'nodice',target:'self',uses:1,desc:'무기와 신체에 기운을 주입한다. 다음 턴부터 2턴 동안 대미지 +25%.'},
  battlefield:{name:'배틀 필드',en:'Battle field',type:'dice',target:'enemy',desc:'발을 굴러 근방 3×3 영역 모두에게 대미지를 준다. 대상당 한 칸의 대미지만 적용.'},
  rush:{name:'러시',en:'Rush',type:'dice',target:'enemy',combo:{from:'jolt',bonus:15},desc:'대상을 빠르게 난도질한다.'},
  hitend:{name:'히트엔드',en:'Hitend',type:'dice',target:'enemy',combo:{from:'rush',bonus:25},crit:true,desc:'대상의 빈틈을 노려 깊게 찌른다.'},
  subterfuge:{name:'속임수',en:'Subterfuge',type:'dice',target:'enemy',uses:2,special:true,bonus:25,poison:{pct:12,turns:2},desc:'독을 바른 무기로 공격(+25%). 이번 턴 포함 2턴 동안 공격력의 12% 중독.'},
  overkill:{name:'오버킬',en:'Overkill',type:'dice',target:'enemy',combo:{from:'jolt',bonus:15},desc:'졸트로 노린 대상의 약점을 파고든다.'},
  might:{name:'권능',en:'Might',type:'dice',target:'enemy',combo:{from:'overkill',bonus:40},crit:true,desc:'오버킬과 연계하여 연속으로 강한 공격을 가한다.'},
  carnage:{name:'대학살',en:'Carnage',type:'addon',special:true,uses:1,with:['overkill'],desc:'오버킬과 함께 사용. 대미지가 공격력의 2배 이상이면 이번 턴 포함 3턴 동안 모든 스킬 대미지 ×2.'},
  flame:{name:'플레임',en:'Flame',type:'dice',target:'enemy',desc:'대상을 마력으로 공격한다.'},
  cinder:{name:'신더',en:'Cinder',type:'nodice',phase:'pre',target:'enemy',desc:'대상에게 의욕감소(몬스터 공격 대미지 −12%)를 2턴 동안 건다.'},
  blaze:{name:'블레이즈',en:'Blaze',type:'dice',target:'enemy',combo:{from:'flame',bonus:15},desc:'여러 개의 불덩이를 발사한다.'},
  meteor:{name:'메테오',en:'Meteor',type:'dice',target:'enemy',combo:{from:'flame',bonus:25},crit:true,desc:'거대한 불덩이를 발사한다.'},
  hellfire:{name:'헬파이어',en:'Hellfire',type:'nodice',target:'enemy',desc:'대상의 신체에 불꽃을 피운다. 이번 턴 포함 3턴 동안 마력의 18% 고정 대미지.'},
  eternalflame:{name:'이터널 플레임',en:'Eternal Flame',type:'addon',special:true,uses:1,desc:'공격 스킬과 함께 사용. 3턴 동안 판정 90~109%면 ×2, 110% 이상이면 ×3. 단 90% 미만이면 이번 턴과 다음 턴 공격 대미지가 무효.'},
  shooting:{name:'집중 사격',en:'Shooting',type:'dice',target:'enemy',desc:'대상을 무기로 공격한다.'},
  poisonshot:{name:'포이즌슈팅',en:'Poison Shooting',type:'dice',target:'enemy',poison:{pct:12,turns:3},desc:'독을 바른 총알을 발사한다. 이번 턴 포함 3턴 동안 마력의 12% 중독. 속임수 중독과 중첩되지 않는다.'},
  smoke:{name:'연막탄',en:'Smoke Projectile',type:'dice',target:'enemy',uses:1,bonus:25,desc:'추가 대미지 +25%. 다음 턴 본인을 제외한 파티원 대미지 +15%(시전자 마력 기준).'},
  legendary:{name:'레전더리 샷',en:'Legendary Shot',type:'dice',target:'enemy',combo:{from:'shooting',bonus:25},crit:true,desc:'특수 탄환을 장전하여 공격한다. 판정이 110% 이상이면 다음 턴 오버 버닝 사용 가능.'},
  overburning:{name:'오버 버닝',en:'Over burning',type:'dice',target:'enemy',desc:'직전 턴 레전더리 샷의 판정이 110% 이상일 때 사용 가능. 결과값 ×2.'},
  fusillade:{name:'연사',en:'Fusillade',type:'passive',special:true,desc:'크리티컬 판정에 성공하면 다음 턴에 스킬을 두 번 사용할 수 있다.'},
  shining:{name:'샤이닝',en:'Shining',type:'dice',target:'enemy',mult:1.3,holy:true,desc:'대상을 신성한 빛으로 공격한다. 대미지 ×1.3, 영혼형 몬스터에게는 ×1.5 추가.'},
  smite:{name:'징벌',en:'Smite',type:'dice',target:'enemy',lv:10,drain:30,desc:'신의 벌을 내린다. 준 대미지의 30%만큼 HP가 가장 낮은 아군(혼자면 자신)을 회복한다. LV10부터 사용 가능.'},
  judgment:{name:'심판',en:'Judgment',type:'dice',target:'enemy',uses:2,mult:1.6,crit:true,desc:'하늘의 심판을 내린다. 대미지 ×1.6.'},
  cure:{name:'큐어',en:'Cure',type:'heal',target:'ally',desc:'신의 축복으로 치유한다. 회복량 = 마력 × 판정 × 40% + 마력의 10%.'},
  sinsayer:{name:'신세이어',en:'Sin-sayer',type:'heal',target:'dead',desc:'쓰러진 아군을 최대 HP의 30%로 부활시킨다. 시전자는 2턴 동안 어떤 스킬도 쓸 수 없다. 전 범위.'},
  bless:{name:'블레스',en:'Bless',type:'heal',target:'ally',uses:2,desc:'3턴 동안 대상 최대 HP의 5%씩 회복한다(이번 턴 포함). 추가 회복력 적용 불가.'},
  fasciation:{name:'결속자',en:'Fasciation',type:'heal',target:'party',uses:1,desc:'아군 전체를 회복한다. 회복량 = 마력 × 판정 × 40% + 마력의 12%.'},
  pray:{name:'프레이',en:'Pray',type:'heal',target:'ally',uses:1,desc:'자신의 최대 HP 15%를 바쳐 대상의 HP를 전부 회복한다.'},
  utopia:{name:'유토피아',en:'Utopia',type:'heal',target:'party',uses:1,special:true,desc:'낙원의 신을 강림시켜 아군 전체를 회복한다. 회복량 = 마력 × 판정 × 40% + 마력의 40%.'},
  vindicate:{name:'비호',en:'Vindicate',type:'support',phase:'pre',target:'party',uses:2,desc:'이번 턴 아군 전체가 받는 대미지 20% 감소.'},
  blind:{name:'블라인드',en:'Blind',type:'support',phase:'pre',target:'party',uses:1,desc:'소환수가 대상의 방어를 낮춘다. 이번 턴 아군 전체 대미지 +25%(시전자 마력 기준).'},
  downworld:{name:'다운월드',en:'Down World',type:'support',phase:'pre',target:'enemy',uses:1,desc:'소환수가 한 턴 동안 대상을 봉쇄한다. 이번 턴 몬스터 대미지 −30%.'},
  dystopia:{name:'디스토피아',en:'Dystopia',type:'addon',special:true,uses:1,desc:'공격 스킬과 함께 사용. 아군 전체가 최대 HP의 3%씩 바쳐 이번 공격 대미지 ×3.'},
  backslider:{name:'타락자',en:'Backslider',type:'support',phase:'pre',target:'ally',uses:1,special:true,desc:'대상의 대미지를 이번 턴 동안 ×2.'}
};
function basicSkill(cls){return CLASSES[cls].skills.find(s=>SKILLS[s].type==='dice');}
/* 판정 · 크리티컬 · 회복 공식 (전투 공식 정리는 docs/combat-formulas.md) */
const JUDGE_MIN=0.8,JUDGE_MAX=1.2,CRIT_MULT=1.5,MON_HIT=0.45,DEF_K=50;
function judgeRoll(rng){return JUDGE_MIN+(JUDGE_MAX-JUDGE_MIN)*rng();}
function critChance(p,s){if(!s||s.type!=='dice')return 0;return (5+(p.luk||0)*0.5)*(s.crit?2:1);}
function healAmt(p,rng,bonus){return Math.max(1,Math.round(p.atk*(judgeRoll(rng)*0.4+bonus)));}
function rollD(n,rng){return 1+Math.floor(rng()*Math.max(1,Math.round(n)));}
const ENH_MAX=10;
function enhStep(v){return Math.max(1,Math.round(Math.abs(v)*0.15))*Math.sign(v||1);}
function itemStats(id,lv){const it=ITEMS[id];if(!it||!it.stats)return {};const o={};for(const k in it.stats)o[k]=it.stats[k]+(lv||0)*(it.stats[k]>0?enhStep(it.stats[k]):0);return o;}
const MAGIC_BASE=['mage','shooter','priest'];
function isMagic(job){const c=CLASSES[job];return !!c&&MAGIC_BASE.includes(c.base||job);}
function powOf(st){return st.pk==='mag'?st.mag:st.atk;}
function statsFor(cls,level,equip,enh){
  const c=CLASSES[cls],b=CLASSES[c.base||cls],L=(level-1)*(1+(level-1)/196);
  const s={maxHp:Math.round(b.stat.hp+b.grow.hp*L),atk:Math.round(b.stat.atk+b.grow.atk*L),def:Math.round(b.stat.def+b.grow.def*L),luk:Math.round(b.stat.luk+b.grow.luk*L),mov:0,mag:0};
  for(const k in (c.bonus||{}))s[k==='hp'?'maxHp':k]+=c.bonus[k];
  /* 마력 계열(메이지·슈터·프리스트 계열): 클래스의 힘 수치가 마력으로 간다 */
  if(isMagic(cls)){s.mag=s.atk;s.atk=0;}
  for(const slot in (equip||{})){const id=equip[slot];const st=itemStats(id,(enh||{})[id]);for(const k in st)s[k]=(s[k]||0)+st[k];}
  s.pk=isMagic(cls)?'mag':'atk';
  return s;
}
function roleOf(cls){return CLASSES[cls].role;}
function makeFighter(p){
  const s=statsFor(p.job,p.level,p.equip,p.enh);
  return {id:p.id,name:p.name,job:p.job,role:roleOf(p.job),level:p.level,isMe:!!p.isMe,...s,atk:powOf(s),hp:s.maxHp,
    dead:false,uses:{},buffs:[],poison:null,hot:null,bound:0,supUses:0,last:null,lastTurn:-9,obTurn:-9,doubleTurn:-9,
    dealt:0,turnDealt:0,protect:false,reduce:0,defending:false,action:null,action2:null,confirmed:false,direct:0,planAt:0};
}
function weightedPick(arr,w,rng){let tot=0;for(const x of arr)tot+=w(x);let r=rng()*tot;for(const x of arr){r-=w(x);if(r<=0)return x;}return arr[arr.length-1];}
function living(b){return b.players.filter(p=>!p.dead);}
function createBattle(m,members,rng,cfg){
  const n=members.length;
  const hp=Math.round(m.hp*(1+m.hpScale*Math.max(0,n-m.min)));
  const players=members.map(makeFighter);
  const tb={};players.forEach(p=>tb[p.id]=rng());
  const order=players.slice().sort((a,b)=>(b.luk-a.luk)||(tb[a.id]-tb[b.id])).map(p=>p.id);
  const b={id:'B'+Date.now().toString(36)+Math.floor(rng()*1e8).toString(36),monsterId:m.id,
    mon:{name:m.name,art:m.art,hp,maxHp:hp,atk:m.atk,def:m.def||0,poison:null,burn:null,weaken:0,
      singleName:m.singleName,singleMult:m.singleMult,aoeName:m.aoeName,aoeMult:m.aoeMult,aoeEvery:Math.max(2,m.aoeEvery|0),
      dotName:m.dotName,dotChance:m.dotChance,dotDmg:m.dotDmg},
    rules:{exp:m.exp,gold:m.gold,drops:m.drops.map(d=>d.slice()),turnSeconds:cfg.turnSeconds},
    players,order,turn:0,log:[],over:null,sup:null,partyBuffs:[],startedAt:Date.now()};
  b.log.push({t:'sys',text:`전투 시작 · ${n}인 · 몬스터 HP ${hp} · 몬스터 공격력 ${m.atk} · 행동 순서(행운): ${order.map(id=>players.find(p=>p.id===id).name).join(' → ')}`});
  startTurn(b,rng);
  return b;
}
function supMult(n){return 4*Math.pow(2,Math.min(2,Math.max(0,n-1)));}
function threatOrder(b){const sup=supActive(b)?b.players.find(p=>p.id===b.sup.by):null;
  return living(b).map(p=>({p,t:(p===sup?1e12:0)+(b.attention===p.id?1e11:0)+(p.role==='tank'?1e6+(p.supUses||0)*1e5:0)+p.dealt+Math.round((p.healed||0)*0.5)})).sort((x,y)=>y.t-x.t).map(x=>x.p);}
function supActive(b){return b.sup&&!b.players.find(p=>p.id===b.sup.by).dead;}
function telText(b){
  const t=b.tel;if(!t)return '';
  if(t.type==='aoe')return `${t.name} · ${b.grid?'전장 전체':'파티 전체'} 광역 공격`;
  if(t.type==='area')return `${t.name} · 붉은 칸 ${t.cells.length}곳 범위 공격 (이동해서 피할 수 있음)`;
  const p=b.players.find(x=>x.id===t.target);
  return `${t.name} → ${p?p.name:'?'}${t.type==='dot'?` · ${b.mon.dotName} 부여`:''}`;
}
function startTurn(b,rng){
  b.turn++;b.shield=0;b.sanct=false;b.bind=0;b.attention=null;
  b.players.forEach(p=>{p.action=null;p.action2=null;p.confirmed=false;p.defending=false;p.protect=false;p.reduce=0;p.turnDealt=0;});
  const m=b.mon,alive=living(b);
  if(b.grid){gridPhase(b);b.tel=gridTel(b,rng);}
  else if(b.turn%m.aoeEvery===0)b.tel={type:'aoe',name:m.aoeName,mult:m.aoeMult};
  else{
    const target=supActive(b)?b.players.find(p=>p.id===b.sup.by):weightedPick(alive,p=>p.role==='tank'?2:1,rng);
    const dot=rng()<m.dotChance;
    b.tel={type:dot?'dot':'single',name:dot?m.dotName:m.singleName,mult:m.singleMult,target:target.id};
  }
  b.log.push({t:'turn',text:`${b.turn}턴`});
  b.log.push({t:'warn',text:`예고 · ${telText(b)}`});
}
function usesLeft(p,k){const s=SKILLS[k];return s.uses?s.uses-(p.uses[k]||0):Infinity;}
function buffOn(p,k,turn){return p.buffs.find(x=>x.k===k&&x.from<=turn&&x.to>=turn);}
function addBuff(p,k,from,to,extra){p.buffs=p.buffs.filter(x=>x.k!==k);p.buffs.push({k,from,to,...(extra||{})});}
function comboReady(p,k,turn){const c=SKILLS[k].combo;return !!(c&&p.last===c.from&&p.lastTurn>=turn-1);}
function canDouble(p,b){return p.doubleTurn===b.turn&&p.job==='dualist';}
function checkAct(b,p,a,hasItem,primary){
  if(p.dead)return '전투 불능';
  if(!a||a.kind==='defend')return null;
  if(p.bound>0)return '빛의 속박 중 · 스킬 사용 불가';
  if(a.kind==='skill'&&SKILLS[a.skill]&&SKILLS[a.skill].lv&&(p.level||1)<SKILLS[a.skill].lv)return `LV${SKILLS[a.skill].lv}부터 사용 가능`;
  if(a.kind==='item'){
    if(!hasItem||!hasItem(p.id,a.item))return '소지품 없음';
    return null;
  }
  const s=SKILLS[a.skill];if(!s)return '알 수 없는 스킬';
  if(!CLASSES[p.job].skills.includes(a.skill))return '이 클래스의 스킬이 아님';
  if(s.type==='addon'||s.type==='passive')return '단독으로 사용할 수 없음';
  if(usesLeft(p,a.skill)<=0)return '사용 횟수 소진';
  if(primary&&primary.skill===a.skill&&s.uses)return '같은 제한 스킬을 두 번 쓸 수 없음';
  if(a.skill==='attention'&&!supActive(b))return '제압이 유효하지 않음';
  if(a.skill==='overburning'&&p.obTurn!==b.turn)return '레전더리 샷 조건 미충족';
  if(s.target==='enemy'&&b.mon.hp<=0)return '대상이 유효하지 않음';
  if(b.grid&&s.target==='enemy'&&!inRange(b,p))return '보스가 사거리 밖';
  if(b.grid&&s.type==='heal'&&['ally','dead'].includes(s.target)){const t=b.players.find(x=>x.id===a.target);if(t&&t.pos!=null&&cheb(p.pos,t.pos)>HEAL_R)return '대상이 회복 사거리(5×5) 밖';}
  if(s.target==='ally'){const t=b.players.find(x=>x.id===a.target);if(!t||t.dead)return '대상이 유효하지 않음';if((a.skill==='link'||a.skill==='link2')&&t.id===p.id)return '자신과는 결속할 수 없음';}
  if(s.target==='dead'){const t=b.players.find(x=>x.id===a.target);if(!t||!t.dead)return '부활할 대상이 없음';}
  if(a.addon){
    const ad=SKILLS[a.addon];
    if(!ad||ad.type!=='addon'||!CLASSES[p.job].skills.includes(a.addon))return '함께 쓸 수 없는 스킬';
    if(usesLeft(p,a.addon)<=0)return `${ad.name} 사용 횟수 소진`;
    if(s.type!=='dice')return `${ad.name}은(는) 공격 스킬과 함께 써야 함`;
    if(ad.with&&!ad.with.includes(a.skill))return `${ad.name}은(는) ${ad.with.map(x=>SKILLS[x].name).join('·')}와 함께 써야 함`;
  }
  return null;
}
function resolveTurn(b,rng,hooks){
  hooks=hooks||{};
  const m=b.mon,T=b.turn,log=(t,text)=>b.log.push({t,text}),P=id=>b.players.find(p=>p.id===id);
  const heal=(src,t,amt,label)=>{if(t.dead)return 0;if(b.healMult&&src&&src.id)amt=Math.round(amt*b.healMult);const miss=t.maxHp-t.hp;const h=Math.min(amt,miss);t.hp+=h;if(src&&src.id)src.healed=(src.healed||0)+h;
    if(amt>miss&&supActive(b)){b.sup.overheal++;}
    log('heal',`${src.name} · ${label} → ${t.name} ${h} 회복${amt>miss?' (오버 힐)':''}`);return h;};
  const spend=(p,k)=>{if(SKILLS[k].uses)p.uses[k]=(p.uses[k]||0)+1;};
  // ③ 미확정자 자동 방어
  b.players.forEach(p=>{if(!p.dead&&!p.confirmed){p.action={kind:'defend',auto:true};p.confirmed=true;log('sys',`${p.name} · 시간 초과로 자동 방어`);}});
  const acts=p=>[p.action,canDouble(p,b)?p.action2:null].filter(Boolean);
  // ④ 방어와 보호, 지원 효과
  for(const id of b.order){
    const p=P(id);if(p.dead)continue;
    for(const a of acts(p)){
      if(a.kind==='defend'){p.defending=true;if(!a.auto){p.direct++;log('act',`${p.name} · 방어 (받는 대미지 50% 감소)`);}a.done=true;continue;}
      if(a.kind!=='skill'||SKILLS[a.skill].phase!=='pre')continue;
      a.done=true;p.direct++;
      const err=checkAct(b,p,a,hooks.hasItem);
      if(err){p.defending=true;log('sys',`${p.name} · ${err} → 방어로 전환`);continue;}
      const s=SKILLS[a.skill];spend(p,a.skill);const t=a.target?P(a.target):null;
      switch(a.skill){
        case 'save':case 'save2':p.reduce+=s.reduce;log('act',`${p.name} · ${s.name} (받는 대미지 −${s.reduce}%)`);break;
        case 'forestaller':p.supUses++;b.sup={by:p.id,mult:supMult(p.supUses),overheal:0};log('act',`${p.name} · 제압! 몬스터의 표적이 된다 (유지 조건: 딜러 총 대미지 < ${p.name} 총 대미지 ×${b.sup.mult})`);break;
        case 'attention':b.attention=p.id;log('act',`${p.name} · 시야 강탈! 이번 턴 표적 고정`);break;
        case 'link':{const lc=Math.round(p.maxHp*0.1);p.hp=Math.max(0,p.hp-lc);t.protect=true;log('act',`${p.name} · 결속 → ${t.name} 보호, 자신은 ${lc} 대미지(최대 HP 10%)${p.hp===0?' (쓰러짐)':''}`);}if(p.hp===0)p.dead=true;break;
        case 'link2':p.protect=true;t.protect=true;log('act',`${p.name} · 결속강화 → ${t.name}와(과) 함께 1턴 보호`);break;
        case 'sanctuary':b.sanct=true;log('act',`${p.name} · 성역! 아군 전체 1턴 보호`);break;
        case 'cinder':m.weaken=2;log('act',`${p.name} · 신더 → ${m.name} 의욕감소 2턴 (공격 −12%)`);break;
        case 'vindicate':b.shield+=20;log('act',`${p.name} · 비호 (아군 전체 받는 대미지 −20%)`);break;
        case 'blind':{const v=Math.round(p.atk*0.25);b.players.forEach(x=>addBuff(x,'blind',T,T,{add:v}));log('act',`${p.name} · 블라인드 (이번 턴 아군 대미지 +${v})`);}break;
        case 'downworld':b.bind=30;log('act',`${p.name} · 다운월드 → ${m.name} 봉쇄 (이번 턴 몬스터 대미지 −30%)`);break;
        case 'backslider':addBuff(t,'backslider',T,T,{mul:2});log('act',`${p.name} · 타락자 → ${t.name} 이번 턴 대미지 ×2`);break;
      }
    }
  }
  // ⑤ 행운 순서로 행동
  const attack=(p,a)=>{
    const s=SKILLS[a.skill];
    if(a.addon){spend(p,a.addon);const ad=a.addon;
      if(ad==='roar'){const v=Math.round(p.atk*0.6),c=Math.round(p.maxHp*0.1);addBuff(p,'roar',T,T+1,{add:v});p.hp=Math.max(1,p.hp-c);log('act',`${p.name} · 전장의 포효! 2턴 대미지 +${v} (HP −${c})`);}
      if(ad==='berserker'){const c=Math.round(p.maxHp*0.1);addBuff(p,'berserk',T,T+1,{mul:2,cut:c});p.maxHp-=c;p.hp=Math.min(p.hp,p.maxHp);log('act',`${p.name} · 광전사! 2턴 대미지 ×2 (최대 HP −${c})`);}
      if(ad==='eternalflame'){addBuff(p,'eternal',T,T+2);log('act',`${p.name} · 이터널 플레임! 3턴 동안 지옥의 푸른 불`);}
      if(ad==='dystopia'){living(b).forEach(x=>x.hp=Math.max(1,x.hp-Math.round(x.maxHp*0.03)));log('act',`${p.name} · 디스토피아! 아군 최대 HP 3%씩 제물`);}
    }
    if(a.skill==='execution')addBuff(p,'execution',T,T+2);
    const f=judgeRoll(rng);let pure=Math.round(p.atk*f);const raw=pure;
    if(a.skill==='overburning')pure*=2;
    const parts=[`${raw} (판정 ${Math.round(f*100)}%)${a.skill==='overburning'?'×2':''}`];
    const pct=v=>Math.round(p.atk*v/100);
    let add=s.bonus?pct(s.bonus):0;if(s.bonus)parts.push(`+${add}`);
    if(comboReady(p,a.skill,T)){const c=pct(s.combo.bonus);add+=c;parts.push(`연계 +${c}`);}
    const critCh=critChance(p,s);let crit=rng()*100<critCh;
    if(buffOn(p,'execution',T)){const e=Math.round(p.atk*rng()*0.22);add+=e;parts.push(`처형 +${e}`);}
    for(const k of ['roar','takedown','smoke','blind','ember']){const bf=buffOn(p,k,T);if(bf){add+=bf.add;parts.push(`${{roar:'포효',takedown:'테이크다운',smoke:'연막',blind:'블라인드',ember:'화염 공명'}[k]} +${bf.add}`);}}
    let mul=1;
    for(const k of ['berserk','carnage','backslider']){const bf=buffOn(p,k,T);if(bf){mul*=bf.mul;parts.push(`${{berserk:'광전사',carnage:'대학살',backslider:'타락자'}[k]} ×${bf.mul}`);}}
    if(a.addon==='dystopia'){mul*=3;parts.push('디스토피아 ×3');}
    if(s.mult){mul*=s.mult;parts.push(`${s.name} ×${s.mult}`);}
    if(s.holy&&m.art==='spirit'){mul*=1.5;parts.push('신성 ×1.5');}
    if(buffOn(p,'eternal',T)){if(f<0.9){addBuff(p,'null',T,T+1);parts.push('푸른 불 폭주');}else{const em=f>=1.1?3:2;mul*=em;parts.push(`이터널 ×${em}`);}}
    if(crit){mul*=CRIT_MULT;parts.push(`크리티컬 ×${CRIT_MULT}`);}
    let dmg=Math.max(0,Math.round((pure+add)*mul*(1-(m.def||0)/((m.def||0)+100))));
    if(a.addon==='carnage'&&dmg>=p.atk*2){addBuff(p,'carnage',T,T+2,{mul:2});dmg*=2;parts.push('대학살 발동 ×2');}
    if(buffOn(p,'null',T)){dmg=0;parts.push('대미지 무효');}
    m.hp=Math.max(0,m.hp-dmg);p.dealt+=dmg;p.turnDealt+=dmg;
    log('hit',`${p.name} · ${s.name}${a.addon?' + '+SKILLS[a.addon].name:''} → ${dmg} 대미지 (${parts.join(' · ')})${crit?' · 크리티컬!':''}`);
    if(s.poison&&m.hp>0){const pd=Math.max(1,Math.round(p.atk*(s.poison.pct||12)/100));m.poison={dmg:pd,turns:s.poison.turns,by:p.id};log('act',`${m.name} · 중독 ${s.poison.turns}턴 (턴당 ${pd})`);}
    if(s.drain&&dmg>0){const al=living(b).filter(x=>x.hp<x.maxHp).sort((x,y)=>x.hp/x.maxHp-y.hp/y.maxHp);const tg=al[0]||p;heal(p,tg,Math.round(dmg*s.drain/100),`${s.name} 흡수`);}
    if(a.skill==='smoke'){const v=pct(15);b.players.forEach(x=>{if(x!==p)addBuff(x,'smoke',T+1,T+1,{add:v});});}
    if(a.skill==='legendary'&&f>=1.1){p.obTurn=T+1;log('act',`${p.name} · 판정 ${Math.round(f*100)}% · 다음 턴 오버 버닝 가능`);}
    if(crit)p.crits=(p.crits||0)+1;
    if(crit&&p.job==='dualist'&&CLASSES.dualist.skills.includes('fusillade')){p.doubleTurn=T+1;log('act',`${p.name} · 연사! 다음 턴 스킬 2회`);}
    p.last=a.skill;p.lastTurn=T;
  };
  for(const id of b.order){
    if(m.hp<=0)break;
    const p=P(id);if(p.dead)continue;
    for(const a of acts(p)){
      if(a.done||m.hp<=0||p.dead)continue;a.done=true;p.direct++;
      const err=checkAct(b,p,a,hooks.hasItem,a===p.action2?p.action:null);
      if(err){p.defending=true;log('sys',`${p.name} · ${err} → 방어로 전환`);continue;}
      if(a.kind==='item'){
        hooks.useItem&&hooks.useItem(p.id,a.item);
        if(a.item==='potion')heal(p,p,Math.max(50,Math.round(p.maxHp*0.2)),'회복약');
        else if(a.item==='holywater'){p.poison=null;log('heal',`${p.name} · 정화의 성수 → 상태 이상 제거`);}
        continue;
      }
      const s=SKILLS[a.skill];spend(p,a.skill);const t=a.target?P(a.target):null;
      if(s.type==='dice'){attack(p,a);continue;}
      switch(a.skill){
        case 'takedown':{const v=Math.round(p.atk*0.25);addBuff(p,'takedown',T+1,T+2,{add:v});log('act',`${p.name} · 테이크다운 (다음 턴부터 2턴 대미지 +${v})`);break;}
        case 'hellfire':{const v=Math.max(1,Math.round(p.atk*0.18));m.burn={dmg:v,turns:3,by:p.id};log('act',`${p.name} · 헬파이어 → ${m.name} 3턴 동안 ${v} 고정 대미지`);break;}
        case 'cure':{const v=healAmt(p,rng,0.10);heal(p,t,v,`큐어`);break;}
        case 'sinsayer':p.revives=(p.revives||0)+1;t.dead=false;t.hp=Math.round(t.maxHp*0.3);t.poison=null;p.bound=3;log('heal',`${p.name} · 신세이어 → ${t.name} 부활 (HP ${t.hp}) · ${p.name} 2턴 빛의 속박`);break;
        case 'bless':{const v=Math.max(1,Math.round(t.maxHp*0.05));t.hot={amt:v,turns:3};log('heal',`${p.name} · 블레스 → ${t.name} 3턴 동안 ${v}씩 회복`);break;}
        case 'fasciation':{const v=healAmt(p,rng,0.12);healables(b,p,living(b)).forEach(x=>heal(p,x,v,`결속자`));break;}
        case 'utopia':{const v=healAmt(p,rng,0.40);healables(b,p,living(b)).forEach(x=>heal(p,x,v,`유토피아`));break;}
        case 'pray':{const c=Math.round(p.maxHp*0.15);p.hp=Math.max(1,p.hp-c);heal(p,t,t.maxHp,`프레이 (HP ${c} 봉헌)`);break;}
      }
    }
  }
  const salaP=b.players.find(p=>p.job==='salamander'&&p.turnDealt>=p.atk*2.5);const salaHit=!!salaP;
  if(m.hp<=0){m.hp=0;b.over='win';log('win',`${m.name} 처치 · 승리`);return;}
  if(salaHit){const v=Math.round(salaP.atk*0.15);b.players.forEach(x=>addBuff(x,'ember',T+1,T+1,{add:v}));log('act',`샐래맨더의 화염 공명 · 다음 턴 파티 대미지 +${v}`);}
  // ⑥ 몬스터 행동
  const tel=b.tel;
  const hitP=(p,mult)=>{
    if(p.protect||b.sanct)return {d:0,note:'보호'};
    let d=m.atk*MON_HIT*judgeRoll(rng)*mult;if(b.dmgTakenMult)d*=b.dmgTakenMult;if(p.defending)d*=0.5;
    d*=1-p.def/(p.def+DEF_K);d*=(1-Math.min(90,p.reduce)/100)*(1-Math.min(90,b.shield)/100)*(1-Math.min(90,b.bind)/100)*(m.weaken>0?0.88:1);d=Math.max(0,Math.round(d));
    p.hp=Math.max(0,p.hp-d);if(p.hp===0)p.dead=true;return {d,note:''};
  };
  if(tel.type==='area'){
    const hit=living(b).filter(p=>tel.cells.includes(p.pos));
    const parts=hit.map(p=>{const r=hitP(p,tel.mult);return `${p.name} ${r.d}${r.note==='보호'?'(보호)':''}${p.dead?'(쓰러짐)':''}`;});
    log('mon',`${m.name} · ${tel.name} → ${parts.length?parts.join(', '):'모두 피했다'}`);
  }else if(tel.type==='aoe'){
    const parts=living(b).map(p=>{const r=hitP(p,tel.mult);return `${p.name} ${r.d}${r.note==='보호'?'(보호)':''}${p.dead?'(쓰러짐)':''}`;});
    log('mon',`${m.name} · ${tel.name} → ${parts.join(', ')}`);
  }else{
    let t=P(tel.target),note='';
    const fix=b.attention?P(b.attention):supActive(b)?P(b.sup.by):null;
    if(fix&&!fix.dead&&fix!==t){t=fix;note=b.attention?' (시야 강탈)':' (제압)';}
    if(!t||t.dead){const al=living(b);t=al[Math.floor(rng()*al.length)];note=' (대상 재지정)';}
    if(t){
      const r=hitP(t,tel.mult);let extra='';
      if(tel.type==='dot'&&!t.dead&&r.note!=='보호'){t.poison={turns:3,dmg:m.dotDmg,name:m.dotName};extra=` · ${m.dotName} 3턴`;}
      log('mon',`${m.name} · ${tel.name} → ${t.name}${note} ${r.d} 대미지${r.note==='보호'?' (보호됨)':''}${t.dead?' · 쓰러짐':''}${extra}`);
    }
  }
  // ⑦ 지속 효과와 만료
  for(const p of b.players){
    if(!p.dead&&p.poison){if(p.protect||b.sanct)log('sys',`${p.name} · 보호로 ${p.poison.name} 무효`);else{p.hp=Math.max(0,p.hp-p.poison.dmg);log('mon',`${p.name} · ${p.poison.name} ${p.poison.dmg}${p.hp===0?' (쓰러짐)':''}`);if(p.hp===0)p.dead=true;}p.poison.turns--;if(p.poison.turns<=0)p.poison=null;}
    if(!p.dead&&p.hot){heal({name:'블레스'},p,p.hot.amt,'지속 회복');p.hot.turns--;if(p.hot.turns<=0)p.hot=null;}
    if(p.bound>0)p.bound--;
    const bz=p.buffs.find(x=>x.k==='berserk'&&x.to===T);if(bz){p.maxHp+=bz.cut||30;}
    p.buffs=p.buffs.filter(x=>x.to>T);
  }
  for(const k of ['poison','burn']){const d=m[k];if(!d)continue;m.hp=Math.max(0,m.hp-d.dmg);const src=P(d.by);if(src)src.dealt+=d.dmg;log('hit',`${m.name} · ${k==='poison'?'중독':'화상'} ${d.dmg}`);d.turns--;if(d.turns<=0)m[k]=null;}
  if(m.weaken>0)m.weaken--;
  if(m.hp<=0){m.hp=0;b.over='win';log('win',`${m.name} 처치 · 승리`);return;}
  // 제압 해제 조건
  if(b.sup){
    const tank=P(b.sup.by);const dps=b.players.filter(p=>p.role==='dps').reduce((a,p)=>a+p.dealt,0);
    if(tank.dead){log('sys','제압한 탱커가 쓰러져 제압이 풀렸다');b.sup=null;}
    else if(dps>=b.sup.mult*Math.max(1,tank.dealt)){log('sys',`제압 해제 · 딜러 총 대미지 ${dps} ≥ ${tank.name} ${tank.dealt}×${b.sup.mult}`);b.sup=null;}
  }
  // ⑧ 승패
  if(living(b).length===0){b.over='lose';log('lose','파티 전멸 · 패배');return;}
  startTurn(b,rng);
}
function decideBot(b,p,rng){
  const m=b.mon,tel=b.tel,al=living(b),T=b.turn,sk=CLASSES[p.job].skills;
  if(p.bound>0)return {kind:'defend'};
  const has=k=>sk.includes(k)&&usesLeft(p,k)>0&&!(SKILLS[k].lv&&(p.level||1)<SKILLS[k].lv);
  const A=(skill,extra)=>({kind:'skill',skill,...(extra||{})});
  const targeted=tel.type==='aoe'||tel.target===p.id||(supActive(b)&&b.sup.by===p.id);
  const big=Math.round(m.atk*tel.mult*0.8)-p.def;
  const low=al.slice().sort((a,c)=>a.hp/a.maxHp-c.hp/c.maxHp)[0];
  const basic=basicSkill(p.job);
  if(p.role==='tank'){
    const lowAllies=al.filter(x=>x.hp/x.maxHp<0.45).length;
    if(has('sanctuary')&&tel.type==='aoe'&&lowAllies>=2)return A('sanctuary');
    if(!supActive(b)&&sk.includes('forestaller'))return A('forestaller');
    if(supActive(b)&&b.sup.by!==p.id&&sk.includes('attention'))return A('attention');
    if(tel.type!=='aoe'&&has('link2')){const t=b.players.find(x=>x.id===tel.target);if(t&&t!==p&&!supActive(b)&&t.hp<big*1.3)return A('link2',{target:t.id});}
    const svk=has('save2')?'save2':has('save')?'save':null;
    if(svk&&targeted&&p.hp<p.maxHp*0.45)return A(svk);
    if(p.hp<p.maxHp*0.25)return {kind:'defend'};
    const addon=has('roar')&&m.hp>m.maxHp*0.4&&p.hp>p.maxHp*0.6?'roar':has('berserker')&&m.hp>m.maxHp*0.3&&p.hp>p.maxHp*0.6?'berserker':null;
    if(has('crimehazard'))return A('crimehazard',addon?{addon}:{});
    if(sk.includes('execution'))return A('execution',addon?{addon}:{});
    return A('attack',addon?{addon}:{});
  }
  if(p.role==='heal'){
    const dead=b.players.find(x=>x.dead);
    if(dead&&sk.includes('sinsayer')&&al.length>1)return A('sinsayer',{target:dead.id});
    const hurt=al.filter(x=>x.hp/x.maxHp<0.6).length;
    if(has('utopia')&&hurt>=Math.max(2,Math.ceil(al.length/2)))return A('utopia');
    if(has('fasciation')&&hurt>=2)return A('fasciation');
    if(low&&low.hp/low.maxHp<0.3&&has('pray')&&p.hp>90&&low!==p)return A('pray',{target:low.id});
    if(tel.type==='aoe'&&has('vindicate'))return A('vindicate');
    if(low&&low.hp/low.maxHp<0.62)return A('cure',{target:low.id});
    if(has('downworld')&&targeted&&p.hp<big)return A('downworld');
    if(low&&low.hp/low.maxHp<0.85&&has('bless')&&!low.hot)return A('bless',{target:low.id});
    if(has('blind')&&T>=2)return A('blind');
    if(has('backslider')){const top=al.filter(x=>x.role==='dps').sort((a,c)=>c.atk-a.atk)[0];if(top)return A('backslider',{target:top.id});}
    if(targeted&&p.hp<big)return {kind:'defend'};
    if(has('dystopia')&&al.every(x=>x.hp>x.maxHp*0.5))return A('shining',{addon:'dystopia'});
    return A('shining');
  }
  // 딜러
  if(targeted&&p.hp<big*1.1)return {kind:'defend'};
  const j=p.job;
  if(has('takedown')&&T===1)return A('takedown');
  if(has('smoke')&&T===1)return A('smoke');
  if(j==='mystic'){if(p.last==='rush'&&p.lastTurn===T-1)return A('hitend');if(p.last==='jolt'&&p.lastTurn===T-1)return A('rush');if(has('subterfuge')&&!m.poison)return A('subterfuge');return A('jolt');}
  if(j==='destroyer'){if(p.last==='overkill'&&p.lastTurn===T-1)return A('might');if(p.last==='jolt'&&p.lastTurn===T-1)return A('overkill',has('carnage')&&p.atk>=60?{addon:'carnage'}:{});return A('jolt');}
  if(j==='salamander'){const ad=has('eternalflame')&&p.atk>=90?{addon:'eternalflame'}:{};if(p.last==='flame'&&p.lastTurn===T-1)return A('meteor',ad);if(!m.burn&&T>1&&rng()<0.4)return A('hellfire');return A('flame');}
  if(j==='dualist'){if(p.obTurn===T)return A('overburning');if(p.last==='shooting'&&p.lastTurn===T-1)return A('legendary');if(!m.poison&&rng()<0.3)return A('poisonshot');return A('shooting');}
  if(j==='mage'){if(tel.type==='aoe'&&!m.weaken&&rng()<0.4)return A('cinder');if(p.last==='flame'&&p.lastTurn===T-1)return A('blaze');return A('flame');}
  if(j==='shooter'){if(!m.poison)return A('poisonshot');return A('shooting');}
  return A(basic);
}
function decideBot2(b,p){const T=b.turn;if(p.obTurn===T&&p.action&&p.action.skill!=='overburning')return {kind:'skill',skill:'overburning'};
  if(p.action&&p.action.skill==='shooting')return {kind:'skill',skill:'legendary'};return {kind:'skill',skill:'shooting'};}
/* ── 그리드 전투 (만신전) · 10×10 칸 ── */
const GRID=10,CELL_CAP=2,BOSS_CELLS=[44,45,54,55],HEAL_R=2;
function healables(b,p,list){return b.grid?list.filter(x=>x.pos!=null&&cheb(p.pos,x.pos)<=HEAL_R):list;}
const MOVE_BONUS={infighter:1,mystic:1,destroyer:1};
function gxy(i){return [Math.floor(i/GRID),i%GRID];}
function cheb(a,c){const [ar,ac]=gxy(a),[br,bc]=gxy(c);return Math.max(Math.abs(ar-br),Math.abs(ac-bc));}
function bossDist(i){return Math.min(...BOSS_CELLS.map(c=>cheb(i,c)));}
function rangeR(p){return (parseInt(CLASSES[p.job].range||'3')-1)/2;}
function inRange(b,p){return p.pos!=null&&bossDist(p.pos)<=rangeR(p);}
function moveR(b,p){if(b.snow)return 1;return 1+(MOVE_BONUS[p.job]||0)+(p.mov||0)+(p.swift===b.turn?1:0);}
function cellCount(b,i,except){return b.players.filter(p=>!p.dead&&p.pos===i&&p!==except).length;}
function canMoveTo(b,p,i){return i>=0&&i<GRID*GRID&&!BOSS_CELLS.includes(i)&&i!==p.pos&&cheb(p.pos,i)<=moveR(b,p)&&cellCount(b,i,p)<CELL_CAP;}
function reachable(b,p){const out=[];for(let i=0;i<GRID*GRID;i++)if(canMoveTo(b,p,i))out.push(i);return out;}
function cellName(i){const [r,c]=gxy(i);return `${'ABCDEFGHIJ'[r]}${c+1}`;}
function gridArea(c,r){const out=[];const [cr,cc]=gxy(c);for(let y=cr-r;y<=cr+r;y++)for(let x=cc-r;x<=cc+r;x++)if(y>=0&&y<GRID&&x>=0&&x<GRID&&!BOSS_CELLS.includes(y*GRID+x))out.push(y*GRID+x);return out;}
const GRID_PAT={single:'단일 강타',burst:'파쇄 낙인',burst2:'이중 낙인',cross:'십자 균열',quake:'대지 진동',ring:'외곽 낙뢰',all:'전장 붕괴'};
function gridPhase(b){const pct=b.mon.hp/b.mon.maxHp*100;let k=0;b.phases.forEach((ph,i)=>{if(pct<=ph.at)k=i;});
  if(k!==b.phase){b.phase=k;const ph=b.phases[k];b.mon.atk=Math.round(b.baseAtk*(ph.atkMul||1));if(b.turn>1)b.log.push({t:'warn',text:`◆ ${ph.name} · 보스 공격력 ${b.mon.atk}`});}}
function gridTel(b,rng){
  const m=b.mon,ph=b.phases[b.phase]||b.phases[0],al=living(b);
  const pats=(ph.patterns&&ph.patterns.length?ph.patterns:['single']);const pat=pats[Math.floor(rng()*pats.length)];
  const rp=()=>al[Math.floor(rng()*al.length)];
  const PC=(b.pats&&b.pats[pat])||null;const N=(PC&&PC.name)||GRID_PAT[pat]||pat;const MU=(d)=>PC&&PC.mult!=null?PC.mult:d;
  if(pat==='all')return {type:'aoe',name:N,mult:MU(0.5),pat};
  if(pat==='burst'){const t=rp();return {type:'area',name:N,mult:MU(0.9),cells:gridArea(t.pos,1),pat};}
  if(pat==='burst2'){const t1=rp(),t2=rp();return {type:'area',name:N,mult:MU(0.9),cells:[...new Set([...gridArea(t1.pos,1),...gridArea(t2.pos,1)])],pat};}
  if(pat==='cross'){const t=rp();const [r,c]=gxy(t.pos);const cells=[];for(let i=0;i<GRID*GRID;i++){const [y,x]=gxy(i);if((y===r||x===c)&&!BOSS_CELLS.includes(i))cells.push(i);}return {type:'area',name:N,mult:MU(0.8),cells,pat};}
  if(pat==='quake'){const cells=[];for(let i=0;i<GRID*GRID;i++)if(!BOSS_CELLS.includes(i)&&bossDist(i)<=1)cells.push(i);return {type:'area',name:N,mult:MU(1.0),cells,pat};}
  if(pat==='ring'){const cells=[];for(let i=0;i<GRID*GRID;i++)if(bossDist(i)>=3)cells.push(i);return {type:'area',name:N,mult:MU(0.7),cells,pat};}
  const target=threatOrder(b)[0]||al[0];
  const dot=rng()<m.dotChance;
  return {type:dot?'dot':'single',name:dot?m.dotName:N,mult:MU(1.1),target:target.id,pat:'single'};
}
function gridPlace(b,rng){
  const want=p=>p.role==='tank'?1:p.role==='heal'?3:rangeR(p)>=2?2:1;
  b.players.forEach(p=>{const d=want(p);const opts=[];for(let i=0;i<GRID*GRID;i++)if(!BOSS_CELLS.includes(i)&&bossDist(i)===d&&cellCount(b,i)<CELL_CAP)opts.push(i);
    const pool=opts.length?opts:[...Array(GRID*GRID).keys()].filter(i=>!BOSS_CELLS.includes(i)&&cellCount(b,i)<CELL_CAP);p.pos=pool[Math.floor(rng()*pool.length)];});
}
function gridPre(b,rng,hooks){
  const log=(t,text)=>b.log.push({t,text}),P=id=>b.players.find(p=>p.id===id);
  for(const id of b.order){const p=P(id);if(p.dead||!p.itemAct)continue;const it=p.itemAct;p.itemAct=null;
    if(!hooks.hasItem||!hooks.hasItem(p.id,it.item)){log('sys',`${p.name} · 아이템이 없어 사용하지 못함`);continue;}
    hooks.useItem&&hooks.useItem(p.id,it.item);p.direct++;
    if(it.item==='potion'){const t=p;if(!t.dead){const h=Math.min(50,t.maxHp-t.hp);t.hp+=h;log('heal',`${p.name} · 회복약 → ${t.name} ${h} 회복`);}}
    else if(it.item==='holywater'){p.poison=null;log('heal',`${p.name} · 정화의 성수 → 상태 이상 제거`);}
    else if(it.item==='swiftdraft'){p.swift=b.turn;log('act',`${p.name} · 신속의 물약 (이번 턴 이동 범위 +1)`);}}
  for(const id of b.order){const p=P(id);if(p.dead||!p.confirmed||!p.action)continue;const a=p.action;
    if(a.kind==='move'){a.done=true;p.direct++;const from=p.pos;
      if(b.snow&&rng()<0.25){log('sys',`${p.name} · 눈보라에 발이 묶여 이동하지 못함`);}
      else if(canMoveTo(b,p,a.to)){p.pos=a.to;log('move',`${p.name} · 이동 ${cellName(from)} → ${cellName(a.to)}`);}
      else log('sys',`${p.name} · ${cellName(a.to)} 칸으로 이동하지 못해 제자리 (${cellCount(b,a.to,p)>=CELL_CAP?'칸 정원 초과':'이동 범위 밖'})`);}
    else if(a.kind==='wait'){a.done=true;p.direct++;log('act',`${p.name} · 대기`);}}
}
function decideGridBot(b,p,rng){
  const tel=b.tel,danger=c=>tel&&tel.type==='area'&&tel.cells.includes(c);
  const R=reachable(b,p);
  if(danger(p.pos)){const safe=R.filter(i=>!danger(i)).sort((x,y)=>((bossDist(x)<=rangeR(p)?0:10)+cheb(p.pos,x))-((bossDist(y)<=rangeR(p)?0:10)+cheb(p.pos,y)));if(safe.length)return {kind:'move',to:safe[0]};}
  const a=decideBot(b,p,rng);
  if(a.kind==='skill'&&SKILLS[a.skill]&&SKILLS[a.skill].type==='heal'&&a.target){const t=b.players.find(x=>x.id===a.target);if(t&&t.pos!=null&&cheb(p.pos,t.pos)>HEAL_R){const best=R.filter(i=>!danger(i)).sort((x,y)=>cheb(x,t.pos)-cheb(y,t.pos))[0];if(best!=null&&cheb(best,t.pos)<cheb(p.pos,t.pos))return {kind:'move',to:best};return {kind:'defend'};}}
  if(a.kind==='skill'&&SKILLS[a.skill]&&SKILLS[a.skill].target==='enemy'&&!inRange(b,p)){
    const best=R.filter(i=>!danger(i)).sort((x,y)=>bossDist(x)-bossDist(y))[0];
    if(best!=null&&bossDist(best)<bossDist(p.pos))return {kind:'move',to:best};
    return {kind:'wait'};}
  return a;
}
/*ENGINE-END*/

