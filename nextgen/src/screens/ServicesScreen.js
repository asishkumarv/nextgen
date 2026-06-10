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
import { api } from '../utils/api';

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

  // District/Mandal/Event/Slot states for booking
  const { bookedSlot, subscriptions } = useApp();
  const activeSub = subscriptions?.find(s => s.status !== 'Rejected') || subscriptions?.[0];
  const [districts, setDistricts] = useState([]);
  const [mandals, setMandals] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedMandal, setSelectedMandal] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [districtDropdownOpen, setDistrictDropdownOpen] = useState(false);
  const [mandalDropdownOpen, setMandalDropdownOpen] = useState(false);
  const [eventDropdownOpen, setEventDropdownOpen] = useState(false);
  const [slotDropdownOpen, setSlotDropdownOpen] = useState(false);

  const [mandalBookedSlots, setMandalBookedSlots] = useState(new Set());
  const [loadingBooked, setLoadingBooked] = useState(false);

  // Fetch districts on entering step 2 (for non-subscribers)
  useEffect(() => {
    if (bookingStep === 2) {
      if (bookedSlot && activeSub) {
        // Prepopulate with active subscription
        setSelectedSlot(activeSub.slotNumber);
        setSelectedEvent(activeSub.eventName);
      } else {
        const loadDistricts = async () => {
          try {
            const data = await api.get('/subscription/districts');
            setDistricts(data || []);
          } catch (err) {
            console.warn('Failed to load districts:', err.message);
          }
        };
        loadDistricts();
      }
    }
  }, [bookingStep, bookedSlot, activeSub]);

  // Fetch mandals when district changes
  useEffect(() => {
    if (!selectedDistrict || bookedSlot) {
      setMandals([]);
      return;
    }
    const loadMandals = async () => {
      try {
        const data = await api.get(`/subscription/mandals?districtId=${selectedDistrict.id}`);
        setMandals(data || []);
      } catch (err) {
        console.warn('Failed to load mandals:', err.message);
      }
    };
    loadMandals();
  }, [selectedDistrict, bookedSlot]);

  // Fetch booked slots when mandal changes
  useEffect(() => {
    if (!selectedMandal || bookedSlot) {
      setMandalBookedSlots(new Set());
      return;
    }
    const loadBookedSlots = async () => {
      setLoadingBooked(true);
      try {
        const data = await api.get(`/subscription/booked?mandalId=${selectedMandal.id}`);
        if (data && data.bookedSlots) {
          const parsed = data.bookedSlots.map(s => String(s).trim());
          setMandalBookedSlots(new Set(parsed));
        }
      } catch (err) {
        console.warn('Failed to load booked slots for mandal:', err.message);
      } finally {
        setLoadingBooked(false);
      }
    };
    loadBookedSlots();
  }, [selectedMandal, bookedSlot]);

  const configuredSlots = selectedMandal
    ? selectedMandal.slots.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const configuredEvents = selectedMandal
    ? selectedMandal.event_names.split(',').map(e => e.trim()).filter(Boolean)
    : [];

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
      // Reset area selections
      setSelectedDistrict(null);
      setSelectedMandal(null);
      setSelectedEvent(null);
      setSelectedSlot(null);
    }
  }, [activeBookingService]);

  const handleStartBooking = (service) => {
    setActiveBookingService(service);
  };

  const handleNextStep = () => {
    if (bookingStep === 1) {
      setBookingStep(3);
    } else if (bookingStep < 5) {
      setBookingStep(bookingStep + 1);
    }
  };

  const handleBackStep = () => {
    if (bookingStep === 3) {
      setBookingStep(1);
    } else if (bookingStep > 1) {
      setBookingStep(bookingStep - 1);
    } else {
      setActiveBookingService(null);
    }
  };

  const handleConfirmBooking = async () => {
    if (!activeBookingService) return;
    try {
      const addressString = `${houseNo}, ${street}, ${landmark} - ${pincode}`;
      const priceToBook = bookedSlot ? 0.00 : parseFloat(activeBookingService.price || 0);
      
      const newId = await addBooking(
        activeBookingService.title || '',
        priceToBook,
        selectedDate,
        selectedTimeSlot ? selectedTimeSlot.split(' ')[0] : 'Morning',
        addressString,
        bookedSlot ? activeSub?.districtId : (selectedDistrict?.id || null),
        bookedSlot ? activeSub?.mandalId : (selectedMandal?.id || null),
        bookedSlot ? activeSub?.slotNumber : null,
        bookedSlot ? activeSub?.eventName : null
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

  // RENDERING COMPONENT B: 5-Step Booking Flow View
  const renderBookingFlow = () => {
    if (!activeBookingService) return null;
    if (bookingSuccess) {
      const priceToBook = bookedSlot ? 0.00 : parseFloat(activeBookingService.price || 0);
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
                <Text style={styles.receiptVal}>₹{priceToBook.toFixed(2)}</Text>
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

          {/* Steps Progress Indicator (4 segments) */}
          <View style={styles.stepsContainer}>
            <View style={styles.stepsTextRow}>
              <Text style={[styles.stepLabelText, bookingStep >= 1 && styles.stepLabelActive]}>Service</Text>
              <Text style={[styles.stepLabelText, bookingStep >= 3 && styles.stepLabelActive]}>Time</Text>
              <Text style={[styles.stepLabelText, bookingStep >= 4 && styles.stepLabelActive]}>Address</Text>
              <Text style={[styles.stepLabelText, bookingStep >= 5 && styles.stepLabelActive]}>Confirm</Text>
            </View>
            
            <View style={styles.barWrapper}>
              <View style={[styles.barSegment, bookingStep >= 1 ? styles.barActive : styles.barInactive]} />
              <View style={[styles.barSegment, bookingStep >= 3 ? styles.barActive : styles.barInactive]} />
              <View style={[styles.barSegment, bookingStep >= 4 ? styles.barActive : styles.barInactive]} />
              <View style={[styles.barSegment, bookingStep >= 5 ? styles.barActive : styles.barInactive]} />
            </View>
          </View>

          {/* STEP 1: CHOOSE SERVICE */}
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
                  <Text style={styles.nextStepBtnText}>Next: Select Date & Time</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFF" style={{ marginLeft: 8 }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: SELECT AREA (District, Mandal, Event, Slot) */}
          {bookingStep === 2 && (
            <View>
              <View style={styles.stepSectionHeader}>
                <View style={styles.stepIconBg}>
                  <Ionicons name="map" size={16} color="#15803D" />
                </View>
                <Text style={styles.stepSectionTitle}>Select Region & Slot</Text>
              </View>

              {bookedSlot ? (
                // Subscriber locked view
                <View style={styles.subscriberAreaCard}>
                  <LinearGradient
                    colors={['#E6F4EA', '#ECFDF5']}
                    style={styles.subGradientCard}
                  >
                    <View style={styles.badgeRow}>
                      <Ionicons name="sparkles" size={14} color="#15803D" style={{ marginRight: 6 }} />
                      <Text style={styles.subActiveBadgeText}>Active Power Care Subscriber</Text>
                    </View>
                    
                    <Text style={styles.subDetailsTitle}>Subscription coverage: </Text>
                    <Text style={styles.subDetailsText}>District: {activeSub?.districtName}</Text>
                    <Text style={styles.subDetailsText}>Mandal: {activeSub?.mandalName}</Text>
                    <Text style={styles.subDetailsText}>Slot: #{activeSub?.slotNumber}</Text>
                    <Text style={styles.subDetailsText}>Registered Event: {activeSub?.eventName}</Text>
                    
                    <View style={styles.divider} />
                    
                    <Text style={styles.subDiscountText}>Service Booking: Free (Power Care Subscriber)</Text>
                  </LinearGradient>
                </View>
              ) : (
                // Non-subscriber picker view
                <View style={styles.pickerContainer}>
                  <Text style={styles.fieldHeading}>Select District</Text>
                  <TouchableOpacity style={styles.dropdownBtn} onPress={() => setDistrictDropdownOpen(true)}>
                    <Text style={[styles.dropdownText, !selectedDistrict && { color: '#9CA3AF' }]}>
                      {selectedDistrict ? selectedDistrict.name : "Select District"}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#6B7280" />
                  </TouchableOpacity>

                  <Text style={styles.fieldHeading}>Select Mandal</Text>
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

                  {/* Event Name and Slot Number selectors removed for standard service bookings */}

                  {/* Mandal booking price display removed */}
                </View>
              )}

              <TouchableOpacity style={styles.nextStepBtn} onPress={handleNextStep}>
                <LinearGradient
                  colors={['#00C853', '#0091EA']}
                  style={styles.nextStepBtnGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.nextStepBtnText}>Next: Select Date & Time</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFF" style={{ marginLeft: 8 }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 3: SELECT DATE & TIME */}
          {bookingStep === 3 && (
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

          {/* STEP 4: SERVICE ADDRESS */}
          {bookingStep === 4 && (
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

          {/* STEP 5: REVIEW & CONFIRM */}
          {bookingStep === 5 && (
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
                  <Text style={styles.reviewServicePrice}>
                    {bookedSlot ? 'Free' : `₹${parseFloat(activeBookingService?.price || 0).toFixed(2)}`}
                  </Text>
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

                {!!(bookedSlot || selectedDistrict?.name) && (
                  <View style={styles.reviewItem}>
                    <Ionicons name="map-outline" size={18} color="#6B7280" style={{ marginRight: 10 }} />
                    <Text style={styles.reviewText}>
                      Region: {bookedSlot ? activeSub?.districtName : selectedDistrict?.name} / {bookedSlot ? activeSub?.mandalName : selectedMandal?.name}
                    </Text>
                  </View>
                )}

                {bookedSlot && (
                  <View style={styles.reviewItem}>
                    <Ionicons name="ticket-outline" size={18} color="#6B7280" style={{ marginRight: 10 }} />
                    <Text style={styles.reviewText}>
                      Event & Slot: {activeSub?.eventName} (Slot #{activeSub?.slotNumber})
                    </Text>
                  </View>
                )}

                <View style={styles.reviewDivider} />

                <View style={styles.paymentMethod}>
                  <Ionicons 
                    name={bookedSlot ? "ribbon-outline" : "card-outline"} 
                    size={18} 
                    color="#00B894" 
                    style={{ marginRight: 10 }} 
                  />
                  <Text style={[styles.reviewText, { color: '#00B894', fontWeight: '700' }]}>
                    {bookedSlot ? 'Paid via Power Care Subscription' : 'Local Charge (Paid on completion)'}
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
                    setSelectedSlot(null);
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
                    setSelectedSlot(null);
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
                    setSelectedSlot(null);
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

      {/* Slot Dropdown Modal Overlay */}
      {slotDropdownOpen && (
        <View style={styles.dropdownModalBg}>
          <TouchableOpacity style={styles.dropdownModalDismiss} onPress={() => setSlotDropdownOpen(false)} />
          <View style={styles.dropdownListContainer}>
            <View style={styles.dropdownListHeader}>
              <Text style={styles.dropdownListTitle}>Select Slot Number</Text>
              <TouchableOpacity onPress={() => setSlotDropdownOpen(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.dropdownListScroll}>
              {configuredSlots.map(num => {
                const isBooked = mandalBookedSlots.has(String(num).trim());
                return (
                  <TouchableOpacity 
                    key={num} 
                    disabled={isBooked}
                    style={[styles.dropdownListItem, isBooked && { opacity: 0.5 }]} 
                    onPress={() => {
                      setSelectedSlot(num);
                      setSlotDropdownOpen(false);
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={[styles.dropdownListItemText, isBooked && { color: '#EF4444' }]}>
                        Slot #{num} {isBooked ? '(Booked)' : ''}
                      </Text>
                      {isBooked && <Ionicons name="ban" size={14} color="#EF4444" style={{ marginLeft: 8 }} />}
                    </View>
                    {selectedSlot === num && <Ionicons name="checkmark" size={18} color="#00C853" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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
  // Custom picker styles
  subscriberAreaCard: {
    marginBottom: 16,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  subGradientCard: {
    padding: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  subActiveBadgeText: {
    color: '#15803D',
    fontSize: 13,
    fontWeight: '700',
  },
  subDetailsTitle: {
    fontSize: 14,
    fontWeight: '750',
    color: '#065F46',
    marginBottom: 6,
  },
  subDetailsText: {
    fontSize: 13,
    color: '#047857',
    fontWeight: '500',
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(4, 120, 87, 0.1)',
    marginVertical: 12,
  },
  subDiscountText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#15803D',
  },
  pickerContainer: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
  mandalPriceTag: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  priceTagLabel: {
    fontSize: 13,
    color: '#065F46',
    fontWeight: '650',
  },
  priceTagVal: {
    fontSize: 15,
    color: '#047857',
    fontWeight: '800',
  },
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