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
import { useVendor } from '../context/VendorContext';
import Toast from '../components/Toast';
import { api } from '../utils/api';

export default function LoginScreen({ onNavigateToRegister }) {
  const insets = useSafeAreaInsets();
  const { login } = useVendor();
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [phoneOrEmailError, setPhoneOrEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState('error');

  // OTP Login Mode States
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' or 'otp'
  const [showOtpField, setShowOtpField] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  const showToast = (msg, type = 'error') => {
    setToastMsg(msg);
    setToastType(type);
    setToastVisible(true);
  };

  const clearFieldErrors = () => {
    setPhoneOrEmailError('');
    setPasswordError('');
  };

  const handleSendOtp = async () => {
    Keyboard.dismiss();
    setPhoneOrEmailError('');
    if (!phoneOrEmail.trim()) {
      setPhoneOrEmailError('Phone number or email is required');
      return;
    }

    setOtpLoading(true);
    try {
      const res = await api.post('/auth/send-otp', { phoneOrEmail: phoneOrEmail.trim(), type: 'vendor', action: 'login' });
      setOtpLoading(false);
      if (res.success) {
        setShowOtpField(true);
        setOtpError('');
        setOtp('');
        showToast(`Verification code sent to registered email ending in ${res.email}`, 'success');
      } else {
        showToast(res.message || 'Failed to send verification code', 'error');
      }
    } catch (err) {
      setOtpLoading(false);
      showToast(err.message || 'Failed to send verification code', 'error');
    }
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
    clearFieldErrors();
    let hasError = false;

    if (!phoneOrEmail.trim()) {
      setPhoneOrEmailError('Phone number or email is required');
      hasError = true;
    }

    if (loginMethod === 'password') {
      if (!password) {
        setPasswordError('Password is required');
        hasError = true;
      }
    } else {
      if (!otp.trim()) {
        setOtpError('Verification code is required');
        hasError = true;
      } else if (otp.trim().length < 6) {
        setOtpError('Enter a valid 6-digit verification code');
        hasError = true;
      }
    }

    if (hasError) {
      showToast('Please fix the errors below before continuing.', 'warning');
      return;
    }

    setLoading(true);
    const result = await login(
      phoneOrEmail.trim(), 
      loginMethod === 'password' ? password : undefined, 
      loginMethod === 'otp' ? otp.trim() : undefined
    );
    setLoading(false);

    if (!result.success) {
      const msg = result.message || '';
      if (loginMethod === 'otp') {
        setOtpError(msg);
        showToast(msg, 'error');
      } else {
        if (msg.toLowerCase().includes('pending')) {
          showToast('Your registration is pending administrator approval.', 'warning');
        } else if (msg.toLowerCase().includes('rejected')) {
          showToast('Your registration request was rejected by the administrator.', 'error');
        } else if (msg.toLowerCase().includes('does not exist') || msg.toLowerCase().includes('not exist')) {
          showToast('Account does not exist. Please register to login.', 'error');
          setPhoneOrEmailError('Account does not exist');
        } else if (msg.toLowerCase().includes('credentials') || msg.toLowerCase().includes('incorrect') || msg.toLowerCase().includes('password')) {
          showToast('Invalid credentials. Password is incorrect.', 'error');
          setPasswordError('Incorrect password');
        } else {
          showToast(msg || 'Login failed. Please check your credentials.', 'error');
        }
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
                source={require('../assets/GoFixit.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>Go Fixit Vendor</Text>
            <Text style={styles.subtitle}>Provide On-Demand Electric Services</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.formHeading}>Vendor Portal</Text>
            <Text style={styles.formSub}>Log in to manage your tasks & revenue</Text>

            {/* Phone or Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number or Email Address</Text>
              <View style={[styles.inputWrapper, phoneOrEmailError ? styles.inputWrapperError : null]}>
                <Ionicons name="person-outline" size={18} color={phoneOrEmailError ? '#EF4444' : '#6B7280'} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter phone or email"
                  placeholderTextColor="#A5A1B8"
                  keyboardType="default"
                  autoCapitalize="none"
                  value={phoneOrEmail}
                  onChangeText={(t) => { setPhoneOrEmail(t); setPhoneOrEmailError(''); }}
                  editable={!loading}
                />
              </View>
              {phoneOrEmailError ? (
                <View style={styles.fieldErrorRow}>
                  <Ionicons name="information-circle-outline" size={13} color="#EF4444" />
                  <Text style={styles.fieldErrorText}>{phoneOrEmailError}</Text>
                </View>
              ) : null}
            </View>

            {/* Password / OTP Input conditional render */}
            {loginMethod === 'password' ? (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={[styles.inputWrapper, passwordError ? styles.inputWrapperError : null]}>
                  <Ionicons name="lock-closed-outline" size={18} color={passwordError ? '#EF4444' : '#6B7280'} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your password"
                    placeholderTextColor="#A5A1B8"
                    secureTextEntry
                    value={password}
                    onChangeText={(t) => { setPassword(t); setPasswordError(''); }}
                    editable={!loading}
                  />
                </View>
                {passwordError ? (
                  <View style={styles.fieldErrorRow}>
                    <Ionicons name="information-circle-outline" size={13} color="#EF4444" />
                    <Text style={styles.fieldErrorText}>{passwordError}</Text>
                  </View>
                ) : null}
              </View>
            ) : (
              showOtpField && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Verification Code (OTP)</Text>
                  <View style={[styles.inputWrapper, otpError ? styles.inputWrapperError : null]}>
                    <Ionicons name="shield-checkmark-outline" size={18} color={otpError ? '#EF4444' : '#6B7280'} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="123456"
                      placeholderTextColor="#A5A1B8"
                      keyboardType="number-pad"
                      maxLength={6}
                      value={otp}
                      onChangeText={(t) => { setOtp(t); setOtpError(''); }}
                      editable={!loading}
                    />
                  </View>
                  {otpError ? (
                    <View style={styles.fieldErrorRow}>
                      <Ionicons name="information-circle-outline" size={13} color="#EF4444" />
                      <Text style={styles.fieldErrorText}>{otpError}</Text>
                    </View>
                  ) : null}
                </View>
              )
            )}

            {/* Action Buttons */}
            {loginMethod === 'otp' && !showOtpField ? (
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleSendOtp}
                disabled={otpLoading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#F0C38E', '#F1AA9B']}
                  style={styles.loginButtonGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {otpLoading ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <View style={styles.btnContent}>
                      <Text style={styles.loginButtonText}>Send OTP Code</Text>
                      <Ionicons name="mail-outline" size={16} color="#312C51" style={{ marginLeft: 8 }} />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#F0C38E', '#F1AA9B']}
                  style={styles.loginButtonGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <View style={styles.btnContent}>
                      <Text style={styles.loginButtonText}>{loginMethod === 'password' ? 'Sign In' : 'Verify & Login'}</Text>
                      <Ionicons name="arrow-forward" size={16} color="#312C51" style={{ marginLeft: 8 }} />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Switch Login Method Link */}
            <TouchableOpacity
              style={styles.switchMethodBtn}
              onPress={() => {
                setLoginMethod(loginMethod === 'password' ? 'otp' : 'password');
                setShowOtpField(false);
                setOtp('');
                setOtpError('');
                clearFieldErrors();
              }}
              disabled={loading || otpLoading}
            >
              <Text style={styles.switchMethodText}>
                {loginMethod === 'password' ? 'Sign In with Email OTP' : 'Sign In with Password'}
              </Text>
            </TouchableOpacity>

            {/* Sign Up Navigation Toggle */}
            <View style={styles.signupRow}>
              <Text style={styles.signupText}>{"Want to register as a partner? "}</Text>
              <TouchableOpacity onPress={onNavigateToRegister} disabled={loading}>
                <Text style={styles.signupLink}>Sign Up</Text>
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
    backgroundColor: '#312C51',
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
    backgroundColor: '#48426D',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#F0C38E',
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
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#A5A1B8',
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
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
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  formSub: {
    fontSize: 13,
    color: '#A5A1B8',
    marginTop: 4,
    marginBottom: 20,
    fontWeight: '500',
  },
  inputWrapperError: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
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
  loginButton: {
    marginTop: 10,
    shadowColor: '#F0C38E',
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
    color: '#312C51',
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
    color: '#A5A1B8',
    fontWeight: '500',
  },
  signupLink: {
    fontSize: 13,
    color: '#F1AA9B',
    fontWeight: '700',
  },
  switchMethodBtn: {
    alignItems: 'center',
    marginTop: 15,
    paddingVertical: 8,
  },
  switchMethodText: {
    color: '#F0C38E',
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
