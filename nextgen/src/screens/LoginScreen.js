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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import Toast from '../components/Toast';

export default function LoginScreen({ onNavigateToRegister }) {
  const insets = useSafeAreaInsets();
  const { login } = useApp();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState('error');

  const showToast = (msg, type = 'error') => {
    setToastMsg(msg);
    setToastType(type);
    setToastVisible(true);
  };

  const clearFieldErrors = () => {
    setPhoneError('');
    setPasswordError('');
  };

  const handleLogin = async () => {
    clearFieldErrors();
    let hasError = false;

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
    }

    if (hasError) {
      showToast('Please fix the errors below before continuing.', 'warning');
      return;
    }

    setLoading(true);
    const result = await login(phone.trim(), password);
    setLoading(false);

    if (!result.success) {
      const msg = result.message || '';
      if (msg.toLowerCase().includes('does not exist') || msg.toLowerCase().includes('not exist') || msg.toLowerCase().includes('register to login')) {
        showToast('User does not exist. Please register to login.', 'error');
        setPhoneError('User does not exist');
      } else if (msg.toLowerCase().includes('invalid credentials') || msg.toLowerCase().includes('incorrect password') || msg.toLowerCase().includes('password is incorrect')) {
        showToast('Invalid credentials. Password is incorrect.', 'error');
        setPasswordError('Incorrect password');
      } else if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('password') || msg.toLowerCase().includes('phone')) {
        showToast('Invalid phone number or password. Please try again.', 'error');
        setPhoneError(' ');
        setPasswordError(' ');
      } else if (msg.toLowerCase().includes('server')) {
        showToast('Server error. Please try again later.', 'error');
      } else {
        showToast(msg || 'Login failed. Please check your credentials.', 'error');
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
            <Text style={styles.formHeading}>Welcome Back</Text>
            <Text style={styles.formSub}>Log in to manage your bookings</Text>

            {/* Phone Number Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Registered Phone Number</Text>
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

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={[styles.inputWrapper, passwordError ? styles.inputWrapperError : null]}>
                <Ionicons name="lock-closed-outline" size={18} color={passwordError ? '#EF4444' : '#6B7280'} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  value={password}
                  onChangeText={(t) => { setPassword(t); setPasswordError(''); }}
                  editable={!loading}
                />
              </View>
              {passwordError && passwordError.trim() ? (
                <View style={styles.fieldErrorRow}>
                  <Ionicons name="information-circle-outline" size={13} color="#EF4444" />
                  <Text style={styles.fieldErrorText}>{passwordError}</Text>
                </View>
              ) : null}
            </View>

            {/* Action Button */}
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#00B894', '#0984E3']}
                style={styles.loginButtonGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <View style={styles.btnContent}>
                    <Text style={styles.loginButtonText}>Sign In</Text>
                    <Ionicons name="arrow-forward" size={16} color="#FFF" style={{ marginLeft: 8 }} />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Sign Up Navigation Toggle */}
            <View style={styles.signupRow}>
              <Text style={styles.signupText}>{"Don't have an account? "}</Text>
              <TouchableOpacity onPress={onNavigateToRegister} disabled={loading}>
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: 32,
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
  loginButton: {
    marginTop: 10,
    shadowColor: '#00B894',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonGrad: {
    borderRadius: 16,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  signupText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  signupLink: {
    fontSize: 13,
    color: '#0984E3',
    fontWeight: '700',
  },
});
