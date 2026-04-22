/* ═══════════════════════════════════════════════════════
   ai-schedule.js  —  לוז יומי חכם עם AI (v2)
   ═══════════════════════════════════════════════════════ */

(function createScheduleModal(){
  if(document.getElementById('modal-schedule')) return;
  const el = document.createElement('div');
  el.className = 'bs-bg';
  el.id = 'modal-schedule';
  el.onclick = function(e){ if(e.target===this) closeScheduleModal(); };
  el.innerHTML = `
  <div class="bs-sheet" style="max-height:92vh;overflow-y:auto">
    <div class="bs-handle"></div>
    <div class="bs-header">
      <div class="bs-title">📅 לוז יומי חכם</div>
      <button class="bs-close" onclick="closeScheduleModal()">✕</button>
    </div>

    <div style="background:rgba(45,212,191,.07);border:1px solid rgba(45,212,191,.2);border-radius:10px;padding:11px 13px;margin-bottom:12px;font-size:12px;color:var(--txt2);line-height:1.6">
      ⏰ ה-AI רואה מה בוצע ומה נשאר, ובונה לוז ריאלי לשאר היום.
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
      <div>
        <div style="font-size:10px;font-weight:800;color:var(--txt3);text-transform:uppercase;letter-spacing:.7px;margin-bottom:4px">עכשיו</div>
        <input type="time" id="sched-now-time"
          style="width:100%;background:var(--bg3);border:1px solid var(--brd2);border-radius:9px;color:var(--txt);font-family:'Heebo',sans-serif;font-size:13px;padding:8px 10px;outline:none;box-sizing:border-box">
      </div>
      <div>
        <div style="font-size:10px;font-weight:800;color:var(--txt3);text-transform:uppercase;letter-spacing:.7px;margin-bottom:4px">סוף יום</div>
        <input type="time" id="sched-end-time" value="23:00"
          style="width:100%;background:var(--bg3);border:1px solid var(--brd2);border-radius:9px;color:var(--txt);font-family:'Heebo',sans-serif;font-size:13px;padding:8px 10px;outline:none;box-sizing:border-box">
      </div>
    </div>

    <div style="margin-bottom:12px">
      <div style="font-size:10px;font-weight:800;color:var(--txt3);text-transform:uppercase;letter-spacing:.7px;margin-bottom:4px">אירועים / משימות נוספות (אופציונלי)</div>
      <textarea id="sched-extra-tasks" rows="2" placeholder="למשל: פגישה עם ליברמן 15:00 (שעה), לאסוף ילדים 16:30 (20 דק')..."
        style="width:100%;background:var(--bg3);border:1px solid var(--brd2);border-radius:10px;color:var(--txt);font-family:'Heebo',sans-serif;font-size:12px;padding:9px 11px;outline:none;resize:none;box-sizing:border-box;line-height:1.5"></textarea>
    </div>

    <button id="sched-gen-btn" onclick="generateSchedule()"
      style="width:100%;padding:13px;background:linear-gradient(135deg,var(--teal),#0a8a70);color:#fff;border-radius:var(--r-sm);font-size:13px;font-weight:900;cursor:pointer;border:none;font-family:'Heebo',sans-serif;box-sizing:border-box;margin-bottom:12px">
      סדר לי את היום
    </button>

    <div id="sched-result"></div>
  </div>`;
  document.body.appendChild(el);
})();

function _setSchedNowTime(){
  const now = new Date();
  const hh = String(now.getHours()).padStart(2,'0');
  const mm = String(now.getMinutes()).padStart(2,'0');
  const inp = document.getElementById('sched-now-time');
  if(inp) inp.value = hh+':'+mm;
}

function openScheduleModal(){
  _setSchedNowTime();
  const res = document.getElementById('sched-result');
  if(res) res.innerHTML = '';
  document.getElementById('modal-schedule').classList.add('on');
  document.body.style.overflow = 'hidden';
}

function closeScheduleModal(){
  document.getElementById('modal-schedule').classList.remove('on');
  if(!document.querySelector('.bs-bg.on,.modal-bg.on'))
    document.body.style.overflow = '';
}

function _buildScheduleContext(){
  const dayType = getDayType(new Date());
  const allTasks = getTasksForDay(S.level, dayType);
  const tasks = allTasks.map(t => {
    const bid = _baseId(t.id);
    const indivLvl = (S.taskIndivLevel && S.taskIndivLevel[bid]) || S.level;
    const altArr = _getDefaultTasks(indivLvl);
    const alt = altArr.find(x => _baseId(x.id) === bid);
    return {
      ...t,
      _text: alt ? alt.text : t.text,
      _pts: alt ? bonusPts(alt.pts) : bonusPts(t.pts),
      _indivLvl: indivLvl,
      _done: !!S.done[t.id]
    };
  });

  const done = tasks.filter(t => t._done);
  const pending = tasks.filter(t => !t._done);

  const today = new Date().toDateString();
  const otPending = (S.oneTimeTasks||[]).filter(t=>{
    const days = t.days||['weekday'];
    if(!days.includes(dayType)) return false;
    const dc = t.doneCount||(t.doneDate?1:0);
    return dc < (t.maxReps||1);
  });
  const strkPending = (S.streakTasks||[]).filter(t=>{
    const days = t.days||['weekday'];
    return days.includes(dayType) && !(t.streakDays&&t.streakDays[today]);
  });

  const avail = calcAvail();
  const rewardsList = getEffectiveRewards()
    .flatMap(c=>c.items)
    .filter(r => !S.redeemed.includes(r.id) && avail >= r.pts && (!r.minLevel || S.level >= r.minLevel))
    .sort((a,b)=>a.pts-b.pts)
    .slice(0, 4)
    .map(r=>`${r.emoji||''} ${r.title} (${r.pts}נק')`)
    .join(' | ');

  return {
    level: S.level,
    streak: S.streak,
    totalPts: avail,
    doneTasks: done.map(t=>t._text),
    pendingTasks: pending.map(t=>({
      text: t._text, pts: t._pts, slot: t.slot,
      time: t.time||null, indivLevel: t._indivLvl
    })),
    otPending: otPending.map(t=>t.text),
    strkPending: strkPending.map(t=>t.text),
    doneCount: done.length,
    totalCount: tasks.length,
    pct: tasks.length ? Math.round(done.length/tasks.length*100) : 0,
    rewardsList,
    gracesRemaining: typeof totalGraceAvailable==='function' ? totalGraceAvailable() : 0,
    focusDaysRemaining: typeof focusDaysUsedThisMonth==='function' ? (3-focusDaysUsedThisMonth()) : 0
  };
}

async function generateSchedule(){
  const nowTime = document.getElementById('sched-now-time')?.value || '12:00';
  const endTime = document.getElementById('sched-end-time')?.value || '23:00';
  const extra   = (document.getElementById('sched-extra-tasks')?.value||'').trim();
  const ctx     = _buildScheduleContext();
  const btn     = document.getElementById('sched-gen-btn');
  const res     = document.getElementById('sched-result');

  const toMin = t => { const [h,m] = t.split(':').map(Number); return h*60+m; };
  const availMin = toMin(endTime) - toMin(nowTime);
  if(availMin <= 0){ toast('שעת הסיום חייבת להיות אחרי השעה הנוכחית'); return; }

  btn.disabled = true;
  btn.textContent = '⏳ מסדר...';
  res.innerHTML = `<div style="text-align:center;padding:20px;color:var(--txt3);font-size:12px">⏳ בונה לוז...</div>`;

  const SLOT_DUR = { 0:10, 1:20, 2:20, 3:15 };
  const pendingLines = ctx.pendingTasks.map(t => {
    const dur = SLOT_DUR[t.slot] || 15;
    const timeNote = t.time ? ` [מוגדר:${t.time}]` : '';
    return `• ${t.text}${timeNote} [~${dur}דק, +${t.pts}נק, שלב${t.indivLevel}]`;
  }).join('\n');

  const extraLines = [
    ...ctx.otPending.map(t=>`• ${t} [חד-פעמית ~15דק]`),
    ...ctx.strkPending.map(t=>`• ${t} [עקביות ~10דק]`),
    ...(extra ? extra.split('\n').filter(Boolean).map(l=>`• ${l}`) : [])
  ].join('\n');

  const prompt = `אתה עוזר ניהול זמן אישי בעברית. כתוב תשובה קצרה ומדויקת.

מצב: שלב ${ctx.level}, רצף ${ctx.streak}, ${ctx.doneCount}/${ctx.totalCount} בוצעו (${ctx.pct}%)
בוצע כבר: ${ctx.doneTasks.slice(0,4).join(' | ')||'כלום'}

משימות שנותרו:
${pendingLines||'הכל בוצע!'}

${extraLines ? 'נוסף:\n'+extraLines : ''}

זמן: ${nowTime} עד ${endTime} = ${availMin} דקות זמינות.
נקודות: ${ctx.totalPts} | פרסים: ${ctx.rewardsList||'אין'}
ימי חסד: ${ctx.gracesRemaining} | ימי עשייה: ${ctx.focusDaysRemaining}

כתוב לוז כזה (אחת לכל משימה):
כותרת: ⏱ לוז ${nowTime}–${endTime}

[שעה] • [שם משימה] • [דקות]

לדוגמה:
14:45 • מנוחת צהריים • 15דק
15:00 • חת"ת ורמב"ם • 30דק
15:30 • עבודה על פרויקטים • 45דק

לאחר הלוז, שורה ריקה, ואז:
📊 משימות: Xדק | פנוי: Ydק | 80% — כן/לא
💡 זמן פנוי: [1-2 רעיונות קצרים]
🎁 פרס: [שם + כמה נקודות]
${ctx.gracesRemaining>0 || ctx.focusDaysRemaining>0 ? '🛡️ ייעוץ: [האם כדאי יום חסד/עשייה אם אין מספיק זמן]' : ''}

חשוב: אל תכתוב "הנה" בפתיחה. אל תסביר. רק הלוז.`;

  const raw = await _callClaude(prompt);
  btn.disabled = false;
  btn.textContent = 'סדר לי את היום';

  if(!raw){
    res.innerHTML = `<div style="color:var(--red);padding:10px;text-align:center;font-size:12px">שגיאה — בדוק שיש מפתח API תקין</div>`;
    return;
  }

  window._lastScheduleRaw = raw;
  _renderScheduleResult(res, raw);
}

function _renderScheduleResult(container, raw){
  const lines = raw.split('\n');

  // מזהה שורות לוז: מתחילות בשעה (XX:XX)
  const isTaskLine = l => /^\d{1,2}:\d{2}/.test(l.trim());
  const taskLines = lines.filter(isTaskLine);
  const otherLines = lines.filter(l => !isTaskLine(l));

  // בנה כרטיסי לוז
  let schedHtml = '';
  if(taskLines.length){
    schedHtml += `<div style="border:1px solid var(--brd);border-radius:10px;overflow:hidden;margin-bottom:12px">`;
    taskLines.forEach((line, i) => {
      const parts = line.trim().split('•').map(p=>p.trim());
      const timeStr = parts[0] || '';
      const taskName = parts[1] || '';
      const dur = parts[2] || '';
      const bg = i%2===0 ? 'var(--surface)' : 'var(--bg3)';
      // האם משימה קבועה (תפילה, חת"ת)
      const isFixed = /מנחה|מעריב|חת"ת|תפילה|רמב"ם/.test(taskName);
      const accent = isFixed ? 'border-right:3px solid rgba(45,212,191,.6)' : '';
      schedHtml += `
        <div style="display:flex;align-items:center;gap:10px;padding:9px 12px;background:${bg};${accent};border-bottom:1px solid var(--brd)">
          <div style="font-size:11px;font-weight:800;color:var(--teal);min-width:44px;flex-shrink:0">${timeStr}</div>
          <div style="flex:1;font-size:12px;color:var(--txt);line-height:1.3">${taskName}</div>
          <div style="font-size:11px;color:var(--txt3);flex-shrink:0">${dur}</div>
        </div>`;
    });
    schedHtml += `</div>`;
  }

  // שאר הטקסט (סיכום, פרס, ייעוץ)
  const summaryRaw = otherLines
    .filter(l => l.trim() && !l.includes('לוז') && !/^⏱/.test(l.trim()))
    .join('\n');

  const summaryHtml = summaryRaw
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/^(📊|💡|🎁|🛡️|🎯)(.+)$/gm,
      '<div style="display:flex;gap:6px;padding:4px 0;font-size:12px"><span style="flex-shrink:0">$1</span><span>$2</span></div>')
    .replace(/\n{2,}/g,'<div style="height:4px"></div>');

  container.innerHTML = `
    <div style="background:rgba(45,212,191,.05);border:1px solid rgba(45,212,191,.2);border-radius:12px;padding:14px">
      ${schedHtml}
      <div style="color:var(--txt);line-height:1.75">${summaryHtml}</div>
      <div style="display:flex;gap:8px;margin-top:12px">
        <button onclick="sendScheduleToChat()" style="flex:1;padding:9px;background:rgba(155,126,248,.12);border:1px solid rgba(155,126,248,.3);border-radius:9px;font-size:11px;font-weight:800;color:var(--purple);cursor:pointer;font-family:'Heebo',sans-serif">
          💬 שאל על הלוז
        </button>
        <button onclick="generateSchedule()" style="flex:1;padding:9px;background:var(--sf3);border:1px solid var(--brd2);border-radius:9px;font-size:11px;font-weight:800;color:var(--txt2);cursor:pointer;font-family:'Heebo',sans-serif">
          ↻ בנה מחדש
        </button>
      </div>
    </div>`;
}

function sendScheduleToChat(){
  if(!window._lastScheduleRaw) return;
  closeScheduleModal();
  setTimeout(()=>{
    if(typeof nav==='function') nav('chat');
    setTimeout(()=>{
      if(window._chatHistory && Array.isArray(_chatHistory)){
        _chatHistory.push({
          role:'assistant',
          content:`בניתי לך לוז יומי:\n\n${window._lastScheduleRaw}`
        });
      }
      if(typeof chatAddMessage==='function'){
        chatAddMessage('ai','יצרתי לך לוז יומי. אפשר לשאול אותי כל שאלה עליו — "מה לוותר עליו?" / "מה לעשות בזמן הפנוי?" / "האם משתלם יום חסד?"');
      }
    }, 300);
  }, 200);
}

function _addScheduleBtnToChat(){
  if(document.getElementById('sched-chat-btn')) return;
  const hdr = document.querySelector('#pg-chat > div:first-child');
  if(!hdr) return;
  const btn = document.createElement('button');
  btn.id = 'sched-chat-btn';
  btn.innerHTML = '📅 לוז';
  btn.style.cssText = `padding:5px 12px;background:rgba(45,212,191,.1);border:1px solid rgba(45,212,191,.3);border-radius:99px;font-size:11px;font-weight:800;color:var(--teal);cursor:pointer;font-family:'Heebo',sans-serif;white-space:nowrap;flex-shrink:0;`;
  btn.onclick = openScheduleModal;
  hdr.appendChild(btn);
}

function _patchAiBS(){
  const origOpen = window.openAiBS;
  if(!origOpen || window._schedPatchDone) return;
  window._schedPatchDone = true;
  window.openAiBS = function(){
    origOpen();
    setTimeout(()=>{
      if(document.getElementById('ai-sched-tab')) return;
      const tabs = document.getElementById('ai-bs-tabs');
      if(!tabs) return;
      const btn = document.createElement('button');
      btn.className = 'ai-bs-tab';
      btn.id = 'ai-sched-tab';
      btn.textContent = '📅 לוז';
      btn.style.cssText = 'background:rgba(45,212,191,.1);border-color:rgba(45,212,191,.3);color:var(--teal)';
      btn.onclick = ()=>{ closeAiBS(); setTimeout(openScheduleModal, 200); };
      tabs.appendChild(btn);
    }, 250);
  };
}

setTimeout(()=>{
  _setSchedNowTime();
  _addScheduleBtnToChat();
  _patchAiBS();
}, 1000);

(function waitForChat(){
  const check = setInterval(()=>{
    const hdr = document.querySelector('#pg-chat > div:first-child');
    if(hdr){ _addScheduleBtnToChat(); clearInterval(check); }
  }, 500);
  setTimeout(()=>clearInterval(check), 15000);
})();
