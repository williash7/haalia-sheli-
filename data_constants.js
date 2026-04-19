/* ══ קבועים: קטגוריות, צבעים, slots ══ */
const CATS={zman:'⏱ זמנים',boker:'🌅 בוקר',briut:'💧 בריאות',achila:'🍎 אכילה',limud:'📖 לימוד',shlichut:'💼 שליחות',bayit:'🏠 בית',smart:'📵 סמארטפון',shabbat:'✡️ שבת',erev:'🕯️ ערב שבת'};

const CAT_COLORS={zman:'var(--blue)',boker:'#ff9800',briut:'var(--green)',achila:'#f07840',limud:'var(--purple)',shlichut:'#00bcd4',bayit:'var(--gold)',smart:'var(--red)',shabbat:'var(--purple)',erev:'var(--teal)'};

const CAT_COLORS_HEX={zman:'#5b8df8',boker:'#ff9800',briut:'#38d68a',achila:'#f07840',limud:'#9b7ef8',shlichut:'#00bcd4',bayit:'#f0c040',smart:'#f05050',shabbat:'#9b7ef8',erev:'#2dd4bf'};

// DAY_TYPES: which days a task applies to
const DAY_WEEKDAY='weekday', DAY_FRIDAY='friday', DAY_SHABBAT='shabbat';

const SLOTS=[
  {label:'כל היום',title:'משימות כלליות',icon:'📌',notifHour:8,notifMin:0},
  {label:'04:45–11:00',title:'משימות הבוקר',icon:'🌅',notifHour:4,notifMin:45},
  {label:'11:00–18:00',title:'משימות הצהריים',icon:'☀️',notifHour:11,notifMin:0},
  {label:'18:00–22:45',title:'משימות הערב והלילה',icon:'🌙',notifHour:18,notifMin:0},
];

const SHABBAT_REMINDER={notifHour:20,notifMin:30};

