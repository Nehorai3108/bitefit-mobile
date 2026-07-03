import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useSwipeNav } from '../hooks/useSwipeNav';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Modal, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addWorkout, fetchWorkouts, deleteWorkout } from '../api/client';
import { useTheme } from '../context/ThemeContext';
import { generatePlan } from '../utils/workoutPlanner';
import WorkoutDayScreen from './WorkoutDayScreen';

const PLAN_KEY = '@bitefit_workout_plan';

const WORKOUT_TYPES = [
  { key: 'strength', label: 'כוח', icon: 'barbell-outline', color: '#3a7a4a' },
  { key: 'running',  label: 'ריצה', icon: 'walk-outline', color: '#3a7a4a' },
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
    dateKey: row.timestamp ? new Date(row.timestamp).toISOString().slice(0, 10) : '',
  };
}

const HE_DAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

const PLAN_TYPES = [
  { key: 'strength', label: 'כוח', icon: 'barbell-outline' },
  { key: 'running',  label: 'ריצה', icon: 'walk-outline' },
  { key: 'hiit',     label: 'HIIT', icon: 'flame-outline' },
  { key: 'mixed',    label: 'מעורב', icon: 'shuffle-outline' },
];

const TYPE_ICON = { strength: 'barbell-outline', running: 'walk-outline', hiit: 'flame-outline', mixed: 'shuffle-outline' };

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

  // תוכנית שבועית
  const [plan, setPlan]               = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showPlanView, setShowPlanView]   = useState(false);
  const [selectedDay, setSelectedDay]     = useState(null);
  const [planForm, setPlanForm] = useState({ days: 3, type: 'strength' });

  const load = useCallback(async () => {
    try {
      const r = await fetchWorkouts();
      setWorkouts((r.workouts ?? []).map(decorate).reverse());
    } catch { /* keep current */ }
    finally { setLoading(false); }
    // טען תוכנית שמורה
    try {
      const saved = await AsyncStorage.getItem(PLAN_KEY);
      if (saved) setPlan(JSON.parse(saved));
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleCreatePlan = async () => {
    const newPlan = generatePlan(planForm.days, planForm.type);
    setPlan(newPlan);
    await AsyncStorage.setItem(PLAN_KEY, JSON.stringify(newPlan));
    setShowPlanModal(false);
    setShowPlanView(true);
  };

  const totalCalories = workouts.reduce((s, w) => s + (w.calories || 0), 0);
  const totalMinutes = workouts.reduce((s, w) => s + (parseInt(w.duration) || 0), 0);

  // last-7-days activity (calories burned per day) for the progress chart
  const byDay = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const cal = workouts.filter(w => w.dateKey === key).reduce((sum, w) => sum + (w.calories || 0), 0);
    return { label: HE_DAYS[d.getDay()], cal, today: i === 6 };
  });
  const maxCal = Math.max(1, ...byDay.map(d => d.cal));

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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* כרטיס פעילות שבועית */}
        <View style={styles.weekCard}>
          <Text style={styles.weekTitle}>הפעילות השבוע</Text>
          <View style={styles.barsRow}>
            {byDay.map((d, i) => (
              <View key={i} style={styles.barCol}>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { height: `${Math.round((d.cal / maxCal) * 100)}%` },
                    d.cal === 0 && styles.barEmpty, d.today && styles.barToday]} />
                </View>
                <Text style={[styles.barDay, d.today && styles.barDayToday]}>{d.label}</Text>
              </View>
            ))}
          </View>
          <View style={styles.weekStats}>
            <WStat styles={styles} num={totalCalories} lbl='קק"ל השבוע' accent />
            <WStat styles={styles} num={totalMinutes} lbl="דקות" />
            <WStat styles={styles} num={workouts.length} lbl="אימונים" />
          </View>
        </View>

        {/* כפתור תוכנית שבועית */}
        <TouchableOpacity style={styles.planBtn} onPress={() => plan ? setShowPlanView(true) : setShowPlanModal(true)} activeOpacity={0.85}>
          <Ionicons name="calendar-outline" size={18} color="#fff" />
          <Text style={styles.planBtnTxt}>{plan ? 'צפה בתוכנית השבועית' : 'צור תוכנית אימון'}</Text>
        </TouchableOpacity>

        {/* רשימת אימונים */}
        <Text style={styles.sectionTitle}>האימונים שלי</Text>
        {workouts.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="barbell-outline" size={44} color={C.textFaint} />
            <Text style={styles.emptyText}>עוד לא נרשמו אימונים</Text>
            <TouchableOpacity style={styles.addFirstBtn} onPress={() => setShowModal(true)} activeOpacity={0.85}>
              <Text style={styles.addFirstTxt}>הוסף אימון ראשון</Text>
            </TouchableOpacity>
          </View>
        ) : (
          workouts.map(w => (
            <View key={w.id} style={styles.workoutCard}>
              <View style={[styles.wIcon, { backgroundColor: w.color + '1a' }]}>
                <Ionicons name={w.icon} size={22} color={w.color} />
              </View>
              <View style={styles.workoutInfo}>
                <Text style={styles.workoutType}>{w.label}</Text>
                <Text style={styles.workoutDetail}>
                  {w.duration} דק' · {INTENSITIES.find(i => i.key === w.intensity)?.label}
                  {w.distance ? ` · ${w.distance} ק"מ` : ''}{w.time ? ` · ${w.time}` : ''}
                </Text>
              </View>
              <View style={styles.wRight}>
                <Text style={styles.workoutCalories}>{w.calories}</Text>
                <Text style={styles.workoutCalUnit}>קק"ל</Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(w.id)} style={styles.wTrash}>
                <Ionicons name="trash-outline" size={17} color={C.textFaint} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* מודאל יצירת תוכנית */}
      <Modal visible={showPlanModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowPlanModal(false)}>
                <Ionicons name="close" size={24} color={C.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>צור תוכנית אימון</Text>
            </View>

            <Text style={styles.fieldLabel}>כמה ימים בשבוע?</Text>
            <View style={styles.daysRow}>
              {[2,3,4,5,6].map(d => (
                <TouchableOpacity
                  key={d}
                  style={[styles.dayBtn, planForm.days === d && styles.dayBtnActive]}
                  onPress={() => setPlanForm(f => ({ ...f, days: d }))}
                >
                  <Text style={[styles.dayBtnTxt, planForm.days === d && styles.dayBtnTxtActive]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>סוג אימון</Text>
            <View style={styles.planTypeGrid}>
              {PLAN_TYPES.map(t => (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.planTypeBtn, planForm.type === t.key && styles.planTypeBtnActive]}
                  onPress={() => setPlanForm(f => ({ ...f, type: t.key }))}
                >
                  <Ionicons name={t.icon} size={22} color={planForm.type === t.key ? '#fff' : C.textMuted} />
                  <Text style={[styles.planTypeTxt, planForm.type === t.key && { color: '#fff' }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleCreatePlan}>
              <Text style={styles.saveTxt}>צור תוכנית</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* מודאל תצוגת תוכנית שבועית */}
      <Modal visible={showPlanView} animationType="slide">
        <View style={{ flex: 1, backgroundColor: C.bg }}>
          {selectedDay ? (
            // מסך פירוט אימון — בתוך אותו מודאל
            <WorkoutDayScreen day={selectedDay} onClose={() => { setSelectedDay(null); load(); }} />
          ) : (
            <>
              <View style={styles.planViewHeader}>
                <TouchableOpacity onPress={() => setShowPlanView(false)}>
                  <Ionicons name="arrow-back" size={24} color={C.text} />
                </TouchableOpacity>
                <Text style={styles.planViewTitle}>תוכנית שבועית</Text>
                <TouchableOpacity onPress={() => { setShowPlanView(false); setShowPlanModal(true); }}>
                  <Ionicons name="refresh-outline" size={22} color="#3a7a4a" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                {(plan ?? []).map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.planDayCard, item.isRest && styles.planDayRest]}
                    onPress={() => !item.isRest && setSelectedDay(item)}
                  >
                    <View style={styles.planDayLeft}>
                      <Text style={styles.planDayName}>{item.day}</Text>
                      {!item.isRest && <Text style={styles.planDayDuration}>{item.duration} דק'</Text>}
                    </View>
                    {item.isRest ? (
                      <Text style={styles.planRestTxt}>מנוחה</Text>
                    ) : (
                      <View style={styles.planDayRight}>
                        <Ionicons name={TYPE_ICON[item.type] ?? 'barbell-outline'} size={18} color="#3a7a4a" />
                        <Text style={styles.planDayWorkoutName}>{item.name}</Text>
                        <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
                <View style={{ height: 40 }} />
              </ScrollView>
            </>
          )}
        </View>
      </Modal>

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

function WStat({ styles, num, lbl, accent }) {
  return (
    <View style={styles.wStat}>
      <Text style={[styles.wStatNum, accent && styles.wStatAccent]}>{num}</Text>
      <Text style={styles.wStatLbl}>{lbl}</Text>
    </View>
  );
}

const makeStyles = (C) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12 },
  title: { color: C.text, fontSize: 24, fontWeight: '800', textAlign: 'right' },
  addBtn: { backgroundColor: '#3a7a4a', borderRadius: 20, width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },

  weekCard: { backgroundColor: C.surface, borderRadius: 20, borderWidth: 1, borderColor: C.border, marginHorizontal: 16, marginBottom: 14, padding: 16 },
  weekTitle: { color: C.text, fontSize: 15, fontWeight: '800', textAlign: 'right', marginBottom: 14 },
  barsRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-end', height: 90 },
  barCol: { flex: 1, alignItems: 'center', gap: 6 },
  barTrack: { width: 12, height: 70, backgroundColor: C.surface3, borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', backgroundColor: '#3a7a4a', borderRadius: 6, minHeight: 3 },
  barEmpty: { backgroundColor: 'transparent' },
  barToday: { backgroundColor: '#3a7a4a' },
  barDay: { fontSize: 11, color: C.textDim, fontWeight: '600' },
  barDayToday: { color: '#3a7a4a', fontWeight: '800' },
  weekStats: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: 16, borderTopWidth: 1, borderTopColor: C.border2, paddingTop: 14 },
  wStat: { flex: 1, alignItems: 'center' },
  wStatNum: { color: C.text, fontSize: 20, fontWeight: '800' },
  wStatAccent: { color: '#ef7d6c' },
  wStatLbl: { color: C.textDim, fontSize: 12, marginTop: 2 },

  sectionTitle: { color: C.text, fontSize: 16, fontWeight: '800', textAlign: 'right', marginHorizontal: 16, marginTop: 4, marginBottom: 10 },

  empty: { alignItems: 'center', paddingTop: 40, gap: 12 },
  emptyText: { color: C.textMuted, fontSize: 15 },
  addFirstBtn: { backgroundColor: '#3a7a4a', borderRadius: 14, paddingHorizontal: 22, paddingVertical: 12 },
  addFirstTxt: { color: '#fff', fontWeight: '700' },

  workoutCard: { backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, marginHorizontal: 16, marginBottom: 10, padding: 14, flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  wIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  workoutInfo: { flex: 1 },
  workoutType: { fontSize: 16, fontWeight: '700', color: C.text, textAlign: 'right' },
  workoutDetail: { color: C.textDim, fontSize: 12, textAlign: 'right', marginTop: 3 },
  wRight: { alignItems: 'center' },
  workoutCalories: { color: '#ef7d6c', fontSize: 17, fontWeight: '800' },
  workoutCalUnit: { color: C.textDim, fontSize: 10 },
  wTrash: { padding: 4 },

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

  // כפתור תוכנית
  planBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#3a7a4a', borderRadius: 14, marginHorizontal: 16, marginBottom: 16, padding: 14, justifyContent: 'center' },
  planBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // מודאל יצירת תוכנית
  daysRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  dayBtn: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: C.surface3, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  dayBtnActive: { backgroundColor: '#3a7a4a', borderColor: '#3a7a4a' },
  dayBtnTxt: { color: C.textMuted, fontSize: 16, fontWeight: '700' },
  dayBtnTxtActive: { color: '#fff' },
  planTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  planTypeBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '47%', padding: 14, borderRadius: 14, backgroundColor: C.surface3, borderWidth: 1, borderColor: C.border },
  planTypeBtnActive: { backgroundColor: '#3a7a4a', borderColor: '#3a7a4a' },
  planTypeTxt: { color: C.textMuted, fontSize: 14, fontWeight: '600' },

  // תצוגת תוכנית
  planViewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 16 },
  planViewTitle: { color: C.text, fontSize: 20, fontWeight: '800' },
  planDayCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.surface, marginHorizontal: 16, marginBottom: 10, borderRadius: 14, padding: 16 },
  planDayRest: { opacity: 0.5 },
  planDayLeft: { gap: 2 },
  planDayName: { color: C.text, fontSize: 15, fontWeight: '700' },
  planDayDuration: { color: C.textMuted, fontSize: 12 },
  planDayRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planDayWorkoutName: { color: '#3a7a4a', fontSize: 14, fontWeight: '600' },
  planRestTxt: { color: C.textMuted, fontSize: 14 },

  // פירוט אימון
  planDayMeta: { color: C.textMuted, fontSize: 13, textAlign: 'right', marginBottom: 8 },
  planNote: { color: '#3a7a4a', fontSize: 13, backgroundColor: '#3a7a4a18', borderRadius: 8, padding: 10, marginBottom: 12, textAlign: 'right' },
  exRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border2 },
  exNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#3a7a4a22', alignItems: 'center', justifyContent: 'center' },
  exNumTxt: { color: '#3a7a4a', fontSize: 13, fontWeight: '700' },
  exInfo: { flex: 1 },
  exName: { color: C.text, fontSize: 15, fontWeight: '600', textAlign: 'right' },
  exDetail: { color: C.textMuted, fontSize: 13, textAlign: 'right' },
  exNote: { color: C.textDim, fontSize: 12, textAlign: 'right', marginTop: 2 },
});
