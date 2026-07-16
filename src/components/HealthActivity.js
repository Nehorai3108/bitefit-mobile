// Compact "today's activity" strip fed by Apple Health (iPhone + Apple Watch):
// steps and active calories. Renders nothing when Health is unavailable or has
// no data, so it never shows an empty box.
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { HEALTH_AVAILABLE, getTodaySteps, getTodayActiveEnergy } from '../health';
import { useTheme } from '../context/ThemeContext';

export default function HealthActivity() {
  const { C } = useTheme();
  const s = makeS(C);
  const [steps, setSteps] = useState(0);
  const [active, setActive] = useState(0);

  useFocusEffect(useCallback(() => {
    if (!HEALTH_AVAILABLE) return;
    let alive = true;
    (async () => {
      const [st, ac] = await Promise.all([getTodaySteps(), getTodayActiveEnergy()]);
      if (alive) { setSteps(st); setActive(ac); }
    })();
    return () => { alive = false; };
  }, []));

  if (!HEALTH_AVAILABLE || (!steps && !active)) return null;

  return (
    <View style={s.card}>
      <View style={s.item}>
        <Ionicons name="footsteps" size={18} color="#2e86de" />
        <Text style={s.val}>{steps.toLocaleString()}</Text>
        <Text style={s.lbl}>צעדים</Text>
      </View>
      <View style={s.divider} />
      <View style={s.item}>
        <Ionicons name="flame" size={18} color="#ef7d6c" />
        <Text style={s.val}>{active}</Text>
        <Text style={s.lbl}>קק"ל פעילות</Text>
      </View>
      <View style={s.divider} />
      <View style={s.item}>
        <Ionicons name="heart" size={18} color="#e0245e" />
        <Text style={s.lbl}>Apple Health</Text>
      </View>
    </View>
  );
}

const makeS = (C) => StyleSheet.create({
  card: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-around',
    backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border,
    paddingVertical: 12, paddingHorizontal: 8, marginBottom: 12,
  },
  item: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5 },
  val: { fontSize: 15, fontWeight: '800', color: C.text },
  lbl: { fontSize: 12, color: C.textMuted, fontWeight: '600' },
  divider: { width: 1, height: 22, backgroundColor: C.border },
});
