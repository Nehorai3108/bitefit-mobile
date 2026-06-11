import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MONTH_NAMES = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
const DAY_NAMES = ['ב\'','ג\'','ד\'','ה\'','ו\'','ש\'','א\''];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year, month) {
  // 0=Sun … 6=Sat, we want Sun=6, Mon=0 for Hebrew calendar display
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}
function toISO(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const API = 'http://localhost:8000';

export default function CalendarScreen() {
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState(now.getDate());
  const [dayData, setDayData] = useState({});
  const [loading, setLoading] = useState(false);

  const selectedISO = toISO(year, month, selected);

  const loadDay = useCallback(async (iso) => {
    setLoading(true);
    try {
      const [logRes, waterRes] = await Promise.all([
        fetch(`${API}/food-log/${iso}`).then(r => r.json()).catch(() => ({ entries: [] })),
        fetch(`${API}/water/${iso}`).then(r => r.json()).catch(() => ({ total_ml: 0, goal_ml: 2000 })),
      ]);
      setDayData({ log: logRes.entries ?? [], water: waterRes });
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadDay(selectedISO); }, [selectedISO, loadDay]);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelected(1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelected(1);
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const totalCal = (dayData.log ?? []).reduce((s, e) => s + (e.calories ?? 0), 0);
  const waterMl = dayData.water?.total_ml ?? 0;
  const waterGoal = dayData.water?.goal_ml ?? 2000;
  const waterGlasses = Math.round(waterMl / 250);

  // Build calendar grid
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isToday = (d) => {
    const t = new Date();
    return t.getFullYear() === year && t.getMonth() === month && t.getDate() === d;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>לוח שנה</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Month navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={nextMonth}>
            <Ionicons name="chevron-forward" size={24} color="#4F8EF7" />
          </TouchableOpacity>
          <View style={styles.monthCenter}>
            <Text style={styles.monthName}>{MONTH_NAMES[month]}</Text>
            <Text style={styles.yearTxt}>{year}</Text>
          </View>
          <TouchableOpacity onPress={prevMonth}>
            <Ionicons name="chevron-back" size={24} color="#4F8EF7" />
          </TouchableOpacity>
        </View>

        {/* Day names row */}
        <View style={styles.dayNamesRow}>
          {DAY_NAMES.map(d => <Text key={d} style={styles.dayName}>{d}</Text>)}
        </View>

        {/* Calendar grid */}
        <View style={styles.grid}>
          {cells.map((day, i) => {
            if (!day) return <View key={`empty-${i}`} style={styles.emptyCell} />;
            const sel = selected === day;
            const tod = isToday(day);
            return (
              <TouchableOpacity key={day} style={[styles.dayCell, sel && styles.dayCellSel, tod && !sel && styles.dayCellToday]} onPress={() => setSelected(day)}>
                <Text style={[styles.dayNum, sel && styles.dayNumSel, tod && !sel && styles.dayNumToday]}>{day}</Text>
                {/* Indicators placeholder */}
                <View style={styles.indicators}>
                  <View style={[styles.dot, { backgroundColor: tod ? '#4CAF50' : '#1a1a1a' }]} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Day detail */}
        <View style={styles.detailSection}>
          <Text style={styles.detailTitle}>
            {selected} {MONTH_NAMES[month]} {year}
          </Text>

          {loading ? (
            <ActivityIndicator color="#4F8EF7" style={{ marginTop: 20 }} />
          ) : (
            <>
              {/* Summary cards */}
              <View style={styles.summaryRow}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryVal}>{totalCal}</Text>
                  <Text style={styles.summaryLbl}>קק"ל</Text>
                </View>
                <View style={styles.summaryCard}>
                  <View style={styles.glassesRow}>
                    {Array.from({ length: Math.min(waterGlasses, 8) }).map((_, i) => (
                      <Ionicons key={i} name="water" size={14} color="#4F8EF7" />
                    ))}
                  </View>
                  <Text style={styles.summaryLbl}>{waterMl}ml מים</Text>
                </View>
              </View>

              {/* Food entries */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>ארוחות</Text>
                {(dayData.log ?? []).length === 0 ? (
                  <Text style={styles.empty}>לא נרשמו ארוחות</Text>
                ) : (
                  (dayData.log ?? []).map((e, i) => (
                    <View key={i} style={styles.entryRow}>
                      <Text style={styles.entryCal}>{e.calories} קק"ל</Text>
                      <View style={styles.entryLeft}>
                        <Text style={styles.entryName}>{e.food_name}</Text>
                        <Text style={styles.entryMeal}>{e.meal_type}</Text>
                      </View>
                    </View>
                  ))
                )}
              </View>

              {/* Water detail */}
              <View style={styles.card}>
                <View style={styles.waterHeader}>
                  <Text style={styles.cardTitle}>מים</Text>
                  <Text style={styles.waterPct}>{Math.round((waterMl / waterGoal) * 100)}%</Text>
                </View>
                <View style={styles.waterBar}>
                  <View style={[styles.waterFill, { width: `${Math.min((waterMl / waterGoal) * 100, 100)}%` }]} />
                </View>
                <View style={styles.waterStats}>
                  <Text style={styles.waterStat}>{waterMl}ml שתית</Text>
                  <Text style={styles.waterStat}>{Math.max(waterGoal - waterMl, 0)}ml נותר</Text>
                  <Text style={styles.waterStat}>יעד: {waterGoal}ml</Text>
                </View>
              </View>
            </>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { paddingHorizontal: 16, paddingTop: 52, paddingBottom: 8 },
  title: { color: '#fff', fontSize: 22, fontWeight: '800' },
  monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  monthCenter: { alignItems: 'center' },
  monthName: { color: '#fff', fontSize: 20, fontWeight: '800' },
  yearTxt: { color: '#666', fontSize: 13 },
  dayNamesRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 4 },
  dayName: { flex: 1, textAlign: 'center', color: '#555', fontSize: 12, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 },
  emptyCell: { width: '14.28%', height: 52 },
  dayCell: { width: '14.28%', height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  dayCellSel: { backgroundColor: '#4F8EF7' },
  dayCellToday: { borderWidth: 1, borderColor: '#4F8EF7' },
  dayNum: { color: '#aaa', fontSize: 14, fontWeight: '600' },
  dayNumSel: { color: '#fff', fontWeight: '800' },
  dayNumToday: { color: '#4F8EF7', fontWeight: '800' },
  indicators: { flexDirection: 'row', gap: 2, marginTop: 2 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  detailSection: { paddingHorizontal: 16, paddingTop: 8 },
  detailTitle: { color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'right', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  summaryCard: { flex: 1, backgroundColor: '#141414', borderRadius: 14, padding: 14, alignItems: 'center', gap: 4 },
  summaryVal: { color: '#fff', fontSize: 22, fontWeight: '800' },
  summaryLbl: { color: '#888', fontSize: 12 },
  glassesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 2, justifyContent: 'center' },
  card: { backgroundColor: '#141414', borderRadius: 14, padding: 14, marginBottom: 10 },
  cardTitle: { color: '#fff', fontSize: 14, fontWeight: '700', textAlign: 'right', marginBottom: 10 },
  empty: { color: '#444', fontSize: 13, textAlign: 'center', paddingVertical: 10 },
  entryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  entryLeft: { alignItems: 'flex-end' },
  entryName: { color: '#fff', fontSize: 13 },
  entryMeal: { color: '#666', fontSize: 11, marginTop: 1 },
  entryCal: { color: '#ffd700', fontSize: 13, fontWeight: '700' },
  waterHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  waterPct: { color: '#4F8EF7', fontSize: 14, fontWeight: '700' },
  waterBar: { height: 8, backgroundColor: '#1e1e1e', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  waterFill: { height: '100%', backgroundColor: '#4F8EF7', borderRadius: 4 },
  waterStats: { flexDirection: 'row', justifyContent: 'space-between' },
  waterStat: { color: '#666', fontSize: 12 },
});
