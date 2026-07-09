import { useState, useEffect, lazy, Suspense } from 'react';
import './App.css';
import { FiMail, FiBriefcase, FiUsers, FiHome, FiBarChart2, FiCalendar, FiChevronLeft, FiChevronRight, FiUser, FiLogOut, FiSettings as FiSettingsIcon, FiBell, FiFolder, FiZap, FiSend, FiLink, FiHelpCircle } from 'react-icons/fi';

// TODO(Elvis): replace with the real support inbox/phone before relying on
// this for the Intuit compliance questionnaire — this is a placeholder.
const SUPPORT_EMAIL = 'support@example.com';
import { ToastContainer } from './components/Toast';
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
import Projects from './components/Projects';
import Settings from './components/Settings';
import Integrations from './components/Integrations';
const DiagramEditor = lazy(() => import('./components/DiagramEditor/DiagramEditor'));
import mesLogo from './assets/mes-logo.png';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// After an OAuth redirect (e.g. QuickBooks), land back on the page that
// initiated it instead of defaulting to Home, where the result would
// otherwise go unseen until the user manually navigates there.
const getInitialPage = () => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('integration') === 'quickbooks') return 'integrations';
  // Direct links to /integrations (e.g. the Connect/Disconnect URLs registered
  // with QuickBooks) should land on that page after login, not default to Home.
  if (window.location.pathname.replace(/\/+$/, '') === '/integrations') return 'integrations';
  return 'home';
};

function App() {
  const { isAuthenticated, user, logout, loading, isManager } = useAuth();
  const [currentPage, setCurrentPage] = useState(getInitialPage);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [emailDropdownOpen, setEmailDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', message: '' });
  const [summarizerOpen, setSummarizerOpen] = useState(false);
  const [potentialJobsCount, setPotentialJobsCount] = useState(0);
  // Deep-link navigation from Home shortcuts
  const [pendingJobId, setPendingJobId]       = useState(null);
  const [pendingClientId, setPendingClientId] = useState(null);

  const navigate = (page, options = {}) => {
    setCurrentPage(page);
    if (options.jobId)    setPendingJobId(options.jobId);
    if (options.clientId) setPendingClientId(options.clientId);
  };
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

          {/* Admin only pages */}
          {user?.role === 'admin' && (
            <button
              className={`sidebar-link ${currentPage === 'emails' ? 'active' : ''}`}
              onClick={() => setCurrentPage('emails')}
              title="Emails"
            >
              <FiMail className="sidebar-icon" />
              {sidebarOpen && <span>Emails</span>}
            </button>
          )}

          <button
            className={`sidebar-link ${currentPage === 'jobs' ? 'active' : ''}`}
            onClick={() => setCurrentPage('jobs')}
            title="Jobs"
          >
            <FiBriefcase className="sidebar-icon" />
            {sidebarOpen && <span>Jobs</span>}
          </button>

          {/* Admin only pages */}
          {user?.role === 'admin' && (
            <button
              className={`sidebar-link ${currentPage === 'clients' ? 'active' : ''}`}
              onClick={() => setCurrentPage('clients')}
              title="Clients"
            >
              <FiUsers className="sidebar-icon" />
              {sidebarOpen && <span>Clients</span>}
            </button>
          )}

          <button
            className={`sidebar-link ${currentPage === 'calendar' ? 'active' : ''}`}
            onClick={() => setCurrentPage('calendar')}
            title="Calendar"
          >
            <FiCalendar className="sidebar-icon" />
            {sidebarOpen && <span>Calendar</span>}
          </button>

          <button
            className={`sidebar-link ${currentPage === 'projects' ? 'active' : ''}`}
            onClick={() => setCurrentPage('projects')}
            title="Projects"
          >
            <FiFolder className="sidebar-icon" />
            {sidebarOpen && <span>Projects</span>}
          </button>

          <button
            className={`sidebar-link ${currentPage === 'diagrams' ? 'active' : ''}`}
            onClick={() => setCurrentPage('diagrams')}
            title="Diagrams"
          >
            <FiZap className="sidebar-icon" />
            {sidebarOpen && <span>Diagrams</span>}
          </button>

          {/* Admin only pages */}
          {user?.role === 'admin' && (
            <>
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
              <button
                className={`sidebar-link ${currentPage === 'integrations' ? 'active' : ''}`}
                onClick={() => setCurrentPage('integrations')}
                title="Integrations"
              >
                <FiLink className="sidebar-icon" />
                {sidebarOpen && <span>Integrations</span>}
              </button>
            </>
          )}
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
              {user?.role === 'admin' && (
                <button className="user-dropdown-item" onClick={() => {
                  setCurrentPage('settings');
                  setUserMenuOpen(false);
                }}>
                  <FiSettingsIcon /> {sidebarOpen && 'Settings'}
                </button>
              )}
              <a
                className="user-dropdown-item"
                href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('MES CRM Support Request')}`}
                onClick={() => setUserMenuOpen(false)}
                style={{ textDecoration: 'none' }}
              >
                <FiHelpCircle /> {sidebarOpen && 'Contact Support'}
              </a>
              <button className="user-dropdown-item logout" onClick={() => {
                logout();
                setUserMenuOpen(false);
              }}>
                <FiLogOut /> {sidebarOpen && 'Logout'}
              </button>
            </div>
          )}

        </div>
      </aside>

      {/* Sidebar Toggle Button - At edge between sidebar and main content */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        style={{
          position: 'fixed',
          left: sidebarOpen ? '188px' : '68px',
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
      <main className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}
        style={currentPage === 'diagrams' ? { display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', padding: 0, minHeight: 'unset' } : {}}>
        {currentPage === 'diagrams' ? (
          <Suspense fallback={<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#1a1a2e',color:'#c9a84c',fontSize:'18px'}}>Loading Diagram Editor…</div>}>
            <DiagramEditor />
          </Suspense>
        ) : (
          <div className="content-wrapper">
            {currentPage === 'home' && <Home onNavigate={navigate} />}
            {currentPage === 'emails' && user?.role === 'admin' && <Emails />}
            {currentPage === 'jobs' && (
              <Jobs
                initialJobId={pendingJobId}
                onConsumeInitial={() => setPendingJobId(null)}
              />
            )}
            {currentPage === 'clients' && user?.role === 'admin' && (
              <Clients
                initialClientId={pendingClientId}
                onConsumeInitial={() => setPendingClientId(null)}
              />
            )}
            {currentPage === 'calendar' && <Calendar />}
            {currentPage === 'projects' && <Projects />}
            {currentPage === 'analytics' && user?.role === 'admin' && <Analytics onNavigate={navigate} />}
            {currentPage === 'marketing' && user?.role === 'admin' && <MarketingOutreach />}
            {currentPage === 'integrations' && user?.role === 'admin' && (
              <Integrations onNavigate={navigate} />
            )}
            {currentPage === 'settings' && user?.role === 'admin' && <Settings />}
          </div>
        )}
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

      {/* Floating Job Opportunities Button — admin/manager only, hidden on diagrams page */}
      {isManager && currentPage !== 'diagrams' && <button
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
      </button>}

      {/* Email Job Summarizer Popup */}
      <EmailJobSummarizer
        isOpen={summarizerOpen}
        onClose={() => {
          setSummarizerOpen(false);
          fetchPotentialJobsCount();
        }}
      />

      <ToastContainer />
    </div>
  );
}

export default App;
