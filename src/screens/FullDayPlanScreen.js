import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Image,
  ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchFullDayPlan, addFoodEntry } from '../api/client';
import { useTheme } from '../context/ThemeContext';

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

function MealCard({ label, mealKey, data, C, styles }) {
  const [open, setOpen] = useState(false);
  const [ate, setAte] = useState(false);
  const recipe = data?.recipe;
  if (!recipe) return null;
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
    <View style={styles.mealCard}>
      <TouchableOpacity style={styles.mealHead} activeOpacity={0.8} onPress={() => setOpen(o => !o)}>
        {recipe.image_url
          ? <Image source={{ uri: recipe.image_url }} style={styles.mealThumb} />
          : <View style={[styles.mealThumb, styles.thumbEmpty]}><Ionicons name="restaurant-outline" size={20} color={C.textMuted} /></View>}
        <View style={{ flex: 1 }}>
          <Text style={styles.mealLabel}>{label}</Text>
          <Text style={styles.mealName} numberOfLines={1}>{recipe.name_he ?? recipe.name_en}</Text>
          <Text style={styles.mealMacros}>
            {Math.round(n.calories ?? 0)} קק"ל · ח{Math.round(n.protein ?? 0)} פ{Math.round(n.carbs ?? 0)} ש{Math.round(n.fat ?? 0)}
          </Text>
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={C.textMuted} />
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
          <TouchableOpacity style={[styles.ateBtn, ate && styles.ateBtnDone]} onPress={logMeal}>
            <Ionicons name={ate ? 'checkmark-circle' : 'add-circle-outline'} size={16} color={ate ? '#56bd6b' : '#fff'} />
            <Text style={[styles.ateTxt, ate && { color: '#56bd6b' }]}>{ate ? 'נרשם ביומן' : 'הוסף ליומן'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function FullDayPlanScreen({ navigation }) {
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async (newSeed) => {
    setLoading(true);
    try {
      const res = await fetchFullDayPlan(newSeed ?? Math.floor(Math.random() * 100000));
      setPlan(res);
    } catch {
      Alert.alert('שגיאה', 'לא הצלחתי לבנות תפריט. נסה שוב.');
    } finally { setLoading(false); }
  };

  const t = plan?.targets ?? {};
  const tot = plan?.totals ?? {};

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {navigation && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 6 }}>
            <Ionicons name="chevron-forward" size={26} color={C.text} />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>תפריט היום שלי</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {!plan && !loading && (
          <View style={styles.hero}>
            <View style={styles.heroIcon}><Ionicons name="restaurant" size={30} color="#3a7a4a" /></View>
            <Text style={styles.heroTitle}>תפריט יום מותאם אישית</Text>
            <Text style={styles.heroBody}>
              נבנה לך יום שלם — בוקר, חטיפים, צהריים וערב — שמדויק ליעדי הקלוריות
              והמאקרו שלך, לפי ההעדפות והאלרגיות שלך. בלחיצה אחת.
            </Text>
          </View>
        )}

        {loading && (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#3a7a4a" />
            <Text style={styles.loadingTxt}>בונה תפריט מדויק...</Text>
          </View>
        )}

        {plan && !loading && (
          <>
            {/* Day summary — the precision showcase */}
            <View style={styles.summary}>
              <Text style={styles.summaryTitle}>סיכום היום מול היעד</Text>
              <StatBar label="קלוריות" value={tot.calories ?? 0} target={t.calories ?? 0} color="#3a7a4a" unit="" C={C} />
              {MACROS.map(m => (
                <StatBar key={m.key} label={m.label} value={tot[m.key] ?? 0} target={t[m.key] ?? 0} color={m.color} unit="g" C={C} />
              ))}
            </View>

            {MEAL_ORDER.map(m => (
              <MealCard key={m.key} label={m.label} mealKey={m.key} data={plan.plan?.[m.key]} C={C} styles={styles} />
            ))}
          </>
        )}

        <TouchableOpacity style={styles.genBtn} onPress={() => generate()} disabled={loading}>
          <Ionicons name={plan ? 'refresh' : 'sparkles-outline'} size={18} color="#fff" />
          <Text style={styles.genTxt}>{plan ? 'צור תפריט אחר' : 'צור לי תפריט'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const makeStyles = (C) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 54, paddingHorizontal: 12, paddingBottom: 12 },
  title: { color: C.text, fontSize: 20, fontWeight: '800' },

  hero: { alignItems: 'center', paddingVertical: 30, paddingHorizontal: 12 },
  heroIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#3a7a4a22',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  heroTitle: { color: C.text, fontSize: 20, fontWeight: '800', marginBottom: 10, textAlign: 'center' },
  heroBody: { color: C.textMuted, fontSize: 15, lineHeight: 23, textAlign: 'center' },

  loading: { alignItems: 'center', paddingVertical: 60 },
  loadingTxt: { color: C.textMuted, fontSize: 15, marginTop: 14 },

  summary: { backgroundColor: C.surface, borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: C.border },
  summaryTitle: { color: C.text, fontSize: 15, fontWeight: '800', textAlign: 'right', marginBottom: 14 },

  mealCard: { backgroundColor: C.surface, borderRadius: 16, marginBottom: 10, borderWidth: 1,
    borderColor: C.border, overflow: 'hidden' },
  mealHead: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, padding: 12 },
  mealThumb: { width: 54, height: 54, borderRadius: 12 },
  thumbEmpty: { backgroundColor: C.surface2, alignItems: 'center', justifyContent: 'center' },
  mealLabel: { color: '#3a7a4a', fontSize: 12, fontWeight: '700', textAlign: 'right' },
  mealName: { color: C.text, fontSize: 15, fontWeight: '700', textAlign: 'right', marginTop: 1 },
  mealMacros: { color: C.textMuted, fontSize: 12, textAlign: 'right', marginTop: 2 },

  mealBody: { paddingHorizontal: 14, paddingBottom: 14, paddingTop: 2 },
  bodyTitle: { color: C.text, fontSize: 13, fontWeight: '800', textAlign: 'right', marginBottom: 8 },
  ingRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 5 },
  ingDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#3a7a4a' },
  ingTxt: { color: C.textMuted, fontSize: 14, flex: 1, textAlign: 'right' },
  instr: { color: C.textMuted, fontSize: 14, lineHeight: 21, textAlign: 'right' },
  ateBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#3a7a4a', borderRadius: 12, paddingVertical: 11, marginTop: 14 },
  ateBtnDone: { backgroundColor: '#3a7a4a22' },
  ateTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },

  genBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#3a7a4a', borderRadius: 16, paddingVertical: 16, marginTop: 8 },
  genTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
