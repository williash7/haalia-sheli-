/* ══ data_core.js — קבועים + פונקציות + סטטיסטיקות ══
 * איחוד של: data_constants.js + data_functions.js + data_stats.js
 */

/* ── קבועים ── */
const CATS={zman:'⏱ זמנים',boker:'🌅 בוקר',briut:'💧 בריאות',achila:'🍎 אכילה',limud:'📖 לימוד',shlichut:'💼 שליחות',bayit:'🏠 בית',smart:'📵 סמארטפון',shabbat:'✡️ שבת',erev:'🕯️ ערב שבת'};

const CAT_COLORS={zman:'var(--blue)',boker:'#ff9800',briut:'var(--green)',achila:'#f07840',limud:'var(--purple)',shlichut:'#00bcd4',bayit:'var(--gold)',smart:'var(--red)',shabbat:'var(--purple)',erev:'var(--teal)'};

const CAT_COLORS_HEX={zman:'#5b8df8',boker:'#ff9800',briut:'#38d68a',achila:'#f07840',limud:'#9b7ef8',shlichut:'#00bcd4',bayit:'#f0c040',smart:'#f05050',shabbat:'#9b7ef8',erev:'#2dd4bf'};

const DAY_WEEKDAY='weekday', DAY_FRIDAY='friday', DAY_SHABBAT='shabbat';

const SLOTS=[
  {label:'כל היום',title:'משימות כלליות',icon:'📌',notifHour:8,notifMin:0},
  {label:'04:45–11:00',title:'משימות הבוקר',icon:'🌅',notifHour:4,notifMin:45},
  {label:'11:00–18:00',title:'משימות הצהריים',icon:'☀️',notifHour:11,notifMin:0},
  {label:'18:00–22:45',title:'משימות הערב והלילה',icon:'🌙',notifHour:18,notifMin:0},
];

const SHABBAT_REMINDER={notifHour:20,notifMin:30};

/* ── פונקציות עזר ── */
function getReqStreak(lvl){return lvl<=5?5:lvl<=10?7:14;}
function getReqStagePoints(lvl){
  const pts=[0,200,300,400,500,650,800,950,1100,1300,1500,1750,2000,2300,2600];
  return pts[Math.min(lvl-1,14)]||200;
}
function lerp(from,to,lvl){return Math.round(from+(to-from)*(lvl-1)/(MAX_LVL-1));}
function streakBonus(){return S.streak>=7?1.15:1;}
function bonusPts(base){return Math.round(base*streakBonus());}

function streakTaskPts(currentStreak){
  if(currentStreak<=4)  return 5;
  if(currentStreak<=9)  return 8;
  if(currentStreak<=19) return 12;
  if(currentStreak<=29) return 18;
  if(currentStreak<=44) return 25;
  if(currentStreak<=59) return 33;
  if(currentStreak<=89) return 42;
  if(currentStreak<=119)return 52;
  if(currentStreak<=149)return 63;
  if(currentStreak<=179)return 75;
  return 90;
}
function todayStr(){return new Date().toDateString();}
function streakTaskActiveToday(st){
  const dayType=getDayType(new Date());
  return (st.days||['weekday']).includes(dayType);
}
function getStreakCount(st){
  if(!st.streakDays)return 0;
  let count=0;
  const d=new Date();
  for(let i=0;i<200;i++){
    const ds=d.toDateString();
    const dayType=getDayType(d);
    const isRelevantDay=(st.days||['weekday']).includes(dayType);
    if(isRelevantDay){
      if(st.streakDays[ds])count++;
      else if(i>0)break;
    }
    d.setDate(d.getDate()-1);
  }
  return count;
}

/* ── סטטיסטיקות קטגוריות ── */
function buildCatStats(){
  const stats={};
  Object.keys(CATS).forEach(c=>{stats[c]={total:0,done:0};});
  (S.history||[]).forEach(h=>{
    if(h.catDone){
      Object.keys(h.catDone).forEach(c=>{
        if(!stats[c])stats[c]={total:0,done:0};
        stats[c].total+=h.catDone[c].total||0;
        stats[c].done+=h.catDone[c].done||0;
      });
    }
  });
  const tasks=getTasks(S.level);
  tasks.forEach(t=>{
    if(!stats[t.cat])stats[t.cat]={total:0,done:0};
    stats[t.cat].total++;
    if(S.done[t.id])stats[t.cat].done++;
  });
  return stats;
}
