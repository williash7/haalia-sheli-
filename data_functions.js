/* ══ פונקציות עזר: streak, lerp, חישובים ══ */

function getReqStreak(lvl){return lvl<=5?5:lvl<=10?7:14;}
function getReqStagePoints(lvl){
  // Minimum points needed to advance to next level
  const pts=[0,200,300,400,500,650,800,950,1100,1300,1500,1750,2000,2300,2600];
  return pts[Math.min(lvl-1,14)]||200;
}
function lerp(from,to,lvl){return Math.round(from+(to-from)*(lvl-1)/(MAX_LVL-1));}
function streakBonus(){return S.streak>=7?1.15:1;}
function bonusPts(base){return Math.round(base*streakBonus());}

/* ══════════════ STREAK TASK POINTS ══════════════ */
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

/* ══════════════ TASKS ══════════════ */
