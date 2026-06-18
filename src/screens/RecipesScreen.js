import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Image, Dimensions, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchRecipes, addFoodEntry } from '../api/client';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

const TAGS = ['הכל', 'בוקר', 'צהריים', 'ערב', 'חטיף', 'ישראלי', 'מהיר'];

// Recipes carry meal info in `meal_types` (BREAKFAST/LUNCH/...) and English `tags`
// (quick/israeli/...). Map each Hebrew chip to the field it actually lives in.
const TAG_RULES = {
  'בוקר':    r => (r.meal_types ?? []).includes('BREAKFAST'),
  'צהריים':  r => (r.meal_types ?? []).includes('LUNCH'),
  'ערב':     r => (r.meal_types ?? []).includes('DINNER'),
  'חטיף':    r => (r.meal_types ?? []).some(m => m.includes('SNACK')),
  'ישראלי':  r => (r.tags ?? []).some(t => t === 'israeli' || t === 'traditional'),
  'מהיר':    r => (r.tags ?? []).includes('quick'),
};

export default function RecipesScreen() {
  const PAGE = 24;
  const [recipes, setRecipes] = useState([]);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('הכל');
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE);

  useEffect(() => {
    fetchRecipes()
      .then(data => setRecipes(Array.isArray(data) ? data : data?.recipes ?? []))
      .catch(() => setRecipes([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = recipes.filter(r => {
    const name = (r.name_he ?? r.name_en ?? '').toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase());
    const matchTag = activeTag === 'הכל' || (TAG_RULES[activeTag]?.(r) ?? false);
    return matchSearch && matchTag;
  });

  // Reset paging whenever the filter changes so we never render all 299 cards at once
  useEffect(() => { setVisibleCount(PAGE); }, [search, activeTag]);

  const visible = filtered.slice(0, visibleCount);

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#4F8EF7" />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>מתכונים</Text>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color="#555" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="חיפוש מתכון..."
          placeholderTextColor="#555"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Tag filter */}
      <FlatList
        horizontal
        data={TAGS}
        keyExtractor={t => t}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tagsRow}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.tag, activeTag === item && styles.tagActive]}
            onPress={() => setActiveTag(item)}
          >
            <Text style={[styles.tagText, activeTag === item && styles.tagTextActive]}>{item}</Text>
          </TouchableOpacity>
        )}
        style={styles.tagsList}
      />

      <Text style={styles.countText}>{filtered.length} מתכונים</Text>

      {/* Grid */}
      <FlatList
        data={visible}
        keyExtractor={item => String(item.recipe_id ?? item.id)}
        numColumns={2}
        columnWrapperStyle={styles.row}
        initialNumToRender={PAGE}
        maxToRenderPerBatch={PAGE}
        windowSize={5}
        onEndReachedThreshold={0.5}
        onEndReached={() => setVisibleCount(c => Math.min(c + PAGE, filtered.length))}
        ListFooterComponent={visible.length < filtered.length
          ? <Text style={styles.loadMore}>גלול לעוד מתכונים ({filtered.length - visible.length} נוספים)</Text>
          : null}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} activeOpacity={0.85}>
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} style={styles.img} resizeMode="cover" />
            ) : (
              <View style={[styles.img, styles.imgPlaceholder]}>
                <Text style={{ fontSize: 36 }}>🍽️</Text>
              </View>
            )}
            <View style={styles.cardBody}>
              <Text style={styles.cardName} numberOfLines={2}>{item.name_he ?? item.name_en}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.cardKcal}>{item.total_nutrition?.calories ?? item.calories ?? 0} קק"ל</Text>
                {item.prep_time_minutes && <Text style={styles.cardTime}>{item.prep_time_minutes}ד'</Text>}
              </View>
              <TouchableOpacity style={styles.addToLogBtn} onPress={async () => {
                try {
                  const n = item.total_nutrition ?? {};
                  await addFoodEntry({
                    food_id: item.recipe_id ?? 'recipe',
                    food_name: item.name_he ?? item.name_en ?? 'מתכון',
                    grams: 100, calories: n.calories ?? 0,
                    protein: n.protein ?? 0, carbs: n.carbs ?? 0, fat: n.fat ?? 0,
                    meal_type: 'LUNCH',
                  });
                } catch { Alert.alert('שגיאה', 'לא הצלחתי להוסיף'); }
              }}>
                <Text style={styles.addToLogTxt}>+ הוסף לתזונה</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 24, paddingHorizontal: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  title: { color: '#fff', fontSize: 22, fontWeight: '800', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12 },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#141414', borderRadius: 12, marginHorizontal: 16, marginBottom: 12, paddingHorizontal: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: '#fff', fontSize: 15, paddingVertical: 12 },
  tagsList: { marginBottom: 4 },
  tagsRow: { paddingHorizontal: 16, gap: 8 },
  tag: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#141414', borderWidth: 1, borderColor: '#222' },
  tagActive: { backgroundColor: '#1a2a4a', borderColor: '#4F8EF7' },
  tagText: { color: '#666', fontSize: 13 },
  tagTextActive: { color: '#4F8EF7', fontWeight: '700' },
  countText: { color: '#555', fontSize: 12, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, textAlign: 'right' },
  row: { justifyContent: 'space-between', marginBottom: 12 },
  card: { width: CARD_WIDTH, backgroundColor: '#141414', borderRadius: 16, overflow: 'hidden' },
  img: { width: '100%', height: 120 },
  imgPlaceholder: { backgroundColor: '#1e1e1e', justifyContent: 'center', alignItems: 'center' },
  cardBody: { padding: 10 },
  cardName: { color: '#fff', fontSize: 13, fontWeight: '600', textAlign: 'right', marginBottom: 6, lineHeight: 18 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardKcal: { color: '#ffd700', fontSize: 12, fontWeight: '600' },
  cardTime: { color: '#666', fontSize: 11 },
  addToLogBtn: { backgroundColor: '#1a2a4a', borderRadius: 8, paddingVertical: 6, alignItems: 'center', marginTop: 6, borderWidth: 1, borderColor: '#4F8EF7' },
  addToLogTxt: { color: '#4F8EF7', fontSize: 12, fontWeight: '700' },
  loadMore: { color: '#555', fontSize: 12, textAlign: 'center', marginVertical: 16 },
});
