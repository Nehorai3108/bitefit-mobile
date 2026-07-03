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
const RANGES = [
  { key: 90,    label: '90 ימים' },
  { key: 180,   label: '6 חודשים' },
  { key: 365,   label: 'שנה' },
  { key: 99999, label: 'הכל' },
];

const fmtDate = (iso) => { const d = new Date(iso); return `${d.getDate()} ${HE_MON[d.getMonth()]}׳`; };
function isoWeek(d) {
  const dt = new Date(d); const day = (dt.getDay() + 6) % 7;
  dt.setDate(dt.getDate() - day); return dt.toISOString().slice(0, 10);
}

export default function WeightProgress() {
  const { C } = useTheme();
  const s = useMemo(() => makeS(C), [C]);
  const [log, setLog]   = useState([]);
  const [goal, setGoal] = useState(null);
  const [start, setStart] = useState(null);
  const [range, setRange] = useState(99999);
  const [modal, setModal] = useState(false);
  const [input, setInput] = useState('');

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      const arr = raw ? JSON.parse(raw) : [];
      const prof = await fetchProfile().catch(() => null);
      if (prof) {
        if (prof.target_weight) setGoal(+prof.target_weight);
        if (prof.weight_kg)     setStart(+prof.weight_kg);
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

  // filter by range
  const cutoff = Date.now() - range * 864e5;
  const data = log.filter(e => new Date(e.date).getTime() >= cutoff);
  const view = data.length ? data : log.slice(-1);

  const current = view.length ? view[view.length - 1].kg : start;
  const first   = view.length ? view[0].kg : current;
  const delta   = current != null && first != null ? +(current - first).toFixed(1) : 0;
  const thisWeek = log.length && isoWeek(log[log.length - 1].date) === isoWeek(new Date().toISOString().slice(0, 10));
  const progress = (goal != null && start != null && goal !== start)
    ? Math.max(0, Math.min(100, Math.round(((start - current) / (start - goal)) * 100))) : null;

  // ── geometry ──
  const W = 340, H = 190, PL = 30, PR = 12, PT = 30, PB = 26;
  const kgs = view.map(e => e.kg);
  const all = goal != null ? [...kgs, goal] : kgs;
  let lo = Math.min(...all), hi = Math.max(...all);
  if (lo === hi) { lo -= 1; hi += 1; }
  const pad = (hi - lo) * 0.15; lo -= pad; hi += pad;
  const x = (i) => view.length <= 1 ? (PL + (W - PL - PR) / 2) : PL + (i * (W - PL - PR)) / (view.length - 1);
  const y = (kg) => PT + (1 - (kg - lo) / (hi - lo)) * (H - PT - PB);
  const line = view.map((e, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(e.kg)}`).join(' ');
  const area = view.length > 1
    ? `${line} L ${x(view.length - 1)} ${H - PB} L ${x(0)} ${H - PB} Z` : '';
  const ticks = 4;
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => lo + ((hi - lo) * i) / ticks);
  const last = view.length - 1;

  return (
    <View style={s.card}>
      {/* header */}
      <View style={s.head}>
        <TouchableOpacity style={s.addBtn} onPress={() => { setInput(current ? String(current) : ''); setModal(true); }} activeOpacity={0.85}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={s.title}>מעקב משקל</Text>
          <View style={s.weightRow}>
            {delta !== 0 && (
              <View style={s.badge}>
                <Text style={s.badgeTxt}>{delta > 0 ? '+' : ''}{delta} ק"ג</Text>
              </View>
            )}
            <Text style={s.bigW}>{current != null ? current : '—'} <Text style={s.bigUnit}>ק"ג</Text></Text>
          </View>
          <Text style={s.goalTxt}>יעד {goal != null ? goal : '—'} ק"ג{progress != null ? ` · ${progress}% מהיעד` : ''}</Text>
        </View>
      </View>

      {/* chart */}
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} style={{ marginTop: 6 }}>
        <Defs>
          <LinearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={GREEN} stopOpacity="0.28" />
            <Stop offset="1" stopColor={GREEN} stopOpacity="0.02" />
          </LinearGradient>
        </Defs>
        {/* gridlines + y labels */}
        {yTicks.map((t, i) => (
          <G key={i}>
            <Line x1={PL} y1={y(t)} x2={W - PR} y2={y(t)} stroke={C.surface3} strokeWidth="1" />
            <SvgText x={PL - 6} y={y(t) + 3} fontSize="9" fill={C.textDim} textAnchor="end">{Math.round(t)}</SvgText>
          </G>
        ))}
        {/* goal line */}
        {goal != null && (
          <G>
            <Line x1={PL} y1={y(goal)} x2={W - PR} y2={y(goal)} stroke={C.textFaint} strokeWidth="1" strokeDasharray="4 4" />
            <SvgText x={W - PR} y={y(goal) - 4} fontSize="9" fill={C.textDim} textAnchor="end">יעד {goal}</SvgText>
          </G>
        )}
        {/* area + line */}
        {area ? <Path d={area} fill="url(#wg)" /> : null}
        {view.length > 1 && <Path d={line} fill="none" stroke={GREEN} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />}
        {/* dots */}
        {view.map((e, i) => (
          <Circle key={i} cx={x(i)} cy={y(e.kg)} r={i === last ? 5 : 3}
            fill={i === last ? GREEN : '#fff'} stroke={GREEN} strokeWidth="2" />
        ))}
        {/* x labels */}
        {view.map((e, i) => (
          (view.length <= 5 || i === 0 || i === last || i === Math.floor(last / 2))
            ? <SvgText key={`x${i}`} x={x(i)} y={H - 8} fontSize="9" fill={C.textDim} textAnchor="middle">{fmtDate(e.date)}</SvgText>
            : null
        ))}
        {/* tooltip on last point */}
        {view.length > 0 && (
          <G>
            <Rect x={Math.min(Math.max(x(last) - 34, 2), W - 70)} y={Math.max(y(view[last].kg) - 34, 2)}
              width="68" height="26" rx="7" fill={C.text} />
            <SvgText x={Math.min(Math.max(x(last), 36), W - 36)} y={Math.max(y(view[last].kg) - 16, 20)}
              fontSize="11" fontWeight="bold" fill="#fff" textAnchor="middle">{view[last].kg} ק"ג</SvgText>
          </G>
        )}
      </Svg>

      {/* range selector */}
      <View style={s.segs}>
        {RANGES.map(r => (
          <TouchableOpacity key={r.key} style={[s.seg, range === r.key && s.segOn]} onPress={() => setRange(r.key)} activeOpacity={0.8}>
            <Text style={[s.segTxt, range === r.key && s.segTxtOn]}>{r.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {!thisWeek && <Text style={s.nudge}>עדכן את המשקל שלך לשבוע הזה כדי לעקוב אחרי ההתקדמות 👆</Text>}

      {/* modal */}
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
  head: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 15, fontWeight: '700', color: C.textMuted },
  weightRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginTop: 2 },
  bigW: { fontSize: 30, fontWeight: '800', color: C.text },
  bigUnit: { fontSize: 14, fontWeight: '600', color: C.textDim },
  badge: { backgroundColor: '#e3f6ea', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeTxt: { color: GREEN_D, fontSize: 12, fontWeight: '800' },
  goalTxt: { fontSize: 12, color: C.textDim, marginTop: 3 },
  addBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },

  segs: { flexDirection: 'row-reverse', backgroundColor: C.surface2, borderRadius: 12, padding: 3, marginTop: 6 },
  seg: { flex: 1, alignItems: 'center', paddingVertical: 7, borderRadius: 9 },
  segOn: { backgroundColor: C.surface, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  segTxt: { fontSize: 12, color: C.textDim, fontWeight: '600' },
  segTxtOn: { color: C.text, fontWeight: '800' },

  nudge: { fontSize: 12, color: C.textMuted, textAlign: 'center', marginTop: 12 },

  modalRoot: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalCard: { width: '80%', backgroundColor: C.surface, borderRadius: 20, padding: 20, alignItems: 'center' },
  modalTitle: { fontSize: 17, fontWeight: '800', color: C.text, marginBottom: 14 },
  modalInput: { alignSelf: 'stretch', backgroundColor: C.surface2, borderRadius: 14, paddingVertical: 16, fontSize: 26, fontWeight: '800', color: C.text },
  modalSave: { alignSelf: 'stretch', backgroundColor: GREEN, borderRadius: 24, paddingVertical: 15, alignItems: 'center', marginTop: 16 },
  modalSaveTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
