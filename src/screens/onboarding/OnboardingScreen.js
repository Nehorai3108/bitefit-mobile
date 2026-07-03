import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Platform, Animated, Easing, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../../context/AuthContext';
import { saveProfile } from '../../api/client';

// ── Clean light palette (Cal AI style) — intentionally independent of app theme ──
const K = {
  bg: '#ffffff', text: '#0b0b0c', sub: '#8a8a8e',
  card: '#f4f4f6', cardSel: '#0b0b0c', border: '#ececee',
  onSel: '#ffffff', track: '#eeeeef',
};

const GENDERS = [
  { key: 'male',   label: 'זכר',  icon: 'male' },
  { key: 'female', label: 'נקבה', icon: 'female' },
];
const WORKOUTS = [
  { key: 0, label: 'אין אימונים', sub: 'לשבוע', icon: 'bed-outline' },
  { key: 1, label: 'אימון 1',     sub: 'לשבוע', icon: 'walk-outline' },
  { key: 2, label: 'אימונים 2',   sub: 'לשבוע', icon: 'walk-outline' },
  { key: 3, label: 'אימונים 3',   sub: 'לשבוע', icon: 'barbell-outline' },
  { key: 4, label: 'אימונים 4',   sub: 'לשבוע', icon: 'barbell-outline' },
  { key: 5, label: 'אימונים 5',   sub: 'לשבוע', icon: 'fitness-outline' },
  { key: 6, label: 'אימונים 6+',  sub: 'לשבוע', icon: 'flame-outline' },
];
const GOALS = [
  { key: 'lose_weight', label: 'ירידה במשקל' },
  { key: 'maintain',    label: 'שמירה על המשקל' },
  { key: 'gain_weight', label: 'עלייה במסה' },
];
const SPEEDS = [
  { key: 0.25, label: '0.25 ק"ג', sub: 'איטי ובטוח',  icon: 'leaf-outline' },
  { key: 0.5,  label: '0.5 ק"ג',  sub: 'מומלץ',        icon: 'walk-outline' },
  { key: 1.0,  label: '1.0 ק"ג',  sub: 'מהיר',         icon: 'flash-outline' },
];

const ACTIVITY_BY_WORKOUTS = {
  0: 'sedentary', 1: 'lightly_active', 2: 'lightly_active',
  3: 'moderately_active', 4: 'moderately_active', 5: 'very_active', 6: 'extra_active',
};

const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
const nowYear = new Date().getFullYear();

export default function OnboardingScreen() {
  const { markOnboarded } = useAuth();

  const [idx, setIdx]       = useState(0);
  const [name, setName]     = useState('');
  const [gender, setGender] = useState(null);
  const [workouts, setWorkouts] = useState(null);
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(70);
  const [year, setYear]     = useState(1998);
  const [month, setMonth]   = useState(1);
  const [goal, setGoal]     = useState(null);
  const [target, setTarget] = useState(65);
  const [speed, setSpeed]   = useState(0.5);
  const [saving, setSaving] = useState(false);

  // Dynamic step list — target/speed skipped when just maintaining.
  const steps = useMemo(() => {
    const base = ['name', 'gender', 'workouts', 'body', 'dob', 'goal'];
    if (goal && goal !== 'maintain') base.push('target', 'speed');
    base.push('motivation', 'loading');
    return base;
  }, [goal]);

  const step = steps[Math.min(idx, steps.length - 1)];
  const progress = idx / (steps.length - 1);

  const canNext = () => {
    if (step === 'name')     return name.trim().length >= 2;
    if (step === 'gender')   return !!gender;
    if (step === 'workouts') return workouts !== null;
    if (step === 'goal')     return !!goal;
    return true;
  };

  const next = () => {
    if (!canNext()) return;
    if (step === 'target') {
      if (goal === 'lose_weight' && target >= weight) { Alert.alert('', 'משקל היעד צריך להיות נמוך מהמשקל הנוכחי'); return; }
      if (goal === 'gain_weight' && target <= weight) { Alert.alert('', 'משקל היעד צריך להיות גבוה מהמשקל הנוכחי'); return; }
    }
    setIdx(i => Math.min(i + 1, steps.length - 1));
  };
  const back = () => setIdx(i => Math.max(i - 1, 0));

  const finish = async () => {
    setSaving(true);
    try {
      const dob = `${year}-${String(month).padStart(2, '0')}-15`;
      const finalTarget = goal === 'maintain' ? weight : target;
      const weeks = goal === 'maintain'
        ? 12
        : Math.max(1, Math.round(Math.abs(weight - finalTarget) / speed));
      await saveProfile({
        name: name.trim(),
        age: nowYear - year,
        date_of_birth: dob,
        gender: gender || 'male',
        height_cm: +height,
        weight_kg: +weight,
        goal: goal || 'maintain',
        activity_level: ACTIVITY_BY_WORKOUTS[workouts ?? 3],
        target_weight: +finalTarget,
        weeks_to_goal: weeks,
        meal_preferences: { allergies: [] },
      });
      await markOnboarded();
    } catch (e) {
      Alert.alert('שגיאה', 'לא הצלחנו לשמור את הפרופיל. נסה שוב.');
      setSaving(false);
      setIdx(i => Math.max(0, i - 1));
    }
  };

  const diff = Math.abs(weight - target).toFixed(1);

  return (
    <View style={st.root}>
      {/* Top bar: progress + back */}
      {step !== 'loading' && (
        <View style={st.topBar}>
          <TouchableOpacity onPress={back} disabled={idx === 0} style={st.backHit}>
            <Ionicons name="chevron-forward" size={26} color={idx === 0 ? 'transparent' : K.text} />
          </TouchableOpacity>
          <View style={st.track}>
            <View style={[st.fill, { width: `${Math.max(6, progress * 100)}%` }]} />
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={st.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {step === 'name' && (
          <>
            <Text style={st.h1}>איך קוראים לך?</Text>
            <Text style={st.p}>נשתמש בזה כדי לפנות אליך אישית.</Text>
            <TextInput style={st.input} value={name} onChangeText={setName}
              placeholder="השם שלך" placeholderTextColor={K.sub} autoCapitalize="words" autoFocus />
          </>
        )}

        {step === 'gender' && (
          <>
            <Text style={st.h1}>מה המין שלך?</Text>
            <Text style={st.p}>זה משפיע על חישוב הקלוריות והמאקרו.</Text>
            {GENDERS.map(g => (
              <Card key={g.key} active={gender === g.key} onPress={() => setGender(g.key)}
                icon={g.icon} label={g.label} />
            ))}
          </>
        )}

        {step === 'workouts' && (
          <>
            <Text style={st.h1}>כמה אימונים{'\n'}אתה עושה בשבוע?</Text>
            <Text style={st.p}>זה יעזור לנו לבנות תוכנית מותאמת.</Text>
            {WORKOUTS.map(w => (
              <Card key={w.key} active={workouts === w.key} onPress={() => setWorkouts(w.key)}
                icon={w.icon} label={w.label} sub={w.sub} />
            ))}
          </>
        )}

        {step === 'body' && (
          <>
            <Text style={st.h1}>גובה ומשקל</Text>
            <Text style={st.p}>זה ישמש להתאמת התוכנית המדויקת לך.</Text>
            <View style={st.pickerRow}>
              <Wheel label='גובה (ס"מ)' value={height} onChange={setHeight} data={range(120, 220)} />
              <Wheel label='משקל (ק"ג)' value={weight} onChange={setWeight} data={range(35, 200)} />
            </View>
          </>
        )}

        {step === 'dob' && (
          <>
            <Text style={st.h1}>מתי נולדת?</Text>
            <Text style={st.p}>זה ישמש לחישוב הצרכים התזונתיים שלך.</Text>
            <View style={st.pickerRow}>
              <Wheel label="חודש" value={month} onChange={setMonth}
                data={range(1, 12)} render={(m) => MONTHS[m - 1]} />
              <Wheel label="שנה" value={year} onChange={setYear} data={range(1945, nowYear - 12)} />
            </View>
          </>
        )}

        {step === 'goal' && (
          <>
            <Text style={st.h1}>מה היעד שלך?</Text>
            <Text style={st.p}>נבנה עבורך תוכנית קלורית שתתאים למטרה.</Text>
            {GOALS.map(g => (
              <Card key={g.key} active={goal === g.key} onPress={() => setGoal(g.key)} label={g.label} />
            ))}
          </>
        )}

        {step === 'target' && (
          <>
            <Text style={st.h1}>מה המשקל הרצוי?</Text>
            <Text style={st.p}>{goal === 'lose_weight' ? 'לאן תרצה להגיע?' : 'כמה תרצה לעלות?'}</Text>
            <View style={st.pickerRow}>
              <Wheel label='ק"ג' value={target} onChange={setTarget} data={range(35, 200)} wide />
            </View>
            <Text style={st.hint}>
              {goal === 'lose_weight' ? 'לרדת' : 'לעלות'} {diff} ק"ג · מ-{weight} ל-{target}
            </Text>
          </>
        )}

        {step === 'speed' && (
          <>
            <Text style={st.h1}>באיזו מהירות{'\n'}תרצה להגיע ליעד?</Text>
            <Text style={st.p}>שינוי מומלץ: כ-0.5 ק"ג בשבוע.</Text>
            {SPEEDS.map(sp => (
              <Card key={sp.key} active={speed === sp.key} onPress={() => setSpeed(sp.key)}
                icon={sp.icon} label={`${sp.label} בשבוע`} sub={sp.sub} badge={sp.key === 0.5 ? 'מומלץ' : null} />
            ))}
          </>
        )}

        {step === 'motivation' && (
          <View style={st.center}>
            <Text style={st.big}>{name ? `${name}, ` : ''}יש לך תוכנית מנצחת 🎯</Text>
            <Text style={st.pCenter}>
              90% מהמשתמשים מדווחים שהמעקב היומי עוזר להם להגיע ליעד — ועם NutriSmart זה פשוט.
            </Text>
          </View>
        )}

        {step === 'loading' && <Loading onDone={finish} name={name} />}

      </ScrollView>

      {step !== 'loading' && (
        <View style={st.bottom}>
          <TouchableOpacity
            style={[st.cta, !canNext() && st.ctaOff]}
            onPress={step === 'motivation' ? next : next}
            disabled={!canNext()}
            activeOpacity={0.85}>
            <Text style={[st.ctaTxt, !canNext() && st.ctaTxtOff]}>
              {step === 'motivation' ? 'בוא נתחיל' : 'המשך'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ── Reusable option card ─────────────────────────────────────────────────────
function Card({ active, onPress, icon, label, sub, badge }) {
  return (
    <TouchableOpacity style={[st.card, active && st.cardSel]} onPress={onPress} activeOpacity={0.85}>
      <View style={{ flex: 1 }}>
        <View style={st.cardTop}>
          <Text style={[st.cardLabel, active && st.cardLabelSel]}>{label}</Text>
          {badge && <Text style={st.badge}>{badge}</Text>}
        </View>
        {sub ? <Text style={[st.cardSub, active && st.cardSubSel]}>{sub}</Text> : null}
      </View>
      {icon ? (
        <View style={[st.iconWrap, active && st.iconWrapSel]}>
          <Ionicons name={icon} size={20} color={active ? K.text : K.text} />
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

// ── Wheel picker column ──────────────────────────────────────────────────────
function Wheel({ label, value, onChange, data, render, wide }) {
  return (
    <View style={[st.wheel, wide && { flex: 1.4 }]}>
      <Text style={st.wheelLabel}>{label}</Text>
      <Picker selectedValue={value} onValueChange={onChange}
        style={st.picker} itemStyle={st.pickerItem}>
        {data.map(d => (
          <Picker.Item key={d} label={String(render ? render(d) : d)} value={d} color={K.text} />
        ))}
      </Picker>
    </View>
  );
}

// ── Loading screen with animated % ───────────────────────────────────────────
function Loading({ onDone, name }) {
  const [pct, setPct] = useState(0);
  const anim = useRef(new Animated.Value(0)).current;
  const started = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      setPct(p => {
        const nextP = Math.min(100, p + Math.ceil(Math.random() * 7));
        if (nextP >= 100 && !started.current) { started.current = true; setTimeout(onDone, 400); }
        return nextP;
      });
    }, 120);
    Animated.timing(anim, { toValue: 1, duration: 2200, easing: Easing.out(Easing.quad), useNativeDriver: false }).start();
    return () => clearInterval(id);
  }, []);

  const CHECKS = ['קלוריות', 'חלבון', 'פחמימות', 'שומנים', 'יעד יומי'];
  const done = Math.floor((pct / 100) * CHECKS.length);

  return (
    <View style={st.loadWrap}>
      <Text style={st.loadPct}>{pct}%</Text>
      <Text style={st.loadTitle}>מכינים הכל עבורך…</Text>
      <View style={st.loadTrack}>
        <Animated.View style={[st.loadFill, { width: anim.interpolate({ inputRange: [0, 1], outputRange: ['5%', '100%'] }) }]} />
      </View>
      <Text style={st.loadSub}>מתאימים את התזונה שלך</Text>
      <View style={{ marginTop: 40, alignSelf: 'stretch' }}>
        {CHECKS.map((c, i) => (
          <View key={c} style={st.checkRow}>
            <Text style={[st.checkTxt, i >= done && { color: K.sub }]}>{c}</Text>
            <View style={[st.checkDot, i < done && st.checkDotOn]}>
              {i < done && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: K.bg },
  topBar: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 8 },
  backHit: { padding: 4 },
  track: { flex: 1, height: 6, borderRadius: 3, backgroundColor: K.track, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3, backgroundColor: K.text },

  body: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
  h1: { fontSize: 30, lineHeight: 38, fontWeight: '800', color: K.text, textAlign: 'right', marginBottom: 8 },
  p:  { fontSize: 15, color: K.sub, textAlign: 'right', marginBottom: 28 },
  hint: { fontSize: 14, color: K.sub, textAlign: 'center', marginTop: 8 },

  input: { backgroundColor: K.card, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 18, fontSize: 18, color: K.text, textAlign: 'right' },

  card: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: K.card, borderRadius: 18, paddingVertical: 18, paddingHorizontal: 18, marginBottom: 12 },
  cardSel: { backgroundColor: K.cardSel },
  cardTop: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  cardLabel: { fontSize: 17, fontWeight: '700', color: K.text, textAlign: 'right' },
  cardLabelSel: { color: K.onSel },
  cardSub: { fontSize: 13, color: K.sub, textAlign: 'right', marginTop: 2 },
  cardSubSel: { color: '#c9c9cc' },
  badge: { fontSize: 11, fontWeight: '700', color: K.text, backgroundColor: '#e8e8ea', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, overflow: 'hidden' },
  iconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e8e8ea', alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  iconWrapSel: { backgroundColor: '#ffffff' },

  pickerRow: { flexDirection: 'row', gap: 12, alignItems: 'center', justifyContent: 'center' },
  wheel: { flex: 1, backgroundColor: K.card, borderRadius: 18, paddingTop: 10, paddingBottom: Platform.OS === 'android' ? 4 : 0 },
  wheelLabel: { fontSize: 13, color: K.sub, textAlign: 'center', marginBottom: Platform.OS === 'ios' ? -8 : 4 },
  picker: { width: '100%', height: Platform.OS === 'ios' ? 190 : 56, color: K.text },
  pickerItem: { fontSize: 22, height: 190, color: K.text },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  big: { fontSize: 28, lineHeight: 38, fontWeight: '800', color: K.text, textAlign: 'center', marginBottom: 16 },
  pCenter: { fontSize: 16, lineHeight: 26, color: K.sub, textAlign: 'center' },

  loadWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 120, paddingHorizontal: 8 },
  loadPct: { fontSize: 64, fontWeight: '800', color: K.text },
  loadTitle: { fontSize: 22, fontWeight: '700', color: K.text, marginTop: 8, marginBottom: 24 },
  loadTrack: { alignSelf: 'stretch', height: 8, borderRadius: 4, backgroundColor: K.track, overflow: 'hidden' },
  loadFill: { height: '100%', borderRadius: 4, backgroundColor: K.text },
  loadSub: { fontSize: 14, color: K.sub, marginTop: 14 },
  checkRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  checkTxt: { fontSize: 16, fontWeight: '600', color: K.text },
  checkDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: K.track, alignItems: 'center', justifyContent: 'center' },
  checkDotOn: { backgroundColor: K.text },

  bottom: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 34 : 20 },
  cta: { backgroundColor: K.cardSel, borderRadius: 30, paddingVertical: 18, alignItems: 'center' },
  ctaOff: { backgroundColor: K.card },
  ctaTxt: { color: K.onSel, fontSize: 17, fontWeight: '700' },
  ctaTxtOff: { color: K.sub },
});
