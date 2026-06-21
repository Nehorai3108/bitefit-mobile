import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── פלטות צבעים ─────────────────────────────────────────────────────────────

export const DARK = {
  bg:         '#0e1a12',
  surface:    '#162218',
  surface2:   '#1e2e20',
  surface3:   '#263a28',
  border:     '#2e4a30',
  border2:    '#1e3020',
  text:       '#ffffff',
  textMuted:  '#88a88a',
  textDim:    '#668068',
  textFaint:  '#445846',
  placeholder:'#4a6a4c',
  inputBg:    '#2e4a30',
  tabBar:     '#0e1a12',
  tabBorder:  '#1e2e20',
  overlay:    'rgba(0,0,0,0.6)',
  macroPanel: '#101e12',
  logDot:     '#263a28',
};

export const LIGHT = {
  bg:         '#f2ede0',
  surface:    '#ffffff',
  surface2:   '#ede8db',
  surface3:   '#e4dece',
  border:     '#d0c8b0',
  border2:    '#ddd8c8',
  text:       '#1a1a1a',
  textMuted:  '#5a6a5a',
  textDim:    '#7a8a7a',
  textFaint:  '#9aaa9a',
  placeholder:'#9aaa9a',
  inputBg:    '#e8e2d4',
  tabBar:     '#ffffff',
  tabBorder:  '#e0d8c8',
  overlay:    'rgba(0,0,0,0.4)',
  macroPanel: '#ede8db',
  logDot:     '#e4dece',
};

// ─── Context ──────────────────────────────────────────────────────────────────

const ThemeContext = createContext({ C: DARK, isDark: true, toggle: () => {} });

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('@bitefit_theme').then(val => {
      if (val === 'light') setIsDark(false);
    });
  }, []);

  const toggle = () => {
    setIsDark(prev => {
      const next = !prev;
      AsyncStorage.setItem('@bitefit_theme', next ? 'dark' : 'light');
      return next;
    });
  };

  const value = useMemo(() => ({
    C: isDark ? DARK : LIGHT,
    isDark,
    toggle,
  }), [isDark]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
