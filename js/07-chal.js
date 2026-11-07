'use strict';
/* ══ 보스 도전 모드 (5-1) ══════════════════════════════════════════
   서고에서 이미 깬 스토리 보스(장 마지막 보스 + 8장 토벌 보스(아우로라는 원래 이길 수 없는 전투라 뺌))를 조건을 걸고 다시 싸움.
   - 모든 도전: 제한 턴(`CHAL_BOSS[보스].turns`, 넘기면 패배).
   - 혼자 싸우는 보스: 회복약(회복 아이템) 사용 금지.
   - 4인 이상 토벌(케팔로포다·야누스·숨무스): 아무도 쓰러지지 않기. 어겨도 전투는 계속(파티원 퀘스트 진행은 원래대로), 도전 기록만 실패.
   - 보상: 처음 성공할 때만 한 번(`firstReward`) + 성공 수 칭호(도전자 1 · 시련을 즐기는 자 5 · 완벽주의자 전부).
   - 기록 `S.me.chal[보스]={best,at,n}`. 퀘스트 진행·주간 토벌 규칙은 건드리지 않음.
   - 수치는 임시(봇 시뮬 75% 지점 턴 수 기준) — 바꾸려면 CHAL_BOSS 숫자만. */
const CHAL_BOSS={
  st_witch:{q:'E4',turns:7},st_monk:{q:'E7',turns:9},st_serpent:{q:'E11',turns:9},st_saltlord:{q:'E15',turns:10},
  st_siren:{q:'E19',turns:11},st_rootguard:{q:'E23',turns:12},st_prisoner:{q:'E27',turns:11},
  t_cephalo:{q:'E28',turns:20,grid:1},t_janus:{q:'E29',turns:20,grid:1},q_summus:{q:'E31',turns:25,grid:1}
};
const CHAL_BY_Q=Object.fromEntries(Object.entries(CHAL_BOSS).map(([k,v])=>[v.q,k]));
function chalRec(id){return ((S.me&&S.me.chal)||{})[id];}
function chalDone(){return Object.keys(CHAL_BOSS).filter(k=>chalRec(k)).length;}
function chalNoHeal(k){const it=ITEMS[k];return !!it&&(k==='potion'||/회복/.test(it.desc||'')&&!/해제/.test(it.name||''));}
function firstReward(id){const m=monster(id);const L=(m&&m.level)||S.me.level;return {exp:Math.round(fieldExp(L)*3),gold:Math.round(fieldGold(L)*25),items:{}};}
function chalRules(id){const c=CHAL_BOSS[id];return [`제한 ${c.turns}턴`,c.grid?'아무도 쓰러지지 않기':'회복약 사용 금지'];}
/* 칭호 */
TITLES.push(
  T('t_chal1','combat','도전자','보스 도전 첫 성공',null,1,{get:()=>chalDone()}),
  T('t_chal5','combat','시련을 즐기는 자','보스 도전 5곳 성공',null,5,{get:()=>chalDone()}),
  T('t_chalall','legend','완벽주의자','보스 도전 모두 성공',null,Object.keys(CHAL_BOSS).length,{get:()=>chalDone()}));
/* 서고 상세에 도전 칸 */
(function(){const f=questDetail;questDetail=function(q){let h=f(q);const id=q&&CHAL_BY_Q[q.id];const qp=q&&S.qp[q.id];
  if(!id||!qp||qp.status!=='done')return h;const m=monster(id);if(!m)return h;const c=CHAL_BOSS[id],R=chalRec(id),fr=firstReward(id);
  const box=`<div class="chal"><div class="chal-h"><b>보스 도전</b><span class="faint">${esc(m.name)}</span></div>
    <div class="chal-r">${chalRules(id).map(t=>`<span class="chip">${esc(t)}</span>`).join('')}</div>
    <p class="chal-s">${R?`최고 기록 <b class="num">${R.best}턴</b> · 성공 ${R.n}회`:`첫 성공 보상 · ${esc(gotText(fr))}`}${c.grid?' · 파티를 만들어 출발하면 이 조건이 걸립니다(파티장 화면 기준).':''}</p>
    <div class="act-br"><button class="btn btn-sm btn-primary" data-act="chal-go" data-id="${id}">다시 도전</button></div></div>`;
  const i=h.lastIndexOf('</div>');return i<0?h+box:h.slice(0,i)+box+h.slice(i);};})();
/* 도전 시작 */
function chalAttach(b,id){const c=CHAL_BOSS[id];b.chal={id,turns:c.turns,grid:!!c.grid,fell:false};
  b.log.push({t:'warn',text:`보스 도전 · ${chalRules(id).join(' · ')}`});}
Object.assign(ACTS,{
  'chal-go':d=>{const id=d.id,c=CHAL_BOSS[id];const m=monster(id);if(!c||!m)return;const qp=S.qp[c.q];if(!qp||qp.status!=='done'){toast('이야기를 마친 보스만 도전할 수 있습니다.','warn');return;}
    const why=busyReason();if(why){toast(why,'warn');return;}
    if(c.grid){S.sel.chal={id,at:now()};save();go('battle',{monster:id});toast('파티를 만들어 출발하면 보스 도전으로 싸웁니다.','good');return;}
    startSolo(m,{type:'chal',qid:c.q,boss:id});const b=S.battle;if(!b)return;b.rules.exp=0;b.rules.gold=0;b.rules.drops=[];chalAttach(b,id);
    const q=quest(c.q);const st=q&&Object.values(q.steps).find(s=>s.battle===id);if(st&&st.noCharmFlag&&S.flags[st.noCharmFlag])b.noCharm=true;
    if(typeof storyBattleFx==='function')storyBattleFx(b);save();renderFight();}
});
/* 파티(그리드) 토벌: 서고에서 누르고 30분 안에 그 보스로 출발하면 도전 */
(function(){const f=startBattle;startBattle=function(...a){f(...a);const b=S.battle,C=S.sel.chal;
  if(b&&C&&b.monsterId===C.id&&now()-C.at<1800e3&&!b.chal){chalAttach(b,C.id);S.sel.chal=null;save();}};})();
/* 숨무스는 퀘스트를 마친 뒤엔 파티를 만들 수 없으므로 도전 중에만 허용 */
function chalSummus(m){const C=S.sel.chal;return m&&m.id==='q_summus'&&C&&C.id==='q_summus'&&now()-C.at<1800e3&&S.qp.E31&&S.qp.E31.status==='done';}
(function(){const f=vMonster;vMonster=function(m){if(!chalSummus(m))return f(m);const o=r4Pending;r4Pending=()=>true;try{return f(m);}finally{r4Pending=o;}};})();
(function(){const f=ACTS.createparty;ACTS.createparty=function(d,...a){if(!chalSummus(monster(d.id)))return f(d,...a);const o=r4Pending;r4Pending=()=>true;try{return f(d,...a);}finally{r4Pending=o;}};})();
/* 회복약 금지(혼자 도전) */
(function(){const f=hooks.hasItem;hooks.hasItem=(pid,k)=>{const b=S.battle;if(b&&b.chal&&!b.chal.grid&&pid==='me'&&chalNoHeal(k))return false;return f(pid,k);};})();
/* 턴마다: 쓰러짐 기록 · 제한 턴 */
(function(){const f=doResolve;doResolve=function(...a){f(...a);const b=S.battle;if(!b||!b.chal)return;
  if(b.players.some(p=>p.dead))b.chal.fell=true;
  /* 토벌(파티): 조건을 어겨도 전투는 그대로 — 같이 싸우는 블레서의 퀘스트 진행·보상은 원래대로, 도전 기록만 실패 */
  if(b.chal.grid){const why=b.chal.fell?'누군가 쓰러졌습니다':b.turn>b.chal.turns?`제한 ${b.chal.turns}턴을 넘겼습니다`:'';
    if(why&&!b.chal.failed){b.chal.failed=1;b.log.push({t:'bad',text:`보스 도전 실패 · ${why} (전투는 계속됩니다)`});save();renderFight();}return;}
  if(!b.over&&b.turn>b.chal.turns){b.over='lose';b.log.push({t:'bad',text:`보스 도전 실패 · 제한 ${b.chal.turns}턴을 넘겼습니다.`});finishBattle(b);save();renderFight();}};})();
/* 끝날 때: 기록·첫 성공 보상 */
(function(){const f=finishBattle;finishBattle=function(b){const done=S.claimedB[b.id];f(b);if(done||!b.chal)return;const C=b.chal;
  if(b.players.some(p=>p.dead))C.fell=true;const turns=Math.max(1,b.turn-(b.over==='win'?0:1));
  const ok=b.over==='win'&&turns<=C.turns&&!(C.grid&&C.fell);C.ok=ok;C.used=turns;
  if(ok){S.me.chal=S.me.chal||{};const R=S.me.chal[C.id];
    if(!R){const fr=firstReward(C.id);C.first=gotText(fr);if(b.result){b.result.exp=fr.exp;b.result.gold=fr.gold;}grant(fr,'battle',{battleId:b.id+':chal',label:`보스 도전 · ${b.mon.name}`});S.me.chal[C.id]={best:turns,at:now(),n:1};}
    else{R.best=Math.min(R.best,turns);R.n=(R.n||0)+1;R.at=now();}
    rec('quest',`보스 도전 성공 · ${b.mon.name}`,`${turns}턴`);checkTitles();}
  save();};})();
(function(){const f=outcomeHTML;outcomeHTML=function(b){let h=f(b);const C=b&&b.chal;if(!C)return h;
  const t=C.ok?`<p class="ok-t chal-o">보스 도전 성공 · ${C.used}턴${C.first?` · 첫 성공 보상 ${esc(C.first)}`:''}</p>`:`<p class="reason chal-o">보스 도전 실패${C.grid&&C.fell?' · 누군가 쓰러졌습니다':b.over==='win'?` · ${C.used}턴(제한 ${C.turns}턴)`:''}</p>`;
  return h.replace(/(<\/h2>)/,'$1'+t).replace('레이드로 돌아가기','서고로 돌아가기');};})();
(function(){const f=leaveBattle;leaveBattle=function(){const b=S.battle;const C=b&&b.over&&b.chal&&CHAL_BOSS[b.chal.id];f();if(C)go('quest',{quest:C.q,qtab:'archive'});};})();
