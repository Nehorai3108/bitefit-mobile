/**
 * ExerciseIllustration — stick-figure exercise poses
 * Each exercise has two poses (start → end) shown side by side.
 * ViewBox: 100×120 for all figures (consistent scale).
 * Thicker strokes, filled joints, filled head for readability.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Line, G } from 'react-native-svg';

const SW  = 5;    // limb stroke width
const SWH = 7;    // equipment stroke width
const JR  = 4.5;  // joint dot radius
const HR  = 10;   // head radius

// primitives
const Hd  = ({ x, y, c })             => <Circle cx={x} cy={y} r={HR} fill={c} />;
const Ln  = ({ x1,y1,x2,y2,c,w=SW }) => <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={w} strokeLinecap="round" />;
const Jt  = ({ x, y, c })             => <Circle cx={x} cy={y} r={JR} fill={c} />;
const Bar = ({ x1,y1,x2,y2,c })       => <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={SWH} strokeLinecap="round" />;
const Pl  = ({ cx, cy, c })            => <Circle cx={cx} cy={cy} r={7} stroke={c} strokeWidth={3} fill="none" />;
const Gnd = ({ c })                    => <Line x1={5} y1={115} x2={95} y2={115} stroke={c} strokeWidth={2} strokeLinecap="round" opacity={0.25} />;
const Db  = ({ cx, cy, c })            => (
  <G>
    <Circle cx={cx-6} cy={cy} r={5} stroke={c} strokeWidth={3} fill="none" />
    <Line x1={cx-6} y1={cy} x2={cx+6} y2={cy} stroke={c} strokeWidth={4} strokeLinecap="round" />
    <Circle cx={cx+6} cy={cy} r={5} stroke={c} strokeWidth={3} fill="none" />
  </G>
);

/* ── SQUAT ──────────────────────────────────────────────── */
const SquatStand = ({ c }) => (
  <G>
    <Gnd c={c} />
    <Hd x={50} y={12} c={c} />
    <Ln x1={50} y1={22} x2={50} y2={26} c={c} />
    <Ln x1={50} y1={26} x2={50} y2={56} c={c} />
    <Jt x={38} y={28} c={c} /><Jt x={62} y={28} c={c} />
    <Ln x1={38} y1={28} x2={50} y2={26} c={c} />
    <Ln x1={62} y1={28} x2={50} y2={26} c={c} />
    <Ln x1={38} y1={28} x2={34} y2={52} c={c} />
    <Jt x={34} y={52} c={c} />
    <Ln x1={34} y1={52} x2={31} y2={70} c={c} />
    <Ln x1={62} y1={28} x2={66} y2={52} c={c} />
    <Jt x={66} y={52} c={c} />
    <Ln x1={66} y1={52} x2={69} y2={70} c={c} />
    <Jt x={44} y={56} c={c} /><Jt x={56} y={56} c={c} />
    <Ln x1={44} y1={56} x2={50} y2={56} c={c} />
    <Ln x1={56} y1={56} x2={50} y2={56} c={c} />
    <Ln x1={44} y1={56} x2={41} y2={84} c={c} />
    <Jt x={41} y={84} c={c} />
    <Ln x1={41} y1={84} x2={39} y2={114} c={c} />
    <Ln x1={56} y1={56} x2={59} y2={84} c={c} />
    <Jt x={59} y={84} c={c} />
    <Ln x1={59} y1={84} x2={61} y2={114} c={c} />
  </G>
);

const SquatDown = ({ c }) => (
  <G>
    <Gnd c={c} />
    <Hd x={50} y={30} c={c} />
    <Ln x1={50} y1={40} x2={50} y2={44} c={c} />
    <Ln x1={50} y1={44} x2={50} y2={68} c={c} />
    <Jt x={38} y={46} c={c} /><Jt x={62} y={46} c={c} />
    <Ln x1={38} y1={46} x2={50} y2={44} c={c} />
    <Ln x1={62} y1={46} x2={50} y2={44} c={c} />
    {/* arms forward for balance */}
    <Ln x1={38} y1={46} x2={22} y2={54} c={c} />
    <Jt x={22} y={54} c={c} />
    <Ln x1={22} y1={54} x2={14} y2={60} c={c} />
    <Ln x1={62} y1={46} x2={78} y2={54} c={c} />
    <Jt x={78} y={54} c={c} />
    <Ln x1={78} y1={54} x2={86} y2={60} c={c} />
    <Jt x={42} y={68} c={c} /><Jt x={58} y={68} c={c} />
    <Ln x1={42} y1={68} x2={50} y2={68} c={c} />
    <Ln x1={58} y1={68} x2={50} y2={68} c={c} />
    {/* thighs wide, knees out */}
    <Ln x1={42} y1={68} x2={26} y2={88} c={c} />
    <Jt x={26} y={88} c={c} />
    <Ln x1={26} y1={88} x2={22} y2={114} c={c} />
    <Ln x1={58} y1={68} x2={74} y2={88} c={c} />
    <Jt x={74} y={88} c={c} />
    <Ln x1={74} y1={88} x2={78} y2={114} c={c} />
  </G>
);

/* ── BENCH PRESS (side view) ────────────────────────────── */
const BenchDown = ({ c }) => (
  <G>
    {/* bench */}
    <Line x1={12} y1={74} x2={88} y2={74} stroke={c} strokeWidth={10} strokeLinecap="round" opacity={0.2} />
    <Hd x={80} y={56} c={c} />
    <Ln x1={80} y1={66} x2={20} y2={66} c={c} />
    <Jt x={62} y={66} c={c} /><Jt x={40} y={66} c={c} />
    {/* arm bent — bar at chest */}
    <Jt x={62} y={50} c={c} />
    <Ln x1={62} y1={66} x2={62} y2={50} c={c} />
    <Jt x={48} y={50} c={c} />
    <Ln x1={62} y1={50} x2={48} y2={50} c={c} />
    <Bar x1={30} y1={50} x2={82} y2={50} c={c} />
    <Pl cx={30} cy={50} c={c} /><Pl cx={82} cy={50} c={c} />
    {/* knees bent */}
    <Ln x1={40} y1={66} x2={30} y2={84} c={c} />
    <Jt x={30} y={84} c={c} />
    <Ln x1={30} y1={84} x2={20} y2={70} c={c} />
  </G>
);

const BenchUp = ({ c }) => (
  <G>
    <Line x1={12} y1={74} x2={88} y2={74} stroke={c} strokeWidth={10} strokeLinecap="round" opacity={0.2} />
    <Hd x={80} y={56} c={c} />
    <Ln x1={80} y1={66} x2={20} y2={66} c={c} />
    <Jt x={62} y={66} c={c} /><Jt x={40} y={66} c={c} />
    {/* arm straight up */}
    <Jt x={62} y={34} c={c} />
    <Ln x1={62} y1={66} x2={62} y2={34} c={c} />
    <Bar x1={30} y1={34} x2={82} y2={34} c={c} />
    <Pl cx={30} cy={34} c={c} /><Pl cx={82} cy={34} c={c} />
    <Ln x1={40} y1={66} x2={30} y2={84} c={c} />
    <Jt x={30} y={84} c={c} />
    <Ln x1={30} y1={84} x2={20} y2={70} c={c} />
  </G>
);

/* ── PULLUP ─────────────────────────────────────────────── */
const PullupHang = ({ c }) => (
  <G>
    <Bar x1={10} y1={8} x2={90} y2={8} c={c} />
    <Hd x={50} y={28} c={c} />
    <Ln x1={50} y1={38} x2={50} y2={64} c={c} />
    <Jt x={36} y={24} c={c} /><Jt x={64} y={24} c={c} />
    <Ln x1={36} y1={24} x2={50} y2={38} c={c} />
    <Ln x1={64} y1={24} x2={50} y2={38} c={c} />
    <Ln x1={36} y1={24} x2={36} y2={8} c={c} />
    <Ln x1={64} y1={24} x2={64} y2={8} c={c} />
    <Jt x={44} y={64} c={c} /><Jt x={56} y={64} c={c} />
    <Ln x1={44} y1={64} x2={50} y2={64} c={c} />
    <Ln x1={56} y1={64} x2={50} y2={64} c={c} />
    <Ln x1={44} y1={64} x2={42} y2={88} c={c} />
    <Jt x={42} y={88} c={c} />
    <Ln x1={42} y1={88} x2={40} y2={108} c={c} />
    <Ln x1={56} y1={64} x2={58} y2={88} c={c} />
    <Jt x={58} y={88} c={c} />
    <Ln x1={58} y1={88} x2={60} y2={108} c={c} />
  </G>
);

const PullupTop = ({ c }) => (
  <G>
    <Bar x1={10} y1={8} x2={90} y2={8} c={c} />
    {/* chin above bar */}
    <Hd x={50} y={4} c={c} />
    <Jt x={28} y={18} c={c} /><Jt x={72} y={18} c={c} />
    <Ln x1={28} y1={18} x2={28} y2={8} c={c} />
    <Ln x1={72} y1={18} x2={72} y2={8} c={c} />
    {/* elbows wide */}
    <Jt x={38} y={32} c={c} /><Jt x={62} y={32} c={c} />
    <Ln x1={28} y1={18} x2={38} y2={32} c={c} />
    <Ln x1={72} y1={18} x2={62} y2={32} c={c} />
    <Ln x1={50} y1={14} x2={50} y2={58} c={c} />
    <Jt x={44} y={58} c={c} /><Jt x={56} y={58} c={c} />
    <Ln x1={44} y1={58} x2={50} y2={58} c={c} />
    <Ln x1={56} y1={58} x2={50} y2={58} c={c} />
    <Ln x1={44} y1={58} x2={42} y2={82} c={c} />
    <Jt x={42} y={82} c={c} />
    <Ln x1={42} y1={82} x2={40} y2={102} c={c} />
    <Ln x1={56} y1={58} x2={58} y2={82} c={c} />
    <Jt x={58} y={82} c={c} />
    <Ln x1={58} y1={82} x2={60} y2={102} c={c} />
  </G>
);

/* ── DEADLIFT (side view) ───────────────────────────────── */
const DeadStart = ({ c }) => (
  <G>
    <Gnd c={c} />
    <Hd x={72} y={26} c={c} />
    <Ln x1={68} y1={35} x2={34} y2={64} c={c} />
    <Jt x={68} y={36} c={c} />
    <Ln x1={68} y1={36} x2={72} y2={36} c={c} />
    <Jt x={58} y={44} c={c} />
    <Ln x1={58} y1={44} x2={52} y2={70} c={c} />
    <Jt x={52} y={70} c={c} />
    <Bar x1={28} y1={75} x2={72} y2={75} c={c} />
    <Pl cx={28} cy={75} c={c} /><Pl cx={72} cy={75} c={c} />
    <Jt x={34} y={64} c={c} />
    <Ln x1={34} y1={64} x2={30} y2={94} c={c} />
    <Jt x={30} y={94} c={c} />
    <Ln x1={30} y1={94} x2={36} y2={114} c={c} />
    <Ln x1={34} y1={64} x2={44} y2={90} c={c} />
    <Jt x={44} y={90} c={c} />
    <Ln x1={44} y1={90} x2={46} y2={114} c={c} />
  </G>
);

const DeadEnd = ({ c }) => (
  <G>
    <Gnd c={c} />
    <Hd x={50} y={12} c={c} />
    <Ln x1={50} y1={22} x2={50} y2={26} c={c} />
    <Ln x1={50} y1={26} x2={50} y2={58} c={c} />
    <Jt x={38} y={28} c={c} /><Jt x={62} y={28} c={c} />
    <Ln x1={38} y1={28} x2={50} y2={26} c={c} />
    <Ln x1={62} y1={28} x2={50} y2={26} c={c} />
    <Ln x1={38} y1={28} x2={36} y2={60} c={c} />
    <Jt x={36} y={60} c={c} />
    <Ln x1={62} y1={28} x2={64} y2={60} c={c} />
    <Jt x={64} y={60} c={c} />
    <Bar x1={24} y1={62} x2={76} y2={62} c={c} />
    <Pl cx={24} cy={62} c={c} /><Pl cx={76} cy={62} c={c} />
    <Jt x={44} y={58} c={c} /><Jt x={56} y={58} c={c} />
    <Ln x1={44} y1={58} x2={50} y2={58} c={c} />
    <Ln x1={56} y1={58} x2={50} y2={58} c={c} />
    <Ln x1={44} y1={58} x2={41} y2={86} c={c} />
    <Jt x={41} y={86} c={c} />
    <Ln x1={41} y1={86} x2={39} y2={114} c={c} />
    <Ln x1={56} y1={58} x2={59} y2={86} c={c} />
    <Jt x={59} y={86} c={c} />
    <Ln x1={59} y1={86} x2={61} y2={114} c={c} />
  </G>
);

/* ── SHOULDER PRESS ─────────────────────────────────────── */
const OHPStart = ({ c }) => (
  <G>
    <Gnd c={c} />
    <Hd x={50} y={16} c={c} />
    <Ln x1={50} y1={26} x2={50} y2={30} c={c} />
    <Ln x1={50} y1={30} x2={50} y2={60} c={c} />
    <Jt x={36} y={32} c={c} /><Jt x={64} y={32} c={c} />
    <Ln x1={36} y1={32} x2={50} y2={30} c={c} />
    <Ln x1={64} y1={32} x2={50} y2={30} c={c} />
    {/* elbows bent, bar at collar bone */}
    <Jt x={24} y={44} c={c} /><Jt x={76} y={44} c={c} />
    <Ln x1={36} y1={32} x2={24} y2={44} c={c} />
    <Ln x1={64} y1={32} x2={76} y2={44} c={c} />
    <Bar x1={14} y1={30} x2={86} y2={30} c={c} />
    <Pl cx={14} cy={30} c={c} /><Pl cx={86} cy={30} c={c} />
    <Jt x={44} y={60} c={c} /><Jt x={56} y={60} c={c} />
    <Ln x1={44} y1={60} x2={50} y2={60} c={c} />
    <Ln x1={56} y1={60} x2={50} y2={60} c={c} />
    <Ln x1={44} y1={60} x2={41} y2={88} c={c} />
    <Jt x={41} y={88} c={c} />
    <Ln x1={41} y1={88} x2={39} y2={114} c={c} />
    <Ln x1={56} y1={60} x2={59} y2={88} c={c} />
    <Jt x={59} y={88} c={c} />
    <Ln x1={59} y1={88} x2={61} y2={114} c={c} />
  </G>
);

const OHPEnd = ({ c }) => (
  <G>
    <Gnd c={c} />
    <Hd x={50} y={22} c={c} />
    <Ln x1={50} y1={32} x2={50} y2={36} c={c} />
    <Ln x1={50} y1={36} x2={50} y2={66} c={c} />
    <Jt x={36} y={38} c={c} /><Jt x={64} y={38} c={c} />
    <Ln x1={36} y1={38} x2={50} y2={36} c={c} />
    <Ln x1={64} y1={38} x2={50} y2={36} c={c} />
    {/* arms fully extended up */}
    <Jt x={32} y={14} c={c} /><Jt x={68} y={14} c={c} />
    <Ln x1={36} y1={38} x2={32} y2={14} c={c} />
    <Ln x1={64} y1={38} x2={68} y2={14} c={c} />
    <Bar x1={18} y1={8} x2={82} y2={8} c={c} />
    <Pl cx={18} cy={8} c={c} /><Pl cx={82} cy={8} c={c} />
    <Jt x={44} y={66} c={c} /><Jt x={56} y={66} c={c} />
    <Ln x1={44} y1={66} x2={50} y2={66} c={c} />
    <Ln x1={56} y1={66} x2={50} y2={66} c={c} />
    <Ln x1={44} y1={66} x2={41} y2={92} c={c} />
    <Jt x={41} y={92} c={c} />
    <Ln x1={41} y1={92} x2={39} y2={114} c={c} />
    <Ln x1={56} y1={66} x2={59} y2={92} c={c} />
    <Jt x={59} y={92} c={c} />
    <Ln x1={59} y1={92} x2={61} y2={114} c={c} />
  </G>
);

/* ── BICEP CURL ─────────────────────────────────────────── */
const CurlDown = ({ c }) => (
  <G>
    <Gnd c={c} />
    <Hd x={50} y={12} c={c} />
    <Ln x1={50} y1={22} x2={50} y2={26} c={c} />
    <Ln x1={50} y1={26} x2={50} y2={56} c={c} />
    <Jt x={38} y={28} c={c} /><Jt x={62} y={28} c={c} />
    <Ln x1={38} y1={28} x2={50} y2={26} c={c} />
    <Ln x1={62} y1={28} x2={50} y2={26} c={c} />
    {/* right arm down */}
    <Ln x1={62} y1={28} x2={66} y2={54} c={c} />
    <Jt x={66} y={54} c={c} />
    <Ln x1={66} y1={54} x2={68} y2={78} c={c} />
    <Db cx={68} cy={86} c={c} />
    {/* left arm relaxed */}
    <Ln x1={38} y1={28} x2={34} y2={54} c={c} />
    <Jt x={34} y={54} c={c} />
    <Ln x1={34} y1={54} x2={32} y2={72} c={c} />
    <Jt x={44} y={56} c={c} /><Jt x={56} y={56} c={c} />
    <Ln x1={44} y1={56} x2={50} y2={56} c={c} />
    <Ln x1={56} y1={56} x2={50} y2={56} c={c} />
    <Ln x1={44} y1={56} x2={41} y2={84} c={c} />
    <Jt x={41} y={84} c={c} />
    <Ln x1={41} y1={84} x2={39} y2={114} c={c} />
    <Ln x1={56} y1={56} x2={59} y2={84} c={c} />
    <Jt x={59} y={84} c={c} />
    <Ln x1={59} y1={84} x2={61} y2={114} c={c} />
  </G>
);

const CurlUp = ({ c }) => (
  <G>
    <Gnd c={c} />
    <Hd x={50} y={12} c={c} />
    <Ln x1={50} y1={22} x2={50} y2={26} c={c} />
    <Ln x1={50} y1={26} x2={50} y2={56} c={c} />
    <Jt x={38} y={28} c={c} /><Jt x={62} y={28} c={c} />
    <Ln x1={38} y1={28} x2={50} y2={26} c={c} />
    <Ln x1={62} y1={28} x2={50} y2={26} c={c} />
    {/* right arm curled — elbow stays, forearm up */}
    <Ln x1={62} y1={28} x2={66} y2={54} c={c} />
    <Jt x={66} y={54} c={c} />
    <Ln x1={66} y1={54} x2={60} y2={30} c={c} />
    <Db cx={60} cy={24} c={c} />
    {/* left arm */}
    <Ln x1={38} y1={28} x2={34} y2={54} c={c} />
    <Jt x={34} y={54} c={c} />
    <Ln x1={34} y1={54} x2={32} y2={72} c={c} />
    <Jt x={44} y={56} c={c} /><Jt x={56} y={56} c={c} />
    <Ln x1={44} y1={56} x2={50} y2={56} c={c} />
    <Ln x1={56} y1={56} x2={50} y2={56} c={c} />
    <Ln x1={44} y1={56} x2={41} y2={84} c={c} />
    <Jt x={41} y={84} c={c} />
    <Ln x1={41} y1={84} x2={39} y2={114} c={c} />
    <Ln x1={56} y1={56} x2={59} y2={84} c={c} />
    <Jt x={59} y={84} c={c} />
    <Ln x1={59} y1={84} x2={61} y2={114} c={c} />
  </G>
);

/* ── PLANK (side view) ──────────────────────────────────── */
const PlankA = ({ c }) => (
  <G>
    <Gnd c={c} />
    <Hd x={76} y={44} c={c} />
    <Ln x1={70} y1={53} x2={22} y2={63} c={c} />
    <Jt x={60} y={55} c={c} /><Jt x={30} y={61} c={c} />
    {/* forearm on ground */}
    <Jt x={50} y={58} c={c} />
    <Ln x1={60} y1={55} x2={50} y2={58} c={c} />
    <Ln x1={50} y1={58} x2={42} y2={70} c={c} />
    <Jt x={42} y={70} c={c} />
    <Ln x1={42} y1={70} x2={28} y2={70} c={c} />
    {/* feet */}
    <Ln x1={22} y1={63} x2={14} y2={70} c={c} />
    <Jt x={14} y={70} c={c} />
    <Ln x1={14} y1={70} x2={8}  y2={70} c={c} />
  </G>
);

const PlankB = ({ c }) => (
  <G>
    <Gnd c={c} />
    <Hd x={76} y={36} c={c} />
    <Ln x1={70} y1={45} x2={22} y2={55} c={c} />
    <Jt x={60} y={47} c={c} /><Jt x={30} y={53} c={c} />
    {/* arms straight */}
    <Ln x1={60} y1={47} x2={52} y2={68} c={c} />
    <Jt x={52} y={68} c={c} />
    <Ln x1={52} y1={68} x2={36} y2={70} c={c} />
    <Jt x={36} y={70} c={c} />
    <Ln x1={22} y1={55} x2={14} y2={63} c={c} />
    <Jt x={14} y={63} c={c} />
    <Ln x1={14} y1={63} x2={8}  y2={70} c={c} />
  </G>
);

/* ── LUNGE ──────────────────────────────────────────────── */
const LungeStand = ({ c }) => <SquatStand c={c} />;

const LungeDown = ({ c }) => (
  <G>
    <Gnd c={c} />
    <Hd x={44} y={14} c={c} />
    <Ln x1={44} y1={24} x2={44} y2={28} c={c} />
    <Ln x1={44} y1={28} x2={44} y2={58} c={c} />
    <Jt x={32} y={30} c={c} /><Jt x={56} y={30} c={c} />
    <Ln x1={32} y1={30} x2={44} y2={28} c={c} />
    <Ln x1={56} y1={30} x2={44} y2={28} c={c} />
    <Ln x1={32} y1={30} x2={28} y2={54} c={c} />
    <Jt x={28} y={54} c={c} />
    <Ln x1={28} y1={54} x2={26} y2={70} c={c} />
    <Ln x1={56} y1={30} x2={60} y2={54} c={c} />
    <Jt x={60} y={54} c={c} />
    <Ln x1={60} y1={54} x2={62} y2={70} c={c} />
    <Jt x={36} y={58} c={c} /><Jt x={52} y={58} c={c} />
    <Ln x1={36} y1={58} x2={44} y2={58} c={c} />
    <Ln x1={52} y1={58} x2={44} y2={58} c={c} />
    {/* front leg — knee 90° */}
    <Ln x1={52} y1={58} x2={64} y2={82} c={c} />
    <Jt x={64} y={82} c={c} />
    <Ln x1={64} y1={82} x2={72} y2={114} c={c} />
    {/* back leg — knee near floor */}
    <Ln x1={36} y1={58} x2={22} y2={80} c={c} />
    <Jt x={22} y={80} c={c} />
    <Ln x1={22} y1={80} x2={16} y2={106} c={c} />
  </G>
);

/* ── BENT-OVER ROW (side view) ──────────────────────────── */
const RowStart = ({ c }) => (
  <G>
    <Gnd c={c} />
    <Hd x={74} y={28} c={c} />
    <Ln x1={70} y1={37} x2={34} y2={62} c={c} />
    <Jt x={70} y={38} c={c} />
    <Jt x={56} y={46} c={c} />
    <Ln x1={56} y1={46} x2={48} y2={74} c={c} />
    <Jt x={48} y={74} c={c} />
    <Bar x1={26} y1={78} x2={68} y2={78} c={c} />
    <Pl cx={26} cy={78} c={c} /><Pl cx={68} cy={78} c={c} />
    <Jt x={34} y={62} c={c} />
    <Ln x1={34} y1={62} x2={30} y2={90} c={c} />
    <Jt x={30} y={90} c={c} />
    <Ln x1={30} y1={90} x2={32} y2={114} c={c} />
    <Ln x1={34} y1={62} x2={42} y2={88} c={c} />
    <Jt x={42} y={88} c={c} />
    <Ln x1={42} y1={88} x2={44} y2={114} c={c} />
  </G>
);

const RowEnd = ({ c }) => (
  <G>
    <Gnd c={c} />
    <Hd x={74} y={28} c={c} />
    <Ln x1={70} y1={37} x2={34} y2={62} c={c} />
    <Jt x={70} y={38} c={c} />
    <Jt x={56} y={46} c={c} />
    {/* elbow pulled high behind */}
    <Ln x1={56} y1={46} x2={72} y2={56} c={c} />
    <Jt x={72} y={56} c={c} />
    <Ln x1={72} y1={56} x2={60} y2={48} c={c} />
    <Bar x1={48} y1={48} x2={74} y2={48} c={c} />
    <Pl cx={74} cy={48} c={c} />
    <Jt x={34} y={62} c={c} />
    <Ln x1={34} y1={62} x2={30} y2={90} c={c} />
    <Jt x={30} y={90} c={c} />
    <Ln x1={30} y1={90} x2={32} y2={114} c={c} />
    <Ln x1={34} y1={62} x2={42} y2={88} c={c} />
    <Jt x={42} y={88} c={c} />
    <Ln x1={42} y1={88} x2={44} y2={114} c={c} />
  </G>
);

/* ── RUNNING (side view) ────────────────────────────────── */
const RunA = ({ c }) => (
  <G>
    <Gnd c={c} />
    <Hd x={54} y={14} c={c} />
    <Ln x1={52} y1={24} x2={46} y2={54} c={c} />
    <Jt x={42} y={26} c={c} /><Jt x={62} y={28} c={c} />
    <Ln x1={42} y1={26} x2={52} y2={24} c={c} />
    <Ln x1={62} y1={28} x2={52} y2={24} c={c} />
    {/* arm forward */}
    <Ln x1={62} y1={28} x2={74} y2={42} c={c} />
    <Jt x={74} y={42} c={c} />
    <Ln x1={74} y1={42} x2={82} y2={34} c={c} />
    {/* arm back */}
    <Ln x1={42} y1={26} x2={30} y2={40} c={c} />
    <Jt x={30} y={40} c={c} />
    <Ln x1={30} y1={40} x2={22} y2={50} c={c} />
    <Jt x={46} y={54} c={c} />
    {/* front leg — extended back */}
    <Ln x1={46} y1={54} x2={60} y2={78} c={c} />
    <Jt x={60} y={78} c={c} />
    <Ln x1={60} y1={78} x2={66} y2={114} c={c} />
    {/* back leg — lifted, knee driving forward */}
    <Ln x1={46} y1={54} x2={32} y2={68} c={c} />
    <Jt x={32} y={68} c={c} />
    <Ln x1={32} y1={68} x2={28} y2={48} c={c} />
  </G>
);

const RunB = ({ c }) => (
  <G>
    <Gnd c={c} />
    <Hd x={46} y={14} c={c} />
    <Ln x1={48} y1={24} x2={54} y2={54} c={c} />
    <Jt x={38} y={28} c={c} /><Jt x={58} y={26} c={c} />
    <Ln x1={38} y1={28} x2={48} y2={24} c={c} />
    <Ln x1={58} y1={26} x2={48} y2={24} c={c} />
    {/* arm back */}
    <Ln x1={58} y1={26} x2={70} y2={40} c={c} />
    <Jt x={70} y={40} c={c} />
    <Ln x1={70} y1={40} x2={78} y2={50} c={c} />
    {/* arm forward */}
    <Ln x1={38} y1={28} x2={26} y2={42} c={c} />
    <Jt x={26} y={42} c={c} />
    <Ln x1={26} y1={42} x2={18} y2={34} c={c} />
    <Jt x={54} y={54} c={c} />
    {/* front leg — knee driving */}
    <Ln x1={54} y1={54} x2={68} y2={68} c={c} />
    <Jt x={68} y={68} c={c} />
    <Ln x1={68} y1={68} x2={72} y2={48} c={c} />
    {/* back leg — pushing off */}
    <Ln x1={54} y1={54} x2={40} y2={78} c={c} />
    <Jt x={40} y={78} c={c} />
    <Ln x1={40} y1={78} x2={34} y2={114} c={c} />
  </G>
);

/* ── CRUNCH (side view) ─────────────────────────────────── */
const CrunchFlat = ({ c }) => (
  <G>
    <Gnd c={c} />
    <Hd x={78} y={76} c={c} />
    <Ln x1={72} y1={82} x2={22} y2={82} c={c} />
    <Jt x={58} y={82} c={c} /><Jt x={36} y={82} c={c} />
    {/* knees bent */}
    <Ln x1={36} y1={82} x2={22} y2={66} c={c} />
    <Jt x={22} y={66} c={c} />
    <Ln x1={22} y1={66} x2={12} y2={82} c={c} />
    {/* arms at sides */}
    <Ln x1={58} y1={82} x2={62} y2={74} c={c} />
    <Jt x={62} y={74} c={c} />
    <Ln x1={62} y1={74} x2={72} y2={78} c={c} />
  </G>
);

const CrunchUp = ({ c }) => (
  <G>
    <Gnd c={c} />
    {/* torso 40° up */}
    <Hd x={62} y={54} c={c} />
    <Ln x1={56} y1={62} x2={22} y2={82} c={c} />
    <Jt x={46} y={68} c={c} /><Jt x={34} y={78} c={c} />
    <Ln x1={34} y1={78} x2={20} y2={64} c={c} />
    <Jt x={20} y={64} c={c} />
    <Ln x1={20} y1={64} x2={12} y2={82} c={c} />
    {/* arms reaching forward */}
    <Ln x1={56} y1={62} x2={42} y2={56} c={c} />
    <Jt x={42} y={56} c={c} />
    <Ln x1={42} y1={56} x2={30} y2={60} c={c} />
  </G>
);

/* ── LEG RAISE ──────────────────────────────────────────── */
const LegRaiseFlat = ({ c }) => (
  <G>
    <Gnd c={c} />
    <Hd x={82} y={76} c={c} />
    <Ln x1={76} y1={82} x2={18} y2={82} c={c} />
    <Jt x={60} y={82} c={c} /><Jt x={38} y={82} c={c} />
    <Ln x1={38} y1={82} x2={10} y2={82} c={c} />
    <Jt x={24} y={82} c={c} />
    <Ln x1={76} y1={82} x2={84} y2={74} c={c} />
  </G>
);

const LegRaiseUp = ({ c }) => (
  <G>
    <Gnd c={c} />
    <Hd x={82} y={76} c={c} />
    <Ln x1={76} y1={82} x2={18} y2={82} c={c} />
    <Jt x={60} y={82} c={c} /><Jt x={38} y={82} c={c} />
    {/* legs raised vertical */}
    <Ln x1={38} y1={82} x2={30} y2={42} c={c} />
    <Jt x={30} y={42} c={c} />
    <Ln x1={38} y1={82} x2={46} y2={42} c={c} />
    <Jt x={46} y={42} c={c} />
    <Ln x1={76} y1={82} x2={84} y2={74} c={c} />
  </G>
);

/* ── LATERAL RAISE ──────────────────────────────────────── */
// Arms at sides (start)
const LateralDown = ({ c }) => (
  <G>
    <Gnd c={c} />
    <Hd x={50} y={12} c={c} />
    <Ln x1={50} y1={22} x2={50} y2={26} c={c} />
    <Ln x1={50} y1={26} x2={50} y2={56} c={c} />
    <Jt x={38} y={28} c={c} /><Jt x={62} y={28} c={c} />
    <Ln x1={38} y1={28} x2={50} y2={26} c={c} />
    <Ln x1={62} y1={28} x2={50} y2={26} c={c} />
    {/* arms down at sides with dumbbells */}
    <Ln x1={38} y1={28} x2={34} y2={54} c={c} />
    <Jt x={34} y={54} c={c} />
    <Ln x1={34} y1={54} x2={32} y2={72} c={c} />
    <Db cx={32} cy={80} c={c} />
    <Ln x1={62} y1={28} x2={66} y2={54} c={c} />
    <Jt x={66} y={54} c={c} />
    <Ln x1={66} y1={54} x2={68} y2={72} c={c} />
    <Db cx={68} cy={80} c={c} />
    <Jt x={44} y={56} c={c} /><Jt x={56} y={56} c={c} />
    <Ln x1={44} y1={56} x2={50} y2={56} c={c} />
    <Ln x1={56} y1={56} x2={50} y2={56} c={c} />
    <Ln x1={44} y1={56} x2={41} y2={84} c={c} />
    <Jt x={41} y={84} c={c} />
    <Ln x1={41} y1={84} x2={39} y2={114} c={c} />
    <Ln x1={56} y1={56} x2={59} y2={84} c={c} />
    <Jt x={59} y={84} c={c} />
    <Ln x1={59} y1={84} x2={61} y2={114} c={c} />
  </G>
);

// Arms raised to shoulder height — T shape (end)
const LateralUp = ({ c }) => (
  <G>
    <Gnd c={c} />
    <Hd x={50} y={12} c={c} />
    <Ln x1={50} y1={22} x2={50} y2={26} c={c} />
    <Ln x1={50} y1={26} x2={50} y2={56} c={c} />
    <Jt x={38} y={28} c={c} /><Jt x={62} y={28} c={c} />
    <Ln x1={38} y1={28} x2={50} y2={26} c={c} />
    <Ln x1={62} y1={28} x2={50} y2={26} c={c} />
    {/* arms out horizontal — T shape */}
    <Ln x1={38} y1={28} x2={20} y2={28} c={c} />
    <Jt x={20} y={28} c={c} />
    <Ln x1={20} y1={28} x2={8}  y2={30} c={c} />
    <Db cx={4} cy={30} c={c} />
    <Ln x1={62} y1={28} x2={80} y2={28} c={c} />
    <Jt x={80} y={28} c={c} />
    <Ln x1={80} y1={28} x2={92} y2={30} c={c} />
    <Db cx={96} cy={30} c={c} />
    <Jt x={44} y={56} c={c} /><Jt x={56} y={56} c={c} />
    <Ln x1={44} y1={56} x2={50} y2={56} c={c} />
    <Ln x1={56} y1={56} x2={50} y2={56} c={c} />
    <Ln x1={44} y1={56} x2={41} y2={84} c={c} />
    <Jt x={41} y={84} c={c} />
    <Ln x1={41} y1={84} x2={39} y2={114} c={c} />
    <Ln x1={56} y1={56} x2={59} y2={84} c={c} />
    <Jt x={59} y={84} c={c} />
    <Ln x1={59} y1={84} x2={61} y2={114} c={c} />
  </G>
);

/* ── ARROW ──────────────────────────────────────────────── */
const Arrow = ({ color }) => (
  <Svg width={28} height={28} viewBox="0 0 28 28">
    <Line x1={4}  y1={14} x2={24} y2={14} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Line x1={16} y1={7}  x2={24} y2={14} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Line x1={16} y1={21} x2={24} y2={14} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
  </Svg>
);

/* ── Mapping ────────────────────────────────────────────── */
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
  if (/סקוואט|לגפרס|בולגר/.test(name))                      return 'squat';
  if (/לחיצת חזה|פרפר|מקבילים|לחיצות/.test(name))          return 'bench';
  if (/פולאפ|פולי עליון|משיכת פולי/.test(name))             return 'pullup';
  if (/דדליפט/.test(name))                                  return 'deadlift';
  if (/כריות|כריה|lateral/i.test(name))                     return 'lateral';
  if (/לחיצת כתפיים|כתפיים עם/.test(name))                  return 'ohp';
  if (/ביצפס|כפיפות.*יד|פטיש/.test(name))                  return 'curl';
  if (/פלאנק/.test(name))                                   return 'plank';
  if (/לאנג/.test(name))                                    return 'lunge';
  if (/חתיר|שכיבה.*מוט/.test(name))                        return 'row';
  if (/ריצה|ספרינט|הליכה|ברפי|קפיצה|טיפוס|ברכיים גבוהות/.test(name)) return 'run';
  if (/בטן|כפיפות בטן|סיבוב|Russian/.test(name))            return 'crunch';
  if (/הרמת רגל|הרמות רגל/.test(name))                      return 'legraise';
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
