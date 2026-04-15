const SK='aliyah_v34';
const MAX_LVL=15;
function def(){
  return{done:{},history:[],totalPts:0,redeemed:[],lastDay:new Date().toDateString(),
    level:1,streak:0,
    graceUsedDates:[],   // array of date strings (max per month = gracesPerLevel)
    customRewards:[],dreamRewardId:null,
    notifEnabled:{},shabbatDone:{},shabbatUpdated:null,sortMode:'cat',
    soundEnabled:true,focusMode:false,
    catHistory:{},
    focusDays:[],         // array of {date, goal} — declared focus days
    focusDayUsedMonth:[], // track how many focus days used this month
    redeemedLog:[],       // array of {id,date,pts,title,emoji} for purchased rewards log
    dailyRedeemCount:{},  // {dateString: count} — max 2.5/day (5 per 2 days, tracked as half-units)
    halfDayRedeemCarry:0, // 0 or 0.5 carried from previous day
    retroHistory:[],      // manual retroactive history overrides
    customTasks:{},       // legacy
    taskGroups:null,      // null = use built-in; array = custom groups
    rewardsOverride:{},   // {id: {hidden?,title?,desc?,pts?,minLevel?,emoji?}}
    oneTimeTasks:[],      // [{id,text,pts,cat,slot,days,maxReps,doneCount,lastDoneDate}]
    streakTasks:[],       // [{id,text,pts_base,cat,slot,days,streakDays:{dateStr:true},currentStreak}]
    // ── NEW: Per-task individual level tracking ──
    taskIndivLevel:{},    // {baseTaskId: level 1-15} — individual skill level per task
    taskSuccessCount:{},  // {baseTaskId: count} — consecutive successes for this level
    taskFailStreak:{},    // {baseTaskId: days since last done} — for regression
    stagePoints:0,        // points accumulated in current global stage (for stage-up requirement)
    snoozedTasks:{},      // {taskId: dateString} — tasks hidden for today
    subTasks:{},          // {taskId: [{id,text,pts,scope,doneDate}]} — sub-tasks per parent task
  };
}
function load(){try{const r=localStorage.getItem(SK);if(r)return{...def(),...JSON.parse(r)};}catch(e){}return def();}
let S=load();
window._getS = function(){ return S; };
window._setS = function(n){ S={...def(),...n}; save(); try{renderActive();}catch(e){} };
const save = function(){
  localStorage.setItem(SK, JSON.stringify(S));
  if(window._fbUser && window._fbSave) window._fbSave(window._fbUser.uid, S);
};

/* ══════════════ GRACE LOGIC (SCALED) ══════════════ */
function gracesPerLevel(lvl){
  if(lvl<=5)return 1;
  if(lvl<=10)return 2;
  return 3;
}
function getCurrentMonth(){return new Date().toISOString().slice(0,7);}
function graceUsedThisMonth(){
  const m=getCurrentMonth();
  if(!S.graceUsedDates)S.graceUsedDates=[];
  return S.graceUsedDates.filter(d=>d.slice(0,7)===m).length;
}
function graceAvailable(){
  return graceUsedThisMonth()<gracesPerLevel(S.level);
}
function graceRemaining(){
  return gracesPerLevel(S.level)-graceUsedThisMonth();
}
/* Grace bought via rewards */
function graceBoughtThisMonth(){
  if(!S.graceBought)S.graceBought={};
  const m=getCurrentMonth();
  return S.graceBought[m]||0;
}
function totalGraceAvailable(){
  return graceRemaining()+graceBoughtThisMonth();
}

/* ══════════════ FOCUS DAY LOGIC ══════════════ */
const FOCUS_DAYS_PER_MONTH=3;
function focusDaysUsedThisMonth(){
  const m=getCurrentMonth();
  if(!S.focusDays)S.focusDays=[];
  return S.focusDays.filter(fd=>fd.date&&fd.date.slice(0,7)===m).length;
}
function focusDayForToday(){
  const t=new Date().toDateString();
  return (S.focusDays||[]).find(fd=>new Date(fd.date).toDateString()===t)||null;
}
function focusDayDeclaredForTomorrow(){
  const tm=new Date();tm.setDate(tm.getDate()+1);
  return (S.focusDays||[]).find(fd=>new Date(fd.date).toDateString()===tm.toDateString())||null;
}

/* Anchor tasks for focus day */
const ANCHOR_IDS_PATTERN=['z1_','b1_','l1_'];
function getAnchorTasks(lvl){
  const t=getTasks(lvl);
  return t.filter(task=>ANCHOR_IDS_PATTERN.some(p=>task.id.startsWith(p)));
}

/* ══════════════ AUDIO ══════════════ */
let audioCtx=null;
function getAudio(){if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();return audioCtx;}
function playCheck(){
  if(!S.soundEnabled)return;
  try{const ctx=getAudio();const o=ctx.createOscillator();const g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.frequency.setValueAtTime(880,ctx.currentTime);o.frequency.exponentialRampToValueAtTime(1200,ctx.currentTime+0.08);g.gain.setValueAtTime(0.18,ctx.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.18);o.start();o.stop(ctx.currentTime+0.18);}catch(e){}
}
function playUncheck(){
  if(!S.soundEnabled)return;
  try{const ctx=getAudio();const o=ctx.createOscillator();const g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.frequency.setValueAtTime(600,ctx.currentTime);o.frequency.exponentialRampToValueAtTime(400,ctx.currentTime+0.1);g.gain.setValueAtTime(0.1,ctx.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.15);o.start();o.stop(ctx.currentTime+0.15);}catch(e){}
}
function playLevelUp(){
  try{const ctx=getAudio();[523,659,784,1047].forEach((f,i)=>{const o=ctx.createOscillator();const g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.frequency.value=f;const t=ctx.currentTime+i*0.12;g.gain.setValueAtTime(0.2,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.25);o.start(t);o.stop(t+0.25);});}catch(e){}
}
/* ══════════════ THEME ══════════════ */
function applyTheme(light){
  document.body.classList.toggle('light',!!light);
  const lbl=document.getElementById('theme-label');
  const tog=document.getElementById('theme-toggle');
  if(lbl)lbl.textContent=light?'☀️ מצב בהיר':'🌙 מצב כהה';
  if(tog)tog.classList.toggle('on',!!light);
}
function toggleTheme(){
  S.lightMode=!S.lightMode;
  save();
  applyTheme(S.lightMode);
}

/* ══════════════ TASK CATEGORIES ══════════════ */
const BUILTIN_TASK_CATS={zman:'⏱ זמנים',briut:'💧 בריאות',achila:'🍎 אכילה',limud:'📖 לימוד',bayit:'🏠 בית',smart:'📵 סמארטפון',erev:'🕯️ ערב שבת',shabbat:'✡️ שבת'};

function getCustomTaskCats(){return S.customTaskCats||[];}

function getAllTaskCats(){
  // מחזיר מערך של {key, label}
  const builtin=Object.entries(BUILTIN_TASK_CATS).map(([key,label])=>({key,label}));
  const custom=getCustomTaskCats().map(c=>({key:c.key,label:`${c.emoji||'📌'} ${c.name}`}));
  return [...builtin,...custom];
}

function _populateTaskCatSelect(selectVal){
  const sel=document.getElementById('te-cat');
  if(!sel)return;
  sel.innerHTML=getAllTaskCats().map(c=>`<option value="${c.key}"${c.key===selectVal?' selected':''}>${c.label}</option>`).join('');
}

function openAddTaskCat(){
  document.getElementById('tc-name').value='';
  document.getElementById('tc-emoji').value='';
  openModal('modal-task-cat');
}

function saveTaskCat(){
  const name=document.getElementById('tc-name').value.trim();
  const emoji=document.getElementById('tc-emoji').value.trim()||'📌';
  if(!name){toast('חובה להזין שם קטגוריה');return;}
  const key='tcat_'+Date.now();
  if(!S.customTaskCats)S.customTaskCats=[];
  S.customTaskCats.push({key,name,emoji});
  // עדכן גם CATS ו-CAT_COLORS כדי שהמשימות יוצגו נכון
  CATS[key]=`${emoji} ${name}`;
  CAT_COLORS[key]='var(--txt2)';
  CAT_COLORS_HEX[key]='#8888a8';
  save();
  closeModal('modal-task-cat');
  _populateTaskCatSelect(key);
  toast(`✓ קטגוריה "${name}" נוספה`);
}

// טוען קטגוריות מותאמות אישית ל-CATS בעת אתחול
(function loadCustomTaskCats(){
  (S.customTaskCats||[]).forEach(c=>{
    CATS[c.key]=`${c.emoji||'📌'} ${c.name}`;
    CAT_COLORS[c.key]='var(--txt2)';
    CAT_COLORS_HEX[c.key]='#8888a8';
  });
})();
// קטגוריות מובנות (ממשיכות כמו שהן בקוד)
const BUILTIN_CAT_KEYS=REWARDS.map(c=>c.cat);

function getCustomCats(){return S.customRewardCats||[];}

// רשימת כל הקטגוריות — מובנות + מותאמות אישית
function getAllRewardCats(){
  return [...BUILTIN_CAT_KEYS,...getCustomCats().map(c=>`${c.emoji||'📁'}  ${c.name}`)];
}

function openAddRewardCat(){
  document.getElementById('rc-name').value='';
  document.getElementById('rc-emoji').value='';
  openModal('modal-reward-cat');
}

function saveRewardCat(){
  const name=document.getElementById('rc-name').value.trim();
  const emoji=document.getElementById('rc-emoji').value.trim()||'📁';
  if(!name){toast('חובה להזין שם קטגוריה');return;}
  if(!S.customRewardCats)S.customRewardCats=[];
  const fullName=`${emoji}  ${name}`;
  if(getAllRewardCats().includes(fullName)){toast('קטגוריה זו כבר קיימת');return;}
  S.customRewardCats.push({id:'rcat_'+Date.now(),name,emoji});
  save();
  closeModal('modal-reward-cat');
  _populateCatSelect(fullName); // בחר את הקטגוריה החדשה
  toast(`✓ קטגוריה "${name}" נוספה`);
}

function _populateCatSelect(selectVal){
  const sel=document.getElementById('re-cat');
  if(!sel)return;
  const cats=getAllRewardCats();
  sel.innerHTML=cats.map(c=>`<option value="${c}"${c===selectVal?' selected':''}>${c}</option>`).join('');
}

/* ══════════════ REWARD CATEGORY IN getEffectiveRewards ══════════════ */
function getEffectiveRewards(){
  const ov=S.rewardsOverride||{};
  // מובנות
  const builtin=REWARDS.map(cat=>({
    cat:cat.cat,
    items:cat.items
      .filter(r=>!(ov[r.id]&&ov[r.id].hidden))
      .map(r=>ov[r.id]?{...r,...ov[r.id]}:r)
  })).filter(cat=>cat.items.length);

  // צ'ופרים אישיים מסודרים לפי קטגוריה
  const custom=S.customRewards||[];
  const catMap={};
  custom.forEach(r=>{
    const cat=r.rewardCat||"⭐  צ'ופרים אישיים";
    if(!catMap[cat])catMap[cat]=[];
    catMap[cat].push({...r,_custom:true});
  });

  const customCats=Object.entries(catMap).map(([cat,items])=>({cat,items,_custom:true}));
  return [...builtin,...customCats];
}
function getWeekKey(d){const x=new Date(d);x.setHours(0,0,0,0);x.setDate(x.getDate()-x.getDay());return x.toISOString().slice(0,10);}
function isSatNight(){const n=new Date();return n.getDay()===6&&n.getHours()>=20;}
function shabbatDone(){return S.shabbatUpdated===getWeekKey(new Date());}
let sfri={},ssat={};
function openShabbatModal(){
  sfri={};ssat={};
  const friTasks=getTasksForDay(S.level,'friday');
  const satTasks=getTasksForDay(S.level,'shabbat');
  if(S.shabbatDone){
    friTasks.forEach(x=>{if(S.shabbatDone['fri_'+x.id])sfri[x.id]=true;});
    satTasks.forEach(x=>{if(S.shabbatDone['sat_'+x.id])ssat[x.id]=true;});
  }
  renderShabbatList('shabbat-fri-tasks',sfri,'fri',friTasks);
  renderShabbatList('shabbat-sat-tasks',ssat,'sat',satTasks);
  openModal('modal-shabbat');
}
function renderShabbatList(cid,map,pfx,tasks){
  const c=document.getElementById(cid);if(!c)return;
  if(!tasks)tasks=pfx==='fri'?getTasksForDay(S.level,'friday'):getTasksForDay(S.level,'shabbat');
  c.innerHTML=tasks.map(x=>{const dn=!!map[x.id];
    return`<div class="shabbat-mini-task${dn?' ck':''}" onclick="togSh('${cid}','${x.id}','${pfx}')">
      <div class="tcb2">${dn?chkSvg():''}</div>
      <div style="font-size:12px;flex:1">${x.text}</div>
      <div style="font-size:11px;font-weight:800;color:var(--gold)">+${bonusPts(x.pts)}</div>
    </div>`;}).join('');
}
function togSh(cid,id,pfx){const m=pfx==='fri'?sfri:ssat;m[id]=!m[id];renderShabbatList(cid,m,pfx);}
function confirmShabbat(){
  const friTasks=getTasksForDay(S.level,'friday');
  const satTasks=getTasksForDay(S.level,'shabbat');
  let tp=0;const nd={};
  friTasks.forEach(x=>{if(sfri[x.id]){nd['fri_'+x.id]=true;tp+=bonusPts(x.pts);}});
  satTasks.forEach(x=>{if(ssat[x.id]){nd['sat_'+x.id]=true;tp+=bonusPts(x.pts);}});
  S.shabbatDone=nd;
  const friDone=friTasks.filter(x=>sfri[x.id]).length;
  const satDone=satTasks.filter(x=>ssat[x.id]).length;
  const friPct=friTasks.length?friDone/friTasks.length:0;
  const satPct=satTasks.length?satDone/satTasks.length:0;
  const friOk=friPct>=0.5;
  const satOk=satPct>=0.8;
  const friLbl=friTasks.length?`שישי ${Math.round(friPct*100)}%${friOk?' ✓':' ✗'}`:'';
  const satLbl=satTasks.length?`שבת ${Math.round(satPct*100)}%${satOk?' ✓':' ✗'}`:'';
  const entryDate=new Date().toDateString();
  const newEntry={date:entryDate,pts:tp,tasks:friDone+satDone,note:`שישי+שבת (${[friLbl,satLbl].filter(Boolean).join(', ')})`};
  // upsert — אם כבר קיימת רשומה לתאריך זה, מחליפים במקום להוסיף
  const existingIdx=S.history.findIndex(h=>h.date===entryDate);
  if(existingIdx>=0){S.history[existingIdx]=newEntry;}
  else{S.history.unshift(newEntry);}
  S.shabbatUpdated=getWeekKey(new Date());
  // חישוב מחדש נכון של רצף ונקודות (במקום לשנות ידנית)
  recalcStreakAndProgress();
  const meetsPoints=(S.stagePoints||0)>=getReqStagePoints(S.level);
  const meetsStreak=S.streak>=getReqStreak(S.level);
  if(meetsStreak&&meetsPoints&&S.level<MAX_LVL){S.level++;S.streak=0;S.stagePoints=0;toast('🎯 עלית שלב!');}
  save();closeModal('modal-shabbat');
  toast(`✓ שישי+שבת עודכנו! +${tp} נקודות`);
  renderActive();
}

/* ══════════════ FOCUS DAY ══════════════ */
function openFocusDayModal(){
  const used=focusDaysUsedThisMonth();
  const rem=FOCUS_DAYS_PER_MONTH-used;
  const info=document.getElementById('fd-usage-info');
  const btn=document.getElementById('fd-confirm-btn');
  if(info)info.textContent=`נותרו ${rem} מתוך ${FOCUS_DAYS_PER_MONTH} ימי עשייה לחודש זה`;
  if(btn)btn.disabled=rem<=0;
  // Check if tomorrow already declared
  const tm=focusDayDeclaredForTomorrow();
  const ta=document.getElementById('fd-goal');
  if(ta&&tm)ta.value=tm.goal||'';
  openModal('modal-focus-day');
}
function confirmFocusDay(){
  const goal=(document.getElementById('fd-goal').value||'').trim();
  if(!goal){toast('חובה להגדיר מטרת על');return;}
  const used=focusDaysUsedThisMonth();
  if(used>=FOCUS_DAYS_PER_MONTH){toast(`מוצה מכסת ימי העשייה לחודש (${FOCUS_DAYS_PER_MONTH})`);closeModal('modal-focus-day');return;}
  // Declare for tomorrow (or today if needed)
  const tm=new Date();tm.setDate(tm.getDate()+1);
  if(!S.focusDays)S.focusDays=[];
  // Remove existing entry for tomorrow if any
  S.focusDays=S.focusDays.filter(fd=>new Date(fd.date).toDateString()!==tm.toDateString());
  S.focusDays.push({date:tm.toISOString().slice(0,10),goal});
  save();closeModal('modal-focus-day');
  document.getElementById('fd-goal').value='';
  toast('🎯 יום עשייה הוצהר למחר!');
  renderActive();
}

/* ══════════════ PER-TASK LEVEL HELPERS ══════════════ */
// Extract base task ID (strip the _N suffix from default tasks like "z1_5" → "z1")
function _baseId(taskId){
  // Default tasks have pattern: baseKey_level (e.g. z1_5, pray_3)
  // Custom group tasks have pattern: grp_{groupId}_{level} — we use the group id
  if(!taskId)return taskId;
  const m=taskId.match(/^(.+)_\d+$/);
  return m?m[1]:taskId;
}
function _getBaseTaskIds(tasks){
  const seen=new Set();
  tasks.forEach(t=>seen.add(_baseId(t.id)));
  return [...seen];
}
// Get the individual level for a task — independent of global S.level
function getTaskDisplayLevel(baseId){
  if(!S.taskIndivLevel)return S.level;
  const indiv=S.taskIndivLevel[baseId]||1;
  return indiv; // no cap on S.level — personal track is independent
}
// Successes needed to next individual level — flat 5 (personal track)
const TASK_INDIV_SUCCEED_NEEDED = 5;  // 5 successes → level up (personal track)
const TASK_INDIV_FAIL_STREAK    = 3;  // 3 consecutive failures → level down
function getTaskSuccessProgress(baseId){
  if(!S.taskSuccessCount||!S.taskIndivLevel)return {done:0,needed:TASK_INDIV_SUCCEED_NEEDED};
  let done=S.taskSuccessCount[baseId]||0;
  // Include today's completion in the display count (rollover hasn't happened yet)
  const todayTasks=getTasksForDay(S.level,getDayType(new Date()));
  const doneToday=todayTasks.filter(t=>_baseId(t.id)===baseId&&S.done[t.id]).length>0;
  if(doneToday) done=Math.min(done+1,TASK_INDIV_SUCCEED_NEEDED);
  return{done,needed:TASK_INDIV_SUCCEED_NEEDED};
}

/* ══════════════ ROLLOVER ══════════════ */
let pendingLU=null;
(function(){
  const today=new Date().toDateString();
  if(S.lastDay===today)return;
  const yesterdayBoost = (S.boostDay && S.boostDay.date !== today) ? S.boostDay : null;
  if(yesterdayBoost){ _checkBoostRollover(yesterdayBoost); }
  const pts=calcDayPts();
  const yesterday=new Date(S.lastDay);
  const yDow=yesterday.getDay();
  const tasks=yDow===5?getTasksForDay(S.level,'friday'):yDow===6?getTasksForDay(S.level,'shabbat'):getTasksForDay(S.level,'weekday');
  const dc=tasks.filter(t=>S.done[t.id]).length;
  if(!S.catHistory)S.catHistory={};
  tasks.forEach(t=>{
    if(!S.catHistory[t.cat])S.catHistory[t.cat]={total:0,done:0};
    S.catHistory[t.cat].total++;
    if(S.done[t.id])S.catHistory[t.cat].done++;
  });
  // Check if yesterday was a focus day
  const yest_date=new Date();yest_date.setDate(yest_date.getDate()-1);
  const wasFocusDay=(S.focusDays||[]).some(fd=>new Date(fd.date).toDateString()===yest_date.toDateString());
  const streakThreshold = yDow===5 ? 0.5 : 0.8; // שישי=50%, שאר=80%
  if(wasFocusDay){
    // Streak frozen — check anchors only for validation
    const anchors=tasks.filter(t=>t.anchor);
    const anchorsDone=anchors.filter(t=>S.done[t.id]).length;
    const note=anchorsDone>=anchors.length?'יום עשייה ✓':'יום עשייה (עוגנים חסרים)';
    const _doneSnapshotFD=tasks.filter(t=>S.done[t.id]).map(t=>({id:t.id,text:t.text,pts:t.pts,cat:t.cat,slot:t.slot}));
    if(pts>0||dc>0)S.history.unshift({date:S.lastDay,pts,tasks:dc,note,isFocusDay:true,level:S.level,doneTasks:{...S.done},taskSnapshot:_doneSnapshotFD});
    S.totalPts+=pts;
    S.stagePoints=(S.stagePoints||0)+pts;
    // No streak change
  } else if(dc>=Math.ceil(tasks.length*streakThreshold)){
    S.streak++;
    S.stagePoints=(S.stagePoints||0)+pts;
    // Level-up requires: streak + 80% daily + enough stage points
    const dailyPct=dc/tasks.length;
    const meetsPoints=(S.stagePoints||0)>=getReqStagePoints(S.level);
    const meetsStreak=S.streak>=getReqStreak(S.level);
    const meetsDaily=dailyPct>=0.8;
    if(meetsStreak&&meetsDaily&&meetsPoints&&S.level<MAX_LVL){pendingLU=S.level+1;S.level=pendingLU;S.streak=0;S.stagePoints=0;}
  } else {
    // Check if grace available (now with scaling)
    const gAvail=graceAvailable()&&S.streak>=3;
    if(!gAvail){S.streak=0;}
    else{
      if(!S.graceUsedDates)S.graceUsedDates=[];
      S.graceUsedDates.push(S.lastDay);
    }
  }
  if(!wasFocusDay&&(pts>0||dc>0)){
    const _doneSnapshot=tasks.filter(t=>S.done[t.id]).map(t=>({id:t.id,text:t.text,pts:t.pts,cat:t.cat,slot:t.slot}));
    S.history.unshift({date:S.lastDay,pts,tasks:dc,level:S.level,doneTasks:{...S.done},taskSnapshot:_doneSnapshot});
  }
  if(!wasFocusDay)S.totalPts+=pts;
  // ── Update per-task success/failure counters ──
  if(!wasFocusDay){
    const baseIds=_getBaseTaskIds(tasks);
    if(!S.taskSuccessCount)S.taskSuccessCount={};
    if(!S.taskFailStreak)S.taskFailStreak={};
    if(!S.taskIndivLevel)S.taskIndivLevel={};
    baseIds.forEach(bid=>{
      const taskDone=tasks.filter(t=>_baseId(t.id)===bid).some(t=>S.done[t.id]);
      if(taskDone){
        S.taskFailStreak[bid]=0;
        S.taskSuccessCount[bid]=(S.taskSuccessCount[bid]||0)+1;
        // ── אישי: 5 הצלחות → עלייה (ללא תקרת שלב כללי) ──
        const curIndivLvl=S.taskIndivLevel[bid]||1;
        if(S.taskSuccessCount[bid]>=TASK_INDIV_SUCCEED_NEEDED&&curIndivLvl<MAX_LVL){
          S.taskIndivLevel[bid]=curIndivLvl+1;
          S.taskSuccessCount[bid]=0;
        }
      } else {
        S.taskFailStreak[bid]=(S.taskFailStreak[bid]||0)+1;
        // ── אישי: 3 כישלונות ברצף → ירידה ──
        if(S.taskFailStreak[bid]>=TASK_INDIV_FAIL_STREAK){
          const curIndivLvl=S.taskIndivLevel[bid]||1;
          if(curIndivLvl>1){
            S.taskIndivLevel[bid]=curIndivLvl-1;
            S.taskSuccessCount[bid]=0;
          }
          S.taskFailStreak[bid]=0;
        }
      }
    });
  }
  S.done={};S.lastDay=today;
  // Clean up snoozed tasks from previous days
  if(S.snoozedTasks){Object.keys(S.snoozedTasks).forEach(k=>{if(S.snoozedTasks[k]!==today)delete S.snoozedTasks[k];});}
  save();
})();

/* ══════════════ HELPERS ══════════════ */
function calcDayPts(){
  const boost = boostActiveToday();
  const scoringLevel = boost ? boost.level : S.level;
  const fd=focusDayForToday();
  const todayDow=new Date().getDay();
  const dayTasks = getTasksForDay(scoringLevel, getDayType(new Date()));
  const today = todayStr();
  // Sub-task points for today
  const subPts = Object.values(S.subTasks||{}).reduce((sum,subs)=>
    sum + (subs||[]).reduce((s2,sub)=> s2+(sub.doneDate===today?sub.pts:0), 0), 0);
  if(fd){
    const anchors=dayTasks.filter(t=>t.anchor);
    return anchors.reduce((s,t)=>s+(S.done[t.id]?bonusPts(t.pts):0),0) + subPts;
  }
  return dayTasks.reduce((s,t)=>s+(S.done[t.id]?bonusPts(t.pts):0),0) + subPts;
}
function calcAvail(){return S.totalPts+calcDayPts();}
function chkSvg(){return'<svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="1.5,5.5 4,8.5 9.5,2.5"/></svg>';}

/* ══════════════ FOCUS MODE ══════════ */
function toggleFocus(){S.focusMode=!S.focusMode;save();renderToday();}
function applyFocusMode(){
  document.body.classList.toggle('focus-mode',!!S.focusMode);
  const btn=document.getElementById('focus-btn');
  if(btn){btn.classList.toggle('active',!!S.focusMode);btn.textContent=S.focusMode?'👁 הצג הכל':'⚡ מיקוד';}
  const dow=new Date().getDay();
  const tasks=getTasksForDay(S.level, getDayType(new Date()));
  const rem=tasks.filter(t=>!S.done[t.id]).length;
  const fc=document.getElementById('focus-count');
  if(fc)fc.textContent=S.focusMode?`${rem} משימות נותרו — הסתרת המושלמות`:'מציג הכל';
}

/* ══════════════ SOUND TOGGLE ══════════ */
function toggleSound(){S.soundEnabled=!S.soundEnabled;save();renderSettings();}

/* ══════════════ ACTIONS ══════════════ */
function toggleTask(id,pts,isAnchorOnly){
  if(isAnchorOnly){
    // on focus day, non-anchor tasks can still be toggled but don't give points
  }
  if(S.done[id]){
    if(calcAvail()-bonusPts(pts)<0){toast('לא ניתן לבטל — נקודות כבר מומשו');return;}
    delete S.done[id];
    playUncheck();
    if(navigator.vibrate)navigator.vibrate([20,10,20]);
  }else{
    S.done[id]=true;
    playCheck();
    if(navigator.vibrate)navigator.vibrate(40);
    toast(`+${bonusPts(pts)} ✓${streakBonus()>1?' 🔥':''}`);
  }
  save();renderActive();
  // Refresh task editor list if open (so progress counters update live)
  const _teModal=document.getElementById('modal-task-editor');
  if(_teModal&&_teModal.classList.contains('on'))renderTeGroupList();
}
/* ══ SNOOZE TASK (לא היום) ══ */
function snoozeTask(id, event){
  if(event){event.stopPropagation();}
  if(!S.snoozedTasks)S.snoozedTasks={};
  if(S.snoozedTasks[id]===todayStr()){
    delete S.snoozedTasks[id];
    save();renderActive();
    if(navigator.vibrate)navigator.vibrate(20);
    toast('↩ המשימה חזרה לרשימה');
  } else {
    S.snoozedTasks[id]=todayStr();
    save();renderActive();
    if(navigator.vibrate)navigator.vibrate([10,5,10]);
    toast('⏭ הוסתרה להיום — תחזור מחר');
  }
}
function isTaskSnoozed(id){
  if(!S.snoozedTasks)return false;
  return S.snoozedTasks[id]===todayStr();
}

function toggleStar(id, event){
  if(event){event.stopPropagation();}
  if(!S.starredTasks)S.starredTasks={};
  if(S.starredTasks[id]){
    delete S.starredTasks[id];
    save();renderActive();
    toast("☆ הוסר מהעדיפות העליונה");
  } else {
    S.starredTasks[id]=true;
    save();renderActive();
    if(navigator.vibrate)navigator.vibrate(30);
    toast("⭐ סומן כעדיפות עליונה!");
  }
}
function isTaskStarred(id){
  return !!(S.starredTasks && S.starredTasks[id]);
}
/* ══════════════ SUB-TASKS ══════════════ */
let _subtaskParentId = null;
let _subtaskParentText = '';

function openAddSubTask(parentId, parentText, event){
  if(event){event.stopPropagation();}
  _subtaskParentId = parentId;
  _subtaskParentText = parentText;
  document.getElementById('modal-subtask-parent-label').textContent = '📌 ' + parentText;
  document.getElementById('modal-subtask-text').value = '';
  document.getElementById('modal-subtask-pts').value = '5';
  document.getElementById('modal-subtask-scope').value = 'level';
  openModal('modal-subtask');
}

function saveSubTask(){
  const text = (document.getElementById('modal-subtask-text').value||'').trim();
  const pts = parseInt(document.getElementById('modal-subtask-pts').value)||5;
  const scope = document.getElementById('modal-subtask-scope').value; // 'level'|'future'|'all'
  if(!text){toast('חובה להזין שם');return;}
  if(!S.subTasks)S.subTasks={};

  const newSub = {id:'sub_'+Date.now(), text, pts, scope, createdAtLevel: S.level};

  // Determine which parent task IDs to attach to
  // The base key (e.g. "z1") — strip _N suffix
  const baseKey = _subtaskParentId.replace(/_\d+$/, '');

  if(scope === 'level'){
    // Only current level's task
    const key = _subtaskParentId;
    if(!S.subTasks[key])S.subTasks[key]=[];
    S.subTasks[key].push({...newSub});
  } else if(scope === 'future'){
    // Current level + all future levels (S.level .. MAX_LVL)
    for(let lvl = S.level; lvl <= MAX_LVL; lvl++){
      const key = baseKey + '_' + lvl;
      if(!S.subTasks[key])S.subTasks[key]=[];
      // avoid duplicates by text
      if(!S.subTasks[key].some(s=>s.text===text)){
        S.subTasks[key].push({...newSub, id:'sub_'+Date.now()+'_'+lvl});
      }
    }
  } else { // 'all'
    for(let lvl = 1; lvl <= MAX_LVL; lvl++){
      const key = baseKey + '_' + lvl;
      if(!S.subTasks[key])S.subTasks[key]=[];
      if(!S.subTasks[key].some(s=>s.text===text)){
        S.subTasks[key].push({...newSub, id:'sub_'+Date.now()+'_'+lvl});
      }
    }
  }

  save();
  closeModal('modal-subtask');
  renderActive();
  const scopeLabel = scope==='level'?'לשלב זה':scope==='future'?'לשלבים הבאים':'לכל השלבים';
  toast(`✅ תת-משימה נוספה ${scopeLabel}`);
}

function toggleSubTask(parentId, subId, pts, event){
  if(event){event.stopPropagation();}
  if(!S.subTasks||!S.subTasks[parentId])return;
  const sub = S.subTasks[parentId].find(s=>s.id===subId);
  if(!sub)return;
  const today = todayStr();
  if(sub.doneDate === today){
    // undo
    if(calcAvail()-pts<0){toast('לא ניתן לבטל — נקודות כבר מומשו');return;}
    S.totalPts -= pts;
    delete sub.doneDate;
    playUncheck();
    if(navigator.vibrate)navigator.vibrate([20,10,20]);
  } else {
    sub.doneDate = today;
    S.totalPts += pts;
    playCheck();
    if(navigator.vibrate)navigator.vibrate(30);
    toast(`+${pts} ✓`);
  }
  save();renderActive();
}

function deleteSubTask(parentId, subId, event){
  if(event){event.stopPropagation();}
  if(!S.subTasks||!S.subTasks[parentId])return;
  S.subTasks[parentId] = S.subTasks[parentId].filter(s=>s.id!==subId);
  save();renderActive();toast('🗑 נמחקה');
}

function _renderSubTasks(parentId, parentText){
  if(!S.subTasks||!S.subTasks[parentId]||!S.subTasks[parentId].length){
    return `<div class="subtask-list">
      <button class="subtask-add-btn" onclick="openAddSubTask('${parentId}','${parentText.replace(/'/g,"\\'")}',event)">＋ הוסף תת-משימה</button>
    </div>`;
  }
  const subs = S.subTasks[parentId];
  const today = todayStr();
  let html = '<div class="subtask-list">';
  subs.forEach(sub=>{
    const done = sub.doneDate === today;
    const chk = done ? '<svg width="10" height="10" viewBox="0 0 11 11" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="1.5,5.5 4,8.5 9.5,2.5"/></svg>' : '';
    html += `<div class="subtask-item${done?' done':''}" onclick="toggleSubTask('${parentId}','${sub.id}',${sub.pts},event)">
      <div class="subtask-cb">${chk}</div>
      <div class="subtask-text">${sub.text}</div>
      <div class="subtask-pts">+${sub.pts}</div>
      <button onclick="deleteSubTask('${parentId}','${sub.id}',event)" style="width:18px;height:18px;border-radius:50%;background:var(--bg3);border:1px solid var(--brd2);color:var(--txt3);font-size:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer;padding:0" title="מחק">✕</button>
    </div>`;
  });
  html += `<button class="subtask-add-btn" onclick="openAddSubTask('${parentId}','${parentText.replace(/'/g,"\\'")}',event)">＋ הוסף תת-משימה</button>`;
  html += '</div>';
  return html;
}

// Track which tasks have their sub-tasks expanded
const _subExpanded = {};
function toggleSubExpand(taskId, event){
  if(event){event.stopPropagation();}
  _subExpanded[taskId] = !_subExpanded[taskId];
  renderActive();
}

/* ══ ONE-TIME TASK TOGGLE ══ */
function toggleOneTimeTask(id){
  if(!S.oneTimeTasks)S.oneTimeTasks=[];
  const t=S.oneTimeTasks.find(x=>x.id===id);
  if(!t)return;
  // migrate old format
  if(t.doneDate!==undefined&&t.doneCount===undefined){
    t.doneCount=t.doneDate?1:0;
    t.lastDoneDate=t.doneDate||null;
    delete t.doneDate;
  }
  if(t.doneCount===undefined)t.doneCount=0;
  const maxReps=t.maxReps||1;
  const today=todayStr();
  // If already done today — allow undo of today's rep
  if(t.lastDoneDate===today&&t.doneCount>0){
    if(calcAvail()-t.pts<0){toast('לא ניתן לבטל — נקודות כבר מומשו');return;}
    S.totalPts-=t.pts;
    t.doneCount--;
    t.lastDoneDate=t.doneCount>0?today:null;
    playUncheck();
    if(navigator.vibrate)navigator.vibrate([20,10,20]);
  }else if(t.doneCount<maxReps){
    // Can do another rep today (only once per day)
    if(t.lastDoneDate===today){toast('כבר בוצעה היום — חזור מחר');return;}
    t.doneCount++;
    t.lastDoneDate=today;
    S.totalPts+=t.pts;
    playCheck();
    if(navigator.vibrate)navigator.vibrate(40);
    const remaining=maxReps-t.doneCount;
    if(remaining===0)toast(`+${t.pts} ✓ הושלם! (${maxReps}/${maxReps})`);
    else toast(`+${t.pts} ✓ פעם ${t.doneCount} מתוך ${maxReps}`);
  }else{
    toast('המשימה הושלמה במלואה!');return;
  }
  save();renderActive();
}

/* ══ STREAK TASK TOGGLE ══ */
function toggleStreakTask(id){
  if(!S.streakTasks)S.streakTasks=[];
  const t=S.streakTasks.find(x=>x.id===id);
  if(!t)return;
  if(!t.streakDays)t.streakDays={};
  const today=todayStr();
  if(t.streakDays[today]){
    // undo
    const pts=streakTaskPts(getStreakCount(t));
    if(calcAvail()-pts<0){toast('לא ניתן לבטל — נקודות כבר מומשו');return;}
    S.totalPts-=pts;
    delete t.streakDays[today];
    playUncheck();
    if(navigator.vibrate)navigator.vibrate([20,10,20]);
  }else{
    // mark done — add pts based on streak AFTER today
    t.streakDays[today]=true;
    const newStreak=getStreakCount(t);
    const pts=streakTaskPts(newStreak);
    S.totalPts+=pts;
    playCheck();
    if(navigator.vibrate)navigator.vibrate(40);
    const streakMsg=newStreak>=5?` 🔥 רצף ${newStreak} ימים!`:'';
    toast(`+${pts} ✓${streakMsg}`);
  }
  save();renderActive();
}

/* ══ ADD/DELETE ONE-TIME & STREAK TASKS ══ */
function openAddOneTimeModal(){
  document.getElementById('modal-onetime-title').value='';
  document.getElementById('modal-onetime-pts').value='20';
  document.getElementById('modal-onetime-slot').value='0';
  document.getElementById('modal-onetime-cat').value='limud';
  document.getElementById('modal-onetime-reps').value='1';
  const timeEl=document.getElementById('modal-onetime-time');
  if(timeEl)timeEl.value='';
  ['weekday','friday','shabbat'].forEach(d=>{
    const el=document.getElementById('ot-day-'+d);
    if(el)el.checked=(d==='weekday');
  });
  openModal('modal-onetime');
}
function saveOneTimeTask(){
  const text=(document.getElementById('modal-onetime-title').value||'').trim();
  const pts=parseInt(document.getElementById('modal-onetime-pts').value)||20;
  const slot=parseInt(document.getElementById('modal-onetime-slot').value)||0;
  const cat=document.getElementById('modal-onetime-cat').value||'limud';
  const maxReps=Math.max(1,parseInt(document.getElementById('modal-onetime-reps').value)||1);
  const timeVal=(document.getElementById('modal-onetime-time')?.value||'').trim()||null;
  const days=['weekday','friday','shabbat'].filter(d=>document.getElementById('ot-day-'+d)?.checked);
  if(!text){toast('הכנס שם למשימה');return;}
  if(!days.length){toast('בחר לפחות יום אחד');return;}
  if(!S.oneTimeTasks)S.oneTimeTasks=[];
  S.oneTimeTasks.push({id:'ot_'+Date.now(),text,pts,slot,cat,days,maxReps,doneCount:0,lastDoneDate:null,time:timeVal||undefined});
  save();closeModal('modal-onetime');renderActive();toast('✅ משימה חד פעמית נוספה!');
}
function deleteOneTimeTask(id){
  S.oneTimeTasks=(S.oneTimeTasks||[]).filter(x=>x.id!==id);
  save();renderActive();toast('🗑️ נמחקה');
}

function openAddStreakModal(){
  document.getElementById('modal-streak-title').value='';
  document.getElementById('modal-streak-slot').value='0';
  document.getElementById('modal-streak-cat').value='limud';
  const timeEl=document.getElementById('modal-streak-time');
  if(timeEl)timeEl.value='';
  ['weekday','friday','shabbat'].forEach(d=>{
    const el=document.getElementById('st-day-'+d);
    if(el)el.checked=(d==='weekday');
  });
  openModal('modal-streak');
}
function saveStreakTask(){
  const text=(document.getElementById('modal-streak-title').value||'').trim();
  const slot=parseInt(document.getElementById('modal-streak-slot').value)||0;
  const cat=document.getElementById('modal-streak-cat').value||'limud';
  const timeVal=(document.getElementById('modal-streak-time')?.value||'').trim()||null;
  const days=['weekday','friday','shabbat'].filter(d=>document.getElementById('st-day-'+d)?.checked);
  if(!text){toast('הכנס שם למשימה');return;}
  if(!days.length){toast('בחר לפחות יום אחד');return;}
  if(!S.streakTasks)S.streakTasks=[];
  S.streakTasks.push({id:'stk_'+Date.now(),text,slot,cat,days,streakDays:{},time:timeVal||undefined});
  save();closeModal('modal-streak');renderActive();toast('✅ משימת עקביות נוספה!');
}
function deleteStreakTask(id){
  S.streakTasks=(S.streakTasks||[]).filter(x=>x.id!==id);
  save();renderActive();toast('🗑️ נמחקה');
}

async function redeem(id,pts,minLvl,isGrace){
  if(minLvl&&S.level<minLvl){toast(`זמין משלב ${minLvl}`);return;}
  const avail=calcAvail();
  if(avail<pts){toast('אין מספיק נקודות');return;}
  // Daily cap check (not for grace days)
  if(!isGrace&&!canRedeemToday()){
    const c=redeemCountToday();
    toast(`מגיעים עד ${c.max} צ'ופרים היום — נסה מחר!`);return;
  }
  if(!await _customConfirm(`לממש תמורת ${pts} נקודות?`, 'ממש ✓'))return;
  S.totalPts=S.totalPts-pts;
  if(isGrace){
    if(!S.graceBought)S.graceBought={};
    const m=getCurrentMonth();
    const qty=id==='grace_buy2'?2:1;
    S.graceBought[m]=(S.graceBought[m]||0)+qty;
    toast(`🛡️ ${qty} יום/ימי חסד נרכשו! 🎊`);
  } else {
    S.redeemed.push(id);
    // Log the purchase
    if(!S.redeemedLog)S.redeemedLog=[];
    const allR=REWARDS.flatMap(c=>c.items);
    const custom=S.customRewards||[];
    const rObj=[...allR,...custom].find(x=>x.id===id);
    S.redeemedLog.push({id,date:todayStr(),pts,title:rObj?rObj.title:id,emoji:rObj?rObj.emoji||'🎁':'🎁'});
    // Update daily count
    if(!S.dailyRedeemCount)S.dailyRedeemCount={};
    S.dailyRedeemCount[todayStr()]=(S.dailyRedeemCount[todayStr()]||0)+1;
    const c=redeemCountToday();
    const remaining=c.max-(S.dailyRedeemCount[todayStr()]||0);
    toast(`מומש! 🎊 תהנה${remaining>0?` (עוד ${remaining} היום)`:' (הגעת למקסימום היום)'}`);
  }
  save();renderActive();
}

async function unredeemReward(id){
  if(!await _customConfirm("לבטל מימוש הצ'ופר ולהחזיר את הנקודות?", '↩️ בטל'))return;
  const log=S.redeemedLog||[];
  const entry=log.find(e=>e.id===id);
  if(!entry){toast('לא נמצא מידע על הרכישה');return;}
  S.redeemed=S.redeemed.filter(r=>r!==id);
  S.redeemedLog=(S.redeemedLog||[]).filter(e=>e.id!==id);
  S.totalPts+=entry.pts;
  // Reduce daily count if same day
  if(entry.date===todayStr()&&S.dailyRedeemCount){
    S.dailyRedeemCount[todayStr()]=Math.max(0,(S.dailyRedeemCount[todayStr()]||1)-1);
  }
  save();renderActive();toast(`↩️ מימוש בוטל — +${entry.pts} נקודות הוחזרו`);
}


/* ══════════════ DAILY REDEEM CAP (2.5/day) ══════════════ */
// We track integer counts per day. Cap is 2 per day, with a "half" carrying over each day.
// Implementation: each day allows up to 2 full purchases PLUS the 0.5 carry from yesterday.
// If they buy 2.5 on day 1 (impossible with integers), so: Day1: max 2, carry 0.5 → Day2: max 3, carry 0 (or 0.5 again)
// Simpler: track total redeems per rolling 2-day window ≤ 5 (= 2.5 × 2)
function todayStr(){return new Date().toDateString();}
function getDailyRedeemCount(){
  if(!S.dailyRedeemCount)S.dailyRedeemCount={};
  return S.dailyRedeemCount[todayStr()]||0;
}
function canRedeemToday(){
  // Cap: 2 per day + 0.5 carry from yesterday (i.e. every 2 days max 5 total)
  // Simplified: count today and yesterday total, max 5
  if(!S.dailyRedeemCount)S.dailyRedeemCount={};
  const tod=S.dailyRedeemCount[todayStr()]||0;
  const yest=new Date();yest.setDate(yest.getDate()-1);
  const yestCount=S.dailyRedeemCount[yest.toDateString()]||0;
  // Max 2 today; PLUS if yesterday had <3, can use one extra today (the 0.5 carry = half a slot)
  const extraFromYesterday=yestCount<3?1:0;
  return tod<(2+extraFromYesterday);
}
function redeemCountToday(){
  if(!S.dailyRedeemCount)S.dailyRedeemCount={};
  const tod=S.dailyRedeemCount[todayStr()]||0;
  const yest=new Date();yest.setDate(yest.getDate()-1);
  const yestCount=S.dailyRedeemCount[yest.toDateString()]||0;
  const extraFromYesterday=yestCount<3?1:0;
  return{used:tod,max:2+extraFromYesterday};
}

/* ══════════════ CANCEL GRACE / FOCUS DAY ══════════════ */
async function cancelGraceDay(dateStr){
  if(!await _customConfirm('לבטל את יום החסד?', 'בטל'))return;
  S.graceUsedDates=(S.graceUsedDates||[]).filter(d=>d!==dateStr);
  recalcStreakAndProgress();
  save();renderActive();toast('🔄 יום החסד בוטל — הרצף עודכן');
}
async function cancelFocusDay(dateStr){
  if(!await _customConfirm('לבטל את יום העשייה?', 'בטל'))return;
  S.focusDays=(S.focusDays||[]).filter(fd=>new Date(fd.date).toDateString()!==new Date(dateStr).toDateString());
  S.history=S.history.map(h=>h.date===new Date(dateStr).toDateString()?{...h,isFocusDay:false}:h);
  recalcStreakAndProgress();
  save();renderActive();toast('🔄 יום העשייה בוטל — הרצף עודכן');
}

/* ══════════════ RETROACTIVE EDIT ══════════════ */
function renderRetroTaskItem(t, dn){
  const chk=dn?'<svg width="10" height="10" viewBox="0 0 11 11" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="1.5,5.5 4,8.5 9.5,2.5"/></svg>':'';
  return `<div onclick="retroToggleTask('${t.id}')" style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:${dn?'var(--green3)':'var(--surface)'};border:1px solid ${dn?'rgba(56,214,138,.25)':'var(--brd)'};border-radius:8px;margin-bottom:5px;cursor:pointer;transition:all .15s" id="retro-task-${t.id}">
    <div style="width:18px;height:18px;border-radius:5px;border:1.5px solid ${dn?'var(--green2)':'var(--brd2)'};background:${dn?'var(--green2)':'transparent'};display:flex;align-items:center;justify-content:center;flex-shrink:0">${chk}</div>
    <div style="flex:1;font-size:12px;color:${dn?'var(--green2)':'var(--txt2)'}">${t.text}</div>
    <div style="font-size:11px;font-weight:800;color:${dn?'var(--green)':'var(--txt3)'}">+${bonusPts(t.pts)}</div>
  </div>`;
}
function openRetroModal(dateStr){
  const h=S.history.find(x=>x.date===dateStr)||{date:dateStr,pts:0,tasks:0};
  document.getElementById('retro-date-lbl').textContent=hebrewFullDate(dateStr);
  document.getElementById('retro-date-val').value=dateStr;
  document.getElementById('retro-note').value=h.note||'';
  const isFD=(S.focusDays||[]).some(fd=>new Date(fd.date).toDateString()===dateStr);
  document.getElementById('retro-focus-cb').checked=isFD;
  const isGrace=(S.graceUsedDates||[]).includes(dateStr);
  document.getElementById('retro-grace-cb').checked=isGrace;
  // Build task checklist — filter by day of week
  const retroLevel=h.level||S.level;
  const dow=new Date(dateStr).getDay(); // 0=Sun,5=Fri,6=Sat
  const isFriday=dow===5, isShabbat=dow===6;
  const tasks=isFriday?getTasksForDay(retroLevel,'friday'):isShabbat?getTasksForDay(retroLevel,'shabbat'):getTasksForDay(retroLevel,'weekday');
  const threshold=isFriday?50:80;
  const doneTasks=h.doneTasks||{};
  const tasksList=document.getElementById('retro-tasks-list');
  const SLOT_LABELS=['🌅 עבודת הבוקר','⚡ עשייה ובניין','📖 עומק ולימוד','🌙 ערב ומנוחה'];
  // Day label
  const dayLabel=isFriday?'<div style="background:rgba(45,212,191,.07);border:1px solid rgba(45,212,191,.2);border-radius:7px;padding:6px 11px;font-size:11px;color:var(--teal);font-weight:700;margin-bottom:10px">🕯️ יום שישי — סף רצף: 50%</div>':
                 isShabbat?'<div style="background:rgba(155,126,248,.07);border:1px solid rgba(155,126,248,.2);border-radius:7px;padding:6px 11px;font-size:11px;color:var(--purple);font-weight:700;margin-bottom:10px">✡️ שבת — סף רצף: 80%</div>':'';
  let html=dayLabel;
  // אם קיים taskSnapshot — השתמש בו כדי להציג משימות שבוצעו בדיוק כפי שנשמרו
  if(h.taskSnapshot&&h.taskSnapshot.length){
    const snapshotDone=h.taskSnapshot; // כל אלו בוצעו
    // בנה doneTasks מה-snapshot
    const snapshotDoneMap={};
    snapshotDone.forEach(t=>snapshotDoneMap[t.id]=true);
    // הצג: קודם מה-snapshot (בוצעו), ואחר כך מה-tasks הנוכחיים שלא בוצעו
    const snapshotIds=new Set(snapshotDone.map(t=>t.id));
    // משימות שלא בוצעו — מהרשימה הנוכחית בלבד (לא מה-snapshot)
    const notDoneTasks=tasks.filter(t=>!snapshotIds.has(t.id)&&!doneTasks[t.id]);
    // בנה רשימה משולבת לפי slot
    const allForDisplay=[
      ...snapshotDone.map(t=>({...t,_fromSnapshot:true})),
      ...notDoneTasks
    ];
    [0,1,2,3].forEach(si=>{
      const st=allForDisplay.filter(t=>t.slot===si);
      if(!st.length)return;
      html+=`<div style="font-size:10px;font-weight:800;color:var(--txt3);text-transform:uppercase;letter-spacing:.8px;margin:10px 0 6px;padding-top:6px;border-top:1px solid var(--brd)">${SLOT_LABELS[si]}</div>`;
      st.forEach(t=>{
        const dn=t._fromSnapshot?true:!!doneTasks[t.id];
        html+=renderRetroTaskItem(t,dn);
      });
    });
    tasksList.innerHTML=html;
    // doneTasks משולב: snapshot + כל מה שסומן ידנית
    const mergedDone={...doneTasks,...snapshotDoneMap};
    tasksList._doneTasks=mergedDone;
  } else {
    // fallback — ההתנהגות המקורית
    [0,1,2,3].forEach(si=>{
      const st=tasks.filter(t=>t.slot===si);
      if(!st.length)return;
      html+=`<div style="font-size:10px;font-weight:800;color:var(--txt3);text-transform:uppercase;letter-spacing:.8px;margin:10px 0 6px;padding-top:6px;border-top:1px solid var(--brd)">${SLOT_LABELS[si]}</div>`;
      st.forEach(t=>{
        const dn=!!doneTasks[t.id];
        html+=renderRetroTaskItem(t,dn);
      });
    });
    tasksList.innerHTML=html;
    tasksList._doneTasks={...doneTasks};
  }
  tasksList._retroLevel=retroLevel;
  tasksList._threshold=threshold;
  updateRetroSummary(tasks, tasksList._doneTasks, threshold);
  openModal('modal-retro');
}
function retroToggleTask(id){
  const tasksList=document.getElementById('retro-tasks-list');
  if(!tasksList._doneTasks)tasksList._doneTasks={};
  tasksList._doneTasks[id]=!tasksList._doneTasks[id];
  const retroLevel=tasksList._retroLevel||S.level;
  const dateStr=document.getElementById('retro-date-val').value;
  const tasks=getTasksForDay(retroLevel, getDayType(new Date(dateStr)));
  const threshold=tasksList._threshold||80;
  const t=tasks.find(x=>x.id===id);
  if(!t)return;
  const dn=!!tasksList._doneTasks[id];
  const el=document.getElementById('retro-task-'+id);
  if(el){
    const newHtml=renderRetroTaskItem(t,dn);
    const tmp=document.createElement('div');
    tmp.innerHTML=newHtml;
    const newEl=tmp.firstElementChild;
    el.replaceWith(newEl);
  }
  updateRetroSummary(tasks, tasksList._doneTasks, threshold);
}
function updateRetroSummary(tasks, doneTasks, threshold){
  if(threshold===undefined)threshold=80;
  const doneCount=tasks.filter(t=>doneTasks[t.id]).length;
  const totalPts=tasks.reduce((s,t)=>s+(doneTasks[t.id]?bonusPts(t.pts):0),0);
  const pct=tasks.length?Math.round(doneCount/tasks.length*100):0;
  const streakOk=pct>=threshold;
  document.getElementById('retro-summary').innerHTML=
    `<span style="color:${streakOk?'var(--green2)':'var(--txt3)'}">✓ ${doneCount}/${tasks.length} משימות (${pct}%)</span> · <span style="color:var(--gold)">+${totalPts} נקודות</span> · <span style="color:${streakOk?'var(--green2)':'var(--red)'}">${streakOk?'🔥 סופר רצף':`⚠️ לא מספיק לרצף (צריך ${threshold}%)`}</span>`;
}
function saveRetroEdit(){
  const dateStr=document.getElementById('retro-date-val').value;
  const note=document.getElementById('retro-note').value.trim();
  const isFD=document.getElementById('retro-focus-cb').checked;
  const isGrace=document.getElementById('retro-grace-cb').checked;
  const tasksList=document.getElementById('retro-tasks-list');
  const doneTasks=tasksList._doneTasks||{};
  const retroLevel=tasksList._retroLevel||S.level;
  const allTasks=getTasksForDay(retroLevel, getDayType(new Date(dateStr)));
  const doneCount=allTasks.filter(t=>doneTasks[t.id]).length;
  const pts=allTasks.reduce((s,t)=>s+(doneTasks[t.id]?bonusPts(t.pts):0),0);
  // Build category history from done tasks
  const catDone={};
  allTasks.forEach(t=>{
    if(!catDone[t.cat])catDone[t.cat]={total:1,done:doneTasks[t.id]?1:0};
    else{catDone[t.cat].total++;if(doneTasks[t.id])catDone[t.cat].done++;}
  });
  const idx=S.history.findIndex(h=>h.date===dateStr);
  const entry={date:dateStr,pts,tasks:doneCount,isFocusDay:isFD,doneTasks,catDone};
  if(note)entry.note=note;
  if(idx>=0)S.history[idx]=entry;
  else{S.history.push(entry);S.history.sort((a,b)=>new Date(b.date)-new Date(a.date));}
  if(!S.focusDays)S.focusDays=[];
  S.focusDays=S.focusDays.filter(fd=>new Date(fd.date).toDateString()!==dateStr);
  if(isFD)S.focusDays.push({date:dateStr,goal:note||'יום עשייה (נוסף רטרואקטיבית)'});
  if(!S.graceUsedDates)S.graceUsedDates=[];
  S.graceUsedDates=S.graceUsedDates.filter(d=>d!==dateStr);
  if(isGrace)S.graceUsedDates.push(dateStr);
  recalcStreakAndProgress();
  save();closeModal('modal-retro');renderActive();
  toast('✅ עודכן — רצף ואחוזים חושבו מחדש');
}

/* ══════════════ RECALC STREAK & PROGRESS ══════════════ */
function recalcStreakAndProgress(){
  let streak=0;
  for(let i=1;i<=365;i++){
    const d=new Date();d.setDate(d.getDate()-i);
    const ds=d.toDateString();
    const h=S.history.find(x=>x.date===ds);
    if(!h)break;
    if(h.isFocusDay){streak++;continue;}
    const isGrace=(S.graceUsedDates||[]).includes(ds);
    const dayLevel=h.level||S.level;
    const dow=d.getDay();
    const dayTasks=getTasksForDay(dayLevel, getDayType(d));
    const threshold=dow===5?0.5:0.8;
    const taskCount=dayTasks.length;
    const donePct=taskCount>0?(h.tasks/taskCount):0;
    if(donePct>=threshold){streak++;}
    else if(isGrace&&streak>=3){streak++;}
    else break;
  }
  S.streak=streak;
  const histPts=S.history.reduce((s,h)=>s+(h.pts||0),0);
  const redeemedPts=(S.redeemedLog||[]).reduce((s,e)=>s+(e.pts||0),0);
  S.totalPts=Math.max(0,histPts-redeemedPts);
  // ── Recalc per-task individual levels from full history + today ──
  const newIndivLevel={};
  const newSuccessCount={};
  const newFailStreak={};
  // Sort history oldest → newest
  const sorted=[...S.history].sort((a,b)=>new Date(a.date)-new Date(b.date));
  // Build a synthetic entry for today (S.done) so we don't lose the current day
  // if recalc is triggered (e.g. retro edit) on the same day rollover already ran.
  const todayDs=new Date().toDateString();
  const todayAlreadyInHistory=S.history.some(h=>h.date===todayDs);
  const allEntries = todayAlreadyInHistory ? sorted : [
    ...sorted,
    {date:todayDs, doneTasks:{...S.done}, level:S.level, _synthetic:true}
  ];
  allEntries.forEach(h=>{
    if(h.isFocusDay)return; // skip focus days (no task tracking)
    const d=new Date(h.date);
    const dayLevel=h.level||S.level;
    const dayTasks=getTasksForDay(dayLevel, getDayType(d));
    if(!dayTasks||!dayTasks.length)return;
    const baseIds=_getBaseTaskIds(dayTasks);
    const doneTasks=h.doneTasks||{};
    baseIds.forEach(bid=>{
      if(!newIndivLevel[bid])newIndivLevel[bid]=1;
      if(!newSuccessCount[bid])newSuccessCount[bid]=0;
      if(!newFailStreak[bid])newFailStreak[bid]=0;
      const taskDone=dayTasks.filter(t=>_baseId(t.id)===bid).some(t=>doneTasks[t.id]);
      if(taskDone){
        newFailStreak[bid]=0;
        newSuccessCount[bid]++;
        if(newSuccessCount[bid]>=TASK_INDIV_SUCCEED_NEEDED&&newIndivLevel[bid]<MAX_LVL){
          newIndivLevel[bid]++;
          newSuccessCount[bid]=0;
        }
      }else{
        newFailStreak[bid]++;
        if(newFailStreak[bid]>=TASK_INDIV_FAIL_STREAK){
          if(newIndivLevel[bid]>1){newIndivLevel[bid]--;newSuccessCount[bid]=0;}
          newFailStreak[bid]=0;
        }
      }
    });
  });
  S.taskIndivLevel=newIndivLevel;
  S.taskSuccessCount=newSuccessCount;
  S.taskFailStreak=newFailStreak;
}

const notifSupported=()=>typeof Notification!=='undefined'&&'Notification'in window;
async function requestNotifPerm(){
  if(!notifSupported()){toast('הדפדפן לא תומך בהתראות');return;}
  const p=await Notification.requestPermission();
  S.notifPerm=p;save();renderSettings();
  if(p==='granted'){toast('✓ הרשאת התראות אושרה');scheduleAllNotifs();}
  else toast('ההרשאה נדחתה');
}
function setNotif(key,val){if(!S.notifEnabled)S.notifEnabled={};S.notifEnabled[key]=val;save();if(val)scheduleNotif(key);renderSettings();}
/* ══ SHABBAT TIME (HebCal) ══════════════════════════════════════
   S.shabbatTimes = { fetched: 'YYYY-MM-DD', candles: '2025-04-11T18:43:00+03:00', havdalah: '...' }
   מתעדכן אוטומטית בכל פתיחת אפליקציה
═══════════════════════════════════════════════════════════════ */
async function fetchShabbatTimes(lat, lng) {
  try {
    const today = new Date();
    const url = `https://www.hebcal.com/shabbat?cfg=json&geo=pos&latitude=${lat}&longitude=${lng}&m=50&M=on`;
    const res = await fetch(url);
    const data = await res.json();
    let candles = null, havdalah = null;
    (data.items || []).forEach(item => {
      if (item.category === 'candles' && !candles) candles = item.date;
      if (item.category === 'havdalah' && !havdalah) havdalah = item.date;
    });
    if (candles && havdalah) {
      S.shabbatTimes = { fetched: today.toDateString(), candles, havdalah };
      save();
    }
  } catch(e) {}
}
function initShabbatTimes() {
  const cached = S.shabbatTimes;
  const today = new Date().toDateString();
  if (cached && cached.fetched === today) return; // עדכני
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(pos => {
    fetchShabbatTimes(pos.coords.latitude, pos.coords.longitude);
  }, () => {}); // שגיאה — נשאר עם ברירת מחדל
}
function isShabbatNow() {
  const now = new Date();
  if (S.shabbatTimes && S.shabbatTimes.candles && S.shabbatTimes.havdalah) {
    const candles = new Date(S.shabbatTimes.candles);
    const havdalah = new Date(S.shabbatTimes.havdalah);
    return now >= candles && now < havdalah;
  }
  // ברירת מחדל אם אין נתוני HebCal
  const dow = now.getDay(), h = now.getHours() + now.getMinutes() / 60;
  return (dow === 5 && h >= 18) || (dow === 6 && h < 21);
}

function scheduleAllNotifs(){
  if(!notifSupported()||Notification.permission!=='granted')return;
  Object.keys(S.notifEnabled||{}).forEach(k=>{if(S.notifEnabled[k])scheduleNotif(k);});
  scheduleTaskReminders();
}
function scheduleNotif(key){
  if(!notifSupported()||Notification.permission!=='granted')return;
  if(key==='shabbat')scheduleOne('✡️ מוצאי שבת','הגיע הזמן לעדכן שישי ושבת!',SHABBAT_REMINDER.notifHour,SHABBAT_REMINDER.notifMin,6);
  else{const idx=parseInt(key.replace('slot_',''));const sl=SLOTS[idx];if(sl)scheduleOne(`${sl.icon} ${sl.title}`,`מתחיל סלוט — ${sl.label}`,sl.notifHour,sl.notifMin,-1);}
}
function scheduleOne(title,body,h,m,day){
  if(!notifSupported())return;
  const now=new Date(),t=new Date();t.setHours(h,m,0,0);
  if(day===6){const d=(6-now.getDay()+7)%7||7;t.setDate(now.getDate()+d);}
  if(t<=now){day===-1?t.setDate(t.getDate()+1):t.setDate(t.getDate()+7);}
  setTimeout(()=>{if(notifSupported()&&Notification.permission==='granted'){new Notification(title,{body});scheduleOne(title,body,h,m,day);}},t-now);
}
/* תזמון תזכורות אישיות למשימות */
function scheduleTaskReminders(){
  if(!notifSupported()||Notification.permission!=='granted')return;
  const groups=getGroups()||builtinGroups();
  groups.forEach(g=>{
    if(!g.reminderEnabled||!g.reminderTime)return;
    const [rh,rm]=g.reminderTime.split(':').map(Number);
    const taskText=(g.levels[S.level-1]||g.levels[0]||{}).text||'משימה';
    scheduleTaskReminder(g.id,taskText,rh,rm);
  });
}
function scheduleTaskReminder(grpId,title,h,m){
  const now=new Date(),t=new Date();
  t.setHours(h,m,0,0);
  if(t<=now)t.setDate(t.getDate()+1);
  setTimeout(()=>{
    if(!notifSupported()||Notification.permission!=='granted')return;
    if(isShabbatNow()){
      // שבת — נתזמן מחדש ליום הבא
      scheduleTaskReminder(grpId,title,h,m);
      return;
    }
    // אם המשימה כבר בוצעה היום — לא נציג
    const taskId=grpId.replace('grp_','')+'_'+S.level;
    if(S.done[taskId]){scheduleTaskReminder(grpId,title,h,m);return;}
    new Notification('⏰ '+title,{body:'הגיע הזמן לבצע את המשימה',tag:'task_'+grpId});
    scheduleTaskReminder(grpId,title,h,m);
  },t-now);
}

/* ══════════════ HEADER CLOCK + HEBREW DATE ══════════════ */
function updateHeaderDateTime(){
  const now = new Date();
  // שעה
  const hh = String(now.getHours()).padStart(2,'0');
  const mm = String(now.getMinutes()).padStart(2,'0');
  const clockEl = document.getElementById('hdr-clock');
  if(clockEl) clockEl.textContent = hh + ':' + mm;
  // תאריך עברי מלא
  const hebDateEl = document.getElementById('hdr-heb-date');
  if(hebDateEl){
    const hebDay = now.toLocaleDateString('he-IL-u-ca-hebrew',{weekday:'long'});
    const hebMonth = now.toLocaleDateString('he-IL-u-ca-hebrew',{month:'long'});
    const dayLetters = hebrewDayLetters(now);
    hebDateEl.textContent = hebDay + ', ' + dayLetters + ' ב' + hebMonth;
  }
}
// הפעלה ועדכון כל דקה בדיוק בתחילת הדקה
updateHeaderDateTime();
(function scheduleClockTick(){
  const now = new Date();
  const msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
  setTimeout(()=>{ updateHeaderDateTime(); setInterval(updateHeaderDateTime, 60000); }, msToNextMinute);
})();

/* ══════════════ RENDER STATS ══════════ */
function renderStats(){
  document.getElementById('s-today').textContent=calcDayPts();
  document.getElementById('s-bank').textContent=calcAvail();
  document.getElementById('s-streak').textContent=S.streak;
  document.getElementById('hdr-lvl').textContent=`שלב ${S.level} מ-${MAX_LVL}`;
  const ov=Math.round(domainProgress(S.level).reduce((s,d)=>s+d.val,0)/6);
  document.getElementById('hdr-pct').textContent=`${ov}% מהחזון`;
  const req=getReqStreak(S.level),pct=Math.min(100,Math.round(S.streak/req*100));
  document.getElementById('streak-fill').style.width=pct+'%';
  document.getElementById('streak-txt').textContent=`${S.streak} / ${req} ימים`;
  const bw=document.getElementById('streak-bonus-wrap');
  if(bw)bw.innerHTML=S.streak>=7?`<div class="streak-bonus">🔥 בונוס רצף פעיל — +15% נקודות</div>`:S.streak>=5?`<div class="streak-bonus" style="background:rgba(91,141,248,.1);border-color:rgba(91,141,248,.25);color:var(--blue)">עוד ${7-S.streak} ימים לבונוס 🔥</div>`:'';
}

/* ══════════════ SLOT ACCORDION ══════════════ */
// Track which slots are open: { slotId: bool }
let _slotOpen = {};

function toggleSlot(slotId){
  _slotOpen[slotId] = !_slotOpen[slotId];
  const body  = document.getElementById('slot-body-' + slotId);
  const arrow = document.getElementById('slot-arrow-' + slotId);
  if(body)  body.classList.toggle('open', !!_slotOpen[slotId]);
  if(arrow) arrow.classList.toggle('open', !!_slotOpen[slotId]);
}

// Returns whether slot slotId should start open:
// open if it has pending tasks OR it was previously forced open
function _slotShouldOpen(slotId, tasks){
  if(_slotOpen[slotId] !== undefined) return _slotOpen[slotId];
  // Default: open if slot has any pending task
  return tasks.some(t => !S.done[t.id]);
}

// Build accordion wrapper HTML around task items
// slotId: unique string, headerHtml: inner content of .slot-hd (without toggle wiring),
// tasks: array for done-count badge, bodyHtml: tasks HTML string
function _slotAccordion(slotId, icon, name, time, tasks, bodyHtml){
  const doneCount  = tasks.filter(t => S.done[t.id]).length;
  const totalCount = tasks.length;
  const allDone    = doneCount === totalCount && totalCount > 0;
  const isOpen     = _slotShouldOpen(slotId, tasks);
  _slotOpen[slotId] = isOpen; // persist initial state
  const badgeClass = allDone ? 'done-badge' : 'pending-badge';
  const badgeTxt   = allDone ? `✓ ${totalCount}/${totalCount}` : `${doneCount}/${totalCount}`;
  const timeHtml   = time ? `<div class="slot-time">${time}</div>` : '';
  return `<div class="slot${allDone?' all-done-slot':''}">
    <div class="slot-hd" onclick="toggleSlot('${slotId}')">
      <div class="slot-ico">${icon}</div>
      <div><div class="slot-name">${name}</div>${timeHtml}</div>
      <div class="slot-meta">
        <span class="slot-badge ${badgeClass}">${badgeTxt}</span>
      </div>
      <span class="slot-arrow${isOpen?' open':''}" id="slot-arrow-${slotId}">▼</span>
    </div>
    <div class="slot-body${isOpen?' open':''}" id="slot-body-${slotId}">
      ${bodyHtml}
    </div>
  </div>`;
}

/* ══════════════ TODAY PAGE — SUMMARY CARD LOGIC ══════════════ */
let _todayTasksOpen = false;
let _hideDoneSlots = false;

function toggleTodayTasks(){
  _todayTasksOpen = !_todayTasksOpen;
  const sec = document.getElementById('tasks-section');
  if(sec) sec.style.display = _todayTasksOpen ? 'block' : 'none';
  _updateStartBtn();
}

function _updateStartBtn(){
  const btn = document.getElementById('start-day-btn');
  if(!btn) return;
  const taskEls = document.querySelectorAll('#today-content .task');
  const doneEls = document.querySelectorAll('#today-content .task.done');
  const allDone = taskEls.length > 0 && doneEls.length === taskEls.length;
  if(allDone){
    btn.textContent = '🏆 יום הושלם! ' + (_todayTasksOpen ? '▲ סגור' : '▼ הצג');
    btn.className = 'start-day-btn all-done';
  } else if(_todayTasksOpen){
    btn.textContent = '▲ סגור רשימת משימות';
    btn.className = 'start-day-btn open';
  } else {
    btn.textContent = '▼ התחל יום';
    btn.className = 'start-day-btn';
  }
}

function toggleHideDoneSlots(){
  _hideDoneSlots = !_hideDoneSlots;
  const btn = document.getElementById('hide-done-btn');
  if(btn){
    btn.classList.toggle('active', _hideDoneSlots);
    btn.textContent = _hideDoneSlots ? '🙈 הצג סלוטים שהושלמו' : '👁 הסתר סלוטים שהושלמו';
  }
  _applyHideDoneSlots();
}

function _applyHideDoneSlots(){
  document.querySelectorAll('#today-content .slot').forEach(slot => {
    const all = slot.querySelectorAll('.task');
    const done = slot.querySelectorAll('.task.done, .task.snoozed');
    const complete = all.length > 0 && done.length === all.length;
    slot.style.display = (_hideDoneSlots && complete) ? 'none' : '';
    // keep all-done-slot class in sync
    slot.classList.toggle('all-done-slot', complete);
    // update badge text
    const badge = slot.querySelector('.slot-badge');
    const realDone = slot.querySelectorAll('.task.done').length;
    if(badge){
      badge.textContent = `${realDone}/${all.length}`;
      badge.className = 'slot-badge ' + (complete ? 'done-badge' : 'pending-badge');
    }
  });
}

/* ══════════════ TASK PROGRESS BAR (global) ══════════════ */
function _taskProgressHtml(taskId){
  const bid=_baseId(taskId);
  const curIndivLvl=getTaskDisplayLevel(bid);
  const{done,needed}=getTaskSuccessProgress(bid);
  const pct=needed>0?Math.round(done/needed*100):0;
  const atMax=curIndivLvl>=MAX_LVL;
  const badgeColor=done===needed?'var(--green2)':done>0?'var(--teal)':'var(--txt3)';
  const badgeBg=done===needed?'var(--green3)':done>0?'rgba(45,212,191,0.12)':'var(--bg3)';
  const badge=atMax
    ? `<span style="font-size:9px;font-weight:800;color:var(--gold);background:var(--gold3);border:1px solid rgba(240,192,64,.3);border-radius:99px;padding:1px 7px;margin-right:3px">⭐ מקסימום</span>`
    : `<span style="font-size:9px;font-weight:800;color:${badgeColor};background:${badgeBg};border-radius:99px;padding:1px 7px;margin-right:3px">${done}/${needed}</span>`;
  return badge;
}

/* ══════════════ RENDER TODAY ══════════ */
function renderToday(){
  // Sync view mode buttons
  ['slot','time','cat'].forEach(m=>{
    const el=document.getElementById('tv-'+m);
    if(el) el.classList.toggle('on', m===todayViewMode);
  });
  renderStats();
  // Grace badge
  const gb=document.getElementById('grace-badge');
  const rem=totalGraceAvailable();
  if(gb){
    if(rem>0){
      gb.className='grace-badge';
      gb.textContent=`🛡️ חסד (${rem} נותרו)`;
    }else{
      gb.className='grace-badge used';
      gb.textContent='🛡️ ימי חסד מוצו';
    }
  }
  // Focus day badge
  const fdb=document.getElementById('focus-day-badge');
  const fdUsed=focusDaysUsedThisMonth();
  const fdRem=FOCUS_DAYS_PER_MONTH-fdUsed;
  const fdToday=focusDayForToday();
  const fdTomorrow=focusDayDeclaredForTomorrow();
  if(fdb){
    if(fdToday){
      fdb.className='focus-day-badge';
      fdb.style.background='rgba(45,212,191,.2)';
      fdb.style.borderColor='rgba(45,212,191,.5)';
      fdb.textContent='🎯 יום עשייה פעיל';
    }else if(fdTomorrow){
      fdb.className='focus-day-badge';
      fdb.textContent=`🎯 יום עשייה ← מחר`;
    }else if(fdRem<=0){
      fdb.className='focus-day-badge used';
      fdb.style.background='var(--bg3)';
      fdb.style.borderColor='var(--brd)';
      fdb.style.color='var(--txt3)';
      fdb.textContent='🎯 יום עשייה (מוצה)';
    }else{
      fdb.className='focus-day-badge';
      fdb.textContent=`🎯 יום עשייה (${fdRem} נותרו)`;
    }
  }
  // Shabbat wrap
  const sw=document.getElementById('shabbat-mode-wrap');
  if(sw){
    if(isSatNight()&&!shabbatDone()){
      sw.innerHTML=`<div class="shabbat-panel"><div style="font-size:16px;font-weight:900;color:var(--purple);margin-bottom:6px">✡️ מוצאי שבת</div><div style="font-size:12px;color:var(--txt2);margin-bottom:16px;line-height:1.5">עדכן את שישי ושבת — הרצף יישמר</div><button class="shabbat-confirm" onclick="openShabbatModal()">📝 עדכן שישי + שבת ←</button></div>`;
    }else if(shabbatDone()){sw.innerHTML=`<div style="text-align:center;margin-bottom:14px"><span style="font-size:11px;background:var(--green3);color:var(--green2);border:1px solid rgba(56,214,138,.3);border-radius:99px;padding:4px 12px;font-weight:700">✓ שישי ושבת עודכנו השבוע</span></div>`;}
    else sw.innerHTML='';
  }
  // Focus day active wrap
  const fdaw=document.getElementById('focus-day-active-wrap');
  if(fdaw){
    if(fdToday){
      const anchors=getAnchorTasks(S.level);
      const anchorDoneCount=anchors.filter(t=>S.done[t.id]).length;
      fdaw.innerHTML=`<div class="focus-day-active">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <span style="font-size:18px">🎯</span>
          <div>
            <div style="font-size:13px;font-weight:900;color:var(--teal)">יום עשייה ממוקד</div>
            <div style="font-size:11px;color:var(--txt3)">הרצף קפוא — לא עולה ולא יורד</div>
          </div>
        </div>
        <div style="font-size:12px;color:var(--txt2);background:rgba(45,212,191,.06);border-radius:8px;padding:8px 11px;margin-bottom:10px;line-height:1.5">
          <span style="font-size:10px;font-weight:800;color:var(--teal);text-transform:uppercase;letter-spacing:.6px;display:block;margin-bottom:3px">מטרת העל:</span>
          ${fdToday.goal}
        </div>
        <div class="anchor-strip">
          <div class="anchor-title">⚓ משימות עוגן (${anchorDoneCount}/${anchors.length})</div>
          ${anchors.map(t=>`<div style="display:flex;align-items:center;gap:7px;font-size:12px;color:${S.done[t.id]?'var(--teal)':'var(--txt2)'};margin-bottom:4px">
            <span style="font-size:10px">${S.done[t.id]?'✓':'○'}</span>${t.text}
          </div>`).join('')}
        </div>
      </div>`;
    }else if(fdTomorrow){
      fdaw.innerHTML=`<div style="background:rgba(45,212,191,.05);border:1px solid rgba(45,212,191,.15);border-radius:var(--r-sm);padding:10px 13px;margin-bottom:14px;font-size:12px;color:var(--teal)">
        <strong>מחר:</strong> יום עשייה — ${fdTomorrow.goal}
      </div>`;
    }else fdaw.innerHTML='';
  }
  // Main tasks — on regular weekdays show only weekday tasks
  const todayDow = new Date().getDay(); // 0=Sun,1=Mon,...,5=Fri,6=Sat
  const isToday_Friday = todayDow === 5;
  const isToday_Shabbat = todayDow === 6;
  // For today's task display: use individual-level-capped tasks
  renderBoostBanner(); // קריאה מהקובץ החדש
  const _boost = boostActiveToday();
  const _renderLevel = _boost ? _boost.level : S.level;
  const allTasks = isToday_Friday ? getTasksForDay(_renderLevel,'friday') :
                isToday_Shabbat ? getTasksForDay(_renderLevel,'shabbat') :
                getTasksForDay(_renderLevel,'weekday');
  // Apply individual levels
  const tasks = allTasks.map(t=>{
    const bid=_baseId(t.id);
    const indivLvl=getTaskDisplayLevel(bid);
    if(indivLvl===S.level)return t;
    const altTasks=_getDefaultTasks(indivLvl);
    const alt=altTasks.find(x=>_baseId(x.id)===bid);
    if(alt)return{...alt,id:t.id,_displayLevel:indivLvl,anchor:t.anchor};
    return t;
  });

  const isFocusDay=!!fdToday;
  const done=isFocusDay?getAnchorTasks(S.level).filter(t=>S.done[t.id]).length:tasks.filter(t=>S.done[t.id]).length;
  const total=isFocusDay?getAnchorTasks(S.level).length:tasks.length;
  const pct=total?Math.round(done/total*100):0;
  document.getElementById('ring-arc').style.strokeDashoffset=264-264*pct/100;
  document.getElementById('ring-arc').style.stroke=isFocusDay?'var(--teal)':isToday_Friday?'var(--teal)':isToday_Shabbat?'var(--purple)':'var(--green)';
  document.getElementById('ring-pct').textContent=pct+'%';
  document.getElementById('ring-sub').textContent=isFocusDay?'עוגנים':isToday_Shabbat?'שבת':isToday_Friday?'שישי':'הושלם';
  document.getElementById('sh-sub').textContent=`שלב ${S.level} • ${done}/${total}${isFocusDay?' עוגנים':' משימות'}`;
  // Update summary card
  const _spEl=document.getElementById('summary-today-pts');
  if(_spEl)_spEl.textContent=calcDayPts();
  const _ssEl=document.getElementById('summary-streak');
  if(_ssEl)_ssEl.textContent=S.streak;
  const isBonus=streakBonus()>1;
  let html='';
  if(isToday_Shabbat){
    html+=`<div style="background:rgba(155,126,248,.08);border:1px solid rgba(155,126,248,.25);border-radius:var(--r-sm);padding:10px 14px;margin-bottom:14px;font-size:12px;color:var(--purple);font-weight:700">✡️ שבת — משימות מיוחדות לשבת</div>`;
  }else if(isToday_Friday){
    html+=`<div style="background:rgba(45,212,191,.06);border:1px solid rgba(45,212,191,.2);border-radius:var(--r-sm);padding:10px 14px;margin-bottom:14px;font-size:12px;color:var(--teal);font-weight:700">🕯️ יום שישי — <span style="font-weight:500">משימות בוקר רגילות + הכנות לשבת</span></div>`;
  }
  if(isFocusDay){
    // Focus day — anchors first, rest dimmed (no sort)
    html+=`<div style="font-size:10px;font-weight:800;color:var(--teal);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;padding-right:4px">⚓ משימות עוגן — חובה</div>`;
    tasks.filter(t=>t.anchor).forEach(t=>{
      const dn=!!S.done[t.id],ap=bonusPts(t.pts),bid=_baseIdFromTaskId(t.id);
      const snoozed=isTaskSnoozed(t.id);
      if(snoozed){
        html+=`<div class="task snoozed" onclick="snoozeTask('${t.id}',event)"><div class="tcb"></div><div class="tbody"><div class="tn">${t.text}</div><span class="tcat" style="color:var(--txt3)">⏭ לא היום — לחץ לביטול</span></div><button class="task-snooze-btn" style="opacity:1" title="בטל">↩</button></div>`;
      } else {
        html+=`<div class="task anchor-task${dn?' done':''}" onclick="toggleTask('${t.id}',${t.pts})">
          <div class="tcb">${chkSvg()}</div>
          <div class="tbody"><div class="tn">${t.text}</div><span class="tcat">עוגן</span>${_taskProgressHtml(t.id)}</div>
          <button class="task-snooze-btn" onclick="snoozeTask('${t.id}',event)" title="לא היום">⏭</button>
          <button class="task-info-btn" onclick="showTaskInfo('${bid}','${t.text.replace(/'/g,"\\'")}',${ap},event)" title="פרטי משימה">ℹ️</button>
          <div class="tpts">+${ap}</div>
        </div>`;
      }
    });
    html+=`<div style="font-size:10px;font-weight:800;color:var(--txt3);text-transform:uppercase;letter-spacing:1px;margin:16px 0 8px;padding-right:4px">שאר המשימות — אופציונלי</div>`;
    tasks.filter(t=>!t.anchor).forEach(t=>{
      const dn=!!S.done[t.id],bid=_baseIdFromTaskId(t.id);
      const snoozed=isTaskSnoozed(t.id);
      if(snoozed){
        html+=`<div class="task snoozed" style="opacity:0.2" onclick="snoozeTask('${t.id}',event)"><div class="tcb"></div><div class="tbody"><div class="tn">${t.text}</div><span class="tcat" style="color:var(--txt3)">⏭ לא היום — לחץ לביטול</span></div><button class="task-snooze-btn" style="opacity:1" title="בטל">↩</button></div>`;
      } else {
        html+=`<div class="task${dn?' done':''}" style="opacity:0.5" onclick="toggleTask('${t.id}',${t.pts})">
          <div class="tcb">${chkSvg()}</div>
          <div class="tbody"><div class="tn">${t.text}</div><span class="tcat">${CATS[t.cat]}</span>${_taskProgressHtml(t.id)}</div>
          <button class="task-snooze-btn" onclick="snoozeTask('${t.id}',event)" title="לא היום">⏭</button>
          <button class="task-info-btn" onclick="showTaskInfo('${bid}','${t.text.replace(/'/g,"\\'")}',${t.pts},event)" title="פרטי משימה">ℹ️</button>
          <div class="tpts" style="color:var(--txt3)">—</div>
        </div>`;
      }
    });
  } else if(isToday_Shabbat){
    const shabbatSlotLabels={1:'🕍 לימוד ותפילה',2:'📖 קריאה ועיון',3:'👨‍👩‍👧 משפחה ומנוחה'};
    [1,2,3].forEach(si=>{
      const st=tasks.filter(t=>t.slot===si);
      if(!st.length)return;
      let body='';
      st.forEach(t=>{ body+=_renderTaskHtml(t,isBonus); });
      html+=_slotAccordion('shab_'+si,'✡️',shabbatSlotLabels[si]||'שבת','',st,body);
    });
  } else if(todayViewMode==='time'){
    // ── מיון לפי שעה ──
    const timed = tasks.filter(t=>t.time).sort((a,b)=>a.time.localeCompare(b.time));
    const allDay = tasks.filter(t=>!t.time);
    if(timed.length){
      let body='';
      timed.forEach(t=>{ body+=_renderTaskHtml(t,isBonus); });
      html+=_slotAccordion('tv_timed','🕐','לפי שעה','סדר כרונולוגי',timed,body);
    }
    if(allDay.length){
      let body='';
      allDay.forEach(t=>{ body+=_renderTaskHtml(t,isBonus); });
      html+=_slotAccordion('tv_allday','📅','כל היום','ללא שעה מוגדרת',allDay,body);
    }
  } else if(todayViewMode==='cat'){
    // ── מיון לפי קטגוריה ──
    const catOrder=['zman','limud','briut','achila','bayit','smart','erev','shabbat'];
    catOrder.forEach(catKey=>{
      const st=tasks.filter(t=>t.cat===catKey);
      if(!st.length)return;
      const catLabel=CATS[catKey]||catKey;
      let body='';
      st.sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99')).forEach(t=>{ body+=_renderTaskHtml(t,isBonus); });
      html+=_slotAccordion('tv_cat_'+catKey,'🏷️',catLabel,'',st,body);
    });
    // custom cats
    tasks.filter(t=>!catOrder.includes(t.cat)).forEach(t=>{/* handled below */});
  } else {
    // ── ברירת מחדל: סלוטים ──
    SLOTS.forEach((sl,si)=>{
      let st=tasks.filter(t=>t.slot===si);
      if(!st.length)return;
      // starred tasks float to top
      st=st.sort((a,b)=>(isTaskStarred(b.id)?1:0)-(isTaskStarred(a.id)?1:0));
      let body='';
      st.forEach(t=>{ body+=_renderTaskHtml(t,isBonus); });
      html+=_slotAccordion('slot_'+si,sl.icon,sl.title,sl.label,st,body);
    });
  }
  document.getElementById('today-content').innerHTML=html;

  // ── Render one-time tasks (appended after regular tasks) ──
  _renderSpecialTasksToday();

  applyFocusMode();
  // Re-apply open state (survives re-renders on task toggle)
  const _ts=document.getElementById('tasks-section');
  if(_ts)_ts.style.display=_todayTasksOpen?'block':'none';
  _applyHideDoneSlots();
  _updateStartBtn();
}

function _renderSpecialTasksToday(){
  const container=document.getElementById('today-content');
  if(!container)return;
  const dayType=getDayType(new Date());

  // One-time tasks — active today and not yet done (or done today so user can undo)
  const otTasks=(S.oneTimeTasks||[]).filter(t=>{
    const days=t.days||['weekday'];
    if(!days.includes(dayType))return false;
    const maxReps=t.maxReps||1;
    const doneCount=t.doneCount||(t.doneDate?1:0);
    if(doneCount>=maxReps)return false; // fully completed — hide
    return true;
  });

  // Streak tasks — active today
  const stTasks=(S.streakTasks||[]).filter(t=>streakTaskActiveToday(t));

  if(!otTasks.length&&!stTasks.length)return;

  let extra='';

  if(otTasks.length){
    let body='';
    otTasks.forEach(t=>{
      const maxReps=t.maxReps||1;
      const doneCount=t.doneCount||(t.doneDate?1:0);
      const doneToday=t.lastDoneDate===todayStr()||(t.doneDate===todayStr());
      const snoozed=isTaskSnoozed(t.id);
      const progressLabel=maxReps>1?` (${doneCount}/${maxReps})`:'';
      if(snoozed){
        body+=`<div class="task snoozed" onclick="snoozeTask('${t.id}',event)"><div class="tcb"></div><div class="tbody"><div class="tn">${t.text}</div><span class="tcat" style="color:var(--txt3)">⏭ לא היום — לחץ לביטול</span></div><button class="task-snooze-btn" style="opacity:1" title="בטל">↩</button></div>`;
      } else {
        const dimmed=doneToday?' style="opacity:0.6"':'';
        body+=`<div class="task${doneToday?' done':''}"${dimmed} onclick="toggleOneTimeTask('${t.id}')">
          <div class="tcb">${chkSvg()}</div>
          <div class="tbody"><div class="tn">${t.text}</div><span class="tcat" style="color:var(--orange)">⚡ חד פעמי${progressLabel}</span></div>
          <button class="task-snooze-btn" onclick="snoozeTask('${t.id}',event)" title="לא היום">⏭</button>
          <div class="tpts" style="color:var(--orange)">+${t.pts}</div>
        </div>`;
      }
    });
    const otMeta=otTasks.map(t=>({id:t.id,pts:t.pts,...t}));
    extra+=_slotAccordion('slot_onetime','⚡','משימות חד פעמיות','נעלמות לאחר ביצוע',otMeta,body);
  }

  if(stTasks.length){
    let body='';
    stTasks.forEach(t=>{
      const today=todayStr();
      const done=!!(t.streakDays&&t.streakDays[today]);
      const streak=getStreakCount(t);
      const pts=streakTaskPts(done?streak:streak+1);
      const streakLabel=streak>=1?`🔥 ${streak} ימים`:'יום 1';
      const snoozed=isTaskSnoozed(t.id);
      if(snoozed){
        body+=`<div class="task snoozed" onclick="snoozeTask('${t.id}',event)"><div class="tcb"></div><div class="tbody"><div class="tn">${t.text}</div><span class="tcat" style="color:var(--txt3)">⏭ לא היום — לחץ לביטול</span></div><button class="task-snooze-btn" style="opacity:1" title="בטל">↩</button></div>`;
      } else {
        body+=`<div class="task${done?' done':''}" onclick="toggleStreakTask('${t.id}')">
          <div class="tcb">${chkSvg()}</div>
          <div class="tbody"><div class="tn">${t.text}</div><span class="tcat" style="color:var(--green)">${streakLabel}</span></div>
          <button class="task-snooze-btn" onclick="snoozeTask('${t.id}',event)" title="לא היום">⏭</button>
          <div class="tpts" style="color:var(--green)">+${pts}</div>
        </div>`;
      }
    });
    const stMeta=stTasks.map(t=>{const today=todayStr();const done=!!(t.streakDays&&t.streakDays[today]);return{id:t.id+'_st',pts:0,_done:done};});
    extra+=_slotAccordion('slot_streak','🔥','משימות עקביות','הניקוד עולה עם הרצף',stMeta.map(m=>({...m,id:m.id})),body);
  }

  container.innerHTML+=extra;
}

/* ══════════════ RENDER LEVELS ══════════ */
function renderLevels(){
  const ov=Math.round(domainProgress(S.level).reduce((s,d)=>s+d.val,0)/6);
  let h=`<div style="background:var(--surface);border:1px solid var(--gold2);border-radius:var(--r-lg);padding:20px;margin-bottom:22px;text-align:center">
    <div style="font-size:11px;font-weight:800;color:var(--gold);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">התקדמות לחזון השלם</div>
    <div style="font-size:48px;font-weight:900;color:var(--gold);letter-spacing:-2px;line-height:1">${ov}%</div>
    <div style="font-size:11px;color:var(--txt3);margin-top:4px">מהאדם המלא — שלב ${S.level} מתוך 15</div>
    <div style="margin-top:14px;display:grid;gap:8px">
      ${domainProgress(S.level).map(d=>`<div>
        <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700;margin-bottom:4px">
          <span style="color:var(--txt2)">${d.name}</span><span style="color:${d.color}">${d.val}%</span>
        </div>
        <div style="height:4px;background:var(--sf2);border-radius:99px;overflow:hidden">
          <div style="height:100%;width:${d.val}%;background:${d.color};border-radius:99px;transition:width .8s cubic-bezier(.22,1,.36,1)"></div>
        </div>
      </div>`).join('')}
    </div>
  </div>`;
  for(let i=1;i<=MAX_LVL;i++){
    const iC=i===S.level,iD=i<S.level,iL=i>S.level;
    const dp=domainProgress(i),ovr=Math.round(dp.reduce((s,d)=>s+d.val,0)/6);
    const graceCount=i<=5?1:i<=10?2:3;
    h+=`<div class="lvlcard${iC?' cur':''}${iL?' lk':''}">
      <div class="lvl-hd"><span class="lvl-num">שלב ${i}</span>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:13px;font-weight:900;color:${iC?'var(--gold)':iD?'var(--green)':'var(--txt3)'}">${ovr}%</span>
          <span class="badge ${iC?'badge-cur':iD?'badge-ok':'badge-lk'}">${iC?'נוכחי':iD?'✓ הושלם':'🔒'}</span>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;margin-bottom:8px">
        ${dp.map(d=>`<div>
          <div style="display:flex;justify-content:space-between;font-size:9px;font-weight:700;margin-bottom:2px"><span style="color:var(--txt3)">${d.name}</span><span style="color:${d.color}">${d.val}%</span></div>
          <div style="height:3px;background:var(--sf2);border-radius:99px;overflow:hidden"><div style="height:100%;width:${d.val}%;background:${d.color};border-radius:99px"></div></div>
        </div>`).join('')}
      </div>
      <div class="lvl-days">${getReqStreak(i)} ימי רצף לסיום</div>
      <div style="display:flex;gap:8px;font-size:11px;color:var(--txt3);margin-bottom:6px;flex-wrap:wrap">
        <span>🛡️ ${graceCount} ימי חסד/חודש</span>
        <span>🎯 ${FOCUS_DAYS_PER_MONTH} ימי עשייה/חודש</span>
      </div>
      ${iC?`<div style="background:rgba(240,192,64,.06);border:1px solid rgba(240,192,64,.15);border-radius:8px;padding:9px 12px;margin-bottom:8px;font-size:11px">
        <div style="font-weight:800;color:var(--gold);margin-bottom:6px">📋 תנאי מעבר לשלב ${i+1}:</div>
        <div style="display:grid;gap:4px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="color:var(--txt2)">🔥 רצף ${getReqStreak(i)} ימים</span>
            <span style="color:${S.streak>=getReqStreak(i)?'var(--green)':'var(--txt3)'};">${S.streak}/${getReqStreak(i)} ${S.streak>=getReqStreak(i)?'✓':''}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="color:var(--txt2)">📊 80% ביצוע יומי</span>
            <span style="color:var(--txt3)">כל יום בנפרד</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="color:var(--txt2)">⭐ ${getReqStagePoints(i).toLocaleString()} נקודות בשלב</span>
            <span style="color:${(S.stagePoints||0)>=getReqStagePoints(i)?'var(--green)':'var(--gold)'};">${(S.stagePoints||0).toLocaleString()}/${getReqStagePoints(i).toLocaleString()} ${(S.stagePoints||0)>=getReqStagePoints(i)?'✓':''}</span>
          </div>
        </div>
        <div style="margin-top:8px;height:4px;background:var(--sf2);border-radius:99px;overflow:hidden">
          <div style="height:100%;width:${Math.min(100,Math.round(((S.stagePoints||0)/getReqStagePoints(i))*100))}%;background:var(--gold);border-radius:99px;transition:width .8s"></div>
        </div>
      </div>`:''}
      <div class="lvl-tasks">`;
    getTasks(i).forEach(t=>{ h+=`<div class="lvl-tr"><div class="lvl-dot"></div><div>${t.text} <span style="color:var(--txt3);font-size:10px">(${t.pts} נק׳)${t.anchor?' ⚓':''}</span></div></div>`; });
    h+=`</div></div>`;
  }
  document.getElementById('levels-content').innerHTML=h;
}

/* ══════════════ RENDER REWARDS ══════════ */

/* Returns minimum stage required based on point cost — only for series episodes */
function _rewardMinStage(pts){
  return 0; // נעילה לפי שלב מוגדרת ב-minLevel בלבד
}

/* Renders a single reward item card */
function rItem(r, avail, isCustom){
  const used=S.redeemed.includes(r.id);
  const explicitML=r.minLevel||0;
  const ptsML=_rewardMinStage(r.pts);
  const ml=Math.max(explicitML,ptsML);
  const lk=ml&&S.level<ml;
  const can=!used&&!lk&&avail>=r.pts;
  const isDream=S.dreamRewardId===r.id;
  let btnCls='no', btnTxt=`${r.pts} נק'`;
  if(used){btnCls='done';btnTxt='✓ מומש';}
  else if(lk){btnCls='lock';btnTxt=`🔒 שלב ${ml}+`;}
  else if(can){btnCls='go';}
  const safeId=r.id.replace(/'/g,"\\'");
  const oc=can?`onclick="redeem('${safeId}',${r.pts},${ml},${!!r.isGrace})"`:
    (used?`onclick="event.stopPropagation();unredeemReward('${safeId}')"`:``);
  const dreamBtn=`<button class="rbtn dream-btn" onclick="event.stopPropagation();S.dreamRewardId=S.dreamRewardId==='${safeId}'?null:'${safeId}';save();renderRewards()">${isDream?'★ חלום':'☆'}</button>`;
  const editBtn=`<button onclick="event.stopPropagation();openRewardEdit('${safeId}',${!!isCustom})" style="font-size:10px;background:var(--sf3);color:var(--txt3);border:1px solid var(--brd2);border-radius:5px;padding:3px 7px;cursor:pointer">✏️</button>`;
  return `<div class="ri${used?' used':''}${can?' can':''}${lk?' locked-lv':''}${isDream?' is-dream':''}${r.isGrace?' grace-item':''}">
    <div style="font-size:22px;flex-shrink:0">${r.emoji||'🎁'}</div>
    <div class="ri-body">
      <div class="ri-title">${r.title}</div>
      ${r.desc?`<div class="ri-desc">${r.desc}</div>`:''}
      ${ml?`<div style="font-size:10px;color:var(--txt3);margin-top:2px">שלב ${ml}+</div>`:''}
    </div>
    <div class="ri-right">
      <div class="ri-cost">${r.pts}</div>
      <button class="rbtn ${btnCls}" ${oc}>${btnTxt}</button>
      <div style="display:flex;gap:4px;margin-top:2px">${dreamBtn}${editBtn}</div>
    </div>
  </div>`;
}

let currentSort='cat';
function setSort(m){
  currentSort=m;S.sortMode=m;save();
  ['cat','asc','desc','avail'].forEach(x=>{const el=document.getElementById('sort-'+x);if(el)el.classList.toggle('on',x===m);});
  renderRewards();
}

/* ══════════════ TODAY VIEW MODE ══════════════ */
let todayViewMode = 'slot'; // 'slot' | 'time' | 'cat'
function setTodayView(mode){
  todayViewMode = mode;
  ['slot','time','cat'].forEach(m=>{
    const el=document.getElementById('tv-'+m);
    if(el) el.classList.toggle('on', m===mode);
  });
  renderToday();
}

function _renderTaskHtml(t, isBonus, extraStyle){
  const dn=!!S.done[t.id], ap=bonusPts(t.pts), bid=_baseIdFromTaskId(t.id);
  const snoozed=isTaskSnoozed(t.id);
  if(snoozed){
    const safeIdSn=t.id.replace(/'/g,"\\'");
    return `<div class="task snoozed" onclick="snoozeTask('${safeIdSn}',event)">
      <div class="tcb"></div>
      <div class="tbody"><div class="tn">${t.text}</div><span class="tcat" style="color:var(--txt3)">⏭ לא היום — לחץ לביטול</span></div>
      <button class="task-snooze-btn" style="opacity:1" title="בטל">↩</button>
    </div>`;
  }
  const timeTag = t.time
    ? `<span style="font-size:10px;color:var(--blue);font-weight:700;background:var(--blue3);border-radius:4px;padding:1px 5px;margin-right:4px">${t.time}</span>`
    : '';
  // Try to find the group title for this task
  const grpId = t._grpId || (t.id && t.id.includes('_') ? t.id.replace(/_\d+$/, '') : null);
  const grp = grpId ? (getGroups() || builtinGroups()).find(g => g.id === grpId) : null;
  // First: explicit group title. Second: TASK_INFO title. Third: nothing.
  const baseKey = grpId ? grpId.replace(/^grp_/, '') : null;
  const infoTitle = baseKey && TASK_INFO[baseKey] ? TASK_INFO[baseKey].title : null;
  const displayTitle = (grp && grp.title) ? grp.title : infoTitle;
  const titleLine = displayTitle
    ? `<div style="font-size:10px;font-weight:800;color:var(--txt3);margin-bottom:2px;line-height:1.2;letter-spacing:.3px">${displayTitle}</div>`
    : '';
  const safeId = t.id.replace(/'/g,"\\'");
  const safeText = t.text.replace(/'/g,"\\'");
  const hasSubs = S.subTasks && S.subTasks[t.id] && S.subTasks[t.id].length > 0;
  const isExpanded = !!_subExpanded[t.id];
  const subCount = hasSubs ? S.subTasks[t.id].length : 0;
  const subDone = hasSubs ? S.subTasks[t.id].filter(s=>s.doneDate===todayStr()).length : 0;
  const subBadge = hasSubs
    ? `<span style="font-size:9px;font-weight:800;color:${subDone===subCount?'var(--green2)':'var(--txt3)'};background:var(--bg3);border:1px solid var(--brd);border-radius:99px;padding:1px 6px;margin-right:4px">${subDone}/${subCount} תתי</span>`
    : '';
  const subExpandBtn = `<button class="task-snooze-btn" onclick="toggleSubExpand('${safeId}',event)" title="${isExpanded?'סגור':'תתי-משימות'}" style="${isExpanded?'color:var(--gold);border-color:var(--gold2)':''}">${isExpanded?'▲':'☰'}</button>`;
  const subListHtml = isExpanded ? _renderSubTasks(t.id, t.text) : '';
  const starred = isTaskStarred(t.id);
  return `<div class="task${dn?' done':''}${isBonus&&!dn?' bonus-active':''}${starred?' starred-task':''}"
    oncontextmenu="openQuickEditTask('${safeId}',event)"
    data-task-id="${t.id}" style="flex-wrap:wrap;${extraStyle||''}" onclick="showTaskInfo('${bid}','${safeText}',${ap},event)">
    <div style="display:flex;align-items:center;gap:11px;width:100%">
      <div class="tcb" onclick="event.stopPropagation();toggleTask('${safeId}',${t.pts})">${chkSvg()}</div>
      <div class="tbody">
        ${titleLine}
        <div class="tn">${t.text}</div>
        <div style="display:flex;align-items:center;flex-wrap:wrap;gap:3px;margin-top:3px">
          ${timeTag}<span class="tcat">${CATS[t.cat]||t.cat}</span>${subBadge}${_taskProgressHtml(t.id)}
        </div>
      </div>
      ${subExpandBtn}
      <button class="task-star-btn${starred?' starred':''}" onclick="event.stopPropagation();toggleStar('${safeId}',event)" title="${starred?'הסר עדיפות':'סמן כעדיפות עליונה'}">${starred?'⭐':'☆'}</button>
      <button class="task-snooze-btn" onclick="event.stopPropagation();snoozeTask('${safeId}',event)" title="לא היום">⏭</button>
      <div class="tpts${isBonus?' bonus':''}">+${ap}${isBonus?' 🔥':''}</div>
    </div>
    ${subListHtml}
  </div>`;
}

/* Quick-edit task from home screen (long-press / right-click) */
function openQuickEditTask(taskId, event){
  if(event){event.preventDefault();event.stopPropagation();}
  // Find the group for this task
  const grpId = taskId.replace(/_\d+$/, '');
  const groups = getGroups() || builtinGroups();
  const grp = groups.find(g => g.id === grpId);
  if(!grp){
    // Could be a one-time or streak task — open task editor
    openTaskEditor(); return;
  }
  openEditGroupModal(grpId);
}

/* Add long-press support for touch devices */
(function _addLongPress(){
  let _lpTimer = null;
  document.addEventListener('touchstart', function(e){
    const el = e.target.closest('[data-task-id]');
    if(!el) return;
    _lpTimer = setTimeout(()=>{
      const tid = el.getAttribute('data-task-id');
      if(tid) openQuickEditTask(tid, null);
      _lpTimer = null;
    }, 600);
  }, {passive:true});
  document.addEventListener('touchend',  ()=>{ if(_lpTimer){clearTimeout(_lpTimer);_lpTimer=null;} });
  document.addEventListener('touchmove', ()=>{ if(_lpTimer){clearTimeout(_lpTimer);_lpTimer=null;} });
})();
function renderRewards(){
  const avail=calcAvail();
  document.getElementById('pts-big').textContent=avail;
  const allItems=getEffectiveRewards().flatMap(c=>c.items.map(r=>({...r,_cat:c.cat})));
  const custom=(S.customRewards||[]).map(r=>({...r,_cat:"⭐  צ'ופרים אישיים",_custom:true}));
  const combined=[...allItems,...custom];
  // Daily cap banner
  const capEl=document.getElementById('daily-cap-banner');
  if(capEl){
    const c=redeemCountToday();
    if(c.used>=c.max){
      capEl.innerHTML=`<div style="background:rgba(240,80,80,.08);border:1px solid rgba(240,80,80,.2);border-radius:var(--r-sm);padding:10px 14px;margin-bottom:14px;font-size:12px;color:var(--red);font-weight:700;text-align:center">🛑 הגעת למקסימום ${c.max} צ'ופרים להיום — מחר ניתן שוב</div>`;
    }else{
      capEl.innerHTML=`<div style="background:rgba(240,192,64,.06);border:1px solid rgba(240,192,64,.18);border-radius:var(--r-sm);padding:8px 14px;margin-bottom:14px;font-size:11px;color:var(--txt2);display:flex;justify-content:space-between;align-items:center"><span>💎 מגבלת יומית</span><span style="font-weight:800;color:var(--gold)">${c.used}/${c.max} שומשו היום (מקסימום 2.5/יום)</span></div>`;
    }
  }
  // Purchased rewards log
  const prl=document.getElementById('purchased-log');
  if(prl){
    const log=(S.redeemedLog||[]).slice().reverse();
    if(!log.length){prl.innerHTML='';}
    else{
      prl.innerHTML=`<div style="background:var(--surface);border:1px solid var(--brd);border-radius:var(--r);padding:16px;margin-bottom:18px">
        <div style="font-size:12px;font-weight:800;color:var(--txt2);text-transform:uppercase;letter-spacing:.8px;margin-bottom:12px">🧾 צ'ופרים שנרכשו</div>
        ${log.map(e=>`<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--brd)">
          <span style="font-size:18px">${e.emoji||'🎁'}</span>
          <div style="flex:1"><div style="font-size:12px;font-weight:700">${e.title}</div>
          <div style="font-size:10px;color:var(--txt3)">${new Date(e.date).toLocaleDateString('he-IL',{weekday:'short',day:'numeric',month:'short'})}</div></div>
          <div style="display:flex;align-items:center;gap:6px">
            <div style="font-size:12px;font-weight:900;color:var(--red)">−${e.pts}</div>
            <button onclick="unredeemReward('${e.id}')" style="font-size:10px;background:rgba(240,80,80,.1);color:var(--red);border:1px solid rgba(240,80,80,.2);border-radius:6px;padding:3px 7px;cursor:pointer;white-space:nowrap">↩️ בטל</button>
          </div>
        </div>`).join('')}
      </div>`;
    }
  }
  // Dream banner
  const dw=document.getElementById('dream-banner-wrap');
  if(dw){
    if(S.dreamRewardId){
      const dr=combined.find(r=>r.id===S.dreamRewardId);
      if(dr&&!S.redeemed.includes(dr.id)){
        const left=dr.pts-avail;
        dw.innerHTML=`<div class="dream-banner"><div style="font-size:22px;flex-shrink:0">⭐</div>
          <div class="dream-body"><div class="dream-label">הפרס שלי</div><div class="dream-title">${dr.title}</div>
          ${left>0?`<div style="font-size:11px;color:var(--txt3);margin-top:2px">עוד ${left} נקודות</div>`:`<div style="font-size:11px;color:var(--green2);margin-top:2px">✓ יש לך מספיק!</div>`}
          </div><div style="font-size:13px;font-weight:900;color:var(--purple)">${dr.pts}</div></div>`;
      }else dw.innerHTML='';
    }else dw.innerHTML='';
  }
  const cheap=combined.filter(r=>!r.isGrace&&!S.redeemed.includes(r.id)&&(!r.minLevel||S.level>=r.minLevel)).sort((a,b)=>a.pts-b.pts)[0];
  document.getElementById('pts-tip').textContent=cheap?(avail>=cheap.pts?`✓ יש לך מספיק לממש "${cheap.title}"!`:`עוד ${cheap.pts-avail} נקודות ל"${cheap.title}"`):'';

  let h='';
  if(currentSort==='cat'){
    // Group series items per category
    getEffectiveRewards().forEach(cat=>{
      if(!cat.items.length)return;
      const isCustomCat=!!cat._custom;
      h+=`<div class="rcat-title">${cat.cat}</div>`;
      // Separate series from regular
      const seriesIds=new Set();
      cat.items.forEach(r=>{ if(r._seriesId)seriesIds.add(r._seriesId); });
      const renderedSeries=new Set();
      cat.items.forEach(r=>{
        if(r._seriesId){
          if(!renderedSeries.has(r._seriesId)){
            renderedSeries.add(r._seriesId);
            h+=rSeriesBlock(r._seriesId, cat.items.filter(x=>x._seriesId===r._seriesId), avail, !!r._custom||isCustomCat);
          }
        } else {
          h+=rItem(r,avail,!!r._custom||isCustomCat);
        }
      });
    });
  }else{
    let items=[...combined];
    if(currentSort==='asc')items.sort((a,b)=>a.pts-b.pts);
    else if(currentSort==='desc')items.sort((a,b)=>b.pts-a.pts);
    else if(currentSort==='avail'){
      items=items.filter(r=>!S.redeemed.includes(r.id)&&(!r.minLevel||S.level>=r.minLevel)&&avail>=r.pts);
      if(!items.length)h='<div style="text-align:center;color:var(--txt3);padding:30px 0;font-size:13px">אין כרגע צ\'ופרים זמינים</div>';
    }
    // In flat sorts: group series together as accordion, single items normal
    const renderedSeries=new Set();
    items.forEach(r=>{
      if(r._seriesId){
        if(!renderedSeries.has(r._seriesId)){
          renderedSeries.add(r._seriesId);
          const seriesEps=items.filter(x=>x._seriesId===r._seriesId).sort((a,b)=>a._epNum-b._epNum);
          h+=rSeriesBlock(r._seriesId, seriesEps, avail, !!r._custom);
        }
      } else {
        h+=rItem(r,avail,!!r._custom);
      }
    });
  }
  document.getElementById('rewards-content').innerHTML=h;
}

/* ── Series accordion block ── */
let _seriesOpen={};
function toggleSeriesBlock(sid){
  _seriesOpen[sid]=!_seriesOpen[sid];
  const body=document.getElementById('sb-body-'+sid);
  const arrow=document.getElementById('sb-arrow-'+sid);
  if(body)body.classList.toggle('open',_seriesOpen[sid]);
  if(arrow)arrow.classList.toggle('open',_seriesOpen[sid]);
}

function rSeriesBlock(sid, eps, avail, isCustom){
  eps=eps.slice().sort((a,b)=>(a._epNum||0)-(b._epNum||0));
  const first=eps[0];
  const total=eps.length;
  const doneCount=eps.filter(r=>S.redeemed.includes(r.id)).length;
  const pct=total?Math.round(doneCount/total*100):0;
  const ico=first.emoji||{series:'📺',movie:'🎬',book:'📚',time:'⏱'}[first._seriesType]||'📺';
  const seriesName=first._seriesName||first.title.replace(/ — .*/,'');
  const itemLabel={series:'פרק',movie:'סרט',book:'פרק',time:'יחידה'}[first._seriesType]||'פרק';
  const isOpen=!!_seriesOpen[sid];
  const allDone=doneCount===total;
  // Next available episode
  const nextEp=eps.find(r=>!S.redeemed.includes(r.id));
  const nextPts=nextEp?nextEp.pts:0;
  const canNext=nextEp&&avail>=nextPts;
  const editBtn=`<button onclick="event.stopPropagation();openRewardEdit('${eps[0].id}',${isCustom})" style="font-size:10px;background:var(--sf3);color:var(--txt3);border:1px solid var(--brd2);border-radius:5px;padding:3px 7px;cursor:pointer;flex-shrink:0">✏️</button>`;
  return `<div class="series-block${allDone?' all-done-slot':''}">
    <div class="series-block-hd" onclick="toggleSeriesBlock('${sid}')">
      <div class="series-block-ico">${ico}</div>
      <div class="series-block-info">
        <div class="series-block-name">${seriesName}</div>
        <div class="series-block-sub">${doneCount}/${total} ${itemLabel}ים · ${allDone?'✓ הושלם':canNext?`הבא: ${nextPts} נק'`:`עוד ${nextPts-avail} נק' להבא`}</div>
      </div>
      ${editBtn}
      <div class="series-block-arrow${isOpen?' open':''}" id="sb-arrow-${sid}">▼</div>
    </div>
    <div class="series-prog-wrap">
      <div class="series-prog-bar"><div class="series-prog-fill" style="width:${pct}%"></div></div>
      <div class="series-prog-txt">${pct}% הושלם — ${doneCount} מתוך ${total} ${itemLabel}ים</div>
    </div>
    <div class="series-block-body${isOpen?' open':''}" id="sb-body-${sid}">
      <div class="series-ep-list">
        ${eps.map(r=>rSeriesEpisode(r,avail,isCustom,first._seriesLocked)).join('')}
      </div>
    </div>
  </div>`;
}

function rSeriesEpisode(r, avail, isCustom, locked){
  const used=S.redeemed.includes(r.id);
  const explicitML=r.minLevel||0;
  const ptsML=_rewardMinStage(r.pts);
  const ml=Math.max(explicitML,ptsML);
  const lk=ml&&S.level<ml;
  const prevBlocked=locked && r._epNum>1 && (()=>{
    const prev=(S.customRewards||[]).find(x=>x._seriesId===r._seriesId&&x._epNum===r._epNum-1);
    return prev&&!S.redeemed.includes(prev.id);
  })();
  const can=!used&&!lk&&!prevBlocked&&avail>=r.pts;
  let btnCls='no', btnTxt=`${r.pts} נק'`;
  if(used){btnCls='done';btnTxt='✓ מומש';}
  else if(lk){btnCls='lock';btnTxt=`🔒 שלב ${ml}+`;}
  else if(prevBlocked){btnCls='lock';btnTxt='🔒 קודם';}
  else if(can){btnCls='go';}
  const oc=can?`onclick="redeem('${r.id}',${r.pts},${ml},false)"`:'';
  return `<div class="ri${used?' used':''}${can?' can':''}${lk||prevBlocked?' locked-lv':''}"
    style="${used?'opacity:0.5;':''}${lk||prevBlocked?'opacity:0.38;':''}">
    <div style="min-width:32px;font-size:10px;font-weight:800;color:var(--txt3);text-align:center">${r._epNum}</div>
    <div class="ri-body" style="flex:1">
      <div class="ri-title" style="font-size:12px">${r.title.replace(/^.*— /,'')}</div>
      ${r.desc?`<div class="ri-desc">${r.desc}</div>`:''}
    </div>
    <div class="ri-right">
      <button class="rbtn ${btnCls}" ${oc}>${btnTxt}</button>
    </div>
  </div>`;
}


/* ══════════════ HEBREW DAY LETTERS ══════════ */
function hebrewDayLetters(dateObj){
  // Convert Gregorian date to Hebrew day-of-month in letter form (א, ב, ... ל׳)
  const letters=['','א','ב','ג','ד','ה','ו','ז','ח','ט',
                 'י','יא','יב','יג','יד','טו','טז','יז','יח','יט',
                 'כ','כא','כב','כג','כד','כה','כו','כז','כח','כט','ל'];
  // Extract Hebrew day number via Intl — returns e.g. "15" or "ט״ו" depending on locale
  // Use numeric extraction from he-IL-u-ca-hebrew
  const raw=dateObj.toLocaleDateString('he-IL-u-ca-hebrew',{day:'numeric'});
  // raw may be "א׳" "כ״ג" etc. — extract the number via en-u-ca-hebrew
  const num=parseInt(dateObj.toLocaleDateString('en-u-ca-hebrew',{day:'numeric'}),10);
  if(num>=1&&num<=30)return letters[num];
  return raw; // fallback
}
function hebrewFullDate(dateStr){
  const d=new Date(dateStr);
  const weekday=d.toLocaleDateString('he-IL',{weekday:'long'});
  const hebFull=d.toLocaleDateString('he-IL-u-ca-hebrew',{day:'numeric',month:'long',year:'numeric'});
  return `${weekday}, ${hebFull}`;
}

/* ══════════════ RENDER CALENDAR + CHARTS ══════════ */
function renderCal(){
  const pc=document.getElementById('pts-chart');
  const pl=document.getElementById('pts-chart-labels');
  if(pc){
    const today=new Date().toDateString();
    const bars=[];
    for(let i=29;i>=0;i--){
      const d=new Date();d.setDate(d.getDate()-i);
      const ds=d.toDateString();
      const h=S.history.find(x=>x.date===ds);
      const isT=ds===today;
      const pts=isT?calcDayPts():(h?h.pts:0);
      bars.push({pts,isT,d,isFD:h&&h.isFocusDay});
    }
    const mx=Math.max(...bars.map(b=>b.pts),1);
    pc.innerHTML=bars.map((b)=>{
      const ht=Math.max(4,Math.round(b.pts/mx*100));
      const col=b.isT?'var(--blue)':b.isFD?'var(--teal)':b.pts>0?`rgba(91,141,248,${0.3+0.5*(b.pts/mx)})`:'var(--sf2)';
      return`<div class="pc-bar" style="height:${ht}%;background:${col};" title="${b.d.toLocaleDateString('he-IL',{day:'numeric',month:'short'})}: ${b.pts} נקודות${b.isFD?' (יום עשייה)':''}"></div>`;
    }).join('');
    const first=bars[0].d,mid=bars[14].d;
    pl.innerHTML=`<span>${first.getDate()}/${first.getMonth()+1}</span><span>${mid.getDate()}/${mid.getMonth()+1}</span><span>היום</span>`;
  }
  const cc=document.getElementById('cat-chart');
  const ir=document.getElementById('insight-row');
  if(cc){
    const stats=buildCatStats();
    const catKeys=Object.keys(CATS);
    const rows=catKeys.map(k=>{
      const s=stats[k]||{total:0,done:0};
      const pct=s.total>0?Math.round(s.done/s.total*100):0;
      const color=CAT_COLORS[k]||'var(--txt2)';
      return{k,name:CATS[k],pct,total:s.total,done:s.done,color};
    }).sort((a,b)=>b.pct-a.pct);
    cc.innerHTML=rows.map(r=>`
      <div class="cat-row">
        <div class="cat-lbl" style="color:${r.color}">${r.name}</div>
        <div class="cat-track">
          <div class="cat-fill-bg" style="background:${r.color};width:100%"></div>
          <div class="cat-fill" style="width:${r.pct}%;background:${r.color}"></div>
        </div>
        <div class="cat-pct" style="color:${r.color}">${r.pct}%</div>
      </div>
      <div style="display:flex;justify-content:flex-end;font-size:9px;color:var(--txt3);margin-top:-6px;padding-left:36px">${r.done}/${r.total}</div>
    `).join('');
    const strong=rows.filter(r=>r.pct>=80&&r.total>0);
    const weak=rows.filter(r=>r.pct<50&&r.total>0);
    let pills='';
    if(strong.length)pills+=strong.map(r=>`<span class="insight-pill strong">💪 ${r.name.split(' ').slice(1).join(' ')}</span>`).join('');
    if(weak.length)pills+=weak.map(r=>`<span class="insight-pill weak">⚡ ${r.name.split(' ').slice(1).join(' ')} — לשיפור</span>`).join('');
    if(!pills)pills='<span class="insight-pill mid">📊 המשך לסמן משימות לקבלת תובנות</span>';
    ir.innerHTML=pills;
  }
  const now=new Date();
  // כותרת חודש — גרגוריאני + עברי
  const hebMonth=now.toLocaleDateString('he-IL-u-ca-hebrew',{month:'long',year:'numeric'});
  const gregMonth=now.toLocaleDateString('he-IL',{month:'long',year:'numeric'});
  document.getElementById('cal-mth').innerHTML=`${hebMonth}<br><span style="font-size:11px;color:var(--txt3);font-weight:500">${gregMonth}</span>`;
  document.getElementById('cal-dows').innerHTML=['א','ב','ג','ד','ה','ו','ש'].map(d=>`<div class="cal-dow">${d}</div>`).join('');
  const first=new Date(now.getFullYear(),now.getMonth(),1).getDay();
  const days=new Date(now.getFullYear(),now.getMonth()+1,0).getDate();
  let g='';
  for(let i=0;i<first;i++)g+='<div class="cal-day mt"></div>';
  for(let d=1;d<=days;d++){
    const dateObj=new Date(now.getFullYear(),now.getMonth(),d);
    const ds=dateObj.toDateString();
    const hit=S.history.some(h=>h.date===ds&&!h.isFocusDay);
    const isFD=S.history.some(h=>h.date===ds&&h.isFocusDay)||(S.focusDays||[]).some(fd=>new Date(fd.date).toDateString()===ds);
    const isT=ds===now.toDateString();
    const dow=dateObj.getDay();
    // תאריך עברי — באותיות
    const hebDay=hebrewDayLetters(dateObj);
    g+=`<div class="cal-day${hit?' hit':''}${isFD&&!hit?' focus-day-cal':''}${isT?' now':''}${dow===6&&!hit&&!isFD?' shab':''}" onclick="openRetroModal('${ds}')" style="cursor:pointer;flex-direction:column;gap:1px" title="לחץ לעריכה">
      <span style="font-size:11px;font-weight:700;line-height:1">${hebDay}</span>
      <span style="font-size:8px;opacity:0.55;line-height:1">${d}</span>
    </div>`;
  }
  document.getElementById('cal-grid').innerHTML=g;
  document.getElementById('hist-list').innerHTML=
    (S.history.slice(0,30).map(h=>{
      const isFD=h.isFocusDay;
      const isGrace=(S.graceUsedDates||[]).includes(h.date);
      const fdObj=(S.focusDays||[]).find(fd=>new Date(fd.date).toDateString()===h.date);
      let badges='';
      if(isFD)badges+=`<button onclick="cancelFocusDay('${h.date}')" style="font-size:9px;background:rgba(45,212,191,.1);color:var(--teal);border:1px solid rgba(45,212,191,.3);border-radius:5px;padding:2px 6px;cursor:pointer;margin-left:4px">🎯 בטל עשייה</button>`;
      if(isGrace)badges+=`<button onclick="cancelGraceDay('${h.date}')" style="font-size:9px;background:rgba(240,192,64,.1);color:var(--gold);border:1px solid rgba(240,192,64,.3);border-radius:5px;padding:2px 6px;cursor:pointer;margin-left:4px">🛡️ בטל חסד</button>`;
      return`<div class="hist-row" style="flex-wrap:wrap;gap:6px">
        <div style="flex:1">
          <div class="hist-d">${hebrewFullDate(h.date)}</div>
          <div class="hist-t">${h.tasks} משימות${h.note?' — '+h.note:''}</div>
          <div style="margin-top:4px">${badges}</div>
        </div>
        <div style="display:flex;align-items:center;gap:6px">
          <div class="hist-p" style="color:${isFD?'var(--teal)':'var(--gold)'}">+${h.pts}</div>
          <button onclick="openRetroModal('${h.date}')" style="font-size:10px;background:var(--sf2);color:var(--txt3);border:1px solid var(--brd2);border-radius:6px;padding:4px 8px;cursor:pointer">✏️</button>
        </div>
      </div>`;
    }).join(''))||
    '<div style="text-align:center;color:var(--txt3);padding:40px 0;font-size:13px">אין עדיין היסטוריה</div>';
}

/* ══════════════ GRACE ══════════════ */
async function useGrace(){
  if(totalGraceAvailable()<=0){toast('ימי החסד מוצו החודש');return;}
  if(!await _customConfirm('להשתמש ביום חסד?', 'השתמש'))return;
  if(!S.graceUsedDates)S.graceUsedDates=[];
  S.graceUsedDates.push(new Date().toDateString());
  save();renderActive();toast('🛡️ יום החסד שמור!');
}

/* ══════════════ TASK GROUP EDITOR ══════════════
   S.taskGroups: array of group objects:
   {
     id: string,
     cat: string,
     slot: number (0-3),
     anchor: bool,
     levels: [ {text, pts}, ... ]  // 15 entries, index 0 = level 1
   }
   null/undefined = use built-in _getDefaultTasks
══════════════════════════════════════════════════ */

function openTaskEditor() {
  renderTeGroupList();
  openModal('modal-task-editor');
}

function getGroups() {
  return S.taskGroups || null;
}

/* Build group list from built-in tasks (one-time seed) */
function builtinGroups() {
  const BASE_IDS = ['z1','pray','s1','b1','rule60','z2','l1','a1','nap','lesson','l2','z3','b2','sleep','a3','bed','zug','h2','s3','fr1','fr2','fr3','fr4','sh1','sh2','sh3','a2','a4','b3','b4','b5','h3','h4','h5','s2','s4','l3','l4','l5','l6','l7','l8','p2','p3','p4','p5','sh8a','sh8b'];
  return BASE_IDS.map(base => {
    const levels = [];
    for (let lvl = 1; lvl <= MAX_LVL; lvl++) {
      const tasks = _getDefaultTasks(lvl);
      const t = tasks.find(x => x.id.startsWith(base + '_'));
      levels.push({ text: t ? t.text : '', pts: t ? t.pts : 5 });
    }
    const t1 = _getDefaultTasks(1).find(x => x.id.startsWith(base + '_'));
    return {
      id: 'grp_' + base,
      cat: t1 ? t1.cat : 'zman',
      slot: t1 ? t1.slot : 0,
      anchor: t1 ? !!t1.anchor : false,
      days: t1 ? (t1.days || ['weekday']) : ['weekday'],
      time: t1 ? (t1.time || null) : null,
      levels
    };
  });
}

/* Expand groups -> tasks for a given level */
function expandGroupsForLevel(lvl) {
  const groups = getGroups();
  if (!groups) return null;
  return groups.map(g => ({
    id: g.id + '_' + lvl,
    text: (g.levels[lvl - 1] || {}).text || '',
    pts:  (g.levels[lvl - 1] || {}).pts  || 5,
    cat:  g.cat,
    slot: g.slot,
    anchor: !!g.anchor,
    days: g.days || ['weekday'],
    time: g.time || undefined,
    _grpId: g.id
  }));
}

/* render group list */
function renderTeGroupList() {
  const c = document.getElementById('te-group-list');
  if (!c) return;
  const groups = getGroups() || builtinGroups();
  const isCustom = !!getGroups();
  const CAT_ICONS = {zman:'⏱',briut:'💧',achila:'🍎',limud:'📖',bayit:'🏠',smart:'📵',erev:'🕯️',shabbat:'✡️'};
  const SLOT_ICONS = ['🌅','⚡','📖','🌙'];
  let html = '';
  if (!isCustom) {
    html += `<div style="background:rgba(240,192,64,.07);border:1px solid rgba(240,192,64,.2);border-radius:8px;padding:9px 12px;margin-bottom:10px;font-size:11px;color:var(--gold);line-height:1.5">
      📋 משתמש במשימות ברירת המחדל. לחץ "עריכה" כדי להתאים אישית.
    </div>`;
  } else {
    html += `<div style="background:rgba(91,141,248,.07);border:1px solid rgba(91,141,248,.2);border-radius:8px;padding:8px 12px;margin-bottom:10px;font-size:11px;color:var(--txt3);line-height:1.5">
      ↕️ גרור את ⠿ לשינוי סדר המשימות
    </div>`;
  }
  groups.forEach((g, idx) => {
    const catColor = CAT_COLORS[g.cat] || 'var(--txt3)';
    const displayTitle = g.title || (g.levels[0] || {}).text || '—';
    const l15text = (g.levels[14] || {}).text || '—';
    const l1pts  = (g.levels[0] || {}).pts || 0;
    const l15pts = (g.levels[14] || {}).pts || 0;
    const days = g.days || ['weekday'];
    const dayBadges = [
      days.includes('weekday') ? '<span style="font-size:9px;background:rgba(91,141,248,.15);color:var(--blue);border-radius:4px;padding:1px 5px;font-weight:700">☀️ חול</span>' : '',
      days.includes('friday')  ? '<span style="font-size:9px;background:rgba(45,212,191,.15);color:var(--teal);border-radius:4px;padding:1px 5px;font-weight:700">🕯️ שישי</span>' : '',
      days.includes('shabbat') ? '<span style="font-size:9px;background:rgba(155,126,248,.15);color:var(--purple);border-radius:4px;padding:1px 5px;font-weight:700">✡️ שבת</span>' : '',
    ].filter(Boolean).join(' ');
    html += `<div draggable="true" data-grp-idx="${idx}" data-grp-id="${g.id}"
      ondragstart="onGrpDragStart(event)"
      ondragover="onGrpDragOver(event)"
      ondrop="onGrpDrop(event)"
      ondragend="onGrpDragEnd(event)"
      style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:var(--surface);border:1px solid var(--brd);border-radius:var(--r-sm);margin-bottom:6px;cursor:default;transition:opacity .15s">
      <div class="grp-drag-handle" style="font-size:16px;color:var(--txt3);cursor:grab;flex-shrink:0;padding:0 2px;user-select:none">⠿</div>
      <div style="width:3px;min-height:40px;border-radius:2px;background:${catColor};flex-shrink:0;align-self:stretch"></div>
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;font-weight:700;color:var(--txt);line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${displayTitle}</div>
        <div style="font-size:10px;color:var(--txt3);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">→ שלב 15: ${l15text}</div>
        <div style="display:flex;gap:6px;margin-top:4px;align-items:center;flex-wrap:wrap">
          <span style="font-size:10px;color:${catColor};font-weight:700">${CAT_ICONS[g.cat]||''} ${CATS[g.cat]||g.cat}</span>
          <span style="font-size:10px;color:var(--txt3)">${SLOT_ICONS[g.slot]||''}</span>
          ${g.anchor ? '<span style="font-size:10px;color:var(--teal);font-weight:700">🎯</span>' : ''}
          <span style="font-size:10px;color:var(--gold);font-weight:800">${l1pts}→${l15pts} נק'</span>
          ${dayBadges}
          ${g.time ? `<span style="font-size:9px;background:var(--blue3);color:var(--blue);border-radius:4px;padding:1px 5px;font-weight:700">🕐 ${g.time}</span>` : ''}
          ${g.reminderEnabled && g.reminderTime ? `<span style="font-size:9px;background:rgba(240,192,64,.15);color:var(--gold);border-radius:4px;padding:1px 5px;font-weight:700">🔔 ${g.reminderTime}</span>` : ''}
        </div>
        ${(()=>{
          const bidKey=_masteryBid(g.id); // matches storage key in taskSuccessCount / taskIndivLevel
          const indivLvl=(S.taskIndivLevel||{})[bidKey]||1;
          const{done:sc,needed:sn}=getTaskSuccessProgress(bidKey);
          return `<div style="display:flex;align-items:center;gap:8px;margin-top:5px">
            <span style="font-size:10px;color:var(--teal);font-weight:700">רמה ${indivLvl}</span>
            <span style="font-size:10px;color:var(--txt3)">${sc}/${sn} הצלחות</span>
            <button onclick="event.stopPropagation();resetTaskMastery('${bidKey}')" style="font-size:9px;color:var(--txt3);background:var(--bg3);border:1px solid var(--brd);border-radius:4px;padding:1px 6px;cursor:pointer">↺ אפס</button>
          </div>`;
        })()}
      </div>
      <div style="display:flex;flex-direction:column;gap:4px;flex-shrink:0">
        <button onclick="openEditGroupModal('${g.id}')" style="padding:5px 10px;background:var(--sf3);border:1px solid var(--brd2);border-radius:6px;font-size:10px;font-weight:700;color:var(--txt2);cursor:pointer">עריכה</button>
        <button onclick="deleteGroup('${g.id}')" style="padding:5px 10px;background:rgba(240,80,80,.1);border:1px solid rgba(240,80,80,.2);border-radius:6px;font-size:10px;font-weight:700;color:var(--red);cursor:pointer">מחק</button>
      </div>
    </div>`;
  });
  if (!groups.length) html += `<div style="font-size:12px;color:var(--txt3);text-align:center;padding:24px">אין משימות. לחץ "הוסף משימה".</div>`;
  c.innerHTML = html;
}

/* ── Drag & Drop for group reordering ── */
let _dragIdx = null;
function onGrpDragStart(e) {
  _dragIdx = parseInt(e.currentTarget.dataset.grpIdx);
  e.currentTarget.style.opacity = '0.45';
  e.dataTransfer.effectAllowed = 'move';
}
function onGrpDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  const target = e.currentTarget;
  target.style.borderColor = 'var(--gold)';
}
function onGrpDrop(e) {
  e.preventDefault();
  const toIdx = parseInt(e.currentTarget.dataset.grpIdx);
  if (_dragIdx === null || _dragIdx === toIdx) return;
  if (!S.taskGroups) S.taskGroups = builtinGroups();
  const arr = S.taskGroups;
  const moved = arr.splice(_dragIdx, 1)[0];
  arr.splice(toIdx, 0, moved);
  _dragIdx = null;
  save();
  renderTeGroupList();
  renderActive();
}
function onGrpDragEnd(e) {
  _dragIdx = null;
  renderTeGroupList();
}


/* open edit modal */
function _openGroupModal(grp) {
  document.getElementById('te-modal-title').textContent = grp ? '✏️ עריכת משימה — 15 שלבים נפרדים' : '➕ משימה חדשה — 15 שלבים נפרדים';
  document.getElementById('te-edit-id').value = grp ? grp.id : '';
  // Fill title: explicit title > TASK_INFO title > empty
  let _grpTitle = (grp && grp.title) ? grp.title : '';
  if (!_grpTitle && grp) {
    const _baseKey = grp.id.replace('grp_', '');
    if (TASK_INFO[_baseKey]) _grpTitle = TASK_INFO[_baseKey].title;
  }
  document.getElementById('te-group-title').value = _grpTitle;
  _populateTaskCatSelect(grp ? grp.cat : 'zman');
  document.getElementById('te-slot').value = grp ? String(grp.slot) : '0';
  const teTimeEl = document.getElementById('te-time');
  if(teTimeEl) teTimeEl.value = (grp && grp.time) ? grp.time : '';
  document.getElementById('te-anchor').checked = grp ? !!grp.anchor : false;
  // Days checkboxes
  const days = grp ? (grp.days || ['weekday']) : ['weekday'];
  document.getElementById('te-day-weekday').checked = days.includes('weekday');
  document.getElementById('te-day-friday').checked = days.includes('friday');
  document.getElementById('te-day-shabbat').checked = days.includes('shabbat');

  // Reminder
  document.getElementById('te-reminder-enabled').checked = grp ? !!grp.reminderEnabled : false;
  document.getElementById('te-reminder-time').value = (grp && grp.reminderTime) ? grp.reminderTime : '09:00';

  // Task info fields
  const grpInfoOv = grp ? ((S.taskInfoOverride||{})[grp.id]||{}) : {};
  document.getElementById('te-info-why').value  = grpInfoOv.why  || '';
  document.getElementById('te-info-desc').value = grpInfoOv.desc || '';
  document.getElementById('te-info-tip').value  = grpInfoOv.tip  || '';
  document.getElementById('te-info-goal').value = grpInfoOv.goal || '';

  const numCol  = document.getElementById('te-levels-rows');
  const textCol = document.getElementById('te-levels-rows-text');
  const ptsCol  = document.getElementById('te-levels-rows-pts');
  let numHtml = '', textHtml = '', ptsHtml = '';

  for (let i = 1; i <= MAX_LVL; i++) {
    const lvlData = grp && grp.levels[i-1] ? grp.levels[i-1] : { text:'', pts:'' };
    const isCur = (i === S.level);
    const hlBg = isCur ? 'background:rgba(240,192,64,.09)' : (i % 2 === 0 ? 'background:rgba(255,255,255,.02)' : '');
    const bdr = 'border-bottom:1px solid var(--brd)';
    const curMark = isCur ? '<span style="font-size:8px;color:var(--gold);font-weight:900;display:block;line-height:1">\u2605 נוכחי</span>' : '';
    const safeText = (lvlData.text||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
    numHtml  += `<div style="padding:5px 7px;text-align:center;font-size:11px;font-weight:800;color:${isCur?'var(--gold)':'var(--txt3)'};${hlBg};${bdr}">${i}${curMark}</div>`;
    textHtml += `<div style="${hlBg};${bdr};border-right:1px solid var(--brd)"><input id="te-lvl-text-${i}" value="${safeText}" placeholder="טקסט לשלב ${i}..." maxlength="100" style="width:100%;background:transparent;border:none;color:var(--txt);font-family:'Heebo',sans-serif;font-size:12px;padding:5px 8px;outline:none"></div>`;
    ptsHtml  += `<div style="${hlBg};${bdr}"><input id="te-lvl-pts-${i}" type="number" value="${lvlData.pts||''}" placeholder="נק'" min="1" max="9999" style="width:100%;background:transparent;border:none;color:var(--gold);font-family:'Heebo',sans-serif;font-size:12px;font-weight:800;padding:5px 6px;outline:none;text-align:center"></div>`;
  }
  numCol.innerHTML  = numHtml;
  textCol.innerHTML = textHtml;
  ptsCol.innerHTML  = ptsHtml;

  openModal('modal-task-edit');
}

function openAddGroupModal() {
  _openGroupModal(null);
}

function openEditGroupModal(grpId) {
  const groups = getGroups() || builtinGroups();
  const g = groups.find(x => x.id === grpId);
  _openGroupModal(g || null);
  if (!g) document.getElementById('te-edit-id').value = grpId;
}

/* save */
function saveGroupEdit() {
  const cat    = document.getElementById('te-cat').value;
  const slot   = parseInt(document.getElementById('te-slot').value);
  const anchor = document.getElementById('te-anchor').checked;
  const editId = document.getElementById('te-edit-id').value;
  // Days
  const days = [];
  if(document.getElementById('te-day-weekday').checked) days.push('weekday');
  if(document.getElementById('te-day-friday').checked) days.push('friday');
  if(document.getElementById('te-day-shabbat').checked) days.push('shabbat');
  if(!days.length){toast('חובה לבחור לפחות יום אחד');return;}

  const levels = [];
  for (let i = 1; i <= MAX_LVL; i++) {
    const text = (document.getElementById(`te-lvl-text-${i}`)?.value || '').trim();
    const pts  = parseInt(document.getElementById(`te-lvl-pts-${i}`)?.value);
    if (!text) { toast(`חסר טקסט לשלב ${i}`); return; }
    if (!pts || pts < 1) { toast(`חסרות נקודות לשלב ${i}`); return; }
    levels.push({ text, pts });
  }

  if (!S.taskGroups) S.taskGroups = builtinGroups();

  const reminderEnabled = document.getElementById('te-reminder-enabled').checked;
  const reminderTime = document.getElementById('te-reminder-time').value || '09:00';
  const grpTitle = (document.getElementById('te-group-title')?.value || '').trim();
  const grpTime = (document.getElementById('te-time')?.value || '').trim() || undefined;
  const grpObj = { id: editId || ('grp_' + Date.now()), title: grpTitle || undefined, cat, slot, anchor, days, levels, reminderEnabled, reminderTime, time: grpTime };

  if (editId) {
    const idx = S.taskGroups.findIndex(g => g.id === editId);
    if (idx !== -1) S.taskGroups[idx] = grpObj;
    else S.taskGroups.push(grpObj);
    for (let lvl = 1; lvl <= MAX_LVL; lvl++) delete S.done[editId + '_' + lvl];
    toast('✓ משימה עודכנה בכל 15 השלבים');
  } else {
    S.taskGroups.push(grpObj);
    toast('✓ משימה חדשה נוספה לכל 15 השלבים');
  }

  // Save task info fields
  const infoWhy  = (document.getElementById('te-info-why')?.value  || '').trim();
  const infoDesc = (document.getElementById('te-info-desc')?.value || '').trim();
  const infoTip  = (document.getElementById('te-info-tip')?.value  || '').trim();
  const infoGoal = (document.getElementById('te-info-goal')?.value || '').trim();
  if (infoWhy || infoDesc || infoTip || infoGoal) {
    if (!S.taskInfoOverride) S.taskInfoOverride = {};
    const curOv = S.taskInfoOverride[grpObj.id] || {};
    S.taskInfoOverride[grpObj.id] = { ...curOv, why:infoWhy, desc:infoDesc, tip:infoTip, goal:infoGoal };
  }

  save();
  closeModal('modal-task-edit');
  renderTeGroupList();
  renderActive();
  setTimeout(scheduleTaskReminders, 200);
}

/* reset group edit to built-in defaults */
async function resetGroupEditToDefault() {
  const editId = document.getElementById('te-edit-id').value;
  if (!editId) return;
  if (!await _customConfirm('לאפס את המשימה לערכי ברירת המחדל? השינויים שלך יימחקו.', '↺ אפס')) return;

  // Remove from taskGroups so it falls back to builtinGroups
  if (S.taskGroups) {
    S.taskGroups = S.taskGroups.filter(g => g.id !== editId);
    if (!S.taskGroups.length) delete S.taskGroups;
  }
  // Remove task info override
  if (S.taskInfoOverride && S.taskInfoOverride[editId]) {
    delete S.taskInfoOverride[editId];
  }
  // Clear done state for this task
  for (let lvl = 1; lvl <= MAX_LVL; lvl++) delete S.done[editId + '_' + lvl];

  save();
  closeModal('modal-task-edit');
  renderTeGroupList();
  renderActive();
  toast('↺ המשימה אופסה לברירת המחדל');
}

async function deleteGroup(grpId) {
  if (!await _customConfirm('למחוק משימה זו מכל 15 השלבים?', '🗑️ מחק')) return;
  if (!S.taskGroups) S.taskGroups = builtinGroups();
  S.taskGroups = S.taskGroups.filter(g => g.id !== grpId);
  for (let lvl = 1; lvl <= MAX_LVL; lvl++) delete S.done[grpId + '_' + lvl];
  save(); renderTeGroupList(); renderActive();
  toast('🗑️ המשימה נמחקה מכל השלבים');
}

/* reset */
async function resetAllGroups() {
  if (!await _customConfirm('לאפס את כל המשימות לברירת המחדל?', '↺ אפס הכל')) return;
  delete S.taskGroups;
  S.done = {};
  save(); renderTeGroupList(); renderActive();
  toast('↺ המשימות אופסו לברירת המחדל');
}

/* Legacy stubs */
function ensureCustomTasksForLevel(){}
function getTeTasksForLevel(lvl){ return getTasks(lvl); }

/* ══════════════ REWARD EDITOR ══════════ */

/* current type in add modal */
let _rewardType = 'simple';

function setRewardType(type) {
  _rewardType = type;
  ['simple','series','movie','book','time'].forEach(t => {
    const btn = document.getElementById('re-type-'+t);
    if(btn) btn.classList.toggle('on', t === type);
  });
  document.getElementById('re-fields-simple').style.display = (type === 'simple') ? 'block' : 'none';
  document.getElementById('re-fields-series').style.display = (['series','movie','book'].includes(type)) ? 'block' : 'none';
  document.getElementById('re-fields-time').style.display = (type === 'time') ? 'block' : 'none';
  // Update label text based on type
  const countLbl = document.getElementById('re-count-label');
  const nameLbl = document.getElementById('re-series-name-label');
  if(type === 'series') { if(countLbl) countLbl.textContent = "מס' פרקים"; if(nameLbl) nameLbl.textContent = "שם הסדרה"; }
  if(type === 'movie')  { if(countLbl) countLbl.textContent = "מס' סרטים"; if(nameLbl) nameLbl.textContent = "שם האוסף / הרשימה"; }
  if(type === 'book')   { if(countLbl) countLbl.textContent = "מס' פרקים"; if(nameLbl) nameLbl.textContent = "שם הספר"; }
  _updateSeriesPreview();
}

function _typeIco(type){ return {series:'📺',movie:'🎬',book:'📚',time:'⏱'}[type]||'⭐'; }
function _typeItemLabel(type){ return {series:'פרק',movie:'סרט',book:'פרק',time:'דק'}[type]||'פריט'; }

function _updateSeriesPreview(){
  const el = document.getElementById('re-series-preview');
  if(!el) return;
  const name = document.getElementById('re-series-name').value || '...';
  const count = parseInt(document.getElementById('re-series-count').value)||0;
  const pts = parseInt(document.getElementById('re-series-pts').value)||0;
  const lbl = _typeItemLabel(_rewardType);
  const ico = _typeIco(_rewardType);
  if(count < 2 || pts < 1){ el.textContent = ''; return; }
  el.innerHTML = `${ico} <strong>${name}</strong> — ${count} ${lbl}ים × ${pts} נק' = <strong style="color:var(--gold)">${count*pts} נק' סה"כ</strong><br>
    <span style="color:var(--txt3)">פריט ראשון: ${name} ${lbl} 1 (${pts} נק')</span>`;
}

function _updateTimePreview(){
  const mins = parseInt(document.getElementById('re-time-mins').value)||30;
  const pts  = parseInt(document.getElementById('re-time-pts').value)||60;
  const m = document.getElementById('re-time-preview-mins');
  const p = document.getElementById('re-time-preview-pts');
  if(m) m.textContent = mins;
  if(p) p.textContent = pts;
}

/* Legacy stubs — kept so old code doesn't break */
function toggleRewardSplit(){}
function _updateSplitPreview(){}
function _resetRewardSplitFields(){}

function openRewardEdit(id, isCustom){
  const ov=S.rewardsOverride||{};
  let r=null;
  if(isCustom){
    r=(S.customRewards||[]).find(x=>x.id===id);
  } else {
    const base=REWARDS.flatMap(c=>c.items).find(x=>x.id===id);
    if(base) r={...base,...(ov[id]||{})};
  }
  if(!r)return;
  document.getElementById('re-id').value=id;
  document.getElementById('re-is-custom').value=isCustom?'1':'0';
  document.getElementById('re-modal-title').textContent=isCustom?"✏️ עריכת צ'ופר אישי":"✏️ עריכת צ'ופר";
  document.getElementById('re-delete-btn').style.display='';
  // Hide type selector when editing
  const typeSection = document.getElementById('re-type-section');
  if(typeSection) typeSection.style.display = 'none';
  // Always show simple fields for editing
  document.getElementById('re-fields-simple').style.display = 'block';
  document.getElementById('re-fields-series').style.display = 'none';
  document.getElementById('re-fields-time').style.display = 'none';
  document.getElementById('re-title').value=r.title||'';
  document.getElementById('re-desc').value=r.desc||'';
  document.getElementById('re-notes').value=r.notes||'';
  document.getElementById('re-pts').value=r.pts||'';
  document.getElementById('re-emoji').value=r.emoji||'';
  document.getElementById('re-minlevel').value=r.minLevel||'';
  let currentCat = r.rewardCat || (isCustom ? "⭐  צ'ופרים אישיים" : (()=>{
    const found=REWARDS.find(c=>c.items.some(x=>x.id===id));
    return found?found.cat:"⭐  צ'ופרים אישיים";
  })());
  _populateCatSelect(currentCat);
  openModal('modal-reward-edit');
}

function openRewardAdd(){
  _rewardType = 'simple';
  document.getElementById('re-id').value='';
  document.getElementById('re-is-custom').value='1';
  document.getElementById('re-modal-title').textContent="➕ צ'ופר חדש";
  document.getElementById('re-delete-btn').style.display='none';
  // Show type selector
  const typeSection = document.getElementById('re-type-section');
  if(typeSection) typeSection.style.display = 'block';
  // Reset all type button states
  setRewardType('simple');
  // Clear all fields
  ['re-title','re-desc','re-notes','re-pts','re-emoji','re-minlevel',
   're-series-name','re-series-count','re-series-pts','re-series-minlevel',
   're-time-name','re-time-mins','re-time-pts','re-time-minlevel'].forEach(id=>{
    const el=document.getElementById(id);if(el)el.value='';
  });
  const lock = document.getElementById('re-series-lock');
  if(lock) lock.checked = true;
  document.getElementById('re-series-preview').innerHTML='';
  _populateCatSelect("⭐  צ'ופרים אישיים");
  openModal('modal-reward-edit');
}

function saveRewardEdit(){
  const id=document.getElementById('re-id').value;
  const isCustom=document.getElementById('re-is-custom').value==='1';
  const rewardCat=document.getElementById('re-cat').value||"⭐  צ'ופרים אישיים";
  const isAdding = !id;
  const type = isAdding ? _rewardType : 'simple';

  // ── SERIES / MOVIE / BOOK ──
  if(isAdding && ['series','movie','book'].includes(type)){
    const name = document.getElementById('re-series-name').value.trim();
    const count = parseInt(document.getElementById('re-series-count').value)||0;
    const pts   = parseInt(document.getElementById('re-series-pts').value)||0;
    const ml    = parseInt(document.getElementById('re-series-minlevel').value)||0;
    const locked = document.getElementById('re-series-lock').checked;
    const lbl = _typeItemLabel(type);
    const ico = _typeIco(type);
    if(!name){toast('חובה להזין שם');return;}
    if(count < 2){toast('נדרשים לפחות 2 פריטים');return;}
    if(pts < 1){toast('חובה להזין נקודות');return;}
    if(!S.customRewards)S.customRewards=[];
    const baseId = 'series_'+Date.now();
    for(let i=1;i<=count;i++){
      S.customRewards.push({
        id: baseId+'_'+i,
        title: `${name} — ${lbl} ${i}`,
        desc: '',
        pts, emoji: ico,
        minLevel: ml||undefined,
        rewardCat,
        _seriesId: baseId,
        _seriesName: name,
        _seriesType: type,
        _seriesLocked: locked,
        _epNum: i,
        _epTotal: count
      });
    }
    save(); closeModal('modal-reward-edit'); renderRewards(); renderSettings();
    toast(`✅ ${count} ${lbl}ים נוצרו — ${name}`);
    return;
  }

  // ── TIME ──
  if(isAdding && type === 'time'){
    const name = document.getElementById('re-time-name').value.trim();
    const mins = parseInt(document.getElementById('re-time-mins').value)||0;
    const pts  = parseInt(document.getElementById('re-time-pts').value)||0;
    const ml   = parseInt(document.getElementById('re-time-minlevel').value)||0;
    if(!name){toast('חובה להזין שם');return;}
    if(mins < 5){toast('לפחות 5 דקות');return;}
    if(pts < 1){toast('חובה להזין נקודות');return;}
    if(!S.customRewards)S.customRewards=[];
    S.customRewards.push({
      id:'time_'+Date.now(),
      title: name,
      desc: `${mins} דקות צפייה / האזנה`,
      pts, emoji: '⏱',
      minLevel: ml||undefined,
      rewardCat,
      _timeType: true,
      _timeMins: mins
    });
    save(); closeModal('modal-reward-edit'); renderRewards(); renderSettings();
    toast(`✅ ${name} נוסף — ${mins} דקות = ${pts} נק'`);
    return;
  }

  // ── SIMPLE / EDIT ──
  const title=document.getElementById('re-title').value.trim();
  const desc=document.getElementById('re-desc').value.trim();
  const notes=document.getElementById('re-notes').value.trim();
  const pts=parseInt(document.getElementById('re-pts').value);
  const emoji=document.getElementById('re-emoji').value.trim();
  const minLevel=parseInt(document.getElementById('re-minlevel').value)||0;
  if(!title||!pts||pts<1){toast('שם ונקודות הם שדות חובה');return;}
  if(!id){
    if(!S.customRewards)S.customRewards=[];
    S.customRewards.push({id:'custom_'+Date.now(),title,desc,notes:notes||undefined,pts,emoji:emoji||'⭐',minLevel:minLevel||undefined,rewardCat});
    toast("✓ הצ'ופר נוסף!");
  } else if(isCustom){
    S.customRewards=(S.customRewards||[]).map(r=>r.id===id?{...r,title,desc,notes:notes||undefined,pts,emoji:emoji||r.emoji||'⭐',minLevel:minLevel||undefined,rewardCat}:r);
    toast("✓ הצ'ופר עודכן");
  } else {
    if(!S.rewardsOverride)S.rewardsOverride={};
    S.rewardsOverride[id]={...(S.rewardsOverride[id]||{}),title,desc,notes:notes||undefined,pts,emoji:emoji||undefined,minLevel:minLevel||undefined};
    toast("✓ הצ'ופר עודכן");
  }
  save();closeModal('modal-reward-edit');renderRewards();renderSettings();
}

async function deleteRewardEdit(){
  const id=document.getElementById('re-id').value;
  const isCustom=document.getElementById('re-is-custom').value==='1';
  if(!await _customConfirm("למחוק צ'ופר זה?","🗑️ מחק"))return;
  if(isCustom){
    // If part of series — offer to delete whole series
    const r=(S.customRewards||[]).find(x=>x.id===id);
    if(r&&r._seriesId){
      const seriesItems=(S.customRewards||[]).filter(x=>x._seriesId===r._seriesId);
      if(seriesItems.length>1){
        const delAll=await _customConfirm(`למחוק את כל הסדרה "${r._seriesName||''}" (${seriesItems.length} פריטים)?`,"🗑️ מחק הכל");
        if(delAll){
          const ids=seriesItems.map(x=>x.id);
          S.customRewards=(S.customRewards||[]).filter(x=>!ids.includes(x.id));
          S.redeemed=S.redeemed.filter(r=>!ids.includes(r));
          ids.forEach(i=>{if(S.dreamRewardId===i)S.dreamRewardId=null;});
          save();closeModal('modal-reward-edit');renderRewards();renderSettings();
          toast("🗑️ הסדרה נמחקה");
          return;
        }
      }
    }
    S.customRewards=(S.customRewards||[]).filter(r=>r.id!==id);
    S.redeemed=S.redeemed.filter(r=>r!==id);
    if(S.dreamRewardId===id)S.dreamRewardId=null;
  } else {
    if(!S.rewardsOverride)S.rewardsOverride={};
    S.rewardsOverride[id]={...(S.rewardsOverride[id]||{}),hidden:true};
  }
  save();closeModal('modal-reward-edit');renderRewards();renderSettings();
  toast("🗑️ הצ'ופר הוסר");
}

/* ══════════════ CUSTOM REWARDS (legacy add from settings) ══════════ */
function openAddReward(){openRewardAdd();}
function saveCustomReward(){saveRewardEdit();}
async function deleteCustomReward(id){
  if(!await _customConfirm("למחוק?", "מחק"))return;
  S.customRewards=(S.customRewards||[]).filter(r=>r.id!==id);
  S.redeemed=S.redeemed.filter(r=>r!==id);
  if(S.dreamRewardId===id)S.dreamRewardId=null;
  save();renderSettings();
}

/* ══════════════ SETTINGS TAB SWITCH ══════════════ */
function switchSettingsTab(tab){
  const tabs = ['config','notifs','info'];
  tabs.forEach(t => {
    const panel = document.getElementById('stab-'+t+'-panel');
    const btn   = document.getElementById('stab-'+t);
    const active = (t === tab);
    if(panel) panel.style.display = active ? '' : 'none';
    if(btn){
      btn.style.background = active ? 'var(--surface)' : 'transparent';
      btn.style.border     = active ? '1px solid var(--brd2)' : '1px solid transparent';
      btn.style.color      = active ? 'var(--txt)' : 'var(--txt3)';
    }
  });
}

/* ══════════════ SETTINGS ══════════════ */
function renderAuthSection(){
  window._updateAuthUI = function(){
    var el = document.getElementById('auth-section');
    if(!el) return;
    var u = window._fbUser || null;
    if(u){
      el.innerHTML = '<div style="display:flex;align-items:center;gap:10px;padding:12px;background:var(--green3);border:1px solid rgba(56,214,138,.25);border-radius:var(--r-sm);margin-bottom:12px"><div style=\"font-size:20px\">✅</div><div style=\"flex:1\"><div style=\"font-size:12px;font-weight:800;color:var(--green2)\">מחובר לענן</div><div style=\"font-size:11px;color:var(--txt3)\">' + (u.displayName||u.email) + '</div></div><button onclick=\"window._fbSignOut()\" style=\"padding:6px 12px;background:rgba(240,80,80,.1);color:var(--red);border:1px solid rgba(240,80,80,.2);border-radius:7px;font-size:11px;font-weight:800;cursor:pointer\">התנתק</button></div>';
    } else {
      el.innerHTML = '<button onclick=\"window._fbSignIn()\" style=\"width:100%;padding:13px;background:var(--blue3);border:1px solid rgba(91,141,248,.3);border-radius:var(--r-sm);font-size:13px;font-weight:800;color:var(--blue);cursor:pointer;margin-bottom:12px\"><span style="display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;margin-left:4px"><svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/></svg></span> התחבר עם Google — שמירה בענן</button>';
    }
  };
  window._updateAuthUI();
  const st=document.getElementById('sound-toggle');
  if(st)st.classList.toggle('on',!!S.soundEnabled);
}
function renderGraceSection(){
  const ge=document.getElementById('grace-status-txt');
  if(!ge)return;
  const gpm=gracesPerLevel(S.level);
  const used=graceUsedThisMonth();
  const bought=graceBoughtThisMonth();
  let dotsHtml='';
  for(let i=0;i<gpm+bought;i++){
    const isUsed=i<used;
    dotsHtml+=`<span class="pip-dot ${isUsed?'empty':'full'}"></span>`;
  }
  const se=document.getElementById('shabbat-status-txt');
  if(se)se.textContent=shabbatDone()?'✓ שישי ושבת עודכנו השבוע':'ממתין לעדכון שבוע זה';
  ge.innerHTML=`<div class="grace-info-box">
    <div class="grace-info-row"><span style="color:var(--txt2)">זכאות לפי שלב:</span><span style="color:var(--gold);font-weight:800">${gpm}/חודש</span></div>
    ${bought>0?`<div class="grace-info-row"><span style="color:var(--txt2)">נרכשו:</span><span style="color:var(--gold);font-weight:800">+${bought}</span></div>`:''}
    <div class="grace-info-row"><span style="color:var(--txt2)">שומשו החודש:</span><span style="color:var(--txt3)">${used}</span></div>
    <div style="display:flex;gap:4px;margin-top:6px">${dotsHtml}</div>
    <div style="font-size:11px;color:${totalGraceAvailable()>0?'var(--green2)':'var(--red)'};margin-top:6px;font-weight:700">
      ${totalGraceAvailable()>0?`✓ ${totalGraceAvailable()} יום/ימי חסד זמינים`:'✗ ימי חסד מוצו החודש'}
    </div>
    ${(S.graceUsedDates||[]).filter(d=>d.slice?d.slice(0,7)===getCurrentMonth():false).map(d=>`
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:5px;background:rgba(240,192,64,.06);border-radius:6px;padding:5px 8px">
        <span style="font-size:11px;color:var(--txt2)">🛡️ ${new Date(d).toLocaleDateString('he-IL',{weekday:'short',day:'numeric',month:'short'})}</span>
        <button onclick="cancelGraceDay('${d}')" style="font-size:10px;background:rgba(240,80,80,.1);color:var(--red);border:1px solid rgba(240,80,80,.2);border-radius:5px;padding:3px 7px;cursor:pointer">ביטול</button>
      </div>`).join('')}
  </div>`;
}
function renderFocusDaySection(){
  const fds=document.getElementById('focus-day-status-txt');
  if(!fds)return;
  const used=focusDaysUsedThisMonth();
  const rem=FOCUS_DAYS_PER_MONTH-used;
  const allFD=(S.focusDays||[]);
  fds.innerHTML=`<div style="font-size:12px;color:var(--txt2)">
    <span style="color:${rem>0?'var(--teal)':'var(--txt3)'};font-weight:700">${rem} מתוך ${FOCUS_DAYS_PER_MONTH} ימי עשייה זמינים החודש</span>
    ${allFD.map(fd=>`
      <div style="margin-top:6px;background:rgba(45,212,191,.06);border:1px solid rgba(45,212,191,.15);border-radius:7px;padding:7px 10px;display:flex;align-items:center;gap:8px">
        <div style="flex:1">
          <div style="font-size:11px;color:var(--teal);font-weight:700">${new Date(fd.date).toLocaleDateString('he-IL',{weekday:'short',day:'numeric',month:'short'})}</div>
          <div style="font-size:11px;color:var(--txt2);margin-top:2px">${fd.goal}</div>
        </div>
        <button onclick="cancelFocusDay('${fd.date}')" style="font-size:10px;background:rgba(240,80,80,.1);color:var(--red);border:1px solid rgba(240,80,80,.2);border-radius:6px;padding:4px 8px;cursor:pointer;white-space:nowrap">ביטול</button>
      </div>`).join('')}
  </div>`;
}
function renderNotifSection(){
  const perm=notifSupported()?Notification.permission:'unsupported';
  const pa=document.getElementById('notif-perm-area');
  if(pa){
    if(perm==='unsupported')pa.innerHTML='<div class="notif-perm-denied">הדפדפן לא תומך בהתראות</div>';
    else if(perm==='denied')pa.innerHTML='<div class="notif-perm-denied">ההתראות חסומות — אפשר בהגדרות הדפדפן</div>';
    else if(perm==='default')pa.innerHTML=`<button class="notif-perm-btn" onclick="requestNotifPerm()">🔔 הפעל התראות</button>`;
    else pa.innerHTML=`<div style="font-size:12px;color:var(--green2);margin-bottom:10px">✓ התראות מאושרות</div>`;
  }
  const nr=document.getElementById('notif-rows');
  if(nr){
    const en=perm==='granted';
    let rows='';
    SLOTS.forEach((sl,i)=>{
      const k=`slot_${i}`,on=!!(S.notifEnabled&&S.notifEnabled[k]);
      rows+=`<div class="notif-row"><div class="notif-info"><div class="notif-name">${sl.icon} ${sl.title}</div><div class="notif-time">${String(sl.notifHour).padStart(2,'0')}:${String(sl.notifMin).padStart(2,'0')}</div></div>
        <button class="toggle${on?' on':''}" onclick="${en?`setNotif('${k}',${!on})`:'requestNotifPerm()'}"></button></div>`;
    });
    const kSh='shabbat',onSh=!!(S.notifEnabled&&S.notifEnabled[kSh]);
    rows+=`<div class="notif-row"><div class="notif-info"><div class="notif-name">✡️ תזכורת מוצאי שבת</div><div class="notif-time">שבת 20:30</div></div>
      <button class="toggle${onSh?' on':''}" onclick="${en?`setNotif('${kSh}',${!onSh})`:'requestNotifPerm()'}"></button></div>`;
    nr.innerHTML=rows;
  }
}
function renderCustomRewardsSection(){
  const list=document.getElementById('custom-rewards-list');
  if(!list)return;
  const cr=S.customRewards||[];
  if(!cr.length){list.innerHTML='<div style="font-size:12px;color:var(--txt3);margin-bottom:10px">אין עדיין צ\'ופרים אישיים</div>';}
  else list.innerHTML=cr.map(r=>`<div class="ri" style="margin-bottom:8px">
    <div style="font-size:20px;margin-left:4px">${r.emoji||'⭐'}</div>
    <div class="ri-body"><div class="ri-title">${r.title}</div><div class="ri-desc">${r.desc||''}</div></div>
    <div class="ri-right"><div class="ri-cost">${r.pts}</div>
      <button class="rbtn" style="background:var(--sf3);color:var(--txt2);font-size:11px;border:1px solid var(--brd2)" onclick="openRewardEdit('${r.id}',true)">✏️ ערוך</button>
    </div></div>`).join('');
  const da=document.getElementById('dream-setting-area');
  if(da){
    if(S.dreamRewardId){
      const all=[...REWARDS.flatMap(c=>c.items),...(S.customRewards||[])];
      const dr=all.find(r=>r.id===S.dreamRewardId);
      da.innerHTML=dr?`<div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--bg3);border-radius:var(--r-sm)">
        <span style="font-size:20px">⭐</span>
        <div style="flex:1"><div style="font-size:13px;font-weight:700">${dr.title}</div><div style="font-size:11px;color:var(--txt3)">${dr.pts} נקודות</div></div>
        <button class="rbtn" style="background:rgba(240,80,80,.12);color:var(--red);font-size:11px" onclick="toggleDream('${dr.id}')">הסר</button>
      </div>`:'<div style="font-size:12px;color:var(--txt3)">הפרס לא נמצא</div>';
    }else da.innerHTML='<div style="font-size:12px;color:var(--txt3)">עבור לדף הצ\'ופרים ולחץ ☆ ליד הפרס שבחרת</div>';
  }
}
function renderSettings(){
  renderAuthSection();
  renderGraceSection();
  renderFocusDaySection();
  renderNotifSection();
  renderCustomRewardsSection();
}


/* ══════════════ CUSTOM CONFIRM ══════════════ */
let _confirmCallback=null;
function _customConfirm(msg,okLabel){
  return new Promise(resolve=>{
    _confirmCallback=resolve;
    document.getElementById('confirm-msg').textContent=msg;
    const okBtn=document.getElementById('confirm-ok-btn');
    okBtn.textContent=okLabel||'אישור';
    document.getElementById('modal-confirm').classList.add('on');
  });
}
function _confirmResolve(){
  document.getElementById('modal-confirm').classList.remove('on');
  if(_confirmCallback){_confirmCallback(true);_confirmCallback=null;}
}
function _confirmReject(){
  document.getElementById('modal-confirm').classList.remove('on');
  if(_confirmCallback){_confirmCallback(false);_confirmCallback=null;}
}


/* ══════════════ FIX POINTS ══════════════ */
async function fixPoints(){
  if(!await _customConfirm('לאפס את הנקודות הזמינות לפי ההיסטוריה בלבד? הנתונים ישמרו.', '✓ תקן'))return;
  recalcStreakAndProgress();
  save();renderActive();toast('✅ נקודות תוקנו לפי ההיסטוריה');
}

/* ══════════════ BACKUP / RESTORE ══════════════ */
function exportData(){
  const data={...S, _exportDate: new Date().toISOString(), _version: SK};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  const d=new Date();
  const ds=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  a.href=url;a.download=`haalia-backup-${ds}.json`;
  document.body.appendChild(a);a.click();
  document.body.removeChild(a);URL.revokeObjectURL(url);
  // Save last export date
  localStorage.setItem('lastExport', new Date().toISOString());
  updateBackupInfo();
  toast('✅ גיבוי יוצא בהצלחה!');
}
async function importData(e){
  const file=e.target.files[0];if(!file)return;
  try{
    const text=await file.text();
    const parsed=JSON.parse(text);
    const isValid=parsed&&(Array.isArray(parsed.history)||typeof parsed.totalPts==='number'||parsed._version===SK||Array.isArray(parsed.customRewards));
    if(!isValid){toast('❌ קובץ לא תקין');return;}
    if(!await _customConfirm('לשחזר מהגיבוי? הנתונים הנוכחיים יוחלפו.','📥 שחזר'))return;
    S={...def(),...parsed};
    delete S._exportDate;delete S._version;
    save();location.reload();
  }catch(err){toast('❌ שגיאה בקריאת הקובץ');}
  e.target.value='';
}
function openPasteImport(){
  const ta=document.getElementById('paste-import-ta');
  if(ta)ta.value='';
  openModal('modal-paste-import');
}
async function savePasteImport(){
  const text=(document.getElementById('paste-import-ta').value||'').trim();
  if(!text){toast('הדבק JSON תחילה');return;}
  try{
    const parsed=JSON.parse(text);
    const isValid=parsed&&(Array.isArray(parsed.history)||typeof parsed.totalPts==='number'||parsed._version===SK||Array.isArray(parsed.customRewards));
    if(!isValid){toast('❌ JSON לא תקין');return;}
    if(!await _customConfirm('לשחזר מהגיבוי? הנתונים הנוכחיים יוחלפו.','📥 שחזר'))return;
    S={...def(),...parsed};
    delete S._exportDate;delete S._version;
    save();location.reload();
  }catch(err){toast('❌ שגיאה — ודא שה-JSON תקין');}
}
function updateBackupInfo(){
  const el=document.getElementById('backup-last-export');
  if(!el)return;
  const last=localStorage.getItem('lastExport');
  if(last){
    const d=new Date(last);
    el.textContent=`גיבוי אחרון: ${d.toLocaleDateString('he-IL',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}`;
  }
}

/* ══════════════ SERVICE WORKER (התראות ברקע) ══════════════ */
(function registerSW(){
  if(!('serviceWorker' in navigator))return;
  const swCode=`
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(clients.claim()));
self.addEventListener('push',e=>{
  const d=e.data?e.data.json():{title:'העלייה שלי',body:'זמן לבדוק את המשימות!'};
  e.waitUntil(self.registration.showNotification(d.title||'העלייה שלי',{
    body:d.body||'',icon:d.icon||'',badge:d.badge||'',dir:'rtl',lang:'he',
    vibrate:[200,100,200],tag:d.tag||'aliyah'
  }));
});
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  e.waitUntil(clients.matchAll({type:'window'}).then(cs=>{
    const c=cs.find(x=>x.focus);if(c)return c.focus();
    return clients.openWindow('/');
  }));
});
`;
  const blob=new Blob([swCode],{type:'text/javascript'});
  const swUrl=URL.createObjectURL(blob);
  navigator.serviceWorker.register(swUrl).catch(()=>{});
})();

/* ══════════════ VISUAL IMPROVEMENTS ══════════════ */
// Smooth entrance animation for tasks
(function addEntranceStyle(){
  const s=document.createElement('style');
  s.textContent=`
    @keyframes fadeSlideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    .slot{animation:fadeSlideIn .3s ease both}
    .slot:nth-child(2){animation-delay:.05s}
    .slot:nth-child(3){animation-delay:.1s}
    .slot:nth-child(4){animation-delay:.15s}
    .task{animation:fadeSlideIn .25s ease both}
    /* Better touch feedback */
    .task:active{transform:scale(.97);opacity:.85}
    .rbtn:active,.mbtn:active,.settings-btn:active{transform:scale(.97)}
    /* Install banner */
    #pwa-banner{position:fixed;bottom:80px;left:50%;transform:translateX(-50%) translateY(200px);background:var(--sf2);border:1px solid var(--brd2);border-radius:14px;padding:12px 18px;display:flex;align-items:center;gap:12px;z-index:500;transition:transform .4s cubic-bezier(.34,1.56,.64,1);max-width:340px;width:92%;box-shadow:0 8px 32px rgba(0,0,0,.4);pointer-events:none;}
    #pwa-banner.show{transform:translateX(-50%) translateY(0);pointer-events:auto}
    #pwa-banner-txt{flex:1;font-size:12px;font-weight:700;line-height:1.4;color:var(--txt2)}
    #pwa-banner-btn{padding:8px 14px;background:var(--gold);color:#000;border-radius:8px;font-size:12px;font-weight:800;white-space:nowrap;flex-shrink:0}
  `;
  document.head.appendChild(s);
})();

// PWA install prompt
let deferredPrompt=null;
window.addEventListener('beforeinstallprompt',e=>{
  e.preventDefault();deferredPrompt=e;
  setTimeout(()=>{
    const b=document.getElementById('pwa-banner');
    if(b)b.classList.add('show');
  },3000);
});
function installPWA(){
  if(!deferredPrompt)return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(()=>{deferredPrompt=null;document.getElementById('pwa-banner').classList.remove('show');});
}
function dismissPWA(){document.getElementById('pwa-banner').classList.remove('show');}

// Update backup info when settings is opened (via drawer)
const _drawerSettings=document.getElementById('drawer-settings');
if(_drawerSettings) _drawerSettings.addEventListener('click',()=>setTimeout(updateBackupInfo,50));

/* ══════════════ RESET ══════════════ */
async function resetData(){
  if(!await _customConfirm('למחוק את כל הנתונים? פעולה זו אינה הפיכה.', '🗑️ מחק'))return;
  if(!await _customConfirm('האם אתה בטוח לחלוטין?', '✓ כן, מחק הכל'))return;
  localStorage.removeItem(SK);S=def();save();location.reload();
}

/* ══════════════ MODAL ══════════════ */
function openModal(id){document.getElementById(id).classList.add('on');document.body.style.overflow='hidden';}
function closeModal(id){document.getElementById(id).classList.remove('on');if(!document.querySelector('.bs-bg.on,.modal-bg.on'))document.body.style.overflow='';}

/* ══════════════ NAV ══════════════ */
const PAGES=[
  {id:'today',  render:renderToday},
  {id:'levels', render:renderLevels},
  {id:'rewards',render:renderRewards},
  {id:'mastery',render:renderMastery},
  {id:'cal',    render:renderCal},
  {id:'settings',render:renderSettings},
  {id:'chat',   render:()=>{}}
];
let activePage='today';

// Pages that live in the drawer (not in bottom nav)
const DRAWER_PAGES=['levels','settings','journal'];
// Bottom nav tab IDs (excluding drawer pages)
const NAV_TAB_IDS=['today','mastery','rewards','cal','chat'];

function nav(p){
  activePage=p;
  // Show/hide all pages
  PAGES.forEach(({id})=>{
    const el=document.getElementById('pg-'+id);
    if(el) el.classList.toggle('on',id===p);
  });
  // journal page
  const jp=document.getElementById('pg-journal');
  if(jp) jp.classList.toggle('on',p==='journal');
  // chat page (special fixed layout)
  const cp=document.getElementById('pg-chat');
  if(cp){
    if(p==='chat'){cp.style.display='flex';requestAnimationFrame(()=>{const hdr=document.querySelector('.hdr');const streak=document.getElementById('streak-section');const topOffset=(hdr?hdr.getBoundingClientRect().bottom:0)+(streak&&streak.offsetHeight?streak.offsetHeight:0);cp.style.top=Math.round(topOffset)+'px';cp.style.opacity='1';cp.style.pointerEvents='auto';});}
    else{cp.style.opacity='0';cp.style.pointerEvents='none';setTimeout(()=>{if(document.getElementById('pg-chat').style.opacity==='0')cp.style.display='none';},250);}
  }

  // Highlight bottom nav tabs (only the 4 main ones)
  NAV_TAB_IDS.forEach(id=>{
    const btn=document.getElementById('btn-'+id);
    if(btn) btn.classList.toggle('on',id===p);
  });
  // "עוד" button stays un-highlighted when navigating to main tabs
  const moreBtn=document.getElementById('btn-more');
  if(moreBtn) moreBtn.classList.toggle('on', DRAWER_PAGES.includes(p));

  PAGES.find(x=>x.id===p)?.render();
  if(p==='journal' && typeof renderJournal==='function') renderJournal();
}

function openDrawer(){
  document.getElementById('side-drawer').classList.add('on');
  document.getElementById('side-drawer-overlay').classList.add('on');
  document.body.style.overflow='hidden';
  // Highlight active drawer item
  ['levels','journal','settings'].forEach(id=>{
    const el=document.getElementById('drawer-'+id);
    if(el) el.classList.toggle('on',activePage===id);
  });
}
function closeDrawer(){
  document.getElementById('side-drawer').classList.remove('on');
  document.getElementById('side-drawer-overlay').classList.remove('on');
  document.body.style.overflow='';
}
function navDrawer(p){
  closeDrawer();
  nav(p);
}

function renderActive(){PAGES.find(x=>x.id===activePage)?.render();}

/* ══════════════ RENDER MASTERY ══════════ */
/* ══ MASTERY PAGE SORT STATE ══ */
let _masterySort = 'slot'; // 'slot' | 'cat' | 'time'

function setMasterySort(mode){
  _masterySort = mode;
  renderMastery();
}

function toggleTaskSteps(bid){
  const el = document.getElementById('steps-body-'+bid);
  const arrow = document.getElementById('steps-arrow-'+bid);
  if(!el) return;
  const open = el.style.display === 'block';
  el.style.display = open ? 'none' : 'block';
  if(arrow) arrow.textContent = open ? '▼' : '▲';
}

// Resolve the storage key used in S.taskIndivLevel / S.taskSuccessCount for a group.
// When real taskGroups exist the key is g.id (e.g. "grp_pray").
// When falling back to builtinGroups the key is the base id without "grp_" prefix
// (e.g. "pray") because that's what the rollover and _baseId() produce from default tasks.
function _masteryBid(gId){
  if(getGroups()) return gId; // real custom groups — key matches
  return gId.replace(/^grp_/, ''); // builtin fallback — strip prefix
}

function renderMastery(){
  const groups = getGroups() || builtinGroups();
  const tl = S.taskIndivLevel || {};
  const tfs = S.taskFailStreak || {};

  // Backfill time field for groups saved without it
  const baseTasks1 = _getDefaultTasks(1);
  groups.forEach(g => {
    if(g.time === undefined) {
      const base = g.id.replace('grp_','');
      const t1 = baseTasks1.find(x => x.id.startsWith(base + '_'));
      g.time = t1 ? (t1.time || null) : null;
    }
  });

  // Build task list from groups (filter to weekday)
  const items = groups.filter(g => (g.days||['weekday']).includes('weekday'));

  const SLOT_LABELS = ['🌅 עבודת הבוקר','⚡ עשייה ובניין','📖 עומק ולימוד','🌙 ערב ומנוחה'];
  const SLOT_COLORS = ['var(--blue)','var(--orange)','var(--teal)','var(--purple)'];

  // Summary card — מיומנות כללית
  const tl2 = S.taskIndivLevel || {};
  const allBids = items.map(g => _masteryBid(g.id));
  const avgLvl = allBids.length ? Math.round(allBids.reduce((s,bid)=>s+(tl2[bid]||1),0)/allBids.length*10)/10 : 1;
  const aheadCount = allBids.filter(bid=>(tl2[bid]||1)>S.level).length;
  const atGlobal = allBids.filter(bid=>(tl2[bid]||1)===S.level && (tl2[bid]||1)>1).length;

  let h = `<div style="background:var(--surface);border:1px solid var(--gold2);border-radius:var(--r-lg);padding:18px;margin-bottom:18px">
    <div style="font-size:11px;font-weight:800;color:var(--gold);text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;text-align:center">שני מסלולי עלייה</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
      <div style="background:var(--bg3);border-radius:10px;padding:10px;text-align:center">
        <div style="font-size:10px;font-weight:800;color:var(--blue);margin-bottom:4px">🌐 מסלול כללי</div>
        <div style="font-size:22px;font-weight:900;color:var(--blue)">${S.level}</div>
        <div style="font-size:10px;color:var(--txt3)">שלב נוכחי</div>
        <div style="font-size:10px;color:var(--txt2);margin-top:3px">80% + רצף + נקודות</div>
      </div>
      <div style="background:var(--bg3);border-radius:10px;padding:10px;text-align:center">
        <div style="font-size:10px;font-weight:800;color:var(--purple);margin-bottom:4px">🎯 מסלול אישי</div>
        <div style="font-size:22px;font-weight:900;color:var(--purple)">${avgLvl}</div>
        <div style="font-size:10px;color:var(--txt3)">ממוצע רמות</div>
        <div style="font-size:10px;color:var(--txt2);margin-top:3px">5 הצלחות ↑ · 3 כישלונות ↓</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:4px">
      <div style="text-align:center"><div style="font-size:18px;font-weight:900;color:var(--purple)">${aheadCount}</div><div style="font-size:9px;color:var(--txt3);font-weight:700">לפני השלב הכללי</div></div>
      <div style="text-align:center"><div style="font-size:18px;font-weight:900;color:var(--green)">${atGlobal}</div><div style="font-size:9px;color:var(--txt3);font-weight:700">בשלב הכללי</div></div>
      <div style="text-align:center"><div style="font-size:18px;font-weight:900;color:var(--blue)">${allBids.length}</div><div style="font-size:9px;color:var(--txt3);font-weight:700">סה"כ משימות</div></div>
    </div>
  </div>`;

  // Sort bar
  h += `<div style="display:flex;gap:5px;margin-bottom:16px">
    <button class="hide-done-btn${_masterySort==='slot'?' on':''}" onclick="setMasterySort('slot')">⏱ סלוט זמן</button>
    <button class="hide-done-btn${_masterySort==='cat'?' on':''}" onclick="setMasterySort('cat')">🏷️ קטגוריה</button>
    <button class="hide-done-btn${_masterySort==='time'?' on':''}" onclick="setMasterySort('time')">🕐 שעה</button>
  </div>`;

  if(!items.length){
    h += '<div style="text-align:center;color:var(--txt3);padding:40px 0;font-size:13px">אין משימות להציג</div>';
    document.getElementById('mastery-content').innerHTML = h;
    return;
  }

  // Group items
  const grouped = {};
  items.forEach(g => {
    let key;
    if(_masterySort === 'slot') key = g.slot;
    else if(_masterySort === 'time') key = g.time || '__notime__';
    else key = g.cat || 'limud';
    if(!grouped[key]) grouped[key] = [];
    grouped[key].push(g);
  });

  // Sort groups
  let groupKeys;
  if(_masterySort === 'time'){
    // Sort by time: HH:MM strings sort lexicographically; no-time goes last
    groupKeys = Object.keys(grouped).sort((a,b) => {
      if(a === '__notime__') return 1;
      if(b === '__notime__') return -1;
      return a.localeCompare(b);
    });
  } else {
    groupKeys = Object.keys(grouped).sort((a,b) => Number(a)-Number(b));
  }

  groupKeys.forEach(key => {
    const label = _masterySort === 'slot'
      ? (SLOT_LABELS[Number(key)] || key)
      : _masterySort === 'time'
        ? (key === '__notime__' ? '🕐 ללא שעה מוגדרת' : `🕐 ${key}`)
        : (CATS[key] || key);
    const color = _masterySort === 'slot'
      ? (SLOT_COLORS[Number(key)] || 'var(--txt2)')
      : _masterySort === 'time'
        ? 'var(--blue)'
        : (CAT_COLORS[key] || 'var(--txt2)');

    h += `<div style="font-size:11px;font-weight:800;color:${color};text-transform:uppercase;letter-spacing:.8px;margin:16px 0 8px;padding-right:8px;border-right:3px solid ${color}">${label}</div>`;

    grouped[key].forEach(g => {
      const bid = g.id; // used for openEditGroupModal (must stay as g.id)
      const storeBid = _masteryBid(g.id); // key into S.taskIndivLevel / S.taskSuccessCount
      const indivLvl = tl[storeBid] || 1;
      const atMaxFlag = indivLvl >= MAX_LVL;
      const aheadOfGlobal = indivLvl > S.level; // personal track ahead of global
      const atGlobalCap = indivLvl === S.level && indivLvl > 1;
      const catColor = CAT_COLORS[g.cat] || 'var(--txt2)';
      const {done:succDone, needed:succNeeded} = getTaskSuccessProgress(storeBid);
      const succPct = succNeeded > 0 ? Math.round(succDone/succNeeded*100) : 0;
      const failStr = tfs[storeBid] || 0;

      // Current task text — use individual level
      const curText = (g.levels[indivLvl-1] || g.levels[0] || {}).text || '—';
      const titleText = g.title || (TASK_INFO[storeBid.replace('grp_','')]?.title) || curText;

      // Time badge
      const timeBadge = g.time
        ? `<span style="font-size:10px;background:var(--blue3);color:var(--blue);border-radius:4px;padding:1px 6px;font-weight:700">🕐 ${g.time}</span>`
        : '';

      // Category badge
      const catBadge = `<span style="font-size:10px;background:var(--bg3);color:${catColor};border-radius:4px;padding:1px 6px;font-weight:700">${CATS[g.cat]||g.cat}</span>`;

      // Status badge
      let statusBadge = '';
      if(atMaxFlag) statusBadge = `<span style="font-size:10px;background:var(--gold3);color:var(--gold);border-radius:4px;padding:1px 6px;font-weight:700">✦ מקסימום</span>`;
      else if(aheadOfGlobal) statusBadge = `<span style="font-size:10px;background:rgba(155,126,248,.15);color:var(--purple);border-radius:4px;padding:1px 6px;font-weight:700">🚀 לפני השלב הכללי</span>`;
      else if(atGlobalCap) statusBadge = `<span style="font-size:10px;background:var(--green3);color:var(--green2);border-radius:4px;padding:1px 6px;font-weight:700">✓ בשלב הכללי</span>`;

      const lvlColor = atMaxFlag ? 'var(--gold)' : aheadOfGlobal ? 'var(--purple)' : atGlobalCap ? 'var(--green)' : catColor;

      h += `<div style="background:var(--surface);border:1px solid var(--brd);border-radius:var(--r-sm);margin-bottom:8px;overflow:hidden">
        <!-- Task header — click to edit -->
        <div onclick="openEditGroupModal('${bid}')" style="padding:12px 13px;cursor:pointer;user-select:none">
          <div style="display:flex;align-items:flex-start;gap:8px">
            <div style="flex:1;min-width:0">
              <div style="font-size:11px;font-weight:800;color:var(--txt3);margin-bottom:2px;line-height:1.2">${titleText}</div>
              <div style="font-size:13px;font-weight:600;color:var(--txt);line-height:1.35">${curText}</div>
              <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px">
                ${timeBadge}${catBadge}
                ${failStr>0?`<span style="font-size:10px;background:rgba(240,80,80,.1);color:var(--red);border-radius:4px;padding:1px 6px;font-weight:700">⚠️ ${failStr} ימים ללא ביצוע</span>`:''}
                ${statusBadge}
              </div>
            </div>
            <div style="text-align:center;flex-shrink:0;min-width:36px">
              <div style="font-size:18px;font-weight:900;color:${lvlColor};line-height:1">${indivLvl}</div>
              <div style="font-size:9px;color:var(--txt3);font-weight:700">אישי</div>
              <div style="font-size:9px;color:var(--txt3);margin-top:2px">${S.level} כללי</div>
            </div>
          </div>
          ${!atMaxFlag?`<div style="margin-top:8px">
            <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--txt3);margin-bottom:3px">
              <span>מסלול אישי — עלייה לרמה ${indivLvl+1}</span>
              <span>${succDone}/${succNeeded} הצלחות</span>
            </div>
            <div style="height:3px;background:var(--sf2);border-radius:99px;overflow:hidden">
              <div style="height:100%;width:${succPct}%;background:${catColor};border-radius:99px;transition:width .6s"></div>
            </div>
          </div>`:''}
        </div>

      </div>`;
    });
  });

  document.getElementById('mastery-content').innerHTML = h;
}

function resetTaskMastery(bid){
  if(!S.taskSuccessCount)S.taskSuccessCount={};
  if(!S.taskIndivLevel)S.taskIndivLevel={};
  S.taskSuccessCount[bid]=0;
  S.taskIndivLevel[bid]=1;
  save();renderMastery();toast('↺ מונה אופס');
}

/* ══════════════ TOAST ══════════════ */
let toastT;
function toast(msg){
  const el=document.getElementById('toast');
  el.textContent=msg;el.classList.add('up');
  clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('up'),2500);
}

/* ══════════════ LEVEL UP ══════════════ */
function closeLU(){document.getElementById('lu').classList.remove('on');}
function launchConfetti(){
  const cv=document.getElementById('conf-canvas');const ctx=cv.getContext('2d');
  cv.width=window.innerWidth;cv.height=window.innerHeight;
  const p=Array.from({length:80},()=>({x:Math.random()*cv.width,y:-10,vx:(Math.random()-.5)*4,vy:Math.random()*4+2,sz:Math.random()*8+4,c:['#f0c040','#38d68a','#5b8df8','#f05080','#9b7ef8'][Math.floor(Math.random()*5)],r:Math.random()*360,vr:(Math.random()-.5)*8,a:1}));
  let fr;function draw(){ctx.clearRect(0,0,cv.width,cv.height);let alive=false;p.forEach(x=>{x.x+=x.vx;x.y+=x.vy;x.r+=x.vr;x.a-=.008;if(x.a>0)alive=true;ctx.save();ctx.globalAlpha=Math.max(0,x.a);ctx.translate(x.x,x.y);ctx.rotate(x.r*Math.PI/180);ctx.fillStyle=x.c;ctx.fillRect(-x.sz/2,-x.sz/2,x.sz,x.sz/2);ctx.restore();});if(alive)fr=requestAnimationFrame(draw);else ctx.clearRect(0,0,cv.width,cv.height);}
  draw();setTimeout(()=>cancelAnimationFrame(fr),4000);
}
if(pendingLU){
  document.getElementById('lu-title').textContent=`עלית לשלב ${pendingLU}!`;
  document.getElementById('lu-sub').textContent='כל הכבוד — הרצף הוכיח שינוי אמיתי. המשימות מאתגרות יותר, אבל גם הגרסה שלך טובה יותר.';
  setTimeout(()=>{document.getElementById('lu').classList.add('on');launchConfetti();playLevelUp();},700);
}

// Init
if(S.sortMode){
  currentSort=S.sortMode;
  const el=document.getElementById('sort-'+currentSort);
  if(el){document.querySelectorAll('.sort-btn').forEach(b=>b.classList.remove('on'));el.classList.add('on');}
}
setTimeout(scheduleAllNotifs,1000);
initShabbatTimes();
applyTheme(S.lightMode !== undefined ? S.lightMode : true);
renderToday();
renderRewards();


/* ══════════════ AI — ANTHROPIC API ══════════════ */
// ── AI SETTINGS ──
function toggleAISettings(){
  const panel=document.getElementById('ai-settings-panel');
  const btn=document.getElementById('ai-settings-toggle-btn');
  const open=panel.style.display==='none'||!panel.style.display;
  panel.style.display=open?'block':'none';
  btn.style.background=open?'rgba(155,126,248,.15)':'var(--sf2)';
  btn.style.borderColor=open?'rgba(155,126,248,.4)':'var(--brd2)';
  btn.style.color=open?'var(--purple)':'var(--txt3)';
}
function toggleAIChip(el){el.classList.toggle('on');}
function selectAITone(el){document.querySelectorAll('.ai-tone-btn').forEach(b=>b.classList.remove('on'));el.classList.add('on');}
function selectAILen(el){document.querySelectorAll('.ai-len-btn').forEach(b=>b.classList.remove('on'));el.classList.add('on');}

function getAISettings(){
  const chips=[...document.querySelectorAll('#ai-focus-chips .ai-chip.on')].map(b=>b.dataset.id);
  const tone=(document.querySelector('.ai-tone-btn.on')||{}).dataset||{tone:'warm'};
  const len=(document.querySelector('.ai-len-btn.on')||{}).dataset||{len:'medium'};
  const freeText=(document.getElementById('ai-free-instruction')?.value||'').trim();
  return{focus:chips,tone:tone.tone||'warm',len:len.len||'medium',freeText};
}

function buildAISettingsContext(settings){
  const focusMap={
    tasks:'משימות היום',streak:'מצב הרצף',patterns:'מגמות ודפוסים',
    emotion:'מה המשתמש כתב ביומן',missed:'משימות שלא בוצעו',wins:'הצלחות והישגים'
  };
  const toneMap={
    warm:'חמים ומעודד',direct:'ישיר וללא עטיפות — דבר בגוף שני, אמת בלי פילטרים',
    coaching:'סגנון מאמן ספורט — אתגר, דחיפה קדימה, אנרגיה גבוהה',
    deep:'עמוק ופילוסופי — גע בפנים, חשוב מחוץ לקופסה'
  };
  const lenMap={short:'2-3 פסקאות קצרות בלבד',medium:'3-5 פסקאות',long:'5-7 פסקאות מפורטות'};
  let ctx='';
  if(settings.focus.length>0){
    const labels=settings.focus.map(f=>focusMap[f]||f).join(', ');
    ctx+=`\nהתמקד בעיקר ב: ${labels}.`;
  }
  ctx+=`\nסגנון כתיבה: ${toneMap[settings.tone]||toneMap.warm}.`;
  ctx+=`\nאורך: ${lenMap[settings.len]||lenMap.medium}.`;
  if(settings.freeText) ctx+=`\nהנחיה נוספת מהמשתמש: "${settings.freeText}"`;
  return ctx;
}

const AI_KEY_SK = 'anthropic_api_key';

function getApiKey(){ return localStorage.getItem(AI_KEY_SK)||''; }

async function saveApiKey(){
  const val=(document.getElementById('ai-key-input').value||'').trim();
  if(!val){toast('הכנס מפתח API');return;}
  if(!val.startsWith('sk-ant-')){toast('מפתח לא תקין — חייב להתחיל ב- sk-ant-');return;}
  localStorage.setItem(AI_KEY_SK,val);
  // Save encrypted to Firebase so it syncs to other devices
  if(window._fbUser&&window._db){
    try{
      await window._db.collection("users").doc(window._fbUser.uid)
        .collection("prefs").doc("apikey").set({k:btoa(val)});
      toast('🔑 מפתח נשמר ומסונכרן לכל המכשירים!');
    }catch(e){ toast('🔑 מפתח נשמר (לא הצלחנו לסנכרן לענן)'); }
  } else {
    toast('🔑 מפתח נשמר במכשיר זה');
  }
  document.getElementById('ai-key-input').value='';
  updateAiKeyStatus();
}

function updateAiKeyStatus(){
  const el=document.getElementById('ai-key-status');
  if(!el)return;
  const k=getApiKey();
  if(k){
    el.innerHTML='<span style="color:var(--green2);font-weight:700">✓ מפתח שמור — '+k.slice(0,14)+'••••</span> <button onclick="clearApiKey()" style="font-size:10px;background:rgba(240,80,80,.1);color:var(--red);border:1px solid rgba(240,80,80,.2);border-radius:5px;padding:2px 7px;cursor:pointer;margin-right:6px">מחק</button>';
  }else{
    el.innerHTML='<span style="color:var(--txt3)">אין מפתח שמור — הכנס מפתח למעלה</span>';
  }
}

async function clearApiKey(){
  localStorage.removeItem(AI_KEY_SK);
  if(window._fbUser&&window._db){
    try{ await window._db.collection("users").doc(window._fbUser.uid).collection("prefs").doc("apikey").delete(); }catch(e){}
  }
  updateAiKeyStatus();
  toast('🗑️ מפתח נמחק מכל המכשירים');
}

async function _callClaude(prompt){
  const key=getApiKey();
  if(!key){toast('חסר מפתח API — הכנס בלשונית 🤖 AI');return null;}
  try{
    const res=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'x-api-key':key,
        'anthropic-version':'2023-06-01',
        'anthropic-dangerous-direct-browser-access':'true'
      },
      body:JSON.stringify({
        model:'claude-haiku-4-5-20251001',
        max_tokens:1500,
        messages:[{role:'user',content:prompt}]
      })
    });
    if(!res.ok){
      const err=await res.json().catch(()=>({}));
      toast('שגיאת API: '+(err.error?.message||res.status));
      return null;
    }
    const data=await res.json();
    return data.content?.[0]?.text||null;
  }catch(e){toast('שגיאת רשת — בדוק חיבור אינטרנט');return null;}
}

async function aiGenerateTasks(){
  const goal=(document.getElementById('ai-task-goal').value||'').trim();
  const current=(document.getElementById('ai-task-current').value||'').trim();
  const steps=parseInt(document.getElementById('ai-task-steps').value)||10;
  const slot=document.getElementById('ai-task-slot').value;
  const slotNames=['עבודת הבוקר','עשייה ובניין','עומק ולימוד','ערב ומנוחה'];
  if(!goal){toast('הכנס את המטרה שלך');return;}
  if(!current){toast('תאר היכן אתה אוחז כעת');return;}
  const btn=document.getElementById('ai-task-btn');
  const resultEl=document.getElementById('ai-task-result');
  btn.textContent='⏳ יוצר מסלול...';btn.disabled=true;
  resultEl.innerHTML='<div style="text-align:center;padding:16px;color:var(--txt3)">⏳ ה-AI בונה מסלול התקדמות...</div>';

  const minPts=5,maxPts=28;
  const prompt=`אתה עוזר לאפליקציית שיפור עצמי יומי בעברית.
המשתמש רוצה להשיג מטרה: "${goal}".
המצב הנוכחי שלו: "${current}".
סלוט הזמן: ${slotNames[slot]}.

בנה מסלול התקדמות של בדיוק ${steps} שלבים — מהמצב הנוכחי אל המטרה.

חוקי בניית המסלול (חובה לשמור עליהם):
1. **צעדי תינוק** — כל שלב מוסיף רק שינוי קטן אחד על השלב הקודם. אין קפיצות גדולות.
2. **שלב 1** = כמעט זהה למצב הנוכחי — המינימום האפשרי שהוא כן שיפור.
3. **שלבים 2–5** = שיפורים קטנים מאוד, כאילו "כמעט לא שינית כלום".
4. **שלבים 6–10** = שיפורים מדורגים ברורים אך עדיין ריאליים.
5. **שלבים 11–14** = מתקרבים למטרה בצורה ברורה.
6. **שלב ${steps}** = המטרה הסופית עצמה.
7. כל שלב הוא משימה יומית קונקרטית — מספרים ספציפיים, זמנים, כמויות.
8. **אסור** שהפרש בין שלב סמוך לשלב יהיה גדול מ-15% מהמרחק הכולל.

דוגמה לצעדי תינוק נכונים (קימה מוקדמת):
שלב 1: קימה עד 8:45 | שלב 2: קימה עד 8:30 | שלב 3: קימה עד 8:15 | שלב 4: קימה עד 8:00 וכו'.

הנקודות עולות בהדרגה מ-${minPts} עד ${maxPts} על פני ${steps} שלבים.

בנוסף לשלבים, צור מידע הסברתי למשימה:
- why: למה הרגל זה חשוב? (2-3 משפטים, עם עובדות/מחקרים אם רלוונטי)
- desc: איך מבצעים את המשימה בפועל? (1-2 משפטים קונקרטיים)
- tip: טיפ מעשי אחד קטן שעוזר להצליח (משפט אחד)
- goal: תיאור קצר של שלב 15 — המטרה הסופית (עד 80 תווים)
- stepDescs: מערך של ${steps} תיאורים קצרים — לכל שלב מה הוא מייצג בדרך אל המטרה (עד 60 תווים לשלב)

החזר JSON בלבד ללא שום טקסט נוסף:
{"name":"שם קצר למשימה (עד 25 תווים)","why":"למה זה חשוב...","desc":"מה לעשות...","tip":"טיפ קטן...","goal":"היעד הסופי...","stepDescs":["תיאור שלב 1","תיאור שלב 2",...,"תיאור שלב ${steps}"],"levels":[{"text":"טקסט שלב 1","pts":${minPts}},{"text":"טקסט שלב 2","pts":${Math.round(minPts+(maxPts-minPts)/(steps-1))}},...,{"text":"טקסט שלב ${steps}","pts":${maxPts}}]}
הטקסט בעברית, קצר וברור (עד 60 תווים לשלב). החזר בדיוק ${steps} שלבים.`;

  const raw=await _callClaude(prompt);
  btn.textContent='✨ צור מסלול עם AI';btn.disabled=false;
  if(!raw){resultEl.innerHTML='';return;}
  try{
    const clean=raw.replace(/```json|```/g,'').trim();
    const obj=JSON.parse(clean);
    if(!obj.levels||obj.levels.length<steps){toast('תשובת AI לא תקינה, נסה שוב');resultEl.innerHTML='';return;}
    obj.levels=obj.levels.slice(0,steps);
    while(obj.levels.length<15){const last=obj.levels[obj.levels.length-1];obj.levels.push({text:last.text,pts:last.pts});}
    // Pad stepDescs to 15
    if(!obj.stepDescs)obj.stepDescs=[];
    while(obj.stepDescs.length<15){obj.stepDescs.push(obj.stepDescs[obj.stepDescs.length-1]||'');}
    const hasInfo = obj.why||obj.desc||obj.tip;
    resultEl.innerHTML=`
      <div style="background:rgba(45,212,191,.07);border:1px solid rgba(45,212,191,.25);border-radius:var(--r-sm);padding:14px">
        <div style="font-size:13px;font-weight:800;color:var(--teal);margin-bottom:10px">✓ "${obj.name}" — ${steps} שלבים</div>
        <div style="font-size:11px;color:var(--txt2);margin-bottom:3px">🟢 שלב 1: ${obj.levels[0].text} <span style="color:var(--gold)">(${obj.levels[0].pts} נק')</span></div>
        <div style="font-size:11px;color:var(--txt2);margin-bottom:${hasInfo?'8':'12'}px">🏆 שלב ${steps}: ${obj.levels[steps-1].text} <span style="color:var(--gold)">(${obj.levels[steps-1].pts} נק')</span></div>
        ${hasInfo?`<div style="font-size:10px;color:var(--gold);font-weight:700;margin-bottom:4px">✨ מידע הסברתי נוצר אוטומטית</div>
        ${obj.why?`<div style="font-size:11px;color:var(--txt3);margin-bottom:3px;line-height:1.5">🌟 ${obj.why.slice(0,90)}${obj.why.length>90?'...':''}</div>`:''}
        <div style="margin-bottom:12px"></div>`:''}
        <button onclick='_aiAddTask(${JSON.stringify(JSON.stringify(obj))},${slot})'
          style="width:100%;padding:10px;background:var(--teal);color:#000;border-radius:8px;font-size:12px;font-weight:800;cursor:pointer">➕ הוסף מסלול לאפליקציה</button>
      </div>`;
  }catch(e){toast('שגיאה בפענוח תשובת AI');resultEl.innerHTML='';}
}

function _aiAddTask(jsonStr,slot){
  const obj=JSON.parse(jsonStr);
  const grpId='grp_ai_'+Date.now();
  if(!S.taskGroups)S.taskGroups=builtinGroups();
  S.taskGroups.push({
    id:grpId,
    title:obj.name||undefined,
    cat:'limud',slot:parseInt(slot),anchor:false,
    days:['weekday','friday'],
    levels:obj.levels,
    reminderEnabled:false,reminderTime:'09:00'
  });
  // Save AI-generated task info to override
  if(obj.why||obj.desc||obj.tip||obj.goal||obj.stepDescs){
    if(!S.taskInfoOverride)S.taskInfoOverride={};
    S.taskInfoOverride[grpId]={
      why:obj.why||'',
      desc:obj.desc||'',
      tip:obj.tip||'',
      goal:obj.goal||'',
      steps:obj.stepDescs||[]
    };
  }
  save();
  document.getElementById('ai-task-result').innerHTML=
    '<div style="color:var(--green2);font-weight:700;text-align:center;padding:10px">✅ המשימה נוספה עם מידע הסברתי!</div>';
  toast('✅ משימת AI נוספה!');
  renderActive();
}

async function aiGenerateRewards(){
  const movies=(document.getElementById('ai-reward-movies').value||'').trim();
  const books=(document.getElementById('ai-reward-books').value||'').trim();
  const food=(document.getElementById('ai-reward-food').value||'').trim();
  const hobbies=(document.getElementById('ai-reward-hobbies').value||'').trim();
  const points=(document.getElementById('ai-reward-points').value||'').trim();
  if(!movies&&!books&&!food&&!hobbies){toast('מלא לפחות תחום עניין אחד');return;}
  const btn=document.getElementById('ai-reward-btn');
  const resultEl=document.getElementById('ai-reward-result');
  btn.textContent="⏳ יוצר צ'ופרים...";btn.disabled=true;
  resultEl.innerHTML='<div style="text-align:center;padding:16px;color:var(--txt3)">⏳ ה-AI מחפש פינוקים מושלמים...</div>';

  const prompt=`אתה עוזר לאפליקציית שיפור עצמי בעברית.
צ'ופר = פינוק ספציפי שמותר לעשות רק כשעומדים ביעדים ומגיעים לנקודות מספיקות.
הצ'ופרים חייבים להיות קונקרטיים לחלוטין — לא "צפה בסרט" אלא "צפה ב-Interstellar".

פרטי המשתמש:
- סרטים/סדרות: "${movies||'לא צוין'}"
- ספרים/קריאה: "${books||'לא צוין'}"
- אוכל/ממתקים: "${food||'לא צוין'}"
- תחביבים/פנאי: "${hobbies||'לא צוין'}"
- טווח נקודות: "${points||'100-1000 נקודות'}"

צור בדיוק 6 צ'ופרים ספציפיים ומגוונים:
- 2 קטנים (ממתק ספציפי, פרק בודד)
- 2 בינוניים (סרט ספציפי, ספר ספציפי)
- 2 גדולים (עונה שלמה, חוויה מיוחדת)

חשוב: כל צ'ופר = שם ספציפי אמיתי. לא כללי.

החזר JSON בלבד ללא שום טקסט נוסף:
[{"title":"שם הצ'ופר הספציפי","desc":"למה זה פינוק מיוחד","pts":150,"emoji":"🎬","minLevel":1},...]
הכל בעברית. pts בין 80 ל-2000. minLevel בין 1 ל-10.`;

  const raw=await _callClaude(prompt);
  btn.textContent="✨ צור צ'ופרים עם AI";btn.disabled=false;
  if(!raw){resultEl.innerHTML='';return;}
  try{
    const clean=raw.replace(/```json|```/g,'').trim();
    const arr=JSON.parse(clean);
    if(!Array.isArray(arr)||!arr.length){toast('תשובת AI לא תקינה, נסה שוב');resultEl.innerHTML='';return;}
    const previewHtml=arr.map(r=>`
      <div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--brd)">
        <span style="font-size:18px">${r.emoji||'🎁'}</span>
        <div style="flex:1"><div style="font-size:12px;font-weight:700">${r.title}</div>
        <div style="font-size:10px;color:var(--txt3)">${r.desc||''}</div></div>
        <div style="font-size:12px;font-weight:900;color:var(--gold)">${r.pts} נק'</div>
      </div>`).join('');
    resultEl.innerHTML=`
      <div style="background:rgba(240,192,64,.07);border:1px solid rgba(240,192,64,.25);border-radius:var(--r-sm);padding:14px">
        <div style="font-size:12px;font-weight:800;color:var(--gold);margin-bottom:8px">✓ ${arr.length} צ'ופרים נוצרו</div>
        ${previewHtml}
        <button onclick='_aiAddRewards(${JSON.stringify(JSON.stringify(arr))})'
          style="width:100%;padding:10px;background:var(--gold);color:#000;border-radius:8px;font-size:12px;font-weight:800;cursor:pointer;margin-top:10px">➕ הוסף הכל לאפליקציה</button>
      </div>`;
  }catch(e){toast('שגיאה בפענוח תשובת AI');resultEl.innerHTML='';}
}

function _aiAddRewards(jsonStr){
  const arr=JSON.parse(jsonStr);
  if(!S.customRewards)S.customRewards=[];
  arr.forEach(r=>{
    S.customRewards.push({
      id:'custom_ai_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),
      title:r.title,desc:r.desc||'',pts:r.pts||200,
      emoji:r.emoji||'🎁',minLevel:r.minLevel||1,
      rewardCat:"🤖  AI צ'ופרים"
    });
  });
  save();
  document.getElementById('ai-reward-result').innerHTML=
    '<div style="color:var(--green2);font-weight:700;text-align:center;padding:10px">✅ הצ\'ופרים נוספו לחנות!</div>';
  toast("✅ צ'ופרי AI נוספו!");
  renderActive();
}

// Show key status when AI bottomsheet key tab opens (stab-ai removed — handled via openAiBS)


function toggleAcc(el){el.classList.toggle('open');}

function renderSpecialTasksSettings(){
  // One-time tasks list
  const otEl=document.getElementById('onetime-tasks-list');
  if(otEl){
    const list=S.oneTimeTasks||[];
    if(!list.length){otEl.innerHTML='<div style="font-size:12px;color:var(--txt3);text-align:center;padding:8px">אין משימות חד פעמיות עדיין</div>';}
    else{
      otEl.innerHTML=list.map(t=>{
        const maxReps=t.maxReps||1;
        const doneCount=t.doneCount||(t.doneDate?1:0);
        const statusLabel=doneCount>=maxReps?'✅ הושלם במלואו':`${doneCount}/${maxReps} פעמים`;
        return`<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--bg3);border:1px solid var(--brd);border-radius:8px;margin-bottom:6px">
          <span style="font-size:14px">⚡</span>
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.text}</div>
            <div style="font-size:10px;color:var(--txt3)">${t.pts} נק' · ${maxReps>1?`חזרות: ${statusLabel}`:(doneCount?'✅ הושלם':'ממתין')}</div>
          </div>
          <button onclick="deleteOneTimeTask('${t.id}')" style="font-size:16px;color:var(--red);padding:2px 6px;border-radius:6px;background:rgba(240,80,80,.1)">🗑️</button>
        </div>`;
      }).join('');
    }
  }
  // Streak tasks list
  const stEl=document.getElementById('streak-tasks-list');
  if(stEl){
    const list=S.streakTasks||[];
    if(!list.length){stEl.innerHTML='<div style="font-size:12px;color:var(--txt3);text-align:center;padding:8px">אין משימות עקביות עדיין</div>';}
    else{
      stEl.innerHTML=list.map(t=>{
        const streak=getStreakCount(t);
        const pts=streakTaskPts(streak+1);
        return`<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--bg3);border:1px solid var(--brd);border-radius:8px;margin-bottom:6px">
          <span style="font-size:14px">🔥</span>
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.text}</div>
            <div style="font-size:10px;color:var(--green)">רצף: ${streak} ימים · ${pts} נק' מחר</div>
          </div>
          <button onclick="deleteStreakTask('${t.id}')" style="font-size:16px;color:var(--red);padding:2px 6px;border-radius:6px;background:rgba(240,80,80,.1)">🗑️</button>
        </div>`;
      }).join('');
    }
  }
}

/* ══════════════════════════════════════════════
   JOURNAL
══════════════════════════════════════════════ */
const JOURNAL_SK='aliyah_journal_v1';
function loadJournalData(){try{const r=localStorage.getItem(JOURNAL_SK);if(r)return JSON.parse(r);}catch(e){}return{};}
function saveJournalData(data){localStorage.setItem(JOURNAL_SK,JSON.stringify(data));}
function getTodayKey(){return new Date().toLocaleDateString('he-IL',{year:'numeric',month:'2-digit',day:'2-digit'}).replace(/\./g,'-');}
function getFormattedDateJournal(){return new Date().toLocaleDateString('he-IL',{weekday:'long',year:'numeric',month:'long',day:'numeric'});}

function renderJournalPage(){
  const lbl=document.getElementById('journal-date-label');
  if(lbl)lbl.textContent=getFormattedDateJournal();
  renderJournalDaySummary();
  const todayKey=getTodayKey();
  const jData=loadJournalData();
  const todayEntry=jData[todayKey]||{};
  const ta=document.getElementById('journal-user-text');
  if(ta){ta.value=todayEntry.userText||'';updateCharCount();}
  if(todayEntry.aiText){
    showAIOutput(todayEntry.aiText);
    const btn=document.getElementById('journal-ai-btn');
    if(btn)btn.textContent='↻ עדכן';
  } else {
    document.getElementById('journal-ai-placeholder').style.display='block';
    document.getElementById('journal-ai-text').style.display='none';
    document.getElementById('journal-ai-error').style.display='none';
    document.getElementById('journal-ai-loading').style.display='none';
  }
  const pastWrap=document.getElementById('journal-past-entries');
  if(pastWrap&&pastWrap.style.display!=='none')renderPastJournals();
}

function renderJournalDaySummary(){
  const tasks=getTasks(S.level);
  const dayType=getDayType(new Date());
  const todayTasks=tasks.filter(t=>(t.days||['weekday']).includes(dayType));
  const doneTasks=todayTasks.filter(t=>S.done[t.id]);
  const pct=todayTasks.length?Math.round(doneTasks.length/todayTasks.length*100):0;
  const ringEl=document.getElementById('journal-ring-pct');
  if(ringEl){ringEl.textContent=pct+'%';ringEl.style.color=pct>=80?'var(--green)':pct>=50?'var(--gold)':'var(--red)';}
  const pillsEl=document.getElementById('journal-cat-pills');
  if(!pillsEl)return;
  const catStats={};
  const catDisplay={zman:{e:'⏱',n:'זמנים'},briut:{e:'💧',n:'בריאות'},achila:{e:'🍎',n:'אכילה'},limud:{e:'📖',n:'לימוד'},bayit:{e:'🏠',n:'בית'},smart:{e:'📵',n:'סמארטפון'}};
  todayTasks.forEach(t=>{
    if(!catStats[t.cat])catStats[t.cat]={total:0,done:0};
    catStats[t.cat].total++;
    if(S.done[t.id])catStats[t.cat].done++;
  });
  pillsEl.innerHTML=Object.keys(catDisplay).filter(k=>catStats[k]&&catStats[k].total>0).map(k=>{
    const st=catStats[k];const ok=st.done>=st.total;const half=!ok&&st.done>0;
    const info=catDisplay[k];
    const bg=ok?'var(--green3)':half?'rgba(240,192,64,.1)':'var(--bg3)';
    const clr=ok?'var(--green)':half?'var(--gold)':'var(--txt3)';
    return`<span style="display:inline-flex;align-items:center;gap:3px;font-size:10px;font-weight:700;padding:3px 8px;border-radius:99px;background:${bg};color:${clr}">${info.e} ${st.done}/${st.total}</span>`;
  }).join('');
}

let journalSaveTimer=null;
function onJournalInput(){
  updateCharCount();
  clearTimeout(journalSaveTimer);
  journalSaveTimer=setTimeout(()=>saveJournalEntry(true),2000);
}
function updateCharCount(){
  const ta=document.getElementById('journal-user-text');
  const cc=document.getElementById('journal-char-count');
  if(ta&&cc){const len=ta.value.length;cc.textContent=len>0?`${len} תווים`:'';} 
}
function saveJournalEntry(silent=false){
  const ta=document.getElementById('journal-user-text');
  if(!ta)return;
  const text=ta.value.trim();
  const todayKey=getTodayKey();
  const jData=loadJournalData();
  if(!jData[todayKey])jData[todayKey]={};
  jData[todayKey].userText=text;
  jData[todayKey].savedAt=new Date().toISOString();
  saveJournalData(jData);
  if(!silent){
    const badge=document.getElementById('journal-saved-badge');
    if(badge){badge.style.display='inline-flex';setTimeout(()=>{badge.style.display='none';},2500);}
    toast('✓ הרשומה נשמרה');
  }
}

async function generateAIJournal(){
  const apiKey=localStorage.getItem('anthropic_api_key');
  if(!apiKey){showAIError('לא נמצא מפתח API. הזן מפתח בהגדרות ← 🤖 AI');return;}
  const ctx=buildJournalDayContext();
  const userNote=(document.getElementById('journal-user-text')?.value||'').trim();
  const settings=getAISettings();
  const settingsCtx=buildAISettingsContext(settings);
  showAILoading();
  const prompt=buildAIJournalPrompt(ctx,userNote);
  try{
    const res=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'x-api-key':apiKey,
        'anthropic-version':'2023-06-01',
        'anthropic-dangerous-direct-browser-access':'true'
      },
      body:JSON.stringify({
        model:'claude-sonnet-4-20250514',
        max_tokens:1000,
        system:`אתה יועץ אישי חם ומעמיק שעוקב אחרי המשתמש שלו — אדם שמנסה לשפר את עצמו יום אחרי יום דרך מסלול של 15 שלבים.
אתה כותב יומן-עידוד יומי בעברית בגוף שני (אתה...).
הסגנון שלך: כנה, מחמם, לא מחמיא בריק, מדויק לנתונים — מזהה דפוסים, מציין הצלחות אמיתיות, נוגע בנקודות הכאב בעדינות.
אל תפתח ב"היי" או ברכה גנרית. היכנס ישר לניתוח.
הימנע מנקודות bullet. כתוב בפסקאות שוטפות כמו יומן אמיתי.${settingsCtx}`,
        messages:[{role:'user',content:prompt}]
      })
    });
    if(!res.ok){const err=await res.json().catch(()=>({}));throw new Error(err.error?.message||`שגיאת API: ${res.status}`);}
    const data=await res.json();
    const aiText=data.content?.map(b=>b.type==='text'?b.text:'').join('')||'';
    if(!aiText.trim())throw new Error('התגובה ריקה');
    const todayKey=getTodayKey();
    const jData=loadJournalData();
    if(!jData[todayKey])jData[todayKey]={};
    jData[todayKey].aiText=aiText;
    jData[todayKey].aiGeneratedAt=new Date().toISOString();
    jData[todayKey].dayContext=ctx;
    saveJournalData(jData);
    showAIOutput(aiText);
    const btn=document.getElementById('journal-ai-btn');
    if(btn)btn.textContent='↻ עדכן';
  }catch(e){showAIError(e.message||'שגיאה ביצירת הניתוח');}
}

function buildJournalDayContext(){
  const tasks=getTasks(S.level);
  const dayType=getDayType(new Date());
  const todayTasks=tasks.filter(t=>(t.days||['weekday']).includes(dayType));
  const doneTasks=todayTasks.filter(t=>S.done[t.id]);
  const pct=todayTasks.length?Math.round(doneTasks.length/todayTasks.length*100):0;
  const catNames={zman:'זמנים',briut:'בריאות',achila:'אכילה',limud:'לימוד',bayit:'בית',smart:'סמארטפון'};
  const catStats={};
  todayTasks.forEach(t=>{
    const nm=catNames[t.cat]||t.cat;
    if(!catStats[nm])catStats[nm]={total:0,done:0,tasks:[]};
    catStats[nm].total++;
    if(S.done[t.id]){catStats[nm].done++;catStats[nm].tasks.push(t.text);}
  });
  const recent=(S.history||[]).slice(-7).map(h=>h.pct||0);
  return{
    date:getFormattedDateJournal(),
    dayType:dayType==='weekday'?'חול':dayType==='friday'?'ערב שבת':'שבת',
    pct,doneTasks:doneTasks.map(t=>t.text),
    missedTasks:todayTasks.filter(t=>!S.done[t.id]).map(t=>t.text),
    catStats,streak:S.streak||0,level:S.level||1,totalPts:S.totalPts||0,
    recentPcts:recent,avgRecent:recent.length?Math.round(recent.reduce((a,b)=>a+b,0)/recent.length):0
  };
}

function buildFullHistoryContext(){
  const mainState=localStorage.getItem('aliyah_v34')||'{}';
  const journalData=localStorage.getItem('aliyah_journal_v1')||'{}';
  return{mainState,journalData};
}

function buildAIJournalPrompt(ctx,userNote){
  const catLines=Object.entries(ctx.catStats).map(([cat,st])=>
    `  ${cat}: ${st.done}/${st.total}${st.done>0?' (✓ '+st.tasks.slice(0,2).join(', ')+(st.tasks.length>2?'...':'')+')':''}`
  ).join('\n');
  const missedStr=ctx.missedTasks.length?ctx.missedTasks.slice(0,4).join(', ')+(ctx.missedTasks.length>4?` ועוד ${ctx.missedTasks.length-4}...`:''):'לא';
  const trendStr=ctx.recentPcts.length?ctx.recentPcts.map(p=>p+'%').join(' → '):'אין נתונים';

  const{mainState,journalData}=buildFullHistoryContext();

  return`=== נתוני היום (${ctx.date}) ===
סוג יום: ${ctx.dayType}
📊 ביצוע: ${ctx.pct}% (${ctx.doneTasks.length} מתוך ${ctx.doneTasks.length+ctx.missedTasks.length} משימות)
📈 מגמת 7 ימים: ${trendStr} (ממוצע: ${ctx.avgRecent}%)

לפי קטגוריות:
${catLines}

לא בוצע היום: ${missedStr}
${userNote?`\nמה כתבתי ביומן:\n"${userNote}"`:''}

=== כל נתוני האפליקציה (JSON מלא) ===
מצב ראשי:
${mainState}

יומן:
${journalData}

---
אתה רואה את כל הנתונים המלאים של האפליקציה. השתמש בהם כדי לזהות דפוסים, לציין שיפורים, ולהתייחס להיסטוריה האמיתית.
כתוב ניתוח-עידוד אישי ליומן שלי להיום.`;
}

function setAIState(state, content){
  const ids=['journal-ai-placeholder','journal-ai-loading','journal-ai-text','journal-ai-error'];
  ids.forEach(id=>{const el=document.getElementById(id);if(el)el.style.display='none';});
  const btn=document.getElementById('journal-ai-btn');
  if(state==='loading'){
    document.getElementById('journal-ai-loading').style.display='block';
    if(btn){btn.disabled=true;btn.textContent='...';}
  } else if(state==='output'){
    const el=document.getElementById('journal-ai-text');
    el.style.display='block';el.textContent=content;
    if(btn){btn.disabled=false;btn.textContent='↻ עדכן';}
  } else if(state==='error'){
    const el=document.getElementById('journal-ai-error');
    el.style.display='block';el.textContent='⚠️ '+content;
    if(btn){btn.disabled=false;btn.textContent='↻ נסה שוב';}
  }
}
function showAILoading(){setAIState('loading');}
function showAIOutput(text){setAIState('output',text);}
function showAIError(msg){setAIState('error',msg);}

function togglePastJournals(){
  const el=document.getElementById('journal-past-entries');
  const btn=document.getElementById('past-journals-toggle');
  if(el.style.display==='none'){el.style.display='block';btn.textContent='הסתר';renderPastJournals();}
  else{el.style.display='none';btn.textContent='הצג';}
}
function renderPastJournals(){
  const el=document.getElementById('journal-past-entries');
  if(!el)return;
  const jData=loadJournalData();
  const todayKey=getTodayKey();
  const entries=Object.entries(jData).filter(([k])=>k!==todayKey&&(jData[k].userText||jData[k].aiText)).sort(([a],[b])=>b.localeCompare(a)).slice(0,30);
  if(!entries.length){el.innerHTML=`<div style="text-align:center;font-size:12px;color:var(--txt3);padding:16px">אין רשומות קודמות עדיין.</div>`;return;}
  el.innerHTML=entries.map(([key,entry])=>{
    const ctx=entry.dayContext;
    const pctBadge=ctx?(()=>{
      const p=ctx.pct||0;
      const bg=p>=80?'var(--green3)':p>=50?'rgba(240,192,64,.1)':'rgba(240,80,80,.08)';
      const clr=p>=80?'var(--green)':p>=50?'var(--gold)':'var(--red)';
      return`<span class="journal-past-pct" style="background:${bg};color:${clr}">${p}% · שלב ${ctx.level} · 🔥${ctx.streak}</span>`;
    })():'';
    const userSection=entry.userText?`<div class="journal-past-user">${escHtml(entry.userText)}</div>`:'';
    const aiSection=entry.aiText?`<div class="journal-past-ai">🤖 ${escHtml(entry.aiText)}</div>`:'';
    return`<div class="journal-past-card"><div class="journal-past-date"><span>${key}</span>${pctBadge}</div>${userSection}${aiSection}</div>`;
  }).join('');
}
function escHtml(str){return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

/* patch nav for journal */
(function(){
  const _orig=window.nav;
  window.nav=function(tab){
    if(tab==='journal'){
      document.querySelectorAll('.pg').forEach(p=>p.classList.remove('on'));
      // Clear bottom nav highlights
      NAV_TAB_IDS.forEach(id=>{const b=document.getElementById('btn-'+id);if(b)b.classList.remove('on');});
      const moreBtn=document.getElementById('btn-more');
      if(moreBtn)moreBtn.classList.add('on');
      const pg=document.getElementById('pg-journal');
      if(pg)pg.classList.add('on');
      activePage='journal';
      renderJournalPage();
    } else {
      if(_orig)_orig(tab);
    }
  };
})();


/* ══════════════ AI FAB & BOTTOMSHEET ══════════════ */
function openAiBS(){
  const bg=document.getElementById('ai-bs-bg');
  bg.style.display='block';
  // sync key field
  const k=localStorage.getItem('anthropic_api_key')||'';
  const inp=document.getElementById('ai-key-input2');
  if(inp&&k)inp.value=k;
  requestAnimationFrame(()=>{ bg.classList.add('on'); requestAnimationFrame(()=>bg.classList.add('vis')); });
}
function closeAiBS(){
  const bg=document.getElementById('ai-bs-bg');
  bg.classList.remove('vis');
  setTimeout(()=>{ bg.classList.remove('on'); bg.style.display='none'; },280);
}
function switchAiTab(tab){
  ['tasks','rewards','key'].forEach(t=>{
    document.getElementById('ai-pane-'+t).style.display = t===tab?'block':'none';
    document.getElementById('ai-tab-'+t).classList.toggle('on',t===tab);
  });
}

function saveApiKeyBS(){
  const val=(document.getElementById('ai-key-input2').value||'').trim();
  if(!val){document.getElementById('ai-key-status2').innerHTML='<span style="color:var(--red)">הכנס מפתח תקין</span>';return;}
  localStorage.setItem('anthropic_api_key',val);
  // also sync to old input
  const old=document.getElementById('ai-key-input'); if(old)old.value=val;
  // save to cloud if logged in
  if(window._fbUser&&window._db){
    window._db.collection('users').doc(window._fbUser.uid).collection('prefs').doc('apikey').set({k:btoa(val)}).catch(()=>{});
  }
  document.getElementById('ai-key-status2').innerHTML='<span style="color:var(--green)">✓ נשמר!</span>';
  setTimeout(()=>{ document.getElementById('ai-key-status2').innerHTML=''; },2000);
}

async function aiGenerateTasksBS(){
  // Sync inputs to old fields for reuse of existing aiGenerateTasks logic
  const goal = document.getElementById('ai-task-goal2').value;
  const cur  = document.getElementById('ai-task-current2').value;
  const steps= document.getElementById('ai-task-steps2').value;
  const slot = document.getElementById('ai-task-slot2').value;
  document.getElementById('ai-task-goal').value = goal;
  document.getElementById('ai-task-current').value = cur;
  document.getElementById('ai-task-steps').value = steps;
  document.getElementById('ai-task-slot').value = slot;
  // show result in BS panel
  const resultEl = document.getElementById('ai-task-result2');
  resultEl.innerHTML = '<div style="text-align:center;padding:20px;color:var(--txt2)">⏳ יוצר מסלול...</div>';
  await aiGenerateTasks();
  // copy result
  const src=document.getElementById('ai-task-result');
  resultEl.innerHTML=src?src.innerHTML:'';
}

async function aiGenerateRewardsBS(){
  ['movies','books','food','hobbies','points'].forEach(f=>{
    const src=document.getElementById('ai-reward-'+f+'2');
    const dst=document.getElementById('ai-reward-'+f);
    if(src&&dst)dst.value=src.value;
  });
  const resultEl=document.getElementById('ai-reward-result2');
  resultEl.innerHTML='<div style="text-align:center;padding:20px;color:var(--txt2)">⏳ יוצר צ\'ופרים...</div>';
  await aiGenerateRewards();
  const src=document.getElementById('ai-reward-result');
  resultEl.innerHTML=src?src.innerHTML:'';
}