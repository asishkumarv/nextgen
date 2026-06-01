import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { Search, Plus, Trash2, Edit3, X, HelpCircle, MapPin, DollarSign, Calendar, Sliders, FileText } from 'lucide-react';

export default function Mandals() {
  const [mandals, setMandals] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form Modal States for Mandal
  const [mandalModalOpen, setMandalModalOpen] = useState(false);
  const [editingMandal, setEditingMandal] = useState(null);
  const [mandalFormData, setMandalFormData] = useState({
    district_id: '',
    name: ''
  });

  // Form Modal States for Event
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [activeMandalId, setActiveMandalId] = useState(null);
  const [eventFormData, setEventFormData] = useState({
    event_name: '',
    description: '',
    slots: '',
    price: '',
    booking_price: '199'
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

  // --- Mandal Handlers ---
  const handleOpenAddMandal = () => {
    setEditingMandal(null);
    setMandalFormData({
      district_id: districts[0]?.id || '',
      name: ''
    });
    setMandalModalOpen(true);
  };

  const handleOpenEditMandal = (mandal) => {
    setEditingMandal(mandal);
    setMandalFormData({
      district_id: mandal.district_id,
      name: mandal.name
    });
    setMandalModalOpen(true);
  };

  const handleDeleteMandal = async (id) => {
    if (!window.confirm('Are you sure you want to delete this mandal? All events, subscriptions and bookings inside this mandal will lose their connection.')) {
      return;
    }
    try {
      await api.delete(`/admin/mandals/${id}`);
      setMandals(mandals.filter(m => m.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete mandal');
    }
  };

  const handleMandalSubmit = async (e) => {
    e.preventDefault();
    const { district_id, name } = mandalFormData;
    if (!district_id || !name.trim()) {
      alert('Please fill out all fields');
      return;
    }
    try {
      const payload = {
        district_id: parseInt(district_id),
        name: name.trim()
      };
      if (editingMandal) {
        const updated = await api.put(`/admin/mandals/${editingMandal.id}`, payload);
        setMandals(mandals.map(m => m.id === editingMandal.id ? { ...updated, events: m.events } : m));
      } else {
        const created = await api.post('/admin/mandals', payload);
        created.events = [];
        setMandals([...mandals, created]);
      }
      setMandalModalOpen(false);
    } catch (err) {
      alert(err.message || 'Failed to save mandal');
    }
  };

  // --- Event Handlers ---
  const handleOpenAddEvent = (mandalId) => {
    setActiveMandalId(mandalId);
    setEditingEvent(null);
    setEventFormData({
      event_name: '',
      description: '',
      slots: '',
      price: '',
      booking_price: '199'
    });
    setEventModalOpen(true);
  };

  const handleOpenEditEvent = (mandalId, event) => {
    setActiveMandalId(mandalId);
    setEditingEvent(event);
    setEventFormData({
      event_name: event.event_name,
      description: event.description || '',
      slots: event.slots,
      price: event.price,
      booking_price: event.booking_price
    });
    setEventModalOpen(true);
  };

  const handleDeleteEvent = async (mandalId, eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await api.delete(`/admin/events/${eventId}`);
      setMandals(mandals.map(m => {
        if (m.id === mandalId) {
          return { ...m, events: m.events.filter(e => e.id !== eventId) };
        }
        return m;
      }));
    } catch (err) {
      alert(err.message || 'Failed to delete event');
    }
  };

  const handleEventSubmit = async (e) => {
    e.preventDefault();
    const { event_name, description, slots, price, booking_price } = eventFormData;
    if (!event_name.trim() || !slots.trim() || price === '') {
      alert('Please fill out all required event fields');
      return;
    }
    try {
      const payload = {
        mandal_id: activeMandalId,
        event_name: event_name.trim(),
        description: description.trim(),
        slots: slots.trim(),
        price: parseFloat(price),
        booking_price: parseFloat(booking_price || 0)
      };

      if (editingEvent) {
        const updated = await api.put(`/admin/events/${editingEvent.id}`, payload);
        setMandals(mandals.map(m => {
          if (m.id === activeMandalId) {
            return { ...m, events: m.events.map(ev => ev.id === editingEvent.id ? updated : ev) };
          }
          return m;
        }));
      } else {
        const created = await api.post('/admin/events', payload);
        setMandals(mandals.map(m => {
          if (m.id === activeMandalId) {
            return { ...m, events: [...m.events, created] };
          }
          return m;
        }));
      }
      setEventModalOpen(false);
    } catch (err) {
      alert(err.message || 'Failed to save event');
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
            for (let i = start; i <= end; i++) expanded.push(i);
            continue;
          }
        }
      }
      if (part) expanded.push(part);
    }
    return expanded.join(', ');
  };

  const filteredMandals = mandals.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.districtName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={styles.container} className="animate-fade-in">
      <div style={styles.actionHeader}>
        <div style={styles.titleArea}>
          <h1 style={styles.title}>Mandals & Events Registry</h1>
          <p style={styles.subtitle}>Configure Mandals and their respective Events, Slots, and Prices.</p>
        </div>
        <button onClick={handleOpenAddMandal} disabled={districts.length === 0} style={styles.addBtn}>
          <Plus size={18} />
          <span>Add Mandal</span>
        </button>
      </div>

      {districts.length === 0 && !loading && (
        <div style={styles.warningAlert}>
          <strong>Warning:</strong> You must create at least one District before configuring Mandals.
        </div>
      )}

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

      {loading ? (
        <div style={styles.loading}>Loading directory...</div>
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
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleOpenEditMandal(mandal)} style={styles.iconBtn} title="Edit Mandal Name">
                    <Edit3 size={16} color="#0984E3" />
                  </button>
                  <button onClick={() => handleDeleteMandal(mandal.id)} style={styles.iconBtn} title="Delete Mandal">
                    <Trash2 size={16} color="#EF4444" />
                  </button>
                </div>
              </div>

              <div style={styles.eventsSection}>
                <div style={styles.eventsHeader}>
                  <h4 style={styles.eventsTitle}>Configured Events</h4>
                  <button onClick={() => handleOpenAddEvent(mandal.id)} style={styles.addEventBtn}>
                    <Plus size={14} /> Add Event
                  </button>
                </div>
                {mandal.events && mandal.events.length > 0 ? (
                  <div style={styles.eventsList}>
                    {mandal.events.map(event => (
                      <div key={event.id} style={styles.eventItem}>
                        <div style={styles.eventItemTop}>
                          <span style={styles.eventItemName}>{event.event_name}</span>
                          <div style={styles.eventItemActions}>
                            <button onClick={() => handleOpenEditEvent(mandal.id, event)} style={{...styles.iconBtn, padding: '2px'}} title="Edit Event">
                              <Edit3 size={14} color="#6B7280" />
                            </button>
                            <button onClick={() => handleDeleteEvent(mandal.id, event.id)} style={{...styles.iconBtn, padding: '2px'}} title="Delete Event">
                              <Trash2 size={14} color="#EF4444" />
                            </button>
                          </div>
                        </div>
                        {event.description && (
                          <div style={styles.infoRow}>
                            <FileText size={12} style={styles.infoIcon} />
                            <span style={styles.infoValDesc}>{event.description}</span>
                          </div>
                        )}
                        <div style={styles.infoRow}>
                          <Sliders size={12} style={styles.infoIcon} />
                          <code style={styles.slotsCode}>{event.slots}</code>
                        </div>
                        <div style={styles.pricesRow}>
                          <div style={styles.pricePill}>Sub: ₹{parseFloat(event.price).toFixed(0)}</div>
                          <div style={styles.pricePill}>Book: ₹{parseFloat(event.booking_price).toFixed(0)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={styles.noEventsText}>No events added yet.</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mandal Modal */}
      {mandalModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContainer}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{editingMandal ? 'Edit Mandal' : 'Create New Mandal'}</h2>
              <button onClick={() => setMandalModalOpen(false)} style={styles.closeModalBtn}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleMandalSubmit} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Select District *</label>
                <select
                  style={styles.formSelect}
                  value={mandalFormData.district_id}
                  onChange={(e) => setMandalFormData({ ...mandalFormData, district_id: e.target.value })}
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
                  value={mandalFormData.name}
                  onChange={(e) => setMandalFormData({ ...mandalFormData, name: e.target.value })}
                  required
                />
              </div>
              <div style={styles.modalActions}>
                <button type="button" onClick={() => setMandalModalOpen(false)} style={styles.cancelBtn}>Cancel</button>
                <button type="submit" style={styles.saveBtn}>{editingMandal ? 'Save Changes' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Modal */}
      {eventModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContainer}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{editingEvent ? 'Edit Event' : 'Add Event to Mandal'}</h2>
              <button onClick={() => setEventModalOpen(false)} style={styles.closeModalBtn}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEventSubmit} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Event Name *</label>
                <input
                  type="text"
                  placeholder="e.g. AC Service Plan"
                  style={styles.formInput}
                  value={eventFormData.event_name}
                  onChange={(e) => setEventFormData({ ...eventFormData, event_name: e.target.value })}
                  required
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  placeholder="Detailed description of the event to show to users..."
                  style={{...styles.formInput, minHeight: '80px', resize: 'vertical'}}
                  value={eventFormData.description}
                  onChange={(e) => setEventFormData({ ...eventFormData, description: e.target.value })}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Slot numbers (Comma separated or ranges) *</label>
                <input
                  type="text"
                  placeholder="e.g. 101-105, 110"
                  style={styles.formInput}
                  value={eventFormData.slots}
                  onChange={(e) => setEventFormData({ ...eventFormData, slots: e.target.value })}
                  required
                />
              </div>
              <div style={styles.formRow}>
                <div style={{...styles.inputGroup, flex: 1}}>
                  <label style={styles.label}>Subscription Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 2999"
                    style={styles.formInput}
                    value={eventFormData.price}
                    onChange={(e) => setEventFormData({ ...eventFormData, price: e.target.value })}
                    required
                  />
                </div>
                <div style={{...styles.inputGroup, flex: 1}}>
                  <label style={styles.label}>Booking Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 199"
                    style={styles.formInput}
                    value={eventFormData.booking_price}
                    onChange={(e) => setEventFormData({ ...eventFormData, booking_price: e.target.value })}
                  />
                </div>
              </div>
              <div style={styles.modalActions}>
                <button type="button" onClick={() => setEventModalOpen(false)} style={styles.cancelBtn}>Cancel</button>
                <button type="submit" style={styles.saveBtn}>{editingEvent ? 'Save Event' : 'Add Event'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: '24px' },
  actionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' },
  titleArea: { display: 'flex', flexDirection: 'column', gap: '4px' },
  title: { fontSize: '1.4rem', fontWeight: '850', color: '#111827' },
  subtitle: { fontSize: '0.85rem', color: '#6B7280', fontWeight: '500' },
  addBtn: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '10px', backgroundColor: '#00B894', color: '#FFFFFF', border: 'none', fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0, 184, 148, 0.15)', transition: 'all 0.15s ease' },
  warningAlert: { padding: '12px 16px', backgroundColor: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: '10px', color: '#D97706', fontSize: '0.85rem', marginBottom: '20px' },
  filterBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' },
  searchContainer: { display: 'flex', alignItems: 'center', backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '0 16px', width: '100%', maxWidth: '380px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' },
  searchIcon: { marginRight: '10px', flexShrink: 0 },
  searchInput: { border: 'none', outline: 'none', padding: '12px 0', width: '100%', fontSize: '0.9rem', color: '#374151', fontWeight: '500' },
  statusStats: { fontSize: '0.82rem', color: '#6B7280', fontWeight: '600', backgroundColor: '#FFFFFF', padding: '8px 16px', borderRadius: '10px', border: '1px solid #E5E7EB' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' },
  card: { backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  cardTop: { padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #F3F4F6' },
  iconContainer: { width: '42px', height: '42px', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#E0F2FE', color: '#0984E3' },
  cardHeader: { display: 'flex', flexDirection: 'column', gap: '2px' },
  mandalName: { fontSize: '1.1rem', fontWeight: '800', color: '#111827' },
  districtBadge: { fontSize: '0.72rem', fontWeight: '750', backgroundColor: '#F3F4F6', color: '#4B5563', padding: '2px 8px', borderRadius: '6px', alignSelf: 'flex-start' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB' },
  eventsSection: { padding: '16px 20px', backgroundColor: '#FAFBFC', flex: 1 },
  eventsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  eventsTitle: { fontSize: '0.85rem', fontWeight: '750', color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.5px' },
  addEventBtn: { background: 'none', border: '1px solid #D1D5DB', borderRadius: '6px', padding: '4px 10px', fontSize: '0.75rem', fontWeight: '600', color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#FFF' },
  eventsList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  eventItem: { backgroundColor: '#FFFFFF', padding: '12px', borderRadius: '10px', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: '8px' },
  eventItemTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  eventItemName: { fontSize: '0.95rem', fontWeight: '700', color: '#111827' },
  eventItemActions: { display: 'flex', gap: '4px' },
  infoRow: { display: 'flex', alignItems: 'flex-start', gap: '8px' },
  infoIcon: { color: '#9CA3AF', marginTop: '2px', flexShrink: 0 },
  infoValDesc: { fontSize: '0.8rem', color: '#6B7280', lineHeight: '1.4' },
  slotsCode: { fontSize: '0.75rem', backgroundColor: '#F3F4F6', color: '#4B5563', padding: '2px 6px', borderRadius: '4px', fontWeight: '600', fontFamily: 'monospace', wordBreak: 'break-all' },
  pricesRow: { display: 'flex', gap: '8px', marginTop: '4px' },
  pricePill: { fontSize: '0.7rem', fontWeight: '700', backgroundColor: '#E6F4EA', color: '#00B894', padding: '2px 8px', borderRadius: '12px' },
  noEventsText: { fontSize: '0.85rem', color: '#9CA3AF', fontStyle: 'italic' },
  loading: { padding: '100px 0', textAlign: 'center', color: '#6B7280', fontWeight: '700', fontSize: '1.1rem' },
  empty: { padding: '80px 0', textAlign: 'center', color: '#9CA3AF', fontWeight: '600', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  error: { padding: '20px', backgroundColor: '#FEE2E2', color: '#EF4444', border: '1px solid #FCA5A5', borderRadius: '12px', textAlign: 'center', fontWeight: '600', marginBottom: '20px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(31, 41, 55, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999 },
  modalContainer: { backgroundColor: '#FFFFFF', borderRadius: '20px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden' },
  modalHeader: { padding: '20px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: '1.1rem', fontWeight: '800', color: '#111827' },
  closeModalBtn: { backgroundColor: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  form: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  formRow: { display: 'flex', gap: '16px' },
  label: { fontSize: '0.82rem', fontWeight: '750', color: '#374151' },
  formInput: { padding: '12px 14px', borderRadius: '10px', border: '1px solid #D1D5DB', outline: 'none', fontSize: '0.9rem', width: '100%', transition: 'all 0.15s ease' },
  formSelect: { padding: '12px 14px', borderRadius: '10px', border: '1px solid #D1D5DB', outline: 'none', fontSize: '0.9rem', width: '100%', backgroundColor: '#FFFFFF', cursor: 'pointer' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' },
  cancelBtn: { padding: '10px 18px', borderRadius: '8px', border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', color: '#4B5563', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' },
  saveBtn: { padding: '10px 22px', borderRadius: '8px', border: 'none', backgroundColor: '#00B894', color: '#FFFFFF', fontWeight: '750', fontSize: '0.85rem', cursor: 'pointer' }
};
