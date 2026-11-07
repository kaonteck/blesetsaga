'use strict';
/* ══ 날씨가 전투·낚시에 주는 영향 (5-2) ═════════════════════════════
   그날 그 땅의 날씨(todayWeather)에 따라 좋고 나쁜 효과가 섞여 있음, 모두 ±10% 안.
   - 전투: 필드 사냥·퀘스트·던전·파티 레이드·보스 도전. 만신전·토벌전(그리드)은 빼고.
     어느 땅의 날씨인지는 몬스터 레벨이 속한 땅(LAND_BAND) 기준.
   - 낚시: 그 물가 땅의 날씨로 물고기가 걸릴 확률(기본 30%)을 배율로.
   - 땅마다 나올 수 있는 날씨는 지역 특성에 맞춤(05 REGIONS — 작열은 비·뇌우·안개 없음, 혹한은 비 없음).
   - 수치는 임시 — WFX 표만 바꾸면 됨. */
const WFX={
  /* 맑음(clear)은 효과 없음 */
  cloud:{bt:{mhp:0.95},fish:1.05},
  rain:{bt:{matk:1.05},fish:1.1},
  snow:{bt:{php:0.95},fish:1.05},
  blizzard:{bt:{patk:0.9,mhp:0.95},fish:0.9},
  fog:{bt:{matk:0.95,pdef:0.95},fish:1.05},
  wind:{bt:{pdef:0.95,patk:1.05},fish:0.95},
  heat:{bt:{php:0.9,mhp:0.95},fish:1},
  storm:{bt:{matk:1.1,patk:1.05},fish:0.9},
  dark:{bt:{matk:1.05,mhp:1.05},fish:1}
};
const WFX_N={patk:'블레서 공격력',pdef:'블레서 방어력',php:'블레서 최대 HP',matk:'몬스터 공격력',mhp:'몬스터 체력'};
const wfxPct=v=>`${v>1?'+':'−'}${Math.round(Math.abs(v-1)*100)}%`;
function wfxBattleText(E){return Object.entries((E&&E.bt)||{}).map(([k,v])=>`${WFX_N[k]} ${wfxPct(v)}`).join(' · ');}
function wfxText(E){if(!E)return '';const a=wfxBattleText(E);const f=E.fish&&E.fish!==1?`낚시 ${wfxPct(E.fish)}`:'';return [a,f].filter(Boolean).join(' · ');}
const WFX_TYPES=['field','quest','dungeon','party','chal','drun'];
function wfxLandOf(lv){for(const k in LAND_BAND){const [a,b]=LAND_BAND[k];if(lv>=a&&lv<=b)return k;}return 'meadow';}
function wfxApply(b){if(!b||b.wfx||b.grid)return;const t=(b.ctx||{}).type;if(!WFX_TYPES.includes(t))return;
  const land=wfxLandOf(b.mon.level||1),w=landW(land),E=WFX[w];b.wfx={land,w};if(!E)return;const e=E.bt||{};
  b.players.forEach(p=>{if(e.patk){p.atk=Math.round(p.atk*e.patk);if(p.patk)p.patk=Math.round(p.patk*e.patk);if(p.mag)p.mag=Math.round(p.mag*e.patk);}
    if(e.pdef)p.def=Math.round(p.def*e.pdef);if(e.php){const r=p.hp/p.maxHp;p.maxHp=Math.max(1,Math.round(p.maxHp*e.php));p.hp=Math.max(1,Math.min(p.maxHp,Math.round(p.maxHp*r)));}});
  const m=b.mon;if(e.matk){m.atk=Math.round(m.atk*e.matk);if(m.baseAtk)m.baseAtk=Math.round(m.baseAtk*e.matk);if(m.dotDmg)m.dotDmg=Math.round(m.dotDmg*e.matk);}
  if(e.mhp){m.maxHp=Math.round(m.maxHp*e.mhp);m.hp=Math.min(m.hp,m.maxHp);}
  const tx=wfxBattleText(E);if(tx)b.log.push({t:'sys',text:`날씨 · ${LANDS[land]} ${WNAME[w]||w} · ${tx}`});}
(function(){const f=startSolo;startSolo=function(...a){f(...a);try{wfxApply(S.battle);}catch(e){}};})();
(function(){const f=startBattle;startBattle=function(...a){f(...a);try{wfxApply(S.battle);}catch(e){}};})();
/* 낚시: 첫 난수를 배율에 맞게 옮김(쓰레기·빈손 비율은 그대로 나눔) */
(function(){const f=castRoll;castRoll=function(land,tier){const E=WFX[landW(land)];const mul=E&&E.fish||1;if(mul===1)return f(land,tier);
  const R=Math.random;let first=true;const P=0.3*mul;
  Math.random=()=>{if(!first)return R();first=false;const r=R();return r<P?r/mul:0.3+(r-P)*(0.7/(1-P));};
  try{return f(land,tier);}finally{Math.random=R;}};})();
/* 화면: 지역 디버프 줄·날씨 도움말 */
(function(){const f=wDebuffs;wDebuffs=function(land){const L=f(land);const w=landW(land),E=WFX[w];const tx=wfxText(E);if(tx)L.push(['wfx',`${WNAME[w]||w}`,tx]);return L;};})();
(function(){const f=skyBar;skyBar=function(...a){const h=f(...a);return h.replace('연금술(소금의 땅)</span>','연금술(소금의 땅)</span><span><i class="t-wfx">전투 · 낚시</i> 그 땅의 날씨에 따라 블레서·몬스터 능력치나 낚시 확률이 ±10% 안에서 바뀝니다(맑은 날은 효과 없음 · 만신전·토벌전 제외). 지역 페이지에서 오늘 효과를 볼 수 있습니다.</span>');};})();
