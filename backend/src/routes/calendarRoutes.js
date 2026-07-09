const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const CalendarEvent = require('../models/CalendarEvent');
const { createJobEvent } = require('../services/googleCalendarService');

// GET /api/calendar-events — list events for the logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const events = await CalendarEvent.find({ userId: req.user._id }).sort({ startDate: 1 });
    res.json({ events });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/calendar-events/today — events scheduled for today
router.get('/today', auth, async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const events = await CalendarEvent.find({
      userId: req.user._id,
      startDate: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ startDate: 1 });
    res.json({ events });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/calendar-events — create a new manual event
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, location, startDate, endDate, allDay, color } = req.body;

    if (!title || !startDate || !endDate) {
      return res.status(400).json({ message: 'title, startDate and endDate are required' });
    }

    const event = new CalendarEvent({
      userId: req.user._id,
      title,
      description,
      location,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      allDay: allDay || false,
      color: color || '#d4af37'
    });

    await event.save();

    // Optionally sync to Google Calendar if user has it connected
    try {
      const { getCalendarClient } = require('../services/googleCalendarService');
      const { google } = require('googleapis');
      const EmailAccount = require('../models/EmailAccount');
      const { decrypt } = require('../controllers/oauthController');

      const account = await EmailAccount.findOne({ userId: req.user._id, provider: 'gmail', isActive: true });
      if (account) {
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.GOOGLE_REDIRECT_URI
        );
        oauth2Client.setCredentials({
          access_token: decrypt(account.accessToken),
          refresh_token: account.refreshToken ? decrypt(account.refreshToken) : undefined,
        });
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        const gEvent = {
          summary: title,
          description: description || '',
          location: location || '',
          start: allDay
            ? { date: new Date(startDate).toISOString().split('T')[0] }
            : { dateTime: new Date(startDate).toISOString(), timeZone: 'America/New_York' },
          end: allDay
            ? { date: new Date(endDate).toISOString().split('T')[0] }
            : { dateTime: new Date(endDate).toISOString(), timeZone: 'America/New_York' },
        };

        const gResponse = await calendar.events.insert({ calendarId: 'primary', requestBody: gEvent });
        event.googleEventId = gResponse.data.id;
        event.googleEventLink = gResponse.data.htmlLink;
        await event.save();
      }
    } catch (syncErr) {
      // Non-fatal — event is saved locally even if Google sync fails
      console.warn('Google Calendar sync skipped:', syncErr.message);
    }

    res.status(201).json({ event });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/calendar-events/:id — update an event
router.put('/:id', auth, async (req, res) => {
  try {
    const event = await CalendarEvent.findOne({ _id: req.params.id, userId: req.user._id });
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const { title, description, location, startDate, endDate, allDay, color } = req.body;
    if (title !== undefined) event.title = title;
    if (description !== undefined) event.description = description;
    if (location !== undefined) event.location = location;
    if (startDate !== undefined) event.startDate = new Date(startDate);
    if (endDate !== undefined) event.endDate = new Date(endDate);
    if (allDay !== undefined) event.allDay = allDay;
    if (color !== undefined) event.color = color;
    await event.save();

    res.json({ event });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/calendar-events/:id — delete an event
router.delete('/:id', auth, async (req, res) => {
  try {
    const event = await CalendarEvent.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json({ message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
