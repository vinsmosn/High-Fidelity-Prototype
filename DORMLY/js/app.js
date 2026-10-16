const KEY='dormly_v1',ME='Sean Medrano',ROOM='Room 204',DORM='Dormly Residences';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const now=()=>new Date().toLocaleString('en-PH',{dateStyle:'medium',timeStyle:'short'});
const today=()=>new Date().toISOString().slice(0,10);
const slug=s=>String(s).replace(/\s/g,'');
const badge=s=>`<span class="badge b-${slug(s)}">${esc(s)}</span>`;
const STATUS=['Received','Assigned','In Progress','Resolved','Cancelled'];
const PRI=['Low','Normal','High','Urgent'];
const CATS=['Plumbing','Electrical','Cleaning','Furniture','Internet','Other'];
const FACS=[['Study Room','Quiet space for up to 6 residents'],['Function Room','Events and group meetings'],['Laundry Area','Washers and dryers, 2nd floor'],['Kitchen','Shared cooking area'],['Court','Half-court for basketball']];

function seed(){return{role:null,next:2041,rating:0,
staff:['Kleiser Castillo','Rolan Dyquiangco','John Rey Juliano'],
requests:[
{id:'DR-2036',title:'Corridor light flickering',cat:'Electrical',pri:'Normal',status:'Resolved',room:'Room 204 corridor',desc:'The light outside my room flickers at night.',by:ME,staff:'Liza Cruz',date:'Oct 2, 2026, 6:10 PM',hist:[{t:'Oct 2, 2026, 6:10 PM',x:'Request submitted (Received)'},{t:'Oct 3, 2026, 9:00 AM',x:'Assigned to Liza Cruz'},{t:'Oct 4, 2026, 2:30 PM',x:'Status: Resolved. Note: Starter replaced.'}]},
{id:'DR-2038',title:'Wi-Fi drops in study lounge',cat:'Internet',pri:'Normal',status:'Assigned',room:'Study Lounge',desc:'Connection drops every few minutes.',by:'Jamie Lim',staff:'Ben Ocampo',date:'Oct 12, 2026, 8:45 PM',hist:[{t:'Oct 12, 2026, 8:45 PM',x:'Request submitted (Received)'},{t:'Oct 13, 2026, 10:00 AM',x:'Assigned to Ben Ocampo'}]}],
announcements:[
{id:'A1',title:'Water interruption tomorrow 8am–12pm',cat:'Maintenance',content:'Water will be shut off for pipe maintenance. Please store water in advance.',status:'Published',date:'Oct 15, 2026'},
{id:'A2',title:'Dorm inspection this Saturday 9am',cat:'Notice',content:'Routine room inspection. Please keep rooms accessible.',status:'Published',date:'Oct 14, 2026'},
{id:'A3',title:'Wi-Fi maintenance notice (draft)',cat:'Maintenance',content:'Brief outage expected next week.',status:'Draft',date:'Oct 16, 2026'}],
bookings:[{id:'B1',fac:'Function Room',date:'2026-10-24',start:'14:00',end:'17:00',purpose:'Birthday gathering',by:'Jamie Lim',status:'Approved',note:''}],
feedback:[{id:'F1',cat:'Maintenance',rating:4,comment:'Quick response on the corridor light. Thank you!',by:ME,date:'Oct 5, 2026',read:false}]}}
let S;try{S=JSON.parse(localStorage.getItem(KEY))||seed()}catch(e){S=seed()}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
let FILTER='All',ERR={},DRAFT={};
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('show'),2200)}

/* ---- store actions (single source of truth) ---- */
const store={
 createRequest(d){const id='DR-'+S.next++;const t=now();S.requests.unshift({id,...d,status:'Received',staff:'',by:ME,date:t,hist:[{t,x:'Request submitted (Received)'}]});save();return id},
 updateRequest(id,u,note){const r=S.requests.find(q=>q.id==id),h=[];
  if(u.pri!==r.pri)h.push(`Priority changed to ${u.pri}`);
  if(u.staff!==r.staff)h.push(u.staff?`Assigned to ${u.staff}`:'Staff unassigned');
  if(u.status!==r.status)h.push(`Status: ${u.status}`);
  if(note)h.push(`Admin note: ${note}`);
  if(!h.length)return false;
  Object.assign(r,u);const t=now();h.forEach(x=>r.hist.push({t,x}));save();return true},
 createBooking(d){S.bookings.unshift({id:'B'+Date.now(),...d,by:ME,status:'Pending',note:''});save()},
 decideBooking(id,status,note){const b=S.bookings.find(x=>x.id==id);b.status=status;b.note=note;save()},
 saveAnnouncement(d){if(d.id){Object.assign(S.announcements.find(a=>a.id==d.id),d)}else S.announcements.unshift({...d,id:'A'+Date.now()});save()},
 createFeedback(d){S.feedback.unshift({id:'F'+Date.now(),...d,by:ME,date:now(),read:false});save()}
};

/* ---- helpers ---- */
const bar=(t,back)=>`<header class="bar">${back?`<button data-a="go" data-v="${back}" aria-label="Back">←</button>`:''}<h1>${esc(t)}</h1><span class="badge" style="background:#ffffff33;color:#fff">${S.role=='r'?'Resident':'Admin'}</span></header>`;
const empty=m=>`<div class="empty">${m}</div>`;
const field=(id,label,type='text',extra='')=>`<label for="${id}">${label}</label><input id="${id}" type="${type}" value="${esc(DRAFT[id]||'')}" ${extra}>${ERR[id]?`<div class="err">${ERR[id]}</div>`:''}`;
const sel=(id,label,opts,cur)=>`<label for="${id}">${label}</label><select id="${id}">${opts.map(o=>`<option ${o==(cur??DRAFT[id])?'selected':''}>${o}</option>`).join('')}</select>`;
const area=(id,label)=>`<label for="${id}">${label}</label><textarea id="${id}">${esc(DRAFT[id]||'')}</textarea>${ERR[id]?`<div class="err">${ERR[id]}</div>`:''}`;
const val=id=>($('#'+id)?.value||'').trim();
const mine=()=>S.requests.filter(r=>r.by==ME);
const pub=()=>S.announcements.filter(a=>a.status=='Published');
function nav(items,cur){return `<nav aria-label="Main">${items.map(([k,i,l])=>`<button data-a="go" data-v="${k}" class="${cur==k?'on':''}" ${cur==k?'aria-current="page"':''}><i>${i}</i>${l}</button>`).join('')}</nav>`}
const RN=[['home','🏠','Home'],['requests','🛠','Requests'],['news','📢','News'],['fac','📅','Facilities'],['profile','👤','Profile']];
const AN=[['dash','📊','Dashboard'],['areq','🛠','Requests'],['abook','📅','Bookings'],['mgmt','⚙️','Manage']];
function reqCard(r,base){return `<button class="card" data-a="go" data-v="${base}/${r.id}"><div class="row"><b>${esc(r.title)}</b>${badge(r.status)}</div><div class="muted">${r.id} · ${esc(r.room)} · ${esc(r.cat)}</div><div class="row" style="margin-top:6px">${badge(r.pri)}<span class="muted">${r.staff?'👷 '+esc(r.staff):'Unassigned'}${base=='areq'?' · '+esc(r.by):''}</span></div></button>`}
function chips(list){return `<div class="chips">${['All',...list].map(s=>`<button class="chip ${FILTER==s?'on':''}" data-a="filter" data-v="${s}">${s}</button>`).join('')}</div>`}
function timeline(r){const i=Math.max(0,['Received','Assigned','In Progress','Resolved'].indexOf(r.status));
 const st=r.status=='Cancelled'?`<p>${badge('Cancelled')}</p>`:`<div class="steps">${['Received','Assigned','In Progress','Resolved'].map((s,k)=>`<span class="${k<=i?'on':''}">${s}</span>`).join('')}</div>`;
 return st+`<ul class="tl">${[...r.hist].reverse().map(h=>`<li><b>${esc(h.x)}</b><div class="muted">${esc(h.t)}</div></li>`).join('')}</ul>`}

/* ---- views ---- */
const V={};
V.entry=()=>`<div class="entry"><h1>🏠 DORMLY</h1><p style="margin:8px 0 28px;opacity:.9">Welcome! Report issues, track repairs, and stay connected with your dormitory.</p><button class="btn" style="background:#fff;color:var(--primary-dark)" data-a="role" data-v="r">Enter as Resident</button><button class="btn alt" data-a="role" data-v="a">Enter as Admin</button></div>`;

V.home=()=>{const m=mine(),o=m.filter(r=>['Received','Assigned'].includes(r.status)).length,p=m.filter(r=>r.status=='In Progress').length,nb=S.bookings.find(b=>b.by==ME&&b.status=='Approved');
 return bar('Home')+`<main><div class="hero"><p>Good day,</p><h1 style="font-size:24px">${ME}</h1><p>${ROOM} · ${DORM}</p></div>
 <div class="grid"><div class="kpi"><b>${o}</b>Open requests</div><div class="kpi"><b>${p}</b>In progress</div></div>
 <h2>Quick actions</h2><div class="grid"><button class="btn" data-a="go" data-v="report">+ Report issue</button><button class="btn alt" data-a="go" data-v="requests">My requests</button><button class="btn alt" data-a="go" data-v="fac">Book a space</button><button class="btn alt" data-a="go" data-v="fb">Feedback</button></div>
 ${nb?`<h2>Upcoming booking</h2><div class="card"><b>${esc(nb.fac)}</b><div class="muted">${nb.date} · ${nb.start}–${nb.end}</div></div>`:''}
 <h2>Announcements</h2>${pub().slice(0,2).map(a=>`<button class="card" data-a="go" data-v="news"><b>${esc(a.title)}</b><div class="muted">${esc(a.cat)} · ${a.date}</div></button>`).join('')||empty('No announcements yet.')}</main>`+nav(RN,'home')};

V.requests=()=>{const l=mine().filter(r=>FILTER=='All'||r.status==FILTER);
 return bar('My Requests')+`<main>${chips(STATUS)}${l.map(r=>reqCard(r,'req')).join('')||empty('No requests found.')}<button class="btn" data-a="go" data-v="report">+ Report an issue</button></main>`+nav(RN,'requests')};

V.req=id=>{const r=S.requests.find(x=>x.id==id);if(!r)return V.requests();
 return bar(r.id,'requests')+`<main><div class="card"><div class="row"><b>${esc(r.title)}</b>${badge(r.status)}</div><p class="muted">${esc(r.cat)} · ${esc(r.room)} · Submitted ${r.date}</p><p style="margin:8px 0">${esc(r.desc)}</p>${r.photo?`<p class="muted">📷 ${esc(r.photo)}</p>`:''}<div class="row">${badge(r.pri)}<span>${r.staff?'👷 '+esc(r.staff):'Not yet assigned'}</span></div></div><h2>Progress</h2>${timeline(r)}${['Received','Assigned'].includes(r.status)?`<button class="btn bad" data-a="cancel" data-v="${r.id}">Cancel request</button>`:''}${r.status=='Resolved'?`<button class="btn alt" data-a="go" data-v="fb">Rate this service</button>`:''}</main>`+nav(RN,'requests')};

V.report=()=>bar('Report an Issue','home')+`<main><form onsubmit="return false">${field('title','Issue title','text','maxlength=80 placeholder="e.g. Plumbing leak under the bathroom sink"')}${sel('cat','Category',CATS)}${sel('pri','Priority',PRI,DRAFT.pri||'Normal')}${field('room','Room or location','text')}${area('desc','Detailed description')}<label for="photo">Attach photo (optional)</label><input id="photo" type="file" accept="image/*"><button class="btn" id="sub" data-a="submitReq">Submit request</button><button class="btn alt" data-a="go" data-v="home">Cancel</button></form></main>`+nav(RN,'home');

V.news=()=>bar('Announcements')+`<main>${pub().map(a=>`<div class="card"><div class="row"><b>${esc(a.title)}</b><span class="badge">${esc(a.cat)}</span></div><div class="muted">${a.date}</div><p style="margin-top:6px">${esc(a.content)}</p></div>`).join('')||empty('No announcements yet.')}</main>`+nav(RN,'news');

V.fac=()=>{const bs=S.bookings.filter(b=>b.by==ME);
 return bar('Facilities')+`<main><div class="card"><b>Request a booking</b>${sel('fac','Facility',FACS.map(f=>f[0]))}<p class="muted" id="fd">${FACS[0][1]}</p>${field('date','Date','date',`min="${today()}"`)}<div class="grid"><div>${field('start','Start','time')}</div><div>${field('end','End','time')}</div></div>${field('purpose','Purpose')}<button class="btn" data-a="book">Submit booking</button></div><h2>My bookings</h2>${bs.map(b=>`<div class="card"><div class="row"><b>${esc(b.fac)}</b>${badge(b.status)}</div><div class="muted">${b.date} · ${b.start}–${b.end}</div><div>${esc(b.purpose)}</div>${b.note?`<div class="muted">Admin: ${esc(b.note)}</div>`:''}</div>`).join('')||empty('No bookings yet.')}</main>`+nav(RN,'fac')};

V.fb=()=>bar('Feedback','home')+`<main><form onsubmit="return false">${sel('cat','Category',['Maintenance','Facilities','Staff','General'])}<label>Rating</label><div class="stars" role="radiogroup" aria-label="Rating">${[1,2,3,4,5].map(n=>`<button data-a="rate" data-v="${n}" class="${S.rating>=n?'on':''}" aria-label="${n} stars">★</button>`).join('')}</div>${ERR.rating?`<div class="err">${ERR.rating}</div>`:''}${area('comment','Comment')}<button class="btn" data-a="sendFb">Submit feedback</button></form></main>`+nav(RN,'home');

V.profile=()=>bar('Profile')+`<main><div class="card"><b>${ME}</b><div class="muted">${ROOM} · ${DORM}</div><div class="muted">Contact: (add phone/email)</div><p style="margin-top:6px">Role: ${badge('Resident')}</p></div>${demoTools()}</main>`+nav(RN,'profile');
const demoTools=()=>`<h2>Settings</h2><button class="btn alt" data-a="switch">Switch to ${S.role=='r'?'Admin':'Resident'} view</button><button class="btn bad" data-a="reset">Reset data</button><p class="muted" style="margin-top:12px">Changes are saved on this device.</p>`;

V.dash=()=>{const R=S.requests,un=R.filter(r=>!r.staff&&!['Resolved','Cancelled'].includes(r.status)).length;
 return bar('Admin Dashboard')+`<main><div class="grid"><div class="kpi"><b>${un}</b>Unassigned</div><div class="kpi"><b>${R.filter(r=>r.status=='In Progress').length}</b>In progress</div><div class="kpi"><b>${S.bookings.filter(b=>b.status=='Pending').length}</b>Pending bookings</div><div class="kpi"><b>${S.feedback.filter(f=>!f.read).length}</b>New feedback</div></div>
 <h2>Needs attention</h2>${R.filter(r=>!['Resolved','Cancelled'].includes(r.status)).sort((a,b)=>PRI.indexOf(b.pri)-PRI.indexOf(a.pri)).slice(0,3).map(r=>reqCard(r,'areq')).join('')||empty('All clear.')}
 <h2>Recent activity</h2><ul class="tl">${R.flatMap(r=>r.hist.map(h=>({...h,id:r.id}))).slice(-5).reverse().map(h=>`<li><b>${h.id}</b> — ${esc(h.x)}<div class="muted">${esc(h.t)}</div></li>`).join('')}</ul></main>`+nav(AN,'dash')};

V.areq=()=>{const l=S.requests.filter(r=>FILTER=='All'||r.status==FILTER);
 return bar('Maintenance Queue')+`<main>${chips(STATUS)}${l.map(r=>reqCard(r,'areq')).join('')||empty('No requests.')}</main>`+nav(AN,'areq')};

V.areqd=id=>{const r=S.requests.find(x=>x.id==id);if(!r)return V.areq();
 return bar(r.id,'areq')+`<main><div class="card"><div class="row"><b>${esc(r.title)}</b>${badge(r.status)}</div><p class="muted">${esc(r.by)} · ${esc(r.room)} · ${esc(r.cat)}<br>Submitted ${r.date}</p><p style="margin-top:6px">${esc(r.desc)}</p>${r.photo?`<p class="muted">📷 ${esc(r.photo)}</p>`:''}</div>
 <div class="card"><b>Manage</b>${sel('m-pri','Priority',PRI,r.pri)}${sel('m-staff','Assign staff',['(Unassigned)',...S.staff],r.staff||'(Unassigned)')}${sel('m-status','Status',STATUS,r.status)}${area('m-note','Admin note (visible to resident)')}${ERR.m?`<div class="err">${ERR.m}</div>`:''}<button class="btn" data-a="saveReq" data-v="${r.id}">Save changes</button></div><h2>History</h2>${timeline(r)}</main>`+nav(AN,'areq')};

V.abook=()=>bar('Booking Requests')+`<main>${S.bookings.map(b=>`<div class="card"><div class="row"><b>${esc(b.fac)}</b>${badge(b.status)}</div><div class="muted">${esc(b.by)} · ${b.date} · ${b.start}–${b.end}</div><div>${esc(b.purpose)}</div>${b.note?`<div class="muted">Note: ${esc(b.note)}</div>`:''}${b.status=='Pending'?`<input id="bn-${b.id}" placeholder="Optional note" style="margin-top:8px"><div class="grid"><button class="btn sm" data-a="decide" data-v="${b.id}|Approved">Approve</button><button class="btn sm bad" data-a="decide" data-v="${b.id}|Rejected">Reject</button></div>`:''}</div>`).join('')||empty('No bookings.')}</main>`+nav(AN,'abook');

V.mgmt=()=>bar('Management')+`<main><button class="card" data-a="go" data-v="anews">📢 Announcements <span class="muted">(${S.announcements.length})</span></button><button class="card" data-a="go" data-v="afb">💬 Feedback inbox <span class="muted">(${S.feedback.filter(f=>!f.read).length} new)</span></button><div class="card"><b>Admin</b><div class="muted">Dormly Residences</div>Role: ${badge('Admin')}</div>${demoTools()}</main>`+nav(AN,'mgmt');

V.anews=()=>bar('Announcements','mgmt')+`<main><button class="btn" data-a="go" data-v="anew/new">+ New announcement</button>${S.announcements.map(a=>`<button class="card" data-a="go" data-v="anew/${a.id}"><div class="row"><b>${esc(a.title)}</b>${badge(a.status)}</div><div class="muted">${esc(a.cat)} · ${a.date}</div></button>`).join('')}</main>`+nav(AN,'mgmt');
V.anew=id=>{const a=S.announcements.find(x=>x.id==id)||{};if(!DRAFT.init){DRAFT={title:a.title||'',content:a.content||'',init:1}}
 return bar(a.id?'Edit announcement':'New announcement','anews')+`<main><form onsubmit="return false">${field('title','Title')}${sel('cat','Category',['Notice','Maintenance','Event','Policy'],a.cat)}${area('content','Content')}${sel('st','Status',['Published','Draft'],a.status||'Published')}<button class="btn" data-a="saveNews" data-v="${a.id||''}">Save</button></form></main>`+nav(AN,'mgmt')};
V.afb=()=>bar('Feedback Inbox','mgmt')+`<main>${S.feedback.map(f=>`<button class="card" data-a="review" data-v="${f.id}"><div class="row"><b>${'★'.repeat(f.rating)}${'☆'.repeat(5-f.rating)}</b>${badge(f.read?'Reviewed':'Draft').replace('Draft','New')}</div><div class="muted">${esc(f.cat)} · ${esc(f.by)} · ${f.date}</div><div>${esc(f.comment)}</div></button>`).join('')||empty('No feedback yet.')}</main>`+nav(AN,'mgmt');

/* ---- router ---- */
function render(){
 const app=$('#app');
 if(!S.role){app.innerHTML=V.entry();return}
 let [r,id]=(location.hash.slice(1)||(S.role=='r'?'home':'dash')).split('/');
 const adm=S.role=='a',rr={home:1,requests:1,req:1,report:1,news:1,fac:1,fb:1,profile:1},aa={dash:1,areq:1,abook:1,mgmt:1,anews:1,anew:1,afb:1};
 if(adm?!aa[r]:!rr[r])r=adm?'dash':'home';
 const key=adm&&r=='areq'&&id?'areqd':r;
 app.innerHTML=V[key](id);window.scrollTo(0,0);
}
function go(v){if(location.hash=='#'+v)render();else location.hash=v}
window.addEventListener('hashchange',()=>{ERR={};if(!/^(report|anew)/.test(location.hash.slice(1)))DRAFT={};render()});
window.addEventListener('storage',e=>{if(e.key==KEY){try{S=JSON.parse(e.newValue)||seed();render()}catch(x){}}});

/* ---- event actions ---- */
const A={
 go:v=>{ERR={};DRAFT={};go(v)},
 role:v=>{S.role=v;save();FILTER='All';location.hash='';render()},
 switch:()=>{S.role=S.role=='r'?'a':'r';save();FILTER='All';location.hash='';render();toast('Switched to '+(S.role=='r'?'Resident':'Admin')+' view')},
 reset:()=>{if(confirm('Reset all data? This cannot be undone.')){S=seed();save();location.hash='';render();toast('Data reset')}},
 filter:v=>{FILTER=v;render()},
 rate:v=>{keep();S.rating=+v;render()},
 submitReq:()=>{keep();ERR={};const d={title:val('title'),cat:val('cat'),pri:val('pri'),room:val('room'),desc:val('desc'),photo:$('#photo')?.files[0]?.name||''};
  if(d.title.length<3)ERR.title='Enter a title (min 3 characters).';if(!d.room)ERR.room='Enter your room or location.';if(d.desc.length<10)ERR.desc='Please describe the issue (min 10 characters).';
  if(Object.keys(ERR).length)return render();
  $('#sub').disabled=true;const id=store.createRequest(d);DRAFT={};toast('Request '+id+' submitted');go('req/'+id)},
 cancel:id=>{const r=S.requests.find(x=>x.id==id);r.status='Cancelled';r.hist.push({t:now(),x:'Cancelled by resident'});save();toast('Request cancelled');render()},
 saveReq:id=>{const st=val('m-status'),sf=val('m-staff')=='(Unassigned)'?'':val('m-staff');ERR={};
  if(['In Progress','Resolved'].includes(st)&&!sf)ERR.m='Assign a staff member before setting this status.';
  if(ERR.m)return render();
  const ch=store.updateRequest(id,{pri:val('m-pri'),staff:sf,status:st},val('m-note'));
  if(!ch){ERR.m='No changes to save.';return render()}
  toast('Changes saved');render()},
 book:()=>{keep();ERR={};const d={fac:val('fac'),date:val('date'),start:val('start'),end:val('end'),purpose:val('purpose')};
  if(!d.date||d.date<today())ERR.date='Choose today or a future date.';if(!d.start)ERR.start='Required';if(!d.end)ERR.end='Required';
  if(d.start&&d.end&&d.end<=d.start)ERR.end='End must be after start.';
  if(!d.purpose)ERR.purpose='Enter a purpose.';
  if(!Object.keys(ERR).length&&S.bookings.some(b=>b.status=='Approved'&&b.fac==d.fac&&b.date==d.date&&d.start<b.end&&d.end>b.start))ERR.start='That time overlaps an approved booking.';
  if(Object.keys(ERR).length)return render();
  store.createBooking(d);DRAFT={};toast('Booking submitted — pending approval');render()},
 decide:v=>{const[id,s]=v.split('|');store.decideBooking(id,s,val('bn-'+id));toast('Booking '+s.toLowerCase());render()},
 sendFb:()=>{keep();ERR={};const d={cat:val('cat'),rating:S.rating,comment:val('comment')};
  if(!d.rating)ERR.rating='Please select a rating.';if(d.comment.length<5)ERR.comment='Please add a short comment.';
  if(Object.keys(ERR).length)return render();
  store.createFeedback(d);S.rating=0;save();DRAFT={};toast('Thank you for your feedback!');go('home')},
 saveNews:id=>{ERR={};const d={title:val('title'),content:val('content'),cat:val('cat'),status:val('st')};
  if(!d.title)ERR.title='Required';if(!d.content)ERR.content='Required';
  if(Object.keys(ERR).length){keep();return render()}
  if(id)d.id=id;else d.date=new Date().toLocaleDateString('en-PH',{dateStyle:'medium'});
  store.saveAnnouncement(d);DRAFT={};toast(d.status=='Published'?'Published — residents can see it now':'Saved as draft');go('anews')},
 review:id=>{S.feedback.find(f=>f.id==id).read=true;save();render()}
};
function keep(){document.querySelectorAll('#app input,#app select,#app textarea').forEach(e=>{if(e.id)DRAFT[e.id]=e.value})}
document.addEventListener('click',e=>{const t=e.target.closest('[data-a]');if(t)A[t.dataset.a]?.(t.dataset.v)});
document.addEventListener('change',e=>{if(e.target.id=='fac'){const f=FACS.find(x=>x[0]==e.target.value);$('#fd').textContent=f?f[1]:''}});
render();