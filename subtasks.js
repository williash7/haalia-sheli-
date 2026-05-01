/* ═══════════════════════════════════════════════════════════════════
   subtasks.js — מערכת תת-משימות ושילוב משימות
   פיצ'רים ד, ה, ו
   
   הוסף קובץ זה לפרויקט ו-<script src="subtasks.js"></script> ב-index.html
   (אחרי app.js)
═══════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════
   מבנה הנתונים (נשמר ב-S)
═══════════════════════════════

S.subTasks = {
  'grp_z1': [
    {
      id: 'sub_1234567890',       // מזהה ייחודי
      text: 'קריאת פרק ראשון',    // טקסט תת-המשימה
      scope: 'once'|'level'|'all', // חד-פעמי / לשלב זה / לכל השלבים
      pointMode: 'divide'|'add',   // חלוקת נקודות קיימות / תוספת נקודות
      extraPts: 0,                 // נקודות שמתווספות (רק אם pointMode='add')
      progressMode: 'same'|'separate', // אחוז ההתקדמות — אותה משימה / נפרדת
      timeMode: 'none'|'divide',   // חלוקה לפי זמן
      timeMins: 0,                 // דקות (אם timeMode='divide')
      order: 0                     // סדר תצוגה
    }
  ]
}

S.taskMerges = [
  {
    id: 'merge_1234567890',
    mainGrpId: 'grp_z1',           // המשימה הראשית
    subs: [
      {
        grpId: 'grp_z2',           // משימה שהפכה לתת-משימה
        scope: 'all',
        pointMode: 'divide',
        progressMode: 'same',
        timeMode: 'none'
      }
    ]
  }
]
*/

/* ═══════════════════════════════
   HELPERS
═══════════════════════════════ */

function _stGetSubs(grpId) {
  if(!S.subTasks) return [];
  return (S.subTasks[grpId] || []).slice().sort((a,b) => (a.order||0)-(b.order||0));
}

function _stSaveSubs(grpId, subs) {
  if(!S.subTasks) S.subTasks = {};
  S.subTasks[grpId] = subs;
  if(typeof save === 'function') save();
}

function _stGetMerge(grpId) {
  if(!S.taskMerges) return null;
  return S.taskMerges.find(m => m.mainGrpId === grpId) || null;
}

function _stIsSubOf(grpId) {
  // בדוק אם משימה זו היא תת-משימה של אחרת (דרך שילוב)
  if(!S.taskMerges) return null;
  for(const m of S.taskMerges) {
    if(m.subs && m.subs.some(s => s.grpId === grpId)) return m.mainGrpId;
  }
  return null;
}

function _stSubDoneKey(grpId, subId) {
  return `sub_${grpId}_${subId}_${new Date().toDateString()}`;
}

function _stIsSubDone(grpId, subId) {
  return !!(S.done && S.done[_stSubDoneKey(grpId, subId)]);
}

function _stToggleSubDone(grpId, subId) {
  const key = _stSubDoneKey(grpId, subId);
  if(!S.done) S.done = {};
  const wasDone = !!S.done[key];

  if(wasDone) {
    delete S.done[key];
  } else {
    S.done[key] = true;
  }

  // מצא את נתוני תת-המשימה
  const subs = _stGetSubs(grpId);
  const sub = subs.find(s => s.id === subId);

  if(sub) {
    const lvl = S.level || 1;
    const allGroups = (typeof getGroups==='function' ? getGroups() : null) ||
                      (typeof builtinGroups==='function' ? builtinGroups() : []) || [];
    const grp = allGroups.find(g => g.id === grpId || g.id === grpId.replace(/^grp_/,'') || 'grp_'+g.id === grpId);
    const rawPts = grp && grp.levels && grp.levels[lvl-1] ? grp.levels[lvl-1].pts : 0;

    // חלוקת ניקוד — כשמסמנים תת-משימה שמחלקת נקודות
    if(sub.pointMode === 'divide' && rawPts > 0) {
      const allSubs = subs.filter(s => s.pointMode === 'divide');
      const totalParts = allSubs.length + 1; // תת-משימות + המשימה הראשית
      const ptsPerPart = Math.floor((typeof bonusPts==='function' ? bonusPts(rawPts) : rawPts) / totalParts);

      // שמור נקודות לתת-משימה זו (לחישוב ב-calcDayPts)
      if(!S.subTaskPts) S.subTaskPts = {};
      const today = typeof todayStr==='function' ? todayStr() : new Date().toDateString();
      if(!wasDone) {
        S.subTaskPts[key] = { pts: ptsPerPart, grpId, date: today };
        if(typeof toast==='function') toast(`+${ptsPerPart} ✓`);
      } else {
        delete S.subTaskPts[key];
      }
    }

    // progressMode='same' — סמן משימת האם כבוצעה אם כל תתי-המשימות בוצעו
    if(sub.progressMode === 'same') {
      const mainTaskId = grpId + '_' + lvl;
      const allSubsDone = subs.every(s => {
        const k = _stSubDoneKey(grpId, s.id);
        return !!S.done[k];
      });
      if(allSubsDone) {
        S.done[mainTaskId] = true;
        if(!wasDone && typeof toast==='function') toast('✅ כל תת-המשימות בוצעו!');
      } else {
        delete S.done[mainTaskId];
      }
    }
  }

  if(typeof save === 'function') save();
  if(typeof renderActive === 'function') renderActive();
}

function _stDeleteSub(grpId, subId) {
  const subs = _stGetSubs(grpId);
  _stSaveSubs(grpId, subs.filter(s => s.id !== subId));
  // מחק גם את מצב ה-done
  const key = _stSubDoneKey(grpId, subId);
  if(S.done) delete S.done[key];
  if(typeof save==='function') save();
  if(typeof renderActive==='function') renderActive();
}

/* ═══════════════════════════════
   פיצ'ר ד — מודאל הוספת תת-משימה
═══════════════════════════════ */

function openAddSubtaskModal(grpId) {
  // הכן את ה-DOM של המודאל (נוסף דינמית)
  let modal = document.getElementById('modal-subtask-add');
  if(!modal) {
    modal = document.createElement('div');
    modal.className = 'bs-bg';
    modal.id = 'modal-subtask-add';
    modal.onclick = function(e){ if(e.target===this) closeModal('modal-subtask-add'); };
    modal.innerHTML = `
      <div class="bs-sheet" style="max-height:90vh;overflow-y:auto">
        <div class="bs-handle"></div>
        <div class="bs-header">
          <div class="bs-title">➕ תת-משימה חדשה</div>
          <button class="bs-close" onclick="closeModal('modal-subtask-add')">✕</button>
        </div>
        <div id="subtask-add-body"></div>
      </div>`;
    document.body.appendChild(modal);
  }

const allGroups = (typeof getGroups==='function' ? getGroups() : null) || (typeof builtinGroups==='function' ? builtinGroups() : []) || [];
const grp = allGroups.find(g=>g.id===grpId) || allGroups.find(g=>g.id==='grp_'+grpId.replace(/^grp_/,''));
  const grpTitle = (grp && grp.title) || grpId;
  const curLevel = S.level;

  document.getElementById('subtask-add-body').innerHTML = `
    <input type="hidden" id="sta-grp-id" value="${grpId}">

    <!-- טקסט תת-המשימה -->
    <div style="margin-bottom:14px">
      <div style="font-size:10px;font-weight:800;color:var(--txt3);text-transform:uppercase;letter-spacing:.7px;margin-bottom:5px">📝 טקסט תת-המשימה</div>
      <input id="sta-text" placeholder="למשל: קריאת פרק אחד, 10 דקות עיון..." maxlength="80"
        style="width:100%;background:var(--bg3);border:1px solid var(--brd2);border-radius:9px;color:var(--txt);font-family:'Heebo',sans-serif;font-size:13px;padding:10px 13px;outline:none;box-sizing:border-box">
    </div>

    <!-- שאלה א: היקף -->
    <div style="background:rgba(45,212,191,.06);border:1px solid rgba(45,212,191,.2);border-radius:12px;padding:12px 14px;margin-bottom:12px">
      <div style="font-size:11px;font-weight:800;color:var(--teal);margin-bottom:8px">א. היקף תת-המשימה</div>
      <div style="display:flex;flex-direction:column;gap:7px">
        ${_stScopeOption('once','חד-פעמי','רק פעם אחת, לא חוזר','📌')}
        ${_stScopeOption('level','לשלב הנוכחי בלבד','תופיע רק בשלב '+curLevel,'🎯')}
        ${_stScopeOption('all','לכל השלבים','תופיע תמיד, בכל שלב','♾️', true)}
      </div>
    </div>

    <!-- שאלה ב: נקודות -->
    <div style="background:rgba(240,192,64,.06);border:1px solid rgba(240,192,64,.2);border-radius:12px;padding:12px 14px;margin-bottom:12px">
      <div style="font-size:11px;font-weight:800;color:var(--gold);margin-bottom:8px">ב. נקודות</div>
      <div style="display:flex;flex-direction:column;gap:7px">
        ${_stPtsOption('divide','חלוקת הנקודות הקיימות','המשימה הראשית תחולק ביניהן','✂️', true)}
        ${_stPtsOption('add','תוספת נקודות','תת-המשימה מקבלת נקודות נפרדות','➕')}
      </div>
      <div id="sta-extra-pts-row" style="display:none;margin-top:10px">
        <input id="sta-extra-pts" type="number" min="1" max="999" placeholder="כמה נקודות?"
          style="width:100%;background:var(--bg3);border:1px solid var(--gold2);border-radius:9px;color:var(--gold);font-family:'Heebo',sans-serif;font-size:14px;font-weight:800;padding:9px 13px;outline:none;box-sizing:border-box;text-align:center">
      </div>
    </div>

    <!-- שאלה ג: התקדמות -->
    <div style="background:rgba(91,141,248,.06);border:1px solid rgba(91,141,248,.2);border-radius:12px;padding:12px 14px;margin-bottom:12px">
      <div style="font-size:11px;font-weight:800;color:var(--blue);margin-bottom:8px">ג. אחוזי התקדמות</div>
      <div style="display:flex;flex-direction:column;gap:7px">
        ${_stProgOption('same','חלק מאותה המשימה','ביצוע תת-המשימה מקדם את המשימה הראשית','🔗', true)}
        ${_stProgOption('separate','משימה נפרדת','תוצג בנפרד עם צ׳קבוקס משלה','📦')}
      </div>
    </div>

    <!-- שאלה ד: חלוקה לפי זמן -->
    <div style="background:rgba(155,126,248,.06);border:1px solid rgba(155,126,248,.2);border-radius:12px;padding:12px 14px;margin-bottom:16px">
      <div style="font-size:11px;font-weight:800;color:var(--purple);margin-bottom:8px">ד. חלוקה לפי זמן (אופציונלי)</div>
      <div style="display:flex;flex-direction:column;gap:7px">
        ${_stTimeOption('none','ללא חלוקת זמן','','⏩', true)}
        ${_stTimeOption('divide','הקצה זמן ספציפי לתת-משימה','','⏱️')}
      </div>
      <div id="sta-time-mins-row" style="display:none;margin-top:10px">
        <input id="sta-time-mins" type="number" min="1" max="480" step="5" placeholder="כמה דקות?"
          style="width:100%;background:var(--bg3);border:1px solid rgba(155,126,248,.4);border-radius:9px;color:var(--purple);font-family:'Heebo',sans-serif;font-size:14px;font-weight:800;padding:9px 13px;outline:none;box-sizing:border-box;text-align:center">
      </div>
    </div>

    <button onclick="saveSubtask()"
      style="width:100%;padding:13px;background:linear-gradient(135deg,var(--teal),var(--blue));color:#fff;border:none;border-radius:var(--r-sm);font-size:13px;font-weight:900;cursor:pointer;font-family:'Heebo',sans-serif">
      הוסף תת-משימה ✓
    </button>
  `;

  openModal('modal-subtask-add');
}

function _stScopeOption(val, title, desc, icon, checked=false) {
  return `<label style="display:flex;align-items:center;gap:10px;padding:8px 11px;background:var(--bg3);border:1px solid var(--brd);border-radius:9px;cursor:pointer">
    <input type="radio" name="sta-scope" value="${val}" ${checked?'checked':''} style="accent-color:var(--teal);width:16px;height:16px">
    <span style="font-size:16px">${icon}</span>
    <div>
      <div style="font-size:12px;font-weight:800;color:var(--txt)">${title}</div>
      <div style="font-size:10px;color:var(--txt3)">${desc}</div>
    </div>
  </label>`;
}
function _stPtsOption(val, title, desc, icon, checked=false) {
  const extra = val==='add' ? `onchange="document.getElementById('sta-extra-pts-row').style.display=this.checked?'block':'none'"` : `onchange="document.getElementById('sta-extra-pts-row').style.display='none'"`;
  return `<label style="display:flex;align-items:center;gap:10px;padding:8px 11px;background:var(--bg3);border:1px solid var(--brd);border-radius:9px;cursor:pointer">
    <input type="radio" name="sta-pts" value="${val}" ${checked?'checked':''} ${extra} style="accent-color:var(--gold);width:16px;height:16px">
    <span style="font-size:16px">${icon}</span>
    <div>
      <div style="font-size:12px;font-weight:800;color:var(--txt)">${title}</div>
      <div style="font-size:10px;color:var(--txt3)">${desc}</div>
    </div>
  </label>`;
}
function _stProgOption(val, title, desc, icon, checked=false) {
  return `<label style="display:flex;align-items:center;gap:10px;padding:8px 11px;background:var(--bg3);border:1px solid var(--brd);border-radius:9px;cursor:pointer">
    <input type="radio" name="sta-prog" value="${val}" ${checked?'checked':''} style="accent-color:var(--blue);width:16px;height:16px">
    <span style="font-size:16px">${icon}</span>
    <div>
      <div style="font-size:12px;font-weight:800;color:var(--txt)">${title}</div>
      <div style="font-size:10px;color:var(--txt3)">${desc}</div>
    </div>
  </label>`;
}
function _stTimeOption(val, title, desc, icon, checked=false) {
  const extra = val==='divide' ? `onchange="document.getElementById('sta-time-mins-row').style.display=this.checked?'block':'none'"` : `onchange="document.getElementById('sta-time-mins-row').style.display='none'"`;
  return `<label style="display:flex;align-items:center;gap:10px;padding:8px 11px;background:var(--bg3);border:1px solid var(--brd);border-radius:9px;cursor:pointer">
    <input type="radio" name="sta-time" value="${val}" ${checked?'checked':''} ${extra} style="accent-color:var(--purple);width:16px;height:16px">
    <span style="font-size:16px">${icon}</span>
    <div>
      <div style="font-size:12px;font-weight:800;color:var(--txt)">${title}</div>
      ${desc?`<div style="font-size:10px;color:var(--txt3)">${desc}</div>`:''}
    </div>
  </label>`;
}

function saveSubtask() {
  const grpId = document.getElementById('sta-grp-id')?.value;
  const text   = (document.getElementById('sta-text')?.value||'').trim();
  if(!text) { if(typeof toast==='function') toast('חובה להזין טקסט'); return; }

  const scope       = document.querySelector('input[name="sta-scope"]:checked')?.value || 'all';
  const pointMode   = document.querySelector('input[name="sta-pts"]:checked')?.value || 'divide';
  const progressMode= document.querySelector('input[name="sta-prog"]:checked')?.value || 'same';
  const timeMode    = document.querySelector('input[name="sta-time"]:checked')?.value || 'none';
  const extraPts    = pointMode==='add' ? (parseInt(document.getElementById('sta-extra-pts')?.value)||0) : 0;
  const timeMins    = timeMode==='divide' ? (parseInt(document.getElementById('sta-time-mins')?.value)||0) : 0;

  const subs = _stGetSubs(grpId);
  subs.push({
    id: 'sub_' + Date.now(),
    text, scope, pointMode, extraPts, progressMode, timeMode, timeMins,
    order: subs.length,
    createdLevel: S.level
  });
  _stSaveSubs(grpId, subs);

  if(typeof closeModal==='function') closeModal('modal-subtask-add');
  if(typeof renderActive==='function') renderActive();
  if(typeof toast==='function') toast('✅ תת-משימה נוספה!');
}


/* ═══════════════════════════════
   פיצ'ר ה — הצגת תת-משימות ברינדור
   (הוסף לאחר כל card של משימה)
═══════════════════════════════ */

function renderSubtasksForTask(t, grpId) {
  const bid  = typeof _baseId==='function' ? _baseId(t.id) : t.id.replace(/_\d+$/,'');
const gId  = grpId || (bid.startsWith('grp_') ? bid : 'grp_' + bid);
  const subs = _stGetSubs(gId);
  const curLevel = S.level;

  // סנן לפי היקף
  const relevant = subs.filter(s => {
    if(s.scope === 'once') {
      // הצג רק אם עדיין לא בוצע כלל (לא today — לכל הזמנים)
      return !S.done || !Object.keys(S.done).some(k=>k.startsWith(`sub_${gId}_${s.id}`));
    }
    if(s.scope === 'level') return s.createdLevel === curLevel;
    return true; // 'all'
  });

  if(!relevant.length) return '';

  const rows = relevant.map(s => {
    const done = _stIsSubDone(gId, s.id);
    const safeGId = gId.replace(/'/g,"\\'");
    const safeSId = s.id.replace(/'/g,"\\'");
    const timeLabel = s.timeMode==='divide' && s.timeMins ? `<span style="font-size:10px;color:var(--purple)">⏱ ${s.timeMins} דק'</span>` : '';
    const ptsLabel  = s.pointMode==='add' && s.extraPts ? `<span style="font-size:10px;color:var(--gold)">+${s.extraPts}נ</span>` : '';
    const sepLabel  = s.progressMode==='separate' ? `<span style="font-size:9px;background:rgba(91,141,248,.15);color:var(--blue);border-radius:4px;padding:1px 5px">נפרד</span>` : '';

return `<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:8px;
      background:${done?'rgba(56,214,138,.07)':'rgba(255,255,255,.02)'};
      border:1px solid ${done?'rgba(56,214,138,.2)':'var(--brd)'};
      margin-bottom:5px">
      <div style="display:flex;align-items:center;gap:8px;flex:1;cursor:pointer"
        onclick="event.stopPropagation();_stToggleSubDone('${safeGId}','${safeSId}')">
        <div style="width:16px;height:16px;border-radius:4px;border:1.5px solid ${done?'var(--green2)':'var(--brd2)'};
          background:${done?'var(--green2)':'transparent'};flex-shrink:0;display:flex;align-items:center;justify-content:center">
          ${done?'<svg width="10" height="10" viewBox="0 0 20 20" fill="white"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>':''}
        </div>
        <div style="flex:1;font-size:11px;font-weight:600;color:${done?'var(--txt3)':'var(--txt)'};${done?'text-decoration:line-through':''}">
          ${s.text}
        </div>
        <div style="display:flex;gap:4px;align-items:center">${timeLabel}${ptsLabel}${sepLabel}</div>
      </div>
      <button onclick="event.stopPropagation();_stDeleteSub('${safeGId}','${safeSId}')"
        style="font-size:12px;color:var(--red);background:rgba(240,80,80,.1);border:1px solid rgba(240,80,80,.2);
               border-radius:5px;padding:2px 6px;cursor:pointer;flex-shrink:0">🗑</button>
    </div>`;
  }).join('');

  const safeGId2 = gId.replace(/'/g,"\\'");
  return `<div class="subtasks-container" style="margin-top:4px;padding:6px 8px;background:var(--bg3);border-radius:0 0 10px 10px;border:1px solid var(--brd);border-top:none">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
      <span style="font-size:9px;font-weight:800;color:var(--txt3);text-transform:uppercase;letter-spacing:.6px">תת-משימות (${relevant.length})</span>
      <button onclick="event.stopPropagation();openAddSubtaskModal('${safeGId2}')"
        style="font-size:9px;font-weight:800;color:var(--teal);background:rgba(45,212,191,.1);border:1px solid rgba(45,212,191,.3);border-radius:5px;padding:2px 7px;cursor:pointer">+ הוסף</button>
    </div>
    ${rows}
  </div>`;
}

/* הדרכה לשילוב ב-_renderTaskHtml (app.js):
   בסוף הפונקציה, לפני ה-return, הוסף:
   
   const _taskGrpId = t._grpId || (t.id && t.id.includes('_') ? t.id.replace(/_\d+$/,'') : null);
   const _subHtml = typeof renderSubtasksForTask==='function' ? renderSubtasksForTask(t, 'grp_'+_baseId(t.id)) : '';
   
   ואז בה-HTML שמוחזר, הוסף את _subHtml אחרי ה-div הראשי של המשימה.
*/


/* ═══════════════════════════════
   פיצ'ר ו — שילוב משימות
═══════════════════════════════ */

function openMergeTaskModal(mainGrpId) {
  let modal = document.getElementById('modal-task-merge');
  if(!modal) {
    modal = document.createElement('div');
    modal.className = 'bs-bg';
    modal.id = 'modal-task-merge';
    modal.onclick = function(e){ if(e.target===this) closeModal('modal-task-merge'); };
    modal.innerHTML = `
      <div class="bs-sheet" style="max-height:90vh;overflow-y:auto">
        <div class="bs-handle"></div>
        <div class="bs-header">
          <div class="bs-title">🔗 שילוב משימות</div>
          <button class="bs-close" onclick="closeModal('modal-task-merge')">✕</button>
        </div>
        <div id="task-merge-body"></div>
      </div>`;
    document.body.appendChild(modal);
  }

  const groups = (typeof getGroups==='function' ? getGroups() : null) || (typeof builtinGroups==='function' ? builtinGroups() : []);
  const mainGrp = groups.find(g=>g.id===mainGrpId);
  if(!mainGrp) return;

  const existingMerge = _stGetMerge(mainGrpId);
  const alreadyMergedIds = existingMerge ? existingMerge.subs.map(s=>s.grpId) : [];

  const otherGroups = groups.filter(g =>
    g.id !== mainGrpId &&
    !_stIsSubOf(g.id) &&
    !alreadyMergedIds.includes(g.id)
  );

  const existingSubsHtml = existingMerge && existingMerge.subs.length ?
    `<div style="margin-bottom:12px">
      <div style="font-size:10px;font-weight:800;color:var(--txt3);text-transform:uppercase;letter-spacing:.7px;margin-bottom:6px">תת-משימות נוכחיות</div>
      ${existingMerge.subs.map(s => {
        const sg = groups.find(g=>g.id===s.grpId);
        const safeGId = s.grpId.replace(/'/g,"\\'");
        return `<div style="display:flex;align-items:center;gap:8px;padding:8px 11px;background:var(--bg3);border:1px solid var(--brd);border-radius:9px;margin-bottom:5px">
          <span style="font-size:13px">🔗</span>
          <div style="flex:1;font-size:12px;font-weight:700;color:var(--txt)">${sg ? (sg.title || (sg.levels && sg.levels[0] && sg.levels[0].text) || sg.id.replace('grp_','')) : s.grpId}</div>
          <button onclick="_stRemoveMergedSub('${mainGrpId.replace(/'/g,"\\'")}','${safeGId}')"
            style="font-size:10px;color:var(--red);background:rgba(240,80,80,.1);border:1px solid rgba(240,80,80,.2);border-radius:5px;padding:2px 7px;cursor:pointer">הסר</button>
        </div>`;
      }).join('')}
    </div>` : '';

  const candidatesHtml = otherGroups.length ?
    `<div style="margin-bottom:12px">
      <div style="font-size:10px;font-weight:800;color:var(--txt3);text-transform:uppercase;letter-spacing:.7px;margin-bottom:6px">בחר משימה לשילוב</div>
      <div style="max-height:200px;overflow-y:auto">
        ${otherGroups.map(g => {
          const safeId = g.id.replace(/'/g,"\\'");
          const mainSafeId = mainGrpId.replace(/'/g,"\\'");
          return `<div onclick="_stShowMergeOptions('${mainSafeId}','${safeId}')"
            style="display:flex;align-items:center;gap:8px;padding:8px 11px;background:var(--bg3);border:1px solid var(--brd);border-radius:9px;margin-bottom:5px;cursor:pointer;transition:border-color .12s"
            onmouseenter="this.style.borderColor='var(--blue)'"
            onmouseleave="this.style.borderColor='var(--brd)'">
            <span style="font-size:14px">📋</span>
            <div style="flex:1;font-size:12px;font-weight:700;color:var(--txt)">${g.title || (g.levels && g.levels[0] && g.levels[0].text) || g.id.replace('grp_','')}</div>
            <span style="font-size:10px;color:var(--txt3)">בחר ›</span>
          </div>`;
        }).join('')}
      </div>
    </div>` :
    `<div style="text-align:center;padding:16px;color:var(--txt3);font-size:12px">אין משימות פנויות לשילוב</div>`;

  document.getElementById('task-merge-body').innerHTML = `
    <div style="background:rgba(45,212,191,.06);border:1px solid rgba(45,212,191,.2);border-radius:10px;padding:10px 13px;margin-bottom:14px">
      <div style="font-size:11px;font-weight:800;color:var(--teal)">🔗 משימה ראשית: ${mainGrp.title || mainGrpId.replace('grp_','')}</div>
      <div style="font-size:10px;color:var(--txt3);margin-top:3px">המשימות שתבחר יהפכו לתת-משימות שלה</div>
    </div>
    ${existingSubsHtml}
    ${candidatesHtml}
    <div id="merge-options-panel"></div>
  `;

  openModal('modal-task-merge');
}

function _stShowMergeOptions(mainGrpId, subGrpId) {
  const groups = (typeof getGroups==='function' ? getGroups() : null) || (typeof builtinGroups==='function' ? builtinGroups() : []);
  const subGrp = groups.find(g=>g.id===subGrpId);

  document.getElementById('merge-options-panel').innerHTML = `
    <div style="background:rgba(155,126,248,.07);border:1px solid rgba(155,126,248,.25);border-radius:12px;padding:13px;margin-top:8px">
      <div style="font-size:11px;font-weight:800;color:var(--purple);margin-bottom:10px">הגדרות שילוב: ${subGrp ? (subGrp.title||subGrpId.replace('grp_','')) : subGrpId}</div>
      
      <div style="font-size:10px;font-weight:700;color:var(--txt3);margin-bottom:5px">היקף</div>
      <div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap">
        ${['once:חד-פעמי','level:שלב זה','all:כל השלבים'].map((x,i) => {
          const [v,l]=x.split(':');
          return `<label style="display:flex;align-items:center;gap:4px;font-size:11px;font-weight:700;color:var(--txt);cursor:pointer">
            <input type="radio" name="mo-scope" value="${v}" ${i===2?'checked':''} style="accent-color:var(--purple)"> ${l}
          </label>`;
        }).join('')}
      </div>

      <div style="font-size:10px;font-weight:700;color:var(--txt3);margin-bottom:5px">נקודות</div>
      <div style="display:flex;gap:6px;margin-bottom:10px">
        ${['divide:חלוקה','add:תוספת'].map((x,i) => {
          const [v,l]=x.split(':');
          return `<label style="display:flex;align-items:center;gap:4px;font-size:11px;font-weight:700;color:var(--txt);cursor:pointer">
            <input type="radio" name="mo-pts" value="${v}" ${i===0?'checked':''} style="accent-color:var(--gold)"> ${l}
          </label>`;
        }).join('')}
      </div>

      <div style="font-size:10px;font-weight:700;color:var(--txt3);margin-bottom:5px">התקדמות</div>
      <div style="display:flex;gap:6px;margin-bottom:12px">
        ${['same:משותפת','separate:נפרדת'].map((x,i) => {
          const [v,l]=x.split(':');
          return `<label style="display:flex;align-items:center;gap:4px;font-size:11px;font-weight:700;color:var(--txt);cursor:pointer">
            <input type="radio" name="mo-prog" value="${v}" ${i===0?'checked':''} style="accent-color:var(--blue)"> ${l}
          </label>`;
        }).join('')}
      </div>

      <button onclick="_stConfirmMerge('${mainGrpId.replace(/'/g,"\\'")}','${subGrpId.replace(/'/g,"\\'")}') "
        style="width:100%;padding:11px;background:var(--purple);color:#fff;border:none;border-radius:var(--r-sm);font-size:12px;font-weight:800;cursor:pointer;font-family:'Heebo',sans-serif">
        ✅ אשר שילוב
      </button>
    </div>
  `;
}

function _stConfirmMerge(mainGrpId, subGrpId) {
  const scope    = document.querySelector('input[name="mo-scope"]:checked')?.value || 'all';
  const pointMode= document.querySelector('input[name="mo-pts"]:checked')?.value   || 'divide';
  const progMode = document.querySelector('input[name="mo-prog"]:checked')?.value  || 'same';

  if(!S.taskMerges) S.taskMerges = [];
  let merge = S.taskMerges.find(m => m.mainGrpId === mainGrpId);
  if(!merge) {
    merge = { id: 'merge_'+Date.now(), mainGrpId, subs: [] };
    S.taskMerges.push(merge);
  }
  // הסר כפילויות
  merge.subs = merge.subs.filter(s => s.grpId !== subGrpId);
  merge.subs.push({ grpId: subGrpId, scope, pointMode, progressMode: progMode, timeMode: 'none' });

  if(typeof save==='function') save();
  if(typeof renderActive==='function') renderActive();
  if(typeof toast==='function') toast('🔗 משימות שולבו!');
  openMergeTaskModal(mainGrpId); // רענן
}

function _stRemoveMergedSub(mainGrpId, subGrpId) {
  if(!S.taskMerges) return;
  const merge = S.taskMerges.find(m => m.mainGrpId === mainGrpId);
  if(!merge) return;
  merge.subs = merge.subs.filter(s => s.grpId !== subGrpId);
  if(!merge.subs.length) S.taskMerges = S.taskMerges.filter(m => m.mainGrpId !== mainGrpId);
  if(typeof save==='function') save();
  if(typeof renderActive==='function') renderActive();
  openMergeTaskModal(mainGrpId);
}


/* ═══════════════════════════════
   הצגת תת-משימות ממשימות ממוזגות
   (כחלק מ-renderSubtasksForTask)
═══════════════════════════════ */

function renderMergedSubsForTask(t) {
const bid = typeof _baseId==='function' ? _baseId(t.id) : t.id.replace(/_\d+$/,'');
const gId = bid.startsWith('grp_') ? bid : 'grp_' + bid;
  const merge = _stGetMerge(gId);
  if(!merge || !merge.subs.length) return '';

  const groups = (typeof getGroups==='function' ? getGroups() : null) || (typeof builtinGroups==='function' ? builtinGroups() : []);
 const curLevel = S.level || 1;

  const rows = merge.subs.filter(s => {
    if(s.scope === 'level') return s.createdLevel === curLevel;
    return true;
  }).map(s => {
    const sg = groups.find(g=>g.id===s.grpId);
    if(!sg) return '';
    // מצא את גרסת השלב הנוכחי של תת-המשימה
const globalLevel = S.level || 1;
    const lvlData = sg.levels && sg.levels[globalLevel-1] ? sg.levels[globalLevel-1] : {};
    const text = lvlData.text || (sg.title || s.grpId.replace('grp_',''));
    const subTaskId = s.grpId + '_' + globalLevel;
    const done = !!(S.done && S.done[subTaskId]);
    const safeSub = subTaskId.replace(/'/g,"\\'");
    const pts = lvlData.pts || '';

    return `<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:8px;
      background:${done?'rgba(56,214,138,.07)':'rgba(255,255,255,.02)'};
      border:1px solid ${done?'rgba(56,214,138,.2)':'var(--brd)'};
      margin-bottom:5px;cursor:pointer"
      onclick="event.stopPropagation();if(typeof toggleTask==='function')toggleTask('${safeSub}',${typeof bonusPts==='function'?bonusPts(pts):pts})">
      <div style="width:16px;height:16px;border-radius:4px;border:1.5px solid ${done?'var(--green2)':'var(--brd2)'};
        background:${done?'var(--green2)':'transparent'};flex-shrink:0;display:flex;align-items:center;justify-content:center">
        ${done?'<svg width="10" height="10" viewBox="0 0 20 20" fill="white"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>':''}
      </div>
      <div style="flex:1;font-size:11px;font-weight:600;color:${done?'var(--txt3)':'var(--txt)'};${done?'text-decoration:line-through':''}">
        🔗 ${text}
      </div>
      ${pts ? `<span style="font-size:10px;color:var(--gold)">${typeof bonusPts==='function'?bonusPts(pts):pts}נ</span>` : ''}
    </div>`;
  }).join('');

  if(!rows) return '';

  return `<div class="merged-subs-container" style="margin-top:4px;padding:6px 8px;background:rgba(155,126,248,.05);border-radius:0 0 10px 10px;border:1px solid rgba(155,126,248,.2);border-top:none">
    <div style="font-size:9px;font-weight:800;color:var(--purple);text-transform:uppercase;letter-spacing:.6px;margin-bottom:6px">🔗 ממוזג</div>
    ${rows}
  </div>`;
}


/* ═══════════════════════════════
   פיצ'ר ה — משימות חוזרות כתת-משימות
═══════════════════════════════ */

function renderOccurrenceSubtasks(t) {
  // מצא את ה-baseId הנקי (בלי grp_ ובלי _lvl)
  const bid = typeof _baseId==='function' ? _baseId(t.id) : t.id.replace(/_\d+$/,'');
  const cleanBid = bid.replace(/^grp_/,'');

  // בדוק אם זו משימת occurrence
  if(typeof DAILY_OCCURRENCES === 'undefined') return '';
  const lvl = S.level || 1;
  const occArr = DAILY_OCCURRENCES[cleanBid] || DAILY_OCCURRENCES['grp_'+cleanBid];
  if(!occArr) return '';
  const times = occArr[Math.min(lvl,15)-1] || [];
  if(!times.length) return '';

  // קבל מצב ביצוע
  const doneArr = typeof getOccurrenceDoneArr==='function'
    ? (getOccurrenceDoneArr(cleanBid, lvl) || getOccurrenceDoneArr('grp_'+cleanBid, lvl) || new Array(times.length).fill(0))
    : new Array(times.length).fill(0);

  const rows = times.map((time, idx) => {
    const done = !!doneArr[idx];
    const safeCleanBid = cleanBid.replace(/'/g,"\\'");
    return `<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:8px;
      background:${done?'rgba(56,214,138,.07)':'rgba(255,255,255,.02)'};
      border:1px solid ${done?'rgba(56,214,138,.2)':'var(--brd)'};
      margin-bottom:5px;cursor:pointer"
      onclick="event.stopPropagation();_toggleOccurrenceSub('${safeCleanBid}',${idx})">
      <div style="width:16px;height:16px;border-radius:4px;border:1.5px solid ${done?'var(--green2)':'var(--brd2)'};
        background:${done?'var(--green2)':'transparent'};flex-shrink:0;display:flex;align-items:center;justify-content:center">
        ${done?'<svg width="10" height="10" viewBox="0 0 20 20" fill="white"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>':''}
      </div>
      <div style="flex:1;font-size:11px;font-weight:600;color:${done?'var(--txt3)':'var(--txt)'};${done?'text-decoration:line-through':''}">
        פעם ${idx+1}
      </div>
      <span style="font-size:11px;font-weight:700;color:var(--teal)">⏰ ${time}</span>
    </div>`;
  }).join('');

  const doneCount = doneArr.filter(Boolean).length;

  return `<div class="subtasks-container" style="margin-top:4px;padding:6px 8px;background:var(--bg3);border-radius:0 0 10px 10px;border:1px solid var(--brd);border-top:none">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
      <span style="font-size:9px;font-weight:800;color:var(--txt3);text-transform:uppercase;letter-spacing:.6px">חזרות (${doneCount}/${times.length})</span>
    </div>
    ${rows}
  </div>`;
}

function _toggleOccurrenceSub(cleanBid, idx) {
  const lvl = S.level || 1;
  // נסה שניהם
  let arr = typeof getOccurrenceDoneArr==='function' ? getOccurrenceDoneArr(cleanBid, lvl) : null;
  if(!arr) arr = typeof getOccurrenceDoneArr==='function' ? getOccurrenceDoneArr('grp_'+cleanBid, lvl) : null;
  if(!arr) return;

  // החלף מצב
  arr[idx] = arr[idx] ? 0 : 1;

  // שמור
  const effectiveBid = (DAILY_OCCURRENCES[cleanBid] ? cleanBid : 'grp_'+cleanBid);
  if(!S.occurrenceDone) S.occurrenceDone = {};
  const key = typeof _occKey==='function' ? _occKey(effectiveBid) : effectiveBid+'_today';
  S.occurrenceDone[key] = arr;

  // אם כולם בוצעו — סמן המשימה כבוצעה
  const taskId = effectiveBid+'_'+lvl;
  const altId  = effectiveBid.replace(/^grp_/,'')+'_'+lvl;
  if(arr.every(Boolean)){
    S.done[taskId] = true;
    if(typeof toast==='function') toast('✅ כל החזרות בוצעו!');
  } else {
    delete S.done[taskId];
    delete S.done[altId];
  }

  if(typeof save==='function') save();
  if(typeof renderActive==='function') renderActive();
}

/* ═══════════════════════════════
   CSS — הוסף ל-style.css
═══════════════════════════════ */
(function _injectSubtasksCSS(){
  const s = document.createElement('style');
  s.textContent = `
    /* Sub-tasks container */
    .subtasks-container, .merged-subs-container {
      animation: fadeIn .2s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to   { opacity: 1; transform: translateY(0); }
    }
/* כפתור תת-משימות בכרטיסי משימה */
    .task-subtasks-btn {
      font-size: 13px;
      font-weight: 800;
      color: var(--teal);
      background: rgba(45,212,191,.1);
      border: 1px solid rgba(45,212,191,.25);
      border-radius: 50%;
      width: 26px;
      height: 26px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      padding: 0;
    }
    /* כפתור שילוב משימות */
    .task-merge-btn {
      font-size: 13px;
      color: var(--purple);
      background: rgba(155,126,248,.1);
      border: 1px solid rgba(155,126,248,.25);
      border-radius: 50%;
      width: 26px;
      height: 26px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      padding: 0;
    }
  `;
  document.head.appendChild(s);
})();


/* ═══════════════════════════════
   שילוב כפתורים בכרטיס משימה
   
   הדרכה: ב-_renderTaskHtml (app.js),
   בתוך הכפתורים הקיימים (בסוף ה-HTML של המשימה),
   הוסף:
   
   <button class="task-subtasks-btn"
     onclick="event.stopPropagation();openAddSubtaskModal('${safeGrpId}')">
     + תת-משימה
   </button>
   <button class="task-merge-btn"
     onclick="event.stopPropagation();openMergeTaskModal('${safeGrpId}')">
     🔗 שלב
   </button>
   
   ואחרי ה-task div הראשי:
   ${renderSubtasksForTask(t, safeGrpId)}
   ${renderMergedSubsForTask(t)}
═══════════════════════════════ */
