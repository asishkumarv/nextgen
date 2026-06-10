import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Linking,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import Header from '../components/Header';
import Toast from '../components/Toast';
import { api } from '../utils/api';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, bookedSlot, subscriptions, bookings, updateProfile, logout, refreshData, changePassword, cancelBooking } = useApp();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (refreshData) {
      await refreshData();
    }
    setRefreshing(false);
  };
  const [modalVisible, setModalVisible] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [expandedBookingId, setExpandedBookingId] = useState(null);

  // See all / cancel states
  const [showAllBookings, setShowAllBookings] = useState(false);
  const [cancelLoadingId, setCancelLoadingId] = useState(null);

  // Change password states
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Toast notifications
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState('success');

  const showToast = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setToastVisible(true);
  };

  // Contact Form States
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [contactData, setContactData] = useState({
    name: user?.name || '',
    email: '',
    phone: user?.phone || '',
    subject: 'support',
    message: ''
  });
  const [contactLoading, setContactLoading] = useState(false);
  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false);

  const subjectOptions = [
    { label: 'Technical Support', value: 'support' },
    { label: 'Billing & Subscriptions', value: 'billing' },
    { label: 'Vendor Inquiries', value: 'vendor' },
    { label: 'Other Inquiry', value: 'other' }
  ];

  const handleContactSubmit = async () => {
    if (!contactData.name.trim() || !contactData.email.trim() || !contactData.message.trim()) {
      showToast('Please fill all required fields.', 'warning');
      return;
    }
    
    setContactLoading(true);
    try {
      await api.post('/contact', contactData);
      showToast('Message sent successfully!', 'success');
      setContactModalVisible(false);
      setContactData({
        name: user?.name || '',
        email: '',
        phone: user?.phone || '',
        subject: 'support',
        message: ''
      });
    } catch (error) {
      showToast(error.message || 'Failed to send message.', 'error');
    } finally {
      setContactLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    setCancelLoadingId(bookingId);
    const res = await cancelBooking(bookingId);
    setCancelLoadingId(null);
    if (res.success) {
      showToast('Booking cancelled successfully!', 'success');
      setExpandedBookingId(null);
    } else {
      showToast(res.message || 'Failed to cancel booking.', 'error');
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      showToast('Please fill all password fields.', 'warning');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'warning');
      return;
    }

    if (newPassword.length < 6) {
      showToast('Password should be at least 6 characters.', 'warning');
      return;
    }

    setPasswordLoading(true);
    const res = await changePassword(currentPassword, newPassword);
    setPasswordLoading(false);

    if (res.success) {
      showToast('Password changed successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    } else {
      showToast(res.message || 'Failed to change password.', 'error');
    }
  };

  const handleOpenEdit = () => {
    setEditName(user?.name || '');
    setEditPhone(user?.phone || '');
    setModalVisible(true);
  };

  const handleSave = () => {
    updateProfile(editName, editPhone);
    setModalVisible(false);
  };

  // Extract initials (e.g. "Ravi Kumar" -> "RK")
  const getInitials = (name) => {
    if (!name) return 'RK';
    const cleanName = name.trim();
    if (!cleanName) return 'RK';
    const parts = cleanName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const firstInitial = parts[0][0] || '';
      const secondInitial = parts[1][0] || '';
      return (firstInitial + secondInitial).toUpperCase();
    }
    return cleanName.slice(0, 2).toUpperCase();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#00B894']} />
        }
      >
        {/* Header */}
        <Header />

        {/* User Card */}
        <View style={styles.userCard}>
          <LinearGradient
            colors={['#00B894', '#0091EA']}
            style={styles.avatar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
          </LinearGradient>

          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <Text style={styles.userPhone}>{user?.phone || ''}</Text>
          </View>

          <TouchableOpacity style={styles.editButton} onPress={handleOpenEdit}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Subscriptions List */}
        {subscriptions && subscriptions.length > 0 ? (
          subscriptions.map((sub, index) => (
            <View key={sub.id || index} style={{ marginBottom: 12 }}>
              {sub.status === 'Pending' ? (
                <View style={[styles.subCard, { backgroundColor: '#FFFBEB', borderColor: '#FCD34D', borderWidth: 1 }]}>
                  <View style={styles.subHeaderRow}>
                    <Ionicons name="time-outline" size={16} color="#B45309" style={{ marginRight: 6 }} />
                    <Text style={[styles.subHeaderLabel, { color: '#B45309' }]}>PENDING APPROVAL</Text>
                  </View>

                  <Text style={[styles.subTitle, { color: '#92400E' }]}>{sub.plan || 'Power Care Annual'}</Text>
                  <Text style={[styles.subInfo, { color: '#B45309' }]}>
                    Slot #{sub.slotNumber} · Paid via {sub.paymentMode || 'Online'}
                  </Text>
                  <Text style={{ marginTop: 8, fontSize: 13, color: '#D97706' }}>
                    Admin is reviewing your request.
                  </Text>
                </View>
              ) : sub.status === 'Rejected' ? (
                <View style={[styles.subCard, { backgroundColor: '#FEF2F2', borderColor: '#FECACA', borderWidth: 1 }]}>
                  <View style={styles.subHeaderRow}>
                    <Ionicons name="close-circle-outline" size={16} color="#B91C1C" style={{ marginRight: 6 }} />
                    <Text style={[styles.subHeaderLabel, { color: '#B91C1C' }]}>REQUEST REJECTED</Text>
                  </View>

                  <Text style={[styles.subTitle, { color: '#991B1B' }]}>Subscription Rejected</Text>
                  <Text style={[styles.subInfo, { color: '#B91C1C' }]}>
                    Your request for slot #{sub.slotNumber} was not approved.
                  </Text>
                  <TouchableOpacity 
                    style={[styles.subscribeBtn, { backgroundColor: '#B91C1C', marginTop: 12 }]} 
                    onPress={() => navigation.navigate('Slots')}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.subscribeBtnText, { color: '#FFF' }]}>Choose a New Slot</Text>
                    <Ionicons name="arrow-forward-outline" size={16} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <LinearGradient
                  colors={['#00B894', '#0091EA']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.subCard}
                >
                  <View style={styles.subHeaderRow}>
                    <Ionicons name="ribbon" size={16} color="#FFF" style={{ marginRight: 6 }} />
                    <Text style={styles.subHeaderLabel}>ACTIVE SUBSCRIPTION</Text>
                  </View>

                  <Text style={styles.subTitle}>{sub.plan || 'Power Care Annual'}</Text>
                  <Text style={styles.subInfo}>
                    Slot #{sub.slotNumber} · Valid till {sub.date || '28 Apr 2027'}
                  </Text>

                  <View style={styles.badgeRow}>
                    <View style={styles.subBadge}>
                      <Text style={styles.subBadgeText}>Unlimited services</Text>
                    </View>
                    <View style={styles.subBadge}>
                      <Text style={styles.subBadgeText}>Priority support</Text>
                    </View>
                  </View>
                </LinearGradient>
              )}
            </View>
          ))
        ) : (
          <LinearGradient
            colors={['#1E293B', '#0F172A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.subCard}
          >
            <View style={styles.subHeaderRow}>
              <Ionicons name="alert-circle-outline" size={16} color="#94A3B8" style={{ marginRight: 6 }} />
              <Text style={[styles.subHeaderLabel, { color: '#94A3B8' }]}>NO ACTIVE PLAN</Text>
            </View>

            <Text style={[styles.subTitle, { color: '#FFF' }]}>Become a Pro Member</Text>
            <Text style={[styles.subInfo, { color: '#CBD5E1' }]}>
              Subscribe to an annual slot to unlock unlimited free bookings and priority care.
            </Text>

            <TouchableOpacity 
              style={styles.subscribeBtn} 
              onPress={() => navigation.navigate('Slots')}
              activeOpacity={0.8}
            >
              <Text style={styles.subscribeBtnText}>Choose Slot & Subscribe</Text>
              <Ionicons name="arrow-forward-outline" size={16} color="#111827" />
            </TouchableOpacity>
          </LinearGradient>
        )}
        
        {subscriptions && subscriptions.length > 0 && (
          <TouchableOpacity 
            style={[styles.subscribeBtn, { backgroundColor: '#E0F2FE', borderColor: '#BAE6FD', borderWidth: 1, marginBottom: 12 }]} 
            onPress={() => navigation.navigate('Slots')}
            activeOpacity={0.8}
          >
            <Text style={[styles.subscribeBtnText, { color: '#0369A1' }]}>Pick Another Slot</Text>
            <Ionicons name="add-circle-outline" size={16} color="#0369A1" />
          </TouchableOpacity>
        )}

        {/* Booking History Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Booking History</Text>
          {bookings.length > 3 && (
            <TouchableOpacity activeOpacity={0.7} onPress={() => setShowAllBookings(!showAllBookings)}>
              <Text style={styles.sectionAction}>{showAllBookings ? 'See Less' : 'See All'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Booking History List */}
        {(showAllBookings ? bookings : bookings.slice(0, 3)).map((booking) => {
          const isExpanded = expandedBookingId === booking.id;
          return (
            <TouchableOpacity 
              key={booking.id} 
              style={[styles.bookingCard, isExpanded && styles.bookingCardExpanded]}
              activeOpacity={0.9}
              onPress={() => setExpandedBookingId(isExpanded ? null : booking.id)}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={styles.bookingLeft}>
                  <View style={styles.bookingIconBg}>
                    <Ionicons name={booking.icon || 'construct-outline'} size={20} color="#15803D" />
                  </View>
                  <View style={styles.bookingInfo}>
                    <Text style={styles.bookingName}>{booking.serviceName}</Text>
                    <Text style={styles.bookingDetails}>
                      {booking.id} · {booking.date}
                    </Text>
                  </View>
                </View>
                <View style={styles.bookingRight}>
                  <Text style={styles.bookingPrice}>₹{booking.price}</Text>
                  <Text style={styles.bookingStatus}>{booking.status}</Text>
                </View>
              </View>

              {isExpanded && (
                <View style={styles.expandedContent}>
                  <View style={styles.expandedDivider} />
                  
                  {/* OTP Block */}
                  <View style={styles.otpRow}>
                    <Text style={styles.otpLabel}>Verification OTP Code:</Text>
                    <View style={styles.otpBadge}>
                      <Text style={styles.otpText}>{booking.otp || '1234'}</Text>
                    </View>
                  </View>
                  <Text style={styles.otpSubText}>Provide this OTP to the technician upon service completion.</Text>

                  {/* Vendor Details */}
                  {booking.vendorName ? (
                    <View style={styles.vendorSection}>
                      <Text style={styles.vendorLabel}>Assigned Technician:</Text>
                      <View style={styles.vendorRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                          <Ionicons name="person" size={14} color="#00B894" style={{ marginRight: 6 }} />
                          <Text style={styles.vendorNameText}>{booking.vendorName}</Text>
                        </View>
                        <TouchableOpacity 
                          style={styles.userCallBtn} 
                          onPress={() => Linking.openURL(`tel:${booking.vendorPhone}`)}
                        >
                          <Ionicons name="call" size={12} color="#FFF" style={{ marginRight: 4 }} />
                          <Text style={styles.userCallBtnText}>Call</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.vendorSection}>
                      <Text style={styles.vendorLabel}>Assigned Technician:</Text>
                      <Text style={styles.noVendorText}>Awaiting technician assignment...</Text>
                    </View>
                  )}

                  {/* Cancel Booking Button */}
                  {booking.status !== 'Completed' && booking.status !== 'Cancelled' && (
                    <TouchableOpacity
                      style={styles.cancelBookingBtn}
                      onPress={() => handleCancelBooking(booking.id)}
                      disabled={cancelLoadingId === booking.id}
                    >
                      {cancelLoadingId === booking.id ? (
                        <ActivityIndicator color="#EF4444" size="small" />
                      ) : (
                        <>
                          <Ionicons name="close-circle-outline" size={14} color="#EF4444" style={{ marginRight: 6 }} />
                          <Text style={styles.cancelBookingBtnText}>Cancel Booking</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Security Settings Section */}
        <View style={styles.sectionCard}>
          <View style={styles.passwordHeader}>
            <Text style={styles.sectionTitle}>Security Settings</Text>
            {!showPasswordForm && (
              <TouchableOpacity
                style={styles.toggleFormBtn}
                onPress={() => setShowPasswordForm(true)}
              >
                <Ionicons name="lock-closed-outline" size={14} color="#0984E3" style={{ marginRight: 4 }} />
                <Text style={styles.toggleFormBtnText}>Change Password</Text>
              </TouchableOpacity>
            )}
          </View>

          {showPasswordForm && (
            <View style={{ marginTop: 12 }}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Current Password</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter current password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={true}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>New Password</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Minimum 6 characters"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={true}
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm New Password</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Re-enter new password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={true}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>

              <View style={styles.passwordActionsRow}>
                <TouchableOpacity
                  style={styles.cancelPasswordBtn}
                  onPress={() => {
                    setShowPasswordForm(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                >
                  <Text style={styles.cancelPasswordBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.submitPasswordBtn}
                  onPress={handlePasswordChange}
                  disabled={passwordLoading}
                >
                  {passwordLoading ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <>
                      <Text style={styles.submitPasswordBtnText}>Update</Text>
                      <Ionicons name="key-outline" size={14} color="#FFF" style={{ marginLeft: 4 }} />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Contact Support Section */}
        <TouchableOpacity style={styles.supportRow} activeOpacity={0.7} onPress={() => setContactModalVisible(true)}>
          <View style={styles.supportLeft}>
            <View style={styles.supportIconBg}>
              <Ionicons name="call" size={18} color="#00B894" />
            </View>
            <Text style={styles.supportText}>Contact support</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </TouchableOpacity>

        {/* Logout Section */}
        <TouchableOpacity 
          style={[styles.supportRow, { marginTop: 12, borderColor: '#FCA5A5' }]} 
          activeOpacity={0.7}
          onPress={logout}
        >
          <View style={styles.supportLeft}>
            <View style={[styles.supportIconBg, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="log-out" size={18} color="#EF4444" />
            </View>
            <Text style={[styles.supportText, { color: '#EF4444' }]}>Log out</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#FCA5A5" />
        </TouchableOpacity>
      </ScrollView>

      <Toast
        message={toastMsg}
        type={toastType}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />

      {/* Edit Profile Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBg}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.textInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter name"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.textInput}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <LinearGradient
                colors={['#00B894', '#0091EA']}
                style={styles.saveButtonGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Contact Support Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={contactModalVisible}
        onRequestClose={() => setContactModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBg}
        >
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20, maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Contact Support</Text>
              <TouchableOpacity onPress={() => setContactModalVisible(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name <Text style={{color: 'red'}}>*</Text></Text>
                <TextInput
                  style={styles.textInput}
                  value={contactData.name}
                  onChangeText={(text) => setContactData({...contactData, name: text})}
                  placeholder="Enter your name"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email <Text style={{color: 'red'}}>*</Text></Text>
                <TextInput
                  style={styles.textInput}
                  value={contactData.email}
                  onChangeText={(text) => setContactData({...contactData, email: text})}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone</Text>
                <TextInput
                  style={styles.textInput}
                  value={contactData.phone}
                  onChangeText={(text) => setContactData({...contactData, phone: text})}
                  placeholder="Enter your phone number"
                  keyboardType="phone-pad"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Subject</Text>
                <TouchableOpacity 
                  style={[styles.textInput, { justifyContent: 'center' }]}
                  onPress={() => setSubjectDropdownOpen(!subjectDropdownOpen)}
                >
                  <Text style={{ color: contactData.subject ? '#111827' : '#9CA3AF' }}>
                    {subjectOptions.find(o => o.value === contactData.subject)?.label || 'Select subject'}
                  </Text>
                </TouchableOpacity>
                {subjectDropdownOpen && (
                  <View style={{ backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, marginTop: 4 }}>
                    {subjectOptions.map(opt => (
                      <TouchableOpacity 
                        key={opt.value} 
                        style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}
                        onPress={() => {
                          setContactData({...contactData, subject: opt.value});
                          setSubjectDropdownOpen(false);
                        }}
                      >
                        <Text style={{ color: '#374151' }}>{opt.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Message <Text style={{color: 'red'}}>*</Text></Text>
                <TextInput
                  style={[styles.textInput, { height: 100, textAlignVertical: 'top' }]}
                  value={contactData.message}
                  onChangeText={(text) => setContactData({...contactData, message: text})}
                  placeholder="How can we help?"
                  placeholderTextColor="#9CA3AF"
                  multiline
                />
              </View>

              <TouchableOpacity 
                style={styles.saveButton} 
                onPress={handleContactSubmit}
                disabled={contactLoading}
              >
                <LinearGradient
                  colors={['#00B894', '#0091EA']}
                  style={styles.saveButtonGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {contactLoading ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={styles.saveButtonText}>Send Message</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  userPhone: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  editButtonText: {
    color: '#0984E3',
    fontSize: 15,
    fontWeight: '700',
  },
  subCard: {
    borderRadius: 24,
    padding: 24,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  subHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  subHeaderLabel: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  subTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '800',
  },
  subInfo: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 16,
  },
  subBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    marginRight: 8,
  },
  subBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  subscribeBtn: {
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 18,
  },
  subscribeBtnText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  sectionAction: {
    color: '#0984E3',
    fontSize: 15,
    fontWeight: '700',
  },
  bookingCard: {
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
  bookingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bookingIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingInfo: {
    marginLeft: 12,
    flex: 1,
  },
  bookingName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  bookingDetails: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  bookingRight: {
    alignItems: 'flex-end',
  },
  bookingPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  bookingStatus: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '700',
    marginTop: 4,
  },
  supportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  supportLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  supportIconBg: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E8FBF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  supportText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  modalBg: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  saveButton: {
    marginTop: 10,
    shadowColor: '#00B894',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  saveButtonGrad: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  bookingCardExpanded: {
    borderColor: '#00B894',
    backgroundColor: '#FCFDFE',
  },
  expandedContent: {
    marginTop: 12,
  },
  expandedDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 12,
  },
  otpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  otpLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#6B7280',
  },
  otpBadge: {
    backgroundColor: '#E8F5E9',
    borderColor: '#A5D6A7',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  otpText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  otpSubText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
    fontWeight: '500',
  },
  vendorSection: {
    marginTop: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  vendorLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  vendorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vendorNameText: {
    fontSize: 13,
    fontWeight: '750',
    color: '#374151',
  },
  noVendorText: {
    fontSize: 12.5,
    color: '#9CA3AF',
    fontStyle: 'italic',
    fontWeight: '500',
  },
  userCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00B894',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  userCallBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  cancelBookingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 14,
    backgroundColor: '#FFF',
  },
  cancelBookingBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleFormBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleFormBtnText: {
    color: '#0984E3',
    fontSize: 13,
    fontWeight: '700',
  },
  passwordActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },
  cancelPasswordBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cancelPasswordBtnText: {
    color: '#4B5563',
    fontSize: 13,
    fontWeight: '700',
  },
  submitPasswordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00B894',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  submitPasswordBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '750',
  },
});