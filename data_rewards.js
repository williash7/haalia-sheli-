/* ══ REWARDS: קטלוג הפרסים ══ */

/* ══════════════ REWARDS ══════════════ */
const REWARDS=[
  {cat:'🛡️  ימי חסד נוספים',items:[
    {id:'grace_buy1',pts:1400,title:'יום חסד נוסף',desc:'מוסיף יום חסד אחד לחודש הנוכחי',emoji:'🛡️',isGrace:true},
    {id:'grace_buy2',pts:2600,title:'שני ימי חסד',desc:'מוסיף שני ימי חסד לחודש הנוכחי',emoji:'🛡️🛡️',isGrace:true},
  ]},
  {cat:'🎬  סדרות עומק',items:[
    // שוגן — 10 פרקים (FX 2024)
    {id:'sh1',pts:140,title:'שוגן — פרק 1',desc:'אנג\'ין מגיע ליפן העתיקה',emoji:'⚔️',_seriesId:'builtin_shogun',_seriesName:'שוגן',_seriesType:'series',_seriesLocked:true,_epNum:1,_epTotal:5},
    {id:'sh2',pts:140,title:'שוגן — פרקים 2–3',desc:'קנוניות בחצר טורנגה',emoji:'⚔️',_seriesId:'builtin_shogun',_seriesName:'שוגן',_seriesType:'series',_seriesLocked:true,_epNum:2,_epTotal:5},
    {id:'sh3',pts:160,title:'שוגן — פרקים 4–5',desc:'אימון, בגידות ובריתות',emoji:'⚔️',_seriesId:'builtin_shogun',_seriesName:'שוגן',_seriesType:'series',_seriesLocked:true,_epNum:3,_epTotal:5},
    {id:'sh4',pts:160,title:'שוגן — פרקים 6–7',desc:'המחיר של נאמנות',emoji:'⚔️',_seriesId:'builtin_shogun',_seriesName:'שוגן',_seriesType:'series',_seriesLocked:true,_epNum:4,_epTotal:5},
    {id:'sh5',pts:200,title:'שוגן — פרקים 8–10',desc:'הפינאלה האפית',emoji:'⚔️',_seriesId:'builtin_shogun',_seriesName:'שוגן',_seriesType:'series',_seriesLocked:true,_epNum:5,_epTotal:5},
    // צ'רנוביל — 5 פרקים (HBO 2019)
    {id:'ch1',pts:180,title:"צ'רנוביל — פרק 1",desc:'הפיצוץ וכאוס הלילה הראשון',emoji:'☢️',_seriesId:'builtin_chernobyl',_seriesName:"צ'רנוביל",_seriesType:'series',_seriesLocked:true,_epNum:1,_epTotal:3},
    {id:'ch2',pts:200,title:"צ'רנוביל — פרקים 2–3",desc:'המחיר האנושי מתגלה',emoji:'☢️',_seriesId:'builtin_chernobyl',_seriesName:"צ'רנוביל",_seriesType:'series',_seriesLocked:true,_epNum:2,_epTotal:3},
    {id:'ch3',pts:220,title:"צ'רנוביל — פרקים 4–5",desc:'האמת יוצאת לאור',emoji:'☢️',_seriesId:'builtin_chernobyl',_seriesName:"צ'רנוביל",_seriesType:'series',_seriesLocked:true,_epNum:3,_epTotal:3},
    // הסמויה — 60 פרקים, 5 עונות (HBO 2002–2008)
    {id:'wi1',pts:180,title:'הסמויה — עונה 1, פרקים 1–5',desc:'המרדף הראשון אחר ברקסדייל',emoji:'🔫',_seriesId:'builtin_wire',_seriesName:'הסמויה',_seriesType:'series',_seriesLocked:true,_epNum:1,_epTotal:6},
    {id:'wi2',pts:200,title:'הסמויה — עונה 1, פרקים 6–13',desc:'הרשת מתהדקת',emoji:'🔫',_seriesId:'builtin_wire',_seriesName:'הסמויה',_seriesType:'series',_seriesLocked:true,_epNum:2,_epTotal:6},
    {id:'wi3',pts:220,title:'הסמויה — עונה 2 (12 פרקים)',desc:'המנמל: עולם מחוץ לפרויקטים',emoji:'🔫',_seriesId:'builtin_wire',_seriesName:'הסמויה',_seriesType:'series',_seriesLocked:true,_epNum:3,_epTotal:6,minLevel:3},
    {id:'wi4',pts:240,title:'הסמויה — עונה 3 (12 פרקים)',desc:'פוליטיקה, רפורמה ועוד',emoji:'🔫',_seriesId:'builtin_wire',_seriesName:'הסמויה',_seriesType:'series',_seriesLocked:true,_epNum:4,_epTotal:6,minLevel:4},
    {id:'wi5',pts:260,title:'הסמויה — עונה 4 (13 פרקים)',desc:'מערכת החינוך — שיא הסדרה',emoji:'🔫',_seriesId:'builtin_wire',_seriesName:'הסמויה',_seriesType:'series',_seriesLocked:true,_epNum:5,_epTotal:6,minLevel:6},
    {id:'wi6',pts:280,title:'הסמויה — עונה 5 (10 פרקים)',desc:'התקשורת ותום עידן',emoji:'🔫',_seriesId:'builtin_wire',_seriesName:'הסמויה',_seriesType:'series',_seriesLocked:true,_epNum:6,_epTotal:6,minLevel:8},
    // יורשים — 39 פרקים, 4 עונות (HBO 2018–2023)
    {id:'su1',pts:160,title:'יורשים — עונה 1, פרקים 1–5',desc:'יום ההולדת שמשנה הכל',emoji:'💼',_seriesId:'builtin_succession',_seriesName:'יורשים',_seriesType:'series',_seriesLocked:true,_epNum:1,_epTotal:6},
    {id:'su2',pts:180,title:'יורשים — עונה 1, פרקים 6–10',desc:'המלחמה על הכס מתחילה',emoji:'💼',_seriesId:'builtin_succession',_seriesName:'יורשים',_seriesType:'series',_seriesLocked:true,_epNum:2,_epTotal:6},
    {id:'su3',pts:200,title:'יורשים — עונה 2 (10 פרקים)',desc:'משחק הכוח מתעמק',emoji:'💼',_seriesId:'builtin_succession',_seriesName:'יורשים',_seriesType:'series',_seriesLocked:true,_epNum:3,_epTotal:6,minLevel:3},
    {id:'su4',pts:220,title:'יורשים — עונה 3 (9 פרקים)',desc:'המשפחה בסכנת פירוק',emoji:'💼',_seriesId:'builtin_succession',_seriesName:'יורשים',_seriesType:'series',_seriesLocked:true,_epNum:4,_epTotal:6,minLevel:4},
    {id:'su5',pts:280,title:'יורשים — עונה 4 (10 פרקים)',desc:'הפינאלה הגדולה של המשפחה',emoji:'💼',_seriesId:'builtin_succession',_seriesName:'יורשים',_seriesType:'series',_seriesLocked:true,_epNum:5,_epTotal:6,minLevel:6},

    // הכתר — 60 פרקים, 6 עונות (Netflix 2016–2023)
    {id:'cr1',pts:160,title:'הכתר — עונה 1 (10 פרקים)',desc:'אליזבת הצעירה עולה לכס',emoji:'👑',_seriesId:'builtin_crown',_seriesName:'הכתר',_seriesType:'series',_seriesLocked:true,_epNum:1,_epTotal:6},
    {id:'cr2',pts:170,title:'הכתר — עונה 2 (10 פרקים)',desc:'משבר סואץ ושנות ה-60',emoji:'👑',_seriesId:'builtin_crown',_seriesName:'הכתר',_seriesType:'series',_seriesLocked:true,_epNum:2,_epTotal:6,minLevel:2},
    {id:'cr3',pts:180,title:'הכתר — עונה 3 (10 פרקים)',desc:'שנות ה-70 — בריטניה בצומת',emoji:'👑',_seriesId:'builtin_crown',_seriesName:'הכתר',_seriesType:'series',_seriesLocked:true,_epNum:3,_epTotal:6,minLevel:3},
    {id:'cr4',pts:190,title:'הכתר — עונה 4 (10 פרקים)',desc:'תאצ\'ר ודיאנה',emoji:'👑',_seriesId:'builtin_crown',_seriesName:'הכתר',_seriesType:'series',_seriesLocked:true,_epNum:4,_epTotal:6,minLevel:4},
    {id:'cr5',pts:200,title:'הכתר — עונות 5–6 (20 פרקים)',desc:'שנות ה-90 ועד היום',emoji:'👑',_seriesId:'builtin_crown',_seriesName:'הכתר',_seriesType:'series',_seriesLocked:true,_epNum:5,_epTotal:6,minLevel:6},
    // הריקוד האחרון — 10 פרקים (Netflix 2020)
    {id:'ld1',pts:150,title:'הריקוד האחרון — פרקים 1–3',desc:'מייקל ג\'ורדן ועלייתו לגדולה',emoji:'🏀',_seriesId:'builtin_lastdance',_seriesName:'הריקוד האחרון',_seriesType:'series',_seriesLocked:true,_epNum:1,_epTotal:3},
    {id:'ld2',pts:160,title:'הריקוד האחרון — פרקים 4–7',desc:'הבולס בשיאם',emoji:'🏀',_seriesId:'builtin_lastdance',_seriesName:'הריקוד האחרון',_seriesType:'series',_seriesLocked:true,_epNum:2,_epTotal:3},
    {id:'ld3',pts:180,title:'הריקוד האחרון — פרקים 8–10',desc:'הסיום האגדי',emoji:'🏀',_seriesId:'builtin_lastdance',_seriesName:'הריקוד האחרון',_seriesType:'series',_seriesLocked:true,_epNum:3,_epTotal:3},
    // אחים לנשק — 10 פרקים (HBO 2001)
    {id:'bb1',pts:160,title:'אחים לנשק — פרקים 1–3',desc:'אימונים ונחיתה בנורמנדי',emoji:'🪖',_seriesId:'builtin_band',_seriesName:'אחים לנשק',_seriesType:'series',_seriesLocked:true,_epNum:1,_epTotal:4},
    {id:'bb2',pts:170,title:'אחים לנשק — פרקים 4–6',desc:'מרקט גארדן ובסטון',emoji:'🪖',_seriesId:'builtin_band',_seriesName:'אחים לנשק',_seriesType:'series',_seriesLocked:true,_epNum:2,_epTotal:4},
    {id:'bb3',pts:180,title:'אחים לנשק — פרקים 7–8',desc:'כניסה לגרמניה',emoji:'🪖',_seriesId:'builtin_band',_seriesName:'אחים לנשק',_seriesType:'series',_seriesLocked:true,_epNum:3,_epTotal:4},
    {id:'bb4',pts:200,title:'אחים לנשק — פרקים 9–10',desc:'ניצחון ופרידה',emoji:'🪖',_seriesId:'builtin_band',_seriesName:'אחים לנשק',_seriesType:'series',_seriesLocked:true,_epNum:4,_epTotal:4},
    // עולם מופלא — 11 פרקים (BBC 2006)
    {id:'pe1',pts:130,title:'עולם מופלא — פרקים 1–4',desc:'קטבים, הרים וג\'ונגל',emoji:'🌍',_seriesId:'builtin_planete',_seriesName:'עולם מופלא',_seriesType:'series',_seriesLocked:true,_epNum:1,_epTotal:3},
    {id:'pe2',pts:140,title:'עולם מופלא — פרקים 5–8',desc:'מדבר, מישורים ועמקים',emoji:'🌍',_seriesId:'builtin_planete',_seriesName:'עולם מופלא',_seriesType:'series',_seriesLocked:true,_epNum:2,_epTotal:3},
    {id:'pe3',pts:150,title:'עולם מופלא — פרקים 9–11',desc:'רדוד ים עמוק',emoji:'🌍',_seriesId:'builtin_planete',_seriesName:'עולם מופלא',_seriesType:'series',_seriesLocked:true,_epNum:3,_epTotal:3},
    // קוסמוס — 13 פרקים (PBS 1980)
    {id:'co1',pts:130,title:'קוסמוס — פרקים 1–4',desc:'חופי האוקיינוס הקוסמי, אבולוציה, שמים',emoji:'🔭',_seriesId:'builtin_cosmos',_seriesName:'קוסמוס',_seriesType:'series',_seriesLocked:true,_epNum:1,_epTotal:4},
    {id:'co2',pts:140,title:'קוסמוס — פרקים 5–7',desc:'מאדים, יופיטר ויוון העתיקה',emoji:'🔭',_seriesId:'builtin_cosmos',_seriesName:'קוסמוס',_seriesType:'series',_seriesLocked:true,_epNum:2,_epTotal:4},
    {id:'co3',pts:150,title:'קוסמוס — פרקים 8–10',desc:'מסע בזמן, מחזור חיי כוכבים, גלקסיות',emoji:'🔭',_seriesId:'builtin_cosmos',_seriesName:'קוסמוס',_seriesType:'series',_seriesLocked:true,_epNum:3,_epTotal:4},
    {id:'co4',pts:160,title:'קוסמוס — פרקים 11–13',desc:'אינטליגנציה, חייזרים, עתיד האנושות',emoji:'🔭',_seriesId:'builtin_cosmos',_seriesName:'קוסמוס',_seriesType:'series',_seriesLocked:true,_epNum:4,_epTotal:4},
  ]},
  {cat:'🎥  קולנוע מופת',items:[
    // 12 המושבעים — 96 דק׳ (1957)
    {id:'m1a',pts:180,emoji:'🎬',title:'12 המושבעים — חצי א׳',desc:'חדר הדיונים: הקול הבודד שמעז לפקפק',_seriesId:'builtin_12angry',_seriesName:'12 המושבעים',_seriesType:'movie',_seriesLocked:true,_epNum:1,_epTotal:2},
    {id:'m1b',pts:200,emoji:'🎬',title:'12 המושבעים — חצי ב׳',desc:'הפסקת הדין — אמת מול לחץ קבוצתי',_seriesId:'builtin_12angry',_seriesName:'12 המושבעים',_seriesType:'movie',_seriesLocked:true,_epNum:2,_epTotal:2},
    // המופע של טרומן — 103 דק׳ (1998)
    {id:'m2a',pts:190,emoji:'🎬',title:'המופע של טרומן — חצי א׳',desc:'החיים המושלמים — חיים אמיתיים?',_seriesId:'builtin_truman',_seriesName:'המופע של טרומן',_seriesType:'movie',_seriesLocked:true,_epNum:1,_epTotal:2},
    {id:'m2b',pts:210,emoji:'🎬',title:'המופע של טרומן — חצי ב׳',desc:'הבריחה הגדולה — מול הקירות שבנו לנו',_seriesId:'builtin_truman',_seriesName:'המופע של טרומן',_seriesType:'movie',_seriesLocked:true,_epNum:2,_epTotal:2},
    // התחלה — 148 דק׳ (2010)
    {id:'m3a',pts:160,emoji:'🎬',title:'התחלה — שכבה 1: המציאות',desc:'קוב, החלום, והמשימה הבלתי אפשרית',_seriesId:'builtin_inception',_seriesName:'התחלה (Inception)',_seriesType:'movie',_seriesLocked:true,_epNum:1,_epTotal:3},
    {id:'m3b',pts:160,emoji:'🎬',title:'התחלה — שכבה 2: החלום',desc:'ירידה לעומק — מלון בחוסר כובד',_seriesId:'builtin_inception',_seriesName:'התחלה (Inception)',_seriesType:'movie',_seriesLocked:true,_epNum:2,_epTotal:3},
    {id:'m3c',pts:180,emoji:'🎬',title:'התחלה — שכבה 3: הלימבו',desc:'שאלת הכיסכוס — איפה מסתיים הגבול?',_seriesId:'builtin_inception',_seriesName:'התחלה (Inception)',_seriesType:'movie',_seriesLocked:true,_epNum:3,_epTotal:3},
    // בין כוכבים — 169 דק׳ (2014)
    {id:'m4a',pts:160,emoji:'🚀',title:'בין כוכבים — חלק א׳: כדור הארץ גוסס',desc:'קופר, האות, ופרויקט לזרוס הסודי',_seriesId:'builtin_interstellar',_seriesName:'בין כוכבים (Interstellar)',_seriesType:'movie',_seriesLocked:true,_epNum:1,_epTotal:3},
    {id:'m4b',pts:170,emoji:'🚀',title:'בין כוכבים — חלק ב׳: מעבר לשחור',desc:'מילר, מאן, זמן מתעוות',_seriesId:'builtin_interstellar',_seriesName:'בין כוכבים (Interstellar)',_seriesType:'movie',_seriesLocked:true,_epNum:2,_epTotal:3},
    {id:'m4c',pts:190,emoji:'🚀',title:'בין כוכבים — חלק ג׳: הממד החמישי',desc:'הספרייה בשחור, הפתרון, והאהבה כוח פיזיקלי',_seriesId:'builtin_interstellar',_seriesName:'בין כוכבים (Interstellar)',_seriesType:'movie',_seriesLocked:true,_epNum:3,_epTotal:3},
    // הפסנתרן — 150 דק׳ (2002)
    {id:'m5a',pts:170,emoji:'🎹',title:'הפסנתרן — חלק א׳: הגטו',desc:'ורשה 1939 — המוסיקה כהישרדות',_seriesId:'builtin_pianist',_seriesName:'הפסנתרן',_seriesType:'movie',_seriesLocked:true,_epNum:1,_epTotal:2},
    {id:'m5b',pts:190,emoji:'🎹',title:'הפסנתרן — חלק ב׳: ההסתתרות',desc:'החורבות, הקצין הגרמני, הנוקטורן',_seriesId:'builtin_pianist',_seriesName:'הפסנתרן',_seriesType:'movie',_seriesLocked:true,_epNum:2,_epTotal:2},
    // רשימת שינדלר — 195 דק׳ (1993)
    {id:'m6a',pts:180,emoji:'🕯️',title:"רשימת שינדלר — חלק א׳: 'הרכישה'",desc:'קראקוב, הגטו, ושינדלר העסקן',_seriesId:'builtin_schindler',_seriesName:"רשימת שינדלר",_seriesType:'movie',_seriesLocked:true,_epNum:1,_epTotal:3},
    {id:'m6b',pts:190,emoji:'🕯️',title:'רשימת שינדלר — חלק ב׳: הפירוק',desc:'מחנה פלאשוב — גות מול שינדלר',_seriesId:'builtin_schindler',_seriesName:"רשימת שינדלר",_seriesType:'movie',_seriesLocked:true,_epNum:2,_epTotal:3,minLevel:2},
    {id:'m6c',pts:220,emoji:'🕯️',title:"רשימת שינדלר — חלק ג׳: 'הרשימה'",desc:'המפעל בברנדלוב — החיים ששווה לקנות',_seriesId:'builtin_schindler',_seriesName:"רשימת שינדלר",_seriesType:'movie',_seriesLocked:true,_epNum:3,_epTotal:3,minLevel:3},
    // פורסט גאמפ — 142 דק׳ (1994)
    {id:'m7a',pts:180,emoji:'🍫',title:'פורסט גאמפ — חלק א׳: הילדות',desc:'אלבמה, ג׳ני, ודרך המחוץ',_seriesId:'builtin_forrest',_seriesName:'פורסט גאמפ',_seriesType:'movie',_seriesLocked:true,_epNum:1,_epTotal:2},
    {id:'m7b',pts:200,emoji:'🍫',title:'פורסט גאמפ — חלק ב׳: ההיסטוריה',desc:'וייטנאם, פינג פונג, אהבה וריצה ללא סיום',_seriesId:'builtin_forrest',_seriesName:'פורסט גאמפ',_seriesType:'movie',_seriesLocked:true,_epNum:2,_epTotal:2},
    // הסנדק — 175 דק׳ (1972)
    {id:'m8a',pts:170,emoji:'🌹',title:'הסנדק — Act I: הכוח',desc:'חתונת קונה, עסקת סמים, היריה',_seriesId:'builtin_godfather',_seriesName:'הסנדק',_seriesType:'movie',_seriesLocked:true,_epNum:1,_epTotal:3},
    {id:'m8b',pts:170,emoji:'🌹',title:'הסנדק — Act II: הירושה',desc:'מיכאל לוקח פיקוד — שינוי בלתי הפיך',_seriesId:'builtin_godfather',_seriesName:'הסנדק',_seriesType:'movie',_seriesLocked:true,_epNum:2,_epTotal:3},
    {id:'m8c',pts:200,emoji:'🌹',title:'הסנדק — Act III: התמורה',desc:'הפינאלה — הטבח, הדלת, הבדידות',_seriesId:'builtin_godfather',_seriesName:'הסנדק',_seriesType:'movie',_seriesLocked:true,_epNum:3,_epTotal:3,minLevel:2},
    // פרזיטים — 132 דק׳ (2019)
    {id:'m9a',pts:210,emoji:'🏠',title:'פרזיטים — חצי א׳: העלייה',desc:'משפחת קים מסתננת — תכנית מושלמת',_seriesId:'builtin_parasite',_seriesName:'פרזיטים (Parasite)',_seriesType:'movie',_seriesLocked:true,_epNum:1,_epTotal:2},
    {id:'m9b',pts:230,emoji:'🏠',title:'פרזיטים — חצי ב׳: הירידה',desc:'הסוד מתחת לרצפה — הכל מתהפך',_seriesId:'builtin_parasite',_seriesName:'פרזיטים (Parasite)',_seriesType:'movie',_seriesLocked:true,_epNum:2,_epTotal:2},
    // שבעת הסמוראים — 207 דק׳ (1954)
    {id:'m10a',pts:160,emoji:'⚔️',title:'שבעת הסמוראים — חלק א׳: הגיוס',desc:'הכפר, הבחירה, שבעה שונים שמתאחדים',_seriesId:'builtin_7sam',_seriesName:'שבעת הסמוראים',_seriesType:'movie',_seriesLocked:true,_epNum:1,_epTotal:3},
    {id:'m10b',pts:170,emoji:'⚔️',title:'שבעת הסמוראים — חלק ב׳: ההכנה',desc:'אימון, ביצורים, ומתח לפני הסערה',_seriesId:'builtin_7sam',_seriesName:'שבעת הסמוראים',_seriesType:'movie',_seriesLocked:true,_epNum:2,_epTotal:3},
    {id:'m10c',pts:180,emoji:'⚔️',title:'שבעת הסמוראים — חלק ג׳: הקרב',desc:'גשם, בוץ, ומחיר הניצחון',_seriesId:'builtin_7sam',_seriesName:'שבעת הסמוראים',_seriesType:'movie',_seriesLocked:true,_epNum:3,_epTotal:3,minLevel:2},
    // החיים יפים — 116 דק׳ (1997)
    {id:'m11a',pts:200,emoji:'🌸',title:'החיים יפים — חלק א׳: האהבה',desc:'גואידו, דורה, שנות אושר לפני הסערה',_seriesId:'builtin_lifeis',_seriesName:'החיים יפים',_seriesType:'movie',_seriesLocked:true,_epNum:1,_epTotal:2},
    {id:'m11b',pts:240,emoji:'🌸',title:'החיים יפים — חלק ב׳: המחנה',desc:'האב שהופך מחנה ריכוז למשחק — לאהבת בנו',_seriesId:'builtin_lifeis',_seriesName:'החיים יפים',_seriesType:'movie',_seriesLocked:true,_epNum:2,_epTotal:2},
    // חומות של תקווה — 142 דק׳ (1994)
    {id:'m12a',pts:200,emoji:'🪨',title:'חומות של תקווה — חצי א׳',desc:'אנדי דאפריין, הכלא, הידידות עם רד',_seriesId:'builtin_shawshank',_seriesName:'חומות של תקווה',_seriesType:'movie',_seriesLocked:true,_epNum:1,_epTotal:2},
    {id:'m12b',pts:220,emoji:'🪨',title:'חומות של תקווה — חצי ב׳',desc:'מנהרת הבריחה — התקווה שלא כבתה',_seriesId:'builtin_shawshank',_seriesName:'חומות של תקווה',_seriesType:'movie',_seriesLocked:true,_epNum:2,_epTotal:2},
    // להציל את טוראי ראיין — 169 דק׳ (1998)
    {id:'m13a',pts:160,emoji:'🪖',title:'להציל את טוראי ראיין — חלק א׳: נורמנדי',desc:'D-Day — 27 הדקות שיכולות לשבור אותך',_seriesId:'builtin_ryan',_seriesName:'להציל את טוראי ראיין',_seriesType:'movie',_seriesLocked:true,_epNum:1,_epTotal:3},
    {id:'m13b',pts:160,emoji:'🪖',title:'להציל את טוראי ראיין — חלק ב׳: החיפוש',desc:'המסע הפנים-גרמני — חיי 8 תמורת אחד',_seriesId:'builtin_ryan',_seriesName:'להציל את טוראי ראיין',_seriesType:'movie',_seriesLocked:true,_epNum:2,_epTotal:3},
    {id:'m13c',pts:200,emoji:'🪖',title:'להציל את טוראי ראיין — חלק ג׳: הגשר',desc:'הקרב האחרון — מה שווה להיות חייב משהו',_seriesId:'builtin_ryan',_seriesName:'להציל את טוראי ראיין',_seriesType:'movie',_seriesLocked:true,_epNum:3,_epTotal:3},
    // 2001: אודיסאה בחלל — 149 דק׳ (1968)
    {id:'m15a',pts:160,emoji:'🔭',title:'2001: אודיסאה בחלל — שחר האנושות',desc:'הקוף, העצם, הקפיצה הגדולה',_seriesId:'builtin_2001',_seriesName:'2001: אודיסאה בחלל',_seriesType:'movie',_seriesLocked:true,_epNum:1,_epTotal:3},
    {id:'m15b',pts:170,emoji:'🔭',title:'2001: אודיסאה בחלל — גילוי ג׳ופיטר',desc:'הAL 9000, HAL, ומרד המכונה',_seriesId:'builtin_2001',_seriesName:'2001: אודיסאה בחלל',_seriesType:'movie',_seriesLocked:true,_epNum:2,_epTotal:3},
    {id:'m15c',pts:200,emoji:'🔭',title:'2001: אודיסאה בחלל — מעבר הכוכבים',desc:'סדרת ג׳ופיטר, החדר, הילד הכוכב',_seriesId:'builtin_2001',_seriesName:'2001: אודיסאה בחלל',_seriesType:'movie',_seriesLocked:true,_epNum:3,_epTotal:3,minLevel:3},
    // נפלאות התבונה — 126 דק׳ (1997)
    {id:'m16a',pts:190,emoji:'🧠',title:'נפלאות התבונה — חצי א׳',desc:'ויל הגאון, שון המטפל — שני שבורים פוגשים',_seriesId:'builtin_goodwill',_seriesName:'נפלאות התבונה',_seriesType:'movie',_seriesLocked:true,_epNum:1,_epTotal:2},
    {id:'m16b',pts:210,emoji:'🧠',title:'נפלאות התבונה — חצי ב׳',desc:"זה לא האשמה שלך — הפריצה הרגשית",_seriesId:'builtin_goodwill',_seriesName:'נפלאות התבונה',_seriesType:'movie',_seriesLocked:true,_epNum:2,_epTotal:2},
    // ממנטו — 113 דק׳ (2000)
    {id:'m17a',pts:200,emoji:'📸',title:'ממנטו — חלק א׳ (לאחור)',desc:'הסיפור המתגלה לאחור — מי זה ג׳ון ג׳י?',_seriesId:'builtin_memento',_seriesName:'ממנטו',_seriesType:'movie',_seriesLocked:true,_epNum:1,_epTotal:2},
    {id:'m17b',pts:220,emoji:'📸',title:'ממנטו — חלק ב׳ (הפינאלה)',desc:'האמת על סאמי ג׳נקינס — מה שלנד בחר לשכוח',_seriesId:'builtin_memento',_seriesName:'ממנטו',_seriesType:'movie',_seriesLocked:true,_epNum:2,_epTotal:2},
    // אפוקליפסה עכשיו — 153 דק׳ (1979)
    {id:'m18a',pts:200,emoji:'🌴',title:'אפוקליפסה עכשיו — חלק א׳: הנהר',desc:'וילארד, הוויאטנאם, ואת לב החושך',_seriesId:'builtin_apocalypse',_seriesName:'אפוקליפסה עכשיו',_seriesType:'movie',_seriesLocked:true,_epNum:1,_epTotal:2,minLevel:7},
    {id:'m18b',pts:240,emoji:'🌴',title:'אפוקליפסה עכשיו — חלק ב׳: קורץ',desc:"'הזוועה, הזוועה' — גבול הטירוף האנושי",_seriesId:'builtin_apocalypse',_seriesName:'אפוקליפסה עכשיו',_seriesType:'movie',_seriesLocked:true,_epNum:2,_epTotal:2,minLevel:9},
    // ברייקינג בד — בינג׳ (AMC 2008–2013)
    {id:'m19',pts:700,emoji:'🧪',title:"ברייקינג בד — בינג' 3 פרקים",desc:'אחד הסיפורים הגדולים',minLevel:6},
  ]},
  {cat:'📚  ספרות וקריאה',items:[
    // 1984 — 3 חלקים
    {id:'b1a',pts:90,emoji:'📖',title:'1984 — חלק א׳: אוקיינייה',desc:'וינסטון, ה-Big Brother, היומן הסודי',_seriesId:'builtin_1984',_seriesName:'1984 (אורוול)',_seriesType:'book',_seriesLocked:true,_epNum:1,_epTotal:3},
    {id:'b1b',pts:100,emoji:'📖',title:'1984 — חלק ב׳: האהבה',desc:'ג׳וליה, חדר האהבה, ואמנה האחים',_seriesId:'builtin_1984',_seriesName:'1984 (אורוול)',_seriesType:'book',_seriesLocked:true,_epNum:2,_epTotal:3},
    {id:'b1c',pts:110,emoji:'📖',title:'1984 — חלק ג׳: חדר 101',desc:'המשטרה המחשבתית — השבירה הסופית',_seriesId:'builtin_1984',_seriesName:'1984 (אורוול)',_seriesType:'book',_seriesLocked:true,_epNum:3,_epTotal:3},
    // הנסיך הקטן — קצר, חלק אחד
    {id:'b2', pts:180,emoji:'🌹',title:'הנסיך הקטן — (ספר שלם)',desc:'הנסיך, השועל, ומה שהעיניים אינן רואות'},
    // אדם מחפש משמעות — 2 חלקים
    {id:'b3a',pts:90,emoji:'🕯️',title:'אדם מחפש משמעות — חלק א׳: המחנה',desc:'פרנקל באושוויץ — לוגותרפיה נולדת מייסורים',_seriesId:'builtin_frankl',_seriesName:'אדם מחפש משמעות (פרנקל)',_seriesType:'book',_seriesLocked:true,_epNum:1,_epTotal:2},
    {id:'b3b',pts:100,emoji:'🕯️',title:'אדם מחפש משמעות — חלק ב׳: הלוגותרפיה',desc:'הרצון למשמעות — בסיס לחוסן נפשי',_seriesId:'builtin_frankl',_seriesName:'אדם מחפש משמעות (פרנקל)',_seriesType:'book',_seriesLocked:true,_epNum:2,_epTotal:2},
    // הזקן והים — קצר, חלק אחד
    {id:'b4', pts:152,emoji:'🎣',title:'הזקן והים — (ספר שלם)',desc:'3 ימים בים עם הדג — מאבק, כבוד ובדידות'},
    // אל תיגע בזמיר — 2 חלקים
    {id:'b5a',pts:100,emoji:'⚖️',title:'אל תיגע בזמיר — חלק א׳: מייקומב',desc:'סקאוט, אטיקוס, וחיי הדרום',_seriesId:'builtin_mockingbird',_seriesName:'אל תיגע בזמיר',_seriesType:'book',_seriesLocked:true,_epNum:1,_epTotal:2},
    {id:'b5b',pts:120,emoji:'⚖️',title:'אל תיגע בזמיר — חלק ב׳: המשפט',desc:'טום רובינסון, גזענות, ומה שאטיקוס מלמד',_seriesId:'builtin_mockingbird',_seriesName:'אל תיגע בזמיר',_seriesType:'book',_seriesLocked:true,_epNum:2,_epTotal:2},
    // עולם חדש מופלא — 2 חלקים
    {id:'b6a',pts:110,emoji:'🧬',title:'עולם חדש מופלא — חלק א׳: בית הטיפוח',desc:'בוקנובסקי, הונדה, עולם ה-Soma',_seriesId:'builtin_huxley',_seriesName:'עולם חדש מופלא (האקסלי)',_seriesType:'book',_seriesLocked:true,_epNum:1,_epTotal:2},
    {id:'b6b',pts:130,emoji:'🧬',title:'עולם חדש מופלא — חלק ב׳: הפראי',desc:'ג׳ון מהשמורה — ההתנגשות עם הציוויליזציה',_seriesId:'builtin_huxley',_seriesName:'עולם חדש מופלא (האקסלי)',_seriesType:'book',_seriesLocked:true,_epNum:2,_epTotal:2},
    // האלכימאי — 2 חלקים
    {id:'b7a',pts:100,emoji:'✨',title:'האלכימאי — חלק א׳: הספרד',desc:'סנטיאגו, החלום, ומכירת הצאן',_seriesId:'builtin_alchemist',_seriesName:'האלכימאי',_seriesType:'book',_seriesLocked:true,_epNum:1,_epTotal:2},
    {id:'b7b',pts:120,emoji:'✨',title:'האלכימאי — חלק ב׳: המדבר',desc:'האהבה, הפחד, ולב העולם',_seriesId:'builtin_alchemist',_seriesName:'האלכימאי',_seriesType:'book',_seriesLocked:true,_epNum:2,_epTotal:2},
    // עלובי החיים — 5 חלקים (כרכים)
    {id:'b8a',pts:70,emoji:'📖',title:'עלובי החיים — כרך א׳: פנטין',desc:'ז׳אן ולז׳אן, הבישוף, ו-19 שנות כלא',_seriesId:'builtin_miserables',_seriesName:'עלובי החיים (ויקטור הוגו)',_seriesType:'book',_seriesLocked:true,_epNum:1,_epTotal:5},
    {id:'b8b',pts:75,emoji:'📖',title:'עלובי החיים — כרך ב׳: קוזט',desc:'בית הספר בפריז, הנמלטים',_seriesId:'builtin_miserables',_seriesName:'עלובי החיים (ויקטור הוגו)',_seriesType:'book',_seriesLocked:true,_epNum:2,_epTotal:5},
    {id:'b8c',pts:80,emoji:'📖',title:'עלובי החיים — כרך ג׳: מריוס',desc:'האהבה, הסטודנטים, פוליטיקה',_seriesId:'builtin_miserables',_seriesName:'עלובי החיים (ויקטור הוגו)',_seriesType:'book',_seriesLocked:true,_epNum:3,_epTotal:5,minLevel:2},
    {id:'b8d',pts:90,emoji:'📖',title:'עלובי החיים — כרך ד׳: האידיל',desc:'מחסום האינזורגנטים — מות גברוש',_seriesId:'builtin_miserables',_seriesName:'עלובי החיים (ויקטור הוגו)',_seriesType:'book',_seriesLocked:true,_epNum:4,_epTotal:5,minLevel:3},
    {id:'b8e',pts:100,emoji:'📖',title:'עלובי החיים — כרך ה׳: ז׳אן ולז׳אן',desc:'הפינאלה — גאולה, חסד, ומות בשקט',_seriesId:'builtin_miserables',_seriesName:'עלובי החיים (ויקטור הוגו)',_seriesType:'book',_seriesLocked:true,_epNum:5,_epTotal:5,minLevel:4},
    // החטא ועונשו — 3 חלקים
    {id:'b9a',pts:100,emoji:'🔪',title:'החטא ועונשו — חלק א׳: הרצח',desc:'רסקולניקוב, ה"זכות" להרוג, ואחרי',_seriesId:'builtin_crime',_seriesName:'החטא ועונשו',_seriesType:'book',_seriesLocked:true,_epNum:1,_epTotal:3},
    {id:'b9b',pts:110,emoji:'🔪',title:'החטא ועונשו — חלק ב׳: הסבל',desc:'פורפירי, הזיות, וסוניה המאמינה',_seriesId:'builtin_crime',_seriesName:'החטא ועונשו',_seriesType:'book',_seriesLocked:true,_epNum:2,_epTotal:3},
    {id:'b9c',pts:120,emoji:'🔪',title:'החטא ועונשו — חלק ג׳: וידוי',desc:'הוידוי, סיביר, והגאולה',_seriesId:'builtin_crime',_seriesName:'החטא ועונשו',_seriesType:'book',_seriesLocked:true,_epNum:3,_epTotal:3,minLevel:2},
    // האחים קרמזוב — 4 חלקים
    {id:'b10a',pts:85,emoji:'✝️',title:'האחים קרמזוב — חלק א׳: המשפחה',desc:'פיודור, דמיטרי, איוון ואליושה',_seriesId:'builtin_karamazov',_seriesName:'האחים קרמזוב',_seriesType:'book',_seriesLocked:true,_epNum:1,_epTotal:4},
    {id:'b10b',pts:90,emoji:'✝️',title:'האחים קרמזוב — חלק ב׳: הגדול האינקוויזיטור',desc:'פרק האמונה המפורסם — דיאלוג עם ישו',_seriesId:'builtin_karamazov',_seriesName:'האחים קרמזוב',_seriesType:'book',_seriesLocked:true,_epNum:2,_epTotal:4,minLevel:2},
    {id:'b10c',pts:95,emoji:'✝️',title:'האחים קרמזוב — חלק ג׳: הרצח',desc:'מי הרג? ייסורים ומשפט',_seriesId:'builtin_karamazov',_seriesName:'האחים קרמזוב',_seriesType:'book',_seriesLocked:true,_epNum:3,_epTotal:4,minLevel:3},
    {id:'b10d',pts:100,emoji:'✝️',title:'האחים קרמזוב — חלק ד׳: האמונה',desc:'אליושה, הפינאלה — מה שנשאר',_seriesId:'builtin_karamazov',_seriesName:'האחים קרמזוב',_seriesType:'book',_seriesLocked:true,_epNum:4,_epTotal:4,minLevel:4},
    // כוח הרגל — 3 חלקים
    {id:'b14a',pts:80,emoji:'🔄',title:'כוח הרגל — חלק א׳: הרגלים הפרטיים',desc:'לולאת ההרגל, המוח, והשינוי',_seriesId:'builtin_habit',_seriesName:'כוח הרגל (Duhigg)',_seriesType:'book',_seriesLocked:true,_epNum:1,_epTotal:3},
    {id:'b14b',pts:90,emoji:'🔄',title:'כוח הרגל — חלק ב׳: הרגלים ארגוניים',desc:'סטארבקס, אלקואה — שינוי מוסדי',_seriesId:'builtin_habit',_seriesName:'כוח הרגל (Duhigg)',_seriesType:'book',_seriesLocked:true,_epNum:2,_epTotal:3},
    {id:'b14c',pts:100,emoji:'🔄',title:'כוח הרגל — חלק ג׳: הרגלים חברתיים',desc:'מנועי שינוי — תנועות ועצמה',_seriesId:'builtin_habit',_seriesName:'כוח הרגל (Duhigg)',_seriesType:'book',_seriesLocked:true,_epNum:3,_epTotal:3},
    // אטומיק הביטס — 4 חלקים
    {id:'b15a',pts:55,emoji:'⚛️',title:'אטומיק הביטס — חלק א׳: 1% כל יום',desc:'כוח ה-compound — תחשיב הרגלים',_seriesId:'builtin_atomic',_seriesName:'אטומיק הביטס',_seriesType:'book',_seriesLocked:true,_epNum:1,_epTotal:4},
    {id:'b15b',pts:60,emoji:'⚛️',title:'אטומיק הביטס — חלק ב׳: זהות',desc:'לא יעדים — מי אתה? ומה עושה מישהו כמוך?',_seriesId:'builtin_atomic',_seriesName:'אטומיק הביטס',_seriesType:'book',_seriesLocked:true,_epNum:2,_epTotal:4},
    {id:'b15c',pts:60,emoji:'⚛️',title:'אטומיק הביטס — חלק ג׳: ה-4 חוקים',desc:'ברור, אטרקטיבי, קל, מספק',_seriesId:'builtin_atomic',_seriesName:'אטומיק הביטס',_seriesType:'book',_seriesLocked:true,_epNum:3,_epTotal:4},
    {id:'b15d',pts:65,emoji:'⚛️',title:'אטומיק הביטס — חלק ד׳: הסביבה',desc:'מדדים, שליטה, ומסע ל-Advanced',_seriesId:'builtin_atomic',_seriesName:'אטומיק הביטס',_seriesType:'book',_seriesLocked:true,_epNum:4,_epTotal:4},
  ]},
  {cat:'🥾  ספורט והרפתקאות',items:[
    {id:'sp1',pts:240,emoji:'🏋️',title:'שיעור ספורט מיוחד',        desc:'בוקס, יוגה, כל מה שאוהב'},
    {id:'sp2',pts:220,emoji:'🚴',title:'שעת אופניים חופשית',       desc:'לנסוע בלי יעד'},
    {id:'sp3',pts:280,emoji:'🏊',title:'שחייה / ים / בריכה — שעה',desc:'שעה לבד עם המים'},
    {id:'sp4',pts:380,emoji:'🥾',title:'טיול יום עצמאי',           desc:'טבע, הליכה, ניקוי ראש'},
    {id:'sp5',pts:300,emoji:'🧗',title:'טיפוס / ספורט אקסטרים',   desc:'אדרנלין מבוקר',minLevel:3},
    {id:'sp6',pts:640,emoji:'⛺',title:'טיול לין / לילה בטבע',     desc:'מחוץ לשגרה לחלוטין',minLevel:5},
    {id:'sp7',pts:880,emoji:'🏕️',title:'טיול סוף שבוע',            desc:'שני ימים בטבע',minLevel:7},
  ]},
  {cat:'✨  פרמיום — שלבים גבוהים',items:[
    {id:'px1',pts:1000,emoji:'🛍️',title:'קניית פריט שתמיד רצית',  desc:'עד 500 ₪',minLevel:7},
    {id:'px2',pts:1400,emoji:'🌴',title:'יום חופש מלא',            desc:"24 שעות ללא אג'נדה",minLevel:9},
    {id:'px3',pts:2000,emoji:'✈️',title:'חופשת סוף שבוע',          desc:'לאן שמתחשק',minLevel:11},
    {id:'px4',pts:2800,emoji:'🌍',title:'חופשה שבועית — חלום',    desc:'שבוע שלם',minLevel:14},
  ]},
];

