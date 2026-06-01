import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Header from '../components/Header';
import { services } from '../data/services';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, bookedSlot, bookingDetails, setActiveBookingService, refreshData } = useApp();

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (refreshData) {
      await refreshData();
    }
    setRefreshing(false);
  };

  const handleBookService = (service) => {
    setActiveBookingService(service);
    navigation.navigate('Services');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#00C853']} />
        }
      >
        <Header />

        {/* Welcome Section */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.greeting}>Hello, {user?.name ? user.name.trim().split(' ')[0] : 'User'} 👋</Text>
          <Text style={styles.welcomeSub}>Manage your electrical support subscription</Text>
        </View>

        {/* Subscription Status Card */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('Slots')}
          style={styles.cardContainer}
        >
          <LinearGradient
            colors={
              bookingDetails?.status === 'Pending' ? ['#F59E0B', '#D97706'] :
              bookingDetails?.status === 'Rejected' ? ['#DC2626', '#991B1B'] :
              bookedSlot ? ['#00C853', '#0091EA'] : ['#F59E0B', '#EF4444']
            }
            style={styles.banner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.bannerHeader}>
              <View style={styles.subActiveBadge}>
                <Ionicons name={
                  bookingDetails?.status === 'Pending' ? 'time' :
                  bookingDetails?.status === 'Rejected' ? 'close-circle' :
                  bookedSlot ? 'sparkles' : 'alert-circle'
                } size={12} color="#FFF" style={{ marginRight: 4 }} />
                <Text style={styles.subActiveText}>
                  {
                    bookingDetails?.status === 'Pending' ? 'Subscription Pending' :
                    bookingDetails?.status === 'Rejected' ? 'Subscription Rejected' :
                    bookedSlot ? 'Subscription Active' : 'No Active Slot'
                  }
                </Text>
              </View>
              <Text style={styles.priceTag}>₹2999/year</Text>
            </View>

            <Text style={styles.offer}>Power Care Annual</Text>
            
            <View style={styles.slotLabelContainer}>
              <Ionicons name="calendar-outline" size={14} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.slotLabel}>
                {
                  bookingDetails?.status === 'Pending' ? `Requested Slot #${bookedSlot}` :
                  bookingDetails?.status === 'Rejected' ? 'Your request was rejected' :
                  bookedSlot ? `Reserved Slot #${bookedSlot}` : 'Tap to select subscription slot'
                }
              </Text>
            </View>

            <View style={styles.whiteButton}>
              <Text style={styles.whiteButtonText}>
                {
                  bookingDetails?.status === 'Pending' ? 'View Status' :
                  bookingDetails?.status === 'Rejected' ? 'Try Again' :
                  bookedSlot ? 'View Slot Details' : 'Pick Subscription Slot'
                }
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#111827" style={{ marginLeft: 6 }} />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Quick Action Shortcuts */}
        <Text style={styles.heading}>Quick Actions</Text>
        <View style={styles.shortcutsRow}>
          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={() => navigation.navigate('Services')}
            activeOpacity={0.7}
          >
            <View style={[styles.shortcutIconBg, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="construct-outline" size={24} color="#00C853" />
            </View>
            <Text style={styles.shortcutText}>Book Service</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={() => navigation.navigate('Slots')}
            activeOpacity={0.7}
          >
            <View style={[styles.shortcutIconBg, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="calendar-outline" size={24} color="#0091EA" />
            </View>
            <Text style={styles.shortcutText}>Select Slot</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.7}
          >
            <View style={[styles.shortcutIconBg, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="time-outline" size={24} color="#FF9800" />
            </View>
            <Text style={styles.shortcutText}>My History</Text>
          </TouchableOpacity>
        </View>

        {/* Popular Services Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.heading}>Popular Services</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Services')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {/* Custom Service Cards List */}
        {services.slice(0, 3).map((item) => (
          <View style={styles.serviceCard} key={item.id}>
            <View style={styles.serviceLeft}>
              <View style={styles.serviceIconBg}>
                <Ionicons
                  name={item.icon || 'construct-outline'}
                  size={20}
                  color="#15803D"
                />
              </View>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceTitle}>{item.title}</Text>
                <Text style={styles.serviceSubtitle}>{item.subtitle}</Text>
                <Text style={styles.servicePrice}>₹{item.price}</Text>
              </View>
            </View>
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => handleBookService(item)}
            >
              <LinearGradient
                colors={['#00C853', '#0091EA']}
                style={styles.bookButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.bookButtonText}>Book</Text>
                <Ionicons name="arrow-forward" size={12} color="#FFF" style={{ marginLeft: 4 }} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  welcomeContainer: {
    marginTop: 10,
    marginBottom: 16,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  welcomeSub: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '500',
  },
  cardContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 24,
  },
  banner: {
    borderRadius: 24,
    padding: 22,
  },
  bannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
  },
  subActiveText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  priceTag: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  offer: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '800',
  },
  slotLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  slotLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '600',
  },
  whiteButton: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  whiteButtonText: {
    fontWeight: '700',
    color: '#111827',
    fontSize: 14,
  },
  heading: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
    color: '#111827',
  },
  shortcutsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  shortcutCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  shortcutIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  shortcutText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  seeAll: {
    color: '#0984E3',
    fontWeight: '700',
    fontSize: 14,
  },
  serviceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  serviceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceInfo: {
    marginLeft: 12,
    flex: 1,
  },
  serviceTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  serviceSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#15803D',
    marginTop: 4,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
  },
  bookButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
});