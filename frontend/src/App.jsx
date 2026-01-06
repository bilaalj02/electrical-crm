import { useState, useEffect } from 'react';
import './App.css';
import { FiMail, FiBriefcase, FiUsers, FiMenu, FiX, FiHome, FiBarChart2, FiSend, FiChevronDown, FiChevronUp, FiPlus, FiUser, FiLogOut, FiSettings, FiMoon, FiSun, FiBell } from 'react-icons/fi';
import { useAuth } from './context/AuthContext';
import Login from './components/Login';
import Home from './components/Home';
import Emails from './components/Emails';
import Jobs from './components/Jobs';
import Clients from './components/Clients';
import Analytics from './components/Analytics';
import MarketingOutreach from './components/MarketingOutreach';
import EmailJobSummarizer from './components/EmailJobSummarizer';
import mesLogo from './assets/mes-logo.png';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

function App() {
  const { isAuthenticated, user, logout, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [emailDropdownOpen, setEmailDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', message: '' });
  const [summarizerOpen, setSummarizerOpen] = useState(false);
  const [potentialJobsCount, setPotentialJobsCount] = useState(0);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  useEffect(() => {
    if (isAuthenticated) {
      // Fetch potential jobs count on load and every 5 minutes
      fetchPotentialJobsCount();
      const interval = setInterval(fetchPotentialJobsCount, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const fetchPotentialJobsCount = async () => {
    try {
      const response = await axios.get(`${API_URL}/emails?isWorkRelated=true&isRead=false`);
      setPotentialJobsCount(response.data.emails?.length || 0);
    } catch (error) {
      console.error('Error fetching potential jobs count:', error);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <img src={mesLogo} alt="MES Logo" className="loading-logo" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <img src={mesLogo} alt="MES Logo" className="sidebar-logo" />
        </div>

        <nav className="sidebar-nav">
          <button
            className={`sidebar-link ${currentPage === 'home' ? 'active' : ''}`}
            onClick={() => setCurrentPage('home')}
            title="Home"
          >
            <FiHome className="sidebar-icon" />
            {sidebarOpen && <span>Home</span>}
          </button>

          <div className="sidebar-dropdown">
            <div className="sidebar-link-wrapper">
              <button
                className={`sidebar-link ${currentPage === 'emails' ? 'active' : ''}`}
                onClick={() => setCurrentPage('emails')}
                title="Emails"
              >
                <FiMail className="sidebar-icon" />
                {sidebarOpen && <span>Emails</span>}
              </button>
              {sidebarOpen && (
                <button
                  className="dropdown-toggle"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEmailDropdownOpen(!emailDropdownOpen);
                  }}
                >
                  {emailDropdownOpen ? <FiChevronUp /> : <FiChevronDown />}
                </button>
              )}
            </div>
            {sidebarOpen && emailDropdownOpen && (
              <div className="dropdown-menu">
                <button className="dropdown-item" onClick={() => {
                  setModalContent({ title: 'Add Gmail Account', message: 'Gmail account integration coming soon! This feature will allow you to connect multiple Gmail accounts to your CRM.' });
                  setShowModal(true);
                }}>
                  <FiPlus /> Add Gmail Account
                </button>
                <button className="dropdown-item" onClick={() => {
                  setModalContent({ title: 'Add Microsoft Account', message: 'Microsoft account integration coming soon! Connect your Outlook and Office 365 accounts seamlessly.' });
                  setShowModal(true);
                }}>
                  <FiPlus /> Add Microsoft Account
                </button>
                <button className="dropdown-item" onClick={() => {
                  setModalContent({ title: 'Add IMAP Account', message: 'IMAP account integration coming soon! Connect any email provider that supports IMAP protocol.' });
                  setShowModal(true);
                }}>
                  <FiPlus /> Add IMAP Account
                </button>
              </div>
            )}
          </div>

          <button
            className={`sidebar-link ${currentPage === 'jobs' ? 'active' : ''}`}
            onClick={() => setCurrentPage('jobs')}
            title="Jobs"
          >
            <FiBriefcase className="sidebar-icon" />
            {sidebarOpen && <span>Jobs</span>}
          </button>
          <button
            className={`sidebar-link ${currentPage === 'clients' ? 'active' : ''}`}
            onClick={() => setCurrentPage('clients')}
            title="Clients"
          >
            <FiUsers className="sidebar-icon" />
            {sidebarOpen && <span>Clients</span>}
          </button>
          <button
            className={`sidebar-link ${currentPage === 'analytics' ? 'active' : ''}`}
            onClick={() => setCurrentPage('analytics')}
            title="Analytics"
          >
            <FiBarChart2 className="sidebar-icon" />
            {sidebarOpen && <span>Analytics</span>}
          </button>
          <button
            className={`sidebar-link ${currentPage === 'marketing' ? 'active' : ''}`}
            onClick={() => setCurrentPage('marketing')}
            title="Marketing"
          >
            <FiSend className="sidebar-icon" />
            {sidebarOpen && <span>Marketing</span>}
          </button>
        </nav>

        {/* User Menu */}
        <div className="sidebar-user-menu">
          <button
            className="user-menu-trigger"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
          >
            <div className="user-avatar">
              <FiUser />
            </div>
            {sidebarOpen && (
              <>
                <div className="user-info">
                  <div className="user-name">{user?.name}</div>
                  <div className="user-role">{user?.role}</div>
                </div>
                <FiChevronUp className={`user-menu-arrow ${userMenuOpen ? 'open' : ''}`} />
              </>
            )}
          </button>

          {userMenuOpen && sidebarOpen && (
            <div className="user-dropdown">
              <button className="user-dropdown-item" onClick={() => {
                setCurrentPage('settings');
                setUserMenuOpen(false);
              }}>
                <FiSettings /> Settings
              </button>
              <button className="user-dropdown-item logout" onClick={() => {
                logout();
                setUserMenuOpen(false);
              }}>
                <FiLogOut /> Logout
              </button>
            </div>
          )}
        </div>

        <div className="sidebar-footer">
          <button
            className="dark-mode-toggle"
            onClick={toggleDarkMode}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <FiSun className="sidebar-icon" /> : <FiMoon className="sidebar-icon" />}
            {sidebarOpen && <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="content-wrapper">
          {currentPage === 'home' && <Home />}
          {currentPage === 'emails' && <Emails />}
          {currentPage === 'jobs' && <Jobs />}
          {currentPage === 'clients' && <Clients />}
          {currentPage === 'analytics' && <Analytics />}
          {currentPage === 'marketing' && <MarketingOutreach />}
        </div>
      </main>

      {/* Custom Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <FiMail />
                {modalContent.title}
              </h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>{modalContent.message}</p>
            </div>
            <div className="modal-footer">
              <button className="modal-btn-primary" onClick={() => setShowModal(false)}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Job Opportunities Button */}
      <button
        className="floating-notification-btn"
        onClick={() => setSummarizerOpen(true)}
        title="View potential job opportunities"
      >
        <FiBell />
        {potentialJobsCount > 0 && (
          <span className="notification-badge">{potentialJobsCount}</span>
        )}
      </button>

      {/* Email Job Summarizer Popup */}
      <EmailJobSummarizer
        isOpen={summarizerOpen}
        onClose={() => {
          setSummarizerOpen(false);
          fetchPotentialJobsCount();
        }}
      />
    </div>
  );
}

export default App;
