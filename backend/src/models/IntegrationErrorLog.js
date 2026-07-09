const mongoose = require('mongoose');

// Real, persistent error log for third-party integration failures (currently
// QuickBooks) — distinct from console.error, which vanishes once Railway's
// log retention window passes. Kept queryable/exportable so a support ticket
// can be traced by intuit_tid, which Intuit's own support team uses to look
// up what happened on their end.
const integrationErrorLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  provider: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true // e.g. 'oauth_callback', 'token_refresh', 'sync'
  },
  message: {
    type: String,
    required: true
  },
  detail: {
    type: String,
    default: null
  },
  faultCode: {
    type: String,
    default: null
  },
  intuitTid: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

integrationErrorLogSchema.index({ userId: 1, provider: 1, createdAt: -1 });

module.exports = mongoose.model('IntegrationErrorLog', integrationErrorLogSchema);
