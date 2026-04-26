/* ══ ניתוב משימות: getTasks, getDayType, domainProgress ══ */


function getTasks(lvl){
  const expanded = expandGroupsForLevel(lvl);
  if (expanded) {
    // בדיקה: האם יש משימות חדשות ב-BASE_IDS שחסרות אצל המשתמש?
// ישן — להחליף ב:
const BASE_IDS = [
  'p5', 'b1', 'z1', 'z2', 'b2', 'mikve', 'l8', 'pray', 's1', 'l5', 'w2', 'w1', 
  'v1', 'l9', 'l4', 'p2', 'z4', 'h3', 'f1', 'h4', 's3', 'bed', 'a3', 
  'ev_lunch', 'ev_gmara', 'c1', 'p3', 'h2', 'sleep', 'p4', 
  'fr1', 'sh1', 'sh2', 'sh3', 'sh4'
];
    const userGrpIds = new Set((S.taskGroups || []).map(g => g.id));
    const missingBases = BASE_IDS.filter(base => !userGrpIds.has('grp_' + base));
    if (missingBases.length > 0) {
      // בנה את הקבוצות החסרות מהמשימות המובנות
      const newGroups = missingBases.map(base => {
        const levels = [];
        for (let i = 1; i <= MAX_LVL; i++) {
          const tasks = _getDefaultTasks(i);
          const t = tasks.find(x => x.id.startsWith(base + '_'));
          levels.push({ text: t ? t.text : '', pts: t ? t.pts : 5 });
        }
        const t1 = _getDefaultTasks(1).find(x => x.id.startsWith(base + '_'));
        return {
          id: 'grp_' + base,
          cat:    t1 ? t1.cat              : 'zman',
          slot:   t1 ? t1.slot             : 0,
          anchor: t1 ? !!t1.anchor         : false,
          days:   t1 ? (t1.days || ['weekday']) : ['weekday'],
          time:   t1 ? (t1.time || null)   : null,
          levels
        };
      });
      // מוסיף את החסרות בסוף — לא נוגע בסדר של המשתמש
      S.taskGroups = [...(S.taskGroups || []), ...newGroups];
      if (typeof save === 'function') save();
    }
    return expandGroupsForLevel(lvl);
  }
  return _getDefaultTasks(lvl);
}
// Get tasks for today using per-task individual levels
function getTasksWithIndivLevel(globalLvl){
  // For each task, replace its level with the individual level (capped by global)
  const baseTasks=getTasks(globalLvl);
  if(!S.taskIndivLevel)return baseTasks;
  // Group default tasks by base ID and re-fetch at individual level
  return baseTasks.map(t=>{
    const bid=_baseId(t.id);
    const indivLvl=getTaskDisplayLevel(bid);
    if(indivLvl===globalLvl)return t;
    // Get the same task but at the individual level
    const altTasks=_getDefaultTasks(indivLvl);
    const alt=altTasks.find(x=>_baseId(x.id)===bid);
    if(alt)return{...alt,id:t.id,_displayLevel:indivLvl};
    return t;
  });
}
// Returns 'shabbat' | 'friday' | 'weekday' for a given Date (or today if omitted)
function getDayType(dateObj){
  const d = dateObj instanceof Date ? dateObj : new Date(dateObj);
  const dow = d.getDay();
  return dow===6?'shabbat':dow===5?'friday':'weekday';
}
// Returns tasks for a specific day type
function getTasksForDay(lvl, dayType){
  return getTasks(lvl).filter(t=>{
    const days = t.days || ['weekday'];
    return days.includes(dayType);
  });
}
function domainProgress(lvl){
  return[
    {name:'⏱ זמנים',      val:Math.round((9*60-lerp(9*60,5*60,lvl))/(9*60-5*60)*100), color:'var(--blue)'},
    {name:'🌅 בוקר',       val:Math.round((lvl-1)/14*100),                              color:'#ff9800'}, // כתום
    {name:'💧 בריאות',    val:Math.round((lerp(12,45,lvl)-12)/33*100),                 color:'var(--green)'},
    {name:'🍎 אכילה',     val:Math.round((lvl-1)/14*100),                              color:'#f07840'},
    {name:'📖 לימוד',     val:Math.round((lerp(20,180,lvl)-20)/160*100),               color:'var(--purple)'},
    {name:'💼 שליחות',    val:Math.round((lvl-1)/14*100),                              color:'#00bcd4'}, // תכלת
    {name:'🏠 בית',       val:Math.round((lerp(5,25,lvl)-5)/20*100),                   color:'var(--gold)'},
    {name:'📵 סמארטפון',  val:Math.round((lerp(30,120,lvl)-30)/90*100),                color:'var(--red)'},
    {name:'🕯️ ערב שבת',  val:Math.round((lvl-1)/14*100),                              color:'#e91e63'}, // ורוד
    {name:'✡️ שבת',       val:Math.round((lvl-1)/14*100),                              color:'#3f51b5'}  // אינדיגו
  ];
}
/* ══════════════ TASK INFO ══════════════ */
