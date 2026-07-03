/**
 * ExerciseIllustration — stick-figure exercise poses (v3)
 * Design principles:
 *  - Hanging legs: close together, natural dangle
 *  - Standing: shoulder-width, not splayed
 *  - Side views for lying/bent exercises
 *  - Maximum clarity on the ONE joint that changes between poses
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Line, G } from 'react-native-svg';

const SW  = 5;
const SWH = 7;
const JR  = 4;
const HR  = 9;

const Hd  = ({ x, y, c })             => <Circle cx={x} cy={y} r={HR} fill={c} />;
const Ln  = ({ x1,y1,x2,y2,c,w=SW }) => <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={w} strokeLinecap="round" />;
const Jt  = ({ x, y, c })             => <Circle cx={x} cy={y} r={JR} fill={c} />;
const Bar = ({ x1,y1,x2,y2,c })       => <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={SWH} strokeLinecap="round" />;
const Pl  = ({ cx, cy, c })            => <Circle cx={cx} cy={cy} r={7} stroke={c} strokeWidth={3} fill="none" />;
const Gnd = ({ c })                    => <Line x1={8} y1={115} x2={92} y2={115} stroke={c} strokeWidth={2} strokeLinecap="round" opacity={0.3} />;
const Db  = ({ cx, cy, c }) => (
  <G>
    <Circle cx={cx-6} cy={cy} r={5} stroke={c} strokeWidth={3} fill="none" />
    <Line   x1={cx-6} y1={cy} x2={cx+6} y2={cy} stroke={c} strokeWidth={4} strokeLinecap="round" />
    <Circle cx={cx+6} cy={cy} r={5} stroke={c} strokeWidth={3} fill="none" />
  </G>
);

/* ── Shared body parts ──────────────────────────────────── */

// Standing legs, shoulder-width — parameters: hipX = center hip X, hipY
const Legs = ({ hx=50, hy=56, c }) => (
  <G>
    <Jt x={hx-6} y={hy} c={c} /><Jt x={hx+6} y={hy} c={c} />
    <Ln x1={hx-6} y1={hy}   x2={hx-8}  y2={hy+28} c={c} />
    <Jt x={hx-8}  y={hy+28} c={c} />
    <Ln x1={hx-8} y1={hy+28} x2={hx-10} y2={hy+56} c={c} />
    <Ln x1={hx+6} y1={hy}   x2={hx+8}  y2={hy+28} c={c} />
    <Jt x={hx+8}  y={hy+28} c={c} />
    <Ln x1={hx+8} y1={hy+28} x2={hx+10} y2={hy+56} c={c} />
  </G>
);

// Hanging legs — close together, slight bend
const HangLegs = ({ hx=50, hy=54, c }) => (
  <G>
    <Jt x={hx-5} y={hy} c={c} /><Jt x={hx+5} y={hy} c={c} />
    <Ln x1={hx-5} y1={hy}   x2={hx-6}  y2={hy+28} c={c} />
    <Jt x={hx-6}  y={hy+28} c={c} />
    <Ln x1={hx-6} y1={hy+28} x2={hx-5}  y2={hy+52} c={c} />
    <Ln x1={hx+5} y1={hy}   x2={hx+6}  y2={hy+28} c={c} />
    <Jt x={hx+6}  y={hy+28} c={c} />
    <Ln x1={hx+6} y1={hy+28} x2={hx+5}  y2={hy+52} c={c} />
  </G>
);

// Torso + shoulder line
const Torso = ({ sx=50, sy=26, ex=50, ey=56, lsx=38, rsx=62, c }) => (
  <G>
    <Jt x={lsx} y={sy+2} c={c} /><Jt x={rsx} y={sy+2} c={c} />
    <Ln x1={lsx} y1={sy+2} x2={sx} y2={sy} c={c} />
    <Ln x1={rsx} y1={sy+2} x2={sx} y2={sy} c={c} />
    <Ln x1={sx}  y1={sy}   x2={ex} y2={ey} c={c} />
  </G>
);

/* ─────────────────────────────────────────────────────────
   SQUAT
───────────────────────────────────────────────────────── */
const SquatStand = ({ c }) => (
  <G>
    <Gnd c={c} />
    <Hd x={50} y={12} c={c} />
    <Torso sy={22} ey={52} c={c} />
    {/* arms relaxed */}
    <Ln x1={38} y1={24} x2={34} y2={46} c={c} /><Jt x={34} y={46} c={c} />
    <Ln x1={34} y1={46} x2={32} y2={62} c={c} />
    <Ln x1={62} y1={24} x2={66} y2={46} c={c} /><Jt x={66} y={46} c={c} />
    <Ln x1={66} y1={46} x2={68} y2={62} c={c} />
    <Legs hx={50} hy={52} c={c} />
  </G>
);

const SquatDown = ({ c }) => (
  <G>
    <Gnd c={c} />
    <Hd x={50} y={32} c={c} />
    {/* torso leans slightly forward */}
    <Jt x={38} y={46} c={c} /><Jt x={62} y={46} c={c} />
    <Ln x1={38} y1={46} x2={50} y2={44} c={c} />
    <Ln x1={62} y1={46} x2={50} y2={44} c={c} />
    <Ln x1={50} y1={44} x2={48} y2={66} c={c} />
    {/* arms forward for balance */}
    <Ln x1={38} y1={46} x2={22} y2={52} c={c} /><Jt x={22} y={52} c={c} />
    <Ln x1={22} y1={52} x2={14} y2={58} c={c} />
    <Ln x1={62} y1={46} x2={78} y2={52} c={c} /><Jt x={78} y={52} c={c} />
    <Ln x1={78} y1={52} x2={86} y2={58} c={c} />
    {/* hips low, knees wide */}
    <Jt x={40} y={66} c={c} /><Jt x={56} y={66} c={c} />
    <Ln x1={40} y1={66} x2={48} y2={66} c={c} />
    <Ln x1={56} y1={66} x2={48} y2={66} c={c} />
    <Ln x1={40} y1={66} x2={24} y2={86} c={c} /><Jt x={24} y={86} c={c} />
    <Ln x1={24} y1={86} x2={20} y2={112} c={c} />
    <Ln x1={56} y1={66} x2={72} y2={86} c={c} /><Jt x={72} y={86} c={c} />
    <Ln x1={72} y1={86} x2={76} y2={112} c={c} />
  </G>
);

/* ─────────────────────────────────────────────────────────
   PULLUP  — front view, arms close to parallel
───────────────────────────────────────────────────────── */
const PullupHang = ({ c }) => (
  <G>
    {/* bar */}
    <Bar x1={14} y1={8} x2={86} y2={8} c={c} />
    {/* head below bar, body hanging */}
    <Hd x={50} y={28} c={c} />
    {/* arms: nearly parallel, elbows fully extended */}
    <Jt x={34} y={10} c={c} /><Jt x={66} y={10} c={c} />
    <Ln x1={34} y1={10} x2={36} y2={28} c={c} /><Jt x={36} y={28} c={c} />
    <Ln x1={36} y1={28} x2={40} y2={38} c={c} />
    <Ln x1={66} y1={10} x2={64} y2={28} c={c} /><Jt x={64} y={28} c={c} />
    <Ln x1={64} y1={28} x2={60} y2={38} c={c} />
    {/* torso */}
    <Ln x1={50} y1={36} x2={50} y2={62} c={c} />
    {/* legs together, hanging straight */}
    <HangLegs hx={50} hy={62} c={c} />
  </G>
);

const PullupTop = ({ c }) => (
  <G>
    <Bar x1={14} y1={8} x2={86} y2={8} c={c} />
    {/* chin above bar */}
    <Hd x={50} y={6} c={c} />
    {/* arms bent — elbows INSIDE the hands, pulled down */}
    <Jt x={34} y={10} c={c} /><Jt x={66} y={10} c={c} />
    <Jt x={40} y={26} c={c} /><Jt x={60} y={26} c={c} />
    <Ln x1={34} y1={10} x2={40} y2={26} c={c} />
    <Ln x1={66} y1={10} x2={60} y2={26} c={c} />
    {/* forearms to shoulders */}
    <Jt x={42} y={36} c={c} /><Jt x={58} y={36} c={c} />
    <Ln x1={40} y1={26} x2={42} y2={36} c={c} />
    <Ln x1={60} y1={26} x2={58} y2={36} c={c} />
    {/* torso */}
    <Ln x1={50} y1={16} x2={50} y2={60} c={c} />
    {/* legs */}
    <HangLegs hx={50} hy={60} c={c} />
  </G>
);

/* ─────────────────────────────────────────────────────────
   BENCH PRESS — side view
───────────────────────────────────────────────────────── */
// Start: bar at chest, elbows bent ~90°
const BenchDown = ({ c }) => (
  <G>
    <Line x1={10} y1={76} x2={90} y2={76} stroke={c} strokeWidth={10} strokeLinecap="round" opacity={0.18} />
    <Hd x={80} y={55} c={c} />
    {/* body flat on bench */}
    <Ln x1={75} y1={64} x2={18} y2={68} c={c} />
    <Jt x={60} y={65} c={c} /><Jt x={38} y={67} c={c} />
    {/* arm: upper arm up from shoulder, elbow at top, bar at chest level */}
    <Jt x={60} y={48} c={c} />
    <Ln x1={60} y1={65} x2={60} y2={48} c={c} />
    {/* forearm forward: bar at chest */}
    <Jt x={46} y={48} c={c} />
    <Ln x1={60} y1={48} x2={46} y2={48} c={c} />
    <Bar x1={28} y1={48} x2={78} y2={48} c={c} />
    <Pl cx={28} cy={48} c={c} /><Pl cx={78} cy={48} c={c} />
    {/* knees bent */}
    <Ln x1={38} y1={67} x2={28} y2={84} c={c} /><Jt x={28} y={84} c={c} />
    <Ln x1={28} y1={84} x2={18} y2={70} c={c} />
  </G>
);

// End: arms extended, bar overhead
const BenchUp = ({ c }) => (
  <G>
    <Line x1={10} y1={76} x2={90} y2={76} stroke={c} strokeWidth={10} strokeLinecap="round" opacity={0.18} />
    <Hd x={80} y={55} c={c} />
    <Ln x1={75} y1={64} x2={18} y2={68} c={c} />
    <Jt x={60} y={65} c={c} /><Jt x={38} y={67} c={c} />
    {/* arm straight up */}
    <Jt x={60} y={34} c={c} />
    <Ln x1={60} y1={65} x2={60} y2={34} c={c} />
    <Bar x1={28} y1={34} x2={80} y2={34} c={c} />
    <Pl cx={28} cy={34} c={c} /><Pl cx={80} cy={34} c={c} />
    <Ln x1={38} y1={67} x2={28} y2={84} c={c} /><Jt x={28} y={84} c={c} />
    <Ln x1={28} y1={84} x2={18} y2={70} c={c} />
  </G>
);

/* ─────────────────────────────────────────────────────────
   DEADLIFT — side view
───────────────────────────────────────────────────────── */
const DeadStart = ({ c }) => (
  <G>
    <Gnd c={c} />
    {/* hips high, torso forward ~45° */}
    <Hd x={72} y={24} c={c} />
    <Ln x1={68} y1={32} x2={36} y2={60} c={c} />
    <Jt x={68} y={33} c={c} />
    {/* arm straight down gripping bar */}
    <Jt x={58} y={42} c={c} />
    <Ln x1={58} y1={42} x2={50} y2={68} c={c} /><Jt x={50} y={68} c={c} />
    <Bar x1={28} y1={76} x2={72} y2={76} c={c} />
    <Pl cx={28} cy={76} c={c} /><Pl cx={72} cy={76} c={c} />
    {/* hips + legs: back straight, knees bent */}
    <Jt x={36} y={60} c={c} />
    <Ln x1={36} y1={60} x2={30} y2={90} c={c} /><Jt x={30} y={90} c={c} />
    <Ln x1={30} y1={90} x2={34} y2={114} c={c} />
    <Ln x1={36} y1={60} x2={46} y2={88} c={c} /><Jt x={46} y={88} c={c} />
    <Ln x1={46} y1={88} x2={50} y2={114} c={c} />
  </G>
);

const DeadEnd = ({ c }) => (
  <G>
    <Gnd c={c} />
    {/* standing tall, bar at hips */}
    <Hd x={50} y={12} c={c} />
    <Torso sy={22} ey={56} c={c} />
    {/* arms straight down, holding bar */}
    <Ln x1={38} y1={24} x2={36} y2={56} c={c} /><Jt x={36} y={56} c={c} />
    <Ln x1={62} y1={24} x2={64} y2={56} c={c} /><Jt x={64} y={56} c={c} />
    <Bar x1={22} y1={58} x2={78} y2={58} c={c} />
    <Pl cx={22} cy={58} c={c} /><Pl cx={78} cy={58} c={c} />
    <Legs hx={50} hy={56} c={c} />
  </G>
);

/* ─────────────────────────────────────────────────────────
   SHOULDER PRESS
───────────────────────────────────────────────────────── */
const OHPStart = ({ c }) => (
  <G>
    <Gnd c={c} />
    <Hd x={50} y={16} c={c} />
    <Torso sy={26} ey={58} c={c} />
    {/* bar at collar bone — elbows directly below grip, forearms vertical */}
    <Jt x={36} y={28} c={c} /><Jt x={64} y={28} c={c} />
    <Jt x={36} y={44} c={c} /><Jt x={64} y={44} c={c} />
    {/* upper arms: shoulder → elbow straight down */}
    <Ln x1={38} y1={28} x2={36} y2={44} c={c} />
    <Ln x1={62} y1={28} x2={64} y2={44} c={c} />
    {/* forearms: elbow → grip on bar (slight inward angle) */}
    <Ln x1={36} y1={44} x2={36} y2={28} c={c} />
    <Ln x1={64} y1={44} x2={64} y2={28} c={c} />
    <Bar x1={22} y1={28} x2={78} y2={28} c={c} />
    <Pl cx={22} cy={28} c={c} /><Pl cx={78} cy={28} c={c} />
    <Legs hx={50} hy={58} c={c} />
  </G>
);

const OHPEnd = ({ c }) => (
  <G>
    <Gnd c={c} />
    <Hd x={50} y={22} c={c} />
    <Torso sy={32} ey={64} c={c} />
    {/* arms fully extended — bar overhead */}
    <Jt x={32} y={14} c={c} /><Jt x={68} y={14} c={c} />
    <Ln x1={38} y1={34} x2={32} y2={14} c={c} />
    <Ln x1={62} y1={34} x2={68} y2={14} c={c} />
    <Bar x1={18} y1={8} x2={82} y2={8} c={c} />
    <Pl cx={18} cy={8} c={c} /><Pl cx={82} cy={8} c={c} />
    <Legs hx={50} hy={64} c={c} />
  </G>
);

/* ─────────────────────────────────────────────────────────
   LATERAL RAISE
───────────────────────────────────────────────────────── */
const LateralDown = ({ c }) => (
  <G>
    <Gnd c={c} />
    <Hd x={50} y={12} c={c} />
    <Torso sy={22} ey={54} c={c} />
    {/* arms straight down */}
    <Ln x1={38} y1={24} x2={34} y2={50} c={c} /><Jt x={34} y={50} c={c} />
    <Ln x1={34} y1={50} x2={32} y2={68} c={c} />
    <Db cx={32} cy={76} c={c} />
    <Ln x1={62} y1={24} x2={66} y2={50} c={c} /><Jt x={66} y={50} c={c} />
    <Ln x1={66} y1={50} x2={68} y2={68} c={c} />
    <Db cx={68} cy={76} c={c} />
    <Legs hx={50} hy={54} c={c} />
  </G>
);

const LateralUp = ({ c }) => (
  <G>
    <Gnd c={c} />
    <Hd x={50} y={12} c={c} />
    <Torso sy={22} ey={54} c={c} />
    {/* arms raised to shoulder height — T shape, dumbbells inside frame */}
    <Ln x1={38} y1={24} x2={20} y2={26} c={c} /><Jt x={20} y={26} c={c} />
    <Ln x1={20} y1={26} x2={12} y2={28} c={c} />
    <Db cx={12} cy={28} c={c} />
    <Ln x1={62} y1={24} x2={80} y2={26} c={c} /><Jt x={80} y={26} c={c} />
    <Ln x1={80} y1={26} x2={88} y2={28} c={c} />
    <Db cx={88} cy={28} c={c} />
    <Legs hx={50} hy={54} c={c} />
  </G>
);

/* ─────────────────────────────────────────────────────────
   BICEP CURL
───────────────────────────────────────────────────────── */
const CurlDown = ({ c }) => (
  <G>
    <Gnd c={c} />
    <Hd x={50} y={12} c={c} />
    <Torso sy={22} ey={54} c={c} />
    <Ln x1={38} y1={24} x2={34} y2={50} c={c} /><Jt x={34} y={50} c={c} />
    <Ln x1={34} y1={50} x2={32} y2={68} c={c} />
    <Db cx={32} cy={76} c={c} />
    <Ln x1={62} y1={24} x2={66} y2={50} c={c} /><Jt x={66} y={50} c={c} />
    <Ln x1={66} y1={50} x2={68} y2={68} c={c} />
    <Db cx={68} cy={76} c={c} />
    <Legs hx={50} hy={54} c={c} />
  </G>
);

const CurlUp = ({ c }) => (
  <G>
    <Gnd c={c} />
    <Hd x={50} y={12} c={c} />
    <Torso sy={22} ey={54} c={c} />
    {/* left arm relaxed */}
    <Ln x1={38} y1={24} x2={34} y2={50} c={c} /><Jt x={34} y={50} c={c} />
    <Ln x1={34} y1={50} x2={32} y2={68} c={c} />
    {/* right arm curled — elbow stays, forearm up */}
    <Ln x1={62} y1={24} x2={66} y2={50} c={c} /><Jt x={66} y={50} c={c} />
    <Ln x1={66} y1={50} x2={60} y2={28} c={c} />
    <Db cx={60} cy={20} c={c} />
    <Legs hx={50} hy={54} c={c} />
  </G>
);

/* ─────────────────────────────────────────────────────────
   PLANK — side view
───────────────────────────────────────────────────────── */
// Forearm plank
const PlankA = ({ c }) => (
  <G>
    <Gnd c={c} />
    <Hd x={76} y={42} c={c} />
    <Ln x1={70} y1={50} x2={20} y2={60} c={c} />
    <Jt x={58} y={52} c={c} /><Jt x={28} y={58} c={c} />
    {/* forearm on ground */}
    <Ln x1={58} y1={52} x2={50} y2={56} c={c} /><Jt x={50} y={56} c={c} />
    <Ln x1={50} y1={56} x2={40} y2={70} c={c} /><Jt x={40} y={70} c={c} />
    <Ln x1={40} y1={70} x2={24} y2={70} c={c} />
    <Ln x1={20} y1={60} x2={12} y2={68} c={c} /><Jt x={12} y={68} c={c} />
    <Ln x1={12} y1={68} x2={6}  y2={68} c={c} />
  </G>
);

// High plank — arms extended
const PlankB = ({ c }) => (
  <G>
    <Gnd c={c} />
    <Hd x={76} y={34} c={c} />
    <Ln x1={70} y1={42} x2={20} y2={52} c={c} />
    <Jt x={58} y={44} c={c} /><Jt x={28} y={50} c={c} />
    {/* straight arms down */}
    <Ln x1={58} y1={44} x2={52} y2={66} c={c} /><Jt x={52} y={66} c={c} />
    <Ln x1={52} y1={66} x2={36} y2={70} c={c} /><Jt x={36} y={70} c={c} />
    <Ln x1={20} y1={52} x2={12} y2={62} c={c} /><Jt x={12} y={62} c={c} />
    <Ln x1={12} y1={62} x2={6}  y2={68} c={c} />
  </G>
);

/* ─────────────────────────────────────────────────────────
   LUNGE
───────────────────────────────────────────────────────── */
const LungeStand = ({ c }) => <SquatStand c={c} />;

const LungeDown = ({ c }) => (
  <G>
    <Gnd c={c} />
    <Hd x={46} y={14} c={c} />
    <Torso sx={46} sy={24} ex={46} ey={56} lsx={34} rsx={58} c={c} />
    <Ln x1={34} y1={26} x2={30} y2={50} c={c} /><Jt x={30} y={50} c={c} />
    <Ln x1={30} y1={50} x2={28} y2={66} c={c} />
    <Ln x1={58} y1={26} x2={62} y2={50} c={c} /><Jt x={62} y={50} c={c} />
    <Ln x1={62} y1={50} x2={64} y2={66} c={c} />
    {/* hips */}
    <Jt x={38} y={56} c={c} /><Jt x={54} y={56} c={c} />
    <Ln x1={38} y1={56} x2={46} y2={56} c={c} />
    <Ln x1={54} y1={56} x2={46} y2={56} c={c} />
    {/* front leg — knee 90° */}
    <Ln x1={54} y1={56} x2={66} y2={80} c={c} /><Jt x={66} y={80} c={c} />
    <Ln x1={66} y1={80} x2={74} y2={114} c={c} />
    {/* back leg — knee near floor */}
    <Ln x1={38} y1={56} x2={22} y2={78} c={c} /><Jt x={22} y={78} c={c} />
    <Ln x1={22} y1={78} x2={16} y2={108} c={c} />
  </G>
);

/* ─────────────────────────────────────────────────────────
   BENT-OVER ROW — side view
───────────────────────────────────────────────────────── */
const RowStart = ({ c }) => (
  <G>
    <Gnd c={c} />
    <Hd x={74} y={26} c={c} />
    <Ln x1={70} y1={34} x2={34} y2={60} c={c} />
    <Jt x={70} y={35} c={c} /><Jt x={56} y={44} c={c} />
    {/* arm straight down */}
    <Ln x1={56} y1={44} x2={48} y2={72} c={c} /><Jt x={48} y={72} c={c} />
    <Bar x1={26} y1={78} x2={68} y2={78} c={c} />
    <Pl cx={26} cy={78} c={c} /><Pl cx={68} cy={78} c={c} />
    {/* legs */}
    <Jt x={34} y={60} c={c} />
    <Ln x1={34} y1={60} x2={30} y2={88} c={c} /><Jt x={30} y={88} c={c} />
    <Ln x1={30} y1={88} x2={32} y2={114} c={c} />
    <Ln x1={34} y1={60} x2={44} y2={86} c={c} /><Jt x={44} y={86} c={c} />
    <Ln x1={44} y1={86} x2={46} y2={114} c={c} />
  </G>
);

const RowEnd = ({ c }) => (
  <G>
    <Gnd c={c} />
    <Hd x={74} y={26} c={c} />
    <Ln x1={70} y1={34} x2={34} y2={60} c={c} />
    <Jt x={70} y={35} c={c} /><Jt x={56} y={44} c={c} />
    {/* elbow pulled HIGH behind body */}
    <Ln x1={56} y1={44} x2={74} y2={52} c={c} /><Jt x={74} y={52} c={c} />
    <Ln x1={74} y1={52} x2={62} y2={46} c={c} />
    <Bar x1={50} y1={46} x2={76} y2={46} c={c} />
    <Pl cx={76} cy={46} c={c} />
    <Jt x={34} y={60} c={c} />
    <Ln x1={34} y1={60} x2={30} y2={88} c={c} /><Jt x={30} y={88} c={c} />
    <Ln x1={30} y1={88} x2={32} y2={114} c={c} />
    <Ln x1={34} y1={60} x2={44} y2={86} c={c} /><Jt x={44} y={86} c={c} />
    <Ln x1={44} y1={86} x2={46} y2={114} c={c} />
  </G>
);

/* ─────────────────────────────────────────────────────────
   RUNNING — side view
───────────────────────────────────────────────────────── */
// RunA: רגל שמאל דחיפה מהרצפה (אחורה), רגל ימין קדימה ולמעלה (knee drive)
const RunA = ({ c }) => (
  <G>
    <Gnd c={c} />
    <Hd x={52} y={12} c={c} />
    {/* גוף נטוי קדימה */}
    <Ln x1={50} y1={21} x2={46} y2={52} c={c} />
    <Jt x={40} y={23} c={c} /><Jt x={60} y={25} c={c} />
    <Ln x1={40} y1={23} x2={50} y2={21} c={c} />
    <Ln x1={60} y1={25} x2={50} y2={21} c={c} />
    {/* זרוע ימין קדימה-למעלה */}
    <Ln x1={60} y1={25} x2={72} y2={36} c={c} /><Jt x={72} y={36} c={c} />
    <Ln x1={72} y1={36} x2={78} y2={28} c={c} />
    {/* זרוע שמאל אחורה-למטה */}
    <Ln x1={40} y1={23} x2={28} y2={34} c={c} /><Jt x={28} y={34} c={c} />
    <Ln x1={28} y1={34} x2={20} y2={44} c={c} />
    <Jt x={46} y={52} c={c} />
    {/* רגל ימין — knee drive: ירך קדימה-למעלה, שוק יורדת */}
    <Ln x1={46} y1={52} x2={60} y2={64} c={c} /><Jt x={60} y={64} c={c} />
    <Ln x1={60} y1={64} x2={56} y2={88} c={c} />
    {/* רגל שמאל — דחיפה: ירך אחורה-למטה, שוק ישרה לקרקע */}
    <Ln x1={46} y1={52} x2={34} y2={72} c={c} /><Jt x={34} y={72} c={c} />
    <Ln x1={34} y1={72} x2={36} y2={114} c={c} />
  </G>
);

// RunB: רגל ימין דחיפה, רגל שמאל knee drive — מירור של RunA
const RunB = ({ c }) => (
  <G>
    <Gnd c={c} />
    <Hd x={48} y={12} c={c} />
    <Ln x1={50} y1={21} x2={54} y2={52} c={c} />
    <Jt x={40} y={25} c={c} /><Jt x={60} y={23} c={c} />
    <Ln x1={40} y1={25} x2={50} y2={21} c={c} />
    <Ln x1={60} y1={23} x2={50} y2={21} c={c} />
    {/* זרוע שמאל קדימה-למעלה */}
    <Ln x1={40} y1={25} x2={28} y2={36} c={c} /><Jt x={28} y={36} c={c} />
    <Ln x1={28} y1={36} x2={22} y2={28} c={c} />
    {/* זרוע ימין אחורה-למטה */}
    <Ln x1={60} y1={23} x2={72} y2={34} c={c} /><Jt x={72} y={34} c={c} />
    <Ln x1={72} y1={34} x2={80} y2={44} c={c} />
    <Jt x={54} y={52} c={c} />
    {/* רגל שמאל — knee drive */}
    <Ln x1={54} y1={52} x2={40} y2={64} c={c} /><Jt x={40} y={64} c={c} />
    <Ln x1={40} y1={64} x2={44} y2={88} c={c} />
    {/* רגל ימין — דחיפה */}
    <Ln x1={54} y1={52} x2={66} y2={72} c={c} /><Jt x={66} y={72} c={c} />
    <Ln x1={66} y1={72} x2={64} y2={114} c={c} />
  </G>
);

/* ─────────────────────────────────────────────────────────
   CRUNCH — side view
───────────────────────────────────────────────────────── */
const CrunchFlat = ({ c }) => (
  <G>
    <Gnd c={c} />
    <Hd x={78} y={76} c={c} />
    <Ln x1={72} y1={82} x2={22} y2={84} c={c} />
    <Jt x={56} y={82} c={c} /><Jt x={36} y={83} c={c} />
    {/* knees bent */}
    <Ln x1={36} y1={83} x2={22} y2={68} c={c} /><Jt x={22} y={68} c={c} />
    <Ln x1={22} y1={68} x2={12} y2={84} c={c} />
    {/* hands by head */}
    <Ln x1={72} y1={82} x2={80} y2={72} c={c} /><Jt x={80} y={72} c={c} />
    <Ln x1={80} y1={72} x2={88} y2={78} c={c} />
  </G>
);

const CrunchUp = ({ c }) => (
  <G>
    <Gnd c={c} />
    {/* torso raised ~40° */}
    <Hd x={62} y={52} c={c} />
    <Ln x1={56} y1={60} x2={22} y2={82} c={c} />
    <Jt x={44} y={66} c={c} /><Jt x={34} y={78} c={c} />
    <Ln x1={34} y1={78} x2={20} y2={64} c={c} /><Jt x={20} y={64} c={c} />
    <Ln x1={20} y1={64} x2={12} y2={84} c={c} />
    {/* arms reaching forward */}
    <Ln x1={56} y1={60} x2={42} y2={54} c={c} /><Jt x={42} y={54} c={c} />
    <Ln x1={42} y1={54} x2={30} y2={58} c={c} />
  </G>
);

/* ─────────────────────────────────────────────────────────
   LEG RAISE — side view
───────────────────────────────────────────────────────── */
const LegRaiseFlat = ({ c }) => (
  <G>
    <Gnd c={c} />
    <Hd x={82} y={76} c={c} />
    <Ln x1={76} y1={82} x2={18} y2={84} c={c} />
    <Jt x={60} y={82} c={c} /><Jt x={38} y={83} c={c} />
    {/* legs flat */}
    <Ln x1={38} y1={83} x2={10} y2={84} c={c} />
    <Jt x={24} y={84} c={c} />
    <Ln x1={76} y1={82} x2={84} y2={74} c={c} />
  </G>
);

const LegRaiseUp = ({ c }) => (
  <G>
    <Gnd c={c} />
    <Hd x={82} y={76} c={c} />
    <Ln x1={76} y1={82} x2={18} y2={84} c={c} />
    <Jt x={60} y={82} c={c} /><Jt x={38} y={83} c={c} />
    {/* legs raised vertical */}
    <Ln x1={38} y1={83} x2={32} y2={44} c={c} /><Jt x={32} y={44} c={c} />
    <Ln x1={38} y1={83} x2={44} y2={44} c={c} /><Jt x={44} y={44} c={c} />
    <Ln x1={76} y1={82} x2={84} y2={74} c={c} />
  </G>
);

/* ─────────────────────────────────────────────────────────
   ARROW
───────────────────────────────────────────────────────── */
const Arrow = ({ color }) => (
  <Svg width={28} height={28} viewBox="0 0 28 28">
    <Line x1={4}  y1={14} x2={24} y2={14} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Line x1={16} y1={7}  x2={24} y2={14} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Line x1={16} y1={21} x2={24} y2={14} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
  </Svg>
);

/* ─────────────────────────────────────────────────────────
   PAIRS + MAPPING
───────────────────────────────────────────────────────── */
const PAIRS = {
  squat:    [SquatStand,    SquatDown],
  bench:    [BenchDown,     BenchUp],
  pullup:   [PullupHang,    PullupTop],
  deadlift: [DeadStart,     DeadEnd],
  ohp:      [OHPStart,      OHPEnd],
  lateral:  [LateralDown,   LateralUp],
  curl:     [CurlDown,      CurlUp],
  plank:    [PlankA,        PlankB],
  lunge:    [LungeStand,    LungeDown],
  row:      [RowStart,      RowEnd],
  run:      [RunA,          RunB],
  crunch:   [CrunchFlat,    CrunchUp],
  legraise: [LegRaiseFlat,  LegRaiseUp],
};

function pickKey(name = '') {
  if (/סקוואט|לגפרס|בולגר/.test(name))                          return 'squat';
  if (/לחיצת חזה|פרפר|מקבילים|לחיצות/.test(name))              return 'bench';
  if (/פולאפ|פולי עליון|משיכת פולי/.test(name))                 return 'pullup';
  if (/דדליפט/.test(name))                                      return 'deadlift';
  if (/כריות|כריה|lateral/i.test(name))                         return 'lateral';
  if (/לחיצת כתפיים|כתפיים עם/.test(name))                      return 'ohp';
  if (/ביצפס|כפיפות.*יד|פטיש/.test(name))                      return 'curl';
  if (/פלאנק/.test(name))                                       return 'plank';
  if (/לאנג/.test(name))                                        return 'lunge';
  if (/חתיר|שכיבה.*מוט/.test(name))                            return 'row';
  if (/ברפי|קפיצה|טיפוס/.test(name)) return 'run';
  if (/בטן|כפיפות בטן|סיבוב|Russian/.test(name))                return 'crunch';
  if (/הרמת רגל|הרמות רגל/.test(name))                          return 'legraise';
  return null;
}

export default function ExerciseIllustration({ name, color = '#3a7a4a', size = 100 }) {
  const key = pickKey(name);
  if (!key) return null;
  const [PoseA, PoseB] = PAIRS[key];

  return (
    <View style={st.row}>
      <View style={[st.frame, { backgroundColor: color + '12' }]}>
        <Svg width={size} height={size} viewBox="0 0 100 120">
          <PoseA c={color} />
        </Svg>
      </View>
      <Arrow color={color} />
      <View style={[st.frame, { backgroundColor: color + '12' }]}>
        <Svg width={size} height={size} viewBox="0 0 100 120">
          <PoseB c={color} />
        </Svg>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 12 },
  frame: { borderRadius: 16, padding: 6 },
});
