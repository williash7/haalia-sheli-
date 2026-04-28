/* ══════════════════════════════════════════════════════════════
   calendar-journal.js — יומן לוח שנה + סנכרון Google Calendar
   
   מה הקובץ הזה עושה:
   1. מוסיף לוח שנה חודשי בתוך דף היומן
   2. לוחצים על יום → רואים את כל המשימות של אותו יום לפי שעות
   3. ניתן לסמן/לבטל משימות של היום ישירות מהלוח
   4. כפתור "📅 Google" מאפשר ייצוא משימות ל-Google Calendar
   
   איך להוסיף לפרויקט:
   1. שמור קובץ זה בתיקיית הפרויקט כ-calendar-journal.js
   2. הוסף לתגי <head> ב-index.html, לפני </head>:
      <script src="calendar-journal.js" defer></script>
══════════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════════════════
   חלק 1: הגדרות בסיסיות
════════════════════════════════════════════════════════ */

// איזה חודש מוצג כרגע בלוח השנה
let _cjMonth = new Date();

// איזה יום נבחר כרגע
let _cjSelectedDay = null;

// ייצוא ישיר ל-Google Calendar API (דורש הגדרה, ראה בסוף הקובץ)
// אם ריק — יוצג ממשק הורדת ICS במקום
const GCAL_CLIENT_ID = '333950847812-rcasbnva97pg6h10jk8fklkbadktrf0f.apps.googleusercontent.com';
/* ════════════════════════════════════════════════════════
   חלק 2: עיצוב — CSS נוסף
   (יוזרק אוטומטית לדף)
════════════════════════════════════════════════════════ */
(function _injectCss() {
  const style = document.createElement('style');
  style.textContent = `
    /* תא יום בלוח */
    .cj-day {
      border-radius: 10px;
      padding: 4px 2px 5px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      min-height: 38px;
      transition: background .12s;
      border: 1.5px solid transparent;
      box-sizing: border-box;
    }
    .cj-day:not(.cj-future):hover {
      background: var(--sf2) !important;
    }
    .cj-day.cj-today {
      border-color: var(--gold) !important;
      background: rgba(240,192,64,.07) !important;
    }
    .cj-day.cj-selected {
      border-color: var(--blue) !important;
      background: var(--blue3) !important;
    }
    .cj-day.cj-future {
      opacity: 0.35;
      cursor: default !important;
    }
    /* נקודת סטטוס */
    .cj-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      display: block;
      flex-shrink: 0;
    }
    /* שורת משימה בציר הזמן */
    .cj-task-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 12px;
      border-radius: 10px;
      margin-bottom: 6px;
      transition: all .12s;
      box-sizing: border-box;
    }
    .cj-task-row.cj-done {
      background: var(--green3);
      border: 1px solid rgba(56,214,138,.2);
    }
    .cj-task-row.cj-undone {
      background: var(--surface);
      border: 1px solid var(--brd);
    }
    .cj-task-row.cj-today-row:hover {
      transform: translateX(-2px);
      box-shadow: 2px 2px 8px rgba(0,0,0,.15);
    }
    /* תיבת סימון */
    .cj-check {
      width: 20px;
      height: 20px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all .12s;
    }
    /* אנימציית טעינה לכפתור סנכרון */
    @keyframes cj-spin {
      to { transform: rotate(360deg); }
    }
    .cj-spinning {
      display: inline-block;
      animation: cj-spin .8s linear infinite;
    }
    /* Legend */
    .cj-legend {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      padding: 6px 0;
      font-size: 10px;
      color: var(--txt3);
    }
    .cj-legend span {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    /* ריק בין חלקים */
    #cj-section {
      margin-bottom: 14px;
    }
  `;
  document.head.appendChild(style);
})();

/* ════════════════════════════════════════════════════════
   חלק 3: "הדבקה" לתוך renderJournalPage הקיים
   (ממתין עד שהפונקציה נטענת, ואז עוטף אותה)
════════════════════════════════════════════════════════ */
(function _patchJournal() {
  let _attempts = 0;

  const _tryPatch = setInterval(() => {
    _attempts++;

    if (typeof window.renderJournalPage === 'function' && !window._cjPatched) {
      clearInterval(_tryPatch);
      window._cjPatched = true;

      const _orig = window.renderJournalPage;

      // עוטפים את הפונקציה המקורית
      window.renderJournalPage = function () {
        _orig.apply(this, arguments);
        // מחכים קצת שה-DOM ייבנה ואז מוסיפים את הלוח
        setTimeout(() => {
          _buildCalSection();
          _renderMonth();
          _renderDayDetail(_cjSelectedDay || new Date().toDateString());
        }, 80);
      };
    }

    // בטיחות — אחרי 10 שניות מפסיקים לחפש
    if (_attempts > 100) clearInterval(_tryPatch);
  }, 100);
})();

/* ════════════════════════════════════════════════════════
   חלק 4: בניית ה-HTML של אזור הלוח
   (מוזרק פעם אחת לדף היומן)
════════════════════════════════════════════════════════ */
function _buildCalSection() {
  // אם כבר קיים — לא בונים שוב
  if (document.getElementById('cj-section')) return;

  const journalPage = document.getElementById('pg-journal');
  if (!journalPage) return;

  /* ── HTML של הלוח ── */
  const section = document.createElement('div');
  section.id = 'cj-section';
  section.innerHTML = `

    <!-- כרטיס לוח שנה -->
    <div style="background:var(--surface);border:1px solid var(--brd);border-radius:var(--r);overflow:hidden;margin-bottom:10px">

      <!-- כותרת + ניווט חודשים -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:11px 14px;border-bottom:1px solid var(--brd)">
        <button id="cj-prev" onclick="_cjPrevMonth()"
          style="width:34px;height:34px;border-radius:50%;background:var(--sf2);border:1px solid var(--brd2);
                 color:var(--txt2);cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center">
          →
        </button>
        <div id="cj-month-label" style="text-align:center;flex:1;padding:0 8px"></div>
        <button id="cj-next" onclick="_cjNextMonth()"
          style="width:34px;height:34px;border-radius:50%;background:var(--sf2);border:1px solid var(--brd2);
                 color:var(--txt2);cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center">
          ←
        </button>
      </div>

      <!-- כותרות ימי השבוע -->
      <div style="display:grid;grid-template-columns:repeat(7,1fr);text-align:center;
                  padding:6px 8px 2px;font-size:9px;font-weight:800;
                  color:var(--txt3);text-transform:uppercase;letter-spacing:.3px">
        <div>א'</div><div>ב'</div><div>ג'</div><div>ד'</div><div>ה'</div><div>ו'</div><div>ש'</div>
      </div>

      <!-- גריד ימים -->
      <div id="cj-grid" style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;padding:4px 8px 8px"></div>

      <!-- מקרא צבעים -->
      <div style="padding:2px 12px 10px">
        <div class="cj-legend">
          <span><span class="cj-dot" style="background:var(--green)"></span> 80%+</span>
          <span><span class="cj-dot" style="background:var(--gold)"></span> 50-79%</span>
          <span><span class="cj-dot" style="background:var(--red)"></span> מתחת 50%</span>
          <span><span class="cj-dot" style="background:var(--teal)"></span> יום עשייה</span>
          <span><span class="cj-dot" style="background:rgba(155,126,248,.8)"></span> יום חסד</span>
        </div>
      </div>
    </div>

    <!-- פרטי יום נבחר -->
    <div id="cj-day-detail"></div>
  `;

  /* איפה להכניס? — אחרי סיכום היום, לפני כל השאר */
  const daySummary = document.getElementById('journal-day-summary');
  if (daySummary && daySummary.parentNode) {
    daySummary.parentNode.insertBefore(section, daySummary.nextSibling);
  } else {
    // גיבוי — בתחילת הדף
    const firstChild = journalPage.querySelector('.sh');
    if (firstChild) journalPage.insertBefore(section, firstChild.nextSibling);
    else journalPage.prepend(section);
  }

  /* הוספת כפתור Google Calendar לשורת הכותרת של היומן */
  _addGcalButtonToHeader();
}

/* ════════════════════════════════════════════════════════
   חלק 5: ציור לוח השנה
════════════════════════════════════════════════════════ */
function _renderMonth() {
  const gridEl   = document.getElementById('cj-grid');
  const labelEl  = document.getElementById('cj-month-label');
  if (!gridEl || !labelEl) return;

  const today  = new Date();
  const year   = _cjMonth.getFullYear();
  const month  = _cjMonth.getMonth();

  /* ── תווית חודש בעברי + לועזי ── */
  const hebMonth  = _cjMonth.toLocaleDateString('he-IL-u-ca-hebrew', { month: 'long', year: 'numeric' });
  const gregMonth = _cjMonth.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
  labelEl.innerHTML = `
    <div style="font-size:13px;font-weight:800;color:var(--txt)">${hebMonth}</div>
    <div style="font-size:10px;color:var(--txt3);font-weight:500">${gregMonth}</div>
  `;

  /* ── כמה ימים בחודש ── */
  const firstDow    = new Date(year, month, 1).getDay(); // 0=ראשון
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let html = '';

  // תאים ריקים לפני היום הראשון
  for (let i = 0; i < firstDow; i++) html += '<div></div>';

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    const ds      = dateObj.toDateString();
    const isToday   = ds === today.toDateString();
    const isFuture  = dateObj > today;
    const isSelected = ds === _cjSelectedDay;
    const isShabbat  = dateObj.getDay() === 6;

    /* ── מצא נתוני היסטוריה ── */
    const hist      = (S.history || []).find(h => h.date === ds);
    const isFocusDay = hist?.isFocusDay ||
                       (S.focusDays || []).some(fd => new Date(fd.date).toDateString() === ds);
    const isGrace   = (S.graceUsedDates || []).includes(ds);

    /* ── חשב אחוז השלמה ── */
    let dotColor = 'transparent';
    if (!isFuture) {
      if (isFocusDay) {
        dotColor = 'var(--teal)';
      } else if (isGrace) {
        dotColor = 'rgba(155,126,248,.8)';
      } else if (isToday) {
        const { pct } = _calcDayPct(dateObj, S.done);
        dotColor = pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--gold)' : pct > 0 ? 'var(--red)' : 'var(--brd2)';
      } else if (hist) {
        const { pct } = _calcDayPct(dateObj, hist.doneTasks || {}, hist.level || S.level);
        dotColor = pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--gold)' : pct > 0 ? 'var(--red)' : 'rgba(240,80,80,.3)';
      } else if (!isShabbat) {
        dotColor = 'rgba(240,80,80,.2)'; // יום שלא עודכן
      }
    }

    /* ── אות עברית של היום ── */
    const hebLetter = (typeof hebrewDayLetters === 'function')
      ? hebrewDayLetters(dateObj)
      : d;

    /* ── CSS classes ── */
    let cls = 'cj-day';
    if (isToday)    cls += ' cj-today';
    if (isSelected) cls += ' cj-selected';
    if (isFuture)   cls += ' cj-future';

    const clickHandler = isFuture
      ? ''
      : `onclick="_renderDayDetail('${ds}');_cjMarkSelected('${ds}')"`;

    html += `
      <div class="${cls}" style="cursor:${isFuture ? 'default' : 'pointer'}" ${clickHandler}>
        <span style="font-size:10px;font-weight:800;color:${isToday ? 'var(--gold)' : isSelected ? 'var(--blue)' : 'var(--txt2)'};line-height:1">${hebLetter}</span>
        <span style="font-size:7.5px;color:var(--txt3);opacity:.6;line-height:1">${d}</span>
        <span class="cj-dot" style="background:${dotColor}"></span>
      </div>
    `;
  }

  gridEl.innerHTML = html;
}

/* ── סמן יום כנבחר ויצייר שוב ── */
function _cjMarkSelected(ds) {
  _cjSelectedDay = ds;
  _renderMonth(); // מצייר מחדש כדי לעדכן את ה-selected
}

/* ── ניווט חודשים ── */
function _cjPrevMonth() {
  _cjMonth = new Date(_cjMonth.getFullYear(), _cjMonth.getMonth() + 1, 1);
  _renderMonth();
  document.getElementById('cj-day-detail').innerHTML = '';
}
function _cjNextMonth() {
  _cjMonth = new Date(_cjMonth.getFullYear(), _cjMonth.getMonth() - 1, 1);
  _renderMonth();
  document.getElementById('cj-day-detail').innerHTML = '';
}

/* ════════════════════════════════════════════════════════
   חלק 6: ציר זמן יומי (פרטי יום נבחר)
════════════════════════════════════════════════════════ */
function _renderDayDetail(ds) {
  _cjSelectedDay = ds;
  const detailEl = document.getElementById('cj-day-detail');
  if (!detailEl) return;

  const today   = new Date();
  const dateObj = new Date(ds);
  const isToday = ds === today.toDateString();

  /* ── נתוני היום ── */
  const hist       = (S.history || []).find(h => h.date === ds);
  const isFocusDay = hist?.isFocusDay ||
                     (S.focusDays || []).some(fd => new Date(fd.date).toDateString() === ds);
  const isGrace    = (S.graceUsedDates || []).includes(ds);
  const level      = hist?.level || S.level;
  const dayType    = getDayType(dateObj);

  /* ── קבל משימות לאותו יום ── */
  const allTasks = _getTasksForDay(level, dayType);

  /* ── מה בוצע? ── */
  const doneTasks = isToday ? S.done : (hist?.doneTasks || {});

  /* ── מיין לפי שעה ── */
  const sorted = [...allTasks].sort((a, b) => {
    const ta = a.time || '99:99';
    const tb = b.time || '99:99';
    return ta.localeCompare(tb);
  });

  /* ── חשב סטטיסטיקות ── */
  const doneCount = sorted.filter(t => doneTasks[t.id]).length;
  const total     = sorted.length;
  const pts       = sorted.reduce((s, t) => s + (doneTasks[t.id] ? (typeof bonusPts === 'function' ? bonusPts(t.pts) : t.pts) : 0), 0);
  const pct       = total ? Math.round(doneCount / total * 100) : 0;

  /* ── תאריך מפורמט ── */
  const hebDate  = dateObj.toLocaleDateString('he-IL-u-ca-hebrew', { weekday: 'long', day: 'numeric', month: 'long' });
  const gregDate = dateObj.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });

  /* ── תגי מצב מיוחד ── */
  let badges = '';
  if (isFocusDay) badges += `<span style="font-size:10px;background:rgba(45,212,191,.1);color:var(--teal);border:1px solid rgba(45,212,191,.25);border-radius:5px;padding:2px 7px">🎯 יום עשייה</span>`;
  if (isGrace)    badges += `<span style="font-size:10px;background:rgba(155,126,248,.1);color:var(--purple);border:1px solid rgba(155,126,248,.25);border-radius:5px;padding:2px 7px;margin-right:4px">🛡️ יום חסד</span>`;

  /* ── HTML של משימות ── */
  let tasksHtml = '';
  if (isFocusDay) {
    tasksHtml = `<div style="text-align:center;padding:20px;font-size:12px;color:var(--teal)">🎯 יום עשייה — אין משימות רגילות</div>`;
  } else if (!sorted.length) {
    tasksHtml = `<div style="text-align:center;padding:20px;font-size:12px;color:var(--txt3)">אין משימות ליום זה</div>`;
  } else {
    // קבוצת משימות ללא שעה — נציג בנפרד בסוף
    const withTime    = sorted.filter(t => t.time);
    const withoutTime = sorted.filter(t => !t.time);

    const _taskRow = (t) => {
      const isDone  = !!doneTasks[t.id];
      const safeId  = t.id.replace(/'/g, "\\'");
      const timeTag = t.time
        ? `<div style="font-size:10px;font-weight:800;color:var(--txt3);flex-shrink:0;min-width:36px">${t.time}</div>`
        : `<div style="min-width:36px"></div>`;

      const catIcon = { zman:'⏰', limud:'📖', briut:'💪', bayit:'🏠', shlichut:'✡️', smart:'📵' }[t.cat] || '•';

      // הפונקציה toggleTask קיימת ב-app.js
      const clickAttr = isToday
        ? `onclick="toggleTask('${safeId}',${t.pts});setTimeout(()=>{_renderDayDetail('${ds}');_renderMonth();},80)"`
        : '';

      return `
        <div class="cj-task-row ${isDone ? 'cj-done' : 'cj-undone'} ${isToday ? 'cj-today-row' : ''}"
             style="cursor:${isToday ? 'pointer' : 'default'}" ${clickAttr}>
          ${timeTag}
          <div class="cj-check" style="border:1.5px solid ${isDone ? 'var(--green2)' : 'var(--brd2)'};background:${isDone ? 'var(--green2)' : 'transparent'}">
            ${isDone ? '<svg width="10" height="10" viewBox="0 0 11 11" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="1.5,5.5 4,8.5 9.5,2.5"/></svg>' : ''}
          </div>
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;font-weight:700;
              color:${isDone ? 'var(--green2)' : 'var(--txt)'};
              ${isDone ? 'text-decoration:line-through;opacity:.65' : ''};
              white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.text}</div>
            <div style="font-size:10px;color:var(--txt3);margin-top:1px">${catIcon} ${t.cat || ''}</div>
          </div>
          <div style="font-size:10px;font-weight:800;color:${isDone ? 'var(--green)' : 'var(--txt3)'};flex-shrink:0">+${t.pts}</div>
        </div>
      `;
    };

    if (withTime.length) {
      tasksHtml += `<div style="font-size:10px;font-weight:800;color:var(--txt3);text-transform:uppercase;letter-spacing:.6px;padding:0 2px 6px">⏱ לפי שעה</div>`;
      tasksHtml += withTime.map(_taskRow).join('');
    }
    if (withoutTime.length) {
      tasksHtml += `<div style="font-size:10px;font-weight:800;color:var(--txt3);text-transform:uppercase;letter-spacing:.6px;padding:${withTime.length ? '10px' : '0'} 2px 6px">📌 משימות כלליות</div>`;
      tasksHtml += withoutTime.map(_taskRow).join('');
    }
  }

  /* ── כפתור ייצוא ל-Google Calendar (רק אם יש משימות עם שעה) ── */
  const hasTimedTasks = sorted.some(t => t.time);
  const exportBtn = hasTimedTasks
    ? `<button onclick="cjExportDay('${ds}')"
        style="font-size:10px;font-weight:700;color:var(--blue);padding:4px 10px;
               background:var(--blue3);border:1px solid rgba(91,141,248,.3);
               border-radius:99px;cursor:pointer;font-family:'Heebo',sans-serif">
        📅 ייצא ל-Google
      </button>`
    : '';

  /* ── הרכבת ה-HTML הסופי ── */
  detailEl.innerHTML = `
    <div style="background:var(--surface);border:1px solid var(--brd);border-radius:var(--r);overflow:hidden">

      <!-- כותרת יום -->
      <div style="padding:12px 14px;border-bottom:1px solid var(--brd);
                  display:flex;align-items:flex-start;justify-content:space-between;gap:8px;flex-wrap:wrap">
        <div>
          <div style="font-size:13px;font-weight:800;color:var(--txt)">${hebDate}</div>
          <div style="font-size:11px;color:var(--txt3);margin-top:1px">${gregDate}</div>
          ${badges ? `<div style="margin-top:6px;display:flex;gap:4px;flex-wrap:wrap">${badges}</div>` : ''}
        </div>
        <div style="display:flex;align-items:center;gap:10px;flex-shrink:0">
          <div style="text-align:center">
            <div style="font-size:20px;font-weight:900;
              color:${pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--gold)' : pct > 0 ? 'var(--red)' : 'var(--txt3)'};
              line-height:1">${pct}%</div>
            <div style="font-size:9px;color:var(--txt3);margin-top:2px">${doneCount}/${total} · +${pts}</div>
          </div>
          ${exportBtn}
        </div>
      </div>

      <!-- ציר הזמן -->
      <div style="padding:10px 12px">
        ${tasksHtml}
      </div>

      ${isToday ? `<div style="padding:0 12px 10px;font-size:10px;color:var(--txt3);text-align:center">
        לחץ על משימה לסימון / ביטול סימון
      </div>` : ''}
    </div>
  `;
}

/* ════════════════════════════════════════════════════════
   חלק 7: כלי עזר
════════════════════════════════════════════════════════ */

/* חשב אחוז השלמה ליום נתון */
function _calcDayPct(dateObj, doneTasks, level) {
  const lvl      = level || S.level;
  const dayType  = getDayType(dateObj);
  const tasks    = _getTasksForDay(lvl, dayType);
  if (!tasks.length) return { pct: 0, done: 0, total: 0 };
  const done = tasks.filter(t => doneTasks && doneTasks[t.id]).length;
  return { pct: Math.round(done / tasks.length * 100), done, total: tasks.length };
}

/* קבל משימות ליום לפי סוג (weekday/friday/shabbat) */
function _getTasksForDay(level, dayType) {
  // getTasksForDay קיימת ב-data_task_routing.js
  if (typeof getTasksForDay === 'function') {
    return getTasksForDay(level, dayType);
  }
  // גיבוי — פילטור ידני
  const all = getTasks(level);
  return all.filter(t => (t.days || ['weekday']).includes(dayType));
}

/* ════════════════════════════════════════════════════════
   חלק 8: ייצוא ל-Google Calendar (קובץ ICS)
   
   ICS הוא פורמט סטנדרטי שGoogle Calendar מבין.
   כמו "קובץ אירועים" — לוחצים עליו ו-Google שואל "להוסיף?"
════════════════════════════════════════════════════════ */
function cjExportDay(ds) {
  const dateObj = new Date(ds);
  const level   = S.level;
  const dayType = getDayType(dateObj);
  const tasks   = _getTasksForDay(level, dayType).filter(t => t.time);

  if (!tasks.length) {
    if (typeof toast === 'function') toast('⚠️ אין משימות עם שעה קבועה');
    return;
  }

  // בונים ICS
  const pad   = n => String(n).padStart(2, '0');
  const ymd   = `${dateObj.getFullYear()}${pad(dateObj.getMonth() + 1)}${pad(dateObj.getDate())}`;

  let icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//העלייה שלי//HE',
    'CALSCALE:GREGORIAN',
    'X-WR-CALNAME:העלייה שלי',
  ];

  tasks.forEach(t => {
    const [h, m]   = t.time.split(':').map(Number);
    const endH     = h + (m + 30 >= 60 ? 1 : 0);
    const endM     = (m + 30) % 60;
    const dtStart  = `${ymd}T${pad(h)}${pad(m)}00`;
    const dtEnd    = `${ymd}T${pad(endH)}${pad(endM)}00`;
    const uid      = `aliyah-${t.id}-${ymd}@haalia-sheli`;

    icsLines.push(
      'BEGIN:VEVENT',
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${t.text}`,
      `DESCRIPTION:+${t.pts} נקודות | קטגוריה: ${t.cat} | העלייה שלי`,
      `UID:${uid}`,
      'STATUS:NEEDS-ACTION',
      'END:VEVENT'
    );
  });

  icsLines.push('END:VCALENDAR');

  // הורד את הקובץ
  const content  = icsLines.join('\r\n');
  const blob     = new Blob(['\ufeff' + content], { type: 'text/calendar;charset=utf-8' });
  const url      = URL.createObjectURL(blob);
  const a        = document.createElement('a');
  a.href         = url;
  a.download     = `aliyah-${dateObj.toISOString().split('T')[0]}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // הצג הסבר
  _showIcsExportGuide();
}

/* הצג הסבר קצר איך לפתוח את ה-ICS */
function _showIcsExportGuide() {
  // אם כבר פתוח — לא פותחים שוב
  if (document.getElementById('cj-ics-guide')) return;

  const modal = document.createElement('div');
  modal.id = 'cj-ics-guide';
  modal.style.cssText = `
    position:fixed;inset:0;z-index:9999;
    background:rgba(0,0,0,.72);
    display:flex;align-items:flex-end;justify-content:center;
    padding:0;
  `;
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

  modal.innerHTML = `
    <div style="background:var(--bg2);border-radius:20px 20px 0 0;border-top:1px solid var(--brd2);
                padding:20px 16px 32px;width:100%;max-width:500px;box-sizing:border-box">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <div style="font-size:15px;font-weight:900;color:var(--txt)">📅 הקובץ הורד!</div>
        <button onclick="document.getElementById('cj-ics-guide').remove()"
          style="width:28px;height:28px;border-radius:50%;background:var(--bg3);
                 border:1px solid var(--brd2);color:var(--txt2);cursor:pointer">✕</button>
      </div>

      <div style="font-size:12px;color:var(--txt2);line-height:1.7;margin-bottom:14px">
        הורדת קובץ <strong>.ics</strong> — זהו קובץ אירועים שכל לוח שנה מבין.<br>
        עכשיו צריך <strong>לפתוח אותו</strong> כדי שהמשימות ייכנסו ל-Google Calendar.
      </div>

      <div style="background:var(--surface);border:1px solid var(--brd);border-radius:12px;padding:14px;margin-bottom:10px">
        <div style="font-size:12px;font-weight:800;color:var(--txt);margin-bottom:8px">📱 באייפון / אנדרואיד:</div>
        <div style="font-size:11px;color:var(--txt2);line-height:1.7">
          1. פתח את <strong>אפליקציית הקבצים</strong><br>
          2. מצא את הקובץ שהורד (ב"הורדות")<br>
          3. לחץ עליו — Google Calendar ישאל "להוסיף?"<br>
          4. אשר ✓
        </div>
      </div>

      <div style="background:var(--surface);border:1px solid var(--brd);border-radius:12px;padding:14px;margin-bottom:14px">
        <div style="font-size:12px;font-weight:800;color:var(--txt);margin-bottom:8px">💻 במחשב:</div>
        <div style="font-size:11px;color:var(--txt2);line-height:1.7">
          1. עבור ל-<strong>calendar.google.com</strong><br>
          2. לחץ על ⚙️ הגדרות ← ייבוא ויצוא<br>
          3. בחר "ייבוא" ← בחר את הקובץ שהורד
        </div>
      </div>

      <button onclick="document.getElementById('cj-ics-guide').remove()"
        style="width:100%;padding:13px;background:var(--blue3);border:1px solid rgba(91,141,248,.3);
               border-radius:var(--r-sm);color:var(--blue);font-size:13px;font-weight:800;
               cursor:pointer;font-family:'Heebo',sans-serif">
        הבנתי ✓
      </button>
    </div>
  `;

  document.body.appendChild(modal);
}

/* ════════════════════════════════════════════════════════
   חלק 9: סנכרון ישיר Google Calendar API
   (דורש הגדרת GCAL_CLIENT_ID בראש הקובץ)
════════════════════════════════════════════════════════ */

/* הוסף כפתור "📅 Google" לשורת הכותרת של היומן */
function _addGcalButtonToHeader() {
  if (document.getElementById('cj-gcal-header-btn')) return;

  // מחפש את כפתור ה"ייצוא" הקיים
  const shRow = document.querySelector('#pg-journal .sh');
  if (!shRow) return;

  const btn = document.createElement('button');
  btn.id = 'cj-gcal-header-btn';
  btn.textContent = '📅 Google Calendar';
  btn.style.cssText = `
    font-size:11px;font-weight:700;color:var(--blue);
    padding:5px 11px;background:var(--blue3);
    border:1px solid rgba(91,141,248,.3);border-radius:99px;
    cursor:pointer;font-family:'Heebo',sans-serif;
    transition:all .15s;
  `;
  btn.onclick = () => _showGcalSyncModal();
  shRow.appendChild(btn);
}

/* מודל ראשי לסנכרון Google Calendar */
function _showGcalSyncModal() {
  if (document.getElementById('cj-gcal-modal')) {
    document.getElementById('cj-gcal-modal').remove();
  }

  const today   = new Date();
  const dayType = getDayType(today);
  const tasks   = _getTasksForDay(S.level, dayType);
  const timed   = tasks.filter(t => t.time).length;

  const modal = document.createElement('div');
  modal.id = 'cj-gcal-modal';
  modal.style.cssText = `
    position:fixed;inset:0;z-index:9999;
    background:rgba(0,0,0,.72);
    display:flex;align-items:flex-end;justify-content:center;
  `;
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

  modal.innerHTML = `
    <div style="background:var(--bg2);border-radius:20px 20px 0 0;border-top:1px solid var(--brd2);
                padding:20px 16px 32px;width:100%;max-width:500px;box-sizing:border-box;
                max-height:85vh;overflow-y:auto">

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <div style="font-size:15px;font-weight:900;color:var(--txt)">📅 Google Calendar</div>
        <button onclick="document.getElementById('cj-gcal-modal').remove()"
          style="width:28px;height:28px;border-radius:50%;background:var(--bg3);
                 border:1px solid var(--brd2);color:var(--txt2);cursor:pointer">✕</button>
      </div>

      <div style="font-size:12px;color:var(--txt2);line-height:1.6;margin-bottom:16px">
        יש <strong>${timed} משימות עם שעה קבועה</strong> שניתן לייצא ל-Google Calendar.
      </div>

      <!-- אפשרות 1: ICS -->
      <div style="background:var(--surface);border:1px solid var(--brd);border-radius:12px;padding:14px;margin-bottom:10px">
        <div style="font-size:13px;font-weight:800;color:var(--green2);margin-bottom:6px">
          ✅ ייצוא ICS — מהיר ופשוט
        </div>
        <div style="font-size:11px;color:var(--txt2);line-height:1.6;margin-bottom:10px">
          מוריד קובץ שפותחים ב-Google Calendar.
          המשימות יהפכו לאירועים של 30 דקות כל אחת.
        </div>
        <button onclick="cjExportDay(new Date().toDateString());document.getElementById('cj-gcal-modal').remove()"
          style="width:100%;padding:11px;background:var(--green3);border:1px solid rgba(56,214,138,.25);
                 border-radius:10px;font-size:13px;font-weight:800;color:var(--green2);
                 cursor:pointer;font-family:'Heebo',sans-serif">
          📥 הורד ICS להיום (${today.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })})
        </button>
      </div>

      <!-- אפשרות 2: ייצוא שבוע -->
      <div style="background:var(--surface);border:1px solid var(--brd);border-radius:12px;padding:14px;margin-bottom:10px">
        <div style="font-size:13px;font-weight:800;color:var(--teal);margin-bottom:6px">
          📆 ייצוא שבועי
        </div>
        <div style="font-size:11px;color:var(--txt2);line-height:1.6;margin-bottom:10px">
          מוריד את כל 7 הימים הקרובים כאירועים חוזרים.
        </div>
        <button onclick="_cjExportWeek();document.getElementById('cj-gcal-modal').remove()"
          style="width:100%;padding:11px;background:rgba(45,212,191,.1);border:1px solid rgba(45,212,191,.25);
                 border-radius:10px;font-size:13px;font-weight:800;color:var(--teal);
                 cursor:pointer;font-family:'Heebo',sans-serif">
          📥 הורד ICS לשבוע הקרוב
        </button>
      </div>

      ${GCAL_CLIENT_ID ? '' : `
      <!-- הוראות סנכרון אוטומטי -->
      <div style="background:var(--surface);border:1px solid var(--brd);border-radius:12px;padding:14px">
        <div style="font-size:13px;font-weight:800;color:var(--blue);margin-bottom:6px">
          🔗 סנכרון אוטומטי (הגדרה מתקדמת)
        </div>
        <div style="font-size:11px;color:var(--txt2);line-height:1.6;margin-bottom:8px">
          לסנכרון ישיר ללא הורדת קובץ — יש להגדיר Google API.
        </div>
        <div style="background:var(--bg3);border-radius:8px;padding:10px;font-size:10px;color:var(--txt2);line-height:1.7">
          1. כנס ל-<strong>console.cloud.google.com</strong><br>
          2. צור פרויקט חדש ← הפעל "Google Calendar API"<br>
          3. צור "OAuth 2.0 Client ID" (סוג: Web)<br>
          4. הכנס את ה-ID בקובץ calendar-journal.js בשורה:<br>
          <code style="background:var(--bg2);padding:2px 6px;border-radius:4px;color:var(--blue)">const GCAL_CLIENT_ID = 'YOUR_ID';</code>
        </div>
      </div>
      `}
    </div>
  `;

  document.body.appendChild(modal);
}

/* ייצוא שבועי */
function _cjExportWeek() {
  const today = new Date();
  const pad   = n => String(n).padStart(2, '0');

  let icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//העלייה שלי//HE',
    'CALSCALE:GREGORIAN',
    'X-WR-CALNAME:העלייה שלי — שבוע',
  ];

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const dateObj = new Date(today);
    dateObj.setDate(today.getDate() + dayOffset);
    const dayType = getDayType(dateObj);
    const tasks   = _getTasksForDay(S.level, dayType).filter(t => t.time);
    const ymd     = `${dateObj.getFullYear()}${pad(dateObj.getMonth() + 1)}${pad(dateObj.getDate())}`;

    tasks.forEach(t => {
      const [h, m]  = t.time.split(':').map(Number);
      const endH    = h + (m + 30 >= 60 ? 1 : 0);
      const endM    = (m + 30) % 60;
      const uid     = `aliyah-${t.id}-${ymd}@haalia-sheli`;

      icsLines.push(
        'BEGIN:VEVENT',
        `DTSTART:${ymd}T${pad(h)}${pad(m)}00`,
        `DTEND:${ymd}T${pad(endH)}${pad(endM)}00`,
        `SUMMARY:${t.text}`,
        `DESCRIPTION:+${t.pts} נקודות | ${t.cat}`,
        `UID:${uid}`,
        'END:VEVENT'
      );
    });
  }

  icsLines.push('END:VCALENDAR');

  const content = icsLines.join('\r\n');
  const blob    = new Blob(['\ufeff' + content], { type: 'text/calendar;charset=utf-8' });
  const url     = URL.createObjectURL(blob);
  const a       = document.createElement('a');
  a.href        = url;
  a.download    = `aliyah-week-${today.toISOString().split('T')[0]}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  _showIcsExportGuide();
}

/* ════════════════════════════════════════════════════════
   חלק 10: רענון אוטומטי כשמשתנה מצב
   (כדי שהנקודה של "היום" תתעדכן כשמסמנים משימות)
════════════════════════════════════════════════════════ */
(function _patchRenderActive() {
  let _attempts2 = 0;

  const _tryPatch2 = setInterval(() => {
    _attempts2++;

    if (typeof window.renderActive === 'function' && !window._cjActivePatch) {
      clearInterval(_tryPatch2);
      window._cjActivePatch = true;

      const _origRA = window.renderActive;
      window.renderActive = function () {
        _origRA.apply(this, arguments);

        // אם הדף הנוכחי הוא יומן — מרענן את לוח השנה
        if (typeof activePage !== 'undefined' && activePage === 'journal') {
          const grid = document.getElementById('cj-grid');
          if (grid) _renderMonth();
          // מרענן גם את הפרטים של היום הנוכחי
          if (_cjSelectedDay) _renderDayDetail(_cjSelectedDay);
        }
      };
    }

    if (_attempts2 > 100) clearInterval(_tryPatch2);
  }, 100);
})();
