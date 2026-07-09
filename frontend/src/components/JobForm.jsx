import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiX, FiSave, FiPlus, FiTrash2, FiTrendingUp, FiUser, FiChevronDown, FiUsers } from 'react-icons/fi';
import { showToast } from './Toast';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const emptyNewClient = {
  name: '',
  email: '',
  phone: '',
  company: '',
  address: { street: '', city: '', state: '', zipCode: '' },
};

function JobForm({ job, clients, onClose, onSave }) {
  const { isManager } = useAuth();
  const [recommendations, setRecommendations] = useState(null);
  const [creatingClient, setCreatingClient] = useState(false);
  const [newClient, setNewClient] = useState(emptyNewClient);
  const [employees, setEmployees] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    client: '',
    location: { street: '', city: '', state: '', zipCode: '' },
    status: 'quote',
    priority: 'medium',
    scheduledDate: '',
    scheduledTime: '',
    dueDate: '',
    costs: {
      laborHours: 0,
      laborRate: 85,
      materials: [],
      equipment: [],
      permitsCost: 0,
      subcontractorsCost: 0,
      otherCosts: 0,
      taxRate: 0,
      discount: 0
    },
    notes: [],
    assignedUsers: []
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (job) {
      const sd = job.scheduledDate ? new Date(job.scheduledDate) : null;
      setFormData({
        ...job,
        scheduledDate: sd ? sd.toISOString().split('T')[0] : '',
        scheduledTime: sd ? sd.toTimeString().slice(0, 5) : '',
        dueDate: job.dueDate ? new Date(job.dueDate).toISOString().split('T')[0] : '',
        client: job.client?._id || job.client,
        assignedUsers: (job.assignedUsers || []).map(u => u._id || u)
      });
    }
  }, [job]);

  useEffect(() => {
    if (!isManager) return;
    axios.get(`${API_URL}/auth/users`)
      .then(res => setEmployees(res.data.users || []))
      .catch(() => {});
  }, [isManager]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!job) {
        try {
          const response = await axios.get(`${API_URL}/jobs/recommendations`);
          setRecommendations(response.data);
        } catch (error) {
          console.error('Error fetching recommendations:', error);
        }
      }
    };
    fetchRecommendations();
  }, [job]);

  const handleClientSelectChange = (e) => {
    const val = e.target.value;
    if (val === '__new__') {
      setCreatingClient(true);
      setFormData({ ...formData, client: '' });
    } else {
      setCreatingClient(false);
      setFormData({ ...formData, client: val });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let clientId = formData.client;

      // If creating a new client inline, do that first
      if (creatingClient) {
        if (!newClient.name.trim()) {
          showToast('Client name is required', 'error');
          setLoading(false);
          return;
        }
        const token = localStorage.getItem('token');
        const clientRes = await axios.post(
          `${API_URL}/clients`,
          {
            name: newClient.name,
            email: newClient.email,
            phone: newClient.phone,
            company: newClient.company,
            address: newClient.address,
          }
        );
        clientId = clientRes.data._id;
      }

      if (!clientId) {
        showToast('Please select or create a client', 'error');
        setLoading(false);
        return;
      }

      // Combine date + time into a local ISO string to avoid UTC offset shifting the date
      let scheduledDateTime = null;
      if (formData.scheduledDate) {
        const time = formData.scheduledTime || '08:00';
        scheduledDateTime = new Date(`${formData.scheduledDate}T${time}:00`).toISOString();
      }
      const payload = { ...formData, client: clientId, scheduledDate: scheduledDateTime || formData.scheduledDate };
      let savedJob;

      if (job) {
        const res = await axios.patch(`${API_URL}/jobs/${job._id}`, payload);
        savedJob = res.data;
      } else {
        const res = await axios.post(`${API_URL}/jobs`, payload);
        savedJob = res.data;
      }

      // Auto-sync to Google Calendar if job has a scheduled date
      if (savedJob?._id && formData.scheduledDate) {
        try {
          const token = localStorage.getItem('token');
          await axios.post(
            `${API_URL}/automation/sync-to-calendar/${savedJob._id}`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch {
          // Non-fatal — job saved even if calendar sync fails
        }
      }

      onSave();
    } catch (error) {
      console.error('Error saving job:', error);
      showToast(error.response?.data?.error || 'Error saving job', 'error');
    } finally {
      setLoading(false);
    }
  };

  const addMaterial = () => {
    setFormData({
      ...formData,
      costs: {
        ...formData.costs,
        materials: [...formData.costs.materials, { name: '', description: '', quantity: 1, unitPrice: 0, totalPrice: 0 }]
      }
    });
  };

  const updateMaterial = (index, field, value) => {
    const newMaterials = [...formData.costs.materials];
    newMaterials[index][field] = value;
    if (field === 'quantity' || field === 'unitPrice') {
      newMaterials[index].totalPrice = newMaterials[index].quantity * newMaterials[index].unitPrice;
    }
    setFormData({ ...formData, costs: { ...formData.costs, materials: newMaterials } });
  };

  const removeMaterial = (index) => {
    setFormData({
      ...formData,
      costs: { ...formData.costs, materials: formData.costs.materials.filter((_, i) => i !== index) }
    });
  };

  const applyRecommendations = () => {
    if (!recommendations?.recommendations) return;
    const rec = recommendations.recommendations;
    setFormData(prev => ({
      ...prev,
      costs: {
        ...prev.costs,
        laborHours: rec.laborHours,
        laborRate: rec.laborRate,
        permitsCost: rec.permitsCost,
        subcontractorsCost: rec.subcontractorsCost,
        otherCosts: rec.otherCosts,
        taxRate: rec.taxRate
      }
    }));
  };

  const inputStyle = {
    padding: '10px 12px',
    border: '1.5px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#111827',
    background: '#ffffff',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    outline: 'none',
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ color: '#111827' }}>{job ? 'Edit Job' : 'New Job'}</h2>
          <button className="icon-btn" onClick={onClose}><FiX /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">

            {/* Basic Information */}
            <section className="form-section">
              <h3>Basic Information</h3>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Job Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Kitchen Rewiring"
                    style={inputStyle}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                    placeholder="Job details..."
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>

                {/* Client selector */}
                <div className="form-group">
                  <label>Client *</label>
                  <select
                    value={creatingClient ? '__new__' : formData.client}
                    onChange={handleClientSelectChange}
                    style={inputStyle}
                  >
                    <option value="">Select a client</option>
                    {clients.map((client) => (
                      <option key={client._id} value={client._id}>
                        {client.name}{client.email ? ` — ${client.email}` : ''}
                      </option>
                    ))}
                    <option value="__new__">+ Create new client</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} style={inputStyle}>
                    <option value="quote">Quote</option>
                    <option value="approved">Approved</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="invoiced">Invoiced</option>
                    <option value="paid">Paid</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Priority</label>
                  <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} style={inputStyle}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Scheduled Date</label>
                  <input
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    onClick={(e) => e.target.showPicker?.()}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  />
                </div>

                <div className="form-group">
                  <label>Scheduled Time</label>
                  <input
                    type="time"
                    value={formData.scheduledTime}
                    onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                    onClick={(e) => e.target.showPicker?.()}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  />
                </div>

                <div className="form-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    onClick={(e) => e.target.showPicker?.()}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  />
                </div>
              </div>
            </section>

            {/* Inline New Client Form */}
            {creatingClient && (
              <section className="form-section" style={{ background: '#f0fdf4', border: '2px solid #86efac', borderRadius: '12px', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <FiUser size={18} style={{ color: '#16a34a' }} />
                  <h3 style={{ margin: 0, color: '#15803d' }}>New Client Details</h3>
                  <button
                    type="button"
                    onClick={() => { setCreatingClient(false); setNewClient(emptyNewClient); }}
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '18px', padding: '0 4px' }}
                  >
                    <FiX />
                  </button>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      value={newClient.name}
                      onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                      placeholder="John Smith"
                      style={inputStyle}
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={newClient.email}
                      onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                      placeholder="john@example.com"
                      style={inputStyle}
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      value={newClient.phone}
                      onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                      placeholder="(555) 000-0000"
                      style={inputStyle}
                    />
                  </div>
                  <div className="form-group">
                    <label>Company</label>
                    <input
                      type="text"
                      value={newClient.company}
                      onChange={(e) => setNewClient({ ...newClient, company: e.target.value })}
                      placeholder="Company name (optional)"
                      style={inputStyle}
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Street Address</label>
                    <input
                      type="text"
                      value={newClient.address.street}
                      onChange={(e) => setNewClient({ ...newClient, address: { ...newClient.address, street: e.target.value } })}
                      placeholder="123 Main St"
                      style={inputStyle}
                    />
                  </div>
                  <div className="form-group">
                    <label>City</label>
                    <input
                      type="text"
                      value={newClient.address.city}
                      onChange={(e) => setNewClient({ ...newClient, address: { ...newClient.address, city: e.target.value } })}
                      style={inputStyle}
                    />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input
                      type="text"
                      value={newClient.address.state}
                      onChange={(e) => setNewClient({ ...newClient, address: { ...newClient.address, state: e.target.value } })}
                      style={inputStyle}
                    />
                  </div>
                  <div className="form-group">
                    <label>Zip Code</label>
                    <input
                      type="text"
                      value={newClient.address.zipCode}
                      onChange={(e) => setNewClient({ ...newClient, address: { ...newClient.address, zipCode: e.target.value } })}
                      style={inputStyle}
                    />
                  </div>
                </div>
                <p style={{ margin: '12px 0 0', fontSize: '13px', color: '#16a34a' }}>
                  This client will be created and saved to your Clients page when you save the job.
                </p>
              </section>
            )}

            {/* Assign Employees — admin/manager only */}
            {isManager && employees.length > 0 && (
              <section className="form-section">
                <h3><FiUsers style={{ marginRight: '8px' }} />Assign Employees</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {employees.map(emp => {
                    const isSelected = (formData.assignedUsers || []).includes(emp._id);
                    return (
                      <button
                        key={emp._id}
                        type="button"
                        onClick={() => {
                          const current = formData.assignedUsers || [];
                          setFormData({
                            ...formData,
                            assignedUsers: isSelected
                              ? current.filter(id => id !== emp._id)
                              : [...current, emp._id]
                          });
                        }}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '20px',
                          border: isSelected ? '2px solid #d4af37' : '2px solid #e5e7eb',
                          background: isSelected ? '#fef9e7' : '#f9fafb',
                          color: isSelected ? '#92400e' : '#374151',
                          fontSize: '13px',
                          fontWeight: isSelected ? '600' : '400',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <FiUser size={13} />
                        {emp.name}
                        <span style={{ fontSize: '11px', color: isSelected ? '#b45309' : '#9ca3af', textTransform: 'capitalize' }}>
                          ({emp.role})
                        </span>
                      </button>
                    );
                  })}
                </div>
                {(formData.assignedUsers || []).length > 0 && (
                  <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#6b7280' }}>
                    {(formData.assignedUsers || []).length} employee{(formData.assignedUsers || []).length !== 1 ? 's' : ''} assigned
                  </p>
                )}
              </section>
            )}

            {/* Job Location */}
            <section className="form-section">
              <h3>Job Location</h3>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Street Address</label>
                  <input type="text" value={formData.location.street} onChange={(e) => setFormData({ ...formData, location: { ...formData.location, street: e.target.value } })} style={inputStyle} />
                </div>
                <div className="form-group">
                  <label>City</label>
                  <input type="text" value={formData.location.city} onChange={(e) => setFormData({ ...formData, location: { ...formData.location, city: e.target.value } })} style={inputStyle} />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input type="text" value={formData.location.state} onChange={(e) => setFormData({ ...formData, location: { ...formData.location, state: e.target.value } })} style={inputStyle} />
                </div>
                <div className="form-group">
                  <label>Zip Code</label>
                  <input type="text" value={formData.location.zipCode} onChange={(e) => setFormData({ ...formData, location: { ...formData.location, zipCode: e.target.value } })} style={inputStyle} />
                </div>
              </div>
            </section>

            {/* Recommendations Banner */}
            {recommendations?.hasData && !job && (
              <div className="recommendations-banner">
                <div className="banner-icon"><FiTrendingUp size={24} /></div>
                <div className="banner-content">
                  <h4>Recommended Values Available</h4>
                  <p>Based on {recommendations.basedOnJobs} completed jobs with actual expenses</p>
                </div>
                <button type="button" onClick={applyRecommendations} className="btn-secondary">
                  Apply Recommendations
                </button>
              </div>
            )}

            {/* Labor Costs */}
            <section className="form-section">
              <h3>Labor Costs</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Labor Hours</label>
                  <input type="number" step="0.5" value={formData.costs.laborHours} onChange={(e) => setFormData({ ...formData, costs: { ...formData.costs, laborHours: parseFloat(e.target.value) || 0 } })} style={inputStyle} />
                </div>
                <div className="form-group">
                  <label>Hourly Rate ($)</label>
                  <input type="number" step="0.01" value={formData.costs.laborRate} onChange={(e) => setFormData({ ...formData, costs: { ...formData.costs, laborRate: parseFloat(e.target.value) || 0 } })} style={inputStyle} />
                </div>
              </div>
            </section>

            {/* Materials */}
            <section className="form-section">
              <div className="section-header">
                <h3>Materials</h3>
                <button type="button" className="btn-secondary small" onClick={addMaterial}><FiPlus /> Add Material</button>
              </div>
              {formData.costs.materials.map((material, index) => (
                <div key={index} className="material-row">
                  <div className="form-grid">
                    <div className="form-group">
                      <input type="text" placeholder="Name" value={material.name} onChange={(e) => updateMaterial(index, 'name', e.target.value)} style={inputStyle} />
                    </div>
                    <div className="form-group">
                      <input type="number" placeholder="Qty" value={material.quantity} onChange={(e) => updateMaterial(index, 'quantity', parseFloat(e.target.value) || 0)} style={inputStyle} />
                    </div>
                    <div className="form-group">
                      <input type="number" step="0.01" placeholder="Unit Price" value={material.unitPrice} onChange={(e) => updateMaterial(index, 'unitPrice', parseFloat(e.target.value) || 0)} style={inputStyle} />
                    </div>
                    <div className="form-group">
                      <input type="number" step="0.01" placeholder="Total" value={material.totalPrice} readOnly style={{ ...inputStyle, background: '#f9fafb', cursor: 'not-allowed' }} />
                    </div>
                    <button type="button" className="icon-btn delete" onClick={() => removeMaterial(index)}><FiTrash2 /></button>
                  </div>
                </div>
              ))}
            </section>

            {/* Other Costs */}
            <section className="form-section">
              <h3>Other Costs</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Permits ($)</label>
                  <input type="number" step="0.01" value={formData.costs.permitsCost} onChange={(e) => setFormData({ ...formData, costs: { ...formData.costs, permitsCost: parseFloat(e.target.value) || 0 } })} style={inputStyle} />
                </div>
                <div className="form-group">
                  <label>Subcontractors ($)</label>
                  <input type="number" step="0.01" value={formData.costs.subcontractorsCost} onChange={(e) => setFormData({ ...formData, costs: { ...formData.costs, subcontractorsCost: parseFloat(e.target.value) || 0 } })} style={inputStyle} />
                </div>
                <div className="form-group">
                  <label>Other Costs ($)</label>
                  <input type="number" step="0.01" value={formData.costs.otherCosts} onChange={(e) => setFormData({ ...formData, costs: { ...formData.costs, otherCosts: parseFloat(e.target.value) || 0 } })} style={inputStyle} />
                </div>
                <div className="form-group">
                  <label>Tax Rate (%)</label>
                  <input type="number" step="0.01" value={(formData.costs.taxRate * 100).toFixed(2)} onChange={(e) => setFormData({ ...formData, costs: { ...formData.costs, taxRate: parseFloat(e.target.value) / 100 || 0 } })} style={inputStyle} />
                </div>
                <div className="form-group">
                  <label>Discount ($)</label>
                  <input type="number" step="0.01" value={formData.costs.discount} onChange={(e) => setFormData({ ...formData, costs: { ...formData.costs, discount: parseFloat(e.target.value) || 0 } })} style={inputStyle} />
                </div>
              </div>
            </section>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              <FiSave /> {loading ? 'Saving...' : job ? 'Update Job' : 'Create Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default JobForm;
