import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Image, ScrollView, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { identifyFood } from '../api/client';
import { compressForUpload } from '../utils/compressImage';

export default function CameraScreen() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState(null);

  const pickImage = async (fromCamera) => {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (perm.status !== 'granted') {
      Alert.alert('אין הרשאה', 'נדרשת הרשאת ' + (fromCamera ? 'מצלמה' : 'גלריה'));
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.7, base64: false })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.7, base64: false });

    if (!result.canceled && result.assets?.[0]) {
      const uri = result.assets[0].uri;
      setImage(uri);
      setItems(null);
      analyze(uri);
    }
  };

  const analyze = async (uri) => {
    setLoading(true);
    try {
      // Resize + compress before upload to cut vision-token cost (no accuracy loss).
      const compressed = await compressForUpload(uri);
      const res = await identifyFood(compressed);
      if (res.items?.length > 0) {
        setItems(res.items);
      } else {
        Alert.alert('לא זוהה אוכל', res.error ?? 'לא נמצאו פריטי מזון בתמונה');
        setItems([]);
      }
    } catch {
      Alert.alert('שגיאה', 'לא ניתן לנתח את התמונה');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const totalCalories = items?.reduce((s, i) => s + (i.calories ?? 0), 0) ?? 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>זיהוי אוכל מצילום</Text>
      <Text style={styles.subtitle}>צלם ארוחה וקבל ניתוח תזונתי מיידי</Text>

      {/* Action buttons */}
      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => pickImage(true)}>
          <Ionicons name="camera" size={28} color="#3a7a4a" />
          <Text style={styles.actionLbl}>צלם</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => pickImage(false)}>
          <Ionicons name="images" size={28} color="#3a7a4a" />
          <Text style={styles.actionLbl}>גלריה</Text>
        </TouchableOpacity>
      </View>

      {/* Preview */}
      {image && (
        <Image source={{ uri: image }} style={styles.preview} resizeMode="cover" />
      )}

      {/* Loading */}
      {loading && (
        <View style={styles.loadingCard}>
          <ActivityIndicator color="#3a7a4a" size="large" />
          <Text style={styles.loadingTxt}>מזהה אוכל בתמונה...</Text>
          <Text style={styles.loadingHint}>AI מנתח את הארוחה שלך</Text>
        </View>
      )}

      {/* Results */}
      {!loading && items?.length > 0 && (
        <View style={styles.resultsCard}>
          <View style={styles.resultsHeader}>
            <Text style={styles.totalCalories}>{totalCalories} קק"ל</Text>
            <Text style={styles.resultsTitle}>זוהו {items.length} פריטים</Text>
          </View>
          {items.map((item, i) => (
            <View key={i} style={styles.foodRow}>
              <View style={styles.foodMacros}>
                <Text style={styles.foodMacro}>ח: {item.protein ?? 0}g</Text>
                <Text style={styles.foodMacro}>פ: {item.carbs ?? 0}g</Text>
                <Text style={styles.foodMacro}>ש: {item.fat ?? 0}g</Text>
                <Text style={[styles.foodKcal]}>{item.calories ?? 0} קק"ל</Text>
              </View>
              <View style={styles.foodInfo}>
                <Text style={styles.foodName}>{item.name_he ?? item.name}</Text>
                <Text style={styles.foodGrams}>{item.grams ?? 0}g</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Empty state */}
      {!image && !loading && (
        <View style={styles.emptyState}>
          <Ionicons name="camera-outline" size={80} color="#222" />
          <Text style={styles.emptyText}>צלם ארוחה כדי לקבל ניתוח תזונתי</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c1622' },
  content: { padding: 16, paddingTop: 52 },
  title: { color: '#fff', fontSize: 22, fontWeight: '800', textAlign: 'right', marginBottom: 4 },
  subtitle: { color: '#666', fontSize: 14, textAlign: 'right', marginBottom: 20 },
  btnRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  actionBtn: { flex: 1, backgroundColor: '#14212f', borderRadius: 16, padding: 20, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#2e455c' },
  actionLbl: { color: '#fff', fontSize: 14, fontWeight: '600' },
  preview: { width: '100%', height: 220, borderRadius: 16, marginBottom: 16 },
  loadingCard: { backgroundColor: '#14212f', borderRadius: 16, padding: 24, alignItems: 'center', gap: 10 },
  loadingTxt: { color: '#fff', fontSize: 15, fontWeight: '600' },
  loadingHint: { color: '#666', fontSize: 13 },
  resultsCard: { backgroundColor: '#14212f', borderRadius: 16, overflow: 'hidden' },
  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#23384c' },
  resultsTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  totalCalories: { color: '#ffd700', fontSize: 22, fontWeight: '800' },
  foodRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#1b2c3d' },
  foodInfo: { alignItems: 'flex-end' },
  foodName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  foodGrams: { color: '#666', fontSize: 12, marginTop: 2 },
  foodMacros: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  foodMacro: { color: '#555', fontSize: 12 },
  foodKcal: { color: '#3a7a4a', fontSize: 13, fontWeight: '700' },
  emptyState: { paddingTop: 60, alignItems: 'center', gap: 12 },
  emptyText: { color: '#444', fontSize: 14, textAlign: 'center' },
});
