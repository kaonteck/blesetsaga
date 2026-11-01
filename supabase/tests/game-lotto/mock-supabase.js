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
  // ── 행운권 (supabase/008_lotto.sql 과 같은 규칙) ──
  _next(){const t=Date.now(),k=new Date(t+9*3600e3);const add=(5-k.getUTCDay()+7)%7;
    let fri=Date.UTC(k.getUTCFullYear(),k.getUTCMonth(),k.getUTCDate()+add,20,0,0)-9*3600e3;if(t>=fri)fri+=7*864e5;
    return {key:new Date(fri+9*3600e3).toISOString().slice(0,10),at:fri,close:fri-3600e3};},
  _due(db){db.lotto_draws=db.lotto_draws||[];db.lotto_tickets=db.lotto_tickets||[];
    db.lotto_draws.filter(d=>!d.nums&&d.at<=Date.now()).forEach(d=>{d.nums=(window.__FORCE_NUMS||[0,1,2,3,4,5,6,7,8,9].sort(()=>Math.random()-.5).slice(0,4)).slice().sort((a,b)=>a-b);});
    db.lotto_tickets.filter(t=>t.rank==null).forEach(t=>{const d=db.lotto_draws.find(x=>x.key===t.draw);if(d&&d.nums){const h=t.nums.filter(n=>d.nums.includes(n)).length;t.rank=h===4?1:h===3?2:h===2?3:0;}});},
  lotto_sync(){const db=load();this._due(db);store(db);const nx=this._next();
    const mine=db.lotto_tickets.filter(t=>t.user===UID);
    return {now:new Date().toISOString(),next:{key:nx.key,at:new Date(nx.at).toISOString(),close:new Date(nx.close).toISOString()},
      tickets:mine.map(t=>({id:t.id,draw:t.draw,nums:t.nums,rank:t.rank,claimed:!!t.claimed,ts:t.ts,at:new Date(db.lotto_draws.find(d=>d.key===t.draw).at).toISOString()})),
      draws:Object.fromEntries(db.lotto_draws.filter(d=>d.nums&&mine.some(t=>t.draw===d.key)).map(d=>[d.key,d.nums]))};},
  buy_lotto(a){const db=load();this._due(db);const nums=[...new Set(a.p_nums)].sort((x,y)=>x-y);
    if(nums.length!==4||a.p_nums.length!==4||nums.some(n=>n<0||n>9))throw {message:'BAD_NUMS'};
    const nx=this._next();if(Date.now()>=nx.close)throw {message:'SALE_CLOSED'};
    const s=db.saves.find(x=>x.user_id===UID);if(!s)throw {message:'NO_SAVE'};
    if(db.lotto_tickets.filter(t=>t.user===UID&&t.draw===nx.key).length>=2)throw {message:'MAX_TICKETS'};
    if((s.data.me.gold||0)<200)throw {message:'NOT_ENOUGH_GOLD'};
    s.data.me.gold-=200;if(!db.lotto_draws.some(d=>d.key===nx.key))db.lotto_draws.push({key:nx.key,at:nx.at,nums:null});
    const id='t'+Math.random().toString(36).slice(2,9);db.lotto_tickets.push({id,user:UID,draw:nx.key,nums,rank:null,claimed:false,ts:new Date().toISOString()});
    store(db);return {id,draw:nx.key,at:new Date(nx.at).toISOString(),nums,price:200};},
  claim_lotto(a){const db=load();this._due(db);const t=db.lotto_tickets.find(x=>x.id===a.p_id&&x.user===UID);
    if(!t)throw {message:'ALREADY_CLAIMED'};if(t.rank==null)throw {message:'NOT_DRAWN'};if(t.claimed)throw {message:'ALREADY_CLAIMED'};
    t.claimed=true;const prize={1:10000,2:3000,3:100}[t.rank]||0;if(prize){const s=db.saves.find(x=>x.user_id===UID);if(s)s.data.me.gold+=prize;}
    store(db);return {rank:t.rank,prize};},

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
  rpc:async(n,a)=>{window.__RPC.push(n);try{return {data:RPC[n].call(RPC,a||{}),error:null};}catch(e){return {data:null,error:e};}},
  channel:()=>({on(ev,f,cb){subs.push({table:f.table,cb});return this;},subscribe(){return this;}}),
})};
})();
