import { useState, useEffect } from 'react';
import './App.css';
import { FiMail, FiBriefcase, FiUsers, FiMenu, FiX, FiHome, FiBarChart2, FiSend, FiCalendar, FiChevronDown, FiChevronUp, FiChevronLeft, FiChevronRight, FiPlus, FiUser, FiLogOut, FiSettings, FiMoon, FiSun, FiBell } from 'react-icons/fi';
import { useAuth } from './context/AuthContext';
import Login from './components/Login';
import Home from './components/Home';
import Emails from './components/Emails';
import Jobs from './components/Jobs';
import Clients from './components/Clients';
import Analytics from './components/Analytics';
import MarketingOutreach from './components/MarketingOutreach';
import EmailJobSummarizer from './components/EmailJobSummarizer';
import Calendar from './components/Calendar';
import mesLogo from './assets/mes-logo.png';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

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

          <button
            className={`sidebar-link ${currentPage === 'emails' ? 'active' : ''}`}
            onClick={() => setCurrentPage('emails')}
            title="Emails"
          >
            <FiMail className="sidebar-icon" />
            {sidebarOpen && <span>Emails</span>}
          </button>

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
            className={`sidebar-link ${currentPage === 'calendar' ? 'active' : ''}`}
            onClick={() => setCurrentPage('calendar')}
            title="Calendar"
          >
            <FiCalendar className="sidebar-icon" />
            {sidebarOpen && <span>Calendar</span>}
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
            title={user?.name || 'User menu'}
          >
            <div className="user-avatar">
              <FiUser />
            </div>
          </button>

          {userMenuOpen && (
            <div className="user-dropdown">
              <button className="user-dropdown-item" onClick={() => {
                setCurrentPage('settings');
                setUserMenuOpen(false);
              }}>
                <FiSettings /> {sidebarOpen && 'Settings'}
              </button>
              <button className="user-dropdown-item logout" onClick={() => {
                logout();
                setUserMenuOpen(false);
              }}>
                <FiLogOut /> {sidebarOpen && 'Logout'}
              </button>
            </div>
          )}

          <button
            className="dark-mode-toggle"
            onClick={toggleDarkMode}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px' }}>
              {darkMode ? (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ display: 'block' }}
                >
                  <circle cx="12" cy="12" r="5" stroke="#d4af37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"></circle>
                  <line x1="12" y1="1" x2="12" y2="3" stroke="#d4af37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"></line>
                  <line x1="12" y1="21" x2="12" y2="23" stroke="#d4af37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="#d4af37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="#d4af37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"></line>
                  <line x1="1" y1="12" x2="3" y2="12" stroke="#d4af37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"></line>
                  <line x1="21" y1="12" x2="23" y2="12" stroke="#d4af37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="#d4af37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="#d4af37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"></line>
                </svg>
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ display: 'block' }}
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="#d4af37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"></path>
                </svg>
              )}
            </span>
          </button>
        </div>
      </aside>

      {/* Sidebar Toggle Button - At edge between sidebar and main content */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        style={{
          position: 'fixed',
          left: sidebarOpen ? '240px' : '70px',
          top: '80px',
          background: '#d4af37',
          border: 'none',
          borderRadius: '50%',
          width: '24px',
          height: '24px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '14px',
          boxShadow: '0 2px 6px rgba(212, 175, 55, 0.4)',
          zIndex: 1000,
          transition: 'left 0.3s ease',
          padding: '0'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = '#b8941f';
          e.currentTarget.style.boxShadow = '0 3px 10px rgba(212, 175, 55, 0.6)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = '#d4af37';
          e.currentTarget.style.boxShadow = '0 2px 6px rgba(212, 175, 55, 0.4)';
        }}
      >
        {sidebarOpen ? <FiChevronLeft size={14} /> : <FiChevronRight size={14} />}
      </button>

      {/* Main Content Area */}
      <main className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="content-wrapper">
          {currentPage === 'home' && <Home />}
          {currentPage === 'emails' && <Emails />}
          {currentPage === 'jobs' && <Jobs />}
          {currentPage === 'clients' && <Clients />}
          {currentPage === 'calendar' && <Calendar />}
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
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px' }}>
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ display: 'block' }}
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
        </span>
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
