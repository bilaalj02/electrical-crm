const { withRetry } = require('../utils/retry');
const { qboFind, isAuthFault, extractIntuitTid } = require('./quickbooksSync');

// Promise wrapper around node-quickbooks' report methods (reportProfitAndLoss,
// reportCustomerIncome, etc.) — same retry/auth-fault behavior as qboFind()
// in quickbooksSync.js, but reports respond with a `{Header, Columns, Rows}`
// body instead of `{QueryResponse}`, so this unwraps differently.
const qboReport = (qbo, method, options = {}) =>
  withRetry(() => new Promise((resolve, reject) => {
    qbo[method](options, (err, result, res) => {
      if (err) {
        const intuitTid = extractIntuitTid(res);
        if (isAuthFault(err)) {
          const authError = new Error('QuickBooks rejected the request — the connection needs to be reconnected.');
          authError.code = 'QBO_RECONNECT_REQUIRED';
          authError.intuitTid = intuitTid;
          return reject(authError);
        }
        if (err && typeof err === 'object') err.intuitTid = intuitTid;
        return reject(err);
      }
      resolve(result || {});
    });
  }));

function toNumber(value) {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

// Finds the top-level P&L section row for a given group ("Income"/"Expenses")
// by `group` first (the reliable field), falling back to matching the
// section header text in case a QBO account produces a slightly different
// shape than expected.
function findSection(rows, group, headerText) {
  return (rows || []).find((row) => {
    if (row.group === group) return true;
    const label = row?.Header?.ColData?.[0]?.value;
    return label && label.toLowerCase() === headerText.toLowerCase();
  });
}

// Parses a monthly-summarized ProfitAndLoss report into [{month, income, expenses}].
// Defensive throughout: QBO's report JSON nesting is not something we control,
// and a parsing miss should degrade to an empty trend, not break the whole endpoint.
function parseMonthlyTrend(report) {
  try {
    const columns = report?.Columns?.Column || [];
    // First column is the account-name label, last is the "Total" — the months are in between.
    const monthColumns = columns.slice(1, -1);
    const rows = report?.Rows?.Row || [];

    const incomeSection = findSection(rows, 'Income', 'Income');
    const expenseSection = findSection(rows, 'Expenses', 'Expenses');
    const incomeValues = incomeSection?.Summary?.ColData?.slice(1) || [];
    const expenseValues = expenseSection?.Summary?.ColData?.slice(1) || [];

    return monthColumns.map((col, i) => ({
      month: col.ColTitle,
      income: toNumber(incomeValues[i]?.value),
      expenses: toNumber(expenseValues[i]?.value)
    }));
  } catch {
    return [];
  }
}

// Derives paid/open/overdue counts and total outstanding balance from raw
// QuickBooks invoices (reusing the same findInvoices call the sync path uses).
function summarizeInvoices(invoices) {
  const today = new Date();
  const breakdown = { paid: 0, open: 0, overdue: 0 };
  let outstandingTotal = 0;

  for (const inv of invoices) {
    const balance = toNumber(inv.Balance ?? inv.TotalAmt);
    if (balance === 0) {
      breakdown.paid++;
      continue;
    }
    outstandingTotal += balance;
    const dueDate = inv.DueDate ? new Date(inv.DueDate) : null;
    if (dueDate && dueDate < today) {
      breakdown.overdue++;
    } else {
      breakdown.open++;
    }
  }

  return { breakdown, outstandingTotal };
}

// Parses a CustomerIncome report into the top N customers by income.
// Real customer rows are bare {ColData: [...]} with no `type` field at all;
// the report's own grand-total row is shaped differently — {Summary: {...},
// type: 'Section', group: 'GrandTotal'} — with no top-level ColData, so it
// has no customer id and is naturally excluded by filtering on ColData[0].id.
function parseTopCustomers(report, limit = 5) {
  try {
    const rows = (report?.Rows?.Row || []).filter((row) => row.ColData?.[0]?.id);
    return rows
      .map((row) => ({
        name: row.ColData?.[0]?.value || 'Unknown',
        total: toNumber(row.ColData?.[1]?.value)
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);
  } catch {
    return [];
  }
}

function sixMonthRange() {
  const end = new Date();
  const start = new Date(end.getFullYear(), end.getMonth() - 5, 1);
  const toISODate = (d) => d.toISOString().slice(0, 10);
  return { start_date: toISODate(start), end_date: toISODate(end) };
}

// Pulls a live financial snapshot straight from QuickBooks — not from
// whatever's already been synced into Client/Job — for the Analytics page.
async function getFinancialSnapshot(qbo) {
  const range = sixMonthRange();

  const [plReport, invoiceResult, incomeReport] = await Promise.all([
    qboReport(qbo, 'reportProfitAndLoss', { ...range, summarize_column_by: 'Month' }),
    qboFind(qbo, 'findInvoices'),
    qboReport(qbo, 'reportCustomerIncome', range)
  ]);

  const { breakdown, outstandingTotal } = summarizeInvoices(invoiceResult.Invoice || []);

  return {
    monthlyTrend: parseMonthlyTrend(plReport),
    invoiceBreakdown: breakdown,
    outstandingTotal,
    topCustomers: parseTopCustomers(incomeReport)
  };
}

module.exports = { getFinancialSnapshot };
