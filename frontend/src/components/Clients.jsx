import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiUsers, FiPlus, FiEdit, FiTrash2, FiMail, FiPhone } from 'react-icons/fi';

const API_URL = 'http://localhost:5000/api';

function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    clientType: 'residential',
    status: 'active'
  });

  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/clients`);
      setClients(response.data.clients);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingClient) {
        await axios.patch(`${API_URL}/clients/${editingClient._id}`, formData);
      } else {
        await axios.post(`${API_URL}/clients`, formData);
      }
      setShowForm(false);
      setEditingClient(null);
      setFormData({ name: '', email: '', phone: '', company: '', clientType: 'residential', status: 'active' });
      fetchClients();
    } catch (error) {
      console.error('Error saving client:', error);
      alert('Error saving client');
    }
  };

  const deleteClient = async (id) => {
    if (!confirm('Are you sure you want to delete this client?')) return;
    try {
      await axios.delete(`${API_URL}/clients/${id}`);
      fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      alert(error.response?.data?.error || 'Error deleting client');
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  return (
    <div className="clients-page">
      <div className="page-header">
        <h1><FiUsers /> Clients</h1>
        <button className="btn-primary" onClick={() => {
          setEditingClient(null);
          setFormData({ name: '', email: '', phone: '', company: '', clientType: 'residential', status: 'active' });
          setShowForm(true);
        }}>
          <FiPlus /> New Client
        </button>
      </div>

      <div className="clients-grid">
        {loading ? (
          <div className="loading">Loading clients...</div>
        ) : clients.length === 0 ? (
          <div className="empty">
            <FiUsers size={48} />
            <p>No clients yet</p>
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              <FiPlus /> Add Your First Client
            </button>
          </div>
        ) : (
          clients.map((client) => (
            <div key={client._id} className="client-card">
              <div className="client-header">
                <h3>{client.name}</h3>
                <div className="client-actions">
                  <button className="icon-btn" onClick={() => {
                    setEditingClient(client);
                    setFormData(client);
                    setShowForm(true);
                  }}>
                    <FiEdit />
                  </button>
                  <button className="icon-btn delete" onClick={() => deleteClient(client._id)}>
                    <FiTrash2 />
                  </button>
                </div>
              </div>
              {client.company && <div className="client-company">{client.company}</div>}
              <div className="client-info">
                <div><FiMail /> {client.email}</div>
                {client.phone && <div><FiPhone /> {client.phone}</div>}
              </div>
              <div className="client-meta">
                <span className="badge">{client.clientType}</span>
                <span className="badge">{client.status}</span>
                <span className="badge">{client.jobs?.length || 0} jobs</span>
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingClient ? 'Edit Client' : 'New Client'}</h2>
              <button className="icon-btn" onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Company</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select value={formData.clientType} onChange={(e) => setFormData({ ...formData, clientType: e.target.value })}>
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="industrial">Industrial</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="prospect">Prospect</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Clients;
