'use strict';
/* 운영 페이지 · 게임 기본값 읽기
   게임 코드(js/00~07)를 숨은 프레임에서 그대로 돌려, 새 캐릭터가 처음 받는 콘텐츠를 읽어 온다.
   → 기본값을 따로 복사해 두지 않으므로 메인 세션이 게임 코드를 고치면 여기에도 바로 반영된다.
   프레임에서는 서버 연결(08-server.js)을 불러오지 않고, 저장 키도 따로 써서 진짜 세이브를 건드리지 않는다. */
const GAME_JS=['00-assets','01-engine','02-content','03-world','04-ui','05-features','06-actions','07-boot'];

// 콘텐츠 종류: 이름 · 목록에 보일 제목 · 짧은 설명
const KINDS={
  monster:{label:'몬스터',title:d=>d.name,sub:d=>[KIND_MON[d.kind]||d.kind,d.level!=null&&'LV'+d.level,d.region].filter(Boolean).join(' · ')},
  quest:{label:'퀘스트',title:d=>d.title,sub:d=>[{epic:'메인',sub:'서브',repeat:'데일리'}[d.cat]||d.cat,d.level!=null&&'LV'+d.level].filter(Boolean).join(' · ')},
  item:{label:'아이템',title:d=>d.name,sub:d=>[{equip:'장비',use:'소모품',mat:'재료',deco:'장식품'}[d.type]||d.type,d.levelReq&&'LV'+d.levelReq,d.price&&d.price+'G'].filter(Boolean).join(' · ')},
  market:{label:'상점 상품',title:(d,ctx)=>((ctx&&ctx.items[d.item])||{}).name||d.item,sub:d=>`구매 ${d.price??'—'}G · 판매 ${d.sell??'—'}G${d.stock!=null?' · 재고 '+d.stock:''}`},
  notice:{label:'공지',title:d=>d.title,sub:d=>d.date||''},
  event:{label:'전광판',title:d=>d.title,sub:d=>[{boss:'보스 출현',event:'이벤트',maint:'점검'}[d.kind]||d.kind,d.loc].filter(Boolean).join(' · ')},
  setting:{label:'설정',title:(d,ctx,id)=>({config:'성장 · 전투 규칙',mass:'만신전 공통 규칙',banner:'메인 배너'}[id]||id),sub:(d,ctx,id)=>id},
};
const KIND_MON={party:'파티 레이드',weekly:'토벌전',event:'만신전',field:'필드',dungeon:'던전',story:'퀘스트 전투'};
// 새로 만들 때 채워 줄 뼈대
const BLANK={
  monster:{kind:'field',name:'새 몬스터',region:'',level:1,min:1,max:1,target:1,roles:{tank:0,dps:0,heal:0},hp:100,hpScale:0,atk:10,def:0,singleName:'공격',singleMult:1,aoeName:'',aoeMult:0,aoeEvery:0,dotName:'',dotChance:0,dotDmg:0,exp:10,gold:10,published:true},
  quest:{cat:'sub',title:'새 퀘스트',published:true,level:1,prereq:null,repeat:null,desc:'',start:'s0',steps:{s0:{text:'첫 장면',choices:[{label:'다음',next:'end'}]},end:{text:'완료',end:true,reward:{exp:10,gold:10}}}},
  item:{name:'새 아이템',type:'use',desc:'',price:10},
  market:{item:'potion',price:30,sell:12,stock:null},
  notice:{title:'새 공지',text:'',date:''},
  event:{kind:'event',title:'새 이벤트',loc:'',reward:'',link:''},
  setting:{},
};

let DEF=null;          // {monster:{id:data},...}
let DEF_FRAME=null;    // 검사 함수를 빌려 쓸 프레임 window
function loadDefaults(){
  if(DEF)return Promise.resolve(DEF);
  return new Promise(resolve=>{
    const base=new URL('./',location.href).href;
    const f=document.createElement('iframe');f.setAttribute('aria-hidden','true');f.tabIndex=-1;
    f.style.cssText='position:absolute;width:1px;height:1px;left:-9999px;top:0;border:0;visibility:hidden';
    f.srcdoc=`<!doctype html><html><head><meta charset="utf-8"><base href="${base}"></head><body>
      <header id="top"></header><main id="view"></main><div id="pop"></div><div id="rmenu"></div><div id="modal"></div><div id="toasts"></div>
      <script>var SB_UID=null,SB=null,SB_ADMIN=false;function cloudSave(){}<\/script>
      ${GAME_JS.map(n=>`<script src="js/${n}.js"><\/script>`).join('')}</body></html>`;
    let done=false;const fin=v=>{if(done)return;done=true;DEF=v;resolve(v);};
    const timer=setTimeout(()=>{console.warn('게임 기본값을 15초 안에 읽지 못했습니다');fin(emptyDefs('시간 초과'));},15000);
    f.onload=()=>{
      try{
        const w=f.contentWindow;DEF_FRAME=w;
        const out=w.eval(`(()=>{
          SAVE='bleset-admin-defaults';
          boot({state:freshState()});
          [ensureRelevel,ensureVilQuest,ensureDunParty].forEach(fn=>{try{fn()}catch(e){}});
          market();
          try{localStorage.removeItem('bleset-admin-defaults')}catch(e){}
          const d=S.data, by=(arr,key)=>Object.fromEntries((arr||[]).map(x=>[x[key||'id'],x]));
          return JSON.stringify({
            monster:by(d.monsters), quest:by(d.quests), item:ITEMS, market:by(d.market), notice:by(d.notices),
            setting:{config:d.config, mass:d.mass, banner:d.banner}, event:{}
          });
        })()`);
        // 프레임 안 게임 타이머(1초 tick 등)를 모두 멈춘다. 검사 함수는 그대로 쓸 수 있다.
        try{w.eval('(()=>{const last=setTimeout(()=>{},0);for(let i=0;i<=last;i++){clearTimeout(i);clearInterval(i);}document.body.innerHTML="";})()');}catch(e){}
        clearTimeout(timer);const v=JSON.parse(out);
        // 숨은 데이터 정리: 게임이 붙이는 rev(변경 횟수)는 서버가 따로 센다
        Object.values(v.monster).forEach(m=>{delete m.rev;});
        fin(v);
      }catch(e){console.error(e);clearTimeout(timer);fin(emptyDefs(e.message));}
    };
    document.body.appendChild(f);
  });
}
function emptyDefs(why){const v={};Object.keys(KINDS).forEach(k=>v[k]={});v._error=why;return v;}

// 게임의 검사 함수로 확인 (없으면 빈 배열)
function checkData(kind,id,data,allOfKind){
  const errs=[];
  if(data==null||typeof data!=='object'||Array.isArray(data))return ['내용은 { } 로 감싼 객체여야 합니다.'];
  const w=DEF_FRAME;
  try{
    if(kind==='quest'&&w&&w.eval('typeof validateQuest')==='function'){
      const q={...clone(data),id};const all=Object.entries(allOfKind).map(([i,d])=>({...clone(d),id:i}));
      if(!all.some(x=>x.id===id))all.push(q);
      errs.push(...(w.eval('validateQuest')(q,all)||[]));
    }
    if(kind==='monster'&&w&&w.eval('typeof validateMonster')==='function'){
      errs.push(...(w.eval('validateMonster')({...clone(data),id})||[]));
    }
  }catch(e){errs.push('검사 중 오류: '+e.message);}
  const need={monster:['name','kind'],quest:['title','steps','start'],item:['name','type'],market:['item','price'],notice:['title'],event:['title']}[kind]||[];
  need.forEach(k=>{if(data[k]==null||data[k]==='')errs.push(`'${k}' 칸이 필요합니다.`);});
  if(kind==='market'&&data.item&&DEF&&!DEF.item[data.item]&&!(A.content.item||{})[data.item])errs.push(`'${data.item}' 아이템이 없습니다.`);
  return [...new Set(errs.map(String))];
}

// 두 객체의 최상위 차이 (기록·비교 화면용)
function topDiff(a,b){a=a||{};b=b||{};const keys=[...new Set([...Object.keys(a),...Object.keys(b)])];
  return keys.filter(k=>JSON.stringify(a[k])!==JSON.stringify(b[k])).map(k=>({k,before:a[k],after:b[k]}));}
const shortVal=v=>{if(v===undefined)return '(없음)';const s=typeof v==='string'?v:JSON.stringify(v);return s.length>70?s.slice(0,67)+'…':s;};
