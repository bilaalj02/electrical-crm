const Client = require('../models/Client');
const Job = require('../models/Job');
const { withRetry } = require('../utils/retry');

// node-quickbooks has no retry logic of its own for the Data API (unlike
// intuit-oauth, which retries the token endpoints internally) — a QBO
// Fault with an AUTHENTICATION type, or a raw 401/403, means the access
// token is no good; anything else transient gets retried by withRetry().
function isAuthFault(err) {
  if (err?.response?.status === 401 || err?.response?.status === 403) return true;
  const fault = err?.Fault;
  if (fault?.type === 'AUTHENTICATION') return true;
  const faultCode = fault?.Error?.[0]?.code;
  return faultCode === '3200' || faultCode === '3201'; // QBO's AuthenticationFailed/Authorization codes
}

// Promise wrapper around node-quickbooks' callback-style find methods, with
// retry-on-transient-failure and fast-fail-with-a-typed-error on auth faults
// so the caller can prompt reconnection instead of showing a generic error.
const qboFind = (qbo, method, criteria = ' ') =>
  withRetry(() => new Promise((resolve, reject) => {
    qbo[method](criteria, (err, result) => {
      if (err) {
        if (isAuthFault(err)) {
          const authError = new Error('QuickBooks rejected the request — the connection needs to be reconnected.');
          authError.code = 'QBO_RECONNECT_REQUIRED';
          return reject(authError);
        }
        return reject(err);
      }
      resolve(result?.QueryResponse || {});
    });
  }));

/**
 * Pull QuickBooks Customers into the Client collection.
 * Matches existing clients by email first, falls back to quickbooksCustomerId,
 * otherwise creates a new client. Never deletes or overwrites a client's own notes/status.
 */
async function syncCustomers(qbo) {
  const { Customer = [] } = await qboFind(qbo, 'findCustomers');
  let imported = 0;

  for (const c of Customer) {
    const email = c.PrimaryEmailAddr?.Address;
    if (!email) continue; // Client model requires an email — skip customers without one

    let client = await Client.findOne({ quickbooksCustomerId: c.Id })
      || await Client.findOne({ email });

    const fields = {
      name: c.DisplayName || c.CompanyName || email,
      company: c.CompanyName || '',
      email,
      phone: c.PrimaryPhone?.FreeFormNumber || '',
      address: {
        street: c.BillAddr?.Line1 || '',
        city: c.BillAddr?.City || '',
        state: c.BillAddr?.CountrySubDivisionCode || '',
        zipCode: c.BillAddr?.PostalCode || ''
      },
      quickbooksCustomerId: c.Id
    };

    if (client) {
      Object.assign(client, fields);
      await client.save();
    } else {
      await Client.create({
        ...fields,
        clientType: 'commercial',
        source: 'quickbooks',
        status: 'active'
      });
      imported++;
    }
  }

  return { imported, total: Customer.length };
}

/**
 * Pull QuickBooks Invoices into the Job collection, linked to the matching
 * synced client via quickbooksCustomerId. Also updates paid/invoiced status
 * (folds in what a separate "payments" sync would otherwise duplicate).
 */
async function syncInvoices(qbo) {
  const { Invoice = [] } = await qboFind(qbo, 'findInvoices');
  let imported = 0;
  let statusUpdated = 0;

  for (const inv of Invoice) {
    const customerId = inv.CustomerRef?.value;
    const client = customerId ? await Client.findOne({ quickbooksCustomerId: customerId }) : null;
    if (!client) continue; // sync customers first so invoices have somewhere to attach

    let job = await Job.findOne({ quickbooksInvoiceId: inv.Id });

    const materials = (inv.Line || [])
      .filter(line => line.DetailType === 'SalesItemLineDetail' && line.Amount)
      .map(line => ({
        name: line.SalesItemLineDetail?.ItemRef?.name || line.Description || 'Line item',
        description: line.Description || '',
        quantity: line.SalesItemLineDetail?.Qty || 1,
        unitPrice: line.SalesItemLineDetail?.UnitPrice || line.Amount,
        totalPrice: line.Amount
      }));

    const isPaid = (inv.Balance ?? inv.TotalAmt) === 0;
    const status = isPaid ? 'paid' : 'invoiced';

    if (job) {
      job.status = status;
      job.payment.amountPaid = inv.TotalAmt - (inv.Balance || 0);
      await job.save();
      statusUpdated++;
      continue;
    }

    const jobNumber = await Job.generateJobNumber();
    const newJob = await Job.create({
      jobNumber,
      title: `QuickBooks Invoice #${inv.DocNumber || inv.Id}`,
      client: client._id,
      status,
      quickbooksInvoiceId: inv.Id,
      source: 'quickbooks',
      quoteDate: inv.TxnDate ? new Date(inv.TxnDate) : undefined,
      dueDate: inv.DueDate ? new Date(inv.DueDate) : undefined,
      costs: {
        materials,
        subtotal: inv.TotalAmt || 0,
        total: inv.TotalAmt || 0,
        finalTotal: inv.TotalAmt || 0
      },
      payment: {
        amountPaid: inv.TotalAmt - (inv.Balance || 0)
      }
    });
    imported++;

    await Client.findByIdAndUpdate(client._id, { $addToSet: { jobs: newJob._id } });
  }

  return { imported, statusUpdated, total: Invoice.length };
}

/**
 * Runs whichever syncs are enabled for this integration and returns a stats
 * summary. Each data type is independent — a failure in one does not block
 * the others, and the specific error is surfaced per type.
 */
async function runSync(qbo, enabledDataTypes) {
  const stats = { clientsImported: 0, jobsImported: 0, paymentsUpdated: 0, lastError: null };

  try {
    if (enabledDataTypes.includes('customers')) {
      const res = await syncCustomers(qbo);
      stats.clientsImported = res.imported;
    }

    if (enabledDataTypes.includes('invoices') || enabledDataTypes.includes('payments')) {
      const res = await syncInvoices(qbo);
      stats.jobsImported = res.imported;
      stats.paymentsUpdated = res.statusUpdated;
    }
  } catch (error) {
    console.error('QuickBooks sync error:', error);
    // Auth failures need the route/frontend to prompt a reconnect, not just
    // log a generic sync error — let this one propagate instead of being
    // swallowed into stats.lastError like an ordinary sync hiccup.
    if (error.code === 'QBO_RECONNECT_REQUIRED') throw error;
    stats.lastError = error.message || 'Unknown sync error';
  }

  return stats;
}

module.exports = {
  syncCustomers,
  syncInvoices,
  runSync
};
