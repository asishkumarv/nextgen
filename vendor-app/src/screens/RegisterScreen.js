import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVendor } from '../context/VendorContext';
import Toast from '../components/Toast';
import { api } from '../utils/api';
import { getServiceIconName } from '../utils/iconHelper';

export default function RegisterScreen({ onNavigateToLogin }) {
  const insets = useSafeAreaInsets();
  const { register, allSystemServices } = useVendor();

  // Multi-step state
  const [step, setStep] = useState(1);

  // Step 1: Account Details
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // OTP Verification States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  // Step 2: Existing Services Multi-Select
  const [selectedServices, setSelectedServices] = useState([]);

  // Step 3: Custom Service Form (Optional)
  const [addCustomService, setAddCustomService] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customSubtitle, setCustomSubtitle] = useState('');
  const [customPrice, setCustomPrice] = useState('');

  // Districts and Mandals state
  const [districts, setDistricts] = useState([]);
  const [mandals, setMandals] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedMandal, setSelectedMandal] = useState(null);
  const [districtDropdownOpen, setDistrictDropdownOpen] = useState(false);
  const [mandalDropdownOpen, setMandalDropdownOpen] = useState(false);

  // Fetch districts on mount
  useEffect(() => {
    const loadDistricts = async () => {
      try {
        const data = await api.get('/subscription/districts');
        setDistricts(data || []);
      } catch (err) {
        console.warn('Failed to load districts:', err.message);
      }
    };
    loadDistricts();
  }, []);

  // Fetch mandals when district changes
  useEffect(() => {
    if (!selectedDistrict) {
      setMandals([]);
      setSelectedMandal(null);
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
  }, [selectedDistrict]);

  // Local UX states
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState('error');

  const showToast = (msg, type = 'error') => {
    setToastMsg(msg);
    setToastType(type);
    setToastVisible(true);
  };

  const validateStep1 = () => {
    const localErrors = {};
    if (!name.trim()) localErrors.name = 'Full name is required';
    if (!phone.trim()) {
      localErrors.phone = 'Phone number is required';
    } else if (phone.trim().replace(/\D/g, '').length < 10) {
      localErrors.phone = 'Enter a valid 10-digit phone number';
    }
    if (!email.trim()) {
      localErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      localErrors.email = 'Enter a valid email address';
    }
    if (!password) {
      localErrors.password = 'Password is required';
    } else if (password.length < 6) {
      localErrors.password = 'Password must be at least 6 characters';
    }
    if (!selectedDistrict) {
      localErrors.district = 'District selection is required';
    }
    if (!selectedMandal) {
      localErrors.mandal = 'Mandal selection is required';
    }

    setErrors(localErrors);
    return Object.keys(localErrors).length === 0;
  };

  const handleNext = () => {
    Keyboard.dismiss();
    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
      } else {
        showToast('Please fix the errors before proceeding.', 'warning');
      }
    } else if (step === 2) {
      if (selectedServices.length === 0 && !addCustomService) {
        showToast('Please select at least one existing service or toggle a custom service.', 'warning');
      } else {
        setStep(3);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onNavigateToLogin();
    }
  };

  const toggleServiceSelection = (id) => {
    if (selectedServices.includes(id)) {
      setSelectedServices(prev => prev.filter(item => item !== id));
    } else {
      setSelectedServices(prev => [...prev, id]);
    }
  };

  const handleRegisterSubmit = async () => {
    Keyboard.dismiss();
    if (addCustomService) {
      if (!customTitle.trim() || !customSubtitle.trim() || !customPrice.trim()) {
        showToast('Please enter all fields for your custom service or uncheck "Add a custom service".', 'warning');
        return;
      }
      if (isNaN(Number(customPrice))) {
        showToast('Please enter a valid price number.', 'warning');
        return;
      }
    }

    setLoading(true);
    try {
      const otpRes = await api.post('/auth/send-otp', { email: email.trim(), phone: phone.trim(), type: 'vendor' });
      setLoading(false);
      if (otpRes.success) {
        setOtpError('');
        setOtpCode('');
        setShowOtpModal(true);
        showToast('SMS verification code sent to your mobile phone', 'success');
      } else {
        showToast(otpRes.message || 'Failed to send verification code', 'error');
      }
    } catch (err) {
      setLoading(false);
      showToast(err.message || 'Failed to send verification code', 'error');
    }
  };

  const handleVerifyAndRegisterSubmit = async () => {
    Keyboard.dismiss();
    if (!otpCode.trim()) {
      setOtpError('Verification code is required');
      return;
    }
    if (otpCode.trim().length < 6) {
      setOtpError('Enter a valid 6-digit code');
      return;
    }

    setOtpLoading(true);
    setOtpError('');

    const newServiceObj = addCustomService ? {
      title: customTitle.trim(),
      subtitle: customSubtitle.trim(),
      price: parseFloat(customPrice.trim()),
      icon: 'construct-outline'
    } : null;

    const result = await register(
      name.trim(),
      phone.trim(),
      password,
      selectedServices,
      newServiceObj,
      selectedDistrict ? selectedDistrict.id : null,
      selectedMandal ? selectedMandal.id : null,
      email.trim(),
      otpCode.trim()
    );
    setOtpLoading(false);

    if (result.success) {
      setShowOtpModal(false);
      alert('Registration successful!\n\nYour account has been created. Once the system administrator reviews and approves your details, you will be able to log in.');
      onNavigateToLogin();
    } else {
      setOtpError(result.message || 'Verification failed. Please try again.');
      showToast(result.message || 'Verification failed', 'error');
    }
  };

  const handleResendOtp = async () => {
    setOtpLoading(true);
    setOtpError('');
    try {
      const otpRes = await api.post('/auth/send-otp', { email: email.trim(), phone: phone.trim(), type: 'vendor' });
      setOtpLoading(false);
      if (otpRes.success) {
        showToast('SMS verification code resent to your mobile phone', 'success');
      } else {
        showToast(otpRes.message || 'Failed to send verification code', 'error');
      }
    } catch (err) {
      setOtpLoading(false);
      showToast(err.message || 'Failed to send verification code', 'error');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Row */}
          <View style={styles.flowHeaderRow}>
            <TouchableOpacity style={styles.backBtn} onPress={handleBack} disabled={loading}>
              <Ionicons name="arrow-back" size={20} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.flowTitle}>Partner Sign Up</Text>
          </View>

          {/* Progress Indicators */}
          <View style={styles.stepsContainer}>
            <View style={styles.stepsTextRow}>
              <Text style={[styles.stepLabelText, step >= 1 && styles.stepLabelActive]}>Account</Text>
              <Text style={[styles.stepLabelText, step >= 2 && styles.stepLabelActive]}>Skills</Text>
              <Text style={[styles.stepLabelText, step >= 3 && styles.stepLabelActive]}>Review</Text>
            </View>
            <View style={styles.barWrapper}>
              <View style={[styles.barSegment, step >= 1 ? styles.barActive : styles.barInactive]} />
              <View style={[styles.barSegment, step >= 2 ? styles.barActive : styles.barInactive]} />
              <View style={[styles.barSegment, step >= 3 ? styles.barActive : styles.barInactive]} />
            </View>
          </View>

          {/* STEP 1: ACCOUNT DETAIL FIELDS */}
          {step === 1 && (
            <View style={styles.formCard}>
              <Text style={styles.formHeading}>Create Partner Profile</Text>
              <Text style={styles.formSub}>Submit your application details</Text>

              {/* Full Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <View style={[styles.inputWrapper, errors.name ? styles.inputWrapperError : null]}>
                  <Ionicons name="person-outline" size={18} color={errors.name ? '#EF4444' : '#6B7280'} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="John Doe"
                    placeholderTextColor="#A5A1B8"
                    value={name}
                    onChangeText={(t) => { setName(t); setErrors(prev => ({ ...prev, name: '' })); }}
                  />
                </View>
                {errors.name ? (
                  <View style={styles.fieldErrorRow}>
                    <Ionicons name="information-circle-outline" size={13} color="#EF4444" />
                    <Text style={styles.fieldErrorText}>{errors.name}</Text>
                  </View>
                ) : null}
              </View>

              {/* Phone */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <View style={[styles.inputWrapper, errors.phone ? styles.inputWrapperError : null]}>
                  <Ionicons name="call-outline" size={18} color={errors.phone ? '#EF4444' : '#6B7280'} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="+91 98765 43210"
                    placeholderTextColor="#A5A1B8"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={(t) => { setPhone(t); setErrors(prev => ({ ...prev, phone: '' })); }}
                  />
                </View>
                {errors.phone ? (
                  <View style={styles.fieldErrorRow}>
                    <Ionicons name="information-circle-outline" size={13} color="#EF4444" />
                    <Text style={styles.fieldErrorText}>{errors.phone}</Text>
                  </View>
                ) : null}
              </View>

              {/* Email Address */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={[styles.inputWrapper, errors.email ? styles.inputWrapperError : null]}>
                  <Ionicons name="mail-outline" size={18} color={errors.email ? '#EF4444' : '#6B7280'} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="partner@gofixit.com"
                    placeholderTextColor="#A5A1B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={(t) => { setEmail(t); setErrors(prev => ({ ...prev, email: '' })); }}
                  />
                </View>
                {errors.email ? (
                  <View style={styles.fieldErrorRow}>
                    <Ionicons name="information-circle-outline" size={13} color="#EF4444" />
                    <Text style={styles.fieldErrorText}>{errors.email}</Text>
                  </View>
                ) : null}
              </View>

              {/* District Select */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>District</Text>
                <TouchableOpacity 
                  style={[styles.dropdownBtn, errors.district ? styles.inputWrapperError : null]} 
                  onPress={() => setDistrictDropdownOpen(true)}
                >
                  <Ionicons name="map-outline" size={18} color={errors.district ? '#EF4444' : '#6B7280'} style={styles.inputIcon} />
                  <Text style={[styles.dropdownText, !selectedDistrict && { color: '#A5A1B8' }]}>
                    {selectedDistrict ? selectedDistrict.name : "Select District"}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#6B7280" style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
                {errors.district ? (
                  <View style={styles.fieldErrorRow}>
                    <Ionicons name="information-circle-outline" size={13} color="#EF4444" />
                    <Text style={styles.fieldErrorText}>{errors.district}</Text>
                  </View>
                ) : null}
              </View>

              {/* Mandal Select */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mandal</Text>
                <TouchableOpacity 
                  style={[
                    styles.dropdownBtn, 
                    !selectedDistrict && styles.dropdownDisabled,
                    errors.mandal ? styles.inputWrapperError : null
                  ]} 
                  onPress={() => selectedDistrict && setMandalDropdownOpen(true)}
                  disabled={!selectedDistrict}
                >
                  <Ionicons name="location-outline" size={18} color={errors.mandal ? '#EF4444' : '#6B7280'} style={styles.inputIcon} />
                  <Text style={[styles.dropdownText, (!selectedMandal || !selectedDistrict) && { color: '#A5A1B8' }]}>
                    {selectedMandal ? selectedMandal.name : "Select Mandal"}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#6B7280" style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
                {errors.mandal ? (
                  <View style={styles.fieldErrorRow}>
                    <Ionicons name="information-circle-outline" size={13} color="#EF4444" />
                    <Text style={styles.fieldErrorText}>{errors.mandal}</Text>
                  </View>
                ) : null}
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={[styles.inputWrapper, errors.password ? styles.inputWrapperError : null]}>
                  <Ionicons name="lock-closed-outline" size={18} color={errors.password ? '#EF4444' : '#6B7280'} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="At least 6 characters"
                    placeholderTextColor="#A5A1B8"
                    secureTextEntry
                    value={password}
                    onChangeText={(t) => { setPassword(t); setErrors(prev => ({ ...prev, password: '' })); }}
                  />
                </View>
                {errors.password ? (
                  <View style={styles.fieldErrorRow}>
                    <Ionicons name="information-circle-outline" size={13} color="#EF4444" />
                    <Text style={styles.fieldErrorText}>{errors.password}</Text>
                  </View>
                ) : null}
              </View>

              {/* Next Button */}
              <TouchableOpacity style={styles.actionBtn} onPress={handleNext}>
                <LinearGradient
                  colors={['#F0C38E', '#F1AA9B']}
                  style={styles.actionBtnGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.actionBtnText}>Next: Choose Skills</Text>
                  <Ionicons name="arrow-forward" size={16} color="#312C51" style={{ marginLeft: 8 }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: SKILLS CHECKLIST SELECTION */}
          {step === 2 && (
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionHeading}>What services can you perform?</Text>
              <Text style={styles.sectionSubHeading}>Select existing active services list</Text>

              {/* Services List Map */}
              {allSystemServices.length === 0 ? (
                <View style={styles.loadingSkillsContainer}>
                  <ActivityIndicator color="#F0C38E" />
                  <Text style={{ color: '#A5A1B8', fontSize: 13, marginTop: 8 }}>Fetching services list...</Text>
                </View>
              ) : (
                allSystemServices.map(item => {
                  const isSelected = selectedServices.includes(item.id);
                  const iconName = getServiceIconName(item);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.7}
                      delayPressIn={0}
                      style={[styles.serviceSelectCard, isSelected && styles.serviceSelectCardActive]}
                      onPress={() => toggleServiceSelection(item.id)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <View style={[styles.serviceSelectIconBg, isSelected && styles.serviceSelectIconBgActive]}>
                          <Ionicons 
                            name={iconName} 
                            size={18} 
                            color={isSelected ? '#F0C38E' : '#A5A1B8'} 
                          />
                        </View>
                        <View style={{ marginLeft: 12, flex: 1 }}>
                          <Text style={[styles.serviceSelectTitle, isSelected && styles.serviceSelectTitleActive]}>
                            {item.title}
                          </Text>
                          <Text style={[styles.serviceSelectSubtitle, isSelected && styles.serviceSelectSubtitleActive]} numberOfLines={1}>{item.subtitle}</Text>
                        </View>
                      </View>
                      <View style={[styles.checkboxCircle, isSelected && styles.checkboxCircleActive]}>
                        {isSelected && <Ionicons name="checkmark" size={14} color="#FFF" />}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}

              {/* Custom Service Toggle */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.customServiceToggle, addCustomService && styles.customServiceToggleActive]}
                onPress={() => setAddCustomService(!addCustomService)}
              >
                <Ionicons 
                  name={addCustomService ? "checkbox" : "square-outline"} 
                  size={20} 
                  color={addCustomService ? '#F0C38E' : '#6B7280'} 
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.customServiceToggleText}>I want to register a new service not listed above</Text>
              </TouchableOpacity>

              {/* Custom Service Fields */}
              {addCustomService && (
                <View style={[styles.formCard, { marginTop: 10, marginBottom: 20 }]}>
                  <Text style={styles.formHeading}>Custom Service Details</Text>
                  <Text style={styles.formSub}>This service will be added to user listings once approved</Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Service Name (e.g. Inverter Installation)</Text>
                    <TextInput
                      style={styles.customInput}
                      placeholder="Service Title"
                      placeholderTextColor="#A5A1B8"
                      value={customTitle}
                      onChangeText={setCustomTitle}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Subtitle (e.g. Battery wiring & setup)</Text>
                    <TextInput
                      style={styles.customInput}
                      placeholder="Service Subtitle"
                      placeholderTextColor="#A5A1B8"
                      value={customSubtitle}
                      onChangeText={setCustomSubtitle}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Base Cost (₹)</Text>
                    <TextInput
                      style={styles.customInput}
                      placeholder="e.g. 299"
                      placeholderTextColor="#A5A1B8"
                      keyboardType="numeric"
                      value={customPrice}
                      onChangeText={setCustomPrice}
                    />
                  </View>
                </View>
              )}

              {/* Next Button */}
              <TouchableOpacity style={styles.actionBtn} onPress={handleNext}>
                <LinearGradient
                  colors={['#F0C38E', '#F1AA9B']}
                  style={styles.actionBtnGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.actionBtnText}>Next: Review & Confirm</Text>
                  <Ionicons name="arrow-forward" size={16} color="#312C51" style={{ marginLeft: 8 }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 3: REVIEW DETAILS AND SUBMIT */}
          {step === 3 && (
            <View style={styles.formCard}>
              <Text style={styles.formHeading}>Review Application</Text>
              <Text style={styles.formSub}>Check details before final submission</Text>

              <View style={styles.reviewCard}>
                <View style={styles.reviewItem}>
                  <Text style={styles.reviewLabel}>Full Name</Text>
                  <Text style={styles.reviewVal}>{name}</Text>
                </View>

                <View style={styles.reviewItem}>
                  <Text style={styles.reviewLabel}>Phone Number</Text>
                  <Text style={styles.reviewVal}>{phone}</Text>
                </View>

                <View style={styles.reviewItem}>
                  <Text style={styles.reviewLabel}>Email Address</Text>
                  <Text style={styles.reviewVal}>{email}</Text>
                </View>

                <View style={styles.reviewItem}>
                  <Text style={styles.reviewLabel}>District</Text>
                  <Text style={styles.reviewVal}>{selectedDistrict?.name}</Text>
                </View>

                <View style={styles.reviewItem}>
                  <Text style={styles.reviewLabel}>Mandal</Text>
                  <Text style={styles.reviewVal}>{selectedMandal?.name}</Text>
                </View>

                <View style={styles.reviewDivider} />

                <Text style={styles.reviewHeader}>Skills Summary</Text>
                {selectedServices.length > 0 ? (
                  <View style={styles.skillsTagContainer}>
                    {selectedServices.map(sid => {
                      const sObj = allSystemServices.find(s => s.id === sid);
                      return sObj ? (
                        <View key={sid} style={styles.skillTag}>
                          <Text style={styles.skillTagText}>{sObj.title}</Text>
                        </View>
                      ) : null;
                    })}
                  </View>
                ) : (
                  <Text style={styles.reviewEmptyText}>No existing services selected</Text>
                )}

                {addCustomService && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={styles.reviewHeader}>Proposed Custom Service</Text>
                    <View style={styles.customServiceReview}>
                      <Text style={styles.customReviewTitle}>{customTitle}</Text>
                      <Text style={styles.customReviewSub}>{customSubtitle}</Text>
                      <Text style={styles.customReviewPrice}>₹{customPrice}</Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Submit Application Button */}
              <TouchableOpacity
                style={[styles.actionBtn, { marginTop: 16 }]}
                onPress={handleRegisterSubmit}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#F0C38E', '#F1AA9B']}
                  style={styles.actionBtnGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.actionBtnText}>Submit Registration Application</Text>
                      <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" style={{ marginLeft: 8 }} />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
        <Toast
          message={toastMsg}
          type={toastType}
          visible={toastVisible}
          onHide={() => setToastVisible(false)}
        />
      </KeyboardAvoidingView>

      {/* OTP Verification Modal Overlay */}
      {showOtpModal && (
        <View style={styles.otpOverlay}>
          <View style={styles.otpCard}>
            <View style={styles.otpHeaderArea}>
              <View style={styles.otpLogoWrapper}>
                <Ionicons name="construct-outline" size={32} color="#F0C38E" />
              </View>
              <Text style={styles.otpTitle}>Verify Mobile Number</Text>
              <Text style={styles.otpSubtitle}>We have sent a 6-digit SMS code to</Text>
              <Text style={styles.otpEmailText}>{phone}</Text>
            </View>

            <View style={styles.otpInputGroup}>
              <Text style={styles.otpInputLabel}>Enter Verification Code</Text>
              <View style={[styles.otpInputWrapper, otpError ? styles.otpInputWrapperError : null]}>
                <Ionicons name="shield-checkmark-outline" size={18} color={otpError ? '#EF4444' : '#6B7280'} style={styles.otpInputIcon} />
                <TextInput
                  style={styles.otpTextInput}
                  placeholder="123456"
                  placeholderTextColor="#A5A1B8"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otpCode}
                  onChangeText={(t) => { setOtpCode(t); setOtpError(''); }}
                  editable={!otpLoading}
                />
              </View>
              {otpError ? (
                <View style={styles.otpFieldErrorRow}>
                  <Ionicons name="information-circle-outline" size={13} color="#EF4444" />
                  <Text style={styles.otpFieldErrorText}>{otpError}</Text>
                </View>
              ) : null}
            </View>

            {/* Action Buttons */}
            <TouchableOpacity
              style={styles.otpVerifyButton}
              onPress={handleVerifyAndRegisterSubmit}
              disabled={otpLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#F0C38E', '#F1AA9B']}
                style={styles.otpVerifyButtonGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {otpLoading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <View style={styles.otpBtnContent}>
                    <Text style={styles.otpVerifyButtonText}>Verify & Submit Application</Text>
                    <Ionicons name="checkmark-circle-outline" size={16} color="#312C51" style={{ marginLeft: 8 }} />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.otpActionsRow}>
              <TouchableOpacity onPress={handleResendOtp} disabled={otpLoading} style={{ padding: 8 }}>
                <Text style={styles.otpResendText}>Resend Code</Text>
              </TouchableOpacity>
              <Text style={{ color: '#A5A1B8' }}>|</Text>
              <TouchableOpacity onPress={() => setShowOtpModal(false)} disabled={otpLoading} style={{ padding: 8 }}>
                <Text style={styles.otpCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

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
                      setErrors(prev => ({ ...prev, district: '' }));
                    }}
                  >
                    <Text style={styles.dropdownListItemText}>{d.name}</Text>
                    {selectedDistrict?.id === d.id && <Ionicons name="checkmark" size={18} color="#F0C38E" />}
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
                      setErrors(prev => ({ ...prev, mandal: '' }));
                    }}
                  >
                    <Text style={styles.dropdownListItemText}>{m.name}</Text>
                    {selectedMandal?.id === m.id && <Ionicons name="checkmark" size={18} color="#F0C38E" />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25213E',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#3D3762',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownDisabled: {
    backgroundColor: '#25213E',
    borderColor: '#3D3762',
    opacity: 0.5,
  },
  dropdownText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
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
  container: {
    flex: 1,
    backgroundColor: '#312C51',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
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
  formCard: {
    backgroundColor: '#48426D',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: '#3D3762',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  formHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  formSub: {
    fontSize: 12,
    color: '#A5A1B8',
    marginTop: 4,
    marginBottom: 20,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3D3762',
    borderRadius: 14,
    backgroundColor: '#25213E',
    paddingHorizontal: 14,
  },
  inputWrapperError: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  fieldErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    gap: 4,
  },
  fieldErrorText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 3,
  },
  actionBtn: {
    marginTop: 10,
    shadowColor: '#F0C38E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  actionBtnGrad: {
    borderRadius: 16,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    marginTop: 8,
  },
  sectionSubHeading: {
    fontSize: 13,
    color: '#A5A1B8',
    marginBottom: 16,
    fontWeight: '500',
  },
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    elevation: 1,
  },
  serviceSelectCardActive: {
    borderColor: '#F0C38E',
    backgroundColor: '#3A345B',
  },
  serviceSelectIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#25213E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceSelectIconBgActive: {
    backgroundColor: 'rgba(240, 195, 142, 0.2)',
  },
  serviceSelectTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  serviceSelectTitleActive: {
    color: '#F0C38E',
  },
  serviceSelectSubtitle: {
    fontSize: 12,
    color: '#A5A1B8',
    marginTop: 2,
  },
  serviceSelectSubtitleActive: {
    color: '#E5E7EB',
  },
  checkboxCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#3D3762',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCircleActive: {
    borderColor: '#F0C38E',
    backgroundColor: '#F0C38E',
  },
  customServiceToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 16,
  },
  customServiceToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  customInput: {
    borderWidth: 1,
    borderColor: '#3D3762',
    borderRadius: 12,
    backgroundColor: '#25213E',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#FFFFFF',
  },
  loadingSkillsContainer: {
    padding: 30,
    alignItems: 'center',
  },
  reviewCard: {
    backgroundColor: '#25213E',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#3D3762',
    marginBottom: 10,
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  reviewLabel: {
    fontSize: 13,
    color: '#A5A1B8',
    fontWeight: '600',
  },
  reviewVal: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  reviewDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  reviewHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#A5A1B8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  skillsTagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skillTag: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  skillTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7D32',
  },
  reviewEmptyText: {
    color: '#A5A1B8',
    fontSize: 12,
    fontStyle: 'italic',
  },
  customServiceReview: {
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#BBDEFB',
    marginTop: 4,
  },
  customReviewTitle: {
    fontSize: 13,
    fontWeight: '850',
    color: '#0D47A1',
  },
  customReviewSub: {
    fontSize: 11,
    color: '#1565C0',
    marginTop: 2,
  },
  customReviewPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D47A1',
    marginTop: 4,
  },
  otpOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(49, 44, 81, 0.98)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 9999,
  },
  otpCard: {
    backgroundColor: '#48426D',
    borderRadius: 28,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: '#3D3762',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  otpHeaderArea: {
    alignItems: 'center',
    marginBottom: 20,
  },
  otpLogoWrapper: {
    width: 70,
    height: 70,
    borderRadius: 20,
    backgroundColor: '#312C51',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#F0C38E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  otpTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  otpSubtitle: {
    fontSize: 13,
    color: '#A5A1B8',
    fontWeight: '500',
  },
  otpEmailText: {
    fontSize: 14,
    color: '#F0C38E',
    fontWeight: '700',
    marginTop: 2,
  },
  otpInputGroup: {
    marginBottom: 20,
  },
  otpInputLabel: {
    fontSize: 13,
    fontWeight: '750',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  otpInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3D3762',
    borderRadius: 14,
    backgroundColor: '#25213E',
    paddingHorizontal: 14,
  },
  otpInputWrapperError: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  otpInputIcon: {
    marginRight: 10,
  },
  otpTextInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 4,
    textAlign: 'center',
  },
  otpFieldErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    justifyContent: 'center',
    gap: 4,
  },
  otpFieldErrorText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '600',
  },
  otpVerifyButton: {
    marginTop: 5,
    shadowColor: '#F0C38E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  otpVerifyButtonGrad: {
    borderRadius: 16,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  otpVerifyButtonText: {
    color: '#312C51',
    fontSize: 15,
    fontWeight: '700',
  },
  otpActionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 16,
  },
  otpResendText: {
    fontSize: 13,
    color: '#F1AA9B',
    fontWeight: '700',
  },
  otpCancelText: {
    fontSize: 13,
    color: '#A5A1B8',
    fontWeight: '700',
  },
});
