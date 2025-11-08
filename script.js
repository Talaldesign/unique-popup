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

/* Load settings */
const settings = JSON.parse(localStorage.getItem('up.settings')||'{}');
const phrases = JSON.parse(localStorage.getItem('up.phrases')||'["أهلاً بك!","تجربة ممتعة","رسالة فريدة"]');
const socials = JSON.parse(localStorage.getItem('up.socials')||'[]');

/* Make BroadcastChannel for real-time updates */
let bc = null;
try { bc = new BroadcastChannel('unique-popup-channel'); } catch(e){ bc = null; }

/* Helper: increment analytic counter */
function incrCounter(key, by=1){
  const val = parseInt(localStorage.getItem(key)||'0',10) + by;
  localStorage.setItem(key, val);
  return val;
}

/* Show popup with unique phrase persisted across refresh for this session */
let finalMsg = sessionStorage.getItem('final_msg');
if(!finalMsg){
  const used = JSON.parse(sessionStorage.getItem('used_msgs')||'[]');
  const available = phrases.filter(p => !used.includes(p));
  if(available.length>0){
    finalMsg = available[Math.floor(Math.random()*available.length)];
    used.push(finalMsg);
    sessionStorage.setItem('used_msgs', JSON.stringify(used));
    sessionStorage.setItem('final_msg', finalMsg);
    // analytics: shown
    incrCounter('analytics.shown',1);
    if(bc) bc.postMessage({type:'popup_shown', info: finalMsg});
  } else {
    // no available phrases -> don't show
  }
}

/* Typewriter */
function typeWriter(text, i=0){
  const tw = document.getElementById('typewriter');
  const popup = document.getElementById('popupCard');
  if(!popup) return;
  popup.classList.remove('hidden');
  tw.textContent = text.substring(0,i);
  if(i < text.length) setTimeout(()=>typeWriter(text,i+1), 45 + Math.floor(Math.random()*15));
}
if(finalMsg) typeWriter(finalMsg);

/* Render social icons outside popup */
function renderSocials(){
  const container = document.getElementById('socialIcons');
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
renderSocials();

/* Admin button opens dashboard page (separate file) with password prompt */
document.getElementById('adminBtn').addEventListener('click', ()=>{
  const settingsLocal = JSON.parse(localStorage.getItem('up.settings')||'{}');
  const pass = prompt('أدخل كلمة مرور المشرف:');
  if(!pass) return;
  if(settingsLocal.adminPass && settingsLocal.adminPass !== pass){
    alert('كلمة المرور خاطئة'); return;
  }
  // open admin in a new tab
  window.open('dashboard.html', '_blank');
});

/* Apply theme from settings (listen to storage events so dashboard apply is immediate) */
function applyTheme(){
  const s = JSON.parse(localStorage.getItem('up.settings')||'{}');
  const theme = s.theme || 'theme-dark';
  document.documentElement.className = theme;
}
applyTheme();
window.addEventListener('storage', (e)=>{ // when dashboard updates settings in same origin
  if(e.key === 'up.settings' || e.key === 'theme.apply'){
    applyTheme();
  }
});

/* update visit counter display via console (dashboard will read from localStorage) */
console.log('visits', localStorage.getItem('analytics.visits'));

/* When popup is shown, ensure visits counter updated already */
incrCounter('analytics.visits', 0);

/* Broadcast updates to other tabs */
if(bc){
  bc.onmessage = (ev) => {
    const d = ev.data;
    // other tab events can be handled if needed
    console.log('bc event', d);
  };
}
