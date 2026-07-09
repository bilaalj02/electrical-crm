const mongoose = require('mongoose');

const calendarEventSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  location: String,
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  allDay: {
    type: Boolean,
    default: false
  },
  color: {
    type: String,
    default: '#d4af37'
  },
  // If synced to Google/Outlook
  googleEventId: String,
  googleEventLink: String,
  outlookEventId: String,
}, { timestamps: true });

module.exports = mongoose.model('CalendarEvent', calendarEventSchema);
