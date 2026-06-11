import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DAYS_HE = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
const DAYS_FULL = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const MEAL_LABELS = { BREAKFAST: 'בוקר', MORNING_SNACK: 'חטיף בוקר', LUNCH: 'צהריים', AFTERNOON_SNACK: 'חטיף צ\'', DINNER: 'ערב', EVENING_SNACK: 'חטיף ע\'' };

function getWeekDates(offset = 0) {
  const now = new Date();
  const day = now.getDay();
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - day + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return d;
  });
}

function toISO(date) {
  return date.toISOString().split('T')[0];
}

function weekLabel(offset) {
  if (offset === 0) return 'השבוע';
  if (offset === -1) return 'שבוע שעבר';
  if (offset === -2) return 'לפני שבועיים';
  return `לפני ${Math.abs(offset)} שבועות`;
}

export default function HistoryScreen() {
  const [mode, setMode] = useState('history'); // 'history' | 'plan'
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [dayData, setDayData] = useState({});
  const [loading, setLoading] = useState(false);

  const API = 'http://localhost:8000';
  const weekDates = getWeekDates(weekOffset);
  const selectedDate = weekDates[selectedDay];
  const selectedISO = toISO(selectedDate);

  const loadDayData = useCallback(async (dateStr) => {
    setLoading(true);
    try {
      const [logRes, waterRes] = await Promise.all([
        fetch(`${API}/food-log/${dateStr}`).then(r => r.json()).catch(() => ({ entries: [] })),
        fetch(`${API}/water/${dateStr}`).then(r => r.json()).catch(() => ({ total_ml: 0 })),
      ]);
      setDayData({ log: logRes.entries ?? [], water: waterRes });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDayData(selectedISO);
  }, [selectedISO, loadDayData]);

  const calHeat = (entries) => {
    const cal = entries?.reduce((s, e) => s + (e.calories ?? 0), 0) ?? 0;
    if (cal === 0) return null;
    if (cal < 1000) return { color: '#333', label: 'נמוך' };
    if (cal < 2000) return { color: '#ffd700', label: 'חלקי' };
    return { color: '#4CAF50', label: 'יעד' };
  };

  // Group entries by meal type
  const grouped = {};
  (dayData.log ?? []).forEach(e => {
    const mt = e.meal_type ?? 'OTHER';
    if (!grouped[mt]) grouped[mt] = [];
    grouped[mt].push(e);
  });

  const totalCal = (dayData.log ?? []).reduce((s, e) => s + (e.calories ?? 0), 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>היסטוריה</Text>
        <View style={styles.modeRow}>
          <TouchableOpacity style={[styles.modeBtn, mode === 'history' && styles.modeBtnActive]} onPress={() => setMode('history')}>
            <Text style={[styles.modeTxt, mode === 'history' && styles.modeTxtActive]}>היסטוריה</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modeBtn, mode === 'plan' && styles.modeBtnActive]} onPress={() => setMode('plan')}>
            <Text style={[styles.modeTxt, mode === 'plan' && styles.modeTxtActive]}>תכנון שבועי</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Week navigation */}
        <View style={styles.weekNav}>
          <TouchableOpacity onPress={() => setWeekOffset(w => w + 1)} disabled={weekOffset >= 0}>
            <Ionicons name="chevron-forward" size={22} color={weekOffset >= 0 ? '#333' : '#4F8EF7'} />
          </TouchableOpacity>
          <Text style={styles.weekLabel}>{weekLabel(weekOffset)}</Text>
          <TouchableOpacity onPress={() => setWeekOffset(w => w - 1)}>
            <Ionicons name="chevron-back" size={22} color="#4F8EF7" />
          </TouchableOpacity>
        </View>

        {/* Day grid */}
        <View style={styles.dayGrid}>
          {weekDates.map((date, i) => {
            const isSelected = selectedDay === i;
            const isToday = toISO(date) === toISO(new Date());
            return (
              <TouchableOpacity key={i} style={[styles.dayCell, isSelected && styles.dayCellActive, isToday && styles.dayCellToday]} onPress={() => setSelectedDay(i)}>
                <Text style={[styles.dayName, isSelected && styles.dayNameActive]}>{DAYS_HE[i]}</Text>
                <Text style={[styles.dayNum, isSelected && styles.dayNumActive]}>{date.getDate()}</Text>
                <View style={[styles.dayDot, { backgroundColor: isSelected ? '#fff' : '#1a1a1a' }]} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          {[{ color: '#333', label: 'ללא נתונים' }, { color: '#ffd700', label: 'חלקי' }, { color: '#4CAF50', label: 'יעד' }].map(l => (
            <View key={l.label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: l.color }]} />
              <Text style={styles.legendTxt}>{l.label}</Text>
            </View>
          ))}
        </View>

        {/* Selected day detail */}
        <View style={styles.dayDetail}>
          <Text style={styles.dayDetailTitle}>
            {DAYS_FULL[selectedDay]}, {selectedDate.getDate()}/{selectedDate.getMonth() + 1}
          </Text>

          {loading ? (
            <ActivityIndicator color="#4F8EF7" style={{ marginTop: 20 }} />
          ) : mode === 'history' ? (
            <>
              {/* Food log */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTotal}>{totalCal} קק"ל</Text>
                  <Text style={styles.sectionTitle}>יומן אכילה</Text>
                </View>
                {totalCal === 0 ? (
                  <Text style={styles.emptyText}>לא נרשמו ארוחות</Text>
                ) : (
                  Object.entries(grouped).map(([mealType, entries]) => (
                    <View key={mealType} style={styles.mealGroup}>
                      <Text style={styles.mealGroupTitle}>{MEAL_LABELS[mealType] ?? mealType}</Text>
                      {entries.map((e, i) => (
                        <View key={i} style={styles.entryRow}>
                          <Text style={styles.entryCal}>{e.calories} קק"ל</Text>
                          <Text style={styles.entryName}>{e.food_name}</Text>
                        </View>
                      ))}
                    </View>
                  ))
                )}
              </View>

              {/* Water */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTotal}>{dayData.water?.total_ml ?? 0}ml</Text>
                  <Text style={styles.sectionTitle}>מים</Text>
                </View>
                <View style={styles.waterBar}>
                  <View style={[styles.waterFill, { width: `${Math.min(((dayData.water?.total_ml ?? 0) / (dayData.water?.goal_ml ?? 2000)) * 100, 100)}%` }]} />
                </View>
                <Text style={styles.waterGoal}>יעד: {dayData.water?.goal_ml ?? 2000}ml</Text>
              </View>
            </>
          ) : (
            /* Planning mode */
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>תכנון ל{DAYS_FULL[selectedDay]}</Text>
              <Text style={styles.emptyText}>תכנון שבועי יתווסף בקרוב</Text>
            </View>
          )}
        </View>

        {/* Weekly summary */}
        <View style={styles.weeklySummary}>
          <Text style={styles.weeklySummaryTitle}>סיכום שבועי</Text>
          <View style={styles.weeklyStats}>
            {[
              { icon: 'restaurant', label: 'ארוחות', val: '—' },
              { icon: 'barbell',    label: 'אימונים', val: '—' },
              { icon: 'flame',      label: 'קק"ל', val: '—' },
            ].map(s => (
              <View key={s.label} style={styles.weeklyStat}>
                <Ionicons name={s.icon} size={20} color="#4F8EF7" />
                <Text style={styles.weeklyStatVal}>{s.val}</Text>
                <Text style={styles.weeklyStatLbl}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12 },
  title: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 12 },
  modeRow: { flexDirection: 'row', backgroundColor: '#141414', borderRadius: 12, padding: 4 },
  modeBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  modeBtnActive: { backgroundColor: '#4F8EF7' },
  modeTxt: { color: '#666', fontSize: 14, fontWeight: '600' },
  modeTxtActive: { color: '#fff' },
  weekNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  weekLabel: { color: '#fff', fontSize: 15, fontWeight: '700' },
  dayGrid: { flexDirection: 'row', paddingHorizontal: 12, gap: 4, marginBottom: 8 },
  dayCell: { flex: 1, alignItems: 'center', backgroundColor: '#141414', borderRadius: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#1e1e1e' },
  dayCellActive: { backgroundColor: '#4F8EF7', borderColor: '#4F8EF7' },
  dayCellToday: { borderColor: '#4F8EF7' },
  dayName: { color: '#666', fontSize: 11, marginBottom: 4 },
  dayNameActive: { color: '#fff' },
  dayNum: { color: '#fff', fontSize: 15, fontWeight: '700' },
  dayNumActive: { color: '#fff' },
  dayDot: { width: 5, height: 5, borderRadius: 3, marginTop: 4 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 16, paddingBottom: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendTxt: { color: '#666', fontSize: 11 },
  dayDetail: { paddingHorizontal: 16 },
  dayDetailTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12, textAlign: 'right' },
  sectionCard: { backgroundColor: '#141414', borderRadius: 16, padding: 14, marginBottom: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { color: '#fff', fontSize: 14, fontWeight: '700' },
  sectionTotal: { color: '#4F8EF7', fontSize: 14, fontWeight: '700' },
  mealGroup: { marginBottom: 8 },
  mealGroupTitle: { color: '#888', fontSize: 12, marginBottom: 4, textAlign: 'right' },
  entryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  entryName: { color: '#fff', fontSize: 13 },
  entryCal: { color: '#ffd700', fontSize: 13 },
  emptyText: { color: '#444', fontSize: 13, textAlign: 'center', paddingVertical: 12 },
  waterBar: { height: 8, backgroundColor: '#1e1e1e', borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
  waterFill: { height: '100%', backgroundColor: '#4F8EF7', borderRadius: 4 },
  waterGoal: { color: '#666', fontSize: 12, textAlign: 'right' },
  weeklySummary: { margin: 16, backgroundColor: '#141414', borderRadius: 16, padding: 16 },
  weeklySummaryTitle: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 12, textAlign: 'right' },
  weeklyStats: { flexDirection: 'row', justifyContent: 'space-around' },
  weeklyStat: { alignItems: 'center', gap: 4 },
  weeklyStatVal: { color: '#fff', fontSize: 18, fontWeight: '800' },
  weeklyStatLbl: { color: '#888', fontSize: 12 },
});
