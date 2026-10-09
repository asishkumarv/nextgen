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
  Image,
  Keyboard,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import Toast from '../components/Toast';

export default function RegisterScreen({ onNavigateToLogin, initialPhone = '' }) {
  const insets = useSafeAreaInsets();
  const { register } = useApp();

  // Multi-step state: 1 = Phone & OTP, 2 = Profile, 3 = Location, 4 = Password & Finish
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Phone & OTP States
  const [phone, setPhone] = useState(initialPhone || '');
  const [phoneError, setPhoneError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [existingUserFound, setExistingUserFound] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Step 2: Personal Information States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');

  // Step 3: Location States
  const [districtId, setDistrictId] = useState('');
  const [mandalId, setMandalId] = useState('');
  const [address, setAddress] = useState('');
  const [districts, setDistricts] = useState([]);
  const [mandals, setMandals] = useState([]);
  const [districtSearch, setDistrictSearch] = useState('');
  const [mandalSearch, setMandalSearch] = useState('');
  const [districtModalOpen, setDistrictModalOpen] = useState(false);
  const [mandalModalOpen, setMandalModalOpen] = useState(false);
  const [locationError, setLocationError] = useState('');

  // Step 4: Password States
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');

  // General Loading & Toast
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState('error');

  const showToast = (msg, type = 'error') => {
    setToastMsg(msg);
    setToastType(type);
    setToastVisible(true);
  };

  // Fetch districts on mount
  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const data = await api.get('/subscription/districts');
        setDistricts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load districts:', err);
      }
    };
    fetchDistricts();
  }, []);

  // Fetch mandals when district changes
  useEffect(() => {
    const fetchMandals = async () => {
      if (!districtId) {
        setMandals([]);
        return;
      }
      try {
        const data = await api.get(`/subscription/mandals?districtId=${districtId}`);
        setMandals(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load mandals:', err);
      }
    };
    fetchMandals();
  }, [districtId]);

  // Countdown timer for resend OTP
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Password strength calculation
  const getPasswordStrength = (p) => {
    if (!p) return 0;
    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 8 && /[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p) && /[^A-Za-z0-9]/.test(p)) score++;
    return score;
  };
  const strength = getPasswordStrength(password);
  const strengthLabel = ['', 'Weak', 'Good', 'Strong'][strength] || 'Weak';
  const strengthColor = ['#3D3762', '#EF4444', '#F59E0B', '#10B981'][strength] || '#3D3762';

  // --- STEP 1: SEND & VERIFY OTP ---
  const handleSendOtp = async () => {
    Keyboard.dismiss();
    setPhoneError('');
    setExistingUserFound(false);

    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (!cleanPhone) {
      setPhoneError('Mobile number is required');
      return;
    }
    if (cleanPhone.length !== 10) {
      setPhoneError('Please enter a valid 10-digit mobile number');
      return;
    }

    setOtpLoading(true);
    try {
      const res = await api.post('/auth/send-otp', {
        phone: cleanPhone,
        type: 'user',
      });
      setOtpLoading(false);
      if (res.success) {
        setOtpSent(true);
        setOtpCode('');
        setOtpError('');
        setCountdown(30);
        showToast(`SMS verification code sent to ending in ${cleanPhone.slice(-4)}`, 'success');
      } else {
        const msg = res.message || 'Failed to send SMS verification code';
        if (msg.toLowerCase().includes('already exists')) {
          setExistingUserFound(true);
          setPhoneError('This phone number is already registered. Please sign in instead.');
        } else {
          showToast(msg, 'error');
        }
      }
    } catch (err) {
      setOtpLoading(false);
      const msg = err.message || 'Failed to send SMS verification code';
      if (msg.toLowerCase().includes('already exists')) {
        setExistingUserFound(true);
        setPhoneError('This phone number is already registered. Please sign in instead.');
      } else {
        showToast(msg, 'error');
      }
    }
  };

  const handleVerifyOtp = async () => {
    Keyboard.dismiss();
    setOtpError('');
    const cleanOtp = otpCode.trim();
    if (!cleanOtp) {
      setOtpError('Please enter the 6-digit verification code');
      return;
    }
    if (cleanOtp.length < 6) {
      setOtpError('Verification code must be 6 digits');
      return;
    }

    setOtpLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', {
        phone: phone.trim().replace(/\D/g, ''),
        otp: cleanOtp,
      });
      setOtpLoading(false);
      if (res.success) {
        setPhoneVerified(true);
        showToast('Phone verified successfully!', 'success');
        setTimeout(() => {
          setCurrentStep(2);
        }, 500);
      } else {
        setOtpError(res.message || 'Invalid verification code');
      }
    } catch (err) {
      setOtpLoading(false);
      setOtpError(err.message || 'Invalid or expired SMS code');
    }
  };

  // --- STEP 2: VALIDATE PERSONAL DETAILS ---
  const handleProceedToLocation = () => {
    Keyboard.dismiss();
    setNameError('');
    setEmailError('');
    let hasErr = false;

    if (!name.trim()) {
      setNameError('Full name is required');
      hasErr = true;
    } else if (name.trim().length < 2) {
      setNameError('Name must be at least 2 characters');
      hasErr = true;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError('Email address is required');
      hasErr = true;
    } else if (!emailRegex.test(email.trim())) {
      setEmailError('Please enter a valid email address');
      hasErr = true;
    }

    if (hasErr) return;
    setCurrentStep(3);
  };

  // --- STEP 3: VALIDATE LOCATION ---
  const handleProceedToPassword = () => {
    Keyboard.dismiss();
    setLocationError('');
    if (!districtId) {
      setLocationError('Please select your district');
      return;
    }
    if (!mandalId) {
      setLocationError('Please select your mandal');
      return;
    }
    setCurrentStep(4);
  };

  // --- STEP 4: COMPLETE REGISTRATION ---
  const handleCompleteRegistration = async () => {
    Keyboard.dismiss();
    setPasswordError('');
    setConfirmError('');
    let hasErr = false;

    if (!password) {
      setPasswordError('Password is required');
      hasErr = true;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      hasErr = true;
    }

    if (!confirmPassword) {
      setConfirmError('Please confirm your password');
      hasErr = true;
    } else if (password !== confirmPassword) {
      setConfirmError('Passwords do not match');
      hasErr = true;
    }

    if (hasErr) return;

    setSubmitting(true);
    const cleanPhone = phone.trim().replace(/\D/g, '');
    const result = await register(
      name.trim(),
      cleanPhone,
      password,
      referralCode.trim() ? referralCode.trim().toUpperCase() : undefined,
      districtId,
      mandalId,
      address.trim() || null,
      email.trim(),
      otpCode.trim()
    );
    setSubmitting(false);

    if (result.success) {
      showToast('Registration successful! Welcome to Go Fixit.', 'success');
      // Context will auto load app data and navigate to home screen
    } else {
      showToast(result.message || 'Registration failed. Please try again.', 'error');
    }
  };

  const selectedDistrictName = districts.find((d) => d.id === districtId)?.name || 'Select District';
  const selectedMandalName = mandals.find((m) => m.id === mandalId)?.name || 'Select Mandal';

  const filteredDistricts = districts.filter((d) =>
    (d.name || '').toLowerCase().includes(districtSearch.toLowerCase())
  );
  const filteredMandals = mandals.filter((m) =>
    (m.name || '').toLowerCase().includes(mandalSearch.toLowerCase())
  );

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
          {/* Header Area */}
          <View style={styles.headerArea}>
            <View style={styles.logoRow}>
              <View style={styles.logoSmallWrapper}>
                <Image
                  source={require('../assets/GoFixit.png')}
                  style={styles.logoSmallImage}
                  resizeMode="contain"
                />
              </View>
              <View>
                <Text style={styles.appTitle}>Go Fixit</Text>
                <Text style={styles.appSubtitle}>Smart Support Registration</Text>
              </View>
            </View>

            {/* Step Progress Tracker */}
            <View style={styles.progressContainer}>
              <View style={styles.stepHeaderRow}>
                <Text style={styles.stepBadgeText}>STEP {currentStep} OF 4</Text>
                <Text style={styles.stepTitleText}>
                  {currentStep === 1 && 'Mobile Verification'}
                  {currentStep === 2 && 'Personal Details'}
                  {currentStep === 3 && 'Service Location'}
                  {currentStep === 4 && 'Account Security'}
                </Text>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarTrack}>
                <LinearGradient
                  colors={['#F0C38E', '#F1AA9B']}
                  style={[styles.progressBarFill, { width: `${currentStep * 25}%` }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>

              {/* Step Dots */}
              <View style={styles.dotsRow}>
                {[1, 2, 3, 4].map((stepNum) => {
                  const isActive = stepNum === currentStep;
                  const isCompleted = stepNum < currentStep;
                  return (
                    <View key={stepNum} style={styles.dotItem}>
                      <View
                        style={[
                          styles.dotCircle,
                          isCompleted && styles.dotCircleCompleted,
                          isActive && styles.dotCircleActive,
                        ]}
                      >
                        {isCompleted ? (
                          <Ionicons name="checkmark" size={12} color="#312C51" />
                        ) : (
                          <Text
                            style={[
                              styles.dotNumber,
                              isActive && styles.dotNumberActive,
                            ]}
                          >
                            {stepNum}
                          </Text>
                        )}
                      </View>
                      <Text
                        style={[
                          styles.dotLabel,
                          (isActive || isCompleted) && styles.dotLabelActive,
                        ]}
                      >
                        {stepNum === 1 ? 'Mobile' : stepNum === 2 ? 'Profile' : stepNum === 3 ? 'Location' : 'Security'}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Form Wizard Card */}
          <View style={styles.wizardCard}>
            {/* STEP 1: MOBILE OTP VERIFICATION */}
            {currentStep === 1 && (
              <View>
                <View style={styles.stepTitleHeader}>
                  <View style={styles.stepIconCircle}>
                    <Ionicons name="shield-checkmark" size={22} color="#312C51" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardHeading}>Verify Mobile Number</Text>
                    <Text style={styles.cardSub}>
                      {otpSent
                        ? `Enter the 6-digit SMS code sent to ending in ${phone.slice(-4)}`
                        : 'First-time users verify their mobile phone before creating an account'}
                    </Text>
                  </View>
                </View>

                {/* Existing user alert card */}
                {existingUserFound && (
                  <View style={styles.existingUserCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <Ionicons name="information-circle" size={20} color="#F0C38E" style={{ marginRight: 6 }} />
                      <Text style={styles.existingUserTitle}>Account Already Registered</Text>
                    </View>
                    <Text style={styles.existingUserText}>
                      A Go Fixit account with this mobile number already exists. You can log in using either your Password or an SMS OTP!
                    </Text>
                    <View style={styles.existingUserActions}>
                      <TouchableOpacity
                        style={styles.existingUserBtn}
                        onPress={() => onNavigateToLogin && onNavigateToLogin({ phone: phone.trim(), method: 'otp' })}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="chatbox-ellipses-outline" size={14} color="#312C51" style={{ marginRight: 4 }} />
                        <Text style={styles.existingUserBtnText}>Sign In with OTP</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.existingUserBtn, { backgroundColor: '#3D3762' }]}
                        onPress={() => onNavigateToLogin && onNavigateToLogin({ phone: phone.trim(), method: 'password' })}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="key-outline" size={14} color="#F0C38E" style={{ marginRight: 4 }} />
                        <Text style={[styles.existingUserBtnText, { color: '#F0C38E' }]}>Sign In with Password</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Phone Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Mobile Phone Number</Text>
                  <View style={[styles.inputWrapper, phoneError ? styles.inputWrapperError : null]}>
                    <View style={styles.countryBadge}>
                      <Text style={styles.countryBadgeText}>+91</Text>
                    </View>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter 10-digit mobile"
                      placeholderTextColor="#A5A1B8"
                      keyboardType="phone-pad"
                      maxLength={10}
                      value={phone}
                      onChangeText={(t) => {
                        setPhone(t.replace(/\D/g, ''));
                        setPhoneError('');
                        setExistingUserFound(false);
                      }}
                      editable={!otpLoading && !otpSent}
                    />
                    {phoneVerified && (
                      <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                    )}
                  </View>
                  {phoneError ? (
                    <View style={styles.fieldErrorRow}>
                      <Ionicons name="alert-circle" size={13} color="#EF4444" />
                      <Text style={styles.fieldErrorText}>{phoneError}</Text>
                    </View>
                  ) : null}
                </View>

                {/* When OTP sent: Show OTP Input */}
                {otpSent && (
                  <View style={styles.inputGroup}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={[styles.inputLabel, { marginBottom: 0 }]}>6-Digit Verification Code</Text>
                      <TouchableOpacity
                        onPress={() => {
                          setOtpSent(false);
                          setOtpCode('');
                          setOtpError('');
                        }}
                      >
                        <Text style={styles.editPhoneLink}>Change Number</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={[styles.inputWrapper, otpError ? styles.inputWrapperError : null]}>
                      <Ionicons name="shield-outline" size={18} color={otpError ? '#EF4444' : '#6B7280'} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.textInput, styles.otpTextInput]}
                        placeholder="123456"
                        placeholderTextColor="#A5A1B8"
                        keyboardType="number-pad"
                        maxLength={6}
                        value={otpCode}
                        onChangeText={(t) => {
                          setOtpCode(t);
                          setOtpError('');
                        }}
                        editable={!otpLoading}
                      />
                    </View>
                    {otpError ? (
                      <View style={styles.fieldErrorRow}>
                        <Ionicons name="alert-circle" size={13} color="#EF4444" />
                        <Text style={styles.fieldErrorText}>{otpError}</Text>
                      </View>
                    ) : null}

                    {/* Resend OTP Row */}
                    <View style={styles.resendOtpRow}>
                      {countdown > 0 ? (
                        <Text style={styles.resendTimerText}>
                          Resend code in <Text style={{ color: '#F0C38E', fontWeight: '700' }}>{countdown}s</Text>
                        </Text>
                      ) : (
                        <TouchableOpacity onPress={handleSendOtp} disabled={otpLoading}>
                          <Text style={styles.resendLinkText}>Resend SMS Code</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}

                {/* Action Button */}
                {!otpSent ? (
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={handleSendOtp}
                    disabled={otpLoading}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#F0C38E', '#F1AA9B']}
                      style={styles.primaryBtnGrad}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      {otpLoading ? (
                        <ActivityIndicator color="#312C51" size="small" />
                      ) : (
                        <View style={styles.btnContent}>
                          <Text style={styles.primaryBtnText}>Send Verification SMS</Text>
                          <Ionicons name="arrow-forward" size={18} color="#312C51" style={{ marginLeft: 6 }} />
                        </View>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={handleVerifyOtp}
                    disabled={otpLoading}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#F0C38E', '#F1AA9B']}
                      style={styles.primaryBtnGrad}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      {otpLoading ? (
                        <ActivityIndicator color="#312C51" size="small" />
                      ) : (
                        <View style={styles.btnContent}>
                          <Text style={styles.primaryBtnText}>Verify & Proceed</Text>
                          <Ionicons name="checkmark-done" size={18} color="#312C51" style={{ marginLeft: 6 }} />
                        </View>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* STEP 2: PERSONAL INFORMATION */}
            {currentStep === 2 && (
              <View>
                <View style={styles.stepTitleHeader}>
                  <View style={styles.stepIconCircle}>
                    <Ionicons name="person" size={22} color="#312C51" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardHeading}>Personal Information</Text>
                    <Text style={styles.cardSub}>Tell us your full name and email for your account profile</Text>
                  </View>
                </View>

                {/* Phone Verified Pill */}
                <View style={styles.verifiedPhoneBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" style={{ marginRight: 6 }} />
                  <Text style={styles.verifiedPhoneText}>Verified Mobile: +91 {phone}</Text>
                </View>

                {/* Name Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <View style={[styles.inputWrapper, nameError ? styles.inputWrapperError : null]}>
                    <Ionicons name="person-outline" size={18} color={nameError ? '#EF4444' : '#6B7280'} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Ramesh Kumar"
                      placeholderTextColor="#A5A1B8"
                      value={name}
                      onChangeText={(t) => {
                        setName(t);
                        setNameError('');
                      }}
                      editable={!submitting}
                    />
                  </View>
                  {nameError ? (
                    <View style={styles.fieldErrorRow}>
                      <Ionicons name="alert-circle" size={13} color="#EF4444" />
                      <Text style={styles.fieldErrorText}>{nameError}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Email Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <View style={[styles.inputWrapper, emailError ? styles.inputWrapperError : null]}>
                    <Ionicons name="mail-outline" size={18} color={emailError ? '#EF4444' : '#6B7280'} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. ramesh@example.com"
                      placeholderTextColor="#A5A1B8"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={email}
                      onChangeText={(t) => {
                        setEmail(t);
                        setEmailError('');
                      }}
                      editable={!submitting}
                    />
                  </View>
                  {emailError ? (
                    <View style={styles.fieldErrorRow}>
                      <Ionicons name="alert-circle" size={13} color="#EF4444" />
                      <Text style={styles.fieldErrorText}>{emailError}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Referral Code (Optional) */}
                <View style={styles.inputGroup}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={[styles.inputLabel, { marginBottom: 0, marginRight: 6 }]}>Referral Code</Text>
                    <Text style={{ fontSize: 11, color: '#F0C38E', fontWeight: '600' }}>(Optional - Get ₹50 Bonus)</Text>
                  </View>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="gift-outline" size={18} color="#F0C38E" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. NGPC-1234"
                      placeholderTextColor="#A5A1B8"
                      autoCapitalize="characters"
                      value={referralCode}
                      onChangeText={(t) => setReferralCode(t.toUpperCase())}
                      editable={!submitting}
                    />
                  </View>
                </View>

                {/* Buttons Row */}
                <View style={styles.stepBtnRow}>
                  <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => setCurrentStep(1)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="arrow-back" size={16} color="#A5A1B8" style={{ marginRight: 4 }} />
                    <Text style={styles.backBtnText}>Back</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.primaryBtn, { flex: 1, marginTop: 0 }]}
                    onPress={handleProceedToLocation}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#F0C38E', '#F1AA9B']}
                      style={styles.primaryBtnGrad}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <View style={styles.btnContent}>
                        <Text style={styles.primaryBtnText}>Continue to Location</Text>
                        <Ionicons name="arrow-forward" size={16} color="#312C51" style={{ marginLeft: 6 }} />
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* STEP 3: LOCATION & ADDRESS */}
            {currentStep === 3 && (
              <View>
                <View style={styles.stepTitleHeader}>
                  <View style={styles.stepIconCircle}>
                    <Ionicons name="location" size={22} color="#312C51" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardHeading}>Select Your Location</Text>
                    <Text style={styles.cardSub}>Choose your district and mandal so we can connect you with local support</Text>
                  </View>
                </View>

                {locationError ? (
                  <View style={styles.alertBox}>
                    <Ionicons name="alert-circle" size={16} color="#EF4444" style={{ marginRight: 6 }} />
                    <Text style={styles.alertText}>{locationError}</Text>
                  </View>
                ) : null}

                {/* District Selector */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>District</Text>
                  <TouchableOpacity
                    style={styles.pickerSelector}
                    onPress={() => {
                      setDistrictSearch('');
                      setDistrictModalOpen(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="map-outline" size={18} color="#F0C38E" style={styles.inputIcon} />
                    <Text style={[styles.pickerSelectorText, districtId ? { color: '#FFFFFF' } : null]}>
                      {selectedDistrictName}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color="#A5A1B8" />
                  </TouchableOpacity>
                </View>

                {/* Mandal Selector */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Mandal</Text>
                  <TouchableOpacity
                    style={[styles.pickerSelector, !districtId && { opacity: 0.6 }]}
                    onPress={() => {
                      if (!districtId) {
                        showToast('Please select a district first', 'warning');
                        return;
                      }
                      setMandalSearch('');
                      setMandalModalOpen(true);
                    }}
                    disabled={!districtId}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="navigate-outline" size={18} color="#F0C38E" style={styles.inputIcon} />
                    <Text style={[styles.pickerSelectorText, mandalId ? { color: '#FFFFFF' } : null]}>
                      {selectedMandalName}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color="#A5A1B8" />
                  </TouchableOpacity>
                </View>

                {/* Detailed Address */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Address / Landmark (Optional)</Text>
                  <View style={[styles.inputWrapper, { height: 75, alignItems: 'flex-start', paddingTop: 10 }]}>
                    <Ionicons name="home-outline" size={18} color="#6B7280" style={[styles.inputIcon, { marginTop: 2 }]} />
                    <TextInput
                      style={[styles.textInput, { height: 55, textAlignVertical: 'top' }]}
                      placeholder="Door No, Street name, Landmark..."
                      placeholderTextColor="#A5A1B8"
                      multiline
                      value={address}
                      onChangeText={setAddress}
                      editable={!submitting}
                    />
                  </View>
                </View>

                {/* Buttons Row */}
                <View style={styles.stepBtnRow}>
                  <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => setCurrentStep(2)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="arrow-back" size={16} color="#A5A1B8" style={{ marginRight: 4 }} />
                    <Text style={styles.backBtnText}>Back</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.primaryBtn, { flex: 1, marginTop: 0 }]}
                    onPress={handleProceedToPassword}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#F0C38E', '#F1AA9B']}
                      style={styles.primaryBtnGrad}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <View style={styles.btnContent}>
                        <Text style={styles.primaryBtnText}>Continue to Security</Text>
                        <Ionicons name="arrow-forward" size={16} color="#312C51" style={{ marginLeft: 6 }} />
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* STEP 4: PASSWORD & FINISH */}
            {currentStep === 4 && (
              <View>
                <View style={styles.stepTitleHeader}>
                  <View style={styles.stepIconCircle}>
                    <Ionicons name="lock-closed" size={22} color="#312C51" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardHeading}>Account Security</Text>
                    <Text style={styles.cardSub}>Set a password for signing in. You can also sign in anytime using SMS OTP.</Text>
                  </View>
                </View>

                {/* Summary Card */}
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>Account Overview</Text>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Mobile:</Text>
                    <Text style={styles.summaryValue}>+91 {phone} (Verified)</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Name:</Text>
                    <Text style={styles.summaryValue}>{name}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Location:</Text>
                    <Text style={styles.summaryValue}>{selectedMandalName}, {selectedDistrictName}</Text>
                  </View>
                </View>

                {/* Password Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Create Password</Text>
                  <View style={[styles.inputWrapper, passwordError ? styles.inputWrapperError : null]}>
                    <Ionicons name="lock-closed-outline" size={18} color={passwordError ? '#EF4444' : '#6B7280'} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="At least 6 characters"
                      placeholderTextColor="#A5A1B8"
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={(t) => {
                        setPassword(t);
                        setPasswordError('');
                      }}
                      editable={!submitting}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                      <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#6B7280" />
                    </TouchableOpacity>
                  </View>

                  {/* Password Strength Meter */}
                  {password.length > 0 && (
                    <View style={styles.strengthContainer}>
                      <View style={styles.strengthTrack}>
                        <View style={[styles.strengthFill, { width: `${(strength / 3) * 100}%`, backgroundColor: strengthColor }]} />
                      </View>
                      <Text style={[styles.strengthLabelText, { color: strengthColor }]}>{strengthLabel}</Text>
                    </View>
                  )}

                  {passwordError ? (
                    <View style={styles.fieldErrorRow}>
                      <Ionicons name="alert-circle" size={13} color="#EF4444" />
                      <Text style={styles.fieldErrorText}>{passwordError}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Confirm Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Confirm Password</Text>
                  <View style={[styles.inputWrapper, confirmError ? styles.inputWrapperError : null]}>
                    <Ionicons name="lock-closed-outline" size={18} color={confirmError ? '#EF4444' : '#6B7280'} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Re-enter password"
                      placeholderTextColor="#A5A1B8"
                      secureTextEntry={!showConfirmPassword}
                      value={confirmPassword}
                      onChangeText={(t) => {
                        setConfirmPassword(t);
                        setConfirmError('');
                      }}
                      editable={!submitting}
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={{ padding: 4 }}>
                      <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                  {confirmError ? (
                    <View style={styles.fieldErrorRow}>
                      <Ionicons name="alert-circle" size={13} color="#EF4444" />
                      <Text style={styles.fieldErrorText}>{confirmError}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Buttons Row */}
                <View style={styles.stepBtnRow}>
                  <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => setCurrentStep(3)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="arrow-back" size={16} color="#A5A1B8" style={{ marginRight: 4 }} />
                    <Text style={styles.backBtnText}>Back</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.primaryBtn, { flex: 1, marginTop: 0 }]}
                    onPress={handleCompleteRegistration}
                    disabled={submitting}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#F0C38E', '#F1AA9B']}
                      style={styles.primaryBtnGrad}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      {submitting ? (
                        <ActivityIndicator color="#312C51" size="small" />
                      ) : (
                        <View style={styles.btnContent}>
                          <Text style={styles.primaryBtnText}>Complete & Sign In</Text>
                          <Ionicons name="rocket-outline" size={18} color="#312C51" style={{ marginLeft: 6 }} />
                        </View>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Sign In Navigation Link */}
            <View style={styles.signinRow}>
              <Text style={styles.signinText}>Already have an account? </Text>
              <TouchableOpacity
                onPress={() => onNavigateToLogin && onNavigateToLogin({ phone: phone.trim() })}
                disabled={submitting || otpLoading}
              >
                <Text style={styles.signinLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* DISTRICT PICKER MODAL */}
        <Modal visible={districtModalOpen} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { maxHeight: '75%' }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select District</Text>
                <TouchableOpacity onPress={() => setDistrictModalOpen(false)}>
                  <Ionicons name="close-circle" size={24} color="#A5A1B8" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalSearchWrapper}>
                <Ionicons name="search" size={18} color="#A5A1B8" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.modalSearchInput}
                  placeholder="Search district..."
                  placeholderTextColor="#A5A1B8"
                  value={districtSearch}
                  onChangeText={setDistrictSearch}
                />
              </View>

              <ScrollView style={{ marginTop: 10 }}>
                {filteredDistricts.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.modalListItem,
                      districtId === item.id && styles.modalListItemActive,
                    ]}
                    onPress={() => {
                      setDistrictId(item.id);
                      setMandalId('');
                      setDistrictModalOpen(false);
                      setLocationError('');
                    }}
                  >
                    <Text
                      style={[
                        styles.modalListItemText,
                        districtId === item.id && styles.modalListItemTextActive,
                      ]}
                    >
                      {item.name}
                    </Text>
                    {districtId === item.id && (
                      <Ionicons name="checkmark-circle" size={18} color="#312C51" />
                    )}
                  </TouchableOpacity>
                ))}
                {filteredDistricts.length === 0 && (
                  <Text style={styles.modalEmptyText}>No districts found</Text>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* MANDAL PICKER MODAL */}
        <Modal visible={mandalModalOpen} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { maxHeight: '75%' }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Mandal</Text>
                <TouchableOpacity onPress={() => setMandalModalOpen(false)}>
                  <Ionicons name="close-circle" size={24} color="#A5A1B8" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalSearchWrapper}>
                <Ionicons name="search" size={18} color="#A5A1B8" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.modalSearchInput}
                  placeholder="Search mandal..."
                  placeholderTextColor="#A5A1B8"
                  value={mandalSearch}
                  onChangeText={setMandalSearch}
                />
              </View>

              <ScrollView style={{ marginTop: 10 }}>
                {filteredMandals.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.modalListItem,
                      mandalId === item.id && styles.modalListItemActive,
                    ]}
                    onPress={() => {
                      setMandalId(item.id);
                      setMandalModalOpen(false);
                      setLocationError('');
                    }}
                  >
                    <Text
                      style={[
                        styles.modalListItemText,
                        mandalId === item.id && styles.modalListItemTextActive,
                      ]}
                    >
                      {item.name}
                    </Text>
                    {mandalId === item.id && (
                      <Ionicons name="checkmark-circle" size={18} color="#312C51" />
                    )}
                  </TouchableOpacity>
                ))}
                {filteredMandals.length === 0 && (
                  <Text style={styles.modalEmptyText}>No mandals found for this district</Text>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <Toast
          message={toastMsg}
          type={toastType}
          visible={toastVisible}
          onHide={() => setToastVisible(false)}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#312C51',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  headerArea: {
    marginBottom: 20,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoSmallWrapper: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#48426D',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#3D3762',
  },
  logoSmallImage: {
    width: 34,
    height: 34,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 12,
    color: '#A5A1B8',
    fontWeight: '500',
  },
  progressContainer: {
    backgroundColor: '#48426D',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#3D3762',
  },
  stepHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F0C38E',
    letterSpacing: 0.5,
  },
  stepTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#25213E',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dotItem: {
    alignItems: 'center',
    flex: 1,
  },
  dotCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#25213E',
    borderWidth: 1,
    borderColor: '#3D3762',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  dotCircleCompleted: {
    backgroundColor: '#F0C38E',
    borderColor: '#F0C38E',
  },
  dotCircleActive: {
    borderColor: '#F0C38E',
    backgroundColor: '#312C51',
    borderWidth: 2,
  },
  dotNumber: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A5A1B8',
  },
  dotNumberActive: {
    color: '#F0C38E',
  },
  dotLabel: {
    fontSize: 10,
    color: '#A5A1B8',
    fontWeight: '500',
  },
  dotLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  wizardCard: {
    backgroundColor: '#48426D',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: '#3D3762',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  stepTitleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F0C38E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cardSub: {
    fontSize: 12,
    color: '#A5A1B8',
    marginTop: 2,
    fontWeight: '500',
    lineHeight: 16,
  },
  existingUserCard: {
    backgroundColor: 'rgba(240, 195, 142, 0.12)',
    borderWidth: 1,
    borderColor: '#F0C38E',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  existingUserTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F0C38E',
  },
  existingUserText: {
    fontSize: 12,
    color: '#FFFFFF',
    lineHeight: 17,
    marginBottom: 12,
  },
  existingUserActions: {
    flexDirection: 'row',
    gap: 8,
  },
  existingUserBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F0C38E',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  existingUserBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#312C51',
  },
  verifiedPhoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  verifiedPhoneText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
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
  countryBadge: {
    backgroundColor: '#3D3762',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    marginRight: 10,
  },
  countryBadgeText: {
    color: '#F0C38E',
    fontWeight: '700',
    fontSize: 13,
  },
  inputWrapperError: {
    borderColor: '#EF4444',
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
  otpTextInput: {
    letterSpacing: 4,
    fontWeight: '700',
    fontSize: 16,
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
  },
  editPhoneLink: {
    color: '#F0C38E',
    fontSize: 12,
    fontWeight: '700',
  },
  resendOtpRow: {
    alignItems: 'center',
    marginTop: 10,
  },
  resendTimerText: {
    fontSize: 12,
    color: '#A5A1B8',
  },
  resendLinkText: {
    fontSize: 12,
    color: '#F0C38E',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  pickerSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3D3762',
    borderRadius: 14,
    backgroundColor: '#25213E',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  pickerSelectorText: {
    flex: 1,
    fontSize: 14,
    color: '#A5A1B8',
    fontWeight: '500',
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  alertText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  strengthTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#25213E',
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthLabelText: {
    fontSize: 11,
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: '#25213E',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3D3762',
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F0C38E',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#A5A1B8',
  },
  summaryValue: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  stepBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#25213E',
    borderWidth: 1,
    borderColor: '#3D3762',
  },
  backBtnText: {
    color: '#A5A1B8',
    fontSize: 14,
    fontWeight: '700',
  },
  primaryBtn: {
    marginTop: 8,
    shadowColor: '#F0C38E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnGrad: {
    borderRadius: 14,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#312C51',
    fontSize: 15,
    fontWeight: '800',
  },
  signinRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  signinText: {
    fontSize: 13,
    color: '#A5A1B8',
    fontWeight: '500',
  },
  signinLink: {
    fontSize: 13,
    color: '#F0C38E',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#48426D',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#3D3762',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalSearchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25213E',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#3D3762',
  },
  modalSearchInput: {
    flex: 1,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
  },
  modalListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
  },
  modalListItemActive: {
    backgroundColor: '#F0C38E',
  },
  modalListItemText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalListItemTextActive: {
    color: '#312C51',
    fontWeight: '800',
  },
  modalEmptyText: {
    textAlign: 'center',
    color: '#A5A1B8',
    paddingVertical: 20,
    fontSize: 13,
  },
});
