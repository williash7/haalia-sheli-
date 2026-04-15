/* ══ buildCatStats: סטטיסטיקות קטגוריות ══ */

function buildCatStats(){
  const stats={};
  Object.keys(CATS).forEach(c=>{stats[c]={total:0,done:0};});
  // Accumulate from all history entries that have catDone
  (S.history||[]).forEach(h=>{
    if(h.catDone){
      Object.keys(h.catDone).forEach(c=>{
        if(!stats[c])stats[c]={total:0,done:0};
        stats[c].total+=h.catDone[c].total||0;
        stats[c].done+=h.catDone[c].done||0;
      });
    }
  });
  // Add today's current done tasks
  const tasks=getTasks(S.level);
  tasks.forEach(t=>{
    if(!stats[t.cat])stats[t.cat]={total:0,done:0};
    stats[t.cat].total++;
    if(S.done[t.id])stats[t.cat].done++;
  });
  return stats;
}

/* ══════════════ REWARDS ══════════════ */
