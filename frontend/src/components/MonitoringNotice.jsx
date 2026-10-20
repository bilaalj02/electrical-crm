import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiShield, FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import './MonitoringNotice.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Lets a non-developer user (the client, or anyone they invite) know that
// actions in the app are monitored for support/debugging purposes, and —
// just as importantly — makes it just as visible that messages and email
// content are never part of that. Shown once automatically; after that,
// always reachable again via the small persistent icon.
export default function MonitoringNotice() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showFromIcon, setShowFromIcon] = useState(false);

  useEffect(() => {
    if (user && !user.hasSeenMonitoringNotice) {
      setDismissed(false);
    } else {
      setDismissed(true);
    }
  }, [user]);

  // Developer accounts built this feature — the disclosure is for the
  // people being monitored, not the people monitoring.
  if (!user || user.isDeveloper) return null;

  const markSeen = async () => {
    try {
      await axios.patch(`${API_URL}/auth/monitoring-notice-seen`);
    } catch (_) {
      // Non-critical — worst case it re-shows next session, not a real failure.
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setExpanded(false);
    setShowFromIcon(false);
    markSeen();
  };

  const openFromIcon = () => {
    setShowFromIcon(true);
    setExpanded(true);
  };

  const visible = !dismissed || showFromIcon;

  if (!visible) {
    return (
      <button
        className="monitoring-reopen-icon"
        onClick={openFromIcon}
        title="About activity monitoring"
      >
        <FiShield />
      </button>
    );
  }

  return (
    <div className="monitoring-notice">
      <div className="monitoring-notice-bar">
        <FiShield className="monitoring-notice-icon" />
        <span className="monitoring-notice-text">
          For support and reliability, actions taken in this app are monitored and recorded.
        </span>
        <button
          className="monitoring-notice-link"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <>Less <FiChevronUp /></> : <>Learn more <FiChevronDown /></>}
        </button>
        <button
          className="monitoring-notice-close"
          onClick={handleDismiss}
          title="Dismiss"
        >
          <FiX />
        </button>
      </div>

      {expanded && (
        <div className="monitoring-notice-detail">
          <p>
            <strong>What's recorded:</strong> which pages and features get used, when, and
            whether the action succeeded, plus technical error reports when something breaks
            on the page — so problems can be traced back and fixed quickly.
          </p>
          <p>
            <strong>What's never recorded:</strong> the content of your messages, emails,
            jobs, or client records. Monitoring only sees that a feature was used, never
            what's inside it.
          </p>
          <button className="monitoring-notice-ack" onClick={handleDismiss}>
            Got it
          </button>
        </div>
      )}
    </div>
  );
}
