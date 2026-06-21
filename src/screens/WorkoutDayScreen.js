import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const TYPE_COLOR = {
  strength: '#3a7a4a',
  running:  '#56bd6b',
  hiit:     '#ef7d6c',
  mixed:    '#f0a500',
};

function SectionHeader({ title, icon, color }) {
  return (
    <View style={[sh.row, { marginTop: 24, marginBottom: 10 }]}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={[sh.title, { color }]}>{title}</Text>
    </View>
  );
}

function WarmCoolCard({ item, C }) {
  return (
    <View style={[sh.warmCard, { backgroundColor: C.surface2 }]}>
      <Ionicons name={item.icon} size={18} color="#3a7a4a" style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        <Text style={[sh.warmName, { color: C.text }]}>{item.name}</Text>
        <Text style={[sh.warmDesc, { color: C.textMuted }]}>{item.desc}</Text>
      </View>
    </View>
  );
}

function ExerciseCard({ ex, index, color, C }) {
  const isRest = ex.rest === '-';
  return (
    <View style={[sh.card, { backgroundColor: C.surface, borderLeftColor: color }]}>
      {/* שורה עליונה: מספר + שם */}
      <View style={sh.cardTop}>
        <View style={[sh.num, { backgroundColor: color + '22' }]}>
          <Text style={[sh.numTxt, { color }]}>{index}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[sh.exName, { color: C.text }]}>{ex.name}</Text>
          {ex.muscles ? <Text style={[sh.muscles, { color: C.textMuted }]}>{ex.muscles}</Text> : null}
        </View>
      </View>

      {/* שורת סטים / חזרות / מנוחה */}
      <View style={sh.statsRow}>
        {ex.sets > 1 && (
          <View style={[sh.badge, { backgroundColor: color + '18' }]}>
            <Text style={[sh.badgeTxt, { color }]}>{ex.sets} סטים</Text>
          </View>
        )}
        <View style={[sh.badge, { backgroundColor: C.surface3 }]}>
          <Text style={[sh.badgeTxt, { color: C.text }]}>{ex.reps}</Text>
        </View>
        {!isRest && (
          <View style={[sh.badge, { backgroundColor: C.surface3 }]}>
            <Ionicons name="timer-outline" size={12} color={C.textMuted} />
            <Text style={[sh.badgeTxt, { color: C.textMuted }]}> מנוחה: {ex.rest}</Text>
          </View>
        )}
      </View>

      {/* טיפ טכני */}
      {ex.tip ? (
        <View style={[sh.tipBox, { backgroundColor: color + '10', borderColor: color + '30' }]}>
          <Ionicons name="bulb-outline" size={13} color={color} />
          <Text style={[sh.tipTxt, { color: C.textMuted }]}>{ex.tip}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function WorkoutDayScreen({ day, onClose }) {
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const color = TYPE_COLOR[day?.type] ?? '#3a7a4a';

  if (!day) return null;

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: color }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onClose}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.dayLabel}>{day.day}</Text>
          <Text style={styles.workoutName}>{day.name}</Text>
          <View style={styles.headerMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.85)" />
              <Text style={styles.metaTxt}>{day.duration} דקות</Text>
            </View>
            {day.muscles ? (
              <View style={styles.metaItem}>
                <Ionicons name="body-outline" size={14} color="rgba(255,255,255,0.85)" />
                <Text style={styles.metaTxt}>{day.muscles}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>

        {/* חימום */}
        {day.warmup?.length > 0 && (
          <>
            <SectionHeader title="חימום" icon="flash-outline" color="#f0a500" />
            {day.warmup.map((w, i) => <WarmCoolCard key={i} item={w} C={C} />)}
          </>
        )}

        {/* תרגילים */}
        <SectionHeader title="אימון" icon="barbell-outline" color={color} />
        {day.note ? (
          <View style={[styles.noteBox, { backgroundColor: color + '12', borderColor: color + '30' }]}>
            <Text style={[styles.noteTxt, { color: C.textMuted }]}>{day.note}</Text>
          </View>
        ) : null}
        {(day.exercises ?? []).map((ex, i) => (
          <ExerciseCard key={i} ex={ex} index={i + 1} color={color} C={C} />
        ))}

        {/* שחרור */}
        {day.cooldown?.length > 0 && (
          <>
            <SectionHeader title="שחרור" icon="leaf-outline" color="#56bd6b" />
            {day.cooldown.map((w, i) => <WarmCoolCard key={i} item={w} C={C} />)}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const sh = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title:    { fontSize: 13, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  warmCard: { flexDirection: 'row', gap: 12, borderRadius: 12, padding: 12, marginBottom: 8, alignItems: 'flex-start' },
  warmName: { fontSize: 14, fontWeight: '700', textAlign: 'right', marginBottom: 2 },
  warmDesc: { fontSize: 12, textAlign: 'right', lineHeight: 18 },
  card:     { borderRadius: 14, padding: 14, marginBottom: 10, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardTop:  { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 10 },
  num:      { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  numTxt:   { fontSize: 14, fontWeight: '800' },
  exName:   { fontSize: 16, fontWeight: '700', textAlign: 'right' },
  muscles:  { fontSize: 12, marginTop: 2, textAlign: 'right' },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  badge:    { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeTxt: { fontSize: 12, fontWeight: '600' },
  tipBox:   { flexDirection: 'row', gap: 6, borderWidth: 1, borderRadius: 8, padding: 8, alignItems: 'flex-start' },
  tipTxt:   { fontSize: 12, flex: 1, textAlign: 'right', lineHeight: 18 },
});

const makeStyles = (C) => StyleSheet.create({
  container: { flex: 1 },
  header:    { paddingTop: 56, paddingBottom: 20, paddingHorizontal: 16 },
  backBtn:   { marginBottom: 12 },
  headerContent: { gap: 4 },
  dayLabel:  { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '600', textAlign: 'right' },
  workoutName: { color: '#fff', fontSize: 22, fontWeight: '800', textAlign: 'right' },
  headerMeta: { flexDirection: 'row', gap: 16, marginTop: 6, justifyContent: 'flex-end' },
  metaItem:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaTxt:   { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '500' },
  noteBox:   { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 10 },
  noteTxt:   { fontSize: 13, textAlign: 'right', lineHeight: 19 },
});
