import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, RefreshControl, Alert, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchDailyPlan, fetchWater, addWater, fetchMealSuggestions, addFoodEntry } from '../api/client';

const MEALS = [
  { key: 'BREAKFAST',       label: 'בוקר' },
  { key: 'MORNING_SNACK',   label: 'חטיף בוקר' },
  { key: 'LUNCH',           label: 'צהריים' },
  { key: 'AFTERNOON_SNACK', label: 'חטיף צ' },
  { key: 'DINNER',          label: 'ערב' },
  { key: 'EVENING_SNACK',   label: 'חטיף ע' },
];

function RecipeCard({ recipe, targetCal, index, total, onRefresh, mealType }) {
  const [ate, setAte] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const n = recipe?.total_nutrition ?? {};
  return (
    <View style={styles.recipeCard}>
      {/* Image */}
      {recipe?.image_url ? (
        <Image source={{ uri: recipe.image_url }} style={styles.recipeImage} resizeMode="cover" />
      ) : (
        <View style={[styles.recipeImage, styles.imagePlaceholder]}>
          <Text style={{ fontSize: 52 }}>🍽️</Text>
        </View>
      )}

      <View style={styles.recipeBody}>
        {/* Name + refresh */}
        <View style={styles.recipeTopRow}>
          <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
            <Ionicons name="refresh" size={14} color="#4F8EF7" />
            <Text style={styles.refreshTxt}>רענן</Text>
          </TouchableOpacity>
          <Text style={styles.recipeName} numberOfLines={2}>
            {recipe?.name_he ?? recipe?.name_en ?? 'מתכון'}
          </Text>
        </View>

        {/* Calories */}
        <View style={styles.calorieRow}>
          <Text style={styles.calorieActual}>{Math.round(n.calories ?? 0)} קק"ל</Text>
          <Text style={styles.calorieTarget}>יעד: {targetCal} קק"ל</Text>
        </View>

        {/* Macros */}
        <View style={styles.macrosRow}>
          <View style={[styles.macroBadge, { borderColor: '#ff6b6b' }]}>
            <Text style={[styles.macroVal, { color: '#ff6b6b' }]}>{Math.round(n.fat ?? 0)}g</Text>
            <Text style={styles.macroLbl}>שומן</Text>
          </View>
          <View style={[styles.macroBadge, { borderColor: '#ffd700' }]}>
            <Text style={[styles.macroVal, { color: '#ffd700' }]}>{Math.round(n.carbs ?? 0)}g</Text>
            <Text style={styles.macroLbl}>פחמ'</Text>
          </View>
          <View style={[styles.macroBadge, { borderColor: '#4F8EF7' }]}>
            <Text style={[styles.macroVal, { color: '#4F8EF7' }]}>{Math.round(n.protein ?? 0)}g</Text>
            <Text style={styles.macroLbl}>חלבון</Text>
          </View>
        </View>

        {/* Ingredients */}
        {recipe?.ingredients?.length > 0 && (
          <Text style={styles.ingredients} numberOfLines={2}>
            {recipe.ingredients.slice(0, 4).map(i => i.food_name ?? i.food_name_en).join(' · ')}
          </Text>
        )}

        {/* Action buttons */}
        <View style={styles.cardActions}>
          {recipe?.instructions && (
            <TouchableOpacity style={styles.instrBtn} onPress={() => setShowInstructions(true)}>
              <Ionicons name="list-outline" size={14} color="#888" />
              <Text style={styles.instrTxt}>הוראות הכנה</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.ateBtn, ate && styles.ateBtnDone]}
            onPress={async () => {
              if (ate) return;
              try {
                const n = recipe?.total_nutrition ?? {};
                await addFoodEntry({
                  food_id: recipe?.recipe_id ?? 'recipe',
                  food_name: recipe?.name_he ?? recipe?.name_en ?? 'מתכון',
                  grams: 100,
                  calories: Math.round(n.calories ?? 0),
                  protein: Math.round(n.protein ?? 0),
                  carbs: Math.round(n.carbs ?? 0),
                  fat: Math.round(n.fat ?? 0),
                  meal_type: mealType ?? 'LUNCH',
                });
                setAte(true);
                Alert.alert('✓ נרשם!', 'הארוחה נוספה לתזונה היומית');
              } catch { Alert.alert('שגיאה', 'לא הצלחתי לרשום'); }
            }}
          >
            <Ionicons name={ate ? 'checkmark-circle' : 'restaurant'} size={14} color={ate ? '#4CAF50' : '#fff'} />
            <Text style={[styles.ateTxt, ate && { color: '#4CAF50' }]}>{ate ? 'נרשם!' : 'אכלתי את זה'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Instructions Modal */}
      <Modal visible={showInstructions} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowInstructions(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{recipe?.name_he ?? 'הוראות הכנה'}</Text>
            </View>
            <ScrollView>
              <Text style={styles.instrText}>{recipe?.instructions}</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function HomeScreen() {
  const [plan, setPlan] = useState(null);
  const [water, setWater] = useState({ total_ml: 0, goal_ml: 2000 });
  const [activeMeal, setActiveMeal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [seeds, setSeeds] = useState({});
  const [mealRecipes, setMealRecipes] = useState({});

  const load = useCallback(async () => {
    try {
      const [planData, waterData] = await Promise.all([
        fetchDailyPlan().catch(() => null),
        fetchWater().catch(() => ({ total_ml: 0, goal_ml: 2000 })),
      ]);
      setPlan(planData);
      setWater(waterData ?? { total_ml: 0, goal_ml: 2000 });
      if (planData?.plan) {
        const recipes = {};
        Object.entries(planData.plan).forEach(([k, v]) => {
          recipes[k] = v.recipes ?? [];
        });
        setMealRecipes(recipes);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleGenerate = async () => {
    setGenerating(true);
    try { await load(); }
    catch { Alert.alert('שגיאה', 'לא ניתן להכין תפריט'); }
    finally { setGenerating(false); }
  };

  const handleRefreshMeal = async (mealKey) => {
    const meal = plan?.plan?.[mealKey];
    if (!meal) return;
    const newSeed = (seeds[mealKey] ?? 0) + 1;
    setSeeds(s => ({ ...s, [mealKey]: newSeed }));
    try {
      const res = await fetchMealSuggestions(mealKey, meal.target_calories, newSeed);
      if (res.recipes?.length > 0) {
        setMealRecipes(r => ({ ...r, [mealKey]: res.recipes }));
      }
    } catch {}
  };

  const handleAddWater = async () => {
    try {
      await addWater(250);
      setWater(w => ({ ...w, total_ml: (w.total_ml ?? 0) + 250 }));
    } catch {}
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#4F8EF7" />
    </View>
  );

  const totalTarget = plan?.total_target ?? 2500;
  const totalMl = water?.total_ml ?? 0;
  const goalMl = water?.goal_ml ?? 2000;
  const glasses = Math.round(totalMl / 250);
  const goalGlasses = Math.round(goalMl / 250);
  const activeMealKey = MEALS[activeMeal]?.key;
  const activeMealData = plan?.plan?.[activeMealKey];
  const activeRecipes = mealRecipes[activeMealKey] ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.dateText}>{new Date().toLocaleDateString('he-IL')}</Text>
        <Text style={styles.logo}>BiteFit</Text>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#4F8EF7" />}
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

        {/* Water */}
        <View style={styles.waterRow}>
          <View style={styles.glassesWrap}>
            {Array.from({ length: goalGlasses }).map((_, i) => (
              <Ionicons key={i} name={i < glasses ? 'water' : 'water-outline'} size={20}
                color={i < glasses ? '#4F8EF7' : '#333'} style={{ marginHorizontal: 2 }} />
            ))}
          </View>
          <TouchableOpacity style={styles.waterBtn} onPress={handleAddWater}>
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.waterBtnTxt}>כוס</Text>
          </TouchableOpacity>
        </View>

        {/* Meal hint */}
        {activeMealData && (
          <Text style={styles.mealHint}>
            ארוחה קלה ומזינה · יעד:{' '}
            <Text style={styles.mealHintCal}>{activeMealData.target_calories} קק"ל</Text>
          </Text>
        )}

        {/* 3 recipe cards */}
        {activeRecipes.length > 0 ? (
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
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 52, paddingBottom: 8 },
  dateText: { color: '#555', fontSize: 13 },
  logo: { fontSize: 20, fontWeight: '800', color: '#4F8EF7' },
  titleSection: { paddingHorizontal: 16, paddingBottom: 10 },
  pageTitle: { color: '#fff', fontSize: 15, fontWeight: '700', textAlign: 'right' },
  pageSub: { color: '#888', fontSize: 13, textAlign: 'right', marginTop: 2 },
  actionRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 10 },
  generateBtn: { flex: 1, backgroundColor: '#4F8EF7', borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  generateTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
  clearBtn: { backgroundColor: '#1a1a1a', borderRadius: 10, paddingVertical: 13, paddingHorizontal: 18, alignItems: 'center', borderWidth: 1, borderColor: '#2a2a2a' },
  clearTxt: { color: '#aaa', fontSize: 15 },
  divider: { height: 1, backgroundColor: '#1a1a1a', marginHorizontal: 16, marginBottom: 10 },
  tabsContent: { paddingHorizontal: 16, gap: 4 },
  tabWrap: { paddingHorizontal: 12, paddingBottom: 10, alignItems: 'center' },
  tabText: { color: '#555', fontSize: 14 },
  tabTextActive: { color: '#4F8EF7', fontWeight: '700' },
  tabUnderline: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: '#4F8EF7', borderRadius: 1 },
  waterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  glassesWrap: { flexDirection: 'row' },
  waterBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4F8EF7', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, gap: 3 },
  waterBtnTxt: { color: '#fff', fontSize: 13, fontWeight: '600' },
  mealHint: { color: '#888', fontSize: 13, textAlign: 'right', paddingHorizontal: 16, paddingBottom: 8 },
  mealHintCal: { color: '#ffd700', fontWeight: '700' },
  cardsList: { paddingHorizontal: 16, gap: 14, paddingBottom: 28 },
  recipeCard: { backgroundColor: '#141414', borderRadius: 16, overflow: 'hidden' },
  recipeImage: { width: '100%', height: 200 },
  imagePlaceholder: { backgroundColor: '#1e1e1e', justifyContent: 'center', alignItems: 'center' },
  recipeBody: { padding: 14 },
  recipeTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  recipeName: { color: '#fff', fontSize: 17, fontWeight: '700', flex: 1, textAlign: 'right' },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 8 },
  refreshTxt: { color: '#4F8EF7', fontSize: 13 },
  calorieRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  calorieActual: { color: '#4F8EF7', fontSize: 15, fontWeight: '700' },
  calorieTarget: { color: '#666', fontSize: 13 },
  macrosRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  macroBadge: { flex: 1, borderRadius: 10, borderWidth: 1, padding: 10, alignItems: 'center' },
  macroVal: { fontSize: 15, fontWeight: '700' },
  macroLbl: { color: '#888', fontSize: 11, marginTop: 3 },
  ingredients: { color: '#555', fontSize: 12, textAlign: 'right', marginTop: 4 },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  instrBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1e1e1e', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: '#2a2a2a' },
  instrTxt: { color: '#888', fontSize: 12 },
  ateBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#4F8EF7', borderRadius: 8, paddingVertical: 9 },
  ateBtnDone: { backgroundColor: '#0a2a1a', borderWidth: 1, borderColor: '#4CAF50' },
  ateTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#141414', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '75%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: '#fff', fontSize: 17, fontWeight: '700', flex: 1, textAlign: 'right' },
  instrText: { color: '#ccc', fontSize: 15, lineHeight: 26, textAlign: 'right', paddingBottom: 40 },
  noRecipes: { padding: 32, alignItems: 'center', gap: 12 },
  noRecipesText: { color: '#555', fontSize: 14 },
  retryBtn: { backgroundColor: '#1a1a1a', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  retryTxt: { color: '#4F8EF7', fontSize: 14 },
  emptyState: { paddingTop: 48, alignItems: 'center', gap: 14, paddingBottom: 24 },
  emptyText: { color: '#555', fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
});
