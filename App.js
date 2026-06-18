import React, { useState, useRef, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import {
  TouchableOpacity, View, Modal, Text, StyleSheet,
  Pressable, TextInput, ActivityIndicator, Alert,
  ScrollView, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen      from './src/screens/auth/LoginScreen';
import SignupScreen     from './src/screens/auth/SignupScreen';
import OnboardingScreen from './src/screens/onboarding/OnboardingScreen';

import DashboardScreen from './src/screens/DashboardScreen';
import HomeScreen      from './src/screens/HomeScreen';
import ChatScreen      from './src/screens/ChatScreen';
import WorkoutScreen   from './src/screens/WorkoutScreen';
import ProfileScreen   from './src/screens/ProfileScreen';
import { searchFoodNutrition, addFoodEntry, identifyFood, lookupBarcode, fetchRecentFoods } from './src/api/client';

const Tab = createBottomTabNavigator();

const MEAL_TYPES = [
  { key: 'BREAKFAST',       label: 'בוקר' },
  { key: 'MORNING_SNACK',   label: 'חטיף בוקר' },
  { key: 'LUNCH',           label: 'צהריים' },
  { key: 'AFTERNOON_SNACK', label: 'חטיף צ׳' },
  { key: 'DINNER',          label: 'ערב' },
  { key: 'EVENING_SNACK',   label: 'חטיף ערב' },
];

// ─── Meal Chip Row ─────────────────────────────────────────────────────────────
function MealChips({ value, onChange }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
      {MEAL_TYPES.map(m => (
        <TouchableOpacity key={m.key}
          style={[s.mealChip, value === m.key && s.mealChipActive]}
          onPress={() => onChange(m.key)}>
          <Text style={[s.mealChipTxt, value === m.key && s.mealChipTxtActive]}>{m.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ─── Manual Entry Modal ────────────────────────────────────────────────────────
function ManualEntryModal({ visible, onClose }) {
  const [query, setQuery]   = useState('');
  const [grams, setGrams]   = useState('100');
  const [meal, setMeal]     = useState('LUNCH');
  const [food, setFood]     = useState(null);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  const reset = () => { setQuery(''); setGrams('100'); setMeal('LUNCH'); setFood(null); };
  const close = () => { reset(); onClose(); };

  const search = async () => {
    if (!query.trim()) return;
    setSearching(true); setFood(null);
    try {
      const res = await searchFoodNutrition(query.trim());
      if (res.found) setFood(res);
      else Alert.alert('לא נמצא', 'נסה שם אחר או בעברית');
    } catch { Alert.alert('שגיאה', 'לא הצלחתי לחפש'); }
    finally { setSearching(false); }
  };

  const save = async () => {
    if (!food) return;
    const g = parseFloat(grams) || 100;
    setSaving(true);
    try {
      await addFoodEntry({
        food_id:   food.food_id,
        food_name: food.name_he,
        grams:     g,
        calories:  Math.round(food.calories_per_100g * g / 100),
        protein:   Math.round(food.protein_per_100g  * g / 100 * 10) / 10,
        carbs:     Math.round(food.carbs_per_100g    * g / 100 * 10) / 10,
        fat:       Math.round(food.fat_per_100g      * g / 100 * 10) / 10,
        meal_type: meal,
        image_url: food.image_url ?? null,
      });
      Alert.alert('נשמר!', `${food.name_he} נוסף לתזונה`);
      close();
    } catch { Alert.alert('שגיאה', 'לא הצלחתי לשמור'); }
    finally { setSaving(false); }
  };

  const g = parseFloat(grams) || 100;
  const cal = food ? Math.round(food.calories_per_100g * g / 100) : 0;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Pressable style={s.overlay} onPress={close} />
        <View style={s.sheet}>
          <View style={s.sheetHandle} />
          <Text style={s.sheetTitle}>חיפוש ידני</Text>

          <View style={s.searchRow}>
            <TouchableOpacity style={s.searchBtn} onPress={search}>
              {searching
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.searchBtnTxt}>חפש</Text>}
            </TouchableOpacity>
            <TextInput
              style={s.input}
              placeholder="שם מזון בעברית..."
              placeholderTextColor="#444"
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={search}
              returnKeyType="search"
              textAlign="right"
            />
          </View>

          {food && (
            <View style={s.foodCard}>
              <Text style={s.foodName}>{food.name_he}</Text>
              <Text style={s.foodMeta}>{food.calories_per_100g} קק"ל / 100g</Text>
              <View style={s.gramsRow}>
                <Text style={s.calBig}>{cal} קק"ל</Text>
                <View style={s.gramsInput}>
                  <TextInput
                    style={s.gramsField}
                    value={grams}
                    onChangeText={setGrams}
                    keyboardType="numeric"
                    textAlign="center"
                  />
                  <Text style={s.gramsLbl}>גרם</Text>
                </View>
              </View>
              <MealChips value={meal} onChange={setMeal} />
              <TouchableOpacity style={s.saveBtn} onPress={save} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnTxt}>הוסף לתזונה</Text>}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Barcode Scan Modal ────────────────────────────────────────────────────────
function BarcodeScanModal({ visible, onClose }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState('scan');   // 'scan' | 'loading' | 'result'
  const [result, setResult] = useState(null);
  const [meal, setMeal]   = useState('LUNCH');
  const [saving, setSaving] = useState(false);
  const lastScan = useRef(0);

  useEffect(() => {
    if (visible) {
      setPhase('scan'); setResult(null);
      if (!permission?.granted) requestPermission();
    }
  }, [visible]);

  const handleScan = async ({ data }) => {
    const now = Date.now();
    if (now - lastScan.current < 3000) return;
    lastScan.current = now;
    setPhase('loading');
    try {
      const res = await lookupBarcode(data);
      if (res.found) { setResult({ barcode: data, ...res.food }); setPhase('result'); }
      else { Alert.alert('לא נמצא', `ברקוד ${data} לא קיים במאגר`); setPhase('scan'); }
    } catch { Alert.alert('שגיאה', 'לא ניתן לחפש ברקוד'); setPhase('scan'); }
  };

  const handleAdd = async () => {
    if (!result) return;
    setSaving(true);
    try {
      await addFoodEntry({
        food_id:   result.food_id ?? result.barcode,
        food_name: result.name_he ?? result.name_en,
        grams:     result.serving_g ?? 100,
        calories:  result.calories,
        protein:   result.protein,
        carbs:     result.carbs,
        fat:       result.fat,
        meal_type: meal,
      });
      Alert.alert('נוסף!', 'המוצר נוסף לתזונה');
      onClose();
    } catch { Alert.alert('שגיאה', 'לא הצלחתי להוסיף'); }
    finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>

        {/* Camera scan phase */}
        {phase === 'scan' && (
          <>
            {permission?.granted ? (
              <CameraView
                style={StyleSheet.absoluteFillObject}
                onBarcodeScanned={handleScan}
                barcodeScannerSettings={{ barcodeTypes: ['ean13','ean8','upc_a','upc_e','code128','code39','qr'] }}
              />
            ) : (
              <View style={s.center}>
                <Text style={{ color: '#fff' }}>צריך הרשאת מצלמה</Text>
                <TouchableOpacity onPress={requestPermission} style={[s.saveBtn, { marginTop: 16 }]}>
                  <Text style={s.saveBtnTxt}>הרשה גישה</Text>
                </TouchableOpacity>
              </View>
            )}
            <View style={s.scanOverlay}>
              <View style={s.scanFrame} />
              <Text style={s.scanHint}>כוון לברקוד</Text>
            </View>
            <TouchableOpacity style={s.closeOverlayBtn} onPress={onClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </>
        )}

        {/* Loading phase */}
        {phase === 'loading' && (
          <View style={s.center}>
            <ActivityIndicator size="large" color="#4F8EF7" />
            <Text style={{ color: '#888', marginTop: 12 }}>מחפש מוצר...</Text>
          </View>
        )}

        {/* Result phase */}
        {phase === 'result' && result && (
          <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 60 }}>
            <TouchableOpacity onPress={onClose} style={s.backBtn}>
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>

            <Text style={s.productName}>{result.name_he ?? result.name_en}</Text>
            <Text style={{ color: '#666', textAlign: 'right', marginBottom: 16 }}>לכל 100 גרם</Text>

            <View style={s.macrosGrid}>
              {[
                { label: 'קק"ל', val: result.calories,         color: '#ffd700' },
                { label: 'חלבון', val: `${result.protein}g`,   color: '#4F8EF7' },
                { label: "פחמ'",  val: `${result.carbs}g`,     color: '#4CAF50' },
                { label: 'שומן',  val: `${result.fat}g`,       color: '#ff6b6b' },
              ].map(m => (
                <View key={m.label} style={s.macroBox}>
                  <Text style={[s.macroNum, { color: m.color }]}>{m.val}</Text>
                  <Text style={s.macroLbl}>{m.label}</Text>
                </View>
              ))}
            </View>

            <MealChips value={meal} onChange={setMeal} />

            <TouchableOpacity style={s.saveBtn} onPress={handleAdd} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnTxt}>הוסף לתזונה</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={[s.saveBtn, { backgroundColor: '#1e1e1e', marginTop: 10 }]}
              onPress={() => setPhase('scan')}>
              <Text style={[s.saveBtnTxt, { color: '#888' }]}>סרוק שוב</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

// ─── Camera Photo Modal (CameraView-based, same as barcode scanner) ───────────
function CameraPhotoModal({ visible, onClose }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState('camera'); // 'camera' | 'processing' | 'results'
  const [items, setItems] = useState([]);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [meal, setMeal]   = useState('LUNCH');
  const [saving, setSaving] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    if (visible) { setPhase('camera'); setItems([]); setPhotoUrl(null); }
  }, [visible]);

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, base64: false });
      setPhase('processing');
      const r = await identifyFood(photo.uri);
      setPhotoUrl(r.image_url ?? null);
      if (r.items?.length > 0) {
        // Keep the AI's original values as a base so editing grams scales cleanly.
        setItems(r.items.map(it => {
          const g = Math.max(5, Math.round(it.grams ?? 100));
          return {
            ...it, grams: g,
            baseGrams: g, baseCal: it.calories ?? 0,
            baseProt: it.protein ?? 0, baseCarbs: it.carbs ?? 0, baseFat: it.fat ?? 0,
          };
        }));
        setPhase('results');
      } else {
        Alert.alert('לא זוהה', r.error ?? 'לא נמצאו פריטי מזון בתמונה');
        setPhase('camera');
      }
    } catch (e) {
      Alert.alert('שגיאה', 'לא ניתן לצלם או לנתח');
      setPhase('camera');
    }
  };

  const handleAddAll = async () => {
    setSaving(true);
    try {
      for (const item of items) {
        await addFoodEntry({
          food_id:   item.name ?? 'camera_food',
          food_name: item.name_he ?? item.name ?? 'מזון מצולם',
          grams:     item.grams ?? 100,
          calories:  item.calories ?? 0,
          protein:   item.protein ?? 0,
          carbs:     item.carbs ?? 0,
          fat:       item.fat ?? 0,
          meal_type: meal,
          image_url: photoUrl,
        });
      }
      Alert.alert('נוסף!', 'הארוחה נוספה לתזונה');
      onClose();
    } catch { Alert.alert('שגיאה', 'לא הצלחתי להוסיף'); }
    finally { setSaving(false); }
  };

  const scaleItem = (it, g) => {
    const f = g / (it.baseGrams || 100);
    return {
      ...it, grams: g,
      calories: Math.round((it.baseCal || 0) * f),
      protein:  Math.round((it.baseProt || 0) * f * 10) / 10,
      carbs:    Math.round((it.baseCarbs || 0) * f * 10) / 10,
      fat:      Math.round((it.baseFat || 0) * f * 10) / 10,
    };
  };
  const adjustGrams = (i, delta) =>
    setItems(prev => prev.map((it, idx) => idx === i ? scaleItem(it, Math.max(5, (it.grams || 0) + delta)) : it));
  const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i));

  const total = items.reduce((s, i) => s + (i.calories ?? 0), 0);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>

        {/* Camera phase */}
        {phase === 'camera' && (
          <>
            {permission?.granted ? (
              <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject} facing="back" />
            ) : (
              <View style={s.center}>
                <Text style={{ color: '#fff', marginBottom: 16 }}>צריך הרשאת מצלמה</Text>
                <TouchableOpacity style={s.saveBtn} onPress={requestPermission}>
                  <Text style={s.saveBtnTxt}>הרשה גישה</Text>
                </TouchableOpacity>
              </View>
            )}
            {/* Close button */}
            <TouchableOpacity style={s.closeOverlayBtn} onPress={onClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            {/* Shutter button */}
            {permission?.granted && (
              <TouchableOpacity style={s.shutterBtn} onPress={takePhoto}>
                <View style={s.shutterInner} />
              </TouchableOpacity>
            )}
            <Text style={s.cameraHint}>כוון למנה ולחץ לצילום</Text>
          </>
        )}

        {/* Processing phase */}
        {phase === 'processing' && (
          <View style={s.center}>
            <ActivityIndicator size="large" color="#4F8EF7" />
            <Text style={{ color: '#fff', marginTop: 16, fontSize: 16 }}>מזהה מזון בתמונה...</Text>
          </View>
        )}

        {/* Results phase */}
        {phase === 'results' && (
          <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 56 }}>
            <View style={s.modalHeader}>
              <TouchableOpacity onPress={() => setPhase('camera')}>
                <Ionicons name="camera-outline" size={22} color="#4F8EF7" />
              </TouchableOpacity>
              <Text style={[s.sheetTitle, { marginBottom: 0 }]}>
                זוהו {items.length} פריטים · {total} קק"ל
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            {items.map((item, i) => (
              <View key={i} style={s.foodRow}>
                {/* Delete item */}
                <TouchableOpacity onPress={() => removeItem(i)} style={{ padding: 4 }}>
                  <Ionicons name="trash-outline" size={18} color="#ff6b6b" />
                </TouchableOpacity>

                {/* Grams stepper */}
                <View style={s.gramsStepper}>
                  <TouchableOpacity onPress={() => adjustGrams(i, 10)} style={s.stepBtn}><Text style={s.stepTxt}>+</Text></TouchableOpacity>
                  <Text style={s.stepVal}>{item.grams}g</Text>
                  <TouchableOpacity onPress={() => adjustGrams(i, -10)} style={s.stepBtn}><Text style={s.stepTxt}>−</Text></TouchableOpacity>
                </View>

                {/* Name + nutrition */}
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Text style={s.foodName} numberOfLines={1}>{item.name_he ?? item.name}</Text>
                  <Text style={[s.foodMeta, { color: '#4F8EF7' }]}>{item.calories ?? 0} קק"ל</Text>
                  <Text style={s.foodMeta}>ח:{item.protein ?? 0}g  פ:{item.carbs ?? 0}g  ש:{item.fat ?? 0}g</Text>
                </View>
              </View>
            ))}

            {items.length === 0 && (
              <Text style={{ color: '#666', textAlign: 'center', marginVertical: 20 }}>
                אין פריטים. צלם שוב.
              </Text>
            )}

            <View style={{ marginTop: 16 }}>
              <MealChips value={meal} onChange={setMeal} />
            </View>
            <TouchableOpacity style={s.saveBtn} onPress={handleAddAll} disabled={saving || items.length === 0}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnTxt}>הוסף הכל לתזונה</Text>}
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

// ─── Add Food Sheet ────────────────────────────────────────────────────────────
function AddFoodSheet({ visible, onClose, onCamera, onBarcode, onManual }) {
  const [recents, setRecents] = useState([]);
  const [reloggingId, setReloggingId] = useState(null);

  useEffect(() => {
    if (visible) {
      fetchRecentFoods(12).then(r => setRecents(r.foods ?? [])).catch(() => setRecents([]));
    }
  }, [visible]);

  const relog = async (food) => {
    setReloggingId(food.food_name);
    try {
      await addFoodEntry({
        food_id:   food.food_id ?? 'recent',
        food_name: food.food_name,
        grams:     food.grams ?? 100,
        calories:  Math.round(food.calories ?? 0),
        protein:   food.protein ?? 0,
        carbs:     food.carbs ?? 0,
        fat:       food.fat ?? 0,
        meal_type: food.meal_type ?? 'LUNCH',
        image_url: food.image_url ?? null,
      });
      Alert.alert('נוסף!', `${food.food_name} נוסף ליומן`);
      onClose();
    } catch { Alert.alert('שגיאה', 'לא הצלחתי להוסיף'); }
    finally { setReloggingId(null); }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose} />
      <View style={s.actionSheet}>
        <View style={s.sheetHandle} />
        <Text style={s.sheetTitle}>הוסף מזון</Text>

        {recents.length > 0 && (
          <View style={s.recentsWrap}>
            <Text style={s.recentsTitle}>האוכל שלי · לחיצה אחת</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.recentsRow}>
              {recents.map((f, i) => (
                <TouchableOpacity key={i} style={s.recentChip} onPress={() => relog(f)} disabled={!!reloggingId}>
                  {f.image_url
                    ? <Image source={{ uri: f.image_url }} style={s.recentThumb} />
                    : <View style={[s.recentThumb, s.recentThumbEmpty]}><Ionicons name="restaurant-outline" size={16} color="#555" /></View>}
                  <Text style={s.recentName} numberOfLines={1}>{f.food_name}</Text>
                  <Text style={s.recentCal}>{Math.round(f.calories ?? 0)} קק"ל</Text>
                  {reloggingId === f.food_name && <ActivityIndicator size="small" color="#4F8EF7" style={s.recentSpinner} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <TouchableOpacity style={s.actionRow2} onPress={onCamera}>
          <View style={[s.actionIcon, { backgroundColor: '#1a3a1a' }]}>
            <Ionicons name="camera" size={26} color="#4CAF50" />
          </View>
          <View style={s.actionText}>
            <Text style={s.actionLabel}>צלם ארוחה</Text>
            <Text style={s.actionSub}>זהה מזון עם AI</Text>
          </View>
          <Ionicons name="chevron-back" size={18} color="#333" />
        </TouchableOpacity>

        <TouchableOpacity style={s.actionRow2} onPress={onBarcode}>
          <View style={[s.actionIcon, { backgroundColor: '#1a2a3a' }]}>
            <Ionicons name="barcode-outline" size={26} color="#4F8EF7" />
          </View>
          <View style={s.actionText}>
            <Text style={s.actionLabel}>סריקת ברקוד</Text>
            <Text style={s.actionSub}>סרוק מוצר ארוז</Text>
          </View>
          <Ionicons name="chevron-back" size={18} color="#333" />
        </TouchableOpacity>

        <TouchableOpacity style={[s.actionRow2, { borderBottomWidth: 0 }]} onPress={onManual}>
          <View style={[s.actionIcon, { backgroundColor: '#2a1a3a' }]}>
            <Ionicons name="create-outline" size={26} color="#9C27B0" />
          </View>
          <View style={s.actionText}>
            <Text style={s.actionLabel}>חיפוש ידני</Text>
            <Text style={s.actionSub}>חפש לפי שם מזון</Text>
          </View>
          <Ionicons name="chevron-back" size={18} color="#333" />
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ─── Tab Navigator ─────────────────────────────────────────────────────────────
function TabNavigator() {
  const [showAdd, setShowAdd]           = useState(false);
  const [showBarcode, setShowBarcode]   = useState(false);
  const [showManual, setShowManual]     = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const handleCamera = () => { setShowAdd(false); setShowCamera(true); };

  const handleBarcode = () => { setShowAdd(false); setShowBarcode(true); };
  const handleManual  = () => { setShowAdd(false); setShowManual(true); };

  const TABS = [
    { name: 'בית',    component: DashboardScreen, icon: 'home-outline',       activeIcon: 'home' },
    { name: 'תזונה',  component: HomeScreen,      icon: 'restaurant-outline', activeIcon: 'restaurant' },
    { name: 'צ׳אט',   component: ChatScreen,      icon: 'chatbubble-outline', activeIcon: 'chatbubble' },
    { name: 'אימון',  component: WorkoutScreen,   icon: 'barbell-outline',    activeIcon: 'barbell' },
    { name: 'פרופיל', component: ProfileScreen,   icon: 'person-outline',     activeIcon: 'person' },
  ];

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => {
          const tab = TABS.find(t => t.name === route.name);
          return {
            headerShown: false,
            tabBarShowLabel: false,
            tabBarStyle: {
              backgroundColor: '#0e0e0e',
              borderTopColor: '#1a1a1a',
              borderTopWidth: 1,
              height: 62,
              paddingBottom: 8,
              paddingTop: 8,
            },
            tabBarActiveTintColor: '#4F8EF7',
            tabBarInactiveTintColor: '#444',
            tabBarIcon: ({ color, focused }) =>
              tab ? <Ionicons name={focused ? tab.activeIcon : tab.icon} size={26} color={color} /> : null,
          };
        }}
      >
        {/* First two tabs */}
        {TABS.slice(0, 2).map(tab => (
          <Tab.Screen key={tab.name} name={tab.name} component={tab.component} />
        ))}

        {/* "+" button */}
        <Tab.Screen
          name="__add__"
          component={DashboardScreen}
          options={{
            tabBarLabel: 'הוסף',
            tabBarButton: () => (
              <TouchableOpacity
                style={s.plusWrap}
                onPress={() => setShowAdd(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle-outline" size={26} color="#444" />
              </TouchableOpacity>
            ),
          }}
        />

        {/* Remaining tabs */}
        {TABS.slice(2).map(tab => (
          <Tab.Screen key={tab.name} name={tab.name} component={tab.component} />
        ))}
      </Tab.Navigator>

      {/* Modals */}
      <AddFoodSheet
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onCamera={handleCamera}
        onBarcode={handleBarcode}
        onManual={handleManual}
      />
      <ManualEntryModal visible={showManual} onClose={() => setShowManual(false)} />
      <BarcodeScanModal  visible={showBarcode} onClose={() => setShowBarcode(false)} />
      <CameraPhotoModal  visible={showCamera}  onClose={() => setShowCamera(false)} />

    </>
  );
}

const AuthStack = createNativeStackNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login"  component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
  );
}

function RootNavigator() {
  const { token, onboarded, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f0f0f', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#A8E063" />
      </View>
    );
  }

  if (!token)      return <AuthNavigator />;
  if (!onboarded)  return <OnboardingScreen />;
  return <TabNavigator />;
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  plusWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  overlay:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },

  actionSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#141414', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: 40, paddingTop: 12,
  },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#141414', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: 40, paddingTop: 12,
    maxHeight: '85%',
  },
  sheetHandle: { width: 36, height: 4, backgroundColor: '#333', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle:  { color: '#fff', fontSize: 18, fontWeight: '800', textAlign: 'right', marginBottom: 20 },

  recentsWrap:  { marginBottom: 18 },
  recentsTitle: { color: '#888', fontSize: 13, fontWeight: '700', textAlign: 'right', marginBottom: 10 },
  recentsRow:   { gap: 10, flexDirection: 'row-reverse', paddingLeft: 4 },
  recentChip:   { width: 96, backgroundColor: '#141414', borderRadius: 14, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: '#1f1f1f' },
  recentThumb:  { width: 64, height: 64, borderRadius: 10, marginBottom: 6 },
  recentThumbEmpty: { backgroundColor: '#1e1e1e', alignItems: 'center', justifyContent: 'center' },
  recentName:   { color: '#fff', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  recentCal:    { color: '#4F8EF7', fontSize: 11, fontWeight: '700', marginTop: 2 },
  recentSpinner:{ position: 'absolute', top: 30, alignSelf: 'center' },

  actionRow2: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#1e1e1e',
  },
  actionIcon:  { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionText:  { flex: 1, alignItems: 'flex-end' },
  actionLabel: { color: '#fff', fontSize: 16, fontWeight: '700' },
  actionSub:   { color: '#666', fontSize: 12, marginTop: 2 },

  // Manual
  searchRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  input: {
    flex: 1, backgroundColor: '#1e1e1e', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#2a2a2a',
  },
  searchBtn:    { backgroundColor: '#4F8EF7', borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center' },
  searchBtnTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },
  foodCard:  { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, gap: 12 },
  foodName:  { color: '#fff', fontSize: 18, fontWeight: '800', textAlign: 'right' },
  foodMeta:  { color: '#666', fontSize: 13, textAlign: 'right' },
  gramsRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  calBig:    { color: '#4F8EF7', fontSize: 26, fontWeight: '800' },
  gramsInput: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  gramsField: {
    backgroundColor: '#2a2a2a', borderRadius: 10, width: 70,
    paddingVertical: 8, color: '#fff', fontSize: 16, fontWeight: '700',
    borderWidth: 1, borderColor: '#333',
  },
  gramsLbl: { color: '#888', fontSize: 14 },
  mealChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: '#1e1e1e', marginRight: 8, borderWidth: 1, borderColor: '#2a2a2a',
  },
  mealChipActive:    { backgroundColor: '#4F8EF7', borderColor: '#4F8EF7' },
  mealChipTxt:       { color: '#666', fontSize: 13 },
  mealChipTxtActive: { color: '#fff', fontWeight: '700' },
  saveBtn:    { backgroundColor: '#4F8EF7', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Barcode
  scanOverlay:    { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  scanFrame:      { width: 260, height: 160, borderWidth: 2, borderColor: '#4F8EF7', borderRadius: 12 },
  scanHint:       { color: '#fff', marginTop: 16, fontSize: 14 },
  closeOverlayBtn: { position: 'absolute', top: 52, left: 16, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, padding: 8 },
  backBtn:        { position: 'absolute', top: 12, right: 12, padding: 8 },
  productName:    { color: '#fff', fontSize: 22, fontWeight: '800', textAlign: 'right', marginBottom: 4 },
  macrosGrid:     { flexDirection: 'row', gap: 8, marginBottom: 20 },
  macroBox:       { flex: 1, backgroundColor: '#1e1e1e', borderRadius: 10, padding: 10, alignItems: 'center' },
  macroNum:       { fontSize: 16, fontWeight: '800' },
  macroLbl:       { color: '#666', fontSize: 11, marginTop: 3 },

  // Camera result
  modalHeader:   { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, paddingTop: 52 },
  foodRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1a1a1a', gap: 10 },
  gramsStepper:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#141414', borderRadius: 10, borderWidth: 1, borderColor: '#222' },
  stepBtn:       { paddingHorizontal: 10, paddingVertical: 6 },
  stepTxt:       { color: '#4F8EF7', fontSize: 18, fontWeight: '800' },
  stepVal:       { color: '#fff', fontSize: 13, fontWeight: '700', minWidth: 44, textAlign: 'center' },

  // Camera photo shutter
  shutterBtn:   { position: 'absolute', bottom: 48, alignSelf: 'center', width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  shutterInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' },
  cameraHint:   { position: 'absolute', bottom: 130, alignSelf: 'center', color: 'rgba(255,255,255,0.7)', fontSize: 13 },
});
