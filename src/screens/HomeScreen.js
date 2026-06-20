import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, RefreshControl, Alert, Modal, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchDailyPlan, fetchMealSuggestions, addFoodEntry, searchMealRecipes } from '../api/client';

const MEALS = [
  { key: 'BREAKFAST',       label: 'בוקר' },
  { key: 'MORNING_SNACK',   label: 'חטיף בוקר' },
  { key: 'LUNCH',           label: 'צהריים' },
  { key: 'AFTERNOON_SNACK', label: 'חטיף צ' },
  { key: 'DINNER',          label: 'ערב' },
  { key: 'EVENING_SNACK',   label: 'חטיף ע' },
];

// Full recipe detail: ingredients in household units + nutrition + instructions
function RecipeDetailModal({ recipe, visible, onClose, onAte, ate }) {
  const n = recipe?.total_nutrition ?? {};
  const portions = recipe?.portions ?? 1;
  const ingredients = recipe?.ingredients ?? [];
  const scaled = !!recipe?.scaled_to_calories;  // searched & adjusted to the meal target
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.detailContainer}>
        {/* Header image */}
        {recipe?.image_url ? (
          <Image source={{ uri: recipe.image_url }} style={styles.detailImage} resizeMode="cover" />
        ) : (
          <View style={[styles.detailImage, styles.imagePlaceholder]}>
            <Text style={{ fontSize: 64 }}>🍽️</Text>
          </View>
        )}
        <TouchableOpacity style={styles.detailClose} onPress={onClose}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>

        <ScrollView contentContainerStyle={styles.detailBody} showsVerticalScrollIndicator={false}>
          <Text style={styles.detailName}>{recipe?.name_he ?? recipe?.name_en ?? 'מתכון'}</Text>

          {/* Meta row */}
          <View style={styles.detailMetaRow}>
            <View style={styles.detailMetaItem}>
              <Ionicons name="flame-outline" size={16} color="#5b9bdc" />
              <Text style={styles.detailMetaTxt}>{Math.round(n.calories ?? 0)} קק"ל</Text>
            </View>
            {recipe?.prep_time_minutes ? (
              <View style={styles.detailMetaItem}>
                <Ionicons name="time-outline" size={16} color="#888" />
                <Text style={styles.detailMetaTxt}>{recipe.prep_time_minutes} דק'</Text>
              </View>
            ) : null}
            <View style={styles.detailMetaItem}>
              <Ionicons name="person-outline" size={16} color="#888" />
              <Text style={styles.detailMetaTxt}>{scaled ? 'מנה אחת' : `${portions} מנות`}</Text>
            </View>
          </View>

          {/* Macros */}
          <View style={styles.macrosRow}>
            <View style={[styles.macroBadge, { borderColor: '#ef7d6c' }]}>
              <Text style={[styles.macroVal, { color: '#ef7d6c' }]}>{Math.round(n.fat ?? 0)}g</Text>
              <Text style={styles.macroLbl}>שומן</Text>
            </View>
            <View style={[styles.macroBadge, { borderColor: '#ffd700' }]}>
              <Text style={[styles.macroVal, { color: '#ffd700' }]}>{Math.round(n.carbs ?? 0)}g</Text>
              <Text style={styles.macroLbl}>פחמ'</Text>
            </View>
            <View style={[styles.macroBadge, { borderColor: '#5b9bdc' }]}>
              <Text style={[styles.macroVal, { color: '#5b9bdc' }]}>{Math.round(n.protein ?? 0)}g</Text>
              <Text style={styles.macroLbl}>חלבון</Text>
            </View>
          </View>

          {/* Ingredients — household units */}
          {ingredients.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>מצרכים{scaled ? ' (מותאם ליעד שלך)' : (portions > 1 ? ` (ל-${portions} מנות)` : '')}</Text>
              {ingredients.map((ing, i) => (
                <View key={i} style={styles.ingredientRow}>
                  <Text style={styles.ingredientQty}>{ing.display_he ?? `${ing.quantity ?? ''}ג`}</Text>
                  <View style={styles.ingredientBullet} />
                  <Text style={styles.ingredientName}>{ing.food_name ?? ing.food_name_en}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Instructions */}
          {recipe?.instructions ? (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>הוראות הכנה</Text>
              <Text style={styles.instrText}>{recipe.instructions}</Text>
            </View>
          ) : null}

          {/* Ate button */}
          <TouchableOpacity
            style={[styles.detailAteBtn, ate && styles.ateBtnDone]}
            onPress={onAte}
          >
            <Ionicons name={ate ? 'checkmark-circle' : 'restaurant'} size={18} color={ate ? '#56bd6b' : '#fff'} />
            <Text style={[styles.detailAteTxt, ate && { color: '#56bd6b' }]}>{ate ? 'נרשם ביומן!' : 'אכלתי את זה'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

function RecipeCard({ recipe, targetCal, index, total, onRefresh, mealType }) {
  const [ate, setAte] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const n = recipe?.total_nutrition ?? {};

  const handleAte = async () => {
    if (ate) return;
    try {
      const nn = recipe?.total_nutrition ?? {};
      await addFoodEntry({
        food_id: recipe?.recipe_id ?? 'recipe',
        food_name: recipe?.name_he ?? recipe?.name_en ?? 'מתכון',
        grams: 100,
        calories: Math.round(nn.calories ?? 0),
        protein: Math.round(nn.protein ?? 0),
        carbs: Math.round(nn.carbs ?? 0),
        fat: Math.round(nn.fat ?? 0),
        meal_type: mealType ?? 'LUNCH',
        image_url: recipe?.image_url ?? null,
      });
      setAte(true);
    } catch { Alert.alert('שגיאה', 'לא הצלחתי לרשום'); }
  };

  return (
    <View style={styles.recipeCard}>
      {/* Tappable area → opens full detail */}
      <TouchableOpacity activeOpacity={0.85} onPress={() => setShowDetail(true)}>
        {recipe?.image_url ? (
          <Image source={{ uri: recipe.image_url }} style={styles.recipeImage} resizeMode="cover" />
        ) : (
          <View style={[styles.recipeImage, styles.imagePlaceholder]}>
            <Text style={{ fontSize: 52 }}>🍽️</Text>
          </View>
        )}
        <View style={styles.tapBadge}>
          <Ionicons name="restaurant-outline" size={12} color="#fff" />
          <Text style={styles.tapBadgeTxt}>מצרכים והוראות</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.recipeBody}>
        {/* Name + refresh */}
        <View style={styles.recipeTopRow}>
          <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
            <Ionicons name="refresh" size={14} color="#5b9bdc" />
            <Text style={styles.refreshTxt}>רענן</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowDetail(true)}>
            <Text style={styles.recipeName} numberOfLines={2}>
              {recipe?.name_he ?? recipe?.name_en ?? 'מתכון'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Calories */}
        <View style={styles.calorieRow}>
          <Text style={styles.calorieActual}>{Math.round(n.calories ?? 0)} קק"ל</Text>
          <Text style={styles.calorieTarget}>יעד: {targetCal} קק"ל</Text>
        </View>

        {/* Macros */}
        <View style={styles.macrosRow}>
          <View style={[styles.macroBadge, { borderColor: '#ef7d6c' }]}>
            <Text style={[styles.macroVal, { color: '#ef7d6c' }]}>{Math.round(n.fat ?? 0)}g</Text>
            <Text style={styles.macroLbl}>שומן</Text>
          </View>
          <View style={[styles.macroBadge, { borderColor: '#ffd700' }]}>
            <Text style={[styles.macroVal, { color: '#ffd700' }]}>{Math.round(n.carbs ?? 0)}g</Text>
            <Text style={styles.macroLbl}>פחמ'</Text>
          </View>
          <View style={[styles.macroBadge, { borderColor: '#5b9bdc' }]}>
            <Text style={[styles.macroVal, { color: '#5b9bdc' }]}>{Math.round(n.protein ?? 0)}g</Text>
            <Text style={styles.macroLbl}>חלבון</Text>
          </View>
        </View>

        {/* Ingredients preview — household units */}
        {recipe?.ingredients?.length > 0 && (
          <Text style={styles.ingredients} numberOfLines={2}>
            {recipe.ingredients.slice(0, 4).map(i => i.display_he ?? i.food_name ?? i.food_name_en).join(' · ')}
          </Text>
        )}

        {/* Action buttons */}
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.instrBtn} onPress={() => setShowDetail(true)}>
            <Ionicons name="list-outline" size={14} color="#888" />
            <Text style={styles.instrTxt}>פרטים</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.ateBtn, ate && styles.ateBtnDone]} onPress={handleAte}>
            <Ionicons name={ate ? 'checkmark-circle' : 'restaurant'} size={14} color={ate ? '#56bd6b' : '#fff'} />
            <Text style={[styles.ateTxt, ate && { color: '#56bd6b' }]}>{ate ? 'נרשם!' : 'אכלתי את זה'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <RecipeDetailModal
        recipe={recipe}
        visible={showDetail}
        onClose={() => setShowDetail(false)}
        onAte={handleAte}
        ate={ate}
      />
    </View>
  );
}

export default function HomeScreen() {
  const [plan, setPlan] = useState(null);
  const [activeMeal, setActiveMeal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [seeds, setSeeds] = useState({});
  const [mealRecipes, setMealRecipes] = useState({});
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState(null); // null = not searching
  const [searching, setSearching] = useState(false);

  const load = useCallback(async () => {
    try {
      const planData = await fetchDailyPlan().catch(() => null);
      setPlan(planData);

      // Fetch suggestions for all meals in parallel
      const results = await Promise.allSettled(
        MEALS.map(({ key }) => {
          const targetCal = planData?.plan?.[key]?.target_calories ?? 500;
          return fetchMealSuggestions(key, targetCal, 0)
            .then(r => ({ key, recipes: r.recipes ?? [] }));
        })
      );
      const recipes = {};
      results.forEach(r => {
        if (r.status === 'fulfilled' && r.value.recipes.length > 0) {
          recipes[r.value.key] = r.value.recipes;
        }
      });
      setMealRecipes(recipes);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleGenerate = async () => {
    setGenerating(true);
    setMealRecipes({});
    try {
      const planData = await fetchDailyPlan();
      setPlan(planData);
      setActiveMeal(0);

      // Fetch suggestions for all 6 meals in parallel
      const results = await Promise.allSettled(
        MEALS.map(({ key }) => {
          const targetCal = planData?.plan?.[key]?.target_calories ?? 500;
          return fetchMealSuggestions(key, targetCal, 0)
            .then(r => ({ key, recipes: r.recipes ?? [] }));
        })
      );

      const recipes = {};
      results.forEach(r => {
        if (r.status === 'fulfilled' && r.value.recipes.length > 0) {
          recipes[r.value.key] = r.value.recipes;
        }
      });
      setMealRecipes(recipes);
    } catch (e) {
      Alert.alert('שגיאת חיבור', `לא ניתן להכין תפריט.\n${e?.message ?? e}`);
    } finally { setGenerating(false); }
  };

  const handleRefreshMeal = async (mealKey) => {
    const meal = plan?.plan?.[mealKey];
    const newSeed = (seeds[mealKey] ?? 0) + 1;
    setSeeds(s => ({ ...s, [mealKey]: newSeed }));
    try {
      const targetCal = meal?.target_calories ?? 500;
      const res = await fetchMealSuggestions(mealKey, targetCal, newSeed);
      if (res.recipes?.length > 0) {
        setMealRecipes(r => ({ ...r, [mealKey]: res.recipes }));
      }
    } catch {}
  };

  const handleSearch = async () => {
    const q = searchText.trim();
    if (!q) { setSearchResults(null); return; }
    setSearching(true);
    try {
      const targetCal = plan?.plan?.[MEALS[activeMeal]?.key]?.target_calories ?? 500;
      const res = await searchMealRecipes(q, targetCal);
      setSearchResults(res.recipes ?? []);
    } catch {
      Alert.alert('שגיאה', 'החיפוש נכשל');
      setSearchResults([]);
    } finally { setSearching(false); }
  };

  const clearSearch = () => { setSearchText(''); setSearchResults(null); };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#5b9bdc" />
    </View>
  );

  const totalTarget = plan?.total_target ?? 2500;
  const activeMealKey = MEALS[activeMeal]?.key;
  const activeMealData = plan?.plan?.[activeMealKey];
  const activeRecipes = mealRecipes[activeMealKey] ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.dateText}>{new Date().toLocaleDateString('he-IL')}</Text>
        <Text style={styles.logo}>NutriSmart</Text>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#5b9bdc" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>תפריט יומי מותאם אישית</Text>
          <Text style={styles.pageSub}>יעד: {totalTarget} קק"ל ליום</Text>
        </View>

        {/* Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.clearBtn} onPress={() => { setMealRecipes({}); setPlan(null); }}>
            <Text style={styles.clearTxt}>נקה</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate} disabled={generating}>
            {generating
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.generateTxt}>הכן לי תפריט להיום</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Meal tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
          {MEALS.map((m, i) => (
            <TouchableOpacity key={m.key} style={styles.tabWrap} onPress={() => setActiveMeal(i)}>
              <Text style={[styles.tabText, activeMeal === i && styles.tabTextActive]}>{m.label}</Text>
              {activeMeal === i && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Meal target */}
        {activeMealData && (
          <Text style={styles.mealHint}>
            יעד:{' '}
            <Text style={styles.mealHintCal}>{activeMealData.target_calories} קק"ל</Text>
          </Text>
        )}

        {/* Recipe search — pick any dish, scaled to this meal's target */}
        <View style={styles.searchRow}>
          {searchResults !== null && (
            <TouchableOpacity style={styles.searchClear} onPress={clearSearch}>
              <Ionicons name="close" size={18} color="#888" />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
            {searching
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="search" size={18} color="#fff" />}
          </TouchableOpacity>
          <TextInput
            style={styles.searchInput}
            placeholder="חפש מתכון (למשל: שקשוקה)..."
            placeholderTextColor="#555"
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            textAlign="right"
          />
        </View>

        {/* Search results (scaled to meal target) */}
        {searchResults !== null ? (
          searchResults.length > 0 ? (
            <View style={styles.cardsList}>
              {searchResults.map((recipe, idx) => (
                <RecipeCard
                  key={recipe?.recipe_id ?? idx}
                  recipe={recipe}
                  targetCal={activeMealData?.target_calories ?? 0}
                  index={idx}
                  total={searchResults.length}
                  mealType={activeMealKey}
                  onRefresh={() => handleRefreshMeal(activeMealKey)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.noRecipes}>
              <Text style={styles.noRecipesText}>לא נמצאו מתכונים ל"{searchText}"</Text>
            </View>
          )
        ) : activeRecipes.length > 0 ? (
          <View style={styles.cardsList}>
            {activeRecipes.map((recipe, idx) => (
              <RecipeCard
                key={recipe?.recipe_id ?? idx}
                recipe={recipe}
                targetCal={activeMealData?.target_calories ?? 0}
                index={idx}
                total={activeRecipes.length}
                mealType={activeMealKey}
                onRefresh={() => handleRefreshMeal(activeMealKey)}
              />
            ))}
          </View>
        ) : activeMealData ? (
          <View style={styles.noRecipes}>
            <Text style={styles.noRecipesText}>אין מתכונים לארוחה זו</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => handleRefreshMeal(activeMealKey)}>
              <Text style={styles.retryTxt}>נסה שוב</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="restaurant-outline" size={64} color="#222" />
            <Text style={styles.emptyText}>לחץ "הכן לי תפריט להיום" כדי להתחיל</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c1622' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0c1622' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 52, paddingBottom: 8 },
  dateText: { color: '#555', fontSize: 13 },
  logo: { fontSize: 20, fontWeight: '800', color: '#5b9bdc' },
  titleSection: { paddingHorizontal: 16, paddingBottom: 10 },
  pageTitle: { color: '#fff', fontSize: 15, fontWeight: '700', textAlign: 'right' },
  pageSub: { color: '#888', fontSize: 13, textAlign: 'right', marginTop: 2 },
  actionRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 10 },
  generateBtn: { flex: 1, backgroundColor: '#5b9bdc', borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  generateTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
  clearBtn: { backgroundColor: '#1b2c3d', borderRadius: 10, paddingVertical: 13, paddingHorizontal: 18, alignItems: 'center', borderWidth: 1, borderColor: '#2e455c' },
  clearTxt: { color: '#aaa', fontSize: 15 },
  divider: { height: 1, backgroundColor: '#1b2c3d', marginHorizontal: 16, marginBottom: 10 },
  tabsContent: { paddingHorizontal: 16, gap: 4 },
  tabWrap: { paddingHorizontal: 12, paddingBottom: 10, alignItems: 'center' },
  tabText: { color: '#555', fontSize: 14 },
  tabTextActive: { color: '#5b9bdc', fontWeight: '700' },
  tabUnderline: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: '#5b9bdc', borderRadius: 1 },
  mealHint: { color: '#888', fontSize: 13, textAlign: 'right', paddingHorizontal: 16, paddingBottom: 8 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, marginBottom: 10 },
  searchInput: { flex: 1, backgroundColor: '#14212f', color: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, borderWidth: 1, borderColor: '#23384c' },
  searchBtn: { backgroundColor: '#5b9bdc', borderRadius: 10, width: 40, height: 38, alignItems: 'center', justifyContent: 'center' },
  searchClear: { backgroundColor: '#1b2c3d', borderRadius: 10, width: 40, height: 38, alignItems: 'center', justifyContent: 'center' },
  mealHintCal: { color: '#ffd700', fontWeight: '700' },
  cardsList: { paddingHorizontal: 16, gap: 14, paddingBottom: 28 },
  recipeCard: { backgroundColor: '#14212f', borderRadius: 16, overflow: 'hidden' },
  recipeImage: { width: '100%', height: 200 },
  imagePlaceholder: { backgroundColor: '#23384c', justifyContent: 'center', alignItems: 'center' },
  recipeBody: { padding: 14 },
  recipeTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  recipeName: { color: '#fff', fontSize: 17, fontWeight: '700', flex: 1, textAlign: 'right' },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 8 },
  refreshTxt: { color: '#5b9bdc', fontSize: 13 },
  calorieRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  calorieActual: { color: '#5b9bdc', fontSize: 15, fontWeight: '700' },
  calorieTarget: { color: '#666', fontSize: 13 },
  macrosRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  macroBadge: { flex: 1, borderRadius: 10, borderWidth: 1, padding: 10, alignItems: 'center' },
  macroVal: { fontSize: 15, fontWeight: '700' },
  macroLbl: { color: '#888', fontSize: 11, marginTop: 3 },
  ingredients: { color: '#555', fontSize: 12, textAlign: 'right', marginTop: 4 },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  instrBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#23384c', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: '#2e455c' },
  instrTxt: { color: '#888', fontSize: 12 },
  ateBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#5b9bdc', borderRadius: 8, paddingVertical: 9 },
  ateBtnDone: { backgroundColor: '#0a2a1a', borderWidth: 1, borderColor: '#56bd6b' },
  ateTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#14212f', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '75%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: '#fff', fontSize: 17, fontWeight: '700', flex: 1, textAlign: 'right' },
  instrText: { color: '#ccc', fontSize: 15, lineHeight: 26, textAlign: 'right' },

  // Tap badge on card image
  tapBadge: { position: 'absolute', bottom: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  tapBadgeTxt: { color: '#fff', fontSize: 11, fontWeight: '600' },

  // Recipe detail modal
  detailContainer: { flex: 1, backgroundColor: '#0c1622' },
  detailImage: { width: '100%', height: 240 },
  detailClose: { position: 'absolute', top: 48, left: 16, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, padding: 8 },
  detailBody: { padding: 18, paddingBottom: 48 },
  detailName: { color: '#fff', fontSize: 22, fontWeight: '800', textAlign: 'right', marginBottom: 12 },
  detailMetaRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 18, marginBottom: 16 },
  detailMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailMetaTxt: { color: '#aaa', fontSize: 13, fontWeight: '600' },
  detailSection: { marginTop: 22 },
  detailSectionTitle: { color: '#fff', fontSize: 17, fontWeight: '700', textAlign: 'right', marginBottom: 12 },
  ingredientRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 10, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#1b2c3d' },
  ingredientName: { color: '#ddd', fontSize: 15, textAlign: 'right' },
  ingredientBullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#5b9bdc' },
  ingredientQty: { color: '#5b9bdc', fontSize: 15, fontWeight: '700', textAlign: 'left', minWidth: 90 },
  detailAteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#5b9bdc', borderRadius: 12, paddingVertical: 14, marginTop: 28 },
  detailAteTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  noRecipes: { padding: 32, alignItems: 'center', gap: 12 },
  noRecipesText: { color: '#555', fontSize: 14 },
  retryBtn: { backgroundColor: '#1b2c3d', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  retryTxt: { color: '#5b9bdc', fontSize: 14 },
  emptyState: { paddingTop: 48, alignItems: 'center', gap: 14, paddingBottom: 24 },
  emptyText: { color: '#555', fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
});
