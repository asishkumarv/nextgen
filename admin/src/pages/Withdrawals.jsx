import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { Wallet, CheckCircle, XCircle, User, Landmark, HelpCircle, Users as UsersIcon } from 'lucide-react';

export default function Withdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('requests');
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [loadingReferrals, setLoadingReferrals] = useState(false);
  const [showReferralsModal, setShowReferralsModal] = useState(false);

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const data = await api.get('/admin/withdrawals');
      setWithdrawals(data || []);
      setError('');
    } catch (err) {
      console.error('Failed to fetch withdrawals:', err);
      setError('Failed to load withdrawal requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const handleStatusChange = async (id, status) => {
    if (!window.confirm(`Are you sure you want to mark this request as ${status}?`)) return;

    try {
      await api.put(`/admin/withdrawals/${id}/status`, { status });
      fetchWithdrawals();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating status');
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Pending':
        return <span style={{...styles.badge, backgroundColor: '#FEF3C7', color: '#B45309'}}>Pending</span>;
      case 'In Progress':
        return <span style={{...styles.badge, backgroundColor: '#DBEAFE', color: '#1D4ED8'}}>In Progress</span>;
      case 'Paid':
        return <span style={{...styles.badge, backgroundColor: '#D1FAE5', color: '#047857'}}>Paid</span>;
      case 'Rejected':
        return <span style={{...styles.badge, backgroundColor: '#FEE2E2', color: '#B91C1C'}}>Rejected</span>;
      default:
        return <span>{status}</span>;
    }
  };

  const handleViewReferrals = async (user_id, userName) => {
    setSelectedUser({ id: user_id, name: userName });
    setShowReferralsModal(true);
    setLoadingReferrals(true);
    try {
      const data = await api.get(`/admin/users/${user_id}/referrals`);
      setReferrals(data);
    } catch (err) {
      console.error('Failed to fetch referrals', err);
    } finally {
      setLoadingReferrals(false);
    }
  };

  const displayedWithdrawals = withdrawals.filter(w => {
    if (activeTab === 'requests') {
      return w.status === 'Pending' || w.status === 'In Progress';
    }
    return w.status === 'Paid' || w.status === 'Rejected';
  });

  if (loading) {
    return <div style={{ padding: '24px' }}>Loading withdrawal requests...</div>;
  }

  return (
    <div style={styles.container} className="animate-fade-in">
      <div style={styles.header}>
        <div style={styles.headerTitle}>
          <Wallet size={28} color="#0984E3" style={{ marginRight: '12px' }} />
          <h2>Referral Withdrawals</h2>
        </div>
        <p style={{ color: '#6B7280', marginTop: '8px' }}>Manage and process wallet withdrawal requests from users.</p>
        
        <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
          <button 
            style={{...styles.tabBtn, ...(activeTab === 'requests' ? styles.tabActive : styles.tabInactive)}}
            onClick={() => setActiveTab('requests')}
          >
            Requests (Pending / In Progress)
          </button>
          <button 
            style={{...styles.tabBtn, ...(activeTab === 'history' ? styles.tabActive : styles.tabInactive)}}
            onClick={() => setActiveTab('history')}
          >
            History (Paid / Rejected)
          </button>
        </div>
      </div>

      {error && <div style={{ color: '#EF4444', marginBottom: '16px' }}>{error}</div>}

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>User Details</th>
              <th style={styles.th}>Referral Details</th>
              <th style={styles.th}>Bank Details</th>
              <th style={styles.th}>Amount</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedWithdrawals.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#6B7280' }}>
                  No withdrawals found in this category.
                </td>
              </tr>
            ) : (
              displayedWithdrawals.map((w) => (
                <tr key={w.id} style={styles.tr}>
                  <td style={styles.td}>
                    {new Date(w.created_at).toLocaleDateString()}<br/>
                    <small style={{color: '#9CA3AF'}}>{new Date(w.created_at).toLocaleTimeString()}</small>
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <User size={16} color="#6B7280" />
                      <div>
                        <strong>{w.userName}</strong><br/>
                        <span style={{color: '#6B7280', fontSize: '0.85rem'}}>{w.userPhone}</span><br />
                        <button 
                          onClick={() => handleViewReferrals(w.user_id, w.userName)}
                          style={{ background: 'none', border: 'none', color: '#0984E3', padding: 0, fontSize: '0.8rem', cursor: 'pointer', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}
                        >
                          <UsersIcon size={12} /> View Referrals
                        </button>
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div>
                      <span style={{color: '#6B7280', fontSize: '0.85rem'}}>Code: <strong>{w.referralCode}</strong></span><br/>
                      <span style={{color: '#6B7280', fontSize: '0.85rem'}}>Referrals: <strong>{w.referralCount}</strong></span><br/>
                      <span style={{color: '#6B7280', fontSize: '0.85rem'}}>Balance: <strong>₹{w.walletBalance}</strong></span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Landmark size={16} color="#6B7280" />
                      <div>
                        <strong>{w.account_name}</strong><br/>
                        <span style={{color: '#6B7280', fontSize: '0.85rem'}}>Acc: {w.account_number}</span><br/>
                        <span style={{color: '#6B7280', fontSize: '0.85rem'}}>IFSC: {w.ifsc_code}</span>
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={{ fontWeight: 'bold', color: '#047857' }}>₹{parseFloat(w.amount).toFixed(2)}</span>
                  </td>
                  <td style={styles.td}>
                    {getStatusBadge(w.status)}
                  </td>
                  <td style={styles.td}>
                    {w.status === 'Pending' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleStatusChange(w.id, 'In Progress')} style={{...styles.actionBtn, backgroundColor: '#3B82F6', color: '#FFF'}}>
                          Process
                        </button>
                        <button onClick={() => handleStatusChange(w.id, 'Rejected')} style={{...styles.actionBtn, backgroundColor: '#EF4444', color: '#FFF'}}>
                          Reject
                        </button>
                      </div>
                    )}
                    {w.status === 'In Progress' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleStatusChange(w.id, 'Paid')} style={{...styles.actionBtn, backgroundColor: '#10B981', color: '#FFF'}}>
                          Mark Paid
                        </button>
                        <button onClick={() => handleStatusChange(w.id, 'Rejected')} style={{...styles.actionBtn, backgroundColor: '#EF4444', color: '#FFF'}}>
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showReferralsModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent} className="animate-slide-up">
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UsersIcon size={20} color="var(--primary)" /> 
                Referrals for {selectedUser?.name}
              </h3>
              <button onClick={() => setShowReferralsModal(false)} style={styles.closeBtn}>&times;</button>
            </div>
            
            <div style={styles.modalBody}>
              {loadingReferrals ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Loading referrals...</div>
              ) : referrals.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>No referrals found for this user.</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                        <th style={{ padding: '12px 8px', color: '#6B7280', fontWeight: '600', fontSize: '0.9rem' }}>Name</th>
                        <th style={{ padding: '12px 8px', color: '#6B7280', fontWeight: '600', fontSize: '0.9rem' }}>Date Joined</th>
                        <th style={{ padding: '12px 8px', color: '#6B7280', fontWeight: '600', fontSize: '0.9rem' }}>Type</th>
                        <th style={{ padding: '12px 8px', color: '#6B7280', fontWeight: '600', fontSize: '0.9rem' }}>Earned</th>
                      </tr>
                    </thead>
                    <tbody>
                      {referrals.map((ref, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #F3F4F6' }}>
                          <td style={{ padding: '12px 8px', fontWeight: '600', color: '#111827' }}>{ref.name}</td>
                          <td style={{ padding: '12px 8px', color: '#4B5563', fontSize: '0.9rem' }}>{new Date(ref.created_at).toLocaleDateString()}</td>
                          <td style={{ padding: '12px 8px' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '12px',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              backgroundColor: ref.type === 'Direct' ? '#d1fae5' : '#dbeafe',
                              color: ref.type === 'Direct' ? '#047857' : '#1d4ed8'
                            }}>
                              {ref.type}
                            </span>
                          </td>
                          <td style={{ padding: '12px 8px', fontWeight: '700', color: '#059669' }}>+₹{ref.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '24px',
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
  },
  tableContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    backgroundColor: '#F9FAFB',
    padding: '16px',
    textAlign: 'left',
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    borderBottom: '1px solid #E5E7EB',
  },
  tr: {
    borderBottom: '1px solid #E5E7EB',
  },
  td: {
    padding: '16px',
    verticalAlign: 'top',
  },
  badge: {
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: '600',
    display: 'inline-block',
  },
  actionBtn: {
    padding: '6px 12px',
    borderRadius: '6px',
    border: 'none',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  tabBtn: {
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tabActive: {
    backgroundColor: '#0984E3',
    color: '#FFFFFF',
    boxShadow: '0 2px 4px rgba(9, 132, 227, 0.2)',
  },
  tabInactive: {
    backgroundColor: '#F3F4F6',
    color: '#6B7280',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '85vh',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  modalHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid #F3F4F6',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    color: '#9CA3AF',
    cursor: 'pointer',
    padding: '4px',
    lineHeight: 1
  },
  modalBody: {
    padding: '24px',
    overflowY: 'auto',
    flex: 1
  }
};
