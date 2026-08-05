import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import {
  FiMail, FiRefreshCw, FiFilter, FiSearch, FiPlus, FiCheck, FiX, FiEdit,
  FiSend, FiMinus, FiMaximize2, FiMinimize2, FiTrash2, FiFolder,
  FiChevronDown, FiChevronRight, FiChevronLeft, FiMoreHorizontal
} from 'react-icons/fi';
import NotificationModal from './NotificationModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SESSION_KEY = 'email_selectedId';

// Default folders to show before a sync happens
const DEFAULT_FOLDERS = [
  { id: 'inbox',     name: 'Inbox',      icon: '📥' },
  { id: 'sentitems', name: 'Sent',       icon: '📤' },
  { id: 'drafts',    name: 'Drafts',     icon: '📝' },
  { id: 'junkemail', name: 'Junk',       icon: '🚫' },
  { id: 'deleteditems', name: 'Deleted', icon: '🗑️' },
];

function Emails({ initialFolder = null, onConsumeInitial } = {}) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [emailAccounts, setEmailAccounts] = useState([]);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [composeMinimized, setComposeMinimized] = useState(false);
  const [composeExpanded, setComposeExpanded] = useState(false);
  const [composePos, setComposePos] = useState(null);
  const composeDrag = useRef({ dragging: false, startX: 0, startY: 0, startLeft: 0, startTop: 0 });
  const composePanelRef = useRef(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [composeData, setComposeData] = useState({ fromAccount: '', to: '', cc: '', subject: '', body: '' });
  const [extractingJob, setExtractingJob] = useState(false);
  const [showJobModal, setShowJobModal] = useState(false);
  const [extractedJobData, setExtractedJobData] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  // Left folder sidebar
  const [folderSidebarCollapsed, setFolderSidebarCollapsed] = useState(false);
  const [folders, setFolders] = useState({}); // { accountId: [{ id, name, unreadCount }] }
  const [expandedAccounts, setExpandedAccounts] = useState(new Set());
  const [dragOverFolder, setDragOverFolder] = useState(null);
  const [movingEmail, setMovingEmail] = useState(false);
  const [showMoveDropdown, setShowMoveDropdown] = useState(false);
  const [loadingAttachments, setLoadingAttachments] = useState({});
  const [viewingAttachment, setViewingAttachment] = useState(null); // modal for non-pdf/image types
  const [expandedPdfs, setExpandedPdfs] = useState(new Set()); // inline-expanded PDF attachmentIds
  const moveDropdownRef = useRef(null);

  const [filters, setFilters] = useState({
    accountType: '',
    isWorkRelated: '',
    isRead: '',
    search: '',
    folderId: initialFolder?.id || ''
  });
  const [activeFolderName, setActiveFolderName] = useState(initialFolder?.name || '');

  const [notification, setNotification] = useState({ isOpen: false, type: 'info', title: '', message: '', onConfirm: null });

  // ── Deep-link folder from App.jsx nav ──
  useEffect(() => {
    if (initialFolder?.id) {
      setFilters(prev => ({ ...prev, folderId: initialFolder.id }));
      setActiveFolderName(initialFolder.name || '');
      onConsumeInitial?.();
    }
  }, [initialFolder]);

  const clearFolderFilter = () => {
    setFilters(prev => ({ ...prev, folderId: '' }));
    setActiveFolderName('');
  };

  // ── Fetch emails ──
  const fetchEmails = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.accountType) queryParams.append('accountType', filters.accountType);
      if (filters.isWorkRelated === 'inbox') queryParams.append('folder', 'inbox');
      else if (filters.isWorkRelated === 'sent') queryParams.append('folder', 'sent');
      else if (filters.isWorkRelated) queryParams.append('isWorkRelated', filters.isWorkRelated);
      if (filters.isRead) queryParams.append('isRead', filters.isRead);
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.folderId) queryParams.append('folderId', filters.folderId);

      const response = await axios.get(`${API_URL}/emails?${queryParams.toString()}`);
      const fetched = response.data.emails;
      setEmails(fetched);

      // Restore selected email from sessionStorage
      const savedId = sessionStorage.getItem(SESSION_KEY);
      if (savedId && fetched?.length) {
        const match = fetched.find(e => e._id === savedId);
        if (match) setSelectedEmail(prev => prev?._id === savedId ? prev : match);
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [filters]);

  const fetchEmailAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/oauth/accounts`, { headers: { Authorization: `Bearer ${token}` } });
      const accounts = response.data.emailAccounts;
      setEmailAccounts(accounts);
      // Auto-expand all accounts
      setExpandedAccounts(new Set(accounts.map(a => a._id)));
      return accounts;
    } catch (error) {
      console.error('Error fetching email accounts:', error);
      return [];
    }
  };

  const fetchFolders = async (accounts) => {
    if (!accounts?.length) return;
    const token = localStorage.getItem('token');
    const result = {};
    for (const account of accounts) {
      try {
        const res = await axios.get(`${API_URL}/email-sync/folders/${account._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        result[account._id] = res.data.folders;
      } catch {
        // Fall back to default folders
        result[account._id] = DEFAULT_FOLDERS.map(f => ({ ...f, unreadCount: 0, totalCount: 0 }));
      }
    }
    setFolders(result);
  };

  const fetchStats = async () => {
    try {
      await axios.get(`${API_URL}/emails/stats/summary`);
    } catch { /* non-fatal */ }
  };

  useEffect(() => {
    const init = async () => {
      const accounts = await fetchEmailAccounts();
      await fetchFolders(accounts);
      await fetchEmails();
      await fetchStats();
    };
    init();

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('oauth') === 'success') {
      const email = urlParams.get('email');
      setNotification({ isOpen: true, type: 'success', title: 'Email Connected', message: `Successfully connected ${email}!`, onConfirm: null });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('error')) {
      setNotification({ isOpen: true, type: 'error', title: 'Connection Failed', message: 'Failed to connect email account.', onConfirm: null });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => { fetchEmails(); }, [filters]);

  useEffect(() => {
    const interval = setInterval(() => { fetchEmails(true); fetchStats(); }, 30000);
    return () => clearInterval(interval);
  }, [filters]);

  // ── Persist selected email ──
  const selectEmail = (email) => {
    // Skip if same email is already open — avoids clobbering fetched attachment URLs
    if (email._id === selectedEmail?._id) return;
    setSelectedEmail(email);
    sessionStorage.setItem(SESSION_KEY, email._id);
  };
  const closeEmail = () => {
    setSelectedEmail(null);
    sessionStorage.removeItem(SESSION_KEY);
  };

  // ── Account actions ──
  const connectGmail = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API_URL}/oauth/gmail/auth-url`, { headers: { Authorization: `Bearer ${token}` } });
      window.location.href = data.authUrl;
    } catch { setNotification({ isOpen: true, type: 'error', title: 'Connection Error', message: 'Error initiating Gmail connection.', onConfirm: null }); }
  };

  const connectMicrosoft = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API_URL}/oauth/microsoft/auth-url`, { headers: { Authorization: `Bearer ${token}` } });
      window.location.href = data.authUrl;
    } catch { setNotification({ isOpen: true, type: 'error', title: 'Connection Error', message: 'Error initiating Microsoft connection.', onConfirm: null }); }
  };

  const disconnectAccount = (accountId) => {
    setNotification({
      isOpen: true, type: 'confirm', title: 'Disconnect Email Account',
      message: 'Are you sure you want to disconnect this email account?',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.delete(`${API_URL}/oauth/accounts/${accountId}`, { headers: { Authorization: `Bearer ${token}` } });
          const accounts = await fetchEmailAccounts();
          await fetchFolders(accounts);
          setNotification({ isOpen: true, type: 'success', title: 'Success', message: 'Account disconnected.', onConfirm: null });
        } catch { setNotification({ isOpen: true, type: 'error', title: 'Error', message: 'Failed to disconnect account.', onConfirm: null }); }
      }
    });
  };

  const syncAccountEmails = async (accountId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/email-sync/sync/${accountId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      await fetchEmails();
      await fetchStats();
      // Refresh folders after sync (real folder data now available)
      await fetchFolders(emailAccounts);
      setNotification({ isOpen: true, type: 'success', title: 'Success', message: 'Emails synced!', onConfirm: null });
    } catch {
      setNotification({ isOpen: true, type: 'error', title: 'Sync Error', message: 'Error syncing emails.', onConfirm: null });
    } finally { setLoading(false); }
  };

  // ── Email actions ──
  const toggleRead = async (emailId, currentStatus) => {
    try {
      await axios.patch(`${API_URL}/emails/${emailId}`, { isRead: !currentStatus });
      fetchEmails();
    } catch (error) { console.error('Error updating email:', error); }
  };

  const deleteEmail = (emailId) => {
    setNotification({
      isOpen: true, type: 'confirm', title: 'Delete Email', message: 'Delete this email? This cannot be undone.',
      onConfirm: async () => {
        try {
          await axios.delete(`${API_URL}/emails/${emailId}`);
          setEmails(prev => prev.filter(e => e._id !== emailId));
          if (selectedEmail?._id === emailId) closeEmail();
          fetchStats();
        } catch { setNotification({ isOpen: true, type: 'error', title: 'Error', message: 'Failed to delete email.', onConfirm: null }); }
      }
    });
  };

  const toggleSelectEmail = (emailId) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(emailId) ? next.delete(emailId) : next.add(emailId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(prev => prev.size === emails.length && emails.length > 0 ? new Set() : new Set(emails.map(e => e._id)));
  };

  const bulkDeleteEmails = () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    setNotification({
      isOpen: true, type: 'confirm', title: 'Delete Emails', message: `Delete ${ids.length} email${ids.length > 1 ? 's' : ''}? This cannot be undone.`,
      onConfirm: async () => {
        setBulkDeleting(true);
        try {
          await axios.delete(`${API_URL}/emails/bulk`, { data: { ids } });
          setEmails(prev => prev.filter(e => !selectedIds.has(e._id)));
          if (selectedEmail && selectedIds.has(selectedEmail._id)) closeEmail();
          setSelectedIds(new Set());
          fetchStats();
        } catch { setNotification({ isOpen: true, type: 'error', title: 'Error', message: 'Failed to delete emails.', onConfirm: null }); }
        finally { setBulkDeleting(false); }
      }
    });
  };

  const extractJobFromEmail = async () => {
    setExtractingJob(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/automation/extract-job/${selectedEmail._id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.success) { setExtractedJobData(response.data.jobData); setShowJobModal(true); }
    } catch (error) {
      setNotification({ isOpen: true, type: 'error', title: 'Extraction Error', message: error.response?.data?.message || 'Failed to extract job details.', onConfirm: null });
    } finally { setExtractingJob(false); }
  };

  const createJobFromEmail = async (createCalendar = false) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/automation/create-job-from-email`, {
        emailId: selectedEmail._id, jobData: extractedJobData, createCalendarEvent: createCalendar
      }, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.success) {
        setNotification({ isOpen: true, type: 'success', title: 'Job Created', message: `Job ${response.data.job.jobNumber} created!`, onConfirm: null });
        setShowJobModal(false); setExtractedJobData(null); await fetchEmails();
      }
    } catch (error) {
      setNotification({ isOpen: true, type: 'error', title: 'Job Creation Error', message: error.response?.data?.message || 'Failed to create job.', onConfirm: null });
    }
  };

  // ── Drag & Drop ──
  const onEmailDragStart = (e, email) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('emailId', email._id);
    e.dataTransfer.setData('emailMessageId', email.messageId || '');
  };

  const onFolderDragOver = (e, accountId, folderId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverFolder(`${accountId}::${folderId}`);
  };

  const onFolderDragLeave = () => setDragOverFolder(null);

  const onFolderDrop = async (e, account, folder) => {
    e.preventDefault();
    setDragOverFolder(null);
    const emailId = e.dataTransfer.getData('emailId');
    if (!emailId) return;
    setMovingEmail(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/email-sync/move/${emailId}`, {
        folderId: folder.id, folderName: folder.name
      }, { headers: { Authorization: `Bearer ${token}` } });
      setNotification({ isOpen: true, type: 'success', title: 'Moved', message: `Email moved to ${folder.name}`, onConfirm: null });
      await fetchEmails();
    } catch (error) {
      setNotification({ isOpen: true, type: 'error', title: 'Error', message: error.response?.data?.error || 'Failed to move email.', onConfirm: null });
    } finally { setMovingEmail(false); }
  };

  // ── Close move dropdown on outside click ──
  useEffect(() => {
    if (!showMoveDropdown) return;
    const handler = (e) => { if (moveDropdownRef.current && !moveDropdownRef.current.contains(e.target)) setShowMoveDropdown(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMoveDropdown]);

  // ── Reset per-email UI state when switching emails ──
  useEffect(() => {
    setExpandedPdfs(new Set());
    setLoadingAttachments({});
  }, [selectedEmail?._id]);

  // ── Fetch attachments once when an email is opened (Gmail + Microsoft) ──
  useEffect(() => {
    if (!selectedEmail?.attachments?.length) return;
    const missing = selectedEmail.attachments.filter(a => !a.url && a.attachmentId);
    if (!missing.length) return;

    const token = localStorage.getItem('token');
    missing.forEach(att => {
      const idx = selectedEmail.attachments.indexOf(att);
      setLoadingAttachments(prev => ({ ...prev, [att.attachmentId]: true }));
      // POST — put attachmentId in body to avoid URL encoding issues with special chars
      axios.post(
        `${API_URL}/email-sync/${selectedEmail._id}/attachment`,
        { attachmentId: att.attachmentId },
        { headers: { Authorization: `Bearer ${token}` } }
      ).then(({ data }) => {
        setSelectedEmail(prev => {
          if (!prev || prev._id !== selectedEmail._id) return prev;
          const atts = [...(prev.attachments || [])];
          atts[idx] = {
            ...atts[idx],
            url: data.url,
            mimeType: data.mimeType || atts[idx].mimeType,
            contentId: data.contentId ?? atts[idx].contentId
          };
          return { ...prev, attachments: atts };
        });
      }).catch(err => {
        // data.error carries the backend's specific reason (e.g. "Email not
        // found", "Attachment content not available") — logging only .detail
        // hid it for 4xx responses and left bare "Request failed with 404"
        const serverMsg = err.response?.data?.error || err.response?.data?.detail;
        console.error(`Attachment fetch failed (${att.filename}):`, serverMsg || err.message);
      }).finally(() => {
        setLoadingAttachments(prev => ({ ...prev, [att.attachmentId]: false }));
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmail?._id]);

  // ── Compose drag ──
  const onComposeDragStart = useCallback((e) => {
    if (composeExpanded) return;
    e.preventDefault();
    const panel = composePanelRef.current;
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    composeDrag.current = { dragging: true, startX: e.clientX, startY: e.clientY, startLeft: rect.left, startTop: rect.top };
    document.body.style.userSelect = 'none';
    const onMove = (ev) => {
      if (!composeDrag.current.dragging) return;
      const newLeft = Math.max(0, Math.min(window.innerWidth - panel.offsetWidth, composeDrag.current.startLeft + ev.clientX - composeDrag.current.startX));
      const newTop = Math.max(0, Math.min(window.innerHeight - 44, composeDrag.current.startTop + ev.clientY - composeDrag.current.startY));
      setComposePos({ left: newLeft, top: newTop });
    };
    const onUp = () => { composeDrag.current.dragging = false; document.body.style.userSelect = ''; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [composeExpanded]);

  const formatDate = (date) => new Date(date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const toggleAccountExpanded = (accountId) => {
    setExpandedAccounts(prev => {
      const next = new Set(prev);
      next.has(accountId) ? next.delete(accountId) : next.add(accountId);
      return next;
    });
  };

  // ── Render ──
  return (
    <div className="emails-page">

      {/* ── Top toolbar ── */}
      <div className="email-toolbar">
        <button className="email-toolbar-btn email-toolbar-btn-gold" onClick={() => setShowComposeModal(true)}>
          <FiEdit size={13} /> New mail
        </button>
        <div className="email-toolbar-divider" />
        <button className="email-toolbar-btn" onClick={() => setShowAccountModal(true)}>
          <FiPlus size={13} /> Connect
        </button>
        <button className="email-toolbar-btn" onClick={() => setShowSyncModal(true)} disabled={loading || !emailAccounts.length}>
          <FiRefreshCw size={13} className={loading ? 'spinning' : ''} /> {loading ? 'Syncing…' : 'Sync'}
        </button>
        {selectedEmail && (
          <>
            <div className="email-toolbar-divider" />
            <button className="email-toolbar-btn" onClick={() => toggleRead(selectedEmail._id, selectedEmail.isRead)}>
              <FiMail size={13} /> {selectedEmail.isRead ? 'Mark Unread' : 'Mark Read'}
            </button>
            <button className="email-toolbar-btn" onClick={() => {
              setComposeData({
                fromAccount: emailAccounts.find(a => selectedEmail.to?.some(t => t.email === a.email))?._id || '',
                to: selectedEmail.from?.email,
                cc: '',
                subject: selectedEmail.subject?.startsWith('Re:') ? selectedEmail.subject : `Re: ${selectedEmail.subject || ''}`,
                body: `\n\n---\nOn ${new Date(selectedEmail.date).toLocaleString()}, ${selectedEmail.from?.name || selectedEmail.from?.email} wrote:\n> ${selectedEmail.body?.text?.split('\n').join('\n> ')}`
              });
              setShowComposeModal(true);
            }}>
              <FiSend size={13} /> Reply
            </button>
            {/* Move to folder dropdown */}
            <div style={{ position: 'relative' }} ref={moveDropdownRef}>
              <button className="email-toolbar-btn" onClick={() => setShowMoveDropdown(v => !v)}>
                <FiFolder size={13} /> Move to <FiChevronDown size={11} />
              </button>
              {showMoveDropdown && (
                <div className="email-move-dropdown">
                  {emailAccounts.map(account => {
                    const accountFolders = folders[account._id] || DEFAULT_FOLDERS.map(f => ({ ...f }));
                    return (
                      <div key={account._id}>
                        <div className="email-move-dropdown-account">{account.email}</div>
                        {accountFolders.map(folder => (
                          <button
                            key={folder.id}
                            className="email-move-dropdown-item"
                            onClick={async () => {
                              setShowMoveDropdown(false);
                              await onFolderDrop({ preventDefault: () => {}, dataTransfer: { getData: (k) => k === 'emailId' ? selectedEmail._id : '' } }, account, folder);
                            }}
                          >
                            <span>{folder.icon || '📁'}</span> {folder.name}
                          </button>
                        ))}
                      </div>
                    );
                  })}
                  {emailAccounts.length === 0 && <div style={{ padding: '10px 14px', color: '#9ca3af', fontSize: 12 }}>No accounts connected</div>}
                </div>
              )}
            </div>
            <button className="email-toolbar-btn email-toolbar-btn-danger" onClick={() => deleteEmail(selectedEmail._id)}>
              <FiTrash2 size={13} /> Delete
            </button>
          </>
        )}
        {selectedIds.size > 0 && (
          <>
            <div className="email-toolbar-divider" />
            <button className="email-toolbar-btn email-toolbar-btn-danger" onClick={bulkDeleteEmails} disabled={bulkDeleting}>
              <FiTrash2 size={13} /> Delete {selectedIds.size} selected
            </button>
            <button className="email-toolbar-btn" onClick={() => setSelectedIds(new Set())}>Cancel</button>
          </>
        )}
        <div style={{ flex: 1 }} />
        <button className="email-toolbar-btn" onClick={() => setFiltersExpanded(v => !v)}>
          <FiSearch size={13} /> {filtersExpanded ? 'Hide filters' : 'Search'}
        </button>
      </div>

      {/* ── Filters bar ── */}
      {filtersExpanded && (
        <div className="email-filter-bar">
          <input type="text" placeholder="Search emails…" value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} className="email-filter-input" style={{ minWidth: 200 }} />
          <select value={filters.accountType} onChange={e => setFilters(f => ({ ...f, accountType: e.target.value }))} className="email-filter-select">
            <option value="">All accounts</option>
            <option value="gmail">Gmail</option>
            <option value="microsoft">Microsoft</option>
          </select>
          <select value={filters.isWorkRelated} onChange={e => setFilters(f => ({ ...f, isWorkRelated: e.target.value }))} className="email-filter-select">
            <option value="">All folders</option>
            <option value="inbox">Inbox</option>
            <option value="sent">Sent</option>
          </select>
          <select value={filters.isRead} onChange={e => setFilters(f => ({ ...f, isRead: e.target.value }))} className="email-filter-select">
            <option value="">All status</option>
            <option value="false">Unread</option>
            <option value="true">Read</option>
          </select>
          {activeFolderName && (
            <div className="email-active-folder-chip">
              <FiFolder size={12} /> {activeFolderName}
              <button onClick={clearFolderFilter} style={{ background: 'none', border: 'none', color: '#d4af37', cursor: 'pointer', padding: 0, display: 'flex' }}><FiX size={12} /></button>
            </div>
          )}
        </div>
      )}

      {/* ── Three-pane body ── */}
      <div className={`email-body${isMobile ? ' email-body-mobile' : ''}`}>

        {/* ── Left folder sidebar — hidden on mobile when email open ── */}
        <div className={`email-nav-sidebar ${folderSidebarCollapsed ? 'collapsed' : ''}${isMobile && selectedEmail ? ' email-pane-hidden' : ''}`}>
          <button
            className="email-nav-collapse-btn"
            onClick={() => setFolderSidebarCollapsed(v => !v)}
            title={folderSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {folderSidebarCollapsed ? <FiChevronRight size={14} /> : <FiChevronLeft size={14} />}
          </button>

          {!folderSidebarCollapsed && (
            <div className="email-nav-content">
              {emailAccounts.length === 0 ? (
                <div className="email-nav-empty">
                  <FiMail size={24} style={{ color: '#ccc' }} />
                  <p>No accounts connected</p>
                  <button className="email-nav-connect-btn" onClick={() => setShowAccountModal(true)}>
                    <FiPlus size={12} /> Connect
                  </button>
                </div>
              ) : (
                emailAccounts.map(account => {
                  const accountFolders = folders[account._id] || DEFAULT_FOLDERS.map(f => ({ ...f, unreadCount: 0 }));
                  const isExpanded = expandedAccounts.has(account._id);
                  return (
                    <div key={account._id} className="email-nav-account">
                      <div className="email-nav-account-header" onClick={() => toggleAccountExpanded(account._id)}>
                        <div className="email-nav-account-info">
                          <div className="email-nav-account-avatar" style={{ background: account.provider === 'gmail' ? '#ef4444' : '#0078d4' }}>
                            {account.email[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="email-nav-account-email">{account.email}</div>
                            <div className="email-nav-account-provider">{account.provider}</div>
                          </div>
                        </div>
                        <div className="email-nav-account-actions">
                          <button
                            className="email-nav-icon-btn"
                            onClick={e => { e.stopPropagation(); syncAccountEmails(account._id); }}
                            title="Sync"
                          >
                            <FiRefreshCw size={11} />
                          </button>
                          {isExpanded ? <FiChevronDown size={12} /> : <FiChevronRight size={12} />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="email-nav-folders">
                          {accountFolders.map(folder => {
                            const isDropTarget = dragOverFolder === `${account._id}::${folder.id}`;
                            return (
                              <div
                                key={folder.id}
                                className={`email-nav-folder ${activeFolderName === folder.name ? 'active' : ''} ${isDropTarget ? 'drop-target' : ''}`}
                                onClick={() => {
                                  setFilters(f => ({ ...f, folderId: folder.id }));
                                  setActiveFolderName(folder.name);
                                }}
                                onDragOver={e => onFolderDragOver(e, account._id, folder.id)}
                                onDragLeave={onFolderDragLeave}
                                onDrop={e => onFolderDrop(e, account, folder)}
                              >
                                <span className="email-nav-folder-icon">{folder.icon || '📁'}</span>
                                <span className="email-nav-folder-name">{folder.name}</span>
                                {folder.unreadCount > 0 && (
                                  <span className="email-nav-folder-badge">{folder.unreadCount}</span>
                                )}
                                {isDropTarget && <span className="email-nav-drop-hint">Drop here</span>}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* ── Email list — hidden on mobile when email is open ── */}
        <div className={`email-list-pane${isMobile && selectedEmail ? ' email-pane-hidden' : ''}`}>
          <div className="email-list-header">
            <label className="email-select-all-check">
              <input
                type="checkbox"
                checked={selectedIds.size === emails.length && emails.length > 0}
                ref={el => { if (el) el.indeterminate = selectedIds.size > 0 && selectedIds.size < emails.length; }}
                onChange={toggleSelectAll}
              />
              <span>{activeFolderName || 'All Mail'}</span>
            </label>
            <span style={{ fontSize: 11, color: '#999' }}>{emails.length} emails</span>
          </div>

          <div className="email-list-scroll">
            {loading && emails.length === 0 ? (
              <div className="email-list-empty"><FiRefreshCw size={28} className="spinning" /><p>Loading…</p></div>
            ) : emails.length === 0 ? (
              <div className="email-list-empty"><FiMail size={40} style={{ color: '#ccc' }} /><p>No emails found</p><p style={{ fontSize: 12, color: '#aaa' }}>Sync an account to fetch emails</p></div>
            ) : (
              emails.map(email => (
                <div
                  key={email._id}
                  className={`email-row ${!email.isRead ? 'unread' : ''} ${selectedEmail?._id === email._id ? 'selected' : ''} ${selectedIds.has(email._id) ? 'checked' : ''}`}
                  onClick={() => selectEmail(email)}
                  draggable
                  onDragStart={e => onEmailDragStart(e, email)}
                >
                  <input
                    type="checkbox"
                    className="email-row-check"
                    checked={selectedIds.has(email._id)}
                    onClick={e => e.stopPropagation()}
                    onChange={() => toggleSelectEmail(email._id)}
                  />
                  <div className="email-row-avatar">
                    {(email.from?.name || email.from?.email || '?')[0].toUpperCase()}
                  </div>
                  <div className="email-row-body">
                    <div className="email-row-top">
                      <span className="email-row-from">{email.from?.name || email.from?.email}</span>
                      <span className="email-row-date">{formatDate(email.date)}</span>
                    </div>
                    <div className="email-row-subject">{email.subject || '(No Subject)'}</div>
                    <div className="email-row-preview">{email.snippet || email.body?.text?.substring(0, 80)}</div>
                    <div className="email-row-tags">
                      <span className={`badge ${email.accountType}`}>{email.accountType}</span>
                      {email.hasAttachments && <span style={{ fontSize: 11, color: '#888' }}>📎</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Email detail pane ── */}
        {selectedEmail ? (
          <div className={`email-detail-pane${isMobile ? ' email-detail-pane-mobile' : ''}`}>
            <div className="email-detail-header">
              {isMobile && (
                <button className="email-mobile-back-btn" onClick={closeEmail} title="Back to inbox">
                  <FiChevronLeft size={18} /> Back
                </button>
              )}
              <h2 className="email-detail-subject">{selectedEmail.subject || '(No Subject)'}</h2>
              {!isMobile && <button className="btn-close" onClick={closeEmail}>×</button>}
            </div>

            <div className="email-detail-meta">
              <div className="email-detail-avatar">
                {(selectedEmail.from?.name || selectedEmail.from?.email || '?')[0].toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#1f2937' }}>
                  {selectedEmail.from?.name || selectedEmail.from?.email}
                  {selectedEmail.from?.name && <span style={{ fontWeight: 400, color: '#888', fontSize: 12 }}> &lt;{selectedEmail.from.email}&gt;</span>}
                </div>
                <div style={{ fontSize: 12, color: '#888' }}>To: {selectedEmail.to?.map(t => t.email).join(', ')}</div>
              </div>
              <div style={{ fontSize: 12, color: '#888', whiteSpace: 'nowrap' }}>
                {new Date(selectedEmail.date).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            <div className="email-detail-body">
              {selectedEmail.body?.html ? (
                <iframe
                  srcDoc={(() => {
                    // Build a cid→url map from any inline attachments that have been fetched
                    const cidMap = {};
                    (selectedEmail.attachments || []).forEach(a => {
                      if (a.contentId && a.url) cidMap[a.contentId] = a.url;
                    });
                    let html = selectedEmail.body.html;
                    // Replace resolved cid: references with actual Cloudinary URLs
                    html = html.replace(/src="cid:([^"]*)"/gi, (_, cid) =>
                      cidMap[cid] ? `src="${cidMap[cid]}"` : 'src="" alt="[inline image]"'
                    );
                    html = html.replace(/src='cid:([^']*)'/gi, (_, cid) =>
                      cidMap[cid] ? `src='${cidMap[cid]}'` : "src='' alt='[inline image]'"
                    );
                    // Inject margin/padding reset so iframe height matches actual content
                    const resetStyle = '<style>html,body{margin:0!important;padding:0!important;}</style>';
                    return html.includes('<head') ? html.replace(/<head[^>]*>/i, m => m + resetStyle) : resetStyle + html;
                  })()}
                  title="Email content"
                  className="email-html"
                  style={{ width: '100%', border: 'none', display: 'block' }}
                  sandbox="allow-same-origin allow-popups"
                  onLoad={e => {
                    try {
                      const doc = e.target.contentDocument || e.target.contentWindow?.document;
                      if (doc) {
                        const h = doc.body?.scrollHeight || doc.documentElement.scrollHeight;
                        e.target.style.height = h + 'px';
                      }
                    } catch (_) {}
                  }}
                />
              ) : (
                <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', margin: 0, fontFamily: 'inherit', fontSize: 14, lineHeight: 1.7, padding: '0 0 16px' }}>{selectedEmail.body?.text || '(No content)'}</pre>
              )}

              {/* ── Inline attachments below email body ── */}
              {selectedEmail.attachments?.length > 0 && (() => {
                // Exclude cid: inline images — they render inside the email body itself
                const visibleAtts = selectedEmail.attachments.filter(a => !a.contentId);
                if (!visibleAtts.length) return null;
                return (
                <div className="email-inline-attachments">
                  <div className="email-inline-att-header">
                    📎 {visibleAtts.length} attachment{visibleAtts.length > 1 ? 's' : ''}
                  </div>

                  {visibleAtts.map((att, i) => {
                    const isLoading = loadingAttachments[att.attachmentId];
                    const isImage = att.mimeType?.startsWith('image/');
                    const isPdf = att.mimeType === 'application/pdf' || att.filename?.toLowerCase().endsWith('.pdf');
                    const isOffice = /\.(docx?|xlsx?|pptx?|csv)$/i.test(att.filename || '');
                    const pdfKey = att.attachmentId || `${selectedEmail._id}-${i}`;
                    const isPdfExpanded = expandedPdfs.has(pdfKey);

                    const downloadFile = async () => {
                      const res = await fetch(att.url);
                      const blob = await res.blob();
                      const a = document.createElement('a');
                      a.href = URL.createObjectURL(blob);
                      a.download = att.filename;
                      a.click();
                      URL.revokeObjectURL(a.href);
                    };

                    // Loading spinner
                    if (!att.url && isLoading) {
                      return (
                        <div key={att.attachmentId || i} className="att-inline-chip loading">
                          <span className="att-spinner" /> {att.filename}
                        </div>
                      );
                    }

                    // Failed fetch (not loading, no URL) — show plain unavailable chip
                    if (!att.url) {
                      return (
                        <div key={att.attachmentId || i} className="att-inline-chip unavailable" title="Attachment could not be loaded">
                          📎 {att.filename} <span style={{ opacity: 0.5, fontSize: 11 }}>(unavailable)</span>
                        </div>
                      );
                    }

                    // Image — render inline directly
                    if (isImage) {
                      return (
                        <div key={att.attachmentId || i} className="att-inline-image-wrap">
                          <div className="att-inline-chip-bar">
                            <span>🖼 {att.filename}</span>
                            <button className="att-chip-download" onClick={downloadFile} title="Download">⬇ Download</button>
                          </div>
                          <img src={att.url} alt={att.filename} className="att-inline-image" />
                        </div>
                      );
                    }

                    // PDF — collapsible inline viewer
                    if (isPdf) {
                      return (
                        <div key={pdfKey} className="att-inline-pdf-wrap">
                          <div
                            className={`att-inline-chip-bar clickable ${isPdfExpanded ? 'expanded' : ''}`}
                            onClick={() => setExpandedPdfs(prev => {
                              const next = new Set(prev);
                              next.has(pdfKey) ? next.delete(pdfKey) : next.add(pdfKey);
                              return next;
                            })}
                          >
                            <span>📄 {att.filename}</span>
                            <div style={{ display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
                              <button className="att-chip-download" onClick={downloadFile} title="Download">⬇ Download</button>
                              <button
                                className="att-chip-toggle"
                                onClick={() => setExpandedPdfs(prev => {
                                  const next = new Set(prev);
                                  next.has(pdfKey) ? next.delete(pdfKey) : next.add(pdfKey);
                                  return next;
                                })}
                              >{isPdfExpanded ? '▲ Collapse' : '▼ Preview'}</button>
                            </div>
                          </div>
                          {isPdfExpanded && (
                            <iframe
                              src={`https://docs.google.com/viewer?url=${encodeURIComponent(att.url)}&embedded=true`}
                              title={att.filename}
                              className="att-inline-pdf-frame"
                            />
                          )}
                        </div>
                      );
                    }

                    // Office or other — download chip only
                    return (
                      <div key={att.attachmentId || i} className="att-inline-chip-bar">
                        <span>{isOffice ? '📊' : '📎'} {att.filename}</span>
                        <button className="att-chip-download" onClick={downloadFile} title="Download">⬇ Download</button>
                      </div>
                    );
                  })}
                </div>
                );
              })()}
            </div>

            <div className="email-detail-footer">
              {!selectedEmail.jobId && (
                <button className="btn btn-primary" onClick={extractJobFromEmail} disabled={extractingJob} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FiPlus /> {extractingJob ? 'Extracting…' : 'Convert to Job'}
                </button>
              )}
              {selectedEmail.jobId && (
                <span style={{ padding: '8px 12px', background: '#d4af37', color: 'white', borderRadius: 6, fontSize: 13, fontWeight: 500 }}>Linked to Job</span>
              )}
            </div>
          </div>
        ) : (
          <div className="email-detail-empty">
            <FiMail size={48} style={{ color: '#ddd' }} />
            <p style={{ color: '#aaa', marginTop: 12 }}>Select an email to read</p>
          </div>
        )}
      </div>

      {/* ── Connect Account Modal ── */}
      {showAccountModal && (
        <div className="modal-overlay" onClick={() => setShowAccountModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header"><h2><FiPlus /> Connect Email Account</h2><button className="icon-btn" onClick={() => setShowAccountModal(false)}>×</button></div>
            <div className="modal-body" style={{ padding: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Gmail', sub: 'Connect your Google account', color: '#ef4444', action: connectGmail },
                  { label: 'Microsoft / Outlook', sub: 'Connect your Microsoft account', color: '#0078d4', action: connectMicrosoft }
                ].map(p => (
                  <button key={p.label} onClick={() => { p.action(); setShowAccountModal(false); }}
                    style={{ padding: '16px 20px', background: 'white', border: '2px solid #e5e7eb', borderRadius: 12, cursor: 'pointer', fontSize: 15, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.2s' }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = '#d4af37'; e.currentTarget.style.background = '#fef9e7'; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = 'white'; }}
                  >
                    <FiMail size={24} style={{ color: p.color }} />
                    <div style={{ textAlign: 'left' }}><div style={{ fontWeight: 600 }}>{p.label}</div><div style={{ fontSize: 12, color: '#6b7280' }}>{p.sub}</div></div>
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-footer"><button className="btn-secondary" onClick={() => setShowAccountModal(false)}>Cancel</button></div>
          </div>
        </div>
      )}

      {/* ── Sync Modal ── */}
      {showSyncModal && (
        <div className="modal-overlay" onClick={() => setShowSyncModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header"><h2><FiRefreshCw /> Sync Email Accounts</h2><button className="icon-btn" onClick={() => setShowSyncModal(false)}>×</button></div>
            <div className="modal-body" style={{ padding: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {emailAccounts.map(account => (
                  <button key={account._id} onClick={() => { syncAccountEmails(account._id); setShowSyncModal(false); }} disabled={loading}
                    style={{ padding: '16px 20px', background: 'white', border: '2px solid #e5e7eb', borderRadius: 12, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 15, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 12, opacity: loading ? 0.6 : 1 }}
                    onMouseOver={e => { if (!loading) { e.currentTarget.style.borderColor = '#d4af37'; e.currentTarget.style.background = '#fef9e7'; } }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = 'white'; }}
                  >
                    <FiMail size={24} style={{ color: account.provider === 'gmail' ? '#ef4444' : '#0078d4' }} />
                    <div style={{ textAlign: 'left', flex: 1 }}><div style={{ fontWeight: 600 }}>{account.email}</div><div style={{ fontSize: 12, color: '#6b7280', textTransform: 'capitalize' }}>{account.provider}</div></div>
                    <FiRefreshCw size={18} style={{ color: '#3b82f6' }} />
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-footer"><button className="btn-secondary" onClick={() => setShowSyncModal(false)}>Cancel</button></div>
          </div>
        </div>
      )}

      {/* ── Compose Panel ── */}
      {showComposeModal && (
        <div ref={composePanelRef} className={`gmail-compose-panel ${composeMinimized ? 'minimized' : ''} ${composeExpanded ? 'expanded' : ''}`}
          style={composeExpanded ? {} : composePos ? { position: 'fixed', left: composePos.left, top: composePos.top, bottom: 'auto', right: 'auto' } : {}}>
          <div className="compose-header" onMouseDown={onComposeDragStart}>
            <span className="compose-title">New Message</span>
            <div className="compose-actions">
              <button className="compose-icon-btn" onClick={() => setComposeMinimized(!composeMinimized)}>{composeMinimized ? <FiMaximize2 size={14} /> : <FiMinus size={14} />}</button>
              <button className="compose-icon-btn" onClick={() => { setComposeExpanded(v => !v); setComposeMinimized(false); }}>{composeExpanded ? <FiMinimize2 size={14} /> : <FiMaximize2 size={14} />}</button>
              <button className="compose-icon-btn" onClick={() => setNotification({ isOpen: true, type: 'confirm', title: 'Discard Draft', message: 'Discard this draft?', onConfirm: () => { setShowComposeModal(false); setComposeData({ fromAccount: '', to: '', cc: '', subject: '', body: '' }); } })}><FiX size={16} /></button>
            </div>
          </div>
          {!composeMinimized && (
            <>
              <div className="compose-body">
                <div className="compose-field">
                  <select className="compose-select" value={composeData.fromAccount} onChange={e => setComposeData(d => ({ ...d, fromAccount: e.target.value }))}>
                    <option value="">From: Select account…</option>
                    {emailAccounts.map(a => <option key={a._id} value={a._id}>{a.email}</option>)}
                  </select>
                </div>
                <div className="compose-field"><input type="email" className="compose-input" value={composeData.to} onChange={e => setComposeData(d => ({ ...d, to: e.target.value }))} placeholder="To" /></div>
                <div className="compose-field"><input type="email" className="compose-input" value={composeData.cc} onChange={e => setComposeData(d => ({ ...d, cc: e.target.value }))} placeholder="Cc" /></div>
                <div className="compose-field"><input type="text" className="compose-input" value={composeData.subject} onChange={e => setComposeData(d => ({ ...d, subject: e.target.value }))} placeholder="Subject" /></div>
                <div className="compose-field compose-textarea-container">
                  <textarea className="compose-textarea" value={composeData.body} onChange={e => setComposeData(d => ({ ...d, body: e.target.value }))} placeholder="Write your message…" rows="10" />
                </div>
              </div>
              <div className="compose-footer">
                <button type="button" className="compose-send-btn" disabled={sendingEmail} onClick={async () => {
                  if (!composeData.fromAccount || !composeData.to || !composeData.subject || !composeData.body) {
                    setNotification({ isOpen: true, type: 'warning', title: 'Missing Fields', message: 'Please fill in all required fields.', onConfirm: null }); return;
                  }
                  setSendingEmail(true);
                  try {
                    await axios.post(`${API_URL}/emails/send`, { accountId: composeData.fromAccount, to: composeData.to, cc: composeData.cc, subject: composeData.subject, body: composeData.body });
                    setShowComposeModal(false); setComposeData({ fromAccount: '', to: '', cc: '', subject: '', body: '' });
                    setNotification({ isOpen: true, type: 'success', title: 'Sent', message: 'Email sent!', onConfirm: null });
                  } catch (error) {
                    setNotification({ isOpen: true, type: 'error', title: 'Send Failed', message: `Failed: ${error.response?.data?.details || error.message}`, onConfirm: null });
                  } finally { setSendingEmail(false); }
                }}>
                  <FiSend /> {sendingEmail ? 'Sending…' : 'Send'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Job Modal ── */}
      {showJobModal && extractedJobData && (
        <div className="modal-overlay" onClick={() => setShowJobModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
            <div className="modal-header"><h2><FiPlus /> Create Job from Email</h2><button className="icon-btn" onClick={() => setShowJobModal(false)}>×</button></div>
            <div className="modal-body" style={{ padding: 24 }}>
              <div style={{ display: 'grid', gap: 16 }}>
                {[
                  { label: 'Job Title *', key: 'title', type: 'text' },
                  { label: 'Customer Name *', key: 'customerName', type: 'text' },
                  { label: 'Customer Email *', key: 'customerEmail', type: 'email' },
                  { label: 'Customer Phone', key: 'customerPhone', type: 'tel' },
                  { label: 'Address', key: 'address', type: 'text' }
                ].map(({ label, key, type }) => (
                  <div key={key}>
                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: '#374151' }}>{label}</label>
                    <input type={type} value={extractedJobData[key] || ''} onChange={e => setExtractedJobData(d => ({ ...d, [key]: e.target.value }))} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }} />
                  </div>
                ))}
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: '#374151' }}>Description</label>
                  <textarea value={extractedJobData.description || ''} onChange={e => setExtractedJobData(d => ({ ...d, description: e.target.value }))} rows={3} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, fontFamily: 'inherit' }} />
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowJobModal(false)} style={{ padding: '10px 24px', background: 'white', border: '1px solid #d1d5db', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => createJobFromEmail(false)} style={{ padding: '10px 24px', background: '#6b7280', border: 'none', borderRadius: 8, color: 'white', fontWeight: 600, cursor: 'pointer' }}>Create Job</button>
              <button onClick={() => createJobFromEmail(true)} style={{ padding: '10px 24px', background: '#d4af37', border: 'none', borderRadius: 8, color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiPlus /> Create & Add to Calendar
              </button>
            </div>
          </div>
        </div>
      )}

      <NotificationModal isOpen={notification.isOpen} onClose={() => setNotification(n => ({ ...n, isOpen: false }))} type={notification.type} title={notification.title} message={notification.message} onConfirm={notification.onConfirm} />
    </div>
  );
}

export default Emails;
