// מנגנון התראה גלובלי קטן: כשנוסף/נמחק נתון (אוכל, מים, אימון, מלאי),
// מסכים שמאזינים מתרעננים אוטומטית — בלי שהמשתמש יצטרך לרענן ידנית.
//
// שימוש:
//   notifyDataChanged()            — אחרי הוספה/מחיקה מוצלחת
//   onDataChanged(fn)              — במסך, להירשם לרענון (מחזיר פונקציית ביטול)

const listeners = new Set();

export function onDataChanged(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function notifyDataChanged() {
  listeners.forEach((fn) => {
    try { fn(); } catch (_) {}
  });
}
