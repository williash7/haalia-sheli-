/* ══════════════════════════════════════════════════════════════
   planner.js v3 — יומן יומי מסונכרן
   
   שינויים מ-v2:
   • משתמש ב-getTasksWithIndivLevel (שלב אישי לכל משימה)
   • עדיפות זמן: t.time מ-data_tasks קודם, טקסט רק גיבוי
   • לחיצה על בלוק → popup עריכת שעה + משך
   • חיצים כמו בגרסה המקורית
══════════════════════════════════════════════════════════════ */

const PL_START_HOUR=4,PL_END_HOUR=28,PL_SLOT_H=52,PL_HOUR_H=PL_SLOT_H*2,PL_DEF_DUR=30,PL_MAX_DUR=120;

const PL_CC={
  zman:    {bg:'rgba(240,192,64,.15)', br:'var(--gold)',   tx:'var(--gold)'  },
  limud:   {bg:'rgba(91,141,248,.13)',br:'var(--blue)',   tx:'var(--blue)'  },
  briut:   {bg:'rgba(56,214,138,.12)',br:'var(--green)',  tx:'var(--green)' },
  bayit:   {bg:'rgba(45,212,191,.12)',br:'var(--teal)',   tx:'var(--teal)'  },
  shlichut:{bg:'rgba(155,126,248,.13)',br:'var(--purple)',tx:'var(--purple)'},
  smart:   {bg:'rgba(240,120,64,.12)',br:'#e07040',       tx:'#e07040'      },
  custom:  {bg:'rgba(240,80,80,.11)', br:'var(--red)',    tx:'var(--red)'   },
};
const PL_DC={bg:'rgba(91,141,248,.11)',br:'var(--blue)',tx:'var(--blue)'};

let _plDate=new Date(),_plDragging=null;

/* ── CSS ── */
(function(){
  const s=document.createElement('style');
  s.textContent=`
    #pl-wrap{display:flex;flex-direction:column}
    #pl-header{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;
      background:var(--bg);border-bottom:1px solid var(--brd);position:sticky;top:0;z-index:10}
    #pl-header button{width:34px;height:34px;border-radius:50%;background:var(--sf2);
      border:1px solid var(--brd2);color:var(--txt2);cursor:pointer;font-size:18px;
      display:flex;align-items:center;justify-content:center}
    #pl-day-bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;
      padding:7px 14px;border-bottom:1px solid var(--brd);font-size:11px;min-height:34px}
    #pl-body{overflow-y:auto;-webkit-overflow-scrolling:touch}
    #pl-grid{position:relative;padding-right:50px;user-select:none}
    .pl-hl{position:absolute;right:0;left:0;border-top:1px solid var(--brd);pointer-events:none}
    .pl-dl{position:absolute;right:0;left:0;border-top:1px dashed rgba(128,128,128,.12);pointer-events:none}
    .pl-ll{position:absolute;right:0;width:44px;font-size:9.5px;font-weight:700;
      color:var(--txt3);text-align:center;transform:translateY(-7px);pointer-events:none}
    .pl-hit{position:absolute;right:50px;left:3px;cursor:pointer;z-index:1;
      border-radius:5px;transition:background .1s}
    .pl-hit:hover{background:rgba(91,141,248,.06)}
    #pl-now{position:absolute;right:50px;left:0;height:2px;background:var(--red);
      z-index:6;pointer-events:none}
    #pl-now::before{content:'';position:absolute;right:-5px;top:-4px;
      width:10px;height:10px;border-radius:50%;background:var(--red)}
    .pl-blk{position:absolute;border-radius:8px;padding:5px 8px 18px;border-right:3px solid;
      z-index:3;box-sizing:border-box;overflow:hidden;touch-action:none;cursor:pointer}
    .pl-blk.dragging{opacity:.8;box-shadow:0 6px 20px rgba(0,0,0,.3);z-index:20;cursor:grabbing}
    .pl-blk.pl-done{opacity:.38}
    .pl-bt{font-size:11px;font-weight:800;line-height:1.3;
      white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .pl-bs{font-size:9px;font-weight:600;opacity:.7;margin-top:1px}
    .pl-chk{position:absolute;bottom:4px;left:6px;width:14px;height:14px;
      border-radius:4px;border:1.5px solid;display:flex;align-items:center;
      justify-content:center;cursor:pointer}
    .pl-edit-ico{position:absolute;bottom:4px;right:6px;font-size:10px;
      opacity:.45;cursor:pointer}
    #pl-fab{position:fixed;bottom:78px;left:16px;width:46px;height:46px;
      border-radius:50%;background:linear-gradient(135deg,var(--blue),var(--purple));
      color:#fff;font-size:22px;border:none;cursor:pointer;
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 4px 14px rgba(0,0,0,.3);z-index:50}
    #pl-fab:active{transform:scale(.9)}
    .pl-modal-bg{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.65);
      display:flex;align-items:flex-end;justify-content:center}
    .pl-modal-box{background:var(--bg2);border-radius:20px 20px 0 0;
      border-top:1px solid var(--brd2);padding:20px 16px 36px;
      width:100%;max-width:500px;box-sizing:border-box}
    @keyframes plpop{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
    .pl-blk{animation:plpop .16s ease}
  `;
  document.head.appendChild(s);
})();

/* ── patch renderJournalPage ── */
(function(){
  let n=0;
  const iv=setInterval(()=>{
    n++;
    if(typeof window.renderJournalPage==='function'&&!window._plv3){
      clearInterval(iv);window._plv3=true;
      window.renderJournalPage=plRender;
    }
    if(n>150)clearInterval(iv);
  },100);
})();

/* ════════ RENDER MAIN ════════ */
function plRender(){
  const page=document.getElementById('pg-journal');
  if(!page)return;
  if(!document.getElementById('pl-wrap')){
    page.innerHTML=`
      <div id="pl-wrap">
        <div id="pl-header">
          <button id="pl-prev" title="יום קודם">&#8594;</button>
          <div id="pl-dlbl" style="text-align:center;flex:1;cursor:pointer"
               title="לחץ לחזרה להיום">
            <div id="pl-heb" style="font-size:13px;font-weight:800;color:var(--txt)"></div>
            <div id="pl-greg" style="font-size:10px;color:var(--txt3);margin-top:1px"></div>
          </div>
          <button id="pl-next" title="יום הבא">&#8592;</button>
        </div>
        <div id="pl-day-bar"></div>
        <div id="pl-body"><div id="pl-grid"></div></div>
      </div>
      <button id="pl-fab" onclick="_plNewEvPop(null)" title="הוסף אירוע">+</button>
    `;
    /* חיצים: → = יום אחורה (תאריך קטן יותר), ← = יום קדימה */
    document.getElementById('pl-prev').onclick=()=>{_plDate.setDate(_plDate.getDate()-1);plRender()};
    document.getElementById('pl-next').onclick=()=>{_plDate.setDate(_plDate.getDate()+1);plRender()};
    document.getElementById('pl-dlbl').onclick=()=>{_plDate=new Date();plRender()};
  }
  _plHead();_plGrid();_plScrollNow();
}

/* ════════ HEADER ════════ */
function _plHead(){
  const isT=_plDate.toDateString()===new Date().toDateString();
  document.getElementById('pl-heb').textContent=
    (isT?'📅 היום — ':'')+
    _plDate.toLocaleDateString('he-IL-u-ca-hebrew',{weekday:'long',day:'numeric',month:'long'});
  document.getElementById('pl-greg').textContent=
    _plDate.toLocaleDateString('he-IL',{day:'numeric',month:'long',year:'numeric'});
}

/* ════════ GRID ════════ */
function _plGrid(){
  const grid=document.getElementById('pl-grid');
  if(!grid)return;
  grid.style.height=(PL_END_HOUR-PL_START_HOUR)*PL_HOUR_H+'px';
  let html='';
  for(let h=PL_START_HOUR;h<=PL_END_HOUR;h++){
    const y=(h-PL_START_HOUR)*PL_HOUR_H;
    html+=`<div class="pl-hl" style="top:${y}px"></div>`;
    if(h<PL_END_HOUR){
      html+=`<div class="pl-ll" style="top:${y}px">${String(h>=24?h-24:h).padStart(2,'0')}:00</div>`;
      html+=`<div class="pl-hit" style="top:${y}px;height:${PL_SLOT_H}px"
               onclick="_plSlotClick('${String(h>=24?h-24:h).padStart(2,'0')}:00')"></div>`;
      const yh=y+PL_SLOT_H;
      html+=`<div class="pl-dl" style="top:${yh}px"></div>`;
      html+=`<div class="pl-hit" style="top:${yh}px;height:${PL_SLOT_H}px"
               onclick="_plSlotClick('${String(h>=24?h-24:h).padStart(2,'0')}:30')"></div>`;
    }
  }
  const now=new Date();
  if(_plDate.toDateString()===now.toDateString())
    html+=`<div id="pl-now" style="top:${_plPx(now.getHours()+now.getMinutes()/60)}px"></div>`;
  grid.innerHTML=html;
  _plBlocks();_plBar();
}

/* ════════ BLOCKS ════════ */
function _plBlocks(){
  const grid=document.getElementById('pl-grid');if(!grid)return;
  grid.querySelectorAll('.pl-blk').forEach(b=>b.remove());

  const ds=_plDate.toDateString();
  const isT=ds===new Date().toDateString();
  const dt=getDayType(_plDate);

  /* ── משימות ב-LEVEL הנכון לכל משימה (כמו דף היום) ── */
  const tasks=_plGetTasks(dt);
  const histDone=isT?S.done:(_plHistDone(ds)||{});

  const items=[];
  tasks.forEach(t=>{
    const time=_plTaskTime(t);
    if(!time)return;
    const text=_plTaskText(t);
    const isDone=!!histDone[t.id];
    items.push({id:t.id,type:'task',time,dur:_plTaskDur(t),isDone,label:text,pts:t.pts,cat:t.cat});
  });
  /* ── אירועים מותאמים ── */
  _plCustEvs(ds).forEach(ev=>{
    if(!ev.time)return;
    items.push({id:ev.id,type:'custom',time:ev.time,dur:ev.duration||PL_DEF_DUR,
                isDone:false,label:ev.title,pts:0,cat:'custom'});
  });

  /* ── פתרון חפיפות ── */
  items.sort((a,b)=>a.time.localeCompare(b.time));
  const colEnds=[];
  items.forEach(item=>{
    const s=_plMin(item.time),e=s+item.dur;
    let c=0;while(colEnds[c]!==undefined&&colEnds[c]>s)c++;
    colEnds[c]=e;item._col=c;
  });
  const nCols=Math.max(1,colEnds.length);
  const bW=Math.min(window.innerWidth,500)-56;

  /* ── ציור ── */
  items.forEach(item=>{
    const cc=PL_CC[item.cat]||PL_DC;
    const topPx=_plPx(_plH(item.time));
    const hPx=Math.max(PL_SLOT_H-3,Math.round(item.dur/30*PL_SLOT_H));
    const cW=Math.floor(bW/nCols);
    const leftPx=53+item._col*cW;

    const blk=document.createElement('div');
    blk.className='pl-blk'+(item.isDone?' pl-done':'');
    blk.dataset.id=item.id;blk.dataset.tp=item.type;
    blk.style.cssText=
      `top:${topPx}px;height:${hPx}px;left:${leftPx}px;width:${cW-3}px;`+
      `right:auto;background:${cc.bg};border-color:${cc.br}`;

    const chkSvg=item.isDone
      ?`<svg width="9" height="9" viewBox="0 0 11 11" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="1.5,5.5 4,8.5 9.5,2.5"/></svg>`
      :'';
    const delX=item.type==='custom'
      ?`<button onclick="event.stopPropagation();_plDelCust('${item.id}')"
          style="position:absolute;top:3px;left:20px;font-size:10px;color:${cc.tx};
                 opacity:.45;background:none;border:none;cursor:pointer;padding:0">&#x2715;</button>`
      :'';

    blk.innerHTML=`
      ${delX}
      <div class="pl-bt" style="color:${cc.tx}">${item.label}</div>
      <div class="pl-bs" style="color:${cc.tx}">${item.time}${item.pts?' · +'+item.pts:''}</div>
      ${item.type==='task'
        ?`<div class="pl-chk"
            style="border-color:${cc.br};background:${item.isDone?cc.br:'transparent'}"
            onclick="event.stopPropagation();_plCheck('${item.id}',${item.pts||0})">${chkSvg}</div>`
        :''}
      <div class="pl-edit-ico"
           onclick="event.stopPropagation();_plEditPop('${item.id}','${item.type}','${item.time}',${item.dur},'${item.label.replace(/'/g,"\\'")}')">
        ✏️
      </div>
    `;

    _plDrag(blk,item.id,item.type);
    grid.appendChild(blk);
  });
}

/* ════════ DAY BAR ════════ */
function _plBar(){
  const bar=document.getElementById('pl-day-bar');if(!bar)return;
  const ds=_plDate.toDateString(),isT=ds===new Date().toDateString();
  const tasks=_plGetTasks(getDayType(_plDate));
  const done=isT?S.done:(_plHistDone(ds)||{});
  const dN=tasks.filter(t=>done[t.id]).length;
  const pct=tasks.length?Math.round(dN/tasks.length*100):0;
  const col=pct>=80?'var(--green)':pct>=50?'var(--gold)':'var(--red)';
  const noT=tasks.filter(t=>!_plTaskTime(t)).length;
  bar.innerHTML=`
    <span style="font-weight:800;color:${col}">${pct}%</span>
    <span style="color:var(--txt3)">${dN}/${tasks.length} משימות</span>
    ${noT?`<span style="font-size:10px;color:var(--txt3);background:var(--sf2);
      border:1px solid var(--brd);border-radius:99px;padding:1px 8px">${noT} ללא שעה</span>`:''}
    <button onclick="_plGcal()"
      style="font-size:10px;font-weight:700;color:var(--blue);padding:2px 9px;
             background:var(--blue3);border:1px solid rgba(91,141,248,.3);
             border-radius:99px;cursor:pointer;margin-right:auto">📅 Google</button>
  `;
}

/* ════════ DRAG & DROP ════════ */
function _plDrag(el,id,type){
  let sY,sTop,t0,hasMoved;
  const begin=y=>{sY=y;sTop=parseInt(el.style.top)||0;t0=Date.now();hasMoved=false;_plDragging=id;};
  const move=y=>{
    if(_plDragging!==id)return;
    if(Math.abs(y-sY)>5){hasMoved=true;el.classList.add('dragging');}
    if(hasMoved)el.style.top=Math.max(0,sTop+(y-sY))+'px';
  };
  const end=y=>{
    if(_plDragging!==id)return;
    const realMoved=hasMoved&&Math.abs(y-sY)>10&&(Date.now()-t0)>200;
    el.classList.remove('dragging');
    _plDragging=null;
    if(!realMoved)return;
    const nt=_plPxToTime(Math.max(0,sTop+(y-sY)));
    if(type==='task'){
      if(!S.plannerTimeOverrides)S.plannerTimeOverrides={};
      S.plannerTimeOverrides[id]=nt;
      if(typeof save==='function')save();
      if(typeof toast==='function')toast('🕐 שעה עודכנה ל-'+nt);
    }else{
      const evs=_plCustEvs(_plDate.toDateString());
      const ev=evs.find(e=>e.id===id);
      if(ev){ev.time=nt;_plSaveEvs(_plDate.toDateString(),evs);}
    }
    _plBlocks();_plBar();
  };
  el.addEventListener('mousedown',e=>{
    if(e.target.closest('.pl-chk,.pl-edit-ico,button'))return;
    e.preventDefault();begin(e.clientY);
    const mm=ev=>move(ev.clientY);
    const mu=ev=>{end(ev.clientY);document.removeEventListener('mousemove',mm);document.removeEventListener('mouseup',mu);};
    document.addEventListener('mousemove',mm);document.addEventListener('mouseup',mu);
  });
  el.addEventListener('touchstart',e=>{
    if(e.target.closest('.pl-chk,.pl-edit-ico,button'))return;
    begin(e.touches[0].clientY);
  },{passive:true});
  el.addEventListener('touchmove',e=>{move(e.touches[0].clientY);e.preventDefault();},{passive:false});
  el.addEventListener('touchend',e=>{end(e.changedTouches[0].clientY);});
}

/* ════════ MARK DONE ════════ */
function _plCheck(id,pts){
  if(typeof toggleTask==='function'){
    toggleTask(id,pts);
    setTimeout(()=>{_plBlocks();_plBar();},80);
  }
}

/* ════════ SLOT CLICK (הוספת אירוע חדש) ════════ */
function _plSlotClick(time){if(!_plDragging)_plNewEvPop(time);}

/* ════════ POPUP: EDIT BLOCK ════════ */
function _plEditPop(id,type,curTime,curDur,curLabel){
  _plOpenModal(`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <div style="font-size:15px;font-weight:900;color:var(--txt)">✏️ עריכת ${type==='task'?'משימה':'אירוע'}</div>
      <button onclick="_plCloseModal()" style="width:28px;height:28px;border-radius:50%;
        background:var(--bg3);border:1px solid var(--brd2);color:var(--txt2);cursor:pointer">&#x2715;</button>
    </div>

    <div style="font-size:11px;font-weight:700;color:var(--txt2);background:var(--surface);
      border:1px solid var(--brd);border-radius:8px;padding:10px 12px;margin-bottom:14px;
      line-height:1.5">${curLabel}</div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
      <div>
        <div style="font-size:10px;font-weight:800;color:var(--txt3);text-transform:uppercase;
          letter-spacing:.6px;margin-bottom:4px">שעת התחלה</div>
        <input type="time" id="pl-e-time" value="${curTime}"
          style="width:100%;background:var(--bg3);border:1px solid var(--brd2);border-radius:10px;
                 color:var(--txt);font-family:'Heebo',sans-serif;font-size:13px;
                 padding:9px 10px;outline:none;box-sizing:border-box">
      </div>
      <div>
        <div style="font-size:10px;font-weight:800;color:var(--txt3);text-transform:uppercase;
          letter-spacing:.6px;margin-bottom:4px">משך (דקות)</div>
        <input type="number" id="pl-e-dur" value="${curDur}" min="5" max="480" step="5"
          style="width:100%;background:var(--bg3);border:1px solid var(--brd2);border-radius:10px;
                 color:var(--txt);font-family:'Heebo',sans-serif;font-size:13px;
                 padding:9px 10px;outline:none;box-sizing:border-box"
          placeholder="דקות">
      </div>
    </div>

    <button onclick="_plSaveEdit('${id}','${type}')"
      style="width:100%;padding:13px;background:linear-gradient(135deg,var(--teal),var(--blue));
             color:#fff;border:none;border-radius:var(--r-sm);font-size:13px;font-weight:900;
             cursor:pointer;font-family:'Heebo',sans-serif;margin-bottom:8px">שמור שינויים ✓</button>

    ${type==='task'?`<button onclick="_plResetTime('${id}')"
      style="width:100%;padding:10px;background:var(--sf2);border:1px solid var(--brd2);
             border-radius:var(--r-sm);font-size:12px;font-weight:700;color:var(--txt3);
             cursor:pointer;font-family:'Heebo',sans-serif">↩ אפס לשעה המקורית</button>`:''}
  `);
}

function _plSaveEdit(id,type){
  const time=document.getElementById('pl-e-time')?.value;
  const dur=parseInt(document.getElementById('pl-e-dur')?.value)||30;
  if(!time)return;

  if(type==='task'){
    if(!S.plannerTimeOverrides)S.plannerTimeOverrides={};
    S.plannerTimeOverrides[id]=time;
    if(!S.plannerDurOverrides)S.plannerDurOverrides={};
    S.plannerDurOverrides[id]=dur;
    if(typeof save==='function')save();
  }else{
    const ds=_plDate.toDateString();
    const evs=_plCustEvs(ds);
    const ev=evs.find(e=>e.id===id);
    if(ev){ev.time=time;ev.duration=dur;_plSaveEvs(ds,evs);}
  }
  _plCloseModal();
  _plBlocks();_plBar();
  if(typeof toast==='function')toast('✅ שמור!');
}

function _plResetTime(id){
  if(S.plannerTimeOverrides)delete S.plannerTimeOverrides[id];
  if(S.plannerDurOverrides) delete S.plannerDurOverrides[id];
  if(typeof save==='function')save();
  _plCloseModal();_plBlocks();_plBar();
  if(typeof toast==='function')toast('↩ אופס לשעה המקורית');
}

/* ════════ POPUP: NEW CUSTOM EVENT ════════ */
function _plNewEvPop(time){
  const now=new Date();
  const dft=time||`${String(now.getHours()).padStart(2,'0')}:00`;
  _plOpenModal(`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <div style="font-size:15px;font-weight:900;color:var(--txt)">&#x2795; אירוע חדש</div>
      <button onclick="_plCloseModal()" style="width:28px;height:28px;border-radius:50%;
        background:var(--bg3);border:1px solid var(--brd2);color:var(--txt2);cursor:pointer">&#x2715;</button>
    </div>
    <div style="font-size:10px;font-weight:800;color:var(--txt3);text-transform:uppercase;
      letter-spacing:.6px;margin-bottom:4px">שם האירוע</div>
    <input id="pl-nt" placeholder="פגישה, שיעור, ביקור..."
      style="width:100%;background:var(--bg3);border:1px solid var(--brd2);border-radius:10px;
             color:var(--txt);font-family:'Heebo',sans-serif;font-size:13px;
             padding:10px 13px;outline:none;box-sizing:border-box;margin-bottom:12px"
      onfocus="this.style.borderColor='var(--blue)'"
      onblur="this.style.borderColor='var(--brd2)'"
      onkeydown="if(event.key==='Enter')_plSaveNewEv()">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
      <div>
        <div style="font-size:10px;font-weight:800;color:var(--txt3);text-transform:uppercase;
          letter-spacing:.6px;margin-bottom:4px">שעת התחלה</div>
        <input type="time" id="pl-ntime" value="${dft}"
          style="width:100%;background:var(--bg3);border:1px solid var(--brd2);border-radius:10px;
                 color:var(--txt);font-family:'Heebo',sans-serif;font-size:13px;
                 padding:9px 10px;outline:none;box-sizing:border-box">
      </div>
      <div>
        <div style="font-size:10px;font-weight:800;color:var(--txt3);text-transform:uppercase;
          letter-spacing:.6px;margin-bottom:4px">משך</div>
        <input type="number" id="pl-ndur" value="30" min="5" max="480" step="5"
          style="width:100%;background:var(--bg3);border:1px solid var(--brd2);border-radius:10px;
                 color:var(--txt);font-family:'Heebo',sans-serif;font-size:13px;
                 padding:9px 10px;outline:none;box-sizing:border-box"
          placeholder="דקות">
      </div>
    </div>
    <button onclick="_plSaveNewEv()"
      style="width:100%;padding:13px;background:linear-gradient(135deg,var(--blue),var(--purple));
             color:#fff;border:none;border-radius:var(--r-sm);font-size:13px;font-weight:900;
             cursor:pointer;font-family:'Heebo',sans-serif">שמור &#x2713;</button>
  `);
  setTimeout(()=>document.getElementById('pl-nt')?.focus(),80);
}

function _plSaveNewEv(){
  const title=(document.getElementById('pl-nt')?.value||'').trim();
  const time=document.getElementById('pl-ntime')?.value||'09:00';
  const dur=parseInt(document.getElementById('pl-ndur')?.value)||30;
  if(!title){if(typeof toast==='function')toast('כתוב שם לאירוע');return;}
  const ds=_plDate.toDateString(),evs=_plCustEvs(ds);
  evs.push({id:'plev_'+Date.now(),title,time,duration:dur,date:ds});
  _plSaveEvs(ds,evs);
  _plCloseModal();_plBlocks();_plBar();
  if(typeof toast==='function')toast('✅ אירוע נוסף!');
}

function _plDelCust(id){
  const ds=_plDate.toDateString();
  _plSaveEvs(ds,_plCustEvs(ds).filter(e=>e.id!==id));
  _plBlocks();
  if(typeof toast==='function')toast('🗑️ נמחק');
}

/* ════════ MODAL HELPERS ════════ */
function _plOpenModal(html){
  if(document.getElementById('pl-modal-bg'))return;
  const bg=document.createElement('div');
  bg.id='pl-modal-bg';bg.className='pl-modal-bg';
  bg.onclick=e=>{if(e.target===bg)_plCloseModal();};
  bg.innerHTML=`<div class="pl-modal-box">${html}</div>`;
  document.body.appendChild(bg);
}
function _plCloseModal(){
  document.getElementById('pl-modal-bg')?.remove();
}

/* ════════ SCROLL TO NOW ════════ */
function _plScrollNow(){
  const body=document.getElementById('pl-body');if(!body)return;
  const now=new Date(),isT=_plDate.toDateString()===now.toDateString();
  setTimeout(()=>{body.scrollTop=Math.max(0,_plPx(isT?now.getHours():7)-100);},120);
}

/* ════════ GOOGLE CALENDAR ════════ */
function _plGcal(){
  if(typeof cjExportDay==='function')cjExportDay(_plDate.toDateString());
  else if(typeof _showGcalSyncModal==='function')_showGcalSyncModal();
}

/* ════════ HELPERS ════════ */

function _plPx(h){return Math.round((h-PL_START_HOUR)*PL_HOUR_H);}
function _plH(t){
  if(!t)return PL_START_HOUR;
  const[h,m]=t.split(':').map(Number);
  /* שעות 00-03 = אחרי חצות = 24-27 בציר שלנו */
  const hAdj=(h>=0&&h<PL_START_HOUR)?h+24:h;
  return hAdj+m/60;
}
function _plMin(t){if(!t)return PL_START_HOUR*60;const[h,m]=t.split(':').map(Number);return h*60+m;}
function _plPxToTime(px){
  const mins=Math.round(px/PL_SLOT_H*30/15)*15+PL_START_HOUR*60;
  const hRaw=Math.max(PL_START_HOUR,Math.min(PL_END_HOUR-1,Math.floor(mins/60)));
  const h=hRaw>=24?hRaw-24:hRaw;
  return `${String(h).padStart(2,'0')}:${String(mins%60).padStart(2,'0')}`;
}

/* קבל משימות לפי יום — כמו דף היום (שלב אישי לכל משימה) */
function _plGetTasks(dayType){
  let tasks=[];
  /* getTasksWithIndivLevel מחזיר כל משימה ב-level האישי שלה */
  if(typeof getTasksWithIndivLevel==='function'){
    tasks=getTasksWithIndivLevel(S.level);
  }else if(typeof getTasks==='function'){
    tasks=getTasks(S.level);
  }
  return tasks.filter(t=>(t.days||['weekday']).includes(dayType));
}

/* שעת משימה:
   1) אוברריד ידני (גרירה/עריכה)
   2) חילוץ מטקסט — זה מה שמוצג בדף היום (כל שלב מכיל שעה אחרת בטקסט)
   3) t.time מה-data — גיבוי אם אין שעה בטקסט */
function _plTaskTime(t){
  if(S.plannerTimeOverrides&&S.plannerTimeOverrides[t.id])
    return S.plannerTimeOverrides[t.id];

  /* חלץ מהטקסט — כולל 'until' כי "עד 9:00" פירושו השעה הרלוונטית */
  if(t.text){
    if(typeof extractStartTimeFromText==='function'){
      const ex=extractStartTimeFromText(t.text);
      if(ex&&ex.time)return ex.time;
    }
    /* regex גיבוי — כל תבנית HH:MM בטקסט */
    const m=t.text.match(/\b(\d{1,2}):(\d{2})\b/);
    if(m){
      const h=parseInt(m[1]),mn=parseInt(m[2]);
      if(h>=0&&h<=23&&mn>=0&&mn<=59)
        return `${String(h).padStart(2,'0')}:${String(mn).padStart(2,'0')}`;
    }
  }

  /* גיבוי — t.time מ-data_tasks */
  return t.time||null;
}

/* טקסט משימה — כולל taskAdvancedDisplay (כמו דף היום) */
function _plTaskText(t){
  const bid=typeof _baseId==='function'?_baseId(t.id):t.id.replace(/_\d+$/,'');
  const chosenLvl=S.taskAdvancedDisplay&&S.taskAdvancedDisplay[bid];
  if(chosenLvl&&typeof getDayType==='function'){
    const dt=getDayType(_plDate);
    const alts=typeof getTasksForDay==='function'?getTasksForDay(chosenLvl,dt):[];
    const alt=alts.find(x=>(typeof _baseId==='function'?_baseId(x.id):x.id.replace(/_\d+$/,''))===bid);
    if(alt)return alt.text;
  }
  return t.text;
}

/* משך משימה (עם אוברריד) */
function _plTaskDur(t){
  /* אוורריד ידני מעריכה */
  if(S.plannerDurOverrides&&S.plannerDurOverrides[t.id])
    return S.plannerDurOverrides[t.id];

  /* טווח שעות "HH:MM-HH:MM" */
  if(typeof extractStartTimeFromText==='function'&&t.text){
    const ex=extractStartTimeFromText(t.text);
    if(ex&&ex.type==='range'&&ex.endTime){
      const d=_plMin(ex.endTime)-_plMin(ex.time);
      if(d>0)return Math.min(d,PL_MAX_DUR);
    }
  }
  /* "X דקות" בטקסט */
  const dm=(t.text||'').match(/(\d{1,3})\s*דק/);
  if(dm)return Math.min(parseInt(dm[1]),PL_MAX_DUR);
  /* "X שעות" בטקסט */
  const hm=(t.text||'').match(/(\d{1,2}(?:\.\d)?)\s*שעות?/);
  if(hm)return Math.min(Math.round(parseFloat(hm[1])*60),PL_MAX_DUR);
  return PL_DEF_DUR;
}

function _plHistDone(ds){return((S.history||[]).find(h=>h.date===ds)||{}).doneTasks||null;}

/* ── אירועים מותאמים ── */
const PL_EVSK='aliyah_planner_v2';
function _plAllEvs(){try{return JSON.parse(localStorage.getItem(PL_EVSK)||'{}');}catch{return{};}}
function _plCustEvs(ds){return _plAllEvs()[ds]||[];}
function _plSaveEvs(ds,evs){const a=_plAllEvs();if(evs.length)a[ds]=evs;else delete a[ds];localStorage.setItem(PL_EVSK,JSON.stringify(a));}

/* ── patch renderActive ── */
(function(){
  let n=0;
  const iv=setInterval(()=>{
    n++;
    if(typeof window.renderActive==='function'&&!window._plRA3){
      clearInterval(iv);window._plRA3=true;
      const orig=window.renderActive;
      window.renderActive=function(){
        orig.apply(this,arguments);
        if(typeof activePage!=='undefined'&&activePage==='journal'){_plBlocks();_plBar();}
      };
    }
    if(n>150)clearInterval(iv);
  },100);
})();
