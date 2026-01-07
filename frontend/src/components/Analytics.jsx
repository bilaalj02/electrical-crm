import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiBarChart2, FiTrendingUp, FiDollarSign, FiDownload, FiChevronDown, FiChevronUp, FiBriefcase, FiUsers, FiMail } from 'react-icons/fi';

const API_URL = 'http://localhost:5000/api';

function Analytics() {
  const [stats, setStats] = useState({
    jobs: null,
    clients: null,
    emails: null
  });
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    revenue: true,
    jobs: false,
    clients: false,
    emails: false
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [jobsRes, clientsRes, emailsRes, allJobsRes] = await Promise.all([
        axios.get(`${API_URL}/jobs/stats`),
        axios.get(`${API_URL}/clients/stats`),
        axios.get(`${API_URL}/emails/stats/summary`),
        axios.get(`${API_URL}/jobs?limit=1000`) // Get all jobs for profitability calc
      ]);

      setStats({
        jobs: jobsRes.data,
        clients: clientsRes.data,
        emails: emailsRes.data
      });
      setJobs(allJobsRes.data.jobs || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleDownloadPDF = () => {
    alert('PDF download functionality will be implemented soon. This will generate a detailed analytics report.');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getPercentage = (value, total) => {
    if (!total) return 0;
    return Math.round((value / total) * 100);
  };

  // Calculate profitability metrics
  const calculateProfitability = () => {
    const jobsWithExpenses = jobs.filter(j =>
      j.actualExpenses?.finalTotal &&
      j.actualExpenses.finalTotal > 0 &&
      j.costs?.finalTotal &&
      j.costs.finalTotal > 0
    );

    if (jobsWithExpenses.length === 0) {
      return {
        count: 0,
        totalProfit: 0,
        avgProfitMargin: 0,
        totalRevenue: 0
      };
    }

    const totalProfit = jobsWithExpenses.reduce((sum, j) =>
      sum + (j.costs.finalTotal - j.actualExpenses.finalTotal), 0
    );

    const totalRevenue = jobsWithExpenses.reduce((sum, j) =>
      sum + j.costs.finalTotal, 0
    );

    const avgProfitMargin = (totalProfit / totalRevenue) * 100;

    return {
      count: jobsWithExpenses.length,
      totalProfit,
      avgProfitMargin,
      totalRevenue
    };
  };

  const profitability = calculateProfitability();

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="loading">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="page-header">
        <div>
          <h1><FiBarChart2 /> Business Analytics</h1>
          <p className="page-subtitle">Performance metrics and insights</p>
        </div>
        <button className="btn-download-pdf" onClick={handleDownloadPDF}>
          <FiDownload /> Download PDF Report
        </button>
      </div>

      {/* Revenue Analytics - Collapsible */}
      <div className="analytics-section-collapsible">
        <div className="section-header" onClick={() => toggleSection('revenue')}>
          <h2><FiDollarSign /> Revenue Analytics</h2>
          {expandedSections.revenue ? <FiChevronUp /> : <FiChevronDown />}
        </div>
        {expandedSections.revenue && (
          <div className="section-content">
            <div className="dashboard-grid">
              <div className="dashboard-card">
                <div className="card-header">
                  <div className="card-icon gold">
                    <FiDollarSign />
                  </div>
                  <div className="card-title">
                    <h3>Total Revenue</h3>
                    <p>All Time</p>
                  </div>
                </div>
                <div className="card-value">{formatCurrency(stats.jobs?.totalRevenue)}</div>
                <div className="card-footer">
                  <span className="trend positive">
                    <FiTrendingUp /> {stats.jobs?.total || 0} completed jobs
                  </span>
                </div>
              </div>

              <div className="dashboard-card">
                <div className="card-header">
                  <div className="card-icon orange">
                    <FiBarChart2 />
                  </div>
                  <div className="card-title">
                    <h3>Pending Revenue</h3>
                    <p>In Progress</p>
                  </div>
                </div>
                <div className="card-value">{formatCurrency(stats.jobs?.pendingRevenue)}</div>
                <div className="card-footer">
                  <span>{stats.jobs?.unpaidInvoices || 0} unpaid invoices</span>
                </div>
              </div>

              <div className={`dashboard-card ${profitability.avgProfitMargin >= 0 ? 'profit-positive' : 'profit-negative'}`}>
                <div className="card-header">
                  <div className={`card-icon ${profitability.avgProfitMargin >= 0 ? 'green' : 'red'}`}>
                    <FiTrendingUp />
                  </div>
                  <div className="card-title">
                    <h3>Avg Profit Margin</h3>
                    <p>From Completed Jobs</p>
                  </div>
                </div>
                <div className="card-value">{profitability.avgProfitMargin.toFixed(1)}%</div>
                <div className="card-footer">
                  <span className="trend">
                    {formatCurrency(profitability.totalProfit)} profit from {profitability.count} jobs
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Jobs Analytics - Collapsible */}
      <div className="analytics-section-collapsible">
        <div className="section-header" onClick={() => toggleSection('jobs')}>
          <h2><FiBriefcase /> Jobs Overview</h2>
          {expandedSections.jobs ? <FiChevronUp /> : <FiChevronDown />}
        </div>
        {expandedSections.jobs && (
          <div className="section-content">
            <div className="status-breakdown">
              <h3>Jobs by Status</h3>
              <div className="status-bar">
                <div
                  className="status-fill completed"
                  style={{ width: `${getPercentage(stats.jobs?.completedJobs, stats.jobs?.total)}%` }}
                  title={`Completed: ${stats.jobs?.completedJobs || 0}`}
                >
                  {getPercentage(stats.jobs?.completedJobs, stats.jobs?.total)}%
                </div>
              </div>
              <div className="status-legend">
                <span>Completed: {stats.jobs?.completedJobs || 0}</span>
                <span>Active: {stats.jobs?.activeJobs || 0}</span>
                <span>Total: {stats.jobs?.total || 0}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Clients Analytics - Collapsible */}
      <div className="analytics-section-collapsible">
        <div className="section-header" onClick={() => toggleSection('clients')}>
          <h2><FiUsers /> Client Metrics</h2>
          {expandedSections.clients ? <FiChevronUp /> : <FiChevronDown />}
        </div>
        {expandedSections.clients && (
          <div className="section-content">
            <div className="dashboard-grid">
              <div className="dashboard-card">
                <div className="card-header">
                  <div className="card-icon purple">
                    <FiUsers />
                  </div>
                  <div className="card-title">
                    <h3>Total Clients</h3>
                    <p>Database</p>
                  </div>
                </div>
                <div className="card-value">{stats.clients?.total || 0}</div>
                <div className="card-footer">
                  <span>{stats.clients?.active || 0} active clients</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Email Analytics - Collapsible */}
      <div className="analytics-section-collapsible">
        <div className="section-header" onClick={() => toggleSection('emails')}>
          <h2><FiMail /> Email Statistics</h2>
          {expandedSections.emails ? <FiChevronUp /> : <FiChevronDown />}
        </div>
        {expandedSections.emails && (
          <div className="section-content">
            <div className="dashboard-grid">
              <div className="dashboard-card">
                <div className="card-header">
                  <div className="card-icon teal">
                    <FiMail />
                  </div>
                  <div className="card-title">
                    <h3>Total Emails</h3>
                    <p>All Accounts</p>
                  </div>
                </div>
                <div className="card-value">{stats.emails?.total || 0}</div>
                <div className="card-footer">
                  <span>{stats.emails?.unread || 0} unread emails</span>
                </div>
              </div>

              <div className="dashboard-card">
                <div className="card-header">
                  <div className="card-icon blue">
                    <FiBriefcase />
                  </div>
                  <div className="card-title">
                    <h3>Work Related</h3>
                    <p>Business Emails</p>
                  </div>
                </div>
                <div className="card-value">{stats.emails?.workRelated || 0}</div>
                <div className="card-footer">
                  <span>{stats.emails?.notClassified || 0} not classified</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Analytics;
