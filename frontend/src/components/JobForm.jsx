import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiX, FiSave, FiPlus, FiTrash2, FiTrendingUp } from 'react-icons/fi';

const API_URL = 'http://localhost:5000/api';

function JobForm({ job, clients, onClose, onSave }) {
  const [recommendations, setRecommendations] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    client: '',
    location: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    status: 'quote',
    priority: 'medium',
    scheduledDate: '',
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
    notes: []
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (job) {
      setFormData({
        ...job,
        scheduledDate: job.scheduledDate ? new Date(job.scheduledDate).toISOString().split('T')[0] : '',
        dueDate: job.dueDate ? new Date(job.dueDate).toISOString().split('T')[0] : '',
        client: job.client?._id || job.client
      });
    }
  }, [job]);

  // Fetch recommendations for new jobs only
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!job) { // Only for new jobs
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (job) {
        // Update existing job
        await axios.patch(`${API_URL}/jobs/${job._id}`, formData);
      } else {
        // Create new job
        await axios.post(`${API_URL}/jobs`, formData);
      }
      onSave();
    } catch (error) {
      console.error('Error saving job:', error);
      alert('Error saving job');
    } finally {
      setLoading(false);
    }
  };

  const addMaterial = () => {
    setFormData({
      ...formData,
      costs: {
        ...formData.costs,
        materials: [
          ...formData.costs.materials,
          { name: '', description: '', quantity: 1, unitPrice: 0, totalPrice: 0 }
        ]
      }
    });
  };

  const updateMaterial = (index, field, value) => {
    const newMaterials = [...formData.costs.materials];
    newMaterials[index][field] = value;

    // Auto-calculate total price
    if (field === 'quantity' || field === 'unitPrice') {
      newMaterials[index].totalPrice = newMaterials[index].quantity * newMaterials[index].unitPrice;
    }

    setFormData({
      ...formData,
      costs: {
        ...formData.costs,
        materials: newMaterials
      }
    });
  };

  const removeMaterial = (index) => {
    setFormData({
      ...formData,
      costs: {
        ...formData.costs,
        materials: formData.costs.materials.filter((_, i) => i !== index)
      }
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{job ? 'Edit Job' : 'New Job'}</h2>
          <button className="icon-btn" onClick={onClose}>
            <FiX />
          </button>
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
                  />
                </div>

                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                    placeholder="Job details..."
                  />
                </div>

                <div className="form-group">
                  <label>Client *</label>
                  <select
                    required
                    value={formData.client}
                    onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                  >
                    <option value="">Select a client</option>
                    {clients.map((client) => (
                      <option key={client._id} value={client._id}>
                        {client.name} - {client.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
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
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
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
                  />
                </div>

                <div className="form-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
              </div>
            </section>

            {/* Location */}
            <section className="form-section">
              <h3>Job Location</h3>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Street Address</label>
                  <input
                    type="text"
                    value={formData.location.street}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location: { ...formData.location, street: e.target.value }
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    value={formData.location.city}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location: { ...formData.location, city: e.target.value }
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input
                    type="text"
                    value={formData.location.state}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location: { ...formData.location, state: e.target.value }
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Zip Code</label>
                  <input
                    type="text"
                    value={formData.location.zipCode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location: { ...formData.location, zipCode: e.target.value }
                      })
                    }
                  />
                </div>
              </div>
            </section>

            {/* Recommendations Banner */}
            {recommendations?.hasData && !job && (
              <div className="recommendations-banner">
                <div className="banner-icon">
                  <FiTrendingUp size={24} />
                </div>
                <div className="banner-content">
                  <h4>Recommended Values Available</h4>
                  <p>Based on {recommendations.basedOnJobs} completed jobs with actual expenses</p>
                </div>
                <button onClick={applyRecommendations} className="btn-secondary">
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
                  <input
                    type="number"
                    step="0.5"
                    value={formData.costs.laborHours}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        costs: { ...formData.costs, laborHours: parseFloat(e.target.value) || 0 }
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Hourly Rate ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.costs.laborRate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        costs: { ...formData.costs, laborRate: parseFloat(e.target.value) || 0 }
                      })
                    }
                  />
                </div>
              </div>
            </section>

            {/* Materials */}
            <section className="form-section">
              <div className="section-header">
                <h3>Materials</h3>
                <button type="button" className="btn-secondary small" onClick={addMaterial}>
                  <FiPlus /> Add Material
                </button>
              </div>
              {formData.costs.materials.map((material, index) => (
                <div key={index} className="material-row">
                  <div className="form-grid">
                    <div className="form-group">
                      <input
                        type="text"
                        placeholder="Name"
                        value={material.name}
                        onChange={(e) => updateMaterial(index, 'name', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <input
                        type="number"
                        placeholder="Qty"
                        value={material.quantity}
                        onChange={(e) => updateMaterial(index, 'quantity', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="form-group">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Unit Price"
                        value={material.unitPrice}
                        onChange={(e) => updateMaterial(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="form-group">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Total"
                        value={material.totalPrice}
                        readOnly
                        className="read-only"
                      />
                    </div>
                    <button
                      type="button"
                      className="icon-btn delete"
                      onClick={() => removeMaterial(index)}
                    >
                      <FiTrash2 />
                    </button>
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
                  <input
                    type="number"
                    step="0.01"
                    value={formData.costs.permitsCost}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        costs: { ...formData.costs, permitsCost: parseFloat(e.target.value) || 0 }
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Subcontractors ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.costs.subcontractorsCost}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        costs: { ...formData.costs, subcontractorsCost: parseFloat(e.target.value) || 0 }
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Other Costs ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.costs.otherCosts}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        costs: { ...formData.costs, otherCosts: parseFloat(e.target.value) || 0 }
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={(formData.costs.taxRate * 100).toFixed(2)}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        costs: { ...formData.costs, taxRate: parseFloat(e.target.value) / 100 || 0 }
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Discount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.costs.discount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        costs: { ...formData.costs, discount: parseFloat(e.target.value) || 0 }
                      })
                    }
                  />
                </div>
              </div>
            </section>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
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
