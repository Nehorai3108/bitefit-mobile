import React from 'react';
import Svg, { Circle, Line, Path, Rect, Ellipse } from 'react-native-svg';

// צבעים
const HEAD  = (c) => c;
const BODY  = (c) => c;
const sw    = 2.8; // stroke width

/* ─── עזר: ראש ─────────────────────────────────────────────── */
const Head = ({ cx, cy, r = 7, color }) =>
  <Circle cx={cx} cy={cy} r={r} stroke={color} strokeWidth={sw} fill="none" />;

/* ─── תרגילים ─────────────────────────────────────────────── */

function Squat({ color, size }) {
  // איש בסקוואט — ברכיים כפופות, גב ישר
  return (
    <Svg width={size} height={size} viewBox="0 0 60 70">
      <Head cx={30} cy={8} color={color} />
      {/* גוף */}
      <Line x1={30} y1={15} x2={30} y2={35} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      {/* ירכיים */}
      <Line x1={30} y1={35} x2={18} y2={50} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={30} y1={35} x2={42} y2={50} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      {/* שוקיים — כפופות */}
      <Line x1={18} y1={50} x2={14} y2={64} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={42} y1={50} x2={46} y2={64} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      {/* זרועות קדימה */}
      <Line x1={30} y1={22} x2={16} y2={38} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={30} y1={22} x2={44} y2={38} stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </Svg>
  );
}

function Pushup({ color, size }) {
  // לחיצה — גוף אופקי, מרפקים כפופים
  return (
    <Svg width={size} height={size} viewBox="0 0 80 50">
      <Head cx={68} cy={16} r={6} color={color} />
      {/* גוף אופקי */}
      <Line x1={62} y1={20} x2={20} y2={30} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      {/* ידיים */}
      <Line x1={52} y1={22} x2={48} y2={36} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={48} y1={36} x2={38} y2={38} stroke={color} strokeWidth={sw+1} strokeLinecap="round" />
      {/* רגליים */}
      <Line x1={20} y1={30} x2={14} y2={42} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={20} y1={30} x2={22} y2={43} stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </Svg>
  );
}

function Pullup({ color, size }) {
  // פולאפ — תלוי על מוט
  return (
    <Svg width={size} height={size} viewBox="0 0 60 75">
      {/* מוט */}
      <Line x1={5} y1={8} x2={55} y2={8} stroke={color} strokeWidth={3.5} strokeLinecap="round" />
      <Head cx={30} cy={22} color={color} />
      {/* גוף */}
      <Line x1={30} y1={28} x2={30} y2={52} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      {/* ידיים לצדדים למעלה */}
      <Line x1={30} y1={28} x2={14} y2={10} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={30} y1={28} x2={46} y2={10} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      {/* רגליים */}
      <Line x1={30} y1={52} x2={24} y2={68} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={30} y1={52} x2={36} y2={68} stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </Svg>
  );
}

function Deadlift({ color, size }) {
  // דדליפט — כפוף קדימה, מוט בידיים
  return (
    <Svg width={size} height={size} viewBox="0 0 70 65">
      <Head cx={54} cy={10} r={7} color={color} />
      {/* גוף כפוף */}
      <Line x1={48} y1={16} x2={18} y2={32} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      {/* ידיים למטה */}
      <Line x1={34} y1={24} x2={28} y2={42} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      {/* מוט */}
      <Line x1={10} y1={44} x2={50} y2={44} stroke={color} strokeWidth={3.5} strokeLinecap="round" />
      <Circle cx={10} cy={44} r={4} stroke={color} strokeWidth={sw} fill="none" />
      <Circle cx={50} cy={44} r={4} stroke={color} strokeWidth={sw} fill="none" />
      {/* רגליים */}
      <Line x1={18} y1={32} x2={16} y2={55} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={18} y1={32} x2={28} y2={54} stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </Svg>
  );
}

function ShoulderPress({ color, size }) {
  // לחיצת כתפיים — ידיים למעלה עם מוט
  return (
    <Svg width={size} height={size} viewBox="0 0 60 75">
      <Head cx={30} cy={8} color={color} />
      {/* גוף */}
      <Line x1={30} y1={15} x2={30} y2={45} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      {/* מוט מעל ראש */}
      <Line x1={8} y1={20} x2={52} y2={20} stroke={color} strokeWidth={3.5} strokeLinecap="round" />
      {/* ידיים למעלה */}
      <Line x1={30} y1={22} x2={14} y2={22} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={30} y1={22} x2={46} y2={22} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      {/* רגליים */}
      <Line x1={30} y1={45} x2={22} y2={62} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={30} y1={45} x2={38} y2={62} stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </Svg>
  );
}

function BicepCurl({ color, size }) {
  // כפיפת ביצפס — מרפק כפוף, דמבל
  return (
    <Svg width={size} height={size} viewBox="0 0 55 70">
      <Head cx={28} cy={8} color={color} />
      {/* גוף */}
      <Line x1={28} y1={15} x2={28} y2={42} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      {/* זרוע שמאל ישרה */}
      <Line x1={28} y1={22} x2={42} y2={36} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      {/* זרוע ימין כפופה עם דמבל */}
      <Line x1={28} y1={22} x2={16} y2={30} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={16} y1={30} x2={20} y2={18} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      {/* דמבל */}
      <Line x1={17} y1={13} x2={23} y2={13} stroke={color} strokeWidth={3.5} strokeLinecap="round" />
      {/* רגליים */}
      <Line x1={28} y1={42} x2={22} y2={60} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={28} y1={42} x2={34} y2={60} stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </Svg>
  );
}

function Plank({ color, size }) {
  // פלאנק — גוף ישר, נשען על מרפקים
  return (
    <Svg width={size} height={size} viewBox="0 0 80 45">
      <Head cx={66} cy={14} r={6} color={color} />
      {/* גוף ישר אופקי */}
      <Line x1={60} y1={18} x2={18} y2={26} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      {/* מרפקים */}
      <Line x1={50} y1={20} x2={46} y2={30} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={46} y1={30} x2={36} y2={30} stroke={color} strokeWidth={3} strokeLinecap="round" />
      {/* רגליים */}
      <Line x1={18} y1={26} x2={12} y2={36} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={18} y1={26} x2={20} y2={37} stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </Svg>
  );
}

function Lunge({ color, size }) {
  // לאנג — רגל אחת קדימה, ברך כפופה
  return (
    <Svg width={size} height={size} viewBox="0 0 65 70">
      <Head cx={32} cy={8} color={color} />
      {/* גוף */}
      <Line x1={32} y1={15} x2={32} y2={36} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      {/* ידיים */}
      <Line x1={32} y1={24} x2={20} y2={32} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={32} y1={24} x2={44} y2={32} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      {/* רגל קדמית */}
      <Line x1={32} y1={36} x2={44} y2={50} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={44} y1={50} x2={50} y2={64} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      {/* רגל אחורית — ברך קרובה לרצפה */}
      <Line x1={32} y1={36} x2={22} y2={50} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={22} y1={50} x2={18} y2={36} stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </Svg>
  );
}

function Run({ color, size }) {
  // ריצה — תנוחת ריצה דינמית
  return (
    <Svg width={size} height={size} viewBox="0 0 65 70">
      <Head cx={44} cy={8} color={color} />
      {/* גוף נטוי */}
      <Line x1={40} y1={14} x2={28} y2={34} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      {/* זרוע קדמית */}
      <Line x1={36} y1={20} x2={48} y2={30} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      {/* זרוע אחורית */}
      <Line x1={36} y1={20} x2={22} y2={28} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      {/* רגל קדמית */}
      <Line x1={28} y1={34} x2={40} y2={48} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={40} y1={48} x2={52} y2={56} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      {/* רגל אחורית */}
      <Line x1={28} y1={34} x2={18} y2={48} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={18} y1={48} x2={12} y2={38} stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </Svg>
  );
}

function Row({ color, size }) {
  // חתירה — כפוף, ידיים מושכות
  return (
    <Svg width={size} height={size} viewBox="0 0 70 60">
      <Head cx={54} cy={10} r={7} color={color} />
      {/* גוף כפוף */}
      <Line x1={48} y1={16} x2={20} y2={28} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      {/* ידיים — אחת קרובה לגוף (משיכה) */}
      <Line x1={38} y1={20} x2={32} y2={34} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={38} y1={20} x2={24} y2={16} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      {/* מוט */}
      <Line x1={18} y1={36} x2={38} y2={36} stroke={color} strokeWidth={3.5} strokeLinecap="round" />
      {/* רגליים */}
      <Line x1={20} y1={28} x2={16} y2={50} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={20} y1={28} x2={28} y2={50} stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </Svg>
  );
}

function Core({ color, size }) {
  // כפיפות בטן — גב על רצפה, כפוף למעלה
  return (
    <Svg width={size} height={size} viewBox="0 0 75 50">
      {/* רצפה */}
      <Line x1={5} y1={44} x2={70} y2={44} stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeDasharray="3,3" />
      <Head cx={60} cy={30} r={6} color={color} />
      {/* גוף כפוף */}
      <Line x1={55} y1={35} x2={30} y2={44} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      {/* רגליים כפופות */}
      <Line x1={30} y1={44} x2={20} y2={36} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={20} y1={36} x2={12} y2={44} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={30} y1={44} x2={22} y2={38} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      {/* ידיים מאחורי ראש */}
      <Line x1={55} y1={35} x2={62} y2={22} stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </Svg>
  );
}

function LegRaise({ color, size }) {
  // הרמת רגליים — שוכב, רגליים למעלה
  return (
    <Svg width={size} height={size} viewBox="0 0 80 50">
      <Line x1={5} y1={42} x2={75} y2={42} stroke={color} strokeWidth={1.5} strokeDasharray="3,3" />
      <Head cx={62} cy={36} r={6} color={color} />
      {/* גוף אופקי */}
      <Line x1={56} y1={40} x2={28} y2={42} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      {/* ידיים */}
      <Line x1={50} y1={40} x2={58} y2={42} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      {/* רגליים מורמות */}
      <Line x1={28} y1={42} x2={18} y2={24} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={28} y1={42} x2={22} y2={22} stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </Svg>
  );
}

function Burpee({ color, size }) {
  return <Run color={color} size={size} />;
}

function Generic({ color, size }) {
  // איש עומד עם משקולות
  return (
    <Svg width={size} height={size} viewBox="0 0 55 70">
      <Head cx={28} cy={8} color={color} />
      <Line x1={28} y1={15} x2={28} y2={44} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={28} y1={24} x2={14} y2={32} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={28} y1={24} x2={42} y2={32} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Circle cx={12} cy={32} r={3} stroke={color} strokeWidth={sw} fill="none" />
      <Circle cx={44} cy={32} r={3} stroke={color} strokeWidth={sw} fill="none" />
      <Line x1={28} y1={44} x2={20} y2={62} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={28} y1={44} x2={36} y2={62} stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </Svg>
  );
}

// ─── מיפוי שם → קומפוננט ────────────────────────────────────────────────────

export default function ExerciseIllustration({ name = '', color = '#3a7a4a', size = 64 }) {
  const n = name;
  if (/סקוואט|לגפרס|בולגר/.test(n))              return <Squat           color={color} size={size} />;
  if (/לחיצת חזה|מקבילים|Dips|פרפר/.test(n))     return <Pushup          color={color} size={size} />;
  if (/פולאפ|פולי עליון|משיכת פולי/.test(n))      return <Pullup          color={color} size={size} />;
  if (/דדליפט/.test(n))                           return <Deadlift        color={color} size={size} />;
  if (/כתפיים|לחיצת כתפיים|כריות/.test(n))        return <ShoulderPress   color={color} size={size} />;
  if (/ביצפס|כפיפות.*יד|פטיש/.test(n))           return <BicepCurl       color={color} size={size} />;
  if (/פלאנק/.test(n))                            return <Plank           color={color} size={size} />;
  if (/לאנג/.test(n))                             return <Lunge           color={color} size={size} />;
  if (/ריצה|ספרינט|הליכה|חימום/.test(n))          return <Run             color={color} size={size} />;
  if (/חתיר|גב|שכיבה.*מוט/.test(n))              return <Row             color={color} size={size} />;
  if (/בטן|כפיפות בטן|Russian|סיבוב/.test(n))     return <Core            color={color} size={size} />;
  if (/הרמת רגל|הרמות רגל/.test(n))               return <LegRaise        color={color} size={size} />;
  if (/ברפי|Burpee/.test(n))                      return <Burpee          color={color} size={size} />;
  return <Generic color={color} size={size} />;
}
