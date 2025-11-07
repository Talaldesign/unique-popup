
/* Unique Popup — Dashboard & Real-time Analytics (client-side) */

/* --- Utilities --- */
function uid(len=10){
  const s = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let r=''; for(let i=0;i<len;i++) r+=s[Math.floor(Math.random()*s.length)]; return r;
}

/* --- Visitor identity & visit count --- */
if(!localStorage.getItem('visitorId')){
  localStorage.setItem('visitorId', uid(12));
  // new unique visitor
  let uniques = parseInt(localStorage.getItem('analytics.uniques')||'0',10);
  localStorage.setItem('analytics.uniques', uniques+1);
}
let visits = parseInt(localStorage.getItem('analytics.visits')||'0',10) + 1;
localStorage.setItem('analytics.visits', visits);

/* --- Analytics counters --- */
function incrCounter(key, by=1){
  const val = parseInt(localStorage.getItem(key)||'0',10) + by;
  localStorage.setItem(key, val);
  return val;
}

/* initialize counters if missing */
['analytics.shown','analytics.clicks','analytics.visits','analytics.uniques'].forEach(k=>{
  if(localStorage.getItem(k)===null) localStorage.setItem(k,'0');
});

/* mark this visit */
incrCounter('analytics.visits', 0); // visits already incremented above

/* Broadcast channel for real-time updates across tabs/windows */
let bc = null;
try { bc = new BroadcastChannel('unique-popup-channel'); } catch(e){ bc=null; }

function broadcast(event){
  if(bc) bc.postMessage(event);
  // also keep a short live log
  addLiveEvent(event);
}

/* Live events list */
function addLiveEvent(ev){
  const list = document.getElementById('liveEvents');
  if(!list) return;
  const li = document.createElement('li');
  const time = new Date().toLocaleTimeString();
  li.textContent = `[${time}] ${ev.type} — ${ev.info||''}`;
  list.prepend(li);
  // trim
  while(list.children.length>100) list.removeChild(list.lastChild);
}

/* --- Load settings, phrases, socials --- */
let settings = JSON.parse(localStorage.getItem('up.settings')||'{}');
let phrases = JSON.parse(localStorage.getItem('up.phrases')||'["أهلاً بك!","سعيد بزيارتك!","جرب تصفح الموقع الآن."]');
let socials = JSON.parse(localStorage.getItem('up.socials')||'[]');

/* Ensure admin password exists (default) */
if(!settings.adminPass) settings.adminPass = '1234';
localStorage.setItem('up.settings', JSON.stringify(settings));
localStorage.setItem('up.phrases', JSON.stringify(phrases));
localStorage.setItem('up.socials', JSON.stringify(socials));

/* --- Popup selection: pick unique per session --- */
let used = JSON.parse(sessionStorage.getItem('used_msgs')||'[]');
let available = phrases.filter(p => !used.includes(p));
if(available.length>0){
  const pick = available[Math.floor(Math.random()*available.length)];
  used.push(pick);
  sessionStorage.setItem('used_msgs', JSON.stringify(used));
  // show popup and analytics
  incrCounter('analytics.shown',1);
  broadcast({type:'popup_shown', info: pick});
  startTypewriter(pick);
} else {
  // no available -> do not show
}

/* --- Typewriter --- */
function startTypewriter(text, i=0){
  const tw = document.getElementById('typewriter');
  const popup = document.getElementById('popupCard');
  popup.classList.remove('hidden');
  tw.textContent = text.substring(0,i);
  if(i < text.length){
    setTimeout(()=> startTypewriter(text, i+1), 45 + Math.floor(Math.random()*20));
  } else {
    // done
  }
}

/* --- Social icons render --- */
function renderSocialIcons(){
  const container = document.getElementById('socialIcons');
  container.innerHTML='';
  socials.forEach((s,idx)=>{
    const img = document.createElement('img');
    img.src = s.icon; img.alt = s.name; img.title = s.name;
    img.addEventListener('click', ()=>{
      window.open(s.url, '_blank');
      const clicks = incrCounter('analytics.clicks',1);
      broadcast({type:'social_click', info: s.name + ' ('+s.url+')' });
      updateAnalyticsUI();
    });
    container.appendChild(img);
  });
}
renderSocialIcons();

/* --- Admin UI interactions --- */
const adminIcon = document.getElementById('adminIcon');
const adminModal = document.getElementById('adminModal');
const closeAdmin = document.getElementById('closeAdmin');
const tabBtns = document.querySelectorAll('.tab-btn');

adminIcon.addEventListener('click', ()=>{
  const pass = prompt('أدخل كلمة مرور المشرف:');
  if(pass !== settings.adminPass){ alert('كلمة مرور خاطئة'); return; }
  openAdmin();
});

closeAdmin.addEventListener('click', ()=>{ adminModal.classList.add('hidden'); });

tabBtns.forEach(b=> b.addEventListener('click', ()=>{
  document.querySelectorAll('.tab-btn').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');
  document.querySelectorAll('.tab-page').forEach(p=>p.classList.add('hidden'));
  const id = b.getAttribute('data-tab');
  document.getElementById(id).classList.remove('hidden');
}));

function openAdmin(){
  // refresh data
  settings = JSON.parse(localStorage.getItem('up.settings')||'{}');
  phrases = JSON.parse(localStorage.getItem('up.phrases')||'[]');
  socials = JSON.parse(localStorage.getItem('up.socials')||'[]');
  populateManage();
  updateAnalyticsUI();
  adminModal.classList.remove('hidden');
}

/* Manage: phrases and socials UI */
function populateManage(){
  const pl = document.getElementById('phrasesList'); pl.innerHTML='';
  phrases.forEach((p,i)=>{
    const li = document.createElement('li');
    const span = document.createElement('span'); span.textContent = p; span.style.flex='1';
    const edit = document.createElement('button'); edit.textContent='✎'; edit.className='btn';
    edit.style.width='44px'; edit.onclick = ()=>{
      const v = prompt('تعديل العبارة:', p);
      if(v!==null){ phrases[i]=v; localStorage.setItem('up.phrases', JSON.stringify(phrases)); populateManage(); }
    };
    const del = document.createElement('button'); del.textContent='✕'; del.className='btn warn';
    del.style.width='44px'; del.onclick = ()=>{ phrases.splice(i,1); localStorage.setItem('up.phrases', JSON.stringify(phrases)); populateManage(); };
    li.appendChild(span); li.appendChild(edit); li.appendChild(del);
    pl.appendChild(li);
  });

  const sl = document.getElementById('socialList'); sl.innerHTML='';
  socials.forEach((s,i)=>{
    const li = document.createElement('li');
    const left = document.createElement('div'); left.style.display='flex'; left.style.gap='8px'; left.style.alignItems='center';
    const im = document.createElement('img'); im.src=s.icon; im.style.width='36px'; im.style.borderRadius='6px';
    const nm = document.createElement('div'); nm.innerHTML = '<strong>'+s.name+'</strong><br><small style="color:var(--muted)">'+s.url+'</small>';
    left.appendChild(im); left.appendChild(nm);
    const edit = document.createElement('button'); edit.textContent='✎'; edit.className='btn';
    edit.onclick = ()=>{
      const n = prompt('اسم المنصة:', s.name);
      const u = prompt('الرابط:', s.url);
      if(n!==null && u!==null){ socials[i].name=n; socials[i].url=u; localStorage.setItem('up.socials', JSON.stringify(socials)); populateManage(); renderSocialIcons(); }
    };
    const del = document.createElement('button'); del.textContent='✕'; del.className='btn warn';
    del.onclick = ()=>{ socials.splice(i,1); localStorage.setItem('up.socials', JSON.stringify(socials)); populateManage(); renderSocialIcons(); };
    li.appendChild(left); li.appendChild(edit); li.appendChild(del);
    sl.appendChild(li);
  });
}

/* Add phrase */
document.getElementById('addPhrase').addEventListener('click', ()=>{
  const v = document.getElementById('phraseInput').value.trim();
  if(!v) return alert('ادخل عبارة');
  phrases.unshift(v);
  localStorage.setItem('up.phrases', JSON.stringify(phrases));
  document.getElementById('phraseInput').value='';
  populateManage();
  broadcast({type:'phrase_added', info:v});
});

/* Add social with icon upload (File->base64) */
document.getElementById('addSocial').addEventListener('click', ()=>{
  const name = document.getElementById('socialName').value.trim();
  const url = document.getElementById('socialURL').value.trim();
  const file = document.getElementById('socialIconFile').files[0];
  if(!name || !url || !file) return alert('اكمل الحقول والأيقونة');
  const reader = new FileReader();
  reader.onload = (e)=>{
    socials.unshift({name, url, icon: e.target.result});
    localStorage.setItem('up.socials', JSON.stringify(socials));
    document.getElementById('socialName').value=''; document.getElementById('socialURL').value=''; document.getElementById('socialIconFile').value='';
    populateManage(); renderSocialIcons();
    broadcast({type:'social_added', info: name});
  };
  reader.readAsDataURL(file);
});

/* Save admin pass */
document.getElementById('savePass').addEventListener('click', ()=>{
  const p = document.getElementById('adminPass').value.trim();
  if(!p) return alert('أدخل كلمة مرور');
  settings.adminPass = p; localStorage.setItem('up.settings', JSON.stringify(settings)); alert('تم حفظ كلمة المرور');
});

/* Theme apply */
document.getElementById('applyTheme').addEventListener('click', ()=>{
  const t = document.getElementById('themeSelect').value;
  localStorage.setItem('up.settings', JSON.stringify(Object.assign(settings,{theme:t})));
  applyTheme(t);
  broadcast({type:'theme_changed', info:t});
});

function applyTheme(t){
  const body = document.body;
  body.classList.remove('theme-dark','theme-glass','theme-neon','theme-gradient');
  if(t==='glass') body.classList.add('theme-glass');
  else if(t==='neon') body.classList.add('theme-neon');
  else if(t==='gradient') body.classList.add('theme-gradient');
  else body.classList.add('theme-dark');
}
applyTheme(settings.theme||'dark');

/* Analytics UI update */
function updateAnalyticsUI(){
  document.getElementById('statVisits').textContent = localStorage.getItem('analytics.visits')||'0';
  document.getElementById('statUniques').textContent = localStorage.getItem('analytics.uniques')||'0';
  document.getElementById('statShown').textContent = localStorage.getItem('analytics.shown')||'0';
  document.getElementById('statClicks').textContent = localStorage.getItem('analytics.clicks')||'0';
}
updateAnalyticsUI();

/* Export JSON */
document.getElementById('exportBtn').addEventListener('click', ()=>{
  const data = {
    visits: localStorage.getItem('analytics.visits')||0,
    uniques: localStorage.getItem('analytics.uniques')||0,
    shown: localStorage.getItem('analytics.shown')||0,
    clicks: localStorage.getItem('analytics.clicks')||0,
    phrases: JSON.parse(localStorage.getItem('up.phrases')||'[]'),
    socials: JSON.parse(localStorage.getItem('up.socials')||'[]')
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'unique-popup-analytics.json'; a.click();
  URL.revokeObjectURL(url);
});

/* Reset analytics */
document.getElementById('resetBtn').addEventListener('click', ()=>{
  if(!confirm('هل تريد إعادة ضبط الإحصائيات؟')) return;
  ['analytics.visits','analytics.uniques','analytics.shown','analytics.clicks'].forEach(k=> localStorage.setItem(k,'0'));
  updateAnalyticsUI();
  broadcast({type:'analytics_reset'});
});

/* Real-time updates using BroadcastChannel */
if(bc){
  bc.onmessage = (ev)=>{
    const e = ev.data;
    if(e.type==='popup_shown'){ incrCounter('analytics.shown',0); addLiveEvent(e); updateAnalyticsUI(); }
    if(e.type==='social_click'){ /* other tab clicked */ addLiveEvent(e); updateAnalyticsUI(); }
    if(e.type==='phrase_added' || e.type==='social_added' || e.type==='theme_changed'){ addLiveEvent(e); }
    if(e.type==='analytics_reset'){ addLiveEvent({type:'analytics_reset', info:''}); updateAnalyticsUI(); }
  };
}

/* Add live events when local actions happen previously */
addLiveEvent({type:'visit', info: 'visit counted'});
updateAnalyticsUI();

/* close popup */
document.getElementById('closeBtn').addEventListener('click', ()=>{
  document.getElementById('popupCard').classList.add('hidden');
});

