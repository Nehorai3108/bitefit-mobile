import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Tailscale IP of the dev machine — bypasses AP Isolation on the router.
// Works whenever both PC and iPhone have Tailscale connected (same account).
const TAILSCALE_IP = '100.65.59.37';

function resolveDevHost() {
  return TAILSCALE_IP;
}

export const API_BASE = Platform.OS === 'web'
  ? 'http://localhost:8000'
  : `http://${resolveDevHost()}:8000`;

const api = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

const today = () => new Date().toISOString().split('T')[0];

// Daily menu
export const fetchDailyPlan = () =>
  api.get('/daily-menu/plan').then(r => r.data);

export const fetchMealSuggestions = (mealType, targetCalories, seed = 0) =>
  api.get(`/daily-menu/suggestions/${mealType}`, {
    params: { target_calories: targetCalories, seed }
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

// Water — GET uses date path param, POST to /water/
export const fetchWater = () =>
  api.get(`/water/${today()}`).then(r => r.data);

export const addWater = (amount_ml = 250) =>
  api.post('/water/', { amount_ml, date: today() }).then(r => r.data);

// Chat — includes history array
export const chatMessage = (message, history = []) =>
  api.post('/chat/', { message, history }).then(r => r.data);

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
export const fetchFoodLogSummary = () => {
  const t = new Date().toISOString().split('T')[0];
  return api.get(`/food-log/${t}/summary`).then(r => r.data);
};

export const fetchFoodLog = () => {
  const t = new Date().toISOString().split('T')[0];
  return api.get(`/food-log/${t}`).then(r => r.data);
};

export const fetchFoodLogByDate = (dateIso) =>
  api.get(`/food-log/${dateIso}`).then(r => r.data);

// History — per-day calorie totals for the last N days (calendar view)
export const fetchFoodHistory = (days = 35) =>
  api.get('/food-log/history', { params: { days } }).then(r => r.data);

export const addFoodEntry = (entry) =>
  api.post('/food-log/', entry).then(r => r.data);

export const deleteFoodEntry = (entryId) =>
  api.delete(`/food-log/${entryId}`).then(r => r.data);

// Recently logged foods (for one-tap re-logging)
export const fetchRecentFoods = (limit = 12) =>
  api.get('/food-log/recents', { params: { limit } }).then(r => r.data);

// Workouts
export const addWorkout = (entry) =>
  api.post('/workout/', entry).then(r => r.data);

export const fetchWorkouts = (dateIso) => {
  const t = dateIso ?? new Date().toISOString().split('T')[0];
  return api.get(`/workout/${t}`).then(r => r.data);
};

export const fetchWorkoutSummary = (dateIso) => {
  const t = dateIso ?? new Date().toISOString().split('T')[0];
  return api.get(`/workout/${t}/summary`).then(r => r.data);
};

export const deleteWorkout = (entryId) =>
  api.delete(`/workout/${entryId}`).then(r => r.data);

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
    // On web, let the browser set the multipart boundary header automatically.
    headers: Platform.OS === 'web' ? {} : { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  });
  return res.data;
};

export default api;
