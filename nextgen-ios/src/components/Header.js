import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';

export default function Header() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { unreadNotificationCount } = useApp();
  
  return (
    <BlurView intensity={80} tint="light" style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.leftSection}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
        />
        <View style={styles.textContainer}>
          <Text style={styles.title}>NEXT GEN</Text>
          <Text style={styles.subTitle}>Power Care</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity 
          style={styles.bellButton} 
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Referrals')}
        >
          <Ionicons name="wallet-outline" size={22} color="#111827" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.bellButton} 
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Ionicons name="notifications-outline" size={22} color="#111827" />
          {unreadNotificationCount > 0 && <View style={styles.redBadge} />}
        </TouchableOpacity>
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 44,
    height: 44,
    marginRight: 10,
    resizeMode: 'contain',
  },
  textContainer: {
    justifyContent: 'center',
  },
  title: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1.5,
  },
  subTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: -2,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  redBadge: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#E8F1FC',
  },
});