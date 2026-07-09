import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  FiArrowLeft, FiCheckCircle, FiXCircle, FiLink, FiRefreshCw,
  FiUpload, FiFile, FiTrash2, FiMail
} from 'react-icons/fi';
import { showToast } from './Toast';
import NotificationModal from './NotificationModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

function IntegrationDetail({ provider, onBack }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [enabledTypes, setEnabledTypes] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null); // { clients: [], jobs: [], pricing: [] } with _checked flags
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/integrations/${provider}`, authHeaders());
      setDetail(response.data);
      setEnabledTypes(response.data.enabledDataTypes || []);
    } catch (error) {
      console.error('Error fetching integration detail:', error);
      showToast('Failed to load integration details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]);

  // ---------- Email providers (Gmail / Outlook) ----------
  const connectEmail = async () => {
    try {
      const endpoint = provider === 'gmail' ? 'gmail' : 'microsoft';
      const response = await axios.get(`${API_URL}/oauth/${endpoint}/auth-url`, authHeaders());
      window.location.href = response.data.authUrl;
    } catch (error) {
      console.error('Error connecting:', error);
      showToast('Failed to start connection. Please try again.', 'error');
    }
  };

  const disconnectEmailAccount = (accountId) => {
    setConfirmModal({
      isOpen: true,
      type: 'confirm',
      title: 'Disconnect account',
      message: 'Are you sure you want to disconnect this account?',
      onConfirm: async () => {
        try {
          await axios.delete(`${API_URL}/oauth/accounts/${accountId}`, authHeaders());
          showToast('Account disconnected', 'success');
          fetchDetail();
        } catch (error) {
          console.error('Error disconnecting:', error);
          showToast('Failed to disconnect account', 'error');
        }
      }
    });
  };

  // ---------- QuickBooks ----------
  const beginQuickBooksConnect = () => {
    setConfirmModal({
      isOpen: true,
      type: 'confirm',
      title: 'Connect QuickBooks',
      message: "You'll be redirected to Intuit to sign in and authorize access to your QuickBooks company. Continue?",
      onConfirm: async () => {
        try {
          const response = await axios.get(`${API_URL}/oauth/quickbooks/auth-url`, authHeaders());
          window.location.href = response.data.authUrl;
        } catch (error) {
          const message = error.response?.data?.error || 'Failed to start QuickBooks connection.';
          showToast(message, 'error', 7000);
        }
      }
    });
  };

  const toggleDataType = (key) => {
    setEnabledTypes((prev) =>
      prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key]
    );
  };

  const saveAndSync = async () => {
    setSaving(true);
    try {
      await axios.patch(
        `${API_URL}/integrations/${provider}/settings`,
        { enabledDataTypes: enabledTypes },
        authHeaders()
      );

      if (enabledTypes.length === 0) {
        showToast('Saved. Select at least one data type to run a sync.', 'info');
        setSaving(false);
        return;
      }

      setSaving(false);
      setSyncing(true);
      const response = await axios.post(`${API_URL}/integrations/${provider}/sync`, {}, authHeaders());
      const { stats } = response.data;

      if (stats.lastError) {
        showToast(`Sync finished with an issue: ${stats.lastError}`, 'warning', 8000);
      } else {
        showToast(
          `Sync complete — ${stats.clientsImported} client(s) and ${stats.jobsImported} job(s) imported.`,
          'success',
          6000
        );
      }
      fetchDetail();
    } catch (error) {
      const message = error.response?.data?.error || 'Sync failed. Please try again.';
      showToast(message, 'error', 7000);
    } finally {
      setSaving(false);
      setSyncing(false);
    }
  };

  const disconnectIntegration = () => {
    setConfirmModal({
      isOpen: true,
      type: 'confirm',
      title: `Disconnect ${detail?.name}`,
      message: `Are you sure you want to disconnect ${detail?.name}? You can reconnect any time.`,
      onConfirm: async () => {
        try {
          await axios.delete(`${API_URL}/integrations/${provider}`, authHeaders());
          showToast(`${detail?.name} disconnected`, 'success');
          fetchDetail();
        } catch (error) {
          console.error('Error disconnecting:', error);
          showToast('Failed to disconnect', 'error');
        }
      }
    });
  };

  // ---------- Document upload fallback ----------
  const handleFile = async (file) => {
    if (!file) return;
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (!allowed.includes(file.type)) {
      showToast('Only PDF and Word documents are supported.', 'error');
      return;
    }

    setUploading(true);
    setPreview(null);
    try {
      const formData = new FormData();
      formData.append('document', file);
      const response = await axios.post(
        `${API_URL}/integrations/${provider}/upload`,
        formData,
        { headers: { ...authHeaders().headers, 'Content-Type': 'multipart/form-data' } }
      );

      const raw = response.data.preview || {};
      setPreview({
        clients: (raw.clients || []).map((c) => ({ ...c, _checked: true })),
        jobs: (raw.jobs || []).map((j) => ({ ...j, _checked: true })),
        pricing: raw.pricing || []
      });
      showToast('Document processed — review the extracted data below.', 'success');
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to process document.';
      showToast(message, 'error', 8000);
    } finally {
      setUploading(false);
    }
  };

  const toggleRow = (section, index) => {
    setPreview((prev) => {
      const next = { ...prev, [section]: [...prev[section]] };
      next[section][index] = { ...next[section][index], _checked: !next[section][index]._checked };
      return next;
    });
  };

  const confirmImport = async () => {
    setImporting(true);
    try {
      const payload = {
        clients: preview.clients.filter((c) => c._checked),
        jobs: preview.jobs.filter((j) => j._checked),
        pricing: preview.pricing
      };
      const response = await axios.post(
        `${API_URL}/integrations/${provider}/confirm`,
        payload,
        authHeaders()
      );
      showToast(
        `Imported ${response.data.clientsCreated} client(s) and ${response.data.jobsCreated} job(s) into the CRM.`,
        'success',
        6000
      );
      setPreview(null);
    } catch (error) {
      const message = error.response?.data?.error || 'Import failed. Please try again.';
      showToast(message, 'error', 7000);
    } finally {
      setImporting(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  };

  if (loading || !detail) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="jobs-page">
      <div className="page-header">
        <button className="btn-secondary" onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FiArrowLeft /> Back to Integrations
        </button>
      </div>

      <div className="quickbooks-integration">
        <div className="integration-header">
          <div className="integration-info">
            <h3>{detail.name}</h3>
            <p>{detail.description}</p>
          </div>
          <div className={`connection-status ${detail.connected ? 'connected' : 'disconnected'}`}>
            {detail.connected ? <FiCheckCircle /> : <FiXCircle />}
            {detail.connected ? 'Connected' : 'Not Connected'}
          </div>
        </div>

        {/* ---------- Email providers ---------- */}
        {detail.category === 'email' && (
          <div style={{ marginTop: '1.5rem' }}>
            {detail.accounts.length > 0 && (
              <div className="qb-feature-list" style={{ marginBottom: '1.5rem' }}>
                {detail.accounts.map((acc) => (
                  <div key={acc.id} className="qb-feature-item active">
                    <FiMail className="feature-icon" />
                    <div className="feature-content" style={{ flex: 1 }}>
                      <span className="feature-name">{acc.email}</span>
                      <span className="feature-desc">
                        {acc.lastSyncedAt ? `Last synced ${new Date(acc.lastSyncedAt).toLocaleString()}` : 'Not synced yet'}
                      </span>
                    </div>
                    <button className="icon-btn delete" onClick={() => disconnectEmailAccount(acc.id)} title="Disconnect">
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button className="btn-primary" onClick={connectEmail} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiLink /> Connect Another {detail.name} Account
            </button>
          </div>
        )}

        {/* ---------- QuickBooks ---------- */}
        {provider === 'quickbooks' && (
          <>
            {!detail.connected ? (
              <div className="integration-actions" style={{ marginTop: '1.5rem' }}>
                <button
                  className="btn-primary"
                  onClick={beginQuickBooksConnect}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <FiLink /> Connect QuickBooks
                </button>
              </div>
            ) : (
              <div style={{ marginTop: '1.5rem' }}>
                <h4 style={{ marginBottom: '0.75rem' }}>What should sync?</h4>
                <div className="qb-feature-list">
                  {detail.dataTypes.map((dt) => (
                    <label key={dt.key} className="checkbox-label" style={{ padding: '0.75rem 1rem', background: '#f9fafb', borderRadius: '8px' }}>
                      <input
                        type="checkbox"
                        checked={enabledTypes.includes(dt.key)}
                        onChange={() => toggleDataType(dt.key)}
                      />
                      {dt.label}
                    </label>
                  ))}
                </div>

                {detail.syncStats && (
                  <div className="qb-stats-grid" style={{ marginTop: '1.25rem' }}>
                    <div className="qb-stat-card">
                      <div className="qb-stat-label">Clients Imported</div>
                      <div className="qb-stat-value">{detail.syncStats.clientsImported}</div>
                    </div>
                    <div className="qb-stat-card">
                      <div className="qb-stat-label">Jobs Imported</div>
                      <div className="qb-stat-value">{detail.syncStats.jobsImported}</div>
                    </div>
                    <div className="qb-stat-card">
                      <div className="qb-stat-label">Payments Updated</div>
                      <div className="qb-stat-value">{detail.syncStats.paymentsUpdated}</div>
                    </div>
                    <div className="qb-stat-card">
                      <div className="qb-stat-label">Last Sync</div>
                      <div className="qb-stat-value" style={{ fontSize: '1rem' }}>
                        {detail.lastSyncedAt ? new Date(detail.lastSyncedAt).toLocaleString() : 'Never'}
                      </div>
                    </div>
                  </div>
                )}

                <div className="integration-actions" style={{ marginTop: '1.5rem' }}>
                  <button
                    className="btn-primary"
                    onClick={saveAndSync}
                    disabled={saving || syncing}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <FiRefreshCw className={syncing ? 'spinning' : ''} />
                    {syncing ? 'Syncing...' : saving ? 'Saving...' : 'Save & Sync Now'}
                  </button>
                  <button className="btn-danger" onClick={disconnectIntegration} disabled={saving || syncing}>
                    Disconnect
                  </button>
                </div>
              </div>
            )}

            {/* ---------- Document upload fallback ---------- */}
            {detail.supportsDocumentUpload && (
              <div style={{ marginTop: '2.5rem', borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
                <h4>Or upload a document instead</h4>
                <p className="page-subtitle" style={{ marginBottom: '1rem' }}>
                  If a live sync isn't set up yet, upload a QuickBooks export (PDF or Word) and the CRM will read the client, job, and pricing information out of it for you to review before anything is added.
                </p>

                <div
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${dragActive ? '#d4af37' : '#d1d5db'}`,
                    borderRadius: '12px',
                    padding: '2.5rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: dragActive ? 'rgba(212, 175, 55, 0.05)' : '#f9fafb',
                    transition: 'all 0.2s'
                  }}
                >
                  <FiUpload size={32} style={{ color: '#d4af37', marginBottom: '0.75rem' }} />
                  <p style={{ margin: 0, fontWeight: 600 }}>
                    {uploading ? 'Processing document...' : 'Drag a PDF or Word document here, or click to browse'}
                  </p>
                  <p className="hint" style={{ marginTop: '0.25rem' }}>PDF, DOC, or DOCX — up to 20MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFile(e.target.files?.[0])}
                  />
                </div>

                {preview && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <h4>Review before importing</h4>
                    <p className="page-subtitle">Uncheck anything you don't want added to the CRM.</p>

                    {preview.clients.length > 0 && (
                      <>
                        <h5 style={{ margin: '1rem 0 0.5rem' }}>Clients ({preview.clients.length})</h5>
                        <table className="materials-table">
                          <thead>
                            <tr><th></th><th>Name</th><th>Email</th><th>Company</th><th>Confidence</th></tr>
                          </thead>
                          <tbody>
                            {preview.clients.map((c, i) => (
                              <tr key={i}>
                                <td><input type="checkbox" checked={c._checked} onChange={() => toggleRow('clients', i)} /></td>
                                <td>{c.name}</td>
                                <td>{c.email || <em style={{ color: '#ef4444' }}>missing — required</em>}</td>
                                <td>{c.company}</td>
                                <td>{Math.round((c.confidence || 0) * 100)}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </>
                    )}

                    {preview.jobs.length > 0 && (
                      <>
                        <h5 style={{ margin: '1rem 0 0.5rem' }}>Jobs ({preview.jobs.length})</h5>
                        <table className="materials-table">
                          <thead>
                            <tr><th></th><th>Title</th><th>Client</th><th>Status</th><th>Amount</th><th>Confidence</th></tr>
                          </thead>
                          <tbody>
                            {preview.jobs.map((j, i) => (
                              <tr key={i}>
                                <td><input type="checkbox" checked={j._checked} onChange={() => toggleRow('jobs', i)} /></td>
                                <td>{j.title}</td>
                                <td>{j.clientName}</td>
                                <td>{j.status}</td>
                                <td>${Number(j.amount || 0).toLocaleString()}</td>
                                <td>{Math.round((j.confidence || 0) * 100)}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </>
                    )}

                    {preview.clients.length === 0 && preview.jobs.length === 0 && (
                      <p className="hint">No client or job records could be found in this document.</p>
                    )}

                    <div className="integration-actions" style={{ marginTop: '1.25rem' }}>
                      <button className="btn-primary" onClick={confirmImport} disabled={importing}>
                        {importing ? 'Importing...' : 'Add Selected to CRM'}
                      </button>
                      <button className="btn-secondary" onClick={() => setPreview(null)}>
                        Discard
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <NotificationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        type={confirmModal.type}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        confirmText="Continue"
      />
    </div>
  );
}

export default IntegrationDetail;
