import React, { useState } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import Toast from '../components/Toast';

export default function RegisterScreen({ onNavigateToLogin }) {
  const insets = useSafeAreaInsets();
  const { register } = useApp();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [mandalId, setMandalId] = useState('');
  const [districts, setDistricts] = useState([]);
  const [mandals, setMandals] = useState([]);
  const [districtDropdownOpen, setDistrictDropdownOpen] = useState(false);
  const [mandalDropdownOpen, setMandalDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState('error');

  const showToast = (msg, type = 'error') => {
    setToastMsg(msg);
    setToastType(type);
    setToastVisible(true);
  };

  React.useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const data = await api.get('/subscription/districts');
        setDistricts(data);
      } catch (err) {
        console.error('Failed to load districts:', err);
      }
    };
    fetchDistricts();
  }, []);

  React.useEffect(() => {
    const fetchMandals = async () => {
      if (!districtId) {
        setMandals([]);
        return;
      }
      try {
        const data = await api.get(`/subscription/mandals?districtId=${districtId}`);
        setMandals(data);
      } catch (err) {
        console.error('Failed to load mandals:', err);
      }
    };
    fetchMandals();
  }, [districtId]);

  // Password strength: 0=empty,1=weak,2=medium,3=strong
  const getPasswordStrength = (p) => {
    if (!p) return 0;
    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 10) score++;
    if (/[A-Z]/.test(p) && /[0-9]/.test(p)) score++;
    return score;
  };
  const strength = getPasswordStrength(password);
  const strengthLabel = ['', 'Weak', 'Medium', 'Strong'][strength];
  const strengthColor = ['#D1D5DB', '#EF4444', '#F59E0B', '#10B981'][strength];

  const clearAllErrors = () => {
    setNameError(''); setPhoneError('');
    setPasswordError(''); setConfirmError('');
  };

  const handleRegister = async () => {
    Keyboard.dismiss();
    clearAllErrors();
    let hasError = false;

    if (!name.trim()) {
      setNameError('Full name is required');
      hasError = true;
    } else if (name.trim().length < 2) {
      setNameError('Name must be at least 2 characters');
      hasError = true;
    }

    if (!phone.trim()) {
      setPhoneError('Phone number is required');
      hasError = true;
    } else if (phone.trim().replace(/\D/g, '').length < 10) {
      setPhoneError('Enter a valid 10-digit phone number');
      hasError = true;
    }

    if (!password) {
      setPasswordError('Password is required');
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      hasError = true;
    }

    if (!confirmPassword) {
      setConfirmError('Please confirm your password');
      hasError = true;
    } else if (password && confirmPassword && password !== confirmPassword) {
      setConfirmError('Passwords do not match');
      hasError = true;
    }

    if (hasError) {
      if (password && confirmPassword && password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
      } else {
        showToast('Please fix the errors below before continuing.', 'warning');
      }
      return;
    }

    setLoading(true);
    const result = await register(name.trim(), phone.trim(), password, referralCode ? referralCode.toUpperCase() : undefined, districtId || null, mandalId || null, address || null, email || null);
    setLoading(false);

    if (!result.success) {
      const msg = result.message || '';
      if (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('taken')) {
        showToast('User already exists. Please sign in instead.', 'error');
        setPhoneError('Phone number already registered');
      } else if (msg.toLowerCase().includes('server')) {
        showToast('Server error. Please try again later.', 'error');
      } else {
        showToast(msg || 'Registration failed. Please try again.', 'error');
      }
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
          {/* Header Graphic */}
          <View style={styles.headerArea}>
            <View style={styles.logoWrapper}>
              <Image
                source={require('../assets/logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>NextGen</Text>
            <Text style={styles.subtitle}>Power Care Smart Support</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.formHeading}>Create Account</Text>
            <Text style={styles.formSub}>Register to book slots and services</Text>

            {/* Full Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={[styles.inputWrapper, nameError ? styles.inputWrapperError : null]}>
                <Ionicons name="person-outline" size={18} color={nameError ? '#EF4444' : '#6B7280'} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="John Doe"
                  placeholderTextColor="#9CA3AF"
                  value={name}
                  onChangeText={(t) => { setName(t); setNameError(''); }}
                  editable={!loading}
                />
              </View>
              {nameError ? (
                <View style={styles.fieldErrorRow}>
                  <Ionicons name="information-circle-outline" size={13} color="#EF4444" />
                  <Text style={styles.fieldErrorText}>{nameError}</Text>
                </View>
              ) : null}
            </View>

            {/* Phone Number Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <View style={[styles.inputWrapper, phoneError ? styles.inputWrapperError : null]}>
                <Ionicons name="call-outline" size={18} color={phoneError ? '#EF4444' : '#6B7280'} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="+91 98765 43210"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={(t) => { setPhone(t); setPhoneError(''); }}
                  editable={!loading}
                />
              </View>
              {phoneError && phoneError.trim() ? (
                <View style={styles.fieldErrorRow}>
                  <Ionicons name="information-circle-outline" size={13} color="#EF4444" />
                  <Text style={styles.fieldErrorText}>{phoneError}</Text>
                </View>
              ) : null}
            </View>

            {/* Email Address Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={18} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter email address (optional)"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={(t) => setEmail(t)}
                  editable={!loading}
                />
              </View>
            </View>

            {/* District Dropdown */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>District</Text>
              <TouchableOpacity 
                style={[styles.inputWrapper, { paddingVertical: 12 }]}
                onPress={() => setDistrictDropdownOpen(!districtDropdownOpen)}
                disabled={loading}
              >
                <Ionicons name="map-outline" size={18} color="#6B7280" style={styles.inputIcon} />
                <Text style={[styles.textInput, { color: districtId ? '#111827' : '#9CA3AF' }]}>
                  {districts.find(d => d.id === districtId)?.name || 'Select District (Optional)'}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
              </TouchableOpacity>
              {districtDropdownOpen && (
                <View style={{ backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, marginTop: 4, maxHeight: 150 }}>
                  <ScrollView nestedScrollEnabled>
                    {districts.map(opt => (
                      <TouchableOpacity 
                        key={opt.id} 
                        style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}
                        onPress={() => {
                          setDistrictId(opt.id);
                          setMandalId(''); // reset mandal
                          setDistrictDropdownOpen(false);
                        }}
                      >
                        <Text style={{ color: '#374151' }}>{opt.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Mandal Dropdown */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mandal</Text>
              <TouchableOpacity 
                style={[styles.inputWrapper, { paddingVertical: 12, backgroundColor: !districtId ? '#E5E7EB' : '#F9FAFB' }]}
                onPress={() => setMandalDropdownOpen(!mandalDropdownOpen)}
                disabled={!districtId || loading}
              >
                <Ionicons name="location-outline" size={18} color="#6B7280" style={styles.inputIcon} />
                <Text style={[styles.textInput, { color: mandalId ? '#111827' : '#9CA3AF' }]}>
                  {mandals.find(m => m.id === mandalId)?.name || 'Select Mandal (Optional)'}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
              </TouchableOpacity>
              {mandalDropdownOpen && (
                <View style={{ backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, marginTop: 4, maxHeight: 150 }}>
                  <ScrollView nestedScrollEnabled>
                    {mandals.map(opt => (
                      <TouchableOpacity 
                        key={opt.id} 
                        style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}
                        onPress={() => {
                          setMandalId(opt.id);
                          setMandalDropdownOpen(false);
                        }}
                      >
                        <Text style={{ color: '#374151' }}>{opt.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Address Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Address</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="home-outline" size={18} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your address (optional)"
                  placeholderTextColor="#9CA3AF"
                  value={address}
                  onChangeText={(t) => setAddress(t)}
                  editable={!loading}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={[styles.inputWrapper, passwordError ? styles.inputWrapperError : null]}>
                <Ionicons name="lock-closed-outline" size={18} color={passwordError ? '#EF4444' : '#6B7280'} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Min. 6 characters"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(t) => { setPassword(t); setPasswordError(''); }}
                  editable={!loading}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
              {/* Password strength bar */}
              {password.length > 0 && (
                <View style={styles.strengthRow}>
                  <View style={styles.strengthBarTrack}>
                    <View style={[styles.strengthBarFill, { width: `${(strength / 3) * 100}%`, backgroundColor: strengthColor }]} />
                  </View>
                  <Text style={[styles.strengthLabel, { color: strengthColor }]}>{strengthLabel}</Text>
                </View>
              )}
              {passwordError ? (
                <View style={styles.fieldErrorRow}>
                  <Ionicons name="information-circle-outline" size={13} color="#EF4444" />
                  <Text style={styles.fieldErrorText}>{passwordError}</Text>
                </View>
              ) : null}
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={[styles.inputWrapper, confirmError ? styles.inputWrapperError : null]}>
                <Ionicons name="lock-closed-outline" size={18} color={confirmError ? '#EF4444' : '#6B7280'} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Confirm your password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={(t) => { setConfirmPassword(t); setConfirmError(''); }}
                  editable={!loading}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={{ padding: 4 }}>
                  <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
              {confirmError ? (
                <View style={styles.fieldErrorRow}>
                  <Ionicons name="information-circle-outline" size={13} color="#EF4444" />
                  <Text style={styles.fieldErrorText}>{confirmError}</Text>
                </View>
              ) : null}
            </View>

            {/* Referral Code Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Referral Code (Optional)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="people-outline" size={18} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter 7-digit code"
                  placeholderTextColor="#9CA3AF"
                  value={referralCode}
                  onChangeText={(t) => setReferralCode(t.toUpperCase())}
                  maxLength={7}
                  editable={!loading}
                />
              </View>
            </View>

            {/* Action Button */}
            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#00B894', '#0984E3']}
                style={styles.registerButtonGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <View style={styles.btnContent}>
                    <Text style={styles.registerButtonText}>Register</Text>
                    <Ionicons name="arrow-forward" size={16} color="#FFF" style={{ marginLeft: 8 }} />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Sign In Navigation Toggle */}
            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={onNavigateToLogin} disabled={loading}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
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
    backgroundColor: '#F5F7FB',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoWrapper: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#00B894',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 184, 148, 0.15)',
  },
  logoImage: {
    width: 76,
    height: 76,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 4,
  },
  formCard: {
    backgroundColor: '#FFF',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  formHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  formSub: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 20,
    fontWeight: '500',
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#FECACA',
  },
  alertText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
  inputWrapperError: {
    borderColor: '#EF4444',
    backgroundColor: '#FFF5F5',
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
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  strengthBarTrack: {
    flex: 1,
    height: 5,
    backgroundColor: '#E5E7EB',
    borderRadius: 99,
    overflow: 'hidden',
  },
  strengthBarFill: {
    height: 5,
    borderRadius: 99,
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: '700',
    minWidth: 44,
    textAlign: 'right',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  registerButton: {
    marginTop: 10,
    shadowColor: '#00B894',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  registerButtonGrad: {
    borderRadius: 16,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  loginLink: {
    fontSize: 13,
    color: '#0984E3',
    fontWeight: '700',
  },
});
