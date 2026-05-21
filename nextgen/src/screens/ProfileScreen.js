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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import Header from '../components/Header';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, bookedSlot, bookings, updateProfile, logout } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');

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

        {/* Active Subscription Card */}
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

          <Text style={styles.subTitle}>Power Care Annual</Text>
          <Text style={styles.subInfo}>
            Slot #{bookedSlot || '1877'} · Valid till 28 Apr 2027
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

        {/* Booking History Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Booking History</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.sectionAction}>Book again</Text>
          </TouchableOpacity>
        </View>

        {/* Booking History List */}
        {bookings.map((booking) => (
          <View key={booking.id} style={styles.bookingCard}>
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
        ))}

        {/* Contact Support Section */}
        <TouchableOpacity style={styles.supportRow} activeOpacity={0.7}>
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
    paddingHorizontal: 20,
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
});