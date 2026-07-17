const express = require('express');
const router = express.Router();
const fs = require('fs');
const EmailAccount = require('../models/EmailAccount');
const Integration = require('../models/Integration');
const Client = require('../models/Client');
const Job = require('../models/Job');
const { auth, adminOnly } = require('../middleware/auth');
const uploadDocument = require('../config/uploadDocument');
const { extractText, extractCrmDataFromText } = require('../services/documentExtractor');
const { getQBOClient, markNeedsReconnect } = require('../controllers/quickbooksController');
const { runSync } = require('../services/quickbooksSync');
const { getFinancialSnapshot } = require('../services/quickbooksReports');
const { logIntegrationError } = require('../utils/errorLog');
const IntegrationErrorLog = require('../models/IntegrationErrorLog');

router.use(auth, adminOnly);

const AVAILABLE_INTEGRATIONS = [
  {
    provider: 'gmail',
    name: 'Gmail',
    category: 'email',
    description: 'Read, send, and sync email from a Gmail account.'
  },
  {
    provider: 'microsoft',
    name: 'Outlook',
    category: 'email',
    description: 'Read, send, and sync email from a Microsoft/Outlook account.'
  },
  {
    provider: 'quickbooks',
    name: 'QuickBooks',
    category: 'accounting',
    description: 'Sync customers, invoices, and payments with QuickBooks Online.',
    dataTypes: [
      { key: 'customers', label: 'Customers → Clients' },
      { key: 'invoices', label: 'Invoices → Jobs' },
      { key: 'payments', label: 'Payments → Job status' }
    ],
    supportsDocumentUpload: true
  }
];

/**
 * GET /api/integrations
 * List every integration the CRM supports, with real connection status.
 * Gmail/Outlook status comes from EmailAccount (already the source of truth
 * for those — not duplicated). QuickBooks (and future non-email providers)
 * come from the Integration model.
 */
router.get('/', async (req, res) => {
  try {
    const emailAccounts = await EmailAccount.find({ userId: req.user._id, isActive: true });
    const otherIntegrations = await Integration.find({ userId: req.user._id, isActive: true });

    const list = AVAILABLE_INTEGRATIONS.map((def) => {
      if (def.category === 'email') {
        const accounts = emailAccounts.filter((a) => a.provider === def.provider);
        return {
          ...def,
          connected: accounts.length > 0,
          accounts: accounts.map((a) => ({ id: a._id, email: a.email, provider: a.provider, lastSyncedAt: a.lastSyncedAt, syncScope: a.syncScope }))
        };
      }

      const integration = otherIntegrations.find((i) => i.provider === def.provider);
      return {
        ...def,
        connected: !!integration,
        enabledDataTypes: integration?.enabledDataTypes || [],
        lastSyncedAt: integration?.lastSyncedAt || null,
        syncStats: integration?.syncStats || null
      };
    });

    res.json({ integrations: list });
  } catch (error) {
    console.error('Error listing integrations:', error);
    res.status(500).json({ error: 'Failed to load integrations' });
  }
});

/**
 * GET /api/integrations/:provider
 * Detail view for a single integration.
 */
router.get('/:provider', async (req, res) => {
  try {
    const def = AVAILABLE_INTEGRATIONS.find((i) => i.provider === req.params.provider);
    if (!def) return res.status(404).json({ error: 'Unknown integration' });

    if (def.category === 'email') {
      const accounts = await EmailAccount.find({
        userId: req.user._id,
        provider: req.params.provider,
        isActive: true
      });
      return res.json({
        ...def,
        connected: accounts.length > 0,
        accounts: accounts.map((a) => ({ id: a._id, email: a.email, provider: a.provider, lastSyncedAt: a.lastSyncedAt, syncScope: a.syncScope }))
      });
    }

    // Not filtered by isActive here — a record with isActive:false but
    // needsReconnect:true (a token that failed, not a deliberate disconnect)
    // still needs to be found so the UI can show "Reconnect" instead of a
    // plain "Connect" state.
    const integration = await Integration.findOne({
      userId: req.user._id,
      provider: req.params.provider
    });

    res.json({
      ...def,
      connected: integration?.isActive === true,
      needsReconnect: integration?.needsReconnect === true,
      enabledDataTypes: integration?.enabledDataTypes || [],
      lastSyncedAt: integration?.lastSyncedAt || null,
      syncStats: integration?.syncStats || null
    });
  } catch (error) {
    console.error('Error fetching integration detail:', error);
    res.status(500).json({ error: 'Failed to load integration' });
  }
});

/**
 * PATCH /api/integrations/:provider/settings
 * Save which data types are enabled (the checkbox picker).
 */
router.patch('/:provider/settings', async (req, res) => {
  try {
    const { enabledDataTypes } = req.body;
    if (!Array.isArray(enabledDataTypes)) {
      return res.status(400).json({ error: 'enabledDataTypes must be an array' });
    }

    const integration = await Integration.findOne({
      userId: req.user._id,
      provider: req.params.provider
    });

    if (!integration) {
      return res.status(404).json({ error: 'Integration is not connected yet' });
    }

    integration.enabledDataTypes = enabledDataTypes;
    await integration.save();

    res.json({ enabledDataTypes: integration.enabledDataTypes });
  } catch (error) {
    console.error('Error saving integration settings:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

/**
 * POST /api/integrations/:provider/sync
 * Trigger a live sync now, using whichever data types are enabled.
 */
router.post('/:provider/sync', async (req, res) => {
  try {
    if (req.params.provider !== 'quickbooks') {
      return res.status(400).json({ error: 'Live sync is only available for QuickBooks right now' });
    }

    const integration = await Integration.findOne({
      userId: req.user._id,
      provider: 'quickbooks',
      isActive: true
    });

    if (!integration) {
      return res.status(404).json({ error: 'QuickBooks is not connected' });
    }

    if (!integration.enabledDataTypes.length) {
      return res.status(400).json({ error: 'Select at least one data type to sync first' });
    }

    const qbo = await getQBOClient(integration);
    const stats = await runSync(qbo, integration.enabledDataTypes, req.user._id);

    integration.lastSyncedAt = new Date();
    integration.syncStats = stats;
    await integration.save();

    res.json({ message: 'Sync complete', stats });
  } catch (error) {
    if (error.code !== 'QBO_RECONNECT_REQUIRED') {
      // Reconnect-required errors are already logged where they're detected
      // (getQBOClient / runSync) — avoid a duplicate log entry here.
      await logIntegrationError({ userId: req.user._id, provider: 'quickbooks', action: 'sync', error });
    }

    if (error.code === 'QBO_RECONNECT_REQUIRED') {
      // Idempotent — getQBOClient() already marks this on a refresh
      // failure; a mid-sync auth fault detected in quickbooksSync.js
      // hasn't been persisted yet, so make sure it is here too.
      const integration = await Integration.findOne({ userId: req.user._id, provider: 'quickbooks' });
      if (integration && !integration.needsReconnect) {
        await markNeedsReconnect(integration, error.message);
      }
      return res.status(401).json({
        error: 'Your QuickBooks connection has expired. Please reconnect to continue syncing.',
        reconnectRequired: true
      });
    }

    res.status(500).json({ error: error.message || 'Sync failed' });
  }
});

/**
 * GET /api/integrations/:provider/analytics
 * Live financial snapshot pulled directly from QuickBooks (not from
 * whatever's already been synced into Client/Job) — powers the QuickBooks
 * Financials section on the Analytics page.
 */
router.get('/:provider/analytics', async (req, res) => {
  if (req.params.provider !== 'quickbooks') {
    return res.status(400).json({ error: 'Live analytics are only available for QuickBooks right now' });
  }

  try {
    // Not filtered by isActive here — same reasoning as the GET /:provider
    // detail route above: a record with isActive:false but needsReconnect:true
    // (a dead token, not a deliberate disconnect) still needs to be found so
    // the frontend can prompt "Reconnect" instead of a plain "Connect".
    const integration = await Integration.findOne({
      userId: req.user._id,
      provider: 'quickbooks'
    });

    if (!integration || (!integration.isActive && !integration.needsReconnect)) {
      return res.json({ connected: false });
    }

    if (integration.needsReconnect) {
      return res.json({ connected: true, reconnectRequired: true });
    }

    const qbo = await getQBOClient(integration);
    const snapshot = await getFinancialSnapshot(qbo);

    res.json({ connected: true, ...snapshot });
  } catch (error) {
    if (error.code === 'QBO_RECONNECT_REQUIRED') {
      const integration = await Integration.findOne({ userId: req.user._id, provider: 'quickbooks' });
      if (integration && !integration.needsReconnect) {
        await markNeedsReconnect(integration, error.message);
      }
      return res.status(401).json({
        error: 'Your QuickBooks connection has expired. Please reconnect to continue.',
        reconnectRequired: true
      });
    }

    await logIntegrationError({ userId: req.user._id, provider: 'quickbooks', action: 'analytics', error });
    res.status(500).json({ error: error.message || 'Failed to load QuickBooks analytics' });
  }
});

/**
 * DELETE /api/integrations/:provider
 */
router.delete('/:provider', async (req, res) => {
  try {
    const integration = await Integration.findOne({
      userId: req.user._id,
      provider: req.params.provider
    });

    if (!integration) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    integration.isActive = false;
    await integration.save();

    res.json({ message: 'Disconnected successfully' });
  } catch (error) {
    console.error('Error disconnecting integration:', error);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

/**
 * POST /api/integrations/:provider/upload
 * Generic document-upload fallback — extracts and AI-parses a PDF/Word doc,
 * returns a PREVIEW only. Nothing is written to the database here.
 */
router.post('/:provider/upload', uploadDocument.single('document'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const { text, readable } = await extractText(req.file.path, req.file.mimetype);

    if (!readable) {
      return res.status(422).json({
        error: 'This document has no readable text (it may be a scanned image). Try exporting a text-based PDF or a Word document instead.'
      });
    }

    const result = await extractCrmDataFromText(text, req.params.provider);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({ preview: result.data, fileName: req.file.originalname });
  } catch (error) {
    console.error('Error processing uploaded document:', error);
    res.status(500).json({ error: 'Failed to process document: ' + error.message });
  } finally {
    fs.unlink(req.file.path, () => {});
  }
});

/**
 * POST /api/integrations/:provider/confirm
 * Takes the user-approved (ticked) rows from the preview and actually
 * writes them into Client/Job — same model methods the rest of the app uses,
 * so imported data behaves identically to manually-entered data everywhere.
 */
router.post('/:provider/confirm', async (req, res) => {
  try {
    const { clients = [], jobs = [], pricing = [] } = req.body;
    const clientNameToId = {};
    let clientsCreated = 0;
    let jobsCreated = 0;

    for (const c of clients) {
      if (!c.email) continue; // Client requires an email
      let client = await Client.findOne({ email: c.email });
      if (!client) {
        client = await Client.create({
          name: c.name || c.email,
          company: c.company || '',
          email: c.email,
          phone: c.phone || '',
          clientType: 'commercial',
          source: 'document-upload',
          status: 'active'
        });
        clientsCreated++;
      }
      clientNameToId[c.name] = client._id;
    }

    for (const j of jobs) {
      const clientId = clientNameToId[j.clientName];
      if (!clientId) continue; // need a linked client to create a job

      const jobLineItems = pricing
        .filter((p) => p.jobTitle === j.title)
        .map((p) => ({
          name: p.itemName,
          quantity: p.quantity || 1,
          unitPrice: p.unitPrice || 0,
          totalPrice: p.totalPrice || (p.unitPrice || 0) * (p.quantity || 1)
        }));

      const jobNumber = await Job.generateJobNumber();
      const newJob = await Job.create({
        jobNumber,
        title: j.title,
        client: clientId,
        status: j.status || 'quote',
        source: 'document-upload',
        quoteDate: j.date ? new Date(j.date) : undefined,
        costs: {
          materials: jobLineItems,
          subtotal: j.amount || 0,
          total: j.amount || 0,
          finalTotal: j.amount || 0
        }
      });
      jobsCreated++;
      await Client.findByIdAndUpdate(clientId, { $addToSet: { jobs: newJob._id } });
    }

    res.json({
      message: 'Import complete',
      clientsCreated,
      jobsCreated
    });
  } catch (error) {
    console.error('Error confirming document import:', error);
    res.status(500).json({ error: 'Failed to import data: ' + error.message });
  }
});

/**
 * GET /api/integrations/:provider/error-logs
 * Recent error history for troubleshooting — includes intuit_tid where
 * available, which Intuit support uses to trace a request on their end.
 */
router.get('/:provider/error-logs', async (req, res) => {
  try {
    const logs = await IntegrationErrorLog.find({
      userId: req.user._id,
      provider: req.params.provider
    })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ logs });
  } catch (error) {
    console.error('Error fetching integration error logs:', error);
    res.status(500).json({ error: 'Failed to load error logs' });
  }
});

module.exports = router;
