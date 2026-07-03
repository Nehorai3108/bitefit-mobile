import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions, Animated, Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { openAddSheet } from '../tutorialBridge';

const TUTORIAL_KEY = '@tutorial_seen_v1';
const ACCENT = '#3a7a4a';

// Light, calm walkthrough. One consistent accent, short copy, no emojis.
// `arrow: 'bottom'` points the card at the hidden nav pill. The last step is
// interactive — it drops the user straight into the real "add food" flow.
const STEPS = [
  {
    icon: 'leaf-outline',
    title: 'ברוך הבא ל-NutriSmart',
    body: 'סיור קצר שיראה לך איפה לוחצים. אפשר לדלג בכל רגע.',
  },
  {
    icon: 'chevron-up', arrow: 'bottom',
    title: 'התפריט נמצא למטה',
    body: 'החלק את הקו הירוק כלפי מעלה כדי לפתוח את הניווט.',
  },
  {
    icon: 'grid-outline',
    title: 'חמישה מסכים',
    body: 'בית, תזונה, צ׳אט, אימון ופרופיל — מעבר ביניהם דרך התפריט.',
  },
  {
    icon: 'chatbubble-outline',
    title: 'צ׳אט חכם',
    body: 'כתוב "אכלתי חביתה ופיתה" והצ׳אט ירשום את זה ליומן.',
  },
  {
    icon: 'add',
    title: 'נסה להוסיף ארוחה',
    body: 'תורך. נפתח את חלון ההוספה ותתעד את הארוחה הראשונה שלך.',
    cta: 'פתח הוספה',
    interactive: true,
  },
];

export default function TutorialOverlay({ onClose }) {
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [step, setStep] = useState(0);
  const bounce = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, [step]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: -12, duration: 650, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0,   duration: 650, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const finish = async (thenOpenAdd = false) => {
    try { await AsyncStorage.setItem(TUTORIAL_KEY, 'true'); } catch {}
    onClose();
    if (thenOpenAdd) setTimeout(openAddSheet, 350);
  };

  const s = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const next = () => (isLast ? finish(s.interactive) : setStep(step + 1));

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => finish(false)}>
      <View style={styles.backdrop}>
        {s.arrow === 'bottom' && (
          <Animated.View style={[styles.bottomArrow, { transform: [{ translateY: bounce }] }]}>
            <Ionicons name="chevron-up" size={32} color={ACCENT} />
            <View style={styles.pillGhost} />
          </Animated.View>
        )}

        <Animated.View style={[styles.card, { opacity: fade }]}>
          <TouchableOpacity style={styles.skip} onPress={() => finish(false)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.skipTxt}>דלג</Text>
          </TouchableOpacity>

          <View style={styles.iconWrap}>
            <Ionicons name={s.icon} size={26} color={ACCENT} />
          </View>

          <Text style={styles.title}>{s.title}</Text>
          <Text style={styles.body}>{s.body}</Text>

          <View style={styles.dots}>
            {STEPS.map((_, i) => (
              <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
            ))}
          </View>

          <TouchableOpacity style={styles.nextBtn} onPress={next} activeOpacity={0.85}>
            <Text style={styles.nextTxt}>{s.cta ?? (isLast ? 'סיום' : 'הבא')}</Text>
          </TouchableOpacity>

          {step > 0 && !isLast && (
            <TouchableOpacity style={styles.backLink} onPress={() => setStep(step - 1)}>
              <Text style={styles.backTxt}>הקודם</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

// Show the tutorial once for new users.
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
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 28 },
  card: { width: Math.min(width - 56, 340), backgroundColor: C.surface, borderRadius: 24, paddingHorizontal: 24,
    paddingTop: 28, paddingBottom: 20, alignItems: 'center' },
  skip: { position: 'absolute', top: 16, left: 18, padding: 2, zIndex: 2 },
  skipTxt: { color: C.textFaint, fontSize: 13, fontWeight: '600' },
  iconWrap: { width: 52, height: 52, borderRadius: 26, backgroundColor: ACCENT + '14',
    alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  title: { color: C.text, fontSize: 19, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  body: { color: C.textMuted, fontSize: 14.5, lineHeight: 21, textAlign: 'center', marginBottom: 22 },
  dots: { flexDirection: 'row', gap: 6, marginBottom: 20 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.border },
  dotActive: { backgroundColor: ACCENT, width: 18 },
  nextBtn: { width: '100%', backgroundColor: ACCENT, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  nextTxt: { color: '#fff', fontSize: 15.5, fontWeight: '800' },
  backLink: { paddingVertical: 10 },
  backTxt: { color: C.textFaint, fontSize: 13.5, fontWeight: '600' },
  bottomArrow: { position: 'absolute', bottom: 64, alignSelf: 'center', alignItems: 'center' },
  pillGhost: { width: 56, height: 5, borderRadius: 3, backgroundColor: ACCENT, marginTop: 4, opacity: 0.8 },
});
