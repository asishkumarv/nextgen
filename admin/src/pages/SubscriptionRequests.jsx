import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../utils/api';
import { CheckCircle, XCircle, FileImage, CreditCard, X, Clock, History } from 'lucide-react';

export default function SubscriptionRequests() {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'history'
  const [requests, setRequests] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectRemark, setRejectRemark] = useState('');
  const [subToReject, setSubToReject] = useState(null);

  const getFilteredData = (data) => {
    if (!searchQuery.trim()) return data;
    const query = searchQuery.toLowerCase();
    return data.filter(req => {
      return (
        (req.name && req.name.toLowerCase().includes(query)) ||
        (req.slotNumber && req.slotNumber.toLowerCase().includes(query)) ||
        (req.subId && req.subId.toLowerCase().includes(query)) ||
        (req.mandalName && req.mandalName.toLowerCase().includes(query)) ||
        (req.districtName && req.districtName.toLowerCase().includes(query)) ||
        (req.eventName && req.eventName.toLowerCase().includes(query))
      );
    });
  };

  const displayedData = getFilteredData(activeTab === 'pending' ? requests : history);

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

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await api.get('/admin/subscription-history');
      setHistory(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to retrieve subscription history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'pending') {
      fetchRequests();
    } else {
      fetchHistory();
    }
  }, [activeTab]);

  const handleApprove = async (id) => {
    try {
      await api.put(`/admin/subscription-requests/${id}/approve`);
      setRequests(requests.filter(req => req.subId !== id));
    } catch (err) {
      alert(err.message || 'Failed to approve subscription');
    }
  };

  const handleRejectClick = (id) => {
    setSubToReject(id);
    setRejectRemark('');
    setRejectModalOpen(true);
  };

  const confirmReject = async () => {
    if (!subToReject) return;
    if (!rejectRemark.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    try {
      await api.put(`/admin/subscription-requests/${subToReject}/reject`, { remark: rejectRemark });
      setRequests(requests.filter(req => req.subId !== subToReject));
      setRejectModalOpen(false);
      setSubToReject(null);
    } catch (err) {
      alert(err.message || 'Failed to reject subscription');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      <div style={{ ...styles.header, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={styles.title}>Subscription Management</h1>
          <p style={styles.subtitle}>Review pending requests and view history of approved/rejected subscriptions.</p>
        </div>
        <div style={styles.searchContainer}>
          <input 
            type="text" 
            placeholder="Search by Name, Slot, Sub ID, Mandal..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>

      <div style={styles.tabsContainer}>
        <button 
          style={activeTab === 'pending' ? styles.activeTab : styles.inactiveTab}
          onClick={() => setActiveTab('pending')}
        >
          <Clock size={16} /> Pending Requests
        </button>
        <button 
          style={activeTab === 'history' ? styles.activeTab : styles.inactiveTab}
          onClick={() => setActiveTab('history')}
        >
          <History size={16} /> Request History
        </button>
      </div>

      {loading ? (
        <div style={styles.loading}>Loading data...</div>
      ) : error ? (
        <div style={styles.error}>{error}</div>
      ) : activeTab === 'pending' && displayedData.length === 0 ? (
        <div style={styles.empty}>
          <CheckCircle size={48} color="#9CA3AF" style={{ marginBottom: '16px' }} />
          <h3>{searchQuery ? 'No matching requests found' : 'All caught up!'}</h3>
          <p>{searchQuery ? 'Try adjusting your search filters.' : 'There are no pending subscription requests to review.'}</p>
        </div>
      ) : activeTab === 'history' && displayedData.length === 0 ? (
        <div style={styles.empty}>
          <History size={48} color="#9CA3AF" style={{ marginBottom: '16px' }} />
          <h3>No History Found</h3>
          <p>{searchQuery ? 'No matching processed requests found.' : 'There are no processed subscription requests yet.'}</p>
        </div>
      ) : (
        <div className="table-container animate-fade-in">
          <table>
            <thead>
              <tr>
                <th>User Details</th>
                <th>Mandal / Event</th>
                <th>Plan Details</th>
                <th>Payment Mode</th>
                {activeTab === 'pending' ? <th>Payment Proof</th> : <th>Processed & Proof</th>}
                {activeTab === 'pending' ? <th>Actions</th> : <th>Status</th>}
              </tr>
            </thead>
            <tbody>
              {displayedData.map(req => (
                <tr key={req.subId}>
                  <td>
                    <div style={styles.userInfo}>
                      <strong>{req.name}</strong>
                      <span style={styles.metaText}>{req.phone}</span>
                    </div>
                  </td>
                  <td>
                    <div style={styles.userInfo}>
                      <strong>{req.eventName} (Slot #{req.slotNumber ? req.slotNumber.split('-REJECTED')[0] : 'N/A'})</strong>
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
                  
                  {activeTab === 'pending' ? (
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
                  ) : (
                    <td>
                      <div style={styles.proofContainer}>
                        <div style={styles.userInfo}>
                          <strong>{formatDate(req.createdAt)}</strong>
                          {req.paymentMode === 'online' && <span style={styles.metaText}>Txn: {req.transactionId || 'N/A'}</span>}
                        </div>
                        {req.paymentMode === 'online' && req.screenshotUrl && (
                          <button onClick={() => setSelectedImage(req.screenshotUrl)} style={{ ...styles.viewProofBtn, marginTop: '4px' }}>
                            <FileImage size={14} /> View Screenshot
                          </button>
                        )}
                      </div>
                    </td>
                  )}

                  {activeTab === 'pending' ? (
                    <td>
                      <div style={styles.actions}>
                        <button onClick={() => handleApprove(req.subId)} style={styles.approveBtn}>
                          <CheckCircle size={16} /> Approve
                        </button>
                        <button onClick={() => handleRejectClick(req.subId)} style={styles.rejectBtn}>
                          <XCircle size={16} /> Reject
                        </button>
                      </div>
                      <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#6B7280' }}>
                        ID: {req.subId}
                      </div>
                    </td>
                  ) : (
                    <td>
                      {req.status === 'Active' ? (
                        <div style={styles.statusBadge('#10B981', '#D1FAE5')}>
                          <CheckCircle size={14} /> Approved
                        </div>
                      ) : req.status === 'Rejected' ? (
                        <div>
                          <div style={styles.statusBadge('#EF4444', '#FEE2E2')}>
                            <XCircle size={14} /> Rejected
                          </div>
                          {req.remark && <div style={{ fontSize: '0.75rem', color: '#EF4444', marginTop: '4px', maxWidth: '150px' }}>Reason: {req.remark}</div>}
                        </div>
                      ) : (
                        <span style={styles.metaText}>{req.status}</span>
                      )}
                      <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#6B7280' }}>
                        ID: {req.subId}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
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

      {rejectModalOpen && createPortal(
        <div style={styles.modalOverlay} onClick={() => setRejectModalOpen(false)}>
          <div style={{...styles.modalContent, backgroundColor: 'white', padding: '24px', borderRadius: '12px', minWidth: '300px'}} onClick={(e) => e.stopPropagation()}>
            <h3 style={{marginTop: 0, marginBottom: '16px'}}>Reject Subscription</h3>
            <div style={{marginBottom: '16px'}}>
              <label style={{display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600'}}>Reason for rejection *</label>
              <textarea 
                style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB', minHeight: '80px', fontFamily: 'inherit'}}
                value={rejectRemark}
                onChange={(e) => setRejectRemark(e.target.value)}
                placeholder="E.g., Payment invalid, unclear screenshot"
              />
            </div>
            <div style={{display: 'flex', justifyContent: 'flex-end', gap: '12px'}}>
              <button style={{padding: '8px 16px', borderRadius: '6px', border: '1px solid #D1D5DB', backgroundColor: 'transparent', cursor: 'pointer'}} onClick={() => setRejectModalOpen(false)}>Cancel</button>
              <button style={{padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#EF4444', color: 'white', fontWeight: '600', cursor: 'pointer'}} onClick={confirmReject}>Confirm Reject</button>
            </div>
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
  tabsContainer: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
    borderBottom: '1px solid #E5E7EB',
    paddingBottom: '12px'
  },
  activeTab: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '8px 16px', backgroundColor: '#F3F4F6', color: '#111827',
    border: '1px solid #D1D5DB', borderRadius: '8px', fontWeight: '700', cursor: 'pointer'
  },
  inactiveTab: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '8px 16px', backgroundColor: 'transparent', color: '#6B7280',
    border: '1px solid transparent', borderRadius: '8px', fontWeight: '600', cursor: 'pointer'
  },
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
  statusBadge: (color, bg) => ({
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    padding: '6px 12px', backgroundColor: bg, color: color,
    borderRadius: '6px', fontSize: '0.8rem', fontWeight: '700'
  }),
  proofContainer: { display: 'flex', flexDirection: 'column', gap: '6px' },
  viewProofBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    fontSize: '0.75rem', fontWeight: '600', color: '#0984E3',
    backgroundColor: '#F0F9FF', padding: '4px 8px', borderRadius: '4px',
    alignSelf: 'flex-start', border: 'none', cursor: 'pointer'
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
  },
  searchContainer: {
    flex: '1',
    minWidth: '250px',
    maxWidth: '400px',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  searchInput: {
    width: '100%',
    padding: '10px 16px',
    borderRadius: '8px',
    border: '1px solid #D1D5DB',
    fontSize: '0.9rem',
    outline: 'none',
  }
};
