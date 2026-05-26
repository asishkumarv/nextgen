import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import Header from '../components/Header';
import colors from '../theme/colors';

const { width } = Dimensions.get('window');
const SLOT_SIZE = (width - 104) / 5; // 5 slots per row, centered/stretched layout

export default function SlotsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { bookedSlot, bookingDetails, bookSlot, cancelSlot, dbBookedSlots, refreshBookedSlots, refreshData } = useApp();
  const [selectedLocalSlot, setSelectedLocalSlot] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (refreshData) {
      await refreshData();
    }
    setRefreshing(false);
  };
  const [currentPage, setCurrentPage] = useState(0); // 0 to 4 (5 pages total)

  const SLOTS_PER_PAGE = 600;
  const TOTAL_SLOTS = 2999;

  const startSlot = currentPage * SLOTS_PER_PAGE + 1;
  const endSlot = Math.min((currentPage + 1) * SLOTS_PER_PAGE, TOTAL_SLOTS);

  const bookedCount = dbBookedSlots ? dbBookedSlots.size : 0;
  const leftCount = Math.max(0, TOTAL_SLOTS - bookedCount);
  const progressPercent = TOTAL_SLOTS > 0 
    ? `${Math.max(bookedCount > 0 ? 1.5 : 0, (bookedCount / TOTAL_SLOTS) * 100).toFixed(2)}%` 
    : '0%';

  // Refresh slots from database when the screen is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (refreshBookedSlots) {
        refreshBookedSlots();
      }
    });
    return unsubscribe;
  }, [navigation, refreshBookedSlots]);

  // Dynamic slot booking registry checker
  const isSlotBooked = (num) => {
    // Check if the slot is occupied in Neon database (checking both number and string type)
    return !!(dbBookedSlots && (dbBookedSlots.has(num) || dbBookedSlots.has(String(num)) || dbBookedSlots.has(Number(num))));
  };

  // Generate slots for display on the current page
  const totalSlots = Array.from(
    { length: endSlot - startSlot + 1 },
    (_, i) => startSlot + i
  );

  const handleSelectSlot = (slotNum) => {
    if (isSlotBooked(slotNum)) {
      // Slot is already booked (prohibited)
      return;
    }
    setSelectedLocalSlot(slotNum === selectedLocalSlot ? null : slotNum);
  };

  const handleConfirmBooking = async () => {
    if (selectedLocalSlot) {
      await bookSlot(selectedLocalSlot);
      setSelectedLocalSlot(null);
    }
  };

  // Rendering Case A: No Slot Booked (Slot Selection Grid)
  const renderSlotGrid = () => (
    <ScrollView 
      style={styles.scrollContainer}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#0091EA']} />
      }
    >
      <View style={styles.headerWrapper}>
        <Header />
      </View>

      {/* Subscription Slot Booking Gradient Card */}
      <LinearGradient
        colors={['#00B0FF', '#0091EA', '#00C853']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientCard}
      >
        <View style={styles.badgeRow}>
          <View style={styles.sparkBadge}>
            <Ionicons name="sparkles" size={12} color="#FFF" />
            <Text style={styles.sparkBadgeText}>Pick your slot</Text>
          </View>
        </View>

        <Text style={styles.cardTitle}>Subscription Slot Booking</Text>
        <Text style={styles.cardSubtitle}>Hurry! Limited slots left for this year</Text>

        {/* Custom Progress Bar */}
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: progressPercent }]} />
        </View>
        
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressText}>{bookedCount} booked</Text>
          <Text style={styles.progressText}>{leftCount} left</Text>
        </View>
      </LinearGradient>

      {/* Legend Indicator Section */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} />
          <Text style={styles.legendText}>Available</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FCA5A5' }]} />
          <Text style={styles.legendText}>Booked</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#0984E3' }]} />
          <Text style={styles.legendText}>Selected</Text>
        </View>
      </View>

      {/* Grid Container */}
      <View style={styles.gridCard}>
        <View style={styles.gridHeader}>
          <Text style={styles.gridHeading}>Showing {startSlot} – {endSlot} of {TOTAL_SLOTS}</Text>
          <Text style={styles.gridActionText}>Tap to select</Text>
        </View>

        <View style={styles.gridBody}>
          {totalSlots.map((num) => {
            const isBooked = isSlotBooked(num);
            const isSelected = num === selectedLocalSlot;
            
            let slotStyle = styles.slotAvailable;
            let textStyle = styles.slotTextAvailable;

            if (isBooked) {
              slotStyle = styles.slotBooked;
              textStyle = styles.slotTextBooked;
            } else if (isSelected) {
              slotStyle = styles.slotSelected;
              textStyle = styles.slotTextSelected;
            }

            return (
              <TouchableOpacity
                key={num}
                activeOpacity={isBooked ? 1 : 0.7}
                onPress={() => handleSelectSlot(num)}
                style={[styles.slotButton, slotStyle]}
              >
                <Text style={[styles.slotLabel, textStyle]}>{num}</Text>
                {isBooked && (
                  <View style={styles.blockOverlay}>
                    <Ionicons name="ban" size={14} color="#EF4444" style={styles.banIcon} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Pagination Controls */}
        <View style={styles.paginationRow}>
          <TouchableOpacity
            style={[styles.pageButton, currentPage === 0 && styles.pageButtonDisabled]}
            disabled={currentPage === 0}
            onPress={() => {
              setCurrentPage(currentPage - 1);
              setSelectedLocalSlot(null);
            }}
          >
            <Ionicons name="chevron-back" size={20} color={currentPage === 0 ? '#9CA3AF' : '#0984E3'} />
          </TouchableOpacity>

          <Text style={styles.pageText}>
            Page {currentPage + 1} of 5
          </Text>

          <TouchableOpacity
            style={[styles.pageButton, currentPage === 4 && styles.pageButtonDisabled]}
            disabled={currentPage === 4}
            onPress={() => {
              setCurrentPage(currentPage + 1);
              setSelectedLocalSlot(null);
            }}
          >
            <Ionicons name="chevron-forward" size={20} color={currentPage === 4 ? '#9CA3AF' : '#0984E3'} />
          </TouchableOpacity>
        </View>
      </View>

    </ScrollView>
  );

  // Rendering Case B: Slot Booked (You're all set!)
  const renderConfirmation = () => (
    <ScrollView 
      style={styles.scrollContainer}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#00C853']} />
      }
    >
      <View style={styles.headerWrapper}>
        <Header />
      </View>

      {/* Booking Success Gradient Card */}
      <LinearGradient
        colors={['#00C853', '#00B0FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.successGradientCard}
      >
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark" size={40} color="#00C853" />
        </View>
        <Text style={styles.successTitle}>You&apos;re all set!</Text>
        <Text style={styles.successSubtitle}>Welcome to Next Gen Power Care</Text>

        <View style={styles.subscriptionActiveBadge}>
          <Ionicons name="sparkles" size={12} color="#FFF" style={{ marginRight: 6 }} />
          <Text style={styles.subscriptionActiveText}>Subscription active</Text>
        </View>
      </LinearGradient>

      {/* Slot Display Card */}
      <View style={styles.slotDetailCard}>
        <Text style={styles.slotDetailHeader}>YOUR SLOT NUMBER</Text>
        <Text style={styles.slotDetailNumber}>#{bookingDetails?.slotNumber || bookedSlot}</Text>
        <Text style={styles.slotDetailFooter}>Reserved exclusively for you</Text>
      </View>

      {/* Info List */}
      <View style={styles.infoList}>
        {/* Booking ID Row */}
        <View style={styles.infoRow}>
          <View style={[styles.infoIconWrapper, { backgroundColor: '#E8F5E9' }]}>
            <Ionicons name="grid-outline" size={20} color="#00C853" />
          </View>
          <View style={styles.infoTextWrapper}>
            <Text style={styles.infoLabel}>Booking ID</Text>
            <Text style={styles.infoValue}>{bookingDetails?.id}</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.rowDivider} />

        {/* Plan Row */}
        <View style={styles.infoRow}>
          <View style={[styles.infoIconWrapper, { backgroundColor: '#E8F5E9' }]}>
            <Ionicons name="ribbon-outline" size={20} color="#00C853" />
          </View>
          <View style={styles.infoTextWrapper}>
            <Text style={styles.infoLabel}>Plan</Text>
            <Text style={styles.infoValue}>{bookingDetails?.plan}</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.rowDivider} />

        {/* Booked On Row */}
        <View style={styles.infoRow}>
          <View style={[styles.infoIconWrapper, { backgroundColor: '#E8F5E9' }]}>
            <Ionicons name="calendar-outline" size={20} color="#00C853" />
          </View>
          <View style={styles.infoTextWrapper}>
            <Text style={styles.infoLabel}>Booked on</Text>
            <Text style={styles.infoValue}>{bookingDetails?.date}</Text>
          </View>
        </View>
      </View>

      {/* Cancel/Change Button */}
      <TouchableOpacity 
        style={styles.cancelButton}
        onPress={cancelSlot}
        activeOpacity={0.7}
      >
        <Text style={styles.cancelButtonText}>Cancel / Change Slot</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {bookedSlot ? renderConfirmation() : renderSlotGrid()}

      {/* Bottom Sheet Modal Overlay */}
      {!bookedSlot && selectedLocalSlot && (
        <View style={styles.modalBackdrop}>
          <TouchableOpacity 
            style={styles.modalDismissArea} 
            activeOpacity={1} 
            onPress={() => setSelectedLocalSlot(null)}
          />
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetLabel}>Selected slot</Text>
                <Text style={styles.sheetSlotNumber}>#{selectedLocalSlot}</Text>
              </View>
              <TouchableOpacity 
                style={styles.sheetCloseBtn} 
                onPress={() => setSelectedLocalSlot(null)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={22} color="#4B5563" />
              </TouchableOpacity>
            </View>

            <LinearGradient
              colors={['#E6F4EA', '#E3F2FD']}
              style={styles.subInfoCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View>
                <Text style={styles.subInfoLabel}>Annual subscription</Text>
                <Text style={styles.subInfoPrice}>₹2999/year</Text>
              </View>
              <View style={styles.unlimitedBadge}>
                <Text style={styles.unlimitedText}>Unlimited</Text>
              </View>
            </LinearGradient>

            <TouchableOpacity 
              style={styles.sheetConfirmBtnWrapper}
              onPress={handleConfirmBooking}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#00C853', '#0091EA']}
                style={styles.sheetConfirmBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.sheetConfirmBtnText}>Confirm subscription</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  headerWrapper: {
    paddingVertical: 10,
  },
  gradientCard: {
    borderRadius: 24,
    padding: 24,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  sparkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  sparkBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 5,
  },
  cardTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
  },
  cardSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 20,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 3,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 6,
  },
  legendText: {
    color: '#4B5563',
    fontSize: 13,
    fontWeight: '600',
  },
  gridCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  gridHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
    paddingBottom: 12,
  },
  gridHeading: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
  },
  gridActionText: {
    color: '#0984E3',
    fontSize: 14,
    fontWeight: '600',
  },
  gridBody: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  slotButton: {
    width: SLOT_SIZE,
    height: SLOT_SIZE,
    borderRadius: SLOT_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 6,
    position: 'relative',
  },
  slotAvailable: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  slotBooked: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  slotSelected: {
    backgroundColor: '#0984E3',
    borderWidth: 1,
    borderColor: '#0984E3',
  },
  slotLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: '#F3F4F6',
  },
  pageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  pageButtonDisabled: {
    backgroundColor: '#F9FAFB',
    opacity: 0.5,
  },
  pageText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
  },
  slotTextAvailable: {
    color: '#15803D',
  },
  slotTextBooked: {
    color: '#B91C1C',
  },
  slotTextSelected: {
    color: '#FFF',
  },
  blockOverlay: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FFF',
    borderRadius: 7,
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  banIcon: {
    fontSize: 12,
  },
  confirmButtonWrapper: {
    marginTop: 20,
    shadowColor: '#00B894',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButton: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // Success view styles
  successGradientCard: {
    borderRadius: 24,
    padding: 24,
    marginTop: 10,
    alignItems: 'center',
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  successTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  successSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 16,
    textAlign: 'center',
  },
  subscriptionActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 100,
  },
  subscriptionActiveText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  slotDetailCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    marginTop: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  slotDetailHeader: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  slotDetailNumber: {
    color: '#008080',
    fontSize: 48,
    fontWeight: '800',
    marginBottom: 8,
  },
  slotDetailFooter: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  infoList: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoTextWrapper: {
    flex: 1,
  },
  infoLabel: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
  },
  infoValue: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 8,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  cancelButtonText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bottomSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  sheetLabel: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '700',
  },
  sheetSlotNumber: {
    color: '#111827',
    fontSize: 32,
    fontWeight: '800',
    marginTop: 4,
  },
  sheetCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subInfoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginBottom: 24,
  },
  subInfoLabel: {
    color: '#4B5563',
    fontSize: 13,
    fontWeight: '600',
  },
  subInfoPrice: {
    color: '#00B894',
    fontSize: 20,
    fontWeight: '850',
    marginTop: 2,
  },
  unlimitedBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  unlimitedText: {
    color: '#047857',
    fontSize: 12,
    fontWeight: '700',
  },
  sheetConfirmBtnWrapper: {
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  sheetConfirmBtn: {
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetConfirmBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
