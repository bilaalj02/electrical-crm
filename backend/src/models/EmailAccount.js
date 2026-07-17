const mongoose = require('mongoose');

const emailAccountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true
  },
  provider: {
    type: String,
    enum: ['gmail', 'microsoft', 'imap'],
    required: true
  },
  accessToken: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String,
    required: true
  },
  tokenExpiry: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastSyncedAt: {
    type: Date
  },
  syncToken: {
    type: String
  },
  syncScope: {
    mode: { type: String, enum: ['all', 'selected'], default: 'all' },
    selectedIds: { type: [String], default: [] }, // Microsoft mailFolder IDs
    // Opt-in processing beyond the always-on email+attachment sync — mirrors
    // Integration.enabledDataTypes' shape. Empty by default ("only if the
    // user requests so"). Currently supported key: 'job_client_detection'.
    enabledFeatures: { type: [String], default: [] }
  }
}, {
  timestamps: true
});

// Index for quick lookup
emailAccountSchema.index({ userId: 1, email: 1 });

module.exports = mongoose.model('EmailAccount', emailAccountSchema);
