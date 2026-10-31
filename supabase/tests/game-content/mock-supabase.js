(function(){
const U={id:'uuuuuuuu-0000-0000-0000-000000000002',email:'arin@blesetsaga.vercel.app',app_metadata:{}};
const H=3600e3,iso=t=>new Date(t).toISOString();
window.__CT=[
 {kind:'monster',id:'forest',data:{kind:'party',name:'변이된 숲의 파수꾼',hp:777,atk:60,level:5,min:3,max:4,target:3,roles:{tank:1,dps:1,heal:1}},published:true,starts_at:null,ends_at:null,rev:3,sort:0},
 {kind:'monster',id:'st_hound',data:{name:'숨김',hp:1},published:false,starts_at:null,ends_at:null,rev:2,sort:0},
 {kind:'quest',id:'S1',data:{title:'미래 퀘스트'},published:true,starts_at:iso(Date.now()+H),ends_at:null,rev:2,sort:0},
 {kind:'item',id:'potion',data:{name:'서버 회복약',type:'use',price:30},published:true,starts_at:null,ends_at:null,rev:2,sort:0},
 {kind:'setting',id:'config',data:{levelCap:50},published:true,starts_at:null,ends_at:null,rev:2,sort:0},
 {kind:'notice',id:'n_srv',data:{title:'서버 공지',text:'안녕하세요',date:'2026-10-31'},published:true,starts_at:null,ends_at:null,rev:1,sort:0},
 {kind:'event',id:'ev1',data:{kind:'boss',title:'서버 보스 출현',loc:'초원',reward:'1.5배',link:''},published:true,starts_at:null,ends_at:iso(Date.now()+H),rev:1,sort:0},
];
window.__SAVES={};window.__CT_CB=null;window.__FETCHES=0;
class QB{constructor(t){this.t=t;this.op='select';}select(){return this;}order(){return this;}eq(k,v){this.v=v;return this;}maybeSingle(){return this;}
  upsert(r){this.op='upsert';this.row=r;return this;}
  then(res,rej){return Promise.resolve().then(()=>{
    if(this.t==='content'){window.__FETCHES++;return {data:JSON.parse(JSON.stringify(window.__CT)),error:null};}
    if(this.t==='saves'&&this.op==='select'){const d=window.__SAVES[this.v];return {data:d?{data:d}:null,error:null};}
    if(this.t==='saves'&&this.op==='upsert'){window.__SAVES[this.row.user_id]=this.row.data;return {data:null,error:null};}
    return {data:null,error:null};}).then(res,rej);}}
window.supabase={createClient:()=>({
  auth:{getSession:async()=>({data:{session:{user:U}}}),getUser:async()=>({data:{user:U}}),onAuthStateChange:()=>({}),signOut:async()=>({})},
  from:t=>new QB(t),
  channel:()=>({on(ev,f,cb){window.__CT_CB=cb;return this;},subscribe(){return this;}}),
})};
})();
