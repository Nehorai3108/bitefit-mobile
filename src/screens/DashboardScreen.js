import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Image, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle } from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/native';
import {
  fetchFoodLogSummaryByDate, fetchFoodLogByDate,
  fetchProfileTargets, deleteFoodEntry, fetchWorkoutSummary,
} from '../api/client';
import { onDataChanged } from '../refreshBus';
import { useSwipeNav } from '../hooks/useSwipeNav';
import WeightProgress from '../components/WeightProgress';
import { useTheme } from '../context/ThemeContext';

const MEAL_LABELS = {
  BREAKFAST:       'ארוחת בוקר',   breakfast: 'ארוחת בוקר',
  MORNING_SNACK:   'ביניים בוקר',   morning_snack: 'ביניים בוקר',
  LUNCH:           'ארוחת צהריים', lunch: 'ארוחת צהריים',
  AFTERNOON_SNACK: 'ביניים אחה"צ',  afternoon_snack: 'ביניים אחה"צ',
  DINNER:          'ארוחת ערב',   dinner: 'ארוחת ערב',
  EVENING_SNACK:   'ביניים ערב',    evening_snack: 'ביניים ערב',
};

const MEAL_COLORS = {
  BREAKFAST:       '#f97316',   breakfast: '#f97316',
  MORNING_SNACK:   '#84cc16',   morning_snack: '#84cc16',
  LUNCH:           '#111114',   lunch: '#111114',
  AFTERNOON_SNACK: '#a855f7',   afternoon_snack: '#a855f7',
  DINNER:          '#ec4899',   dinner: '#ec4899',
  EVENING_SNACK:   '#14b8a6',   evening_snack: '#14b8a6',
};

// סדר קבוע של הארוחות ביום — היומן מחולק לפיו
const MEAL_ORDER = ['breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner', 'evening_snack'];

function mealSlot(entry) {
  const raw = (entry?.meal_type ?? '').toString().toLowerCase();
  return MEAL_ORDER.includes(raw) ? raw : 'other';
}

function toIso(date) {
  // מחזיר YYYY-MM-DD בזמן מקומי (לא UTC)
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function ProgressRing({ size = 90, pct = 0, color = '#111114', label, sub }) {
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const stroke = size * 0.09;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(pct, 1) * circ;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size/2} cy={size/2} r={r} stroke={C.surface3} strokeWidth={stroke} fill="none" />
        <Circle cx={size/2} cy={size/2} r={r}
          stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
        />
      </Svg>
      <View style={{ alignItems: 'center' }}>
        {label ? <Text style={[styles.ringLabel, { color, fontSize: size * 0.18 }]}>{label}</Text> : null}
        {sub   ? <Text style={[styles.ringSub, { fontSize: size * 0.11 }]}>{sub}</Text> : null}
      </View>
    </View>
  );
}

function MacroCard({ label, eaten, target, color }) {
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const pct  = target > 0 ? Math.min(eaten / target, 1) : 0;
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

// ─── סרגל ימי שבוע אינטראקטיבי — 7 ימים אחרונים כולל היום ────────────────────
function WeekStrip({ selectedDate, onSelectDate }) {
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const HE_DAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
  const today    = new Date();
  const todayStr = toIso(today);

  // 7 ימים אחרונים (לפני 6 ימים עד היום — ללא ימים עתידיים)
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return d;
  });

  return (
    <View style={styles.weekStrip}>
      {dates.map((date, i) => {
        const dateStr    = toIso(date);
        const dayLabel   = HE_DAYS[date.getDay()];
        const isToday    = dateStr === todayStr;
        const isSelected = dateStr === selectedDate;
        return (
          <TouchableOpacity
            key={i}
            style={[styles.weekDay, isSelected && styles.weekDayActive]}
            onPress={() => onSelectDate(dateStr)}
            activeOpacity={0.7}
          >
            <Text style={[styles.weekDayName, isSelected && styles.weekDayTxtActive]}>{dayLabel}</Text>
            <Text style={[
              styles.weekDayNum,
              isSelected && styles.weekDayTxtActive,
              isToday && !isSelected && { color: '#111114' },
            ]}>
              {date.getDate()}
            </Text>
            {isToday && !isSelected && <View style={styles.todayDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function FoodLogRow({ entry, onDelete, readOnly }) {
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [deleting, setDeleting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const mealColor = MEAL_COLORS[entry.meal_type] ?? '#111114';
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
    { label: 'חלבון', val: entry.protein, color: '#111114' },
    { label: 'פחמימות', val: entry.carbs, color: '#ffd700' },
    { label: 'שומן', val: entry.fat, color: '#ef7d6c' },
  ];

  return (
    <View style={styles.logItem}>
      <View style={styles.logRow}>
        <View style={[styles.logDot, { backgroundColor: mealColor }]} />
        <TouchableOpacity style={styles.logTapArea} activeOpacity={0.7} onPress={() => setExpanded(e => !e)}>
          {entry.image_url ? (
            <Image source={{ uri: entry.image_url }} style={styles.logThumb} resizeMode="cover" />
          ) : (
            <View style={[styles.logThumb, { backgroundColor: mealColor + '22', justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="restaurant-outline" size={26} color={mealColor} />
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
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={C.placeholder} />
        </TouchableOpacity>
        {!readOnly && (
          <TouchableOpacity onPress={handleDelete} disabled={deleting} style={styles.logDeleteBtn}>
            {deleting
              ? <ActivityIndicator size="small" color="#ff4444" />
              : <Ionicons name="trash-outline" size={16} color={C.textFaint} />
            }
          </TouchableOpacity>
        )}
      </View>
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

export default function DashboardScreen({ navigation }) {
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const todayStr = toIso(new Date());

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const selectedDateRef = useRef(todayStr);

  const [summary, setSummary]   = useState({ calories: 0, protein: 0, carbs: 0, fat: 0, entries: 0 });
  const [targets, setTargets]   = useState({ calories: 2000, protein: 150, carbs: 250, fat: 67 });
  const [todayEntries, setTodayEntries] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [burned, setBurned] = useState(0);
  const [showConsumed, setShowConsumed] = useState(false);

  const panHandlers = useSwipeNav(navigation, 'בית');

  const load = useCallback(async () => {
    const d = selectedDateRef.current;
    try {
      const [s, t, logData, ws] = await Promise.all([
        fetchFoodLogSummaryByDate(d).catch(() => ({ calories: 0, protein: 0, carbs: 0, fat: 0, entries: 0 })),
        fetchProfileTargets().catch(() => ({ calories: 2000, protein: 150, carbs: 250, fat: 67 })),
        fetchFoodLogByDate(d).catch(() => ({ entries: [] })),
        fetchWorkoutSummary().catch(() => ({ calories_burned: 0 })),
      ]);
      setSummary(s); setTargets(t); setBurned(ws?.calories_burned ?? 0);
      const entries = logData?.entries ?? [];
      const sorted  = [...entries].sort((a, b) =>
        new Date(b.timestamp ?? 0) - new Date(a.timestamp ?? 0)
      );
      setTodayEntries(sorted);
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  const handleDateSelect = useCallback((d) => {
    selectedDateRef.current = d;
    setSelectedDate(d);
    setLoading(true);
    load();
  }, [load]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => onDataChanged(load), [load]);

  // התרעה חד-פעמית ליום כשחורגים מהמכסה היומית
  useEffect(() => {
    const iso = toIso(new Date());
    if (selectedDate !== iso) return;
    const tgt = (targets?.calories ?? 2000) + burned;
    const ov = Math.round((summary?.calories ?? 0) - tgt);
    if (ov <= 0) return;
    const key = `@overage_alert_${iso}`;
    (async () => {
      if (await AsyncStorage.getItem(key)) return;
      await AsyncStorage.setItem(key, '1');
      Alert.alert(
        'הגעת למכסה היומית 🚫',
        `חרגת ב-${ov.toLocaleString()} קלוריות מעל היעד היומי שלך.\nכדאי לעצור כאן להיום — או להוסיף אימון כדי לאזן.`,
        [{ text: 'הבנתי' }]
      );
    })();
  }, [summary, targets, burned, selectedDate]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#111114" /></View>;

  const isToday    = selectedDate === todayStr;
  const displayDate = new Date(selectedDate + 'T12:00:00')
    .toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });

  const cal           = summary?.calories ?? 0;
  const calTarget     = targets?.calories ?? 2000;
  const adjustedTarget = isToday ? calTarget + burned : calTarget;
  const calLeft       = Math.max(adjustedTarget - cal, 0);
  const calPct        = adjustedTarget > 0 ? Math.min(cal / adjustedTarget, 1) : 0;
  const overage       = isToday ? Math.max(0, Math.round(cal - adjustedTarget)) : 0;

  return (
    <View style={{ flex: 1 }} {...panHandlers}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#111114" />
        }
      >
        {/* כותרת */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={styles.histBtn} onPress={() => navigation.navigate('History')}>
              <Ionicons name="calendar-outline" size={20} color="#111114" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.histBtn} onPress={() => navigation.navigate('Inventory')}>
              <Ionicons name="cart-outline" size={20} color="#111114" />
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.logo}>NutriSmart</Text>
            <Image source={require('../../assets/nutrismart-logo.png')}
              style={styles.logoImg} resizeMode="contain" />
          </View>
        </View>

        {/* תאריך נבחר */}
        <Text style={[styles.dateSub, !isToday && { color: '#111114' }]}>
          {isToday ? displayDate : `${displayDate} (היסטוריה)`}
        </Text>

        {/* סרגל שבוע אינטראקטיבי */}
        <WeekStrip selectedDate={selectedDate} onSelectDate={handleDateSelect} />

        {/* כרטיס קלוריות */}
        <TouchableOpacity style={styles.calCard} activeOpacity={0.85} onPress={() => setShowConsumed(v => !v)}>
          <ProgressRing size={110} pct={calPct} color={overage > 0 ? '#e5484d' : '#111114'}
            label={`${Math.round(calPct * 100)}%`} sub="מיעד" />
          <View style={[styles.calInfo, { alignItems: 'flex-end' }]}>
            <Text style={[
              styles.calNum,
              showConsumed && { color: '#111114' },
              (!showConsumed && overage > 0) && { color: '#e5484d' },
            ]}>
              {showConsumed
                ? cal.toLocaleString()
                : (overage > 0 ? `-${overage.toLocaleString()}` : calLeft.toLocaleString())}
            </Text>
            <Text style={[styles.calLbl, (!showConsumed && overage > 0) && { color: '#e5484d', fontWeight: '700' }]}>
              {showConsumed ? 'קלוריות שאכלת' : (overage > 0 ? 'קלוריות מעל היעד' : 'קלוריות נותרות')}
            </Text>
            <View style={styles.calRow}>
              <View style={styles.calItem}>
                <Text style={styles.calVal}>{calTarget.toLocaleString()}</Text>
                <Text style={styles.calSub}>יעד</Text>
              </View>
              <View style={styles.calItem}>
                <Text style={[styles.calVal, { color: '#111114' }]}>{cal}</Text>
                <Text style={styles.calSub}>אכלת</Text>
              </View>
              {isToday && (
                <View style={styles.calItem}>
                  <Text style={[styles.calVal, { color: '#ef7d6c' }]}>{burned.toLocaleString()}</Text>
                  <Text style={styles.calSub}>שרפת</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>

        {/* מאקרו */}
        <View style={styles.macrosRow}>
          <MacroCard label="שומן"    eaten={summary?.fat ?? 0}    target={targets?.fat ?? 67}    color="#111114" />
          <MacroCard label="פחמימות" eaten={summary?.carbs ?? 0}  target={targets?.carbs ?? 250} color="#f0935f" />
          <MacroCard label="חלבון"   eaten={summary?.protein ?? 0} target={targets?.protein ?? 150} color="#111114" />
        </View>

        {/* התראת חריגה אוטומטית — קיזוז מהתפריט */}
        {overage > 50 && (
          <TouchableOpacity style={styles.overBanner} activeOpacity={0.9}
            onPress={() => navigation.navigate('תפריט')}>
            <Ionicons name="alert-circle" size={22} color="#e0a800" />
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={styles.overTitle}>חרגת ב-{overage.toLocaleString()} קק"ל מהיעד</Text>
              <Text style={styles.overSub}>הקש כדי לקזז מהתפריט ולחזור למסלול</Text>
            </View>
            <Ionicons name="chevron-back" size={20} color="#e0a800" />
          </TouchableOpacity>
        )}

        {/* מאזן ארוחות — רק ליום הנוכחי */}
        {isToday && <WeightProgress />}

        {/* יומן אכילה */}
        <View style={[styles.card, { marginBottom: 28 }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              {isToday ? 'יומן אכילה היום' : `יומן — ${displayDate}`}
            </Text>
            <Text style={styles.waterMl}>{todayEntries.length} פריטים</Text>
          </View>
          {(() => {
            const handleDelete = (id) => {
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
            };

            if (todayEntries.length === 0) {
              return <Text style={styles.empty}>
                {isToday ? 'לא נרשמו ארוחות היום' : 'לא נרשמו ארוחות ביום זה'}
              </Text>;
            }

            // חלוקה לפי ארוחה, בסדר קבוע לאורך היום
            const groups = [...MEAL_ORDER, 'other'].map(slot => ({
              slot,
              items: todayEntries.filter(e => mealSlot(e) === slot),
            })).filter(g => g.items.length > 0);

            return groups.map(({ slot, items }) => {
              const color = MEAL_COLORS[slot] ?? '#111114';
              const label = MEAL_LABELS[slot] ?? 'אחר';
              const cals  = Math.round(items.reduce((s, e) => s + (e.calories ?? 0), 0));
              return (
                <View key={slot} style={styles.mealSection}>
                  <View style={styles.mealSectionHeader}>
                    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
                      <View style={[styles.mealSectionBar, { backgroundColor: color }]} />
                      <Text style={[styles.mealSectionTitle, { color }]}>{label}</Text>
                    </View>
                    <Text style={styles.mealSectionCal}>{cals} קק"ל</Text>
                  </View>
                  {items.map((e, i) => (
                    <FoodLogRow
                      key={e.entry_id ?? `${slot}-${i}`}
                      entry={e}
                      readOnly={!isToday}
                      onDelete={handleDelete}
                    />
                  ))}
                </View>
              );
            });
          })()}
        </View>

      </ScrollView>
    </View>
  );
}

const makeStyles = (C) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 2 },
  dateSub:   { color: C.textDim, fontSize: 13, textAlign: 'right', paddingHorizontal: 16, paddingBottom: 10 },
  logo:      { fontSize: 20, fontWeight: '800', color: '#111114' },
  logoImg:   { width: 34, height: 34, borderRadius: 9 },
  planCta:   { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, marginHorizontal: 16,
    marginBottom: 16, padding: 14, borderRadius: 16, backgroundColor: C.surface,
    borderWidth: 1, borderColor: '#11111455' },
  planCtaIcon:  { width: 44, height: 44, borderRadius: 12, backgroundColor: '#111114',
    alignItems: 'center', justifyContent: 'center' },
  planCtaTitle: { color: C.text, fontSize: 15.5, fontWeight: '800', textAlign: 'right' },
  planCtaSub:   { color: C.textMuted, fontSize: 12.5, textAlign: 'right', marginTop: 2 },
  overBanner:   { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, marginHorizontal: 16,
    marginBottom: 12, padding: 14, borderRadius: 16, backgroundColor: '#e0a80018',
    borderWidth: 1, borderColor: '#e0a80055' },
  overTitle:    { color: C.text, fontSize: 15, fontWeight: '800', textAlign: 'right' },
  overSub:      { color: C.textMuted, fontSize: 12.5, textAlign: 'right', marginTop: 2 },

  weekStrip:       { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 14 },
  weekDay:         { flex: 1, alignItems: 'center', paddingVertical: 8, marginHorizontal: 2, borderRadius: 14,
                     borderWidth: 1.5, borderColor: 'transparent' },
  weekDayActive:   { backgroundColor: '#ffffff', borderColor: '#111114',
                     shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  weekDayName:     { color: C.textDim, fontSize: 12, fontWeight: '600' },
  weekDayNum:      { color: C.textMuted, fontSize: 14, fontWeight: '700', marginTop: 2 },
  weekDayTxtActive:{ color: '#111114' },
  todayDot:        { width: 4, height: 4, borderRadius: 2, backgroundColor: '#111114', marginTop: 3 },

  histBtn:    { alignItems: 'center', justifyContent: 'center', backgroundColor: C.surface, borderRadius: 10, padding: 8, borderWidth: 1, borderColor: C.border2 },
  histBtnTxt: { color: '#111114', fontSize: 13, fontWeight: '700' },

  calCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.surface, borderRadius: 20, margin: 16, marginTop: 4, padding: 20 },
  calInfo: { flex: 1, paddingRight: 12 },
  calNum:  { color: C.text, fontSize: 38, fontWeight: '800' },
  calLbl:  { color: C.textMuted, fontSize: 13, marginBottom: 14 },
  calRow:  { flexDirection: 'row', gap: 20 },
  calItem: {},
  calVal:  { color: C.text, fontSize: 15, fontWeight: '700' },
  calSub:  { color: C.textDim, fontSize: 11, marginTop: 2 },

  ringWrap:   { justifyContent: 'center', alignItems: 'center' },
  ringBg:     { borderWidth: 9, position: 'absolute' },
  ringFg:     { borderWidth: 9, position: 'absolute' },
  ringCenter: { justifyContent: 'center', alignItems: 'center' },
  ringLabel:  { fontSize: 14, fontWeight: '800' },
  ringSub:    { color: C.textMuted, fontSize: 10 },

  macrosRow: { flexDirection: 'row', marginHorizontal: 16, gap: 10, marginBottom: 12 },
  macroCard: { flex: 1, backgroundColor: C.surface, borderRadius: 16, padding: 12, alignItems: 'center', gap: 3 },
  macroVal:  { color: C.text, fontSize: 15, fontWeight: '700' },
  macroSub:  { color: C.textDim, fontSize: 10 },
  macroName: { fontSize: 12, fontWeight: '700' },

  card:       { backgroundColor: C.surface, borderRadius: 20, margin: 16, marginTop: 4, padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle:  { color: C.text, fontSize: 15, fontWeight: '700' },
  waterMl:    { color: C.textDim, fontSize: 12 },
  empty:      { color: C.textFaint, fontSize: 14 },

  mealSection:       { marginTop: 6, marginBottom: 4 },
  mealSectionHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
                       paddingVertical: 8, marginTop: 6 },
  mealSectionBar:    { width: 4, height: 16, borderRadius: 2 },
  mealSectionTitle:  { fontSize: 14, fontWeight: '800' },
  mealSectionCal:    { fontSize: 12, fontWeight: '700', color: C.textDim },

  logItem:      { borderBottomWidth: 1, borderBottomColor: C.surface3 },
  logRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  logTapArea:   { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  logDot:       { width: 4, height: 38, borderRadius: 2 },
  logThumb:     { width: 60, height: 60, borderRadius: 14 },
  logInfo:      { flex: 1 },
  logName:      { color: C.text, fontSize: 14, fontWeight: '600', textAlign: 'right' },
  logMeal:      { fontSize: 11, marginTop: 2, textAlign: 'right' },
  logCalWrap:   { alignItems: 'center', minWidth: 42 },
  logCal:       { fontSize: 15, fontWeight: '800' },
  logCalLbl:    { color: C.textDim, fontSize: 10 },
  logDeleteBtn: { padding: 8, marginLeft: 2 },
  macroPanel:   { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: C.macroPanel, borderRadius: 12, paddingVertical: 12, marginBottom: 10, marginHorizontal: 4 },
  macroBox:     { alignItems: 'center' },
  macroLbl:     { color: '#777', fontSize: 11, marginTop: 3 },
});
