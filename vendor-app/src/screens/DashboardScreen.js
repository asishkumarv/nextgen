import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVendor } from '../context/VendorContext';
import Toast from '../components/Toast';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { vendor, stats, bookings, completeTask, refreshData } = useVendor();

  const [activeTab, setActiveTab] = useState('assigned'); // 'assigned' or 'completed'
  const [refreshing, setRefreshing] = useState(false);
  const [completingId, setCompletingId] = useState(null);

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

  const handleCall = (phone) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      showToast('Could not open dialer application.', 'error');
    });
  };

  const handleCompleteTask = async (id) => {
    setCompletingId(id);
    const res = await completeTask(id);
    setCompletingId(null);

    if (res.success) {
      showToast('Task marked as completed successfully!', 'success');
    } else {
      showToast(res.message || 'Failed to complete task.', 'error');
    }
  };

  // Filter tasks based on selected segment
  const activeBookings = bookings.filter(b => b.status === 'Assigned');
  const completedBookings = bookings.filter(b => b.status === 'Completed');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#00B894']} />
        }
      >
        {/* Welcome Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Hello,</Text>
            <Text style={styles.vendorName}>{vendor?.name || 'Partner'}</Text>
          </View>
          <TouchableOpacity onPress={handleRefresh} style={styles.syncBtn}>
            <Ionicons name="refresh-circle-outline" size={26} color="#00B894" />
          </TouchableOpacity>
        </View>

        {/* Stats Grid Dashboard Card */}
        <LinearGradient
          colors={['#00B894', '#0984E3']}
          style={styles.statsCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.statsHeader}>
            <Text style={styles.statsLabel}>Total Revenue Generated</Text>
            <Text style={styles.revenueVal}>₹{(stats.revenue || 0).toLocaleString('en-IN')}</Text>
          </View>

          <View style={styles.statsDivider} />

          <View style={styles.statsRow}>
            <View style={styles.statsCol}>
              <Text style={styles.statsColNum}>{stats.completed || 0}</Text>
              <Text style={styles.statsColLabel}>Completed</Text>
            </View>

            <View style={styles.statsVerticalDivider} />

            <View style={styles.statsCol}>
              <Text style={styles.statsColNum}>{stats.assigned || 0}</Text>
              <Text style={styles.statsColLabel}>Pending Tasks</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Tasks Section Header */}
        <Text style={styles.sectionTitle}>Task Schedule</Text>

        {/* Segmented Control Selector Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'assigned' && styles.tabActive]}
            onPress={() => setActiveTab('assigned')}
          >
            <Text style={[styles.tabText, activeTab === 'assigned' && styles.tabTextActive]}>
              Assigned ({activeBookings.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'completed' && styles.tabActive]}
            onPress={() => setActiveTab('completed')}
          >
            <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>
              Completed ({completedBookings.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tasks Listings Grid */}
        <View style={styles.listContainer}>
          {activeTab === 'assigned' ? (
            activeBookings.length === 0 ? (
              <View style={styles.emptyList}>
                <Ionicons name="clipboard-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyText}>No pending tasks assigned to you.</Text>
                <Text style={styles.emptySubText}>New service bookings will appear here.</Text>
              </View>
            ) : (
              activeBookings.map(item => (
                <View key={item.id} style={styles.taskCard}>
                  {/* Task Card Header */}
                  <View style={styles.taskCardHeader}>
                    <View style={styles.taskServiceLeft}>
                      <View style={styles.taskIconBg}>
                        <Ionicons name={item.icon || 'construct'} size={18} color="#15803D" />
                      </View>
                      <View style={{ marginLeft: 10 }}>
                        <Text style={styles.taskServiceName}>{item.serviceName}</Text>
                        <Text style={styles.taskId}>ID: {item.id}</Text>
                      </View>
                    </View>
                    <Text style={styles.taskPrice}>₹{item.price}</Text>
                  </View>

                  <View style={styles.cardDivider} />

                  {/* Customer Details Row */}
                  <View style={styles.detailItem}>
                    <Ionicons name="person-outline" size={15} color="#4B5563" style={styles.detailIcon} />
                    <Text style={styles.detailLabel}>Client:</Text>
                    <Text style={styles.detailVal}>{item.userName}</Text>
                    
                    {/* Dialer Action */}
                    <TouchableOpacity onPress={() => handleCall(item.userPhone)} style={styles.callBtn}>
                      <Ionicons name="call" size={13} color="#FFF" style={{ marginRight: 4 }} />
                      <Text style={styles.callBtnText}>Call</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Scheduled Date */}
                  <View style={styles.detailItem}>
                    <Ionicons name="calendar-outline" size={15} color="#4B5563" style={styles.detailIcon} />
                    <Text style={styles.detailLabel}>Scheduled:</Text>
                    <Text style={styles.detailVal}>{item.date}</Text>
                  </View>

                  {/* User Location Address */}
                  <View style={[styles.detailItem, { alignItems: 'flex-start' }]}>
                    <Ionicons name="location-outline" size={15} color="#4B5563" style={styles.detailIcon} />
                    <Text style={styles.detailLabel}>Address:</Text>
                    <Text style={[styles.detailVal, { flex: 1, lineHeight: 18 }]}>{item.address}</Text>
                  </View>

                  {/* Complete Task Trigger Action */}
                  <TouchableOpacity
                    style={styles.completeBtn}
                    onPress={() => handleCompleteTask(item.id)}
                    disabled={completingId === item.id}
                  >
                    <LinearGradient
                      colors={['#00C853', '#0091EA']}
                      style={styles.completeBtnGrad}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      {completingId === item.id ? (
                        <ActivityIndicator color="#FFF" size="small" />
                      ) : (
                        <>
                          <Text style={styles.completeBtnText}>Complete Task</Text>
                          <Ionicons name="checkmark-circle-outline" size={16} color="#FFF" style={{ marginLeft: 6 }} />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ))
            )
          ) : (
            completedBookings.length === 0 ? (
              <View style={styles.emptyList}>
                <Ionicons name="checkmark-done-circle-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyText}>No completed tasks found.</Text>
                <Text style={styles.emptySubText}>Tasks you complete will show up here.</Text>
              </View>
            ) : (
              completedBookings.map(item => (
                <View key={item.id} style={[styles.taskCard, styles.taskCardCompleted]}>
                  {/* Task Card Header */}
                  <View style={styles.taskCardHeader}>
                    <View style={styles.taskServiceLeft}>
                      <View style={[styles.taskIconBg, { backgroundColor: '#E8F5E9' }]}>
                        <Ionicons name="checkmark-done" size={18} color="#2E7D32" />
                      </View>
                      <View style={{ marginLeft: 10 }}>
                        <Text style={styles.taskServiceName}>{item.serviceName}</Text>
                        <Text style={styles.taskId}>ID: {item.id}</Text>
                      </View>
                    </View>
                    <Text style={[styles.taskPrice, { color: '#2E7D32' }]}>₹{item.price}</Text>
                  </View>

                  <View style={styles.cardDivider} />

                  {/* Customer Details Row */}
                  <View style={styles.detailItem}>
                    <Ionicons name="person-outline" size={15} color="#4B5563" style={styles.detailIcon} />
                    <Text style={styles.detailLabel}>Client:</Text>
                    <Text style={styles.detailVal}>{item.userName}</Text>
                  </View>

                  {/* Scheduled Date */}
                  <View style={styles.detailItem}>
                    <Ionicons name="calendar-outline" size={15} color="#4B5563" style={styles.detailIcon} />
                    <Text style={styles.detailLabel}>Scheduled:</Text>
                    <Text style={styles.detailVal}>{item.date}</Text>
                  </View>

                  {/* Location Address */}
                  <View style={[styles.detailItem, { alignItems: 'flex-start' }]}>
                    <Ionicons name="location-outline" size={15} color="#4B5563" style={styles.detailIcon} />
                    <Text style={styles.detailLabel}>Address:</Text>
                    <Text style={[styles.detailVal, { flex: 1, lineHeight: 18 }]}>{item.address}</Text>
                  </View>

                  {/* Status Badge */}
                  <View style={styles.completedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#15803D" style={{ marginRight: 4 }} />
                    <Text style={styles.completedBadgeText}>Completed & Settled</Text>
                  </View>
                </View>
              ))
            )
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  vendorName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.5,
  },
  syncBtn: {
    padding: 4,
  },
  statsCard: {
    borderRadius: 24,
    marginHorizontal: 20,
    padding: 24,
    shadowColor: '#00B894',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 24,
  },
  statsHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  statsLabel: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  revenueVal: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    marginTop: 6,
  },
  statsDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: 16,
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
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  statsColLabel: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },
  statsVerticalDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 14,
    marginHorizontal: 20,
    padding: 3,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 11,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#111827',
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  emptyList: {
    alignItems: 'center',
    paddingVertical: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  taskCardCompleted: {
    borderColor: '#D1FAE5',
    backgroundColor: '#F9FAFB',
  },
  taskCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskServiceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  taskIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskServiceName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  taskId: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
    fontWeight: '600',
  },
  taskPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10B981',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 14,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4.5,
  },
  detailIcon: {
    marginRight: 8,
    width: 16,
    textAlign: 'center',
  },
  detailLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#6B7280',
    marginRight: 6,
  },
  detailVal: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#374151',
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0984E3',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 10,
  },
  callBtnText: {
    color: '#FFF',
    fontSize: 10.5,
    fontWeight: '700',
  },
  completeBtn: {
    marginTop: 16,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  completeBtnGrad: {
    borderRadius: 14,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  completeBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 12,
  },
  completedBadgeText: {
    color: '#15803D',
    fontSize: 11,
    fontWeight: '750',
  },
});
