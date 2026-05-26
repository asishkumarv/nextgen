import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import Header from '../components/Header';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');

export default function ServicesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  
  const { 
    activeBookingService, 
    setActiveBookingService, 
    addBooking,
    services,
    refreshData
  } = useApp();

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (refreshData) {
      await refreshData();
    }
    setRefreshing(false);
  };

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredServices, setFilteredServices] = useState([]);

  // Booking flow states
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  
  // Address form states
  const [houseNo, setHouseNo] = useState('Flat 405, Block B');
  const [street, setStreet] = useState('Green Glen Layout');
  const [landmark, setLandmark] = useState('Near Central Mall');
  const [pincode, setPincode] = useState('560103');

  // Success view state
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState('');

  // Handle live search
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredServices(services);
    } else {
      const filtered = services.filter(service => 
        service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredServices(filtered);
    }
  }, [searchQuery, services]);

  // Generate next 7 days for booking dates
  const generateDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 7; i++) {
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + i);
      const dayName = nextDate.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = nextDate.getDate();
      const monthName = nextDate.toLocaleDateString('en-US', { month: 'short' });
      dates.push({
        formatted: `${dayName} ${dayNum} ${monthName}`,
        raw: nextDate
      });
    }
    return dates;
  };
  const availableDates = generateDates();

  // Pre-select first date and time slot when booking starts
  useEffect(() => {
    if (activeBookingService) {
      setSelectedDate(availableDates[0].formatted);
      setSelectedTimeSlot('Morning (9 AM - 12 PM)');
      setBookingStep(1);
      setBookingSuccess(false);
    }
  }, [activeBookingService]);

  const handleStartBooking = (service) => {
    setActiveBookingService(service);
  };

  const handleNextStep = () => {
    if (bookingStep < 4) {
      setBookingStep(bookingStep + 1);
    }
  };

  const handleBackStep = () => {
    if (bookingStep > 1) {
      setBookingStep(bookingStep - 1);
    } else {
      setActiveBookingService(null);
    }
  };

  const handleConfirmBooking = async () => {
    if (!activeBookingService) return;
    try {
      const addressString = `${houseNo}, ${street}, ${landmark} - ${pincode}`;
      const newId = await addBooking(
        activeBookingService.title || '',
        activeBookingService.price || 0,
        selectedDate,
        selectedTimeSlot ? selectedTimeSlot.split(' ')[0] : 'Morning',
        addressString
      );
      setCreatedBookingId(newId);
      setBookingSuccess(true);
    } catch (error) {
      alert(error.message || 'Failed to create booking. Please try again.');
    }
  };

  const handleFinishBooking = () => {
    setActiveBookingService(null);
    setBookingSuccess(false);
    // Navigate to profile tab to see history
    navigation.navigate('Profile');
  };


  // RENDERING COMPONENT A: Search and Service Listing View (Image 2)
  const renderServiceList = () => (
    <ScrollView 
      style={styles.scrollContainer}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#00C853']} />
      }
    >
      <Header />

      <Text style={styles.heading}>Services</Text>
      <Text style={styles.subHeading}>Transparent pricing, expert technicians</Text>

      {/* Search Input Bar */}
      <View style={styles.searchBarContainer}>
        <Ionicons name="search-outline" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search electrical services..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Services Cards */}
      {filteredServices.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#9CA3AF" />
          <Text style={styles.emptyText}>No services found matching &quot;{searchQuery}&quot;</Text>
        </View>
      ) : (
        filteredServices.map(item => (
          <View style={styles.serviceCard} key={item.id}>
            <View style={styles.serviceLeft}>
              <View style={styles.serviceIconBg}>
                <Ionicons
                  name={item.icon || 'construct-outline'}
                  size={22}
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
              onPress={() => handleStartBooking(item)}
            >
              <LinearGradient
                colors={['#00C853', '#0091EA']}
                style={styles.bookBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.bookBtnText}>Book</Text>
                <Ionicons name="arrow-forward" size={14} color="#FFF" style={{ marginLeft: 4 }} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );

  // RENDERING COMPONENT B: 4-Step Booking Flow View (Image 4)
  const renderBookingFlow = () => {
    if (!activeBookingService) return null;
    if (bookingSuccess) {

      return (
        <View style={styles.successContainer}>
          <View style={styles.successCard}>
            <View style={styles.successCheckBg}>
              <Ionicons name="checkmark-circle" size={80} color="#00C853" />
            </View>
            <Text style={styles.successTitle}>Booking Successful!</Text>
            <Text style={styles.successMsg}>
              Your request for {activeBookingService?.title} has been received.
            </Text>
            
            <View style={styles.receiptContainer}>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Booking ID</Text>
                <Text style={styles.receiptVal}>{createdBookingId}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Amount Paid</Text>
                <Text style={styles.receiptVal}>₹{activeBookingService?.price}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Scheduled For</Text>
                <Text style={styles.receiptVal}>{selectedDate}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.doneBtn} onPress={handleFinishBooking}>
              <LinearGradient
                colors={['#00B894', '#0091EA']}
                style={styles.doneBtnGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.doneBtnText}>View Bookings</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Row */}
          <View style={styles.flowHeaderRow}>
            <TouchableOpacity style={styles.backBtn} onPress={handleBackStep}>
              <Ionicons name="arrow-back" size={20} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.flowTitle}>Book Service</Text>
          </View>

          {/* Steps Progress Indicator (4 segments matching Image 4) */}
          <View style={styles.stepsContainer}>
            <View style={styles.stepsTextRow}>
              <Text style={[styles.stepLabelText, bookingStep >= 1 && styles.stepLabelActive]}>Service</Text>
              <Text style={[styles.stepLabelText, bookingStep >= 2 && styles.stepLabelActive]}>Time</Text>
              <Text style={[styles.stepLabelText, bookingStep >= 3 && styles.stepLabelActive]}>Address</Text>
              <Text style={[styles.stepLabelText, bookingStep >= 4 && styles.stepLabelActive]}>Confirm</Text>
            </View>
            
            <View style={styles.barWrapper}>
              <View style={[styles.barSegment, bookingStep >= 1 ? styles.barActive : styles.barInactive]} />
              <View style={[styles.barSegment, bookingStep >= 2 ? styles.barActive : styles.barInactive]} />
              <View style={[styles.barSegment, bookingStep >= 3 ? styles.barActive : styles.barInactive]} />
              <View style={[styles.barSegment, bookingStep >= 4 ? styles.barActive : styles.barInactive]} />
            </View>
          </View>

          {/* STEP 1: CHOOSE SERVICE SCREEN */}
          {bookingStep === 1 && (
            <View>
              <View style={styles.stepSectionHeader}>
                <View style={styles.stepIconBg}>
                  <Ionicons name="construct" size={16} color="#15803D" />
                </View>
                <Text style={styles.stepSectionTitle}>Choose service</Text>
              </View>

              {services.map(item => {
                const isSelected = item.id === activeBookingService?.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.8}
                    style={[styles.serviceSelectCard, isSelected && styles.serviceSelectCardActive]}
                    onPress={() => setActiveBookingService(item)}
                  >
                    <View style={styles.serviceSelectLeft}>
                      <View style={[styles.serviceSelectIconBg, isSelected && styles.serviceSelectIconBgActive]}>
                        <Ionicons 
                          name={item.icon || 'construct-outline'} 
                          size={20} 
                          color={isSelected ? '#15803D' : '#6B7280'} 
                        />
                      </View>
                      <View style={{ marginLeft: 12, flex: 1 }}>
                        <Text style={[styles.serviceSelectTitle, isSelected && styles.serviceSelectTitleActive]}>
                          {item.title}
                        </Text>
                        <Text style={styles.serviceSelectSubtitle}>{item.subtitle}</Text>
                      </View>
                    </View>
                    <Text style={[styles.serviceSelectPrice, isSelected && styles.serviceSelectPriceActive]}>
                      ₹{item.price}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity style={styles.nextStepBtn} onPress={handleNextStep}>
                <LinearGradient
                  colors={['#00C853', '#0091EA']}
                  style={styles.nextStepBtnGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.nextStepBtnText}>Next: Select Time</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFF" style={{ marginLeft: 8 }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: SELECT DATE & TIME */}
          {bookingStep === 2 && (
            <View>
              <View style={styles.stepSectionHeader}>
                <View style={styles.stepIconBg}>
                  <Ionicons name="calendar" size={16} color="#15803D" />
                </View>
                <Text style={styles.stepSectionTitle}>Choose Date & Time</Text>
              </View>

              {/* Horizontal Dates Picker */}
              <Text style={styles.fieldHeading}>Select Date</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.datesRow}
              >
                {availableDates.map((dateObj, idx) => {
                  const isSelected = dateObj.formatted === selectedDate;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.datePill, isSelected && styles.datePillActive]}
                      onPress={() => setSelectedDate(dateObj.formatted)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.datePillText, isSelected && styles.datePillTextActive]}>
                        {dateObj.formatted.split(' ')[0]}
                      </Text>
                      <Text style={[styles.datePillDayNum, isSelected && styles.datePillDayNumActive]}>
                        {dateObj.formatted.split(' ')[1]}
                      </Text>
                      <Text style={[styles.datePillText, isSelected && styles.datePillTextActive]}>
                        {dateObj.formatted.split(' ')[2]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Time Slots grid */}
              <Text style={styles.fieldHeading}>Select Time Slot</Text>
              {['Morning (9 AM - 12 PM)', 'Afternoon (1 PM - 4 PM)', 'Evening (5 PM - 8 PM)'].map((slot, idx) => {
                const isSelected = slot === selectedTimeSlot;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.timeSlotCard, isSelected && styles.timeSlotCardActive]}
                    onPress={() => setSelectedTimeSlot(slot)}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name={slot.includes('Morning') ? 'sunny-outline' : slot.includes('Afternoon') ? 'partly-sunny-outline' : 'moon-outline'} 
                      size={20} 
                      color={isSelected ? '#00B894' : '#6B7280'} 
                      style={{ marginRight: 12 }}
                    />
                    <Text style={[styles.timeSlotText, isSelected && styles.timeSlotTextActive]}>{slot}</Text>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity style={styles.nextStepBtn} onPress={handleNextStep}>
                <LinearGradient
                  colors={['#00C853', '#0091EA']}
                  style={styles.nextStepBtnGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.nextStepBtnText}>Next: Enter Address</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFF" style={{ marginLeft: 8 }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 3: SERVICE ADDRESS */}
          {bookingStep === 3 && (
            <View>
              <View style={styles.stepSectionHeader}>
                <View style={styles.stepIconBg}>
                  <Ionicons name="location" size={16} color="#15803D" />
                </View>
                <Text style={styles.stepSectionTitle}>Service Address</Text>
              </View>

              <View style={styles.addressForm}>
                <View style={styles.inputBox}>
                  <Text style={styles.inputHeading}>House / Flat No.</Text>
                  <TextInput
                    style={styles.addressInput}
                    value={houseNo}
                    onChangeText={setHouseNo}
                    placeholder="e.g. Flat 405, Block B"
                  />
                </View>

                <View style={styles.inputBox}>
                  <Text style={styles.inputHeading}>Street / Area</Text>
                  <TextInput
                    style={styles.addressInput}
                    value={street}
                    onChangeText={setStreet}
                    placeholder="e.g. Green Glen Layout"
                  />
                </View>

                <View style={styles.inputBox}>
                  <Text style={styles.inputHeading}>Landmark</Text>
                  <TextInput
                    style={styles.addressInput}
                    value={landmark}
                    onChangeText={setLandmark}
                    placeholder="e.g. Near Central Mall"
                  />
                </View>

                <View style={styles.inputBox}>
                  <Text style={styles.inputHeading}>Pincode</Text>
                  <TextInput
                    style={styles.addressInput}
                    value={pincode}
                    onChangeText={setPincode}
                    placeholder="e.g. 560103"
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.nextStepBtn} onPress={handleNextStep}>
                <LinearGradient
                  colors={['#00C853', '#0091EA']}
                  style={styles.nextStepBtnGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.nextStepBtnText}>Next: Review & Confirm</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFF" style={{ marginLeft: 8 }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 4: REVIEW & CONFIRM */}
          {bookingStep === 4 && (
            <View>
              <View style={styles.stepSectionHeader}>
                <View style={styles.stepIconBg}>
                  <Ionicons name="receipt" size={16} color="#15803D" />
                </View>
                <Text style={styles.stepSectionTitle}>Confirm Booking Details</Text>
              </View>

              {/* Review card */}
              <View style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewServiceTitle}>{activeBookingService?.title}</Text>
                  <Text style={styles.reviewServicePrice}>₹{activeBookingService?.price}</Text>
                </View>
                
                <Text style={styles.reviewSubtitle}>{activeBookingService?.subtitle}</Text>
                
                <View style={styles.reviewDivider} />
                
                <View style={styles.reviewItem}>
                  <Ionicons name="calendar-outline" size={18} color="#6B7280" style={{ marginRight: 10 }} />
                  <Text style={styles.reviewText}>{selectedDate} • {selectedTimeSlot}</Text>
                </View>

                <View style={styles.reviewItem}>
                  <Ionicons name="location-outline" size={18} color="#6B7280" style={{ marginRight: 10 }} />
                  <Text style={styles.reviewText}>
                    {houseNo}, {street}, {landmark} - {pincode}
                  </Text>
                </View>

                <View style={styles.reviewDivider} />

                <View style={styles.paymentMethod}>
                  <Ionicons name="card-outline" size={18} color="#00B894" style={{ marginRight: 10 }} />
                  <Text style={[styles.reviewText, { color: '#00B894', fontWeight: '700' }]}>
                    Paid via Power Care Subscription
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={styles.nextStepBtn} onPress={handleConfirmBooking}>
                <LinearGradient
                  colors={['#00C853', '#0091EA']}
                  style={styles.nextStepBtnGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.nextStepBtnText}>Confirm & Book Service</Text>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" style={{ marginLeft: 8 }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {activeBookingService ? renderBookingFlow() : renderServiceList()}
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
  heading: {
    fontSize: 28,
    fontWeight: '850',
    color: '#111827',
    marginTop: 10,
  },
  subHeading: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 4,
    marginBottom: 20,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  serviceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  serviceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceIconBg: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceInfo: {
    marginLeft: 12,
    flex: 1,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  serviceSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  servicePrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#15803D',
    marginTop: 4,
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 100,
  },
  bookBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 15,
    marginTop: 10,
    textAlign: 'center',
  },

  // Booking Flow header styles
  flowHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 16,
  },
  flowTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  stepsContainer: {
    marginTop: 12,
    marginBottom: 20,
  },
  stepsTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  stepLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  stepLabelActive: {
    color: '#00B894',
    fontWeight: '800',
  },
  barWrapper: {
    flexDirection: 'row',
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    justifyContent: 'space-between',
  },
  barSegment: {
    flex: 1,
    height: '100%',
    marginHorizontal: 2,
    borderRadius: 2,
  },
  barActive: {
    backgroundColor: '#00B894',
  },
  barInactive: {
    backgroundColor: '#E5E7EB',
  },
  stepSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 10,
  },
  stepIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  stepSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#374151',
  },

  // Step 1 styling
  serviceSelectCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  serviceSelectCardActive: {
    borderColor: '#00B894',
    backgroundColor: '#ECFDF5',
  },
  serviceSelectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceSelectIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceSelectIconBgActive: {
    backgroundColor: '#D1FAE5',
  },
  serviceSelectTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#374151',
  },
  serviceSelectTitleActive: {
    color: '#065F46',
  },
  serviceSelectSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  serviceSelectPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#374151',
  },
  serviceSelectPriceActive: {
    color: '#047857',
  },
  nextStepBtn: {
    marginTop: 24,
    shadowColor: '#0091EA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  nextStepBtnGrad: {
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextStepBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // Step 2 styling
  fieldHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
    marginTop: 12,
    marginBottom: 8,
  },
  datesRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  datePill: {
    width: 72,
    height: 90,
    backgroundColor: '#FFF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  datePillActive: {
    backgroundColor: '#00B894',
    borderColor: '#00B894',
  },
  datePillText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  datePillTextActive: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  datePillDayNum: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginVertical: 4,
  },
  datePillDayNumActive: {
    color: '#FFF',
  },
  timeSlotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  timeSlotCardActive: {
    borderColor: '#00B894',
    backgroundColor: '#ECFDF5',
  },
  timeSlotText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  timeSlotTextActive: {
    color: '#065F46',
    fontWeight: '700',
  },

  // Step 3 Address styling
  addressForm: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputBox: {
    marginBottom: 14,
  },
  inputHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 6,
  },
  addressInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },

  // Step 4 Confirm styling
  reviewCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewServiceTitle: {
    fontSize: 18,
    fontWeight: '850',
    color: '#111827',
  },
  reviewServicePrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#15803D',
  },
  reviewSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  reviewDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 14,
  },
  reviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
    flex: 1,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Success screen styling
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  successCard: {
    backgroundColor: '#FFF',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  successCheckBg: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  successMsg: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  receiptContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  receiptLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  receiptVal: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '700',
  },
  doneBtn: {
    width: '100%',
  },
  doneBtnGrad: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});