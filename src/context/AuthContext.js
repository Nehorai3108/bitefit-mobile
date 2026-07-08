import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { setAuthFailureHandler } from '../api/client';

const AuthContext = createContext(null);

const TOKEN_KEY     = '@bitefit_token';
const REFRESH_KEY   = '@bitefit_refresh';
const USER_KEY      = '@bitefit_user';
const ONBOARD_KEY   = '@bitefit_onboarded';

export function AuthProvider({ children }) {
  const [token,        setToken]        = useState(null);
  const [user,         setUser]         = useState(null);
  const [onboarded,    setOnboarded]    = useState(false);
  const [isLoading,    setIsLoading]    = useState(true);

  // Restore session on startup
  useEffect(() => {
    // כשגם ה-refresh נכשל (refresh token פג / נדחה) — מנקה ומחזיר ל-login
    setAuthFailureHandler(async () => { await logout(); });
    (async () => {
      try {
        const [t, u, ob] = await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY, ONBOARD_KEY]);
        const savedToken = t[1];
        const savedUser  = u[1] ? JSON.parse(u[1]) : null;
        const savedOb    = ob[1] === 'true';
        if (savedToken) {
          api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
          setToken(savedToken);
          setUser(savedUser);
          setOnboarded(savedOb);
        }
      } catch (_) {}
      finally { setIsLoading(false); }
    })();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    await _persist(res.data.access_token, res.data.refresh_token, { id: res.data.user_id, email: res.data.email });
    return res.data;
  };

  const signup = async (email, password, name) => {
    const res = await api.post('/auth/signup', { email, password, name });
    // When the project requires email confirmation there's no session yet —
    // don't persist a null token; the screen tells the user to check their mail.
    if (res.data.access_token) {
      await _persist(res.data.access_token, res.data.refresh_token, { id: res.data.user_id, email: res.data.email });
    }
    return res.data;
  };

  const resetPassword = async (email) => {
    await api.post('/auth/reset-password', { email });
  };

  const markOnboarded = async () => {
    await AsyncStorage.setItem(ONBOARD_KEY, 'true');
    setOnboarded(true);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_KEY, USER_KEY, ONBOARD_KEY]);
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    setOnboarded(false);
  };

  const _persist = async (t, refresh, u) => {
    api.defaults.headers.common['Authorization'] = `Bearer ${t}`;
    const pairs = [[TOKEN_KEY, t], [USER_KEY, JSON.stringify(u)]];
    if (refresh) pairs.push([REFRESH_KEY, refresh]);
    await AsyncStorage.multiSet(pairs);
    setToken(t);
    setUser(u);
  };

  return (
    <AuthContext.Provider value={{ token, user, onboarded, isLoading, login, signup, resetPassword, logout, markOnboarded }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
