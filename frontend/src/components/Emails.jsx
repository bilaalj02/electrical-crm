import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiMail, FiRefreshCw, FiFilter, FiSearch, FiPlus, FiCheck, FiX, FiEdit, FiSend } from 'react-icons/fi';
import NotificationModal from './NotificationModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

function Emails() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [emailAccounts, setEmailAccounts] = useState([]);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [composeData, setComposeData] = useState({
    fromAccount: '',
    to: '',
    cc: '',
    subject: '',
    body: ''
  });
  const [classifyingEmails, setClassifyingEmails] = useState(false);
  const [extractingJob, setExtractingJob] = useState(false);
  const [showJobModal, setShowJobModal] = useState(false);
  const [extractedJobData, setExtractedJobData] = useState(null);

  // Notification modal state
  const [notification, setNotification] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: null
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
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Connection Error',
        message: 'Error initiating Gmail connection. Please try again.',
        onConfirm: null
      });
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
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Connection Error',
        message: 'Error initiating Microsoft connection. Please try again.',
        onConfirm: null
      });
    }
  };

  const disconnectAccount = async (accountId) => {
    setNotification({
      isOpen: true,
      type: 'confirm',
      title: 'Disconnect Email Account',
      message: 'Are you sure you want to disconnect this email account?',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.delete(`${API_URL}/oauth/accounts/${accountId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          fetchEmailAccounts();
          setNotification({
            isOpen: true,
            type: 'success',
            title: 'Success',
            message: 'Email account disconnected successfully',
            onConfirm: null
          });
        } catch (error) {
          console.error('Error disconnecting account:', error);
          setNotification({
            isOpen: true,
            type: 'error',
            title: 'Error',
            message: 'Error disconnecting email account. Please try again.',
            onConfirm: null
          });
        }
      }
    });
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
      setNotification({
        isOpen: true,
        type: 'success',
        title: 'Success',
        message: 'Emails synced successfully!',
        onConfirm: null
      });
    } catch (error) {
      console.error('Error syncing emails:', error);
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Sync Error',
        message: 'Error syncing emails. Please try again.',
        onConfirm: null
      });
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
      setNotification({
        isOpen: true,
        type: 'success',
        title: 'Success',
        message: 'Emails synced successfully!',
        onConfirm: null
      });
    } catch (error) {
      console.error('Error syncing emails:', error);
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Sync Error',
        message: 'Error syncing emails. Make sure the backend is running and configured.',
        onConfirm: null
      });
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

  const autoClassifyEmails = async () => {
    setClassifyingEmails(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/automation/auto-classify-emails`,
        { limit: 50 },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNotification({
        isOpen: true,
        type: 'success',
        title: 'Classification Complete',
        message: `Classified ${response.data.results.classified} emails (${response.data.results.workRelated} work-related, ${response.data.results.personal} personal)`,
        onConfirm: null
      });

      await fetchEmails();
      await fetchStats();
    } catch (error) {
      console.error('Error auto-classifying emails:', error);
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Classification Error',
        message: error.response?.data?.message || 'Failed to auto-classify emails. Make sure OpenAI API key is configured.',
        onConfirm: null
      });
    } finally {
      setClassifyingEmails(false);
    }
  };

  const extractJobFromEmail = async () => {
    setExtractingJob(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/automation/extract-job/${selectedEmail._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setExtractedJobData(response.data.jobData);
        setShowJobModal(true);
      }
    } catch (error) {
      console.error('Error extracting job from email:', error);
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Extraction Error',
        message: error.response?.data?.message || 'Failed to extract job details from email.',
        onConfirm: null
      });
    } finally {
      setExtractingJob(false);
    }
  };

  const createJobFromEmail = async (createCalendar = false) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/automation/create-job-from-email`,
        {
          emailId: selectedEmail._id,
          jobData: extractedJobData,
          createCalendarEvent: createCalendar
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setNotification({
          isOpen: true,
          type: 'success',
          title: 'Job Created',
          message: `Job ${response.data.job.jobNumber} created successfully!`,
          onConfirm: null
        });
        setShowJobModal(false);
        setExtractedJobData(null);
        await fetchEmails();
      }
    } catch (error) {
      console.error('Error creating job from email:', error);
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Job Creation Error',
        message: error.response?.data?.message || 'Failed to create job from email.',
        onConfirm: null
      });
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
      setNotification({
        isOpen: true,
        type: 'success',
        title: 'Email Connected',
        message: `Successfully connected ${email}!`,
        onConfirm: null
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchEmailAccounts();
    } else if (urlParams.get('error')) {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Connection Failed',
        message: 'Failed to connect email account. Please try again.',
        onConfirm: null
      });
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
          <button
            type="button"
            onClick={autoClassifyEmails}
            className="btn-secondary"
            disabled={classifyingEmails}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <FiFilter className={classifyingEmails ? 'spinning' : ''} />
            {classifyingEmails ? 'Classifying...' : 'AI Auto-Classify'}
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
              <button
                className="btn btn-primary"
                onClick={() => {
                  const replyTo = selectedEmail.from?.email;
                  const replySubject = selectedEmail.subject?.startsWith('Re:')
                    ? selectedEmail.subject
                    : `Re: ${selectedEmail.subject || ''}`;

                  // Find the account this email was received on
                  const recipientAccount = emailAccounts.find(acc =>
                    selectedEmail.to?.some(t => t.email === acc.email)
                  );

                  setComposeData({
                    fromAccount: recipientAccount?._id || '',
                    to: replyTo,
                    cc: '',
                    subject: replySubject,
                    body: `\n\n---\nOn ${new Date(selectedEmail.date).toLocaleString()}, ${selectedEmail.from?.name || selectedEmail.from?.email} wrote:\n> ${selectedEmail.body?.text?.split('\n').join('\n> ')}`
                  });
                  setShowComposeModal(true);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <FiSend /> Reply
              </button>
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
              {selectedEmail.isWorkRelated && !selectedEmail.linkedJob && (
                <button
                  className="btn btn-primary"
                  onClick={extractJobFromEmail}
                  disabled={extractingJob}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <FiPlus />
                  {extractingJob ? 'Extracting...' : 'Convert to Job'}
                </button>
              )}
              {selectedEmail.linkedJob && (
                <span style={{
                  padding: '8px 12px',
                  background: '#d4af37',
                  color: 'white',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Linked to Job
                </span>
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
                  onClick={() => setNotification({
                    isOpen: true,
                    type: 'info',
                    title: 'Coming Soon',
                    message: 'IMAP integration coming soon!',
                    onConfirm: null
                  })}
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
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1a1a1a' }}>From:</label>
                <select
                  value={composeData.fromAccount}
                  onChange={(e) => setComposeData({...composeData, fromAccount: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '15px',
                    color: '#1a1a1a',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">Select email account...</option>
                  {emailAccounts.map((account) => (
                    <option key={account._id} value={account._id}>
                      {account.email} ({account.provider})
                    </option>
                  ))}
                </select>
              </div>
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
                    cursor: 'text',
                    color: '#1a1a1a'
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
                    cursor: 'text',
                    color: '#1a1a1a'
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
                    cursor: 'text',
                    color: '#1a1a1a'
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
                    cursor: 'text',
                    color: '#1a1a1a'
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
                onClick={async () => {
                  // Validation
                  if (!composeData.fromAccount) {
                    setNotification({
                      isOpen: true,
                      type: 'warning',
                      title: 'Missing Information',
                      message: 'Please select an email account to send from',
                      onConfirm: null
                    });
                    return;
                  }
                  if (!composeData.to) {
                    setNotification({
                      isOpen: true,
                      type: 'warning',
                      title: 'Missing Information',
                      message: 'Please enter a recipient email address',
                      onConfirm: null
                    });
                    return;
                  }
                  if (!composeData.subject) {
                    setNotification({
                      isOpen: true,
                      type: 'warning',
                      title: 'Missing Information',
                      message: 'Please enter an email subject',
                      onConfirm: null
                    });
                    return;
                  }
                  if (!composeData.body) {
                    setNotification({
                      isOpen: true,
                      type: 'warning',
                      title: 'Missing Information',
                      message: 'Please enter an email body',
                      onConfirm: null
                    });
                    return;
                  }

                  setSendingEmail(true);
                  try {
                    await axios.post(`${API_URL}/emails/send`, {
                      accountId: composeData.fromAccount,
                      to: composeData.to,
                      cc: composeData.cc,
                      subject: composeData.subject,
                      body: composeData.body
                    });

                    setShowComposeModal(false);
                    setComposeData({ fromAccount: '', to: '', cc: '', subject: '', body: '' });
                    setNotification({
                      isOpen: true,
                      type: 'success',
                      title: 'Email Sent',
                      message: 'Email sent successfully!',
                      onConfirm: null
                    });
                  } catch (error) {
                    console.error('Error sending email:', error);
                    setNotification({
                      isOpen: true,
                      type: 'error',
                      title: 'Send Failed',
                      message: `Failed to send email: ${error.response?.data?.details || error.message}`,
                      onConfirm: null
                    });
                  } finally {
                    setSendingEmail(false);
                  }
                }}
                disabled={sendingEmail}
                style={{
                  padding: '10px 24px',
                  background: sendingEmail ? '#9e9e9e' : '#d4af37',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontWeight: '600',
                  cursor: sendingEmail ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: sendingEmail ? 0.7 : 1
                }}
              >
                <FiSend /> {sendingEmail ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Job Creation Modal */}
      {showJobModal && extractedJobData && (
        <div className="modal-overlay" onClick={() => setShowJobModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2><FiPlus /> Create Job from Email</h2>
              <button className="icon-btn" onClick={() => setShowJobModal(false)}>×</button>
            </div>
            <div className="modal-body" style={{ padding: '24px' }}>
              <p style={{ marginBottom: '20px', color: '#6b7280' }}>
                Review the AI-extracted job details and make any necessary edits before creating the job:
              </p>

              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>
                    Job Title *
                  </label>
                  <input
                    type="text"
                    value={extractedJobData.title || ''}
                    onChange={(e) => setExtractedJobData({ ...extractedJobData, title: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>
                    Description
                  </label>
                  <textarea
                    value={extractedJobData.description || ''}
                    onChange={(e) => setExtractedJobData({ ...extractedJobData, description: e.target.value })}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      value={extractedJobData.customerName || ''}
                      onChange={(e) => setExtractedJobData({ ...extractedJobData, customerName: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>
                      Customer Email *
                    </label>
                    <input
                      type="email"
                      value={extractedJobData.customerEmail || ''}
                      onChange={(e) => setExtractedJobData({ ...extractedJobData, customerEmail: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>
                      Customer Phone
                    </label>
                    <input
                      type="tel"
                      value={extractedJobData.customerPhone || ''}
                      onChange={(e) => setExtractedJobData({ ...extractedJobData, customerPhone: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>
                      Priority
                    </label>
                    <select
                      value={extractedJobData.priority || 'medium'}
                      onChange={(e) => setExtractedJobData({ ...extractedJobData, priority: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>
                    Address
                  </label>
                  <input
                    type="text"
                    value={extractedJobData.address || ''}
                    onChange={(e) => setExtractedJobData({ ...extractedJobData, address: e.target.value })}
                    placeholder="Street, City, State ZIP"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>
                      Estimated Hours
                    </label>
                    <input
                      type="number"
                      value={extractedJobData.estimatedHours || ''}
                      onChange={(e) => setExtractedJobData({ ...extractedJobData, estimatedHours: parseFloat(e.target.value) || 0 })}
                      min="0"
                      step="0.5"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>
                      Preferred Date
                    </label>
                    <input
                      type="date"
                      value={extractedJobData.preferredDate ? new Date(extractedJobData.preferredDate).toISOString().split('T')[0] : ''}
                      onChange={(e) => setExtractedJobData({ ...extractedJobData, preferredDate: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>
                    Notes
                  </label>
                  <textarea
                    value={extractedJobData.notes || ''}
                    onChange={(e) => setExtractedJobData({ ...extractedJobData, notes: e.target.value })}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowJobModal(false)}
                style={{
                  padding: '10px 24px',
                  background: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  color: '#374151',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => createJobFromEmail(false)}
                style={{
                  padding: '10px 24px',
                  background: '#6b7280',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Create Job
              </button>
              <button
                onClick={() => createJobFromEmail(true)}
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
                <FiPlus /> Create & Add to Calendar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onConfirm={notification.onConfirm}
      />
    </div>
  );
}

export default Emails;
