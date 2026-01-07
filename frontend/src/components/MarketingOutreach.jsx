import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiSend, FiMail, FiUsers, FiChevronDown, FiChevronUp, FiTarget, FiBarChart2, FiPlus, FiStar, FiUserPlus, FiSettings, FiCheck } from 'react-icons/fi';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

function MarketingOutreach() {
  const [clients, setClients] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    campaigns: false,
    audience: false,
    performance: false,
    reviewRequests: true,
    referralRequests: true
  });
  const [automationSettings, setAutomationSettings] = useState({
    reviewRequestEnabled: false,
    reviewRequestDays: 3,
    referralRequestEnabled: false,
    referralRequestDays: 7,
    reviewTemplate: "Hi {clientName},\n\nThank you for choosing MES Electrical for your recent {jobType}. We hope you're happy with the work we completed!\n\nWould you mind taking a moment to leave us a review? Your feedback helps us improve and helps other customers find great electrical services.\n\nReview us on Google: [Link]\n\nThank you!\nMES Electrical Team",
    referralTemplate: "Hi {clientName},\n\nWe're so glad we could help with your {jobType}!\n\nIf you know anyone who needs electrical work, we'd love it if you could refer them to us. As a thank you, we're offering {referralDiscount}% off your next service for every successful referral!\n\nThank you for your continued trust in MES Electrical!\n\nBest regards,\nMES Electrical Team",
    referralDiscount: 10
  });

  useEffect(() => {
    fetchClients();
    fetchJobs();
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

  const fetchJobs = async () => {
    try {
      const response = await axios.get(`${API_URL}/jobs?limit=1000`);
      setJobs(response.data.jobs || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const getEligibleForReviewRequests = () => {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - automationSettings.reviewRequestDays);

    return jobs.filter(job =>
      job.status === 'completed' &&
      new Date(job.completionDate) >= daysAgo &&
      !job.reviewRequestSent
    );
  };

  const getEligibleForReferralRequests = () => {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - automationSettings.referralRequestDays);

    return jobs.filter(job =>
      job.status === 'completed' &&
      new Date(job.completionDate) >= daysAgo &&
      !job.referralRequestSent
    );
  };

  const sendReviewRequests = async () => {
    const eligible = getEligibleForReviewRequests();
    if (eligible.length === 0) {
      alert('No eligible jobs for review requests at this time.');
      return;
    }

    if (!confirm(`Send review requests to ${eligible.length} clients?`)) return;

    try {
      // TODO: Implement actual email sending
      for (const job of eligible) {
        await axios.patch(`${API_URL}/jobs/${job._id}`, {
          reviewRequestSent: true,
          reviewRequestDate: new Date()
        });
      }
      alert(`Successfully sent ${eligible.length} review requests!`);
      fetchJobs();
    } catch (error) {
      console.error('Error sending review requests:', error);
      alert('Failed to send review requests');
    }
  };

  const sendReferralRequests = async () => {
    const eligible = getEligibleForReferralRequests();
    if (eligible.length === 0) {
      alert('No eligible jobs for referral requests at this time.');
      return;
    }

    if (!confirm(`Send referral requests to ${eligible.length} clients?`)) return;

    try {
      // TODO: Implement actual email sending
      for (const job of eligible) {
        await axios.patch(`${API_URL}/jobs/${job._id}`, {
          referralRequestSent: true,
          referralRequestDate: new Date()
        });
      }
      alert(`Successfully sent ${eligible.length} referral requests!`);
      fetchJobs();
    } catch (error) {
      console.error('Error sending referral requests:', error);
      alert('Failed to send referral requests');
    }
  };

  const saveAutomationSettings = () => {
    // TODO: Save to backend/localStorage
    localStorage.setItem('marketingAutomation', JSON.stringify(automationSettings));
    alert('Automation settings saved!');
  };

  useEffect(() => {
    const saved = localStorage.getItem('marketingAutomation');
    if (saved) {
      setAutomationSettings(JSON.parse(saved));
    }
  }, []);

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

      {/* Review Request Automation - Collapsible */}
      <div className="analytics-section-collapsible">
        <div className="section-header" onClick={() => toggleSection('reviewRequests')}>
          <h2><FiStar /> Review Request Automation</h2>
          {expandedSections.reviewRequests ? <FiChevronUp /> : <FiChevronDown />}
        </div>
        {expandedSections.reviewRequests && (
          <div className="section-content">
            <div className="automation-settings-card">
              <div className="settings-header">
                <FiSettings />
                <h3>Automation Settings</h3>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={automationSettings.reviewRequestEnabled}
                    onChange={(e) => setAutomationSettings(prev => ({
                      ...prev,
                      reviewRequestEnabled: e.target.checked
                    }))}
                  />
                  <span>Enable automated review requests</span>
                </label>
              </div>

              <div className="form-group">
                <label>Send review request after job completion:</label>
                <div className="input-with-unit">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={automationSettings.reviewRequestDays}
                    onChange={(e) => setAutomationSettings(prev => ({
                      ...prev,
                      reviewRequestDays: parseInt(e.target.value) || 1
                    }))}
                  />
                  <span className="unit">days</span>
                </div>
              </div>

              <div className="form-group">
                <label>Email Template:</label>
                <textarea
                  rows="8"
                  value={automationSettings.reviewTemplate}
                  onChange={(e) => setAutomationSettings(prev => ({
                    ...prev,
                    reviewTemplate: e.target.value
                  }))}
                  placeholder="Template variables: {clientName}, {jobType}"
                />
                <small className="hint">Available variables: {'{clientName}'}, {'{jobType}'}</small>
              </div>

              <div className="stats-row">
                <div className="stat-box">
                  <span className="stat-label">Eligible Jobs</span>
                  <span className="stat-value">{getEligibleForReviewRequests().length}</span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">Requests Sent</span>
                  <span className="stat-value">{jobs.filter(j => j.reviewRequestSent).length}</span>
                </div>
              </div>

              <div className="action-buttons-row">
                <button className="btn-secondary" onClick={saveAutomationSettings}>
                  <FiSettings /> Save Settings
                </button>
                <button
                  className="btn-primary"
                  onClick={sendReviewRequests}
                  disabled={getEligibleForReviewRequests().length === 0}
                >
                  <FiSend /> Send Review Requests ({getEligibleForReviewRequests().length})
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Referral Request Automation - Collapsible */}
      <div className="analytics-section-collapsible">
        <div className="section-header" onClick={() => toggleSection('referralRequests')}>
          <h2><FiUserPlus /> Referral Request Automation</h2>
          {expandedSections.referralRequests ? <FiChevronUp /> : <FiChevronDown />}
        </div>
        {expandedSections.referralRequests && (
          <div className="section-content">
            <div className="automation-settings-card">
              <div className="settings-header">
                <FiSettings />
                <h3>Automation Settings</h3>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={automationSettings.referralRequestEnabled}
                    onChange={(e) => setAutomationSettings(prev => ({
                      ...prev,
                      referralRequestEnabled: e.target.checked
                    }))}
                  />
                  <span>Enable automated referral requests</span>
                </label>
              </div>

              <div className="form-group">
                <label>Send referral request after job completion:</label>
                <div className="input-with-unit">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={automationSettings.referralRequestDays}
                    onChange={(e) => setAutomationSettings(prev => ({
                      ...prev,
                      referralRequestDays: parseInt(e.target.value) || 1
                    }))}
                  />
                  <span className="unit">days</span>
                </div>
              </div>

              <div className="form-group">
                <label>Referral Discount (%):</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={automationSettings.referralDiscount}
                  onChange={(e) => setAutomationSettings(prev => ({
                    ...prev,
                    referralDiscount: parseInt(e.target.value) || 0
                  }))}
                  style={{ width: '100px' }}
                />
              </div>

              <div className="form-group">
                <label>Email Template:</label>
                <textarea
                  rows="8"
                  value={automationSettings.referralTemplate}
                  onChange={(e) => setAutomationSettings(prev => ({
                    ...prev,
                    referralTemplate: e.target.value
                  }))}
                  placeholder="Template variables: {clientName}, {jobType}, {referralDiscount}"
                />
                <small className="hint">Available variables: {'{clientName}'}, {'{jobType}'}, {'{referralDiscount}'}</small>
              </div>

              <div className="stats-row">
                <div className="stat-box">
                  <span className="stat-label">Eligible Jobs</span>
                  <span className="stat-value">{getEligibleForReferralRequests().length}</span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">Requests Sent</span>
                  <span className="stat-value">{jobs.filter(j => j.referralRequestSent).length}</span>
                </div>
              </div>

              <div className="action-buttons-row">
                <button className="btn-secondary" onClick={saveAutomationSettings}>
                  <FiSettings /> Save Settings
                </button>
                <button
                  className="btn-primary"
                  onClick={sendReferralRequests}
                  disabled={getEligibleForReferralRequests().length === 0}
                >
                  <FiSend /> Send Referral Requests ({getEligibleForReferralRequests().length})
                </button>
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
