import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { Search, CheckCircle2, Clock, Trash2, MapPin } from 'lucide-react';

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [statusTab, setStatusTab] = useState('All'); // 'All', 'Booked', 'Completed'
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Reassignment states
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [eligibleVendors, setEligibleVendors] = useState([]);
  const [selectedVendorId, setSelectedVendorId] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [activeBookingId, setActiveBookingId] = useState(null);

  const handleOpenReassignModal = async (bookingId) => {
    setActiveBookingId(bookingId);
    setSelectedVendorId(null);
    setReassignModalOpen(true);
    setModalLoading(true);
    try {
      const data = await api.get(`/admin/bookings/${bookingId}/eligible-vendors`);
      setEligibleVendors(data || []);
      const currentBooking = bookings.find((b) => b.id === bookingId);
      if (currentBooking && currentBooking.vendorId) {
        setSelectedVendorId(currentBooking.vendorId);
      }
    } catch (err) {
      alert(err.message || 'Failed to retrieve eligible vendors');
      setReassignModalOpen(false);
    } finally {
      setModalLoading(false);
    }
  };

  const handleConfirmReassign = async () => {
    try {
      await api.put(`/admin/bookings/${activeBookingId}/reassign`, {
        vendorId: selectedVendorId,
      });
      setReassignModalOpen(false);
      fetchBookings();
    } catch (err) {
      alert(err.message || 'Failed to reassign vendor');
    }
  };

  const fetchBookings = async () => {
    try {
      const data = await api.get(
        `/admin/bookings?status=${statusTab}&search=${encodeURIComponent(search)}`
      );
      setBookings(data);
    } catch (err) {
      setError(err.message || 'Failed to retrieve bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchBookings();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, statusTab]);

  const handleCompleteBooking = async (bookingId) => {
    if (!confirm('Mark this booking as completed?')) return;
    try {
      await api.put(`/admin/bookings/${bookingId}/complete`);
      fetchBookings();
    } catch (err) {
      alert(err.message || 'Failed to complete booking');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel/delete this booking? This action cannot be undone.')) return;
    try {
      await api.delete(`/admin/bookings/${bookingId}`);
      fetchBookings();
    } catch (err) {
      alert(err.message || 'Failed to cancel booking');
    }
  };

  if (error) {
    return <div style={styles.error}>{error}</div>;
  }

  const activeBooking = bookings.find((b) => b.id === activeBookingId);
  const isUnassigned = activeBooking ? !activeBooking.vendorId : true;

  const tabs = ['All', 'Booked', 'Completed'];

  return (
    <>
      <div style={styles.container} className="animate-fade-in">
      <div style={styles.tabsRow}>
        <div style={styles.tabs}>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setStatusTab(tab);
                setLoading(true);
              }}
              style={{
                ...styles.tabButton,
                ...(statusTab === tab ? styles.tabButtonActive : {}),
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.filterBar}>
        <div style={styles.searchContainer}>
          <Search size={18} color="#9CA3AF" style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by ID, name, phone or service..."
            style={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={styles.countIndicator}>
          Filtered Record Count: <strong>{bookings.length}</strong>
        </div>
      </div>

      {loading && bookings.length === 0 ? (
        <div style={styles.loading}>Filtering Bookings Register...</div>
      ) : (
        <div className="table-container">
          {bookings.length === 0 ? (
            <div style={styles.empty}>No bookings match your current filter settings.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Customer Profile</th>
                  <th>Service requested</th>
                  <th>Scheduled Date</th>
                  <th>Price</th>
                  <th>Service Address</th>
                  <th>Assigned Vendor</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
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
                    <td style={{ fontWeight: '750', color: '#15803D' }}>₹{b.price}</td>
                    <td style={{ maxWidth: '220px', fontSize: '0.8rem' }}>
                      <div style={styles.addressCell} title={b.address}>
                        <MapPin size={12} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span style={styles.addressText}>{b.address}</span>
                      </div>
                    </td>
                    <td>
                      {b.vendorName ? (
                        <div style={styles.vendorCell}>
                          <span style={styles.vendorName}>{b.vendorName}</span>
                          <span style={styles.vendorId}>ID: #{b.vendorId}</span>
                        </div>
                      ) : (
                        <span style={styles.unassigned}>Unassigned</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${b.status === 'Completed' ? 'badge-success' : 'badge-warning'}`}>
                        {b.status === 'Completed' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                        {b.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={styles.actionsCell}>
                        {b.status !== 'Completed' && (
                          <>
                            <button
                              onClick={() => handleCompleteBooking(b.id)}
                              style={styles.completeBtn}
                            >
                              Complete
                            </button>
                            <button
                              onClick={() => handleOpenReassignModal(b.id)}
                              style={b.vendorName ? styles.reassignBtn : styles.assignBtn}
                            >
                              {b.vendorName ? 'Reassign' : 'Assign Vendor'}
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleCancelBooking(b.id)}
                          style={styles.deleteBtn}
                          title="Delete/Cancel Booking"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      </div>

      {/* Reassign Modal */}
      {reassignModalOpen && (
        <div style={styles.modalBg}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>{isUnassigned ? 'Assign Vendor' : 'Reassign Vendor'}</h3>
            <p style={styles.modalSub}>
              {isUnassigned
                ? 'Select an approved technician to assign this task. Vendors on leave for the scheduled date are excluded automatically.'
                : 'Select an approved technician to reassign this task. Vendors on leave for the scheduled date are excluded automatically.'}
            </p>
            {modalLoading ? (
              <div style={styles.modalLoading}>Loading eligible technicians...</div>
            ) : eligibleVendors.length === 0 ? (
              <div style={styles.modalEmpty}>No approved technicians found who offer this service and are not on leave.</div>
            ) : (
              <div style={styles.vendorsList}>
                {eligibleVendors.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVendorId(v.id)}
                    style={{
                      ...styles.vendorItemBtn,
                      ...(selectedVendorId === v.id ? styles.vendorItemBtnActive : {}),
                    }}
                  >
                    <span style={styles.modalVendorName}>{v.name}</span>
                    <span style={styles.modalVendorPhone}>{v.phone}</span>
                  </button>
                ))}
              </div>
            )}

            <div style={styles.modalActions}>
              <button
                onClick={() => setReassignModalOpen(false)}
                style={styles.modalCancelBtn}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReassign}
                disabled={modalLoading || eligibleVendors.length === 0}
                style={styles.modalConfirmBtn}
              >
                {isUnassigned ? 'Confirm Assignment' : 'Save Reassignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
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
  addressCell: {
    display: 'flex',
    gap: '4px',
    color: '#6B7280',
    alignItems: 'flex-start',
  },
  addressText: {
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
  },
  actionsCell: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '8px',
  },
  completeBtn: {
    backgroundColor: '#DCFCE7',
    color: '#15803D',
    border: '1px solid #86EFAC',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '0.75rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  deleteBtn: {
    backgroundColor: '#FEE2E2',
    color: '#EF4444',
    border: '1px solid #FCA5A5',
    borderRadius: '8px',
    padding: '6px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vendorCell: {
    display: 'flex',
    flexDirection: 'column',
  },
  vendorName: {
    fontWeight: '700',
    color: '#374151',
  },
  vendorId: {
    fontSize: '0.75rem',
    color: '#6B7280',
    marginTop: '2px',
  },
  unassigned: {
    color: '#EF4444',
    fontWeight: '750',
    fontSize: '0.85rem',
  },
  reassignBtn: {
    backgroundColor: '#E0F2FE',
    color: '#0369A1',
    border: '1px solid #BAE6FD',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '0.75rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  assignBtn: {
    backgroundColor: '#DCFCE7',
    color: '#15803D',
    border: '1px solid #86EFAC',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '0.75rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  modalBg: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    width: '100%',
    maxWidth: '450px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    textAlign: 'left',
  },
  modalTitle: {
    fontSize: '1.2rem',
    fontWeight: '800',
    color: '#111827',
    marginBottom: '8px',
    marginTop: 0,
  },
  modalSub: {
    fontSize: '0.82rem',
    color: '#6B7280',
    lineHeight: '1.4',
    marginBottom: '20px',
  },
  modalLoading: {
    padding: '24px',
    textAlign: 'center',
    color: '#6B7280',
    fontSize: '0.9rem',
    fontWeight: '600',
  },
  modalEmpty: {
    padding: '20px',
    textAlign: 'center',
    color: '#EF4444',
    fontSize: '0.85rem',
    fontWeight: '600',
    backgroundColor: '#FEE2E2',
    borderRadius: '12px',
    border: '1px solid #FCA5A5',
    marginBottom: '20px',
  },
  vendorsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '200px',
    overflowY: 'auto',
    marginBottom: '20px',
    padding: '4px',
  },
  vendorItemBtn: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    border: '1px solid #E5E7EB',
    borderRadius: '10px',
    padding: '12px 16px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s ease',
    width: '100%',
  },
  vendorItemBtnActive: {
    borderColor: '#00B894',
    backgroundColor: '#ECFDF5',
    boxShadow: '0 0 0 2px rgba(0, 184, 148, 0.15)',
  },
  modalVendorName: {
    fontWeight: '700',
    color: '#374151',
    fontSize: '0.88rem',
  },
  modalVendorPhone: {
    fontSize: '0.78rem',
    color: '#6B7280',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  },
  modalCancelBtn: {
    backgroundColor: 'transparent',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#374151',
    cursor: 'pointer',
  },
  modalConfirmBtn: {
    backgroundColor: '#00B894',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#FFFFFF',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0, 184, 148, 0.2)',
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
