import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiBarChart2, FiTrendingUp, FiDollarSign, FiDownload, FiChevronDown, FiChevronUp, FiBriefcase, FiUsers, FiMail, FiLink, FiRefreshCw, FiCheckCircle, FiXCircle } from 'react-icons/fi';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

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
    emails: false,
    quickbooks: false
  });
  const [quickbooksConnected, setQuickbooksConnected] = useState(false);
  const [quickbooksLoading, setQuickbooksLoading] = useState(false);

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

  const connectQuickBooks = async () => {
    setQuickbooksLoading(true);
    try {
      // Placeholder for QuickBooks OAuth integration
      alert('QuickBooks integration coming soon!\n\nThis feature will allow you to:\n• Sync invoices automatically\n• Import expense data\n• Export revenue reports\n• Track payments in real-time\n\nAvailable as optional add-on: $30/month');

      // Simulate connection for demo purposes
      // In production, this would redirect to QuickBooks OAuth
      // const response = await axios.get(`${API_URL}/integrations/quickbooks/auth-url`);
      // window.location.href = response.data.authUrl;
    } catch (error) {
      console.error('Error connecting QuickBooks:', error);
      alert('Failed to connect QuickBooks. Please try again.');
    } finally {
      setQuickbooksLoading(false);
    }
  };

  const disconnectQuickBooks = async () => {
    if (window.confirm('Are you sure you want to disconnect QuickBooks?')) {
      setQuickbooksLoading(true);
      try {
        // Placeholder for disconnection
        // await axios.post(`${API_URL}/integrations/quickbooks/disconnect`);
        setQuickbooksConnected(false);
        alert('QuickBooks disconnected successfully');
      } catch (error) {
        console.error('Error disconnecting QuickBooks:', error);
        alert('Failed to disconnect QuickBooks');
      } finally {
        setQuickbooksLoading(false);
      }
    }
  };

  const syncQuickBooks = async () => {
    setQuickbooksLoading(true);
    try {
      // Placeholder for syncing data
      alert('Syncing with QuickBooks...\n\nThis will:\n• Import recent invoices\n• Update payment statuses\n• Sync expense data\n• Export new jobs\n\nSync complete!');
      // await axios.post(`${API_URL}/integrations/quickbooks/sync`);
    } catch (error) {
      console.error('Error syncing QuickBooks:', error);
      alert('Failed to sync with QuickBooks');
    } finally {
      setQuickbooksLoading(false);
    }
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

      {/* QuickBooks Integration - Collapsible */}
      <div className="analytics-section-collapsible">
        <div className="section-header" onClick={() => toggleSection('quickbooks')}>
          <h2><FiLink /> QuickBooks Integration</h2>
          {expandedSections.quickbooks ? <FiChevronUp /> : <FiChevronDown />}
        </div>
        {expandedSections.quickbooks && (
          <div className="section-content">
            <div className="quickbooks-integration">
              <div className="integration-header">
                <div className="integration-info">
                  <h3>Sync with QuickBooks Online</h3>
                  <p>Automatically sync invoices, expenses, and financial data with your QuickBooks account</p>
                </div>
                {quickbooksConnected && (
                  <div className="connection-status connected">
                    <FiCheckCircle /> Connected
                  </div>
                )}
                {!quickbooksConnected && (
                  <div className="connection-status disconnected">
                    <FiXCircle /> Not Connected
                  </div>
                )}
              </div>

              {quickbooksConnected && (
                <div className="qb-dashboard">
                  <div className="qb-stats-grid">
                    <div className="qb-stat-card">
                      <div className="qb-stat-label">Synced Invoices</div>
                      <div className="qb-stat-value">42</div>
                      <div className="qb-stat-detail">Last sync: 2 min ago</div>
                    </div>
                    <div className="qb-stat-card">
                      <div className="qb-stat-label">Unpaid Invoices</div>
                      <div className="qb-stat-value">$12,450</div>
                      <div className="qb-stat-detail">8 outstanding</div>
                    </div>
                    <div className="qb-stat-card">
                      <div className="qb-stat-label">Expenses Imported</div>
                      <div className="qb-stat-value">156</div>
                      <div className="qb-stat-detail">This month</div>
                    </div>
                    <div className="qb-stat-card">
                      <div className="qb-stat-label">Sync Status</div>
                      <div className="qb-stat-value success">Active</div>
                      <div className="qb-stat-detail">Auto-sync enabled</div>
                    </div>
                  </div>

                  <div className="qb-features-active">
                    <h4>Active Integrations:</h4>
                    <div className="qb-feature-list">
                      <div className="qb-feature-item active">
                        <FiCheckCircle className="feature-icon" />
                        <div className="feature-content">
                          <span className="feature-name">Invoice Sync</span>
                          <span className="feature-desc">Automatic two-way sync</span>
                        </div>
                      </div>
                      <div className="qb-feature-item active">
                        <FiCheckCircle className="feature-icon" />
                        <div className="feature-content">
                          <span className="feature-name">Expense Tracking</span>
                          <span className="feature-desc">Import from QB daily</span>
                        </div>
                      </div>
                      <div className="qb-feature-item active">
                        <FiCheckCircle className="feature-icon" />
                        <div className="feature-content">
                          <span className="feature-name">Customer Sync</span>
                          <span className="feature-desc">Bidirectional updates</span>
                        </div>
                      </div>
                      <div className="qb-feature-item active">
                        <FiCheckCircle className="feature-icon" />
                        <div className="feature-content">
                          <span className="feature-name">Payment Updates</span>
                          <span className="feature-desc">Real-time notifications</span>
                        </div>
                      </div>
                      <div className="qb-feature-item active">
                        <FiCheckCircle className="feature-icon" />
                        <div className="feature-content">
                          <span className="feature-name">P&L Reports</span>
                          <span className="feature-desc">View in CRM dashboard</span>
                        </div>
                      </div>
                      <div className="qb-feature-item active">
                        <FiCheckCircle className="feature-icon" />
                        <div className="feature-content">
                          <span className="feature-name">Accounts Receivable</span>
                          <span className="feature-desc">Track aging reports</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="qb-quick-actions">
                    <h4>Quick Actions:</h4>
                    <div className="qb-action-buttons">
                      <button className="qb-action-btn">
                        <FiDollarSign /> Create Invoice in QB
                      </button>
                      <button className="qb-action-btn">
                        <FiBarChart2 /> View P&L Report
                      </button>
                      <button className="qb-action-btn">
                        <FiTrendingUp /> Export Revenue Data
                      </button>
                      <button className="qb-action-btn">
                        <FiRefreshCw /> Force Sync Now
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {!quickbooksConnected && (
                <div className="integration-features">
                  <h4>What You'll Get:</h4>
                  <div className="integration-benefits">
                    <div className="benefit-section">
                      <h5>📊 Complete Financial Dashboard</h5>
                      <ul>
                        <li>View invoices, expenses, and payments without leaving CRM</li>
                        <li>Real-time P&L and cash flow reports</li>
                        <li>Accounts receivable tracking with aging reports</li>
                        <li>Tax-ready financial summaries</li>
                      </ul>
                    </div>

                    <div className="benefit-section">
                      <h5>🔄 Automatic Data Sync</h5>
                      <ul>
                        <li>Jobs automatically become invoices in QuickBooks</li>
                        <li>Customer data syncs bidirectionally</li>
                        <li>Payment status updates in real-time</li>
                        <li>Expense imports for accurate job costing</li>
                      </ul>
                    </div>

                    <div className="benefit-section">
                      <h5>💼 Work Entirely in CRM</h5>
                      <ul>
                        <li>Create and send invoices from CRM</li>
                        <li>Record payments and expenses</li>
                        <li>Generate financial reports</li>
                        <li>No need to open QuickBooks anymore</li>
                      </ul>
                    </div>

                    <div className="benefit-section">
                      <h5>🎯 Advanced Features</h5>
                      <ul>
                        <li>Automatic profit margin calculations with actual costs</li>
                        <li>Job costing with QB expense data</li>
                        <li>Budget vs actual tracking per project</li>
                        <li>Sales tax reporting and filing assistance</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="integration-actions">
                {!quickbooksConnected ? (
                  <button
                    className="btn-primary"
                    onClick={connectQuickBooks}
                    disabled={quickbooksLoading}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <FiLink />
                    {quickbooksLoading ? 'Connecting...' : 'Connect QuickBooks'}
                  </button>
                ) : (
                  <>
                    <button
                      className="btn-secondary"
                      onClick={syncQuickBooks}
                      disabled={quickbooksLoading}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <FiRefreshCw className={quickbooksLoading ? 'spinning' : ''} />
                      {quickbooksLoading ? 'Syncing...' : 'Sync Now'}
                    </button>
                    <button
                      className="btn-danger"
                      onClick={disconnectQuickBooks}
                      disabled={quickbooksLoading}
                    >
                      Disconnect
                    </button>
                  </>
                )}
              </div>

              <div className="integration-note">
                <p><strong>Note:</strong> QuickBooks integration is available as an optional add-on for $30/month. Contact support to enable this feature for your account.</p>
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
