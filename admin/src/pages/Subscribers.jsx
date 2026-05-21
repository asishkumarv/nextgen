import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { Search, Sparkles } from 'lucide-react';

export default function Subscribers() {
  const [subscribers, setSubscribers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSubscribers = async () => {
    try {
      const data = await api.get(`/admin/subscribers?search=${encodeURIComponent(search)}`);
      setSubscribers(data);
    } catch (err) {
      setError(err.message || 'Failed to retrieve subscribers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchSubscribers();
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
            placeholder="Search by name, phone or slot..."
            style={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={styles.countIndicator}>
          Active Subscriptions: <strong>{subscribers.length}</strong>
        </div>
      </div>

      {loading && subscribers.length === 0 ? (
        <div style={styles.loading}>Loading Subscribers Directory...</div>
      ) : (
        <div className="table-container">
          {subscribers.length === 0 ? (
            <div style={styles.empty}>No active subscribers found.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Slot Number</th>
                  <th>Subscriber Name</th>
                  <th>Phone Number</th>
                  <th>Subscription ID</th>
                  <th>Purchased Date</th>
                  <th>Expiry Date</th>
                  <th>Plan Tier</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((s) => (
                  <tr key={s.subId}>
                    <td style={{ fontWeight: '800', color: '#00B894', fontSize: '1rem' }}>
                      #{s.slotNumber}
                    </td>
                    <td style={{ fontWeight: '750', color: '#111827' }}>{s.name}</td>
                    <td>{s.phone}</td>
                    <td style={{ fontFamily: 'monospace', fontWeight: '600' }}>{s.subId}</td>
                    <td>{formatDate(s.subscribedAt)}</td>
                    <td style={{ color: '#0984E3', fontWeight: '700' }}>{formatDate(s.validTill)}</td>
                    <td>
                      <span className="badge badge-success" style={{ backgroundColor: '#E0F2FE', color: '#0284C7' }}>
                        <Sparkles size={12} />
                        {s.plan.split('·')[0].trim()}
                      </span>
                    </td>
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
  }
};
