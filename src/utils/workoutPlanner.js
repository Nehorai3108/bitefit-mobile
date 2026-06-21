// ─── Workout Plan Generator ───────────────────────────────────────────────────

const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

const DAY_INDICES = {
  2: [0, 3],
  3: [0, 2, 4],
  4: [0, 1, 3, 4],
  5: [0, 1, 2, 3, 4],
  6: [0, 1, 2, 3, 4, 5],
};

// ─── תרגילי כוח ──────────────────────────────────────────────────────────────

const EX = {
  // חזה
  benchFlat:    { name: 'לחיצת חזה שטוח',          muscles: 'חזה, טריצפס, כתפיים', tip: 'גב שטוח על הספסל, מרפקים ב-45° מהגוף, הורד לאט 3 שניות' },
  benchIncline: { name: 'לחיצת חזה בשיפוע',         muscles: 'חזה עליון, כתפיים',  tip: 'שיפוע 30-45°, קח אוויר למטה ודחוף בנשיפה' },
  fly:          { name: 'פרפר עם דמבלים',            muscles: 'חזה',               tip: 'מרפקים קלות כפופים לאורך כל התנועה, לא להוריד מתחת לכתפיים' },
  dips:         { name: 'מקבילים',                   muscles: 'חזה תחתון, טריצפס', tip: 'הטיית גוף קדימה — עובד חזה. גוף ישר — עובד טריצפס. ירידה מבוקרת' },
  // גב
  deadlift:     { name: 'דדליפט',                   muscles: 'גב תחתון, ירכיים, ישבן', tip: 'גב ישר לחלוטין, המוט קרוב לגוף, דחוף את הרצפה ברגליים' },
  rdl:          { name: 'דדליפט רומני',              muscles: 'ירכיים, ישבן, גב תחתון', tip: 'הרגש מתיחה בירכיים, גב שטוח, ברכיים קלות כפופות' },
  pullup:       { name: 'פולאפ',                     muscles: 'גב רחב, ביצפס',     tip: 'תפס רחב, דחוף מרפקים כלפי מטה ולאחור כאילו שובר ענף, לא תנופה' },
  latPull:      { name: 'משיכת פולי עליון',          muscles: 'גב רחב, ביצפס',     tip: 'חזה מוצב למעלה, משוך לחזה העליון, שחרר לאט כלפי מעלה' },
  rowBent:      { name: 'חתירה בשכיבה עם מוט',      muscles: 'גב אמצעי, ביצפס',   tip: 'גב מקביל לרצפה, משוך לבטן, לחץ את השכמות יחד בסיום' },
  rowDB:        { name: 'חתירה ביחיד עם דמבל',       muscles: 'גב, ביצפס',         tip: 'תמוך ביד ובברך על ספסל, משוך המרפק גבוה ולאחור' },
  rearDelt:     { name: 'פרפר הפוך לכתפיים אחוריות', muscles: 'כתפיים אחוריות, גב אמצעי', tip: 'כפף קדימה 45°, מרפקים קלות כפופים, הרם לגובה הכתפיים' },
  // כתפיים
  ohp:          { name: 'לחיצת כתפיים עם מוט',      muscles: 'כתפיים, טריצפס',    tip: 'עמוד יציב, דחוף ישר מעל הראש, אל תקמר גב תחתון' },
  dbPress:      { name: 'לחיצת כתפיים עם דמבלים',   muscles: 'כתפיים',             tip: 'כפות ידיים פונות קדימה, ירידה עד גובה אוזניים' },
  lateralRaise: { name: 'כריות כתפיים צדדיות',      muscles: 'כתפיים צדדיות',     tip: 'הרם לגובה הכתף, אגודל מעט למטה (מוזג כוס), לאט למטה' },
  frontRaise:   { name: 'כריות כתפיים קדמיות',      muscles: 'כתפיים קדמיות',     tip: 'זרועות ישרות, הרם לגובה הכתף, מבוקר' },
  // רגליים
  squat:        { name: 'סקוואט',                   muscles: 'ירכיים, ישבן, גב תחתון', tip: 'ירידה כאילו יושב על כסא, ברכיים מעל אצבעות, חזה מוצב' },
  legPress:     { name: 'לגפרס',                    muscles: 'ירכיים, ישבן',       tip: 'רגליים ברוחב כתפיים, כרכב לא נועל, ירידה עמוקה' },
  legCurl:      { name: 'כפיפות רגל שוכב',          muscles: 'ירכיים אחוריות',     tip: 'אל תרים את הישבן בכפיפה, כיווץ מלא בסיום' },
  lunge:        { name: 'לאנג\'ים הליכה',            muscles: 'ירכיים, ישבן, שוק', tip: 'צעד גדול, ברך אחורית כמעט נוגעת לרצפה, גוף ישר' },
  bulgarianSS:  { name: 'בולגרי ספליט סקוואט',      muscles: 'ירכיים, ישבן',       tip: 'כף הרגל האחורית על ספסל, ירידה אנכית, ברך קדמית מעל אצבעות' },
  calf:         { name: 'עלייה על בהונות (עגל)',    muscles: 'שוק',                tip: 'עלייה מלאה, עצור שנייה למעלה, ירידה מלאה מתחת לגובה הפלטפורמה' },
  // ביצפס/טריצפס
  bicepCurl:    { name: 'כפיפות ביצפס עם דמבלים',  muscles: 'ביצפס',             tip: 'מרפקים צמודים לגוף, לאט למטה 3 שניות, לא תנופה' },
  hammer:       { name: 'פטיש (Hammer Curl)',       muscles: 'ביצפס, ברכיאליס',   tip: 'כף יד ניטרלית (אגודל למעלה), כיווץ בסיום' },
  concCurl:     { name: 'כפיפות ביצפס ריכוז',      muscles: 'ביצפס',             tip: 'מרפק על הירך, תנועה מלאה, לאט מאוד למטה' },
  tricepPD:     { name: 'טריצפס פושדאון',          muscles: 'טריצפס',            tip: 'מרפקים צמודים לגוף, לא תנועה בכתפיים' },
  skullCrush:   { name: 'כתישת גולגולת',          muscles: 'טריצפס',            tip: 'מרפקים זקופים ומקובעים, הורד מאחורי הראש, לא לצדדים' },
  // ליבה
  plank:        { name: 'פלאנק',                    muscles: 'ליבה, כתפיים',      tip: 'גוף קו ישר, אל תרים ישבן, נשום רגיל' },
  crunch:       { name: 'כפיפות בטן',               muscles: 'בטן עליונה',         tip: 'ידיים מאחורי הראש, סנטר לחזה, לאט למטה' },
  legRaise:     { name: 'הרמות רגליים',             muscles: 'בטן תחתונה',         tip: 'גב שטוח על הרצפה, רגליים יורדות לאט ולא נוגעות ברצפה' },
  russianTwist: { name: 'סיבובי גזע',               muscles: 'אלכסוני הבטן',      tip: 'ישיבה ב-45°, הטה לצדדים, אפשר עם משקולת' },
  mountClimb:   { name: 'טיפוס הרים',               muscles: 'ליבה, כתפיים',      tip: 'מנח לחיצה, משוך ברכיים לחזה לסירוגין מהר' },
  vUp:          { name: 'קיפולי V',                 muscles: 'בטן מלאה',           tip: 'הרם רגליים וגוף בו-זמנית, פגוש עם הידיים את כפות הרגליים באמצע' },
};

// ─── בניית תרגיל ─────────────────────────────────────────────────────────────
function ex(base, sets, reps, rest = '60 שניות') {
  return { ...base, sets, reps, rest };
}
function exH(base, sets, reps, rest = '90 שניות') {  // כבד
  return { ...base, sets, reps, rest };
}

const WARMUP = [
  { name: 'חימום כללי', desc: '5 דקות אליפטיקל / הליכון / קפיצות קל', icon: 'flash-outline' },
  { name: 'מתיחות דינמיות', desc: 'סיבובי כתפיים, סיבובי ירכיים, לאנג\'ים קלים — 10 חזרות כל תרגיל', icon: 'body-outline' },
];

const COOLDOWN = [
  { name: 'מתיחות סטטיות', desc: '30 שניות לכל שריר שעבדת', icon: 'leaf-outline' },
  { name: 'נשימות עמוקות', desc: '3 נשימות עמוקות לסיום האימון', icon: 'heart-outline' },
];

// ─── תכניות כוח ──────────────────────────────────────────────────────────────

const STRENGTH_SPLITS = {
  2: [
    {
      name: 'גוף מלא א',
      muscles: 'חזה, גב, רגליים, כתפיים',
      duration: 60,
      exercises: [
        exH(EX.squat,        4, '8-10 חזרות', '2-3 דקות'),
        exH(EX.benchFlat,    4, '8-10 חזרות', '2-3 דקות'),
        ex (EX.rowBent,      3, '10-12 חזרות'),
        ex (EX.dbPress,      3, '10-12 חזרות'),
        ex (EX.plank,        3, '45-60 שניות', '45 שניות'),
      ],
    },
    {
      name: 'גוף מלא ב',
      muscles: 'ירכיים, גב עליון, חזה, ליבה',
      duration: 60,
      exercises: [
        exH(EX.deadlift,     4, '6-8 חזרות',  '3 דקות'),
        ex (EX.latPull,      4, '10-12 חזרות'),
        ex (EX.benchIncline, 3, '10-12 חזרות'),
        ex (EX.lunge,        3, '12 חזרות לכל רגל'),
        ex (EX.lateralRaise, 3, '12-15 חזרות', '45 שניות'),
      ],
    },
  ],
  3: [
    {
      name: 'דחיפה — חזה, כתפיים, טריצפס',
      muscles: 'חזה, כתפיים, טריצפס',
      duration: 65,
      exercises: [
        exH(EX.benchFlat,    4, '6-10 חזרות',  '2-3 דקות'),
        ex (EX.benchIncline, 3, '10-12 חזרות'),
        ex (EX.dbPress,      3, '10-12 חזרות'),
        ex (EX.lateralRaise, 3, '12-15 חזרות', '45 שניות'),
        ex (EX.frontRaise,   3, '12-15 חזרות', '45 שניות'),
        ex (EX.skullCrush,   3, '12-15 חזרות'),
        ex (EX.tricepPD,     3, '15 חזרות',    '45 שניות'),
      ],
    },
    {
      name: 'משיכה — גב, ביצפס',
      muscles: 'גב רחב, גב אמצעי, ביצפס',
      duration: 65,
      exercises: [
        exH(EX.deadlift,     4, '5-8 חזרות',  '3 דקות'),
        ex (EX.pullup,       4, '6-10 חזרות', '2 דקות'),
        ex (EX.rowDB,        3, '12 חזרות לכל יד'),
        ex (EX.rearDelt,     3, '15 חזרות',   '45 שניות'),
        ex (EX.bicepCurl,    3, '12-15 חזרות'),
        ex (EX.hammer,       2, '12 חזרות לכל יד', '45 שניות'),
      ],
    },
    {
      name: 'רגליים — פלג תחתון',
      muscles: 'ירכיים, ישבן, שוק, ליבה',
      duration: 70,
      exercises: [
        exH(EX.squat,        4, '6-10 חזרות',  '2-3 דקות'),
        ex (EX.legPress,     4, '10-12 חזרות'),
        ex (EX.rdl,          3, '10-12 חזרות', '90 שניות'),
        ex (EX.lunge,        3, '12 חזרות לכל רגל'),
        ex (EX.legCurl,      3, '12-15 חזרות'),
        ex (EX.calf,         4, '15-20 חזרות', '45 שניות'),
      ],
    },
  ],
  4: [
    {
      name: 'פלג עליון א — כוח',
      muscles: 'חזה, גב, כתפיים',
      duration: 65,
      exercises: [
        exH(EX.benchFlat,    4, '5-8 חזרות',  '3 דקות'),
        exH(EX.pullup,       4, '6-8 חזרות',  '2 דקות'),
        exH(EX.ohp,          3, '6-8 חזרות',  '2 דקות'),
        ex (EX.rowBent,      3, '8-10 חזרות'),
        ex (EX.bicepCurl,    3, '8-10 חזרות'),
        ex (EX.skullCrush,   3, '8-10 חזרות'),
      ],
    },
    {
      name: 'פלג תחתון א — כוח',
      muscles: 'ירכיים, ישבן, גב תחתון',
      duration: 65,
      exercises: [
        exH(EX.squat,        5, '4-6 חזרות',  '3 דקות'),
        exH(EX.rdl,          4, '6-8 חזרות',  '2 דקות'),
        ex (EX.legPress,     3, '8-10 חזרות'),
        ex (EX.legCurl,      3, '10-12 חזרות'),
        ex (EX.calf,         4, '15-20 חזרות', '45 שניות'),
      ],
    },
    {
      name: 'פלג עליון ב — נפח',
      muscles: 'חזה, כתפיים, גב, זרועות',
      duration: 60,
      exercises: [
        ex (EX.benchIncline, 4, '10-12 חזרות'),
        ex (EX.rowDB,        4, '12 חזרות לכל יד'),
        ex (EX.lateralRaise, 4, '12-15 חזרות', '45 שניות'),
        ex (EX.fly,          3, '12-15 חזרות', '45 שניות'),
        ex (EX.concCurl,     3, '12 חזרות לכל יד', '45 שניות'),
        ex (EX.tricepPD,     3, '15 חזרות',    '45 שניות'),
        ex (EX.rearDelt,     3, '15 חזרות',    '45 שניות'),
      ],
    },
    {
      name: 'פלג תחתון ב + ליבה',
      muscles: 'ירכיים, ישבן, ליבה',
      duration: 65,
      exercises: [
        exH(EX.deadlift,     4, '5-6 חזרות',  '3 דקות'),
        ex (EX.lunge,        3, '12 חזרות לכל רגל'),
        ex (EX.bulgarianSS,  3, '10 חזרות לכל רגל', '90 שניות'),
        ex (EX.calf,         4, '20 חזרות',   '45 שניות'),
        ex (EX.plank,        3, '60 שניות',   '45 שניות'),
        ex (EX.crunch,       3, '20 חזרות',   '45 שניות'),
        ex (EX.russianTwist, 3, '20 חזרות',   '45 שניות'),
      ],
    },
  ],
  5: [
    {
      name: 'דחיפה',
      muscles: 'חזה, כתפיים, טריצפס',
      duration: 65,
      exercises: [
        exH(EX.benchFlat,    4, '6-10 חזרות',  '2-3 דקות'),
        ex (EX.benchIncline, 3, '10-12 חזרות'),
        ex (EX.dbPress,      4, '8-10 חזרות'),
        ex (EX.lateralRaise, 3, '15 חזרות',   '45 שניות'),
        ex (EX.tricepPD,     3, '12 חזרות'),
        ex (EX.dips,         3, 'עד כישלון',  '90 שניות'),
      ],
    },
    {
      name: 'משיכה',
      muscles: 'גב, ביצפס, כתפיים אחוריות',
      duration: 65,
      exercises: [
        exH(EX.deadlift,     4, '5-6 חזרות',  '3 דקות'),
        ex (EX.pullup,       4, 'עד כישלון',  '2 דקות'),
        ex (EX.rowDB,        3, '12 חזרות לכל יד'),
        ex (EX.rearDelt,     3, '15 חזרות',   '45 שניות'),
        ex (EX.bicepCurl,    3, '12 חזרות'),
        ex (EX.hammer,       2, '12 חזרות לכל יד', '45 שניות'),
      ],
    },
    {
      name: 'רגליים',
      muscles: 'ירכיים, ישבן, שוק',
      duration: 70,
      exercises: [
        exH(EX.squat,        5, '5-8 חזרות',  '3 דקות'),
        ex (EX.legPress,     4, '10-12 חזרות'),
        ex (EX.rdl,          3, '10 חזרות',   '90 שניות'),
        ex (EX.lunge,        3, '12 חזרות לכל רגל'),
        ex (EX.calf,         4, '20 חזרות',   '45 שניות'),
      ],
    },
    {
      name: 'פלג עליון — נפח',
      muscles: 'חזה, גב, כתפיים, זרועות',
      duration: 60,
      exercises: [
        ex (EX.benchIncline, 4, '12 חזרות'),
        ex (EX.rowBent,      4, '12 חזרות'),
        ex (EX.lateralRaise, 4, '15 חזרות',   '45 שניות'),
        ex (EX.dips,         3, 'עד כישלון',  '90 שניות'),
        ex (EX.bicepCurl,    3, '12 חזרות'),
        ex (EX.tricepPD,     3, '12 חזרות',   '45 שניות'),
      ],
    },
    {
      name: 'ליבה + אינטרוולים',
      muscles: 'ליבה, קרדיו',
      duration: 40,
      exercises: [
        ex (EX.plank,        4, '60 שניות',   '45 שניות'),
        ex (EX.mountClimb,   3, '30 שניות',   '30 שניות'),
        ex (EX.russianTwist, 3, '20 חזרות',   '30 שניות'),
        ex (EX.legRaise,     3, '15 חזרות',   '45 שניות'),
        ex (EX.vUp,          3, '12 חזרות',   '45 שניות'),
      ],
    },
  ],
  6: [
    { name: 'דחיפה א — כוח',   muscles: 'חזה, כתפיים, טריצפס', duration: 65, exercises: [exH(EX.benchFlat,4,'5',   '3 דקות'), ex(EX.benchIncline,4,'8'), ex(EX.ohp,4,'8','2 דקות'), ex(EX.lateralRaise,3,'15','45 שניות'), ex(EX.dips,3,'עד כישלון','90 שניות')] },
    { name: 'משיכה א — כוח',   muscles: 'גב, ביצפס',           duration: 65, exercises: [exH(EX.deadlift,5,'5',  '3 דקות'), ex(EX.pullup,4,'עד כישלון','2 דקות'), ex(EX.rowBent,4,'8'), ex(EX.bicepCurl,3,'10')] },
    { name: 'רגליים א',         muscles: 'ירכיים, ישבן, שוק',   duration: 70, exercises: [exH(EX.squat,5,'5',    '3 דקות'), ex(EX.legPress,4,'10'), ex(EX.rdl,3,'10','90 שניות'), ex(EX.calf,4,'20','45 שניות')] },
    { name: 'דחיפה ב — נפח',   muscles: 'חזה, כתפיים, טריצפס', duration: 60, exercises: [ex(EX.benchIncline,4,'12'), ex(EX.fly,3,'12'), ex(EX.lateralRaise,4,'15','45 שניות'), ex(EX.tricepPD,3,'15','45 שניות')] },
    { name: 'משיכה ב — נפח',   muscles: 'גב, ביצפס, כתפיים',  duration: 60, exercises: [ex(EX.rowDB,4,'12 לכל יד'), ex(EX.rearDelt,3,'15'), ex(EX.latPull,3,'12'), ex(EX.concCurl,3,'12 לכל יד','45 שניות'), ex(EX.hammer,2,'12 לכל יד','45 שניות')] },
    { name: 'רגליים ב + ליבה', muscles: 'ירכיים, ישבן, ליבה',  duration: 65, exercises: [ex(EX.bulgarianSS,4,'10 לכל רגל','90 שניות'), ex(EX.lunge,3,'12 לכל רגל'), ex(EX.legCurl,3,'15'), ex(EX.plank,3,'60 שניות','45 שניות'), ex(EX.russianTwist,3,'20','45 שניות')] },
  ],
};

// ─── תכניות ריצה ─────────────────────────────────────────────────────────────

const RUNNING_SPLITS = {
  2: [
    { name: 'ריצה קלה', muscles: 'קרדיו, סיבולת', duration: 35,
      exercises: [
        { name: 'חימום הליכה', muscles: '', tip: 'קצב נוח, הכנה לגוף', sets: 1, reps: '5 דקות', rest: '-' },
        { name: 'ריצה בקצב 5:30–6:30/ק"מ', muscles: '', tip: 'קצב שיחה — אמור להצליח לדבר', sets: 1, reps: '25 דקות', rest: '-' },
        { name: 'הליכת שחרור', muscles: '', tip: 'הורדת דופק בהדרגה', sets: 1, reps: '5 דקות', rest: '-' },
      ], note: 'מטרה: בניית בסיס אירובי' },
    { name: 'ריצה ארוכה', muscles: 'קרדיו, סיבולת', duration: 65,
      exercises: [
        { name: 'חימום קל', muscles: '', tip: '', sets: 1, reps: '10 דקות', rest: '-' },
        { name: 'ריצה אחידה 6:00–7:00/ק"מ', muscles: '', tip: 'שמור על קצב אחיד לאורך כל הריצה', sets: 1, reps: '50 דקות', rest: '-' },
        { name: 'קירור', muscles: '', tip: '', sets: 1, reps: '5 דקות', rest: '-' },
      ], note: 'אל תחשוב על מהירות — שמור על נשימה מבוקרת' },
  ],
  3: [
    { name: 'ריצה קלה', muscles: 'קרדיו', duration: 35,
      exercises: [
        { name: 'חימום הליכה', muscles: '', tip: '', sets: 1, reps: '5 דקות', rest: '-' },
        { name: 'ריצה קלה', muscles: '', tip: 'קצב שיחה', sets: 1, reps: '25 דקות', rest: '-' },
        { name: 'שחרור', muscles: '', tip: '', sets: 1, reps: '5 דקות', rest: '-' },
      ] },
    { name: 'אינטרוולים 400מ\'', muscles: 'קרדיו, כוח', duration: 50,
      exercises: [
        { name: 'חימום ריצה קלה', muscles: '', tip: '', sets: 1, reps: '10 דקות', rest: '-' },
        { name: 'ספרינט 400 מטר', muscles: '', tip: '85-90% מהמקסימום — אמור לנשוף', sets: 6, reps: '400 מטר', rest: '90 שניות מנוחה' },
        { name: 'ריצת קירור', muscles: '', tip: '', sets: 1, reps: '10 דקות', rest: '-' },
      ], note: 'מנוחה פעילה (הליכה) בין הסטים' },
    { name: 'ריצה ארוכה', muscles: 'קרדיו, סיבולת', duration: 65,
      exercises: [
        { name: 'חימום', muscles: '', tip: '', sets: 1, reps: '10 דקות', rest: '-' },
        { name: 'ריצה 6:00–7:00/ק"מ', muscles: '', tip: 'שמור על נשימה מבוקרת', sets: 1, reps: '50 דקות', rest: '-' },
        { name: 'שחרור', muscles: '', tip: '', sets: 1, reps: '5 דקות', rest: '-' },
      ] },
  ],
  4: [
    { name: 'ריצה קלה', muscles: 'קרדיו', duration: 35, exercises: [{ name: 'ריצה קלה', muscles: '', tip: 'קצב שיחה', sets: 1, reps: '30 דקות', rest: '-' }] },
    { name: 'טמפו', muscles: 'קרדיו', duration: 45, exercises: [
      { name: 'חימום', muscles: '', tip: '', sets: 1, reps: '10 דקות', rest: '-' },
      { name: 'ריצת טמפו 4:30–5:00/ק"מ', muscles: '', tip: 'קשה אבל שולט — לא ניתן לדבר משפטים שלמים', sets: 1, reps: '20 דקות', rest: '-' },
      { name: 'קירור', muscles: '', tip: '', sets: 1, reps: '10 דקות', rest: '-' },
    ] },
    { name: 'אינטרוולים 800מ\'', muscles: 'קרדיו, כוח', duration: 55, exercises: [
      { name: 'חימום', muscles: '', tip: '', sets: 1, reps: '10 דקות', rest: '-' },
      { name: 'ספרינט 800 מטר', muscles: '', tip: '85% מהמקסימום', sets: 5, reps: '800 מטר', rest: '2 דקות מנוחה' },
      { name: 'קירור', muscles: '', tip: '', sets: 1, reps: '10 דקות', rest: '-' },
    ] },
    { name: 'ריצה ארוכה', muscles: 'קרדיו, סיבולת', duration: 75, exercises: [
      { name: 'ריצה ארוכה 6:00–7:00/ק"מ', muscles: '', tip: 'שמור על קצב אחיד', sets: 1, reps: '70 דקות', rest: '-' },
    ] },
  ],
  5: [
    { name: 'ריצה קלה', muscles: 'קרדיו', duration: 30, exercises: [{ name: 'ריצה קלה', muscles: '', tip: '', sets: 1, reps: '30 דקות', rest: '-' }] },
    { name: 'טמפו', muscles: 'קרדיו', duration: 45, exercises: [{ name: 'חימום 10 דק\'', muscles: '', tip: '', sets: 1, reps: '10 דקות', rest: '-' }, { name: 'טמפו 20 דקות', muscles: '', tip: '4:30-5:00/ק"מ', sets: 1, reps: '20 דקות', rest: '-' }, { name: 'קירור 10 דק\'', muscles: '', tip: '', sets: 1, reps: '10 דקות', rest: '-' }] },
    { name: 'ריצה קלה', muscles: 'קרדיו', duration: 35, exercises: [{ name: 'ריצה לשחרור', muscles: '', tip: '', sets: 1, reps: '35 דקות', rest: '-' }] },
    { name: 'אינטרוולים 400מ\'', muscles: 'קרדיו, כוח', duration: 50, exercises: [{ name: 'חימום', muscles: '', tip: '', sets: 1, reps: '10 דקות', rest: '-' }, { name: 'ספרינט 400מ\'', muscles: '', tip: '', sets: 8, reps: '400 מטר', rest: '75 שניות' }, { name: 'קירור', muscles: '', tip: '', sets: 1, reps: '10 דקות', rest: '-' }] },
    { name: 'ריצה ארוכה', muscles: 'קרדיו, סיבולת', duration: 80, exercises: [{ name: 'ריצה ארוכה', muscles: '', tip: 'קצב שיחה לאורך כל הדרך', sets: 1, reps: '75 דקות', rest: '-' }] },
  ],
  6: [
    { name: 'ריצה קלה', muscles: 'קרדיו', duration: 30, exercises: [{ name: 'ריצה קלה', muscles: '', tip: '', sets: 1, reps: '30 דקות', rest: '-' }] },
    { name: 'טמפו קצר', muscles: 'קרדיו', duration: 35, exercises: [{ name: 'חימום 5 דק\'', muscles: '', tip: '', sets: 1, reps: '5 דקות', rest: '-' }, { name: 'טמפו', muscles: '', tip: '', sets: 1, reps: '20 דקות', rest: '-' }, { name: 'קירור', muscles: '', tip: '', sets: 1, reps: '10 דקות', rest: '-' }] },
    { name: 'ריצה בינונית', muscles: 'קרדיו', duration: 45, exercises: [{ name: 'ריצה 45 דקות', muscles: '', tip: 'קצב נוח', sets: 1, reps: '45 דקות', rest: '-' }] },
    { name: 'אינטרוולים קצרים', muscles: 'קרדיו, כוח', duration: 40, exercises: [{ name: 'חימום', muscles: '', tip: '', sets: 1, reps: '10 דקות', rest: '-' }, { name: 'ספרינט 200מ\'', muscles: '', tip: '90-95% מקסימום', sets: 10, reps: '200 מטר', rest: '60 שניות' }, { name: 'קירור', muscles: '', tip: '', sets: 1, reps: '10 דקות', rest: '-' }] },
    { name: 'ריצה קלה', muscles: 'קרדיו', duration: 30, exercises: [{ name: 'שחרור פעיל', muscles: '', tip: '', sets: 1, reps: '30 דקות', rest: '-' }] },
    { name: 'ריצה ארוכה', muscles: 'קרדיו, סיבולת', duration: 85, exercises: [{ name: 'ריצה ארוכה', muscles: '', tip: '', sets: 1, reps: '80 דקות', rest: '-' }] },
  ],
};

// ─── תכניות HIIT ──────────────────────────────────────────────────────────────

const HIIT_WORKOUTS = [
  {
    name: 'טאבאטה',
    muscles: 'גוף מלא, קרדיו',
    duration: 30,
    note: 'כל תרגיל: 8 סבבים × 20 שניות עבודה / 10 שניות מנוחה. מנוחה דקה בין תרגילים.',
    exercises: [
      { name: 'ברפי', muscles: 'גוף מלא', tip: 'רד לשכיבה, דחוף חזרה לעמידה, קפוץ למעלה עם ידיים מעל הראש', sets: 8, reps: '20 שניות', rest: '10 שניות' },
      { name: 'קפיצת סקוואט', muscles: 'ירכיים, ישבן', tip: 'ירד לסקוואט ובעלייה — קפוץ', sets: 8, reps: '20 שניות', rest: '10 שניות' },
      { name: 'טיפוס הרים', muscles: 'ליבה, כתפיים', tip: 'מנח לחיצה, ברכיים לחזה לסירוגין', sets: 8, reps: '20 שניות', rest: '10 שניות' },
      { name: 'לחיצות מהירות', muscles: 'חזה, טריצפס', tip: 'שמור על קו ישר בגוף', sets: 8, reps: '20 שניות', rest: '10 שניות' },
    ],
  },
  {
    name: 'סרקיט גוף מלא',
    muscles: 'גוף מלא',
    duration: 40,
    note: '30 שניות מנוחה בין תרגילים, 90 שניות בין סבבים.',
    exercises: [
      { name: 'ברפי', muscles: 'גוף מלא', tip: 'תנועה מלאה ומהירה', sets: 3, reps: '10 חזרות', rest: '30 שניות' },
      { name: 'קפיצת לאנג\'ים', muscles: 'ירכיים, ישבן', tip: 'קפוץ ועבור רגל בין לאנג', sets: 3, reps: '12 לכל רגל', rest: '30 שניות' },
      { name: 'לחיצות', muscles: 'חזה, טריצפס', tip: 'גוף קו ישר', sets: 3, reps: '15 חזרות', rest: '30 שניות' },
      { name: 'ריצה במקום — ברכיים גבוהות', muscles: 'ליבה, קרדיו', tip: 'ברכיים לגובה הישבן, ידיים בתנועת ריצה, קצב מהיר', sets: 3, reps: '30 שניות', rest: '30 שניות' },
      { name: 'קפיצת תיבה / סקוואט', muscles: 'ירכיים, ישבן', tip: 'נחיתה רכה', sets: 3, reps: '10 חזרות', rest: '30 שניות' },
    ],
  },
  {
    name: 'AMRAP 20 דקות',
    muscles: 'גוף מלא',
    duration: 30,
    note: 'כמה שיותר סבבים ב-20 דקות — רשום כמה הגעת ונסה לשפר שבוע הבא.',
    exercises: [
      { name: 'ברפי', muscles: 'גוף מלא', tip: '', sets: 1, reps: '5 חזרות', rest: '-' },
      { name: 'אוויר סקוואט', muscles: 'ירכיים', tip: 'ירד עמוק', sets: 1, reps: '10 חזרות', rest: '-' },
      { name: 'לחיצות', muscles: 'חזה', tip: '', sets: 1, reps: '10 חזרות', rest: '-' },
      { name: 'טיפוס הרים', muscles: 'ליבה', tip: '', sets: 1, reps: '20 חזרות (10 לכל צד)', rest: '-' },
    ],
  },
  {
    name: 'ספרינטים + כוח',
    muscles: 'קרדיו, גוף מלא',
    duration: 35,
    note: 'אינטרוולים: 30 שניות ספרינט / 30 שניות הליכה.',
    exercises: [
      { name: 'חימום ריצה קלה', muscles: '', tip: '', sets: 1, reps: '5 דקות', rest: '-' },
      { name: 'ספרינט / ריצה קלה', muscles: 'קרדיו', tip: 'ספרינט במלוא הכוח, 30 שניות מנוחה הליכה', sets: 8, reps: '30 שניות', rest: '30 שניות הליכה' },
      { name: 'לחיצות', muscles: 'חזה', tip: '', sets: 3, reps: '10 חזרות', rest: '45 שניות' },
      { name: 'ברפי', muscles: 'גוף מלא', tip: '', sets: 3, reps: '8 חזרות', rest: '45 שניות' },
    ],
  },
];

const HIIT_SPLITS = { 2: [0,1], 3: [0,1,2], 4: [0,1,2,3], 5: [0,1,2,3,0], 6: [0,1,2,3,0,1] };

function buildMixed(days) {
  const results = [];
  for (let i = 0; i < days; i++) {
    if (i % 2 === 0) {
      results.push({ ...STRENGTH_SPLITS[2][i % 2], type: 'strength' });
    } else {
      results.push({ ...RUNNING_SPLITS[3][i % 3], type: 'running' });
    }
  }
  return results;
}

export function generatePlan(daysPerWeek, workoutType) {
  const count = Math.min(Math.max(daysPerWeek, 2), 6);
  const activeIndices = DAY_INDICES[count];

  let splits;
  if (workoutType === 'strength') {
    splits = STRENGTH_SPLITS[count].map(s => ({ ...s, type: 'strength' }));
  } else if (workoutType === 'running') {
    splits = (RUNNING_SPLITS[count] ?? RUNNING_SPLITS[3]).map(s => ({ ...s, type: 'running' }));
  } else if (workoutType === 'hiit') {
    splits = HIIT_SPLITS[count].map(i => ({ ...HIIT_WORKOUTS[i], type: 'hiit' }));
  } else {
    splits = buildMixed(count);
  }

  return DAYS.map((day, idx) => {
    const workoutIdx = activeIndices.indexOf(idx);
    if (workoutIdx === -1) return { day, isRest: true };
    return { day, isRest: false, ...splits[workoutIdx], warmup: WARMUP, cooldown: COOLDOWN };
  });
}
