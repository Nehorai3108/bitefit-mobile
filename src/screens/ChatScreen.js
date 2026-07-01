import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useSwipeNav } from '../hooks/useSwipeNav';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAudioRecorder, RecordingPresets, AudioModule, setAudioModeAsync } from 'expo-audio';
import { chatMessage, addFoodEntry, searchFoodNutrition, fetchDailyInsight, transcribeAudio } from '../api/client';
import { useTheme } from '../context/ThemeContext';

const WEEK_KEY = '@week_plan_v1';
const CHAT_KEY = '@chat_history_v1';
const MEAL_KEYS = ['BREAKFAST', 'MORNING_SNACK', 'LUNCH', 'AFTERNOON_SNACK', 'DINNER'];

// Insert a chat recipe into today's slot in the saved weekly plan.
async function addRecipeToMenu(recipe) {
  const raw = await AsyncStorage.getItem(WEEK_KEY);
  if (!raw) return 'no_plan';
  const week = JSON.parse(raw);
  const todayIdx = new Date().getDay(); // 0=Sun … matches plan day order
  const day = week.days?.[todayIdx];
  if (!day) return 'no_plan';
  let meal = (recipe.meal_type || 'LUNCH').toUpperCase();
  if (!MEAL_KEYS.includes(meal)) meal = 'LUNCH';
  const foods = recipe.foods ?? [];
  const sum = (k) => foods.reduce((a, f) => a + (f[k] ?? 0), 0);
  const planRecipe = {
    recipe_id: 'chat',
    name_he: recipe.title,
    total_nutrition: {
      calories: Math.round(recipe.total_calories ?? sum('calories')),
      protein: Math.round((recipe.total_protein ?? sum('protein')) * 10) / 10,
      carbs: Math.round(sum('carbs') * 10) / 10,
      fat: Math.round(sum('fat') * 10) / 10,
    },
    ingredients: foods.map(f => ({
      food_name: f.name_he ?? f.name, quantity: f.grams, unit: 'grams',
      display_he: `${f.name_he ?? f.name}${f.grams ? ` (${Math.round(f.grams)}ג)` : ''}`,
    })),
    instructions: recipe.instructions,
    image_url: recipe.image_url ?? null,
    fromChat: true,
  };
  day.plan[meal] = { ...(day.plan[meal] || {}), recipe: planRecipe };
  const t = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  Object.values(day.plan).forEach(m => {
    const n = m?.recipe?.total_nutrition ?? {};
    t.calories += n.calories ?? 0; t.protein += n.protein ?? 0; t.carbs += n.carbs ?? 0; t.fat += n.fat ?? 0;
  });
  day.totals = t;
  await AsyncStorage.setItem(WEEK_KEY, JSON.stringify(week));
  return meal;
}

// Reduce today's menu meal by `calories` (you told the chat you ate something).
async function reduceMenuMeal(mealType, calories) {
  if (!(calories > 0)) return;
  const raw = await AsyncStorage.getItem(WEEK_KEY);
  if (!raw) return;
  const week = JSON.parse(raw);
  const day = week.days?.[new Date().getDay()];
  let meal = (mealType || 'LUNCH').toUpperCase();
  if (!MEAL_KEYS.includes(meal)) meal = 'LUNCH';
  const slot = day?.plan?.[meal];
  const cal = slot?.recipe?.total_nutrition?.calories ?? 0;
  if (cal <= 0) return;
  const factor = Math.max(0.15, (cal - calories) / cal);
  const r = slot.recipe;
  const scaledN = {};
  ['calories', 'protein', 'carbs', 'fat'].forEach(k => { scaledN[k] = Math.round((r.total_nutrition?.[k] ?? 0) * factor * 10) / 10; });
  const scaledIng = (r.ingredients ?? []).map(ing => ing.quantity
    ? { ...ing, quantity: Math.round(ing.quantity * factor), display_he: undefined } : ing);
  slot.recipe = { ...r, total_nutrition: scaledN, ingredients: scaledIng, _reduced: true };
  const t = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  Object.values(day.plan).forEach(m => {
    const n = m?.recipe?.total_nutrition ?? {};
    t.calories += n.calories ?? 0; t.protein += n.protein ?? 0; t.carbs += n.carbs ?? 0; t.fat += n.fat ?? 0;
  });
  day.totals = t;
  await AsyncStorage.setItem(WEEK_KEY, JSON.stringify(week));
}

function FoodDetectedCard({ foodData }) {
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [logged, setLogged] = useState(false);
  const [logging, setLogging] = useState(true);

  const doLog = async () => {
    setLogging(true);
    try {
      const mealType = foodData.meal_type?.toUpperCase() ?? 'LUNCH';
      let totalCal = 0;
      for (const food of foodData.foods) {
        let grams = food.grams ?? 100;
        let cal = food.calories ?? 0, prot = food.protein ?? 0;
        let carbs = food.carbs ?? 0, fat = food.fat ?? 0;
        if (!cal) {
          const lookup = await searchFoodNutrition(food.name_he ?? food.name).catch(() => null);
          if (lookup?.found) {
            const factor = grams / 100;
            cal   = Math.round((lookup.calories_per_100g ?? 0) * factor);
            prot  = Math.round((lookup.protein_per_100g ?? 0) * factor * 10) / 10;
            carbs = Math.round((lookup.carbs_per_100g ?? 0) * factor * 10) / 10;
            fat   = Math.round((lookup.fat_per_100g ?? 0) * factor * 10) / 10;
          }
        }
        totalCal += cal;
        await addFoodEntry({
          food_id: food.name ?? 'chat_food',
          food_name: food.name_he ?? food.name,
          grams, calories: cal, protein: prot, carbs, fat,
          meal_type: mealType,
          image_url: food.image_url ?? null,
        });
      }
      // Also deduct from today's menu meal so the plan + home summary reflect it.
      await reduceMenuMeal(mealType, totalCal).catch(() => {});
      setLogged(true);
    } catch {
      setLogged(false);
    } finally {
      setLogging(false);
    }
  };

  // Auto-log the moment the card appears (reliable, and refreshes the home summary).
  useEffect(() => { doLog(); }, []);

  return (
    <View style={styles.foodDetected}>
      <Text style={styles.foodDetectedTitle}>נרשם שאכלת:</Text>
      {foodData.foods.map((f, i) => (
        <Text key={i} style={styles.foodItem}>• {f.name_he ?? f.name} — {f.grams ?? f.quantity}g · {Math.round(f.calories ?? 0)} קק"ל</Text>
      ))}
      {logging ? (
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginTop: 8 }}>
          <ActivityIndicator size="small" color="#3a7a4a" />
          <Text style={styles.foodItem}>רושם ליומן ולתפריט...</Text>
        </View>
      ) : logged ? (
        <Text style={styles.loggedTxt}>✓ נשמר ביומן ועודכן בתפריט</Text>
      ) : (
        <TouchableOpacity style={styles.logBtn} onPress={doLog}>
          <Text style={styles.logBtnTxt}>נסה לרשום שוב</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function RecipeCard({ recipe }) {
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [logged, setLogged] = useState(false);
  const [logging, setLogging] = useState(false);
  const [addedToMenu, setAddedToMenu] = useState(false);

  const handleAddToMenu = async () => {
    try {
      const res = await addRecipeToMenu(recipe);
      if (res === 'no_plan') {
        Alert.alert('אין תפריט פעיל', 'בנה קודם תפריט שבועי בטאב "תפריט", ואז אוכל להוסיף לשם.');
        return;
      }
      setAddedToMenu(true);
    } catch { Alert.alert('שגיאה', 'לא הצלחתי להוסיף לתפריט'); }
  };

  // Auto-add when the user explicitly asked to put it in the menu.
  useEffect(() => {
    if (recipe.to_menu) {
      addRecipeToMenu(recipe).then(res => { if (res !== 'no_plan') setAddedToMenu(true); }).catch(() => {});
    }
  }, []);

  const handleLog = async () => {
    setLogging(true);
    try {
      for (const food of recipe.foods) {
        await addFoodEntry({
          food_id: food.name ?? 'chat_recipe',
          food_name: food.name_he ?? food.name,
          grams: food.grams ?? 100,
          calories: food.calories ?? 0,
          protein: food.protein ?? 0,
          carbs: food.carbs ?? 0,
          fat: food.fat ?? 0,
          meal_type: recipe.meal_type?.toUpperCase() ?? 'LUNCH',
          image_url: food.image_url ?? null,
        });
      }
      setLogged(true);
    } catch (e) {
      Alert.alert('שגיאה', 'לא הצלחתי לשמור ביומן: ' + e.message);
    } finally {
      setLogging(false);
    }
  };

  return (
    <View style={styles.recipeCard}>
      <Text style={styles.recipeTitle}>{recipe.title}</Text>
      <Text style={styles.recipeMeta}>
        {recipe.total_calories} קק"ל · {recipe.total_protein}g חלבון
        {recipe.meal_target ? `  (יעד הארוחה: ${recipe.meal_target})` : ''}
      </Text>

      <Text style={styles.recipeSection}>מצרכים</Text>
      {recipe.foods.map((f, i) => (
        <Text key={i} style={styles.recipeIng}>
          • {f.name_he ?? f.name} — {f.grams}g · {Math.round(f.calories ?? 0)} קק"ל
        </Text>
      ))}

      {recipe.instructions?.length > 0 && (
        <>
          <Text style={styles.recipeSection}>אופן ההכנה</Text>
          {recipe.instructions.map((s, i) => (
            <Text key={i} style={styles.recipeStep}>{i + 1}. {s}</Text>
          ))}
        </>
      )}

      <View style={{ flexDirection: 'row-reverse', gap: 8, marginTop: 12 }}>
        {addedToMenu ? (
          <Text style={[styles.loggedTxt, { flex: 1, marginTop: 0 }]}>✓ נוסף לתפריט</Text>
        ) : (
          <TouchableOpacity style={[styles.menuBtn, { flex: 1 }]} onPress={handleAddToMenu}>
            <Text style={styles.menuBtnTxt}>הוסף לתפריט</Text>
          </TouchableOpacity>
        )}
        {!logged ? (
          <TouchableOpacity style={[styles.logBtn, { flex: 1, marginTop: 0 }]} onPress={handleLog} disabled={logging}>
            {logging
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.logBtnTxt}>הוסף ליומן</Text>}
          </TouchableOpacity>
        ) : (
          <Text style={[styles.loggedTxt, { flex: 1, marginTop: 0 }]}>✓ נשמר ביומן</Text>
        )}
      </View>
    </View>
  );
}

const SUGGESTIONS = [
  'כמה קלוריות יש בשוואורמה?',
  'מה כדאי לאכול לפני אימון?',
  'תן לי ארוחת בוקר בריאה',
  'כמה חלבון אני צריך ביום?',
];

export default function ChatScreen({ navigation }) {
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const panHandlers = useSwipeNav(navigation, 'צ׳אט');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const listRef = useRef(null);
  const loadedRef = useRef(false);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const startRec = async () => {
    try {
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) { Alert.alert('מיקרופון', 'צריך הרשאת מיקרופון כדי לדבר עם Biti'); return; }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecording(true);
    } catch { Alert.alert('שגיאה', 'לא ניתן להקליט'); }
  };

  const stopRec = async () => {
    setRecording(false);
    setTranscribing(true);
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (uri) {
        const res = await transcribeAudio(uri);
        const text = (res?.text || '').trim();
        if (text) send(text);
        else Alert.alert('לא זוהה דיבור', 'נסה שוב');
      }
    } catch { Alert.alert('שגיאה', 'התמלול נכשל'); }
    finally { setTranscribing(false); }
  };

  // Continuity: load the saved conversation on mount so Biti remembers it.
  useEffect(() => {
    AsyncStorage.getItem(CHAT_KEY)
      .then(v => { if (v) setMessages(JSON.parse(v)); })
      .catch(() => {})
      .finally(() => { loadedRef.current = true; });
  }, []);

  // Persist the conversation (text only — strip live cards so they don't
  // re-trigger logging when reloaded). Keep the last 60 messages.
  useEffect(() => {
    if (!loadedRef.current) return;
    const slim = messages.slice(-60).map(m => ({ id: m.id, role: m.role, text: m.text }));
    AsyncStorage.setItem(CHAT_KEY, JSON.stringify(slim)).catch(() => {});
  }, [messages]);

  const getHistory = (msgs) =>
    msgs.slice(-16).map(m => ({ role: m.role, content: m.text }));

  const send = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput('');
    const userMsg = { id: Date.now().toString(), role: 'user', text: msg };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);
    try {
      const res = await chatMessage(msg, getHistory(updated));
      const reply = res?.reply ?? 'לא הצלחתי לענות';
      setMessages(prev => [...prev, {
        id: Date.now().toString() + 'a',
        role: 'assistant',
        text: reply,
        foodData: res?.food_data ?? null,
        recipe: res?.recipe ?? null,
      }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        id: Date.now().toString() + 'e',
        role: 'assistant',
        text: 'שגיאה בחיבור לשרת. בדוק שה-API רץ.',
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <View style={{ flex: 1 }} {...panHandlers}>
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <View style={styles.header}>
        <Text style={styles.title}>צ'אט תזונאי</Text>
        <View style={styles.onlineDot} />
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={m => m.id}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => (
          <View style={[styles.bubbleWrap, item.role === 'user' ? styles.userWrap : styles.aiWrap]}>
            <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.aiBubble]}>
              {/* When a recipe card is attached, hide the verbose calorie prose —
                  the card already shows everything. */}
              {!(item.recipe?.foods?.length > 0) && !!item.text && (
                <Text style={styles.bubbleText}>{item.text}</Text>
              )}
              {item.foodData?.foods?.length > 0 && (
                <FoodDetectedCard foodData={item.foodData} />
              )}
              {item.recipe?.foods?.length > 0 && (
                <RecipeCard recipe={item.recipe} />
              )}
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />

      {/* Suggestions */}
      {messages.length <= 1 && (
        <View style={styles.suggestions}>
          {SUGGESTIONS.map(s => (
            <TouchableOpacity key={s} style={styles.suggestionChip} onPress={() => send(s)}>
              <Text style={styles.suggestionTxt}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {loading && (
        <View style={styles.typingRow}>
          <ActivityIndicator size="small" color="#3a7a4a" />
          <Text style={styles.typingTxt}>מקליד...</Text>
        </View>
      )}

      <View style={styles.inputRow}>
        {input.trim() ? (
          <TouchableOpacity style={styles.sendBtn} onPress={() => send()} disabled={loading}>
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.sendBtn, recording && styles.micRecording]}
            onPress={recording ? stopRec : startRec}
            disabled={transcribing}>
            {transcribing
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name={recording ? 'stop' : 'mic'} size={20} color="#fff" />}
          </TouchableOpacity>
        )}
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder={recording ? 'מקליט... הקש לעצירה' : (transcribing ? 'מתמלל...' : 'שאל או דבר עם Biti...')}
          placeholderTextColor={recording ? '#ef7d6c' : C.textFaint}
          onSubmitEditing={() => send()}
          returnKeyType="send"
          multiline
          editable={!recording && !transcribing}
        />
      </View>
    </KeyboardAvoidingView>
    </View>
  );
}

const makeStyles = (C) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12, gap: 8 },
  title: { color: C.text, fontSize: 20, fontWeight: '800' },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#56bd6b' },
  listContent: { padding: 12, paddingBottom: 8 },
  bubbleWrap: { flexDirection: 'row', marginVertical: 4, alignItems: 'flex-end' },
  userWrap: { justifyContent: 'flex-end' },
  aiWrap: { justifyContent: 'flex-start' },
  avatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.surface2, justifyContent: 'center', alignItems: 'center', marginRight: 6 },
  avatarTxt: { fontSize: 16 },
  bubble: { maxWidth: '78%', borderRadius: 16, padding: 12 },
  userBubble: { backgroundColor: '#3a7a4a', borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: C.surface2, borderBottomLeftRadius: 4 },
  bubbleText: { color: C.text, fontSize: 15, lineHeight: 22, textAlign: 'right' },
  foodDetected: { marginTop: 8, padding: 8, backgroundColor: '#0a2a1a', borderRadius: 8 },
  foodDetectedTitle: { color: '#56bd6b', fontSize: 12, fontWeight: '700', marginBottom: 4 },
  foodItem: { color: '#aaa', fontSize: 12 },
  suggestions: { paddingHorizontal: 12, paddingBottom: 4, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  suggestionChip: { backgroundColor: C.surface, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: C.border },
  suggestionTxt: { color: C.textMuted, fontSize: 13 },
  typingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 6, gap: 6 },
  typingTxt: { color: C.placeholder, fontSize: 13 },
  inputRow: { flexDirection: 'row', padding: 12, gap: 8, alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: C.surface },
  input: { flex: 1, backgroundColor: C.surface, color: C.text, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, maxHeight: 100, textAlign: 'right' },
  sendBtn: { backgroundColor: '#3a7a4a', borderRadius: 12, width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  micRecording: { backgroundColor: '#ef4444' },
  logBtn: { backgroundColor: '#3a7a4a', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9, marginTop: 8, alignItems: 'center' },
  logBtnTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },
  loggedTxt: { color: '#56bd6b', fontSize: 13, fontWeight: '700', marginTop: 8, textAlign: 'center' },
  menuBtn: { backgroundColor: '#2e6b3e', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9, alignItems: 'center' },
  menuBtnTxt: { color: '#fff', fontSize: 13, fontWeight: '800' },
  recipeCard: { marginTop: 8, padding: 12, backgroundColor: '#0a2a1a', borderRadius: 10, borderWidth: 1, borderColor: '#1d4a32' },
  recipeTitle: { color: '#eaeaea', fontSize: 15, fontWeight: '800', textAlign: 'right' },
  recipeMeta: { color: '#56bd6b', fontSize: 12, fontWeight: '700', textAlign: 'right', marginTop: 2 },
  recipeSection: { color: '#8fd6a0', fontSize: 12, fontWeight: '700', textAlign: 'right', marginTop: 10, marginBottom: 4 },
  recipeIng: { color: '#cfcfcf', fontSize: 13, textAlign: 'right', lineHeight: 20 },
  recipeStep: { color: '#cfcfcf', fontSize: 13, textAlign: 'right', lineHeight: 20 },
});
