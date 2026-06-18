import React, { useState } from 'react';
import { View, Text, Platform, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Ionicons from '@expo/vector-icons/Ionicons';

import HomeScreen from '../screens/HomeScreen';
import SlotsScreen from '../screens/SlotsScreen';
import ServicesScreen from '../screens/ServicesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ReferralScreen from '../screens/ReferralScreen';
import NotificationScreen from '../screens/NotificationScreen';
import { useApp } from '../context/AppContext';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  const insets = useSafeAreaInsets();
  const { token, isLoading } = useApp();
  const [currentAuthScreen, setCurrentAuthScreen] = useState('login');

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00B894" />
      </View>
    );
  }

  if (!token) {
    if (currentAuthScreen === 'login') {
      return <LoginScreen onNavigateToRegister={() => setCurrentAuthScreen('register')} />;
    } else {
      return <RegisterScreen onNavigateToLogin={() => setCurrentAuthScreen('login')} />;
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
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;

              if (route.name === 'Home') {
                iconName = focused ? 'home' : 'home-outline';
              } else if (route.name === 'Slots') {
                iconName = focused ? 'calendar' : 'calendar-outline';
              } else if (route.name === 'Services') {
                iconName = focused ? 'construct' : 'construct-outline';
              } else if (route.name === 'Profile') {
                iconName = focused ? 'person' : 'person-outline';
              }

              return <Ionicons name={iconName} size={24} color={color} />;
            },
          })}
        >
          <Tab.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: 'Home' }}
          />

          <Tab.Screen
            name="Slots"
            component={SlotsScreen}
            options={{ title: 'Slots' }}
          />

          <Tab.Screen
            name="Services"
            component={ServicesScreen}
            options={{ title: 'Services' }}
          />

          <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ title: 'Profile' }}
          />

          <Tab.Screen
            name="Referrals"
            component={ReferralScreen}
            options={{ 
              title: 'Wallet', 
              tabBarItemStyle: { display: 'none' }
            }}
          />

          <Tab.Screen
            name="Notifications"
            component={NotificationScreen}
            options={{ 
              title: 'Notifications', 
              tabBarItemStyle: { display: 'none' }
            }}
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
