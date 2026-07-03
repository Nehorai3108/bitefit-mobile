import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Switch, Alert, Linking, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { cancelAll, initNotifications } from '../notifications';

const NOTIF_KEY = '@notifications_enabled';
const TUTORIAL_KEY = '@tutorial_seen_v1';
const SUPPORT_EMAIL = 'dviryona8@gmail.com';

export default function SettingsScreen({ navigation }) {
  const { C, isDark, toggle } = useTheme();
  const { logout } = useAuth();
  const styles = useMemo(() => makeStyles(C), [C]);

  const [notif, setNotif] = useState(true);
  useEffect(() => {
    AsyncStorage.getItem(NOTIF_KEY).then(v => setNotif(v !== 'false')).catch(() => {});
  }, []);

  const toggleNotif = async (val) => {
    setNotif(val);
    try {
      await AsyncStorage.setItem(NOTIF_KEY, val ? 'true' : 'false');
      if (val) await initNotifications(); else await cancelAll();
    } catch {}
  };

  const contact = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=NutriSmart - פנייה`).catch(() =>
      Alert.alert('צור קשר', `כתוב לנו: ${SUPPORT_EMAIL}`));
  };

  const replayTutorial = async () => {
    try { await AsyncStorage.removeItem(TUTORIAL_KEY); } catch {}
    Alert.alert('הדרכה', 'ההדרכה תופיע מחדש בפעם הבאה שתפתח את האפליקציה.');
  };

  const cancelSub = () => {
    Alert.alert(
      'ביטול מנוי',
      'ביטול מנוי מתבצע דרך ההגדרות של App Store / Google Play:\n\nהגדרות → המנוי שלך → NutriSmart → ביטול.',
    );
  };

  const doLogout = () => {
    Alert.alert('התנתקות', 'להתנתק מהחשבון?', [
      { text: 'ביטול', style: 'cancel' },
      { text: 'התנתק', style: 'destructive', onPress: logout },
    ]);
  };

  const Row = ({ icon, label, color, children, onPress, danger }) => (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress} activeOpacity={onPress ? 0.6 : 1}>
      <View style={[styles.rowIcon, { backgroundColor: (color ?? C.textMuted) + '22' }]}>
        <Ionicons name={icon} size={19} color={color ?? C.textMuted} />
      </View>
      <Text style={[styles.rowLabel, danger && { color: '#ef7d6c' }]}>{label}</Text>
      {children ?? (onPress && <Ionicons name="chevron-back" size={18} color={C.textFaint} />)}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 6 }}>
          <Ionicons name="chevron-forward" size={26} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.title}>הגדרות</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.section}>תצוגה והתראות</Text>
        <View style={styles.card}>
          <Row icon={isDark ? 'moon' : 'sunny'} label="מצב כהה" color="#8e44ad">
            <Switch value={isDark} onValueChange={toggle} trackColor={{ true: '#111114' }} />
          </Row>
          <View style={styles.sep} />
          <Row icon="notifications" label="התראות" color="#2e86de">
            <Switch value={notif} onValueChange={toggleNotif} trackColor={{ true: '#111114' }} />
          </Row>
        </View>

        <Text style={styles.section}>מנוי</Text>
        <View style={styles.card}>
          <Row icon="star" label="שדרג ל-NutriSmart Pro" color="#e0a800"
               onPress={() => navigation.navigate('Paywall')} />
          <View style={styles.sep} />
          <Row icon="close-circle-outline" label="ביטול מנוי" onPress={cancelSub} />
        </View>

        <Text style={styles.section}>כללי</Text>
        <View style={styles.card}>
          <Row icon="help-circle" label="צפה בהדרכה שוב" color="#2e86de" onPress={replayTutorial} />
          <View style={styles.sep} />
          <Row icon="mail" label="צור קשר" color="#111114" onPress={contact} />
          <View style={styles.sep} />
          <Row icon="log-out-outline" label="התנתקות" danger onPress={doLogout} />
        </View>

        <Text style={styles.version}>NutriSmart · גרסה 1.0</Text>
      </ScrollView>
    </View>
  );
}

const makeStyles = (C) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 54, paddingHorizontal: 12, paddingBottom: 12 },
  title: { color: C.text, fontSize: 20, fontWeight: '800' },
  section: { color: C.textMuted, fontSize: 13, fontWeight: '700', textAlign: 'right',
    marginTop: 18, marginBottom: 8, marginRight: 4 },
  card: { backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  row: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, padding: 14 },
  rowIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, color: C.text, fontSize: 16, fontWeight: '600', textAlign: 'right' },
  sep: { height: 1, backgroundColor: C.border, marginRight: 62 },
  version: { color: C.textFaint, fontSize: 13, textAlign: 'center', marginTop: 28 },
});
