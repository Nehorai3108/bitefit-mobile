import React, { useState, useEffect, useMemo } from 'react';
import { useSwipeNav } from '../hooks/useSwipeNav';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  TouchableOpacity, TextInput, Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { fetchProfile, saveProfile, fetchProfileTargets } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const ACTIVITY_LEVELS = [
  { key: 'sedentary',       label: 'יושבני (ללא פעילות)' },
  { key: 'lightly_active',  label: 'פעילות קלה (1-2 ימים/שבוע)' },
  { key: 'moderately_active', label: 'פעילות בינונית (3-5 ימים/שבוע)' },
  { key: 'very_active',     label: 'פעילות גבוהה (6-7 ימים/שבוע)' },
  { key: 'extra_active',    label: 'פעילות קיצונית (פעמיים ביום)' },
];

const GOALS = [
  { key: 'lose_weight', label: 'ירידה במשקל',  color: '#ef7d6c' },
  { key: 'maintain',    label: 'שמירה על משקל', color: '#3a7a4a' },
  { key: 'gain_weight', label: 'עלייה במשקל',  color: '#56bd6b' },
];

const KASHRUT = ['ללא הגבלה', 'פרווה', 'חלבי בלבד', 'בשרי בלבד', 'כשרות מהודרת'];

const ALLERGIES_COMMON = ['לקטוז', 'גלוטן', 'אגוזים', 'ביצים', 'דגים', 'שומשום', 'סויה'];

const SPORT_TYPES = ['לא מגדיר', 'כוח', 'סיבולת', 'יוגה/פילאטיס', 'ספורט קבוצתי', 'שחייה', 'אחר'];

const DIET_TYPES = ['ללא הגבלה', 'צמחוני', 'טבעוני', 'קטוגני', 'ים תיכוני', 'אחר'];

function SelectOption({ options, value, onChange, labelKey = 'label', valueKey = 'key' }) {
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
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

// Snap to the step grid and strip floating-point noise (e.g. 71.19999999 → 71).
function snap(value, step) {
  const n = (parseFloat(value) || 0) / step;
  return parseFloat((Math.round(n) * step).toFixed(2));
}

function NumberInput({ value, onChange, min = 0, max = 999, step = 1, unit }) {
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  // local text buffer so the field can be empty while typing (no jump to 0)
  const [text, setText] = useState(String(value ?? ''));
  useEffect(() => { setText(String(value ?? '')); }, [value]);

  const commit = () => {
    let n = parseFloat(text);
    if (isNaN(n)) n = value || min;
    n = Math.max(min, Math.min(max, n));
    onChange(snap(n, step));
    setText(String(n));
  };
  const dec = () => onChange(Math.max(min, snap((parseFloat(value) || 0) - step, step)));
  const inc = () => onChange(Math.min(max, snap((parseFloat(value) || 0) + step, step)));

  return (
    <View style={styles.numInput}>
      <TouchableOpacity style={styles.numBtn} onPress={dec}>
        <Text style={styles.numBtnTxt}>−</Text>
      </TouchableOpacity>
      <TextInput
        style={styles.numValue}
        value={text}
        onChangeText={setText}
        onFocus={() => setText('')}
        onBlur={commit}
        onSubmitEditing={commit}
        keyboardType="decimal-pad"
        selectTextOnFocus
        returnKeyType="done"
      />
      {unit && <Text style={styles.numUnit}>{unit}</Text>}
      <TouchableOpacity style={styles.numBtn} onPress={inc}>
        <Text style={styles.numBtnTxt}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Date of birth field: opens a calendar / scroll-wheel picker ──────────────
const _fmtDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const _parseDate = (s) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(2000, 0, 1);
};

// ── Number wheel field (height / weight): tap to open a scroll-wheel picker ──
function WheelField({ value, onChange, min, max, step = 1, unit }) {
  const { C, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [show, setShow] = useState(false);

  const options = useMemo(() => {
    const arr = [];
    for (let v = min; v <= max + 1e-9; v += step) arr.push(Math.round(v * 10) / 10);
    return arr;
  }, [min, max, step]);

  // snap the current value to the nearest available option so the wheel highlights it
  const selected = useMemo(() => {
    const v = parseFloat(value) || min;
    return options.reduce((best, o) => (Math.abs(o - v) < Math.abs(best - v) ? o : best), options[0]);
  }, [value, options]);

  return (
    <View>
      <TouchableOpacity style={styles.dateField} onPress={() => setShow(s => !s)}>
        <Ionicons name="chevron-expand-outline" size={18} color={C.textMuted} />
        <Text style={[styles.dateTxt, { color: C.text }]}>{selected} {unit}</Text>
      </TouchableOpacity>
      {show && (
        <View style={styles.wheelBox}>
          <Picker
            selectedValue={selected}
            onValueChange={(v) => onChange(v)}
            itemStyle={{ color: C.text, fontSize: 20, height: 150 }}
            dropdownIconColor={C.text}
          >
            {options.map(o => (
              <Picker.Item key={o} label={`${o} ${unit}`} value={o} color={isDark ? '#fff' : '#1a1a1a'} />
            ))}
          </Picker>
          <TouchableOpacity style={styles.dateDone} onPress={() => setShow(false)}>
            <Text style={styles.dateDoneTxt}>סיום</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function DateField({ value, onChange }) {
  const { C, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [show, setShow] = useState(false);
  const date = _parseDate(value);
  const label = value ? date.toLocaleDateString('he-IL') : 'בחר תאריך לידה';

  const onPick = (event, d) => {
    if (Platform.OS !== 'ios') setShow(false);   // Android dialog closes itself
    if (event?.type === 'dismissed') return;
    if (d) onChange(_fmtDate(d));
  };

  return (
    <View>
      <TouchableOpacity style={styles.dateField} onPress={() => setShow(s => !s)}>
        <Ionicons name="calendar-outline" size={18} color={C.textMuted} />
        <Text style={[styles.dateTxt, { color: value ? C.text : C.textFaint }]}>{label}</Text>
      </TouchableOpacity>
      {show && (
        <View>
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={new Date()}
            minimumDate={new Date(1920, 0, 1)}
            onChange={onPick}
            themeVariant={isDark ? 'dark' : 'light'}
            textColor={C.text}
          />
          {Platform.OS === 'ios' && (
            <TouchableOpacity style={styles.dateDone} onPress={() => setShow(false)}>
              <Text style={styles.dateDoneTxt}>סיום</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

export default function ProfileScreen({ navigation }) {
  const { C, isDark, toggle } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const panHandlers = useSwipeNav(navigation, 'פרופיל');
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
        setWeight(Math.round((p.weight_kg ?? 70) * 10) / 10);
        setActivity(p.activity_level ?? 'moderately_active');
        setGoal(p.goal ?? 'maintain');
        setTargetWeight(Math.round((p.target_weight ?? p.weight_kg ?? 70) * 10) / 10);
        setWeeksToGoal(p.weeks_to_goal ?? 12);
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
        target_weight: targetWeight, weeks_to_goal: weeksToGoal,
        meal_preferences: {
          kashrut, meals_per_day: mealsPerDay,
          allergies, preferred_foods: preferredFoods,
          disliked_foods: dislikedFoods,
          sport_type: sportType, diet_type: dietType,
        }
      });
      // Re-fetch so the new calorie target shows immediately.
      const t = await fetchProfileTargets().catch(() => null);
      if (t) setTargets(t);
      Alert.alert('נשמר', `הפרופיל עודכן. יעד חדש: ${t?.calories ?? '—'} קק"ל ליום`);
    } catch {
      Alert.alert('שגיאה', 'לא הצלחתי לשמור');
    } finally { setSaving(false); }
  };

  const toggleAllergy = (a) => setAllergies(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  const addChip = (list, setList, val, setVal) => {
    const t = val.trim();
    if (t && !list.includes(t)) { setList([...list, t]); setVal(''); }
  };

  const { logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('התנתקות', 'האם אתה בטוח שברצונך להתנתק?', [
      { text: 'ביטול', style: 'cancel' },
      { text: 'התנתק', style: 'destructive', onPress: logout },
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#3a7a4a" /></View>;

  const tabs = ['פרטים אישיים', 'העדפות תזונה', 'יעדים'];

  return (
    <View style={{ flex: 1 }} {...panHandlers}>
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={{ padding: 8 }}>
          <Ionicons name="settings-outline" size={22} color={C.textMuted} />
        </TouchableOpacity>
        <View style={styles.avatarCard}>
          <View style={styles.avatarCircle}><Ionicons name="person" size={40} color="#3a7a4a" /></View>
          <Text style={styles.headerTitle}>פרופיל משתמש</Text>
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
        {/* Pro upgrade banner */}
        <TouchableOpacity style={styles.proBanner} onPress={() => navigation.navigate('Paywall')} activeOpacity={0.9}>
          <Ionicons name="star" size={22} color="#e0a800" />
          <View style={{ flex: 1 }}>
            <Text style={styles.proBannerTitle}>שדרג ל-NutriSmart Pro</Text>
            <Text style={styles.proBannerSub}>צילום וצ׳אט ללא הגבלה · 7 ימים חינם</Text>
          </View>
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>

        {/* TAB 0: Personal */}
        {tab === 0 && (
          <View style={styles.section}>
            <Text style={styles.fieldLabel}>שם מלא</Text>
            <TextInput style={styles.textInput} value={name} onChangeText={setName} placeholder="שם מלא" placeholderTextColor={C.textFaint} />

            <View style={styles.row3}>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>משקל נוכחי (ק"ג)</Text>
                <WheelField value={weight} onChange={setWeight} min={30} max={300} step={0.5} unit='ק"ג' />
              </View>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>גובה (ס"מ)</Text>
                <WheelField value={height} onChange={setHeight} min={100} max={250} step={0.5} unit='ס"מ' />
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
            <DateField value={dob} onChange={setDob} />

            <View style={styles.row3}>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>משקל יעד (ק"ג)</Text>
                <WheelField value={targetWeight} onChange={setTargetWeight} min={30} max={300} step={0.5} unit='ק"ג' />
              </View>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>כמה שבועות עד היעד?</Text>
                <NumberInput value={weeksToGoal} onChange={setWeeksToGoal} min={3} max={52} step={1} unit="שב'" />
              </View>
            </View>

            {weeksToGoal > 0 && targetWeight !== weight && (
              <Text style={styles.paceText}>
                קצב: {Math.abs((targetWeight - weight) / weeksToGoal).toFixed(2)} ק"ג/שבוע · {(targetWeight - weight) < 0 ? 'גירעון' : 'עודף'}: {Math.abs(Math.round(((targetWeight - weight) / weeksToGoal) * 1000))} קק"ל/יום
              </Text>
            )}
            {targetWeight === weight && (
              <Text style={styles.paceHint}>
                כדי שמספר השבועות ישפיע על הקלוריות — קבע משקל יעד שונה מהמשקל הנוכחי ({weight} ק"ג)
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
              <TextInput style={styles.addInput} value={customAllergy} onChangeText={setCustomAllergy} placeholder="הוסף אלרגיה מותאמת" placeholderTextColor={C.textFaint} />
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
              <TextInput style={styles.addInput} value={customPref} onChangeText={setCustomPref} placeholder="לדוגמה: אבוקדו" placeholderTextColor={C.textFaint} />
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
              <TextInput style={styles.addInput} value={customDislike} onChangeText={setCustomDislike} placeholder="לדוגמה: אורז" placeholderTextColor={C.textFaint} />
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
                  { label: 'חלבון', val: targets.protein, total: targets.calories, color: '#3a7a4a', cal: 4 },
                  { label: 'פחמימות', val: targets.carbs, total: targets.calories, color: '#ffd700', cal: 4 },
                  { label: 'שומן', val: targets.fat, total: targets.calories, color: '#ef7d6c', cal: 9 },
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
    </View>
  );
}

const makeStyles = (C) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
  header: { paddingTop: 52, paddingHorizontal: 16, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  avatarCard: { backgroundColor: C.surface, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, marginLeft: 8 },
  avatarCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#1a2a4a', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: C.text, fontSize: 16, fontWeight: '800', textAlign: 'right', flex: 1 },
  headerSub: { color: C.textDim, fontSize: 12, textAlign: 'right', flex: 1 },
  tabBar: { flexDirection: 'row', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: C.surface2 },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabBtnActive: {},
  tabTxt: { color: C.placeholder, fontSize: 13 },
  tabTxtActive: { color: '#3a7a4a', fontWeight: '700' },
  tabUnderline: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: '#3a7a4a' },
  scroll: { flex: 1 },
  section: { padding: 16 },
  proBanner: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12,
    backgroundColor: '#3a7a4a', marginHorizontal: 16, marginTop: 14, marginBottom: 2,
    borderRadius: 16, padding: 14 },
  proBannerTitle: { color: '#fff', fontSize: 16, fontWeight: '800', textAlign: 'right' },
  proBannerSub: { color: '#d8ecdc', fontSize: 12, textAlign: 'right', marginTop: 2 },
  fieldLabel: { color: '#aaa', fontSize: 13, textAlign: 'right', marginBottom: 8, marginTop: 16 },
  textInput: { backgroundColor: C.surface, color: C.text, borderRadius: 10, padding: 12, fontSize: 15, textAlign: 'right', borderWidth: 1, borderColor: C.border },
  row3: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
  numInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  numBtn: { width: 40, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: C.surface3 },
  numBtnTxt: { color: '#3a7a4a', fontSize: 20, fontWeight: '700' },
  numValue: { flex: 1, color: C.text, fontSize: 15, textAlign: 'center', height: 44 },
  numUnit: { color: C.textMuted, fontSize: 12, paddingRight: 8 },
  dateField: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, backgroundColor: C.surface,
    borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, height: 46 },
  dateTxt: { fontSize: 16, flex: 1, textAlign: 'right' },
  dateDone: { alignSelf: 'flex-end', paddingHorizontal: 18, paddingVertical: 8, marginTop: 4,
    backgroundColor: '#3a7a4a', borderRadius: 8 },
  dateDoneTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  wheelBox: { backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.border, marginTop: 6, paddingBottom: 8 },
  optionsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  optBtnActive: { backgroundColor: '#1a2a4a', borderColor: '#3a7a4a' },
  optTxt: { color: C.textDim, fontSize: 13 },
  optTxtActive: { color: '#3a7a4a', fontWeight: '700' },
  paceText: { color: C.textMuted, fontSize: 12, textAlign: 'right', marginTop: 8 },
  paceHint: { color: '#e0a030', fontSize: 12, textAlign: 'right', marginTop: 8, lineHeight: 17 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  chipActive: { backgroundColor: '#2a1a4a', borderColor: '#8a6aff' },
  chipTxt: { color: C.textDim, fontSize: 13 },
  chipTxtActive: { color: '#8a6aff', fontWeight: '700' },
  chipGreen: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, backgroundColor: '#0a2a1a', borderWidth: 1, borderColor: '#56bd6b' },
  chipGreenTxt: { color: '#56bd6b', fontSize: 13 },
  chipRed: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, backgroundColor: '#2a1a1a', borderWidth: 1, borderColor: '#ef7d6c' },
  chipRedTxt: { color: '#ef7d6c', fontSize: 13 },
  addRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  addInput: { flex: 1, backgroundColor: C.surface, color: C.text, borderRadius: 10, padding: 10, fontSize: 14, textAlign: 'right', borderWidth: 1, borderColor: C.border },
  addBtn: { backgroundColor: '#3a7a4a', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  addBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
  targetsCard: { backgroundColor: C.surface, borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16 },
  targetsTitle: { color: C.textMuted, fontSize: 14, marginBottom: 8 },
  targetsCalories: { color: C.text, fontSize: 52, fontWeight: '800' },
  targetsKcal: { color: C.textMuted, fontSize: 14 },
  bmrRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  bmrCard: { flex: 1, backgroundColor: C.surface, borderRadius: 12, padding: 14, alignItems: 'center' },
  bmrLabel: { color: '#3a7a4a', fontSize: 12, fontWeight: '700', marginBottom: 4 },
  bmrVal: { color: C.text, fontSize: 20, fontWeight: '700' },
  macroRow: { backgroundColor: C.surface, borderRadius: 12, padding: 12, marginBottom: 8 },
  macroBarWrap: { height: 8, backgroundColor: C.surface3, borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  macroBar: { height: '100%', borderRadius: 4 },
  macroInfo: { flexDirection: 'row', justifyContent: 'space-between' },
  macroName: { fontSize: 14, fontWeight: '700' },
  macroDetail: { color: C.textMuted, fontSize: 13 },
  noTargets: { color: C.textDim, fontSize: 14, textAlign: 'center', paddingVertical: 32 },
  saveBtn: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#3a7a4a', padding: 16, alignItems: 'center' },
  saveTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
