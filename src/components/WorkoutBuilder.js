import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Modal,
  ScrollView, Alert, Platform, KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';

export const CUSTOM_KEY = '@custom_workouts_v1';

const TYPES = [
  { key: 'strength', label: 'כוח', icon: 'barbell-outline' },
  { key: 'running',  label: 'ריצה', icon: 'walk-outline' },
  { key: 'hiit',     label: 'HIIT', icon: 'flame-outline' },
  { key: 'mixed',    label: 'מעורב', icon: 'shuffle-outline' },
];

const blank = () => ({ name: '', sets: '3', reps: '12' });

export default function WorkoutBuilder({ visible, onClose, onSaved }) {
  const { C } = useTheme();
  const s = useMemo(() => makeS(C), [C]);
  const [name, setName]   = useState('');
  const [type, setType]   = useState('strength');
  const [rows, setRows]   = useState([blank()]);

  const reset = () => { setName(''); setType('strength'); setRows([blank()]); };
  const close = () => { reset(); onClose(); };

  const setRow = (i, k, v) => setRows(rs => rs.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  const addRow = () => setRows(rs => [...rs, blank()]);
  const delRow = (i) => setRows(rs => rs.length > 1 ? rs.filter((_, idx) => idx !== i) : rs);

  const save = async () => {
    const nm = name.trim();
    if (!nm) { Alert.alert('', 'תן שם לאימון'); return; }
    const exercises = rows
      .filter(r => r.name.trim())
      .map(r => ({ name: r.name.trim(), sets: parseInt(r.sets) || 1, reps: `${parseInt(r.reps) || 10} חזרות`, rest: '60 שניות', muscles: '', tip: '' }));
    if (exercises.length === 0) { Alert.alert('', 'הוסף לפחות תרגיל אחד'); return; }
    const workout = {
      id: 'cw_' + Date.now(),
      name: nm, type, day: 'אימון מותאם', custom: true,
      duration: Math.max(15, exercises.length * 6),
      muscles: '', note: '', warmup: [], cooldown: [], exercises,
    };
    try {
      const raw = await AsyncStorage.getItem(CUSTOM_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      arr.unshift(workout);
      await AsyncStorage.setItem(CUSTOM_KEY, JSON.stringify(arr));
      onSaved?.(workout);
      close();
    } catch { Alert.alert('שגיאה', 'לא הצלחתי לשמור'); }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.header}>
            <TouchableOpacity onPress={close}><Ionicons name="close" size={24} color={C.text} /></TouchableOpacity>
            <Text style={s.title}>בניית אימון</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={s.label}>שם האימון</Text>
            <TextInput style={s.input} value={name} onChangeText={setName}
              placeholder='למשל "יום חזה וגב"' placeholderTextColor={C.placeholder} textAlign="right" />

            <Text style={s.label}>סוג</Text>
            <View style={s.typeRow}>
              {TYPES.map(t => (
                <TouchableOpacity key={t.key} style={[s.typeChip, type === t.key && s.typeChipOn]} onPress={() => setType(t.key)}>
                  <Ionicons name={t.icon} size={15} color={type === t.key ? '#fff' : C.textMuted} />
                  <Text style={[s.typeTxt, type === t.key && s.typeTxtOn]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.label}>תרגילים</Text>
            {rows.map((r, i) => (
              <View key={i} style={s.exRow}>
                <TouchableOpacity onPress={() => delRow(i)} style={s.exDel}>
                  <Ionicons name="remove-circle-outline" size={22} color={C.textFaint} />
                </TouchableOpacity>
                <View style={s.exNum}><TextInput style={s.exNumInput} value={r.reps} onChangeText={v => setRow(i, 'reps', v)} keyboardType="number-pad" textAlign="center" /><Text style={s.exNumLbl}>חזרות</Text></View>
                <View style={s.exNum}><TextInput style={s.exNumInput} value={r.sets} onChangeText={v => setRow(i, 'sets', v)} keyboardType="number-pad" textAlign="center" /><Text style={s.exNumLbl}>סטים</Text></View>
                <TextInput style={s.exName} value={r.name} onChangeText={v => setRow(i, 'name', v)}
                  placeholder="שם התרגיל" placeholderTextColor={C.placeholder} textAlign="right" />
              </View>
            ))}
            <TouchableOpacity style={s.addRow} onPress={addRow}>
              <Ionicons name="add" size={18} color="#3a7a4a" />
              <Text style={s.addRowTxt}>הוסף תרגיל</Text>
            </TouchableOpacity>
          </ScrollView>

          <TouchableOpacity style={s.saveBtn} onPress={save} activeOpacity={0.85}>
            <Text style={s.saveTxt}>שמור אימון</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const makeS = (C) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: Platform.OS === 'ios' ? 34 : 20, maxHeight: '90%' },
  header: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { color: C.text, fontSize: 19, fontWeight: '800' },
  label: { color: C.textMuted, fontSize: 13, fontWeight: '700', textAlign: 'right', marginBottom: 8, marginTop: 6 },
  input: { backgroundColor: C.surface2, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, fontSize: 16, color: C.text, marginBottom: 6 },
  typeRow: { flexDirection: 'row-reverse', gap: 8, marginBottom: 6, flexWrap: 'wrap' },
  typeChip: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5, backgroundColor: C.surface2, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9 },
  typeChipOn: { backgroundColor: '#3a7a4a' },
  typeTxt: { color: C.textMuted, fontSize: 14, fontWeight: '600' },
  typeTxtOn: { color: '#fff' },
  exRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 8 },
  exName: { flex: 1, backgroundColor: C.surface2, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15, color: C.text },
  exNum: { alignItems: 'center', width: 46 },
  exNumInput: { backgroundColor: C.surface2, borderRadius: 10, width: 46, paddingVertical: 9, fontSize: 15, fontWeight: '700', color: C.text },
  exNumLbl: { fontSize: 10, color: C.textDim, marginTop: 2 },
  exDel: { padding: 2 },
  addRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, marginTop: 4 },
  addRowTxt: { color: '#3a7a4a', fontSize: 15, fontWeight: '700' },
  saveBtn: { backgroundColor: '#3a7a4a', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 12 },
  saveTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
