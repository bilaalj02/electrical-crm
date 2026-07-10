import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiBriefcase, FiPlus, FiEdit, FiTrash2, FiDollarSign, FiClock, FiUser, FiFilter } from 'react-icons/fi';
import JobForm from './JobForm';
import JobDetail from './JobDetail';
import { showToast } from './Toast';
import NotificationModal from './NotificationModal';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function Jobs({ initialJobId, onConsumeInitial }) {
  const { isManager } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  // If Home asked us to open a specific job, fetch + open it on mount
  useEffect(() => {
    if (!initialJobId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get(`${API_URL}/jobs/${initialJobId}`);
        if (!cancelled) {
          setSelectedJob(res.data);
          if (onConsumeInitial) onConsumeInitial();
        }
      } catch (e) {
        console.error('Failed to open initial job', e);
      }
    })();
    return () => { cancelled = true; };
  }, [initialJobId]);
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [jobForExpenses, setJobForExpenses] = useState(null);

  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: '',
    sortBy: 'scheduledDate',
    sortOrder: 'desc'
  });

  // Fetch jobs
  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`
  });

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.priority) queryParams.append('priority', filters.priority);
      if (filters.search) queryParams.append('search', filters.search);
      queryParams.append('sortBy', filters.sortBy);
      queryParams.append('sortOrder', filters.sortOrder);

      const response = await axios.get(`${API_URL}/jobs?${queryParams.toString()}`, { headers: getAuthHeaders() });
      setJobs(response.data.jobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      showToast('Failed to load jobs', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch clients
  const fetchClients = async () => {
    try {
      const response = await axios.get(`${API_URL}/clients`, { headers: getAuthHeaders() });
      setClients(response.data.clients);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/jobs/stats`, { headers: getAuthHeaders() });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Delete job
  const deleteJob = async (jobId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Job',
      message: 'Are you sure you want to delete this job? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await axios.delete(`${API_URL}/jobs/${jobId}`, { headers: getAuthHeaders() });
          fetchJobs();
          fetchStats();
          setSelectedJob(null);
          showToast('Job deleted', 'success');
        } catch (error) {
          console.error('Error deleting job:', error);
          showToast(error.response?.data?.error || 'Error deleting job', 'error');
        }
      }
    });
  };

  useEffect(() => {
    fetchJobs();
    fetchClients();
    fetchStats();
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  const getStatusColor = (status) => {
    const colors = {
      quote: '#6b7280',
      approved: '#3b82f6',
      scheduled: '#8b5cf6',
      'in-progress': '#f59e0b',
      completed: '#10b981',
      invoiced: '#06b6d4',
      paid: '#22c55e',
      cancelled: '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444',
      urgent: '#dc2626'
    };
    return colors[priority] || '#6b7280';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="jobs-page">
      {/* Header */}
      <div className="page-header">
        <h1><FiBriefcase /> Jobs Management</h1>
        <button
          className="btn-primary"
          onClick={() => {
            setEditingJob(null);
            setShowJobForm(true);
          }}
        >
          <FiPlus /> New Job
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#eff6ff' }}>
              <FiBriefcase style={{ color: '#3b82f6' }} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Total Jobs</div>
              <div className="stat-value">{stats.total}</div>
            </div>
          </div>
          {isManager && (
            <>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#dcfce7' }}>
                  <FiDollarSign style={{ color: '#10b981' }} />
                </div>
                <div className="stat-content">
                  <div className="stat-label">Total Revenue</div>
                  <div className="stat-value">{formatCurrency(stats.totalRevenue)}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#fef3c7' }}>
                  <FiClock style={{ color: '#f59e0b' }} />
                </div>
                <div className="stat-content">
                  <div className="stat-label">Pending Revenue</div>
                  <div className="stat-value">{formatCurrency(stats.pendingRevenue)}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#fee2e2' }}>
                  <FiDollarSign style={{ color: '#ef4444' }} />
                </div>
                <div className="stat-content">
                  <div className="stat-label">Unpaid Invoices</div>
                  <div className="stat-value">{stats.unpaidInvoices}</div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="filter-box" style={{
        background: 'linear-gradient(135deg, #fef9e7 0%, #fef5d4 100%)',
        padding: '8px 12px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(212, 175, 55, 0.15)',
        border: '1px solid rgba(212, 175, 55, 0.3)',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: filtersExpanded ? '8px' : '0' }}>
          <h3 style={{ margin: 0, color: '#78350f', fontSize: '12px', fontWeight: '600' }}>
            <FiFilter style={{ marginRight: '6px' }} />
            Filters & Search
          </h3>
          <button
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            style={{ background: 'white', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '11px', fontWeight: '600', color: '#78350f' }}
          >
            {filtersExpanded ? '▲' : '▼'}
          </button>
        </div>
        {filtersExpanded && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: '#78350f', fontSize: '11px' }}>Search</label>
              <input
                type="text"
                placeholder="Search..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                style={{ width: '100%', padding: '6px 8px', border: 'none', borderRadius: '6px', fontSize: '12px', outline: 'none', background: 'white', color: '#333', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: '#78350f', fontSize: '11px' }}>Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                style={{ width: '100%', padding: '6px 8px', border: 'none', borderRadius: '6px', fontSize: '12px', outline: 'none', background: 'white', color: '#333', cursor: 'pointer' }}
              >
                <option value="">All</option>
                <option value="quote">Quote</option>
                <option value="approved">Approved</option>
                <option value="scheduled">Scheduled</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="invoiced">Invoiced</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: '#78350f', fontSize: '11px' }}>Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                style={{ width: '100%', padding: '6px 8px', border: 'none', borderRadius: '6px', fontSize: '12px', outline: 'none', background: 'white', color: '#333', cursor: 'pointer' }}
              >
                <option value="">All</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: '#78350f', fontSize: '11px' }}>Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                style={{ width: '100%', padding: '6px 8px', border: 'none', borderRadius: '6px', fontSize: '12px', outline: 'none', background: 'white', color: '#333', cursor: 'pointer' }}
              >
                <option value="scheduledDate">Scheduled Date</option>
                <option value="costs.finalTotal">Payment Amount</option>
                <option value="createdAt">Created Date</option>
                <option value="priority">Priority</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Jobs List */}
      <div className="jobs-grid">
        {loading && jobs.length === 0 ? (
          <div className="loading" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px' }}>Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="empty" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <FiBriefcase size={64} style={{ color: '#d1d5db' }} />
            <p style={{ fontSize: '18px', color: '#6b7280', margin: 0 }}>No jobs found</p>
            <button className="btn-primary" onClick={() => setShowJobForm(true)}>
              <FiPlus /> Create Your First Job
            </button>
          </div>
        ) : (
          jobs.map((job) => (
            <div
              key={job._id}
              className="job-card"
              onClick={() => setSelectedJob(job)}
            >
              <div className="job-card-header">
                <div>
                  <h3>{job.title}</h3>
                  <div className="job-number">{job.jobNumber}</div>
                </div>
                <div className="job-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="icon-btn"
                    onClick={() => {
                      setEditingJob(job);
                      setShowJobForm(true);
                    }}
                  >
                    <FiEdit />
                  </button>
                  <button
                    className="icon-btn delete"
                    onClick={() => deleteJob(job._id)}
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>

              <div className="job-client">
                <FiUser /> {job.client?.name || 'No client'}
              </div>

              <div className="job-meta">
                <span
                  className="badge"
                  style={{ background: getStatusColor(job.status) + '20', color: getStatusColor(job.status) }}
                >
                  {job.status}
                </span>
                <span
                  className="badge"
                  style={{ background: getPriorityColor(job.priority) + '20', color: getPriorityColor(job.priority) }}
                >
                  {job.priority} priority
                </span>
              </div>

              <div className="job-info">
                {isManager && (
                  <div className="info-row">
                    <span className="label">Amount:</span>
                    <span className="value">{formatCurrency(job.costs?.finalTotal)}</span>
                  </div>
                )}
                <div className="info-row">
                  <span className="label">Scheduled:</span>
                  <span className="value">{formatDate(job.scheduledDate)}</span>
                </div>
                {isManager && (
                  <div className="info-row">
                    <span className="label">Balance:</span>
                    <span className="value">{formatCurrency(job.payment?.balance)}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Job Form Modal */}
      {showJobForm && (
        <JobForm
          job={editingJob}
          clients={clients}
          onClose={() => {
            setShowJobForm(false);
            setEditingJob(null);
          }}
          onSave={() => {
            setShowJobForm(false);
            setEditingJob(null);
            fetchJobs();
            fetchStats();
          }}
        />
      )}

      {/* Job Detail Modal */}
      {selectedJob && !showJobForm && (
        <JobDetail
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onEdit={(job) => {
            setEditingJob(job);
            setShowJobForm(true);
            setSelectedJob(null);
          }}
          onDelete={(jobId) => {
            deleteJob(jobId);
          }}
          onUpdate={() => {
            fetchJobs();
            fetchStats();
          }}
          onEnterExpenses={(job) => {
            setJobForExpenses(job);
            setExpenseModalOpen(true);
            setSelectedJob(null);
          }}
        />
      )}

      {/* Expense Entry Modal */}
      <ExpenseEntryModal
        isOpen={expenseModalOpen}
        onClose={() => {
          setExpenseModalOpen(false);
          setJobForExpenses(null);
        }}
        job={jobForExpenses}
        onSave={() => {
          fetchJobs();
          fetchStats();
          setExpenseModalOpen(false);
          setJobForExpenses(null);
        }}
      />

      <NotificationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        type="confirm"
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}

export default Jobs;
