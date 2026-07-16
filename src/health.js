// Apple Health (HealthKit) wrapper. iOS-only; every function no-ops safely on
// Android or if the native module is missing, so the app never crashes.
// The Apple Watch writes steps/energy/weight/workouts into Health automatically,
// and we read them here — no watchOS app needed.
import { Platform } from 'react-native';

let AppleHealthKit = null;
try {
  if (Platform.OS === 'ios') AppleHealthKit = require('react-native-health').default;
} catch (_) {
  AppleHealthKit = null;
}

export const HEALTH_AVAILABLE = Platform.OS === 'ios' && !!AppleHealthKit;

const P = AppleHealthKit?.Constants?.Permissions || {};
const PERMISSIONS = {
  permissions: {
    read: [P.StepCount, P.ActiveEnergyBurned, P.Weight, P.Workout].filter(Boolean),
    write: [P.Weight].filter(Boolean),
  },
};

const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

// Ask the user to grant Health access. Resolves true on success.
export function connectHealth() {
  return new Promise((resolve) => {
    if (!HEALTH_AVAILABLE) return resolve(false);
    try {
      AppleHealthKit.initHealthKit(PERMISSIONS, (err) => resolve(!err));
    } catch (_) { resolve(false); }
  });
}

// Steps recorded today (from iPhone + Apple Watch). Returns 0 on failure.
export function getTodaySteps() {
  return new Promise((resolve) => {
    if (!HEALTH_AVAILABLE) return resolve(0);
    try {
      AppleHealthKit.getStepCount({ date: startOfToday().toISOString() },
        (err, res) => resolve(err ? 0 : Math.round(res?.value || 0)));
    } catch (_) { resolve(0); }
  });
}

// Active energy burned today (kcal) — the Watch's "move" calories.
export function getTodayActiveEnergy() {
  return new Promise((resolve) => {
    if (!HEALTH_AVAILABLE) return resolve(0);
    try {
      AppleHealthKit.getActiveEnergyBurned(
        { startDate: startOfToday().toISOString(), endDate: new Date().toISOString() },
        (err, res) => {
          if (err || !Array.isArray(res)) return resolve(0);
          resolve(Math.round(res.reduce((s, x) => s + (x.value || 0), 0)));
        });
    } catch (_) { resolve(0); }
  });
}

// Most recent weight in kg (e.g. from a smart scale that syncs to Health), or null.
export function getLatestWeightKg() {
  return new Promise((resolve) => {
    if (!HEALTH_AVAILABLE) return resolve(null);
    try {
      AppleHealthKit.getLatestWeight({ unit: 'gram' }, (err, res) => {
        if (err || !res?.value) return resolve(null);
        resolve(Math.round((res.value / 1000) * 10) / 10);   // grams → kg (1 decimal)
      });
    } catch (_) { resolve(null); }
  });
}

// Workouts in the last `days` days: [{ type, calories, minutes, start }].
export function getRecentWorkouts(days = 7) {
  return new Promise((resolve) => {
    if (!HEALTH_AVAILABLE) return resolve([]);
    try {
      const startDate = new Date(Date.now() - days * 864e5).toISOString();
      AppleHealthKit.getAnchoredWorkouts({ startDate }, (err, res) => {
        const data = res?.data || res;
        if (err || !Array.isArray(data)) return resolve([]);
        resolve(data.map(w => ({
          type: w.activityName || w.activityId || 'workout',
          calories: Math.round(w.calories || 0),
          minutes: Math.round((w.duration || 0) / 60),
          start: w.start,
        })));
      });
    } catch (_) { resolve([]); }
  });
}

// Write a weight sample back to Health (keeps the scale/Watch in sync).
export function saveWeightKg(kg) {
  return new Promise((resolve) => {
    if (!HEALTH_AVAILABLE || !kg) return resolve(false);
    try {
      AppleHealthKit.saveWeight({ value: kg * 1000, unit: 'gram' },
        (err) => resolve(!err));
    } catch (_) { resolve(false); }
  });
}
