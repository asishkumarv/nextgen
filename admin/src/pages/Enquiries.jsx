import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Mail, CheckCircle2, Search, Filter } from 'lucide-react';

export default function Enquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const data = await api.get('/admin/enquiries');
      setEnquiries(data);
    } catch (error) {
      console.error('Error fetching enquiries:', error);
      showToast('Failed to load enquiries', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkResolved = async (id) => {
    try {
      await api.put(`/admin/enquiries/${id}/status`, { status: 'Resolved' });
      setEnquiries(enquiries.map(enq => 
        enq.id === id ? { ...enq, status: 'Resolved' } : enq
      ));
      showToast('Enquiry marked as resolved', 'success');
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('Failed to update enquiry status', 'error');
    }
  };

  const showToast = (message, type) => {
    setToast({ message, type });
  };

  const filteredEnquiries = enquiries.filter(enq => {
    const matchesSearch = 
      enq.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      enq.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enq.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || enq.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="loading-state">Loading Enquiries...</div>;
  }

  return (
    <div style={styles.container} className="animate-fade-in">
      <div className="page-header">
        <h2>Customer Enquiries</h2>
      </div>

      <div style={styles.filterBar}>
        <div style={styles.searchContainer}>
          <Search size={18} color="#9CA3AF" style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by name, email or message..."
            style={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div style={styles.filterContainer}>
          <Filter size={18} color="#9CA3AF" style={styles.searchIcon} />
          <select 
            style={styles.filterSelect}
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="New">New</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Customer Info</th>
              <th>Subject</th>
              <th>Message</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEnquiries.length > 0 ? (
              filteredEnquiries.map((enq) => (
                <tr key={enq.id}>
                  <td>#{enq.id}</td>
                  <td>{new Date(enq.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="customer-info-cell">
                      <p className="customer-name">{enq.name}</p>
                      <p className="customer-contact"><Mail size={12} /> {enq.email}</p>
                      {enq.phone && <p className="customer-contact">{enq.phone}</p>}
                    </div>
                  </td>
                  <td><span className="badge badge-outline">{enq.subject}</span></td>
                  <td>
                    <div className="message-preview" title={enq.message}>
                      {enq.message.length > 50 ? enq.message.substring(0, 50) + '...' : enq.message}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${enq.status.toLowerCase()}`}>
                      {enq.status}
                    </span>
                  </td>
                  <td>
                    {enq.status !== 'Resolved' && (
                      <button 
                        style={styles.resolveBtn}
                        onClick={() => handleMarkResolved(enq.id)}
                        title="Mark as Resolved"
                      >
                        <CheckCircle2 size={16} /> Resolve
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center py-8">No enquiries found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          backgroundColor: toast.type === 'error' ? '#ef4444' : '#10b981',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span>{toast.message}</span>
          <button 
            onClick={() => setToast(null)}
            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '18px' }}
          >
            ×
          </button>
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
  filterContainer: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    padding: '0 16px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
  },
  filterSelect: {
    border: 'none',
    outline: 'none',
    padding: '12px 0',
    fontSize: '0.92rem',
    color: '#374151',
    fontWeight: '500',
    backgroundColor: 'transparent',
    cursor: 'pointer'
  },
  resolveBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '600',
    transition: 'background-color 0.2s'
  }
};
