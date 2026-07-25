import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Header from '../components/Header';
import { services } from '../data/services';
import { useApp } from '../context/AppContext';
import { getServiceIllustration } from '../utils/illustrations';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, bookedSlot, subscriptions, setActiveBookingService, refreshData } = useApp();
  const activeSub = subscriptions?.find(s => s.status !== 'Rejected') || subscriptions?.[0];

  const isServiceIncluded = (serviceTitle) => {
    if (!serviceTitle || !subscriptions || subscriptions.length === 0) return false;
    const activeSubs = subscriptions.filter(s => s.status === 'Active');
    for (const sub of activeSubs) {
      let included = sub.includedServices;
      if (typeof included === 'string') {
        try { included = JSON.parse(included); } catch(e) { included = []; }
      }
      if (!Array.isArray(included)) included = [];
      if (included.some(s => s?.toLowerCase() === serviceTitle.toLowerCase())) {
        return true;
      }
    }
    return false;
  };

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (refreshData) {
      await refreshData();
    }
    setRefreshing(false);
  };

  const handleBookService = (service) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveBookingService(service);
    navigation.navigate('Services');
  };

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={{ paddingBottom: 110, paddingTop: insets.top + 70 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#F0C38E" />
        }
      >
        {/* Welcome Section */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.greeting}>Hello, {user?.name ? user.name.trim().split(' ')[0] : 'User'} 👋</Text>
          <Text style={styles.welcomeSub}>Manage your electrical support subscription</Text>
        </View>

        {/* Subscriptions List */}
        {subscriptions && subscriptions.filter(s => s.status !== 'Rejected').length > 0 ? (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              Haptics.selectionAsync();
              navigation.navigate('Slots');
            }}
            style={styles.cardContainer}
          >
            <View
              style={[styles.banner, { backgroundColor: '#F0C38E' }]}
            >
              <View style={styles.bannerHeader}>
                <View style={styles.subActiveBadge}>
                  <Ionicons name="sparkles" size={12} color="#312C51" style={{ marginRight: 4 }} />
                  <Text style={[styles.subActiveText, { color: '#312C51' }]}>Subscriptions Active</Text>
                </View>
              </View>

              {(() => {
                const activeSubs = subscriptions.filter(s => s.status !== 'Rejected');
                const sub = activeSubs[activeSubs.length - 1];
                return (
                  <View style={{ marginBottom: 16 }}>
                    <Text style={[styles.offer, { color: '#312C51' }]}>
                      {sub.plan || 'Annual Plan'}
                    </Text>
                    
                    <View style={[styles.slotLabelContainer, { marginBottom: 0, marginTop: 8 }]}>
                      <Ionicons name="calendar-outline" size={14} color={sub.status === 'Pending' ? '#B45309' : '#312C51'} style={{ marginRight: 6 }} />
                      <Text style={[styles.slotLabel, { color: '#312C51' }, sub.status === 'Pending' ? { color: '#B45309', fontWeight: '800' } : {}]}>
                        {sub.status === 'Pending' ? `Requested Slot #${sub.slotNumber} (Pending)` : `Reserved Slot #${sub.slotNumber}`}
                      </Text>
                    </View>
                    <View style={[styles.slotLabelContainer, { marginBottom: 0, marginTop: 4 }]}>
                      <Ionicons name="barcode-outline" size={14} color="#312C51" style={{ marginRight: 6 }} />
                      <Text style={[styles.slotLabel, { color: '#312C51' }]}>
                        ID: {sub.id}
                      </Text>
                    </View>
                  </View>
                );
              })()}

              <View style={[styles.whiteButton, { marginTop: 8 }]}>
                <Text style={styles.whiteButtonText}>View Details & Add More</Text>
                <Ionicons name="arrow-forward" size={16} color="#111827" style={{ marginLeft: 6 }} />
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              Haptics.selectionAsync();
              navigation.navigate('Slots');
            }}
            style={styles.cardContainer}
          >
            <View
              style={[styles.banner, { backgroundColor: '#F0C38E' }]}
            >
              <View style={styles.bannerHeader}>
                <View style={styles.subActiveBadge}>
                  <Ionicons name="alert-circle" size={12} color="#FFF" style={{ marginRight: 4 }} />
                  <Text style={styles.subActiveText}>No Active Slot</Text>
                </View>
                <Text style={styles.priceTag}>₹2999/year</Text>
              </View>

              <Text style={styles.offer}>Annual Plan</Text>
              
              <View style={styles.slotLabelContainer}>
                <Ionicons name="calendar-outline" size={14} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.slotLabel}>Tap to select subscription slot</Text>
              </View>

              <View style={styles.whiteButton}>
                <Text style={styles.whiteButtonText}>Pick Subscription Slot</Text>
                <Ionicons name="arrow-forward" size={16} color="#111827" style={{ marginLeft: 6 }} />
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Popular Services Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.heading}>Popular Services</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Services')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {/* Custom Service Grid Cards */}
        <View style={styles.servicesGridContainer}>
          {services.slice(0, 3).map((item) => {
            const illustration = getServiceIllustration(item.title, item.icon);
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.gridCardItem}
                onPress={() => handleBookService(item)}
                activeOpacity={0.8}
              >
                <View style={styles.gridCardIconWrapper}>
                  <Image source={{ uri: illustration }} style={styles.gridCardImg} />
                </View>
                <Text style={styles.gridCardTitle} numberOfLines={2}>{item.title}</Text>
                <View style={styles.gridBadge}>
                  <Text style={styles.gridBadgeText}>
                    {isServiceIncluded(item.title) ? 'Free' : `₹${item.price}`}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Quick Action Shortcuts */}
        <Text style={styles.heading}>Quick Actions</Text>
        <View style={styles.shortcutsRow}>
          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate('Services');
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.shortcutIconBg, { backgroundColor: '#25213E' }]}>
              <Ionicons name="construct-outline" size={24} color="#F0C38E" />
            </View>
            <Text style={styles.shortcutText}>Book Service</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate('Referrals');
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.shortcutIconBg, { backgroundColor: '#25213E' }]}>
              <Ionicons name="calendar-outline" size={24} color="#F0C38E" />
            </View>
            <Text style={styles.shortcutText}>Select Slot</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate('Profile');
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.shortcutIconBg, { backgroundColor: '#25213E' }]}>
              <Ionicons name="time-outline" size={24} color="#FF9800" />
            </View>
            <Text style={styles.shortcutText}>My History</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
    color: '#FFFFFF',
  },
  welcomeSub: {
    fontSize: 14,
    color: '#A5A1B8',
    marginTop: 4,
    fontWeight: '500',
  },
  cardContainer: {
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
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
    backgroundColor: '#48426D',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
  },
  whiteButtonText: {
    fontWeight: '700',
    color: '#FFFFFF',
    fontSize: 14,
  },
  heading: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
    color: '#FFFFFF',
  },
  shortcutsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  shortcutCard: {
    flex: 1,
    backgroundColor: '#48426D',
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#3D3762',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
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
    color: '#FFFFFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  seeAll: {
    color: '#F0C38E',
    fontWeight: '700',
    fontSize: 14,
  },
  serviceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#48426D',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3D3762',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
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
    color: '#FFFFFF',
  },
  serviceSubtitle: {
    fontSize: 12,
    color: '#A5A1B8',
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
  servicesGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginHorizontal: -4,
    marginTop: 8,
    marginBottom: 16,
  },
  gridCardItem: {
    width: '30%',
    marginHorizontal: '1.5%',
    alignItems: 'center',
    marginBottom: 16,
  },
  gridCardIconWrapper: {
    width: '100%',
    aspectRatio: 1.2,
    backgroundColor: '#312C51',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#3D3762',
  },
  gridCardImg: {
    width: 52,
    height: 52,
    resizeMode: 'contain',
  },
  gridCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    minHeight: 30,
    lineHeight: 14,
  },
  gridBadge: {
    backgroundColor: 'rgba(240, 195, 142, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 0.5,
    borderColor: '#F0C38E',
  },
  gridBadgeText: {
    color: '#F0C38E',
    fontSize: 9,
    fontWeight: '800',
  },
});
