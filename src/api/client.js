import axios from 'axios';

export const API_BASE = 'http://localhost:8000';

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

export const addFoodEntry = (entry) =>
  api.post('/food-log/', entry).then(r => r.data);

// Camera — multipart form upload
export const identifyFood = async (imageUri) => {
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    name: 'food.jpg',
    type: 'image/jpeg',
  });
  const res = await axios.post(`${API_BASE}/camera/identify`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  });
  return res.data;
};

export default api;
