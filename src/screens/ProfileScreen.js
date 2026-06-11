import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchProfile, saveProfile, fetchProfileTargets } from '../api/client';

const ACTIVITY_LEVELS = [
  { key: 'sedentary',       label: 'יושבני (ללא פעילות)' },
  { key: 'lightly_active',  label: 'פעילות קלה (1-2 ימים/שבוע)' },
  { key: 'moderately_active', label: 'פעילות בינונית (3-5 ימים/שבוע)' },
  { key: 'very_active',     label: 'פעילות גבוהה (6-7 ימים/שבוע)' },
  { key: 'extremely_active',label: 'פעילות קיצונית (פעמיים ביום)' },
];

const GOALS = [
  { key: 'lose',     label: 'ירידה במשקל',  color: '#ff6b6b' },
  { key: 'maintain', label: 'שמירה על משקל', color: '#4F8EF7' },
  { key: 'gain',     label: 'עלייה במשקל',  color: '#4CAF50' },
];

const KASHRUT = ['ללא הגבלה', 'פרווה', 'חלבי בלבד', 'בשרי בלבד', 'כשרות מהודרת'];

const ALLERGIES_COMMON = ['לקטוז', 'גלוטן', 'אגוזים', 'ביצים', 'דגים', 'שומשום', 'סויה'];

const SPORT_TYPES = ['לא מגדיר', 'כוח', 'סיבולת', 'יוגה/פילאטיס', 'ספורט קבוצתי', 'שחייה', 'אחר'];

const DIET_TYPES = ['ללא הגבלה', 'צמחוני', 'טבעוני', 'קטוגני', 'ים תיכוני', 'אחר'];

function SelectOption({ options, value, onChange, labelKey = 'label', valueKey = 'key' }) {
  return (
    <View style={styles.optionsWrap}>
      {options.map(opt => {
        const v = typeof opt === 'string' ? opt : opt[valueKey];
        const l = typeof opt === 'string' ? opt : opt[labelKey];
        const active = value === v;
        return (
          <TouchableOpacity key={v} style={[styles.optBtn, active && styles.optBtnActive]} onPress={() => onChange(v)}>
            <Text style={[styles.optTxt, active && styles.optTxtActive]}>{l}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function NumberInput({ value, onChange, min = 0, max = 999, step = 1, unit }) {
  return (
    <View style={styles.numInput}>
      <TouchableOpacity style={styles.numBtn} onPress={() => onChange(Math.max(min, (parseFloat(value) || 0) - step))}>
        <Text style={styles.numBtnTxt}>−</Text>
      </TouchableOpacity>
      <TextInput
        style={styles.numValue}
        value={String(value ?? '')}
        onChangeText={v => onChange(parseFloat(v) || 0)}
        keyboardType="decimal-pad"
      />
      {unit && <Text style={styles.numUnit}>{unit}</Text>}
      <TouchableOpacity style={styles.numBtn} onPress={() => onChange(Math.min(max, (parseFloat(value) || 0) + step))}>
        <Text style={styles.numBtnTxt}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ProfileScreen() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [targets, setTargets] = useState(null);

  // Personal details
  const [name, setName] = useState('');
  const [gender, setGender] = useState('male');
  const [dob, setDob] = useState('');
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(70);
  const [activity, setActivity] = useState('moderately_active');
  const [goal, setGoal] = useState('maintain');
  const [targetWeight, setTargetWeight] = useState(70);
  const [weeksToGoal, setWeeksToGoal] = useState(12);

  // Preferences
  const [kashrut, setKashrut] = useState('ללא הגבלה');
  const [mealsPerDay, setMealsPerDay] = useState(5);
  const [allergies, setAllergies] = useState([]);
  const [customAllergy, setCustomAllergy] = useState('');
  const [preferredFoods, setPreferredFoods] = useState([]);
  const [dislikedFoods, setDislikedFoods] = useState([]);
  const [customPref, setCustomPref] = useState('');
  const [customDislike, setCustomDislike] = useState('');
  const [sportType, setSportType] = useState('לא מגדיר');
  const [dietType, setDietType] = useState('ללא הגבלה');

  useEffect(() => {
    Promise.all([
      fetchProfile().catch(() => null),
      fetchProfileTargets().catch(() => null),
    ]).then(([p, t]) => {
      if (p) {
        setName(p.name ?? '');
        setGender(p.gender ?? 'male');
        setDob(p.date_of_birth ?? '');
        setHeight(p.height_cm ?? 170);
        setWeight(p.weight_kg ?? 70);
        setActivity(p.activity_level ?? 'moderately_active');
        setGoal(p.goal ?? 'maintain');
        setTargetWeight(p.target_weight ?? p.weight_kg ?? 70);
        const prefs = p.meal_preferences ?? {};
        setKashrut(prefs.kashrut ?? 'ללא הגבלה');
        setMealsPerDay(prefs.meals_per_day ?? 5);
        setAllergies(prefs.allergies ?? []);
        setPreferredFoods(prefs.preferred_foods ?? []);
        setDislikedFoods(prefs.disliked_foods ?? []);
        setSportType(prefs.sport_type ?? 'לא מגדיר');
        setDietType(prefs.diet_type ?? 'ללא הגבלה');
      }
      if (t) setTargets(t);
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveProfile({
        name, gender, date_of_birth: dob,
        height_cm: height, weight_kg: weight,
        activity_level: activity, goal,
        meal_preferences: {
          kashrut, meals_per_day: mealsPerDay,
          allergies, preferred_foods: preferredFoods,
          disliked_foods: dislikedFoods,
          sport_type: sportType, diet_type: dietType,
        }
      });
      Alert.alert('נשמר', 'הפרופיל עודכן בהצלחה');
    } catch {
      Alert.alert('שגיאה', 'לא הצלחתי לשמור');
    } finally { setSaving(false); }
  };

  const toggleAllergy = (a) => setAllergies(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  const addChip = (list, setList, val, setVal) => {
    const t = val.trim();
    if (t && !list.includes(t)) { setList([...list, t]); setVal(''); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#4F8EF7" /></View>;

  const tabs = ['פרטים אישיים', 'העדפות תזונה', 'יעדים'];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarCard}>
          <View style={styles.avatarCircle}><Ionicons name="person" size={40} color="#4F8EF7" /></View>
          <Text style={styles.headerTitle}>פרופיל משתמש</Text>
          <Text style={styles.headerSub}>נתונים ביומטריים, העדפות ויעדים — של המשתמש המחובר</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {tabs.map((t, i) => (
          <TouchableOpacity key={i} style={[styles.tabBtn, tab === i && styles.tabBtnActive]} onPress={() => setTab(i)}>
            <Text style={[styles.tabTxt, tab === i && styles.tabTxtActive]}>{t}</Text>
            {tab === i && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* TAB 0: Personal */}
        {tab === 0 && (
          <View style={styles.section}>
            <Text style={styles.fieldLabel}>שם מלא</Text>
            <TextInput style={styles.textInput} value={name} onChangeText={setName} placeholder="שם מלא" placeholderTextColor="#444" />

            <View style={styles.row3}>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>משקל נוכחי (ק"ג)</Text>
                <NumberInput value={weight} onChange={setWeight} min={30} max={300} step={0.1} />
              </View>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>גובה (ס"מ)</Text>
                <NumberInput value={height} onChange={setHeight} min={100} max={250} step={0.5} />
              </View>
            </View>

            <Text style={styles.fieldLabel}>מגדר</Text>
            <SelectOption options={[{key:'male',label:'זכר'},{key:'female',label:'נקבה'}]} value={gender} onChange={setGender} />

            <Text style={styles.fieldLabel}>רמת פעילות</Text>
            <SelectOption options={ACTIVITY_LEVELS} value={activity} onChange={setActivity} />

            <Text style={styles.fieldLabel}>מטרה</Text>
            <View style={styles.optionsWrap}>
              {GOALS.map(g => (
                <TouchableOpacity key={g.key} style={[styles.optBtn, goal === g.key && { borderColor: g.color, backgroundColor: g.color + '22' }]} onPress={() => setGoal(g.key)}>
                  <Text style={[styles.optTxt, goal === g.key && { color: g.color }]}>{g.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>תאריך לידה</Text>
            <TextInput style={styles.textInput} value={dob} onChangeText={setDob} placeholder="YYYY-MM-DD" placeholderTextColor="#444" />

            <View style={styles.row3}>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>משקל יעד (ק"ג)</Text>
                <NumberInput value={targetWeight} onChange={setTargetWeight} min={30} max={300} step={0.1} />
              </View>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>כמה שבועות עד היעד?</Text>
                <NumberInput value={weeksToGoal} onChange={setWeeksToGoal} min={3} max={52} step={1} unit="שב'" />
              </View>
            </View>

            {weeksToGoal > 0 && (
              <Text style={styles.paceText}>
                קצב: {Math.abs((targetWeight - weight) / weeksToGoal).toFixed(2)} ק"ג/שבוע · עודף: {Math.round(((targetWeight - weight) / weeksToGoal) * 1000)} קק"ל/יום
              </Text>
            )}
          </View>
        )}

        {/* TAB 1: Preferences */}
        {tab === 1 && (
          <View style={styles.section}>
            <Text style={styles.fieldLabel}>כשרות</Text>
            <SelectOption options={KASHRUT} value={kashrut} onChange={setKashrut} />

            <Text style={styles.fieldLabel}>ארוחות ביום</Text>
            <NumberInput value={mealsPerDay} onChange={setMealsPerDay} min={3} max={6} step={1} />

            <Text style={styles.fieldLabel}>אלרגיות / רגישויות מזון:</Text>
            <View style={styles.chipsWrap}>
              {ALLERGIES_COMMON.map(a => (
                <TouchableOpacity key={a} style={[styles.chip, allergies.includes(a) && styles.chipActive]} onPress={() => toggleAllergy(a)}>
                  <Text style={[styles.chipTxt, allergies.includes(a) && styles.chipTxtActive]}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.addRow}>
              <TouchableOpacity style={styles.addBtn} onPress={() => addChip(allergies, setAllergies, customAllergy, setCustomAllergy)}>
                <Text style={styles.addBtnTxt}>הוסף</Text>
              </TouchableOpacity>
              <TextInput style={styles.addInput} value={customAllergy} onChangeText={setCustomAllergy} placeholder="הוסף אלרגיה מותאמת" placeholderTextColor="#444" />
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>** מזונות מועדפים:</Text>
            <View style={styles.chipsWrap}>
              {preferredFoods.map(f => (
                <TouchableOpacity key={f} style={styles.chipGreen} onPress={() => setPreferredFoods(p => p.filter(x => x !== f))}>
                  <Text style={styles.chipGreenTxt}>{f} ×</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.addRow}>
              <TouchableOpacity style={styles.addBtn} onPress={() => addChip(preferredFoods, setPreferredFoods, customPref, setCustomPref)}>
                <Text style={styles.addBtnTxt}>הוסף</Text>
              </TouchableOpacity>
              <TextInput style={styles.addInput} value={customPref} onChangeText={setCustomPref} placeholder="לדוגמה: אבוקדו" placeholderTextColor="#444" />
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>** מזונות להימנע:</Text>
            <View style={styles.chipsWrap}>
              {dislikedFoods.map(f => (
                <TouchableOpacity key={f} style={styles.chipRed} onPress={() => setDislikedFoods(p => p.filter(x => x !== f))}>
                  <Text style={styles.chipRedTxt}>{f} ×</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.addRow}>
              <TouchableOpacity style={styles.addBtn} onPress={() => addChip(dislikedFoods, setDislikedFoods, customDislike, setCustomDislike)}>
                <Text style={styles.addBtnTxt}>הוסף</Text>
              </TouchableOpacity>
              <TextInput style={styles.addInput} value={customDislike} onChangeText={setCustomDislike} placeholder="לדוגמה: אורז" placeholderTextColor="#444" />
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>** סוג ספורט / פעילות:</Text>
            <SelectOption options={SPORT_TYPES} value={sportType} onChange={setSportType} />

            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>** סוג תזונה:</Text>
            <SelectOption options={DIET_TYPES} value={dietType} onChange={setDietType} />
          </View>
        )}

        {/* TAB 2: Targets */}
        {tab === 2 && (
          <View style={styles.section}>
            {targets ? (
              <>
                <View style={styles.targetsCard}>
                  <Text style={styles.targetsTitle}>יעד קלורי יומי</Text>
                  <Text style={styles.targetsCalories}>{targets.calories?.toLocaleString()}</Text>
                  <Text style={styles.targetsKcal}>קק"ל</Text>
                </View>
                <View style={styles.bmrRow}>
                  {[
                    { label: 'BMR', value: Math.round(targets.calories / 1.55) },
                    { label: 'TDEE', value: targets.calories },
                  ].map(item => (
                    <View key={item.label} style={styles.bmrCard}>
                      <Text style={styles.bmrLabel}>{item.label}</Text>
                      <Text style={styles.bmrVal}>{item.value}</Text>
                    </View>
                  ))}
                </View>
                {[
                  { label: 'חלבון', val: targets.protein, total: targets.calories, color: '#4F8EF7', cal: 4 },
                  { label: 'פחמימות', val: targets.carbs, total: targets.calories, color: '#ffd700', cal: 4 },
                  { label: 'שומן', val: targets.fat, total: targets.calories, color: '#ff6b6b', cal: 9 },
                ].map(m => {
                  const pct = Math.round((m.val * m.cal / m.total) * 100);
                  return (
                    <View key={m.label} style={styles.macroRow}>
                      <View style={styles.macroBarWrap}>
                        <View style={[styles.macroBar, { width: `${pct}%`, backgroundColor: m.color }]} />
                      </View>
                      <View style={styles.macroInfo}>
                        <Text style={[styles.macroName, { color: m.color }]}>{m.label}</Text>
                        <Text style={styles.macroDetail}>{m.val}g · {pct}%</Text>
                      </View>
                    </View>
                  );
                })}
              </>
            ) : (
              <Text style={styles.noTargets}>שמור פרופיל כדי לחשב יעדים</Text>
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Save button */}
      {tab < 2 && (
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveTxt}>שמור {tab === 0 ? 'פרטים אישיים' : 'העדפות תזונה'}</Text>}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  header: { paddingTop: 52, paddingHorizontal: 16, paddingBottom: 8 },
  avatarCard: { backgroundColor: '#141414', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#1a2a4a', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '800', textAlign: 'right', flex: 1 },
  headerSub: { color: '#666', fontSize: 12, textAlign: 'right', flex: 1 },
  tabBar: { flexDirection: 'row', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabBtnActive: {},
  tabTxt: { color: '#555', fontSize: 13 },
  tabTxtActive: { color: '#4F8EF7', fontWeight: '700' },
  tabUnderline: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: '#4F8EF7' },
  scroll: { flex: 1 },
  section: { padding: 16 },
  fieldLabel: { color: '#aaa', fontSize: 13, textAlign: 'right', marginBottom: 8, marginTop: 16 },
  textInput: { backgroundColor: '#141414', color: '#fff', borderRadius: 10, padding: 12, fontSize: 15, textAlign: 'right', borderWidth: 1, borderColor: '#2a2a2a' },
  row3: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
  numInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#141414', borderRadius: 10, borderWidth: 1, borderColor: '#2a2a2a', overflow: 'hidden' },
  numBtn: { width: 40, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e1e1e' },
  numBtnTxt: { color: '#4F8EF7', fontSize: 20, fontWeight: '700' },
  numValue: { flex: 1, color: '#fff', fontSize: 15, textAlign: 'center', height: 44 },
  numUnit: { color: '#888', fontSize: 12, paddingRight: 8 },
  optionsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: '#141414', borderWidth: 1, borderColor: '#2a2a2a' },
  optBtnActive: { backgroundColor: '#1a2a4a', borderColor: '#4F8EF7' },
  optTxt: { color: '#666', fontSize: 13 },
  optTxtActive: { color: '#4F8EF7', fontWeight: '700' },
  paceText: { color: '#888', fontSize: 12, textAlign: 'right', marginTop: 8 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, backgroundColor: '#141414', borderWidth: 1, borderColor: '#2a2a2a' },
  chipActive: { backgroundColor: '#2a1a4a', borderColor: '#8a6aff' },
  chipTxt: { color: '#666', fontSize: 13 },
  chipTxtActive: { color: '#8a6aff', fontWeight: '700' },
  chipGreen: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, backgroundColor: '#0a2a1a', borderWidth: 1, borderColor: '#4CAF50' },
  chipGreenTxt: { color: '#4CAF50', fontSize: 13 },
  chipRed: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, backgroundColor: '#2a1a1a', borderWidth: 1, borderColor: '#ff6b6b' },
  chipRedTxt: { color: '#ff6b6b', fontSize: 13 },
  addRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  addInput: { flex: 1, backgroundColor: '#141414', color: '#fff', borderRadius: 10, padding: 10, fontSize: 14, textAlign: 'right', borderWidth: 1, borderColor: '#2a2a2a' },
  addBtn: { backgroundColor: '#4F8EF7', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  addBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
  targetsCard: { backgroundColor: '#141414', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16 },
  targetsTitle: { color: '#888', fontSize: 14, marginBottom: 8 },
  targetsCalories: { color: '#fff', fontSize: 52, fontWeight: '800' },
  targetsKcal: { color: '#888', fontSize: 14 },
  bmrRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  bmrCard: { flex: 1, backgroundColor: '#141414', borderRadius: 12, padding: 14, alignItems: 'center' },
  bmrLabel: { color: '#4F8EF7', fontSize: 12, fontWeight: '700', marginBottom: 4 },
  bmrVal: { color: '#fff', fontSize: 20, fontWeight: '700' },
  macroRow: { backgroundColor: '#141414', borderRadius: 12, padding: 12, marginBottom: 8 },
  macroBarWrap: { height: 8, backgroundColor: '#1e1e1e', borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  macroBar: { height: '100%', borderRadius: 4 },
  macroInfo: { flexDirection: 'row', justifyContent: 'space-between' },
  macroName: { fontSize: 14, fontWeight: '700' },
  macroDetail: { color: '#888', fontSize: 13 },
  noTargets: { color: '#666', fontSize: 14, textAlign: 'center', paddingVertical: 32 },
  saveBtn: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#4F8EF7', padding: 16, alignItems: 'center' },
  saveTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
