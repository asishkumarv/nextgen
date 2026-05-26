import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { Search, CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function Settlements() {
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('Pending'); // 'Pending', 'History'

  const fetchSettlements = async () => {
    try {
      const data = await api.get('/admin/settlements');
      setSettlements(data || []);
    } catch (err) {
      setError(err.message || 'Failed to retrieve settlements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlements();
  }, []);

  const handleApprove = async (id) => {
    if (!confirm('Are you sure you want to approve this settlement payment?')) return;
    try {
      await api.put(`/admin/settlements/${id}/approve`);
      fetchSettlements();
    } catch (err) {
      alert(err.message || 'Failed to approve settlement');
    }
  };

  const handleReject = async (id) => {
    if (!confirm('Are you sure you want to reject this settlement payment? This will release the bookings so they can be re-settled.')) return;
    try {
      await api.put(`/admin/settlements/${id}/reject`);
      fetchSettlements();
    } catch (err) {
      alert(err.message || 'Failed to reject settlement');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (error) {
    return <div style={styles.error}>{error}</div>;
  }

  // Filter settlements
  const filtered = settlements.filter((s) => {
    const matchesTab = activeTab === 'Pending' ? s.status === 'Pending' : s.status !== 'Pending';
    const matchesSearch =
      s.vendorName?.toLowerCase().includes(search.toLowerCase()) ||
      s.vendorPhone?.toLowerCase().includes(search.toLowerCase()) ||
      String(s.id).includes(search);
    return matchesTab && matchesSearch;
  });

  return (
    <div style={styles.container} className="animate-fade-in">
      <div style={styles.tabsRow}>
        <div style={styles.tabs}>
          {['Pending', 'History'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                ...styles.tabButton,
                ...(activeTab === tab ? styles.tabButtonActive : {}),
              }}
            >
              {tab === 'Pending' ? 'Pending Approval' : 'Settlement History'}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.filterBar}>
        <div style={styles.searchContainer}>
          <Search size={18} color="#9CA3AF" style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by vendor name, phone, or settlement ID..."
            style={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={styles.countIndicator}>
          Record Count: <strong>{filtered.length}</strong>
        </div>
      </div>

      {loading && settlements.length === 0 ? (
        <div style={styles.loading}>Loading settlements console...</div>
      ) : (
        <div className="table-container">
          {filtered.length === 0 ? (
            <div style={styles.empty}>No settlements found matching the criteria.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Settlement ID</th>
                  <th>Vendor Name</th>
                  <th>Phone Number</th>
                  <th>Requested Amount</th>
                  <th>Requested Date</th>
                  {activeTab === 'History' && <th>Settled Date</th>}
                  <th>Status</th>
                  {activeTab === 'Pending' && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: '700', color: '#111827' }}>SET-{s.id}</td>
                    <td style={{ fontWeight: '750', color: '#111827' }}>{s.vendorName}</td>
                    <td>{s.vendorPhone}</td>
                    <td style={{ fontWeight: '800', color: '#15803D' }}>₹{parseFloat(s.amount).toLocaleString('en-IN')}</td>
                    <td>{formatDate(s.createdAt)}</td>
                    {activeTab === 'History' && <td>{formatDate(s.approvedAt)}</td>}
                    <td>
                      <span
                        className={`badge ${
                          s.status === 'Approved'
                            ? 'badge-success'
                            : s.status === 'Pending'
                            ? 'badge-warning'
                            : 'badge-danger'
                        }`}
                        style={{
                          backgroundColor:
                            s.status === 'Approved'
                              ? '#D1FAE5'
                              : s.status === 'Pending'
                              ? '#FEF3C7'
                              : '#FEE2E2',
                          color:
                            s.status === 'Approved'
                              ? '#065F46'
                              : s.status === 'Pending'
                              ? '#D97706'
                              : '#991B1B',
                        }}
                      >
                        {s.status === 'Approved' ? (
                          <CheckCircle2 size={12} style={{ marginRight: 4 }} />
                        ) : s.status === 'Pending' ? (
                          <Clock size={12} style={{ marginRight: 4 }} />
                        ) : (
                          <XCircle size={12} style={{ marginRight: 4 }} />
                        )}
                        {s.status}
                      </span>
                    </td>
                    {activeTab === 'Pending' && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={styles.actionsCell}>
                          <button
                            onClick={() => handleApprove(s.id)}
                            style={styles.approveBtn}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(s.id)}
                            style={styles.rejectBtn}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '24px',
  },
  tabsRow: {
    display: 'flex',
    borderBottom: '1px solid #E5E7EB',
    marginBottom: '20px',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '-1px',
  },
  tabButton: {
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    padding: '12px 18px',
    fontSize: '0.92rem',
    fontWeight: '700',
    color: '#6B7280',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  tabButtonActive: {
    color: '#00B894',
    borderBottomColor: '#00B894',
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
    maxWidth: '450px',
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
  actionsCell: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '8px',
  },
  approveBtn: {
    backgroundColor: '#DCFCE7',
    color: '#15803D',
    border: '1px solid #86EFAC',
    borderRadius: '8px',
    padding: '6px 14px',
    fontSize: '0.75rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  rejectBtn: {
    backgroundColor: '#FEE2E2',
    color: '#EF4444',
    border: '1px solid #FCA5A5',
    borderRadius: '8px',
    padding: '6px 14px',
    fontSize: '0.75rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
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
};
