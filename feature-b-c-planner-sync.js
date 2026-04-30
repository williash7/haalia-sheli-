/* ═══════════════════════════════════════════════════════════════════
   פיצ'ר ב — שעת יומן משתנה → מתעדכנת גם בדף הבית (ליום הזה בלבד)
   פיצ'ר ג — הוספת משימות ביומן פותחת את המודאל הרגיל
═══════════════════════════════════════════════════════════════════ */


/* ═══════════════════════════════════════
   פיצ'ר ב — PLANNER.JS — שינויים
═══════════════════════════════════════ */

/* ─── שינוי 1: _plTaskTime — שמירת אוברריד לפי תאריך ───
   
   מצא את השורה:
     if(S.plannerTimeOverrides&&S.plannerTimeOverrides[t.id])
       return S.plannerTimeOverrides[t.id];
   
   החלף ב:
*/
function _plTaskTime_NEW(t){
  // בדוק אוברריד לפי תאריך היום
  const ds = _plDate ? _plDate.toDateString() : new Date().toDateString();
  const todayOv = S.plannerTimeOverrides && S.plannerTimeOverrides[ds];
  if(todayOv && todayOv[t.id]) return todayOv[t.id];

  // תמיכה בפורמט הישן (flat) — migration
  if(S.plannerTimeOverrides && typeof S.plannerTimeOverrides[t.id] === 'string')
    return S.plannerTimeOverrides[t.id];

  // חלץ מהטקסט — כולל 'until' כי "עד 9:00" פירושו השעה הרלוונטית
  if(t.text){
    if(typeof extractStartTimeFromText==='function'){
      const ex=extractStartTimeFromText(t.text);
      if(ex&&ex.time)return ex.time;
    }
    const m=t.text.match(/\b(\d{1,2}):(\d{2})\b/);
    if(m){
      const h=parseInt(m[1]),mn=parseInt(m[2]);
      if(h>=0&&h<=23&&mn>=0&&mn<=59)
        return `${String(h).padStart(2,'0')}:${String(mn).padStart(2,'0')}`;
    }
  }
  return t.time||null;
}

/* ─── שינוי 2: _plSaveEdit — שמור אוברריד לפי תאריך ───
   
   מצא את הבלוק:
     if(type==='task'){
       if(!S.plannerTimeOverrides)S.plannerTimeOverrides={};
       S.plannerTimeOverrides[id]=time;
       if(!S.plannerDurOverrides)S.plannerDurOverrides={};
       S.plannerDurOverrides[id]=dur;
       if(typeof save==='function')save();
     }
   
   החלף ב:
*/
function _plSaveEdit_NEW(id, type){
  const time = document.getElementById('pl-e-time')?.value;
  const dur  = parseInt(document.getElementById('pl-e-dur')?.value)||30;
  if(!time) return;

  if(type==='task'){
    const ds = _plDate ? _plDate.toDateString() : new Date().toDateString();

    // שמור שעה לפי תאריך
    if(!S.plannerTimeOverrides) S.plannerTimeOverrides = {};
    if(typeof S.plannerTimeOverrides !== 'object' || Array.isArray(S.plannerTimeOverrides))
      S.plannerTimeOverrides = {};
    if(!S.plannerTimeOverrides[ds]) S.plannerTimeOverrides[ds] = {};
    S.plannerTimeOverrides[ds][id] = time;

    // שמור משך לפי תאריך
    if(!S.plannerDurOverrides) S.plannerDurOverrides = {};
    if(!S.plannerDurOverrides[ds]) S.plannerDurOverrides[ds] = {};
    S.plannerDurOverrides[ds][id] = dur;

    if(typeof save==='function') save();

    // עדכן גם את דף הבית אם זה היום
    if(ds === new Date().toDateString() && typeof renderActive==='function') {
      setTimeout(renderActive, 80);
    }
  } else {
    // אירוע — נשאר אותו דבר
    const ds2=_plDate.toDateString();
    const evs=_plCustEvs(ds2);
    const ev=evs.find(e=>e.id===id);
    if(ev){ev.time=time;ev.duration=dur;_plSaveEvs(ds2,evs);}
  }
  _plCloseModal();
  _plBlocks();_plBar();
  if(typeof toast==='function')toast('✅ שמור!');
}


/* ─── שינוי 3: גרירת בלוק — אותה לוגיקה לשמירה לפי תאריך ───
   
   מצא את:
     if(!S.plannerTimeOverrides)S.plannerTimeOverrides={};
     S.plannerTimeOverrides[id]=nt;
   
   החלף ב:
     const _dragDs = _plDate ? _plDate.toDateString() : new Date().toDateString();
     if(!S.plannerTimeOverrides)S.plannerTimeOverrides={};
     if(!S.plannerTimeOverrides[_dragDs]) S.plannerTimeOverrides[_dragDs]={};
     S.plannerTimeOverrides[_dragDs][id]=nt;
*/


/* ─── שינוי 4: _plResetTime — מחיקה לפי תאריך ───
   
   מצא:
     if(S.plannerTimeOverrides)delete S.plannerTimeOverrides[id];
     if(S.plannerDurOverrides) delete S.plannerDurOverrides[id];
   
   החלף ב:
     const _rDs = _plDate ? _plDate.toDateString() : new Date().toDateString();
     if(S.plannerTimeOverrides&&S.plannerTimeOverrides[_rDs]) delete S.plannerTimeOverrides[_rDs][id];
     if(S.plannerDurOverrides&&S.plannerDurOverrides[_rDs])  delete S.plannerDurOverrides[_rDs][id];
*/


/* ═══════════════════════════════════════
   פיצ'ר ב — APP.JS — עדכון דף הבית
═══════════════════════════════════════ */

/* ─── שינוי 5: _renderTaskHtml — הצג שעה מהפלאנר של היום ───
   
   מצא את השורות (בתוך _renderTaskHtml):
     const autoTime = grpForTime
       ? getTaskAutoTimeInfo(grpForTime, t._displayLevel || getTaskDisplayLevel(_masteryBid(grpId))).displayTime
       : t.time;
     const timeTag = autoTime ? ...
   
   החלף ב:
*/
function _getDisplayTime_forTask(t, grpId, grpForTime) {
  // 1. בדוק אוברריד ביומן להיום
  const todayDS = new Date().toDateString();
  const plOv = S.plannerTimeOverrides;
  let plannerToday = null;
  if(plOv && plOv[todayDS] && plOv[todayDS][t.id]) {
    plannerToday = plOv[todayDS][t.id];
  }
  // 2. fallback לשעה הרגילה
  const autoTime = grpForTime
    ? getTaskAutoTimeInfo(grpForTime, t._displayLevel || getTaskDisplayLevel(_masteryBid(grpId))).displayTime
    : t.time;

  return plannerToday || autoTime || null;
}
/* אחרי שמגדירים את autoTime, שנה את השורה ל:
   const displayTime = _getDisplayTime_forTask(t, grpId, grpForTime);
   const timeTag = displayTime ? `<span class="task-time-badge">${displayTime}</span>` : '';
   (שנה כל שימוש ב-autoTime ל-displayTime בבלוק הזה)
*/


/* ═══════════════════════════════════════
   פיצ'ר ג — PLANNER.JS — הוסף משימה קיימת מהיומן
═══════════════════════════════════════ */

/* ─── שינוי 6: _plSlotClick — פתח תפריט בחירה ───
   
   מצא:
     function _plSlotClick(time){if(!_plDragging)_plNewEvPop(time);}
   
   החלף ב:
*/
function _plSlotClick_NEW(time){
  if(_plDragging) return;
  _plOpenModal(`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <div style="font-size:15px;font-weight:900;color:var(--txt)">➕ הוסף ליומן</div>
      <button onclick="_plCloseModal()" style="width:28px;height:28px;border-radius:50%;background:var(--bg3);border:1px solid var(--brd2);color:var(--txt2);cursor:pointer">✕</button>
    </div>

    <button onclick="_plCloseModal();_plNewEvPop('${time}')"
      style="width:100%;padding:13px;background:var(--bg3);border:1.5px solid var(--brd2);border-radius:12px;
             color:var(--txt);font-size:13px;font-weight:800;cursor:pointer;text-align:right;margin-bottom:10px;
             font-family:'Heebo',sans-serif;display:flex;align-items:center;gap:10px">
      <span style="font-size:20px">📅</span>
      <div>
        <div>אירוע חדש</div>
        <div style="font-size:11px;font-weight:500;color:var(--txt3)">פגישה, ביקור, תזכורת אישית</div>
      </div>
    </button>

    <button onclick="_plCloseModal();_plOpenAddExistingTask('${time}')"
      style="width:100%;padding:13px;background:rgba(45,212,191,.07);border:1.5px solid rgba(45,212,191,.3);border-radius:12px;
             color:var(--teal);font-size:13px;font-weight:800;cursor:pointer;text-align:right;
             font-family:'Heebo',sans-serif;display:flex;align-items:center;gap:10px">
      <span style="font-size:20px">✅</span>
      <div>
        <div>הוסף ממשימות קיימות</div>
        <div style="font-size:11px;font-weight:500;color:var(--txt3)">הוסף שעה למשימה מדף הבית</div>
      </div>
    </button>
  `);
}

/* ─── שינוי 7: הוסף פונקציה חדשה _plOpenAddExistingTask ───
   (הוסף אחרי _plSlotClick)
*/
function _plOpenAddExistingTask(defaultTime) {
  const dayType = typeof getDayType === 'function' ? getDayType(_plDate) : 'weekday';
  let tasks = [];
  if(typeof getTasksWithIndivLevel === 'function') {
    tasks = getTasksWithIndivLevel(S.level);
  } else if(typeof getTasks === 'function') {
    tasks = getTasks(S.level);
  }
  tasks = tasks.filter(t => (t.days||['weekday']).includes(dayType));

  // הפרד: יש שעה / אין שעה
  const withTime = tasks.filter(t => _plTaskTime(t));
  const withoutTime = tasks.filter(t => !_plTaskTime(t));

  const mkRow = t => {
    const bid = typeof _baseId==='function' ? _baseId(t.id) : t.id.replace(/_\d+$/,'');
    const isDone = !!(S.done && S.done[t.id]);
    const tm = _plTaskTime(t) || '';
    const safeId = t.id.replace(/'/g,"\\'");
    return `<div onclick="_plSetTaskTimeFromSlot('${safeId}','${defaultTime||'09:00'}')"
      style="display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:10px;
             border:1px solid var(--brd);background:${isDone?'var(--green3)':'var(--surface)'};
             cursor:pointer;margin-bottom:6px;transition:background .12s"
      onmouseenter="this.style.borderColor='var(--teal)'"
      onmouseleave="this.style.borderColor='var(--brd)'">
      <span style="font-size:16px">${isDone?'✅':'⬜'}</span>
      <div style="flex:1">
        <div style="font-size:12px;font-weight:700;color:var(--txt)">${t.text||''}</div>
        ${tm ? `<div style="font-size:10px;color:var(--teal)">⏰ ${tm}</div>` : ''}
      </div>
      <span style="font-size:10px;font-weight:800;color:var(--gold)">${t.pts||''}נ</span>
    </div>`;
  };

  const section = (title, list) => list.length ?
    `<div style="font-size:10px;font-weight:800;color:var(--txt3);text-transform:uppercase;letter-spacing:.7px;margin:10px 0 6px">${title}</div>
     ${list.map(mkRow).join('')}` : '';

  _plOpenModal(`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
      <div style="font-size:14px;font-weight:900;color:var(--txt)">✅ בחר משימה להוסיף לשעה ${defaultTime||''}</div>
      <button onclick="_plCloseModal()" style="width:28px;height:28px;border-radius:50%;background:var(--bg3);border:1px solid var(--brd2);color:var(--txt2);cursor:pointer">✕</button>
    </div>
    <div style="font-size:11px;color:var(--txt3);margin-bottom:10px">לחץ על משימה כדי לשריין אותה לשעה ${defaultTime||''} ביומן.</div>
    <div style="max-height:55vh;overflow-y:auto">
      ${section('🕐 משימות עם שעה', withTime)}
      ${section('📋 משימות ללא שעה', withoutTime)}
      ${(!withTime.length && !withoutTime.length) ? '<div style="text-align:center;padding:20px;color:var(--txt3)">אין משימות זמינות</div>' : ''}
    </div>
  `);
}

function _plSetTaskTimeFromSlot(taskId, time) {
  const ds = _plDate ? _plDate.toDateString() : new Date().toDateString();
  if(!S.plannerTimeOverrides) S.plannerTimeOverrides = {};
  if(!S.plannerTimeOverrides[ds]) S.plannerTimeOverrides[ds] = {};
  S.plannerTimeOverrides[ds][taskId] = time;
  if(typeof save === 'function') save();
  _plCloseModal();
  _plBlocks(); _plBar();
  // עדכן גם דף הבית אם זה היום
  if(ds === new Date().toDateString() && typeof renderActive === 'function')
    setTimeout(renderActive, 80);
  if(typeof toast === 'function') toast(`✅ המשימה נוספה לשעה ${time}`);
}
