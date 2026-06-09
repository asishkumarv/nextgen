import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Mail, CheckCircle2, Search, Filter } from 'lucide-react';
import Toast from '../components/Toast';

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
    <div className="admin-page">
      <div className="page-header">
        <h2>Customer Enquiries</h2>
      </div>

      <div className="controls-bar">
        <div className="search-box">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search by name, email or message..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-box">
          <Filter size={20} className="filter-icon" />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
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
                        className="btn-icon text-success"
                        onClick={() => handleMarkResolved(enq.id)}
                        title="Mark as Resolved"
                      >
                        <CheckCircle2 size={18} />
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
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
