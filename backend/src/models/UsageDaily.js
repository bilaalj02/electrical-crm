const mongoose = require('mongoose');

// One row per (day, feature, label, scope) with a running count. Counts only,
// never content, so it is kept indefinitely: this is what lets us see month
// over month which features Marc actually uses and which he never touches,
// long after the detailed ActivityLog entries (30-day TTL) are gone.
const usageDailySchema = new mongoose.Schema({
  day: { type: String, required: true },         // 'YYYY-MM-DD' (America/Vancouver)
  feature: { type: String, required: true },     // e.g. 'Jobs', 'Emails', 'AI analysis'
  label: { type: String, required: true },       // e.g. 'Created a Job', 'Opened page'
  scope: { type: String, enum: ['client', 'developer', 'system'], required: true },
  count: { type: Number, default: 0 },
  errorCount: { type: Number, default: 0 },      // requests in this bucket that failed (5xx)
}, { timestamps: true });

usageDailySchema.index({ day: 1, feature: 1, label: 1, scope: 1 }, { unique: true });
usageDailySchema.index({ feature: 1, day: -1 });

module.exports = mongoose.model('UsageDaily', usageDailySchema);
