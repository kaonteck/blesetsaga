// 테스트용 가짜 Supabase (메모리 표 + 운영 함수 흉내)
(function(){
const ADMIN={id:'aaaaaaaa-0000-0000-0000-000000000001',email:'admin@blesetsaga.vercel.app',app_metadata:{role:window.__MOCK_ROLE||'admin'}};
const now=()=>new Date().toISOString();
const DB={
  content:[],content_drafts:[],content_history:[],admin_log:[],
  profiles:[{user_id:ADMIN.id,username:'admin',name:'운영자'},{user_id:'u2',username:'arin',name:'아린'},{user_id:'u3',username:'bella',name:'벨라'}],
  inquiries:[{id:'i1',author:'u2',cat:'버그',text:'장비가 사라졌어요',answer:null,created_at:now()}],
  reports:[{id:'r1',reporter:'u2',target:'u3',target_name:'벨라',kind:'chat',ref_id:'5',snapshot:'도배 메시지',reason:'도배',done:false,created_at:now()}],
  chat_messages:[{id:'5',channel:'lobby',author:'u3',name:'벨라',text:'도배 메시지',hidden:false,created_at:now()},{id:'6',channel:'lobby',author:'u2',name:'아린',text:'안녕하세요',hidden:false,created_at:now()},{id:'7',channel:'world',author:null,name:'운영자',cat:'maint',text:'점검 안내',hidden:false,created_at:now()}],feed_posts:[],feed_comments:[],
  invites:[{code:'BLESET01',max_uses:5,uses:2,note:'친구',created_at:now()}],
  saves:{u2:{savedAt:Date.now(),me:{level:12,gold:3400,job:'defender',inv:{potion:3,holywater:1}}}}
};
let hid=1;
function log(row){DB.content_history.unshift({hid:hid++,changed_at:now(),changed_by:ADMIN.id,...row});}
function upsertContent(r,restore){const i=DB.content.findIndex(x=>x.kind===r.kind&&x.id===r.id);
  if(i<0){const n={published:true,starts_at:null,ends_at:null,sort:0,note:null,...r,rev:1,updated_by:ADMIN.id,updated_at:now()};DB.content.push(n);log({kind:r.kind,id:r.id,op:'insert',before:null,after:n,rev:1});return n;}
  const o=DB.content[i],n={...o,...r,rev:o.rev+1,updated_at:now()};DB.content[i]=n;log({kind:r.kind,id:r.id,op:restore?'restore':'update',before:o,after:n,rev:n.rev});return n;}
const RPC={
  admin_players:()=>DB.profiles.map((p,i)=>({...p,job:'defender',level:5+i,status:i===1?'online':'offline',last_seen:now(),banned_until:p.banned_until||null,ban_reason:p.ban_reason||null,is_admin:p.user_id===ADMIN.id,last_sign_in:now(),saved_at:now(),joined_at:now(),invite:'BLESET01'})),
  admin_player_save:a=>DB.saves[a.p_user]||null,
  admin_ban:a=>{const p=DB.profiles.find(x=>x.user_id===a.p_user);p.banned_until=a.p_until;p.ban_reason=a.p_reason;DB.admin_log.unshift({id:Date.now(),admin:ADMIN.id,action:a.p_until?'ban':'unban',target:a.p_user,detail:{until:a.p_until,reason:a.p_reason},created_at:now()});return null;},
  admin_send_mail:a=>{const n=a.p_users?a.p_users.length:DB.profiles.length;DB.admin_log.unshift({id:Date.now(),admin:ADMIN.id,action:'send_mail',target:'all',detail:{text:a.p_text,items:a.p_items,gold:a.p_gold,count:n},created_at:now()});return n;},
  admin_invites:()=>DB.invites,
  admin_lotto:()=>[{draw_key:'2026-11-13',draw_at:'2026-11-13T11:00:00Z',nums:null,drawn_at:null,tickets:3,players:2,r1:0,r2:0,r3:0,claimed:0,paid:0},{draw_key:'2026-11-06',draw_at:'2026-11-06T11:00:00Z',nums:[1,2,3,9],drawn_at:'2026-11-06T11:00:05Z',tickets:4,players:3,r1:0,r2:1,r3:2,claimed:3,paid:3200}],
  admin_invite_create:a=>{const c=a.p_code||'AUTO1234';DB.invites.unshift({code:c,max_uses:a.p_max_uses,uses:0,note:a.p_note,created_at:now()});DB.admin_log.unshift({id:Date.now(),admin:ADMIN.id,action:'invite_create',target:c,detail:{},created_at:now()});return c;},
  admin_invite_delete:a=>{DB.invites=DB.invites.filter(x=>x.code!==a.p_code);return null;},
  admin_publish:a=>{const d=DB.content_drafts.find(x=>x.kind===a.p_kind&&x.id===a.p_id);if(!d)throw {message:'NO_DRAFT'};DB.content_drafts=DB.content_drafts.filter(x=>x!==d);return upsertContent({kind:d.kind,id:d.id,data:d.data});},
  admin_restore:a=>{const h=DB.content_history.find(x=>x.hid===a.p_hid);const s=h.after||h.before;return upsertContent({kind:h.kind,id:h.id,data:s.data,published:s.published},true);},
  admin_import:a=>{let n=0;a.p_rows.forEach(r=>{const ex=DB.content.some(x=>x.kind===r.kind&&x.id===r.id);if(!ex||a.p_overwrite){upsertContent({kind:r.kind,id:r.id,data:r.data});n++;}});return n;},
};
window.__DB=DB;window.__RPC_CALLS=[];
class QB{
  constructor(t){this.t=t;this.f=[];this.op='select';this.opts={};}
  select(c,o){if(this.op==='select')this.opts=o||{};return this;}
  order(){return this;} limit(n){this.lim=n;return this;}
  eq(k,v){this.f.push(r=>String(r[k])===String(v));return this;}
  is(k,v){this.f.push(r=>r[k]===v||(v===null&&r[k]==null));return this;}
  match(o){Object.entries(o).forEach(([k,v])=>this.eq(k,v));return this;}
  insert(r){this.op='insert';this.row=r;return this;} upsert(r){this.op='upsert';this.row=r;return this;}
  update(r){this.op='update';this.row=r;return this;} delete(){this.op='delete';return this;}
  maybeSingle(){this.single=true;return this;}
  run(){const T=DB[this.t];const ok=r=>this.f.every(f=>f(r));
    if(this.op==='select'){let rows=T.filter(ok);if(this.opts.head)return {data:null,count:rows.length,error:null};if(this.lim)rows=rows.slice(0,this.lim);return {data:this.single?rows[0]||null:JSON.parse(JSON.stringify(rows)),error:null};}
    if(this.t==='content'&&this.op==='update'){T.filter(ok).forEach(r=>upsertContent({...r,...this.row}));return {data:null,error:null};}
    if(this.t==='content'&&this.op==='delete'){T.filter(ok).forEach(r=>log({kind:r.kind,id:r.id,op:'delete',before:r,after:null,rev:r.rev}));DB[this.t]=T.filter(r=>!ok(r));return {data:null,error:null};}
    if(this.op==='insert'||this.op==='upsert'){const r={...this.row,updated_at:now(),updated_by:ADMIN.id};
      const i=T.findIndex(x=>x.kind===r.kind&&x.id===r.id&&r.kind);
      if(i>=0){if(this.op==='insert')return {data:null,error:{message:'duplicate key'}};T[i]=r;}else T.push(r);return {data:null,error:null};}
    if(this.op==='update'){T.filter(ok).forEach(r=>Object.assign(r,this.row,this.t==='inquiries'?{answered_by:ADMIN.id,answered_at:now()}:{},this.t==='reports'?{handled_by:ADMIN.id,handled_at:now()}:{}));return {data:null,error:null};}
    if(this.op==='delete'){DB[this.t]=T.filter(r=>!ok(r));return {data:null,error:null};}}
  then(res,rej){return Promise.resolve().then(()=>this.run()).then(res,rej);}
}
window.supabase={createClient:()=>({
  auth:{getSession:async()=>({data:{session:window.__MOCK_NOSESSION?null:{user:ADMIN}}}),getUser:async()=>({data:{user:ADMIN}}),
    signInWithPassword:async()=>({data:{user:ADMIN},error:null}),signOut:async()=>({})},
  from:t=>new QB(t),
  rpc:async(n,a)=>{window.__RPC_CALLS.push(n);try{return {data:RPC[n](a||{}),error:null};}catch(e){return {data:null,error:e};}},
})};
})();
