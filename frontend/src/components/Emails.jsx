import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiMail, FiRefreshCw, FiFilter, FiSearch } from 'react-icons/fi';

const API_URL = 'http://localhost:5000/api';

function Emails() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [selectedEmail, setSelectedEmail] = useState(null);

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
      if (filters.isWorkRelated) queryParams.append('isWorkRelated', filters.isWorkRelated);
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
        <button onClick={syncEmails} className="btn-sync" disabled={loading}>
          <FiRefreshCw className={loading ? 'spinning' : ''} />
          {loading ? 'Syncing...' : 'Sync Emails'}
        </button>
      </div>

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

      <div className="filters">
        <div className="filter-group">
          <FiFilter />
          <select value={filters.accountType} onChange={(e) => setFilters({ ...filters, accountType: e.target.value })}>
            <option value="">All Accounts</option>
            <option value="gmail1">Gmail 1</option>
            <option value="gmail2">Gmail 2</option>
            <option value="microsoft">Microsoft</option>
            <option value="godaddy">GoDaddy</option>
          </select>
          <select value={filters.isWorkRelated} onChange={(e) => setFilters({ ...filters, isWorkRelated: e.target.value })}>
            <option value="">All Emails</option>
            <option value="true">Work Related</option>
            <option value="false">Non-Work</option>
          </select>
          <select value={filters.isRead} onChange={(e) => setFilters({ ...filters, isRead: e.target.value })}>
            <option value="">Read & Unread</option>
            <option value="false">Unread Only</option>
            <option value="true">Read Only</option>
          </select>
        </div>
        <div className="search-box">
          <FiSearch />
          <input
            type="text"
            placeholder="Search emails..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
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
    </div>
  );
}

export default Emails;
