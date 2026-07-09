import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiMail, FiDollarSign, FiCheckCircle, FiXCircle, FiLink, FiChevronRight } from 'react-icons/fi';
import IntegrationDetail from './IntegrationDetail';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ICONS = {
  gmail: FiMail,
  microsoft: FiMail,
  quickbooks: FiDollarSign
};

function Integrations() {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState(null);

  const fetchIntegrations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/integrations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIntegrations(response.data.integrations || []);
    } catch (error) {
      console.error('Error fetching integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  if (selectedProvider) {
    return (
      <IntegrationDetail
        provider={selectedProvider}
        onBack={() => {
          setSelectedProvider(null);
          fetchIntegrations();
        }}
      />
    );
  }

  return (
    <div className="jobs-page">
      <div className="page-header">
        <h1><FiLink /> Integrations</h1>
      </div>
      <p className="page-subtitle">
        Connect other tools to the CRM. Once connected, that data becomes part of the CRM everywhere — Clients, Jobs, and reporting all see it, not just this page.
      </p>

      {loading ? (
        <div className="loading">Loading integrations...</div>
      ) : (
        <div className="dashboard-grid" style={{ marginTop: '1.5rem' }}>
          {integrations.map((integration) => {
            const Icon = ICONS[integration.provider] || FiLink;
            return (
              <div
                key={integration.provider}
                className="dashboard-card"
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedProvider(integration.provider)}
              >
                <div className="card-header">
                  <Icon className="card-icon gold" />
                  <div className="card-title">
                    <h3>{integration.name}</h3>
                    <p>{integration.description}</p>
                  </div>
                </div>
                <div
                  className={`connection-status ${integration.connected ? 'connected' : 'disconnected'}`}
                  style={{ display: 'inline-flex' }}
                >
                  {integration.connected ? <FiCheckCircle /> : <FiXCircle />}
                  {integration.connected ? 'Connected' : 'Not Connected'}
                </div>
                <div className="card-footer">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Manage <FiChevronRight />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Integrations;
