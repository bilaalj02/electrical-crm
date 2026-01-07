import { FiX, FiEdit, FiTrash2, FiDollarSign, FiCalendar, FiAlertCircle } from 'react-icons/fi';

function JobDetail({ job, onClose, onEdit, onDelete, onEnterExpenses }) {
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
