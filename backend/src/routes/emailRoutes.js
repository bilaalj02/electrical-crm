const express = require('express');
const router = express.Router();
const Email = require('../models/Email');
// const emailSyncService = require('../services/emailSyncService'); // Disabled - using new OAuth system

/**
 * GET /api/emails
 * Get all emails with filtering and pagination
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      accountType,
      isWorkRelated,
      isRead,
      search,
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
 * GET /api/emails/:id
 * Get a single email by ID
 */
router.get('/:id', async (req, res) => {
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
router.patch('/:id', async (req, res) => {
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
 * POST /api/emails/sync
 * Trigger email sync for all accounts
 */
router.post('/sync', async (req, res) => {
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
router.post('/sync/:accountType', async (req, res) => {
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
router.get('/stats/summary', async (req, res) => {
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

module.exports = router;
