import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { Wallet, CheckCircle, XCircle, User, Landmark, HelpCircle } from 'lucide-react';

export default function Withdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
            {withdrawals.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#6B7280' }}>
                  No withdrawal requests found.
                </td>
              </tr>
            ) : (
              withdrawals.map((w) => (
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
                        <span style={{color: '#6B7280', fontSize: '0.85rem'}}>{w.userPhone}</span>
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
  }
};
