import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../utils/api';
import { Search, Sparkles, FileImage, X } from 'lucide-react';

export default function Subscribers() {
  const [subscribers, setSubscribers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

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
            placeholder="Search by name, phone, slot, user ID or sub ID..."
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
                  <th>District / Mandal</th>
                  <th>Event Name</th>
                  <th>Subscription ID</th>
                  <th>Purchased Date</th>
                  <th>Expiry Date</th>
                  <th>Plan Tier</th>
                  <th>Payment Proof</th>
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
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: '700', color: '#374151' }}>{s.districtName || 'N/A'}</span>
                        <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>{s.mandalName || 'N/A'}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: '600', color: '#4B5563' }}>
                      {s.eventName || 'N/A'}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontWeight: '600' }}>{s.subId}</td>
                    <td>{formatDate(s.subscribedAt)}</td>
                    <td style={{ color: '#0984E3', fontWeight: '700' }}>{formatDate(s.validTill)}</td>
                    <td>
                      <span className="badge badge-success" style={{ backgroundColor: '#E0F2FE', color: '#0284C7' }}>
                        <Sparkles size={12} />
                        {s.plan.split('·')[0].trim()}
                      </span>
                    </td>
                    <td>
                      {s.screenshotUrl ? (
                        <button onClick={() => setSelectedImage(s.screenshotUrl)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: '600', color: '#0984E3', backgroundColor: '#F0F9FF', padding: '4px 8px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>
                          <FileImage size={14} /> View Screenshot
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#9CA3AF', fontStyle: 'italic' }}>{s.paymentMode === 'online' ? 'No Image' : 'Offline'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Image Modal using Portal */}
      {selectedImage && createPortal(
        <div style={styles.modalOverlay} onClick={() => setSelectedImage(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedImage(null)} style={styles.closeBtn}>
              <X size={24} />
            </button>
            <img src={selectedImage} alt="Payment Screenshot" style={styles.modalImage} />
          </div>
        </div>,
        document.body
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
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)',
    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '20px'
  },
  modalContent: {
    position: 'relative', display: 'inline-flex', justifyContent: 'center',
    alignItems: 'center', maxWidth: '100%', maxHeight: '100%'
  },
  closeBtn: {
    position: 'absolute', top: '-16px', right: '-16px',
    backgroundColor: '#FFF', border: 'none', borderRadius: '50%',
    width: '36px', height: '36px', display: 'flex', justifyContent: 'center', alignItems: 'center',
    cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', color: '#111827', zIndex: 10
  },
  modalImage: {
    maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain',
    borderRadius: '12px', display: 'block', boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
  }
};
