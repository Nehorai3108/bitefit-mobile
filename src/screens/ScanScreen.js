import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Image, ScrollView, Alert,
} from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { lookupBarcode, identifyFood, addFoodEntry } from '../api/client';

// ─── Barcode Tab ────────────────────────────────────────────────────────────
function BarcodeTab() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const lastScan = useRef(0);

  useEffect(() => {
    BarCodeScanner.requestPermissionsAsync().then(({ status }) => setHasPermission(status === 'granted'));
  }, []);

  const handleScan = async ({ data }) => {
    const now = Date.now();
    if (now - lastScan.current < 3000) return;
    lastScan.current = now;
    setScanning(false); setLoading(true); setResult(null);
    try {
      const res = await lookupBarcode(data);
      if (res.found) setResult({ barcode: data, ...res.food });
      else Alert.alert('לא נמצא', `ברקוד ${data} לא קיים במאגר`);
    } catch { Alert.alert('שגיאה', 'לא ניתן לחפש ברקוד'); }
    finally { setLoading(false); }
  };

  if (scanning) return (
    <View style={{ flex: 1 }}>
      <BarCodeScanner onBarCodeScanned={handleScan} style={StyleSheet.absoluteFillObject} />
      <View style={styles.scanOverlay}>
        <View style={styles.scanFrame} />
        <Text style={styles.scanHint}>כוון את המצלמה לברקוד</Text>
      </View>
      <TouchableOpacity style={styles.cancelBtn} onPress={() => setScanning(false)}>
        <Text style={styles.cancelTxt}>ביטול</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      {loading ? (
        <View style={styles.center}><ActivityIndicator color="#4F8EF7" size="large" /><Text style={styles.loadingTxt}>מחפש מוצר...</Text></View>
      ) : result ? (
        <View style={styles.resultCard}>
          <Text style={styles.productName}>{result.name_he ?? result.name_en}</Text>
          <Text style={styles.per100}>לכל 100 גרם:</Text>
          <View style={styles.macrosGrid}>
            {[
              { label: 'קק"ל', val: result.calories, color: '#ffd700' },
              { label: 'חלבון', val: `${result.protein}g`, color: '#4F8EF7' },
              { label: "פחמ'", val: `${result.carbs}g`, color: '#4CAF50' },
              { label: 'שומן', val: `${result.fat}g`, color: '#ff6b6b' },
            ].map(m => (
              <View key={m.label} style={styles.macroBox}>
                <Text style={[styles.macroNum, { color: m.color }]}>{m.val}</Text>
                <Text style={styles.macroLbl}>{m.label}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.primaryBtn} onPress={async () => {
            try {
              await addFoodEntry({ food_id: result.food_id ?? result.barcode, food_name: result.name_he ?? result.name_en, grams: result.serving_g ?? 100, calories: result.calories, protein: result.protein, carbs: result.carbs, fat: result.fat, meal_type: 'LUNCH' });
              Alert.alert('נוסף!', 'המוצר נוסף לתזונה היומית');
            } catch { Alert.alert('שגיאה', 'לא הצלחתי להוסיף'); }
          }}>
            <Text style={styles.primaryBtnTxt}>הוסף לתזונה היומית</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => { setResult(null); setScanning(true); }}>
            <Text style={styles.secondaryBtnTxt}>סרוק שוב</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="barcode-outline" size={80} color="#222" />
          <Text style={styles.emptyTitle}>סריקת ברקוד</Text>
          <Text style={styles.emptyText}>סרוק ברקוד של מוצר מזון וקבל מידע תזונתי מיידי</Text>
          {hasPermission
            ? <TouchableOpacity style={styles.primaryBtn} onPress={() => setScanning(true)}><Text style={styles.primaryBtnTxt}>התחל סריקה</Text></TouchableOpacity>
            : <Text style={styles.noPermission}>אין הרשאת מצלמה</Text>}
        </View>
      )}
    </ScrollView>
  );
}

// ─── Camera/Food Tab ─────────────────────────────────────────────────────────
function CameraTab() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState(null);

  const pick = async (fromCamera) => {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') { Alert.alert('אין הרשאה'); return; }
    const res = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (!res.canceled && res.assets?.[0]) {
      const uri = res.assets[0].uri;
      setImage(uri); setItems(null);
      setLoading(true);
      try {
        const r = await identifyFood(uri);
        setItems(r.items?.length > 0 ? r.items : []);
        if (!r.items?.length) Alert.alert('לא זוהה', r.error ?? 'לא נמצאו פריטי מזון');
      } catch { Alert.alert('שגיאה', 'לא ניתן לנתח'); setItems([]); }
      finally { setLoading(false); }
    }
  };

  const total = items?.reduce((s, i) => s + (i.calories ?? 0), 0) ?? 0;

  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <View style={styles.pickRow}>
        <TouchableOpacity style={styles.pickBtn} onPress={() => pick(true)}>
          <Ionicons name="camera" size={28} color="#4F8EF7" />
          <Text style={styles.pickLbl}>צלם</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.pickBtn} onPress={() => pick(false)}>
          <Ionicons name="images" size={28} color="#4F8EF7" />
          <Text style={styles.pickLbl}>גלריה</Text>
        </TouchableOpacity>
      </View>

      {image && <Image source={{ uri: image }} style={styles.preview} resizeMode="cover" />}

      {loading && (
        <View style={styles.loadingCard}>
          <ActivityIndicator color="#4F8EF7" size="large" />
          <Text style={styles.loadingTxt}>מזהה אוכל בתמונה...</Text>
        </View>
      )}

      {!loading && items?.length > 0 && (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Text style={styles.totalCal}>{total} קק"ל</Text>
            <Text style={styles.itemCount}>זוהו {items.length} פריטים</Text>
          </View>
          {items.map((item, i) => (
            <View key={i} style={styles.foodRow}>
              <View style={styles.foodMacros}>
                <Text style={styles.foodMacro}>ח: {item.protein ?? 0}g</Text>
                <Text style={styles.foodMacro}>פ: {item.carbs ?? 0}g</Text>
                <Text style={styles.foodMacro}>ש: {item.fat ?? 0}g</Text>
                <Text style={[styles.foodMacro, { color: '#4F8EF7' }]}>{item.calories ?? 0} קק"ל</Text>
              </View>
              <View style={styles.foodInfo}>
                <Text style={styles.foodName}>{item.name_he ?? item.name}</Text>
                <Text style={styles.foodGrams}>{item.grams ?? 0}g</Text>
              </View>
            </View>
          ))}
          <TouchableOpacity style={styles.primaryBtn} onPress={async () => {
            try {
              for (const item of items) {
                await addFoodEntry({ food_id: item.name ?? 'camera_food', food_name: item.name_he ?? item.name, grams: item.grams ?? 100, calories: item.calories ?? 0, protein: item.protein ?? 0, carbs: item.carbs ?? 0, fat: item.fat ?? 0, meal_type: 'LUNCH' });
              }
              Alert.alert('נוסף!', 'הארוחה נוספה לתזונה היומית');
            } catch { Alert.alert('שגיאה', 'לא הצלחתי להוסיף'); }
          }}>
            <Text style={styles.primaryBtnTxt}>הוסף הכל לתזונה</Text>
          </TouchableOpacity>
        </View>
      )}

      {!image && !loading && (
        <View style={styles.emptyState}>
          <Ionicons name="camera-outline" size={80} color="#222" />
          <Text style={styles.emptyTitle}>זיהוי אוכל מצילום</Text>
          <Text style={styles.emptyText}>צלם ארוחה וקבל ניתוח תזונתי מיידי באמצעות AI</Text>
        </View>
      )}
    </ScrollView>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ScanScreen() {
  const [tab, setTab] = useState(0);
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>סריקה</Text>
      </View>
      <View style={styles.tabBar}>
        {['ברקוד', 'צילום אוכל'].map((t, i) => (
          <TouchableOpacity key={i} style={[styles.tabBtn, tab === i && styles.tabBtnActive]} onPress={() => setTab(i)}>
            <Text style={[styles.tabTxt, tab === i && styles.tabTxtActive]}>{t}</Text>
            {tab === i && <View style={styles.tabLine} />}
          </TouchableOpacity>
        ))}
      </View>
      {tab === 0 ? <BarcodeTab /> : <CameraTab />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { paddingHorizontal: 16, paddingTop: 52, paddingBottom: 8 },
  title: { color: '#fff', fontSize: 22, fontWeight: '800' },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#1a1a1a', paddingHorizontal: 16 },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabBtnActive: {},
  tabTxt: { color: '#555', fontSize: 15 },
  tabTxtActive: { color: '#4F8EF7', fontWeight: '700' },
  tabLine: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: '#4F8EF7' },
  tabContent: { padding: 16, paddingBottom: 40 },
  center: { alignItems: 'center', gap: 12, paddingTop: 40 },
  loadingCard: { backgroundColor: '#141414', borderRadius: 16, padding: 24, alignItems: 'center', gap: 10 },
  loadingTxt: { color: '#888', fontSize: 14 },
  scanOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  scanFrame: { width: 240, height: 160, borderWidth: 2, borderColor: '#4F8EF7', borderRadius: 12 },
  scanHint: { color: '#fff', marginTop: 16, fontSize: 14 },
  cancelBtn: { position: 'absolute', bottom: 40, alignSelf: 'center', backgroundColor: '#1a1a1a', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  cancelTxt: { color: '#fff', fontSize: 15 },
  resultCard: { backgroundColor: '#141414', borderRadius: 16, overflow: 'hidden' },
  productName: { color: '#fff', fontSize: 20, fontWeight: '800', textAlign: 'right', padding: 16, paddingBottom: 4 },
  per100: { color: '#888', fontSize: 13, textAlign: 'right', paddingHorizontal: 16, marginBottom: 12 },
  macrosGrid: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 16 },
  macroBox: { flex: 1, backgroundColor: '#1e1e1e', borderRadius: 10, padding: 10, alignItems: 'center' },
  macroNum: { fontSize: 16, fontWeight: '800' },
  macroLbl: { color: '#666', fontSize: 11, marginTop: 3 },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1e1e1e' },
  totalCal: { color: '#ffd700', fontSize: 22, fontWeight: '800' },
  itemCount: { color: '#fff', fontSize: 15, fontWeight: '600' },
  foodRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  foodInfo: { alignItems: 'flex-end' },
  foodName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  foodGrams: { color: '#666', fontSize: 12 },
  foodMacros: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  foodMacro: { color: '#555', fontSize: 12 },
  primaryBtn: { margin: 16, backgroundColor: '#4F8EF7', borderRadius: 12, padding: 14, alignItems: 'center' },
  primaryBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
  secondaryBtn: { marginHorizontal: 16, marginBottom: 16, backgroundColor: '#1e1e1e', borderRadius: 12, padding: 12, alignItems: 'center' },
  secondaryBtnTxt: { color: '#888', fontSize: 14 },
  pickRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  pickBtn: { flex: 1, backgroundColor: '#141414', borderRadius: 14, padding: 20, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#2a2a2a' },
  pickLbl: { color: '#fff', fontSize: 14, fontWeight: '600' },
  preview: { width: '100%', height: 200, borderRadius: 14, marginBottom: 16 },
  emptyState: { paddingTop: 40, alignItems: 'center', gap: 12 },
  emptyTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  emptyText: { color: '#666', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  noPermission: { color: '#ff6b6b', fontSize: 14 },
});
