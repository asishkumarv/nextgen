import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVendor } from '../context/VendorContext';
import Toast from '../components/Toast';

export default function SettlementsScreen() {
  const insets = useSafeAreaInsets();
  const { allStats, settlements, unsettledBalance, requestSettlement, refreshData } = useVendor();

  const [periodTab, setPeriodTab] = useState('week'); // 'today', 'week', 'month', 'year', 'total'
  const [refreshing, setRefreshing] = useState(false);
  const [loadingSettle, setLoadingSettle] = useState(false);

  // Toast notifications
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState('success');

  const showToast = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setToastVisible(true);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const handleRequestSettlement = async () => {
    if (unsettledBalance <= 0) {
      showToast('You do not have any unsettled earnings to claim.', 'warning');
      return;
    }

    setLoadingSettle(true);
    const res = await requestSettlement();
    setLoadingSettle(false);

    if (res.success) {
      showToast('Settlement request submitted successfully!', 'success');
    } else {
      showToast(res.message || 'Failed to submit settlement request.', 'error');
    }
  };

  const currentStats = allStats[periodTab] || { assigned: 0, completed: 0, revenue: 0 };

  const pendingSettlements = settlements.filter(s => s.status === 'Pending');
  const pastSettlements = settlements.filter(s => s.status !== 'Pending');

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
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
        <Text style={styles.heading}>Earnings & Settlements</Text>

        {/* Unsettled Balance Card */}
        <View style={styles.settleCard}>
          <LinearGradient
            colors={['#0984E3', '#2B2D42']}
            style={styles.settleGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.settleLabel}>Available for Settlement</Text>
            <Text style={styles.settleBalance}>₹{unsettledBalance.toLocaleString('en-IN')}</Text>

            <TouchableOpacity
              style={[styles.settleBtn, unsettledBalance <= 0 && styles.settleBtnDisabled]}
              onPress={handleRequestSettlement}
              disabled={loadingSettle || unsettledBalance <= 0}
            >
              {loadingSettle ? (
                <ActivityIndicator color="#0984E3" size="small" />
              ) : (
                <>
                  <Text style={styles.settleBtnText}>Settle Payments Now</Text>
                  <Ionicons name="send-outline" size={16} color="#0984E3" style={{ marginLeft: 6 }} />
                </>
              )}
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Stats Selector Grid Section */}
        <Text style={styles.sectionTitle}>Stats Overview</Text>
        <View style={styles.periodSelector}>
          {['today', 'week', 'month', 'year', 'total'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.periodBtn, periodTab === tab && styles.periodBtnActive]}
              onPress={() => setPeriodTab(tab)}
            >
              <Text style={[styles.periodText, periodTab === tab && styles.periodTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Selected Period Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statsCol}>
              <Text style={styles.statsColNum}>₹{currentStats.revenue.toLocaleString('en-IN')}</Text>
              <Text style={styles.statsColLabel}>Revenue</Text>
            </View>
            <View style={styles.statsVerticalDivider} />
            <View style={styles.statsCol}>
              <Text style={styles.statsColNum}>{currentStats.completed}</Text>
              <Text style={styles.statsColLabel}>Tasks Completed</Text>
            </View>
            <View style={styles.statsVerticalDivider} />
            <View style={styles.statsCol}>
              <Text style={styles.statsColNum}>{currentStats.assigned}</Text>
              <Text style={styles.statsColLabel}>Assigned Tasks</Text>
            </View>
          </View>
        </View>

        {/* Pending Settlements */}
        {pendingSettlements.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.sectionSubTitle}>Pending Settlements</Text>
            {pendingSettlements.map((item) => (
              <View key={item.id} style={styles.settlementItem}>
                <View style={styles.setItemLeft}>
                  <View style={[styles.statusIndicator, { backgroundColor: '#F59E0B' }]} />
                  <View>
                    <Text style={styles.setAmount}>₹{parseFloat(item.amount).toLocaleString('en-IN')}</Text>
                    <Text style={styles.setDate}>Requested: {formatDate(item.createdAt)}</Text>
                  </View>
                </View>
                <View style={styles.statusBadgePending}>
                  <Text style={styles.statusBadgeTextPending}>Awaiting Approval</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Settlement History */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Settlement History</Text>
          {pastSettlements.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Ionicons name="receipt-outline" size={32} color="#9CA3AF" />
              <Text style={styles.emptyHistoryText}>No past settlements found.</Text>
            </View>
          ) : (
            pastSettlements.map((item) => {
              const isApproved = item.status === 'Approved';
              return (
                <View key={item.id} style={styles.settlementItem}>
                  <View style={styles.setItemLeft}>
                    <View
                      style={[
                        styles.statusIndicator,
                        { backgroundColor: isApproved ? '#10B981' : '#EF4444' },
                      ]}
                    />
                    <View>
                      <Text style={styles.setAmount}>₹{parseFloat(item.amount).toLocaleString('en-IN')}</Text>
                      <Text style={styles.setDate}>Requested: {formatDate(item.createdAt)}</Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.statusBadgeText,
                      { backgroundColor: isApproved ? '#D1FAE5' : '#FEE2E2' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: isApproved ? '#065F46' : '#991B1B' },
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

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
  settleCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#0984E3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  settleGrad: {
    padding: 24,
    alignItems: 'center',
  },
  settleLabel: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  settleBalance: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '900',
    marginTop: 6,
    marginBottom: 20,
  },
  settleBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  settleBtnDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  settleBtnText: {
    color: '#0984E3',
    fontSize: 14,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionSubTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#374151',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  periodSelector: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#E5E7EB',
    borderRadius: 14,
    padding: 3,
    marginBottom: 16,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 11,
  },
  periodBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  periodText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  periodTextActive: {
    color: '#111827',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginHorizontal: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 28,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statsCol: {
    alignItems: 'center',
    flex: 1,
  },
  statsColNum: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '850',
  },
  statsColLabel: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  statsVerticalDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E5E7EB',
  },
  historySection: {
    marginBottom: 20,
  },
  settlementItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  setItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  setAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  setDate: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '600',
  },
  statusBadgePending: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  statusBadgeTextPending: {
    color: '#D97706',
    fontSize: 11,
    fontWeight: '750',
  },
  statusBadgeText: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '750',
  },
  emptyHistory: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  emptyHistoryText: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
});
