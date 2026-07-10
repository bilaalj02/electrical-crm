import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FiBriefcase, FiUsers, FiMail, FiCheckCircle,
  FiPlus, FiArrowRight, FiCalendar, FiSend, FiActivity
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function Home({ onNavigate }) {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalClients: 0,
    unreadEmails: 0,
    completedJobs: 0,
  });
  const [dashboard, setDashboard] = useState({
    recentJobs: [],
    recentClients: [],
    todayScheduled: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        const [jobsRes, clientsRes, emailsRes, dashRes] = await Promise.all([
          axios.get(`${API_URL}/jobs/stats`, { headers }),
          axios.get(`${API_URL}/clients/stats`, { headers }),
          axios.get(`${API_URL}/emails/stats/summary`, { headers }),
          axios.get(`${API_URL}/dashboard`, { headers }),
        ]);
        if (!mounted) return;
        setStats({
          activeJobs:     jobsRes.data.activeJobs     || 0,
          completedJobs:  jobsRes.data.completedJobs  || 0,
          totalClients:   clientsRes.data.total       || 0,
          unreadEmails:   emailsRes.data.unread       || 0,
        });
        setDashboard({
          recentJobs:     dashRes.data.recentJobs     || [],
          recentClients:  dashRes.data.recentClients  || [],
          todayScheduled: dashRes.data.todayScheduled || [],
        });
      } catch (e) {
        console.error('Dashboard load error:', e);
        if (mounted) {
          const { showToast } = await import('./Toast');
          showToast('Failed to load dashboard data', 'error');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const formatTime = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatDate = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="home-page">
        <div className="dashboard-loading">
          <div className="loading-pulse"></div>
          <p>Loading dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="page-header">
        <h1 className="hero-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back{user?.name ? `, ${user.name}` : ''}</p>
      </div>

      {/* ── KPI ROW — operational only, no financials ─────────────── */}
      <div className="dashboard-grid">
        <div className="dashboard-card" style={{ animationDelay: '0ms' }}>
          <div className="card-label">Active Jobs</div>
          <div className="card-value">{stats.activeJobs}</div>
          <div className="card-meta">In progress</div>
        </div>

        <div className="dashboard-card" style={{ animationDelay: '50ms' }}>
          <div className="card-label">Total Clients</div>
          <div className="card-value">{stats.totalClients}</div>
          <div className="card-meta">In database</div>
        </div>

        <div className="dashboard-card" style={{ animationDelay: '100ms' }}>
          <div className="card-label">Unread Emails</div>
          <div className="card-value">{stats.unreadEmails}</div>
          <div className="card-meta">Awaiting review</div>
        </div>

        <div className="dashboard-card" style={{ animationDelay: '150ms' }}>
          <div className="card-label">Completed Jobs</div>
          <div className="card-value">{stats.completedJobs}</div>
          <div className="card-meta">All time</div>
        </div>
      </div>

      {/* ── QUICK ACTIONS ───────────────────────────────────────── */}
      <div className="dashboard-section" style={{ animationDelay: '220ms' }}>
        <h2 className="section-title">Quick Actions</h2>
        <div className="quick-actions-grid">
          <button className="quick-action" onClick={() => onNavigate('jobs')}>
            <FiPlus className="quick-action-icon" />
            <span>New Job</span>
          </button>
          {isAdmin && (
            <button className="quick-action" onClick={() => onNavigate('clients')}>
              <FiUsers className="quick-action-icon" />
              <span>New Client</span>
            </button>
          )}
          {isAdmin && (
            <button className="quick-action" onClick={() => onNavigate('emails')}>
              <FiSend className="quick-action-icon" />
              <span>Compose Email</span>
            </button>
          )}
          <button className="quick-action" onClick={() => onNavigate('calendar')}>
            <FiCalendar className="quick-action-icon" />
            <span>Calendar</span>
          </button>
        </div>
      </div>

      {/* ── SHORTCUT BLOCKS ─────────────────────────────────────── */}
      <div className="shortcut-row">

        {/* RECENT JOBS */}
        <div className="shortcut-block" style={{ animationDelay: '280ms' }}>
          <div className="shortcut-header">
            <h2><FiBriefcase className="header-icon" /> Recent Jobs</h2>
            <button className="shortcut-see-all" onClick={() => onNavigate('jobs')}>
              View all <FiArrowRight />
            </button>
          </div>
          <div className="shortcut-list">
            {dashboard.recentJobs.length === 0 && <p className="empty">No jobs yet.</p>}
            {dashboard.recentJobs.map((j) => (
              <button
                key={j._id}
                className="shortcut-item"
                onClick={() => onNavigate('jobs', { jobId: j._id })}
              >
                <div className="shortcut-item-main">
                  <span className="shortcut-item-title">
                    {j.jobNumber ? `${j.jobNumber} · ` : ''}{j.title || 'Untitled job'}
                  </span>
                  <span className="shortcut-item-sub">
                    {(j.client?.companyName || j.client?.name) || 'No client'}
                  </span>
                </div>
                <span className="shortcut-item-status">{j.status}</span>
              </button>
            ))}
          </div>
        </div>

        {/* RECENT CLIENTS */}
        {isAdmin && (
          <div className="shortcut-block" style={{ animationDelay: '330ms' }}>
            <div className="shortcut-header">
              <h2><FiUsers className="header-icon" /> Recent Clients</h2>
              <button className="shortcut-see-all" onClick={() => onNavigate('clients')}>
                View all <FiArrowRight />
              </button>
            </div>
            <div className="shortcut-list">
              {dashboard.recentClients.length === 0 && <p className="empty">No clients yet.</p>}
              {dashboard.recentClients.map((c) => (
                <button
                  key={c._id}
                  className="shortcut-item"
                  onClick={() => onNavigate('clients', { clientId: c._id })}
                >
                  <div className="shortcut-item-main">
                    <span className="shortcut-item-title">
                      {c.companyName || c.name || 'Unnamed'}
                    </span>
                    <span className="shortcut-item-sub">
                      {c.email || c.phone || '—'}
                    </span>
                  </div>
                  <span className="shortcut-item-status">
                    {formatDate(c.createdAt)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TODAY'S SCHEDULED */}
        <div className="shortcut-block" style={{ animationDelay: '380ms' }}>
          <div className="shortcut-header">
            <h2><FiActivity className="header-icon" /> Today's Schedule</h2>
            <button className="shortcut-see-all" onClick={() => onNavigate('calendar')}>
              Calendar <FiArrowRight />
            </button>
          </div>
          <div className="shortcut-list">
            {dashboard.todayScheduled.length === 0 && (
              <p className="empty">Nothing scheduled today.</p>
            )}
            {dashboard.todayScheduled.map((item) => (
              item._type === 'event' ? (
                <div
                  key={item._id}
                  className="shortcut-item"
                  style={{ borderLeft: `3px solid ${item.color || '#d4af37'}`, cursor: 'default' }}
                >
                  <div className="shortcut-item-main">
                    <span className="shortcut-item-title">
                      {item.allDay ? 'All day' : formatTime(item.scheduledDate)} · {item.title || 'Untitled'}
                    </span>
                    <span className="shortcut-item-sub">
                      {item.location || 'Manual event'}
                    </span>
                  </div>
                  <span className="shortcut-item-status" style={{ background: '#fef9e7', color: '#92400e' }}>event</span>
                </div>
              ) : (
                <button
                  key={item._id}
                  className="shortcut-item"
                  onClick={() => onNavigate('jobs', { jobId: item._id })}
                >
                  <div className="shortcut-item-main">
                    <span className="shortcut-item-title">
                      {formatTime(item.scheduledDate)} · {item.title || 'Untitled'}
                    </span>
                    <span className="shortcut-item-sub">
                      {(item.client?.companyName || item.client?.name) || 'No client'}
                    </span>
                  </div>
                  <span className="shortcut-item-status">{item.status}</span>
                </button>
              )
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default Home;
