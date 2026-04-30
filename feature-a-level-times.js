/* ═══════════════════════════════════════════════════════════════════
   פיצ'ר א — שעות לכל שלב בחלון עריכת המשימה
   
   מה צריך לעשות:
   1. ב-app.js מצא את הלולאה שבונה את עמודות השלבים (for let i = 1 <= MAX_LVL)
      ושנה אותה לפי הקוד למטה.
   2. ב-app.js מצא את saveGroupEdit() ושנה לפי הקוד למטה.
   3. ב-index.html שנה את כותרת הטבלה לפי הקוד למטה.
═══════════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────────
   שינוי 1 — בפונקציה _openGroupModal, בתוך הלולאה for(let i=1; i<=MAX_LVL; i++)
   
   מצא את הבלוק הזה (4 שורות):
   
     const safeText = (lvlData.text||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
     numHtml  += `<div style="...">...</div>`;
     textHtml += `<div style="..."><input id="te-lvl-text-${i}" ...></div>`;
     ptsHtml  += `<div style="..."><input id="te-lvl-pts-${i}" ...></div>`;
   
   והחלף אותו במלואו ב:
───────────────────────────────────────────────────────────────── */

// === מקום בקוד: לולאה for(let i=1; i<=MAX_LVL; i++) ב-_openGroupModal ===
// המשתנים numHtml, textHtml, ptsHtml כבר מוגדרים מעל הלולאה.
// ↓↓↓ הוסף גם: let timeHtml2 = ''; מעל הלולאה ↓↓↓

/* BEFORE הלולאה:
   let numHtml = '', textHtml = '', ptsHtml = '';
   
   AFTER — שנה ל:
   let numHtml = '', textHtml = '', ptsHtml = '', timeHtml2 = '';
*/

// ↓↓↓ בתוך הלולאה — החלף את 4 השורות האלו: ↓↓↓
const _buildLevelRows_PATCH = (i, lvlData, isCur) => {
  const hlBg = isCur ? 'background:rgba(240,192,64,.09)' : (i % 2 === 0 ? 'background:rgba(255,255,255,.02)' : '');
  const bdr = 'border-bottom:1px solid var(--brd)';
  const curMark = isCur ? '<span style="font-size:8px;color:var(--gold);font-weight:900;display:block;line-height:1">★ נוכחי</span>' : '';
  const safeText = (lvlData.text||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
  const safeTime = (lvlData.time||'');

  // עמודת מספר שלב
  const numRow = `<div style="padding:5px 7px;text-align:center;font-size:11px;font-weight:800;color:${isCur?'var(--gold)':'var(--txt3)'};${hlBg};${bdr}">${i}${curMark}</div>`;

  // עמודת טקסט
  const textRow = `<div style="${hlBg};${bdr};border-right:1px solid var(--brd)"><input id="te-lvl-text-${i}" value="${safeText}" placeholder="טקסט לשלב ${i}..." maxlength="100" style="width:100%;background:transparent;border:none;color:var(--txt);font-family:'Heebo',sans-serif;font-size:12px;padding:5px 8px;outline:none"></div>`;

  // עמודת שעה ← חדש!
  const timeRow = `<div style="${hlBg};${bdr};border-right:1px solid var(--brd)"><input id="te-lvl-time-${i}" type="time" value="${safeTime}" style="width:100%;background:transparent;border:none;color:var(--teal);font-family:'Heebo',sans-serif;font-size:11px;padding:4px 6px;outline:none"></div>`;

  // עמודת נקודות
  const ptsRow = `<div style="${hlBg};${bdr}"><input id="te-lvl-pts-${i}" type="number" value="${lvlData.pts||''}" placeholder="נק'" min="1" max="9999" style="width:100%;background:transparent;border:none;color:var(--gold);font-family:'Heebo',sans-serif;font-size:12px;font-weight:800;padding:5px 6px;outline:none;text-align:center"></div>`;

  return { numRow, textRow, timeRow, ptsRow };
};

/* הלולאה המלאה החדשה שתחליף את הישנה:
   
   let numHtml = '', textHtml = '', ptsHtml = '', timeHtml2 = '';
   
   for (let i = 1; i <= MAX_LVL; i++) {
     const lvlData = grp && grp.levels[i-1] ? grp.levels[i-1] : { text:'', pts:'', time:'' };
     const isCur = (i === S.level);
     const { numRow, textRow, timeRow, ptsRow } = _buildLevelRows_PATCH(i, lvlData, isCur);
     numHtml   += numRow;
     textHtml  += textRow;
     timeHtml2 += timeRow;
     ptsHtml   += ptsRow;
   }
   numCol.innerHTML  = numHtml;
   textCol.innerHTML = textHtml;
   // INSERT: new time column ↓
   const timeCol = document.getElementById('te-levels-rows-time');
   if(timeCol) timeCol.innerHTML = timeHtml2;
   ptsCol.innerHTML  = ptsHtml;
*/


/* ─────────────────────────────────────────────────────────────
   שינוי 2 — בפונקציה saveGroupEdit()
   
   מצא את הבלוק שמכין את levels:
   
     const levels = [];
     for (let i = 1; i <= MAX_LVL; i++) {
       const text = (document.getElementById(`te-lvl-text-${i}`)?.value || '').trim();
       const pts  = parseInt(document.getElementById(`te-lvl-pts-${i}`)?.value);
       if (!text) { toast(`חסר טקסט לשלב ${i}`); return; }
       if (!pts || pts < 1) { toast(`חסרות נקודות לשלב ${i}`); return; }
       levels.push({ text, pts });
     }
   
   והחלף ב:
───────────────────────────────────────────────────────────────── */

/*
   const levels = [];
   for (let i = 1; i <= MAX_LVL; i++) {
     const text = (document.getElementById(`te-lvl-text-${i}`)?.value || '').trim();
     const pts  = parseInt(document.getElementById(`te-lvl-pts-${i}`)?.value);
     const time = (document.getElementById(`te-lvl-time-${i}`)?.value || '').trim() || undefined;
     if (!text) { toast(`חסר טקסט לשלב ${i}`); return; }
     if (!pts || pts < 1) { toast(`חסרות נקודות לשלב ${i}`); return; }
     levels.push({ text, pts, ...(time ? { time } : {}) });
   }
*/


/* ─────────────────────────────────────────────────────────────
   שינוי 3 — ב-index.html
   
   מצא את כותרת הטבלה (3 עמודות):
   
     <div style="...grid-template-columns:auto 1fr 64px...">
       <div id="te-levels-rows"></div>
       <div id="te-levels-rows-text"></div>
       <div id="te-levels-rows-pts"></div>
     </div>
   
   שנה ל-4 עמודות:
───────────────────────────────────────────────────────────────── */

/*
   <!-- כותרת עמודות — שנה grid-template-columns מ: auto 1fr 64px ל: auto 1fr 72px 56px -->
   <div style="display:grid;grid-template-columns:auto 1fr 72px 56px;gap:0;border:1px solid var(--brd);border-radius:10px;overflow:hidden;margin-bottom:14px">
     <div style="padding:6px 8px;background:var(--sf3);font-size:10px;font-weight:800;color:var(--gold);text-align:center;border-bottom:1px solid var(--brd)">שלב</div>
     <div style="padding:6px 8px;background:var(--sf3);font-size:10px;font-weight:800;color:var(--gold);border-bottom:1px solid var(--brd);border-right:1px solid var(--brd)">טקסט המשימה לשלב זה</div>
     <div style="padding:6px 8px;background:var(--sf3);font-size:10px;font-weight:800;color:var(--teal);text-align:center;border-bottom:1px solid var(--brd);border-right:1px solid var(--brd)">⏰ שעה</div>
     <div style="padding:6px 8px;background:var(--sf3);font-size:10px;font-weight:800;color:var(--gold);text-align:center;border-bottom:1px solid var(--brd)">נק'</div>
     <div id="te-levels-rows"></div>
     <div id="te-levels-rows-text"></div>
     <div id="te-levels-rows-time"></div>  <!-- חדש! -->
     <div id="te-levels-rows-pts"></div>
   </div>
*/


/* ─────────────────────────────────────────────────────────────
   שינוי 4 — ב-planner.js בפונקציה _plTaskTime
   
   הוסף לאחר הבדיקה של plannerTimeOverrides:
───────────────────────────────────────────────────────────────── */

/*
   function _plTaskTime(t){
     if(S.plannerTimeOverrides&&S.plannerTimeOverrides[t.id])
       return S.plannerTimeOverrides[t.id];
   
     // ← הוסף: בדוק שעה מוגדרת ברמת-שלב (מהעמודה החדשה)
     const bid = typeof _baseId==='function' ? _baseId(t.id) : t.id.replace(/_\d+$/,'');
     const grpId = 'grp_' + bid;
     const grp = (getGroups()||[]).find(g=>g.id===grpId||g.id===bid);
     if(grp && grp.levels){
       const lvlIdx = (getTaskDisplayLevel ? getTaskDisplayLevel(bid) : S.level) - 1;
       const lvlData = grp.levels[Math.max(0, Math.min(lvlIdx, grp.levels.length-1))];
       if(lvlData && lvlData.time) return lvlData.time;
     }
   
     // ... המשך הפונקציה הקיימת
   }
*/
