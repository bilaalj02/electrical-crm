import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiMail, FiRefreshCw, FiFilter, FiSearch, FiPlus, FiCheck, FiX, FiEdit, FiSend } from 'react-icons/fi';

const API_URL = 'http://localhost:5000/api';

function Emails() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [emailAccounts, setEmailAccounts] = useState([]);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [composeData, setComposeData] = useState({
    to: '',
    cc: '',
    subject: '',
    body: ''
  });

  const [filters, setFilters] = useState({
    accountType: '',
    isWorkRelated: '',
    isRead: '',
    search: ''
  });

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.accountType) queryParams.append('accountType', filters.accountType);

      // Handle inbox/sent filtering
      if (filters.isWorkRelated === 'inbox') {
        queryParams.append('folder', 'inbox');
      } else if (filters.isWorkRelated === 'sent') {
        queryParams.append('folder', 'sent');
      } else if (filters.isWorkRelated) {
        queryParams.append('isWorkRelated', filters.isWorkRelated);
      }

      if (filters.isRead) queryParams.append('isRead', filters.isRead);
      if (filters.search) queryParams.append('search', filters.search);

      const response = await axios.get(`${API_URL}/emails?${queryParams.toString()}`);
      setEmails(response.data.emails);
    } catch (error) {
      console.error('Error fetching emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/emails/stats/summary`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchEmailAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/oauth/accounts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmailAccounts(response.data.emailAccounts);
    } catch (error) {
      console.error('Error fetching email accounts:', error);
    }
  };

  const connectGmail = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/oauth/gmail/auth-url`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Open OAuth window
      const { authUrl } = response.data;
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error connecting Gmail:', error);
      alert('Error initiating Gmail connection');
    }
  };

  const connectMicrosoft = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/oauth/microsoft/auth-url`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Open OAuth window
      const { authUrl } = response.data;
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error connecting Microsoft:', error);
      alert('Error initiating Microsoft connection');
    }
  };

  const disconnectAccount = async (accountId) => {
    if (!confirm('Are you sure you want to disconnect this email account?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/oauth/accounts/${accountId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchEmailAccounts();
      alert('Email account disconnected successfully');
    } catch (error) {
      console.error('Error disconnecting account:', error);
      alert('Error disconnecting email account');
    }
  };

  const syncAccountEmails = async (accountId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/email-sync/sync/${accountId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchEmails();
      await fetchStats();
      alert('Emails synced successfully!');
    } catch (error) {
      console.error('Error syncing emails:', error);
      alert('Error syncing emails');
    } finally {
      setLoading(false);
    }
  };

  const syncEmails = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_URL}/emails/sync`);
      await fetchEmails();
      await fetchStats();
      alert('Emails synced successfully!');
    } catch (error) {
      console.error('Error syncing emails:', error);
      alert('Error syncing emails. Make sure the backend is running and configured.');
    } finally {
      setLoading(false);
    }
  };

  const toggleRead = async (emailId, currentStatus) => {
    try {
      await axios.patch(`${API_URL}/emails/${emailId}`, {
        isRead: !currentStatus
      });
      fetchEmails();
    } catch (error) {
      console.error('Error updating email:', error);
    }
  };

  const classifyEmail = async (emailId, isWork) => {
    try {
      await axios.patch(`${API_URL}/emails/${emailId}`, {
        isWorkRelated: isWork
      });
      fetchEmails();
      fetchStats();
    } catch (error) {
      console.error('Error classifying email:', error);
    }
  };

  useEffect(() => {
    fetchEmails();
    fetchStats();
    fetchEmailAccounts();

    // Check for OAuth success callback
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('oauth') === 'success') {
      const email = urlParams.get('email');
      alert(`Successfully connected ${email}!`);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchEmailAccounts();
    } else if (urlParams.get('error')) {
      alert('Failed to connect email account. Please try again.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    fetchEmails();
  }, [filters]);

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="emails-page">
      <div className="page-header">
        <h1><FiMail /> Unified Inbox</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="button" onClick={() => setShowAccountModal(true)} className="btn-primary">
            <FiPlus /> Connect Account
          </button>
          <button type="button" onClick={() => setShowComposeModal(true)} className="btn-primary">
            <FiEdit /> Compose
          </button>
          <button type="button" onClick={() => setShowSyncModal(true)} className="btn-sync" disabled={loading || emailAccounts.length === 0}>
            <FiRefreshCw className={loading ? 'spinning' : ''} />
            {loading ? 'Syncing...' : 'Sync Emails'}
          </button>
        </div>
      </div>

      {/* Connected Accounts Section */}
      {emailAccounts.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #fef9e7 0%, #fef5d4 100%)',
          padding: '16px 24px',
          borderRadius: '12px',
          marginBottom: '20px',
          boxShadow: '0 2px 8px rgba(212, 175, 55, 0.15)',
          border: '1px solid rgba(212, 175, 55, 0.3)'
        }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#78350f', fontSize: '14px', fontWeight: '600' }}>
            Connected Email Accounts ({emailAccounts.length})
          </h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {emailAccounts.map((account) => (
              <div key={account._id} style={{
                background: 'white',
                padding: '10px 16px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <FiCheck style={{ color: '#10b981' }} />
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>{account.email}</span>
                <span style={{
                  fontSize: '11px',
                  background: '#eff6ff',
                  color: '#3b82f6',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  textTransform: 'uppercase',
                  fontWeight: '600'
                }}>{account.provider}</span>
                <button
                  onClick={() => syncAccountEmails(account._id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    color: '#3b82f6'
                  }}
                  title="Sync this account"
                >
                  <FiRefreshCw size={14} />
                </button>
                <button
                  onClick={() => disconnectAccount(account._id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    color: '#ef4444'
                  }}
                  title="Disconnect account"
                >
                  <FiX size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats && (
        <div className="stats-bar">
          <div className="stat">
            <span className="stat-label">Total</span>
            <span className="stat-value">{stats.total}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Unread</span>
            <span className="stat-value unread">{stats.unread}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Work</span>
            <span className="stat-value work">{stats.workRelated}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Not Classified</span>
            <span className="stat-value">{stats.notClassified}</span>
          </div>
        </div>
      )}

      {/* Filters */}
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
            placeholder="Search emails..."
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
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#78350f', fontSize: '13px' }}>Account</label>
          <select
            value={filters.accountType}
            onChange={(e) => setFilters({ ...filters, accountType: e.target.value })}
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
            <option value="">All Accounts</option>
            <option value="gmail">Gmail</option>
            <option value="microsoft">Microsoft</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#78350f', fontSize: '13px' }}>Type</label>
          <select
            value={filters.isWorkRelated}
            onChange={(e) => setFilters({ ...filters, isWorkRelated: e.target.value })}
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
            <option value="">All Emails</option>
            <option value="inbox">Inbox</option>
            <option value="sent">Sent</option>
            <option value="true">Work Related</option>
            <option value="false">Non-Work</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#78350f', fontSize: '13px' }}>Status</label>
          <select
            value={filters.isRead}
            onChange={(e) => setFilters({ ...filters, isRead: e.target.value })}
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
            <option value="">Read & Unread</option>
            <option value="false">Unread Only</option>
            <option value="true">Read Only</option>
          </select>
        </div>
      </div>

      <div className="main-content">
        <div className="email-list">
          {loading && emails.length === 0 ? (
            <div className="loading">Loading emails...</div>
          ) : emails.length === 0 ? (
            <div className="empty">
              <FiMail size={48} />
              <p>No emails found</p>
              <p className="hint">Click "Sync Emails" to fetch your emails</p>
            </div>
          ) : (
            emails.map((email) => (
              <div
                key={email._id}
                className={`email-item ${!email.isRead ? 'unread' : ''} ${selectedEmail?._id === email._id ? 'selected' : ''}`}
                onClick={() => setSelectedEmail(email)}
              >
                <div className="email-header">
                  <div className="email-from">{email.from?.name || email.from?.email}</div>
                  <div className="email-meta">
                    <span className={`badge ${email.accountType}`}>{email.accountType}</span>
                    <span className="email-date">{formatDate(email.date)}</span>
                  </div>
                </div>
                <div className="email-subject">{email.subject || '(No Subject)'}</div>
                <div className="email-preview">{email.body?.text?.substring(0, 100)}...</div>
                <div className="email-actions">
                  {email.isWorkRelated === null && (
                    <>
                      <button className="btn-classify work" onClick={(e) => { e.stopPropagation(); classifyEmail(email._id, true); }}>Work</button>
                      <button className="btn-classify non-work" onClick={(e) => { e.stopPropagation(); classifyEmail(email._id, false); }}>Non-Work</button>
                    </>
                  )}
                  {email.isWorkRelated !== null && (
                    <span className={`classification ${email.isWorkRelated ? 'work' : 'non-work'}`}>
                      {email.isWorkRelated ? '💼 Work' : '📧 Personal'}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {selectedEmail && (
          <div className="email-detail">
            <div className="detail-header">
              <h2>{selectedEmail.subject || '(No Subject)'}</h2>
              <button className="btn-close" onClick={() => setSelectedEmail(null)}>×</button>
            </div>
            <div className="detail-meta">
              <div className="meta-row"><strong>From:</strong> {selectedEmail.from?.name} &lt;{selectedEmail.from?.email}&gt;</div>
              <div className="meta-row"><strong>To:</strong> {selectedEmail.to?.map(t => t.email).join(', ')}</div>
              <div className="meta-row"><strong>Date:</strong> {new Date(selectedEmail.date).toLocaleString()}</div>
              <div className="meta-row"><strong>Account:</strong> <span className={`badge ${selectedEmail.accountType}`}>{selectedEmail.accountType}</span></div>
            </div>
            <div className="detail-body">
              {selectedEmail.body?.html ? (
                <iframe srcDoc={selectedEmail.body.html} title="Email content" className="email-html" />
              ) : (
                <pre>{selectedEmail.body?.text}</pre>
              )}
            </div>
            <div className="detail-actions">
              <button className="btn" onClick={() => toggleRead(selectedEmail._id, selectedEmail.isRead)}>
                Mark as {selectedEmail.isRead ? 'Unread' : 'Read'}
              </button>
              {selectedEmail.isWorkRelated === null ? (
                <>
                  <button className="btn btn-work" onClick={() => classifyEmail(selectedEmail._id, true)}>Mark as Work</button>
                  <button className="btn btn-non-work" onClick={() => classifyEmail(selectedEmail._id, false)}>Mark as Non-Work</button>
                </>
              ) : (
                <button className="btn" onClick={() => classifyEmail(selectedEmail._id, !selectedEmail.isWorkRelated)}>
                  Reclassify as {selectedEmail.isWorkRelated ? 'Non-Work' : 'Work'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Connect Account Modal */}
      {showAccountModal && (
        <div className="modal-overlay" onClick={() => setShowAccountModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2><FiPlus /> Connect Email Account</h2>
              <button className="icon-btn" onClick={() => setShowAccountModal(false)}>×</button>
            </div>
            <div className="modal-body" style={{ padding: '24px' }}>
              <p style={{ marginBottom: '20px', color: '#6b7280' }}>
                Choose an email provider to connect to your CRM:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  onClick={() => {
                    connectGmail();
                    setShowAccountModal(false);
                  }}
                  style={{
                    padding: '16px 20px',
                    background: 'white',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = '#d4af37';
                    e.currentTarget.style.background = '#fef9e7';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.background = 'white';
                  }}
                >
                  <FiMail size={24} style={{ color: '#ef4444' }} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: '600' }}>Gmail</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Connect your Google account</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    connectMicrosoft();
                    setShowAccountModal(false);
                  }}
                  style={{
                    padding: '16px 20px',
                    background: 'white',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = '#d4af37';
                    e.currentTarget.style.background = '#fef9e7';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.background = 'white';
                  }}
                >
                  <FiMail size={24} style={{ color: '#0078d4' }} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: '600' }}>Microsoft / Outlook</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Connect your Microsoft account</div>
                  </div>
                </button>

                <button
                  onClick={() => alert('IMAP integration coming soon!')}
                  style={{
                    padding: '16px 20px',
                    background: 'white',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    opacity: 0.6
                  }}
                  disabled
                >
                  <FiMail size={24} style={{ color: '#6b7280' }} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: '600' }}>IMAP / Other Providers</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Coming soon</div>
                  </div>
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowAccountModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Sync Emails Modal */}
      {showSyncModal && (
        <div className="modal-overlay" onClick={() => setShowSyncModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2><FiRefreshCw /> Sync Email Accounts</h2>
              <button className="icon-btn" onClick={() => setShowSyncModal(false)}>×</button>
            </div>
            <div className="modal-body" style={{ padding: '24px' }}>
              <p style={{ marginBottom: '20px', color: '#6b7280' }}>
                Select which email accounts to sync:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {emailAccounts.map((account) => (
                  <button
                    key={account._id}
                    onClick={() => {
                      syncAccountEmails(account._id);
                      setShowSyncModal(false);
                    }}
                    disabled={loading}
                    style={{
                      padding: '16px 20px',
                      background: 'white',
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '15px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 0.2s',
                      opacity: loading ? 0.6 : 1
                    }}
                    onMouseOver={(e) => {
                      if (!loading) {
                        e.currentTarget.style.borderColor = '#d4af37';
                        e.currentTarget.style.background = '#fef9e7';
                      }
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.background = 'white';
                    }}
                  >
                    <FiMail size={24} style={{ color: account.provider === 'gmail' ? '#ef4444' : '#0078d4' }} />
                    <div style={{ textAlign: 'left', flex: 1 }}>
                      <div style={{ fontWeight: '600', color: '#1f2937' }}>{account.email}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'capitalize' }}>{account.provider}</div>
                    </div>
                    <FiRefreshCw size={18} style={{ color: '#3b82f6' }} />
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowSyncModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Compose Email Modal */}
      {showComposeModal && (
        <div className="modal-overlay" onClick={() => setShowComposeModal(false)} style={{ zIndex: 9999 }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', background: 'white', pointerEvents: 'auto', position: 'relative', zIndex: 10000 }}>
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, #fef9e7 0%, #fef5d4 100%)', borderBottom: '2px solid #d4af37' }}>
              <h2 style={{ color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FiEdit style={{ color: '#d4af37' }} />
                Compose Email
              </h2>
              <button className="icon-btn" onClick={() => setShowComposeModal(false)} style={{ fontSize: '28px', color: '#6b7280' }}>×</button>
            </div>
            <div className="modal-body" style={{ padding: '24px' }}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1a1a1a' }}>To:</label>
                <input
                  type="email"
                  value={composeData.to}
                  onChange={(e) => setComposeData({...composeData, to: e.target.value})}
                  placeholder="recipient@example.com"
                  autoComplete="off"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '15px',
                    transition: 'border-color 0.2s',
                    userSelect: 'text',
                    pointerEvents: 'auto',
                    cursor: 'text'
                  }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1a1a1a' }}>CC:</label>
                <input
                  type="email"
                  value={composeData.cc}
                  onChange={(e) => setComposeData({...composeData, cc: e.target.value})}
                  placeholder="cc@example.com (optional)"
                  autoComplete="off"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '15px',
                    transition: 'border-color 0.2s',
                    userSelect: 'text',
                    pointerEvents: 'auto',
                    cursor: 'text'
                  }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1a1a1a' }}>Subject:</label>
                <input
                  type="text"
                  value={composeData.subject}
                  onChange={(e) => setComposeData({...composeData, subject: e.target.value})}
                  placeholder="Email subject"
                  autoComplete="off"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '15px',
                    transition: 'border-color 0.2s',
                    userSelect: 'text',
                    pointerEvents: 'auto',
                    cursor: 'text'
                  }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1a1a1a' }}>Body:</label>
                <textarea
                  value={composeData.body}
                  onChange={(e) => setComposeData({...composeData, body: e.target.value})}
                  placeholder="Write your message..."
                  rows="10"
                  style={{
                    width: '100%',
                    minHeight: '200px',
                    padding: '10px 14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '15px',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    userSelect: 'text',
                    pointerEvents: 'auto',
                    cursor: 'text'
                  }}
                />
              </div>
            </div>
            <div className="modal-footer" style={{ padding: '20px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowComposeModal(false)}
                style={{
                  padding: '10px 24px',
                  border: '2px solid #e5e7eb',
                  background: 'white',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  // TODO: Implement send email functionality
                  alert('Email sending functionality will be implemented soon!');
                  setShowComposeModal(false);
                  setComposeData({ to: '', cc: '', subject: '', body: '' });
                }}
                style={{
                  padding: '10px 24px',
                  background: '#d4af37',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <FiSend /> Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Emails;
