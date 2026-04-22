/* ═══════════════════════════════════════════════════════
   ai-schedule.js  —  לוז יומי חכם עם AI
   ──────────────────────────────────────────────────────
   תלויות: S, save, toast, _callClaude, getTasks,
   getTasksForDay, getDayType, _baseId, getTaskDisplayLevel,
   _getDefaultTasks, bonusPts, calcAvail, REWARDS,
   getEffectiveRewards, S.taskIndivLevel
   ═══════════════════════════════════════════════════════ */

/* ── הוספת כפתור "סדר לי יום" לממשק הצ'אט ── */
(function injectScheduleButton(){
  const orig = window.chatClear;
  window.chatClear = function(){
    if(orig) orig();
    _maybeAddScheduleBtn();
  };
  setTimeout(_maybeAddScheduleBtn, 800);
})();

function _maybeAddScheduleBtn(){
  if(document.getElementById('sched-fab')) return;
  const header = document.querySelector('#pg-chat > div:first-child');
  if(!header) return;
  const btn = document.createElement('button');
  btn.id = 'sched-fab';
  btn.title = 'סדר לי יום';
  btn.innerHTML = '📅 לוז יומי';
  btn.style.cssText = `
    padding:6px 14px;
    background:rgba(45,212,191,.12);
    border:1px solid rgba(45,212,191,.35);
    border-radius:99px;
    font-size:11px;font-weight:800;
    color:var(--teal);
    cursor:pointer;
    font-family:'Heebo',sans-serif;
    white-space:nowrap;
    flex-shrink:0;
  `;
  btn.onclick = openScheduleModal;
  header.appendChild(btn);
}

/* ── מודל לוז יומי ── */
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

    <div style="background:rgba(45,212,191,.07);border:1px solid rgba(45,212,191,.2);border-radius:10px;padding:12px 14px;margin-bottom:14px;font-size:12px;color:var(--txt2);line-height:1.65">
      ⏰ ה-AI יסדר את שאר היום שלך לפי השעה, ויראה איפה יש זמן פנוי ומה עדיין נשאר לעשות.
    </div>

    <!-- שעה נוכחית -->
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
      <label style="font-size:11px;font-weight:800;color:var(--txt3);text-transform:uppercase;letter-spacing:.7px;white-space:nowrap">⏱ שעה עכשיו</label>
      <input type="time" id="sched-now-time"
        style="flex:1;background:var(--bg3);border:1px solid var(--brd2);border-radius:9px;color:var(--txt);font-family:'Heebo',sans-serif;font-size:13px;padding:8px 11px;outline:none">
      <label style="font-size:11px;font-weight:800;color:var(--txt3);text-transform:uppercase;letter-spacing:.7px;white-space:nowrap">🌙 עד</label>
      <input type="time" id="sched-end-time" value="23:00"
        style="flex:1;background:var(--bg3);border:1px solid var(--brd2);border-radius:9px;color:var(--txt);font-family:'Heebo',sans-serif;font-size:13px;padding:8px 11px;outline:none">
    </div>

    <!-- משימות נוספות -->
    <div style="margin-bottom:10px">
      <div style="font-size:11px;font-weight:800;color:var(--txt3);text-transform:uppercase;letter-spacing:.7px;margin-bottom:5px">✏️ משימות נוספות היום (אופציונלי)</div>
      <textarea id="sched-extra-tasks" rows="3" placeholder="למשל: פגישה עם ליברמן ב-15:00 (שעה), לאסוף ילדים ב-16:30 (20 דקות), קניות סופר..."
        style="width:100%;background:var(--bg3);border:1px solid var(--brd2);border-radius:10px;color:var(--txt);font-family:'Heebo',sans-serif;font-size:12px;padding:10px 12px;outline:none;resize:none;box-sizing:border-box;line-height:1.55"></textarea>
    </div>

    <!-- כפתור יצירה -->
    <button id="sched-gen-btn" onclick="generateSchedule()"
      style="width:100%;padding:13px;background:linear-gradient(135deg,var(--teal),#0a8a70);color:#fff;border-radius:var(--r-sm);font-size:13px;font-weight:900;cursor:pointer;border:none;font-family:'Heebo',sans-serif;box-sizing:border-box;margin-bottom:10px">
      ✨ סדר לי את היום
    </button>

    <!-- תוצאה -->
    <div id="sched-result" style="margin-top:4px"></div>
  </div>`;
  document.body.appendChild(el);

  // ── הגדר שעה נוכחית אוטומטית ──
  const now = new Date();
  const hh = String(now.getHours()).padStart(2,'0');
  const mm = String(now.getMinutes()).padStart(2,'0');
  const inp = document.getElementById('sched-now-time');
  if(inp) inp.value = hh + ':' + mm;
})();

function openScheduleModal(){
  // עדכן שעה
  const now = new Date();
  const hh = String(now.getHours()).padStart(2,'0');
  const mm = String(now.getMinutes()).padStart(2,'0');
  const inp = document.getElementById('sched-now-time');
  if(inp) inp.value = hh + ':' + mm;
  // נקה תוצאה קודמת
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

/* ── בניית הקשר ללוז ── */
function _buildScheduleContext(){
  const dayType = getDayType(new Date());
  const allTasks = getTasksForDay(S.level, dayType);

  // הוסף שלב אישי לכל משימה
  const tasks = allTasks.map(t => {
    const bid = _baseId(t.id);
    const indivLvl = (S.taskIndivLevel && S.taskIndivLevel[bid]) || S.level;
    const altTasks = _getDefaultTasks(indivLvl);
    const alt = altTasks.find(x => _baseId(x.id) === bid);
    return {
      ...t,
      _text: alt ? alt.text : t.text,
      _pts: alt ? bonusPts(alt.pts) : bonusPts(t.pts),
      _indivLvl: indivLvl,
      _done: !!S.done[t.id]
    };
  });

  const doneTasks = tasks.filter(t => t._done);
  const pendingTasks = tasks.filter(t => !t._done);

  // ── הוסף משימות חד-פעמיות וסטריק שטרם בוצעו ──
  const today = new Date().toDateString();
  const oneTime = (S.oneTimeTasks||[]).filter(t=>{
    const days=t.days||['weekday'];
    if(!days.includes(dayType)) return false;
    const maxReps=t.maxReps||1;
    const doneCount=t.doneCount||(t.doneDate?1:0);
    return doneCount < maxReps;
  }).map(t=>({id:t.id,_text:t.text,_pts:t.pts,_done:false,_type:'onetime',time:t.time||null,slot:t.slot}));

  const streakT = (S.streakTasks||[]).filter(t=>{
    const days=t.days||['weekday'];
    return days.includes(dayType) && !(t.streakDays&&t.streakDays[today]);
  }).map(t=>({id:t.id,_text:t.text,_pts:20,_done:false,_type:'streak',time:t.time||null,slot:t.slot}));

  const allPending = [...pendingTasks, ...oneTime, ...streakT];

  // ── פרסים זמינים ──
  const avail = calcAvail();
  const rewards = getEffectiveRewards().flatMap(c=>c.items)
    .filter(r => !S.redeemed.includes(r.id) && avail >= r.pts && (!r.minLevel || S.level >= r.minLevel))
    .sort((a,b)=>a.pts-b.pts)
    .slice(0, 5);

  return {
    level: S.level,
    streak: S.streak,
    totalPts: avail,
    doneTasks: doneTasks.map(t=>t._text),
    pendingTasks: allPending.map(t=>({
      text: t._text,
      pts: t._pts,
      slot: t.slot,
      time: t.time || null,
      indivLevel: t._indivLvl || S.level
    })),
    doneCount: doneTasks.length,
    totalCount: tasks.length,
    pct: tasks.length ? Math.round(doneTasks.length/tasks.length*100) : 0,
    availableRewards: rewards.map(r=>({title:r.title, pts:r.pts, emoji:r.emoji||'🎁'})),
    gracesRemaining: typeof totalGraceAvailable === 'function' ? totalGraceAvailable() : 0,
    focusDaysRemaining: typeof focusDaysUsedThisMonth === 'function' ? (3 - focusDaysUsedThisMonth()) : 0,
    dayType
  };
}

/* ── יצירת הלוז ── */
async function generateSchedule(){
  const nowTime = document.getElementById('sched-now-time')?.value || '12:00';
  const endTime = document.getElementById('sched-end-time')?.value || '23:00';
  const extraTasks = (document.getElementById('sched-extra-tasks')?.value || '').trim();
  const ctx = _buildScheduleContext();
  const btn = document.getElementById('sched-gen-btn');
  const res = document.getElementById('sched-result');

  btn.disabled = true;
  btn.textContent = '⏳ מסדר את היום...';
  res.innerHTML = `<div style="text-align:center;padding:20px;color:var(--txt3)">
    <div style="display:inline-flex;gap:5px;align-items:center;margin-bottom:6px">
      <span style="width:6px;height:6px;border-radius:50%;background:var(--teal);animation:jdot 1.2s ease-in-out infinite"></span>
      <span style="width:6px;height:6px;border-radius:50%;background:var(--teal);animation:jdot 1.2s ease-in-out .2s infinite"></span>
      <span style="width:6px;height:6px;border-radius:50%;background:var(--teal);animation:jdot 1.2s ease-in-out .4s infinite"></span>
    </div>
    <div style="font-size:12px">מחשב לוז...</div>
  </div>`;

  // חישוב זמן משוער לכל משימה
  const SLOT_DURATION = { 0: 15, 1: 20, 2: 20, 3: 15 };

  const taskList = ctx.pendingTasks.map(t => {
    const dur = SLOT_DURATION[t.slot] || 15;
    return `  • ${t.text} [שלב אישי: ${t.indivLevel}, +${t.pts} נק', ~${dur} דק'${t.time ? ', מוגדר ל-'+t.time : ''}]`;
  }).join('\n');

  const prompt = `אתה עוזר לניהול יום אישי עבור משתמש באפליקציית שיפור עצמי.

=== מצב המשתמש ===
שלב כללי: ${ctx.level}/15 | רצף: ${ctx.streak} ימים | נקודות זמינות: ${ctx.totalPts}
הושלמו: ${ctx.doneCount}/${ctx.totalCount} משימות (${ctx.pct}%)
שעה נוכחית: ${nowTime}
סוף היום: ${endTime}

=== משימות שכבר בוצעו ===
${ctx.doneTasks.length ? ctx.doneTasks.map(t=>'  ✓ '+t).join('\n') : '  אין עדיין'}

=== משימות שנותרו לביצוע ===
${taskList || '  הכל בוצע!'}

${extraTasks ? `=== משימות/אירועים נוספים שהמשתמש הוסיף ===\n${extraTasks}` : ''}

=== פרסים זמינים (עם הנקודות הנוכחיות) ===
${ctx.availableRewards.length
  ? ctx.availableRewards.map(r=>`  ${r.emoji} ${r.title} — ${r.pts} נק'`).join('\n')
  : '  אין עדיין מספיק נקודות לפרסים'}

ימי חסד שנותרו: ${ctx.gracesRemaining}
ימי עשייה שנותרו: ${ctx.focusDaysRemaining}

=== המשימה שלך ===
בנה לוח זמנים מפורט ועשי לשאר היום, מ-${nowTime} עד ${endTime}.

חוקים:
1. סדר לפי שעה מדויקת. תן זמן ריאלי לכל משימה (10-45 דק').
2. אם יש משימות עם שעה קבועה (כמו מנחה 13:30) — שמור אותן בשעה הנכונה.
3. חשב "זמן משימות סה"כ" ו"זמן פנוי סה"כ" (בדיוק בדקות).
4. אם אין מספיק זמן לכל המשימות — ציין מה לוותר עליו ועל מה להתמקד כדי להגיע ל-80%.
5. בסוף: כותרת "💡 הצעות לזמן פנוי" עם 2-3 רעיונות מותאמים.
6. אם הזמן הפנוי קטן מ-45 דק' — שאל: האם כדאי לנצל יום חסד (${ctx.gracesRemaining} נותרו) או יום עשייה (${ctx.focusDaysRemaining} נותרו)?
7. אם יש נקודות — המלץ על פרס אחד שמתאים למה שנותר היום.

פורמט הפלט (עברית, קצר, בלי "הנה" בפתיחה):

**📋 לוז יום — ${nowTime}–${endTime}**

| שעה | משימה | זמן |
|-----|-------|-----|
...

**⏱ סיכום זמנים:**
• משימות: X דקות
• זמן פנוי: Y דקות
• צפי להגיע ל-80%: כן/לא

**💡 הצעות לזמן פנוי:**
...

**🎁 פרס מומלץ:**
...

**🛡️ / 🎯 ייעוץ (אם רלוונטי):**
...`;

  const raw = await _callClaude(prompt);
  btn.disabled = false;
  btn.textContent = '✨ סדר לי את היום';

  if(!raw){
    res.innerHTML = `<div style="color:var(--red);padding:10px;text-align:center">⚠️ שגיאה — בדוק שיש מפתח API</div>`;
    return;
  }

  // המרת markdown בסיסי ל-HTML
  const html = _markdownToHtml(raw);
  res.innerHTML = `<div style="background:rgba(45,212,191,.06);border:1px solid rgba(45,212,191,.2);border-radius:12px;padding:16px;font-size:12px;color:var(--txt);line-height:1.75">
    ${html}
    <div style="margin-top:14px;display:flex;gap:8px">
      <button onclick="sendScheduleToChat()" style="flex:1;padding:9px;background:rgba(155,126,248,.12);border:1px solid rgba(155,126,248,.3);border-radius:9px;font-size:11px;font-weight:800;color:var(--purple);cursor:pointer;font-family:'Heebo',sans-serif">
        💬 שלח לצ'אט לשאלות
      </button>
      <button onclick="generateSchedule()" style="flex:1;padding:9px;background:var(--sf3);border:1px solid var(--brd2);border-radius:9px;font-size:11px;font-weight:800;color:var(--txt2);cursor:pointer;font-family:'Heebo',sans-serif">
        ↻ ייצר מחדש
      </button>
    </div>
  </div>`;

  // שמור את הלוז האחרון בזיכרון
  window._lastScheduleRaw = raw;
}

/* ── שליחת הלוז לצ'אט ── */
function sendScheduleToChat(){
  if(!window._lastScheduleRaw) return;
  closeScheduleModal();
  // המתן שהצ'אט יהיה גלוי
  setTimeout(()=>{
    if(typeof nav === 'function') nav('chat');
    setTimeout(()=>{
      const input = document.getElementById('chat-input');
      if(input){
        input.value = 'יש לי שאלה על הלוז שיצרת';
        // הוסף את הלוז להיסטוריית הצ'אט כ"הקשר"
        if(window._chatHistory){
          _chatHistory.push({
            role:'assistant',
            content: `יצרתי לך לוז יומי:\n\n${window._lastScheduleRaw}`
          });
        }
      }
    }, 300);
  }, 200);
}

/* ── המרת markdown בסיסי ── */
function _markdownToHtml(md){
  return md
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^#{1,3}\s(.+)$/gm, '<div style="font-size:13px;font-weight:800;color:var(--teal);margin-top:12px;margin-bottom:6px">$1</div>')
    .replace(/^\|(.+)\|$/gm, row => {
      if(row.match(/^[\|\s\-:]+$/)) return '';
      const cells = row.split('|').filter(c=>c.trim());
      return '<div style="display:flex;gap:6px;border-bottom:1px solid var(--brd);padding:5px 2px">' +
        cells.map((c,i) => `<div style="flex:${i===0?'0 0 72px':i===1?'1':'0 0 48px'};font-size:11px;color:${i===0?'var(--teal)':i===2?'var(--txt3)':'var(--txt)'};${i===0?'font-weight:800':''}">${c.trim()}</div>`).join('') +
        '</div>';
    })
    .replace(/^• (.+)$/gm, '<div style="display:flex;gap:6px;padding:2px 0"><span style="color:var(--teal);flex-shrink:0">•</span><span>$1</span></div>')
    .replace(/^- (.+)$/gm, '<div style="display:flex;gap:6px;padding:2px 0"><span style="color:var(--txt3);flex-shrink:0">–</span><span>$1</span></div>')
    .replace(/\n{2,}/g, '<div style="height:8px"></div>');
}

/* ── הוסף כפתור גם בתפריט ה-AI ── */
(function patchAIBottomsheet(){
  const orig = window.openAiBS;
  if(!orig) return;
  window.openAiBS = function(){
    orig();
    setTimeout(()=>{
      if(document.getElementById('ai-sched-quick-btn')) return;
      const tabs = document.getElementById('ai-bs-tabs');
      if(!tabs) return;
      const btn = document.createElement('button');
      btn.className = 'ai-bs-tab';
      btn.id = 'ai-sched-quick-btn';
      btn.style.cssText = 'background:rgba(45,212,191,.12);border-color:rgba(45,212,191,.35);color:var(--teal)';
      btn.textContent = '📅 לוז';
      btn.onclick = () => { closeAiBS(); setTimeout(openScheduleModal, 200); };
      tabs.appendChild(btn);
    }, 300);
  };
})();
