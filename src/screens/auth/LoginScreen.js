import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  ScrollView, Image,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('שגיאה', 'יש למלא אימייל וסיסמה');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      // Navigation handled by App.js based on auth state
    } catch (e) {
      const msg = e?.response?.data?.detail || 'אימייל או סיסמה שגויים';
      Alert.alert('כניסה נכשלה', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* Logo / Brand */}
        <View style={s.hero}>
          <Text style={s.appName}>BiteFit</Text>
          <Text style={s.tagline}>תזונה חכמה, חיים בריאים</Text>
        </View>

        {/* Form */}
        <View style={s.card}>
          <Text style={s.cardTitle}>כניסה לחשבון</Text>

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
            placeholder="••••••••"
            placeholderTextColor="#666"
            secureTextEntry
          />

          <TouchableOpacity
            style={[s.btn, loading && s.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color="#000" />
              : <Text style={s.btnText}>כניסה</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Switch to signup */}
        <View style={s.switchRow}>
          <Text style={s.switchText}>אין לך חשבון? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={s.switchLink}>הרשמה</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: '#0f0f0f' },
  scroll:     { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },

  hero:       { alignItems: 'center', marginBottom: 36 },
  logo:       { fontSize: 64 },
  appName:    { fontSize: 34, fontWeight: '800', color: '#fff', marginTop: 8 },
  tagline:    { fontSize: 15, color: '#888', marginTop: 4 },

  card:       { backgroundColor: '#1a1a1a', borderRadius: 20, padding: 24, marginBottom: 24 },
  cardTitle:  { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 20, textAlign: 'right' },

  label:      { fontSize: 13, color: '#aaa', marginBottom: 6, textAlign: 'right' },
  input:      {
    backgroundColor: '#2a2a2a', borderRadius: 12, paddingHorizontal: 16,
    paddingVertical: 14, color: '#fff', fontSize: 15, marginBottom: 16,
    textAlign: 'right',
  },

  btn:        {
    backgroundColor: '#A8E063', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText:    { color: '#000', fontSize: 16, fontWeight: '700' },

  switchRow:  { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  switchText: { color: '#888', fontSize: 14 },
  switchLink: { color: '#A8E063', fontSize: 14, fontWeight: '600' },
});
