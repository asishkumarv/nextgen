import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { Search, Plus, Trash2, Edit3, X, HelpCircle, MapPin, DollarSign, Calendar, Sliders } from 'lucide-react';

export default function Mandals() {
  const [mandals, setMandals] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMandal, setEditingMandal] = useState(null);
  const [formData, setFormData] = useState({
    district_id: '',
    name: '',
    event_names: '',
    slots: '',
    subscription_price: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [mandalsData, districtsData] = await Promise.all([
        api.get('/admin/mandals'),
        api.get('/admin/districts')
      ]);
      setMandals(mandalsData);
      setDistricts(districtsData);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to retrieve mandals directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setEditingMandal(null);
    setFormData({
      district_id: districts[0]?.id || '',
      name: '',
      event_names: '',
      slots: '',
      subscription_price: '2999.00'
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (mandal) => {
    setEditingMandal(mandal);
    setFormData({
      district_id: mandal.district_id,
      name: mandal.name,
      event_names: mandal.event_names,
      slots: mandal.slots,
      subscription_price: mandal.subscription_price
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this mandal? User subscriptions and bookings inside this mandal will lose their connection.')) {
      return;
    }

    try {
      await api.delete(`/admin/mandals/${id}`);
      setMandals(mandals.filter(m => m.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete mandal');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { district_id, name, event_names, slots, subscription_price } = formData;
    
    if (!district_id || !name.trim() || !event_names.trim() || !slots.trim() || subscription_price === '') {
      alert('Please fill out all fields');
      return;
    }

    const subPriceNum = parseFloat(subscription_price);

    if (isNaN(subPriceNum) || subPriceNum < 0) {
      alert('Please enter valid subscription price');
      return;
    }

    try {
      const payload = {
        district_id: parseInt(district_id),
        name: name.trim(),
        event_names: event_names.trim(),
        slots: slots.trim(),
        subscription_price: subPriceNum
      };

      if (editingMandal) {
        const updated = await api.put(`/admin/mandals/${editingMandal.id}`, payload);
        setMandals(mandals.map(m => m.id === editingMandal.id ? updated : m));
      } else {
        const created = await api.post('/admin/mandals', payload);
        setMandals([...mandals, created]);
      }
      setModalOpen(false);
    } catch (err) {
      alert(err.message || 'Failed to save mandal');
    }
  };

  const previewSlotsExpanded = (slotsStr) => {
    if (!slotsStr) return '';
    const parts = slotsStr.split(',');
    const expanded = [];
    
    for (let part of parts) {
      part = part.trim();
      if (part.includes('-')) {
        const rangeParts = part.split('-');
        if (rangeParts.length === 2) {
          const start = parseInt(rangeParts[0].trim(), 10);
          const end = parseInt(rangeParts[1].trim(), 10);
          if (!isNaN(start) && !isNaN(end) && start <= end) {
            for (let i = start; i <= end; i++) {
              expanded.push(i);
            }
            continue;
          }
        }
      }
      if (part) expanded.push(part);
    }
    return expanded.join(', ');
  };

  const previewSlotsCount = (slotsStr) => {
    if (!slotsStr) return 0;
    const expandedStr = previewSlotsExpanded(slotsStr);
    return expandedStr ? expandedStr.split(',').length : 0;
  };

  const filteredMandals = mandals.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.districtName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={styles.container} className="animate-fade-in">
      {/* Header and Add Action */}
      <div style={styles.actionHeader}>
        <div style={styles.titleArea}>
          <h1 style={styles.title}>Mandals Registry</h1>
          <p style={styles.subtitle}>Configure Mandals under Districts, slot pools, events and pricing.</p>
        </div>
        
        <button onClick={handleOpenAdd} disabled={districts.length === 0} style={styles.addBtn}>
          <Plus size={18} />
          <span>Add Mandal</span>
        </button>
      </div>

      {districts.length === 0 && !loading && (
        <div style={styles.warningAlert}>
          <strong>Warning:</strong> You must create at least one District before configuring Mandals.
        </div>
      )}

      {/* Filter and stats row */}
      <div style={styles.filterBar}>
        <div style={styles.searchContainer}>
          <Search size={18} color="#9CA3AF" style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by mandal or district..."
            style={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={styles.statusStats}>
          Total Mandals: <strong style={{ color: '#111827' }}>{mandals.length}</strong>
        </div>
      </div>

      {/* Content area */}
      {loading ? (
        <div style={styles.loading}>Loading mandals directory...</div>
      ) : error ? (
        <div style={styles.error}>{error}</div>
      ) : filteredMandals.length === 0 ? (
        <div style={styles.empty}>
          <HelpCircle size={48} color="#9CA3AF" style={{ marginBottom: '12px' }} />
          <p>No mandals found matching "{search}"</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredMandals.map((mandal) => (
            <div key={mandal.id} style={styles.card}>
              <div style={styles.cardTop}>
                <div style={styles.iconContainer}>
                  <MapPin size={20} />
                </div>
                <div style={styles.cardHeader}>
                  <h3 style={styles.mandalName}>{mandal.name}</h3>
                  <span style={styles.districtBadge}>{mandal.districtName}</span>
                </div>
              </div>

              <div style={styles.cardContent}>
                {/* Event Names Configuration */}
                <div style={styles.infoRow}>
                  <Calendar size={14} style={styles.infoIcon} />
                  <div style={styles.infoText}>
                    <span style={styles.infoLabel}>Event Names:</span>
                    <p style={styles.infoVal}>{mandal.event_names}</p>
                  </div>
                </div>

                {/* Slots Configuration */}
                <div style={styles.infoRow}>
                  <Sliders size={14} style={styles.infoIcon} />
                  <div style={styles.infoText}>
                    <span style={styles.infoLabel}>Slot pool:</span>
                    <code style={styles.slotsCode}>{mandal.slots}</code>
                  </div>
                </div>

                {/* Prices Configuration */}
                <div style={styles.pricesGrid}>
                  <div style={styles.priceCell}>
                    <span style={styles.priceLabel}>Subscription</span>
                    <span style={styles.priceVal}>₹{parseFloat(mandal.subscription_price).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Card Action Controls */}
              <div style={styles.cardActions}>
                <button 
                  onClick={() => handleOpenEdit(mandal)} 
                  style={styles.actionEditBtn}
                  title="Edit Mandal Details"
                >
                  <Edit3 size={16} />
                  <span>Edit</span>
                </button>

                <button 
                  onClick={() => handleDelete(mandal.id)} 
                  style={styles.actionDeleteBtn}
                  title="Delete Mandal"
                >
                  <Trash2 size={16} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Dialog Modal */}
      {modalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContainer}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{editingMandal ? 'Edit Mandal' : 'Create New Mandal'}</h2>
              <button onClick={() => setModalOpen(false)} style={styles.closeModalBtn}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Select District *</label>
                <select
                  style={styles.formSelect}
                  value={formData.district_id}
                  onChange={(e) => setFormData({ ...formData, district_id: e.target.value })}
                  required
                >
                  {districts.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Mandal Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Vijayawada Urban"
                  style={styles.formInput}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Event Names (Comma separated) *</label>
                <input
                  type="text"
                  placeholder="e.g. AC Service, Wiring Repair, General Checkup"
                  style={styles.formInput}
                  value={formData.event_names}
                  onChange={(e) => setFormData({ ...formData, event_names: e.target.value })}
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Slot numbers (Comma separated or ranges like 101-110) *</label>
                <input
                  type="text"
                  placeholder="e.g. 101-105, 110, 112-115"
                  style={styles.formInput}
                  value={formData.slots}
                  onChange={(e) => setFormData({ ...formData, slots: e.target.value })}
                  required
                />
                {formData.slots ? (
                  <div style={{ marginTop: '6px', padding: '10px', backgroundColor: '#F9FAFB', borderRadius: '8px', border: '1px dashed #D1D5DB' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: '750', color: '#6B7280', textTransform: 'uppercase' }}>Preview ({previewSlotsCount(formData.slots)} slots):</span>
                    <p style={{ fontSize: '0.8rem', color: '#374151', marginTop: '2px', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                      {previewSlotsExpanded(formData.slots)}
                    </p>
                  </div>
                ) : null}
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Subscription Price (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 2999"
                  style={styles.formInput}
                  value={formData.subscription_price}
                  onChange={(e) => setFormData({ ...formData, subscription_price: e.target.value })}
                  required
                />
              </div>

              <div style={styles.modalActions}>
                <button 
                  type="button" 
                  onClick={() => setModalOpen(false)} 
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  style={styles.saveBtn}
                >
                  {editingMandal ? 'Save Changes' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '24px',
  },
  actionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  titleArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  title: {
    fontSize: '1.4rem',
    fontWeight: '850',
    color: '#111827',
  },
  subtitle: {
    fontSize: '0.85rem',
    color: '#6B7280',
    fontWeight: '500',
  },
  addBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    borderRadius: '10px',
    backgroundColor: '#00B894',
    color: '#FFFFFF',
    border: 'none',
    fontWeight: '700',
    fontSize: '0.88rem',
    cursor: 'pointer',
    boxShadow: '0 4px 6px -1px rgba(0, 184, 148, 0.15)',
    transition: 'all 0.15s ease',
  },
  warningAlert: {
    padding: '12px 16px',
    backgroundColor: '#FFFBEB',
    border: '1px solid #FCD34D',
    borderRadius: '10px',
    color: '#D97706',
    fontSize: '0.85rem',
    marginBottom: '20px',
  },
  filterBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
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
    maxWidth: '380px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
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
    fontSize: '0.9rem',
    color: '#374151',
    fontWeight: '500',
  },
  statusStats: {
    fontSize: '0.82rem',
    color: '#6B7280',
    fontWeight: '600',
    backgroundColor: '#FFFFFF',
    padding: '8px 16px',
    borderRadius: '10px',
    border: '1px solid #E5E7EB',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '24px',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E5E7EB',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    transition: 'all 0.2s ease',
  },
  cardTop: {
    padding: '20px 20px 12px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  iconContainer: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    color: '#0984E3',
  },
  cardHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  mandalName: {
    fontSize: '1.1rem',
    fontWeight: '800',
    color: '#111827',
  },
  districtBadge: {
    fontSize: '0.72rem',
    fontWeight: '750',
    backgroundColor: '#F3F4F6',
    color: '#4B5563',
    padding: '2px 8px',
    borderRadius: '6px',
    alignSelf: 'flex-start',
  },
  cardContent: {
    padding: '0 20px 20px 20px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  infoRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
  },
  infoIcon: {
    color: '#9CA3AF',
    marginTop: '3px',
    flexShrink: 0,
  },
  infoText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    flex: 1,
  },
  infoLabel: {
    fontSize: '0.76rem',
    fontWeight: '600',
    color: '#9CA3AF',
  },
  infoVal: {
    fontSize: '0.85rem',
    color: '#374151',
    fontWeight: '600',
    lineHeight: '1.3',
  },
  slotsCode: {
    fontSize: '0.78rem',
    backgroundColor: '#F3F4F6',
    color: '#4B5563',
    padding: '2px 6px',
    borderRadius: '4px',
    fontWeight: '600',
    fontFamily: 'monospace',
    marginTop: '2px',
    display: 'inline-block',
    wordBreak: 'break-all',
  },
  pricesGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    borderTop: '1px solid #F3F4F6',
    paddingTop: '14px',
    marginTop: '6px',
  },
  priceCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  priceLabel: {
    fontSize: '0.72rem',
    color: '#9CA3AF',
    fontWeight: '600',
  },
  priceVal: {
    fontSize: '1.1rem',
    fontWeight: '850',
    color: '#00B894',
  },
  cardActions: {
    display: 'flex',
    borderTop: '1px solid #F3F4F6',
    backgroundColor: '#FAFBFC',
  },
  actionEditBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '12px 8px',
    border: 'none',
    fontSize: '0.78rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    outline: 'none',
    color: '#0984E3',
    backgroundColor: '#E3F2FD',
    borderRight: '1px solid #F3F4F6',
  },
  actionDeleteBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '12px 8px',
    border: 'none',
    fontSize: '0.78rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    outline: 'none',
    color: '#EF4444',
    backgroundColor: '#FEE2E2',
  },
  loading: {
    padding: '100px 0',
    textAlign: 'center',
    color: '#6B7280',
    fontWeight: '700',
    fontSize: '1.1rem',
  },
  empty: {
    padding: '80px 0',
    textAlign: 'center',
    color: '#9CA3AF',
    fontWeight: '600',
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E5E7EB',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  error: {
    padding: '20px',
    backgroundColor: '#FEE2E2',
    color: '#EF4444',
    border: '1px solid #FCA5A5',
    borderRadius: '12px',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: '20px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(31, 41, 55, 0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '480px',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid #F3F4F6',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: '1.1rem',
    fontWeight: '800',
    color: '#111827',
  },
  closeModalBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#9CA3AF',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  formRow: {
    display: 'flex',
    gap: '16px',
  },
  label: {
    fontSize: '0.82rem',
    fontWeight: '750',
    color: '#374151',
  },
  formInput: {
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid #D1D5DB',
    outline: 'none',
    fontSize: '0.9rem',
    width: '100%',
    transition: 'all 0.15s ease',
  },
  formSelect: {
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid #D1D5DB',
    outline: 'none',
    fontSize: '0.9rem',
    width: '100%',
    backgroundColor: '#FFFFFF',
    cursor: 'pointer',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '10px',
  },
  cancelBtn: {
    padding: '10px 18px',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
    backgroundColor: '#FFFFFF',
    color: '#4B5563',
    fontWeight: '700',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  saveBtn: {
    padding: '10px 22px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#00B894',
    color: '#FFFFFF',
    fontWeight: '750',
    fontSize: '0.85rem',
    cursor: 'pointer',
  }
};
