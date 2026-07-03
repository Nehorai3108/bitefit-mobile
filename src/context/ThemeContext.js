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
  bg:         '#ffffff',
  surface:    '#f7f7f8',
  surface2:   '#f4f4f6',
  surface3:   '#ececee',
  border:     '#e8e8ea',
  border2:    '#f0f0f2',
  text:       '#0b0b0c',
  textMuted:  '#6b6b70',
  textDim:    '#8a8a8e',
  textFaint:  '#b0b0b5',
  placeholder:'#a0a0a5',
  inputBg:    '#f4f4f6',
  tabBar:     '#ffffff',
  tabBorder:  '#ececee',
  overlay:    'rgba(0,0,0,0.4)',
  macroPanel: '#f7f7f8',
  logDot:     '#ececee',
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
