import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiCalendar, FiChevronLeft, FiChevronRight, FiBriefcase, FiClock, FiDollarSign, FiRefreshCw } from 'react-icons/fi';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function Calendar() {
  const [jobs, setJobs] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/jobs`);
      setJobs(response.data.jobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  const getJobsForDate = (date) => {
    if (!date) return [];
    return jobs.filter(job => {
      if (!job.scheduledDate) return false;
      const jobDate = new Date(job.scheduledDate);
      return jobDate.toDateString() === date.toDateString();
    });
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  };

  const syncAllToCalendar = async () => {
    setSyncing(true);
    setSyncMessage('');
    try {
      const token = localStorage.getItem('token');

      // Get all scheduled jobs that aren't cancelled
      const scheduledJobs = jobs.filter(job =>
        job.scheduledDate && job.status !== 'cancelled'
      );

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

        // Refresh jobs to get updated calendar event IDs
        await fetchJobs();
      }
    } catch (error) {
      console.error('Error syncing to calendar:', error);
      setSyncMessage(
        error.response?.data?.message ||
        'Failed to sync. Make sure you have a Google account connected.'
      );
      setTimeout(() => setSyncMessage(''), 5000);
    } finally {
      setSyncing(false);
    }
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
        setSyncMessage('Job synced to Google Calendar!');
        setTimeout(() => setSyncMessage(''), 3000);
        await fetchJobs();

        // Open calendar event if available
        if (response.data.eventLink) {
          window.open(response.data.eventLink, '_blank');
        }
      }
    } catch (error) {
      console.error('Error syncing job:', error);
      setSyncMessage(error.response?.data?.message || 'Failed to sync job');
      setTimeout(() => setSyncMessage(''), 5000);
    }
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days = getDaysInMonth();

  return (
    <div className="calendar-page">
      <div className="page-header">
        <h1><FiCalendar /> Calendar</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {syncMessage && (
            <span style={{
              fontSize: '14px',
              color: syncMessage.includes('Failed') || syncMessage.includes('No') ? '#dc2626' : '#10b981',
              fontWeight: '500'
            }}>
              {syncMessage}
            </span>
          )}
          <button
            onClick={() => alert('Google Calendar integration coming soon! This will allow you to sync jobs to your Google Calendar.')}
            className="btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            title="Connect Google Calendar"
          >
            <FiCalendar />
            Connect Google
          </button>
          <button
            onClick={() => alert('Outlook Calendar integration coming soon! This will allow you to sync jobs to your Outlook Calendar.')}
            className="btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            title="Connect Outlook Calendar"
          >
            <FiCalendar />
            Connect Outlook
          </button>
          <button
            onClick={syncAllToCalendar}
            disabled={syncing}
            className="btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: syncing ? 0.7 : 1
            }}
          >
            <FiRefreshCw className={syncing ? 'spinning' : ''} />
            {syncing ? 'Syncing...' : 'Sync All to Calendar'}
          </button>
        </div>
      </div>

      <div className="filters-section" style={{ background: 'linear-gradient(135deg, #fef9e7 0%, #fef5d4 100%)', padding: '20px 24px', borderRadius: '16px', marginBottom: '24px', boxShadow: '0 4px 12px rgba(212, 175, 55, 0.15)', border: '2px solid rgba(212, 175, 55, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={previousMonth} style={{ background: 'white', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', color: '#333' }}>
          <FiChevronLeft size={20} />
        </button>
        <h2 style={{ margin: 0, color: '#78350f', fontSize: '24px', fontWeight: '600' }}>
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <button onClick={nextMonth} style={{ background: 'white', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', color: '#333' }}>
          <FiChevronRight size={20} />
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '12px' }}>
          {dayNames.map(day => (
            <div key={day} style={{ textAlign: 'center', fontWeight: '600', color: '#6b7280', padding: '8px', fontSize: '14px' }}>{day}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
          {days.map((date, index) => {
            const dayJobs = date ? getJobsForDate(date) : [];
            const isTodayDate = date && isToday(date);
            return (
              <div key={index} style={{ minHeight: '70px', background: date ? (isTodayDate ? '#fef9e7' : '#f9fafb') : 'transparent', border: isTodayDate ? '2px solid #d4af37' : '1px solid #e5e7eb', borderRadius: '8px', padding: '6px', position: 'relative' }}>
                {date && (
                  <>
                    <div style={{ fontSize: '14px', fontWeight: isTodayDate ? '700' : '500', color: isTodayDate ? '#d4af37' : '#374151', marginBottom: '4px' }}>
                      {date.getDate()}
                    </div>
                    {dayJobs.map((job) => (
                      <div key={job._id} onClick={() => setSelectedJob(job)} style={{ background: getStatusColor(job.status) + '20', borderLeft: `3px solid ${getStatusColor(job.status)}`, padding: '4px 6px', marginBottom: '4px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={`${job.title} - ${job.client?.name || 'No client'}`}>
                        {job.title}
                      </div>
                    ))}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {selectedJob && (
        <div className="modal-overlay" onClick={() => setSelectedJob(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2><FiBriefcase /> {selectedJob.title}</h2>
              <button className="icon-btn" onClick={() => setSelectedJob(null)}>×</button>
            </div>
            <div className="modal-body" style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Job Number</div>
                <div style={{ fontSize: '16px', fontWeight: '500' }}>{selectedJob.jobNumber}</div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Client</div>
                <div style={{ fontSize: '16px', fontWeight: '500' }}>{selectedJob.client?.name || 'No client'}</div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Status</div>
                <span style={{ display: 'inline-block', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', background: getStatusColor(selectedJob.status) + '20', color: getStatusColor(selectedJob.status) }}>
                  {selectedJob.status}
                </span>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}><FiClock style={{ display: 'inline', marginRight: '4px' }} />Scheduled Date</div>
                <div style={{ fontSize: '16px', fontWeight: '500' }}>
                  {selectedJob.scheduledDate ? new Date(selectedJob.scheduledDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Not scheduled'}
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}><FiDollarSign style={{ display: 'inline', marginRight: '4px' }} />Total Amount</div>
                <div style={{ fontSize: '20px', fontWeight: '600', color: '#10b981' }}>
                  {formatCurrency(selectedJob.costs?.finalTotal)}
                </div>
              </div>
              {selectedJob.description && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Description</div>
                  <div style={{ fontSize: '14px', lineHeight: '1.6' }}>{selectedJob.description}</div>
                </div>
              )}

              {/* Calendar Sync Status */}
              <div style={{
                padding: '12px',
                background: selectedJob.calendarEventId ? '#d1fae5' : '#fef3c7',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiCalendar style={{ color: selectedJob.calendarEventId ? '#10b981' : '#f59e0b' }} />
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    {selectedJob.calendarEventId ? 'Synced to Google Calendar' : 'Not synced to calendar'}
                  </span>
                </div>
                {!selectedJob.calendarEventId && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      syncJobToCalendar(selectedJob._id);
                    }}
                    style={{
                      padding: '6px 12px',
                      background: '#d4af37',
                      border: 'none',
                      borderRadius: '6px',
                      color: 'white',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <FiCalendar /> Sync Now
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
    </div>
  );
}

export default Calendar;
