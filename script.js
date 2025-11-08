const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function loadInitial(){
  const { data: phrasesData } = await supabase.from('phrases').select('id,text').order('id', {ascending:false});
  const phrases = (phrasesData || []).map(r => r.text);

  const { data: socialsData } = await supabase.from('socials').select('id,name,url,icon_base64').order('id', {ascending:false});
  const socials = socialsData || [];

  const { data: settingsData } = await supabase.from('settings').select('key,value');
  const settings = {};
  (settingsData || []).forEach(s => settings[s.key] = s.value);

  return { phrases, socials, settings };
}

function chooseSessionMessage(phrases){
  let finalMsg = sessionStorage.getItem('final_msg');
  if(finalMsg) return finalMsg;

  const used = JSON.parse(sessionStorage.getItem('used_msgs')||'[]');
  const available = phrases.filter(p => !used.includes(p));
  if(available.length === 0) return null;

  finalMsg = available[Math.floor(Math.random()*available.length)];
  used.push(finalMsg);
  sessionStorage.setItem('used_msgs', JSON.stringify(used));
  sessionStorage.setItem('final_msg', finalMsg);

  supabase.from('analytics').insert([{
    event_type:'popup_shown',
    info: JSON.stringify({text: finalMsg}),
    visitor_id: localStorage.getItem('visitorId')
  }]).catch(()=>{});

  return finalMsg;
}

function typeWriter(text, i=0){
  const tw = document.getElementById('typewriter');
  const popup = document.getElementById('popupCard');
  if(!popup || !tw) return;

  popup.classList.remove('hidden');
  popup.style.display = 'flex';

  tw.textContent = text.substring(0,i);
  if(i < text.length){
    setTimeout(()=>typeWriter(text,i+1), 40 + Math.floor(Math.random()*20));
  }
}

function renderSocials(socials){
  const container = document.getElementById('socialIcons');
  if(!container) return;
  container.innerHTML = '';
  socials.forEach(s=>{
    const img = document.createElement('img');
    img.src = s.icon_base64 || 'assets/default-icon.png';
    img.alt = s.name || '';
    img.title = s.name || '';
    img.addEventListener('click', ()=>{
      window.open(s.url, '_blank');
      supabase.from('analytics').insert([{ event_type:'social_click', info: JSON.stringify({name:s.name,url:s.url}), visitor_id: localStorage.getItem('visitorId') }]).catch(()=>{});
    });
    container.appendChild(img);
  });
}

async function initPage(){
  if(!localStorage.getItem('visitorId')){
    localStorage.setItem('visitorId', Math.random().toString(36).slice(2));
  }
  supabase.from('analytics').insert([{ event_type:'visit', visitor_id: localStorage.getItem('visitorId') }]).catch(()=>{});

  const { phrases, socials, settings } = await loadInitial();

  document.documentElement.className = settings.theme?.name || 'theme-dark';

  const finalMsg = chooseSessionMessage(phrases);
  if(finalMsg) typeWriter(finalMsg);
  renderSocials(socials);
}

document.addEventListener('DOMContentLoaded', initPage);
