import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { Search, Sparkles, XCircle } from 'lucide-react';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
