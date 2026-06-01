import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../utils/api';
import { CheckCircle, XCircle, FileImage, CreditCard, X } from 'lucide-react';

export default function SubscriptionRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await api.get('/admin/subscription-requests');
      setRequests(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to retrieve subscription requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id) => {
    try {
      await api.put(`/admin/subscription-requests/${id}/approve`);
      setRequests(requests.filter(req => req.subId !== id));
    } catch (err) {
      alert(err.message || 'Failed to approve subscription');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/admin/subscription-requests/${id}/reject`);
      setRequests(requests.filter(req => req.subId !== id));
    } catch (err) {
      alert(err.message || 'Failed to reject subscription');
    }
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      <div style={styles.header}>
        <h1 style={styles.title}>Pending Subscriptions</h1>
        <p style={styles.subtitle}>Review online and offline subscription payments before activation.</p>
      </div>

      {loading ? (
        <div style={styles.loading}>Loading requests...</div>
      ) : error ? (
        <div style={styles.error}>{error}</div>
      ) : requests.length === 0 ? (
        <div style={styles.empty}>
          <CheckCircle size={48} color="#9CA3AF" style={{ marginBottom: '16px' }} />
          <h3>All caught up!</h3>
          <p>There are no pending subscription requests to review.</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>User Details</th>
                <th>Mandal / Event</th>
                <th>Plan Details</th>
                <th>Payment Mode</th>
                <th>Payment Proof</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(req => (
                <tr key={req.subId}>
                  <td>
                    <div style={styles.userInfo}>
                      <strong>{req.name}</strong>
                      <span style={styles.metaText}>{req.phone}</span>
                    </div>
                  </td>
                  <td>
                    <div style={styles.userInfo}>
                      <strong>{req.eventName} (Slot #{req.slotNumber})</strong>
                      <span style={styles.metaText}>{req.mandalName}, {req.districtName}</span>
                    </div>
                  </td>
                  <td>
                    <div style={styles.userInfo}>
                      <strong>{req.plan}</strong>
                      <span style={styles.metaText}>₹{req.price}</span>
                    </div>
                  </td>
                  <td>
                    <div style={styles.paymentBadge(req.paymentMode)}>
                      <CreditCard size={14} />
                      {req.paymentMode === 'online' ? 'Online' : 'Offline'}
                    </div>
                  </td>
                  <td>
                    {req.paymentMode === 'online' ? (
                      <div style={styles.proofContainer}>
                        <span style={styles.metaText}>Txn: {req.transactionId || 'N/A'}</span>
                        {req.screenshotUrl ? (
                          <button onClick={() => setSelectedImage(req.screenshotUrl)} style={styles.viewProofBtn}>
                            <FileImage size={14} /> View Screenshot
                          </button>
                        ) : (
                          <span style={styles.noProof}>No Image</span>
                        )}
                      </div>
                    ) : (
                      <span style={styles.noProof}>Cash Collection</span>
                    )}
                  </td>
                  <td>
                    <div style={styles.actions}>
                      <button onClick={() => handleApprove(req.subId)} style={styles.approveBtn}>
                        <CheckCircle size={16} /> Approve
                      </button>
                      <button onClick={() => handleReject(req.subId)} style={styles.rejectBtn}>
                        <XCircle size={16} /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Image Modal using Portal to escape parent container bounds */}
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
  container: { padding: '24px' },
  header: { marginBottom: '24px' },
  title: { fontSize: '1.4rem', fontWeight: '850', color: '#111827', marginBottom: '4px' },
  subtitle: { fontSize: '0.9rem', color: '#6B7280' },
  userInfo: { display: 'flex', flexDirection: 'column' },
  metaText: { fontSize: '0.8rem', color: '#6B7280', marginTop: '2px' },
  paymentBadge: (mode) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 8px',
    borderRadius: '8px',
    fontSize: '0.75rem',
    fontWeight: '700',
    backgroundColor: mode === 'online' ? '#E0F2FE' : '#F3F4F6',
    color: mode === 'online' ? '#0284C7' : '#4B5563',
    textTransform: 'uppercase'
  }),
  proofContainer: { display: 'flex', flexDirection: 'column', gap: '6px' },
  viewProofBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#0984E3',
    backgroundColor: '#F0F9FF',
    padding: '4px 8px',
    borderRadius: '4px',
    alignSelf: 'flex-start',
    border: 'none',
    cursor: 'pointer'
  },
  noProof: { fontSize: '0.8rem', color: '#9CA3AF', fontStyle: 'italic' },
  actions: { display: 'flex', gap: '8px' },
  approveBtn: {
    display: 'flex', alignItems: 'center', gap: '4px',
    padding: '6px 12px', border: 'none', borderRadius: '6px',
    backgroundColor: '#10B981', color: 'white', fontWeight: '600',
    cursor: 'pointer', fontSize: '0.8rem'
  },
  rejectBtn: {
    display: 'flex', alignItems: 'center', gap: '4px',
    padding: '6px 12px', border: 'none', borderRadius: '6px',
    backgroundColor: '#EF4444', color: 'white', fontWeight: '600',
    cursor: 'pointer', fontSize: '0.8rem'
  },
  loading: { padding: '60px', textAlign: 'center', color: '#6B7280', fontSize: '1.1rem' },
  error: { padding: '20px', backgroundColor: '#FEE2E2', color: '#EF4444', borderRadius: '8px', textAlign: 'center' },
  empty: { padding: '80px', textAlign: 'center', color: '#6B7280', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  modalOverlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)',
    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999,
    padding: '20px'
  },
  modalContent: {
    position: 'relative',
    display: 'inline-flex',
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: '100%',
    maxHeight: '100%'
  },
  closeBtn: {
    position: 'absolute', top: '-16px', right: '-16px',
    backgroundColor: '#FFF', border: 'none', borderRadius: '50%',
    width: '36px', height: '36px', display: 'flex', justifyContent: 'center', alignItems: 'center',
    cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', color: '#111827', zIndex: 10
  },
  modalImage: {
    maxWidth: '100%',
    maxHeight: '85vh',
    objectFit: 'contain',
    borderRadius: '12px',
    display: 'block',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
  }
};
