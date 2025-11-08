/* Main front-end script for Unique Popup (homepage) */

/* Utilities */
function uid(len=12){
  const s = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let r=''; for(let i=0;i<len;i++) r+=s[Math.floor(Math.random()*s.length)];
  return r;
}

/* Ensure visitorId and analytics */
if(!localStorage.getItem('visitorId')) {
  localStorage.setItem('visitorId', uid(12));
  const uniques = parseInt(localStorage.getItem('analytics.uniques')||'0',10) + 1;
  localStorage.setItem('analytics.uniques', uniques);
}
const visits = parseInt(localStorage.getItem('analytics.visits')||'0',10) + 1;
localStorage.setItem('analytics.visits', visits);

/* Load settings and data (read the authoritative keys) */
function loadData(){
  const settings = JSON.parse(localStorage.getItem('up.settings')||'{}');
  const phrases = JSON.parse(localStorage.getItem('up.phrases')||'[]');
  const socials = JSON.parse(localStorage.getItem('up.socials')||'[]');
  return {settings, phrases, socials};
}

/* BroadcastChannel for realtime updates */
let bc = null;
try { bc = new BroadcastChannel('unique-popup-channel'); } catch(e) { bc = null; }

/* Helper: increment analytic counter */
function incrCounter(key, by=1){
  const val = parseInt(localStorage.getItem(key)||'0',10) + by;
  localStorage.setItem(key, val);
  return val;
}

/* Pick unique message per session and persist it across refresh */
function chooseFinalMessage(phrases){
  let finalMsg = sessionStorage.getItem('final_msg');
  if(!finalMsg){
    const used = JSON.parse(sessionStorage.getItem('used_msgs')||'[]');
    const available = phrases.filter(p => !used.includes(p));
    if(available.length>0){
      finalMsg = available[Math.floor(Math.random()*available.length)];
      used.push(finalMsg);
      sessionStorage.setItem('used_msgs', JSON.stringify(used));
      sessionStorage.setItem('final_msg', finalMsg);
      incrCounter('analytics.shown',1);
      if(bc) bc.postMessage({type:'popup_shown', info: finalMsg});
    }
  }
  return finalMsg;
}

/* Typewriter */
function typeWriter(text, i=0){
  const tw = document.getElementById('typewriter');
  const popup = document.getElementById('popupCard');
  if(!popup || !tw) return;
  popup.classList.remove('hidden');
  tw.textContent = text.substring(0,i);
  if(i < text.length) setTimeout(()=>typeWriter(text,i+1), 45 + Math.floor(Math.random()*15));
}

/* Render social icons outside popup */
function renderSocials(socials){
  const container = document.getElementById('socialIcons');
  if(!container) return;
  container.innerHTML = '';
  socials.forEach(s=>{
    const img = document.createElement('img');
    img.src = s.icon || 'assets/default-icon.png';
    img.alt = s.name || 'social';
    img.title = s.name || '';
    img.addEventListener('click', ()=>{
      window.open(s.url, '_blank');
      incrCounter('analytics.clicks',1);
      if(bc) bc.postMessage({type:'social_click', info: s.name});
    });
    container.appendChild(img);
  });
}

/* Initialize page using stored data */
function initPage(){
  const {settings, phrases, socials} = loadData();
  // choose and display final message
  const finalMsg = chooseFinalMessage(phrases);
  if(finalMsg) typeWriter(finalMsg);
  // render socials
  renderSocials(socials);
  // apply theme
  document.documentElement.className = settings.theme || 'theme-dark';
}

/* react to storage changes from admin or other tabs */
window.addEventListener('storage', (e)=>{
  if(e.key && (e.key.startsWith('up.') || e.key==='up.phrases' || e.key==='up.socials' || e.key==='up.settings')){
    // reload data and update UI
    const {phrases, socials} = loadData();
    // if user hasn't got a final_msg yet, choose again
    if(!sessionStorage.getItem('final_msg')){
      const finalMsg = chooseFinalMessage(phrases);
      if(finalMsg) typeWriter(finalMsg);
    }
    renderSocials(socials);
    // apply theme in case settings changed
    const settings = JSON.parse(localStorage.getItem('up.settings')||'{}');
    document.documentElement.className = settings.theme || 'theme-dark';
  }
});

/* BroadcastChannel messages */
if(bc){
  bc.onmessage = (ev)=>{
    const d = ev.data;
    if(d && d.type){
      // update UI based on event
      if(d.type==='phrases_updated' || d.type==='socials_updated' || d.type==='theme_changed'){
        const {phrases, socials} = loadData();
        renderSocials(socials);
        if(!sessionStorage.getItem('final_msg')){
          const finalMsg = chooseFinalMessage(phrases);
          if(finalMsg) typeWriter(finalMsg);
        }
        document.documentElement.className = JSON.parse(localStorage.getItem('up.settings')||'{}').theme || 'theme-dark';
      }
    }
  };
}

/* Admin open (password check) */
document.addEventListener('DOMContentLoaded', ()=>{
  initPage();
  // admin button open
  const adminBtn = document.getElementById('adminBtn');
  if(adminBtn){
    adminBtn.addEventListener('click', ()=>{
      const settings = JSON.parse(localStorage.getItem('up.settings')||'{}');
      const pass = prompt('أدخل كلمة مرور المشرف:');
      if(!pass) return;
      if(settings.adminPass && settings.adminPass !== pass){ alert('كلمة المرور خاطئة'); return; }
      window.open('dashboard.html', '_blank');
    });
  }
  // ensure visits stored increment already performed earlier
  incrCounter('analytics.visits', 0);
});
