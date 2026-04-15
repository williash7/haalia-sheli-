/* ══ ניתוב משימות: getTasks, getDayType, domainProgress ══ */


function getTasks(lvl){
  const expanded = expandGroupsForLevel(lvl);
  if (expanded) return expanded;
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
    {name:'⏱ זמנים',    val:Math.round((9*60-lerp(9*60,5*60,lvl))/(9*60-5*60)*100), color:'var(--blue)'},
    {name:'💧 בריאות',   val:Math.round((lerp(12,45,lvl)-12)/33*100),                color:'var(--green)'},
    {name:'🍎 אכילה',    val:Math.round((lvl-1)/14*100),                              color:'#f07840'},
    {name:'📖 לימוד',    val:Math.round((lerp(20,180,lvl)-20)/160*100),               color:'var(--purple)'},
    {name:'🏠 בית',      val:Math.round((lerp(5,25,lvl)-5)/20*100),                   color:'var(--gold)'},
    {name:'📵 סמארטפון', val:Math.round((lerp(30,120,lvl)-30)/90*100),                color:'var(--red)'},
  ];
}

/* ══════════════ TASK INFO ══════════════ */
