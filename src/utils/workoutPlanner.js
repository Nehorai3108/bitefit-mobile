// ─── Workout Plan Generator ───────────────────────────────────────────────────

const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

// אילו ימים בשבוע יהיו אימון (מחולקים שווה)
const DAY_INDICES = {
  2: [0, 3],
  3: [0, 2, 4],
  4: [0, 1, 3, 4],
  5: [0, 1, 2, 3, 4],
  6: [0, 1, 2, 3, 4, 5],
};

// ─── תכניות כוח ──────────────────────────────────────────────────────────────

const STRENGTH_SPLITS = {
  2: [
    {
      name: 'גוף מלא A',
      duration: 55,
      exercises: [
        { name: 'סקוואט', sets: 4, reps: '8-10', note: 'גב ישר, ברכיים מעל אצבעות' },
        { name: 'לחיצת חזה בשכיבה', sets: 4, reps: '8-10', note: 'מרפקים ב-45 מעלות' },
        { name: 'חתירה עם משקולת', sets: 3, reps: '10-12', note: 'גב שטוח, כיפוף מהמרפק' },
        { name: 'לחיצת כתפיים', sets: 3, reps: '10-12' },
        { name: 'כפיפות בטן', sets: 3, reps: '15-20' },
        { name: 'פלאנק', sets: 3, reps: '45 שניות' },
      ],
    },
    {
      name: 'גוף מלא B',
      duration: 55,
      exercises: [
        { name: 'דדליפט רומני', sets: 4, reps: '8-10', note: 'גב שטוח, הרגשת מתיחה בירכיים' },
        { name: 'משיכת פולי עליון', sets: 4, reps: '10-12', note: 'אפשר תחליף בפולאפ' },
        { name: 'לחיצת חזה בשיפוע', sets: 3, reps: '10-12' },
        { name: 'לאנג\'ים', sets: 3, reps: '12 כל רגל' },
        { name: 'כריות כתפיים צדדיות', sets: 3, reps: '12-15' },
        { name: 'טריצפס פושדאון', sets: 3, reps: '12-15' },
      ],
    },
  ],
  3: [
    {
      name: 'Push — חזה, כתפיים, טריצפס',
      duration: 60,
      exercises: [
        { name: 'לחיצת חזה שטוח', sets: 4, reps: '6-10', note: 'תרגיל מרכזי — מלא כוח' },
        { name: 'לחיצת חזה בשיפוע', sets: 3, reps: '10-12' },
        { name: 'לחיצת כתפיים עם משקולות', sets: 3, reps: '10-12' },
        { name: 'כריות כתפיים קדמיות', sets: 3, reps: '12-15' },
        { name: 'כריות כתפיים צדדיות', sets: 3, reps: '12-15' },
        { name: 'דחיקת טריצפס (skull crusher)', sets: 3, reps: '12-15' },
        { name: 'טריצפס פושדאון', sets: 3, reps: '15' },
      ],
    },
    {
      name: 'Pull — גב, ביצפס',
      duration: 60,
      exercises: [
        { name: 'דדליפט', sets: 4, reps: '5-8', note: 'תרגיל מלך — טכניקה לפני משקל' },
        { name: 'פולאפ / משיכת פולי עליון', sets: 4, reps: '6-10' },
        { name: 'חתירה בשכיבה', sets: 3, reps: '10-12' },
        { name: 'חתירה ביחיד עם דמבל', sets: 3, reps: '12 כל יד' },
        { name: 'כריות כתפיים אחוריות', sets: 3, reps: '15' },
        { name: 'כפיפות ביצפס עם דמבלים', sets: 3, reps: '12-15' },
        { name: 'פטיש (Hammer curl)', sets: 2, reps: '12 כל יד' },
      ],
    },
    {
      name: 'Legs — רגליים, פלג גוף תחתון',
      duration: 65,
      exercises: [
        { name: 'סקוואט', sets: 4, reps: '6-10', note: 'ירידה עמוקה, פיזור משקל בכל כף הרגל' },
        { name: 'לגפרס', sets: 4, reps: '10-12' },
        { name: 'דדליפט רומני', sets: 3, reps: '10-12', note: 'מתיחת ירכיים' },
        { name: 'לאנג\'ים הליכה', sets: 3, reps: '12 כל רגל' },
        { name: 'כפיפות רגל שוכב', sets: 3, reps: '12-15' },
        { name: 'עלייה על בהונות (עגל)', sets: 4, reps: '15-20' },
        { name: 'פלאנק + כפיפות בטן', sets: 3, reps: '20 + 60 שניות' },
      ],
    },
  ],
  4: [
    {
      name: 'פלג עליון א — כוח',
      duration: 60,
      exercises: [
        { name: 'לחיצת חזה שטוח', sets: 4, reps: '5-8', note: 'כוח מקסימלי' },
        { name: 'פולאפ / פולי עליון', sets: 4, reps: '6-8' },
        { name: 'לחיצת כתפיים עומד', sets: 3, reps: '6-8' },
        { name: 'חתירה לסנטר', sets: 3, reps: '8-10' },
        { name: 'כפיפות ביצפס עם בר', sets: 3, reps: '8-10' },
        { name: 'דחיקת טריצפס בשכיבה', sets: 3, reps: '8-10' },
      ],
    },
    {
      name: 'פלג תחתון א — כוח',
      duration: 60,
      exercises: [
        { name: 'סקוואט', sets: 5, reps: '4-6', note: 'עבודה כבדה' },
        { name: 'דדליפט רומני', sets: 4, reps: '6-8' },
        { name: 'לגפרס', sets: 3, reps: '8-10' },
        { name: 'כפיפות רגל', sets: 3, reps: '10-12' },
        { name: 'עגל בעמידה', sets: 4, reps: '15-20' },
      ],
    },
    {
      name: 'פלג עליון ב — נפח',
      duration: 55,
      exercises: [
        { name: 'לחיצת חזה שיפוע', sets: 4, reps: '10-12' },
        { name: 'חתירה ביחיד עם דמבל', sets: 4, reps: '12 כל יד' },
        { name: 'כריות כתפיים צדדיות', sets: 4, reps: '12-15' },
        { name: 'פרפר עם דמבלים', sets: 3, reps: '12-15' },
        { name: 'כפיפות ביצפס ריכוז', sets: 3, reps: '12 כל יד' },
        { name: 'טריצפס פושדאון', sets: 3, reps: '15' },
        { name: 'כריות כתפיים אחוריות', sets: 3, reps: '15' },
      ],
    },
    {
      name: 'פלג תחתון ב + ליבה',
      duration: 60,
      exercises: [
        { name: 'דדליפט', sets: 4, reps: '5-6', note: 'תרגיל פותח — כוח' },
        { name: 'לאנג\'ים הליכה', sets: 3, reps: '12 כל רגל' },
        { name: 'בולגרי ספליט סקוואט', sets: 3, reps: '10 כל רגל' },
        { name: 'עגל יושב', sets: 4, reps: '20' },
        { name: 'פלאנק', sets: 3, reps: '60 שניות' },
        { name: 'כפיפות בטן על כדור', sets: 3, reps: '20' },
        { name: 'סיבובי גזע', sets: 3, reps: '20' },
      ],
    },
  ],
  5: [
    {
      name: 'דחיפה — חזה, כתפיים, טריצפס',
      duration: 60,
      exercises: [
        { name: 'לחיצת חזה שטוח', sets: 4, reps: '6-10' },
        { name: 'לחיצת חזה שיפוע', sets: 3, reps: '10-12' },
        { name: 'לחיצת כתפיים', sets: 4, reps: '8-10' },
        { name: 'כריות כתפיים צדדיות', sets: 3, reps: '15' },
        { name: 'דחיקת טריצפס', sets: 3, reps: '12' },
        { name: 'מקבילים', sets: 3, reps: 'עד כישלון' },
      ],
    },
    {
      name: 'משיכה — גב, ביצפס',
      duration: 60,
      exercises: [
        { name: 'דדליפט', sets: 4, reps: '5-6' },
        { name: 'פולאפ', sets: 4, reps: 'עד כישלון' },
        { name: 'חתירה ביחיד', sets: 3, reps: '12 כל יד' },
        { name: 'פרפר הפוך עם דמבלים', sets: 3, reps: '15' },
        { name: 'כפיפות ביצפס', sets: 3, reps: '12' },
        { name: 'פטיש', sets: 2, reps: '12 כל יד' },
      ],
    },
    {
      name: 'רגליים — פלג תחתון',
      duration: 65,
      exercises: [
        { name: 'סקוואט', sets: 5, reps: '5-8' },
        { name: 'לגפרס', sets: 4, reps: '10-12' },
        { name: 'דדליפט רומני', sets: 3, reps: '10' },
        { name: 'לאנג\'ים הליכה', sets: 3, reps: '12 כל רגל' },
        { name: 'עגל בעמידה', sets: 4, reps: '20' },
      ],
    },
    {
      name: 'פלג עליון — נפח',
      duration: 55,
      exercises: [
        { name: 'לחיצת חזה שיפוע עם דמבלים', sets: 4, reps: '12' },
        { name: 'חתירה בשכיבה', sets: 4, reps: '12' },
        { name: 'כריות כתפיים', sets: 4, reps: '15' },
        { name: 'מקבילים', sets: 3, reps: 'עד כישלון' },
        { name: 'סופרסט: ביצפס + טריצפס', sets: 3, reps: '12+12' },
      ],
    },
    {
      name: 'ליבה + אינטרוולים',
      duration: 40,
      exercises: [
        { name: 'פלאנק', sets: 4, reps: '60 שניות' },
        { name: 'טיפוס הרים', sets: 3, reps: '30 שניות' },
        { name: 'סיבובי גזע', sets: 3, reps: '20' },
        { name: 'ברפי', sets: 3, reps: '10' },
        { name: 'הרמות רגליים', sets: 3, reps: '15' },
        { name: 'קיפולי V', sets: 3, reps: '12' },
      ],
    },
  ],
  6: [
    { name: 'דחיפה א — כוח', duration: 60, exercises: [{ name: 'לחיצת חזה שטוח', sets: 5, reps: '5' }, { name: 'לחיצת חזה שיפוע', sets: 4, reps: '8' }, { name: 'לחיצת כתפיים', sets: 4, reps: '8' }, { name: 'כריות כתפיים צדדיות', sets: 3, reps: '15' }, { name: 'מקבילים', sets: 3, reps: 'עד כישלון' }] },
    { name: 'משיכה א — כוח', duration: 60, exercises: [{ name: 'דדליפט', sets: 5, reps: '5' }, { name: 'פולאפ', sets: 4, reps: 'עד כישלון' }, { name: 'חתירה בשכיבה', sets: 4, reps: '8' }, { name: 'כפיפות ביצפס', sets: 3, reps: '10' }] },
    { name: 'רגליים א', duration: 65, exercises: [{ name: 'סקוואט', sets: 5, reps: '5' }, { name: 'לגפרס', sets: 4, reps: '10' }, { name: 'דדליפט רומני', sets: 3, reps: '10' }, { name: 'עגל בעמידה', sets: 4, reps: '20' }] },
    { name: 'דחיפה ב — נפח', duration: 55, exercises: [{ name: 'לחיצת חזה שיפוע דמבלים', sets: 4, reps: '12' }, { name: 'פרפר עם דמבלים', sets: 3, reps: '12' }, { name: 'כריות כתפיים', sets: 4, reps: '15' }, { name: 'טריצפס פושדאון', sets: 3, reps: '15' }] },
    { name: 'משיכה ב — נפח', duration: 55, exercises: [{ name: 'חתירה ביחיד עם דמבל', sets: 4, reps: '12 כל יד' }, { name: 'פרפר הפוך', sets: 3, reps: '15' }, { name: 'כפיפות ביצפס ריכוז', sets: 3, reps: '12 כל יד' }, { name: 'פטיש', sets: 2, reps: '12 כל יד' }] },
    { name: 'רגליים ב + ליבה', duration: 60, exercises: [{ name: 'בולגרי ספליט סקוואט', sets: 4, reps: '10 כל רגל' }, { name: 'לאנג\'ים הליכה', sets: 3, reps: '12 כל רגל' }, { name: 'כפיפות רגל', sets: 3, reps: '15' }, { name: 'פלאנק', sets: 3, reps: '60 שניות' }] },
  ],
};

// ─── תכניות ריצה ─────────────────────────────────────────────────────────────

const RUNNING_SPLITS = {
  2: [
    { name: 'ריצה קלה', duration: 35, exercises: [{ name: 'חימום הליכה', sets: 1, reps: '5 דקות' }, { name: 'ריצה בקצב 5:30–6:30/ק"מ', sets: 1, reps: '25 דקות' }, { name: 'שחרור הליכה', sets: 1, reps: '5 דקות' }], note: 'קצב שיחה — אפשר לדבר בלי לנשוף' },
    { name: 'ריצה ארוכה', duration: 60, exercises: [{ name: 'חימום קל', sets: 1, reps: '10 דקות' }, { name: 'ריצה בקצב 6:00–7:00/ק"מ', sets: 1, reps: '45 דקות' }, { name: 'שחרור', sets: 1, reps: '5 דקות' }], note: 'המרחק חשוב יותר מהמהירות' },
  ],
  3: [
    { name: 'ריצה קלה', duration: 35, exercises: [{ name: 'חימום', sets: 1, reps: '5 דקות' }, { name: 'ריצה קלה 5:30–6:30', sets: 1, reps: '25 דקות' }, { name: 'שחרור', sets: 1, reps: '5 דקות' }], note: 'קצב שיחה' },
    { name: 'אינטרוולים', duration: 45, exercises: [{ name: 'חימום ריצה קלה', sets: 1, reps: '10 דקות' }, { name: 'ספרינט 400מ\'', sets: 6, reps: '400 מטר', note: '90 שניות מנוחה בין סטים' }, { name: 'ריצת קירור', sets: 1, reps: '10 דקות' }], note: 'מאמץ גבוה — 85–90% מהמקסימום' },
    { name: 'ריצה ארוכה', duration: 60, exercises: [{ name: 'חימום', sets: 1, reps: '10 דקות' }, { name: 'ריצה אחידה 6:00–7:00', sets: 1, reps: '45 דקות' }, { name: 'שחרור', sets: 1, reps: '5 דקות' }] },
  ],
  4: [
    { name: 'ריצה קלה', duration: 35, exercises: [{ name: 'חימום', sets: 1, reps: '5 דקות' }, { name: 'ריצה קלה', sets: 1, reps: '25 דקות' }, { name: 'שחרור', sets: 1, reps: '5 דקות' }] },
    { name: 'טמפו', duration: 45, exercises: [{ name: 'חימום ריצה קלה', sets: 1, reps: '10 דקות' }, { name: 'ריצת טמפו 4:30–5:00/ק"מ', sets: 1, reps: '20 דקות', note: 'אי נוח אבל שליטה' }, { name: 'קירור', sets: 1, reps: '10 דקות' }] },
    { name: 'אינטרוולים', duration: 50, exercises: [{ name: 'חימום', sets: 1, reps: '10 דקות' }, { name: 'ספרינט 800מ\'', sets: 5, reps: '800 מטר', note: '2 דקות מנוחה בין סטים' }, { name: 'קירור', sets: 1, reps: '10 דקות' }] },
    { name: 'ריצה ארוכה', duration: 70, exercises: [{ name: 'חימום', sets: 1, reps: '10 דקות' }, { name: 'ריצה 6:00–7:00', sets: 1, reps: '55 דקות' }, { name: 'שחרור', sets: 1, reps: '5 דקות' }] },
  ],
  5: [
    { name: 'ריצה קלה', duration: 30, exercises: [{ name: 'ריצה קלה', sets: 1, reps: '30 דקות' }] },
    { name: 'טמפו', duration: 45, exercises: [{ name: 'חימום 10 דק\'', sets: 1, reps: '' }, { name: 'טמפו 20–25 דקות', sets: 1, reps: '' }, { name: 'קירור 10 דק\'', sets: 1, reps: '' }] },
    { name: 'ריצה קלה', duration: 35, exercises: [{ name: 'ריצה קלה לשחרור', sets: 1, reps: '35 דקות' }] },
    { name: 'אינטרוולים', duration: 50, exercises: [{ name: 'חימום', sets: 1, reps: '10 דקות' }, { name: '400מ\' ספרינט', sets: 8, reps: '400 מטר', note: '75 שניות מנוחה' }, { name: 'קירור', sets: 1, reps: '10 דקות' }] },
    { name: 'ריצה ארוכה', duration: 75, exercises: [{ name: 'ריצה ארוכה שיחה', sets: 1, reps: '70–75 דקות' }] },
  ],
  6: [
    { name: 'ריצה קלה', duration: 30, exercises: [{ name: 'ריצה קלה', sets: 1, reps: '30 דקות' }] },
    { name: 'טמפו קצר', duration: 35, exercises: [{ name: 'חימום 5 דק\'', sets: 1, reps: '' }, { name: 'טמפו 20 דקות', sets: 1, reps: '' }, { name: 'קירור 10 דק\'', sets: 1, reps: '' }] },
    { name: 'ריצה בינונית', duration: 45, exercises: [{ name: 'ריצה 45 דקות קצב נוח', sets: 1, reps: '' }] },
    { name: 'אינטרוולים קצרים', duration: 40, exercises: [{ name: 'חימום', sets: 1, reps: '10 דקות' }, { name: '200מ\' ספרינט', sets: 10, reps: '200 מטר', note: '60 שניות מנוחה' }, { name: 'קירור', sets: 1, reps: '10 דקות' }] },
    { name: 'ריצה קלה', duration: 30, exercises: [{ name: 'ריצה קלה לשחרור', sets: 1, reps: '30 דקות' }] },
    { name: 'ריצה ארוכה', duration: 80, exercises: [{ name: 'ריצה ארוכה', sets: 1, reps: '75–80 דקות' }] },
  ],
};

// ─── תכניות HIIT ──────────────────────────────────────────────────────────────

const HIIT_WORKOUTS = [
  {
    name: 'Tabata אינטנסיבי',
    duration: 30,
    exercises: [
      { name: 'ברפי', sets: 8, reps: '20 שניות עבודה / 10 שניות מנוחה' },
      { name: 'Jump squats', sets: 8, reps: '20/10' },
      { name: 'טיפוס הרים', sets: 8, reps: '20/10' },
      { name: 'Push-ups מהירים', sets: 8, reps: '20/10' },
    ],
    note: 'מנוחה 1 דקה בין תרגילים',
  },
  {
    name: 'Circuit Training',
    duration: 35,
    exercises: [
      { name: 'ברפי', sets: 3, reps: '10' },
      { name: 'Jump lunges', sets: 3, reps: '12 כל רגל' },
      { name: 'Push-ups', sets: 3, reps: '15' },
      { name: 'High knees', sets: 3, reps: '30 שניות' },
      { name: 'Plank to downdog', sets: 3, reps: '10' },
      { name: 'Box jumps / jump squats', sets: 3, reps: '10' },
    ],
    note: '30 שניות מנוחה בין תרגילים, 90 שניות בין סטים',
  },
  {
    name: 'AMRAP 20 דקות',
    duration: 30,
    exercises: [
      { name: 'ברפי', sets: 1, reps: '5' },
      { name: 'Air squats', sets: 1, reps: '10' },
      { name: 'Push-ups', sets: 1, reps: '10' },
      { name: 'טיפוס הרים', sets: 1, reps: '20 (10 כל צד)' },
    ],
    note: 'כמה שיותר סבבים ב-20 דקות ללא הפסקה',
  },
  {
    name: 'Cardio HIIT ריצה',
    duration: 25,
    exercises: [
      { name: 'חימום ריצה קלה', sets: 1, reps: '5 דקות' },
      { name: 'ספרינט / ריצה קלה', sets: 8, reps: '30 שניות ספרינט / 30 שניות קלה' },
      { name: 'קירור ריצה קלה', sets: 1, reps: '5 דקות' },
    ],
    note: '8x30/30 — פשוט ויעיל מאוד',
  },
];

const HIIT_SPLITS = {
  2: [0, 1],
  3: [0, 1, 2],
  4: [0, 1, 2, 3],
  5: [0, 1, 2, 3, 0],
  6: [0, 1, 2, 3, 0, 1],
};

// ─── תכנית מעורבת (כוח + ריצה) ───────────────────────────────────────────────

function buildMixed(days) {
  const workouts = [];
  for (let i = 0; i < days; i++) {
    if (i % 2 === 0) {
      // ימים זוגיים — כוח (גוף מלא)
      const split = STRENGTH_SPLITS[2][i % 2 === 0 ? 0 : 1];
      workouts.push({ ...split, type: 'strength' });
    } else {
      // ימים אי-זוגיים — ריצה
      const run = RUNNING_SPLITS[3][i % 3];
      workouts.push({ ...run, type: 'running' });
    }
  }
  return workouts;
}

// ─── Main Generator ───────────────────────────────────────────────────────────

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
    if (workoutIdx === -1) {
      return { day, isRest: true };
    }
    return {
      day,
      isRest: false,
      ...splits[workoutIdx],
    };
  });
}
