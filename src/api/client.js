import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notifyDataChanged } from '../refreshBus';
import { setWaking } from '../serverWaking';

// עוטף תוצאה של פעולת כתיבה — מודיע למסכים שהנתונים השתנו (רענון אוטומטי)
const _notify = (data) => { notifyDataChanged(); return data; };

// Production API — מתארח ב-Render (24/7, לא תלוי במחשב המקומי).
// להרצה מול שרת מקומי בפיתוח: שנה ל-'http://localhost:8000' או ל-Tailscale IP.
export const API_BASE = 'https://bitefit-api.onrender.com';

const api = axios.create({
  baseURL: API_BASE,
  // Render free tier "נרדם" אחרי חוסר פעילות ומתעורר ב-~50 שניות (cold start).
  // timeout גבוה כדי שהבקשה הראשונה אחרי שינה לא תיכשל לפני שהשרת מתעורר.
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Auto token-refresh on 401 ──────────────────────────────────────────────
// ה-JWT של Supabase פג אחרי שעה. כשהאפליקציה נפתחת אחרי כמה שעות, ה-token פג
// וכל בקשה מחזירה 401. ה-interceptor הזה מרענן את ה-token אוטומטית ומריץ
// מחדש את הבקשה — בלי שהמשתמש ירגיש. אם גם ה-refresh נכשל → מנקה ומחזיר ל-login.
const TOKEN_KEY   = '@bitefit_token';
const REFRESH_KEY = '@bitefit_refresh';

// callback שמוגדר מ-AuthContext כדי לאלץ logout כשה-refresh נכשל
let _onAuthFailure = null;
export const setAuthFailureHandler = (fn) => { _onAuthFailure = fn; };

let _refreshing = null;  // מונע מספר רענונים במקביל

async function refreshAccessToken() {
  if (_refreshing) return _refreshing;
  _refreshing = (async () => {
    const refreshToken = await AsyncStorage.getItem(REFRESH_KEY);
    if (!refreshToken) throw new Error('no refresh token');
    // קריאה נקייה (לא דרך api) כדי לא להיתפס שוב ב-interceptor
    const res = await axios.post(`${API_BASE}/auth/refresh`,
      { refresh_token: refreshToken }, { timeout: 20000 });
    const newToken = res.data.access_token;
    const newRefresh = res.data.refresh_token || refreshToken;
    await AsyncStorage.multiSet([[TOKEN_KEY, newToken], [REFRESH_KEY, newRefresh]]);
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    return newToken;
  })();
  try { return await _refreshing; }
  finally { _refreshing = null; }
}

// ─── זיהוי "השרת מתעורר" (cold start) ────────────────────────────────────────
// סופרים בקשות פעילות; אם בקשה כלשהי נמשכת >4 שניות מניחים שהשרת מתעורר ומציגים
// באנר. כשכל הבקשות הסתיימו — מורידים אותו.
let _inflight = 0;
let _wakeTimer = null;
function _reqStart() {
  _inflight++;
  if (!_wakeTimer) _wakeTimer = setTimeout(() => setWaking(true), 4000);
}
function _reqEnd() {
  _inflight = Math.max(0, _inflight - 1);
  if (_inflight === 0) {
    if (_wakeTimer) { clearTimeout(_wakeTimer); _wakeTimer = null; }
    setWaking(false);
  }
}
api.interceptors.request.use((cfg) => { _reqStart(); return cfg; });

api.interceptors.response.use(
  (response) => { _reqEnd(); return response; },
  async (error) => {
    _reqEnd();
    const original = error.config;
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      try {
        const newToken = await refreshAccessToken();
        original.headers['Authorization'] = `Bearer ${newToken}`;
        return api(original);  // הרץ מחדש את הבקשה המקורית
      } catch (e) {
        if (_onAuthFailure) await _onAuthFailure();  // הוצא את המשתמש למסך login
      }
    }
    return Promise.reject(error);
  }
);

// LOCAL date (phone timezone), not UTC. The server stamps entries with Israel
// local date; using toISOString() (UTC) caused a date mismatch near midnight,
// making just-logged food appear "missing". getMonth/getDate are local.
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Daily menu
export const fetchDailyPlan = () =>
  api.get('/daily-menu/plan').then(r => r.data);

// Full-day plan: one recipe per meal, optimized to hit the day's macro targets.
export const fetchFullDayPlan = (seed = 0) =>
  api.get('/daily-menu/full-day-plan', { params: { seed } }).then(r => r.data);

// Weekly plan: 7 macro-optimized days.
export const fetchWeeklyPlan = (seed = 0) =>
  api.get('/daily-menu/weekly-plan', { params: { seed } }).then(r => r.data);

// Swap a single meal for an alternative at the same calorie target.
export const swapMeal = (mealType, targetCalories, excludeRecipeId, seed = 0) =>
  api.get(`/daily-menu/swap-meal/${mealType}`, {
    params: { target_calories: targetCalories, exclude_recipe_id: excludeRecipeId, seed },
  }).then(r => r.data);

export const fetchMealSuggestions = (mealType, targetCalories, seed = 0) =>
  api.get(`/daily-menu/suggestions/${mealType}`, {
    params: { target_calories: targetCalories, seed }
  }).then(r => r.data);

// Search any recipe by name, scaled to a meal's calorie target
export const searchMealRecipes = (q, targetCalories) =>
  api.get('/daily-menu/search', {
    params: { q, target_calories: targetCalories }
  }).then(r => r.data);

// Recipes
export const fetchRecipes = (search = '') =>
  api.get('/recipes/', { params: search ? { q: search } : {} }).then(r => r.data);

// Profile
export const fetchProfile = () =>
  api.get('/profile/').then(r => r.data);

export const fetchProfileTargets = () =>
  api.get('/profile/targets').then(r => r.data);

export const saveProfile = (data) =>
  api.put('/profile/', data).then(r => r.data);

// Permanently delete the account and all its data (App Store requirement).
export const deleteAccount = () =>
  api.delete('/profile/account').then(r => r.data);

// Weight tracking — synced to the cloud so it survives a device change.
export const fetchWeightLog = () =>
  api.get('/weight-log/').then(r => r.data);

export const addWeightEntry = (date, kg) =>
  api.post('/weight-log/', { date, kg }).then(r => r.data);

// Water — GET uses date path param, POST to /water/
export const fetchWater = () =>
  api.get(`/water/${today()}`).then(r => r.data);

export const addWater = (amount_ml = 250) =>
  api.post('/water/', { amount_ml, date: today() }).then(r => r.data).then(_notify);

// Chat — includes history array
export const chatMessage = (message, history = []) =>
  api.post('/chat/', { message, history }).then(r => r.data).then(_notify);

// Streaming chat: onChunk(text) fires as Biti types; onDone(payload) at the end
// with the processed reply + food_data/recipe/actions.
export const chatMessageStream = (message, history, onChunk, onDone) =>
  new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/chat/?stream=true`);
    xhr.setRequestHeader('Content-Type', 'application/json');
    const auth = api.defaults.headers.common['Authorization'];
    if (auth) xhr.setRequestHeader('Authorization', auth);
    let idx = 0, done = false;
    const pump = () => {
      const buf = xhr.responseText;
      let nl;
      while ((nl = buf.indexOf('\n\n', idx)) !== -1) {
        const line = buf.slice(idx, nl).split('\n').find(l => l.startsWith('data: '));
        idx = nl + 2;
        if (!line) continue;
        try {
          const ev = JSON.parse(line.slice(6));
          if (ev.t === 'c') onChunk?.(ev.d);
          else if (ev.t === 'done') { done = true; onDone?.(ev); }
        } catch {}
      }
    };
    xhr.onreadystatechange = () => {
      if (xhr.readyState >= 3) pump();
      if (xhr.readyState === 4) {
        if (!done) onDone?.({ reply: xhr.status ? '' : 'שגיאה בחיבור', food_data: null, recipe: null });
        resolve();
      }
    };
    xhr.onerror = () => { if (!done) onDone?.({ reply: 'שגיאה בחיבור', food_data: null, recipe: null }); resolve(); };
    xhr.send(JSON.stringify({ message, history }));
  });

// Proactive daily insight from Biti (data-driven)
export const fetchDailyInsight = () =>
  api.get('/chat/insight').then(r => r.data);

// Barcode
export const lookupBarcode = (barcode) =>
  api.get(`/barcode/${barcode}`).then(r => r.data);

// Food search
export const searchFoodNutrition = (q) =>
  api.get('/food-log/search-food', { params: { q } }).then(r => r.data);

// Food log
export const fetchFoodLogSummary = () =>
  api.get(`/food-log/${today()}/summary`).then(r => r.data);

export const fetchFoodLog = () =>
  api.get(`/food-log/${today()}`).then(r => r.data);

export const fetchFoodLogByDate = (dateIso) =>
  api.get(`/food-log/${dateIso}`).then(r => r.data);

export const fetchFoodLogSummaryByDate = (dateIso) =>
  api.get(`/food-log/${dateIso}/summary`).then(r => r.data);

// History — per-day calorie totals for the last N days (calendar view)
export const fetchFoodHistory = (days = 35) =>
  api.get('/food-log/history', { params: { days } }).then(r => r.data);

export const addFoodEntry = (entry) =>
  api.post('/food-log/', entry).then(r => r.data).then(_notify);

export const deleteFoodEntry = (entryId) =>
  api.delete(`/food-log/${entryId}`).then(r => r.data).then(_notify);

// Recently logged foods (for one-tap re-logging)
export const fetchRecentFoods = (limit = 12) =>
  api.get('/food-log/recents', { params: { limit } }).then(r => r.data);

// Workouts
export const addWorkout = (entry) =>
  api.post('/workout/', entry).then(r => r.data).then(_notify);

export const fetchWorkouts = (dateIso) => {
  const t = dateIso ?? new Date().toISOString().split('T')[0];
  return api.get(`/workout/${t}`).then(r => r.data);
};

export const fetchWorkoutSummary = (dateIso) => {
  const t = dateIso ?? new Date().toISOString().split('T')[0];
  return api.get(`/workout/${t}/summary`).then(r => r.data);
};

export const deleteWorkout = (entryId) =>
  api.delete(`/workout/${entryId}`).then(r => r.data).then(_notify);

// Inventory
export const fetchInventory = () =>
  api.get('/inventory/').then(r => r.data);

export const addInventoryItem = (item) =>
  api.post('/inventory/', item).then(r => r.data).then(_notify);

export const deleteInventoryItem = (itemId) =>
  api.delete(`/inventory/${itemId}`).then(r => r.data).then(_notify);

export const addInventoryBulk = (items) =>
  api.post('/inventory/bulk', { items }).then(r => r.data).then(_notify);

export const fetchCookSuggestions = () =>
  api.get('/inventory/cook').then(r => r.data);

// Adaptation Engine — יעד יומי מותאם + מאזן שבועי
export const fetchDayTarget = () =>
  api.get('/adaptation/day-target').then(r => r.data).catch(() => null);

export const fetchWeekSummary = () =>
  api.get('/adaptation/week-summary').then(r => r.data).catch(() => null);

export const recordDayIntake = (consumed_calories) =>
  api.post('/adaptation/record-day', { consumed_calories }).then(r => r.data).catch(() => null);

export const fetchMealSubtargets = () =>
  api.get('/adaptation/meal-subtargets').then(r => r.data).catch(() => null);

// Meal balance — מאזן קלורי חכם פר-ארוחה
export const fetchMealBalance = (dateIso) => {
  const t = dateIso ?? new Date().toISOString().split('T')[0];
  return api.get(`/meal-balance/${t}`).then(r => r.data);
};

export const moveMealCalories = (fromMeal, toMeal, amount, dateIso) => {
  const t = dateIso ?? new Date().toISOString().split('T')[0];
  return api.post(`/meal-balance/${t}/move`, { from_meal: fromMeal, to_meal: toMeal, amount })
    .then(r => r.data).then(_notify);
};

export const resetMealBalance = (dateIso) => {
  const t = dateIso ?? new Date().toISOString().split('T')[0];
  return api.delete(`/meal-balance/${t}`).then(r => r.data).then(_notify);
};

// בניית headers ל-multipart כולל ה-token. בלי זה השרת (Supabase) מחזיר 401.
function _multipartHeaders() {
  const h = {};
  const auth = api.defaults.headers.common['Authorization'];
  if (auth) h['Authorization'] = auth;
  // ב-native צריך לציין content-type; ב-web נותנים לדפדפן לקבוע את ה-boundary
  if (Platform.OS !== 'web') h['Content-Type'] = 'multipart/form-data';
  return h;
}

export const scanReceipt = async (imageUri) => {
  const formData = new FormData();
  if (Platform.OS === 'web') {
    const blob = await (await fetch(imageUri)).blob();
    formData.append('file', blob, 'receipt.jpg');
  } else {
    formData.append('file', { uri: imageUri, name: 'receipt.jpg', type: 'image/jpeg' });
  }
  const res = await axios.post(`${API_BASE}/inventory/scan-receipt`, formData, {
    headers: _multipartHeaders(),
    timeout: 90000,
  });
  return res.data;
};

// Camera — multipart form upload (cross-platform: web needs a real Blob, native uses {uri} shape)
export const identifyFood = async (imageUri) => {
  const formData = new FormData();
  if (Platform.OS === 'web') {
    const blob = await (await fetch(imageUri)).blob();
    formData.append('file', blob, 'food.jpg');
  } else {
    formData.append('file', { uri: imageUri, name: 'food.jpg', type: 'image/jpeg' });
  }
  const res = await axios.post(`${API_BASE}/camera/identify`, formData, {
    headers: _multipartHeaders(),
    timeout: 90000,  // cold start + Groq vision
  });
  return res.data;
};

// Transcribe a voice recording to Hebrew text (Groq Whisper).
export const transcribeAudio = async (audioUri) => {
  const formData = new FormData();
  if (Platform.OS === 'web') {
    const blob = await (await fetch(audioUri)).blob();
    formData.append('file', blob, 'audio.m4a');
  } else {
    formData.append('file', { uri: audioUri, name: 'audio.m4a', type: 'audio/m4a' });
  }
  const res = await axios.post(`${API_BASE}/chat/transcribe`, formData, {
    headers: _multipartHeaders(),
    timeout: 60000,
  });
  return res.data;   // { text }
};

export default api;
