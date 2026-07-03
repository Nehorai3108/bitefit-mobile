import { registerRootComponent } from 'expo';
import React from 'react';
import { ScrollView, Text } from 'react-native';

// Catch errors that happen while the App module graph is being LOADED (import
// time) — the in-app ErrorBoundary can't catch those because it hasn't mounted
// yet. If loading App throws, show the error on screen instead of a white screen.
function makeErrorApp(err) {
  return function LoadError() {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ padding: 24, paddingTop: 80 }}>
        <Text style={{ color: '#c00', fontSize: 18, fontWeight: '700', marginBottom: 12 }}>Load error (debug)</Text>
        <Text selectable style={{ color: '#000', fontSize: 14, marginBottom: 12 }}>
          {String(err && (err.message || err))}
        </Text>
        <Text selectable style={{ color: '#444', fontSize: 11 }}>
          {String((err && err.stack) || '')}
        </Text>
      </ScrollView>
    );
  };
}

let App;
try {
  App = require('./App').default;
} catch (e) {
  App = makeErrorApp(e);
}

registerRootComponent(App);
