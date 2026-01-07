import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiSend, FiMail, FiUsers, FiChevronDown, FiChevronUp, FiTarget, FiBarChart2, FiPlus } from 'react-icons/fi';

const API_URL = 'http://localhost:5000/api';

function MarketingOutreach() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    campaigns: false,
    audience: false,
    performance: false
  });

  useEffect(() => {
    fetchClients();
  }, []);

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

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="marketing-page">
      <div className="page-header">
        <div>
          <h1><FiSend /> Marketing Outreach</h1>
          <p className="page-subtitle">Manage campaigns and client outreach</p>
        </div>
      </div>

      {/* Overview - Collapsible */}
      <div className="analytics-section-collapsible">
        <div className="section-header" onClick={() => toggleSection('overview')}>
          <h2><FiBarChart2 /> Campaign Overview</h2>
          {expandedSections.overview ? <FiChevronUp /> : <FiChevronDown />}
        </div>
        {expandedSections.overview && (
          <div className="section-content">
            <div className="dashboard-grid">
              <div className="dashboard-card">
                <div className="card-header">
                  <div className="card-icon blue">
                    <FiMail />
                  </div>
                  <div className="card-title">
                    <h3>Total Contacts</h3>
                    <p>In Database</p>
                  </div>
                </div>
                <div className="card-value">{clients.length}</div>
                <div className="card-footer">
                  <span>{clients.filter(c => c.status === 'prospect').length} prospects</span>
                </div>
              </div>

              <div className="dashboard-card">
                <div className="card-header">
                  <div className="card-icon green">
                    <FiUsers />
                  </div>
                  <div className="card-title">
                    <h3>Active Clients</h3>
                    <p>Ready for Outreach</p>
                  </div>
                </div>
                <div className="card-value">{clients.filter(c => c.status === 'active').length}</div>
                <div className="card-footer">
                  <span>Available for campaigns</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Campaign Management - Collapsible */}
      <div className="analytics-section-collapsible">
        <div className="section-header" onClick={() => toggleSection('campaigns')}>
          <h2><FiSend /> Campaign Management</h2>
          {expandedSections.campaigns ? <FiChevronUp /> : <FiChevronDown />}
        </div>
        {expandedSections.campaigns && (
          <div className="section-content">
            <div className="empty-state">
              <FiSend size={48} />
              <p>No campaigns yet</p>
              <p className="hint">Create email marketing campaigns to engage with your clients</p>
              <button className="btn-primary" style={{ marginTop: '1rem' }}>
                <FiPlus /> Create Campaign (Coming Soon)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Target Audience - Collapsible */}
      <div className="analytics-section-collapsible">
        <div className="section-header" onClick={() => toggleSection('audience')}>
          <h2><FiTarget /> Target Audience</h2>
          {expandedSections.audience ? <FiChevronUp /> : <FiChevronDown />}
        </div>
        {expandedSections.audience && (
          <div className="section-content">
            <div className="status-breakdown">
              <h3>Client Segmentation</h3>
              <div className="status-legend">
                <div className="segment-item">
                  <span className="segment-label">Active Clients:</span>
                  <span className="segment-value">{clients.filter(c => c.status === 'active').length}</span>
                </div>
                <div className="segment-item">
                  <span className="segment-label">Prospects:</span>
                  <span className="segment-value">{clients.filter(c => c.status === 'prospect').length}</span>
                </div>
                <div className="segment-item">
                  <span className="segment-label">Residential:</span>
                  <span className="segment-value">{clients.filter(c => c.clientType === 'residential').length}</span>
                </div>
                <div className="segment-item">
                  <span className="segment-label">Commercial:</span>
                  <span className="segment-value">{clients.filter(c => c.clientType === 'commercial').length}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Performance Metrics - Collapsible */}
      <div className="analytics-section-collapsible">
        <div className="section-header" onClick={() => toggleSection('performance')}>
          <h2><FiBarChart2 /> Campaign Performance</h2>
          {expandedSections.performance ? <FiChevronUp /> : <FiChevronDown />}
        </div>
        {expandedSections.performance && (
          <div className="section-content">
            <div className="empty-state">
              <FiBarChart2 size={48} />
              <p>No campaign data yet</p>
              <p className="hint">Performance metrics will appear here once you launch campaigns</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MarketingOutreach;
