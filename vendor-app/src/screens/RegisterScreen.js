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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVendor } from '../context/VendorContext';
import Toast from '../components/Toast';

export default function RegisterScreen({ onNavigateToLogin }) {
  const insets = useSafeAreaInsets();
  const { register, allSystemServices } = useVendor();

  // Multi-step state
  const [step, setStep] = useState(1);

  // Step 1: Account Details
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Step 2: Existing Services Multi-Select
  const [selectedServices, setSelectedServices] = useState([]);

  // Step 3: Custom Service Form (Optional)
  const [addCustomService, setAddCustomService] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customSubtitle, setCustomSubtitle] = useState('');
  const [customPrice, setCustomPrice] = useState('');

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
    if (!password) {
      localErrors.password = 'Password is required';
    } else if (password.length < 6) {
      localErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(localErrors);
    return Object.keys(localErrors).length === 0;
  };

  const handleNext = () => {
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
      newServiceObj
    );
    setLoading(false);

    if (result.success) {
      alert('Registration successful!\n\nYour account has been created. Once the system administrator reviews and approves your details, you will be able to log in.');
      onNavigateToLogin();
    } else {
      showToast(result.message || 'Registration failed.', 'error');
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
                    placeholderTextColor="#9CA3AF"
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
                    placeholderTextColor="#9CA3AF"
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

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={[styles.inputWrapper, errors.password ? styles.inputWrapperError : null]}>
                  <Ionicons name="lock-closed-outline" size={18} color={errors.password ? '#EF4444' : '#6B7280'} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="At least 6 characters"
                    placeholderTextColor="#9CA3AF"
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
                  colors={['#00B894', '#0984E3']}
                  style={styles.actionBtnGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.actionBtnText}>Next: Choose Skills</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFF" style={{ marginLeft: 8 }} />
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
                  <ActivityIndicator color="#00B894" />
                  <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 8 }}>Fetching services list...</Text>
                </View>
              ) : (
                allSystemServices.map(item => {
                  const isSelected = selectedServices.includes(item.id);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.8}
                      style={[styles.serviceSelectCard, isSelected && styles.serviceSelectCardActive]}
                      onPress={() => toggleServiceSelection(item.id)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <View style={[styles.serviceSelectIconBg, isSelected && styles.serviceSelectIconBgActive]}>
                          <Ionicons 
                            name={item.icon || 'construct-outline'} 
                            size={18} 
                            color={isSelected ? '#00B894' : '#6B7280'} 
                          />
                        </View>
                        <View style={{ marginLeft: 12, flex: 1 }}>
                          <Text style={[styles.serviceSelectTitle, isSelected && styles.serviceSelectTitleActive]}>
                            {item.title}
                          </Text>
                          <Text style={styles.serviceSelectSubtitle} numberOfLines={1}>{item.subtitle}</Text>
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
                  color={addCustomService ? '#00B894' : '#6B7280'} 
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
                      placeholderTextColor="#9CA3AF"
                      value={customTitle}
                      onChangeText={setCustomTitle}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Subtitle (e.g. Battery wiring & setup)</Text>
                    <TextInput
                      style={styles.customInput}
                      placeholder="Service Subtitle"
                      placeholderTextColor="#9CA3AF"
                      value={customSubtitle}
                      onChangeText={setCustomSubtitle}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Base Cost (₹)</Text>
                    <TextInput
                      style={styles.customInput}
                      placeholder="e.g. 299"
                      placeholderTextColor="#9CA3AF"
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
                  colors={['#00B894', '#0984E3']}
                  style={styles.actionBtnGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.actionBtnText}>Next: Review & Confirm</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFF" style={{ marginLeft: 8 }} />
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
                  colors={['#00B894', '#0984E3']}
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
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 16,
  },
  flowTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
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
    color: '#9CA3AF',
  },
  stepLabelActive: {
    color: '#00B894',
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
    backgroundColor: '#00B894',
  },
  barInactive: {
    backgroundColor: '#E5E7EB',
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
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  formSub: {
    fontSize: 12,
    color: '#6B7280',
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
  inputWrapperError: {
    borderColor: '#EF4444',
    backgroundColor: '#FFF5F5',
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
    shadowColor: '#00B894',
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
    color: '#111827',
    marginBottom: 4,
    marginTop: 8,
  },
  sectionSubHeading: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
    fontWeight: '500',
  },
  serviceSelectCard: {
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
    shadowOpacity: 0.02,
    elevation: 1,
  },
  serviceSelectCardActive: {
    borderColor: '#00B894',
    backgroundColor: '#ECFDF5',
  },
  serviceSelectIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceSelectIconBgActive: {
    backgroundColor: '#D1FAE5',
  },
  serviceSelectTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#374151',
  },
  serviceSelectTitleActive: {
    color: '#065F46',
  },
  serviceSelectSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  checkboxCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCircleActive: {
    borderColor: '#00B894',
    backgroundColor: '#00B894',
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
    color: '#374151',
    flex: 1,
  },
  customInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  loadingSkillsContainer: {
    padding: 30,
    alignItems: 'center',
  },
  reviewCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10,
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  reviewLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  reviewVal: {
    fontSize: 13,
    color: '#111827',
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
    color: '#9CA3AF',
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
    color: '#9CA3AF',
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
});
