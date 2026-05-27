import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { Search, Plus, Trash2, Edit3, X, HelpCircle, Map } from 'lucide-react';

export default function Districts() {
  const [districts, setDistricts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDistrict, setEditingDistrict] = useState(null);
  const [formData, setFormData] = useState({
    name: ''
  });

  const fetchDistricts = async () => {
    try {
      setLoading(true);
      const data = await api.get('/admin/districts');
      setDistricts(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to retrieve districts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDistricts();
  }, []);

  const handleOpenAdd = () => {
    setEditingDistrict(null);
    setFormData({ name: '' });
    setModalOpen(true);
  };

  const handleOpenEdit = (district) => {
    setEditingDistrict(district);
    setFormData({ name: district.name });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this district? All mandals and subscriptions within this district will be affected.')) {
      return;
    }

    try {
      await api.delete(`/admin/districts/${id}`);
      setDistricts(districts.filter(d => d.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete district');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('District name is required');
      return;
    }

    try {
      if (editingDistrict) {
        // Update API
        const updated = await api.put(`/admin/districts/${editingDistrict.id}`, formData);
        setDistricts(districts.map(d => d.id === editingDistrict.id ? updated : d));
      } else {
        // Create API
        const created = await api.post('/admin/districts', formData);
        setDistricts([...districts, created]);
      }
      setModalOpen(false);
    } catch (err) {
      alert(err.message || 'Failed to save district');
    }
  };

  const filteredDistricts = districts.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={styles.container} className="animate-fade-in">
      {/* Header and Add Action */}
      <div style={styles.actionHeader}>
        <div style={styles.titleArea}>
          <h1 style={styles.title}>Districts Directory</h1>
          <p style={styles.subtitle}>Manage regional districts and territory scopes.</p>
        </div>
        
        <button onClick={handleOpenAdd} style={styles.addBtn}>
          <Plus size={18} />
          <span>Add District</span>
        </button>
      </div>

      {/* Filter and stats row */}
      <div style={styles.filterBar}>
        <div style={styles.searchContainer}>
          <Search size={18} color="#9CA3AF" style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search districts by name..."
            style={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={styles.statusStats}>
          Total Districts: <strong style={{ color: '#111827' }}>{districts.length}</strong>
        </div>
      </div>

      {/* Content area */}
      {loading ? (
        <div style={styles.loading}>Loading districts catalog...</div>
      ) : error ? (
        <div style={styles.error}>{error}</div>
      ) : filteredDistricts.length === 0 ? (
        <div style={styles.empty}>
          <HelpCircle size={48} color="#9CA3AF" style={{ marginBottom: '12px' }} />
          <p>No districts found matching "{search}"</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredDistricts.map((district) => (
            <div key={district.id} style={styles.districtCard}>
              <div style={styles.cardTop}>
                <div style={styles.iconContainer}>
                  <Map size={20} />
                </div>
                <h3 style={styles.districtName}>{district.name}</h3>
              </div>

              {/* Card Action Controls */}
              <div style={styles.cardActions}>
                <button 
                  onClick={() => handleOpenEdit(district)} 
                  style={styles.actionEditBtn}
                  title="Edit District"
                >
                  <Edit3 size={16} />
                  <span>Edit</span>
                </button>

                <button 
                  onClick={() => handleDelete(district.id)} 
                  style={styles.actionDeleteBtn}
                  title="Delete District"
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
              <h2 style={styles.modalTitle}>{editingDistrict ? 'Edit District' : 'Create New District'}</h2>
              <button onClick={() => setModalOpen(false)} style={styles.closeModalBtn}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>District Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Nellore"
                  style={styles.formInput}
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
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
                  {editingDistrict ? 'Save Changes' : 'Create'}
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
  districtCard: {
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
    padding: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flex: 1,
  },
  iconContainer: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E6F9F5',
    color: '#00B894',
  },
  districtName: {
    fontSize: '1.15rem',
    fontWeight: '800',
    color: '#111827',
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
    maxWidth: '400px',
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
