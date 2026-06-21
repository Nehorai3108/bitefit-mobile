import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import ExerciseIllustration from '../components/ExerciseIllustration';

const TYPE_COLOR = {
  strength: '#3a7a4a',
  running:  '#56bd6b',
  hiit:     '#ef7d6c',
  mixed:    '#f0a500',
};

// אייקון לפי שם תרגיל
function exIcon(name = '') {
  if (/ריצה|ספרינט|הליכ/.test(name))   return 'walk-outline';
  if (/סקוואט|לגפרס|לאנג|רגל|עגל|בולגר/.test(name)) return 'footsteps-outline';
  if (/דדליפט|חתיר|פולאפ|פולי|גב/.test(name))       return 'git-pull-request-outline';
  if (/לחיצת חזה|פרפר|מקבילים/.test(name))           return 'barbell-outline';
  if (/כתפיי|לחיצת כתפיים/.test(name))               return 'body-outline';
  if (/ביצפס|טריצפס|פטיש|כפיפות/.test(name))        return 'hand-left-outline';
  if (/פלאנק|בטן|ליבה|סיבוב|הרמ|קיפול|טיפוס/.test(name)) return 'ellipse-outline';
  if (/חימום|שחרור|מתיח|נשימ/.test(name))             return 'flash-outline';
  if (/ברפי|אינטרוול|High|AMRAP|טאבאטה/.test(name))  return 'flame-outline';
  return 'fitness-outline';
}

function SectionHeader({ title, icon, color }) {
  return (
    <View style={[sh.secRow, { marginTop: 24, marginBottom: 10 }]}>
      <Text style={[sh.secTitle, { color }]}>{title}</Text>
      <Ionicons name={icon} size={16} color={color} />
    </View>
  );
}

function WarmCoolCard({ item, C }) {
  return (
    <View style={[sh.warmCard, { backgroundColor: C.surface2 }]}>
      <View style={{ flex: 1 }}>
        <Text style={[sh.warmName, { color: C.text }]}>{item.name}</Text>
        <Text style={[sh.warmDesc, { color: C.textMuted }]}>{item.desc}</Text>
      </View>
      <Ionicons name={item.icon} size={20} color="#3a7a4a" />
    </View>
  );
}

function ExerciseCard({ ex, index, color, C }) {
  const [expanded, setExpanded] = useState(false);
  const showRest = ex.rest && ex.rest !== '-';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => setExpanded(v => !v)}
      style={[sh.card, { backgroundColor: C.surface, borderRightColor: color }]}
    >
      {/* שורה עליונה */}
      <View style={sh.cardTop}>
        <View style={[sh.num, { backgroundColor: color + '20' }]}>
          <Text style={[sh.numTxt, { color }]}>{index}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[sh.exName, { color: C.text }]}>{ex.name}</Text>
          {ex.muscles ? <Text style={[sh.muscles, { color: C.textMuted }]}>{ex.muscles}</Text> : null}
        </View>
        {/* איור קטן */}
        <View style={[sh.illCircle, { backgroundColor: color + '10' }]}>
          <ExerciseIllustration name={ex.name} color={color} size={52} />
        </View>
      </View>

      {/* שורת נתונים */}
      <View style={sh.dataRow}>
        {ex.sets > 1 && (
          <View style={[sh.chip, { backgroundColor: color + '18' }]}>
            <Ionicons name="layers-outline" size={11} color={color} />
            <Text style={[sh.chipTxt, { color }]}>{ex.sets} סטים</Text>
          </View>
        )}
        <View style={[sh.chip, { backgroundColor: C.surface3 }]}>
          <Ionicons name="repeat-outline" size={11} color={C.textMuted} />
          <Text style={[sh.chipTxt, { color: C.text }]}>{ex.reps}</Text>
        </View>
        {showRest && (
          <View style={[sh.chip, { backgroundColor: C.surface3 }]}>
            <Ionicons name="timer-outline" size={11} color={C.textMuted} />
            <Text style={[sh.chipTxt, { color: C.textMuted }]}>{ex.rest}</Text>
          </View>
        )}
        <View style={{ flex: 1 }} />
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={C.textMuted} />
      </View>

      {/* פירוט מורחב */}
      {expanded && (
        <View style={[sh.expandBox, { borderTopColor: C.border2 }]}>
          {ex.tip ? (
            <View style={[sh.tipBox, { backgroundColor: color + '0d', borderColor: color + '33' }]}>
              <Text style={[sh.tipLabel, { color }]}>טכניקה: </Text>
              <Text style={[sh.tipTxt, { color: C.textMuted }]}>{ex.tip}</Text>
            </View>
          ) : null}
          {ex.sets > 1 && (
            <View style={[sh.howToBox, { backgroundColor: C.surface2 }]}>
              <Text style={[sh.howToTitle, { color: C.text }]}>איך לבצע:</Text>
              <Text style={[sh.howToTxt, { color: C.textMuted }]}>
                {'בצע ' + ex.sets + ' סטים של ' + ex.reps + (showRest ? '. מנוחה ' + ex.rest + ' בין סטים.' : '.')}
              </Text>
              {showRest && (
                <Text style={[sh.howToTxt, { color: C.textMuted, marginTop: 4 }]}>
                  במהלך המנוחה — תנשום עמוק ותתכונן לסט הבא.
                </Text>
              )}
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
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
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerBody}>
          <Text style={styles.dayLabel}>{day.day}</Text>
          <Text style={styles.workoutName}>{day.name}</Text>
          <View style={styles.headerMeta}>
            <View style={styles.metaChip}>
              <Text style={styles.metaTxt}>{day.duration} דק'</Text>
              <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.8)" />
            </View>
            {day.muscles ? (
              <View style={styles.metaChip}>
                <Text style={styles.metaTxt}>{day.muscles}</Text>
                <Ionicons name="body-outline" size={13} color="rgba(255,255,255,0.8)" />
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 48 }}>

        {day.warmup?.length > 0 && (
          <>
            <SectionHeader title="חימום" icon="flash-outline" color="#f0a500" />
            {day.warmup.map((w, i) => <WarmCoolCard key={i} item={w} C={C} />)}
          </>
        )}

        <SectionHeader title="תרגילים" icon="barbell-outline" color={color} />
        {day.note ? (
          <View style={[styles.noteBox, { backgroundColor: color + '10', borderColor: color + '30' }]}>
            <Text style={[styles.noteTxt, { color: C.textMuted }]}>{day.note}</Text>
          </View>
        ) : null}
        {(day.exercises ?? []).map((ex, i) => (
          <ExerciseCard key={i} ex={ex} index={i + 1} color={color} C={C} />
        ))}

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
  secRow:     { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  secTitle:   { fontSize: 13, fontWeight: '800', letterSpacing: 0.4 },
  warmCard:   { flexDirection: 'row-reverse', gap: 12, borderRadius: 12, padding: 14, marginBottom: 8, alignItems: 'center' },
  warmName:   { fontSize: 14, fontWeight: '700', textAlign: 'right', marginBottom: 2 },
  warmDesc:   { fontSize: 12, textAlign: 'right', lineHeight: 18 },

  card:       { borderRadius: 14, padding: 14, marginBottom: 10, borderRightWidth: 4,
                shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 5, elevation: 2 },
  cardTop:    { flexDirection: 'row-reverse', gap: 10, alignItems: 'center', marginBottom: 10 },
  illCircle:  { width: 58, height: 58, borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  num:        { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  numTxt:     { fontSize: 13, fontWeight: '800' },
  exName:     { fontSize: 15, fontWeight: '700', textAlign: 'right' },
  muscles:    { fontSize: 12, marginTop: 2, textAlign: 'right' },

  dataRow:    { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  chip:       { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  chipTxt:    { fontSize: 12, fontWeight: '600' },

  expandBox:  { borderTopWidth: 1, marginTop: 10, paddingTop: 10, gap: 8 },
  tipBox:     { flexDirection: 'row-reverse', gap: 4, borderWidth: 1, borderRadius: 10, padding: 10, alignItems: 'flex-start' },
  tipLabel:   { fontSize: 12, fontWeight: '700' },
  tipTxt:     { fontSize: 12, flex: 1, textAlign: 'right', lineHeight: 18 },
  howToBox:   { borderRadius: 10, padding: 10 },
  howToTitle: { fontSize: 13, fontWeight: '700', textAlign: 'right', marginBottom: 4 },
  howToTxt:   { fontSize: 12, textAlign: 'right', lineHeight: 18 },
});

const makeStyles = (C) => StyleSheet.create({
  container:   { flex: 1 },
  header:      { paddingTop: 54, paddingBottom: 20, paddingHorizontal: 16 },
  backBtn:     { marginBottom: 10 },
  headerBody:  { gap: 4, alignItems: 'flex-end' },
  dayLabel:    { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600' },
  workoutName: { color: '#fff', fontSize: 22, fontWeight: '800', textAlign: 'right' },
  headerMeta:  { flexDirection: 'row-reverse', gap: 12, marginTop: 6 },
  metaChip:    { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  metaTxt:     { color: '#fff', fontSize: 12, fontWeight: '600' },
  noteBox:     { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 10 },
  noteTxt:     { fontSize: 13, textAlign: 'right', lineHeight: 20 },
});
