import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const GREEN = '#3a7a4a';
const GOLD = '#e0a800';

const FEATURES = [
  { icon: 'camera', title: 'צילום מזון ללא הגבלה' },
  { icon: 'chatbubbles', title: 'צ׳אט Biti ללא הגבלה' },
  { icon: 'trending-up', title: 'תוכנית מסתגלת חכמה' },
  { icon: 'restaurant', title: 'מתכונים מותאמים אישית' },
  { icon: 'bar-chart', title: 'היסטוריה וניתוחים מלאים' },
];

const PLANS = {
  annual:  { label: 'שנתי',  price: '₪199', per: 'לשנה',  best: true },
  monthly: { label: 'חודשי', price: '₪29',  per: 'לחודש', best: false },
};

export default function PaywallScreen({ navigation }) {
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [plan, setPlan] = useState('annual');

  const startTrial = () => {
    // No real payment yet — this is where RevenueCat's purchase flow will go.
    Alert.alert(
      'בקרוב 🚀',
      'התשלום עדיין לא מחובר. כאן ייפתח חלון התשלום של ' +
        (Platform.OS === 'ios' ? 'App Store' : 'Google Play') +
        ' עם 7 ימי ניסיון חינם.',
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.close} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={26} color={C.textMuted} />
        </TouchableOpacity>

        <View style={styles.crown}>
          <Ionicons name="star" size={30} color={GOLD} />
        </View>
        <Text style={styles.title}>NutriSmart Pro</Text>

        {/* features */}
        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f.title} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon} size={20} color={GREEN} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>{f.title}</Text>
              </View>
              <Ionicons name="checkmark-circle" size={20} color={GREEN} />
            </View>
          ))}
        </View>

        {/* plan selector */}
        <View style={styles.plans}>
          {Object.entries(PLANS).map(([key, p]) => {
            const active = plan === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.planCard, active && styles.planCardActive]}
                onPress={() => setPlan(key)}
                activeOpacity={0.8}
              >
                {p.best && <View style={styles.bestBadge}><Text style={styles.bestTxt}>הכי משתלם</Text></View>}
                <View style={styles.planTop}>
                  <View style={[styles.radio, active && styles.radioActive]}>
                    {active && <View style={styles.radioDot} />}
                  </View>
                  <Text style={styles.planLabel}>{p.label}</Text>
                </View>
                <Text style={styles.planPrice}>{p.price} <Text style={styles.planPer}>{p.per}</Text></Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.cta} onPress={startTrial} activeOpacity={0.9}>
          <Text style={styles.ctaTxt}>התחל 7 ימים חינם</Text>
        </TouchableOpacity>
        <Text style={styles.ctaSub}>
          ניסיון חינם ל-7 ימים, ואז {PLANS[plan].price} {PLANS[plan].per}. ביטול בכל עת.
        </Text>

        <TouchableOpacity onPress={() => Alert.alert('שחזור רכישות', 'יחובר עם מערכת התשלום.')}>
          <Text style={styles.restore}>שחזור רכישה</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const makeStyles = (C) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  close: { position: 'absolute', top: 50, left: 16, zIndex: 10, padding: 6 },
  crown: { alignSelf: 'center', width: 64, height: 64, borderRadius: 20, backgroundColor: C.surface2,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  title: { fontSize: 30, fontWeight: '900', color: C.text, textAlign: 'center', marginBottom: 24 },

  features: { backgroundColor: C.surface, borderRadius: 16, padding: 8, borderWidth: 1, borderColor: C.border },
  featureRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, padding: 10 },
  featureIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.surface2,
    alignItems: 'center', justifyContent: 'center' },
  featureTitle: { fontSize: 15, fontWeight: '700', color: C.text, textAlign: 'right' },

  plans: { flexDirection: 'row', gap: 10, marginTop: 20 },
  planCard: { flex: 1, backgroundColor: C.surface, borderRadius: 16, padding: 14,
    borderWidth: 2, borderColor: C.border },
  planCardActive: { borderColor: GREEN, backgroundColor: C.surface2 },
  bestBadge: { position: 'absolute', top: -10, alignSelf: 'center', backgroundColor: GOLD,
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 2 },
  bestTxt: { fontSize: 11, fontWeight: '800', color: '#1a1a1a' },
  planTop: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginTop: 4 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: GREEN },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: GREEN },
  planLabel: { fontSize: 15, fontWeight: '700', color: C.text },
  planPrice: { fontSize: 22, fontWeight: '900', color: C.text, textAlign: 'right', marginTop: 8 },
  planPer: { fontSize: 13, fontWeight: '600', color: C.textMuted },

  cta: { backgroundColor: GREEN, borderRadius: 16, paddingVertical: 16, marginTop: 24, alignItems: 'center' },
  ctaTxt: { color: '#fff', fontSize: 17, fontWeight: '800' },
  ctaSub: { fontSize: 12, color: C.textMuted, textAlign: 'center', marginTop: 10, lineHeight: 18 },
  restore: { fontSize: 13, color: C.textMuted, textAlign: 'center', marginTop: 16,
    textDecorationLine: 'underline' },
});
