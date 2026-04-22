/* ═══════════════════════════════════════════════════════
   ai-schedule.js  —  לוז יומי חכם עם AI (v3)
   ── שיפורים: לוז קבוע שמתעדכן כל בוקר, שמירת לוז, תצוגה מורחבת ──
   ── כולל תיקון "עוגני זמן" ודיוק כרונולוגי למנוע ה-AI ──
   ═══════════════════════════════════════════════════════ */

/* ══════════════ SCHEDULE STORAGE ══════════════ */

const SCHED_SK = 'aliyah_daily_schedule_v1';

function _loadScheduleStore() {
  try { const r = localStorage.getItem(SCHED_SK); if (r) return JSON.parse(r); } catch(e) {}
  return {};
}

function _saveScheduleStore(store) {
  try { localStorage.setItem(SCHED_SK, JSON.stringify(store)); } catch(e) {}
}

function _getTodayScheduleKey() {
  return new Date().toDateString();
}

/** מחזיר את הלוז השמור להיום (null אם אין) */
function getTodaySavedSchedule() {
  const store = _loadScheduleStore();
  return store[_getTodayScheduleKey()] || null;
}

/** שומר לוז להיום */
function saveTodaySchedule(raw) {
  const store = _loadScheduleStore();
  store[_getTodayScheduleKey()] = {
    raw,
    savedAt: new Date().toISOString(),
    level: S.level,
    streak: S.streak
  };
  // שמור רק 7 ימים אחרונים
  const keys = Object.keys(store).sort((a, b) => new Date(b) - new Date(a));
  if (keys.length > 7) keys.slice(7).forEach(k => delete store[k]);
  _saveScheduleStore(store);
}

/** מוחק את הלוז של היום */
function clearTodaySchedule() {
  const store = _loadScheduleStore();
  delete store[_getTodayScheduleKey()];
  _saveScheduleStore(store);
}

/* ══════════════ MODAL ══════════════ */

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
      ⏰ ה-AI רואה מה בוצע ומה נשאר, ובונה לוז ריאלי לשאר היום. משימות עם שעה קבועה יישמרו בדיוק בזמנן.
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

/* ══════════════ DAILY SCHEDULE WIDGET (דף היום) ══════════════ */

function renderDailyScheduleWidget() {
  let wrap = document.getElementById('daily-schedule-widget');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'daily-schedule-widget';
    const tasksSection = document.getElementById('tasks-section');
    if (tasksSection) {
      tasksSection.parentNode.insertBefore(wrap, tasksSection);
    } else {
      const app = document.getElementById('app');
      if (app) app.appendChild(wrap);
    }
  }

  const saved = getTodaySavedSchedule();

  if (!saved) {
    wrap.innerHTML = `
      <div id="dsw-collapsed" style="margin-bottom:14px">
        <button onclick="openScheduleModal()"
          style="width:100%;display:flex;align-items:center;justify-content:center;gap:8px;
          padding:11px 16px;background:var(--surface);border:1px dashed rgba(45,212,191,.35);
          border-radius:var(--r-sm);font-size:12px;font-weight:800;color:var(--teal);
          cursor:pointer;font-family:'Heebo',sans-serif;transition:all .2s">
          📅 צור לוז יומי חכם
        </button>
      </div>`;
    return;
  }

  wrap.innerHTML = _buildScheduleWidgetHtml(saved);
}

function _buildScheduleWidgetHtml(saved) {
  const raw = saved.raw || '';
  const savedTime = saved.savedAt ? new Date(saved.savedAt) : null;
  const timeLabel = savedTime
    ? savedTime.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
    : '';

  const { taskLines, summaryLines } = _parseScheduleRaw(raw);
  const now = new Date();

  const taskRowsHtml = taskLines.map((line, i) => {
    const parts = line.trim().split('•').map(p => p.trim());
    const timeStr = parts[0] || '';
    const taskName = parts[1] || '';
    const dur = parts[2] || '';

    let isPast = false, isCurrent = false;
    const timeParsed = _parseTimeStr(timeStr);
    if (timeParsed) {
      const taskDate = new Date();
      taskDate.setHours(timeParsed.h, timeParsed.m, 0, 0);
      const nextLine = taskLines[i + 1];
      let nextDate = null;
      if (nextLine) {
        const np = nextLine.trim().split('•')[0].trim();
        const nt = _parseTimeStr(np);
        if (nt) { nextDate = new Date(); nextDate.setHours(nt.h, nt.m, 0, 0); }
      }
      isPast = nextDate ? now > nextDate : now > new Date(taskDate.getTime() + 60*60*1000);
      isCurrent = !isPast && now >= taskDate;
    }

    const isFixed = /מנחה|מעריב|חת"ת|תפילה|רמב"ם|שחרית|מקווה/.test(taskName);
    const accentStyle = isFixed ? 'border-right:3px solid rgba(45,212,191,.6)' : '';
    const pastStyle = isPast ? 'opacity:0.42' : '';
    const currentBg = isCurrent ? 'background:rgba(45,212,191,.07)' : (i % 2 === 0 ? 'background:var(--surface)' : 'background:var(--bg3)');
    const currentDot = isCurrent ? '<span style="width:7px;height:7px;border-radius:50%;background:var(--teal);display:inline-block;margin-left:5px;animation:pulse-teal 1.5s infinite"></span>' : '';

    return `<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;${currentBg};${accentStyle};${pastStyle};border-bottom:1px solid var(--brd)">
      <div style="font-size:11px;font-weight:800;color:${isCurrent?'var(--teal)':'var(--txt3)'};min-width:44px;flex-shrink:0;display:flex;align-items:center">${timeStr}${currentDot}</div>
      <div style="flex:1;font-size:12px;color:${isPast?'var(--txt3)':'var(--txt)'};line-height:1.3;${isPast?'text-decoration:line-through;':''}">${taskName}</div>
      <div style="font-size:11px;color:var(--txt3);flex-shrink:0">${dur}</div>
    </div>`;
  }).join('');

  const summaryHtml = summaryLines
    .filter(l => l.trim())
    .map(l => {
      const icon = l.match(/^(📊|💡|🎁|🛡️|🎯)/)?.[0] || '';
      const text = l.replace(/^(📊|💡|🎁|🛡️|🎯)\s*/, '');
      if (!icon) return `<div style="font-size:11px;color:var(--txt2);line-height:1.6;padding:2px 0">${text}</div>`;
      const colors = { '📊': 'var(--blue)', '💡': 'var(--gold)', '🎁': 'var(--green)', '🛡️': 'var(--gold)', '🎯': 'var(--teal)' };
      const bgs   = { '📊': 'rgba(91,141,248,.08)', '💡': 'rgba(240,192,64,.08)', '🎁': 'rgba(56,214,138,.08)', '🛡️': 'rgba(240,192,64,.08)', '🎯': 'rgba(45,212,191,.08)' };
      return `<div style="display:flex;gap:8px;padding:6px 10px;background:${bgs[icon]||'var(--bg3)'};border-radius:8px;margin-bottom:4px;font-size:11px;color:${colors[icon]||'var(--txt2)'}">
        <span style="flex-shrink:0">${icon}</span><span>${text}</span>
      </div>`;
    }).join('');

  const doneCount = getTasksForDay(S.level, getDayType(new Date())).filter(t => S.done[t.id]).length;
  const totalCount = getTasksForDay(S.level, getDayType(new Date())).length;
  const pct = totalCount ? Math.round(doneCount / totalCount * 100) : 0;

  return `
    <style>
      @keyframes pulse-teal {
        0%,100%{opacity:1;transform:scale(1)}
        50%{opacity:.5;transform:scale(1.3)}
      }
    </style>
    <div id="daily-schedule-widget-inner" style="margin-bottom:14px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <div style="display:flex;align-items:center;gap:7px">
          <span style="font-size:14px;font-weight:900;color:var(--teal)">📅 הלוז שלי היום</span>
          <span style="font-size:10px;color:var(--txt3);font-weight:600">${timeLabel ? 'נוצר ב-'+timeLabel : ''}</span>
        </div>
        <div style="display:flex;gap:5px">
          <button onclick="openScheduleModal()"
            title="עדכן לוז"
            style="padding:4px 10px;background:rgba(45,212,191,.1);border:1px solid rgba(45,212,191,.3);border-radius:7px;font-size:10px;font-weight:800;color:var(--teal);cursor:pointer;font-family:'Heebo',sans-serif">
            ↻ עדכן
          </button>
          <button onclick="_clearAndRerenderSchedule()"
            title="מחק לוז"
            style="padding:4px 8px;background:var(--sf3);border:1px solid var(--brd2);border-radius:7px;font-size:10px;color:var(--txt3);cursor:pointer;font-family:'Heebo',sans-serif">
            ✕
          </button>
        </div>
      </div>

      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;padding:7px 10px;background:var(--surface);border:1px solid var(--brd);border-radius:9px">
        <div style="height:5px;flex:1;background:var(--sf2);border-radius:99px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:${pct>=80?'var(--green)':'var(--teal)'};border-radius:99px;transition:width .6s"></div>
        </div>
        <span style="font-size:11px;font-weight:800;color:${pct>=80?'var(--green)':'var(--teal)'};white-space:nowrap">${doneCount}/${totalCount} (${pct}%)</span>
      </div>

      <div id="dsw-toggle-wrap">
        <div id="dsw-task-rows" style="border:1px solid var(--brd);border-radius:10px;overflow:hidden;margin-bottom:8px">
          ${taskRowsHtml || '<div style="padding:12px;font-size:12px;color:var(--txt3);text-align:center">אין שורות לוז</div>'}
        </div>

        ${summaryHtml ? `<div id="dsw-summary" style="margin-bottom:8px">${summaryHtml}</div>` : ''}
      </div>

      <button onclick="_toggleScheduleWidget()" id="dsw-toggle-btn"
        style="width:100%;padding:5px;background:var(--sf2);border:1px solid var(--brd);border-radius:7px;font-size:10px;font-weight:700;color:var(--txt3);cursor:pointer;font-family:'Heebo',sans-serif">
        ▲ כווץ לוז
      </button>
    </div>`;
}

let _schedWidgetCollapsed = false;
function _toggleScheduleWidget() {
  _schedWidgetCollapsed = !_schedWidgetCollapsed;
  const wrap = document.getElementById('dsw-toggle-wrap');
  const btn  = document.getElementById('dsw-toggle-btn');
  if (wrap) wrap.style.display = _schedWidgetCollapsed ? 'none' : '';
  if (btn)  btn.textContent = _schedWidgetCollapsed ? '▼ הצג לוז' : '▲ כווץ לוז';
}

function _clearAndRerenderSchedule() {
  clearTodaySchedule();
  window._lastScheduleRaw = null;
  renderDailyScheduleWidget();
  if (typeof toast === 'function') toast('🗑 הלוז נמחק');
}

/* ══════════════ PARSE UTILS ══════════════ */

function _parseScheduleRaw(raw) {
  const lines = (raw || '').split('\n');
  const isTaskLine = l => /^\d{1,2}:\d{2}/.test(l.trim());
  return {
    taskLines: lines.filter(isTaskLine),
    summaryLines: lines.filter(l => !isTaskLine(l) && l.trim() && !l.includes('לוז') && !/^⏱/.test(l.trim()))
  };
}

function _parseTimeStr(str) {
  const m = (str || '').match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return { h: parseInt(m[1]), m: parseInt(m[2]) };
}

/* ══════════════ SCHEDULE MODAL LOGIC ══════════════ */

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

  const saved = getTodaySavedSchedule();
  if (saved && res) {
    res.innerHTML = _buildSavedScheduleInModal(saved.raw);
  } else if (res) {
    res.innerHTML = '';
  }

  document.getElementById('modal-schedule').classList.add('on');
  document.body.style.overflow = 'hidden';
}

function closeScheduleModal(){
  document.getElementById('modal-schedule').classList.remove('on');
  if(!document.querySelector('.bs-bg.on,.modal-bg.on'))
    document.body.style.overflow = '';
}

function _buildSavedScheduleInModal(raw) {
  return `<div style="background:rgba(45,212,191,.06);border:1px solid rgba(45,212,191,.2);border-radius:10px;padding:11px 13px;margin-bottom:8px">
    <div style="font-size:11px;font-weight:800;color:var(--teal);margin-bottom:8px">✅ לוז נוכחי (לחץ "סדר לי את היום" לעדכון)</div>
    ${_renderScheduleResultHtml(raw)}
  </div>`;
}

/* ══════════════ GENERATE + SAVE ══════════════ */

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
    // הוספת שעות משימות שבוצעו, אם קיימות (כדי שה-AI יבין מתי זה קרה)
    doneTasks: done.map(t => t.time ? `${t._text} (בוצע ב-${t.time})` : t._text),
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
  if(availMin <= 0){ if(typeof toast==='function') toast('שעת הסיום חייבת להיות אחרי השעה הנוכחית'); return; }

  btn.disabled = true;
  btn.textContent = '⏳ מסדר...';
  res.innerHTML = `<div style="text-align:center;padding:20px;color:var(--txt3);font-size:12px">⏳ בונה לוז...</div>`;

  const SLOT_DUR = { 0:10, 1:20, 2:20, 3:15 };
  
  // חשיפת השעה הקבועה בצורה מפורשת עבור ה-AI
  const pendingLines = ctx.pendingTasks.map(t => {
    const dur = SLOT_DUR[t.slot] || 15;
    const timeNote = t.time ? ` [שעה קבועה: ${t.time}]` : ' [זמן גמיש]';
    return `• ${t.text}${timeNote} [~${dur}דק, +${t.pts}נק]`;
  }).join('\n');

  const extraLines = [
    ...ctx.otPending.map(t=>`• ${t} [חד-פעמית ~15דק]`),
    ...ctx.strkPending.map(t=>`• ${t} [עקביות ~10דק]`),
    ...(extra ? extra.split('\n').filter(Boolean).map(l=>`• ${l}`) : [])
  ].join('\n');

  // פרומפט משודרג וחזק - לא מאפשר ל-AI לדלג על שעות מוגדרות
  const prompt = `אתה עוזר ניהול זמן אישי. עליך לסדר לו"ז להמשך היום בצורה כרונולוגית והגיונית.

מצב נוכחי: שלב ${ctx.level}, ${ctx.doneCount}/${ctx.totalCount} משימות כבר בוצעו.
בוצע כבר היום: ${ctx.doneTasks.slice(0,6).join(' | ')||'כלום'}

משימות שנותרו לשיבוץ (כולל עוגני זמן קריטיים):
${pendingLines||'הכל בוצע!'}

${extraLines ? 'נוספו לבקשת המשתמש:\n'+extraLines : ''}

מסגרת זמן לשיבוץ: ${nowTime} עד ${endTime} (${availMin} דקות).

⚠️ חוקי ברזל קריטיים:
1. עוגני זמן: משימה שיש לה "[שעה קבועה: XX:XX]" חייבת להיות משובצת *בדיוק* בשעה שלה! אל תזיז אותה לא משנה מה (למשל: אם ההוראה היא 22:15, שים אותה ב-22:15).
2. זמן גמיש: משימות עם "[זמן גמיש]" סדר בחללים הפנויים שבין עוגני הזמן, החל מהשעה ${nowTime}.
3. היגיון: אל תצמיד את כל המשימות ברצף רובוטי אם יש המון זמן פנוי. פזר אותן בצורה הגיונית על פני היום.
4. סדר כרונולוגי: סדר תמיד מהשעה המוקדמת (${nowTime}) לשעה המאוחרת (${endTime}).

החזר את הלו"ז בדיוק בפורמט הזה:
כותרת: ⏱ לוז ${nowTime}–${endTime}

[שעה] • [שם משימה] • [דקות]

לאחר הלוז, השאר שורה ריקה אחת, ואז כתוב:
📊 משימות: Xדק | פנוי: Yדק | 80% — כן/לא
💡 זמן פנוי: [1-2 רעיונות קצרים]
🎁 פרס: [המלצה מתוך: ${ctx.rewardsList||'משהו קטן'}]
${ctx.gracesRemaining>0 || ctx.focusDaysRemaining>0 ? '🛡️ ייעוץ: [טיפ האם שווה לקחת יום חסד/עשייה]' : ''}

רק הלוז והסיכום. בלי שום הקדמה מילולית ("הנה הלוז").`;

  const raw = await _callClaude(prompt);
  btn.disabled = false;
  btn.textContent = 'סדר לי את היום';

  if(!raw){
    res.innerHTML = `<div style="color:var(--red);padding:10px;text-align:center;font-size:12px">שגיאה — מנוע ה-AI לא החזיר תשובה.</div>`;
    return;
  }

  window._lastScheduleRaw = raw;
  _renderScheduleResultInModal(res, raw);
}

function _renderScheduleResultInModal(container, raw){
  const html = _renderScheduleResultHtml(raw);

  container.innerHTML = `
    <div style="background:rgba(45,212,191,.05);border:1px solid rgba(45,212,191,.2);border-radius:12px;padding:14px">
      ${html}
      <div style="display:flex;gap:8px;margin-top:12px">
        <button onclick="_saveAndShowSchedule()" 
          style="flex:2;padding:10px;background:linear-gradient(135deg,var(--teal),#0a8a70);color:#fff;border-radius:9px;font-size:12px;font-weight:800;cursor:pointer;font-family:'Heebo',sans-serif;border:none">
          💾 שמור לוז ב"היום"
        </button>
        <button onclick="sendScheduleToChat()" 
          style="flex:1;padding:10px;background:rgba(155,126,248,.12);border:1px solid rgba(155,126,248,.3);border-radius:9px;font-size:11px;font-weight:800;color:var(--purple);cursor:pointer;font-family:'Heebo',sans-serif">
          💬 שאל
        </button>
        <button onclick="generateSchedule()" 
          style="flex:1;padding:10px;background:var(--sf3);border:1px solid var(--brd2);border-radius:9px;font-size:11px;font-weight:800;color:var(--txt2);cursor:pointer;font-family:'Heebo',sans-serif">
          ↻ בנה מחדש
        </button>
      </div>
    </div>`;
}

function _renderScheduleResultHtml(raw) {
  const lines = raw.split('\n');
  const isTaskLine = l => /^\d{1,2}:\d{2}/.test(l.trim());
  const taskLines = lines.filter(isTaskLine);
  const otherLines = lines.filter(l => !isTaskLine(l));

  let schedHtml = '';
  if(taskLines.length){
    schedHtml += `<div style="border:1px solid var(--brd);border-radius:10px;overflow:hidden;margin-bottom:8px">`;
    taskLines.forEach((line, i) => {
      const parts = line.trim().split('•').map(p=>p.trim());
      const timeStr = parts[0] || '';
      const taskName = parts[1] || '';
      const dur = parts[2] || '';
      const isFixed = /מנחה|מעריב|חת"ת|תפילה|רמב"ם/.test(taskName);
      const accent = isFixed ? 'border-right:3px solid rgba(45,212,191,.6)' : '';
      schedHtml += `
        <div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:${i%2===0?'var(--surface)':'var(--bg3)'};${accent};border-bottom:1px solid var(--brd)">
          <div style="font-size:11px;font-weight:800;color:var(--teal);min-width:44px;flex-shrink:0">${timeStr}</div>
          <div style="flex:1;font-size:12px;color:var(--txt);line-height:1.3">${taskName}</div>
          <div style="font-size:11px;color:var(--txt3);flex-shrink:0">${dur}</div>
        </div>`;
    });
    schedHtml += `</div>`;
  }

  const summaryRaw = otherLines
    .filter(l => l.trim() && !l.includes('לוז') && !/^⏱/.test(l.trim()))
    .join('\n');

  const summaryHtml = summaryRaw
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/^(📊|💡|🎁|🛡️|🎯)(.+)$/gm,
      '<div style="display:flex;gap:6px;padding:4px 0;font-size:11px"><span style="flex-shrink:0">$1</span><span>$2</span></div>')
    .replace(/\n{2,}/g,'<div style="height:4px"></div>');

  return `${schedHtml}<div style="color:var(--txt);line-height:1.75">${summaryHtml}</div>`;
}

function _saveAndShowSchedule() {
  if (!window._lastScheduleRaw) return;
  saveTodaySchedule(window._lastScheduleRaw);
  closeScheduleModal();
  renderDailyScheduleWidget();
  if (typeof toast === 'function') toast('✅ הלוז נשמר ומוצג בדף היום!');
  if (navigator.vibrate) navigator.vibrate([30, 10, 30]);
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

/* ══════════════ HOOK INTO EXISTING RENDER ══════════════ */

(function _patchRenderToday() {
  let _attempts = 0;
  const _interval = setInterval(() => {
    _attempts++;
    if (typeof renderToday === 'function') {
      clearInterval(_interval);
      const _origRenderToday = renderToday;
      window.renderToday = function() {
        _origRenderToday.apply(this, arguments);
        setTimeout(renderDailyScheduleWidget, 50);
      };
      renderDailyScheduleWidget();
    }
    if (_attempts > 100) clearInterval(_interval);
  }, 100);
})();

/* ══════════════ AI FAB & BOTTOMSHEET INTEGRATION ══════════════ */

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