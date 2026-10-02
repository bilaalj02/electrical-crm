const express = require('express');
const router = express.Router();
const ActivityLog = require('../models/ActivityLog');
const { auth, requireDeveloper } = require('../middleware/auth');

// Every route here is developer-only — checked server-side, not just
// hidden in the UI. See requireDeveloper in middleware/auth.js for why
// this is a separate flag from role: 'admin'.
router.use(auth, requireDeveloper);

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// List/filter activity log entries.
// Query params: page, limit, category ('action' | 'login_failure'),
// userId, scope ('developer' | 'client'), onlyErrors ('true'),
// from / to (ISO dates, filters on createdAt).
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      category,
      userId,
      scope,
      onlyErrors,
      from,
      to
    } = req.query;

    const query = {};
    if (category) query.category = category;
    if (userId) query.userId = userId;
    if (scope === 'developer') query.isDeveloperAction = true;
    if (scope === 'client') query.isDeveloperAction = false;
    if (onlyErrors === 'true') query.statusCode = { $gte: 400 };
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    const [entries, count] = await Promise.all([
      ActivityLog.find(query)
        .populate('userId', 'name email role')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean(),
      ActivityLog.countDocuments(query)
    ]);

    res.json({
      entries,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      totalEntries: count
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark one entry to never auto-expire.
router.patch('/:id/keep-forever', async (req, res) => {
  try {
    const entry = await ActivityLog.findByIdAndUpdate(
      req.params.id,
      { expiresAt: null },
      { new: true }
    );
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Undo "keep forever" — resets back to a fresh 30-day expiry from now.
router.patch('/:id/restore-expiry', async (req, res) => {
  try {
    const entry = await ActivityLog.findByIdAndUpdate(
      req.params.id,
      { expiresAt: new Date(Date.now() + THIRTY_DAYS_MS) },
      { new: true }
    );
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk version — e.g. "keep everything from this incident window forever"
// rather than clicking one entry at a time. Takes either explicit ids or
// a from/to date range (at least one required).
router.patch('/bulk/keep-forever', async (req, res) => {
  try {
    const { ids, from, to } = req.body;
    const query = {};
    if (ids?.length) query._id = { $in: ids };
    else if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    } else {
      return res.status(400).json({ error: 'Provide ids or a from/to date range' });
    }

    const result = await ActivityLog.updateMany(query, { expiresAt: null });
    res.json({ matched: result.matchedCount, modified: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Manual delete — the only other way a "keep forever" entry goes away.
router.delete('/:id', async (req, res) => {
  try {
    const entry = await ActivityLog.findByIdAndDelete(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
