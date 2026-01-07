import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiBriefcase, FiPlus, FiEdit, FiTrash2, FiDollarSign, FiClock, FiUser } from 'react-icons/fi';
import JobForm from './JobForm';
import JobDetail from './JobDetail';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: '',
    sortBy: 'scheduledDate',
    sortOrder: 'desc'
  });

  // Fetch jobs
  const fetchJobs = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.priority) queryParams.append('priority', filters.priority);
      if (filters.search) queryParams.append('search', filters.search);
      queryParams.append('sortBy', filters.sortBy);
      queryParams.append('sortOrder', filters.sortOrder);

      const response = await axios.get(`${API_URL}/jobs?${queryParams.toString()}`);
      setJobs(response.data.jobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch clients
  const fetchClients = async () => {
    try {
      const response = await axios.get(`${API_URL}/clients`);
      setClients(response.data.clients);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/jobs/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Delete job
  const deleteJob = async (jobId) => {
    if (!confirm('Are you sure you want to delete this job?')) return;

    try {
      await axios.delete(`${API_URL}/jobs/${jobId}`);
      fetchJobs();
      fetchStats();
      setSelectedJob(null);
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('Error deleting job');
    }
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
        </div>
      )}

      {/* Filters */}
      <div className="filters">
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All Status</option>
          <option value="quote">Quote</option>
          <option value="approved">Approved</option>
          <option value="scheduled">Scheduled</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="invoiced">Invoiced</option>
          <option value="paid">Paid</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          value={filters.priority}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>

        <select
          value={filters.sortBy}
          onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
        >
          <option value="scheduledDate">Scheduled Date</option>
          <option value="costs.finalTotal">Payment Amount</option>
          <option value="createdAt">Created Date</option>
          <option value="priority">Priority</option>
        </select>

        <input
          type="text"
          placeholder="Search jobs..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="search-input"
        />
      </div>

      {/* Jobs List */}
      <div className="jobs-grid">
        {loading && jobs.length === 0 ? (
          <div className="loading">Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="empty">
            <FiBriefcase size={48} />
            <p>No jobs found</p>
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
                <div className="info-row">
                  <span className="label">Amount:</span>
                  <span className="value">{formatCurrency(job.costs?.finalTotal)}</span>
                </div>
                <div className="info-row">
                  <span className="label">Scheduled:</span>
                  <span className="value">{formatDate(job.scheduledDate)}</span>
                </div>
                <div className="info-row">
                  <span className="label">Balance:</span>
                  <span className="value">{formatCurrency(job.payment?.balance)}</span>
                </div>
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
        />
      )}
    </div>
  );
}

export default Jobs;
