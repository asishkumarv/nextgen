import 'react-native-gesture-handler';

import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { VendorProvider } from './src/context/VendorContext';
import VendorNavigator from './src/navigation/VendorNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#312C51"
      />
      <VendorProvider>
        <VendorNavigator />
      </VendorProvider>
    </SafeAreaProvider>
  );
}
