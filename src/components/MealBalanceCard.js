import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchMealBalance, moveMealCalories, resetMealBalance } from '../api/client';
import { onDataChanged } from '../refreshBus';

const MEAL_LABELS = {
  BREAKFAST: 'בוקר',
  MORNING_SNACK: 'חטיף בוקר',
  LUNCH: 'צהריים',
  AFTERNOON_SNACK: 'חטיף אחה״צ',
  DINNER: 'ערב',
};

export default function MealBalanceCard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pickFrom, setPickFrom] = useState(null); // ארוחת המקור שבחרנו להעביר ממנה

  const load = useCallback(async () => {
    try { setData(await fetchMealBalance()); } catch (_) {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => onDataChanged(load), [load]);

  const move = async (fromMeal, toMeal, amount) => {
    setPickFrom(null);
    try { setData(await moveMealCalories(fromMeal, toMeal, amount)); } catch (_) {}
  };

  const reset = async () => {
    try { setData(await resetMealBalance()); } catch (_) {}
  };

  if (loading) {
    return <View style={s.card}><ActivityIndicator color="#4F8EF7" /></View>;
  }
  if (!data?.meals) return null;

  const hasAdjustments = data.meals.some(m => m.adjustment !== 0);

  return (
    <View style={s.card}>
      <View style={s.header}>
        {hasAdjustments && (
          <TouchableOpacity onPress={reset} style={s.resetBtn}>
            <Text style={s.resetTxt}>איפוס</Text>
          </TouchableOpacity>
        )}
        <Text style={s.title}>מאזן יומי</Text>
      </View>

      {data.meals.map((m) => {
        const pct = m.target > 0 ? Math.min(100, Math.round((m.eaten / m.target) * 100)) : 0;
        const short = m.remaining > 0 && m.eaten > 0;   // אכל אבל חסר
        const over  = m.remaining < 0;                   // אכל יותר מהיעד
        const barColor = over ? '#ff6b6b' : (m.eaten >= m.target && m.target > 0 ? '#4CAF50' : '#4F8EF7');
        return (
          <View key={m.meal} style={s.row}>
            <View style={s.rowTop}>
              {/* פעולת איזון */}
              {(short || over) ? (
                <TouchableOpacity onPress={() => setPickFrom(pickFrom === m.meal ? null : m.meal)}>
                  <Text style={s.balanceLink}>
                    {over ? `עברת ב-${-m.remaining} →` : `חסר ${m.remaining} →`}
                  </Text>
                </TouchableOpacity>
              ) : <View />}
              <Text style={s.mealName}>
                {MEAL_LABELS[m.meal] || m.meal}
                {m.adjustment !== 0 && (
                  <Text style={s.adjTag}>{m.adjustment > 0 ? ` +${m.adjustment}` : ` ${m.adjustment}`}</Text>
                )}
              </Text>
            </View>

            <View style={s.barWrap}>
              <View style={[s.bar, { width: `${pct}%`, backgroundColor: barColor }]} />
            </View>
            <Text style={s.nums}>{m.eaten} / {m.target} קק״ל</Text>

            {/* בורר ארוחת יעד להעברת ההפרש */}
            {pickFrom === m.meal && (
              <View style={s.picker}>
                <Text style={s.pickerHint}>
                  {over ? 'הורד את העודף מ:' : 'השלם את החוסר ב:'}
                </Text>
                <View style={s.pickerRow}>
                  {data.meals.filter(x => x.meal !== m.meal).map(x => (
                    <TouchableOpacity key={x.meal} style={s.pickChip}
                      onPress={() => move(m.meal, x.meal, m.remaining)}>
                      <Text style={s.pickChipTxt}>{MEAL_LABELS[x.meal] || x.meal}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        );
      })}

      <Text style={s.footer}>
        סה״כ היום: {data.daily_eaten} / {data.daily_target} קק״ל
        {data.daily_remaining > 0 ? ` · נותרו ${data.daily_remaining}` : ''}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: '#141414', borderRadius: 16, padding: 16, marginBottom: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title: { color: '#fff', fontSize: 17, fontWeight: '800', textAlign: 'right' },
  resetBtn: { paddingVertical: 2 },
  resetTxt: { color: '#666', fontSize: 13 },

  row: { marginBottom: 14 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  mealName: { color: '#fff', fontSize: 14, fontWeight: '700', textAlign: 'right' },
  adjTag: { color: '#A8E063', fontSize: 12, fontWeight: '700' },
  balanceLink: { color: '#4F8EF7', fontSize: 13, fontWeight: '700' },

  barWrap: { height: 8, backgroundColor: '#1e1e1e', borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
  bar: { height: '100%', borderRadius: 4 },
  nums: { color: '#888', fontSize: 12, textAlign: 'right' },

  picker: { marginTop: 8, backgroundColor: '#1a1a1a', borderRadius: 10, padding: 10 },
  pickerHint: { color: '#aaa', fontSize: 12, textAlign: 'right', marginBottom: 8 },
  pickerRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  pickChip: { backgroundColor: '#2a2a2a', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 7 },
  pickChipTxt: { color: '#4F8EF7', fontSize: 13, fontWeight: '600' },

  footer: { color: '#aaa', fontSize: 13, textAlign: 'right', marginTop: 4, fontWeight: '600' },
});
