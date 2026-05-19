import React from 'react';
import { View, Text, Platform } from 'react-native';
import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import Ionicons from '@expo/vector-icons/Ionicons';

import HomeScreen from '../screens/HomeScreen';
import SlotsScreen from '../screens/SlotsScreen';
import ServicesScreen from '../screens/ServicesScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <NavigationIndependentTree>
      <NavigationContainer>
        <Tab.Navigator

        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: '#00B894',
          tabBarInactiveTintColor: '#6B7280',
          tabBarStyle: {
            height: Platform.OS === 'ios' ? 88 : 68,
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#F3F4F6',
            paddingBottom: Platform.OS === 'ios' ? 28 : 12,
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
      </Tab.Navigator>
    </NavigationContainer>
    </NavigationIndependentTree>
  );
}