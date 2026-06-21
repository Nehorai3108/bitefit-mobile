import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Path, G } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

const SW = 3;   // stroke width רגיל
const SWH = 4;  // stroke width כבד (מוטות)

/* ─── פרימיטיבים ─────────────────────────────────── */
const H  = ({ cx, cy, r = 6, c }) => <Circle cx={cx} cy={cy} r={r} stroke={c} strokeWidth={SW} fill="none" />;
const L  = ({ x1, y1, x2, y2, c, w = SW }) => <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={w} strokeLinecap="round" />;
const Bar = ({ x1, y1, x2, y2, c }) => <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={SWH} strokeLinecap="round" />;

/* ─── גוף עומד בסיסי ─────────────────────────────── */
const Standing = ({ x, c }) => (
  <G>
    <H cx={x} cy={8}  c={c} />
    <L x1={x} y1={14} x2={x}   y2={36} c={c} />
    <L x1={x} y1={22} x2={x-10} y2={32} c={c} />
    <L x1={x} y1={22} x2={x+10} y2={32} c={c} />
    <L x1={x} y1={36} x2={x-8}  y2={54} c={c} />
    <L x1={x} y1={36} x2={x+8}  y2={54} c={c} />
  </G>
);

/* ─── SQUAT ──────────────────────────────────────── */
const SquatUp = ({ x, c }) => <Standing x={x} c={c} />;
const SquatDown = ({ x, c }) => (
  <G>
    <H cx={x} cy={16} c={c} />
    <L x1={x}   y1={22} x2={x}    y2={36} c={c} />
    <L x1={x}   y1={28} x2={x-12} y2={36} c={c} />
    <L x1={x}   y1={28} x2={x+12} y2={36} c={c} />
    <L x1={x}   y1={36} x2={x-14} y2={50} c={c} />
    <L x1={x-14} y1={50} x2={x-10} y2={64} c={c} />
    <L x1={x}   y1={36} x2={x+14} y2={50} c={c} />
    <L x1={x+14} y1={50} x2={x+10} y2={64} c={c} />
  </G>
);

/* ─── PUSHUP ─────────────────────────────────────── */
const PushupUp = ({ c }) => (
  <G>
    <H cx={56} cy={14} r={6} c={c} />
    <L x1={50} y1={19} x2={14} y2={28} c={c} />
    <L x1={44} y1={21} x2={40} y2={33} c={c} />
    <L x1={40} y1={33} x2={22} y2={33} c={c} w={SWH} />
    <L x1={14} y1={28} x2={10} y2={40} c={c} />
    <L x1={14} y1={28} x2={18} y2={40} c={c} />
  </G>
);
const PushupDown = ({ c }) => (
  <G>
    <H cx={56} cy={20} r={6} c={c} />
    <L x1={50} y1={25} x2={14} y2={34} c={c} />
    <L x1={44} y1={27} x2={44} y2={38} c={c} />
    <L x1={44} y1={38} x2={22} y2={38} c={c} w={SWH} />
    <L x1={14} y1={34} x2={10} y2={46} c={c} />
    <L x1={14} y1={34} x2={18} y2={46} c={c} />
  </G>
);

/* ─── PULLUP ─────────────────────────────────────── */
const PullupDown = ({ x, c }) => (
  <G>
    <Bar x1={x-20} y1={6} x2={x+20} y2={6} c={c} />
    <H cx={x} cy={20} c={c} />
    <L x1={x} y1={26} x2={x}    y2={48} c={c} />
    <L x1={x} y1={26} x2={x-14} y2={8}  c={c} />
    <L x1={x} y1={26} x2={x+14} y2={8}  c={c} />
    <L x1={x} y1={48} x2={x-7}  y2={64} c={c} />
    <L x1={x} y1={48} x2={x+7}  y2={64} c={c} />
  </G>
);
const PullupUp = ({ x, c }) => (
  <G>
    <Bar x1={x-20} y1={6} x2={x+20} y2={6} c={c} />
    <H cx={x} cy={12} c={c} />
    <L x1={x} y1={18} x2={x}    y2={40} c={c} />
    <L x1={x} y1={18} x2={x-14} y2={8}  c={c} />
    <L x1={x} y1={18} x2={x+14} y2={8}  c={c} />
    <L x1={x} y1={40} x2={x-7}  y2={56} c={c} />
    <L x1={x} y1={40} x2={x+7}  y2={56} c={c} />
  </G>
);

/* ─── DEADLIFT ───────────────────────────────────── */
const DeadliftDown = ({ c }) => (
  <G>
    <H cx={52} cy={12} r={6} c={c} />
    <L x1={46} y1={17} x2={20} y2={32} c={c} />
    <L x1={34} y1={24} x2={28} y2={42} c={c} />
    <Bar x1={10} y1={44} x2={48} y2={44} c={c} />
    <Circle cx={10} cy={44} r={5} stroke={c} strokeWidth={SW} fill="none" />
    <Circle cx={48} cy={44} r={5} stroke={c} strokeWidth={SW} fill="none" />
    <L x1={20} y1={32} x2={16} y2={54} c={c} />
    <L x1={20} y1={32} x2={28} y2={53} c={c} />
  </G>
);
const DeadliftUp = ({ c }) => (
  <G>
    <H cx={30} cy={8} r={6} c={c} />
    <L x1={30} y1={14} x2={30} y2={36} c={c} />
    <L x1={30} y1={22} x2={18} y2={32} c={c} />
    <L x1={18} y1={32} x2={14} y2={42} c={c} />
    <L x1={30} y1={22} x2={42} y2={32} c={c} />
    <L x1={42} y1={32} x2={46} y2={42} c={c} />
    <Bar x1={12} y1={44} x2={48} y2={44} c={c} />
    <L x1={30} y1={36} x2={22} y2={54} c={c} />
    <L x1={30} y1={36} x2={38} y2={54} c={c} />
  </G>
);

/* ─── SHOULDER PRESS ─────────────────────────────── */
const OHPDown = ({ x, c }) => (
  <G>
    <H cx={x} cy={8} c={c} />
    <L x1={x} y1={14} x2={x}    y2={36} c={c} />
    <Bar x1={x-18} y1={22} x2={x+18} y2={22} c={c} />
    <L x1={x} y1={22} x2={x-14} y2={22} c={c} />
    <L x1={x} y1={22} x2={x+14} y2={22} c={c} />
    <L x1={x} y1={36} x2={x-8}  y2={54} c={c} />
    <L x1={x} y1={36} x2={x+8}  y2={54} c={c} />
  </G>
);
const OHPUp = ({ x, c }) => (
  <G>
    <H cx={x} cy={14} c={c} />
    <L x1={x} y1={20} x2={x}    y2={42} c={c} />
    <Bar x1={x-18} y1={6} x2={x+18} y2={6} c={c} />
    <L x1={x} y1={20} x2={x-16} y2={6}  c={c} />
    <L x1={x} y1={20} x2={x+16} y2={6}  c={c} />
    <L x1={x} y1={42} x2={x-8}  y2={60} c={c} />
    <L x1={x} y1={42} x2={x+8}  y2={60} c={c} />
  </G>
);

/* ─── BICEP CURL ─────────────────────────────────── */
const CurlDown = ({ x, c }) => (
  <G>
    <H cx={x} cy={8} c={c} />
    <L x1={x} y1={14} x2={x}    y2={36} c={c} />
    <L x1={x} y1={24} x2={x-14} y2={40} c={c} />
    <Circle cx={x-14} cy={43} r={3} stroke={c} strokeWidth={SW} fill="none" />
    <L x1={x} y1={24} x2={x+10} y2={32} c={c} />
    <L x1={x} y1={36} x2={x-8}  y2={54} c={c} />
    <L x1={x} y1={36} x2={x+8}  y2={54} c={c} />
  </G>
);
const CurlUp = ({ x, c }) => (
  <G>
    <H cx={x} cy={8} c={c} />
    <L x1={x} y1={14} x2={x}    y2={36} c={c} />
    <L x1={x} y1={24} x2={x-14} y2={18} c={c} />
    <L x1={x-14} y1={24} x2={x-14} y2={18} c={c} />
    <Circle cx={x-14} cy={15} r={3} stroke={c} strokeWidth={SW} fill="none" />
    <L x1={x} y1={24} x2={x+10} y2={32} c={c} />
    <L x1={x} y1={36} x2={x-8}  y2={54} c={c} />
    <L x1={x} y1={36} x2={x+8}  y2={54} c={c} />
  </G>
);

/* ─── PLANK ──────────────────────────────────────── */
const PlankPos = ({ c }) => (
  <G>
    <H cx={62} cy={18} r={6} c={c} />
    <L x1={56} y1={22} x2={16} y2={32} c={c} />
    <L x1={48} y1={24} x2={44} y2={36} c={c} />
    <L x1={44} y1={36} x2={30} y2={36} c={c} w={SWH} />
    <L x1={16} y1={32} x2={10} y2={44} c={c} />
    <L x1={16} y1={32} x2={20} y2={44} c={c} />
  </G>
);
const PlankSide = ({ c }) => (
  <G>
    <H cx={62} cy={18} r={6} c={c} />
    <L x1={56} y1={22} x2={16} y2={32} c={c} />
    <L x1={36} y1={28} x2={28} y2={14} c={c} />
    <L x1={28} y1={14} x2={22} y2={14} c={c} w={SWH} />
    <L x1={16} y1={32} x2={10} y2={44} c={c} />
    <L x1={16} y1={32} x2={20} y2={44} c={c} />
  </G>
);

/* ─── LUNGE ──────────────────────────────────────── */
const LungeUp = ({ x, c }) => <Standing x={x} c={c} />;
const LungeDown = ({ c }) => (
  <G>
    <H cx={32} cy={10} r={6} c={c} />
    <L x1={32} y1={16} x2={32} y2={34} c={c} />
    <L x1={32} y1={24} x2={20} y2={32} c={c} />
    <L x1={32} y1={24} x2={44} y2={32} c={c} />
    <L x1={32} y1={34} x2={46} y2={48} c={c} />
    <L x1={46} y1={48} x2={52} y2={62} c={c} />
    <L x1={32} y1={34} x2={20} y2={48} c={c} />
    <L x1={20} y1={48} x2={16} y2={36} c={c} />
  </G>
);

/* ─── ROW ────────────────────────────────────────── */
const RowStart = ({ c }) => (
  <G>
    <H cx={54} cy={12} r={6} c={c} />
    <L x1={48} y1={18} x2={20} y2={30} c={c} />
    <L x1={36} y1={24} x2={18} y2={38} c={c} />
    <Bar x1={10} y1={40} x2={42} y2={40} c={c} />
    <L x1={20} y1={30} x2={16} y2={52} c={c} />
    <L x1={20} y1={30} x2={28} y2={52} c={c} />
  </G>
);
const RowEnd = ({ c }) => (
  <G>
    <H cx={54} cy={12} r={6} c={c} />
    <L x1={48} y1={18} x2={20} y2={30} c={c} />
    <L x1={36} y1={24} x2={44} y2={32} c={c} />
    <Bar x1={36} y1={34} x2={58} y2={34} c={c} />
    <L x1={20} y1={30} x2={16} y2={52} c={c} />
    <L x1={20} y1={30} x2={28} y2={52} c={c} />
  </G>
);

/* ─── RUNNING ────────────────────────────────────── */
const RunA = ({ c }) => (
  <G>
    <H cx={38} cy={8} r={6} c={c} />
    <L x1={34} y1={14} x2={26} y2={32} c={c} />
    <L x1={30} y1={20} x2={46} y2={28} c={c} />
    <L x1={30} y1={20} x2={18} y2={26} c={c} />
    <L x1={26} y1={32} x2={40} y2={44} c={c} />
    <L x1={40} y1={44} x2={50} y2={54} c={c} />
    <L x1={26} y1={32} x2={16} y2={44} c={c} />
    <L x1={16} y1={44} x2={10} y2={34} c={c} />
  </G>
);
const RunB = ({ c }) => (
  <G>
    <H cx={32} cy={8} r={6} c={c} />
    <L x1={28} y1={14} x2={22} y2={34} c={c} />
    <L x1={26} y1={20} x2={14} y2={30} c={c} />
    <L x1={26} y1={20} x2={40} y2={28} c={c} />
    <L x1={22} y1={34} x2={14} y2={48} c={c} />
    <L x1={14} y1={48} x2={8}  y2={58} c={c} />
    <L x1={22} y1={34} x2={36} y2={46} c={c} />
    <L x1={36} y1={46} x2={46} y2={38} c={c} />
  </G>
);

/* ─── CORE (כפיפות בטן) ───────────────────────────── */
const CoreFlat = ({ c }) => (
  <G>
    <H cx={58} cy={36} r={6} c={c} />
    <L x1={52} y1={40} x2={22} y2={42} c={c} />
    <L x1={52} y1={40} x2={58} y2={42} c={c} />
    <L x1={22} y1={42} x2={12} y2={32} c={c} />
    <L x1={12} y1={32} x2={8}  y2={42} c={c} />
    <L x1={22} y1={42} x2={16} y2={34} c={c} />
  </G>
);
const CoreUp = ({ c }) => (
  <G>
    <H cx={50} cy={22} r={6} c={c} />
    <L x1={44} y1={27} x2={24} y2={40} c={c} />
    <L x1={50} y1={25} x2={56} y2={36} c={c} />
    <L x1={24} y1={40} x2={14} y2={30} c={c} />
    <L x1={14} y1={30} x2={8}  y2={42} c={c} />
    <L x1={24} y1={40} x2={16} y2={32} c={c} />
  </G>
);

/* ─── LEG RAISE ──────────────────────────────────── */
const LegRaiseDown = ({ c }) => (
  <G>
    <H cx={58} cy={36} r={6} c={c} />
    <L x1={52} y1={40} x2={18} y2={42} c={c} />
    <L x1={52} y1={40} x2={60} y2={42} c={c} />
    <L x1={18} y1={42} x2={8}  y2={42} c={c} />
    <L x1={18} y1={42} x2={10} y2={42} c={c} />
  </G>
);
const LegRaiseUp = ({ c }) => (
  <G>
    <H cx={58} cy={36} r={6} c={c} />
    <L x1={52} y1={40} x2={18} y2={42} c={c} />
    <L x1={52} y1={40} x2={60} y2={42} c={c} />
    <L x1={18} y1={42} x2={6}  y2={20} c={c} />
    <L x1={18} y1={42} x2={10} y2={18} c={c} />
  </G>
);

/* ─── Arrow ──────────────────────────────────────── */
const Arrow = ({ color }) => (
  <Svg width={24} height={64} viewBox="0 0 24 64">
    <Line x1={12} y1={16} x2={12} y2={48} stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1={12} y1={48} x2={6}  y2={38} stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1={12} y1={48} x2={18} y2={38} stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

/* ─── PAIRS MAP ──────────────────────────────────── */
const PAIRS = {
  squat:    (c,s) => [<Svg width={s} height={s} viewBox="0 0 60 68"><SquatUp    x={30} c={c} /></Svg>, <Svg width={s} height={s} viewBox="0 0 60 68"><SquatDown  x={30} c={c} /></Svg>],
  pushup:   (c,s) => [<Svg width={s} height={s} viewBox="0 0 70 55"><PushupUp       c={c} /></Svg>, <Svg width={s} height={s} viewBox="0 0 70 55"><PushupDown      c={c} /></Svg>],
  pullup:   (c,s) => [<Svg width={s} height={s} viewBox="0 0 60 70"><PullupDown x={30} c={c} /></Svg>, <Svg width={s} height={s} viewBox="0 0 60 70"><PullupUp   x={30} c={c} /></Svg>],
  deadlift: (c,s) => [<Svg width={s} height={s} viewBox="0 0 65 60"><DeadliftDown   c={c} /></Svg>, <Svg width={s} height={s} viewBox="0 0 65 60"><DeadliftUp      c={c} /></Svg>],
  ohp:      (c,s) => [<Svg width={s} height={s} viewBox="0 0 65 66"><OHPDown    x={30} c={c} /></Svg>, <Svg width={s} height={s} viewBox="0 0 65 66"><OHPUp      x={30} c={c} /></Svg>],
  curl:     (c,s) => [<Svg width={s} height={s} viewBox="0 0 55 60"><CurlDown   x={28} c={c} /></Svg>, <Svg width={s} height={s} viewBox="0 0 55 60"><CurlUp     x={28} c={c} /></Svg>],
  plank:    (c,s) => [<Svg width={s} height={s} viewBox="0 0 75 55"><PlankPos       c={c} /></Svg>, <Svg width={s} height={s} viewBox="0 0 75 55"><PlankSide       c={c} /></Svg>],
  lunge:    (c,s) => [<Svg width={s} height={s} viewBox="0 0 65 68"><LungeUp    x={30} c={c} /></Svg>, <Svg width={s} height={s} viewBox="0 0 65 68"><LungeDown      c={c} /></Svg>],
  row:      (c,s) => [<Svg width={s} height={s} viewBox="0 0 65 58"><RowStart       c={c} /></Svg>, <Svg width={s} height={s} viewBox="0 0 65 58"><RowEnd          c={c} /></Svg>],
  run:      (c,s) => [<Svg width={s} height={s} viewBox="0 0 58 64"><RunA           c={c} /></Svg>, <Svg width={s} height={s} viewBox="0 0 58 64"><RunB            c={c} /></Svg>],
  core:     (c,s) => [<Svg width={s} height={s} viewBox="0 0 70 55"><CoreFlat       c={c} /></Svg>, <Svg width={s} height={s} viewBox="0 0 70 55"><CoreUp          c={c} /></Svg>],
  legraise: (c,s) => [<Svg width={s} height={s} viewBox="0 0 70 55"><LegRaiseDown   c={c} /></Svg>, <Svg width={s} height={s} viewBox="0 0 70 55"><LegRaiseUp      c={c} /></Svg>],
};

function pickPair(name) {
  const n = name || '';
  if (/סקוואט|לגפרס|בולגר/.test(n))                return 'squat';
  if (/לחיצת חזה|פרפר|מקבילים|לחיצות/.test(n))    return 'pushup';
  if (/פולאפ|פולי עליון|משיכת פולי/.test(n))       return 'pullup';
  if (/דדליפט/.test(n))                            return 'deadlift';
  if (/כתפיים|לחיצת כתפיים|כריות/.test(n))         return 'ohp';
  if (/ביצפס|כפיפות.*יד|פטיש/.test(n))            return 'curl';
  if (/פלאנק/.test(n))                             return 'plank';
  if (/לאנג/.test(n))                              return 'lunge';
  if (/חתיר|שכיבה.*מוט/.test(n))                  return 'row';
  if (/ריצה|ספרינט|הליכה|ברפי|קפיצה/.test(n))     return 'run';
  if (/בטן|כפיפות בטן|סיבוב|Russian/.test(n))      return 'core';
  if (/הרמת רגל|הרמות רגל/.test(n))                return 'legraise';
  return null;
}

/* ─── Small icon (single pose) ──────────────────── */
export function ExerciseIcon({ name, color, size = 44 }) {
  const key = pickPair(name);
  if (!key) return null;
  const [A] = PAIRS[key](color, size);
  return A;
}

/* ─── Full two-pose illustration ────────────────── */
export default function ExerciseIllustration({ name, color = '#3a7a4a', size = 90 }) {
  const key = pickPair(name);
  if (!key) return null;
  const [A, B] = PAIRS[key](color, size);

  return (
    <View style={st.row}>
      <View style={[st.frame, { backgroundColor: color + '10' }]}>{A}</View>
      <View style={st.arrow}>
        <Arrow color={color} />
      </View>
      <View style={[st.frame, { backgroundColor: color + '10' }]}>{B}</View>
    </View>
  );
}

const st = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 8 },
  frame: { borderRadius: 14, padding: 6, alignItems: 'center', justifyContent: 'center' },
  arrow: { alignItems: 'center', justifyContent: 'center' },
});
