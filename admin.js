/* admin.js - dashboard to manage phrases, socials, settings (single admin password in settings table) */
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function loadAll(){
  const { data: phrasesData } = await supabase.from('phrases').select('*').order('id', {ascending:false});
  const { data: socialsData } = await supabase.from('socials').select('*').order('id', {ascending:false});
  const { data: settingsData } = await supabase.from('settings').select('key,value');
  const settings = {};
  (settingsData||[]).forEach(s => settings[s.key] = s.value);
  return { phrases: phrasesData||[], socials: socialsData||[], settings };
}

async function checkAdminPasswordInput(pw){
  // read admin_password from settings table and compare
  const { data } = await supabase.from('settings').select('value').eq('key','admin_password').limit(1).single();
  const stored = data?.value ? (typeof data.value === 'string' ? data.value.replace(/^"|"$/g,'') : data.value) : null;
  return stored === pw;
}

async function renderManage(){
  const { phrases, socials } = await loadAll();
  const phrasesList = document.getElementById('phrasesList');
  const socialList = document.getElementById('socialList');
  phrasesList.innerHTML=''; socialList.innerHTML='';

  phrases.forEach(p => {
    const li = document.createElement('li');
    const left = document.createElement('div'); left.style.flex='1'; left.textContent = p.text;
    const edit = document.createElement('button'); edit.textContent='✎'; edit.className='btn';
    edit.onclick = async ()=>{
      const v = prompt('تعديل العبارة:', p.text);
      if(v!==null){ await supabase.from('phrases').update({ text: v }).eq('id', p.id); renderManage(); }
    };
    const del = document.createElement('button'); del.textContent='✕'; del.className='btn warn';
    del.onclick = async ()=>{ if(confirm('حذف؟')){ await supabase.from('phrases').delete().eq('id', p.id); renderManage(); } };
    li.appendChild(left); li.appendChild(edit); li.appendChild(del);
    phrasesList.appendChild(li);
  });

  socials.forEach(s => {
    const li = document.createElement('li');
    const left = document.createElement('div'); left.style.display='flex'; left.style.gap='10px'; left.style.alignItems='center';
    const im = document.createElement('img'); im.src = s.icon_base64 || 'assets/default-icon.png'; im.style.width='44px'; im.style.borderRadius='8px';
    const info = document.createElement('div'); info.innerHTML = '<strong>'+s.name+'</strong><br><small style="color:rgba(255,255,255,0.7)">'+s.url+'</small>';
    left.appendChild(im); left.appendChild(info);
    const edit = document.createElement('button'); edit.textContent='✎'; edit.className='btn';
    edit.onclick = async ()=>{
      const n = prompt('اسم المنصة:', s.name); const u = prompt('الرابط:', s.url);
      if(n!==null && u!==null){ await supabase.from('socials').update({ name: n, url: u }).eq('id', s.id); renderManage(); }
    };
    const del = document.createElement('button'); del.textContent='✕'; del.className='btn warn';
    del.onclick = async ()=>{ if(confirm('حذف الرابط؟')){ await supabase.from('socials').delete().eq('id', s.id); renderManage(); } };
    li.appendChild(left); li.appendChild(edit); li.appendChild(del);
    socialList.appendChild(li);
  });
}

document.addEventListener('DOMContentLoaded', async ()=>{
  // admin login handling
  const adminLoginBtn = document.getElementById('adminLoginBtn');
  const adminPasswordInput = document.getElementById('adminPasswordInput');
  const adminArea = document.getElementById('adminArea');

  adminLoginBtn.addEventListener('click', async ()=>{
    const pw = adminPasswordInput.value;
    if(!pw) return alert('أدخل كلمة المرور');
    const ok = await checkAdminPasswordInput(pw);
    if(!ok) return alert('كلمة مرور خاطئة');
    adminArea.classList.remove('hidden');
    adminPasswordInput.value='';
    renderManage();
    updateStats();
  });

  // add phrase
  document.getElementById('addPhrase').addEventListener('click', async ()=>{
    const v = document.getElementById('phraseInput').value.trim();
    if(!v) return alert('ادخل عبارة');
    await supabase.from('phrases').insert([{ text: v }]);
    document.getElementById('phraseInput').value='';
    renderManage();
  });

  // add social with icon (file->base64)
  document.getElementById('addSocial').addEventListener('click', ()=>{
    const name = document.getElementById('socialName').value.trim();
    const url = document.getElementById('socialURL').value.trim();
    const file = document.getElementById('socialIconFile').files[0];
    if(!name || !url || !file) return alert('اكمل الحقول والأيقونة');
    const reader = new FileReader();
    reader.onload = async (e)=>{
      await supabase.from('socials').insert([{ name, url, icon_base64: e.target.result }]);
      document.getElementById('socialName').value=''; document.getElementById('socialURL').value=''; document.getElementById('socialIconFile').value='';
      renderManage();
    };
    reader.readAsDataURL(file);
  });

  // apply theme
  document.getElementById('applyTheme').addEventListener('click', async ()=>{
    const t = document.getElementById('themeSelect').value;
    await supabase.from('settings').upsert([{ key: 'theme', value: { name: t } }]);
    await supabase.from('settings').upsert([{ key: 'theme.apply', value: { ts: Date.now() } }]);
    updateStats();
  });

  // export full JSON
  document.getElementById('exportBtn').addEventListener('click', async ()=>{
    const { data: phrasesData } = await supabase.from('phrases').select('*');
    const { data: socialsData } = await supabase.from('socials').select('*');
    const { data: settingsData } = await supabase.from('settings').select('*');
    const { data: analyticsData } = await supabase.from('analytics').select('*');
    const out = { phrases: phrasesData, socials: socialsData, settings: settingsData, analytics: analyticsData };
    const blob = new Blob([JSON.stringify(out,null,2)], {type:'application/json'});
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='unique-popup-export.json'; a.click(); URL.revokeObjectURL(url);
  });

  document.getElementById('resetStats').addEventListener('click', async ()=>{
    if(!confirm('إعادة ضبط الإحصائيات؟')) return;
    await supabase.from('analytics').delete().neq('id', 0);
    updateStats();
  });

  renderManage();
});

async function updateStats(){
  const { data: visits } = await supabase.from('analytics').select('*').eq('event_type','visit');
  const { data: uniques } = await supabase.from('analytics').select('visitor_id');
  const { data: shown } = await supabase.from('analytics').select('*').eq('event_type','popup_shown');
  const { data: clicks } = await supabase.from('analytics').select('*').eq('event_type','social_click');
  document.getElementById('statVisits').textContent = visits ? visits.length : 0;
  document.getElementById('statUniques').textContent = uniques ? (new Set(uniques.map(r=>r.visitor_id)).size) : 0;
  document.getElementById('statShown').textContent = shown ? shown.length : 0;
  document.getElementById('statClicks').textContent = clicks ? clicks.length : 0;
}
