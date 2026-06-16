import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView,
  ActivityIndicator, TextInput, Alert, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import {
  fetchInventory, addInventoryItem, deleteInventoryItem, scanReceipt,
  addInventoryBulk, fetchCookSuggestions,
} from '../api/client';

const CATEGORIES = {
  produce:   { icon: 'leaf-outline',       label: 'פירות וירקות' },
  meat:      { icon: 'fish-outline',       label: 'בשר ודגים' },
  dairy:     { icon: 'egg-outline',        label: 'חלב וביצים' },
  bakery:    { icon: 'cafe-outline',       label: 'מאפים' },
  pantry:    { icon: 'cube-outline',       label: 'יבש ושימורים' },
  frozen:    { icon: 'snow-outline',       label: 'קפואים' },
  beverages: { icon: 'wine-outline',       label: 'משקאות' },
  snacks:    { icon: 'fast-food-outline',  label: 'חטיפים' },
  other:     { icon: 'cart-outline',       label: 'שונות' },
};
const CAT_ORDER = ['produce', 'meat', 'dairy', 'bakery', 'pantry', 'frozen', 'beverages', 'snacks', 'other'];
const UNITS = ['יח׳', 'ק"ג', 'גרם', 'חבילה', 'בקבוק'];

export default function InventoryScreen({ visible, onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showCook, setShowCook] = useState(false);

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

        {items.length > 0 && (
          <TouchableOpacity style={s.cookBtn} onPress={() => setShowCook(true)}>
            <Ionicons name="sparkles-outline" size={18} color="#fff" />
            <Text style={s.cookBtnTxt}>מה אפשר להכין ממה שיש לי?</Text>
          </TouchableOpacity>
        )}

        {loading ? (
          <View style={s.center}><ActivityIndicator size="large" color="#4F8EF7" /></View>
        ) : items.length === 0 ? (
          <View style={s.center}>
            <Ionicons name="cart-outline" size={56} color="#333" />
            <Text style={s.emptyTitle}>המלאי ריק</Text>
            <Text style={s.emptyText}>סרוק קבלה או הוסף מוצרים ידנית{'\n'}כדי לדעת מה יש לך בבית</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            {cats.map(cat => (
              <View key={cat} style={s.catBlock}>
                <View style={s.catTitleRow}>
                  <Text style={s.catTitle}>{CATEGORIES[cat].label}</Text>
                  <Ionicons name={CATEGORIES[cat].icon} size={16} color="#888" />
                </View>
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
        <CookModal visible={showCook} onClose={() => setShowCook(false)} />
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
              <Text style={[s.chipTxt, category === c && s.chipTxtActive]}>{CATEGORIES[c].label}</Text>
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
  const [phase, setPhase] = useState('camera'); // 'camera' | 'processing' | 'review'
  const [result, setResult] = useState([]);
  const [saving, setSaving] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => { if (visible) { setPhase('camera'); setResult([]); } }, [visible]);

  const capture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.6, base64: false });
      setPhase('processing');
      const r = await scanReceipt(photo.uri);
      if (r.items?.length > 0) { setResult(r.items); setPhase('review'); }
      else { Alert.alert('לא זוהו מוצרים', r.error ?? 'נסה לצלם את הקבלה בתאורה טובה'); setPhase('camera'); }
    } catch { Alert.alert('שגיאה', 'לא ניתן לסרוק את הקבלה'); setPhase('camera'); }
  };

  const removeRow = (i) => setResult(prev => prev.filter((_, idx) => idx !== i));
  const adjustQty = (i, delta) =>
    setResult(prev => prev.map((it, idx) =>
      idx === i ? { ...it, quantity: Math.max(0.5, Math.round(((it.quantity || 1) + delta) * 10) / 10) } : it));

  const confirm = async () => {
    if (result.length === 0) { onClose(); return; }
    setSaving(true);
    try { await addInventoryBulk(result); onDone(); }
    catch { Alert.alert('שגיאה', 'לא הצלחתי לשמור'); }
    finally { setSaving(false); }
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

        {phase === 'review' && (
          <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 56 }}>
            <Text style={s.reviewTitle}>זוהו {result.length} מוצרים</Text>
            <Text style={s.reviewSub}>ערוך כמויות או הסר פריטים, ואז אשר</Text>
            {result.map((it, i) => (
              <View key={i} style={s.itemRow}>
                <TouchableOpacity onPress={() => removeRow(i)} style={{ padding: 4 }}>
                  <Ionicons name="trash-outline" size={18} color="#ff6b6b" />
                </TouchableOpacity>
                <View style={s.qtyStepperSm}>
                  <TouchableOpacity onPress={() => adjustQty(i, 1)} style={s.stepBtn}><Text style={s.stepTxt}>+</Text></TouchableOpacity>
                  <Text style={s.stepValSm}>{formatQty(it.quantity)}</Text>
                  <TouchableOpacity onPress={() => adjustQty(i, -1)} style={s.stepBtn}><Text style={s.stepTxt}>−</Text></TouchableOpacity>
                </View>
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Text style={s.itemName}>{it.name_he}</Text>
                  <Text style={s.itemQty}>{it.unit}</Text>
                </View>
                <Ionicons name={(CATEGORIES[it.category] || CATEGORIES.other).icon} size={18} color="#666" />
              </View>
            ))}
            <TouchableOpacity style={s.saveBtn} onPress={confirm} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnTxt}>אשר והוסף {result.length} למלאי</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={s.cancelBtn} onPress={onClose}><Text style={s.cancelTxt}>ביטול</Text></TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

// ─── Cook from inventory ─────────────────────────────────────────────────────────
function CookModal({ visible, onClose }) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    fetchCookSuggestions()
      .then(r => setRecipes(r.recipes ?? []))
      .catch(() => setRecipes([]))
      .finally(() => setLoading(false));
  }, [visible]);

  const matchColor = (pct) => pct >= 80 ? '#4CAF50' : pct >= 50 ? '#ffd700' : '#ff9800';

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={onClose}><Ionicons name="close" size={26} color="#fff" /></TouchableOpacity>
          <Text style={s.title}>מה אפשר להכין</Text>
        </View>

        {loading ? (
          <View style={s.center}><ActivityIndicator size="large" color="#4F8EF7" /></View>
        ) : recipes.length === 0 ? (
          <View style={s.center}>
            <Ionicons name="restaurant-outline" size={52} color="#333" />
            <Text style={s.emptyTitle}>לא נמצאו מתכונים</Text>
            <Text style={s.emptyText}>הוסף עוד מוצרים למלאי{'\n'}כדי לקבל הצעות</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            {recipes.map((r, i) => {
              const total = (r.available?.length ?? 0) + (r.missing?.length ?? 0);
              return (
                <View key={r.recipe_id ?? i} style={s.cookCard}>
                  {r.image_url
                    ? <Image source={{ uri: r.image_url }} style={s.cookImg} resizeMode="cover" />
                    : <View style={[s.cookImg, s.cookImgEmpty]}><Ionicons name="restaurant-outline" size={36} color="#444" /></View>}
                  <View style={s.cookBody}>
                    <Text style={s.cookName}>{r.name_he ?? r.name_en}</Text>
                    <View style={s.cookMatch}>
                      <Ionicons name="checkmark-circle" size={16} color={matchColor(r.match_pct)} />
                      <Text style={[s.cookMatchTxt, { color: matchColor(r.match_pct) }]}>
                        יש לך {r.available?.length ?? 0} מתוך {total} מרכיבים
                      </Text>
                    </View>
                    {r.missing?.length > 0 && (
                      <Text style={s.cookMissing}>חסר: {r.missing.join(' · ')}</Text>
                    )}
                  </View>
                </View>
              );
            })}
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
  cookBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 16, marginBottom: 8, backgroundColor: '#1a2e1a', borderWidth: 1, borderColor: '#2e5a2e', borderRadius: 12, paddingVertical: 13 },
  cookBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 8 },
  emptyText: { color: '#666', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  catBlock: { marginBottom: 18 },
  catTitleRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginBottom: 8 },
  catTitle: { color: '#888', fontSize: 14, fontWeight: '700', textAlign: 'right' },
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
  reviewTitle: { color: '#fff', fontSize: 19, fontWeight: '800', textAlign: 'center' },
  reviewSub: { color: '#777', fontSize: 13, textAlign: 'center', marginTop: 4, marginBottom: 16 },
  qtyStepperSm: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 8 },
  stepValSm: { color: '#fff', fontSize: 13, fontWeight: '700', minWidth: 28, textAlign: 'center' },
  cancelBtn: { paddingVertical: 12, alignItems: 'center', marginTop: 6 },
  cancelTxt: { color: '#888', fontSize: 14 },

  // Cook suggestions
  cookCard: { backgroundColor: '#141414', borderRadius: 16, overflow: 'hidden', marginBottom: 14 },
  cookImg: { width: '100%', height: 130 },
  cookImgEmpty: { backgroundColor: '#1e1e1e', alignItems: 'center', justifyContent: 'center' },
  cookBody: { padding: 14 },
  cookName: { color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'right' },
  cookMatch: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginTop: 6 },
  cookMatchTxt: { fontSize: 13, fontWeight: '700' },
  cookMissing: { color: '#888', fontSize: 12, textAlign: 'right', marginTop: 6 },
});
