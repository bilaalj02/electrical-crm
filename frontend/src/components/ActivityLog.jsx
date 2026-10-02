import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FiActivity, FiAlertCircle, FiLock, FiUnlock, FiFilter, FiRefreshCw } from 'react-icons/fi';
import './ActivityLog.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const SCOPE_OPTIONS = [
  { value: '', label: 'Everyone' },
  { value: 'client', label: "Marc's actions" },
  { value: 'developer', label: 'Developer actions' },
];

export default function ActivityLog() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [scope, setScope] = useState('');
  const [onlyErrors, setOnlyErrors] = useState(false);
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 50 };
      if (scope) params.scope = scope;
      if (onlyErrors) params.onlyErrors = 'true';
      if (category) params.category = category;
      const res = await axios.get(`${API_URL}/activity-logs`, { params });
      setEntries(res.data.entries);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load activity log');
    } finally {
      setLoading(false);
    }
  }, [page, scope, onlyErrors, category]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const keepForever = async (id) => {
    await axios.patch(`${API_URL}/activity-logs/${id}/keep-forever`);
    fetchEntries();
  };

  const restoreExpiry = async (id) => {
    await axios.patch(`${API_URL}/activity-logs/${id}/restore-expiry`);
    fetchEntries();
  };

  return (
    <div className="activity-log-page">
      <div className="page-header">
        <h1><FiActivity /> Activity Log</h1>
      </div>
      <p className="page-subtitle">
        Who did what, when, and whether it succeeded — for support and debugging only.
        Message, email, and record content is never part of this. Entries auto-expire after
        30 days unless marked to keep.
      </p>

      <div className="activity-filters">
        <div className="filter-group">
          <FiFilter />
          <select value={scope} onChange={e => { setScope(e.target.value); setPage(1); }}>
            {SCOPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}>
            <option value="">All activity</option>
            <option value="action">Actions</option>
            <option value="login_failure">Failed logins</option>
          </select>
        </div>
        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={onlyErrors}
            onChange={e => { setOnlyErrors(e.target.checked); setPage(1); }}
          />
          Errors only
        </label>
        <button className="filter-refresh" onClick={fetchEntries} title="Refresh">
          <FiRefreshCw />
        </button>
      </div>

      {error && <div className="activity-error">{error}</div>}

      <div className="activity-table-wrapper">
        <table className="activity-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Who</th>
              <th>Action</th>
              <th>Status</th>
              <th>IP</th>
              <th>Retention</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="activity-empty">Loading…</td></tr>
            )}
            {!loading && entries.length === 0 && (
              <tr><td colSpan={6} className="activity-empty">No activity in this range.</td></tr>
            )}
            {!loading && entries.map(entry => {
              const isError = entry.statusCode >= 400;
              const who = entry.category === 'login_failure'
                ? (entry.attemptedEmail || 'Unknown')
                : (entry.userId?.name || entry.userId?.email || 'Unknown');
              return (
                <tr key={entry._id} className={isError ? 'activity-row-error' : ''}>
                  <td>{new Date(entry.createdAt).toLocaleString()}</td>
                  <td>
                    {who}
                    {entry.isDeveloperAction && <span className="activity-badge-dev">dev</span>}
                  </td>
                  <td>
                    {entry.actionLabel}
                    {entry.failureReason && (
                      <span className="activity-failure-reason"> ({entry.failureReason.replace('_', ' ')})</span>
                    )}
                  </td>
                  <td>
                    <span className={`activity-status ${isError ? 'status-error' : 'status-ok'}`}>
                      {isError && <FiAlertCircle />} {entry.statusCode}
                    </span>
                  </td>
                  <td className="activity-ip">{entry.ip || '—'}</td>
                  <td>
                    {entry.expiresAt ? (
                      <button className="activity-retention-btn" onClick={() => keepForever(entry._id)} title="Keep forever">
                        <FiUnlock /> Expires {new Date(entry.expiresAt).toLocaleDateString()}
                      </button>
                    ) : (
                      <button className="activity-retention-btn kept" onClick={() => restoreExpiry(entry._id)} title="Revert to 30-day expiry">
                        <FiLock /> Kept forever
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="activity-pagination">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
