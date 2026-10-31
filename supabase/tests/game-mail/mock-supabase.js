// 두 플레이어가 같은 가짜 서버를 쓰는 테스트용 Supabase (localStorage에 표 보관, 탭 사이 실시간은 BroadcastChannel)
(function(){
const UID=window.__UID;
const KEY='__mockdb';
const load=()=>JSON.parse(localStorage.getItem(KEY)||'{"saves":[],"profiles":[],"mail":[],"content":[]}');
const store=db=>localStorage.setItem(KEY,JSON.stringify(db));
const bc=new BroadcastChannel('mock-rt');const subs=[];
bc.onmessage=e=>subs.forEach(s=>{if(s.table===e.data.table)s.cb(e.data);});
const notifyRT=(table,row)=>{const m={table,row};bc.postMessage(m);subs.forEach(s=>{if(s.table===table)s.cb(m);});};
// 프로필이 없으면 만든다(가입 트리거 흉내)
{const db=load();if(!db.profiles.some(p=>p.user_id===UID)){db.profiles.push({user_id:UID,username:window.__USERNAME,name:null,level:1});store(db);}}
const now=()=>new Date().toISOString();
window.__RPC=[];
class QB{
  constructor(t){this.t=t;this.op='select';this.f=[];}
  select(){return this;} order(){return this;} limit(n){this.lim=n;return this;} maybeSingle(){this.single=true;return this;}
  eq(k,v){this.f.push(r=>String(r[k])===String(v));return this;}
  neq(k,v){this.f.push(r=>String(r[k])!==String(v));return this;}
  not(k,op,v){this.f.push(r=>r[k]!=null);return this;}
  in(k,arr){this.f.push(r=>arr.map(String).includes(String(r[k])));return this;}
  or(){return this;}
  upsert(r){this.op='upsert';this.row=r;return this;} update(r){this.op='update';this.row=r;return this;} delete(){this.op='delete';return this;}
  insert(r){this.op='insert';this.row=r;return this;}
  run(){const db=load();const T=db[this.t]||(db[this.t]=[]);const ok=r=>this.f.every(f=>f(r));
    if(this.op==='select'){let rows=T.filter(ok);if(this.lim)rows=rows.slice(0,this.lim);
      if(this.t==='mail')rows=rows.slice().sort((a,b)=>b.created_at.localeCompare(a.created_at));
      return {data:this.single?rows[0]||null:rows,error:null};}
    if(this.op==='upsert'){const i=T.findIndex(r=>r.user_id===this.row.user_id);const r=JSON.parse(JSON.stringify(this.row));if(i>=0)T[i]=r;else T.push(r);store(db);return {data:null,error:null};}
    if(this.op==='update'){
      if(this.t==='profiles'&&this.row.name){const clash=T.find(p=>p.name&&p.name.toLowerCase()===this.row.name.toLowerCase()&&!ok(p));if(clash)return {data:null,error:{message:'duplicate key value violates unique constraint "profiles_name_unique"'}};}
      T.filter(ok).forEach(r=>Object.assign(r,this.row));store(db);if(this.t==='mail')T.filter(ok).forEach(r=>notifyRT('mail',r));return {data:null,error:null};}
    if(this.op==='delete'){db[this.t]=T.filter(r=>!ok(r));store(db);return {data:null,error:null};}
    return {data:null,error:null};}
  then(res,rej){return Promise.resolve().then(()=>this.run()).then(res,rej);}
}
const RPC={
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
  channel:()=>({on(ev,f,cb){subs.push({table:f.table,cb});return this;},subscribe(){return this;}}),
})};
})();
