/* ══ UI עורך מידע: showTaskInfo, openTaskInfoEdit, save, reset ══ */

function showTaskInfo(baseId, taskText, taskPts, event) {
  if(event) event.stopPropagation();
  _tieCurrentBaseId = baseId;

  const lvl = S.level;
  const base = TASK_INFO[baseId] || {
    title: taskText,
    why: 'עקביות יומית בכל הרגל קטן היא הדרך שבה נבנה האדם. כל פעולה שעושים כל יום — גם קטנה — יוצרת ניווט עצבי חדש שהופך לחלק ממי שאתה.',
    desc: 'בצע את המשימה בצורה מלאה, בזמן שנקבע, בלי לחפש קיצורים. העקביות חשובה יותר מהשלמות.',
    tip: 'התמקד בעשייה הקטנה הבאה — לא בתמונה הגדולה. כל ביצוע מחזק את ההרגל ומקרב לאדם שאתה רוצה להיות.'
  };

  // Apply any manual overrides
  const ov = (S.taskInfoOverride || {})[baseId] || {};

  // ── Step-aware data for current level ──
  let stepData = getTaskStepDesc(baseId, lvl);
  if (stepData) {
    if (ov.goal && ov.goal !== '') stepData = { ...stepData, goal: ov.goal };
    if (ov.steps && ov.steps[lvl-1] && ov.steps[lvl-1] !== '') stepData = { ...stepData, stepText: ov.steps[lvl-1] };
  } else if (ov.goal || (ov.steps && ov.steps[lvl-1])) {
    const pct = Math.round((lvl - 1) / 14 * 100);
    const phase = lvl <= 5 ? 'התחלה' : lvl <= 10 ? 'התקדמות' : 'שליטה';
    stepData = { level: lvl, pct, phase, goal: ov.goal || '', stepText: (ov.steps && ov.steps[lvl-1]) || '' };
  }

  // ── desc: level-specific step text is the PRIMARY "what to do", base.desc is the general how-to ──
  const baseDesc  = ov.desc !== undefined && ov.desc !== '' ? ov.desc : base.desc;
  const stepSpecificDesc = stepData && stepData.stepText ? stepData.stepText : null;

  // "מה לעשות בשלב זה" = step text (if exists), otherwise base desc
  // General "איך" shown below as secondary
  let descHtml;
  if (stepSpecificDesc) {
    // Primary: bold step-specific action
    descHtml = `<div style="font-size:14px;font-weight:700;color:var(--txt);line-height:1.6;margin-bottom:${baseDesc ? '8' : '0'}px">${stepSpecificDesc}</div>`;
    if (baseDesc) {
      descHtml += `<div style="font-size:11px;color:var(--txt3);line-height:1.6;border-top:1px solid var(--brd);padding-top:7px;margin-top:4px">${baseDesc}</div>`;
    }
  } else {
    descHtml = baseDesc || '';
  }

  // ── tip: if per-step tips available, show the current level's tip ──
  const baseTip = ov.tip !== undefined && ov.tip !== '' ? ov.tip : base.tip;

  const info = {
    title: base.title || taskText,
    why:  ov.why  !== undefined && ov.why  !== '' ? ov.why  : base.why,
    desc: descHtml,
    tip:  baseTip,
  };

  document.getElementById('task-info-title').textContent = info.title;
  document.getElementById('task-info-why').textContent = info.why;
  // desc can contain HTML so use innerHTML
  document.getElementById('task-info-desc').innerHTML = info.desc || '';
  document.getElementById('task-info-tip').textContent = info.tip;
  document.getElementById('task-info-pts').textContent = '+' + taskPts + ' נקודות';

  // Show edit indicator if overridden
  const editBtn = document.querySelector('#task-info-modal button[onclick="openTaskInfoEdit()"]');
  const hasOverride = ov && Object.keys(ov).some(k => ov[k] && (typeof ov[k] === 'string' ? ov[k] !== '' : true));
  if (editBtn) editBtn.textContent = hasOverride ? '✏️ ערוך מידע ✦' : '✏️ ערוך מידע';

  // ── update section header to show current level ──
  const descHeader = document.querySelector('#task-info-modal #task-info-desc')?.closest('div')?.querySelector('div[style*="text-transform:uppercase"]');

  // ── Step progress block ──
  const stepEl = document.getElementById('task-info-step-block');
  if (stepData && stepEl && (stepData.stepText || stepData.goal)) {
    const pctBar = `<div style="height:5px;background:var(--sf3);border-radius:99px;overflow:hidden;margin-top:6px"><div style="height:100%;border-radius:99px;background:linear-gradient(90deg,var(--green2),var(--green));width:${stepData.pct}%;transition:width .6s"></div></div>`;
    const goalLine = stepData.goal ? `<div style="font-size:11px;color:var(--txt3);margin-top:7px;line-height:1.5">🎯 יעד סופי (שלב 15): <span style="color:var(--txt2)">${stepData.goal}</span></div>` : '';
    // Show next step as a hint if not at max
    const nextStepData = lvl < 15 ? getTaskStepDesc(baseId, lvl + 1) : null;
    const nextOvStep = ov.steps && ov.steps[lvl] && ov.steps[lvl] !== '' ? ov.steps[lvl] : null;
    const nextText = nextOvStep || (nextStepData && nextStepData.stepText);
    const nextHint = nextText
      ? `<div style="margin-top:8px;padding:7px 10px;background:rgba(255,255,255,.04);border-radius:7px;border-right:2px solid rgba(45,212,191,.3)"><span style="font-size:9px;font-weight:800;color:var(--txt3);text-transform:uppercase;letter-spacing:.5px">שלב הבא (${lvl+1}):</span><div style="font-size:11px;color:var(--txt3);margin-top:2px;line-height:1.5">${nextText}</div></div>`
      : '';
    stepEl.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
        <div style="font-size:10px;font-weight:800;color:var(--teal);text-transform:uppercase;letter-spacing:.8px">📍 שלב ${stepData.level} מ-15 — ${stepData.phase}</div>
        <div style="font-size:10px;font-weight:800;color:var(--teal)">${stepData.pct}%</div>
      </div>
      ${pctBar}
      ${goalLine}
      ${nextHint}`;
    stepEl.style.display = 'block';
  } else if (stepEl) {
    stepEl.style.display = 'none';
  }

  // ── Update "מה לעשות בשלב זה" header to show level number ──
  const descLabel = document.getElementById('task-info-desc-header');
  if (descLabel) {
    descLabel.textContent = `📋 מה לעשות בשלב ${lvl}`;
  }

  openModal('task-info-modal');
}

/* ══════════════ TASK INFO EDITOR ══════════════ */
let _tieCurrentBaseId = null;

function openTaskInfoEdit() {
  const bid = _tieCurrentBaseId;
  if (!bid) return;

  const ov = (S.taskInfoOverride || {})[bid] || {};
  const base = TASK_INFO[bid] || {
    why: 'עקביות יומית בכל הרגל קטן היא הדרך שבה נבנה האדם. כל פעולה שעושים כל יום — גם קטנה — יוצרת ניווט עצבי חדש שהופך לחלק ממי שאתה.',
    desc: 'בצע את המשימה בצורה מלאה, בזמן שנקבע, בלי לחפש קיצורים. העקביות חשובה יותר מהשלמות.',
    tip: 'התמקד בעשייה הקטנה הבאה — לא בתמונה הגדולה. כל ביצוע מחזק את ההרגל ומקרב לאדם שאתה רוצה להיות.'
  };
  const stepData = getTaskStepDesc(bid, S.level) || {};

  document.getElementById('tie-title').textContent = '✏️ ' + (base.title || bid);
  document.getElementById('tie-base-id').value = bid;

  // Value = override only. Empty = will show default.
  const whyEl  = document.getElementById('tie-why');
  const descEl = document.getElementById('tie-desc');
  const tipEl  = document.getElementById('tie-tip');
  const goalEl = document.getElementById('tie-goal');

  whyEl.value  = ov.why  !== undefined && ov.why  !== '' ? ov.why  : '';
  descEl.value = ov.desc !== undefined && ov.desc !== '' ? ov.desc : '';
  tipEl.value  = ov.tip  !== undefined && ov.tip  !== '' ? ov.tip  : '';
  goalEl.value = ov.goal !== undefined && ov.goal !== '' ? ov.goal : '';

  // Show default text below field; hide when user types something
  const _setDefault = (elId, defaultText) => {
    const previewEl = document.getElementById(elId + '-default');
    const inputEl   = document.getElementById(elId);
    if (!previewEl || !inputEl) return;
    const update = () => {
      if (inputEl.value.trim() === '') {
        previewEl.innerHTML = defaultText
          ? `<span style="color:var(--txt3)">↳ ברירת מחדל: </span><span style="color:var(--txt2)">${defaultText}</span>`
          : '';
      } else {
        previewEl.textContent = '';
      }
    };
    previewEl.innerHTML = defaultText && inputEl.value.trim() === ''
      ? `<span style="color:var(--txt3)">↳ ברירת מחדל: </span><span style="color:var(--txt2)">${defaultText}</span>`
      : '';
    inputEl.oninput = update;
  };
  _setDefault('tie-why',  base.why  || '');
  _setDefault('tie-desc', base.desc || '');
  _setDefault('tie-tip',  base.tip  || '');
  _setDefault('tie-goal', stepData.goal || '');

  // Build per-step textareas
  const container = document.getElementById('tie-steps-container');
  const stepDescs = _getRawStepDescs(bid);
  container.innerHTML = '';
  for (let i = 1; i <= 15; i++) {
    const defaultText = stepDescs ? (stepDescs[i-1] || '') : '';
    const saved = ov.steps && ov.steps[i-1] !== undefined && ov.steps[i-1] !== '' ? ov.steps[i-1] : '';
    const isActive = S.level === i;
    container.innerHTML += `
      <div style="display:flex;gap:8px;align-items:flex-start">
        <div style="font-size:11px;font-weight:800;color:${isActive?'var(--teal)':'var(--txt3)'};padding-top:9px;min-width:38px;text-align:center">
          ${isActive?'▶':''}שלב<br>${i}
        </div>
        <div style="flex:1">
          <textarea id="tie-step-${i}" rows="2"
            placeholder="${defaultText ? defaultText : ('תיאור שלב '+i+'...')}"
            style="width:100%;background:${isActive?'rgba(45,212,191,.07)':'var(--bg3)'};border:1px solid ${isActive?'rgba(45,212,191,.3)':'var(--brd2)'};border-radius:9px;color:var(--txt);font-family:'Heebo',sans-serif;font-size:12px;padding:8px 10px;outline:none;resize:vertical;box-sizing:border-box;line-height:1.55;margin-bottom:${defaultText&&!saved?'2px':'0'}">${saved}</textarea>
          ${defaultText && !saved ? `<div style="font-size:10px;color:var(--txt3);padding:0 4px;line-height:1.4">↳ ברירת מחדל: ${defaultText}</div>` : ''}
        </div>
      </div>`;
  }

  closeModal('task-info-modal');
  openModal('modal-task-info-edit');
}

function _getRawStepDescs(bid) {
  // Returns the default step descriptions array for a given base ID
  const stepDescsMap = {
    z1:['יציאה מהמיטה עד 8:15','יציאה מהמיטה עד 8:00','יציאה מהמיטה עד 7:45','יציאה מהמיטה עד 7:30','יציאה מהמיטה עד 7:15','יציאה מהמיטה עד 7:00','יציאה מהמיטה עד 6:45','יציאה מהמיטה עד 6:30','יציאה מהמיטה עד 6:15','יציאה מהמיטה עד 6:00','יציאה מהמיטה עד 5:45','יציאה מהמיטה עד 5:30','יציאה מהמיטה עד 5:15','יציאה מהמיטה עד 5:15 (מודה אני + נט"י)','יציאה מהמיטה ב-5:00 בזריזות ("כאריה") ✦'],
    b1:['2 כוסות מים ביום','3 כוסות מים ביום','3 כוסות מים ביום','4 כוסות מים ביום','5 כוסות מים ביום','6 כוסות ביום','7 כוסות מים ביום','8 כוסות מים ביום','אכילה איטית ולעיסה — 1.5 ליטר','המתנה 2 דק\' לפני תוספת — 1.5 ליטר','כוס מים לפני כל ארוחה — 2 ליטר','ארוחת ערב משותפת — 2 ליטר','שמירה על ההרגל — 2.5 ליטר','שמירה על ההרגל — 2.5 ליטר','3 ליטר מים ביום ✦'],
  };
  // For all others, build from getTaskStepDesc per level
  if (stepDescsMap[bid]) return stepDescsMap[bid];
  const steps = [];
  for (let i = 1; i <= 15; i++) {
    const d = getTaskStepDesc(bid, i);
    steps.push(d ? d.stepText : '');
  }
  return steps;
}

function saveTaskInfoEdit() {
  const bid = document.getElementById('tie-base-id').value;
  if (!bid) return;

  if (!S.taskInfoOverride) S.taskInfoOverride = {};
  const ov = S.taskInfoOverride[bid] || {};

  const why = document.getElementById('tie-why').value.trim();
  const desc = document.getElementById('tie-desc').value.trim();
  const tip = document.getElementById('tie-tip').value.trim();
  const goal = document.getElementById('tie-goal').value.trim();

  const steps = [];
  for (let i = 1; i <= 15; i++) {
    const el = document.getElementById('tie-step-' + i);
    steps.push(el ? el.value.trim() : '');
  }

  S.taskInfoOverride[bid] = { why, desc, tip, goal, steps };
  save();
  toast('✓ מידע המשימה עודכן');
  closeModal('modal-task-info-edit');

  // Re-open the info modal with updated data — find taskPts from current tasks
  const tasks = getTasks(S.level);
  const t = tasks.find(x => _baseId(x.id) === bid);
  const pts = t ? t.pts : 0;
  showTaskInfo(bid, (TASK_INFO[bid]||{}).title || bid, pts, null);
}

async function resetTaskInfoEdit() {
  const bid = document.getElementById('tie-base-id').value;
  if (!bid) return;
  if (!await _customConfirm('לאפס את המידע לברירת המחדל?', '↺ אפס')) return;
  if (!S.taskInfoOverride) S.taskInfoOverride = {};
  delete S.taskInfoOverride[bid];
  save();
  toast('↺ מידע אופס לברירת מחדל');
  closeModal('modal-task-info-edit');
  const tasks = getTasks(S.level);
  const t = tasks.find(x => _baseId(x.id) === bid);
  const pts = t ? t.pts : 0;
  showTaskInfo(bid, (TASK_INFO[bid]||{}).title || bid, pts, null);
}

