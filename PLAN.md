# תכנית עבודה — העלייה שלי
עדכון אחרון: 2026-05-25

---

## 🎯 החזון

**"בכל רגע נתון — יודע בדיוק מה המשימה הבאה, מה לעשות, מתי, ולמה."**

עקרונות:
- **לוח הזמנים = הדף הראשי** — הכל מסביבו
- **כמה שפחות רעש ויזואלי** — בלי להסיר פונקציות
- **"מה עכשיו" תמיד גלוי** — כרטיס sticky בראש
- **Google Calendar** — ייבוא אירועים לציר הזמן (read-only)

---

## 📁 מצב הקוד

### קבצים קיימים
| קובץ | תיאור | מצב |
|------|--------|------|
| `index.html` | כל ה-HTML | ✅ תקין אחרי ניקוי |
| `app.js` | לוגיקה ראשית (~4300 שורות) | ✅ תקין |
| `planner.js` | לוח זמנים חזותי (723 שורות) | ⚠️ שבור — מרנדר ל-`pg-journal` שנמחק |
| `data_tasks.js` | הגדרת משימות ב-15 שלבים | ✅ |
| `data_constants.js` | קבועים | ✅ |
| `data_functions.js` | פונקציות עזר | ✅ |
| `data_task_info.js` / `data_task_info_ui.js` | מידע הסברי | ✅ |
| `data_stats.js` | סטטיסטיקות | ✅ |
| `data_rewards.js` | פרסים | ✅ |
| `data_task_routing.js` | ניתוב משימות | ✅ |
| `feature-a-level-times.js` | שעות לפי שלב (162 שורות) | ✅ |
| `feature-b-c-planner-sync.js` | סינכרון planner↔today (270 שורות) | ✅ |
| `subtasks.js` | תת-משימות (752 שורות) | ✅ |
| `boost-day.js` | יום בוסט (297 שורות) | ✅ |
| `firebase-config.js` | Firebase | ✅ |
| `style.css` | עיצוב | ✅ |

### קבצים שנמחקו (unstaged — ממתינים ל-commit)
- `ai-schedule.js` (614 שורות) — AI schedule
- `calendar-journal.js` (856 שורות) — יומן + Google Calendar export

### שינויים unstaged (ממתינים ל-commit)
- הסרת דף `chat` (עוזר AI) מ-HTML ו-app.js
- הסרת דף `journal` מ-HTML ו-app.js
- הסרת כל קוד Anthropic AI מ-app.js (~758 שורות)

---

## 🗺️ מסכים קיימים (אחרי הניקוי)

**ניווט תחתון:** היום | משימות | פרסים | מעקב
**מגירה:** מסלול | הגדרות

### ⚠️ שבור כרגע
1. `planner.js` — מנסה `document.getElementById('pg-journal')` שנמחק
2. `_plGcal()` — קורא ל-`cjExportDay` ו-`_showGcalSyncModal` שלא קיימות

---

## 🏗️ ארכיטקטורה מוצעת

### דף "היום" החדש — המסך הראשי

```
┌─────────────────────────────────┐
│  הכותרת הנוכחית (header)        │  ← נשאיר, אולי נמעיט
├─────────────────────────────────┤
│  📊 מיני-סטטס (שורה אחת)       │  ← במקום 3 קארדים גדולים
│  🔥 רצף 12  •  💰 340  •  73%  │
├─────────────────────────────────┤
│  🎯 מה עכשיו  [sticky]          │  ← NEW — כרטיס "מה עכשיו"
│  ─────────────────────────────  │
│  קימה ותפילה · עד 07:30         │
│  [✓ סמן]          בעוד 18 דק'  │
├─────────────────────────────────┤
│  ─── לוח זמנים יומי ──────────  │  ← הplanner embedded כאן
│  06:00 │ [קימה 06:15 ████]       │
│  07:00 │ [תפילה 07:00 ██████]    │
│  08:00 │ [פגישה גוגל ████]  ← GCal
│  09:00 │ [לימוד 09:00 ████████]  │
│  10:00 │ [חופשי ·············]   │
│  ...                             │
└─────────────────────────────────┘
```

**מה נשאר, מה משתנה:**

| אלמנט נוכחי | גורל |
|-------------|------|
| 3 כרטיסי סטטס (היום/בנק/רצף) | → שורה אחת קטנה |
| עיגול (ring) עם % | → מספר בתוך מיני-סטטס |
| כפתור "התחל יום" | → **מוסר** — הציר תמיד גלוי |
| פס התקדמות לשלב הבא | → נשאר (כבר קיים ב-header) |
| badges: חסד / בוסט / עשייה | → **מקובצים** לכפתור אחד "⚙️ יום" שפותח popup קטן |
| מצב מיקוד (focus mode) | → נשאר, אבל בתוך הציר עצמו |
| 3 כפתורי תצוגה (slot/time/cat) | → **מוסרים** — בציר יש רק תצוגת זמן |
| כפתורי "הסתר שעברו/הושלמו" | → נשאר אבל מקומפקט |
| Slots accordion (בוקר/עשייה/לימוד/ערב) | → **מוחלף** בציר הזמן של הplanner |

### מסכים אחרים — מה משתנה

**משימות (mastery)** — נשאר כמעט כמו שהוא, רק UI קצת יותר נקי

**פרסים (rewards)** — נשאר כמו שהוא

**מעקב (cal)** — נשאר כמו שהוא

**הגדרות** — נשאר, אולי ניקוי קל

---

## 📋 שלבי יישום

### שלב 0 — commit הניקוי הנוכחי
```
git add -A
git commit -m "Remove chat, journal, and AI features"
```
- [ ] לבצע commit לשינויים הnustagged
- [ ] לוודא אין שגיאות JS בקונסול

### שלב 1 — תיקון planner.js (דחוף)
**הבעיה:** planner.js קורא ל-`getElementById('pg-journal')` שנמחק
**הפתרון:** לשנות את planner.js שירנדר לתוך `pg-today` במקום `pg-journal`

צעדים:
- [ ] בplanner.js: שנה `pg-journal` → `pg-today` בפונקציית `plRender`
- [ ] בplanner.js: הסר את ה-patching של `renderJournalPage`, ובמקומו הוסף hook ל-`renderToday`
- [ ] בapp.js: בfunc `nav()` — הוסר קוד שהסתיר/הציג `pg-journal`; ודא שjournal לא נזכר
- [ ] תקן `_plGcal()` — מסיר קריאות מתות, השאר stub ריק לעכשיו

### שלב 2 — עיצוב מחדש של "היום"
**מיני-סטטס:** להחליף את 3 הקארדים הגדולים + הרינג + הבאדג'ים בפרסנטציה קומפקטית

- [ ] **מיני-סטטס** (שורה 1): `🔥 {streak} • 💰 {bank} • {pct}% היום`
- [ ] **כרטיס "מה עכשיו"** — sticky מתחת לheader:
  - חישוב: איזו משימה הכי קרובה לשעה הנוכחית שעוד לא סומנה
  - מציג: שם משימה + שעה + "בעוד X דק'" / "עכשיו"
  - כפתור ✓ לסימון ישיר
- [ ] **כפתור "⚡ יום"** במקום 3 הבאדג'ים — פותח popup עם: יום חסד, יום בוסט, יום עשייה
- [ ] **הסרת "התחל יום"** — הציר מוצג תמיד
- [ ] **הסרת 3 כפתורי תצוגה** (slot/time/cat) — הציר הוא התצוגה

### שלב 3 — Embed הplanner בתוך "היום"
- [ ] להכניס את ה-planner HTML לתוך `pg-today` בindex.html (במקום `pg-journal`)
- [ ] לוודא שה-planner מרנדר נכון בתוך הדף
- [ ] לוודא שסימון משימה בציר מעדכן `S.done` ואת הכרטיס "מה עכשיו"

### שלב 4 — Google Calendar (read-only)
- [ ] הוספת scope `calendar.readonly` לGoogle Auth בFirebase
- [ ] פונקציה `_fetchGcalEvents(date)` — קורא Google Calendar API, מחזיר אירועים
- [ ] הצגת אירועי גוגל בציר: בלוקים אפורים עם שם האירוע
- [ ] חישוב "חלון פנוי" — קטע זמן ללא משימה ו-ללא אירוע גוגל
- [ ] תיקון כפתור `📅 Google` בplanner שיפתח dialog חיבור

---

## 🔧 הערות טכניות

### planner.js — מה עושה
- `plRender()` מוזרק כ-`renderJournalPage` (צריך לשנות ל-renderToday)
- מרנדר ציר שעות מ-04:00 עד 28:00 (4 בבוקר עד 4 לאחר חצות)
- כל משימה = בלוק צבעוני על הציר לפי שעה + משך
- גרירה לשינוי שעה (override מוצפן ב-`S.plannerTimeOverrides[dateStr][taskId]`)
- קו אדום = עכשיו
- `_plGcal()` — שבור, יש לתקן

### "מה עכשיו" — לוגיקת חישוב
```js
function getCurrentOrNextTask() {
  const now = new Date();
  const nowMin = now.getHours()*60 + now.getMinutes();
  const tasks = getTasksForToday(); // tasks with times
  
  // משימה פעילה = שעת התחלה עברה, שעת סיום לא עברה, לא סומנה
  const active = tasks.find(t => {
    const start = timeToMin(t.time);
    const end = start + (t.dur || 30);
    return start <= nowMin && nowMin < end && !S.done[t.id];
  });
  if (active) return { task: active, status: 'now' };
  
  // משימה הבאה = שעת התחלה הכי קרובה בעתיד, לא סומנה
  const next = tasks
    .filter(t => !S.done[t.id] && timeToMin(t.time) > nowMin)
    .sort((a,b) => timeToMin(a.time) - timeToMin(b.time))[0];
  if (next) return { task: next, status: 'next', inMin: timeToMin(next.time) - nowMin };
  
  return null;
}
```

### Firebase Auth — הוספת Calendar scope
Firebase Google Auth צריך scope נוסף:
```js
provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
```
אחרי זה: `result.credential.accessToken` — זה ה-token לGoogle Calendar API.
כדאי לשמור ב-`localStorage` (לא Firebase) כי הוא מתחדש בכל login.

### Google Calendar API
```
GET https://www.googleapis.com/calendar/v3/calendars/primary/events
  ?timeMin=2025-01-01T00:00:00Z
  &timeMax=2025-01-02T00:00:00Z
  &singleEvents=true
  &orderBy=startTime
Authorization: Bearer {accessToken}
```

---

## ❓ שאלות שנענו

| שאלה | תשובה |
|------|--------|
| הplanner = דף ראשי? | ✅ כן — embedded בתוך "היום" |
| לצמצם או למחוק? | צמצום — כל פונקציה נשארת |
| Google Calendar — קריאה בלבד? | ✅ כן בשלב ראשון |
| מה עם chat + journal? | ✅ נמחקו — לא חוזרים |

---

## 🚦 סטטוס נוכחי

- [x] הסרת chat + journal (unstaged — ממתין ל-commit)
- [ ] commit שלב 0
- [ ] תיקון planner (שלב 1)
- [ ] עיצוב מחדש of today (שלב 2)
- [ ] embed planner בtoday (שלב 3)
- [ ] Google Calendar (שלב 4)
