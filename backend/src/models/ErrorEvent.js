const mongoose = require('mongoose');

// Something that went wrong, grouped by kind: the same error on the same
// route/page is one document with a count, not thousands of rows. Holds the
// error message and the top of the stack trace only, never request bodies or
// record content.
const errorEventSchema = new mongoose.Schema({
  fingerprint: { type: String, required: true, unique: true },
  source: { type: String, enum: ['server', 'browser'], required: true },
  message: { type: String, required: true },
  stackTop: { type: String, default: '' },
  where: { type: String, default: '' },          // 'POST /api/jobs/:id' or 'page: emails'
  statusCode: { type: Number, default: null },
  lastUserRole: { type: String, default: null },
  lastWasDeveloper: { type: Boolean, default: false },
  lastBrowser: { type: String, default: '' },
  count: { type: Number, default: 1 },
  firstSeenAt: { type: Date, default: Date.now },
  lastSeenAt: { type: Date, default: Date.now },
  lastAlertedAt: { type: Date, default: null },
  alertsSent: { type: Number, default: 0 },
  resolvedAt: { type: Date, default: null },     // set by a developer; a new occurrence reopens it
}, { timestamps: true });

errorEventSchema.index({ resolvedAt: 1, lastSeenAt: -1 });

module.exports = mongoose.model('ErrorEvent', errorEventSchema);
