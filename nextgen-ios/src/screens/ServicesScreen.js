import React, { useState, useEffect, useCallback } from 'react';
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
  Image,
} from 'react-native';
import WebView from '../components/MapWebView';
import * as Location from 'expo-location';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

import Header from '../components/Header';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import { getServiceIllustration } from '../utils/illustrations';

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

  // Leaflet HTML template string
  const leafletHTML = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
      body, html, #map { margin: 0; padding: 0; height: 100%; width: 100%; background: #312C51; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      var map, marker;
      var currentLat = 17.3850, currentLng = 78.4867;
      document.addEventListener("message", function(e) { handleMsg(e.data); });
      window.addEventListener("message", function(e) { handleMsg(e.data); });
      function handleMsg(dataStr) {
        try {
          var data = JSON.parse(dataStr);
          if (data.type === 'center') { map.setView([data.lat, data.lng], 15); marker.setLatLng([data.lat, data.lng]); }
        } catch(e) {}
      }
      function sendCoords(lat, lng) {
        if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'coords', lat: lat, lng: lng }));
      }
      function initMap() {
        map = L.map('map', { zoomControl: false }).setView([currentLat, currentLng], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OSM' }).addTo(map);
        marker = L.marker([currentLat, currentLng], { draggable: true }).addTo(map);
        marker.on('dragend', function() { var p = marker.getLatLng(); sendCoords(p.lat.toFixed(6), p.lng.toFixed(6)); });
        map.on('click', function(e) { marker.setLatLng(e.latlng); sendCoords(e.latlng.lat.toFixed(6), e.latlng.lng.toFixed(6)); });
        sendCoords(currentLat.toFixed(6), currentLng.toFixed(6));
      }
      initMap();
    </script>
  </body>
  </html>
  `;

  // Booking flow states
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  
  // Address form states
  const [houseNo, setHouseNo] = useState('Flat 405, Block B');
  const [street, setStreet] = useState('Green Glen Layout');
  const [landmark, setLandmark] = useState('Near Central Mall');
  const [pincode, setPincode] = useState('560103');

  // GPS Coordinates & Map states
  const [latitude, setLatitude] = useState('17.3850');
  const [longitude, setLongitude] = useState('78.4867');
  const [mapSearchText, setMapSearchText] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const webViewRef = React.useRef(null);

  const handleUseCurrentLocation = async () => {
    try {
      setIsLocating(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { alert('Location permission denied'); setIsLocating(false); return; }
      let loc = await Location.getCurrentPositionAsync({});
      const latVal = loc.coords.latitude.toFixed(6);
      const lngVal = loc.coords.longitude.toFixed(6);
      setLatitude(latVal); setLongitude(lngVal);
      if (webViewRef.current) webViewRef.current.postMessage(JSON.stringify({ type: 'center', lat: loc.coords.latitude, lng: loc.coords.longitude }));
      reverseGeocode(loc.coords.latitude, loc.coords.longitude);
    } catch (err) { alert('Location error: ' + err.message); }
    finally { setIsLocating(false); }
  };

  const handleSearchOnMap = async () => {
    if (!mapSearchText.trim()) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapSearchText)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const numLat = parseFloat(lat); const numLng = parseFloat(lon);
        setLatitude(numLat.toFixed(6)); setLongitude(numLng.toFixed(6));
        if (webViewRef.current) webViewRef.current.postMessage(JSON.stringify({ type: 'center', lat: numLat, lng: numLng }));
        if (display_name) { const parts = display_name.split(','); if (parts[0]) setStreet(parts[0].trim()); if (parts[1]) setLandmark(parts[1].trim()); }
      } else { alert('No locations found.'); }
    } catch (err) { console.warn('Search failed:', err.message); }
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data && data.address) {
        const { road, suburb, city, county, postcode } = data.address;
        if (road) setStreet(road);
        if (suburb || city || county) setLandmark(suburb || city || county);
        if (postcode) setPincode(postcode);
      }
    } catch (e) { console.warn('Reverse geocode failed:', e); }
  };

  const onMapMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'coords') { setLatitude(data.lat); setLongitude(data.lng); }
    } catch (err) {}
  };

  // Success view state
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState('');

  // Reset form on screen blur
  useFocusEffect(
    useCallback(() => {
      return () => {
        setBookingStep(1);
        setActiveBookingService(null);
        setSelectedDate('');
        setSelectedTimeSlot('');
        setBookingSuccess(false);
        setCreatedBookingId('');
        setDistrictDropdownOpen(false);
        setMandalDropdownOpen(false);
        setEventDropdownOpen(false);
        setSelectedSlot(null);
        setLatitude('17.3850');
        setLongitude('78.4867');
        setMapSearchText('');
      };
    }, [setActiveBookingService])
  );

  // District/Mandal/Event/Slot states for booking
  const { bookedSlot, subscriptions } = useApp();
  const activeSubs = subscriptions?.filter(s => s.status === 'Active') || [];
  const activeSub = activeSubs[0]; // fallback for legacy uses


  const isServiceIncluded = (serviceTitle) => {
    if (!serviceTitle || activeSubs.length === 0) return false;
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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setBookingStep(bookingStep - 1);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setActiveBookingService(null);
    }
  };

  const handleConfirmBooking = async () => {
    if (!activeBookingService) return;
    try {
      const addressString = `${houseNo}, ${street}, ${landmark} - ${pincode}`;
      const isIncluded = isServiceIncluded(activeBookingService?.title);
      const priceToBook = (bookedSlot && isIncluded) ? 0.00 : parseFloat(activeBookingService.price || 0);
      
      const newId = await addBooking(
        activeBookingService.title || '',
        priceToBook,
        selectedDate,
        selectedTimeSlot ? selectedTimeSlot.split(' ')[0] : 'Morning',
        addressString,
        bookedSlot ? activeSub?.districtId : (selectedDistrict?.id || null),
        bookedSlot ? activeSub?.mandalId : (selectedMandal?.id || null),
        bookedSlot ? activeSub?.slotNumber : null,
        bookedSlot ? activeSub?.eventName : null,
        latitude,
        longitude
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCreatedBookingId(newId);
      setBookingSuccess(true);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
    <View style={styles.container}>
      <Header />
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: insets.top + 70 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#F0C38E" />
        }
      >
        <Text style={styles.heading}>Services</Text>
      <Text style={styles.subHeading}>Transparent pricing, expert technicians</Text>

      {/* Search Input Bar */}
      <View style={styles.searchBarContainer}>
        <Ionicons name="search-outline" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search electrical services..."
          placeholderTextColor="#A5A1B8"
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
        <View style={styles.servicesGridContainer}>
          {filteredServices.map(item => {
            const illustration = getServiceIllustration(item.title, item.icon);
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.gridCardItem}
                onPress={() => handleStartBooking(item)}
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
      )}
      </ScrollView>
    </View>
  );

  // RENDERING COMPONENT B: 5-Step Booking Flow View
  const renderBookingFlow = () => {
    if (!activeBookingService) return null;
    if (bookingSuccess) {
      const isIncluded = isServiceIncluded(activeBookingService?.title);
      const priceToBook = (bookedSlot && isIncluded) ? 0.00 : parseFloat(activeBookingService.price || 0);
      return (
        <View style={styles.successContainer}>
          <View style={styles.successCard}>
            <View style={styles.successCheckBg}>
              <Ionicons name="checkmark-circle" size={80} color="#10B981" />
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
              <View
                style={[styles.doneBtnGrad, { backgroundColor: '#F0C38E' }]}
              >
                <Text style={styles.doneBtnText}>View Bookings</Text>
              </View>
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
                      {isServiceIncluded(item.title) ? '₹0 (Free)' : `₹${item.price}`}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity style={styles.nextStepBtn} onPress={handleNextStep}>
                <View
                  style={[styles.nextStepBtnGrad, { backgroundColor: '#F0C38E' }]}
                >
                  <Text style={styles.nextStepBtnText}>Next: Select Date & Time</Text>
                  <Ionicons name="arrow-forward" size={16} color="#312C51" style={{ marginLeft: 8 }} />
                </View>
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
                  <View
                    style={[styles.subGradientCard, { backgroundColor: '#25213E' }]}
                  >
                    <View style={styles.badgeRow}>
                      <Ionicons name="sparkles" size={14} color="#F0C38E" style={{ marginRight: 6 }} />
                      <Text style={[styles.subActiveBadgeText, { color: '#F0C38E' }]}>Active Go Fixit Subscriber</Text>
                    </View>
                    
                    <Text style={[styles.subDetailsTitle, { color: '#F0C38E' }]}>Subscription coverage: </Text>
                    <Text style={[styles.subDetailsText, { color: '#005BB5' }]}>District: {activeSub?.districtName}</Text>
                    <Text style={[styles.subDetailsText, { color: '#005BB5' }]}>Mandal: {activeSub?.mandalName}</Text>
                    <Text style={[styles.subDetailsText, { color: '#005BB5' }]}>Slot: #{activeSub?.slotNumber}</Text>
                    <Text style={[styles.subDetailsText, { color: '#005BB5' }]}>Registered Event: {activeSub?.eventName}</Text>
                    
                    <View style={styles.divider} />
                    
                    <Text style={[styles.subDiscountText, { color: '#F0C38E' }]}>
                      {activeBookingService && isServiceIncluded(activeBookingService.title) 
                        ? 'Service Booking: Free (Go Fixit Subscriber)' 
                        : 'Service Booking: Paid (Not included in subscription)'}
                    </Text>
                  </View>
                </View>
              ) : (
                // Non-subscriber picker view
                <View style={styles.pickerContainer}>
                  <Text style={styles.fieldHeading}>Select District</Text>
                  <TouchableOpacity style={styles.dropdownBtn} onPress={() => setDistrictDropdownOpen(true)}>
                    <Text style={[styles.dropdownText, !selectedDistrict && { color: '#A5A1B8' }]}>
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
                    <Text style={[styles.dropdownText, (!selectedMandal || !selectedDistrict) && { color: '#A5A1B8' }]}>
                      {selectedMandal ? selectedMandal.name : "Select Mandal"}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#6B7280" />
                  </TouchableOpacity>

                  {/* Event Name and Slot Number selectors removed for standard service bookings */}

                  {/* Mandal booking price display removed */}
                </View>
              )}

              <TouchableOpacity style={styles.nextStepBtn} onPress={handleNextStep}>
                <View
                  style={[styles.nextStepBtnGrad, { backgroundColor: '#F0C38E' }]}
                >
                  <Text style={styles.nextStepBtnText}>Next: Select Date & Time</Text>
                  <Ionicons name="arrow-forward" size={16} color="#312C51" style={{ marginLeft: 8 }} />
                </View>
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
                      color={isSelected ? '#F0C38E' : '#6B7280'} 
                      style={{ marginRight: 12 }}
                    />
                    <Text style={[styles.timeSlotText, isSelected && styles.timeSlotTextActive]}>{slot}</Text>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity style={styles.nextStepBtn} onPress={handleNextStep}>
                <View
                  style={[styles.nextStepBtnGrad, { backgroundColor: '#F0C38E' }]}
                >
                  <Text style={styles.nextStepBtnText}>Next: Enter Address</Text>
                  <Ionicons name="arrow-forward" size={16} color="#312C51" style={{ marginLeft: 8 }} />
                </View>
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

              {/* GPS Map Section */}
              <View style={{ marginTop: 16, paddingHorizontal: 4 }}>
                <Text style={[styles.inputHeading, { marginBottom: 8, fontSize: 14, color: '#F0C38E' }]}>
                  📍 Pin Your Location on Map
                </Text>

                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                  <TextInput
                    style={[styles.addressInput, { flex: 1, marginBottom: 0 }]}
                    value={mapSearchText}
                    onChangeText={setMapSearchText}
                    placeholder="Search area or city..."
                    placeholderTextColor="#6B7280"
                    returnKeyType="search"
                    onSubmitEditing={handleSearchOnMap}
                  />
                  <TouchableOpacity
                    onPress={handleSearchOnMap}
                    style={{ backgroundColor: '#F0C38E', paddingHorizontal: 12, borderRadius: 8, justifyContent: 'center' }}
                  >
                    <Ionicons name="search" size={18} color="#312C51" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={handleUseCurrentLocation}
                  disabled={isLocating}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1E1A2E', borderWidth: 1, borderColor: '#F1AA9B', borderRadius: 8, padding: 10, marginBottom: 10 }}
                >
                  <Ionicons name={isLocating ? 'sync' : 'locate'} size={16} color="#F1AA9B" style={{ marginRight: 6 }} />
                  <Text style={{ color: '#F1AA9B', fontWeight: '700', fontSize: 13 }}>
                    {isLocating ? 'Getting Location...' : 'Use My Current Location'}
                  </Text>
                </TouchableOpacity>

                <WebView
                  ref={webViewRef}
                  source={{ html: leafletHTML }}
                  style={{ height: 240, width: '100%', borderRadius: 12, overflow: 'hidden' }}
                  onMessage={onMapMessage}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  originWhitelist={['*']}
                  scrollEnabled={false}
                />

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                  <View style={{ flex: 1, backgroundColor: '#1E1A2E', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#312C51' }}>
                    <Text style={{ color: '#6B7280', fontSize: 10, marginBottom: 2 }}>Latitude</Text>
                    <Text style={{ color: '#F0C38E', fontSize: 12, fontWeight: '700' }}>{latitude}</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: '#1E1A2E', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#312C51' }}>
                    <Text style={{ color: '#6B7280', fontSize: 10, marginBottom: 2 }}>Longitude</Text>
                    <Text style={{ color: '#F0C38E', fontSize: 12, fontWeight: '700' }}>{longitude}</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity style={styles.nextStepBtn} onPress={handleNextStep}>
                <View
                  style={[styles.nextStepBtnGrad, { backgroundColor: '#F0C38E' }]}
                >
                  <Text style={styles.nextStepBtnText}>Next: Review & Confirm</Text>
                  <Ionicons name="arrow-forward" size={16} color="#312C51" style={{ marginLeft: 8 }} />
                </View>
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
                    {isServiceIncluded(activeBookingService?.title) ? '₹0 (Free)' : `₹${parseFloat(activeBookingService?.price || 0).toFixed(2)}`}
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
                    color="#F0C38E" 
                    style={{ marginRight: 10 }} 
                  />
                  <Text style={[styles.reviewText, { color: '#F0C38E', fontWeight: '700' }]}>
                    {isServiceIncluded(activeBookingService?.title) ? 'Paid via Go Fixit Subscription' : 'Local Charge (Paid on completion)'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={styles.nextStepBtn} onPress={handleConfirmBooking}>
                <View
                  style={[styles.nextStepBtnGrad, { backgroundColor: '#F0C38E' }]}
                >
                  <Text style={styles.nextStepBtnText}>Confirm & Book Service</Text>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" style={{ marginLeft: 8 }} />
                </View>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    );
  };

  return (
    <View style={styles.container}>
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
                  {selectedDistrict?.id === d.id && <Ionicons name="checkmark" size={18} color="#10B981" />}
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
                  {selectedMandal?.id === m.id && <Ionicons name="checkmark" size={18} color="#10B981" />}
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
                  {selectedEvent === e && <Ionicons name="checkmark" size={18} color="#10B981" />}
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
                    {selectedSlot === num && <Ionicons name="checkmark" size={18} color="#10B981" />}
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
    backgroundColor: '#F8FAFC',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  heading: {
    fontSize: 28,
    fontWeight: '850',
    color: '#FFFFFF',
    marginTop: 10,
  },
  subHeading: {
    fontSize: 14,
    color: '#A5A1B8',
    fontWeight: '500',
    marginTop: 4,
    marginBottom: 20,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#48426D',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3D3762',
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
    color: '#FFFFFF',
    fontWeight: '500',
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
    width: '85%',
    height: '85%',
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
  serviceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#48426D',
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#3D3762',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
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
    color: '#FFFFFF',
  },
  serviceSubtitle: {
    fontSize: 13,
    color: '#A5A1B8',
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
    backgroundColor: '#F0C38E',
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
    color: '#A5A1B8',
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
    backgroundColor: '#48426D',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3D3762',
    marginRight: 16,
  },
  flowTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
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
    color: '#A5A1B8',
  },
  stepLabelActive: {
    color: '#F0C38E',
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
    backgroundColor: '#F0C38E',
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
    color: '#FFFFFF',
  },

  // Step 1 styling
  serviceSelectCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#48426D',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3D3762',
  },
  serviceSelectCardActive: {
    borderColor: '#F0C38E',
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
    color: '#FFFFFF',
  },
  serviceSelectTitleActive: {
    color: '#065F46',
  },
  serviceSelectSubtitle: {
    fontSize: 12,
    color: '#A5A1B8',
    marginTop: 2,
  },
  serviceSelectPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  serviceSelectPriceActive: {
    color: '#047857',
  },
  nextStepBtn: {
    marginTop: 24,
    shadowColor: '#F1AA9B',
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
    backgroundColor: '#48426D',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#3D3762',
  },
  datePillActive: {
    backgroundColor: '#F0C38E',
    borderColor: '#F0C38E',
  },
  datePillText: {
    fontSize: 11,
    color: '#A5A1B8',
    fontWeight: '600',
  },
  datePillTextActive: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  datePillDayNum: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginVertical: 4,
  },
  datePillDayNumActive: {
    color: '#FFF',
  },
  timeSlotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#48426D',
    borderWidth: 1,
    borderColor: '#3D3762',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  timeSlotCardActive: {
    borderColor: '#F0C38E',
    backgroundColor: '#ECFDF5',
  },
  timeSlotText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  timeSlotTextActive: {
    color: '#065F46',
    fontWeight: '700',
  },

  // Step 3 Address styling
  addressForm: {
    backgroundColor: '#48426D',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#3D3762',
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
    borderColor: '#3D3762',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#FFFFFF',
    backgroundColor: '#25213E',
  },

  // Step 4 Confirm styling
  reviewCard: {
    backgroundColor: '#48426D',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#3D3762',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewServiceTitle: {
    fontSize: 18,
    fontWeight: '850',
    color: '#FFFFFF',
  },
  reviewServicePrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#15803D',
  },
  reviewSubtitle: {
    fontSize: 13,
    color: '#A5A1B8',
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
    backgroundColor: '#48426D',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3D3762',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
  },
  successCheckBg: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  successMsg: {
    fontSize: 14,
    color: '#A5A1B8',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  receiptContainer: {
    backgroundColor: '#25213E',
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
    color: '#A5A1B8',
    fontWeight: '500',
  },
  receiptVal: {
    fontSize: 13,
    color: '#FFFFFF',
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
    backgroundColor: '#48426D',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#3D3762',
  },
  dropdownBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#48426D',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3D3762',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  dropdownDisabled: {
    backgroundColor: '#25213E',
    borderColor: '#F3F4F6',
    opacity: 0.6,
  },
  dropdownText: {
    color: '#FFFFFF',
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
    backgroundColor: '#48426D',
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
    color: '#FFFFFF',
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
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
