import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Image,
  ActivityIndicator, Alert, Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchWeeklyPlan, swapMeal, searchMealRecipes, addFoodEntry } from '../api/client';
import { useTheme } from '../context/ThemeContext';
import { openMealLog } from '../mealLogBridge';

const planKey = () => {
  const d = new Date();
  return `@day_plan_${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

const MEAL_ORDER = [
  { key: 'BREAKFAST',       label: 'ארוחת בוקר' },
  { key: 'MORNING_SNACK',   label: 'חטיף בוקר' },
  { key: 'LUNCH',           label: 'צהריים' },
  { key: 'AFTERNOON_SNACK', label: 'חטיף אחה"צ' },
  { key: 'DINNER',          label: 'ארוחת ערב' },
];

const MACROS = [
  { key: 'protein', label: 'חלבון', color: '#3a7a4a' },
  { key: 'carbs',   label: 'פחמימות', color: '#d4a017' },
  { key: 'fat',     label: 'שומן', color: '#ef7d6c' },
];

function StatBar({ label, value, target, color, unit, C }) {
  const pct = target > 0 ? Math.min(1, value / target) : 0;
  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 5 }}>
        <Text style={{ color: C.text, fontSize: 13, fontWeight: '700' }}>{label}</Text>
        <Text style={{ color: C.textMuted, fontSize: 13 }}>
          {Math.round(value)}{unit} / {Math.round(target)}{unit}
        </Text>
      </View>
      <View style={{ height: 7, borderRadius: 4, backgroundColor: C.surface2, overflow: 'hidden' }}>
        <View style={{ width: `${pct * 100}%`, height: '100%', borderRadius: 4, backgroundColor: color }} />
      </View>
    </View>
  );
}

function MealCard({ label, mealKey, data, C, styles, onSwap, compensate, onCompensate, onLogEaten, last }) {
  const [open, setOpen] = useState(false);
  const [ate, setAte] = useState(false);
  const recipe = data?.recipe;
  if (!recipe) return null;

  const doSwap = () => onSwap(mealKey, data.target_calories, recipe.recipe_id, label);
  const n = recipe.total_nutrition ?? {};
  const ingredients = recipe.ingredients ?? [];

  const logMeal = async () => {
    if (ate) return;
    try {
      await addFoodEntry({
        food_id: recipe.recipe_id ?? 'recipe',
        food_name: recipe.name_he ?? recipe.name_en ?? label,
        grams: 100,
        calories: Math.round(n.calories ?? 0),
        protein: Math.round(n.protein ?? 0),
        carbs: Math.round(n.carbs ?? 0),
        fat: Math.round(n.fat ?? 0),
        meal_type: mealKey ?? 'LUNCH',
        image_url: recipe.image_url ?? null,
      });
      setAte(true);
    } catch { Alert.alert('שגיאה', 'לא הצלחתי לרשום'); }
  };

  return (
    <View style={[styles.mealRow, last && { borderBottomWidth: 0 }]}>
      {compensate > 0 && (
        <TouchableOpacity style={styles.compensateBtn} onPress={() => onCompensate(mealKey)}>
          <Ionicons name="trending-down" size={15} color="#fff" />
          <Text style={styles.compensateTxt}>קזז {compensate} קק"ל מ{label}</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.mealHead} activeOpacity={0.7} onPress={() => setOpen(o => !o)}>
        <View style={styles.mealCalCol}>
          <Text style={styles.mealCalNum}>{Math.round(n.calories ?? 0)}</Text>
          <Text style={styles.mealCalUnit}>קק"ל</Text>
        </View>
        {recipe.image_url
          ? <Image source={{ uri: recipe.image_url }} style={styles.mealThumb} />
          : <View style={[styles.mealThumb, styles.thumbEmpty]}><Ionicons name="restaurant-outline" size={18} color={C.textMuted} /></View>}
        <View style={{ flex: 1 }}>
          <Text style={styles.mealLabel}>{label}</Text>
          <Text style={styles.mealName} numberOfLines={1}>{recipe.name_he ?? recipe.name_en}</Text>
          <Text style={styles.mealMacros}>
            חלבון {Math.round(n.protein ?? 0)} · פחמ' {Math.round(n.carbs ?? 0)} · שומן {Math.round(n.fat ?? 0)}
          </Text>
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={C.textFaint} />
      </TouchableOpacity>

      {open && (
        <View style={styles.mealBody}>
          <Text style={styles.bodyTitle}>מצרכים (כמות מדויקת)</Text>
          {ingredients.map((ing, i) => (
            <View key={i} style={styles.ingRow}>
              <View style={styles.ingDot} />
              <Text style={styles.ingTxt}>
                {ing.display_he ?? `${ing.quantity ?? ''}g ${ing.food_name ?? ing.food_name_en ?? ''}`}
              </Text>
            </View>
          ))}
          {recipe.instructions ? (
            <>
              <Text style={[styles.bodyTitle, { marginTop: 12 }]}>אופן ההכנה</Text>
              <Text style={styles.instr}>
                {Array.isArray(recipe.instructions) ? recipe.instructions.join('\n') : recipe.instructions}
              </Text>
            </>
          ) : null}
          <View style={styles.mealActions}>
            <TouchableOpacity style={styles.swapBtn} onPress={doSwap}>
              <Ionicons name="swap-horizontal" size={16} color="#3a7a4a" />
              <Text style={styles.swapTxt}>החלף מנה</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.ateBtn, { flex: 1 }, ate && styles.ateBtnDone]} onPress={logMeal}>
              <Ionicons name={ate ? 'checkmark-circle' : 'add-circle-outline'} size={16} color={ate ? '#56bd6b' : '#fff'} />
              <Text style={[styles.ateTxt, ate && { color: '#56bd6b' }]}>{ate ? 'נרשם ביומן' : 'אכלתי את זה'}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.logEatenBtn} onPress={() => onLogEaten(mealKey, label)}>
            <Ionicons name="camera-outline" size={16} color="#e0a800" />
            <Text style={styles.logEatenTxt}>אכלתי משהו אחר (צילום/חיפוש)</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// Swap chooser: type a dish you want, or get a fresh suggestion.
function SwapModal({ target, C, styles, onClose, onPick, onRandom }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  if (!target) return null;

  const search = async () => {
    if (!q.trim()) return;
    setBusy(true);
    try {
      const res = await searchMealRecipes(q.trim(), target.targetCalories);
      setResults(res?.recipes ?? []);
    } catch { Alert.alert('שגיאה', 'החיפוש נכשל'); }
    finally { setBusy(false); }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }}>
        <TouchableOpacity style={styles.swapOverlay} activeOpacity={1} onPress={onClose} />
        <View style={styles.swapSheet}>
          <View style={styles.swapHandle} />
          <Text style={styles.swapTitle}>החלפת {target.label}</Text>
          <Text style={styles.swapSub}>כתוב מה בא לך לאכול, ונתאים את הכמות ליעד הקלורי של הארוחה.</Text>

          <View style={styles.swapSearchRow}>
            <TouchableOpacity style={styles.swapSearchBtn} onPress={search}>
              {busy ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.swapSearchBtnTxt}>חפש</Text>}
            </TouchableOpacity>
            <TextInput
              style={styles.swapInput}
              placeholder="למשל: שקשוקה, סלט טונה, פסטה..."
              placeholderTextColor={C.placeholder}
              value={q}
              onChangeText={setQ}
              onSubmitEditing={search}
              returnKeyType="search"
              textAlign="right"
            />
          </View>

          <ScrollView style={{ maxHeight: 280 }} keyboardShouldPersistTaps="handled">
            {results.map((r, i) => {
              const n = r.total_nutrition ?? {};
              return (
                <TouchableOpacity key={i} style={styles.swapResult} onPress={() => onPick(r)}>
                  {r.image_url
                    ? <Image source={{ uri: r.image_url }} style={styles.swapThumb} />
                    : <View style={[styles.swapThumb, styles.thumbEmpty]}><Ionicons name="restaurant-outline" size={16} color={C.textMuted} /></View>}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.swapResultName} numberOfLines={1}>{r.name_he ?? r.name_en}</Text>
                    <Text style={styles.swapResultMacros}>{Math.round(n.calories ?? 0)} קק"ל · ח{Math.round(n.protein ?? 0)} פ{Math.round(n.carbs ?? 0)} ש{Math.round(n.fat ?? 0)}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity style={styles.swapRandomBtn} onPress={onRandom}>
            <Ionicons name="shuffle" size={16} color="#3a7a4a" />
            <Text style={styles.swapRandomTxt}>תן לי הצעה אחרת</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// "I ate something off-plan" — enter the calories to compensate for.
function OffPlanModal({ visible, C, styles, onClose, onConfirm }) {
  const [val, setVal] = useState('');
  if (!visible) return null;
  const kcal = parseInt(val, 10);
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }}>
        <TouchableOpacity style={styles.swapOverlay} activeOpacity={1} onPress={onClose} />
        <View style={styles.swapSheet}>
          <View style={styles.swapHandle} />
          <Text style={styles.swapTitle}>אכלתי משהו לא מתוכנן</Text>
          <Text style={styles.swapSub}>כמה קלוריות? נראה לך מאיזו ארוחה לקזז כדי להישאר על היעד.</Text>
          <TextInput
            style={styles.swapInput}
            placeholder='קלוריות (למשל 200)'
            placeholderTextColor={C.placeholder}
            value={val}
            onChangeText={setVal}
            keyboardType="numeric"
            textAlign="right"
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 12 }}>
            {[100, 150, 200, 300, 400].map(v => (
              <TouchableOpacity key={v} style={styles.offChip} onPress={() => setVal(String(v))}>
                <Text style={styles.offChipTxt}>{v}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={[styles.genBtn, { marginTop: 4, opacity: kcal > 0 ? 1 : 0.5 }]}
            disabled={!(kcal > 0)}
            onPress={() => { onConfirm(kcal); setVal(''); }}>
            <Text style={styles.genTxt}>המשך לקיזוז</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const WEEK_KEY = '@week_plan_v1';
const DAY_LETTERS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];  // Sun→Sat

export default function FullDayPlanScreen({ navigation, route }) {
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [week, setWeek] = useState(null);   // { days:[...], targets }
  const [sel, setSel] = useState(0);        // selected day index
  const [loading, setLoading] = useState(false);
  const [compensate, setCompensate] = useState(route?.params?.overage ?? 0);
  const [swapTarget, setSwapTarget] = useState(null);
  const [compInput, setCompInput] = useState(false);

  // Load the saved weekly plan on mount.
  useEffect(() => {
    AsyncStorage.getItem(WEEK_KEY)
      .then(v => { if (v) setWeek(JSON.parse(v)); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (route?.params?.overage) setCompensate(route.params.overage);
  }, [route?.params?.overage]);

  useEffect(() => {
    if (week) AsyncStorage.setItem(WEEK_KEY, JSON.stringify(week)).catch(() => {});
  }, [week]);

  const recomputeTotals = (planObj) => {
    const tot = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    Object.values(planObj ?? {}).forEach(m => {
      const n = m?.recipe?.total_nutrition ?? {};
      tot.calories += n.calories ?? 0; tot.protein += n.protein ?? 0;
      tot.carbs += n.carbs ?? 0; tot.fat += n.fat ?? 0;
    });
    return tot;
  };

  // Apply a mutation to the selected day's meals, recompute its totals.
  const updateDay = (mutatePlan) => setWeek(prev => {
    const days = [...prev.days];
    const d = days[sel];
    const newPlan = mutatePlan(d.plan);
    days[sel] = { ...d, plan: newPlan, totals: recomputeTotals(newPlan) };
    return { ...prev, days };
  });

  const replaceMeal = (mealKey, recipe) =>
    updateDay(p => ({ ...p, [mealKey]: { ...p[mealKey], recipe } }));

  // Shrink a meal's planned recipe by `kcal` so the day stays on target.
  const shrinkMealByCalories = (mealKey, kcal) => updateDay(p => {
    const meal = p[mealKey];
    const cal = meal?.recipe?.total_nutrition?.calories ?? 0;
    if (cal <= 0 || kcal <= 0) return p;
    const factor = Math.max(0.15, (cal - kcal) / cal);
    const r = meal.recipe;
    const scaledN = {};
    ['calories', 'protein', 'carbs', 'fat'].forEach(k => { scaledN[k] = Math.round((r.total_nutrition?.[k] ?? 0) * factor * 10) / 10; });
    const scaledIng = (r.ingredients ?? []).map(ing => ing.quantity
      ? { ...ing, quantity: Math.round(ing.quantity * factor), display_he: undefined } : ing);
    return { ...p, [mealKey]: { ...meal, recipe: { ...r, total_nutrition: scaledN, ingredients: scaledIng, _reduced: true } } };
  });

  const compensateMeal = (mealKey) => { shrinkMealByCalories(mealKey, compensate); setCompensate(0); };

  // Log food the user actually ate into a meal (camera/manual) → shrink that meal.
  const logEaten = (mealKey, label) =>
    openMealLog(mealKey, label, (kcal) => shrinkMealByCalories(mealKey, kcal));

  const generate = async (newSeed) => {
    setLoading(true);
    try {
      const res = await fetchWeeklyPlan(newSeed ?? Math.floor(Math.random() * 100000));
      setWeek(res); setSel(0);
    } catch {
      Alert.alert('שגיאה', 'לא הצלחתי לבנות תפריט. נסה שוב.');
    } finally { setLoading(false); }
  };

  const openSwap = (mealKey, targetCalories, currentId, label) =>
    setSwapTarget({ mealKey, targetCalories, currentId, label });
  const pickSwap = (recipe) => { if (swapTarget) replaceMeal(swapTarget.mealKey, recipe); setSwapTarget(null); };
  const randomSwap = async () => {
    if (!swapTarget) return;
    try {
      const res = await swapMeal(swapTarget.mealKey, swapTarget.targetCalories,
        swapTarget.currentId, Math.floor(Math.random() * 100000));
      if (res?.recipe) replaceMeal(swapTarget.mealKey, res.recipe);
    } catch { Alert.alert('שגיאה', 'לא הצלחתי להחליף מנה'); }
    finally { setSwapTarget(null); }
  };

  const day = week?.days?.[sel];
  const t = week?.targets ?? {};
  const tot = day?.totals ?? {};

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ width: 38 }} />
        <Text style={styles.title}>התפריט השבועי שלי</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Day selector — fixed 7-letter week row (Sun→Sat, RTL) */}
      {week && !loading && (
        <View style={styles.daysRow}>
          {week.days.map((d, i) => (
            <TouchableOpacity key={i} onPress={() => setSel(i)}
              style={[styles.dayChip, i === sel && styles.dayChipActive]}>
              <Text style={[styles.dayChipTxt, i === sel && styles.dayChipTxtActive]}>
                {DAY_LETTERS[i]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {!week && !loading && (
          <View style={styles.hero}>
            <View style={styles.heroIcon}><Ionicons name="restaurant" size={30} color="#3a7a4a" /></View>
            <Text style={styles.heroTitle}>תפריט שבועי מותאם אישית</Text>
            <Text style={styles.heroBody}>
              נבנה לך שבוע שלם — 7 ימים, כל יום עם בוקר, חטיפים, צהריים וערב — מדויק
              ליעדי הקלוריות והמאקרו שלך, לפי ההעדפות והאלרגיות. בלחיצה אחת.
            </Text>
          </View>
        )}

        {loading && (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#3a7a4a" />
            <Text style={styles.loadingTxt}>בונה תפריט שבועי מדויק...</Text>
          </View>
        )}

        {day && !loading && (
          <>
            {compensate > 0 && (
              <View style={styles.compBanner}>
                <Ionicons name="alert-circle" size={20} color="#e0a800" />
                <Text style={styles.compBannerTxt}>
                  אכלת {compensate} קק"ל מחוץ לתפריט. בחר ארוחה לקיזוז כדי להישאר על היעד.
                </Text>
              </View>
            )}
            <View style={styles.summary}>
              <Text style={styles.summaryTitle}>סיכום יום {day.day_name} מול היעד</Text>
              <StatBar label="קלוריות" value={tot.calories ?? 0} target={t.calories ?? 0} color="#3a7a4a" unit="" C={C} />
              {MACROS.map(m => (
                <StatBar key={m.key} label={m.label} value={tot[m.key] ?? 0} target={t[m.key] ?? 0} color={m.color} unit="g" C={C} />
              ))}
            </View>

            {compensate === 0 && (
              <TouchableOpacity style={styles.offPlanBtn} onPress={() => setCompInput(true)}>
                <Ionicons name="add-circle-outline" size={18} color="#e0a800" />
                <Text style={styles.offPlanTxt}>אכלתי משהו לא מתוכנן</Text>
              </TouchableOpacity>
            )}

            <View style={styles.mealsTable}>
              {MEAL_ORDER.map((m, idx) => (
                <MealCard key={m.key} label={m.label} mealKey={m.key} data={day.plan?.[m.key]} C={C} styles={styles}
                  last={idx === MEAL_ORDER.length - 1}
                  onSwap={openSwap} compensate={compensate} onCompensate={compensateMeal} onLogEaten={logEaten} />
              ))}
            </View>
          </>
        )}

        <TouchableOpacity style={styles.genBtn} onPress={() => generate()} disabled={loading}>
          <Ionicons name={week ? 'refresh' : 'sparkles-outline'} size={18} color="#fff" />
          <Text style={styles.genTxt}>{week ? 'בנה שבוע חדש' : 'בנה לי תפריט שבועי'}</Text>
        </TouchableOpacity>
      </ScrollView>

      <SwapModal target={swapTarget} C={C} styles={styles}
        onClose={() => setSwapTarget(null)} onPick={pickSwap} onRandom={randomSwap} />

      <OffPlanModal visible={compInput} C={C} styles={styles}
        onClose={() => setCompInput(false)}
        onConfirm={(kcal) => { setCompInput(false); setCompensate(kcal); }} />
    </View>
  );
}

const makeStyles = (C) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 54, paddingHorizontal: 12, paddingBottom: 12 },
  title: { color: C.text, fontSize: 20, fontWeight: '800' },

  daysRow: { flexDirection: 'row-reverse', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  dayChip: { flex: 1, aspectRatio: 1, maxWidth: 46, borderRadius: 12, borderWidth: 1,
    borderColor: C.border, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  dayChipActive: { backgroundColor: '#3a7a4a', borderColor: '#3a7a4a' },
  dayChipTxt: { color: C.textMuted, fontSize: 16, fontWeight: '800' },
  dayChipTxtActive: { color: '#fff' },

  hero: { alignItems: 'center', paddingVertical: 30, paddingHorizontal: 12 },
  heroIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#3a7a4a22',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  heroTitle: { color: C.text, fontSize: 20, fontWeight: '800', marginBottom: 10, textAlign: 'center' },
  heroBody: { color: C.textMuted, fontSize: 15, lineHeight: 23, textAlign: 'center' },

  loading: { alignItems: 'center', paddingVertical: 60 },
  loadingTxt: { color: C.textMuted, fontSize: 15, marginTop: 14 },

  compBanner: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, backgroundColor: '#e0a80018',
    borderWidth: 1, borderColor: '#e0a80055', borderRadius: 14, padding: 12, marginBottom: 14 },
  compBannerTxt: { color: C.text, fontSize: 13.5, fontWeight: '600', flex: 1, textAlign: 'right', lineHeight: 19 },
  compensateBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#e0a800', paddingVertical: 9 },
  compensateTxt: { color: '#fff', fontSize: 13.5, fontWeight: '800' },
  summary: { backgroundColor: C.surface, borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: C.border },
  summaryTitle: { color: C.text, fontSize: 15, fontWeight: '800', textAlign: 'right', marginBottom: 14 },

  mealsTable: { backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border,
    overflow: 'hidden', marginBottom: 4 },
  mealRow: { borderBottomWidth: 1, borderBottomColor: C.border },
  mealHead: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, paddingVertical: 11, paddingHorizontal: 12 },
  mealCalCol: { alignItems: 'center', minWidth: 46 },
  mealCalNum: { color: '#3a7a4a', fontSize: 17, fontWeight: '800' },
  mealCalUnit: { color: C.textFaint, fontSize: 10, fontWeight: '600' },
  mealThumb: { width: 46, height: 46, borderRadius: 10 },
  thumbEmpty: { backgroundColor: C.surface2, alignItems: 'center', justifyContent: 'center' },
  mealLabel: { color: '#3a7a4a', fontSize: 11.5, fontWeight: '800', textAlign: 'right' },
  mealName: { color: C.text, fontSize: 15, fontWeight: '700', textAlign: 'right', marginTop: 1 },
  mealMacros: { color: C.textMuted, fontSize: 11.5, textAlign: 'right', marginTop: 2 },

  mealBody: { paddingHorizontal: 14, paddingBottom: 14, paddingTop: 2 },
  bodyTitle: { color: C.text, fontSize: 13, fontWeight: '800', textAlign: 'right', marginBottom: 8 },
  ingRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 5 },
  ingDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#3a7a4a' },
  ingTxt: { color: C.textMuted, fontSize: 14, flex: 1, textAlign: 'right' },
  instr: { color: C.textMuted, fontSize: 14, lineHeight: 21, textAlign: 'right' },
  mealActions: { flexDirection: 'row-reverse', gap: 8, marginTop: 14 },
  ateBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#3a7a4a', borderRadius: 12, paddingVertical: 11 },
  ateBtnDone: { backgroundColor: '#3a7a4a22' },
  ateTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },
  swapBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: '#3a7a4a', minWidth: 110 },
  swapTxt: { color: '#3a7a4a', fontSize: 13.5, fontWeight: '700' },
  logEatenBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, marginTop: 8, borderRadius: 12, borderWidth: 1, borderColor: '#e0a80088',
    backgroundColor: '#e0a80010' },
  logEatenTxt: { color: '#e0a800', fontSize: 13.5, fontWeight: '700' },

  genBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#3a7a4a', borderRadius: 16, paddingVertical: 16, marginTop: 8 },
  genTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },

  swapOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  swapSheet: { backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 18, paddingBottom: 32 },
  swapHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 14 },
  swapTitle: { color: C.text, fontSize: 18, fontWeight: '800', textAlign: 'right' },
  swapSub: { color: C.textMuted, fontSize: 13.5, textAlign: 'right', marginTop: 4, marginBottom: 14, lineHeight: 19 },
  swapSearchRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  swapSearchBtn: { backgroundColor: '#3a7a4a', borderRadius: 12, paddingHorizontal: 18, justifyContent: 'center' },
  swapSearchBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
  swapInput: { flex: 1, backgroundColor: C.surface, borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 12, color: C.text, fontSize: 15, borderWidth: 1, borderColor: C.border },
  swapResult: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: C.border },
  swapThumb: { width: 46, height: 46, borderRadius: 10 },
  swapResultName: { color: C.text, fontSize: 15, fontWeight: '700', textAlign: 'right' },
  swapResultMacros: { color: C.textMuted, fontSize: 12, textAlign: 'right', marginTop: 2 },
  swapRandomBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 13, marginTop: 14, borderRadius: 12, borderWidth: 1, borderColor: '#3a7a4a' },
  swapRandomTxt: { color: '#3a7a4a', fontSize: 14.5, fontWeight: '700' },
  offPlanBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 7,
    paddingVertical: 13, marginBottom: 12, borderRadius: 14, borderWidth: 1, borderColor: '#e0a80088',
    backgroundColor: '#e0a80012' },
  offPlanTxt: { color: '#e0a800', fontSize: 14.5, fontWeight: '800' },
  offChip: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 18, borderWidth: 1,
    borderColor: C.border, backgroundColor: C.surface, marginLeft: 8 },
  offChipTxt: { color: C.text, fontSize: 14, fontWeight: '700' },
});
