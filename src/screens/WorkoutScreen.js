import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Modal, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const WORKOUT_TYPES = [
  { key: 'strength', label: 'כוח', icon: 'barbell-outline', color: '#4F8EF7' },
  { key: 'running',  label: 'ריצה', icon: 'walk-outline', color: '#4CAF50' },
  { key: 'cycling',  label: 'אופניים', icon: 'bicycle-outline', color: '#ffd700' },
  { key: 'swimming', label: 'שחייה', icon: 'water-outline', color: '#00bcd4' },
  { key: 'yoga',     label: 'יוגה', icon: 'body-outline', color: '#e91e63' },
  { key: 'hiit',     label: 'HIIT', icon: 'flame-outline', color: '#ff6b6b' },
];

const INTENSITIES = [
  { key: 'low',      label: 'נמוכה',  mult: 4 },
  { key: 'moderate', label: 'בינונית', mult: 6 },
  { key: 'high',     label: 'גבוהה',  mult: 8 },
  { key: 'extreme',  label: 'קיצונית', mult: 10 },
];

function calcCalories(durationMin, intensity) {
  const mult = INTENSITIES.find(i => i.key === intensity)?.mult ?? 6;
  return Math.round((durationMin / 60) * mult * 75);
}

export default function WorkoutScreen() {
  const [workouts, setWorkouts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    type: 'running', duration: '30', intensity: 'moderate', distance: '',
  });

  const totalCalories = workouts.reduce((s, w) => s + w.calories, 0);
  const totalMinutes = workouts.reduce((s, w) => s + parseInt(w.duration), 0);

  const handleAdd = () => {
    if (!form.duration) { Alert.alert('שגיאה', 'הכנס משך זמן'); return; }
    const calories = calcCalories(parseInt(form.duration), form.intensity);
    const typeInfo = WORKOUT_TYPES.find(t => t.key === form.type);
    setWorkouts(prev => [{
      id: Date.now().toString(),
      ...form,
      calories,
      label: typeInfo?.label ?? form.type,
      icon: typeInfo?.icon ?? 'fitness-outline',
      color: typeInfo?.color ?? '#4F8EF7',
      time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
    }, ...prev]);
    setShowModal(false);
    setForm({ type: 'running', duration: '30', intensity: 'moderate', distance: '' });
  };

  return (
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
            <Text style={[styles.statNum, { color: '#ff6b6b' }]}>{totalCalories}</Text>
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
                <TouchableOpacity onPress={() => setWorkouts(prev => prev.filter(x => x.id !== w.id))}>
                  <Ionicons name="trash-outline" size={18} color="#555" />
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
                <Ionicons name="close" size={24} color="#fff" />
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
                  <Ionicons name={t.icon} size={20} color={form.type === t.key ? t.color : '#555'} />
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
              placeholderTextColor="#555"
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
              placeholderTextColor="#555"
            />

            {form.duration ? (
              <Text style={styles.caloriePreview}>
                קלוריות משוערות: <Text style={{ color: '#ff6b6b', fontWeight: '700' }}>
                  {calcCalories(parseInt(form.duration) || 0, form.intensity)} קק"ל
                </Text>
              </Text>
            ) : null}

            <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
              <Text style={styles.saveTxt}>שמור אימון</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 16 },
  title: { color: '#fff', fontSize: 22, fontWeight: '800' },
  addBtn: { backgroundColor: '#4F8EF7', borderRadius: 12, padding: 8 },

  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#141414', borderRadius: 14, padding: 14, alignItems: 'center' },
  statNum: { color: '#4F8EF7', fontSize: 24, fontWeight: '800' },
  statLbl: { color: '#888', fontSize: 12, marginTop: 4 },

  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { color: '#555', fontSize: 15 },
  addFirstBtn: { backgroundColor: '#4F8EF7', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  addFirstTxt: { color: '#fff', fontWeight: '700' },

  workoutCard: { backgroundColor: '#141414', borderRadius: 14, marginHorizontal: 16, marginBottom: 10, padding: 14, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 3 },
  workoutLeft: { marginRight: 12 },
  workoutInfo: { flex: 1 },
  workoutTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  workoutTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  workoutType: { fontSize: 15, fontWeight: '700' },
  workoutCalories: { color: '#ff6b6b', fontSize: 14, fontWeight: '600' },
  workoutDetails: { flexDirection: 'row', gap: 10 },
  workoutDetail: { color: '#666', fontSize: 12 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#141414', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  fieldLabel: { color: '#888', fontSize: 13, marginBottom: 8, textAlign: 'right' },
  typeRow: { marginBottom: 16 },
  typeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1e1e1e', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, borderWidth: 1, borderColor: '#2a2a2a' },
  typeTxt: { color: '#555', fontSize: 13 },
  input: { backgroundColor: '#1e1e1e', color: '#fff', borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 16, textAlign: 'right' },
  intensityRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  intensityBtn: { flex: 1, padding: 10, borderRadius: 10, backgroundColor: '#1e1e1e', alignItems: 'center', borderWidth: 1, borderColor: '#2a2a2a' },
  intensityBtnActive: { backgroundColor: '#1a2a4a', borderColor: '#4F8EF7' },
  intensityTxt: { color: '#555', fontSize: 13 },
  intensityTxtActive: { color: '#4F8EF7', fontWeight: '700' },
  caloriePreview: { color: '#888', fontSize: 14, textAlign: 'center', marginBottom: 16 },
  saveBtn: { backgroundColor: '#4F8EF7', borderRadius: 14, padding: 16, alignItems: 'center' },
  saveTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
