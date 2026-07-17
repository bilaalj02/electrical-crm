const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Email = require('../models/Email');
const { auth } = require('../middleware/auth');
// const emailSyncService = require('../services/emailSyncService'); // Disabled - using new OAuth system

/**
 * GET /api/emails
 * Get all emails with filtering and pagination
 */
router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      accountType,
      isWorkRelated,
      isRead,
      search,
      folder,
      folderId,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    // Build filter
    const filter = {};

    // Handle accountType filter by looking up the EmailAccount
    if (accountType) {
      const EmailAccount = require('../models/EmailAccount');
      const accounts = await EmailAccount.find({ provider: accountType });
      if (accounts.length > 0) {
        filter.emailAccountId = { $in: accounts.map(acc => acc._id) };
      } else {
        // No accounts found for this provider, return empty
        return res.json({
          emails: [],
          totalPages: 0,
          currentPage: page,
          total: 0
        });
      }
    }

    // Handle folder filter (inbox/sent based on labels — Gmail's existing,
    // working scheme; left as-is)
    if (folder === 'sent') {
      filter.labels = { $in: ['SENT'] };
    } else if (folder === 'inbox') {
      filter.labels = { $nin: ['SENT'] };
    }

    // Real Outlook folder filter (separate from the Gmail-only folder=
    // param above — Outlook mail now records its real source folder,
    // see folderId/folderName on the Email model)
    if (folderId) {
      filter.folderId = folderId;
    }

    if (isWorkRelated !== undefined) {
      filter.isWorkRelated = isWorkRelated === 'true';
    }

    if (isRead !== undefined) {
      filter.isRead = isRead === 'true';
    }

    if (search) {
      filter.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { 'from.email': { $regex: search, $options: 'i' } },
        { 'from.name': { $regex: search, $options: 'i' } },
        { 'to.email': { $regex: search, $options: 'i' } },
        { 'to.name': { $regex: search, $options: 'i' } },
        { snippet: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with populate
    const emails = await Email.find(filter)
      .populate('emailAccountId', 'email provider')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Transform emails to include accountType for frontend compatibility
    const transformedEmails = emails.map(email => {
      const emailObj = email.toObject();
      emailObj.accountType = email.emailAccountId?.provider || 'unknown';
      return emailObj;
    });

    const count = await Email.countDocuments(filter);

    res.json({
      emails: transformedEmails,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/emails/folders
 * Live folder tree per connected Outlook account, grouped by account.
 * Originally this showed only folders with already-synced email, which
 * meant a brand-new (still-empty) folder was invisible until something had
 * synced from it — not what you want when browsing/picking a folder that
 * was just created. Now reuses the same live Graph walk the sync-scope
 * picker uses (_fetchMicrosoftFolderTree), so a folder shows up the moment
 * it exists in the real mailbox, synced or not. Declared before GET /:id
 * so Express doesn't match "folders" as an :id value (same reasoning as
 * DELETE /bulk above DELETE /:id further down this file).
 */
router.get('/folders', auth, async (req, res) => {
  try {
    const EmailAccount = require('../models/EmailAccount');
    const { getAuthenticatedMicrosoftClient, _fetchMicrosoftFolderTree } = require('../controllers/oauthController');

    // Outlook only — Gmail folder browsing is out of scope, same boundary
    // as the sync-scope picker.
    // Full documents needed here, not just email: getAuthenticatedMicrosoftClient
    // reads accessToken/refreshToken/tokenExpiry and calls account.save() if it
    // has to refresh an expired token.
    const accounts = await EmailAccount.find({ isActive: true, provider: 'microsoft' });

    const result = [];
    for (const account of accounts) {
      try {
        const accessToken = await getAuthenticatedMicrosoftClient(account);
        const tree = await _fetchMicrosoftFolderTree(accessToken);
        result.push({
          accountEmail: account.email,
          folders: tree.map((f) => ({ folderId: f.id, folderName: f.path, depth: f.depth }))
        });
      } catch (error) {
        console.error(`Error fetching live folders for ${account.email}:`, error.message);
        result.push({ accountEmail: account.email, folders: [], error: 'Failed to load folders' });
      }
    }

    res.json({ accounts: result });
  } catch (error) {
    console.error('Error fetching email folders:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/emails/:id
 * Get a single email by ID
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const email = await Email.findById(req.params.id);

    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    res.json(email);
  } catch (error) {
    console.error('Error fetching email:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/emails/:id
 * Update email (mark as read, classify, link to job, etc.)
 */
router.patch('/:id', auth, async (req, res) => {
  try {
    const { isRead, isStarred, isWorkRelated, jobId } = req.body;

    const updateData = {};
    if (isRead !== undefined) updateData.isRead = isRead;
    if (isStarred !== undefined) updateData.isStarred = isStarred;
    if (isWorkRelated !== undefined) updateData.isWorkRelated = isWorkRelated;
    if (jobId !== undefined) updateData.jobId = jobId;

    const email = await Email.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    res.json(email);
  } catch (error) {
    console.error('Error updating email:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/emails/bulk
 * Delete multiple emails at once. Declared before DELETE /:id so Express
 * doesn't match "bulk" as an :id value.
 */
router.delete('/bulk', auth, async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Provide a non-empty array of email ids to delete' });
    }

    const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      return res.status(400).json({ error: 'No valid email ids provided' });
    }

    const result = await Email.deleteMany({ _id: { $in: validIds } });

    res.json({
      success: true,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error bulk deleting emails:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/emails/:id
 * Delete a single email
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const email = await Email.findByIdAndDelete(req.params.id);

    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    res.json({ success: true, message: 'Email deleted successfully' });
  } catch (error) {
    console.error('Error deleting email:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/emails/sync
 * Trigger email sync for all accounts
 */
router.post('/sync', auth, async (req, res) => {
  try {
    // Old sync disabled - use new OAuth system: /api/email-sync/sync/:accountId
    res.status(501).json({
      error: 'Old sync method disabled. Please use the new OAuth system.',
      message: 'Connect your Gmail account through the UI first, then use /api/email-sync/sync/:accountId'
    });
  } catch (error) {
    console.error('Error syncing emails:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/emails/sync/:accountType
 * Trigger email sync for a specific account
 */
router.post('/sync/:accountType', auth, async (req, res) => {
  try {
    // Old sync disabled - use new OAuth system
    res.status(501).json({
      error: 'Old sync method disabled. Please use the new OAuth system.',
      message: 'Connect your Gmail account through the UI first, then use /api/email-sync/sync/:accountId'
    });
  } catch (error) {
    console.error('Error syncing emails:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/emails/stats/summary
 * Get email statistics
 */
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const total = await Email.countDocuments();
    const unread = await Email.countDocuments({ isRead: false });
    const workRelated = await Email.countDocuments({ isWorkRelated: true });
    const notClassified = await Email.countDocuments({ isWorkRelated: null });

    // Get by account with proper population
    const byAccount = await Email.aggregate([
      {
        $lookup: {
          from: 'emailaccounts',
          localField: 'emailAccountId',
          foreignField: '_id',
          as: 'account'
        }
      },
      {
        $unwind: '$account'
      },
      {
        $group: {
          _id: '$account.provider',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      total,
      unread,
      workRelated,
      notClassified,
      byAccount
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/emails/send
 * Send an email through a connected account
 */
router.post('/send', auth, async (req, res) => {
  try {
    const { accountId, to, cc, subject, body } = req.body;

    // Validation
    if (!accountId || !to || !subject || !body) {
      return res.status(400).json({
        error: 'Missing required fields. Please provide accountId, to, subject, and body.'
      });
    }

    // Get the email account
    const EmailAccount = require('../models/EmailAccount');
    const emailAccount = await EmailAccount.findById(accountId);

    if (!emailAccount) {
      return res.status(404).json({ error: 'Email account not found' });
    }

    if (!emailAccount.isActive) {
      return res.status(403).json({ error: 'Email account is not active' });
    }

    // Send email based on provider
    if (emailAccount.provider === 'gmail') {
      await sendGmailEmail(emailAccount, { to, cc, subject, body });
    } else if (emailAccount.provider === 'microsoft') {
      await sendMicrosoftEmail(emailAccount, { to, cc, subject, body });
    } else {
      return res.status(400).json({ error: 'Unsupported email provider' });
    }

    res.json({
      success: true,
      message: 'Email sent successfully',
      from: emailAccount.email
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      error: 'Failed to send email',
      details: error.message
    });
  }
});

// Helper function to send email via Gmail
async function sendGmailEmail(emailAccount, { to, cc, subject, body }) {
  const { google } = require('googleapis');
  const { getAuthenticatedClient } = require('../controllers/oauthController');

  const oauth2Client = await getAuthenticatedClient(emailAccount);
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  // Convert plain text body to HTML if needed
  const htmlBody = body.includes('<') ? body : body.replace(/\n/g, '<br>');

  // Create properly formatted email message with MIME
  const messageParts = [
    `From: ${emailAccount.email}`,
    `To: ${to}`,
    cc ? `Cc: ${cc}` : '',
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    htmlBody
  ];

  const message = messageParts.filter(part => part).join('\r\n');
  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedMessage
    }
  });
}

// Helper function to send email via Microsoft Graph
async function sendMicrosoftEmail(emailAccount, { to, cc, subject, body }) {
  const axios = require('axios');
  const { getAuthenticatedMicrosoftClient } = require('../controllers/oauthController');

  const accessToken = await getAuthenticatedMicrosoftClient(emailAccount);

  // Convert plain text body to HTML if needed
  const htmlBody = body.includes('<') ? body : body.replace(/\n/g, '<br>');

  const message = {
    message: {
      subject: subject,
      body: {
        contentType: 'HTML',
        content: htmlBody
      },
      toRecipients: to.split(',').map(email => ({
        emailAddress: {
          address: email.trim()
        }
      }))
    },
    saveToSentItems: true
  };

  // Add CC recipients if provided
  if (cc) {
    message.message.ccRecipients = cc.split(',').map(email => ({
      emailAddress: {
        address: email.trim()
      }
    }));
  }

  await axios.post(
    'https://graph.microsoft.com/v1.0/me/sendMail',
    message,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );
}

module.exports = router;
