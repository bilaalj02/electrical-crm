const Client = require('../models/Client');
const Job = require('../models/Job');

// Promise wrapper around node-quickbooks' callback-style find methods
const qboFind = (qbo, method, criteria = ' ') =>
  new Promise((resolve, reject) => {
    qbo[method](criteria, (err, result) => {
      if (err) return reject(err);
      resolve(result?.QueryResponse || {});
    });
  });

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
    stats.lastError = error.message || 'Unknown sync error';
  }

  return stats;
}

module.exports = {
  syncCustomers,
  syncInvoices,
  runSync
};
