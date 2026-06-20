import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Image,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function SignupScreen({ navigation }) {
  const { signup } = useAuth();
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('שגיאה', 'יש למלא את כל השדות');
      return;
    }
    if (password.length < 6) {
      Alert.alert('סיסמה חלשה', 'הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }
    if (password !== confirm) {
      Alert.alert('שגיאה', 'הסיסמאות אינן תואמות');
      return;
    }
    setLoading(true);
    try {
      await signup(email.trim().toLowerCase(), password, name.trim());
      // App.js will render Onboarding automatically after token is set
    } catch (e) {
      // הצג את השגיאה האמיתית לצורך אבחון
      let msg;
      if (e?.response?.data?.detail) {
        msg = e.response.data.detail;          // שגיאת server (HTTP 4xx/5xx)
      } else if (e?.response) {
        msg = `Server ${e.response.status}: ${JSON.stringify(e.response.data)}`;
      } else if (e?.request) {
        msg = `אין תגובה מהשרת\nURL: ${e?.config?.baseURL || '?'}\n${e.message}`;
      } else {
        msg = e?.message || 'שגיאה לא ידועה';
      }
      Alert.alert('הרשמה נכשלה', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        <View style={s.hero}>
          <Image source={require('../../../assets/nutrismart-logo.png')}
            style={s.logoImg} resizeMode="contain" />
          <Text style={s.appName}>NutriSmart</Text>
          <Text style={s.tagline}>בוא נתחיל את המסע שלך</Text>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>יצירת חשבון</Text>

          <Text style={s.label}>שם מלא</Text>
          <TextInput
            style={s.input}
            value={name}
            onChangeText={setName}
            placeholder="ישראל ישראלי"
            placeholderTextColor="#666"
            autoCapitalize="words"
          />

          <Text style={s.label}>אימייל</Text>
          <TextInput
            style={s.input}
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            placeholderTextColor="#666"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={s.label}>סיסמה</Text>
          <TextInput
            style={s.input}
            value={password}
            onChangeText={setPassword}
            placeholder="לפחות 6 תווים"
            placeholderTextColor="#666"
            secureTextEntry
          />

          <Text style={s.label}>אימות סיסמה</Text>
          <TextInput
            style={s.input}
            value={confirm}
            onChangeText={setConfirm}
            placeholder="חזור על הסיסמה"
            placeholderTextColor="#666"
            secureTextEntry
          />

          <TouchableOpacity
            style={[s.btn, loading && s.btnDisabled]}
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color="#000" />
              : <Text style={s.btnText}>הרשמה</Text>
            }
          </TouchableOpacity>
        </View>

        <View style={s.switchRow}>
          <Text style={s.switchText}>יש לך כבר חשבון? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={s.switchLink}>כניסה</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: '#0c1622' },
  scroll:     { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },

  hero:       { alignItems: 'center', marginBottom: 36 },
  logoImg:    { width: 100, height: 100, borderRadius: 22, marginBottom: 4 },
  logo:       { fontSize: 64 },
  appName:    { fontSize: 34, fontWeight: '800', color: '#fff', marginTop: 8 },
  tagline:    { fontSize: 15, color: '#888', marginTop: 4 },

  card:       { backgroundColor: '#1b2c3d', borderRadius: 20, padding: 24, marginBottom: 24 },
  cardTitle:  { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 20, textAlign: 'right' },

  label:      { fontSize: 13, color: '#aaa', marginBottom: 6, textAlign: 'right' },
  input:      {
    backgroundColor: '#2e455c', borderRadius: 12, paddingHorizontal: 16,
    paddingVertical: 14, color: '#fff', fontSize: 15, marginBottom: 16,
    textAlign: 'right',
  },

  btn:        {
    backgroundColor: '#56bd6b', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText:    { color: '#000', fontSize: 16, fontWeight: '700' },

  switchRow:  { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  switchText: { color: '#888', fontSize: 14 },
  switchLink: { color: '#56bd6b', fontSize: 14, fontWeight: '600' },
});
