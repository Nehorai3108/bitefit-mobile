import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, TextInput,
  Pressable, Platform, KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Polyline, Line, Circle, Text as SvgText } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { fetchProfile } from '../api/client';
import { useTheme } from '../context/ThemeContext';

const KEY = '@weight_log_v1';

function isoWeek(d) {
  // Monday-based week id (YYYY-Www) so one weigh-in per week.
  const dt = new Date(d);
  const day = (dt.getDay() + 6) % 7;
  dt.setDate(dt.getDate() - day);
  return dt.toISOString().slice(0, 10);
}

export default function WeightProgress() {
  const { C } = useTheme();
  const s = useMemo(() => makeS(C), [C]);
  const [log, setLog]       = useState([]);      // [{date, kg}]
  const [goal, setGoal]     = useState(null);
  const [start, setStart]   = useState(null);
  const [modal, setModal]   = useState(false);
  const [input, setInput]   = useState('');

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      const arr = raw ? JSON.parse(raw) : [];
      const prof = await fetchProfile().catch(() => null);
      if (prof) {
        if (prof.target_weight) setGoal(+prof.target_weight);
        if (prof.weight_kg)     setStart(+prof.weight_kg);
        // Seed the first point from the profile weight if nothing logged yet.
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
    const wk = isoWeek(today);
    const next = [...log];
    // one entry per week — replace if the last is in the same week
    if (next.length && isoWeek(next[next.length - 1].date) === wk) {
      next[next.length - 1] = { date: today, kg };
    } else {
      next.push({ date: today, kg });
    }
    setLog(next);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
    setInput(''); setModal(false);
  };

  const current   = log.length ? log[log.length - 1].kg : start;
  const thisWeek  = log.length && isoWeek(log[log.length - 1].date) === isoWeek(new Date().toISOString().slice(0, 10));
  const toGo      = (current != null && goal != null) ? (current - goal) : null;

  // ── graph geometry ──
  const W = 300, H = 120, PAD = 14;
  const pts = log.map(e => e.kg);
  const withGoal = goal != null ? [...pts, goal] : pts;
  const min = Math.min(...withGoal), max = Math.max(...withGoal);
  const span = Math.max(1, max - min);
  const x = (i) => log.length <= 1 ? W / 2 : PAD + (i * (W - 2 * PAD)) / (log.length - 1);
  const y = (kg) => H - PAD - ((kg - min) / span) * (H - 2 * PAD);
  const poly = log.map((e, i) => `${x(i)},${y(e.kg)}`).join(' ');

  return (
    <View style={s.card}>
      <View style={s.head}>
        <TouchableOpacity style={s.addBtn} onPress={() => { setInput(current ? String(current) : ''); setModal(true); }}>
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={s.addTxt}>עדכן משקל</Text>
        </TouchableOpacity>
        <Text style={s.title}>התקדמות משקל</Text>
      </View>

      <View style={s.statsRow}>
        <Stat s={s} label="נוכחי" val={current != null ? `${current}` : '—'} unit='ק"ג' />
        <Stat s={s} label="יעד" val={goal != null ? `${goal}` : '—'} unit='ק"ג' />
        <Stat s={s} label={toGo != null && toGo >= 0 ? 'נותר לרדת' : 'נותר לעלות'}
          val={toGo != null ? Math.abs(toGo).toFixed(1) : '—'} unit='ק"ג' accent />
      </View>

      {/* graph */}
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} style={{ marginTop: 8 }}>
        {goal != null && (
          <Line x1={PAD} y1={y(goal)} x2={W - PAD} y2={y(goal)}
            stroke={C.textFaint} strokeWidth="1" strokeDasharray="4 4" />
        )}
        {log.length > 1 && (
          <Polyline points={poly} fill="none" stroke={C.text} strokeWidth="2.5"
            strokeLinejoin="round" strokeLinecap="round" />
        )}
        {log.map((e, i) => (
          <Circle key={i} cx={x(i)} cy={y(e.kg)} r={i === log.length - 1 ? 5 : 3.5}
            fill={i === log.length - 1 ? C.text : C.surface} stroke={C.text} strokeWidth="2" />
        ))}
      </Svg>

      {!thisWeek && (
        <Text style={s.nudge}>עדכן את המשקל שלך לשבוע הזה כדי לעקוב אחרי ההתקדמות 👆</Text>
      )}

      {/* input modal */}
      <Modal visible={modal} transparent animationType="fade" onRequestClose={() => setModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalRoot}>
          <Pressable style={s.modalBg} onPress={() => setModal(false)} />
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>המשקל שלך השבוע</Text>
            <TextInput style={s.modalInput} value={input} onChangeText={setInput}
              keyboardType="decimal-pad" placeholder='ק"ג' placeholderTextColor={C.placeholder}
              autoFocus textAlign="center" />
            <TouchableOpacity style={s.modalSave} onPress={save}>
              <Text style={s.modalSaveTxt}>שמור</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function Stat({ s, label, val, unit, accent }) {
  return (
    <View style={s.stat}>
      <Text style={[s.statVal, accent && s.statAccent]}>{val} <Text style={s.statUnit}>{unit}</Text></Text>
      <Text style={s.statLbl}>{label}</Text>
    </View>
  );
}

const makeS = (C) => StyleSheet.create({
  card: { backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border,
          marginHorizontal: 16, marginBottom: 16, padding: 16 },
  head: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '800', color: C.text },
  addBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 3, backgroundColor: C.text,
            borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  addTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },

  statsRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: 14 },
  stat: { alignItems: 'center', flex: 1 },
  statVal: { fontSize: 18, fontWeight: '800', color: C.text },
  statAccent: { color: C.text },
  statUnit: { fontSize: 11, fontWeight: '600', color: C.textDim },
  statLbl: { fontSize: 12, color: C.textDim, marginTop: 2 },

  nudge: { fontSize: 12, color: C.textMuted, textAlign: 'center', marginTop: 10 },

  modalRoot: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalCard: { width: '80%', backgroundColor: C.surface, borderRadius: 20, padding: 20, alignItems: 'center' },
  modalTitle: { fontSize: 17, fontWeight: '800', color: C.text, marginBottom: 14 },
  modalInput: { alignSelf: 'stretch', backgroundColor: C.surface2, borderRadius: 14, paddingVertical: 16,
                fontSize: 26, fontWeight: '800', color: C.text },
  modalSave: { alignSelf: 'stretch', backgroundColor: C.text, borderRadius: 24, paddingVertical: 15,
               alignItems: 'center', marginTop: 16 },
  modalSaveTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
