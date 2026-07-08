// RevenueCat wrapper. Everything no-ops safely until a RevenueCat API key is
// set in app.json → extra.revenueCatKey, so the app runs normally before
// payments are configured. Entitlement id used for "Pro" access: "pro".
import Constants from 'expo-constants';
import Purchases from 'react-native-purchases';

const API_KEY = Constants.expoConfig?.extra?.revenueCatKey || '';
export const PURCHASES_ENABLED = !!API_KEY;
export const ENTITLEMENT_ID = 'pro';

let _configured = false;

export function initPurchases() {
  if (!PURCHASES_ENABLED || _configured) return;
  try {
    Purchases.configure({ apiKey: API_KEY });
    _configured = true;
  } catch (_) {}
}

// True when the user has an active "pro" entitlement.
export async function isPro() {
  if (!PURCHASES_ENABLED) return false;
  try {
    const info = await Purchases.getCustomerInfo();
    return !!info?.entitlements?.active?.[ENTITLEMENT_ID];
  } catch (_) {
    return false;
  }
}

// The current offering's packages (monthly/annual...), or [] when unavailable.
export async function getPackages() {
  if (!PURCHASES_ENABLED) return [];
  try {
    const offerings = await Purchases.getOfferings();
    return offerings?.current?.availablePackages || [];
  } catch (_) {
    return [];
  }
}

// Purchase a package. Returns { ok, pro, cancelled, error }.
export async function purchase(pkg) {
  if (!PURCHASES_ENABLED || !pkg) return { ok: false, error: 'unavailable' };
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { ok: true, pro: !!customerInfo?.entitlements?.active?.[ENTITLEMENT_ID] };
  } catch (e) {
    if (e?.userCancelled) return { ok: false, cancelled: true };
    return { ok: false, error: e?.message || 'purchase_failed' };
  }
}

// Restore previous purchases (Apple requires a visible restore action).
export async function restore() {
  if (!PURCHASES_ENABLED) return { ok: false, pro: false };
  try {
    const info = await Purchases.restorePurchases();
    return { ok: true, pro: !!info?.entitlements?.active?.[ENTITLEMENT_ID] };
  } catch (e) {
    return { ok: false, error: e?.message || 'restore_failed' };
  }
}
