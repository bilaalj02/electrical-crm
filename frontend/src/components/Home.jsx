import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiDollarSign, FiClock, FiBriefcase, FiUsers, FiMail, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:5000/api';

function Home() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingRevenue: 0,
    activeJobs: 0,
    totalClients: 0,
    unreadEmails: 0,
    completedJobs: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllStats();
  }, []);

  const fetchAllStats = async () => {
    setLoading(true);
    try {
      const [jobsRes, clientsRes, emailsRes] = await Promise.all([
        axios.get(`${API_URL}/jobs/stats`),
        axios.get(`${API_URL}/clients/stats`),
        axios.get(`${API_URL}/emails/stats/summary`)
      ]);

      setStats({
        totalRevenue: jobsRes.data.totalRevenue || 0,
        pendingRevenue: jobsRes.data.pendingRevenue || 0,
        activeJobs: jobsRes.data.activeJobs || 0,
        completedJobs: jobsRes.data.completedJobs || 0,
        totalClients: clientsRes.data.total || 0,
        unreadEmails: emailsRes.data.unread || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="home-page">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="page-subtitle">Welcome {user?.name || 'User'}</p>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Total Revenue */}
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
          <div className="card-value">{formatCurrency(stats.totalRevenue)}</div>
          <div className="card-footer">
            <span>Revenue from all jobs</span>
          </div>
        </div>

        {/* Pending Payments */}
        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-icon orange">
              <FiClock />
            </div>
            <div className="card-title">
              <h3>Pending Payments</h3>
              <p>Outstanding</p>
            </div>
          </div>
          <div className="card-value">{formatCurrency(stats.pendingRevenue)}</div>
          <div className="card-footer">
            <span>Awaiting payment</span>
          </div>
        </div>

        {/* Active Jobs */}
        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-icon blue">
              <FiBriefcase />
            </div>
            <div className="card-title">
              <h3>Active Jobs</h3>
              <p>In Progress</p>
            </div>
          </div>
          <div className="card-value">{stats.activeJobs}</div>
          <div className="card-footer">
            <span>Currently active</span>
          </div>
        </div>

        {/* Total Clients */}
        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-icon purple">
              <FiUsers />
            </div>
            <div className="card-title">
              <h3>Total Clients</h3>
              <p>All Clients</p>
            </div>
          </div>
          <div className="card-value">{stats.totalClients}</div>
          <div className="card-footer">
            <span>In database</span>
          </div>
        </div>

        {/* Unread Emails */}
        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-icon teal">
              <FiMail />
            </div>
            <div className="card-title">
              <h3>Unread Emails</h3>
              <p>Inbox</p>
            </div>
          </div>
          <div className="card-value">{stats.unreadEmails}</div>
          <div className="card-footer">
            <span>Requires attention</span>
          </div>
        </div>

        {/* Completed Jobs */}
        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-icon green">
              <FiCheckCircle />
            </div>
            <div className="card-title">
              <h3>Completed Jobs</h3>
              <p>Finished</p>
            </div>
          </div>
          <div className="card-value">{stats.completedJobs}</div>
          <div className="card-footer">
            <span>Successfully completed</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
