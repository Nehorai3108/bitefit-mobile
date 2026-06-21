import { useRef } from 'react';
import { PanResponder } from 'react-native';

const TAB_ORDER = ['בית', 'תזונה', 'צ׳אט', 'אימון', 'פרופיל'];

export function useSwipeNav(navigation, tabName) {
  const nameRef = useRef(tabName);
  nameRef.current = tabName;

  const panResponder = useRef(
    PanResponder.create({
      // מגיב רק להחלקה אופקית ברורה (dx גדול פי 2.5 מ-dy)
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 25 && Math.abs(gs.dx) > Math.abs(gs.dy) * 2.5,
      onPanResponderRelease: (_, gs) => {
        const idx = TAB_ORDER.indexOf(nameRef.current);
        if (gs.dx < -60 && idx < TAB_ORDER.length - 1) {
          // החלקה שמאלה → טאב הבא
          navigation.navigate(TAB_ORDER[idx + 1]);
        } else if (gs.dx > 60 && idx > 0) {
          // החלקה ימינה → טאב הקודם
          navigation.navigate(TAB_ORDER[idx - 1]);
        }
      },
    })
  ).current;

  return panResponder.panHandlers;
}
