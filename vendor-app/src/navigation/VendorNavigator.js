import React, { useState } from 'react';
import { View, Platform, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import DashboardScreen from '../screens/DashboardScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import { useVendor } from '../context/VendorContext';

const Tab = createBottomTabNavigator();

export default function VendorNavigator() {
  const insets = useSafeAreaInsets();
  const { token, isLoading } = useVendor();
  const [authScreen, setAuthScreen] = useState('login');

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00B894" />
      </View>
    );
  }

  if (!token) {
    if (authScreen === 'login') {
      return <LoginScreen onNavigateToRegister={() => setAuthScreen('register')} />;
    } else {
      return <RegisterScreen onNavigateToLogin={() => setAuthScreen('login')} />;
    }
  }

  return (
    <NavigationIndependentTree>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: '#00B894',
            tabBarInactiveTintColor: '#6B7280',
            tabBarStyle: {
              height: Platform.OS === 'ios' ? (60 + Math.max(insets.bottom, 24)) : (60 + Math.max(insets.bottom, 16)),
              backgroundColor: '#FFFFFF',
              borderTopWidth: 1,
              borderTopColor: '#F3F4F6',
              paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 24) : Math.max(insets.bottom, 16),
              paddingTop: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.05,
              shadowRadius: 10,
              elevation: 10,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '600',
              marginTop: 4,
            },
            tabBarIcon: ({ focused, color }) => {
              let iconName;
              if (route.name === 'Dashboard') {
                iconName = focused ? 'clipboard' : 'clipboard-outline';
              } else if (route.name === 'Profile') {
                iconName = focused ? 'person' : 'person-outline';
              }
              return <Ionicons name={iconName} size={24} color={color} />;
            },
          })}
        >
          <Tab.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={{ title: 'Tasks' }}
          />
          <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ title: 'Profile' }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </NavigationIndependentTree>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FB',
  },
});
