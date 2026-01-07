import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiUsers, FiPlus, FiEdit, FiTrash2, FiMail, FiPhone } from 'react-icons/fi';

const API_URL = 'http://localhost:5001/api';

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

  // Filter states
  const [filters, setFilters] = useState({
    status: '',
    clientType: '',
    source: '',
    serviceRequested: '',
    dateFrom: '',
    dateTo: '',
    search: ''
  });

  const fetchClients = async () => {
    setLoading(true);
    try {
      // Build query parameters from filters
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.clientType) params.append('clientType', filters.clientType);
      if (filters.search) params.append('search', filters.search);

      const response = await axios.get(`${API_URL}/clients?${params.toString()}`);
      setClients(response.data.clients);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter clients on the frontend
  const filteredClients = clients.filter(client => {
    // Source filter
    if (filters.source && client.source !== filters.source) return false;

    // Service filter
    if (filters.serviceRequested && client.serviceRequested !== filters.serviceRequested) return false;

    // Date range filter
    if (filters.dateFrom) {
      const clientDate = new Date(client.createdAt);
      const fromDate = new Date(filters.dateFrom);
      if (clientDate < fromDate) return false;
    }
    if (filters.dateTo) {
      const clientDate = new Date(client.createdAt);
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      if (clientDate > toDate) return false;
    }

    return true;
  });

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
  }, [filters.status, filters.clientType, filters.search]);

  const clearFilters = () => {
    setFilters({
      status: '',
      clientType: '',
      source: '',
      serviceRequested: '',
      dateFrom: '',
      dateTo: '',
      search: ''
    });
  };

  return (
    <div className="clients-page">
      <div className="page-header">
        <h1><FiUsers /> Clients ({filteredClients.length})</h1>
        <button className="btn-primary" onClick={() => {
          setEditingClient(null);
          setFormData({ name: '', email: '', phone: '', company: '', clientType: 'residential', status: 'active' });
          setShowForm(true);
        }}>
          <FiPlus /> New Client
        </button>
      </div>

      {/* Filters Section */}
      <div className="filters-section" style={{
        background: 'linear-gradient(135deg, #fef9e7 0%, #fef5d4 100%)',
        padding: '24px',
        borderRadius: '16px',
        marginBottom: '24px',
        boxShadow: '0 4px 12px rgba(212, 175, 55, 0.15)',
        border: '2px solid rgba(212, 175, 55, 0.3)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px'
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#78350f', fontSize: '13px' }}>Search</label>
          <input
            type="text"
            placeholder="Name, email, company..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            style={{
              width: '100%',
              padding: '10px 14px',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              outline: 'none',
              background: 'white',
              color: '#333',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#78350f', fontSize: '13px' }}>Status</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            style={{
              width: '100%',
              padding: '10px 14px',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              outline: 'none',
              background: 'white',
              color: '#333',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              cursor: 'pointer'
            }}
          >
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="quoted">Quoted</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="prospect">Prospect</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#78350f', fontSize: '13px' }}>Type</label>
          <select
            value={filters.clientType}
            onChange={(e) => setFilters({ ...filters, clientType: e.target.value })}
            style={{
              width: '100%',
              padding: '10px 14px',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              outline: 'none',
              background: 'white',
              color: '#333',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              cursor: 'pointer'
            }}
          >
            <option value="">All Types</option>
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="industrial">Industrial</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#78350f', fontSize: '13px' }}>Source</label>
          <select
            value={filters.source}
            onChange={(e) => setFilters({ ...filters, source: e.target.value })}
            style={{
              width: '100%',
              padding: '10px 14px',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              outline: 'none',
              background: 'white',
              color: '#333',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              cursor: 'pointer'
            }}
          >
            <option value="">All Sources</option>
            <option value="website">Website</option>
            <option value="referral">Referral</option>
            <option value="phone">Phone</option>
            <option value="email">Email</option>
            <option value="manual">Manual</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#78350f', fontSize: '13px' }}>Service</label>
          <select
            value={filters.serviceRequested}
            onChange={(e) => setFilters({ ...filters, serviceRequested: e.target.value })}
            style={{
              width: '100%',
              padding: '10px 14px',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              outline: 'none',
              background: 'white',
              color: '#333',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              cursor: 'pointer'
            }}
          >
            <option value="">All Services</option>
            <option value="ev-charging">EV Charging</option>
            <option value="new-construction">New Construction</option>
            <option value="smart-home">Smart Home</option>
            <option value="repair-upgrade">Repair & Upgrade</option>
            <option value="silver-label">Silver Label</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#78350f', fontSize: '13px' }}>From Date</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            style={{
              width: '100%',
              padding: '10px 14px',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              outline: 'none',
              background: 'white',
              color: '#333',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              cursor: 'pointer'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#78350f', fontSize: '13px' }}>To Date</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            style={{
              width: '100%',
              padding: '10px 14px',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              outline: 'none',
              background: 'white',
              color: '#333',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              cursor: 'pointer'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button
            onClick={clearFilters}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #d4af37, #b8941f)',
              color: '#000000',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              width: '100%',
              fontWeight: '700',
              fontSize: '14px',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 8px rgba(212, 175, 55, 0.3)'
            }}
            onMouseOver={(e) => {
              e.target.style.background = 'linear-gradient(135deg, #b8941f, #9a7a1a)';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 12px rgba(212, 175, 55, 0.5)';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'linear-gradient(135deg, #d4af37, #b8941f)';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 8px rgba(212, 175, 55, 0.3)';
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Clients Table */}
      <div className="clients-table" style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        {loading ? (
          <div className="loading" style={{ padding: '60px 20px', textAlign: 'center' }}>Loading clients...</div>
        ) : filteredClients.length === 0 ? (
          <div className="empty" style={{ padding: '60px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <FiUsers size={64} style={{ color: '#d1d5db' }} />
            <p style={{ fontSize: '18px', color: '#6b7280', margin: 0 }}>No clients found</p>
            {clients.length === 0 && (
              <button className="btn-primary" onClick={() => setShowForm(true)} style={{ marginTop: '10px' }}>
                <FiPlus /> Add Your First Client
              </button>
            )}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
              <tr>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#212529' }}>Name</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#212529' }}>Contact</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#212529' }}>Type</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#212529' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#212529' }}>Source</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#212529' }}>Service</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#212529' }}>Date</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#212529' }}>Jobs</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#212529' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr key={client._id} style={{ borderBottom: '1px solid #dee2e6', transition: 'background 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#f8f9fa'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                >
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: '500', color: '#212529' }}>{client.name}</div>
                    {client.company && <div style={{ fontSize: '12px', color: '#6c757d' }}>{client.company}</div>}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontSize: '14px', color: '#495057' }}>
                      <FiMail style={{ marginRight: '5px', fontSize: '12px', color: '#6c757d' }} />
                      {client.email}
                    </div>
                    {client.phone && (
                      <div style={{ fontSize: '14px', marginTop: '4px', color: '#495057' }}>
                        <FiPhone style={{ marginRight: '5px', fontSize: '12px', color: '#6c757d' }} />
                        {client.phone}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span className="badge" style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: client.clientType === 'commercial' ? '#0d6efd' : client.clientType === 'industrial' ? '#6c757d' : '#28a745',
                      color: 'white'
                    }}>{client.clientType}</span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span className="badge" style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: client.status === 'new' ? '#ffc107' :
                                 client.status === 'active' ? '#28a745' :
                                 client.status === 'won' ? '#0d6efd' :
                                 client.status === 'lost' ? '#dc3545' : '#6c757d',
                      color: client.status === 'new' ? '#212529' : 'white'
                    }}>{client.status}</span>
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#495057' }}>{client.source || 'N/A'}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#495057' }}>{client.serviceRequested || 'N/A'}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#495057' }}>
                    {new Date(client.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', textAlign: 'center', color: '#495057' }}>
                    {client.jobs?.length || 0}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button className="icon-btn" onClick={() => {
                        setEditingClient(client);
                        setFormData(client);
                        setShowForm(true);
                      }} style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        background: 'white',
                        cursor: 'pointer',
                        color: '#495057',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.background = '#f8f9fa';
                        e.target.style.borderColor = '#667eea';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.background = 'white';
                        e.target.style.borderColor = '#ddd';
                      }}
                      >
                        <FiEdit />
                      </button>
                      <button className="icon-btn delete" onClick={() => deleteClient(client._id)} style={{
                        padding: '8px 12px',
                        border: '1px solid #dc3545',
                        borderRadius: '8px',
                        background: 'white',
                        color: '#dc3545',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.background = '#dc3545';
                        e.target.style.color = 'white';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.background = 'white';
                        e.target.style.color = '#dc3545';
                      }}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
