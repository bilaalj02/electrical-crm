import { useState } from 'react';
import './App.css';
import { FiMail, FiBriefcase, FiUsers, FiMenu, FiX, FiHome, FiBarChart2, FiSend, FiChevronDown, FiChevronUp, FiPlus } from 'react-icons/fi';
import Home from './components/Home';
import Emails from './components/Emails';
import Jobs from './components/Jobs';
import Clients from './components/Clients';
import Analytics from './components/Analytics';
import MarketingOutreach from './components/MarketingOutreach';
import mesLogo from './assets/mes-logo.png';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [emailDropdownOpen, setEmailDropdownOpen] = useState(false);

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <img src={mesLogo} alt="MES Logo" className="sidebar-logo" />
          {sidebarOpen && <h2>MES Electrical</h2>}
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
            <button
              className={`sidebar-link ${currentPage === 'emails' ? 'active' : ''}`}
              onClick={() => setCurrentPage('emails')}
              title="Emails"
            >
              <FiMail className="sidebar-icon" />
              {sidebarOpen && <span>Emails</span>}
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
            </button>
            {sidebarOpen && emailDropdownOpen && (
              <div className="dropdown-menu">
                <button className="dropdown-item" onClick={() => alert('Add Gmail account functionality coming soon')}>
                  <FiPlus /> Add Gmail Account
                </button>
                <button className="dropdown-item" onClick={() => alert('Add Microsoft account functionality coming soon')}>
                  <FiPlus /> Add Microsoft Account
                </button>
                <button className="dropdown-item" onClick={() => alert('Add IMAP account functionality coming soon')}>
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

        <button
          className="sidebar-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? <FiX /> : <FiMenu />}
        </button>
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
    </div>
  );
}

export default App;
