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
  TextInput,
  Image,
  Alert,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import Header from '../components/Header';
import * as ImagePicker from 'expo-image-picker';
import nextgenQr from '../assets/nextgenQr.jpeg';

const { width } = Dimensions.get('window');
const SLOT_SIZE = (width - 104) / 5;

export default function SlotsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { bookedSlot, subscriptions, bookSlot, cancelSlot, refreshData } = useApp();
  
  const [districts, setDistricts] = useState([]);
  const [mandals, setMandals] = useState([]);
  const [events, setEvents] = useState([]);
  const [eventBookedSlots, setEventBookedSlots] = useState(new Set());
  
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedMandal, setSelectedMandal] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedLocalSlot, setSelectedLocalSlot] = useState(null);

  const [districtDropdownOpen, setDistrictDropdownOpen] = useState(false);
  const [mandalDropdownOpen, setMandalDropdownOpen] = useState(false);
  const [eventDropdownOpen, setEventDropdownOpen] = useState(false);
  const [slotSearchQuery, setSlotSearchQuery] = useState('');

  // Payment States
  const [paymentMode, setPaymentMode] = useState('offline'); // offline or online
  const [transactionId, setTransactionId] = useState('');
  const [screenshotUri, setScreenshotUri] = useState(null);
  const [screenshotWebFile, setScreenshotWebFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

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

  // Fetch events when mandal changes
  useEffect(() => {
    if (!selectedMandal) {
      setEvents([]);
      return;
    }
    const fetchEvents = async () => {
      try {
        const data = await api.get(`/subscription/events?mandalId=${selectedMandal.id}`);
        setEvents(data || []);
      } catch (err) {
        console.warn('Failed to load events:', err.message);
      }
    };
    fetchEvents();
  }, [selectedMandal]);

  // Fetch booked slots for the selected event
  const fetchBookedSlots = async () => {
    if (!selectedEvent) {
      setEventBookedSlots(new Set());
      return;
    }
    setLoadingBooked(true);
    try {
      const data = await api.get(`/subscription/booked?eventId=${selectedEvent.id}`);
      if (data && data.bookedSlots) {
        const parsed = data.bookedSlots.map(s => String(s).trim());
        setEventBookedSlots(new Set(parsed));
      }
    } catch (err) {
      console.warn('Failed to load booked slots:', err.message);
    } finally {
      setLoadingBooked(false);
    }
  };

  useEffect(() => {
    fetchBookedSlots();
  }, [selectedEvent]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDistricts();
    await fetchBookedSlots();
    if (refreshData) {
      await refreshData();
    }
    setRefreshing(false);
  };

  const getEventSlots = () => {
    if (!selectedEvent || !selectedEvent.slots) return [];
    const parts = selectedEvent.slots.split(',');
    const expanded = [];
    for (let part of parts) {
      part = part.trim();
      if (part.includes('-')) {
        const rangeParts = part.split('-');
        if (rangeParts.length === 2) {
          const start = parseInt(rangeParts[0].trim(), 10);
          const end = parseInt(rangeParts[1].trim(), 10);
          if (!isNaN(start) && !isNaN(end) && start <= end) {
            for (let i = start; i <= end; i++) expanded.push(i);
            continue;
          }
        }
      }
      const num = parseInt(part, 10);
      if (!isNaN(num)) expanded.push(num);
    }
    return expanded;
  };

  const isSlotBooked = (slotNum) => {
    return eventBookedSlots.has(String(slotNum).trim());
  };

  const handleSelectSlot = (slotNum) => {
    if (isSlotBooked(slotNum)) return;
    setSelectedLocalSlot(slotNum === selectedLocalSlot ? null : slotNum);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.5,
    });

    if (!result.canceled) {
      setScreenshotUri(result.assets[0].uri);
      if (Platform.OS === 'web' && result.assets[0].file) {
        setScreenshotWebFile(result.assets[0].file);
      }
    }
  };

  const handleConfirmBooking = async () => {
    if (paymentMode === 'online') {
      if (!transactionId.trim()) {
        Alert.alert('Error', 'Please enter UPI Transaction ID.');
        return;
      }
      if (!screenshotUri) {
        Alert.alert('Error', 'Please upload a screenshot of your payment.');
        return;
      }
    }

    let uploadedUrl = null;

    if (paymentMode === 'online' && screenshotUri) {
      setUploadingImage(true);
      try {
        const formData = new FormData();
        
        if (Platform.OS === 'web' && screenshotWebFile) {
          formData.append('image', screenshotWebFile);
        } else if (Platform.OS === 'web' && screenshotUri.startsWith('data:')) {
          // Convert base64 to blob
          const response = await fetch(screenshotUri);
          const blob = await response.blob();
          formData.append('image', blob, 'upload.jpg');
        } else {
          let filename = screenshotUri.split('/').pop();
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : `image/jpeg`;
          if (!match) filename += '.jpg';
          formData.append('image', { uri: screenshotUri, name: filename, type });
        }

        const uploadRes = await api.upload('/upload', formData);
        if (uploadRes && uploadRes.url) {
          uploadedUrl = uploadRes.url;
        } else {
          throw new Error('Image upload failed to return URL');
        }
      } catch (uploadErr) {
        setUploadingImage(false);
        Alert.alert('Error', 'Failed to upload screenshot. Please try again.');
        return;
      }
      setUploadingImage(false);
    }

    if (selectedDistrict && selectedMandal && selectedLocalSlot && selectedEvent) {
      const result = await bookSlot(
        selectedDistrict.id,
        selectedMandal.id,
        selectedEvent.id,
        selectedLocalSlot,
        paymentMode,
        transactionId,
        uploadedUrl
      );
      if (result && result.success) {
        setSelectedLocalSlot(null);
        Alert.alert('Success', 'Subscription request submitted successfully!');
      } else {
        Alert.alert('Error', result?.message || 'Failed to purchase subscription');
      }
    }
  };

  const configuredSlots = getEventSlots();
  const filteredSlots = configuredSlots.filter(slot => slot.toString().includes(slotSearchQuery.trim()));

  // Rendering Case A: No Active Subscription (District/Mandal/Event selection and slots grid)
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

      {bookingDetails?.status === 'Rejected' && (
        <View style={[styles.successGradientCard, { backgroundColor: '#FEF2F2', borderColor: '#FECACA', borderWidth: 1, marginBottom: 16 }]}>
          <View style={[styles.checkCircle, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="close-circle" size={40} color="#DC2626" />
          </View>
          <Text style={[styles.successTitle, { color: '#B91C1C' }]}>Request Rejected</Text>
          <Text style={[styles.successSubtitle, { color: '#991B1B' }]}>Your previous subscription request was rejected. Please select a new slot.</Text>
        </View>
      )}

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
        <Text style={styles.sectionHeading}>Configure Location & Event</Text>

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

        {/* Event Dropdown */}
        <TouchableOpacity 
          style={[styles.dropdownBtn, !selectedMandal && styles.dropdownDisabled]} 
          onPress={() => selectedMandal && setEventDropdownOpen(true)}
          disabled={!selectedMandal}
        >
          <Text style={[styles.dropdownText, (!selectedEvent || !selectedMandal) && { color: '#9CA3AF' }]}>
            {selectedEvent ? selectedEvent.event_name : "Select Event"}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Legend Indicator Section */}
      {selectedEvent && (
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
      {selectedEvent && (
        <View style={styles.gridCard}>
          <View style={styles.gridHeader}>
            <Text style={styles.gridHeading}>Available Slots</Text>
            {loadingBooked ? (
              <ActivityIndicator size="small" color="#0984E3" />
            ) : (
              <Text style={styles.gridActionText}>Choose 1 slot</Text>
            )}
          </View>

          {configuredSlots.length === 0 ? (
            <View style={styles.noSlotsContainer}>
              <Text style={styles.noSlotsText}>No slots configured for this event.</Text>
            </View>
          ) : (
            <View>
              <TextInput
                style={{
                  backgroundColor: '#F9FAFB',
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  marginBottom: 16,
                  fontSize: 14,
                  color: '#111827'
                }}
                placeholder="Search slot number..."
                placeholderTextColor="#9CA3AF"
                value={slotSearchQuery}
                onChangeText={setSlotSearchQuery}
                keyboardType="numeric"
              />
              {filteredSlots.length === 0 ? (
                <View style={styles.noSlotsContainer}>
                  <Text style={styles.noSlotsText}>No slots found matching "{slotSearchQuery}"</Text>
                </View>
              ) : (
                <View style={styles.gridBody}>
                  {filteredSlots.map((num) => {
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
        </View>
      )}
    </ScrollView>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {renderSlotGrid()}

      {/* District Dropdown */}
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

      {/* Mandal Dropdown */}
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

      {/* Event Dropdown */}
      {eventDropdownOpen && (
        <View style={styles.dropdownModalBg}>
          <TouchableOpacity style={styles.dropdownModalDismiss} onPress={() => setEventDropdownOpen(false)} />
          <View style={styles.dropdownListContainer}>
            <View style={styles.dropdownListHeader}>
              <Text style={styles.dropdownListTitle}>Select Event</Text>
              <TouchableOpacity onPress={() => setEventDropdownOpen(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.dropdownListScroll}>
              {events.map(e => (
                <TouchableOpacity 
                  key={e.id} 
                  style={styles.dropdownListItem} 
                  onPress={() => {
                    setSelectedEvent(e);
                    setEventDropdownOpen(false);
                    setSelectedLocalSlot(null);
                  }}
                >
                  <Text style={styles.dropdownListItemText}>{e.event_name}</Text>
                  {selectedEvent?.id === e.id && <Ionicons name="checkmark" size={18} color="#00C853" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Bottom Sheet for Payment */}
      {selectedLocalSlot && selectedEvent && (
        <View style={styles.modalBackdrop}>
          <TouchableOpacity 
            style={styles.modalDismissArea} 
            activeOpacity={1} 
            onPress={() => setSelectedLocalSlot(null)}
          />
          <View style={styles.bottomSheet}>
            <ScrollView style={{maxHeight: Dimensions.get('window').height * 0.7}}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetLabel}>Selected slot for {selectedEvent.event_name}</Text>
                <Text style={styles.sheetSlotNumber}>#{selectedLocalSlot}</Text>
              </View>
              <TouchableOpacity 
                style={styles.sheetCloseBtn} 
                onPress={() => setSelectedLocalSlot(null)}
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
                <Text style={styles.subInfoPrice}>₹{parseInt(selectedEvent.price)}/year</Text>
              </View>
              <View style={styles.unlimitedBadge}>
                <Text style={styles.unlimitedText}>Priority Care</Text>
              </View>
            </LinearGradient>

            {/* Payment Mode Selection */}
            <Text style={styles.paymentHeading}>Payment Method</Text>
            <View style={styles.paymentRow}>
              <TouchableOpacity 
                style={[styles.paymentBtn, paymentMode === 'offline' && styles.paymentBtnActive]}
                onPress={() => setPaymentMode('offline')}
              >
                <Ionicons name="cash-outline" size={20} color={paymentMode === 'offline' ? '#00B894' : '#6B7280'} />
                <Text style={[styles.paymentBtnText, paymentMode === 'offline' && styles.paymentBtnTextActive]}>Offline/Cash</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.paymentBtn, paymentMode === 'online' && styles.paymentBtnActive]}
                onPress={() => setPaymentMode('online')}
              >
                <Ionicons name="card-outline" size={20} color={paymentMode === 'online' ? '#00B894' : '#6B7280'} />
                <Text style={[styles.paymentBtnText, paymentMode === 'online' && styles.paymentBtnTextActive]}>Online (UPI)</Text>
              </TouchableOpacity>
            </View>

            {paymentMode === 'online' && (
              <View style={styles.onlinePaymentContainer}>
                <View style={styles.qrPlaceholder}>
                  <Image source={nextgenQr} style={{ width: 160, height: 160, borderRadius: 8, marginBottom: 12 }} resizeMode="contain" />
                  <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Pay to UPI ID:</Text>
                  <Text style={styles.qrText}>Vyapar.175693314872@hdfcbank</Text>
                </View>
                
                <TextInput
                  style={styles.textInput}
                  placeholder="UPI Transaction ID *"
                  value={transactionId}
                  onChangeText={setTransactionId}
                  placeholderTextColor="#9CA3AF"
                />

                <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                  <Ionicons name="image-outline" size={20} color="#374151" />
                  <Text style={styles.uploadBtnText}>Upload Screenshot</Text>
                </TouchableOpacity>

                {screenshotUri && (
                  <Image source={{ uri: screenshotUri }} style={styles.screenshotPreview} />
                )}
              </View>
            )}

            <TouchableOpacity 
              style={styles.sheetConfirmBtnWrapper}
              onPress={handleConfirmBooking}
              disabled={uploadingImage}
            >
              <LinearGradient
                colors={['#00C853', '#0091EA']}
                style={styles.sheetConfirmBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {uploadingImage ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.sheetConfirmBtnText}>Submit Request</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
            <View style={{height: 20}} />
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
  dropdownModalBg: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  dropdownModalDismiss: {
    flex: 1,
  },
  dropdownListContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
    paddingBottom: 20,
  },
  dropdownListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownListTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  dropdownListScroll: {
    paddingHorizontal: 10,
  },
  dropdownListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  dropdownListItemText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(31, 41, 55, 0.6)',
    justifyContent: 'flex-end',
    zIndex: 50,
  },
  modalDismissArea: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sheetLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  sheetSlotNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    marginVertical: 4,
  },
  sheetCloseBtn: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
  },
  subInfoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  subInfoLabel: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '600',
    marginBottom: 4,
  },
  subInfoPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  unlimitedBadge: {
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  unlimitedText: {
    color: '#00C853',
    fontSize: 12,
    fontWeight: '800',
  },
  paymentHeading: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  paymentRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  paymentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    gap: 8,
  },
  paymentBtnActive: {
    borderColor: '#00B894',
    backgroundColor: '#F0FDF4',
  },
  paymentBtnText: {
    fontWeight: '600',
    color: '#6B7280',
  },
  paymentBtnTextActive: {
    color: '#00B894',
  },
  onlinePaymentContainer: {
    marginBottom: 20,
  },
  qrPlaceholder: {
    alignSelf: 'center',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    width: 200,
  },
  qrText: {
    fontWeight: '600',
    color: '#111827',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  uploadBtnText: {
    fontWeight: '600',
    color: '#374151',
  },
  screenshotPreview: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    marginBottom: 12,
  },
  sheetConfirmBtnWrapper: {
    shadowColor: '#0091EA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sheetConfirmBtn: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  sheetConfirmBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
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
    textAlign: 'center',
    marginBottom: 20,
  },
  subscriptionActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 100,
  },
  subscriptionActiveText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '750',
  },
  slotDetailCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    marginTop: -20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  slotDetailHeader: {
    fontSize: 12,
    fontWeight: '750',
    color: '#6B7280',
    letterSpacing: 1,
    marginBottom: 8,
  },
  slotDetailNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 4,
  },
  slotDetailFooter: {
    fontSize: 13,
    color: '#00C853',
    fontWeight: '600',
  },
  infoList: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoTextWrapper: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '700',
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 16,
    marginLeft: 56,
  },
  cancelButton: {
    marginTop: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '700',
  },
});
