import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiCalendar, FiChevronLeft, FiChevronRight, FiBriefcase, FiClock, FiDollarSign, FiRefreshCw, FiCheckCircle, FiX, FiPlus, FiMapPin } from 'react-icons/fi';
import NotificationModal from './NotificationModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const defaultEventForm = {
  title: '',
  description: '',
  location: '',
  date: '',
  startTime: '',
  endTime: '',
  allDay: false,
  color: '#d4af37',
};

function Calendar() {
  const [jobs, setJobs] = useState([]);
  const [manualEvents, setManualEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [connectedAccounts, setConnectedAccounts] = useState({ google: null, microsoft: null });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  // Add Event modal
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [eventForm, setEventForm] = useState(defaultEventForm);
  const [savingEvent, setSavingEvent] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/jobs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJobs(response.data.jobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchManualEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/calendar-events`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setManualEvents(response.data.events || []);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
    }
  };

  const fetchConnectedAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/oauth/accounts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const accounts = response.data.emailAccounts || [];
      setConnectedAccounts({
        google: accounts.find(a => a.provider === 'gmail') || null,
        microsoft: accounts.find(a => a.provider === 'microsoft') || null
      });
    } catch (error) {
      console.error('Error fetching connected accounts:', error);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchManualEvents();
    fetchConnectedAccounts();
    const onFocus = () => fetchConnectedAccounts();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const previousMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
    for (let day = 1; day <= daysInMonth; day++) days.push(new Date(year, month, day));
    return days;
  };

  const getJobsForDate = (date) => {
    if (!date) return [];
    return jobs.filter(job => {
      if (!job.scheduledDate) return false;
      return new Date(job.scheduledDate).toDateString() === date.toDateString();
    });
  };

  const getEventsForDate = (date) => {
    if (!date) return [];
    return manualEvents.filter(ev => new Date(ev.startDate).toDateString() === date.toDateString());
  };

  const isToday = (date) => {
    if (!date) return false;
    return date.toDateString() === new Date().toDateString();
  };

  const getStatusColor = (status) => {
    const colors = {
      quote: '#6b7280', approved: '#3b82f6', scheduled: '#8b5cf6',
      'in-progress': '#f59e0b', completed: '#10b981', invoiced: '#06b6d4',
      paid: '#22c55e', cancelled: '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 4000);
  };

  const syncAllToCalendar = async () => {
    if (!connectedAccounts.google && !connectedAccounts.microsoft) {
      showToast('Please connect a Google or Outlook calendar first.', 'error');
      return;
    }
    setSyncing(true);
    setSyncMessage('');
    try {
      const token = localStorage.getItem('token');
      const scheduledJobs = jobs.filter(job => job.scheduledDate && job.status !== 'cancelled');
      if (scheduledJobs.length === 0) {
        setSyncMessage('No scheduled jobs to sync');
        setTimeout(() => setSyncMessage(''), 3000);
        setSyncing(false);
        return;
      }
      const jobIds = scheduledJobs.map(job => job._id);
      const response = await axios.post(
        `${API_URL}/automation/bulk-sync-calendar`,
        { jobIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        const successCount = response.data.results.success.length;
        const failCount = response.data.results.failed.length;
        setSyncMessage(
          `Synced ${successCount} jobs to Google Calendar` +
          (failCount > 0 ? ` (${failCount} failed)` : '')
        );
        setTimeout(() => setSyncMessage(''), 5000);
        await fetchJobs();
      }
    } catch (error) {
      console.error('Error syncing to calendar:', error);
      setSyncMessage(error.response?.data?.message || 'Failed to sync. Make sure you have a Google account connected.');
      setTimeout(() => setSyncMessage(''), 5000);
    } finally {
      setSyncing(false);
    }
  };

  const connectGoogleCalendar = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/oauth/google/auth-url`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.authUrl) {
        window.open(response.data.authUrl, '_blank', 'width=600,height=700');
        showToast('Please complete the Google Calendar authorization in the new window', 'info');
      }
    } catch (error) {
      showToast('Failed to connect Google Calendar. Please try again.', 'error');
    }
  };

  const connectOutlookCalendar = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/oauth/microsoft/auth-url`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.authUrl) {
        window.open(response.data.authUrl, '_blank', 'width=600,height=700');
        showToast('Please complete the Outlook Calendar authorization in the new window', 'info');
      }
    } catch (error) {
      showToast('Failed to connect Outlook Calendar. Please try again.', 'error');
    }
  };

  const disconnectAccount = (accountId, label) => {
    setConfirmModal({
      isOpen: true,
      title: `Disconnect ${label}`,
      message: `Are you sure you want to disconnect your ${label} account? You can reconnect it at any time.`,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.delete(`${API_URL}/oauth/accounts/${accountId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          showToast(`${label} account disconnected`, 'success');
          fetchConnectedAccounts();
        } catch (error) {
          showToast('Failed to disconnect account', 'error');
        }
      }
    });
  };

  const syncJobToCalendar = async (jobId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/automation/sync-to-calendar/${jobId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        showToast(response.data.message, 'success');
        await fetchJobs();
        fetchManualEvents();
        if (response.data.eventLink) window.open(response.data.eventLink, '_blank');
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to sync job to calendar', 'error');
    }
  };

  const handleSaveEvent = async () => {
    if (!eventForm.title.trim()) { showToast('Event title is required', 'error'); return; }
    if (!eventForm.date) { showToast('Date is required', 'error'); return; }
    if (!eventForm.allDay && !eventForm.startTime) { showToast('Start time is required', 'error'); return; }
    if (!eventForm.allDay && !eventForm.endTime) { showToast('End time is required', 'error'); return; }

    setSavingEvent(true);
    try {
      const token = localStorage.getItem('token');

      let startDate, endDate;
      if (eventForm.allDay) {
        startDate = new Date(eventForm.date + 'T00:00:00');
        endDate = new Date(eventForm.date + 'T23:59:59');
      } else {
        startDate = new Date(eventForm.date + 'T' + eventForm.startTime);
        endDate = new Date(eventForm.date + 'T' + eventForm.endTime);
        if (endDate <= startDate) {
          showToast('End time must be after start time', 'error');
          setSavingEvent(false);
          return;
        }
      }

      await axios.post(
        `${API_URL}/calendar-events`,
        {
          title: eventForm.title,
          description: eventForm.description,
          location: eventForm.location,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          allDay: eventForm.allDay,
          color: eventForm.color,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showToast('Event added to calendar!', 'success');
      setShowAddEvent(false);
      setEventForm(defaultEventForm);
      fetchManualEvents();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to save event', 'error');
    } finally {
      setSavingEvent(false);
    }
  };

  const handleDeleteEvent = (eventId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Event',
      message: 'Are you sure you want to delete this event?',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.delete(`${API_URL}/calendar-events/${eventId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          showToast('Event deleted', 'success');
          setSelectedEvent(null);
          fetchManualEvents();
        } catch (error) {
          showToast('Failed to delete event', 'error');
        }
      }
    });
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days = getDaysInMonth();

  return (
    <div className="calendar-page">
      <div className="page-header">
        <h1><FiCalendar /> Calendar</h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {syncMessage && (
            <span style={{ fontSize: '13px', color: syncMessage.includes('Failed') || syncMessage.includes('No') ? '#dc2626' : '#10b981', fontWeight: '500' }}>
              {syncMessage}
            </span>
          )}

          {/* Add Event button */}
          <button
            onClick={() => setShowAddEvent(true)}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <FiPlus /> Add Event
          </button>

          {/* Google connection */}
          {connectedAccounts.google ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#10b981', fontWeight: '600', background: '#d1fae5', padding: '6px 12px', borderRadius: '8px', border: '1px solid #10b981' }}>
              <FiCheckCircle size={14} />
              Google Connected
              <button onClick={() => disconnectAccount(connectedAccounts.google._id, 'Google')} title="Disconnect Google" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center', padding: '0', marginLeft: '2px' }}>
                <FiX size={13} />
              </button>
            </span>
          ) : (
            <button onClick={connectGoogleCalendar} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiCalendar size={14} /> Connect Google
            </button>
          )}

          {/* Outlook connection */}
          {connectedAccounts.microsoft ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#10b981', fontWeight: '600', background: '#d1fae5', padding: '6px 12px', borderRadius: '8px', border: '1px solid #10b981' }}>
              <FiCheckCircle size={14} />
              Outlook Connected
              <button onClick={() => disconnectAccount(connectedAccounts.microsoft._id, 'Outlook')} title="Disconnect Outlook" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center', padding: '0', marginLeft: '2px' }}>
                <FiX size={13} />
              </button>
            </span>
          ) : (
            <button onClick={connectOutlookCalendar} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiCalendar size={14} /> Connect Outlook
            </button>
          )}

          <button
            onClick={syncAllToCalendar}
            disabled={syncing}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: syncing ? 0.7 : 1 }}
          >
            <FiRefreshCw className={syncing ? 'spinning' : ''} size={14} />
            {syncing ? 'Syncing...' : 'Sync All'}
          </button>
        </div>
      </div>

      {/* Month navigation — compact height */}
      <div style={{
        background: 'linear-gradient(135deg, #fef9e7 0%, #fef5d4 100%)',
        padding: '10px 20px',
        borderRadius: '12px',
        marginBottom: '16px',
        boxShadow: '0 2px 8px rgba(212, 175, 55, 0.15)',
        border: '2px solid rgba(212, 175, 55, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px'
      }}>
        <button onClick={previousMonth} style={{ background: 'white', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', color: '#333' }}>
          <FiChevronLeft size={18} />
        </button>
        <h2 style={{ margin: 0, color: '#78350f', fontSize: '20px', fontWeight: '600' }}>
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <button onClick={nextMonth} style={{ background: 'white', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', color: '#333' }}>
          <FiChevronRight size={18} />
        </button>
      </div>

      {/* Calendar grid */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginBottom: '8px' }}>
          {dayNames.map(day => (
            <div key={day} style={{ textAlign: 'center', fontWeight: '600', color: '#6b7280', padding: '6px', fontSize: '13px' }}>{day}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
          {days.map((date, index) => {
            const dayJobs = date ? getJobsForDate(date) : [];
            const dayEvents = date ? getEventsForDate(date) : [];
            const isTodayDate = date && isToday(date);
            return (
              <div key={index} style={{
                minHeight: '80px',
                background: date ? (isTodayDate ? '#fef9e7' : '#f9fafb') : 'transparent',
                border: isTodayDate ? '2px solid #d4af37' : '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '6px',
              }}>
                {date && (
                  <>
                    <div style={{ fontSize: '13px', fontWeight: isTodayDate ? '700' : '500', color: isTodayDate ? '#d4af37' : '#374151', marginBottom: '4px' }}>
                      {date.getDate()}
                    </div>
                    {dayJobs.map((job) => (
                      <div
                        key={job._id}
                        onClick={() => setSelectedJob(job)}
                        style={{ background: getStatusColor(job.status) + '20', borderLeft: `3px solid ${getStatusColor(job.status)}`, padding: '3px 5px', marginBottom: '3px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        title={`${job.title} - ${job.client?.name || 'No client'}`}
                      >
                        {job.title}
                      </div>
                    ))}
                    {dayEvents.map((ev) => (
                      <div
                        key={ev._id}
                        onClick={() => setSelectedEvent(ev)}
                        style={{ background: (ev.color || '#d4af37') + '25', borderLeft: `3px solid ${ev.color || '#d4af37'}`, padding: '3px 5px', marginBottom: '3px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        title={ev.title}
                      >
                        {ev.allDay ? '' : new Date(ev.startDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) + ' '}{ev.title}
                      </div>
                    ))}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', marginTop: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#8b5cf6', display: 'inline-block' }} /> Jobs
        </span>
        <span style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#d4af37', display: 'inline-block' }} /> Manual events
        </span>
      </div>

      {/* Toast */}
      {toast.show && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', background: toast.type === 'error' ? '#fee2e2' : toast.type === 'success' ? '#d1fae5' : '#dbeafe', border: `2px solid ${toast.type === 'error' ? '#dc2626' : toast.type === 'success' ? '#10b981' : '#3b82f6'}`, borderRadius: '12px', padding: '14px 18px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 10000, maxWidth: '380px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151', flex: 1 }}>{toast.message}</span>
          <button onClick={() => setToast({ show: false, message: '', type: '' })} style={{ background: 'none', border: 'none', fontSize: '18px', color: '#6b7280', cursor: 'pointer' }}>×</button>
        </div>
      )}

      {/* Job detail modal */}
      {selectedJob && (
        <div className="modal-overlay" onClick={() => setSelectedJob(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 style={{ color: '#111827' }}><FiBriefcase /> {selectedJob.title}</h2>
              <button className="icon-btn" onClick={() => setSelectedJob(null)}>×</button>
            </div>
            <div className="modal-body" style={{ padding: '24px' }}>
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '3px' }}>Job Number</div>
                <div style={{ fontSize: '15px', fontWeight: '500' }}>{selectedJob.jobNumber}</div>
              </div>
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '3px' }}>Client</div>
                <div style={{ fontSize: '15px', fontWeight: '500' }}>{selectedJob.client?.name || 'No client'}</div>
              </div>
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '3px' }}>Status</div>
                <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', background: getStatusColor(selectedJob.status) + '20', color: getStatusColor(selectedJob.status) }}>
                  {selectedJob.status}
                </span>
              </div>
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '3px' }}><FiClock style={{ display: 'inline', marginRight: '4px' }} />Scheduled Date & Time</div>
                <div style={{ fontSize: '15px', fontWeight: '500' }}>
                  {selectedJob.scheduledDate
                    ? (() => {
                        const d = new Date(selectedJob.scheduledDate);
                        const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0;
                        return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) +
                          (hasTime ? ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '');
                      })()
                    : 'Not scheduled'}
                </div>
              </div>
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '3px' }}><FiDollarSign style={{ display: 'inline', marginRight: '4px' }} />Total Amount</div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#10b981' }}>{formatCurrency(selectedJob.costs?.finalTotal)}</div>
              </div>
              {selectedJob.description && (
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '3px' }}>Description</div>
                  <div style={{ fontSize: '13px', lineHeight: '1.6' }}>{selectedJob.description}</div>
                </div>
              )}
              <div style={{ padding: '12px', background: selectedJob.calendarEventId ? '#d1fae5' : '#fef3c7', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiCalendar style={{ color: selectedJob.calendarEventId ? '#10b981' : '#f59e0b' }} />
                  <span style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                    {selectedJob.calendarEventId ? 'Synced to Google Calendar' : 'Not synced to calendar'}
                  </span>
                </div>
                {!selectedJob.calendarEventId && (
                  <button
                    onClick={(e) => { e.stopPropagation(); syncJobToCalendar(selectedJob._id); }}
                    style={{ padding: '5px 10px', background: '#d4af37', border: 'none', borderRadius: '6px', color: 'white', fontSize: '12px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <FiCalendar size={12} /> Sync Now
                  </button>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setSelectedJob(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Manual event detail modal */}
      {selectedEvent && (
        <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <h2 style={{ color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: selectedEvent.color || '#d4af37', display: 'inline-block', flexShrink: 0 }} />
                {selectedEvent.title}
              </h2>
              <button className="icon-btn" onClick={() => setSelectedEvent(null)}>×</button>
            </div>
            <div className="modal-body" style={{ padding: '24px' }}>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '3px' }}><FiClock style={{ display: 'inline', marginRight: '4px' }} />Time</div>
                <div style={{ fontSize: '15px', fontWeight: '500' }}>
                  {selectedEvent.allDay
                    ? `${new Date(selectedEvent.startDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} (All day)`
                    : `${new Date(selectedEvent.startDate).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} – ${new Date(selectedEvent.endDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
                  }
                </div>
              </div>
              {selectedEvent.location && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '3px' }}><FiMapPin style={{ display: 'inline', marginRight: '4px' }} />Location</div>
                  <div style={{ fontSize: '14px' }}>{selectedEvent.location}</div>
                </div>
              )}
              {selectedEvent.description && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '3px' }}>Notes</div>
                  <div style={{ fontSize: '13px', lineHeight: '1.6' }}>{selectedEvent.description}</div>
                </div>
              )}
              {selectedEvent.googleEventLink && (
                <a href={selectedEvent.googleEventLink} target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: '#3b82f6' }}>
                  View in Google Calendar
                </a>
              )}
            </div>
            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              <button
                onClick={() => handleDeleteEvent(selectedEvent._id)}
                style={{ padding: '8px 16px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#dc2626', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
              >
                Delete Event
              </button>
              <button className="btn-secondary" onClick={() => setSelectedEvent(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Event modal */}
      {showAddEvent && (
        <div className="modal-overlay" onClick={() => setShowAddEvent(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h2 style={{ color: '#111827' }}><FiPlus /> Add Calendar Event</h2>
              <button className="icon-btn" onClick={() => setShowAddEvent(false)}>×</button>
            </div>
            <div className="modal-body" style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Event Title *</label>
                <input
                  type="text"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  placeholder="e.g. Site inspection, Client meeting..."
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Date *</label>
                <input
                  type="date"
                  value={eventForm.date}
                  onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                  onClick={(e) => e.target.showPicker?.()}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none', cursor: 'pointer' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', color: '#374151', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={eventForm.allDay}
                    onChange={(e) => setEventForm({ ...eventForm, allDay: e.target.checked })}
                    style={{ width: '16px', height: '16px' }}
                  />
                  All day event
                </label>
              </div>

              {!eventForm.allDay && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Start Time *</label>
                    <input
                      type="time"
                      value={eventForm.startTime}
                      onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
                      onClick={(e) => e.target.showPicker?.()}
                      style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none', cursor: 'pointer' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>End Time *</label>
                    <input
                      type="time"
                      value={eventForm.endTime}
                      onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
                      onClick={(e) => e.target.showPicker?.()}
                      style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none', cursor: 'pointer' }}
                    />
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Location</label>
                <input
                  type="text"
                  value={eventForm.location}
                  onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                  placeholder="Optional address or place"
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Notes</label>
                <textarea
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  placeholder="Optional notes..."
                  rows={3}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none', resize: 'vertical' }}
                />
              </div>

              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Color</label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {['#d4af37', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#f59e0b', '#06b6d4', '#374151'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEventForm({ ...eventForm, color: c })}
                      style={{
                        width: '28px', height: '28px', borderRadius: '50%', background: c, border: eventForm.color === c ? '3px solid #111827' : '2px solid transparent',
                        cursor: 'pointer', outline: 'none', boxSizing: 'border-box'
                      }}
                    />
                  ))}
                </div>
              </div>

              {connectedAccounts.google && (
                <p style={{ fontSize: '12px', color: '#10b981', marginTop: '12px', margin: '12px 0 0' }}>
                  <FiCheckCircle style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                  This event will also be synced to your Google Calendar.
                </p>
              )}
            </div>
            <div className="modal-footer" style={{ justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn-secondary" onClick={() => { setShowAddEvent(false); setEventForm(defaultEventForm); }}>Cancel</button>
              <button
                onClick={handleSaveEvent}
                disabled={savingEvent}
                className="btn-primary"
                style={{ opacity: savingEvent ? 0.7 : 1 }}
              >
                {savingEvent ? 'Saving...' : 'Add Event'}
              </button>
            </div>
          </div>
        </div>
      )}

      <NotificationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        type="confirm"
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        confirmText="Confirm"
        cancelText="Cancel"
      />
    </div>
  );
}

export default Calendar;
