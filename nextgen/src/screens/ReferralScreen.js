import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../utils/api';
import { useApp } from '../context/AppContext';
import Toast from '../components/Toast';
import * as Clipboard from 'expo-clipboard';

export default function ReferralScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, refreshData } = useApp();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState('error');
  const [termsVisible, setTermsVisible] = useState(false);
  
  // Withdraw Form
  const [withdrawVisible, setWithdrawVisible] = useState(false);
  const [accName, setAccName] = useState('');
  const [accNumber, setAccNumber] = useState('');
  const [confirmAccNumber, setConfirmAccNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const showToast = (msg, type = 'error') => {
    setToastMsg(msg);
    setToastType(type);
    setToastVisible(true);
  };

  const fetchStats = async () => {
    try {
      const data = await api.get('/wallet');
      setStats(data);
    } catch (err) {
      showToast('Failed to load wallet data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const copyCode = async () => {
    if (stats?.referralCode) {
      await Clipboard.setStringAsync(stats.referralCode);
      showToast('Referral code copied to clipboard!', 'success');
    }
  };

  const handleWithdraw = async () => {
    if (!accName || !accNumber || !confirmAccNumber || !ifsc || !amount) {
      showToast('All fields are required', 'error');
      return;
    }
    if (accNumber !== confirmAccNumber) {
      showToast('Account numbers do not match', 'error');
      return;
    }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt < 100) {
      showToast('Minimum withdrawal amount is ₹100', 'error');
      return;
    }
    if (amt > stats.walletBalance) {
      showToast('Insufficient wallet balance', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/wallet/withdraw', {
        accountName: accName,
        accountNumber: accNumber,
        ifscCode: ifsc,
        amount: amt
      });
      setWithdrawVisible(false);
      setAccName(''); setAccNumber(''); setConfirmAccNumber(''); setIfsc(''); setAmount('');
      fetchStats();
      refreshData();
      showToast('Withdrawal request submitted successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Withdrawal failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#00B894" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wallet</Text>
        <TouchableOpacity onPress={() => setTermsVisible(true)} style={styles.infoBtn}>
          <Ionicons name="information-circle-outline" size={24} color="#0984E3" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Balance Card */}
        <LinearGradient
          colors={['#00B894', '#0984E3']}
          style={styles.balanceCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmt}>₹{stats?.walletBalance || 0}</Text>
          
          <TouchableOpacity 
            style={styles.withdrawBtn}
            onPress={() => setWithdrawVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.withdrawBtnText}>Withdraw Funds</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Code Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Referral Code</Text>
          <View style={styles.codeWrapper}>
            <Text style={styles.codeText}>{stats?.referralCode || '...'}</Text>
            <TouchableOpacity onPress={copyCode} style={styles.copyBtn}>
              <Ionicons name="copy-outline" size={20} color="#00B894" />
            </TouchableOpacity>
          </View>
          <Text style={styles.subText}>Share this code with friends to earn wallet money!</Text>
        </View>

        {/* Referrals List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Referrals ({stats?.referrals?.length || 0})</Text>
          {stats?.referrals?.length === 0 ? (
            <Text style={styles.subText}>You haven't referred anyone yet.</Text>
          ) : (
            stats.referrals.map((ref, idx) => (
              <View key={idx} style={styles.listItem}>
                <View>
                  <Text style={styles.listMain}>{ref.name}</Text>
                  <Text style={styles.listSub}>{new Date(ref.created_at).toLocaleDateString()}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#00B894' }}>+₹{ref.amount}</Text>
                  <View style={{ 
                    backgroundColor: ref.type === 'Direct' ? '#D1FAE5' : '#DBEAFE',
                    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginTop: 4
                  }}>
                    <Text style={{ 
                      fontSize: 10, fontWeight: '600', 
                      color: ref.type === 'Direct' ? '#047857' : '#1D4ED8' 
                    }}>
                      {ref.type}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Withdrawals List */}
        {stats?.withdrawals?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Withdrawal History</Text>
            {stats.withdrawals.map((w, idx) => (
              <View key={idx} style={styles.listItem}>
                <View>
                  <Text style={styles.listMain}>₹{w.amount}</Text>
                  <Text style={styles.listSub}>{new Date(w.created_at).toLocaleDateString()}</Text>
                </View>
                <View style={[styles.statusBadge, { 
                  backgroundColor: w.status === 'Pending' ? '#FEF3C7' : w.status === 'In Progress' ? '#DBEAFE' : w.status === 'Paid' ? '#D1FAE5' : '#FEE2E2'
                }]}>
                  <Text style={[styles.statusText, {
                    color: w.status === 'Pending' ? '#B45309' : w.status === 'In Progress' ? '#1D4ED8' : w.status === 'Paid' ? '#047857' : '#B91C1C'
                  }]}>{w.status}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Withdraw Modal */}
      <Modal visible={withdrawVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Withdrawal</Text>
              <TouchableOpacity onPress={() => setWithdrawVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Account Holder Name</Text>
                <TextInput style={styles.input} value={accName} onChangeText={setAccName} placeholder="Enter name" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Account Number</Text>
                <TextInput style={styles.input} value={accNumber} onChangeText={setAccNumber} secureTextEntry placeholder="Enter account number" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm Account Number</Text>
                <TextInput style={styles.input} value={confirmAccNumber} onChangeText={setConfirmAccNumber} placeholder="Re-enter account number" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>IFSC Code</Text>
                <TextInput style={styles.input} value={ifsc} onChangeText={t => setIfsc(t.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())} placeholder="e.g. SBIN0001234" autoCapitalize="characters" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount (₹)</Text>
                <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder={`Max ₹${stats?.walletBalance || 0}`} />
              </View>
              <TouchableOpacity style={styles.submitBtn} onPress={handleWithdraw} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Submit Request</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Terms Modal */}
      <Modal visible={termsVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rewards & Terms</Text>
              <TouchableOpacity onPress={() => setTermsVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <Text style={{ color: '#4B5563', marginBottom: 12 }}>Invite your friends and earn money!</Text>
            <View style={{ backgroundColor: '#F3F4F6', padding: 12, borderRadius: 8, marginBottom: 16 }}>
              <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Direct Referrals:</Text>
              <Text style={styles.tierText}>• 1st: ₹200, 2nd: ₹230, 3rd: ₹260</Text>
              <Text style={styles.tierText}>• ... Increases by ₹30 until the 8th referral</Text>
              <Text style={styles.tierText}>• 9th referral: ₹450</Text>
              <Text style={styles.tierText}>• 10th and onwards: ₹500 Flat</Text>
              <Text style={{ fontWeight: 'bold', marginTop: 8, marginBottom: 8 }}>2nd Level Referrals:</Text>
              <Text style={styles.tierText}>• Flat ₹100 for every sub-referral</Text>
            </View>
            <Text style={{ color: '#6B7280', fontSize: 13, marginBottom: 4 }}>• Min withdrawal is ₹100.</Text>
            <Text style={{ color: '#6B7280', fontSize: 13 }}>• Processed within 2-3 business days.</Text>
            <TouchableOpacity style={styles.submitBtn} onPress={() => setTermsVisible(false)}>
              <Text style={styles.submitBtnText}>I Understand</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Toast message={toastMsg} type={toastType} visible={toastVisible} onHide={() => setToastVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  infoBtn: { padding: 4 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  balanceCard: { borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 24 },
  balanceLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '500' },
  balanceAmt: { color: '#FFF', fontSize: 40, fontWeight: '800', marginVertical: 8 },
  withdrawBtn: { backgroundColor: '#FFF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginTop: 12 },
  withdrawBtnText: { color: '#0984E3', fontWeight: '700', fontSize: 14 },
  section: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 16 },
  codeWrapper: { backgroundColor: '#F3F4F6', borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  codeText: { fontSize: 24, fontWeight: '800', letterSpacing: 4, color: '#111827' },
  copyBtn: { padding: 8 },
  subText: { color: '#6B7280', fontSize: 13 },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  listMain: { fontSize: 15, fontWeight: '600', color: '#111827' },
  listSub: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 12, fontSize: 15, color: '#111827' },
  submitBtn: { backgroundColor: '#00B894', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  submitBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  tierText: { color: '#374151', marginBottom: 4 }
});
