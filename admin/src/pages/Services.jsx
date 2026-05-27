import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { Search, Plus, Trash2, ShieldAlert, Sparkles, Pause, Play, Edit3, X, HelpCircle } from 'lucide-react';

export default function Services() {
  const [services, setServices] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    price: '',
    icon: 'construct-outline',
    status: 'Active'
  });

  const presetIcons = [
    { value: 'construct-outline', label: '🔧 Wrench (construct-outline)' },
    { value: 'sync-outline', label: '🔄 Rotate (sync-outline)' },
    { value: 'flash-outline', label: '⚡ Bolt (flash-outline)' },
    { value: 'toggle-outline', label: '🎛️ Toggle (toggle-outline)' },
    { value: 'cog-outline', label: '⚙️ Gear (cog-outline)' },
    { value: 'hammer-outline', label: '🔨 Hammer (hammer-outline)' },
    { value: 'build-outline', label: '🛠️ Build Tools (build-outline)' }
  ];

  const fetchServices = async () => {
    try {
      setLoading(true);
      const data = await api.get('/admin/services');
      setServices(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to retrieve services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleOpenAdd = () => {
    setEditingService(null);
    setFormData({
      title: '',
      subtitle: '',
      price: '',
      icon: 'construct-outline',
      status: 'Active'
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (service) => {
    setEditingService(service);
    setFormData({
      title: service.title,
      subtitle: service.subtitle,
      price: service.price,
      icon: service.icon,
      status: service.status
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this service? All past bookings referencing it will remain, but users won\'t see it.')) {
      return;
    }

    try {
      await api.delete(`/admin/services/${id}`);
      setServices(services.filter(s => s.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete service');
    }
  };

  const handleToggleHold = async (service) => {
    const nextStatus = service.status === 'Active' ? 'Hold' : 'Active';
    try {
      const updated = await api.put(`/admin/services/${service.id}`, {
        title: service.title,
        subtitle: service.subtitle,
        price: service.price,
        icon: service.icon,
        status: nextStatus
      });
      
      setServices(services.map(s => s.id === service.id ? updated : s));
    } catch (err) {
      alert(err.message || 'Failed to change service status');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.subtitle || !formData.price) {
      alert('Please fill out all required fields');
      return;
    }

    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert('Please enter a valid price greater than zero');
      return;
    }

    try {
      if (editingService) {
        // Update API
        const updated = await api.put(`/admin/services/${editingService.id}`, {
          ...formData,
          price: priceNum
        });
        setServices(services.map(s => s.id === editingService.id ? updated : s));
      } else {
        // Create API
        const created = await api.post('/admin/services', {
          ...formData,
          price: priceNum
        });
        setServices([...services, created]);
      }
      setModalOpen(false);
    } catch (err) {
      alert(err.message || 'Failed to save service');
    }
  };

  const filteredServices = services.filter(service =>
    service.title.toLowerCase().includes(search.toLowerCase()) ||
    service.subtitle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={styles.container} className="animate-fade-in">
      {/* Header and Add Action */}
      <div style={styles.actionHeader}>
        <div style={styles.titleArea}>
          <h1 style={styles.title}>Services Catalog</h1>
          <p style={styles.subtitle}>Configure client repair services, prices, and suspension flags.</p>
        </div>
        
        <button onClick={handleOpenAdd} style={styles.addBtn}>
          <Plus size={18} />
          <span>Add New Service</span>
        </button>
      </div>

      {/* Filter and stats row */}
      <div style={styles.filterBar}>
        <div style={styles.searchContainer}>
          <Search size={18} color="#9CA3AF" style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search services by title or details..."
            style={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={styles.statusStats}>
          Total: <strong style={{ color: '#111827' }}>{services.length}</strong> | 
          Active: <strong style={{ color: '#00B894', marginLeft: '4px' }}>{services.filter(s => s.status === 'Active').length}</strong> | 
          Suspended: <strong style={{ color: '#F59E0B', marginLeft: '4px' }}>{services.filter(s => s.status === 'Hold').length}</strong>
        </div>
      </div>

      {/* Content area */}
      {loading ? (
        <div style={styles.loading}>Loading services catalog...</div>
      ) : error ? (
        <div style={styles.error}>{error}</div>
      ) : filteredServices.length === 0 ? (
        <div style={styles.empty}>
          <HelpCircle size={48} color="#9CA3AF" style={{ marginBottom: '12px' }} />
          <p>No services found matching "{search}"</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredServices.map((service) => {
            const isActive = service.status === 'Active';
            return (
              <div 
                key={service.id} 
                style={{
                  ...styles.serviceCard,
                  borderColor: isActive ? '#E5E7EB' : '#F59E0B'
                }}
              >
                {/* Card Icon & Header */}
                <div style={styles.cardTop}>
                  <div style={{
                    ...styles.iconContainer,
                    backgroundColor: isActive ? '#E6F9F5' : '#FEF3C7',
                    color: isActive ? '#00B894' : '#F59E0B'
                  }}>
                    <Sparkles size={20} />
                  </div>
                  <span style={{
                    ...styles.statusTag,
                    backgroundColor: isActive ? '#DCFCE7' : '#FEF3C7',
                    color: isActive ? '#15803D' : '#D97706'
                  }}>
                    {service.status}
                  </span>
                </div>

                <div style={styles.cardContent}>
                  <h3 style={styles.serviceTitle}>{service.title}</h3>
                  <p style={styles.serviceSubtitle}>{service.subtitle}</p>
                  
                  <div style={styles.priceRow}>
                    <span style={styles.priceLabel}>Service Price</span>
                    <span style={styles.priceVal}>₹{parseFloat(service.price).toFixed(2)}</span>
                  </div>

                  <div style={styles.iconBadgeRow}>
                    <span style={styles.iconNameLabel}>Icon Name: </span>
                    <code style={styles.iconNameCode}>{service.icon}</code>
                  </div>
                </div>

                {/* Card Action Controls */}
                <div style={styles.cardActions}>
                  <button 
                    onClick={() => handleToggleHold(service)} 
                    style={{
                      ...styles.actionIconBtn,
                      color: isActive ? '#F59E0B' : '#00B894',
                      backgroundColor: isActive ? '#FEF3C7' : '#E6F9F5'
                    }}
                    title={isActive ? 'Hold/Suspend Service' : 'Activate Service'}
                  >
                    {isActive ? <Pause size={16} /> : <Play size={16} />}
                    <span>{isActive ? 'Hold' : 'Activate'}</span>
                  </button>

                  <button 
                    onClick={() => handleOpenEdit(service)} 
                    style={{
                      ...styles.actionIconBtn,
                      color: '#0984E3',
                      backgroundColor: '#E3F2FD'
                    }}
                    title="Edit Details"
                  >
                    <Edit3 size={16} />
                    <span>Edit</span>
                  </button>

                  <button 
                    onClick={() => handleDelete(service.id)} 
                    style={{
                      ...styles.actionIconBtn,
                      color: '#EF4444',
                      backgroundColor: '#FEE2E2'
                    }}
                    title="Remove Service"
                  >
                    <Trash2 size={16} />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Dialog Modal */}
      {modalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContainer}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{editingService ? 'Edit Service' : 'Create New Service'}</h2>
              <button onClick={() => setModalOpen(false)} style={styles.closeModalBtn}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Service Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Geyser Repair"
                  style={styles.formInput}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Subtitle / Description *</label>
                <input
                  type="text"
                  placeholder="e.g. Element replacement, leakage repair"
                  style={styles.formInput}
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  required
                />
              </div>

              <div style={styles.formRow}>
                <div style={{ ...styles.inputGroup, flex: 1 }}>
                  <label style={styles.label}>Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 299"
                    style={styles.formInput}
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>

                <div style={{ ...styles.inputGroup, flex: 1 }}>
                  <label style={styles.label}>Device Icon *</label>
                  <select
                    style={styles.formSelect}
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  >
                    {presetIcons.map(icon => (
                      <option key={icon.value} value={icon.value}>{icon.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {editingService && (
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Status</label>
                  <select
                    style={styles.formSelect}
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="Hold">Hold (Suspended)</option>
                  </select>
                </div>
              )}

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
                  {editingService ? 'Save Changes' : 'Create Service'}
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
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '24px',
  },
  serviceCard: {
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
    padding: '16px 20px 0 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconContainer: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusTag: {
    fontSize: '0.72rem',
    fontWeight: '800',
    padding: '4px 10px',
    borderRadius: '9999px',
    textTransform: 'uppercase',
  },
  cardContent: {
    padding: '16px 20px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  serviceTitle: {
    fontSize: '1.05rem',
    fontWeight: '800',
    color: '#111827',
  },
  serviceSubtitle: {
    fontSize: '0.82rem',
    color: '#6B7280',
    lineHeight: '1.4',
    minHeight: '40px',
  },
  priceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '8px',
    borderTop: '1px solid #F3F4F6',
    paddingTop: '12px',
  },
  priceLabel: {
    fontSize: '0.78rem',
    color: '#9CA3AF',
    fontWeight: '600',
  },
  priceVal: {
    fontSize: '1.25rem',
    fontWeight: '850',
    color: '#00B894',
  },
  iconBadgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '4px',
  },
  iconNameLabel: {
    fontSize: '0.72rem',
    color: '#9CA3AF',
    fontWeight: '500',
  },
  iconNameCode: {
    fontSize: '0.72rem',
    backgroundColor: '#F3F4F6',
    color: '#4B5563',
    padding: '2px 6px',
    borderRadius: '4px',
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  cardActions: {
    display: 'flex',
    borderTop: '1px solid #F3F4F6',
    backgroundColor: '#FAFBFC',
  },
  actionIconBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '12px 8px',
    border: 'none',
    fontSize: '0.76rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    outline: 'none',
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
  // Modal Overlay styling
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
