import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView,
  ActivityIndicator, TextInput, Alert, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import {
  fetchInventory, addInventoryItem, deleteInventoryItem, scanReceipt,
} from '../api/client';

const CATEGORIES = {
  produce:   { emoji: '🥦', label: 'פירות וירקות' },
  meat:      { emoji: '🍗', label: 'בשר ודגים' },
  dairy:     { emoji: '🧀', label: 'חלב וביצים' },
  bakery:    { emoji: '🍞', label: 'מאפים' },
  pantry:    { emoji: '🥫', label: 'יבש ושימורים' },
  frozen:    { emoji: '🧊', label: 'קפואים' },
  beverages: { emoji: '🥤', label: 'משקאות' },
  snacks:    { emoji: '🍫', label: 'חטיפים' },
  other:     { emoji: '🛒', label: 'שונות' },
};
const CAT_ORDER = ['produce', 'meat', 'dairy', 'bakery', 'pantry', 'frozen', 'beverages', 'snacks', 'other'];
const UNITS = ['יח׳', 'ק"ג', 'גרם', 'חבילה', 'בקבוק'];

export default function InventoryScreen({ visible, onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetchInventory();
      setItems(r.items ?? []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (visible) load(); }, [visible, load]);

  const handleDelete = (item) => {
    setItems(prev => prev.filter(i => i.item_id !== item.item_id));
    deleteInventoryItem(item.item_id).catch(() => load());
  };

  // Group by category
  const grouped = {};
  for (const it of items) {
    const c = CATEGORIES[it.category] ? it.category : 'other';
    (grouped[c] = grouped[c] || []).push(it);
  }
  const cats = CAT_ORDER.filter(c => grouped[c]?.length);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={onClose}><Ionicons name="close" size={26} color="#fff" /></TouchableOpacity>
          <Text style={s.title}>המלאי שלי</Text>
          <Text style={s.count}>{items.length} פריטים</Text>
        </View>

        {/* Actions */}
        <View style={s.actions}>
          <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#4F8EF7' }]} onPress={() => setShowCamera(true)}>
            <Ionicons name="receipt-outline" size={20} color="#fff" />
            <Text style={s.actionTxt}>סרוק קבלה</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.actionBtn, s.actionBtnAlt]} onPress={() => setShowAdd(true)}>
            <Ionicons name="add" size={20} color="#4F8EF7" />
            <Text style={[s.actionTxt, { color: '#4F8EF7' }]}>הוסף ידנית</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={s.center}><ActivityIndicator size="large" color="#4F8EF7" /></View>
        ) : items.length === 0 ? (
          <View style={s.center}>
            <Text style={{ fontSize: 52 }}>🛒</Text>
            <Text style={s.emptyTitle}>המלאי ריק</Text>
            <Text style={s.emptyText}>סרוק קבלה או הוסף מוצרים ידנית{'\n'}כדי לדעת מה יש לך בבית</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            {cats.map(cat => (
              <View key={cat} style={s.catBlock}>
                <Text style={s.catTitle}>{CATEGORIES[cat].emoji}  {CATEGORIES[cat].label}</Text>
                {grouped[cat].map(it => (
                  <View key={it.item_id} style={s.itemRow}>
                    <TouchableOpacity onPress={() => handleDelete(it)} style={{ padding: 6 }}>
                      <Ionicons name="trash-outline" size={18} color="#555" />
                    </TouchableOpacity>
                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                      <Text style={s.itemName}>{it.name_he}</Text>
                      <Text style={s.itemQty}>{formatQty(it.quantity)} {it.unit}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
        )}

        <ManualAddModal
          visible={showAdd}
          onClose={() => setShowAdd(false)}
          onAdded={() => { setShowAdd(false); load(); }}
        />
        <ReceiptScanModal
          visible={showCamera}
          onClose={() => setShowCamera(false)}
          onDone={() => { setShowCamera(false); load(); }}
        />
      </View>
    </Modal>
  );
}

function formatQty(q) {
  const n = Number(q);
  return Number.isInteger(n) ? n : n.toFixed(1);
}

// ─── Manual add ────────────────────────────────────────────────────────────────
function ManualAddModal({ visible, onClose, onAdded }) {
  const [name, setName] = useState('');
  const [qty, setQty] = useState(1);
  const [unit, setUnit] = useState('יח׳');
  const [category, setCategory] = useState('other');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (visible) { setName(''); setQty(1); setUnit('יח׳'); setCategory('other'); } }, [visible]);

  const save = async () => {
    if (!name.trim()) { Alert.alert('שגיאה', 'הכנס שם מוצר'); return; }
    setSaving(true);
    try {
      await addInventoryItem({ name_he: name.trim(), quantity: qty, unit, category });
      onAdded();
    } catch { Alert.alert('שגיאה', 'לא הצלחתי להוסיף'); }
    finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose} />
      <View style={s.sheet}>
        <View style={s.sheetHandle} />
        <Text style={s.sheetTitle}>הוספת מוצר</Text>

        <TextInput
          style={s.input}
          placeholder="שם המוצר (למשל: עגבניות)"
          placeholderTextColor="#555"
          value={name}
          onChangeText={setName}
          textAlign="right"
        />

        <View style={s.qtyRow}>
          <View style={s.stepper}>
            <TouchableOpacity onPress={() => setQty(q => Math.round((q + 1) * 10) / 10)} style={s.stepBtn}><Text style={s.stepTxt}>+</Text></TouchableOpacity>
            <Text style={s.stepVal}>{formatQty(qty)}</Text>
            <TouchableOpacity onPress={() => setQty(q => Math.max(0.5, Math.round((q - 1) * 10) / 10))} style={s.stepBtn}><Text style={s.stepTxt}>−</Text></TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, flexDirection: 'row-reverse' }}>
            {UNITS.map(u => (
              <TouchableOpacity key={u} style={[s.chip, unit === u && s.chipActive]} onPress={() => setUnit(u)}>
                <Text style={[s.chipTxt, unit === u && s.chipTxtActive]}>{u}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <Text style={s.fieldLabel}>קטגוריה</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, flexDirection: 'row-reverse', paddingBottom: 4 }}>
          {CAT_ORDER.map(c => (
            <TouchableOpacity key={c} style={[s.chip, category === c && s.chipActive]} onPress={() => setCategory(c)}>
              <Text style={[s.chipTxt, category === c && s.chipTxtActive]}>{CATEGORIES[c].emoji} {CATEGORIES[c].label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity style={s.saveBtn} onPress={save} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnTxt}>הוסף למלאי</Text>}
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ─── Receipt scan ────────────────────────────────────────────────────────────────
function ReceiptScanModal({ visible, onClose, onDone }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState('camera'); // 'camera' | 'processing' | 'result'
  const [result, setResult] = useState([]);
  const cameraRef = useRef(null);

  useEffect(() => { if (visible) { setPhase('camera'); setResult([]); } }, [visible]);

  const capture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.6, base64: false });
      setPhase('processing');
      const r = await scanReceipt(photo.uri);
      if (r.items?.length > 0) { setResult(r.items); setPhase('result'); }
      else { Alert.alert('לא זוהו מוצרים', r.error ?? 'נסה לצלם את הקבלה בתאורה טובה'); setPhase('camera'); }
    } catch { Alert.alert('שגיאה', 'לא ניתן לסרוק את הקבלה'); setPhase('camera'); }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
        {phase === 'camera' && (
          <>
            {permission?.granted ? (
              <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject} facing="back" />
            ) : (
              <View style={s.center}>
                <Text style={{ color: '#fff', marginBottom: 16 }}>צריך הרשאת מצלמה</Text>
                <TouchableOpacity style={s.saveBtn} onPress={requestPermission}><Text style={s.saveBtnTxt}>הרשה גישה</Text></TouchableOpacity>
              </View>
            )}
            <TouchableOpacity style={s.closeOverlay} onPress={onClose}><Ionicons name="close" size={24} color="#fff" /></TouchableOpacity>
            {permission?.granted && (
              <TouchableOpacity style={s.shutter} onPress={capture}><View style={s.shutterInner} /></TouchableOpacity>
            )}
            <Text style={s.hint}>כוון את כל הקבלה למסגרת וצלם</Text>
          </>
        )}

        {phase === 'processing' && (
          <View style={s.center}>
            <ActivityIndicator size="large" color="#4F8EF7" />
            <Text style={{ color: '#fff', marginTop: 16 }}>קורא את הקבלה ומחלץ מוצרים...</Text>
          </View>
        )}

        {phase === 'result' && (
          <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 56 }}>
            <Text style={s.resultTitle}>✓ נוספו {result.length} מוצרים למלאי</Text>
            {result.map((it, i) => (
              <View key={i} style={s.itemRow}>
                <Text style={{ fontSize: 18 }}>{(CATEGORIES[it.category] || CATEGORIES.other).emoji}</Text>
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Text style={s.itemName}>{it.name_he}</Text>
                  <Text style={s.itemQty}>{formatQty(it.quantity)} {it.unit}</Text>
                </View>
              </View>
            ))}
            <TouchableOpacity style={s.saveBtn} onPress={onDone}><Text style={s.saveBtnTxt}>סיום</Text></TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8, padding: 24 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  title: { color: '#fff', fontSize: 20, fontWeight: '800', flex: 1 },
  count: { color: '#666', fontSize: 13 },
  actions: { flexDirection: 'row', gap: 10, padding: 16 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, paddingVertical: 13 },
  actionBtnAlt: { backgroundColor: '#141414', borderWidth: 1, borderColor: '#1e2a44' },
  actionTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 8 },
  emptyText: { color: '#666', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  catBlock: { marginBottom: 18 },
  catTitle: { color: '#888', fontSize: 14, fontWeight: '700', textAlign: 'right', marginBottom: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#161616' },
  itemName: { color: '#fff', fontSize: 15, fontWeight: '600', textAlign: 'right' },
  itemQty: { color: '#4F8EF7', fontSize: 12, fontWeight: '600', marginTop: 2 },

  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#141414', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#333', alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { color: '#fff', fontSize: 18, fontWeight: '800', textAlign: 'right', marginBottom: 16 },
  input: { backgroundColor: '#1a1a1a', color: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, marginBottom: 12 },
  qtyRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, marginBottom: 14 },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 10 },
  stepBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  stepTxt: { color: '#4F8EF7', fontSize: 18, fontWeight: '800' },
  stepVal: { color: '#fff', fontSize: 15, fontWeight: '700', minWidth: 36, textAlign: 'center' },
  fieldLabel: { color: '#888', fontSize: 13, textAlign: 'right', marginBottom: 8 },
  chip: { backgroundColor: '#1a1a1a', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#262626' },
  chipActive: { backgroundColor: '#4F8EF722', borderColor: '#4F8EF7' },
  chipTxt: { color: '#888', fontSize: 13 },
  chipTxtActive: { color: '#4F8EF7', fontWeight: '700' },
  saveBtn: { backgroundColor: '#4F8EF7', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  saveBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },

  closeOverlay: { position: 'absolute', top: 52, left: 16, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, padding: 8 },
  shutter: { position: 'absolute', bottom: 48, alignSelf: 'center', width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  shutterInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' },
  hint: { position: 'absolute', bottom: 130, alignSelf: 'center', color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  resultTitle: { color: '#4CAF50', fontSize: 17, fontWeight: '800', textAlign: 'center', marginBottom: 16 },
});
