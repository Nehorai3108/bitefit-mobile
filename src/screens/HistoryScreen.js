import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Image,
} from 'react-native';
import Svg, { Rect, Line, Text as SvgText, G } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { fetchFoodHistory, fetchFoodLogByDate, fetchProfileTargets } from '../api/client';
import { useTheme } from '../context/ThemeContext';

const MONTHS_HE = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
const DOW_HE    = ['א','ב','ג','ד','ה','ו','ש'];
const MEAL_LABELS = {
  BREAKFAST:'בוקר', MORNING_SNACK:'ביניים בוקר', LUNCH:'צהריים',
  AFTERNOON_SNACK:'ביניים', DINNER:'ערב', EVENING_SNACK:'ביניים ערב',
};

function isoStr(y, m, d) {
  return `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

function todayIsoLocal() {
  const n = new Date();
  return isoStr(n.getFullYear(), n.getMonth(), n.getDate());
}

// ─── גרף עמודות SVG ──────────────────────────────────────────────────────────
function BarChart({ data, target, C }) {
  const W = 340, H = 180, PAD_L = 38, PAD_B = 32, PAD_T = 10;
  const chartW = W - PAD_L - 8;
  const chartH = H - PAD_B - PAD_T;

  if (!data.length) return null;

  const maxVal = Math.max(...data.map(d => d.cal), target ?? 0, 1);
  const barW   = Math.floor(chartW / data.length) - 4;

  const yPos = (val) => PAD_T + chartH - (val / maxVal) * chartH;
  const targetY = target ? yPos(target) : null;

  const colorFor = (cal) => {
    if (!target) return '#3a7a4a';
    if (cal > target * 1.1) return '#ef7d6c';
    if (cal >= target * 0.85) return '#3a7a4a';
    return '#ffd700';
  };

  // Y axis labels
  const yLabels = [0, Math.round(maxVal / 2), maxVal].map(v => ({
    val: v, y: yPos(v),
  }));

  return (
    <Svg width={W} height={H}>
      {/* Y gridlines */}
      {yLabels.map((l, i) => (
        <G key={i}>
          <Line x1={PAD_L} y1={l.y} x2={W - 8} y2={l.y}
            stroke={C.surface3} strokeWidth={1} />
          <SvgText x={PAD_L - 4} y={l.y + 4} fontSize={9}
            fill={C.textDim} textAnchor="end">{l.val}</SvgText>
        </G>
      ))}

      {/* Target line */}
      {targetY !== null && (
        <Line x1={PAD_L} y1={targetY} x2={W - 8} y2={targetY}
          stroke="#3a7a4a" strokeWidth={1} strokeDasharray="4,3" />
      )}

      {/* Bars */}
      {data.map((d, i) => {
        const x = PAD_L + i * (chartW / data.length) + 2;
        const barH = Math.max(2, (d.cal / maxVal) * chartH);
        const y = PAD_T + chartH - barH;
        return (
          <G key={i}>
            <Rect x={x} y={y} width={barW} height={barH}
              rx={3} fill={colorFor(d.cal)} opacity={0.9} />
            <SvgText x={x + barW / 2} y={H - PAD_B + 14}
              fontSize={9} fill={C.textDim} textAnchor="middle">{d.label}</SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

// ─── תצוגה שבועית ────────────────────────────────────────────────────────────
function WeeklyView({ history, target, C, s, onOpenDay }) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const dateStr = isoStr(d.getFullYear(), d.getMonth(), d.getDate());
    const dow = DOW_HE[d.getDay()];
    const dayNum = d.getDate();
    return { dateStr, label: `${dow}\n${dayNum}`, cal: history[dateStr]?.calories ?? 0,
      protein: history[dateStr]?.protein ?? 0, fat: history[dateStr]?.fat ?? 0,
      carbs: history[dateStr]?.carbs ?? 0 };
  });

  const totalCal  = days.reduce((s, d) => s + d.cal, 0);
  const avgCal    = Math.round(totalCal / 7);
  const totalProt = Math.round(days.reduce((s, d) => s + d.protein, 0));
  const totalFat  = Math.round(days.reduce((s, d) => s + d.fat, 0));
  const totalCarb = Math.round(days.reduce((s, d) => s + d.carbs, 0));

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Text style={s.chartTitle}>7 הימים האחרונים</Text>

      <View style={s.chartWrap}>
        <BarChart data={days} target={target} C={C} />
      </View>

      {/* אגדה */}
      <View style={s.legendRow}>
        <View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: '#3a7a4a' }]} /><Text style={s.legendTxt}>ביעד</Text></View>
        <View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: '#ffd700' }]} /><Text style={s.legendTxt}>מתחת</Text></View>
        <View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: '#ef7d6c' }]} /><Text style={s.legendTxt}>מעל</Text></View>
        {target && <View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: '#3a7a4a', borderRadius: 1, height: 2 }]} /><Text style={s.legendTxt}>יעד {target} קק"ל</Text></View>}
      </View>

      {/* סיכום שבוע */}
      <View style={s.summaryCard}>
        <Text style={s.summaryTitle}>סיכום שבועי</Text>
        <View style={s.summaryRow}>
          <View style={s.summaryItem}>
            <Text style={[s.summaryVal, { color: '#3a7a4a' }]}>{avgCal}</Text>
            <Text style={s.summaryLbl}>ממוצע יומי</Text>
          </View>
        </View>
        <View style={s.summaryRow}>
          <View style={s.summaryItem}>
            <Text style={[s.summaryVal, { color: '#3a7a4a' }]}>{totalProt}g</Text>
            <Text style={s.summaryLbl}>חלבון</Text>
          </View>
          <View style={s.summaryItem}>
            <Text style={[s.summaryVal, { color: '#f0935f' }]}>{totalCarb}g</Text>
            <Text style={s.summaryLbl}>פחמימות</Text>
          </View>
          <View style={s.summaryItem}>
            <Text style={[s.summaryVal, { color: '#3a7a4a' }]}>{totalFat}g</Text>
            <Text style={s.summaryLbl}>שומן</Text>
          </View>
        </View>
      </View>

      {/* רשימת ימים */}
      {days.slice().reverse().map((d, i) => {
        if (!d.cal) return null;
        const isToday = d.dateStr === todayIsoLocal();
        return (
          <TouchableOpacity key={i} style={s.dayRow} onPress={() => onOpenDay(d.dateStr)}>
            <View style={s.dayRowRight}>
              <Text style={[s.dayRowDate, isToday && { color: '#3a7a4a' }]}>
                {new Date(d.dateStr + 'T12:00:00').toLocaleDateString('he-IL', { weekday:'short', day:'numeric', month:'short' })}
                {isToday ? ' (היום)' : ''}
              </Text>
              <Text style={s.dayRowMacros}>ח:{d.protein}g · פ:{d.carbs}g · ש:{d.fat}g</Text>
            </View>
            <View style={s.dayRowLeft}>
              <Text style={[s.dayRowCal, { color: !target ? '#3a7a4a' : d.cal >= target * 0.85 && d.cal <= target * 1.1 ? '#3a7a4a' : d.cal > target * 1.1 ? '#ef7d6c' : '#ffd700' }]}>
                {d.cal}
              </Text>
              <Text style={s.dayRowCalLbl}>קק"ל</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// ─── תצוגה חודשית ────────────────────────────────────────────────────────────
function MonthlyView({ history, target, C, s, year, month, onPrev, onNext, onOpenDay }) {
  const now = new Date();

  // אגרגציה לפי שבועות
  const daysInMon = new Date(year, month + 1, 0).getDate();
  const weeks = [];
  let wk = { label: 'ש1', total: 0, days: 0 };
  let wkNum = 1;
  for (let d = 1; d <= daysInMon; d++) {
    const ds = isoStr(year, month, d);
    const cal = history[ds]?.calories ?? 0;
    if (cal) { wk.total += cal; wk.days++; }
    const dow = new Date(year, month, d).getDay();
    if (dow === 6 || d === daysInMon) {
      if (wk.days > 0) weeks.push({ label: `ש${wkNum}`, cal: Math.round(wk.total / wk.days) });
      wkNum++;
      wk = { label: `ש${wkNum}`, total: 0, days: 0 };
    }
  }

  // ימים שנרשמו החודש
  const loggedDays = Array.from({ length: daysInMon }, (_, i) => {
    const ds = isoStr(year, month, i + 1);
    return history[ds] ? { dateStr: ds, d: i + 1, ...history[ds] } : null;
  }).filter(Boolean);

  const totalCal  = loggedDays.reduce((s, d) => s + d.calories, 0);
  const loggedCount = loggedDays.length;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View style={s.monthNav}>
        <TouchableOpacity onPress={onNext} style={s.navBtn}><Ionicons name="chevron-forward" size={22} color="#3a7a4a" /></TouchableOpacity>
        <Text style={s.monthLabel}>{MONTHS_HE[month]} {year}</Text>
        <TouchableOpacity onPress={onPrev} style={s.navBtn}><Ionicons name="chevron-back" size={22} color="#3a7a4a" /></TouchableOpacity>
      </View>

      {weeks.length > 0 && (
        <>
          <Text style={s.chartTitle}>ממוצע קלוריות יומי לפי שבוע</Text>
          <View style={s.chartWrap}>
            <BarChart data={weeks} target={target} C={C} />
          </View>
        </>
      )}

      {/* סיכום חודש */}
      {loggedCount > 0 && (
        <View style={s.summaryCard}>
          <Text style={s.summaryTitle}>סיכום חודשי</Text>
          <View style={s.summaryRow}>
            <View style={s.summaryItem}>
              <Text style={[s.summaryVal, { color: '#3a7a4a' }]}>{Math.round(totalCal / loggedCount)}</Text>
              <Text style={s.summaryLbl}>ממוצע יומי</Text>
            </View>
            <View style={s.summaryItem}>
              <Text style={[s.summaryVal, { color: '#3a7a4a' }]}>{loggedCount}</Text>
              <Text style={s.summaryLbl}>ימים נרשמו</Text>
            </View>
          </View>
        </View>
      )}

      {/* לוח שנה חודשי פשוט */}
      <Text style={[s.chartTitle, { marginTop: 8 }]}>לוח חודשי</Text>
      <CalendarGrid history={history} target={target} year={year} month={month} s={s} C={C} onOpenDay={onOpenDay} />
    </ScrollView>
  );
}

// ─── לוח שנה (grid) ──────────────────────────────────────────────────────────
function CalendarGrid({ history, target, year, month, s, C, onOpenDay }) {
  const now         = new Date();
  const todayStr    = todayIsoLocal();
  const firstDow    = new Date(year, month, 1).getDay();
  const daysInMon   = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMon; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const colorFor = (cal) => {
    if (!target) return '#3a7a4a';
    if (cal > target * 1.1) return '#ef7d6c';
    if (cal >= target * 0.85) return '#3a7a4a';
    return '#ffd700';
  };

  return (
    <>
      <View style={s.weekRow}>
        {DOW_HE.map((d, i) => <Text key={i} style={s.dowCell}>{d}</Text>)}
      </View>
      {weeks.map((week, wi) => (
        <View key={wi} style={s.weekRow}>
          {week.map((d, di) => {
            if (!d) return <View key={di} style={s.dayCell} />;
            const dateStr = isoStr(year, month, d);
            const day     = history[dateStr];
            const isToday = dateStr === todayStr;
            return (
              <TouchableOpacity key={di}
                style={[s.dayCell, day && s.dayCellActive, isToday && s.dayCellToday]}
                onPress={() => day && onOpenDay(dateStr)}
                activeOpacity={day ? 0.6 : 1}>
                <Text style={[s.dayNum, isToday && { color: '#3a7a4a', fontWeight: '800' }]}>{d}</Text>
                {day && <Text style={[s.dayCal, { color: colorFor(day.calories) }]}>{day.calories}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </>
  );
}

// ─── Main HistoryScreen ───────────────────────────────────────────────────────
export default function HistoryScreen({ navigation }) {
  const { C } = useTheme();
  const s = useMemo(() => makeS(C), [C]);
  const now = new Date();

  const [tab,     setTab]     = useState(0);   // 0=שבועי 1=חודשי
  const [year,    setYear]    = useState(now.getFullYear());
  const [month,   setMonth]   = useState(now.getMonth());
  const [history, setHistory] = useState({});
  const [target,  setTarget]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

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

  useEffect(() => { load(); }, [load]);

  const openDay = async (dateStr) => {
    const day = history[dateStr];
    if (!day) return;
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

  return (
      <View style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={26} color={C.text} /></TouchableOpacity>
          <Text style={s.title}>היסטוריית תזונה</Text>
        </View>

        {/* Tab bar */}
        <View style={s.tabBar}>
          {['שבועי', 'חודשי'].map((lbl, i) => (
            <TouchableOpacity key={i} style={[s.tabBtn, tab === i && s.tabBtnActive]} onPress={() => setTab(i)}>
              <Text style={[s.tabTxt, tab === i && s.tabTxtActive]}>{lbl}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={s.center}><ActivityIndicator size="large" color="#3a7a4a" /></View>
        ) : tab === 0 ? (
          <WeeklyView  history={history} target={target} C={C} s={s} onOpenDay={openDay} />
        ) : (
          <MonthlyView history={history} target={target} C={C} s={s}
            year={year} month={month} onPrev={prevMonth} onNext={nextMonth} onOpenDay={openDay} />
        )}

        {selected && <DayDetail selected={selected} onClose={() => setSelected(null)} />}
      </View>
  );
}

// ─── פרטי יום ────────────────────────────────────────────────────────────────
function DayDetail({ selected, onClose }) {
  const { C } = useTheme();
  const s = useMemo(() => makeS(C), [C]);
  const { date, entries, total } = selected;
  const dateLabel = new Date(date + 'T12:00:00')
    .toLocaleDateString('he-IL', { weekday:'long', day:'numeric', month:'long' });

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.detailOverlay}>
        <View style={s.detailSheet}>
          <View style={s.detailHandle} />
          <View style={s.detailHeader}>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={C.text} /></TouchableOpacity>
            <Text style={s.detailTitle}>{dateLabel}</Text>
          </View>
          <View style={s.totalsRow}>
            <Text style={s.totalsCal}>{total.calories} קק"ל</Text>
            <Text style={s.totalsMacros}>חלבון {total.protein}g · פחמ' {total.carbs}g · שומן {total.fat}g</Text>
          </View>
          <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ paddingBottom: 20 }}>
            {entries === null ? (
              <ActivityIndicator color="#3a7a4a" style={{ marginTop: 20 }} />
            ) : entries.length === 0 ? (
              <Text style={s.empty}>אין פירוט ארוחות ליום זה</Text>
            ) : entries.map((e, i) => (
              <View key={i} style={s.entryRow}>
                {e.image_url
                  ? <Image source={{ uri: e.image_url }} style={s.entryThumb} />
                  : <View style={[s.entryThumb, s.entryThumbEmpty]}><Ionicons name="restaurant-outline" size={16} color={C.placeholder} /></View>}
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

const makeS = (C) => StyleSheet.create({
  container:  { flex: 1, backgroundColor: C.bg },
  center:     { flex: 1, justifyContent: 'center', alignItems: 'center' },
  dragStrip:  { height: 52, width: '100%' },   // אזור גרירה ייעודי — מכסה את ה-safe-area העליון
  header:     { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.surface2 },
  title:      { color: C.text, fontSize: 20, fontWeight: '800' },

  tabBar:       { flexDirection: 'row', marginHorizontal: 16, marginVertical: 12, backgroundColor: C.surface2, borderRadius: 12, padding: 3 },
  tabBtn:       { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  tabBtnActive: { backgroundColor: C.surface },
  tabTxt:       { color: C.textMuted, fontSize: 14, fontWeight: '600' },
  tabTxtActive: { color: '#3a7a4a', fontWeight: '800' },

  chartTitle: { color: C.text, fontSize: 15, fontWeight: '700', textAlign: 'right', marginBottom: 10 },
  chartWrap:  { alignItems: 'center', backgroundColor: C.surface, borderRadius: 16, padding: 10, marginBottom: 12 },

  legendRow:  { flexDirection: 'row', justifyContent: 'flex-end', gap: 14, marginBottom: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot:  { width: 10, height: 10, borderRadius: 5 },
  legendTxt:  { color: C.textDim, fontSize: 11 },

  summaryCard:  { backgroundColor: C.surface, borderRadius: 16, padding: 16, marginBottom: 16 },
  summaryTitle: { color: C.text, fontSize: 15, fontWeight: '700', textAlign: 'right', marginBottom: 12 },
  summaryRow:   { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  summaryItem:  { alignItems: 'center' },
  summaryVal:   { fontSize: 20, fontWeight: '800' },
  summaryLbl:   { color: C.textMuted, fontSize: 11, marginTop: 2 },

  dayRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.surface, borderRadius: 12, padding: 14, marginBottom: 8 },
  dayRowRight:  { flex: 1, alignItems: 'flex-end' },
  dayRowDate:   { color: C.text, fontSize: 14, fontWeight: '600' },
  dayRowMacros: { color: C.textDim, fontSize: 11, marginTop: 2 },
  dayRowLeft:   { alignItems: 'center', minWidth: 52 },
  dayRowCal:    { fontSize: 18, fontWeight: '800' },
  dayRowCalLbl: { color: C.textDim, fontSize: 10 },

  monthNav:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  navBtn:      { padding: 8, backgroundColor: C.surface, borderRadius: 10 },
  monthLabel:  { color: C.text, fontSize: 18, fontWeight: '700' },

  weekRow:     { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 6 },
  dowCell:     { width: '13.5%', textAlign: 'center', color: C.textDim, fontSize: 13, fontWeight: '600' },
  dayCell:     { width: '13.5%', aspectRatio: 0.85, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dayCellActive:{ backgroundColor: C.surface },
  dayCellToday: { borderWidth: 1, borderColor: '#3a7a4a' },
  dayNum:      { color: C.textMuted, fontSize: 14 },
  dayCal:      { fontSize: 10, fontWeight: '700', marginTop: 2 },
  empty:       { color: C.textDim, fontSize: 14, textAlign: 'center', marginTop: 24, paddingHorizontal: 20, lineHeight: 22 },

  detailOverlay: { flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' },
  detailSheet:   { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  detailHandle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: C.surface3, alignSelf: 'center', marginBottom: 14 },
  detailHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  detailTitle:   { color: C.text, fontSize: 17, fontWeight: '700', flex: 1, textAlign: 'right', marginLeft: 12 },
  totalsRow:     { backgroundColor: C.surface2, borderRadius: 12, padding: 14, marginBottom: 14, alignItems: 'center' },
  totalsCal:     { color: '#3a7a4a', fontSize: 26, fontWeight: '800' },
  totalsMacros:  { color: C.textMuted, fontSize: 13, marginTop: 4 },
  entryRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border2 },
  entryThumb:    { width: 40, height: 40, borderRadius: 8 },
  entryThumbEmpty:{ backgroundColor: C.surface3, alignItems: 'center', justifyContent: 'center' },
  entryName:     { color: C.text, fontSize: 15, fontWeight: '600', textAlign: 'right' },
  entryMeta:     { color: C.textDim, fontSize: 12, textAlign: 'right' },
  entryCal:      { color: '#ffd700', fontSize: 15, fontWeight: '700', minWidth: 44 },
});
