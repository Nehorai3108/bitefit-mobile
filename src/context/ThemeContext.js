import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── פלטות צבעים ─────────────────────────────────────────────────────────────

export const DARK = {
  bg:         '#0c1622',
  surface:    '#14212f',
  surface2:   '#1b2c3d',
  surface3:   '#23384c',
  border:     '#2e455c',
  border2:    '#1e2a44',
  text:       '#ffffff',
  textMuted:  '#888888',
  textDim:    '#666666',
  textFaint:  '#444444',
  placeholder:'#555555',
  inputBg:    '#2e455c',
  tabBar:     '#0e0e0e',
  tabBorder:  '#1b2c3d',
  overlay:    'rgba(0,0,0,0.6)',
  macroPanel: '#101010',
  logDot:     '#23384c',
};

export const LIGHT = {
  bg:         '#f0f5fb',
  surface:    '#ffffff',
  surface2:   '#e4edf8',
  surface3:   '#d3e3f0',
  border:     '#b0c8e0',
  border2:    '#c8daea',
  text:       '#0c1622',
  textMuted:  '#5d7489',
  textDim:    '#7a8ea0',
  textFaint:  '#9aafbe',
  placeholder:'#9aafbe',
  inputBg:    '#dce8f4',
  tabBar:     '#ffffff',
  tabBorder:  '#d0e0ee',
  overlay:    'rgba(0,0,0,0.4)',
  macroPanel: '#e4edf8',
  logDot:     '#d3e3f0',
};

// ─── Context ──────────────────────────────────────────────────────────────────

const ThemeContext = createContext({ C: DARK, isDark: true, toggle: () => {} });

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(true);

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
