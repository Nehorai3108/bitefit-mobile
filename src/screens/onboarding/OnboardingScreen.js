import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { saveProfile } from '../../api/client';

const GENDERS   = [{ key: 'male', label: 'זכר' }, { key: 'female', label: 'נקבה' }];
const GOALS     = [
  { key: 'lose_weight', label: 'ירידה במשקל' },
  { key: 'maintain',    label: 'שמירה על המשקל' },
  { key: 'gain_weight', label: 'עלייה במסה' },
];
const ACTIVITIES = [
  { key: 'sedentary',         label: 'יושבני',    sub: 'עבודה משרדית, מעט תנועה' },
  { key: 'lightly_active',    label: 'קליל',      sub: '1-3 אימונים בשבוע' },
  { key: 'moderately_active', label: 'מתון',      sub: '3-5 אימונים בשבוע' },
  { key: 'very_active',       label: 'פעיל',      sub: '6-7 אימונים בשבוע' },
  { key: 'extra_active',      label: 'מאוד פעיל', sub: 'אימונים אינטנסיביים / עבודה פיזית' },
];
const COMMON_ALLERGIES = ['גלוטן', 'חלב', 'ביצים', 'אגוזים', 'סויה', 'דגים', 'בוטנים'];

export default function OnboardingScreen() {
  const { markOnboarded } = useAuth();
  const [step, setStep] = useState(1);

  // Step 1 — personal data
  const [name,   setName]   = useState('');
  const [age,    setAge]    = useState('');
  const [gender, setGender] = useState('male');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');

  // Step 2 — goal + activity
  const [goal,         setGoal]         = useState('lose_weight');
  const [activity,     setActivity]     = useState('moderately_active');
  const [targetWeight, setTargetWeight] = useState('');   // רלוונטי רק לירידה/עלייה

  // Step 3 — allergies (optional)
  const [allergies, setAllergies] = useState([]);

  const [saving, setSaving] = useState(false);

  const toggleAllergy = (a) =>
    setAllergies(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

  const validateStep1 = () => {
    if (!name.trim())         { Alert.alert('', 'יש להזין שם'); return false; }
    if (!age || +age < 10 || +age > 120) { Alert.alert('', 'גיל לא תקין'); return false; }
    if (!height || +height < 100 || +height > 250) { Alert.alert('', 'גובה לא תקין (ס"מ)'); return false; }
    if (!weight || +weight < 30 || +weight > 300)  { Alert.alert('', 'משקל לא תקין (ק"ג)'); return false; }
    return true;
  };

  const validateStep2 = () => {
    if (goal !== 'maintain') {
      if (!targetWeight || +targetWeight < 30 || +targetWeight > 300) {
        Alert.alert('', 'יש להזין משקל יעד תקין (ק"ג)'); return false;
      }
      if (goal === 'lose_weight' && +targetWeight >= +weight) {
        Alert.alert('', 'משקל היעד צריך להיות נמוך מהמשקל הנוכחי'); return false;
      }
      if (goal === 'gain_weight' && +targetWeight <= +weight) {
        Alert.alert('', 'משקל היעד צריך להיות גבוה מהמשקל הנוכחי'); return false;
      }
    }
    return true;
  };

  const next = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep(s => s + 1);
  };

  const finish = async () => {
    setSaving(true);
    try {
      // ה-backend מחשב יעדים מ-date_of_birth, לא מ-age — נגזור תאריך לידה משוער
      const dob = `${new Date().getFullYear() - (+age)}-01-01`;
      // משקל יעד: אם נבחרה מטרה שאינה שמירה — שומרים את היעד שהוזן.
      // אחרת היעד = המשקל הנוכחי. weeks_to_goal עם ברירת מחדל סבירה כדי
      // שחישוב הקלוריות ישקף את הקצב (אפשר לכוונן בהמשך במסך הפרופיל).
      const finalTarget = goal === 'maintain' ? +weight : +targetWeight;
      await saveProfile({
        name:          name.trim(),
        age:           +age,
        date_of_birth: dob,
        gender,
        height_cm:     +height,
        weight_kg:     +weight,
        goal,
        activity_level: activity,
        target_weight:  finalTarget,
        weeks_to_goal:  12,
        // אלרגיות חייבות להישמר תחת meal_preferences — שם ProfileScreen
        // ומנוע המתכונים קוראים אותן
        meal_preferences: { allergies },
      });
      await markOnboarded();
    } catch (e) {
      Alert.alert('שגיאה', 'לא הצלחנו לשמור את הפרופיל. נסה שוב.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Progress dots */}
      <View style={s.progressBar}>
        {[1, 2, 3].map(n => (
          <View key={n} style={[s.dot, step >= n && s.dotActive]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* ── Step 1: Personal Details ─────────────────── */}
        {step === 1 && (
          <View>
            <Text style={s.stepTitle}>קצת עלייך</Text>
            <Text style={s.stepSub}>נשתמש במידע זה לחישוב הצרכים התזונתיים שלך</Text>

            <Text style={s.label}>שם פרטי</Text>
            <TextInput style={s.input} value={name} onChangeText={setName}
              placeholder="מה שמך?" placeholderTextColor="#555"
              autoCapitalize="words" />

            <View style={s.row}>
              <View style={s.halfWrap}>
                <Text style={s.label}>גיל</Text>
                <TextInput style={s.input} value={age} onChangeText={setAge}
                  placeholder="25" placeholderTextColor="#555"
                  keyboardType="number-pad" />
              </View>
              <View style={s.halfWrap}>
                <Text style={s.label}>מין</Text>
                <View style={s.chipRow}>
                  {GENDERS.map(g => (
                    <TouchableOpacity key={g.key}
                      style={[s.chip, gender === g.key && s.chipActive]}
                      onPress={() => setGender(g.key)}>
                      <Text style={[s.chipTxt, gender === g.key && s.chipTxtActive]}>{g.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={s.row}>
              <View style={s.halfWrap}>
                <Text style={s.label}>גובה (ס"מ)</Text>
                <TextInput style={s.input} value={height} onChangeText={setHeight}
                  placeholder="170" placeholderTextColor="#555"
                  keyboardType="number-pad" />
              </View>
              <View style={s.halfWrap}>
                <Text style={s.label}>משקל (ק"ג)</Text>
                <TextInput style={s.input} value={weight} onChangeText={setWeight}
                  placeholder="70" placeholderTextColor="#555"
                  keyboardType="decimal-pad" />
              </View>
            </View>
          </View>
        )}

        {/* ── Step 2: Goal + Activity ───────────────────── */}
        {step === 2 && (
          <View>
            <Text style={s.stepTitle}>מה המטרה שלך?</Text>
            <Text style={s.stepSub}>נתאים את תוכנית התזונה בהתאם</Text>

            {GOALS.map(g => (
              <TouchableOpacity key={g.key}
                style={[s.optionCard, goal === g.key && s.optionCardActive]}
                onPress={() => setGoal(g.key)}
                activeOpacity={0.8}>
                <Text style={[s.optionLabel, goal === g.key && s.optionLabelActive]}>{g.label}</Text>
              </TouchableOpacity>
            ))}

            {/* משקל יעד — רלוונטי רק כשרוצים לרדת/לעלות במשקל */}
            {goal !== 'maintain' && (
              <View style={{ marginTop: 16 }}>
                <Text style={s.label}>
                  {goal === 'lose_weight' ? 'משקל יעד (לאן רוצה להגיע?)' : 'משקל יעד (כמה לעלות?)'}
                </Text>
                <TextInput style={s.input} value={targetWeight} onChangeText={setTargetWeight}
                  placeholder={weight ? `למשל ${goal === 'lose_weight' ? +weight - 5 : +weight + 5}` : 'ק"ג'}
                  placeholderTextColor="#555" keyboardType="decimal-pad" />
                {targetWeight && weight ? (
                  <Text style={s.optionSub}>
                    {goal === 'lose_weight' ? 'לרדת' : 'לעלות'} {Math.abs(+weight - +targetWeight).toFixed(1)} ק"ג
                    מ-{weight} ל-{targetWeight}
                  </Text>
                ) : null}
              </View>
            )}

            <Text style={[s.stepTitle, { marginTop: 28 }]}>רמת פעילות גופנית</Text>
            {ACTIVITIES.map(a => (
              <TouchableOpacity key={a.key}
                style={[s.optionCard, activity === a.key && s.optionCardActive]}
                onPress={() => setActivity(a.key)}
                activeOpacity={0.8}>
                <Text style={[s.optionLabel, activity === a.key && s.optionLabelActive]}>{a.label}</Text>
                <Text style={s.optionSub}>{a.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Step 3: Allergies (optional) ─────────────── */}
        {step === 3 && (
          <View>
            <Text style={s.stepTitle}>אלרגיות ורגישויות</Text>
            <Text style={s.stepSub}>לא חובה — ניתן לדלג ולהגדיר מאוחר יותר</Text>

            <View style={s.tagGrid}>
              {COMMON_ALLERGIES.map(a => (
                <TouchableOpacity key={a}
                  style={[s.tagChip, allergies.includes(a) && s.tagChipActive]}
                  onPress={() => toggleAllergy(a)}>
                  <Text style={[s.tagTxt, allergies.includes(a) && s.tagTxtActive]}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {allergies.length > 0 && (
              <Text style={s.selectedTxt}>נבחר: {allergies.join(' · ')}</Text>
            )}
          </View>
        )}

      </ScrollView>

      {/* Bottom navigation */}
      <View style={s.bottom}>
        {step > 1 && (
          <TouchableOpacity style={s.backBtn} onPress={() => setStep(s => s - 1)}>
            <Text style={s.backTxt}>חזרה</Text>
          </TouchableOpacity>
        )}

        {step < 3 ? (
          <TouchableOpacity style={s.nextBtn} onPress={next} activeOpacity={0.8}>
            <Text style={s.nextTxt}>המשך ←</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[s.nextBtn, saving && s.btnDisabled]}
            onPress={finish} disabled={saving} activeOpacity={0.8}>
            {saving
              ? <ActivityIndicator color="#000" />
              : <Text style={s.nextTxt}>בוא נתחיל!</Text>
            }
          </TouchableOpacity>
        )}

        {step === 3 && (
          <TouchableOpacity style={s.skipBtn} onPress={finish} disabled={saving}>
            <Text style={s.skipTxt}>דלג</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const GREEN = '#56bd6b';

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#0c1622' },
  scroll:  { flexGrow: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 120 },

  progressBar: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingTop: 56, paddingBottom: 8 },
  dot:         { width: 8, height: 8, borderRadius: 4, backgroundColor: '#333' },
  dotActive:   { backgroundColor: GREEN, width: 24 },

  stepTitle: { fontSize: 24, fontWeight: '800', color: '#fff', textAlign: 'right', marginBottom: 6, marginTop: 20 },
  stepSub:   { fontSize: 14, color: '#777', textAlign: 'right', marginBottom: 24 },

  label:  { fontSize: 13, color: '#aaa', marginBottom: 6, textAlign: 'right' },
  input:  {
    backgroundColor: '#23384c', borderRadius: 12, paddingHorizontal: 16,
    paddingVertical: 14, color: '#fff', fontSize: 15, marginBottom: 16, textAlign: 'right',
  },

  row:      { flexDirection: 'row', gap: 12 },
  halfWrap: { flex: 1 },

  chipRow:     { flexDirection: 'row', gap: 8, marginBottom: 16 },
  chip:        { flex: 1, backgroundColor: '#23384c', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  chipActive:  { backgroundColor: GREEN },
  chipTxt:     { color: '#888', fontWeight: '600', fontSize: 14 },
  chipTxtActive: { color: '#000' },

  optionCard:       {
    backgroundColor: '#1b2c3d', borderRadius: 14, padding: 16,
    marginBottom: 10, borderWidth: 2, borderColor: 'transparent',
  },
  optionCardActive:  { borderColor: GREEN, backgroundColor: '#1e2a14' },
  optionLabel:       { fontSize: 16, color: '#ccc', fontWeight: '600', textAlign: 'right' },
  optionLabelActive: { color: GREEN },
  optionSub:         { fontSize: 12, color: '#666', textAlign: 'right', marginTop: 3 },

  tagGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  tagChip:        { backgroundColor: '#23384c', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 },
  tagChipActive:  { backgroundColor: '#2a1e1e', borderWidth: 1.5, borderColor: '#e05252' },
  tagTxt:         { color: '#888', fontSize: 14 },
  tagTxtActive:   { color: '#e05252' },
  selectedTxt:    { color: '#e05252', fontSize: 13, textAlign: 'right', marginTop: 8 },

  bottom:     {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#0c1622', paddingHorizontal: 24,
    paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    borderTopWidth: 1, borderTopColor: '#23384c',
  },
  nextBtn:     {
    backgroundColor: GREEN, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginBottom: 8,
  },
  btnDisabled: { opacity: 0.6 },
  nextTxt:     { color: '#000', fontSize: 16, fontWeight: '700' },
  backBtn:     { alignItems: 'center', paddingVertical: 10, marginBottom: 4 },
  backTxt:     { color: '#666', fontSize: 15 },
  skipBtn:     { alignItems: 'center', paddingVertical: 8 },
  skipTxt:     { color: '#555', fontSize: 14 },
});
