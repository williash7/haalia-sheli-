/*
 * ══════════════════════════════════════════════════════
 *  data.js — קובץ כניסה ראשי
 *  מייבא את כל מודולי הנתונים לפי סדר.
 *  אין צורך לשנות קובץ זה — רק להוסיף/להסיר sub-files.
 * ══════════════════════════════════════════════════════
 *
 *  סדר הטעינה חשוב:
 *   1. data_constants.js      — קבועים (CATS, SLOTS, DAY_TYPES...)
 *   2. data_functions.js      — פונקציות עזר (lerp, streak, bonus...)
 *   3. data_tasks.js          — _getDefaultTasks (כל טקסטי המשימות)
 *   4. data_task_routing.js   — getTasks / getDayType / domainProgress
 *   5. data_task_info.js      — TASK_INFO + getTaskStepDesc
 *   6. data_task_info_ui.js   — showTaskInfo / openTaskInfoEdit / save
 *   7. data_stats.js          — buildCatStats
 *   8. data_rewards.js        — REWARDS (קטלוג הפרסים)
 */

/* בדוגמה של HTML רגיל — החלף את שורת ה-data.js הקיימת ב-8 שורות אלה: */

/*
  <script src="data_constants.js"></script>
  <script src="data_functions.js"></script>
  <script src="data_tasks.js"></script>
  <script src="data_task_routing.js"></script>
  <script src="data_task_info.js"></script>
  <script src="data_task_info_ui.js"></script>
  <script src="data_stats.js"></script>
  <script src="data_rewards.js"></script>
*/
