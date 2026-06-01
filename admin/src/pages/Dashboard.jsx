import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { Users, CreditCard, Calendar, IndianRupee, Clock, CheckCircle2, ChevronRight, X } from 'lucide-react';

export default function Dashboard({ onNavigateToView }) {
  const [stats, setStats] = useState({ 
    users: 0, 
    subscribers: 0, 
    bookings: 0, 
    revenue: 0,
    subscriptionRevenue: 0,
    bookingRevenue: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [pendingSubscriptions, setPendingSubscriptions] = useState([]);
  const [pendingVendors, setPendingVendors] = useState([]);
  const [pendingSettlements, setPendingSettlements] = useState([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRevenueModal, setShowRevenueModal] = useState(false);

  const fetchStats = async () => {
    try {
      const data = await api.get('/admin/dashboard-stats');
      setStats(data.stats);
      setRecentBookings(data.recentBookings || []);
      setPendingSubscriptions(data.pendingSubscriptions || []);
      setPendingVendors(data.pendingVendors || []);
      setPendingSettlements(data.pendingSettlements || []);
      setPendingWithdrawals(data.pendingWithdrawals || []);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleCompleteBooking = async (bookingId) => {
    try {
      await api.put(`/admin/bookings/${bookingId}/complete`);
      // Refresh statistics
      fetchStats();
    } catch (err) {
      alert(err.message || 'Failed to complete booking');
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading Dashboard Metrics...</div>;
  }

  if (error) {
    return <div style={styles.error}>{error}</div>;
  }

  const statCards = [
    { label: 'Total Customers', value: stats.users, icon: Users, color: '#00B894', bg: '#E6F9F5', link: 'users' },
    { label: 'Active Subscribers', value: stats.subscribers, icon: CreditCard, color: '#0984E3', bg: '#E3F2FD', link: 'subscribers' },
    { label: 'Total Bookings', value: stats.bookings, icon: Calendar, color: '#F59E0B', bg: '#FEF3C7', link: 'bookings' },
    { label: 'Calculated Revenue', value: `₹${stats.revenue.toLocaleString('en-IN')}`, icon: IndianRupee, color: '#10B981', bg: '#ECFDF5', link: 'subscribers' }
  ];

  return (
    <div className="dashboard-container animate-fade-in">
      {/* Metric Cards Row */}
      <div className="dashboard-grid">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div 
              key={idx} 
              className="dashboard-card" 
              onClick={() => {
                if (card.label === 'Calculated Revenue') {
                  setShowRevenueModal(true);
                } else {
                  onNavigateToView(card.link);
                }
              }}
            >
              <div className="dashboard-card-header">
                <span className="dashboard-card-label">{card.label}</span>
                <div className="dashboard-icon-wrapper" style={{ backgroundColor: card.bg }}>
                  <Icon size={20} color={card.color} />
                </div>
              </div>
              <div className="dashboard-card-body">
                <h3 className="dashboard-card-value">{card.value}</h3>
                <span className="dashboard-card-action">
                  View Details <ChevronRight size={14} style={{ marginLeft: 2 }} />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Panel Content Split */}
      <div className="dashboard-content-split">
        {/* Recent Bookings Box */}
        <div className="dashboard-table-box">
          <div style={styles.boxHeader}>
            <h2 style={styles.boxTitle}>Recent Service Bookings</h2>
            <button onClick={() => onNavigateToView('bookings')} style={styles.boxLink}>
              View All Registry
            </button>
          </div>

          <div className="table-container" style={{ marginTop: '0px', boxShadow: 'none', border: 'none' }}>
            {recentBookings.length === 0 ? (
              <div style={styles.empty}>No bookings recorded yet.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Customer</th>
                    <th>Requested Service</th>
                    <th>Schedule</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((b) => (
                    <tr key={b.id}>
                      <td style={{ fontWeight: '700', color: '#111827' }}>{b.id}</td>
                      <td>
                        <div style={styles.customerCell}>
                          <span style={styles.customerName}>{b.userName}</span>
                          <span style={styles.customerPhone}>{b.userPhone}</span>
                        </div>
                      </td>
                      <td>{b.serviceName}</td>
                      <td>{b.date}</td>
                      <td>
                        <span className={`badge ${b.status === 'Completed' ? 'badge-success' : 'badge-warning'}`}>
                          {b.status === 'Completed' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                          {b.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {b.status !== 'Completed' ? (
                          <button
                            onClick={() => handleCompleteBooking(b.id)}
                            style={styles.completeBtn}
                            title="Mark Completed"
                          >
                            Mark Complete
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#9CA3AF', fontWeight: '600' }}>Closed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Pending Subscriptions */}
        <div className="dashboard-table-box" style={{ marginTop: '24px' }}>
          <div style={styles.boxHeader}>
            <h2 style={styles.boxTitle}>Pending Subscription Requests</h2>
            <button onClick={() => onNavigateToView('subscriptions')} style={styles.boxLink}>
              View All Subscriptions
            </button>
          </div>
          <div className="table-container" style={{ marginTop: '0px', boxShadow: 'none', border: 'none' }}>
            {pendingSubscriptions.length === 0 ? (
              <div style={styles.empty}>No pending subscriptions.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Plan</th>
                    <th>Price</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingSubscriptions.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: '700', color: '#111827' }}>{s.id}</td>
                      <td>
                        <div style={styles.customerCell}>
                          <span style={styles.customerName}>{s.userName}</span>
                          <span style={styles.customerPhone}>{s.userPhone}</span>
                        </div>
                      </td>
                      <td>{s.plan}</td>
                      <td>₹{s.price}</td>
                      <td>{new Date(s.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Pending Vendors */}
        <div className="dashboard-table-box" style={{ marginTop: '24px' }}>
          <div style={styles.boxHeader}>
            <h2 style={styles.boxTitle}>Pending Vendor Applications</h2>
            <button onClick={() => onNavigateToView('vendors')} style={styles.boxLink}>
              View All Vendors
            </button>
          </div>
          <div className="table-container" style={{ marginTop: '0px', boxShadow: 'none', border: 'none' }}>
            {pendingVendors.length === 0 ? (
              <div style={styles.empty}>No pending vendor applications.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Vendor Name</th>
                    <th>Phone</th>
                    <th>Applied On</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingVendors.map((v) => (
                    <tr key={v.id}>
                      <td style={{ fontWeight: '700', color: '#111827' }}>{v.id}</td>
                      <td style={styles.customerName}>{v.name}</td>
                      <td style={styles.customerPhone}>{v.phone}</td>
                      <td>{new Date(v.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Pending Settlements */}
        <div className="dashboard-table-box" style={{ marginTop: '24px' }}>
          <div style={styles.boxHeader}>
            <h2 style={styles.boxTitle}>Pending Payment Settlements</h2>
            <button onClick={() => onNavigateToView('settlements')} style={styles.boxLink}>
              View All Settlements
            </button>
          </div>
          <div className="table-container" style={{ marginTop: '0px', boxShadow: 'none', border: 'none' }}>
            {pendingSettlements.length === 0 ? (
              <div style={styles.empty}>No pending payment settlements.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Vendor</th>
                    <th>Amount</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingSettlements.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: '700', color: '#111827' }}>{s.id}</td>
                      <td>
                        <div style={styles.customerCell}>
                          <span style={styles.customerName}>{s.vendorName}</span>
                          <span style={styles.customerPhone}>{s.vendorPhone}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: '600', color: '#059669' }}>₹{s.amount}</td>
                      <td>{new Date(s.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Pending Withdrawals */}
        <div className="dashboard-table-box" style={{ marginTop: '24px' }}>
          <div style={styles.boxHeader}>
            <h2 style={styles.boxTitle}>Pending Referral Withdrawals</h2>
            <button onClick={() => onNavigateToView('withdrawals')} style={styles.boxLink}>
              View All Withdrawals
            </button>
          </div>
          <div className="table-container" style={{ marginTop: '0px', boxShadow: 'none', border: 'none' }}>
            {pendingWithdrawals.length === 0 ? (
              <div style={styles.empty}>No pending referral withdrawals.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>User</th>
                    <th>Amount</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingWithdrawals.map((w) => (
                    <tr key={w.id}>
                      <td style={{ fontWeight: '700', color: '#111827' }}>{w.id}</td>
                      <td>
                        <div style={styles.customerCell}>
                          <span style={styles.customerName}>{w.userName}</span>
                          <span style={styles.customerPhone}>{w.userPhone}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: '600', color: '#059669' }}>₹{w.amount}</td>
                      <td>{new Date(w.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Revenue Breakdown Modal */}
      {showRevenueModal && (
        <div style={styles.modalOverlay} onClick={() => setShowRevenueModal(false)}>
          <div style={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTitleArea}>
                <div style={{ ...styles.iconWrapper, backgroundColor: '#ECFDF5', marginRight: '12px' }}>
                  <IndianRupee size={20} color="#10B981" />
                </div>
                <div>
                  <h2 style={styles.modalTitle}>Revenue Breakdown</h2>
                  <p style={styles.modalSubtitle}>Current platform financial statistics</p>
                </div>
              </div>
              <button onClick={() => setShowRevenueModal(false)} style={styles.closeModalBtn}>
                <X size={20} />
              </button>
            </div>

            <div style={styles.modalBody}>
              {/* Subscription Row */}
              <div style={styles.breakdownRow}>
                <div style={styles.breakdownLabelGroup}>
                  <div style={{ ...styles.rowIconBg, backgroundColor: '#E3F2FD', color: '#0984E3' }}>
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <span style={styles.breakdownLabelName}>Subscription Plans</span>
                    <span style={styles.breakdownLabelDesc}>Power Care slots reserved</span>
                  </div>
                </div>
                <span style={styles.breakdownValue}>
                  ₹{stats.subscriptionRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Bookings Row */}
              <div style={styles.breakdownRow}>
                <div style={styles.breakdownLabelGroup}>
                  <div style={{ ...styles.rowIconBg, backgroundColor: '#FEF3C7', color: '#F59E0B' }}>
                    <Calendar size={18} />
                  </div>
                  <div>
                    <span style={styles.breakdownLabelName}>Direct Bookings</span>
                    <span style={styles.breakdownLabelDesc}>Paid repairs by normal users</span>
                  </div>
                </div>
                <span style={styles.breakdownValue}>
                  ₹{stats.bookingRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Progress/Ratio Bar */}
              <div style={styles.progressContainer}>
                <div style={styles.progressLabelRow}>
                  <span style={styles.progressLabelText}>Breakdown Ratio</span>
                  <span style={styles.progressPercentage}>
                    {stats.revenue > 0 ? Math.round((stats.subscriptionRevenue / stats.revenue) * 100) : 0}% / {stats.revenue > 0 ? Math.round((stats.bookingRevenue / stats.revenue) * 100) : 0}%
                  </span>
                </div>
                <div style={styles.progressBarBg}>
                  <div 
                    style={{ 
                      height: '100%',
                      width: `${stats.revenue > 0 ? (stats.subscriptionRevenue / stats.revenue) * 100 : 0}%`,
                      backgroundColor: '#0984E3',
                      transition: 'width 0.3s ease'
                    }} 
                  />
                  <div 
                    style={{ 
                      height: '100%',
                      width: `${stats.revenue > 0 ? (stats.bookingRevenue / stats.revenue) * 100 : 0}%`,
                      backgroundColor: '#F59E0B',
                      transition: 'width 0.3s ease'
                    }} 
                  />
                </div>
                <div style={styles.legendRow}>
                  <div style={styles.legendItem}>
                    <span style={{ ...styles.legendDot, backgroundColor: '#0984E3' }} />
                    <span>Subscriptions</span>
                  </div>
                  <div style={styles.legendItem}>
                    <span style={{ ...styles.legendDot, backgroundColor: '#F59E0B' }} />
                    <span>Bookings</span>
                  </div>
                </div>
              </div>

              <div style={styles.totalSection}>
                <span style={styles.totalLabel}>Gross Platform Revenue</span>
                <span style={styles.totalValue}>
                  ₹{stats.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button onClick={() => setShowRevenueModal(false)} style={styles.okBtn}>
                Close Overview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  boxHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    borderBottom: '1px solid #F3F4F6',
    paddingBottom: '16px',
  },
  boxTitle: {
    fontSize: '1.05rem',
    fontWeight: '800',
    color: '#1F2937',
  },
  boxLink: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#0984E3',
    fontWeight: '700',
    fontSize: '0.85rem',
    cursor: 'pointer',
    transition: 'color 0.15s ease',
  },
  customerCell: {
    display: 'flex',
    flexDirection: 'column',
  },
  customerName: {
    fontWeight: '700',
    color: '#374151',
  },
  customerPhone: {
    fontSize: '0.75rem',
    color: '#6B7280',
    marginTop: '2px',
  },
  completeBtn: {
    backgroundColor: '#DCFCE7',
    color: '#15803D',
    border: '1px solid #86EFAC',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '0.78rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  empty: {
    padding: '40px',
    textAlign: 'center',
    color: '#6B7280',
    fontWeight: '600',
  },
  loading: {
    padding: '80px',
    textAlign: 'center',
    color: '#6B7280',
    fontSize: '1.1rem',
    fontWeight: '700',
  },
  error: {
    padding: '40px',
    margin: '24px',
    backgroundColor: '#FEE2E2',
    color: '#EF4444',
    border: '1px solid #FCA5A5',
    borderRadius: '12px',
    fontWeight: '600',
    textAlign: 'center',
  },
  // Modal Overlay styling
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(31, 41, 55, 0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    padding: '16px',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '460px',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid #F3F4F6',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitleArea: {
    display: 'flex',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: '1.15rem',
    fontWeight: '800',
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: '0.78rem',
    color: '#6B7280',
    fontWeight: '500',
    marginTop: '2px',
  },
  closeModalBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#9CA3AF',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  breakdownRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #F3F4F6',
  },
  breakdownLabelGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  rowIconBg: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  breakdownLabelName: {
    display: 'block',
    fontSize: '0.88rem',
    fontWeight: '700',
    color: '#1F2937',
  },
  breakdownLabelDesc: {
    display: 'block',
    fontSize: '0.75rem',
    color: '#9CA3AF',
    fontWeight: '500',
  },
  breakdownValue: {
    fontSize: '1.05rem',
    fontWeight: '800',
    color: '#111827',
  },
  progressContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  progressLabelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.78rem',
    fontWeight: '700',
    color: '#4B5563',
  },
  progressLabelText: {
    color: '#6B7280',
  },
  progressPercentage: {
    color: '#111827',
  },
  progressBarBg: {
    height: '8px',
    backgroundColor: '#E5E7EB',
    borderRadius: '9999px',
    overflow: 'hidden',
    display: 'flex',
  },
  legendRow: {
    display: 'flex',
    gap: '16px',
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#6B7280',
    marginTop: '2px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  legendDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  totalSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: '#ECFDF5',
    borderRadius: '12px',
    border: '1px solid #A7F3D0',
    marginTop: '8px',
  },
  totalLabel: {
    fontSize: '0.9rem',
    fontWeight: '750',
    color: '#065F46',
  },
  totalValue: {
    fontSize: '1.35rem',
    fontWeight: '850',
    color: '#047857',
  },
  modalFooter: {
    padding: '16px 24px',
    borderTop: '1px solid #F3F4F6',
    display: 'flex',
    justifyContent: 'flex-end',
    backgroundColor: '#FAFBFC',
  },
  okBtn: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    fontWeight: '750',
    fontSize: '0.85rem',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  }
};

