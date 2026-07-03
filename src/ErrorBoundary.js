import React from 'react';
import { ScrollView, Text, View } from 'react-native';

// Surfaces launch/render errors on screen instead of a white screen or crash,
// so we can see the real cause in a production (TestFlight) build.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
    // Catch uncaught (non-render) JS errors too.
    if (global.ErrorUtils && global.ErrorUtils.setGlobalHandler) {
      const prev = global.ErrorUtils.getGlobalHandler && global.ErrorUtils.getGlobalHandler();
      global.ErrorUtils.setGlobalHandler((e, isFatal) => {
        try { this.setState({ error: e }); } catch (_) {}
        if (prev) try { prev(e, isFatal); } catch (_) {}
      });
    }
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.setState({ error, info });
  }

  render() {
    const { error, info } = this.state;
    if (error) {
      return (
        <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ padding: 24, paddingTop: 80 }}>
          <Text style={{ color: '#c00', fontSize: 18, fontWeight: '700', marginBottom: 12 }}>
            App error (debug)
          </Text>
          <Text selectable style={{ color: '#000', fontSize: 14, marginBottom: 12 }}>
            {String(error && (error.message || error))}
          </Text>
          <Text selectable style={{ color: '#444', fontSize: 11 }}>
            {String((error && error.stack) || (info && info.componentStack) || '')}
          </Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}
