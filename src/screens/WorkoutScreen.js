import React, { useState, useCallback, useMemo } from 'react';
import { useSwipeNav } from '../hooks/useSwipeNav';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Modal, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { addWorkout, fetchWorkouts, deleteWorkout } from '../api/client';
import { useTheme } from '../context/ThemeContext';

const WORKOUT_TYPES = [
  { key: 'strength', label: 'כוח', icon: 'barbell-outline', color: '#3a7a4a' },
  { key: 'running',  label: 'ריצה', icon: 'walk-outline', color: '#56bd6b' },
  { key: 'cycling',  label: 'אופניים', icon: 'bicycle-outline', color: '#ffd700' },
  { key: 'swimming', label: 'שחייה', icon: 'water-outline', color: '#00bcd4' },
  { key: 'yoga',     label: 'יוגה', icon: 'body-outline', color: '#e91e63' },
  { key: 'hiit',     label: 'HIIT', icon: 'flame-outline', color: '#ef7d6c' },
];

const INTENSITIES = [
  { key: 'low',      label: 'נמוכה'   },
  { key: 'moderate', label: 'בינונית' },
  { key: 'high',     label: 'גבוהה'   },
  { key: 'extreme',  label: 'קיצונית' },
];

// MET values per workout type × intensity (based on ACSM/Compendium of Physical Activities)
const MET = {
  strength: { low: 3.0, moderate: 4.5, high: 6.0, extreme: 8.0  },
  running:  { low: 6.0, moderate: 9.0, high: 11.5, extreme: 14.5 },
  cycling:  { low: 4.0, moderate: 6.8, high: 9.5,  extreme: 12.0 },
  swimming: { low: 4.0, moderate: 6.0, high: 8.5,  extreme: 11.0 },
  yoga:     { low: 2.0, moderate: 3.0, high: 4.0,  extreme: 5.0  },
  hiit:     { low: 5.5, moderate: 8.0, high: 11.0, extreme: 14.0 },
};

// weightKg — ברירת מחדל 75 עד שנטמיע משיכת פרופיל
function calcCalories(durationMin, intensity, type = 'strength', weightKg = 75) {
  const met = MET[type]?.[intensity] ?? MET.strength.moderate;
  return Math.round((durationMin / 60) * met * weightKg);
}

// Map a backend workout_log row into the shape the UI renders.
function decorate(row) {
  const typeInfo = WORKOUT_TYPES.find(t => t.key === row.workout_type);
  let time = '';
  try { time = new Date(row.timestamp).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }); } catch {}
  return {
    id: row.entry_id,
    type: row.workout_type,
    duration: row.duration_minutes,
    intensity: row.intensity,
    distance: row.distance_km,
    calories: Math.round(row.calories_burned ?? 0),
    label: typeInfo?.label ?? row.workout_type,
    icon: typeInfo?.icon ?? 'fitness-outline',
    color: typeInfo?.color ?? '#3a7a4a',
    time,
  };
}

export default function WorkoutScreen({ navigation }) {
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const panHandlers = useSwipeNav(navigation, 'אימון');
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type: 'running', duration: '30', intensity: 'moderate', distance: '',
  });

  const load = useCallback(async () => {
    try {
      const r = await fetchWorkouts();
      setWorkouts((r.workouts ?? []).map(decorate).reverse());
    } catch { /* keep current */ }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const totalCalories = workouts.reduce((s, w) => s + (w.calories || 0), 0);
  const totalMinutes = workouts.reduce((s, w) => s + (parseInt(w.duration) || 0), 0);

  const handleAdd = async () => {
    if (!form.duration) { Alert.alert('שגיאה', 'הכנס משך זמן'); return; }
    const calories = calcCalories(parseInt(form.duration), form.intensity, form.type);
    setSaving(true);
    try {
      await addWorkout({
        workout_type: form.type,
        intensity: form.intensity,
        duration_minutes: parseInt(form.duration) || 0,
        calories_burned: calories,
        distance_km: form.distance ? parseFloat(form.distance) : null,
        mode: 'type',
      });
      setShowModal(false);
      setForm({ type: 'running', duration: '30', intensity: 'moderate', distance: '' });
      await load();
    } catch {
      Alert.alert('שגיאה', 'לא הצלחתי לשמור את האימון');
    } finally { setSaving(false); }
  };

  const handleDelete = (id) => {
    Alert.alert('מחיקת אימון', 'למחוק את האימון?', [
      { text: 'ביטול', style: 'cancel' },
      { text: 'מחק', style: 'destructive', onPress: async () => {
        try { await deleteWorkout(id); setWorkouts(prev => prev.filter(w => w.id !== id)); }
        catch { Alert.alert('שגיאה', 'לא הצלחתי למחוק'); }
      }},
    ]);
  };

  return (
    <View style={{ flex: 1 }} {...panHandlers}>
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>אימונים</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Today's stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{workouts.length}</Text>
            <Text style={styles.statLbl}>אימונים</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{totalMinutes}</Text>
            <Text style={styles.statLbl}>דקות</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: '#ef7d6c' }]}>{totalCalories}</Text>
            <Text style={styles.statLbl}>קק"ל נשרפו</Text>
          </View>
        </View>

        {/* Workout list */}
        {workouts.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="barbell-outline" size={48} color="#333" />
            <Text style={styles.emptyText}>לא נרשמו אימונים היום</Text>
            <TouchableOpacity style={styles.addFirstBtn} onPress={() => setShowModal(true)}>
              <Text style={styles.addFirstTxt}>הוסף אימון ראשון</Text>
            </TouchableOpacity>
          </View>
        ) : (
          workouts.map(w => (
            <View key={w.id} style={[styles.workoutCard, { borderLeftColor: w.color }]}>
              <View style={styles.workoutLeft}>
                <TouchableOpacity onPress={() => handleDelete(w.id)}>
                  <Ionicons name="trash-outline" size={18} color={C.placeholder} />
                </TouchableOpacity>
              </View>
              <View style={styles.workoutInfo}>
                <View style={styles.workoutTop}>
                  <Text style={styles.workoutCalories}>{w.calories} קק"ל</Text>
                  <View style={styles.workoutTitleRow}>
                    <Ionicons name={w.icon} size={16} color={w.color} />
                    <Text style={[styles.workoutType, { color: w.color }]}>{w.label}</Text>
                  </View>
                </View>
                <View style={styles.workoutDetails}>
                  <Text style={styles.workoutDetail}>{w.time}</Text>
                  <Text style={styles.workoutDetail}>{w.duration} דק'</Text>
                  <Text style={styles.workoutDetail}>{INTENSITIES.find(i => i.key === w.intensity)?.label}</Text>
                  {w.distance ? <Text style={styles.workoutDetail}>{w.distance} ק"מ</Text> : null}
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add workout modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={C.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>הוסף אימון</Text>
            </View>

            <Text style={styles.fieldLabel}>סוג אימון</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeRow}>
              {WORKOUT_TYPES.map(t => (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.typeBtn, form.type === t.key && { borderColor: t.color, backgroundColor: t.color + '22' }]}
                  onPress={() => setForm(f => ({ ...f, type: t.key }))}
                >
                  <Ionicons name={t.icon} size={20} color={form.type === t.key ? t.color : C.placeholder} />
                  <Text style={[styles.typeTxt, form.type === t.key && { color: t.color }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>משך זמן (דקות)</Text>
            <TextInput
              style={styles.input}
              value={form.duration}
              onChangeText={v => setForm(f => ({ ...f, duration: v }))}
              keyboardType="numeric"
              placeholder="30"
              placeholderTextColor={C.placeholder}
            />

            <Text style={styles.fieldLabel}>עצימות</Text>
            <View style={styles.intensityRow}>
              {INTENSITIES.map(i => (
                <TouchableOpacity
                  key={i.key}
                  style={[styles.intensityBtn, form.intensity === i.key && styles.intensityBtnActive]}
                  onPress={() => setForm(f => ({ ...f, intensity: i.key }))}
                >
                  <Text style={[styles.intensityTxt, form.intensity === i.key && styles.intensityTxtActive]}>{i.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>מרחק (ק"מ, אופציונלי)</Text>
            <TextInput
              style={styles.input}
              value={form.distance}
              onChangeText={v => setForm(f => ({ ...f, distance: v }))}
              keyboardType="decimal-pad"
              placeholder="0.0"
              placeholderTextColor={C.placeholder}
            />

            {form.duration ? (
              <Text style={styles.caloriePreview}>
                קלוריות משוערות: <Text style={{ color: '#ef7d6c', fontWeight: '700' }}>
                  {calcCalories(parseInt(form.duration) || 0, form.intensity, form.type)} קק"ל
                </Text>
              </Text>
            ) : null}

            <TouchableOpacity style={styles.saveBtn} onPress={handleAdd} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveTxt}>שמור אימון</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
    </View>
  );
}

const makeStyles = (C) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 16 },
  title: { color: C.text, fontSize: 22, fontWeight: '800' },
  addBtn: { backgroundColor: '#3a7a4a', borderRadius: 12, padding: 8 },

  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: C.surface, borderRadius: 14, padding: 14, alignItems: 'center' },
  statNum: { color: '#3a7a4a', fontSize: 24, fontWeight: '800' },
  statLbl: { color: C.textMuted, fontSize: 12, marginTop: 4 },

  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { color: C.placeholder, fontSize: 15 },
  addFirstBtn: { backgroundColor: '#3a7a4a', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  addFirstTxt: { color: '#fff', fontWeight: '700' },

  workoutCard: { backgroundColor: C.surface, borderRadius: 14, marginHorizontal: 16, marginBottom: 10, padding: 14, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 3 },
  workoutLeft: { marginRight: 12 },
  workoutInfo: { flex: 1 },
  workoutTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  workoutTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  workoutType: { fontSize: 15, fontWeight: '700' },
  workoutCalories: { color: '#ef7d6c', fontSize: 14, fontWeight: '600' },
  workoutDetails: { flexDirection: 'row', gap: 10 },
  workoutDetail: { color: C.textDim, fontSize: 12 },

  modalOverlay: { flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' },
  modalCard: { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: C.text, fontSize: 18, fontWeight: '700' },
  fieldLabel: { color: C.textMuted, fontSize: 13, marginBottom: 8, textAlign: 'right' },
  typeRow: { marginBottom: 16 },
  typeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.surface3, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, borderWidth: 1, borderColor: C.border },
  typeTxt: { color: C.placeholder, fontSize: 13 },
  input: { backgroundColor: C.surface3, color: C.text, borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 16, textAlign: 'right' },
  intensityRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  intensityBtn: { flex: 1, padding: 10, borderRadius: 10, backgroundColor: C.surface3, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  intensityBtnActive: { backgroundColor: '#1a2a4a', borderColor: '#3a7a4a' },
  intensityTxt: { color: C.placeholder, fontSize: 13 },
  intensityTxtActive: { color: '#3a7a4a', fontWeight: '700' },
  caloriePreview: { color: C.textMuted, fontSize: 14, textAlign: 'center', marginBottom: 16 },
  saveBtn: { backgroundColor: '#3a7a4a', borderRadius: 14, padding: 16, alignItems: 'center' },
  saveTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
