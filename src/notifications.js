import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const KEY_FIRST_OPEN  = '@bitefit_first_open';
const KEY_NOTIF_SETUP = '@bitefit_notif_setup';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  false,
  }),
});

// בקשת הרשאה + החזרת סטטוס
export async function requestPermission() {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ביטול כל ההתראות המתוזמנות
export async function cancelAll() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// תזמון ההתראות היומיות
async function scheduleDailyReminders() {
  // תזכורת ארוחת צהריים — 14:00 בכל יום
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'NutriSmart',
      body: 'רשמת כבר ארוחת צהריים? אל תשכח לעקוב אחר התזונה שלך',
      sound: true,
    },
    trigger: {
      type: 'calendar',
      hour: 14,
      minute: 0,
      repeats: true,
    },
  });

  // תזכורת ארוחת ערב — 20:00 בכל יום
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'NutriSmart',
      body: 'סיימת לאכול היום? רשום את ארוחת הערב שלך ובדוק איך עמדת ביעד',
      sound: true,
    },
    trigger: {
      type: 'calendar',
      hour: 20,
      minute: 0,
      repeats: true,
    },
  });
}

// תזמון תזכורת שקילה שבועית
async function scheduleWeightReminder(firstOpenDate) {
  const daysSinceFirst = Math.floor((Date.now() - firstOpenDate) / 86400000);

  if (daysSinceFirst >= 7) {
    // שבוע עבר — מתזמן מיד ואז שבועי
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'NutriSmart — בדיקת התקדמות',
        body: 'שבוע שלם עם NutriSmart! הגיע הזמן לעלות על המאזניים ולעדכן את המשקל שלך. ראה כמה התקדמת!',
        sound: true,
      },
      trigger: {
        type: 'calendar',
        weekday: new Date(firstOpenDate).getDay() + 1, // אותו יום בשבוע
        hour: 9,
        minute: 0,
        repeats: true,
      },
    });
  } else {
    // עוד לא עבר שבוע — מתזמן לתאריך המדויק שבוע אחרי הפתיחה הראשונה
    const triggerDate = new Date(firstOpenDate + 7 * 86400000);
    triggerDate.setHours(9, 0, 0, 0);
    if (triggerDate > new Date()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'NutriSmart — שבוע ראשון!',
          body: 'שבוע שלם עם NutriSmart! הגיע הזמן לעלות על המאזניים ולרשום את המשקל שלך. ראה כמה התקדמת!',
          sound: true,
        },
        trigger: { date: triggerDate },
      });
    }
    // מהשבוע הבא — תזכורת שבועית
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'NutriSmart — מעקב משקל שבועי',
        body: 'הגיע הזמן לשקול את עצמך! רשום את המשקל הנוכחי ותראה את ההתקדמות שלך לאורך זמן',
        sound: true,
      },
      trigger: {
        type: 'calendar',
        weekday: new Date(firstOpenDate).getDay() + 1,
        hour: 9,
        minute: 30,
        repeats: true,
      },
    });
  }
}

// קריאה ראשית — קרא פעם אחת בהפעלת האפליקציה (מ-App.js)
export async function initNotifications() {
  if (Platform.OS === 'web') return;

  const granted = await requestPermission();
  if (!granted) return;

  // רשום תאריך פתיחה ראשונה
  let firstOpen = await AsyncStorage.getItem(KEY_FIRST_OPEN);
  if (!firstOpen) {
    firstOpen = String(Date.now());
    await AsyncStorage.setItem(KEY_FIRST_OPEN, firstOpen);
  }

  // הגדר התראות רק פעם אחת (או אחרי reset)
  const alreadySetup = await AsyncStorage.getItem(KEY_NOTIF_SETUP);
  if (alreadySetup) return;

  await cancelAll();
  await scheduleDailyReminders();
  await scheduleWeightReminder(parseInt(firstOpen));
  await AsyncStorage.setItem(KEY_NOTIF_SETUP, '1');
}

// reset (לצורך debug / settings)
export async function resetNotifications() {
  await AsyncStorage.removeItem(KEY_NOTIF_SETUP);
  await cancelAll();
  await initNotifications();
}
