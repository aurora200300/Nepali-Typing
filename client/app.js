const API = '/api';
const state = {
  token: localStorage.getItem('ppt_token') || '',
  user: JSON.parse(localStorage.getItem('ppt_user') || 'null'),
  lessons: [],
  selectedLesson: null,
  startTime: null,
  timer: null,
  lang: localStorage.getItem('ppt_lang') || 'en'
};

const t = {
  en: { subtitle:'Nepali Typing Academy', dashboard:'Dashboard', practice:'Practice', lessons:'Lessons', leaderboard:'Leaderboard', achievements:'Achievements', admin:'Admin', appearance:'Appearance', hello:'Namaste 👋', welcome:'Practice daily and improve beautifully.', googleLogin:'Google Sign in', demoLogin:'Demo Login', heroTitle:'Your daily Nepali typing progress', heroText:'Track WPM, accuracy, streaks, achievements and lessons in one beautiful academy dashboard.', avgWpm:'Average WPM', accuracy:'Accuracy', practiceTime:'Practice Time', streak:'Streak', performance:'Performance', recentActivity:'Recent Activity', typingPractice:'Preeti Typing Practice', mistakes:'Mistakes', start:'Start / Restart', saveSession:'Save Session', customText:'Custom Text', coach:'AI-style Coach' },
  ne: { subtitle:'नेपाली टाइपिङ्ग एकेडेमी', dashboard:'ड्यासबोर्ड', practice:'अभ्यास', lessons:'पाठहरू', leaderboard:'लिडरबोर्ड', achievements:'उपलब्धिहरू', admin:'एडमिन', appearance:'रूप', hello:'नमस्ते 👋', welcome:'दैनिक अभ्यास गर्नुहोस् र सुन्दर तरिकाले सुधार गर्नुहोस्।', googleLogin:'Google बाट साइन इन', demoLogin:'डेमो लगइन', heroTitle:'तपाईंको दैनिक नेपाली टाइपिङ प्रगति', heroText:'WPM, शुद्धता, streak, उपलब्धि र पाठहरू एउटै सुन्दर ड्यासबोर्डमा हेर्नुहोस्।', avgWpm:'औसत WPM', accuracy:'शुद्धता', practiceTime:'अभ्यास समय', streak:'लगातार अभ्यास', performance:'प्रदर्शन', recentActivity:'हालको गतिविधि', typingPractice:'Preeti टाइपिङ अभ्यास', mistakes:'गल्तीहरू', start:'सुरु / फेरि सुरु', saveSession:'सेसन सेभ गर्नुहोस्', customText:'आफ्नै टेक्स्ट', coach:'AI-जस्तो प्रशिक्षक' }
};

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

function applyI18n(){
  document.documentElement.lang = state.lang;
  localStorage.setItem('ppt_lang', state.lang);
  $$('[data-i18n]').forEach(el => { const key = el.dataset.i18n; if(t[state.lang][key]) el.textContent = t[state.lang][key]; });
  $('#languageSelect').value = state.lang;
}

function setTheme(theme){
  document.body.classList.remove('dark','threeD');
  if(theme === 'dark') document.body.classList.add('dark');
  if(theme === 'threeD') document.body.classList.add('threeD');
  localStorage.setItem('ppt_theme', theme);
  if(state.token) api('/auth/settings', { method:'PATCH', body: JSON.stringify({ theme }) }).catch(()=>{});
}

async function api(path, options={}){
  const headers = { 'Content-Type':'application/json', ...(options.headers || {}) };
  if(state.token) headers.Authorization = `Bearer ${state.token}`;
  const res = await fetch(API + path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if(!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function saveAuth({ token, user }){
  state.token = token; state.user = user;
  localStorage.setItem('ppt_token', token); localStorage.setItem('ppt_user', JSON.stringify(user));
  $('#userName').textContent = user.name;
  $('#avatar').textContent = user.avatar_url ? '🧑' : '👤';
}

async function demoLogin(){
  try { saveAuth(await api('/auth/demo', { method:'POST' })); await refreshAll(); }
  catch(e){ alert(e.message); }
}

async function fakeGoogle(){
  const name = prompt('Google display name?', 'Sagar Adhikari');
  const email = prompt('Google email?', 'sagar@example.com');
  if(!email) return;
  saveAuth(await api('/auth/google', { method:'POST', body: JSON.stringify({ name, email, avatarUrl:'' }) }));
  await refreshAll();
}

async function loadLessons(){
  const data = await api('/lessons').catch(() => ({ lessons: fallbackLessons() }));
  state.lessons = data.lessons.length ? data.lessons : fallbackLessons();
  state.selectedLesson = state.lessons[0];
  renderLessons();
}

function fallbackLessons(){
  return [
    {id:'local1', title_en:'Basic Keys', title_ne:'आधारभूत कुञ्जी', level:'Beginner', type:'character', content:'क ख ग घ ङ च छ ज झ ञ ट ठ ड ढ ण'},
    {id:'local2', title_en:'Sentence Practice', title_ne:'वाक्य अभ्यास', level:'Intermediate', type:'sentence', content:'नेपाल हाम्रो सुन्दर देश हो । यहाँ विविधता मा एकता छ ।'},
    {id:'local3', title_en:'Advanced Paragraph', title_ne:'उन्नत अनुच्छेद', level:'Advanced', type:'paragraph', content:'नियमित अभ्यासले टाइपिङ गति, शुद्धता र आत्मविश्वास दुवै बढाउँछ ।'}
  ];
}

function renderLessons(){
  $('#lessonSelect').innerHTML = state.lessons.map(l => `<option value="${l.id}">${state.lang==='ne'?l.title_ne:l.title_en} • ${l.level}</option>`).join('');
  $('#lessonCards').innerHTML = state.lessons.map(l => `<article class="card"><h4>${state.lang==='ne'?l.title_ne:l.title_en}</h4><p class="muted">${l.level} • ${l.type}</p><p>${l.content.slice(0,80)}...</p><button onclick="selectLesson('${l.id}')">Practice</button></article>`).join('');
  updateTarget();
}

window.selectLesson = (id) => { $('#lessonSelect').value = id; state.selectedLesson = state.lessons.find(l=>l.id===id); showPage('practice'); updateTarget(); };
function updateTarget(){
  state.selectedLesson = state.lessons.find(l => l.id === $('#lessonSelect').value) || state.lessons[0];
  $('#targetText').textContent = state.selectedLesson?.content || '';
}

function startPractice(){
  $('#typingInput').value = '';
  $('#typingInput').focus();
  state.startTime = Date.now();
  clearInterval(state.timer);
  state.timer = setInterval(updateLiveStats, 500);
  updateLiveStats();
}
function statsNow(){
  const target = $('#targetText').textContent;
  const typed = $('#typingInput').value;
  const secs = Math.max(1, Math.round(((Date.now()) - (state.startTime || Date.now()))/1000));
  let correct=0, mistakes=0;
  for(let i=0;i<typed.length;i++){ typed[i] === target[i] ? correct++ : mistakes++; }
  const wpm = Math.round(((typed.length/5)/(secs/60))*10)/10;
  const accuracy = typed.length ? Math.round((correct/typed.length)*1000)/10 : 0;
  return { target, typed, secs, correct, mistakes, wpm, accuracy };
}
function updateLiveStats(){
  const s = statsNow();
  $('#liveWpm').textContent = isFinite(s.wpm) ? s.wpm : 0;
  $('#liveAccuracy').textContent = s.accuracy + '%';
  $('#liveMistakes').textContent = s.mistakes;
  $('#liveTimer').textContent = s.secs + 's';
  const weak = findWeakChars(s.target, s.typed);
  $('#coachBox').textContent = weak.length ? `Practice these weak characters: ${weak.join(' ')}` : (s.typed.length ? 'Excellent. Keep rhythm steady and avoid rushing.' : 'Start typing. I will find your weak characters and suggest practice.');
}
function findWeakChars(target, typed){
  const map = new Map();
  for(let i=0;i<typed.length;i++) if(typed[i] !== target[i]) map.set(target[i] || '∅', (map.get(target[i] || '∅') || 0)+1);
  return [...map.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5).map(x=>x[0]);
}
async function saveSession(){
  if(!state.token) await demoLogin();
  const s = statsNow();
  try{
    await api('/progress/session', { method:'POST', body: JSON.stringify({ targetText:s.target, typedText:s.typed, durationSeconds:s.secs, lessonId: state.selectedLesson?.id, mode: state.selectedLesson?.type || 'practice' }) });
    await loadDashboard(); alert('Session saved ✅');
  }catch(e){ alert(e.message); }
}

async function loadDashboard(){
  if(!state.token){ renderLocalDashboard(); return; }
  const data = await api('/progress/dashboard').catch(() => null);
  if(!data){ renderLocalDashboard(); return; }
  $('#todayWpm').textContent = data.today.avgWpm || 0;
  $('#todayAccuracy').textContent = (data.today.avgAccuracy || 0) + '%';
  $('#practiceTime').textContent = Math.round((data.today.practiceSeconds || 0)/60) + 'm';
  $('#streak').textContent = data.streak || 0;
  $('#recentList').innerHTML = data.recent.length ? data.recent.map(r => `<div class="row"><b>${r.mode}</b><span>${r.wpm} WPM • ${r.accuracy}% • ${r.score} pts</span></div>`).join('') : '<p class="muted">No practice yet.</p>';
  $('#achievementCards').innerHTML = data.achievements.length ? data.achievements.map(a => `<article class="card"><h4>${a.icon} ${state.lang==='ne'?a.title_ne:a.title_en}</h4><p class="muted">${state.lang==='ne'?a.description_ne:a.description_en}</p></article>`).join('') : '<p class="muted">Save sessions to unlock achievements.</p>';
  drawChart(data.weekly || []);
}
function renderLocalDashboard(){
  $('#recentList').innerHTML = '<p class="muted">Login to save cloud progress.</p>'; drawChart([]);
}
function drawChart(rows){
  const c = $('#chart'), ctx = c.getContext('2d');
  ctx.clearRect(0,0,c.width,c.height);
  ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--line'); ctx.lineWidth = 1;
  for(let y=40;y<300;y+=52){ ctx.beginPath(); ctx.moveTo(50,y); ctx.lineTo(850,y); ctx.stroke(); }
  const vals = rows.length ? rows : [{wpm:20,accuracy:80},{wpm:28,accuracy:86},{wpm:25,accuracy:84},{wpm:35,accuracy:90},{wpm:32,accuracy:88},{wpm:40,accuracy:92},{wpm:45,accuracy:94}];
  plot(vals.map(x=>x.wpm), '#6d45f5', 60);
  plot(vals.map(x=>x.accuracy), '#13a85b', 100);
  ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--muted'); ctx.font = '16px sans-serif'; ctx.fillText('WPM + Accuracy trend', 55, 28);
  function plot(data,color,max){ ctx.strokeStyle=color; ctx.lineWidth=4; ctx.beginPath(); data.forEach((v,i)=>{const x=70+i*(760/Math.max(1,data.length-1)); const y=290-(v/max)*230; i?ctx.lineTo(x,y):ctx.moveTo(x,y);}); ctx.stroke(); data.forEach((v,i)=>{const x=70+i*(760/Math.max(1,data.length-1)); const y=290-(v/max)*230; ctx.beginPath(); ctx.arc(x,y,6,0,Math.PI*2); ctx.fillStyle=color; ctx.fill();}); }
}
async function loadLeaderboard(){
  const data = await api('/progress/leaderboard').catch(()=>({leaderboard:[]}));
  $('#leaderboardRows').innerHTML = data.leaderboard.length ? data.leaderboard.map((u,i)=>`<div class="row"><b>#${i+1} ${u.name}</b><span>${u.bestWpm} WPM • ${u.avgAccuracy}% • ${u.totalScore} pts</span></div>`).join('') : '<p class="muted">No leaderboard data yet.</p>';
}
async function loadAdmin(){
  const data = await api('/admin/overview').catch(()=>null);
  $('#adminData').innerHTML = data ? Object.entries(data).map(([k,v])=>`<article class="card"><h4>${k}</h4><p>${v ?? 0}</p></article>`).join('') : '<p class="muted">Admin login required.</p>';
}
function showPage(id){ $$('.page').forEach(p=>p.classList.remove('active')); $('#'+id).classList.add('active'); $$('.nav').forEach(n=>n.classList.toggle('active', n.dataset.page===id)); if(id==='leaderboard') loadLeaderboard(); if(id==='admin') loadAdmin(); }
async function refreshAll(){ await loadLessons(); await loadDashboard(); await loadLeaderboard(); }

$$('.nav').forEach(b=>b.addEventListener('click',()=>showPage(b.dataset.page)));
$$('[data-theme]').forEach(b=>b.addEventListener('click',()=>setTheme(b.dataset.theme)));
$('#languageSelect').addEventListener('change', e=>{state.lang=e.target.value; applyI18n(); renderLessons(); loadDashboard();});
$('#demoBtn').addEventListener('click', demoLogin); $('#googleBtn').addEventListener('click', fakeGoogle);
$('#lessonSelect').addEventListener('change', updateTarget); $('#startBtn').addEventListener('click', startPractice); $('#saveBtn').addEventListener('click', saveSession);
$('#typingInput').addEventListener('input', ()=>{ if(!state.startTime) state.startTime = Date.now(); updateLiveStats(); });
$('#customBtn').addEventListener('click',()=>{ const text = prompt('Paste Nepali practice text:'); if(text){ state.selectedLesson={id:null,title_en:'Custom',title_ne:'कस्टम',type:'custom',level:'Custom',content:text}; $('#targetText').textContent=text; }});
$('#refreshLessons').addEventListener('click', loadLessons);

if(state.user) $('#userName').textContent = state.user.name;
setTheme(localStorage.getItem('ppt_theme') || 'light'); applyI18n(); refreshAll();
