import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Image, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { fetchFoodLogSummary, fetchFoodLog, fetchWater, addWater, fetchProfileTargets, deleteFoodEntry, fetchWorkoutSummary } from '../api/client';
import HistoryScreen from './HistoryScreen';

const MEAL_LABELS = {
  BREAKFAST:       'ארוחת בוקר',   breakfast: 'ארוחת בוקר',
  MORNING_SNACK:   'חטיף בוקר',   morning_snack: 'חטיף בוקר',
  LUNCH:           'ארוחת צהריים', lunch: 'ארוחת צהריים',
  AFTERNOON_SNACK: 'חטיף אחה"צ',  afternoon_snack: 'חטיף אחה"צ',
  DINNER:          'ארוחת ערב',   dinner: 'ארוחת ערב',
  EVENING_SNACK:   'חטיף ערב',    evening_snack: 'חטיף ערב',
};

const MEAL_COLORS = {
  BREAKFAST:       '#f97316',   breakfast: '#f97316',
  MORNING_SNACK:   '#84cc16',   morning_snack: '#84cc16',
  LUNCH:           '#4F8EF7',   lunch: '#4F8EF7',
  AFTERNOON_SNACK: '#a855f7',   afternoon_snack: '#a855f7',
  DINNER:          '#ec4899',   dinner: '#ec4899',
  EVENING_SNACK:   '#14b8a6',   evening_snack: '#14b8a6',
};

function ProgressRing({ size = 90, pct = 0, color = '#4F8EF7', label, sub }) {
  const filled = Math.round(pct * 100);
  return (
    <View style={[styles.ringWrap, { width: size, height: size }]}>
      <View style={[styles.ringBg, { width: size, height: size, borderRadius: size / 2, borderColor: '#1e1e1e' }]} />
      <View style={[styles.ringFg, {
        width: size - 14, height: size - 14,
        borderRadius: (size - 14) / 2,
        borderColor: color,
        borderTopColor: filled > 75 ? color : '#111',
        borderRightColor: filled > 50 ? color : '#111',
        borderBottomColor: filled > 25 ? color : '#111',
        borderLeftColor: filled > 0 ? color : '#111',
        transform: [{ rotate: `${filled * 3.6}deg` }],
      }]} />
      <View style={styles.ringCenter}>
        {label ? <Text style={[styles.ringLabel, { color }]}>{label}</Text> : null}
        {sub ? <Text style={styles.ringSub}>{sub}</Text> : null}
      </View>
    </View>
  );
}

function MacroCard({ label, eaten, target, color }) {
  const pct = target > 0 ? Math.min(eaten / target, 1) : 0;
  const left = Math.max(Math.round((target ?? 0) - (eaten ?? 0)), 0);
  return (
    <View style={styles.macroCard}>
      <ProgressRing size={72} pct={pct} color={color} label={`${Math.round(pct * 100)}%`} />
      <Text style={styles.macroVal}>{left}g</Text>
      <Text style={styles.macroSub}>נותר</Text>
      <Text style={[styles.macroName, { color }]}>{label}</Text>
    </View>
  );
}

function FoodLogRow({ entry, onDelete }) {
  const [deleting, setDeleting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const mealColor = MEAL_COLORS[entry.meal_type] ?? '#4F8EF7';
  const mealLabel = MEAL_LABELS[entry.meal_type] ?? entry.meal_type;
  const time = entry.timestamp
    ? new Date(entry.timestamp).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
    : '';

  const handleDelete = () => {
    Alert.alert('מחיקת ארוחה', `למחוק את "${entry.food_name}"?`, [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'מחק', style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await deleteFoodEntry(entry.entry_id);
            onDelete(entry.entry_id);
          } catch {
            Alert.alert('שגיאה', 'לא הצלחתי למחוק');
          } finally { setDeleting(false); }
        },
      },
    ]);
  };

  const MACROS = [
    { label: 'חלבון', val: entry.protein, color: '#4F8EF7' },
    { label: 'פחמימות', val: entry.carbs, color: '#ffd700' },
    { label: 'שומן', val: entry.fat, color: '#ff6b6b' },
  ];

  return (
    <View style={styles.logItem}>
      <View style={styles.logRow}>
        {/* Color dot */}
        <View style={[styles.logDot, { backgroundColor: mealColor }]} />

        {/* Tappable area → toggles macro breakdown */}
        <TouchableOpacity style={styles.logTapArea} activeOpacity={0.7} onPress={() => setExpanded(e => !e)}>
          {entry.image_url ? (
            <Image source={{ uri: entry.image_url }} style={styles.logThumb} resizeMode="cover" />
          ) : (
            <View style={[styles.logThumb, { backgroundColor: mealColor + '22', justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="restaurant-outline" size={18} color={mealColor} />
            </View>
          )}

          <View style={styles.logInfo}>
            <Text style={styles.logName} numberOfLines={1}>{entry.food_name}</Text>
            <Text style={[styles.logMeal, { color: mealColor }]}>{mealLabel}{time ? ` · ${time}` : ''}</Text>
          </View>

          <View style={styles.logCalWrap}>
            <Text style={[styles.logCal, { color: mealColor }]}>{Math.round(entry.calories ?? 0)}</Text>
            <Text style={styles.logCalLbl}>קק"ל</Text>
          </View>

          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color="#555" />
        </TouchableOpacity>

        {/* Delete button */}
        <TouchableOpacity onPress={handleDelete} disabled={deleting} style={styles.logDeleteBtn}>
          {deleting
            ? <ActivityIndicator size="small" color="#ff4444" />
            : <Ionicons name="trash-outline" size={16} color="#444" />
          }
        </TouchableOpacity>
      </View>

      {/* Expanded macro breakdown */}
      {expanded && (
        <View style={styles.macroPanel}>
          <View style={styles.macroBox}>
            <Text style={styles.macroVal}>{Math.round(entry.grams ?? 0)}g</Text>
            <Text style={styles.macroLbl}>כמות</Text>
          </View>
          {MACROS.map(m => (
            <View key={m.label} style={styles.macroBox}>
              <Text style={[styles.macroVal, { color: m.color }]}>{Math.round((m.val ?? 0) * 10) / 10}g</Text>
              <Text style={styles.macroLbl}>{m.label}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function DashboardScreen() {
  const [summary, setSummary]   = useState({ calories: 0, protein: 0, carbs: 0, fat: 0, entries: 0 });
  const [targets, setTargets]   = useState({ calories: 2000, protein: 150, carbs: 250, fat: 67 });
  const [water, setWater]       = useState({ total_ml: 0, goal_ml: 2000 });
  const [todayEntries, setTodayEntries] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [burned, setBurned] = useState(0);

  const load = useCallback(async () => {
    try {
      const [s, t, w, logData, ws] = await Promise.all([
        fetchFoodLogSummary().catch(() => ({ calories: 0, protein: 0, carbs: 0, fat: 0, entries: 0 })),
        fetchProfileTargets().catch(() => ({ calories: 2000, protein: 150, carbs: 250, fat: 67 })),
        fetchWater().catch(() => ({ total_ml: 0, goal_ml: 2000 })),
        fetchFoodLog().catch(() => ({ entries: [] })),
        fetchWorkoutSummary().catch(() => ({ calories_burned: 0 })),
      ]);
      setSummary(s); setTargets(t); setWater(w); setBurned(ws?.calories_burned ?? 0);
      const entries = logData?.entries ?? [];
      const sorted = [...entries].sort((a, b) =>
        new Date(b.timestamp ?? 0) - new Date(a.timestamp ?? 0)
      );
      setTodayEntries(sorted);
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#4F8EF7" /></View>;

  const cal      = summary?.calories ?? 0;
  const calTarget = targets?.calories ?? 2000;
  // Exercise adds to the daily budget (eat-back), so remaining = target + burned − eaten.
  const adjustedTarget = calTarget + burned;
  const calLeft  = Math.max(adjustedTarget - cal, 0);
  const calPct   = adjustedTarget > 0 ? Math.min(cal / adjustedTarget, 1) : 0;
  const totalMl  = water?.total_ml ?? 0;
  const goalMl   = water?.goal_ml ?? 2000;
  const glasses  = Math.round(totalMl / 250);
  const goalGlasses = Math.round(goalMl / 250);
  const date     = new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <ScrollView style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#4F8EF7" />}>

      <View style={styles.header}>
        <TouchableOpacity style={styles.histBtn} onPress={() => setShowHistory(true)}>
          <Ionicons name="calendar-outline" size={20} color="#4F8EF7" />
          <Text style={styles.histBtnTxt}>היסטוריה</Text>
        </TouchableOpacity>
        <Text style={styles.logo}>BiteFit</Text>
      </View>
      <Text style={styles.dateSub}>{date}</Text>

      <HistoryScreen visible={showHistory} onClose={() => setShowHistory(false)} />

      {/* Calorie card */}
      <View style={styles.calCard}>
        <View style={styles.calInfo}>
          <Text style={styles.calNum}>{calLeft.toLocaleString()}</Text>
          <Text style={styles.calLbl}>קלוריות נותרות</Text>
          <View style={styles.calRow}>
            <View style={styles.calItem}><Text style={styles.calVal}>{calTarget.toLocaleString()}</Text><Text style={styles.calSub}>יעד</Text></View>
            <View style={styles.calItem}><Text style={[styles.calVal, { color: '#4CAF50' }]}>{cal}</Text><Text style={styles.calSub}>אכלת</Text></View>
            <View style={styles.calItem}><Text style={[styles.calVal, { color: '#ff6b6b' }]}>{burned.toLocaleString()}</Text><Text style={styles.calSub}>שרפת</Text></View>
          </View>
        </View>
        <ProgressRing size={110} pct={calPct} color="#ff6b6b"
          label={`${Math.round(calPct * 100)}%`} sub="מיעד" />
      </View>

      {/* Macros */}
      <View style={styles.macrosRow}>
        <MacroCard label="שומן"     eaten={summary?.fat ?? 0}    target={targets?.fat ?? 67}    color="#ffd700" />
        <MacroCard label="פחמימות" eaten={summary?.carbs ?? 0}   target={targets?.carbs ?? 250}  color="#ff6b6b" />
        <MacroCard label="חלבון"   eaten={summary?.protein ?? 0} target={targets?.protein ?? 150} color="#4F8EF7" />
      </View>

      {/* Water */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>מים — היום</Text>
          <Text style={styles.waterMl}>{totalMl}ml / {goalMl}ml</Text>
        </View>
        <View style={styles.glassesRow}>
          {Array.from({ length: goalGlasses }).map((_, i) => (
            <Ionicons key={i} name={i < glasses ? 'water' : 'water-outline'} size={22}
              color={i < glasses ? '#4F8EF7' : '#2a2a2a'} style={{ marginHorizontal: 2 }} />
          ))}
        </View>
        <View style={styles.waterBtns}>
          {[250, 500, 750, 1000].map(ml => (
            <TouchableOpacity key={ml} style={styles.waterBtn}
              onPress={async () => { await addWater(ml).catch(() => {}); setWater(w => ({ ...w, total_ml: (w.total_ml ?? 0) + ml })); }}>
              <Text style={styles.waterBtnTxt}>+{ml >= 1000 ? '1L' : `${ml}ml`}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Today's food log */}
      <View style={[styles.card, { marginBottom: 28 }]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>יומן אכילה היום</Text>
          <Text style={styles.waterMl}>{todayEntries.length} ארוחות</Text>
        </View>
        {todayEntries.length === 0
          ? <Text style={styles.empty}>לא נרשמו ארוחות היום</Text>
          : todayEntries.map((e, i) => (
              <FoodLogRow
                key={e.entry_id ?? i}
                entry={e}
                onDelete={(id) => {
                  setTodayEntries(prev => prev.filter(x => x.entry_id !== id));
                  setSummary(prev => {
                    const deleted = todayEntries.find(x => x.entry_id === id);
                    if (!deleted) return prev;
                    return {
                      ...prev,
                      calories: Math.max(0, (prev.calories ?? 0) - (deleted.calories ?? 0)),
                      protein:  Math.max(0, (prev.protein  ?? 0) - (deleted.protein  ?? 0)),
                      carbs:    Math.max(0, (prev.carbs    ?? 0) - (deleted.carbs    ?? 0)),
                      fat:      Math.max(0, (prev.fat      ?? 0) - (deleted.fat      ?? 0)),
                      entries:  Math.max(0, (prev.entries  ?? 1) - 1),
                    };
                  });
                }}
              />
            ))
        }
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 2 },
  date: { color: '#666', fontSize: 13 },
  dateSub: { color: '#666', fontSize: 13, textAlign: 'right', paddingHorizontal: 16, paddingBottom: 10 },
  logo: { fontSize: 20, fontWeight: '800', color: '#4F8EF7' },
  histBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#141414', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: '#1e2a44' },
  histBtnTxt: { color: '#4F8EF7', fontSize: 13, fontWeight: '700' },

  calCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#141414', borderRadius: 20, margin: 16, marginTop: 4, padding: 20 },
  calInfo: { flex: 1, paddingRight: 12 },
  calNum: { color: '#fff', fontSize: 38, fontWeight: '800' },
  calLbl: { color: '#888', fontSize: 13, marginBottom: 14 },
  calRow: { flexDirection: 'row', gap: 20 },
  calItem: {},
  calVal: { color: '#fff', fontSize: 15, fontWeight: '700' },
  calSub: { color: '#666', fontSize: 11, marginTop: 2 },

  ringWrap: { justifyContent: 'center', alignItems: 'center' },
  ringBg: { borderWidth: 9, position: 'absolute' },
  ringFg: { borderWidth: 9, position: 'absolute' },
  ringCenter: { justifyContent: 'center', alignItems: 'center' },
  ringLabel: { fontSize: 14, fontWeight: '800' },
  ringSub: { color: '#888', fontSize: 10 },

  macrosRow: { flexDirection: 'row', marginHorizontal: 16, gap: 10, marginBottom: 12 },
  macroCard: { flex: 1, backgroundColor: '#141414', borderRadius: 16, padding: 12, alignItems: 'center', gap: 3 },
  macroVal: { color: '#fff', fontSize: 15, fontWeight: '700' },
  macroSub: { color: '#666', fontSize: 10 },
  macroName: { fontSize: 12, fontWeight: '700' },

  card: { backgroundColor: '#141414', borderRadius: 20, margin: 16, marginTop: 4, padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  waterMl: { color: '#666', fontSize: 12 },
  glassesRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  waterBtns: { flexDirection: 'row', gap: 8 },
  waterBtn: { flex: 1, backgroundColor: '#1e1e1e', borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#2a2a2a' },
  waterBtnTxt: { color: '#4F8EF7', fontSize: 13, fontWeight: '700' },
  empty: { color: '#444', fontSize: 14 },

  // Food log row
  logItem: { borderBottomWidth: 1, borderBottomColor: '#1e1e1e' },
  logRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  logTapArea: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  logDot: { width: 4, height: 38, borderRadius: 2 },
  logThumb: { width: 40, height: 40, borderRadius: 10 },
  logInfo: { flex: 1 },
  logName: { color: '#fff', fontSize: 14, fontWeight: '600', textAlign: 'right' },
  logMeal: { fontSize: 11, marginTop: 2, textAlign: 'right' },
  logCalWrap: { alignItems: 'center', minWidth: 42 },
  logCal: { fontSize: 15, fontWeight: '800' },
  logCalLbl: { color: '#666', fontSize: 10 },
  logDeleteBtn: { padding: 8, marginLeft: 2 },
  macroPanel: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#101010', borderRadius: 12, paddingVertical: 12, marginBottom: 10, marginHorizontal: 4 },
  macroBox: { alignItems: 'center' },
  macroVal: { color: '#fff', fontSize: 15, fontWeight: '800' },
  macroLbl: { color: '#777', fontSize: 11, marginTop: 3 },
});
