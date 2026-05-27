import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import Header from '../components/Header';
import colors from '../theme/colors';

const { width } = Dimensions.get('window');
const SLOT_SIZE = (width - 104) / 5;

export default function SlotsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { bookedSlot, bookingDetails, bookSlot, cancelSlot, refreshData } = useApp();
  
  const [districts, setDistricts] = useState([]);
  const [mandals, setMandals] = useState([]);
  const [mandalBookedSlots, setMandalBookedSlots] = useState(new Set());
  
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedMandal, setSelectedMandal] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedLocalSlot, setSelectedLocalSlot] = useState(null);

  const [districtDropdownOpen, setDistrictDropdownOpen] = useState(false);
  const [mandalDropdownOpen, setMandalDropdownOpen] = useState(false);
  const [eventDropdownOpen, setEventDropdownOpen] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [loadingBooked, setLoadingBooked] = useState(false);

  // Fetch districts on mount
  const fetchDistricts = async () => {
    try {
      const data = await api.get('/subscription/districts');
      setDistricts(data || []);
    } catch (err) {
      console.warn('Failed to load districts:', err.message);
    }
  };

  useEffect(() => {
    fetchDistricts();
  }, []);

  // Fetch mandals when district changes
  useEffect(() => {
    if (!selectedDistrict) {
      setMandals([]);
      return;
    }
    const fetchMandals = async () => {
      try {
        const data = await api.get(`/subscription/mandals?districtId=${selectedDistrict.id}`);
        setMandals(data || []);
      } catch (err) {
        console.warn('Failed to load mandals:', err.message);
      }
    };
    fetchMandals();
  }, [selectedDistrict]);

  // Fetch booked slots for the selected mandal
  const fetchBookedSlots = async () => {
    if (!selectedMandal) {
      setMandalBookedSlots(new Set());
      return;
    }
    setLoadingBooked(true);
    try {
      const data = await api.get(`/subscription/booked?mandalId=${selectedMandal.id}`);
      if (data && data.bookedSlots) {
        const parsed = data.bookedSlots.map(s => String(s).trim());
        setMandalBookedSlots(new Set(parsed));
      }
    } catch (err) {
      console.warn('Failed to load booked slots:', err.message);
    } finally {
      setLoadingBooked(false);
    }
  };

  useEffect(() => {
    fetchBookedSlots();
  }, [selectedMandal]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDistricts();
    await fetchBookedSlots();
    if (refreshData) {
      await refreshData();
    }
    setRefreshing(false);
  };

  const configuredSlots = selectedMandal
    ? selectedMandal.slots.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const configuredEvents = selectedMandal
    ? selectedMandal.event_names.split(',').map(e => e.trim()).filter(Boolean)
    : [];

  const isSlotBooked = (slotNum) => {
    return mandalBookedSlots.has(String(slotNum).trim());
  };

  const handleSelectSlot = (slotNum) => {
    if (isSlotBooked(slotNum)) return;
    if (!selectedEvent) {
      alert('Please select an Event Name first');
      return;
    }
    setSelectedLocalSlot(slotNum === selectedLocalSlot ? null : slotNum);
  };

  const handleConfirmBooking = async () => {
    if (selectedDistrict && selectedMandal && selectedLocalSlot && selectedEvent) {
      const result = await bookSlot(
        selectedDistrict.id,
        selectedMandal.id,
        selectedLocalSlot,
        selectedEvent
      );
      if (result && result.success) {
        setSelectedLocalSlot(null);
      } else {
        alert(result?.message || 'Failed to purchase subscription');
      }
    }
  };

  // Rendering Case A: No Active Subscription (District/Mandal selection and slots grid)
  const renderSlotGrid = () => (
    <ScrollView 
      style={styles.scrollContainer}
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#0091EA']} />
      }
    >
      <View style={styles.headerWrapper}>
        <Header />
      </View>

      {/* Subscription Card */}
      <LinearGradient
        colors={['#00B0FF', '#0091EA', '#00C853']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientCard}
      >
        <View style={styles.badgeRow}>
          <View style={styles.sparkBadge}>
            <Ionicons name="sparkles" size={12} color="#FFF" />
            <Text style={styles.sparkBadgeText}>NextGen Power Care</Text>
          </View>
        </View>
        <Text style={styles.cardTitle}>Subscription Portal</Text>
        <Text style={styles.cardSubtitle}>Unlock custom event repair slots in your locality</Text>
      </LinearGradient>

      {/* Dropdown Filters */}
      <View style={styles.filterSection}>
        <Text style={styles.sectionHeading}>Configure Location</Text>

        {/* District Dropdown */}
        <TouchableOpacity style={styles.dropdownBtn} onPress={() => setDistrictDropdownOpen(true)}>
          <Text style={[styles.dropdownText, !selectedDistrict && { color: '#9CA3AF' }]}>
            {selectedDistrict ? selectedDistrict.name : "Select District"}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#6B7280" />
        </TouchableOpacity>

        {/* Mandal Dropdown */}
        <TouchableOpacity 
          style={[styles.dropdownBtn, !selectedDistrict && styles.dropdownDisabled]} 
          onPress={() => selectedDistrict && setMandalDropdownOpen(true)}
          disabled={!selectedDistrict}
        >
          <Text style={[styles.dropdownText, (!selectedMandal || !selectedDistrict) && { color: '#9CA3AF' }]}>
            {selectedMandal ? selectedMandal.name : "Select Mandal"}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#6B7280" />
        </TouchableOpacity>

        {/* Event Name Dropdown */}
        <TouchableOpacity 
          style={[styles.dropdownBtn, !selectedMandal && styles.dropdownDisabled]} 
          onPress={() => selectedMandal && setEventDropdownOpen(true)}
          disabled={!selectedMandal}
        >
          <Text style={[styles.dropdownText, (!selectedEvent || !selectedMandal) && { color: '#9CA3AF' }]}>
            {selectedEvent ? selectedEvent : "Select Event Name"}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Legend Indicator Section */}
      {selectedMandal && (
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
      )}

      {/* Slots Selection Grid */}
      {selectedMandal && (
        <View style={styles.gridCard}>
          <View style={styles.gridHeader}>
            <Text style={styles.gridHeading}>Available Slots in {selectedMandal.name}</Text>
            {loadingBooked ? (
              <ActivityIndicator size="small" color="#0984E3" />
            ) : (
              <Text style={styles.gridActionText}>Choose 1 slot</Text>
            )}
          </View>

          {configuredSlots.length === 0 ? (
            <View style={styles.noSlotsContainer}>
              <Text style={styles.noSlotsText}>No slots configured for this Mandal.</Text>
            </View>
          ) : (
            <View style={styles.gridBody}>
              {configuredSlots.map((num) => {
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
          )}
        </View>
      )}
    </ScrollView>
  );

  // Rendering Case B: Subscribed (Already purchased)
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

      {/* Success Banner */}
      <LinearGradient
        colors={['#00C853', '#00B0FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.successGradientCard}
      >
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark" size={40} color="#00C853" />
        </View>
        <Text style={styles.successTitle}>Active Subscription</Text>
        <Text style={styles.successSubtitle}>Welcome to Next Gen Power Care</Text>

        <View style={styles.subscriptionActiveBadge}>
          <Ionicons name="sparkles" size={12} color="#FFF" style={{ marginRight: 6 }} />
          <Text style={styles.subscriptionActiveText}>Active</Text>
        </View>
      </LinearGradient>

      {/* Reserved Slot details */}
      <View style={styles.slotDetailCard}>
        <Text style={styles.slotDetailHeader}>YOUR SLOT NUMBER</Text>
        <Text style={styles.slotDetailNumber}>#{bookingDetails?.slotNumber || bookedSlot}</Text>
        <Text style={styles.slotDetailFooter}>Reserved exclusively for you</Text>
      </View>

      {/* Subscription details */}
      <View style={styles.infoList}>
        {/* District & Mandal */}
        <View style={styles.infoRow}>
          <View style={[styles.infoIconWrapper, { backgroundColor: '#E8F5E9' }]}>
            <Ionicons name="map-outline" size={20} color="#00C853" />
          </View>
          <View style={styles.infoTextWrapper}>
            <Text style={styles.infoLabel}>District & Mandal</Text>
            <Text style={styles.infoValue}>
              {bookingDetails?.districtName} / {bookingDetails?.mandalName}
            </Text>
          </View>
        </View>

        <View style={styles.rowDivider} />

        {/* Event Name */}
        <View style={styles.infoRow}>
          <View style={[styles.infoIconWrapper, { backgroundColor: '#E8F5E9' }]}>
            <Ionicons name="calendar-outline" size={20} color="#00C853" />
          </View>
          <View style={styles.infoTextWrapper}>
            <Text style={styles.infoLabel}>Subscribed Event</Text>
            <Text style={styles.infoValue}>{bookingDetails?.eventName}</Text>
          </View>
        </View>

        <View style={styles.rowDivider} />

        {/* Plan & Pricing */}
        <View style={styles.infoRow}>
          <View style={[styles.infoIconWrapper, { backgroundColor: '#E8F5E9' }]}>
            <Ionicons name="ribbon-outline" size={20} color="#00C853" />
          </View>
          <View style={styles.infoTextWrapper}>
            <Text style={styles.infoLabel}>Subscription Tier</Text>
            <Text style={styles.infoValue}>{bookingDetails?.plan}</Text>
          </View>
        </View>

        <View style={styles.rowDivider} />

        {/* Date Row */}
        <View style={styles.infoRow}>
          <View style={[styles.infoIconWrapper, { backgroundColor: '#E8F5E9' }]}>
            <Ionicons name="time-outline" size={20} color="#00C853" />
          </View>
          <View style={styles.infoTextWrapper}>
            <Text style={styles.infoLabel}>Valid Till</Text>
            <Text style={styles.infoValue}>{bookingDetails?.date}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.cancelButton}
        onPress={cancelSlot}
        activeOpacity={0.7}
      >
        <Text style={styles.cancelButtonText}>Cancel / Change Subscription</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {bookedSlot ? renderConfirmation() : renderSlotGrid()}

      {/* District Dropdown Modal Overlay */}
      {districtDropdownOpen && (
        <View style={styles.dropdownModalBg}>
          <TouchableOpacity style={styles.dropdownModalDismiss} onPress={() => setDistrictDropdownOpen(false)} />
          <View style={styles.dropdownListContainer}>
            <View style={styles.dropdownListHeader}>
              <Text style={styles.dropdownListTitle}>Select District</Text>
              <TouchableOpacity onPress={() => setDistrictDropdownOpen(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.dropdownListScroll}>
              {districts.map(d => (
                <TouchableOpacity 
                  key={d.id} 
                  style={styles.dropdownListItem} 
                  onPress={() => {
                    setSelectedDistrict(d);
                    setDistrictDropdownOpen(false);
                    setSelectedMandal(null);
                    setSelectedEvent(null);
                    setSelectedLocalSlot(null);
                  }}
                >
                  <Text style={styles.dropdownListItemText}>{d.name}</Text>
                  {selectedDistrict?.id === d.id && <Ionicons name="checkmark" size={18} color="#00C853" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Mandal Dropdown Modal Overlay */}
      {mandalDropdownOpen && (
        <View style={styles.dropdownModalBg}>
          <TouchableOpacity style={styles.dropdownModalDismiss} onPress={() => setMandalDropdownOpen(false)} />
          <View style={styles.dropdownListContainer}>
            <View style={styles.dropdownListHeader}>
              <Text style={styles.dropdownListTitle}>Select Mandal</Text>
              <TouchableOpacity onPress={() => setMandalDropdownOpen(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.dropdownListScroll}>
              {mandals.map(m => (
                <TouchableOpacity 
                  key={m.id} 
                  style={styles.dropdownListItem} 
                  onPress={() => {
                    setSelectedMandal(m);
                    setMandalDropdownOpen(false);
                    setSelectedEvent(null);
                    setSelectedLocalSlot(null);
                  }}
                >
                  <Text style={styles.dropdownListItemText}>{m.name}</Text>
                  {selectedMandal?.id === m.id && <Ionicons name="checkmark" size={18} color="#00C853" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Event Dropdown Modal Overlay */}
      {eventDropdownOpen && (
        <View style={styles.dropdownModalBg}>
          <TouchableOpacity style={styles.dropdownModalDismiss} onPress={() => setEventDropdownOpen(false)} />
          <View style={styles.dropdownListContainer}>
            <View style={styles.dropdownListHeader}>
              <Text style={styles.dropdownListTitle}>Select Event Name</Text>
              <TouchableOpacity onPress={() => setEventDropdownOpen(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.dropdownListScroll}>
              {configuredEvents.map(e => (
                <TouchableOpacity 
                  key={e} 
                  style={styles.dropdownListItem} 
                  onPress={() => {
                    setSelectedEvent(e);
                    setEventDropdownOpen(false);
                    setSelectedLocalSlot(null);
                  }}
                >
                  <Text style={styles.dropdownListItemText}>{e}</Text>
                  {selectedEvent === e && <Ionicons name="checkmark" size={18} color="#00C853" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Bottom Sheet Modal Overlay for Subscription Confirmation */}
      {!bookedSlot && selectedLocalSlot && selectedEvent && (
        <View style={styles.modalBackdrop}>
          <TouchableOpacity 
            style={styles.modalDismissArea} 
            activeOpacity={1} 
            onPress={() => setSelectedLocalSlot(null)}
          />
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetLabel}>Selected slot for {selectedEvent}</Text>
                <Text style={styles.sheetSlotNumber}>#{selectedLocalSlot}</Text>
                <Text style={styles.sheetSubLabel}>{selectedDistrict?.name} / {selectedMandal?.name}</Text>
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
                <Text style={styles.subInfoPrice}>₹{parseInt(selectedMandal?.subscription_price)}/year</Text>
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
  },
  filterSection: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 14,
  },
  dropdownBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  dropdownDisabled: {
    backgroundColor: '#F9FAFB',
    borderColor: '#F3F4F6',
    opacity: 0.6,
  },
  dropdownText: {
    color: '#374151',
    fontSize: 14,
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
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  gridActionText: {
    color: '#0984E3',
    fontSize: 13,
    fontWeight: '750',
  },
  noSlotsContainer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  noSlotsText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  gridBody: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    paddingHorizontal: 2,
  },
  slotButton: {
    width: SLOT_SIZE,
    height: SLOT_SIZE,
    borderRadius: SLOT_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 6,
    marginHorizontal: ((width - 32 - 32) - (SLOT_SIZE * 5)) / 10,
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
    fontWeight: '750',
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
    color: '#00B894',
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
    fontSize: 12,
    fontWeight: '700',
  },
  sheetSlotNumber: {
    color: '#111827',
    fontSize: 32,
    fontWeight: '800',
    marginTop: 4,
  },
  sheetSubLabel: {
    color: '#00B894',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
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
  // Modal styles for selectors
  dropdownModalBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 2000,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dropdownModalDismiss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dropdownListContainer: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    width: '100%',
    maxHeight: '60%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  dropdownListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  dropdownListTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  dropdownListScroll: {
    flexGrow: 0,
  },
  dropdownListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#F9FAFB',
  },
  dropdownListItemText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '600',
  },
});
