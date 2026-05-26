import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVendor } from '../context/VendorContext';
import Toast from '../components/Toast';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { vendor, services, allSystemServices, addService, logout, changePassword, leaves, addLeave, removeLeave, refreshData } = useVendor();

  const formatLeaveDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day} ${months[monthIdx]} ${year}`;
  };

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const [addMode, setAddMode] = useState(false); // toggle add service view
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [customMode, setCustomMode] = useState(false); // custom service toggle
  
  // Custom service fields
  const [customTitle, setCustomTitle] = useState('');
  const [customSubtitle, setCustomSubtitle] = useState('');
  const [customPrice, setCustomPrice] = useState('');

  // Change password states
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Leave states
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [leaveLoading, setLeaveLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState('success');

  const showToast = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setToastVisible(true);
  };

  const handleLogout = async () => {
    await logout();
  };

  // Filter system services to only show ones the vendor doesn't have yet
  const vendorServiceIds = services.map(s => s.id);
  const unlinkedServices = allSystemServices.filter(s => !vendorServiceIds.includes(s.id));

  const handleAddService = async () => {
    if (!customMode && !selectedServiceId) {
      showToast('Please select a service from the list.', 'warning');
      return;
    }

    if (customMode) {
      if (!customTitle.trim() || !customSubtitle.trim() || !customPrice.trim()) {
        showToast('Please fill all fields for custom service registration.', 'warning');
        return;
      }
      if (isNaN(Number(customPrice))) {
        showToast('Please enter a valid price.', 'warning');
        return;
      }
    }

    setLoading(true);
    const customServiceObj = customMode ? {
      title: customTitle.trim(),
      subtitle: customSubtitle.trim(),
      price: parseFloat(customPrice.trim()),
      icon: 'construct-outline'
    } : null;

    const res = await addService(customMode ? null : selectedServiceId, customServiceObj);
    setLoading(false);

    if (res.success) {
      showToast('Skill linked successfully!', 'success');
      setAddMode(false);
      setSelectedServiceId('');
      setCustomTitle('');
      setCustomSubtitle('');
      setCustomPrice('');
      setCustomMode(false);
    } else {
      showToast(res.message || 'Failed to add service.', 'error');
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
    } else {
      showToast(res.message || 'Failed to change password.', 'error');
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDeclareLeave = async () => {
    if (!selectedDate) {
      showToast('Please select a date from the calendar first.', 'warning');
      return;
    }

    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const leaveDateStr = `${year}-${month}-${day}`;

    setLeaveLoading(true);
    const res = await addLeave(leaveDateStr);
    setLeaveLoading(false);

    if (res.success) {
      showToast('Leave declared successfully!', 'success');
      setSelectedDate(null);
    } else {
      showToast(res.message || 'Failed to declare leave.', 'error');
    }
  };

  const handleRemoveLeave = async (date) => {
    setLeaveLoading(true);
    const res = await removeLeave(date);
    setLeaveLoading(false);

    if (res.success) {
      showToast('Leave declaration removed.', 'success');
    } else {
      showToast(res.message || 'Failed to remove leave.', 'error');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#00B894']} />
        }
      >
        <Text style={styles.heading}>Profile</Text>

        {/* Vendor Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['#0984E3', '#00B894']}
              style={styles.avatarGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.avatarText}>
                {vendor?.name ? vendor.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'P'}
              </Text>
            </LinearGradient>
          </View>

          <Text style={styles.vendorName}>{vendor?.name}</Text>
          <Text style={styles.vendorPhone}>{vendor?.phone}</Text>

          <View style={styles.statusRow}>
            <View style={styles.statusBadge}>
              <Ionicons name="shield-checkmark" size={14} color="#15803D" style={{ marginRight: 4 }} />
              <Text style={styles.statusText}>{vendor?.status || 'Approved'}</Text>
            </View>
          </View>
        </View>

        {/* Linked Services Skills List */}
        <View style={styles.skillsSection}>
          <View style={styles.skillsHeader}>
            <Text style={styles.sectionTitle}>My Service Offerings</Text>
            {!addMode && (
              <TouchableOpacity onPress={() => setAddMode(true)} style={styles.addSkillBtn}>
                <Ionicons name="add-circle" size={18} color="#00B894" />
                <Text style={styles.addSkillBtnText}>Add Skill</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Add Service Section */}
          {addMode && (
            <View style={styles.addSkillCard}>
              <View style={styles.addSkillHeaderRow}>
                <Text style={styles.addSkillTitle}>Add Service to Profile</Text>
                <TouchableOpacity onPress={() => setAddMode(false)} style={styles.closeAddBtn}>
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              {/* Mode Toggles */}
              <View style={styles.toggleRow}>
                <TouchableOpacity 
                  style={[styles.toggleBtn, !customMode && styles.toggleBtnActive]}
                  onPress={() => setCustomMode(false)}
                >
                  <Text style={[styles.toggleText, !customMode && styles.toggleTextActive]}>Select Existing</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.toggleBtn, customMode && styles.toggleBtnActive]}
                  onPress={() => setCustomMode(true)}
                >
                  <Text style={[styles.toggleText, customMode && styles.toggleTextActive]}>Add Custom</Text>
                </TouchableOpacity>
              </View>

              {!customMode ? (
                /* Select Existing service */
                unlinkedServices.length === 0 ? (
                  <Text style={styles.allLinkedText}>You have already added all existing services.</Text>
                ) : (
                  <View style={styles.dropdownContainer}>
                    <Text style={styles.inputLabel}>Choose Service Category</Text>
                    {unlinkedServices.map(item => {
                      const isSelected = selectedServiceId === item.id;
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[styles.dropdownItem, isSelected && styles.dropdownItemActive]}
                          onPress={() => setSelectedServiceId(item.id)}
                        >
                          <Ionicons 
                            name={item.icon || 'construct-outline'} 
                            size={16} 
                            color={isSelected ? '#00B894' : '#6B7280'} 
                            style={{ marginRight: 8 }}
                          />
                          <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextActive]}>
                            {item.title} (₹{item.price})
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )
              ) : (
                /* Create custom service fields */
                <View style={{ marginTop: 8 }}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Service Name (e.g. A/C Servicing)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Service Title"
                      placeholderTextColor="#9CA3AF"
                      value={customTitle}
                      onChangeText={setCustomTitle}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Subtitle Description</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. General filters and water jet cleaning"
                      placeholderTextColor="#9CA3AF"
                      value={customSubtitle}
                      onChangeText={setCustomSubtitle}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Price Cost (₹)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 399"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                      value={customPrice}
                      onChangeText={setCustomPrice}
                    />
                  </View>
                </View>
              )}

              {/* Add Skill Button */}
              {(!customMode && unlinkedServices.length === 0) ? null : (
                <TouchableOpacity
                  style={styles.submitSkillBtn}
                  onPress={handleAddService}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <>
                      <Text style={styles.submitSkillBtnText}>Link Skill to Profile</Text>
                      <Ionicons name="checkmark-done" size={16} color="#FFF" style={{ marginLeft: 6 }} />
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* List of active Skills */}
          {services.length === 0 ? (
            <View style={styles.emptySkills}>
              <Text style={styles.emptySkillsText}>You haven&apos;t added any service offerings yet.</Text>
            </View>
          ) : (
            services.map(item => (
              <View key={item.id} style={styles.skillCard}>
                <View style={styles.skillLeft}>
                  <View style={styles.skillIconBg}>
                    <Ionicons name={item.icon || 'construct-outline'} size={18} color="#15803D" />
                  </View>
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.skillTitle}>{item.title}</Text>
                    <Text style={styles.skillSubtitle} numberOfLines={1}>{item.subtitle}</Text>
                  </View>
                </View>
                <Text style={styles.skillPrice}>₹{item.price}</Text>
              </View>
            ))
          )}
        </View>

        {/* Leave Declaration Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Leave Declaration</Text>
          <Text style={styles.sectionDescription}>
            Declare dates you are unavailable. Tasks will not be auto-assigned to you on these days.
          </Text>

          <View style={styles.leaveActionRow}>
            <TouchableOpacity
              style={styles.calendarTrigger}
              onPress={() => setCalendarVisible(true)}
            >
              <Ionicons name="calendar-outline" size={18} color="#00B894" style={{ marginRight: 8 }} />
              <Text style={styles.calendarTriggerText}>
                {selectedDate
                  ? selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                  : 'Select Date...'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.addLeaveBtn, !selectedDate && styles.addLeaveBtnDisabled]}
              onPress={handleDeclareLeave}
              disabled={leaveLoading || !selectedDate}
            >
              {leaveLoading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.addLeaveBtnText}>Declare</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* List of active leaves */}
          {(!leaves || leaves.length === 0) ? (
            <Text style={styles.noLeavesText}>No leave dates declared.</Text>
          ) : (
            <View style={styles.leavesList}>
              {leaves.map((lDate) => (
                <View key={lDate} style={styles.leaveCard}>
                  <View style={styles.leaveCardLeft}>
                    <View style={[styles.statusIndicator, { backgroundColor: '#EF4444' }]} />
                    <View>
                      <Text style={styles.leaveCardDate}>{formatLeaveDate(lDate)}</Text>
                      <Text style={styles.leaveCardLabel}>Unavailable (Leave)</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveLeave(lDate)}
                    style={styles.removeLeaveBadge}
                  >
                    <Text style={styles.removeLeaveBadgeText}>Remove</Text>
                    <Ionicons name="trash-outline" size={11} color="#EF4444" style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Change Password Section */}
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

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" style={{ marginRight: 8 }} />
          <Text style={styles.logoutBtnText}>Log Out Account</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Calendar Selection Modal */}
      {calendarVisible && (
        <View style={styles.modalBg}>
          <View style={styles.calendarModalContent}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={handlePrevMonth} style={styles.monthNavBtn}>
                <Ionicons name="chevron-back" size={20} color="#374151" />
              </TouchableOpacity>
              <Text style={styles.calendarMonthTitle}>
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity onPress={handleNextMonth} style={styles.monthNavBtn}>
                <Ionicons name="chevron-forward" size={20} color="#374151" />
              </TouchableOpacity>
            </View>

            <View style={styles.weekdaysRow}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <Text key={day} style={styles.weekdayText}>{day}</Text>
              ))}
            </View>

            <View style={styles.daysGrid}>
              {getDaysInMonth(currentMonth).map((dayObj, index) => {
                if (!dayObj) {
                  return <View key={`empty-${index}`} style={styles.dayCellEmpty} />;
                }
                const isSelected = selectedDate && 
                  dayObj.getDate() === selectedDate.getDate() &&
                  dayObj.getMonth() === selectedDate.getMonth() &&
                  dayObj.getFullYear() === selectedDate.getFullYear();
                
                const isPast = dayObj < new Date(new Date().setHours(0,0,0,0));

                return (
                  <TouchableOpacity
                    key={dayObj.toISOString()}
                    style={[
                      styles.dayCell, 
                      isSelected && styles.dayCellActive,
                      isPast && styles.dayCellDisabled
                    ]}
                    onPress={() => {
                      if (!isPast) {
                        setSelectedDate(dayObj);
                        setCalendarVisible(false);
                      }
                    }}
                    disabled={isPast}
                  >
                    <Text style={[
                      styles.dayText, 
                      isSelected && styles.dayTextActive,
                      isPast && styles.dayTextDisabled
                    ]}>
                      {dayObj.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity 
              style={styles.closeCalendarBtn}
              onPress={() => setCalendarVisible(false)}
            >
              <Text style={styles.closeCalendarBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Toast
        message={toastMsg}
        type={toastType}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },
  heading: {
    fontSize: 28,
    fontWeight: '850',
    color: '#111827',
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 20,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginHorizontal: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatarGrad: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '800',
  },
  vendorName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  vendorPhone: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 4,
  },
  statusRow: {
    marginTop: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: '750',
  },
  skillsSection: {
    paddingHorizontal: 20,
  },
  skillsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  addSkillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addSkillBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00B894',
  },
  skillCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10,
  },
  skillLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  skillIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skillTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#374151',
  },
  skillSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  skillPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#15803D',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 16,
    paddingVertical: 14,
    marginHorizontal: 20,
    marginTop: 32,
  },
  logoutBtnText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
  },
  emptySkills: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  emptySkillsText: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '600',
  },

  // Add Skill Card Styles
  addSkillCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  addSkillHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  addSkillTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  closeAddBtn: {
    padding: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 3,
    marginBottom: 14,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  toggleTextActive: {
    color: '#111827',
  },
  dropdownContainer: {
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 6,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    marginVertical: 4,
    backgroundColor: '#F9FAFB',
  },
  dropdownItemActive: {
    borderColor: '#00B894',
    backgroundColor: '#ECFDF5',
  },
  dropdownItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  dropdownItemTextActive: {
    color: '#065F46',
    fontWeight: '800',
  },
  allLinkedText: {
    color: '#6B7280',
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: 8,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#111827',
  },
  submitSkillBtn: {
    marginTop: 14,
    backgroundColor: '#00B894',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  submitSkillBtnText: {
    color: '#FFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginHorizontal: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 24,
    marginTop: 24,
  },
  sectionDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 14,
    lineHeight: 16,
    fontWeight: '500',
  },
  leaveActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flex: 1,
    marginRight: 10,
  },
  calendarTriggerText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
  },
  addLeaveBtn: {
    backgroundColor: '#00B894',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
  },
  addLeaveBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  addLeaveBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  noLeavesText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
  leavesList: {
    marginTop: 16,
  },
  leaveCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leaveCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  leaveCardDate: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#111827',
  },
  leaveCardLabel: {
    fontSize: 11,
    color: '#EF4444',
    marginTop: 2,
    fontWeight: '750',
  },
  removeLeaveBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    flexDirection: 'row',
    alignItems: 'center',
  },
  removeLeaveBadgeText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '750',
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleFormBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  toggleFormBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0984E3',
  },
  passwordActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelPasswordBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelPasswordBtnText: {
    color: '#4B5563',
    fontSize: 13,
    fontWeight: '700',
  },
  submitPasswordBtn: {
    flex: 1,
    backgroundColor: '#0984E3',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  submitPasswordBtnText: {
    color: '#FFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  modalBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  calendarModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthNavBtn: {
    padding: 6,
  },
  calendarMonthTitle: {
    fontSize: 15.5,
    fontWeight: '850',
    color: '#111827',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekdayText: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    rowGap: 8,
  },
  dayCell: {
    width: '14.28%',
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  dayCellActive: {
    backgroundColor: '#00B894',
  },
  dayCellDisabled: {
    backgroundColor: 'transparent',
  },
  dayCellEmpty: {
    width: '14.28%',
    height: 36,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  dayTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dayTextDisabled: {
    color: '#D1D5DB',
  },
  closeCalendarBtn: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeCalendarBtnText: {
    color: '#374151',
    fontSize: 13.5,
    fontWeight: '700',
  },
});
