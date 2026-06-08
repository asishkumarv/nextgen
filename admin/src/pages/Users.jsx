import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { Search, Sparkles, XCircle, Users as UsersIcon } from 'lucide-react';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [loadingReferrals, setLoadingReferrals] = useState(false);
  const [showReferralsModal, setShowReferralsModal] = useState(false);

  const fetchUsers = async () => {
    try {
      const data = await api.get(`/admin/users?search=${encodeURIComponent(search)}`);
      setUsers(data);
    } catch (err) {
      setError(err.message || 'Failed to retrieve users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Implement simple debounce for search
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleViewReferrals = async (user) => {
    setSelectedUser(user);
    setShowReferralsModal(true);
    setLoadingReferrals(true);
    try {
      const data = await api.get(`/admin/users/${user.id}/referrals`);
      setReferrals(data);
    } catch (err) {
      console.error('Failed to fetch referrals', err);
    } finally {
      setLoadingReferrals(false);
    }
  };

  if (error) {
    return <div style={styles.error}>{error}</div>;
  }

  return (
    <div style={styles.container} className="animate-fade-in">
      <div style={styles.filterBar}>
        <div style={styles.searchContainer}>
          <Search size={18} color="#9CA3AF" style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search users by name or phone..."
            style={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={styles.countIndicator}>
          Total Records: <strong>{users.length}</strong>
        </div>
      </div>

      {loading && users.length === 0 ? (
        <div style={styles.loading}>Querying Users Directory...</div>
      ) : (
        <div className="table-container">
          {users.length === 0 ? (
            <div style={styles.empty}>No registered users match your search.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Customer Name</th>
                  <th>Contact Number</th>
                  <th>Joined Date</th>
                  <th>Booking Count</th>
                  <th>Subscription Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: '600', color: '#6B7280' }}>#{u.id}</td>
                    <td style={{ fontWeight: '750', color: '#111827' }}>{u.name}</td>
                    <td>{u.phone}</td>
                    <td>{formatDate(u.createdAt)}</td>
                    <td style={{ fontWeight: '700', color: '#0984E3' }}>
                      {u.bookingCount || 0} bookings
                    </td>
                    <td>
                      {u.isSubscribed ? (
                        <span className="badge badge-success">
                          <Sparkles size={12} />
                          Active (Slot #{u.slotNumber})
                        </span>
                      ) : (
                        <span className="badge badge-danger" style={{ backgroundColor: '#F3F4F6', color: '#9CA3AF' }}>
                          <XCircle size={12} />
                          No Subscription
                        </span>
                      )}
                    </td>
                    <td>
                      <button 
                        onClick={() => handleViewReferrals(u)}
                        className="btn btn-secondary" 
                        style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <UsersIcon size={14} /> Referrals
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

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
  },
  filterBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    gap: '16px',
    flexWrap: 'wrap',
  },
  searchContainer: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    padding: '0 16px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
  },
  searchIcon: {
    marginRight: '10px',
    flexShrink: 0,
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    padding: '12px 0',
    width: '100%',
    fontSize: '0.92rem',
    color: '#374151',
    fontWeight: '500',
  },
  countIndicator: {
    fontSize: '0.85rem',
    color: '#6B7280',
  },
  loading: {
    padding: '80px',
    textAlign: 'center',
    color: '#6B7280',
    fontSize: '1.1rem',
    fontWeight: '700',
  },
  empty: {
    padding: '60px',
    textAlign: 'center',
    color: '#6B7280',
    fontWeight: '600',
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
