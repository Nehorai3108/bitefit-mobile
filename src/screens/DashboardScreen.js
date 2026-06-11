import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchFoodLogSummary, fetchWater, addWater, fetchProfileTargets } from '../api/client';

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

export default function DashboardScreen() {
  const [summary, setSummary] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0, entries: 0 });
  const [targets, setTargets] = useState({ calories: 2000, protein: 150, carbs: 250, fat: 67 });
  const [water, setWater] = useState({ total_ml: 0, goal_ml: 2000 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, t, w] = await Promise.all([
        fetchFoodLogSummary().catch(() => ({ calories: 0, protein: 0, carbs: 0, fat: 0, entries: 0 })),
        fetchProfileTargets().catch(() => ({ calories: 2000, protein: 150, carbs: 250, fat: 67 })),
        fetchWater().catch(() => ({ total_ml: 0, goal_ml: 2000 })),
      ]);
      setSummary(s); setTargets(t); setWater(w);
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#4F8EF7" /></View>;

  const cal = summary?.calories ?? 0;
  const calTarget = targets?.calories ?? 2000;
  const calLeft = Math.max(calTarget - cal, 0);
  const calPct = calTarget > 0 ? Math.min(cal / calTarget, 1) : 0;
  const totalMl = water?.total_ml ?? 0;
  const goalMl = water?.goal_ml ?? 2000;
  const glasses = Math.round(totalMl / 250);
  const goalGlasses = Math.round(goalMl / 250);
  const date = new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <ScrollView style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#4F8EF7" />}>

      <View style={styles.header}>
        <Text style={styles.date}>{date}</Text>
        <Text style={styles.logo}>BiteFit</Text>
      </View>

      {/* Calorie card */}
      <View style={styles.calCard}>
        <View style={styles.calInfo}>
          <Text style={styles.calNum}>{calLeft.toLocaleString()}</Text>
          <Text style={styles.calLbl}>קלוריות נותרות</Text>
          <View style={styles.calRow}>
            <View style={styles.calItem}><Text style={styles.calVal}>{calTarget.toLocaleString()}</Text><Text style={styles.calSub}>יעד</Text></View>
            <View style={styles.calItem}><Text style={[styles.calVal, {color:'#4CAF50'}]}>{cal}</Text><Text style={styles.calSub}>אכלת</Text></View>
            <View style={styles.calItem}><Text style={[styles.calVal, {color:'#ff6b6b'}]}>0</Text><Text style={styles.calSub}>שרפת</Text></View>
          </View>
        </View>
        <ProgressRing size={110} pct={calPct} color="#ff6b6b"
          label={`${Math.round(calPct * 100)}%`} sub="מיעד" />
      </View>

      {/* Macros */}
      <View style={styles.macrosRow}>
        <MacroCard label="שומן"     eaten={summary?.fat ?? 0}     target={targets?.fat ?? 67}    color="#ffd700" />
        <MacroCard label="פחמימות" eaten={summary?.carbs ?? 0}    target={targets?.carbs ?? 250}  color="#ff6b6b" />
        <MacroCard label="חלבון"   eaten={summary?.protein ?? 0}  target={targets?.protein ?? 150} color="#4F8EF7" />
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

      {/* Food log summary */}
      <View style={[styles.card, { marginBottom: 28 }]}>
        <Text style={styles.cardTitle}>אחרון שנרשם</Text>
        {(summary?.entries ?? 0) === 0
          ? <Text style={styles.empty}>לא נרשמו ארוחות</Text>
          : <Text style={styles.logInfo}>{summary.entries} ארוחות · {cal} קק"ל</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12 },
  date: { color: '#666', fontSize: 13 },
  logo: { fontSize: 20, fontWeight: '800', color: '#4F8EF7' },

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
  empty: { color: '#444', fontSize: 14, paddingVertical: 12 },
  logInfo: { color: '#888', fontSize: 14 },
});
