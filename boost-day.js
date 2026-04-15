/* ═══════════════════════════════════════════════════════════════
   boost-day.js  —  פיצ'ר יום בוסט
   ───────────────────────────────────────────────────────────────
   תלויות מהקוד הראשי (חייבות להיות מוגדרות לפני הטעינה):
     S               — אובייקט ה-state הגלובלי
     save()          — שמירת ה-state
     toast(msg)      — הצגת הודעת פופ-אפ
     openModal(id)   — פתיחת מודל לפי id
     closeModal(id)  — סגירת מודל
     renderToday()   — רינדור מחדש של דף היום
     renderActive()  — רינדור הדף הפעיל
     getTasksForDay(level, dayType) — קבלת משימות
     getDayType(dateObj)            — 'weekday'/'friday'/'shabbat'
     bonusPts(base)  — ניקוד עם בונוס
     MAX_LVL         — const, שלב מקסימלי (15)
     pendingLU       — let, לעדכון level-up בהמשך הרולאובר
     _baseId(taskId) — חילוץ base id של משימה
   ═══════════════════════════════════════════════════════════════ */

const BOOST_LEVELS    = [5, 10, 15];
const BOOST_LOCK_DAYS = 7; // ימי נעילה אחרי כישלון

/* ── תיאורי חיים לפי שלב בוסט ── */
function _boostLevelDesc(boostLvl){
  const descs = {
    5: {
      title:    'שלב 5 — יסודות מגובשים',
      emoji:    '🌱',
      summary:  'היום שלך ייראה כך: קימה עד 7:15, 5 כוסות מים, תפילה מסידור, 30 דק\' לימוד, ארוחות ממושמעות, ניקוי בסיסי.',
      bullets:  [
        'קימה — עד 7:15 (מוקדם מהרגיל שלך)',
        'שתיית מים — 5 כוסות ביום',
        'תפילה — שחרית מלאה מסידור',
        'לימוד — 30 דקות מינימום',
        'סמארטפון — ניתוק בזמן לימוד',
      ],
      pts_note: 'ניקוד לפי שלב 5 — גבוה יותר מהרגיל שלך',
    },
    10: {
      title:    'שלב 10 — עמידה אמיתית',
      emoji:    '🔥',
      summary:  'יום תובעני: קימה לפני 6:00, 2 ליטר מים, שחרית+מנחה+ערבית, שעה לימוד מינימום, ניתוק דיגיטלי מלא בלימוד.',
      bullets:  [
        'קימה — לפני 6:00 בבוקר',
        'שתיית מים — 2 ליטר + אכילה מודעת',
        'תפילה — שלוש תפילות + כוונה',
        'לימוד — שעה+ (רמב"ם, גמרא, חסידות)',
        'סמארטפון — מחוץ לחדר הלימוד כל הבוקר',
      ],
      pts_note: 'ניקוד שלב 10 — כפול לערך ממה שאתה עושה היום',
    },
    15: {
      title:    'שלב 15 — שיא מוחלט ✦',
      emoji:    '⭐',
      summary:  'היום ברמת הצמרת: קימה 5:00 "כאריה", 3 ליטר מים, שלוש תפילות בכוונה מלאה, שעות לימוד, 0 הסחות דעת.',
      bullets:  [
        'קימה — 5:00 בדיוק, בזריזות מלאה',
        'שתיית מים — 3 ליטר מלאים',
        'תפילה — שחרית+מנחה+ערבית בכוונה מלאה',
        'לימוד — רמב"ם מסלול מלא + גמרא + חסידות',
        'סמארטפון — 0 הסחות דעת ב-3 שעות בוקר וערב',
      ],
      pts_note: 'ניקוד מקסימלי — שלב 15, פי 3 מהרגיל',
    },
  };
  return descs[boostLvl] || descs[5];
}

/* ── בדיקת נעילה ── */
function boostLockStatus(){
  const lockUntil = S.boostLockUntil;
  if(!lockUntil) return {locked:false};
  const lockDate = new Date(lockUntil);
  const now = new Date();
  if(now < lockDate){
    const diff = Math.ceil((lockDate - now) / (1000*60*60*24));
    return {locked:true, reason:`לא עמדת ב-80% ביום הבוסט האחרון. הכלי נעול עוד ${diff} ימים.`, daysLeft:diff};
  }
  return {locked:false};
}

/* ── האם יש בוסט פעיל היום? ── */
function boostActiveToday(){
  if(!S.boostDay) return null;
  const today = new Date().toDateString();
  if(S.boostDay.date === today) return S.boostDay;
  return null;
}

/* ── שלב הבוסט הפעיל (null אם לא פעיל) ── */
function getBoostLevel(){
  const b = boostActiveToday();
  return b ? b.level : null;
}

/* ── פתיחת מודל יום בוסט ── */
let _selectedBoostLevel = null;

function openBoostDayModal(){
  const lock   = boostLockStatus();
  const active = boostActiveToday();

  const lockedMsg  = document.getElementById('boost-locked-msg');
  const activeMsg  = document.getElementById('boost-active-msg');
  const selectArea = document.getElementById('boost-select-area');

  // מצב נעול
  if(lock.locked){
    lockedMsg.style.display  = 'block';
    document.getElementById('boost-locked-reason').textContent = lock.reason;
    activeMsg.style.display  = 'none';
    selectArea.style.display = 'none';
    openModal('modal-boost-day');
    return;
  }

  // בוסט כבר פעיל היום — הצג סטטוס
  if(active){
    lockedMsg.style.display  = 'none';
    activeMsg.style.display  = 'block';
    selectArea.style.display = 'none';
    const d = _boostLevelDesc(active.level);
    document.getElementById('boost-active-level-txt').textContent =
      `${d.emoji} ${d.title} — ניקוד לפי שלב ${active.level}`;
    const tasks = getTasksForDay(active.level, getDayType(new Date()));
    const done  = tasks.filter(t=>S.done[t.id]).length;
    const pct   = tasks.length ? Math.round(done/tasks.length*100) : 0;
    const ok    = pct >= 80;
    document.getElementById('boost-active-progress').innerHTML = `
      <div style="font-size:11px;color:var(--txt3);margin-bottom:4px">התקדמות: ${done}/${tasks.length} משימות (${pct}%)</div>
      <div style="height:6px;background:var(--sf3);border-radius:99px;overflow:hidden">
        <div style="height:100%;width:${pct}%;background:${ok?'var(--green)':'var(--orange)'};border-radius:99px;transition:width .6s"></div>
      </div>
      <div style="font-size:11px;margin-top:6px;color:${ok?'var(--green2)':'var(--txt3)'}">
        ${ok ? '✅ כבר מעל 80% — כל הכבוד!' : `עוד ${Math.ceil(tasks.length*0.8)-done} משימות ל-80%`}
      </div>`;
    openModal('modal-boost-day');
    return;
  }

  // מצב בחירה
  lockedMsg.style.display  = 'none';
  activeMsg.style.display  = 'none';
  selectArea.style.display = 'block';
  _selectedBoostLevel = null;

  const container   = document.getElementById('boost-cards-container');
  const validLevels = BOOST_LEVELS.filter(l => l > S.level);

  if(!validLevels.length){
    container.innerHTML = `<div style="text-align:center;padding:20px;color:var(--txt2);font-size:13px">
      <div style="font-size:28px;margin-bottom:8px">🏆</div>
      אתה כבר בשלב ${S.level} — אפשר לבחור רק שלבים <strong>גבוהים ממך</strong>.<br>
      <span style="font-size:11px;color:var(--txt3);margin-top:6px;display:block">שלבי הבוסט הזמינים: 5, 10, 15 — מהם גבוה ממך?</span>
    </div>`;
    document.getElementById('boost-confirm-btn').style.display = 'none';
  } else {
    document.getElementById('boost-confirm-btn').style.display = '';
    container.innerHTML = validLevels.map(lvl => {
      const d         = _boostLevelDesc(lvl);
      const boostTasks = getTasksForDay(lvl, getDayType(new Date()));
      const myTasks    = getTasksForDay(S.level, getDayType(new Date()));
      const preview    = boostTasks.slice(0,3).map(bt=>{
        const myT = myTasks.find(t=>_baseId(t.id)===_baseId(bt.id));
        return `<div class="boost-task-row">
          <span style="font-size:10px;color:var(--txt3)">•</span>
          <span class="boost-task-to">${bt.text}</span>
          ${myT && myT.text !== bt.text ? `<span class="boost-task-from">(${myT.text})</span>` : ''}
        </div>`;
      }).join('');
      return `<div class="boost-level-card" id="bcard-${lvl}" onclick="selectBoostLevel(${lvl})">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="font-size:28px">${d.emoji}</div>
            <div>
              <div class="boost-card-num">שלב ${lvl}</div>
              <div style="font-size:11px;color:var(--txt2);margin-top:1px">${d.pts_note}</div>
            </div>
          </div>
          <div class="boost-card-check" id="bcheck-${lvl}" style="display:none">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="1.5,5 3.8,7.5 8.5,2"/>
            </svg>
          </div>
        </div>
        <div style="font-size:12px;color:var(--txt2);margin-top:8px;line-height:1.6">${d.summary}</div>
        <div class="boost-task-preview">
          <div style="font-size:10px;font-weight:800;color:var(--orange);text-transform:uppercase;letter-spacing:.6px;margin-bottom:5px">דוגמאות למשימות מעודכנות:</div>
          ${preview}
        </div>
      </div>`;
    }).join('');
  }
  openModal('modal-boost-day');
}

/* ── בחירת שלב ── */
function selectBoostLevel(lvl){
  _selectedBoostLevel = lvl;
  // עובר רק על הכרטיסיות שנוצרו בפועל ב-DOM
  document.querySelectorAll('.boost-level-card').forEach(card => {
    const cardLvl = parseInt(card.id.replace('bcard-', ''));
    const check   = document.getElementById('bcheck-' + cardLvl);
    card.classList.toggle('selected', cardLvl === lvl);
    if(check) check.style.display = cardLvl === lvl ? 'flex' : 'none';
  });
}

/* ── אישור והפעלת הבוסט ── */
function confirmBoostDay(){
  if(!_selectedBoostLevel){ toast('בחר שלב בוסט קודם'); return; }
  const lvl   = _selectedBoostLevel;
  const today = new Date().toDateString();
  S.boostDay  = { date: today, level: lvl, originalLevel: S.level };
  save();
  closeModal('modal-boost-day');
  applyBoostMode(true, lvl);
  renderToday();
  toast(`⚡ יום בוסט שלב ${lvl} הופעל! 🚀`);
  if(navigator.vibrate) navigator.vibrate([40,20,40,20,60]);
}

/* ── החלת צבעים ועדכון badge ── */
function applyBoostMode(active, lvl){
  document.body.classList.toggle('boost-active', !!active);
  const badge = document.getElementById('boost-day-badge');
  if(!badge) return;
  if(active){
    badge.className   = 'boost-badge active';
    badge.textContent = `⚡ בוסט שלב ${lvl} פעיל`;
  } else {
    const lock = boostLockStatus();
    if(lock.locked){
      badge.className   = 'boost-badge locked';
      badge.textContent = `🔒 בוסט נעול (${lock.daysLeft}י)`;
    } else {
      badge.className   = 'boost-badge';
      badge.textContent = '⚡ יום בוסט';
    }
  }
}

/* ── באנר מצב בוסט פעיל (קריאה מתוך renderToday) ── */
function renderBoostBanner(){
  const wrap = document.getElementById('boost-day-active-wrap');
  if(!wrap) return;
  const b = boostActiveToday();
  if(!b){ wrap.innerHTML=''; return; }
  const tasks = getTasksForDay(b.level, getDayType(new Date()));
  const done  = tasks.filter(t=>S.done[t.id]).length;
  const pct   = tasks.length ? Math.round(done/tasks.length*100) : 0;
  const ok    = pct >= 80;
  const d     = _boostLevelDesc(b.level);
  wrap.innerHTML = `<div class="boost-active-banner">
    <div style="font-size:26px">${d.emoji}</div>
    <div style="flex:1">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
        <div style="font-size:13px;font-weight:900;color:var(--orange)">⚡ יום בוסט פעיל</div>
        <div class="boost-level-pill">שלב ${b.level}</div>
      </div>
      <div style="font-size:11px;color:var(--txt3)">משימות ברמה ${b.level} • ${done}/${tasks.length} (${pct}%)${ok?' ✅ מעל 80%!':''}</div>
      <div style="height:4px;background:var(--sf3);border-radius:99px;margin-top:6px;overflow:hidden">
        <div style="height:100%;width:${pct}%;background:${ok?'var(--green)':'var(--orange)'};border-radius:99px;transition:width .6s"></div>
      </div>
    </div>
  </div>`;
}

/* ── בדיקת תוצאת בוסט אתמול (קריאה מתחילת ROLLOVER) ── */
function _checkBoostRollover(yesterdayBoost){
  if(!yesterdayBoost) return;
  const boostLvl = yesterdayBoost.level;
  const origLvl  = yesterdayBoost.originalLevel;
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate()-1);
  const yTasks    = getTasksForDay(boostLvl, getDayType(yesterday));
  const yDateStr  = yesterday.toDateString();
  const yHist     = S.history.find(h=>h.date===yDateStr);
  const yDone     = yHist ? yTasks.filter(t=>(yHist.doneTasks||{})[t.id]).length : 0;
  const yPct      = yTasks.length ? yDone/yTasks.length : 0;

  if(yPct >= 0.8){
    // הצלחה — עלייה אוטומטית לשלב הבא
    if(origLvl < MAX_LVL){
      S.level       = Math.min(origLvl + 1, MAX_LVL);
      S.streak      = 0;
      S.stagePoints = 0;
      pendingLU     = S.level;
    }
    toast('⚡ בוסט הצליח! עלית אוטומטית לשלב ' + S.level + ' 🎉');
  } else {
    // כישלון — נעל לשבוע
    const lockUntil = new Date();
    lockUntil.setDate(lockUntil.getDate() + BOOST_LOCK_DAYS);
    S.boostLockUntil = lockUntil.toISOString();
  }
  delete S.boostDay;
}
