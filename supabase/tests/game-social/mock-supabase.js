// 두 플레이어가 같은 가짜 서버를 쓰는 테스트용 Supabase (localStorage에 표 보관, 탭 사이 실시간은 BroadcastChannel)
(function(){
const UID=window.__UID;
const KEY='__mockdb';
const load=()=>Object.assign({saves:[],profiles:[],mail:[],content:[],chat_messages:[],direct_messages:[],reports:[],inquiries:[],fish_catches:[],fish_awards:[]},JSON.parse(localStorage.getItem(KEY)||'{}'));
const store=db=>localStorage.setItem(KEY,JSON.stringify(db));
const bc=new BroadcastChannel('mock-rt');const subs=[];
const subOk=(s,d)=>{if(s.table!==d.table)return false;if(s.event&&s.event!=='*'&&s.event!==d.eventType)return false;if(s.filter){const [k,v]=s.filter.split('=eq.');if(String(d.new&&d.new[k])!==v)return false;}return true;};
bc.onmessage=e=>subs.forEach(s=>{if(subOk(s,e.data))s.cb(e.data);});
const notifyRT=(table,row,ev)=>{const m={table,row,eventType:ev||'INSERT',new:row};bc.postMessage(m);subs.forEach(s=>{if(subOk(s,m))s.cb(m);});};
window.__notifyRT=notifyRT;
// 프로필이 없으면 만든다(가입 트리거 흉내)
{const db=load();if(!db.profiles.some(p=>p.user_id===UID)){db.profiles.push({user_id:UID,username:window.__USERNAME,name:null,level:1});store(db);}}
const now=()=>new Date().toISOString();
window.__RPC=[];
class QB{
  constructor(t){this.t=t;this.op='select';this.f=[];}
  select(){if(this.op==='insert')this.ret=true;return this;} order(){return this;} limit(n){this.lim=n;return this;} maybeSingle(){this._one=true;return this;}
  eq(k,v){this.f.push(r=>String(r[k])===String(v));return this;}
  neq(k,v){this.f.push(r=>String(r[k])!==String(v));return this;}
  not(k,op,v){this.f.push(r=>r[k]!=null);return this;}
  in(k,arr){this.f.push(r=>arr.map(String).includes(String(r[k])));return this;}
  or(){return this;} gte(){return this;}
  single(){this._one=true;return this;}
  upsert(r){this.op='upsert';this.row=r;return this;} update(r){this.op='update';this.row=r;return this;} delete(){this.op='delete';return this;}
  insert(r){this.op='insert';this.row=r;return this;}
  _sel(){this.ret=true;return this;}
  run(){const db=load();const T=db[this.t]||(db[this.t]=[]);const ok=r=>this.f.every(f=>f(r));
    if(this.op==='insert'){
      if(window.__BANNED)return {data:null,error:{message:'new row violates row-level security policy for table "'+this.t+'"'}};
      const me=db.profiles.find(p=>p.user_id===UID);const r=JSON.parse(JSON.stringify(this.row));
      r.id=this.t==='reports'?'rp'+Date.now():(db._seq=(db._seq||100)+1);r.created_at=new Date().toISOString();
      if(this.t==='chat_messages'){r.author=UID;r.name=(me&&me.name)||'?';r.hidden=false;r.cat=r.cat||null;}
      if(this.t==='direct_messages'){r.sender=UID;}
      if(this.t==='reports'){r.reporter=UID;}
      if(this.t==='inquiries'){r.id='q'+db._seq;r.author=UID;r.answer=null;r.answered_at=null;if(!['계정','전투','퀘스트','버그 신고','기타'].includes(r.cat))return {data:null,error:{message:'violates check constraint "inquiries_cat_check"'}};}
      if(this.t==='fish_catches'){r.user_id=UID;r.week=window.__WK();if(!['meadow','sea','frost'].includes(r.land))return {data:null,error:{message:'violates check constraint'}};}
      T.push(r);store(db);if(this.t!=='reports')notifyRT(this.t,r);
      return {data:this.ret?(this._one?r:[r]):null,error:null};}
    if(this.op==='select'&&this.t==='fish_weekly'){const best={};db.fish_catches.forEach(f=>{const k=f.week+'|'+f.land+'|'+f.user_id;if(!best[k]||f.size_cm>best[k].size_cm)best[k]=f;});
      const rows=Object.values(best).map(f=>({...f,name:(db.profiles.find(p=>p.user_id===f.user_id)||{}).name})).filter(ok);return {data:rows,error:null};}
    if(this.op==='select'){let rows=T.filter(ok);if(this.t==='chat_messages')rows=rows.filter(r=>!r.hidden);if(this.lim)rows=rows.slice(0,this.lim);
      if(this.t==='mail')rows=rows.slice().sort((a,b)=>b.created_at.localeCompare(a.created_at));
      return {data:this._one?rows[0]||null:rows,error:null};}
    if(this.op==='upsert'){const i=T.findIndex(r=>r.user_id===this.row.user_id);const r=JSON.parse(JSON.stringify(this.row));if(i>=0)T[i]=r;else T.push(r);store(db);return {data:null,error:null};}
    if(this.op==='update'){
      if(this.t==='profiles'&&this.row.name){const clash=T.find(p=>p.name&&p.name.toLowerCase()===this.row.name.toLowerCase()&&!ok(p));if(clash)return {data:null,error:{message:'duplicate key value violates unique constraint "profiles_name_unique"'}};}
      T.filter(ok).forEach(r=>Object.assign(r,this.row));store(db);if(['mail','chat_messages','inquiries'].includes(this.t))T.filter(ok).forEach(r=>notifyRT(this.t,r,'UPDATE'));return {data:null,error:null};}
    if(this.op==='delete'){db[this.t]=T.filter(r=>!ok(r));store(db);return {data:null,error:null};}
    return {data:null,error:null};}
  then(res,rej){return Promise.resolve().then(()=>this.run()).then(res,rej);}
}
window.__WK=()=>{const d=new Date(Date.now()+9*3600e3);const back=(d.getUTCDay()+6)%7;return new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()-back)).toISOString().slice(0,10);};
const RPC={
  fish_settle(){const db=load();let n=0;const cur=window.__WK();const best={};
    db.fish_catches.filter(f=>f.week<cur).forEach(f=>{const k=f.week+'|'+f.land;const b=best[k];if(!b||f.size_cm>b.size_cm||(f.size_cm===b.size_cm&&f.created_at<b.created_at))best[k]=f;});
    Object.values(best).forEach(f=>{if(db.fish_awards.some(a=>a.week===f.week&&a.land===f.land))return;db.fish_awards.push({week:f.week,land:f.land,user_id:f.user_id,species:f.species,size_cm:f.size_cm});
      const m={id:'m'+Math.random().toString(36).slice(2,10),recipient:f.user_id,sender:null,sender_name:'운영자',text:'[주간 낚시 랭킹] '+f.week+' 1위',items:{},gold:500,read_at:null,claimed_at:null,archived:false,created_at:now()};db.mail.push(m);n++;});
    store(db);return n;},
  send_mail(a){const db=load();const me=UID;
    if(a.p_to===me)throw {message:'SELF'};
    const prof=db.profiles.find(p=>p.user_id===a.p_to);if(!prof)throw {message:'NO_RECIPIENT'};
    const items=a.p_items||{},gold=a.p_gold||0;
    if(Object.keys(items).length>3)throw {message:'BAD_ITEMS'};
    if(Object.keys(items).length||gold){const s=db.saves.find(x=>x.user_id===me);if(!s)throw {message:'NO_SAVE'};const M=s.data.me;
      if((M.gold||0)<gold)throw {message:'NOT_ENOUGH_GOLD'};
      for(const [k,n] of Object.entries(items)){const eq=Object.values(M.equip||{}).includes(k)?1:0;if((M.inv[k]||0)-eq<n)throw {message:'NOT_ENOUGH:'+k};}
      for(const [k,n] of Object.entries(items))M.inv[k]-=n;M.gold-=gold;}
    const sp=db.profiles.find(p=>p.user_id===me);
    const row={id:'m'+Math.random().toString(36).slice(2,10),recipient:a.p_to,sender:me,sender_name:sp.name||sp.username,text:a.p_text||'(선물)',items,gold,read_at:null,claimed_at:null,archived:false,created_at:now()};
    db.mail.push(row);store(db);notifyRT('mail',row);return {id:row.id};},
  claim_mail(a){const db=load();const m=db.mail.find(x=>x.id===a.p_id&&x.recipient===UID);
    if(!m||m.claimed_at)throw {message:'ALREADY_CLAIMED'};m.claimed_at=now();m.read_at=m.read_at||now();store(db);return {items:m.items,gold:m.gold};},
};
window.supabase={createClient:()=>({
  auth:{getSession:async()=>({data:{session:{user:{id:UID,email:window.__USERNAME+'@x',app_metadata:{}}}}}),
    getUser:async()=>({data:{user:{id:UID,email:window.__USERNAME+'@x',app_metadata:{}}}}),onAuthStateChange:()=>({}),signOut:async()=>({})},
  from:t=>new QB(t),
  rpc:async(n,a)=>{window.__RPC.push(n);try{return {data:RPC[n](a),error:null};}catch(e){return {data:null,error:e};}},
  channel:()=>({on(ev,f,cb){subs.push({table:f.table,event:f.event,filter:f.filter,cb});return this;},subscribe(){return this;}}),
})};
})();
