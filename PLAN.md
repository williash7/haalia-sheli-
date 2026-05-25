# תכנית עבודה — העלייה שלי
עדכון אחרון: 2026-05-25

---

## 🎯 החזון

**"בכל רגע נתון — יודע בדיוק מה המשימה הבאה, מה לעשות, מתי, ולמה."**

עקרונות:
- **לוח הזמנים = הדף הראשי** — הכל מסביבו
- **כמה שפחות רעש ויזואלי** — בלי להסיר פונקציות
- **"מה עכשיו" תמיד גלוי** — כרטיס בראש הדף
- **Google Calendar** — ייבוא אירועים לציר הזמן (read-only)

---

## 📁 מצב הקוד (עדכני)

| קובץ | תיאור | מצב |
|------|--------|------|
| `index.html` | כל ה-HTML | ✅ |
| `app.js` | לוגיקה ראשית | ✅ |
| `planner.js` | לוח זמנים חזותי | ✅ תוקן — מרנדר ב-`pg-planner-wrap` בתוך pg-today |
| `data_tasks.js` | הגדרת משימות ב-15 שלבים | ✅ |
| `data_constants.js` | קבועים | ✅ |
| `data_functions.js` | פונקציות עזר | ✅ |
| `data_task_info.js` / `data_task_info_ui.js` | מידע הסברי | ✅ |
| `data_stats.js` | סטטיסטיקות | ✅ |
| `data_rewards.js` | פרסים | ✅ |
| `data_task_routing.js` | ניתוב משימות | ✅ |
| `feature-a-level-times.js` | שעות לפי שלב | ✅ |
| `feature-b-c-planner-sync.js` | סינכרון planner↔today | ✅ |
| `subtasks.js` | תת-משימות | ✅ |
| `boost-day.js` | יום בוסט | ✅ |
| `firebase-config.js` | Firebase auth + Firestore | ✅ |
| `style.css` | עיצוב | ✅ |
| ~~`ai-schedule.js`~~ | נמחק | 🗑️ |
| ~~`calendar-journal.js`~~ | נמחק | 🗑️ |

---

## 🗺️ מסכים קיימים

**ניווט תחתון:** היום | משימות | פרסים | מעקב
**מגירה:** מסלול | הגדרות

---

## 🏗️ ארכיטקטורה — מה שבוצע

### דף "היום" הנוכחי (אחרי הרידיזיין)

```
┌─────────────────────────────────────────┐
│  [header קיים: כותרת + תאריך + שעה]     │
│  [פס התקדמות לשלב הבא]                  │
├─────────────────────────────────────────┤
│  🔥 12  •  💰 340  •  73% היום  [⚡ יום]│  ← mini-stats + popup button ✅
├─────────────────────────────────────────┤
│  ▷ הבא: קימה ותפילה                     │  ← כרטיס "מה עכשיו" ✅
│  07:00 · 30 דק'   בעוד 18 דק'    [✓]   │
├─────────────────────────────────────────┤
│  [shabbat-mode-wrap אם צריך]            │
│  [focus-day-active-wrap אם צריך]        │
│  [boost-day-active-wrap אם צריך]        │
├─────────────────────────────────────────┤
│  [מצב מיקוד]  [הסתר שעברו] [הסתר הושלמו]│  ← ✅ (ללא כפתורי slot/time/cat)
│  [רשימת משימות — accordion תמיד גלוי]   │  ← ✅ אין "התחל יום"
├─────────────────────────────────────────┤
│  ─────── לוח זמנים יומי ──────────      │  ← planner embedded ✅
│  [ציר שעות עם בלוקי משימות]             │
│  [כפתור 📅 Google — stub לעכשיו]        │
└─────────────────────────────────────────┘
```

### ⚠️ בעיה ידועה שנותרה — כפילות משימות
המשימות מוצגות **פעמיים**: פעם ב-accordion ופעם בlוח הזמנים.
- הlוח מציג משימות **עם שעה**
- ה-accordion מציג **כל** המשימות
- זה רעש ויזואלי, אבל לא באג — שניהם מסונכרנים (סימון בכל אחד מעדכן את השני)
- **תוכנן לתיקון** — ראה שלב הבא

---

## 🚦 סטטוס ביצוע

### ✅ בוצע
| commit | מה נעשה |
|--------|---------|
| `f0acc50` | הסרת chat, journal, כל קוד AI — ניקוי 2,700 שורות |
| `05375a2` | תיקון planner: מרנדר ב-pg-today, תיקון `_plGcal()` |
| `789da8b` | רידיזיין today: mini-stats, כרטיס "מה עכשיו", כפתור "⚡ יום", הסרת "התחל יום" |
| `a8533d1` | תיקון getAppNow is not defined בapp.js |
| `c89734b` | Google Calendar: fetch + הצגת אירועים כבלוקים אפורים בציר הזמן |

### 🔲 עדיין לביצוע

#### ✅ הסרת כפילות (accordion + planner) — בוצע
- accordion מציג רק משימות ללא שעה
- planner מציג רק משימות עם שעה
- הצגת "X משימות עם שעה — ראה לוח הזמנים למטה"

#### ✅ שלב 4 — Google Calendar (read-only) — בוצע
- ✅ scope `calendar.readonly` + Firebase signInWithPopup
- ✅ `_fetchGcalEvents(date)` — קורא Calendar API v3, cache לפי תאריך
- ✅ בלוקים אפורים על הציר (`.pl-blk-gcal`)
- ✅ `_plGcal()` — modal חיבור / ניתוק

#### ✅ שלב 5 — חלון פנוי — בוצע
- כשלא בתוך משימה: "⏳ X דק' חופשיות עכשיו"
- כשבתוך משימה: "נותרו X דק' למשימה"

---

## 🔧 הערות טכניות

### planner.js — מצב נוכחי
- `plRender()` מחובר ל-`renderToday` (מתעדכן אוטומטית)
- מרנדר לתוך `#pg-planner-wrap` בתוך `#pg-today`
- `_plGcal()` — modal חיבור/ניתוק Google Calendar
- כשמשימה מסומנת → `renderActive` → `_plBlocks()` מתעדכן
- ציר שעות: 04:00–28:00 (4 בבוקר עד 4 לאחר חצות)
- גרירה לשינוי שעה שמורה ב-`S.plannerTimeOverrides[dateStr][taskId]`

### renderWhatNow() — איך עובד
נמצאת ב-app.js, קוראת `_getTaskTime(t)` ו-`_getTaskDur(t)`:
1. מביאה את כל משימות היום לא-מסומנות עם שעה
2. מחפשת משימה פעילה (start ≤ now < start+dur)
3. אם אין — מחפשת הבאה בזמן
4. מרנדרת כרטיס עם כפתור ✓ ישיר (`toggleTask()`)

### openDayModifiers() — כפתור "⚡ יום"
Popup קטן עם 3 כפתורים:
- 🛡️ יום חסד → `useGrace()`
- ⚡ יום בוסט → `openBoostDayModal()`
- 🎯 יום עשייה → `openFocusDayModal()`

### Firebase Auth — הוספת Calendar scope (לשלב 4)
```js
provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
// result.credential.accessToken = token לשמור ב-localStorage
```

### Google Calendar API (לשלב 4)
```
GET https://www.googleapis.com/calendar/v3/calendars/primary/events
  ?timeMin=...&timeMax=...&singleEvents=true&orderBy=startTime
Authorization: Bearer {accessToken}
```

---

## ❓ החלטות שנקבעו

| שאלה | תשובה |
|------|--------|
| הplanner = דף ראשי? | ✅ embedded בתוך "היום" |
| לצמצם או למחוק? | צמצום — כל פונקציה נשארת |
| Google Calendar — קריאה בלבד? | ✅ בוצע — בלוקים אפורים על הציר |
| chat + journal? | ✅ נמחקו לצמיתות |
| כפילות accordion + planner? | ⏳ לפתור בשלב הבא |
