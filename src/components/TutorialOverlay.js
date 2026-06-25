import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions, Animated, Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';

const TUTORIAL_KEY = '@tutorial_seen_v1';

// Each step explains one part of the app. `arrow` optionally points the card at a
// screen region ('bottom' = the hidden nav pill at the bottom center).
const STEPS = [
  {
    icon: 'sparkles', color: '#e0a800',
    title: 'ברוך הבא ל-NutriSmart 👋',
    body: 'בוא נעשה סיור קצר ונראה לך איפה לוחצים כדי לעשות כל דבר. לוקח 20 שניות.',
  },
  {
    icon: 'chevron-up-circle', color: '#3a7a4a', arrow: 'bottom',
    title: 'התפריט מוסתר למטה',
    body: 'רואה את הקו הירוק בתחתית המסך? החלק אותו כלפי מעלה (או הקש עליו) כדי לפתוח את תפריט הניווט.',
  },
  {
    icon: 'apps', color: '#2e86de',
    title: '5 מסכים ראשיים',
    body: 'בתפריט תמצא: בית (סיכום יומי) · תזונה (מתכונים) · צ׳אט · אימון · פרופיל. הקש על כל אחד כדי לעבור אליו.',
  },
  {
    icon: 'add-circle', color: '#3a7a4a',
    title: 'הוספת אוכל ➕',
    body: 'כפתור "הוסף" בתפריט פותח 3 דרכים לתעד ארוחה: לצלם את המנה במצלמה, לסרוק ברקוד, או להוסיף ידנית.',
  },
  {
    icon: 'chatbubbles', color: '#8e44ad',
    title: 'צ׳אט חכם',
    body: 'במסך הצ׳אט פשוט כתוב "אכלתי חביתה ופיתה" — וזה יירשם אוטומטית ליומן. אפשר גם לשאול כל שאלה תזונתית.',
  },
  {
    icon: 'settings', color: '#5a6a5a',
    title: 'הגדרות ⚙️',
    body: 'בפרופיל, גלגל השיניים למעלה פותח הגדרות: מצב כהה/בהיר, התראות, מנוי וצור קשר.',
  },
];

export default function TutorialOverlay({ onClose }) {
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [step, setStep] = useState(0);
  const bounce = useRef(new Animated.Value(0)).current;

  // Bouncing arrow for the "swipe up the green pill" step.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: -14, duration: 600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0,   duration: 600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const finish = async () => {
    try { await AsyncStorage.setItem(TUTORIAL_KEY, 'true'); } catch {}
    onClose();
  };

  const s = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={finish}>
      <View style={styles.backdrop}>
        {/* Pointer to the hidden nav pill at the bottom */}
        {s.arrow === 'bottom' && (
          <Animated.View style={[styles.bottomArrow, { transform: [{ translateY: bounce }] }]}>
            <Ionicons name="chevron-up" size={40} color="#3a7a4a" />
            <View style={styles.pillGhost} />
          </Animated.View>
        )}

        <View style={styles.card}>
          <TouchableOpacity style={styles.skip} onPress={finish} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.skipTxt}>דלג</Text>
          </TouchableOpacity>

          <View style={[styles.iconCircle, { backgroundColor: s.color + '22' }]}>
            <Ionicons name={s.icon} size={34} color={s.color} />
          </View>

          <Text style={styles.title}>{s.title}</Text>
          <Text style={styles.body}>{s.body}</Text>

          {/* Progress dots */}
          <View style={styles.dots}>
            {STEPS.map((_, i) => (
              <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
            ))}
          </View>

          <View style={styles.actions}>
            {step > 0 && (
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep(step - 1)}>
                <Text style={styles.backTxt}>הקודם</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.nextBtn} onPress={() => (isLast ? finish() : setStep(step + 1))}>
              <Text style={styles.nextTxt}>{isLast ? 'בוא נתחיל 🥗' : 'הבא'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Show the tutorial once for new users. Returns [visible, dismiss].
export function useTutorial(enabled) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    AsyncStorage.getItem(TUTORIAL_KEY)
      .then(v => { if (v !== 'true') setShow(true); })
      .catch(() => {});
  }, [enabled]);
  return [show, () => setShow(false)];
}

const { width } = Dimensions.get('window');

const makeStyles = (C) => StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { width: Math.min(width - 48, 380), backgroundColor: C.surface, borderRadius: 22, padding: 24,
    alignItems: 'center', borderWidth: 1, borderColor: C.border },
  skip: { position: 'absolute', top: 14, left: 16, padding: 4, zIndex: 2 },
  skipTxt: { color: C.textMuted, fontSize: 14, fontWeight: '600' },
  iconCircle: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center', marginTop: 8, marginBottom: 16 },
  title: { color: C.text, fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 10 },
  body: { color: C.textMuted, fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: 20 },
  dots: { flexDirection: 'row', gap: 6, marginBottom: 22 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.border },
  dotActive: { backgroundColor: '#3a7a4a', width: 20 },
  actions: { flexDirection: 'row-reverse', gap: 10, width: '100%' },
  nextBtn: { flex: 1, backgroundColor: '#3a7a4a', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  nextTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
  backBtn: { paddingHorizontal: 18, borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.surface2 },
  backTxt: { color: C.textMuted, fontSize: 15, fontWeight: '700' },
  bottomArrow: { position: 'absolute', bottom: 70, alignSelf: 'center', alignItems: 'center' },
  pillGhost: { width: 60, height: 6, borderRadius: 3, backgroundColor: '#3a7a4a', marginTop: 6 },
});
