import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FiBarChart2, FiAlertTriangle, FiActivity, FiRefreshCw, FiCheck, FiRotateCcw, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import ActivityLog from './ActivityLog';
import './UsageHealth.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Developer-only (rendered only for isDeveloper accounts; every endpoint is
// also checked server-side). Answers three questions: what does Marc use,
// what breaks, and what are we paying for that he doesn't use.
export default function UsageHealth() {
  const [tab, setTab] = useState('usage');
  const [openErrors, setOpenErrors] = useState(null);

  return (
    <div className="uh-page">
      <div className="uh-header">
        <div>
          <h1 className="uh-title">Usage &amp; Health</h1>
          <p className="uh-sub">What Marc uses, what breaks, and what it costs. Developers only.</p>
        </div>
      </div>
      <div className="uh-tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'usage'} className={tab === 'usage' ? 'on' : ''} onClick={() => setTab('usage')}>
          <FiBarChart2 /> Usage
        </button>
        <button role="tab" aria-selected={tab === 'errors'} className={tab === 'errors' ? 'on' : ''} onClick={() => setTab('errors')}>
          <FiAlertTriangle /> Errors {openErrors ? <span className="uh-count">{openErrors}</span> : null}
        </button>
        <button role="tab" aria-selected={tab === 'activity'} className={tab === 'activity' ? 'on' : ''} onClick={() => setTab('activity')}>
          <FiActivity /> Activity log
        </button>
      </div>
      {tab === 'usage' && <UsageTab onOpenErrors={setOpenErrors} goErrors={() => setTab('errors')} />}
      {tab === 'errors' && <ErrorsTab onOpenErrors={setOpenErrors} />}
      {tab === 'activity' && <ActivityLog />}
    </div>
  );
}

const SERVICE_SHORT = {
  railway: 'Railway', anthropic: 'Anthropic', openai: 'OpenAI', google: 'Google', microsoft: 'Microsoft',
  upstash: 'Upstash', cloudinary: 'Cloudinary', resend: 'Resend', quickbooks: 'QuickBooks',
};

const fmtDay = (d) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }) : 'Never');

function Trend({ now, before }) {
  if (!before && !now) return null;
  if (!before) return <span className="uh-trend up">new</span>;
  const pct = Math.round(((now - before) / before) * 100);
  if (pct === 0) return <span className="uh-trend">same</span>;
  return <span className={`uh-trend ${pct > 0 ? 'up' : 'down'}`}>{pct > 0 ? '+' : ''}{pct}%</span>;
}

function UsageTab({ onOpenErrors, goErrors }) {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await axios.get(`${API_URL}/monitoring/usage`, { params: { days } });
      setData(res.data);
      onOpenErrors(res.data.openErrors);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load usage');
    }
  }, [days, onOpenErrors]);

  useEffect(() => { load(); }, [load]);

  if (error) return <p className="uh-error">{error}</p>;
  if (!data) return <p className="uh-muted">Loading usage…</p>;

  const used = data.features.filter((f) => f.clientUses > 0);
  const max = Math.max(1, ...data.features.map((f) => f.clientUses));
  // Paid services whose features Marc didn't touch at all this period.
  const serviceUse = {};
  for (const f of data.features) {
    for (const s of f.services) {
      serviceUse[s] ||= { used: [], unused: [] };
      (f.clientUses + f.automaticRuns > 0 ? serviceUse[s].used : serviceUse[s].unused).push(f.name);
    }
  }

  return (
    <>
      <div className="uh-toolbar">
        <div className="uh-seg" role="group" aria-label="Period">
          {[7, 30, 90].map((d) => (
            <button key={d} className={days === d ? 'on' : ''} onClick={() => setDays(d)}>
              {d} days
            </button>
          ))}
        </div>
        <button className="uh-icon-btn" onClick={load} title="Refresh"><FiRefreshCw /></button>
      </div>

      <div className="uh-kpis">
        <div className="uh-kpi">
          <div className="uh-kpi-label">Features Marc used</div>
          <div className="uh-kpi-value">{used.length} <span>of {data.features.length}</span></div>
        </div>
        <div className="uh-kpi">
          <div className="uh-kpi-label">Not touched in {days} days</div>
          <div className="uh-kpi-value">{data.unused.length}</div>
        </div>
        {data.plan && (
          <div className="uh-kpi">
            <div className="uh-kpi-label">Marc's plan (invoice this)</div>
            <div className="uh-kpi-value">${(data.plan.monthlyCents / 100).toFixed(0)} <span>/mo + GST</span></div>
            <div className="uh-kpi-label" style={{ marginTop: 6, marginBottom: 0 }}>
              Essentials{data.plan.enabledAddons.length ? ` + ${data.plan.enabledAddons.length} add-on${data.plan.enabledAddons.length === 1 ? '' : 's'}` : ' only'}
            </div>
          </div>
        )}
        <button className={`uh-kpi uh-kpi-btn ${data.openErrors ? 'bad' : ''}`} onClick={goErrors}>
          <div className="uh-kpi-label">Open errors</div>
          <div className="uh-kpi-value">{data.openErrors}</div>
        </button>
      </div>

      <h2 className="uh-section">By feature <small>Marc's page opens, actions and records opened, last {days} days</small></h2>
      <div className="uh-table" role="table">
        <div className="uh-row uh-head" role="row">
          <span>Feature</span><span>Marc</span><span>vs prior</span><span>Last used by Marc</span><span>Automatic</span><span>Errors</span><span>Paid services</span>
        </div>
        {data.features.map((f) => (
          <div key={f.name} className="uh-row-wrap">
            <button className={`uh-row ${f.clientUses === 0 && f.automaticRuns === 0 ? 'idle' : ''}`} role="row" onClick={() => setOpen(open === f.name ? null : f.name)}>
              <span className="uh-name">
                {open === f.name ? <FiChevronDown /> : <FiChevronRight />} {f.name}
                {f.addon && <em className={`uh-mode ${f.realMode ? 'real' : ''}`}>{f.realMode ? 'Real' : 'Play'}</em>}
              </span>
              <span className="uh-bar-cell">
                <span className="uh-bar"><span style={{ width: `${(f.clientUses / max) * 100}%` }} /></span>
                <b>{f.clientUses}</b>
              </span>
              <span><Trend now={f.clientUses} before={f.previousClientUses} /></span>
              <span className="uh-muted">{fmtDay(f.lastUsedByClient)}</span>
              <span className="uh-muted">{f.automaticRuns || '–'}</span>
              <span className={f.errors ? 'uh-bad' : 'uh-muted'}>{f.errors || '–'}</span>
              <span className="uh-chips">{f.services.map((s) => <i key={s}>{SERVICE_SHORT[s] || s}</i>)}</span>
            </button>
            {open === f.name && (
              <div className="uh-detail">
                {f.topActions.length ? (
                  <ul>{f.topActions.map((a) => <li key={a.label}><span>{a.label}</span><b>{a.count}</b></li>)}</ul>
                ) : (
                  <p className="uh-muted">Marc didn't use this in the last {days} days.</p>
                )}
                {f.developerUses > 0 && <p className="uh-muted">Developers: {f.developerUses} uses (not counted above).</p>}
              </div>
            )}
          </div>
        ))}
      </div>

      <h2 className="uh-section">What we pay for <small>From the 2026 receipts. Edit in backend/src/services/monitoring.js</small></h2>
      <div className="uh-services">
        {Object.entries(data.services).map(([key, s]) => {
          const u = serviceUse[key] || { used: [], unused: [] };
          const idle = u.used.length === 0 && u.unused.length > 0;
          return (
            <div key={key} className={`uh-service ${idle ? 'idle' : ''}`}>
              <div className="uh-service-top">
                <b>{s.name}</b>
                <span>{s.monthly}</span>
              </div>
              {s.note && <p className="uh-muted">{s.note}</p>}
              <p className="uh-service-use">
                {u.used.length ? <>Used by: {u.used.join(', ')}</> : null}
                {u.unused.length ? <><br /><span className={idle ? 'uh-bad' : 'uh-muted'}>Not used this period: {u.unused.join(', ')}</span></> : null}
              </p>
            </div>
          );
        })}
      </div>
      <p className="uh-foot">
        Counts start from when monitoring went live. Usage is kept as daily totals only (never content), so trends build up month over month.
      </p>
    </>
  );
}

const ago = (iso) => {
  const s = Math.max(0, (Date.now() - new Date(iso)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
};

function ErrorsTab({ onOpenErrors }) {
  const [status, setStatus] = useState('open');
  const [errors, setErrors] = useState(null);
  const [fail, setFail] = useState('');
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    setFail('');
    try {
      const res = await axios.get(`${API_URL}/monitoring/errors`, { params: { status } });
      setErrors(res.data.errors);
      if (status === 'open') onOpenErrors(res.data.errors.length);
    } catch (err) {
      setFail(err.response?.data?.error || 'Could not load errors');
    }
  }, [status, onOpenErrors]);

  useEffect(() => { load(); }, [load]);

  const setResolved = async (id, resolved) => {
    try {
      await axios.patch(`${API_URL}/monitoring/errors/${id}`, { resolved });
      load();
    } catch (err) {
      setFail(err.response?.data?.error || 'Could not update');
    }
  };

  return (
    <>
      <div className="uh-toolbar">
        <div className="uh-seg" role="group" aria-label="Status">
          {[['open', 'Open'], ['resolved', 'Resolved'], ['all', 'All']].map(([v, l]) => (
            <button key={v} className={status === v ? 'on' : ''} onClick={() => setStatus(v)}>{l}</button>
          ))}
        </div>
        <button className="uh-icon-btn" onClick={load} title="Refresh"><FiRefreshCw /></button>
      </div>
      <p className="uh-muted uh-note">
        Each kind of error is emailed to contact@coldsolutions.ca when it first happens, then at most every 6 hours while it keeps happening.
        Mark it resolved once fixed; if it comes back, it reopens and emails again.
      </p>
      {fail && <p className="uh-error">{fail}</p>}
      {errors === null ? (
        <p className="uh-muted">Loading…</p>
      ) : errors.length === 0 ? (
        <div className="uh-empty">{status === 'open' ? 'No open errors. Nothing is broken that we know of.' : 'Nothing here.'}</div>
      ) : (
        <div className="uh-errors">
          {errors.map((e) => (
            <div key={e._id} className={`uh-err ${e.resolvedAt ? 'resolved' : ''}`}>
              <div className="uh-err-top">
                <span className={`uh-badge ${e.source}`}>{e.source === 'browser' ? "On Marc's screen" : 'Server'}</span>
                <span className="uh-muted">{e.where}</span>
                <span className="uh-err-count">{e.count}×</span>
              </div>
              <p className="uh-err-msg">{e.message}</p>
              <p className="uh-muted uh-err-meta">
                Last {ago(e.lastSeenAt)} · first {new Date(e.firstSeenAt).toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                {' · '}last hit by {e.lastWasDeveloper ? 'a developer' : e.lastUserRole ? `Marc's team (${e.lastUserRole})` : 'signed-out / background'}
                {e.statusCode ? ` · HTTP ${e.statusCode}` : ''} · {e.alertsSent} email{e.alertsSent === 1 ? '' : 's'} sent
              </p>
              <div className="uh-err-actions">
                {e.stackTop && (
                  <button className="uh-link" onClick={() => setExpanded(expanded === e._id ? null : e._id)}>
                    {expanded === e._id ? 'Hide details' : 'Show details'}
                  </button>
                )}
                {e.resolvedAt ? (
                  <button className="uh-btn" onClick={() => setResolved(e._id, false)}><FiRotateCcw /> Reopen</button>
                ) : (
                  <button className="uh-btn primary" onClick={() => setResolved(e._id, true)}><FiCheck /> Mark resolved</button>
                )}
              </div>
              {expanded === e._id && <pre className="uh-stack">{e.stackTop}{e.lastBrowser ? `\n\n${e.lastBrowser}` : ''}</pre>}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
