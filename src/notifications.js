// Local notifications are temporarily disabled for the iOS App Store build.
// expo-notifications forces the aps-environment (Push) entitlement, which needs
// APNs push credentials set up in Apple (blocked until the Apple ID password is
// reset). We keep the same exported surface so callers (App.js, SettingsScreen)
// don't break. Re-enable by restoring expo-notifications + the config plugin and
// setting up push credentials.

export async function requestPermission() {
  return false;
}

export async function cancelAll() {}

export async function initNotifications() {}

export async function resetNotifications() {}
