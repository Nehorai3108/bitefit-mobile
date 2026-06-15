import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { chatMessage, addFoodEntry, searchFoodNutrition } from '../api/client';

function FoodDetectedCard({ foodData }) {
  const [logged, setLogged] = useState(false);
  const [logging, setLogging] = useState(false);

  const handleLog = async () => {
    setLogging(true);
    try {
      for (const food of foodData.foods) {
        // The server already resolved grams + total calories/macros for the
        // portion (with an AI fallback), so log them directly.
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
        await addFoodEntry({
          food_id: food.name ?? 'chat_food',
          food_name: food.name_he ?? food.name,
          grams, calories: cal, protein: prot, carbs, fat,
          meal_type: foodData.meal_type?.toUpperCase() ?? 'LUNCH',
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
    <View style={styles.foodDetected}>
      <Text style={styles.foodDetectedTitle}>זוהה אוכל:</Text>
      {foodData.foods.map((f, i) => (
        <Text key={i} style={styles.foodItem}>• {f.name_he ?? f.name} — {f.grams ?? f.quantity}g · {Math.round(f.calories ?? 0)} קק"ל</Text>
      ))}
      {!logged ? (
        <TouchableOpacity style={styles.logBtn} onPress={handleLog} disabled={logging}>
          {logging
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.logBtnTxt}>הוסף ליומן</Text>}
        </TouchableOpacity>
      ) : (
        <Text style={styles.loggedTxt}>✓ נשמר ביומן</Text>
      )}
    </View>
  );
}

const SUGGESTIONS = [
  'כמה קלוריות יש בשוואורמה?',
  'מה כדאי לאכול לפני אימון?',
  'תן לי ארוחת בוקר בריאה',
  'כמה חלבון אני צריך ביום?',
];

export default function ChatScreen() {
  const [messages, setMessages] = useState([
    { id: '0', role: 'assistant', text: 'שלום! אני התזונאי ה-AI שלך 🥗\nאשאל, אייעץ ואעזור לך לאכול טוב יותר. איך אוכל לעזור?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);

  const getHistory = (msgs) =>
    msgs.slice(1).map(m => ({ role: m.role, content: m.text }));

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
            {item.role === 'assistant' && (
              <View style={styles.avatar}>
                <Text style={styles.avatarTxt}>🥗</Text>
              </View>
            )}
            <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.aiBubble]}>
              <Text style={styles.bubbleText}>{item.text}</Text>
              {item.foodData?.foods?.length > 0 && (
                <FoodDetectedCard foodData={item.foodData} />
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
          <ActivityIndicator size="small" color="#4F8EF7" />
          <Text style={styles.typingTxt}>מקליד...</Text>
        </View>
      )}

      <View style={styles.inputRow}>
        <TouchableOpacity style={styles.sendBtn} onPress={() => send()} disabled={!input.trim() || loading}>
          <Ionicons name="send" size={20} color={input.trim() ? '#fff' : '#333'} />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="שאל משהו על תזונה..."
          placeholderTextColor="#444"
          onSubmitEditing={() => send()}
          returnKeyType="send"
          multiline
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12, gap: 8 },
  title: { color: '#fff', fontSize: 20, fontWeight: '800' },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50' },
  listContent: { padding: 12, paddingBottom: 8 },
  bubbleWrap: { flexDirection: 'row', marginVertical: 4, alignItems: 'flex-end' },
  userWrap: { justifyContent: 'flex-end' },
  aiWrap: { justifyContent: 'flex-start' },
  avatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center', marginRight: 6 },
  avatarTxt: { fontSize: 16 },
  bubble: { maxWidth: '78%', borderRadius: 16, padding: 12 },
  userBubble: { backgroundColor: '#4F8EF7', borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: '#1a1a1a', borderBottomLeftRadius: 4 },
  bubbleText: { color: '#fff', fontSize: 15, lineHeight: 22, textAlign: 'right' },
  foodDetected: { marginTop: 8, padding: 8, backgroundColor: '#0a2a1a', borderRadius: 8 },
  foodDetectedTitle: { color: '#4CAF50', fontSize: 12, fontWeight: '700', marginBottom: 4 },
  foodItem: { color: '#aaa', fontSize: 12 },
  suggestions: { paddingHorizontal: 12, paddingBottom: 4, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  suggestionChip: { backgroundColor: '#141414', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: '#2a2a2a' },
  suggestionTxt: { color: '#888', fontSize: 13 },
  typingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 6, gap: 6 },
  typingTxt: { color: '#555', fontSize: 13 },
  inputRow: { flexDirection: 'row', padding: 12, gap: 8, alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: '#141414' },
  input: { flex: 1, backgroundColor: '#141414', color: '#fff', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, maxHeight: 100, textAlign: 'right' },
  sendBtn: { backgroundColor: '#4F8EF7', borderRadius: 12, width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  logBtn: { backgroundColor: '#4F8EF7', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7, marginTop: 8, alignSelf: 'flex-start' },
  logBtnTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },
  loggedTxt: { color: '#4CAF50', fontSize: 13, fontWeight: '700', marginTop: 8 },
});
