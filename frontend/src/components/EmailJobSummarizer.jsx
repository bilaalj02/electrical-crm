import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiX, FiMail, FiCheckCircle, FiXCircle, FiCalendar, FiAlertCircle, FiChevronDown, FiChevronUp } from 'react-icons/fi';

const API_URL = 'http://localhost:5001/api';

function EmailJobSummarizer({ isOpen, onClose }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedEmail, setExpandedEmail] = useState(null);
  const [actionMenuOpen, setActionMenuOpen] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchPotentialJobs();
    }
  }, [isOpen]);

  const fetchPotentialJobs = async () => {
    setLoading(true);
    try {
      // Fetch work-related, unread emails that might contain job requests
      const response = await axios.get(`${API_URL}/emails?isWorkRelated=true&isRead=false`);
      const potentialJobs = response.data.emails.map(email => ({
        ...email,
        aiSummary: generateAISummary(email),
        priority: detectPriority(email),
        estimatedValue: estimateJobValue(email)
      }));
      setEmails(potentialJobs);
    } catch (error) {
      console.error('Error fetching potential jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  // AI Summary Generator (mock for now - replace with actual AI API)
  const generateAISummary = (email) => {
    const subject = email.subject?.toLowerCase() || '';
    const body = email.body?.text?.toLowerCase() || '';

    // Detect job type
    let jobType = 'General Service';
    if (subject.includes('panel') || body.includes('panel')) jobType = 'Panel Upgrade';
    else if (subject.includes('rewiring') || body.includes('rewire')) jobType = 'Rewiring';
    else if (subject.includes('outlet') || body.includes('outlet')) jobType = 'Outlet Installation';
    else if (subject.includes('lighting') || body.includes('light')) jobType = 'Lighting Installation';
    else if (subject.includes('emergency') || body.includes('urgent')) jobType = 'Emergency Repair';
    else if (subject.includes('ev') || body.includes('charger')) jobType = 'EV Charger Installation';

    // Detect urgency keywords
    const urgentKeywords = ['urgent', 'asap', 'emergency', 'immediately', 'right away'];
    const isUrgent = urgentKeywords.some(keyword => subject.includes(keyword) || body.includes(keyword));

    return {
      jobType,
      isUrgent,
      summary: `${jobType} request from ${email.from?.name || 'client'}. ${isUrgent ? 'URGENT: ' : ''}Needs electrical work.`,
      extractedDetails: {
        clientName: email.from?.name || 'Unknown',
        clientEmail: email.from?.email || '',
        requestDate: new Date(email.date).toLocaleDateString()
      }
    };
  };

  const detectPriority = (email) => {
    const summary = generateAISummary(email);
    if (summary.isUrgent) return 'urgent';

    const subject = email.subject?.toLowerCase() || '';
    if (subject.includes('quote') || subject.includes('estimate')) return 'medium';
    return 'low';
  };

  const estimateJobValue = (email) => {
    const body = email.body?.text?.toLowerCase() || '';

    // Simple estimation based on job type
    if (body.includes('panel upgrade')) return '$3,000 - $5,000';
    if (body.includes('rewiring') || body.includes('rewire')) return '$5,000 - $15,000';
    if (body.includes('ev charger')) return '$1,500 - $3,000';
    if (body.includes('outlet')) return '$200 - $800';
    if (body.includes('lighting')) return '$500 - $2,000';

    return '$500 - $3,000';
  };

  const handleAction = async (emailId, action) => {
    switch (action) {
      case 'approve':
        alert('Job approved! Redirecting to schedule...');
        // TODO: Create job and navigate to scheduling
        break;
      case 'decline':
        await axios.patch(`${API_URL}/emails/${emailId}`, { isRead: true });
        alert('Job declined. Email marked as read.');
        fetchPotentialJobs();
        break;
      case 'checkSchedule':
        alert('Opening schedule view...');
        // TODO: Open calendar/schedule view
        break;
      case 'requestMoreInfo':
        alert('Opening email to request more information...');
        // TODO: Open email compose
        break;
      case 'sendQuote':
        alert('Opening quote generator...');
        // TODO: Open quote form
        break;
      default:
        break;
    }
    setActionMenuOpen(null);
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: '#ef4444',
      high: '#f59e0b',
      medium: '#3b82f6',
      low: '#10b981'
    };
    return colors[priority] || '#6b7280';
  };

  if (!isOpen) return null;

  return (
    <div className="email-summarizer-overlay">
      <div className="email-summarizer-popup">
        {/* Header */}
        <div className="summarizer-header">
          <div className="header-left">
            <FiMail className="header-icon" />
            <div>
              <h2>Potential Job Opportunities</h2>
              <p className="subtitle">AI-powered email analysis</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <FiX />
          </button>
        </div>

        {/* Stats Bar */}
        <div className="summarizer-stats">
          <div className="stat-item">
            <span className="stat-label">Total Opportunities</span>
            <span className="stat-value">{emails.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Urgent</span>
            <span className="stat-value urgent">{emails.filter(e => e.priority === 'urgent').length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Est. Value</span>
            <span className="stat-value">High Potential</span>
          </div>
        </div>

        {/* Email List */}
        <div className="summarizer-content">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Analyzing emails...</p>
            </div>
          ) : emails.length === 0 ? (
            <div className="empty-state">
              <FiCheckCircle size={48} />
              <p>All caught up!</p>
              <p className="hint">No new job opportunities at the moment</p>
            </div>
          ) : (
            <div className="email-job-list">
              {emails.map((email) => (
                <div key={email._id} className="email-job-card">
                  <div className="job-card-header" onClick={() => setExpandedEmail(expandedEmail === email._id ? null : email._id)}>
                    <div className="job-info">
                      <div className="job-title">
                        <span className="priority-indicator" style={{ backgroundColor: getPriorityColor(email.priority) }}></span>
                        {email.aiSummary.jobType}
                      </div>
                      <div className="job-meta">
                        <span className="client-name">{email.aiSummary.extractedDetails.clientName}</span>
                        <span className="separator">•</span>
                        <span className="job-value">{email.estimatedValue}</span>
                      </div>
                    </div>
                    <button className="expand-btn">
                      {expandedEmail === email._id ? <FiChevronUp /> : <FiChevronDown />}
                    </button>
                  </div>

                  {expandedEmail === email._id && (
                    <div className="job-card-body">
                      <div className="ai-summary">
                        <h4>AI Summary</h4>
                        <p>{email.aiSummary.summary}</p>
                      </div>

                      <div className="email-details">
                        <div className="detail-row">
                          <span className="label">From:</span>
                          <span className="value">{email.from?.email}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Subject:</span>
                          <span className="value">{email.subject}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Received:</span>
                          <span className="value">{new Date(email.date).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="email-preview">
                        <h4>Email Preview</h4>
                        <p className="preview-text">{email.body?.text?.substring(0, 200)}...</p>
                      </div>

                      <div className="action-buttons">
                        <button
                          className="action-btn approve"
                          onClick={() => handleAction(email._id, 'approve')}
                        >
                          <FiCheckCircle /> Approve & Schedule
                        </button>

                        <button
                          className="action-btn secondary"
                          onClick={() => handleAction(email._id, 'sendQuote')}
                        >
                          <FiMail /> Send Quote
                        </button>

                        <div className="dropdown-wrapper">
                          <button
                            className="action-btn more"
                            onClick={() => setActionMenuOpen(actionMenuOpen === email._id ? null : email._id)}
                          >
                            More Actions <FiChevronDown />
                          </button>

                          {actionMenuOpen === email._id && (
                            <div className="action-dropdown">
                              <button onClick={() => handleAction(email._id, 'checkSchedule')}>
                                <FiCalendar /> Check Schedule
                              </button>
                              <button onClick={() => handleAction(email._id, 'requestMoreInfo')}>
                                <FiAlertCircle /> Request More Info
                              </button>
                              <button onClick={() => handleAction(email._id, 'decline')}>
                                <FiXCircle /> Decline
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmailJobSummarizer;
