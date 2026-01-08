import { useState } from 'react';
import axios from 'axios';
import { FiX, FiEdit, FiTrash2, FiDollarSign, FiCalendar, FiAlertCircle } from 'react-icons/fi';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

function JobDetail({ job, onClose, onEdit, onDelete, onEnterExpenses }) {
  const [syncingCalendar, setSyncingCalendar] = useState(false);
  const [calendarMessage, setCalendarMessage] = useState('');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const syncToCalendar = async () => {
    if (!job.scheduledDate) {
      setCalendarMessage('Please set a scheduled date first');
      setTimeout(() => setCalendarMessage(''), 3000);
      return;
    }

    setSyncingCalendar(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/automation/sync-to-calendar/${job._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setCalendarMessage('Synced to Google Calendar!');
        setTimeout(() => setCalendarMessage(''), 3000);

        // Open the calendar event in a new tab
        if (response.data.eventLink) {
          window.open(response.data.eventLink, '_blank');
        }
      }
    } catch (error) {
      console.error('Error syncing to calendar:', error);
      setCalendarMessage(error.response?.data?.message || 'Failed to sync. Make sure you have a Google account connected.');
      setTimeout(() => setCalendarMessage(''), 5000);
    } finally {
      setSyncingCalendar(false);
    }
  };

  const removeFromCalendar = async () => {
    setSyncingCalendar(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `${API_URL}/automation/remove-from-calendar/${job._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setCalendarMessage('Removed from Google Calendar');
        setTimeout(() => setCalendarMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error removing from calendar:', error);
      setCalendarMessage(error.response?.data?.message || 'Failed to remove from calendar');
      setTimeout(() => setCalendarMessage(''), 5000);
    } finally {
      setSyncingCalendar(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{job.title}</h2>
            <div className="job-number">{job.jobNumber}</div>
          </div>
          <div className="header-actions">
            <button className="icon-btn" onClick={() => onEdit(job)}>
              <FiEdit />
            </button>
            <button className="icon-btn delete" onClick={() => onDelete(job._id)}>
              <FiTrash2 />
            </button>
            <button className="icon-btn" onClick={onClose}>
              <FiX />
            </button>
          </div>
        </div>

        <div className="modal-body">
          <section className="detail-section">
            <h3>Client Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="label">Name:</span>
                <span className="value">{job.client?.name}</span>
              </div>
              <div className="detail-item">
                <span className="label">Email:</span>
                <span className="value">{job.client?.email}</span>
              </div>
              <div className="detail-item">
                <span className="label">Phone:</span>
                <span className="value">{job.client?.phone || 'N/A'}</span>
              </div>
              {job.client?.address && (
                <div className="detail-item full-width">
                  <span className="label">Address:</span>
                  <span className="value">
                    {job.client.address.street && `${job.client.address.street}, `}
                    {job.client.address.city && `${job.client.address.city}, `}
                    {job.client.address.state && `${job.client.address.state} `}
                    {job.client.address.zipCode}
                  </span>
                </div>
              )}
            </div>
          </section>

          <section className="detail-section">
            <h3>Job Details</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="label">Status:</span>
                <span className="value badge">{job.status}</span>
              </div>
              <div className="detail-item">
                <span className="label">Priority:</span>
                <span className="value badge">{job.priority}</span>
              </div>
              <div className="detail-item">
                <span className="label">Scheduled:</span>
                <span className="value">{formatDate(job.scheduledDate)}</span>
              </div>
              <div className="detail-item">
                <span className="label">Due Date:</span>
                <span className="value">{formatDate(job.dueDate)}</span>
              </div>
            </div>
            {job.description && (
              <div className="detail-item full-width">
                <span className="label">Description:</span>
                <p className="value">{job.description}</p>
              </div>
            )}

            {/* Calendar Sync Section */}
            {job.scheduledDate && (
              <div style={{ marginTop: '16px', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiCalendar style={{ color: '#d4af37' }} />
                    <span style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>
                      {job.calendarEventId ? 'Synced to Google Calendar' : 'Sync to Calendar'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {calendarMessage && (
                      <span style={{
                        fontSize: '13px',
                        color: calendarMessage.includes('Failed') || calendarMessage.includes('Please') ? '#dc2626' : '#10b981',
                        fontWeight: '500'
                      }}>
                        {calendarMessage}
                      </span>
                    )}
                    {job.calendarEventId ? (
                      <>
                        <button
                          onClick={syncToCalendar}
                          disabled={syncingCalendar}
                          style={{
                            padding: '6px 12px',
                            background: '#6b7280',
                            border: 'none',
                            borderRadius: '6px',
                            color: 'white',
                            fontSize: '13px',
                            fontWeight: '500',
                            cursor: syncingCalendar ? 'not-allowed' : 'pointer',
                            opacity: syncingCalendar ? 0.7 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <FiCalendar /> {syncingCalendar ? 'Updating...' : 'Update Event'}
                        </button>
                        <button
                          onClick={removeFromCalendar}
                          disabled={syncingCalendar}
                          style={{
                            padding: '6px 12px',
                            background: '#dc2626',
                            border: 'none',
                            borderRadius: '6px',
                            color: 'white',
                            fontSize: '13px',
                            fontWeight: '500',
                            cursor: syncingCalendar ? 'not-allowed' : 'pointer',
                            opacity: syncingCalendar ? 0.7 : 1
                          }}
                        >
                          Remove
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={syncToCalendar}
                        disabled={syncingCalendar}
                        style={{
                          padding: '6px 12px',
                          background: '#d4af37',
                          border: 'none',
                          borderRadius: '6px',
                          color: 'white',
                          fontSize: '13px',
                          fontWeight: '500',
                          cursor: syncingCalendar ? 'not-allowed' : 'pointer',
                          opacity: syncingCalendar ? 0.7 : 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <FiCalendar /> {syncingCalendar ? 'Adding...' : 'Add to Calendar'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="detail-section">
            <h3>Quoted Costs</h3>
            <div className="cost-breakdown">
              <div className="cost-row">
                <span>Labor ({job.costs?.laborHours} hrs @ {formatCurrency(job.costs?.laborRate)}/hr):</span>
                <span>{formatCurrency(job.costs?.laborTotal)}</span>
              </div>
              <div className="cost-row">
                <span>Materials:</span>
                <span>{formatCurrency(job.costs?.materialsTotal)}</span>
              </div>
              <div className="cost-row">
                <span>Equipment:</span>
                <span>{formatCurrency(job.costs?.equipmentTotal)}</span>
              </div>
              <div className="cost-row">
                <span>Permits:</span>
                <span>{formatCurrency(job.costs?.permitsCost)}</span>
              </div>
              <div className="cost-row">
                <span>Subcontractors:</span>
                <span>{formatCurrency(job.costs?.subcontractorsCost)}</span>
              </div>
              <div className="cost-row">
                <span>Other Costs:</span>
                <span>{formatCurrency(job.costs?.otherCosts)}</span>
              </div>
              <div className="cost-row subtotal">
                <span>Subtotal:</span>
                <span>{formatCurrency(job.costs?.subtotal)}</span>
              </div>
              <div className="cost-row">
                <span>Tax ({(job.costs?.taxRate * 100).toFixed(2)}%):</span>
                <span>{formatCurrency(job.costs?.tax)}</span>
              </div>
              <div className="cost-row">
                <span>Discount:</span>
                <span>-{formatCurrency(job.costs?.discount)}</span>
              </div>
              <div className="cost-row total">
                <span>Total:</span>
                <span>{formatCurrency(job.costs?.finalTotal)}</span>
              </div>
              <div className="cost-row">
                <span>Amount Paid:</span>
                <span>{formatCurrency(job.payment?.amountPaid)}</span>
              </div>
              <div className="cost-row balance">
                <span>Balance Due:</span>
                <span>{formatCurrency(job.payment?.balance)}</span>
              </div>
            </div>
          </section>

          {/* Actual Expenses Section */}
          {job.actualExpenses?.finalTotal && job.actualExpenses.finalTotal > 0 ? (
            <section className="detail-section actual-expenses">
              <h3>Actual Expenses</h3>
              <div className="cost-breakdown">
                <div className="cost-row">
                  <span>Labor ({job.actualExpenses.laborHours} hrs @ {formatCurrency(job.actualExpenses.laborRate)}/hr):</span>
                  <span>{formatCurrency(job.actualExpenses.laborTotal)}</span>
                </div>
                <div className="cost-row">
                  <span>Materials:</span>
                  <span>{formatCurrency(job.actualExpenses.materialsTotal)}</span>
                </div>
                <div className="cost-row">
                  <span>Equipment:</span>
                  <span>{formatCurrency(job.actualExpenses.equipmentTotal)}</span>
                </div>
                <div className="cost-row">
                  <span>Permits:</span>
                  <span>{formatCurrency(job.actualExpenses.permitsCost)}</span>
                </div>
                <div className="cost-row">
                  <span>Subcontractors:</span>
                  <span>{formatCurrency(job.actualExpenses.subcontractorsCost)}</span>
                </div>
                <div className="cost-row">
                  <span>Other Costs:</span>
                  <span>{formatCurrency(job.actualExpenses.otherCosts)}</span>
                </div>
                <div className="cost-row subtotal">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(job.actualExpenses.subtotal)}</span>
                </div>
                <div className="cost-row">
                  <span>Tax ({(job.actualExpenses.taxRate * 100).toFixed(2)}%):</span>
                  <span>{formatCurrency(job.actualExpenses.tax)}</span>
                </div>
                <div className="cost-row">
                  <span>Discount:</span>
                  <span>-{formatCurrency(job.actualExpenses.discount)}</span>
                </div>
                <div className="cost-row total">
                  <span>Total Actual:</span>
                  <span>{formatCurrency(job.actualExpenses.finalTotal)}</span>
                </div>
              </div>

              {/* Profit/Loss Card */}
              <div className="profit-summary">
                {(() => {
                  const profit = (job.costs?.finalTotal || 0) - (job.actualExpenses?.finalTotal || 0);
                  const profitClass = profit >= 0 ? 'positive' : 'negative';
                  return (
                    <div className={`profit-card ${profitClass}`}>
                      <span className="label">Profit/Loss:</span>
                      <span className="amount">{formatCurrency(profit)}</span>
                      <span className="percentage">
                        ({profit >= 0 ? '+' : ''}{((profit / (job.costs?.finalTotal || 1)) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  );
                })()}
              </div>

              <div className="expense-meta">
                <small>Entered on {formatDate(job.actualExpenses.enteredAt)} by {job.actualExpenses.enteredBy}</small>
              </div>
            </section>
          ) : job.status === 'completed' && onEnterExpenses ? (
            <section className="detail-section missing-expenses">
              <div className="missing-expenses-notice">
                <FiAlertCircle size={24} color="#f59e0b" />
                <div>
                  <h4>Actual Expenses Not Entered</h4>
                  <p>Enter the actual expenses for this completed job to track profitability.</p>
                </div>
                <button onClick={() => onEnterExpenses(job)} className="btn-primary">
                  Enter Actual Expenses
                </button>
              </div>
            </section>
          ) : null}

          {job.costs?.materials && job.costs.materials.length > 0 && (
            <section className="detail-section">
              <h3>Materials</h3>
              <table className="materials-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {job.costs.materials.map((material, index) => (
                    <tr key={index}>
                      <td>{material.name}</td>
                      <td>{material.quantity}</td>
                      <td>{formatCurrency(material.unitPrice)}</td>
                      <td>{formatCurrency(material.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export default JobDetail;
