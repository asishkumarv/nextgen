import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { Search, UserCheck, UserX, Briefcase, TrendingUp, CheckCircle, ChevronDown, ChevronUp, AlertCircle, Phone } from 'lucide-react';

export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedVendorId, setExpandedVendorId] = useState(null);

  const fetchVendors = async () => {
    try {
      const data = await api.get('/admin/vendors');
      setVendors(data);
    } catch (err) {
      setError(err.message || 'Failed to retrieve vendors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to APPROVE this vendor?')) return;
    try {
      await api.put(`/admin/vendors/${id}/approve`);
      await fetchVendors();
    } catch (err) {
      alert(err.message || 'Failed to approve vendor');
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Are you sure you want to REJECT this vendor?')) return;
    try {
      await api.put(`/admin/vendors/${id}/reject`);
      await fetchVendors();
    } catch (err) {
      alert(err.message || 'Failed to reject vendor');
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Are you sure you want to DEACTIVATE this vendor?')) return;
    try {
      await api.put(`/admin/vendors/${id}/deactivate`);
      await fetchVendors();
    } catch (err) {
      alert(err.message || 'Failed to deactivate vendor');
    }
  };

  const handleReactivate = async (id) => {
    if (!window.confirm('Are you sure you want to REACTIVATE this vendor?')) return;
    try {
      await api.put(`/admin/vendors/${id}/reactivate`);
      await fetchVendors();
    } catch (err) {
      alert(err.message || 'Failed to reactivate vendor');
    }
  };

  const toggleExpand = (id) => {
    if (expandedVendorId === id) {
      setExpandedVendorId(null);
    } else {
      setExpandedVendorId(id);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const filteredVendors = vendors.filter(v => 
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.phone.toLowerCase().includes(search.toLowerCase())
  );

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
            placeholder="Search vendors by name or phone..."
            style={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={styles.countIndicator}>
          Total Registered Vendors: <strong>{filteredVendors.length}</strong>
        </div>
      </div>

      {loading && vendors.length === 0 ? (
        <div style={styles.loading}>Querying Vendors Directory...</div>
      ) : (
        <div className="table-container">
          {filteredVendors.length === 0 ? (
            <div style={styles.empty}>No registered vendors match your search.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Vendor Info</th>
                  <th>Offered Services</th>
                  <th>Workload (Done / Assigned)</th>
                  <th>Revenue Generated</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVendors.map((v) => {
                  const isExpanded = expandedVendorId === v.id;
                  return (
                    <React.Fragment key={v.id}>
                      <tr>
                        <td>
                          <div>
                            <div style={{ fontWeight: '750', color: '#111827', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {v.name}
                              <span style={{ fontSize: '0.75rem', fontWeight: '500', color: '#9CA3AF' }}>#{v.id}</span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                              <Phone size={12} /> {v.phone}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#9CA3AF', marginTop: '2px' }}>
                              Registered: {formatDate(v.createdAt)}
                            </div>
                          </div>
                        </td>
                        <td style={{ maxWidth: '220px' }}>
                          <div style={styles.servicesList}>
                            {v.services && v.services.length > 0 && v.services[0] !== null ? (
                              v.services.map((s, idx) => (
                                <span key={idx} style={styles.serviceTag}>{s}</span>
                              ))
                            ) : (
                              <span style={{ color: '#9CA3AF', fontSize: '0.8rem', fontStyle: 'italic' }}>No services linked</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: '700', color: '#22C55E' }}>{v.completedCount || 0} done</span>
                            <span style={{ color: '#D1D5DB' }}>/</span>
                            <span style={{ fontWeight: '600', color: '#F59E0B' }}>{v.assignedCount || 0} pending</span>
                          </div>
                        </td>
                        <td style={{ fontWeight: '800', color: '#0984E3', fontSize: '0.95rem' }}>
                          ₹{(v.totalEarnings || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td>
                          {v.status === 'Approved' && (
                            <span className="badge badge-success">
                              <UserCheck size={12} /> Approved
                            </span>
                          )}
                          {v.status === 'Pending' && (
                            <span className="badge badge-warning">
                              <AlertCircle size={12} /> Pending Approval
                            </span>
                          )}
                          {v.status === 'Rejected' && (
                            <span className="badge badge-danger">
                              <UserX size={12} /> Rejected
                            </span>
                          )}
                          {v.status === 'Deactivated' && (
                            <span className="badge" style={{ backgroundColor: '#E5E7EB', color: '#4B5563' }}>
                              <AlertCircle size={12} /> Deactivated
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {v.status === 'Pending' && (
                              <>
                                <button
                                  onClick={() => handleApprove(v.id)}
                                  style={{ ...styles.actionBtn, ...styles.approveBtn }}
                                  title="Approve Vendor"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleReject(v.id)}
                                  style={{ ...styles.actionBtn, ...styles.rejectBtn }}
                                  title="Reject Vendor"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {v.status === 'Approved' && (
                              <button
                                onClick={() => handleDeactivate(v.id)}
                                style={{ ...styles.actionBtn, ...styles.deactivateBtn }}
                                title="Deactivate Vendor"
                              >
                                Deactivate
                              </button>
                            )}
                            {v.status === 'Deactivated' && (
                              <button
                                onClick={() => handleReactivate(v.id)}
                                style={{ ...styles.actionBtn, ...styles.reactivateBtn }}
                                title="Reactivate Vendor"
                              >
                                Reactivate
                              </button>
                            )}
                            <button
                              onClick={() => toggleExpand(v.id)}
                              style={styles.expandBtn}
                              title="Toggle Task List"
                            >
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>Tasks ({v.tasks?.length || 0})</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan="6" style={styles.expandedRow}>
                            <div style={styles.tasksContainer}>
                              <h4 style={styles.tasksHeader}>Tasks list for {v.name}</h4>
                              {v.tasks && v.tasks.length > 0 ? (
                                <table style={styles.tasksTable}>
                                  <thead>
                                    <tr>
                                      <th style={styles.tasksTh}>Task ID</th>
                                      <th style={styles.tasksTh}>Service</th>
                                      <th style={styles.tasksTh}>Customer</th>
                                      <th style={styles.tasksTh}>Scheduled Date</th>
                                      <th style={styles.tasksTh}>Location Address</th>
                                      <th style={styles.tasksTh}>Status</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {v.tasks.map((t) => (
                                      <tr key={t.id}>
                                        <td style={styles.tasksTd}><strong>{t.id}</strong></td>
                                        <td style={styles.tasksTd}>{t.serviceName}</td>
                                        <td style={styles.tasksTd}>
                                          <div>
                                            <strong>{t.userName}</strong>
                                            <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{t.userPhone}</div>
                                          </div>
                                        </td>
                                        <td style={styles.tasksTd}>{t.date}</td>
                                        <td style={{ ...styles.tasksTd, maxWidth: '280px', whiteSpace: 'normal', fontSize: '0.8rem', lineHeight: '1.4' }}>
                                          {t.address}
                                        </td>
                                        <td style={styles.tasksTd}>
                                          {t.status === 'Completed' ? (
                                            <span className="badge badge-success" style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                                              <CheckCircle size={10} /> Done
                                            </span>
                                          ) : (
                                            <span className="badge badge-warning" style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                                              <Briefcase size={10} /> Active
                                            </span>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : (
                                <div style={styles.noTasks}>No tasks have been assigned to this vendor yet.</div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
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
  },
  servicesList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
  },
  serviceTag: {
    backgroundColor: '#F3F4F6',
    color: '#4B5563',
    padding: '2px 8px',
    borderRadius: '6px',
    fontSize: '0.72rem',
    fontWeight: '600',
    border: '1px solid #E5E7EB',
  },
  actionBtn: {
    padding: '6px 12px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '0.78rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  approveBtn: {
    backgroundColor: '#DCFCE7',
    color: '#15803D',
  },
  rejectBtn: {
    backgroundColor: '#FEE2E2',
    color: '#B91C1C',
  },
  deactivateBtn: {
    backgroundColor: '#FEF3C7',
    color: '#D97706',
  },
  reactivateBtn: {
    backgroundColor: '#E0F2FE',
    color: '#0369A1',
  },
  expandBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 10px',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
    backgroundColor: '#FFFFFF',
    color: '#4B5563',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  expandedRow: {
    backgroundColor: '#F9FAFB',
    padding: '20px 24px',
    borderBottom: '1px solid #E5E7EB',
  },
  tasksContainer: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
  },
  tasksHeader: {
    fontSize: '0.9rem',
    fontWeight: '800',
    color: '#374151',
    marginBottom: '12px',
  },
  tasksTable: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tasksTh: {
    fontSize: '0.7rem',
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    padding: '8px 12px',
    backgroundColor: '#F9FAFB',
    borderBottom: '1px solid #E5E7EB',
  },
  tasksTd: {
    fontSize: '0.78rem',
    padding: '10px 12px',
    borderBottom: '1px solid #F3F4F6',
    color: '#4B5563',
  },
  noTasks: {
    padding: '16px',
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: '0.8rem',
    fontStyle: 'italic',
  }
};
