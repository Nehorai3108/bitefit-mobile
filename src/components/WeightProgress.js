import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, TextInput,
  Pressable, Platform, KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, {
  Path, Line, Circle, Defs, LinearGradient, Stop, Rect, Text as SvgText, G,
} from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { fetchProfile } from '../api/client';
import { useTheme } from '../context/ThemeContext';

const KEY = '@weight_log_v1';
const GREEN = '#2f9e57';
const GREEN_D = '#1f7a41';
const HE_MON = ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יונ', 'יול', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'];
const DAY = 864e5;

const fmt = (t) => { const d = new Date(t); return `${d.getDate()} ${HE_MON[d.getMonth()]}׳`; };
function isoWeek(d) {
  const dt = new Date(d); const day = (dt.getDay() + 6) % 7;
  dt.setDate(dt.getDate() - day); return dt.toISOString().slice(0, 10);
}

export default function WeightProgress() {
  const { C } = useTheme();
  const s = useMemo(() => makeS(C), [C]);
  const [log, setLog]     = useState([]);
  const [goal, setGoal]   = useState(null);
  const [start, setStart] = useState(null);
  const [weeks, setWeeks] = useState(12);
  const [modal, setModal] = useState(false);
  const [input, setInput] = useState('');
  const [sel, setSel]     = useState(null);   // tapped point index

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      const arr = raw ? JSON.parse(raw) : [];
      const prof = await fetchProfile().catch(() => null);
      if (prof) {
        if (prof.target_weight) setGoal(+prof.target_weight);
        if (prof.weight_kg)     setStart(+prof.weight_kg);
        if (prof.weeks_to_goal) setWeeks(+prof.weeks_to_goal);
        if (arr.length === 0 && prof.weight_kg) {
          arr.push({ date: new Date().toISOString().slice(0, 10), kg: +prof.weight_kg });
          await AsyncStorage.setItem(KEY, JSON.stringify(arr));
        }
      }
      setLog(arr);
    } catch (_) {}
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const save = async () => {
    const kg = parseFloat(input);
    if (!kg || kg < 30 || kg > 300) return;
    const today = new Date().toISOString().slice(0, 10);
    const next = [...log];
    if (next.length && isoWeek(next[next.length - 1].date) === isoWeek(today)) next[next.length - 1] = { date: today, kg };
    else next.push({ date: today, kg });
    setLog(next);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
    setInput(''); setModal(false);
  };

  const current  = log.length ? log[log.length - 1].kg : start;
  const first    = log.length ? log[0].kg : current;
  const delta    = current != null && first != null ? +(current - first).toFixed(1) : 0;
  const thisWeek = log.length && isoWeek(log[log.length - 1].date) === isoWeek(new Date().toISOString().slice(0, 10));
  const progress = (goal != null && first != null && goal !== first)
    ? Math.max(0, Math.min(100, Math.round(((first - current) / (first - goal)) * 100))) : null;

  // ── geometry: actual history (solid) + projection to goal (dashed) ──
  const W = 340, H = 195, PL = 30, PR = 14, PT = 26, PB = 26;
  const now = Date.now();
  const startT  = log.length ? new Date(log[0].date).getTime() : now;
  const targetT = now + weeks * 7 * DAY;
  const xMin = Math.min(startT, now), xMax = Math.max(targetT, now + 7 * DAY);
  const X = (t) => PL + ((t - xMin) / (xMax - xMin)) * (W - PL - PR);

  const kgs = log.map(e => e.kg);
  const all = [...kgs, ...(goal != null ? [goal] : []), ...(current != null ? [current] : [])];
  let lo = Math.min(...all), hi = Math.max(...all);
  if (lo === hi) { lo -= 1; hi += 1; }
  const pad = (hi - lo) * 0.18; lo -= pad; hi += pad;
  const Y = (kg) => PT + (1 - (kg - lo) / (hi - lo)) * (H - PT - PB);

  const actual = log.map((e, i) => `${i === 0 ? 'M' : 'L'} ${X(new Date(e.date).getTime())} ${Y(e.kg)}`).join(' ');
  const areaD = log.length
    ? `${actual} L ${X(now)} ${H - PB} L ${X(startT)} ${H - PB} Z` : '';
  const proj = (current != null && goal != null)
    ? `M ${X(now)} ${Y(current)} L ${X(targetT)} ${Y(goal)}` : '';
  const yTicks = Array.from({ length: 5 }, (_, i) => lo + ((hi - lo) * i) / 4);
  const last = log.length - 1;
  const selIdx = (sel != null && sel <= last) ? sel : last;

  return (
    <View style={s.card}>
      {/* header — title on the right, + on the left */}
      <View style={s.head}>
        <TouchableOpacity style={s.addBtn} onPress={() => { setInput(current ? String(current) : ''); setModal(true); }} activeOpacity={0.85}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={s.title}>מעקב משקל</Text>
          <View style={s.weightRow}>
            {delta !== 0 && (
              <View style={s.badge}><Text style={s.badgeTxt}>{delta > 0 ? '+' : ''}{delta} ק"ג</Text></View>
            )}
            <Text style={s.bigW}>{current != null ? current : '—'} <Text style={s.bigUnit}>ק"ג</Text></Text>
          </View>
          <Text style={s.goalTxt}>יעד {goal != null ? goal : '—'} ק"ג{progress != null ? ` · ${progress}% מהיעד` : ''}</Text>
        </View>
      </View>

      {/* chart */}
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} style={{ marginTop: 8 }}>
        <Defs>
          <LinearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={GREEN} stopOpacity="0.26" />
            <Stop offset="1" stopColor={GREEN} stopOpacity="0.02" />
          </LinearGradient>
        </Defs>

        {yTicks.map((t, i) => (
          <G key={i}>
            <Line x1={PL} y1={Y(t)} x2={W - PR} y2={Y(t)} stroke={C.surface3} strokeWidth="1" />
            <SvgText x={PL - 6} y={Y(t) + 3} fontSize="9" fill={C.textDim} textAnchor="end">{Math.round(t)}</SvgText>
          </G>
        ))}

        {/* today marker */}
        <Line x1={X(now)} y1={PT} x2={X(now)} y2={H - PB} stroke={C.border} strokeWidth="1" strokeDasharray="2 3" />

        {/* actual area + line */}
        {areaD ? <Path d={areaD} fill="url(#wg)" /> : null}
        {log.length > 1 && <Path d={actual} fill="none" stroke={GREEN} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />}

        {/* projection to goal (dashed) */}
        {proj ? <Path d={proj} fill="none" stroke={GREEN} strokeWidth="2.5" strokeLinecap="round" opacity="0.55" /> : null}

        {/* actual dots */}
        {log.map((e, i) => (
          <Circle key={i} cx={X(new Date(e.date).getTime())} cy={Y(e.kg)} r={i === selIdx ? 6 : 3.5}
            fill={i === selIdx ? GREEN : '#fff'} stroke={GREEN} strokeWidth="2" />
        ))}
        {/* bigger invisible tap targets */}
        {log.map((e, i) => (
          <Circle key={`hit${i}`} cx={X(new Date(e.date).getTime())} cy={Y(e.kg)} r={16}
            fill="transparent" onPress={() => setSel(i)} onPressIn={() => setSel(i)} />
        ))}
        {/* tooltip for the selected point */}
        {log.length > 0 && (() => {
          const e = log[selIdx]; const px = X(new Date(e.date).getTime()); const py = Y(e.kg);
          const tx = Math.min(Math.max(px, 42), W - 42); const ty = Math.max(py - 36, 2);
          return (
            <G>
              <Rect x={tx - 40} y={ty} width="80" height="30" rx="7" fill={C.text} />
              <SvgText x={tx} y={ty + 13} fontSize="11" fontWeight="bold" fill="#fff" textAnchor="middle">{e.kg} ק"ג</SvgText>
              <SvgText x={tx} y={ty + 24} fontSize="8" fill="#cfcfcf" textAnchor="middle">{fmt(new Date(e.date).getTime())}</SvgText>
            </G>
          );
        })()}
        {/* goal point at the end */}
        {goal != null && (
          <G>
            <Circle cx={X(targetT)} cy={Y(goal)} r="6" fill="#fff" stroke={GREEN_D} strokeWidth="2.5" />
            <SvgText x={X(targetT)} y={Y(goal) - 12} fontSize="10" fontWeight="bold" fill={GREEN_D} textAnchor="middle">היעד</SvgText>
          </G>
        )}

        {/* x-axis: evenly spaced date labels along the timeline */}
        {Array.from({ length: 4 }, (_, i) => xMin + ((xMax - xMin) * i) / 3).map((t, i) => (
          <SvgText key={`xl${i}`} x={X(t)} y={H - 6} fontSize="10"
            fill={C.textMuted} textAnchor={i === 0 ? 'start' : i === 3 ? 'end' : 'middle'}>{fmt(t)}</SvgText>
        ))}
        <SvgText x={X(now)} y={PT - 8} fontSize="10" fill={GREEN_D} fontWeight="bold" textAnchor="middle">היום</SvgText>
      </Svg>

      {!thisWeek && <Text style={s.nudge}>עדכן את המשקל שלך לשבוע הזה כדי לעקוב אחרי ההתקדמות 👆</Text>}

      <Modal visible={modal} transparent animationType="fade" onRequestClose={() => setModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalRoot}>
          <Pressable style={s.modalBg} onPress={() => setModal(false)} />
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>המשקל שלך השבוע</Text>
            <TextInput style={s.modalInput} value={input} onChangeText={setInput}
              keyboardType="decimal-pad" placeholder='ק"ג' placeholderTextColor={C.placeholder} autoFocus textAlign="center" />
            <TouchableOpacity style={s.modalSave} onPress={save}><Text style={s.modalSaveTxt}>שמור</Text></TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const makeS = (C) => StyleSheet.create({
  card: { backgroundColor: C.surface, borderRadius: 20, borderWidth: 1, borderColor: C.border,
          marginHorizontal: 16, marginBottom: 16, padding: 16 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 15, fontWeight: '700', color: C.textMuted },
  weightRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginTop: 2 },
  bigW: { fontSize: 30, fontWeight: '800', color: C.text },
  bigUnit: { fontSize: 14, fontWeight: '600', color: C.textDim },
  badge: { backgroundColor: '#e3f6ea', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeTxt: { color: GREEN_D, fontSize: 12, fontWeight: '800' },
  goalTxt: { fontSize: 12, color: C.textDim, marginTop: 3 },
  addBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },

  nudge: { fontSize: 12, color: C.textMuted, textAlign: 'center', marginTop: 12 },

  modalRoot: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalCard: { width: '80%', backgroundColor: C.surface, borderRadius: 20, padding: 20, alignItems: 'center' },
  modalTitle: { fontSize: 17, fontWeight: '800', color: C.text, marginBottom: 14 },
  modalInput: { alignSelf: 'stretch', backgroundColor: C.surface2, borderRadius: 14, paddingVertical: 16, fontSize: 26, fontWeight: '800', color: C.text },
  modalSave: { alignSelf: 'stretch', backgroundColor: GREEN, borderRadius: 24, paddingVertical: 15, alignItems: 'center', marginTop: 16 },
  modalSaveTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
