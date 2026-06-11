import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Ionicons } from '@expo/vector-icons';
import { lookupBarcode } from '../api/client';

export default function BarcodeScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const lastScan = useRef(0);

  useEffect(() => {
    BarCodeScanner.requestPermissionsAsync().then(({ status }) => {
      setHasPermission(status === 'granted');
    });
  }, []);

  const handleScan = async ({ data }) => {
    const now = Date.now();
    if (now - lastScan.current < 3000) return;
    lastScan.current = now;
    setScanning(false);
    setLoading(true);
    setResult(null);
    try {
      const res = await lookupBarcode(data);
      if (res.found) {
        setResult({ barcode: data, ...res.food });
      } else {
        Alert.alert('לא נמצא', `ברקוד ${data} לא קיים במאגר`);
      }
    } catch {
      Alert.alert('שגיאה', 'לא ניתן לחפש ברקוד');
    } finally {
      setLoading(false);
    }
  };

  if (hasPermission === null) return (
    <View style={styles.center}>
      <ActivityIndicator color="#4F8EF7" size="large" />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>סריקת ברקוד</Text>
      </View>

      {scanning ? (
        <View style={styles.scannerWrap}>
          <BarCodeScanner
            onBarCodeScanned={handleScan}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.overlay}>
            <View style={styles.scanFrame} />
            <Text style={styles.scanHint}>כוון את המצלמה לברקוד</Text>
          </View>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setScanning(false)}>
            <Text style={styles.cancelTxt}>ביטול</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.content}>
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color="#4F8EF7" size="large" />
              <Text style={styles.loadingTxt}>מחפש מוצר...</Text>
            </View>
          ) : result ? (
            <View style={styles.resultCard}>
              <Text style={styles.productName}>{result.name_he ?? result.name_en}</Text>
              {result.name_en && result.name_he && (
                <Text style={styles.productNameEn}>{result.name_en}</Text>
              )}
              <Text style={styles.per100}>לכל 100 גרם:</Text>
              <View style={styles.macrosGrid}>
                <View style={styles.macroBox}>
                  <Text style={[styles.macroNum, { color: '#ffd700' }]}>{result.calories}</Text>
                  <Text style={styles.macroLbl}>קק"ל</Text>
                </View>
                <View style={styles.macroBox}>
                  <Text style={[styles.macroNum, { color: '#4F8EF7' }]}>{result.protein}g</Text>
                  <Text style={styles.macroLbl}>חלבון</Text>
                </View>
                <View style={styles.macroBox}>
                  <Text style={[styles.macroNum, { color: '#4CAF50' }]}>{result.carbs}g</Text>
                  <Text style={styles.macroLbl}>פחמ'</Text>
                </View>
                <View style={styles.macroBox}>
                  <Text style={[styles.macroNum, { color: '#ff6b6b' }]}>{result.fat}g</Text>
                  <Text style={styles.macroLbl}>שומן</Text>
                </View>
              </View>
              {result.serving_g && (
                <Text style={styles.serving}>מנה מומלצת: {result.serving_g}g</Text>
              )}
              <TouchableOpacity style={styles.scanAgainBtn} onPress={() => { setResult(null); setScanning(true); }}>
                <Ionicons name="barcode-outline" size={18} color="#fff" />
                <Text style={styles.scanAgainTxt}>סרוק שוב</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="barcode-outline" size={80} color="#333" />
              <Text style={styles.emptyTitle}>סריקת ברקוד</Text>
              <Text style={styles.emptyText}>סרוק ברקוד של מוצר מזון וקבל מידע תזונתי מיידי</Text>
              {hasPermission ? (
                <TouchableOpacity style={styles.startBtn} onPress={() => setScanning(true)}>
                  <Ionicons name="camera-outline" size={20} color="#fff" />
                  <Text style={styles.startTxt}>התחל סריקה</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.noPermission}>אין הרשאת מצלמה</Text>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  header: { paddingHorizontal: 16, paddingTop: 52, paddingBottom: 16 },
  title: { color: '#fff', fontSize: 22, fontWeight: '800' },
  scannerWrap: { flex: 1, position: 'relative' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  scanFrame: { width: 240, height: 160, borderWidth: 2, borderColor: '#4F8EF7', borderRadius: 12, backgroundColor: 'transparent' },
  scanHint: { color: '#fff', marginTop: 16, fontSize: 14 },
  cancelBtn: { position: 'absolute', bottom: 40, alignSelf: 'center', backgroundColor: '#1a1a1a', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  cancelTxt: { color: '#fff', fontSize: 15 },
  content: { flex: 1 },
  loadingTxt: { color: '#888', fontSize: 14 },
  resultCard: { margin: 16, backgroundColor: '#141414', borderRadius: 20, padding: 20 },
  productName: { color: '#fff', fontSize: 20, fontWeight: '800', textAlign: 'right', marginBottom: 4 },
  productNameEn: { color: '#666', fontSize: 14, textAlign: 'right', marginBottom: 16 },
  per100: { color: '#888', fontSize: 13, textAlign: 'right', marginBottom: 12 },
  macrosGrid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  macroBox: { flex: 1, backgroundColor: '#1e1e1e', borderRadius: 12, padding: 12, alignItems: 'center' },
  macroNum: { fontSize: 18, fontWeight: '800' },
  macroLbl: { color: '#666', fontSize: 11, marginTop: 4 },
  serving: { color: '#888', fontSize: 13, textAlign: 'right', marginBottom: 16 },
  scanAgainBtn: { flexDirection: 'row', backgroundColor: '#4F8EF7', borderRadius: 12, padding: 14, justifyContent: 'center', alignItems: 'center', gap: 8 },
  scanAgainTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 12 },
  emptyTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  emptyText: { color: '#666', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  startBtn: { flexDirection: 'row', backgroundColor: '#4F8EF7', borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14, alignItems: 'center', gap: 8, marginTop: 8 },
  startTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  noPermission: { color: '#ff6b6b', fontSize: 14 },
});
