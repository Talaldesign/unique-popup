/* Admin dashboard script (admin.html) — manages phrases, socials, analytics realtime */

function uid(len=8){ const s='abcdefghijklmnopqrstuvwxyz0123456789'; let r=''; for(let i=0;i<len;i++) r+=s[Math.floor(Math.random()*s.length)]; return r; }

/* Load stored data */
let settings = JSON.parse(localStorage.getItem('up.settings')||'{}');
let phrases = JSON.parse(localStorage.getItem('up.phrases')||'["أهلاً بك!","تجربة ممتعة","رسالة فريدة"]');
let socials = JSON.parse(localStorage.getItem('up.socials')||'[]');

/* Ensure defaults */
if(!settings.adminPass) settings.adminPass = '1234';
localStorage.setItem('up.settings', JSON.stringify(settings));
localStorage.setItem('up.phrases', JSON.stringify(phrases));
localStorage.setItem('up.socials', JSON.stringify(socials));

/* BroadcastChannel */
let bc = null;
try{ bc = new BroadcastChannel('unique-popup-channel'); } catch(e){ bc=null; }

/* UI references */
const phraseInput = document.getElementById('phraseInput');
const addPhraseBtn = document.getElementById('addPhrase');
const phrasesList = document.getElementById('phrasesList');

const socialName = document.getElementById('socialName');
const socialURL = document.getElementById('socialURL');
const socialIconFile = document.getElementById('socialIconFile');
const addSocialBtn = document.getElementById('addSocial');
const socialList = document.getElementById('socialList');

const themeSelect = document.getElementById('themeSelect');
const applyThemeBtn = document.getElementById('applyTheme');

const statVisits = document.getElementById('statVisits');
const statUniques = document.getElementById('statUniques');
const statShown = document.getElementById('statShown');
const statClicks = document.getElementById('statClicks');
const liveEvents = document.getElementById('liveEvents');
const exportBtn = document.getElementById('exportBtn');
const resetStats = document.getElementById('resetStats');

/* Render functions */
function renderPhrases(){
  phrasesList.innerHTML = '';
  phrases.forEach((p,i)=>{
    const li = document.createElement('li');
    const left = document.createElement('div'); left.style.flex='1'; left.textContent = p;
    const edit = document.createElement('button'); edit.textContent='✎'; edit.className='btn';
    edit.onclick = ()=>{ const v = prompt('تعديل العبارة:', p); if(v!==null){ phrases[i]=v; savePhrases(); } };
    const del = document.createElement('button'); del.textContent='✕'; del.className='btn warn';
    del.onclick = ()=>{ if(confirm('حذف العبارة؟')){ phrases.splice(i,1); savePhrases(); } };
    li.appendChild(left); li.appendChild(edit); li.appendChild(del);
    phrasesList.appendChild(li);
  });
}
function savePhrases(){ localStorage.setItem('up.phrases', JSON.stringify(phrases)); renderPhrases(); if(bc) bc.postMessage({type:'phrases_updated'}); }

/* Socials */
function renderSocials(){
  socialList.innerHTML = '';
  socials.forEach((s,i)=>{
    const li = document.createElement('li');
    const left = document.createElement('div'); left.style.display='flex'; left.style.gap='10px'; left.style.alignItems='center';
    const im = document.createElement('img'); im.src=s.icon; im.style.width='44px'; im.style.borderRadius='8px';
    const info = document.createElement('div'); info.innerHTML = '<strong>'+s.name+'</strong><br><small style="color:rgba(255,255,255,0.7)">'+s.url+'</small>';
    left.appendChild(im); left.appendChild(info);
    const edit = document.createElement('button'); edit.textContent='✎'; edit.className='btn';
    edit.onclick = ()=>{ const n = prompt('اسم المنصة:', s.name); const u = prompt('الرابط:', s.url); if(n!==null && u!==null){ socials[i].name=n; socials[i].url=u; saveSocials(); } };
    const del = document.createElement('button'); del.textContent='✕'; del.className='btn warn';
    del.onclick = ()=>{ if(confirm('حذف الرابط؟')){ socials.splice(i,1); saveSocials(); } };
    li.appendChild(left); li.appendChild(edit); li.appendChild(del);
    socialList.appendChild(li);
  });
}
function saveSocials(){ localStorage.setItem('up.socials', JSON.stringify(socials)); renderSocials(); if(bc) bc.postMessage({type:'socials_updated'}); }

/* Add phrase */
addPhraseBtn.addEventListener('click', ()=>{
  const v = phraseInput.value.trim();
  if(!v) return alert('ادخل عبارة');
  phrases.unshift(v);
  phraseInput.value='';
  savePhrases();
  addLiveEvent({type:'phrase_added', info:v});
});

/* Add social (file->base64) */
addSocialBtn.addEventListener('click', ()=>{
  const name = socialName.value.trim();
  const url = socialURL.value.trim();
  const file = socialIconFile.files[0];
  if(!name || !url || !file) return alert('اكمل الحقول والأيقونة');
  const reader = new FileReader();
  reader.onload = (e)=>{
    socials.unshift({name, url, icon: e.target.result});
    socialName.value=''; socialURL.value=''; socialIconFile.value='';
    saveSocials();
    addLiveEvent({type:'social_added', info:name});
  };
  reader.readAsDataURL(file);
});

/* Theme apply */
applyThemeBtn.addEventListener('click', ()=>{
  const t = themeSelect.value;
  settings.theme = t;
  localStorage.setItem('up.settings', JSON.stringify(settings));
  document.documentElement.className = t;
  if(bc) bc.postMessage({type:'theme_changed', info:t});
  addLiveEvent({type:'theme_changed', info:t});
});

/* Analytics functions */
function updateStatsUI(){
  statVisits.textContent = localStorage.getItem('analytics.visits')||'0';
  statUniques.textContent = localStorage.getItem('analytics.uniques')||'0';
  statShown.textContent = localStorage.getItem('analytics.shown')||'0';
  statClicks.textContent = localStorage.getItem('analytics.clicks')||'0';
}
function addLiveEvent(ev){
  const li = document.createElement('li');
  const time = new Date().toLocaleTimeString();
  li.textContent = `[${time}] ${ev.type} — ${ev.info||''}`;
  liveEvents.prepend(li);
  while(liveEvents.children.length>200) liveEvents.removeChild(liveEvents.lastChild);
}

/* Export & Reset */
exportBtn.addEventListener('click', ()=>{
  const data = {
    visits: localStorage.getItem('analytics.visits')||0,
    uniques: localStorage.getItem('analytics.uniques')||0,
    shown: localStorage.getItem('analytics.shown')||0,
    clicks: localStorage.getItem('analytics.clicks')||0,
    phrases: phrases,
    socials: socials
  };
  const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'unique-popup-data.json'; a.click();
  URL.revokeObjectURL(url);
});

resetStats.addEventListener('click', ()=>{
  if(!confirm('إعادة ضبط الإحصائيات؟')) return;
  ['analytics.visits','analytics.uniques','analytics.shown','analytics.clicks'].forEach(k=> localStorage.setItem(k,'0'));
  updateStatsUI();
  addLiveEvent({type:'analytics_reset', info:''});
  if(bc) bc.postMessage({type:'analytics_reset'});
});

/* Initialize UI */
renderPhrases();
renderSocials();
updateStatsUI();

/* Listen for broadcast events to update live UI */
if(bc){
  bc.onmessage = (ev)=>{ const e = ev.data; addLiveEvent(e); updateStatsUI(); };
}

/* when page loads, apply current theme */
document.documentElement.className = settings.theme || 'theme-dark';
