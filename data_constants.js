/* ══ קבועים: קטגוריות, צבעים, slots ══ */

const CATS={zman:'⏱ זמנים',briut:'💧 בריאות',achila:'🍎 אכילה',limud:'📖 לימוד',bayit:'🏠 בית',smart:'📵 סמארטפון',shabbat:'✡️ שבת',erev:'🕯️ ערב שבת'};
const CAT_COLORS={zman:'var(--blue)',briut:'var(--green)',achila:'#f07840',limud:'var(--purple)',bayit:'var(--gold)',smart:'var(--red)',shabbat:'var(--purple)',erev:'var(--teal)'};
const CAT_COLORS_HEX={zman:'#5b8df8',briut:'#38d68a',achila:'#f07840',limud:'#9b7ef8',bayit:'#f0c040',smart:'#f05050',shabbat:'#9b7ef8',erev:'#2dd4bf'};
// DAY_TYPES: which days a task applies to
const DAY_WEEKDAY='weekday', DAY_FRIDAY='friday', DAY_SHABBAT='shabbat';
const SLOTS=[
  {label:'06:00–10:00',title:'עבודת הבוקר',icon:'🌅',notifHour:5,notifMin:50},
  {label:'10:00–14:00',title:'עשייה ובניין',icon:'⚡',notifHour:9,notifMin:50},
  {label:'14:00–18:00',title:'עומק ולימוד',icon:'📖',notifHour:13,notifMin:50},
  {label:'18:00–22:00',title:'ערב ומנוחה',icon:'🌙',notifHour:17,notifMin:50},
];
const SHABBAT_REMINDER={notifHour:20,notifMin:30};

