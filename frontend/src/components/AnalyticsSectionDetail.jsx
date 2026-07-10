import {
  FiArrowLeft, FiDollarSign, FiTrendingUp, FiBriefcase, FiUsers, FiMail, FiLink, FiClock
} from 'react-icons/fi';
import {
  AnimatedNumber, TrendChart, DonutChart, Bar3DChart
} from './AnalyticsCharts';

// Full-detail drill-down for a single Analytics section — reached via "View
// Full Report" on the overview. Reuses the exact chart components and motion
// language already built for the overview (TrendChart/DonutChart/Bar3DChart,
// AnimatedNumber), just at full width with deeper, real breakdowns.
function AnalyticsSectionDetail({ section, data, onBack, onNavigate }) {
  const {
    stats, profitability, avgJobValue, monthlyRevenue, revenueRange, setRevenueRange,
    profitMarginTrend, topClientsByRevenue, jobValueDistribution, formatCurrency,
    qbData, qbLoading, qbIncomeTrend, qbTotalIncome, qbTotalExpenses,
    qbInvoiceSegments, qbTopCustomerRows, qbAgedReceivablesRows,
    statusSegments, completedJobsCount, activeJobsCount, completionPct,
    completionVelocityDays, jobsVelocityTrend,
    clientTypeRows, newClientsPerMonth,
    emailSegments, emailsByAccountRows
  } = data;

  const TITLES = {
    revenue: 'Revenue Analytics',
    quickbooks: 'QuickBooks Financials',
    jobs: 'Jobs Overview',
    clients: 'Client Metrics',
    emails: 'Email Statistics'
  };

  return (
    <div className="a-detail-page">
      <div className="a-detail-breadcrumb">
        <button className="a-detail-back" onClick={onBack}>
          <FiArrowLeft /> Back to Overview
        </button>
        <span className="a-detail-crumb-sep">/</span>
        <span className="a-detail-crumb-current">{TITLES[section]} — Full Report</span>
      </div>

      {section === 'revenue' && (
        <>
          <div className="dashboard-grid">
            <div className="dashboard-card">
              <div className="card-header">
                <div className="card-icon gold"><FiDollarSign /></div>
                <div className="card-title"><h3>Total Revenue</h3><p>All Time</p></div>
              </div>
              <div className="card-value"><AnimatedNumber to={stats.jobs?.totalRevenue || 0} prefix="$" /></div>
            </div>
            <div className="dashboard-card">
              <div className="card-header">
                <div className="card-icon green"><FiTrendingUp /></div>
                <div className="card-title"><h3>Avg Profit Margin</h3><p>From Completed Jobs</p></div>
              </div>
              <div className="card-value"><AnimatedNumber to={profitability.avgProfitMargin} decimals={1} /><span>%</span></div>
            </div>
            <div className="dashboard-card">
              <div className="card-header">
                <div className="card-icon blue"><FiBriefcase /></div>
                <div className="card-title"><h3>Avg Job Value</h3><p>Per Completed Job</p></div>
              </div>
              <div className="card-value"><AnimatedNumber to={avgJobValue} prefix="$" /></div>
            </div>
            <div className="dashboard-card">
              <div className="card-header">
                <div className="card-icon orange"><FiDollarSign /></div>
                <div className="card-title"><h3>Pending Revenue</h3><p>In Progress</p></div>
              </div>
              <div className="card-value"><AnimatedNumber to={stats.jobs?.pendingRevenue || 0} prefix="$" /></div>
            </div>
          </div>

          <div className="a-charts-grid" style={{ marginTop: '1.25rem' }}>
            <TrendChart
              points={monthlyRevenue}
              headerExtra={
                <select className="a-range-select" value={revenueRange} onChange={(e) => setRevenueRange(Number(e.target.value))}>
                  <option value={3}>Last 3 months</option>
                  <option value={6}>Last 6 months</option>
                  <option value={12}>Last 12 months</option>
                  <option value={24}>Last 24 months</option>
                </select>
              }
            />
            <TrendChart points={profitMarginTrend} title="Profit Margin Trend" />
          </div>

          <div className="a-charts-grid-secondary" style={{ marginTop: '1.25rem' }}>
            <Bar3DChart title="Top Clients by Revenue" rows={topClientsByRevenue} />
            <Bar3DChart title="Job Value Distribution" rows={jobValueDistribution} />
          </div>
        </>
      )}

      {section === 'quickbooks' && (
        <>
          {qbLoading ? (
            <p className="hint">Loading live QuickBooks data...</p>
          ) : !qbData?.connected || qbData?.reconnectRequired ? (
            <>
              <p className="hint">
                {qbData?.reconnectRequired
                  ? 'Your QuickBooks connection has expired. Reconnect to see the full financial report.'
                  : 'Connect QuickBooks to see the full financial report.'}
              </p>
              <button className="btn-secondary" onClick={() => onNavigate && onNavigate('integrations')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiLink /> {qbData?.reconnectRequired ? 'Reconnect QuickBooks' : 'Connect QuickBooks'}
              </button>
            </>
          ) : (
            <>
              <div className="dashboard-grid">
                <div className="dashboard-card">
                  <div className="card-header">
                    <div className="card-icon gold"><FiDollarSign /></div>
                    <div className="card-title"><h3>Total Income</h3><p>Last 6 Months</p></div>
                  </div>
                  <div className="card-value"><AnimatedNumber to={qbTotalIncome} prefix="$" /></div>
                </div>
                <div className="dashboard-card">
                  <div className="card-header">
                    <div className="card-icon orange"><FiTrendingUp /></div>
                    <div className="card-title"><h3>Total Expenses</h3><p>Last 6 Months</p></div>
                  </div>
                  <div className="card-value"><AnimatedNumber to={qbTotalExpenses} prefix="$" /></div>
                </div>
                <div className="dashboard-card">
                  <div className="card-header">
                    <div className="card-icon red"><FiDollarSign /></div>
                    <div className="card-title"><h3>Outstanding A/R</h3><p>Unpaid Invoices</p></div>
                  </div>
                  <div className="card-value"><AnimatedNumber to={qbData.outstandingTotal || 0} prefix="$" /></div>
                </div>
              </div>

              <div className="a-charts-grid" style={{ marginTop: '1.25rem' }}>
                {qbIncomeTrend.length > 0 && <TrendChart title="QuickBooks Income Trend" points={qbIncomeTrend} />}
                {qbInvoiceSegments.length > 0 && <DonutChart title="Invoices by Status" segments={qbInvoiceSegments} />}
              </div>

              <div className="a-charts-grid-secondary" style={{ marginTop: '1.25rem' }}>
                {qbTopCustomerRows.length > 0 && <Bar3DChart title="Top 10 Customers" rows={qbTopCustomerRows} maxBars={10} />}
                {qbAgedReceivablesRows.length > 0 && <Bar3DChart title="Aged Receivables" rows={qbAgedReceivablesRows} />}
              </div>
              {qbAgedReceivablesRows.length === 0 && (
                <p className="hint" style={{ marginTop: '1rem' }}>
                  Aged receivables aren't available right now — QuickBooks didn't return that report for this connection.
                </p>
              )}
            </>
          )}
        </>
      )}

      {section === 'jobs' && (
        <>
          <div className="dashboard-grid">
            <div className="dashboard-card">
              <div className="card-header">
                <div className="card-icon gold"><FiBriefcase /></div>
                <div className="card-title"><h3>Total Jobs</h3><p>All Time</p></div>
              </div>
              <div className="card-value"><AnimatedNumber to={stats.jobs?.total || 0} /></div>
            </div>
            <div className="dashboard-card">
              <div className="card-header">
                <div className="card-icon green"><FiTrendingUp /></div>
                <div className="card-title"><h3>Completed</h3><p>{completionPct}% completion rate</p></div>
              </div>
              <div className="card-value"><AnimatedNumber to={completedJobsCount} /></div>
            </div>
            <div className="dashboard-card">
              <div className="card-header">
                <div className="card-icon orange"><FiBriefcase /></div>
                <div className="card-title"><h3>Active</h3><p>Scheduled + In Progress</p></div>
              </div>
              <div className="card-value"><AnimatedNumber to={activeJobsCount} /></div>
            </div>
            <div className="dashboard-card">
              <div className="card-header">
                <div className="card-icon blue"><FiClock /></div>
                <div className="card-title"><h3>Completion Velocity</h3><p>Scheduled → Completed</p></div>
              </div>
              <div className="card-value">
                {completionVelocityDays === null ? '—' : <><AnimatedNumber to={completionVelocityDays} decimals={1} /> days</>}
              </div>
            </div>
          </div>

          <div className="a-charts-grid" style={{ marginTop: '1.25rem' }}>
            <Bar3DChart title="Jobs by Status" rows={statusSegments} />
            <TrendChart
              title="Jobs Created vs. Completed"
              points={jobsVelocityTrend.map((m) => ({ label: m.label, value: m.created }))}
            />
          </div>
        </>
      )}

      {section === 'clients' && (
        <>
          <div className="dashboard-grid">
            <div className="dashboard-card">
              <div className="card-header">
                <div className="card-icon purple"><FiUsers /></div>
                <div className="card-title"><h3>Total Clients</h3><p>Database</p></div>
              </div>
              <div className="card-value"><AnimatedNumber to={stats.clients?.total || 0} /></div>
            </div>
            <div className="dashboard-card">
              <div className="card-header">
                <div className="card-icon green"><FiTrendingUp /></div>
                <div className="card-title"><h3>Active</h3><p>Current Pipeline</p></div>
              </div>
              <div className="card-value"><AnimatedNumber to={stats.clients?.active || 0} /></div>
            </div>
            <div className="dashboard-card">
              <div className="card-header">
                <div className="card-icon orange"><FiUsers /></div>
                <div className="card-title"><h3>Prospects</h3><p>Not Yet Active</p></div>
              </div>
              <div className="card-value"><AnimatedNumber to={stats.clients?.prospects || 0} /></div>
            </div>
          </div>

          <div className="a-charts-grid" style={{ marginTop: '1.25rem' }}>
            <Bar3DChart title="Top Clients by Revenue" rows={topClientsByRevenue} />
            <TrendChart title="New Clients per Month" points={newClientsPerMonth} />
          </div>

          {clientTypeRows.length > 0 && (
            <div style={{ marginTop: '1.25rem' }}>
              <Bar3DChart title="Clients by Type" rows={clientTypeRows} />
            </div>
          )}
        </>
      )}

      {section === 'emails' && (
        <>
          <div className="dashboard-grid">
            <div className="dashboard-card">
              <div className="card-header">
                <div className="card-icon teal"><FiMail /></div>
                <div className="card-title"><h3>Total Emails</h3><p>All Accounts</p></div>
              </div>
              <div className="card-value"><AnimatedNumber to={stats.emails?.total || 0} /></div>
            </div>
            <div className="dashboard-card">
              <div className="card-header">
                <div className="card-icon blue"><FiBriefcase /></div>
                <div className="card-title"><h3>Work Related</h3><p>Business Emails</p></div>
              </div>
              <div className="card-value"><AnimatedNumber to={stats.emails?.workRelated || 0} /></div>
            </div>
            <div className="dashboard-card">
              <div className="card-header">
                <div className="card-icon orange"><FiMail /></div>
                <div className="card-title"><h3>Unread</h3><p>Needs Attention</p></div>
              </div>
              <div className="card-value"><AnimatedNumber to={stats.emails?.unread || 0} /></div>
            </div>
          </div>

          <div className="a-charts-grid-secondary" style={{ marginTop: '1.25rem' }}>
            {emailSegments.length > 0 && <DonutChart title="Classification" segments={emailSegments} />}
            {emailsByAccountRows.length > 0 && <Bar3DChart title="Emails by Account" rows={emailsByAccountRows} />}
          </div>
        </>
      )}
    </div>
  );
}

export default AnalyticsSectionDetail;
