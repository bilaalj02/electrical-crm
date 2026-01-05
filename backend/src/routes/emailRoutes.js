const express = require('express');
const router = express.Router();
const Email = require('../models/Email');
const emailSyncService = require('../services/emailSyncService');

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

    if (accountType) {
      filter.accountType = accountType;
    }

    if (isWorkRelated !== undefined) {
      filter.isWorkRelated = isWorkRelated === 'true';
    }

    if (isRead !== undefined) {
      filter.isRead = isRead === 'true';
    }

    if (search) {
      filter.$text = { $search: search };
    }

    // Execute query
    const emails = await Email.find(filter)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('linkedJob');

    const count = await Email.countDocuments(filter);

    res.json({
      emails,
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
    const email = await Email.findById(req.params.id).populate('linkedJob');

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
    const { isRead, isStarred, isWorkRelated, linkedJob } = req.body;

    const updateData = {};
    if (isRead !== undefined) updateData.isRead = isRead;
    if (isStarred !== undefined) updateData.isStarred = isStarred;
    if (isWorkRelated !== undefined) updateData.isWorkRelated = isWorkRelated;
    if (linkedJob !== undefined) updateData.linkedJob = linkedJob;

    const email = await Email.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('linkedJob');

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
    const results = await emailSyncService.syncAllAccounts();
    res.json({
      message: 'Email sync completed',
      results
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
    const { accountType } = req.params;
    const { maxResults } = req.body;

    const result = await emailSyncService.syncAccount(accountType, maxResults);
    res.json({
      message: `Email sync completed for ${accountType}`,
      result
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

    const byAccount = await Email.aggregate([
      {
        $group: {
          _id: '$accountType',
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
