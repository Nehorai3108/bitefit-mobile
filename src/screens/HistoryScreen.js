import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  ScrollView, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchFoodHistory, fetchFoodLogByDate, fetchProfileTargets } from '../api/client';

const MONTHS_HE = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
const DOW_HE = ['א','ב','ג','ד','ה','ו','ש'];
const MEAL_LABELS = {
  BREAKFAST: 'בוקר', MORNING_SNACK: 'חטיף בוקר', LUNCH: 'צהריים',
  AFTERNOON_SNACK: 'חטיף', DINNER: 'ערב', EVENING_SNACK: 'חטיף ערב',
};

const iso = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

export default function HistoryScreen({ visible, onClose }) {
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [history, setHistory] = useState({});
  const [target, setTarget]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);   // { date, entries, total }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [h, t] = await Promise.all([
        fetchFoodHistory(366).catch(() => ({ days: {} })),
        fetchProfileTargets().catch(() => null),
      ]);
      setHistory(h?.days ?? {});
      setTarget(t?.calories ?? null);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (visible) { load(); setSelected(null); } }, [visible, load]);

  const openDay = async (dateStr) => {
    const day = history[dateStr];
    if (!day) return;   // no data → ignore tap
    setSelected({ date: dateStr, entries: null, total: day });
    try {
      const r = await fetchFoodLogByDate(dateStr);
      setSelected({ date: dateStr, entries: r.entries ?? [], total: day });
    } catch {
      setSelected({ date: dateStr, entries: [], total: day });
    }
  };

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  // Build calendar cells (Sunday-first; rendered RTL via row-reverse)
  const firstDow   = new Date(year, month, 1).getDay();
  const daysInMon  = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMon; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const todayIso = iso(now.getFullYear(), now.getMonth(), now.getDate());

  const colorFor = (cal) => {
    if (!target) return '#5b9bdc';
    if (cal > target * 1.1) return '#ef7d6c';   // well over goal
    if (cal >= target * 0.85) return '#56bd6b'; // on target
    return '#ffd700';                            // under goal
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={onClose}><Ionicons name="close" size={26} color="#fff" /></TouchableOpacity>
          <Text style={s.title}>היסטוריית תזונה</Text>
        </View>

        {loading ? (
          <View style={s.center}><ActivityIndicator size="large" color="#5b9bdc" /></View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            {/* Month nav */}
            <View style={s.monthNav}>
              <TouchableOpacity onPress={nextMonth} style={s.navBtn}><Ionicons name="chevron-forward" size={22} color="#5b9bdc" /></TouchableOpacity>
              <Text style={s.monthLabel}>{MONTHS_HE[month]} {year}</Text>
              <TouchableOpacity onPress={prevMonth} style={s.navBtn}><Ionicons name="chevron-back" size={22} color="#5b9bdc" /></TouchableOpacity>
            </View>


            {/* Weekday headers */}
            <View style={s.weekRow}>
              {DOW_HE.map((d, i) => <Text key={i} style={s.dowCell}>{d}</Text>)}
            </View>

            {/* Weeks */}
            {weeks.map((week, wi) => (
              <View key={wi} style={s.weekRow}>
                {week.map((d, di) => {
                  if (!d) return <View key={di} style={s.dayCell} />;
                  const dateStr = iso(year, month, d);
                  const day = history[dateStr];
                  const isToday = dateStr === todayIso;
                  return (
                    <TouchableOpacity
                      key={di}
                      style={[s.dayCell, day && s.dayCellActive, isToday && s.dayCellToday]}
                      onPress={() => openDay(dateStr)}
                      activeOpacity={day ? 0.6 : 1}
                    >
                      <Text style={[s.dayNum, isToday && { color: '#5b9bdc', fontWeight: '800' }]}>{d}</Text>
                      {day && <Text style={[s.dayCal, { color: colorFor(day.calories) }]}>{day.calories}</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}

            {Object.keys(history).length === 0 && (
              <Text style={s.empty}>אין עדיין נתוני תזונה. התחל לרשום ארוחות והן יופיעו כאן.</Text>
            )}
          </ScrollView>
        )}

        {/* Day detail */}
        {selected && (
          <DayDetail selected={selected} onClose={() => setSelected(null)} />
        )}
      </View>
    </Modal>
  );
}

function DayDetail({ selected, onClose }) {
  const { date, entries, total } = selected;
  const dObj = new Date(date + 'T00:00:00');
  const dateLabel = dObj.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.detailOverlay}>
        <View style={s.detailSheet}>
          <View style={s.detailHandle} />
          <View style={s.detailHeader}>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#fff" /></TouchableOpacity>
            <Text style={s.detailTitle}>{dateLabel}</Text>
          </View>

          {/* Totals */}
          <View style={s.totalsRow}>
            <Text style={s.totalsCal}>{total.calories} קק"ל</Text>
            <Text style={s.totalsMacros}>חלבון {total.protein}g · פחמ' {total.carbs}g · שומן {total.fat}g</Text>
          </View>

          <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ paddingBottom: 20 }}>
            {entries === null ? (
              <ActivityIndicator color="#5b9bdc" style={{ marginTop: 20 }} />
            ) : entries.length === 0 ? (
              <Text style={s.empty}>אין פירוט ארוחות ליום זה</Text>
            ) : entries.map((e, i) => (
              <View key={i} style={s.entryRow}>
                {e.image_url
                  ? <Image source={{ uri: e.image_url }} style={s.entryThumb} />
                  : <View style={[s.entryThumb, s.entryThumbEmpty]}><Ionicons name="restaurant-outline" size={16} color="#555" /></View>}
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Text style={s.entryName}>{e.food_name}</Text>
                  <Text style={s.entryMeta}>{MEAL_LABELS[e.meal_type] ?? e.meal_type} · {Math.round(e.grams)}g</Text>
                </View>
                <Text style={s.entryCal}>{Math.round(e.calories)}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c1622' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1b2c3d' },
  title: { color: '#fff', fontSize: 20, fontWeight: '800' },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  navBtn: { padding: 8, backgroundColor: '#14212f', borderRadius: 10 },
  monthLabel: { color: '#fff', fontSize: 18, fontWeight: '700' },
  legend: { color: '#777', fontSize: 11, textAlign: 'center', marginBottom: 12 },
  weekRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 6 },
  dowCell: { width: '13.5%', textAlign: 'center', color: '#666', fontSize: 13, fontWeight: '600' },
  dayCell: { width: '13.5%', aspectRatio: 0.85, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  dayCellActive: { backgroundColor: '#14212f' },
  dayCellToday: { borderWidth: 1, borderColor: '#5b9bdc' },
  dayNum: { color: '#ccc', fontSize: 14 },
  dayCal: { fontSize: 10, fontWeight: '700', marginTop: 2 },
  empty: { color: '#666', fontSize: 14, textAlign: 'center', marginTop: 24, paddingHorizontal: 20, lineHeight: 22 },
  detailOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  detailSheet: { backgroundColor: '#14212f', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  detailHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#333', alignSelf: 'center', marginBottom: 14 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  detailTitle: { color: '#fff', fontSize: 17, fontWeight: '700', flex: 1, textAlign: 'right', marginLeft: 12 },
  totalsRow: { backgroundColor: '#1b2c3d', borderRadius: 12, padding: 14, marginBottom: 14, alignItems: 'center' },
  totalsCal: { color: '#5b9bdc', fontSize: 26, fontWeight: '800' },
  totalsMacros: { color: '#888', fontSize: 13, marginTop: 4 },
  entryRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1f1f1f' },
  entryThumb: { width: 40, height: 40, borderRadius: 8 },
  entryThumbEmpty: { backgroundColor: '#23384c', alignItems: 'center', justifyContent: 'center' },
  entryName: { color: '#fff', fontSize: 15, fontWeight: '600', textAlign: 'right' },
  entryMeta: { color: '#666', fontSize: 12, textAlign: 'right' },
  entryCal: { color: '#ffd700', fontSize: 15, fontWeight: '700', minWidth: 44 },
});
