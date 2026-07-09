const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const Client = require('../models/Client');
const CalendarEvent = require('../models/CalendarEvent');
const { auth } = require('../middleware/auth');

/**
 * GET /api/dashboard
 * Single call returning everything the Home dashboard needs:
 *   - recentJobs (5 most recent by updatedAt)
 *   - recentClients (5 most recent)
 *   - todayScheduled (jobs scheduled for today)
 */
router.get('/', auth, async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [recentJobs, recentClients, todayScheduledJobs, todayManualEvents] = await Promise.all([
      Job.find()
        .sort({ updatedAt: -1 })
        .limit(5)
        .populate('client', 'name companyName')
        .select('jobNumber title status priority scheduledDate updatedAt client'),
      Client.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name companyName email phone createdAt'),
      Job.find({
        scheduledDate: { $gte: startOfDay, $lte: endOfDay },
        status: { $nin: ['cancelled', 'paid'] },
      })
        .sort({ scheduledDate: 1 })
        .limit(10)
        .populate('client', 'name companyName')
        .select('jobNumber title status priority scheduledDate client'),
      CalendarEvent.find({
        userId: req.user._id,
        startDate: { $gte: startOfDay, $lte: endOfDay }
      }).sort({ startDate: 1 }).limit(10),
    ]);

    // Merge jobs and manual events into a unified today schedule, sorted by time
    const todayScheduled = [
      ...todayScheduledJobs.map(j => ({ ...j.toObject(), _type: 'job' })),
      ...todayManualEvents.map(e => ({
        _id: e._id,
        _type: 'event',
        title: e.title,
        description: e.description,
        scheduledDate: e.startDate,
        endDate: e.endDate,
        color: e.color,
        location: e.location,
        allDay: e.allDay,
      }))
    ].sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));

    res.json({
      recentJobs,
      recentClients,
      todayScheduled,
      generatedAt: now.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
