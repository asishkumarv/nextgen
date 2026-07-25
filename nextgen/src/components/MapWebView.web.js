// Web fallback – react-native-webview has no web support.
// Returns a simple null component so web bundles don't crash.
import React from 'react';
import { View, Text } from 'react-native';

const MapWebViewFallback = () => (
  <View style={{ height: 240, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1E1A2E', borderRadius: 12, borderWidth: 1, borderColor: '#312C51' }}>
    <Text style={{ color: '#6B7280', fontSize: 13 }}>🗺 Map not available on web preview</Text>
    <Text style={{ color: '#6B7280', fontSize: 11, marginTop: 4 }}>Use the Expo Go app on your device</Text>
  </View>
);

export default MapWebViewFallback;
