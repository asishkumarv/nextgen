import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { getServiceIllustration } from '../utils/illustrations';

export default function ServiceDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { service } = route.params || {};
  const { setActiveBookingService, isServiceIncluded } = useApp();

  const illustration = useMemo(
    () => getServiceIllustration(service?.title, service?.icon),
    [service?.title, service?.icon]
  );

  const isFree = isServiceIncluded ? isServiceIncluded(service?.title) : false;

  const handleBookNow = () => {
    setActiveBookingService(service);
    navigation.navigate('Services');
  };

  if (!service) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={{ color: '#FFF', textAlign: 'center', marginTop: 40 }}>Service not found.</Text>
      </View>
    );
  }

  // Build a readable description from service data
  const descriptionLines = [
    service.subtitle || service.description || null,
  ].filter(Boolean);

  const features = [
    '✔ Certified and verified technicians',
    '✔ On-time service guarantee',
    '✔ Transparent pricing — no hidden charges',
    '✔ Post-service support included',
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Back button */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={[styles.backBtn, { top: insets.top + 12 }]}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={20} color="#F0C38E" />
      </TouchableOpacity>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Illustration Hero */}
        <LinearGradient
          colors={['#3D3472', '#23203A']}
          style={styles.heroGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Image
            source={{ uri: illustration }}
            style={styles.heroImage}
            resizeMode="contain"
          />
        </LinearGradient>

        {/* Content */}
        <View style={styles.content}>

          {/* Price Badge */}
          <View style={styles.priceBadgeRow}>
            {isFree ? (
              <LinearGradient
                colors={['#00C853', '#00897B']}
                style={styles.freeBadge}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="shield-checkmark" size={14} color="#FFF" style={{ marginRight: 5 }} />
                <Text style={styles.freeBadgeText}>FREE — Covered by your subscription</Text>
              </LinearGradient>
            ) : (
              <View style={styles.priceBadge}>
                <Text style={styles.priceCurrency}>₹</Text>
                <Text style={styles.priceAmount}>{service.price || '0'}</Text>
                <Text style={styles.priceLabel}> / visit</Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text style={styles.serviceTitle}>{service.title}</Text>

          {/* Subtitle / short description */}
          {descriptionLines.length > 0 && (
            <Text style={styles.serviceSubtitle}>{descriptionLines[0]}</Text>
          )}

          {/* Divider */}
          <View style={styles.divider} />

          {/* What's included */}
          <Text style={styles.sectionLabel}>What's Included</Text>
          <View style={styles.featuresBox}>
            {features.map((f, i) => (
              <Text key={i} style={styles.featureItem}>{f}</Text>
            ))}
          </View>

          {/* Info strip */}
          <View style={styles.infoStrip}>
            <View style={styles.infoChip}>
              <Ionicons name="time-outline" size={16} color="#F0C38E" />
              <Text style={styles.infoChipText}>60–90 min</Text>
            </View>
            <View style={styles.infoChip}>
              <Ionicons name="star" size={16} color="#F0C38E" />
              <Text style={styles.infoChipText}>4.8 Rating</Text>
            </View>
            <View style={styles.infoChip}>
              <Ionicons name="people-outline" size={16} color="#F0C38E" />
              <Text style={styles.infoChipText}>Expert Team</Text>
            </View>
          </View>

        </View>
      </ScrollView>

      {/* Fixed bottom Book Button */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          onPress={handleBookNow}
          activeOpacity={0.85}
          style={styles.bookBtnWrapper}
        >
          <LinearGradient
            colors={['#F0C38E', '#F1AA9B']}
            style={styles.bookBtn}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="calendar-outline" size={18} color="#312C51" style={{ marginRight: 8 }} />
            <Text style={styles.bookBtnText}>Book This Service</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#312C51',
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 20,
    padding: 8,
  },
  scroll: {
    flex: 1,
  },
  heroGradient: {
    height: 260,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    width: '80%',
    height: 200,
  },
  content: {
    padding: 20,
  },
  priceBadgeRow: {
    marginBottom: 12,
  },
  freeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  freeBadgeText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
  priceBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    alignSelf: 'flex-start',
    backgroundColor: '#23203A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F0C38E',
  },
  priceCurrency: {
    color: '#F0C38E',
    fontSize: 16,
    fontWeight: '700',
  },
  priceAmount: {
    color: '#F0C38E',
    fontSize: 26,
    fontWeight: '800',
  },
  priceLabel: {
    color: '#A5A1B8',
    fontSize: 13,
  },
  serviceTitle: {
    color: '#F8F7FF',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 8,
    lineHeight: 32,
  },
  serviceSubtitle: {
    color: '#A5A1B8',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#48426D',
    marginVertical: 18,
  },
  sectionLabel: {
    color: '#F0C38E',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  featuresBox: {
    backgroundColor: '#23203A',
    borderRadius: 12,
    padding: 16,
    gap: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#48426D',
  },
  featureItem: {
    color: '#D1CDE8',
    fontSize: 14,
    lineHeight: 22,
  },
  infoStrip: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#23203A',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 6,
    borderWidth: 1,
    borderColor: '#48426D',
  },
  infoChipText: {
    color: '#D1CDE8',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#23203A',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#48426D',
  },
  bookBtnWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
  },
  bookBtnText: {
    color: '#312C51',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});
