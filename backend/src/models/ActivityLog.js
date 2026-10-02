const mongoose = require('mongoose');

// Records WHAT HAPPENED (who, which route, when, success/failure) for
// support and debugging purposes — deliberately never WHAT'S IN anything.
// No request/response bodies, no email or message content, no client
// record content — only enough to reconstruct a sequence of actions after
// the fact if something breaks.
//
// Covers two cases under one schema so the admin view can show a single
// timeline rather than stitching two collections together:
//   category: 'action'        — an authenticated request that completed
//   category: 'login_failure' — a login attempt that did NOT resolve to a
//                                known, active user (wrong password, unknown
//                                email, inactive account)
const activityLogSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['action', 'login_failure'],
    required: true
  },
  // Null for a login_failure entry — by definition there's no resolved user
  // yet at that point.
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Snapshot of role/isDeveloper AT THE TIME, not a live reference — a
  // later role change shouldn't rewrite history, and this lets the admin
  // view filter "developer actions" vs "client actions" without a join.
  userRole: {
    type: String,
    default: null
  },
  isDeveloperAction: {
    type: Boolean,
    default: false
  },
  // Only set on login_failure entries — the email that was TYPED into the
  // login form, not any user's real stored data. Standard security-log
  // practice (lets you spot someone hammering one account or guessing at
  // emails), distinct from the message/email-content exclusion above.
  attemptedEmail: {
    type: String,
    default: null
  },
  // Only set on login_failure entries.
  failureReason: {
    type: String,
    enum: ['unknown_email', 'invalid_password', 'account_inactive', null],
    default: null
  },
  actionLabel: {
    type: String,
    required: true
  },
  method: {
    type: String,
    required: true
  },
  route: {
    type: String,
    required: true
  },
  statusCode: {
    type: Number,
    required: true
  },
  ip: {
    type: String,
    default: null
  },
  // Default 30-day retention via a TTL index below. A document with
  // expiresAt set to null is never auto-deleted ("Keep Forever") until
  // someone removes it by hand — MongoDB's TTL monitor simply skips
  // documents where the indexed field is absent or null.
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  }
}, {
  timestamps: true
});

activityLogSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ category: 1, createdAt: -1 });
activityLogSchema.index({ statusCode: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
