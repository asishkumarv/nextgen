import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';

export default function Header() {
  const navigation = useNavigation();
  const { unreadNotificationCount } = useApp();
  return (
    <View style={styles.container}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    backgroundColor: '#F5F7FB',
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
    fontSize: 12,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 1,
  },
  subTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginTop: -2,
  },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F1FC',
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