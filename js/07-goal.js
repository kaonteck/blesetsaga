'use strict';
/* ══ 서버 공동 목표 — 게임 쪽 연결 (5-3, 백엔드 031·032) ══════════════════
   백엔드 08-server의 goalAdd·GOAL·onGoal을 씀. 08이 없거나 로컬(파일) 모드면 아무 일도 안 함.
   센 것: 필드·던전 처치 kill:<몬스터>(자동 사냥은 마릿수만큼) · 탐색 explore · 낚시 성공 fish
         · 던전 공략 dungeon · 파티 레이드·토벌전 승리 raid. 화면: 주간 미션 위 「이번 주 공동 목표」. */
function gAdd(kind,n){try{if(typeof goalAdd==='function')goalAdd(kind,n||1);}catch(e){}}
function goalNow(){return (typeof GOAL!=='undefined'&&GOAL)?GOAL:null;}
/* 처치·승리 */
(function(){const f=finishBattle;finishBattle=function(b){const done=S.claimedB[b&&b.id];const r=f(b);
  if(!done&&b&&b.over==='win'){const t=(b.ctx||{}).type;
    if(t==='field'||t==='dungeon'||t==='drun'||(b.ctx&&b.ctx.drun))gAdd('kill:'+b.monsterId,1);
    if(t==='party'||t==='weekly')gAdd('raid',1);}
  return r;};})();
/* 자동 사냥 받기: 마릿수만큼(autoClaim과 같은 순서로 몬스터를 셈) */
(function(){const f=autoClaim;autoClaim=function(stop){const a=S.auto;const t=now();
  if(a&&(stop||t>=a.end)){const k=autoKills(a,t);const ids=(a.mons||[]).filter(id=>monster(id));const c={};for(let i=0;i<k&&ids.length;i++){const id=ids[i%ids.length];c[id]=(c[id]||0)+1;}
    for(const id in c)gAdd('kill:'+id,c[id]);}
  return f(stop);};})();
/* 탐색(선택 이벤트 포함)·던전 공략 */
(function(){const f=bump;bump=function(k,n){f(k,n);if(k==='explores')gAdd('explore',n||1);else if(k==='dunClear')gAdd('dungeon',n||1);};})();
/* 낚시 성공(직접·자동 모두 castRoll을 거침) */
(function(){const f=castRoll;castRoll=function(...a){const R=f(...a);if(R&&R.kind==='fish')gAdd('fish',1);return R;};})();
/* 화면: 주간 미션 위 작은 칸 */
function goalBox(){const g=goalNow();if(!g)return '<div data-goal hidden></div>';
  const p=Math.min(100,Math.round((g.total||0)/Math.max(1,g.target)*100));
  const left=g.ends?Math.max(0,Math.ceil((new Date(g.ends).getTime()-now())/864e5)):null;
  const rw=[g.gold?`${(+g.gold).toLocaleString('ko-KR')}골드`:'',...Object.entries(g.items||{}).map(([k,v])=>`${ITEMS[k]?ITEMS[k].name:k} ×${v}`)].filter(Boolean).join(' · ');
  return `<div class="gq ${g.done?'done':''}" data-goal><div class="gq-h"><b>${hTitle('star','이번 주 공동 목표')}</b>${left!=null?`<span class="faint">${left}일 남음</span>`:''}</div>
    <div class="gq-n">${esc(g.name||'')}</div>${g.descr?`<p class="gq-d">${esc(g.descr)}</p>`:''}
    <div class="bar gq-bar"><i style="width:${p}%"></i></div>
    <div class="gq-s"><span class="num">${(+g.total||0).toLocaleString('ko-KR')} / ${(+g.target).toLocaleString('ko-KR')}</span><span class="faint">내 기여 <b class="num">${(+g.mine||0).toLocaleString('ko-KR')}</b>${g.pending?` · 반영 대기 ${(+g.pending).toLocaleString('ko-KR')}`:''}</span></div>
    <p class="gq-r faint">${g.done?'달성! 기여한 블레서에게 우편으로 보상이 갑니다.':`달성하면 기여한 블레서에게 · ${esc(rw||'보상')}`}</p>${g.prev&&g.prev.name?`<p class="gq-r faint">지난 주 「${esc(g.prev.name)}」 ${g.prev.done?'달성':'미달성'}${g.prev.mine?` · 내 기여 ${(+g.prev.mine).toLocaleString('ko-KR')}`:''}</p>`:''}</div>`;}
(function(){const f=weeklyPanel;weeklyPanel=function(...a){return goalBox()+f(...a);};})();
function onGoal(){document.querySelectorAll('[data-goal]').forEach(el=>{el.outerHTML=goalBox();});}
