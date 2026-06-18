// מצב "השרת מתעורר" — ב-Render free tier הבקשה הראשונה אחרי חוסר פעילות
// לוקחת ~50 שניות (cold start). כשבקשה נמשכת מעבר לסף, מציגים באנר ידידותי
// כדי שהמשתמש יבין שהאפליקציה לא תקועה אלא מחכה לשרת.

let waking = false;
const listeners = new Set();

export const isWaking = () => waking;

export function onWakingChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setWaking(v) {
  if (waking === v) return;
  waking = v;
  listeners.forEach((fn) => { try { fn(v); } catch (_) {} });
}
